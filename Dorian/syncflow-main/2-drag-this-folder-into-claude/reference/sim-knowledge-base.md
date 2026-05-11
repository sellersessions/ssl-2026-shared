# Sim Mahon — Knowledge Base

A first-person knowledge base for training agents on how Sim thinks, runs Ideal Direct, and applies AI automation across the business. Captured via interview, lightly structured but **voice-preserved**.

> **Why this file exists.** Dorian's `reference-architecture.md` distils principles. This file preserves Sim's voice so syncflow can quote him directly when summoning the **Amazon expert** persona ("a copy of Sim"). When the agent needs to channel Sim — on operational discipline, build vs buy decisions, the bottleneck-hunt method, or Amazon-specific judgement — it reads from this file.
>
> **Source:** Interview, captured 04/05/2026. Reviewed by Sim before commit.

**Business context:** Ideal Direct, ~£20M revenue 2026, ~85% Amazon, primarily UK/EU with USA scaling. Target: £100M in 5 years. Director-led (Sim + co-director Jack).

---

## 1. Vision & Long-Term Plan

### The 5-year picture
The business will hit £100M without scaling headcount proportionally. The whole bet is that AI automation runs throughout the business, removing bottlenecks from key players and stripping admin out so people can focus on thinking.

The reason it has to work this way: we're already losing money to gaps in the system. Recent example — we paid a supplier deposit but nobody followed up to confirm production should start. That single missed handoff cost us 9-10 days. Completely avoidable. Now extrapolate that across hundreds of products, hundreds of orders, dozens of staff. The micro-optimisations either happen or you bleed inefficiency everywhere.

That's why we've gone deep on ClickUp 4.0 AI — it's the operating system. Flows and super agents inside ClickUp let us scale without piling on headcount and the chaos that comes with it.

### Geographic mix
Currently UK/EU heavy. USA is the new lever — first time we're really scaling it. The path to £100M runs through the US.

### Where Sim spends time personally
1. **Product research and vetting** — new launches, continuous pipeline. Always hands-on with priority launches.
2. **Interviewing the team** — going person by person, mapping their AI use, finding what's blocking them, unblocking it.

### The "AI proficiency = employee proficiency" thesis
Important observation: AI has made the best people work faster and at a higher level. The less proficient have been left behind. They cannot keep up with the current pace. It's now a yardstick — if someone is good at AI, they are probably a good employee. Full stop.

---

## 2. The Bottleneck Hunt — Operating Method

The repeatable pattern Sim runs across the business:

1. **Interview the person** about how they actually spend their week.
2. **Find the time sink** — the thing eating hours that nobody else sees.
3. **Go down the rabbit hole** with Claude / AI tools to ask: can we speed this up, or can we remove the human from the loop entirely?
4. **Build the fix** — usually a custom flow, plugin, or branded tool tailored to that person's job.
5. **Validate** outputs are accurate and consistent every time.

### Case study: image uploads (15 hrs/week recovered)

**The bottleneck:** One employee was spending ~15 hours a week on Amazon image uploads. Workflow was: go into Figma → download files → upload to OneDrive → rename → coordinate with brand runners on ordering → upload via Seller Central. Slow, error-prone, and Seller Central uploads are slower than the Listings API anyway.

**The investigation:** Claude helped identify the human wasn't actually needed. Designers already had the source-of-truth in Figma.

**The fix:** Built a Figma plugin that links into a nanobanana flow which publishes images directly to the correct Amazon detail pages in the right order. Human all but removed. Saves her time AND uploads are perfectly accurate to the Figma "UPLOAD" pages every single time.

### Case study: branded documents (consistency at scale)

**The bottleneck:** Multiple people creating purchase orders, QC inspection reports, etc. Outputs looked terrible, disjointed, inconsistent across employees.

**The fix:** Built a branded-document flow inside Claude Cowork, bespoke to each employee. They tell it what they need, it creates a perfect on-brand document every time. Internal and external outputs now adhere to standard automatically.

### Why this method works
You can't fix what you don't see. Most bottlenecks are invisible from the org chart — they live in the texture of someone's week. Interviews surface them. AI then makes the fix economic, because building a bespoke tool for one person's workflow used to be impossible to justify; now it takes hours, not weeks.

### How the interview actually runs

