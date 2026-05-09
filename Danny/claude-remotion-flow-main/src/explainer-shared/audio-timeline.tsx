import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

import {
  SFX_INTRO,
  SFX_INTRO_LEN_FRAMES,
  SFX_OUTRO,
  SFX_OUTRO_LEN_FRAMES,
} from "./constants";

// Single source of truth for the audio envelope around any composition.
//
// "sequential" — whoosh plays alone, voice plays alone, boom plays alone.
//                Use for cuts where the voice already carries its own pacing
//                (screen recordings, talking-head, podcast clips).
//
// "envelope"  — whoosh and boom overlap the visual section; pre/post roll
//                wraps the visuals so SFX can build/decay outside the content.
//                Use for animated explainers where the title needs to fade in
//                under the whoosh peak.

export type TimelineMode =
  | { kind: "sequential" }
  | {
      kind: "envelope";
      preRoll: number;
      postRoll: number;
      outroLeadIn: number;
    }
  | {
      kind: "carded";
      introFrames: number;
      outroFrames: number;
      whooshLeadIn?: number;
      boomLeadIn?: number;
    };

export type TimelineLayout = {
  visualStart: number;
  visualEnd: number;
  totalFrames: number;
  whooshFrom: number;
  boomFrom: number;
  introStart: number;
  introEnd: number;
  outroStart: number;
  outroEnd: number;
};

export const computeAudioTimeline = (
  visualFrames: number,
  mode: TimelineMode,
): TimelineLayout => {
  if (mode.kind === "sequential") {
    const visualStart = SFX_INTRO_LEN_FRAMES;
    const visualEnd = visualStart + visualFrames;
    const boomFrom = visualEnd;
    const totalFrames = boomFrom + SFX_OUTRO_LEN_FRAMES;
    return {
      visualStart,
      visualEnd,
      totalFrames,
      whooshFrom: 0,
      boomFrom,
      introStart: 0,
      introEnd: visualStart,
      outroStart: visualEnd,
      outroEnd: totalFrames,
    };
  }
  if (mode.kind === "envelope") {
    const visualStart = mode.preRoll;
    const visualEnd = visualStart + visualFrames;
    const totalFrames = visualEnd + mode.postRoll;
    return {
      visualStart,
      visualEnd,
      totalFrames,
      whooshFrom: 0,
      boomFrom: Math.max(0, visualEnd - mode.outroLeadIn),
      introStart: 0,
      introEnd: visualStart,
      outroStart: visualEnd,
      outroEnd: totalFrames,
    };
  }
  // carded — intro card holds the whoosh, voice plays in the middle,
  // outro card holds the boom.
  const introStart = 0;
  const introEnd = mode.introFrames;
  const visualStart = introEnd;
  const visualEnd = visualStart + visualFrames;
  const outroStart = visualEnd;
  const outroEnd = outroStart + mode.outroFrames;
  return {
    visualStart,
    visualEnd,
    totalFrames: outroEnd,
    whooshFrom: introStart + (mode.whooshLeadIn ?? 0),
    boomFrom: outroStart + (mode.boomLeadIn ?? 0),
    introStart,
    introEnd,
    outroStart,
    outroEnd,
  };
};

export type TimelineAudioProps = {
  layout: TimelineLayout;
  bed?: { src: string; volume: number };
  sfxIntroVolume: number;
  sfxOutroVolume: number;
};

export const TimelineAudio: React.FC<TimelineAudioProps> = ({
  layout,
  bed,
  sfxIntroVolume,
  sfxOutroVolume,
}) => (
  <>
    {bed ? (
      <Audio
        src={staticFile(bed.src)}
        volume={bed.volume}
        endAt={layout.totalFrames}
      />
    ) : null}
    <Sequence
      from={layout.whooshFrom}
      durationInFrames={SFX_INTRO_LEN_FRAMES}
      name="sfx-intro"
    >
      <Audio src={staticFile(SFX_INTRO)} volume={sfxIntroVolume} />
    </Sequence>
    <Sequence
      from={layout.boomFrom}
      durationInFrames={SFX_OUTRO_LEN_FRAMES}
      name="sfx-outro"
    >
      <Audio src={staticFile(SFX_OUTRO)} volume={sfxOutroVolume} />
    </Sequence>
  </>
);
