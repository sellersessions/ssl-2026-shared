---
role: dropbox
purpose: Drop the exported Stitch zip here. Claude will unpack + analyse for drift.
---

# Stitch export drop folder

Drop the exported `.zip` from Stitch into this folder when you're done iterating.

When ready, ping Claude with: *"zip is in"* (or anything similar).

Claude will:
1. Unpack the zip to `_unpacked/`
2. Compare HTML/CSS against `stitch-prompt.md` + `brands/retechuk/locks.json`
3. Log every drift finding (font, colour, section ordering, missing decorative elements, missed locks) to `friction-log.md` as findings #19+
4. Surface the drift summary so we decide what /refine has to fix
