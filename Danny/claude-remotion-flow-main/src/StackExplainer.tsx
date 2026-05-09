import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_2,
  ACCENT_3,
  EASE_OUT,
  FONT,
  MONO,
  SAFE_INSET_X,
  SAFE_INSET_Y,
  PRE_ROLL_FRAMES,
  POST_ROLL_FRAMES,
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_OUTRO,
  SFX_OUTRO_LEAD_IN_FRAMES,
  SFX_OUTRO_LEN_FRAMES,
  TEXT,
  TEXT_DIM,
  VO_PRE_PAD_FRAMES,
  computeTimeline,
  easeIn,
  fallbackDurationInFrames,
  makeCalculateMetadata,
  type ExplainerConfig,
  type ExplainerProps,
  ChapterCard,
  FadeToBlack,
  FadeUp,
  PosterFrame,
  SceneBG,
  SceneExit,
  TRANS,
  BEDS,
} from "./explainer-shared";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SCENE_AUDIO_FILES = [
  "assets/voice/generated/StackExplainer/scene-1-title.mp3",
  "assets/voice/generated/StackExplainer/scene-2-stock.mp3",
  "assets/voice/generated/StackExplainer/scene-3-plugins.mp3",
  "assets/voice/generated/StackExplainer/scene-4-design-system.mp3",
  "assets/voice/generated/StackExplainer/scene-5-voice.mp3",
  "assets/voice/generated/StackExplainer/scene-6-library.mp3",
  "assets/voice/generated/StackExplainer/scene-7-beats.mp3",
  "assets/voice/generated/StackExplainer/scene-8-envelope.mp3",
  // S9 has no VO file; calculateMetadata falls back to FALLBACK_SCENE_DURATIONS[8].
  "assets/voice/generated/StackExplainer/scene-9-recap.mp3",
] as const;

// S1 VO disabled — on-screen title delivers the line; VO was duplicating.
// S9 VO disabled — silent visual recap; relies on music + animations only.
const SCENE_VO_ENABLED = [false, true, true, true, true, true, true, true, false] as const;

// Animator floors — rough VO-length estimates + padding. Real durations come
// from calculateMetadata reading the audio files. S9 (recap) has no VO so
// its fallback IS the scene length: 180f = 6.0s.
const FALLBACK_SCENE_DURATIONS = [120, 210, 300, 240, 270, 240, 300, 240, 180] as const;

// Chapter cards — 3-part arc structure + recap card before S9. ~1.5s holding
// frames give the ear a breath and the eye a title card for the section ahead.
const CARD_BEFORE = [
  null,                                       // before S1 (title opens cold)
  null,                                       // before S2 (continues the hook)
  { label: "Part 01", title: "The Stack" },   // before S3 — plugins
  null,                                       // before S4 (continues stack arc)
  { label: "Part 02", title: "The Voice" },   // before S5 — voice preset
  null,                                       // before S6 (continues sound arc)
  { label: "Part 03", title: "The Craft" },   // before S7 — beats + production
  null,                                       // before S8 (closes the craft arc)
  { label: "Recap", title: "The Pipeline" },  // before S9 — process flow
] as const;

// Music bed — HOUSE_DEFAULT (10:13 cinematic-ambient drop-in bed). Plays at
// BED_VOLUME flat across the whole comp — no ducking.
const MUSIC_BED = BEDS.HOUSE_DEFAULT;
const BED_VOLUME = 0.10;

// Beat-snap left empty in the first pass — the wings bed's strong onsets
// (376/638/826/1163/1210/1426/1791) don't land within ~25f of the natural
// scene starts, so snapping would either bloat the comp or ship a long
// awkward title. Session 12 auto-snap helper can revisit.
const BEAT_SNAP_FRAMES = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null, // S9 recap — no snap
] as const;

const CONFIG: ExplainerConfig = {
  sceneAudioFiles: SCENE_AUDIO_FILES,
  sceneVoEnabled: SCENE_VO_ENABLED,
  fallbackSceneDurations: FALLBACK_SCENE_DURATIONS,
  cardBefore: CARD_BEFORE,
  beatSnapFrames: BEAT_SNAP_FRAMES,
  logPrefix: "StackExplainer",
};

export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames(CONFIG);
export const calculateMetadata = makeCalculateMetadata(CONFIG);

export const stackExplainerSchema = z.object({
  voiceover: z.array(z.number()).optional(),
  voLengths: z.array(z.number()).optional(),
  // Live mixer — Remotion's InputDragger in the Props panel; drag
  // horizontally to scrub, or click to type. .multipleOf(0.05) gives
  // 20 meaningful steps across the 0–1 gain range; 0.01 was too fine
  // to feel responsive during drag.
  // Values are absolute gains (0 = silent, 1 = unity).
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});

