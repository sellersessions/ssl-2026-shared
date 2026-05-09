#!/usr/bin/env node --strip-types
/**
 * Shortlist → code helper — emits a TS module of typed SFX path constants
 * from MANIFEST.json entries marked `shortlisted: true`.
 *
 * Closes the 3/10 shortlist gap flagged in the Session 10 audit (was
 * manual copy/paste from the auditioner).
 *
 * Usage:
 *   node --strip-types scripts/sfx/shortlist-to-code.ts
 *
 * Flags:
 *   --manifest  Path to MANIFEST.json. Default: public/assets/sfx/MANIFEST.json
 *   --out       Output TS file. Default: src/explainer-shared/sfx-library.ts
 *   --dry-run   Print output to stdout instead of writing.
 *
 * Output module shape:
 *   export const SFX_TRANSITIONS = {
 *     WHOOSH_CINEMATIC: "assets/sfx/library/transitions/...mp3",
 *     ...
 *   } as const;
 *   export const SFX_STINGERS = { ... } as const;
 *   export const SFX_RISERS = { ... } as const;
 *   export const SFX_IMPACTS = { ... } as const;
 *   export const SFX_SHORTLIST = { ...all, flat index by id } as const;
 *
 * Paths are relative to public/ (what staticFile() expects).
 */
import { readFileSync, writeFileSync } from "node:fs";

type ManifestItem = {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  local_path: string;
  shortlisted: boolean;
  notes: string;
  author: string;
};

type Manifest = {
  schema_version: number;
  items: ManifestItem[];
};

type Args = {
  manifestPath: string;
  outPath: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};
  const flags = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags.add(key);
    } else {
      args[key] = next;
      i++;
    }
  }
  return {
    manifestPath: args.manifest ?? "public/assets/sfx/MANIFEST.json",
    outPath: args.out ?? "src/explainer-shared/sfx-library.ts",
    dryRun: flags.has("dry-run"),
  };
}

// Title → SCREAMING_SNAKE_CASE constant name. Keep it short and readable.
function toConstName(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

// Strip "public/" prefix — staticFile() resolves relative to public/.
function toStaticPath(localPath: string): string {
  return localPath.replace(/^public\//, "");
}

// De-dupe const names by appending an index suffix if a collision happens.
function uniqueName(taken: Set<string>, base: string): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}_${n}`)) n++;
  const picked = `${base}_${n}`;
  taken.add(picked);
  return picked;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = readFileSync(args.manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as Manifest;

  const shortlisted = manifest.items.filter((i) => i.shortlisted);
  if (shortlisted.length === 0) {
    process.stderr.write("No shortlisted items in manifest.\n");
    process.exit(1);
  }

  // Group by category.
  const byCat = new Map<string, ManifestItem[]>();
  for (const item of shortlisted) {
    const arr = byCat.get(item.category) ?? [];
    arr.push(item);
    byCat.set(item.category, arr);
  }

  const categoryOrder = [
    "transitions",
    "stingers",
    "risers",
    "impacts",
    "ambience",
    "music",
  ].filter((c) => byCat.has(c));
  for (const c of Array.from(byCat.keys())) {
    if (!categoryOrder.includes(c)) categoryOrder.push(c);
  }

  const lines: string[] = [];
  const ts = new Date().toISOString().slice(0, 10);
  lines.push(
    `// Generated from ${args.manifestPath} on ${ts}.`,
  );
  lines.push(
    `// ${shortlisted.length} shortlisted items across ${categoryOrder.length} categories.`,
  );
  lines.push(
    `// DO NOT EDIT BY HAND — regenerate with:`,
  );
  lines.push(
    `//   node --strip-types scripts/sfx/shortlist-to-code.ts`,
  );
  lines.push("");

  // Flat index keyed by manifest id — useful for callers that want to
  // thread through an item by its stable id rather than by name.
  const flatEntries: Array<{ id: string; path: string; title: string }> = [];

  for (const cat of categoryOrder) {
    const items = byCat.get(cat)!;
    const constName = `SFX_${cat.toUpperCase()}`;
    const taken = new Set<string>();
    lines.push(`export const ${constName} = {`);
    for (const item of items) {
      const key = uniqueName(taken, toConstName(item.title));
      const path = toStaticPath(item.local_path);
      lines.push(`  ${key}: ${JSON.stringify(path)},`);
      flatEntries.push({ id: item.id, path, title: item.title });
    }
    lines.push(`} as const;`);
    lines.push("");
  }

  // Flat id index.
  lines.push(`// Flat index by manifest id — stable across regeneration.`);
  lines.push(`export const SFX_SHORTLIST_BY_ID: Record<string, string> = {`);
  for (const e of flatEntries) {
    lines.push(
      `  ${JSON.stringify(e.id)}: ${JSON.stringify(e.path)}, // ${e.title}`,
    );
  }
  lines.push(`};`);
  lines.push("");

  const output = lines.join("\n");

  if (args.dryRun) {
    process.stdout.write(output);
    return;
  }

  writeFileSync(args.outPath, output, "utf-8");
  process.stdout.write(
    `wrote ${shortlisted.length} shortlisted items ` +
      `(${categoryOrder.length} categories) → ${args.outPath}\n`,
  );
}

try {
  main();
} catch (err) {
  process.stderr.write(
    `shortlist-to-code failed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}
