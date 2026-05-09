#!/usr/bin/env tsx
// ============================================================================
// exchange-code.ts
// Trades a one-time SP-API authorisation code for a long-lived refresh token.
// You only need this once when you first set up SP-API, or whenever your
// existing refresh token expires (~12 months).
//
// Usage:
//   npm run exchange-code -- \
//     --client-id 'amzn1.application-oa2-client.xxx' \
//     --client-secret 'amzn1.oa2-cs.v1.xxx' \
//     --code 'ANxxxxxxxxxxxxxxx'
//
// The auth code expires 5 minutes after Amazon issues it. Move fast.
// ============================================================================

import { parseArgs } from 'node:util';
import { LWA_TOKEN_URL } from '../lib/sp-api/endpoints.js';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'client-id': { type: 'string' },
      'client-secret': { type: 'string' },
      code: { type: 'string' },
      'redirect-uri': { type: 'string', default: 'https://localhost' },
    },
  });

  const clientId = values['client-id'];
  const clientSecret = values['client-secret'];
  const code = values.code;
  const redirectUri = values['redirect-uri']!;

  if (!clientId || !clientSecret || !code) {
    console.error('Missing required arguments.');
    console.error('');
    console.error('Usage:');
    console.error('  npm run exchange-code -- \\');
    console.error('    --client-id "amzn1.application-oa2-client.xxx" \\');
    console.error('    --client-secret "amzn1.oa2-cs.v1.xxx" \\');
    console.error('    --code "ANxxxxxxxxxxxxxxx"');
    console.error('');
    console.error('See docs/runbooks/connect-amazon.md for how to get these.');
    process.exit(1);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LWA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Exchange failed (${res.status}): ${text}`);
    console.error('');
    console.error('Common causes:');
    console.error('  - Auth code expired (5 minute lifetime). Re-do step 3 in connect-amazon.md.');
    console.error('  - Client ID / secret typo.');
    console.error('  - Redirect URI mismatch — must equal what you set in the app config.');
    process.exit(1);
  }

  const data = JSON.parse(text) as TokenResponse;

  console.log('');
  console.log('Refresh token (paste into .env as SP_API_REFRESH_TOKEN):');
  console.log('');
  console.log(`  ${data.refresh_token}`);
  console.log('');
  console.log(`Token issued. It will be valid for ~12 months.`);
  console.log(`Set a calendar reminder for ${monthsFromNow(11)} to rotate.`);
  console.log('');
}

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
