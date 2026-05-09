# Florence — Build Stages

Sequenced build plan derived from the approved planning expansion
(`/root/.claude/plans/lets-expand-planning-1-mossy-squirrel.md` — see
also `docs/walkthrough.html` for the visual companion).

Each stage produces something demonstrable before the next one starts.
Verification per stage is concrete: a command to run, a thing to look
at, and a pass criterion.

---

## Stage 0 — Repo scaffold (foundation)

**Goal:** Empty Florence "shell" that opens cleanly as a Cowork Project.

**Deliverables**
- Remove `.claude/` from `.gitignore`
- `.claude/` skeleton (`instructions.md`, `skills/`, `routines/`, `artifacts/`, `mcp.json`)
- `brain/` template files + `brain/README.md`
- `knowledge/prioritization.md` + seed `knowledge/techniques.json`
- `scripts/install.sh` + `.env.example` (workshop-shared keys inline)
- `README.md` install section rewritten to Cowork flow

**Verify**
- Clone fresh, run `install.sh`, open folder as Cowork Project
- Florence loads with voice from `instructions.md`
- No errors in Cowork
- `brain/` visible empty in file tree
- Cold-install timing ≤2 min

---

## Stage 1 — Voice + brain pattern (`/onboard` v0)

**Goal:** Florence can introduce herself and write to `brain/*.md`.

**Deliverables**
- `.claude/instructions.md` — persona, "What I'd do today" rule, sign-off, 40/30/15/15 mandate
- `.claude/skills/onboard.md` — 8-step interview
- `.claude/artifacts/cockpit.html` — onboarding cockpit template

**Verify**
- Run `/onboard` in a fresh project
- Cockpit artifact renders in side panel
- Answer all 8 steps
- `brain/business.md`, `brain/products.md`, etc. populate after each step
- Cockpit re-renders with progress checks
- Final artifact: "Here's what I know — anything wrong?"

---

## Stage 2 — Secrets infrastructure

**Goal:** Florence stores and retrieves API keys without `.env`.

**Deliverables**
- `.claude/mcp-servers/florence-keys/` (Mac Keychain / Windows DPAPI / libsecret wrapper)
- `/florence-keys set|get|list` skill
- Wire into `.claude/mcp.json`

**Verify**
- `/florence-keys set TEST_KEY abc123`
- Restart Cowork
- `/florence-keys list` shows `TEST_KEY` (no value revealed)
- Confirm key in OS keychain, not in `.env` or repo
- `/florence-keys get TEST_KEY` returns `abc123`
- Resolution-order test: set same key in keychain *and* `.env` → keychain wins

---

## Stage 3 — Cross-cutting plumbing (Slack + scoring)

**Goal:** Every skill from now on can output to Slack and attach a priority score.

