"""Snap EDL ranges to silence edges in the source audio.

Why audio not transcript: Whisper/Scribe `word.end` is the end of the phoneme,
not where the waveform actually goes silent. Cutting there clips the consonant
tail. Real silence boundaries come from ffmpeg `silencedetect` on the audio.

Pure functions, no module state. Cache the silence probe per source on disk
in `<edit>/silences.json` (caller's choice — this module just returns intervals).
"""
from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

DEFAULT_NOISE_DB = -32        # below this = silence; -30 to -35 fits Loom/podcast bed
DEFAULT_MIN_SILENCE = 0.10    # seconds — anything shorter isn't a real gap
DEFAULT_HEAD_PAD = 0.150      # min silence before cut start to call it "clean"
DEFAULT_TAIL_PAD = 0.250      # min silence after cut end to call it "clean"
DEFAULT_WINDOW = 2.0          # how far to search for a silence edge

HEAD_BUFFER = 0.020           # cut this far past silence_end into speech
TAIL_BUFFER = 0.030           # cut this far into silence_start past speech

_SIL_START = re.compile(r"silence_start:\s*([0-9.]+)")
_SIL_END = re.compile(r"silence_end:\s*([0-9.]+)")


@dataclass
class Silence:
    start: float
    end: float

    @property
    def duration(self) -> float:
        return self.end - self.start


@dataclass
class SnapResult:
    new_start: float
    new_end: float
    head_gap: float            # silence duration found at head, 0 if none
    tail_gap: float            # silence duration found at tail, 0 if none
    status: str                # 'clean' | 'tight' | 'mid_word'
    head_snapped: bool         # True if start moved
    tail_snapped: bool         # True if end moved


def detect_silences(source: Path, noise_db: float = DEFAULT_NOISE_DB,
                    min_silence: float = DEFAULT_MIN_SILENCE) -> list[Silence]:
    """Run ffmpeg silencedetect on source, parse intervals from stderr."""
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(source),
        "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}",
        "-f", "null", "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 and "silence_" not in res.stderr:
        raise RuntimeError(f"ffmpeg silencedetect failed: {res.stderr[-400:]}")

    silences: list[Silence] = []
    pending_start: float | None = None
    for line in res.stderr.splitlines():
        m = _SIL_START.search(line)
        if m:
            pending_start = float(m.group(1))
            continue
        m = _SIL_END.search(line)
        if m and pending_start is not None:
            silences.append(Silence(pending_start, float(m.group(1))))
            pending_start = None
    return silences


def load_or_detect(source: Path, cache: Path | None = None,
                   noise_db: float = DEFAULT_NOISE_DB,
                   min_silence: float = DEFAULT_MIN_SILENCE) -> list[Silence]:
    """Detect silences, optionally caching results to a JSON file.
    Cache is invalidated if noise_db, min_silence, or source mtime change."""
    src_mtime = source.stat().st_mtime if source.exists() else 0
    if cache and cache.exists():
        data = json.loads(cache.read_text())
        if (data.get("noise_db") == noise_db
                and data.get("min_silence") == min_silence
                and data.get("source_mtime") == src_mtime):
            return [Silence(**s) for s in data.get("silences", [])]

    silences = detect_silences(source, noise_db, min_silence)

    if cache:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps({
            "source": str(source),
            "source_mtime": src_mtime,
            "noise_db": noise_db,
            "min_silence": min_silence,
            "silences": [{"start": s.start, "end": s.end} for s in silences],
        }, indent=2))

    return silences


