# Matt Kostan interview — 2026-05-05

**Subject:** Matt Kostan, CEO & Co-Founder, ProductPinion
**Purpose:** Knowledge capture for Florence — Shopper Interrogator skill, CRO SOPs, MCP contract, workshop operations
**Format:** Synthesised from live interview, uploaded decks, and supporting files

> **Archive note:** This is the canonical source-of-truth interview. The
> original referenced companion files as `knowledge/inbox/matt/...`; in
> this repo they were promoted to tracked locations:
> - `knowledge/cro/02-visual-content/main-image-tactics.{json,csv}` — 52-tactic library
> - Synthesised reference: `knowledge/cro/03-testing-methodology/`, `knowledge/cro/05-productpinion/`
> - Skills built on this: `.claude/skills/shopper-interrogator.md`, `.claude/skills/recommend-test.md`

---

## Topic 1 — A/B Testing Fundamentals

### What makes a good Amazon test?

A good Amazon test is one that gives you a decision you can actually act on with confidence. That means you're asking enough real shoppers — typically 50 per option — testing meaningful changes, and isolating variables so you know what actually drove the result.

In practice, that looks like testing one variable at a time, starting with bigger swings instead of tiny tweaks, and always testing in real-world context. CTR isn't about which image looks "best" in isolation — it's about which image wins when placed next to your actual competitors in search.

Other key principles:
- Make sure the question is neutral and not leading the shopper
- No result IS a result — it means your variations are too close to make a meaningful difference
- Have thick skin. Let people "insult your baby." Be open to feedback.
- Focus on clarity over creativity. The winning variant is usually the one that communicates fastest, not the one that looks nicest.
- A good test reduces guesswork and gives you a clear next move, not just an interesting result.

### Statistical significance thresholds

ProductPinion gives you a statistical significance number after every test. Here's how to interpret it:

- **50%** — If you ran the test again, there's a 50% chance you'd get the same winner. That's a coin flip. Your variants are probably too similar — consider making the differences more distinct.
- **60–69%** — Judgment call zone. Either make the variants more distinct, add more respondents to the same test, or run it again with bigger swings.
- **70%+** — Repeatable enough to act on. If you ran the test again, 70%+ of the time you'd get the same winner.

One of ProductPinion's exclusive features: you can add more respondents to the same test rather than relaunching. This is especially useful in the 60–69% zone — top up before deciding.

### Sample size rules

- **50 respondents per option** is the consistent rule of thumb for statistical significance.
- For a 5-option test, that means 250 respondents for a full read — though you can start with 100–150 and add more if there's no clear winner yet.
- ProductPinion lets you top up respondents on a live test. This is an exclusive feature worth using before calling a test inconclusive.

### Question framing rules

Bad question wording invalidates a test. Florence should apply these rules every time she writes a poll question:

1. **Keep it singular** — one question tests one thing. "Which is clearer and more trustworthy?" is two questions.
2. **Avoid superlatives** — "which is best" nudges people toward the safe answer. "Which would you click on?" is more behavioural.
3. **Use purchase-intent language** — "which would you be more likely to click/buy" rather than "which do you prefer." Preference and purchase behaviour don't always match.
4. **Don't explain the test in the question** — if you say "we're testing a new image," you've biased toward novelty.
5. **Match the question to the context** — a CTR test question should reference search behaviour ("you're browsing Amazon for X"); a CVR test should reference buying intent.
6. **Avoid loaded adjectives** — "which looks more professional" tells people what to value.
7. **Never start with a brand name** — speak to the category, not the specific product. You want to talk to the shopper's intent, not your brand identity. That way you're recruiting the right mindset before they even see the variants.

---

## Topic 2 — Test Types: CVR vs CTR

### The ProductPinion Tool Taxonomy

Florence needs to know which tool does what before recommending any test.

#### Pinion Videos
Screen recordings of shoppers answering questions out loud while browsing. Up to 3 questions analyzed per video. Each video is 3–5 minutes. Can be sent to any URL — live Amazon search results, a live PDP, a mocked-up simulation, a Shopify store (UI/UX, add to cart, bundle builder), or a Dropbox/Google Drive folder with prototype images or mock-ups. Essentially any URL where you want real shopper feedback.

Pinion Videos are never optional. They are always the recommended qualitative first step. They require more setup time, so a seller may choose to skip them for speed — but Florence should always recommend them as part of best practice.

#### Pinion Polls
One standalone test, one question type, one decision. You choose your sample size. Five types:

