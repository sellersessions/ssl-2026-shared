---
project: claude-ui-workflow
run: dogfood-cycle-1
brand: retechuk
url: https://retechuk.com/
output_type: landing
landing_archetype: brand-homepage
started: 2026-04-25
status: in-progress
purpose: Cycle 1 of 3. Run the workflow end-to-end on a fresh brand. Log every failure, every awkward handoff, every place a non-designer would bounce. Fix all findings as a batch (cycle 2 prep). Re-run on a new brand (cycle 2). By cycle 3 the workflow should be tight.
---

# Friction Log — Re Tech UK end-to-end run

> Living document. Each finding gets a rank, a pipeline location, evidence,
> and a proposed fix. New findings appended as the run continues. At end
> of stage 10 this becomes the B9/B10 spec input.

---

## Findings rubric

| Rank | Meaning |
|---|---|
| 🔴 **blocker** | The workflow produced a wrong answer or could not produce one. Must fix before cycle 2. |
| 🟠 **major** | The workflow worked but a non-designer would bounce. Should fix before cycle 2. |
| 🟡 **minor** | Awkward but survivable. Fix if cheap. |

---

## #1 — URL given before /intake; intake doesn't acknowledge it

- **Stage:** 1 (INTAKE) — entry point
- **Rank:** 🟡 minor
- **Evidence:** the operator dropped `https://retechuk.com/` into chat. Intake skill went straight to "what are you making?" with no acknowledgement of the URL. Reads as "did you see the link?"
- **Proposed fix:** Intake skill opens with: *"Got the URL — I'll ingest it after the interview. First, six quick questions on intent."* Pure UX text change to `intake/SKILL.md`.

## #2 — Slug resolution has no "new brand from URL" branch

- **Stage:** 1 (INTAKE) — slug resolution
- **Rank:** 🟡 minor
- **Evidence:** Skill spec covers "existing slug" or `adhoc-<date>-<short-name>`. Re Tech UK is neither — it's a *new* brand. No clean path. Resolved manually as `retechuk` (hostname sans TLD).
- **Proposed fix:** Add third branch to `intake/SKILL.md` slug-resolution rules: **"new brand from URL → slug = hostname-without-tld, lowercased, hyphens for dots."** Auto-create `brands/<slug>/` folder.

## #3 — Audience pre-pass missing; user articulates from cold

- **Stage:** 1 (INTAKE) — Q2 (Audience)
- **Rank:** 🟠 major
- **Evidence:** For a *redesign*, audience signals already sit on the existing page (h1, h2, meta description, About copy). The intake skill demands the user articulate audience from scratch. A non-designer running this fresh would stall here.
- **Proposed fix:** **Optional URL pre-pass before Q2-Q5.** WebFetch the URL → read meta/h1/h2/about/footer copy → propose `audience.who` + `audience.pain` + `offer.what` + `offer.value_prop` for the user to confirm/override. Schema gets a `proposed_from_url` source value alongside `intake-skill` and `free-text`. Probably a B9-or-B3.5 sized addition.
- **Bonus learning:** WebFetch alone was sufficient for retechuk.com (static HTML carried the signal). No need for ExtractFlow's headless tier on standard ecom (Shopify-shaped) sites. Heavier rendering only needed for SPAs. Keeps the pre-pass cheap.

## #4 — Brand-name vs brand-content mismatch (the "Re Tech UK" trap)

- **Stage:** 1 (INTAKE) — Q2 confirmed via scout
- **Rank:** 🔴 blocker (without the scout)
- **Evidence:** "Re Tech UK" — name strongly implies refurbished tech. Site is actually a women's clothing brand ("Everyday clothing for women"). Without the URL pre-pass (#3), the entire run would have built a tech-reseller landing page. The workflow has zero defence against this trap if intake runs blind.
- **Proposed fix:** This is the single best argument for #3 being a 🔴 blocker rather than 🟠 major. **The URL pre-pass is not optional — it is the primary guardrail against brand-name assumption traps.** Make it the default, with `--skip-scout` as the escape hatch for users who want pure intent-only intake.

## #5 — Offer schema doesn't fit ecommerce stores

