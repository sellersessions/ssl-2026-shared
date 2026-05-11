# `track-redeployment`

> Captures what the recovered hours from a deployed module were used for. Enforces Sim's P6: *"the hour saved must be redeployed, not just reclaimed."* Transitions module status from `deployed` to `redeployed`. Read alongside `reference/method-principles.md` (P6) and `audit-module-t4`.

**When**
- User says: *"redeployed Module 0N"* / *"the hours from Module 0N went into X"* / *"track redeployment"*
- After a module hits `deployed` and ~2 weeks have passed, `read-implementation-status` flags: *"Module 0N has been deployed for 2 weeks. Sim P6: where are the recovered hours going?"*
- Before `audit-module-t4` runs *(audit needs `redeployed_to` populated)*

**Inputs**
- `<module-n>` — which module
- in-context `brain` *(the module's outcome target + the role/person whose hours were freed)*

**Tools**
- `read-brain` — find the module + the affected role/person
- chat — short structured interview to capture the redeployment
- `update-module-status` *(internal call)* — transition `deployed → redeployed`

**Outputs**
- `brain.recommendations.modules[i].audit_t4.redeployed_to` populated with delegate's verbatim answer
- Module status `deployed → redeployed`
- Confirmation in chat with the captured detail

---

## Why this skill exists

A bottleneck killed but the hours backfilled with admin or low-value coordination is a **failed module**, not a successful one. That's Sim's P6 — explicit, non-negotiable.

Without this skill, modules drift to "deployed" and nobody asks the awkward second question: *"so what's that person doing now?"* The answer determines whether the build was actually worth doing.

This skill is short — 3 questions max — but the discipline it encodes is what separates an *actual* AI-speed business from a team that's just less stressed.

---

## Behaviour

### 1. Identify the module + check eligibility

- Resolve `<module-n>` *(same logic as `update-module-status`)*.
- Read `brain.recommendations.modules[i].status`. Eligible: `deployed`. *(Earlier states need `update-module-status` first; later states already have redeployment captured.)*
- If status isn't `deployed`: *"Module 02 is at `phase_3_complete`, not yet `deployed`. Redeployment tracking only kicks in after the build is running unattended in the cloud. Are you saying it's actually deployed?"*

### 2. Recall the context

Surface the module's targets + the affected person/role:

```
Module 02 · Demand Planning  ·  redeployment check
────────────────────────────────────────
Deployed: 2026-04-12  (3 weeks ago)
Target: ~12 hrs/week recovered for Adam (ex-demand-planner)

Sim's principle P6: hours saved must be redeployed, not just reclaimed.
A bottleneck killed but the time backfilled with admin = failed module.

Three quick questions.
```

### 3. The three questions

**Q1 — What is Adam doing with those hours now?**

> *"Be specific. *"Less stressed"* is a feeling, not redeployment. *"More research time"* is closer but still vague. The good answer names a specific higher-leverage task or initiative."*

Capture verbatim.

**Q2 — Is that the higher-leverage work this freed him up to do?**

> *"Sanity check: when we kicked off Module 02, what were you hoping the freed hours would unlock for Adam? Was it US scaling decisions? Pest X Pro launches? Brand strategy? Something else? — and is what he's doing now matching that?"*

Capture the comparison.

**Q3 — Anyone else's hours affected by this module?**

> *"Often a single module ripples out — e.g. Demand Planning frees Adam, but Chris also stops doing those Friday reorder spreadsheets. Anyone else whose week shifted?"*

Capture as additional context.

### 4. Apply the verdict

The transition `deployed → redeployed` requires Q1 + Q2 to be **substantive**. Substantive = names a specific task / initiative / outcome that's plausibly higher-leverage than the original bottleneck.

| Q1 + Q2 outcome | Verdict |
|---|---|
| Specific higher-leverage work named, matches kickoff intent | Pass — transition `deployed → redeployed`. Capture the answer in `redeployed_to`. |
| Specific work named, but it's lateral (similar level, different domain) | Partial — log it but flag in `audit_notes` for the T+4 audit. *"Lateral redeployment captured. T+4 audit will check if it lands as higher-value."* |
| Vague *("less stress", "more breathing room", "catching up on things")* | Don't transition. Surface: *"P6 is strict — that reads as time reclaimed, not redeployed. Two paths: (1) we wait another 2-3 weeks for the higher-leverage work to settle in, then re-track. (2) Or you have a conversation with Adam about what specifically he should take on with those hours, and we re-track when it's named."* |
| Backfilled with admin / coordination *("Adam's now answering email faster", "more Slack triage")* | Don't transition. P6 violation. *"That's a failure mode Sim's method calls out explicitly — a module that just shifts the admin around isn't done. We can't transition to `redeployed`. Recommend a conversation with Adam this week about what to take off others' plates instead, and we re-track when the answer changes."* |

### 5. If the verdict is "pass"

Update brain:

```json
brain.recommendations.modules[i].audit_t4.redeployed_to = "<Q1 + Q2 verbatim synthesis>"
```

Call `update-module-status`:
- `<module-n>` → `<n>`
- `<new-status>` → `redeployed`
- `<note>` → first line of the verbatim Q1 answer

Confirm in chat:

```
Module 02 · Demand Planning  →  redeployed
────────────────────────────────────────
Hours redeployed to:  Adam now leads US scaling decisions and Pest X Pro
                       launch sequencing — the work he was wishing he had
                       bandwidth for at kickoff.

Plus: Chris (supply chain) stopped doing Friday reorder spreadsheets — that
hour landed back into supplier-relationship work.

T+4 audit on this module is scheduled for 2026-06-02. I'll surface it then
to verify the redeployment held.

Anything else?
```

### 6. If the verdict is "fail"

No status change. Log the conversation, but don't pretend.

```
Module 02 · Demand Planning  →  status stays: deployed
────────────────────────────────────────
Captured: "Adam's mostly less stressed; spends some of the time catching up
on email backlog."

That reads as time reclaimed, not redeployed (Sim P6). Module isn't done
in the framework's sense.

Recommended next:
  → Have a 30-min conversation with Adam this week. Specific question:
    "Now that demand planning isn't your Friday ritual, what's the highest-
    leverage thing you'd take on if you had a clean 12 hours?"
  → Once he names something specific, come back here and I'll re-track.

The module's running; the hours are real. We just haven't closed the loop yet.
```

---

## Edge cases

- **Module is small *(2-3 hrs/week saved)*:** redeployment tracking still applies, but the bar is proportionally lower. *"3 hrs/wk landing into anything substantive — even just better thinking time on the right kind of decisions — counts. Don't over-engineer the redeployment for a small module."*

- **Person whose hours were freed has left the team:** complicated. *"Adam left in May. Module 02's hours technically go away with him. Two paths: (1) the new analyst inherits both the ritual-elimination AND the redeployment intent; we re-track when they're settled. (2) The freed hours go to Jack or someone else absorbing Adam's responsibilities; we capture that."*

- **Multiple people's hours freed *(big module touching several roles)*:** capture each person separately. *"Module 13 freed Adam (12 hrs/wk), Chris (4 hrs/wk), and Tom (2 hrs/wk). Walk me through each — Adam first."*

- **Delegate genuinely doesn't know yet:** push back gently. *"That's worth the conversation this week. T+4 audit on this module is in {{X}} weeks; we want this answered before then."*

- **Hours redeployed inside the same module's verification cycle** *(e.g. Adam now spends time double-checking the demand planning routine)*: that's a verification gap, not redeployment. Surface: *"Adam spending time verifying the routine he no longer manually runs is the build's failure mode, not its success. Should we run `regenerate-section` on the verification plan to address the trust gap?"*

---

## Don't

- **Don't accept vague answers.** *"More breathing room"* is a feeling, not redeployment. Push for specifics.
- **Don't pass the verdict if the redeployment is admin/coordination.** P6 is explicit.
- **Don't transition to `redeployed` to keep the lifecycle moving forward.** Status reflects reality, not progress.
- **Don't skip Q3.** Cross-role ripples are common and easy to miss without the prompt.
- **Don't bundle this with `audit-module-t4`.** They're separate. This skill captures redeployment; the audit verifies it 4 weeks later. If you run the audit before this skill, the audit's Q3 will be empty and the audit can't pass.

---

## Why this skill matters

Sim's principle P6 is the difference between *"we built a thing"* and *"we changed how the business operates."* A module that produces hours nobody fills with higher-value work is fashion — running, looking like a system, achieving nothing structural. This skill is the structured stop-and-ask that prevents that. Three questions; one outcome; closed loop or not.
