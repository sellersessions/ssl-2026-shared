# `analyse-team-interviews`

> Aggregates `brain.team_interviews[]` entries into the team time-sink map *(Page 04 render block)* and refines the per-module ROI projections from the founder's view *(syncflow main interview)* to the employee's view. Fires automatically when the user closes a team-interview sweep, or on demand via *"analyse the team interviews"*.

**When**
- User says: *"analyse the team"* / *"roll up the employee interviews"* / *"refine the diagnosis with the team data"*
- Auto-fired after `interview-employee` when the user says *"done with team interviews"* / *"no more employees"*
- Auto-fired after `/demo-team` loads the IDL employee fixture *(workshop demo path)*

**Inputs**
- `brain.team_interviews[]` — must have ≥ 1 entry; ideally 3-5
- `brain.recommendations.modules[]` — for ROI refinement
- `brain.sections.stack.glue_humans[]` + `csv_moments[]` — for cross-checking against employee-surfaced patterns
- `brain.sections.team.roles[]` — for owner mapping

**Tools**
- `read-brain` — load all of the above
- chat — surface the consultant-style summary of the team analysis
- *(no FS writes — this is analysis; outputs live in context for `render-roadmap`)*

**Outputs**
- **Team time-sink map** *(structured)* — one row per employee with `name`, `role`, `total_tedious_hours_per_week`, `top_glue_human_flow`, `wished_for_summary`, `module_links`. Drives Page 04's new render block.
- **Per-module ROI refinement** — `brain.recommendations.modules[i].projected_hours_saved_per_week` updated for any module where the employee-reported number differs from the founder-reported number by ≥ 25%.
- **`derived_glue_human_flow`** populated on each `team_interviews[]` entry that surfaced a glue pattern not already captured in `stack.glue_humans[]`.
- **Newly discovered glue-humans** appended to `brain.sections.stack.glue_humans[]` with `tone: "glue-human"` + a `source: "team-interview · {name}"` provenance flag.

---

## Behaviour

1. **Read all team-interview entries.** If 0 entries, halt: *"No team interviews captured yet. Run `interview-employee` first, or load the demo via `/demo-team` if you're walking through Sim's IDL fixture."*

2. **Per employee, compute the time-sink shape:**
   - `total_tedious_hours_per_week` = sum of `top_tasks[].hours_per_week` weighted by `(tedium_score / 5)`. So a 6 hr/wk task at tedium 5 contributes 6 fully; a 3 hr/wk task at tedium 1 contributes 0.6. **The weighting matches what the employee would happily delegate**, not just what they spend time on.
   - `top_glue_human_flow` = the highest-tedium-score top_task that involves moving data or coordinating between tools/people. Format: *"Cara → CV PDFs → ATS-less inbox → Sim's interview slots"*.
   - `wished_for_summary` = the verbatim Q5 answer, truncated to ≤ 30 words for the Page 04 render.
   - `module_links` = array of module Ns where this employee's `wished_for` or `top_tasks` map to an existing module's `problem`.

