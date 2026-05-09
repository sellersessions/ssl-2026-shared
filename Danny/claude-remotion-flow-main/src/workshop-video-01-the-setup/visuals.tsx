import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import {
  ACCENT,
  EASE_OUT,
  FONT,
  FPS,
  MONO,
  TEXT,
  TEXT_DIM,
} from "../explainer-shared";

// Cycling "Built for [audience]" hero — mirrors Anthropic's claude-code page top.
// Engineers first (matches their first frame), sellers last with extra hold (workshop audience punch).
const AUDIENCES = [
  { word: "engineers", holdFrames: 36 },     // 1.2s
  { word: "designers", holdFrames: 36 },
  { word: "creators",  holdFrames: 36 },
  { word: "founders",  holdFrames: 36 },
  { word: "sellers",   holdFrames: 45 },     // 1.5s — extra hold for audience
  { word: "builders",  holdFrames: 36 },
] as const;

const SWAP_FRAMES = 6; // 0.2s crossfade between words

export const CyclingAudienceHero: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();

  // Container fade-in (first 18 frames).
  const containerIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Build cumulative timeline so we know which word is active.
  let acc = 12; // small lead-in before first word lands
  const segments = AUDIENCES.map((a) => {
    const start = acc;
    const end = acc + a.holdFrames;
    acc = end;
    return { ...a, start, end };
  });

  // Find current segment + neighbour for crossfade.
  const activeIdx = segments.findIndex((s) => frame < s.end);
  const safeIdx = activeIdx === -1 ? segments.length - 1 : activeIdx;
  const seg = segments[safeIdx];

  // Per-word reveal: fade-in over first SWAP_FRAMES, fade-out over last SWAP_FRAMES.
  const wordIn = interpolate(frame, [seg.start, seg.start + SWAP_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const wordOut = safeIdx < segments.length - 1
    ? interpolate(frame, [seg.end - SWAP_FRAMES, seg.end], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_OUT,
      })
    : 1; // hold last word

  const wordOpacity = wordIn * wordOut;
  const wordY = (1 - wordIn) * 14 - (1 - wordOut) * 14;

  // Idle "Computing..." pill above (Anthropic's actual page detail, kept for authenticity).
  const pillIn = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const pillPulse = 0.85 + Math.sin((frame / FPS) * Math.PI * 2) * 0.15;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        opacity: containerIn,
      }}
    >
      {/* Computing pill */}
      <div
        style={{
          opacity: pillIn,
          padding: "10px 18px",
          borderRadius: 10,
          border: `1px solid ${ACCENT}66`,
          background: `${ACCENT}10`,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: "0.04em",
          color: ACCENT,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: ACCENT,
          opacity: pillPulse,
        }} />
        Computing...
      </div>

      {/* Built for [audience] */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, fontFamily: FONT }}>
        <span
          style={{
            fontSize: 92,
            fontWeight: 700,
            color: TEXT,
            letterSpacing: "-0.02em",
          }}
        >
          Built for
        </span>
        <span
          style={{
            fontSize: 56,
            color: ACCENT,
            fontWeight: 600,
            transform: "translateY(-6px)",
          }}
        >
          ›
        </span>
        <span
          key={seg.word}
          style={{
            fontSize: 92,
            fontWeight: 700,
            color: ACCENT,
            letterSpacing: "-0.02em",
            opacity: wordOpacity,
            transform: `translateY(${wordY}px)`,
            display: "inline-block",
            minWidth: 360,
          }}
        >
          {seg.word}
        </span>
      </div>
    </div>
  );
};

// Native 4-node loop diagram — Scene 2.
// Nodes: prompt → Claude acts → check → repeat. Pulse follows the cycle.
const LOOP_NODES = [
  { label: "you prompt",  x: 0.18, y: 0.30 },
  { label: "Claude acts", x: 0.82, y: 0.30 },
  { label: "you check",   x: 0.82, y: 0.78 },
  { label: "loop back",   x: 0.18, y: 0.78 },
] as const;

export const LoopDiagram: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const cycleFrames = Math.max(60, Math.floor(durationInFrames / 1.6));
  const t = (frame % cycleFrames) / cycleFrames;
  const activeIdx = Math.floor(t * 4) % 4;

  const containerIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Stagger nodes in: 0,12,24,36
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: containerIn,
      }}
    >
      <svg
        viewBox="0 0 1000 700"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connecting lines — drawn first, behind nodes */}
        {LOOP_NODES.map((node, i) => {
          const next = LOOP_NODES[(i + 1) % LOOP_NODES.length];
          const x1 = node.x * 1000;
          const y1 = node.y * 700;
          const x2 = next.x * 1000;
          const y2 = next.y * 700;
          const lineProgress = interpolate(frame, [12 + i * 8, 36 + i * 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          const dx = x2 - x1;
          const dy = y2 - y1;
          const cx = x1 + dx * lineProgress;
          const cy = y1 + dy * lineProgress;
          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={cx}
              y2={cy}
              stroke={i === activeIdx ? ACCENT : `${TEXT_DIM}55`}
              strokeWidth={i === activeIdx ? 3 : 2}
              strokeDasharray={i === activeIdx ? "0" : "8 6"}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {LOOP_NODES.map((node, i) => {
        const reveal = interpolate(frame, [i * 12, 18 + i * 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        const isActive = i === activeIdx;
        return (
          <div
            key={node.label}
            style={{
              position: "absolute",
              left: `${node.x * 100}%`,
              top: `${node.y * 100}%`,
              transform: `translate(-50%, -50%) scale(${reveal * (isActive ? 1.06 : 1)})`,
              opacity: reveal,
              padding: "16px 28px",
              borderRadius: 12,
              background: isActive ? `${ACCENT}22` : "rgba(255, 255, 255, 0.04)",
              border: `1.5px solid ${isActive ? ACCENT : `${TEXT_DIM}66`}`,
              fontFamily: MONO,
              fontSize: 28,
              color: isActive ? TEXT : TEXT_DIM,
              letterSpacing: "0.02em",
              transition: "all 0.2s",
              minWidth: 220,
              textAlign: "center",
            }}
          >
            {node.label}
          </div>
        );
      })}
    </div>
  );
};

// Subtle Ken Burns image — same recipe as ch05.
export const KenBurnsImage: React.FC<{
  src: string;
  durationInFrames: number;
  startFrame?: number;
}> = ({ src, durationInFrames, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const t = (frame - startFrame) / Math.max(1, durationInFrames);
  const scale = 1 + Math.max(0, t) * 0.06;
  const dx = Math.max(0, t) * 12;
  const dy = Math.max(0, t) * 8;
  const fadeIn = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          maxWidth: "94%",
          maxHeight: "88%",
          objectFit: "contain",
          transform: `scale(${scale}) translate(${dx}px, ${dy}px)`,
          filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45))",
          borderRadius: 12,
        }}
      />
    </div>
  );
};
