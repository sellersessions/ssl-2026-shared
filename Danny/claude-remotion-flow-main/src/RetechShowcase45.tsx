import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { evolvePath } from "@remotion/paths";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { z } from "zod";

// Editorial serif for the outro slogan. Italic 400 only -- keeps the
// font payload small (avoids the multi-weight Inter request flood).
const { fontFamily: SERIF } = loadPlayfair("italic", { weights: ["400"] });

export const FALLBACK_DURATION_IN_FRAMES = 1348;

export const retechShowcase45Schema = z.object({});

export const calculateMetadata = async () => ({
  durationInFrames: FALLBACK_DURATION_IN_FRAMES,
});

const FPS = 30;
const BPM = 114.84;
const BAR = (FPS * 60) / BPM; // 15.673 frames per bar

const ASSET = "assets/retech-showcase";

// Brand palette (from retechuk-cycle3.netlify.app)
const C = {
  cream: "#f5f3ee",
  paper: "#fbf9f4",
  ink: "#1b1c19",
  aubergine: "#481925",
  rose: "#7a403b",
  pink: "#de96a4",
  tan: "#bca87a",
} as const;

// Beat-locked segment plan. `from` is absolute comp frame, `dur` is comp frames.
type Seg = { from: number; dur: number; src: string; freeze?: number };
const SEGS: Seg[] = [
  { from: 0,    dur: 125, src: "01-pocket-detail-a.mp4" },
  { from: 125,  dur: 125, src: "02-pocket-detail-b.mp4" },
  { from: 250,  dur: 220, src: "03-walk-hero-a.mp4", freeze: 63 },
  { from: 470,  dur: 125, src: "04-walk-hero-b.mp4" },
  { from: 595,  dur: 125, src: "05-walk-back.mp4" },
  { from: 720,  dur: 94,  src: "06-tee-blue-cobble.mp4" },
  { from: 814,  dur: 220, src: "07-tee-blue-front.mp4", freeze: 63 },
  { from: 1034, dur: 157, src: "08-tee-olive-walk.mp4" },
  { from: 1191, dur: 157, src: "09-tee-white-walk.mp4" },
];

const FLASH_FRAMES = 4;
const FREEZE_FRAMES = 6;

// ---- Black flash overlay -------------------------------------------------
// Renders an absolutely-positioned black layer that fades 1->0 over
// FLASH_FRAMES at every cut boundary. Lands on the downbeat.
const BlackFlash: React.FC<{ cutFrame: number }> = ({ cutFrame }) => {
  const frame = useCurrentFrame();
  const local = frame - cutFrame;
  if (local < 0 || local >= FLASH_FRAMES) return null;
  const opacity = interpolate(local, [0, FLASH_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity, pointerEvents: "none" }} />
  );
};

