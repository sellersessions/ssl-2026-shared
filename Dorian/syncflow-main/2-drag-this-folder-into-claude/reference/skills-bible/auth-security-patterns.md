# Authentication & Security Patterns — syncflow Cross-Stack Reference

> **Scope:** Cross-stack security architecture for the syncflow system — credential management, secrets storage, API key rotation, and compliance considerations across SP-API, Supabase, n8n, Vercel, and the Amazon Ads API. This document is not a neutral survey. It describes the patterns syncflow uses in production. When it says "do this," it means it.
> **Stack Context:** SP-API + Amazon Ads API + Supabase + n8n + Vercel (Next.js) + Claude Code
> **Companion Docs:** `amazon-sp-api.md` (LWA auth deep-dive), `supabase.md` (RLS, Vault, schema patterns), `n8n-skill-research.md`, `vercel-nextjs.md`
> **Last Updated:** May 2026

---

## Table of Contents

1. [Threat Model — What You're Actually Defending Against](#1-threat-model--what-youre-actually-defending-against)
2. [SP-API Credential Architecture](#2-sp-api-credential-architecture)
3. [Supabase Vault — The Secrets Source of Truth](#3-supabase-vault--the-secrets-source-of-truth)
4. [n8n Credential Management](#4-n8n-credential-management)
5. [Vercel Environment Variables](#5-vercel-environment-variables)
6. [The Secrets Hierarchy — Canonical Pattern for syncflow](#6-the-secrets-hierarchy--canonical-pattern-for-syncflow)
7. [Supabase RLS as a Security Layer](#7-supabase-rls-as-a-security-layer)
8. [API Key Rotation — Building Rotation In](#8-api-key-rotation--building-rotation-in)
9. [Multi-Account Isolation for Agencies](#9-multi-account-isolation-for-agencies)
10. [Webhook Security — Validating Inbound Webhooks](#10-webhook-security--validating-inbound-webhooks)
11. [Amazon ToS Security Requirements](#11-amazon-tos-security-requirements)
12. [GDPR / CCPA for Amazon Seller Data](#12-gdpr--ccpa-for-amazon-seller-data)
13. [Audit Logging](#13-audit-logging)
14. [Incident Response Playbook](#14-incident-response-playbook)
15. [Dos & Don'ts](#15-dos--donts)

---

## 1. Threat Model — What You're Actually Defending Against

Most developers treat security abstractly: "we should store credentials securely." This doesn't work. Concrete threat modelling — naming what goes wrong, how likely it is, and how bad it is — is what creates actionable, prioritised security work.

Here are the threats that actually matter for an Amazon brand automation stack. For each: what the bad outcome is, how it typically happens, and a rough probability × impact score (Low / Medium / High / Critical) to guide prioritisation.

### 1.1 Threat Matrix

| # | Threat | Bad Outcome | How It Happens | Probability | Impact | Priority |
|---|---|---|---|---|---|---|
| T1 | Leaked SP-API LWA credentials | Amazon account suspension, competitor intelligence access, full order history exfiltration | Hardcoded in git, .env committed, Slack message | Medium | Critical | **P0** |
| T2 | Leaked Amazon Ads API credentials | Campaign budget manipulation, bid sabotage, campaign deletion, spend on fraudulent placements | Same as T1; also leaked via n8n workflow export | Medium | High | **P0** |
| T3 | Leaked Supabase service role key | Full database read/write bypassing all RLS; customer order data breach; GDPR fines up to 4% global revenue | Exposed in browser bundle (NEXT_PUBLIC_ mistake), git commit, workflow JSON | Medium | Critical | **P0** |
| T4 | Leaked n8n API key | Workflow manipulation — inject malicious HTTP calls, steal data on every execution, modify automation logic silently | Exported workflow JSON contains credentials, shared Postman collection | Low | High | **P1** |
| T5 | Leaked Figma access token | IP theft (design system, product imagery, unreleased creative), competitor intelligence | Hardcoded in plugin code, browser extension, local config committed | Low | Medium | **P1** |
| T6 | Supabase database direct connection credentials | Raw SQL access to all data, schema manipulation, data destruction | Direct connection string exposed in logs or error messages | Low | Critical | **P1** |
| T7 | n8n webhook endpoint enumeration | Spoofed inbound webhooks triggering workflows with attacker-controlled data, workflow logic abuse | No HMAC validation on webhook endpoints, public n8n instance | High | High | **P1** |
| T8 | SP-API rate limit abuse by compromised workflow | Amazon triggers account review for programmatic misuse, API access suspended for the seller | Rogue n8n workflow in a loop, competitor-injected data triggering excessive calls | Low | High | **P2** |
| T9 | Insider / ex-employee credential retention | Ex-contractor retains Supabase credentials, exfiltrates seller data months after engagement ends | No offboarding checklist, no credential rotation at team change | Medium | High | **P1** |
| T10 | Client data cross-contamination | Brand A can query Brand B's order data; GDPR violation; client trust destroyed | Missing or incorrect RLS policies; shared n8n credential pointing to wrong project | Medium | Critical | **P0** |
| T11 | Supabase anon key in production logs | Enumerable, allows unauthenticated queries up to RLS policy boundaries | Error logging middleware dumps full headers including Authorization | Medium | Medium | **P2** |
| T12 | LWA refresh token theft via SSRF in Edge Function | Full seller account access via attacker-controlled redirect in Vault proxy function | Edge Function fetches user-supplied URLs without validation | Low | Critical | **P1** |

### 1.2 Risk Prioritisation Summary

**P0 — Fix before shipping anything to production:**
- SP-API credentials in git or hardcoded anywhere (T1)
- Amazon Ads credentials stored insecurely (T2)
- Supabase service role key potentially exposed client-side (T3)
- Client data cross-contamination via RLS gaps (T10)

**P1 — Fix before onboarding second client:**
- No HMAC webhook validation (T7)
- No offboarding credential rotation (T9)
- n8n API key in workflow exports (T4)
- SSRF protection in Edge Functions (T12)

**P2 — Operational hygiene, schedule within 30 days:**
- Rate limit monitoring (T8)
- Anon key in logs (T11)

### 1.3 What Makes Amazon Brand Automation High-Risk Specifically

A standard SaaS app has one set of credentials. syncflow operates across many seller accounts, each with its own LWA refresh token. A single credential leak doesn't just compromise one account — it compromises that seller's entire Amazon business. For their top brand, this can mean:

- **Immediate:** All orders visible to attacker. Pricing strategy exposed. Inventory levels known. Advertising bids visible.
- **48 hours:** Competitor adjusts their bids knowing yours. Flash sale prices copied. Ad campaigns switched off.
- **1 week:** Amazon detects anomalous API activity, opens a programmatic misuse investigation. Seller gets an email asking them to explain the API usage pattern. API access suspended pending review.
- **1 month:** If Amazon determines misuse (e.g. data was shared with a third party in violation of SP-API DPA), app developer registration is revoked. All clients lose API access simultaneously.

That last scenario — cross-client impact from one breach — is why credential isolation per client is non-negotiable.

---

## 2. SP-API Credential Architecture

This section covers the right patterns for managing SP-API credentials at the infrastructure level. For the LWA auth flow mechanics, see `amazon-sp-api.md` Section 5–6.

### 2.1 The Credential Inventory

There are four distinct credential types in the SP-API stack. Knowing exactly what each one is, how long it lives, and what scope of damage its exposure causes determines how you protect it.

| Credential | What It Is | Lifetime | Exposure Impact | Rotation |
|---|---|---|---|---|
| **LWA Client ID** | Identifies your developer app | Permanent (until you delete the app) | Low alone; needed to abuse client secret | Rarely; requires new app registration |
| **LWA Client Secret** | Authenticates your app with Amazon | Permanent (until rotated in Developer Central) | High + Client ID = can mint tokens for any authorised seller | Annually minimum |
| **LWA Refresh Token** | Represents a specific seller's authorisation of your app | ~1 year (Amazon auto-expires) | **Critical** — full access to that seller's SP-API endpoints | On suspected compromise; annually |
| **AWS IAM Credentials** (if using direct IAM user) | Signs SP-API requests using SigV4 | Long-lived unless rotated | High — full SP-API access + any other IAM permissions | 90 days or use STS roles (no rotation needed) |

### 2.2 STS AssumeRole Pattern vs. Direct IAM User — Why Role Assumption Wins

The naive approach: create an IAM user, generate an access key and secret, store them in your app. This works but has serious problems:

- Long-lived credentials: a leaked key provides indefinite access until manually rotated
- No automatic expiry: if the key leaks into a git history, it's valid for months or years
- Harder to audit: one IAM user credential looks the same whether it's your legitimate workflow or an attacker
- Rotation is manual and disruptive: rotating means updating every service that uses the key

The right approach for production: **IAM Role + STS AssumeRole**. Instead of a long-lived access key, your application assumes a role and gets temporary credentials valid for 1–12 hours.

```
Your Application / n8n
    │
    ├─1─► STS AssumeRole (using a minimal IAM user or EC2 instance profile)
    │         RoleArn: arn:aws:iam::123456789:role/syncflow-spapi-role
    │         DurationSeconds: 3600
    │
    │◄─2─ Temporary credentials:
    │         AccessKeyId: ASIAXXX (starts with ASIA — temporary)
    │         SecretAccessKey: yyy
    │         SessionToken: zzz  ← must be sent with every request
    │         Expiration: now + 1 hour
    │
    ├─3─► Sign SP-API requests with temporary credentials + session token
    │
    │◄─4─ SP-API response
```

**Benefits of STS:**
- Credentials auto-expire — leaked creds become useless within 1 hour
- Full CloudTrail audit of every AssumeRole call (who, when, from what IP)
- Role trust policy limits which principals can assume the role
- No long-term keys to rotate — the IAM user only has `sts:AssumeRole` permission on one role

**IAM Role setup for SP-API:**

```json
// Trust policy — who can assume this role
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789:user/syncflow-automation"
    },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {
        "aws:RequestedRegion": "us-east-1"
      }
    }
  }]
}

// Permission policy attached to the role — least privilege
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "execute-api:Invoke"
    ],
    "Resource": "arn:aws:execute-api:us-east-1:*:*"
  }]
}
```

**Implementation in Python (boto3):**

```python
import boto3
from datetime import datetime, timezone
import threading

_credential_cache = {}
_credential_lock = threading.Lock()

def get_sp_api_credentials(role_arn: str) -> dict:
    """Get temporary STS credentials with caching."""
    with _credential_lock:
        cached = _credential_cache.get(role_arn)
        if cached:
            # Refresh 5 minutes before expiry
            expires = cached['Expiration'].replace(tzinfo=timezone.utc)
            remaining = (expires - datetime.now(timezone.utc)).total_seconds()
            if remaining > 300:
                return cached
        
        sts = boto3.client('sts')
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName='syncflow-spapi-session',
            DurationSeconds=3600
        )
        credentials = response['Credentials']
        _credential_cache[role_arn] = credentials
        return credentials
```

### 2.3 Never Committing Credentials to Git

The most common way SP-API credentials leak is git. A developer commits a `.env` file, an inline test, or a config file with real tokens. Even if they delete it in the next commit, the credential remains in git history forever — and git history is frequently public.

**Non-negotiable gitignore entries for any syncflow project:**

```gitignore
# Secrets — never committed
.env
.env.local
.env.*.local
.env.production
.env.staging
*.env

# AWS credentials
.aws/credentials
.aws/config
**/aws-credentials*

# Python virtualenvs that might cache credentials
.venv/
venv/
__pycache__/

# n8n exported workflows that may contain credentials
*.n8n.json
n8n-workflows/
workflow-exports/

# Supabase local config with keys
.supabase/
supabase/.env

# IDE configs that sometimes store tokens
.idea/
*.iml
```

**Install git-secrets to block accidental commits:**

```bash
# macOS
brew install git-secrets

# Set up globally — applies to all new git repos
git secrets --register-aws --global
git secrets --install ~/.git-templates/git-secrets
git config --global init.templateDir ~/.git-templates/git-secrets

# For existing repos
cd your-project
git secrets --install
git secrets --register-aws

# Add custom patterns for Amazon tokens
git secrets --add 'Atzr\|[A-Za-z0-9_-]{200,}'  # LWA refresh token pattern
git secrets --add 'amzn1\.[a-z0-9]+\.[a-z0-9-]+'  # LWA client ID pattern
```

**Go further — add a pre-commit hook to detect secrets broadly:**

```bash
# .git/hooks/pre-commit (make it executable: chmod +x)
#!/bin/bash

# Block patterns that look like secrets
patterns=(
  "client_secret\s*=\s*['\"][^'\"]{10,}"
  "refresh_token\s*=\s*['\"][^'\"]{20,}"
  "service_role_key\s*=\s*['\"][^'\"]{20,}"
  "SUPABASE_SERVICE_ROLE"
  "Atzr\|"
  "amzn1\.app\."
)

for pattern in "${patterns[@]}"; do
  if git diff --cached | grep -qE "$pattern"; then
    echo "⛔ Blocked: potential secret detected matching pattern: $pattern"
    echo "   Remove the secret and use an environment variable instead."
    exit 1
  fi
done

exit 0
```

> ⚠️ **git secrets is the last line of defence, not the first.** The first line of defence is cultural: never put a real credential in source code, even temporarily "for testing." Use environment variables from day one.

### 2.4 LWA Token Refresh Architecture

The refresh token is long-lived (~1 year). The access token is short-lived (1 hour). Your code must cache access tokens correctly and refresh them before expiry. See `amazon-sp-api.md` Section 6 for the full flow.

**Multi-client token cache pattern (one cache entry per seller):**

```python
import time
from dataclasses import dataclass
from typing import Dict, Optional
import requests

@dataclass
class TokenCacheEntry:
    access_token: str
    expires_at: float  # Unix timestamp

class LWATokenManager:
    """Thread-safe token manager for multiple seller accounts."""
    
    def __init__(self, client_id: str, client_secret: str):
        self._client_id = client_id
        self._client_secret = client_secret
        self._cache: Dict[str, TokenCacheEntry] = {}
    
    def get_access_token(self, refresh_token: str) -> str:
        """Get a valid access token, refreshing if necessary."""
        cached = self._cache.get(refresh_token)
        
        # Treat token as expired 5 minutes early (clock skew buffer)
        if cached and cached.expires_at > (time.time() + 300):
            return cached.access_token
        
        # Fetch new token
        response = requests.post(
            'https://api.amazon.com/auth/o2/token',
            data={
                'grant_type': 'refresh_token',
                'client_id': self._client_id,
                'client_secret': self._client_secret,
                'refresh_token': refresh_token,
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        entry = TokenCacheEntry(
            access_token=data['access_token'],
            expires_at=time.time() + data['expires_in']
        )
        self._cache[refresh_token] = entry
        return entry.access_token
    
    def invalidate(self, refresh_token: str):
        """Force token refresh on next request (e.g., after 401 response)."""
        self._cache.pop(refresh_token, None)
```

### 2.5 Multi-Account Credential Isolation

**Rule:** One LWA developer app per client organisation. Never share an app between clients.

Here's why this is architecturally non-negotiable:

- An LWA app has one client secret. If that secret leaks, every client authorised through that app is compromised simultaneously.
- Amazon's developer agreement ties API access to your developer account. If Amazon suspends your app (for a ToS violation by one client's workflow), all clients authorised through that app lose access.
- Amazon's data access policies require you to implement access controls separating client data. A single app servicing all clients blurs that boundary in Amazon's eyes.

**Per-client app structure:**

```
syncflow Developer Central
├── App: syncflow-internal           → Your own seller accounts only
├── App: syncflow-client-brand-a     → Brand A's seller account
├── App: syncflow-client-brand-b     → Brand B's seller account
└── App: syncflow-client-brand-c     → Brand C's seller account
```

Each app has its own Client ID, Client Secret, and generates a separate Refresh Token for each seller account it's authorised with. These are stored in Supabase Vault under namespaced keys (see Section 3).

---

## 3. Supabase Vault — The Secrets Source of Truth

### 3.1 What Vault Is

Supabase Vault is an encrypted key-value store built into your Supabase project using the `pgsodium` extension. Secrets stored in Vault are:

- **Encrypted at rest** using an internal key that never leaves the database server
- **Accessible only via service role** — the anon key cannot read `vault.decrypted_secrets`
- **Queryable like any other table** — which makes them easy to use from Edge Functions, SQL functions, and pg_net triggers
- **Auditable** — the `vault.secrets` table has `created_at` and `updated_at` timestamps

This is not the same as Supabase's environment variables for Edge Functions (`supabase secrets set`). Those are process-level env vars injected at function startup. Vault is a database-level store — queryable at any time by any service with service-role access.

**When to use Vault vs. Edge Function env vars:**

| Use Vault for | Use Edge Function env vars for |
|---|---|
| Per-client SP-API refresh tokens | The Vault encryption key passphrase itself |
| Per-client LWA client secrets | Edge Function-specific API keys (e.g. OpenAI key) |
| Third-party SaaS tokens (SellerApp, Figma, etc.) | Static config values needed at cold start |
| n8n API key (so n8n can be provisioned via Vault) | Database connection URL |
| Shared webhook signing secrets | |

### 3.2 Storing SP-API Credentials in Vault

**Naming convention for Vault secrets — use a consistent namespace:**

```
sp_api:<seller_account_id>:refresh_token
sp_api:<seller_account_id>:client_id
sp_api:<seller_account_id>:client_secret
ads_api:<seller_account_id>:refresh_token
ads_api:<seller_account_id>:client_id
ads_api:<seller_account_id>:profile_id
webhook:<service>:<seller_account_id>:signing_secret
n8n:api_key
figma:<brand_id>:access_token
```

**Storing secrets:**

```sql
-- SP-API refresh token for a specific seller
SELECT vault.create_secret(
  'sp_api:seller_abc123:refresh_token',
  'Atzr|IwEBIKmexample-refresh-token-here',
  'SP-API LWA refresh token for Brand A (seller ID abc123)'
);

-- LWA client credentials (shared across seller accounts using the same app)
SELECT vault.create_secret(
  'sp_api:brandapp_001:client_id',
  'amzn1.application-oa2-client.abcdef123456',
  'LWA Client ID for Brand A developer app'
);

SELECT vault.create_secret(
  'sp_api:brandapp_001:client_secret',
  'your-lwa-client-secret-here',
  'LWA Client Secret for Brand A developer app'
);
```

**Retrieving a secret in a Supabase Edge Function:**

```typescript
// supabase/functions/sp-api-call/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Edge Functions get this automatically
)

async function getSecret(name: string): Promise<string> {
  const { data, error } = await supabase
    .from('vault.decrypted_secrets')  // Note: this view requires service role
    .select('decrypted_secret')
    .eq('name', name)
    .single()
  
  if (error || !data) {
    throw new Error(`Secret not found: ${name}`)
  }
  return data.decrypted_secret
}

// Usage
const refreshToken = await getSecret('sp_api:seller_abc123:refresh_token')
const clientId = await getSecret('sp_api:brandapp_001:client_id')
```

> ⚠️ **Important:** `vault.decrypted_secrets` is a view that decrypts secrets on read. It is only accessible to the service role. If you accidentally use the anon key with this view, you will get an empty result set (not an error — this is by design). Don't confuse empty results for "secret not found" without checking the key you're using.

### 3.3 Vault as a Secrets Proxy for n8n

n8n cannot query Supabase Vault directly with appropriate permissions (you'd need to give n8n the service role key, which is correct, but then n8n has full DB access). The better pattern is a thin Vault proxy Edge Function that n8n calls to retrieve a named secret.

```typescript
// supabase/functions/get-secret/index.ts
// IMPORTANT: This function must validate the caller — never make it public

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FUNCTION_API_KEY = Deno.env.get('FUNCTION_API_KEY')!  // Shared secret between n8n and this function

Deno.serve(async (req) => {
  // Validate caller
  const authHeader = req.headers.get('x-function-key')
  if (authHeader !== FUNCTION_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { secret_name } = await req.json()
  
  // Allowlist what can be requested — never allow arbitrary secret retrieval
  const ALLOWED_SECRETS = [
    'sp_api:seller_abc123:refresh_token',
    'ads_api:seller_abc123:refresh_token',
    // Add explicitly — do NOT allow wildcard retrieval
  ]
  
  if (!ALLOWED_SECRETS.includes(secret_name)) {
    return new Response(JSON.stringify({ error: 'Secret not in allowlist' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data, error } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', secret_name)
    .single()
  
  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Secret not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(
    JSON.stringify({ value: data.decrypted_secret }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**n8n workflow pattern using the Vault proxy:**

```
[Start / Webhook]
    │
    ▼
[HTTP Request: GET https://<project>.supabase.co/functions/v1/get-secret]
Headers: x-function-key: {{ $env.VAULT_FUNCTION_KEY }}
Body: { "secret_name": "sp_api:seller_abc123:refresh_token" }
    │
    ▼
[Set: refreshToken = {{ $json.value }}]
    │
    ▼
[Continue with SP-API calls using refreshToken]
```

The `VAULT_FUNCTION_KEY` itself is stored in n8n as an encrypted credential — not hardcoded in the workflow. This way, the only long-lived credential n8n holds is the proxy function key, which has limited blast radius (it can only retrieve allowlisted secrets, not full DB access).

### 3.4 Updating and Rotating Vault Secrets

```sql
-- Update an existing secret (safe — creates a new encrypted value in place)
UPDATE vault.secrets
SET secret = 'new-refresh-token-value',
    updated_at = now()
WHERE name = 'sp_api:seller_abc123:refresh_token';

-- Or using the vault helper function
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'sp_api:seller_abc123:refresh_token'),
  'new-refresh-token-value'
);

-- Verify it was updated
SELECT name, created_at, updated_at 
FROM vault.secrets 
WHERE name = 'sp_api:seller_abc123:refresh_token';
-- Note: never SELECT decrypted_secret in a rotation script you might log
```

---

## 4. n8n Credential Management

### 4.1 Built-In Encrypted Credential Store

n8n has a built-in credential store that encrypts credentials at rest using AES-256. The encryption key is set via the `N8N_ENCRYPTION_KEY` environment variable on startup. If you lose this key, you lose access to all stored credentials — there is no recovery.

**Critical rules:**
- Set `N8N_ENCRYPTION_KEY` to a random 32+ character string before creating any credentials
- Store this key in Supabase Vault (not in your `.env` committed to git)
- Back up this key separately from n8n itself — a database backup without the key is useless

```bash
# Generate a strong encryption key
openssl rand -hex 32
# → e.g., 8f3a2c1b9d7e6f4a0c8b2d1e9f3a7c5b...

# Set in n8n startup (docker-compose.yml)
environment:
  N8N_ENCRYPTION_KEY: "${N8N_ENCRYPTION_KEY}"  # From .env, never hardcoded
```

### 4.2 Credential Storage Architecture

n8n's built-in store uses three layers:

1. **Database encryption:** Credentials are stored in the n8n SQLite or Postgres database, encrypted with AES-256 using the `N8N_ENCRYPTION_KEY`
2. **At-rest encryption:** If you're running on a cloud VPS, encrypt the volume (managed cloud services typically handle this)
3. **Transport encryption:** n8n API calls use HTTPS; n8n's database connection should use SSL

**For self-hosted n8n with Postgres backend (recommended over SQLite for production):**

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      # Database
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: your-db-host
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n_user
      DB_POSTGRESDB_PASSWORD: "${N8N_DB_PASSWORD}"
      DB_POSTGRESDB_SSL_ENABLED: "true"
      # Encryption
      N8N_ENCRYPTION_KEY: "${N8N_ENCRYPTION_KEY}"
      # Never expose the API publicly without auth
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: "${N8N_BASIC_AUTH_USER}"
      N8N_BASIC_AUTH_PASSWORD: "${N8N_BASIC_AUTH_PASSWORD}"
```

### 4.3 Environment Variable Injection

For secrets that change frequently (or that you want to rotate without touching n8n's credential UI), inject them as environment variables at container startup. n8n workflows can access env vars via `$env.VARIABLE_NAME` in expression nodes.

```bash
# In n8n env vars — loaded from Vault at container startup via init script
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Set once at startup, not hardcoded
SP_API_LWA_CLIENT_SECRET=...
VAULT_FUNCTION_KEY=...
```

**Init script pattern — load from Vault at container startup:**

```bash
#!/bin/bash
# init-n8n.sh — run before starting n8n container
# Fetches secrets from Supabase Vault and writes them to a runtime .env

SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="$BOOTSTRAP_SERVICE_KEY"  # One minimal key for init only

fetch_secret() {
  local name=$1
  curl -sf \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    "$SUPABASE_URL/rest/v1/rpc/get_secret?name=$name" \
    | jq -r '.value'
}

# Write to runtime env file (not committed, in-memory volume)
cat > /run/secrets/n8n.env << EOF
N8N_ENCRYPTION_KEY=$(fetch_secret 'n8n:encryption_key')
SUPABASE_SERVICE_ROLE_KEY=$(fetch_secret 'n8n:supabase_service_key')
SP_API_LWA_CLIENT_SECRET=$(fetch_secret 'sp_api:brandapp_001:client_secret')
EOF

# Start n8n with the env file
exec env $(cat /run/secrets/n8n.env | xargs) n8n start
```

### 4.4 Never Putting Credentials in Workflow JSON

n8n lets you export workflows as JSON. This is useful for version control. It is dangerous if credentials are embedded in workflow nodes rather than stored as named credentials.

**Bad pattern (credentials in node config):**
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.amazon.com/...",
    "headers": {
      "x-api-key": "actual-api-key-here"  // ← This exports with the workflow JSON
    }
  }
}
```

**Good pattern (using n8n credential reference):**
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.amazon.com/..."
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "1",
      "name": "Amazon SP-API Headers"  // ← References a named credential; key is NOT in the export
    }
  }
}
```

Workflow JSON exports with credential references are safe to commit to git. Workflow JSON with inline credentials is not. Review every exported workflow before committing.

### 4.5 Credential Sharing Between Workflows

In n8n's team/self-hosted setup, credentials can be shared between all workflows in an instance. This is convenient but creates blast-radius risk: a bug in one workflow that logs credential values affects all other workflows using that credential.

**Recommended approach:**
- Create named credentials per integration (e.g., "SP-API Seller A", "SP-API Seller B" — not one shared "Amazon" credential)
- Use credential scoping if your n8n version supports it
- Document which workflows use which credentials — a simple table in your project ClickUp is enough

---

## 5. Vercel Environment Variables

### 5.1 The Three Sources of Truth

Vercel/Next.js apps deal with three environments: local development, preview deployments, and production. Each needs separate credentials. Never share production credentials with lower environments.

| Source | Environment | Committed to Git? | Contains |
|---|---|---|---|
| `.env.local` | Local dev only | **Never** | Full credentials for dev Supabase project |
| Vercel project env (Preview) | PR previews, staging | No (stored in Vercel) | Staging Supabase credentials, test API keys |
| Vercel project env (Production) | `main` branch deploys | No (stored in Vercel) | Production Supabase credentials, live API keys |

**Syncing local with Vercel:**

```bash
# Pull Vercel preview env vars to local .env.local
vercel env pull .env.local --environment=preview

# Pull production (use with care — avoid pulling prod keys to dev machines)
vercel env pull .env.local --environment=production
```

### 5.2 The NEXT_PUBLIC_ Problem

Next.js embeds any variable prefixed with `NEXT_PUBLIC_` into the browser bundle. This means the value is:
- Visible in the browser DevTools (Application → Local Storage)
- Visible in the compiled JS bundles (anyone can download and inspect them)
- Visible to every user's browser

**What this means for syncflow:**

| Variable | NEXT_PUBLIC_? | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ OK | Public URL, no secrets |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ OK | Designed to be public; RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Never | Full DB access bypassing RLS |
| `SP_API_LWA_CLIENT_SECRET` | ❌ Never | Would let anyone mint SP-API tokens for your app |
| `SP_API_LWA_REFRESH_TOKEN` | ❌ Never | Full seller account access |
| `N8N_API_KEY` | ❌ Never | Full workflow manipulation access |
| `FIGMA_ACCESS_TOKEN` | ❌ Never | Full Figma account access |

If it's sensitive, it has no `NEXT_PUBLIC_` prefix. It lives only in server-side code (`/app/api/*`, `getServerSideProps`, Server Components, Route Handlers).

### 5.3 Preview vs. Production Separation

Use separate Supabase projects for preview and production. Do not point preview deployments at the production database.

```bash
# Vercel environment variable setup — using Vercel CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# → Paste production key, press Enter

vercel env add SUPABASE_SERVICE_ROLE_KEY preview
# → Paste STAGING key (different project!), press Enter
```

**Why separate projects matter:**
- A bug in a preview deployment that corrupts data only damages the staging database
- Staging Supabase projects can be wiped and reset without affecting production
- You can test migrations on staging before running them on production
- Preview deployments are accessible to team members — you don't want them querying live seller data

### 5.4 Accessing Secrets Server-Side in Next.js

```typescript
// app/api/sp-api-proxy/route.ts
// Server-side only — this file is never bundled for the browser

import { createClient } from '@supabase/supabase-js'

// These env vars are server-only (no NEXT_PUBLIC_ prefix)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Never NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request: Request) {
  // Authenticate the request first (Supabase Auth, API key, etc.)
  // Then fetch the secret
  const { data } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', 'sp_api:seller_abc123:refresh_token')
    .single()
  
  // Use the token, never return it to the client
  const token = data?.decrypted_secret
  // ...make SP-API call, return result (not the token)
}
```

---

## 6. The Secrets Hierarchy — Canonical Pattern for syncflow

This section defines where every secret lives, how it flows, and what the rules are. When in doubt about where a secret should go, this is the reference.

### 6.1 The Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│              Supabase Vault (Source of Truth)           │
│  All shared secrets, all client credentials             │
│  Encrypted at rest, accessible via service role only    │
└───────────────────┬─────────────────────────────────────┘
                    │  Proxy Edge Function
          ┌─────────┼─────────────────────┐
          │         │                     │
          ▼         ▼                     ▼
    ┌──────────┐  ┌──────────┐     ┌───────────────┐
    │   n8n    │  │  Vercel  │     │  Claude Code  │
    │ workflow │  │ API route│     │  local dev    │
    │ retrieves│  │ retrieves│     │  reads from   │
    │ at start │  │ at req   │     │  .env.local   │
    └──────────┘  └──────────┘     └───────────────┘
```

**Rules of the hierarchy:**

1. **Supabase Vault is authoritative.** Every secret must exist in Vault. No secret exists in only one downstream system.
2. **Downstream systems cache, not own.** n8n credential store caches secrets retrieved from Vault. Vercel env vars cache non-sensitive config. Local `.env.local` is a dev convenience.
3. **No secret exists in more than one place permanently.** When you rotate a secret, you update Vault first, then downstream systems. The old value in downstream systems becomes stale and should be updated or evicted.
4. **Local `.env.local` contains dev/sandbox credentials only.** Never copy production Vault secrets to `.env.local`.

### 6.2 Secret Flow at Runtime

**n8n workflow startup:**
```
n8n container starts
  → init script fetches encryption key from Vault (via bootstrap key)
  → n8n starts with encryption key
  → Workflow runs → calls Vault proxy function → gets SP-API token
  → SP-API calls proceed with retrieved token
```

**Vercel API route at request time:**
```
HTTP request arrives at /api/sp-api-proxy
  → Route Handler authenticates caller (Supabase Auth JWT)
  → Server-side code reads SUPABASE_SERVICE_ROLE_KEY from process.env
  → Queries vault.decrypted_secrets for the seller's refresh token
  → Makes SP-API call, returns result (not the token)
```

**Claude Code / local development:**
```
Developer runs code locally
  → Code reads from .env.local (gitignored)
  → .env.local contains dev Supabase project credentials only
  → Production Vault is never accessed from local machines
```

### 6.3 What Goes Where — Quick Reference

| Secret | Vault | n8n Credential Store | Vercel Env | .env.local |
|---|---|---|---|---|
| SP-API refresh token (per seller) | ✅ Source | Cache via proxy | ❌ Never | ❌ Never |
| SP-API LWA client secret | ✅ Source | Cache via proxy | ❌ Never | ❌ Never |
| Supabase service role key (prod) | ✅ Source | ✅ Yes | ✅ Production only | ❌ Never |
| Supabase service role key (dev) | ✅ Store here too | ✅ Dev credential | ✅ Preview env | ✅ Dev only |
| Supabase anon key | Unnecessary | ✅ Yes | ✅ NEXT_PUBLIC_ OK | ✅ OK |
| n8n API key | ✅ Source | N/A (it's n8n's own key) | ✅ Server-side only | ✅ Dev only |
| Figma access token | ✅ Source | ✅ Via proxy | ❌ Never | ❌ Never |
| OpenAI / Anthropic API key | ✅ Source | ✅ Yes | ✅ Server-side only | ✅ Dev only |
| n8n encryption key | ✅ Source | N/A | ❌ Never | ❌ Never |

---

## 7. Supabase RLS as a Security Layer

### 7.1 Service Role vs. Anon Key — The Decision That Matters Most

Supabase issues two main keys per project:

| Key | Who Uses It | RLS Applies? | Damage if Leaked |
|---|---|---|---|
| **Anon key** (`anon`) | Browser clients, public-facing Next.js, unauthenticated requests | ✅ Yes — RLS enforced | Limited to what RLS policies allow for unauthenticated users |
| **Service role key** | n8n, Edge Functions, server-side only | ❌ No — RLS bypassed | **Full DB read/write for all tables, all rows** |

The service role key is root access to your database. Treat it like a root password on a production server — it should exist in as few places as possible, be rotated when personnel change, and never be visible to browser clients.

**NEVER do this:**
```typescript
// ❌ This exposes service role key to browsers
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!  // ← Ruins your day
)
```

**Always do this instead:**
```typescript
// ✅ Server-side only — SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix
// This code only runs on the server (Route Handler, Server Component, getServerSideProps)
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// For client components, use the anon key with Supabase Auth
const browserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← Public, subject to RLS
)
```

### 7.2 RLS Policies for Multi-Brand Setups

For syncflow's multi-client architecture, every business data table must include a `seller_account_id` (or `brand_id`) column, and RLS policies enforce that users can only see rows belonging to their account.

```sql
-- Core pattern: seller_accounts table drives access
CREATE TABLE seller_accounts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name text NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

-- Every business table has a foreign key to seller_accounts
CREATE TABLE orders (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_account_id uuid REFERENCES seller_accounts(id) NOT NULL,
  amazon_order_id   text NOT NULL,
  -- ... other columns
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- Supabase Auth users are mapped to seller accounts
CREATE TABLE user_seller_accounts (
  user_id           uuid REFERENCES auth.users(id) NOT NULL,
  seller_account_id uuid REFERENCES seller_accounts(id) NOT NULL,
  role              text NOT NULL DEFAULT 'viewer',  -- 'viewer', 'editor', 'admin'
  PRIMARY KEY (user_id, seller_account_id)
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see orders for their own seller accounts
CREATE POLICY "Users see own seller account orders"
  ON orders
  FOR SELECT
  USING (
    seller_account_id IN (
      SELECT seller_account_id 
      FROM user_seller_accounts 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: same restriction for insert/update
CREATE POLICY "Users insert own seller account orders"
  ON orders
  FOR INSERT
  WITH CHECK (
    seller_account_id IN (
      SELECT seller_account_id 
      FROM user_seller_accounts 
      WHERE user_id = auth.uid()
    )
  );
```

### 7.3 Testing RLS Policies Before Shipping

RLS policy bugs are silent and catastrophic — a missing policy doesn't throw an error, it just returns empty data (or too much data). Always test policies with explicit role simulation before merging schema changes.

```sql
-- Test RLS as a specific user (simulates what auth.uid() returns)
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here", "role": "authenticated"}';

-- Now run queries — should only see data for that user's accounts
SELECT COUNT(*) FROM orders;  -- Should return only their orders, not all orders

-- Reset to superuser
RESET role;
RESET "request.jwt.claims";
```

**Automated RLS test pattern (using pgTAP or a test script):**

```sql
-- Test that User A cannot see User B's orders
BEGIN;

-- Set up test data
INSERT INTO seller_accounts (id, account_name) VALUES 
  ('aaaa-...', 'Brand A'),
  ('bbbb-...', 'Brand B');

INSERT INTO auth.users (id, email) VALUES 
  ('user-a-uuid', 'a@example.com'),
  ('user-b-uuid', 'b@example.com');

INSERT INTO user_seller_accounts (user_id, seller_account_id) VALUES
  ('user-a-uuid', 'aaaa-...'),
  ('user-b-uuid', 'bbbb-...');

INSERT INTO orders (seller_account_id, amazon_order_id) VALUES
  ('aaaa-...', 'ORDER-A-001'),
  ('bbbb-...', 'ORDER-B-001');

-- Simulate user A
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-a-uuid", "role": "authenticated"}';

-- Should return only ORDER-A-001
SELECT amazon_order_id FROM orders;
-- If this returns ORDER-B-001, your RLS policy is broken

ROLLBACK;
```

### 7.4 Common RLS Gotchas

**Gotcha 1: RLS on a table doesn't protect joined tables.** If you have an RLS policy on `orders` but not on `order_items`, a direct query on `order_items` ignores the orders policy. Enable RLS on every table independently.

**Gotcha 2: Functions with `SECURITY DEFINER` bypass RLS.** A function marked `SECURITY DEFINER` runs with the privileges of the function's owner (often the Postgres superuser), not the calling user. All audit triggers and helper functions that touch business tables should use `SECURITY INVOKER` unless you explicitly need the elevation.

**Gotcha 3: RLS doesn't apply to the Supabase dashboard.** When you browse tables in the Supabase Studio UI, you're using the service role. Your data looks fine in Studio. It may still be invisible to authenticated users if your RLS policies are wrong. Always test via the client, not Studio.

**Gotcha 4: New tables have RLS disabled by default.** If you `CREATE TABLE new_table ...` and forget to `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY`, it's accessible to all authenticated users with no restrictions. Build `ENABLE ROW LEVEL SECURITY` into every migration template.

---

## 8. API Key Rotation — Building Rotation In

Security that requires manual rotation tends not to get rotated. The goal is rotation that can be executed under stress (e.g. at 11pm when you suspect a leak) and verified quickly.

### 8.1 SP-API LWA Refresh Token Rotation

The LWA refresh token represents the seller's explicit authorisation of your app. It cannot be rotated in the traditional sense — the seller must re-authorise the app, which generates a new token.

**Rotation triggers:**
- Developer offboarding (ex-employee had access to Vault)
- Suspected credential leak (git exposure, Slack message)
- Annual rotation as security hygiene
- Amazon emails you about suspicious API activity

**Rotation process (private app / self-authorised):**

1. In Seller Central → Apps & Services → Develop Apps → your app
2. Find the active authorization for the seller account
3. Click **Re-authorize** (this generates a new refresh token; the old one becomes invalid immediately)
4. Copy the new refresh token
5. Update Vault: `UPDATE vault.secrets SET secret = '<new-token>' WHERE name = 'sp_api:<seller_id>:refresh_token'`
6. Restart n8n (or wait for the next token cache miss)
7. Verify a test SP-API call succeeds with the new token
8. **Total downtime: ~2 minutes** (only during the moment when old token is invalidated and new one isn't in Vault yet — minimise by pre-loading new token before re-authorizing in Seller Central, then reauthorizing)

**Zero-downtime refresh token rotation:**

```python
# Pre-rotation: verify new token works before invalidating old one
# 1. Generate the new token (from re-authorization)
# 2. Store it as a NEW secret name temporarily
new_token = 'Atzr|new-refresh-token'

# Store alongside old token under a staging name
supabase.rpc('vault_create_secret', {
  'name': 'sp_api:seller_abc123:refresh_token_staging',
  'value': new_token
})

# 3. Test it — does it return a valid access token?
test_result = test_lwa_token(new_token, client_id, client_secret)
if not test_result.ok:
    raise Exception("New token invalid — abort rotation")

# 4. Swap: update the canonical secret name to the new token
supabase.rpc('vault_update_secret', {
  'name': 'sp_api:seller_abc123:refresh_token',
  'value': new_token
})

# 5. Clean up staging secret
supabase.rpc('vault_delete_secret', {
  'name': 'sp_api:seller_abc123:refresh_token_staging'
})
```

### 8.2 Supabase Service Role Key Rotation

The service role key is a JWT generated by Supabase and cannot be incrementally rotated — rotating it invalidates the old key immediately.

**Rotation process:**

1. **Supabase Dashboard → Settings → API → Reset service_role key** (this generates a new key and invalidates the old one)
2. **Update Vault** with the new key: this requires using the OLD key one last time (or using the dashboard directly)
3. **Update all services that use the service role key:**
   - n8n: update the Supabase credential in n8n credential store
   - Vercel: update the `SUPABASE_SERVICE_ROLE_KEY` env var in Vercel dashboard, trigger redeploy
   - Any other services
4. **Test** that all integrations work
5. **Downtime:** 5–15 minutes if you move fast. Services will fail with 401/403 until updated.

> ⚠️ The service role key rotation creates a brief outage window. Schedule it during low-traffic periods. Alert your team before starting.

### 8.3 n8n API Key Rotation

```bash
# In n8n (Settings → API → Regenerate API key)
# Then update everywhere the key is used:

# 1. Update Vault
supabase-cli sql "UPDATE vault.secrets SET secret='new-key' WHERE name='n8n:api_key'"

# 2. Update Vercel env var
vercel env rm N8N_API_KEY production
vercel env add N8N_API_KEY production  # Paste new key

# 3. Test: make a test call to n8n API
curl -H "X-N8N-API-KEY: $NEW_KEY" https://your-n8n.com/api/v1/workflows
# Should return 200 with workflow list
```

### 8.4 Full Rotation Runbook

Keep this runbook accessible and test it before you need it.

```markdown
## Credential Rotation Runbook v1.0

### Before Starting
- [ ] Alert team: "Starting credential rotation for [credential type] at [time]"
- [ ] Note which services will have brief downtime
- [ ] Have Vault access ready (Supabase dashboard service role available)

### SP-API Refresh Token
- [ ] Go to Seller Central → Apps & Services → Develop Apps
- [ ] Select the app; find the seller authorization
- [ ] Pre-test: current token still working (optional sanity check)
- [ ] Re-authorize seller account → copy new refresh token immediately
- [ ] Update Vault: `UPDATE vault.secrets SET secret='Atzr|...' WHERE name='sp_api:<seller_id>:refresh_token'`
- [ ] Test LWA token exchange with new refresh token
- [ ] Test an SP-API call (e.g., GET /catalog/2022-04-01/items)
- [ ] Confirm n8n workflows execute successfully
- [ ] Document rotation date in Notion/ClickUp

### Supabase Service Role Key
- [ ] Supabase Dashboard → Settings → API → Reset service_role
- [ ] Copy new key immediately
- [ ] Update Vault (use old key's last valid call, or dashboard)
- [ ] Update n8n credential (Supabase integration)
- [ ] Update Vercel: `vercel env rm SUPABASE_SERVICE_ROLE_KEY production && vercel env add SUPABASE_SERVICE_ROLE_KEY production`
- [ ] Trigger Vercel redeploy
- [ ] Test: Vercel API route can query Supabase
- [ ] Test: n8n workflow can execute Supabase operations
- [ ] Document rotation date

### n8n Encryption Key (only if rotating, very rare)
⚠️ WARNING: Rotating the n8n encryption key invalidates all stored credentials.
- [ ] Export all workflow JSON (for backup)
- [ ] Document all credentials stored in n8n (names and values — stored externally)
- [ ] Stop n8n
- [ ] Update N8N_ENCRYPTION_KEY environment variable
- [ ] Start n8n
- [ ] Re-enter all credentials from your external record
- [ ] Re-test all affected workflows
```

### 8.5 Rotation Schedule

| Credential | Minimum Rotation | Trigger-Based Rotation |
|---|---|---|
| SP-API LWA refresh tokens | Annual | Suspected leak, developer offboarding, re-auth required |
| LWA Client Secret | Annual | Suspected leak, developer offboarding |
| Supabase service role key | On team/personnel change | Suspected leak, key possibly seen by unintended party |
| Supabase anon key | Annual (low priority) | If RLS policies are found to be broken |
| n8n API key | On team change | Suspected leak, new external service needs access |
| n8n encryption key | Rarely (only on compromise) | Confirmed compromise of n8n database |
| AWS IAM access keys (if used) | 90 days | Immediately on any suspected exposure |

---

## 9. Multi-Account Isolation for Agencies

### 9.1 The Core Isolation Question

When managing multiple brand clients, you have a spectrum of isolation options:

```
Less isolation ◄────────────────────────────────────► More isolation
Shared everything   Shared DB, separate schema   Separate Supabase projects
```

For syncflow, the decision depends on client sensitivity and contractual requirements:

| Scenario | Recommended Architecture |
|---|---|
| Your own brands (1–10 ASINs) | Single Supabase project, RLS by brand |
| Small agency (2–5 clients, same contract) | Single Supabase project, RLS by seller_account_id |
| Mid-size agency (5–20 clients, separate contracts) | Single Supabase project with RLS + separate SP-API apps per client |
| Enterprise / contractual data isolation | Separate Supabase projects per client |
| High-compliance clients (EU, healthcare-adjacent) | Separate Supabase projects in client's preferred region |

### 9.2 Database-Level Isolation Patterns

**Shared project with RLS (most common for agencies):**

```sql
-- All client data in one project, RLS enforces boundaries
-- Pro: Simple, cheap, easy to query across clients for portfolio analytics
-- Con: A service role key compromise exposes all clients

CREATE TABLE brands (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_account_id uuid REFERENCES seller_accounts(id) NOT NULL,
  name              text NOT NULL,
  created_at        timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Agency staff see all brands (they're authenticated with admin role)
-- Client logins see only their own brands
CREATE POLICY "Agency staff see all"
  ON brands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'agency_staff'
    )
  );

CREATE POLICY "Clients see own brands"
  ON brands FOR SELECT
  USING (
    seller_account_id IN (
      SELECT seller_account_id FROM user_seller_accounts
      WHERE user_id = auth.uid()
    )
  );
```

**Separate projects per client:**

```
Organisation: syncflow-agency
├── Project: syncflow-internal-prod       (your own brands)
├── Project: client-brand-a-prod         (Brand A's data)
├── Project: client-brand-b-prod         (Brand B's data)
└── Project: syncflow-dev                 (development)
```

Each client project has:
- Its own service role key (stored in a master Vault in syncflow-internal)
- Its own anon key
- Its own direct connection string
- Separate Supabase Auth users
- Isolated storage buckets

**Cross-project queries (for agency portfolio analytics):**

With separate projects, cross-client queries require either:
1. Data replication (nightly ETL from client projects to a central analytics project)
2. Application-level aggregation (fetch from each project separately, aggregate in code)

Option 1 is cleaner for analytics. Option 2 is simpler to implement. Both are more work than a shared project. Choose isolation based on contractual requirements, not convenience.

### 9.3 n8n Isolation for Multi-Client

**Shared n8n instance with workflow separation:**

```
n8n Instance: syncflow-automation
├── Workflow: [Client A] Order Sync
├── Workflow: [Client A] PPC Report
├── Workflow: [Client B] Order Sync
└── Workflow: [Client B] PPC Report
```

This works but carries risk: a bug in one workflow could accidentally write to another client's Supabase table if you use a single service role key for all clients.

**Mitigation pattern — per-client Supabase credentials in n8n:**

```
n8n Credentials:
├── Supabase - Client A (service role key for client-brand-a-prod project)
├── Supabase - Client B (service role key for client-brand-b-prod project)
├── SP-API - Client A (refresh token for Client A's LWA app)
└── SP-API - Client B (refresh token for Client B's LWA app)
```

Each workflow references the specific client credential. A workflow cannot accidentally use the wrong client's credential unless you explicitly configure it to do so.

### 9.4 SP-API Isolation — Separate Developer Apps

As established in Section 2.5: one LWA developer app per client is non-negotiable. The practical implication:

- Each client app has a separate Client ID and Client Secret stored in Vault as `sp_api:<app_id>:client_id` and `sp_api:<app_id>:client_secret`
- Each seller account authorization generates a Refresh Token stored as `sp_api:<seller_id>:refresh_token`
- The app-to-seller mapping is maintained in a Supabase table:

```sql
CREATE TABLE sp_api_credentials (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_account_id uuid REFERENCES seller_accounts(id) NOT NULL,
  lwa_app_id        text NOT NULL,  -- References Vault key prefix, e.g. 'brandapp_001'
  vault_token_key   text NOT NULL,  -- The Vault key name for this seller's refresh token
  is_active         boolean DEFAULT true,
  last_rotated_at   timestamptz,
  created_at        timestamptz DEFAULT now() NOT NULL
);
```

---

## 10. Webhook Security — Validating Inbound Webhooks

### 10.1 Why Webhook Validation Matters

An unvalidated webhook endpoint is a publicly accessible trigger for your automation logic. Anyone who knows the URL can send fake events — triggering SP-API calls with attacker-controlled data, initiating PPC budget changes based on fabricated performance metrics, or flooding your rate limits.

The standard protection is HMAC-SHA256 signature verification. The sender signs the payload with a shared secret. You verify the signature before processing.

### 10.2 HMAC-SHA256 Signature Pattern

Used by SP-API SNS notifications, Figma webhooks, Stripe, and most modern webhook providers.

```python
import hmac
import hashlib
import time
from typing import Optional

def verify_webhook_signature(
    payload: bytes,
    signature_header: str,
    secret: str,
    timestamp_header: Optional[str] = None,
    max_age_seconds: int = 300
) -> bool:
    """
    Verify HMAC-SHA256 webhook signature.
    Returns True if valid, False if invalid or expired.
    """
    
    # 1. Timestamp validation (prevents replay attacks)
    if timestamp_header:
        try:
            event_timestamp = int(timestamp_header)
        except ValueError:
            return False
        
        age = abs(time.time() - event_timestamp)
        if age > max_age_seconds:
            # Reject events older than 5 minutes
            return False
    
    # 2. Compute expected signature
    # Some providers include timestamp in the signed payload (Stripe pattern)
    if timestamp_header:
        signed_payload = f"{timestamp_header}.".encode() + payload
    else:
        signed_payload = payload
    
    expected_sig = hmac.new(
        secret.encode('utf-8'),
        signed_payload,
        hashlib.sha256
    ).hexdigest()
    
    # 3. Parse received signature (handle 'sha256=...' prefix pattern)
    received_sig = signature_header
    if received_sig.startswith('sha256='):
        received_sig = received_sig[7:]
    
    # 4. Compare using constant-time comparison (prevents timing attacks)
    return hmac.compare_digest(expected_sig, received_sig)
```

**Amazon SP-API SNS notification validation (they use a different scheme — certificate-based):**

```python
import base64
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.x509 import load_pem_x509_certificate

def verify_amazon_sns_notification(notification: dict) -> bool:
    """
    Amazon SNS uses certificate-based signatures, not HMAC.
    Validate by fetching Amazon's public cert and verifying the signature.
    """
    # Amazon's cert URL always ends in amazonaws.com
    cert_url = notification.get('SigningCertURL', '')
    if not cert_url.endswith('.amazonaws.com/SimpleNotificationService-...'):
        return False  # Reject unexpected cert sources
    
    # Fetch the cert (cache this — don't fetch on every notification)
    cert_response = requests.get(cert_url, timeout=5)
    cert = load_pem_x509_certificate(cert_response.content)
    public_key = cert.public_key()
    
    # Build the message to verify (fields vary by notification type)
    message = '\n'.join([
        f"Message\n{notification['Message']}",
        f"MessageId\n{notification['MessageId']}",
        f"Timestamp\n{notification['Timestamp']}",
        f"TopicArn\n{notification['TopicArn']}",
        f"Type\n{notification['Type']}\n"
    ])
    
    signature = base64.b64decode(notification['Signature'])
    
    try:
        public_key.verify(
            signature,
            message.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA1()
        )
        return True
    except Exception:
        return False
```

### 10.3 Webhook Validation in n8n

In n8n, add a validation step at the top of every webhook-triggered workflow:

```
[Webhook Trigger: /webhook/amazon-notification]
    │
    ▼
[Code Node: Validate Signature]
    │
    ├── If valid → continue workflow
    └── If invalid → [Respond to Webhook: 401 Unauthorized] → stop
```

```javascript
// Code node: Validate Webhook Signature
const crypto = require('crypto');

const payload = $input.first().json.body;
const signature = $input.first().headers['x-signature'];
const timestamp = $input.first().headers['x-timestamp'];
const secret = $env.WEBHOOK_SECRET;  // Stored in n8n env, not in workflow

// Replay attack prevention: reject if timestamp > 5 minutes old
const now = Math.floor(Date.now() / 1000);
const ts = parseInt(timestamp, 10);
if (Math.abs(now - ts) > 300) {
  throw new Error('Webhook timestamp too old — possible replay attack');
}

// Compute expected signature
const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
const expected = crypto
  .createHmac('sha256', secret)
  .update(signedPayload)
  .digest('hex');

if (!crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expected)
)) {
  throw new Error('Invalid webhook signature');
}

// Valid — pass through to next node
return $input.all();
```

### 10.4 Webhook Validation in Vercel API Routes

```typescript
// app/api/webhooks/amazon/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()  // Must read raw body before parsing
  const signature = request.headers.get('x-amzn-Signature')
  const timestamp = request.headers.get('x-amzn-Timestamp')
  
  // Validate signature
  if (!validateSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Parse and process
  const notification = JSON.parse(rawBody)
  await processNotification(notification)
  
  return NextResponse.json({ received: true })
}

function validateSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) return false
  
  // Replay attack check
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp))
  if (age > 300) return false
  
  const secret = process.env.WEBHOOK_SECRET!
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

> ⚠️ **You must read the raw body before parsing JSON** for webhook signature validation to work. `JSON.parse(JSON.stringify(body))` can change whitespace and break the signature. Always sign and verify the raw bytes.

### 10.5 Secrets for Webhook Validation

Webhook signing secrets are shared secrets between the sender and receiver. Store them in Vault:

```
webhook:amazon:sns:signing_secret
webhook:figma:signing_secret
webhook:stripe:signing_secret
webhook:n8n_internal:signing_secret  # For Supabase → n8n trigger calls
```

Rotate them when:
- You suspect they've been exposed (e.g., appeared in an error log)
- You change webhook service providers
- Annually as part of credential rotation schedule

---

## 11. Amazon ToS Security Requirements

### 11.1 Data Handling Requirements

The Amazon SP-API Data Access Agreement (part of the developer registration) imposes binding legal requirements on how you handle SP-API data. Violating these is grounds for app suspension — which immediately disrupts all clients.

**What you CAN store:**
- Order IDs, ASIN references, shipment tracking numbers
- Pricing, inventory levels, PPC performance metrics (aggregated)
- Catalog data, product information, reviews (public data)
- Report data for your own operational purposes

**What you CANNOT store without RDT scope:**
- Buyer PII: names, email addresses, phone numbers, shipping addresses
- Payment information (you shouldn't be getting this anyway)
- Any Personally Identifiable Information beyond what's necessary for the stated use case

**What you CANNOT do with SP-API data:**
- Share it with third parties not disclosed in your developer application
- Use it for competitive intelligence against other sellers
- Aggregate and sell it as market data without explicit authorisation
- Use buyer data for marketing purposes without the buyer's explicit consent

### 11.2 PII and Restricted Data Tokens (RDT)

Amazon requires a **Restricted Data Token (RDT)** to access PII-containing fields. Without an RDT, PII fields in API responses are masked (e.g., buyer name shows as `"John D."`, shipping address is redacted).

If your automation has a legitimate need for PII (e.g., generating shipping labels, sending buyer emails via Buyer-Seller Messaging):

```python
# Request an RDT for specific operations
def get_restricted_data_token(
    sp_api_client,
    resource_path: str,
    restricted_resources: list
) -> str:
    response = sp_api_client.get_restricted_data_token(
        body={
            "restrictedResources": [
                {
                    "method": "GET",
                    "path": f"/orders/v0/orders/{order_id}/buyerInfo",
                    "dataElements": ["buyerInfo"]
                }
            ]
        }
    )
    return response['restrictedDataToken']

# RDT is short-lived (1 hour). Use it immediately, do NOT store it.
# If you need to access PII for an order:
# 1. Request RDT
# 2. Make the PII call
# 3. Use the PII for the immediate operation
# 4. Do NOT persist the PII unless you have a legal basis and declared it in your DPA
```

### 11.3 Data Retention Limits

Amazon's developer agreement requires data deletion when:
- A seller deauthorizes your app
- Your developer agreement terminates
- The data is no longer needed for the stated operational purpose

**Implement a data retention policy in your schema:**

```sql
-- Track when authorization was revoked
ALTER TABLE seller_accounts 
ADD COLUMN authorization_revoked_at timestamptz,
ADD COLUMN data_deletion_scheduled_at timestamptz;

-- Scheduled cleanup function (run daily via pg_cron or n8n)
CREATE OR REPLACE FUNCTION schedule_data_deletion()
RETURNS void AS $$
BEGIN
  -- Mark accounts for deletion 30 days after authorization revocation
  UPDATE seller_accounts
  SET data_deletion_scheduled_at = authorization_revoked_at + interval '30 days'
  WHERE authorization_revoked_at IS NOT NULL
    AND data_deletion_scheduled_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

### 11.4 Rate Limit Compliance

Rate limit violations aren't just a technical nuisance. Repeated or severe violations signal to Amazon that your app has runaway automation, which can trigger a programmatic misuse investigation. That investigation can result in API access suspension.

**Rate limit respect rules:**
- Implement exponential backoff on 429 responses (see `amazon-sp-api.md` Section 14)
- Never run high-frequency polling loops (checking order status every minute is unnecessary — use notifications)
- Monitor your rate limit consumption — log the `x-amzn-RateLimit-Limit` and `x-amzn-RateLimit-Remaining` headers
- If you must process large batches, spread them across the working day, not in overnight bulk runs that exhaust limits by 3am

---

## 12. GDPR / CCPA for Amazon Seller Data

### 12.1 What Data You're Actually Handling

For most Amazon automation workflows, the relevant data falls into two categories:

**Business operational data (low GDPR risk):**
- Order IDs, ASIN references, inventory counts, pricing data
- Advertising metrics (impressions, clicks, spend)
- Keyword rankings, search volume data
- Your own brand's product catalog

**Personal data (GDPR-relevant):**
- Buyer names, email addresses (from RDT-accessed order data)
- Shipping addresses (from orders, if PII scope is used)
- Buyer-Seller messages (contains names and communication)
- Any field that can identify a natural person

Most syncflow automation workflows should not need to process buyer PII at all. Order IDs are sufficient for inventory and fulfillment tracking. If your workflow uses RDT to access buyer names and addresses, you have GDPR obligations for that data.

### 12.2 Legal Basis for Processing

Under GDPR, you need a legal basis for processing personal data. For Amazon seller operations:

| Processing Activity | Legal Basis |
|---|---|
| Accessing order data to manage fulfillment | **Legitimate interests** (operating your business) |
| Storing buyer addresses for shipping label generation | **Contract performance** (fulfilling the purchase contract) |
| Storing buyer data beyond fulfillment completion | Requires explicit legal basis — difficult to justify |
| Using buyer data for marketing | Requires **consent** — generally not permissible via SP-API data |
| Sharing buyer data with third-party tools | Requires **explicit consent** or **data processing agreement** |

**Default rule:** If you don't have an explicit, documented legal basis for storing PII, don't store it. Process it in memory for the immediate operation and discard it.

### 12.3 What Order Data You Can Store

```sql
-- ✅ OK to store indefinitely
CREATE TABLE orders (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_account_id uuid REFERENCES seller_accounts(id) NOT NULL,
  amazon_order_id   text NOT NULL,        -- Not PII
  purchase_date     timestamptz NOT NULL,
  order_status      text NOT NULL,
  marketplace_id    text NOT NULL,
  order_total       numeric(10, 2),
  currency_code     char(3),
  -- Note: NO buyer name, NO buyer email, NO shipping address
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- ✅ OK for short-term operational storage (fulfillment period only)
CREATE TABLE order_shipping (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  amazon_order_id text NOT NULL,
  -- This data should be deleted after shipment confirmed
  shipping_name    text,   -- PII — requires legal basis
  shipping_address jsonb,  -- PII — requires legal basis
  expires_at      timestamptz NOT NULL  -- Auto-expire after 90 days
);

-- ❌ Never store long-term
-- buyer_email, buyer_phone, full_name without explicit retention justification
```

### 12.4 Data Deletion Patterns

Build deletion into the system from the start — it's far harder to add later.

```sql
-- Soft delete first (gives you a recovery window)
ALTER TABLE orders ADD COLUMN deleted_at timestamptz;

-- Hard delete function (run after soft delete retention period)
CREATE OR REPLACE FUNCTION hard_delete_expired_pii()
RETURNS void AS $$
BEGIN
  -- Delete order shipping PII after 90 days
  DELETE FROM order_shipping
  WHERE expires_at < now();
  
  -- Delete soft-deleted orders after 30-day recovery window
  DELETE FROM orders
  WHERE deleted_at < now() - interval '30 days';
  
  -- Log the deletion count
  RAISE NOTICE 'Deleted expired PII records at %', now();
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (runs nightly at 2 AM)
SELECT cron.schedule(
  'hard-delete-pii',
  '0 2 * * *',
  'SELECT hard_delete_expired_pii()'
);
```

### 12.5 Article 30 Records of Processing Activities

If you process EU customer data (orders from Amazon EU marketplaces like .de, .fr, .it, .es), GDPR Article 30 requires you to maintain records of your processing activities. This is not optional for businesses with >250 employees, and strongly recommended for smaller operations to demonstrate compliance.

**What to document (can be a simple Notion page or ClickUp doc):**

```markdown
## Record of Processing Activities — syncflow

### Processing Activity: Amazon Order Management
- **Controller:** [Your company name]
- **Purpose:** Fulfillment tracking, inventory management, financial reporting
- **Categories of data subjects:** Amazon marketplace buyers
- **Categories of personal data:** Order IDs, shipping addresses (if PII scope used), buyer names (if PII scope used)
- **Recipients:** Supabase (EU region project for EU clients), n8n (self-hosted / cloud)
- **Retention period:** Order IDs: indefinite; Buyer PII: 90 days post-fulfillment
- **Technical measures:** Encrypted at rest (Supabase), TLS in transit, RLS access control, service role key access limited to backend services
- **Transfer to third countries:** AWS data stored in us-east-1 for US clients; eu-west-1 for EU clients
```

---

## 13. Audit Logging

### 13.1 What Needs to Be Logged

Not everything needs an audit trail, but these do:

| Event | Why Log It | Where |
|---|---|---|
| SP-API calls (endpoint, seller, response code) | Detect anomalous activity, diagnose rate limit issues, ToS compliance evidence | `api_calls` table in Supabase |
| Vault secret reads | Who/what accessed which credential and when | Supabase audit log or application log |
| n8n workflow executions | Execution history = audit trail of automation actions | n8n execution log (persisted) |
| Schema migrations | Who ran what migration and when | Git history + Supabase migration log |
| Authentication events | Login attempts, token issuances, failures | Supabase Auth log |
| Data deletion events | Compliance evidence for GDPR deletion requests | `deletion_log` table |
| Credential rotation | When credentials were rotated and by whom | Manual log in ClickUp + Vault `updated_at` |

### 13.2 SP-API Call Log Table

```sql
CREATE TABLE api_calls (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_account_id uuid REFERENCES seller_accounts(id),
  api_name          text NOT NULL,        -- 'sp_api', 'ads_api', 'n8n', etc.
  endpoint          text NOT NULL,        -- '/orders/v0/orders'
  http_method       char(6) NOT NULL,     -- 'GET', 'POST', etc.
  response_code     smallint,
  request_duration_ms integer,
  workflow_id       text,                 -- n8n workflow ID if applicable
  error_message     text,
  called_at         timestamptz DEFAULT now() NOT NULL
);

-- Index for quick lookups by seller and time range
CREATE INDEX idx_api_calls_seller_called_at 
  ON api_calls (seller_account_id, called_at DESC);

-- Index for error analysis
CREATE INDEX idx_api_calls_response_code 
  ON api_calls (response_code) 
  WHERE response_code >= 400;  -- Partial index: only error responses
```

**Log every SP-API call from n8n:**

```javascript
// n8n Code Node: Log API Call
// Place this after every SP-API HTTP Request node

const callData = {
  seller_account_id: $vars.sellerAccountId,
  api_name: 'sp_api',
  endpoint: $('HTTP Request').first().json.$request?.path || 'unknown',
  http_method: 'GET',
  response_code: $('HTTP Request').first().statusCode,
  request_duration_ms: $('HTTP Request').first().json.$response?.timings?.response || null,
  workflow_id: $workflow.id,
  error_message: $('HTTP Request').first().statusCode >= 400 
    ? JSON.stringify($('HTTP Request').first().json) 
    : null
};

// Supabase insert
const { data, error } = await $supabase
  .from('api_calls')
  .insert(callData);
```

### 13.3 Supabase Audit Logging with pg_audit

For compliance-sensitive tables (order data, PII, credentials), enable pg_audit to log all queries:

```sql
-- Enable pg_audit extension (requires Supabase support plan)
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure to log all reads on sensitive tables
ALTER SYSTEM SET pgaudit.log = 'read, write';
ALTER SYSTEM SET pgaudit.log_relation = on;
```

For most syncflow deployments, application-level logging (the `api_calls` table + audit triggers) is sufficient and doesn't require pg_audit. Reserve pg_audit for clients with explicit compliance requirements.

**Audit trigger pattern (from supabase.md, adapted):**

```sql
-- Audit trigger on the credentials mapping table
CREATE TRIGGER audit_sp_api_credentials
  AFTER INSERT OR UPDATE OR DELETE ON sp_api_credentials
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Audit trigger on sensitive data access
CREATE TRIGGER audit_orders_access
  AFTER SELECT ON orders
  FOR EACH STATEMENT EXECUTE FUNCTION audit_select_func();
```

### 13.4 n8n Execution Log Retention

n8n stores execution logs in its database. By default, these are retained indefinitely — which is good for auditing but eventually fills your database.

**Configure retention in n8n environment:**

```bash
# Keep execution logs for 90 days (adjust based on compliance needs)
EXECUTIONS_DATA_MAX_AGE=90
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_PRUNE_HARD_DELETE_BUFFER=15
```

For compliance purposes, export execution summaries to Supabase before pruning:

```javascript
// n8n workflow: Daily Execution Log Export
// Runs at midnight, exports previous day's execution summary to Supabase

const executions = await $n8nApi.getExecutions({
  startedAfter: new Date(Date.now() - 86400000).toISOString()
});

const summary = executions.map(e => ({
  workflow_id: e.workflowId,
  workflow_name: e.workflowName,
  execution_id: e.id,
  status: e.status,
  started_at: e.startedAt,
  finished_at: e.stoppedAt,
  mode: e.mode
}));

await $supabase.from('n8n_execution_log').insert(summary);
```

---

## 14. Incident Response Playbook

### 14.1 Severity Levels

| Level | Definition | Response Time | Examples |
|---|---|---|---|
| **P0** | Active breach or confirmed credential exposure | Immediate (< 30 min) | Service role key in public GitHub, active unauthorized SP-API calls |
| **P1** | Suspected exposure, no confirmed misuse | < 2 hours | Credential accidentally logged, unclear if observed |
| **P2** | Security misconfiguration, no exposure | < 24 hours | RLS policy gap discovered in test, NEXT_PUBLIC_ on wrong key |
| **P3** | Security hygiene item | Next sprint | Credential rotation overdue, audit log gap |

### 14.2 Suspected SP-API Credential Compromise

**Symptoms that trigger this response:**
- LWA client secret or refresh token found in git history, Slack, or logs
- Unusual SP-API usage visible in Seller Central (orders accessed at odd hours, API calls to endpoints you don't use)
- Amazon sends an email about "suspicious developer activity" or opens a programmatic misuse inquiry

**Response steps:**

```
IMMEDIATE (< 30 minutes)
────────────────────────
1. [ ] Confirm the exposure: where exactly was the credential seen?
2. [ ] Log the time of suspected exposure (start of incident timeline)
3. [ ] If refresh token exposed:
       → Seller Central → Apps & Services → Develop Apps
       → Revoke the exposed authorization
       → Re-authorize the seller account → generates new refresh token
4. [ ] If LWA client secret exposed:
       → Developer Central → your app → Rotate Client Secret
       → All existing refresh tokens remain valid (secret rotation doesn't invalidate them)
       → Update Vault: sp_api:<app_id>:client_secret = new value
5. [ ] Rotate n8n tokens immediately (n8n may have cached the old secret)

INVESTIGATION (within 2 hours)
───────────────────────────────
6. [ ] Review SP-API console for unauthorized activity:
       Seller Central → Reports → Fulfillment → API Call Log
7. [ ] Check Supabase logs for unusual query patterns during exposure window
8. [ ] Review n8n execution history for unexpected workflow runs
9. [ ] Check git history for any commits containing the credential
       git log --all -S 'Atzr|' -- (searches all history for refresh token pattern)

CONTAINMENT
──────────
10. [ ] If unauthorized orders were placed: contact Amazon Seller Support immediately
        Reference case number in your incident log
11. [ ] If customer data was accessed: assess GDPR breach notification obligation
        (72-hour notification window under GDPR Article 33)
12. [ ] If competitor intelligence was extracted: document evidence, consider legal advice

RECOVERY
────────
13. [ ] Verify all services work with new credentials
14. [ ] Confirm new tokens are in Vault and downstream systems
15. [ ] Update rotation schedule: move next rotation forward

POST-INCIDENT (within 48 hours)
────────────────────────────────
16. [ ] Write incident report: timeline, root cause, impact, response
17. [ ] Identify how to prevent this class of credential exposure
18. [ ] Add specific checks to pre-commit hooks if the leak was via git
19. [ ] Update this playbook with anything you learned
```

### 14.3 Supabase Credential Compromise

**Symptoms:** Service role key found outside intended systems, unusual database queries, unexpected table modifications.

```
IMMEDIATE
─────────
1. [ ] Rotate service role key immediately:
       Supabase Dashboard → Settings → API → Reset service_role key
2. [ ] Update Vault (use new key, Supabase dashboard, or last-chance old key call)
3. [ ] Update n8n Supabase credential
4. [ ] Update Vercel production env var
5. [ ] Trigger Vercel redeploy

INVESTIGATION
─────────────
6. [ ] Review Supabase Logs → Database for queries during exposure window
       Look for: unexpected table reads, schema modifications, function calls
7. [ ] Check auth.users for unauthorized user creation
8. [ ] Check vault.secrets updated_at — were secrets accessed or modified?
9. [ ] Review RLS policies: were they modified or disabled?
10. [ ] Check if any Edge Functions were deployed or modified

ASSESSMENT
──────────
11. [ ] Was any customer PII accessed? → GDPR notification assessment
12. [ ] Were any credentials (SP-API tokens) accessed from Vault? → Rotate those too
13. [ ] Were any records modified or deleted? → Review backup restore options
```

### 14.4 n8n Credential or API Key Compromise

**Symptoms:** Unexpected workflow executions, new workflows you didn't create, n8n API calls from unknown IPs.

```
IMMEDIATE
─────────
1. [ ] Rotate n8n API key: Settings → API → Regenerate API key
2. [ ] Update Vault with new n8n API key
3. [ ] Update any services calling n8n API (Vercel, external integrations)

INVESTIGATION
─────────────
4. [ ] Review n8n Execution History: filter last 7 days, look for:
       - Workflows you didn't trigger
       - Executions at unusual hours
       - Failed executions with unusual errors (attempted access to wrong data)
5. [ ] Check for new or modified workflows:
       Workflow list → sort by "Last updated" → review anything recently changed
6. [ ] Review n8n credentials: were any credentials added or modified?
7. [ ] Check n8n webhooks: any new webhook endpoints registered?

CONTAINMENT
──────────
8. [ ] If rogue workflows are found: deactivate them immediately, DO NOT delete yet
       (preserve evidence before cleaning up)
9. [ ] If workflows triggered SP-API calls you didn't authorise:
       → Review Seller Central for those specific actions
       → May trigger SP-API credential rotation too

POST-INCIDENT
─────────────
10. [ ] Review n8n access controls: who has n8n admin access?
11. [ ] Enable n8n two-factor authentication if not already active
12. [ ] Review n8n network access: is the n8n instance accessible from the public internet?
        If yes, assess whether VPN/private network is appropriate
```

### 14.5 Post-Incident: Patch the Gap, Update the Model

After every incident (even near-misses), complete this checklist:

```markdown
## Incident Post-Mortem Template

**Date:** 
**Severity:** P0 / P1 / P2
**Duration (detection → containment):**

### Timeline
- [timestamp] First indication of incident
- [timestamp] Incident confirmed
- [timestamp] Containment started
- [timestamp] Containment complete
- [timestamp] Services restored

### Root Cause
What specifically enabled this incident? (Technical + Process)

### Impact
- Was any customer data accessed? 
- Were any unauthorized API calls made?
- What was the downtime or service degradation?

### What Went Well
(Identify what you got right — detection was fast, runbook worked, etc.)

### What Could Be Improved
(Identify gaps in detection, response, or prevention)

### Action Items
| Action | Owner | Due Date |
|---|---|---|
| [Specific preventive measure] | [Name] | [Date] |
| Update threat model | [Name] | [Date] |
| Update this playbook | [Name] | [Date] |

### Updated Threat Model
[Add or update entries in Section 1's threat matrix based on what you learned]
```

---

## 15. Dos & Don'ts

### ✅ DOs

1. **Store every credential in Supabase Vault as the authoritative source.** Even if n8n also stores it as an encrypted credential, Vault is the record of what the actual value is. Vault's `updated_at` is your rotation audit trail.

2. **Use one LWA developer app per client organisation.** A credential leak in a shared app terminates API access for every client simultaneously. Isolation is not optional when client contracts are involved.

3. **Verify HMAC signatures on every inbound webhook before executing any business logic.** An n8n webhook endpoint without signature validation is a publicly-accessible trigger for your automation. Someone will find it and send fake data.

4. **Include timestamp validation in webhook verification — reject events older than 5 minutes.** A valid signature on a week-old payload is a replay attack. Timestamp validation costs two lines of code and prevents it entirely.

5. **Keep SP-API operations strictly server-side.** SP-API credentials (refresh tokens, LWA secrets) should never touch browser JavaScript. Every SP-API call goes through a server-side proxy (Vercel Route Handler or Edge Function).

6. **Test RLS policies explicitly before shipping.** Use `SET LOCAL role TO authenticated` and simulate real user JWTs in SQL. A policy bug doesn't throw an error — it silently returns empty results or too many results. You won't catch it in production until a client calls you.

7. **Build credential rotation into your incident response muscle memory.** Run a tabletop rotation exercise before you need it. Rotating credentials under pressure at 11pm is the wrong time to discover the runbook is incomplete.

8. **Use `crypto.timingSafeEqual()` (Node.js) or `hmac.compare_digest()` (Python) for signature comparison.** Regular string equality `===` leaks timing information that can reveal the expected signature to a patient attacker. Constant-time comparison is a one-line change.

9. **Separate Supabase projects for production vs. preview/staging.** A data corruption bug in a staging workflow should damage staging data. Point preview deployments at staging; never at production.

10. **Log every SP-API call with response code and workflow ID.** When Amazon sends you a programmatic misuse inquiry, this log is how you reconstruct exactly what called what and when. Without it, you're guessing.

11. **Set `N8N_ENCRYPTION_KEY` before creating your first n8n credential — and back it up separately.** If you lose this key after creating credentials, those credentials are unrecoverable. Store it in Vault immediately after generating it.

12. **Review exported n8n workflow JSON for inline credentials before committing.** Create a pre-commit hook or workflow export review policy. It's easy to accidentally export a workflow that has an HTTP header value hardcoded.

13. **Apply GDPR principles to your EU-marketplace order data even if you're not in the EU.** Processing EU customer data means GDPR applies to you regardless of where your servers are. The 72-hour breach notification window applies.

14. **Enforce a credential offboarding checklist when team members leave.** Service role keys, n8n access, Supabase team membership, Developer Central access — create a ClickUp template and complete it within 24 hours of someone leaving the project.

15. **Use STS AssumeRole instead of long-lived IAM access keys for AWS operations.** Temporary credentials that auto-expire in 1 hour are dramatically safer than keys that are valid until you remember to rotate them. The implementation cost is one extra API call.

---

### ❌ DON'Ts

1. **Don't put any credential in a NEXT_PUBLIC_ environment variable.** NEXT_PUBLIC_ means "embed in the browser bundle and expose to every user." SP-API tokens, service role keys, and API keys are not public. If you're not sure whether a variable should be NEXT_PUBLIC_, it shouldn't be.

2. **Don't share one LWA refresh token across multiple n8n workflows as a hardcoded string.** When the token rotates (or expires), you have to find and update it in every workflow individually. Store it in a credential; reference the credential from workflows.

3. **Don't disable RLS on a table "temporarily" to debug a query.** The fix is to understand why the query fails under RLS (usually a missing policy), not to remove the protection. "Temporarily" disabled tables regularly get forgotten and stay disabled in production.

4. **Don't log full request bodies from SP-API calls at INFO level.** Order responses include masked PII fields and internal Amazon identifiers. Logging them creates unnecessary data retention and exposure. Log the endpoint, response code, and timing only.

5. **Don't use the same webhook endpoint URL for multiple clients.** A leaked URL lets an attacker trigger workflows for any client on that webhook. Use per-client URLs with per-client signing secrets. In n8n, that means separate webhook trigger nodes per workflow.

6. **Don't store LWA access tokens (not refresh tokens — access tokens) in Vault.** Access tokens expire in 1 hour and should be cached in memory only. Vault is for long-lived credentials. Storing short-lived tokens in Vault creates stale data and false confidence.

7. **Don't trust the `seller_account_id` that the client sends in an API request without verifying it against the authenticated user's permissions.** A user who knows the UUID of another seller account could pass it in a request body and access that client's data if you don't check RLS or an explicit authorization table. Always validate from `auth.uid()`, not from the request body.

8. **Don't put SP-API credentials in ClickUp tasks, Notion pages, Slack messages, or any other collaboration tool.** The moment a credential exists in a collaboration tool, you've lost control of who can see it. Use Vault for the credential and reference it by name in documentation.

9. **Don't run n8n workflows against the production Supabase project during development.** One mis-configured test workflow that bulk-deletes or overwrites production data is all it takes. Point local and test workflows at the staging project.

10. **Don't assume that because n8n is "self-hosted" it's automatically private.** Default n8n configuration exposes the webhook endpoint on port 5678. Confirm that your n8n instance is behind a reverse proxy, has authentication enabled, and is not directly accessible from the public internet without HTTPS.

11. **Don't skip the replay attack timestamp check on webhooks because "it's unlikely."** Replay attacks are trivially easy for anyone who can observe network traffic or who has access to your webhook logs. The 5-line timestamp check eliminates this attack vector entirely.

12. **Don't store buyer email addresses from RDT responses unless you have a specific, documented legal basis and a deletion schedule.** Most order automation workflows (inventory sync, PPC reporting, FBA management) have zero need for buyer email. If you don't need it, don't request the RDT scope that returns it, and don't store it.

---

## Appendix A: Security Checklist for New syncflow Projects

Use this before go-live on any new client or project:

```markdown
### Pre-Launch Security Checklist

**Credentials & Secrets**
- [ ] All credentials stored in Supabase Vault with consistent naming
- [ ] No credentials in git (run: git grep -r 'Atzr|' .)
- [ ] .gitignore includes .env, .env.local, .env.production
- [ ] git-secrets pre-commit hook installed and tested
- [ ] Separate LWA developer app created for this client
- [ ] n8n credentials reference Vault proxy, not hardcoded values

**Supabase**
- [ ] RLS enabled on all business data tables
- [ ] RLS policies tested with actual user JWTs (not just Studio)
- [ ] Service role key stored server-side only (no NEXT_PUBLIC_ prefix)
- [ ] Anon key is the only key used in browser code
- [ ] Separate Supabase project for production vs. staging/preview

**n8n**
- [ ] N8N_ENCRYPTION_KEY set and backed up in Vault
- [ ] No credentials hardcoded in workflow JSON
- [ ] Webhook endpoints have HMAC signature validation
- [ ] Rate limit protection on loops and SP-API calls
- [ ] Execution log retention configured

**Vercel / Next.js**
- [ ] No sensitive keys in NEXT_PUBLIC_ variables
- [ ] Preview environment uses staging Supabase project
- [ ] Production environment uses production Supabase project
- [ ] All SP-API calls in Route Handlers / Server Components only

**Compliance**
- [ ] Data retention schedule defined for any PII
- [ ] SP-API data usage matches what was declared in developer application
- [ ] Article 30 processing record updated if processing EU customer data

**Incident Readiness**
- [ ] Rotation runbook updated for this project's credentials
- [ ] All relevant credential names documented in project ClickUp
- [ ] At least two people know the rotation procedure
- [ ] Post-incident report template accessible to the team
```

---

## Appendix B: Quick Reference — Credential Storage Decision Tree

```
Is this credential sensitive (would its exposure cause damage)?
│
├── No → Environment variable is fine (NEXT_PUBLIC_ is OK if it's truly public)
│
└── Yes → Is it per-client / per-seller?
          │
          ├── Yes → Supabase Vault with namespaced key (sp_api:<seller_id>:...)
          │         Retrieve at runtime via Edge Function proxy
          │
          └── No → Is it needed by a browser client?
                   │
                   ├── Yes → This is an architecture problem.
                   │         Browser clients should not have sensitive credentials.
                   │         Add a server-side proxy layer.
                   │
                   └── No → Is it needed by n8n, Vercel (server), or Claude Code?
                             │
                             ├── n8n → Supabase Vault (source) + n8n credential store (cache)
                             ├── Vercel server → Supabase Vault (source) + Vercel env var (cache)
                             └── Local dev → .env.local (dev credentials only, never prod)
```

---

## Useful Links

- [SP-API Data Access Agreement](https://developer-docs.amazon.com/sp-api/docs/data-access-agreement) — Legal requirements for SP-API data handling
- [Amazon MWS/SP-API Safeguarding Credentials](https://developer-docs.amazon.com/sp-api/docs/safeguarding-sensitive-credentials)
- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [AWS STS AssumeRole API Reference](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [n8n Credentials Documentation](https://docs.n8n.io/credentials/)
- [GDPR Article 30 — Records of Processing Activities](https://gdpr-info.eu/art-30-gdpr/)
- [HMAC Wikipedia](https://en.wikipedia.org/wiki/HMAC) — Useful for understanding the signature verification math
- [Amazon SNS Message Verification](https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html)
- [pgsodium (Supabase Vault encryption layer)](https://github.com/michelp/pgsodium)
- [git-secrets](https://github.com/awslabs/git-secrets) — Prevents committing secrets to git
