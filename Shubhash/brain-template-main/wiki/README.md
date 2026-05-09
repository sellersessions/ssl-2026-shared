---
type: wiki-index
---

# Wiki - start here

This is your operator brain. The atomic unit is **one page per parent ASIN**. Everything else exists to give context to a SKU.

---

## Folder map

| Folder | What lives here |
|---|---|
| `skus/` | One page per parent ASIN. The thing this whole brain rotates around. |
| `suppliers/` | One page per factory or trader. Linked from every SKU they make. |
| `channels/` | One page per sales channel (Amazon US, TikTok Shop, Shopify, etc). |
| `decisions/` | Every irreversible call. Price moves, supplier swaps, brand pivots. |
| `playbooks/` | Repeatable event runbooks. Prime Day, BFCM, restock, launch. |
| `concepts/` | Operator vocabulary. CM3, cash cycle, TACoS, FBA fees, etc. |
| `daily/` | One per day. Yesterday's numbers, OOS list, 3 wins, 3 fires. |
| `team/` | China sourcing, US VA, UK ops, agencies, freelancers. |
| `ip/` | Trademarks, patents, compliance docs, lab tests. |
| `finance/` | P&L closes, cash plan, restock budget. |

---

## How a page is shaped

Every page has:

1. **Frontmatter** at the top - structured fields (ASIN, COGS, status, etc) so Claude Code can read them.
2. **Numbers** block - what's true right now.
3. **Body** - context, history, links.
4. **Claude prompt block** at the bottom - one-line commands you can run against the page.

If you keep that shape, the brain stays useful both to you and to Claude Code reading it.

---

## Workflow on day one

1. Open `skus/` and read the example page.
2. Copy the SKU template from `_templates/sku.md`.
3. Fill in **one** of your top SKUs. Just one. Not all of them.
4. Link the supplier, link the channel, link a recent decision.
5. Open `daily/` and create today's note.
6. From here, every time something happens, you know which page it belongs on.

---

## Read next
- `skus/README.md` - how SKU pages work
- `concepts/cm1-cm2-cm3.md` - the contribution margin language used everywhere here
- `claude/README.md` - wiring Claude Code to the brain
