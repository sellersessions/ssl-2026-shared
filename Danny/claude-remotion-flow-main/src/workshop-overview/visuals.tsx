import { useCurrentFrame, interpolate } from "remotion";
import {
  ACCENT,
  ACCENT_2,
  EASE_OUT,
  FONT,
  MONO,
  TEXT,
  TEXT_DIM,
} from "../explainer-shared";

// Scene 1 — kinetic three-beat: READ → SELF-DRIVE → CLAUDE BUILDS.
// Each phrase lands with an accent flash. Word stagger + held pulse.
const BEATS = ["READ", "SELF-DRIVE", "CLAUDE BUILDS"] as const;

export const KineticThreeBeat: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const containerIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Distribute beats across the scene with lead-in + tail.
  const lead = 12;
  const tail = 18;
  const usable = Math.max(60, durationInFrames - lead - tail);
  const beatStep = usable / BEATS.length;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        opacity: containerIn,
      }}
    >
      {BEATS.map((beat, i) => {
        const start = lead + i * beatStep;
        const reveal = interpolate(frame, [start, start + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        const isFinal = i === BEATS.length - 1;
        return (
          <div
            key={beat}
            style={{
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 18}px) scale(${0.96 + reveal * 0.04})`,
              fontFamily: FONT,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontSize: isFinal ? 72 : 60,
              color: isFinal ? ACCENT : TEXT,
              textShadow: isFinal ? `0 0 32px ${ACCENT}55` : "none",
            }}
          >
            {beat}
          </div>
        );
      })}
    </div>
  );
};

// Scene 2 — 4-tile read-drive loop.
// read README → right-click · copy path → paste path into Claude → answer + verify, arrow back to read.
const LOOP_TILES = [
  { cmd: "read README",          hint: "understand what you're building" },
  { cmd: "right-click · copy path", hint: "get the setup file path" },
  { cmd: "paste path into Claude",   hint: "Claude opens it for you" },
  { cmd: "answer + verify",      hint: "run · check · then move on" },
] as const;

export const ReadDriveLoopDiagram: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const cycleFrames = Math.max(60, Math.floor(durationInFrames / 1.4));
  const t = (frame % cycleFrames) / cycleFrames;
  const activeIdx = Math.floor(t * LOOP_TILES.length) % LOOP_TILES.length;

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
        gap: 18,
        opacity: containerIn,
      }}
    >
      {LOOP_TILES.map((tile, i) => {
        const reveal = interpolate(frame, [i * 12, 28 + i * 12], [0, 1], {
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
              transform: `translateY(${(1 - reveal) * 14}px) scale(${isActive ? 1.04 : 1})`,
              padding: "16px 26px",
              borderRadius: 12,
              background: isActive ? `${ACCENT}1f` : "rgba(255, 255, 255, 0.04)",
              border: `1.5px solid ${isActive ? ACCENT : `${TEXT_DIM}55`}`,
              minWidth: 460,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              transition: "all 0.2s",
              boxShadow: isActive ? `0 16px 36px ${ACCENT}30` : "none",
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                color: isActive ? ACCENT : ACCENT_2,
                fontSize: 26,
                letterSpacing: "0.02em",
              }}
            >
              {tile.cmd}
            </div>
            <div
              style={{
                fontFamily: FONT,
                color: TEXT_DIM,
                fontSize: 15,
              }}
            >
              {tile.hint}
            </div>
          </div>
        );
      })}

      <div
        style={{
          fontFamily: MONO,
          fontSize: 20,
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

// Scene 3 — 7-tile horizontal module path.
// 000 → 00 → 1 → 2 → 3 → 4 → 5 with module names below. Active-tile pulse cycles.
const MODULES = [
  { code: "000", name: "Install" },
  { code: "00",  name: "Copilot" },
  { code: "1",   name: "CLAUDE.md" },
  { code: "2",   name: "Master Log" },
  { code: "3",   name: "Slash" },
  { code: "4",   name: "MCPs" },
  { code: "5",   name: "Agents" },
] as const;

export const ModulePathDiagram: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const cycleFrames = Math.max(90, Math.floor(durationInFrames * 0.85));
  const t = (frame % cycleFrames) / cycleFrames;
  const activeIdx = Math.floor(t * MODULES.length) % MODULES.length;

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
        alignItems: "center",
        justifyContent: "center",
        opacity: containerIn,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          maxWidth: "100%",
        }}
      >
        {MODULES.map((mod, i) => {
          const reveal = interpolate(frame, [10 + i * 8, 36 + i * 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          const isActive = i === activeIdx;
          return (
            <div key={mod.code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  opacity: reveal,
                  transform: `translateY(${(1 - reveal) * 10}px) scale(${isActive ? 1.06 : 1})`,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: isActive ? `${ACCENT}22` : "rgba(255, 255, 255, 0.04)",
                  border: `1.5px solid ${isActive ? ACCENT : `${TEXT_DIM}55`}`,
                  minWidth: 60,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  transition: "all 0.2s",
                  boxShadow: isActive ? `0 12px 28px ${ACCENT}30` : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    color: isActive ? ACCENT : ACCENT_2,
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {mod.code}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    color: isActive ? TEXT : TEXT_DIM,
                    fontSize: 11,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mod.name}
                </div>
              </div>
              {i < MODULES.length - 1 && (
                <span
                  style={{
                    fontFamily: MONO,
                    color: i < activeIdx ? ACCENT : `${TEXT_DIM}99`,
                    fontSize: 16,
                    transition: "color 0.2s",
                  }}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 4 — terminal mock with `cd Module-000-Installing-Claude-Code-Terminal` + cursor blink.
export const CdTerminal: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();

  const termIn = interpolate(frame, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const fullCmd = "cd Module-000-Installing-Claude-Code-Terminal";
  const cmdReveal = interpolate(frame, [30, 78], [0, fullCmd.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const cursorBlink = Math.floor(frame / 18) % 2 === 0;
  const visibleCmd = fullCmd.slice(0, Math.floor(cmdReveal));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      <div
        style={{
          opacity: termIn,
          transform: `translateY(${(1 - termIn) * 16}px)`,
          width: "100%",
          maxWidth: 760,
          borderRadius: 12,
          border: `1px solid ${TEXT_DIM}55`,
          background: "rgba(0, 0, 0, 0.55)",
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
            ~/AI-Workshop-2.0
          </span>
        </div>
        <div
          style={{
            padding: "26px 24px",
            fontFamily: MONO,
            fontSize: 20,
            lineHeight: 1.6,
            color: TEXT,
            minHeight: 110,
          }}
        >
          <div>
            <span style={{ color: TEXT_DIM }}>$ </span>
            <span style={{ color: ACCENT }}>{visibleCmd}</span>
            <span style={{ opacity: cursorBlink ? 1 : 0, color: ACCENT }}>▊</span>
          </div>
        </div>
      </div>
    </div>
  );
};
