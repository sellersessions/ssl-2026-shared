import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

import {
  ACCENT_2,
  BG,
  CANVAS_H,
  CANVAS_W,
  EASE_OUT,
  FONT,
  GRAIN_SVG,
  MONO,
  TEXT,
  TEXT_DIM,
} from "../explainer-shared/tokens";
import {
  FPS,
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_OUTRO,
  SFX_OUTRO_LEN_FRAMES,
} from "../explainer-shared/constants";
import { BEDS } from "../explainer-shared/audio-beds";

const VIDEO_SRC = "assets/loom-cuts/ai-workshop-umbrella-v2/preview.mp4";

const VIDEO_DURATION_S = 255.7;
const VIDEO_DURATION_FRAMES = Math.ceil(VIDEO_DURATION_S * FPS);

const INTRO_FRAMES = Math.round(5 * FPS); // 5s brand title card
const OUTRO_FRAMES = Math.round(18 * FPS); // 18s roundup + CTA

const TOTAL_FRAMES = INTRO_FRAMES + VIDEO_DURATION_FRAMES + OUTRO_FRAMES;

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
          AI Workshop 2.0
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
          The Self-Drive Loop
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
          Read · Give · Walk · Refine
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ROUNDUP_BULLETS = [
  { word: "READ", line: "Open the module README." },
  { word: "GIVE", line: "Right-click the self-drive file → Copy path → Paste in Claude." },
  { word: "WALK", line: "Claude walks you through. You complete each step." },
  { word: "REFINE", line: "End-of-module feedback — every pass gets sharper." },
];

const RoundupCard: React.FC<{ durationInFrames: number }> = ({
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
          The loop, every module
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
          Read · Give · Walk · Refine
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {ROUNDUP_BULLETS.map((b, i) => {
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
                    width: 180,
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
          → Open Module 000
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const umbrellaTutorialSchema = z.object({
  bedVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});

export type UmbrellaTutorialProps = z.infer<typeof umbrellaTutorialSchema>;

export const UMBRELLA_TUTORIAL_DURATION = TOTAL_FRAMES;

export const calculateUmbrellaTutorialMetadata: CalculateMetadataFunction<
  UmbrellaTutorialProps
> = async ({ props }) => {
  return {
    durationInFrames: TOTAL_FRAMES,
    fps: FPS,
    width: CANVAS_W,
    height: CANVAS_H,
    props,
  };
};

export const UmbrellaTutorial: React.FC<UmbrellaTutorialProps> = ({
  bedVolume,
  sfxIntroVolume,
  sfxOutroVolume,
}) => {
  const videoStart = INTRO_FRAMES;
  const outroStart = INTRO_FRAMES + VIDEO_DURATION_FRAMES;
  const sfxIntroFrom = 90;
  const sfxOutroFrom = 7831;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio
        src={staticFile(BEDS.HOUSE_DEFAULT)}
        volume={bedVolume}
        endAt={TOTAL_FRAMES}
      />
      <Sequence from={0} durationInFrames={INTRO_FRAMES} name="intro-card">
        <IntroCard durationInFrames={INTRO_FRAMES} />
      </Sequence>

      <Sequence
        from={videoStart}
        durationInFrames={VIDEO_DURATION_FRAMES}
        name="video"
      >
        <AbsoluteFill style={{ background: "#000" }}>
          <OffthreadVideo
            src={staticFile(VIDEO_SRC)}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO_FRAMES} name="roundup">
        <RoundupCard durationInFrames={OUTRO_FRAMES} />
      </Sequence>

      <Sequence
        from={sfxIntroFrom}
        durationInFrames={SFX_INTRO_LEN_FRAMES}
        name="sfx-intro"
      >
        <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
      </Sequence>

      <Sequence
        from={sfxOutroFrom}
        durationInFrames={SFX_OUTRO_LEN_FRAMES}
        name="sfx-outro"
      >
        <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};
