> **Note:** This file is the source for the "What you can build with this" section in [`README.md`](README.md). It captures Perplexity research output covering: (1) general Stitch use cases, (2) Amazon-seller marketing-focused use cases, and (3) ten detailed spec sheets per use case (purpose, dimensions, key elements, export format, prompt starter). Treat as evergreen reference — the README distils the 10 Amazon-seller cases into a one-line table; full reasoning + footnoted references live here.

---

<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## TL;DR

End users are creating:

1. **Mobile app prototypes** (food delivery, chat apps, e-commerce)
2. **Web landing pages** and marketing sites
3. **Multi-screen user flows** with automatic screen generation
4. **Dashboard and admin interfaces** for SaaS products
5. **Design system variations** from single prompts
6. **Hand-drawn sketch digitisations**
7. **Wireframe-to-high-fidelity conversions**
8. **Competitor analysis mockups** from screenshots
9. **Voice-designed interfaces** using real-time AI critique
10. **Interactive prototypes** with linked navigation flows

## Main Use Cases

Based on current adoption patterns, users are primarily creating:[^1_1][^1_2]

- **Mobile app UIs**: Food delivery apps, AI chat applications, music players, and e-commerce checkout flows
- **Landing pages**: Marketing sites with AI-generated layouts and brand alignment
- **Dashboard prototypes**: Admin panels, analytics dashboards, and SaaS control interfaces
- **Multi-page flows**: Login → Home → Detail page sequences auto-generated via the "Auto Screen" feature
- **Design variations**: Rapid exploration of 15-16 different visual directions using "Vibe Design" mode
- **Sketch conversions**: Photos of hand-drawn wireframes transformed into digital high-fidelity designs
- **Competitor clones**: Screenshot-based redesigns for reference and iteration
- **Voice-designed concepts**: Real-time spoken design critiques and modifications
- **Style experiments**: Dark themes, gradient backgrounds, and brand-aligned colour palette exploration
- **Prototype testing**: Interactive click-through demos built by "stitching" screens together


## Primary User Groups

The platform serves three main groups:[^1_2]

- **Product managers and entrepreneurs**: Validating product concepts without design skills
- **Developers**: Getting UI skeleton code to skip manual design work
- **Designers**: Accelerating early-stage ideation and exploring multiple directions

