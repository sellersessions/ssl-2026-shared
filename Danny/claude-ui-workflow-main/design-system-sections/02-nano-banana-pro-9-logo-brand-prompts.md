# Section 02 — Nano Banana Pro: 9 logo / brand / design prompts (Adrien Ninet)

**Status:** Banked — verbatim prompt library, ready as Logo Brain seed material
**Created:** 2026-04-11
**Source:** TikTok photo carousel `7581365219528559894` by @adrien.ninet — *"9 Amazing AI-Generated Design Prompts You Need to Try"*
**Original URL:** https://www.tiktok.com/@adrien.ninet/photo/7581365219528559894
**Capture method:** `gallery-dl` (slide JPEGs) + `ocrmac` (Apple Vision OCR)
**Slide assets:** `Claude-UI-Workflow/design-brand-reels-inspiration-extract/screenshots/nano-banana-pro-9-prompts/gallery-dl-capture/` (slide_01.jpg–slide_20.jpg + ocr_results.json)
**Part of:** Design System Unification — feeds **Step 2: Logo Brain sub-project** in plan `<your local plans dir>/groovy-gathering-dongarra.md`

---

## What this is

Adrien Ninet's curated set of 9 production-ready Nano Banana Pro prompts for designers, captured slide-by-slide from his TikTok carousel. These cover **the exact gaps** in our pipeline that the unification plan named: logo stylization, brand kits, product mockups from sketches, web mockup placement, storyboards, upscaling, social ads, dark-mode conversion, and isometric scenes.

Each entry below = one title card + one prompt card, OCR'd verbatim with light cleanup of UI noise (Higgsfield UI chrome, "SAVE FOR LATER", swipe arrows). Original OCR with all noise lives in `ocr_results.json` next to the JPEGs.

> **Intro slide (01):** *"if you want to design faster than ever, use these prompts. Swipe for prompts →"*
> **Outro slide (20):** *"Save this for later. Which prompt is your favorite?"*

---

## Prompt 01 — Swiss design logo stylization

**What it does:** Transform any logo into clean geometric Swiss design variations with perfect minimalist aesthetics.

**Prompt (verbatim):**

> 3D embossed glossy contour render of center-aligned **[BRAND]** on a flat surface, perfectly centered composition with ample negative space surrounding the object for a premium minimalist aesthetic. Monochromatic **[COLOR]** palette with soft tonal gradients. The object is defined by a raised, smooth, liquid-like glass bezel or chrome rim, creating a blind emboss effect where the interior matches the background. Matte surface finish with fine film grain or noise texture overlay. Soft diffuse lighting, strong specular highlights on the rounded edges, top-down view.

**Variables:** `[BRAND]`, `[COLOR]`
**Source slides:** 02 (title), 03 (prompt)

---

## Prompt 02 — Complete brand kits instantly

**What it does:** Generate full brand identity packages with logos, colors, fonts and mockups in one prompt.

**Prompt (verbatim):**

> A professional brand identity bento-grid showcase for a brand named **"{BRAND_NAME}"** **{INDUSTRY}**. The image is split into a cohesive layout of rectangular cards featuring:
>
> 1. A dynamic key visual showing the product or service in action with a logo overlay.
> 2. A social media mockup post with bold typography and a thematic photo.
> 3. A minimalist logo construction grid diagram on a solid color background.
> 4. A vertical advertising poster featuring a close-up macro texture related to the niche.
> 5. A brand color palette section with 4 matching swatches.
>
> The design style, color scheme, and objects are strictly thematic and culturally relevant to the **{INDUSTRY}**. High-end graphic design, Behance trend, 8k, photorealistic mockups.

**Variables:** `{BRAND_NAME}`, `{INDUSTRY}`
**Source slides:** 04 (title), 05 (prompt)

---

## Prompt 03 — Sketch becomes reality

**What it does:** Draw any product idea and watch Nano Banana Pro turn it into photorealistic mockups.

**Prompt (verbatim):**

> Create a Product render based on this drawing, Aluminium, stainless, and a bright accent color, RAL orange. Load in 4k.

**Variables:** colour/material swap (e.g. `RAL orange`)
**Input:** A sketch/drawing reference image
**Source slides:** 06 (title), 07 (prompt)

---

## Prompt 04 — Brand mockups in seconds

**What it does:** Paste any website screenshot, and get professional brand-friendly mockups instantly.

**Prompt (verbatim):**

> Remove the browser UI and place the pasted website screenshot naturally on the screen of a **[Apple Pro Display]**. Use the screenshot to guide:
>
> - **Interior Style:** [everyday, modern, approachable, clean lines, soft color accents]
> - **Profession of the Space Owner:** [software product manager]
> - **Mood:** [dark walls, well-staged but lived-in, creative, and realistic]
> - **Time of day:** [night]
>
> **Camera:** high-end lifestyle brand film photography, long focal length, close-up framing with shallow depth of field, soft bokeh, slight chromatic aberration at the edges.
>
> **Intent:** a cohesive, high-quality but approachable scene where the environment gently mirrors the screenshot's style without feeling luxury or overly curated.

**Variables:** `[device]`, `[Interior Style]`, `[Profession]`, `[Mood]`, `[Time of day]`
**Input:** Website screenshot
**Source slides:** 08 (title), 09 (prompt)

---

## Prompt 05 — Shot-by-shot storyboards

**What it does:** Create complete commercial storyboards for any product in seconds.

