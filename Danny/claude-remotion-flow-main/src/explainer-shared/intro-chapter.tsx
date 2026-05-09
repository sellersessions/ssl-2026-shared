import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  staticFile,
} from "remotion";
import { z } from "zod";

import {
  FPS,
  PRE_ROLL_FRAMES,
  POST_ROLL_FRAMES,
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_OUTRO,
  SFX_OUTRO_LEAD_IN_FRAMES,
  SFX_OUTRO_LEN_FRAMES,
} from "./constants";
import {
  chapterFallbackDurationInFrames,
  makeChapterCalculateMetadata,
  type ChapterMetadataConfig,
  type ExplainerProps,
} from "./metadata";
import { type ChapterCardSpec } from "./timeline";
import {
  ChapterCard,
  FadeToBlack,
  PosterFrame,
  SceneBG,
  SceneExit,
} from "./components";

// ---------------------------------------------------------------------------
// Intro Chapter factory
//
// Wraps a series of source-mp4 slices (OffthreadVideo) in the same audio +
// transition + mixer spine the explainer compositions use. Per-comp config is
// slug + scenes + sourceMp4 — everything else is inherited:
//
//   - Cross-fades between scenes/cards
//   - Chapter cards (auto from scene metadata)
//   - SFX intro/outro bookends
//   - Pre/post-roll envelope, fade-to-black
//   - Mixer props (musicHigh/musicDuck/sfxIntroVolume/sfxOutroVolume)
//   - Single-stem VO playback (one <Audio> over the whole timeline)
//   - Music bed wired-on, default off (musicHigh: 0)
//   - Clip-fit guard (warns when VO exceeds natural source-segment length)
// ---------------------------------------------------------------------------

export type SceneVisualProps = {
  durationInFrames: number;
  sceneId: string;
};

export type IntroChapterScene = {
  id: string;                  // matches voice config scene id
  title: string;               // chapter-card display title
  label: string;               // chapter-card eyebrow label
  sourceStart: number;         // seconds into the source mp4 (ignored when `visual` set)
  clipDurationSeconds: number; // natural length of the source-clip segment (clip-fit guard)
  visual?: React.ComponentType<SceneVisualProps>; // override: replaces source-mp4 clip for this scene
};

export type IntroChapterFactoryConfig = {
  slug: string;                // canonical slug, e.g. "workshop-intro-ch03"
  scenes: readonly IntroChapterScene[];
  sourceMp4?: string;          // staticFile path — required only if any scene lacks `visual`
  // Chapter card before each scene. Default: true. Pass false / array of
  // booleans|specs|null for fine control.
  cardBefore?: boolean | readonly (boolean | ChapterCardSpec | null)[];
  fallbackSceneSeconds?: readonly number[];
  cardDurationFrames?: number;
  voVolume?: number;            // single-stem VO playback gain (default 0.65)
  musicBed?: string;            // optional staticFile path to a music bed
  // Static branded title card behind everything. Frame 0 of the rendered mp4
  // becomes this — what GitHub / web embeds use as the thumbnail.
  posterFrame?: { eyebrow: string; title: React.ReactNode };
  // Visuals lead the chapter audio by this many frames so FadeUp entrances
  // settle before VO speaks. Last scene is extended by the same amount.
  audioLeadFrames?: number;
};

