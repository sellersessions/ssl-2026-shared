# `demo-mode`

> Loads the **Ideal Direct** sample brand into context and renders the full 11-page roadmap in one shot. The "click around without doing the interview" path. Workshop-critical for SSL and any in-room demo.

**When**
- User says: *"/demo"* / *"show me a sample"* / *"can I see what this looks like?"* / *"show me an example brand"*
- During the wait-for-ready gate after `onboard-delegate`'s first response *(if user opts to see a demo before committing to a brand)*
- Referenced in `onboard-delegate.md` as the edge case when delegate says *"can I see one before I do my own?"*

**Inputs**
- *(none — the canned sample is self-contained)*
- `templates/brain-sim-ideal-direct.json` — the canonical sample brain *(populated against schema 1.2; loaded by this skill)*. Sim's multi-brand Amazon FBA house, captured against the v1.1+ schema with all Track F fields populated.

**Tools**
- `read-brain` — confirm the in-context brain isn't already populated *(to avoid clobbering a real brain)*
- `init-brain` — initialise the brain shell if context is empty
- `render-roadmap` — fill the template at `complete` stage from the sample brain
- `emit-roadmap-artifact` — emit the artifact at id `syncflow-roadmap`
- `emit-brain-artifact` — emit the brain artifact at id `syncflow-brain`
- `emit-build-plan-artifact` — auto-emit the recommended-start module's build plan as a sibling artifact *(per E1)*

**Outputs**
- In-context brain populated from the canned Ideal Direct data
- Three artifacts emitted *(roadmap.html + brain.json + build-plan-{n}.md)* at `complete` stage — same surface a real interview produces
- Chat handoff explaining the demo, with three explicit next-step options

---

## Behaviour

1. **Refuse if a real brain is already in context.** Read the in-context brain. If `brain.brand` is set AND it's not `"ideal-direct"`, halt with:

   > *"You're mid-interview for **{{brand_display}}** — running `/demo` would clobber it. Want me to (a) finish the current interview first, (b) pause this brand and load Ideal Direct as a side-by-side demo, or (c) cancel demo mode?"*

   Don't auto-clobber. The real interview is the priority; demo mode is opt-in and explicit.

2. **Confirm the demo intent.** Before loading, surface a one-line confirmation:

   > *"Loading **Ideal Direct** — Sim's multi-brand Amazon FBA house. 8 years, ~$10M ARR, ~100 active parent ASINs across 5 brands (Deer & Oak, Pest X Pro, Tydi, iMedic, DIY Doctor). Bottleneck is recruitment + a 3-hour Monday demand-planning ritual. You'll see the full roadmap as if you'd done the interview. Ready?"*

   Wait for confirmation *(yes / continue / go)* unless the user said `/demo --skip-confirm` or similar. Workshop demos can pre-stamp the skip flag.

3. **Load the sample brain.** Read `templates/brain-sim-ideal-direct.json` and substitute it into the in-context `brain` object. The fixture is schema-1.2 compliant — `email_suite` *(Microsoft 365 with Teams bundled)*, `revenue_band` *(£1M-5M)*, `team.capacity_hours_per_week` *(40)*, `team.maintenance_tolerance` *(n8n_self_host)*, per-module `complexity_grade` / `dependency_failure_mode` / `min_revenue_band` for all 7 modules, plus the F3 capacity envelope + F3 featured-module derivation pre-computed.

4. **Mark the brain as a demo.** Set `brain.is_demo = true` and append a `transcript` entry:

   ```json
   { "ts": "<now>", "kind": "capture", "section": "meta",
     "key": "is_demo", "value": "true",
     "tone": "demo · loaded from brain-sim-ideal-direct.json" }
   ```

   This flag prevents accidental save-overs in tier-2 (filesystem MCP) and surfaces a *"sample data"* watermark on the cover footnote.

