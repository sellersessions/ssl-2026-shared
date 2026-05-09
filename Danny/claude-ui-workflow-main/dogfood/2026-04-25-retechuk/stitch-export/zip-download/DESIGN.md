---
name: Re Tech UK Design System
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#524345'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#847375'
  outline-variant: '#d6c2c4'
  surface-tint: '#884d59'
  primary: '#481925'
  on-primary: '#ffffff'
  primary-container: '#632e3a'
  on-primary-container: '#de96a4'
  inverse-primary: '#feb2c0'
  secondary: '#8b4d48'
  on-secondary: '#ffffff'
  secondary-container: '#ffb0a8'
  on-secondary-container: '#7a403b'
  tertiary: '#332705'
  on-tertiary: '#ffffff'
  tertiary-container: '#4b3d19'
  on-tertiary-container: '#bca87a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#feb2c0'
  on-primary-fixed: '#370b18'
  on-primary-fixed-variant: '#6d3642'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#380c0a'
  on-secondary-fixed-variant: '#6e3632'
  tertiary-fixed: '#f7e0af'
  tertiary-fixed-dim: '#dac495'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#534520'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-hero:
    fontFamily: Noto Serif
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

The brand personality is rooted in thoughtful femininity and editorial elegance. It speaks to a modern woman who values comfort, quality, and a "considered" lifestyle. The emotional response should be one of warmth, calm, and tactile intimacy—evoking the feeling of browsing a high-end independent boutique or a boutique lifestyle magazine.

The design style is **Tactile Minimalism**. It balances generous whitespace and clean layouts with physical metaphors: paper-grain textures, soft-focus blurs, and organic, hand-drawn linework. This approach moves away from clinical digital surfaces toward a softer, more human-centric interface that feels curated rather than manufactured.

## Colors

The palette is anchored by a sophisticated **Warm Aubergine** for high-priority actions, providing a grounded contrast to the airy base. The background uses a **Paper-Grain Off-White** to provide depth and a tactile, non-digital feel.

Decorative accents are delivered through "Petal Blurs"—soft, low-opacity amorphous shapes in **Dusty Pink**, **Buttery Yellow**, and **Warm Purple**. These are not functional but structural, used to break the rigidity of the grid. Hand-drawn organic motifs should be rendered in a thin stroke of the Primary Aubergine or a slightly darker variant of the neutral tone.

## Typography

This design system utilizes a high-contrast typographic pairing to reinforce its editorial character. 

**Noto Serif** is the voice of the brand, used for all hero headers and editorial callouts. It should be typeset with tight tracking in display sizes to emphasize its elegant curves. 

**Manrope** provides a functional, modern counterpoint. It is used for all body copy, navigation, and UI labels to ensure legibility and a contemporary edge. Use "Label-Caps" for small metadata or section headers to introduce a rhythmic, structured feel to the organic layout.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop, centered within the viewport to maintain an editorial "page" feel. A 12-column grid is used, but content frequently breaks the grid through asymmetrical placement of images and decorative motifs.

Generous vertical spacing (Section Gaps) is essential to evoke a premium, unhurried atmosphere. Padding within containers should be ample, avoiding any sense of "crowding" the content. Use the hand-drawn organic circle motifs to highlight specific areas of interest or to bridge the gap between two disparate sections.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Soft Blurs** rather than traditional shadows. 

1.  **Base Layer:** The paper-textured off-white background.
2.  **Decorative Layer:** Petal blurs (soft gradients with 40-60px blur radius) sit just above the background, often partially obscured by content.
3.  **Content Layer:** Images and text sit flat on the surface.
4.  **Floating Layer:** Modals and dropdowns use a very soft, high-diffusion shadow (0px 20px 40px rgba(99, 46, 58, 0.05)) or a thin, 0.5px border in a muted dusty pink to define boundaries without adding visual weight.

## Shapes

The shape language is "Softly Geometric." While the overall layout is structured, individual elements use a **Soft (0.25rem - 0.75rem)** corner radius. This prevents the UI from feeling too sharp or "tech-heavy," maintaining the feminine and approachable aesthetic.

A key decorative element is the **Hand-Drawn Circle**. These should be slightly imperfect, non-uniform strokes that look as if they were sketched with a fine-liner pen. They can be used to encircle CTA buttons, highlight product features, or serve as a frame for circular imagery.

## Components

### Buttons
Primary CTAs are filled with **Warm Aubergine** or **Deep Dusty Pink**, using white or cream text. They should have a soft rounded corner. Secondary buttons use a "Ghost" style with a thin aubergine border or a simple underlined Noto Serif text link for a more editorial look.

### Input Fields
Inputs are minimal, featuring only a bottom border or a very light-tinted background. Labels use the "Manrope Label-Caps" style. Focus states should be indicated by the hand-drawn circle motif appearing subtly or a change in border weight.

### Cards
Product cards are borderless, relying on the imagery to define the space. Information is center-aligned beneath the image. On hover, a soft petal blur may appear behind the card to create a sense of lifting.

### Decorative Motifs
Incorporate "The Sketch"—organic, hand-drawn loops or circles used as background elements or to "underline" specific words in a headline. These should feel spontaneous and artistic.

### Petal Blurs
Place these behind major UI sections (like a newsletter signup or a hero block). They should be non-interactive and use "Multiply" or "Soft Light" blend modes against the paper texture.