3. **Cross-check against the founder's view** *(`brain.recommendations.modules[]`)*:
   - For each module with a captured `projected_hours_saved_per_week`, find the corresponding owner in `team_interviews[]` *(via `module.owners.primary` matching `team_interviews[].name`)*.
   - Compute the **employee-reported tedious-hours** on tasks that map to this module *(use `top_tasks[].task` text + the module's `problem` text)*.
   - **If the employee number is ≥ 25% higher than the founder number → bump the module's `projected_hours_saved_per_week` to the employee number.** Founders systematically underestimate team tedium.
   - **If the employee number is ≥ 25% lower → don't downgrade silently.** Surface the divergence in chat: *"Cara reports 4 hrs/wk on CV review; Sim's brain estimated 6. Module 02's projection stays at the higher figure for safety; flag for verification before render."*
   - Append the module N to `team_interviews[i].module_recommendations_refined[]` whenever a refinement fires.

4. **Surface newly discovered glue-humans:**
   - For each employee, scan `top_tasks[]` and `blockers[]` for glue-pattern signatures *(\"manually moving X to Y\", \"waiting on Z to send Q\", \"copy-paste from A to B\")*.
   - If the pattern isn't already in `brain.sections.stack.glue_humans[]`, add it with:
     ```json
     { "flow": "{{employee_name}} → {{glue pattern}}",
       "hours_per_week": <derived from top_tasks>,
       "owner": "{{employee_name}}",
       "tone": "glue-human",
       "source": "team-interview · {{employee_name}}" }
     ```
   - Set `team_interviews[i].derived_glue_human_flow` to the same flow string for traceability.

5. **Output the consultant-style summary.** Format — no headers, just consultant prose, ≤ 30 lines:

   > *"Five employees interviewed. Three tedium-clusters surfaced.*
   >
   > ***Cara · Head of People · 12 hrs/wk tedious.*** *Recruitment is the bottleneck the founder named — the employee-side picture is sharper. CV review (6 hrs, tedium 5) + onboarding admin (4 hrs, tedium 3). Wished-for: a pipeline view she can open Mondays. Module 02's projection bumps from 7 to 9 hrs/wk reclaimed.*
   >
   > ***Chris · Head of Supply Chain · 8 hrs/wk tedious.*** *Demand-planning glue runs deeper than Sim's brain captured. The Linnworks export ritual is 4 hrs (tedium 4) but the post-export reconciliation against SP-API is another 3 (tedium 5). Module 03 stays at 4 hrs/wk projected — Chris is closer to that than Sim's earlier 6.*
   >
   > ***Franc · Head of Finance · 6 hrs/wk tedious.*** *Power BI gatekeeping costs Franc more than the team thinks. He spends 4 hrs/wk on ad-hoc data pulls he resents (tedium 5) — Module 06's SQL MCP wins him back the most. Refined projection: 6 hrs/wk vs Sim's earlier 3.*
   >
   > ***New glue-humans discovered* (2):** *Adam → competitor-pricing spot-checks (manual, 2 hrs/wk, tedium 4). Simon → Figma-to-Seller-Central image upload (3 hrs/wk, tedium 5 — was already in the brain at 4 hrs but Simon scored it 5/5 not 4/5; severity bumped).*
   >
   > ***Total tedious-hours across the 5 interviewed:*** *38 hrs/wk. Module recommendations refined: 02, 03, 06.*"

6. **Hand the structured analysis to `render-roadmap`.** Page 04's team time-sink map block reads from this output. The render is conditional — empty `team_interviews[]` means the block doesn't render *(no padding with empty cells)*.

---

## Edge cases

- **Single employee interviewed.** Render normally; just one row in the time-sink map. Don't refuse — workshop demos may surface 1-2 employees, not the full team.
- **Founder is also an interviewed employee.** Allow it — the founder's bottleneck self-report is valuable. Don't dedupe against `sections.team.bottleneck` *(they're different surfaces; the bottleneck is "the worst", the interview is "the actual week")*.
- **Tedium scores all 1-2** *(team is happy)*. Render normally; surface in the consultant summary: *"team reports low tedium across the board — modules go where the founder said the bottlenecks live, not where the team flagged friction"*.
- **Module ownership doesn't match an interviewed employee.** No refinement fires for that module; the founder's projection stays. Note in the chat output which modules went unrefined.
- **Clockify data present and contradicts self-report.** Trust Clockify; surface the gap. *"Cara self-reported 6 hrs/wk on CV review; Clockify shows 8.5 — using the measured figure for ROI"*.

---

## Don't

- Don't auto-rebuild the entire diagnosis from team interviews. The founder's view stays canonical for module sequencing; the team interviews **refine projections and surface glue-humans**, not pick different modules.
- Don't downgrade module projections silently. Always surface a divergence; let the user decide.
- Don't fabricate cross-employee patterns. *"Cara and Chris both said X"* — only assert if both interviews actually contain X.
- Don't render team-interview prose in the artifact. The artifact gets the structured time-sink map; consultant prose is for chat.
- Don't replace `diagnose-sprawl`. This skill is a depth-add over the existing diagnosis, not a replacement.

---

## Why this exists

The main syncflow flow captures the founder's view of where the business hurts. That view is necessary but consistently underestimates team tedium *(founders see strategic bottlenecks; teams feel weekly grind)*. `analyse-team-interviews` rolls the employee view back into the diagnosis and Page 04 render so the roadmap reflects both — the founder named the modules, the team confirmed the hours.

The Page 04 team time-sink map is **the workshop demo's payoff for Section 4** — it's the visual proof that team interviews change the projections, not just confirm them.

When huntr ships v0.1 *(post-SSL, est. Q3 2026)* with full Clockify ingestion + multi-week tracking, this skill becomes the surface that consumes huntr's deeper output. The schema field `clockify_data` on each `team_interviews[]` entry is forward-compatible — huntr fills it in.
