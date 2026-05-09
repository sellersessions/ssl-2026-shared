# `onboard`

**When**
- User's in-context brain has no `business.brand` (first run in a fresh project)
- User says: "let's start", "begin", "what is this?", "how does this work?", "onboard", "start"
- User uploads a `florence-brain.json` AND it fails the schema check → fall back to fresh onboard with the bad file noted

**Inputs**
- The user's first message
- Empty in-context brain (this skill builds it)

**Tools**
- Chat (frame, ask, confirm)
- `Write` tool (writes the substituted cockpit + brain JSON to disk)
- Cowork MCP `create_artifact` (first emission of an id) and `update_artifact` (every later emission)
- `templates/cockpit.html` — single stable id `florence-cockpit`, path `./florence-cockpit.html`
- `templates/brain-schema.json` — JSON Schema the brain must conform to
- `templates/_placeholders.md` — substitution contract for the cockpit

**Outputs**
- In-context brain populated through `schema_version: "1.0"`
- `florence-cockpit` artifact emitted ~5 times (1 × `create_artifact`, 4 × `update_artifact`)
- `florence-brain` artifact emitted at end (1 × `create_artifact`) — the user downloads + drags into Project Knowledge
- Wrap-up message: *"Ready. Type `today` for today's brief or `recommend-test` to start a CRO loop."*

---

## v0.1.6 cockpit tokens — migration note

The cockpit got a multi-page redesign in v0.1.6 (5 tabs: Ideas / Brand / Projects / Resources / About). Onboarding now nests inside the **Brand** tab as a "Setup" sub-section; it doesn't have its own tab. Concretely:

- Use `{{tab-brand-active}} = "active"` (was `{{view-onboard-active}} = "active"`)
- Set the other tab-active tokens to `""` (`{{tab-ideas-active}}`, `{{tab-projects-active}}`, `{{tab-resources-active}}`, `{{tab-about-active}}`)
- The 6 onboarding page cards (`{{page-0-class}}` through `{{page-5-body-html}}`) nest **inside** `{{section-brand-html}}` per the Brand section pattern in `_placeholders.md` § Brand section HTML pattern. Build the brand section like:
  ```
  <Brand summary header card> +
  <"Setup" subhead + the 6 onboarding page cards stacked> +
  <"Voice" subhead + voice card> +
  <"Brand guidelines" subhead + brand_guidelines card> +
  <"Personnel" subhead + personnel card> +
  <"Products" subhead + product grid>
  ```
- Other sections (`{{section-ideas-html}}`, `{{section-projects-html}}`, `{{section-resources-html}}`, `{{section-about-html}}`) — fill with the matching empty-state from `_placeholders.md` for cold-install runs, or current state for re-emissions.
- `{{tab-ideas-count}}`, `{{tab-projects-count}}`, `{{tab-resources-count}}` — render `0` when empty, integer count otherwise.

The existing step content below uses the legacy `{{view-onboard-active}}` token in places. Treat it as an alias for `{{tab-brand-active}}` per `_placeholders.md` § Backward-compat aliases. The substantive emission logic (which stage gates lock which pages, what the body HTML looks like) is unchanged.

---

## Behaviour

### Stage -1 — Welcome artifact (~30 seconds — read time) (NEW in v0.1.9)

**The very first emission of `onboard`.** Before the cockpit, before any question, Florence renders the welcome artifact — a single-page intro to who she is + the systems-thinking pitch + the workshop ecosystem context + 6 example skills + the CTA to type `ready`. This anchors the user before the heavier MCP-wiring stage that follows.

1. Read `templates/welcome.html` from Project Knowledge.
2. Strip the leading `<!-- TEMPLATE — substitute {{placeholders}} ... -->` doc-comment.
3. Substitute the two placeholders per `templates/_placeholders.md` § `welcome.html`:
   - `{{version}}` = Florence's current version string (read from line 3 of `0-paste-this-into-custom-instructions.txt`, e.g. `0.1.9-welcome-artifact`)
   - `{{install-time}}` = `22 minutes` (current `onboard` total — Stage 0 through Stage 8 including Stage 2 MCP wiring)
