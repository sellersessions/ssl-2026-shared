// Curated music beds for Remotion compositions.
// HOUSE_DEFAULT is the long-form (~20:25) drop-in bed — pre-looped with
// equal-power crossfades so any composition shorter than 20 min can use it
// without worrying about loop seams or trim points. Render via
// Claude-Video-Editing-Flow/scripts/loop_bed.py + tools/loop-cutter for new beds.

export const BEDS = {
  /** ~20:25 cinematic-ambient bed. 64x loop of a 19.21s 4-bar phrase, 61ms crossfades, no tail-fade. */
  HOUSE_DEFAULT:
    "assets/music/ssl-live-beds/_loops/penguinmusic-emotions-cinematic-ambient-bed20min.wav",
  /** Original short-form source MP3s — kept as references; new compositions should prefer HOUSE_DEFAULT. */
  WINGS_SOURCE: "assets/music/ssl-live-beds/penguinmusic-wings-196958.mp3",
  CHERRY_ORCHARD_SOURCE:
    "assets/music/ssl-live-beds/onaldin_music-emotional-modern-piano-inspiration-cherry-orchard-346399.mp3",
  THROUGH_THE_CLOUDS_SOURCE:
    "assets/music/ssl-live-beds/penguinmusic-through-the-clouds-calming-cinematic-ambient-200392.mp3",
} as const;

export type BedKey = keyof typeof BEDS;
