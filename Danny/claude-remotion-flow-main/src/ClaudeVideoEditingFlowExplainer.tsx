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

const Scene1Hook: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  // Scissors enter at scene-rel frame 91 (== video frame 121), descend + snip
  const scissorsTop = interpolate(frame, [91, 111], [-160, 380], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scissorsRot = interpolate(frame, [112, 122, 132], [0, -22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={center}>
      <FadeUp delay={0}>
        <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Editing long-form video<br />by hand.
        </div>
      </FadeUp>
      <div style={{ height: 40 }} />
      <FadeUp delay={60}>
        <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 500, fontStyle: "italic", color: ACCENT, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Scrubbing four minutes<br />for sixty good seconds.
        </div>
      </FadeUp>
      {frame >= 91 && (
        <div
          style={{
            position: "absolute",
            right: 180,
            top: scissorsTop,
            transform: `rotate(${scissorsRot}deg)`,
            transformOrigin: "50% 30%",
            opacity: 0.85,
          }}
        >
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke={ACCENT_2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Scene2Turn: React.FC<SceneVisualProps> = () => (
  <AbsoluteFill style={center}>
    <FadeUp delay={0}>
      <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em" }}>
        Read the cuts as a list.
      </div>
    </FadeUp>
    <div style={{ height: 32 }} />
    <FadeUp delay={55}>
      <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 600, color: ACCENT, letterSpacing: "-0.02em" }}>
        Tick the ones that work.
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const Scene3Intake: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const path = "~/Movies/keynote-cut.mp4";
  const typed = path.slice(0, Math.min(path.length, Math.floor(frame / 2)));
  const cards = ["TRANSCRIBE", "RANK", "TABLE"];
  return (
    <AbsoluteFill style={center}>
      <div style={{ fontFamily: MONO, fontSize: 32, color: TEXT, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", padding: "18px 32px", borderRadius: 8 }}>
        {typed}<span style={{ opacity: (frame % 30) < 15 ? 1 : 0 }}>|</span>
      </div>
      <FadeUp delay={50}><div style={{ fontSize: 56, color: TEXT_DIM, marginTop: 32, marginBottom: 32 }}>↓</div></FadeUp>
      <div style={{ display: "flex", gap: 32 }}>
        {cards.map((c, i) => (
          <FadeUp key={c} delay={80 + i * 30} offsetY={32}>
            <div style={{ width: 260, height: 140, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 22, letterSpacing: "0.32em", color: ACCENT_2 }}>
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

const Scene4aScore: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const stats: Array<[number, string, number]> = [
    [countUp(frame, 0, 5), "PIPELINE STAGES", 0],
    [countUp(frame, 30, 2), "PRE-RENDER GATES", 30],
  ];
  const stageLabels = ["INTAKE", "SCORE", "GATE", "GATE", "RENDER"];
  return (
    <AbsoluteFill style={center}>
      <div style={{ display: "flex", gap: 96, alignItems: "flex-end" }}>
        {stats.map(([n, label, delay]) => (
          <FadeUp key={label} delay={delay} offsetY={28}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontFamily: FONT, fontSize: 220, fontWeight: 700, color: ACCENT, letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.32em", color: TEXT_DIM, marginTop: 12 }}>{label}</div>
            </div>
          </FadeUp>
        ))}
      </div>
      <FadeUp delay={90}>
        <div style={{ display: "flex", gap: 16, marginTop: 48, alignItems: "center" }}>
          {stageLabels.map((label, i) => {
            const filled = frame >= 110 + i * 10;
            return (
              <React.Fragment key={`${label}-${i}`}>
                <div
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: `1px solid ${filled ? ACCENT : "rgba(255,255,255,0.18)"}`,
                    background: filled ? "rgba(155,135,255,0.12)" : "rgba(255,255,255,0.03)",
                    fontFamily: MONO,
                    fontSize: 16,
                    letterSpacing: "0.24em",
                    color: filled ? ACCENT : TEXT_DIM,
                    transition: "all 200ms ease",
                  }}
                >
                  {label}
                </div>
                {i < stageLabels.length - 1 && (
                  <div style={{ width: 14, height: 1, background: filled ? ACCENT : "rgba(255,255,255,0.18)" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </FadeUp>
      <FadeUp delay={170}>
        <div style={{ fontFamily: FONT, fontSize: 32, fontStyle: "italic", color: TEXT_DIM, marginTop: 32 }}>
          every cut audited before render
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const Scene4bRender: React.FC<SceneVisualProps> = () => {
  const frame = useCurrentFrame();
  const command = "> hey claude, render 3a 5b 7c";
  const typeStart = 30;
  const charsPerFrame = 0.6;
  const typed = command.slice(
    0,
    Math.min(command.length, Math.max(0, Math.floor((frame - typeStart) * charsPerFrame))),
  );
  return (
    <AbsoluteFill style={center}>
      <FadeUp delay={0} offsetY={28}>
        <div
          style={{
            width: 980,
            background: "rgba(8,6,16,0.85)",
            border: "1px solid rgba(155,135,255,0.35)",
            borderRadius: 14,
            padding: "28px 36px",
            fontFamily: MONO,
            fontSize: 32,
            letterSpacing: "0.04em",
            color: TEXT,
            boxShadow: "0 12px 60px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff5f57" }} />
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#febc2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#28c840" }} />
          </div>
          <div>
            <span style={{ color: ACCENT_2 }}>{typed}</span>
            <span style={{ opacity: (frame % 30) < 15 ? 1 : 0, color: TEXT }}>|</span>
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={140}>
        <div style={{ fontFamily: FONT, fontSize: 36, fontStyle: "italic", color: TEXT, marginTop: 56 }}>
          single grade · 30ms fades · clean
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const Scene5Proof: React.FC<SceneVisualProps> = () => {
  const cards: Array<[string, number]> = [
    ["PODCAST CUTS", 0],
    ["LOOM WALKTHROUGHS", 35],
    ["VERTICAL REELS", 70],
    ["KEYNOTE FOOTAGE", 105],
  ];
  return (
    <AbsoluteFill style={center}>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {cards.map(([name, delay]) => (
          <FadeUp key={name} delay={delay} offsetY={32}>
            <div style={{ width: 320, padding: "36px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.24em", color: ACCENT_2, textAlign: "center" }}>{name}</div>
              <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.16em", color: TEXT_DIM }}>TESTED</div>
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
      <div style={{ fontFamily: FONT, fontSize: 240, fontWeight: 700, color: ACCENT, letterSpacing: "-0.05em", lineHeight: 1 }}>
        ~5 min
      </div>
    </FadeUp>
    <FadeUp delay={50}>
      <div style={{ fontFamily: FONT, fontSize: 48, fontWeight: 500, color: TEXT, marginTop: 24 }}>
        end to end
      </div>
    </FadeUp>
    <FadeUp delay={100}>
      <div style={{ fontFamily: FONT, fontSize: 32, fontStyle: "italic", color: TEXT_DIM, marginTop: 24 }}>
        2 min reading. 3 min Claude renders.
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
      <div style={{ fontFamily: MONO, fontSize: 36, color: ACCENT, marginTop: 32 }}>
        github.com/sellersessions/claude-video-editing-flow
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const SCENES: readonly IntroChapterScene[] = [
  { id: "scene-1-hook",     label: "Scene 1",  title: "Hook",    sourceStart: 0, clipDurationSeconds: 20, visual: Scene1Hook },
  { id: "scene-2-turn",     label: "Scene 2",  title: "Turn",    sourceStart: 0, clipDurationSeconds: 20, visual: Scene2Turn },
  { id: "scene-3-intake",   label: "Scene 3",  title: "Intake",  sourceStart: 0, clipDurationSeconds: 20, visual: Scene3Intake },
  { id: "scene-4a-score",   label: "Scene 4a", title: "Score",   sourceStart: 0, clipDurationSeconds: 20, visual: Scene4aScore },
  { id: "scene-4b-render",  label: "Scene 4b", title: "Render",  sourceStart: 0, clipDurationSeconds: 20, visual: Scene4bRender },
  { id: "scene-5-proof",    label: "Scene 5",  title: "Proof",   sourceStart: 0, clipDurationSeconds: 20, visual: Scene5Proof },
  { id: "scene-6-time",     label: "Scene 6",  title: "Time",    sourceStart: 0, clipDurationSeconds: 20, visual: Scene6Time },
  { id: "scene-7-cta",      label: "Scene 7",  title: "CTA",     sourceStart: 0, clipDurationSeconds: 20, visual: Scene7Cta },
];

const { Component, schema, calculateMetadata, fallbackDurationInFrames } =
  makeIntroChapter({
    slug: "claude-video-editing-flow",
    scenes: SCENES,
    cardBefore: false,
    musicBed: BEDS.HOUSE_DEFAULT,
    posterFrame: {
      eyebrow: "Claude Video Editing Flow",
      title: (
        <span style={{ letterSpacing: "-0.04em" }}>
          Read the cuts, tick what works.
        </span>
      ),
    },
    audioLeadFrames: 8,
  });

export const claudeVideoEditingFlowExplainerSchema: typeof introChapterSchema = schema;
export type ClaudeVideoEditingFlowExplainerProps = z.infer<typeof introChapterSchema>;
export const ClaudeVideoEditingFlowExplainer = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
