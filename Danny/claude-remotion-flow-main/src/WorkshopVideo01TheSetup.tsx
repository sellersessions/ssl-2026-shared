import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
  type SceneVisualProps,
} from "./explainer-shared";
import { ScenePlaceholder } from "./workshop-video-01-the-setup/ScenePlaceholder";
import {
  CyclingAudienceHero,
  KenBurnsImage,
  LoopDiagram,
} from "./workshop-video-01-the-setup/visuals";

// WorkshopVideo01TheSetup — first of the 4 distilled videos (replaces ch01-04 + Mod1).
// 5 scenes, kinetic typography on the left + per-scene right-side visual:
//   1. Cycling "Built for [audience]" hero (native, mirrors claude.com top)
//   2. Native 4-node Loop diagram
//   3. Theme picker screenshot (Ken Burns)
//   4. Command palette screenshot (Ken Burns)
//   5. CLAUDE.md preview screenshot (Ken Burns)

type SceneCopy = { label: string; title: string; caption: string };

const COPY: Record<string, SceneCopy> = {
  "scene-1-install":   { label: "Setup · 01 / 05", title: "Install Claude Code",     caption: "VS Code marketplace · search Anthropic · install · reload — that's the whole install." },
  "scene-2-loop":      { label: "Setup · 02 / 05", title: "The Loop",                caption: "You prompt · Claude acts · you check · you prompt again. Every workflow lives inside that loop." },
  "scene-3-themes":    { label: "Setup · 03 / 05", title: "Themes That Stick",       caption: "Dracula · GitHub Light · Night Owl — pick once, VS Code remembers across every project." },
  "scene-4-settings":  { label: "Setup · 04 / 05", title: "Settings the Easy Way",   caption: "Cmd+Shift+P opens the command palette. Don't want to learn the settings file? Ask Claude to write it." },
  "scene-5-claude-md": { label: "Setup · 05 / 05", title: "CLAUDE.md — Your Brain",  caption: "One file at the project root. Claude reads it every turn. Build it slowly — Claude gets sharper every session." },
};

const VISUAL_BUILDERS: Record<string, ((props: SceneVisualProps) => React.ReactNode) | undefined> = {
  "scene-1-install":   (props) => <CyclingAudienceHero durationInFrames={props.durationInFrames} />,
  "scene-2-loop":      (props) => <LoopDiagram durationInFrames={props.durationInFrames} />,
  "scene-3-themes":    (props) => <KenBurnsImage src="assets/video-01/theme-picker.png" durationInFrames={props.durationInFrames} />,
  "scene-4-settings":  (props) => <KenBurnsImage src="assets/video-01/command-palette.png" durationInFrames={props.durationInFrames} />,
  "scene-5-claude-md": (props) => <KenBurnsImage src="assets/video-01/claude-md-preview.png" durationInFrames={props.durationInFrames} />,
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
  { id: "scene-1-install",   label: COPY["scene-1-install"].label,   title: COPY["scene-1-install"].title,   sourceStart: 0, clipDurationSeconds: 12, visual: makePlaceholder("scene-1-install") },
  { id: "scene-2-loop",      label: COPY["scene-2-loop"].label,      title: COPY["scene-2-loop"].title,      sourceStart: 0, clipDurationSeconds: 12, visual: makePlaceholder("scene-2-loop") },
  { id: "scene-3-themes",    label: COPY["scene-3-themes"].label,    title: COPY["scene-3-themes"].title,    sourceStart: 0, clipDurationSeconds: 10, visual: makePlaceholder("scene-3-themes") },
  { id: "scene-4-settings",  label: COPY["scene-4-settings"].label,  title: COPY["scene-4-settings"].title,  sourceStart: 0, clipDurationSeconds: 11, visual: makePlaceholder("scene-4-settings") },
  { id: "scene-5-claude-md", label: COPY["scene-5-claude-md"].label, title: COPY["scene-5-claude-md"].title, sourceStart: 0, clipDurationSeconds: 16, visual: makePlaceholder("scene-5-claude-md") },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-video-01-the-setup",
  scenes: SCENES,
  cardDurationFrames: 24,
  musicBed: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
});

export const workshopVideo01TheSetupSchema: typeof introChapterSchema = schema;
export type WorkshopVideo01TheSetupProps = z.infer<typeof introChapterSchema>;
export const WorkshopVideo01TheSetup = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
