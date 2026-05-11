# `recommend-integration`

**When**
- During or after the Stack interview, when `capture-fact` has just landed a tool name that maps to an integration we ship a snippet for *(ClickUp, Slack, Notion, Supabase, n8n)*
- User says: *"can you connect to ClickUp?"* / *"do you talk to Notion?"* / *"is there an MCP for X?"*
- After `recommend-modules` if the chosen module's reference build relies on a tool the delegate already has

**Inputs**
- The in-context `brain` *(specifically `brain.sections.stack.tools`, `pm_tool`, `comms_tool`)*
- The relevant `integrations/<name>.md` setup snippet

**Tools**
- `read-brain` — confirm the tool is in the captured stack before recommending
- Project Knowledge — load the matching `integrations/<name>.md` content
- `reference/skills-bible/<topic>.md` — when the delegate asks *what specifically does this MCP unlock?*, reach for the matching deep-dive: ClickUp → `clickup-amazon-business.md`, Supabase → `supabase.md` + `database-best-practices.md`, n8n → `n8n-skill-research.md` + `webhook-event-driven-patterns.md`, Slack → `SKILLS_BIBLE.md` § 5 *(no dedicated Slack file)*. Cite a specific section so the answer is concrete, not handwave.
- chat — surface the recommendation; never auto-write configs

**Outputs**
- A timed, opt-in recommendation framed as a 1-sentence offer + 1-sentence value
- If the user accepts: the contents of `integrations/<name>.md` rendered in chat
- If the user declines: silent acknowledgement, no further nagging this session

---

## Why this skill exists

**Recommendations are contextual, not catalogued.** A delegate who uses ClickUp shouldn't have to read a manual to know syncflow can hand them a ClickUp MCP. Once their stack contains the tool, syncflow should proactively offer the matching MCP setup at the right moment — *not* spam them with every available integration at once.

The trigger is the captured stack. The offer is opt-in. The wiring is documented in `integrations/<name>.md` so the delegate can copy-paste a single block into their Claude Desktop config and restart.

This is the "smart contextual integration recommendations" surface area from the v0 plan. v0 ships **5** integrations: ClickUp, Slack, Notion, Supabase, n8n.

---

## When NOT to fire

- If the stack doesn't contain the tool — don't volunteer integrations the delegate hasn't asked about. Nothing more annoying than being upsold tools you already rejected.
- If the delegate has already declined this integration earlier in the conversation — don't re-pitch.
- Mid-question. Don't interrupt an interview batch to pitch ClickUp. Wait for the natural breakpoint *(end of section, or end of interview)*.
- More than once per integration per conversation.
- If `tier_2` is off AND the integration only makes sense for tier-2 *(e.g., Supabase migrations need filesystem MCP to write SQL files locally)* — surface the prerequisite and stop.

---

## The 5 integrations

| Stack signal in `brain` | Integration file | Best for |
|---|---|---|
| `pm_tool` contains `clickup` or `tools[]` mentions ClickUp | `integrations/clickup.md` | Reading task/list/space structure when sequencing the migration plan |
| `comms_tool` contains `slack` or stack mentions Slack | `integrations/slack.md` | Posting roadmap summaries, build-plan updates, or alert messages |
| `tools[]` contains Notion or `pm_tool` is Notion | `integrations/notion.md` | Reading existing wiki pages, mirroring the roadmap as a Notion doc |
| `tools[]` contains Supabase or `data_sources[]` mentions Postgres + Supabase | `integrations/supabase.md` | Inspecting schemas, writing migrations, scoping per-module DB work |
| `tools[]` contains n8n or `custom_tools[]` mentions n8n flows | `integrations/n8n.md` | Reading existing workflow JSON, validating proposed flows |

---

## Behaviour

1. **Detect.** When `capture-fact` lands a stack fact, compare the tool name *(case-insensitive, normalised)* against the trigger table above. If no match → return.

