# Florence — Knowledge Capture Interview for Matt

Hi Matt. Dorian's been working with another Claude on a project called
Florence. He needs your expertise baked into it. **Drop this whole file
into your Claude (Claude Desktop, Cowork project, or claude.ai),** and
it'll walk you through everything.

You can do this in 20 minutes if you're sharp, or spread it across a
few sessions. Skip what you don't care about. Add anything we missed.
The output is a single markdown doc you send back to Dorian — your
Claude will produce it for you at the end.

---

## ⚠️ FOR THE AI READING THIS FILE

You are interviewing Matt (Product Pinion founder, expert in Amazon
shopper-panel testing) to capture his methodology and knowledge for a
project called Florence. Read **all of this file** before starting.

Your job is not to march through every question robotically. Your job
is to have a smart, focused conversation with Matt, capturing his
voice and expertise in his own words, and at the end produce a single
clean markdown doc that Dorian can read.

**How to behave:**

- **Be conversational, not form-like.** Don't dump 8 questions at once.
  Ask one, listen, follow up if there's depth to mine, move on.
- **Let Matt skip.** If he says "skip", "no opinion", "next" — move on
  without fuss. Note in the output that the question was skipped.
- **Let Matt add.** If he wants to say something not in the question
  bank, capture it as a new section. Tag it as an addition.
- **Don't be precious about order.** Matt may want to jump to Topic 4
  first. Follow him.
- **Push back lightly when useful.** If Matt's answer is generic,
  ask once for a specific example or number. Don't drill more than
  once — he's busy.
- **Capture verbatim where possible.** Matt's exact phrasing matters
  more than your tidy paraphrase. If he gives you a great two-paragraph
  rant about title testing, keep it as a two-paragraph rant.
- **Welcome screenshots/files.** If Matt mentions an example he could
  share, prompt him to drop the file path or describe it; you'll
  reference it in the output.

**The output you produce at the end** is a single markdown doc with the
same topic headings as this interview, populated with Matt's answers,
clearly marking skipped questions and Matt's own additions. Tell Matt
to save it as `florence-matt-answers.md` and email it to Dorian — or
commit it to the repo if Matt has a clone set up.

OK. Now read the project briefing below so you can frame everything in
context. Then start the interview.

---

## Project briefing — what Florence is

