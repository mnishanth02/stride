
|                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------- |
| Product Requirements Document<br><br>Micro SaaS — Side Project<br><br>Version 2.1  \|  March 2026  \|  CONFIDENTIAL |
|                                                                                                                     |



|                  |                                               |
| ---------------- | --------------------------------------------- |
| Field            | Detail                                        |
| Product Name     | ZealerProfile                                 |
| Tagline          | Your PRs. Your Story. One Link.               |
| Product Type     | Micro SaaS — Side Project                     |
| Target Launch    | MVP in 2 weeks                                |
| Primary Audience | Amateur runners, trekkers, endurance athletes |
| Document Version | 2.1                                           |
| Status           | Approved for Development — All Decisions Finalized |

# 1. Executive Summary

ZealerProfile is a public identity platform for runners and endurance athletes. It gives every athlete a shareable profile page that showcases who they are — their personal records, highlight moments, achievements, and story — not just raw activity data.



The product is NOT a workout tracker or a Strava competitor. It is a portfolio and identity layer — think GitHub profile meets Strava highlights — built for athletes who want to share their journey with pride.



|   |
|---|
|Core Problem<br><br>Strava and fitness apps tell you how much you ran. ZealerProfile tells the world who you are as an athlete. There is no elegant, shareable, public-facing identity layer for amateur runners today.|



The MVP can be built and deployed in 2 weeks by a solo developer. The growth engine is the shareable athlete card — a beautiful image card that users post on WhatsApp and Instagram, driving organic signups.



# 2. Problem & Opportunity

## 2.1 The Problem

|   |   |   |
|---|---|---|
|Pain Point|Current Reality|Impact|
|No public identity for athletes|Strava profiles are data-heavy, not shareable|Athletes can't easily showcase their journey|
|Sharing achievements is clunky|Screenshots of app stats look unprofessional|Low engagement when sharing on social|
|No portfolio layer|LinkedIn has no fitness dimension|Athletes have no credibility page to link|
|Tracking apps are overkill|Daily logging fatigue is real|Users drop off from heavy-input apps|



## 2.2 The Opportunity

- Running is the world's most popular individual sport — 50M+ active runners globally

- Runner communities are highly active on WhatsApp groups, Instagram, and Reddit

- No micro SaaS currently owns the 'athlete identity' niche

- Manual input (no API needed) = zero third-party dependency, ship in days

- Viral coefficient is high: every shared card drives new signups organically




# 3. Vision & Positioning

## 3.1 Vision Statement

|   |
|---|
|Vision<br><br>Give every runner and endurance athlete a place to showcase their journey — not just track it.|



## 3.2 Positioning

|   |   |
|---|---|
|Dimension|ZealerProfile|
|Category|Athlete identity & portfolio|
|Primary analogy|GitHub profile x Strava highlights x personal story|
|Core emotion|Pride — 'I want to share this'|
|Key differentiator|Identity, not analytics|
|Tagline|Your PRs. Your Story. One Link.|



## 3.3 What This Product Is NOT

- Not a Strava alternative or workout tracker

- Not dependent on third-party fitness APIs

- Not a social feed or activity timeline

- Not a data analytics or coaching platform

- Not a community or social network (in MVP scope)




# 4. Target Users

## 4.1 Primary Audience

|   |   |   |
|---|---|---|
|Segment|Description|Key Motivation|
|Casual to serious runners|People who have completed at least one 5K race|Showcase PRs and race history with pride|
|Trekkers & hikers|Those who complete notable trails and climbs|Document and share adventure milestones|
|Amateur endurance athletes|Cyclists, triathletes, ultra runners|Build a credibility page for their sport|



## 4.2 Secondary Audience

- Fitness enthusiasts who want identity, not just tracking

- Athletes applying to running clubs or events needing a profile link

- Coaches reviewing athlete backgrounds




## 4.3 User Persona — Primary

|   |
|---|
|Ravi, 28 — Amateur Runner<br><br>Has completed 3 half marathons and a full marathon. Active in 2 running WhatsApp groups. Posts race photos on Instagram. Uses Strava but finds it cluttered.<br><br>Goals: Show his running journey to friends, family, and future running partners. Have one link that says 'this is my running story'.<br><br>Frustration: Strava is a feed, not a portfolio. His best runs are buried under daily jogs.|



# 5. Product Principles

Every feature and design decision must be evaluated against these four principles:



|   |   |   |
|---|---|---|
|Principle|What It Means|What It Rules Out|
|Minimal Input, Maximum Output|Ask for only what's meaningful. Make the output visually stunning.|Daily logging, heavy forms, required fields beyond essentials|
|Highlight > History|Show best moments, not every activity. Curated > comprehensive.|Activity feeds, full history timelines, raw data dumps|
|Identity > Analytics|Answer 'Who are you as an athlete?' not 'How much did you run?'|Charts, graphs, performance trends, statistics dashboards|
|Shareable > Stored|Every data point entered should make the shareable card more impressive.|Private-only data, vanity metrics with no sharing value|



