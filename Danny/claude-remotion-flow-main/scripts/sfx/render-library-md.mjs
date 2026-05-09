#!/usr/bin/env node
/**
 * Render LIBRARY.md from MANIFEST.json.
 *
 * Human-readable sign-off sheet. One section per category, sorted
 * shortlisted-desc then duration-asc. Music is sub-grouped by subcategory.
 * Pipes in text are escaped so GitHub/VS Code render cleanly.
 *
 * Usage:
 *   node scripts/sfx/render-library-md.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'public/assets/sfx/MANIFEST.json');
const OUT_PATH = resolve(PROJECT_ROOT, 'public/assets/sfx/LIBRARY.md');

const CATEGORY_ORDER = ['transitions', 'stingers', 'risers', 'impacts', 'ambience', 'music'];

function escapePipes(s) {
  return String(s ?? '').replace(/\|/g, '\\|');
}

function durationKey(d) {
  if (!d || typeof d !== 'string') return Infinity;
  const m = d.match(/(\d+):(\d{2})/);
  if (!m) return Infinity;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function truncate(s, n) {
  const str = String(s ?? '');
  return str.length <= n ? str : str.slice(0, n - 1) + '…';
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (!!a.shortlisted !== !!b.shortlisted) return a.shortlisted ? -1 : 1;
    return durationKey(a.duration) - durationKey(b.duration);
  });
}

function renderRows(items) {
  return items.map((it, i) => {
    const mood = Array.isArray(it.mood) && it.mood.length ? it.mood.join(', ') : '—';
    const tags = Array.isArray(it.tags) && it.tags.length ? truncate(it.tags.slice(0, 4).join(', '), 40) : '—';
    const shortlisted = it.shortlisted ? '⭐' : '';
    const notes = it.notes ? truncate(it.notes, 30) : '';
    return `| ${i + 1} | ${escapePipes(truncate(it.title ?? '—', 40))} | ${escapePipes(truncate(it.author ?? '—', 20))} | ${it.duration ?? '—'} | ${escapePipes(mood)} | ${escapePipes(tags)} | ${shortlisted} | ${escapePipes(notes)} |`;
  });
}

function renderTable(items) {
  return [
    '| # | Title | Author | Duration | Mood | Tags | ⭐ | Notes |',
    '|---|-------|--------|----------|------|------|---|-------|',
    ...renderRows(items),
    '',
  ].join('\n');
}

function renderCategory(name, items) {
  const sorted = sortItems(items);
  const shortlistedCount = sorted.filter(s => s.shortlisted).length;

  if (name === 'music') {
    const bySub = new Map();
    for (const it of sorted) {
      const sub = it.subcategory || 'unsorted';
      if (!bySub.has(sub)) bySub.set(sub, []);
      bySub.get(sub).push(it);
    }
    const parts = [
      `## ${name} (${sorted.length} files · ${shortlistedCount} shortlisted)`,
      '',
    ];
    for (const [sub, subItems] of bySub) {
      parts.push(`### ${sub} (${subItems.length})`);
      parts.push('');
      parts.push(renderTable(subItems));
    }
    return parts.join('\n');
  }

  return [
    `## ${name} (${sorted.length} files · ${shortlistedCount} shortlisted)`,
    '',
    renderTable(sorted),
  ].join('\n');
}

async function main() {
  const data = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const items = data.items ?? [];

  const byCat = new Map();
  for (const cat of CATEGORY_ORDER) byCat.set(cat, []);
  for (const it of items) {
    const cat = it.category || 'uncategorised';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(it);
  }

  const total = items.length;
  const totalShortlisted = items.filter(i => i.shortlisted).length;
  const capturedAt = new Date().toISOString();

  const header = [
    '# SFX + Music Library — sign-off sheet',
    '',
    `> Generated ${capturedAt.slice(0, 19).replace('T', ' ')} UTC from MANIFEST.json.`,
    `> **${total} files · ${totalShortlisted} shortlisted** across ${byCat.size} categories.`,
    '> Re-run \`node scripts/sfx/render-library-md.mjs\` after curation to refresh.',
    '',
    '---',
    '',
  ].join('\n');

  const sections = [];
  for (const [cat, its] of byCat) {
    if (its.length === 0) continue;
    sections.push(renderCategory(cat, its));
  }

  const md = header + sections.join('\n');
  await writeFile(OUT_PATH, md, 'utf8');
  console.log(`wrote ${OUT_PATH}`);
  console.log(`  categories: ${byCat.size}`);
  console.log(`  total: ${total}`);
  console.log(`  shortlisted: ${totalShortlisted}`);
}

main().catch(e => { console.error(e); process.exit(1); });
