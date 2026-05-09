#!/usr/bin/env python3
"""One-shot: apply delay + hall reverb to the open stinger SFX.

The raw hit is too dry to sit on a VO track — sounds pasted on. We want
it to breathe in the same acoustic space as the reverberated voiceover.

Output path is a sibling file with a `-wet` suffix so the raw stays intact.

Usage:
  ./scripts/voice/.venv/bin/python3.12 scripts/voice/process-stinger.py
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from pedalboard import Pedalboard, Reverb, Delay
from pedalboard.io import AudioFile

ROOT = Path(__file__).parent.parent.parent
INPUT = ROOT / "public" / "assets" / "sfx" / "library" / "stingers" / "alex_kizenkov-aggressive-huge-hit-logo-139134.mp3"
OUTPUT = ROOT / "public" / "assets" / "sfx" / "library" / "stingers" / "alex_kizenkov-aggressive-huge-hit-logo-139134-wet.mp3"


def main() -> int:
    if not INPUT.exists():
        print(f"error: {INPUT} not found", file=sys.stderr)
        return 1

    # Delay first (echo tail), then hall reverb for space.
    # Parallel bus on reverb (dry=1.0) preserves the original hit.
    board = Pedalboard([
        Delay(delay_seconds=0.16, feedback=0.28, mix=0.28),
        Reverb(
            room_size=0.7,     # hall-sized
            damping=0.35,      # bright tail
            wet_level=0.18,    # 18% send — noticeable space without drowning the hit
            dry_level=1.0,
            width=1.0,
            freeze_mode=0.0,
        ),
    ])

    with AudioFile(str(INPUT)) as f:
        audio = f.read(f.frames)
        sr = f.samplerate
        channels = f.num_channels

    effected = board(audio, sr)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = Path(tmp.name)
    try:
        with AudioFile(str(tmp_wav), "w", sr, channels) as f:
            f.write(effected)

        result = subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp_wav),
             "-codec:a", "libmp3lame", "-qscale:a", "2", str(OUTPUT)],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"ffmpeg error: {result.stderr.strip()}", file=sys.stderr)
            return 1
    finally:
        tmp_wav.unlink(missing_ok=True)

    size_kb = OUTPUT.stat().st_size / 1024
    print(f"{INPUT.name} → {OUTPUT.name}  ({size_kb:.1f} KB)")
    print("  chain: Delay(160ms, fb=0.28, mix=0.28) → Reverb(hall, wet=0.18)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
