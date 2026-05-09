import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Client as PgClient } from 'pg';
import { loadEnv } from './env.js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const env = loadEnv();
  cachedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
  return cachedClient;
}

export async function getPgClient(): Promise<PgClient> {
  const env = loadEnv();
  const client = new PgClient({
    connectionString: env.SUPABASE_DB_URL,
    ssl: env.SUPABASE_DB_URL.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}
