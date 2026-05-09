# Knowledge Inbox

This folder is where Dorian and Matt drop reference files that
inform Florence's build. Anything here is read directly during Stage 1
implementation alongside `docs/inputs-dorian.md` and `docs/inputs-matt.md`.

## Privacy

**This folder is gitignored.** Files dropped here stay on your local
machine and never get pushed to the public repo. Only the structure
(this README + subfolder `.gitkeep` files) is version-controlled.

That means anything sensitive — Keplo IP, client work, API
credentials in screenshots, internal docs — can land here safely.

## What goes where

### `knowledge/inbox/dorian/`

Reference material from Keplo:

- **Existing CRO agent prompts** — the prompts already running for Keplo
  client work that Florence should inherit voice and structure from
- **Systems Consultant Agent prompt** — `onboard` should mirror its
  interview pattern
- **Hermes Agent self-correcting pattern** — architectural reference
  for skill chains
- **Keplo brand voice guide** — internal style doc, if one exists
- **40/30/15/15 framework spec** — the canonical write-up if it lives
  somewhere already (otherwise written fresh in `docs/inputs-dorian.md`)
- **One fully populated example `brain/` folder** — for a fictional
  brand (Lumen Sleep or similar), so Florence's onboarding can mirror
  the format exactly
- **Sample daily briefs** in Florence's intended voice — even hand-
  written drafts work; they teach the tone faster than adjective lists
- **Brand assets** — Florence wordmark, Keplo logo, brand colors
  reference, typeface specimens

### `knowledge/inbox/matt/`

Reference material from Product Pinion:

- **PP API documentation** — endpoints, auth shape, request/response
  examples
- **PP API key for the workshop** — drop in a clearly-named file; I'll
  wire it into the PP MCP
- **Open-ended poll template** — the JSON or schema you'd use for a
  "what's stopping you from buying this?" poll
- **Ranking poll template** — same for the "rank these 5 objections"
  follow-up
- **Sample PP poll responses** (5+) — anonymised real responses from a
  past project, so I can build and test synthesis without burning
  workshop credits
- **Image generation endpoint docs** — URL, auth, request format,
  available LORAs/style descriptors
- **Sample image-gen outputs** — image files paired with the prompts
  + style metadata that produced them
- **Demo ASIN selection notes** — once chosen, drop the ASIN +
  reasoning + 5 confirmed competitor ASINs here

## How to drop files

1. Save files into the appropriate subfolder
2. Use clear, descriptive names (`keplo-cro-agent-prompt-v3.md`, not
   `untitled.md`)
3. Pair files with metadata where it isn't obvious — a one-line note
   in a sibling `.md` file is fine
4. Don't commit anything from inside this folder — `git status` should
   not show your files

If you accidentally try to commit a file from here, the gitignore
rules will skip it. If something does end up tracked, run
`git rm --cached <file>` and re-commit before pushing.