# 6. MVP Feature Specifications

|   |
|---|
|MVP Goal<br><br>A user can create a profile, enter their PRs and highlights, and share a beautiful card — all in under 5 minutes.|



## 6.1 Athlete Profile Page

Public URL: ZealerProfile.app/{username}

The core product surface. A clean, beautiful public page that represents the athlete's identity.

Public visibility rule: a profile is only publicly accessible when `is_public = true`, `email_verified = true`, and the account is not deleted.



|   |   |   |   |
|---|---|---|---|
|Field|Type|Required|Notes|
|Full Name|Text|Yes|Displayed prominently at top|
|Username / Handle|Text (slug)|Yes|Used in public URL. Rules: 3–20 chars, lowercase letters, numbers, hyphens, underscores only. No spaces. Must be unique. Reserved words blocked (admin, dashboard, api, login, signup, settings, support, help, about, onboarding, card, terms, privacy).|
|Tagline|Text (max 80 chars)|Yes|e.g. 'Running since 2019 \| Mumbai marathoner'|
|Athlete Type|Select (multi)|Yes|Runner, Trekker, Cyclist, Triathlete, Other|
|Profile Photo|Image upload|No|Displayed as circular avatar. Max 5MB. Accepted formats: JPEG, PNG, WebP. Client-side compression before upload.|
|Athlete Story|Textarea (max 500 chars)|No|Free text narrative about their journey|
|Location (City)|Text|No|e.g. 'Mumbai, India'|



## 6.2 Personal Records (PRs)

The most important data on the profile. Users enter their best times for standard distances.



|   |   |   |   |
|---|---|---|---|
|Distance|Format|Example|Validation|
|5K|MM:SS|22:14|10:00 to 59:59|
|10K|HH:MM:SS|00:48:30|00:25:00 to 01:59:59|
|Half Marathon (21.1K)|HH:MM:SS|01:52:00|00:55:00 to 03:59:59|
|Marathon (42.2K)|HH:MM:SS|03:45:00|01:59:00 to 08:00:00|
|Custom Distance|Text + Time|50K — 6:20:00|Free text label + time|



All PRs are optional individually. At least one PR entry is encouraged during onboarding but not enforced.



## 6.3 Highlight Activities

The 'proud moments' section. Users manually add their most meaningful activities — not every run.



|   |   |   |   |
|---|---|---|---|
|Field|Type|Required|Notes|
|Title|Text (max 60 chars)|Yes|e.g. 'First Hill Run — Ooty'|
|Distance / Elevation|Text|No|e.g. '18 km' or '1200 m elevation'|
|Date|Date picker|No|When this happened|
|Time / Duration|Text|No|e.g. '2h 45m'|
|Short Story|Textarea (max 200 chars)|No|e.g. 'Almost gave up halfway. Best decision not to.'|
|Image / Screenshot|Image upload (max 5MB)|No|Race medal, finisher photo, route screenshot. Accepted formats: JPEG, PNG, WebP. Client-side compression before upload.|



No limit on highlight activities. All features are available to everyone. Displayed as cards in a grid on the public profile.



## 6.4 Achievements

A simple, scannable list of races completed, medals earned, and milestones crossed.



|   |   |   |
|---|---|---|
|Field|Type|Notes|
|Achievement Title|Text|e.g. 'Mumbai Marathon 2024 Finisher'|
|Category|Select|Race, Medal, Milestone, Certificate|
|Year|Year picker|Optional|
|Badge Image|Image upload|Optional — medal photo or race bib. Same validation rules as other uploads: JPEG, PNG, WebP, max 5MB.|



## 6.5 Identity Stats

Auto-calculated or manually entered stats that add credibility to the profile at a glance.



|   |   |   |
|---|---|---|
|Stat|How Entered|Display Example|
|Total km run (lifetime)|Manual input|847 km|
|Years active|Auto from join / manual|Since 2019 (6 years)|
|Longest run ever|Manual input|42.2 km|
|Total races completed|Count of achievements|12 races|
|Favorite run time|Select|Early Morning|
|Running personality|User-selected from predefined list (MVP). Auto-assigned from data in Phase 2.|Early Morning Grinder|



## 6.6 Shareable Athlete Card (HERO FEATURE)

|   |
|---|
|Priority Note<br><br>This is the #1 growth driver of the product. It must be beautiful, fast to generate, and optimized for Instagram Stories (9:16) and WhatsApp (1:1 square). This ships on Day 1, not Phase 2.|



Card Contents:

- Athlete name + tagline

