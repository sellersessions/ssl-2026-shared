# `read-brain`

**When**
- Before every interview batch (so you don't ask twice)
- Before `diagnose-sprawl`, `design-future-state`, `derive-replacement-table`, `recommend-modules`, `render-roadmap`
- When the user says *"what have we got so far?"* / *"show me the brain"*

**Inputs**
- *(optional)* `<section>` — `business` / `team` / `stack` / `goals` — to inspect just one section

**Tools**
- working memory — inspect the in-context `brain` object
- *(power-user tier 2 only)* if filesystem MCP is configured AND the user opted in, may also reconcile against `output/<brand>/brain/*.md` on disk in case the user hand-edited

**Outputs**
- Section data inspected and held in working context
- (To user, only when asked) — a summary of what's been captured

---

## Behaviour

1. **Confirm the in-context brain exists.** It should have been initialised by `init-brain` at the start of the conversation. If it doesn't exist *(empty `brain` object or `null`)*, fail loudly — *"No brain in context. Run `init-brain` first."*

2. **Read the requested sections from the in-context brain:**
   - Default: inspect all four (`business`, `team`, `stack`, `goals`).
   - If `<section>` provided: inspect just that one.
   - Also inspect `brain.transcript` for context the structured fields didn't capture *(verbatim user phrasing, retractions, follow-ups)*.

3. **(Tier 2 reconciliation)** If filesystem MCP is configured AND the user opted in, also peek at `output/<brand>/brain/<section>.md` on disk. If the disk version has facts the in-context brain doesn't *(user hand-edited between conversations)*, surface the divergence — *"Disk brain has 3 entries the in-context brain doesn't. Want me to merge?"* Don't auto-merge.

4. **Hold the inspected data in context** for the duration of the next operation. The brain object is already in your working memory; this skill is about being deliberate about reading it.

5. **If the user asked to see the brain:** render a clean summary. Format:

   ```
   Brain · Ideal Direct · 64 facts captured

   BUSINESS
   - Amazon FBA / multi-brand house · 8yr · niche
   - £10M ARR · Amazon UK + EU · ~100 active parent ASINs · top-3 brands = 80%
   - Private label · aggressive scale · 10-20 launches/yr

   TEAM
   - ~15 named (Sim + Jack directors) · Cara Head of People · Chris Head of Supply Chain
   - Bottleneck: recruitment — no ATS, Cara + Sim manage candidates from memory
   - Clockify: not yet (flagged for stack pre-prep)

   STACK
   - 12 paid tools · Microsoft 365 with Teams bundled
   - Prerequisites kept: Helium 10 (KW), Datadive, Seller Central, Brand Analytics
   - Retire-eligible: Scale Insights (£300) · Microsoft Teams (bundled · clutter) · Power BI (£100)
   - Source of truth: Seller Central + Linnworks (Chris's domain)

   GOALS
   - 12mo: launch Rooted Human, scale to US + EU, hire A-players
   - Magic wand: scalable recruitment + real demand planning + ClickUp as OS
   - Why not yet: time + clarity on where to start
   ```

6. **Don't show the structured object to the user.** That's machine-readable; their summary should read like a consultant brief.

---

## When the brain is incomplete

If a section is sparse (less than half its expected fields populated), call out the gap:

> *"Stack has 4 facts captured — typical brain has ~15 in this section. Want to keep going through Section 3 batches before we render?"*

Don't auto-fill missing facts. Empty is a signal — flag it.

---

## Don't

- Don't fabricate fields. If `top3_concentration` is missing, say so — don't guess "probably 50–60%."
- Don't reorder fact entries when summarising. Keep them in capture order; that's the audit trail.
- Don't return the brain as JSON to the user. Render the consultant summary instead. *(JSON serialisation is `emit-brain-artifact`'s job, not this one.)*
- Don't cache stale data. The in-context brain is the live source of truth — always inspect the latest object, not a copy you held earlier.
- Don't assume disk persistence is on. Default flow inspects the in-memory brain only.
