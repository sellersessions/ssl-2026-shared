# Template placeholder reference

Every `{{placeholder}}` consumed by the templates. This is the contract between Florence (who substitutes values) and the templates (which render them). When the contract changes, update both ends — and the matching skill that builds the substitution map.

How the substitution works: Florence reads the template, replaces every `{{token}}` with the right value or HTML snippet, writes the result to disk with the `Write` tool, then calls `create_artifact` / `update_artifact` per the protocol in `0-paste-this-into-custom-instructions.txt` § *Artifact emission*.

### Strip the leading "Quick reference" comment

Each template starts with a multi-line `<!-- TEMPLATE — substitute {{placeholders}} ... -->` block that documents the placeholder contract for humans editing the template. **Strip that comment before substitution** — otherwise tokens listed inside the comment (e.g. `{{health-required-rows}}`, `{{page-N-body-html}}`) get expanded into the comment too, duplicating multi-line HTML invisibly inside view-source. The duplicate is invisible in the rendered artifact, but it bloats the file and makes debugging harder.

The block to strip starts after the `<body>` tag and ends with `-->`. Drop everything between (and including) the opening `<!--` and the matching `-->`. Substitute placeholders in the remainder.

---

## `cockpit.html` placeholders

Single artifact id `florence-cockpit`. Single stable path `./florence-cockpit.html`. **Five pages** selected by which `{{tab-X-active}}` token gets `"active"` — Ideas / Brand / Projects / Resources / About. Onboarding nests inside Brand → Setup sub-section (collapses at stage 5). Health-view content rolls into About.

### Always required

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{eyebrow}}` | string | `Brand info` / `Projects` / `Ideas` / `Resources` / `About` | Page-specific top-left subtitle |
| `{{title}}` | string | `Florence is ready` / `Lumen Sleep — 3 ASINs` / `Setting up` / `2 projects · 1 running` | Page-specific top-left H1 |
| `{{stage-num}}` | string | `5/5` / `2` / `4 ideas` | Page-specific top-right (free-form, was integer-only previously) |
| `{{stage-label}}` | string | `Ready` / `running` / `Brand info` | Page-specific caption |
| `{{progress-pct}}` | integer 0-100 | `100` | Footer bar fill — keep meaningful per page (e.g. onboarding %, project completion ratio, or 100 if nothing meaningful) |
| `{{footer-msg-html}}` | inline HTML | `Stage 5 of 5 — <em>Florence is ready</em>` | Footer message |

### Tab-active tokens — exactly ONE should be `"active"`

| Token | When set |
|---|---|
| `{{tab-ideas-active}}` | When the user just captured an idea, or asked to view Ideas |
| `{{tab-brand-active}}` | First message / onboarding / `restore-brain` / when user asks about brand |
| `{{tab-projects-active}}` | After any CRO skill run (`optimize-listing`, `render`, `pinion`, `track-products`) |
| `{{tab-resources-active}}` | When user asks for resources / pins / unpins |
| `{{tab-about-active}}` | `setup-validate`, version check, integrations health |

### Tab counters

Render the integer count inline on each tab. Use `0` (not blank) when empty.

| Token | Source |
|---|---|
| `{{tab-ideas-count}}` | `brain.ideas.length` |
| `{{tab-projects-count}}` | `brain.projects.length` |
| `{{tab-resources-count}}` | `brain.resources_pinned.length + reference/ default file count` |

(`{{tab-brand-count}}` and `{{tab-about-count}}` not rendered — these tabs are static.)

### Section-body tokens — fill the active section, lock-stubs for the rest

| Token | Type | Notes |
|---|---|---|
| `{{section-ideas-html}}` | HTML | One `<div class="idea-row status-X">` per `brain.ideas[]` entry, OR empty-state |
| `{{section-brand-html}}` | HTML | Brand summary header + Setup sub-section (onboarding pages OR collapsed stub) + Voice + Brand guidelines + Personnel + Products grid |
| `{{section-projects-html}}` | HTML | One `<div class="project-row status-X">` per `brain.projects[]` entry, OR empty-state |
| `{{section-resources-html}}` | HTML | One `<div class="resource-row">` per pinned + default reference file, OR empty-state |
| `{{section-about-html}}` | HTML | About summary + stat grid + integrations health rows |

Sections that aren't active still need their HTML substituted — even if rendered with `display: none` via the tab class. Florence builds the full substitution map every emission so when the user navigates between tabs (visually), every page has content.

### Single idea row HTML

```html
<div class="idea-row status-{{status}}">
  <div class="idea-head">
    <div class="idea-title">{{title}}</div>
    <div class="idea-meta">{{created-at-pretty}}</div>
  </div>
  <div class="idea-notes">{{notes-or-empty}}</div>
  <div class="idea-tags">
    <span class="badge status-{{status}}">{{status}}</span>
    <span class="badge asin">{{linked-asin}}</span>
    <span class="badge source">{{source}}</span>
  </div>
</div>
```

`{{status}}` is `captured` / `tested` / `shipped` / `parked`. Omit the `<span class="badge asin">` if `linked_asin` is null. Omit `<span class="badge source">` if `source` is null.

### Single project row HTML

```html
<div class="project-row status-{{status}}">
  <div class="project-head">
    <div class="project-name">{{name}}</div>
    <div class="project-when">{{updated-at-pretty}}</div>
  </div>
  <div class="project-purpose">{{purpose}}</div>
  <div class="project-tags">
    <span class="badge status-{{status}}">{{status}}</span>
    <span class="badge asin">{{asin-or-empty}}</span>
  </div>
  <div class="project-artifacts">
    <!-- repeat per linked artifact -->
    <span class="artifact-pill"><span class="kind">{{kind}}</span>{{artifact-id}}</span>
  </div>
  <div class="project-next">
    <div class="lbl">Next</div>
    {{next-steps}}
  </div>
