# Databrill Core Brand Profile

## Identity
- **Project:** Databrill Core (Amazon data infrastructure platform — "Own Your Amazon Data")
- **Domain:** databrill.com / core.databrill.com
- **Deploy:** Netlify (static landing), React SPA (platform)
- **Design system:** `Databrill-Core/assets/design-tokens.css`
- **Parent brand:** Databrill (this is the "Core" sub-brand for the platform product)

## Theme
- **Mode:** Dark (primary)
- **Style:** Glassmorphic, gradient mesh, section banding, glow CTAs
- **Mood:** Premium, technical, trustworthy

## Brand Narrative — Four Weak Links
The core story: Amazon sellers' data chains have four weak links. If any link breaks, data quality suffers.

| Link | Problem | Databrill fixes |
|------|---------|----------------|
| **Access** | Can't easily access Advertising API + Seller Performance data | Direct API connection |
| **History** | Can't see historical trends over time | PostgreSQL storage with retention |
| **Combine** | Can't combine data from different sources into one view | Unified dashboard |
| **Evolve** | Can't use data for informed, evolving decisions | Analytics + BI layer |

**Logo concept:** Four interlocking rings representing these four connections. A broken ring = broken data chain. Variations: "Databrill Core" (full), "DB Core" (condensed), "DBC" (monogram), rings-only (favicon).

## Colours (Dark — design-tokens.css)
| Role | Token | Hex |
|------|-------|-----|
| Background deep | `--db-bg` | `#0c0a14` |
| Background surface | `--db-bg-2` | `#100e1a` |
| Card surface | `--db-card` | `rgba(255, 255, 255, 0.025)` |
| Card hover | `--db-card-hover` | `rgba(255, 255, 255, 0.05)` |
| Border | `--db-border` | `rgba(255, 255, 255, 0.07)` |
| Text primary | `--db-text` | `#f5f5fa` |
| Text muted | `--db-text-muted` | `rgba(245, 245, 250, 0.55)` |
| Accent orange | `--db-accent` | `#e07a3a` |
| Accent orange light | `--db-accent-light` | `#f09050` |
| Secondary purple | `--db-secondary` | `#7c6bbd` |
| Success | `--db-success` | `#22c55e` |
| Warning | `--db-warning` | `#f59e0b` |
| Error | `--db-error` | `#ef4444` |

## Colours (Dark — Stitch build variant)
| Role | Token | Hex |
|------|-------|-----|
| Background deep | `--bg-deep` | `#0A0C10` |
| Background surface | `--bg-surface` | `#11141a` |
| Accent orange | `--accent-orange` | `#ff7d3b` |
| Accent purple | `--accent-purple` | `#8b5cf6` |
| Glass border | `--glass-border` | `rgba(255, 255, 255, 0.12)` |
| Glass bg | `--glass-bg` | `rgba(15, 17, 23, 0.8)` |

## Section Banding Depths
| Depth | Hex | Usage |
|-------|-----|-------|
| 1 (deepest) | `#020408` | Hero, footer |
| 2 (surface) | `#050a14` | Services, how it works |
| 3 (accent) | `#0a101f` | Feature sections |
| 4 (elevated) | `#0d1525` | Pricing, testimonials |

## Typography
| Role | Font | Weight range |
|------|------|-------------|
| Logo / Display | Space Grotesk | 400-700 |
| Headings | Inter | 500-700 |
| Body | DM Sans | 400-500 |
| Icons | Material Symbols Outlined | 400 |

Google Fonts URL: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap`

## Key Effects
- Glassmorphism: `backdrop-blur-2xl`, glass borders, glass bg
- Gradient mesh background
- Glow-orange CTA: `@keyframes pulse-glow` (3s infinite, 1 per viewport)
- Grid pattern overlay
- Section banding (4 alternating depths)
- Scroll reveal: fade-up 24px with IntersectionObserver + 80ms stagger
- Shimmer loading for data states
- Count-up stats animation (1.5s ease-out cubic)

## Page Structure
1. Hero (problem statement — "Your data chain is broken")
2. Problem (the four weak links)
3. Solution (introduce Databrill Core)
4. How it works (chain diagram — 4 rings)
5. Features grid
6. Case studies / social proof
7. Pricing (Starter $149 / Professional $449 / Agency custom)
8. Waitlist / CTA
9. Footer

## Deploy Rules
- Semantic tokens ONLY — no raw hex in components
- `cn()` utility (clsx + tailwind-merge) for className composition
- All interactive elements: default, hover, focus, active, disabled states
- `@/` path alias → `src/`
- Netlify Forms for waitlist (`data-netlify="true"`)

## Image Constraints
- Dark background preference for all generated images
- No text in generated images (append "No text" to all prompts)
- Palette enforcement: orange `#e07a3a` + purple `#7c6bbd` on dark `#0c0a14`
- No fake headshots — use real team photos
- WebP format, lazy-load below-fold, max 100KB per image

## Animation Preferences
- **Style:** Clean, minimal. Motion serves clarity, not decoration.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (--db-ease)
- **Duration range:** 150-200ms micro-interactions / 200-300ms section reveals
- **Button press:** scale(0.97) on :active with 100ms ease-out
- **Scroll reveal:** fade-up with IntersectionObserver (not Framer Motion for static)
- **Reduced motion:** Respect `prefers-reduced-motion` strictly. Disable glow pulses, count-up, shimmer.
- **GPU only:** Only animate transform and opacity.

## Performance Budget
- **LCP target:** < 2.0s
- **CLS target:** < 0.1 (all images need width/height)
- **Bundle target:** < 150KB gzipped JS (route-split if grows)
- **Image format:** WebP, lazy-load below-fold, max 100KB per image
- **Font loading:** display:swap, preload primary weight
- **Cache:** Netlify auto-hashes filenames — immutable cache headers

## Anti-Patterns
- Never use raw hex in component files (use semantic tokens)
- Never skip hover/focus/active states on interactive elements
- Never use glow effects in light mode
- Never use more than one accent colour per section
- Never hotlink images to external WordPress
- Never use `transition: all` — list exact properties
- Never use bright/pastel colours — dark system only
- Never put text inside generated images
