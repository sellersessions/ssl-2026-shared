#!/usr/bin/env python3
"""
Batch prep: one-click camera-dump prep for video editing.

Pitch: CapCut/Premiere/Resolve don't touch your camera dump before import.
Drop a folder, get back searchable, previewable, mildly polished clips.
Originals untouched.

Per-project layout (paths are relative to <project-dir>):

  00-source/<DSC_NNNN>.MOV       <- input, originals, never modified
  storyboards/<slug>.png         <- 3x2 contact sheet per clip
  stills/<slug>/f00.jpg ... f05.jpg  <- 6 individual frames per clip
  prepped/<slug>.MOV             <- light grade + light audio, slug-named
  slugs.json                     <- map original-stem -> slug (vision pass writes this)
  manifest.json                  <- map slug -> original-stem (post-encode)
  index.html                     <- review page

Phases (run in order, or all-in-one):

  storyboards   ffprobe + extract 6 stills + tile to png
  encode        read slugs.json, encode each clip with grade + audio chain to prepped/<slug>.MOV
  index         write manifest.json + index.html

Slug source (vision pass): for now slugs.json is supplied by hand or by an
in-session vision pass that reads each storyboard PNG. A future revision can
swap that for an Anthropic API call to make this fully one-click portable.

Processing chain (per BATCH-PREP-RULES.md):

  video: neutral_punch grade, same preset as the cut-flow.
  audio: measure peak with volumedetect, branch per clip:
           HOT  (peak > -2 dBFS)   volume=-3dB,acompressor=threshold=-18dB:ratio=2:attack=20:release=200
           LOW  (peak < -12 dBFS)  volume=+6dB,alimiter=limit=0.99
           OK   (otherwise)        passthrough
         All branches: 30 ms afade in/out (project rule).
         No loudnorm, no denoise, no makeup gain. Mode + peak logged to manifest.json.
  codec: libx264 -crf 20 -preset medium, aac 192k, +faststart
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from html import escape
from pathlib import Path

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".mkv", ".avi"}


@dataclass
class Clip:
    src: Path                  # 00-source/<name>
    stem: str                  # DSC_5317
    duration_s: float
    width: int
    height: int
    slug: str | None = None
    storyboard: Path | None = None
    stills_dir: Path | None = None
    prepped: Path | None = None
    audio_mode: str | None = None     # 'hot' | 'low' | 'ok'
    peak_dbfs: float | None = None
    error: str | None = None


GRADE_NEUTRAL_PUNCH = (
    "eq=contrast=1.06:brightness=0.0:saturation=1.0,"
    "curves=master='0/0 0.25/0.23 0.75/0.77 1/1'"
)


def measure_peak_dbfs(path: Path) -> float:
    """Return max_volume in dBFS using ffmpeg volumedetect. Negative = below digital ceiling."""
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats",
        "-i", str(path),
        "-af", "volumedetect",
        "-vn", "-sn", "-dn",
        "-f", "null", "/dev/null",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    for line in result.stderr.splitlines():
        m = re.search(r"max_volume:\s*(-?[\d.]+)\s*dB", line)
        if m:
            return float(m.group(1))
    return 0.0  # safe default — treats as HOT and tames it


def pick_audio_mode(peak_dbfs: float) -> tuple[str, str]:
    """Return (mode, filter_chain). Empty chain means passthrough beyond the afades."""
    if peak_dbfs > -2.0:
        return ("hot", "volume=-3dB,acompressor=threshold=-18dB:ratio=2:attack=20:release=200")
    if peak_dbfs < -12.0:
        return ("low", "volume=+6dB,alimiter=limit=0.99")
    return ("ok", "")


def ffprobe(path: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-show_entries", "format=duration",
        "-of", "json",
        str(path),
    ]
    out = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def discover(source_dir: Path) -> list[Clip]:
    clips: list[Clip] = []
    for p in sorted(source_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in VIDEO_EXTS:
            try:
                data = ffprobe(p)
                stream = data["streams"][0]
                clips.append(Clip(
                    src=p,
                    stem=p.stem,
                    duration_s=float(data.get("format", {}).get("duration", 0.0)),
                    width=int(stream.get("width", 0)),
                    height=int(stream.get("height", 0)),
                ))
            except Exception as exc:
                clips.append(Clip(src=p, stem=p.stem, duration_s=0, width=0, height=0, error=str(exc)))
    return clips


def make_storyboard_and_stills(clip: Clip, stills_root: Path, storyboards_root: Path) -> None:
    """Extract 6 stills + tile into a 3x2 contact sheet. Stills retained."""
    stills_dir = stills_root / clip.stem
    stills_dir.mkdir(parents=True, exist_ok=True)

    if clip.duration_s <= 0.5:
        timestamps = [clip.duration_s / 2] * 6
    else:
        margin = min(0.5, clip.duration_s * 0.05)
        usable = clip.duration_s - 2 * margin
        timestamps = [margin + (usable * i / 5) for i in range(6)]

    for i, t in enumerate(timestamps):
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-ss", f"{t}",
                "-i", str(clip.src),
                "-frames:v", "1",
                "-vf", "scale=640:-1",
                str(stills_dir / f"f{i:02d}.jpg"),
            ],
            check=True,
        )

    storyboard = storyboards_root / f"{clip.stem}.png"
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(stills_dir / "f00.jpg"),
            "-i", str(stills_dir / "f01.jpg"),
            "-i", str(stills_dir / "f02.jpg"),
            "-i", str(stills_dir / "f03.jpg"),
            "-i", str(stills_dir / "f04.jpg"),
            "-i", str(stills_dir / "f05.jpg"),
            "-filter_complex",
            "[0:v][1:v][2:v]hstack=inputs=3[top];"
            "[3:v][4:v][5:v]hstack=inputs=3[bot];"
            "[top][bot]vstack=inputs=2[out]",
            "-map", "[out]",
            str(storyboard),
        ],
        check=True,
    )
    clip.stills_dir = stills_dir
    clip.storyboard = storyboard


def encode_one(clip: Clip, prepped_dir: Path) -> None:
    """neutral_punch grade + per-clip audio branch. Originals never touched."""
    if clip.slug is None:
        raise RuntimeError(f"no slug for {clip.stem}")

    peak = measure_peak_dbfs(clip.src)
    mode, mode_chain = pick_audio_mode(peak)
    clip.peak_dbfs = peak
    clip.audio_mode = mode

    fade_out_start = max(0.0, clip.duration_s - 0.03)
    af_parts = [
        "afade=t=in:st=0:d=0.03",
        f"afade=t=out:st={fade_out_start:.3f}:d=0.03",
    ]
    if mode_chain:
        af_parts.append(mode_chain)
    af = ",".join(af_parts)

    dst = prepped_dir / f"{clip.slug}.MOV"
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(clip.src),
            "-vf", GRADE_NEUTRAL_PUNCH,
            "-af", af,
            "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            str(dst),
        ],
        check=True,
    )
    clip.prepped = dst


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "clip"


def assign_slugs(clips: list[Clip], slug_map: dict[str, str]) -> None:
    """Apply slug_map (stem -> raw slug), de-collide with -2/-3 suffix."""
    seen: dict[str, int] = {}
    for c in clips:
        if c.error:
            continue
        raw = slug_map.get(c.stem)
        if not raw:
            raise RuntimeError(f"slugs.json missing entry for {c.stem}")
        s = slugify(raw)
        n = seen.get(s, 0) + 1
        seen[s] = n
        c.slug = s if n == 1 else f"{s}-{n}"


def rename_artifacts_to_slug(clip: Clip, stills_root: Path, storyboards_root: Path) -> None:
    """After slug assignment, rename storyboard + stills folder to slug."""
    if clip.slug is None or clip.storyboard is None or clip.stills_dir is None:
        return
    new_storyboard = storyboards_root / f"{clip.slug}.png"
    new_stills_dir = stills_root / clip.slug
    if clip.storyboard != new_storyboard:
        clip.storyboard.rename(new_storyboard)
        clip.storyboard = new_storyboard
    if clip.stills_dir != new_stills_dir:
        clip.stills_dir.rename(new_stills_dir)
        clip.stills_dir = new_stills_dir


def write_manifest(project_root: Path, clips: list[Clip]) -> Path:
    manifest = {
        c.slug: {
            "original_stem": c.stem,
            "duration_s": round(c.duration_s, 1),
            "width": c.width,
            "height": c.height,
            "audio_mode": c.audio_mode,
            "peak_dbfs": round(c.peak_dbfs, 1) if c.peak_dbfs is not None else None,
        }
        for c in clips if c.slug and not c.error
    }
    p = project_root / "manifest.json"
    p.write_text(json.dumps(manifest, indent=2))
    return p


def write_index(project_root: Path, clips: list[Clip]) -> Path:
    cards: list[str] = []
    for c in sorted(clips, key=lambda x: (x.slug or "zzz", x.stem)):
        if c.error:
            cards.append(
                f'<div class="card error"><h3>{escape(c.stem)}</h3>'
                f'<p class="err">{escape(c.error)}</p></div>'
            )
            continue
        sb_rel = c.storyboard.relative_to(project_root) if c.storyboard else None
        stills_rel = c.stills_dir.relative_to(project_root) if c.stills_dir else None
        prepped_rel = c.prepped.relative_to(project_root) if c.prepped else None
        sb_html = f'<img src="{escape(str(sb_rel))}" alt="storyboard" />' if sb_rel else ""
        links: list[str] = []
        if prepped_rel:
            links.append(f'<a href="{escape(str(prepped_rel))}">prepped clip</a>')
        if stills_rel:
            links.append(f'<a href="{escape(str(stills_rel))}/">stills folder</a>')
        audio_html = ""
        if c.audio_mode:
            mode_class = f"mode-{c.audio_mode}"
            peak_str = f"{c.peak_dbfs:+.1f} dBFS" if c.peak_dbfs is not None else "?"
            audio_html = (
                f'<span class="audio {mode_class}">'
                f'audio: {c.audio_mode.upper()} · peak {peak_str}'
                f'</span>'
            )
        cards.append(
            f'<div class="card">'
            f'<h3>{escape(c.slug or c.stem)}</h3>'
            f'<p class="meta"><span class="orig">{escape(c.stem)}</span> · '
            f'{c.duration_s:.1f}s · {c.width}x{c.height}{(" · " + audio_html) if audio_html else ""}</p>'
            f'{sb_html}'
            f'<p class="links">{" · ".join(links)}</p>'
            f'</div>'
        )
    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Batch prep · {len([c for c in clips if not c.error])} clips</title>
<style>
  body {{ background:#0c0a14; color:#f4f3f7; font-family:-apple-system,system-ui,sans-serif; margin:0; padding:32px; }}
  h1 {{ font-size:22px; margin:0 0 8px; }}
  .lede {{ color:#9892ab; margin:0 0 24px; font-size:14px; }}
  .grid {{ display:grid; grid-template-columns:1fr; gap:18px; max-width:1280px; margin:0 auto; }}
  .card {{ background:#14111f; border:1px solid #2a2538; border-radius:10px; padding:16px; }}
  .card h3 {{ margin:0 0 4px; font-size:17px; color:#e07a3a; }}
  .meta {{ margin:0 0 10px; color:#9892ab; font-size:13px; }}
  .meta .orig {{ color:#7c6bbd; font-family:ui-monospace,SFMono-Regular,monospace; }}
  img {{ width:100%; height:auto; border-radius:6px; display:block; }}
  .audio {{ font-family:ui-monospace,SFMono-Regular,monospace; padding:1px 6px; border-radius:4px; font-size:12px; }}
  .audio.mode-hot {{ background:rgba(224,122,58,0.15); color:#e07a3a; }}
  .audio.mode-low {{ background:rgba(124,107,189,0.18); color:#a89bd6; }}
  .audio.mode-ok  {{ background:rgba(120,200,140,0.12); color:#85cf9a; }}
  .links {{ margin:10px 0 0; font-size:13px; }}
  .links a {{ color:#9892ab; text-decoration:underline; margin-right:6px; }}
  .error {{ border-color:#a04040; }}
  .err {{ color:#ff8e8e; font-size:13px; }}
</style></head><body>
<h1>Batch prep · {len([c for c in clips if not c.error])} clips</h1>
<p class="lede">Slug name (orange) · original DSC name (purple) · storyboard · links to prepped clip + stills folder. Originals untouched in <code>00-source/</code>.</p>
<div class="grid">
{"".join(cards)}
</div>
</body></html>
"""
    p = project_root / "index.html"
    p.write_text(html)
    return p