// ---------------------------------------------------------------------------
// Scene 1 — Title ("From stock Remotion — to a production engine")
// ---------------------------------------------------------------------------

const Scene1Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1S = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 110 } });
  const line1Op = interpolate(line1S, [0, 1], [0, 1]);
  const line1Y = interpolate(line1S, [0, 1], [40, 0]);

  const line2S = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 140 } });
  const line2Scale = interpolate(line2S, [0, 1], [0.88, 1]);
  const line2Op = interpolate(line2S, [0, 1], [0, 1]);

  const ruleW = interpolate(frame, [20, 50], [0, 520], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: ACCENT_2,
              opacity: line1Op,
              transform: `translateY(${line1Y}px)`,
            }}
          >
            From stock Remotion
          </div>
          <div
            style={{
              width: ruleW,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${ACCENT_2}, transparent)`,
              margin: "28px auto",
            }}
          />
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: TEXT,
              letterSpacing: "-0.03em",
              opacity: line2Op,
              transform: `scale(${line2Scale})`,
              textShadow: `0 0 80px ${ACCENT}55`,
            }}
          >
            to a <span style={{ color: ACCENT_2 }}>Production Engine</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Stock Remotion ("stage, a clock, and a tag that plays a file")
// Three tags float in; a clock ticks under them. Deliberately plain — this
// is literally "all you get" without plugins.
// ---------------------------------------------------------------------------

const STOCK_TAGS = [
  { label: "<Sequence>", color: TEXT_DIM },
  { label: "<Audio>", color: TEXT_DIM },
  { label: "useCurrentFrame()", color: TEXT_DIM },
];

const Scene2Stock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clockAngle = (frame / fps) * 360; // one full rotation per second
  const clockOp = easeIn(frame, 10, 30);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 110,
        }}
      >
        {/* Ticking clock */}
        <div
          style={{
            position: "relative",
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: `3px solid ${TEXT_DIM}`,
            opacity: clockOp,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 5,
              height: 100,
              background: ACCENT_2,
              transformOrigin: "50% 100%",
              transform: `translate(-50%, -100%) rotate(${clockAngle}deg)`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 18,
              height: 18,
              background: ACCENT_2,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 42 }}>
          {STOCK_TAGS.map((tag, i) => (
            <FadeUp key={tag.label} delay={30 + i * 12} offsetY={24}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 56,
                  color: tag.color,
                  padding: "28px 46px",
                  border: `1px solid ${TEXT_DIM}55`,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {tag.label}
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={80}>
          <div style={{ fontSize: 40, color: TEXT_DIM, marginTop: 10, letterSpacing: "0.01em" }}>
            A stage · a clock · a tag that plays a file.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Plugins (18 package cards, each fades in on a beat)
// ---------------------------------------------------------------------------

const PLUGIN_PACKAGES: ReadonlyArray<{ name: string; accent: string }> = [
  { name: "transitions", accent: ACCENT_2 },
  { name: "motion-blur", accent: ACCENT_2 },
  { name: "noise", accent: ACCENT_2 },
  { name: "google-fonts", accent: ACCENT_3 },
  { name: "media-utils", accent: ACCENT_3 },
  { name: "media", accent: ACCENT_3 },
  { name: "captions", accent: ACCENT_3 },
  { name: "layout-utils", accent: ACCENT },
  { name: "lottie", accent: ACCENT },
  { name: "paths", accent: ACCENT },
  { name: "shapes", accent: ACCENT },
  { name: "three", accent: ACCENT },
  { name: "rive", accent: ACCENT },
  { name: "tailwind", accent: ACCENT },
  { name: "player", accent: TEXT_DIM },
  { name: "renderer", accent: TEXT_DIM },
  { name: "cli", accent: TEXT_DIM },
  { name: "zod-types", accent: TEXT_DIM },
];

const Scene3Plugins: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);
  // Staggered grid reveal — 3 frames per card so the whole 18-card grid
  // materialises over ~55 frames (≈1.8s).
  const PER_CARD_DELAY = 3;
  const REVEAL_START = 20;

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              opacity: headerOp,
              fontSize: 62,
              fontWeight: 700,
              color: TEXT,
              marginBottom: 14,
            }}
          >
            We stacked <span style={{ color: ACCENT_2 }}>18 plugins</span> on top.
          </div>
          <div
            style={{
              opacity: headerOp,
              fontFamily: MONO,
              fontSize: 22,
              color: TEXT_DIM,
            }}
          >
            all pinned · @remotion/* @ 4.0.448
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 22,
          }}
        >
          {PLUGIN_PACKAGES.map((pkg, i) => {
            const delay = REVEAL_START + i * PER_CARD_DELAY;
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 20, stiffness: 180 },
            });
            const op = interpolate(s, [0, 1], [0, 1]);
            const scale = interpolate(s, [0, 1], [0.7, 1]);
            const y = interpolate(s, [0, 1], [14, 0]);

            return (
              <div
                key={pkg.name}
                style={{
                  opacity: op,
                  transform: `scale(${scale}) translateY(${y}px)`,
                  border: `1px solid ${pkg.accent}88`,
                  background: `${pkg.accent}12`,
                  borderRadius: 14,
                  padding: "26px 18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 17,
                    color: TEXT_DIM,
                    letterSpacing: "0.02em",
                  }}
                >
                  @remotion/
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 26,
                    fontWeight: 600,
                    color: pkg.accent,
                    marginTop: 4,
                  }}
                >
                  {pkg.name}
                </div>
              </div>
            );
          })}
        </div>

        <FadeUp delay={100}>
          <div
            style={{
              fontSize: 36,
              color: TEXT_DIM,
              textAlign: "center",
            }}
          >
            Every cinematic move — an add-on.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — Design System (palette swatches + scene-skeleton diagram)
// ---------------------------------------------------------------------------

const PALETTE = [
  { name: "BG", value: "#0C0322 → #461499", swatch: "linear-gradient(140deg, #0C0322, #461499)" },
  { name: "ACCENT", value: "#753EF7", swatch: ACCENT },
  { name: "ACCENT_2", value: "#FBBF24", swatch: ACCENT_2 },
  { name: "TEXT", value: "#FFFFFF", swatch: TEXT },
];

const SKELETON_STEPS = [
  { n: "01", label: "intro breath", code: "VO_PRE_PAD" },
  { n: "02", label: "the scene", code: "sceneBody" },
  { n: "03", label: "scene exit", code: "SceneExit" },
  { n: "04", label: "transition", code: "TRANS" },
];

const Scene4DesignSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOp = easeIn(frame, 5, 25);
  const leftOp = easeIn(frame, 20, 50);
  const rightOp = easeIn(frame, 40, 75);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            opacity: headerOp,
            fontSize: 62,
            fontWeight: 700,
            color: TEXT,
            marginBottom: 56,
          }}
        >
          The <span style={{ color: ACCENT_2 }}>design system</span>.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 100,
            flex: 1,
          }}
        >
          {/* Palette */}
          <div style={{ opacity: leftOp, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                color: TEXT_DIM,
                letterSpacing: "0.22em",
                marginBottom: 32,
                textTransform: "uppercase",
              }}
            >
              Palette
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 26,
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              {PALETTE.map((p) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 14,
                      background: p.swatch,
                      border: `1px solid ${TEXT_DIM}33`,
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 32, color: TEXT, fontWeight: 600 }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 22, color: TEXT_DIM, marginTop: 4 }}>
                      {p.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene skeleton */}
          <div style={{ opacity: rightOp, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                color: TEXT_DIM,
                letterSpacing: "0.22em",
                marginBottom: 32,
                textTransform: "uppercase",
              }}
            >
              Scene skeleton
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                color: TEXT_DIM,
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${ACCENT}44`,
                padding: "24px 26px",
                borderRadius: 14,
                marginBottom: 28,
              }}
            >
              <div style={{ color: ACCENT_2 }}>calculateMetadata</div>
              <div style={{ color: TEXT, marginTop: 6 }}>
                {"  "}&rarr; reads VO · sizes scenes · snaps beats
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              {SKELETON_STEPS.map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "20px 26px",
                    border: `1px solid ${TEXT_DIM}33`,
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontFamily: MONO, fontSize: 20, color: ACCENT_2 }}>
                    {step.n}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontFamily: FONT, fontSize: 26, color: TEXT, fontWeight: 600 }}>
                      {step.label}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 16, color: TEXT_DIM, marginTop: 2 }}>
                      {step.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <FadeUp delay={100}>
          <div style={{ fontSize: 26, color: TEXT_DIM, textAlign: "center", marginTop: 40 }}>
            One pattern — every video.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Voice (preset JSON on the left, 8 MP3 waveforms cascading in)
// ---------------------------------------------------------------------------

const PRESET_LINES = [
  { k: '"voice_id"', v: '"jQOgcOzmmipekvxJN09W"' },
  { k: '"model_id"', v: '"eleven_multilingual_v2"' },
  { k: '"stability"', v: "0.31" },
  { k: '"similarity"', v: "1.0" },
  { k: '"speed"', v: "0.9" },
];

const WAVEFORM_BARS = 28;

const Scene5Voice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ opacity: headerOp, fontSize: 62, fontWeight: 700, color: TEXT, marginBottom: 48 }}>
          The <span style={{ color: ACCENT_2 }}>voice</span>.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 480px) 1fr",
            gap: 80,
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {/* Preset JSON — compact, doesn't stretch to fill height */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 20,
                color: TEXT_DIM,
                letterSpacing: "0.22em",
                marginBottom: 22,
                textTransform: "uppercase",
              }}
            >
              ssl-2026-house-voice.json
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                background: "rgba(0,0,0,0.45)",
                border: `1px solid ${ACCENT_3}44`,
                borderRadius: 14,
                padding: "28px 30px",
                lineHeight: 1.8,
              }}
            >
              <div style={{ color: TEXT_DIM }}>{"{"}</div>
              {PRESET_LINES.map((line, i) => {
                const delay = 25 + i * 10;
                const op = easeIn(frame, delay, delay + 12);
                return (
                  <div key={line.k} style={{ opacity: op, marginLeft: 28 }}>
                    <span style={{ color: ACCENT_3 }}>{line.k}</span>
                    <span style={{ color: TEXT_DIM }}>{": "}</span>
                    <span style={{ color: ACCENT_2 }}>{line.v}</span>
                    {i < PRESET_LINES.length - 1 && <span style={{ color: TEXT_DIM }}>{","}</span>}
                  </div>
                );
              })}
              <div style={{ color: TEXT_DIM }}>{"}"}</div>
            </div>
          </div>

          {/* Waveforms cascading in — enlarged + spread vertically */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 20,
                color: TEXT_DIM,
                letterSpacing: "0.22em",
                marginBottom: 22,
                textTransform: "uppercase",
              }}
            >
              → 8 MP3s
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
                justifyContent: "space-between",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
                const delay = 40 + i * 8;
                const s = spring({
                  frame: frame - delay,
                  fps,
                  config: { damping: 22, stiffness: 150 },
                });
                const op = interpolate(s, [0, 1], [0, 1]);
                const x = interpolate(s, [0, 1], [40, 0]);
                return (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      opacity: op,
                      transform: `translateX(${x}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 20,
                        color: TEXT_DIM,
                        width: 86,
                      }}
                    >
                      scene-{n}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        flex: 1,
                        height: 62,
                      }}
                    >
                      {Array.from({ length: WAVEFORM_BARS }).map((_, barIdx) => {
                        const seed = (n * 13 + barIdx * 7) % 100;
                        const h = 14 + (seed / 100) * 46;
                        return (
                          <div
                            key={barIdx}
                            style={{
                              flex: 1,
                              height: h,
                              background: ACCENT_2,
                              borderRadius: 2,
                              opacity: 0.8,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <FadeUp delay={140}>
          <div style={{ fontSize: 36, color: TEXT_DIM, textAlign: "center", marginTop: 40 }}>
            Script in — MP3s out.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Library (auditioner UI with ⭐ shortlist toggle + 📋 copy path)
// ---------------------------------------------------------------------------

const LIBRARY_ROWS: ReadonlyArray<{
  cat: string;
  file: string;
  dur: string;
  starred?: boolean;
}> = [
  { cat: "transitions", file: "pixabay-ksjsbwuil-whoosh-8", dur: "3.8s", starred: true },
  { cat: "impacts", file: "pixabay-universfield-cinematic-boom", dur: "2.1s", starred: true },
  { cat: "risers", file: "pixabay-tension-build-riser", dur: "5.2s" },
  { cat: "music", file: "penguinmusic-wings", dur: "83.5s", starred: true },
  { cat: "stingers", file: "alex_kizenkov-wet-stinger", dur: "1.2s" },
  { cat: "ambience", file: "pixabay-deep-wind-ambient", dur: "12.4s" },
];

const LIBRARY_TABS = ["transitions", "stingers", "risers", "impacts", "ambience", "music"] as const;

const Scene6Library: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);

  // Animated tab cycling — user clicks through each category in turn, lands
  // on "music" (the bed we picked). Cycles 0→5 over ~150 frames (~5s).
  const TAB_CYCLE_START = 20;
  const TAB_HOLD_FRAMES = 25;
  const rawTab = Math.max(0, Math.floor((frame - TAB_CYCLE_START) / TAB_HOLD_FRAMES));
  const activeTab = Math.min(LIBRARY_TABS.length - 1, rawTab);

  // Star toggle animation on row 0 — ⭐ pulses when we land on "music" tab.
  const starPulseStart = TAB_CYCLE_START + (LIBRARY_TABS.length - 1) * TAB_HOLD_FRAMES + 5;
  const starPulse = spring({
    frame: frame - starPulseStart,
    fps,
    config: { damping: 8, stiffness: 180 },
  });
  const starScale = interpolate(starPulse, [0, 1], [1, 1.4]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ opacity: headerOp, fontSize: 62, fontWeight: 700, color: TEXT, marginBottom: 10 }}>
          The <span style={{ color: ACCENT_2 }}>library</span>.
        </div>
        <div style={{ opacity: headerOp, fontFamily: MONO, fontSize: 22, color: TEXT_DIM, marginBottom: 40 }}>
          378 items · 6 tabs · MANIFEST.json
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            border: `1px solid ${ACCENT}44`,
            borderRadius: 16,
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tab bar — active tab animates through the cycle */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "18px 22px",
              borderBottom: `1px solid ${TEXT_DIM}22`,
              fontFamily: MONO,
              fontSize: 20,
            }}
          >
            {LIBRARY_TABS.map((t, i) => {
              const isActive = i === activeTab;
              return (
                <div
                  key={t}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    color: isActive ? TEXT : TEXT_DIM,
                    background: isActive ? `${ACCENT_2}22` : "transparent",
                    border: isActive ? `1px solid ${ACCENT_2}88` : "1px solid transparent",
                    transition: "none",
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>

          {/* Rows — spread to fill remaining vertical space */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            {LIBRARY_ROWS.map((row, i) => {
              const delay = 30 + i * 6;
              const op = easeIn(frame, delay, delay + 12);
              const isFirst = i === 0;
              // Highlight the row whose category matches the active tab.
              const rowActive = row.cat === LIBRARY_TABS[activeTab];
              return (
                <div
                  key={row.file}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: "22px 28px",
                    borderBottom:
                      i < LIBRARY_ROWS.length - 1 ? `1px solid ${TEXT_DIM}18` : "none",
                    opacity: op,
                    fontFamily: MONO,
                    fontSize: 22,
                    background: rowActive ? `${ACCENT_2}10` : "transparent",
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      color: row.starred ? ACCENT_2 : TEXT_DIM,
                      transform: isFirst && row.starred ? `scale(${starScale})` : "scale(1)",
                      width: 46,
                    }}
                  >
                    {row.starred ? "★" : "☆"}
                  </div>
                  <div style={{ color: TEXT_DIM, width: 160 }}>{row.cat}</div>
                  <div style={{ color: TEXT, flex: 1 }}>{row.file}</div>
                  <div style={{ color: TEXT_DIM, width: 90, textAlign: "right" }}>{row.dur}</div>
                  <div
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${TEXT_DIM}55`,
                      borderRadius: 8,
                      color: TEXT_DIM,
                      fontSize: 18,
                    }}
                  >
                    📋 copy
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FadeUp delay={100}>
          <div style={{ fontSize: 36, color: TEXT_DIM, textAlign: "center", marginTop: 36 }}>
            Shortlist · paste the path · done.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — Beat tracking (music waveform + onset markers snapping a cut)
