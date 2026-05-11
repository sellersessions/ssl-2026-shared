# `read-implementation-status`

> The "where am I?" view across all modules. Surfaces what's done, what's next, and what's blocked. Doesn't change state — just reports it.

**When**
- User says: *"where am I?"* / *"status"* / *"what's next?"* / *"implementation status"* / *"how am I doing?"*
- User says: *"show me Module 02"* / *"what's the state of Module 02?"* — single-module variant
- At the start of a session if the brain has any modules past `recommended` *(let `restore-brain-from-knowledge` call this so the greeting is informed)*.

**Inputs**
- in-context `brain` *(specifically `brain.recommendations.modules` and `universal_opportunities`)*
- *(optional)* `<module-n>` — single-module focus

**Tools**
- `read-brain` — fetch the modules array
- chat — print the structured status report

**Outputs**
- A scannable text status report *(Markdown in chat)*
- A "next action" recommendation: which module to work on next, OR which T+4 audit is due, OR what's blocked
- Does NOT mutate the brain. Does NOT re-emit the artifact. Read-only.

---

## Behaviour

### 1. Determine scope

If user passed `<module-n>` *(or named a single module)*: single-module deep dive.

Otherwise: portfolio view across all modules.

### 2. Portfolio view

Print a compact table grouped by lifecycle stage. Skip empty stages.

```
syncflow · {{brand_display}} · implementation status
Captured: {{last_updated_at}}

────────────────────────────────────────
Active *(work in flight)*
  Module 02 · Demand Planning              phase_3_complete  →  Phase 4 Surface next
  Module 04 · PPC + Stock Interlock        in_progress       →  Phase 1 Schema in flight

Built but not deployed
  Module 01 · ClickUp OS                   built_v1          →  ready for cloud deploy + monitoring

Closed-loop
  Module 05 · Image Upload Automation      audit_t4_passed   ✓  18 hrs/wk saved → Simon now on US-launch creative

Pending kickoff
  Module 03 · Recruitment Pipeline         planned            →  type "start Module 03"
  Module 06 · SQL MCP Self-Serve           recommended        →  type "plan Module 06" or "start Module 06"

Tolerated
  Module 07 · Buybox + Competitive Monitor tolerated          ·  build cost > saving (logged 2026-04-12)

Universal opportunities (Page 07)
  UW-01  SQPR × PPC gap-filler              not started      →  ~2-3 days, pairs with Module 04
  UW-04  Branded search cannibalisation     not started      →  ~2 days, no deps
  UW-08  A+ content coverage audit          not started      →  ~1 day, no deps

────────────────────────────────────────
Next action *(suggested)*

  Phase 4 Surface for Module 02 — you're 80% through the build. Type "open Module 02"
  to continue, or "plan it" to refresh the build plan if it's been a while.

  Also queued: Module 01's deploy step. Type "deploy Module 01" when you want to run
  through Phase 5 + monitoring setup.

Anything specific? Or "show Module 0N" for a deep-dive on one.
```

### 3. Single-module view

When user names one module:

