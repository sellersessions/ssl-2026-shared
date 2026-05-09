---
project: claude-ui-workflow
status: active
last_updated: 2026-04-25
role: north-star
---

# Claude UI Workflow — PRD (End in Mind)

> Top-of-stack control document. Read this **before** MASTER-LOG, OUTSTANDING-WORK,
> README, or DESIGN-PIPELINE-VISUAL. If a decision in another doc conflicts with
> this PRD, the PRD wins until updated.

---

## Outcome

Build a *non-designer-friendly* landing page and design-output creation experience that reliably produces **premium, stunning results** — with a "world-class designer" layer in the background that quietly enforces best-practice UI/UX and brand consistency.

## Problem / Opportunity

Non-designers can be highly creative ("alchemists") but need **invisible guardrails**:

- They don't know design systems, typography rules, spacing, hierarchy, accessibility, or "anti-AI-slop" standards.
- They struggle to translate intent into prompts and to iterate without breaking consistency.
- Current tools feel **bloated** and require too much manual thinking and context switching.

The opportunity is to deliver a seamless workflow that produces high-quality outputs *without* the user needing to understand the underlying rules.

## Target Users

### Primary user

- Non-designer founders / operators / marketers who need high-quality landing pages and marketing assets quickly.

### Secondary users

- Designers (or design-adjacent team members) who want fast starting points and consistent brand application.
- Teams producing repeated variations (campaigns, product launches, event pages).

## Success Criteria

### User-facing success

- A first-time user can produce a "premium" landing page draft within ~10 minutes.
- Outputs consistently feel cohesive (typography, spacing, hierarchy, colour, components), not "AI slop".
- Iterations are easy: users can ask for changes without breaking the system.

### Quality success

- The system flags or prevents common layout issues (spacing, alignment, contrast, inconsistent component usage).
- Brand fidelity is maintained across sections and across multiple generated assets.

### Workflow success

- The user experience feels **seamless** (low friction, minimal tool-switching).
- Replacing clunky interactions (e.g., current tldraw flow) leads to improved time-to-output and satisfaction.

## Non-Goals

- Becoming a full design tool replacement for professional designers.
- Forcing users to learn design theory or complex UI tooling.
- Optimising for one specific output type only (must support multiple output categories).

## Core Use Cases

1. **Landing page creation**
   - Generate a full landing page structure + content + visual system.
2. **Brand style ingestion**
   - User provides a style guide, a website URL, or screenshots, and the system infers the design system.
3. **Reference-image-driven outputs**
   - User provides a product image (or similar) and the system can incorporate it reliably.
4. **Multi-format asset creation**
   - Not just pages: infographics, lifestyle images, marketing graphics, and other design outputs — "any type of design output and it just works".
5. **Guided discovery**
   - The system interviews the user with smart questions to clarify the goal, audience, constraints, and preferences.

## Key Product Requirements

### 1) Seamless UI flow with invisible design guardrails

**Requirement**

- The UI should hide complexity while maintaining professional design constraints.

**Guardrails (examples, to be refined)**

- Consistent spacing scale + alignment rules
- Typography pairing rules and heading hierarchy
- Component consistency (buttons, cards, forms, nav, hero patterns)
- Colour contrast + accessibility checks
- "Anti-slop" constraints (avoid overly generic stock layouts, inconsistent styles, low-signal decoration)

**Acceptance criteria**

- Users can't easily create "broken" layouts; the system nudges, fixes, or prevents.
- The user feels empowered rather than restricted.

### 2) Stitch as the concept + design generator

**Clarification**

- Stitch is the primary surface that generates concepts and designs.
- tldraw was being used as a mood board / inspiration board to provide context, but it's cumbersome and has no direct connection to Stitch.

**Requirement**

- Remove the tldraw "mood board" dependency and keep the workflow centred on Stitch + the system's built-in guardrails and brand inputs.

**Acceptance criteria**

