#!/usr/bin/env node
/**
 * Rehydrate the SFX library from MANIFEST.json.
 *
 * Walks every item in `public/assets/sfx/MANIFEST.json` and ensures the file
 * at `item.local_path` exists on disk. If it doesn't, fetches `item.cdn_url`
 * (Pixabay CDN for scraped items) and writes it to local_path.
 *
 * The manifest IS the bootable source of truth — clone the repo, rehydrate,
 * audition. No scraper run required for the existing catalogue.
 *
 * Skips items that:
 *   - already have a non-empty file at local_path
 *   - have no cdn_url (locally-indexed items, e.g. user music drops)
 *   - have non-https cdn_url (defensive)
 *
 * Flags:
 *   --filter <substr>   only process items whose category, id, or title
 *                       contains <substr> (case-insensitive)
 *   --shortlisted-only  only process items where shortlisted === true
 *   --concurrency <n>   parallel downloads (default 6)
 *   --dry-run           list what would be fetched, don't write
 *   --json              machine-readable summary
 *
 * Exit codes:
 *   0  all targeted items resolved (already-present + newly-fetched)
 *   1  one or more fetches failed
 *   2  manifest unreadable / malformed
 */
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = join(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');

function parseArgs(argv) {
  const opts = { filter: null, shortlistedOnly: false, concurrency: 6, dryRun: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--filter') opts.filter = (argv[++i] || '').toLowerCase();
    else if (a === '--shortlisted-only') opts.shortlistedOnly = true;
    else if (a === '--concurrency') opts.concurrency = Math.max(1, parseInt(argv[++i], 10) || 6);
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--json') opts.json = true;
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
function log(...x) { if (!opts.json) console.log(...x); }
function err(...x) { console.error(...x); }

async function fileExistsNonEmpty(p) {
  try {
    const s = await stat(p);
    return s.isFile() && s.size > 0;
  } catch { return false; }
}

async function fetchToFile(url, destAbs) {
  // Pixabay CDN serves audio cleanly with their site as Referer; without it the
  // request can return 403 depending on the asset. Set conservatively for all
  // items so the script works for any cdn_url that needs a referer hint.
  const headers = { 'User-Agent': 'claude-remotion-flow/rehydrate', 'Referer': 'https://pixabay.com/' };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty body');
  await mkdir(dirname(destAbs), { recursive: true });
  await writeFile(destAbs, buf);
  return buf.length;
}

function targetable(item, opts) {
  if (!item.local_path) return false;
  if (!item.cdn_url) return false;
  if (!/^https:/.test(item.cdn_url)) return false;
  if (opts.shortlistedOnly && !item.shortlisted) return false;
  if (opts.filter) {
    const hay = `${item.category || ''} ${item.id || ''} ${item.title || ''}`.toLowerCase();
    if (!hay.includes(opts.filter)) return false;
  }
  return true;
}

async function pool(items, n, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i).catch(e => ({ error: e.message || String(e) }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, next));
  return results;
}

async function main() {
  let raw;
  try { raw = await readFile(MANIFEST_PATH, 'utf8'); }
  catch (e) { err(`Cannot read manifest: ${e.message}`); process.exit(2); }
  let manifest;
  try { manifest = JSON.parse(raw); }
  catch (e) { err(`Manifest JSON parse failed: ${e.message}`); process.exit(2); }

  const items = manifest.items || [];
  const eligible = items.filter(i => targetable(i, opts));

  // Partition before fetching: existing vs need-fetch.
  const need = [];
  let alreadyPresent = 0, skipped = 0;
  for (const item of items) {
    if (!targetable(item, opts)) { skipped += 1; continue; }
    const abs = join(PROJECT_ROOT, item.local_path);
    if (await fileExistsNonEmpty(abs)) alreadyPresent += 1;
    else need.push({ item, abs });
  }

  log(`Manifest: ${MANIFEST_PATH}`);
  log(`Items total: ${items.length}  ·  eligible: ${eligible.length}  ·  already present: ${alreadyPresent}  ·  to fetch: ${need.length}  ·  skipped: ${skipped}`);
  if (need.length === 0) {
    if (opts.json) console.log(JSON.stringify({ total: items.length, eligible: eligible.length, already_present: alreadyPresent, fetched: 0, failed: [], skipped }, null, 2));
    process.exit(0);
  }

  if (opts.dryRun) {
    log('\nDRY-RUN — no files will be written. First 10:');
    for (const { item, abs } of need.slice(0, 10)) log(`  · ${item.id}  →  ${item.local_path}`);
    if (need.length > 10) log(`  ... and ${need.length - 10} more`);
    process.exit(0);
  }

  log(`\nFetching ${need.length} items at concurrency ${opts.concurrency}...`);
  let done = 0;
  const failed = [];
  const results = await pool(need, opts.concurrency, async ({ item, abs }) => {
    try {
      const bytes = await fetchToFile(item.cdn_url, abs);
      done += 1;
      if (!opts.json && (done % 25 === 0 || done === need.length)) log(`  ${done}/${need.length}`);
      return { id: item.id, bytes };
    } catch (e) {
      failed.push({ id: item.id, local_path: item.local_path, cdn_url: item.cdn_url, reason: e.message || String(e) });
      throw e;
    }
  });

  const fetched = results.filter(r => r && !r.error).length;
  log(`\nFetched: ${fetched}  ·  failed: ${failed.length}`);
  if (failed.length) {
    log('\nFAILED:');
    for (const f of failed.slice(0, 20)) log(`  - ${f.id}  ${f.cdn_url}  [${f.reason}]`);
    if (failed.length > 20) log(`  ... and ${failed.length - 20} more`);
  }

  if (opts.json) {
    console.log(JSON.stringify({
      total: items.length, eligible: eligible.length, already_present: alreadyPresent,
      fetched, failed, skipped,
    }, null, 2));
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(e => { err('rehydrate failed:', e.stack || e); process.exit(2); });
