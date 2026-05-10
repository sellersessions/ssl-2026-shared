# `restore-brain-from-knowledge`

**When**
- At the start of every fresh conversation, BEFORE `onboard-delegate` would otherwise fire — checks if a previous brain has been saved to Project Knowledge
- User says: *"let's continue"* / *"pick up where we left off"* / *"resume"*

**Inputs**
- Files attached to the current Claude Desktop Project's Knowledge

**Tools**
- Project Knowledge inspection — search for `brain*.json` files attached to this project
- working memory — populate the in-context `brain` from the parsed JSON
- *(filesystem MCP, tier 2)* — read per-module `status.json` files at `~/syncflow-projects/<brand>/modules/*/status.json` and reconcile module status with brain
- `update-module-status` *(internal call when reconciliation finds drift)* — apply disk → brain status updates after delegate confirms
- `Write` — re-render the roadmap HTML and write to disk
- `create_artifact` — emit the roadmap artifact in the new conversation *(this is the first emission of `syncflow-roadmap` in this chat, since artifacts are conversation-scoped)*

**Outputs**
- An in-context `brain` object populated from the saved JSON, validated against `templates/brain-schema.json`
- *(tier 2)* Per-module statuses reconciled with disk `status.json` files; drift surfaced for delegate confirmation
- The roadmap artifact re-emitted in the new conversation, at the appropriate stage based on brain state
- Greeting message that orients the delegate to where they left off — including cross-module status changes since last session if implementation is underway

---

## Why this skill exists

**Tier-1 persistence — the restore half.** When `emit-brain-artifact` saves a `brain.json` and the delegate drags it into Project Knowledge, that file persists across all conversations in the project. This skill picks it up at the start of any new conversation and rehydrates the brain so syncflow doesn't make the delegate redo the interview.

Without this skill, the delegate's brain is conversation-scoped — they'd start over every time. With it, the brain is project-scoped *(and survives Claude Desktop restarts, account device-switches, etc.)*.

---

## Behaviour

1. **Inspect Project Knowledge** for files matching `brain*.json` — including `brain.json`, `brain-cordova.json`, `brain-2026-05-05.json`, etc.

   - **No match** → return null. `onboard-delegate` proceeds as if this were a fresh user.
   - **One match** → proceed to step 2.
   - **Multiple matches** → ask the user which to restore: *"I see brain.json (Cordova, last updated 2 days ago) and brain-ideal-direct.json (Ideal Direct, last updated 2 weeks ago) in this project. Which brand are we picking up?"* — then proceed with the chosen one.

2. **Parse the JSON.** Validate against `templates/brain-schema.json`:
   - `schema_version` matches `"1.0"` — if not, surface a migration warning *(no migration script exists yet for v0)*. Halt and ask the user.
   - All four `sections` exist
   - `brand`, `brand_display`, `captured_at` populated

   If validation fails, surface the error and ask whether to start fresh or attempt manual repair.

3. **Populate the in-context brain.** Copy the parsed object into your working memory as the active `brain`. From this point, `read-brain` returns this brain; `capture-fact` appends to it; future `emit-brain-artifact` calls update the artifact stably with this brain.

4. **Refresh metadata.** Update `last_updated_at` to now *(restore counts as an update)*. Don't reset `captured_at` — that's the original interview date.

5. **Determine the current stage** from brain state. This drives both the artifact emission and the greeting copy:

   | Brain state | Stage |
   |---|---|
   | All 4 sections populated AND `recommendations.modules` populated | `complete` |
   | All 4 sections populated, no recommendations | `goals` *(post-interview, pre-derivation)* |
   | Sections business + team + stack populated, no goals | `stack` *(mid-interview)* |
   | Sections business + team only | `team` |
   | Section business only | `business` |
   | Empty / no sections populated | `pre-interview` |

