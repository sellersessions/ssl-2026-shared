import { Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  ACCENT,
  ACCENT_2,
  EASE_OUT,
  FONT,
  MONO,
  TEXT,
  TEXT_DIM,
} from "../explainer-shared";

// Subtle Ken Burns — scale 1.0 → 1.06, drift ~12px diagonal over scene duration.
// Slow enough to feel "alive" without distracting from the kinetic title.
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
          maxWidth: "92%",
          maxHeight: "85%",
          objectFit: "contain",
          transform: `scale(${scale}) translate(${dx}px, ${dy}px)`,
          filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45))",
          borderRadius: 12,
        }}
      />
    </div>
  );
};

// Install card — orange T icon scales in, then price card appears below.
export const InstallCard: React.FC<{ durationInFrames: number }> = () => {
  const frame = useCurrentFrame();
  const iconIn = interpolate(frame, [12, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cardIn = interpolate(frame, [30, 54], [0, 1], {
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
        gap: 36,
      }}
    >
      <Img
        src={staticFile("assets/ch05/typora-icon.png")}
        style={{
          width: 240,
          height: 240,
          opacity: iconIn,
          transform: `scale(${0.85 + iconIn * 0.15})`,
          filter: "drop-shadow(0 16px 32px rgba(224, 122, 58, 0.5))",
        }}
      />
      <div
        style={{
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 16}px)`,
          padding: "28px 40px",
          borderRadius: 14,
          background: "rgba(255, 255, 255, 0.04)",
          border: `1px solid ${ACCENT}40`,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          minWidth: 480,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            color: TEXT,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          $14.99
        </div>
        <div
          style={{
            fontFamily: MONO,
            color: ACCENT_2,
            fontSize: 18,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          15-day trial · up to 3 devices
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 8,
          }}
        >
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              background: ACCENT,
              color: "#fff",
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Purchase
          </div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: `1px solid ${TEXT_DIM}66`,
              color: TEXT,
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 18,
            }}
          >
            Download
          </div>
        </div>
      </div>
    </div>
  );
};

// Theme stack — 3 theme PNGs cascaded with rotation + staggered fade-in,
// then a slow group drift to keep them feeling alive.
export const ThemeStack: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const drift = (frame / Math.max(1, durationInFrames)) * 18;

  const themes = [
    { src: "assets/ch05/theme-1.png", rotate: -6, x: -120, y: 40, z: 1, delay: 6 },
    { src: "assets/ch05/theme-2.png", rotate: 0, x: 0, y: 0, z: 2, delay: 18 },
    { src: "assets/ch05/theme-3.png", rotate: 6, x: 120, y: -40, z: 1, delay: 30 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {themes.map((t, i) => {
        const reveal = interpolate(frame, [t.delay, t.delay + 22], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: t.z,
              opacity: reveal,
            }}
          >
            <Img
              src={staticFile(t.src)}
              style={{
                width: "62%",
                maxHeight: "78%",
                objectFit: "contain",
                borderRadius: 10,
                transform: `translate(${t.x + drift * (i - 1) * 0.4}px, ${t.y + (1 - reveal) * 24}px) rotate(${t.rotate}deg) scale(${0.94 + reveal * 0.06})`,
                filter: "drop-shadow(0 28px 56px rgba(0,0,0,0.55))",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