Florence is an AI Chief Data Analyst for Amazon sellers, built by
Keplo (Dorian's CRO agency). She lives inside Claude Desktop as a
"Cowork Project" — a folder of skills, instructions, and a memory
brain that the user opens like any other project.

What she does, day to day:

- Mines competitor reviews and Amazon Rufus questions overnight
- **Launches Product Pinion panels to surface objections and test variants**
- Synthesises what shoppers actually care about
- Generates image variations to address those objections
- Scores every recommendation on a 40/30/15/15 priority framework
- DMs the seller every morning at 8am with "what I'd do today: [one action]"

She runs four headline skills:

1. **Market Informant** — competitor watch
2. **Variation Engine** — main-image redesign loop
3. **Shopper Interrogator** — review mining + Rufus + PP panel chain
   → ranked objections → image blueprint **(this is where you live)**
4. **Evergreen Tester** — image tournament loop using PP

Florence is being launched at a Seller Sessions workshop with ~100
attendees. Each delegate gets the project repo for free; they install
it into their Claude Desktop and have a working CRO assistant on day
one. The promise is "you own the code, fork and extend it" — no
subscription, no SaaS lock-in.

## Why we're capturing your expertise

Florence's "Shopper Interrogator" skill — the headline workshop demo —
runs entirely on Product Pinion. Every panel she launches, every
result she reads, every recommendation she makes off the back of a PP
test depends on you.

We could code this skill from a generic A/B testing handbook, but
that's not what gets people CTR/CVR wins. **You have years of running
real Amazon panels. The opinions you've formed, the heuristics you've
built, the question phrasings you've found that work — that's what
Florence needs encoded into her.**

Concretely, your answers feed into:

- `.claude/skills/shopper-interrogator.md` — the skill that runs your
  test methodology
- `.claude/skills/florence-recommend-test.md` — the decision tree for
  which test type to use given a seller's goal
- `knowledge/cro-sops-matt.md` — your playbook, encoded as Florence's
  reference material
- `knowledge/pp-mcp-contract.md` — the technical contract between
  Florence and your MCP server

Every Florence user, going forward, gets your methodology baked in.
That's why this is worth doing properly.

## Your role at the workshop

We want to introduce you on stage as the testing brain behind
Florence. You'll get billed alongside Dorian. Florence's recommendations
will visibly say "via Product Pinion methodology" wherever your work
shaped them.

Practical asks for the workshop:

- A demo ASIN we use for the live stage demo (your call which one;
  ideally one you've already run PP on so we have reference data)
- A workshop-shared PP key (~$500 cap) that delegates default to until
  they plug in their own
- Pre-launched PP polls Tuesday/Wednesday before the workshop so the
  live demo doesn't depend on PP latency

These are operational, covered in Topic 7. The methodology stuff
(Topics 1–6) is where the real value is.

---

## How to run this interview (for the AI)

Eight topics. Suggested order is the one written below — but follow
Matt's preferences. Each topic is **5–15 minutes** depending on depth.
Total interview time: 60–120 minutes if Matt does all of it; can be
split across sessions.

**Opening line, suggested:**

> "Hey Matt — Dorian's asked me to capture your Product Pinion
> methodology so it can be encoded into Florence (the AI agent for
> Amazon sellers he showed you). I've got 8 topics covering testing
> methodology, the test types you run, your Amazon CRO playbook, and
> some operational stuff for the workshop. Want to start with topic 1
> or jump to one that's freshest in your head? Skip anything that
> doesn't fit. Add things we missed."

**Closing line, suggested:**

> "That's everything. I'll write up a markdown doc with your answers
> as `florence-matt-answers.md`. Want me to email it to Dorian for you
> or just hand it to you to send?"

---

## Topic 1 — A/B testing fundamentals

The frame Florence applies to every test. Get this right and downstream
recommendations all benefit.

**Questions to explore (pick what feels alive, skip the rest):**

- In one or two sentences: what makes a "good" Amazon test?
- Single-variable rule — do you always test one thing at a time, or
  is multi-variable acceptable in some cases? When?
- Sample size: minimum panel for a result you'd ship on. Different
  for CTR vs CVR vs price-sensitivity tests?
- Confidence thresholds: ship / investigate / kill cutoffs. Do you
  ever ship sub-threshold?
- Test duration: how long does a panel run? When do you cut early or
  extend?
- Audience targeting: how granular do you go? Cost/value as you
  narrow.
- **Question framing — your top rules.** This is secretly the most
  important topic in this whole interview. Bad question wording
  invalidates a test. Examples Matt's mentioned in passing: "never
  lead with the brand name", "always offer a 'none of these' option".
  Get his top 5–10 rules, in his words.

---

## Topic 2 — Test types: CVR vs CTR

Florence needs to know which lever each test type pulls so she can
route recommendations correctly.

For each test type, capture: what it measures, when to run it, sample
size for a clean read, common pitfalls, one example win or loss Matt
remembers. **Skip any test type Matt doesn't run or doesn't have
strong opinions on.**

- **Search-context (CTR) tests** — listing in a SERP-like environment
- **Detail-page-context (CVR) tests** — full PDP, would-they-buy
- **Main image variation tests** — CTR or CVR or both?
- **Title tests** — what's actually being measured (clicks? recall?)
- **Bullet points / A+ content tests** — methodology + duration
- **Price-sensitivity tests** — van Westendorp? Gabor-Granger? Other?
- **Open-ended objection mining** — "what's stopping you from buying?"
  → this is the heart of Florence's Shopper Interrogator skill, mine
  this topic deeply. Standard sample size, question phrasings that
  work, common objection clusters Matt sees, how he typically
  clusters responses
- **Ranking tests** — Florence's follow-up: "rank these 5 objections"
- **Anything else** — tests Florence should know about that the
  workshop demo won't cover but power users would want

---

## Topic 3 — Decision tree: when to use which test

This becomes a lookup inside Florence. Given a seller's stated goal,
which test does she suggest?

Walk Matt through these scenarios. Get his "if a client said X to me,
I'd run Y" answer for each:

- "My CTR is low"
- "My CVR is low but CTR is fine"
- "I'm not sure if my new image is better"
- "I want to know what's stopping people buying"
- "I want to know which of my 5 image ideas wins"
- "I want to test a price increase"
- "I want to know why my bullets aren't working"
- "I'm losing the buy box"
- _Open invitation: any other scenarios Matt routinely hears that
  Florence should be ready for_

---

## Topic 4 — PP Claude MCP contract

Florence calls Product Pinion via Matt's MCP server. We need the
contract documented enough that her skills can be built against it.

If Matt has the MCP manifest as a file, ask him to share the path
(or paste the JSON). Otherwise walk through it:

- **Tools the MCP exposes** — names, what they do, args, return shapes
- **Auth flow** — how does a seller's Cowork install authenticate?
  OAuth via Cowork connector, API key paste, both?
- **Lifecycle of a poll, end to end** — create, check status, get
  results, cancel/abort. What does Florence call for each?
- **Latency expectations** — typical time from create to results-ready;
  variance by test type, audience, sample size
- **Webhook callbacks vs polling** — recommended pattern + contract
- **Error states** — "insufficient panel matching audience", "rate
  limited", "credit exhausted" — what comes back, what should
  Florence do with each
- **Workshop credentials** — shared $500 key, Matt's demo account,
  per-delegate trial?

---

## Topic 5 — Real examples and case studies

The most valuable thing Matt can give Florence: real test examples
that changed a listing's performance. Each becomes a calibration data
point. **Don't be exhaustive — 3 strong examples beats 8 generic ones.**

For each, capture: the brand and ASIN (anonymise if needed), variants
tested, the result with confidence, Matt's post-hoc theory of why it
won/lost, and any files he can share (screenshots, PP exports, post-
test images).

Try to get at least one of each:

- **A CTR win** — search-context test that moved clicks
- **A CVR win** — PDP-context or image test that moved conversion
- **A surprising loss** — a test Matt was sure would win and didn't.
  These are the most educational kind.
- **A price test** — methodology, optimal price found, revenue impact
- **An objection-mining run** — full open-ended PP output. This is
  literal training data for Florence's synthesis skill.

If Matt can drop files, suggest a folder name like
`knowledge/inbox/matt/cases/` and let him reference paths.

---

## Topic 6 — Amazon CRO SOPs (Matt's playbook)

Florence runs an opinionated playbook. Half of it is yours.

- **Your top 10 ways to improve CTR**, ordered by impact
- **Your top 10 ways to improve CVR**, ordered by impact
- **Things sellers commonly do that destroy CVR** — anti-patterns
  Florence should flag immediately on first look at a listing
- **The order you'd attack a struggling listing** — first diagnostic,
  second, third
- **When to NOT run a test** — sometimes "just ship the change" is
  right. When?
- **CTR benchmarks by category** — rough ranges for "good" per category
- **CVR benchmarks by category** — same
- **Anything else in your playbook** — quirks, heuristics, "always
  check this first" rules. Open-ended.

If Matt has any of this written down already, ask for the file. Don't
make him retype things he's already documented.

---

## Topic 7 — Workshop operational stuff

Less interesting than the methodology but Florence's stage demo
depends on it.

- **Demo ASIN** — Matt's recommendation for the workshop stage demo.
  Criteria: well-known category, ≥100 reviews, 5 obvious competitors
  with similar review depth, not too niche, ideally one Matt's
  already run PP on so we have reference data.
- **5 confirmed competitor ASINs** for the demo product (so we don't
  rely on live SQP fetching during the stage demo).
- **Pre-launched PP polls** — open-ended + ranking, fired Tuesday or
  Wednesday before the workshop. Status?
- **Stage rehearsal slot** — Matt's availability Friday before workshop.
- **Live vs cached demo** — fully live PP polls on stage, or
  pre-canned to mask latency? Affects PP credit budget and demo risk.

---

## Topic 8 — Image generation (for later, not blocking)

Florence's Variation Engine skill (Skill 2) generates redesigned
product images. Matt's GPT-2 image gen endpoint is the workshop
default. **This isn't blocking the workshop, so cover quickly or skip
if Matt's tired by now.**

- Endpoint URL and auth shape (have him drop credentials in a file,
  not paste in chat)
- $500 cap confirmation
- Latency expectations per image — fast enough for live demo, or
  async only?
- Style-control inputs: LORAs, technique descriptors, base style
  presets
- Sample image-gen outputs Matt can share (image files paired with
  the prompts that produced them — this trains Florence's
  technique-match skill)

---

## Topic 9 — Matt's open mic

Always end here. Two questions:

- "What did I miss? What does Florence need to know about Product
  Pinion or Amazon CRO that we didn't cover?"
- "What would you push back on? Is anything in this brief
  wrong-headed or naive?"

Matt's been thinking about this stuff longer than Dorian or me. His
unprompted additions are often the most valuable part of the whole
interview.

---

## At the end of the interview (for the AI)

Produce a single markdown file titled `florence-matt-answers.md` with:

1. **Header** — date of interview, Matt's name, time taken
2. **Sections** matching Topics 1–9 above, in interview order
3. Under each topic, Matt's answers in his own words. Use direct
   quotes wherever possible. If he riffed, keep the riff intact.
4. **Skipped sections** — clearly marked: `> Skipped — Matt: [reason
   if given]`
5. **Open additions** — anything Matt brought up unprompted, captured
   under a "Matt's additions" subheading inside the relevant topic, or
   as a new topic if it doesn't fit anywhere
6. **File references** — list of any files Matt mentioned dropping
   into `knowledge/inbox/matt/` so Dorian knows to look for them
7. **Footer** — "Send this to Dorian. He'll read it and Florence will
   inherit the methodology in skill files."

Do NOT format as Q&A. The answers should read as a coherent document
of Matt's thinking, organised by topic.

When the doc is ready, show it to Matt and ask: "Ready to send? I can
also save this to a specific file if you have a path in mind."

---

## For Matt — quick FAQ

**"Do I have to do all of it?"**
No. Topic 4 (MCP contract) is the most operationally blocking. Topics
1, 2, 6 (methodology + SOPs) are the highest leverage. Skip whatever
you don't have time or strong views on.

**"What if I disagree with how something is framed?"**
Tell your Claude. We'd rather know. Florence's design isn't fixed yet.

**"What if I want to share a file?"**
Mention the path or filename to your Claude. The interview output will
list everything Dorian should look for. You can email files to Dorian
separately or drop them in a shared Drive folder.

**"What if I want to think about something and come back?"**
Tell your Claude "let me come back to that" — it'll move on and
remind you at the end.

**"How long will this take?"**
Quick pass: 20 minutes (just topics 1, 2, 4, 7). Full pass: 60–90
minutes. Doesn't have to be one session.

**"Can Dorian see what I'm typing as I go?"**
No — this all happens in your own Claude. Only the final
`florence-matt-answers.md` you choose to send goes back to him.
