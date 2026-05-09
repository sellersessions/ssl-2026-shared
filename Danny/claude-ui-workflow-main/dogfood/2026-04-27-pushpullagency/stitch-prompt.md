# Stitch design brief — Push-Pull Agency homepage

> Stage 6 deliverable. the operator pastes this into Stitch. Routes to **3.1 Pro** (locks.json::must_preserve_copy = true).

## Brand at a glance

**Push-Pull** — full-service Amazon agency, Bournemouth UK. Wordmark is `Push-Pull` with the hyphen, title case. B2B confident, data-led, premium-professional. Audience: ambitious DTC brands scaling on Amazon UK / EU / US.

## Visual direction (Stitch should infer the design language from this)

| Token | Value |
|---|---|
| Theme mode | **Dark** |
| Background | Carbon charcoal `#0e0e10`. Surface variant `#16161b` for cards. |
| Text | Warm off-white `#f5f4ee` (NOT pure white). Muted: 60% alpha. |
| Accent | **Single bold accent — cobalt blue `#1f5cff`**. Used decisively, not sprinkled. |
| Section pattern | Most sections dark. **TWO sections flip to full cobalt-blue background** (Stats strip + Final CTA block) for juxtaposition — bold blocks of saturated colour against carbon. |
| Typography | Clean sans-serif throughout. Very bold weights for hero + stat callouts (treat the seven stats as display-scale numerals). Inter / Manrope / DM Sans family. |
| Layout | Grid-led, structured. Centered hero with generous whitespace, card grid for services on dark surface, horizontal client-logo strip with logos rendered white/grayscale, alternating dark + cobalt-block sections. |
| Roundness | Minimal — sharp corners or subtle 4-6px radius. **Not** pill buttons. **Not** rounded-2xl glass. |
| Imagery | Real client logos in white/grayscale on dark; product photography deeply contrasted; team workplace shots if any. **Not** abstract gradients, **not** illustrations, **not** glass blur effects. |
| Personality | Professional, premium, B2B-confident, data-led. **Not** playful, **not** creative-agency-quirky, **not** tech-bro startup. |

## Section blueprint (top → bottom)

> Background colour pattern: D = dark `#0e0e10`, **C** = cobalt block `#1f5cff`. The cobalt blocks are deliberate juxtaposition — full bleed, big impact.

1. **Header / nav** [D] — Logo `Push-Pull` left in off-white. Nav: `Services` (with dropdown of 7 sub-items below), `Case Studies`, `Blog`, `About Us`, `Contact us`. Mobile: drawer.
2. **Hero** [D] — Headline + subhead + primary CTA. Centered, generous whitespace. Primary CTA button = solid cobalt on dark.
3. **Stats strip** [**C**] — *Full cobalt-blue background.* Seven headline numbers laid out big and bold in off-white, treated as a confident shout. This is the first juxtaposition block.
4. **Services grid** [D] — Six service cards on dark surface (`#16161b`), each: name + one-line description + "Learn More" link with cobalt hover state.
5. **Client logo strip** [D] — Thirteen brand logos in white/grayscale on dark. Horizontal row.
6. **About / story** [D] — Headline + body paragraph centered.
7. **Case studies** [D] — Three case study headlines on dark cards with cobalt accents and "Read full case study" CTAs.
8. **Testimonials** [D] — Three quotes with anonymised role attributions, oversized quote marks in cobalt.
9. **Final CTA** [**C**] — *Full cobalt-blue background.* Big confident block: "Start your growth journey now" CTA in white-on-cobalt or cobalt-on-white inverted. Second juxtaposition block.
10. **Footer** [D] — Nav repeat + legal links (`Privacy Policy`, `Sitemap`) + company details on near-black.

## Locked copy — every string here MUST appear verbatim

### Hero
- Headline: **Scale Your Amazon Revenue Faster with Our Dedicated Growth Team.**
- Subhead: **We help ambitious brands dominate their Amazon categories through strategy, advertising, SEO, and operations – all managed by a specialist team.**
- Primary CTA: **Start your growth journey now**