```
Module 02 · Demand Planning  ·  IDL-circa-12-months-ago
────────────────────────────────────────
Status:           phase_3_complete
Current phase:    Phase 4 Surface (next)
Started:          2026-04-15  (3 weeks ago)
Last update:      2026-05-02

Lifecycle so far:
  recommended         →  2026-04-08
  planned             →  2026-04-15  (build plan generated)
  in_progress         →  2026-04-16  (Sim opened CC session)
  phase_1_complete    →  2026-04-19  (schema migrations live in Supabase)
  phase_2_complete    →  2026-04-24  (SP-API ingestion via n8n)
  phase_3_complete    →  2026-05-02  (forecast logic + thresholds in Claude Code routine)
  Phase 4 Surface     →  in flight

Build plan:           modules/02-demand-planning/build-plan.md
Verification plan:    modules/02-demand-planning/verification-plan.md
CLAUDE.md:            modules/02-demand-planning/CLAUDE.md
Status file:          modules/02-demand-planning/status.json

Stack used:
  Supabase project:   ideal-direct-prod
  n8n instance:       n8n.idealdirect.com
  Claude Code:        on Sim's Mac, paired with this folder

Outcome target:       98% in-stock for the first time
                      Brand managers own the number, not the spreadsheet
                      SQPR + search-volume signals replace historical-sales math

Risks logged:
  · Seller Central API rate limits on the 14-day moving window calc
    Mitigation: cache intermediate results; run incrementally
  · Brand managers resist owning the number — historically the analyst's job
    Mitigation: roll out with Pest X Pro first, prove the win, expand

PM tracking:          ClickUp tasks mirrored
  Phase 1: CU-abc123 ✓
  Phase 2: CU-def456 ✓
  Phase 3: CU-ghi789 ✓
  Phase 4: CU-jkl012 (open — assigned to Chris)
  Phase 5: CU-mno345 (not started)

T+4 audit:            scheduled for 2026-06-02 (after deploy)

────────────────────────────────────────
Next action

  Phase 4 Surface — this is the ClickUp dashboard / Slack alerts / brand-manager
  approval flow that makes the forecast usable. Open the module folder and continue
  in your CC session, or say "build plan for Phase 4" if you want a refresh of the
  Phase 4 spec.
```

### 4. Empty / pre-implementation case

If the brain has zero modules past `recommended` *(no implementation has started)*:

```
syncflow · {{brand_display}} · implementation status

Nothing in flight yet. The roadmap is in the right panel; 7 modules are recommended.
Recommended start: Module 02 · Demand Planning.

When you're ready, type "start Module 02" — I'll generate the build plan,
verification plan, per-module CLAUDE.md, and *(if filesystem MCP is wired)* the
folder structure on your Mac.
```

### 5. Suggested next action *(the algorithm)*

Pick the single most impactful next move. In order of priority:

1. **Modules in flight**: if any module is `in_progress` or `phase_N_complete`, suggest continuing it. The closer to `built_v1`, the higher priority.
2. **Built but not deployed**: if a module is `built_v1`, suggest `deployed` step — that's the Sim P5 cliff most teams stall at.
3. **T+4 audit due**: if `audit_t4.scheduled_for` is past today AND status is `redeployed` AND `audit_t4.passed` is null, suggest the audit. *"Module 0M's T+4 audit was due 5 days ago — type 'audit Module 0M'."*
4. **Redeployment unconfirmed**: if status is `deployed` for >2 weeks AND `redeployed_to` is null, prompt: *"Module 0M deployed 3 weeks ago. Sim P6: have the recovered hours been redeployed? Type 'redeployed Module 0M' to log it."*
5. **Pending kickoff**: if no in-flight modules and any module is `planned` or `recommended`, suggest starting the recommended-start *(or, if that's already built, the next-priority unbuilt module)*.
6. **All-done state**: if every module is at `audit_t4_passed` or `tolerated`, congratulate + suggest `recommend-modules` again to surface the next layer.

Always make the next-action suggestion **specific**: name the module, name the phrase to type, give the rationale.

---

## Format rules

- **Always include the lifecycle history for single-module view.** It's the audit trail Sim's method demands.
- **Always include the "next action" line.** Even if it's *"nothing pressing — your modules are ahead of schedule"*.
- **Use timestamps freely.** Dates are part of the value — *"started 3 weeks ago"* is more useful than *"started"*.
- **Don't pad with empty sections.** If no PM mirror, omit the PM section entirely. If no risks logged, omit risks.
- **Lead with the brand name.** The delegate may have multiple brands; clarity first.

---

## Don't

- **Don't change state.** This skill is read-only. If the user says *"and mark it deployed"* mid-status-check, hand off to `update-module-status` separately — don't bundle.
- **Don't speculate about phases that haven't happened.** *"Phase 4 next"* is fine; *"Phase 4 should take 2 days"* is not — that estimate lives in the build plan.
- **Don't surface `recommend-modules` again unless explicitly asked.** Showing the full module library every time is noise.
- **Don't print module deliverables paths if filesystem MCP isn't enabled.** Those paths are aspirational without the disk mirror.
- **Don't auto-fire other skills.** This is informational. Other skills require user-invoked triggers.
