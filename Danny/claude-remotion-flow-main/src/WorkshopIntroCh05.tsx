import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
  type SceneVisualProps,
} from "./explainer-shared";
import { ScenePlaceholder } from "./workshop-intro-ch05/ScenePlaceholder";
import { InstallCard, KenBurnsImage, ThemeStack } from "./workshop-intro-ch05/visuals";

// WorkshopIntroCh05 — Workshop Intro Chapter 05 (Screenshots & Typora Markdown Workflow).
// Visual content: per-scene React components (no source mp4) — kinetic typography
// on the left + Typora marketing assets on the right (Ken Burns / themed stack /
// install card). Scene 1 is text-only (Claude topic, not Typora).
// Audio spine inherited from explainer-shared/intro-chapter.tsx (single-stem VO,
// chapter cards, music bed, intro/outro SFX, fade-to-black).

type SceneCopy = { label: string; title: string; caption: string };

const COPY: Record<string, SceneCopy> = {
  "scene-1-screenshots":   { label: "Chapter 05 · 01 / 05", title: "Screenshots into Claude", caption: "Cmd+Shift+4 to capture · shift-drag into the chat to paste inline." },
  "scene-2-typora-install":{ label: "Chapter 05 · 02 / 05", title: "Install Typora",          caption: "$14 one-time · 7-day trial · the cleanest markdown reader for this workflow." },
  "scene-3-typora-render": { label: "Chapter 05 · 03 / 05", title: "Markdown Rendered",       caption: "Raw markdown becomes a clean document — headings, lists, tables, all properly typeset." },
  "scene-4-themes":        { label: "Chapter 05 · 04 / 05", title: "Themes",                  caption: "Light · Dark · GitHub · Night — pick the one that matches your screen." },
  "scene-5-mermaid":       { label: "Chapter 05 · 05 / 05", title: "Mermaid Diagrams",        caption: "Inline rendering — ask Claude for the Mermaid block and Typora turns it into a real visual." },
};

const VISUAL_BUILDERS: Record<string, ((props: SceneVisualProps) => React.ReactNode) | undefined> = {
  "scene-1-screenshots": undefined, // text-only (Claude topic)
  "scene-2-typora-install": (props) => <InstallCard durationInFrames={props.durationInFrames} />,
  "scene-3-typora-render": (props) => <KenBurnsImage src="assets/ch05/lists.png" durationInFrames={props.durationInFrames} />,
  "scene-4-themes": (props) => <ThemeStack durationInFrames={props.durationInFrames} />,
  "scene-5-mermaid": (props) => <KenBurnsImage src="assets/ch05/diagram.png" durationInFrames={props.durationInFrames} />,
};

const makePlaceholder = (id: string): React.FC<SceneVisualProps> => {
  const buildVisual = VISUAL_BUILDERS[id];
  const Component: React.FC<SceneVisualProps> = (props) => (
    <ScenePlaceholder
      {...props}
      {...COPY[id]}
      rightVisual={buildVisual ? buildVisual(props) : undefined}
    />
  );
  Component.displayName = `ScenePlaceholder(${id})`;
  return Component;
};

const SCENES: readonly IntroChapterScene[] = [
  { id: "scene-1-screenshots",    label: COPY["scene-1-screenshots"].label,    title: COPY["scene-1-screenshots"].title,    sourceStart: 0, clipDurationSeconds: 12, visual: makePlaceholder("scene-1-screenshots") },
  { id: "scene-2-typora-install", label: COPY["scene-2-typora-install"].label, title: COPY["scene-2-typora-install"].title, sourceStart: 0, clipDurationSeconds: 13, visual: makePlaceholder("scene-2-typora-install") },
  { id: "scene-3-typora-render",  label: COPY["scene-3-typora-render"].label,  title: COPY["scene-3-typora-render"].title,  sourceStart: 0, clipDurationSeconds: 13, visual: makePlaceholder("scene-3-typora-render") },
  { id: "scene-4-themes",         label: COPY["scene-4-themes"].label,         title: COPY["scene-4-themes"].title,         sourceStart: 0, clipDurationSeconds: 10, visual: makePlaceholder("scene-4-themes") },
  { id: "scene-5-mermaid",        label: COPY["scene-5-mermaid"].label,        title: COPY["scene-5-mermaid"].title,        sourceStart: 0, clipDurationSeconds: 17, visual: makePlaceholder("scene-5-mermaid") },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-intro-ch05",
  scenes: SCENES,
  cardDurationFrames: 24,
  musicBed: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
});

export const workshopIntroCh05Schema: typeof introChapterSchema = schema;
export type WorkshopIntroCh05Props = z.infer<typeof introChapterSchema>;
export const WorkshopIntroCh05 = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
