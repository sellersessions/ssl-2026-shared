#!/usr/bin/env node
/**
 * MANIFEST.json schema migration — v1 → v2 → v3.
 *
 * v1 (scraper capture): id, source, query, category, page, cdn_url, detail_url,
 * title, author, author_url, duration, tags, license, captured_at, local_path,
 * bytes.
 *
 * v2 added curation fields: subcategory, mood[], bpm, key, energy, approved,
 * approved_at, used_in[], notes.
 *
 * v3 — schema v3 says every scraped file IS the library; shortlist is a bookmark;
 * selection is ephemeral (client-side). New fields:
 *   + shortlisted     boolean        Danny's bookmark
 *   + shortlisted_at  string|null    ISO timestamp when shortlisted flipped true
 *
 * Deprecated v2 fields (approved, approved_at) are KEPT for rollback safety and
 * ignored by the UI. Not deleted.
 *
 * Idempotent — re-runs leave existing curation untouched.
 *
 * Usage:
 *   node scripts/sfx/migrate-manifest.mjs
 *   node scripts/sfx/migrate-manifest.mjs --dry-run
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');

const DEFAULTS = {
  // v2 fields (kept so fresh manifests without migration still match full shape)
  subcategory: null,
  mood: [],
  bpm: null,
  key: null,
  energy: null,
  approved: false,      // deprecated in v3; retained for rollback
  approved_at: null,    // deprecated in v3; retained for rollback
  used_in: [],
  notes: '',
  // v3 fields
  shortlisted: false,
  shortlisted_at: null,
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const data = JSON.parse(raw);

  const before = data.schema_version;
  let added = 0;
  let touched = 0;

  for (const item of data.items ?? []) {
    let changed = false;
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (!(k in item)) {
        item[k] = Array.isArray(v) ? [...v] : v;
        added++;
        changed = true;
      }
    }
    if (changed) touched++;
  }

  data.schema_version = 3;
  data._comment = 'schema v3 — all scraped files are library; shortlist is a bookmark; selection is ephemeral (client-side). approved/approved_at deprecated but retained for rollback.';

  console.log(`MANIFEST: v${before} → v3`);
  console.log(`  items: ${data.items?.length ?? 0}`);
  console.log(`  touched: ${touched}`);
  console.log(`  fields added: ${added}`);

  if (dryRun) {
    console.log('  --dry-run: not writing');
    return;
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  written: ${MANIFEST_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
