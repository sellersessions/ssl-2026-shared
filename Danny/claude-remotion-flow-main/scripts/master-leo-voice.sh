#!/bin/bash
# Light voice-mastering pass for Leo's ClaudeCodeToolsWindows source clips.
#
# Filter chain:
#   highpass @ 80 Hz   — kill desk rumble + low-end mud
#   acompressor        — gentle 2.5:1 @ -18 dB, slow attack, transparent leveling
#   equalizer @ 3.5 kHz — +1.5 dB shelf for vocal presence
#   loudnorm           — single-pass EBU R128 to anchor at -16 LUFS
#
# Video is stream-copied (no re-encode), only audio is processed.
# Outputs to _mastered/ alongside source so you can A/B before swap.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_ROOT/public/assets/loom-cuts/claude-code-tools-windows"
OUT_DIR="${SRC_DIR}_mastered"

mkdir -p "$OUT_DIR"

FILTER="highpass=f=80,acompressor=threshold=-18dB:ratio=2.5:attack=15:release=150:makeup=2,equalizer=f=3500:width_type=q:w=1.2:g=1.5,loudnorm=I=-16:TP=-1.5:LRA=11"

for src in "$SRC_DIR"/*.mp4; do
  name=$(basename "$src")
  out="$OUT_DIR/$name"
  echo "→ mastering $name"
  ffmpeg -y -hide_banner -loglevel error -nostdin \
    -i "$src" \
    -c:v copy \
    -af "$FILTER" \
    -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart \
    "$out"
done

echo ""
echo "Done. Mastered files in:"
echo "  $OUT_DIR"
echo ""
echo "A/B compare any clip:"
echo "  open \"$SRC_DIR/01_intro-what-well-install.mp4\""
echo "  open \"$OUT_DIR/01_intro-what-well-install.mp4\""
