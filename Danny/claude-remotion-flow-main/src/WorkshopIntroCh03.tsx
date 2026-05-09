import { z } from "zod";
import {
  introChapterSchema,
  makeIntroChapter,
  type IntroChapterScene,
} from "./explainer-shared";

// WorkshopIntroCh03 — Workshop Intro Chapter 03 (Extensions & Recovering from Loops).
// Source: workshop-intro-chapters.mp4 (251.6–409.1s for ch03).
// Slug "workshop-intro-ch03" derives voice paths, render output naming, log
// prefix. All composition wiring (cards, transitions, SFX bookends, mixer,
// pre/post-roll, fade-to-black, single-stem VO with reverb+limiter, music bed
// wired-off, clip-fit guard) is inherited from explainer-shared/intro-chapter.tsx.

const SCENES: readonly IntroChapterScene[] = [
  { id: "scene-1-extensions-panel",    label: "Chapter 03 · 01 / 06", title: "Extensions Panel",     sourceStart: 260, clipDurationSeconds: 12 },
  { id: "scene-2-restart-vs-disable",  label: "Chapter 03 · 02 / 06", title: "Restart vs Disable",   sourceStart: 350, clipDurationSeconds: 14 },
  { id: "scene-3-loop-recovery",       label: "Chapter 03 · 03 / 06", title: "Loop Recovery",        sourceStart: 271, clipDurationSeconds: 18 },
  { id: "scene-4-master-log",          label: "Chapter 03 · 04 / 06", title: "Master Sessions Log",  sourceStart: 289, clipDurationSeconds: 10 },
  { id: "scene-5-other-extensions",    label: "Chapter 03 · 05 / 06", title: "Other Extensions",     sourceStart: 380, clipDurationSeconds: 12 },
  { id: "scene-6-marketplace-popular", label: "Chapter 03 · 06 / 06", title: "@Popular Marketplace", sourceStart: 401, clipDurationSeconds: 12 },
];

const {
  Component,
  schema,
  calculateMetadata,
  fallbackDurationInFrames,
} = makeIntroChapter({
  slug: "workshop-intro-ch03",
  scenes: SCENES,
  sourceMp4: "assets/source-clips/workshop-intro-chapters-no-audio.mp4",
  cardDurationFrames: 24, // 0.8s — short title flashes; source clip carries the screen time
  // House bed shared with StackExplainer — masks micro-artefacts in the
  // single-stem VO so editors can polish without Claude chasing every click.
  musicBed: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
});

export const workshopIntroCh03Schema: typeof introChapterSchema = schema;
export type WorkshopIntroCh03Props = z.infer<typeof introChapterSchema>;
export const WorkshopIntroCh03 = Component;
export { calculateMetadata };
export const FALLBACK_DURATION_IN_FRAMES = fallbackDurationInFrames;
