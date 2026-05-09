#!/usr/bin/env bash
# Extract a clean 25s reference clip for F5-TTS voice cloning.
# Usage: ./prepare-reference.sh <input.mp3> [start_seconds] [duration]

set -euo pipefail

INPUT="${1:?Usage: prepare-reference.sh <input.mp3> [start_seconds] [duration]}"
START="${2:-10}"
DURATION="${3:-25}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/reference/danny-ref.wav"

echo "Extracting ${DURATION}s from offset ${START}s..."
ffmpeg -y -i "$INPUT" \
  -ss "$START" -t "$DURATION" \
  -ar 24000 -ac 1 -acodec pcm_s16le \
  -af loudnorm \
  "$OUTPUT"

echo "Reference clip saved: $OUTPUT"
ffprobe -v quiet -show_entries format=duration -show_entries stream=sample_rate,channels "$OUTPUT"