### Story
- Headline: **Built for brands who take Amazon seriously.**
- Body: **We're specialists – not generalists. Born from real marketplace experience and deep Amazon expertise, we combine commercial strategy, SEO, advertising, creative, and catalogue operations into one seamless growth system.**

### Stats (all seven, verbatim)
- 17x revenue growth in just two years
- £430k to £7.2M
- 100+ non-compliant listings
- 70% market share
- 70+ optimised SKUs
- +900% Year 1 growth
- Six years of sustained excellence

### Services (six, verbatim)
1. **Account Management** — Your dedicated Amazon department across UK, EU, and US. Four-person brand teams handle everything, from daily operations to strategic growth.
2. **Advertising Management** — AI-powered optimisation meets expert strategy. Reduce ACoS, maximise ROAS, and scale profitably across all ad formats.
3. **Copywriting & SEO** — Keyword-rich copy that ranks page one and converts. A9 algorithm mastery meets persuasive writing.
4. **Creative Services** — High-converting creative built for performance. Optimised Images, A+ Content, and Brand Stores.
5. **Catalogue Management** — Proactive operations protecting revenue 24/7. Continuous monitoring, rapid suppression resolution, flawless catalogue health.
6. **Strategy & Consulting** — Data-driven strategy transforming tactics into growth. Audits, intelligence, and roadmaps for profitable scaling.

### Client logos (thirteen, verbatim — display as logos or text)
Scrub Daddy · Molton Brown · JLab Audio · Scalextric · Peaty's · Kinetik Wellbeing · Hornby · EXG Pro · Enmo · Cloetta · Beams International · Anda Seat · Airfix

### Case study headlines (three, verbatim)
- Leading Vision care Brand
- Best Selling Drinks Gifting
- Global Audio & Electronics Brand

### Testimonials (three, verbatim — preserve role-only attributions, no invented names)
1. *"Partnering with Push-Pull has been a game-changer...they have helped us grow our Amazon Europe business by almost 17x in just 2 years!"* — Global Consumer Electronics Brand Amazon Account Manager
2. *"The Push-Pull team have been instrumental...they began to add value from day one...with recommended changes...shaving an immediate impact in terms of conversion and glance views."* — Leading Vision Care Brand Product Manager
3. *"When we first launched on Amazon, we had several operational and knowledge gap challenges. Ben and the Push-Pull team provide amazing insight..."* — Leading Drinks Gifting Brand Sales Director

### Footer
- Address: **Suite 113 Smartbase Target Road, Aviation Park West, Christchurch, England, BH23 6NW**
- Company: **Push-Pull Associates Ltd, Registered in England & Wales: Company No. 11880052**
- VAT: **VAT No. 346257587**
- Legal links: **Privacy Policy** · **Sitemap**

## Anti-drift rules — DO NOT do any of these

- **Do NOT** use `PUSH PULL`, `Push Pull` (no hyphen), `PushPull`, `PUSHPULL`, or `Push & Pull` — wordmark is **Push-Pull** with the hyphen.
- **Do NOT** invent fake awards, brand counts, or stats. Only the seven stats above may appear.
- **Do NOT** invent testimonial attribution names. Attributions are role-only and anonymised — preserve that anonymity.
- **Do NOT** paraphrase any verbatim string (e.g. "17x revenue growth in just two years" → "17x in 2 years" is a fail).
- **Do NOT** add fake review counts, "Trusted by hundreds", "Voted #1", "Award-winning", or "world-class agency" framing.
- **Use Stitch DESIGN.md for color / typography / layout only** — text content comes exclusively from source-truth.json + this brief.

## Output expected from Stitch

Single-screen homepage HTML (or React if Stitch defaults that way) implementing the section blueprint above with the locked copy embedded verbatim. After ZIP export, Claude will write the final `full-page-merged.html` locally — Stitch's job is the design language, not the copy.
