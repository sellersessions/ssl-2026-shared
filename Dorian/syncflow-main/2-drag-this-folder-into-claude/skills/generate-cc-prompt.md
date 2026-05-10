# `generate-cc-prompt`

> **Two output modes — chat-prompt OR per-module CLAUDE.md.** The classic mode produces a one-shot prompt the delegate pastes; the new mode (preferred when implementation is kicking off) produces a full per-module CLAUDE.md written to `modules/0N-<slug>/CLAUDE.md`. Read alongside `reference/per-module-claude-md-template.md` and `reference/implementation-phase.md` Principle 3.

**When**
- After `generate-build-plan` and `generate-verification-plan` are output
- Called internally by `start-implementation` *(produces the per-module CLAUDE.md)*
- User says: *"give me a Claude Code prompt"* / *"what do I paste"* / *"how do I start in my own Claude Code"* — produces the chat-prompt mode
- User says: *"generate the CLAUDE.md for Module 0N"* — produces the per-module CLAUDE.md mode

**Inputs**
- The build plan + verification plan from prior skills *(held in context, OR generated on demand if missing)*
- `<phase>` — usually 1 *(start at Phase 1)* but can be any phase the user is on
- `<module-n>` — which module
- `<output-mode>` — `claude_md` *(default when called from `start-implementation`)* OR `chat_prompt` *(default when user asks for a prompt)*
- in-context `brain` object — for stack-specific MCP detail

**Tools**
- `read-brain` — fetch module + stack
- `reference/per-module-claude-md-template.md` — read the template
- `Write` *(filesystem MCP, tier 2 only — for `claude_md` mode)* — write to `modules/0N-<slug>/CLAUDE.md`
- chat — output the chat-prompt OR confirm the CLAUDE.md write

**Outputs**
- **`claude_md` mode:** a per-module CLAUDE.md file written to disk *(or rendered in chat as a copy-paste block if filesystem MCP unavailable)*. Used by the delegate's local Claude Code when they `cd` into the module folder.
- **`chat_prompt` mode:** a self-contained one-shot prompt rendered in chat that the delegate pastes into a CC session. Lighter-weight; used for ad-hoc phase work outside the standard module-folder structure.

---

## Why this skill exists

syncflow doesn't run production builds. *(Worldview: consultant, not workflow executor.)* The delegate's own Claude Code does the building.

The bridge is the cc-prompt. Originally one mode *(a one-shot prompt the delegate pastes)*; now extended with a second mode that produces the per-module CLAUDE.md described in `reference/implementation-phase.md` Principle 3 — that file lives at `modules/0N-<slug>/CLAUDE.md`, and the delegate's CC reads it automatically when they `cd` into the folder.

**Choose the mode based on the moment:**
- Kicking off implementation for a module → `claude_md` mode *(scoped, persistent, integrated with `status.json`)*
- Ad-hoc phase work, retry, or one-off → `chat_prompt` mode *(stateless, copy-paste)*

---

## Prompt structure

```
You are helping me build a module against an syncflow Connected Systems
Roadmap that syncflow (Connected Systems Consultant) generated for my brand
<brand>. The plan and verification plan are below. Implement Phase <N> only.
Stop at the end of the phase and ask me to verify before continuing.

Stack you have access to (via MCPs configured in this session):
- Supabase project: <project-name> (credentials in env)
- n8n instance:    <instance-url>     (credentials in env)
- ClickUp space:   <space-id>         (credentials in env)
- GitHub repo:     <repo-name>        (credentials in env)
- Vercel project:  <project-name>     (credentials in env)

Single-project hygiene rules — non-negotiable:
1. Use the Supabase / Vercel / GitHub / ClickUp resources listed above. Do
   NOT spawn new projects. If you think you need a new one, stop and ask.
2. Store credentials once in .env (or the platform's secrets store). Never
   ask me for the same key twice.
3. Every plan you produce includes a verification plan. We're enforcing
   verification > speed.
4. If you find existing tables / flows / repos that conflict with what the
   plan says to create, stop and ask — don't silently merge or overwrite.

Module: <module-name> (Module 0<N>)
Phase: 1 — Schema (or whichever phase the user is starting)

Build plan for this phase:
<verbatim Phase N from the build plan>

Verification plan for this phase:
<verbatim verification checks tied to this phase from the verification plan>

Sim's reference (Ideal Direct's version of this module) for context:
<short paragraph from sim-knowledge-base.md § 5 case study>

Constraints:
- Don't deviate from the plan structure. If something looks wrong, surface it
  before changing it.
- Don't promise outcomes you can't verify against the verification plan.
- Plan before execute — write the SQL / n8n flow / config first; show me;
  wait for OK; then run.
- Frontend is where verification fails — visual checks count as much as
  unit tests.

Now: produce the migration / flow / config for Phase <N>, paired with the
verification checks. I'll review and run.
```

---

## Behaviour

### Branch on output mode

**`claude_md` mode** *(default when called from `start-implementation`)*: produce the per-module CLAUDE.md per `reference/per-module-claude-md-template.md`. Write to `modules/0N-<slug>/CLAUDE.md` via filesystem MCP. Tier 1 fallback: render in chat as a copy-paste block with explicit instructions for the delegate to save to that path.

