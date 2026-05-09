# `help`

> **Execution rule (per `0-paste-this-into-custom-instructions.txt` § How you work).** Read this skill file in full before responding to any help trigger. Don't free-style. Cite the skill file in your reply.

**When**
- User says: `help`, `?`, "what commands do I have?", "what can I type?", "list commands", "show me the commands"
- User types `help <skill-name>` for a detailed view of a single skill
- User types `/<word>` and `<word>` doesn't match any skill — Florence suggests `help` rather than free-styling

**Inputs**
- Optional sub-arg: `<skill-name>` (e.g. `help optimize-listing`) — if present, show that skill's docs
- In-context brain — for tailoring the recommendation order (e.g. if no brand set, recommend `onboard` first)

**Tools**
- None. This skill outputs to chat only — no artifact emission.

**Outputs**
- A compact chat-side markdown table of all available commands with their natural-language equivalents and one-line purpose
- For sub-commands: a focused excerpt of the requested skill's `When / Inputs / Outputs` sections

This skill is **chat-only**. It exists because Cowork's native autocomplete doesn't surface Florence's commands — `help` is the lookup surface for delegates who want to scan what's available.

---

## Behaviour

### Default — `help` (no args)

Output exactly this format. Don't paraphrase, don't add commentary, don't sign off — this is a reference card, not a conversation:

```
**Florence — commands**

Type any of these as plain words — no slash needed. (Slashes still work if you prefer them, but they're optional.)
You can also use the natural-language phrases on the right — Florence routes the same way.

| Command | Equivalent phrasing | Purpose |
|---|---|---|
| `onboard` | "let's start" / first message | First-run brain interview (~10 min) |
| `restore-brain` | upload `brain.json` | Re-hydrate state from a previous session |
| `track-products <ASINs>` | paste any B0… or amazon URL | Fetch product details, cache, populate cockpit |
| `today` | "today's brief" / "what should I do?" | Daily brief with priority pick + actions |
| `optimize-listing <ASIN>` | "audit my listing" / "fast audit" | Fast CRO audit (~30s, 5-6 SellerApp calls) |
| `shopper-interrogator <ASIN>` | "objection mining" / "find what's stopping shoppers" | Full CVR objection-mining loop |
| `recommend-test` | "my CTR is low" / "what test should I run?" | Match your problem to the right Pinion test |
| `pinion` | "launch a poll" / "test these images" | Direct ProductPinion test launch |
| `image-strategy` | "category research" / "what wins in my category?" | Top-15 bestsellers analysis → tunes Florence's Higgsfield prompts to your brand (~10 min, ~300 SellerApp tokens). Run before first render. |
| `render` | "generate an image" / "make a main image" | Generate Higgsfield image variants (reads `brain.image_strategy` if set) |
| `idea <text>` | "save this idea" | Capture a hypothesis into Ideas page |
| `projects` (or `project list`) | "what's running?" | Open the Projects dashboard |
| `project <id>` | — | Inspect / rename / close a project |
| `resources` | "show me my references" | Open the Resources tab |
| `pin <path>` / `unpin <path>` | — | Pin a reference doc to Resources |
| `setup-validate` | "is everything working?" | Health check across MCPs + brain |
| `log <note>` | "that's wrong" / "broken" | Capture test feedback into the test-log artifact |
| `help` | — | This list |
| `help <skill>` | — | Detailed view of one skill |

**Cockpit pages:** Ideas / Brand / Projects / Resources / About — navigate the cockpit artifact (right panel) to switch.

**Per-product artifacts:** every CRO skill emits a card per ASIN. They stay alongside the cockpit so you can download / share individual deliverables.

— F.
```

### Sub-arg — `help <skill-name>`

The user wants details on one skill. Read the matching skill file from `skills/<skill-name>.md` (or `skills/cro-library/<skill-name>/SKILL.md` for library skills). Print:

```
**`/{skill-name}`**

**When:** {first paragraph of the When section, trimmed}

**Inputs:** {bulleted list, trimmed}

**Outputs:** {bulleted list, trimmed}

**Read the full spec:** `skills/{skill-name}.md`

— F.
```

If the skill doesn't exist, say so and link back to the main `help` table:

> No skill matching `{skill-name}`. Type `help` for the full list.

### Special case — `/<unknown>` (routed to help by Custom Instructions)

When Custom Instructions detects `/<word>` not matching any skill catalogue entry, Florence routes here with the unknown word:

> `/{word}` isn't a Florence command. Type `help` for the list, or did you mean one of these: `{closest-matches}`?

Where `{closest-matches}` is up to 3 skills with similar names by Levenshtein distance or substring match.

---

## Voice rules

- **No improvisation.** The default `help` output is a reference card. Don't add greetings, don't add suggestions tailored to the user, don't sign off with `— F.` (already in the template).
- **Sub-arg detail is read from the skill file.** Don't paraphrase. If the When/Inputs/Outputs sections are dense, trim to the first 1-2 lines per section.
- **Closest-match suggestions are conservative.** If no match within 2 character-edits, don't suggest anything.

---

## Don't

- Don't emit an artifact. `help` is chat-only. The cockpit doesn't track help-lookups.
- Don't auto-render `help` on first message of a session. Onboarding handles "first message" routing per Custom Instructions § First-run detection.
- Don't list the 46 cro-library skills in the default `help`. They're advanced — point at `skills/cro-library/INDEX-skill-library-plan.md` instead in the default output if the user explicitly asks for "all skills".
- Don't surface skill files that don't exist in Project Knowledge. If the user dragged in a partial folder, Florence only lists what's available.