- Top 3 PRs prominently displayed

- Total races + total km

- Running personality badge

- ZealerProfile.app/{username} watermark




Technical requirements:

- Generated server-side as PNG using next/og (Satori) via Next.js built-in ImageResponse API

- Two formats: 1080x1080 (square) and 1080x1920 (stories)

- One-tap download from the profile dashboard

- Each download is generated from the latest saved profile data

- Rate limit: 10 card generations per hour per user



## 6.7 Athlete Search & Explore

A public-facing discovery system that lets anyone find and browse athlete profiles. No auth required.

### Explore Page (/explore)

A full directory of public athletes displayed as a responsive card grid (portfolio gallery style).

|   |   |
|---|---|
|Feature|Details|
|Layout|Responsive card grid. Each card shows: avatar, full name, tagline, athlete type badges, top PR, location.|
|Filters|Athlete type (runner, trekker, cyclist, triathlete, other) + Location (city text filter)|
|Sorting|Newest first using the latest saved profile state (`updated_at`)|
|Pagination|Infinite scroll — load more profiles as user scrolls|
|Accessibility|No auth required. Publicly accessible. SEO-indexed.|
|Privacy|Only profiles with `is_public = true`, `email_verified = true`, and `is_deleted = false` appear. Hidden, unverified, or deleted profiles are excluded.|

### Global Search Bar (Navbar)

A typeahead search input in the top navbar, accessible from every page.

|   |   |
|---|---|
|Feature|Details|
|Behavior|As user types, a dropdown shows matching public, verified profiles (name, username, location). Click to navigate to profile.|
|Search fields|Searches across: full_name, username, location, tagline|
|Min query length|2 characters before triggering search|
|Max results in dropdown|5 profiles shown in typeahead. 'See all results' link at bottom navigates to /explore?q=query|
|Debounce|300ms debounce on keystrokes to prevent excessive queries|
|No auth required|Available to all visitors, including logged-out users on public pages|



# 7. Core User Flows

## 7.1 Onboarding Flow (Target: Under 5 Minutes)

|   |   |   |   |
|---|---|---|---|
|Step|Screen|User Action|System Action|
|1|Landing page|Clicks 'Create My Profile'|Redirect to signup|
|2|Auth screen|Signs up with email or Google|Create account, redirect to setup|
|3|Setup — Step 1/3|Enters name, username, tagline, athlete type, location, favorite run time, personality badge|Validate username uniqueness in real time|
|4|Setup — Step 2/3|Enters their best PR(s)|Show live preview of card updating|
|5|Setup — Step 3/3|Adds 1–2 highlight activities with title, distance/elevation text, duration, story, and optional image|Optional; can skip|
|6|Profile ready screen|Sees finished profile + card preview|Prepare share/download actions from current saved profile data|
|7|Share prompt|Downloads card or copies profile link|Track first share event after consent|



## 7.2 Viral Growth Loop

|   |
|---|
|User creates profile  →  Gets beautiful card  →  Shares on WhatsApp / Instagram  →  Friends click link  →  Friends create their own profile  →  Repeat<br><br>Every shared card is a distribution event. The quality of the card directly determines viral coefficient.|



## 7.3 Retention Loop (Milestones)

Users return to ZealerProfile when they hit new milestones or set new PRs:

- User sets a goal on their profile: 'Training for Mumbai Marathon Oct 2025'

- Completes the race — returns to update profile and mark goal as achieved

- Profile shows verified milestone with date — they share the card again

- Each new PR or race is a natural trigger to revisit and share




# 8. Technical Architecture

## 8.1 Tech Stack

|   |   |   |
|---|---|---|
|Layer|Technology|Justification|
|Frontend|Next.js 16 + Tailwind CSS v4 + shadcn/ui|Latest framework with CSS-first Tailwind v4, SEO-friendly, accessible component library|
|Backend / Database|Neon (Serverless PostgreSQL)|Serverless, database branching for preview deployments, Vercel-native integration|
|ORM|Drizzle ORM|Type-safe queries, lightweight, excellent migration support|
|Image Card Generation|next/og (Satori)|Server-side PNG generation via Next.js built-in ImageResponse API, no extra dependencies|
|File Storage (photos)|Cloudflare R2 + next-s3-upload|10GB free tier, zero egress costs, S3-compatible, usage-based pricing ($0.015/GB-month). Upload DX via `next-s3-upload` (open source, presigned URL uploads direct to R2). Abstracted behind a `lib/storage/` service layer.|
|Hosting|Vercel|Zero-config Next.js deploy, free tier covers early traffic|
|Authentication|Clerk|Google + email auth, built-in email verification, password reset, polished UI|
|Analytics|PostHog (free tier)|Event tracking, privacy-friendly, tracks all defined success metrics|
|Domain|Custom (ZealerProfile.app)|Memorable, brand-appropriate|



