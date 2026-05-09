# Main Image Tactics Library

A 52-tactic library of main-image creative tactics, each with a
ready-to-use image-generation prompt in the ProductPinion prompt
schema. This is Florence's primary CTR improvement library.

## Files

- `main-image-tactics.json` — full structured data (52 tactics)
- `main-image-tactics.csv` — Airtable export of the same
- This file — readable index + Matt's prioritisation

## Schema (per tactic, in the JSON)

| Field | Use |
|---|---|
| `tactic_id` | MI-001 … MI-052 — stable reference |
| `tactic_name` | Short name (e.g. "Add Packaging") |
| `tactic_category` | One-line classification |
| `best_for` | Product types this fits |
| `avoid_for` | Product types where this backfires |
| `core_strategy` | One-sentence why |
| `visual_transformation` | What changes in the image |
| `required_user_inputs` / `optional_user_inputs` | What Florence has to ask the seller for |
| `standalone_json_prompt` | Drop-in JSON prompt for image-gen |
| `customer_facing_prompt` | Same prompt phrased for the seller to paste |
| `negative_prompt` | What to avoid in generation |
| `productpinion_test_hypothesis` | The hypothesis Florence states when she launches the test |
| `what_to_measure` | Which signals Florence reads from the poll results |
| `expected_ctr_impact` | High / Medium / Low (Matt's heuristic) |
| `difficulty` | High / Medium / Low (production effort) |

## How Florence selects tactics

1. **Diagnose product type** first — wearable, kit, liquid, electronics, food, etc.
2. **Filter** by `best_for` / `avoid_for` against the diagnosis.
3. **Recommend 5 tactics**, then **rank top 2–3 to test first**.
4. Weight Matt's personal high-priority tactics (below) above the
   generic `expected_ctr_impact` field.
5. Apply the **meta-rule** before ranking — see "Stand out vs follow"
   below.

## Matt's personal top 10 tactics

These weight above the JSON's generic High/Medium/Low scores. When in
doubt, start here.

| Rank | Tactic | Why Matt rates it | Tactic ID |
|---|---|---|---|
| 1 | **Add Packaging** | Biggest one. More screen real estate, more information surface. Hugely underutilised. | MI-003 |
| 2 | **Keywordize It** | Put the main search keyword on the image instead of the brand. Shoppers search for things, not brands. | MI-004 |
| 3 | **Megalabel It / Wrap It** | For sets/bundles, mega-labelling is very high impact. | MI-001, MI-032 |
| 4 | **Tilt It** | Especially powerful in straight-on, solid-colour categories. Eyelid cleanser case study: CTR up ~50%. | MI-005 |
| 5 | **Unpackage It** | Show the product out of its box in a way the category doesn't expect. | MI-009 |
| 6 | **Lifestyle It** | Worth testing as main image where Amazon allows it. Often underused. | MI-018 |
| 7 | **Position It / Fold It** | If the product has different states, show them. | MI-024, MI-051 |
| 8 | **Badge It / Explode It** | Effective but getting overdone. Only use if competitors aren't doing it. | MI-016 |
| 9 | **Ingredient It** | Good but increasingly common. Use selectively. | MI-010 |
| 10 | **Festify It** | Holiday bow / seasonal treatment. Massively underused. Works for ANY category. Real result: +33% CTR. Best case +30% sales, worst case rare listing suppression (quick fix). | MI-048 |

## The meta-rule that overrides everything

> **If the whole category is doing the same thing (badges, ingredients,
> explosions), the winning move is often the opposite — clean, simple,
> minimal. Standing out beats following best practice when best
> practice is what everyone else is doing.**

Florence checks the competitor SERP first. If a tactic is saturated in
the category, she bumps it down the recommendation list and bumps up
the contrarian tactic.

## Creative best practices (from 150+ split tests)

These compound on top of any tactic Florence picks:

- Push to **95% frame fill** — significant CTR lift over 75–85% crops
- Show the product in its **active state** (water spraying, light on,
  fan moving)
- Print **quantity prominently on pack** — "180 COUNT" beats "family
  size." Specific numbers beat round claims (buyers call round numbers
  "exaggerated")
- Print **trust stamps on the box** — lifetime warranty, FDA cleared,
  99.9% claims printed on the package face
- **Box + contents + loose sample** composition — answers "what
  physically arrives at my door?"
- Show **dispensing mechanism** — dropper extended, pump primed, lid off
- For multi-SKU products — show **colour range**
- **3/4 angle** often beats flat-front — reveals depth
- **Vertical orientation** fills 30–40% more pixels in a square thumbnail
- **Highest-contrast colour variant** as hero (red beat gray in a
  commodity category)
- Multi-pack: **spaced not stacked** — negative space reads as abundance

## Soft flags Florence raises

These aren't auto-fails, but Florence calls them out:

- Sub-85% product fill
- AI-generated backgrounds or models — shoppers detect it, Amazon
  scrutiny rising
