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

import { FadeToBlack, PosterFrame } from "./explainer-shared/components";
import {
  FPS,
  MUSIC_DUCK,
  MUSIC_HIGH,
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_INTRO_VOLUME,
  SFX_OUTRO,
  SFX_OUTRO_LEAD_IN_FRAMES,
  SFX_OUTRO_LEN_FRAMES,
  SFX_OUTRO_VOLUME,
} from "./explainer-shared/constants";
import { BEDS } from "./explainer-shared/audio-beds";

const INTRO_FRAMES = 90;
const OUTRO_FRAMES = 60;
const DUCK_RAMP = 15; // frames to fade between bed-high and bed-duck

export const loomWalkthroughSchema = z.object({
  sourceMp4: z.string(),
  masteredAudio: z.string().optional(),
  eyebrow: z.string(),
  title: z.string(),
  durationSeconds: z.number(),
  musicHigh: z.number(),
  musicDuck: z.number(),
  sfxIntroVolume: z.number(),
  sfxOutroVolume: z.number(),
});

export type LoomWalkthroughProps = z.infer<typeof loomWalkthroughSchema>;

const MUSIC_BED = BEDS.HOUSE_DEFAULT;

export const LoomWalkthrough: React.FC<LoomWalkthroughProps> = ({
  sourceMp4,
  masteredAudio,
  eyebrow,
  title,
  durationSeconds,
  musicHigh,
  musicDuck,
  sfxIntroVolume,
  sfxOutroVolume,
}) => {
  const sourceFrames = Math.round(durationSeconds * FPS);
  const totalFrames = INTRO_FRAMES + sourceFrames + OUTRO_FRAMES;
  const duckIn = INTRO_FRAMES;
  const duckOut = INTRO_FRAMES + sourceFrames;

  // Per-frame bed gain: high during intro/outro cards, ducked under the
  // walkthrough body. Linear ramps over DUCK_RAMP frames either side.
  const bedVolume = (f: number) => {
    if (f < duckIn - DUCK_RAMP) return musicHigh;
    if (f < duckIn) {
      const t = (f - (duckIn - DUCK_RAMP)) / DUCK_RAMP;
      return musicHigh + (musicDuck - musicHigh) * t;
    }
    if (f < duckOut) return musicDuck;
    if (f < duckOut + DUCK_RAMP) {
      const t = (f - duckOut) / DUCK_RAMP;
      return musicDuck + (musicHigh - musicDuck) * t;
    }
    return musicHigh;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Music bed — runs the whole timeline, ducks under the walkthrough body. */}
      <Sequence from={0} durationInFrames={totalFrames} name="music-bed">
        <Audio src={staticFile(MUSIC_BED)} volume={bedVolume} />
      </Sequence>

      {/* Intro whoosh — peaks as the title card lands. */}
      <Sequence from={0} durationInFrames={SFX_INTRO_LEN_FRAMES} name="SFX-intro">
        <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
      </Sequence>

      {/* Visuals: intro card → walkthrough video → outro card. */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES} name="intro-card">
        <PosterFrame eyebrow={eyebrow} title={title} />
      </Sequence>
      <Sequence from={INTRO_FRAMES} durationInFrames={sourceFrames} name="walkthrough">
        <OffthreadVideo src={staticFile(sourceMp4)} muted={Boolean(masteredAudio)} />
      </Sequence>
      {masteredAudio ? (
        <Sequence
          from={INTRO_FRAMES}
          durationInFrames={sourceFrames}
          name="mastered-audio"
        >
          <Audio src={staticFile(masteredAudio)} />
        </Sequence>
      ) : null}
      <Sequence
        from={INTRO_FRAMES + sourceFrames}
        durationInFrames={OUTRO_FRAMES}
        name="outro-card"
      >
        <PosterFrame eyebrow="next" title="More in the README" />
      </Sequence>

      {/* Outro boom — attack lands mid-fade, decay rides into black. */}
      <Sequence
        from={Math.max(0, totalFrames - SFX_OUTRO_LEAD_IN_FRAMES)}
        durationInFrames={SFX_OUTRO_LEN_FRAMES}
        name="SFX-outro"
      >
        <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
      </Sequence>

      <FadeToBlack visualEnd={totalFrames} />
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<LoomWalkthroughProps> = ({
  props,
}) => {
  const sourceFrames = Math.round(props.durationSeconds * FPS);
  return {
    durationInFrames: INTRO_FRAMES + sourceFrames + OUTRO_FRAMES,
    fps: FPS,
    width: 1920,
    height: 1080,
  };
};

export const FALLBACK_DURATION_IN_FRAMES = INTRO_FRAMES + OUTRO_FRAMES + FPS * 60;

// Loom-only bed levels. History: original 0.15/0.05 sat too forward against
// unmastered voice; cut to 0.075/0.025; cut again to 0.00375/0.00125 for
// the BandLab voice-only export pass. Voice now mastered to ~-2 dBFS peak
// (~18 dB louder than raw), bed needs to sit behind that. Starting at the
// post-50%-cut values (0.075/0.025) for ear-test against mastered voice.
// Workshop explainers untouched (own overrides).
export const LOOM_DEFAULT_MIX = {
  musicHigh: 0.24,
  musicDuck: 0.04,
  sfxIntroVolume: SFX_INTRO_VOLUME,
  sfxOutroVolume: SFX_OUTRO_VOLUME,
} as const;
