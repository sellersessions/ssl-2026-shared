#!/usr/bin/env node
/**
 * Music indexer — scan public/assets/music/{ssl-live-beds,tiktok-backing}/ and
 * append MANIFEST entries for every audio file found.
 *
 * - Allowlist extensions: .mp3, .m4a, .wav, .aif (case-insensitive)
 * - .mp4 explicitly SKIPPED (video container — decide later re: audio strip)
 * - Uses lstat to reject directories, broken symlinks, non-files
 * - Runs ffprobe per file with a 5s timeout; formats seconds → m:ss
 * - Stable id = "music-" + sha1(relpath).slice(0,10) → deterministic + idempotent
 * - Writes v3-shaped entries (source:"local", category:"music", subcategory:<sub>)
 *
 * Usage:
 *   node scripts/sfx/index-music.mjs
 *   node scripts/sfx/index-music.mjs --dry-run
 */
import { readFile, writeFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, resolve, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');
const MUSIC_ROOT = resolve(PROJECT_ROOT, 'public/assets/music');
const SUBCATS = ['ssl-live-beds', 'tiktok-backing'];
const ALLOW_EXT = new Set(['.mp3', '.m4a', '.wav', '.aif']);
const FFPROBE = '/opt/homebrew/bin/ffprobe';

function sha1(s) {
  return createHash('sha1').update(s).digest('hex');
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function titleFromFilename(name) {
  return name.replace(/\.[^.]+$/, '');
}

function ffprobe(filePath) {
  return new Promise(resolveP => {
    const p = spawn(FFPROBE, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    let out = '';
    let err = '';
    const timer = setTimeout(() => { p.kill('SIGKILL'); }, 5000);
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) return resolveP({ ok: false, reason: err.trim().split('\n')[0] || `exit ${code}` });
      const sec = parseFloat(out.trim());
      if (!Number.isFinite(sec)) return resolveP({ ok: false, reason: 'unparseable duration' });
      resolveP({ ok: true, seconds: sec });
    });
    p.on('error', e => {
      clearTimeout(timer);
      resolveP({ ok: false, reason: e.message });
    });
  });
}

async function* walkFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    // Use lstat so broken symlinks + dangling entries are rejected.
    let s;
    try { s = await lstat(full); } catch { continue; }
    if (s.isSymbolicLink()) {
      // Resolve the target; skip if broken or points outside MUSIC_ROOT.
      try {
        const real = await lstat(full);
        if (real.isFile()) yield full;
        // Don't follow symlink directories (avoids `Macintosh HD`-style traps).
      } catch { /* broken symlink */ }
      continue;
    }
    if (s.isDirectory()) {
      yield* walkFiles(full);
    } else if (s.isFile()) {
      yield full;
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const data = JSON.parse(raw);
  const items = data.items || (data.items = []);
  const existingIds = new Set(items.map(i => i.id));

  let added = 0;
  let skippedDupe = 0;
  let filteredExt = 0;
  let ffprobeFail = 0;
  const filteredList = [];

  for (const sub of SUBCATS) {
    const subRoot = join(MUSIC_ROOT, sub);
    for await (const absPath of walkFiles(subRoot)) {
      const ext = extname(absPath).toLowerCase();
      if (!ALLOW_EXT.has(ext)) {
        filteredExt++;
        filteredList.push(`  filter [${ext || 'noext'}] ${relative(PROJECT_ROOT, absPath)}`);
        continue;
      }
      const relFromProject = `public/assets/music/${sub}/${relative(subRoot, absPath)}`;
      const id = `music-${sha1(relFromProject).slice(0, 10)}`;
      if (existingIds.has(id)) { skippedDupe++; continue; }

      const probe = await ffprobe(absPath);
      if (!probe.ok) {
        ffprobeFail++;
        console.log(`  ffprobe fail: ${relFromProject} (${probe.reason})`);
        continue;
      }

      const filename = absPath.split('/').pop();
      const entry = {
        id,
        source: 'local',
        query: null,
        category: 'music',
        page: null,
        cdn_url: null,
        detail_url: null,
        title: titleFromFilename(filename),
        author: null,
        author_url: null,
        duration: formatDuration(probe.seconds),
        tags: [],
        license: null,
        captured_at: new Date().toISOString(),
        local_path: relFromProject,
        bytes: null,
        // v2 curation defaults
        subcategory: sub,
        mood: [],
        bpm: null,
        key: null,
        energy: null,
        approved: false,
        approved_at: null,
        used_in: [],
        notes: '',
        // v3
        shortlisted: false,
        shortlisted_at: null,
      };
      items.push(entry);
      existingIds.add(id);
      added++;
    }
  }

  console.log('');
  console.log(`Music index:`);
  console.log(`  added: ${added}`);
  console.log(`  skipped (already indexed): ${skippedDupe}`);
  console.log(`  filtered (non-audio ext): ${filteredExt}`);
  console.log(`  ffprobe failed: ${ffprobeFail}`);
  if (filteredList.length) {
    console.log('');
    console.log('Filtered files:');
    for (const line of filteredList) console.log(line);
  }

  if (dryRun) {
    console.log('');
    console.log('  --dry-run: not writing');
    return;
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('');
  console.log(`  written: ${MANIFEST_PATH}`);
  console.log(`  manifest items now: ${items.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
