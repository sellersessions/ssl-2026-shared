import {
  CalculateMetadataFunction,
  interpolate,
  staticFile,
} from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import {
  CARD_DURATION_FRAMES,
  DUCK_RAMP,
  FPS,
  MUSIC_DUCK,
  MUSIC_FADE_OUT_FRAMES,
  MUSIC_HIGH,
  POST_ROLL_FRAMES,
  PRE_ROLL_FRAMES,
  SFX_INTRO_VOLUME,
  SFX_OUTRO_VOLUME,
  TRANS_FRAMES,
  VO_POST_PAD_FRAMES,
  VO_PRE_PAD_FRAMES,
} from "./constants";
import { computeTimeline, type ChapterCardSpec } from "./timeline";

// Mixer props surfaced to the Studio Props panel as live sliders. Defaults
// in DEFAULT_MIXER mirror the baseline constants so the render output is
// identical unless Danny drags a slider.
export type MixerProps = {
  musicHigh: number;
  musicDuck: number;
  sfxIntroVolume: number;
  sfxOutroVolume: number;
};

export const DEFAULT_MIXER: MixerProps = {
  musicHigh: MUSIC_HIGH,
  musicDuck: MUSIC_DUCK,
  sfxIntroVolume: SFX_INTRO_VOLUME,
  sfxOutroVolume: SFX_OUTRO_VOLUME,
};

export type ExplainerProps = {
  voiceover?: number[];
  voLengths?: number[];
  cardDurations?: number[];
  chapterDurationFrames?: number;
} & MixerProps;

export type ExplainerConfig = {
  sceneAudioFiles: readonly string[];
  sceneVoEnabled: readonly boolean[];
  fallbackSceneDurations: readonly number[];
  cardBefore: readonly (ChapterCardSpec | null)[];
  // Per-scene beat-snap targets in ABSOLUTE scene-start frames (relative to
  // the start of the visual timeline, i.e. excluding PRE_ROLL). null = no
  // snap for this scene. Prior-scene duration is adjusted so sceneStarts[i]
  // lands on the target; a safety floor prevents VO clipping.
  beatSnapFrames: readonly (number | null)[];
  logPrefix: string; // e.g. "StackExplainer" — used in console warnings
};

// Fallback comp length when no VO files exist on disk.
export function fallbackDurationInFrames(
  config: ExplainerConfig,
  cardDurationFrames: number = CARD_DURATION_FRAMES,
): number {
  const cardCount = config.cardBefore.filter(Boolean).length;
  return (
    PRE_ROLL_FRAMES +
    config.fallbackSceneDurations.reduce((s, d) => s + d, 0) +
    cardCount * cardDurationFrames -
    (config.fallbackSceneDurations.length + cardCount - 1) * TRANS_FRAMES +
    POST_ROLL_FRAMES
  );
}

// Module-level cache of measured VO durations, keyed by the scene-audio
// signature. calculateMetadata re-runs on every mixer prop change; without
// this cache, each drag tick would re-fetch 8 MP3 durations and block the
// Studio with a "calculating" toast.
const voLengthsCache = new Map<string, number[]>();

