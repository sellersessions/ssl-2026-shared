#!/usr/bin/env python3
"""Generate voiceover audio using F5-TTS voice cloning.

Usage:
  # Single line
  python generate-vo.py --text "Seller Sessions Live returns." --output public/assets/voice/generated/vo-intro.wav

  # Batch mode (JSON array)
  python generate-vo.py --batch lines.json --output-dir public/assets/voice/generated/

  # Batch from stdin
  echo '[{"id":"test","text":"Hello world."}]' | python generate-vo.py --batch - --output-dir /tmp/
"""

import argparse
import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REF_AUDIO = SCRIPT_DIR / "reference" / "danny-ref.wav"
REF_TEXT_FILE = SCRIPT_DIR / "reference" / "danny-ref.txt"


def get_device():
    """Pick best available device: MPS (Apple Silicon) > CUDA > CPU."""
    import torch

    if torch.backends.mps.is_available():
        try:
            # Quick smoke test — some ops may not be MPS-ready
            t = torch.zeros(1, device="mps")
            del t
            print("Using device: mps (Apple Silicon)", file=sys.stderr)
            return "mps"
        except Exception:
            pass
    if torch.cuda.is_available():
        print("Using device: cuda", file=sys.stderr)
        return "cuda"
    print("Using device: cpu (slower, but works)", file=sys.stderr)
    return "cpu"


def load_model(device: str):
    """Load F5-TTS model (cached after first call)."""
    from f5_tts.api import F5TTS

    return F5TTS(model="F5TTS_v1_Base", device=device)


def load_ref_text() -> str:
    """Load reference transcription."""
    if REF_TEXT_FILE.exists():
        return REF_TEXT_FILE.read_text().strip()
    # Fallback — empty string lets F5-TTS use ASR internally
    print("Warning: No reference transcription found. F5-TTS will use internal ASR.", file=sys.stderr)
    return ""


def generate_single(tts, ref_text: str, text: str, output: str):
    """Generate a single voiceover line."""
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating: \"{text}\" → {output}", file=sys.stderr)
    wav, sr, _ = tts.infer(
        ref_file=str(REF_AUDIO),
        ref_text=ref_text,
        gen_text=text,
        file_wave=str(output_path),
    )
    print(f"Done: {output_path} ({output_path.stat().st_size / 1024:.0f}KB)", file=sys.stderr)
    return output_path


def generate_batch(tts, ref_text: str, lines: list[dict], output_dir: str):
    """Generate multiple VO lines from a JSON array of {id, text}."""
    output_dir_path = Path(output_dir)
    output_dir_path.mkdir(parents=True, exist_ok=True)

    results = []
    for line in lines:
        line_id = line["id"]
        text = line["text"]
        output = output_dir_path / f"{line_id}.wav"
        generate_single(tts, ref_text, text, str(output))
        results.append({"id": line_id, "file": str(output)})

    return results


def main():
    parser = argparse.ArgumentParser(description="Generate VO with F5-TTS voice cloning")
    parser.add_argument("--text", help="Text to synthesize (single line mode)")
    parser.add_argument("--output", help="Output WAV path (single line mode)")
    parser.add_argument("--batch", help="JSON file with [{id, text}] array, or '-' for stdin")
    parser.add_argument("--output-dir", help="Output directory (batch mode)")
    parser.add_argument("--device", choices=["mps", "cuda", "cpu"], help="Force device")
    args = parser.parse_args()

    if not REF_AUDIO.exists():
        print(f"Error: Reference audio not found at {REF_AUDIO}", file=sys.stderr)
        print("Run prepare-reference.sh first.", file=sys.stderr)
        sys.exit(1)

    device = args.device or get_device()
    tts = load_model(device)
    ref_text = load_ref_text()

    if args.text and args.output:
        generate_single(tts, ref_text, args.text, args.output)
    elif args.batch:
        if not args.output_dir:
            print("Error: --output-dir required for batch mode", file=sys.stderr)
            sys.exit(1)
        if args.batch == "-":
            lines = json.load(sys.stdin)
        else:
            with open(args.batch) as f:
                lines = json.load(f)
        results = generate_batch(tts, ref_text, lines, args.output_dir)
        print(json.dumps(results, indent=2))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
