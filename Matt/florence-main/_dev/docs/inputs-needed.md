# Florence — Inputs Needed From The Team

Split of who-owns-what so Dorian (Keplo) and Matt (Product Pinion) can
prepare in parallel without blocking each other. Items marked
**[STAGE 1]** are blocking the immediate next build step; the rest
unblock later stages.

---

## Dorian (Keplo) — Identity, framework, brand, infra

### A. Florence's voice & persona  **[STAGE 1]**

- [ ] **Who Florence is to the user.** One sentence. Chief of staff? Consigliere? Senior analyst peer? Trusted critic? (Affects whether she defers, pushes back, or commits.)
- [ ] **Three adjectives** that describe how she speaks. Three adjectives she's *never*.
- [ ] **Two example messages** in her voice — one good (a daily brief opener you'd actually want to receive), one bad (the slop she'd never write). 4–5 sentences each is enough.
- [ ] **The sign-off.** Exact wording. Same every message, or rotates?
- [ ] **The "What I'd do today:" line.** Exact phrasing. Always one action? Always with a score? Format?
- [ ] **Uncertainty handling.** Hedges or commits?
- [ ] **Pronouns.** "I" or "we"? Calls user by first name, or never?
- [ ] **Florence Nightingale callback.** User-facing or audience-only?

### B. The 8 onboarding questions  **[STAGE 1]**

For each of the 8 steps in `/onboard`:

