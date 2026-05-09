#!/usr/bin/env bash
# Custom v2 render: 60s Danny-only, neutral_punch grade (single), per-segment
# framing variation, CRF 20 full quality, no loudnorm.
#
# Framing rotation (source 1920×1080):
#   seg 0  HOOK         → 100% full frame (baseline composition)
#   seg 1  CADENCE      → 104% center-crop (pseudo-tight camera)
#   seg 2  PODCAST_NO   → 100% shifted left (wider, re-framed)
#   seg 3  LOOM         → 104% shifted right (tight, re-angled)

set -euo pipefail

# Demo paths from the original pod-test-claude reference run. Override via env.
SRC="${SRC:-../pod-test-claude/pod-test-claude.mp4}"
EDIT="${EDIT:-../pod-test-claude/edit}"
CLIPS="${EDIT}/clips_v2"
OUT="${EDIT}/preview_v2.mp4"

mkdir -p "$CLIPS"
rm -f "$CLIPS"/seg_*.mp4

# Single grade applied to every segment — no drift, no switching.
GRADE="eq=contrast=1.06:brightness=0.0:saturation=1.0,curves=master='0/0 0.25/0.23 0.75/0.77 1/1'"

# Framing variations — applied BEFORE grade in the filter chain.
# Each preserves 1920×1080 output.
FRAME0="scale=1920:-2"                                            # 100% full
FRAME1="scale=1996:1122:flags=lanczos,crop=1920:1080:38:21"       # 104% center
FRAME2="scale=1920:-2,crop=1920:1080:0:0"                         # 100% full (consistent)
FRAME3="scale=1996:1122:flags=lanczos,crop=1920:1080:62:21"       # 104% shifted right

extract_segment() {
  local idx=$1
  local start=$2
  local duration=$3
  local frame=$4
  local beat=$5
  local out="$CLIPS/seg_$(printf '%02d' "$idx")_${beat}.mp4"

  # 30ms audio fades at both edges
  local fade_out_start
  fade_out_start=$(python3 -c "print(max(0, $duration - 0.03))")
  local af="afade=t=in:st=0:d=0.03,afade=t=out:st=${fade_out_start}:d=0.03"

  local vf="${frame},${GRADE}"

  echo "  [${idx}] ${beat} ${start}→$(python3 -c "print($start + $duration)")s (${duration}s) — ${frame}"

  ffmpeg -y -hide_banner -loglevel error \
    -ss "$start" -i "$SRC" -t "$duration" \
    -vf "$vf" -af "$af" \
    -c:v libx264 -preset fast -crf 20 \
    -pix_fmt yuv420p -r 24 \
    -c:a aac -b:a 192k -ar 48000 \
    -movflags +faststart \
    "$out"
}

echo "=== v2 render: 60s Danny-only, neutral_punch, framing variation ==="
extract_segment 0   0.120  7.120 "$FRAME0" "HOOK"
extract_segment 1  74.600 16.340 "$FRAME1" "CADENCE"
extract_segment 2 106.060  3.420 "$FRAME2" "PODCAST_NO"
extract_segment 3 118.960 19.580 "$FRAME3" "LOOM_WORKFLOW"

# Lossless concat
CONCAT_LIST="$EDIT/_concat_v2.txt"
{
  for f in "$CLIPS"/seg_*.mp4; do
    echo "file '$f'"
  done
} > "$CONCAT_LIST"

echo ""
echo "=== concat → $(basename "$OUT") ==="
ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -i "$CONCAT_LIST" \
  -c copy -movflags +faststart "$OUT"

rm -f "$CONCAT_LIST"

# Report
DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT")
SIZE=$(stat -f%z "$OUT")
SIZE_MB=$(python3 -c "print(f'{$SIZE/1e6:.1f}')")

echo ""
echo "=== done ==="
echo "  output:   $OUT"
echo "  duration: ${DUR}s"
echo "  size:     ${SIZE_MB} MB"
