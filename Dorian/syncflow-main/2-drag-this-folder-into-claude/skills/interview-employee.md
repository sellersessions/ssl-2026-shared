# `interview-employee`

> Per-employee time-sink interview. Runs **after** the main 5-section interview + `recommend-modules` complete. 6 questions, 6-10 minutes per employee. Captures their actual week — what they spend time on, what they hate, what blocks them, what they wish a system could do — into `brain.team_interviews[]`. Drives Page 04's team time-sink map and refines per-module ROI projections from the founder's view *(syncflow's main interview)* to the employee's view.

**When**
- User says: *"interview employee {name}"* / *"add team data for {name}"* / *"capture {name}'s week"*
- After `recommend-modules` has run AND `brain.sections.team.roles[]` has the named employee
- During Section 4 of the workshop demo path *(see `templates/sample-team-interviews-ideal-direct.json` for the canonical IDL fixture loaded by `/demo-team`)*
- **Not before** the main interview completes — captures the founder's view first, employee view second; the founder's bottleneck framing primes the employee questions

**Inputs**
- `<employee-name>` — must match an entry in `brain.sections.team.roles[].name`
- in-context `brain` — main interview must be complete; team-interviews is a depth-add, not a replacement

**Tools**
- chat — ask the 6 open questions, listen, probe
- `read-brain` — load the named employee's `roles[]` entry for context *(role + main_outputs)*
- `capture-fact` — append the answers as a `team_interviews[]` entry
- FS — append to `interview-transcript.md` after every exchange *(employee section)*

**Outputs**
- `brain.team_interviews[]` gets one new entry with `name`, `role`, `interviewed_at`, `time_pattern`, `top_tasks[]`, `blockers[]`, `wished_for`, optionally `clockify_data`
- `brain.transcript` extended with the per-employee exchange
- Brain status: ready for `analyse-team-interviews` *(fires automatically after this captures, OR after N employees if running a sweep)*

---

## The 6 questions — order is locked

```
Q1.  Time pattern             "Walk me through a typical week — what does a normal Monday morning look like, and where does the time go from there?"
Q2.  Top 3 tasks              "What are the 3 things you spend the most time on? Hours per week ballpark."
Q3.  Tedium scoring           "Per task — score 1 to 5: 1 = you'd happily keep doing it forever, 5 = you'd have a robot do it tomorrow."
Q4.  Blockers                 "What are you most often waiting on? People, data, decisions, tool friction — name the top 2."
Q5.  Wished-for               "If a system could do one thing for you tomorrow, no constraints, what would it be?"
Q6.  Clockify check (opt)     "Any time tracking running on your week? Clockify, Toggl, anything? If yes, drop the last week's CSV summary."
```

Total: 6-10 minutes per employee. Don't extend; the depth comes from running 3-5 employees, not asking 12 questions of one.

---

## Per-question pattern

1. **Read the brain first.** Load the employee's `roles[].name`, `roles[].role`, `roles[].main_outputs`. Reference these in the opener — *"Cara, you're Head of People at Ideal Direct — Sim's brain says recruitment is the #1 bottleneck and you + Sim manage candidates from memory. Want to walk me through your typical week?"*
2. **Open with Q1.** No multi-question stacking. *"Walk me through a typical week."*
3. **Listen. Don't probe** unless the answer is < 30 seconds — these are quiet operators, give them room.
4. **Capture verbatim** the time pattern *(it's the highest-signal answer — the rhythm of the week tells syncflow more than the task list)*.
5. **Move to Q2-Q3 together** — *"the top 3 things you spend the most time on, with rough hours and a tedium score 1-5"*. Capture as `top_tasks[]` with all three fields populated. **Push back if hours are vague** — *"a few hours"* needs a number.
6. **Q4 single open** — blockers. Capture as `blockers[]` array, top 2 named.
7. **Q5 verbatim** — wished_for is the magic-wand answer. Capture word-for-word. This anchors the per-employee module recommendation refinement.
8. **Q6 conditional** — if Clockify / Toggl / time-tracking surfaced as `yes` in the main interview's `team.clockify_data`, ask. If `no`, skip.

---

## Probes *(only when an answer is thin)*

- **Time pattern thin** *(< 30 sec, no rhythm named)*: *"Walk me through Monday vs Friday — what's different? When does fire-fighting tend to happen?"*
- **Top tasks vague** *("not sure", "depends on the week")*: *"Pick last week. What did you actually do Monday-Friday? List 3 things, even imperfectly."*
- **Tedium score uniform** *(everything's a 3)*: *"If you had to pick one to never do again, which would it be? That one's a 5."*
- **Blockers named as people** *(\"I'm waiting on Sim\" / \"I'm waiting on Chris\")*: *"What specifically — a decision they need to make, data they're sitting on, sign-off?"*. **The shape of the dependency** is the diagnostic value, not the name.
- **Wished-for is generic** *(\"I'd love AI\")*: *"Right — but for what specifically? One concrete task, one specific output."*

---

## Capture format

Append to `brain.team_interviews[]`:

```json
{
  "name": "Cara",
  "role": "Head of People",
  "interviewed_at": "2026-05-08T14:32:00Z",
  "interview_minutes": 8,
  "time_pattern": "Mondays = candidate review (3hr), recruitment outreach all morning. Tuesdays-Thursdays = onboarding new hires + ad-hoc people issues. Fridays = scorecard + perf review prep. Mornings are heads-down; afternoons are meetings.",
  "top_tasks": [
    { "task": "Candidate review and shortlisting from CV pile", "hours_per_week": 6, "tedium_score": 5 },
    { "task": "Onboarding admin (contracts, tools provision, first-week setup)", "hours_per_week": 4, "tedium_score": 3 },
    { "task": "Ad-hoc people issues (1-on-1s, conflict resolution, perf concerns)", "hours_per_week": 3, "tedium_score": 1 }
  ],
  "blockers": [
    "Waiting on Sim's interview slots — he's the bottleneck after I shortlist",
    "No ATS — every CV is a PDF in my inbox; lose track of who's where"
  ],
  "wished_for": "A pipeline view I can open Monday morning that shows me every active candidate, what stage they're at, and what's stuck waiting on me vs Sim. The CV review itself I'd happily delegate to a system that scores against a rubric.",
  "clockify_data": null,
  "derived_glue_human_flow": null,
  "module_recommendations_refined": []
}
```

The `derived_glue_human_flow` and `module_recommendations_refined` fields are filled later by `analyse-team-interviews`, not this skill.

---

## Auto-trigger `analyse-team-interviews`

After capturing the entry, check `brain.team_interviews[].length`:
- **≥ 1 entry** → ask the user: *"Want me to roll Cara's answers into the diagnosis now, or wait until you've interviewed more of the team? Rolling now refines Module 02's projections; waiting batches the analysis."* Don't auto-fire mid-sweep.
- **At sweep close** *(user says "done with team interviews" / "no more")* → fire `analyse-team-interviews` automatically.

---

## Edge cases

- **Employee not in `roles[]`** — refuse: *"Cara isn't in your captured team. Add her via `update-brain` first, or skip this interview."*. Don't auto-add — the main interview is the canonical source for who's on the team.
- **Employee already interviewed** — surface the existing entry, ask if the user wants to refresh *(replaces)* or skip. Don't double-append.
- **Employee won't answer** *(workshop demo skip)* — load the canned fixture entry from `templates/sample-team-interviews-<brand>.json` if it exists. Mark `interviewed_at: null` and `interview_minutes: null`. Never fabricate a real interview.
- **Clockify CSV pasted but malformed** — accept the raw text; capture as `clockify_data.raw_paste` *(extension to schema)* and flag for `analyse-team-interviews` to extract. Don't block the interview on parsing.
- **Sweep mode** *(user says "interview the whole team")* — run this skill in a loop, one employee at a time. Cap at 5 per session — beyond that, the founder *(or HR lead)* should brief the rest async.

---

## Don't

- Don't ask all 6 questions in one message. One open question per turn; the user types, you capture, you advance.
- Don't probe more than 2 follow-ups deep. If the employee doesn't know after 2 probes, capture as `[unknown]` and move on.
- Don't fabricate. If the employee skipped Q5 *(wished_for)*, leave the field empty — don't infer from the main brain.
- Don't moralise about tedium scores. *"You scored your CV review a 5 — must be soul-crushing"* is not consultant voice. Just capture.
- Don't replace the main interview. This is a depth-add, not the foundation.
- Don't re-ask facts the main brain already captured. *"How long have you worked here?"* is in `roles[].main_outputs` if it matters.

---

## Why this exists

**Sim's pre-SSL feedback (Section 4 of the talk runsheet, 2026-05-08):** *"We've identified all the bottlenecks and tools the business has — but we haven't looked at the employees themselves and how they're spending their time."*

The main syncflow interview captures the **founder's view** of where the business hurts. That view is necessary but incomplete — founders systematically underestimate their team's tedium and overestimate their team's clarity on what to build. `interview-employee` adds the employee's view: 6 questions per person, 5 employees max per session. Aggregated by `analyse-team-interviews` into a per-employee time-sink map on Page 04 + per-module ROI refinements *(if Cara says CV review is 6 hrs/wk and the founder said 3, Module 02's projections update)*.

**The full huntr method *(`huntr-handover/02-method.md`)* is a 9-phase Clockify-data-driven Bottleneck Hunt** that runs over 1-2 weeks per team member. This skill is the **interview lite version** — same diagnostic intent, in-conversation rather than CSV-driven, single session rather than multi-week. When huntr ships v0.1 *(post-SSL, est. Q3 2026)*, this skill becomes the chat-side trigger for the full huntr flow.