|   |
|---|
|Cost at Launch<br><br>Total monthly infrastructure cost at MVP launch: ~$0. All services have free tiers that comfortably cover the first 500–1000 users.|



## 8.2 Database Schema (Core Tables — Drizzle ORM)

users

|   |   |   |
|---|---|---|
|Column|Type|Notes|
|id|UUID (PK)|Generated UUID|
|clerk_id|TEXT UNIQUE|Clerk user external ID (synced via webhook)|
|primary_email|TEXT|Primary email from Clerk webhook sync|
|email_verified|BOOLEAN DEFAULT false|Public visibility gate. Profiles stay hidden until true.|
|username|TEXT UNIQUE|3–20 chars, lowercase, alphanumeric + hyphens/underscores. Reserved words blocked.|
|full_name|TEXT|Nullable until onboarding completion if Clerk account has no name yet|
|tagline|TEXT|Max 80 chars|
|athlete_types|TEXT[]|Array: runner, trekker, cyclist, triathlete, other|
|story|TEXT|Max 500 chars|
|location|TEXT||
|avatar_url|TEXT|Cloudflare R2 URL|
|total_km|DECIMAL|Lifetime km (decimal for precision)|
|longest_run_km|DECIMAL||
|years_active_since|INTEGER|Year started|
|fav_run_time|TEXT|Morning, Evening, etc.|
|running_personality|TEXT|User-selected in MVP: 'Early Morning Grinder', 'Weekend Warrior', etc.|
|is_public|BOOLEAN DEFAULT true|Visibility toggle — profile hidden when false|
|is_deleted|BOOLEAN DEFAULT false|Soft delete flag|
|deleted_at|TIMESTAMPTZ|When soft-deleted. Data purged after 30 days.|
|created_at|TIMESTAMPTZ||
|updated_at|TIMESTAMPTZ||



personal_records

|   |   |   |
|---|---|---|
|Column|Type|Notes|
|id|UUID (PK)||
|user_id|UUID (FK)|References users.id, CASCADE DELETE|
|distance_label|TEXT|'5K', '10K', 'Half Marathon', 'Marathon', 'Custom'|
|distance_km|DECIMAL|Numeric value for sorting|
|time_seconds|INTEGER|Stored in seconds for easy calculation|
|time_display|TEXT|Formatted string: '1:52:00'|
|achieved_at|DATE|Optional|
|created_at|TIMESTAMPTZ||
|updated_at|TIMESTAMPTZ||



highlights

|   |   |   |
|---|---|---|
|Column|Type|Notes|
|id|UUID (PK)||
|user_id|UUID (FK)|References users.id, CASCADE DELETE|
|title|TEXT|Max 60 chars|
|distance_text|TEXT|e.g. '18 km'|
|duration_text|TEXT|e.g. '2h 45m'|
|story|TEXT|Max 200 chars|
|image_url|TEXT|Cloudflare R2 URL|
|highlight_date|DATE|Optional|
|sort_order|INTEGER|Display order|
|created_at|TIMESTAMPTZ||
|updated_at|TIMESTAMPTZ||



achievements

|   |   |   |
|---|---|---|
|Column|Type|Notes|
|id|UUID (PK)||
|user_id|UUID (FK)|References users.id, CASCADE DELETE|
|title|TEXT|e.g. 'Mumbai Marathon 2024 Finisher'|
|category|TEXT|'race', 'medal', 'milestone', 'certificate'|
|year|INTEGER|Optional|
|badge_url|TEXT|Optional — Cloudflare R2 URL|
|created_at|TIMESTAMPTZ||
|updated_at|TIMESTAMPTZ||



### Database Indexes

- `users.username` — UNIQUE index (public profile lookup)
- `users.clerk_id` — UNIQUE index (auth mapping)
- `users.updated_at` — explore ordering
- `personal_records.user_id` — for profile queries
- `highlights.user_id` — for profile queries
- `achievements.user_id` — for profile queries
- `users(full_name, username, location, tagline)` — full-text search index for explore/search
- `(is_public, is_deleted, email_verified, updated_at)` — public discovery filtering + ordering



# 9. Build Plan — 2-Week MVP Sprint

|   |
|---|
|Sprint Goal<br><br>Ship a working product where a user can create a profile, add PRs + highlights, view their public page, and download their athlete card — all in under 5 minutes.|



## Week 1 — Foundation + Core Features

### Phase 1: Project Setup (Days 1–2)

