# `recommend-pm-integration`

> Asks the delegate how they want to track implementation, and *(if they have a PM tool already)* offers to mirror module + phase status as tasks. Opt-in. Brain.json stays primary regardless. Read alongside `reference/implementation-phase.md` Principle 1.

**When**
- Called internally by `start-implementation` on the FIRST module kickoff for a brand *(if `pm_tracking.tool` is unset across all modules)*
- User says: *"set up ClickUp / Notion / Asana for tracking"* / *"how do I track progress?"* / *"PM mirror"*

**Inputs**
- in-context `brain` *(specifically `brain.sections.stack.tools` and `brain.sections.team.tool_fluency`)*
- in-context `brain.recommendations.modules[]` *(to know what we'd be mirroring)*

**Tools**
- `read-brain` — find PM tool from captured stack
- chat — present the options + ask the delegate to choose
- `update-brain` *(if a tool is selected)* — write `pm_tracking.tool` per-module
- The matching MCP *(if accepted)* — `clickup`, `notion`, `asana` — to create the parent task + per-phase tasks
- `recommend-integration` *(internal handoff)* — if MCP isn't yet wired for the chosen tool, fold into the existing integration recommendation flow

**Outputs**
- A recommendation message in chat
- Either: a wired-up PM mirror with parent task + per-phase tasks created, OR a brain-only tracking confirmation, OR a deferred-decision note
- Updated `brain.recommendations.modules[i].pm_tracking` *(if accepted)*

---

## Why this skill exists

Sim's input on PM tracking: *"system should ask the user how they want to track and recommend solution and connection based on what they use already."* Don't impose a tracking model; meet the delegate where they are.

The defaults we offer:
- **brain.json + status.json files** *(default — works everywhere, no MCP required)*
- **brain.json + ClickUp mirror** *(if delegate uses ClickUp + has the MCP wired)*
- **brain.json + Notion mirror** *(if delegate uses Notion + has the MCP wired)*
- **brain.json + Asana mirror** *(if delegate uses Asana + has the MCP wired)*

Brain.json is **always** primary. The PM mirror is a derived view, not a fork.

---

## Behaviour

### 1. Detect PM tool from captured stack

Read `brain.sections.stack.tools`. Look for exact matches against:
- `clickup`, `ClickUp`
- `notion`, `Notion`
- `asana`, `Asana`
- `monday`, `Monday.com`
- `linear`, `Linear`
- `jira`, `Jira`
- `trello`, `Trello`

Also check `brain.sections.stack.pm_tool` *(direct field if captured during the interview)*.

### 2. Match against MCP integrations we ship

We ship MCP setup snippets for: **ClickUp, Notion, Asana** *(see `integrations/<name>.md`)*.

If the delegate's tool is one of those three: full mirror is offerable.
If their tool is Monday / Linear / Jira / Trello / something else: surface the gap. *"You use Monday.com. We don't have an MCP for it yet — you'd track in brain.json + status.json files for now, and manually update Monday tasks from there. Want me to log that as a v0.5 candidate integration?"*
If no PM tool detected at all: offer brain-only tracking + suggest one of the three if they're considering adopting.

### 3. Present the recommendation

Format the chat message based on what's detected:

**Case A — ClickUp/Notion/Asana detected, MCP not yet wired:**

> *"You have **ClickUp** in your stack. We can mirror module + phase status as ClickUp tasks — one parent task per module, one subtask per phase. Auto-updates as you progress through the lifecycle. Brain stays primary; ClickUp is a derived view.*
>
> *Two-step setup: (1) wire the ClickUp MCP into your Claude Desktop *(5-min snippet, I can hand you that)*, (2) accept the mirror.*
>
> *Want it? — say 'yes ClickUp' or 'just brain' to skip."*

**Case B — ClickUp/Notion/Asana detected, MCP already wired *(via `recommend-integration` previously)*:**

> *"You have **ClickUp** + the MCP is wired. I can spin up the module mirror right now — one ClickUp task tree per module *(parent + 5 phase subtasks)*. They'll auto-update as you progress through the lifecycle. Brain stays primary; ClickUp mirror is read-only as far as syncflow's concerned.*
>
> *Want the mirror? — 'yes' or 'just brain' to skip."*

**Case C — Monday/Linear/Jira/Trello/other detected:**

> *"You use **Monday.com**. We don't ship an MCP for Monday yet, so I can't auto-mirror status to it. Two options:*
>
> *— Track in brain.json + per-module `status.json` files only *(simpler; works today)*. You manually update Monday from your own session.*
> *— Wait until v0.5 when we'd potentially add the integration. I can flag it as a candidate.*
>
> *— or — adopt one of ClickUp/Notion/Asana for syncflow tracking specifically *(separate from your team's primary)*. I'd recommend that only if you're already considering switching.*
>
> *What's your preference?"*

**Case D — no PM tool detected:**

> *"No PM tool captured in your stack. Two paths:*
>
> *— Brain.json + per-module `status.json` files is enough for v0 *(works for solo and small-team builds)*. Lighter; no extra subscription.*
> *— Or adopt ClickUp / Notion / Asana for tracking. Each ships an MCP we wire in. Useful if your team needs visibility beyond your Cowork session.*
>
> *Which way? I default to brain-only unless you tell me otherwise."*

### 4. Handle the delegate's response

**"yes ClickUp" / "yes notion" / "yes asana"** *(MCP wired)*:

1. Create one parent task per active module *(any module past `recommended`)* in the delegate's chosen ClickUp space / Notion database / Asana project.
2. For each module, create 5 subtasks — one per phase, named `Phase 1 — Schema`, `Phase 2 — Ingestion`, etc.
3. Save the resulting task IDs to `brain.recommendations.modules[i].pm_tracking`:
   ```json
   {
     "tool": "clickup",
     "parent_task_id": "CU-abc123",
     "task_id_per_phase": {
       "1": "CU-def456",
       "2": "CU-ghi789",
       ...
     }
   }
   ```
4. Confirm in chat: *"Mirror created. Parent task: CU-abc123. 5 phase subtasks linked. They'll update as you call `update-module-status`. Anything else?"*

**"yes ClickUp" *(MCP not wired)***:

1. Hand off to `recommend-integration` for ClickUp setup snippet.
2. Once delegate has wired the MCP and confirmed via `/health-check`, return here and continue with Case B path.

**"just brain" / "skip"**:

1. Set `brain.recommendations.modules[i].pm_tracking.tool = null` for every module *(explicitly opted out)*.
2. Confirm: *"Brain-only tracking it is. Status updates flow through me; I'll surface where you are whenever you ask."*

**Defer / unsure**:

> *"No problem — defaulting to brain-only for now. You can flip to a PM mirror later by saying 'set up ClickUp tracking'. Status from me until then."*

### 5. Per-module application

This skill runs **once per brand** *(first module kickoff)*. Once the delegate's preference is captured, subsequent `start-implementation` calls inherit it:

- If `pm_tracking.tool` is set globally *(via this skill)*: each new module's kickoff auto-creates the corresponding tasks in the same PM tool, no re-asking.
- If the delegate explicitly opted out: subsequent kickoffs don't re-prompt. They can manually fire this skill again to change their mind.

---

## What gets created in each tool *(if accepted)*

### ClickUp

- **List**: existing brand list *(if captured)* OR a new `syncflow · {{brand_display}}` list under the workspace's primary space
- **Parent task per module**: title `Module 0N · {{module_name}}`, status mapped to module status *(planned / in_progress / built_v1 / deployed / etc.)*, custom fields for `Module n`, `Rung`, `Effort`, `Weeks`, `Archetype`
- **Subtask per phase**: title `Phase 1 — Schema`, etc. Status starts `Open`. Updated to `Closed` when corresponding `phase_N_complete` lands

### Notion

- **Database**: existing brand DB *(if captured)* OR a new `syncflow · {{brand_display}}` database
- **Page per module**: same fields as ClickUp parent task, plus a body section pointing to `~/syncflow-projects/<brand>/modules/0N-<slug>/`
- **Subpages or status fields per phase**: depending on Notion structure preference

### Asana

- **Project**: existing brand project *(if captured)* OR new `syncflow · {{brand_display}}` project
- **Task per module + subtask per phase**: same as ClickUp pattern

---

## Edge cases

- **Multiple PM tools in the stack** *(rare — e.g. ClickUp for product, Asana for ops)*: ask the delegate which one to use for syncflow tracking. *"You have ClickUp AND Asana — which should syncflow mirror to? Probably whichever one your build team uses day-to-day."*

- **Delegate's PM tool has no MCP available**: don't fake it. Recommend brain-only. Log the integration as a v0.5 candidate.

- **Delegate is already mid-implementation when this fires** *(e.g. they manually invoked it after a few modules already running)*: backfill the existing modules' tasks. *"You have 3 modules already past `planned`. I'll create their ClickUp tasks now and pre-fill statuses to match."*

- **PM-tool API rate limits during bulk creation**: chunk requests; surface progress. *"Creating ClickUp tasks for 7 modules × 5 phases = 35 subtasks + 7 parents. Roughly a minute. Hold."*

- **Delegate changes PM tool partway through**: support the migration. *"Switching from ClickUp to Notion: I'll archive the existing ClickUp tasks (not delete) and recreate the structure in Notion. Brain stays the same."*

---

## Don't

- **Don't auto-pick a PM tool without asking.** Sim's directive: ask + recommend, don't impose.
- **Don't make the PM mirror primary.** Brain.json wins. The PM tool is a derived view.
- **Don't silently retry on MCP failure.** If ClickUp's API is down, surface it. *"Mirror creation failed — ClickUp API timeout. Retry now or skip the mirror this time?"*
- **Don't promise integration with tools we don't ship MCPs for.** Be honest about the v0.5 path.
- **Don't push for a mirror if the delegate's stack doesn't include a PM tool.** Brain-only is a totally valid endpoint.

---

## Why this skill matters

The whole implementation phase pivots on: where does the delegate look to know what's happening? If their team uses ClickUp, the answer should be ClickUp *(with brain as the underlying truth)*. If they're solo, the answer is the brain. Either way, **one canonical place** — never *"check ClickUp AND brain.json AND status.json AND Slack messages"*. This skill picks the canonical surface for the delegate's context.
