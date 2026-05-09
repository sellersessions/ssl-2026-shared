import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Inter";
import { noise2D } from "@remotion/noise";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { z } from "zod";

import { BEDS } from "./explainer-shared/audio-beds";

// ---------------------------------------------------------------------------
// VO scaffolding
// ---------------------------------------------------------------------------

const FPS = 30;
const TRANS_FRAMES = 8; // must match TRANS() below

/**
 * One entry per scene, in timeline order.
 * Files land at public/assets/voice/generated/FormatExplainer/<scene-id>.mp3
 * after the ElevenLabs generation script runs.
 */
const SCENE_AUDIO_FILES = [
  "voiceover/FormatExplainer/scene-opener.mp3",
  "voiceover/FormatExplainer/scene-0-agenda.mp3",
  "voiceover/FormatExplainer/scene-1-title.mp3",
  "voiceover/FormatExplainer/scene-2-problem.mp3",
  "voiceover/FormatExplainer/scene-3-container.mp3",
  "voiceover/FormatExplainer/scene-4-interview.mp3",
  "voiceover/FormatExplainer/scene-5-delegate.mp3",
  "voiceover/FormatExplainer/scene-6-outro.mp3",
] as const;

/**
 * Fallback scene durations (frames) used when VO files are absent.
 * Matches the original hardcoded TransitionSeries.Sequence lengths.
 */
const FALLBACK_SCENE_DURATIONS = [150, 180, 90, 150, 90, 210, 180, 180] as const;

/** Hardcoded fallback total: sum(FALLBACK) - (n-1)*TRANS = 1230 - 7*8 = 1174... */
export const FALLBACK_DURATION_IN_FRAMES =
  FALLBACK_SCENE_DURATIONS.reduce((s, d) => s + d, 0) -
  (FALLBACK_SCENE_DURATIONS.length - 1) * TRANS_FRAMES;

export const formatExplainerSchema = z.object({
  /** Per-scene VO durations in frames. Populated by calculateMetadata. */
  voiceover: z.array(z.number()).optional(),
});

type FormatExplainerProps = z.infer<typeof formatExplainerSchema>;

// ---------------------------------------------------------------------------
// calculateMetadata — measures VO mp3 durations, sets composition length
// ---------------------------------------------------------------------------

export const calculateMetadata: CalculateMetadataFunction<FormatExplainerProps> =
  async () => {
    const results = await Promise.allSettled(
      SCENE_AUDIO_FILES.map(async (file) => {
        try {
          const src = staticFile(file);
          const secs = await getAudioDurationInSeconds(src);
          return secs * FPS;
        } catch {
          return null;
        }
      }),
    );

    const sceneDurations: number[] = results.map((r, i) => {
      if (r.status === "fulfilled" && r.value !== null) {
        return Math.ceil(r.value);
      }
      // File missing — warn and fall back to hardcoded duration for this scene
      console.warn(
        `[FormatExplainer] VO file missing or unreadable: ${SCENE_AUDIO_FILES[i]}. ` +
          `Falling back to ${FALLBACK_SCENE_DURATIONS[i]} frames.`,
      );
      return FALLBACK_SCENE_DURATIONS[i];
    });

    const allFallback = results.every((r) => r.status === "rejected" || r.value === null);
    if (allFallback) {
      console.warn(
        "[FormatExplainer] No VO files found — using hardcoded duration. " +
          "Run the ElevenLabs generation script to populate public/assets/voice/generated/FormatExplainer/",
      );
      return {
        durationInFrames: FALLBACK_DURATION_IN_FRAMES,
        props: { voiceover: [...FALLBACK_SCENE_DURATIONS] },
      };
    }

    const totalFrames =
      sceneDurations.reduce((s, d) => s + d, 0) -
      (sceneDurations.length - 1) * TRANS_FRAMES;

    return {
      durationInFrames: Math.ceil(totalFrames),
      props: { voiceover: sceneDurations },
    };
  };

const { fontFamily: INTER } = loadFont();

const BG = "linear-gradient(140deg, #0C0322, #1a1a2e, #461499)";
const ACCENT = "#753EF7";
const ACCENT_2 = "#FBBF24";
const TEXT = "#ffffff";
const TEXT_DIM = "#a0a0b0";
const FONT = `${INTER}, system-ui, -apple-system, sans-serif`;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const TRANS_EASE = Easing.bezier(0.4, 0, 0.2, 1);