- 4+ competing badges — single-claim heroes win; multiple badges signal
  salesman
- Hidden quantity or capped products
- Generic packaging that mirrors competitors
- Photoshopped overlay text or badges — print on the package instead

## 60-second main image audit

A quick checklist Florence runs before recommending any test:

1. Is the product **90%+ of frame**? If not, recrop.
2. Is this a **3/4 view** or flat-front? Test 3/4.
3. Is the **package doing work** — quantity, claims, before/after? If
   not, consider redesigning.
4. For **consumables** — is the dropper / pump visible?

## Full tactic index (52)

| ID | Name | Category | CTR impact | Difficulty |
|---|---|---|---|---|
| MI-001 | Megalabel It | Bundle value signal | High | Medium |
| MI-002 | Humanize It | Use context and scale | High | Medium |
| MI-003 | Add Packaging | Information billboard | High | Medium |
| MI-004 | Keywordtize It | Search intent match | High | Low |
| MI-005 | Tilt It | Pattern interrupt | Medium | Low |
| MI-006 | Hang Tag It | Floating value callout | Medium | Low |
| MI-007 | Sunburst It | Depth and attention | Medium | Low |
| MI-008 | Solid Color It | Color differentiation | Medium | High |
| MI-009 | Unpackage It | Product transparency | Medium | Medium |
| MI-010 | Ingredient It | Ingredient proof | High | Medium |
| MI-011 | Smear It | Texture proof | High | Low |
| MI-012 | Finalize It | Finished outcome | High | Medium |
| MI-013 | America It | Origin trust cue | Medium | Low |
| MI-014 | TikTok It | Social proof | Medium | Low |
| MI-015 | Dead Pixel Space It | Unused-space callout | High | Low |
| MI-016 | Expand Explode It | Value inventory display | High | High |
| MI-017 | Light It | Active feature visualization | High | Medium |
| MI-018 | Lifestyle It | In-context aspiration | Medium | High |
| MI-019 | Petify It | Relevant user/beneficiary | High | Medium |
| MI-020 | Splash It | Flavor and refreshment cue | Medium | Medium |
| MI-021 | Spill It | Liquid transparency | Medium | Medium |
| MI-022 | iPhone It | Scale reference | High | Medium |
| MI-023 | Clone It | Variant visualization | High | High |
| MI-024 | Position It | Multiple form factors | High | Medium |
| MI-025 | Swatch It | Color option cue | High | Low |
| MI-026 | Merchandise It | Use-case staging | High | Medium |
| MI-027 | Weight It | Capacity proof | High | Low |
| MI-028 | Arrow It | Motion explanation | High | Low |
| MI-029 | Breeze It | Invisible force visualization | High | Medium |
| MI-030 | Waterproof It | Proof of resistance | High | Medium |
| MI-031 | Demo It | Action proof | High | High |
| MI-032 | Wrap It | Bundle grouping | High | Medium |
| MI-033 | Feature It | Third-party proof | Medium | Low |
| MI-034 | Accessorize It | Completeness display | High | High |
| MI-035 | Screen Real Estate It | Screen as billboard | High | Medium |
| MI-036 | Run Off Label It | Label readability expansion | Medium | High |
| MI-037 | Background It | Subtle visual pop | _(see data note)_ | Medium |
| MI-038 | Teacup Handle It | Connected callout bridge | Medium | Medium |
| MI-039 | Flip It | Dual-side information | High | Medium |
| MI-040 | Grab It | In-use quantity access | Medium | High |
| MI-041 | Before and After It | Outcome contrast | High | High |
| MI-042 | Lifetime Warranty It | Risk reversal | Medium | Low |
| MI-043 | X-Ray It | Internal mechanism/benefit | Medium | High |
| MI-044 | Multiply It | Pack-size abundance | High | Medium |
| MI-045 | Box It | Utilitarian box billboard | High | Medium |
| MI-046 | Case It | Bulk-pack structure | High | Medium |
| MI-047 | Value Size It | Size/value cue | High | Low |
| MI-048 | Seasonal Merchandise It | Occasion positioning | Medium | Medium |
| MI-049 | Write Directly On It | Surface messaging | Medium | Medium |
| MI-050 | Explain Install It | Instructional clarity | High | Medium |
| MI-051 | Fold It | Pattern/material reveal | Medium | Low |
| MI-052 | AI Generate Box It | Generated info box | High | Medium |

## Data note

`MI-037 Background It` has a malformed `expected_ctr_impact` field in
the source JSON — the value reads "visual standout, CTR preference,
perceived polish" (which is actually the `what_to_measure` content).
The other 51 entries follow the High/Medium/Low convention. Worth
fixing in the source library before relying on `expected_ctr_impact`
for automated filtering.

## Source

Promoted from `ctrboost-matt-knowledge` branch (2026-05-05 upload).
Original brief: `knowledge/cro/source/matt-2026-05-05-interview.md`,
Topic 6.