def snap_range(start: float, end: float, silences: list[Silence],
               head_pad: float = DEFAULT_HEAD_PAD,
               tail_pad: float = DEFAULT_TAIL_PAD,
               window: float = DEFAULT_WINDOW) -> SnapResult:
    """Snap [start, end] to the nearest qualifying silence on each side.

    Two-pass: prefer a real breath gap (silence ≥ pad), fall back to the
    closest silence regardless of length. Distance-only ranking lets a
    118ms phoneme dip win over a 1571ms breath next door — that's how you
    get cuts inside the next word. Pad-filtered ranking ignores the dip.

    HEAD: silences whose `silence_end` ∈ [start - window, start + window].
    New start = silence_end - HEAD_BUFFER (~20ms before speech onset).

    TAIL: silences whose `silence_start` ∈ [end - window, end + window].
    New end = silence_start + TAIL_BUFFER (~30ms into silence so the
    consonant decay finishes).

    status:
      clean    = both sides hit a real breath (Pass 1)
      tight    = at least one side fell back to a marginal silence (Pass 2)
      mid_word = no silence at all on at least one side within window
    """
    # Pass 1 — only silences ≥ pad qualify (real breath gaps)
    head_match = _best_silence_for_head(silences, start, window,
                                        min_duration=head_pad)
    tail_match = _best_silence_for_tail(silences, end, window,
                                        min_duration=tail_pad)
    head_fell_back = head_match is None
    tail_fell_back = tail_match is None

    # Pass 2 — fall back to any silence in window
    if head_fell_back:
        head_match = _best_silence_for_head(silences, start, window,
                                            min_duration=0.0)
    if tail_fell_back:
        tail_match = _best_silence_for_tail(silences, end, window,
                                            min_duration=0.0)

    head_gap = head_match.duration if head_match else 0.0
    tail_gap = tail_match.duration if tail_match else 0.0

    new_start = (head_match.end - HEAD_BUFFER) if head_match else start
    new_end = (tail_match.start + TAIL_BUFFER) if tail_match else end

    if head_match is None or tail_match is None:
        status = "mid_word"
    elif head_fell_back or tail_fell_back:
        status = "tight"
    else:
        status = "clean"

    # never let the snapped range invert or collapse — fall back to original
    # bounds AND downgrade status so the caller knows snap effectively failed
    if new_end <= new_start + 0.5:
        new_start, new_end = start, end
        head_gap = tail_gap = 0.0
        status = "mid_word"

    return SnapResult(
        new_start=round(new_start, 3),
        new_end=round(new_end, 3),
        head_gap=round(head_gap, 3),
        tail_gap=round(tail_gap, 3),
        status=status,
        head_snapped=head_match is not None,
        tail_snapped=tail_match is not None,
    )


def _best_silence_for_head(silences: list[Silence], target: float,
                           window: float,
                           min_duration: float = 0.0) -> Silence | None:
    """Silence whose END is closest to target, optionally filtered by length."""
    candidates = [s for s in silences
                  if abs(s.end - target) <= window
                  and s.duration >= min_duration]
    if not candidates:
        return None
    return min(candidates, key=lambda s: abs(s.end - target))


def _best_silence_for_tail(silences: list[Silence], target: float,
                           window: float,
                           min_duration: float = 0.0) -> Silence | None:
    """Silence whose START is closest to target, optionally filtered by length."""
    candidates = [s for s in silences
                  if abs(s.start - target) <= window
                  and s.duration >= min_duration]
    if not candidates:
        return None
    return min(candidates, key=lambda s: abs(s.start - target))


def slice_words(words: list[dict], start: float, end: float) -> str:
    """Return prose for words whose midpoint falls inside [start, end].

    Used by render.py for the post-render terminal pullback. Accepts
    ElevenLabs Scribe word format ({type, text, start, end}). Returns "" if
    `words` empty or none match.
    """
    if not words:
        return ""
    chunks: list[str] = []
    for w in words:
        if w.get("type") not in (None, "word", "spacing"):
            continue
        ws = w.get("start")
        we = w.get("end")
        if ws is None or we is None:
            continue
        mid = (ws + we) / 2
        if start <= mid <= end:
            chunks.append(w.get("text", ""))
    return "".join(chunks).strip()
