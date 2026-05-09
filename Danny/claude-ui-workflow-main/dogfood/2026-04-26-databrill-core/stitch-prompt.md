---
project: claude-ui-workflow
run: dogfood-cycle-2
brand: databrill-core
stage: 6 (design brief)
purpose: Paste-ready brief for Stitch generation. Frontmatter is metadata only — do not paste.
sources:
  - brands/databrill-core/profile.md
  - brands/databrill-core/tokens.json
  - Databrill-Core/stitch-build/DESIGN.md
  - Databrill-Core/.Archives/wp-waitlist/waitlist.html (realised reference)
  - core.databrill.com (live deploy — copy still valid)
---

# Stitch prompt — Databrill Core homepage redesign

> **Paste from this line down ↓**

Design a homepage for **Databrill Core**, a B2B SaaS platform that gives Amazon sellers and agencies direct, owned access to their Selling Partner and Advertising API data — piped into a customer-owned PostgreSQL database. The audience is mid-to-senior Amazon operators (brand owners, agency leads, finance/ops folk) who are tired of being locked out of their own performance data by account-management services. They want raw access, no vendor lock-in, and the freedom to plug into Tableau, Looker, BI tools, or build their own analytics on top.

**The feel:** premium B2B SaaS with technical credibility. Dark, glassmorphic, atmospheric — but not "crypto-bro flashy". Closer to Vercel / Linear / Stripe in restraint, with a warmer accent system and more textural depth (mesh gradients, subtle glow on primary CTAs, glassmorphic surface treatments). Editorial confidence over feature-list density. The kind of design that says "the founders write code and respect your time."

**Visual signature:** dark deep navy `#0c0a14` page background, with a warm orange accent `#e07a3a` for primary CTAs and brand highlights, and a violet/purple `#7c6bbd` for secondary accents and decorative elements. Subtle gradient mesh in section corners (orange in top-right, purple in bottom-left at low opacity). Glassmorphic cards: `rgba(255,255,255,0.025)` background, `rgba(255,255,255,0.07)` border, `backdrop-blur(2xl)`, rounded 12-24px. Warm glow on the primary CTA button only — `0 0 24px rgba(224,122,58,0.3)`. Avoid harsh #000 — use `#0c0a14` or `#100e1a`. Use a fixed grid-pattern overlay at very low opacity (~5% white dots on 40px grid) to add depth without noise.

**Sections, in order (web/desktop layout):**

1. **Sticky nav** — Logo (Databrill, with orange "brill" highlight) on left, links centred (Features, Pricing, FAQ), gradient-bordered ghost CTA "Log in" on right. Backdrop-blur on dark `rgba(12,10,20,0.85)`. Border-bottom 1px on `rgba(255,255,255,0.07)`.

2. **Hero** — Centred. Eyebrow chip "Now in beta" or "Built by Amazon operators" (rounded-full, orange-on-glow). Headline: "Own Your Amazon Data. Finally." (2 lines, hero typeface display weight 900, with "Finally." in an orange→light-orange gradient text-clip). Subhead: "Automated extraction from Amazon APIs into your own PostgreSQL database. No vendor lock-in. No data hostages. Just transparent, reliable data ownership for your Amazon business." Two CTAs: primary glow-orange "Start Free Trial", ghost gradient-border "See How It Works". Below: small trust line ("14 days free · No credit card required · 60-second setup"). Background carries the radial gradient mesh — orange ellipse at top, purple at bottom-right.

3. **Trust ticker** — Horizontal infinite-scroll ticker with glassmorphic pill chips. Status-dot left (red/amber/green) + short status: "API quota: 87%", "Sync lag: 2.3s", "Active syncs: 142", "Tables: 67M rows", etc. Mask gradients on left/right edges so it fades into the bg.

4. **Problem section — "Tired of Being a Data Hostage?"** — Section title centred. 4-card glassmorphic grid (2×2 on desktop, stack on mobile) showing the four weak links of Amazon data:
   - **Access** — "Can't pull Advertising API + Seller Performance without manual exports"
   - **History** — "Account-management tools throttle historical depth — usually 90 days"
   - **Combine** — "Inventory, ads, settlements, and SP-API data live in 4 different dashboards"
   - **Evolve** — "You can't build BI on data you don't own"
   Below the grid: a one-line emphasis quote: *"Every dollar locked in Amazon is YOUR money. Why isn't your data?"*

5. **Solution section — "Your Data, Your Database, Your Rules"** — 3-column feature row: Extract / Own / Analyze. Each column has a small filled icon (orange or purple, alternating), a 1-line headline, and 4 sub-bullets. Use Material Symbols Outlined for icons. Glassmorphic cards optional, or borderless with subtle column rules.