4. Use the `Write` tool to write the result to `./florence-welcome.html`.
5. Call `create_artifact({ id: "florence-welcome", html_path: "./florence-welcome.html", description: "Florence — Welcome" })`.
6. **Then** chat-side, narrate one line:
   > Welcome card landed in the right panel. Read it through, then type `ready` when you want to start.

Do **not** proceed to Stage 0 (cockpit emission) until the user types `ready` / `let's go` / `begin` / similar confirmation. The welcome artifact is the user's pacing tool — they read at their own speed, then unblock the flow.

After the user confirms: proceed directly to Stage 0.

The welcome artifact stays in the right panel as a permanent reference card for the rest of the conversation. Florence does NOT update or re-emit it. If the user asks "what was that intro again?", point them at the `florence-welcome` card in the right panel.

### Stage 0 — Visual-first welcome (~10 seconds)

**After Stage -1 completes** (user typed `ready`), emit the stub cockpit so the user has the navigation surface alongside the welcome card.

1. Read `templates/cockpit.html` from Project Knowledge.
2. Substitute placeholders (per `templates/_placeholders.md`):
   - `{{view-onboard-active}}` = `"active"`, `{{view-health-active}}` = `""`
   - `{{eyebrow}}` = `"Cockpit"`
   - `{{title}}` = `"Setting up your assistant"`
   - `{{stage-num}}` = `0`, `{{stage-label}}` = `"Welcome"`
   - `{{progress-pct}}` = `0`
   - `{{footer-msg-html}}` = `Florence is waiting — say <em>let's start</em> in chat.`
   - Page 0: `class=""` `badge-class="current"` `badge-label="current"` + the canonical Welcome body HTML from `_placeholders.md`
   - Pages 1–5: `class="locked"` `badge-class="locked"` `badge-label="locked"` + the locked-stub body (`Fills in after {{after-condition}}.`)
   - Health-view tokens: empty strings
3. Use the `Write` tool to write the result to `./florence-cockpit.html`.
4. Call `create_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", description: "Florence — Setup & Brain" })`.
5. **Then** open with the four-paragraph identity intro:

   > Morning. I'm **Florence** — your Chief Data Analyst for Amazon. I read the data, watch competitors, run shopper panels, and tell you which lever to pull next.
   >
   > I work the way a senior analyst peer would. I lead with the conclusion, cite the numbers behind it, and end every recommendation with one specific action. No fluff, no listicles, no "as an AI."
   >
   > Right panel — your **Cockpit** is now in the Artifacts panel. It'll fill in as we talk. If it disappears later, click the Artifacts icon at the top.
   >
   > We'll do a 10-minute interview to get the basics in. After that you can pause anywhere — I'll pick up where we left off if you upload my `florence-brain.json` next session. Quick first: **what's your brand called?**

Capture the answer to `brain.business.brand`.

### Stage 1 — Marketplaces (~30 seconds)

> Got it — **{brand}**. Which Amazon marketplaces? US only, US + UK + DE, something else?

Use the option-set pattern:

```
Pick what fits — reply with a number, comma list, or write your own:
  01  amazon.com only
  02  amazon.com + amazon.co.uk
  03  amazon.com + EU (UK, DE, FR, IT, ES)
  04  Worldwide (US + EU + JP + AU)
  99  (custom — type the marketplaces)
```

Capture to `brain.business.marketplaces`.

**Re-emit cockpit (stage 1).**

