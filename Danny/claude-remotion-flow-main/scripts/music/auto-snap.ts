#!/usr/bin/env node --strip-types
/**
 * Auto-snap helper — emits a BEAT_SNAP_FRAMES literal given an onset JSON
 * and a composition's natural scene-start array.
 *
 * Closes the 5/10 beat-detection gap flagged in the Session 10 audit.
 *
 * Usage:
 *   node --strip-types scripts/music/auto-snap.ts \
 *     --onsets scripts/music/output/stack-explainer-onsets.json \
 *     --scene-starts 0,120,330,630,870,1140,1380,1680,1920 \
 *     --window 25 \
 *     --label StackExplainer
 *
 * Flags:
 *   --onsets        Path to an onset JSON (produced by detect-onsets.py).
 *   --scene-starts  Comma-separated natural scene-start frames (absolute,
 *                   relative to visualStart — the output of computeTimeline).
 *   --window        Max |delta| between a scene start and an onset to
 *                   accept a snap. Default 25 (≈0.83s at 30fps).
 *   --label         Composition label for the report header.
 *   --min-strength  Minimum onset strength to consider. Default 0.
 *
 * Prints a diagnostic report followed by a paste-ready TS literal.
 *
 * Scene 0 never snaps (no prior scene to adjust).
 *
 * A snap is emitted only when:
 *   - The delta is within ±window frames.
 *   - The onset strength ≥ min-strength.
 *   - The onset hasn't already been consumed by an earlier scene (onsets
 *     are single-use to avoid two scenes snapping to the same beat).
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";

type Marker = { time_s: number; frame: number; strength: number };
type OnsetJson = {
  source: string;
  fps: number;
  comp_seconds: number;
  markers: Marker[];
};

type Args = {
  onsetsPath: string;
  sceneStarts: number[];
  window: number;
  label: string;
  minStrength: number;
};

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      args[key] = val;
      i++;
    }
  }
  const required = ["onsets", "scene-starts", "label"];
  for (const r of required) {
    if (!(r in args)) {
      throw new Error(`Missing required flag --${r}`);
    }
  }
  return {
    onsetsPath: args.onsets,
    sceneStarts: args["scene-starts"].split(",").map((s) => {
      const n = Number.parseInt(s.trim(), 10);
      if (Number.isNaN(n)) throw new Error(`Bad scene-start: "${s}"`);
      return n;
    }),
    window: args.window ? Number.parseInt(args.window, 10) : 25,
    label: args.label,
    minStrength: args["min-strength"]
      ? Number.parseFloat(args["min-strength"])
      : 0,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = readFileSync(args.onsetsPath, "utf-8");
  const onsetsJson = JSON.parse(raw) as OnsetJson;

  const onsets = onsetsJson.markers
    .filter((m) => m.strength >= args.minStrength)
    .map((m) => ({ ...m }));

  const consumed = new Set<number>();
  const snaps: (number | null)[] = [];
  const diagnostics: string[] = [];

  for (let i = 0; i < args.sceneStarts.length; i++) {
    const natural = args.sceneStarts[i];
    if (i === 0) {
      snaps.push(null);
      diagnostics.push(
        `  Scene ${i}: skipped (first scene never snaps).`,
      );
      continue;
    }

    // Find closest unconsumed onset within window.
    let best: Marker | null = null;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const m of onsets) {
      if (consumed.has(m.frame)) continue;
      const delta = Math.abs(m.frame - natural);
      if (delta > args.window) continue;
      if (delta < bestDelta) {
        bestDelta = delta;
        best = m;
      }
    }

    if (best) {
      consumed.add(best.frame);
      snaps.push(best.frame);
      const signedDelta = best.frame - natural;
      diagnostics.push(
        `  Scene ${i}: natural ${natural}f → onset ${best.frame}f ` +
          `(delta ${signedDelta > 0 ? "+" : ""}${signedDelta}, ` +
          `strength ${best.strength.toFixed(3)}) — SNAP`,
      );
    } else {
      snaps.push(null);
      // Report the nearest miss so the human can decide whether to widen
      // the window.
      let nearest: Marker | null = null;
      let nearestDelta = Number.POSITIVE_INFINITY;
      for (const m of onsets) {
        if (consumed.has(m.frame)) continue;
        const delta = Math.abs(m.frame - natural);
        if (delta < nearestDelta) {
          nearestDelta = delta;
          nearest = m;
        }
      }
      if (nearest) {
        const signedDelta = nearest.frame - natural;
        diagnostics.push(
          `  Scene ${i}: natural ${natural}f — nearest onset ${nearest.frame}f ` +
            `(delta ${signedDelta > 0 ? "+" : ""}${signedDelta}, outside ±${args.window}). null.`,
        );
      } else {
        diagnostics.push(
          `  Scene ${i}: natural ${natural}f — no remaining onsets. null.`,
        );
      }
    }
  }

  const snapCount = snaps.filter((s) => s !== null).length;

  // Emit report.
  const lines: string[] = [];
  lines.push(
    `// Auto-snap report for ${args.label} (window: ±${args.window}f)`,
  );
  lines.push(
    `// Onsets: ${onsetsJson.markers.length} from ${basename(args.onsetsPath)} ` +
      `(min-strength ${args.minStrength})`,
  );
  lines.push(`//`);
  for (const d of diagnostics) lines.push(`//${d.slice(1)}`);
  lines.push(`//`);
  lines.push(
    `// ${snapCount}/${snaps.length} scenes snapped. ` +
      `Copy into your composition:`,
  );
  lines.push("");
  lines.push("const BEAT_SNAP_FRAMES = [");
  for (let i = 0; i < snaps.length; i++) {
    const v = snaps[i];
    lines.push(`  ${v === null ? "null" : v},`);
  }
  lines.push("] as const;");

  process.stdout.write(lines.join("\n") + "\n");
}

try {
  main();
} catch (err) {
  process.stderr.write(
    `auto-snap failed: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}
