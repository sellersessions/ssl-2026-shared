// SP-API regional endpoints. LWA auth always goes to the same URL;
// the regional endpoint is the data plane.
//
// Reference: https://developer-docs.amazon.com/sp-api/docs/sp-api-endpoints

export const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

export const SP_API_ENDPOINTS = {
  na: 'https://sellingpartnerapi-na.amazon.com',
  eu: 'https://sellingpartnerapi-eu.amazon.com',
  fe: 'https://sellingpartnerapi-fe.amazon.com',
} as const;

export type SpApiRegion = keyof typeof SP_API_ENDPOINTS;