</div>
```

`{{status}}` is `running` / `complete` / `blocked` / `parked`. `{{kind}}` is `research` / `concepts` / `tests` / `dossier`. Omit the `.project-artifacts` block if `linked_artifacts` is empty. Omit the `.project-next` block if `next_steps` is null.

### Single resource row HTML

```html
<div class="resource-row {{pinned-class}}">
  <div class="resource-icon">{{icon}}</div>
  <div class="resource-meta">
    <div class="resource-path">{{path}}</div>
    <div class="resource-note">{{note-or-empty}}</div>
  </div>
  <div class="resource-pin-state">{{pin-state-or-empty}}</div>
</div>
```

`{{pinned-class}}` is `"pinned"` if user-pinned, else `""`. `{{icon}}` is a 2-3 char folder code (`02-VC` for visual-content, `04-DA` for data-analysis, etc.). `{{pin-state-or-empty}}` is `"PINNED"` for pinned items, blank for the default catalog.

### Brand section HTML pattern

The Brand section is the most structured. Florence builds it from these pieces:

```html
<!-- Brand summary header -->
<div class="card">
  <ul>
    <li class="kv"><span class="k">Brand</span><span class="v">{{brand}}</span></li>
    <li class="kv"><span class="k">Marketplaces</span><span class="v">{{marketplaces-csv}}</span></li>
  </ul>
</div>

<!-- Setup sub-section: either onboarding pages OR collapsed stub -->
<div class="subhead">Setup <span class="counter">{{setup-stage}}/8</span></div>
{{setup-body-html}}
<!-- ↑ either the full <div class="page">…</div> stack (onboarding in flight) -->
<!-- ↑ or <div class="setup-collapsed">Setup complete · {{stage-num}}/8 <span class="pill">done</span></div> (stage 8 reached) -->

<!-- MCP status sub-section (added in v0.1.8) — 4 rows showing wiring state for ProductPinion / Higgsfield / SellerApp / n8n -->
<div class="subhead">MCPs <span class="counter">{{mcp-greens-count}}/4</span></div>
<div class="check-section">
  <div class="check"><div class="dot {{pp-status-class}}"></div><div class="check-name">ProductPinion</div><span class="check-msg">{{pp-status-msg}}</span><span class="fix">{{pp-fix-or-empty}}</span></div>
  <div class="check"><div class="dot {{higgsfield-status-class}}"></div><div class="check-name">Higgsfield</div><span class="check-msg">{{higgsfield-status-msg}}</span><span class="fix">{{higgsfield-fix-or-empty}}</span></div>
  <div class="check"><div class="dot {{sellerapp-status-class}}"></div><div class="check-name">SellerApp (via n8n)</div><span class="check-msg">{{sellerapp-status-msg}}</span><span class="fix">{{sellerapp-fix-or-empty}}</span></div>
  <div class="check"><div class="dot {{n8n-status-class}}"></div><div class="check-name">n8n webhooks (Shopper Interrogator)</div><span class="check-msg">{{n8n-status-msg}}</span><span class="fix">{{n8n-fix-or-empty}}</span></div>
</div>

<!-- Voice + Brand guidelines + Personnel + Products grid sub-sections, each a .subhead + .card or .product-grid -->
<div class="subhead">Voice</div>
<div class="card">{{voice-html}}</div>

<div class="subhead">Brand guidelines</div>
<div class="card">{{brand-guidelines-html}}</div>

<div class="subhead">Personnel</div>
<div class="card">{{personnel-html}}</div>

<div class="subhead">Products</div>
<div class="product-grid">{{products-grid-html}}</div>
```

The skill that builds the substitution (`skills/onboard.md`, `skills/restore-brain.md`, `skills/track-products.md`) carries the exact HTML for each sub-section.

### Setup sub-section — full onboarding pages (when stage < 5)

When onboarding is in-flight, `{{setup-body-html}}` renders the existing onboarding stage stack — same `.page` cards as before, with stage gates locking pages above the current stage. Per-page tokens are derived locally inside this sub-section (not at the top-level of the cockpit anymore):

```html
<div class="page {{page-N-class}}">
  <div class="page-head">
    <div class="page-num">Stage N <span class="badge {{page-N-badge-class}}">{{page-N-badge-label}}</span></div>
    <div class="page-title">{{page-N-title}}</div>
  </div>
  {{page-N-body-html}}
</div>
```

Stage gates are unchanged from v0.1.5: 0 Welcome / 1 Business / 2 Team / 3 Products+Competitors / 4 Voice+Goals / 5 Ready. Locked-stub uses the same `<div class="page-body"><div class="lock-msg">Fills in after {{after-condition}}.</div></div>` pattern.

### Setup sub-section — collapsed stub (when stage = 5 reached)

```html
<div class="setup-collapsed">
  <span><strong>Setup complete</strong> — onboarding done</span>
  <span class="pill">5/5 done</span>
</div>
```

### About section HTML pattern

```html
<div class="about-summary {{health-summary-class}}">
  {{health-summary-html}}
</div>