- **Image Split Test** — A vs B vs C vs D concept testing. Used for main image and creative concept testing.
- **Text Split Test** — test brand names, guarantees, bullet headlines, anything text-based.
- **Search Simulation** — 1:1 Amazon SERP mock-up, fully configurable. You pick the ASINs, set prices, hide or show reviews. This is ProductPinion's flagship test type.
- **Ranked Test** — rank images or text best to worst (e.g. "rank these secondary images in order of purchase likelihood"). Used for objection prioritisation in CVR work.
- **Stacked Image Test** — full gallery vs gallery. Old listing images vs new.

Pinion Polls are the default tool. Florence should figure out which poll type fits before reaching for Pinion Ask.

#### Pinion Ask
Multi-question survey in one sitting. More like Google Surveys. Each question costs one credit. Same respondent answers all questions sequentially. Types include:

- Single-answer
- Short-answer (open-ended)
- Multiple-answer
- Drop-down
- Price input
- **3-Second Test** — image shown for 3 seconds, "what did you gather?"
- **Listing Battle** — send to two listings, which is better?
- **Price Sensitivity** — Van Westendorp model (max price / good price / too cheap / too expensive)
- **Skimmer Test** — limited time on a page, feedback on what they retained
- **Blur Test** — blurred image, what do they comprehend?

Note: Ranking is NOT available in Pinion Ask. For ranking objections or images, use a Pinion Poll Ranked Test.

**Default tool hierarchy:** Pinion Polls first. Pinion Ask is a secondary option Florence should know exists but not default to.

**What's confirmed available in the MCP** (as of interview date — Florence should always check her actual tool manifest at runtime):
- Pinion Poll (standard)
- Pinion Poll — Ranked Test
- Pinion Ask — open-ended short answer (specifically: send shoppers to a live Amazon listing, ask "what's confusing about this listing?", free-text response)
- Full tool list subject to change as Pinion Ask MCP integration is still in progress

---

### The CTR Testing Workflow — Main Image Sequencer Strategy

When a seller's CTR is low, Florence follows this 5-step sequence:

**Step 1 — Pinion Videos (Qualitative Baseline)**
Send shoppers to a mocked-up or live Amazon search page. Ask: "Which would you click? What was most attractive? Which would you actually buy based on this search page?" Goal: understand what's getting *attention* — not what looks prettiest. This is qualitative focus-group feedback at scale. New competitors, title changes, and shopper language shifts (like "cruelty-free" and "vegan" appearing in a competitor's title) will surface here before any keyword tool catches them.

**Step 2 — Search Simulation Baseline**
Send 100+ shoppers (50 per option rule) to a mocked-up Amazon SERP with your product and closest competitors. Find out who is actually winning the clicks right now. This is your benchmark. Competitor selection rules:
- Match on price range and product style
- Match on review maturity — a new product isn't competing with a 10,000-review listing
- Use common sense: who are shoppers actually choosing between?
- **Recommended:** hide price and review count to isolate pure visual pattern interruption. When price and reviews are visible, shoppers anchor on them instead of the image. The name of the game for CTR is pattern interruption — what stops the scroll.

**Step 3 — Concept Creation**
Use Pinion Video feedback + baseline data combined to build new main image concepts. If the seller has no ideas, Florence uses the main image tactics library (52 tactics, see Topic 6) to generate suggestions.

**Step 4 — Image Split Test (A/B/C)**
Test the new concepts head-to-head using a Pinion Poll Image Split Test.

**Step 5 — New Concept Search Simulation**
Run the same baseline simulation with the new winning concept. Exclude previous respondents — they're now biased. Did click share go up vs. the baseline? If yes, ship it. This is ProductPinion's exclusive feature: exclude previous respondents from sequential simulations to get fresh eyes every time.

**Real result from this workflow:** CTR went from 7.07% to 14% in simulation (97.88% increase). On Amazon: CTR +16.84%, CVR +14.29%, +$19K/month revenue. Cost to run all tests: $447. ROI: 4,286%.

---

### The CVR Testing Workflow

When a seller's CTR is fine but CVR is low, people are clicking but not buying. The listing is doing something wrong after the click.

Core principle: **A confused mind never buys.** Your job is to remove every objection and doubt before the shopper leaves the page. Amazon data (2022): 28% of purchases happen in 3 minutes or less. 50% of purchases happen in 15 minutes or less. You're winning or losing the impulse buy.

