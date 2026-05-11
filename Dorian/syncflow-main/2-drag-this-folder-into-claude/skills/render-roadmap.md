# `render-roadmap`

**When**
- *(Evolving artifact pattern — see `emit-roadmap-artifact.md` and the system prompt § Artifact emission for full cadence.)*
- After `onboard-delegate` runs → render at `stage: "pre-interview"` *(brand-less stub, then re-render with brand stamp)*
- After each interview section completes → render with `stage: "business" / "team" / "stack" / "goals"`
- After `recommend-modules` has the ordered module list → render with `stage: "deriving"`
- After all derivations complete → render with `stage: "complete"`
- User says *"re-render"* / *"regenerate the roadmap"* → preserve current stage
- After a brain edit + re-derivation → preserve current stage

**Inputs**
- The in-context `brain` object
- All structured outputs in context: diagnosis, architecture, replacement table, module list, featured module
- `templates/dashboard-artifact.html` — vanilla HTML + inline CSS template with per-page slot placeholders. **No CDN dependencies.**
- `templates/_placeholders.md` — placeholder contract

**Tools**
- read template from Project Knowledge
- *(no user output during this skill — output is consumed by `emit-roadmap-artifact`)*

**Outputs**
- A filled HTML string, in working memory, ready for `emit-roadmap-artifact` to emit as a Claude artifact

---

## Critical: the template constraint *(pivot-11)*

The template is **vanilla HTML + inline CSS, with NO external dependencies.** Specifically:

- ❌ No React, no JSX, no `<script type="module">`
- ❌ No Tailwind CDN, no esm.sh imports, no Google Fonts
- ❌ No external images
- ❌ No `<link>` to external stylesheets

**Why:** Claude Cowork's artifact sandbox blocks scripts from `cdn.tailwindcss.com`, `esm.sh`, `fonts.googleapis.com`, etc. A previous version of this template used React+Tailwind via CDN; the artifact emitted but rendered EMPTY because all scripts were blocked. The current template uses inline `<style>` with CSS variables for design tokens, system font stacks, and pure HTML.

If you're tempted to add interactivity *(charts, sortable tables, progress animations)*: don't. Use Mermaid via `application/vnd.ant.mermaid` artifacts for diagrams; everything else stays as static HTML with inline CSS.

---

## How the template is shaped

The template has 12 `<section>` elements *(pages 00–10 plus a fractional Page 07.5 slotted between 07 and 08 — the fractional ID means existing 08/09/10 keep their stable IDs and prose references)*. Three are **always rendered**:

| Page | Always-on content |
|---|---|
| 00 Cover | Brand wordmark, headline, FOR/BY/SEAT meta. Has fallback copy when brand isn't captured yet. |
| 01 Manifesto | Worldview pull-quote + two cards (today vs owned). Static-ish; same content for everyone. |
| 10 Appendix | Glossary + brain snapshot + about-syncflow block. |

The other **9 pages (02–09 + the fractional 07.5)** have two slot placeholders each that you fill at render time:

```
<section id="page-02" class="page {{page_02_class}}">
  {{page_02_content}}
</section>
```

- `{{page_NN_class}}` — either empty *(page renders fully)* or `locked` *(page shows muted placeholder)*
- `{{page_NN_content}}` — the actual HTML for that page; you write this

Plus the standard brand/cover/progress placeholders and the manifesto/appendix slots.

---

## Behaviour

### 1. Read the template

`templates/dashboard-artifact.html` from Project Knowledge. Confirm the file does NOT contain `<script type="module">` or `cdn.tailwindcss.com` etc. — if it does, you're reading a stale copy; halt and surface that the bundle needs updating.

### 2. Determine `progress.stage`

One of: `pre-interview` / `business` / `team` / `stack` / `goals` / `deriving` / `complete`. Set `progress_pct` and `progress_label` from this:

| Stage | progress_pct | progress_label |
|---|---|---|
| pre-interview | 0  | Stub created · awaiting interview |
| business      | 25 | Section 1/4 captured · Business |
| team          | 50 | Section 2/4 captured · Team |
| stack         | 75 | Section 3/4 captured · Stack |
| goals         | 90 | Section 4/4 captured · Goals |
| deriving      | 95 | Deriving recommendations… |
| complete      | 100 | Roadmap complete |

### 3. For each conditional page (02–09), decide locked vs populated

Per-page minimum stage:

| Page | Minimum stage to render populated | Locked-state "Available after…" |
|---|---|---|
| 02 Summary | `team` | Team section captured |
| 03 TOC | `pre-interview` *(unlocked at stage 0 — static content, no brain data needed)* | n/a — always renders |
| 04 Current state | `stack` | Stack section captured |
| 05 Future state | `deriving` | future-state designed |
| 06 Replacement | `deriving` | replacement table derived |
| 07 Migration plan | `deriving` | modules sequenced |
| 07.5 Project Board | `deriving` | modules sequenced |
| 08 Featured module | `deriving` | modules sequenced |
| 09 Closing | `complete` | interview complete |

**Page 03 (TOC) is special** — it's static "what's coming" content that helps the user understand the report's shape at minute 0. Always render it populated, regardless of stage. See § Per-page populated HTML below for the static TOC HTML.

If current stage is BELOW the page's minimum: substitute `{{page_NN_class}}` with `locked` and `{{page_NN_content}}` with the **locked-page HTML stub** *(see § Locked-page stub below)*. Otherwise: substitute class with empty string and content with the page's full populated HTML *(see § Per-page populated HTML below)*.

### 4. Substitute the cover + manifesto + appendix placeholders

These pages always render. Fill these placeholders:

#### Cover (page 00) — brand-aware fallback

If `brain.business.brand` is set:
```
{{cover_pill}}            "Connected Systems Roadmap"
{{report_version}}        "v1.1"
{{report_date}}           today, format "DD mon YYYY", lowercase month
{{cover_headline_lead}}   "The system"
{{cover_headline_brand}}  "<brand> will own."
{{cover_body}}            "A diagnosis of your current sprawl, the future-state blueprint, and a module-by-module migration to get there."
{{cover_future_hook}}     "16 weeks from now, Mondays look different at <brand>. {{first_30_days_owner_1}} opens {{first_30_days_action_1_short}}."
{{cover_for_line}}        "<ops_lead_name> · <ops_lead_role>, <brand>"
{{cover_by_line}}         "syncflow · Connected Systems Studio"
{{cover_seat_line}}       "<interview_minutes> minute interview · <fact_count> facts captured"
```

If `brain.business.brand` is NOT set *(minute-0 stub)*:
```
{{cover_pill}}            "Connected Systems Roadmap"
{{report_version}}        "v1.1"
{{report_date}}           today
{{cover_headline_lead}}   "syncflow"
{{cover_headline_brand}}  "Connected Systems Roadmap"
{{cover_body}}            "A diagnosis of your current sprawl, the future-state blueprint, and a module-by-module migration to get there. Filling in as we capture your stack."
{{cover_future_hook}}     "16 weeks from now, Mondays look different at the brand we're about to capture."
{{cover_for_line}}        "Your brand · captured next"
{{cover_by_line}}         "syncflow · Connected Systems Studio"
{{cover_seat_line}}       "Interview pending · 0 facts captured"
```

