/**
 * generate-vo.ts — ElevenLabs voiceover generator for the Remotion pipeline.
 *
 * Usage:
 *   # Single-stem chapter (preferred):  one TTS call, scenes joined with breaks.
 *   node --strip-types scripts/voice/generate-vo.ts <config.json> --mode chapter
 *
 *   # Legacy per-scene mode (one API call per scene → different "rooms").
 *   node --strip-types scripts/voice/generate-vo.ts <config.json> --mode per-scene
 *
 *   # Dry run prints planned requests without spending credits.
 *   node --strip-types scripts/voice/generate-vo.ts <config.json> --dry-run
 *
 * Default mode is `chapter`. Per-scene exists for one-off retakes.
 *
 * Chapter mode writes:
 *   <output_dir>/_raw/chapter.mp3        — single TTS render for the whole chapter
 *   <output_dir>/chapter.metadata.json   — scene-id order + break-tag config
 *
 * Then post-process.py --target <slug> builds chapter.mp3 (limited+reverbed)
 * + chapter.timings.json (silence-detect on the raw stem).
 */

import { createRequire } from "module";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface Line {
  id: string;
  text: string;
  voice_settings?: Partial<VoiceSettings>;
}

interface Scene {
  id: string;
  /** Single-block scene text (legacy / short scenes). */
  text?: string;
  /** Per-line breakdown — preferred for multi-sentence scenes. Each line = own TTS call, chained. */
  lines?: Line[];
  /** Shallow-merged on top of default_voice_settings */
  voice_settings?: Partial<VoiceSettings>;
}