<div class="about-stat-grid">
  <div class="about-stat"><div class="k">Version</div><div class="v">{{version}}</div></div>
  <div class="about-stat"><div class="k">Build</div><div class="v">{{build-name}}</div></div>
  <div class="about-stat"><div class="k">SellerApp</div><div class="v">{{sellerapp-tools-count}} tools</div></div>
  <div class="about-stat"><div class="k">ProductPinion</div><div class="v">{{pp-status}}</div></div>
  <div class="about-stat"><div class="k">Higgsfield</div><div class="v">{{higgsfield-status}}</div></div>
  <div class="about-stat"><div class="k">Last sync</div><div class="v">{{last-sync}}</div></div>
</div>

<div class="check-section">
  <div class="check-label">Required checks</div>
  {{health-required-rows}}
</div>

<div class="check-section">
  <div class="check-label">Optional integrations</div>
  {{health-optional-rows}}
</div>
```

`{{health-summary-class}}` is `ready` / `degraded` / `broken`. The integrations check rows use the same pattern as v0.1.5 health view:

```html
<div class="check">
  <div class="dot {{status-class}}"></div>
  <div class="check-name">{{name}}</div>
  <span class="check-msg">{{message}}</span>
  <span class="fix">{{fix-label}}</span>
</div>
```

`{{status-class}}` is `green` / `yellow` / `red`. Omit `<span class="fix">` if no fix is suggested.

### Empty-state HTML

For sections with no entries, substitute the matching empty block instead of leaving the section blank:

```html
<!-- section-ideas-html when empty -->
<div class="empty-block">No ideas captured yet. Type <code>idea &lt;text&gt;</code> to log a hypothesis or thing to try.</div>

<!-- section-projects-html when empty -->
<div class="empty-block">No projects yet. Run <code>optimize-listing</code>, <code>render</code>, or <code>pinion</code> on an ASIN — Florence creates a project entry automatically.</div>

<!-- section-resources-html when empty -->
<div class="empty-block">No resources pinned. Reference library is at <code>reference/</code>; pin items with <code>pin &lt;path&gt;</code>.</div>
```

### Backward-compat aliases (still set by older skill emissions)

Older skill files may still set `{{view-onboard-active}}` and `{{view-health-active}}`. Florence's substitution map should treat these as aliases:

| Legacy token | Maps to |
|---|---|
| `{{view-onboard-active}} = "active"` | `{{tab-brand-active}} = "active"` (and Setup sub-section unfolded) |
| `{{view-health-active}} = "active"` | `{{tab-about-active}} = "active"` |

Skills updated in v0.1.6 emit the new tokens directly; this alias map is the safety net for any skill that wasn't updated.

---

## `welcome.html` placeholders

Single artifact id `florence-welcome`. Stable path `./florence-welcome.html`. **Single emission per conversation** at the start of `onboard` (before the cockpit). Acts as a one-page intro to Florence — hero + thesis + how + skills grid + workshop attribution + CTA. Florence does NOT update this artifact during onboarding; it stays in the right panel as a permanent reference.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{version}}` | string | `0.1.9-welcome-artifact` | Florence's current version string from `0-paste-this-into-custom-instructions.txt` line 3 |
| `{{install-time}}` | string | `22 minutes` (or `~22 min`) | Rough total `onboard` duration; matches Custom Instructions § MCP wiring footer |

That's it — only two placeholders. All other content is static prose written into the template. The template renders identically across every emission; Florence just substitutes the version string and the install-time estimate.

### Why so few placeholders

The welcome artifact is a **brand introduction**, not a state surface. It doesn't reflect brain state (the cockpit does that). It doesn't show product data (the dossier does). Its job is to land the pitch + show example skills + invite the user to type `ready`. Static content keeps the substitution simple and removes a class of "what state goes where" bugs.

If a future v0.2.X build wants to personalise the welcome (e.g. *"Hi Lisa — Florence v0.1.9. ~22 min from here."*), add `{{first-name}}` from `brain.personnel[0].name` here. Until then: stay generic.

---

## `today.html` placeholders

Single artifact id `florence-today`. Single stable path `./florence-today.html`. Daily lifecycle — fresh emission each morning when `today` runs.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{weekday}}` | string | `Tuesday` | |
| `{{who}}` | string | `Tom` or `friend` | First name from brain.personnel[0] or fallback |
| `{{action-count}}` | integer | `3` | Header pill count |
| `{{action-lbl}}` | string | `Things to decide` (or `Thing to decide` for 1) | Pluralized |
| `{{lede-html}}` | inline HTML | `Sales held flat. <strong>Eucalyptus B07X is the one to look at.</strong>` | One-paragraph opener; `<strong>`, `<em>` welcome |
| `{{actions-count}}` | integer or string | `3` or `—` | Section counter |
| `{{actions-html}}` | HTML | One `<div class="action priority-…">…</div>` per action, OR empty-state | See action row below |
| `{{signals-count}}` | string | `2 ASINs` or `—` | Section counter |
| `{{signals-html}}` | HTML | One `<div class="sig">…</div>` per ASIN, OR empty-state | See signal card below |
| `{{noticed-html}}` | HTML | One `<div class="note">…</div>` per item, OR empty-state | |
| `{{footer-msg-html}}` | inline HTML | `Florence is handling <em>4</em> things autonomously today.` | |
| `{{generated-at}}` | string | `Tue 5 May · 06:42` or `Not yet generated` | Footer timestamp |

### Single action row HTML

```html
<div class="action priority-{{priority}}">
  <div class="action-num">{{num-padded}}</div>
  <div class="action-body">
    <div class="what">{{what}}</div>
    <div class="why">{{why}}</div>
  </div>
  <div class="action-tags">
    <span class="tag {{priority}}">{{priority-label}}</span>
    <span class="tag asin">{{asin}}</span>
    <span class="tag owner">{{owner}}</span>
  </div>