|   |   |   |
|---|---|---|
|Task|Details|Est. Hours|
|Project setup|Next.js 16, Tailwind CSS v4, shadcn/ui init, Vercel deploy|2h|
|Auth setup|Clerk integration — sign-up, sign-in, middleware, webhook for user sync|2h|
|Database setup|Neon PostgreSQL + Drizzle ORM — schema, migrations, indexes|2.5h|
|File storage setup|Cloudflare R2 bucket + `next-s3-upload` API route + CORS config + `lib/storage/` abstraction layer|1.5h|
|Analytics setup|PostHog initialization + identify calls|1h|
|Reserved username list|Utility with blocked words: admin, dashboard, api, login, signup, settings, etc.|0.5h|



### Phase 2: Onboarding + Profile (Days 3–5)

|   |   |   |
|---|---|---|
|Task|Details|Est. Hours|
|Onboarding Step 1/3|Name, username (real-time availability check), tagline, athlete type, avatar upload, location, favorite run time, personality selection|3h|
|Onboarding Step 2/3|PR input — 5K, 10K, HM, Marathon + custom. Live card preview updating.|2.5h|
|Onboarding Step 3/3|Highlight activities — title, distance/elevation text, duration, story, image upload. Can skip.|2h|
|Username validation|3–20 chars, alphanumeric + hyphens/underscores, reserved word check, uniqueness query|1h|
|Image upload pipeline|Client-side compression (max 5MB, JPEG/PNG/WebP), presigned URL upload to Cloudflare R2 via `next-s3-upload` for avatars, highlights, and achievement badges|2h|
|Email verification gate|Clerk handles verification; profile hidden until email confirmed|0.5h|



## Week 2 — Public Profile + Card + Polish

### Phase 3: Public Profile + Dashboard (Days 6–8)

|   |   |   |
|---|---|---|
|Task|Details|Est. Hours|
|Public profile page|/:username route — full layout with all sections, mobile-first design|4h|
|Profile page SEO|Dynamic OG meta tags, title, description per user. Indexed by default.|1h|
|Profile dashboard|Edit all sections from one page, live preview link, copy profile URL|2.5h|
|Achievements CRUD|Add/remove achievements with categories (race, medal, milestone, certificate) + optional badge image|1.5h|
|Identity stats section|Total km, years active, longest run, favorite run time, personality badge (manual selection)|1.5h|
|Visibility toggle|is_public toggle in dashboard settings — profile hidden when off|0.5h|
|Empty states|Placeholder prompts for each section: 'Add your first PR!', etc.|0.5h|
|Explore page|/explore route — card grid, `q` + athlete type + location filters, infinite scroll, SEO|3h|
|Global search bar|Typeahead navbar search — 300ms debounce, top 5 results dropdown, 'See all' link, available to logged-in and logged-out visitors|2h|
|Search API|Server-side search endpoint — full-text query across name/username/location/tagline, only public verified profiles|1.5h|



### Phase 4: Athlete Card + Sharing (Days 9–10)

|   |   |   |
|---|---|---|
|Task|Details|Est. Hours|
|Card generator|next/og (Satori) — 1080x1080 (square) + 1080x1920 (stories)|3h|
|Card design|Name, tagline, top 3 PRs, total races, total km, personality badge, watermark URL|2h|
|Card download|One-tap PNG download from dashboard|0.5h|
|Card rate limiting|10 generations per hour per user|0.5h|
|PostHog events|Track: signup, onboarding_complete, card_download, profile_view, card_share — client-side and consent-gated|1h|



### Phase 5: Landing Page + Legal + Polish (Days 11–14)

|   |   |   |
|---|---|---|
|Task|Details|Est. Hours|
|Landing page|Hero section, value prop, example profile card, signup CTA — mobile-first|3h|
|Terms of Service page|Placeholder legal page at /terms|0.5h|
|Privacy Policy page|Placeholder legal page at /privacy|0.5h|
|Cookie consent banner|GDPR-compliant banner for PostHog + Clerk cookies|1h|
|Account settings page|Username change (old URL breaks), profile visibility toggle, delete account|2h|
|Account deletion flow|Soft delete — mark as deleted, hide profile, purge data after 30 days|1h|
|Content validation|Text length checks, image format/size validation (server-side + client-side)|1h|
|Mobile responsiveness QA|All pages tested on 375px, 390px, 414px viewports|2h|
|Error states + 404|404 page for invalid usernames, error boundaries, loading states|1h|
|Production deploy|Vercel + custom domain + environment variables|0.5h|



# 10. Pages & Routes

