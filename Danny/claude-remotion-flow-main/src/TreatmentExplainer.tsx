import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_2,
  EASE_OUT,
  FONT,
  MONO,
  PRE_ROLL_FRAMES,
  POST_ROLL_FRAMES,
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_OUTRO,
  SFX_OUTRO_LEAD_IN_FRAMES,
  SFX_OUTRO_LEN_FRAMES,
  TEXT,
  TEXT_DIM,
  VO_PRE_PAD_FRAMES,
  computeTimeline,
  easeIn,
  fallbackDurationInFrames,
  makeCalculateMetadata,
  type ChapterCardSpec,
  type ExplainerConfig,
  type ExplainerProps,
  ChapterCard,
  FadeToBlack,
  PosterFrame,
  FadeUp,
  SceneBG,
  SceneExit,
  TRANS,
  BEDS,
} from "./explainer-shared";

// ---------------------------------------------------------------------------
// Composition config (per-video) — everything else is inherited from
// src/explainer-shared. See StackExplainer.tsx for the sister config.
// ---------------------------------------------------------------------------

const SCENE_AUDIO_FILES = [
  "assets/voice/generated/TreatmentExplainer/scene-1-title.mp3",
  "assets/voice/generated/TreatmentExplainer/scene-2-layers.mp3",
  "assets/voice/generated/TreatmentExplainer/scene-3-brief.mp3",
  "assets/voice/generated/TreatmentExplainer/scene-4-skeletons.mp3",
  "assets/voice/generated/TreatmentExplainer/scene-5-treatment.mp3",
  "assets/voice/generated/TreatmentExplainer/scene-6-pipeline.mp3",
] as const;

// Scene 1 is visual-only — the title card already says "Brief any video in
// three layers" on screen; repeating it in VO felt redundant. File kept on
// disk in case we want it back.
const SCENE_VO_ENABLED = [false, true, true, true, true, true] as const;

// Animator's original scene intent (pre-VO) — floor so scenes never compress
// below the timing the visuals were designed around.
const FALLBACK_SCENE_DURATIONS = [120, 180, 210, 270, 240, 180] as const;

// Chapter cards between major sections — inserted BEFORE the scene at their
// index. null = no card before that scene.
const CARD_BEFORE: Array<ChapterCardSpec | null> = [
  null, // before S1 (title)
  null, // before S2 (overview)
  { label: "Layer 01", title: "The Brief" },
  { label: "Layer 02", title: "The Skeleton" },
  { label: "Layer 03", title: "The Treatment" },
  null, // before S6 (pipeline)
];

// Music bed — HOUSE_DEFAULT (10:13 cinematic-ambient drop-in bed). Plays at
// BED_VOLUME flat across the whole comp — no ducking. The BEAT_SNAP_FRAMES
// below were tuned against the previous through-the-clouds source — they no
// longer land on bed onsets, but the cuts still happen at those frames and
// the visual rhythm is unchanged.
const MUSIC_BED = BEDS.HOUSE_DEFAULT;
const BED_VOLUME = 0.12;

// Beat-snap — shift scene starts onto librosa onset markers where the cost is
// trivial. Source: scripts/music/output/through-the-clouds-onsets.json.
// Only snap when delta is under ~25 frames — anything else would bloat the
// comp for a marginal musical payoff.
//   S2: native 112 → 134 (+22f, onset strength 0.64 @ 4.46s)
//   S5: native 859 → 852 (−7f, onset strength 0.74 @ 28.41s)
const BEAT_SNAP_FRAMES: Array<number | null> = [
  null, // S1 title
  134,  // S2 overview — onset at 4.46s
  null, // S3 brief — nearest onset too far
  null, // S4 skeleton — nearest onset too far
  852,  // S5 treatment — onset at 28.41s
  null, // S6 pipeline — nearest onset past comp end
];

const CONFIG: ExplainerConfig = {
  sceneAudioFiles: SCENE_AUDIO_FILES,
  sceneVoEnabled: SCENE_VO_ENABLED,
  fallbackSceneDurations: FALLBACK_SCENE_DURATIONS,
  cardBefore: CARD_BEFORE,
  beatSnapFrames: BEAT_SNAP_FRAMES,
  logPrefix: "TreatmentExplainer",
};

export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames(CONFIG);
export const calculateMetadata = makeCalculateMetadata(CONFIG);

export const treatmentExplainerSchema = z.object({
  voiceover: z.array(z.number()).optional(),
  voLengths: z.array(z.number()).optional(),
  // Live mixer — Remotion's InputDragger in the Props panel; drag
  // horizontally to scrub, or click to type. .multipleOf(0.05) gives
  // 20 meaningful steps across the 0–1 gain range.
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});