// Always-mounted freeze still. Sits in the tree for the whole comp; just
// flips opacity in the freeze window. No Sequence mount/unmount = no React
// tree change at the freeze edges.
const FreezeStill: React.FC<{ frameStart: number; src: string }> = ({ frameStart, src }) => {
  const frame = useCurrentFrame();
  const visible = frame >= frameStart && frame < frameStart + FREEZE_FRAMES;
  return (
    <AbsoluteFill style={{ opacity: visible ? 1 : 0, pointerEvents: "none" }}>
      <Img src={staticFile(`${ASSET}/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

// Final fade-to-black over the last 1.5s.
const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const start = FALLBACK_DURATION_IN_FRAMES - 45; // 1.5s @ 30fps
  if (frame < start) return null;
  const opacity = interpolate(frame, [start, FALLBACK_DURATION_IN_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity, pointerEvents: "none" }} />
  );
};

// ---- Brand cards ---------------------------------------------------------
const Wordmark: React.FC<{ size?: number; color?: string }> = ({ size = 64, color = C.ink }) => (
  <div
    style={{
      fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 600,
      fontSize: size,
      letterSpacing: size * 0.18,
      color,
    }}
  >
    RE TECH UK
  </div>
);

const IntroCard: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(local, [dur - 12, dur], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream, alignItems: "center", justifyContent: "center", opacity }}>
      <Wordmark size={88} color={C.ink} />
      <div style={{ marginTop: 18, color: C.rose, fontSize: 24, letterSpacing: 4, fontWeight: 500 }}>
        SPRING COLLECTION
      </div>
    </AbsoluteFill>
  );
};

// Soft elliptical halo behind centered text. No box edges -- just a wash so
// cream caps survive bright/dark/mixed backgrounds without reading as a card.
const HALO =
  "radial-gradient(ellipse 62% 72% at center, rgba(27,28,25,0.46) 0%, rgba(27,28,25,0.20) 50%, rgba(27,28,25,0) 78%)";
const TEXT_SHADOW =
  "0 1px 14px rgba(27,28,25,0.55), 0 0 28px rgba(27,28,25,0.35)";

// Animated rule line via @remotion/paths -- strokes left-to-right rather than
// scaling from zero. Reads more refined and lets us share one component.
const Rule: React.FC<{ length: number; progress: number; color?: string; thickness?: number; opacity?: number }> = ({
  length,
  progress,
  color = C.cream,
  thickness = 1,
  opacity = 0.9,
}) => {
  const path = `M 0 ${thickness / 2} L ${length} ${thickness / 2}`;
  const evo = evolvePath(progress, path);
  return (
    <svg
      width={length}
      height={thickness}
      viewBox={`0 0 ${length} ${thickness}`}
      style={{ display: "block", overflow: "visible", opacity }}
    >
      <path d={path} stroke={color} strokeWidth={thickness} strokeLinecap="square" fill="none" {...evo} />
    </svg>
  );
};

const Tagline: React.FC<{ from: number; dur: number; text: string }> = ({ from, dur, text }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const fadeIn = interpolate(local, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(local, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  const ruleProgress = interpolate(local, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty = interpolate(local, [0, 18], [10, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity, pointerEvents: "none" }}>
      <div
        style={{
          padding: "70px 130px",
          background: HALO,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          transform: `translateY(${ty}px)`,
        }}
      >
        <Rule length={200} progress={ruleProgress} />

        <div
          style={{
            color: C.cream,
            fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: 7,
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.45,
            textShadow: TEXT_SHADOW,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ColorChip: React.FC<{ from: number; dur: number; label: string; swatch: string; index: number; total: number }> = ({ from, dur, label, swatch, index, total }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const fadeIn = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(local, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  const ruleProgress = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty = interpolate(local, [0, 14], [10, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, alignItems: "flex-start", justifyContent: "flex-end", paddingBottom: 80, paddingLeft: 90 }}>
      <div
        style={{
          padding: "44px 90px",
          background: HALO,
          color: C.cream,
          fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
          textAlign: "left",
          textShadow: TEXT_SHADOW,
          transform: `translateY(${ty}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 14 }}>
          <div style={{ fontSize: 17, letterSpacing: 6, fontWeight: 600 }}>{label}</div>
          <div style={{ width: 14, height: 14, backgroundColor: swatch, outline: `1px solid ${C.cream}`, outlineOffset: 2 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start", margin: "12px 0" }}>
          <Rule length={60} progress={ruleProgress} opacity={0.7} />
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, fontWeight: 500, opacity: 0.85, textAlign: "left" }}>
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}  ·  SS 26
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutroCard: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const fadeIn = interpolate(local, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const opacity = fadeIn;
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream, alignItems: "center", justifyContent: "center", opacity }}>
      <Wordmark size={48} color={C.ink} />
      <div
        style={{
          marginTop: 30,
          color: C.aubergine,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 64,
          letterSpacing: -0.6,
          lineHeight: 1.05,
          textAlign: "center",
        }}
      >
        shop the collection
      </div>
      <div style={{ marginTop: 18, color: C.ink, opacity: 0.55, fontSize: 14, letterSpacing: 5, fontWeight: 500 }}>
        RETECH.UK
      </div>
    </AbsoluteFill>
  );
};

// ---- Main composition ----------------------------------------------------
export const RetechShowcase45: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      {/* Video segments -- ONE OffthreadVideo per clip, full duration. The
          freeze accent is now an Img overlay layered on top, so the underlying
          video decoder never remounts mid-segment. Eliminates the two split
          points Danny flagged on the timeline. Tradeoff: no "stutter" repeat
          after the freeze; the still simply masks 6 frames while the video
          continues underneath. If we want the stutter back, bake it into the
          source clip with ffmpeg instead of doing it in the composition. */}
      {SEGS.map((seg, i) => (
        <Sequence key={`vid-${i}`} from={seg.from} durationInFrames={seg.dur}>
          <OffthreadVideo src={staticFile(`${ASSET}/${seg.src}`)} muted />
        </Sequence>
      ))}
      {/* Freeze accents removed entirely -- isolation test for the click. */}

      {/* Black flash on every segment downbeat -- DISABLED for audio-clipping
          isolation test. Re-enable after confirming the click was elsewhere. */}
      {/*
      {SEGS.map((seg, i) => (
        <BlackFlash key={`flash-${i}`} cutFrame={seg.from} />
      ))}
      */}

      {/* Brand graphics layer */}
      <IntroCard from={0} dur={28} />
      <Tagline from={250} dur={95} text="considered everyday essentials" />
      <Tagline from={595} dur={95} text="for women who work with no boundaries" />
      <ColorChip from={814}  dur={66} label="DUSK BLUE" swatch="#7ea3c7" index={1} total={3} />
      <ColorChip from={1034} dur={66} label="OLIVE"     swatch="#5a5d2e" index={2} total={3} />
      <ColorChip from={1191} dur={66} label="WHITE"     swatch="#f1ede5" index={3} total={3} />
      <OutroCard from={1257} dur={91} />

      {/* Final video fade-to-black (matches audio fade) */}
      <FadeOut />

      {/* Audio bed — DISABLED for silent render. Music muxed in via ffmpeg post-render. */}
      {/* <Audio
        src={staticFile(`${ASSET}/alessia-here_loop.wav`)}
        volume={(f) => {
          const CEIL = 0.85;
          const fadeStart = FALLBACK_DURATION_IN_FRAMES - 45;
          if (f < fadeStart) return CEIL;
          const t = (f - fadeStart) / 45;
          return Math.max(0, CEIL * (1 - t));
        }}
      /> */}
    </AbsoluteFill>
  );
};
