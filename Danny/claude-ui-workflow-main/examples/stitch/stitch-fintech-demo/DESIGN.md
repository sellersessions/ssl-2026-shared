# Design System Specification: The Architecture of Trust

## 1. Overview & Creative North Star: "Precision Ethereal"
This design system moves beyond the generic "SaaS template" to establish a visual language of high-stakes stability and digital craftsmanship. Our Creative North Star is **Precision Ethereal**. 

In fintech, "Stable" often mistakenly translates to "Heavy." We challenge this by using massive whitespace, intentional asymmetry, and tonal layering. We replace rigid structural lines with sophisticated background shifts, creating a UI that feels like a series of meticulously architectural planes rather than a flat webpage. The goal is an editorial-grade experience where the data breathes and the brand's Teal (`#008080`) serves as a surgical strike of intent against a canvas of light and air.

---

## 2. Colors: Tonal Architecture
We reject the use of 1px solid borders for sectioning. Boundaries in this system are defined by the "No-Line" Rule: separation is achieved through background color shifts or subtle tonal transitions.

### The Palette
*   **Primary (Teal Focus):** `primary` (#006565) and `primary_container` (#008080). Use these for high-intent actions.
*   **The Neutrals:** Our "white" is never just white. Use `surface` (#f8f9fb) as the base, and `surface_container_lowest` (#ffffff) for elevated content.
*   **The No-Red Protocol:** For errors or warnings, we pivot to `tertiary` (#8b4823) or high-contrast `on_surface_variant` (#3e4949). We communicate "caution" through iconography and weight, never through red.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
*   **Base Level:** `surface` (#f8f9fb)
*   **Sectioning:** Shift to `surface_container_low` (#f3f4f6) for large secondary sections.
*   **The Highlight Nest:** Place a `surface_container_lowest` (#ffffff) card inside a `surface_container_low` section to create natural, soft lift.

### The "Glass & Gradient" Rule
To avoid a "flat" feel, main CTAs and Hero sections should utilize a subtle linear gradient: `primary_container` (#008080) to `primary` (#006565). For floating navigation or modal overlays, use **Glassmorphism**: apply `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We pair the geometric confidence of **Outfit** (mapped to Plus Jakarta Sans specs) with the utilitarian clarity of **Inter**.

*   **Display & Headlines (Outfit):** Use `display-lg` (3.5rem) and `headline-md` (1.75rem) with tighter letter-spacing (-0.02em). These are your "anchors." Use them to break the grid—try left-aligning a headline while the body text sits in a narrower, offset column.
*   **Body & Titles (Inter):** `body-lg` (1rem) for general reading. `title-md` (1.125rem) for UI labels that require authority.
*   **The Scale of Importance:** Use `label-sm` (0.6875rem) in all-caps with 0.05em tracking for metadata. This creates a "premium" feel often seen in high-end financial reports.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop." We use them to create "presence."

*   **The Layering Principle:** Depth is achieved by stacking. A `surface_container_highest` (#e1e2e4) element should only exist on top of a `surface_container` (#edeef0) element.
*   **Ambient Shadows:** If a card must float, use a shadow with a blur of `32px`, an Y-offset of `8px`, and an opacity of `4%`. The color must be a tinted version of `on_surface` (#191c1e), not a neutral grey.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` (#bdc9c8) at **15% opacity**. This provides a "suggestion" of a boundary that disappears into the background upon quick glance.

---

## 5. Components: The Primitive Set

### Buttons & CTAs
*   **Primary:** Solid `primary_container` (#008080) with `on_primary` (#ffffff) text. Radius: `md` (0.375rem).
*   **Secondary:** `surface_container_high` (#e7e8ea) background with `primary` (#006565) text. No border.
*   **Tertiary:** Transparent background, `primary` text, underlined only on hover.

### Input Fields
*   **Style:** `surface_container_lowest` (#ffffff) background with a "Ghost Border" (15% `outline_variant`). 
*   **State Change:** On focus, the border opacity increases to 100% using `primary` (#006565). No outer glow.

### Cards & Lists
*   **The Anti-Divider Rule:** Never use horizontal lines to separate list items. Use `spacing-4` (1.4rem) of vertical whitespace or alternating subtle background tints (`surface` vs `surface_container_low`).
*   **Fintech Special - Data Clusters:** Group related financial data points in a `surface_container_low` (#f3f4f6) wrapper with an `xl` (0.75rem) corner radius.

### Tooltips & Overlays
*   Use `inverse_surface` (#2e3132) with `inverse_on_surface` (#f0f1f3) text for high-contrast tooltips. This creates a "moment of focus" in an otherwise light UI.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place your headers in the first third of the layout and your content in the final two-thirds.
*   **Use Massive Margins:** Use `spacing-24` (8.5rem) for top/bottom padding on major sections to signal "premium quality."
*   **Tone-on-Tone:** Use `on_surface_variant` (#3e4949) for secondary text to maintain a soft, professional contrast ratio.

### Don’t:
*   **Don't use Red:** Use `tertiary` (#8b4823) and appropriate "warning" iconography for errors.
*   **Don't use 100% Black:** Always use `on_surface` (#191c1e) for text to keep the interface feeling "ink-like" rather than digital.
*   **Don't use Center-Alignment:** For fintech, left-alignment suggests a ledger's stability. Center-alignment often feels too "marketing-heavy."