**Step 1: Clockify before conversation.** Get the person on Clockify (free, off-the-shelf — would have vibe coded my own alternative but didn't need to) so their week gets tracked at the task level. You need data, not opinions, before the conversation starts.

**Step 2: Walk through the timesheet together.** That's where the waste shows up. You spot the obvious chops. More importantly, you spot what surprised you — usually it's the volume of work coming sideways from other people on the team. Employees are almost always doing more than the org chart suggests because of intra-team requests nobody else sees. Hidden work is the rule, not the exception.

**Step 3: Identify what to cut.** Not optimise — *cut*. The default ambition is removal, not acceleration.

### The automation filter: remove vs. accelerate vs. leave alone

Default to **removing the human entirely** wherever possible. Only leave the human in the loop when there's a genuine taste-or-quality judgment call that machines can't be trusted on. The image-upload work was pure mechanical execution — humans gone. Branded documents still need a person describing what the document is for and reviewing the tone — human stays, but moves at AI speed.

The bias matters: most leaders default to "speed it up." That keeps the labour cost in the system. The right starting question is **"why is a human here at all?"**

### Who builds the tools

A core principle: **domain experts build with Claude, not programmers.**

Each department has someone steering the builds. Finance and supply chain have their own person working on automations for those teams — Sim is deliberately kept out of the loop. Sim builds for his own department (product / commercial side).

Why: you don't want a generic developer parachuting in without understanding the work. They produce generic outputs and you end up in long iteration cycles giving feedback. The person closest to the work — the founder or major stakeholder — should have at least **80% say in the final output**, describing exactly what's needed at every step. That's how you avoid the "looks right, doesn't fit" trap.

The pattern: **domain expert + Claude + 80% specification authority = the right output, faster.**

---

## 3. Automation Philosophy

### Build vs buy vs ignore — the decision

It's purely time and cost.

- **If there's a viable free alternative, use it.** Clockify is the example — fine product, free, no reason to reinvent it.
- **If it takes 20 minutes to vibe code something that saves time going forward, build it.** That's a no-brainer.
- **Look-and-feel matters when there are external eyes on it.** The 3PL stock portal is the case in point: clients log into our warehouse system to see their stock. We could have given them LinnWorks access (free, ugly) or pointed them at a generic tool. Instead it took minutes to build a portal that looks professional and on-brand. Tiny cost, massive perception upgrade. Worth it every time when external stakeholders are in the picture.

The filter isn't "can I build it?" — of course you can build almost anything now. It's **"does building it pay back in time saved or perception lifted, vs. just paying for the off-the-shelf?"**

### What "good automation" looks like

Repeatable. Doesn't break. Trustworthy.

You don't want to be:
- Watching scheduled tasks die because your laptop went to sleep
- Wondering if a local model is up
- Babysitting your own infrastructure

It needs to **work 100% of the time and scale no matter how much load you put on it.** That's the bar. If a flow only runs when your computer is open, it isn't an automation — it's a chore with extra steps.

The smell of a bad automation: anything where you're the single point of failure. Local n8n instances. Cron jobs running on your Mac. Anything that breaks the moment you go on holiday.

### Why failures are rarely "killed"

Most things in the workspace that look unfinished aren't killed projects — they're 80%-complete builds either waiting on someone else to finish, parked behind a flaky local dependency (a local n8n instance that needs to come back up), or superseded once a better way to do it appeared elsewhere. The codebase looks messier than the operating reality.

---

## 4. Planning & Execution

### The prioritisation rule

**Lowest-hanging fruit + biggest unlock = priority one.** Always.

Not "most interesting." Not "newest idea." Not "most ambitious." The thing that is cheap to do and shifts the most load gets done first. Everything else queues behind it.

### The 80% handoff

The execution model: take things to 80%, hand them off to be finalised. Sim is fortunate to have someone who can pick up and finish — that's a luxury not everyone has.

If you don't have a finisher, you have to be the finisher yourself. Which means **the founder/builder needs to actually understand the boring last 20%:** authentication layers, deployment, hosting. Those are the things that turn a working prototype into a tool the business can actually rely on. It gets easier over time, but you can't skip the learning curve.

This is one of the reasons "working local" projects stay working local — without that finisher discipline (yourself or someone else), the deploy gap stays open.

---

## 5. Use Cases — The Highlight Reel

Pulled from the Mastermind deck plus live work. Structured as four narrative sections: Creative Engine → Operational Efficiency → Proprietary Stack → SaaS-Free Infrastructure. The thread running through all of them: **take a real bottleneck, build the bespoke fix, own the tool.**

### I. The Creative Engine

**01 — Image upload bottleneck.** Listing specialists were burning 15 hours a week on manual uploads and Seller Central errors. Built a Figma plugin that pushes straight to the SP-API Listings endpoint. Two steps cut from the flow, images live faster, human all but removed.

**02 — Multi-market localisation.** Pan-EU listings used to need manual translation per market — slow, inaccurate, a bottleneck on every launch. Figma AI translations baked into the design workflow. One source asset, every market in parallel. 4:1 ratio of EU markets per designer, same-day deploys.

**03 — AI product imagery.** Pure AI generation doesn't work for product photography — renders take forever, textures look wrong, finishes go off-brand. The fix: render a basic 3D base shell, then wrap it in true-to-life texture using real reference imagery via Nano Banana. 5× faster than the previous workflow, results actually beat what we had.

**04 — Yogii: knowing when to stop.** Building a yoga app with 100+ poses. AI-generated pose imagery couldn't get hands, alignment, or feel right. The lesson: recognise the ceiling. AI built the platform (Next.js 16, Supabase, Framer Motion). Then we booked a real instructor and a professional photoshoot for the actual content. **AI does 50%, a real human finishes the product.** That's the most important slide in the deck.

### II. Operational Efficiency

**05 — Sponsored Brand coverage.** Gaps across the catalogue on high-performing SB ad slots because assets were the bottleneck. Built a Brand Asset App that reads ASIN data and generates images and videos at scale. ~10 minutes to get a video ready to track. 100% catalogue coverage.

**06 — Creator & influencer management.** Influencer ops were running on spreadsheets — unprofessional, impossible to scale. Built a bespoke creator CRM ([rootedcreators.com](http://rootedcreators.com)) with in-app chat, brand-tailored workflow, owned data. No per-seat fees, ever. **Data owned, never rented.**

**07 — Branded documents.** QC reports, compliance briefs, supplier comms — every team wastes hours formatting them, every output looks inconsistent. Built a Cowork project that turns a prompt into a print-ready, fully on-brand HTML document. Cowork is easier than Claude Code for non-technical staff, so they self-serve.

**08 — WhatsApp outreach (Nikita).** D2C customer outreach has gone generic, email open rates are collapsing. Built an n8n flow that ships a bespoke video to each customer over WhatsApp. They watch, they reply, you talk. Two-way conversation, not broadcast — at scale.

### III. Proprietary Stack — Replace SaaS

**09 — Advanced PPC, in-house.** Scale Insights was buggy, expensive, opaque. Glitchy rank tracking sent placement modifiers awol. Built it in-house with 7-day median rank logic and AI-written recommendations. **~$6K/year of SaaS replaced.** Every rule visible.

**10 — Demand planning, not forecasting.** Forecasting off historical sales caused overstock and stockouts. No one owned the number. Switched the whole approach to demand planning — SQPR and search-volume signals as inputs, brand managers accountable for the output. **Hit 98% in stock for the first time ever.**

**11 — Buybox repricer.** SFP (Seller Fulfilled Prime) is pure margin, especially on multipacks. But the 7pm cutoff hands buybox to FBA — and off-the-shelf repricers can't navigate the switch. Built a custom repricer that holds buybox on SFP all day then hands cleanly to FBA at 7pm. Margin maximised throughout the day.

### IV. SaaS-Free Infrastructure

**12 — Hyper-local intelligence.** The US marketplace is enormous and delivery estimates differ across time zones and ZIP codes. Most Amazon scrapers won't change ZIP, so national rank hides regional Prime delivery issues that quietly kill conversion. Using the Rainforest API we can scrape rank and delivery speed at ZIP-code level into our own database. Useful in particular for new launches: see where stock coverage is real and only ramp up where Prime times look right. No point blasting ads if New York is showing five-day delivery.

**13 — SQL MCP for everyone.** Power BI charges per user, so only the data team queries it. Brand managers wait days for answers, issues get flagged a week late. Built a bespoke SQL database MCP — anyone on the team queries live data through Claude in plain English. Hours, not weeks. Bespoke Power BI replacement app coming next.

**14 — The local stack, running overnight.** API costs mount, research waits for daytime attention, image generation sits behind someone's clock. Set up a local GPU server running open LLMs and ComfyUI. Research agents compare brand analytics to catalogue overnight. Hundreds of images and ideas generated by morning. **API costs drift to zero.**

**15 — ClickUp for AI (the operating system).** Every automation win was sitting in its own silo — tools, teams, handoffs, things slipping between cracks. Building a full operating system inside ClickUp: idea → research → launch → ongoing Amazon maintenance, end-to-end. Super agents inside the flow chase work, organise data, escalate gaps. **Outside companies quoted ~£70K to build this.** 4 months in.

### The pattern across all 15

- Every case starts with a real, named bottleneck owned by a real, named person.
- The fix is bespoke, not generic — built around the actual workflow, not adapted from a SaaS template.
- Tools owned, not rented. Data owned, not rented. Per-seat fees rejected by default.
- "Working" means it runs without you. If your laptop being open is part of the dependency chain, it isn't shipped.
- AI does ~50–80%. The rest is domain expertise (Yogii's instructor, the brand manager owning the demand number, the team finisher closing out the deploy).

---

## 6. Issues, Blockers & Honest Truths

### The real frustration: the final 20%

Ideas are easy to think up. The plan is easy to write. The first generation out of the app is exciting. **The pain is everything between that first output and the finished thing.**

The Sponsored Brand video generator is the example. Outputs were poor and consistent in their poorness. Baking the text was a problem. Getting the flow right between hooks and customer-objection handling was a problem. You could see it was close — but the back-and-forth to actually finish it was enormous. That's the recurring story. Not "AI can't do it." More like **"AI does 80% in an hour and the last 20% takes a week."**

This is also why deployment, hosting, and auth are the silent killers — they're part of the same final-20% gap. You can build things much faster than you can finish, ship, and trust them.

### The org chart is splitting in two

What's actually happening inside the business: **management and elite-level staff are taking themselves to the next level with AI. Task-doers are waiting for tools or flows to be built for them.**

Both still serve a function in the short term — somebody needs to do the work while the tools are being built around them. But longer term, that gap has to be addressed honestly. The hiring filter going forward looks different from the one that built the team to here.

The honest sub-point: **employees won't drive their own automation hard, because they don't want to be automated out of the job.** They'll be hesitant. The best ones flip this — they understand that if they ship more with AI they grow with the business. That's the mindset to hire for and to develop in the people you already have.

### The 10x asks

**1. An AI-fluent full-stack developer.** This is the unlock for most e-commerce businesses serious about scaling. Even a freelancer who can take a project, understand what it's trying to achieve, and *finish* it — that role is undersupplied and disproportionately valuable. Domain expert + AI gets you to 80%; the missing piece is someone who closes the last 20% reliably.

**2. The founder has to be the interviewer.** Not because it's the most efficient use of founder time, but because no one else has the authority. The founder can act like God — no internal guardrails, can change anything, restructure anything, automate anyone's job out of existence if it makes sense. An employee won't do that. They have political costs the founder doesn't pay. So the founder does the interviews, the founder spots the bottleneck, the founder commissions the build.

**3. Elite local models, especially video.** The vision: imagine a local video model good enough that you walk in tomorrow and there are 200 Sponsored Brand videos waiting for review across every product — all generated overnight, all for the cost of electricity. Imagery first (already nearly there with Nano Banana et al.), video later. Combine that with a local LLM analysing the entire Brand Analytics feed every night — what's moving, what's trending, how search behaviour is shifting — and feeding research opportunities back into a full product development flow. FBA-fee optimised, COGS roughly known, sourcing region suggested, hundreds of concept images per opportunity. Local models running 24/7 turns product research, creative generation, and analytics into solved problems at near-zero marginal cost. Some API costs at the edges, but the LLM cost line goes to zero.

### The unsexy truths (call-outs)

**Most of us are heavily distracted.** New tools every week. Hype train on YouTube pulling people between Claude Code and Codex week-to-week. The honest answer: pick a small stack, go deep, ship things. **Tool-hopping is procrastination dressed up as research.**

**One nuance — image generation is the exception.** When something genuinely better drops (the new ChatGPT image-gen vs. Nano Banana, for example), you should swap your flows over. Imagery quality compounds across every listing, every ad, every market — the upgrade pays back. Don't be loyal to the old tool just because you set it up first.

**OpenCode is wildly overhyped.** Hundreds of hours can disappear into optimising it for personal projects. Fine for tinkering. But anything that needs to run repeatably at scale or inside the business should be in **Claude Code or n8n** immediately — those are the trusted layers. The rule: hype-train tools belong in personal projects; the business runs on the boring proven stack.

---

## Closing — The Worldview in One Page

- **The bet:** £20M → £100M without proportional headcount, by automating bottlenecks throughout the business. AI is the operating leverage.
- **The method:** interview every employee, find the invisible time sinks via Clockify, default to *removing* the human (not just speeding them up), build bespoke fixes with domain expert + Claude (80% authority on the spec).
- **The build filter:** off-the-shelf if it's free and good. Vibe-code it if 20 minutes of work pays back. Build bespoke when external eyes lift the value of looking professional. Trust nothing that depends on your laptop being open.
- **The team thesis:** good with AI = good employee. The org chart is bifurcating between elite operators and task-doers. Hire and develop for the AI-fluent end.
- **The next unlock:** an AI-fluent full-stack finisher to close the last 20%. Then elite local video models for overnight scale.
- **The discipline:** stay focused on a small stack. Claude Code and n8n in the business; everything else is a personal project until it earns its way in.
