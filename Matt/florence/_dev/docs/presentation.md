# Florence
### Your Chief Data Analyst for Amazon

**Seller Sessions — part of Danny McMillan's session**
Matt Kostan (Product Pinion) × Dorian Gorski (Keplo)
~60 min · 3+ presenters · format pending Danny confirmation

> **Note:** This document is a draft of the Florence portion only. The full
> workshop is a wider story about *connected systems vs. AI slop tools*, with
> three build tracks — Florence, the Systems Consultant Agent, and the Ethical
> Prompt Injection skill — plus a LORAs primer. See
> `florence-workshop-plan-v2.md` for the full structure and owner split.

---

## 1. Meet Florence

Florence Nightingale was born in 1820. Most people remember her as a nurse.

She was actually one of Europe's foremost statisticians.

During the Crimean War, she didn't just nurse soldiers — she tracked **why** they were dying. She invented the polar-area "rose diagram" to make the data undeniable. She showed Queen Victoria. The British Army overhauled its sanitation system.

**Hospital mortality dropped from 40% to 2%.**

Florence didn't just collect data. She turned it into decisions that saved lives.

### Your Florence

Your Florence does the same for your Amazon business.

She is an **open-source AI agent** — not a chatbot, not a SaaS — that you install on your own machine. She runs inside Claude Code, uses your own data, and works while you sleep.

She watches your competitors. She interrogates your shoppers. She tests your images. She tells you exactly what to do next — and why.

**No login. No subscription. No vendor lock-in. Just code you own.**

---

## 2. Why We Are Building It

### The honest problem with Amazon AI today

- Every Amazon "AI tool" looks the same: a dashboard, a blue gradient, a glowing brain icon, $99/month.
- Most are wrappers around ChatGPT that rewrite your bullets and call it optimization.
- They don't use your data. They don't know your competitors. They don't measure if their suggestions actually move CVR.
- And they're rented, not owned. Cancel the subscription, lose the work.

### The shift we're betting on

Three things changed in the last 18 months:

1. **Claude Code became real.** Sellers can run agentic workflows on their own machines, no SaaS required.
2. **MCP made tool integration trivial.** Florence can talk to Amazon, Product Pinion, Slack, your spreadsheets — all from one place.
3. **Agents > chatbots.** A chatbot waits for prompts. An agent has a goal (grow sales), gathers data on a schedule, prioritizes work, and tells you what matters.

### What we want to prove

You can build a **Chief Data Analyst** for your Amazon business — better than any SaaS — for the cost of a Claude subscription. And you can give the code away.

---

## 3. What Is The Need

### What sellers actually struggle with

We've spent the last 5 years working with hundreds of Amazon brands between us. The same patterns show up:

| Pain | What sellers do today | What's broken |
|------|----------------------|---------------|
| **CTR is dropping and I don't know why** | Stare at the search page once a quarter | Competitors test images weekly; you find out in the rear-view |
| **My main image is "fine"** | Set it once, leave it for 2 years | No feedback loop; no idea if it actually wins on the SERP |
| **My secondary images don't convert** | Guess what shoppers care about | Build images for objections that aren't the real objections |
| **Too many things to fix** | Whoever shouts loudest wins | No prioritization framework, no math, no ROI lens |
| **I can't tell what's working** | Pull reports manually, eyeball trends | Data lives in 6 tools, never gets synthesized |

### The unifying need

Sellers don't need more data. They need **prioritized decisions**, backed by evidence, delivered proactively.

That's what Florence is.

---

## 4. Main Use Cases

Florence ships with four core skills. Each maps to a specific seller workflow.

### Skill 1 — Market Informant
**She watches your competitors so you don't have to.**

- Monitors competitor ASINs on a schedule
- **Triggers on SQP CVR/CTR movement** (not just image diffs — sales signal first, then forensics)
- Flags meaningful price changes
- Pushes a Slack alert with: what changed, what to investigate, what action to consider

*Solves: "I never see competitor changes coming until my CTR has already dropped."*

### Skill 2 — Variation Engine
**She redesigns your main image with proven CTR techniques.**

- Analyzes your current main image (angle, background, text, whitespace, lifestyle vs. studio)
- Cross-references against a curated database of CTR-boosting techniques
- Returns 3–5 prioritized recommendations with rationale
- Generates a mockup (with your image gen API key) or a ready-to-paste prompt for ChatGPT/Gemini
- Designed to test a new variation each month

