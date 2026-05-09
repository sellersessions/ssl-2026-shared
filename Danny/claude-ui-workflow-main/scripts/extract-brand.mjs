#!/usr/bin/env node
/**
 * Brand-token extractor — regional DOM sampler.
 *
 * Loads a URL, identifies structural regions (nav, hero, primary buttons,
 * body text, footer), and samples computed styles from each. Outputs raw
 * signal JSON for the ingest orchestrator to map into the tokens.json shape.
 *
 * Usage:
 *   node scripts/extract-brand.mjs <url>
 *   node scripts/extract-brand.mjs <url> --json   # JSON only, no human banner
 */

import { chromium } from 'playwright';

const URL_ARG = process.argv[2];
const JSON_ONLY = process.argv.includes('--json');

if (!URL_ARG) {
  console.error('usage: extract-brand.mjs <url> [--json]');
  process.exit(1);
}

function rgbToHex(rgb, baseBg = null) {
  if (!rgb) return null;
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  let [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  if (a === 0) return null;
  // Composite over base bg if provided (for rgba(255,255,255,0.7) on dark bg → actual visual colour)
  if (a < 1 && baseBg) {
    const bm = baseBg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (bm) {
      const [br, bg, bb] = [parseInt(bm[1]), parseInt(bm[2]), parseInt(bm[3])];
      r = Math.round(r * a + br * (1 - a));
      g = Math.round(g * a + bg * (1 - a));
      b = Math.round(b * a + bb * (1 - a));
    }
  }
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('').toLowerCase();
}

function rgbToHsl(rgb) {
  if (!rgb) return null;
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  let r = parseInt(m[1]) / 255, g = parseInt(m[2]) / 255, b = parseInt(m[3]) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();

  if (!JSON_ONLY) console.error(`> loading ${URL_ARG}`);
  try {
    await page.goto(URL_ARG, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 500));
    });
  } catch (e) {
    if (!JSON_ONLY) console.error(`> goto warning: ${e.message.split('\n')[0]} — continuing`);
  }

  const signal = await page.evaluate(() => {
    const result = {};

    const cs = (el) => el ? getComputedStyle(el) : null;
    const visible = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    // Walk up parents until an element with an opaque background, or hit body.
    const opaqueBg = (el) => {
      let cur = el;
      while (cur && cur !== document.body) {
        const bg = getComputedStyle(cur).backgroundColor;
        const m = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) {
          const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
          if (a > 0.5) return { bg, source: cur.tagName.toLowerCase() + (cur.className ? '.' + String(cur.className).split(' ')[0] : '') };
        }
        // Also check for background-image (gradients, hero images)
        const bgImg = getComputedStyle(cur).backgroundImage;
        if (bgImg && bgImg !== 'none') {
          return { bg: bgImg, source: cur.tagName.toLowerCase() + ' (image)', is_image: true };
        }
        cur = cur.parentElement;
      }
      return { bg: getComputedStyle(document.body).backgroundColor, source: 'body' };
    };

    // ─── identity ──────────────────────────────────────────────
    result.identity = {
      title: document.title,
      og_site_name: document.querySelector('meta[property="og:site_name"]')?.content || null,
      og_title: document.querySelector('meta[property="og:title"]')?.content || null,
      description: document.querySelector('meta[name="description"]')?.content || null,
      theme_color: document.querySelector('meta[name="theme-color"]')?.content || null,
      hostname: location.hostname,
    };

    // ─── theme.mode ────────────────────────────────────────────
    // Multi-sample heuristic (fix #14): single body-bg luminance check
    // misclassifies light themes that have a transparent body bg or a dark
    // overlay element high in the DOM. Sample multiple large bg-painted
    // regions by area and let the majority by area win.
    const bodyBg = cs(document.body).backgroundColor;
    result.body_bg = bodyBg;

    const lumOf = (rgbStr) => {
      const m = rgbStr && rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a < 0.5) return null; // transparent — not a usable signal
      const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    // Sample 1: html element bg (catches transparent body case)
    const htmlBg = cs(document.documentElement).backgroundColor;
    // Sample 2-4: largest visible bg-painted div/section/main blocks by area
    const areaSamples = [];
    for (const el of document.querySelectorAll('html, body, main, section, div')) {
      const r = el.getBoundingClientRect();
      if (r.width < 600 || r.height < 200) continue;
      const ebg = cs(el).backgroundColor;
      const lum = lumOf(ebg);
      if (lum === null) continue;
      areaSamples.push({ bg: ebg, lum, area: r.width * r.height });
      if (areaSamples.length >= 80) break;
    }
    // Weight by area, vote on light vs dark
    let lightArea = 0, darkArea = 0;
    for (const s of areaSamples) {
      if (s.lum > 0.5) lightArea += s.area;
      else darkArea += s.area;
    }

    const bodyLum = lumOf(bodyBg);
    const htmlLum = lumOf(htmlBg);
    if (lightArea + darkArea > 0) {
      // area-weighted majority wins
      result.theme_mode = lightArea >= darkArea ? 'light' : 'dark';
      result.theme_mode_source = 'area-weighted majority';
      result.theme_mode_evidence = {
        light_area: Math.round(lightArea),
        dark_area: Math.round(darkArea),
        body_bg_luminance: bodyLum,
        html_bg_luminance: htmlLum,
        samples_taken: areaSamples.length,
      };
    } else if (bodyLum !== null) {
      result.theme_mode = bodyLum > 0.5 ? 'light' : 'dark';
      result.theme_mode_source = 'body bg fallback';
      result.body_bg_luminance = bodyLum;
    } else if (htmlLum !== null) {
      result.theme_mode = htmlLum > 0.5 ? 'light' : 'dark';
      result.theme_mode_source = 'html bg fallback';
    }

    // ─── nav region (top 100px, look for header/nav) ───────────
    const navCandidate =
      document.querySelector('header') ||
      document.querySelector('nav') ||
      document.querySelector('[role="banner"]') ||
      document.querySelector('.header, .site-header, .navbar, .nav');
    if (navCandidate && visible(navCandidate)) {
      const ncs = cs(navCandidate);
      const navBg = opaqueBg(navCandidate);
      result.nav = {
        bg: navBg.bg,
        bg_source: navBg.source,
        bg_is_image: navBg.is_image || false,
        text_color: ncs.color,
        font_family: ncs.fontFamily,
        height: navCandidate.getBoundingClientRect().height,
        tag: navCandidate.tagName.toLowerCase(),
      };
    }

    // ─── hero region (first big section after nav) ─────────────
    const main = document.querySelector('main') || document.body;
    let heroEl = null;
    for (const child of main.children) {
      if (!visible(child)) continue;
      const r = child.getBoundingClientRect();
      if (r.height > 200 && r.width > 600) {
        heroEl = child;
        break;
      }
    }
    if (heroEl) {
      const hcs = cs(heroEl);
      const heroBg = opaqueBg(heroEl);
      result.hero = {
        bg: heroBg.bg,
        bg_source: heroBg.source,
        bg_is_image: heroBg.is_image || false,
        text_color: hcs.color,
        height: heroEl.getBoundingClientRect().height,
      };
    }

    // ─── primary button (buttons + anchors styled as CTA) ──────
    // Fix #15: primary role assignment is frequency × visual prominence,
    // not first-button-found. We score by count × avg-area × above-fold-weight
    // so a frequently-repeated, large, above-fold button wins over a one-off
    // accent pill near the top of the DOM. Also broadens the selector net to
    // catch anchors-styled-as-buttons by computed style (padding + bg + radius).
    const explicitBtn = [
      ...document.querySelectorAll([
        'button',
        'a.btn', 'a.button',
        'a[class*="btn-"]', 'a[class*="button-"]',
        'a[class*="Button"]',
        '[class*="cta"]',
        '[class*="CTA"]',
        '[class*="Cta"]',
        '.elementor-button',
        '.wp-block-button__link',
        '[role="button"]',
        'a[class*="shop"]',
        'a[class*="Shop"]',
        'input[type="submit"]',
        'input[type="button"]',
      ].join(',')),
    ];
    // Heuristic catch: anchors with padding + non-transparent bg + border-radius
    // (most "anchor styled as button" cases that the explicit selectors miss)
    const heuristicBtn = [...document.querySelectorAll('a')].filter(el => {
      const ecs = cs(el);
      const bg = ecs.backgroundColor;
      const bm = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!bm) return false;
      const a = bm[4] !== undefined ? parseFloat(bm[4]) : 1;
      if (a < 0.5) return false;
      const padY = parseFloat(ecs.paddingTop) + parseFloat(ecs.paddingBottom);
      const padX = parseFloat(ecs.paddingLeft) + parseFloat(ecs.paddingRight);
      // Button-shaped: meaningful padding (not just inline link)
      return padY >= 12 && padX >= 16;
    });
    const btnCandidates = [...new Set([...explicitBtn, ...heuristicBtn])].filter(visible);

    const viewportH = window.innerHeight || 900;
    const btnSamples = [];
    for (const el of btnCandidates.slice(0, 120)) {
      const ecs = cs(el);
      const bg = ecs.backgroundColor;
      const fg = ecs.color;
      const r = el.getBoundingClientRect();
      const bgM = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!bgM) continue;
      const a = bgM[4] !== undefined ? parseFloat(bgM[4]) : 1;
      if (a < 0.5) continue;
      const area = Math.round(r.width * r.height);
      // Fold position: docTop relative to viewport. Above-fold = boost.
      const docTop = r.top + window.scrollY;
      const aboveFold = docTop < viewportH;
      btnSamples.push({
        bg, fg,
        font: ecs.fontFamily,
        weight: ecs.fontWeight,
        text: el.textContent.trim().slice(0, 40),
        area,
        above_fold: aboveFold,
        doc_top: Math.round(docTop),
      });
    }

    // Group by bg colour. For each group: count, total_area, avg_area,
    // above-fold count. Score = count × log(avg_area+1) × (1 + 0.5 × above_fold_ratio).
    const groups = new Map();
    for (const b of btnSamples) {
      let g = groups.get(b.bg);
      if (!g) {
        g = { bg: b.bg, count: 0, total_area: 0, above_fold: 0, samples: [] };
        groups.set(b.bg, g);
      }
      g.count++;
      g.total_area += b.area;
      if (b.above_fold) g.above_fold++;
      g.samples.push(b);
    }
    const ranked = [...groups.values()].map(g => {
      const avg_area = g.total_area / g.count;
      const fold_ratio = g.above_fold / g.count;
      const score = g.count * Math.log(avg_area + 1) * (1 + 0.5 * fold_ratio);
      return { ...g, avg_area: Math.round(avg_area), fold_ratio, score };
    }).sort((a, b) => b.score - a.score);

    const primaryGroup = ranked[0];
    result.primary_button = primaryGroup ? primaryGroup.samples[0] : null;
    result.button_bg_distribution = ranked.slice(0, 5).map(g => ({
      bg: g.bg,
      count: g.count,
      avg_area: g.avg_area,
      above_fold: g.above_fold,
      fold_ratio: Math.round(g.fold_ratio * 100) / 100,
      score: Math.round(g.score),
    }));
    result.button_scoring_method = 'count × log(avg_area+1) × (1 + 0.5 × above_fold_ratio)';

    // ─── headings (h1, h2, h3) ─────────────────────────────────
    const headingFonts = new Map();
    for (const el of document.querySelectorAll('h1, h2, h3')) {
      if (!visible(el)) continue;
      const f = cs(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      headingFonts.set(f, (headingFonts.get(f) || 0) + 1);
    }
    result.heading_fonts = [...headingFonts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([font, count]) => ({ font, count }));

    // ─── body text (p, li under main) ──────────────────────────
    const SYSTEM_FONTS = new Set([
      '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI',
      'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif',
      'serif', 'monospace', 'Apple Color Emoji', 'Segoe UI Emoji',
    ]);
    const bodyFonts = new Map();
    const bodyColors = new Map();
    const bodyScope = main.querySelectorAll('p, li, blockquote, dd, dt, figcaption');
    let scanned = 0;
    for (const el of bodyScope) {
      if (scanned > 800) break;
      if (!visible(el)) continue;
      const t = el.textContent.trim();
      if (t.length < 10) continue;
      if (el.querySelector('p, li, h1, h2, h3, h4')) continue;
      const ecs = cs(el);
      // Walk the font-family stack and take the first non-system font.
      const stack = ecs.fontFamily.split(',').map(s => s.replace(/['"]/g, '').trim());
      const nonSystem = stack.find(s => !SYSTEM_FONTS.has(s));
      // Skip elements with only system fonts — they aren't brand signal.
      if (!nonSystem) {
        scanned++;
        bodyColors.set(ecs.color, (bodyColors.get(ecs.color) || 0) + 1);
        continue;
      }
      bodyFonts.set(nonSystem, (bodyFonts.get(nonSystem) || 0) + 1);
      bodyColors.set(ecs.color, (bodyColors.get(ecs.color) || 0) + 1);
      scanned++;
    }
    result.body_fonts = [...bodyFonts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([font, count]) => ({ font, count }));
    result.body_text_colors = [...bodyColors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));

    // ─── footer ────────────────────────────────────────────────
    const footer = document.querySelector('footer, [role="contentinfo"]');
    if (footer && visible(footer)) {
      const fcs = cs(footer);
      result.footer = { bg: fcs.backgroundColor, text_color: fcs.color };
    }

    // ─── all non-bg, non-transparent background colours (broader net) ────
    // Catches container backgrounds the class-based card heuristic misses.
    const allBgs = new Map();
    let bgScanned = 0;
    for (const el of document.querySelectorAll('div, section, article, aside, main, header, footer')) {
      if (bgScanned > 2500) break;
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 80 || r.height < 60) continue;
      const ebg = cs(el).backgroundColor;
      const bm = ebg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!bm) continue;
      const a = bm[4] !== undefined ? parseFloat(bm[4]) : 1;
      if (a < 0.5) continue;
      allBgs.set(ebg, (allBgs.get(ebg) || 0) + 1);
      bgScanned++;
    }
    result.all_container_bgs = [...allBgs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bg, count]) => ({ bg, count }));

    // ─── border colours ───────────────────────────────────────
    const borders = new Map();
    let borderScanned = 0;
    for (const el of document.querySelectorAll('*')) {
      if (borderScanned > 3000) break;
      if (!visible(el)) continue;
      const ecs = cs(el);
      // Only count actual rendered borders, not 0-width
      const bw = parseFloat(ecs.borderTopWidth) || parseFloat(ecs.borderBottomWidth) || 0;
      if (bw < 0.5) continue;
      const bc = ecs.borderTopColor || ecs.borderBottomColor;
      const bm = bc.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!bm) continue;
      const a = bm[4] !== undefined ? parseFloat(bm[4]) : 1;
      if (a < 0.3) continue;
      borders.set(bc, (borders.get(bc) || 0) + 1);
      borderScanned++;
    }
    result.border_colors = [...borders.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));

    // ─── card backgrounds (cards are visual containers distinct from page bg) ─
    const cardCandidates = [...document.querySelectorAll([
      '[class*="card"]',
      '[class*="Card"]',
      'article',
      '[class*="tile"]',
      '[class*="panel"]',
    ].join(','))].filter(visible);
    const cardBgs = new Map();
    for (const el of cardCandidates.slice(0, 100)) {
      const bg = cs(el).backgroundColor;
      const r = el.getBoundingClientRect();
      if (r.width < 100 || r.height < 80) continue;
      const m = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) continue;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (a < 0.1) continue;
      cardBgs.set(bg, (cardBgs.get(bg) || 0) + 1);
    }
    result.card_bgs = [...cardBgs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bg, count]) => ({ bg, count }));

    // ─── sampled section backgrounds via opaque parent walk ───
    const sectionBgs = [];
    const seen = new Set();
    const sections = main.querySelectorAll([
      'section',
      '[class*="section"]',
      '[class*="banner"]',
      '[class*="hero"]',
      '[class*="callout"]',
      '.elementor-section',
      '.elementor-top-section',
      '.wp-block-group',
      '[data-section-type]',
    ].join(','));
    for (const sec of sections) {
      if (!visible(sec)) continue;
      const r = sec.getBoundingClientRect();
      if (r.height < 100) continue;
      const sb = opaqueBg(sec);
      const key = sb.bg;
      if (!seen.has(key)) {
        seen.add(key);
        sectionBgs.push({ bg: sb.bg, source: sb.source, is_image: sb.is_image || false, height: r.height });
      }
      if (sectionBgs.length >= 8) break;
    }
    result.section_bgs = sectionBgs;

    // ─── decorative palette signal (fix #16) ──────────────────
    // SVG fills + stroke colours that aren't part of core palette. Catches
    // illustrative motifs (petals, blobs, line-work) the container-bg scan
    // misses because they're <path> elements, not div backgrounds.
    const svgColors = new Map();
    let svgScanned = 0;
    for (const el of document.querySelectorAll('svg path, svg circle, svg rect, svg polygon, svg ellipse, svg [fill], svg [stroke]')) {
      if (svgScanned > 500) break;
      const ecs = cs(el);
      const fill = el.getAttribute('fill') || ecs.fill;
      const stroke = el.getAttribute('stroke') || ecs.stroke;
      for (const colour of [fill, stroke]) {
        if (!colour || colour === 'none' || colour === 'currentColor' || colour === 'transparent') continue;
        const m = colour.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) continue;
        const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        // Skip near-black/near-white/near-grey
        if (Math.max(r, g, b) - Math.min(r, g, b) < 20) continue;
        if (Math.max(r, g, b) > 240 || Math.min(r, g, b) < 15) continue;
        const hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('').toLowerCase();
        svgColors.set(hex, (svgColors.get(hex) || 0) + 1);
      }
      svgScanned++;
    }
    result.svg_decorative_colors = [...svgColors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hex, count]) => ({ hex, count }));

    // Texture/bg-image hint: count elements with non-none background-image
    // and tag whether any look like noise/grain/pattern (data URI or repeating-pattern in url())
    let bgImageCount = 0;
    let dataUriBgCount = 0;
    let scannedBgImage = 0;
    for (const el of document.querySelectorAll('body, main, section, div, header')) {
      if (scannedBgImage > 800) break;
      const bgImg = cs(el).backgroundImage;
      if (!bgImg || bgImg === 'none') continue;
      bgImageCount++;
      if (bgImg.includes('data:image')) dataUriBgCount++;
      scannedBgImage++;
    }
    result.bg_image_signal = {
      total: bgImageCount,
      data_uri: dataUriBgCount,
      // data-uri bg-images on body/large sections are usually noise/grain textures
      likely_texture: dataUriBgCount > 0,
    };

    // ─── google fonts URL (parse <link> stylesheets) ──────────
    const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')]
      .map(l => l.href);
    result.google_fonts_links = fontLinks;

    return result;
  });

  // hex-normalise key fields. Composite rgba over body_bg so reported hexes
  // match what the user sees on screen, not the raw alpha-channel value.
  const norm = { ...signal };
  const baseBg = norm.body_bg;
  for (const key of ['nav', 'hero', 'footer']) {
    if (norm[key]) {
      norm[key].bg_hex = rgbToHex(norm[key].bg, baseBg);
      norm[key].text_color_hex = rgbToHex(norm[key].text_color, norm[key].bg || baseBg);
    }
  }
  if (norm.primary_button) {
    norm.primary_button.bg_hex = rgbToHex(norm.primary_button.bg, baseBg);
    norm.primary_button.fg_hex = rgbToHex(norm.primary_button.fg, norm.primary_button.bg || baseBg);
    norm.primary_button.bg_hsl = rgbToHsl(norm.primary_button.bg);
  }
  norm.body_bg_hex = rgbToHex(norm.body_bg);
  norm.section_bgs_hex = (norm.section_bgs || []).map(s => ({ ...s, bg_hex: rgbToHex(s.bg, baseBg) }));
  norm.body_text_colors_hex = (norm.body_text_colors || []).map(c => ({ ...c, hex: rgbToHex(c.color, baseBg) }));
  norm.button_bg_distribution_hex = (norm.button_bg_distribution || []).map(b => ({ ...b, hex: rgbToHex(b.bg, baseBg) }));
  norm.card_bgs_hex = (norm.card_bgs || []).map(c => ({ ...c, hex: rgbToHex(c.bg, baseBg) }));
  norm.all_container_bgs_hex = (norm.all_container_bgs || []).map(c => ({ ...c, hex: rgbToHex(c.bg, baseBg) }));
  norm.border_colors_hex = (norm.border_colors || []).map(c => ({ ...c, hex: rgbToHex(c.color, baseBg) }));

  await browser.close();

  if (JSON_ONLY) {
    console.log(JSON.stringify(norm, null, 2));
  } else {
    console.error('\n=== EXTRACTED BRAND SIGNAL ===');
    console.log(JSON.stringify(norm, null, 2));
  }
})();