1. Re-render `templates/cockpit.html` with stage 1 substitutions: `{{stage-num}}` = `1`, `{{stage-label}}` = `"Business"`, `{{progress-pct}}` = `20`, page 0 = done, page 1 = current+full content (brand + marketplaces filled), pages 2–5 still locked.
2. `Write` to `./florence-cockpit.html` (overwrites prior content).
3. Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Brand captured · stage 1/8" })`.
4. In chat: *"Brand captured. Anything off? Otherwise next: team."*

Wait for the user's "continue" / "ready" / direct answer before moving on.

### Stage 2 — MCP wiring (~12 minutes) (NEW in v0.1.8)

This stage wires the three MCPs Florence depends on: ProductPinion (panel polls), Higgsfield (image generation), and n8n + SellerApp (product data + Shopper Interrogator pipeline). Without these wired, `track-products`, `optimize-listing`, `render`, `pinion`, and `shopper-interrogator` all fail.

Florence narrates each sub-stage step-by-step. The user clicks through Cowork's Connectors UI; Florence verifies via tool-manifest checks. Each sub-stage emits the cockpit so the Brand tab's Setup sub-section shows MCP status as Florence walks through it.

Open with the framing:

> Three integrations, ~12 minutes. ProductPinion + Higgsfield are one-click each (~1 min). The third — n8n hosting the SellerApp tools — is the heavy one (~10 min). I'll walk you through each. We'll need:
>
> - Your **ProductPinion account** (sign in via OAuth — no API key)
> - Your **Higgsfield account** (sign in via OAuth — no API key)
> - **n8n.cloud** account (free tier; sign up takes 60 seconds) OR n8n Desktop installed
> - Your **SellerApp credentials** — Client ID + API token from your SellerApp dashboard. If you don't have these handy, we can defer the SellerApp piece — `track-products` etc. will say "do `/setup-n8n` first" until you wire it.
>
> Ready to go through it? (yes / let's defer / use workshop defaults if you have them)

#### Stage 2a — ProductPinion (~1 minute)

> ProductPinion first. Open Claude Settings → Connectors → Add Custom Connector. Two fields:
>
> - **URL:** `https://api.productpinion.com/mcp`
> - **Client ID:** `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y` (workshop default; you can swap to your own later)
>
> Click Save. Sign in with your PP account when Cowork prompts. **Restart Cowork** so it picks up the new MCP. Tell me 'done' when you see PP tools.

After user says 'done':

1. Florence runs a tool-manifest check — looks for ProductPinion launch tools (e.g. `Pinion Ask`, `Pinion Poll Image Split`, etc.).
2. **On success**: set `brain.integrations.product_pinion.client_id_set = true` + `plan = "test"`. Re-emit cockpit (Brand tab Setup sub-section MCP row → PP green).
3. **On failure**: surface the specific missing tool, offer to walk the steps again. Don't auto-skip — without PP, `pinion` and `shopper-interrogator` fail.

#### Stage 2b — Higgsfield (~1 minute)

> Higgsfield next. Same pattern: Settings → Connectors → Add Custom Connector. One field:
>
> - **URL:** `https://mcp.higgsfield.ai/mcp`
>
> No API key needed — Higgsfield uses OAuth. Sign in with your Higgsfield account when prompted. **Restart Cowork**. Tell me 'done' when you see image-generation tools.

After 'done':

1. Tool-manifest check — looks for Higgsfield generation tools.
2. **On success**: set `brain.integrations.higgsfield.mcp_connected = true` + `last_check = <ISO 8601 now>`. Re-emit cockpit (Higgsfield row green).
3. **On failure**: surface the missing tool, walk the steps again.

#### Stage 2c — n8n + SellerApp (~6 minutes — workshop creds baked in)

The biggest sub-stage but much simpler in v0.1.10: SellerApp credentials are **already baked into the workflow JSON** (workshop-shared `support_keplo` / `fbfa59f5-43fb-460e-ac0b-4740132a81f1`). No find-replace, no n8n credential creation. Just sign up for n8n, import the workflow, activate, copy the URL, paste into Cowork.

Florence narrates each step explicitly — read these out, the user clicks through, type 'done' between steps.

---

**2c.1 — Sign up for n8n (~2 min).**

> Two paths: **n8n.cloud** (free tier, 5 active workflows + 5,000 executions/month — exactly what Florence needs) or **n8n Desktop** (offline, runs on your laptop). n8n.cloud is faster for the workshop.
>
> 1. Open <https://n8n.cloud> in a new tab
> 2. Click **Sign up** (top-right)
> 3. Use your email or Google sign-in
> 4. Pick a workspace name (anything — `florence` works)
> 5. Skip the onboarding tour
>
> Tell me **'done'** when you see your empty n8n workspace (the Workflows page).

---

**2c.2 — Download the workflow file (~30 sec).**

> The SellerApp MCP workflow ships with workshop credentials baked in. Download it from your Project Files:
>
> 1. Open Cowork's **Project Files** panel (left sidebar)
> 2. Navigate into `n8n/`
> 3. Right-click `florence-mcp-sellerapp.json` → **Download**
> 4. Save it somewhere you can find — Desktop, Downloads, anywhere
>
> Tell me **'done'** when you have the file on your laptop. Workshop note: the `support_keplo` SellerApp credentials are shared across delegates — there's a token cap on the shared account, so for production use you'd swap in your own credentials post-workshop. For today's demo it works fine.

---

**2c.3 — Import the workflow into n8n (~30 sec).**

> Back in n8n:
>
> 1. Click **Workflows** (top-left navigation)
> 2. Click **Add workflow** → **Import from File** (or in n8n.cloud: **+ Create Workflow** → top-right menu → **Import from File**)
> 3. Select the `florence-mcp-sellerapp.json` you just downloaded
> 4. The workflow opens in n8n's editor — you'll see one **MCP Server Trigger** node connected to ~16 **HTTP Request** tool nodes
>
> Tell me **'done'** when the workflow is open in the editor. Don't change anything — credentials are pre-baked, the workflow is ready to go.

---

**2c.4 — Activate the workflow + copy the production URL (~1 min).**

> Two clicks + one copy:
>
> 1. Top-right of the editor: toggle the **Inactive / Active** switch to **Active**. n8n saves automatically.
> 2. Click the **MCP Server Trigger** node (the leftmost node — labelled "MCP Server Trigger" or similar)
> 3. In the panel that opens, find the **Production URL** field. Copy it. It looks like `https://YOUR-WORKSPACE.app.n8n.cloud/mcp/<long-random-id>`
>
> Tell me **'done'** when you have the production URL on your clipboard. Don't share that URL publicly — anyone with it can call the SellerApp tools through your n8n.

---

**2c.5 — Add the connector in Claude / Cowork (~1 min).**

> Now register the MCP in Cowork:
>
> 1. Open **Settings → Connectors → Add Custom Connector**
> 2. Fill in:
>    - **Name:** `Florence MCP — SellerApp`
>    - **Server URL:** paste the n8n production URL from step 2c.4
> 3. Click **Add → Connect**
> 4. **Restart Cowork** (close + re-open the app — Cowork picks up new MCPs on launch)
>
> Tell me **'done'** when Cowork is back open.

---

**2c.6 — Tool-manifest check.**

After the user says 'done':

1. Florence checks for SellerApp tools in the manifest — looks for `Get Product Details`, `Get Product Reviews`, `Get Rufus AI Queries`, `Keyword Research V2`, `Keyword Search Result`, etc. (16 total per `integrations/sellerapp.md`).
2. **On success**: set `brain.integrations.sellerapp.mcp_connected = true` + `n8n_workflow_active = true` + `geo` mapped from `brain.business.marketplaces[0]`. Set `brain.integrations.n8n.secret_set = true`. Re-emit cockpit (SellerApp row + n8n row green). In chat: *"SellerApp wired — 16 tools live. Moving on to team next."*
3. **On failure**: surface what's missing + the specific step to retry. Common failures + fixes:

| What you see | Likely cause | Fix |
|---|---|---|
| No SellerApp tools at all | Cowork didn't restart after Connector added | Quit Cowork fully (not just close window — Cmd-Q on Mac); re-open |
| `Get Product Details` errors with 401 | Workshop credentials hit token cap (rare but possible at scale) | Florence falls back to "deferred" — user swaps in own SellerApp creds post-workshop via integrations/sellerapp.md |
| Connector says "URL not reachable" | Workflow is Inactive in n8n, OR URL was copied incomplete | Back to 2c.4: confirm Active + re-copy the full Production URL |
| Some tools visible, others missing | n8n workflow imported but didn't activate properly | In n8n: workflow editor → top-right → toggle Active off then on; wait 5 sec |

If the user wants to defer: set `brain.integrations.sellerapp.mcp_connected = false`, note in chat that `track-products` and `optimize-listing` will say "do `/setup-n8n` first" until they come back, proceed to Stage 3.

---

**Cockpit emission cadence in Stage 2** (3 emissions, one per sub-stage):
- After 2a (PP): `update_artifact({ ..., update_summary: "ProductPinion wired · stage 2/8" })`
- After 2b (Higgsfield): `update_artifact({ ..., update_summary: "Higgsfield wired · stage 2/8" })`
- After 2c (n8n + SellerApp): `update_artifact({ ..., update_summary: "MCPs wired · stage 2/8" })`

The Brand tab Setup sub-section shows a 4-row MCP status grid (PP / Higgsfield / SellerApp / n8n) — green / yellow / red dots matching the brain.integrations.{X}.mcp_connected state.

### Stage 3 — Team and personnel (~1 minute)

> Quick one — anyone on your team I should tag in briefs? First name + Slack handle is enough. Or just say "solo" and I'll skip.

Free text. Parse and write to `brain.personnel`. If "solo" or skip, leave empty.

(No cockpit re-emit yet — combine with stage 3 to keep emission cadence at ~5 total.)

### Stage 4 — Products (~3 minutes) (was Stage 3)

> Paste 1–25 ASINs (or amazon URLs) you want me watching. One per line, comma-delimited, or pasted URLs all work.

**Hand off to `skills/track-products.md`** to do the parse + fetch. That skill:

- Parses each input → `(asin, geo)` tuples (URL → geo from TLD; bare ASIN → `brain.business.marketplaces[0]`)
- Calls SellerApp `Get Product Details` sequentially for each, with all 7 flags (`fee_detail`, `price_detail`, `potential_detail`, `ratings`, `realtime_data`, `promotions`)
- Writes the full SellerApp response to `brain/products/{asin}-{geo}.json` (cache layer)
- Adds `{ asin, geo, title, current_main_image_url, goal: null, status: "tracked" }` to `brain.products[]`
- Re-emits the cockpit so page 3 shows real product cards (image + title + ASIN) instead of "[FILL_IN]"

If `Florence MCP — SellerApp` isn't connected, surface that and route to `integrations/sellerapp.md` setup. Don't fall back to "leave title null and we'll fix it later" — the value of stage 3 is the visceral "Florence already knows my products" moment.

If they paste fewer than 1 ASIN, ask once more. If they say "I don't know my ASINs", stop and explain how to find them in Seller Central (Reports → Inventory → ASIN column).

### Stage 5 — Competitors per product (~2 minutes) (was Stage 4)

For each tracked ASIN:

> Top product: **{asin} — {title or "the first one"}**. Who do you watch? Paste 3–5 competitor ASINs.

Apply the option-set escape if useful:

```
  01  I'll do this later
  02  Same competitor set across all my products
  99  (custom — paste the ASINs)
```

Write to `brain.competitors[asin]`. If "same set across all", capture once and copy.

**Re-emit cockpit (stage 3).**

1. Re-render with stage 3 substitutions: `{{stage-num}}` = `3`, `{{stage-label}}` = `"Products & competitors"`, `{{progress-pct}}` = `60`, pages 0–3 unlocked (with team + products + competitors filled), pages 4–5 still locked.
2. `Write` to `./florence-cockpit.html`.
3. Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Products captured · stage 4/8" })`.
4. In chat: *"Products and competitors logged. Anything off?"*

### Stage 6 — Voice (~1 minute) (was Stage 5)

> Three words that describe how your brand should sound. And three things I should never say.

Free text both. Parse into `brain.voice.adjectives` and `brain.voice.forbiddens`.

If they say "you pick" or "I don't know", offer three sensible defaults based on the product category and ask them to swap any. Don't push back twice.

### Stage 7 — Goals per ASIN (~1 minute) (was Stage 6)

For each ASIN:

> Goal for **{asin}**: lift CVR? Improve CTR on the main image? Push volume? Launch a variant?

```
  01  Lift CVR
  02  Improve CTR (main image work)
  03  Push volume / market share
  04  Launch a variant or bundle
  05  Defend BSR / hold position
  99  (custom — type one sentence)
```

One sentence each. Write to `brain.goals[asin]`. Don't push for SMART goals — "lift CVR" is enough.

### Stage 7.5 — Brand guidelines (optional, ~1 minute) (was Stage 6.5)

> One last optional thing — got brand colours, fonts, or visual style notes handy? I'll respect them when I render image concepts. Skip if not — I'll fall back to a neutral premium aesthetic.

If the user has anything to share, parse into `brain.business.brand_guidelines`:

- **Colours** — paste hex codes (`#1FA877`, `#152823`, etc.) → primary, secondary, accent. Florence accepts named colours too ("our green is a deep emerald") and asks for the hex if they have it.
- **Fonts** — headline font name + body font name. Florence uses these in the prompts she sends to Higgsfield (the actual typesetting happens in post via the brand's designer).
- **Visual style keywords** — 3-5 adjectives that describe the brand's visual identity (e.g. `["minimal", "editorial", "premium", "soft-natural"]`). These drive the Higgsfield prompt's scene + mood sections.
- **Tone descriptors** — informs any photoreal copy on listing-image concepts (works alongside `voice.adjectives`).
- **Logo URL** — only useful if the user has a transparent PNG of the wordmark; defer if not.

If user says "skip" / "we don't have that yet" / "use defaults": leave `brand_guidelines` empty. Florence's render skills detect the empty struct and fall back to neutral premium aesthetic, surfacing that on every concept card.

This stage is **optional**. Don't push if the user wants to skip — they can run `onboard --brand-guidelines` later (or just edit `florence-brain.json` directly) when they're ready.

**Re-emit cockpit (stage 4).**

1. Re-render with stage 4 substitutions: `{{stage-num}}` = `4`, `{{stage-label}}` = `"Voice & goals"`, `{{progress-pct}}` = `80`, pages 0–4 unlocked (voice + goals visible), page 5 still locked.
2. `Write` to `./florence-cockpit.html`.
3. Call `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Voice & goals · stage 7/8" })`.
4. In chat: *"Voice and goals captured. Anything off?"*

### Stage 8 — Recap and emit `florence-brain.json` (was Stage 7)

Read all six brain sections back in one paragraph:

> Got it. **{brand}**, {n} ASINs ({list}), {n} competitor sets, voice = {adjectives} (avoid: {forbiddens}), goals = {summary}. Anything wrong?

If they correct something, edit the relevant brain field and confirm.

Once they say "looks right":

1. **Emit `florence-brain.json`.** Compose the full JSON object matching `templates/brain-schema.json`. Use `Write` to save to `./florence-brain.json`. Call `create_artifact({ id: "florence-brain", html_path: "./florence-brain.json", description: "Florence — Brain (drag back into Project Knowledge)" })`.

2. **Final cockpit emission (stage 5).**
   - Re-render with `{{stage-num}}` = `5`, `{{stage-label}}` = `"Ready"`, `{{title}}` = `"Florence is ready"`, `{{progress-pct}}` = `100`, all pages unlocked, page 5 = current with the wrap-up content (the canonical "Onboarding complete..." HTML from `_placeholders.md`).
   - `{{footer-msg-html}}` = `Setup complete · save <em>florence-brain.json</em> and try <em>today</em>.`
   - `Write` to `./florence-cockpit.html`.
   - `update_artifact({ id: "florence-cockpit", html_path: "./florence-cockpit.html", update_summary: "Complete · 100%" })`.

3. Send the wrap-up — **two-part**: brain saved + the optional `image-strategy` offer (soft, opt-in):

   > Saved. Download **florence-brain.json** from the right panel and drag it into Project Knowledge — that's how I remember you next session.
   >
   > **Optional next step:** scope your image strategy before we close out. `image-strategy` runs ~10 min — analyses top 15 category bestsellers on **{main-keyword}**, reverse-engineers what wins, tunes my Higgsfield prompts to your brand. Skip and I'll prompt at your first `render`. Type **`image-strategy`** to run now, or **`done`** to wrap up.
   >
   > Ready. Try **`today`** for today's brief, or **`recommend-test`** if you've got a specific CTR or CVR question.
   >
   > — F.

   If user types `image-strategy`: route to `skills/image-strategy.md` immediately. If `done` (or anything else): finish onboarding; the first `render` request will prompt again per `image-strategy.md`'s "When" rules.

---

## Emission summary (verification gates)

| # | When | Tool | `update_summary` |
|---|---|---|---|
| 0 | First message (Stage -1 — the welcome artifact, NEW in v0.1.9) | `create_artifact({ id: "florence-welcome" })` | (description: "Florence — Welcome") |
| 1 | After user types `ready` (Stage 0 — cockpit stub) | `create_artifact({ id: "florence-cockpit" })` | (description in args) |
| 2 | After brand + marketplaces captured (Stage 1) | `update_artifact` | `Brand captured · stage 1/8` |
| 3 | After ProductPinion MCP wired (Stage 2a) | `update_artifact` | `ProductPinion wired · stage 2/8` |
| 4 | After Higgsfield MCP wired (Stage 2b) | `update_artifact` | `Higgsfield wired · stage 2/8` |
| 5 | After n8n + SellerApp MCP wired (Stage 2c) | `update_artifact` | `MCPs wired · stage 2/8` |
| 6 | After products + competitors captured (Stages 3–5) | `update_artifact` | `Products captured · stage 5/8` |
| 7 | After voice + goals + brand guidelines (Stages 6–7.5) | `update_artifact` | `Voice & goals · stage 7/8` |
| 8 | Final + brain.json emission (Stage 8) | `update_artifact` (cockpit) + `create_artifact` (brain) | `Complete · 100%` |

8 cockpit emissions + 1 brain emission = 9 artifact calls total across a ~22-min onboarding (was ~10 min in v0.1.7 — added ~12 min for MCP wiring in Stage 2).

---

## Don't

- Don't ask 8 questions in a row. Recap after every 1–2 stages.
- Don't write empty fields with `[FILL_IN]` markers. Either capture real content or leave the field absent — the schema makes both valid.
- Don't validate ASINs against Amazon during onboarding. n8n isn't connected yet. Just capture.
- Don't push for deep insight. The brain is a starting point, not a strategy doc.
- Don't update the artifact on every fact captured — emit at the 5 verification gates above. Per-fact emissions overwhelm the user.
- Don't forget the `florence-brain.json` emission at the end. Without it, the user can't restore state next session.
- Don't paste HTML or JSON into chat as a code block. Cowork uses MCP tools; chat output is for chat.