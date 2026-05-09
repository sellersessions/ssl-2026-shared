#!/usr/bin/env node
/**
 * SFX + Music auditioner server — tiny Node HTTP + file-system bridge.
 *
 * Serves:
 *   GET  /                → auditioner/index.html
 *   GET  /audio/<path>    → public/assets/<path>  (MP3s/M4As for <audio>)
 *                           jail: must resolve under ASSETS_ROOT; traversal rejected
 *   GET  /api/manifest    → MANIFEST.json
 *   PATCH /api/item/:id   → merge WHITELISTED partial updates into the matching
 *                           item, write MANIFEST, regenerate LIBRARY.md.
 *                           Whitelist: shortlisted, notes, mood, subcategory.
 *                           Deprecated keys (approved, rejected) are silently
 *                           ignored so stale browser tabs can't resurrect them.
 *
 * No deps beyond Node stdlib. Launches on port 4747 (SFX on a dial pad).
 *
 * Usage:
 *   node scripts/sfx/auditioner/server.mjs
 *   npm run audition
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..');
const MANIFEST_PATH = join(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');
const ASSETS_ROOT = join(PROJECT_ROOT, 'public/assets');
const INDEX_HTML = join(__dirname, 'index.html');
const CUTTER_HTML = join(PROJECT_ROOT, 'tools/loop-cutter/index.html');
const PORT = Number(process.env.AUDITIONER_PORT || 4747);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
};

// PATCH whitelist — keys the browser is allowed to write. Everything else is
// silently dropped. Deprecated fields (approved/rejected/approved_at) are NOT
// here so stale tabs cannot resurrect them.
const PATCH_ALLOWED = new Set(['shortlisted', 'notes', 'mood', 'subcategory']);

let manifestLock = Promise.resolve();
async function withManifestLock(fn) {
  const prev = manifestLock;
  let release;
  manifestLock = new Promise(r => { release = r; });
  await prev;
  try { return await fn(); } finally { release(); }
}

async function readManifest() {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeManifest(data) {
  await writeFile(MANIFEST_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function regenerateLibraryMd() {
  return new Promise((res, rej) => {
    const p = spawn('node', [join(__dirname, '..', 'render-library-md.mjs')], { cwd: PROJECT_ROOT });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? res() : rej(new Error(`render-library-md ${code}: ${err}`)));
  });
}

async function serveFile(res, filePath, contentType) {
  try {
    const s = await stat(filePath);
    if (!s.isFile()) { res.writeHead(404); return res.end('not found'); }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': body.length });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}

// Serves audio with byte-range support so <audio> can scrub/seek mid-track
// without the browser re-downloading. No Range header → 200 with full body.
async function serveAudio(req, res, filePath, contentType) {
  let s;
  try { s = await stat(filePath); } catch { res.writeHead(404); return res.end('not found'); }
  if (!s.isFile()) { res.writeHead(404); return res.end('not found'); }
  const size = s.size;
  const range = req.headers.range;
  const baseHeaders = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  };
  if (!range) {
    res.writeHead(200, { ...baseHeaders, 'Content-Length': size });
    return createReadStream(filePath).pipe(res);
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
  let start = m[1] === '' ? 0 : parseInt(m[1], 10);
  let end = m[2] === '' ? size - 1 : parseInt(m[2], 10);
  if (isNaN(start) || isNaN(end) || start > end || end >= size) {
    res.writeHead(416, { 'Content-Range': `bytes */${size}` });
    return res.end();
  }
  res.writeHead(206, {
    ...baseHeaders,
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': end - start + 1,
  });
  createReadStream(filePath, { start, end }).pipe(res);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

async function readBody(req, maxBytes = 60 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > maxBytes) throw new Error(`body too large (>${maxBytes} bytes)`);
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

// Filename safety: strip characters that break shells / FS / URL routing.
// Keep ASCII letters, digits, space, dash, underscore, dot. Collapse runs.
function sanitiseFilename(s) {
  return (s || 'clip').replace(/[^a-zA-Z0-9 _.-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80) || 'clip';
}

function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const { pathname } = url;

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      return serveFile(res, INDEX_HTML, MIME['.html']);
    }

    // Loop Cutter mounted at /cutter/ — index + sibling assets in tools/loop-cutter.
    if (req.method === 'GET' && (pathname === '/cutter' || pathname === '/cutter/' || pathname === '/cutter/index.html')) {
      return serveFile(res, CUTTER_HTML, MIME['.html']);
    }
    if (req.method === 'GET' && pathname.startsWith('/cutter/')) {
      const rel = decodeURIComponent(pathname.slice('/cutter/'.length)).split('?')[0];
      // whitelist: only css/js siblings, no traversal
      if (!/^[\w.\-]+\.(css|js|map)$/.test(rel)) {
        res.writeHead(404); return res.end('not found');
      }
      const filePath = join(PROJECT_ROOT, 'tools/loop-cutter', rel);
      const contentType = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      return serveFile(res, filePath, contentType);
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/audio/')) {
      const rel = decodeURIComponent(pathname.slice('/audio/'.length));
      const filePath = normalize(join(ASSETS_ROOT, rel));
      // Must stay inside ASSETS_ROOT — blocks ../ traversal.
      if (filePath !== ASSETS_ROOT && !filePath.startsWith(ASSETS_ROOT + '/')) {
        res.writeHead(403); return res.end('forbidden');
      }
      const contentType = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      return serveAudio(req, res, filePath, contentType);
    }

    if (req.method === 'GET' && pathname === '/api/manifest') {
      const data = await readManifest();
      return json(res, 200, data);
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/item/')) {
      const id = decodeURIComponent(pathname.slice('/api/item/'.length));
      const patch = await readBody(req);
      const result = await withManifestLock(async () => {
        const data = await readManifest();
        const item = (data.items || []).find(i => i.id === id);
        if (!item) return { ok: false, reason: 'not_found' };
        const applied = {};
        const ignored = [];
        for (const [k, v] of Object.entries(patch)) {
          if (!PATCH_ALLOWED.has(k)) { ignored.push(k); continue; }
          applied[k] = v;
        }
        // Shortlist toggle records a timestamp so we can audit Danny's bookmarks.
        if ('shortlisted' in applied && applied.shortlisted !== item.shortlisted) {
          item.shortlisted_at = applied.shortlisted ? new Date().toISOString() : null;
        }
        Object.assign(item, applied);
        await writeManifest(data);
        return { ok: true, item, applied: Object.keys(applied), ignored };
      });
      if (result.ok) {
        regenerateLibraryMd().catch(e => console.error('render-library-md failed:', e.message));
      }
      return json(res, result.ok ? 200 : 404, result);
    }

    // Step 6 save-back: cutter POSTs a rendered WAV + metadata; server writes
    // the file under public/assets/music/cuts/, appends a manifest entry, and
    // regenerates LIBRARY.md. New clips auto-shortlist so they appear in the
    // shortlist dock immediately for round-trip feedback.
    //
    // Body: { wav_base64, source_id?, title?, in_s, out_s, bpm? }
    // Response: { ok, item } on success; { ok:false, reason } on failure.
    if (req.method === 'POST' && pathname === '/api/save-clip') {
      const body = await readBody(req);
      const { wav_base64, source_id, title, in_s, out_s, bpm } = body;
      if (!wav_base64 || typeof wav_base64 !== 'string') {
        return json(res, 400, { ok: false, reason: 'missing wav_base64' });
      }
      if (typeof in_s !== 'number' || typeof out_s !== 'number' || out_s <= in_s) {
        return json(res, 400, { ok: false, reason: 'invalid in_s/out_s' });
      }
      const wavBuf = Buffer.from(wav_base64, 'base64');
      if (wavBuf.length < 44) {
        return json(res, 400, { ok: false, reason: 'wav too small (header < 44 bytes)' });
      }

      const result = await withManifestLock(async () => {
        const data = await readManifest();
        const parent = source_id ? (data.items || []).find(i => i.id === source_id) : null;

        // Filename: <sanitised-base>--<inSec>-<outSec>--<unix-ms>.wav
        const baseTitle = title || (parent ? parent.title : 'clip');
        const inTag = in_s.toFixed(2).replace('.', 'p');
        const outTag = out_s.toFixed(2).replace('.', 'p');
        const stamp = Date.now();
        const fname = `${sanitiseFilename(baseTitle)}--${inTag}-${outTag}--${stamp}.wav`;
        const cutsDir = join(ASSETS_ROOT, 'music', 'cuts');
        await mkdir(cutsDir, { recursive: true });
        const filePath = join(cutsDir, fname);
        await writeFile(filePath, wavBuf);

        const id = `cut-${randomBytes(5).toString('hex')}`;
        const item = {
          id,
          source: 'loop-cutter',
          query: null,
          category: 'music',
          page: null,
          cdn_url: null,
          detail_url: null,
          title: title || (parent ? `${parent.title} · loop ${in_s.toFixed(2)}-${out_s.toFixed(2)}` : `clip ${in_s.toFixed(2)}-${out_s.toFixed(2)}`),
          author: null,
          author_url: null,
          duration: formatDuration(out_s - in_s),
          tags: [],
          license: null,
          local_path: `public/assets/music/cuts/${fname}`,
          subcategory: 'cuts',
          shortlisted: true,
          shortlisted_at: new Date().toISOString(),
          source_id: source_id || null,
          in_s,
          out_s,
          bpm: typeof bpm === 'number' && isFinite(bpm) && bpm > 0 ? bpm : null,
          created_at: new Date(stamp).toISOString(),
        };
        data.items = data.items || [];
        data.items.push(item);
        await writeManifest(data);
        return { ok: true, item };
      });

      if (result.ok) {
        regenerateLibraryMd().catch(e => console.error('render-library-md failed:', e.message));
      }
      return json(res, result.ok ? 200 : 500, result);
    }

    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error(e);
    json(res, 500, { ok: false, error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`SFX + Music auditioner running on http://localhost:${PORT}`);
  console.log(`  manifest: ${MANIFEST_PATH}`);
  console.log(`  audio:    ${ASSETS_ROOT}`);
  console.log(`  Ctrl+C to stop.`);
});
