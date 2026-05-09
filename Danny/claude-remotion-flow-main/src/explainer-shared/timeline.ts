import { TRANS_FRAMES, CARD_DURATION_FRAMES } from "./constants";

export type ChapterCardSpec = { label: string; title: string };

export type TimelineItem =
  | { kind: "scene"; sceneIndex: number; duration: number; start: number }
  | { kind: "card"; card: ChapterCardSpec; duration: number; start: number };

// Interleaves chapter cards (when present) before their target scene, then
// computes cumulative starts while accounting for the TransitionSeries
// overlap (each transition eats TRANS_FRAMES off the cursor).
export function computeTimeline(
  sceneDurations: number[],
  cardBefore: readonly (ChapterCardSpec | null)[],
  cardDurationFrames: number = CARD_DURATION_FRAMES,
): {
  sceneStarts: number[];
  items: TimelineItem[];
  totalFrames: number;
} {
  const raw: Array<
    | { kind: "scene"; sceneIndex: number; duration: number }
    | { kind: "card"; card: ChapterCardSpec; duration: number }
  > = [];
  for (let i = 0; i < sceneDurations.length; i++) {
    const card = cardBefore[i];
    if (card) raw.push({ kind: "card", card, duration: cardDurationFrames });
    raw.push({ kind: "scene", sceneIndex: i, duration: sceneDurations[i] });
  }

  const sceneStarts: number[] = new Array(sceneDurations.length).fill(0);
  const items: TimelineItem[] = [];
  let cursor = 0;
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (item.kind === "scene") {
      items.push({ ...item, start: cursor });
      sceneStarts[item.sceneIndex] = cursor;
    } else {
      items.push({ ...item, start: cursor });
    }
    cursor += item.duration - (i < raw.length - 1 ? TRANS_FRAMES : 0);
  }

  const last = items[items.length - 1];
  const totalFrames = last ? last.start + last.duration : 0;

  return { sceneStarts, items, totalFrames };
}