- [ ] Exact question (in Florence's voice)
- [ ] Example "good" answer
- [ ] Example "bad" answer + how she nudges
- [ ] What "complete" looks like in the resulting `brain/<file>.md`

Plus:

- [ ] **One fully populated example `brain/` folder** for a fictional brand (Lumen Sleep, or pick another). Lets me mirror format exactly.

### C. The 40/30/15/15 framework  **[STAGE 1]**

- [ ] The 4 dimensions with definitions (Data / Dollar / Effort / Speed?)
- [ ] Scoring scale (0–10 per dimension?)
- [ ] Score thresholds: ship vs skip vs investigate
- [ ] 2–3 worked examples (scenario → known score)
- [ ] Show-the-math rule: does Florence display the breakdown, or just the headline?

### D. Existing Keplo assets to lift  **[STAGE 1]**

- [ ] **Systems Consultant Agent prompt** — `/onboard` is supposed to mirror its interview pattern
- [ ] **Hermes Agent self-correcting pattern** — architectural inspiration for skill chains
- [ ] Existing **CRO agent prompts** running at Keplo
- [ ] **Keplo brand voice guide** (if any) that should inform Florence's tone

### E. Hard "never" list  **[STAGE 1]**

- [ ] Words Florence never uses (e.g., "leverage", "synergize", "delve")
- [ ] Output structures she never produces (e.g., "5 ways to…" listicles)
- [ ] Claims she never makes (e.g., causation from correlation)
- [ ] Things she never recommends without (e.g., a prioritization score attached)

### F. Visual identity  **[STAGE 1, polish-level]**

- [ ] Brand colors (hex codes) — for Cockpit + dashboard artifacts
- [ ] Wordmark or logo for "Florence" (if any)
- [ ] Typeface preference

Walkthrough deck currently uses a Florence Nightingale-era navy/cream/rose palette as a placeholder; happy to keep if no brand override.

### G. Workshop infrastructure  **[STAGE 6 / Stage 8]**

- [ ] **Keplo SP-API developer app** registration with Amazon (takes ~3 days to approve — start now if not already done)
- [ ] **Read-only LWA refresh token** from the registered app, scoped to demo-ASIN allow-list
- [ ] **Workshop-shared Slack workspace** for delegates' first-day experience
- [ ] **Workshop-shared Notion** workspace (same)
- [ ] **Workshop QR code** generation (for `github.com/keplo/florence` deep link)
- [ ] **Hosting** for `florence.keplo.com/install.sh` (one-line installer endpoint)
- [ ] **GitHub repo** transfer to public `keplo/florence` if not already there (currently `ctrboost/florence`)

### H. Workshop-day operations  **[STAGE 8]**

- [ ] **Projector machine** with Cowork installed and project pre-opened
- [ ] **Recorded video backup** of every demo (record Friday)
- [ ] **Telegram support bot** training data — the repo, the plan doc, the presentation
- [ ] **Post-workshop key rotation** schedule + Slack DM template

---

## Matt (Product Pinion) — Polling, image gen, demo content

### A. PP API access  **[STAGE 4]**

- [ ] **PP API documentation** — endpoints, request/response shapes, auth header format
- [ ] **PP API key** for the workshop, with **$500 cap** agreed
- [ ] **Rate limits** per key — so we know how many concurrent polls we can run during the live demo
- [ ] **Webhook callback URL spec** if PP fires back when polls complete (or polling-required pattern)
- [ ] **MCP server status:** does PP already expose an MCP server, or do we wrap the REST API in one? If wrapping, who builds it (Matt or Dorian)?

### B. Poll templates  **[STAGE 4]**

For the **Shopper Interrogator** chain Florence will run:

- [ ] **Open-ended poll template** — "What's stopping you from buying this?" style. Sample size, audience targeting, expected latency.
- [ ] **Ranking poll template** — given 5 objections, which is the biggest deal-breaker? Sample size, audience, latency.
- [ ] **Pre-canned variants** for the demo if live polls would take too long: cached results for the demo ASIN that Florence loads when `--workshop-mode` is set.

### C. Demo ASIN selection  **[STAGE 6]**

- [ ] **One ASIN** picked as the "audience-facing" demo product. Criteria: well-known category, strong existing review base (≥100 reviews), at least 5 obvious competitors with similar review depth, not too niche.
- [ ] **Pre-launched PP polls** on that ASIN — fired Tuesday/Wednesday before the workshop so results are ready when Florence runs the chain on stage.
- [ ] **5 confirmed competitor ASINs** for the demo product (so we don't depend on live SQP fetching during the stage demo).

### D. Image generation  **[STAGE 2 of Skill 2 — post-MVP]**

- [ ] **Matt's GPT-2 image gen endpoint** — URL, auth, request format
- [ ] **$500-cap budget** confirmation for the workshop
- [ ] **Latency expectations** per image (so Variation Engine knows what's feasible during a live demo vs. async)
- [ ] **Style-control inputs** the endpoint accepts (LORAs, technique descriptors, etc.)

### E. Sample data for testing  **[STAGE 4 build week]**

- [ ] **5 sample PP poll responses** (open-ended + ranking) for a known test ASIN, so I can build and test the synthesis skill without burning live PP credits
- [ ] **5 sample image-gen outputs** with the prompt+style metadata that produced them, for the technique-match skill
- [ ] **Known-good objection clusters** from a past PP project — so we can validate Florence's synthesis output against real ground truth

---

## Shared decisions (need both Dorian + Matt aligned)

- [ ] **Demo ASIN choice** — Matt picks, Dorian confirms it fits the workshop narrative
- [ ] **Stage rehearsal slot** on Friday — both available
- [ ] **Live vs. cached demo** — fully live PP polls on stage, or pre-canned to mask latency? Affects PP credit budget and demo risk.
- [ ] **Workshop key custody** — who holds the master tokens, who rotates them Monday after, who fields delegates' "my keys broke" tickets

---

## Suggested order of preparation

1. **This week:** Dorian sections A–E (voice + framework + existing assets) → unblocks Stage 1 build immediately
2. **This week:** Matt sections A–B (PP API access + poll templates) → unblocks Stage 4 design
3. **Next week:** Matt section C (demo ASIN + pre-launched polls), Dorian section G (SP-API app, hosting)
4. **Build week:** Matt section D, E (image gen + sample data); Dorian section H (workshop ops)

The minimum that unblocks Monday's start of the build is **Dorian sections
A, B, C, E** — the rest can land mid-week without breaking flow.
