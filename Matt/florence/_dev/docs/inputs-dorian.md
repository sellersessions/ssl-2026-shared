# Florence Inputs — Dorian (Keplo)

Fill this in directly. Long-form prose under each prompt is fine and
encouraged — these answers feed straight into `.claude/instructions.md`,
`.claude/skills/onboard.md`, and `knowledge/prioritization.md` with
minimal translation.

For reference files (existing CRO prompts, brand voice guides,
populated example brain folders, etc.), drop them in
`knowledge/inbox/dorian/` — that folder is gitignored, so anything
sensitive stays local.

**Stage 1 blockers** are flagged. Anything else can land mid-week
without holding up the build.

---

## A. Voice & persona  *[STAGE 1 BLOCKER]*

### A1. Who is Florence to the user?

One sentence. Chief of staff? Consigliere? Senior analyst peer? Trusted
critic? This decides whether she defers, pushes back, or commits.

> **Answer:**

### A2. Three adjectives she IS. Three she's NEVER.

> **Is:**
>
> **Never:**

### A3. Two example messages in her voice

One good (a daily brief opener you'd actually want to receive), one bad
(slop she'd never write). 4–5 sentences each.

> **Good example:**

> **Bad example (so I know what to avoid):**

### A4. The sign-off

Exact wording. Same every message, or rotates? If rotating, give the
options.

> **Answer:**

### A5. The "What I'd do today:" line

Exact phrasing. Always one action? Always with a confidence/priority
score? What's the format?

> **Answer:**

### A6. Uncertainty handling

Does she hedge ("might be worth considering…") or commit ("redesign
image #2 — here's why")? When does she change behaviour?

> **Answer:**

### A7. Pronouns

"I" or "we"? Does she call the user by first name, or never?

> **Answer:**

### A8. The Florence Nightingale callback

Does she ever reference her namesake (rose diagrams, "the lady with
the data lamp", the 1854 Crimea cholera-mapping origin story) in
user-facing output, or is that audience-only at the workshop?

> **Answer:**

---

## B. The 8 onboarding questions  *[STAGE 1 BLOCKER]*

For each step, give me: the exact question Florence asks (in her
voice), one good answer, one bad answer + how she nudges, and what
"complete" looks like in the resulting `brain/` file.

If you can drop **one fully populated example `brain/` folder** into
`knowledge/inbox/dorian/` (Lumen Sleep or any fictional brand), you
can skip the per-step "what complete looks like" notes — I'll mirror
the format.

### B1. Brand & what they sell → `brain/business.md`

> **Question (in Florence's voice):**
>
> **Good answer example:**
>
> **Bad answer + nudge:**

### B2. Top ASINs → `brain/products.md`

> **Question:**
>
> **Good answer:**
>
> **Bad answer + nudge:**

### B3. Closest competitors per ASIN → `brain/competitors.md`

> **Question:**
>
> **Good answer:**
>
> **Bad answer + nudge:**

### B4. Team + who Florence tags in Slack/Notion → `brain/personnel.md`

> **Question:**
>
> **Good answer:**
>
> **Bad answer + nudge:**

### B5. Quarterly goal per ASIN → `brain/goals.md`

> **Question:**
>
> **Good answer:**
>
> **Bad answer + nudge:**

### B6. Brand voice (3 adjectives + 3 forbiddens) → `brain/voice.md`

> **Question:**
>
> **Good answer:**
>
> **Bad answer + nudge:**

### B7. Connector OAuth (Slack/Notion/Calendar)

This is mostly tile-board UX, but the *prompt* Florence uses to
introduce it matters.

> **Florence's intro line:**

### B8. Routine schedule confirmation (daily/weekly)

> **Florence's prompt:**
>
> **What changes if user picks Pro vs Max:**

---

## C. The 40/30/15/15 framework  *[STAGE 1 BLOCKER]*

This is referenced everywhere in v2 and `presentation.md` but I don't
have the canonical spec. If a Keplo write-up exists, drop it in
`knowledge/inbox/dorian/`. Otherwise:

### C1. The 4 dimensions with definitions

> **40% — ___:**
>
> **30% — ___:**
>
> **15% — ___:**
>
> **15% — ___:**

### C2. Scoring scale

> **Per-dimension scale (0–10? 1–5? something else?):**
>
> **How are the weights applied — straight weighted average, or
> something else?**

### C3. Score thresholds

> **Ship:** ≥ ___
>
> **Investigate further:** ___ – ___
>
> **Skip:** ≤ ___

### C4. Worked examples

Two or three known scenarios → known scores. These become Florence's
calibration set.

> **Example 1:** [scenario] → score ___ because…
>
> **Example 2:** [scenario] → score ___ because…
>
> **Example 3:** [scenario] → score ___ because…

### C5. Show-the-math rule

Does Florence display the per-dimension breakdown in every artifact,
or just the headline number with the breakdown one click away?

> **Answer:**

---

## D. Existing Keplo assets to lift  *[STAGE 1 BLOCKER]*

Check the box, drop into `knowledge/inbox/dorian/`, and add a path
note here so I know to read it.

- [ ] **Systems Consultant Agent prompt** — file: ____________
- [ ] **Hermes Agent self-correcting pattern** — file: ____________
- [ ] **Existing CRO agent prompts** — files: ____________
- [ ] **Keplo brand voice guide** — file: ____________
- [ ] **Sample daily briefs** in Florence's intended voice — files: ____________
- [ ] **Anything else worth lifting** — note here:

---

## E. Hard "never" list  *[STAGE 1 BLOCKER]*

Concrete examples — Florence enforces these mechanically.

### E1. Words she never uses

> **List:**

### E2. Output structures she never produces

> **List (e.g., "5 ways to…", emoji-laden bullet trees, etc.):**

### E3. Claims she never makes

> **List (e.g., causation from correlation, untested predictions
> stated as fact):**

### E4. Things she never recommends without

> **List (e.g., a prioritization score attached, a confidence level,
> a fallback action):**

---

## F. Visual identity  *[STAGE 1, polish-level]*

Walkthrough deck currently uses a Florence Nightingale-era
navy/cream/rose palette as a placeholder. If Keplo has overrides:

### F1. Brand colors

> **Hex codes:**

### F2. Wordmark or logo for "Florence"

If one exists, drop it as `knowledge/inbox/dorian/florence-wordmark.svg`
(or .png).

> **Path:** ____________

### F3. Typeface preference

> **Answer:**

---

## G. Workshop infrastructure  *[STAGE 6 / STAGE 8]*

Not Stage 1 blockers, but the SP-API one has a 3-day Amazon approval
window — start it early in the week.

### G1. Keplo SP-API developer app

> **Status (not started / submitted / approved):**
>
> **App ID (once approved):**

### G2. Read-only LWA refresh token

Once the app is approved and a token issued for the demo seller
account, drop it in `knowledge/inbox/dorian/spapi-credentials.md`
(remember: gitignored, stays local).

> **Status:**

### G3. Workshop-shared Slack workspace

> **Workspace name + admin contact:**

### G4. Workshop-shared Notion workspace

> **Workspace name + admin contact:**

### G5. Workshop QR code

Generated link target: `github.com/keplo/florence` (assumes repo
transfer — see G7).

> **Generated by (you / me / external designer):**

### G6. ~~Hosting for `florence.keplo.com/install.sh`~~ (dropped v0.1.2)

Dropped. Florence ships as a downloadable folder + Cowork project, no
hosted install script. Delegates download a zip from GitHub Releases.
No Vercel / Cloudflare / S3 dependency.

### G7. GitHub repo public location

Currently `ctrboost/florence` (private). For the workshop QR code to
resolve, transfer to public `keplo/florence`.

> **Plan / status:**

---

## H. Workshop-day operations  *[STAGE 8]*

### H1. Projector machine

> **Hardware spec, OS, who owns it, when it gets the final build:**

### H2. Recorded video backup

Recorded Friday before workshop, played from local disk if Wi-Fi cuts.

> **Owner:**

### H3. Telegram support bot

Trained on the repo + plan + presentation. Answers delegate questions
in the first 2 weeks post-workshop.

> **Owner / hosting:**

### H4. Post-workshop key rotation

> **Rotation date:**
>
> **Slack DM template (Florence's voice):**
