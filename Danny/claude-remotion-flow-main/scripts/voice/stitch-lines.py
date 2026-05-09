#!/usr/bin/env python3
"""stitch-lines.py - assemble per-line VO outputs into per-scene + final stems.

Reads scene/line structure from a generate-vo config (the same one used to
generate the takes), then:
  1. Concats lines within a scene with --intra-line-gap-ms (default 80ms)
     → writes <scene-id>.mp3 in the VO output dir.
  2. Concats scenes with --inter-scene-gap-ms (default 200ms)
     → writes <listen-output> in the VO output dir.

Hands-off pipeline: no manual gap tuning. Just point at the config and run.

Usage:
  stitch-lines.py --config scripts/voice/claude-ui-workflow.config.json \
    --output _listen-through.mp3 \
    [--intra-line-gap-ms 80] [--inter-scene-gap-ms 200]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def make_silence(path: Path, duration_ms: int) -> None:
    if duration_ms <= 0:
        return
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


def concat(parts: list[Path], output: Path) -> float:
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

    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(output)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, help="Path to generate-vo config JSON")
    parser.add_argument("--output", default="_listen-through.mp3", help="Listen-through filename (written into output_dir)")
    parser.add_argument("--intra-line-gap-ms", type=int, default=80, help="Gap between lines within a scene (default 80)")
    parser.add_argument("--inter-scene-gap-ms", type=int, default=200, help="Gap between scenes (default 200)")
    args = parser.parse_args()

    cfg_path = Path(args.config).resolve()
    if not cfg_path.exists():
        print(f"error: config not found: {cfg_path}", file=sys.stderr)
        return 1

    cfg = json.loads(cfg_path.read_text())
    vo_dir = (REPO_ROOT / cfg["output_dir"]).resolve()
    if not vo_dir.is_dir():
        print(f"error: output_dir not found: {vo_dir}", file=sys.stderr)
        return 1

    scenes = cfg["scenes"]

    workdir = Path(tempfile.mkdtemp(prefix="stitch-"))
    try:
        intra_gap = workdir / "intra-gap.mp3"
        inter_gap = workdir / "inter-gap.mp3"
        make_silence(intra_gap, args.intra_line_gap_ms)
        make_silence(inter_gap, args.inter_scene_gap_ms)

        scene_files: list[Path] = []
        print(f"Stitching {len(scenes)} scenes — intra-line {args.intra_line_gap_ms}ms / inter-scene {args.inter_scene_gap_ms}ms")

        for scene in scenes:
            scene_id = scene["id"]

            if scene.get("lines"):
                line_files: list[Path] = []
                for line in scene["lines"]:
                    line_path = vo_dir / f"{scene_id}__{line['id']}.mp3"
                    if not line_path.exists():
                        print(f"  warn: missing {line_path.name}", file=sys.stderr)
                        continue
                    line_files.append(line_path)

                if not line_files:
                    print(f"  skip: no lines found for {scene_id}", file=sys.stderr)
                    continue

                parts: list[Path] = []
                for i, lp in enumerate(line_files):
                    parts.append(lp)
                    if i < len(line_files) - 1 and args.intra_line_gap_ms > 0:
                        parts.append(intra_gap)

                scene_out = vo_dir / f"{scene_id}.mp3"
                dur = concat(parts, scene_out)
                print(f"  {scene_id:<22}  {len(line_files)} lines  →  {dur:5.2f}s")
                scene_files.append(scene_out)
            else:
                # Legacy single-text scene
                scene_path = vo_dir / f"{scene_id}.mp3"
                if not scene_path.exists():
                    print(f"  warn: missing {scene_path.name}", file=sys.stderr)
                    continue
                scene_files.append(scene_path)
                print(f"  {scene_id:<22}  (single)")

        if not scene_files:
            print("error: no scene files produced", file=sys.stderr)
            return 1

        listen_parts: list[Path] = []
        for i, sp in enumerate(scene_files):
            listen_parts.append(sp)
            if i < len(scene_files) - 1 and args.inter_scene_gap_ms > 0:
                listen_parts.append(inter_gap)

        out_path = vo_dir / args.output
        total_dur = concat(listen_parts, out_path)
        print(f"\n✓ {out_path.relative_to(REPO_ROOT)}  ({total_dur:.2f}s)")
        return 0
    finally:
        for p in workdir.glob("*"):
            p.unlink(missing_ok=True)
        workdir.rmdir()


if __name__ == "__main__":
    sys.exit(main())