interface VoConfig {
  voice_id: string;
  model_id: string;
  output_dir: string;
  default_voice_settings: VoiceSettings;
  scenes: Scene[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load .env from the project root (two dirs up from scripts/voice/) */
function loadEnv(): void {
  const require = createRequire(import.meta.url);
  // dotenv is a transitive dep — resolve from repo node_modules
  const dotenvPath = require.resolve("dotenv");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require(dotenvPath) as { config: (opts: { path: string }) => void };
  const envFile = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../../.env",
  );
  dotenv.config({ path: envFile });
}

function assertConfig(cfg: unknown): asserts cfg is VoConfig {
  if (!cfg || typeof cfg !== "object") {
    throw new Error("Config must be a JSON object.");
  }
  const c = cfg as Record<string, unknown>;
  if (!c.voice_id || typeof c.voice_id !== "string") {
    throw new Error('Config missing required string field: "voice_id"');
  }
  if (!Array.isArray(c.scenes) || c.scenes.length === 0) {
    throw new Error('Config missing required non-empty array: "scenes"');
  }
  for (const [i, s] of (c.scenes as unknown[]).entries()) {
    if (!s || typeof s !== "object") throw new Error(`scenes[${i}] must be an object`);
    const scene = s as Record<string, unknown>;
    if (!scene.id || typeof scene.id !== "string")
      throw new Error(`scenes[${i}] missing "id"`);
    const hasText = typeof scene.text === "string" && scene.text.length > 0;
    const hasLines = Array.isArray(scene.lines) && scene.lines.length > 0;
    if (!hasText && !hasLines)
      throw new Error(`scenes[${i}] (${scene.id}) must have either "text" or "lines"`);
    if (hasLines) {
      for (const [j, l] of (scene.lines as unknown[]).entries()) {
        if (!l || typeof l !== "object") throw new Error(`scenes[${i}].lines[${j}] must be an object`);
        const line = l as Record<string, unknown>;
        if (!line.id || typeof line.id !== "string")
          throw new Error(`scenes[${i}].lines[${j}] missing "id"`);
        if (!line.text || typeof line.text !== "string")
          throw new Error(`scenes[${i}].lines[${j}] missing "text"`);
      }
    }
  }
}

/** Flatten a config's scenes into ordered (sceneId, lineId|null, text) units. */
interface Unit {
  sceneId: string;
  lineId: string | null;
  text: string;
  fileSlug: string;
  voice_settings?: Partial<VoiceSettings>;
}

function expandUnits(cfg: VoConfig): Unit[] {
  const out: Unit[] = [];
  for (const scene of cfg.scenes) {
    if (scene.lines && scene.lines.length > 0) {
      for (const line of scene.lines) {
        out.push({
          sceneId: scene.id,
          lineId: line.id,
          text: line.text,
          fileSlug: `${scene.id}__${line.id}`,
          voice_settings: { ...scene.voice_settings, ...line.voice_settings },
        });
      }
    } else if (scene.text) {
      out.push({
        sceneId: scene.id,
        lineId: null,
        text: scene.text,
        fileSlug: scene.id,
        voice_settings: scene.voice_settings,
      });
    }
  }
  return out;
}

function mergeVoiceSettings(
  defaults: VoiceSettings,
  overrides?: Partial<VoiceSettings>,
): VoiceSettings {
  return { ...defaults, ...overrides };
}

function fmtSettings(vs: VoiceSettings): string {
  return (
    `stability=${vs.stability.toFixed(2)}, ` +
    `similarity=${vs.similarity_boost.toFixed(2)}, ` +
    `style=${vs.style.toFixed(2)}`
  );
}

// ---------------------------------------------------------------------------
// Break tag config — ElevenLabs v2 honours <break time="X.Xs" /> SSML pauses.
// ---------------------------------------------------------------------------

const BREAK_LEAD_SEC = 0.5;     // silence before scene 1
const BREAK_BETWEEN_SEC = 1.5;  // silence between scenes (chapter-card territory)
const BREAK_TAIL_SEC = 0.7;     // silence after final scene

function breakTag(seconds: number): string {
  return `<break time="${seconds.toFixed(1)}s" />`;
}

function joinChapterText(scenes: Scene[]): string {
  const parts = [breakTag(BREAK_LEAD_SEC)];
  scenes.forEach((scene, i) => {
    parts.push(scene.text.trim());
    if (i < scenes.length - 1) parts.push(breakTag(BREAK_BETWEEN_SEC));
  });
  parts.push(breakTag(BREAK_TAIL_SEC));
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Core generators
// ---------------------------------------------------------------------------

async function generateUnit(
  unit: Unit,
  cfg: VoConfig,
  apiKey: string,
  outputDir: string,
  prev: { requestId: string | null; text: string | null },
  nextText: string | null,
): Promise<{ requestId: string | null }> {
  const voiceSettings = mergeVoiceSettings(
    cfg.default_voice_settings,
    unit.voice_settings,
  );

  const outPath = path.join(outputDir, `${unit.fileSlug}.mp3`);

  const body: Record<string, unknown> = {
    text: unit.text,
    model_id: cfg.model_id,
    voice_settings: voiceSettings,
  };
  if (prev.text) body.previous_text = prev.text;
  if (nextText) body.next_text = nextText;
  if (prev.requestId) body.previous_request_ids = [prev.requestId];

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice_id}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "(unreadable)");
    console.error(
      `[${unit.fileSlug}] ERROR ${response.status} ${response.statusText}: ${errBody}`,
    );
    return { requestId: null };
  }

  const requestId =
    response.headers.get("request-id") ??
    response.headers.get("x-request-id");

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, audioBuffer);

  const chainTag = prev.requestId ? " ↳chained" : "";
  console.log(
    `[${unit.fileSlug}] ${audioBuffer.byteLength.toLocaleString()} bytes → ${outPath} (${fmtSettings(voiceSettings)})${chainTag}`,
  );
  return { requestId };
}

