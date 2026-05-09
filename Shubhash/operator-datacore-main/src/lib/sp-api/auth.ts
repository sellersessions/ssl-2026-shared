import { LWA_TOKEN_URL } from './endpoints.js';

interface LwaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  access_token: string;
  expires_at_ms: number;
}

const cache = new Map<string, CachedToken>();

/**
 * Exchange a long-lived LWA refresh token for a short-lived access token.
 * Tokens are cached in-memory for `expires_in - 60s` (60s safety margin).
 *
 * Reference:
 * https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api
 */
export async function getLwaAccessToken(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const cacheKey = `${opts.clientId}:${opts.refreshToken.slice(-12)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires_at_ms > Date.now() + 60_000) {
    return cached.access_token;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
  });

  const res = await fetch(LWA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `LWA token exchange failed (${res.status}): ${text}\n` +
        'Common causes:\n' +
        '  - Refresh token expired (LWA refresh tokens last ~12 months; regenerate in Seller Central → Apps and Services → Develop Apps).\n' +
        '  - Client ID / secret mismatch.\n' +
        '  - App lost a required role since the token was issued. Re-authorise the seller.',
    );
  }

  const data = (await res.json()) as LwaTokenResponse;
  cache.set(cacheKey, {
    access_token: data.access_token,
    expires_at_ms: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

export function clearLwaCache(): void {
  cache.clear();
}