**Step 1 — Pinion Videos (Qualitative)**
Send shoppers to the live listing. Ask: "What's confusing? What needs more clarity? Why wouldn't you buy this?" You're watching objections form in real time.

**Step 2 — Pinion Ask (Open-Ended)**
Send 100 shoppers to the listing with a written open-ended question: "What's confusing about this listing? What's stopping you from buying?" Florence synthesises patterns from the written responses.

**Step 3 — Pinion Poll Ranked Test (Objection Prioritisation)**
Once objections are identified, run a Ranked Poll: "Which of these concerns would most stop you from buying?" This gives you the ordered list of objections — most painful to least. This determines the order of your secondary images.

**Step 4 — Image sequencing based on ranked objections**
One image, one objection answered. Don't stack multiple messages on one image. The goal: most important buying trigger first, then supporting images that go deeper on the same points. More content consumed = more conversions.

---

## Topic 3 — Decision Tree: Which Test for Which Problem

### "My CTR is low"
Follow the full 5-Step Main Image Sequencer: Pinion Videos → Search Simulation Baseline → Concept Creation (using the 52-tactic library if needed) → Image Split Test → New Concept Search Simulation with previous respondents excluded.

### "My CVR is low but CTR is fine"
Follow the CVR workflow: Pinion Videos on the live listing → Pinion Ask open-ended → Pinion Poll Ranked Test for objection prioritisation → redesign secondary images in objection-ranked order → retest with Stacked Image Test (old gallery vs new).

Possible edge cases Florence should flag:
- **Over-promising main image** — high CTR + low CVR often means the main image is setting an expectation the listing can't deliver. Flag this.
- **Scathing 1-star review or "frequently returned" badge** — these are conversion killers that image testing alone can't fix. May be a product development issue.

### "I want to know what's stopping people from buying"
Same as CVR workflow. Florence can use the direct question framing: "Why wouldn't you buy this?" — works as a literal question in both Pinion Videos and Pinion Ask.

### "I'm not sure if my new image is better"
Two routes:
- **Head-to-head Image Split Test** — quick A vs B sanity check
- **Dual Search Simulation** — run baseline with old image, duplicate the test (one click in ProductPinion), swap in new image, run again with fresh respondents (exclude previous respondents). Compare click share old vs new.

### "I want to know which of my 5 image ideas wins"
Run a 5-way Image Split Test. Question framing: "Which of these would you be most likely to click on / buy?" Start with 100–150 respondents. If a clear winner emerges, you're done. If it's tight, top up on the same test — don't relaunch.

### "I want to test a price increase"
The most direct test is raising the price on Amazon and watching CTR/CVR impact. For pre-testing price range, run a **Van Westendorp Price Sensitivity test** in Pinion Ask. The four questions:
- "At what price would this product seem so expensive you wouldn't consider it?"
- "At what price would this product seem expensive but you'd still consider it?"
- "At what price would this product seem like a good deal?"
- "At what price would this product seem so cheap you'd question the quality?"

Four outputs:
- **PMC** — Point of Marginal Cheapness
- **PME** — Point of Marginal Expensiveness
- **Optimal Price Point**
- **Indifference Price Point**

Together these define the acceptable price range before you touch your live listing. Present as directional guidance, not a guarantee.

### "I want to know why my bullets aren't working"
1. **Pinion Videos** — ask shoppers to read the bullets. "Is anything confusing? What's unclear?"
2. **Open-ended Pinion Ask** — paste all bullets as text, ask "How would you improve these? What's confusing?" Uncovers objections before you write variants.
3. **Bullet-by-bullet split test via Pinion Ask** — one question per bullet, A (original) vs B (new variant). All five questions in one survey sitting.

**Critical rule: never test all 5 bullets vs all 5 bullets.** Too much to process. One bullet vs one bullet per question. Each bullet should make one clear point.

### "I'm losing the buy box"
Outside ProductPinion testing scope. Almost always a pricing issue or a hijacker. Redirect the seller — this isn't a consumer panel problem.

### "I'm launching a new product"
ProductPinion's primary use case is ongoing optimization — but launch validation is a strong secondary use:
- Pinion Videos on prototypes or blueprints (via Google Drive/Dropbox link) — "How could this fail? Who is this for? What would stop you buying this?"
- Search Simulation to sanity-check if you can win clicks against existing competitors before investing in full production
- Van Westendorp price test to find acceptable launch price range
- Real example: a seller was going to launch a high-end kitchen gadget but even with great presentation, shoppers weren't willing to pay the target price. They decided against launching based on the research.

