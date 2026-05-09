# Danny McMillan : SSL 2026

Workshop: **Human in the Loop, Creative Suite** (Sat 9 May 2026)

You're the alchemist. Claude's the engineer.

## Start here: the pipeline-proof hub

Front door for everything in this folder, with the explainer videos, walkthroughs and design system in one place:

**[pipeline-proof.netlify.app](https://pipeline-proof.netlify.app/)**

If you've never seen Claude Code before, watch the explainer videos first. The repos below are deeper-dive material for once you've got the lay of the land.

## The three tools, snapshotted from stage day

For the live versions (with future updates), use the canonical repos:

| Folder | Canonical repo | Purpose |
|---|---|---|
| `claude-ui-workflow-main/` | [sellersessions/claude-ui-workflow](https://github.com/sellersessions/claude-ui-workflow) | Block C1. Brand ingest to Stitch design brief. URL in, locked design prompt out. Working examples in `brands/` (retechuk, databrill). |
| `claude-remotion-flow-main/` | [sellersessions/claude-remotion-flow](https://github.com/sellersessions/claude-remotion-flow) | Block C2. Treatment-driven video factory. Remotion compositions, ElevenLabs voice clone, SFX + music auditioner at `npm run audition`. |
| `claude-video-editing-flow-main/` | [sellersessions/claude-video-editing-flow](https://github.com/sellersessions/claude-video-editing-flow) | Block C3. Per-clip selection pipeline. `python3 scripts/batch-prep.py` walks storyboard, encode and index. |

All three: public repos.

## What's NOT in here (and where to get it)

The repos gitignore heavyweight media (mp4, wav, render output) so the download stays fast. To get those:

- **Walkthrough videos:** all on [pipeline-proof.netlify.app/explainers.html](https://pipeline-proof.netlify.app/explainers.html)
- **Demo media bundles:** GitHub Releases on each canonical repo (e.g. video-editing-flow `v0.1-demo`)
- **Remotion source clips:** recoverable via the project's `MANIFEST.json` + scraper scripts

## How to follow along

1. Open the pipeline-proof hub in a browser. Watch the explainers.
2. Each repo folder has a `README.md` (overview) and a `STAGE-CMD.md` (the exact commands I ran on stage).
3. Open the `README.md` of the tool you want to try first, then `STAGE-CMD.md` for the demo flow.

## Questions

If something's broken or missing, ping the SSL 2026 attendee channel.