// VO-driven metadata factory. Reads each scene's MP3 duration, sizes scenes
// to max(VO+padding, animator fallback), then applies beat-snap by nudging
// prior-scene durations. Never touches the VO audio itself.
export function makeCalculateMetadata(
  config: ExplainerConfig,
  cardDurationFrames: number = CARD_DURATION_FRAMES,
): CalculateMetadataFunction<ExplainerProps> {
  return async ({ props }) => {
    const cacheKey = config.sceneAudioFiles.join("|");
    let voLengths = voLengthsCache.get(cacheKey);
    let allFallback = false;

    if (!voLengths) {
      const results = await Promise.allSettled(
        config.sceneAudioFiles.map(async (file) => {
          try {
            const src = staticFile(file);
            const secs = await getAudioDurationInSeconds(src);
            return secs * FPS;
          } catch {
            return null;
          }
        }),
      );

      voLengths = results.map((r, i) => {
        if (r.status === "fulfilled" && r.value !== null) {
          return Math.ceil(r.value);
        }
        console.warn(
          `[${config.logPrefix}] VO file missing or unreadable: ${config.sceneAudioFiles[i]}. ` +
            `Falling back to ${config.fallbackSceneDurations[i]} frames.`,
        );
        return 0;
      });

      allFallback = results.every(
        (r) => r.status === "rejected" || r.value === null,
      );

      if (!allFallback) voLengthsCache.set(cacheKey, voLengths);
    }
    if (allFallback) {
      console.warn(
        `[${config.logPrefix}] No VO files found — using hardcoded duration. ` +
          `Run the ElevenLabs generation script to populate the VO output dir.`,
      );
      return {
        durationInFrames: fallbackDurationInFrames(config, cardDurationFrames),
        props: {
          ...props,
          voiceover: [...config.fallbackSceneDurations],
          voLengths: [...config.fallbackSceneDurations],
        },
      };
    }

    const sceneDurations: number[] = voLengths.map((vo, i) => {
      const padded = vo + VO_PRE_PAD_FRAMES + VO_POST_PAD_FRAMES;
      return Math.ceil(
        Math.max(padded, config.fallbackSceneDurations[i] ?? 0),
      );
    });

    // Beat-snap pass — shift scene start by adjusting PRIOR scene's duration.
    for (let i = 1; i < sceneDurations.length; i++) {
      const target = config.beatSnapFrames[i];
      if (target == null) continue;
      const { sceneStarts } = computeTimeline(
        sceneDurations,
        config.cardBefore,
        cardDurationFrames,
      );
      const delta = target - sceneStarts[i];
      if (delta === 0) continue;
      const prior = i - 1;
      const voLenPrior = voLengths[prior] ?? 0;
      const minPrior = voLenPrior + VO_PRE_PAD_FRAMES + TRANS_FRAMES;
      sceneDurations[prior] = Math.max(
        minPrior,
        sceneDurations[prior] + delta,
      );
    }

    const { totalFrames: visualFrames } = computeTimeline(
      sceneDurations,
      config.cardBefore,
      cardDurationFrames,
    );
    const totalFrames = PRE_ROLL_FRAMES + visualFrames + POST_ROLL_FRAMES;

    return {
      durationInFrames: Math.ceil(totalFrames),
      props: { ...props, voiceover: sceneDurations, voLengths },
    };
  };
}

// ---------------------------------------------------------------------------
// Chapter-mode metadata (single-stem VO)
//
// Replaces the per-scene VO measurement above with a single chapter.mp3 +
// chapter.timings.json read. Scene durations come from the timings sidecar,
// produced by post-process.py from silencedetect on the raw stem.
// ---------------------------------------------------------------------------

export type ChapterTiming = {
  sceneId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
};

export type ChapterMetadataConfig = {
  chapterMp3: string;                             // staticFile-ready path
  chapterTimingsJson: string;                     // staticFile-ready path
  sceneIds: readonly string[];                    // canonical order
  clipDurationFrames: readonly number[];          // natural source-clip segment length per scene
  fallbackSceneDurations: readonly number[];      // floor when timings.json is missing
  cardBefore: readonly (ChapterCardSpec | null)[];
  beatSnapFrames: readonly (number | null)[];
  logPrefix: string;
  // Visuals lead the chapter audio by this many frames so FadeUp entrances
  // are crisp before VO speaks. Last scene's visual is extended by the same
  // amount so audio finishes on-screen, not into FadeToBlack.
  audioLeadFrames?: number;
};

const chapterTimingsCache = new Map<string, ChapterTiming[]>();
const chapterStemCache = new Map<string, number>();

export function chapterFallbackDurationInFrames(
  config: ChapterMetadataConfig,
  cardDurationFrames: number = CARD_DURATION_FRAMES,
): number {
  const cardCount = config.cardBefore.filter(Boolean).length;
  return (
    PRE_ROLL_FRAMES +
    config.fallbackSceneDurations.reduce((s, d) => s + d, 0) +
    cardCount * cardDurationFrames -
    (config.fallbackSceneDurations.length + cardCount - 1) * TRANS_FRAMES +
    POST_ROLL_FRAMES +
    (config.audioLeadFrames ?? 0)
  );
}

