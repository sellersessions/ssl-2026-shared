# `setup-validate`

**When**
- User says: "setup-validate", "is everything working?", "health check", "what's broken?"
- A skill called this with a failure context (e.g. `shopper-interrogator` hit a missing webhook)
- The `setup-revalidate` routine fires weekly (when configured)

**Inputs**
- In-context brain (must be readable; if not, this skill says so)
- `integrations/n8n-webhooks.md` content (uploaded to Project Knowledge if user has wired n8n)
- Seller's `brain.integrations` config

**Tools**
- HTTP HEAD/GET probes against each webhook URL (10s timeout each)
- `Write` tool (writes substituted cockpit-with-health-view to disk)
- Cowork MCP `update_artifact` (`florence-cockpit` is already created during onboard; this skill re-emits with `view: "health"` substituted)
- `templates/cockpit.html`, `templates/_placeholders.md`
- Reference: none — this skill is purely diagnostic

**Outputs**
- The cockpit artifact updated to its health view, with check rows substituted into the `{{health-required-rows}}` and `{{health-optional-rows}}` slots
- One-sentence chat summary

---

## The checks

| # | Check | Required? | How |
|---|---|---|---|
| 1 | Brain populated | Yes | `brain.business.brand` set, `brain.products` has ≥1 ASIN |
| 2 | **ProductPinion MCP — tools visible** (v0.1.8) | Yes | Tool manifest shows PP launch tools (e.g. `Pinion Ask`, `Pinion Poll Image Split`) |
| 3 | **Higgsfield MCP — tools visible** (v0.1.8) | Yes | Tool manifest shows Higgsfield image-generation tools |
| 4 | **SellerApp MCP — tools visible** (v0.1.8) | Yes | Tool manifest shows `Get Product Details` + the 15 other SellerApp tools |
| 5 | n8n-webhooks file present | No (shows yellow) | `integrations/n8n-webhooks.md` is in Project Knowledge |
| 6 | review-mining webhook reachable | No | HEAD with `x-florence-secret` header, expect 200 |
| 7 | rufus-extract webhook reachable | No | HEAD, expect 200 |
| 8 | pp-openended-launch webhook reachable | No | HEAD, expect 200 |
| 9 | objection-synthesis webhook reachable | No | HEAD, expect 200 |
| 10 | pp-ranking-launch webhook reachable | No | HEAD, expect 200 |
| 11 | image-blueprint webhook reachable | No | HEAD, expect 200 |

**Tolerance threshold:** if checks 1–4 pass (brain + 3 MCPs), Florence declares the system "ready" (degraded for the optional Shopper Interrogator webhooks). Without the 3 MCPs, the headline skills (`optimize-listing`, `render`, `pinion`, `track-products`) all fail — those are required.

`summary.status` rules:
- `ready` — checks 1–4 green, checks 5–11 green → fully wired
- `degraded` — checks 1–4 green, ≥1 of 5–11 yellow/red → headline skills work, Shopper Interrogator pipeline partial
- `broken` — check 1 red OR any of 2/3/4 red → route to `onboard` (or `/setup-n8n` for 4 specifically) for the missing wiring

---

## Behaviour

1. **Read brain.** If `business.brand` is unset, jump to producing a "broken" report with `summary.message: "Brain isn't populated yet. Type onboard."` Skip MCP + webhook probes — they don't matter without a brain.

1.5 **MCP tool-manifest checks (v0.1.8 — checks 2/3/4).** Run three quick visibility checks against Cowork's tool manifest:

- Check 2: ProductPinion — look for any tool named `Pinion Ask`, `Pinion Poll Image Split`, or starting with `Pinion`. Green if present; red with fix `{"label": "ProductPinion not connected — type onboard or follow integrations/product-pinion.md", "command": null}` if absent.
- Check 3: Higgsfield — look for image-generation tools (the exact names depend on the Higgsfield runtime manifest; check for any tool whose name contains `image` from the higgsfield connector). Green if present; red with fix `{"label": "Higgsfield not connected — type onboard or follow integrations/higgsfield.md", "command": null}`.
- Check 4: SellerApp — look for `Get Product Details`. Green if present; red with fix `{"label": "SellerApp MCP not connected — type onboard Stage 2c or follow integrations/sellerapp.md", "command": null}`.