type TreatmentExplainerProps = ExplainerProps;

// --- SCENE 1: TITLE CARD (120f / 4s) ---

const Scene1Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 100 } });
  const titleY = interpolate(titleS, [0, 1], [80, 0]);
  const titleOp = interpolate(titleS, [0, 1], [0, 1]);

  const subS = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 100 } });
  const subOp = interpolate(subS, [0, 1], [0, 1]);
  const subY = interpolate(subS, [0, 1], [30, 0]);

  const lineW = interpolate(frame, [20, 50], [0, 400], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: TEXT,
              letterSpacing: "-0.03em",
              opacity: titleOp,
              transform: `translateY(${titleY}px)`,
              textShadow: `0 0 60px ${ACCENT}66`,
            }}
          >
            How to Brief a Video
          </div>
          <div
            style={{
              width: lineW,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${ACCENT_2}, transparent)`,
              margin: "24px auto",
            }}
          />
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              color: TEXT_DIM,
              opacity: subOp,
              transform: `translateY(${subY}px)`,
            }}
          >
            A 3-layer framework for anyone
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 2: THE 3 LAYERS OVERVIEW (180f / 6s) ---

const LAYERS = [
  { num: "1", label: "THE BRIEF", sub: "What do I want?", color: ACCENT_2 },
  { num: "2", label: "THE SKELETON", sub: "What shape is the story?", color: ACCENT },
  { num: "3", label: "THE TREATMENT", sub: "Scene-by-scene execution", color: "#22d3ee" },
];

const Scene2Layers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 25);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ padding: "80px 120px" }}>
        <div style={{ opacity: headerOp, fontSize: 52, fontWeight: 700, color: TEXT, marginBottom: 60 }}>
          Every video follows <span style={{ color: ACCENT_2 }}>three layers</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {LAYERS.map((layer, i) => {
            const delay = 25 + i * 20;
            const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
            const x = interpolate(s, [0, 1], [-200, 0]);
            const op = interpolate(s, [0, 1], [0, 1]);

            // Arrow between layers
            const arrowOp = i < 2 ? interpolate(frame, [delay + 15, delay + 25], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            }) : 0;

            return (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 32,
                    opacity: op,
                    transform: `translateX(${x}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      border: `2px solid ${layer.color}`,
                      background: `${layer.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      fontWeight: 800,
                      color: layer.color,
                      flexShrink: 0,
                    }}
                  >
                    {layer.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 40, fontWeight: 700, color: TEXT, letterSpacing: "0.05em" }}>
                      {layer.label}
                    </div>
                    <div style={{ fontSize: 28, color: TEXT_DIM, marginTop: 4 }}>
                      {layer.sub}
                    </div>
                  </div>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      marginLeft: 38,
                      height: 30,
                      width: 4,
                      background: `linear-gradient(to bottom, ${layer.color}88, ${LAYERS[i + 1].color}88)`,
                      opacity: arrowOp,
                      marginTop: 8,
                      marginBottom: 8,
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 3: CREATIVE BRIEF (210f / 7s) ---

const BRIEF_FIELDS = [
  { field: "Objective", example: "What must this video DO?", icon: "🎯" },
  { field: "Audience", example: "Who watches? What do they believe?", icon: "👥" },
  { field: "Key Message", example: "If they remember one thing...", icon: "💬" },
  { field: "Tone", example: "3-5 adjectives: cinematic, urgent, premium", icon: "🎨" },
  { field: "References", example: "2-3 videos that FEEL right", icon: "🔗" },
  { field: "Deliverables", example: "Duration, aspect ratio, platform", icon: "📐" },
];

const Scene3Brief: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 20);

  // Highlight badge
  const badgeS = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 140 } });
  const badgeScale = interpolate(badgeS, [0, 1], [0.5, 1]);
  const badgeOp = interpolate(badgeS, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ padding: "70px 100px" }}>
        {/* Layer badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 30,
              background: `${ACCENT_2}25`,
              border: `1px solid ${ACCENT_2}`,
              fontSize: 20,
              fontWeight: 700,
              color: ACCENT_2,
              letterSpacing: "0.08em",
              opacity: badgeOp,
              transform: `scale(${badgeScale})`,
            }}
          >
            LAYER 1
          </div>
        </div>

        <div style={{ opacity: headerOp, fontSize: 52, fontWeight: 700, color: TEXT, marginBottom: 48 }}>
          The Creative Brief
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 48px" }}>
          {BRIEF_FIELDS.map((item, i) => {
            const delay = 20 + i * 12;
            const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 130 } });
            const op = interpolate(s, [0, 1], [0, 1]);
            const y = interpolate(s, [0, 1], [30, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: "rgba(26, 26, 46, 0.5)",
                  border: "1px solid rgba(117, 62, 247, 0.2)",
                }}
              >
                <div style={{ fontSize: 32, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: TEXT }}>{item.field}</div>
                  <div style={{ fontSize: 20, color: TEXT_DIM, marginTop: 4 }}>{item.example}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <FadeUp delay={90}>
          <div
            style={{
              marginTop: 40,
              fontSize: 24,
              color: ACCENT_2,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            The References field is the escape hatch — "I know it when I see it" works here
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 4: FOUR SKELETONS (270f / 9s) ---

const SKELETONS = [
  {
    name: "Beat Sheet",
    use: "Telling a story",
    beats: ["Hook", "Setup", "Turn", "Proof", "Resolve"],
    color: "#22d3ee",
  },
  {
    name: "Problem-Agitate-Solve",
    use: "Selling a product",
    beats: ["Problem", "Agitate", "Solve", "Outcome"],
    color: "#f97316",
  },
  {
    name: "Hook-Hold-Payoff",
    use: "Social retention",
    beats: ["Hook 3s", "Hold 17s", "Payoff 10s"],
    color: "#a855f7",
  },
  {
    name: "Energy Map",
    use: "Audio drives the edit",
    beats: ["Intro", "Build", "Drop", "Groove", "Resolve"],
    color: "#34d399",
  },
];

const Scene4Skeletons: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 20);

  // Highlight which skeleton is "active" — cycles through them
  const activeIdx = frame < 60 ? -1 : Math.min(3, Math.floor((frame - 60) / 45));

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ padding: "70px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 30,
              background: `${ACCENT}25`,
              border: `1px solid ${ACCENT}`,
              fontSize: 20,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: "0.08em",
            }}
          >
            LAYER 2
          </div>
        </div>

        <div style={{ opacity: headerOp, fontSize: 48, fontWeight: 700, color: TEXT, marginBottom: 20 }}>
          Pick Your Shape
        </div>
        <div style={{ fontSize: 26, color: TEXT_DIM, marginBottom: 40, opacity: headerOp }}>
          What does the video need to do?
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {SKELETONS.map((skel, i) => {
            const delay = 25 + i * 18;
            const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 130 } });
            const op = interpolate(s, [0, 1], [0, 1]);
            const scale = interpolate(s, [0, 1], [0.9, 1]);
            const isActive = activeIdx === i;
            const glowOp = isActive ? 0.4 : 0;

            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  transform: `scale(${scale})`,
                  padding: "28px 32px",
                  borderRadius: 18,
                  background: isActive ? `${skel.color}12` : "rgba(26, 26, 46, 0.5)",
                  border: `2px solid ${isActive ? skel.color : "rgba(117, 62, 247, 0.2)"}`,
                  boxShadow: isActive ? `0 0 40px ${skel.color}${Math.round(glowOp * 255).toString(16).padStart(2, "0")}` : "none",
                  transition: "all 0.3s",
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 700, color: skel.color, marginBottom: 6 }}>
                  {skel.name}
                </div>
                <div style={{ fontSize: 22, color: TEXT_DIM, marginBottom: 16 }}>
                  {skel.use}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {skel.beats.map((beat, bi) => {
                    const beatDelay = delay + 10 + bi * 5;
                    const beatOp = interpolate(frame, [beatDelay, beatDelay + 10], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    return (
                      <div
                        key={bi}
                        style={{
                          padding: "4px 14px",
                          borderRadius: 20,
                          background: `${skel.color}20`,
                          border: `1px solid ${skel.color}55`,
                          fontSize: 18,
                          color: TEXT,
                          opacity: beatOp,
                        }}
                      >
                        {beat}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 5: THE TREATMENT DOC (240f / 8s) ---

const TREATMENT_LINES = [
  { type: "header", text: "SCENE 1 — Hook (0:00–0:03)" },
  { type: "field", label: "Visual", text: "Logo explodes from particles" },
  { type: "field", label: "Motion", text: "spring({ damping: 14 }) → overshoot settle" },
  { type: "field", label: "Text", text: '"Built for Innovators."' },
  { type: "field", label: "Audio", text: "Riser → impact hit at frame 92" },
  { type: "spacer", text: "" },
  { type: "header", text: "SCENE 2 — Setup (0:03–0:10)" },
  { type: "field", label: "Visual", text: "Speaker cards scroll vertically" },
  { type: "field", label: "Motion", text: "Auto-pan, staggered 120ms delay" },
  { type: "field", label: "Text", text: "Speaker name + role + time" },
  { type: "field", label: "Audio", text: "Music bed, vol 0.55" },
];

const Scene5Treatment: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = easeIn(frame, 5, 20);

  // Scroll the treatment doc up slowly
  const scrollY = interpolate(frame, [80, 220], [0, -120], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ padding: "70px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 30,
              background: "rgba(34, 211, 238, 0.15)",
              border: "1px solid #22d3ee",
              fontSize: 20,
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: "0.08em",
            }}
          >
            LAYER 3
          </div>
        </div>

        <div style={{ opacity: headerOp, fontSize: 48, fontWeight: 700, color: TEXT, marginBottom: 36 }}>
          The Treatment Document
        </div>

        {/* Fake code editor / document */}
        <div
          style={{
            background: "rgba(10, 3, 20, 0.8)",
            border: "1px solid rgba(117, 62, 247, 0.3)",
            borderRadius: 16,
            padding: "32px 40px",
            overflow: "hidden",
            maxHeight: 520,
          }}
        >
          <div style={{ transform: `translateY(${scrollY}px)` }}>
            {TREATMENT_LINES.map((line, i) => {
              const delay = 15 + i * 8;
              const lineOp = interpolate(frame, [delay, delay + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              if (line.type === "spacer") {
                return <div key={i} style={{ height: 20 }} />;
              }

              if (line.type === "header") {
                return (
                  <div
                    key={i}
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: ACCENT_2,
                      marginBottom: 12,
                      marginTop: i > 0 ? 8 : 0,
                      opacity: lineOp,
                      fontFamily: MONO,
                    }}
                  >
                    {line.text}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 8,
                    opacity: lineOp,
                    fontSize: 22,
                    fontFamily: MONO,
                  }}
                >
                  <span style={{ color: ACCENT, fontWeight: 600, minWidth: 90 }}>
                    {line.label}:
                  </span>
                  <span style={{ color: TEXT_DIM }}>{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 6: THE PIPELINE FLOW + CTA (180f / 6s) ---

const FLOW_STEPS = [
  { label: "Brief", sub: "What do I want?", color: ACCENT_2 },
  { label: "Skeleton", sub: "Pick the shape", color: ACCENT },
  { label: "Treatment", sub: "Scene by scene", color: "#22d3ee" },
  { label: "Remotion", sub: "Claude builds it", color: "#34d399" },
  { label: "Ship", sub: "Render + publish", color: "#f43f5e" },
];

const Scene6Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = easeIn(frame, 5, 20);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBG />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 60, opacity: headerOp }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: TEXT }}>
            From idea to video
          </div>
        </div>

        {/* Horizontal pipeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {FLOW_STEPS.map((step, i) => {
            const delay = 15 + i * 18;
            const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
            const scale = interpolate(s, [0, 1], [0.5, 1]);
            const op = interpolate(s, [0, 1], [0, 1]);

            // Arrow between steps
            const arrowDelay = delay + 10;
            const arrowW = i < FLOW_STEPS.length - 1
              ? interpolate(frame, [arrowDelay, arrowDelay + 12], [0, 48], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    opacity: op,
                    transform: `scale(${scale})`,
                    textAlign: "center",
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      border: `2px solid ${step.color}`,
                      background: `${step.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      fontSize: 28,
                      fontWeight: 800,
                      color: step.color,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: TEXT }}>{step.label}</div>
                  <div style={{ fontSize: 18, color: TEXT_DIM, marginTop: 4 }}>{step.sub}</div>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div
                    style={{
                      width: arrowW,
                      height: 3,
                      background: `linear-gradient(90deg, ${step.color}, ${FLOW_STEPS[i + 1].color})`,
                      margin: "0 4px",
                      marginBottom: 50,
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <FadeUp delay={100}>
          <div
            style={{
              marginTop: 60,
              fontSize: 30,
              color: TEXT_DIM,
              textAlign: "center",
            }}
          >
            You describe it. Claude builds it. Remotion renders it.
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- MAIN COMPOSITION (VO-driven) ---

const SCENE_COMPONENTS: React.FC[] = [
  Scene1Title,
  Scene2Layers,
  Scene3Brief,
  Scene4Skeletons,
  Scene5Treatment,
  Scene6Pipeline,
];

export const TreatmentExplainer: React.FC<TreatmentExplainerProps> = ({
  voiceover,
  voLengths,
  sfxIntroVolume,
  sfxOutroVolume,
}) => {
  const sceneDurations: number[] =
    voiceover && voiceover.length === SCENE_AUDIO_FILES.length
      ? voiceover
      : [...FALLBACK_SCENE_DURATIONS];

  const voLengthsFinal: number[] =
    voLengths && voLengths.length === SCENE_AUDIO_FILES.length
      ? voLengths
      : [...FALLBACK_SCENE_DURATIONS];

  const { sceneStarts, items, totalFrames: visualFrames } = computeTimeline(
    sceneDurations,
    CARD_BEFORE,
  );

  // Absolute-frame anchors in the final composition (wraps the visual
  // timeline in a pre-roll + post-roll so the intro whoosh can build before
  // the title and the outro boom's decay can finish in silence).
  const visualStart = PRE_ROLL_FRAMES;
  const visualEnd = PRE_ROLL_FRAMES + visualFrames;
  const totalFrames = visualEnd + POST_ROLL_FRAMES;

  return (
    <>
      {/* Static poster behind everything. Frame 0 reads as a branded title
          card so inline players (GitHub, web embeds) load on something
          meaningful, not black. Scenes overlay this from PRE_ROLL_FRAMES. */}
      <PosterFrame
        eyebrow="A 3-layer framework"
        title="How to Brief a Video"
      />

      {/* Music bed — flat volume, no ducking. endAt trims at totalFrames. */}
      <Audio
        src={staticFile(MUSIC_BED)}
        volume={BED_VOLUME}
        endAt={totalFrames}
      />

      {/* Intro whoosh — rides the pre-roll; the sweep peaks as the title
          fades in (around frame PRE_ROLL_FRAMES), not after it. */}
      <Sequence durationInFrames={SFX_INTRO_LEN_FRAMES} name="SFX-intro">
        <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
      </Sequence>

      {/* Outro boom — attack lands SFX_OUTRO_LEAD_IN_FRAMES before visualEnd
          so it hits while the screen is still fading, not after it's gone;
          decay rides through the post-roll in silent black. */}
      <Sequence
        from={Math.max(0, visualEnd - SFX_OUTRO_LEAD_IN_FRAMES)}
        durationInFrames={SFX_OUTRO_LEN_FRAMES}
        name="SFX-outro"
      >
        <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
      </Sequence>

      {/* Voiceover — absolute frames include the visualStart offset. */}
      {SCENE_AUDIO_FILES.map((file, i) => {
        if (!SCENE_VO_ENABLED[i]) return null;
        return (
          <Sequence
            key={file}
            from={visualStart + sceneStarts[i] + VO_PRE_PAD_FRAMES}
            durationInFrames={voLengthsFinal[i]}
            name={`VO-${file.split("/").pop()}`}
          >
            <Audio src={staticFile(file)} volume={1.0} />
          </Sequence>
        );
      })}

      {/* Wrap the visual timeline inside the pre/post-roll envelope so the
          screen stays black during the whoosh build and the boom's decay. */}
      <Sequence from={visualStart} durationInFrames={visualFrames} name="visuals">
      <TransitionSeries>
        {items.flatMap((item, i) => {
          const nodes: React.ReactNode[] = [];
          if (item.kind === "scene") {
            const SceneComp = SCENE_COMPONENTS[item.sceneIndex];
            nodes.push(
              <TransitionSeries.Sequence
                key={`scene-${item.sceneIndex}`}
                durationInFrames={item.duration}
              >
                <SceneExit durationInFrames={item.duration}>
                  <SceneComp />
                </SceneExit>
              </TransitionSeries.Sequence>,
            );
          } else {
            nodes.push(
              <TransitionSeries.Sequence
                key={`card-${i}-${item.card.label}`}
                durationInFrames={item.duration}
              >
                <ChapterCard card={item.card} durationInFrames={item.duration} />
              </TransitionSeries.Sequence>,
            );
          }
          if (i < items.length - 1) {
            nodes.push(
              <React.Fragment key={`trans-${i}`}>{TRANS()}</React.Fragment>,
            );
          }
          return nodes;
        })}
      </TransitionSeries>
      </Sequence>

      {/* Curtain — fades to black across the final FADE_TO_BLACK_FRAMES of the
          visual section; stays fully black through the post-roll so the boom's
          decay plays into darkness. */}
      <FadeToBlack visualEnd={visualEnd} />
    </>
  );
};
