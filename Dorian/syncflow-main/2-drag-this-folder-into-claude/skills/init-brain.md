# `init-brain`

**When**
- After `onboard-delegate` captures the brand name
- Before `run-interview` starts capturing facts

**Inputs**
- `<brand-slug>` — lowercase-hyphenated brand name from onboarding
- `<brand-display>` — human-readable brand name *(original casing)*

**Tools**
- working memory only — no filesystem writes in default flow
- *(power-user tier 2 only)* if filesystem MCP is configured AND user opted in, also write `output/<brand-slug>/brain/*.md` skeletons

**Outputs**
- An in-context `brain` object initialised with the structure below
- *(tier 2 only)* skeleton MD files on disk

---

## Behaviour

1. **Check Project Knowledge for an existing `brain.json`.**
   - If a `brain*.json` file is attached to this Project's Knowledge, do NOT init a fresh brain. Instead, fire `restore-brain-from-knowledge` to load the existing brain and offer continuation. Stop.
   - If no brain.json is in Knowledge, proceed.

2. **Initialise the brain structure** in your working memory:

   ```
   brain = {
     schema_version: "1.0",
     brand: <brand-slug>,
     brand_display: <brand-display>,
     captured_at: <ISO date — now>,
     last_updated_at: <ISO date — now>,
     interview_minutes: 0,
     fact_count: 0,
     sections: {
       business: {},
       team: {},
       stack: {
         tools: [],
         ai_tools: [],
         custom_tools: [],
         data_sources: [],
         reporting_cadence: [],
         csv_moments: [],
         glue_humans: []
       },
       goals: {}
     },
     recommendations: {
       diagnosis: null,
       architecture: null,
       replacement: null,
       modules: [],
       featured_module: null
     },
     transcript: []
   }
   ```

   This object lives in your working memory throughout the conversation. `capture-fact` updates it; `read-brain` inspects it; `emit-brain-artifact` serialises it to JSON for tier-1 persistence.

3. **Tier 2 only — IF filesystem MCP is configured AND user explicitly opted in:**
   - Check if `output/<brand-slug>/brain/` already exists on disk
     - If it exists with content → ask user whether to load that brain instead of starting fresh
     - If it's empty or absent → proceed
   - Create the folder tree under `output/<brand-slug>/brain/` and write skeleton MD headers per section
   - **Do not assume tier 2 is on.** Default flow is in-memory only.

4. **Stay silent.** Init is invisible to the user. The next message they see is `run-interview` Section 1, Batch 1.

---

## Tier 2 disk format (when applicable)

If writing to disk, use this format. Captured facts as flat `key: value [tone]` lines under H2 headings.

```md
# Stack · Ideal Direct

*Captured by syncflow on 2026-05-05. Edit by hand if anything changes — syncflow will re-render the roadmap on demand.*

---

## Tools (paid SaaS)

- helium10: $179/mo [rented]
- sellerapp: $99/mo [rented]

## CSV moments / glue-humans

- helium10 → sellerapp → sheet: 3hr/wk, Chris [csv-moment]
- reviews → slack → clickup: 30min/day, Maya [glue-human]
```

`capture-fact` updates BOTH the in-memory brain and *(tier 2 only)* the on-disk MD. The in-memory brain is the source of truth; disk is a mirror.

---

## Don't

- Don't pre-populate facts. The brain starts empty; the interview fills it.
- Don't fabricate filesystem operations when tier 2 isn't on. Default flow stays in-memory.
- Don't init for multiple brands in one call. One brand per init.
- Don't tell the user *"brain initialised"* — silent operation.
- Don't write `roadmap.html` or `brain.json` yet — those are emitted as artifacts at the end of the demo path.