- **Stage:** 1 (INTAKE) — Q3 (Offer)
- **Rank:** 🟠 major
- **Evidence:** `offer.what` + `offer.value_prop` schema fits single offers (event ticket, course, lead-magnet). Re Tech UK is a catalogue (50+ SKUs across knits, polos, cardigans, tees, kids). Shoehorning the catalogue into one `offer.what` value loses information.
- **Proposed fix:** Make `offer.format` (already optional in schema) **required** for `output_type: "landing"`. Values: `single-offer | ecommerce | service | saas | content`. /design picks layout patterns based on this — hero-around-product (ecommerce) vs hero-around-claim (single-offer) vs hero-around-feature (saas).

## #6 — `output_type: "landing"` collapses six different page archetypes (BIGGEST FINDING)

- **Stage:** 1 (INTAKE) — Q1 (Output type) — but the consequences cascade through all subsequent stages
- **Rank:** 🔴 blocker
- **Evidence:** the operator surfaced this. The `output_type` enum (`landing`/`infographic`/`lifestyle`/`ad`) treats "landing" as one shape. It isn't. At least six archetypes:

  | Archetype | Example | Q3 should ask… | Hero shape | Primary CTA shape |
  |---|---|---|---|---|
  | offer-landing | SSL 2026 ticket page | "What's the offer + price?" | Big claim + scarcity | Single conversion CTA |
  | brand-homepage | Re Tech UK | "Brand promise + hero categories?" | Brand voice + curated grid | Multi-CTA (Shop / Story / Reviews) |
  | product-detail | One polo SKU | "Which product + objections?" | Photography + spec | Add to basket |
  | category / collection | Light Knits page | "Which collection + filter shape?" | Filtered grid | Per-card CTAs |
  | about / story | "Our story" | "What's the narrative arc?" | Long-form prose | Soft CTA |
  | lead-magnet | Email capture | "What's the giveaway + email destination?" | Promise + form | Email submit |

  Intake Q3 ("What are you offering them?") assumes offer-landing. Design-db CSVs (`landing.csv`, `interaction-design.csv`) are tuned for marketing pages, not brand-homepages or PDPs. Re Tech UK is a brand-homepage and we just collided with it head-on.

- **Proposed fix:** Branch the schema:
  ```
  output_type: landing | infographic | lifestyle | ad
    └─ if landing:  landing_archetype: offer | brand-homepage | product-detail | category | about | lead-magnet
                    ↓
                    archetype-specific Q3..Q6 question set (intake skill)
                    archetype-specific CSV weighting (/design)
                    archetype-specific anti-patterns (refine audit)
  ```
  Without this branch, **the workflow can only ever produce offer-landings well**. Brand homepages get treated as "an offer with a fuzzy value prop." PDPs get treated as "an offer with one SKU." Both will look like AI-slop marketing pages. That is the *opposite* of the PRD goal. This finding alone justifies the cycle-2 fix wave.

- **Decision for cycle 1:** Shoehorn Re Tech UK's brand-homepage into the offer schema (path A). Capture downstream consequences as further findings. Do NOT pause and fix the schema mid-run — we don't yet know what *else* breaks because of this misalignment.

---

## #7 — Vibe schema captures one state, redesigns have two (current + target)

- **Stage:** 1 (INTAKE) — Q5 (Vibe)
- **Rank:** 🟠 major
- **Evidence:** For Re Tech UK, the *current* site vibe (read from scout) and the *target* redesign vibe are different. Current = "considered, minimal, friendly, empowering" (slightly masculine in execution per the operator). Target = "feminine, editorial, warm, considered." The schema only stores one. The DELTA between them is what /design needs to drive divergence — without it, /design either replicates the current site (preserve) or invents a target with no anchor (evolve-blind).
- **Proposed fix:** Add `vibe.current` (auto-populated from URL scout) and `vibe.target` (user-confirmed). For non-redesign flows, `vibe.current` is omitted and `vibe.target` is the only one /design reads. For redesigns, /design reads the delta as direction (e.g. "shift from grey-minimal to warm-editorial").

## #8 — Brand backstory has nowhere to live

- **Stage:** 1 (INTAKE) — covers all questions
- **Rank:** 🟠 major
- **Evidence:** the operator shared crucial context — *"two male friends own this, bounced through categories, now refocused on women's clothing only, no feminine input on the build."* This is gold for a redesign brief. None of it lands in `intake.json`. Future runs of /design or /refine lose it on context compaction.
- **Proposed fix:** Add `brand_context.history` (free-text) and `brand_context.notes` (free-text) to intake schema. Optional fields, but the intake interview should surface them as *"Anything I should know about how this brand got here? Founders, history, false starts?"* — placed after Q2 (Audience) since context shapes audience read.