const SourceVideoScene: React.FC<{
  sourceMp4: string;
  startSeconds: number;
  durationFrames: number;
  clipDurationFrames: number;
}> = ({ sourceMp4, startSeconds, durationFrames, clipDurationFrames }) => {
  const startFrame = Math.round(startSeconds * FPS);
  // Clamp endAt to the natural clip end so we never seek past the segment
  // (which would either repeat or show wrong footage). If scene > clip,
  // the OffthreadVideo holds on its last frame for the remainder.
  const playableFrames = Math.min(durationFrames, clipDurationFrames);
  const endFrame = startFrame + playableFrames;
  return (
    <AbsoluteFill>
      <SceneBG />
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(sourceMp4)}
          startFrom={startFrame}
          endAt={endFrame}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function buildCardArray(
  scenes: readonly IntroChapterScene[],
  cardBefore: IntroChapterFactoryConfig["cardBefore"],
): Array<ChapterCardSpec | null> {
  if (cardBefore === false) return scenes.map(() => null);

  if (Array.isArray(cardBefore)) {
    return scenes.map((scene, i) => {
      const entry = cardBefore[i];
      if (entry === false || entry === null) return null;
      if (entry === true || entry === undefined) {
        return { label: scene.label, title: scene.title };
      }
      return entry as ChapterCardSpec;
    });
  }

  return scenes.map((scene) => ({ label: scene.label, title: scene.title }));
}

export const introChapterSchema = z.object({
  voiceover: z.array(z.number()).optional(),
  voLengths: z.array(z.number()).optional(),
  cardDurations: z.array(z.number()).optional(),
  chapterDurationFrames: z.number().optional(),
  musicHigh: z.number().min(0).max(1).multipleOf(0.05),
  musicDuck: z.number().min(0).max(1).multipleOf(0.05),
  sfxIntroVolume: z.number().min(0).max(1).multipleOf(0.05),
  sfxOutroVolume: z.number().min(0).max(1).multipleOf(0.05),
});

export type IntroChapterFactoryResult = {
  Component: React.FC<ExplainerProps>;
  schema: typeof introChapterSchema;
  calculateMetadata: CalculateMetadataFunction<ExplainerProps>;
  fallbackDurationInFrames: number;
};

export function makeIntroChapter(
  factoryConfig: IntroChapterFactoryConfig,
): IntroChapterFactoryResult {
  const { slug, scenes, sourceMp4, musicBed, posterFrame } = factoryConfig;
  const audioLeadFrames = factoryConfig.audioLeadFrames ?? 0;
  const voDir = `assets/voice/generated/${slug}`;
  const chapterMp3 = `${voDir}/chapter.mp3`;
  const timingsJson = `${voDir}/chapter.timings.json`;
  const cardBefore = buildCardArray(scenes, factoryConfig.cardBefore);
  const voVolume = factoryConfig.voVolume ?? 0.65;
  const cardDurationFrames = factoryConfig.cardDurationFrames;

  // Animator's intent floor — defaults to 4s/scene when not provided.
  const fallbackSceneSeconds =
    factoryConfig.fallbackSceneSeconds ?? scenes.map(() => 4);
  const fallbackSceneDurations = fallbackSceneSeconds.map((s) =>
    Math.ceil(s * FPS),
  );

  const metadataConfig: ChapterMetadataConfig = {
    chapterMp3,
    chapterTimingsJson: timingsJson,
    sceneIds: scenes.map((s) => s.id),
    clipDurationFrames: scenes.map((s) =>
      Math.ceil(s.clipDurationSeconds * FPS),
    ),
    fallbackSceneDurations,
    cardBefore,
    beatSnapFrames: scenes.map(() => null),
    logPrefix: slug,
    audioLeadFrames,
  };

  const fallback = chapterFallbackDurationInFrames(metadataConfig, cardDurationFrames);
  const calculateMetadata = makeChapterCalculateMetadata(
    metadataConfig,
    cardDurationFrames,
  );

  const Component: React.FC<ExplainerProps> = ({
    voiceover,
    cardDurations,
    chapterDurationFrames,
    musicHigh,
    musicDuck,
    sfxIntroVolume,
    sfxOutroVolume,
  }) => {
    void musicDuck;

    const sceneDurations: number[] =
      voiceover && voiceover.length === scenes.length
        ? voiceover
        : [...fallbackSceneDurations];

    // Card durations come from timings.json (silence gaps). If metadata
    // hasn't run yet (initial mount), fall back to a fixed card duration.
    const fixedCardFrames =
      cardDurationFrames ?? Math.round(0.8 * FPS);
    const cardFramesArray: number[] =
      cardDurations && cardDurations.length === scenes.length
        ? cardDurations
        : scenes.map(() => fixedCardFrames);

    // Build absolute frame placements for each card+scene pair.
    // Layout: card[0] → scene[0] → card[1] → scene[1] → ... → card[N-1] → scene[N-1]
    // visualFrames = sum(cards + scenes) = stemFrames (locked to audio).
    type Item =
      | { kind: "card"; from: number; duration: number; sceneIndex: number }
      | { kind: "scene"; from: number; duration: number; sceneIndex: number };
    const items: Item[] = [];
    let cursor = 0;
    scenes.forEach((_, i) => {
      const cardLen = cardFramesArray[i] ?? 0;
      if (cardLen > 0 && cardBefore[i] !== null) {
        items.push({ kind: "card", from: cursor, duration: cardLen, sceneIndex: i });
      }
      cursor += cardLen;
      const sceneLen = sceneDurations[i];
      items.push({ kind: "scene", from: cursor, duration: sceneLen, sceneIndex: i });
      cursor += sceneLen;
    });

    const visualFrames = cursor;
    const visualStart = PRE_ROLL_FRAMES;
    const visualEnd = PRE_ROLL_FRAMES + visualFrames;
    const stemFrames = chapterDurationFrames ?? visualFrames;

    return (
      <>
        {/* Persistent gradient behind everything so inter-scene gaps don't
            expose the layer below (would otherwise flash the poster title). */}
        <SceneBG />

        {/* Static poster — only during pre-roll. Frame 0 of the rendered mp4
            becomes this (the GitHub / web-embed thumbnail). Disappears at
            PRE_ROLL_FRAMES; from then on scenes own the foreground, with the
            persistent SceneBG above filling any inter-scene gap. */}
        {posterFrame && (
          <Sequence durationInFrames={PRE_ROLL_FRAMES} name="poster">
            <PosterFrame eyebrow={posterFrame.eyebrow} title={posterFrame.title} />
          </Sequence>
        )}

        {/* Intro whoosh — peaks as the first card/scene fades in. */}
        <Sequence durationInFrames={SFX_INTRO_LEN_FRAMES} name="SFX-intro">
          <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
        </Sequence>

        {/* Outro boom — attack lands while the screen is still mid-fade,
            decay rides into post-roll silence. */}
        <Sequence
          from={Math.max(0, visualEnd - SFX_OUTRO_LEAD_IN_FRAMES)}
          durationInFrames={SFX_OUTRO_LEN_FRAMES}
          name="SFX-outro"
        >
          <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
        </Sequence>

        {/* Single-stem voiceover — one consistent room, one limiter pass.
            Shifted later by audioLeadFrames so visual FadeUp entrances settle
            before VO speaks; last scene was extended in metadata to match. */}
        <Sequence
          from={visualStart + audioLeadFrames}
          durationInFrames={stemFrames}
          name="VO-chapter"
        >
          <Audio src={staticFile(chapterMp3)} volume={voVolume} />
        </Sequence>

        {/* Music bed — wired on, default off (musicHigh: 0). */}
        {musicBed && musicHigh > 0 && (
          <Sequence
            from={0}
            durationInFrames={visualEnd + POST_ROLL_FRAMES}
            name="music-bed"
          >
            <Audio src={staticFile(musicBed)} volume={musicHigh} />
          </Sequence>
        )}

        {/* Visual timeline — absolute-positioned items, no transition overlap.
            Cards/scenes have built-in fade-in/out; alignment is locked to
            the audio stem 1:1. */}
        {items.map((item, i) => {
          const absFrom = visualStart + item.from;
          if (item.kind === "scene") {
            const scene = scenes[item.sceneIndex];
            const clipFrames = Math.ceil(scene.clipDurationSeconds * FPS);
            const Visual = scene.visual;
            return (
              <Sequence
                key={`scene-${scene.id}-${i}`}
                from={absFrom}
                durationInFrames={item.duration}
                name={`scene-${scene.id}`}
              >
                <SceneExit durationInFrames={item.duration}>
                  {Visual ? (
                    <AbsoluteFill>
                      <SceneBG />
                      <Visual durationInFrames={item.duration} sceneId={scene.id} />
                    </AbsoluteFill>
                  ) : sourceMp4 ? (
                    <SourceVideoScene
                      sourceMp4={sourceMp4}
                      startSeconds={scene.sourceStart}
                      durationFrames={item.duration}
                      clipDurationFrames={clipFrames}
                    />
                  ) : null}
                </SceneExit>
              </Sequence>
            );
          }
          const card = cardBefore[item.sceneIndex];
          if (!card) return null;
          return (
            <Sequence
              key={`card-${item.sceneIndex}-${i}`}
              from={absFrom}
              durationInFrames={item.duration}
              name={`card-${card.label}`}
            >
              <ChapterCard card={card} durationInFrames={item.duration} />
            </Sequence>
          );
        })}

        <FadeToBlack visualEnd={visualEnd} />
      </>
    );
  };

  return {
    Component,
    schema: introChapterSchema,
    calculateMetadata,
    fallbackDurationInFrames: fallback,
  };
}
