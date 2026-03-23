---
title: ZealerProfile Design System
version: 3.0
date_created: 2026-03-21
last_updated: 2026-03-21
owner: ZealerProfile
purpose: Pure design reference — tokens, component styling, motion, accessibility, and technology stack
---

# ZealerProfile Design System

---

## 1. Brand & Aesthetic Direction

**Bold & Energetic** — neon lime primary, electric azure secondary, purple accent. The result feels sporty yet polished: an athletic achievement platform that celebrates personal performance with confidence.

| Attribute | Value |
|-----------|-------|
| Primary brand color | Neon Lime `#5FE806` |
| Secondary brand color | Electric Azure `#0059FA` |
| Accent color | Purple `#7C3AED` |
| Display typeface | Outfit (geometric, strong at 800 weight) |
| Body typeface | Inter (superior x-height, tabular-nums) |
| Mono typeface | JetBrains Mono (designed for data readability) |
| Icon system | Phosphor Icons (6 weights including duotone) |
| Animation philosophy | Subtle and purposeful — page transitions, card hovers, count-ups, list reveals |
| Illustration style | Athletic SVGs with lime `#5FE806` strokes, slate-700 `#334155` outlines, `currentColor` for dark mode |

---

## 2. Technology Stack

All versions verified against npm as of March 2026.

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.x | Framework — pin exact version |
| `tailwindcss` | 4.x | CSS-first utility CSS via `@theme` directive |
| `@tailwindcss/postcss` | 4.x | PostCSS plugin for Tailwind v4 |
| `motion` | 12.38.0 | Animation — import from `motion/react` |
| `@phosphor-icons/react` | 2.1.10 | Iconography — 6 weights, tree-shakeable |
| `next-themes` | 0.4.6 | SSR-safe dark mode, no FOUC |
| `shadcn/ui` | latest (CLI) | Component primitives |
| `class-variance-authority` | 0.7.1 | Component variant management (cva) |
| `clsx` | 2.x | Class name concatenation |
| `tailwind-merge` | 3.5.0 | Tailwind class conflict resolution |
| `react-hook-form` | 7.71.2 | Form state management |
| `zod` | 4.3.6 | Schema validation |
| `@hookform/resolvers` | latest | Zod adapter for react-hook-form |
| `react-day-picker` | 9.14.0 | Calendar date picker |
| `date-fns` | 4.x | Date formatting utilities |
| `@maskito/core` + `@maskito/react` | 5.1.2 | Input masking (time inputs) |
| `canvas-confetti` | 1.9.4 | Celebration confetti effects |
| `svix` | latest | Webhook signature verification |
| `@clerk/nextjs` | latest | Authentication provider |
| `drizzle-orm` + `drizzle-kit` | latest | Database ORM & schema migrations |
| `@neondatabase/serverless` | latest | Serverless Postgres driver |
| `@tanstack/react-query` | 5.x | Client-side data fetching and caching |
| `next-s3-upload` | latest | File upload DX — presigned URL uploads to Cloudflare R2 (S3-compatible) |
| `recharts` | 2.x | Data visualization (shadcn charts) |
| Google Fonts: Outfit, Inter, JetBrains Mono | via `next/font/google` | `display: swap` — no install needed |

### Font Loading

Load fonts via `next/font/google` in a shared `fonts.ts` module:

| Font | Weights | Export Name |
|------|---------|-------------|
| Outfit | 600, 700, 800 | `fontDisplay` |
| Inter | 400, 500, 600 | `fontBody` |
| JetBrains Mono | 500, 600 | `fontMono` |

Apply CSS variable classes to `<html>` in the root layout.

---

## 3. Design Principles

### Accessibility (WCAG AA)