|   |   |   |   |
|---|---|---|---|
|Route|Page|Auth Required|Description|
|/|Landing Page|No|Marketing page with hero, features, example profile, signup CTA|
|/sign-up|Sign Up|No|Clerk sign-up (email + Google OAuth)|
|/sign-in|Sign In|No|Clerk sign-in|
|/onboarding|Onboarding Wizard|Yes|3-step profile setup (profile → PRs → highlights)|
|/onboarding/complete|Profile Ready|Yes|Completion screen with share, download, and copy-link actions|
|/dashboard|Profile Dashboard|Yes|Edit all profile sections, preview card, copy link|
|/dashboard/card|Card Preview|Yes|Preview + download athlete card (square + stories)|
|/dashboard/settings|Account Settings|Yes|Visibility toggle, username change, delete account|
|/explore|Athlete Directory|No|Public explore page — card grid with search, filters (`q`, athlete type, location), infinite scroll|
|/:username|Public Profile|No|Public athlete profile page. Visible only when `is_public=true`, `email_verified=true`, and not deleted|
|/terms|Terms of Service|No|Legal — required for Google OAuth + trust|
|/privacy|Privacy Policy|No|Legal — required for GDPR compliance|
|not-found.tsx|Framework Not Found UI|No|Clean not-found experience handled by Next.js|



# 11. Phase 2 Features (Post-Launch)

These features are NOT in MVP scope. Build them only after validating with real users.



|   |   |   |   |
|---|---|---|---|
|Feature|Description|Priority|Builds On|
|Running Personality Badge|Auto-assign personality: 'Early Morning Grinder', 'Weekend Warrior', 'Hill Lover' based on profile data. MVP includes manual selection; Phase 2 adds auto-assignment from data patterns.|High|Identity stats data|
|Goal Tracker|Set a goal race, mark as completed, share achievement card|High|Retention loop driver|
|Narrative Mode (AI)|Auto-generate 'Your journey as a runner' from profile data using Claude API|Medium|All profile data|
|Profile Themes|Additional color themes and layouts for profile customization|Medium|Personalization|
|PDF Export|Export profile as a clean PDF for race registrations or coaching apps|Medium|Utility|
|Custom Domain|Athletes can use nishanth.run pointing to their profile|Low|Personalization|
|Compare Profiles|'You vs your friend' head-to-head PR comparison|Low|Virality|
|Strava Import (optional)|Optional one-time import of PRs from Strava — not a sync, just a helper|Low|Reduces manual entry friction|



# 12. Pricing Philosophy

All features are free for everyone. There are no paid tiers, no premium features, and no usage limits. The goal is to build the best possible running profile platform and grow a community of athletes — not to monetize.

Infrastructure costs at launch are ~$0 (all services have generous free tiers). If the project grows beyond free tier limits, sustainability options will be evaluated then — but no pricing is planned or built into the MVP.



# 13. Risks & Mitigations

|   |   |   |   |
|---|---|---|---|
|Risk|Severity|Likelihood|Mitigation|
|Users don't want to manually enter data|High|Medium|Onboarding in 3 steps. Show live card preview as they type — make the reward immediate and visible.|
|Users create profile once and never return|High|High|Add Goals/Milestones feature in Phase 2. Every new PR or race completion = reason to update + reshare.|
|Card quality isn't good enough to share|High|Medium|Invest design time in the card first. Use real user data examples to test. Card must look better than a Strava screenshot.|
|Strava adds a 'portfolio' feature|Medium|Low|Speed is the moat. Strava won't ship this for years. Own the niche before they notice.|
|Low organic traffic to public profiles|Medium|Medium|SEO-optimize public profile pages. Target keywords like 'marathon finisher profile', 'runner portfolio'.|
|Username squatting / spam accounts|Low|Medium|Email verification required before profile goes public. Reserved username list blocks common words. Rate limit signups.|



# 14. Success Metrics

## 14.1 Launch Week (Day 1–7)

- 50+ profiles created

- 20+ athlete cards downloaded

- Card share rate > 30% of users who download it

- Zero critical bugs on public profile pages




## 14.2 Month 1

- 200+ total profiles created

- 40%+ profiles have at least 1 highlight activity (engagement signal)

- Organic signups from shared cards > 20 (viral loop validation)

- Average time to complete onboarding < 5 minutes




## 14.3 Month 3

- 500+ active profiles (at least 1 update in past 30 days)

- Net Promoter Score > 40 (survey 50 users)

- < 2% of profiles remain empty after 48 hours




## 14.4 Kill Criteria

|   |
|---|
|When to stop<br><br>If after 60 days: fewer than 100 profiles created, fewer than 15% of users download their card, or zero organic signups from shared links — the core loop is broken and the product needs a fundamental pivot before further development.|



# 15. Go-to-Market Launch Plan

## 15.1 Pre-Launch (During Build)

- Create the product's own ZealerProfile as a demo account

- Build 3–5 demo profiles with real-looking data for the landing page

- Write a brief launch post for running communities




## 15.2 Launch Channels