6. **Reconcile per-module status from disk** *(tier 2 only — filesystem MCP enabled)*. If `~/syncflow-projects/<brand-slug>/modules/` exists on disk, walk each `0N-<slug>/status.json` file:

   - For each module, read `status.json` and compare its phase state against `brain.recommendations.modules[i].current_phase` + `status`.
   - **If disk is ahead of brain** *(e.g. disk shows `phase_3_complete` since last session; brain still says `phase_2_complete`)*: that's normal — delegate's CC has progressed on disk. Surface this in the greeting *(see step 8, *"What changed since last session"* block)*.
   - **If disk is behind brain** *(e.g. brain says `built_v1` but a module's status.json was reset)*: weird. Surface as a confirm-before-proceed: *"Disk status.json for Module 02 looks reset (back to phase 1). Brain has it at built_v1. Did the file get clobbered? Walk me through what happened."*
   - **If disk says a phase passed verification** *(e.g. `phases.3.status: "verified"` since last session)*: prepare to call `update-module-status` to transition the brain *(but only after delegate confirms in step 8)*.

   Don't auto-transition. The delegate may have made progress that the brain should reflect, OR they may have manually edited the disk file in a way that shouldn't propagate. Always confirm before writing.

   *(Tier 1 — no filesystem MCP — skips this step. Status reconciliation happens via the delegate typing *"Phase N done on Module 0M"* during the conversation.)*

6.5. **AI coach scan — surface overdue P5/P6/P9 obligations.** *(See `docs/ai-coach-spec.md` for full design.)* After reconciling per-module status, walk every module and check four conditions:

   | Condition | Priority | Surface as |
   |---|---|---|
   | `status === "redeployed"` AND `audit_t4.scheduled_for` is past today AND `audit_t4.passed` is null | **HIGH — overdue audit** | *"Module 0N audit was due {{N}} days ago — type 'audit Module 0N' when ready."* |
   | `status === "deployed"` AND >14 days since the `deployed` transition AND `audit_t4.redeployed_to` is null | **HIGH — unconfirmed redeployment** | *"Module 0N deployed {{N}} weeks ago — Sim P6: have the recovered hours been redeployed? Type 'redeployed Module 0N' to log."* |
   | `status === "redeployed"` AND `audit_t4.scheduled_for` is within next 7 days | MEDIUM — upcoming audit | *"Heads up — Module 0N's T+4 audit is due in {{N}} days."* |
   | Module's `last_status_update` is >14 days stale AND `current_phase != null` | MEDIUM — stalled | *"Module 0N has been at {{status}} for {{N}} weeks. Stuck on something? Want to swap or tolerate?"* |

   Only fire each module once per session — track which audit/redeployment reminders have been surfaced in the conversation and don't re-surface unless the user asks for `status`. **Don't pester.**

   Render the matches in a top-of-greeting "⚠ Things waiting on you" block in step 8 *(implementation-in-flight greeting case)*. Order: HIGH first, then MEDIUM. If no matches, omit the block entirely — silence is the right default.

7. **Re-emit the roadmap artifact in this new conversation** — Cowork artifacts are conversation-scoped, so the previous chat's artifact card is gone. We need to recreate it from the restored brain.

   - Render the dashboard HTML matching the determined stage *(per `skills/render-roadmap.md`)*. All previously-captured pages render populated; pages whose dependencies aren't met stay locked.
   - **Module-card status pills on Page 07 reflect any reconciled-from-disk statuses** — if the delegate confirms the disk progress in step 8, the artifact updates immediately to show `phase_3_complete` etc.
   - Use the `Write` tool to write the HTML to a working-directory file *(e.g. `./syncflow-roadmap.html`)*.
   - Call **`create_artifact`** *(not update — this is the first emission in this conversation)* with `{ id: "syncflow-roadmap", html_path: "<absolute path>", description: "Connected Systems Roadmap · <brand> · resumed" }`.
   - Verify success. If `create_artifact` fails, surface the error to the user and offer to start fresh.

8. **Greet the delegate** with context-aware orientation that **references the freshly-emitted artifact**:

   - **If interview is complete AND no modules past `recommended`** *(stage: complete, fresh)*:
     ```
     Welcome back to <brand>. Here's where you were when you saved
     last session:

     - Interview captured <X> facts across all 4 sections, <N> days ago.
     - Recommended start: Module <NN> · <Module Name>.
     - All 11 pages of your roadmap are in the Artifacts panel — right
       side. (Artifacts are conversation-scoped, so I just rebuilt it
       from your saved brain.)

     Your obvious next move:
       Type "start Module <NN>" — I'll generate the build plan + verification
       plan + per-module CLAUDE.md, set up the module folder, and tell you
       exactly what terminal command to run. Phase 1 starts right after.

     Other things you can say:
       1. "build plan for Module <NN>" — just the plan, no folder setup
       2. "save my brain" — re-export with today's date
       3. "re-derive" — refresh the recommendations against the same brain
       4. Something else (write your own)
     ```

   - **If implementation is in flight — modules past `recommended`** *(stage: complete, with active modules — most common returning case)*:
     ```
     Welcome back to <brand>.

     What changed since last session:
       Module 02 · Demand Planning   →  was phase_2_complete, now phase_3_complete  (disk says you verified Phase 3)
       Module 04 · PPC + Stock        →  unchanged, still in_progress (Phase 1)
       Module 05 · Image Upload       →  unchanged, deployed (T+4 audit due 2026-06-02)

     Your roadmap is in the Artifacts panel — right side — with status pills
     reflecting the latest. (I rebuilt it from your saved brain since
     artifacts are conversation-scoped.)

     One thing needs your confirmation:
       Disk shows Module 02 progressed to phase_3_complete since you last
       talked to me. Apply that to the brain? — say "yes, Phase 3 is done"
       to confirm, or "no" if something else happened.

     Once that's settled, options:
       — "open Module 02" — continue Phase 4 Surface (next phase)
       — "audit Module 05" — T+4 check is overdue
       — "status" — full portfolio view across all modules
       — Something else
     ```

     *(If no disk drift was detected, skip the confirmation paragraph and just lead with "What changed since last session" + "options".)*

     *(If T+4 audit is due on a `redeployed` module, surface it as the highest-priority option.)*

   - **If interview is partial** *(stage: business / team / stack / goals)*:
     ```
     Welcome back to <brand>. The interview was paused
     <X> days ago after the <Section> section. <N> facts captured
     so far.

     Your roadmap is in the Artifacts panel — right side — showing
     what we have. Pages 02 and 04 reflect what's captured;
     <list of remaining-locked pages> fill in as we keep going.

     Pick one:
       1. Continue from <next section> — the natural next step
       2. Jump to a specific section *(say "go to Stack" / etc.)*
       3. Re-do a section we already covered *(say "redo Team" / etc.)*
       4. Start over with a new brain *(scrap this and begin fresh)*
       99. Something else
     ```

   - **If interview was never started but a brain skeleton exists** *(rare)*:
     ```
     Brain restored — but it's empty. Looks like the interview never
     started in the prior session. Take a look at the artifact in
     the right panel for context, then say "ready" and I'll begin.
     ```

8. **Stay deferential.** The delegate might want to discard the restored brain and start fresh. Honour that — *"want to start over instead?"* should always be a valid response. If they choose to start over, drop the in-context brain, drop the just-created artifact via re-emission as a brand-less stub, then run `onboard-delegate` from scratch.

---

## What this skill does NOT do

- **Doesn't merge brains.** If the delegate has multiple brain.json files in Knowledge, ask them to pick one. We don't auto-merge differing brain states — that's a recipe for silent corruption.
- **Doesn't auto-fire downstream skills.** Restore loads the brain, then waits for the user's next move. Don't auto-emit the roadmap; the delegate might want to update facts before re-rendering.
- **Doesn't write to disk.** Restore is read-only. Tier 2 disk persistence is `emit-brain-artifact`'s + `capture-fact`'s job, not this skill's.
- **Doesn't validate beyond schema.** Brain might be schema-valid but semantically stale *(e.g. last_updated_at is 6 months old)*. Surface the date in the greeting and let the delegate decide if it's still relevant.

---

## Don't

- Don't restore a brain whose `schema_version` doesn't match `"1.0"`. v1.x → v2.x migration scripts will ship when the schema bumps; for now, halt and ask.
- Don't silently overwrite an in-context brain that already exists. If `init-brain` fired before this skill *(out of order)*, surface the conflict.
- Don't say *"brain restored!"* without context. Lead with what's in the brain and what the delegate can do next.
- Don't restore brains across brands silently. If the project is named `syncflow · Cordova` but the brain.json is for Ideal Direct, surface the mismatch.
- Don't promise restore will work after months of inactivity if the schema bumps in v0.5 / v1. v0 schema is locked at 1.0 specifically so this works for the foreseeable future.
