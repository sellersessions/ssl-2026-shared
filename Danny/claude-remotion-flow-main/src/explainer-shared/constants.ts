// Timing, audio, and envelope constants shared across every Explainer
// composition. Pulled out of TreatmentExplainer.tsx (Session 9) so new
// compositions inherit the same pacing and audio spine without copy-paste.

export const FPS = 30;

// Transition duration. Must match TRANS() in components.tsx.
export const TRANS_FRAMES = 8;

// VO anchoring — keeps the voice from butting against scene start/end.
// Pre-pad lets the animation establish before VO lands; post-pad gives a tail
// so the voice doesn't hit the cross-fade.
export const VO_PRE_PAD_FRAMES = 15;   // ~0.5s
export const VO_POST_PAD_FRAMES = 20;  // ~0.67s

// Scene exit shrink/fade tail, consumed by <SceneExit>.
export const EXIT_FRAMES = 14;

// Chapter card default duration (12 fade in · 21 hold · 12 fade out).
export const CARD_DURATION_FRAMES = 45;

// Music bed levels — Session 11 Loom feedback round 2: drop another 5 dB.
// 10^(-5/20) ≈ 0.562 applied: 0.28→0.16, 0.10→0.06. Rounded to 0.15 /
// 0.05 in Session 12 so defaults land on the mixer's 0.05 scrub grid
// (differences of -0.56 dB / -1.58 dB, inaudible at these gains).
export const MUSIC_HIGH = 0.15;
export const MUSIC_DUCK = 0.05;
export const DUCK_RAMP = 15;            // frames to ramp into/out of a VO window
export const MUSIC_FADE_OUT_FRAMES = 75; // 2.5s tail — lets bed exit before boom

// Visual fade-to-black across the last N frames of the visual section.
export const FADE_TO_BLACK_FRAMES = 60; // 2.0s

// Pre/post-roll envelope — wraps the visual timeline so the intro whoosh can
// BUILD before the title lands and the outro boom's decay can finish in
// silence. Without this, SFX bookends either fire late (whoosh) or get cut
// off (boom).
export const PRE_ROLL_FRAMES = 30;   // 1.0s — trimmed from 2.0s (title was dragging)
export const POST_ROLL_FRAMES = 60;  // 2.0s — room for boom tail + silent black

// Outro boom fires a bit BEFORE visualEnd so its attack punches the moment
// the screen is still mid-fade, and the decay rides into post-roll silence.
export const SFX_OUTRO_LEAD_IN_FRAMES = 31;

// Default SFX bookends — Danny's Session 9 picks. Reused across every
// explainer for sonic consistency. Override per-composition if needed.
export const SFX_INTRO =
  "assets/sfx/library/transitions/pixabay-ksjsbwuil-whoosh-8-6b32a439bc.mp3";
export const SFX_OUTRO =
  "assets/sfx/library/impacts/pixabay-universfield-impact-cinematic-boom-be1e4daf3e.mp3";
export const SFX_INTRO_LEN_FRAMES = 114; // 3.79s — peak lands at PRE_ROLL_FRAMES
export const SFX_OUTRO_LEN_FRAMES = 63;  // 2.09s — zero-attack boom + decay

export const SFX_INTRO_VOLUME = 0.45;
export const SFX_OUTRO_VOLUME = 0.55;
