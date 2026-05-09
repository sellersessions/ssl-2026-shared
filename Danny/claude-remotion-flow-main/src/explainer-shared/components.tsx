import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { noise2D } from "@remotion/noise";
import {
  ACCENT_2,
  BG,
  EASE_OUT,
  FONT,
  GRAIN_SVG,
  MONO,
  TEXT,
  TEXT_DIM,
  TRANS_EASE,
} from "./tokens";
import {
  EXIT_FRAMES,
  FADE_TO_BLACK_FRAMES,
  TRANS_FRAMES,
} from "./constants";
import type { ChapterCardSpec } from "./timeline";

// Low-frequency camera drift + film-grain overlay. Keeps every scene alive
// when the foreground is static.
export const SceneBG: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = noise2D("dx", frame / 90, 0) * 2;
  const dy = noise2D("dy", 0, frame / 90) * 2;
  return (
    <>
      <AbsoluteFill style={{ background: BG, transform: `translate(${dx}px, ${dy}px)` }} />
      <AbsoluteFill style={{ opacity: 0.035, mixBlendMode: "overlay", backgroundImage: GRAIN_SVG }} />
    </>
  );
};

export const easeIn = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Spring-driven rise + fade. Default offset is 40px; pass 0 for pure fade.
export const FadeUp: React.FC<{
  delay: number;
  children: React.ReactNode;
  offsetY?: number;
}> = ({ delay, children, offsetY = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  const y = interpolate(s, [0, 1], [offsetY, 0]);
  const op = interpolate(s, [0, 1], [0, 1]);
  return <div style={{ opacity: op, transform: `translateY(${y}px)` }}>{children}</div>;
};

// Cross-fade transition factory. Pass as a child of <TransitionSeries>.
export const TRANS = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANS_FRAMES, easing: TRANS_EASE })}
  />
);

// Scales + fades a scene out in its final EXIT_FRAMES frames so the
// subsequent cross-fade doesn't feel abrupt.
export const SceneExit: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const exitStart = durationInFrames - EXIT_FRAMES;
  const p = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <AbsoluteFill style={{ opacity: 1 - p, transform: `scale(${1 - p * 0.04})` }}>
      {children}
    </AbsoluteFill>
  );
};

// Static branded poster shown behind the entire timeline. Frame 0 of every
// rendered MP4 must be this — not a fade-from-black — so inline players
// (GitHub user-attachments, web embeds) load on the title card. Scenes drawn
// on top fully cover it once they begin; FadeToBlack hides it at the end.
export const PosterFrame: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
}> = ({ eyebrow, title }) => {
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
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              width: 520,
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
            }}
          >
            {title}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Last-N-frames black curtain. Wrapped separately so it can subscribe to
// useCurrentFrame without forcing the parent to.
export const FadeToBlack: React.FC<{ visualEnd: number }> = ({ visualEnd }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [visualEnd - FADE_TO_BLACK_FRAMES, visualEnd],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity, pointerEvents: "none" }} />
  );
};

// Chapter card — a labelled pause between major sections ("Layer 01 · The
// Brief"). Used in TreatmentExplainer; optional per-composition.
export const ChapterCard: React.FC<{
  card: ChapterCardSpec;
  durationInFrames: number;
}> = ({ card, durationInFrames }) => {
  const frame = useCurrentFrame();
  const fadeIn = Math.min(10, Math.floor(durationInFrames / 3));
  const fadeOut = Math.min(10, Math.floor(durationInFrames / 3));
  const fadeOutStart = durationInFrames - fadeOut;

  const op = interpolate(
    frame,
    [0, fadeIn, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT },
  );
  const ruleScale = interpolate(frame, [0, fadeIn + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill>
      <SceneBG />
      <AbsoluteFill
        style={{
          opacity: op,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 24,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: ACCENT_2,
            opacity: 0.9,
          }}
        >
          {card.label}
        </div>
        <div
          style={{
            width: 280,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${TEXT_DIM}, transparent)`,
            transform: `scaleX(${ruleScale})`,
          }}
        />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 92,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: TEXT,
            textAlign: "center",
          }}
        >
          {card.title}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
