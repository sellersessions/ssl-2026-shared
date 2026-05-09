#!/usr/bin/env python3
"""
synth-chapter.py — synthesise chapter.mp3 + chapter.timings.json from per-line stitched output.

The Remotion composition reads `chapter.mp3` + `chapter.timings.json` (single-stem mode).
Our pipeline produces per-scene stems + a `_listen-through.mp3`. This bridge:
  1. Copies _listen-through.mp3 → chapter.mp3
  2. Reads each scene .mp3 duration via ffprobe
  3. Writes chapter.timings.json with cumulative startSec/endSec offsets
     (200ms inter-scene gap matching stitch-lines.py)

Usage:
  scripts/voice/.venv/bin/python3.12 scripts/voice/synth-chapter.py [--target claude-ui-workflow]
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


INTER_SCENE_GAP_SEC = 0.20  # matches stitch-lines.py


def get_duration(mp3_path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(mp3_path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def discover_scenes(vo_dir: Path) -> list[str]:
    """List scene IDs from <vo_dir>/scene-*.mp3 (excluding line stems with __)."""
    scenes = sorted(
        p.stem
        for p in vo_dir.glob("scene-*.mp3")
        if "__" not in p.stem
    )
    return scenes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", default="claude-ui-workflow",
                        help="Voice output slug (folder under public/assets/voice/generated/)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    vo_dir = repo_root / "public" / "assets" / "voice" / "generated" / args.target
    if not vo_dir.is_dir():
        print(f"VO dir not found: {vo_dir}", file=sys.stderr)
        return 1

    listen_through = vo_dir / "_listen-through.mp3"
    if not listen_through.is_file():
        print(f"Missing {listen_through.name} — run stitch-lines.py first.", file=sys.stderr)
        return 1

    scenes = discover_scenes(vo_dir)
    if not scenes:
        print(f"No scene-*.mp3 files in {vo_dir}", file=sys.stderr)
        return 1

    print(f"Discovered {len(scenes)} scenes:")
    timings = []
    cursor = 0.0
    for i, scene_id in enumerate(scenes):
        scene_path = vo_dir / f"{scene_id}.mp3"
        dur = get_duration(scene_path)
        timings.append({
            "sceneId": scene_id,
            "startSec": round(cursor, 6),
            "endSec": round(cursor + dur, 6),
            "durationSec": round(dur, 6),
        })
        print(f"  {scene_id:<22} {dur:6.2f}s  (cursor → {cursor + dur:6.2f}s)")
        cursor += dur
        if i < len(scenes) - 1:
            cursor += INTER_SCENE_GAP_SEC

    timings_path = vo_dir / "chapter.timings.json"
    with open(timings_path, "w") as f:
        json.dump(timings, f, indent=2)
    print(f"\n✓ {timings_path.name}  ({len(timings)} entries, total {cursor:.2f}s)")

    chapter_path = vo_dir / "chapter.mp3"
    shutil.copyfile(listen_through, chapter_path)
    print(f"✓ {chapter_path.name}  (copied from {listen_through.name})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