## #9 — Screenshot ask happens too late in the pipeline

- **Stage:** 1 (URL received) → currently doesn't ask for screenshot until Stage 3 if Stage 2 confidence is low/medium
- **Rank:** 🟠 major (the operator surfaced)
- **Evidence:** When the URL is fresh in the user's mind, the cheapest moment to also ask for a Shottr full-page screenshot is RIGHT THEN. Current pipeline waits for Stage 2 (URL ingestion) to potentially fail before asking. That costs the user a context-switch (back to browser, take screenshot, return to chat) that could have been avoided.
- **Proposed fix:** At URL time (Stage 1 entry), the workflow says: *"Got it. While I scout the URL — drop a Shottr full-page of `<hostname>` if you've got one. Saves a step if Stage 2 needs it."* Optional but front-loaded. Updates the umbrella SKILL.md trigger pattern.

## #11 — Audience pre-pass should use ExtractFlow, not WebFetch

- **Stage:** 1 (URL pre-pass — proposed feature in #3)
- **Rank:** 🟠 major
- **Evidence:** Cycle-1 demo used WebFetch (Claude's generic HTTP-→-markdown tool) for the audience scout on retechuk.com. Worked because the site is static-HTML Shopify-shaped — but it's tier 0 (the cheapest fallback). The project already has a 4-tier extraction cascade in `sellersessions/extract-flow` (HTTP → headless → CDP → SeleniumBase stealth). For SPAs, anti-bot sites, or any heavier rendering, WebFetch will silently underperform or fail.
- **Proposed fix:** When we build the pre-pass as a real feature (per #3), it routes through `extract-flow` cascade rather than WebFetch. Tier 1 (HTTP) already covers what WebFetch does, with the auto-fallback up the cascade if HTML lacks the needed signals (e.g. JS-rendered hero copy). Curriculum-clean: workflow uses one extraction stack, not two.

## #12 — Claude reaches for generic tools before checking project infra

- **Stage:** workflow tax (applies always)
- **Rank:** 🟡 minor (process / Claude behaviour, not workflow code)
- **Evidence:** Cycle-1 — Claude (me) defaulted to WebFetch without checking whether the project had its own extraction stack. It does (extract-flow, 4 tiers, public repo). This is a Claude-side leak, not a workflow code leak, but it does cost the user time.
- **Proposed fix:** Pre-flight question that the umbrella `claude-ui-workflow/SKILL.md` could embed: *"Before invoking generic web tools, check `infra_*.md` memory + project README for project-specific extraction infra."* Could even be a hard rule in the SKILL: *"For URL extraction inside this workflow, ALWAYS use scripts/ingest-url.py (which wraps extract-flow). Never WebFetch directly."*

## #10 — Aesthetic-intent vs visual-delivery alignment check (curriculum gold)

- **Stage:** 1 (URL pre-pass) — but applies across all stages
- **Rank:** 🔴 blocker for curriculum-grade output
- **Evidence:** the operator: *"two men buying women's clothes with no female or feminine input. The website looks slightly masculine."* The brand SAYS it's for women (text scout: "Everyday clothing for women") but VISUALLY delivers a slightly masculine read (palette, type, layout). The workflow currently has zero detection for this gap.
- **Proposed fix:** Add a new stage (or sub-step in Stage 2) — **"intent vs delivery alignment check."** Compare scout text signals (audience.who) against visual signals from token extraction (palette warmth, type personality, photography style). Flag mismatches with concrete evidence. *"Brand text says 'for women, those who work with no boundaries.' Visual delivery: cool grey palette + sans-serif type + grid-only layout. Mismatch — visuals read closer to corporate-tech than feminine-editorial."* This is the single most differentiated finding in the workflow — most tools build the page; only this workflow would tell the user the brand is contradicting itself. **Curriculum gold.**

---

## #22 — Stitch zip export contains screenshots only — no HTML for drift audit

- **Stage:** 7 (Stitch generation) → 8 (refine)
- **Rank:** 🟠 major
- **Evidence:** retechuk Refresh-variant export (`stitch_retech_uk_redesign.zip`) unpacked to 4 folders, each containing only `screen.png`. No HTML, no CSS, no assets. The /refine pass spec assumes HTML to operate on (snap drifted locked tokens back to canonical values). With PNG-only export, /refine has nothing to act on and audit is constrained to visual inspection.
- **Proposed fix:** Document the two-channel Stitch export pattern in workflow docs:
  ```
  Channel 1: ZIP export → screenshots (visual reference, archive)
  Channel 2: Code-to-clipboard → HTML/CSS for /refine pass
  ```
  Both must be captured per generation run. Update `claude-ui-workflow/SKILL.md` Stage 7 instructions to require BOTH outputs before declaring Stage 7 done. Drop folder structure should expect both: `stitch-export/screenshots/*.png` + `stitch-export/html/<variant>.html`.

## #23 — Refresh mode honours hard locks, ignores soft suggestions

- **Stage:** 7 (Stitch generation) — Refresh mode behaviour analysis
- **Rank:** 🟢 (positive finding — codify the rule)
- **Evidence:** retechuk Refresh export held every locked field (theme.mode, paper-grain, petals, must_include sections, multi-CTA hero, brand story copy verbatim) and ignored every soft suggestion in the prompt (editorial serif type pairing, aubergine primary CTA, full-bleed editorial lookbook). Locked = held. Suggested = drifted.
- **Proposed fix:** Codify in workflow docs as a positive rule: *"In Refresh mode, only locks survive. Aesthetic guidance in prose is decorative — Stitch reads it but the reference image dominates."* Implication for /lock skill: when running Refresh mode, encourage the user to lock anything they care about pre-generation. Soft prompts will be ignored.

---

## #19 — Stitch model selection is workflow-critical and currently undocumented (BIGGEST STAGE 7 FINDING)

- **Stage:** 7 (Stitch generation)
- **Rank:** 🔴 blocker for curriculum
- **Evidence:** Cycle-1 ran the same prompt through three Stitch models. Outcomes diverged so widely that "send the prompt to Stitch" is meaningless without a model rule. Concrete results from retechuk run:

  | Model | Output | Verdict |
  |---|---|---|
  | **Redesign (Nano Banana)** w/ reference image | Refresh of the existing site — preserved paper grain, petals, organic circles, Knits/Polos/Cardigans/Tees grid, value-prop copy. Headline tightened to "EFFORTLESS EVERY DAY". Visually elegant, but anchored too closely to the reference. | ✅ best for **refresh / update existing site**. ❌ wrong tool for **redesign / new direction** — the reference dominates the prompt. |
  | **Thinking 3.1 Pro** (3 variants) | Variant 1 "Re Tech UK Homepage": deep aubergine, editorial serif, "Considered everyday pieces for a multitasking life" — strongly on-brief. Variant 2 "Playful Organic": pivoted to homeware ("Artful Living, Curated Space"). Variant 3 "Modern Brutalist": brutalist crop face, completely off-brand. | ✅ best for **fresh redesign**. ⚠️ multi-variant mode can drift the brief — variants 2 and 3 left the brand entirely. |
  | **3 Flash** | Generated a Marvel-style SUPERHERO image in the hero slot, cars, "TEEES WORK" pink panel. Completely off-brief. | ❌ **unusable for fashion / lifestyle brands.** Pulls random training data when the prompt is image-led rather than text-led. |

- **Proposed fix:** Codify a model-selection table in `claude-ui-workflow/SKILL.md` (or a new `STITCH-MODEL-RULES.md`). Cycle-1 evidence:
  ```
  intent = REFRESH (update existing site, preserve brand assets):
    → Redesign mode (Nano Banana) + reference image. ALWAYS.
  intent = REDESIGN (new direction from same brand brief):
    → Thinking 3.1 Pro, single variant only. Multi-variant invites brief drift.
  intent = QUICK ITERATION on text-led / dev / SaaS layouts:
    → 3 Flash (per prior memory).
  intent = FASHION / LIFESTYLE / IMAGE-LED brand:
    → NEVER 3 Flash. Always Thinking 3.1 Pro or Redesign.
  ```
  This single table will save every future user from the same three-model fishing trip.

## #20 — "Redesign mode" is misnamed — it's a refresh tool, not a redesign tool

- **Stage:** 7 (Stitch generation) — Redesign mode behaviour
- **Rank:** 🟠 major
- **Evidence:** Stitch's "Redesign" mode (Nano Banana, accepts a reference image) anchors so tightly to the reference that the prompt instructions read as decorative. On retechuk: prompt asked for editorial serif, warmer primary CTA, fresh direction. Output kept Montserrat-heavy type, kept black CTAs, kept the existing site's section ordering and hero treatment — just refreshed the model and tweaked the headline. The result is *good* as a refresh but it's NOT the redesign the prompt asked for.
- **Proposed fix:** In our internal docs, refer to Stitch "Redesign" mode as **"Refresh mode"** to set the right expectation. When the operator wants a true redesign (different palette, different type, different layout DNA), explicitly route to Thinking 3.1 Pro WITHOUT a reference image — the reference is what locks the redesign into refresh territory.

## #21 — 3 Flash is unsuitable for fashion / lifestyle brands

- **Stage:** 7 (Stitch generation) — 3 Flash output
- **Rank:** 🔴 blocker (model-specific)
- **Evidence:** retechuk run on 3 Flash produced: a Marvel-style superhero in the hero, cars in the secondary band, a pink "TEEES WORK" panel. None of these elements appeared in the prompt, the reference image, or any prior context. 3 Flash appears to fall back to high-variance training data when the prompt is image / aesthetic / brand-led rather than text / layout / dev-spec-led. Memory previously recorded "3 Flash for quick iterations" — that rule is correct ONLY for text-led builds (SaaS dashboards, dev tool layouts). For fashion / lifestyle / brand-led work it is actively destructive.
- **Proposed fix:** Refine the existing memory entry — split the "Flash for iterations" rule into:
  - "Flash for text-led iterations (SaaS, dev tools, layout-dominant pages)" — keep.
  - "Never Flash for image-led / fashion / lifestyle / brand-storytelling pages" — new.
  Add to `STITCH-MODEL-RULES.md` (proposed in #19).

---

## #14 — `theme.mode` heuristic flips on light themes with a dark element high in the DOM

- **Stage:** 2 (URL ingestion) — extract-brand.mjs
- **Rank:** 🔴 blocker
- **Evidence:** retechuk.com is unambiguously a light theme (pale grey bg, near-black text). `tokens.json` came out `theme.mode: "dark"`. Screenshot confirmed light. Likely cause: a dark element high in the DOM (sticky header? cart drawer overlay?) tripped the body-bg luminance heuristic. ALL downstream stages (design brief, Stitch prompt, refine audit) trust theme.mode. A flipped flag = whole generation in the wrong key.
- **Proposed fix:** Replace single-element luminance check with a multi-sample heuristic: read body bg luminance at 3+ scroll positions (top, mid, bottom), majority wins. Or sample the largest visible bg-painted region by area, not the first one matched. Either kills the high-DOM-dark-overlay false positive.

## #15 — `primary` role assignment trusts first-button-found, not visual hierarchy

- **Stage:** 2 (URL ingestion) — extract-brand.mjs
- **Rank:** 🔴 blocker
- **Evidence:** retechuk.com uses BLACK (#000-ish) for primary CTAs ("SHOP NOW", repeated 4× on the homepage) and GREEN (#308900) for two accent CTAs ("Shop Light Knits", "See More"). Extractor picked green as `primary` + `cta`. Reason: it grabbed the first button bg colour it found (likely the "Shop Light Knits" green pill). A 2-of-7 accent button got promoted to brand primary. The frequency was 4× black vs 2× green — black should have won.
- **Proposed fix:** Score primary-button candidates by frequency × visual prominence (size, fold position). Most-repeated winner becomes `primary`. Outliers become `accent`. Add a new `colors.accent` schema slot (it doesn't exist yet — see #16).

## #16 — `tokens.json` schema has no slot for `accent`, `decorative_palette`, `texture`, `line_work`, `photography_direction`

- **Stage:** 2 (URL ingestion) → 6+ (design brief)
- **Rank:** 🔴 blocker
- **Evidence:** retechuk.com brand identity carries (a) a pastel decorative palette of petal blurs (~4 distinct hues), (b) a paper-grain background texture, (c) hand-drawn organic line-work motifs, (d) a candid outdoor lifestyle photography direction. ALL FOUR are load-bearing for the brand read. ZERO of them have a home in `tokens.json`. /design will produce a flat-illustration corporate landing page because the signal is invisible to it.
- **Proposed fix:** Schema additions for cycle-2:
  ```
  colors.accent              (single accent hue, distinct from primary/cta)
  decorative_palette[]       (array of 2-6 hexes — illustrative / petal / pop colours)
  texture                    ({ type: paper-grain | noise | gradient | solid, intensity: 0-1 })
  line_work                  ({ stroke: hex, style: hand-drawn | geometric | none })
  photography_direction      (free-text — drives /design photo prompts)
  ```
  Cycle-1 escape hatch: I dropped these as a `_schema_gaps_observed` block at the end of `tokens.json` so /design can read them downstream even before the schema lands.

## #17 — Screenshot-assist (`refine-from-screenshot.py`) only fixes secondary/card/border roles

- **Stage:** 3 (screenshot assist) — refine-from-screenshot.py
- **Rank:** 🟠 major
- **Evidence:** Cycle-1 ran refine-from-screenshot.py on retechuk.com homepage. It proposed two overrides (secondary, text_secondary). It did not — and by design, cannot — touch `theme.mode` or `primary`. Yet those were the two fields that were actually wrong. Net: the user did the screenshot work, but the script only patched the cosmetic edges, not the foundational bugs. Reads as "I gave you the screenshot, why is it still broken?"
- **Proposed fix:** Expand refine-from-screenshot.py to include theme.mode (multi-sample luminance check on the screenshot itself — trivial) and primary role re-evaluation (count button colours by frequency). The screenshot has all the signal; the script just wasn't asking enough questions.

## #18 — Site uses warm-feminine photography but industrial-tech wordmark — finding #10 sharpens

- **Stage:** 2 (URL ingestion) — visual review
- **Rank:** 🟠 major (refines #10)
- **Evidence:** Screenshot review of retechuk.com refines yesterday's "slightly masculine read" finding (#10). The masculine signal isn't in the photography — photography is actually warm, candid, outdoor, feminine-friendly (women in soft pastel knits, sunlit settings, pastel-petal decorative overlays). The masculine signal is concentrated in (a) the heavy condensed sans wordmark "RE TECH UK" which reads industrial-tech / refurbished-electronics, and (b) BLACK as primary CTA colour clashing with the warm palette around it. So the intent-vs-delivery gap is narrower and more diagnosable than "masculine site, feminine intent" — it's "feminine 80%, two specific elements (wordmark + CTA colour) pulling against the rest."
- **Proposed fix:** Sharpen the alignment-check stage (#10) to flag SPECIFIC mismatching elements, not a wholesale verdict. Output should be: *"Hero photography matches feminine-editorial intent ✓. Wordmark type personality reads industrial-tech, conflicts with intent ✗. Primary CTA colour (black) is neutral but feels harsh against pastel decorative palette ⚠."* That gives /refine actionable targets instead of a vibe rating.

---

## #13 — Q6 asks two open questions in one block; one gets dropped

- **Stage:** 1 (INTAKE) — Q6 (Constraints)
- **Rank:** 🟠 major
- **Evidence:** Cycle-1 Q6 surfaced `must_include` + `must_avoid` plus two open questions in one message (kids inline? rewards on homepage?). the operator answered one (rewards), the other (kids) dropped silently — the prefix landed but the reasoning followed only the rewards thread. Required a clarifying re-ask. A non-designer running this fresh would either get a wrong answer baked in or stall.
- **Proposed fix:** Intake skill rule: **one question at a time when the question carries a binary/option choice.** Multi-part questions only when they're additive (e.g. "list anything else"). Update `intake/SKILL.md` Q6 section.

---

## Findings to come

(Stages 2-10 will append as we hit them.)

---

## #24 — Refresh→Pro reference chain + anti-hallucination + [EXACT TEXT] = content-faithful HTML (POSITIVE)

- **Stage:** 7 (Stitch generation) — workflow discovery
- **Rank:** 🟢 positive (codify rule)
- **Evidence:** Cycle-1 second-pass ran (a) NB Refresh output as reference image into (b) 3.1 Pro with (c) explicit anti-hallucination block + [EXACT TEXT] markers. Result: every locked element survived to rendered HTML — title, h1, subhead, dual CTA, nav order, wordmark, 7-section ordering, brand story copy verbatim, product names verbatim, lookbook caption verbatim, footer columns (OUR WORLD/HELP/LEGAL), footer copyright. Verified by reading the actual DOM, not Stitch's self-narration. File: `dogfood/2026-04-25-retechuk/stitch-export/retechuk-pro-from-nb.html` (24.9KB / 358 lines).
- **Proposed rule (codify in `STITCH-MODEL-RULES.md`):**
  ```
  For brand-led work where aesthetic AND content fidelity matter:
    1. Refresh (Nano Banana) + site screenshot → gorgeous reference PNG
    2. Pro 3.1 + Refresh PNG as reference + anti-hallucination block + [EXACT TEXT] markers
       on every literal copy → HTML/CSS faithful to both aesthetic and lock contract.
  Soft prose suggestions still drift. Anything that must hold MUST be marked [EXACT TEXT].
  ```

## #25 — 3 Flash is the new-project default trap

- **Stage:** 7 (Stitch generation) — entry point
- **Rank:** 🟠 major
- **Evidence:** Opening a fresh Stitch project (or any post-reload session) defaults the model picker to 3 Flash regardless of prior preference. Cycle-1 ran the first Pro attempt unknowingly on Flash because the user assumed model state persisted. Flash on a fashion brief produced massive drift (hero photo replaced with green-knit studio model, "Effortless Every Day" instead of EFFORTLESSLY LAYERED, single CTA "Shop the Collection" replacing dual CTA, generic AI marketing copy "consciously crafted essentials").
- **Proposed fix:** Workflow rule — *first action in any new Stitch project is verify model = 3.1 Pro (or Refresh, depending on intent) before generating.* Add to `claude-ui-workflow/SKILL.md` Stage 7 entry instructions.

## #26 — Stitch hallucinates its own self-confirmations (NEVER TRUST)

- **Stage:** 7 (Stitch generation) — Stitch chat narrative
- **Rank:** 🔴 blocker for trust
- **Evidence:** On the failed 3 Flash run, Stitch's chat panel claimed: *"Hero Section: Matches the reference image with the woman in the purple cardigan, the 'EFFORTLESSLY LAYERED' headline, and the dual aubergine CTAs."* Reading the actual rendered DOM showed every claim was false — wrong model, wrong headline, wrong copy, single CTA. Stitch is gaslighting its own output.
- **Proposed rule:** *Never trust Stitch's self-narration. The rendered DOM is the only source of truth.* Stage 8 /refine MUST run a real DOM-level audit, not a "Stitch said it's good so we ship" check. Browser automation (Playwright via the auth-persisted Chromium — see `infra_playwright_chromium_auth.md`) is the right surface for this audit.
- **Curriculum gold:** This is the second teachable moment of cycle-1 alongside #19 (model selection). The lesson: *generative tools confidently lie about their own output. Always verify against ground truth.*

---

## Cycle-2 fix-wave appendix (2026-04-26)

Three new findings surfaced when re-running the URL extractor against retechuk
after #14/#15/#16 fixes shipped. Logged here so they don't drift; address in
cycle-3 fix wave (or earlier if cycle-2 dogfood on a different brand
re-surfaces them).

## #27 — Shopify-shaped sites hide CTAs from the DOM scrape

- **Stage:** 2 (URL ingestion) — extract-brand.mjs button detection
- **Rank:** 🟠 major
- **Evidence:** Re-ran fixed extractor against retechuk.com. Frequency × area
  + above-fold scoring is now correct logic, but only 3 buttons get detected
  total: 1 black, 2 green. The homepage visibly has 4+ black "SHOP NOW" CTAs.
  Shopify-style sites place CTAs in places the scraper doesn't look:
  - Anchors inside `<form>` blocks (`product-form__cart-submit`)
  - Anchors with `background-image` rather than `background-color`
  - Anchors styled by grandparent classes (`.product-card a` selectors)
  - Buttons inside `<shopify-payment-button>` web components
- **Proposed fix:** Tier-2 button-detection cascade in `extract-brand.mjs`:
  - Add Shopify-specific selectors: `[class*="product-form"]`, `[class*="payment-button"]`, `form button`, `form a[role="button"]`
  - Detect anchors with `background-image` containing solid CSS gradients (radial/linear with single colour stop) and capture the gradient's primary stop as the bg colour
  - Detect anchors styled via parent class (e.g. all `<a>` inside `[class*="product"]`) and infer button shape from rendered border-radius + padding
  - When total detected buttons < 5, fall back to screenshot-assist *automatically* instead of returning sparse signal

## #28 — Decorative palette extraction needs an `<img>` sampling pass

- **Stage:** 2 (URL ingestion) — extract-brand.mjs decorative signal capture
- **Rank:** 🟠 major
- **Evidence:** Re-ran fixed extractor with new SVG-fill scan + bg-image signal
  block. retechuk returned `svg_decorative_colors: []` and `bg_image_signal:
  { total: 0 }`. Yet the homepage clearly carries pastel petal motifs (4
  hues), paper-grain texture, and hand-drawn line-work. They're rendered as
  raster `<img>` PNG/JPG assets, not SVG and not CSS bg-images. The current
  extraction is blind to anything in raster format.
- **Proposed fix:** Add an `<img>` sampling pass to `extract-brand.mjs`:
  - For each visible `<img>` with `width × height > 100×100` and not in a
    product-card/article context (i.e. likely a decorative element, not a
    photo), download via Playwright's `request.get()` and use Sharp/Jimp to
    extract dominant colours
  - Emit results as `signal.img_decorative_colors` parallel to
    `svg_decorative_colors`
  - `ingest-url.py` falls back to img signal when SVG signal is empty
  - Caveat: this slows extraction (network + image decode) — gate behind
    `--deep` flag, or auto-trigger when SVG + bg-image signals are both empty

## #29 — Light-theme `cta`/`secondary` role swap when button signal is sparse

- **Stage:** 2 (URL ingestion) — ingest-url.py mapping logic
- **Rank:** 🟠 major
- **Evidence:** Cycle-2 re-extraction against retechuk produced:
  - `primary: #eaeaea` (pale grey wash — correct interpretation as section bg)
  - `cta: #308900` (green — wrong; should be `accent`)
  - `secondary: #000000` (black — this IS the actual primary CTA)
  The light-theme heuristic in `ingest-url.py` (lines 161-174) picks
  `cta = first button colour` then `secondary = second button colour`. When
  the dominant button colour is dark/saturated and the lower-frequency
  candidate is also a saturated mid-tone, the heuristic gets the role
  assignment inverted.
- **Proposed fix:** Light-theme `cta` selection should prefer dark-saturated
  candidates (luminance < 60, saturation < 0.2 — i.e. near-black/charcoal/
  navy buttons) when present in the top-3 button distribution, regardless of
  count. Reasoning: a dark button on a light theme is the canonical CTA
  shape; a saturated mid-tone (green, orange) is more often an accent/sale
  badge. Score adjustment in `ingest-url.py::map_to_tokens`:
  ```
  cta_candidates = button_bg_distribution[:3]
  cta = max(cta_candidates, key=lambda c:
      (1.5 if luminance(c.hex) < 60 else 1.0) * c.count
  )
  accent = next(c for c in cta_candidates if c != cta and saturation > 0.4)
  ```
  Effect: black wins over green even when count(green) > count(black), as
  long as black appears in the top 3.

---

## Cycle-1 close-out summary (2026-04-26 21:30)

**Findings totals:** 29 (6 🔴 / 16 🟠 / 2 🟡 / 5 🟢)

**Cycle-2 fix wave shipped:**
- ✅ #14 — multi-sample theme.mode (verified: retechuk now correctly `light`)
- ✅ #15 — frequency × area × fold-position scoring (logic correct; signal-sparse on Shopify sites — see #27)
- ✅ #16 — schema slots for accent / decorative_palette / texture / line_work / photography_direction
- ✅ #17 — refine-from-screenshot.py expanded with theme.mode + primary re-eval
- ✅ STITCH-MODEL-RULES.md standalone doc (codifies #19, #20, #21, #23, #24, #25)
- ✅ PRE-CHECK-CHECKLISTS.md (maps all 26 findings to mechanical pre-checks)

**Deferred to cycle-3+ — disposition stamped 2026-04-26:**

| # | Trigger condition | Why not cycle-2 (Databrill Core) |
|---|---|---|
| #27 | Shopify-shaped DOM (form-buttons, payment web components) | Databrill Core is a custom Ellis build, not Shopify — fix can't be exercised |
| #28 | Decorative palette in raster `<img>` assets | Databrill Core is dark/minimal with missing images, no decorative raster — fix can't be exercised |
| #29 | Light-theme `cta`/`secondary` role inversion | Databrill Core is dark theme (`#0c0a14` bg) — light-theme code path doesn't run |

**Rule:** these three findings only ship when a future cycle picks a brand whose conditions match the trigger row. Pre-fixing without a verification brand = shipping blind. When a matching brand is selected, that fix gets pulled into the cycle's pre-flight wave.

- ⏳ #27 — `🅑 cycle-3+` — needs Shopify trigger brand
- ⏳ #28 — `🅑 cycle-3+` — needs raster-decorative trigger brand
- ⏳ #29 — `🅑 cycle-3+` — needs light-theme trigger brand