*Solves: "I set my main image two years ago and have no idea if it's still the best version."*

### Skill 3 — Shopper Interrogator
**She uncovers the real objections stopping shoppers from buying.**

- Mines competitor 1-star and 3-star reviews for recurring objections
- Pulls Amazon Rufus questions (questions Amazon's own AI thinks shoppers ask)
- Runs an open-ended Product Pinion poll: "What would stop you from buying this?"
- Synthesizes all sources into 5–7 distinct objections with supporting evidence
- Runs a second PP poll to **rank** them by importance
- Outputs a slide-by-slide blueprint for your secondary images

*Solves: "I'm building secondary images around what I think buyers care about — not what they actually do."*

### Skill 4 — Evergreen Image Tester
**She closes the loop. Generate → test on real shoppers → learn → regenerate.**

- Pits your main image against competitors and your own variations in a Product Pinion search simulation
- Real shoppers click, real shoppers explain why
- Win rate, qualitative themes, image attributes that drove clicks
- Feeds results back into the Variation Engine for the next round
- Re-triggers automatically each quarter or when Market Informant detects a competitor change

*Solves: "A/B testing on Amazon is slow, noisy, and expensive — and I never have time to do it."*

### The prioritization layer that ties it together

Every Florence recommendation is scored on the **Keplo Prioritization Framework**:

- **40%** Data Strength (how many sources support this?)
- **30%** Dollar Impact (what's the revenue opportunity?)
- **15%** Effort (how hard is this to implement?)
- **15%** Speed (how fast will we see results?)

Florence does the math. You see what to work on first, and why.

---

## 5. How Florence Fits Into Your Workflow

She is only useful if she lives where you already work. Florence is designed to disappear into your day — not become another tab to remember.

### Where she lives

| Surface | What happens there |
|---------|-------------------|
| **Slack DM** (her primary home) | Daily brief, ad-hoc questions, alerts. A channel called `#florence` with her portrait as the avatar. |
| **Claude Code terminal** | Deep dives. *"Florence, run a full teardown on B07XYZ"* — she works for 10 minutes and reports back. |
| **WhatsApp / SMS** (optional) | Same daily brief, for sellers who live on their phone. |
| **Voice brief** (60 seconds) | Audio version of the morning brief, ElevenLabs-generated. Listen with your coffee. |
| **Email digest** (weekly recap) | What changed this week, what we tested, what to do next. |

### The rhythm she creates

Predictable cadence is what makes her feel like a colleague, not a tool.

- **Monday 8am** — Priority brief: *"Three things matter this week. Here's the one I'd start with."*
- **Wednesday** — Mid-week pulse: tests in flight, anything to pivot
- **Friday** — Recap: what shipped, what we learned, what's queued for next week
- **Anytime** — Slack DM her a question, get a real answer (not "here are some considerations")
- **On signal** — Competitor moves, SQP shifts, or PP poll results trigger an alert with a recommended action

### What she connects to

**Data she pulls in:**
- SellerApp API (one MCP, 17 tools) → product details, reviews, Rufus queries, reverse-ASIN keywords with CTR/CVR/competition, Amazon SERPs
- Product Pinion → live consumer polls (open-ended + ranking)
- Your existing Supabase / Google Sheets if you already track tests there

**Where she hands off when she finds something:**
- **Notion** → creates a task in your test backlog with full context (objection, recommendation, expected lift)
- **Designer brief** → generates a slide-by-slide content brief your designer (or AI image gen) can execute
- **Calendar** → blocks 30 min on Friday to ship the priority test
- **Slack mentions** → tags your VA / designer / agency on the relevant thread

She doesn't just say "you should do X." She routes "do X" to the place where X actually gets done.

### Memory and continuity

This is what makes her feel personal.

Florence remembers:
- Every test you've run (winner, loser, lift, when)
- Every recommendation she made and whether you shipped it
- Your goals for each ASIN ("hit $30K/mo" or "fix the hero image first")
- Your brand voice, your category context, your competitive set

So next Monday's brief sounds like: *"That bullet rewrite from Jan 14 is up 8% week-over-week — worth doubling down before we touch the hero image. The competitor at slot 3 changed their main image again on Tuesday; SQP is flat so we wait."*

That tone — referencing your shared history, picking what matters, ignoring noise — is what separates a colleague from a chatbot.

### One signature move

Every Florence brief ends with one line:

> **What I'd do today: [one specific action]**

Not three options. Not "consider." One thing. She has an opinion. You can ignore it, override it, ask her to defend it — but she always picks. That's how trust gets built.

---

## 6. How We Are Going To Build It

### The architecture

```
florence/
├── skills/
│   ├── market-informant/        # SQP-triggered competitor watch
│   ├── variation-engine/        # Image analysis + technique matching
│   ├── shopper-interrogator/    # Review + Rufus + PP synthesis
│   └── evergreen-tester/        # Image tournament + feedback loop
├── knowledge/
│   ├── techniques.json          # Curated CTR/CVR techniques (open to PRs)
│   ├── prioritization.md        # The 40/30/15/15 formula
│   └── what-florence-ignores.md # Signals she actively de-prioritizes
├── integrations/
│   ├── sp-api/                  # SQP, Business Reports
│   ├── product-pinion/          # Polling tools (Matt)
│   └── amazon-scrape/           # Rufus, reviews, listing capture
└── demo/
    └── walkthrough.md           # Run Florence on a fresh ASIN in 5 minutes
```

### The stack

- **Runtime:** Claude Code (the seller already pays for Claude — Florence is free on top)
- **Skills:** Markdown skill files following the Claude Skills spec (no framework lock-in)
- **Tools:** MCP servers for Amazon data, Product Pinion polls, image generation
- **Storage:** Local files + the seller's own Supabase (optional) — no Keplo or PP touches their data
- **License:** MIT, joint Keplo + Product Pinion repo

### The build plan (this week)

| Day | Deliverable |
|-----|-------------|
| Mon | Repo scaffold, README v1, Florence Nightingale brand applied |
| Tue | Skill 3 (Shopper Interrogator) end-to-end — the live demo skill |
| Wed | Product Pinion polling integration tested live |
| Thu | Skills 1, 2, 4 shipped (using existing Keplo CRO agent prompts as foundation) |
| Fri | Dry-run with Matt, recorded demo as backup, handout printed |
| Sat | Buffer day for the live demo to actually work |

### What we're NOT building this week

- AEO (Answer Engine Optimization) — roadmap
- Safe Prompt Injection — roadmap
- A web dashboard — roadmap, possibly never (the terminal is fine)
- Title and bullet generation — already exists in other tools, not the differentiator

---

## 7. How We Are Going To Deliver It

### The workshop has two outputs. Both go home with you.

### Output 1 — The Live Demo

Audience picks an ASIN from the room.

On stage, in real time:
1. Florence pulls competitor reviews + Rufus questions for that ASIN
2. Florence fires an open-ended Product Pinion poll to a real shopper panel
3. Florence synthesizes the responses into a ranked list of objections
4. Florence outputs a secondary-image blueprint, scored on the prioritization framework

The room watches an agent do 4 hours of CRO work in 8 minutes.

(Recorded backup ready in case the wifi loses.)

### Output 2 — The Repo

Every attendee leaves with the repo URL on a printed QR code.

What's in the repo:
- All 4 Florence skills, working, documented
- The curated technique database (open for community PRs)
- 5-minute install path for non-developers
- 30-minute extension path for developers
- The prioritization framework and the "what Florence ignores" list
- Real example outputs from the live demo

What we ask in return:
- Star the repo
- Open an issue if Florence breaks on your ASIN
- Contribute a technique to the database
- Tell another seller

No paywall. No gated upgrade. No "Pro" tier. The CRO Partner Program (Keplo) and Product Pinion subscriptions are mentioned in the README — but Florence works without either.

---

## The Pitch In One Sentence

> Florence is an open-source AI agent that turns your Amazon data into prioritized decisions — like Florence Nightingale turned mortality data into the sanitation system that dropped death rates from 40% to 2%.

---

## Q&A

Built by:
- **Dorian Gorski** — Keplo (CRO Partner Program, 200+ optimization projects)
- **Matt Kostan** — Product Pinion (consumer panel polling for Amazon)

Repo: `github.com/keplo/florence` (live the morning of the talk)

Questions?
