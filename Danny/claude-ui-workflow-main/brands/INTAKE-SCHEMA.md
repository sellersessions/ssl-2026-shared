---
project: claude-ui-workflow
last_updated: 2026-04-25
role: intake-schema
---

# `intake.json` — Schema

> Machine-readable record of the user's intent for a generation run. Captured
> by the `/intake` skill (guided interview) and consumed by `/design` so the
> design brief is shaped by the user's stated goal, not just the brand tokens.
>
> Persisted at `brands/<slug>/intake.json` alongside `tokens.json` and
> (eventually) `locks.json`. Re-runnable: a new `/intake` overwrites the file
> with a higher `version`.

---

## Why a separate file?

`tokens.json` answers *"what does the brand look like?"*. `intake.json`
answers *"what are we making, for whom, and why?"*. They are orthogonal:

- The same brand can have many intake records (one per landing page,
  infographic, ad creative, etc.).
- The same intake record could in principle be applied to a different brand
  (rare, but useful for "show me this offer in our other house style").

For curriculum clarity we keep them distinct. `/design` reads both.

---

## Top-level shape

```json
{
  "brand": "<slug>",
  "version": "1",
  "generated_at": "<ISO date>",
  "source": "intake-skill | free-text",
  "output_type": "landing | infographic | lifestyle | ad",
  "audience": { … },
  "offer": { … },
  "cta": { … },
  "vibe": { … },
  "constraints": { … },
  "free_text_brief": "<verbatim user brief, optional>"
}
```

`brand` should match an existing folder under `brands/`. If the user runs
`/intake` for a brand-less / one-off generation, set `brand` to a temporary
slug (`adhoc-<date>-<short-name>`). The folder is still created for parity.

`source` is `intake-skill` for the guided interview output and `free-text`
when the user bypasses the interview (`/intake --skip "<brief>"`). The skip
path still produces an intake.json — the structured fields are populated
best-effort by the skill from the free-text brief, and `free_text_brief`
preserves the verbatim input.

---

## `output_type`

Enum, one of:

| Value | Use case |
|---|---|
| `landing` | Marketing landing page, multi-section, designed to convert. |
| `infographic` | Single-image data/process explainer. |
| `lifestyle` | Product / scene image with brand context. |
| `ad` | Static ad creative (paid or organic placement). |

Drives which sections of the design brief are emphasised. PRD §Core Use
Cases names these four; new types can be added but should be discussed first
to keep the brief generator coherent.

---

## `audience`

```json
{
  "who": "Amazon FBA sellers running £1M+/yr private-label",
  "pain": "Hitting a ceiling with current tooling, can't get cleaner data",
  "context": "Reading the page after a podcast referral or paid ad"
}
```

| Field | Required | Notes |
|---|---|---|
| `who` | yes | One-sentence description. Role + market. |
| `pain` | recommended | The friction the offer relieves. Drives copy. |
| `context` | optional | Where they're arriving from / what state of mind. |

---

## `offer`

```json
{
  "what": "Seller Sessions Live 2026 — 1-day Amazon strategy event",
  "value_prop": "13 speakers, hands-on tactics, no fluff. Sub-£500.",
  "price": "£399 (Early Bird)",
  "format": "in-person event"
}
```

| Field | Required | Notes |
|---|---|---|
| `what` | yes | Plain name of the thing being offered. |
| `value_prop` | yes | One-sentence "why it matters". |
| `price` | optional | Free, paid, tiered. Affects pricing-section logic. |
| `format` | optional | `event`, `software`, `course`, `service`, etc. |

---

## `cta`

```json
{
  "primary": {
    "label": "Book your seat",
    "url": "https://sellersessions.com/live-2026"
  },
  "secondary": {
    "label": "See agenda",
    "url": "#agenda"
  }
}
```

`primary` is required. `secondary` is optional but encouraged for landing
pages (PRD acceptance criterion: "first output matches brand direction
without heavy manual tweaking" leans on a discoverable secondary path).

---

## `vibe`

```json
{
  "adjectives": ["premium", "high-energy", "authoritative"],
  "tone": "confident, no fluff, peer-to-peer"
}
```

| Field | Required | Notes |
|---|---|---|
| `adjectives` | yes | 2–4 words. Free-form; common picks: premium, minimal, bold, playful, authoritative, friendly, technical, energetic. |
| `tone` | optional | Voice guidance for copy. |

---

## `constraints`

```json
{
  "must_include": ["pricing tier", "speaker line-up", "venue + date"],
  "must_avoid": ["countdown timer", "fake scarcity", "stock photography"],
  "trust_signals": ["past attendee logos", "speaker brands"],
  "length_hint": "long-form, scrollable"
}
```

| Field | Required | Notes |
|---|---|---|
| `must_include` | recommended | Sections, elements, or guarantees the page must carry. |
| `must_avoid` | recommended | Anti-patterns specific to this run (the global anti-patterns.csv still applies). |
| `trust_signals` | optional | Logos, testimonials, awards. Drives social-proof placement. |
| `length_hint` | optional | `short`, `long-form`, `single-screen`. |

---

## `free_text_brief`

When the user takes the skip path (`/intake --skip "<brief>"`) the verbatim
text is preserved here. `/design` falls back to this field when a structured
field is missing — this is the "bypass" escape hatch from PRD §6 acceptance
criteria.

---

## Validation rules

- `output_type` must be one of the enum values.
- `audience.who`, `offer.what`, `offer.value_prop`, `cta.primary.label`,
  `cta.primary.url`, and `vibe.adjectives` are required.
- All other fields are optional. Missing fields are omitted, not nulled.
- `vibe.adjectives` is a 2–4 element array of strings.
- `cta.primary.url` is either an absolute URL or a hash anchor (`#section`).
- `version` is a stringified integer; bump on every re-run.

---

## Round-trip example

Minimal record (skip path, "free-text → best-effort structured"):

```json
{
  "brand": "adhoc-2026-04-25-coffee-co",
  "version": "1",
  "generated_at": "2026-04-25",
  "source": "free-text",
  "output_type": "landing",
  "audience": { "who": "Independent coffee roasters" },
  "offer": {
    "what": "Coffee Co subscription",
    "value_prop": "Single-origin beans, weekly delivery"
  },
  "cta": { "primary": { "label": "Try a bag", "url": "/order" } },
  "vibe": { "adjectives": ["warm", "minimal"] },
  "free_text_brief": "Landing page for indie coffee roasters subscription, warm minimal vibe, primary CTA is to try a bag."
}
```

Full record (interview path) lives in `brands/sellersessions-derived/intake.json`
as the curriculum reference.