</div>
```

`{{priority}}` is `high` / `med` / `low`. `{{priority-label}}` is `High` / `Med` / `Low`. Omit tag spans for absent values.

### Single signal card HTML

```html
<div class="sig">
  <div class="top">
    <div>
      <div class="asin">{{asin}}</div>
      <div class="name">{{name}}</div>
    </div>
  </div>
  <div class="sig-rows">
    <div class="sig-row">
      <span class="k">{{row-key}}</span>
      <span class="v {{dir-class}}">{{value}}<span class="delta">{{delta}}</span></span>
    </div>
    <!-- repeat per row -->
  </div>
</div>
```

`{{dir-class}}` is `up` / `down` / `""` (flat). Omit `<span class="delta">` if no delta.

### Empty-state placeholders

When a section has no content, fill the slot with the matching empty-state HTML rather than leaving blank:

```html
<!-- actions-html when empty -->
<div class="empty-block">No actions queued yet. Florence drops items here only when something needs your judgment.</div>

<!-- signals-html when empty -->
<div class="empty-block" style="grid-column: 1 / -1;">No ASINs tracked yet. Run <span style="font-family: var(--mono); color: var(--ink);">onboard</span> to add products.</div>

<!-- noticed-html when empty -->
<div class="empty-block">Florence will surface anomalies (BSR moves, listing changes, review spikes) here once she has data.</div>
```

---

## `research.html` placeholders

Per-product artifact id `florence-research-{asin}` (e.g. `florence-research-B07XYZ4231`). Stable path `./florence-research-{asin}.html`. One artifact per product the user has researched. Emitted by `optimize-listing`, `asin-deep-research`, `review-mining`, `competitor-sweep`, `rufus-gap-analysis`, `listing-quality-audit`. Updated on every re-run for the same ASIN.

The 5 sections map directly to `reference/01-research/building-research-brief.md` — customer / drivers / objections / competitive landscape / what visuals must show.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{brand}}` | string | `Lumen Sleep` | From `brain.business.brand` |
| `{{asin}}` | string | `B07XYZ4231` | The product the brief is for |
| `{{geo}}` | string | `uk` | SellerApp geo code |
| `{{product-title}}` | string | `Eucalyptus Cooling Sheets, Queen, White` | From cache/SellerApp |
| `{{product-image-url}}` | string | `https://m.media-amazon.com/...jpg` | Live main image |
| `{{action-count}}` | integer | `3` | Header pill count — number of recommended actions |
| `{{action-lbl}}` | string | `Recommended actions` (or singular) | Pluralized |
| `{{lede-html}}` | inline HTML | `Sales held flat. <strong>The fix is the main image — three reviews this month flag "doesn't look like the photo."</strong>` | One-paragraph diagnosis; `<strong>`, `<em>` welcome |
| `{{customer-html}}` | HTML | `<p>Primary buyer: women 35-55…</p>` | Free-form paragraphs about who buys this |
| `{{drivers-html}}` | HTML | One `<div class="driver high|med|low">…</div>` per driver, OR empty-state | Top 3-5 reasons people buy |
| `{{drivers-count}}` | integer or `—` | `4` | |
| `{{objections-html}}` | HTML | One `<div class="objection high|med|low">…</div>` per objection, OR empty-state | Top 3-5 reasons people don't buy |
| `{{objections-count}}` | integer or `—` | `3` | |
| `{{competitors-html}}` | HTML | `<div class="competitor">…</div>` cards in a grid, OR empty-state | Top SERP competitors with stats |
| `{{competitors-count}}` | integer or `—` | `5` | |
| `{{must-show-html}}` | HTML | Numbered `<div class="must-row">` items, OR empty-state | What every concept must demonstrate |
| `{{must-show-count}}` | integer or `—` | `3` | |
| `{{footer-msg-html}}` | inline HTML | `<strong>What I'd do today:</strong> rerun main image with the no-grease angle. <em>Score 87/100.</em>` | Closing voice line — always include "What I'd do today:" + score |
| `{{generated-at}}` | string | `Tue 5 May · 14:22` | |
| `{{sources}}` | string | `Reviews · Rufus · SERP · KW Research V2` | Data sources hit; informs trust |

### Single driver row HTML

```html
<div class="driver {{intensity}}">
  <div class="drv-head">
    <div class="drv-name">{{name}}</div>
    <div class="drv-freq">{{frequency}}</div>
  </div>
  <p class="drv-quote-context">{{context}}</p>
  <blockquote class="quote">
    {{quote-text}}
    <div class="quote-source">{{source}}</div>
  </blockquote>
</div>
```

`{{intensity}}` is `high` / `med` / `low`. `{{frequency}}` is e.g. `42% of reviews · KW vol 18k/mo`.

### Single objection row HTML

```html
<div class="objection {{intensity}}">
  <div class="obj-head">
    <div class="obj-name">{{name}}</div>
    <div class="obj-freq">{{frequency}}</div>
  </div>
  <blockquote class="quote">
    {{quote-text}}
    <div class="quote-source">{{source}}</div>
  </blockquote>
</div>
```

### Single competitor card HTML