6. **How It Works — numbered timeline** — 4 numbered steps in orange circles (1, 2, 3, 4) along a vertical line on the left, with title + 2-line description on the right. Steps:
   1. Connect Your Amazon Account (OAuth, 3 min)
   2. Choose Your Database (managed PostgreSQL OR bring-your-own)
   3. Data Flows Automatically (scheduled syncs + historical backfill)
   4. Query, Analyze, Export (SQL, Tableau, Looker, CSV — your call)

7. **Who It's For — 4-column persona row** — Amazon-Native Brands / Agencies & Aggregators / Finance & Ops Teams / Data-Driven Leaders. Each column: title + 4-line description in muted text. Borderless or very subtle glass.

8. **Comparison table — "Why Databrill vs. Account Management Services?"** — 3-column table. Left column = feature names (Service Model, Data Ownership, Access to Raw Data, BI Tool Integration, Custom Analytics). Middle column = "Traditional Account Mgmt" answers (Manual operations team, Lives in their platform, Limited exports/fees, Screenshots & CSVs, Request reports). Right column should be Databrill answers (Automated infrastructure, In YOUR database, Direct SQL access, Native connections, Build whatever). Use subtle row striping with `rgba(255,255,255,0.025)`.

9. **Pricing — 3-tier card grid** — Three glassmorphic cards. Tiers: **Starter $149/mo** / **Professional $449/mo** / **Agency Custom**. Each card: tier name, price (large), 1-line target audience, feature checklist (5-7 items, orange checkmark icons). The middle "Professional" tier is highlighted: gradient border (orange→purple), small "Most Popular" chip on top, slight scale-up. Each card has a CTA button matching tier (primary CTA on Professional, ghost on others).

10. **Big closing CTA band — "Stop Paying to Access Your Own Data"** — Full-bleed orange band (`#e07a3a` solid or radial gradient towards `#f09050`). Big white headline. Sub: "Get 14 days free. See your complete Amazon data in one database. No credit card required." Single white CTA button: "Start Free Trial".

11. **Footer** — 4-column footer on dark surface `#100e1a` with `rgba(255,255,255,0.05)` top border. Columns: Brand & tagline ("Your data. Your database. Your business.") · Product (Features, Pricing, FAQ) · Company (About, Contact) · Legal (Privacy, Terms, Cookies). Bottom row: copyright + small social icons (X, LinkedIn, GitHub).

**Avoid:**
- Stock-photo-y hero imagery of laptops or "happy team" shots
- Crypto-bro neon glow excess (one glow only — primary CTA — and even then subtle)
- Pure `#000000` backgrounds — always `#0c0a14` or `#100e1a`
- Light-mode sections in the middle of a dark page
- More than one accent colour per section
- Gradient text on every heading — only the hero "Finally." word
- Generic "Trusted By" logo strip — replaced by status-ticker for technical credibility
- Three-column hero (split brand/copy/CTA) — keep it centred

**Type:** Inter for headlines (semibold to black), DM Sans for body (regular/medium), Space Grotesk for any display lockup or numerical display (count-up stats, pricing). All Material Symbols Outlined for icons.

**Primary CTA colour:** `#e07a3a` (orange) with a soft warm glow on hover (`0 0 40px rgba(224,122,58,0.5)`). Primary CTA is a pill button (rounded-full), gradient bg `linear-gradient(135deg, #e07a3a, #ff4d00)`. On hover, lift `-translate-y-1`, increase glow.

**Secondary CTA colour:** Glass ghost pill, `rgba(255,255,255,0.05)` bg, `rgba(255,255,255,0.12)` border. On hover, brighten bg + border to `0.1` / `0.2`.

**Accent system rule:** Orange is for action (CTAs, primary links, status-positive indicators). Purple is for decoration (background gradient mesh, secondary icons, line-work). Never apply purple to a CTA. Never apply orange to a body-text link.

**Component tone:** Glassmorphic cards, borderless tables, gradient-bordered ghost CTAs, generous `py-32 px-6` section spacing, max-width `1280px` (`max-w-7xl`) with `mx-auto`. Use 12-column grid for hero splits, 2-col / 3-col / 4-col grids for content rows.

**Performance notes for the design:** No more than one full-bleed background image. Heroic decorative elements should be CSS gradients/blurs, not raster art. All cards: subtle box-shadow `0 25px 50px -12px rgba(0,0,0,0.7)`. Reduced-motion: glow pulses and scroll-reveals must be opt-out friendly.
