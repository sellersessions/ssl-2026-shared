#!/usr/bin/env bash
# regen-tagged.sh — read Finder colour tags from a per-line VO output dir,
# emit the --only argument string for generate-vo.ts.
#
# Usage:
#   ./scripts/voice/regen-tagged.sh <vo-dir> [color]
#     color = Red (default) | Green | Blue | "Red,Green"
#
# Example: regen all red-tagged lines under claude-ui-workflow:
#   only=$(./scripts/voice/regen-tagged.sh public/assets/voice/generated/claude-ui-workflow Red)
#   node --experimental-strip-types scripts/voice/generate-vo.ts \
#     scripts/voice/claude-ui-workflow.config.json --mode per-scene --only "$only"

set -euo pipefail

VO_DIR="${1:?vo-dir required}"
COLORS="${2:-Red}"

slugs=()
for f in "$VO_DIR"/scene-*__*.mp3; do
  [[ -e "$f" ]] || continue
  tag=$(mdls -name kMDItemUserTags -raw "$f" 2>/dev/null | tr -d '()\n' | tr -s ' ' | sed 's/^ //;s/ $//')
  IFS=',' read -ra wanted <<< "$COLORS"
  for w in "${wanted[@]}"; do
    if [[ "$tag" == *"$w"* ]]; then
      base=$(basename "$f" .mp3)
      slugs+=("$base")
      break
    fi
  done
done

# Print comma-separated slug list (no spaces, suitable for --only)
IFS=','; echo "${slugs[*]}"