const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const SceneBG: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = noise2D("dx", frame / 90, 0) * 2;
  const dy = noise2D("dy", 0, frame / 90) * 2;
  return (
    <>
      <AbsoluteFill
        style={{ background: BG, transform: `translate(${dx}px, ${dy}px)` }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.035,
          mixBlendMode: "overlay",
          backgroundImage: GRAIN_SVG,
        }}
      />
    </>
  );
};

const BrandMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 80, mass: 0.8 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 80,
        transform: `scale(${scale})`,
        transformOrigin: "left center",
        zIndex: 10,
      }}
    >
      <Img
        src={staticFile("assets/branding/ssl-logo.png")}
        style={{ height: 44, width: "auto", display: "block" }}
      />
    </div>
  );
};

const easeIn = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// SCENE -1 — OPENER MANIFESTO · CINEMATIC (150 frames)
const LINE1_WORDS = [
  { w: "Built",        fromX: -800, fromY: -300, rot: -22 },
  { w: "for",          fromX:  900, fromY: -500, rot:  28 },
  { w: "Innovators.",  fromX: -600, fromY:  600, rot: -16 },
];
const LINE2_CHARS = "Not Imitators.".split("");

// Deterministic shake — noise-driven so it's reproducible per frame
const shake = (frame: number, intensity: number) => ({
  x: noise2D("shakeX", frame / 3, 0) * intensity,
  y: noise2D("shakeY", 0, frame / 3) * intensity,
});

