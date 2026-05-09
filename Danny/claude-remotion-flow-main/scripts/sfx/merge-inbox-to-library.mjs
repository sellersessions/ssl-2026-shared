#!/usr/bin/env node
/**
 * Merge public/assets/sfx/_inbox/<cat>/*.mp3 → public/assets/sfx/library/<cat>/*.mp3.
 *
 * Danny's mental model: every scraped file IS the library. `_inbox/` adds
 * friction with no upside. Filename collisions are impossible by convention:
 * scraped files are `pixabay-<author>-<title>-<hash>.mp3`; hand-picks have no
 * `pixabay-` prefix. This script still checks per-file collisions defensively.
 *
 * Also updates MANIFEST.json `local_path` for every SFX entry currently rooted
 * at `_inbox/<cat>/`.
 *
 * --dry-run is the DEFAULT. Must pass --apply to actually move files.
 *
 * Usage:
 *   node scripts/sfx/merge-inbox-to-library.mjs            # dry-run
 *   node scripts/sfx/merge-inbox-to-library.mjs --apply    # move files + patch manifest
 */
import { readFile, writeFile, readdir, rename, mkdir, rmdir, lstat, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');
const INBOX_ROOT = resolve(PROJECT_ROOT, 'public/assets/sfx/_inbox');
const LIBRARY_ROOT = resolve(PROJECT_ROOT, 'public/assets/sfx/library');
const CATEGORIES = ['ambience', 'impacts', 'risers', 'stingers', 'transitions'];

async function exists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const label = apply ? '[APPLY]' : '[DRY-RUN]';

  if (!(await exists(INBOX_ROOT))) {
    console.log(`${label} _inbox/ does not exist — nothing to merge.`);
    return;
  }

  // Gather (src, dst) pairs
  const moves = [];
  const collisions = [];

  for (const cat of CATEGORIES) {
    const srcDir = join(INBOX_ROOT, cat);
    const dstDir = join(LIBRARY_ROOT, cat);
    if (!(await exists(srcDir))) continue;
    let entries;
    try { entries = await readdir(srcDir, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const src = join(srcDir, ent.name);
      const dst = join(dstDir, ent.name);
      moves.push({ cat, name: ent.name, src, dst });
      if (await exists(dst)) collisions.push({ src, dst });
    }
  }

  console.log(`${label} planned moves: ${moves.length}`);
  for (const m of moves) {
    console.log(`  ${relative(PROJECT_ROOT, m.src)}  →  ${relative(PROJECT_ROOT, m.dst)}`);
  }

  if (collisions.length) {
    console.error('');
    console.error(`${label} ABORTING — ${collisions.length} collision(s):`);
    for (const c of collisions) console.error(`  ${relative(PROJECT_ROOT, c.dst)}`);
    process.exit(2);
  }

  // Load manifest + find affected entries
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const data = JSON.parse(raw);
  const toPatch = (data.items || []).filter(
    it => typeof it.local_path === 'string' && it.local_path.startsWith('public/assets/sfx/_inbox/')
  );
  console.log('');
  console.log(`${label} manifest entries with _inbox/ local_path: ${toPatch.length}`);

  if (moves.length !== toPatch.length) {
    console.error('');
    console.error(`${label} WARNING: file count (${moves.length}) != manifest count (${toPatch.length}).`);
    console.error('  This is usually safe (hand-picked library files have no manifest entry),');
    console.error('  but worth a human eyeball before --apply.');
  }

  if (!apply) {
    console.log('');
    console.log(`${label} pass --apply to execute the moves and patch MANIFEST.`);
    return;
  }

  // APPLY
  await mkdir(LIBRARY_ROOT, { recursive: true });
  for (const cat of CATEGORIES) {
    await mkdir(join(LIBRARY_ROOT, cat), { recursive: true });
  }

  let moved = 0;
  for (const m of moves) {
    await rename(m.src, m.dst);
    moved++;
  }
  console.log(`${label} moved ${moved} files.`);

  // Patch manifest paths — derive from filename so hand-run local_path strings stay consistent.
  let patched = 0;
  for (const it of toPatch) {
    const old = it.local_path;
    // public/assets/sfx/_inbox/<cat>/<file> → public/assets/sfx/library/<cat>/<file>
    const next = old.replace('/sfx/_inbox/', '/sfx/library/');
    if (next !== old) {
      it.local_path = next;
      patched++;
    }
  }
  await writeFile(MANIFEST_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${label} patched ${patched} manifest local_path entries.`);

  // Remove now-empty _inbox/<cat>/ + _inbox/
  for (const cat of CATEGORIES) {
    const d = join(INBOX_ROOT, cat);
    try {
      const left = await readdir(d);
      if (left.length === 0) await rmdir(d);
      else console.warn(`  ${relative(PROJECT_ROOT, d)} not empty (${left.length} left) — kept.`);
    } catch {}
  }
  try {
    const left = await readdir(INBOX_ROOT);
    if (left.length === 0) {
      await rmdir(INBOX_ROOT);
      console.log(`${label} removed empty _inbox/.`);
    } else {
      console.warn(`${label} _inbox/ not empty (${left.length} left) — kept.`);
    }
  } catch {}
}

main().catch(e => { console.error(e); process.exit(1); });
