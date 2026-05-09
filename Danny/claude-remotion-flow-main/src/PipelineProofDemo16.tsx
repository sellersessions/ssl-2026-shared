import React from "react";
import {
  AbsoluteFill,
  Audio,
  Freeze,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FALLBACK_DURATION_IN_FRAMES = 480;

export const pipelineProofDemo16Schema = z.object({});

export const calculateMetadata = async () => ({
  durationInFrames: FALLBACK_DURATION_IN_FRAMES,
});

const SRC = "assets/pipeline-proof/snooze-1-raw.mp4";
const SFX_1 = "assets/sfx/library/transitions/pixabay-dragon-studio-whoosh-cinematic-f5a010a2d7.mp3";
const SFX_2 = "assets/sfx/library/transitions/pixabay-virtual-vibes-whoosh-short-realistic-6a39f5faa1.mp3";
const SFX_3 = "assets/sfx/library/transitions/pixabay-virtualzero-whoosh-classic-clear-cinematic-86051f7a1a.mp3";
const SFX_4 = "assets/sfx/library/transitions/pixabay-lordsonny-whoosh-cinematic-766a043a34.mp3";

const FPS = 30;
const SEG1 = { from: 0,   dur: 120, srcSec: 8.72  };  // 4.0s Ken Burns
const W1   = { from: 120, dur: 9 };                    // 0.30s whip-pan
const SEG2 = { from: 129, dur: 96,  srcSec: 13.02 };  // 3.2s punch-in
const W2   = { from: 225, dur: 9 };
const SEG3A = { from: 234, dur: 55, srcSec: 16.52, rate: 1.5 }; // 1.83s @1.5x
const SEG3B = { from: 289, dur: 56, srcSec: 19.295, rate: 1.0 }; // 1.87s
const W3   = { from: 345, dur: 9 };
const SEG4 = { from: 354, dur: 126, srcSec: 21.1 };  // 4.2s tagline

const LUT = "contrast(1.30) saturate(1.25) brightness(1.0)";
const VIGNETTE = "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.50) 100%)";

const Label: React.FC<{ text: string; localFrame: number }> = ({ text, localFrame }) => {
  const opacity = spring({
    frame: Math.max(0, localFrame - 4),
    fps: FPS,
    config: { damping: 18, stiffness: 120 },
  });
  const ty = interpolate(opacity, [0, 1], [22, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        bottom: 90,
        padding: "20px 36px",
        background: "rgba(0,0,0,0.6)",
        color: "white",
        fontSize: 44,
        fontFamily: "Helvetica, Arial, sans-serif",
        fontWeight: 700,
        letterSpacing: 0.3,
        opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Tagline: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const opacity = spring({
    frame: Math.max(0, localFrame - 8),
    fps: FPS,
    config: { damping: 20, stiffness: 100 },
  });
  const scale = interpolate(opacity, [0, 1], [0.92, 1]);
  return (
    <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          padding: "36px 56px",
          background: "rgba(0,0,0,0.72)",
          color: "white",
          fontSize: 56,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 700,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.2,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        All from a folder of raw clips.
      </div>
    </AbsoluteFill>
  );
};

const WhipPan: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const blur = interpolate(local, [0, dur / 2, dur], [0, 38, 0]);
  const tx = interpolate(local, [0, dur], [0, -1600]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        filter: `blur(${blur}px)`,
        transform: `translateX(${tx}px)`,
      }}
    />
  );
};

export const PipelineProofDemo16: React.FC = () => {
  const frame = useCurrentFrame();

  const seg1Local = frame - SEG1.from;
  const seg1Zoom = interpolate(seg1Local, [0, SEG1.dur], [1.0, 1.08], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const seg1PanX = interpolate(seg1Local, [0, SEG1.dur], [0, 80], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const seg2Local = frame - SEG2.from;
  const seg2Zoom = interpolate(seg2Local, [0, SEG2.dur], [1.0, 1.25], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {/* Seg 1 -- Ken Burns */}
      <Sequence from={SEG1.from} durationInFrames={SEG1.dur}>
        <AbsoluteFill
          style={{
            filter: LUT,
            transform: `scale(${seg1Zoom}) translateX(${seg1PanX}px)`,
            transformOrigin: "center center",
          }}
        >
          <OffthreadVideo
            src={staticFile(SRC)}
            startFrom={Math.round(SEG1.srcSec * FPS)}
            muted
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
        <Label text="1. Auto-pick" localFrame={seg1Local} />
      </Sequence>

      {/* Whip-pan 1 */}
      <WhipPan from={W1.from} dur={W1.dur} />

      {/* Seg 2 -- punch-in */}
      <Sequence from={SEG2.from} durationInFrames={SEG2.dur}>
        <AbsoluteFill
          style={{
            filter: LUT,
            transform: `scale(${seg2Zoom})`,
            transformOrigin: "center center",
          }}
        >
          <OffthreadVideo
            src={staticFile(SRC)}
            startFrom={Math.round(SEG2.srcSec * FPS)}
            muted
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
        <Label text="2. Zoom" localFrame={seg2Local} />
      </Sequence>

      {/* Whip-pan 2 */}
      <WhipPan from={W2.from} dur={W2.dur} />

      {/* Seg 3a -- 1.5x */}
      <Sequence from={SEG3A.from} durationInFrames={SEG3A.dur}>
        <AbsoluteFill style={{ filter: LUT }}>
          <OffthreadVideo
            src={staticFile(SRC)}
            startFrom={Math.round(SEG3A.srcSec * FPS)}
            playbackRate={SEG3A.rate}
            muted
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
        <Label text="3. Speed ramp" localFrame={frame - SEG3A.from} />
      </Sequence>

      {/* Seg 3b -- 1.0x */}
      <Sequence from={SEG3B.from} durationInFrames={SEG3B.dur}>
        <AbsoluteFill style={{ filter: LUT }}>
          <OffthreadVideo
            src={staticFile(SRC)}
            startFrom={Math.round(SEG3B.srcSec * FPS)}
            muted
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
        <Label text="3. Speed ramp" localFrame={frame - SEG3A.from} />
      </Sequence>

      {/* Whip-pan 3 */}
      <WhipPan from={W3.from} dur={W3.dur} />

      {/* Seg 4 -- tagline on frozen frame */}
      <Sequence from={SEG4.from} durationInFrames={SEG4.dur}>
        <Freeze frame={SEG4.from}>
          <AbsoluteFill style={{ filter: `${LUT} blur(6px) brightness(0.7)` }}>
            <OffthreadVideo
              src={staticFile(SRC)}
              startFrom={Math.round(SEG4.srcSec * FPS)}
              muted
            />
          </AbsoluteFill>
        </Freeze>
        <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
        <Tagline localFrame={frame - SEG4.from} />
      </Sequence>

      {/* SFX layer -- timed to whip-pans + tagline land */}
      <Sequence from={W1.from - 4}>
        <Audio src={staticFile(SFX_1)} volume={0.85} />
      </Sequence>
      <Sequence from={W2.from - 4}>
        <Audio src={staticFile(SFX_2)} volume={0.85} />
      </Sequence>
      <Sequence from={W3.from - 4}>
        <Audio src={staticFile(SFX_3)} volume={0.85} />
      </Sequence>
      <Sequence from={SEG4.from}>
        <Audio src={staticFile(SFX_4)} volume={0.85} />
      </Sequence>
    </AbsoluteFill>
  );
};
