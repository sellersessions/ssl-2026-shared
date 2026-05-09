# Databrill Brand Profile

## Identity
- **Project:** Databrill (Amazon data infrastructure platform)
- **Domain:** databrill.com (landing: databrill-landing.netlify.app)
- **Deploy:** Netlify (static build)
- **Design system:** `Databrill-Core/design-system/`

## Theme
- **Mode:** Light (primary) / Dark variant exists (Stitch build)
- **Style:** Clean minimal with semantic tokens
- **Mood:** Professional, trustworthy, data-driven

## Colours (Light -- design-system)
| Role | Token | Hex |
|------|-------|-----|
| Primary | `brand-primary` | `#2563EB` |
| Primary light | `brand-primary-light` | `#3B82F6` |
| Primary dark | `brand-primary-dark` | `#1D4ED8` |
| Background | `surface-base` | `#FFFFFF` |
| Surface raised | `surface-raised` | `#FFFFFF` |
| Surface sunken | `surface-sunken` | `#F5F5F7` |
| Surface dark | `surface-dark` | `#1D1D1F` |
| Text primary | `text-primary` | `#1E1E2F` |
| Text secondary | `text-secondary` | `#6B6B80` |
| Border | `border` | `#E5E7EB` |
| Success | `semantic-success` | `#16A34A` |
| Error | `semantic-error` | `#DC2626` |
| Warning | `semantic-warning` | `#D97706` |

## Colours (Dark -- Stitch build)
| Role | Token | Hex |
|------|-------|-----|
| Background deep | `--bg-deep` | `#0A0C10` |
| Background surface | `--bg-surface` | `#11141a` |
| Accent orange | `--accent-orange` | `#ff7d3b` |
| Accent purple | `--accent-purple` | `#8b5cf6` |
| Glass border | `--glass-border` | `rgba(255, 255, 255, 0.12)` |
| Glass bg | `--glass-bg` | `rgba(15, 17, 23, 0.8)` |

## Typography

**Light system:**
| Role | Font |
|------|------|
| Headings | Plus Jakarta Sans |
| Body | Inter / Plus Jakarta Sans |

**Dark Stitch system:**
| Role | Font |
|------|------|
| Headings (display) | Space Grotesk |
| Body | Inter |
| Icons | Material Symbols Outlined |

## Key Effects
- **Light:** subtle shadows (`shadow-card`, `shadow-card-hover`), scroll-reveal (Framer Motion `fade-up`)
- **Dark Stitch:** glassmorphism (`backdrop-blur-2xl`), gradient mesh background, glow-orange CTA, grid pattern overlay
- **Animations:** shimmer loading, accordion (Radix), fade-up entrance

## Semantic Token Architecture
Components use semantic tokens ONLY (no raw hex). To rebrand: change `tailwind.config.js` values only. Components never change.

## Page Structure
Default to waitlist-saas pattern:
1. Hero (problem statement)
2. Problem (agitate the pain)
3. Solution (introduce Databrill)
4. How it works (chain diagram)
5. Features grid
6. Social proof
7. Waitlist form
8. Footer

## Deploy Rules
- Netlify Forms for waitlist (`data-netlify="true"`)
- `cn()` utility (clsx + tailwind-merge) for all className composition
- All interactive elements need: default, hover, focus, active, disabled states
- `@/` path alias maps to `src/`

## Animation Preferences
- **Style:** Clean, minimal. Motion serves clarity, not decoration.
- **Easing:** ease-out for entries. Simple transitions only.
- **Duration range:** 150-200ms for micro-interactions. 200-300ms for section reveals.
- **Button press:** scale(0.97) on :active with 100ms ease-out (lighter than SS)
- **Scroll reveal:** fade-up with Framer Motion (existing pattern in codebase)
- **Loading states:** shimmer animation for data loading (existing pattern)
- **Reduced motion:** Default to reduced motion — respect prefers-reduced-motion strictly.
- **GPU only:** Only animate transform and opacity.
- **Light mode rule:** No glow pulses, no neon effects. Subtle shadow transitions only.

## Performance Budget
- **LCP target:** < 2.0s (Netlify hosting is fast — keep it under 2s)
- **CLS target:** < 0.1 (all images need width/height, form fields need fixed height)
- **Bundle target:** < 150KB gzipped JS (React SPA, route-split if grows)
- **Image format:** WebP, lazy-load below-fold, max 100KB per image
- **Font loading:** display:swap, preload primary font weight
- **Cache:** Netlify auto-hashes filenames — immutable cache headers set

## Visual REFINE Techniques (10 applied, session 11-12)
- **Section banding (4 depths):** alternating bg tones (`#020408` → `#050a14` → `#0a101f` → `#0d1525`) to create visual rhythm between sections
- **Badge chips:** small labelled pills above section headings to categorise sections ("PROVEN RESULTS", "OUR SERVICES", "THE TEAM", etc.)
- **Scroll reveal:** fade-up 24px with IntersectionObserver + 80ms stagger per item. CSS: `.reveal { opacity: 0; transform: translateY(24px); transition: 0.6s ease-out }`. Respects `prefers-reduced-motion`.
- **CTA pulse glow:** `@keyframes pulse-glow` — gentle box-shadow breathing (3s infinite) on primary CTAs. One per viewport. Respects reduced motion.
- **Lazy-load images:** `loading="lazy"` on all below-fold images. Hero image stays eager.
- **Font preload:** `<link rel="preconnect">` for Google Fonts + gstatic. `-webkit-font-smoothing: antialiased` on body.
- **Focus states:** `a:focus-visible, button:focus-visible { outline: 2px solid #ff7d3b; outline-offset: 2px }` for keyboard accessibility.
- **ARIA decorative icons:** `aria-hidden="true"` on all Material Symbols Outlined spans (decorative, meaning conveyed by adjacent text).
- **Image CLS fix:** Explicit `width` and `height` attributes on all `<img>` tags matching actual image dimensions.
- **Count-up stats:** Animated number counters on case study headline percentages. IntersectionObserver trigger, 1.5s ease-out cubic.

## Section Banding Depths (Dark Stitch)
| Depth | Token | Hex | Usage |
|-------|-------|-----|-------|
| 1 (deepest) | `background-dark` | `#020408` | Hero, footer, seller central |
| 2 (surface) | `surface` | `#050a14` | Services, how it works, BI |
| 3 (accent) | `surface-accent` | `#0a101f` | SSL section, privacy |
| 4 (elevated) | `surface-elevated` | `#0d1525` | Why choose us, pricing |

## Performance Budget (Static HTML — updated)
- **LCP target:** < 2.0s (Netlify CDN, static HTML, no build step)
- **CLS target:** < 0.1 (all images have width/height, no dynamic content)
- **Bundle target:** N/A (no JS bundle — Tailwind CDN + ~30 lines vanilla JS)
- **Image format:** PNG/JPG self-hosted in `/images/`, lazy-load below-fold, max 100KB per image
- **Font loading:** display:swap via Google Fonts, preconnect to fonts.googleapis.com + fonts.gstatic.com
- **Cache:** Netlify CDN with 304 responses on cached assets
- **Known limitation:** Tailwind CDN runtime compilation — acceptable for static site, logs console warning

## Anti-Patterns
- Never use raw hex in component files (use semantic tokens)
- Never skip hover/focus/active states on interactive elements
- Never use glow effects in light mode (use subtle shadows instead)
- Never use more than one accent colour in light mode (single-colour system)
- Never hotlink images to external WordPress (use self-hosted `/images/` — ERR_BLOCKED_BY_ORB)
- Never use `transition: all` — list exact properties to prevent unintended animations