Want more detail on any specific use case?
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_3][^1_4][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/

[^1_2]: https://help.apiyi.com/en/google-stitch-ai-ui-design-tool-beginner-guide-en.html

[^1_3]: https://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52

[^1_4]: https://www.youtube.com/watch?v=3FIRNGJh00w

[^1_5]: https://www.aakashg.com/designing-ai-products-the-right-way-google-stitch-custom-gpts-and-prototyping-workflows-with-xinran/

[^1_6]: https://www.reddit.com/r/AISEOInsider/comments/1rvhlyr/google_stitch_ai_design_tool_that_turns_ideas/

[^1_7]: https://www.mindstudio.ai/blog/what-is-google-stitch-ai-design-tool/

[^1_8]: https://uxpilot.ai/blogs/google-stitch-ai

[^1_9]: https://www.codecademy.com/article/google-stitch-tutorial-ai-powered-ui-design-tool

[^1_10]: https://www.reddit.com/r/AISEOInsider/comments/1r9qk4h/google_stitch_prototypes_feature_that_makes_ui/

[^1_11]: https://uxplanet.org/top-5-google-stitch-features-8373ff9e8a30

[^1_12]: https://designerup.co/blog/google-stitch-first-look/

[^1_13]: https://www.the-ai-corner.com/p/google-stitch-ai-design-tool-guide-2026


---

## TL;DR

Amazon sellers can use Stitch for marketing/content but **not product image optimisation** (it's UI-focused, not product photography). Best use cases:

1. Brand storefront landing pages
2. Email newsletter HTML templates
3. Social media graphic templates (quote cards, announcement posts)
4. Lead magnet/funnel page designs (discount codes, subscriber captures)
5. Instagram/Facebook ad creative mockups
6. Product comparison infographics (export as image)
7. Launch campaign countdown pages
8. Video thumbnail template designs
9. Brand style guide documentation
10. Customer survey/form interfaces

***

## Why Image Optimisation Doesn't Work

You're right—Stitch struggles with reference image consistency because it's built for **UI/UX interface design**, not product photography workflows. It generates app screens, landing pages, and web layouts rather than maintaining photographic consistency across Amazon listing images.[^2_1][^2_2][^2_3][^2_4]

For Amazon product image optimisation specifically, sellers are using tools like **Pixii** (one-click A+ content and listing images) or **Nano Banana AI** (batch Amazon image generation) instead.[^2_5][^2_6]

## Practical Marketing Use Cases for Sellers

Since most Amazon sellers won't build apps, here are 10 **marketing-focused** applications:

- **Brand storefront landing pages**: Create custom landing pages for external traffic (Google Ads, influencer links) that match Amazon brand registry aesthetics[^2_7][^2_8]
- **Email newsletter templates**: Design HTML email layouts for customer retention campaigns, new product launches, or promotions using Stitch's export-to-code feature[^2_9][^2_8]
- **Social media content templates**: Build reusable Instagram story templates, quote card designs, or announcement graphics with brand colours/fonts[^2_1]
- **Lead capture pages**: Design discount code signup pages, waitlist forms, or early access landing pages for product launches[^2_8][^2_7]
- **Facebook/Instagram ad mockups**: Rapid prototyping of different ad creative layouts to test messaging angles before investing in production design[^2_8]
- **Product comparison infographics**: Create visual comparison charts showing your product vs competitors (export as screenshot for use in A+ content)[^2_10]
- **Launch campaign pages**: Countdown landing pages, pre-order sites, or Kickstarter-style campaign pages for new product releases[^2_7]
- **Video thumbnail designs**: Design consistent YouTube thumbnail templates for product demo videos or tutorial content[^2_7]
- **Brand guidelines documentation**: Use Stitch's DESIGN.md export to document brand colours, typography, and visual standards for VAs/agencies[^2_11][^2_12]
- **Customer feedback forms**: Build branded survey interfaces or product review collection pages that integrate with your ecosystem[^2_8]


## Export Workflow

Most sellers would design in Stitch → export to Google AI Studio → get production code → publish to Netlify/Webflow. This works well for one-off campaign pages but requires technical setup.[^2_13][^2_7]

Want detail on any specific workflow (e.g., email newsletters or landing pages)?
<span style="display:none">[^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_20][^2_21][^2_22][^2_23][^2_24][^2_25][^2_26][^2_27][^2_28][^2_29]</span>

<div align="center">⁂</div>

[^2_1]: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/

[^2_2]: https://stitch.withgoogle.com

[^2_3]: https://developers.googleblog.com/stitch-a-new-way-to-design-uis/

[^2_4]: https://techcrunch.com/2025/05/20/google-launches-stitch-an-ai-powered-tool-to-help-design-apps/

[^2_5]: https://www.youtube.com/watch?v=mP13-XRrYeU

[^2_6]: https://bananabatch.com/amazon-listing-photos-with-ai.html

[^2_7]: https://www.youtube.com/watch?v=kMiqteWJ3qM

[^2_8]: https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/

[^2_9]: https://www.ablebits.com/office-addins-blog/create-html-newsletter-gmail/

[^2_10]: https://help.apiyi.com/en/google-stitch-ai-ui-design-tool-beginner-guide-en.html

[^2_11]: https://www.linkedin.com/posts/googledevelopers_today-stitch-by-google-from-google-labs-activity-7440099157366734848-S5Sv

[^2_12]: https://www.linkedin.com/posts/joseph-michael_introducing-the-new-google-stitch-your-ai-activity-7440709033344282625-08qf

[^2_13]: https://www.youtube.com/watch?v=EfnIdEPF8MU

[^2_14]: https://www.stitchdata.com/integrations/google-ads/amazon-quicksight/

[^2_15]: https://www.aboutamazon.com/news/innovation-at-amazon/amazon-sellers-canvas-artificial-intelligence

[^2_16]: https://www.linkedin.com/posts/moghalsaifa_stitch-wont-replace-figma-google-knows-activity-7441695458495979520-W0SV

[^2_17]: https://www.timesofai.com/brand-insights/google-stitch-review/

[^2_18]: https://www.androidcentral.com/apps-software/google-labs-stitch-is-a-design-canvas-that-turns-your-voice-into-an-app

[^2_19]: https://landingcube.com/amazon-image-optimization/

[^2_20]: https://aws.amazon.com/marketplace/reviews/reviews-list/prodview-oamu4uon7ijf2

[^2_21]: https://www.linkedin.com/posts/jakefinkelstein_anyone-else-playing-with-googles-stitch-activity-7414643831171604480-P3wR

[^2_22]: https://www.linkedin.com/posts/ognjeng_google-launched-stitch-last-week-and-designers-activity-7444305711825833984-Gp4I

[^2_23]: https://www.youtube.com/watch?v=3FIRNGJh00w

[^2_24]: https://www.youtube.com/watch?v=3zTiND5f0_A

[^2_25]: https://www.youtube.com/watch?v=1tTTJOhdvSs

[^2_26]: https://www.youtube.com/watch?v=zTzKgUIhxq8

[^2_27]: https://www.youtube.com/watch?v=Dk0dSiEke0M

[^2_28]: https://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52

[^2_29]: https://www.reddit.com/r/AISEOInsider/comments/1qa8zpf/build_anything_with_google_stitch_google_ai/


---

## TL;DR Spec Sheet Format

Each use case below includes: **Purpose** | **Dimensions** | **Key Elements** | **Export Format** | **Stitch Prompt Starter**

***

## 1. Brand Storefront Landing Pages

**Purpose**: External traffic landing page for Google Ads, influencer links, or social media campaigns driving to Amazon[^3_1][^3_2]

**Dimensions**: Desktop 1440×900px (primary), Mobile 375×812px (secondary responsive view)

**Key Elements**:

- Hero section with brand logo + product hero image placeholder
- Clear CTA button linking to Amazon storefront
- 3-column feature/benefit section
- Trust badges (Amazon's Choice, star rating, review count)
- Footer with social proof/testimonials

**Export Format**: HTML/CSS code via AI Studio for Netlify/Webflow deployment[^3_1]

**Stitch Prompt Starter**: "Create a product landing page for [product name], premium feel, hero section with CTA button 'Shop on Amazon', 3 benefit columns, testimonial section, mobile responsive, [brand colour] accent"

***

## 2. Email Newsletter Templates

**Purpose**: Customer retention emails for launches, promotions, cross-sells[^3_2][^3_3]

**Dimensions**: Email-safe width 600px × variable height (800-1200px typical)

**Key Elements**:

- Header with logo/brand lockup (max 150px height)
- Single column layout (email client compatibility)
- 1-2 product card sections with image + price + CTA
- Discount code callout box
- Footer with unsubscribe/social links

**Export Format**: HTML code (inline CSS for email clients)[^3_3]

**Stitch Prompt Starter**: "Design email newsletter template, 600px wide, single column, header with [brand] logo, product showcase section with 2 items, discount code banner, CTA buttons in [brand colour], footer with social icons"

***

## 3. Social Media Graphic Templates

**Purpose**: Reusable Instagram/Facebook post templates for announcements, quotes, product highlights[^3_4][^3_2]

**Dimensions**: Instagram Post 1080×1080px | Instagram Story 1080×1920px | Facebook Post 1200×630px

**Key Elements**:

- Brand colour background or gradient
- Logo placement (top-left or bottom-right)
- Text hierarchy (headline + subtext)
- Product image placeholder zone
- Consistent typography system

**Export Format**: PNG screenshot for direct upload to Canva/social schedulers

**Stitch Prompt Starter**: "Create Instagram post template 1080×1080, [brand colour] gradient background, centered headline space, product image placeholder bottom half, logo top-left corner, modern minimal style"

***

## 4. Lead Magnet/Funnel Pages

**Purpose**: Capture emails for discount codes, waitlists, early access to new products[^3_2][^3_1]

**Dimensions**: Desktop 1440×1024px (single-screen, no scroll preferred), Mobile 375×667px

**Key Elements**:

- Headline + subheadline value proposition
- Single email input field + submit button
- Incentive callout ("Get 15% off your first order")
- Privacy assurance text
- Exit-intent popup variant (optional 500×400px modal)

**Export Format**: HTML/CSS code with form action placeholder[^3_2]

**Stitch Prompt Starter**: "Design lead capture page, centered layout, headline '[Get 15% Off]', email input field, large CTA button '[Claim Discount]', minimal distractions, [brand colour] accents, trust badge below form"

***

## 5. Instagram/Facebook Ad Creative Mockups

**Purpose**: Test different ad messaging angles before production design investment[^3_2]

**Dimensions**: Facebook Feed 1200×628px | Instagram Feed 1080×1080px | Stories 1080×1920px

**Key Elements**:

- Product image hero (left or right 50% split)
- Headline (max 5 words, large bold type)
- Benefit bullets or single value prop
- CTA button mockup ("Shop Now", "Learn More")
- Ad copy simulation area (primary text preview)

**Export Format**: PNG screenshot for internal review/client approval

**Stitch Prompt Starter**: "Create Facebook ad mockup 1200×628, product image left half, headline '[Solve X Problem]', 3 benefit bullets right side, green 'Shop Now' button, modern clean layout"

***

## 6. Product Comparison Infographics

**Purpose**: Side-by-side comparisons for A+ Content, social posts, or landing pages[^3_5]

**Dimensions**: 1200×800px (horizontal) or 800×1200px (vertical for mobile-first)

**Key Elements**:

- 2-3 column layout (Your Product | Competitor A | Competitor B)
- Row headers (Price, Features, Rating, Warranty, etc.)
- Checkmarks/X icons for feature presence
- Highlight column for your product (background colour)
- Source citation footer

**Export Format**: PNG screenshot for Amazon A+ or social media

**Stitch Prompt Starter**: "Design product comparison table, 3 columns, 6 feature rows, checkmark icons for yes/no, middle column highlighted in [brand colour], clean modern table design, 1200×800 horizontal"

***

## 7. Launch Campaign Countdown Pages

**Purpose**: Pre-launch hype pages for new product releases or seasonal campaigns[^3_1]

**Dimensions**: Desktop 1440×900px (single hero screen), Mobile 375×812px

**Key Elements**:

- Large countdown timer (days/hours/minutes)
- Product teaser image (blurred or partial reveal)
- "Notify Me" email capture form
- Social share buttons
- Progress bar or waitlist counter ("Join 247 people waiting")

**Export Format**: HTML/CSS/JS code (countdown requires JavaScript)[^3_1]

**Stitch Prompt Starter**: "Create product launch countdown page, large timer centered, blurred product image background, email signup form below timer, 'Notify Me' CTA button, minimal dark theme, [brand colour] accents"

***

## 8. Video Thumbnail Template Designs

**Purpose**: Consistent YouTube/TikTok thumbnail branding for product demos, tutorials[^3_1]

**Dimensions**: YouTube 1280×720px | TikTok 1080×1920px (vertical)

**Key Elements**:

- High-contrast text overlay zone (left or right third)
- Product image placeholder (60-70% of frame)
- Emotional thumbnail face placeholder (optional)
- Episode number or series branding badge
- Logo watermark (bottom-right corner, 80×80px)

**Export Format**: PNG screenshot with transparent background zones

**Stitch Prompt Starter**: "Design YouTube thumbnail template 1280×720, bold text '[HOW TO]' left side yellow background, product image placeholder right 60%, small logo bottom-right, high contrast design"

***

## 9. Brand Style Guide Documentation

**Purpose**: Document visual standards for VAs, designers, agencies[^3_6][^3_7]

**Dimensions**: Documentation page 1200×variable (scrollable reference sheet)

**Key Elements**:

- Colour palette swatches (primary, secondary, accent + hex codes)
- Typography scale (H1/H2/body examples with sizes)
- Logo usage examples (clearspace, minimum sizes)
- Button styles (primary, secondary, disabled states)
- Spacing system guide (8px grid examples)

**Export Format**: DESIGN.md file export + PNG screenshot[^3_7][^3_6]

**Stitch Prompt Starter**: "Create brand style guide page, colour palette section with 5 swatches and hex codes, typography examples for headings and body, button style variations, logo spacing rules, organized grid layout"

***

## 10. Customer Feedback/Survey Forms

**Purpose**: Branded review collection, product feedback, or customer satisfaction surveys[^3_2]

**Dimensions**: Desktop 1024×768px (single-screen form), Mobile 375×812px

**Key Elements**:

- Form title + brief instructions (1-2 sentences)
- 4-6 input fields (text, radio buttons, star rating, textarea)
- Progress indicator (Step 1 of 3 or % complete bar)
- Submit button (clear CTA copy)
- Incentive mention ("Enter to win £50 Amazon voucher")

**Export Format**: HTML/CSS code with form field placeholders[^3_2]

**Stitch Prompt Starter**: "Design customer feedback form, title '[Help Us Improve]', 5 questions with mixed input types, star rating component, progress bar top, large submit button, clean simple layout, [brand colour] highlights"

***

## Universal Criteria Across All 10

- **Brand consistency**: Use same colour palette (primary + 2 accent colours max)[^3_4][^3_5]
- **Mobile-first thinking**: Always specify mobile breakpoint even if desktop-primary[^3_2]
- **Export-ready**: Include specific dimensions in prompt so output matches export needs[^3_1]
- **CTA clarity**: Every design needs one primary action (button copy, placement, colour)[^3_2]
- **Typography hierarchy**: Specify font weight/size relationships (e.g., "H1 bold 48px, body regular 16px")[^3_5]

Ready to refine prompts in Claude for any specific use case?

<div align="center">⁂</div>

[^3_1]: https://www.youtube.com/watch?v=kMiqteWJ3qM

[^3_2]: https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/

[^3_3]: https://www.ablebits.com/office-addins-blog/create-html-newsletter-gmail/

[^3_4]: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/

[^3_5]: https://help.apiyi.com/en/google-stitch-ai-ui-design-tool-beginner-guide-en.html

[^3_6]: https://www.linkedin.com/posts/googledevelopers_today-stitch-by-google-from-google-labs-activity-7440099157366734848-S5Sv

[^3_7]: https://www.linkedin.com/posts/joseph-michael_introducing-the-new-google-stitch-your-ai-activity-7440709033344282625-08qf

