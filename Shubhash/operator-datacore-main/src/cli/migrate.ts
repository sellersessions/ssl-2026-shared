#!/usr/bin/env tsx
// ============================================================================
// migrate.ts
// Apply every .sql file in supabase/migrations/ in filename order.
// Idempotent: each migration records itself in meta.migration_history and
// re-running is a no-op.
// ============================================================================

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPgClient } from '../lib/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');

async function main(): Promise<void> {
  console.log('operator-datacore — applying migrations');
  console.log('---------------------------------------');

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => statSync(join(MIGRATIONS_DIR, f)).isFile())
    .sort();

  if (files.length === 0) {
    console.error(`No .sql files found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} migration files`);

  const pg = await getPgClient();
  let applied = 0;
  let skipped = 0;

  try {
    // Read existing history (the meta schema may not exist yet on first run)
    let history = new Set<string>();
    try {
      const res = await pg.query<{ filename: string }>(
        'SELECT filename FROM meta.migration_history',
      );
      history = new Set(res.rows.map((r) => r.filename));
    } catch {
      // meta.migration_history doesn't exist — first run, fine.
    }

    for (const file of files) {
      if (history.has(file)) {
        console.log(`  · ${file}  (already applied, skipping)`);
        skipped++;
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      const start = Date.now();
      try {
        await pg.query(sql);
      } catch (err) {
        const e = err as Error;
        console.error(`\n  ✗ ${file}`);
        console.error(`    ${e.message}`);
        process.exit(1);
      }
      console.log(`  ✓ ${file}  (${Date.now() - start}ms)`);
      applied++;
    }

    console.log('---------------------------------------');
    console.log(`Applied: ${applied}, Skipped: ${skipped}`);

    // Show schema summary
    const summary = await pg.query<{ schema: string; tables: number }>(`
      SELECT n.nspname AS schema, COUNT(c.oid)::int AS tables
      FROM pg_namespace n
      LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relkind = 'r'
      WHERE n.nspname IN ('meta', 'raw', 'brain', 'ops', 'analytics')
      GROUP BY n.nspname
      ORDER BY n.nspname;
    `);
    console.log('\nSchema summary:');
    for (const row of summary.rows) {
      console.log(`  ${row.schema.padEnd(12)} ${row.tables} tables`);
    }
  } finally {
    await pg.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