### "I want to expand into a new market or country"
ProductPinion has ~160 countries with shoppers available. Translate assets, test locally. Buying behaviour in the US is meaningfully different from Europe. Local shopper feedback before you localise is invaluable.

### "Which product variation or bundle should I lead with?"
Run a Pinion Poll Image Split Test showing variations or bundles. Ask which is most appealing or has the highest purchase intent.

### "I want to test my brand name or logo"
Pinion Poll Text Split Test for brand names. Image Split Test for logos. Test before committing — brand naming research that would cost $10K+ at an agency can be done in ProductPinion for a fraction of the cost. The Invisaband case study: 5-way brand name test returned 98% statistical certainty, and the brand went on to do $1M in sales.

### "I want to know if my title is working"
Use a ProductPinion Search Simulation with the new title variant. After validating with fast feedback, use Amazon's Manage Your Experiments tool to double-check (takes 4–8 weeks). Key title heuristics:
- Most Amazon titles are transactional, boring, keyword-stuffed — pattern interruption works here too
- Use a **speed bump word** — a non-typical adjective a shopper wouldn't expect to see in that category (examples: Indestructible, Revitalize, Bespoke, Forged, Hand-stitched, Transform, Artisanal)
- Keep titles under 100 characters — Amazon's own documentation says shorter titles reduce noise and drive more detail page visits
- Avoid unconventional spellings of real words ("Klear" instead of "Clear") — AMA research shows consumers respond less positively to gimmick spellings

---

## Topic 4 — ProductPinion MCP Contract

### Full Tool List (18 tools as of interview date)

**Polls — Create & Manage**
- `create_poll` — Draft a new poll (types: Headlines, BulletPoints, BrandNames, Custom, Amazon, Image, Ranked, etc.)
- `update_poll` — Edit a draft's goal, instructions, pinion count, or public sharing setting
- `launch_poll` — Make a draft live (charges credits)
- `duplicate_poll` — Clone an existing poll as a new draft. One-click duplication is key for iteration — duplicate a baseline test, swap the image, rerun with fresh respondents
- `cancel_poll` — Cancel an in-progress poll and recoup unused credits

**Polls — Results & Analysis**
- `get_poll` — Full poll details
- `get_poll_stats` — Win rates, vote proportions, and statistical confidence per option
- `get_poll_submissions` — Individual qualitative responses (the "why"), with filtering by option or keyword
- `list_polls` — Browse poll library, filterable by status (Draft, InProgress, Completed, etc.)

**Videos**
- `get_video` — Full video test details
- `get_video_stats` — Completion rates and transcription status breakdown
- `get_video_submissions` — Individual video responses with transcriptions and demographics
- `list_videos` — Browse video tests

**Images**
- `upload_image` — Upload an image by URL so it can be used as a poll option
- `get_image` — Retrieve metadata/URL for an uploaded image by ID

**Custom Audiences**
- `create_custom_audience` — Build a screened audience with qualifying questions
- `get_audience_details` — Get full details on an audience segment
- `list_custom_audiences` — Browse available audience segments

**Important:** This tool list may evolve. Pinion Ask MCP integration was not yet live as of this interview. Florence should always check her actual tool manifest at runtime rather than assuming a fixed list.

### Authentication
- Single shared Client ID for all users: `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y`
- MCP server URL: `https://lnkd.in/eW-mAKUZ`
- Setup takes ~30 seconds: Claude Settings → Custom Connector → add URL and Client ID
- Each seller connects their own ProductPinion account — no shared credit pool

### Latency Expectations
- First results start appearing: ~5 minutes after launch
- Broad/open audience poll completes: ~15 minutes
- Narrow/specific audience: up to ~1 hour
- Florence's recommended pattern: use `get_poll_stats` on demand. Seller can ask "what's the status of my last poll?" and Florence checks live.
- Webhooks/callbacks: not confirmed — treat as polling-based

### Error States
To be documented in a future update. Florence should surface raw errors to the seller gracefully when they occur.

---

## Topic 5 — Real Case Studies

### Case Study 1 — Eyelid Cleanser / Heyedrate (Dr. Travis Zigler / Eye Love)
**Problem:** White packaging on white background — shoppers were literally missing the product in search. Pinion Videos revealed this qualitatively — the video showed shoppers' eyes completely skipping past the product.

