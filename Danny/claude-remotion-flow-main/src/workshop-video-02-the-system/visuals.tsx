import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import {
  ACCENT,
  ACCENT_2,
  EASE_OUT,
  FONT,
  MONO,
  TEXT,
  TEXT_DIM,
} from "../explainer-shared";

// Native 3-tile session loop — Scene 4.
// /session-start → /pre-compact → /session-close → (arrow back to start)
// One tile lights up at a time as the loop progresses.
const LOOP_TILES = [
  { cmd: "/session-start", label: "begin work",  hint: "load context · check plan" },
  { cmd: "/pre-compact",   label: "capture state", hint: "snapshot before drop" },
  { cmd: "/session-close", label: "wrap up",     hint: "log · commit · rest" },
] as const;

export const SessionLoopDiagram: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const cycleFrames = Math.max(60, Math.floor(durationInFrames / 1.4));
  const t = (frame % cycleFrames) / cycleFrames;
  const activeIdx = Math.floor(t * 3) % 3;

  const containerIn = interpolate(frame, [0, 18], [0, 1], {
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        opacity: containerIn,
      }}
    >
      {LOOP_TILES.map((tile, i) => {
        const reveal = interpolate(frame, [i * 14, 30 + i * 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        const isActive = i === activeIdx;
        return (
          <div
            key={tile.cmd}
            style={{
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 16}px) scale(${isActive ? 1.04 : 1})`,
              padding: "22px 32px",
              borderRadius: 14,
              background: isActive ? `${ACCENT}1f` : "rgba(255, 255, 255, 0.04)",
              border: `1.5px solid ${isActive ? ACCENT : `${TEXT_DIM}55`}`,
              minWidth: 460,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transition: "all 0.2s",
              boxShadow: isActive ? `0 18px 40px ${ACCENT}30` : "none",
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                color: isActive ? ACCENT : ACCENT_2,
                fontSize: 30,
                letterSpacing: "0.02em",
              }}
            >
              {tile.cmd}
            </div>
            <div
              style={{
                fontFamily: FONT,
                color: TEXT,
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              {tile.label}
            </div>
            <div
              style={{
                fontFamily: FONT,
                color: TEXT_DIM,
                fontSize: 16,
              }}
            >
              {tile.hint}
            </div>
          </div>
        );
      })}

      {/* Loop arrow — runs from last tile back up to first when last is active */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          color: activeIdx === LOOP_TILES.length - 1 ? ACCENT : `${TEXT_DIM}aa`,
          letterSpacing: "0.18em",
          marginTop: 4,
          transition: "color 0.2s",
        }}
      >
        ↻ loop
      </div>
    </div>
  );
};

// JSONL recovery terminal — Scene 2.
// Shows: terminal block with .jsonl path + cursor + a Claude prompt bubble underneath.
export const JsonlRecoveryTerminal: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();

  const termIn = interpolate(frame, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const promptIn = interpolate(frame, [42, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const cursorBlink = Math.floor(frame / 18) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 32,
        padding: "0 40px",
      }}
    >
      {/* Terminal block */}
      <div
        style={{
          opacity: termIn,
          transform: `translateY(${(1 - termIn) * 16}px)`,
          width: "100%",
          maxWidth: 740,
          borderRadius: 12,
          border: `1px solid ${TEXT_DIM}55`,
          background: "rgba(0, 0, 0, 0.5)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            background: "rgba(255, 255, 255, 0.04)",
            borderBottom: `1px solid ${TEXT_DIM}33`,
          }}
        >
          {[ "#ff5f57", "#febc2e", "#28c840" ].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
          <span
            style={{
              marginLeft: 10,
              fontFamily: MONO,
              color: TEXT_DIM,
              fontSize: 14,
              letterSpacing: "0.04em",
            }}
          >
            ~/.claude/projects/<span style={{ color: TEXT }}>workshop</span>
          </span>
        </div>
        <div
          style={{
            padding: "20px 24px",
            fontFamily: MONO,
            fontSize: 18,
            lineHeight: 1.6,
            color: TEXT,
          }}
        >
          <div style={{ color: TEXT_DIM }}>$ ls *.jsonl</div>
          <div style={{ color: ACCENT }}>session-2026-04-26-103456.jsonl</div>
          <div style={{ color: TEXT_DIM, marginTop: 4 }}>$ <span style={{ opacity: cursorBlink ? 1 : 0 }}>▊</span></div>
        </div>
      </div>

      {/* Prompt request bubble */}
      <div
        style={{
          opacity: promptIn,
          transform: `translateY(${(1 - promptIn) * 12}px)`,
          width: "100%",
          maxWidth: 740,
          padding: "20px 24px",
          borderRadius: 14,
          background: `${ACCENT}14`,
          border: `1px solid ${ACCENT}55`,
          fontFamily: FONT,
          fontSize: 22,
          lineHeight: 1.45,
          color: TEXT,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 14, color: ACCENT_2, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
          you →
        </div>
        Claude, review the <span style={{ color: ACCENT, fontFamily: MONO }}>.jsonl</span> file for this project and pick up where we left off.
      </div>
    </div>
  );
};

// Subtle Ken Burns — re-export same recipe as V1.
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

// Placeholder for screenshot-pending scenes — so render works even before captures land.
export const ScreenshotPlaceholder: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "32px 48px",
          borderRadius: 14,
          border: `2px dashed ${TEXT_DIM}88`,
          background: "rgba(255, 255, 255, 0.02)",
          fontFamily: MONO,
          fontSize: 22,
          color: TEXT_DIM,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};
