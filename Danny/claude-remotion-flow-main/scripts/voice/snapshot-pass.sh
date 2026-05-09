#!/usr/bin/env bash
# snapshot-pass.sh — copy regen'd line files + the current listen-through into
# a per-pass subfolder, stripping Finder tags so the new pass starts clean.
#
# Usage:
#   ./scripts/voice/snapshot-pass.sh <vo-dir> <pass-name> <line-id,...>
#
# Example (after regen + post-process + stitch):
#   ./scripts/voice/snapshot-pass.sh \
#     public/assets/voice/generated/claude-ui-workflow \
#     pass-4-tone-tweaks \
#     scene-1-hook__L1,scene-7-cta__L3

set -euo pipefail

VO_DIR="${1:?vo-dir required}"
PASS_NAME="${2:?pass-name required (e.g. pass-3-rewrites)}"
LINES="${3:?comma-separated line ids required (e.g. scene-1-hook__L1,scene-7-cta__L2)}"

DEST="$VO_DIR/passes/$PASS_NAME"
mkdir -p "$DEST"

IFS=',' read -ra ids <<< "$LINES"
for id in "${ids[@]}"; do
  src="$VO_DIR/${id}.mp3"
  if [[ ! -f "$src" ]]; then
    echo "  warn: missing $src" >&2
    continue
  fi
  cp "$src" "$DEST/"
done

# Pass folders are pure delta — only the regen'd line files.
# Master listen-through stays in vo-dir for on-demand cohesion check.

# Strip xattrs so previous Finder tags don't bleed into the new pass.
for f in "$DEST"/*.mp3; do
  [[ -e "$f" ]] || continue
  xattr -c "$f"
done

echo "✓ snapshot → $DEST"
ls -1 "$DEST"
