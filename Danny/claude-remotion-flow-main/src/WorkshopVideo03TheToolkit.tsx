import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
  type SceneVisualProps,
} from "./explainer-shared";
import { ScenePlaceholder } from "./workshop-video-02-the-system/ScenePlaceholder";
import {
  KenBurnsImage,
  ScreenshotPlaceholder,
  SessionLoopDiagram,
} from "./workshop-video-02-the-system/visuals";

// WorkshopVideo03TheToolkit — split from WorkshopVideo02 (was scenes 4-6).
// Theme: extending Claude beyond defaults. Custom slash loop + MCPs + Context7.

type SceneCopy = { label: string; title: string; caption: string };

const COPY: Record<string, SceneCopy> = {
  "scene-1-slash-custom": { label: "Toolkit · 01 / 03", title: "Make Your Own",                  caption: "/session-start · /pre-compact · /session-close — three commands, one loop." },
  "scene-2-mcps":         { label: "Toolkit · 02 / 03", title: "MCPs — Six That Matter",         caption: "Sequential Thinking · Filesystem · Fetch · Context7 · AppleScript · Playwright." },
  "scene-3-context7":     { label: "Toolkit · 03 / 03", title: "Context7 — Live Documentation",  caption: "Live API docs · always current · plan from real source, not a guess." },
};

const VISUAL_BUILDERS: Record<string, ((props: SceneVisualProps) => React.ReactNode) | undefined> = {
  "scene-1-slash-custom": (props) => <SessionLoopDiagram durationInFrames={props.durationInFrames} />,
  "scene-2-mcps":         (props) =>
    pngExists("mcp-status.png")
      ? <KenBurnsImage src="assets/video-03/mcp-status.png" durationInFrames={props.durationInFrames} />
      : <ScreenshotPlaceholder label="/mcp-status · screenshot pending" />,
  "scene-3-context7":     (props) =>
    pngExists("context7-query.png")
      ? <KenBurnsImage src="assets/video-03/context7-query.png" durationInFrames={props.durationInFrames} />
      : <ScreenshotPlaceholder label="CONTEXT7 · screenshot pending" />,
};

const AVAILABLE_CAPTURES: ReadonlySet<string> = new Set<string>([
  "mcp-status.png",
  "context7-query.png",
]);

function pngExists(filename: string): boolean {
  return AVAILABLE_CAPTURES.has(filename);
}

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
  { id: "scene-1-slash-custom", label: COPY["scene-1-slash-custom"].label, title: COPY["scene-1-slash-custom"].title, sourceStart: 0, clipDurationSeconds: 19, visual: makePlaceholder("scene-1-slash-custom") },
  { id: "scene-2-mcps",         label: COPY["scene-2-mcps"].label,         title: COPY["scene-2-mcps"].title,         sourceStart: 0, clipDurationSeconds: 20, visual: makePlaceholder("scene-2-mcps") },
  { id: "scene-3-context7",     label: COPY["scene-3-context7"].label,     title: COPY["scene-3-context7"].title,     sourceStart: 0, clipDurationSeconds: 13, visual: makePlaceholder("scene-3-context7") },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-video-03-the-toolkit",
  scenes: SCENES,
  cardDurationFrames: 24,
  musicBed: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
});

export const workshopVideo03TheToolkitSchema: typeof introChapterSchema = schema;
export type WorkshopVideo03TheToolkitProps = z.infer<typeof introChapterSchema>;
export const WorkshopVideo03TheToolkit = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