- No separate mood board step is required.
- The flow remains lightweight (less bloat, fewer disconnected tools) while preserving context via brand inputs (URL/style guide/screenshots) and guided intake questions.

### 4) Brand style guide integration (instant design system)

**Requirement**

Users should be able to provide:

- Brand style guide (doc)
- Website link
- Screenshot(s)

…and the system produces:

- A derived design system (type, colours, spacing, components)
- A confidence score and/or quick review step (so users can correct mistakes early)

**Acceptance criteria**

- With a website link or style guide, the first output matches brand direction without heavy manual tweaking.
- Users can "lock" brand decisions (e.g., primary font, button style) so iterations stay consistent.

### 5) Reference image handling (product images, screenshots, etc.)

**Current issue**

- Stitch can make good mockups but is bad at producing outputs from reference images (e.g., using a specific product image).
- Infographics/lifestyle outputs can become random.

**Requirement**

- Strong, reliable reference image workflows:
  - Place/feature the user's product image correctly
  - Preserve key visual features
  - Avoid random unrelated imagery

**Acceptance criteria**

- A user can upload a product image and get a landing page hero + sections that consistently incorporate that product.
- For infographics/lifestyle imagery, the system keeps content on-brief and brand-aligned.

### 6) Interview and ask questions (guided intake)

**Requirement**

- Use an interview-style flow to capture user intent and constraints before generating.

**Example prompts**

- What are you making? (landing page, infographic, ad creative, etc.)
- Audience + offer + key CTA
- Brand style source (URL, guide, screenshot)
- Desired vibe (premium, minimal, bold, playful, etc.)
- Constraints (must include trust signals, pricing section, testimonials, etc.)

**Acceptance criteria**

- The interview reduces failed first drafts.
- Users can skip the interview if they already know what they want.

## User Journey (Proposed)

1. Choose output type (landing page / infographic / lifestyle / other)
2. Provide brand inputs (style guide / URL / screenshots)
3. Quick interview to clarify intent (optional but recommended)
4. Generate first draft (layout + content + system choices)
5. Iterate via simple commands and structured controls
6. Export / publish / handoff (format to be defined)

## Open Questions

- What is the *minimum* set of guardrails required to eliminate "AI slop" while keeping the UI fast?
- How should "premium" be operationalised (heuristics, patterns, QA checks)?
- What's the best interaction model for editing (canvas vs structured sections vs hybrid)?
- What export formats are required (HTML/CSS, Figma, images, Notion page, etc.)?
- How should reference image constraints be enforced to avoid randomness?
- How do we measure quality automatically (scoring, checks, human feedback loops)?

## Constraints

- Must remain easy for non-designers.
- Must support multiple output types (not just landing pages).
- Guardrails should be mostly invisible (the user shouldn't feel like they're doing "design work").

---

## Raw Notes (source — the operator, 25 Apr 2026)

I'm trying to start with the end in mind to help crystallise what I'm trying to achieve, so we can kick this into shape. I thought I'd share a few more ideas to help refine the plan.

**End goal?**

Make amazing landing pages that are premium and stunning. That has a brain in the background that acts as a world-class designer, hiding away all the flaws and technicalities that are way beyond the average human's mind. This is for non-designers that are alchemists. Non-designers need guard rails — all the design systems, UI/UX rules, anti-AI-slop guard rails should be invisible.

They need help with inspiration. They need help with prompts.

Somehow we have all the elements but it's bloated and needs to be seamless.

The tldraw is not working well and clunky to use. I find Stitch much more friendly than Claude Design. However, Stitch makes good mockups but is bad at producing outputs from reference images. You cannot get it to use, say, a product image — and when it generates image types such as infographics or lifestyle images, it creates random outputs.

The end user should be able to make any type of design output and it just works.

**Example:** they feed own brand style guide, or link to website, or a screenshot. Then Claude UI can work out the design system.

Interview and ask questions — this will help capture what the end user wants to do and create.
