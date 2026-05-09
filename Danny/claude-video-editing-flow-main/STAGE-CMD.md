# Stage Command — claude-video-editing-flow (Block C3)

## Primary demo (the new prep wizard)

```bash
cd ../<your-clip-dir>          # any folder with a 00-source/ raw mp4
python3 scripts/batch-prep.py .
```

Walks the storyboard / encode / index pipeline. Shows the rich-panel decision board in the terminal.

## Selection-flow demo (post-prep)

```bash
python3 scripts/picker.py <clip-dir>     # ranked candidate table
python3 scripts/lockin.py <clip-dir>      # confirmation panel
python3 scripts/render.py --edl <edl.json> --out preview.mp4 --format vertical
python3 scripts/verdict.py <clip-dir>     # 4-lane post-render decision
```

## Demo project to use

If no fresh clip is ready: use the existing `pod-test-claude/` sibling dir Danny has been running through this pipeline.

## Notes for stage

- All scripts validated: `python3 scripts/batch-prep.py --help` returns clean usage. Same for picker/lockin/render/verdict.
- The pipeline expects `<clip-dir>/00-source/<name>.mp4` to exist. If running cold, point at a folder that already has the source MP4 in place.
- Sibling repo `video-use/` provides the transcribe + pack pipeline; venv at `../video-use/.venv/`.
