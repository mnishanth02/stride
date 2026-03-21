---
goal: ZealerProfile MVP — High-Level Requirements & Build Sequence
version: 1.0
date_created: 2026-03-21
last_updated: 2026-03-21
owner: ZealerProfile
tags: [architecture, feature, infrastructure]
---

# ZealerProfile MVP — Requirements Overview

This document is the master roadmap for building the ZealerProfile MVP. It breaks the entire product into sequential modules — each representing a self-contained feature area. **This is not a task-level plan.** Each module listed here will get its own detailed implementation plan (in `docs/impl-plan/`) with research, file paths, and atomic tasks before development begins.

## Source Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Product Plan v2.1 | `docs/core-plan/product-plan.md` | Feature specs, user flows, schema, tech stack, success metrics |
| Design System v3.0 | `docs/core-plan/design-system.md` | Tokens, component styling, motion, accessibility, card design |

---

## Finalized Decisions

All decisions that affect implementation, consolidated from both source documents.

| # | Area | Decision |
|---|------|----------|
| 1 | Framework | Next.js 16 + Tailwind CSS v4 (`@theme` directive, CSS-first) + shadcn/ui |
| 2 | Auth | Clerk — email + Google OAuth, built-in email verification, password reset |
| 3 | Database | Neon Serverless PostgreSQL + Drizzle ORM |
| 4 | File Storage | **Cloudflare R2 + next-s3-upload** — R2 for storage (10GB free, zero egress, usage-based at $0.015/GB-month). `next-s3-upload` (open source) for upload DX: presigned URL uploads direct from browser → R2, `usePresignedUpload()` hook, 1-line API route. **Abstracted behind a `lib/storage/` service layer** so the provider can be swapped to any S3-compatible service without touching feature code. |
| 5 | Card generation | next/og (Satori) — server-side PNG via ImageResponse API |
| 6 | Hosting | Vercel — production + preview environments, Neon database branching |
| 7 | Analytics | PostHog (free tier) — client-side, consent-gated |
| 8 | Animation | Motion v12 (`motion/react`) + CSS transitions |
| 9 | Icons | Phosphor Icons (`@phosphor-icons/react`) |
| 10 | Forms | react-hook-form + Zod v4 + @hookform/resolvers |
| 11 | Input masking | @maskito/core + @maskito/react (time inputs) |
| 12 | Fonts | Outfit (display), Inter (body), JetBrains Mono (mono) via next/font/google |
| 13 | Webhooks | svix for Clerk webhook signature verification |
| 14 | Data fetching | @tanstack/react-query (client-side caching) |
| 15 | Dark mode | next-themes (attribute="class", defaultTheme="system") from Day 1 |
| 16 | Design approach | Mobile-first — target viewports: 375px, 390px, 414px |
| 17 | Pricing | Free for everyone. No paid tiers. |

---

## Build Sequence & Dependency Map

Modules must be built in this order. Dependencies are explicit — no module should start until its predecessors are complete.

```
Module 0: Workspace & Infrastructure Setup
    ↓
Module 1: App Shell & Shared UI
    ↓
Module 2: Authentication & User Management
    ↓
Module 3: Onboarding Flow
    ↓
Module 4: Profile Dashboard
    ↓
Module 5: Public Profile Page
    ↓ ↘
Module 6: Shareable Athlete Card    Module 7: Search & Explore
    ↓ ↙
Module 8: Landing Page, Legal & Launch Polish
```

| Module | Depends On | Can Parallel With |
|--------|-----------|-------------------|
| 0 — Workspace Setup | — | — |
| 1 — App Shell & Shared UI | Module 0 | — |
| 2 — Auth & User Management | Module 1 | — |
| 3 — Onboarding Flow | Module 2 | — |
| 4 — Profile Dashboard | Module 3 | — |
| 5 — Public Profile Page | Module 4 | — |
| 6 — Shareable Athlete Card | Module 5 | Module 7 |
| 7 — Search & Explore | Module 5 | Module 6 |
| 8 — Landing, Legal & Polish | Module 5 | Module 6, Module 7 (landing page & legal pages can start as soon as Module 5 is done) |

---

## Module 0: Workspace & Infrastructure Setup

**Goal:** A fully configured, deployable project skeleton with all infrastructure connected — before any feature code is written.

### What Gets Built