If a check is green, also update the matching brain field:
- Check 2 green → `brain.integrations.product_pinion.client_id_set = true` (don't overwrite if already set)
- Check 3 green → `brain.integrations.higgsfield.mcp_connected = true`, `last_check = <ISO 8601 now>`
- Check 4 green → `brain.integrations.sellerapp.mcp_connected = true`, `n8n_workflow_active = true`

2. **Read `integrations/n8n-webhooks.md` from Project Knowledge.** If absent, mark check 5 yellow with fix `{"label": "Drag integrations/n8n-webhooks.md into Project Knowledge", "command": null}`.

3. **For each of the 6 webhook URLs in the file (checks 6–11):**
   - If URL is `PASTE_URL_HERE` or empty, mark yellow ("Not configured")
   - Else: HEAD probe with `x-florence-secret: <secret from same file>`. Timeout 10s.
   - 200 → green
   - 401/403 → red, fix `{"label": "Secret mismatch — check integrations/n8n.md step 5", "command": null}`
   - 404 → red, fix `{"label": "Workflow not active in n8n", "command": null}`
   - timeout / connection refused → red, fix `{"label": "Wrong URL — re-copy from n8n's webhook node", "command": null}`

4. **Render the cockpit's About tab.** (v0.1.6 — was "health view"; the integrations health rolls into the About page now.)
   - Compute `summary.status` (`ready` / `degraded` / `broken`) from the rules above and a one-sentence `summary.message` (HTML allowed; e.g. `<strong>Eight green.</strong> Florence is fully wired.`).
   - Build `{{health-required-rows}}` and `{{health-optional-rows}}` HTML — one `<div class="check">…</div>` per check (or empty-state placeholder if there are zero). Per-row HTML is in `templates/_placeholders.md` § About section pattern.
   - Compute `progress-pct` as `(green-checks / total-checks) * 100`, rounded.
   - Build `{{section-about-html}}` per `_placeholders.md` § About section pattern — about-summary banner + about-stat-grid (version, build, MCP tool counts, last sync) + the two check-section blocks.
   - Substitute the cockpit template:
     - `{{tab-about-active}}` = `"active"`, all other `{{tab-X-active}}` = `""` (`{{tab-ideas-active}}`, `{{tab-brand-active}}`, `{{tab-projects-active}}`, `{{tab-resources-active}}`)
     - `{{eyebrow}}` = `"About"`, `{{title}}` = `"Health check"` (or `"Florence is ready"` if all green)
     - `{{stage-num}}` = number of green required-checks, `{{stage-label}}` = `"checks green"`
     - `{{progress-pct}}`, `{{footer-msg-html}}` per the result
     - `{{section-about-html}}` per above
     - Other section bodies (`{{section-ideas-html}}`, `{{section-brand-html}}`, `{{section-projects-html}}`, `{{section-resources-html}}`) — fill with current state from working memory so navigation works once the artifact is rendered. If working memory is fresh (no other skills run yet), use empty-state HTML for ideas / projects / resources, and the brand section pattern with empty Setup sub-section + minimal brand summary for brand.
     - `{{tab-ideas-count}}`, `{{tab-projects-count}}`, `{{tab-resources-count}}` — counts from brain.
   - Use the `Write` tool to write the result to `./florence-cockpit.html`.
   - Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Health check · {N} green, {M} red" })`.

5. **Reply in chat with one sentence:**
   - All 8 green: *"Eight green. Florence is fully wired."*
   - Required green, ≥1 optional red: *"Florence is ready (degraded — {n} webhooks not connected)."*
   - Required red: *"Setup isn't complete. The cockpit shows what's missing — type `onboard` to fix the brain first."*

**Note:** if `florence-cockpit` was never created in this conversation (rare — user typed `setup-validate` before `onboard`), call `create_artifact` instead of `update_artifact` for the first emission. From there on, always `update_artifact`.

---

## Don't

- Don't run actual SellerApp calls or PP poll launches as part of validation. Real fetches cost tokens / credits; validation is cheap probes only.
- Don't repeatedly retry on failure during a single run. One try per check, fast feedback.
- Don't write the validation result into the brain. It's ephemeral; the artifact is the surface.
- Don't read raw secrets to the user. If the secret is wrong, say *"the shared secret in n8n-webhooks.md doesn't match what's in your n8n credential"* — never paste either value.
- Don't pretend a check passed if you couldn't run it. If the webhook URL is `PASTE_URL_HERE`, mark it yellow ("Not configured"), not green ("Skipped").