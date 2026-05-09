#!/usr/bin/env python3
"""Detect downbeats in a music bed, slice N bars, loop M times.

Workflow:
  1. librosa.beat.beat_track  -> bpm + beat times
  2. Pick first detected beat as loop start (override with --start-beat)
  3. Slice [beat_0 .. beat_(bars*4)]  -> one loop iteration
  4. Concatenate `repeat` copies with equal-power crossfade at each seam
  5. Optional fade-in / fade-out on the head and tail
  6. Write WAV (lossless, 48kHz stereo) for use as a Remotion asset

Run with the video-use venv (set $VIDEO_USE_DIR to its checkout location;
default: sibling directory ../video-use):
  $VIDEO_USE_DIR/.venv/bin/python \\
    scripts/loop_bed.py \\
    --src bed.mp3 --bars 4 --repeat 4 --out bed_looped.wav

Notes:
  * librosa returns *beats*, not *downbeats*. For most pop/cinematic beds the
    first detected beat lands on the "1" -- but verify by ear on the first run.
    --start-beat lets you offset (e.g. --start-beat 1 to skip a pickup).
  * Beat detection accuracy on human-played material is ~10-30ms. Crossfade
    at the seam masks the jitter. Default crossfade = 15ms equal-power.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import librosa
import soundfile as sf


def equal_power_crossfade(a: np.ndarray, b: np.ndarray, fade_samples: int) -> np.ndarray:
    """Concat a + b with `fade_samples` of equal-power crossfade at the seam.

    a's tail and b's head must each be at least fade_samples long.
    """
    if fade_samples <= 0:
        return np.concatenate([a, b])
    n = fade_samples
    t = np.linspace(0.0, 1.0, n, dtype=a.dtype)
    fade_out = np.cos(0.5 * np.pi * t)
    fade_in = np.sin(0.5 * np.pi * t)
    seam = a[-n:] * fade_out[:, None] + b[:n] * fade_in[:, None]
    return np.concatenate([a[:-n], seam, b[n:]])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--bars", type=int, default=4)
    ap.add_argument("--beats-per-bar", type=int, default=4)
    ap.add_argument("--repeat", type=int, default=4,
                    help="how many times to play the loop back-to-back")
    ap.add_argument("--start-beat", type=int, default=0,
                    help="index into librosa's beat array (0 = first detected beat)")
    ap.add_argument("--start-time-s", type=float, default=None,
                    help="explicit loop start in seconds (overrides --start-beat)")
    ap.add_argument("--end-time-s", type=float, default=None,
                    help="explicit loop end in seconds (overrides --bars)")
    ap.add_argument("--snap-to-min-window-ms", type=float, default=0.0,
                    help="search +/- this window around the end candidate "
                         "for the lowest RMS amplitude and snap there")
    ap.add_argument("--snap-zero-crossing", action="store_true",
                    help="snap loop boundaries to nearest zero-crossing "
                         "(within +/- 10ms) for click-free seams")
    ap.add_argument("--crossfade-ms", type=float, default=15.0,
                    help="equal-power crossfade at each loop seam")
    ap.add_argument("--head-fade-ms", type=float, default=0.0,
                    help="fade-in on the very first sample")
    ap.add_argument("--tail-fade-ms", type=float, default=0.0,
                    help="fade-out on the very last sample")
    ap.add_argument("--out-sr", type=int, default=48000)
    ap.add_argument("--meta", type=Path, default=None,
                    help="path to write detection metadata JSON (default: out.with_suffix('.meta.json'))")
    args = ap.parse_args()

    if not args.src.exists():
        print(f"source not found: {args.src}", file=sys.stderr)
        return 2

    # Load mono for analysis (faster + beat detection wants mono)
    y_mono, sr = librosa.load(str(args.src), sr=None, mono=True)
    duration_s = len(y_mono) / sr
    print(f"src: {args.src.name}  sr={sr}  dur={duration_s:.3f}s")

    tempo, beat_frames = librosa.beat.beat_track(y=y_mono, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    print(f"detected bpm: {bpm:.2f}  beats: {len(beat_times)}")

    if args.start_time_s is not None:
        loop_start_s = float(args.start_time_s)
        print(f"loop start: {loop_start_s:.4f}s (explicit --start-time-s)")
    else:
        if args.start_beat >= len(beat_times):
            print(f"not enough beats for start: need {args.start_beat + 1}, "
                  f"have {len(beat_times)}", file=sys.stderr)
            return 3
        loop_start_s = float(beat_times[args.start_beat])
        print(f"loop start: {loop_start_s:.4f}s (beat[{args.start_beat}])")

    if args.end_time_s is not None:
        loop_end_s = float(args.end_time_s)
        print(f"loop end:   {loop_end_s:.4f}s (explicit --end-time-s)")
    else:
        beats_in_loop = args.bars * args.beats_per_bar
        end_beat_idx = args.start_beat + beats_in_loop
        if end_beat_idx >= len(beat_times):
            print(f"not enough beats: need {end_beat_idx + 1}, have {len(beat_times)}",
                  file=sys.stderr)
            return 3
        loop_end_s = float(beat_times[end_beat_idx])
        print(f"loop end:   {loop_end_s:.4f}s (beat[{end_beat_idx}], "
              f"{args.bars} bars @ {bpm:.2f} bpm)")

    # Amplitude-min snap on the END boundary
    if args.snap_to_min_window_ms > 0:
        win_s = args.snap_to_min_window_ms / 1000.0
        hop_short = int(0.005 * sr)  # 5ms hop, fine resolution
        rms = librosa.feature.rms(y=y_mono, hop_length=hop_short, frame_length=2048)[0]
        rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr,
                                           hop_length=hop_short)
        mask = (rms_times >= loop_end_s - win_s) & (rms_times <= loop_end_s + win_s)
        if mask.any():
            window_rms = rms[mask]
            window_t = rms_times[mask]
            min_t = float(window_t[int(np.argmin(window_rms))])
            print(f"  amplitude-snap: end {loop_end_s:.4f}s -> "
                  f"{min_t:.4f}s (RMS min in +/-{args.snap_to_min_window_ms}ms)")
            loop_end_s = min_t

    # Zero-crossing snap (click-free seam)
    if args.snap_zero_crossing:
        zc_window = sr // 100  # +/-10ms
        for label, ref_s in (("start", loop_start_s), ("end", loop_end_s)):
            ref_sample = int(round(ref_s * sr))
            lo = max(0, ref_sample - zc_window)
            hi = min(len(y_mono), ref_sample + zc_window)
            seg = y_mono[lo:hi]
            zc = np.where(np.diff(np.sign(seg)))[0]
            if len(zc):
                nearest_offset = zc[int(np.argmin(np.abs(zc - (ref_sample - lo))))]
                snapped_t = (lo + nearest_offset) / sr
                delta_ms = (snapped_t - ref_s) * 1000
                print(f"  zero-crossing snap: {label} {ref_s:.5f}s -> "
                      f"{snapped_t:.5f}s ({delta_ms:+.2f}ms)")
                if label == "start":
                    loop_start_s = snapped_t
                else:
                    loop_end_s = snapped_t

    loop_dur_s = loop_end_s - loop_start_s
    print(f"final loop window: [{loop_start_s:.5f}s -> {loop_end_s:.5f}s]  "
          f"= {loop_dur_s:.5f}s")

    # Reload as stereo (preserve original mix). librosa.load with mono=False
    # returns shape (channels, samples) -- transpose to (samples, channels).
    y_stereo, _ = librosa.load(str(args.src), sr=None, mono=False)
    if y_stereo.ndim == 1:
        y_stereo = np.stack([y_stereo, y_stereo])
    y_stereo = y_stereo.T

    # Resample to out_sr to match the Remotion timeline expectations
    if sr != args.out_sr:
        y_stereo_l = librosa.resample(y_stereo[:, 0], orig_sr=sr, target_sr=args.out_sr)
        y_stereo_r = librosa.resample(y_stereo[:, 1], orig_sr=sr, target_sr=args.out_sr)
        y_stereo = np.stack([y_stereo_l, y_stereo_r], axis=-1)
        sr = args.out_sr
        print(f"resampled to {sr} Hz")

    start_sample = int(round(loop_start_s * sr))
    end_sample = int(round(loop_end_s * sr))
    loop = y_stereo[start_sample:end_sample].astype(np.float32)
    print(f"loop slice: {loop.shape[0]} samples ({loop.shape[0] / sr:.4f}s)")

    fade_samples = int(round(args.crossfade_ms / 1000.0 * sr))
    if fade_samples > 0 and fade_samples >= loop.shape[0] // 4:
        print(f"warning: crossfade {args.crossfade_ms}ms is large relative to loop;"
              f" reducing to safe value")
        fade_samples = max(1, loop.shape[0] // 8)

    out = loop.copy()
    for _ in range(args.repeat - 1):
        out = equal_power_crossfade(out, loop, fade_samples)
    print(f"output shape: {out.shape}  ({out.shape[0] / sr:.4f}s, {args.repeat}x loop)")

    # Optional head / tail fades (equal-power)
    def apply_fade(buf: np.ndarray, fade_ms: float, side: str) -> np.ndarray:
        n = int(round(fade_ms / 1000.0 * sr))
        if n <= 0 or n > buf.shape[0]:
            return buf
        t = np.linspace(0.0, 1.0, n, dtype=buf.dtype)
        env = np.sin(0.5 * np.pi * t) if side == "in" else np.cos(0.5 * np.pi * t)
        sl = slice(0, n) if side == "in" else slice(buf.shape[0] - n, buf.shape[0])
        buf[sl] *= env[:, None]
        return buf

    out = apply_fade(out, args.head_fade_ms, "in")
    out = apply_fade(out, args.tail_fade_ms, "out")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(args.out), out, sr, subtype="PCM_24")
    print(f"wrote: {args.out}")

    meta_path = args.meta or args.out.with_suffix(".meta.json")
    meta = {
        "src": str(args.src),
        "bpm": round(bpm, 3),
        "bars_per_loop": args.bars,
        "beats_per_bar": args.beats_per_bar,
        "repeat": args.repeat,
        "loop_window_s": [round(loop_start_s, 4), round(loop_end_s, 4)],
        "loop_dur_s": round(loop_dur_s, 4),
        "output_dur_s": round(out.shape[0] / sr, 4),
        "out_sr": sr,
        "crossfade_ms": args.crossfade_ms,
        "first_beat_idx_used": args.start_beat,
        "first_20_beat_times_s": [round(float(t), 4) for t in beat_times[:20]],
    }
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"meta:  {meta_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