async function generateChapter(
  cfg: VoConfig,
  apiKey: string,
  outputDir: string,
): Promise<void> {
  const voiceSettings = cfg.default_voice_settings;
  const units = expandUnits(cfg);
  const text = joinChapterText(units.map((u) => ({ id: u.fileSlug, text: u.text })));

  const rawDir = path.join(outputDir, "_raw");
  await mkdir(rawDir, { recursive: true });
  const outPath = path.join(rawDir, "chapter.mp3");
  const metaPath = path.join(outputDir, "chapter.metadata.json");

  console.log(
    `[chapter] ${text.length} chars (incl. break tags) | ${cfg.scenes.length} scenes | ${fmtSettings(voiceSettings)}`,
  );

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice_id}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: cfg.model_id,
        voice_settings: voiceSettings,
      }),
    },
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "(unreadable)");
    console.error(
      `[chapter] ERROR ${response.status} ${response.statusText}: ${errBody}`,
    );
    process.exit(1);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, audioBuffer);

  const metadata = {
    voice_id: cfg.voice_id,
    model_id: cfg.model_id,
    voice_settings: voiceSettings,
    breaks: {
      leadSec: BREAK_LEAD_SEC,
      betweenSec: BREAK_BETWEEN_SEC,
      tailSec: BREAK_TAIL_SEC,
    },
    scenes: cfg.scenes.map((s) => ({ id: s.id })),
  };
  await writeFile(metaPath, JSON.stringify(metadata, null, 2) + "\n");

  console.log(
    `[chapter] ${audioBuffer.byteLength.toLocaleString()} bytes → ${outPath}`,
  );
  console.log(`[chapter] metadata → ${metaPath}`);
  console.log(
    `Next: post-process.py --target ${path.basename(outputDir)} (writes chapter.timings.json + final chapter.mp3)`,
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnv();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const modeIdx = args.indexOf("--mode");
  const mode: "chapter" | "per-scene" =
    modeIdx >= 0 && args[modeIdx + 1] === "per-scene" ? "per-scene" : "chapter";
  const configArg = args.find((a) => !a.startsWith("--") && a !== args[modeIdx + 1]);

  if (!configArg) {
    console.error(
      "Usage: node --strip-types generate-vo.ts <config.json> [--mode chapter|per-scene] [--dry-run]",
    );
    process.exit(1);
  }

  const configPath = path.resolve(process.cwd(), configArg);
  if (!existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  let cfg: unknown;
  try {
    const raw = await import(configPath, { assert: { type: "json" } });
    cfg = raw.default ?? raw;
  } catch {
    // Fallback for Node versions that don't support JSON import assertions
    const { readFile } = await import("fs/promises");
    cfg = JSON.parse(await readFile(configPath, "utf8"));
  }

  try {
    assertConfig(cfg);
  } catch (err) {
    console.error(`Config validation failed: ${(err as Error).message}`);
    process.exit(1);
  }

  const units = expandUnits(cfg);
  const totalChars = units.reduce((sum, u) => sum + u.text.length, 0);
  console.log(
    `TOTAL CHARACTERS: ${totalChars.toLocaleString()} (≈ ${totalChars.toLocaleString()} credits)`,
  );
  console.log(
    `Mode: ${mode} | Scenes: ${cfg.scenes.length} | Units: ${units.length} | Voice: ${cfg.voice_id} | Model: ${cfg.model_id}`,
  );
  console.log(`Output dir: ${cfg.output_dir}`);
  console.log("");

  if (dryRun) {
    console.log("--- DRY RUN — no API calls will be made ---");
    if (mode === "chapter") {
      const joined = joinChapterText(units.map((u) => ({ id: u.fileSlug, text: u.text })));
      console.log(
        `[chapter] joined-text length ${joined.length} chars (one TTS call)`,
      );
      console.log(`  preview: "${joined.slice(0, 200)}${joined.length > 200 ? "…" : ""}"`);
    } else {
      for (const unit of units) {
        const vs = mergeVoiceSettings(cfg.default_voice_settings, unit.voice_settings);
        console.log(
          `[${unit.fileSlug}] ${unit.text.length} chars | ${fmtSettings(vs)}`,
        );
        console.log(`  text: "${unit.text.slice(0, 80)}${unit.text.length > 80 ? "…" : ""}"`);
      }
    }
    console.log("\nDry run complete. Pass config without --dry-run to generate.");
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error(
      "ELEVENLABS_API_KEY is not set.\n" +
        "Add it to claude-remotion-flow/.env:\n" +
        "  ELEVENLABS_API_KEY=sk_...",
    );
    process.exit(1);
  }

  const outputDir = path.resolve(process.cwd(), cfg.output_dir);
  await mkdir(outputDir, { recursive: true });

  if (mode === "chapter") {
    await generateChapter(cfg, apiKey, outputDir);
  } else {
    const units = expandUnits(cfg);
    const onlyArg = args.indexOf("--only");
    const only = onlyArg >= 0 ? args[onlyArg + 1]?.split(",").filter(Boolean) ?? [] : null;

    if (only) {
      console.log(`[--only] regenerating ${only.length} unit(s): ${only.join(", ")}`);
    }

    let prev: { requestId: string | null; text: string | null } = {
      requestId: null,
      text: null,
    };
    for (let i = 0; i < units.length; i++) {
      const unit = units[i]!;
      const nextText = units[i + 1]?.text ?? null;

      // Skip if --only is set and this unit isn't in the list. But still walk
      // the chain forward so chain context is right when we DO regen one.
      if (only && !only.includes(unit.fileSlug)) {
        prev = { requestId: null, text: unit.text };
        continue;
      }

      const result = await generateUnit(unit, cfg, apiKey, outputDir, prev, nextText);
      prev = { requestId: result.requestId, text: unit.text };
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
