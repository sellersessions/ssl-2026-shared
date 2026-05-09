#!/usr/bin/env node
/**
 * F1 — Manifest integrity sweep.
 *
 * Walks public/assets/sfx/MANIFEST.json and verifies every item.local_path:
 *   - the file exists (stat)
 *   - the file is non-empty
 *   - ffprobe can read it (audio duration parses) — soft-skipped if ffprobe missing
 *
 * Exit codes:
 *   0 — clean (or only soft warnings)
 *   1 — at least one item is missing or corrupt
 *
 * Flags:
 *   --json           machine-readable report (no human summary)
 *   --quick          skip ffprobe; stat-only sweep
 *   --fix-prune      remove broken items from manifest (asks for confirmation
 *                    via stdin tty unless --yes is also passed)
 *   --yes            non-interactive: assume yes to prune
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = join(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');

const args = new Set(process.argv.slice(2));
const isJson = args.has('--json');
const isQuick = args.has('--quick');
const isFixPrune = args.has('--fix-prune');
const isYes = args.has('--yes');

function log(...x) { if (!isJson) console.log(...x); }
function err(...x) { console.error(...x); }

async function ffprobeAvailable() {
  return new Promise(resolve => {
    const p = spawn('ffprobe', ['-version'], { stdio: 'ignore' });
    p.on('error', () => resolve(false));
    p.on('close', code => resolve(code === 0));
  });
}

async function ffprobeDuration(filePath) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=nw=1:nk=1',
      filePath,
    ]);
    let out = '', errOut = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { errOut += d; });
    p.on('error', reject);
    p.on('close', code => {
      if (code !== 0) return reject(new Error(errOut.trim() || `ffprobe exit ${code}`));
      const dur = parseFloat(out.trim());
      if (!isFinite(dur) || dur <= 0) return reject(new Error('non-positive duration'));
      resolve(dur);
    });
  });
}

async function main() {
  const raw = await readFile(MANIFEST_PATH, 'utf8').catch(e => {
    err(`Cannot read manifest at ${MANIFEST_PATH}: ${e.message}`);
    process.exit(2);
  });
  const manifest = JSON.parse(raw);
  const items = manifest.items || [];
  const total = items.length;

  const useFfprobe = isQuick ? false : await ffprobeAvailable();
  if (!isQuick && !useFfprobe) log('• ffprobe not on PATH — falling back to stat-only sweep (use --quick to silence this).');

  const report = {
    total,
    missing: [],
    empty: [],
    unreadable: [],
    ok: 0,
    ffprobe: useFfprobe,
    manifest_path: MANIFEST_PATH,
    checked_at: new Date().toISOString(),
  };

  for (const item of items) {
    if (!item.local_path) {
      report.missing.push({ id: item.id, reason: 'no local_path field', title: item.title });
      continue;
    }
    const filePath = join(PROJECT_ROOT, item.local_path);
    let s;
    try {
      s = await stat(filePath);
    } catch {
      report.missing.push({ id: item.id, local_path: item.local_path, title: item.title });
      continue;
    }
    if (!s.isFile()) {
      report.missing.push({ id: item.id, local_path: item.local_path, title: item.title, reason: 'not a regular file' });
      continue;
    }
    if (s.size === 0) {
      report.empty.push({ id: item.id, local_path: item.local_path, title: item.title });
      continue;
    }
    if (useFfprobe) {
      try { await ffprobeDuration(filePath); }
      catch (e) {
        report.unreadable.push({ id: item.id, local_path: item.local_path, title: item.title, reason: e.message });
        continue;
      }
    }
    report.ok += 1;
  }

  const broken = report.missing.length + report.empty.length + report.unreadable.length;

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    log(`Manifest: ${MANIFEST_PATH}`);
    log(`Items checked: ${total}  ·  ok: ${report.ok}  ·  missing: ${report.missing.length}  ·  empty: ${report.empty.length}  ·  unreadable: ${report.unreadable.length}`);
    if (report.missing.length) {
      log('\nMISSING (file not on disk):');
      for (const m of report.missing) log(`  - ${m.id}  →  ${m.local_path || '(no local_path)'}  ·  ${m.title || ''}${m.reason ? '  [' + m.reason + ']' : ''}`);
    }
    if (report.empty.length) {
      log('\nEMPTY (zero bytes):');
      for (const m of report.empty) log(`  - ${m.id}  →  ${m.local_path}  ·  ${m.title || ''}`);
    }
    if (report.unreadable.length) {
      log('\nUNREADABLE (ffprobe rejected):');
      for (const m of report.unreadable) log(`  - ${m.id}  →  ${m.local_path}  ·  ${m.reason}`);
    }
  }

  if (isFixPrune && broken > 0) {
    if (!isYes) {
      log(`\n--fix-prune requested. ${broken} item(s) would be removed. Pass --yes to confirm without prompt.`);
      process.exit(broken > 0 ? 1 : 0);
    }
    const brokenIds = new Set([
      ...report.missing.map(m => m.id),
      ...report.empty.map(m => m.id),
      ...report.unreadable.map(m => m.id),
    ]);
    manifest.items = items.filter(i => !brokenIds.has(i.id));
    // Atomic write: copy → tmp → rename. Mid-write crash leaves the original
    // manifest intact rather than truncating it. .bak gives a one-step undo.
    const bakPath = MANIFEST_PATH + '.bak';
    const tmpPath = MANIFEST_PATH + '.tmp';
    await writeFile(bakPath, raw, 'utf8');
    await writeFile(tmpPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    const { rename } = await import('node:fs/promises');
    await rename(tmpPath, MANIFEST_PATH);
    log(`\nPruned ${brokenIds.size} broken item(s) from manifest. Backup at ${bakPath}. Re-run render-library-md.mjs if you want LIBRARY.md updated.`);
  }

  process.exit(broken > 0 ? 1 : 0);
}

main().catch(e => { err('manifest-doctor failed:', e.stack || e); process.exit(2); });
