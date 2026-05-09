#!/usr/bin/env tsx
// ============================================================================
// check-migrations.ts
// Validates that every migration file applies cleanly inside a single
// transaction, then rolls back. Leaves your database untouched.
//
// Skips gracefully if SUPABASE_DB_URL is not set so this is safe to run in CI.
//
// Usage:
//   npm run check:migrations
// ============================================================================

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client as PgClient } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');

async function main(): Promise<void> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.log('SUPABASE_DB_URL not set — skipping migration check (this is fine in CI).');
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => statSync(join(MIGRATIONS_DIR, f)).isFile())
    .sort();

  console.log(`Checking ${files.length} migrations against ${maskUrl(dbUrl)} ...`);

  const pg = new PgClient({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });
  await pg.connect();

  try {
    await pg.query('BEGIN');
    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      const start = Date.now();
      try {
        await pg.query(sql);
        console.log(`  ✓ ${file}  (${Date.now() - start}ms)`);
      } catch (err) {
        const e = err as Error;
        console.error(`  ✗ ${file}`);
        console.error(`    ${e.message}`);
        await pg.query('ROLLBACK').catch(() => {});
        process.exit(1);
      }
    }
    // Always roll back — this is a check, not a real apply.
    await pg.query('ROLLBACK');
    console.log('All migrations parsed cleanly. Rolled back; your database is untouched.');
  } finally {
    await pg.end();
  }
}

function maskUrl(url: string): string {
  return url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