- All text meets **4.5:1** contrast for normal text, **3:1** for large text (≥18pt or ≥14pt bold)
- **Lime-500 on white fails (1.61:1)** — never use as text color on light backgrounds
- **Lime-600 (2.11:1) and lime-700 (3.60:1) both fail** for normal text on white
- Use lime-500 as a **background** with `text-slate-900` (11.08:1 ✓)
- For lime-tinted text on white, use **lime-800 minimum** (6.77:1 ✓)
- Full contrast reference in [Section 4.5](#45-wcag-contrast-reference)

### Mobile-First

- Design for 375px first, test at **375px, 390px, 414px**
- All touch targets **≥ 44×44px**
- No horizontal scroll at any breakpoint

### Reduced Motion

- Animations must respect `prefers-reduced-motion`
- When active: disable all `y`/`x`/`scale` transforms, keep opacity transitions at 200ms
- CSS fallback: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

### Security

- All user text sanitized against XSS
- No `dangerouslySetInnerHTML` anywhere in the codebase

### Code Patterns

| Pattern | Rule |
|---------|------|
| Component variants | `class-variance-authority` (cva) — never inline conditional classes |
| Animation variants | Shared in a central `animations.ts` module |
| Icon mappings | Centralized in an `icons.ts` module |
| Form validation | All Zod schemas in a central `validations.ts` — never inline in components |
| Form state | Always `react-hook-form` with `zodResolver` — never `useState` for field state |
| Class merging | `cn()` utility using `clsx` + `tailwind-merge` |

### Dark Mode

- Supported from Day 1 with a toggle
- `next-themes` provider with `attribute="class"` + `defaultTheme="system"`
- No FOUC on page load — script injection before render
- All colors defined as CSS custom properties with `:root` (light) and `.dark` overrides

---

## 4. Color System

All custom color tokens defined via Tailwind v4 `@theme` directive using **OKLCH** for perceptual uniformity. Hex equivalents provided as developer reference.

### 4.1 Brand Colors

#### Primary: Vivid Lime

| Token | OKLCH | Hex | Usage |
|-------|-------|-----|-------|
| `lime-50` | `oklch(0.97 0.08 131)` | `#F0FEE5` | Light tint backgrounds, selected state |
| `lime-100` | `oklch(0.95 0.12 131)` | `#DFFCC7` | Hover backgrounds |
| `lime-200` | `oklch(0.92 0.18 131)` | `#BFFA8F` | Light interactive accents |
| `lime-300` | `oklch(0.89 0.24 131)` | `#9FF657` | Secondary UI elements |
| `lime-400` | `oklch(0.87 0.28 131)` | `#7FEF1F` | Bright accents, progress bars; safe as text on dark bg |
| `lime-500` | `oklch(0.84 0.31 131)` | `#5FE806` | **Primary brand — CTA backgrounds. Text must be `slate-900`.** |
| `lime-600` | `oklch(0.76 0.27 131)` | `#4FCC05` | Active/pressed states only — NOT text on white |
| `lime-700` | `oklch(0.63 0.22 131)` | `#3F9A04` | Borders, dark accents — NOT normal text on white |
| `lime-800` | `oklch(0.50 0.16 131)` | `#2F6803` | **Text on white (6.77:1 ✓ AA). PR Timer. Legal links.** |
| `lime-900` | `oklch(0.36 0.10 131)` | `#1F3602` | Darkest accent |
| `lime-950` | `oklch(0.24 0.06 131)` | `#0F1A01` | Dark mode bg tints |

#### Secondary: Electric Azure

| Token | OKLCH | Hex | Usage |
|-------|-------|-----|-------|
| `azure-50` | `oklch(0.97 0.02 255)` | `#F0F7FE` | Light tint bg |
| `azure-100` | `oklch(0.95 0.04 255)` | `#E0EFFB` | Hover bg |
| `azure-200` | `oklch(0.90 0.06 255)` | `#C0DEFD` | Light accents |
| `azure-300` | `oklch(0.80 0.10 255)` | `#80BCFE` | Accent hover |
| `azure-400` | `oklch(0.68 0.16 255)` | `#408BFC` | Medium interactive |
| `azure-500` | `oklch(0.52 0.22 260)` | `#0059FA` | **Secondary actions — white text safe (5.07:1 ✓)** |
| `azure-600` | `oklch(0.47 0.20 260)` | `#0048D8` | Hover/pressed |
| `azure-700` | `oklch(0.42 0.17 260)` | `#0037B0` | Dark text/borders |
| `azure-800` | `oklch(0.34 0.13 260)` | `#002278` | Deep accent |
| `azure-900` | `oklch(0.27 0.10 260)` | `#001150` | Darkest |
| `azure-950` | `oklch(0.18 0.06 260)` | `#000628` | Near-black |

#### Accent: Purple

| Token | OKLCH | Hex | Usage |
|-------|-------|-----|-------|
| `purple-50` | `oklch(0.97 0.02 295)` | `#F5F3FF` | Light tint |
| `purple-100` | `oklch(0.94 0.04 295)` | `#EDE9FE` | Hover bg |
| `purple-200` | `oklch(0.90 0.06 295)` | `#DDD6FE` | Light accents |
| `purple-300` | `oklch(0.83 0.10 295)` | `#C4B5FD` | Accent |
| `purple-400` | `oklch(0.74 0.16 295)` | `#A78BFA` | Medium |
| `purple-500` | `oklch(0.63 0.22 295)` | `#8B5CF6` | Medium-dark |
| `purple-600` | `oklch(0.55 0.27 295)` | `#7C3AED` | **Card gradient end. White text = 4.62:1 ✓ AA.** |
| `purple-700` | `oklch(0.49 0.27 295)` | `#6D28D9` | Dark variant |
| `purple-800` | `oklch(0.44 0.24 295)` | `#5B21B6` | Deeper |
| `purple-900` | `oklch(0.38 0.20 295)` | `#4C1D95` | Darkest |
| `purple-950` | `oklch(0.28 0.14 295)` | `#2E1065` | Near-black |

### 4.2 Neutrals: Slate (Tailwind Built-in)

| Context | Token | Hex |
|---------|-------|-----|
| Light body bg | `white` | `#FFFFFF` |
| Light card bg | `slate-50` | `#F8FAFC` |
| Light hover bg | `slate-100` | `#F1F5F9` |
| Light border | `slate-200` | `#E2E8F0` |
| Light divider | `slate-300` | `#CBD5E1` |
| Light muted text | `slate-400` | `#94A3B8` |
| Light secondary text | `slate-500` | `#64748B` |
| Light body text | `slate-600` | `#475569` |
| Light bold text | `slate-700` | `#334155` |
| Light heading text | `slate-900` | `#0F172A` |
| Dark body bg | `slate-900` | `#0F172A` |
| Dark card bg | `slate-800` | `#1E293B` |
| Dark hover bg | `slate-700` | `#334155` |
| Dark border | `slate-600` | `#475569` |
| Dark muted text | `slate-500` | `#64748B` |
| Dark body text | `slate-300` | `#CBD5E1` |
| Dark heading text | `slate-100` | `#F1F5F9` |

### 4.3 Semantic Colors

| Purpose | Light Bg | Base | Dark Variant |
|---------|----------|------|-------------|
| Success | `#D1FAE5` | `#10B981` | `#047856` |
| Warning | `#FEF3C7` | `#F59E0B` | `#B45309` |
| Error | `#FEE2E2` | `#EF4444` | `#991B1B` |
| Info | `#E0F2FE` | `#0284C7` | `#0C4A6E` |

### 4.4 Gradients

Gradient presets use **explicit hex** values (required for Satori/next-og card rendering).

| Name | CSS | Usage |
|------|-----|-------|
| `hero-gradient` | `linear-gradient(135deg, #5FE806 0%, #0059FA 100%)` | Landing hero, profile banner |
| `card-gradient` | `linear-gradient(135deg, #5FE806 0%, #7C3AED 100%)` | Shareable athlete card background |
| `achievement-gradient` | `linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)` | Gold achievement badge glow |
| `overlay-gradient` | `linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.8) 100%)` | Dark overlay on images |

> **Note:** Gradients are not a `@theme` namespace — define as regular `:root` CSS custom properties and consume via `bg-[var(--gradient-hero)]`.

### 4.5 WCAG Contrast Reference

*All ratios calculated per IEC 61966-2-1 sRGB linearization.*

| Color Pair | Ratio | Normal (4.5:1) | Large (3:1) | Verdict |
|------------|-------|----------------|-------------|---------|
| White on lime-500 (`#5FE806`) | 1.61:1 | ✗ | ✗ | **Never use — use slate-900 instead** |
| Slate-900 on lime-500 | 11.08:1 | ✓ | ✓ | **Primary button pattern** |
| Lime-500 text on white | 1.61:1 | ✗ | ✗ | **Never use** |
| Lime-600 text on white | 2.11:1 | ✗ | ✗ | **Never use for text** |
| Lime-700 text on white | 3.60:1 | ✗ | ✓ (18pt+) | Large/bold headings only |
| Lime-800 text on white | 6.77:1 | ✓ | ✓ | **Minimum for lime text on white** |
| Lime-400 text on slate-900 | ~8.5:1 | ✓ | ✓ | Safe for dark mode lime text |
| White on azure-500 | 5.07:1 | ✓ | ✓ | Secondary button text-white safe |
| White on purple-600 | 4.62:1 | ✓ | ✓ | **Card text on purple gradient end** |

### 4.6 Light & Dark Mode — shadcn/ui CSS Variables

Defined via CSS custom properties on `:root` (light) and `.dark`. For Tailwind v4 compatibility, we explicitly map these variables point to our OKLCH `@theme` tokens (e.g., `--primary: var(--color-lime-500);`):

| Variable | Light Value | Dark Value |
|----------|-------------|------------|
| `--background` | white | slate-900 |
| `--foreground` | slate-900 | slate-100 |
| `--card` | white | slate-800 |
| `--card-foreground` | slate-900 | slate-100 |
| `--popover` | white | slate-800 |
| `--popover-foreground` | slate-900 | slate-100 |
| `--primary` | lime-500 | lime-500 |
| `--primary-foreground` | **slate-900** (NOT white) | **slate-900** |
| `--secondary` | azure-500 | azure-500 |
| `--secondary-foreground` | white | white |
| `--muted` | slate-100 | slate-800 |
| `--muted-foreground` | slate-500 | slate-400 |
| `--accent` | slate-100 | slate-800 |
| `--accent-foreground` | slate-900 | slate-100 |
| `--destructive` | error base | error dark |
| `--destructive-foreground` | white | white |
| `--border` | slate-200 | slate-700 |
| `--input` | slate-200 | slate-700 |
| `--ring` | lime-400 | lime-400 |

### 4.7 Chart Color Palette (recharts)

Used for data visualizations (e.g., pace over time, run distance distribution) via shadcn/ui charts.

| Token | Light Mode Value | Dark Mode Value | Usage |
|-------|------------------|-----------------|-------|
| `--chart-1` | `var(--color-lime-500)` | `var(--color-lime-500)` | Primary data line |
| `--chart-2` | `var(--color-azure-500)` | `var(--color-azure-500)` | Secondary data |
| `--chart-3` | `var(--color-purple-600)`| `var(--color-purple-500)`| Tertiary data |
| `--chart-4` | `var(--color-amber-500)` | `var(--color-amber-500)` | Quaternary data |
| `--chart-5` | `var(--color-emerald-500)`| `var(--color-emerald-500)`| Quinary data |

---

## 5. Typography

### Font Stacks

```
display: "Outfit", "Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
body:    "Inter", system-ui, -apple-system, sans-serif
mono:    "JetBrains Mono", "Courier New", monospace
```

### Type Scale

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| `hero` / `h1` | Outfit | 60px / 3.75rem | 800 | 1.1 | -1.5px |
| `h2` | Outfit | 36px / 2.25rem | 700 | 1.2 | -0.5px |
| `h3` | Outfit | 30px / 1.875rem | 700 | 1.25 | -0.3px |
| `h4` | Outfit | 24px / 1.5rem | 700 | 1.25 | 0 |
| `h5` | Outfit | 20px / 1.25rem | 600 | 1.3 | 0 |
| `h6` | Outfit | 14px / 0.875rem | 600, uppercase | 1.4 | 0.5px |
| `base` | Inter | 16px / 1rem | 400 | 1.6 | 0 |
| `sm` | Inter | 14px / 0.875rem | 500 | 1.5 | 0 |
| `xs` | Inter | 12px / 0.75rem | 400 | 1.5 | 0 |
| `mono-time` | JetBrains Mono | 20px / 1.25rem | 600, tabular-nums | 1.4 | 1px |
| `mono-label` | JetBrains Mono | 12px / 0.75rem | 500 | 1.6 | 0.5px |

---

## 6. Spacing

| Context | Tailwind Class | Value |
|---------|---------------|-------|
| Page padding (mobile) | `p-4` or `p-6` | 16–24px |
| Page padding (tablet) | `p-8` | 32px |
| Page padding (desktop) | `p-16` outer, `p-12` inner | 64px / 48px |
| Section vertical margin | `my-12` or `my-16` | 48–64px |
| Card internal padding | `p-6` | 24px |
| Card internal gap | `gap-4` | 16px |
| Hero section padding | `py-20` | 80px |
| Button padding | `px-6 py-3` | 24×12px |
| Input padding | `px-4 py-3` | 16×12px |
| Container max-width | `max-w-4xl` (default), `max-w-5xl` (wide) | 896px / 1024px |

---

## 7. Border Radius

### Scale

| Token | Value |
|-------|-------|
| `sm` | 6px |
| `base` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `2xl` | 32px |
| `3xl` | 48px |
| `full` | 9999px |

> **Note:** This project uses the shadcn/ui `base-maia` style which features pill-shaped interactive elements (`rounded-4xl`). This creates a modern, friendly aesthetic consistent across all form controls and buttons.

### Component Mapping

| Component | Radius Token | Value |
|-----------|-------------|-------|
| Button | `rounded-4xl` | 9999px (pill) |
| Input / Select / Textarea | `rounded-4xl` / `rounded-xl` | 9999px (pill) / 16px |
| Card | `rounded-2xl` | 32px |
| Badge (pill) | `rounded-full` | 9999px |
| Avatar | `rounded-full` | 9999px |
| Modal / Dialog | `rounded-4xl` | 9999px (pill) |
| Tooltip | `rounded-2xl` | 32px |
| Dropdown | `rounded-2xl` | 32px |
| Toast | `rounded-lg` | 16px |
| Popover | `rounded-2xl` | 32px |
| Select Content | `rounded-2xl` | 32px |
| Select Item | `rounded-xl` | 16px |
| Dropdown Item | `rounded-xl` | 16px |
| Tabs List (default) | `rounded-4xl` | 9999px (pill) |
| Tabs Trigger | `rounded-xl` | 16px |

---

## 8. Shadows, Elevation & Z-Index

### Light Mode

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `e1` | `0 1px 2px rgba(15,23,42,0.05)` | Subtle resting state |
| `e2` | `0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.05)` | Cards at rest |
| `e3` | `0 10px 15px rgba(15,23,42,0.1), 0 4px 6px rgba(15,23,42,0.05)` | Featured cards |
| `e4` | `0 20px 25px rgba(15,23,42,0.15), 0 10px 10px rgba(15,23,42,0.05)` | Hovered cards, dropdowns |
| `e5` | `0 25px 50px rgba(15,23,42,0.25), 0 15px 20px rgba(15,23,42,0.1)` | Modals |
| `inset` | `inset 0 1px 3px rgba(15,23,42,0.06)` | Focused inputs |
| `glow` | `0 0 20px rgba(95,232,6,0.3), 0 4px 6px rgba(15,23,42,0.1)` | Primary CTA hover |

### Dark Mode

| Token | CSS Value |
|-------|-----------|
| `e1` | `0 1px 2px rgba(0,0,0,0.3)` |
| `e2` | `0 4px 6px rgba(0,0,0,0.37), 0 2px 4px rgba(0,0,0,0.25)` |
| `e3` | `0 10px 15px rgba(0,0,0,0.46), 0 4px 6px rgba(0,0,0,0.25)` |
| `e4` | `0 20px 25px rgba(0,0,0,0.55), 0 10px 10px rgba(0,0,0,0.25)` |
| `e5` | `0 25px 50px rgba(0,0,0,0.7), 0 15px 20px rgba(0,0,0,0.3)` |
| `inset` | `inset 0 1px 3px rgba(0,0,0,0.5)` |
| `glow-dark` | `0 0 20px rgba(95,232,6,0.5), 0 4px 6px rgba(0,0,0,0.3)` |

### Component Mapping

| Component / State | Shadow Token |
|-------------------|-------------|
| Card (resting) | `ring-1 ring-foreground/10` (subtle ring, not shadow) |
| Card (hovered) | `shadow-e4` (if interactive) |
| Featured card | `shadow-e3` |
| Dropdown | `shadow-e4` |
| Modal / Dialog | `shadow-e5` |
| Tooltip | `shadow-e3` |
| Toast | `shadow-e3` |
| Input (focused) | `shadow-inset` |
| Primary CTA (hovered, light) | `shadow-glow` |
| Primary CTA (hovered, dark) | `shadow-glow-dark` |
| Cookie banner | `shadow-e4` |
| Navbar (scrolled) | `shadow-e1` |
| Mobile peek bar | `shadow-e4` |

### Z-Index Scale

To prevent stacking context collisions, use this standardized z-index hierarchy:

| Context | Z-Index Token | Example Elements |
|---------|---------------|------------------|
| Base content | `z-0` / `auto` | Cards, text, standard sections |
| Sticky headers | `z-10` | Sticky table headers, local section stickiness |
| Dropdowns / Popovers | `z-30` | `DropdownMenu`, `Select` dropdowns, Tooltips |
| Global Navigation | `z-40` | `Navbar`, static mobile bottom bars |
| Modals / Overlays | `z-50` | `Dialog` background, `Toast` notifications, Full-screen sheets |

---

## 9. Animation & Motion

Library: **`motion`** v12.38.0 — import from `motion/react`.

### Timing Tokens

Define via `@theme` (easings) and `:root` CSS variables (durations):

| Token | Value | Defined In |
|-------|-------|------------|
| `ease-out-cubic` | `cubic-bezier(0.33, 1, 0.68, 1)` | `@theme` (`--ease-*`) |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `@theme` (`--ease-*`) |
| `--duration-micro` | 100ms | `:root` CSS variable |
| `--duration-fast` | 150ms | `:root` CSS variable |
| `--duration-base` | 200ms | `:root` CSS variable |
| `--duration-slow` | 300ms | `:root` CSS variable |

### Shared Variants

Define in a central `animations.ts`:

| Variant | Behavior |
|---------|----------|
| `pageVariants` | opacity 0→1, y 20→0, 400ms enter / 300ms exit |
| `staggerContainerVariants` | `staggerChildren: 0.1` |
| `staggerItemVariants` | opacity 0→1, x -20→0, 400ms |
| `fadeInVariants` | opacity 0→1, 600ms |

### Animation Patterns

| Pattern | Trigger | Duration | Easing | Engine |
|---------|---------|----------|--------|--------|
| Page transition (enter) | Route change | 400ms | `ease-out` | Motion |
| Page transition (exit) | Route change | 300ms | `ease-in` | Motion |
| Card hover float | Hover | spring | stiffness:400, damping:20 | Motion |
| Card shadow lift | Hover | 200ms | `ease-out-cubic` | CSS |
| Staggered list item | Scroll into view | 400ms/item | `ease-out` | Motion |
| PR count-up | Scroll into view | 1200ms | `ease-out` | Motion |
| Button press | Click/tap | 150ms | `active:scale-95` | CSS |
| Button glow | Hover | 200ms | `ease-out` | CSS |
| Modal overlay | Open | 200ms | `ease-out` | Motion |
| Modal content | Open | 300ms | `ease-out` | Motion |
| Section reveal | Scroll | 600ms | `ease-out` | Motion |
| Cookie banner slide-up | Page load | 300ms | `ease-out` | Motion |
| Completion celebration | Mount | spring | stiffness:200, damping:10 | Motion |
| Mobile peek sheet | Tap | 300ms | `ease-out` | Motion |

### Reduced Motion

When `prefers-reduced-motion` is active:
- Set all `y`/`x`/`scale` transforms to 0
- Keep opacity transitions at 200ms
- `useReducedMotion()` hook from Motion for JS-driven animations

---

## 10. Iconography

Library: **`@phosphor-icons/react`** v2.1.10

### Conventions

| Property | Rule |
|----------|------|
| Weight: `regular` | Default UI elements |
| Weight: `bold` | CTAs, section headers |
| Weight: `fill` | Completed/active states |
| Weight: `duotone` | Branded moments |
| Size: 16px | Badge/indicator icons |
| Size: 20px | Inline with text |
| Size: 24px | Standalone / section headers |
| Size: 32px | Empty-state CTA icons |
| Color | Inherit from `text-*` class; explicit `text-lime-500` for brand accents only |

### Icon Mapping

| Feature / Context | Icon Name | Weight | Size |
|-------------------|-----------|--------|------|
| PRs section header | `Sneaker` | `bold` | 24px |
| Time display | `Timer` | `regular` | 20px |
| Location / distance | `MapPin` | `regular` | 20px |
| Streak badge | `Flame` | `fill` | 16px |
| Progress | `TrendUp` | `regular` | 20px |
| Achievements section | `Trophy` | `bold` | 24px |
| Medal badge | `Medal` | `fill` | 16px |
| Goal / milestone | `Target` | `regular` | 20px |
| Featured | `Star` | `fill` | 16px |
| Share | `ShareNetwork` | `regular` | 20px |
| Download card | `DownloadSimple` | `bold` | 20px |
| Copy link | `Link` | `regular` | 20px |
| Download image | `Image` | `regular` | 20px |
| Profile / account | `User` | `regular` | 20px |
| Edit | `PencilSimple` | `regular` | 20px |
| Settings | `GearSix` | `regular` | 20px |
| Sign out | `SignOut` | `regular` | 20px |
| Search | `MagnifyingGlass` | `regular` | 20px |
| Add new | `Plus` | `bold` | 20px |
| Add (contextual) | `PlusCircle` | `regular` | 20px |
| Close / dismiss | `X` | `regular` | 20px |
| Confirm | `Check` | `regular` | 20px |
| Username available | `CheckCircle` | `fill` | 16px |
| Username loading | `CircleNotch` | `regular` | 16px |
| Date display | `Calendar` | `regular` | 16px |
| Pace / speed | `Gauge` | `regular` | 20px |
| Elevation | `Mountains` | `regular` | 20px |
| Favorite | `Heart` | `regular` / `fill` | 20px |
| Dropdown | `CaretDown` | `regular` | 16px |
| Next | `CaretRight` | `regular` | 16px |
| Previous | `CaretLeft` | `regular` | 16px |
| Light mode toggle | `Sun` | `fill` | 20px |
| Dark mode toggle | `Moon` | `fill` | 20px |
| External link | `ArrowSquareOut` | `regular` | 16px |
| Mobile nav menu | `List` | `regular` | 24px |
| Card preview expand | `CaretUp` | `regular` | 20px |

---

## 11. Illustrations

### Style Guidelines

- Source from Undraw/Popsy/Humaaans, recolored to brand palette
- Primary strokes: lime `#5FE806`
- Outlines: slate-700 `#334155`
- Use `currentColor` strokes for automatic dark mode adaptation
- Post-launch: commission custom illustration set

### Inventory

| # | Name | Dimensions | Context |
|---|------|-----------|---------|
| 1 | `hero-runner` | 600×300px | Landing hero, profile hero banner |
| 2 | `empty-prs` | 200×200px | PRs empty state — stopwatch + question mark |
| 3 | `empty-achievements` | 200×200px | Achievements empty state — trophy on pedestal |
| 4 | `empty-highlights` | 200×200px | Highlights empty state — camera + sparkles |
| 5 | `loading-runner` | 150×150px | Card generation loading — runner jogging in place |
| 6 | `onboarding-step-1` | 250×250px | Step 1 — person entering data on phone |
| 7 | `onboarding-step-2` | 250×250px | Step 2 — profile appearing on screen |
| 8 | `onboarding-step-3` | 250×250px | Post-onboarding completion/share state |

---

## 12. Component Styling Guide

### Button

**Variants** (via cva):

| Variant | Classes |
|---------|---------|
| `primary` | `bg-lime-500 text-slate-900 hover:bg-lime-600 hover:shadow-glow active:scale-95 focus:ring-lime-400` |
| `secondary` | `bg-azure-500 text-white hover:bg-azure-600 active:scale-95 focus:ring-azure-400` |
| `ghost` | `text-slate-600 hover:bg-slate-100` (dark: `text-slate-300 hover:bg-slate-800`) |
| `outline` | `border-2 border-slate-200 dark:border-slate-700 bg-transparent` |

**Sizes:**

| Size | Classes |
|------|---------|
| `sm` | `h-8 px-3 text-sm` |
| `md` | `h-10 px-6 text-base` |
| `lg` | `h-12 px-8 text-lg font-semibold` |
| `xl` | `h-14 px-10 text-lg font-bold` |

**Defaults:** `primary` / `md`

**All buttons:** `rounded-4xl` (pill shape per base-maia theme) `transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`

**Loading State (`isLoading`):**
- Replace the standard icon (if any) or add a natively spinning `CircleNotch` icon.
- Explicitly add `disabled` state (`opacity-50 cursor-not-allowed`).
- Maintain fixed width (or minimum width) during loading to prevent layout shifting.

---

### Card

- No border
- `ring-1 ring-foreground/10 rounded-2xl` (ring border, no resting shadow)
- Interactive: `hover:shadow-e4 transition-shadow duration-200`
- Size variants: `default` (py-6, gap-6) and `sm` (py-4, gap-4)
- Card title: `font-display`
- Time/data values: `font-mono`

---

### Badge

`rounded-full px-3 py-1.5 font-semibold text-xs uppercase tracking-wider gap-1.5`

| Variant | Light | Dark |
|---------|-------|------|
| `personal-best` | `bg-amber-100 text-amber-900` | `bg-amber-900/30 text-amber-300` |
| `verified` | `bg-emerald-100 text-emerald-900` | `bg-emerald-900/30 text-emerald-300` |
| `streak` | `bg-lime-100 text-lime-900` | `bg-lime-900/30 text-lime-300` |
| `milestone` | `bg-purple-100 text-purple-900` | `bg-purple-900/30 text-purple-300` |

---

### Input

- `border border-input bg-input/30 rounded-4xl` (pill shape per base-maia)
- Focus: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Placeholder: `placeholder-slate-400 dark:placeholder-slate-500`
- `transition-all duration-200`

---

### Dialog

- Overlay: `bg-black/80 backdrop-blur-xs`
- Content: `rounded-4xl ring-1 ring-foreground/5 bg-background p-6`
- Animation: overlay opacity 0→1 (200ms); content opacity 0→1 + scale 0.95→1 + y 20→0 (300ms) via Motion `AnimatePresence`

---

### Toast

| Variant | Color |
|---------|-------|
| `success` | Emerald |
| `destructive` | shadcn default (error red) |
| `info` | Sky |

- Duration: 4000ms (5000ms for errors)
- Position: top-right
- Animation: slide-in

---

### Select

- `rounded-4xl` trigger (pill shape), `rounded-2xl` content dropdown, lime focus ring

### Separator

- `slate-200` light / `slate-700` dark

### Tooltip

- `rounded-2xl text-xs bg-foreground text-background`

### DropdownMenu

- `rounded-2xl shadow-2xl ring-1 ring-foreground/5 p-1`

### Avatar

- `rounded-full border-2 border-white dark:border-slate-800`

### Tabs

- `bg-primary` active indicator underline (line variant)
- Tab list: `rounded-4xl bg-muted` (default), or transparent (line variant)
- Tab labels: `font-display`

---

### Switch

- Track: unchecked `bg-slate-200 dark:bg-slate-700`, checked `bg-lime-500`
- Thumb: `bg-white shadow-sm`
- Size: `h-6 w-11` track, `h-5 w-5` thumb
- `transition-transform duration-200`

---

### Skeleton

- `animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md`
- Compose shapes via className:
  - Text line: `h-4 w-full`
  - Heading: `h-6 w-48`
  - Avatar: `h-12 w-12 rounded-full`
  - Card: `h-32 w-full rounded-lg`
  - Stat: `h-10 w-24`

---

### FileUpload

- Click to open file picker + drag-and-drop
- Dragover state: `border-lime-500 bg-lime-50`
- Shape: `circle` (96px `rounded-full`) or `square` (160×160 `rounded-lg`)
- Upload progress bar: `bg-lime-500 h-1 rounded-full`
- Image compression: manual Canvas API (target ≤1MB, max input 5MB)
- Accepted formats: `image/jpeg`, `image/png`, `image/webp`

---

### MultiSelect

- Trigger button opens a dropdown with checkboxes
- Selected items: dismissible `streak`-variant badge pills with `X` icon
- Close on click-outside
- Keyboard accessible

---

### TimeInput

- Masked input using `@maskito/react`
- Formats: `MM:SS` (pattern `00:00`) or `HH:MM:SS` (pattern `00:00:00`)
- Placeholder: `text-slate-400` matching format
- Inherits base Input styling
- `font-mono`

---

### Textarea

- `resize-none rounded-xl min-h-16 border border-input bg-input/30 field-sizing-content`

---

### Textarea with Counter

- Extends Input base styles + `min-h-[100px] resize-none`
- Counter below: right-aligned `text-xs text-slate-400`
- At ≥90% limit: `text-amber-600 font-medium`
- At 100%: `text-destructive font-bold`
- Format: `{current} / {maxLength}`

---

### DatePicker

- Uses `react-day-picker` + `date-fns`
- Trigger button with selected date or "Pick a date" placeholder
- Calendar in a `<Popover>`
- Selected day: `bg-lime-500 text-slate-900 rounded-full`
- Today indicator: `border-2 border-lime-300 rounded-full`
- Max date: today (no future dates)
- Output: ISO string `YYYY-MM-DD`

---

### YearPicker

- shadcn/ui `<Select>` with options from current year down to 1970 (descending)
- Placeholder: "Select year"

---

### Navbar

- Height: `h-16` (64px)
- `sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm`
- On scroll: add `shadow-e1 border-b border-slate-200 dark:border-slate-700`
- Logo: Outfit 700 `text-lime-500`, left-aligned

---

### Dark Mode Toggle

- `Sun` (fill, active in light) / `Moon` (fill, active in dark), 20px
- Ghost button, `rounded-full`, 40×40px
- `transition-colors duration-200` on `<html>`

---

### Form Error Pattern

Inline errors directly below the offending field:

```
<p className="text-destructive text-sm mt-1">{error message}</p>
```

No separate error summary.

---

## 13. Responsive Breakpoints

| Token | Width | Notes |
|-------|-------|-------|
| `xs` | 375px | Single column, stacked CTAs |
| `sm` | 640px | Start 2-col grids |
| `md` | 768px | 2-col default |
| `lg` | 1024px | 3-col, sidebar layouts |
| `xl` | 1280px | Spacious layout |
| `2xl` | 1536px | Content stays centered |

---

## 14. Shareable Card Design

All card colors use **explicit hex only** — Satori/next-og does not support CSS variables or OKLCH.

### Common

- Background: `linear-gradient(135deg, #5FE806 0%, #7C3AED 100%)`
- **Text placement:** anchor all text toward the purple (#7C3AED) end of the gradient (white on purple-600 = 4.62:1 ✓ AA; white on lime-500 = 1.61:1 ✗)
- Lime occupies top-left as visual accent only

### Square Format (1080×1080px)

| Element | Font | Size | Color |
|---------|------|------|-------|
| Name | Outfit 800 | 48px | `#FFFFFF` |
| Tagline | Inter 500 | 20px | `rgba(255,255,255,0.8)` |
| PR distance label | JetBrains Mono 600 | 14px | `rgba(255,255,255,0.6)` |
| PR time | JetBrains Mono 600 | 36px | `#FFFFFF` |
| Stats (races, km) | JetBrains Mono 500 | 18px | `#FFFFFF` |
| Personality badge | — | — | pill, `rgba(255,255,255,0.2)` bg, `#FFFFFF` text |
| Watermark | Inter 400 | 12px | `rgba(255,255,255,0.4)`, bottom-center |

Layout: 3 PRs in a 3-column row.

### Stories Format (1080×1920px)

Same content as square, plus:

- Avatar: 96px circle, `border: 3px solid rgba(255,255,255,0.3)`
- Avatar fallback: initials circle — `background: #5FE806`, `color: #0F172A`, `font-weight: 700`

### OG Image (1200×630px)

For social sharing (`<meta property="og:image">`).

| Element | Font | Size | Color |
|---------|------|------|-------|
| Watermark | Inter 12px | — | `rgba(255,255,255,0.4)`, top-left |
| Athlete name | Outfit 800 | 48px | `#FFFFFF` |
| Tagline | Inter 500 | 20px | `rgba(255,255,255,0.8)` |
| Top PR | JetBrains Mono 600 | 32px | lime-400 hex |
| Personality badge | — | — | pill, `rgba(255,255,255,0.2)` bg |

> **Note on Satori Font Loading:** Since Satori requires raw TTF/OTF ArrayBuffers (it cannot use `next/font/google`), localized `.ttf` files for Outfit, Inter, and JetBrains Mono MUST be downloaded and stored in `/public/fonts/satori/`. These will be dynamically read from the file system or via `fetch` during OG generation.

Cache: `revalidate: 3600` (1 hour).

### Download Filenames

- Square: `zealerprofile-{username}-square.png`
- Stories: `zealerprofile-{username}-stories.png`

---

## 15. Component Accessibility Checklist

All components must meet WCAG 2.1 AA. Key requirements by component type:

### Interactive Elements (Button, Input, Select, Checkbox, Switch)
- Focus visible indicator: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Disabled state: `disabled:pointer-events-none disabled:opacity-50`
- Invalid state: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- Touch targets: minimum 44×44px (use pseudo-element padding if needed)

### Loading States
- Button: `aria-busy="true"` when loading + `sr-only` "Loading" text
- Skeleton: `aria-hidden="true"` (decorative placeholder)
- Progress: inherit from @base-ui primitives (role, aria-valuenow, etc.)

### Form Fields
- Every field must have a visible `<Label>` with matching `htmlFor`
- Character counters must be linked via `aria-describedby`
- Counter updates must use `aria-live="polite"` for screen reader announcements
- Error messages: `text-destructive text-sm mt-1` inline below field

### Composite Components (MultiSelect, DatePicker, DropdownMenu)
- Trigger must have `aria-label` describing purpose
- Trigger must expose `aria-expanded` state
- Popover/dropdown content must be keyboard navigable

### Color Contrast (from §3 and §4.5)
- Never use lime-500 as text on light backgrounds (1.61:1 — fails)
- Lime-800 minimum for lime text on white (6.77:1 ✓)
- Lime-500 safe as background with slate-900 text (11.08:1 ✓)
- White on azure-500 safe (5.07:1 ✓)
- White on purple-600 safe (4.62:1 ✓)

### Reduced Motion
- All Motion variants must have `*Safe` alternatives (see `animations.ts`)
- Use `useReducedMotion()` hook to select appropriate variant set
- CSS fallback in `globals.css` handles Tailwind animations