```html
<div class="competitor">
  <div class="casin">{{competitor-asin}}</div>
  <div class="ctitle">{{competitor-title}}</div>
  <div class="crows">
    <div class="crow"><span class="k">Price</span><span class="v">{{price}}</span></div>
    <div class="crow"><span class="k">BSR</span><span class="v">{{bsr}}</span></div>
    <div class="crow"><span class="k">Rating</span><span class="v">{{rating}} · {{review-count}}</span></div>
  </div>
</div>
```

### Single must-show row HTML

```html
<div class="must-row">
  <div class="must-num">{{num-padded}}</div>
  <div class="must-body">
    <div class="what">{{what}}</div>
    <div class="why">{{why}}</div>
    <div class="source">{{source-citation}}</div>
  </div>
</div>
```

`{{source-citation}}` is e.g. `From objection #1 + Rufus Q "is it stain-resistant?"`.

### Empty-state placeholders

When a section has no content, fill with:

```html
<div class="empty-block">No competitors fetched yet. Run competitor-sweep to populate.</div>
```

---

## `concepts.html` placeholders

Per-product artifact id `florence-concepts-{asin}`. Stable path `./florence-concepts-{asin}.html`. Emitted by `render`, `main-image-concepts`, `main-image-pipeline`, `lifestyle-stack-generator`, `infographic-builder`, `aplus-module-generator`. Each emission can append new slot sections or replace the artifact entirely (Florence decides — typically: replace when re-rendering the same slot, append when adding a new slot).

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{brand}}` | string | `Lumen Sleep` | |
| `{{asin}}` | string | `B07XYZ4231` | |
| `{{geo}}` | string | `uk` | |
| `{{product-title}}` | string | `Eucalyptus Cooling Sheets…` | |
| `{{product-image-url}}` | string | URL | The reference image passed to the image model |
| `{{model}}` | string | `Higgsfield Soul` / `Flux Kontext` / `Nano Banana Pro` | Image model used |
| `{{concept-count}}` | integer | `5` | Total concepts across all slots |
| `{{concept-lbl}}` | string | `Concepts` / `Concept` | |
| `{{slots-html}}` | HTML | One `<section class="slot-section">` per slot (Main / Listing 2 / Listing 3 / A+ Module 1 / etc.), each containing a slot-meta header + `<div class="grid">` of concept cards | See slot section + concept card HTML below |
| `{{footer-msg-html}}` | inline HTML | `<strong>Top pick:</strong> #3 Swing Tag · score 91. <em>Send to pinion.</em>` | |
| `{{generated-at}}` | string | `Tue 5 May · 16:48` | |

### Single slot section HTML

```html
<section class="slot-section">
  <div class="h2">{{slot-name}} <span class="counter">{{slot-concept-count}}</span></div>
  <div class="slot-meta">
    <strong>{{slot-name}}</strong> — {{slot-purpose}}
    <span class="aspect">{{aspect-ratio}}</span>
  </div>
  <div class="grid">
    <!-- repeat per concept -->
  </div>
</section>
```

`{{slot-name}}` is e.g. `Main image (slot 1)` / `Listing slot 2 — lifestyle` / `A+ Module 1 — hero benefit`. `{{aspect-ratio}}` is `1:1` (main + listing) or `16:9` (A+ / video). PR-D enforces these.

### Single concept card HTML

```html
<div class="concept">
  <img class="concept-img {{aspect-class}}" src="{{image-src}}" alt="{{concept-name}}" />
  <div class="concept-body">
    <div class="technique-row">
      <span class="concept-num">#{{num}}</span>
      <span class="badge technique">{{technique}}</span>
      <span class="badge score-{{score-tier}}">Score {{score}}</span>
      <span class="badge attempt">Attempt {{attempt-num}}</span>
    </div>
    <div class="scores">
      <span class="sk">Aspect ratio</span><span class="sv {{ar-class}}">{{ar-result}}</span>
      <span class="sk">Background</span><span class="sv {{bg-class}}">{{bg-result}}</span>
      <span class="sk">Product fidelity</span><span class="sv {{fid-class}}">{{fid-result}}</span>
      <span class="sk">Technique</span><span class="sv {{tech-class}}">{{tech-result}}</span>
      <span class="sk">Brand fit</span><span class="sv {{brand-class}}">{{brand-result}}</span>
    </div>
    <div class="citation">
      {{citation-text}}
      <span class="src">{{citation-source}}</span>
    </div>
    <details class="prompt">
      <summary>View prompt ({{prompt-word-count}} words)</summary>
      <div class="prompt-text">{{prompt-text}}</div>
    </details>
    <div class="send-cta">Type <code>pinion launch image split {{asin}} — current vs concept #{{num}}</code></div>
  </div>
</div>
```

`{{aspect-class}}` is `aspect-1-1` (default) or `aspect-16-9`. `{{score-tier}}` is `good` (≥80), `mid` (60–79), `low` (<60). The five `*-class` tokens in `.scores` are `pass` / `warn` / `fail`. PR-D defines the assessment rubric.

### `{{image-src}}` MUST be a base64 data URI (v0.1.13)

For every concept-card image, Florence **must NOT use a remote URL** (e.g. a Higgsfield CDN URL). Cowork's artifact iframe sandbox blocks external image loads in many builds, AND Higgsfield's signed URLs expire — both fail modes leave the artifact rendering blank slots where concepts should be.

Florence's render skills must:

1. **Fetch the generated image bytes** after Higgsfield returns the URL (HTTP GET on the URL).
2. **Detect the MIME type** from the response headers or file signature (typical: `image/png` or `image/jpeg`).
3. **Base64-encode the bytes**.
4. **Substitute** `{{image-src}}` = `data:image/png;base64,XXXXXXXX...` (the full encoded string, no truncation).

