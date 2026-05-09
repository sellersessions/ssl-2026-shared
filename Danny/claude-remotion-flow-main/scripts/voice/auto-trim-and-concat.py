#!/usr/bin/env python3
"""auto-trim-and-concat.py - hands-off VO tightener for per-scene outputs.

Trims each scene's head/tail silence to fixed values, concats with a uniform
inter-scene gap. Goal: DAW-tight listen-through without manual nudging.

Defaults (matching ElevenLabs blog spec for long-form):
  head_keep_ms = 50    (preserve a tiny breath at scene start)
  tail_keep_ms = 50    (preserve a tiny breath at scene end)
  intra_gap_ms = 200   (between consecutive scenes)

Usage:
  auto-trim-and-concat.py --vo-dir <dir> --output <name.mp3> \
    --scenes scene-1 scene-2 scene-3 ... [--gap-ms 200]
"""
import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def detect_silence(src: Path, noise_db: float = -35.0, min_dur: float = 0.05) -> tuple[float, float]:
    """Return (first_non_silent_sec, last_non_silent_sec) by parsing silencedetect."""
    proc = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-nostats", "-i", str(src),
            "-af", f"silencedetect=noise={noise_db}dB:d={min_dur}",
            "-f", "null", "-",
        ],
        capture_output=True, text=True,
    )
    log = proc.stderr

    duration = 0.0
    for line in log.splitlines():
        m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", line)
        if m:
            h, mn, s = m.groups()
            duration = int(h) * 3600 + int(mn) * 60 + float(s)
            break

    silence_ends = [float(m.group(1)) for m in re.finditer(r"silence_end:\s*([\d.]+)", log)]
    silence_starts = [float(m.group(1)) for m in re.finditer(r"silence_start:\s*([\d.]+)", log)]

    head_end = silence_ends[0] if silence_ends and silence_starts and silence_starts[0] < 0.1 else 0.0
    tail_start = silence_starts[-1] if silence_starts and (not silence_ends or silence_starts[-1] > silence_ends[-1]) else duration

    return head_end, tail_start, duration


def trim_scene(src: Path, dst: Path, head_keep_ms: int, tail_keep_ms: int) -> tuple[float, float]:
    """Trim src so output has at most head_keep_ms head-silence and tail_keep_ms tail-silence."""
    head_end, tail_start, duration = detect_silence(src)

    cut_in = max(0.0, head_end - head_keep_ms / 1000)
    cut_out = min(duration, tail_start + tail_keep_ms / 1000)

    if cut_out <= cut_in:
        cut_in, cut_out = 0.0, duration

    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{cut_in:.3f}", "-to", f"{cut_out:.3f}",
            "-i", str(src),
            "-c:a", "libmp3lame", "-q:a", "2",
            str(dst),
        ],
        check=True,
    )

    return duration, cut_out - cut_in


def make_silence(path: Path, duration_ms: int) -> None:
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", "anullsrc=channel_layout=mono:sample_rate=44100",
            "-t", f"{duration_ms / 1000:.3f}",
            "-c:a", "libmp3lame", "-q:a", "2",
            str(path),
        ],
        check=True,
    )


def concat(parts: list[Path], output: Path) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        list_path = Path(f.name)
        for p in parts:
            f.write(f"file '{p.resolve()}'\n")
    try:
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "concat", "-safe", "0", "-i", str(list_path),
                "-c:a", "libmp3lame", "-q:a", "2",
                str(output),
            ],
            check=True,
        )
    finally:
        list_path.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vo-dir", required=True, help="Directory containing scene-*.mp3 files")
    parser.add_argument("--output", required=True, help="Output filename (written into vo-dir)")
    parser.add_argument("--scenes", nargs="+", required=True, help="Scene slugs in order (no .mp3)")
    parser.add_argument("--gap-ms", type=int, default=200, help="Inter-scene silence gap in ms (default 200)")
    parser.add_argument("--head-ms", type=int, default=50, help="Head silence to keep per scene (default 50)")
    parser.add_argument("--tail-ms", type=int, default=50, help="Tail silence to keep per scene (default 50)")
    args = parser.parse_args()

    vo_dir = Path(args.vo_dir).resolve()
    if not vo_dir.is_dir():
        print(f"error: vo-dir not found: {vo_dir}", file=sys.stderr)
        return 1

    workdir = Path(tempfile.mkdtemp(prefix="vo-trim-"))
    try:
        gap_path = workdir / "gap.mp3"
        make_silence(gap_path, args.gap_ms)

        trimmed: list[Path] = []
        print(f"Trimming {len(args.scenes)} scenes — head/tail keep: {args.head_ms}ms/{args.tail_ms}ms")
        for slug in args.scenes:
            src = vo_dir / f"{slug}.mp3"
            if not src.exists():
                print(f"  warn: {src.name} not found, skipping", file=sys.stderr)
                continue
            dst = workdir / f"{slug}.mp3"
            orig_dur, new_dur = trim_scene(src, dst, args.head_ms, args.tail_ms)
            saved = orig_dur - new_dur
            print(f"  {slug:<22}  {orig_dur:5.2f}s → {new_dur:5.2f}s  (-{saved:.2f}s)")
            trimmed.append(dst)

        if not trimmed:
            print("error: no scenes processed", file=sys.stderr)
            return 1

        concat_parts: list[Path] = []
        for i, p in enumerate(trimmed):
            concat_parts.append(p)
            if i < len(trimmed) - 1:
                concat_parts.append(gap_path)

        out_path = vo_dir / args.output
        concat(concat_parts, out_path)

        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(out_path)],
            capture_output=True, text=True, check=True,
        )
        out_dur = float(result.stdout.strip())
        print(f"\n✓ {out_path.relative_to(Path.cwd())}  ({out_dur:.2f}s, {args.gap_ms}ms gaps)")
        return 0
    finally:
        for p in workdir.glob("*"):
            p.unlink(missing_ok=True)
        workdir.rmdir()


if __name__ == "__main__":
    sys.exit(main())
