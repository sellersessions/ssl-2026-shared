# Changelog

Versions Florence ships at. The number in [`VERSION`](./VERSION) is the source of truth; entries below explain what changed.

Versions follow [SemVer](https://semver.org/) loosely:
- **Major** — breaking changes to the artifact protocol, brain schema, or skill contracts
- **Minor** — new skills, new workflows, new templates that don't break existing ones
- **Patch** — fixes to skill prose, template HTML, or documentation

The brain schema carries its own `schema_version` (currently `1.0`) — that's independent of Florence's release version. Bumping `schema_version` requires a documented migration in `skills/restore-brain.md`.

---

## 0.1.4 — 2026-05-07

Drop SP-API entirely. Add paste-and-fetch product tracking via SellerApp's existing MCP. Florence learns about products by the user pasting ASINs (or amazon URLs) in chat — she calls SellerApp `Get Product Details` per ASIN, caches the full response per `(asin, geo)`, populates `brain.products[]` with title + image + ASIN, and re-renders the cockpit's products page with image thumbnails.

**Why drop SP-API** — three turns of wiring surfaced too much friction: per-seller LWA OAuth registration (1–7 days approval), the `Authorization: Bearer` vs `x-amz-access-token` header mismatch breaking n8n's standard OAuth2 credential, six n8n Variables to set per region, `Get Listings Items` requiring a seller_id path param. Meanwhile SellerApp's `Get Product Details` (already wired, no auth gymnastics) returns title / brand / BSR / sales estimate / price / ratings / images / promotions for any public ASIN at ~14 tokens per call. SP-API only re-enters scope post-workshop if a delegate genuinely needs Brand Analytics SQP or per-seller sales — a `florence-spapi-link` skill stays planned-but-deferred in `_dev/docs/build-stages.md`.

**New skill** — `skills/track-products.md`. Trigger: paste of any string matching `^B0[A-Z0-9]{8}$` or amazon-domain URL in chat (heuristic, no slash command needed) OR explicit `/track-products <list>`. Sequential fetch (one ASIN at a time with status messages between), de-dupe against `brain.products[]`, hard cap at 25 per command. URL → geo inferred from TLD. Bare ASIN → geo from `brain.business.marketplaces[0]`.

**Cache layer** — per-product full SellerApp response stored at `brain/products/{asin}-{geo}.json` with `_meta.fetched_at` timestamp. `/optimize-listing` reads this cache first; only re-fetches if cache is missing or > 24h old. Saves ~14 tokens per audit when the user audits a product they recently tracked.

**Brain schema** — additive `geo` field on `products[]` items (optional, defaults to `brain.business.marketplaces[0]`). `schema_version` stays at `1.0` — back-compat with existing brains.

**Cockpit page 3** — minimal product card grid (image thumbnail + title + ASIN+geo). Inline CSS in `templates/cockpit.html` (`.product-grid` / `.product-card`). Empty state preserved when `brain.products` is empty.

**Onboarding stage 3** — replaced "type ASINs and we'll wire data later" with a hand-off to `/track-products`. Cockpit product cards populate during onboarding instead of staying empty until the first `/optimize-listing` run.

**SP-API removal**
- Deleted: `2-drag-this-folder-into-claude/integrations/amazon-spapi.md` (92 lines)
- Scrubbed mentions across 13 files: integrations README, n8n-webhooks, restore-brain, setup-validate, onboard, florence-help, _inbox-README, cro-process, n8n.md, custom instructions, n8n-workflow-plan, build-stages, presentation, cro-knowledge-mapping, credentials-checklist
- Live n8n master MCP: 3 SP-API Code Tools removed (back to 17 SellerApp tools). Workflow `9RmjDT107uXtrImf`, MCP path stays `florence-sellerapp` (no `claude mcp` re-registration needed).
- n8n Variables `SPAPI_EU_*` / `SPAPI_NA_*` left for the user to delete at their leisure (inert without the tool nodes).

**New files**
- `2-drag-this-folder-into-claude/skills/track-products.md` — the new skill spec

**Updated**
- `2-drag-this-folder-into-claude/templates/brain-schema.json` — `geo` added to `products[]` items
- `2-drag-this-folder-into-claude/templates/cockpit.html` — `.product-grid` / `.product-card` CSS for page 3
- `2-drag-this-folder-into-claude/templates/_placeholders.md` — page 3 body HTML shape documented
- `2-drag-this-folder-into-claude/skills/onboard.md` — Stage 3 hands off to `/track-products`
- `2-drag-this-folder-into-claude/skills/optimize-listing.md` — cache-first read at Step 1
- `0-paste-this-into-custom-instructions.txt` — skill catalogue, trigger map, first-run detection (paste auto-routes)

---

## 0.1.3 — 2026-05-07

SellerApp integration via MCP + new `/optimize-listing` skill. First time Florence calls a third-party data API — chains 5+ SellerApp endpoints into a structured CRO audit in ~30 seconds, no panel-poll wait, no out-of-pocket cost beyond SellerApp tokens.

**Architecture decision** — SellerApp wires as a single n8n MCP server workflow exposing 17 endpoints as Claude-callable tools, not 5 per-endpoint webhooks. Florence-in-Cowork connects via `claude mcp add` and picks tools dynamically from chat. One workflow import, one MCP registration, no per-call URL paste-back.

**New skill** — `/optimize-listing <ASIN>` produces a structured audit: snapshot + top 3 objections (verbatim review quotes + Rufus questions) + top 3 keyword opportunities + competitor angle gaps + 3 actions ranked 40/30/15/15 + "What I'd do today" + reference-file citations + sign-off.

**New files**
- `2-drag-this-folder-into-claude/skills/optimize-listing.md` — the skill spec
- `2-drag-this-folder-into-claude/integrations/sellerapp.md` — full setup walkthrough (n8n sign-up → workflow import → header find/replace → MCP register → restart Claude → verify)
- `2-drag-this-folder-into-claude/reference/sellerapp-api-reference.md` — verbatim mirror of SellerApp's full Postman docs (1404 lines, 23 endpoints)
- `_dev/n8n/workflows/florence-mcp-sellerapp.json` — the MCP workflow (19 nodes, 17 SellerApp tools, hardcoded headers with `REPLACE_WITH_YOUR_*` placeholders so it ships safely in git)

**Updated**
- `2-drag-this-folder-into-claude/templates/brain-schema.json` — additive `integrations.sellerapp` slot tracking MCP connection state
- `2-drag-this-folder-into-claude/skills/recommend-test.md` — decision tree gains fast-audit branch ("just give me ideas → /optimize-listing")
- `0-paste-this-into-custom-instructions.txt` — skill catalogue + trigger map
- `_dev/n8n/README.md`, `credentials-checklist.md` — inventory now 7 workflows; SellerApp section explains the MCP pattern

**Validated end-to-end** against ASIN B0FVD7TGGR (Nord-Ouest Jojoba Oil) using the production MCP URL. Token cost per audit: ~220 (0.001% of 20M monthly quota). Latency: ~50s for 5 chained calls.

**Account note** — SellerApp's API has IP allowlisting; n8n.cloud's egress IPs need to be on the allowlist or every call returns `403 host_not_allowed`. Workshop-shared `support_keplo` account is configured.

---

## 0.1.2 — 2026-05-06

Drop Vercel dependency, frontend prototype, and design handoff. Florence is a Cowork-local project that renders artifacts in Cowork's right panel; there is no hosted frontend, so the frontend code that was sitting in the repo was just dead weight pointing at an architecture path that's been off the roadmap since the artifact-protocol pivot.

**Deleted**
- `_dev/web/` — Next.js frontend prototype (8 page components + Vercel config + Tailwind/PostCSS chain). Was deployed to `florence.vercel.app`. No longer driving any user surface.
- `_dev/design_handoff_florence/` — design handoff folder (JSX components + tokens.md + styles.css + brand SVGs) that fed the dead frontend. Design tokens already encoded inline in `2-drag-this-folder-into-claude/templates/cockpit.html` and `today.html`.
- `_dev/docs/frontend-architecture.md` — planning doc for the Vercel + Supabase tier-2 architecture.
- `_dev/docs/frontend-design-brief.md` — design brief for the dead frontend.

**Updated**
- `_dev/docs/inputs-dorian.md` G6 (hosting target question) marked dropped.

**Action required (out of repo)** — the Vercel project at `vercel.com/keplo/florence` still exists and will keep failing to build until someone deletes or pauses the project in the Vercel dashboard. Suggested: open <https://vercel.com/keplo/florence/settings> → "Delete Project". The domains `florence-keplo.vercel.app` etc. die with it; nothing in this repo references them post-v0.1.2.

**No skill / template / behaviour changes**, no breakage to the Cowork install path, no breakage to the n8n workflows.

---

## 0.1.1 — 2026-05-06

Delegate-facing surface clean-up. Same Florence, fewer files to look at when you unzip.

**Restructure**
- Repo root now shows only what a workshop delegate actually touches: `README.md`, `0-paste-this-into-custom-instructions.txt`, `2-drag-this-folder-into-claude/`, `LICENSE`, plus a single `_dev/` folder.
- Moved into `_dev/`: `n8n/` (backend workflows), `docs/` (planning), `web/` (frontend prototype), `design_handoff_florence/` (designer assets), `CHANGELOG.md`, `VERSION`. Internal references updated.
- Renamed `0-paste-this-into-custom-instructions.md` → `.txt` so it opens as plain text in any default editor (no markdown rendering between the user and the paste target).
- Deleted `1-read-me.md`. Its install steps + troubleshooting are absorbed into `README.md`. One source of truth.

**Why** — the v0.1.0 unzip showed 11+ items at root (CHANGELOG, VERSION, design_handoff, docs, n8n, web, two markdown install files, LICENSE, README, drag-folder). Cognitive load for a non-technical delegate was higher than the install itself. v0.1.1 ships a clean three-step download surface; advanced material moved one level deeper.

**No skill changes**, no template changes, no behaviour changes. Pure repo hygiene.

---

## 0.1.0 — 2026-05-06

First testable scaffold. Pre-workshop. Distributed as a Cowork (Claude Desktop) project template + 6 P0 n8n workflows.

**Architecture**
- Three-file delegate install pattern: `0-paste-this-into-custom-instructions.txt` → Custom Instructions, `1-read-me.md` → reading order, `2-drag-this-folder-into-claude/` → Project Knowledge
- Artifact protocol locked: Cowork's MCP-based `create_artifact` / `update_artifact` reading HTML from disk. No `<script>`, no external CDN, no remote `@font-face` — Cowork's iframe sandbox blocks them. Templates use `{{placeholder}}` substitution.
- Three stable artifact ids: `florence-cockpit`, `florence-today`, `florence-brain`. One id per kind for the entire conversation.

**Skills (7)**
- `/onboard` — first-run brain interview (~10 min). Emits 5 cockpit updates + 1 brain.json.
- `/restore-brain` — re-hydrates state from a `florence-brain.json` uploaded into Project Knowledge. First emission of new conversation.
- `/today` — daily brief with 40/30/15/15 priority scoring.
- `/recommend-test` — decision tree from Matt Kostan's ProductPinion methodology, chat-only.
- `/shopper-interrogator <ASIN>` — full CVR objection-mining loop (review-mining → rufus → Pinion Ask → synthesis → ranking → image blueprint). Workshop demo skill.
- `/setup-validate` — 8-check health view, flips cockpit to health mode in place.
- `/help` — diagnose problems, route to fixes.

**Reference library**
- 19 files mirrored from Keplo's CRO Knowledge Base (master reference, framework reference, research, visual content, copy, data analysis, testing, ProductPinion methodology including Matt Kostan's 2026-05-05 interview)
- 52-tactic main-image library
- Four integrations files: n8n, n8n-webhooks, ProductPinion, Amazon SP-API _(SP-API removed in v0.1.4)_

**n8n backend**
- 6 P0 workflow JSONs: review-mining, rufus-extract, pp-openended-launch, objection-synthesis, pp-ranking-launch, image-blueprint
- Manual import into n8n (free tier — 5 workflows fit, 6th uses the small overhead headroom)
- Credentials checklist + import order documented

**Open questions for v0.2.0**
- Does `create_artifact({ html_path: "./florence-brain.json" })` accept non-HTML files? Test in cold install.
- Where does Cowork's `Write` tool resolve `./` paths? Test in cold install.
- Do the 5 cockpit emissions feel like the right rhythm or chatty? Surface at first delegate trial.

---

## Versioning hygiene

- Bump `VERSION` in the same commit that introduces the change.
- Tag `vX.Y.Z` after the merge to main lands on the release commit.
- The README's "Download" section's tag URL has to track the latest tagged version — bump that line in the same commit as the version bump.
