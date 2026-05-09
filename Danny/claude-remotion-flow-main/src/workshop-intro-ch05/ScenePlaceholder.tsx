import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import {
  ACCENT,
  ACCENT_2,
  EASE_OUT,
  FONT,
  FPS,
  MONO,
  SAFE_INSET_X,
  SAFE_INSET_Y,
  TEXT,
  TEXT_DIM,
  type SceneVisualProps,
} from "../explainer-shared";

type ScenePlaceholderProps = SceneVisualProps & {
  label: string;
  title: string;
  caption: string;
  rightVisual?: React.ReactNode;
};

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);

// Stagger windows (frames at 30fps).
const EYEBROW_IN = [0, 12] as const;       // 0.0 – 0.4s
const TITLE_START = 6;                      // 0.2s
const TITLE_WORD_STEP = 3;                  // 0.1s per word
const TITLE_WORD_DUR = 12;                  // 0.4s per word reveal
const CAPTION_START = 18;                   // 0.6s
const CAPTION_WORD_STEP = 1.2;              // ~0.04s per word
const CAPTION_WORD_DUR = 10;                // 0.33s per word reveal
const UNDERLINE_IN = [24, 36] as const;     // 0.8 – 1.2s

const RevealWords: React.FC<{
  text: string;
  startFrame: number;
  perWordStep: number;
  perWordDuration: number;
  style: React.CSSProperties;
  wordTransform?: (progress: number) => string;
}> = ({ text, startFrame, perWordStep, perWordDuration, style, wordTransform }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={style}>
      {words.map((word, i) => {
        const begin = startFrame + i * perWordStep;
        const progress = interpolate(frame, [begin, begin + perWordDuration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              opacity: progress,
              transform: wordTransform ? wordTransform(progress) : `translateY(${(1 - progress) * 12}px)`,
              marginRight: "0.28em",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const ScenePlaceholder: React.FC<ScenePlaceholderProps> = ({
  durationInFrames,
  label,
  title,
  caption,
  rightVisual,
}) => {
  const frame = useCurrentFrame();

  // Eyebrow: slide + fade in (0 → 0.4s).
  const eyebrowProgress = interpolate(frame, [...EYEBROW_IN], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  // Underline: scaleX 0 → 1 (0.8 → 1.2s).
  const underlineProgress = interpolate(frame, [...UNDERLINE_IN], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  // Title micro-breathe — sine, 4s period, ±0.5%.
  const breathe = 1 + Math.sin((frame / FPS) * (Math.PI / 2)) * 0.005;

  // Background gradient drift — slow continuous parallax across full scene.
  const driftProgress = frame / Math.max(1, durationInFrames);
  const gradientX = 50 + Math.sin(driftProgress * Math.PI * 2) * 8;
  const gradientY = 50 + Math.cos(driftProgress * Math.PI * 2) * 6;

  // Outro fade — last 8 frames soften everything so SceneExit's crossfade lands cleanly.
  const outro = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        opacity: outro,
      }}
    >
      {/* Drifting accent gradient — sits over SceneBG, very low opacity. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gradientX}% ${gradientY}%, ${ACCENT}22 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          padding: `${SAFE_INSET_Y}px ${SAFE_INSET_X}px`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 64,
        }}
      >
       <div
         style={{
           flex: rightVisual ? "0 0 46%" : "1 1 100%",
           display: "flex",
           flexDirection: "column",
           justifyContent: "center",
           gap: 32,
         }}
       >
        {/* Eyebrow label */}
        <div
          style={{
            fontFamily: MONO,
            color: ACCENT_2,
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: eyebrowProgress,
            transform: `translateX(${(1 - eyebrowProgress) * -16}px)`,
          }}
        >
          {label}
        </div>

        {/* Title — word stagger + micro-breathe. */}
        <div style={{ transform: `scale(${breathe})`, transformOrigin: "left center" }}>
          <RevealWords
            text={title}
            startFrame={TITLE_START}
            perWordStep={TITLE_WORD_STEP}
            perWordDuration={TITLE_WORD_DUR}
            style={{
              fontFamily: FONT,
              color: TEXT,
              fontSize: rightVisual ? 76 : 96,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
            wordTransform={(p) => `translateY(${(1 - p) * 24}px) scale(${0.96 + p * 0.04})`}
          />

          {/* Accent underline — draws beneath the title. */}
          <div
            style={{
              marginTop: 18,
              height: 4,
              width: 220,
              background: ACCENT,
              borderRadius: 2,
              transform: `scaleX(${underlineProgress})`,
              transformOrigin: "left center",
            }}
          />
        </div>

        {/* Caption — fast word reveal. */}
        <RevealWords
          text={caption}
          startFrame={CAPTION_START}
          perWordStep={CAPTION_WORD_STEP}
          perWordDuration={CAPTION_WORD_DUR}
          style={{
            fontFamily: FONT,
            color: TEXT_DIM,
            fontSize: rightVisual ? 30 : 36,
            fontWeight: 400,
            maxWidth: rightVisual ? 720 : 1280,
            lineHeight: 1.4,
          }}
        />
       </div>

       {rightVisual && (
         <div style={{ flex: "1 1 0", position: "relative", height: "100%" }}>
           {rightVisual}
         </div>
       )}
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