def phase_storyboards(project_root: Path, clips: list[Clip]) -> None:
    stills_root = project_root / "stills"
    storyboards_root = project_root / "storyboards"
    stills_root.mkdir(parents=True, exist_ok=True)
    storyboards_root.mkdir(parents=True, exist_ok=True)
    for c in clips:
        if c.error:
            continue
        try:
            make_storyboard_and_stills(c, stills_root, storyboards_root)
            print(f"  storyboard ok  {c.stem}")
        except Exception as exc:
            c.error = f"storyboard: {exc}"
            print(f"  storyboard ERR {c.stem}  {exc}")


def phase_encode(project_root: Path, clips: list[Clip], slug_map: dict[str, str]) -> None:
    assign_slugs(clips, slug_map)
    stills_root = project_root / "stills"
    storyboards_root = project_root / "storyboards"
    prepped_dir = project_root / "prepped"
    prepped_dir.mkdir(parents=True, exist_ok=True)
    for c in clips:
        if c.error:
            continue
        try:
            rename_artifacts_to_slug(c, stills_root, storyboards_root)
            encode_one(c, prepped_dir)
            print(f"  encode ok      {c.stem} -> {c.slug}.MOV")
        except Exception as exc:
            c.error = f"encode: {exc}"
            print(f"  encode ERR     {c.stem}  {exc}")


