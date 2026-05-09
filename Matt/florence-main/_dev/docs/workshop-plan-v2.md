# Florence Workshop — Plan v2

Revised after Matt sync, 2026-05-01. Replaces v1.

---

## What Changed Since v1

| v1 Assumption | Reality (from Matt sync) |
|---------------|--------------------------|
| Solo Keplo + PP workshop, 50 min | **Part of Danny's session, ~1 hour, 3+ presenters** (Danny, Matt, Dorian) |
| One deliverable: Florence | **Multiple deliverables**: Florence + Systems Consultant Agent + Ethical Prompt Injection skill + LORAs primer |
| Live demo on audience-picked ASIN | Format unclear — workshop (step-by-step) vs. show-and-tell. **Must clarify with Danny.** Matt's read: show-and-tell with optional follow-along. |
| Slides forbidden, work around it | Same, but specific workaround agreed: **agents output styled HTML/PDF "slides" at each stage**, plus a "make it pretty" skill on top of default markdown |
| Q&A via raised hands during talk | **WhatsApp/Telegram group + AI support bot** trained on workshop content to handle "stuck" questions in real time |
| Florence as MCP or repo (TBD) | **Repo (zip from GitHub).** Danny's preference. Note tension: "each connection needs separate DB per user" is a known concern |
| Domain unsourced | Matt registering **meetflorence.ai or florence.com** |
| Architecture from scratch | **Hermes Agent flagged as reference architecture** (self-correcting, auto-updating semi-RAG). Matt to review. |
| Image gen TBD | **Matt's GPT-2 system already built**, $500 capped API pattern proven from previous Seller Sessions |
| Florence as the workshop's main idea | **Bigger thesis: "systems vs. AI slop."** Florence is one example of a connected system; Dorian's Systems Consultant is the framework that produces such systems |

---

## Confirmed Decisions

1. **Three build tracks, one narrative.** The workshop is about *connected systems that replace the "AI slop" of disconnected tools.* Florence and the Systems Consultant are two sides of the same idea.
2. **Distribution: GitHub repo / zip.** Danny's call. Florence is downloadable, installs locally, ships with $500-capped shared APIs that fall back to the user's own keys.
3. **Domain: Florence (Matt securing meetflorence.ai or florence.com).** Drop "florence-cro" branding from v1.
4. **Owner split:**
   - **Matt** — presenter, case studies, live demos, LORAs primer, Ethical Prompt Injection skill, GPT-2 image gen integration, PP MCP
   - **Dorian** — Florence integration & flows (80% already built), Systems Consultant Agent, "make it pretty" output skill, support bot architecture
   - **Joint** — narrative, dry runs, support bot training data
5. **Slide workaround.** Build branding/PDF output into the agents themselves. Each stage of an agent's run can emit a styled HTML "slide." A standalone skill makes any markdown "look pretty."
6. **Support bot.** WhatsApp or Telegram group. AI bot trained on the workshop content to answer "where do I click / how do I upload / why isn't it loading" so presenters aren't interrupted.
7. **Monday team meeting** — 1 hour earlier than today's slot. Bank holiday in PL/UK; Dorian making time anyway.

---

## Still Open — Must Clarify With Danny

Action: **Dorian summarizes meeting and sends to Danny today.**

1. **Workshop vs. show-and-tell?** Step-by-step where everyone follows along, or "here's what we built, use it later"? This is the single biggest unknown — drives every other decision.
2. **Paid APIs OK?** Confirmed plan: temp shared APIs with $500 caps, then BYO keys. Need Danny's sign-off.
3. **Pre-workshop course completion assumption.** Can we assume attendees know what an MCP, SP-API, Claude Code is — or do we front-load that?
4. **Wi-Fi for 100+ devices** — confirmed shaky. Danny mentioned video backups. We need to plan local-only fallbacks for any live demo.
5. **Joint sessions vs. separate slots?** Matt's question — could the three of us do it together rather than three separate handoffs.

---

## New Workshop Structure (60 min, draft)

This is a draft for the Monday meeting. Adjust after Danny clarifies format.

| Time | Segment | Presenter | Build Required |
|------|---------|-----------|---------------|
| 0–5 | Hook: "AI slop vs. connected systems" + Florence Nightingale story | Joint or Matt | None (slide moment, but as styled HTML) |
| 5–12 | **LORAs primer** — what they are, examples (Higgsfield, Open Art), the influence-the-model concept | Matt | None — informational |
| 12–22 | **Ethical Prompt Injection skill** — articles with "summarize in ChatGPT/Claude/Perplexity" buttons that bias the shopper's own LLM toward your brand | Matt | New skill (P0) |
| 22–40 | **Systems Consultant Agent** — interview agent that asks about your business and outputs a custom roadmap of automated systems with API docs, tools, pricing, flowcharts | Dorian | New build (P0) |
| 40–55 | **Florence live demo** — onboarding → poll → objection ranking → image blueprint → ClickUp task hand-off | Both (Matt presents, Dorian operates) | Existing flows + integration (P0) |
| 55–60 | Repo handoff + QR code + how to install + Q&A | Joint | Repo packaging |

