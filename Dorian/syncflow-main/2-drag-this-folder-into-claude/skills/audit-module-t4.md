# `audit-module-t4`

> Sim's T+4 weeks audit (method P9). Verifies that hours were actually saved AND the tool is still running unattended AND the recovered hours got redeployed. Closes the loop on a module — or sends it back for rework. Read alongside `reference/method-principles.md` (P5, P6) and `reference/implementation-phase.md` Principle 4.

**When**
- User says: *"audit Module 0N"* / *"T+4 audit Module 0N"* / *"how's Module 0N performing?"*
- `read-implementation-status` flags a module whose `audit_t4.scheduled_for` is past today AND status is `redeployed` AND `audit_t4.passed` is null
- During session start, `restore-brain-from-knowledge` notices an overdue audit and surfaces it in the greeting

**Inputs**
- `<module-n>` — which module
- in-context `brain` *(the module's `audit_t4` block + recommended targets)*
- `reference/method-principles.md` — for the P5/P6 framing

**Tools**
- `read-brain` — inspect current state
- chat — run the structured audit interview
- `update-module-status` *(internal call)* — transition to `audit_t4_passed` OR back to `built_v1`/`deployed` if audit failed
- `update-brain` *(internal)* — write the audit results to `audit_t4`

**Outputs**
- Updated `brain.recommendations.modules[i].audit_t4` with actual numbers + outcome
- Module status transitioned to `audit_t4_passed` *(success)* OR back to a prior state with audit_notes describing what failed
- A summary in chat showing the audit pass/fail + the redeployment context

---

## The three checks *(Sim's P5 + P6 + tool uptime)*

A T+4 audit asks three concrete questions. **All three must pass for `audit_t4_passed`.**

1. **Hours saved actual vs target.** *"At kickoff we said this module would save Adam ~12 hrs/week. Re-run the time check (Clockify, calendar audit, gut estimate ranked highest-to-lowest priority): how many hours/week is Adam actually saving now, 4 weeks in?"*
2. **Tool uptime / unattended operation.** *"In the past 4 weeks, has the tool run unattended? Any laptop-was-asleep failures, manual restarts, key-rotation lapses, monitoring gaps?"*
3. **Hours redeployed.** *"What's Adam doing with the recovered hours? Higher-leverage work? Or has it been backfilled with admin / coordination / 'busy work'?"* *(Sim P6: an hour reclaimed but not redeployed is a failed module.)*

If all three pass: `audit_t4_passed`. Closed-loop.
If any fails: don't pretend. Roll status back; capture what failed; recommend next move.

---

## Behaviour

### 1. Identify the module + check eligibility

- Resolve `<module-n>`. Same logic as `update-module-status`.
- Read `brain.recommendations.modules[i]`.
- Audit only makes sense if the module has reached `redeployed`. If status is earlier:
  - `deployed` (no `redeployed` step yet): *"Module 02 is at `deployed` but the recovered hours haven't been logged as redeployed yet. The T+4 audit checks redeployment too — let's run `track-redeployment` first, then come back to the audit."*
  - Earlier than `deployed`: *"Module 02 hasn't been deployed yet (status: phase_3_complete). T+4 audit only applies after the module's been running unattended for 4 weeks. Are you saying it's actually deployed and we missed updating the status?"*

If `audit_t4.passed` is already true, this is a re-audit. Allow it but note: *"Module 02 already passed its T+4 audit on {{date}}. Want to re-audit (e.g. T+8 check)? I'll add a new entry to status_history but won't change the module's terminal state."*

### 2. Surface the targets *(set at kickoff)*

Before asking for actuals, show what was promised:

```
Module 02 · Demand Planning · T+4 audit
────────────────────────────────────────
Deployed: 2026-04-12  (28 days ago)

Targets we set at kickoff:
  Hours saved per week: ~12 (Adam — demand planning ritual)
  Outcome:              98% in-stock for the first time
  Key metrics:
    · Stockout frequency (target: <2%)
    · Manual planning hours/week (target: <30 min)
    · SKU-level forecast accuracy (target: >85%)

Now: 3 quick questions to close the loop.
```

### 3. Run the three checks

**Question 1 — hours saved actual:**

> *"What's the actual hours saved per week? Best-quality answer first:*
>
> *— If you re-ran Clockify on Adam this past week: that number.*
> *— If you have a calendar/diary audit: count the hours that used to go to manual planning that are now elsewhere.*
> *— Otherwise: gut number from talking to Adam.*
>
> *Either way, give me an honest figure (or range). Don't round to the target."*

Capture as `audit_t4.hours_saved_per_week_actual: <number>`.

**Question 2 — tool uptime:**

> *"In the past 4 weeks, the tool: (a) ran without incident, (b) had X manual interventions, or (c) broke and is still broken. Which?"*

Capture as `audit_t4.tool_uptime_percent: <number>` *(rough — 100 if never touched, 95 if a few interventions, <90 if real breakage)*. Capture detail in `audit_notes`.

**Question 3 — redeployment:**

> *"What's Adam doing with the recovered ~{{hours_saved}}/week? Be specific:*
>
> *✓ Higher-leverage work *(naming a specific better use)*: the audit passes Sim's P6.*
> *— Same role, just less stress: partial — the hours are reclaimed but not redeployed.*
> *— Backfilled with admin / coordination / lower-tier work: P6 violation. Module is incomplete even if it's running."*

Capture as `audit_t4.redeployed_to: <delegate's verbatim answer>`.

### 4. Apply the audit logic

Compute pass/fail:

```
hours_saved_actual >= 0.7 * hours_saved_target   → check 1 PASS
                                                   (70% threshold; allow some optimism slippage)
tool_uptime_percent >= 95                        → check 2 PASS
redeployed_to != null AND
  redeployed_to indicates higher-value work       → check 3 PASS
                                                   (Sim P6 — be honest; "less stress" doesn't count)

ALL THREE PASS → audit_t4_passed
ANY FAILS      → audit_t4 captured; status rolled back per the failure
```

Failure-mode routing:

| Failure | Status routing | Next step |
|---|---|---|
| Hours saved under target *(<70% of target)* | Status stays `redeployed`. `audit_t4.passed: false` with rationale. | Recommend revisiting the module — was the build wrong? Are users not adopting? Don't claim it's done. |
| Tool uptime <95% | Status rolls back to `built_v1` *(it's not actually `deployed` if it's not unattended)*. `audit_t4.passed: false`. | Recommend Phase 5 rework: monitoring, alerts, key rotation, whatever broke. |
| Redeployment unsuccessful | Status rolls back to `deployed` *(not `redeployed` if hours weren't actually moved)*. `audit_t4.passed: false`. | Coach the delegate: *"Sim's P6 — the hours have to land somewhere higher-value or this module is incomplete. What's Adam's bandwidth now? Is there a higher-leverage task waiting for him?"* |

### 5. Write the audit + transition status

Update brain:

```json
brain.recommendations.modules[i].audit_t4 = {
  scheduled_for: <unchanged>,
  passed: <true|false>,
  hours_saved_per_week_actual: <number>,
  hours_saved_per_week_target: <copied from kickoff>,
  tool_uptime_percent: <number>,
  redeployed_to: "<delegate's verbatim answer>",
  audit_notes: "<your synthesis of the conversation>"
}
```

Then call `update-module-status`:
- Pass → `audit_t4_passed` *(terminal-success)*
- Fail → roll back per the table above

### 6. Output the summary

**Pass case:**

```
Module 02 · Demand Planning  →  audit_t4_passed
────────────────────────────────────────
Hours saved:    actual 18/wk  (target 12/wk)            ✓ above target
Tool uptime:    99.7%                                    ✓ unattended
Redeployed to:  Adam now leads US scaling decisions      ✓ higher-value (Sim P6)

Closed-loop. Module is done. Nothing else needed on this one.

Anything else? Or "status" for the portfolio view to pick the next move.
```

**Fail case (example: hours below target):**

```
Module 02 · Demand Planning  →  audit_t4 FAILED  (status stays: redeployed)
────────────────────────────────────────
Hours saved:    actual 4/wk   (target 12/wk)            ✗ at 33% of target
Tool uptime:    99%                                      ✓ unattended
Redeployed to:  some research time, mostly less stress   △ partial

Where it landed: Adam reports the routine is technically running, but he's
still spot-checking it half-an-hour a day "to be safe." That's the gap — the
build hit a trust-not-tech ceiling.

Recommended next:
  → Pair Adam with the routine for one week (you watch over his shoulder
    once, then he watches it run twice unattended). If the trust shifts, hours
    saved climb.
  → Re-audit at T+8 weeks.

Want me to log a recheck date? Or run "regenerate-section" for the verification
plan to add a trust-shift checkpoint?
```

---

## Edge cases

- **Audit timing isn't strictly T+4** *(e.g. delegate forgot, runs it at T+8)*: still valid. The "T+4" framing is Sim's recommended cadence; the audit checks the same three things regardless of elapsed time. Note the actual elapsed weeks in `audit_notes`.

- **Multiple modules due for audit at the same session**: don't bundle. Run audits one at a time. Each module gets the full structured interview.

- **Audit interrupted mid-flow** *(delegate types something off-topic mid-Q2)*: capture what's been collected, set status to `pending` *(neither `audit_t4_passed` nor failed yet)*, surface: *"Audit paused mid-flow. Continue with Q3 (redeployment) when you're ready."*

- **Delegate doesn't know the actual hours** *(no Clockify, no diary, vague gut sense)*: this is itself a finding. Surface: *"Without a measurable hours figure, the audit can't really pass — that's a Sim P5/P6 framing rule (gut estimates aren't proof). Want to do a 1-week Clockify on Adam right now and re-audit?"*

- **Tool actually broke and was patched mid-period** *(uptime question gets murky)*: capture both the patches and the resulting uptime. *"Tool broke once at week 2, patched in 2 hrs. Otherwise unattended. Uptime ~98%."* — passes the threshold.

- **Redeployment is genuinely unclear yet** *(only 4 weeks since deploy; hours haven't found their permanent home)*: gentle push. *"Often takes a few months for the redeployment to stick. If you're <8 weeks in and it's still settling, set this audit to 'partial pass' with a re-audit at T+8 — I'll surface it then."*

---

## Don't

- **Don't pass the audit on vibes.** Numbers or it didn't happen. Sim's method is data-not-opinion.
- **Don't pass when redeployment is *"less stress"*.** P6 is explicit: hours have to land somewhere higher-value.
- **Don't auto-fail and shame the delegate.** A failed audit is a finding, not a verdict on the team. The next move is rework, not blame.
- **Don't skip the targets-recall step.** Showing what was promised before asking for actuals keeps the conversation honest.
- **Don't combine the audit with `track-redeployment`.** They're separate skills with separate triggers. If redeployment hasn't been logged, prompt for it first, then come back here.
- **Don't accept *"all good"* as Q1 answer.** *"All good"* without a number is a refusal. Push for the figure.

---

## Why this skill matters

Without T+4 audit, modules drift back to their pre-build state and nobody notices. The roadmap looks complete on paper; reality is still chaos. Sim's method P9 exists precisely because *"shipped"* is not the end — *"audited and still working at T+4"* is. This skill encodes that discipline.