def phase_index(project_root: Path, clips: list[Clip]) -> None:
    # Phases can run independently; re-measure audio if the encode pass didn't
    # populate the field in this process (e.g. running --phase index later).
    for c in clips:
        if c.error:
            continue
        if c.peak_dbfs is None:
            c.peak_dbfs = measure_peak_dbfs(c.src)
            c.audio_mode, _ = pick_audio_mode(c.peak_dbfs)
    m = write_manifest(project_root, clips)
    i = write_index(project_root, clips)
    print(f"  manifest -> {m}")
    print(f"  index    -> {i}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("project", type=Path, help="Project dir (must contain 00-source/)")
    ap.add_argument("--phase", choices=["storyboards", "encode", "index", "all"], default="all")
    args = ap.parse_args()

    project_root: Path = args.project.resolve()
    source_dir = project_root / "00-source"
    if not source_dir.is_dir():
        print(f"ERROR: {source_dir} not found", file=sys.stderr)
        return 1

    clips = discover(source_dir)
    if not clips:
        print(f"No video files in {source_dir}")
        return 1

    print(f"Found {len(clips)} clips in {source_dir.name}/")
    print(f"Phase: {args.phase}")
    print()

    if args.phase in ("storyboards", "all"):
        print("== storyboards ==")
        phase_storyboards(project_root, clips)
        print()

    if args.phase in ("encode", "all"):
        slugs_file = project_root / "slugs.json"
        if not slugs_file.exists():
            print(f"ERROR: {slugs_file} missing -- run vision pass first", file=sys.stderr)
            return 2
        slug_map = json.loads(slugs_file.read_text())
        # storyboards from a prior phase have stem-based filenames; re-link them
        sb_root = project_root / "storyboards"
        st_root = project_root / "stills"
        for c in clips:
            if (sb_root / f"{c.stem}.png").exists():
                c.storyboard = sb_root / f"{c.stem}.png"
            if (st_root / c.stem).is_dir():
                c.stills_dir = st_root / c.stem
        print("== encode ==")
        phase_encode(project_root, clips, slug_map)
        print()

    if args.phase in ("index", "all"):
        # in 'index' phase only, re-link slug-named artifacts
        if args.phase == "index":
            slugs_file = project_root / "slugs.json"
            if slugs_file.exists():
                slug_map = json.loads(slugs_file.read_text())
                assign_slugs(clips, slug_map)
            sb_root = project_root / "storyboards"
            st_root = project_root / "stills"
            pr_root = project_root / "prepped"
            for c in clips:
                if c.slug:
                    if (sb_root / f"{c.slug}.png").exists():
                        c.storyboard = sb_root / f"{c.slug}.png"
                    if (st_root / c.slug).is_dir():
                        c.stills_dir = st_root / c.slug
                    if (pr_root / f"{c.slug}.MOV").exists():
                        c.prepped = pr_root / f"{c.slug}.MOV"
        print("== index ==")
        phase_index(project_root, clips)
        print()

    errors = [c for c in clips if c.error]
    print(f"=== self-check ===  {len(clips)-len(errors)}/{len(clips)} clips OK")
    if errors:
        for c in errors:
            print(f"  ERR {c.stem}: {c.error}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
