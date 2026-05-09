```markdown
# Design System Specification: The Luminescent Void

## 1. Overview & Creative North Star
**Creative North Star: The Luminescent Void**
This design system is built on the concept of "Information as Light." In a world of cluttered data, we treat the interface as a high-end gallery space—a deep, dark void where only the most essential elements are illuminated. We move beyond "standard" dashboard aesthetics by utilizing a high-contrast editorial scale, intentional asymmetry, and atmospheric depth. 

The goal is to move away from the "boxed-in" feeling of traditional SaaS. We achieve this through **Tonal Layering** and **Luminous Glassmorphism**, ensuring the interface feels like a singular, breathing organism rather than a collection of rigid components.

---

## 2. Colors: Depth and Radiance
Our palette is rooted in the absence of light, using deep blacks to create a canvas for vibrant, energetic accents.

### Core Palette
*   **Background / Surface:** `#0e0e0e` (The Void). The foundational layer.
*   **Primary (Energy):** `#ff9064` (Vibrant Orange). Used for high-action focal points.
*   **Secondary (Atmosphere):** `#af88ff` (Deep Purple). Used for depth and secondary accents.
*   **The Signature Gradient:** A linear transition from `primary` to `secondary`. This is the "soul" of the system, used exclusively for the logo, hero CTAs, and critical status indicators.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** To achieve a high-end editorial feel, boundaries must be defined through background color shifts. 
*   Use `surface-container-low` (`#131313`) to define a section against the `surface` (`#0e0e0e`).
*   Use `surface-container-highest` (`#262626`) for nested elements like search bars or utility drawers.

### The Glass & Gradient Rule
Floating elements (Modals, Hovering Menus) should utilize Glassmorphism.
*   **Fill:** `surface` at 60% opacity.
*   **Effect:** `backdrop-filter: blur(20px)`.
*   **Border:** Use a "Ghost Border" (see Section 4).

---

## 3. Typography: Technical Elegance
We pair the geometric precision of **Space Grotesk** with the refined legibility of **Manrope**.

*   **The Display Scale (Space Grotesk):** Use for headlines and large data points. It conveys a "tech-forward" and authoritative tone. Use `display-lg` (3.5rem) with tight tracking (-0.02em) for hero statements.
*   **The Editorial Scale (Manrope):** Use for all body text and titles. Manrope’s neutrality balances the "loudness" of Space Grotesk, ensuring the interface remains professional and readable.
*   **Hierarchy Tip:** Never use Space Grotesk for body copy. It is a "voice" font, not a "reading" font.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for this system. We use light and opacity to simulate physical distance.

### The Layering Principle
Stack tiers to create hierarchy.
1.  **Level 0 (Base):** `surface` (`#0e0e0e`).
2.  **Level 1 (Sections):** `surface-container-low` (`#131313`).
3.  **Level 2 (Cards):** `surface-container` (`#1a1919`).
4.  **Level 3 (Interactive):** `surface-container-high` (`#201f1f`).

### Ghost Borders
When accessibility or high-density layouts require a border, use a **Ghost Border**:
*   **Token:** `outline-variant` (`#494847`).
*   **Opacity:** 15% – 20% max.
*   **Styling:** This should feel like a faint reflection on the edge of a glass pane, not a drawn line.

### Ambient Shadows
For floating glass components, use a "Tinted Shadow":
*   **Color:** `#000000` at 40% opacity.
*   **Blur:** 40px - 60px spread.
*   **Offset:** Vertical (Y) only, to simulate a top-down light source.

---

## 5. Components: Minimalist Primitives

### Buttons
*   **Primary:** Solid `primary-container` gradient. No border. Text color: `on-primary-fixed`.
*   **Secondary:** Ghost Border style. `outline-variant` at 20% opacity. On hover, increase background to `surface-bright`.
*   **Tertiary:** Text-only using `primary` color. 0.5rem horizontal padding for hit-state.

### Glass Cards
*   **Structure:** `md` (0.375rem) roundedness. Generous internal padding (2rem+).
*   **The Divider Rule:** Strictly forbid horizontal lines (`<hr>`). Separate content chunks using vertical whitespace from our spacing scale (e.g., 24px or 32px gaps).

### Input Fields
*   **Style:** `surface-container-highest` background.
*   **Focus State:** Do not use a solid outline. Use a 1px `primary` bottom border and a subtle `primary` outer glow (4px blur).

### Chips & Tags
*   **Style:** Low-profile. Use `surface-variant` with `label-md` typography. Avoid bright background colors for tags unless they represent a critical status (Error/Warning).

---

## 6. Do’s and Don’ts

### Do:
*   **Use Generous Spacing:** White space (or "Dark Space") is a first-class citizen. If a layout feels cramped, double the margins.
*   **Embrace Asymmetry:** In hero sections, offset text to the left and allow the "Signature Gradient" elements to bleed off the right edge.
*   **Tone-on-Tone:** Use `on-surface-variant` (grey) for secondary information to keep the visual noise low.

### Don’t:
*   **No Pure White Backgrounds:** This system lives in the dark. White should only ever be used for text or "Primary" highlights.
*   **No High-Contrast Borders:** Never use 100% opaque `outline`. It breaks the "Luminescent Void" illusion.
*   **No Standard Shadows:** Avoid small, dark, "muddy" shadows. If it doesn't look like ambient light, remove it.
*   **No Default Grids:** Don't just stick to a 12-column grid. Use the typography scale to drive the rhythm of the page.

---

## 7. Signature Element: The Data Glow
When displaying critical data visualizations, apply a `drop-shadow` to the SVG line or bar that matches its stroke color at 30% opacity. This makes the data appear as if it is "glowing" from within the deep background, reinforcing the Creative North Star.```