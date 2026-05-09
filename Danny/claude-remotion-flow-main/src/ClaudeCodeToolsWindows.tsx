import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

import { FPS } from "./explainer-shared/constants";
import { BEDS } from "./explainer-shared/audio-beds";
import {
  TimelineAudio,
  computeAudioTimeline,
} from "./explainer-shared/audio-timeline";
import {
  ACCENT_2,
  BG,
  EASE_OUT,
  FONT,
  GRAIN_SVG,
  MONO,
  TEXT,
  TEXT_DIM,
} from "./explainer-shared/tokens";

// ClaudeCodeToolsWindows -- 10 mastered chapter assets played back-to-back,
// bookended by an intro card (whoosh underneath) and an outro card (boom
// underneath). Audio envelope is delegated to TimelineAudio.

const SOURCE_DIR = "assets/loom-cuts/claude-code-tools-windows_mastered";

const INTRO_FRAMES = Math.round(5.5 * FPS); // 5.5s — whoosh peaks at title reveal
const OUTRO_FRAMES = Math.round(12 * FPS);  // 12s — title + bullets + CTA

type Clip = {
  idx: number;
  slug: string;
  durationSeconds: number;
};

const CLIPS: readonly Clip[] = [
  { idx: 1,  slug: "01_intro-what-well-install",                durationSeconds: 31.354 },
  { idx: 2,  slug: "02_claude-desktop-windows-install",         durationSeconds: 72.396 },
  { idx: 3,  slug: "03_vs-code-windows-install",                durationSeconds: 97.688 },
  { idx: 4,  slug: "04_claude-code-extension-in-vs-code",       durationSeconds: 62.646 },
  { idx: 5,  slug: "05_mcps-node-nvm-setup",                    durationSeconds: 158.063 },
  { idx: 6,  slug: "06_sequential-thinking-mcp",                durationSeconds: 112.771 },
  { idx: 7,  slug: "07_adding-mcps-to-claude-code-claudejson",  durationSeconds: 120.688 },
  { idx: 8,  slug: "08_context7-mcp-free-api-key",              durationSeconds: 157.145 },
  { idx: 9,  slug: "09_global-vs-project-level-mcps",           durationSeconds: 75.854 },
  { idx: 10, slug: "10_closing-qa",                             durationSeconds: 18.521 },
];

const clipFrames = (seconds: number): number => Math.ceil(seconds * FPS);

const VISUAL_FRAMES = CLIPS.reduce(
  (acc, c) => acc + clipFrames(c.durationSeconds),
  0,
);

const LAYOUT = computeAudioTimeline(VISUAL_FRAMES, {
  kind: "carded",
  introFrames: INTRO_FRAMES,
  outroFrames: OUTRO_FRAMES,
  whooshLeadIn: 0,    // whoosh fires at frame 0, peaks ~3.8s in
  boomLeadIn: 12,     // boom hits 0.4s into outro card, under the title spring
});