const SceneOpener: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera shake — peaks at line-1 impact (30-42), line-2 impact (55-68), logo hit (92-108)
  const shakeIntensity =
    (interpolate(frame, [28, 32, 42], [0, 14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
      interpolate(frame, [53, 58, 70], [0, 12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
      interpolate(frame, [90, 95, 108], [0, 22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const sh = shake(frame, shakeIntensity);

  // Letterbox bars
  const barH = interpolate(frame, [0, 8, 135, 148], [200, 140, 140, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 1 — locked at frame 0 (thumbnail), explodes OUT starting frame 35
  const line1Words = LINE1_WORDS.map((word, i) => {
    const outS = spring({
      frame: frame - (35 + i * 3),
      fps,
      config: { damping: 14, stiffness: 130, mass: 1 },
    });
    return {
      ...word,
      tx: interpolate(outS, [0, 1], [0, word.fromX * 1.2]),
      ty: interpolate(outS, [0, 1], [0, word.fromY * 1.2]),
      rot: interpolate(outS, [0, 1], [0, word.rot * 1.5]),
      scale: interpolate(outS, [0, 1], [1, 0.5]),
      op: interpolate(outS, [0, 1], [1, 0]),
    };
  });

  // Line 2 — char drop
  const line2Chars = LINE2_CHARS.map((c, i) => {
    const s = spring({
      frame: frame - 40 - i * 2,
      fps,
      config: { damping: 12, stiffness: 170 },
    });
    return {
      c,
      ty: interpolate(s, [0, 1], [-200, 0]),
      op: interpolate(s, [0, 1], [0, 1]),
    };
  });
  // Chromatic aberration offset for line 2 — pulses at impact
  const caOffset = interpolate(frame, [55, 62, 72], [10, 0, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Morph — text stack stays at rest until frame 88, then scales/fades out into logo hit
  const textExit = interpolate(frame, [88, 108], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textScaleOut = interpolate(frame, [88, 115], [1, 0.35], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo zoom-punch: overshoots to 1.2 then settles
  const logoSpring = spring({
    frame: frame - 92,
    fps,
    config: { damping: 18, stiffness: 130, mass: 1 },
  });
  const logoScale = interpolate(logoSpring, [0, 0.6, 1], [0.15, 1.2, 1]);
  const logoOp = interpolate(logoSpring, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin(Math.max(0, frame - 118) / 8) * 0.015;

  // Radial burst behind logo
  const burst = interpolate(frame, [88, 105, 135], [0, 1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const burstScale = interpolate(frame, [88, 115], [0.4, 2.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Lens-flare sweep (left to right at frame 70-105)
  const flareX = interpolate(frame, [70, 105], [-600, 2400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flareOp = interpolate(frame, [70, 85, 105], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Vignette — stronger during high-shake moments
  const vignetteStrength = 0.6 + Math.min(0.3, shakeIntensity / 80);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <SceneBG />

      {/* Shaken world — everything except letterbox + vignette shakes */}
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* Radial light burst behind logo */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: 800,
              height: 800,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${ACCENT_2}aa 0%, ${ACCENT}55 30%, transparent 70%)`,
              transform: `scale(${burstScale})`,
              opacity: burst,
              filter: "blur(40px)",
            }}
          />
        </AbsoluteFill>

        {/* Text stack */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            opacity: textExit,
            transform: `scale(${textScaleOut}) translate(${sh.x * 0.4}px, ${sh.y * 0.4}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
              justifyContent: "center",
              alignItems: "baseline",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              width: "100%",
              padding: "0 80px",
            }}
          >
            {line1Words.map((w, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color: TEXT,
                  fontSize: 92,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  opacity: w.op,
                  transform: `translate(${w.tx}px, ${w.ty}px) rotate(${w.rot}deg) scale(${w.scale})`,
                  transformOrigin: "center center",
                  textShadow: "0 0 40px rgba(155,109,255,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                {w.w}
              </span>
            ))}
          </div>
          {/* Line 2 with chromatic aberration */}
          <div style={{ position: "relative", marginTop: 40 }}>
            {[
              { color: "#ff2b2b", dx: -caOffset, dy: 0 },
              { color: "#00e5ff", dx: caOffset, dy: 0 },
              { color: ACCENT_2, dx: 0, dy: 0 },
            ].map((layer, li) => (
              <div
                key={li}
                style={{
                  position: li === 2 ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  transform: `translate(${layer.dx}px, ${layer.dy}px)`,
                  mixBlendMode: li < 2 ? "screen" : "normal",
                }}
              >
                {line2Chars.map((ch, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      color: layer.color,
                      fontSize: 148,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      opacity: ch.op,
                      transform: `translateY(${ch.ty}px)`,
                      whiteSpace: "pre",
                      textShadow: li === 2 ? "0 0 60px rgba(251,191,36,0.5)" : "none",
                    }}
                  >
                    {ch.c === " " ? "\u00A0" : ch.c}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </AbsoluteFill>

        {/* Logo zoom-punch */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Img
            src={staticFile("assets/branding/ssl-logo.png")}
            style={{
              width: 1100,
              height: "auto",
              opacity: logoOp,
              transform: `scale(${logoScale * pulse})`,
              filter: `drop-shadow(0 0 80px ${ACCENT}aa)`,
            }}
          />
        </AbsoluteFill>

        {/* Lens-flare sweep */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: flareX,
            width: 500,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 40%, rgba(251,191,36,0.9) 50%, rgba(255,255,255,0.15) 60%, transparent 100%)",
            opacity: flareOp,
            filter: "blur(6px)",
            mixBlendMode: "screen",
            transform: "skewX(-12deg)",
          }}
        />
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Letterbox bars (top + bottom) — un-shaken */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barH,
          background: "#000",
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: barH,
          background: "#000",
          zIndex: 20,
        }}
      />
    </AbsoluteFill>
  );
};

// SCENE 0 — AGENDA SCROLL (180 frames)
const AGENDA = [
  {
    name: "Danny McMillan",
    role: "HOST + SESSION 1",
    time: "09:30 – 11:00",
    photo: "assets/speakers/danny-mcmillan.jpg",
    bio: "Founder of Seller Sessions, co-founder of Databrill. Opens the day with a 90-minute deep dive into using Claude and Claude Code for Amazon operations — live, on laptops, building alongside every delegate.",
  },
  {
    name: "Shubhash Sharma",
    role: "SESSION 2",
    time: "11:15 – 12:30",
    photo: "assets/speakers/shubhash-sharma.jpg",
    bio: "SP-API and operator tooling. Breaks down the architecture behind Amazon automation that actually holds up under account-level scale.",
  },
  {
    name: "Matt Kostan",
    role: "SESSION 3",
    time: "13:30 – 14:45",
    photo: "assets/speakers/matt-kostan.jpg",
    bio: "Customer research and listing conversion. Runs a live teardown of how language on a page changes what buyers believe before they click.",
  },
  {
    name: "Sim Mahon",
    role: "SESSION 4",
    time: "15:00 – 16:15",
    photo: "assets/speakers/sim-mahon.jpg",
    bio: "PPC and media math. Walks the room through the ad-spend decisions senior operators are making right now, and the ones most sellers still miss.",
  },
  {
    name: "Dorian Gorski",
    role: "SESSION 5",
    time: "16:30 – 17:45",
    photo: "assets/speakers/dorian-gorski.jpg",
    bio: "Brand and multi-channel. Closes the day with the playbook for moving an Amazon-first brand into DTC and retail without losing the unit economics.",
  },
];

const AgendaCard: React.FC<{ data: (typeof AGENDA)[number] }> = ({ data }) => (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      background: "rgba(26, 26, 46, 0.6)",
      border: "1px solid rgba(117, 62, 247, 0.25)",
      borderRadius: 20,
      overflow: "hidden",
      height: 360,
      marginBottom: 40,
      position: "relative",
    }}
  >
    {/* Purple timeline bar + dot */}
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 0,
        bottom: 0,
        width: 2,
        background: `linear-gradient(to bottom, ${ACCENT}00, ${ACCENT}, ${ACCENT}00)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 40,
        top: 60,
        width: 18,
        height: 18,
        borderRadius: 9,
        background: ACCENT,
        boxShadow: `0 0 24px ${ACCENT}`,
      }}
    />
    {/* Left: meta */}
    <div
      style={{
        flex: "0 0 620px",
        padding: "48px 48px 48px 96px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: TEXT,
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {data.name}
      </div>
      <div
        style={{
          marginTop: 20,
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "10px 20px",
          borderRadius: 999,
          border: `1.5px solid ${ACCENT}`,
          color: ACCENT,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.18em",
        }}
      >
        {data.role}
      </div>
      <div
        style={{
          marginTop: 18,
          color: TEXT_DIM,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}
      >
        {data.time}
      </div>
    </div>
    {/* Right: photo + bio */}
    <div style={{ flex: 1, display: "flex", padding: 32, gap: 32 }}>
      <Img
        src={staticFile(data.photo)}
        style={{
          width: 280,
          height: 296,
          objectFit: "cover",
          borderRadius: 14,
          border: `1px solid ${ACCENT}40`,
        }}
      />
      <div
        style={{
          flex: 1,
          color: TEXT_DIM,
          fontSize: 19,
          lineHeight: 1.55,
          display: "flex",
          alignItems: "center",
        }}
      >
        {data.bio}
      </div>
    </div>
  </div>
);

const Scene0Agenda: React.FC = () => {
  const frame = useCurrentFrame();
  const CARD_H = 360;
  const GAP = 40;
  const TOTAL = AGENDA.length * CARD_H + (AGENDA.length - 1) * GAP;
  const VIEWPORT = 1080;
  const SCROLL_DIST = Math.max(0, TOTAL - VIEWPORT + 200);

  const progress = interpolate(frame, [20, 170], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = -SCROLL_DIST * progress;
  const introOpacity = easeIn(frame, 0, 18);

  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <SceneBG />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 120,
          right: 120,
          transform: `translateY(${translateY}px)`,
          opacity: introOpacity,
        }}
      >
        {AGENDA.map((a, i) => (
          <AgendaCard key={i} data={a} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// SCENE 1 — TITLE (90 frames)
const Scene1Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleE = easeIn(frame, 3, 30);
  const titleY = interpolate(titleE, [0, 1], [60, 0]);

  const subE = easeIn(frame, 15, 40);

  const tickSpring = spring({ frame: frame - 30, fps, config: { damping: 60 } });
  const tickScale = interpolate(tickSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}
      >
        <div style={{ transform: `translateY(${titleY}px)`, opacity: titleE }}>
          <div
            style={{
              color: TEXT,
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            Seller Sessions Live
          </div>
          <div
            style={{
              color: ACCENT,
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            2026
          </div>
        </div>
        <div
          style={{
            marginTop: 60,
            opacity: subE,
            color: TEXT_DIM,
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          9 MAY · LONDON · INSIDE CLAUDE CODE
        </div>
        <div
          style={{
            marginTop: 48,
            transform: `scale(${tickScale})`,
            padding: "12px 28px",
            border: `2px solid ${ACCENT}`,
            borderRadius: 8,
            color: ACCENT,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.2em",
          }}
        >
          THE SESSION FORMAT
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// SCENE 2 — PROBLEM (150 frames)
const SPEAKERS = [
  { name: "Danny McMillan",  initials: "DM", hue: "#753EF7", x: 180,  y: 280, rot: -8 },
  { name: "Shubhash Sharma", initials: "SS", hue: "#9B6DFF", x: 820,  y: 200, rot: 5 },
  { name: "Matt Kostan",     initials: "MK", hue: "#FBBF24", x: 1420, y: 320, rot: -3 },
  { name: "Sim Mahon",       initials: "SM", hue: "#461499", x: 360,  y: 620, rot: 7 },
  { name: "Dorian Gorski",   initials: "DG", hue: "#753EF7", x: 1080, y: 680, rot: -6 },
];

const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textE = easeIn(frame, 50, 80);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      {SPEAKERS.map((s, i) => {
        const entry = spring({
          frame: frame - i * 4,
          fps,
          config: { damping: 50, stiffness: 60 },
        });
        const jitter = Math.sin((frame - i * 20) / 12) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: s.y + jitter,
              left: s.x,
              width: 360,
              height: 200,
              borderRadius: 16,
              border: `2px solid ${s.hue}`,
              background: "rgba(255,255,255,0.03)",
              boxShadow: `0 20px 60px ${s.hue}33`,
              opacity: entry,
              transform: `scale(${entry}) rotate(${s.rot}deg)`,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: s.hue,
                opacity: 0.9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: TEXT,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              {s.initials}
            </div>
            <div>
              <div style={{ color: TEXT, fontSize: 28, fontWeight: 700 }}>{s.name}</div>
              <div style={{ color: TEXT_DIM, fontSize: 18, marginTop: 6 }}>
                own format · own flow
              </div>
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textE,
        }}
      >
        <div
          style={{
            color: TEXT,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          5 speakers. 5 aesthetics. <span style={{ color: ACCENT }}>Zero flow.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 3 — CONTAINER (90 frames)
const ACTS = [
  { label: "PROBLEM", sub: "the hook", x: 160 },
  { label: "SOLUTION", sub: "mental model · demo · 3 checkpoints", x: 740 },
  { label: "PROOF", sub: "results · Q&A", x: 1320 },
];
const ARROW_X = [640, 1220];

const Scene3Container: React.FC = () => {
  const frame = useCurrentFrame();

  const headerE = easeIn(frame, 0, 25);
  const headerY = interpolate(headerE, [0, 1], [-40, 0]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headerE,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div style={{ color: TEXT_DIM, fontSize: 22, letterSpacing: "0.3em", fontWeight: 600 }}>
          ONE CONTAINER · EVERY SESSION
        </div>
      </div>
      {ACTS.map((act, i) => {
        const e = easeIn(frame, 15 + i * 8, 40 + i * 8);
        const y = interpolate(e, [0, 1], [80, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 380,
              left: act.x,
              width: 440,
              height: 280,
              borderRadius: 20,
              border: `2px solid ${ACCENT}`,
              background: "rgba(249,115,22,0.06)",
              opacity: e,
              transform: `translateY(${y}px)`,
              padding: 36,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: ACCENT,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.2em",
              }}
            >
              ACT {i + 1}
            </div>
            <div>
              <div style={{ color: TEXT, fontSize: 54, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {act.label}
              </div>
              <div style={{ color: TEXT_DIM, fontSize: 22, marginTop: 12, fontWeight: 500 }}>
                {act.sub}
              </div>
            </div>
          </div>
        );
      })}
      {[0, 1].map((i) => {
        const e = easeIn(frame, 40 + i * 8, 60 + i * 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 500,
              left: ARROW_X[i],
              color: ACCENT,
              fontSize: 48,
              fontWeight: 800,
              transform: `scale(${e})`,
              opacity: e,
            }}
          >
            →
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// SCENE 4 — INTERVIEW (210 frames)
const Scene4Interview: React.FC = () => {
  const frame = useCurrentFrame();

  const boxE = easeIn(frame, 0, 25);
  const boxScale = interpolate(boxE, [0, 1], [0.92, 1]);

  const questions = [
    "> What pain does this workflow solve for the room?",
    "> Walk me through your demo, step by step.",
    "> Give me the numbers — before and after.",
  ];

  const mdLines = [
    "# Your Session",
    "",
    "## Problem (6 min)",
    "The hook lands here...",
    "",
    "## Solution (42 min)",
    "- Mental model",
    "- Live demo",
    "- 3 checkpoints",
    "",
    "## Proof (12 min)",
    "Before: ...",
    "After: ...",
  ];

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div style={{ color: TEXT, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Claude runs the interview
        </div>
        <div
          style={{
            color: TEXT_DIM,
            fontSize: 24,
            fontWeight: 500,
            marginTop: 12,
            letterSpacing: "0.05em",
          }}
        >
          ~40 minutes · timing math live · forces cuts in real time
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 100,
          width: 820,
          height: 620,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#0b0b14",
          opacity: boxE,
          transform: `scale(${boxScale})`,
          overflow: "hidden",
          fontFamily: MONO,
        }}
      >
        <div
          style={{
            height: 40,
            background: "#15151f",
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#27c93f" }} />
          <div style={{ marginLeft: 20, color: "#888", fontSize: 14 }}>claude — interview</div>
        </div>
        <div style={{ padding: 30, color: TEXT, fontSize: 20, lineHeight: 1.9 }}>
          {questions.map((q, i) => {
            const op = easeIn(frame, 20 + i * 35, 45 + i * 35);
            return (
              <div key={i} style={{ opacity: op, color: ACCENT, marginBottom: 20 }}>
                {q}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 970,
          width: 860,
          height: 620,
          borderRadius: 14,
          border: "1px solid rgba(249,115,22,0.3)",
          background: "rgba(255,255,255,0.02)",
          opacity: boxE,
          transform: `scale(${boxScale})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 40,
            background: "rgba(249,115,22,0.1)",
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            color: ACCENT,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.15em",
          }}
        >
          SESSION.md
        </div>
        <div style={{ padding: 30, fontFamily: MONO, fontSize: 20, lineHeight: 1.8 }}>
          {mdLines.map((line, i) => {
            const op = easeIn(frame, 40 + i * 7, 60 + i * 7);
            const isHead = line.startsWith("#");
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  color: isHead ? TEXT : TEXT_DIM,
                  fontWeight: isHead ? 700 : 400,
                  minHeight: 28,
                }}
              >
                {line || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SCENE 5 — DELEGATE (180 frames)
const TREE_LINES = [
  "ssl-2026-<speaker>/",
  "├─ SESSION.md          ← your signed-off brief",
  "├─ demo/               ← runnable demo code",
  "├─ tasks/              ← homework exercises",
  "├─ curriculum/         ← offline HTML bundle",
  "└─ remotion/           ← your fallback reel",
];

const Scene5Delegate: React.FC = () => {
  const frame = useCurrentFrame();

  const cloneChars = "$ git clone github.com/sellersessions/ssl-2026-<speaker>";
  const typedCount = Math.floor(
    interpolate(frame, [5, 40], [0, cloneChars.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typed = cloneChars.slice(0, typedCount);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div style={{ color: TEXT, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Delegates clone. Done.
        </div>
        <div
          style={{
            color: TEXT_DIM,
            fontSize: 24,
            fontWeight: 500,
            marginTop: 12,
            letterSpacing: "0.05em",
          }}
        >
          the repo IS the curriculum · no slides · no PDFs
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 200,
          right: 200,
          padding: 36,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#0b0b14",
          fontFamily: MONO,
        }}
      >
        <div style={{ color: ACCENT, fontSize: 26, fontWeight: 600 }}>
          {typed}
          <span
            style={{
              opacity: Math.floor(frame / 15) % 2,
              color: ACCENT,
              marginLeft: 2,
            }}
          >
            ▊
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 200,
          right: 200,
          padding: 36,
          borderRadius: 14,
          border: `1px solid ${ACCENT}55`,
          background: "rgba(249,115,22,0.04)",
          fontFamily: MONO,
          fontSize: 26,
          lineHeight: 1.7,
        }}
      >
        {TREE_LINES.map((line, i) => {
          const op = easeIn(frame, 20 + i * 8, 40 + i * 8);
          const [path, comment] = line.split("← ");
          return (
            <div key={i} style={{ opacity: op, minHeight: 40 }}>
              <span style={{ color: TEXT }}>{path}</span>
              {comment && <span style={{ color: ACCENT }}>← {comment}</span>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// SCENE 6 — OUTRO (180 frames)
const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1E = easeIn(frame, 0, 25);
  const line1Y = interpolate(line1E, [0, 1], [40, 0]);
  const line2E = easeIn(frame, 15, 40);
  const line3E = easeIn(frame, 30, 55);

  const ctaSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 70, stiffness: 80 },
  });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.8, 1]);
  const ctaOp = interpolate(ctaSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <BrandMark />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            color: TEXT_DIM,
            fontSize: 26,
            letterSpacing: "0.3em",
            fontWeight: 600,
            opacity: line1E,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          YOUR CONTENT BECOMES
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: TEXT,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              opacity: line1E,
            }}
          >
            a signed-off session brief
          </div>
          <div
            style={{
              color: TEXT,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              opacity: line2E,
            }}
          >
            a runnable repo
          </div>
          <div
            style={{
              color: ACCENT,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              opacity: line3E,
            }}
          >
            a Remotion safety net
          </div>
        </div>
        <div
          style={{
            marginTop: 80,
            opacity: ctaOp,
            transform: `scale(${ctaScale})`,
            padding: "22px 48px",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
            borderRadius: 12,
            color: TEXT,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "0.02em",
          }}
        >
          Run the interview →
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: ctaOp,
            color: TEXT_DIM,
            fontSize: 22,
            fontFamily: MONO,
          }}
        >
          github.com/sellersessions/ssl-2026-session-template
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TRANS = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 8, easing: TRANS_EASE })}
  />
);

const EXIT_FRAMES = 14;

const SceneExit: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const exitStart = durationInFrames - EXIT_FRAMES;
  const p = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - p,
        transform: `scale(${1 - p * 0.04})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const AUDIO_SRC = {
  musicBed: staticFile(BEDS.HOUSE_DEFAULT),
  riser: staticFile("assets/sfx/library/risers/soundreality-riser-wildfire-285209.mp3"),
  impact: staticFile("assets/sfx/library/stingers/alex_kizenkov-aggressive-huge-hit-logo-139134.mp3"),
};

// ---------------------------------------------------------------------------
// Music bed volume (flat — no ducking)
// ---------------------------------------------------------------------------

const BED_VOLUME = 0.08;

/**
 * Compute the absolute timeline start of each scene, accounting for
 * TransitionSeries overlap (each transition eats TRANS_FRAMES from the
 * boundary between two scenes).
 */
function computeCumulativeStarts(sceneDurations: number[]): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < sceneDurations.length; i++) {
    starts.push(cursor);
    cursor += sceneDurations[i] - (i < sceneDurations.length - 1 ? TRANS_FRAMES : 0);
  }
  return starts;
}

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const FormatExplainer: React.FC<FormatExplainerProps> = ({ voiceover }) => {
  // Use VO-driven durations when available, else fall back to hardcoded values
  const sceneDurations: number[] =
    voiceover && voiceover.length === SCENE_AUDIO_FILES.length
      ? voiceover
      : [...FALLBACK_SCENE_DURATIONS];

  const cumulativeStarts = computeCumulativeStarts(sceneDurations);

  return (
    <>
      {/* Music bed — flat volume, no ducking */}
      <Audio src={AUDIO_SRC.musicBed} volume={BED_VOLUME} />

      {/* Riser SFX — fixed to scene opener */}
      <Sequence  durationInFrames={90}>
        <Audio src={AUDIO_SRC.riser} startFrom={270} volume={0.7} />
      </Sequence>

      {/* Logo impact SFX — fixed relative to opener */}
      <Sequence from={92} durationInFrames={58}>
        <Audio src={AUDIO_SRC.impact} volume={1.0} />
      </Sequence>

      {/* Voiceover — one <Audio> per scene, wrapped in an absolute <Sequence> */}
      {SCENE_AUDIO_FILES.map((file, i) => (
        <Sequence
          key={file}
          from={cumulativeStarts[i]}
          durationInFrames={sceneDurations[i]}
          name={`VO-${file.split("/").pop()}`}
        >
          <Audio src={staticFile(file)} volume={1.0} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sceneDurations[0]}>
          <SceneExit durationInFrames={sceneDurations[0]}><SceneOpener /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[1]}>
          <SceneExit durationInFrames={sceneDurations[1]}><Scene0Agenda /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[2]}>
          <SceneExit durationInFrames={sceneDurations[2]}><Scene1Title /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[3]}>
          <SceneExit durationInFrames={sceneDurations[3]}><Scene2Problem /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[4]}>
          <SceneExit durationInFrames={sceneDurations[4]}><Scene3Container /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[5]}>
          <SceneExit durationInFrames={sceneDurations[5]}><Scene4Interview /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[6]}>
          <SceneExit durationInFrames={sceneDurations[6]}><Scene5Delegate /></SceneExit>
        </TransitionSeries.Sequence>
        {TRANS()}
        <TransitionSeries.Sequence durationInFrames={sceneDurations[7]}>
          <SceneExit durationInFrames={sceneDurations[7]}><Scene6Outro /></SceneExit>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
