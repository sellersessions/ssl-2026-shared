#!/usr/bin/env python3
"""Batch/asset mode — process a folder of raw .mp4s into cut assets.

Prototype mode (autonomous picks). Output is jump-cut section assets for
downstream Claude Remotion Flow composition, NOT polished shorts.

Usage:
  batch.py --source-dir <folder> --assets-dir <library>
           [--target 60] [--tolerance 0.1]
           [--format horizontal|vertical]
           [--min-seg 3] [--max-seg 30]
           [--transcribe | --skip-transcribe]
           [--dry-run]

For each .mp4 in source-dir:
  1. Ensure <clip>/edit/transcripts/<clip>.json (transcribe if missing)
  2. Heuristic score + auto-pick non-overlapping segments to target ±tol
  3. Gate 1 — snap EDL boundaries to silence edges
  4. Gate 2 — prefer a landing end (longer trailing silence)
  5. Write edl.json + batch_log.json
  6. Render via render.py
  7. Symlink preview into assets-dir/<clip>__preview.mp4
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from _boundary import (
    DEFAULT_HEAD_PAD, DEFAULT_TAIL_PAD, DEFAULT_WINDOW, DEFAULT_NOISE_DB,
    load_or_detect, snap_range,
)

PROJECT_ROOT = SCRIPT_DIR.parent
VIDEO_USE_DIR = Path(os.environ.get(
    "VIDEO_USE_DIR",
    str(PROJECT_ROOT.parent / "video-use"),
))
VIDEO_USE_TRANSCRIBE = VIDEO_USE_DIR / "helpers" / "transcribe.py"
PYTHON = os.environ.get("PYTHON_BIN", "/opt/homebrew/opt/python@3.12/bin/python3.12")

FILLERS = {"um", "uh", "er", "erm", "ah", "like", "you know", "sort of",
           "kind of", "basically", "literally", "right"}


@dataclass
class Segment:
    start: float
    end: float
    words: int
    filler: int
    trailing_silence: float  # seconds after .end before next word
    text: str
    speaker: str

    @property
    def duration(self) -> float:
        return self.end - self.start

    @property
    def density(self) -> float:
        # words per second, filler-penalised
        base = self.words / max(self.duration, 0.1)
        return base - 0.6 * (self.filler / max(self.duration, 0.1))


def load_scribe(path: Path) -> dict:
    return json.loads(path.read_text())


def build_segments(scribe: dict, min_dur: float, max_dur: float,
                   silence_split: float = 0.9) -> list[Segment]:
    """Group words into segments split at silence gaps >= silence_split."""
    words = [w for w in scribe.get("words", []) if w.get("type") == "word"]
    if not words:
        return []

    segments: list[Segment] = []
    buf: list[dict] = []
    prev_end = words[0]["start"]

    def flush(next_start: float) -> None:
        if not buf:
            return
        start = buf[0]["start"]
        end = buf[-1]["end"]
        if end - start < min_dur:
            buf.clear()
            return
        text = " ".join(w["text"].strip() for w in buf if w["text"].strip())
        lower = text.lower()
        filler = sum(lower.count(f) for f in FILLERS)
        trailing = max(0.0, next_start - end)
        speakers = {w.get("speaker_id", "") for w in buf}
        speaker = next(iter(speakers)) if len(speakers) == 1 else "mixed"
        # split overlong segments into evenly-sized sub-chunks
        dur = end - start
        if dur > max_dur:
            n_chunks = int(dur // max_dur) + 1
            chunk_words = max(1, len(buf) // n_chunks)
            for i in range(n_chunks):
                sub = buf[i * chunk_words:(i + 1) * chunk_words]
                if not sub:
                    continue
                s_start = sub[0]["start"]
                s_end = sub[-1]["end"]
                if s_end - s_start < min_dur:
                    continue
                s_text = " ".join(w["text"].strip() for w in sub if w["text"].strip())
                s_lower = s_text.lower()
                s_filler = sum(s_lower.count(f) for f in FILLERS)
                s_trailing = trailing if i == n_chunks - 1 else 0.0
                segments.append(Segment(
                    start=s_start, end=s_end, words=len(sub),
                    filler=s_filler, trailing_silence=s_trailing,
                    text=s_text, speaker=speaker,
                ))
        else:
            segments.append(Segment(
                start=start, end=end, words=len(buf),
                filler=filler, trailing_silence=trailing,
                text=text, speaker=speaker,
            ))
        buf.clear()

    for w in words:
        gap = w["start"] - prev_end
        if buf and gap >= silence_split:
            flush(w["start"])
        buf.append(w)
        prev_end = w["end"]
    flush(scribe.get("audio_duration_secs", prev_end + 1))

    return segments


def rank_segments(segments: list[Segment]) -> list[Segment]:
    """Sort by density desc, tiebreak: longer trailing silence (better landings)."""
    return sorted(segments, key=lambda s: (s.density, s.trailing_silence),
                  reverse=True)


def greedy_pick(ranked: list[Segment], target: float, tol: float,
                min_picks: int = 3) -> list[Segment]:
    """Greedy pack: add highest-density non-overlapping segments until
    total ∈ [target*(1-tol), target*(1+tol)]. Hard stop at target*(1+tol)."""
    lower = target * (1 - tol)
    upper = target * (1 + tol)
    picked: list[Segment] = []
    total = 0.0
    for seg in ranked:
        if any(not (seg.end <= p.start or seg.start >= p.end) for p in picked):
            continue
        if total + seg.duration > upper and len(picked) >= min_picks:
            continue
        picked.append(seg)
        total += seg.duration
        if total >= lower and len(picked) >= min_picks:
            break
    return sorted(picked, key=lambda s: s.start)


def snap_to_silence_audio(seg: Segment, silences,
                          head_pad: float = DEFAULT_HEAD_PAD,
                          tail_pad: float = DEFAULT_TAIL_PAD,
                          window: float = DEFAULT_WINDOW) -> Segment:
    """Gate 1 — snap segment bounds to real silences in the audio waveform.
    Replaces the old word-timestamp-based snap; ffmpeg silencedetect on the
    source is more accurate than Whisper word.end (which is the phoneme end,
    not the silence)."""
    res = snap_range(seg.start, seg.end, silences,
                     head_pad=head_pad, tail_pad=tail_pad, window=window)
    return Segment(
        start=res.new_start, end=res.new_end,
        words=seg.words, filler=seg.filler,
        trailing_silence=res.tail_gap or seg.trailing_silence,
        text=seg.text, speaker=seg.speaker,
    )


def ensure_closer(picks: list[Segment]) -> list[Segment]:
    """Gate 2 — ensure the last pick has at least 0.3s trailing silence.
    If not, drop back to the previous one with a cleaner landing."""
    if not picks:
        return picks
    picks = list(picks)
    last = picks[-1]
    if last.trailing_silence >= 0.3:
        return picks
    # find best alt in current picks by trailing_silence
    best = max(picks, key=lambda s: s.trailing_silence)
    if best is not last and best.trailing_silence >= 0.3:
        # reorder so best is last
        picks.remove(best)
        picks.append(best)
    return picks


def make_edl(picks: list[Segment], source_key: str, source_path: Path,
             target: float) -> dict:
    ranges = []
    for i, p in enumerate(picks):
        ranges.append({
            "source": source_key,
            "start": round(p.start, 3),
            "end": round(p.end, 3),
            "duration_s": round(p.duration, 3),
            "beat": f"SEG_{i:02d}",
            "quote": p.text[:180],
            "reason": f"auto-pick density={p.density:.2f} "
                      f"trail={p.trailing_silence:.2f}s",
        })
    total = sum(r["duration_s"] for r in ranges)
    return {
        "version": 1,
        "selection_mode": "batch-autonomous",
        "label": f"{source_key} — batch asset",
        "sources": {source_key: str(source_path)},
        "target_runtime_s": target,
        "ranges": ranges,
        "grade": "neutral_punch",
        "overlays": [],
        "total_duration_s": round(total, 2),
    }


def transcribe_if_missing(clip: Path, edit_dir: Path,
                          skip: bool) -> Path | None:
    tx = edit_dir / "transcripts" / f"{clip.stem}.json"
    if tx.exists():
        return tx
    if skip:
        print(f"  no transcript + --skip-transcribe → skip", file=sys.stderr)
        return None
    print(f"  transcribing {clip.name} …")
    env = os.environ.copy()
    # Source ELEVENLABS_API_KEY: this repo's .env first, then sibling
    # claude-remotion-flow/.env as a legacy fallback.
    if "ELEVENLABS_API_KEY" not in env:
        candidates = [
            PROJECT_ROOT / ".env",
            PROJECT_ROOT.parent / "claude-remotion-flow" / ".env",
        ]
        for env_file in candidates:
            if not env_file.exists():
                continue
            for line in env_file.read_text().splitlines():
                if line.startswith("ELEVENLABS_API_KEY="):
                    env["ELEVENLABS_API_KEY"] = line.split("=", 1)[1].strip()
                    break
            if "ELEVENLABS_API_KEY" in env:
                break
    subprocess.run(
        [PYTHON, str(VIDEO_USE_TRANSCRIBE), str(clip),
         "--edit-dir", str(edit_dir)],
        check=True, env=env,
    )
    return tx if tx.exists() else None


def process_clip(clip: Path, args) -> dict:
    result = {"clip": clip.name, "status": "pending"}
    edit_dir = clip.parent / clip.stem / "edit"
    if not edit_dir.parent.exists():
        edit_dir.parent.mkdir(parents=True)
    edit_dir.mkdir(parents=True, exist_ok=True)

    # legacy: transcripts may live in clip.parent/edit/ for pre-existing clips
    legacy_tx = clip.parent / "edit" / "transcripts" / f"{clip.stem}.json"
    if legacy_tx.exists():
        target_tx = edit_dir / "transcripts" / f"{clip.stem}.json"
        target_tx.parent.mkdir(parents=True, exist_ok=True)
        if not target_tx.exists():
            shutil.copy2(legacy_tx, target_tx)

    tx_path = transcribe_if_missing(clip, edit_dir,
                                    skip=args.skip_transcribe)
    if tx_path is None:
        result["status"] = "error:no_transcript"
        return result

    scribe = load_scribe(tx_path)
    segs = build_segments(scribe, args.min_seg, args.max_seg)
    result["n_candidates"] = len(segs)
    if not segs:
        result["status"] = "error:no_segments"
        return result

    ranked = rank_segments(segs)
    picks = greedy_pick(ranked, args.target, args.tolerance)
    if not picks:
        result["status"] = "error:no_picks"
        return result

    # Gate 1 — audio-based snap
    silences = load_or_detect(
        clip,
        cache=edit_dir / "silences.json",
        noise_db=args.noise_db,
        min_silence=0.10,
    )
    snapped = [
        snap_to_silence_audio(
            p, silences,
            head_pad=args.head_pad, tail_pad=args.tail_pad,
            window=args.snap_window,
        )
        for p in picks
    ]
    # Gate 2
    final = ensure_closer(snapped)
    result["picks"] = [
        {"start": round(p.start, 3), "end": round(p.end, 3),
         "duration": round(p.duration, 3), "trailing": round(p.trailing_silence, 2),
         "text": p.text[:80]}
        for p in final
    ]
    result["total_duration"] = round(sum(p.duration for p in final), 2)

    source_key = clip.stem
    edl = make_edl(final, source_key, clip, args.target)
    edl_path = edit_dir / "edl.json"
    edl_path.write_text(json.dumps(edl, indent=2))
    result["edl"] = str(edl_path)

    log_path = edit_dir / "batch_log.json"
    log_path.write_text(json.dumps({
        "mode": "batch-autonomous",
        "target": args.target,
        "tolerance": args.tolerance,
        "format": args.format,
        "n_candidates": len(segs),
        "n_picks": len(final),
        "total_duration": result["total_duration"],
        "picks": result["picks"],
    }, indent=2))

    if args.dry_run:
        result["status"] = "dry-run"
        return result

    preview = edit_dir / f"preview_{args.format}.mp4"
    subprocess.run([
        PYTHON, str(SCRIPT_DIR / "render.py"),
        "--edl", str(edl_path),
        "--out", str(preview),
        "--format", args.format,
    ], check=True)
    result["preview"] = str(preview)

    assets_dir = Path(args.assets_dir)
    assets_dir.mkdir(parents=True, exist_ok=True)
    asset_path = assets_dir / f"{clip.stem}__preview_{args.format}.mp4"
    if asset_path.exists() or asset_path.is_symlink():
        asset_path.unlink()
    asset_path.symlink_to(preview.resolve())
    result["asset"] = str(asset_path)
    result["status"] = "ok"
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-dir", required=True, type=Path)
    ap.add_argument("--assets-dir", required=True, type=Path)
    ap.add_argument("--target", type=float, default=60)
    ap.add_argument("--tolerance", type=float, default=0.1)
    ap.add_argument("--format", choices=["horizontal", "vertical"],
                    default="horizontal")
    ap.add_argument("--min-seg", type=float, default=3)
    ap.add_argument("--max-seg", type=float, default=30)
    ap.add_argument("--head-pad", type=float, default=DEFAULT_HEAD_PAD,
                    help="min silence before cut start to call clean")
    ap.add_argument("--tail-pad", type=float, default=DEFAULT_TAIL_PAD,
                    help="min silence after cut end to call clean")
    ap.add_argument("--snap-window", type=float, default=DEFAULT_WINDOW,
                    help="how far to search for a silence edge (seconds)")
    ap.add_argument("--noise-db", type=float, default=DEFAULT_NOISE_DB,
                    help="silencedetect noise floor in dB (-32 default)")
    ap.add_argument("--skip-transcribe", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    source_dir: Path = args.source_dir
    if not source_dir.is_dir():
        print(f"not a directory: {source_dir}", file=sys.stderr)
        return 2

    clips = sorted(source_dir.glob("*.mp4"))
    if not clips:
        print(f"no .mp4 in {source_dir}", file=sys.stderr)
        return 2

    print(f"=== batch: {len(clips)} clips · target {args.target}s "
          f"±{int(args.tolerance * 100)}% · {args.format} ===")
    results = []
    for clip in clips:
        print(f"\n--- {clip.name} ---")
        try:
            r = process_clip(clip, args)
        except subprocess.CalledProcessError as exc:
            r = {"clip": clip.name, "status": f"error:subprocess:{exc.returncode}"}
        results.append(r)
        print(f"  → {r.get('status')}  "
              f"picks={len(r.get('picks', []))}  "
              f"dur={r.get('total_duration', '—')}s")

    summary_path = Path(args.assets_dir) / "batch_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps({
        "source_dir": str(source_dir),
        "assets_dir": str(args.assets_dir),
        "format": args.format,
        "target": args.target,
        "results": results,
    }, indent=2))
    print(f"\n=== summary → {summary_path} ===")
    ok = sum(1 for r in results if r.get("status") in ("ok", "dry-run"))
    print(f"  {ok}/{len(results)} succeeded")
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