// Markers positions are the real wings-onsets output, scaled to comp width.
// ---------------------------------------------------------------------------

// Real markers from stack-explainer-onsets.json (wings bed, 83.5s source).
// time_s values; we show the first 8 which fall within the visible window.
const ONSET_TIMES_S = [12.54, 21.28, 27.53, 38.78, 40.34, 41.9, 43.47, 47.53];
const MUSIC_DURATION_S = 83.5;

const Scene7Beats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);

  // Waveform reveal animates left-to-right over ~45f
  const wfProgress = interpolate(frame, [20, 65], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ opacity: headerOp, fontSize: 62, fontWeight: 700, color: TEXT, marginBottom: 10 }}>
          <span style={{ color: ACCENT_2 }}>Beat tracking</span>.
        </div>
        <div
          style={{
            opacity: headerOp,
            fontFamily: MONO,
            fontSize: 22,
            color: TEXT_DIM,
            marginBottom: 44,
          }}
        >
          librosa · onset_detect(backtrack=true)
        </div>

        {/* Waveform container — full bleed, taller */}
        <div
          style={{
            position: "relative",
            height: 280,
            background: "rgba(0,0,0,0.35)",
            border: `1px solid ${ACCENT}44`,
            borderRadius: 14,
            padding: "26px 30px",
            overflow: "hidden",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: "100%" }}>
            {Array.from({ length: 160 }).map((_, i) => {
              const seed = Math.sin(i * 0.8) * Math.cos(i * 0.15);
              const h = 28 + Math.abs(seed) * 170;
              const visible = i / 160 < wfProgress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    background: ACCENT_3,
                    borderRadius: 2,
                    opacity: visible ? 0.6 : 0,
                  }}
                />
              );
            })}
          </div>

          {ONSET_TIMES_S.map((t, i) => {
            const xPct = (t / MUSIC_DURATION_S) * 100;
            const dropDelay = 55 + i * 6;
            const s = spring({
              frame: frame - dropDelay,
              fps,
              config: { damping: 14, stiffness: 160 },
            });
            const y = interpolate(s, [0, 1], [-40, 0]);
            const op = interpolate(s, [0, 1], [0, 1]);
            return (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left: `${xPct}%`,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: ACCENT_2,
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  boxShadow: `0 0 14px ${ACCENT_2}aa`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: MONO,
                    fontSize: 16,
                    color: ACCENT_2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.toFixed(1)}s
                </div>
              </div>
            );
          })}

          {/* Scene-cut line snaps onto the 3rd onset (t=27.5s, strongest) */}
          {(() => {
            const targetX = (27.53 / MUSIC_DURATION_S) * 100;
            const snapStart = 95;
            const snap = spring({
              frame: frame - snapStart,
              fps,
              config: { damping: 20, stiffness: 180 },
            });
            const currentX = interpolate(snap, [0, 1], [45, targetX]);
            const op = easeIn(frame, snapStart - 10, snapStart + 5);
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${currentX}%`,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: ACCENT,
                  opacity: op,
                  boxShadow: `0 0 22px ${ACCENT}`,
                }}
              />
            );
          })()}
        </div>

        {/* ZOOM DETAIL — close-up of the snap point, showing 10 magnified bars
            with the onset marker centred and the scene-cut line snapping onto
            it. Danny's Loom ask: "zoom in to show waveform level with cuts." */}
        <div
          style={{
            position: "relative",
            flex: 1,
            background: "rgba(0,0,0,0.28)",
            border: `1px solid ${ACCENT}33`,
            borderRadius: 14,
            padding: "22px 30px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 18, color: TEXT_DIM, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              zoom · t = 27.5s
            </div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: ACCENT, opacity: easeIn(frame, 110, 135) }}>
              scene-cut → snap ✓
            </div>
          </div>

          {/* Magnified bars around the snap point */}
          <div
            style={{
              position: "relative",
              height: "calc(100% - 44px)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {Array.from({ length: 11 }).map((_, i) => {
              const center = 5;
              const dist = Math.abs(i - center);
              const h = i === center ? 95 : 45 + (5 - dist) * 10;
              const barVisible = easeIn(frame, 70 + i * 3, 85 + i * 3);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === center ? ACCENT_2 : ACCENT_3,
                    borderRadius: 3,
                    opacity: (i === center ? 0.95 : 0.55) * barVisible,
                    boxShadow: i === center ? `0 0 16px ${ACCENT_2}aa` : "none",
                  }}
                />
              );
            })}

            {/* Scene-cut line snaps onto the centre bar from the left */}
            {(() => {
              const snapStart = 110;
              const snap = spring({
                frame: frame - snapStart,
                fps,
                config: { damping: 22, stiffness: 200 },
              });
              // Starts off-centre at 30%, snaps to 50% (centre bar).
              const currentX = interpolate(snap, [0, 1], [30, 50]);
              const op = easeIn(frame, snapStart - 5, snapStart + 8);
              return (
                <div
                  style={{
                    position: "absolute",
                    left: `${currentX}%`,
                    top: 0,
                    bottom: 0,
                    width: 5,
                    background: ACCENT,
                    opacity: op,
                    boxShadow: `0 0 28px ${ACCENT}`,
                    transform: "translateX(-50%)",
                  }}
                />
              );
            })()}
          </div>
        </div>

        <FadeUp delay={140}>
          <div style={{ fontSize: 36, color: TEXT_DIM, textAlign: "center", marginTop: 30 }}>
            Cuts land on phrases — the voice stays untouched.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — The production (whoosh · boom · fade-to-black). The video ends
// with the exact envelope it's describing — so the viewer hears it land.
// Kicker renamed from "envelope" (Session 11 Loom). Wave 2 adds a stack-arrow
// grid below the three channel rows.
// ---------------------------------------------------------------------------

const Scene8Production: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);

  // Three "channel" tracks animate in sequence.
  // (1) Whoosh — diagonal sweep-up line
  // (2) Boom — radial burst
  // (3) Fade to black — progress bar filling
  const whooshStart = 30;
  const boomStart = 70;
  const fadeStart = 110;

  const whooshS = spring({ frame: frame - whooshStart, fps, config: { damping: 22, stiffness: 120 } });
  const whooshProg = interpolate(whooshS, [0, 1], [0, 1]);

  const boomS = spring({ frame: frame - boomStart, fps, config: { damping: 6, stiffness: 300 } });
  const boomScale = interpolate(boomS, [0, 1], [0.2, 1]);
  const boomOp = interpolate(boomS, [0, 1], [0, 1]);

  const fadeProg = interpolate(frame, [fadeStart, fadeStart + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const Row: React.FC<{ label: string; children: React.ReactNode; accent: string }> = ({
    label,
    children,
    accent,
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "18px 24px",
        border: `1px solid ${accent}55`,
        background: `${accent}0C`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 18,
          color: accent,
          width: 160,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, position: "relative", height: 60 }}>{children}</div>
    </div>
  );

  // Production stack pills — fade in left to right, each on a beat.
  const STACK_PILLS = [
    "treatment",
    "script",
    "voice",
    "library",
    "scenes",
    "transitions",
    "whoosh",
    "boom",
    "fade",
  ];
  const stackRevealStart = 95;
  const stackPerPill = 5;

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ opacity: headerOp, fontSize: 62, fontWeight: 700, color: TEXT, marginBottom: 44 }}>
          The <span style={{ color: ACCENT_2 }}>production</span>.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Row label="Whoosh" accent={ACCENT_3}>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: `${whooshProg * 100}%`,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${ACCENT_3})`,
                transform: `translateY(${-whooshProg * 40}px)`,
                boxShadow: `0 0 12px ${ACCENT_3}`,
              }}
            />
          </Row>

          <Row label="Boom" accent={ACCENT_2}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 60 * boomScale,
                height: 60 * boomScale,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${ACCENT_2} 0%, transparent 70%)`,
                transform: "translate(-50%, -50%)",
                opacity: boomOp,
              }}
            />
          </Row>

          <Row label="Fade to black" accent={TEXT_DIM}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "100%",
                height: 20,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fadeProg * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${TEXT_DIM}, #000)`,
                }}
              />
            </div>
          </Row>
        </div>

        {/* Production stack — pills with arrows between, fade in after the 3
            channel rows land. Shows the full sonic+creative chain. */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {STACK_PILLS.map((pill, i) => {
            const delay = stackRevealStart + i * stackPerPill;
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 22, stiffness: 170 },
            });
            const op = interpolate(s, [0, 1], [0, 1]);
            const y = interpolate(s, [0, 1], [12, 0]);
            const arrowOp = easeIn(frame, delay + 3, delay + 13);
            return (
              <React.Fragment key={pill}>
                <div
                  style={{
                    opacity: op,
                    transform: `translateY(${y}px)`,
                    fontFamily: MONO,
                    fontSize: 22,
                    padding: "12px 22px",
                    border: `1px solid ${ACCENT_2}66`,
                    borderRadius: 999,
                    color: TEXT,
                    background: `${ACCENT_2}14`,
                  }}
                >
                  {pill}
                </div>
                {i < STACK_PILLS.length - 1 && (
                  <div style={{ opacity: arrowOp, color: TEXT_DIM, fontSize: 22 }}>→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <FadeUp delay={150}>
          <div style={{ fontSize: 40, color: TEXT_DIM, textAlign: "center", marginTop: "auto" }}>
            Ships in one pass.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 9 — Recap: end-to-end process flow. Silent visual scene (no VO) —
// Danny's Loom ask: "Our 40-second explainer ships in one pass could go to
// another screen. Then we could have a process — a scene of every single
// step." Lands between S8 production and the fade-to-black.
// ---------------------------------------------------------------------------

const RECAP_STEPS: ReadonlyArray<{ n: string; label: string; hint: string }> = [
  { n: "01", label: "treatment", hint: "3-layer brief" },
  { n: "02", label: "voice", hint: "ElevenLabs MP3s" },
  { n: "03", label: "scenes", hint: "React components" },
  { n: "04", label: "library", hint: "SFX + music bed" },
  { n: "05", label: "production", hint: "whoosh · boom · fade" },
  { n: "06", label: "render", hint: "one command" },
];

const Scene9Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 30);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ opacity: headerOp }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              color: TEXT_DIM,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            6 steps · one pass
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: TEXT, lineHeight: 1.05 }}>
            From <span style={{ color: ACCENT_2 }}>empty project</span> — to{" "}
            <span style={{ color: ACCENT_3 }}>finished explainer</span>.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 18,
            flex: 1,
            alignItems: "center",
            margin: "40px 0",
          }}
        >
          {RECAP_STEPS.map((step, i) => {
            const delay = 20 + i * 9;
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 22, stiffness: 160 },
            });
            const op = interpolate(s, [0, 1], [0, 1]);
            const y = interpolate(s, [0, 1], [22, 0]);
            return (
              <div
                key={step.label}
                style={{
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  padding: "30px 20px",
                  border: `1px solid ${ACCENT}44`,
                  borderRadius: 16,
                  background: "rgba(0,0,0,0.28)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 20,
                    color: ACCENT_2,
                    letterSpacing: "0.18em",
                  }}
                >
                  {step.n}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 28,
                    color: TEXT,
                    fontWeight: 600,
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: 17, color: TEXT_DIM }}>{step.hint}</div>
              </div>
            );
          })}
        </div>

        <FadeUp delay={80}>
          <div style={{ fontSize: 40, color: TEXT_DIM, textAlign: "center" }}>
            One flow — every explainer comes out the same way.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

