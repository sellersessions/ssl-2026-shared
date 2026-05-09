#!/usr/bin/env python3
"""
Batch cleanup protocol — first-pass triage on a folder of raw clips.

What it does (per the C plan, signed off):
  1. Probe each clip for duration + aspect ratio (ffprobe).
  2. Extract 6 evenly-spaced frames into a contact-sheet PNG (ffmpeg).
  3. Bucket each clip into a subfolder by (duration band) x (aspect class).
  4. Write storyboards/storyboard-index.html so a non-editor can scan visually.
  5. Self-check at end: count buckets, verify every clip has a storyboard,
     report any failures.

What it intentionally does NOT do (deferred per sign-off):
  - Trim (most-difficult, deferred).
  - Stills extraction (no protocol yet, deferred).

Buckets (chosen so a 10-clip set lands in a useful number of folders):
  duration:
    short    < 30s
    medium   30s - 120s
    long     >= 120s
  aspect:
    16x9     ~1.78 (within 0.05)
    9x16     ~0.56 (within 0.05)
    other    everything else (square, weird crops)

Subfolder name pattern: 01-short-16x9 / 02-medium-9x16 / etc.

Usage:
  ./batch-cleanup.py <inbox-dir> [--dry-run]

  --dry-run prints the plan without moving files or extracting frames.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, asdict
from html import escape
from pathlib import Path

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".mkv", ".avi"}


@dataclass
class ClipReport:
    name: str
    src: Path
    duration_s: float
    width: int
    height: int
    aspect: float
    duration_band: str  # short | medium | long
    aspect_class: str   # 16x9 | 9x16 | other
    bucket: str         # NN-<band>-<aspect>
    storyboard: Path | None = None
    error: str | None = None


def ffprobe(path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration,r_frame_rate,codec_name",
        "-show_entries", "format=duration,size",
        "-of", "json",
        str(path),
    ]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def classify_duration(d: float) -> str:
    if d < 30:
        return "short"
    if d < 120:
        return "medium"
    return "long"


def classify_aspect(w: int, h: int) -> str:
    if h == 0:
        return "other"
    a = w / h
    if abs(a - 16 / 9) < 0.05:
        return "16x9"
    if abs(a - 9 / 16) < 0.05:
        return "9x16"
    return "other"


def make_storyboard(src: Path, duration: float, dst: Path) -> None:
    """Extract 6 evenly-spaced frames into a single 3x2 contact-sheet PNG."""
    # Pick 6 timestamps avoiding the very first/last frame.
    if duration <= 0.5:
        timestamps = [duration / 2] * 6
    else:
        margin = min(0.5, duration * 0.05)
        usable = duration - 2 * margin
        timestamps = [margin + (usable * i / 5) for i in range(6)]

    # Use ffmpeg select filter to grab 6 frames at our chosen timestamps.
    # Easier: extract 6 separate jpegs then tile them.
    tmp = dst.parent / f".{dst.stem}_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    try:
        for i, t in enumerate(timestamps):
            subprocess.run(
                [
                    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-ss", f"{t}",
                    "-i", str(src),
                    "-frames:v", "1",
                    "-vf", "scale=480:-1",
                    str(tmp / f"f{i:02d}.jpg"),
                ],
                check=True,
            )
        # Tile 3x2.
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(tmp / "f00.jpg"),
                "-i", str(tmp / "f01.jpg"),
                "-i", str(tmp / "f02.jpg"),
                "-i", str(tmp / "f03.jpg"),
                "-i", str(tmp / "f04.jpg"),
                "-i", str(tmp / "f05.jpg"),
                "-filter_complex",
                "[0:v][1:v][2:v]hstack=inputs=3[top];"
                "[3:v][4:v][5:v]hstack=inputs=3[bot];"
                "[top][bot]vstack=inputs=2[out]",
                "-map", "[out]",
                str(dst),
            ],
            check=True,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def write_index_html(out_dir: Path, reports: list[ClipReport]) -> Path:
    """Write a simple index page so a non-editor can scan all clips visually."""
    rows: list[str] = []
    for r in sorted(reports, key=lambda x: (x.bucket, x.name)):
        if r.error:
            rows.append(
                f'<div class="card error"><h3>{escape(r.name)}</h3>'
                f'<p class="err">{escape(r.error)}</p></div>'
            )
            continue
        sb_rel = r.storyboard.relative_to(out_dir) if r.storyboard else None
        sb_html = f'<img src="{escape(str(sb_rel))}" alt="storyboard" />' if sb_rel else ""
        rows.append(
            f'<div class="card">'
            f'<h3>{escape(r.name)}</h3>'
            f'<p class="meta">{r.duration_s:.1f}s &middot; {r.width}x{r.height} &middot; '
            f'<strong>{escape(r.bucket)}</strong></p>'
            f'{sb_html}'
            f'</div>'
        )
    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Batch cleanup storyboards</title>
<style>
  body {{ background:#0c0a14; color:#f4f3f7; font-family:-apple-system,system-ui,sans-serif; margin:0; padding:32px; }}
  h1 {{ font-size:22px; margin:0 0 24px; }}
  .grid {{ display:grid; grid-template-columns:1fr; gap:18px; max-width:1280px; margin:0 auto; }}
  .card {{ background:#14111f; border:1px solid #2a2538; border-radius:10px; padding:16px; }}
  .card h3 {{ margin:0 0 4px; font-size:15px; }}
  .meta {{ margin:0 0 10px; color:#9892ab; font-size:13px; }}
  .meta strong {{ color:#e07a3a; }}
  img {{ width:100%; height:auto; border-radius:6px; display:block; }}
  .error {{ border-color:#a04040; }}
  .err {{ color:#ff8e8e; font-size:13px; }}
</style></head><body>
<h1>Batch cleanup storyboards &middot; {len(reports)} clips</h1>
<div class="grid">
{"".join(rows)}
</div>
</body></html>
"""
    p = out_dir / "storyboard-index.html"
    p.write_text(html)
    return p


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("inbox", type=Path, help="Folder containing raw clips")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    inbox: Path = args.inbox.resolve()
    if not inbox.is_dir():
        print(f"ERROR: {inbox} is not a directory", file=sys.stderr)
        return 1

    # Discover clips at top level + one level deep (gdown drops a subfolder).
    clips: list[Path] = []
    for p in inbox.iterdir():
        if p.is_file() and p.suffix.lower() in VIDEO_EXTS:
            clips.append(p)
        elif p.is_dir():
            for q in p.iterdir():
                if q.is_file() and q.suffix.lower() in VIDEO_EXTS:
                    clips.append(q)
    clips.sort()

    if not clips:
        print(f"No video files found under {inbox}")
        return 1

    project_root = inbox.parent
    storyboards_dir = project_root / "storyboards"
    storyboards_dir.mkdir(parents=True, exist_ok=True)

    reports: list[ClipReport] = []
    for src in clips:
        try:
            data = ffprobe(src)
            stream = data["streams"][0]
            w = int(stream.get("width", 0))
            h = int(stream.get("height", 0))
            dur = float(data.get("format", {}).get("duration", 0.0))
            band = classify_duration(dur)
            aspect_class = classify_aspect(w, h)
            aspect_value = (w / h) if h else 0.0
            # Bucket prefix (so folders sort sensibly).
            band_prefix = {"short": "01", "medium": "02", "long": "03"}[band]
            bucket = f"{band_prefix}-{band}-{aspect_class}"
            reports.append(ClipReport(
                name=src.name,
                src=src,
                duration_s=dur,
                width=w, height=h, aspect=aspect_value,
                duration_band=band, aspect_class=aspect_class, bucket=bucket,
            ))
        except Exception as exc:
            reports.append(ClipReport(
                name=src.name, src=src,
                duration_s=0, width=0, height=0, aspect=0,
                duration_band="?", aspect_class="?", bucket="99-error",
                error=str(exc),
            ))

    print(f"Found {len(reports)} clips. Plan:")
    for r in reports:
        if r.error:
            print(f"  ERR  {r.name:<40s}  {r.error}")
        else:
            print(f"       {r.name:<40s}  {r.duration_s:>7.1f}s  {r.width}x{r.height:<6}  -> {r.bucket}")

    if args.dry_run:
        print("\n--dry-run: no files moved, no storyboards extracted.")
        return 0

    # For each clip: extract storyboard + move into bucket folder.
    for r in reports:
        if r.error:
            continue
        bucket_dir = project_root / r.bucket
        bucket_dir.mkdir(parents=True, exist_ok=True)
        storyboard_path = storyboards_dir / f"{r.src.stem}-storyboard.png"
        try:
            make_storyboard(r.src, r.duration_s, storyboard_path)
            r.storyboard = storyboard_path
        except Exception as exc:
            r.error = f"storyboard: {exc}"
            continue
        # Move (within same volume so atomic).
        dst = bucket_dir / r.src.name
        if dst.resolve() != r.src.resolve():
            shutil.move(str(r.src), str(dst))
            r.src = dst

    index_path = write_index_html(project_root, reports)

    # Self-check.
    print("\n=== self-check ===")
    bucket_counts: dict[str, int] = {}
    missing_storyboards: list[str] = []
    errors: list[str] = []
    for r in reports:
        bucket_counts[r.bucket] = bucket_counts.get(r.bucket, 0) + 1
        if r.error:
            errors.append(f"{r.name}: {r.error}")
        elif not r.storyboard or not r.storyboard.exists():
            missing_storyboards.append(r.name)
    print(f"  buckets: {bucket_counts}")
    print(f"  storyboards: {len(reports) - len(missing_storyboards)}/{len(reports)} present")
    if missing_storyboards:
        print(f"  MISSING storyboards: {missing_storyboards}")
    if errors:
        print(f"  ERRORS: {errors}")
    print(f"  index: {index_path}")
    return 0 if not errors and not missing_storyboards else 2


if __name__ == "__main__":
    sys.exit(main())
