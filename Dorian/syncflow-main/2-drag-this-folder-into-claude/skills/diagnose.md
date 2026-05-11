# `diagnose`

**When**
- User says: *"/diagnose"* / *"something's wrong"* / *"I'm stuck"* / *"this isn't working"*
- An expected operation just failed and you can't tell why
- Pre-emptive: a delegate has been silent for several turns mid-session and you suspect they're stuck

**Inputs**
- The current Claude Desktop Project state
- The in-context `brain` object (or absence thereof)
- The last 3–5 messages of conversation history
- The last skill that was supposed to fire and what happened

**Tools**
- Project Knowledge inspection
- Conversation history awareness
- *(power-user tier 2 only)* filesystem MCP probe

**Outputs**
- A structured diagnostic that names the likely failure mode + a one-step fix
- If it's a known stuck state, a copy-pasteable recovery instruction

---

## Why this skill exists

`health-check` validates static setup. `diagnose` triages dynamic stuck states — what went wrong DURING use, not what wasn't set up correctly.

The 7 known stuck states *(post pivot-10)*:

1. **Setup incomplete** *(delegate forgot to paste `0-paste-this-into-custom-instructions.txt` into Custom Instructions, or skipped the Knowledge folder drag, or indexing hadn't finished)*
2. **Brain not initialised** *(some skill fired before init-brain, or restore-brain failed silently)*
3. **Skill resolution failure** *(agent can't locate the right skill file in Knowledge)*
4. **Artifact emission failed at content level** *(content too large, invalid HTML, missing placeholders)*
5. **MCP-related** *(tier 2 only)* — filesystem MCP disconnected, permissions missing, path moved
6. **Artifact emission silently failed — model treated instruction as documentation** *(pivot-10; the imperative block in the system prompt didn't survive the paste, so the model narrates "the roadmap will appear" without actually emitting)*
7. **Cowork MCP `create_artifact` / `update_artifact` rejected the call** *(pivot-12; agent passed wrong arg names — common cause: `identifier` instead of `id`, or inline `content` instead of `html_path`. The MCP requires `Write`-then-pass-file-path, not inline content.)*
8. **`Write` tool unavailable in this Project** *(rare; if Cowork hasn't surfaced the Write tool, the agent can't create the file `create_artifact` needs to read.)*

---

## Behaviour

1. **Listen for symptoms in the user's message.** Phrases that map to stuck states:

   | Symptom | Likely state |
   |---|---|
   | "you didn't introduce yourself" / "you're acting weird" / "no consultant identity" | (1) Setup incomplete |
   | "you keep asking the same question" | (2) Brain not initialised — facts not being captured |
   | "you said you'd render the roadmap and nothing happened" | (4) or (6) — content-level failure vs imperative-not-loaded |
   | "I don't see the artifact panel" / "no artifact appeared" / "right panel is empty" | (6) imperative not loaded · OR (7) capability disabled · OR Pro account issue |
   | "you keep saying you've created an artifact but I don't see one" | (6) — agent is narrating without emitting; system prompt block missing |
   | "the agent told me to drag a file but didn't say where" | UX issue, not a real fault — just re-explain |
   | "you can't find the skill" / "you're improvising" | (3) Skill resolution failure |
   | "the brain isn't saving to disk" *(tier 2 only)* | (5) MCP issue |
   | "everything looks normal but..." | run a full diagnostic — could be any |

2. **Run the relevant probe** for the most likely state. Don't run all 7 unless the symptom is unclear.

   - **(1) Setup probe:** Can you recall the 12 worldview principles? If no → Custom Instructions is probably empty. Fix: *"Open `0-paste-this-into-custom-instructions.txt` from your `~/syncflow/` folder. Select all (⌘A), copy (⌘C). Open this Project's **Custom Instructions** panel, paste (⌘V), save. Then type `let's start` again."*
   - **(2) Brain probe:** Does an in-context brain exist? If no but the conversation suggests an interview is in progress → init-brain didn't fire. Fix: *"Brain wasn't initialised. Type `let's start` from scratch — onboarding will fire init-brain properly. The current conversation can't be salvaged because no facts were captured."*
   - **(3) Skill probe:** Are skills/, prompts/, templates/ present in Project Knowledge? Pick a specific skill and try to read its content; report whether you can find it. Fix: *"`skills/` doesn't seem to be in Project Knowledge. Drag it in (Add content → Add from computer → 2-drag-this-folder-into-claude folder), then re-try."*
   - **(4) Artifact-content probe:** Was the last attempted emission rejected for content reasons *(too large, invalid HTML, missing placeholders)*? Re-attempt with smaller content; if still fails, surface the error. Fix: usually content-size or HTML-validity. Halt and emit a diagnostic artifact instead of the real one.
   - **(5) MCP probe:** *(tier 2 only)* Is the filesystem MCP connected? Check the plug icon in Claude Desktop. Fix: *"Filesystem MCP isn't connected. Quit Claude Desktop fully (⌘Q), reopen, and check Settings → Developer → MCP servers for the syncflow-fs entry."*
   - **(6) Imperative-not-loaded probe (pivot-10):** Can you recall the system prompt's `## Artifact emission` section — specifically the stable id `syncflow-roadmap` and the `Write`-then-`create_artifact` protocol? If no → the imperative block isn't in your context. Symptoms: you've been narrating *"the roadmap will appear"* without actually calling the MCP. Fix: *"Re-paste `0-paste-this-into-custom-instructions.txt` into Custom Instructions. Confirm the file you copied includes the `## Artifact emission` block. Save. Start a fresh chat."*
   - **(7) MCP arg-shape probe (pivot-12):** Did `create_artifact` or `update_artifact` return a validation error mentioning required fields? The Cowork MCP requires `id` (not `identifier`) and `html_path` (not `content`). Fix: *"Re-emit. Use exact arg names: `create_artifact({ id: 'syncflow-roadmap', html_path: '<absolute path you wrote with Write tool>', description: '...' })`. Don't pass HTML inline; the tool reads the file from disk."*
   - **(8) Write-tool probe:** If you can't find a `Write` tool available in this Project, you can't create the file `create_artifact` reads from. Fix: *"This Project doesn't have a Write tool surfaced. Confirm Cowork is enabled and the project has tool access. Settings → Developer → MCP servers should include filesystem write."*

3. **Output the diagnostic.** Compact format:

   ```
   syncflow · diagnostic

   Symptom: "you didn't introduce yourself"
   Likely state: (1) Setup incomplete — Custom Instructions panel
   is probably empty.

   Confirm: I can't recall the 12 worldview principles right now,
   which confirms the system prompt didn't load.

   Fix:
     1. Open `0-paste-this-into-custom-instructions.txt` from your
        ~/syncflow/ folder.
     2. Select all (⌘A), copy (⌘C).
     3. Open this Project's Custom Instructions panel.
     4. Paste (⌘V), save.
     5. Type "let's start" again — I'll re-onboard properly.

   Once that's done, run /health-check to confirm everything's green.
   ```

4. **Always end with a single concrete action.** If multiple things are wrong, prioritise the one that unblocks the rest *(usually setup)*. Don't dump a list of 5 things to fix in parallel.

5. **If the diagnostic is inconclusive,** be honest. *"I can't tell from here what's wrong. Try /health-check first. If that's green, screenshot the chat + the artifact panel and we'll figure it out together."*

---

## Special case: silent failures

If a skill fired but produced nothing visible *(e.g. emit-roadmap-artifact ran but no artifact appeared)*, this is the hardest stuck state to diagnose because the user sees nothing and assumes the agent did nothing.

When you suspect a silent failure:
- Re-state what you JUST tried to do.
- Re-state what the user SHOULD have seen.
- Ask them to confirm what they actually saw *(artifact panel? error? nothing?)*.
- Based on their answer, route to the right fix.

Example:

```
I just tried to emit your roadmap as an artifact. You should see a
new artifact panel appear on the right side of Claude Desktop, titled
"Connected Systems Roadmap · Cordova".

Can you confirm what you're seeing right now?
  - Artifact panel visible with the right title → all good, scroll down
    to see the 11 pages
  - No artifact panel at all → likely Pro account issue or Desktop
    version too old
  - Artifact panel visible but empty / error → content issue, I'll
    re-emit a smaller version
```

---

## Don't

- Don't run diagnostic probes preemptively or in the background. Only when invoked or when a clear symptom surfaces.
- Don't list every possible cause of every issue. Pick the most likely; the user can re-run /diagnose if you guessed wrong.
- Don't blame the user. *"Setup incomplete"* is a process gap, not user error. Fix the gap.
- Don't promise the diagnostic is exhaustive. v0 has 5 known stuck states; novel ones will surface in dogfood.
- Don't auto-fire `health-check` from inside `/diagnose`. They have different jobs *(static vs dynamic)*; conflating them confuses the output.