**Deliverables**
- Slack MCP wired via Cowork connector
- `/florence-handoff-slack` skill (formats markdown → posts to user's Slack DM)
- `/florence-prioritization-score` skill (40/30/15/15 math, transparent breakdown)

**Verify**
- Trigger `/florence-handoff-slack` with sample markdown payload → DM arrives, formatted
- Trigger `/florence-prioritization-score` with known inputs (data=8, dollar=9, effort=3, speed=7)
- Output matches expected weighted score
- Math shown in sub-artifact

---

## Stage 4 — Skill 3 (Shopper Interrogator) end-to-end

**Goal:** Headline workshop demo skill works on any ASIN.

**Deliverables**
- 6 sub-skills: `review-mining`, `rufus-extract`, `pp-openended-launch`, `objection-synthesis`, `pp-ranking-launch`, `image-blueprint`
- ASIN paste-and-confirm artifact
- Competitor suggest artifact
- Wired together as `/shopper-interrogator <ASIN>`

**Verify**
- Run `/shopper-interrogator B07XYZ` on a known test ASIN
- Image blueprint renders as HTML artifact within 8 min
- Slack DM: "What I'd do today: [action]. Score: NN/100."
- Prioritization breakdown visible
- Re-run on second ASIN → different output, no leaked state
- Force PP latency spike → graceful fallback message

---

## Stage 5 — Daily brief + Routines

**Goal:** Florence shows up every morning without prompting.

**Deliverables**
- `florence-brief-daily` skill (loads from brain + signals → priority pick → "What I'd do today")
- `florence-recap-weekly` skill
- `routines/daily-brief.json`, `routines/weekly-recap.json`

**Verify**
- Import the two routines via `/onboard` step 8
- Manually trigger daily brief → Slack DM arrives
- Set test schedule for `now+5min` → auto-fires at scheduled time
- `briefs/{date}.md` written to project memory
- Friday recap covers the week's tests/recommendations

---

## Stage 6 — Workshop-mode + stage rehearsal

**Goal:** A 100-person room can install + see Florence in action in 3 minutes.

**Deliverables**
- `/onboard --workshop-mode` flag (skips interview, loads `brain/demo/`)
- Pre-built `brain/demo/` for one ASIN (Matt picks)
- Pre-launched PP polls (Tue/Wed) to mask live latency
- "Make it pretty" skill for stage output polish

**Verify**
- Cold install on fresh laptop → `/onboard --workshop-mode` → demo ASIN visible in `brain/products.md`
- Total install + onboard ≤3 min
- Run `/shopper-interrogator <demo-ASIN>` on stage machine
- Image blueprint renders, Slack DM lands, all under 8 min
- Time it 3× consecutively
- Record video backup

---

## Stage 7 — Remaining skills (1, 2, 4) + handoffs

**Goal:** Full Florence (all 4 skills) for the first cohort post-workshop.

**Deliverables**
- Skill 1 — Market Informant (`sqp-watcher`, `listing-snapshot`, `investigation`)
- Skill 2 — Variation Engine (`image-analysis`, `technique-match`, `generate`)
- Skill 4 — Evergreen Tester (`image-pool`, `search-sim`, `pp-tournament`, `results-feedback`)
- Notion task + Designer brief + Calendar block handoffs
- `monitor-error-handler`

**Verify**
- Each skill end-to-end on test ASIN
- Output matches `presentation.md` §4 descriptions
- Prioritization score on every output
- Force a failure (bad ASIN, API timeout) → error handler logs to `brain/errors.md` + posts to `#florence-ops`

---

## Stage 8 — Friday dry run

**Goal:** Workshop-day failure modes eliminated.

**Deliverables**
- Full end-to-end dry run with Matt
- Recorded video backup of every live demo
- Printed QR codes for repo handoff
- Wi-Fi-fail fallback path tested

**Verify**
- Stage 6 cold-install timing repeated under workshop-realistic conditions (slow Wi-Fi simulation)
- Stage 4 demo runs on Dorian's projector machine 5× consecutively without crash
- Backup video plays from local disk if Wi-Fi cuts
- QR resolves to repo

---

## Stage 9 — Post-workshop infrastructure

**Goal:** Delegates have a path to deeper data within 24h of the workshop.

**Deliverables**
- (SP-API integration deferred — v0.1.4 dropped it. Florence uses SellerApp's API for product / keyword / SERP data; SP-API only re-enters scope if a delegate genuinely needs Brand Analytics SQP or per-seller sales data, post-workshop.)
- Workshop SellerApp token rotation (Monday after) — every delegate gets their own SellerApp client-id / token if they want to keep using Florence on their own data
- Florence's "shared SellerApp credentials retired — paste your own" Slack DM
- Telegram support bot trained on the repo + plan + presentation

**Verify**
- Simulate SellerApp credential rotation → Florence MCP returns 406 token-quota error → Florence surfaces the rotation message
- Support bot answers "where do I click for SellerApp" with the right paragraph from `integrations/sellerapp.md`

---

## Cross-stage verification gates

These run as smoke tests on every stage:

| Gate | Pass criterion |
|---|---|
| Cold install | ≤3 min from `git clone` to "Florence loaded" |
| Resolution order | keychain → `.env` → workshop default, in that order |
| No leaks | `gitleaks` pre-commit hook catches stray keys |
| Routine cap | Total active routines ≤5/day (Pro tier limit) |

---

## Mapping to build week

| Day | Stages | Notes |
|---|---|---|
| Mon | 0, 1 | Scaffold + voice |
| Tue | 2, 3 | Secrets + plumbing |
| Wed | 4 | Skill 3 end-to-end |
| Thu | 5, 6 | Routines + workshop mode |
| Fri | 8 | Dry run only — no new code |

Stages 7 and 9 are post-workshop work — not gating the live demo.