- **Project scaffold** — Next.js 16 app with Tailwind CSS v4, shadcn/ui initialized, TypeScript strict mode
- **Folder structure & conventions** — Establish the app directory layout, shared `lib/` modules, component organization, naming conventions
- **Design system foundation** — Tailwind `@theme` tokens (OKLCH color scales for lime, azure, purple), CSS custom properties for shadcn/ui variables (light + dark), font loading via `next/font/google` (Outfit, Inter, JetBrains Mono), border radius scale, shadow/elevation tokens, gradient custom properties
- **Dark mode** — `next-themes` provider configured with `attribute="class"`, `defaultTheme="system"`, no FOUC
- **Database** — Neon PostgreSQL project, Drizzle ORM config, full schema for all 4 tables (`users`, `personal_records`, `highlights`, `achievements`), all indexes (unique, full-text search, composite), initial migration
- **Auth provider** — Clerk project, Next.js middleware for route protection (`/dashboard/*`, `/onboarding/*`), webhook endpoint for user sync (Clerk events → `users` table)
- **File storage** — Cloudflare R2 bucket configured with CORS, `next-s3-upload` API route for presigned URL generation, upload routes for avatars, highlights, and achievement badges. Browser uploads go directly to R2 via presigned URLs (no server relay). **Storage service abstraction layer** — all file operations (upload, delete, get URL) go through a `lib/storage/` module that wraps `next-s3-upload` + R2. Feature code never calls R2/S3 APIs directly, making future provider swaps a single-module change.
- **Analytics** — PostHog initialization, identify calls on auth
- **Deployment pipeline** — Vercel project linked, production + preview environments, Neon database branching for previews
- **Environment variables** — All secrets and config keys documented and set in Vercel + local `.env.local`
- **Utility modules** — `cn()` function (clsx + tailwind-merge), reserved username list

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §8.1 Tech Stack, §8.2 Database Schema, §9 Phase 1 |
| Design System | §2 Technology Stack, §3 Code Patterns, §4 Color System, §4.6 shadcn/ui CSS Variables, §5 Typography, §6–8 Spacing/Radius/Shadows |

---

## Module 1: App Shell & Shared UI Components

**Goal:** The complete reusable UI layer that every feature builds on — all components styled per design system, animation foundation wired, global layout in place.

### What Gets Built

- **Root layout** — Global metadata, font CSS variable classes on `<html>`, theme provider, analytics provider, toast provider
- **Navbar** — Logo (Outfit 700, lime-500), global search input (placeholder — functional wiring in Module 7), auth-aware buttons (sign in/sign up vs. user menu), dark mode toggle (Sun/Moon icons), mobile hamburger menu
- **Full component library** (all styled per design system v3.0):
  - Core: Button (primary/secondary/ghost/outline × sm/md/lg/xl + loading state), Card, Badge (personal-best/verified/streak/milestone), Avatar, Separator
  - Forms: Input, Textarea with character counter, TimeInput (masked via @maskito), FileUpload (click + drag-drop, circle/square shapes, compression, progress bar), Select, MultiSelect (checkbox dropdown + badge pills), DatePicker (react-day-picker in popover), YearPicker (select 1970–current)
  - Overlay: Dialog (with Motion entrance/exit), Toast (success/destructive/info), Tooltip, DropdownMenu
  - Feedback: Skeleton (text/heading/avatar/card/stat shapes), Switch
  - Navigation: Tabs
- **Animation foundation** — Shared Motion variants in `animations.ts` (page, stagger container, stagger item, fade-in), reduced motion support via `useReducedMotion()` hook, CSS `@media (prefers-reduced-motion)` fallback
- **Shared Zod schemas** — Central `validations.ts` with schemas for username rules, PR time ranges (5K/10K/HM/Marathon), text length limits (tagline 80, story 500, highlight story 200, title 60), image format+size
- **Error boundary** — Global error boundary component
- **Loading states** — Route-level loading skeletons
- **Not-found page** — Styled 404 page (`not-found.tsx`)
- **Icon mapping** — Centralized `icons.ts` module with all Phosphor icon imports per design system §10

### Key References

| Source | Sections |
|--------|----------|
| Design System | §9 Animation, §10 Iconography, §12 Component Styling Guide (all components), §13 Responsive Breakpoints |
| Product Plan | §6 Feature Specs (field types inform component needs), §10 Pages & Routes |

---

## Module 2: Authentication & User Management

**Goal:** Users can sign up, sign in, and have their account synced to the database. Auth-protected routes are locked down. Unverified users are gated from public visibility.

### What Gets Built

