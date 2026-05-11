# Prerequisite tools — whitelists per brand_type

**Purpose.** Sim test-run #6: Helium 10 / Datadive / JungleScout were rendered as retire candidates on Sim's first run. They aren't — they're table stakes for any Amazon FBA brand. This file is the canonical whitelist `diagnose-sprawl` reads; tools matching here render as **"prerequisite (table stakes)"** on Page 03, are excluded from retire-recommendations on Page 06, and have their `monthly_cost` excluded from the rented-subs total when computing net savings.

The whitelist applies on tool *name* match (case-insensitive, trimmed). Variants like "Helium10" or "H10" are aliased.

---

## Amazon FBA / Marketplace sellers — `brand_type: amazon`

Detection signals: any of `business.channels` contains `Amazon UK`, `Amazon US`, `Amazon EU`; or `business.category` contains `Amazon`, `FBA`, `Seller Central`.

| Tool | Aliases | Why prerequisite |
|---|---|---|
| Helium 10 | Helium10, H10 | Cerebro / Magnet keyword research is the de-facto KW baseline. Replacing the entire suite means rebuilding research workflows that aren't the bottleneck. **Stock module + review automation may consolidate** *(see consolidate column)* but the keyword UI itself is keep. |
| Data Dive | DataDive, Datadive | Niche research — finding sub-categories where the brand can win. Unique workflow. |
| Jungle Scout | JungleScout, JS | Same role as Helium 10 for sellers who picked it first. Whitelist either; never recommend retiring both. |
| Keepa | — | Historical price + BSR tracking. Cheap (~£15/mo), unique data, no in-house alternative is realistic. |
| Seller Central | Amazon Seller Central | Amazon's own platform. Not a SaaS sub — it's a referral % paid on sales. Always prerequisite. |
| Brand Analytics | SQPR | Free with Brand Registry. Prerequisite for any keyword / ranking / search-term work. |

**Consolidate-rather-than-retire candidates** *(prerequisite=true but `tone: consolidate` allowed)*:
- Helium 10 — keep Cerebro/Magnet, retire stock module *(→ Module 03 Demand Planning)* and review automation *(→ native flows)*. Drop to a lower seat tier if available.

**Not on the whitelist** *(retire-eligible)*:
- Scale Insights *(opaque PPC black-box; in-house Module 04 replaces)*
- Adtomic *(same)*
- Perpetua / Quartile / PacVue *(same)*
- SellerBoard / ManageByStats *(consolidates into Module 06 SQL MCP)*
- SellerApp *(consolidates into Module 03 Demand Planning)*

---

## TikTok Shop native — `brand_type: tiktok_native`

Detection signals: `business.channels` contains `TikTok Shop`; or `business.category` contains `TikTok`.

| Tool | Aliases | Why prerequisite |
|---|---|---|
| KaloData | Kalo Data, Kalodata | Trend/product research for TikTok Shop. The default — no realistic in-house alternative for the trend signal. |
| Fast Moss | FastMoss, FMoss | Creator + product analytics. Often paired with KaloData. |
| TikTok Shop Seller Center | TTSC | Platform itself. Not a sub. |

---

## Shopify D2C — `brand_type: shopify_d2c`

Detection signals: `business.channels` contains `Direct-to-consumer` AND `business.category` mentions Shopify or D2C; or any tool named `Shopify`.

| Tool | Aliases | Why prerequisite |
|---|---|---|
| Shopify | Shopify Plus | Platform itself. |
| Klaviyo | — | Email + SMS for D2C — replacing it means rebuilding lifecycle flows. Prerequisite *unless* the brand's email_suite covers it *(rare)*. |

**Note.** Shopify-native brands are F-Q1 deferred; this section is a placeholder so the whitelist file is forward-compatible.

---

## Multi-channel (Amazon + D2C + Wholesale) — `brand_type: multi_channel`

Apply Amazon whitelist + relevant other-channel whitelists. A multi-channel brand keeps Helium 10 (Amazon) AND Klaviyo (D2C) — both are prerequisites for their respective channels.

---

## How `diagnose-sprawl` uses this file

Pseudocode:

```
brand_type = derive_brand_type(brain.sections.business)
prerequisites = load_whitelist_for(brand_type)

for tool in brain.sections.stack.tools:
    if matches(tool.name, prerequisites):
        tool.prerequisite = true
        tool.diagnosis_label = "prerequisite (table stakes)"
        # exclude from retire recommendations
        # exclude monthly_cost from rented_subs_total
        # render on Page 03 in a "Prerequisites · keep" subsection separate
        # from the redundant-subs list
```

**Bundled-aware exclusion (Sim #1):** in addition to the prerequisite check, any tool whose `name` matches `email_suite.bundled_apps` has `monthly_cost: "bundled"` and contributes £0 to the rented-subs total. Bundled tools are NOT prerequisite by default — Microsoft Teams under M365 is bundled but still a retire candidate if the team has migrated to Slack.

---

## Adding a new whitelist entry

1. Add the row to the appropriate brand_type table above.
2. Cross-reference `skills/diagnose-sprawl.md` § "Prerequisite-aware diagnosis" — confirm the section reads from this file.
3. If a new `brand_type` is being added, also update `skills/recommend-modules.md` § "Brand-type derivation" so the type is detectable.

This file is data, not logic. Logic lives in `diagnose-sprawl.md`.