**`{{cover_future_hook}}`** *(Track F · Sim #11)* — opens the cover with the future-state hook rather than the abstract sprawl framing. Sourced from `brain.recommendations.first_30_days[0]` *(if populated)* or fabricated from `featured_module.week_after`. **One sentence, present tense, names the owner.** Renders below the cover headline, above the for/by lines. Skip when the brain is at minute-0 stub stage.

#### Manifesto (page 01) — Track F tone-warming pass *(Sim #2 + #20)*

```
{{manifesto_pill}}              "Connected Systems · the worldview"
{{manifesto_headline_lead}}     "In 2026, SaaS is optional."
{{manifesto_headline_accent}}   "The brands that scale realise it."
{{manifesto_body}}              "<brand> already owns more than most — every captured tool, every workflow that runs, every Monday ritual. The question isn't rented vs owned; it's which of the systems below compound on top of what you've built, and which add a SaaS subscription that your team will outgrow."  *(or generic version if no brand)*
{{manifesto_card_today}}        "<acknowledge what they've built first> — and on top of that, twenty AI tools that change every month, CSVs piped between Helium 10, SoStocked, Adtomic, and the spreadsheet, glue-humans paid to copy data because the tools don't talk."
{{manifesto_card_owned}}        "Supabase holds the truth. n8n (or your Claude Code app, depending on what your team will maintain) moves the data. ClickUp runs the work — the OS you already pay for. Claude Code handles the inference where it earns its place. Six modules retire the rented surface, on a 12–16 week sequence. Net £XX,XXX/yr after the new stack costs come out of the gross."
```

**Track F tone-warming rules** *(Sim #2 + #20)*:
- The lede no longer reads as a verdict on the delegate's stack. *"Most brands rent / The ones that scale, own"* implied a moral binary; the new lede frames SaaS as optional and gives the delegate credit for what's already built.
- `{{manifesto_body}}` opens with an acknowledgment line — *"<brand> already owns more than most"* — sourced from `brain.sections.stack.tools[]` filtered to `tone in {owned, owned-untouched, keep}`. **Calibrate to 2-3 acknowledgments per page**, not one per paragraph; over-correction reads as flattery.
- `{{manifesto_card_today}}` opens with the same acknowledgment posture — *"and on top of that"* — rather than diving straight into the sprawl indictment.
- `{{manifesto_card_owned}}` references `team.maintenance_tolerance` so the n8n vs Claude Code app distinction surfaces here, not just on Page 07. Net £/yr replaces the v1 *"$XXX/mo"* (lower-cased k symbol). **Use net (after new_stack_cost) not gross** *(Sim #8 + #12)*.

#### Appendix (page 10)

```
{{brand_name}}        brand display name (or "syncflow" if unset)
{{fact_count}}        brain.fact_count
{{last_updated_at}}   brain.last_updated_at, formatted
{{about_header}}      "About syncflow"
{{about_body}}        "syncflow is a Connected Systems Studio for 8-figure Amazon brands. We diagnose the sprawl, design the owned blueprint, and build it with you in your Claude Code session — or hand you the plan and step out of the way."
```

#### Progress footer (always)

```
{{progress_pct}}      number from the table in step 2
{{progress_label}}    string from the table
```

### 5. Substitute the brand placeholder in the nav rail

```
{{brand_name}}        brand display name (or "syncflow" if unset)
```

### 6. Verify the filled HTML

- No remaining `{{` substrings *(except inside `<style>` for things like `width:{{progress_pct}}%` — make sure those got substituted)*.
- The `<style>` block intact at the top.
- All 11 `<section id="page-NN">` elements present.
- Progress footer's `<div class="bar-fill" style="width:NN%">` has a real number.

### 7. Hand the filled HTML to `emit-roadmap-artifact`

The artifact tool call is the next step.

### 8. Auto-fire `emit-build-plan-artifact` for the recommended-start module *(stage `complete` only)*

After `emit-roadmap-artifact` succeeds, ALSO fire `emit-build-plan-artifact` for the recommended-start module *(when `progress.stage === complete`)*. This ships the per-module PRD as a sibling markdown artifact alongside the roadmap PDF, so the delegate's downloads folder ends the session with all three artifacts: `syncflow-roadmap.html` + `syncflow-brain.json` + `syncflow-build-plan-{n}.md`.

**Conditions** *(all must hold)*:
- `progress.stage === "complete"`
- `brain.recommendations.modules` contains a module with `tag === "recommended start"`
- The recommended-start module's `status !== "tolerated"`

If any condition fails, skip step 8 silently. Don't fall back to a different module — `emit-build-plan-artifact` is opinionated about emitting only the recommended-start module on the auto-emit path *(see `emit-build-plan-artifact.md` § Behaviour 1)*.

**For intermediate stages** *(`pre-interview`, `business`, `team`, `stack`, `goals`, `deriving`)*: skip step 8. The brain is too sparse mid-interview to support a useful build plan; the auto-emit path is `complete`-only.

**On re-render at `complete` stage** *(user says "re-render"/"regenerate")*: also re-fire step 8 to refresh the build-plan artifact. `emit-build-plan-artifact` handles the `update_artifact` *(stable ID)* path; the delegate's downloaded build plan can be replaced with the latest version.

Done.

---

## Locked-page stub *(use for any page below its minimum stage)*

Substitute `{{page_NN_class}}` with `locked` and `{{page_NN_content}}` with this HTML *(adapt the labels)*:

```html
<span class="locked-pill">{{NN}} · {{label}} · locked</span>
<h2>This fills in as we go.</h2>
<p>Available after {{after}}. Keep answering — the artifact updates automatically.</p>
```

Where `{{NN}}` is the page number, `{{label}}` is the page name *(Summary / TOC / Current state / etc.)*, and `{{after}}` is the trigger condition from the table in step 3.

Example for page 02 when stage is `pre-interview`:

```html
<span class="locked-pill">02 · Summary · locked</span>
<h2>This fills in as we go.</h2>
<p>Available after Team section captured. Keep answering — the artifact updates automatically.</p>
```

---

## Per-page populated HTML

When a page's dependencies ARE met, render its full HTML inline. Brief shape per page below; populate from brain + derived outputs.

### Page 02 · Summary

```html
<!-- Motion (handoff §B): headline + lede Settle in · 1px ink Rule-draw under the lede ·
     three ROI numbers Tally up in parallel · three insight cards Settle L→R, 60ms stagger.
     Print + reduced-motion gates collapse every primitive to its final state. -->
<span class="pill is-settle s-1">Diagnosis · summary</span>
<h1 class="page-title is-settle s-2" style="margin-top:16px">{{summary_headline}}</h1>
<p class="lead is-settle s-3">{{summary_body}}</p>
<div class="is-rule-draw" style="height:1px;background:#0A0E1A;margin:18px 0 0;width:100%;max-width:560px;animation-delay:360ms"></div>

<!-- ROI · projected annual impact (cherry-picked addition; aggregated from brain.recommendations.modules[]) -->
<div class="is-settle s-4" style="margin-top:24px;padding:18px 20px;border-radius:12px;background:#E6FAF1;border:1px solid #00D67A">
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <span class="label label--savings">ROI · projected annual impact</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#5C6473">{{roi_confidence_label}}</span>
  </div>
  <div class="grid-3" style="margin-top:12px;gap:24px">
    <div>
      <div class="display is-tally" style="font-size:42px;color:#00D67A;line-height:1">{{big_savings}}</div>
      <div class="label" style="margin-top:6px;color:#5C6473">{{big_savings_label}}</div>
    </div>
    <div>
      <div class="display is-tally" style="font-size:42px;color:#0A0E1A;line-height:1">{{big_hours}}</div>
      <div class="label" style="margin-top:6px;color:#5C6473">{{big_hours_label}}</div>
    </div>
    <div>
      <div class="display is-tally" style="font-size:42px;color:#0A0E1A;line-height:1">{{big_modules}}</div>
      <div class="label" style="margin-top:6px;color:#5C6473">{{big_modules_label}}</div>
    </div>
  </div>
  <p style="margin-top:14px;margin-bottom:0;font-size:12px;color:#5C6473;line-height:1.5">{{roi_caveat}}</p>

  <!-- Track F · Sim #8 + #12: gross / new-stack-cost / net breakdown.
       Renders below the headline 3-numbers when derive-replacement-table
       has populated new_stack_cost_per_year_gbp + net_savings_per_year_gbp.
       Sim's pre-F1 version showed gross only; he flagged that as misleading
       because the future state DOES cost something (Claude sub, n8n VPS,
       Supabase tier). This row makes the math visible. -->
  <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(10,14,26,0.12);display:flex;justify-content:space-between;gap:12px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:12px;color:#5C6473">
    <div>
      <div>+ {{gross_savings_label}}</div>
      <div style="margin-top:2px">+ {{gross_subs_savings_label}}</div>
      <div style="margin-top:2px">− {{new_stack_cost_label}}</div>
    </div>
    <div class="text-right">
      <div style="color:#0A0E1A;font-weight:600">= {{net_savings_label}}</div>
      <div style="margin-top:2px;color:#9AA1AE;font-size:11px">{{rate_source_label}}</div>
    </div>
  </div>
</div>
```

**ROI card population rules:**

- **`big_savings`**: `brain.recommendations.replacement.net_savings_per_year_gbp` *(Track F · Sim #8 — net, not gross)*. Format with currency symbol + comma grouping: `£28,000`, `£113k`, `£1.2M`. Round to nearest hundred for figures < £10k; nearest thousand otherwise. **If `net_savings_per_year_gbp` is null** *(diagnose-sprawl skipped or no modules with ROI)*, fall back to the legacy aggregate of `modules[*].projected_savings_per_year_gbp` and label as `(gross)`.
- **`big_savings_label`**: *"projected £/yr net — hours-saved + retired subs minus new stack cost"*.
- **`big_hours`**: aggregate of `brain.recommendations.modules[*].projected_hours_saved_per_week`, OR `replacement.net_hours_reclaimed_per_week` when populated. Format: `27 hrs/wk`, `12 hrs/wk`. Round to nearest whole hour.
- **`big_hours_label`**: *"recovered across the team, weekly"*.
- **`big_modules`**: count of modules where `status === "recommended" || status === "planned"` *(i.e. not yet built — these are the IN-FLIGHT projections)*. e.g. `7`.
- **`big_modules_label`**: *"modules end-to-end"*.
- **`roi_confidence_label`**: render a confidence badge based on the aggregate: if 80%+ of contributing modules have `roi_confidence: "high"` → `"high confidence"`. If majority `"medium"` → `"medium confidence — see modules for ranges"`. If majority `"low"` → `"low confidence — directional only"`. Append `· salary-anchored` when `replacement.rate_source` starts with `"salary"`, or `· band-default rate` when it starts with `"band_default"`.
- **`roi_caveat`**: a one-sentence honest framing, e.g. *"Numbers are midpoints of defensible ranges per module — see Page 07 for per-module detail. Hours-saved valued at {{loaded_hourly_rate}}/hr ({{rate_source_label}}). Rounded for clarity. Re-projected after each `update-module-status` so the figures reflect what's actually shipping."*

**Track F gross / new-cost / net row population:**

- **`gross_savings_label`**: *"£X,XXX/yr from hours reclaimed at £{{loaded_hourly_rate}}/hr"* — sourced from `replacement.gross_savings_per_year_gbp`.
- **`gross_subs_savings_label`**: *"£X,XXX/yr from retired subs (excl. prerequisites + bundled)"* — sourced from `replacement.gross_subs_savings_per_year_gbp`.
- **`new_stack_cost_label`**: *"£X,XXX/yr new stack cost (Claude × N + n8n VPS + Supabase {{tier}})"* — sourced from `replacement.new_stack_cost_per_year_gbp`. Itemise the lines if the artifact has space; collapse to the single sum on small viewports.
- **`net_savings_label`**: *"£XX,XXX/yr net"* — same number as `big_savings`; restated in the math row to make the arithmetic legible.
- **`rate_source_label`**: *"valued at £{{loaded_hourly_rate}}/hr · salary-anchored"* OR *"valued at £{{loaded_hourly_rate}}/hr · {{revenue_band}} default"* OR *"valued at £55/hr · median fallback (no revenue band)"*. **When `band_default` is the source, also render a Page 02 footnote: *"We'll re-anchor to actual salaries once you pass them through — this is a defensible starting figure."***

**When to omit the ROI card entirely:**

- Fewer than 3 modules have any ROI projection populated *(too thin to anchor a number)*. Skip rendering; fall back to the prior 3-big-number card pattern with the older summary fields.
- All modules have `roi_confidence: "low"`. Skip — better to render no number than a fabricated one.

This card is the cherry-pick from the master plan — anchored numbers turn the artifact from advisory into commercial. Sim's pre-SSL "fancy PDF, now what?" feedback was about the next-step CTA; this is about the *value-delivered* signal sitting at the top of the report.
<div class="grid-3" style="margin-top:24px">
  <!-- 3 narrative cards: Win / Unlock / Blind-spot · Settle L→R 60ms stagger
       (handoff §B). Blind-spot stays inverted (ink background) — done via existing
       .pill.warn class which now resolves to ink-on-paper after the palette swap. -->
  <div class="card is-settle" style="animation-delay:560ms">
    <span class="pill savings">Win</span>
    <h3 style="margin-top:8px">{{card_win_lead}}</h3>
    <p style="color:var(--graphite);font-size:14px;line-height:1.5">{{card_win_body}}</p>
  </div>
  <div class="card is-settle" style="animation-delay:620ms">
    <span class="pill owned">Unlock</span>
    <h3 style="margin-top:8px">{{card_unlock_lead}}</h3>
    <p style="color:var(--graphite);font-size:14px;line-height:1.5">{{card_unlock_body}}</p>
  </div>
  <div class="card is-settle" style="animation-delay:680ms;background:#0A0E1A;color:#fff;border-color:#0A0E1A">
    <span class="pill warn" style="background:rgba(255,255,255,0.1);color:#fff">Blind-spot</span>
    <h3 style="margin-top:8px;color:#fff">{{card_blindspot_lead}}</h3>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.5">{{card_blindspot_body}}</p>
  </div>
</div>
```

### Page 03 · Table of contents *(unlocked at stage 0 — static)*

This page renders the same content at every stage. Its purpose: give the user a "what's in this document" tour during onboarding, before any data is captured. Brand-aware where possible, otherwise generic. Use this exact HTML *(only the brand name in the "How <brand> runs today" line varies)*:

```html
<h1 class="page-title">Table of contents.</h1>
<p class="lead">The 12 sections of your Connected Systems Roadmap. Pages fill in as we capture your stack — but they're always in the same order and serve the same purpose.</p>
<ol class="mono" style="margin-top:24px;list-style:none;padding:0">
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">00</span>Cover</span>
    <span style="color:var(--fog);font-size:11px">p.01</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">01</span>Manifesto · the worldview</span>
    <span style="color:var(--fog);font-size:11px">p.02</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">02</span>Diagnosis · summary</span>
    <span style="color:var(--fog);font-size:11px">p.03</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">03</span>Table of contents (this page)</span>
    <span style="color:var(--fog);font-size:11px">p.04</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">04</span>How {{brand_or_you}} runs today</span>
    <span style="color:var(--fog);font-size:11px">p.05</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">05</span>The owned future-state blueprint</span>
    <span style="color:var(--fog);font-size:11px">p.06</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">06</span>Replacement table · keep / consolidate / retire</span>
    <span style="color:var(--fog);font-size:11px">p.07</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">07</span>Migration plan · the modules in build order</span>
    <span style="color:var(--fog);font-size:11px">p.08</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">07.5</span>Project board · click to advance state</span>
    <span style="color:var(--fog);font-size:11px">p.09</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">08</span>Featured module · deep dive</span>
    <span style="color:var(--fog);font-size:11px">p.10</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">09</span>Closing · your week 6 months from now</span>
    <span style="color:var(--fog);font-size:11px">p.11</span>
  </li>
  <li style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0">
    <span><span style="color:var(--mist);margin-right:12px">10</span>Appendix · glossary + brain snapshot</span>
    <span style="color:var(--fog);font-size:11px">p.12</span>
  </li>
</ol>
```

`{{brand_or_you}}`: the brand name if captured, otherwise `"you"` *(generic "How you run today")* for the brand-less stub.

### Page 04 · Current state

```html
<h1 class="page-title">{{current_headline}}</h1>
<p class="lead">{{current_body}}</p>

<!-- Inline glossary on first appearance — Sim test-run feedback: "glue-human" needs defining at first use, not just in the appendix -->
<div style="margin-top:18px;padding:12px 16px;border-left:3px solid #9AA1AE;background:#ECEFF3;border-radius:6px;font-size:13px;color:#5C6473;line-height:1.5">
  <strong style="color:#0A0E1A">Two terms used below:</strong>
  &nbsp;<strong>CSV moment</strong> — a recurring "export from one tool, copy/paste into another" ritual.
  &nbsp;<strong>Glue-human</strong> — a person whose job is being the integration between two tools that don't talk.
  &nbsp;<em style="color:#9AA1AE">(Full glossary on page 10.)</em>
</div>

<div class="grid-3" style="margin-top:32px">
  <!-- One card per CSV moment / glue human / black box, max ~6 -->
  <div class="card" style="background:#ECEFF3;border-color:#0A0E1A">
    <span class="label label--rented">CSV moment</span>
    <div style="margin-top:8px;font-weight:500">{{moment_title}}</div>
    <div class="mono" style="font-size:11px;color:#0A0E1A;margin-top:4px">{{moment_meta}}</div>
  </div>
  <!-- ... -->
</div>

<!-- Track G3 (workshop-2026-05) · Team time-sink map.
     Renders only when brain.team_interviews[].length >= 1.
     Reads from analyse-team-interviews output: per-employee
     total_tedious_hours_per_week, top_glue_human_flow,
     wished_for_summary, module_links.
     One row per interviewed employee, sorted by tedious-hours descending.
     This is the workshop demo's payoff for Section 4 — visual proof that
     team interviews change the projections, not just confirm them. -->
{{#if team_interviews_count}}
<div style="margin-top:48px">
  <div class="label label--cobalt" style="margin-bottom:8px">Team time-sink map · {{team_interviews_count}} employee{{team_interviews_plural}} interviewed</div>
  <h2 style="font-family:'New York','Iowan Old Style','Apple Garamond','Hoefler Text',Georgia,serif;font-size:24px;font-weight:500;color:#0A0E1A;margin:0 0 12px 0;letter-spacing:-0.02em">{{team_timesink_headline}}</h2>
  <p class="lead" style="margin-bottom:16px">{{team_timesink_intro}}</p>
  <div style="border:1px solid #E2E6EC;border-radius:12px;overflow:hidden;font-size:13px">
    <div style="display:grid;grid-template-columns:1fr 1.4fr 2.2fr 90px;background:#F7F8FA;font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:#9AA1AE;padding:10px 14px">
      <div>Employee</div>
      <div>Top tedious task</div>
      <div>Wished-for</div>
      <div class="text-right">Hrs/wk</div>
    </div>
    <!-- One row per team_interviews[] entry, sorted by total_tedious_hours_per_week desc -->
    <div style="display:grid;grid-template-columns:1fr 1.4fr 2.2fr 90px;border-top:1px solid #E2E6EC;padding:12px 14px;line-height:1.45;color:#0A0E1A">
      <div style="font-weight:500">{{ti_name}} <span style="color:#9AA1AE;font-size:11.5px">· {{ti_role}}</span></div>
      <div>{{ti_top_glue_human_flow}}<br><span style="color:#9AA1AE;font-size:11px">→ refines Module {{ti_module_links}}</span></div>
      <div style="color:#5C6473;font-style:italic">"{{ti_wished_for_summary}}"</div>
      <div class="text-right" style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-weight:500;color:#FF6B5C">{{ti_total_tedious_hours_per_week}}</div>
    </div>
    <!-- Repeat per employee -->
  </div>
  <!-- Total tedious-hours strip beneath the table -->
  <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:baseline;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#5C6473">
    <span>{{team_timesink_caption}}</span>
    <span style="color:#FF6B5C;font-weight:500">{{total_team_tedious_hours_per_week}} hrs/wk total tedious-time across the team</span>
  </div>
</div>
{{/if}}
```

**Team time-sink map population rules** *(Track G3, workshop-2026-05)*:

- **`team_interviews_count`** — `brain.team_interviews[].length`. The block renders only when ≥ 1.
- **`team_interviews_plural`** — `""` when count == 1, `"s"` otherwise.
- **`team_timesink_headline`** — short, ≤ 10 words. Default: *"What the team's week actually looks like."*
- **`team_timesink_intro`** — 1 sentence. Default: *"The founder's view named the modules. The team's view tells you which ones reclaim the most week. Numbers are tedious-hours — hours/week the employee would happily delegate, weighted by tedium score."*
- **Per-employee row** — sorted by `total_tedious_hours_per_week` descending. Cells:
  - `{{ti_name}}` + `{{ti_role}}` from the schema
  - `{{ti_top_glue_human_flow}}` from `analyse-team-interviews` output
  - `{{ti_module_links}}` — comma-joined module Ns from `team_interviews[i].module_recommendations_refined[]`
  - `{{ti_wished_for_summary}}` — verbatim Q5 answer, truncated to ≤ 120 chars
  - `{{ti_total_tedious_hours_per_week}}` — computed as `sum(top_tasks[].hours_per_week × tedium_score / 5)`
- **`total_team_tedious_hours_per_week`** — sum across all rows. Surfaced in red so the founder reads *"38 hrs/wk of soul-destroying time across the 5 interviewed"* in one glance.
- **`team_timesink_caption`** — 1 sentence. Default: *"Module recommendations refined per the employee numbers — see Page 07."*

**When to OMIT the block entirely:**
- `brain.team_interviews[].length === 0` *(no team interviews captured — Track G3 flow not run)*
- `analyse-team-interviews` hasn't fired yet *(team_interviews populated but unanalysed)*

**Why this exists** *(Track G3, workshop-2026-05)*

Section 4 of the Seller Sessions Live talk runsheet calls for a **team-level layer** — *"we've identified all the bottlenecks the business has, but we haven't looked at the employees themselves."* The team time-sink map is the artifact-level payoff for that section: visible proof that team interviews refine the projections, surface glue-humans the founder didn't see, and rank module ROI by employee tedium not just founder-stated bottlenecks. Without it, Section 4 is talk; with it, the printed PDF carries the same depth.

The 4-column grid mirrors Page 07's First-30-Days table for visual consistency. Renders cleanly at A4; no animation choreography (data-density block, not motion-led).

### Page 05 · Future state

```html
<h1 class="page-title">{{future_headline}}</h1>
<p class="lead">{{future_body}}</p>
<div class="grid-3" style="margin-top:32px">
  <!-- 3 primitive cards: Supabase / n8n / ClickUp.
       Track F · Sim #12: each card surfaces its monthly cost so the
       future-state isn't framed as "free." {{primitive_monthly_cost}}
       is sized off revenue_band + maintenance_tolerance via
       derive-replacement-table.new_stack_cost_breakdown. -->
  <div class="card">
    <div style="font-weight:600">Supabase</div>
    <div class="mono" style="font-size:11px;color:var(--mist);margin-top:4px">source of truth · {{primitive_supabase_monthly_cost}}</div>
  </div>
  <div class="card">
    <div style="font-weight:600">n8n</div>
    <div class="mono" style="font-size:11px;color:var(--mist);margin-top:4px">orchestration · {{primitive_n8n_monthly_cost}}</div>
  </div>
  <div class="card">
    <div style="font-weight:600">ClickUp</div>
    <div class="mono" style="font-size:11px;color:var(--mist);margin-top:4px">surface · already paid</div>
  </div>
</div>
```

**Per-primitive cost population rules** *(Track F · Sim #12)*:

- **`primitive_supabase_monthly_cost`**: derived from `revenue_band`. `<£250k` / `£250k-1M` → `Free tier`. `£1M-5M` / `£5M-20M` → `Pro · £20/mo`. `>£20M` → `Team · £499/mo`.
- **`primitive_n8n_monthly_cost`**: derived from `team.maintenance_tolerance`. `n8n_self_host` → `self-hosted · £8/mo VPS`. `claude_code_app` → `n/a (Claude Code app path)`. `neither` → `self-hosted · £8/mo VPS *(default)*`.
- **Add a fourth card if `maintenance_tolerance == "claude_code_app"`**: ClickUp's slot is replaced/augmented with: `<div style="font-weight:600">Claude Code app</div><div class="mono" style="font-size:11px;color:var(--mist);margin-top:4px">scaffold + scheduler · £20/mo (Vercel + Supabase)</div>`.
- **Track F honesty footnote** *(below the grid)*: *"The future state isn't free — Page 06 + Page 02 show the net after this stack cost is subtracted."*

### Page 06 · Replacement table

```html
<h1 class="page-title">{{replacement_headline}}</h1>
<p class="lead">Per-tool: what survives, what consolidates, what retires — with the why, the destination, and the transition effort.</p>
<!-- One .replace-card per row -->
<div class="replace-card retire">
  <div class="row-head">
    <div>
      <span class="row-tool">{{row_tool}}</span>
      <span class="row-cost">{{row_cost}}</span>
    </div>
    <span class="row-pill">retire</span>
  </div>
  <p class="row-why">{{row_why}}</p>
  <div class="row-meta">
    <div>
      <div class="label">Replaced by</div>
      <div style="font-size:12px;margin-top:4px">{{row_replaced_by}}</div>
    </div>
    <div>
      <div class="label">Transition</div>
      <div style="font-size:12px;margin-top:4px;color:var(--rented);font-weight:600">{{row_transition_effort}}</div>
    </div>
    <div>
      <div class="label">Gotchas</div>
      <div style="font-size:12px;margin-top:4px;color:var(--graphite)">{{row_gotchas}}</div>
    </div>
  </div>
</div>
<!-- Repeat per row. Use .replace-card.keep / .consolidate / .retire for the right colour -->
<!-- Prerequisite rows: render in a separate "Prerequisites · keep (table stakes)" group at the top
     of the table with a distinct .replace-card.prerequisite class. Track F · Sim #6. -->

<!-- Totals strip at the bottom — Track F · Sim #8 + #12: gross / new stack cost / net.
     Replaces the v1 "monthly savings + weekly hours" duo with the full math. -->
<div class="totals">
  <div class="total-label">ROI · annual, net</div>
  <div style="display:flex;gap:32px;align-items:flex-end">
    <div class="text-right" style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:12px;color:#5C6473">
      <div>+ {{gross_savings_per_year_gbp}} hours-saved</div>
      <div>+ {{gross_subs_savings_per_year_gbp}} retired subs</div>
      <div>− {{new_stack_cost_per_year_gbp}} new stack</div>
    </div>
    <div class="text-right">
      <div class="savings">{{net_savings_per_year_gbp}}</div>
      <div class="sub">net £/yr</div>
    </div>
    <div class="text-right">
      <div class="hours">{{net_hours_reclaimed_per_week}}</div>
      <div class="sub">weekly hours back</div>
    </div>
  </div>
</div>

<!-- New-stack-cost itemisation (small print under the totals strip) -->
<div style="margin-top:14px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#9AA1AE;line-height:1.6">
  <strong style="color:#5C6473">New stack cost breakdown:</strong>
  {{#each new_stack_cost_breakdown}}
  <span style="margin-left:8px">· {{line}} £{{annual_gbp}}/yr</span>
  {{/each}}
  <span style="margin-left:8px">· hours-saved valued at £{{loaded_hourly_rate}}/hr ({{rate_source}})</span>
</div>
```

**Page 06 row population rules** *(Track F · F2)*:

- **`row_cost`**: render `monthly_cost` with currency formatting. Numbers → `£300/mo`. `"bundled"` → `bundled (no spend)`. `"unknown (est. £X)"` → `est. £X/mo *` *(asterisk → footnote)*.
- **Prerequisite rows render before retire/consolidate rows**, grouped under a `<h3>Prerequisites · keep (table stakes)</h3>` heading. Use `.replace-card.prerequisite` styling — neutral grey, smaller, no transition-effort column. *Track F · Sim #6: lead with what stays, then move to what moves.*
- **Bundled retire rows** show `Bundled with {{email_suite.provider}}` in the cost slot and frame the why as *"clutter — already paid as part of {{email_suite.provider}}; mark for removal."*
- **Estimated cost footnote** *(rendered at the bottom of the table)*: *"\* Estimated — delegate didn't have the figure to hand. We'll re-anchor when actual numbers come through."*

### Page 07 · Migration plan

```html
<!-- Motion (handoff §C): header Settles in · 7 module cards Snap-to-grid in
     dependency order with 90ms stagger · Module 02 (recommended-start) gets
     a green Pulse dot beside its rung pill that begins after the card snaps in. -->
<h1 class="page-title is-settle s-1">{{plan_headline}}</h1>
<p class="lead is-settle s-2">{{plan_body}}</p>

<!-- Schedule chart — 16-week Gantt of all picked modules + dependency arrows + milestones -->
<!-- Renders only when 5+ modules have `weeks` populated -->
<div style="margin-top:28px;padding:20px;border-radius:12px;background:#F7F8FA;border:1px solid #E2E6EC">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px">
    <span class="label label--cobalt">The schedule · {{schedule_total_weeks}} weeks at a glance</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#9AA1AE">build sequence · live position</span>
  </div>

  <!-- SVG chart — pure SVG, no JS, no external libs. A4-safe. -->
  <svg viewBox="0 0 720 240" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="schedule-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M0,0 L6,3 L0,6 z" fill="#C9CDD4"/>
      </marker>
    </defs>

    <!-- Vertical week gridlines: every 4 weeks (W1, W4, W8, W12, W16). x_origin=60, week_width=640/total_weeks -->
    <g stroke="#E2E6EC" stroke-width="1" stroke-dasharray="2 2">
      <line x1="60"  y1="20" x2="60"  y2="195"/>
      <line x1="220" y1="20" x2="220" y2="195"/>
      <line x1="380" y1="20" x2="380" y2="195"/>
      <line x1="540" y1="20" x2="540" y2="195"/>
      <line x1="700" y1="20" x2="700" y2="195"/>
    </g>

    <!-- x-axis labels (weeks) -->
    <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="10" fill="#9AA1AE">
      <text x="60"  y="212" text-anchor="middle">W1</text>
      <text x="220" y="212" text-anchor="middle">W4</text>
      <text x="380" y="212" text-anchor="middle">W8</text>
      <text x="540" y="212" text-anchor="middle">W12</text>
      <text x="700" y="212" text-anchor="middle">W{{schedule_total_weeks}}</text>
    </g>

    <!-- 7 module rows — each is a <g> with <rect> bar + <text> label inside or beside -->
    {{schedule_rows}}

    <!-- Dependency arrows between modules — quadratic curves with arrowhead -->
    <g stroke="#C9CDD4" stroke-width="1" fill="none" marker-end="url(#schedule-arrow)">
      {{schedule_dep_arrows}}
    </g>

    <!-- Milestone markers (e.g. M01 deployed, M02 audit-T+4) — small green ticks + 1-line labels -->
    <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="9" fill="#00D67A">
      {{schedule_milestones}}
    </g>

    <!-- "You are here" caret at week 0 -->
    <g>
      <path d="M55,15 L65,15 L60,8 z" fill="#0A0E1A"/>
      <text x="74" y="14" font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="9" fill="#0A0E1A">YOU ARE HERE</text>
    </g>
  </svg>

  <p style="margin-top:12px;margin-bottom:0;font-size:12px;color:#5C6473;line-height:1.5">{{schedule_caption}}</p>
</div>

<!-- Immediate Wins · Track F (revised 2026-05-08).
     Renders ABOVE the module grid because the modules are 12-16 week builds and the Roadmap
     previously had nothing actionable for "this week." 2-3 universal pre-Module-01 moves; each
     a 10-minute-to-2-hour foundation that Module 01 assumes.
     Wispr Flow is NOT in this block — it lives in the consultant aside (see run-interview.md
     § Consultant asides). The Roadmap is the migration document; in-chat conversational
     suggestions don't bleed into the printed deck. -->
<div style="margin-top:36px;padding:20px 22px;border-radius:14px;background:#F0F9FF;border:1px solid #B6E1FF">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
    <span class="label label--cobalt">Immediate wins · this week</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#5C6473">under 90 min total · Module 01 assumes them</span>
  </div>
  <h2 style="font-family:'New York','Iowan Old Style','Apple Garamond','Hoefler Text',Georgia,serif;font-size:22px;font-weight:500;color:#0A0E1A;margin:0 0 6px 0;letter-spacing:-0.02em">{{immediate_wins_headline}}</h2>
  <p style="margin:0;font-size:13px;color:#5C6473;line-height:1.5">{{immediate_wins_intro}}</p>

  <ul style="margin-top:14px;padding-left:0;list-style:none;font-size:13px;line-height:1.55;color:#0A0E1A">
    <!-- ClickUp brand-as-OS template row — universal -->
    <li style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #D6EDFF">
      <span style="flex:0 0 auto;width:80px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;color:#5C6473;text-transform:uppercase;letter-spacing:0.06em">1 hr · already paid</span>
      <span><strong>Brand-as-OS template.</strong> Clone Sim's 6-department brand structure into your ClickUp workspace before Module 01 starts — Module 01 builds on top, not from scratch.</span>
    </li>
    <!-- Claude Code install row — universal -->
    <li style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #D6EDFF">
      <span style="flex:0 0 auto;width:80px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;color:#5C6473;text-transform:uppercase;letter-spacing:0.06em">15 min · £18/mo</span>
      <span><strong>Claude Code install + first project.</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-size:11.5px">npm i -g @anthropic-ai/claude-code</code> on the first builder's machine. <code style="background:#fff;padding:2px 6px;border-radius:4px;font-size:11.5px">cd ~/syncflow-projects/{{brand_slug}} && claude</code> — the per-module CLAUDE.md files are waiting.</span>
    </li>
    <!-- Optional third row — surfaced only when brain has a strong signal (e.g. n8n already in custom_tools) -->
    {{#if has_n8n_already}}
    <li style="display:flex;gap:12px;padding:10px 0">
      <span style="flex:0 0 auto;width:80px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;color:#5C6473;text-transform:uppercase;letter-spacing:0.06em">30 min</span>
      <span><strong>Audit existing n8n flows.</strong> List every workflow currently running, owner, and last-edit date. Module 02-04 build on this foundation rather than spinning up a parallel n8n instance.</span>
    </li>
    {{/if}}
  </ul>
</div>

<!-- One .module-card per module · Snap-to-grid in dependency order (handoff §C).
     Replace `s-{{module_index}}` with the 1-indexed position of the module
     (s-1 for the first card, s-2 for the second, ..., s-7 for the seventh). The
     CSS provides snap delays for s-1 through s-7. For modules 8+ (rare), use inline
     `style="animation-delay: <90 * index>ms"` instead of a stagger class.
     Recommended-start module (`module.tag === "recommended start"`) renders the
     rung pill with a small accent-green Pulse dot beside it (rendered AFTER the
     card snaps in — Pulse begins at 1.6s loop). -->
<div class="module-card is-snap s-{{module_index}}">
  <div class="head">
    <div class="num">{{module_n}}</div>
    <div class="body">
      <div class="name">{{module_name}}</div>
      <div class="status">{{module_status}}</div>
      <!-- rung pill — required, surfaced from module.rung_label -->
      <div style="display:inline-flex;align-items:center;gap:8px;margin-top:6px">
        <div style="display:inline-block;padding:3px 10px;border-radius:9999px;background:#ECEFF3;color:#0A0E1A;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.04em">{{module_rung_label}}</div>
        <!-- recommended-start Pulse dot — render only when module.tag === "recommended start" -->
        <span class="is-pulse" style="display:inline-block;width:8px;height:8px"></span>
      </div>
    </div>
    <div class="meta">
      <div>{{module_weeks}}</div>
      <div>{{module_effort}}</div>
      <div class="deps">deps {{module_deps}}</div>
    </div>
  </div>
  <!-- if module.problem or module.outcome populated, show grid-2: -->
  <div class="grid-2" style="margin-top:16px">
    <div>
      <div class="label label--rented">What this kills</div>
      <p style="margin-top:4px;font-size:13px;line-height:1.5;color:#5C6473">{{module_problem}}</p>
    </div>
    <div>
      <div class="label label--savings">Outcome</div>
      <p style="margin-top:4px;font-size:13px;line-height:1.5;color:#5C6473">{{module_outcome}}</p>
    </div>
  </div>
  <!-- if prerequisites populated -->
  <div style="margin-top:16px">
    <div class="label">What you'll need</div>
    <ul style="margin-top:4px;color:#5C6473;font-size:12px;padding-left:18px">
      <li>{{prerequisite_1}}</li>
      <!-- ... -->
    </ul>
  </div>

  <!-- Project state · status pill + 5-dot phase indicator + deliverables checklist + next action.
       Renders the existing schema fields visually so a delegate scanning Page 07 sees the
       project-management shape (what's emitted, what's pending, what fires next) without
       reading the docs. Empty-state when status === "recommended" — all deliverables
       unchecked, phase dots empty. After `start-implementation` fires for the module, the
       deliverables paths populate, the checks flip, and status moves to in_progress. -->
  <div style="margin-top:16px;padding:14px 16px;border-radius:8px;background:#F7F8FA;border:1px solid #E2E6EC">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
      <span class="label">Project state</span>
      <!-- Status pill is clickable (Track E3): click → copy {{module_trigger_phrase}} → toast.
           data-trigger / data-module / data-current-status are read by the inline click-handler
           script in templates/dashboard-artifact.html. -->
      <span data-trigger="{{module_trigger_phrase}}" data-module="{{n}}" data-current-status="{{status}}"
            style="display:inline-block;padding:2px 10px;border-radius:9999px;background:#ECEFF3;color:#0A0E1A;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer">{{module_status_pill}}</span>
    </div>

    <!-- 5-dot phase indicator: Schema · Ingestion · Logic · Surface · Deploy+monitor.
         Phase-dots span is also clickable (Track E3): clicking copies the same trigger as the
         status pill since they advance the same lifecycle. Sharing data-trigger means the click
         handler treats both surfaces as one logical button. -->
    <div style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin-bottom:10px">
      <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10px;color:#9AA1AE;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap">Phase</span>
      <span data-trigger="{{module_trigger_phrase}}" data-module="{{n}}" data-current-status="{{status}}"
            style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:14px;letter-spacing:0.22em;color:#0A0E1A;cursor:pointer">{{module_phase_dots}}<span style="margin-left:10px;font-size:11px;letter-spacing:0;color:#5C6473">{{module_phase_label}}</span></span>
    </div>

    <!-- Deliverables checklist · 5 files emitted by start-implementation -->
    <div style="margin-bottom:10px">
      <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10px;color:#9AA1AE;text-transform:uppercase;letter-spacing:0.06em">Deliverables</span>
      <ul style="margin:6px 0 0;padding-left:0;list-style:none;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;line-height:1.7">
        <li><span style="display:inline-block;width:18px;color:{{deliv_check_color_claude_md}}">{{deliv_check_claude_md}}</span><span style="color:{{deliv_path_color_claude_md}}">{{deliv_path_claude_md}}</span></li>
        <li><span style="display:inline-block;width:18px;color:{{deliv_check_color_build_plan}}">{{deliv_check_build_plan}}</span><span style="color:{{deliv_path_color_build_plan}}">{{deliv_path_build_plan}}</span></li>
        <li><span style="display:inline-block;width:18px;color:{{deliv_check_color_verification}}">{{deliv_check_verification}}</span><span style="color:{{deliv_path_color_verification}}">{{deliv_path_verification}}</span></li>
        <li><span style="display:inline-block;width:18px;color:{{deliv_check_color_status_json}}">{{deliv_check_status_json}}</span><span style="color:{{deliv_path_color_status_json}}">{{deliv_path_status_json}}</span></li>
        <li><span style="display:inline-block;width:18px;color:{{deliv_check_color_readme}}">{{deliv_check_readme}}</span><span style="color:{{deliv_path_color_readme}}">{{deliv_path_readme}}</span></li>
      </ul>
    </div>

    <!-- Next action · lifecycle-aware -->
    <div style="display:flex;align-items:baseline;gap:10px;padding-top:10px;border-top:1px dashed #E2E6EC">
      <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10px;color:#9AA1AE;text-transform:uppercase;letter-spacing:0.06em">Next</span>
      <span style="font-size:12.5px;color:#0A0E1A;line-height:1.5">{{module_next_action}}</span>
    </div>
  </div>

  <!-- Hand off to Claude Code · per-module pill (Track F · Sim #22).
       Surfaces the existing start-implementation skill via Track E3's clipboard-trigger pattern.
       Click → copies "start Module {{n}}" to clipboard → toast → delegate pastes into chat →
       start-implementation fires → 5 files emit. No new plumbing — just exposes what already
       exists per module, not just the featured one.
       Complexity-grade badge sits beside the pill; raw hours move to a tooltip on the badge. -->
  <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <!-- complexity-grade badge — Track F · Sim #9 (replaces raw hours as headline) -->
      <span title="{{module_effort}}" style="display:inline-block;padding:3px 10px;border-radius:9999px;background:{{complexity_grade_bg}};color:{{complexity_grade_fg}};font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.04em;cursor:help">{{module_complexity_grade}}</span>
      <!-- build-path badge — Track F · Sim #7 (n8n vs CC-app) — only renders when forks differ from default -->
      <span style="display:inline-block;padding:3px 10px;border-radius:9999px;background:#ECEFF3;color:#5C6473;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.04em">{{module_build_path_label}}</span>
    </div>
    <span data-trigger="start Module {{module_n}}" data-module="{{module_n}}" data-current-status="{{module_status}}"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:9999px;background:#0A0E1A;color:#fff;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer">Hand off → Claude Code</span>
  </div>

  <!-- Dependency failure callout — Track F · Sim #21. Renders only when module.dependency_failure_mode is non-null.
       Reads from brain.recommendations.modules[i].dependency_failure_mode. -->
  {{#if module_dependency_failure_mode}}
  <div style="margin-top:12px;padding:10px 14px;border-left:3px solid #FF6B5C;background:#FFF1EE;border-radius:6px;font-size:12px;color:#5C6473;line-height:1.5">
    <strong style="color:#0A0E1A;text-transform:uppercase;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:0.06em">Dependency note</strong>
    &nbsp;{{module_dependency_failure_mode}}
  </div>
  {{/if}}
</div>
<!-- Repeat per module -->

<!-- Phase 2 footer — Track F (F3): defer-band + capacity-fit drops.
     Renders only when recommendations.deferred_modules[] is non-empty.
     Reads from brain.recommendations.deferred_modules[]. -->
{{#if deferred_modules_count}}
<div style="margin-top:32px;padding:18px 20px;border-radius:12px;background:#F7F8FA;border:1px dashed #9AA1AE">
  <div class="label" style="margin-bottom:8px">Phase 2 · once capacity / revenue scales</div>
  <p style="margin-top:4px;font-size:13px;color:#5C6473;line-height:1.5">{{deferred_modules_intro}}</p>
  <ul style="margin-top:10px;padding-left:18px;color:#5C6473;font-size:12.5px;line-height:1.7">
    <!-- One li per deferred module — Reads name + defer_reason -->
    <li><strong style="color:#0A0E1A">{{deferred_module_name}}</strong> — {{deferred_module_reason}}</li>
  </ul>
</div>
{{/if}}

<!-- Universal Opportunities section — ALWAYS rendered when modules render, 3-5 cards -->
<div style="margin-top:48px">
  <div class="label label--cobalt" style="margin-bottom:8px">Universal Amazon opportunities · systemic wins to layer alongside</div>
  <h2 style="font-family:'New York','Iowan Old Style','Apple Garamond','Hoefler Text',Georgia,serif;font-size:24px;font-weight:500;color:#0A0E1A;margin:0 0 12px 0;letter-spacing:-0.02em">{{universals_headline}}</h2>
  <p class="lead" style="margin-bottom:16px">{{universals_intro}}</p>
  <!-- One card per universal opportunity (3-5 cards) -->
  <div class="card" style="margin-top:8px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div>
        <span class="pill" style="background:#ECEFF3;color:#0A0E1A;margin-right:8px">{{uw_id}}</span>
        <strong style="font-size:14px">{{uw_name}}</strong>
      </div>
      <div style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#5C6473">{{uw_effort}}</div>
    </div>
    <p style="color:#5C6473;font-size:13px;line-height:1.5;margin-top:6px">{{uw_why_relevant}}</p>
  </div>
  <!-- Repeat per universal -->
</div>

<!-- First 30 days · Monday-morning playbook table -->
<!-- Renders only when ≥4 modules have owners populated -->
<div style="margin-top:48px">
  <div class="label label--cobalt" style="margin-bottom:8px">First 30 days · the Monday-morning playbook</div>
  <h2 style="font-family:'New York','Iowan Old Style','Apple Garamond','Hoefler Text',Georgia,serif;font-size:24px;font-weight:500;color:#0A0E1A;margin:0 0 12px 0;letter-spacing:-0.02em">Whose Monday changes, when</h2>
  <p class="lead" style="margin-bottom:16px">{{first30_intro}}</p>
  <div style="border:1px solid #E2E6EC;border-radius:12px;overflow:hidden;font-size:13px">
    <div style="display:grid;grid-template-columns:60px 1.2fr 2fr 1.4fr;background:#F7F8FA;font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:0.06em;color:#9AA1AE;padding:10px 14px">
      <div>Week</div>
      <div>Whose Monday changes</div>
      <div>What they do</div>
      <div>Acceptance check</div>
    </div>
    <!-- Row 1 -->
    <div style="display:grid;grid-template-columns:60px 1.2fr 2fr 1.4fr;border-top:1px solid #E2E6EC;padding:12px 14px;line-height:1.45;color:#0A0E1A">
      <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;color:#11151F;font-weight:500">{{first30_week_1}}</div>
      <div style="font-weight:500">{{first30_who_1}}</div>
      <div style="color:#5C6473">{{first30_action_1}}</div>
      <div style="color:#00D67A">{{first30_check_1}}</div>
    </div>
    <!-- Row 2 -->
    <div style="display:grid;grid-template-columns:60px 1.2fr 2fr 1.4fr;border-top:1px solid #E2E6EC;padding:12px 14px;line-height:1.45;color:#0A0E1A">
      <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;color:#11151F;font-weight:500">{{first30_week_2}}</div>
      <div style="font-weight:500">{{first30_who_2}}</div>
      <div style="color:#5C6473">{{first30_action_2}}</div>
      <div style="color:#00D67A">{{first30_check_2}}</div>
    </div>
    <!-- Row 3 -->
    <div style="display:grid;grid-template-columns:60px 1.2fr 2fr 1.4fr;border-top:1px solid #E2E6EC;padding:12px 14px;line-height:1.45;color:#0A0E1A">
      <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;color:#11151F;font-weight:500">{{first30_week_3}}</div>
      <div style="font-weight:500">{{first30_who_3}}</div>
      <div style="color:#5C6473">{{first30_action_3}}</div>
      <div style="color:#00D67A">{{first30_check_3}}</div>
    </div>
    <!-- Row 4 -->
    <div style="display:grid;grid-template-columns:60px 1.2fr 2fr 1.4fr;border-top:1px solid #E2E6EC;padding:12px 14px;line-height:1.45;color:#0A0E1A">
      <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;color:#11151F;font-weight:500">{{first30_week_4}}</div>
      <div style="font-weight:500">{{first30_who_4}}</div>
      <div style="color:#5C6473">{{first30_action_4}}</div>
      <div style="color:#00D67A">{{first30_check_4}}</div>
    </div>
  </div>
</div>
```

**Key change vs prior version:**
- Each module card now renders a `module_rung_label` pill *(from `recommend-modules`'s structured output)*. Without this, the Simplicity Ladder cherry-pick is invisible.
- A "Universal Amazon opportunities" section follows the modules. Always rendered when modules are emitted; uses `universal_opportunities[]` from `recommend-modules`. Without this, UW-01..08 cherry-pick is invisible.
- A **Schedule chart** renders at the top of the page *(SVG Gantt of all modules + dependency arrows + milestones)*. Without it, the 12-week shape isn't visible at a glance — the delegate has to read each module's `weeks` and assemble the sequence mentally.
- A **First 30 days · Monday-morning playbook** table renders at the bottom *(4 rows, one per module in dep-order)*. Without it, the printed PDF is descriptive but not prescriptive — a delegate without a Cowork window open can't see who does what next Monday.
- **Track F additions on every module card:**
  - `complexity_grade` badge replaces the raw hour count as the headline. Hours move to a tooltip on the badge *(Sim #9)*. Colour palette: Beginner → `bg #E6FAF1 fg #0A6F47`; Intermediate → `bg #FFF7E0 fg #6B5500`; Advanced → `bg #FFE6E2 fg #8C1F0F`.
  - `build_path` badge surfaces whether the module's Phase 3 ships as `n8n flow` or `Claude Code app` based on `brain.team.maintenance_tolerance` *(Sim #7)*. Renders next to the complexity badge.
  - **Per-module "Hand off → Claude Code" pill** *(Sim #22)*. Click → copies `start Module {{n}}` to clipboard via Track E3's existing handler → delegate pastes → `start-implementation` fires → 5 files emit. **Visible per module, not just the featured one.** Same plumbing as the status pill, no new code.
  - **Dependency-failure callout** at the bottom of each card when `dependency_failure_mode` is non-null *(Sim #21)*. Reads the verbatim sentence from the schema; rendered as a left-bordered orange-tint box.
- **Phase 2 footer** *(Track F · F3)* renders when `recommendations.deferred_modules[]` is non-empty. Lists modules dropped by the revenue-band or capacity-fit filter with their `defer_reason`. *"Once capacity / revenue scales — these come back into scope."*

**`module_build_path_label` population rules** *(Track F · Sim #7)*:
- `brain.team.maintenance_tolerance == "n8n_self_host"` → `"n8n flow"`
- `brain.team.maintenance_tolerance == "claude_code_app"` → `"Claude Code app"`
- `brain.team.maintenance_tolerance == "neither"` or null → `"n8n flow (default)"`
- The badge is uniform across modules in the same brain — F4's fork is brand-wide, not per-module.

**Schedule chart — derivation rules**

The SVG renders a 16-week Gantt of all picked modules + dependency arrows + milestones + a "you are here" caret. At-a-glance schedule view, complementing the per-module cards.

**Inputs** *(from brain)*:
- `brain.recommendations.modules[*].weeks` — e.g. `"wk 1-3"`, `"wk 4-7"` *(used for bar position + width)*
- `brain.recommendations.modules[*].n` + `.name` *(used for bar labels)*
- `brain.recommendations.modules[*].rung` *(used for bar fill: rung 1-2 → savings green, rung 3-5 → cobalt, rung 6-7 → warn amber)*
- `brain.recommendations.modules[*].deps` *(used for arrow connections — `deps: "01,03"` means arrows from M01 + M03 → this module)*
- `brain.recommendations.modules[*].tag` *(used to identify "recommended start" — gets thicker stroke + green dot accent)*

**Compute**:

1. **Schedule bounds**: `total_weeks = max end_week of all modules' weeks, rounded up to nearest 4` *(commonly 16)*. Set `{{schedule_total_weeks}}` to this number.
2. **Per-module slot**: `slot_index = position in modules array (0-indexed)`. `slot_y = 30 + (slot_index * 20)`. Bars are 14px tall, centered on `slot_y` *(top at slot_y - 7, bottom at slot_y + 7)*.
3. **Per-module x**: parse `module.weeks` → `start_week, end_week`. `x_left = 60 + ((start_week - 1) / total_weeks) * 640`. `x_right = 60 + (end_week / total_weeks) * 640`. `width = x_right - x_left`.
4. **Per-module color** *(by rung)*:
   - rung 1-2: `fill="#E6FAF1"`, `stroke="#00D67A"`
   - rung 3-5: `fill="#ECEFF3"`, `stroke="#11151F"`
   - rung 6-7: `fill="#ECEFF3"`, `stroke="#0A0E1A"`
   - `tag === "recommended start"`: bump `stroke-width` to `2.5` + render a small `<circle r="3" fill="#00D67A">` 6px to the right of the bar at the same y.
5. **Compose `{{schedule_rows}}`**: one `<g>` per module, each containing:
   - `<rect x="..." y="..." width="..." height="14" rx="3" fill="..." stroke="..." stroke-width="..."/>`
   - `<text x="..." y="<slot_y + 4>" font-size="10" fill="#0A0E1A" font-weight="500">M{{n}} · {{name truncated to ~22 chars}}</text>` — placed inside the bar if width > 100px, otherwise immediately to the right of the bar.
6. **Compose `{{schedule_dep_arrows}}`**: for each module with `deps`, parse comma-separated dep IDs. For each dep_id, find the depended-on module's `(x_right, slot_y)` and the current module's `(x_left, slot_y)`. Draw a quadratic curve: `<path d="M<x1>,<y1> Q<midX>,<midY> <x2>,<y2>"/>` where `midX = (x1 + x2) / 2`, `midY = (y1 + y2) / 2 + 8` *(slight downward bow)*. Skip arrows where source and target are in the same slot row *(visual noise)*.
7. **Compose `{{schedule_milestones}}`**: for each module with a meaningful end-event *(foundation deploy, recommended-start audit-T+4 = end_week + 4, etc.)*, render a `<g>` with a vertical 8px tick at the end-week x-coordinate + a 1-line label below the chart. Cap at **3-5 visible milestones** to avoid clutter. Format: `<line x1="..." y1="<slot_y - 8>" x2="..." y2="<slot_y + 8>" stroke="#00D67A" stroke-width="1.5"/><text x="..." y="<195>" text-anchor="middle">M01 deployed · wk 3</text>`.
8. **Compose `{{schedule_caption}}`** — one sentence summarising the shape. E.g. *"16 weeks. M01 lays the foundation in week 3. M02 (recommended start, ink-bordered) gets your dedicated focus weeks 4-7. The rest layer in as dependencies clear."*

**Render-time placeholders to fill**:

- `{{schedule_total_weeks}}` — e.g. `"16"`
- `{{schedule_rows}}` — full SVG content for module bars + labels *(7 `<g>` blocks)*
- `{{schedule_dep_arrows}}` — SVG `<path>` curves *(variable count, can be empty if no module has deps)*
- `{{schedule_milestones}}` — SVG groups for milestone markers *(cap 3-5)*
- `{{schedule_caption}}` — one-sentence summary *(≤ 35 words)*

**When to OMIT the chart entirely**:

- Fewer than 5 modules with `weeks` populated *(too sparse to render usefully)*.
- All modules cluster in 1-2 weeks *(no schedule shape to show)*.

In those cases, render the module cards directly without a Schedule above. The Universal Opportunities + First 30 Days table still render normally.

**Immediate Wins block — derivation rules** *(Track F, revised 2026-05-08)*

A 2-3 item block at the top of Page 07, above the module grid. Each item is a 10-minute-to-2-hour foundation that **Module 01 assumes** — clone the brand-as-OS template, install Claude Code, optionally audit existing n8n flows. The block exists because Module 01 stalls on Phase 1 if these aren't in place; better to surface them as pre-work than discover the gap mid-build.

**Wispr Flow is NOT in this block.** The original F1 spec carried a conditional Wispr row here. Sim's revised note 2026-05-08 moved Wispr to a **consultant aside** *(see `run-interview.md` § Consultant asides)* — raised once if an organic interview trigger fires, walked through inline if interest is expressed. The Roadmap is the migration document; conversational suggestions don't bleed into the printed deck. The `wispr_flow` schema field stays for opportunistic capture; Page 07 doesn't render it.

**Inputs** *(from brain)*:
- `brain.sections.stack.custom_tools[]` *(or `tools[]`)* — drives the optional "audit existing n8n flows" row *(visible when any entry mentions n8n / Make / Zapier)*.
- `brand_slug` *(top-level)* — substituted into the Claude Code install row.

**Render-time placeholders**:

- `{{immediate_wins_headline}}` — short, ≤ 10 words. Default: *"Two moves before Module 01 starts."* *(or three moves when the n8n-already row fires)*.
- `{{immediate_wins_intro}}` — one sentence framing. Default: *"Module 01 assumes both of these are in place. ~75 minutes total — do them once, the rest of the migration builds on top."*
- `{{has_n8n_already}}` — `true` when `brain.sections.stack.custom_tools[]` (or `tools[]`) names n8n / Make / Zapier as already in use; `false` otherwise.

**When to OMIT the block entirely**:
- Both ClickUp brand-as-OS structure and Claude Code are already in place *(detected via brain.has_clickup_brand_as_os === true AND brain.has_claude_code_install === true)*. Skip; modules render as the headline of Page 07.

**Why this exists**

Module 01 *(ClickUp OS · Foundation)* assumes a clean ClickUp workspace ready to receive the brand-as-OS template, and assumes a builder machine with Claude Code installed. A delegate who reads the Roadmap on Sunday and discovers Monday morning that they need to install Claude Code AND clone a ClickUp template AND start Phase 1 will likely just install Claude Code and call it a day. Surfacing the two prerequisites as a 75-minute "this week" block sets up Module 01 to actually start clean.

The Wispr Flow conversation lives in chat — see `run-interview.md` § Consultant asides for the trigger pattern + setup script.

---

**First 30 Days mini-playbook — derivation rules**

A 4-row table at the bottom of Page 07 that bridges the abstract roadmap into Monday-morning action. One row per module, first 4 in dependency-order.

**Inputs** *(from brain)*:
- `brain.recommendations.modules[*]` *(first 4 in array)*
- `module.weeks` *(for the Week cell — first week only)*
- `module.owners.primary` + `.contributors` *(for Whose Monday changes)*
- `module.problem` + `.prerequisites` *(for What they do)*
- `module.key_metrics[0]` *(for Acceptance check — phrased as Friday-of-week test)*

**Compute**:

1. Pick the **first 4 modules in dep-order** *(modules array as emitted by recommend-modules — already in the right sequence)*.
2. Per row, derive cells:
   - **`first30_week_N`**: parse `module.weeks` → take first week *(e.g. `"wk 4-7"` → `"Wk 4"`)*. If two modules start in the same week, the second one's label becomes `"Wk N parallel"`.
   - **`first30_who_N`**: `module.owners.primary` + *(optional " + " + first contributor name if it's a real name, not a generic role label)*. Cap at 2 names per cell. If brain.team.roles is thin, use generic role label *(e.g. "tech lead", "ops director")* — never fabricate a name.
   - **`first30_action_N`**: 1-sentence imperative. Synthesise from `module.prerequisites` + `module.problem`. Voice: action-led, no jargon, **12-20 words**. E.g. *"Wire Linnworks → Supabase, validate sell-through data on top 5 ASINs."*
   - **`first30_check_N`**: 1-sentence Friday-of-that-week verifiable test. Synthesise from `module.key_metrics[0]` reframed as a binary pass/fail. E.g. *"Demand Planning shows correct cover-days for top 5 ASINs."*
3. **`{{first30_intro}}`**: one sentence framing. E.g. *"The first four weeks aren't abstract. Each owns one concrete shift; each ends with one verifiable acceptance check."*

**Render-time placeholders to fill**:

- `{{first30_intro}}` — 1 sentence
- 4 rows × 4 cells = 16 placeholders: `{{first30_week_1..4}}`, `{{first30_who_1..4}}`, `{{first30_action_1..4}}`, `{{first30_check_1..4}}`

**When to OMIT the table entirely**:

- Fewer than 4 modules have `owners.primary` populated.
- 50%+ of owners cells fall back to **generic role labels** *(signal: brain.team.roles is too thin to make Monday concrete)*.

In those cases, the Schedule chart at the top still renders, but the First 30 Days table is skipped.

**Why these exist**

The chat handoff after a roadmap renders fine *("type 'start Module 02'...")*. The printed PDF in a delegate's hand on a Sunday afternoon — without a Cowork window open — needs the schedule visible at a glance and the next-Monday lift made literal. The Schedule chart answers *"what's the 12-week shape?"*. The First 30 Days table answers *"what does Cara/Chris/Simon actually do at 9am Monday?"*. Without both, the Roadmap is descriptive; with them, it's prescriptive — and survives leaving Cowork.

**Project State strip — derivation rules**

Each Page 07 module card now ends with a Project State strip that surfaces the existing schema fields *(`status`, `current_phase`, `deliverables`)* visually. The strip turns the Roadmap from *"a static description of seven modules"* into *"a project board you can read in one scan"*. Closes the *"where are the markdown files? can we start phase one in claude code tomorrow?"* gap in Sim's feedback.

**Inputs** *(from brain)*:
- `module.status` — one of 13 lifecycle states *(recommended → planned → in_progress → phase_N_complete → built_v1 → deployed → audit_t4_passed → redeployed; or tolerated)*
- `module.current_phase` — integer 1-5 or null *(1=Schema, 2=Ingestion, 3=Logic, 4=Surface, 5=Deploy+monitor)*
- `module.deliverables.*_path` — populated when `start-implementation` fires for the module *(claude_md_path, build_plan_path, verification_plan_path, status_json_path, readme_path)*. Null when not yet emitted.
- `module.audit_t4.scheduled_for` *(if status >= deployed)* — used to render the T+4 audit countdown.

**Compute**:

1. **`{{module_status_pill}}`**: uppercase the status, replacing underscores with spaces. e.g. `"in_progress"` → `"IN PROGRESS"`, `"phase_3_complete"` → `"PHASE 3 COMPLETE"`. Cap at 24 chars.

2. **`{{module_phase_dots}}`**: 5-char string of filled (●) and empty (○) circles based on `module.current_phase`. Map:
   - null / 0 → `○○○○○`
   - 1 → `●○○○○`
   - 2 → `●●○○○`
   - 3 → `●●●○○`
   - 4 → `●●●●○`
   - 5 → `●●●●●`

3. **`{{module_phase_label}}`**: short label after the dots. Map:
   - null → `not started`
   - 1 → `1 of 5 · Schema`
   - 2 → `2 of 5 · Ingestion`
   - 3 → `3 of 5 · Logic`
   - 4 → `4 of 5 · Surface`
   - 5 → `5 of 5 · Deploy + monitor`

4. **Deliverables checklist** *(5 rows)*. For each of the 5 paths *(claude_md, build_plan, verification, status_json, readme)*, fill four placeholders:
   - **`{{deliv_check_<name>}}`**: `☑` if `module.deliverables.<name>_path` is populated *(non-null, non-empty)*, else `☐`.
   - **`{{deliv_check_color_<name>}}`**: `#00D67A` *(accent green)* if populated, `#9AA1AE` *(gray)* if not.
   - **`{{deliv_path_<name>}}`**: the actual path if populated *(e.g. `modules/02-recruitment-pipeline/build-plan.md`)*. If not populated: render the *expected* path so the reader sees what's coming. Compute as `modules/{{n}}-{{slug-of(module.name)}}/{{filename}}` where `slug-of` lowercases + hyphenates the name. The 5 filenames map to: `CLAUDE.md`, `build-plan.md`, `verification-plan.md`, `status.json`, `README.md`.
   - **`{{deliv_path_color_<name>}}`**: `#0A0E1A` *(ink — confirmed)* if populated, `#9AA1AE` *(gray — projected)* if not.

5. **`{{module_trigger_phrase}}`** *(Track E3 — clickable bidirectional state)*: the next-step trigger phrase the inline click-handler copies to the clipboard. Map by status — **must match `update-module-status.md` § "Identify the module" parser exactly**, AND match the Page 07.5 kanban card's trigger-phrase table verbatim *(both surfaces are wired to advance the same lifecycle)*:

   | status | module_trigger_phrase |
   |---|---|
   | `recommended` | `start Module {{n}}` |
   | `planned` | `kicking off Module {{n}}` |
   | `in_progress` | `Phase 1 done on Module {{n}}` |
   | `phase_1_complete` | `Phase 2 done on Module {{n}}` |
   | `phase_2_complete` | `Phase 3 done on Module {{n}}` |
   | `phase_3_complete` | `Phase 4 done on Module {{n}}` |
   | `phase_4_complete` | `Phase 5 done on Module {{n}}` |
   | `phase_5_complete` | `Module {{n}} built` |
   | `built_v1` | `Module {{n}} deployed` |
   | `deployed` | `audit Module {{n}}` |
   | `redeployed` | `Module {{n}} audit passed` |
   | `audit_t4_passed` | `Module {{n}} closed-loop` |
   | `tolerated` | *(no trigger — clicking shows a "tolerated · terminal" toast)* |

   This trigger powers the click affordance on **two surfaces**: the Page 07 status pill + phase-dots span, AND the Page 07.5 kanban card. Same data-trigger, same lifecycle advance — change one, change both.

6. **`{{module_next_action}}`**: lifecycle-aware sentence. Pick from the table below by status. Substitute `{{n}}`, `{{slug}}`, `{{current_phase}}`, `{{phase_1_hours}}` *(estimate from module.effort divided by 5)*, and any other module fields as needed.

   | status | next-action template |
   |---|---|
   | `recommended` | *"In Cowork: type **'start Module {{n}}'** → 5 markdown files emit to `modules/{{slug}}/`."* |
   | `planned` | *"Open Claude Code in `modules/{{slug}}/` → run Phase 1 (Schema) from `build-plan.md`. ~{{phase_1_hours}} hrs."* |
   | `in_progress` | *"Complete Phase {{current_phase}} → in Cowork: **'Phase {{current_phase}} done on Module {{n}}'**."* |
   | `phase_1_complete` … `phase_4_complete` | *"Run Phase {{current_phase + 1}} from `build-plan.md`. Phase log so far: {{status_history.length}} updates."* |
   | `phase_5_complete` | *"Verify against `verification-plan.md` → in Cowork: **'Module {{n}} built'**."* |
   | `built_v1` | *"Deploy to production. When live: **'Module {{n}} deployed'**."* |
   | `deployed` | *"T+4 weeks audit ({{audit_t4.scheduled_for│"~4 wks out"}}) → **'audit Module {{n}}'**."* |
   | `audit_t4_passed` | *"Redeploy reclaimed hours ({{projected_hours_saved_per_week}} hrs/wk). When picked: **'Module {{n}} redeployed to <thing>'**."* |
   | `redeployed` | *"Done. Pick the next module."* |
   | `tolerated` | *"Module retired without full deploy. See status_history for context."* |

   Voice: action-led, ≤ 22 words, **always names the exact trigger phrase** *(e.g. `'start Module 02'`, `'Phase 1 done on Module 02'`)* in **bold** so a delegate can grep the page for what to type.

**When to OMIT the Project State strip**:

- Never. The strip renders for every module — even modules with `status: "recommended"` show the empty-state shape *(unchecked deliverables, ○○○○○ phase dots, "Next: start Module 0N")*. Showing the empty state is the point: the project-management infrastructure is **visible** before the user even commits.

**Why this exists** *(per Sim's feedback after the Track A/B/C re-test)*:

The "three concrete starts" copy on Page 09 was vague — it said *"forward to your tech lead"* without naming the deliverables. Sim's question: *"are there any md files to share if we want to implement in Claude Code? Imagine the artifact is like ClickUp — what are the stages, what are the tasks, where does the PRD live?"* The answer: the deliverables exist *(emitted by `start-implementation`)*, the stages are encoded *(13 lifecycle states + 5 phases)*, and the PRD lives in `modules/<n>-<slug>/build-plan.md`. The Project State strip surfaces all of that. The PDF now reads as a living project board, not a static description.

### Page 07.5 · Project Board *(kanban)*

```html
<!-- 6-column kanban view of every module's lifecycle state. Slotted between Page 07
     (Migration plan) and Page 08 (Featured module). The fractional 07.5 numbering means
     pages 08/09/10 keep their existing IDs, nav-rail entries, TOC entries and prose
     references — no cascade renumber.

     Status → column mapping (13 lifecycle states → 6 visible columns + a tolerated strip):
       recommended                                                    → Recommended
       planned                                                        → Planned
       in_progress, phase_1..4_complete                               → In Progress
       phase_5_complete, built_v1                                     → Built
       deployed                                                       → Deployed
       redeployed, audit_t4_passed                                    → T+4 Audit
       tolerated                                                      → footer strip (out-of-flow)

     Click affordance on each card is wired in Track E3 (data-trigger + click-handler).
     Print + reduced-motion: cards lose hover affordance; layout stays. -->
<span class="pill is-settle s-1">Project board · live state</span>
<h1 class="page-title is-settle s-2" style="margin-top:16px">{{board_headline}}</h1>
<p class="lead is-settle s-3">{{board_body}}</p>

<div class="kanban">

  <!-- Column 1 · Recommended — Track F (Sim #19) splits into two sub-groups
       inside the same column: "Start this week" (complexity_grade == Beginner)
       and "This quarter" (Intermediate + Advanced). Preserves E2's column count
       at 6 so existing print/PDF layout doesn't reflow. The split happens via
       sub-headers; cards still all live in the same column. -->
  <div class="kanban-col">
    <div class="kanban-col-header">
      <span class="col-title">Recommended</span>
      <span class="col-count">{{board_count_recommended}}</span>
    </div>
    <!-- Sub-header A · Start this week (Beginner-grade) -->
    <div class="kanban-col-subhead" style="margin-top:8px;padding:6px 10px;border-radius:6px;background:#E6FAF1;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:9.5px;color:#0A6F47;text-transform:uppercase;letter-spacing:0.06em">Start this week · {{board_count_recommended_beginner}}</div>
    {{board_cards_recommended_beginner}}
    <!-- Sub-header B · This quarter (Intermediate + Advanced) -->
    <div class="kanban-col-subhead" style="margin-top:14px;padding:6px 10px;border-radius:6px;background:#FFF7E0;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:9.5px;color:#6B5500;text-transform:uppercase;letter-spacing:0.06em">This quarter · {{board_count_recommended_quarter}}</div>
    {{board_cards_recommended_quarter}}
  </div>

  <!-- Column 2 · Planned -->
  <div class="kanban-col">
    <div class="kanban-col-header">
      <span class="col-title">Planned</span>
      <span class="col-count">{{board_count_planned}}</span>
    </div>
    {{board_cards_planned}}
  </div>

  <!-- Column 3 · In Progress -->
  <div class="kanban-col kanban-col--accent">
    <div class="kanban-col-header">
      <span class="col-title">In Progress</span>
      <span class="col-count">{{board_count_in_progress}}</span>
    </div>
    {{board_cards_in_progress}}
  </div>

  <!-- Column 4 · Built -->
  <div class="kanban-col">
    <div class="kanban-col-header">
      <span class="col-title">Built</span>
      <span class="col-count">{{board_count_built}}</span>
    </div>
    {{board_cards_built}}
  </div>

  <!-- Column 5 · Deployed -->
  <div class="kanban-col">
    <div class="kanban-col-header">
      <span class="col-title">Deployed</span>
      <span class="col-count">{{board_count_deployed}}</span>
    </div>
    {{board_cards_deployed}}
  </div>

  <!-- Column 6 · T+4 Audit -->
  <div class="kanban-col">
    <div class="kanban-col-header">
      <span class="col-title">T+4 Audit</span>
      <span class="col-count">{{board_count_audit}}</span>
    </div>
    {{board_cards_audit}}
  </div>

</div>

<!-- Tolerated footer strip — only renders when ≥1 module is tolerated -->
{{board_tolerated_strip}}

<!-- Read-the-board legend + click hint -->
<div style="margin-top:24px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px">
  <p style="margin:0;font-size:12px;color:#5C6473;line-height:1.5">{{board_caption}}</p>
  <p style="margin:0;font-family:var(--font-mono);font-size:11px;color:#9AA1AE;letter-spacing:0.04em">CLICK A CARD → COPY THE TRIGGER PHRASE → PASTE IN CHAT</p>
</div>
```

**Per-card HTML** *(one block per module, repeated inside the right column's `{{board_cards_*}}` placeholder)*:

```html
<div class="kanban-card kanban-card--{{column_modifier}}"
     data-trigger="{{trigger_phrase}}"
     data-module="{{n}}"
     data-current-status="{{status}}">
  <div class="num-row">
    <span class="num">M{{n}}</span>
    <span class="phase">{{phase_dots}}</span>
  </div>
  <div class="name">{{name}}</div>
  <div class="meta">{{card_meta}}</div>
</div>
```

**Tolerated-strip HTML** *(rendered as `{{board_tolerated_strip}}` when ≥1 module is tolerated; empty string otherwise)*:

```html
<div class="kanban-tolerated">
  <span class="label">Tolerated</span>
  <!-- One per tolerated module -->
  <span class="tol-card">M{{n}} · {{name}}</span>
</div>
```

---

**Page 07.5 · Project Board — derivation rules**

The kanban surfaces every module's lifecycle position at a glance. Closes Sim's *"imagine the artifact is like ClickUp — what are the stages, what are the tasks?"* gap with a literal kanban view.

**Inputs** *(from brain)*:

- `brain.recommendations.modules[*].status` — one of 13 lifecycle states *(see `update-module-status.md` § The lifecycle)*
- `brain.recommendations.modules[*].n` + `.name` *(card content)*
- `brain.recommendations.modules[*].current_phase` *(phase-dots indicator on In-Progress / Built cards)*
- `brain.recommendations.modules[*].audit_t4.scheduled_for` *(meta line on Deployed / T+4 cards — the "T+4 audit due {{date}}" tail)*
- `brain.recommendations.modules[*].deployed_at` *(meta line on Deployed cards)*
- `brain.recommendations.modules[*].audit_t4.hours_saved_per_week_actual` *(meta line on T+4 Audit cards)*
- `brain.recommendations.modules[*].tag` *(recommended-start gets a small Pulse dot in the Recommended column)*

**Compute**:

1. **Group modules by column.** For each module, map `status` → column key:

   | status | column key | `kanban-card--{{column_modifier}}` class |
   |---|---|---|
   | `recommended` | `recommended` | `recommended` |
   | `planned` | `planned` | `planned` |
   | `in_progress`, `phase_1_complete`, `phase_2_complete`, `phase_3_complete`, `phase_4_complete` | `in_progress` | `in-progress` |
   | `phase_5_complete`, `built_v1` | `built` | `built` |
   | `deployed` | `deployed` | `deployed` |
   | `redeployed`, `audit_t4_passed` | `audit` | `audit` |
   | `tolerated` | `tolerated` | *(footer strip, not a card)* |

   Order modules within a column by `n` ascending *(M01 above M02 above M03)*.

2. **Per-column counts.** `{{board_count_<col>}}` = number of modules in that column. Format: `"3"`, `"0"`. Render `"0"` literally, not blank — the empty column should still show its count.

2a. **Recommended column split** *(Track F · Sim #19)*. Inside the Recommended column, partition by `complexity_grade`:
   - `complexity_grade == "Beginner"` → `{{board_cards_recommended_beginner}}` *(under "Start this week" sub-header)*
   - `complexity_grade ∈ {"Intermediate", "Advanced"}` → `{{board_cards_recommended_quarter}}` *(under "This quarter" sub-header)*
   - Modules with no `complexity_grade` populated → fall into the quarter group *(safer default; surface in chat output that complexity wasn't graded)*.
   - `{{board_count_recommended_beginner}}` and `{{board_count_recommended_quarter}}` are the counts for each sub-group; the parent `{{board_count_recommended}}` is still the total *(sum of both)*.
   - **The split is sub-headers inside one column**, not a new column. E2's 6-column layout stays intact for print/PDF — Sim's #19 alternative *(replace kanban entirely)* is rejected; this preserves E2.

3. **Per-card placeholders** *(one block per module)*:
   - `{{column_modifier}}`: from the table above.
   - `{{trigger_phrase}}`: lifecycle-aware. **Same as the `module_next_action` trigger from the Page 07 Project State strip** — the kanban click and the Page 07 click both copy the same phrase. Map by status:

     | status | trigger_phrase |
     |---|---|
     | `recommended` | `start Module {{n}}` |
     | `planned` | `kicking off Module {{n}}` |
     | `in_progress` | `Phase 1 done on Module {{n}}` *(start of phase ladder)* |
     | `phase_1_complete` | `Phase 2 done on Module {{n}}` |
     | `phase_2_complete` | `Phase 3 done on Module {{n}}` |
     | `phase_3_complete` | `Phase 4 done on Module {{n}}` |
     | `phase_4_complete` | `Phase 5 done on Module {{n}}` |
     | `phase_5_complete` | `Module {{n}} built` |
     | `built_v1` | `Module {{n}} deployed` |
     | `deployed` | `audit Module {{n}}` |
     | `redeployed` | `Module {{n}} audit passed` |
     | `audit_t4_passed` | `Module {{n}} closed-loop` *(no further transition; clicking shows a "closed-loop · nothing to advance" toast)* |

     Voice: imperative; **must** match `update-module-status.md` § "Identify the module" trigger phrases verbatim — the parser there is the source of truth. If you change a trigger phrase here, change it there.

   - `{{phase_dots}}`: same 5-dot string as the Page 07 Project State strip *(`○○○○○`, `●○○○○`, ..., `●●●●●`)*. For statuses below `in_progress`, render empty *(`○○○○○`)*. For `built_v1` / `deployed` / `redeployed` / `audit_t4_passed`, render full *(`●●●●●`)*.
   - `{{name}}`: module name, capped at ~28 chars with ellipsis if longer. CSS `-webkit-line-clamp: 2` handles 2-line wrap.
   - `{{card_meta}}`: small line under the name, lifecycle-aware. Map:

     | status | meta line |
     |---|---|
     | `recommended` | *(empty — the column itself signals state)* |
     | `planned` | `Phase 1 starts {{when}}` *(read from `module.phase_starts[1]`; fallback "soon")* |
     | `in_progress`, `phase_N_complete` | `Phase {{current_phase}} of 5` |
     | `built_v1` | `built {{built_at|"recently"}}` |
     | `deployed` | `live · audit {{audit_t4.scheduled_for|"~4 wks"}}` |
     | `audit_t4_passed`, `redeployed` | `+{{audit_t4.hours_saved_per_week_actual}} hrs/wk reclaimed` |

4. **Tolerated strip** *(only renders when ≥1 module is tolerated)*: list one `<span class="tol-card">` per tolerated module *(short — no click affordance, no trigger phrase; tolerated is terminal)*. If 0 modules tolerated: render `{{board_tolerated_strip}}` as an empty string *(no `<div>` at all)*.

5. **`{{board_headline}}`**: 1-line title. Brand-aware default: *"Where every module sits, right now."*

6. **`{{board_body}}`**: 1-2 sentences framing. Default: *"Six columns, one per stage. Modules move left → right as you build. Click any card to copy the next-step trigger phrase — paste it in chat to advance the state."*

7. **`{{board_caption}}`**: 1-2 sentences below the kanban. Default: *"This board is a live mirror of `brain.json`. Each click writes a status update via `update-module-status` *(see Appendix)*. The roadmap re-emits in place; your downloaded copy can be re-downloaded any time to get the latest state."*

**When to OMIT the kanban entirely**:

- `progress.stage` is below `deriving` *(no module list to render — kanban needs sequenced modules)*. Use the locked-page stub instead.
- `brain.recommendations.modules` is empty or fewer than 2 modules *(too thin — just show Page 07 module cards)*.

When omitted, the page renders as a locked stub *(see § Locked-page stub)* labeled "07.5 · Project Board · locked" with `{{after}}` = "modules sequenced".

**On re-emission** *(any module's status changes via `update-module-status`)*: re-render Page 07.5 along with Page 07. Cards move columns; counts update; phase dots advance. The optimistic-state badge from E3 *(see `templates/dashboard-artifact.html` § Track E3 click-handler)* clears for any card whose actual status now matches the prior optimistic state.

**Why this exists** *(per Sim's feedback after Track A/B/C re-test)*:

> *"imagine the artifact is like ClickUp — what are the stages, what are the tasks, where does the PRD live? Can we start phase one in Claude Code tomorrow?"*

Track A delivered the schedule + first-30-days *(descriptive)*. Track D delivered the per-module Project State strip *(prescriptive at the row level)*. Track E2 delivers the **portfolio view** — every module's stage at a glance, on one page. The artifact stops being a fancy PDF that *describes* a project and becomes a project board that *operates*. Combined with E3's clickable bidirectional state, the printed PDF becomes a prototype of how a delegate's team will run the build over the next 12 weeks.

### Page 08 · Featured module *(deep dive)*

```html
<span class="pill">{{featured_module_pill}}</span>
<h1 class="module-title">{{featured_module_title}}</h1>
<p class="module-subtitle">{{featured_module_subtitle}}</p>

<!-- Problem / Outcome callouts -->
<div class="callout callout--problem">
  <div class="label label--rented">The bottleneck today</div>
  <p style="margin-top:8px;font-size:14px;line-height:1.55">{{module_problem}}</p>
</div>
<div class="callout callout--outcome">
  <div class="label label--savings">Outcome</div>
  <p style="margin-top:8px;font-size:14px;line-height:1.55">{{module_outcome}}</p>
</div>

<!-- Replaces / Inputs / Outputs / Stack tables -->
<div style="margin-top:24px;border:1px solid var(--line);border-radius:12px;overflow:hidden">
  <div class="label" style="padding:12px 16px;background:var(--paper);border-bottom:1px solid var(--line)">What it replaces · rented → owned</div>
  <div style="padding:8px 16px">
    <!-- One row per replaced tool -->
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid var(--line)">
      <span style="font-size:14px">✕ {{replaces_tool}}</span>
      <span class="mono" style="font-size:12px;color:var(--rented)">{{replaces_cost}}</span>
    </div>
  </div>
</div>

<div class="grid-3" style="margin-top:16px">
  <div class="card">
    <div class="label">Inputs</div>
    <ul style="margin-top:8px;font-size:14px;padding-left:18px"><li>{{input_1}}</li></ul>
  </div>
  <div class="card">
    <div class="label">Outputs</div>
    <ul style="margin-top:8px;font-size:14px;padding-left:18px"><li>{{output_1}}</li></ul>
  </div>
  <div class="card">
    <div class="label">Stack & cost</div>
    <ul style="margin-top:8px;font-size:14px;padding-left:18px"><li>{{stack_1}}</li></ul>
  </div>
</div>

<!-- Verification plan -->
<div class="verif">
  <div class="label label--cobalt">Verification plan · how we know it works</div>
  <ul>
    <li>{{verification_check_1}}</li>
    <li>{{verification_check_2}}</li>
    <li>{{verification_check_3}}</li>
  </ul>
</div>

<!-- Week-after narrative -->
<div class="callout callout--week">
  <div class="label label--cobalt">Your week after this is live</div>
  <p class="editorial">{{module_week_after}}</p>
</div>

<!-- Prerequisites / Key metrics / Risks 3-col grid -->
<div class="grid-3" style="margin-top:16px">
  <div class="card">
    <div class="label">What you'll need</div>
    <ul style="margin-top:8px;font-size:12px;color:var(--graphite);padding-left:18px"><li>{{prerequisite_1}}</li></ul>
  </div>
  <div class="card">
    <div class="label">Measure these</div>
    <ul style="margin-top:8px;font-size:12px;color:var(--graphite);padding-left:18px"><li>{{key_metric_1}}</li></ul>
  </div>
  <div class="card" style="background:var(--warn-bg);border-color:var(--warn)">
    <div class="label label--warn">Risks · mitigations</div>
    <ul style="margin-top:8px;font-size:12px;padding-left:18px;list-style:none">
      <li><strong>△ {{risk_1}}</strong><br>→ {{mitigation_1}}</li>
    </ul>
  </div>
</div>

<!-- Files you'll get when you start · 5 markdown deliverables that emit when `start-implementation`
     fires for this module. Surfaces the per-module file structure on the page so a delegate reading
     the printed PDF knows exactly what they'll have to drop into Claude Code. -->
<div style="margin-top:24px;border:1px solid #E2E6EC;border-radius:12px;background:#F7F8FA;padding:18px 20px">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
    <span class="label label--cobalt">Files you'll get</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#5C6473">when you type <strong>'start Module {{featured_n}}'</strong> in Cowork</span>
  </div>
  <p style="margin:0 0 12px;font-size:12.5px;line-height:1.5;color:#5C6473">syncflow writes 5 markdown files to a per-module folder. Drop the folder into Claude Code; Phase 1 begins from <code style="font-family:ui-monospace,SF Mono,Menlo,monospace;background:#ECEFF3;padding:1px 5px;border-radius:3px">build-plan.md</code>.</p>
  <pre style="margin:0;padding:12px 14px;background:#0A0E1A;color:#E2E6EC;border-radius:6px;font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;overflow-x:auto"><code>~/syncflow-projects/{{brand_slug}}/
├── brain.json
└── modules/
    └── {{featured_n}}-{{featured_slug}}/
        ├── CLAUDE.md             <span style="color:#9AA1AE">· per-module Claude Code system prompt</span>
        ├── build-plan.md         <span style="color:#9AA1AE">· 5-phase build plan (the PRD)</span>
        ├── verification-plan.md  <span style="color:#9AA1AE">· acceptance tests for each phase</span>
        ├── status.json           <span style="color:#9AA1AE">· current_phase + history (auto-updated)</span>
        └── README.md             <span style="color:#9AA1AE">· module overview + quick-start</span></code></pre>
  <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#5C6473">Once written, your tech lead opens Claude Code in <code style="font-family:ui-monospace,SF Mono,Menlo,monospace;background:#ECEFF3;padding:1px 5px;border-radius:3px">modules/{{featured_n}}-{{featured_slug}}/</code> and starts Phase 1 *(Schema)*. Each completed phase reports back via <strong>'Phase N done on Module {{featured_n}}'</strong>; the Project State strip on Page 07 advances.</p>
</div>

<!-- Action footer · three-path branch CTA -->
<!-- Replaces the prior single-paragraph CTA. Each path is concrete, named, dated. -->
<div style="margin-top:16px;background:var(--ink);color:#fff;border-radius:12px;padding:24px">
  <div class="label" style="color:rgba(255,255,255,0.5);margin-bottom:14px">What to do with this page · pick your path</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
    <!-- Path 1 · Building it yourself -->
    <div style="border-left:2px solid #00D67A;padding:0 0 0 12px">
      <div class="label label--savings" style="font-size:9.5px;letter-spacing:0.08em;margin-bottom:6px">Building it yourself</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.55);font-weight:500;margin-bottom:8px">Tech lead + Claude Code</div>
      <p style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.85);margin:0">{{path_cowork}}</p>
    </div>
    <!-- Path 2 · Engaging syncflow -->
    <div style="border-left:2px solid #11151F;padding:0 0 0 12px">
      <div class="label label--cobalt" style="font-size:9.5px;letter-spacing:0.08em;margin-bottom:6px">Engaging syncflow</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.55);font-weight:500;margin-bottom:8px">Built alongside your team</div>
      <p style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.85);margin:0">{{path_studio}}</p>
    </div>
    <!-- Path 3 · Handing off internally -->
    <div style="border-left:2px solid #0A0E1A;padding:0 0 0 12px">
      <div class="label label--warn" style="font-size:9.5px;letter-spacing:0.08em;margin-bottom:6px">Handing it to your team</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.55);font-weight:500;margin-bottom:8px">Internal build</div>
      <p style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.85);margin:0">{{path_internal}}</p>
    </div>
  </div>
</div>
```

**Three-path branch CTA — derivation rules**

The Page 08 footer now branches into three explicit paths. Each is concrete enough that a delegate without Cowork open *(reading the printed PDF on a Sunday)* can choose between them and act.

**Render the three placeholders as follows** *(adjust per delegate's stack and the featured module — these defaults are templates, not literal copy)*:

- **`{{path_cowork}}`** — 2-3 sentences. The Cowork-native fast-path. *Default*: *"In Cowork: type **'start Module {{featured_n}}'**. syncflow writes CLAUDE.md, the build plan, the verification plan, and the module folder structure to your project. ~5 min. Your tech lead opens Claude Code in that folder; Phase 1 begins. Best when you have a tech lead with Claude Code already wired up."*
- **`{{path_studio}}`** — 2-3 sentences. The agency engagement path. *Default*: *"Email **github.com/ctrboost/idealsync-systems/issues**. Bring this PDF + your brain.json *(Appendix has the snapshot pointer)*. ~2-day kick-off; we run the build alongside your team. Best when you want the build done in 4-6 weeks without distracting your operations team."*
- **`{{path_internal}}`** — 2-3 sentences. The hand-to-internal-team path. *Default*: *"Forward this PDF + the brain.json + the per-module build plan to your most capable systems person. Module {{featured_n}} is **~{{featured_effort}}** of focused build for a tech-savvy operator. See Page 09 + Appendix for case-study notes. Best when you have an in-house systems person who can own the build top-to-bottom."*

**Why three explicitly named paths**

The previous CTA *("Type 'build plan for Module 02' to get the full technical build plan...")* assumed the reader was inside Cowork. A delegate at the SSL workshop with the printed PDF in their hand has three real choices: build in Cowork themselves, hire syncflow, or hand to their internal team. Naming all three converts the page from *"here's a deliverable"* to *"here's how this becomes a project this week"*.

**Files-you'll-get block — derivation rules**

Surfaces the per-module file structure on Page 08 so a delegate reading the printed PDF knows exactly what they'll have to drop into Claude Code if they pick the *"building it yourself"* path.

**Inputs** *(from brain)*:
- `brain.brand` *(the lowercase-hyphenated brand slug)* → `{{brand_slug}}`
- `brain.recommendations.featured_module` *(the module n, e.g. `"02"`)* → `{{featured_n}}`
- The featured module's `name` → slug-of(name) → `{{featured_slug}}` *(lowercase, hyphenated; e.g. `"Recruitment Pipeline"` → `"recruitment-pipeline"`)*
- The featured module's `effort` → `{{featured_effort}}` *(already in use by three-path block)*

**Render the file tree verbatim**, substituting only the three slot placeholders. The 5 filenames *(`CLAUDE.md`, `build-plan.md`, `verification-plan.md`, `status.json`, `README.md`)* are stable — don't customise. The grey side-comments *(`· per-module Claude Code system prompt`, etc.)* are also stable; if a future skill adds new files, update both this block and the Page 07 Project State checklist *(both lists must stay in sync)*.

**When to OMIT**:
- `brain.recommendations.featured_module` is null *(no module has been featured)*. In that case, render the file tree with `{{featured_n}}` as `02` and `{{featured_slug}}` as `recommended-start` so the structural shape is still visible — the reader sees the *pattern*, not a specific module.

**Why this exists** *(per Sim's feedback)*:

Sim's question after the Track A/B/C re-test: *"are there any md files to share if we want to implement in Claude Code MVPs?"* The answer is yes — `start-implementation` writes 5 markdown files per module — but the printed PDF never named them. This block makes the deliverables literal: the tree shows the directory layout, the filenames, the line-comments naming what each file is. A tech lead reading Page 08 now knows exactly what they'll get, where it'll land, and how to start Phase 1. *"Where does the PRD live?"* answered: `modules/<n>-<slug>/build-plan.md`.

### Page 09 · Closing

```html
<span class="pill">Closing</span>
<h1 class="closing-headline">
  {{closing_headline_lead}}<br>
  <span class="accent">{{closing_headline_accent}}</span>
</h1>

<!-- Compounding Moat — 12-month projection (owned vs rented surface) -->
<!-- Renders only when ≥3 modules have projected_hours_saved_per_week populated -->
<div style="margin-top:28px;padding:20px;border-radius:12px;background:#F7F8FA;border:1px solid #E2E6EC">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px">
    <span class="label label--cobalt">The compounding moat · 12 months out</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:11px;color:#9AA1AE">cumulative · projected</span>
  </div>

  <!-- SVG chart — pure SVG, no JS, no external libs. A4-safe. -->
  <svg viewBox="0 0 720 240" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
    <!-- grid -->
    <g stroke="#E2E6EC" stroke-width="1">
      <line x1="40" y1="20"  x2="700" y2="20"/>
      <line x1="40" y1="80"  x2="700" y2="80"/>
      <line x1="40" y1="140" x2="700" y2="140"/>
      <line x1="40" y1="200" x2="700" y2="200"/>
    </g>
    <!-- y-axis labels (hours/wk recovered cumulative) -->
    <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="10" fill="#9AA1AE">
      <text x="36" y="24" text-anchor="end">{{moat_y_max}}</text>
      <text x="36" y="84" text-anchor="end">{{moat_y_two_thirds}}</text>
      <text x="36" y="144" text-anchor="end">{{moat_y_one_third}}</text>
      <text x="36" y="204" text-anchor="end">0</text>
    </g>
    <!-- x-axis labels (months 0-12) -->
    <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="10" fill="#9AA1AE">
      <text x="40"  y="220" text-anchor="middle">M0</text>
      <text x="150" y="220" text-anchor="middle">M2</text>
      <text x="260" y="220" text-anchor="middle">M4</text>
      <text x="370" y="220" text-anchor="middle">M6</text>
      <text x="480" y="220" text-anchor="middle">M8</text>
      <text x="590" y="220" text-anchor="middle">M10</text>
      <text x="700" y="220" text-anchor="middle">M12</text>
    </g>

    <!-- Owned curve (cumulative hours saved, climbing as modules deploy) -->
    <!-- Substitute {{moat_owned_path}} with an SVG path d="..." derived per the rules below -->
    <path d="{{moat_owned_path}}" fill="none" stroke="#00D67A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Owned area under curve — same path but filled, semi-transparent -->
    <path d="{{moat_owned_area}}" fill="#E6FAF1" stroke="none"/>

    <!-- Rented baseline (flat, slowly drifting) — what they'd be paying without owning -->
    <path d="{{moat_rented_path}}" fill="none" stroke="#0A0E1A" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>

    <!-- Module deploy markers — small dots at the months each module deploys -->
    <g fill="#0A0E1A">
      {{moat_module_markers}}
    </g>

    <!-- Legend -->
    <g font-family="ui-monospace,SF Mono,Menlo,monospace" font-size="10">
      <line x1="450" y1="10" x2="466" y2="10" stroke="#00D67A" stroke-width="2.5"/>
      <text x="472" y="14" fill="#00D67A">owned · {{moat_owned_legend}}</text>
      <line x1="580" y1="10" x2="596" y2="10" stroke="#0A0E1A" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="602" y="14" fill="#0A0E1A">rented · {{moat_rented_legend}}</text>
    </g>
  </svg>

  <p style="margin-top:12px;margin-bottom:0;font-size:12px;color:#5C6473;line-height:1.5">{{moat_caption}}</p>
</div>

<!-- Future-state narrative (pivot-9c) -->
<div class="callout callout--week" style="margin-top:24px">
  <div class="label label--cobalt">Six months from now</div>
  <p class="editorial">{{future_state_narrative_paragraph_1}}</p>
  <p class="editorial">{{future_state_narrative_paragraph_2}}</p>
</div>

<!-- Three concrete starts · pick one this week (replaces the prior free-form closing CTA) -->
<div style="margin-top:32px;border-top:1px solid #E2E6EC;padding-top:24px">
  <div class="label label--cobalt" style="margin-bottom:12px">Three concrete starts · pick one this week</div>
  <div style="display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:start;margin-top:14px">
    <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-size:12px;font-weight:500;color:#11151F;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px">Monday</div>
    <p style="margin:0;font-size:14px;line-height:1.55;color:#0A0E1A">{{start_monday}}</p>
  </div>
  <div style="display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:start;margin-top:12px">
    <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-size:12px;font-weight:500;color:#11151F;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px">Tuesday</div>
    <p style="margin:0;font-size:14px;line-height:1.55;color:#0A0E1A">{{start_tuesday}}</p>
  </div>
  <div style="display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:start;margin-top:12px">
    <div style="font-family:ui-monospace,SF Mono,Menlo,Consolas,monospace;font-size:12px;font-weight:500;color:#11151F;text-transform:uppercase;letter-spacing:0.08em;padding-top:2px">Friday</div>
    <p style="margin:0;font-size:14px;line-height:1.55;color:#0A0E1A">{{start_friday}}</p>
  </div>
</div>

<!-- Forward-this-PDF CTA · Track F (Sim #5) — layered on top of Mon/Tue/Fri, not replacing them.
     Sim flagged that the closing names the founder as the actor for all three starts ("type
     'start Module 02', open Claude Code, decide your build path") — but the founder may be
     the wrong owner. Most operations modules are owned by Cara/Chris/Simon-equivalents. This
     block tells the founder explicitly: "you don't have to be the one who acts; forward this
     PDF + the brain.json to whoever runs operations and they have a turnkey first-Monday." -->
<div style="margin-top:28px;padding:18px 20px;border-radius:12px;background:#0A0E1A;color:#fff">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;color:#B6E1FF;text-transform:uppercase;letter-spacing:0.06em">Don't want to be the actor?</span>
    <span style="font-family:ui-monospace,SF Mono,Cascadia Mono,Roboto Mono,Menlo,Consolas,monospace;font-size:10.5px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.06em">Track F · Sim #5</span>
  </div>
  <p style="margin:0;font-size:13.5px;line-height:1.55;color:rgba(255,255,255,0.92)">{{forward_to_team_cta}}</p>
</div>

<p class="lead" style="margin-top:24px">{{closing_signoff}}</p>
```

**Compounding Moat chart — derivation rules**

The SVG renders a 12-month projection of cumulative hours/week recovered as modules ship. Two curves: **owned** *(climbs as modules deploy)* + **rented** *(flat baseline showing what they'd still be paying)*. Plus dot markers for module deployment events.

**Inputs** *(from brain)*:
- `brain.recommendations.modules[*]` — for each module: `weeks` *(e.g. `"wk 4-5"` or `"wk 8-10"`)*, `projected_hours_saved_per_week`, `n`, `name`.
- `brain.recommendations.replacement.retire[*].monthly_cost` *(or similar)* — for the rented baseline. If absent, derive from `brain.sections.stack.saas_spend` / 12.

**Compute**:

1. **Per-module deploy month**: parse `weeks` (e.g. `"wk 8-10"` → midpoint week 9 → month 2 *(approx 4 weeks/month)*). Record as `(deploy_month, hours_saved_per_week)` tuples.
2. **Owned cumulative curve**: for each month 0–12, sum `hours_saved_per_week` from all modules with `deploy_month <= current_month`. Yields 13 data points.
3. **Y-axis max**: round the month-12 value up to a clean number *(e.g. 27 → 30; 41 → 50)*. Use that for `{{moat_y_max}}`. Compute `{{moat_y_two_thirds}}` and `{{moat_y_one_third}}`.
4. **SVG path computation** *(coordinate space: 40-700 wide × 20-200 tall; lower y = higher value)*:
   - For each month i (0–12): `x = 40 + (i * 55)`, `y = 200 - ((cumulative_value / y_max) * 180)`.
   - `{{moat_owned_path}}`: `M40,200 L<x1>,<y1> L<x2>,<y2> ...` *(line through all 13 points)*.
   - `{{moat_owned_area}}`: same path but closed to baseline: `M40,200 L<x1>,<y1> ... L700,200 Z`.
5. **Rented baseline**: a flat or slowly-drifting line at the y-coord representing `(rented_monthly_cost * 12 / blended_hourly_rate / 52)` — i.e. the hours-equivalent of their ongoing rented spend if it stays the same. Use a default blended rate of £45/hr UK / $60/hr US if not captured.
   - `{{moat_rented_path}}`: `M40,<y_rented> L700,<y_rented>` for flat, OR with a slight upward drift if SaaS spend has been growing.
6. **Module markers**: for each module, render a `<circle cx="<x>" cy="<y>" r="3" />` at its deploy_month + cumulative-at-that-month coordinate. Plus an optional small label *(omit if too crowded; cap at 5 visible labels)*.
   - Compose into `{{moat_module_markers}}` as raw SVG: `<circle cx="..." cy="..." r="3"/><text x="..." y="..." font-size="9" fill="#0A0E1A">02</text>` per module.

**Render-time placeholders to fill**:

- `{{moat_y_max}}` — e.g. `30 hrs/wk` *(integer + unit, no styling)*
- `{{moat_y_two_thirds}}` — e.g. `20`
- `{{moat_y_one_third}}` — e.g. `10`
- `{{moat_owned_path}}` — SVG path d-string *(see step 4)*
- `{{moat_owned_area}}` — closed-path d-string for the fill *(see step 4)*
- `{{moat_rented_path}}` — flat baseline d-string *(see step 5)*
- `{{moat_module_markers}}` — SVG circles + optional labels *(see step 6)*
- `{{moat_owned_legend}}` — e.g. `27 hrs/wk by M12`
- `{{moat_rented_legend}}` — e.g. `~£10k/yr SaaS still ticking`
- `{{moat_caption}}` — one sentence: *"Each module deploys (blue dots) and adds to the cumulative owned curve. The dashed line is what you'd still be paying in SaaS subs without this build sequence — that gap is the compounding moat."*

**When to OMIT the chart entirely**:

- Fewer than 3 modules have `projected_hours_saved_per_week` populated *(too thin to project)*.
- All modules cluster in the same month *(no compounding to show — chart would just be a step function)*.
- No `roi_confidence` is `"high"` or `"medium"` for any module *(directional-only data; chart would mislead)*.

In those cases, fall back to the prior Closing-page shape *(headline + future-state narrative + closing body, no chart)*.

**Why this exists**

Sim's bifurcation thesis — *"AI proficiency = employee proficiency"* — needs a visual. The chart shows the curve literally: the founder's roadmap isn't just modules; it's an arithmetic of compounding hours-saved that diverges from rented-spend baseline over time. Page 09 closes with this curve so the delegate leaves with a quotable visual: *"this is what 12 months of disciplined module-shipping looks like."* The numbers are projections, not promises — the caption makes that explicit.
<div class="grid-3" style="margin-top:24px">
  <div>
    <div class="display" style="font-size:42px;color:var(--cobalt-600)">{{callout_savings}}</div>
    <div style="color:var(--graphite);font-size:13px;margin-top:4px">{{callout_savings_label}}</div>
  </div>
  <div>
    <div class="display" style="font-size:42px;color:var(--cobalt-600)">{{callout_hours}}</div>
    <div style="color:var(--graphite);font-size:13px;margin-top:4px">{{callout_hours_label}}</div>
  </div>
  <div>
    <div class="display" style="font-size:42px;color:var(--cobalt-600)">{{callout_modules}}</div>
    <div style="color:var(--graphite);font-size:13px;margin-top:4px">{{callout_modules_label}}</div>
  </div>
</div>
<div style="margin-top:32px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:20px">
  <div class="label">{{next_step_label}}</div>
  <p style="margin-top:8px;font-size:14px;line-height:1.55">{{next_step_body}}</p>
</div>
```

**Three concrete starts (Page 09 closing) — derivation rules**

The Page 09 closing now ends with three dated, role-named starts *(Monday / Tuesday / Friday)* instead of a free-form *"take this home"* paragraph. Each is concrete enough that a delegate without Cowork open can act in the next 5 working days.

**Inputs** *(from brain)*:
- The recommended-start module *(`brain.recommendations.modules[*]` where `tag === "recommended start"` — usually module 02)*. Pull `n`, `name`, `owners.primary`.
- `brain.sections.team.roles[*]` — find the **tech lead** *(role name matches /tech|engineer|cto|head of (engineering|product|ops|systems)/i, fallback: founder/director)*. This is `{{tech_lead_name}}`.
- The featured module's `prerequisites[0]` and `key_metrics[0]` *(used to make Tuesday's kickoff agenda concrete)*.

**Render the three placeholders as follows** *(each must name the exact trigger phrase and the exact deliverable filenames — vague verbs like "discuss" or "draft" are forbidden, sharpened per Sim's feedback)*:

- **`{{start_monday}}`** — 1-2 sentences. **The fire-the-engine action.** *Default*: *"In Cowork, type **'start Module {{recommended_start_n}}'**. syncflow writes 5 markdown files to `modules/{{recommended_start_n}}-{{recommended_start_slug}}/` *(CLAUDE.md, build-plan.md, verification-plan.md, status.json, README.md — see Page 08 for the tree)*. Forward this PDF + the emitted folder to **{{tech_lead_name|"your most capable systems person"}}**."*
- **`{{start_tuesday}}`** — 1-2 sentences. **The first-build-session action.** *Default*: *"Tech lead opens Claude Code in `modules/{{recommended_start_n}}-{{recommended_start_slug}}/`, reads `build-plan.md`, runs **Phase 1 (Schema)** *(~{{phase_1_hours}} hrs)*. When done, in Cowork: **'Phase 1 done on Module {{recommended_start_n}}'** — status advances, Phase 2 unlocks. Owner ({{recommended_start_owner_primary}}) reviews against `verification-plan.md`."*
- **`{{start_friday}}`** — 1-2 sentences. **The path-decision deadline.** *Default*: *"Decide your build path *(see Page 08 three-path branch)*: in-house, syncflow-led, or hybrid. If hybrid, email **github.com/ctrboost/idealsync-systems/issues** with the brain.json + the emitted module folder; we pair on Phase 2 the following week. If in-house, your tech lead should have Phase 1 done; Phase 2 (Ingestion) starts Monday."*
- **`{{closing_signoff}}`** — 1-2 sentences final. *Default*: *"You don't have to do this alone. You don't have to do it all at once. You do have to start. **Module {{recommended_start_n}}, Phase 1, Monday.**"* Replaces the prior free-form `{{closing_body}}` placeholder; sharper voice, names the exact next move.
- **`{{forward_to_team_cta}}`** *(Track F · Sim #5)* — 1-2 sentences. **Layered on top of Mon/Tue/Fri, doesn't replace them.** *Default*: *"Forward this PDF + `brain.json` + `modules/{{recommended_start_n}}-{{recommended_start_slug}}/` to **{{recommended_start_owner_primary}}** (or whoever runs operations day-to-day). They have a turnkey first-Monday — the build plan, the verification checklist, the per-module CLAUDE.md. Phase 1 starts when they `cd` into the folder and run `claude`. You don't have to be the one who acts."*

**New derivation inputs**:

- `{{recommended_start_slug}}` — slug-of(`module.name`); e.g. `"Recruitment Pipeline"` → `"recruitment-pipeline"`. Lowercase, hyphenated. **Must match** the slug used by the Page 07 Project State strip + the Page 08 Files-you'll-get block — all three reference the same `modules/<n>-<slug>/` directory.
- `{{phase_1_hours}}` — `module.effort` divided by 5, rounded. e.g. effort `"30-40 hrs"` → midpoint 35 / 5 = `"~7"`. The `start-implementation` skill produces a 5-phase build plan with roughly equal phase sizes; this is a fast estimate.

**Why this exists** *(per Sim's feedback after Track A/B/C re-test)*:

Sim's verbatim from the test report: *"vague... where is the plan — are there any md files to share if we want to implement in Claude Code MVPs... can we start phase one in Claude Code tomorrow?"* The previous Three Concrete Starts copy *("forward to your tech lead", "book a 30-min kickoff", "discuss feasibility")* was at the wrong altitude — generic management-speak instead of system-specific action. Sharpened: every sentence names a trigger phrase to type, a file to open, or a status update to send. Even a delegate with zero Claude familiarity, holding only the printed PDF, can read this and Phase 1 starts Monday.

---

## Don't

- Don't introduce CDN deps. The template is self-contained; it must stay self-contained.
- Don't substitute React/JSX for the static HTML — the sandbox blocks it.
- Don't promise outcomes the brain doesn't support. If a number is unknown, render *"to be confirmed"*.
- Don't add content after page 10 (Appendix). The progress footer is the last element.
- Don't skip the verification step — search the filled HTML for `{{` before handing off.
- Don't blow the per-page length budgets *(see below)* — the template prints to A4; cards that overflow the printable area get clipped or pushed off-page in PDF export.

---

## Per-page content length budgets

The artifact is page-paginated for A4 print. The template now ships `@media print` rules with `page-break-after: always` on every `.page` and `page-break-inside: avoid` on every card / callout / module-card / replace-card / verif / totals block. That stops the *browser* from splitting cards mid-content during PDF export — but a card that's intrinsically taller than the printable A4 area (~250mm after padding) will still get clipped.

So the renderer keeps each card within these budgets. Numbers are upper bounds; aim shorter when the brain doesn't justify length.

### Page 02 · Summary
- `manifesto_card_today`: ≤ 55 words (5–6 short sentences, paragraph form)
- `manifesto_card_owned`: ≤ 55 words (same shape)
- The two cards sit side-by-side; keep them close in length so the row doesn't go ragged

### Page 04 · Current state — sprawl table
- Each row's `why` field: ≤ 18 words
- Cap the visible rows at 8. Overflow goes into the appendix glossary, not the table.

### Page 06 · Replacement table — replace-card body
- `row-why`: ≤ 22 words
- `row-meta`: 3 short fields (cost / hours / data); each ≤ 6 words
- Cap at 9 cards visible. Beyond that, summarise; the appendix lists the rest.

### Page 07 · Migration plan — module rows
- `name`: ≤ 5 words
- `status`: 1–3 words
- `meta.deps`: dependency module IDs only (e.g. *"01, 03"*) — no prose
- The migration row is small on purpose; the depth lives on Page 08.

### Page 07.5 · Project Board *(kanban)*
- `name` *(card)*: ≤ 28 chars; CSS clamps to 2 lines, longer names truncate with ellipsis
- `card_meta`: ≤ 5 words *(e.g. `Phase 3 of 5`, `live · audit ~4 wks`)*
- `board_headline`: ≤ 8 words
- `board_body`: ≤ 30 words *(2 sentences)*
- `board_caption`: ≤ 35 words

### Page 08 · Featured module *(deep dive)*
- `module-subtitle`: ≤ 14 words
- `callout--problem` body: ≤ 50 words *(the bottleneck in the delegate's own language)*
- `callout--outcome` body: ≤ 50 words *(Sim-grade outcome quote)*
- `prerequisites` list: 3–5 items, each ≤ 10 words
- `key_metrics` list: 2–3 items, each ≤ 10 words
- `callout--week` body *(week_after narrative)*: ≤ 60 words *(present tense, 2–3 sentences)*
- `risks`: 1–3 items, each `{risk, mitigation}` ≤ 18 words combined
- `verif` checklist: 4–6 items, each ≤ 12 words

### Page 09 · Closing
- `closing-headline`: ≤ 12 words
- Compounding Moat chart caption: ≤ 30 words *(see § Compounding Moat in the Page 09 render block)*
- Future-state narrative paragraphs: 2 paragraphs, ≤ 50 words each *(present tense, "your week looks like…")*
- Body paragraph beneath: ≤ 70 words

The Compounding Moat SVG itself doesn't count toward word budget — but it must fit within ~250mm of vertical A4 space alongside the closing-headline + narrative + body. If the SVG renders too tall *(>180px in the chart space)*, drop the legend or reduce the `viewBox` height.

### General rules

- One paragraph per box. Prose, not bullet-essays. If a card needs structure, use the existing helpers *(callout, verif list, replace-card.row-meta)* — don't invent new layouts inside a card.
- If the brain doesn't support filling a budget, **render shorter** rather than padding. Empty headroom is fine; spillover is not.
- Progress-footer line — never more than ~70 chars including the percentage.
- If you find yourself wanting more space, that's a signal to split content across pages, not stretch a card.

These budgets sit deliberately under what the A4 page can hold, leaving margin for line-wrap variability across system fonts.