Throughout: WhatsApp/Telegram support bot answering "stuck" questions in real time.

---

## Three Build Tracks (Detail)

### Track 1: Florence (Dorian, mostly existing)

What Florence becomes after the Matt sync:

- **Repo, not MCP.** GitHub-distributed, installs locally.
- **MD-file brain.** `florence/brain/` folder with files for: business profile, products, competitors, key personnel, polls, tests, recommendations. Persistent knowledge.
- **`onboard` command** — interviews user about business and writes the brain files. Same pattern Dorian's using for the Systems Consultant.
- **Personality + soft features** — Florence has a voice, signs off her own way, references shared history.
- **Plugs into ClickUp / Notion / project mgmt** — not just a chat agent. Sends daily messages to brand managers, creates tasks, logs data to the database. Lives inside the workflow.
- **Hermes Agent reference** — Matt to review; Florence's self-correcting + auto-updating loop should follow that pattern.
- **GPT-2 image gen via Matt's existing system.** 5¢/image, $2.50 to apply all 50 techniques.
- **PP MCP** — Matt to ensure live for the workshop demo.

### Track 2: Systems Consultant Agent (Dorian, new)

The framework that produces things like Florence. Replaces a $200K/year consultant.

- **Interview agent** — same `onboard` pattern. Asks about business, team, departments, goals, current pain.
- **Roadmap output** — full report: highest-ROI automations to build, with rationale.
- **Tool catalog** — embeds API docs and patterns for: Keplo AI, Rainforest, SellerApp, SERP API, Supabase, 3JS, Figma, ClickUp, n8n, Claude Code MCPs.
- **Pricing + pros/cons per recommendation.**
- **Flowcharts** via Scaliger MCP (visual system diagrams).
- **Weekly auto-update** — refreshes the tool catalog so it doesn't go stale.
- **Florence as a recommendation** — when the consultant identifies "you need a data analyst," it recommends Florence. Self-promoting, in a good way.
- **Drawn from Ideal Direct work** — Sim's ClickUp + back-end automation system is the case study.

### Track 3: Ethical Prompt Injection Skill (Matt, new)

A skill that ships in the Florence repo (or standalone).

- **Generates AEO-optimized articles** answering "people also asked" Google questions. Already a known tactic.
- **Adds three buttons:** "Summarize in ChatGPT / Claude / Perplexity."
- **Buttons inject a prompt** engineered to leave the brand persistent in the shopper's own LLM memory.
- **Use case:** software comparison pages biased toward your product; supplement brands biasing future "best melatonin" queries.
- **Demo case study** — pick one brand, run it live or near-live during Matt's section.

### Plus: LORAs Primer (Matt, no build)

5–10 min informational. Shows examples from Higgsfield / Open Art. Tees up the "you can't always train your own model — instead, build an AI employee with persistent knowledge that works like a LORA" narrative bridge into Florence.

### Plus: Workshop Support Bot (Joint, new)

- **Platform:** Telegram (group chats with bots are easier than WhatsApp).
- **Trained on:** the three repos + this plan + the live presentation script.
- **Job:** answer "where do I click / how do I upload / why isn't it loading" instantly so the room doesn't grind to a halt.
- **Escalation:** if it can't answer, pings the off-stage presenter.

---

## Updated Build Plan

| Day | Owner | Deliverable |
|-----|-------|-------------|
| Mon | Joint | Team meeting (1 hr earlier than usual). Lock format with Danny if reply received. |
| Mon | Matt | meetflorence.ai / florence.com registered. PP MCP ready for live demo. |
| Mon | Dorian | Florence repo scaffold. MD brain structure. `onboard` command. |
| Tue | Dorian | Systems Consultant Agent v0 — interview flow + tool catalog skeleton. |
| Tue | Matt | LORAs slide deck (HTML format) + 1 case study draft. |
| Wed | Dorian | Florence Skills 1+3 wired into ClickUp + Slack. "Make it pretty" output skill. |
| Wed | Matt | Ethical Prompt Injection skill v0 + a brand to demo it on. |
| Thu | Dorian | Florence Skills 2+4. Systems Consultant flowchart output via Scaliger MCP. |
| Thu | Matt | Live demo script. PP polls pre-launched as backup. |
| Thu | Joint | Support bot trained on accumulated content. Telegram group set up. |
| Fri | Joint | Full dry run end-to-end. Record backup video of every demo. |
| Sat | Joint | Buffer day. Bug-fix only. |
| Sun | Joint | Repo public. README finalized. QR code printed on handouts. |

