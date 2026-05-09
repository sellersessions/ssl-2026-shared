# `today`

**When**
- User says: "today's brief", "what should I do today?", "today", "morning"
- The `daily-brief` routine fires at 8am local time (Cowork Routines)
- First message of the day after onboarding (and `brain.business.brand` is set)

**Inputs**
- In-context brain (must include `business`, `products`, `goals`, `voice`)
- Latest webhook responses (if `integrations.n8n.webhooks.reports-pull` is wired): yesterday's sales/traffic/inventory snapshot
- Most recent `brain.history.last_brief` entry (so today's brief doesn't repeat yesterday's)

**Tools**
- `Write` tool (writes substituted brief HTML to disk)
- Cowork MCP `create_artifact` (first emission of `florence-today` in the conversation) and `update_artifact` (any later emissions in the same conversation)
- `templates/today.html` — single stable id `florence-today`, path `./florence-today.html`
- `templates/_placeholders.md` — substitution contract for the brief
- HTTP via webhook URLs in `integrations.n8n` (when configured)
- Reference: `reference/MASTER-CRO-REFERENCE.md` for action grounding

**Outputs**
- One-screen brief in chat using the structure below
- `florence-today` artifact in the right panel, content mirroring the chat brief
- `brain.history.last_brief` set to today's date
- `brain.history.briefs_emitted` incremented

---

## Behaviour

### Step 1 — Gather context

1. Read in-context brain. If `business.brand` is unset, route to `skills/onboard.md` instead.
2. If yesterday's brief exists in `brain.history`, hold its priority pick — Florence does not repeat the same recommendation two days running unless the underlying signal got stronger.
3. If the listings/reports webhooks are configured, fetch fresh:
   - `reports-pull` — yesterday's sales/traffic/inventory snapshot
   - Skip SQP (monthly cadence, cached separately)
4. If the listings catalog hasn't been pulled in 24+ hours and the listings webhook is configured, schedule a `sync-products` for after the brief (don't run it inline — it's slow).

### Step 2 — Score every candidate action

For each tracked ASIN, score every potential action on the 40/30/15/15 framework:

| Axis | Weight | Question |
|---|---|---|
| **Fidelity** (F) | 40% | How clearly does this address a real, measurable problem? |
| **Impact** (I) | 30% | How big is the upside if we ship it? |
| **Confidence** (C) | 15% | How sure are we (data quality, sample size)? |
| **Reversibility** (R) | 15% | How easy is it to roll back if it underperforms? |

Each axis 0–100. Total weighted score is the priority number. Cite the specific data points behind F and I (C and R are usually obvious from context).

Pick the highest-scoring action across all ASINs as the day's priority. Floor to surface: 60. If nothing scores ≥60, the brief says so honestly: *"Quiet day — nothing scoring above 60. I'd hold."*

### Step 3 — Compose the brief

Use this structure exactly:

```
Morning, {first_name}.

Priority today: {one ASIN, one specific change}.
Score: {N}/100 (40/30/15/15: F={n} I={n} C={n} R={n}).
Why: {one sentence — the data point that drove the score}.

Signals worth knowing:
- {signal 1 — one line}
- {signal 2 — one line}
- {signal 3 — only if genuinely worth surfacing}

Runs scheduled:
- {routine 1 — what runs today and when}
- {routine 2}

What I'd do today: {priority action repeated, in plain language}.

— F.
```

### Step 4 — Emit the artifact

1. Read `templates/today.html` from Project Knowledge.
2. Substitute every `{{placeholder}}` per `templates/_placeholders.md`. Key tokens:
   - `{{weekday}}`, `{{who}}`, `{{action-count}}`, `{{action-lbl}}`, `{{generated-at}}`
   - `{{lede-html}}` — the opener paragraph (mirror chat lede; `<strong>`/`<em>` welcome)
   - `{{actions-html}}` — one `<div class="action priority-…">…</div>` per action (or empty-state block from `_placeholders.md` if no actions)
   - `{{signals-html}}` — one `<div class="sig">…</div>` per ASIN (or empty-state block)
   - `{{noticed-html}}` — one `<div class="note">…</div>` per item (or empty-state block)
   - `{{footer-msg-html}}` — e.g. `Florence is handling <em>4</em> things autonomously today.`
3. Use the `Write` tool to write the result to `./florence-today.html`.
4. **First emission of `florence-today` in this conversation:**
   `create_artifact({ id: "florence-today", html_path: "./florence-today.html", description: "Florence — Today's brief" })`.
5. **Re-emission in the same conversation** (e.g. user asked Florence to refresh after new data):
   `update_artifact({ id: "florence-today", html_path: "./florence-today.html", update_summary: "Refreshed · {short reason}" })`.

Brief content lives in two places — chat + artifact. They mirror each other. Don't add detail in one that's missing from the other.

### Step 5 — Update brain history

```json
"history": {
  "last_brief": "2026-05-06",
  "briefs_emitted": (previous + 1)
}
```

Don't auto-emit a new `florence-brain.json` just for the history bump — that's noise. The user gets a fresh brain at major milestones (end of `onboard`, end of significant `shopper-interrogator` runs).

---

## Voice rules for the brief

- One paragraph max per section.
- Numbers always — "down 12%" not "noticeably lower."
- No emoji. No "Hope you have a great day!" No exclamation points.
- "What I'd do today" is one sentence. Specific. Measurable.

---

## Degraded mode

If only the brain is populated (no webhooks live), the brief skips signals/runs sections and surfaces one missing-piece note at the bottom:

> Note: SQP and reports webhooks aren't connected yet — the priority above is based on what we captured during `onboard`. Wire n8n via `integrations/n8n.md` for sharper recommendations.

---

## Don't

- Don't generate a brief if the brain is empty. Route to `skills/onboard.md` instead.
- Don't recommend the same action two days running unless the underlying signal got stronger. Briefs that repeat themselves train users to ignore them.
- Don't speculate. If the data doesn't support a recommendation, say so: *"Quiet day — nothing scoring above 60. I'd hold."*
- Don't deliver the brief outside Cowork unless the user has explicitly opted in via Slack/Notion integration.
- Don't fabricate signals. If the listings webhook returned nothing, the signals section is empty — and the brief notes why.