**Test:** Image Split Test — Option A (original white label) vs Option B (darker packaging with rebranded label)

**Result:** Option B won 57.43% vs 42.57%.

**Dr. Travis Zigler's quote:** *"The split testing we ran with ProductPinion showed how much my branding was lacking and how a simple tweak to my labels would DOUBLE my click through rate to my Amazon listings."*

**Key lesson:** Pattern interruption. White on white disappears. The video test caught what no keyword tool would ever surface.

---

### Case Study 2 — Mosquito Repellent Bracelet (Para'Kito)
**Problem:** Competing in a sea of brightly coloured multi-pack bracelets. Product was getting lost.

**Test:** Main image showing a single bracelet with a thumbs up — stood out vs all the random colours in the category.

**Result:** $1M in sales in just over a year. 26,596 order items, 32,395 units, $642,921 in ordered product sales.

**Key lesson:** In a visually noisy category, simplicity and a single confident image wins. A thumbs up on a plain bracelet beat 10-pack colour explosions.

---

### Case Study 3 — Mosquito Repellent Bracelet Brand Name Test (Invisaband)
**Test:** 5-way Pinion Poll Text Split Test — Defendband, Invisaband, Bitedefend, Suckersheild, Geriband

**Result:** Invisaband won at 37.7% with 98% statistical certainty it beats the next best option (Defendband at 23.4%).

**Key lesson:** Brand naming is testable before you commit. 98% confidence is an easy ship decision. The brand went on to do $1M in sales.

---

### Case Study 4 — Hair Dryer (Ellabella)
**Test:** Main image — original product shot vs new image adding press/award badges (Good Housekeeping, Cosmopolitan, Vanity Fair, Vogue, Elle + Best Hair Device award)

**Result:** The original image represented $96K in missed extra revenue per year by not making the switch sooner.

**Key lesson:** Social proof and authority signals on the main image move money. Always test before assuming your current image is good enough.

---

### Case Study 5 — Main Image Sequencer ($19K/Month)
**Full 5-step sequencer executed end to end.**

**Result in simulation:** CTR went from 7.07% → 14% (97.88% increase)

**Real Amazon results:** CTR +16.84%, CVR +14.29%, revenue +$19K/month

**Cost:** $447 to run all tests. **ROI:** 4,286%.

**Key lesson:** The full workflow pays for itself in days.

---

### Case Study 6 — Children's Ride-On Walker (Full Workflow Demo)
**Source:** Main Image Monthly ride-along session

**Objections surfaced via Pinion Videos and Pinion Ask:**
- How hard is assembly?
- What are the weight limits?
- Sharp edges at bottom — safety straps?
- Is it stable? Wheels are thin. Handles too short.
- Will it scratch floors?
- Not comfortable — can there be a seat cushion?
- No interactive features like lights and sounds
- Not inclusive
- "Why are there ducks?!"
- Old school imagery

**Test workflow:** Videos → Pinion Ask objection mining → concept creation (3 concepts) → Image Split Test → Search Simulation Baseline (24.24%) → new concept with excluded respondents

**Result:** Concept C won at 37% vs baseline 24.24% — **52.63% higher CTR**, meaning 128 more shoppers per 1,000 impressions going to the listing.

**Key lesson:** "Why are there ducks?" — shoppers will tell you things you'd never think to ask. The full workflow surfaces the objections that kill listings silently.

---

### Note on Additional Case Studies
Dorian (Keplo) has a large additional case study library including 128+ search simulations and 150 split tests run via the ProductPinion MCP. These should be incorporated into Florence's reference data. Key stats from that dataset:
- 80% of live Slot 1 images lost head-to-head against new variants — most sellers' current main image is underperforming
- Specific creative rules with confidence levels are documented separately (see file references)

---

## Topic 6 — Amazon CRO SOPs (Matt's Playbook)

### CTR Improvement — Top Tactics

Florence has access to a full library of 52 main image tactics in `main-image-tactics.json`. Each tactic includes: category, best_for, avoid_for, core strategy, expected CTR impact (High/Medium/Low), difficulty, and a ready-to-use image generation prompt in the ProductPinion prompt schema.

Tactic selection logic is in `tactic-selection-rules.md` — diagnose product type first (wearable, kit, liquid, electronics, etc.) then match to the right tactics. Standard output: recommend 5 tactics, rank top 2–3 to test first.

**Matt's personal high-priority tactics** (weight these above the JSON's generic High/Medium/Low scores):