const SCENE_COMPONENTS: React.FC[] = [
  Scene1Title,
  Scene2Stock,
  Scene3Plugins,
  Scene4DesignSystem,
  Scene5Voice,
  Scene6Library,
  Scene7Beats,
  Scene8Production,
  Scene9Recap,
];

export const StackExplainer: React.FC<ExplainerProps> = ({
  voiceover,
  voLengths,
  sfxIntroVolume,
  sfxOutroVolume,
}) => {
  const sceneDurations: number[] =
    voiceover && voiceover.length === SCENE_AUDIO_FILES.length
      ? voiceover
      : [...FALLBACK_SCENE_DURATIONS];

  const voLengthsFinal: number[] =
    voLengths && voLengths.length === SCENE_AUDIO_FILES.length
      ? voLengths
      : [...FALLBACK_SCENE_DURATIONS];

  const { sceneStarts, items, totalFrames: visualFrames } = computeTimeline(
    sceneDurations,
    CARD_BEFORE,
  );

  const visualStart = PRE_ROLL_FRAMES;
  const visualEnd = PRE_ROLL_FRAMES + visualFrames;
  const totalFrames = visualEnd + POST_ROLL_FRAMES;

  return (
    <>
      {/* Static poster behind everything. Frame 0 reads as a branded title
          card so inline players (GitHub, web embeds) load on something
          meaningful, not black. Scenes overlay this from PRE_ROLL_FRAMES. */}
      <PosterFrame
        eyebrow="From stock Remotion"
        title={
          <>
            to a <span style={{ color: ACCENT_2 }}>Production Engine</span>
          </>
        }
      />

      {/* Music bed — flat volume, no ducking */}
      <Audio src={staticFile(MUSIC_BED)} volume={BED_VOLUME} endAt={totalFrames} />

      {/* Intro whoosh — peak lands at PRE_ROLL_FRAMES, under the title. */}
      <Sequence durationInFrames={SFX_INTRO_LEN_FRAMES} name="SFX-intro">
        <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
      </Sequence>

      {/* Outro boom — attack lands mid-fade, decay rides into post-roll black. */}
      <Sequence
        from={Math.max(0, visualEnd - SFX_OUTRO_LEAD_IN_FRAMES)}
        durationInFrames={SFX_OUTRO_LEN_FRAMES}
        name="SFX-outro"
      >
        <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
      </Sequence>

      {/* Voiceover — absolute frames include visualStart offset. */}
      {SCENE_AUDIO_FILES.map((file, i) => {
        if (!SCENE_VO_ENABLED[i]) return null;
        return (
          <Sequence
            key={file}
            from={visualStart + sceneStarts[i] + VO_PRE_PAD_FRAMES}
            durationInFrames={voLengthsFinal[i]}
            name={`VO-${file.split("/").pop()}`}
          >
            <Audio src={staticFile(file)} volume={1.0} />
          </Sequence>
        );
      })}

      {/* Wrap the visual timeline inside the pre/post-roll envelope. */}
      <Sequence from={visualStart} durationInFrames={visualFrames} name="visuals">
        <TransitionSeries>
          {items.flatMap((item, i) => {
            const nodes: React.ReactNode[] = [];
            if (item.kind === "scene") {
              const SceneComp = SCENE_COMPONENTS[item.sceneIndex];
              nodes.push(
                <TransitionSeries.Sequence
                  key={`scene-${item.sceneIndex}`}
                  durationInFrames={item.duration}
                >
                  <SceneExit durationInFrames={item.duration}>
                    <SceneComp />
                  </SceneExit>
                </TransitionSeries.Sequence>,
              );
            } else {
              nodes.push(
                <TransitionSeries.Sequence
                  key={`card-${i}-${item.card.label}`}
                  durationInFrames={item.duration}
                >
                  <ChapterCard card={item.card} durationInFrames={item.duration} />
                </TransitionSeries.Sequence>,
              );
            }
            if (i < items.length - 1) {
              nodes.push(<React.Fragment key={`trans-${i}`}>{TRANS()}</React.Fragment>);
            }
            return nodes;
          })}
        </TransitionSeries>
      </Sequence>

      {/* Curtain — fades to black across the last FADE_TO_BLACK_FRAMES of the
          visual section; stays fully black through the post-roll so the boom's
          decay plays into darkness. Meta-payoff: the scene 8 label describes
          what's literally happening on screen as this subcomponent fires. */}
      <FadeToBlack visualEnd={visualEnd} />
    </>
  );
};