const IntroCard: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ruleScale = spring({
    frame: frame - 8,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const titleSpring = spring({
    frame: frame - 14,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const subSpring = spring({
    frame: frame - 22,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [40, 0]);
  const subOp = interpolate(subSpring, [0, 1], [0, 1]);
  const exitOp = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT },
  );

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <AbsoluteFill style={{ background: BG }} />
      <AbsoluteFill
        style={{
          opacity: 0.04,
          mixBlendMode: "overlay",
          backgroundImage: GRAIN_SVG,
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: ACCENT_2,
            opacity: 0.95,
          }}
        >
          AI Workshop 2.0 · Module 000
        </div>
        <div
          style={{
            width: 320,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${TEXT_DIM}, transparent)`,
            transform: `scaleX(${ruleScale})`,
          }}
        />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: TEXT,
            textAlign: "center",
            transform: `translateY(${titleY}px)`,
            opacity: titleOp,
          }}
        >
          Claude Code
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: TEXT_DIM,
            textAlign: "center",
            transform: `translateY(${subY}px)`,
            opacity: subOp,
          }}
        >
          Windows install · with Leo
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const OUTRO_BULLETS = [
  { word: "DESKTOP", line: "Claude Desktop installed and signed in." },
  { word: "VS CODE", line: "Editor with Claude Code extension wired up." },
  { word: "MCPS",    line: "Sequential Thinking + Context7, ready to call." },
  { word: "CONFIG",  line: "Global vs project — you know where MCPs live." },
];

const OutroCard: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOp = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const exitOp = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT },
  );

  const eyebrowSpring = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const titleSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const ctaSpring = spring({
    frame: frame - 130,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(enterOp, exitOp) }}>
      <AbsoluteFill style={{ background: BG }} />
      <AbsoluteFill
        style={{
          opacity: 0.04,
          mixBlendMode: "overlay",
          backgroundImage: GRAIN_SVG,
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "110px 140px",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: ACCENT_2,
            opacity: interpolate(eyebrowSpring, [0, 1], [0, 0.95]),
            marginBottom: 28,
          }}
        >
          Module 000 · Complete
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: TEXT,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            marginBottom: 56,
          }}
        >
          You're set up.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {OUTRO_BULLETS.map((b, i) => {
            const bSpring = spring({
              frame: frame - (28 + i * 14),
              fps,
              config: { damping: 18, stiffness: 100 },
            });
            const op = interpolate(bSpring, [0, 1], [0, 1]);
            const x = interpolate(bSpring, [0, 1], [-30, 0]);
            return (
              <div
                key={b.word}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 32,
                  opacity: op,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    color: ACCENT_2,
                    width: 220,
                  }}
                >
                  {b.word}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 30,
                    color: TEXT_DIM,
                    letterSpacing: "0.01em",
                    flex: 1,
                  }}
                >
                  {b.line}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontFamily: FONT,
            fontSize: 60,
            fontWeight: 600,
            color: TEXT,
            letterSpacing: "-0.01em",
            transform: `translateY(${interpolate(ctaSpring, [0, 1], [24, 0])}px)`,
            opacity: interpolate(ctaSpring, [0, 1], [0, 1]),
          }}
        >
          → Open Module 00
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const claudeCodeToolsWindowsSchema = z.object({
  bedVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});
export type ClaudeCodeToolsWindowsProps = z.infer<typeof claudeCodeToolsWindowsSchema>;

export const calculateMetadata: CalculateMetadataFunction<
  ClaudeCodeToolsWindowsProps
> = () => ({
  durationInFrames: LAYOUT.totalFrames,
  fps: FPS,
  width: 1920,
  height: 1080,
});

export const FALLBACK_DURATION_IN_FRAMES = LAYOUT.totalFrames;

export const ClaudeCodeToolsWindows: React.FC<ClaudeCodeToolsWindowsProps> = ({
  bedVolume,
  sfxIntroVolume,
  sfxOutroVolume,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TimelineAudio
        layout={LAYOUT}
        bed={{ src: BEDS.HOUSE_DEFAULT, volume: bedVolume }}
        sfxIntroVolume={sfxIntroVolume}
        sfxOutroVolume={sfxOutroVolume}
      />

      <Sequence
        from={LAYOUT.introStart}
        durationInFrames={INTRO_FRAMES}
        name="intro-card"
      >
        <IntroCard durationInFrames={INTRO_FRAMES} />
      </Sequence>

      <Sequence
        from={LAYOUT.visualStart}
        durationInFrames={VISUAL_FRAMES}
        name="voice-clips"
      >
        <Series>
          {CLIPS.map((clip) => (
            <Series.Sequence
              key={clip.slug}
              durationInFrames={clipFrames(clip.durationSeconds)}
              name={`${clip.idx.toString().padStart(2, "0")} ${clip.slug}`}
            >
              <OffthreadVideo src={staticFile(`${SOURCE_DIR}/${clip.slug}.mp4`)} />
            </Series.Sequence>
          ))}
        </Series>
      </Sequence>

      <Sequence
        from={LAYOUT.outroStart}
        durationInFrames={OUTRO_FRAMES}
        name="outro-card"
      >
        <OutroCard durationInFrames={OUTRO_FRAMES} />
      </Sequence>
    </AbsoluteFill>
  );
};
