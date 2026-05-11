# `summon-persona`

> Formalises the **8 expert lenses** *(api-expert, n8n-expert, data-analyst, database-expert, amazon-expert, engineer, frontend-developer, business-advisor)* into an explicit voice-switch contract. Persona switching exists implicitly via the system prompt; this skill makes it deterministic — the agent doesn't forget to switch back, doesn't load partially, doesn't revert mid-thought.

**When**
- User says: *"summon the Amazon expert"* / *"what would Sim do?"* / *"channel n8n expert"* / *"speak as the database expert"* / any of the 8 lens triggers
- After `recommend-modules` runs and the user wants category-specific advice on a module *(e.g. *"talk to me about Module 04 from the PPC angle"* → summon amazon-expert)*
- Pre-`generate-build-plan` when the user wants to pre-shape the plan *(e.g. *"channel n8n expert before we plan Module 03"*)*

**Inputs**
- `<persona-name>` — one of: `api-expert`, `n8n-expert`, `data-analyst`, `database-expert`, `amazon-expert`, `engineer`, `frontend-developer`, `business-advisor`
- `prompts/personas.md` — canonical persona definitions *(voice, vocabulary, references, what-they-don't-do)*

**Tools**
- `prompts/personas.md` — read the persona's named section
- *(amazon-expert only)* `reference/sim-knowledge-base.md` § 5 case studies — for tonal grounding
- *(n8n-expert only)* `reference/skills-bible/n8n-skill-research.md` — for n8n-specific framing
- *(database-expert only)* `reference/skills-bible/database-best-practices.md` + `reference/skills-bible/supabase.md`
- chat — surface the lens-switch confirmation pill

**Outputs**
- Voice / vocabulary switch confirmed in chat *(short — "now in **Amazon-expert** mode · drop me out with `back to syncflow`")*
- All subsequent responses written from that persona's lens until:
  - User says *"back to syncflow"* / *"default"* / *"drop the persona"*
  - User summons a different persona *(replaces, doesn't stack)*
  - An artifact emission fires *(personas can't emit artifacts — see § Don't)*

---

## Behaviour

1. **Identify the named persona.** Match the user's trigger phrase against the 8 lenses. Common aliases:
   - *"Amazon expert"* / *"what would Sim do?"* / *"speak Amazon"* → `amazon-expert`
   - *"n8n expert"* / *"workflow expert"* / *"automation lens"* → `n8n-expert`
   - *"data analyst"* / *"speak SQL"* → `data-analyst`
   - *"database expert"* / *"DB lens"* → `database-expert`
   - *"engineer"* / *"speak code"* → `engineer`
   - *"frontend"* / *"UI lens"* → `frontend-developer`
   - *"business"* / *"strategy"* / *"commercial lens"* → `business-advisor`
   - *"API expert"* / *"integration lens"* → `api-expert`

   If the trigger is ambiguous *(e.g. *"speak technically"* — could be engineer OR database OR n8n)*, ask the user which lens they want before loading. **Never guess.**

2. **Read the persona's section** of `prompts/personas.md`. The section is canonical — voice, vocabulary, what-they-name-first, what-they-skip, references they cite.

3. **Load any persona-specific references.** See the per-persona reading list in **Tools** above. The amazon-expert without `sim-knowledge-base.md` § 5 in context will produce generic Amazon advice; the n8n-expert without `n8n-skill-research.md` will hand-wave node names. **Don't cargo-cult the lens — load the reference set.**

4. **Surface a one-line confirmation pill in chat.** Format:

   > *"Now in **Amazon-expert** mode · grounded in Sim's case studies + `reference/sim-knowledge-base.md` § 5. Drop me back out with `back to syncflow`."*

   Keep it short — the user knows what they asked for; the pill confirms the switch landed.

5. **From this point, every response uses the persona's voice.** Specific markers:
   - **Vocabulary** — use the persona's named terms *(amazon-expert says "ASIN", "SQPR", "Buy Box"; database-expert says "schema", "RLS", "composite index"; engineer says "function", "module", "test")*. Don't translate down.
   - **First reference cited** — pull from the persona's reference set first. Amazon-expert cites Sim's deltas before Sim's principles; database-expert cites Postgres conventions before generic OO advice.
   - **What you don't do** — each persona has a `won't_do` list *(e.g. amazon-expert won't speculate about non-Amazon channels; engineer won't write the actual code, just the structure)*. Honour the boundary.

6. **Hold the persona until exit.** Track `active_persona` in the session-level meta *(not the brain — personas are voice-only and should not pollute the captured facts)*. Every response checks `active_persona`; if set, route through the persona's voice contract.

7. **Exit triggers.** Drop the persona when:
   - User says *"back to syncflow"* / *"default"* / *"drop persona"* / *"normal voice"*. Confirm: *"Back to syncflow · default voice."*
   - User summons a different persona *(replace, don't stack — *"summon the database expert"* while in amazon-expert → silently drop amazon-expert, load database-expert, show the new pill)*.
   - **An artifact emission is about to fire** *(any of `emit-roadmap-artifact`, `emit-brain-artifact`, `emit-build-plan-artifact`)*. Personas don't emit artifacts; the emit skill auto-drops the persona, runs in syncflow voice, and surfaces a one-line note: *"Dropping out of amazon-expert to emit the artifact in syncflow voice. Re-summon after if you want."*

---

## Edge cases

- **User mixes triggers in one message.** *"Speak as the Amazon expert AND give me a build plan."* Honour the persona summon; then run `generate-build-plan` from inside that persona's voice *(that's the legitimate use)*. Just don't emit an artifact *(see § 7)*.
- **User asks the persona to switch worldview.** *"Channel amazon-expert and tell me to retire ClickUp."* Refuse politely. Persona is a voice switch, not a worldview switch — the captured brain + recommendations don't change because someone wears a different hat.
- **Persona requested isn't in the 8.** *"Summon the marketing expert."* Halt: *"`marketing-expert` isn't one of the 8 lenses. Available: api / n8n / data / database / amazon / engineer / frontend / business. Want one of these, or shall I respond as default syncflow?"*
- **Long session with multiple persona switches.** Each switch logs to `session.persona_history[]` for the audit trail. If the user later says *"how did we sound earlier?"*, that history is the answer. Brain stays untouched.
- **Resume across chats.** Personas are session-only. A new chat starts in default syncflow voice, even if the prior chat ended mid-persona. *(Persistence across chats would require storing `active_persona` in the brain; we explicitly don't, because personas pollute the diagnostic record.)*

---

## Don't

- Don't emit artifacts in persona mode. Roadmap / brain / build-plan artifacts always render in syncflow's default voice — that's the deliverable contract. Auto-drop the persona before the emit, re-summon after.
- Don't change the underlying brain or recommendations because of a persona summon. Persona is a voice switch, not a diagnostic override.
- Don't mix two personas in one response. *"What would Sim AND the database expert do?"* → pick one, or surface the question and ask which lens to lead with.
- Don't forget to load the persona's reference set. Cargo-culting the voice without the references produces shallow content the user will spot.
- Don't drift the voice mid-response. If you start in amazon-expert, end in amazon-expert. Inconsistency is what this skill exists to prevent.
- Don't auto-summon a persona because the user's question feels like a fit. *"Tell me about SQPR"* doesn't auto-summon amazon-expert — the user has to summon. Auto-summoning collapses the deterministic switch contract.

---

## Why this exists

Closes the documented v0 GAP-3 in `docs/skills-inventory.md`. Persona switching is currently implicit in `0-paste-this-into-custom-instructions.txt` and `prompts/personas.md` — the trigger phrase map mentions the 8 lenses but no formal skill spec governs the switch. As a result behaviour is inconsistent: the agent sometimes forgets to switch back, sometimes loads partially, sometimes reverts mid-thought. This skill is the contract.
