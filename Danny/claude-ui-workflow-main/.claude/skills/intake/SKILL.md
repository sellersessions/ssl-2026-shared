---
name: intake
description: Guided interview that captures user intent for a design generation run. Triggers on "/intake", "/intake [brand]", "let's brief a page", "interview me on this", "set up a new landing page", "I want to make an infographic", or any "what should this look like" planning conversation that precedes /design. Outputs a structured intake.json record at brands/<slug>/intake.json that /design and /refine read on the next run.
---

# /intake — Guided Interview

Part of Claude UI Workflow. Sits **between** brand ingestion (B3–B5) and `/design`. The brand answers *"what does it look like?"*. Intake answers *"what are we making, for whom, and why?"*.

Schema: `Claude-UI-Workflow/brands/INTAKE-SCHEMA.md` (machine contract).
PRD section: §6 "Interview and ask questions (guided intake)".

---

## When this skill applies

Route here when the operator says any of:

- `/intake`, `/intake <brand-slug>`
- "interview me on this", "let's brief a page", "ask me the questions"
- "I want to make an infographic / landing page / ad / lifestyle image"
- "set up a new landing page for <brand>", "what do we want to say?"
- Any "before I generate" planning conversation

Do **not** route here when the operator says `/design` directly with a prose
description — that path stays as the existing free-text behaviour (`/design`
checks for `intake.json` and falls back to the prose if missing).

---

## What this skill does

1. Resolve target brand (existing slug under `Claude-UI-Workflow/brands/`, or `adhoc-<date>-<short-name>` for one-off runs).
2. Ask **6 questions** in order. One at a time. Wait for the answer before moving on.
3. Write `brands/<slug>/intake.json` against the schema.
4. Print the path + a one-line "Now run `/design <slug>`" pointer.

The interview is conversational, not a form. If the operator gives a complete answer covering several questions in one reply, advance through them — don't re-ask.

---

## The 6 questions

Ask in this order. **Skip a question only if the answer is already obvious from the conversation context** — never invent answers.

### 1. Output type

> *"What are you making? Pick one — landing page, infographic, lifestyle image, or static ad creative."*

Map the reply to the `output_type` enum (`landing` / `infographic` / `lifestyle` / `ad`). If the operator names something else (e.g. "social card"), pick the closest enum and note the original term in `vibe.tone` or `constraints`.

### 2. Audience

> *"Who is this for? One sentence — role + market."*

Then a follow-up if not covered:

> *"What's the friction this offer relieves for them?"*

Maps to `audience.who` and `audience.pain`. `audience.context` is optional — only ask if the operator seems to want to add detail.

### 3. Offer

> *"What are you offering them, and why does it matter? Plain name first, then the one-sentence value prop."*

Maps to `offer.what` + `offer.value_prop`. Probe for `offer.price` and `offer.format` only if relevant (paid offers, events, software).

### 4. Primary CTA

> *"What's the single action you want them to take? Give me the button label and where it goes."*

Maps to `cta.primary.label` + `cta.primary.url`. URL can be a hash anchor (`#book`) for in-page jumps.

> *"Any secondary action? (Optional — e.g. 'See agenda', 'Read FAQ'.)"*

### 5. Vibe

> *"Three to four adjectives for how this should feel."*

Common picks: premium, minimal, bold, playful, authoritative, friendly, technical, energetic. the operator will often answer with two or three — that's fine, ≥2 is enough.

> *"Any voice / tone notes for the copy?"* (optional)

### 6. Constraints

> *"Anything this page MUST include — sections, guarantees, trust signals?"*

> *"Anything this page MUST avoid?"*

Maps to `constraints.must_include` + `constraints.must_avoid`. `constraints.trust_signals` and `constraints.length_hint` only if the operator offers them.

---

## Skip path (free-text bypass)

If the operator invokes `/intake --skip "<brief>"` or says "I already know what I want, here's the brief…", skip the interview:

1. Take the verbatim brief, save it to `free_text_brief`.
2. Best-effort populate the structured fields by parsing the brief — output type, audience, offer, CTA, vibe, constraints.
3. Mark every field's `source` as `free-text` rather than `intake-skill`.
4. Print a "review the structured fields, run `/intake <slug>` if anything is wrong" hint.

The skip path always still writes `intake.json` — never ephemeral. The
free-text brief is preserved verbatim as the fallback.

---

## Output contract

Single file written: `Claude-UI-Workflow/brands/<slug>/intake.json`.

Shape per `brands/INTAKE-SCHEMA.md`. Required fields:

- `brand`, `version`, `generated_at`, `source`
- `output_type`
- `audience.who`
- `offer.what`, `offer.value_prop`
- `cta.primary.label`, `cta.primary.url`
- `vibe.adjectives` (≥2)

Optional fields are **omitted, not nulled** — match the convention in
`tokens.json` and `ingestion-confidence.md`.

If the brand folder does not exist yet (one-off / adhoc), create it with
just the `intake.json` file. The user can promote it to a full brand later
by running `/ingest-url` or `/ingest-doc`.

---

## After-write pointer

Print, verbatim, on success:

```
✓ wrote brands/<slug>/intake.json
  Required fields: <count>/<count> populated
  Optional fields: <count> populated, <count> skipped

  Next: /design <slug>     — produce the design brief from intake + tokens
        /refine <url>      — audit an existing page (intake also informs refinement)
```

If `brands/<slug>/tokens.json` is missing, add a warning line:

```
  ⚠ No tokens.json yet for <slug>. /design will use generic CSV recommendations.
    Consider: /ingest-url <url> --slug <slug>     (or ingest-doc / refine-from-screenshot)
```

---

## How `/design` consumes this

When `/design <slug>` runs and `brands/<slug>/intake.json` exists:

1. Read `intake.json` first.
2. Use `output_type` to pick which design-db CSVs to weight (landing → `landing.csv`; infographic → `images.csv` + `charts.csv`; ad → `landing.csv` + `interaction-design.csv` heavily; lifestyle → `images.csv`).
3. Use `audience.who` + `audience.pain` to drive copy direction.
4. Use `offer.what` + `offer.value_prop` as the page's core message.
5. Use `cta.primary` + `cta.secondary` to anchor the CTA strategy.
6. Use `vibe.adjectives` to pick from `styles.csv` and weight `polish-details.csv`.
7. Use `constraints.must_include` to force-include sections; `constraints.must_avoid` to add per-run anti-patterns to Section 6.

Section 8 of the design brief ("Next Step") references the intake source for traceability.

---

## Examples

### Interview path

```
the operator: /intake sellersessions-derived
Claude: What are you making? (landing / infographic / lifestyle / ad)
the operator: landing page for SSL 2026
Claude: Who is this for? One sentence — role + market.
the operator: Amazon FBA sellers running £1M+/yr private-label brands
Claude: What's the friction this offer relieves for them?
the operator: Stuck on a revenue plateau, sick of recycled "FBA tips" content
Claude: What are you offering them, and why does it matter?
... [continues through the 6 questions]
Claude: ✓ wrote brands/sellersessions-derived/intake.json
        Required fields: 7/7 populated. Optional fields: 4 populated, 2 skipped.
        Next: /design sellersessions-derived
```

### Skip path

```
the operator: /intake --skip "Landing page for SSL 2026, FBA sellers running £1M+, single-day event 9 May, primary CTA Book ticket /live-2026, premium and high-energy"
Claude: ✓ wrote brands/sellersessions-derived/intake.json (free-text source)
        Required fields: 6/7 populated. Audience.pain not detected from brief —
        consider running /intake sellersessions-derived to capture it.
        Next: /design sellersessions-derived
```

---

## Curriculum note

This skill is part of the Claude UI Workflow giveaway. Bias toward
**clarity over cleverness** in question wording — the audience is
non-designer founders. If the operator ever asks a question to be reworded,
update this file directly.
