import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_2,
  BEDS,
  FONT,
  FadeUp,
  MONO,
  TEXT,
  TEXT_DIM,
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
} from "./explainer-shared";
import type { SceneVisualProps } from "./explainer-shared/intro-chapter";

const center: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 120px",
  textAlign: "center",
};

const Scene1Hook: React.FC<SceneVisualProps> = () => (
  <AbsoluteFill style={center}>
    <FadeUp delay={0}>
      <div style={{ fontFamily: FONT, fontSize: 88, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        Landing pages.<br />Shopify refactors.
      </div>
    </FadeUp>
    <div style={{ height: 48 }} />
    <FadeUp delay={70}>
      <div style={{ fontFamily: FONT, fontSize: 96, fontWeight: 700, fontStyle: "italic", color: ACCENT, letterSpacing: "-0.02em" }}>
        Used to take weeks.
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const Scene2Turn: React.FC<SceneVisualProps> = () => (
  <AbsoluteFill style={center}>
    <FadeUp delay={0}>
      <div style={{ fontFamily: FONT, fontSize: 88, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em" }}>
        Agency-quality design.
      </div>
    </FadeUp>
    <div style={{ height: 32 }} />
    <FadeUp delay={55}>
      <div style={{ fontFamily: FONT, fontSize: 88, fontWeight: 600, color: ACCENT, letterSpacing: "-0.02em" }}>
        Without waiting three weeks.
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const Scene3Intake: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const url = "https://yourbrand.com";
  const typed = url.slice(0, Math.min(url.length, Math.floor(frame / 2)));
  const cards = ["FONTS", "COLOURS", "VOICE"];
  return (
    <AbsoluteFill style={center}>
      <div style={{ fontFamily: MONO, fontSize: 36, color: TEXT, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", padding: "18px 32px", borderRadius: 8 }}>
        {typed}<span style={{ opacity: (frame % 30) < 15 ? 1 : 0 }}>|</span>
      </div>
      <FadeUp delay={50}><div style={{ fontSize: 56, color: TEXT_DIM, marginTop: 32, marginBottom: 32 }}>↓</div></FadeUp>
      <div style={{ display: "flex", gap: 32 }}>
        {cards.map((c, i) => (
          <FadeUp key={c} delay={80 + i * 30} offsetY={32}>
            <div style={{ width: 220, height: 140, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 24, letterSpacing: "0.32em", color: ACCENT_2 }}>
              {c}
            </div>
          </FadeUp>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const countUp = (frame: number, start: number, target: number) =>
  Math.floor(interpolate(frame, [start, start + 30], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

const Scene4aRules: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const stats: Array<[string, number, string, number]> = [
    ["", countUp(frame, 0, 15), "DATABASES", 0],
    ["", countUp(frame, 30, 165), "RULES", 30],
    ["", countUp(frame, 60, 7), "OF 10 STAGES", 60],
  ];
  return (
    <AbsoluteFill style={center}>
      <div style={{ display: "flex", gap: 96, alignItems: "flex-end" }}>
        {stats.map(([_, n, label, delay]) => (
          <FadeUp key={label} delay={delay} offsetY={28}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontFamily: FONT, fontSize: 200, fontWeight: 700, color: ACCENT, letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.32em", color: TEXT_DIM, marginTop: 12 }}>{label}</div>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={140}>
        <div style={{ fontFamily: FONT, fontSize: 38, fontStyle: "italic", color: TEXT_DIM, marginTop: 56 }}>
          anti-AI gates · UI/UX frameworks · conversion
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const Scene4bStitch: React.FC<SceneVisualProps> = () => {
  const stages: Array<{ label: string; color: string; delay: number }> = [
    { label: "PROMPT", color: TEXT_DIM, delay: 0 },
    { label: "GOOGLE STITCH", color: ACCENT, delay: 50 },
    { label: "DESIGNS", color: TEXT, delay: 100 },
  ];
  return (
    <AbsoluteFill style={center}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            <FadeUp delay={s.delay} offsetY={28}>
              <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: "0.24em", color: s.color, padding: "32px 40px", border: `1px solid ${s.color}40`, borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
                {s.label}
              </div>
            </FadeUp>
            {i < stages.length - 1 && (
              <FadeUp delay={s.delay + 25}>
                <div style={{ fontFamily: FONT, fontSize: 56, color: TEXT_DIM }}>→</div>
              </FadeUp>
            )}
          </React.Fragment>
        ))}
      </div>
      <FadeUp delay={170}>
        <div style={{ fontFamily: FONT, fontSize: 44, fontStyle: "italic", color: TEXT, marginTop: 72 }}>
          Claude refactors all the drifts.
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const Scene5Proof: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const brands: Array<[string, number, number]> = [
    ["RE TECH UK", 27, 0],
    ["DATABRILL", 27, 35],
    ["PUSH-PULL", 28, 70],
  ];
  return (
    <AbsoluteFill style={center}>
      <div style={{ display: "flex", gap: 64 }}>
        {brands.map(([name, target, delay]) => (
          <FadeUp key={name} delay={delay} offsetY={32}>
            <div style={{ width: 360, padding: "40px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: "0.24em", color: TEXT_DIM }}>{name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontFamily: FONT, fontSize: 160, fontWeight: 600, color: ACCENT, lineHeight: 1 }}>{countUp(frame, delay + 20, target)}</div>
                <div style={{ fontFamily: FONT, fontSize: 36, color: TEXT_DIM }}>/ 30</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.16em", color: ACCENT_2 }}>CLEARED</div>
            </div>
          </FadeUp>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Scene6Time: React.FC<SceneVisualProps> = () => (
  <AbsoluteFill style={center}>
    <FadeUp delay={0}>
      <div style={{ fontFamily: FONT, fontSize: 260, fontWeight: 700, color: ACCENT, letterSpacing: "-0.05em", lineHeight: 1 }}>
        ~10 min
      </div>
    </FadeUp>
    <FadeUp delay={50}>
      <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 500, color: TEXT, marginTop: 24 }}>
        end to end
      </div>
    </FadeUp>
    <FadeUp delay={100}>
      <div style={{ fontFamily: FONT, fontSize: 32, fontStyle: "italic", color: TEXT_DIM, marginTop: 16 }}>
        Leaving more time to spend in Stitch.
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const Scene7Cta: React.FC<SceneVisualProps> = () => (
  <AbsoluteFill style={center}>
    <FadeUp delay={0}>
      <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em" }}>
        Pull the repo.
      </div>
    </FadeUp>
    <FadeUp delay={20}>
      <div style={{ fontFamily: MONO, fontSize: 40, color: ACCENT, marginTop: 32 }}>
        github.com/sellersessions/claude-ui-workflow
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const SCENES: readonly IntroChapterScene[] = [
  { id: "scene-1-hook",    label: "Scene 1", title: "Hook",   sourceStart: 0, clipDurationSeconds: 20, visual: Scene1Hook },
  { id: "scene-2-turn",    label: "Scene 2", title: "Turn",   sourceStart: 0, clipDurationSeconds: 20, visual: Scene2Turn },
  { id: "scene-3-intake",  label: "Scene 3", title: "Intake", sourceStart: 0, clipDurationSeconds: 20, visual: Scene3Intake },
  { id: "scene-4a-rules",  label: "Scene 4a", title: "Rules", sourceStart: 0, clipDurationSeconds: 20, visual: Scene4aRules },
  { id: "scene-4b-stitch", label: "Scene 4b", title: "Stitch", sourceStart: 0, clipDurationSeconds: 20, visual: Scene4bStitch },
  { id: "scene-5-proof",   label: "Scene 5", title: "Proof",  sourceStart: 0, clipDurationSeconds: 20, visual: Scene5Proof },
  { id: "scene-6-time",    label: "Scene 6", title: "Time",   sourceStart: 0, clipDurationSeconds: 20, visual: Scene6Time },
  { id: "scene-7-cta",     label: "Scene 7", title: "CTA",    sourceStart: 0, clipDurationSeconds: 20, visual: Scene7Cta },
];

const { Component, schema, calculateMetadata, fallbackDurationInFrames } =
  makeIntroChapter({
    slug: "claude-ui-workflow",
    scenes: SCENES,
    cardBefore: false,
    musicBed: BEDS.HOUSE_DEFAULT,
    posterFrame: {
      eyebrow: "Claude UI Workflow",
      title: (
        <>
          10-Stage <span style={{ color: ACCENT_2 }}>Design Pipeline</span>
        </>
      ),
    },
    audioLeadFrames: 8,
  });

export const claudeUiWorkflowExplainerSchema: typeof introChapterSchema = schema;
export type ClaudeUiWorkflowExplainerProps = z.infer<typeof introChapterSchema>;
export const ClaudeUiWorkflowExplainer = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