Example substituted HTML:
```html
<img class="concept-img aspect-1-1" src="data:image/png;base64,iVBORw0KGgoAAAA..." alt="Swing Tag concept" />
```

This makes the artifact **fully self-contained** — survives Cowork sandbox, survives Higgsfield URL expiry, downloads as a working HTML file. Yes the artifact gets large (each 2K×2K image is ~1-3MB base64); Cowork artifacts handle multi-MB HTML fine.

The same rule applies to `{{winner-image-src}}` in `tests.html` § Single test block HTML — winner images are typically Florence's own renders, so embed them base64.

The `{{product-image-url}}` in concepts.html's hero strip + dossier head + cockpit product-cards is **the LIVE Amazon CDN URL** (permanent, not generated by Florence) — that one stays as a URL. Only Florence-generated images need base64 embedding.

---

## `tests.html` placeholders

Per-product artifact id `florence-tests-{asin}`. Stable path `./florence-tests-{asin}.html`. Emitted by `pinion`, `shopper-interrogator`, all `cro-library/C-*` (test-design) skills. Re-emitted as tests run, complete, or new tests are queued.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{brand}}` | string | `Lumen Sleep` | |
| `{{asin}}` | string | `B07XYZ4231` | |
| `{{geo}}` | string | `uk` | |
| `{{product-title}}` | string | `Eucalyptus Cooling Sheets…` | |
| `{{test-count}}` | integer | `2` | Total tests in the artifact |
| `{{test-lbl}}` | string | `Tests` / `Test` | |
| `{{tests-html}}` | HTML | One `<div class="test">…</div>` per test | See test block HTML below |
| `{{footer-msg-html}}` | inline HTML | `<strong>What I'd do today:</strong> ship Concept #3. <em>Score 91/100.</em>` | |
| `{{generated-at}}` | string | `Wed 6 May · 09:14` | |

### Single test block HTML

```html
<div class="test">
  <div class="test-head">
    <div>
      <div class="test-name">{{test-name}}</div>
    </div>
    <div class="test-tags">
      <span class="badge kind">{{test-kind}}</span>
      <span class="badge status-{{status}}">{{status-label}}</span>
    </div>
  </div>

  <div class="verdict">
    <div class="winner-card">
      <img class="winner-img {{aspect-class}}" src="{{winner-image-src}}" alt="{{winner-name}}" />
      <div class="winner-name">{{winner-name}}</div>
      <span class="winner-tag">Winner</span>
    </div>
    <div class="verdict-meta">
      <p class="verdict-headline">{{verdict-headline-html}}</p>
      <div class="verdict-stats">
        <div class="stat"><div class="lbl">Sample</div><div class="val">{{sample-size}}</div></div>
        <div class="stat"><div class="lbl">Confidence</div><div class="val">{{confidence}}</div></div>
        <div class="stat"><div class="lbl">Lift</div><div class="val {{lift-class}}">{{lift}}</div></div>
      </div>
    </div>
  </div>

  <div class="quotes">
    <!-- repeat per verbatim shopper quote -->
    <blockquote class="quote">
      {{quote-text}}
      <span class="src">{{quote-source}}</span>
    </blockquote>
  </div>

  <div class="recommendation">
    <div class="lead">Recommendation</div>
    <div class="body">{{recommendation-html}}</div>
    <div class="score">Score {{score}}/100 · 40/30/15/15: {{score-breakdown}}</div>
  </div>
</div>
```

`{{test-kind}}` is e.g. `Image split` / `Title test` / `Open-ended`. `{{status}}` is `running` / `complete` / `error`. `{{aspect-class}}` is `aspect-1-1` or `aspect-16-9`. `{{lift-class}}` is `up` / `down` / `""`.

---

## `dossier.html` placeholders

Per-product artifact id `florence-product-dossier-{asin}`. Stable path `./florence-product-dossier-{asin}.html`. The top-level "everything I know about this product" surface — links to research / concepts / tests artifacts plus a recent-activity timeline. Emitted by any skill that touches the product after a meaningful change (and refreshed on demand via `/dossier <asin>`).

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{brand}}` | string | `Lumen Sleep` | |
| `{{asin}}` | string | `B07XYZ4231` | |
| `{{geo}}` | string | `uk` | |
| `{{product-title}}` | string | `Eucalyptus Cooling Sheets…` | |
| `{{product-image-url}}` | string | URL | |
| `{{stats-html}}` | HTML | 3-5 `<div class="head-stat">` rows | Price / BSR / Rating / Reviews |
| `{{goal-html}}` | HTML | `<strong>Lift CVR</strong> from 8% to 11%` | From `brain.goals[asin]`, or empty-state |
| `{{research-link-html}}` | HTML | `<div class="link">…</div>` (filled or empty) | See link card below |
| `{{concepts-link-html}}` | HTML | same | |
| `{{tests-link-html}}` | HTML | same | |
| `{{timeline-html}}` | HTML | One `<div class="event">…</div>` per recent event, OR empty-state | Last 8-10 events for this product |
| `{{footer-msg-html}}` | inline HTML | `<strong>Latest:</strong> 5 concepts ready · <em>send to test</em>.` | |
| `{{generated-at}}` | string | `Wed 6 May · 11:02` | |

### Single link card HTML (filled)

```html
<div class="link">
  <div class="link-eyebrow">Research</div>
  <div class="link-title">Research brief — {{generated-at}}</div>
  <div class="link-summary">{{summary}}</div>
  <div class="link-meta">{{counts}}</div>
  <div class="link-cta">Open <code>florence-research-{{asin}}</code> in the right panel</div>
