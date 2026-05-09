import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
  type SceneVisualProps,
} from "./explainer-shared";
import { ScenePlaceholder } from "./workshop-video-02-the-system/ScenePlaceholder";
import {
  CdTerminal,
  KineticThreeBeat,
  ModulePathDiagram,
  ReadDriveLoopDiagram,
} from "./workshop-overview/visuals";

// WorkshopOverview — companion video for AI Workshop 2.0 (SSL 26 Edition) README.md.
// Course-level intro. Under 65s. Sets up the read-then-self-drive contract.

type SceneCopy = { label: string; title: string; caption: string };

const COPY: Record<string, SceneCopy> = {
  "scene-1-welcome": { label: "AI Workshop · 01 / 04", title: "Self-Drive Course",       caption: "You read · you ask Claude · Claude builds. No instructor. No helpdesk." },
  "scene-2-loop":    { label: "AI Workshop · 02 / 04", title: "The Module Loop",         caption: "Read README · right-click the setup file · copy path · paste into Claude · verify." },
  "scene-3-path":    { label: "AI Workshop · 03 / 04", title: "Seven Modules, In Order", caption: "Install · Copilot · CLAUDE.md · Master Log · Slash · MCPs · Agents — each one builds on the last." },
  "scene-4-start":   { label: "AI Workshop · 04 / 04", title: "Start Here",              caption: "Open Module-000 · install Claude Code · the rest unlocks one module at a time." },
};

const VISUAL_BUILDERS: Record<string, ((props: SceneVisualProps) => React.ReactNode) | undefined> = {
  "scene-1-welcome": (props) => <KineticThreeBeat durationInFrames={props.durationInFrames} />,
  "scene-2-loop":    (props) => <ReadDriveLoopDiagram durationInFrames={props.durationInFrames} />,
  "scene-3-path":    (props) => <ModulePathDiagram durationInFrames={props.durationInFrames} />,
  "scene-4-start":   (props) => <CdTerminal durationInFrames={props.durationInFrames} />,
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
  { id: "scene-1-welcome", label: COPY["scene-1-welcome"].label, title: COPY["scene-1-welcome"].title, sourceStart: 0, clipDurationSeconds: 13, visual: makePlaceholder("scene-1-welcome") },
  { id: "scene-2-loop",    label: COPY["scene-2-loop"].label,    title: COPY["scene-2-loop"].title,    sourceStart: 0, clipDurationSeconds: 16, visual: makePlaceholder("scene-2-loop") },
  { id: "scene-3-path",    label: COPY["scene-3-path"].label,    title: COPY["scene-3-path"].title,    sourceStart: 0, clipDurationSeconds: 17, visual: makePlaceholder("scene-3-path") },
  { id: "scene-4-start",   label: COPY["scene-4-start"].label,   title: COPY["scene-4-start"].title,   sourceStart: 0, clipDurationSeconds: 9,  visual: makePlaceholder("scene-4-start") },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-overview",
  scenes: SCENES,
  cardDurationFrames: 24,
  musicBed: "assets/music/ssl-live-beds/onaldin_music-emotional-modern-piano-inspiration-cherry-orchard-346399.mp3",
});

export const workshopOverviewSchema: typeof introChapterSchema = schema;
export type WorkshopOverviewProps = z.infer<typeof introChapterSchema>;
export const WorkshopOverview = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