1. **Add Packaging** — biggest one. More screen real estate, more information surface. Hugely underutilised.
2. **Keywordize It** — put the main search keyword on the image instead of emphasising the brand name. Shoppers are searching for a thing, not your brand.
3. **Megalabel It / Wrap It** — if you have a set or bundle, wrapping or mega-labelling is very high impact.
4. **Tilt It** — especially powerful in categories where everything is straight-on and solid colour. The eyelid cleanser case study (dark purple packaging, white-on-white category) — CTR up 50%.
5. **Unpackage It** — show the product out of its box in a way the category doesn't expect.
6. **Lifestyle It** — worth testing as main image where Amazon allows it. Often underused.
7. **Position It / Fold It** — if the product has different states, show them.
8. **Badge It / Explode It** — showing all components or awards. Effective but getting overdone — only use if competitors aren't doing it.
9. **Ingredient It** — good but increasingly common. Use selectively.
10. **Festify It** — holiday bow or seasonal treatment. Massively underused. Works for ANY category, not just giftable products. Real result: 33% CTR increase. Best case: +30% more sales. Worst case: rare listing suppression (quick fix). Everyone should be doing this during peak season.

**Meta-rule Florence must always apply:** If the whole category is doing the same thing (badges, ingredients, explosions), the winning move is often to go the opposite direction — clean, simple, minimal. Standing out beats following best practice when best practice is what everyone else is doing.

**Creative best practices from 150+ split tests:**
- Push to 95% frame fill — significant CTR lift over 75-85% crops
- Show the product in its active state (water spraying, light on, fan moving)
- Print quantity prominently on pack — "180 COUNT" beats "family size." Specific numbers beat round claims (buyers call round numbers "exaggerated")
- Print trust stamps on box — lifetime warranty, FDA cleared, 99.9% claims printed on package face
- Box + contents + loose sample composition — answers "what physically arrives at my door?"
- Show dispensing mechanism — dropper extended, pump primed, lid off
- For multi-SKU products — show color range
- 3/4 angle often beats flat front — reveals depth
- Vertical orientation fills 30-40% more pixels in square thumbnail
- Highest-contrast color variant as hero — red beat gray in commodity categories
- Multi-pack: spaced not stacked — negative space reads as abundance

**Things Florence should flag immediately (soft flags, not hard rules):**
- Sub-85% product fill
- AI-generated backgrounds or models — shoppers detect it, Amazon scrutiny rising
- 4+ competing badges — single-claim heroes win; multiple badges signal salesman
- Hidden quantity or capped products
- Generic packaging that mirrors competitors
- Photoshopped overlay text or badges — print on package instead

**Quick 60-second main image audit Florence can run:**
1. Is product 90%+ of frame? If not, recrop
2. Is this a 3/4 view or flat front? Test 3/4
3. Is the package doing work — quantity, claims, before/after? If not, consider redesigning
4. For consumables — is the dropper/pump visible?

---

### CVR Improvement — Top Levers

**The core principle:** People don't buy because of logic. They buy because of feeling and what the brand represents. Your job is to remove every objection and doubt before they leave the page.

**1. The Index Image — Matt's #1 CVR recommendation**

A secondary image that lists the top 4–5 reasons why someone should buy this product. Matt calls it "the one image to rule them all." It overcomes the biggest buying objections up front in one glance, and also feeds Rufus/AI search — gives Amazon's AI a clear answer to "why is this product the best?"