</div>
```

### Single link card HTML (empty stub)

```html
<div class="link empty">
  <div class="link-eyebrow">Research</div>
  <div class="link-title">No research yet</div>
  <div class="link-summary">Run <code>optimize-listing {{asin}}</code> to start.</div>
</div>
```

### Single timeline event HTML

```html
<div class="event">
  <div class="when">{{when}}</div>
  <div class="what"><strong>{{action}}</strong> · {{detail}}</div>
</div>
```

`{{when}}` is e.g. `5 May 16:48`. `{{action}}` is e.g. `Concepts emitted` / `Pinion test launched` / `Research updated`.

### Single head-stat HTML

```html
<div class="head-stat">
  <span class="k">{{key}}</span>
  <span class="v">{{value}}</span>
</div>
```

---

## `test-log.html` placeholders

Single artifact id `florence-test-log`. Stable path `./florence-test-log.html`. **One artifact per conversation, accumulating entries across the session.** Emitted by `skills/test-log.md` on every `log` / `feedback` call (and on `log download` for export). Florence keeps the running entries array in working memory.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{tester-name}}` | string | `Tom` / `tester` | From `brain.personnel[0].name` or fallback |
| `{{session-id}}` | string | `2026-05-08-cold-install` | Auto-generated label, locked once set, reused for every emission |
| `{{started-at}}` | string | `Thu 8 May · 14:22` | First entry's timestamp; locked once set |
| `{{updated-at}}` | string | `Thu 8 May · 16:48` | Newest entry's timestamp |
| `{{entry-count}}` | integer | `7` | Total |
| `{{entry-lbl}}` | string | `Entries` / `Entry` | Pluralised |
| `{{summary-counts}}` | string | `1 blocker · 3 bugs · 2 nits · 1 praise` | One line summary of severity counts |
| `{{lede-html}}` | inline HTML | `Add an entry: type <code>log &lt;note&gt;</code>. Download: type <code>log download</code> and click the artifact's download button.` | Instructions reminder; `<strong>`, `<em>`, `<code>` welcome |
| `{{entries-html}}` | HTML | One `<div class="entry severity-{X}">…</div>` per entry, chronological order | See entry HTML below |
| `{{footer-msg-html}}` | inline HTML | `<strong>Download me</strong> and DM the file. Every entry's repro context is captured.` | Closing voice line |
| `{{generated-at}}` | string | ISO 8601 | Footer timestamp |
| `{{version}}` | string | `0.1.5-test-onboarding` | Florence build version |

### Single entry HTML

```html
<div class="entry severity-{{severity}}">
  <div class="entry-head">
    <span class="entry-num">#{{num}}</span>
    <div class="entry-tags">
      <span class="badge severity-{{severity}}">{{severity}}</span>
      <span class="badge skill">{{skill}}</span>
      <span class="badge artifact">{{artifact}}</span>
      <span class="badge asin">{{asin}}</span>
    </div>
    <span class="entry-when">{{timestamp}}</span>
  </div>
  <div class="entry-body">
    <div class="what">
      <div class="lbl">What Florence did</div>
      <div class="body">{{what-florence-did}}</div>
    </div>
    <blockquote class="feedback">{{feedback}}</blockquote>
    <div class="repro">
      <span class="lbl">Repro</span>
      {{repro-text}}
    </div>
  </div>
</div>
```

`{{severity}}` is `blocker` / `bug` / `nit` / `praise`. Omit the `repro` block if no repro context exists. Omit the `asin` badge if no ASIN was touched. Severity badge always appears.

---

## `image-strategy.html` placeholders

Single artifact id `florence-image-strategy`. Stable path `./florence-image-strategy.html`. **Single artifact per brand**, populated by `skills/image-strategy.md`. Re-run via `image-strategy --refresh` supersedes (calls `update_artifact`); first run calls `create_artifact`.

| Token | Type | Example | Notes |
|---|---|---|---|
| `{{brand}}` | string | `Lumen Sleep` | From `brain.business.brand` |
| `{{category}}` | string | `Supplements` | From `brain.business.category` (set by `image-strategy` if missing) |
| `{{main-keyword}}` | string | `ashwagandha capsules` | The keyword used to pull bestsellers |
| `{{geo}}` | string | `uk` | Marketplace |
| `{{competitors-analysed-count}}` | integer | `15` | Top-N from SERP |
| `{{lede-html}}` | inline HTML | `<strong>Direction:</strong> warm-light lifestyle moments, contrarian to the 80% clinical-look saturation in this category. Bias toward editorial palette + ingredient-led type; avoid lab-coat hands.` | One-paragraph headline |
| `{{table-stakes-html}}` | HTML | `<li><span class="num">01</span><strong>White-bg studio main image.</strong> 14 of 15 winners use this — must-match.</li>` × N | List of category-saturated patterns |
| `{{differentiation-gaps-html}}` | HTML | `<li class="gap"><span class="num">01</span><strong>Warm-light human moment.</strong> 0 of 15 use this — full opportunity space.</li>` × N | Use `class="gap"` for the green left-border styling |
| `{{bets-by-surface-html}}` | HTML | One `<section class="surface-block">…</section>` per surface (main / listing / aplus). See block HTML below. | The directional bets grouped per surface |
| `{{prompt-adjustments-html}}` | HTML | 4 `<div class="adjustment">…</div>` cards — scene / palette / mood / anti-patterns. See card HTML below. | The concrete tokens render skills inject |
| `{{footer-msg-html}}` | inline HTML | `<strong>What I'd render today:</strong> warm morning lifestyle moment with sage-cream palette. <em>Bias hard against the clinical look 80% of competitors use.</em>` | Closing voice line |
| `{{last-updated}}` | string | `Thu 8 May · 22:48` | ISO 8601 from `brain.image_strategy.last_updated`, formatted human-friendly |

