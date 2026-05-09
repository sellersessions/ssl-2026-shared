# Connect Amazon SP-API

If you came to Seller Sessions Live 2026, your SP-API was set up before the workshop. This runbook is here so you can:
- Re-do it on a new Amazon account
- Help someone else
- Refresh expired credentials in 12 months

The full official docs are at https://developer-docs.amazon.com/sp-api. This runbook is the simplest happy path.

---

## What you'll end up with

Three values that go into your `.env`:

```
SP_API_LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxxxxxxxx
SP_API_LWA_CLIENT_SECRET=amzn1.oa2-cs.v1.xxxxxxxxxxxx
SP_API_REFRESH_TOKEN=Atzr|IwEBIxxxxxxxxxxxxxxxxxxx
```

Plus `SP_API_REGION` (`na` / `eu` / `fe`) and `SP_API_MARKETPLACE_IDS` (comma-separated, e.g. `ATVPDKIKX0DER` for US).

---

## Step 1 — Register as a developer

1. Sign in to **Seller Central** with the account holder login.
2. Go to **Apps and Services** → **Develop Apps**.
3. If this is your first time, you'll see a "Register as a developer" prompt. Fill it out.
   - Profile type: **Private developer** (you're building for your own account)
   - Roles to request: at minimum tick **Selling Partner Insights**, **Pricing**, **Brand Analytics**, **Inventory and Order Tracking**, **Finances and Accounting**. (Take everything you might want — adding a role later forces every existing seller to re-authorise.)
4. Submit. Approval is usually instant for private developer profiles.

---

## Step 2 — Create the LWA app

Still in **Apps and Services** → **Develop Apps**:

1. Click **Add new app client**.
2. **App name:** something memorable, e.g. `operator-datacore-yourbrand`.
3. **API Type:** SP API.
4. **Roles:** the same set you registered for in Step 1.
5. **OAuth Login URI:** `https://localhost`.
6. **OAuth Redirect URI:** `https://localhost`.
7. Submit.

You'll see your new app listed. Click **View** next to it. You now have:

- **LWA Client ID** → goes into `.env` as `SP_API_LWA_CLIENT_ID`.
- **LWA Client Secret** (click "Show") → goes into `.env` as `SP_API_LWA_CLIENT_SECRET`.

Don't close this tab yet. You need one more thing.

---

## Step 3 — Self-authorise the app for your seller account

Still on the app's view page, look for **Authorize this app**. (On some accounts it's a button labelled **Authorize**.)

1. Click it. Amazon shows a consent screen listing all the roles your app is asking for.
2. Confirm. Amazon redirects you to `https://localhost/?...&spapi_oauth_code=...`.
3. The browser shows an error page (because there's no server at localhost). **That's expected.**
4. Look at the URL bar. Copy the `spapi_oauth_code` value (the code between `=` and `&` if there's anything after).

You now have a one-time **authorisation code**. It expires in 5 minutes. Move fast.

---

## Step 4 — Exchange the code for a refresh token

operator-datacore ships a helper for this. From the repo folder:

```bash
npm install         # if you haven't already
npm run exchange-code -- \
  --client-id 'amzn1.application-oa2-client.xxx' \
  --client-secret 'amzn1.oa2-cs.v1.xxx' \
  --code 'ANxxxxxxxxxxxxxxx'
```

(If `exchange-code` doesn't exist yet in your version, here's the curl equivalent:)

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=ANxxxxxxxxxxxxxxx' \
  -d 'redirect_uri=https://localhost' \
  -d 'client_id=amzn1.application-oa2-client.xxx' \
  -d 'client_secret=amzn1.oa2-cs.v1.xxx'
```

The response is JSON with three fields:

```json
{
  "access_token": "Atza|...",
  "refresh_token": "Atzr|IwEBI...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

The `refresh_token` is what you want. It's good for ~12 months.

Paste it into `.env` as `SP_API_REFRESH_TOKEN`.

---

## Step 5 — Pick your region and marketplaces

| Region | Countries | Set `SP_API_REGION` to |
|---|---|---|
| North America | US, CA, MX, BR | `na` |
| Europe | UK, DE, FR, IT, ES, NL, SE, PL, TR, AE, IN, EG, SA | `eu` |
| Far East | JP, AU, SG | `fe` |

Marketplace IDs (the ones operator-datacore knows about, also in `meta.marketplace`):

| Country | Marketplace ID |
|---|---|
| US | `ATVPDKIKX0DER` |
| CA | `A2EUQ1WTGCTBG2` |
| MX | `A1AM78C64UM0Y8` |
| BR | `A2Q3Y263D00KWC` |
| UK | `A1F83G8C2ARO7P` |
| DE | `A1PA6795UKMFR9` |
| FR | `A13V1IB3VIYZZH` |
| IT | `APJ6JRA9NG5V4` |
| ES | `A1RKKUPIHCS9HS` |
| NL | `A1805IZSGTT6HS` |
| SE | `A2NODRKZP88ZB9` |
| JP | `A1VC38T7YXB528` |
| AU | `A39IBJ37TRP1C6` |
| IN | `A21TJRUUN4KGV` |

For the full list, query `meta.marketplace` after migrations have run.

Set `SP_API_MARKETPLACE_IDS` to a comma-separated list of the marketplaces you actually sell on.

---

## Step 6 — Smoke test

```bash
npm run smoke
```

You should see:

```
[OK]  SP-API LWA token exchange   token len 528
[OK]  SP-API marketplace participation   ATVPDKIKX0DER (US), ...
```

If LWA token exchange fails:
- **`invalid_client`** — Client ID / secret typo. Re-paste.
- **`invalid_grant`** — Refresh token expired or app was deauthorised. Re-do steps 3-4.
- **`unauthorized_client`** — App lost a role since the token was issued. Re-authorise the seller (Step 3).

If marketplace participation fails but token exchange succeeded:
- Wrong region. Try the other one.

---

## Step 7 — Brand Analytics enrolment (if not already done)

The Sales & Traffic Report is part of Brand Analytics. To use it your brand must be enrolled in Brand Registry. If you're brand-registered, enrolment is free and immediate:

1. Seller Central → **Brand Analytics** (sometimes under "Brands" or "Reports").
2. If you see a "Get started" CTA, click it.
3. Done. The Sales & Traffic Report is available within minutes.

If you're not brand-registered, you can't use Sales & Traffic. operator-datacore's v1 needs Brand Analytics enrolment.

---

## Refresh token rotation

LWA refresh tokens last ~12 months. operator-datacore tracks `expires_at` in `meta.connection`. When you get within 30 days of expiry:

1. Re-do steps 3-4 to get a new refresh token.
2. Update `.env`.
3. The next `npm run smoke` will succeed and update the stored hash.

Set a calendar reminder for 11 months from when you first got the token. Token rotation that crosses the year boundary kills production.

---

## What's NOT in this runbook (yet)

- **Restricted Data Tokens (RDTs)** for PII (buyer info, shipping addresses). operator-datacore deliberately doesn't store PII in v1.
- **AWS IAM signing.** Retired by Amazon in 2023. Pure LWA bearer auth in 2026.
- **Multiple LWA apps.** If you're white-labelling for a client, you'd register a public developer profile and use the OAuth website workflow. Out of scope for self-hosted operators.
