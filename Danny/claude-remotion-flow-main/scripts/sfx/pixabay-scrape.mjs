#!/usr/bin/env node
/**
 * Pixabay SFX scraper — catalogues + downloads preview MP3s for a category.
 *
 * Flow:
 *   1. Launch visible Chromium (headless blocks hydration)
 *   2. For each page 1..N:
 *      - Load search URL with ?pagi=N
 *      - Scroll to materialise all ~20 audio rows
 *      - Intercept .mp3 requests via route-abort so we capture the URL
 *        without playing audio or wasting bandwidth
 *      - Click each play button in sequence, harvest metadata per row
 *   3. Second pass: curl each captured URL with Referer header → library/<category>/
 *   4. Append rows to MANIFEST.json (dedupe on id)
 *
 * Usage:
 *   node scripts/sfx/pixabay-scrape.mjs \
 *     --query whoosh --category transitions --pages 3
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { query: 'whoosh', category: 'transitions', pages: 3, headful: true, connect: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--query') opts.query = args[++i];
    else if (a === '--category') opts.category = args[++i];
    else if (a === '--pages') opts.pages = parseInt(args[++i], 10);
    else if (a === '--headless') opts.headful = false;
    else if (a === '--connect') opts.connect = args[++i];
  }
  return opts;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function idFromUrl(url) {
  // https://cdn.pixabay.com/audio/2025/07/30/audio_b3087a581e.mp3
  const m = url.match(/audio_([a-f0-9]+)\.mp3/);
  return m ? m[1] : null;
}

function idFromDetail(href) {
  // .../sound-effects/film-special-effects-simple-whoosh-382724/
  const m = href.match(/-(\d+)\/?$/);
  return m ? m[1] : null;
}

async function loadManifest(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { schema_version: 1, items: [] };
  }
}

async function downloadMp3(url, outPath, referer) {
  return new Promise((resolvePromise, rejectPromise) => {
    const p = spawn('curl', [
      '-sSL', '--fail',
      '-H', `Referer: ${referer}`,
      '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      '-o', outPath,
      url,
    ]);
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolvePromise() : rejectPromise(new Error(`curl ${code}: ${err}`)));
  });
}

async function scrape({ query, category, pages, headful, connect }) {
  const outDir = join(PROJECT_ROOT, 'public', 'assets', 'sfx', 'library', category);
  const manifestPath = join(PROJECT_ROOT, 'public', 'assets', 'sfx', 'MANIFEST.json');
  await mkdir(outDir, { recursive: true });
  const manifest = await loadManifest(manifestPath);
  const existingIds = new Set(manifest.items.map(i => i.id));

  let browser, ctx, page, connected = false;
  if (connect) {
    // CDP mode: attach to pre-launched automation browser (Desktop 2, port 9334).
    // Reuses the default browser context so it inherits the persistent profile.
    browser = await chromium.connectOverCDP(connect);
    connected = true;
    ctx = browser.contexts()[0] || await browser.newContext();
    page = await ctx.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
  } else {
    browser = await chromium.launch({ headless: !headful });
    ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1400, height: 900 },
    });
    page = await ctx.newPage();
  }

  // Track MP3 URL requested (one click → one URL). Abort so audio doesn't download.
  let latestMp3 = null;
  await page.route('**/*.mp3', async route => {
    const url = route.request().url();
    if (!url.includes('.png')) latestMp3 = url;
    await route.abort();
  });

  const harvested = [];

  for (let pg = 1; pg <= pages; pg++) {
    const searchUrl = pg === 1
      ? `https://pixabay.com/sound-effects/search/${encodeURIComponent(query)}/`
      : `https://pixabay.com/sound-effects/search/${encodeURIComponent(query)}/?pagi=${pg}`;
    console.log(`\n── Page ${pg}/${pages} ──  ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (pg === 1) {
      try { await page.click('button:has-text("Accept All")', { timeout: 3000 }); } catch {}
    }
    await page.waitForTimeout(3500);
    // Scroll to bottom to materialise all rows
    for (let s = 0; s < 6; s++) { await page.evaluate(() => window.scrollBy(0, 1400)); await page.waitForTimeout(500); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const rowHandles = await page.$$('.audioRow--nAm4Z');
    console.log(`  rows found: ${rowHandles.length}`);

    for (let i = 0; i < rowHandles.length; i++) {
      const row = rowHandles[i];
      // Scroll row into view then click the play overlay inside it
      try { await row.scrollIntoViewIfNeeded({ timeout: 2000 }); } catch {}
      await page.waitForTimeout(150);

      latestMp3 = null;
      const playBtn = await row.$('button.playOverlay--5uS0j');
      if (!playBtn) { console.log(`  [${i}] no play btn`); continue; }
      try {
        await playBtn.click({ timeout: 3000 });
      } catch (e) {
        console.log(`  [${i}] click err: ${e.message.split('\n')[0]}`); continue;
      }

      // Wait up to 2s for the MP3 request to fire
      const t0 = Date.now();
      while (!latestMp3 && Date.now() - t0 < 2000) { await page.waitForTimeout(100); }

      if (!latestMp3) { console.log(`  [${i}] no mp3 captured`); continue; }

      const meta = await row.evaluate(el => {
        const links = el.querySelectorAll('a');
        const detailLink = Array.from(links).find(a => /\/sound-effects\/[^/]+-\d+/.test(a.href));
        const authorLink = Array.from(links).find(a => /\/users\//.test(a.href));
        const tagsLinks = Array.from(links).filter(a => /\/sound-effects\/search\//.test(a.href)).map(a => a.textContent.trim());
        const durEl = el.querySelector('[class*="duration"], [class*="time"]');
        // Fallback: scan text for m:ss
        const text = el.innerText || el.textContent || '';
        const durMatch = text.match(/(\d+:\d{2})/);
        return {
          title: detailLink ? detailLink.textContent.trim() : null,
          detailUrl: detailLink ? detailLink.href : null,
          author: authorLink ? authorLink.textContent.trim() : null,
          authorUrl: authorLink ? authorLink.href : null,
          duration: durEl ? durEl.textContent.trim() : (durMatch ? durMatch[1] : null),
          tags: tagsLinks,
        };
      });

      const id = idFromUrl(latestMp3) || idFromDetail(meta.detailUrl || '') || `row-${pg}-${i}`;
      const record = {
        id: `pixabay-${id}`,
        source: 'pixabay',
        query,
        category,
        page: pg,
        cdn_url: latestMp3,
        detail_url: meta.detailUrl,
        title: meta.title,
        author: meta.author,
        author_url: meta.authorUrl,
        duration: meta.duration,
        tags: meta.tags,
        license: 'pixabay-content-license',
        captured_at: new Date().toISOString(),
      };
      harvested.push(record);
      console.log(`  [${i}] ${meta.title} · ${meta.author} · ${meta.duration}`);
    }
  }

  // When connected via CDP, don't close the shared browser — just the page/ctx we opened.
  if (connected) {
    await page.close().catch(() => {});
  } else {
    await browser.close();
  }

  console.log(`\n── Download pass: ${harvested.length} files ──`);
  let dlOk = 0, dlSkip = 0, dlFail = 0, bytesTotal = 0;
  for (const r of harvested) {
    if (existingIds.has(r.id)) { dlSkip++; continue; }
    const slugParts = [r.author, r.title, r.id.replace(/^pixabay-/, '')].filter(Boolean).map(slugify);
    const filename = `pixabay-${slugParts.join('-').slice(0, 90)}.mp3`;
    const outPath = join(outDir, filename);
    try {
      await downloadMp3(r.cdn_url, outPath, 'https://pixabay.com/');
      const s = await stat(outPath);
      r.local_path = `public/assets/sfx/library/${r.category}/${filename}`;
      r.bytes = s.size;
      bytesTotal += s.size;
      dlOk++;
      manifest.items.push(r);
      existingIds.add(r.id);
    } catch (e) {
      console.log(`  fail ${r.id}: ${e.message.split('\n')[0]}`);
      dlFail++;
    }
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('');
  console.log(`harvested: ${harvested.length}`);
  console.log(`downloaded: ${dlOk}   skipped(dupe): ${dlSkip}   failed: ${dlFail}`);
  console.log(`bytes: ${(bytesTotal / 1024).toFixed(1)} KB`);
  console.log(`manifest: ${manifestPath}`);
  console.log(`out: ${outDir}`);
}

const opts = parseArgs();
scrape(opts).catch(e => { console.error(e); process.exit(1); });