|   |   |   |
|---|---|---|
|Channel|Action|Expected Reach|
|Reddit r/running|Post 'I built a free portfolio page for runners' with your own profile as demo|500–2000 views|
|Reddit r/Entrepreneur / r/SideProject|Launch post with build story (2-week build)|200–800 views|
|Local running WhatsApp groups|Share your own profile card — 'made this for runners like us'|20–100 direct signups|
|IndieHackers|Launch post with revenue and user milestones|100–500 views|
|Twitter/X #buildinpublic|Document the 2-week build in real time|Ongoing audience building|
|ProductHunt|Launch on PH in Week 2 after any launch bugs are fixed|300–1000 views|



# 16. Resolved Decisions

All open questions from v1.0 have been resolved. Decisions are final and incorporated throughout the document.

|   |   |   |
|---|---|---|
|#|Question|Decision|
|1|Should username changes be allowed after creation?|**Yes.** Users can change username. Old URL breaks (no redirect). Simpler than maintaining URL history.|
|2|What is the image file size limit for profile photos and highlight images?|**5 MB max.** Accepted formats: JPEG, PNG, WebP. Client-side compression before upload.|
|3|Should public profiles be indexed by search engines by default, or opt-in?|**Indexed by default.** Drives organic discovery. Aligns with 'public identity' positioning.|
|4|Should we support profile deactivation (hide from public) without deletion?|**Yes.** `is_public` visibility toggle in account settings. Profile returns 404 when hidden.|
|5|What rate limits apply to athlete card generation to prevent abuse?|**10 per hour per user.** Generous for normal use, prevents hammering.|
|6|Do we need email verification before a profile becomes publicly visible?|**Yes.** Clerk handles email verification. Profile hidden until email confirmed.|



## 16.1 Additional Decisions Made (v2.0)

|   |   |   |
|---|---|---|
|#|Decision Area|Resolution|
|7|Feature limits|**No limits** — all features (highlights, achievements, card themes) available to everyone for free|
|8|MVP timeline|**2 weeks** (resolved conflict between header and Section 9)|
|9|Next.js version|**Next.js 16** (latest stable)|
|10|Running personality badge|**Manual selection in MVP** from predefined list. Auto-assignment moves to Phase 2.|
|11|Username validation rules|**3–20 chars, lowercase alphanumeric + hyphens/underscores. Reserved words blocked.**|
|12|Reserved usernames|**Blocked list:** admin, dashboard, api, login, signup, settings, support, help, about, onboarding, card, terms, privacy|
|13|Image formats|**JPEG, PNG, WebP** accepted|
|14|Image compression|**Client-side compression** before upload to save storage and bandwidth|
|15|Legal pages|**Included in MVP** — Terms of Service + Privacy Policy (required for Google OAuth)|
|16|Account deletion|**Soft delete with 30-day grace period.** Data purged after 30 days. GDPR-friendly.|
|17|Analytics|**PostHog (free tier)** — tracks all success metrics from Section 14|
|18|Empty profile states|**Placeholder prompts** — 'Add your first PR!', etc. in empty sections|
|19|Auth provider|**Clerk** — better DX, built-in email verification, password reset, Google OAuth|
|20|Database|**Neon (Serverless PostgreSQL)** — branching for preview deployments, Vercel-native|
|21|ORM|**Drizzle ORM** — type-safe, lightweight, excellent migration support|
|22|UI components|**shadcn/ui** — accessible, customizable, Tailwind-native|
|23|File storage|**Cloudflare R2 + next-s3-upload** — 10GB free, zero egress, usage-based ($0.015/GB-month). `next-s3-upload` for presigned URL upload DX. Abstracted behind `lib/storage/` service layer.|
|24|Card generation|**next/og (Satori)** — server-side, built into Next.js, consistent rendering|
|25|Design approach|**Mobile-first** — target audience primarily shares/views on phones|
|26|Environments|**Production + Preview** — Vercel auto-previews + Neon database branching|
|27|Content moderation|**Basic validation** — text length checks, image format/size validation|
|28|Cookie consent|**Included in MVP** — GDPR-compliant banner for PostHog + Clerk cookies|
|29|Search/explore scope|**Full directory at /explore** with card grid + global navbar typeahead search|
|30|Explore page filters|**Athlete type + Location** filters|
|31|Explore sorting|**Newest first** using `updated_at` so recent profile edits surface immediately|
|32|Explore pagination|**Infinite scroll**|
|33|Search privacy|**Only public, verified profiles** (`is_public=true`, `email_verified=true`, `is_deleted=false`) appear in search/explore|
|34|Search auth|**No auth required** — publicly accessible to all visitors|
|35|Navbar search behavior|**Typeahead dropdown** with live results (top 5), 'See all' link to /explore|



# 17. Appendix — Running Personality Badges

MVP: Users manually select one badge from the list below during onboarding or from dashboard settings.

Phase 2: Auto-assigned based on profile data patterns (rules below).