export function makeChapterCalculateMetadata(
  config: ChapterMetadataConfig,
  cardDurationFrames: number = CARD_DURATION_FRAMES,
): CalculateMetadataFunction<ExplainerProps> {
  return async ({ props }) => {
    const cacheKey = config.chapterTimingsJson;

    let timings = chapterTimingsCache.get(cacheKey);
    let stemFrames = chapterStemCache.get(cacheKey);

    if (!timings || !stemFrames) {
      try {
        const resp = await fetch(staticFile(config.chapterTimingsJson));
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        timings = (await resp.json()) as ChapterTiming[];
        const stemSecs = await getAudioDurationInSeconds(
          staticFile(config.chapterMp3),
        );
        stemFrames = Math.ceil(stemSecs * FPS);
        chapterTimingsCache.set(cacheKey, timings);
        chapterStemCache.set(cacheKey, stemFrames);
      } catch (err) {
        console.warn(
          `[${config.logPrefix}] chapter timings/stem unreadable (${
            (err as Error).message
          }). Falling back to animator durations.`,
        );
        return {
          durationInFrames: chapterFallbackDurationInFrames(
            config,
            cardDurationFrames,
          ),
          props: {
            ...props,
            voiceover: [...config.fallbackSceneDurations],
            voLengths: [...config.fallbackSceneDurations],
            chapterDurationFrames: config.fallbackSceneDurations.reduce(
              (s, d) => s + d,
              0,
            ),
          },
        };
      }
    }

    if (timings.length !== config.sceneIds.length) {
      console.warn(
        `[${config.logPrefix}] timings.json has ${timings.length} entries but config has ${config.sceneIds.length} scenes. Using fallback durations.`,
      );
    }

    // Build visual timeline locked 1:1 to the audio stem. Card durations
    // come from the actual silences in timings (lead silence + inter-scene
    // silences), scene durations from non-silent regions. The last scene
    // extends through any trailing silence so the fade-to-black covers it.
    const cardDurations: number[] = [];
    const sceneDurations: number[] = [];

    const audioLeadFrames = config.audioLeadFrames ?? 0;
    config.sceneIds.forEach((id, i) => {
      const timing = timings![i];
      if (!timing || timing.sceneId !== id) {
        console.warn(
          `[${config.logPrefix}] timings[${i}] sceneId mismatch (expected ${id}, got ${timing?.sceneId}). Using fallback.`,
        );
      }
      const startSec = timing?.startSec ?? 0;
      const endSec = timing?.endSec ?? 0;
      const prevEndSec = i === 0 ? 0 : timings![i - 1].endSec;
      // Card duration = silence between previous scene end (or 0) and this scene start.
      cardDurations.push(Math.max(0, Math.round((startSec - prevEndSec) * FPS)));
      // Scene duration = non-silent region; extend last scene to stem end + audioLeadFrames
      // so the (later-shifted) audio still finishes on-screen, not into FadeToBlack.
      const isLast = i === config.sceneIds.length - 1;
      const sceneEndSec = isLast ? stemFrames! / FPS : endSec;
      const sceneFrames =
        Math.max(1, Math.round((sceneEndSec - startSec) * FPS)) +
        (isLast ? audioLeadFrames : 0);
      // Clip-fit guard: clamp scene visual to natural source-clip length,
      // last frame holds for any remainder. Audio still plays through.
      const clipMax = config.clipDurationFrames[i];
      if (clipMax > 0 && sceneFrames > clipMax) {
        console.warn(
          `[${config.logPrefix}] scene ${id}: visual ${sceneFrames}f exceeds clip length ${clipMax}f. Source clip will hold last frame.`,
        );
      }
      sceneDurations.push(sceneFrames);
    });

    // visualFrames = stem total + audioLeadFrames (last scene extended by lead).
    const visualFrames = stemFrames! + audioLeadFrames;
    const totalFrames = PRE_ROLL_FRAMES + visualFrames + POST_ROLL_FRAMES;

    return {
      durationInFrames: Math.ceil(totalFrames),
      props: {
        ...props,
        voiceover: sceneDurations,
        voLengths: sceneDurations,
        cardDurations,
        chapterDurationFrames: stemFrames,
      },
    };
  };
}

// Music-bed volume callback factory. The returned function is a Remotion
// volume-per-frame callback: fades in over the pre-roll, ducks to MUSIC_DUCK
// during each VO window, fades to zero by visualEnd so the outro boom can
// stand alone.
export function buildMusicVolume(args: {
  visualEnd: number;
  voWindows: readonly { start: number; end: number }[];
  musicHigh?: number;
  musicDuck?: number;
}): (frame: number) => number {
  const {
    visualEnd,
    voWindows,
    musicHigh = MUSIC_HIGH,
    musicDuck = MUSIC_DUCK,
  } = args;
  return (frame: number) => {
    const fadeIn = interpolate(frame, [0, PRE_ROLL_FRAMES], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fadeOut = interpolate(
      frame,
      [visualEnd - MUSIC_FADE_OUT_FRAMES, visualEnd],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    let vol = musicHigh;
    for (const w of voWindows) {
      const duckVol = interpolate(
        frame,
        [w.start, w.start + DUCK_RAMP, w.end - DUCK_RAMP, w.end],
        [musicHigh, musicDuck, musicDuck, musicHigh],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
      vol = Math.min(vol, duckVol);
    }
    return vol * fadeIn * fadeOut;
  };
}