2. **Wait for the right moment.** Don't interrupt the current batch. Set an internal flag *"offer ClickUp at next breakpoint"*. Natural breakpoints:
   - End of a section
   - End of the full interview
   - Right before `recommend-modules` if the chosen module's reference build uses the tool
   - When the delegate explicitly asks *"can you connect to X?"*

3. **Offer.** One sentence, one offer. Format:

   > *"You mentioned **ClickUp**. Want the 5-minute ClickUp MCP setup? It'll let me read your task structure when we sequence the migration plan."*

   That's it. Don't pitch. Don't list 5 capabilities. One sentence value, then wait.

4. **On accept** *("yes" / "sure" / "show me" / "go")*:
   - Load `integrations/<name>.md` from Project Knowledge.
   - Render its contents directly in chat — copy-paste-ready.
   - Tell the delegate to **quit Claude Desktop fully (⌘Q) and reopen** for the MCP server to load.
   - Confirm next-step: *"once you've reopened, type `/health-check` and I'll confirm the MCP shows up."*

5. **On decline** *("no" / "skip" / "maybe later")*:
   - Acknowledge once, briefly. *"Okay — moving on. You can ask me anytime by saying 'set up ClickUp'."*
   - Don't re-pitch this integration this session.

6. **On accept-but-stuck** *(delegate followed the snippet, restarted, but `/health-check` still shows MCP missing)*:
   - Route to `diagnose` with focus on stuck-state #5 (MCP-related).
   - Common fixes documented per-integration in the snippet's troubleshooting block.

---

## How a recommendation reads in chat

Compact. Frame as offer, not announcement:

```
Quick aside before we go further — you mentioned Slack and ClickUp.
We have 5-minute MCP setups for both that let me read your channels
and task structure directly. Want either of them now, or skip?
```

If the delegate takes both:

```
Set up ClickUp first (it's the bigger win for your migration plan), 
then Slack. Here's ClickUp:

  [contents of integrations/clickup.md, rendered in full]

Once you've added the snippet to your config and restarted Claude
Desktop, type /health-check and I'll confirm it's wired. Then I'll
hand you the Slack snippet.
```

---

## Capability framing

Be honest about what each MCP unlocks. Don't oversell. Each `integrations/<name>.md` documents:

- **What it lets syncflow do** *(read X, write Y; never both unless explicitly noted)*
- **What it doesn't do** *(usually: provisioning, billing changes, anything destructive)*
- **The 1-block JSON snippet** to paste into `claude_desktop_config.json`
- **Restart instruction**
- **3-line troubleshooting block**

If the delegate asks for a capability the MCP can't deliver *(e.g., "use Supabase MCP to deploy my edge functions automatically" — out of scope)*, name the gap. Suggest the build path *(generate-build-plan + generate-cc-prompt)* instead.

---

## Persistence

If the delegate completes an integration and is on tier-1 *(brain.json in Knowledge)*:

- Add `brain.recommendations.integrations_enabled[]` += `<name>` so future conversations know it's wired.
- Mention it in the next `emit-brain-artifact` hand-off so the brain-update propagates.

If on tier-2 *(filesystem MCP)*: the new MCP server entry sits in `claude_desktop_config.json` regardless of brain state. Don't try to manage Desktop config from inside chat — the snippet does it once.

---

## Don't

- Don't pitch integrations the delegate hasn't mentioned. Cold outreach is annoying.
- Don't pitch more than once per integration per conversation.
- Don't bundle multiple integration pitches into one offer. Mention up to 2; let the delegate pick the order.
- Don't auto-load the integration content into Project Knowledge. The snippet is rendered in chat; the delegate copies what they need.
- Don't claim an MCP can do something it can't. Each `integrations/<name>.md` documents the capability boundary; stay inside it.
- Don't recommend an integration that can't be wired without tier-2 (filesystem MCP) when tier-2 is off. Surface the prerequisite first.
- Don't make the integration recommendation the focus of the conversation. It's an aside; the consultant frame is primary.