---

## Action Items (from Matt sync)

- [ ] **Dorian** — summarize meeting, send to Danny (today)
- [ ] **Joint** — clarify with Danny: workshop vs. show-and-tell format
- [ ] **Joint** — clarify with Danny: paid APIs in shared tools OK?
- [ ] **Matt** — register meetflorence.ai or florence.com
- [ ] **Matt** — develop case studies + practical demos
- [ ] **Matt** — review Hermes Agent as Florence architecture reference
- [ ] **Dorian** — build/integrate Florence agent + MCPs + workflows
- [ ] **Joint** — set up WhatsApp or Telegram group for live Q&A
- [ ] **Joint** — add AI bot to support group, train on workshop content
- [ ] **Joint** — Monday meeting, 1 hour earlier than today

---

## Workflow Inventory — Delta from v1

The 37-workflow plan in `florence-n8n-workflow-plan.md` still holds for Florence itself. Add:

**New P0 workflows for the broader workshop:**

| # | Workflow | Track | Notes |
|---|----------|-------|-------|
| 38 | `consultant-interview-agent` | Systems Consultant | Interview flow, writes business profile to MD brain |
| 39 | `consultant-roadmap-generator` | Systems Consultant | Produces the full report from interview output |
| 40 | `consultant-tool-catalog` | Systems Consultant | Loads API docs + patterns for Keplo / Rainforest / SellerApp / SERP API / etc. |
| 41 | `consultant-flowchart-render` | Systems Consultant | Calls Scaliger MCP to draw system diagrams |
| 42 | `consultant-weekly-refresh` | Systems Consultant | Auto-updates tool catalog (P2 — only after we know who's using it) |
| 43 | `injection-article-generate` | Ethical Prompt Injection | AEO-optimized blog post writer |
| 44 | `injection-summarize-buttons` | Ethical Prompt Injection | Embeds the 3 LLM buttons + crafted prompts |
| 45 | `florence-make-it-pretty` | Florence | Wraps any markdown output as styled HTML "slide" — solves Danny's "no slides" rule |
| 46 | `support-bot-answer` | Support Bot | Telegram bot answering workshop questions, escalates to off-stage presenter |

**Total now: 46 workflows. P0 count: ~17 (need to triage on Monday).**

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Format unclear until Danny replies | Build for show-and-tell (lower-risk default), pivot to workshop if Danny insists |
| Wi-Fi fails with 100+ devices | Local-only fallback paths for every demo. Pre-recorded videos as final backup. |
| PP poll latency in live demo | Pre-launch polls Tuesday/Wednesday; show "live" results from already-collected data |
| $500 API cap exhausts during workshop | Documented BYO-key path on every tool. Tested before Friday. |
| 100 attendees at different skill levels | Support bot absorbs basic questions; presenters never stop for "where do I click" |
| Hermes Agent has constraints we don't know | Matt reviews this week; if blocking, fall back to Dorian's existing self-correcting cron pattern |
| Codex vs. Claude Code politics | We commit to Claude Code (Dorian's stack). Mention Codex as "also good" if asked. |
| Slide ban interpreted strictly | "Make it pretty" skill produces HTML output that Danny has explicitly allowed |

---

## What v1 Got Right (Keep)

- Florence Nightingale framing
- 4 core skills (Market Informant, Variation Engine, Shopper Interrogator, Evergreen Tester)
- Keplo Prioritization Framework (40/30/15/15) — Florence's scoring layer
- "She lives in Slack, has a daily rhythm, ends every brief with one specific action"
- Memory/continuity via Supabase + MD brain
- Open-source, MIT, joint repo
- Recorded backup mandatory for live demo

## What v1 Got Wrong (Fix)

- Treated this as a Keplo+PP workshop instead of part of Danny's broader event
- Single deliverable focus — missed Matt's LORAs primer + Ethical Prompt Injection
- Missed Dorian's Systems Consultant Agent entirely (the real "framework" piece)
- No support-bot plan for the inevitable basic-question deluge
- Underestimated the slide problem — needed a "make it pretty" skill from day one
- Didn't account for Hermes Agent / Marble ISM as architectural references

---

## Next Step

Send meeting summary to Danny today. Get format clarified. Re-triage P0 workflows on Monday once we know whether this is "follow along" or "watch and download."