- **Clerk sign-up page** (`/sign-up`) — Email + Google OAuth, branded with ZealerProfile styling
- **Clerk sign-in page** (`/sign-in`) — Email + Google OAuth
- **Middleware** — Clerk middleware protecting `/dashboard/*` and `/onboarding/*` routes; all other routes public
- **Webhook handler** — Clerk `user.created`, `user.updated`, `user.deleted` events → create/update `users` table record. Sync `clerk_id`, `primary_email`, `email_verified`, `full_name`. Webhook signature verified via svix.
- **Email verification gate** — Profile stays hidden from public (`/:username`, `/explore`, search) until `email_verified = true`. Clerk handles the verification flow; webhook updates the flag.
- **Reserved username utility** — Blocked list: `admin`, `dashboard`, `api`, `login`, `signup`, `settings`, `support`, `help`, `about`, `onboarding`, `card`, `terms`, `privacy`. Used during onboarding and username change.
- **Auth state access** — Server-side and client-side patterns for accessing current user

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §8.1 (Clerk), §16 Resolved Decisions (#6, #19), §18 Security |
| Product Plan | §8.2 users table (clerk_id, email_verified) |

---

## Module 3: Onboarding Flow

**Goal:** A new user completes a 3-step wizard and has a shareable profile with PRs and highlights — in under 5 minutes.

### What Gets Built

- **3-step wizard** (`/onboarding`) — Step indicator (progress bar or step dots), forward/back navigation, step state persistence
- **Step 1/3 — Profile Basics:**
  - Full name, username (real-time availability check via API + reserved word validation + character rules: 3–20 chars, lowercase alphanumeric + hyphens/underscores), tagline (max 80 chars)
  - Athlete type multi-select (runner, trekker, cyclist, triathlete, other)
  - Profile photo upload with client-side compression (via storage abstraction layer)
  - Location (city text), favorite run time (select), running personality badge (manual select from predefined list)
- **Step 2/3 — Personal Records:**
  - PR inputs for 5K (MM:SS), 10K (HH:MM:SS), Half Marathon (HH:MM:SS), Marathon (HH:MM:SS), Custom (text label + time)
  - Time input masking via @maskito, validation ranges per product plan §6.2
  - Live card preview updating as user types — shows how the shareable card will look
- **Step 3/3 — Highlight Activities (skippable):**
  - Add 1–2 highlights: title (max 60 chars), distance/elevation text, duration text, short story (max 200 chars), image upload
  - Skip option prominently available
- **Completion screen** (`/onboarding/complete`) — Finished profile preview, athlete card preview, download card button, copy profile URL button, share prompt
- **Image upload pipeline** — Client-side Canvas API compression (target ≤1MB, max input 5MB), format validation (JPEG/PNG/WebP), upload via storage service layer → URL saved to DB
- **Onboarding redirect logic** — If onboarding incomplete, redirect from `/dashboard` to `/onboarding`

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §7.1 Onboarding Flow, §6.1–§6.3 (Profile, PRs, Highlights field specs), §16 Decisions (#10, #11, #14) |
| Design System | §12 Component Styling (TimeInput, FileUpload, MultiSelect, Textarea with Counter) |

---

## Module 4: Profile Dashboard

**Goal:** Authenticated users can edit every section of their profile from a single dashboard, manage visibility, and preview their public page.

### What Gets Built

- **Dashboard home** (`/dashboard`) — All profile sections editable from one page, organized as collapsible/tabbed sections
- **Profile basics editing** — Same fields as onboarding Step 1, pre-filled from DB
- **Personal Records CRUD** — Add new PRs, edit existing, delete. Same validation and masking as onboarding.
- **Highlights CRUD** — Add, edit, delete highlight activities with image upload. Sort order management (drag reorder or move up/down).
- **Achievements CRUD** — Add, delete achievements. Fields: title, category (race/medal/milestone/certificate), year (optional), badge image upload (optional). Displayed as a list.
- **Identity Stats editing** — Total km (decimal input), years active since (year picker), longest run km, favorite run time (select), running personality badge (select from predefined list)
- **Visibility toggle** — `is_public` on/off switch. When off, profile returns 404 to public visitors.
- **Profile preview link** — "View my public profile" link opening `/:username` in new tab
- **Copy URL button** — One-click copy of `ZealerProfile.app/{username}` to clipboard
- **Empty states** — Placeholder prompts per section: "Add your first PR!", "Share your proudest moment!", etc. with contextual add buttons

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §6.1–§6.5 (all field specs), §6.4 Achievements, §9 Phase 3, §16 Decisions (#7, #18) |
| Design System | §12 Component Styling (Card, Badge, Switch, Tabs, Skeleton) |

---

## Module 5: Public Profile Page

**Goal:** A beautiful, SEO-optimized public page at `/:username` that showcases the athlete's full identity — the core product surface.

### What Gets Built

- **Public profile route** (`/:username`) — Server-rendered, mobile-first, full layout with all sections
- **Profile sections rendered:**
  - Hero: name, tagline, avatar (circular), athlete type badges, location, running personality badge
  - Personal Records: displayed prominently with mono font for times, distance labels
  - Highlights: card grid layout with images, titles, stories, dates
  - Achievements: scannable list with category badges and years
  - Identity Stats: total km, years active, longest run, total races (count of achievements), favorite run time
  - Athlete Story: narrative text section
- **Visibility gates** — `is_public = true` AND `email_verified = true` AND `is_deleted = false` → render profile. Otherwise → 404 (same not-found page).
- **Dynamic SEO** — Per-user `<title>`, `<meta description>`, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`), Twitter card meta
- **OG image endpoint** — Dynamic OG image generation (1200×630px) using next/og (Satori) for social previews when the profile URL is shared. Satori font files (TTF for Outfit, Inter, JetBrains Mono) stored in `/public/fonts/satori/`. Cached with `revalidate: 3600`.
- **Empty section handling** — Sections with no data are hidden on public view (no empty-state prompts for visitors)
- **Responsive layout** — Mobile-first, tested at 375px, 390px, 414px breakpoints

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §6.1–§6.5 (display specs), §10 Routes (/:username), §18 Security (visibility), §9 Phase 3 |
| Design System | §14 Shareable Card Design (OG image spec), §5 Typography, §7 Border Radius, §8 Shadows |

---

## Module 6: Shareable Athlete Card (Hero Feature)

**Goal:** Users can generate and download a stunning athlete card in two formats — the #1 growth driver of the product.

### What Gets Built

- **Card generator API** — next/og (Satori) route handler generating server-side PNG from latest saved profile data
- **Two formats:**
  - Square (1080×1080px) — optimized for WhatsApp sharing
  - Stories (1080×1920px) — optimized for Instagram Stories, includes avatar
- **Card content:** Athlete name, tagline, top 3 PRs (distance label + time in mono font), total races count, total km, running personality badge, `ZealerProfile.app/{username}` watermark
- **Card design** — Gradient background (`#5FE806` → `#7C3AED`), text anchored toward purple end for WCAG contrast, explicit hex colors (Satori cannot use CSS variables), font sizing and layout per design system §14
- **Satori font loading** — TTF files for Outfit (800), Inter (400, 500), JetBrains Mono (500, 600) downloaded to `/public/fonts/satori/`, loaded as ArrayBuffer at generation time
- **Dashboard card page** (`/dashboard/card`) — Preview both card formats, one-tap PNG download buttons
- **Download mechanism** — Generate on-demand from current profile data, serve as `Content-Disposition: attachment` with filename `zealerprofile-{username}-{format}.png`
- **Rate limiting** — 10 card generations per hour per user. Show remaining count in UI.

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §6.6 Shareable Athlete Card (full spec), §9 Phase 4 |
| Design System | §14 Shareable Card Design (square, stories, OG formats — fonts, sizes, colors, layout) |

---

## Module 7: Search & Explore

**Goal:** Anyone (including logged-out visitors) can discover and browse public athlete profiles through a directory and search.

### What Gets Built

- **Explore page** (`/explore`) — Public, no auth required, SEO-indexed
  - Responsive card grid (portfolio gallery style)
  - Each card shows: avatar, full name, tagline, athlete type badges, top PR, location
  - Filters: athlete type (multi-select), location (city text input)
  - URL-driven query params: `?q=`, `?type=`, `?location=`
  - Sorting: newest first by `updated_at`
  - Pagination: infinite scroll (load more profiles on scroll)
- **Global navbar typeahead search** — Wired into the navbar search input placeholder from Module 1
  - Trigger: 2+ characters typed
  - Debounce: 300ms on keystrokes
  - Dropdown: top 5 matching profiles (avatar, name, username, location)
  - "See all results" link at bottom → navigates to `/explore?q={query}`
  - Available to all visitors — no auth required
- **Search API** — Server-side endpoint
  - Full-text search across `full_name`, `username`, `location`, `tagline`
  - Uses the PostgreSQL full-text search index defined in schema
  - Returns only public, verified, non-deleted profiles (`is_public = true`, `email_verified = true`, `is_deleted = false`)
- **Privacy enforcement** — Hidden, unverified, or deleted profiles never appear in explore or search results

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §6.7 Athlete Search & Explore (full spec), §9 Phase 3, §16 Decisions (#29–#35) |
| Product Plan | §8.2 Database Indexes (full-text search, composite public discovery index) |

---

## Module 8: Landing Page, Legal, Settings & Launch Polish

**Goal:** Everything needed to ship a complete, production-ready product — first impression, legal compliance, account management, analytics, and quality assurance.

### What Gets Built

- **Landing page** (`/`) — Hero section with gradient, value proposition, tagline, example athlete card (demo account or static mockup), "Create My Profile" CTA. Mobile-first.
- **Legal pages:**
  - Terms of Service (`/terms`) — Required for Google OAuth
  - Privacy Policy (`/privacy`) — Required for GDPR compliance
- **Cookie consent banner** — GDPR-compliant banner for PostHog + Clerk cookies. Appears on first visit. Consent state persists.
- **Account settings page** (`/dashboard/settings`):
  - Username change — new username validated (same rules), old URL breaks immediately (no redirect), confirmation dialog
  - Profile visibility toggle — same `is_public` switch as dashboard
  - Delete account — confirmation flow, soft delete (`is_deleted = true`, `deleted_at` set), profile immediately hidden, data purged after 30 days
- **PostHog event tracking** (consent-gated):
  - `signup` — on account creation
  - `onboarding_complete` — on wizard completion
  - `card_download` — on athlete card download (with format: square/stories)
  - `profile_view` — on public profile page view
  - `card_share` — on share action
- **Mobile responsiveness QA** — All pages tested and verified at 375px, 390px, 414px viewports
- **Error states** — Error boundaries on every route segment, user-friendly error messages
- **Loading states** — Route-level skeleton loading for all pages
- **404 handling** — Clean not-found page for invalid usernames, non-existent routes
- **Production deployment** — Vercel custom domain (`ZealerProfile.app`), all environment variables configured, DNS verified

### Key References

| Source | Sections |
|--------|----------|
| Product Plan | §9 Phase 5, §10 Routes, §16 Decisions (#15, #16, #28), §18 Security, §20 Verification Checklist |
| Design System | §12 Component Styling (Cookie banner, Toast), §9 Animation (cookie banner slide-up) |

---

## Verification Checklist

After all modules are complete, every item below must pass before launch. Sourced from Product Plan §20.

| # | Verification |
|---|-------------|
| 1 | Sign up with email → verify email → complete onboarding → profile visible at `/:username` |
| 2 | Sign up with Google → complete onboarding → profile visible (Google account syncs as verified) |
| 3 | Full onboarding completes in under 5 minutes |
| 4 | Public profile renders all sections correctly with data |
| 5 | Empty profile shows placeholder prompts, not blank sections |
| 6 | Card downloads in both formats (1080×1080 + 1080×1920) with correct content |
| 7 | Rate limit blocks >10 card downloads in an hour |
| 8 | Toggling `is_public` OFF → profile returns 404 for public visitors |
| 9 | Username change → old URL returns 404, new URL works |
| 10 | Account deletion → profile disappears immediately, data purged after 30 days |
| 11 | Image upload works for JPEG, PNG, WebP ≤5MB; rejects >5MB or wrong format |
| 12 | Reserved usernames (`admin`, `dashboard`, `api`) rejected at signup |
| 13 | OG meta tags render correctly when profile URL is shared on social |
| 14 | All pages responsive and usable on mobile (375px, 390px, 414px) |
| 15 | PostHog tracks: signup, onboarding_complete, card_download, profile_view |
| 16 | Cookie consent banner appears on first visit |
| 17 | Terms of Service and Privacy Policy pages load correctly |
| 18 | 404 page displays for non-existent usernames |
| 19 | `/explore` page loads with card grid, infinite scroll works |
| 20 | Explore filters (athlete type, location) correctly filter results |
| 21 | Navbar typeahead search returns matching profiles on 2+ characters, debounced, works for logged-out visitors |
| 22 | Private or unverified profiles do not appear in search or explore |

---

## Out of Scope (Phase 2+)

These features are explicitly excluded from the MVP. Documented here to prevent scope creep.

- Auto-assigned running personality badge (AI/rule-based)
- Goal tracker
- AI narrative mode (Claude API)
- Profile themes
- PDF export
- Custom domains (nishanth.run)
- Profile comparison (head-to-head)
- Strava import
- Payments / monetization
- Social features / following
- Activity feeds

---

## How to Use This Document

1. **Start with Module 0.** Create a detailed implementation plan at `docs/impl-plan/module-0-workspace-setup.md` with file paths, exact commands, configuration code, and atomic tasks.
2. **Complete each module sequentially** (respecting the dependency map). Mark module as done only when its features are deployed and verified.
3. **Modules 6 & 7 can be built in parallel** after Module 5 is done.
4. **Module 8** has components that can start as soon as Module 5 is done (landing page, legal pages don't depend on card or search).
5. **Each module's detailed plan** should reference back to this document and the source documents for specs.
