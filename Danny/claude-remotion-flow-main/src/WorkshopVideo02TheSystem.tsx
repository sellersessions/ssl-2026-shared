import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
  type SceneVisualProps,
} from "./explainer-shared";
import { ScenePlaceholder } from "./workshop-video-02-the-system/ScenePlaceholder";
import {
  JsonlRecoveryTerminal,
  KenBurnsImage,
  ScreenshotPlaceholder,
} from "./workshop-video-02-the-system/visuals";

// WorkshopVideo02TheSystem — split version (scenes 1-3 of original 6).
// Theme: what ships out of the box. Master Log + JSONL recovery + shipped slash commands.
// Scenes 4-6 (custom slash + MCPs + Context7) live in WorkshopVideo03TheToolkit.

type SceneCopy = { label: string; title: string; caption: string };

const COPY: Record<string, SceneCopy> = {
  "scene-1-master-log":     { label: "System · 01 / 03", title: "The Master Log",       caption: "Project-level breadcrumbs · open it · get a quick read of where you are." },
  "scene-2-recover":        { label: "System · 02 / 03", title: "Recover Anything",     caption: "Don't paste — ask. Claude reads the JSONL and picks up exactly where you stopped." },
  "scene-3-slash-shipped":  { label: "System · 03 / 03", title: "Slash Commands",       caption: "/new · /resume · /clear · /mcp-status · /models — five strokes saves you a sentence." },
};

const VISUAL_BUILDERS: Record<string, ((props: SceneVisualProps) => React.ReactNode) | undefined> = {
  "scene-1-master-log":    (props) =>
    pngExists("master-log.png")
      ? <KenBurnsImage src="assets/video-02/master-log.png" durationInFrames={props.durationInFrames} />
      : <ScreenshotPlaceholder label="MASTER LOG · screenshot pending" />,
  "scene-2-recover":       (props) => <JsonlRecoveryTerminal durationInFrames={props.durationInFrames} />,
  "scene-3-slash-shipped": (props) =>
    pngExists("slash-shipped.png")
      ? <KenBurnsImage src="assets/video-02/slash-shipped.png" durationInFrames={props.durationInFrames} />
      : <ScreenshotPlaceholder label="SLASH MENU · screenshot pending" />,
};

const AVAILABLE_CAPTURES: ReadonlySet<string> = new Set<string>([
  "master-log.png",
  "slash-shipped.png",
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
  { id: "scene-1-master-log",    label: COPY["scene-1-master-log"].label,    title: COPY["scene-1-master-log"].title,    sourceStart: 0, clipDurationSeconds: 16, visual: makePlaceholder("scene-1-master-log") },
  { id: "scene-2-recover",       label: COPY["scene-2-recover"].label,       title: COPY["scene-2-recover"].title,       sourceStart: 0, clipDurationSeconds: 15, visual: makePlaceholder("scene-2-recover") },
  { id: "scene-3-slash-shipped", label: COPY["scene-3-slash-shipped"].label, title: COPY["scene-3-slash-shipped"].title, sourceStart: 0, clipDurationSeconds: 17, visual: makePlaceholder("scene-3-slash-shipped") },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-video-02-the-system",
  scenes: SCENES,
  cardDurationFrames: 24,
  musicBed: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
});

export const workshopVideo02TheSystemSchema: typeof introChapterSchema = schema;
export type WorkshopVideo02TheSystemProps = z.infer<typeof introChapterSchema>;
export const WorkshopVideo02TheSystem = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