**`chat_prompt` mode** *(default when delegate asks for a prompt)*: produce the one-shot prompt below. Render in chat as a single code block.

---

### Common steps *(both modes)*

1. **Read the brain** for stack-specific MCP detail. Specifically:
   - Supabase project name *(if captured)*
   - n8n instance URL *(if captured)*
   - ClickUp workspace / space ID *(if captured)*
   - GitHub repo name *(if captured)*
   - Vercel project name *(if captured)*

   If any are unknown, leave them as `<TBD — capture before pasting>` placeholders. Don't fabricate.

2. **Pick the phase.** Default: Phase 1 *(or `current_phase` from `status.json` if it exists for this module)*. If the user said *"give me a prompt for Phase 3"*, use that.

3. **Quote the build plan + verification plan verbatim** — don't paraphrase. The CLAUDE.md *(or one-shot prompt)* must be self-contained so the delegate's CC has full context without looking elsewhere.

4. **Inject the single-project hygiene rules.** These are the worldview anti-patterns translated into instructions for the delegate's CC. Non-negotiable.

---

### `claude_md` mode steps

5a. **Load the template.** Read `reference/per-module-claude-md-template.md` § "The template".

6a. **Substitute every placeholder** per the template's substitution map *(also in § Substitution map)*:
   - `{{module_n}}`, `{{module_name}}`, `{{module_folder}}`, `{{module_problem}}`, `{{module_outcome}}`, `{{module_rung_label}}`
   - `{{archetype_label}}` *(matched against `architecture.md` § 15 archetypes)*
   - `{{rung_implication}}` *(derived from rung — e.g. rung 2 → "we're extending an already-paid tool")*
   - `{{brand_slug}}`, `{{brand_display}}`
   - `{{generated_at}}`, `{{started_at}}`
   - `{{build_plan_inline}}` *(full build plan, all 5 phases, verbatim from `generate-build-plan`)*
   - `{{verification_plan_inline}}` *(full verification plan, verbatim from `generate-verification-plan`)*
   - `{{stack_summary_inline}}` *(one line per tool from `brain.sections.stack.tools`, grouped by category)*
   - `{{supabase_project_name}}`, `{{n8n_instance_url}}`, `{{github_repo}}`, `{{vercel_project_name}}`, `{{clickup_space_id}}` *(all from brain; render as `<not in brain — ask delegate before spawning>` if absent)*

7a. **Write to disk** *(tier 2)*: use `Write` tool, path `~/syncflow-projects/<brand>/modules/0<n>-<slug>/CLAUDE.md`. Confirm the write succeeded.

8a. **Tier 1 fallback**: render the populated CLAUDE.md in chat as a fenced markdown block. Above it, instruct: *"Save this as ~/syncflow-projects/<brand>/modules/0<n>-<slug>/CLAUDE.md (create the folder structure if it doesn't exist — see reference/implementation-phase.md for the layout)."*

---

### `chat_prompt` mode steps

5b. **Compose the prompt** using the structure below.

6b. **Output as a single code block** marked `text` so it copies cleanly. Above the block, a one-line context: *"Paste this into a fresh Claude Code session in your project root, with your MCPs wired in. Replace any `<TBD>` placeholders first."*

7b. **Phase-by-phase**: don't generate one mega-prompt for all 5 phases. The user runs Phase 1 first, verifies, comes back for Phase 2's prompt. This enforces *plan before execute* between phases.

---

### Default chat-prompt structure

---

## Default brand for the prompt

Use the brand name from `business.md`. Format consistently — the literal string from `cover.headlineBrand` minus the trailing *"will own."* — e.g. *"Ideal Direct"*, *"Acme"*, *"Pet Best Co."*.

---

## When MCPs aren't wired

If the user's Claude Code session doesn't have the right MCPs, the prompt won't have anywhere to act. **Lead with the MCP setup checklist** when generating the prompt:

> *"Before pasting, check that your Claude Code session has these MCPs wired in:*
> - *`supabase-mcp` — for the database*
> - *`n8n-mcp` — for the orchestration*
> - *`clickup-mcp` — for the surface*
> - *`github-mcp` — for the repo*
> - *`vercel-mcp` — for deploys*
>
> *Each one needs the relevant API key in env. If you don't have these set up, run `claude mcp install <name>` first. If you'd rather skip MCPs and run manually, the prompt still works — you'll execute the SQL / flow / config by hand instead of through the agent."*

---

## Don't

- Don't generate prompts that span multiple phases. One prompt = one phase = one verification cycle.
- Don't fabricate MCP names. If the user doesn't have a Supabase MCP wired, leave that section as TBD — don't claim there's a `supabase-mcp` if it isn't real on their machine.
- Don't include the entire roadmap.html or all the other modules in the prompt — just this phase, this module, this brand.
- Don't omit the single-project hygiene rules. They're the worldview translated for the user's agent. Without them, the user's agent can violate the same anti-patterns syncflow guards against.
- Don't promise the user's agent will succeed. Frame the prompt as *"start Phase 1, surface anything that doesn't fit, wait for me to OK before proceeding"*.
- Don't write the prompt in a chatty / consultant voice. The user's Claude Code session needs an instruction set, not a conversation. Keep it dense.