|   |   |
|---|---|
|Badge|Auto-Assign Criteria (Phase 2)|
|Early Morning Grinder|Favorite run time = Morning|
|Weekend Warrior|Most highlights are on weekends|
|Marathon Machine|Has completed 3+ marathon distances|
|Hill Lover|Highlight activities contain 'hill', 'mountain', 'trail', or elevation data|
|Speed Chaser|5K PR under 20 minutes or 10K under 40 minutes|
|Ultra Soul|Has any custom distance > 50K|
|Comeback Kid|Story contains keywords: 'injury', 'return', 'comeback', 'again'|
|Consistent|Years active > 3, with regular highlights across years|



# 18. Security & Compliance

|   |   |
|---|---|
|Area|Implementation|
|Authentication|Clerk middleware protecting all /dashboard, /onboarding routes|
|Public visibility|Only profiles with `is_public = true`, `email_verified = true`, and `is_deleted = false` appear on `/:username`, search, or explore|
|Input sanitization|All text fields sanitized against XSS on both client and server|
|Image validation|Format (JPEG/PNG/WebP) + size (≤5MB) validated client-side and server-side|
|Username validation|Length, character set, reserved words — validated on client and server|
|Rate limiting|Card generation: 10/hour/user|
|HTTPS|Enforced by Vercel (default)|
|Foreign keys|CASCADE DELETE on all child tables — no orphaned data|
|Soft delete|30-day grace period before data purge — reversible, GDPR-friendly|
|Cookie consent|GDPR-compliant banner for PostHog + Clerk cookies|
|Legal pages|Terms of Service + Privacy Policy at /terms and /privacy|



# 19. MVP Scope Boundaries

## 19.1 In Scope (MVP)

- Profile creation + editing (all fields from Section 6.1)
- Personal Records CRUD (Section 6.2)
- Highlights CRUD (Section 6.3)
- Achievements CRUD (Section 6.4)
- Identity stats — manual input + basic auto-calc (Section 6.5)
- Running personality badge — manual selection from predefined list
- Shareable athlete card — square + stories formats (Section 6.6)
- Public profile page with SEO (Section 6.1)
- Onboarding wizard — 3 steps (Section 7.1)
- Profile dashboard with live preview
- Account settings — visibility toggle, username change, delete account
- Landing page with demo profile
- Legal pages — Terms of Service, Privacy Policy
- Cookie consent banner
- PostHog analytics — all success metrics from Section 14
- Clerk auth — email + Google OAuth + email verification
- Athlete search & explore — public directory with card grid, filters, infinite scroll, navbar typeahead (Section 6.7)



## 19.2 Out of Scope (Phase 2+)

- Auto-assigned running personality (AI/rule-based)
- Goal tracker
- AI narrative mode (Claude API)
- Profile themes (premium)
- PDF export
- Custom domains (nishanth.run)
- Profile comparison (head-to-head)
- Strava import
- Payments / monetization
- Social features / following
- Activity feeds



# 20. Verification Checklist

Before launch, verify each item passes:

|   |   |
|---|---|
|#|Verification Step|
|1|Sign up with email → verify email → complete onboarding → profile visible at /:username|
|2|Sign up with Google → complete onboarding → profile visible (Google account should already sync as verified)|
|3|Complete full onboarding in under 5 minutes (time it)|
|4|Public profile renders all sections correctly with data|
|5|Empty profile shows placeholder prompts, not blank sections|
|6|Card downloads in both formats (1080x1080 + 1080x1920) with correct content|
|7|Rate limit blocks >10 card downloads in an hour|
|8|Toggling is_public OFF → profile returns 404 for public visitors|
|9|Username change → old URL returns 404, new URL works|
|10|Account deletion → profile disappears immediately, data purged after 30 days|
|11|Image upload works for JPEG, PNG, WebP ≤5MB; rejects files >5MB or wrong format|
|12|Reserved usernames (admin, dashboard, api) are rejected at signup|
|13|OG meta tags render correctly when profile URL is shared on social|
|14|All pages responsive and usable on mobile (375px, 390px, 414px)|
|15|PostHog tracks: signup, onboarding_complete, card_download, profile_view|
|16|Cookie consent banner appears on first visit|
|17|Terms of Service and Privacy Policy pages load correctly|
|18|404 page displays for non-existent usernames|
|19|/explore page loads with card grid of public profiles, infinite scroll works|
|20|Explore filters (athlete type, location) correctly filter results|
|21|Navbar typeahead search returns matching profiles on 2+ characters, debounced, including for logged-out visitors|
|22|Private or unverified profiles do not appear in search or explore|



|   |
|---|
|Ready to Build<br><br>This document contains everything needed to ship the MVP.<br><br>All decisions are finalized. All gaps are addressed. Start with Phase 1. Ship in 2 weeks. Validate with real runners.|


**