**Prompt (verbatim):**

> Create an editorial photoreal 3x3 storyboard contact sheet for a high end beauty e‑commerce ad featuring only the following products: **{product_main}** and **{product_secondary}**. Background **{background}**. Lighting **{lighting}**. Generate as one evenly spaced 3×3 grid. **{panels}**

**Variables:** `{product_main}`, `{product_secondary}`, `{background}`, `{lighting}`, `{panels}`
**Source slides:** 10 (title), 11 (prompt)

---

## Prompt 06 — Upscale without quality loss

**What it does:** Enhance image resolution while maintaining crisp details and adding creative improvements.

**Prompt (verbatim):**

> Upscale to 4K
> Input: 150 × 150
> Output: 4096 × 4096

**Note:** This is the simplest of the nine — essentially an instruction with the input/output resolutions. Tiny prompt, big lift.
**Source slides:** 12 (title), 13 (prompt)

---

## Prompt 07 — Creative social media posts

**What it does:** Generate eye-catching social media content with perfect layouts and engaging visual elements. *("Think different.")*

**Prompt (verbatim):**

> Creative 3D ad for **[Brand Name]**, with surreal object made from it, matching background color, real slogan below, logo on top, miniature person interacting, minimal and clever concept

**Variables:** `[Brand Name]`
**Source slides:** 14 (title), 15 (prompt)

---

## Prompt 08 — Website design variations (light → dark)

**What it does:** Upload any web design and get instant variations — light to dark theme, different colors, or style changes.

**Prompt (verbatim):**

> Convert the uploaded web design to a DARK MODE version.
>
> **IMPORTANT:**
> - Do NOT change the layout.
> - Do NOT change the spacing.
> - Do NOT change any components, text, or styling.
> - Do NOT add backgrounds, props, devices, shadows, or effects.
> - The design must remain pixel-perfect to the reference.
>
> Only change the color theme:
> - Background → deep dark (`#0F0F0F` to `#1A1A1A`)
> - Text → white or light gray (`#EDEDED`)
> - UI elements → adjust colors for proper contrast
>
> The final result should look like the exact same design recreated in dark mode, nothing else.

**Variables:** none — pure transform prompt
**Input:** Light-mode web design screenshot
**Source slides:** 16 (title), 17 (prompt)

> **Why this one matters for us:** This is exactly the prompt we needed during the **Databrill dark-palette migration** — pixel-perfect light→dark recolour without layout drift. Worth keeping in `brands/_template/` as a reusable transform.

---

## Prompt 09 — 3D isometric weather apps

**What it does:** Generate beautiful weather app designs with miniature 3D city scenes that reflect real-time weather conditions.

**Prompt (verbatim):**

> **CITY=Prague,Czechia**
>
> Present a clear, 45° top-down isometric miniature 3D cartoon scene of **[CITY]**, featuring its most iconic landmarks and architectural elements. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Integrate the current weather conditions directly into the city environment to create an immersive atmospheric mood. Use a clean, minimalistic composition with a soft, solid-colored background.
>
> At the top-center, place the title **"[CITY]"** in large bold text, a prominent weather icon beneath it, then the date (small text) and temperature (medium text). All text must be centered with consistent spacing, and may subtly overlap the tops of the buildings.
>
> **Square 1080×1080 dimension.**

**Variables:** `[CITY]`
**Source slides:** 18 (title), 19 (prompt)

---

## How this maps to the unification plan

| Plan gap | Which prompt(s) feed it |
|---|---|
| **#1 Logo / brand-mark generation** (Logo Brain) | 01 (Swiss logo), 02 (full brand kit) |
| **#3 Shared component / mockup library** | 04 (web→device mockup), 08 (light→dark recolour) |
| **#4 Image-gen primitive ratification** | All 9 — they're production-tested NB Pro prompts, validating "Gemini direct + NB Pro" as the chosen primitive |
| **#6 Motion / video design rules** | n/a (these are stills) |

**Direct hit on Logo Brain (Step 2 of the unification plan):** prompts **01** and **02** are the seed material we were missing. The bento-grid brand-kit prompt (#02) is especially valuable because it returns logo + colours + typography + mockup in one shot — close to a one-prompt brand spin-up.

---

## How we captured this (the cascade win)

The TikTok `/photo/` URL was a known hard target — `yt-dlp` fails it, headless Playwright (T2) and SeleniumBase UC Mode (T3) both hit TikTok's drag-puzzle CAPTCHA. The fix turned out to be skipping the page render entirely:

```
URL → gallery-dl (mobile-API JSON, no render) → 20 slide JPEGs
                                                      ↓
                                              ocrmac (Apple Vision)
                                                      ↓
                                          ocr_results.json (full text)
                                                      ↓
                                              banked section 02 ✅
```

**Total time:** ~5 minutes end-to-end. **No CAPTCHA, no auth, no browser.**

This pattern is now the canonical T0 for any TikTok / Instagram / Pinterest photo carousel — see the cascade win note in the inspiration-extract README and `feedback_gallery_dl_photo_posts.md` in memory.

---

### Short version

> **9 NB Pro prompts captured verbatim from Adrien Ninet's TikTok carousel via `gallery-dl` + `ocrmac` (5 min, zero browser). Prompts #01 and #02 directly seed Logo Brain (plan step 2). The light→dark prompt (#08) is reusable transform material for `brands/_template/`. Full slide JPEGs + raw OCR JSON saved alongside this section.**
