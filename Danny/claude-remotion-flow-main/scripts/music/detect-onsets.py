#!/usr/bin/env python3
"""
Onset / phrase-marker detector for ambient music beds.

Runs librosa's spectral-flux onset detector over an MP3/WAV and emits a
ranked list of onset timestamps (seconds) + converted frame numbers at
the composition's FPS. Output is JSON so `TreatmentExplainer.tsx` can
snap scene starts to the nearest onset in a follow-up pass.

Usage:
  scripts/voice/.venv/bin/python scripts/music/detect-onsets.py \
    public/assets/music/ssl-live-beds/penguinmusic-through-the-clouds-calming-cinematic-ambient-200392.mp3 \
    --fps 30 --top 12 --min-gap 1.0 --comp-seconds 42.17

Why these knobs:
  --top:         keep only the N strongest onsets (ambient tracks have
                 dozens of weak ones; we want phrase-level markers)
  --min-gap:     reject onsets closer than N seconds (avoids clustering
                 around a single swell)
  --comp-seconds: drop anything past the composition length
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import librosa  # type: ignore
import numpy as np  # type: ignore


def detect(
    audio_path: Path,
    *,
    fps: int,
    top: int,
    min_gap: float,
    comp_seconds: float | None,
) -> dict:
    y, sr = librosa.load(str(audio_path), sr=None, mono=True)
    duration = float(len(y) / sr)

    # Onset strength envelope → peak picking on the envelope.
    # backtrack=True snaps each onset to the preceding local-minimum so
    # the timestamp sits at the ATTACK, not the peak — feels more like
    # "where the phrase begins" when scene cuts land on it.
    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr, backtrack=True, units="frames"
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)

    # Rank by onset strength at each detected frame.
    env = librosa.onset.onset_strength(y=y, sr=sr)
    strengths = env[onset_frames] if len(onset_frames) else np.array([])

    # Pair + sort strongest-first.
    pairs = sorted(
        zip(onset_times.tolist(), strengths.tolist()),
        key=lambda p: p[1],
        reverse=True,
    )

    # Greedy min-gap filter on the ranked list: accept strongest,
    # skip any later candidate within min_gap of an accepted one.
    kept: list[tuple[float, float]] = []
    for t, s in pairs:
        if comp_seconds is not None and t >= comp_seconds:
            continue
        if all(abs(t - kt) >= min_gap for kt, _ in kept):
            kept.append((t, s))
        if len(kept) >= top:
            break

    # Re-sort kept by time for human consumption.
    kept.sort(key=lambda p: p[0])

    markers = [
        {
            "time_s": round(t, 3),
            "frame": int(round(t * fps)),
            "strength": round(s, 3),
        }
        for t, s in kept
    ]

    return {
        "source": str(audio_path),
        "duration_s": round(duration, 3),
        "fps": fps,
        "comp_seconds": comp_seconds,
        "total_onsets_detected": int(len(onset_frames)),
        "returned": len(markers),
        "min_gap_s": min_gap,
        "markers": markers,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", type=Path)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--top", type=int, default=12)
    ap.add_argument("--min-gap", type=float, default=1.0)
    ap.add_argument("--comp-seconds", type=float, default=None)
    args = ap.parse_args()

    if not args.audio.exists():
        print(f"missing: {args.audio}", file=sys.stderr)
        return 2

    result = detect(
        args.audio,
        fps=args.fps,
        top=args.top,
        min_gap=args.min_gap,
        comp_seconds=args.comp_seconds,
    )
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