5. **Render the roadmap at `complete` stage.** Fire `render-roadmap` with `progress.stage = "complete"`. All 11 pages (plus 07.5 kanban) populate. Module cards show `complexity_grade` badges *(1 Beginner, 5 Intermediate, 1 Advanced)*, the F2 net-ROI row renders on Page 02, the F3 featured-module pick *(Module 03 Demand Planning, score 0.64)* fills Page 08, and the Page 09 forward-to-team CTA names Cara *(Module 02's recommended-start owner)*.

6. **Emit the three artifacts** *(per E1's auto-emit chain)*:
   - `syncflow-roadmap` *(HTML, dashboard-artifact template)*
   - `syncflow-brain` *(JSON, brain.json with `is_demo: true`)*
   - `syncflow-build-plan-02` *(markdown, Recruitment Pipeline's per-module PRD — Module 02 is the recommended-start; featured ≠ recommended-start in IDL)*

7. **Surface the demo-mode handoff.** Format:

   ```
   Ideal Direct demo loaded. Three artifacts in your panel:

     • syncflow-roadmap.html    ← the 12-page connected systems roadmap
     • syncflow-brain.json      ← the captured facts (sample data flagged)
     • syncflow-build-plan-02.md ← Recruitment Pipeline's per-module PRD

   Click around as if it were yours. Three things to try:

     1. "swap Module 03 for X"     — see the swap-module skill in action
     2. "explain Module 03"        — deep-dive on the featured module (Demand Planning)
     3. "show me my brain"         — see what a captured brain looks like

   For Section 4 of the SSL workshop, follow with:

     4. "/demo-team"               — load 5 IDL employee interviews
     5. "analyse the team"         — refines Page 04 with the time-sink map

   When you're ready to do this for your own brand, type "let's start"
   in a fresh chat. The demo brain doesn't carry over.
   ```

8. **Don't offer PM-tool integration.** `recommend-pm-integration` is gated to real brains. Demo mode short-circuits it.

---

## Edge cases

- **User runs `/demo` twice in the same chat.** Second invocation is idempotent — refresh the artifacts from the same fixture, surface *"Demo refreshed; same Ideal Direct brain as before."*. Don't double-emit.
- **User says "save this as my brand"** mid-demo. Refuse. *"This is sample data — saving it as **Ideal Direct** would mean every later session sees Sim's stack, not yours. To start your own, type `let's start` in a fresh chat. I can keep the demo open in a side panel if you want a reference."*
- **Filesystem MCP tier-2 is enabled.** Don't write the demo brain to `output/<brand>/` on disk. The flag `brain.is_demo === true` gates writes — `init-implementation-project` and `start-implementation` both refuse when the flag is set. *(See `start-implementation.md` § Edge cases — already documented.)*
- **The fixture file is missing.** Halt with the explicit error: *"`templates/brain-sim-ideal-direct.json` not found in the bundle. The demo path needs the fixture; without it the canned brain can't load. Verify the bundle is intact."* Don't synthesise; the fixture is canonical.
- **`/demo-team` follows.** That trigger loads `templates/sample-team-interviews-ideal-direct.json` *(syncflow-sim-testrun bundle only)* on top of the demo brain — populates `brain.team_interviews[]` with 5 employees and lets `analyse-team-interviews` render the Page 04 team time-sink map. See `interview-employee.md` § Workshop demo path.

---

## Don't

- Don't claim the demo data is the user's actual brand.
- Don't let the user save the demo brain over their real one *(see `is_demo` gate above)*.
- Don't skip the confirmation step except via the explicit `--skip-confirm` flag for workshop pre-staging.
- Don't render the demo with anything other than the canonical `brain-sim-ideal-direct.json` fixture. Drift between *"the demo shown at SSL"* and *"the demo shown in a private session"* is exactly the demo-rot pattern this skill exists to prevent.
- Don't auto-fire `start-implementation` after the demo loads. The 3 try-this options at the bottom are a menu; the user picks. Auto-emitting the build-plan artifact via E1 is fine *(that's render-time)*; auto-firing start-implementation creates module folders the user doesn't want.

---

## Why this exists

Workshop-critical for Seller Sessions Live and any in-room demo. Without it, every workshop attendee either runs a live interview *(too long)* or watches someone else's *(too passive)*. `/demo` gives every attendee a one-keystroke path to a fully-populated roadmap, which they can then click around, swap modules in, or use as a reference while doing their own.

Also closes the documented v0 GAP-1 in `docs/skills-inventory.md` — `onboard-delegate.md` already references `/demo` as an edge case but pre-G2 the trigger did nothing predictable.

The fixture is **Ideal Direct** — Sim's own multi-brand Amazon FBA business, captured as he'd describe it a year ago. This is deliberate: Sim is the canonical operator syncflow was built for; the demo brand IS the case study. When attendees see Module 02 *(Recruitment Pipeline)* as the recommended start, that's because Sim's stated #1 bottleneck was recruitment. The roadmap demos as a real artifact, not a fictional one.