### Single surface block HTML

```html
<section class="surface-block">
  <div class="surface-head">
    <div class="surface-name">{{surface-label}}</div>
    <div class="surface-meta"><span class="ratio">{{N}}</span> bets</div>
  </div>
  <!-- repeat per bet for this surface -->
  <div class="bet">
    <div class="bet-desc">{{bet-description}}</div>
    <div class="bet-grid">
      <div class="bet-col">
        <span class="lbl bias">Bias toward</span>
        <ul class="bet-tags">
          <li class="bias">{{technique}}</li>
          <!-- repeat -->
        </ul>
      </div>
      <div class="bet-col">
        <span class="lbl avoid">Avoid</span>
        <ul class="bet-tags">
          <li class="avoid">{{technique}}</li>
          <!-- repeat -->
        </ul>
      </div>
    </div>
    <div class="bet-evidence"><strong>Evidence:</strong> {{evidence-text}}</div>
  </div>
</section>
```

`{{surface-label}}` is one of: `Main image (slot 1)`, `Listing slots 2–7`, `A+ modules`. If a surface has no bets, omit its `<section class="surface-block">` block entirely.

### Single adjustment card HTML

```html
<div class="adjustment">
  <div class="ad-lbl">{{adjustment-label}}</div>
  <div class="ad-meta">{{adjustment-meta}}</div>
  <div class="ad-tokens">
    <span>{{token-1}}</span><span>{{token-2}}</span>
    <!-- repeat per token -->
  </div>
</div>
```

For the anti-patterns card, use `<div class="adjustment avoid">` (the `.avoid` class swaps the chip styling to red-soft).

| `adjustment-label` | `adjustment-meta` | Source field |
|---|---|---|
| `Scene keywords` | `Injected into prompt section 1 — scene` | `prompt_adjustments.scene_keywords` |
| `Palette keywords` | `Injected into section 4 — palette` | `prompt_adjustments.palette_keywords` |
| `Mood keywords` | `Injected into section 4 — mood` | `prompt_adjustments.mood_keywords` |
| `Anti-patterns` (`avoid` variant) | `Excluded — "do NOT include {X}"` | `prompt_adjustments.anti_patterns` |

If a list is empty, render the card with a single `<span>` reading `(none captured)`.

---

## Brand-tab Image Strategy sub-section (added in v0.1.12)

Inside `cockpit.html`'s `{{section-brand-html}}` substitution, insert a new sub-section between the MCPs status grid and the Voice card:

```html
<div class="subhead">Image strategy <span class="counter">{{strategy-status}}</span></div>
{{image-strategy-html}}
```

`{{strategy-status}}` is `"set"` (green) / `"stale"` (yellow, last_updated > 90d ago) / `"not set"` (slate, when null).

`{{image-strategy-html}}`:

- **Strategy set** → `<div class="card"><strong>{{category}}</strong> · {{main-keyword}}<br><span style="color: var(--slate); font-size: 12.5px;">{{one-line-bet-summary}}</span><br><span style="font-family: var(--mono); font-size: 10.5px; color: var(--slate-2);">Refreshed {{last-updated}} · open <code>florence-image-strategy</code> for the full doc</span></div>`
- **Strategy null** → `<div class="empty-block">No image strategy set yet. Run <code>image-strategy</code> to scope your category before rendering. Florence's prompts will be generic until then.</div>`
- **Strategy stale** → `<div class="card" style="border-left: 3px solid var(--gold);"><strong>{{category}}</strong> · {{main-keyword}}<br><span style="color: var(--gold);">Stale ({{days-old}} days old).</span> Run <code>image-strategy --refresh</code>.</div>`

---

## `florence-brain.json` (the artifact `onboard` emits)

Single artifact id `florence-brain`. Single stable path `./florence-brain.json`. Schema lives in `brain-schema.json` (JSON Schema draft-07, `schema_version` locked at `1.0`).

Top-level shape:

```json
{
  "schema_version": "1.0",
  "business":     {...},
  "products":     [...],
  "competitors":  {...},
  "voice":        {...},
  "goals":        {...},
  "personnel":    [...],
  "integrations": {...},
  "history":      {...}
}
```

Validation is enforced in `skills/restore-brain.md`. Bumping `schema_version` requires a documented migration in that skill. Backward compatibility within a major version is non-negotiable.

This isn't a templated file in the same way as the HTML — Florence writes the full JSON structure directly, then calls `create_artifact` (first time in the conversation) or `update_artifact`.

---

## When the contract changes

1. Update the affected template's HTML.
2. Update the matching tables in this file.
3. Update the skill that builds the substitution map.
4. Update the `## Artifact emission` section in `0-paste-this-into-custom-instructions.txt` if the artifact-level shape changes (e.g. new id, new path).
5. If `brain-schema.json` changed: bump `schema_version` and add a migration to `skills/restore-brain.md`.

The contract is the source of truth. Skills that violate it are the bug.