**The Index Image blueprint:**
- **Title:** Be literal — "5 Reasons Why [Product] Is The Best Choice." Don't be clever or cute.
- **Number the reasons** — gives a starting point and pulls shoppers through all 5 points. More content consumed = more conversions.
- **First 2–3 points = biggest buying triggers** — use ProductPinion data to find which ones matter most to your specific shopper. Test the order using a Pinion Poll Ranked Test.
- **Local point** — add a USA flag if US-based (product doesn't have to be made there)
- **The Golden Guarantee** — make it outlandish, name it, make it a thing. Examples: "Empty Bottle Guarantee," "Never Cut Guarantee," "Bottom of the Bottle Guarantee," "100% No Mosquito Bites Guarantee." The number of sales you make is far higher than the number of people who take advantage of it.

**2. Benefits over features** — don't list specs, show the transformation. Shoppers want to see themselves benefiting from the product.

**3. One image, one message** — except the Index Image, every secondary image has one clear purpose. Don't stack messages.

**4. Image order based on objection ranking** — sequence images using ProductPinion Ranked Test data. Most important buying trigger first.

**5. A+ Content** — 8% CVR boost with basic A+. 20% CVR boost with Premium A+.
- How to unlock Premium A+: apply a brand story to all SKUs, submit A+ content 5–15 times (duplicate and resubmit) — access possible within 24 hours.
- Narrative persuasion: emotionally charged content sticks 22x more than facts and figures.
- Use A+ to go deeper on the Index Image points — don't just duplicate. Tell the brand story here.

**6. Brand story** — not having a story behind the brand is a missed CVR lever. People buy from people. A+ content is where this lives.

**7. Open loops** — use numbered lists and open loop copy in image headlines (e.g. "The Top 5 Reasons Why X Is The Best") to compel shoppers to keep reading. Based on the Zeigarnik Effect — people are compelled to complete unfinished tasks.

**8. Trust badges and authority signals** — add credibility through known trust badges and product roundup mentions. Side benefit: gets Rufus and AI tools to recommend your brand in AI-generated product roundups.

**9. 3D / Virtual Try-On** (where applicable):
- Amazon app on iOS can create 3D models for free
- Virtual Try-On / View in 3D: 2x improvement in purchase conversion
- View in Your Room: 9% average sales improvement

**10. Unexpected bonuses for reviews** — advertise 5, ship 6. Include a case or complimentary product. Don't advertise it in the listing — mention on the insert only. The surprise creates positive emotion which drives organic reviews.

---

### CVR Anti-Patterns — Florence Should Flag These

1. **Too much text, too small to read on mobile** — most shopping happens on mobile. If your font can't be read on a phone screen, it's killing you. Main image should fill 80–90% of the frame. Use every pixel. Also ensure correct mobile-optimized image dimensions (4:5 or 1:1 ratio).
2. **Leading with features instead of benefits** — "6000mAh battery" vs "charge your phone 3x without a wall outlet"
3. **Poorly executed AI images** — shoppers can spot bad AI lifestyle images instantly. Test your images in ProductPinion — A vs B on lifestyle shots before committing.
4. **Inconsistent branding across images** — no set typography, colours changing between images. The best brands repeat their design guidelines and never sway from them.
5. **Over-promising on the main image** — leads to high returns, bad reviews, and eventually the "frequently returned" badge. That badge is a conversion killer.
6. **Spelling mistakes** — ProductPinion open-ended Ask will surface them. Shoppers notice and it damages trust.
7. **Not using A+ content** — missing the opportunity for the 8–20% CVR boost and the information seeker who wants to go deep.
8. **No brand story** — selling a generic product with a logo on it is forgettable. People buy from people.
9. **Low star rating / low review count** — sometimes the listing isn't the issue. Florence should surface this as context when diagnosing CVR problems.

---

### Benchmarks

**CTR Benchmarks (Organic):**
- Average: 1.5–2.5%
- Good: 2.5–4%
- Excellent: 4%+

**CTR Benchmarks (PPC):**
- Average: 0.4–0.75%
- Good: 0.75–1.5%
- Excellent: 1.5%+

**CVR Benchmarks:**
Use Search Query Performance to find the purchase rate benchmark for your specific keyword — that's your real category benchmark. Generic CVR benchmarks are less useful than keyword-level data.

**How to measure CTR on Amazon:** Advertising Console, Brand Analytics, Business Reports

**How to measure CVR on Amazon:** Business Reports (unit session %), PPC Campaign Manager, Brand Metrics, Search Query Performance

---

### When to NOT Run a Test

The ROI of testing is almost always positive. A single split test with a 5% improvement equals $1,200 extra/year on a $2K/month product and $18K extra/year on a $30K/month product. The philosophy is: **always be testing**. Results like these are typical when you test consistently.

That said, Florence should not recommend a test when:
- The change is clearly broken (spelling mistake, wrong image uploaded) — just fix it
- The seller is making a product change — test the product first, then optimise the listing
- CTR or CVR data is too thin to establish a baseline (new launch with < a few weeks of data)

---

### The Order of Attack for a Struggling Listing

1. **First: establish baselines** — what are the current CTR and CVR numbers? Use Amazon data sources above.
2. **Second: identify which problem to solve first** — CTR or CVR? If both are low, fix CTR first (more clicks = more data to work with).
3. **Third: run Pinion Videos** — qualitative first, always. Understand what shoppers see and feel before changing anything.
4. **Fourth: run the appropriate workflow** — CTR → Main Image Sequencer. CVR → Objection Mining workflow.
5. **Fifth: implement, then test again** — optimization is a loop, not a one-time event.

---

### Rufus / AI Search Optimization

Rufus is Amazon's AI search layer. Florence should know:
- Run a Pinion Ask asking shoppers how they would *describe* the product in their own words. The adjectives they use (e.g. "sleek," "modern," "gentle") often don't appear in traditional keyword tools.
- Use those natural language descriptors in listing copy to surface in Rufus/AI search results.
- The Index Image also feeds Rufus directly — clear benefit statements in images give Rufus a structured answer to "why is this the best product?"
- Trust badges and authority mentions help AI tools recommend your brand in product roundups.

---

## Topic 7 — Workshop Operational Details

### Demo ASINs

**Primary demo product:**
- Brand: Dr. Doug's (drdougs.com)
- ASIN: B07HB8FNXV — Dr. Doug's Magnesium Muscle Relief
- ProductPinion polls to be pre-launched Tuesday/Wednesday before the workshop

**Secondary demo product:**
- Brand: SPOTMINDERS
- ASIN: B0FVFTY4CG — SPOTMINDERS GPS Tracker (permission confirmed)

Both products give category variety (health/wellness + tech/safety). Dorian has flexibility on which to use for the live stage demo narrative.

### Workshop Demo Format

The demo shows the *capability* of launching ProductPinion polls directly from Claude/Florence. It does **not** depend on live poll results returning on stage. Pre-launched polls serve as reference data. The demo narrative is: Florence can launch a poll right now, from inside Claude, in seconds.

Podcast examples (already run) are available as additional backup reference data.

### Additional Case Study Source

Dorian (Keplo) has a large independent case study library from agency work. Florence's recommendations should reference both Matt's case studies and Dorian's where relevant.

---

## Topic 8 — Image Generation

> Skipped — not blocking the workshop. To be covered in a follow-up session.

---

## Topic 9 — Matt's Open Mic

### What Florence needs to know that wasn't in Dorian's brief

**ProductPinion is primarily an ongoing optimization tool** — not just a launch tool. The main use case is continuous improvement: test, improve, test again. Product launch validation is a valuable secondary use case but should never be positioned as the headline.

**Customer data acquisition strategy** (bonus capability Florence can recommend):
- Product insert strategy: instead of asking for a review (typical and ineffective), offer something free — a product, ebook, warranty registration
- Ship a thin freebie by postal mail (~$3 total cost) — cheaper than cold Facebook/email acquisition ($2-5 per address)
- **Serialized product / lost and found service** — unique code per product, customer registers it, finder enters code if lost, gets a reward ($10 Amazon gift card), owner gets notified. Creates recurring revenue upsell opportunity. Over 60% opt-in rate (very product dependent).
- Once you have emails — don't sell to them. **Poll them.** Ask what variations or products they want next. Three wins: extra touchpoint, loyalty, sales as reward for participating.

**Pattern interruption is the master principle** behind all of this. On Amazon, the person whose pattern is interrupted becomes highly influenceable. This applies to main images, titles, secondary images, emails, and product inserts. The seller who does something genuinely different in their category wins disproportionately.

### What Matt would push back on in Dorian's brief

Nothing materially wrong-headed. The methodology as briefed is sound. The main addition Matt would make: Florence should default to recommending a **continuous testing loop**, not a single test. There is no magic "one test to run." The sellers who win are the ones who are always testing. Results like the ones in these case studies are typical — not exceptional — when testing is part of the workflow.

---

## File References

The following files were shared by Matt and should be included in `knowledge/inbox/matt/` for Dorian:

- `main-image-tactics.json` — 52 main image tactics with full prompt schema, best_for/avoid_for, CTR impact ratings. Florence's primary CTR improvement library.
- `main-image-tactics.jsonl` — same data in JSONL format
- `main-image-tactics-airtable.csv` — same data in CSV format
- `tactic-selection-rules.md` — decision logic for which tactics to recommend given product type
- `prompt-schema.md` — standard format for turning a tactic into an image generation prompt
- `Pattern_Interruption_on_Amazon_-_ProductPinion.pdf` — Matt's full pattern interruption playbook. Supplementary reference material covering main image tactics, headline strategy, Index Image methodology, and review acquisition.

---

*Send this to Dorian. He'll read it and Florence will inherit the methodology in skill files.*
