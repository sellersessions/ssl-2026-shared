---
name: Push-Pull Protocol
colors:
  surface: '#11131c'
  surface-dim: '#11131c'
  surface-bright: '#373943'
  surface-container-lowest: '#0c0e17'
  surface-container-low: '#191b24'
  surface-container: '#1d1f29'
  surface-container-high: '#282933'
  surface-container-highest: '#32343e'
  on-surface: '#e1e1ef'
  on-surface-variant: '#c3c5d9'
  inverse-surface: '#e1e1ef'
  inverse-on-surface: '#2e303a'
  outline: '#8d90a2'
  outline-variant: '#434656'
  surface-tint: '#b7c4ff'
  primary: '#b7c4ff'
  on-primary: '#002681'
  primary-container: '#1f5cff'
  on-primary-container: '#eeeeff'
  inverse-primary: '#004deb'
  secondary: '#c7c7c1'
  on-secondary: '#30312d'
  secondary-container: '#484945'
  on-secondary-container: '#b9b9b3'
  tertiary: '#ffb59d'
  on-tertiary: '#5d1900'
  tertiary-container: '#c43e00'
  on-tertiary-container: '#ffece6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b4'
  secondary-fixed: '#e3e3dd'
  secondary-fixed-dim: '#c7c7c1'
  on-secondary-fixed: '#1b1c19'
  on-secondary-fixed-variant: '#464743'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832700'
  background: '#11131c'
  on-background: '#e1e1ef'
  surface-variant: '#32343e'
typography:
  display-stat:
    fontFamily: Manrope
    fontSize: 80px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  h1:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
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
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  grid-columns: '12'
  gutter: 24px
  margin: 48px
  section-padding: 120px
---

## Brand & Style

The brand identity centers on the "Push-Pull" mechanics of high-scale Amazon commerce—the aggressive push of marketing and the magnetic pull of brand demand. This design system targets sophisticated B2B stakeholders, evoking an atmosphere of institutional power, precision, and high-performance data.

The design style is **High-Contrast Minimalism**. It rejects decorative flourishes, glassmorphism, and playful illustrations in favor of architectural structure and stark visual hierarchies. The aesthetic is "Tactical Premium"—utilitarian enough for complex logistics data, yet refined enough for executive-level reporting.

## Colors

The palette is anchored by **Carbon Charcoal**, a deep, non-neutral black that provides a rigorous foundation. The secondary surface variant, **Surface Noir**, is used for structural division and card backgrounds.

**Cobalt Blue** serves as the singular chromatic driver, used exclusively for primary actions, data highlights, and active states. Typography utilizes **Warm Off-White** to reduce ocular strain against the dark background, with a strict 60% alpha applied to secondary information to maintain clear information density.

## Typography

Manrope is selected for its geometric purity and modern technical feel. The system utilizes extreme weight contrast to guide the eye. 

**Display Stats** are the hero of the interface, rendered in ExtraBold weight with tight tracking to emphasize growth metrics. **Headlines** follow this bold treatment, creating a rhythmic "push" of information. **Body copy** remains spacious and legible, utilizing the 60% alpha off-white for longer reading passages. Labels are always set in uppercase with increased letter-spacing to act as clear navigational anchors.

## Layout & Spacing

This design system employs a **Fixed Grid** model within a maximum container width of 1440px, transitioning to a fluid model for ultra-wide displays. A 12-column structure is used for all dashboard and marketing layouts.

The rhythm is defined by generous whitespace. Sections are separated by significant vertical padding to allow the high-contrast elements to breathe. Data density is managed through a strict 8px base unit, ensuring all components align to a predictable vertical and horizontal rhythm.

## Elevation & Depth

Depth is achieved through **Tonal Layers** rather than shadows. 
- **Level 0:** Carbon Charcoal (#0e0e10) for the main canvas.
- **Level 1:** Surface Noir (#16161b) for cards, navigation bars, and containers.
- **Stroke:** Subtle 1px borders using the Text Muted color at 10% opacity are used to define boundaries.

No shadows are permitted. Elevation is communicated solely through the contrast between the background and surface variant. Product photography should be treated with high-contrast, desaturated grading to integrate seamlessly with the UI depth model.

## Shapes

The shape language is industrial and precise. A **Minimal (4px)** radius is applied to buttons, input fields, and cards. This slight softening prevents the UI from feeling hostile while maintaining the architectural "sharpness" required for a B2B agency. Interactive elements like checkboxes and radio buttons also adhere to this 4px standard; circular "pill" shapes are strictly prohibited for any UI component.

## Components

### Buttons
Primary buttons are solid Cobalt Blue with Warm Off-White text. They are rectangular with a 4px radius. Secondary buttons use a 1px ghost border of the muted text color. Hover states involve a slight brightness increase of the cobalt fill.

### Cards
Cards are built on the Surface Noir background. They do not have shadows. They utilize 4px rounded corners and a 1px border (#ffffff at 5% opacity). Padding within cards must be generous (min 32px).

### Input Fields
Inputs are background-colored with a 1px muted border. Upon focus, the border transitions to Cobalt Blue. Placeholder text uses the 60% alpha Warm Off-White.

### Stats & Displays
Data visualization components must prioritize the Display-Stat typography. Trend indicators (up/down) should use Cobalt Blue for positive movement and a muted slate for negative, rather than standard green/red, to maintain the sophisticated palette.

### Imagery
All logos must be converted to monochrome (white/off-white). Product shots should be high-contrast, focusing on form and texture, and set against the Carbon Charcoal background to blend into the layout.