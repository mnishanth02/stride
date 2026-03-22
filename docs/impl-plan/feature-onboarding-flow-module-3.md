---
goal: "Module 3: Onboarding Flow — 3-step wizard for profile setup, personal records, and highlight activities with per-step persistence, resume support, and completion screen"
version: 1.0
date_created: 2026-03-22
last_updated: 2026-03-22
owner: ZealerProfile
tags: [feature, onboarding, forms, module-3]
---

# Introduction

This document is the detailed implementation plan for **Module 3: Onboarding Flow**. It builds on the auth infrastructure delivered by Module 2 (Clerk hooks, custom auth pages, dashboard onboarding gate, username availability API, webhook handler) and the complete UI component library from Module 1 to deliver the user-facing onboarding wizard.

The onboarding flow is a **3-step wizard** at `/onboarding` that collects:

1. **Profile Basics** — name, username, tagline, athlete types, avatar, location, personality
2. **Personal Records** — best times for 5K/10K/Half Marathon/Marathon + optional custom distance
3. **Highlight Activities** — 1–2 proudest running moments with optional images (skippable)

The complete flow must be achievable **in under 5 minutes** (Product Plan §7.1). Each step persists data to the database immediately on "Next", enabling users to resume from where they left off if they leave mid-flow. A completion screen at `/onboarding/complete` shows the finished profile preview, a live card preview, and share/download actions.

## User Decisions (Captured 2026-03-22)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Onboarding navbar | **Minimal header** — logo + step indicator only | Reduces distraction, focuses user on the wizard |
| Save strategy | **Per-step save** — each "Next" persists to DB | Resilient to user leaving mid-flow; enables resume |
| Custom distance PR | **Standard 4 + custom entry** | Differentiator for ultrarunners and non-standard distances |

## Live Repo Audit — 2026-03-22

| Area | Status | Details |
|------|--------|---------|
| Onboarding layout (`apps/web/app/onboarding/layout.tsx`) | ⚠️ Placeholder | Pass-through `<>{children}</>` — replacement needed |
| Onboarding page (`apps/web/app/onboarding/page.tsx`) | ⚠️ Placeholder | Renders "Coming in Module 3" text — replacement needed |
| Onboarding complete route (`apps/web/app/onboarding/complete/`) | ❌ Does not exist | Must be created |
| Onboarding API routes (`apps/web/app/api/onboarding/`) | ❌ Does not exist | Must be created (profile, records, highlights, complete, progress) |
| Onboarding components (`apps/web/components/onboarding/`) | ❌ Does not exist | Must be created (step-indicator, step forms, card-preview, completion-view) |
| Onboarding hooks (`apps/web/hooks/`) | ⚠️ Empty | Directory exists with `.gitkeep` only — hooks must be created (use-onboarding, use-username-check) |
| Dashboard onboarding gate (`apps/web/app/dashboard/layout.tsx`) | ⚠️ Commented out | `onboardingCompleted` redirect is commented out with TODO: "Re-enable once /onboarding page can set onboardingCompleted = true" — Module 3 must re-enable this gate |
| Auth helpers (`apps/web/lib/auth.ts`) | ✅ Implemented | `getCurrentUser()` and `requireCurrentUser()` both present and functional |
| Username check API (`apps/web/app/api/users/check-username/route.ts`) | ✅ Implemented | Format + reserved + DB uniqueness checks — ready for consumption |
| Upload API (`apps/web/app/api/upload/route.ts`) | ✅ Implemented | Presigned R2 upload signing — auth-protected, validates MIME + size |
| Storage client (`packages/storage/src/client.ts`) | ✅ Implemented | `requestSignedUpload()` + `uploadFile()` for browser-to-R2 uploads |
| Validation schemas (`packages/ui/src/lib/validations.ts`) | ✅ Implemented | All required schemas present: `usernameSchema`, `fullNameSchema`, `taglineSchema`, `locationSchema`, `athleteTypesSchema`, `favRunTimeSchema`, `runningPersonalitySchema`, `highlightTitleSchema`, `highlightStorySchema`, `imageFileSchema`, `PR_RANGES`, `validatePRTime()`, `parseMMSS()`, `parseHHMMSS()` |
| Animation foundation (`packages/ui/src/lib/animations.ts`) | ✅ Implemented | `pageVariants`, `staggerContainerVariants`, `fadeInVariants`, `slideUpVariants` |
| UI components (`packages/ui/src/components/`) | ✅ Implemented | 27 components including Input, Button, Card, MultiSelect, FileUpload, TimeInput, TextareaWithCounter, YearPicker, DatePicker, Progress, Badge, Select, Separator, Skeleton |
| react-hook-form + resolvers | ✅ Installed | `react-hook-form@7.71.2` + `@hookform/resolvers@5.2.2` in `apps/web/package.json` |
| React Query | ✅ Installed | `@tanstack/react-query@5.80.7` with `QueryClientProvider` configured |
| Database schema | ✅ Implemented | `users` (with `onboardingCompleted`, all profile fields), `personal_records`, `highlights` tables with all required columns and indexes |
| Route protection (`apps/web/proxy.ts`) | ✅ Implemented | Clerk middleware protects `/onboarding(.*)` — auth required |

## Critical Handoff Notes

- **Dashboard onboarding gate is commented out.** The `apps/web/app/dashboard/layout.tsx` has the `onboardingCompleted` redirect wrapped in a `// TODO` comment. Module 3 must re-enable this gate as one of its final tasks, once the `/api/onboarding/complete` endpoint exists to set `onboardingCompleted = true`.
- **The root layout currently renders both the shared providers and `<Navbar />`.** To achieve the minimal onboarding header (logo + step indicator only, no full navbar), the recommended approach is a **route-group restructure that keeps all shared providers at the root** while moving only the navbar/main-shell concern into a `(main)` layout. See Phase 1, TASK-001 for details.
- **Keep all API routes at `apps/web/app/api/**`.** The onboarding API routes should be added under the existing root `app/api/` tree, not moved into a route group. Route groups are only needed for differing UI shells.
- **The `usernameSchema` in `packages/ui/src/lib/validations.ts` includes reserved-name checking via `.refine()`.** The check-username API route relies on this shared schema, so onboarding forms can reuse the same validation with confidence that client and server agree on rules.
- **`FileUpload` performs client-side Canvas API compression** targeting ≤1MB from inputs ≤5MB and exposes `value`, `onChange`, `onError`, `previewUrl`, and `shape` props. The upload signing route at `/api/upload` enforces server-side MIME + size validation. Module 3 should rely on this existing pipeline for all avatar and highlight image uploads.
- **Shared form controls have real API constraints that the implementation must follow.** `TimeInput` accepts `format="mm:ss" | "hh:mm:ss"` (lowercase), non-native inputs (`FileUpload`, `MultiSelect`, `Select`, `DatePicker`) should be wired through `react-hook-form` `Controller`, and the current shared `DatePicker` does not yet expose a `maxDate` prop.
- **Module 3 does not own the public profile route.** Until Module 5 ships `/:username`, the completion screen must not expose enabled actions that knowingly point to a missing page. See REQ-009 and Phase 6 for the chosen behavior.

---

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: A new authenticated user is directed to `/onboarding` after sign-up (via Clerk `finalize()` redirect) and prevented from accessing `/dashboard` until `onboardingCompleted = true` (via dashboard layout server-side redirect).
- **REQ-002**: The onboarding flow consists of **3 sequential steps**: (1) Profile Basics, (2) Personal Records, (3) Highlight Activities. Steps must be completed in order. Step 3 is skippable.
- **REQ-003**: Each step persists its data to the database on "Next" click. The user can resume from where they left off if they close the browser or navigate away.
- **REQ-004**: Step 1 fields — `fullName` (required, max 100), `username` (required, 3–20 chars, real-time availability check), `tagline` (required, max 80), `athleteTypes` (required, ≥1 from predefined list), `avatarUrl` (optional, image upload), `location` (optional, max 100), `favRunTime` (optional, select), `runningPersonality` (optional, select).
- **REQ-005**: Step 2 fields — PR entries for 5K (MM:SS, 10:00–59:59), 10K (HH:MM:SS, 00:25:00–01:59:59), Half Marathon (HH:MM:SS, 00:55:00–03:59:59), Marathon (HH:MM:SS, 01:59:00–08:00:00), and Custom distance (text label + free-form time). All optional individually. At least one PR encouraged but not enforced.
- **REQ-006**: Step 3 fields — up to 2 highlights, each with `title` (required, max 60), `distanceText` (optional), `durationText` (optional), `story` (optional, max 200), `highlightDate` (optional, max=today), `imageUrl` (optional, image upload). Entire step skippable.
- **REQ-007**: Time inputs must use masked entry (`@maskito/react`): `mm:ss` pattern for 5K, `hh:mm:ss` pattern for all others, matching the existing `TimeInput` component API. Font must be `font-mono` (JetBrains Mono).
- **REQ-008**: Step 2 must display a **live card preview** that updates as the user enters PRs. This is a CSS/HTML preview only — actual PNG card generation belongs to Module 6.
- **REQ-009**: A **completion screen** at `/onboarding/complete` shows the finished profile preview, card preview, and dashboard/share actions. Because Module 5 owns the public profile route, "View My Profile" and "Copy Profile Link" must render in a disabled/coming-soon state unless that route is already implemented before launch. The `onboarding_complete` PostHog event fires on mount.
- **REQ-010**: The entire onboarding flow must be completable **in under 5 minutes** with typical data entry (Product Plan §7.1).
- **REQ-011**: Username validation must happen **in real-time** (debounced 300ms) showing available/taken/invalid state inline below the input. Uses the existing `GET /api/users/check-username` endpoint.
- **REQ-012**: All pages must render correctly in **dark mode** and at **mobile viewports** (375px, 390px, 414px) — mobile-first responsive design.
- **REQ-013**: The onboarding layout must display a **minimal header** (logo + step indicator only) — not the full global navbar. Users should be focused on completing their profile, not distracted by search/navigation.

### Security Requirements

- **SEC-001**: All onboarding API routes must verify authentication via `auth()` from `@clerk/nextjs/server`. Return 401 for unauthenticated requests.
- **SEC-002**: Server-side validation must mirror client-side Zod schemas. Never trust client-only validation. The `usernameSchema` from `@workspace/ui/lib/validations` must be used on both sides.
- **SEC-003**: Username uniqueness must be verified server-side in a DB query; client-side checks are advisory only (race condition possible between check and save).
- **SEC-004**: Image uploads must be validated server-side for MIME type (JPEG/PNG/WebP) and size (≤5MB) by the existing `/api/upload` route. The client `FileUpload` component provides first-line defense with format + size validation and compression.
- **SEC-005**: All text fields must be sanitized against XSS. Since all values are rendered via React JSX (not `dangerouslySetInnerHTML`), React's built-in escaping handles this. Server-side Zod string validation covers length limits.
- **SEC-006**: The onboarding API routes must only allow the authenticated user to modify their own data. The `auth().userId → users.clerkId` mapping ensures row-level authorization.

### Constraints

- **CON-001**: Use `pnpm` exclusively for package management. Install from repo root with `pnpm --filter ...`.
- **CON-002**: Use Biome for formatting and linting. Do not introduce ESLint or Prettier.
- **CON-003**: Use `@workspace/*` imports for shared packages. Do not use deep relative imports across package boundaries.
- **CON-004**: Use `proxy.ts` for route protection (Next.js 16 pattern). Do not introduce `middleware.ts`.
- **CON-005**: Module 3 must not modify the database schema in `packages/database/src/schema/`. The schema is already complete for all onboarding fields.
- **CON-006**: Module 3 must not implement the actual PNG athlete card generation (that is Module 6). The live card preview in Step 2 is a CSS/HTML approximation only.
- **CON-007**: Module 3 must not build the public profile page (`/:username`). The completion screen may reference this future destination, but any CTA that depends on that route must remain disabled/coming-soon until Module 5 ships.
- **CON-008**: The "Download Card" button on the completion screen must be shown as a **disabled/coming-soon** state since Module 6 hasn't been built yet.
- **CON-009**: The global navbar is rendered by `apps/web/app/layout.tsx`. To achieve the minimal onboarding header, use a route-group restructure where `(onboarding)` has its own root layout that does not render `<Navbar />`.
- **CON-010**: Module 3 must re-enable the commented-out onboarding gate in `apps/web/app/dashboard/layout.tsx` as a final task.

### Guidelines

- **GUD-001**: Use `react-hook-form` + `zodResolver` for all form state management. Never use raw `useState` for form fields — this is an enforced project convention from `docs/core-plan/design-system.md`.
- **GUD-002**: Use existing shared components from `@workspace/ui/components/*` rather than building custom form inputs. The `TimeInput`, `FileUpload`, `MultiSelect`, `TextareaWithCounter`, `DatePicker`, `YearPicker`, and `Select` components are purpose-built for this flow.
- **GUD-003**: Use the shared validation schemas and constants from `@workspace/ui/lib/validations` for all client-side and server-side validation. The canonical `PR_RANGES`, `ATHLETE_TYPES`, `FAV_RUN_TIMES`, `RUNNING_PERSONALITIES`, and `TEXT_LIMITS` constants live there.
- **GUD-004**: Use the `cn()` utility from `@workspace/ui/lib/utils` for conditional class merging. Use CVA via `class-variance-authority` when a component needs multiple variants.
- **GUD-005**: Import icons from `@workspace/ui/lib/icons` (centralized icon module), not directly from `@phosphor-icons/react`.
- **GUD-006**: Use shared Motion animation variants from `@workspace/ui/lib/animations` for step transitions and entrance animations. Do not define ad-hoc animation values inline.
- **GUD-007**: Use `Sonner` toasts (via `toast()` from `sonner`) for success/error feedback. The `<Toaster />` is already mounted in the root layout.
- **GUD-008**: Use `@tanstack/react-query` for the username availability check hook. The `QueryClientProvider` is already configured in `apps/web/components/query-provider.tsx`.
- **GUD-009**: For image uploads, use `uploadFile()` from `@workspace/storage/client` which handles the presigned URL flow via `/api/upload`. Do not call R2/S3 directly.
- **GUD-010**: For non-native controls (`FileUpload`, `MultiSelect`, `Select`, `DatePicker`), use `react-hook-form` `Controller` instead of `register()` so value and validation state stay in sync.
- **GUD-011**: Do not hardcode production origins in client actions. Any copied/shared profile URL must be derived from runtime origin or a verified environment variable, and disabled entirely if the destination route does not exist yet.

### Patterns

- **PAT-001**: **Per-step form pattern**: Each step renders its own `useForm()` instance with a step-specific Zod schema. On "Next", the form validates, calls the corresponding API route to persist, and advances to the next step via URL search params.
- **PAT-002**: **Step state via URL search params**: The current step is tracked as `?step=1|2|3` in the URL. This is refresh-resilient, supports browser back/forward navigation, and is deep-linkable for testing. The `use-onboarding` hook abstracts this pattern, using `router.push()` for user-driven Next/Back transitions and `router.replace()` only for automatic normalization/resume redirects.
- **PAT-003**: **Resume detection pattern**: On onboarding page mount, call `GET /api/onboarding/progress` to determine where the user left off. The API checks: are required Step 1 fields complete (`fullName`, `username`, `tagline`, `athleteTypes`) → otherwise step 1; has PRs → step 3; `onboardingCompleted === true` → redirect to `/dashboard`; otherwise step 2. Pre-populate forms with existing data and prevent manual URL edits from skipping ahead of saved progress.
- **PAT-004**: **Replace strategy for child records**: When saving PRs or highlights during onboarding, delete existing records for the user and insert the new set. This is simpler than diffing for the onboarding context where the user is building their initial data set. Dashboard CRUD (Module 4) will use individual add/edit/delete operations.
- **PAT-005**: **Debounced availability check**: Username input triggers a query to `/api/users/check-username` after 300ms of inactivity. The hook disables the query until the debounce timer fires and the input passes client-side Zod validation. If the username matches the user's existing username (re-entering onboarding), the check is skipped and marked as available.
- **PAT-006**: **Webhook race condition handling**: If `getCurrentUser()` returns `null` on the onboarding layout (Clerk session exists but webhook hasn't created the DB row yet), render a client fallback inside the onboarding shell that polls every 2 seconds for up to 3 retries. After max retries, display an error state with a "Try again" button.

---

## 2. Implementation Steps

### Phase 1 — Onboarding Layout & Navbar Suppression

- GOAL-001: Replace the placeholder onboarding layout with a proper wizard shell that uses a minimal header (logo + step indicator) instead of the global navbar. Establish the step infrastructure with URL-param-based navigation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | **Route group restructure for navbar suppression.** Keep `apps/web/app/layout.tsx` as the shared root containing the existing providers (`ClerkProvider`, `QueryProvider`, `ThemeProvider`, `TooltipProvider`, `PostHogProvider`, `Toaster`) plus `<html>` / `<body>` / metadata. Create `apps/web/app/(main)/layout.tsx` that renders `<Navbar />` and the `<main>` wrapper used by navbar routes. Create `apps/web/app/(onboarding)/layout.tsx` for onboarding routes that renders a minimal shell with a lightweight header (logo link to `/` and a reusable theme toggle if extracted from the navbar, otherwise logo-only header) but **no `<Navbar />`**. Move `apps/web/app/page.tsx`, `apps/web/app/dashboard/`, and `apps/web/app/onboarding/` into the appropriate route groups; move auth routes only if a separate shell is explicitly desired. **Do not move `apps/web/app/api/**`.** Verify the route structure still produces `/onboarding` and `/onboarding/complete` public paths (route groups don't affect URL). | | |
| TASK-002 | **Onboarding route layout** (`apps/web/app/(onboarding)/onboarding/layout.tsx`). Server component. Calls `getCurrentUser()`: if user exists and `onboardingCompleted === true`, call `redirect('/dashboard')`. If user is `null`, delegate to the webhook-race handling in TASK-025. Renders `{children}` inside a centered max-width container (`max-w-2xl mx-auto px-4 py-8`). | | |
| TASK-003 | **Step indicator component** (`apps/web/components/onboarding/step-indicator.tsx`). Client component. Props: `currentStep: 1 | 2 | 3`. Renders a 3-step horizontal progress indicator with labels: "Profile" (step 1), "Records" (step 2), "Highlights" (step 3). Each step shows a numbered circle (completed = filled lime-500 with checkmark icon, current = outline lime-500, upcoming = muted). Uses the `Progress` component from `@workspace/ui/components/progress` for the overall percentage bar above the steps (33% / 67% / 100%). Mobile-compact styling at 375px. Uses `Icons.check` from `@workspace/ui/lib/icons` for completed step indicator. Accessible: `role="list"` with `aria-current="step"` on the active step. | | |
| TASK-004 | **Step navigation hook** (`apps/web/hooks/use-onboarding.ts`). Client hook. Reads `step` from `useSearchParams()` (defaults to `1` if missing or invalid). Exposes: `currentStep: 1 | 2 | 3`, `goToStep(step: number, options?: { replace?: boolean })`, `nextStep()`, `prevStep()`. Uses `useRouter().push()` for explicit user-driven step changes so browser back/forward continues to work, and `useRouter().replace()` only for normalization or automatic resume redirects. Validates that step is 1, 2, or 3 and clamps invalid values. | | |
| TASK-005 | **Onboarding page** (`apps/web/app/(onboarding)/onboarding/page.tsx`). Client component (`'use client'`). Reads `currentStep` from `useOnboarding()` hook. Conditionally renders the appropriate step component: `ProfileBasicsStep` (step 1), `PersonalRecordsStep` (step 2), `HighlightsStep` (step 3). Wraps the step in `AnimatePresence` from `motion/react` with `mode="wait"` and keyed by `currentStep` so exit animation completes before enter. Uses `slideUpVariants` from `@workspace/ui/lib/animations`. Renders `StepIndicator` above the step form. | | |

**Phase 1 completion criteria:** Onboarding route renders with minimal header (logo, no navbar), step indicator shows 3 steps, URL `?step=1|2|3` switches between placeholder step content, shared providers remain mounted exactly once at the root, and root `/api/**` routes remain untouched. Route group restructure preserves all existing routes. `pnpm typecheck && pnpm build` pass.

**Architecture note on route group restructure (TASK-001):**

The cleanest way to suppress the global navbar for onboarding is to split the `app/` directory into route groups:

```
apps/web/app/
├── layout.tsx              ← Shared providers + <html>, <body>, fonts, metadata
├── (main)/
│   ├── layout.tsx          ← Navbar + <main> wrapper
│   ├── page.tsx            ← Home page (/)
│   ├── dashboard/          ← Dashboard (/dashboard)
│   └── (auth)/             ← Auth routes (/sign-in, /sign-up, /sso-callback) if they stay on the main shell
├── (onboarding)/
│   ├── layout.tsx          ← Minimal header, NO navbar
│   └── onboarding/
│       ├── layout.tsx      ← Onboarding-specific server checks
│       ├── page.tsx        ← Wizard steps
│       └── complete/
│           └── page.tsx    ← Completion screen
├── api/                    ← Existing + new API routes stay at root
├── error.tsx               ← Stays at root level
├── global-error.tsx        ← Stays at root level
├── loading.tsx             ← Stays at root level
└── not-found.tsx           ← Stays at root level
```

Route groups `(main)` and `(onboarding)` don't affect URLs. Keep the providers (Clerk, Theme, Query, PostHog, Tooltip, Toaster) in the shared root `layout.tsx` and keep only the navbar/layout-structure differences in the group layouts.

---

### Phase 2 — Onboarding API Routes (parallel with Phase 1)

- GOAL-002: Build the server-side API endpoints for saving each onboarding step's data, marking onboarding complete, and detecting resume progress. All routes auth-protected with server-side Zod validation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | **Profile save API** (`apps/web/app/api/onboarding/profile/route.ts`). POST handler. Authentication: call `auth()` from `@clerk/nextjs/server`, return 401 if no `userId`. Parse and validate request body with a Zod schema built from shared schemas: `z.object({ fullName: fullNameSchema, username: usernameSchema, tagline: taglineSchema, athleteTypes: athleteTypesSchema, location: locationSchema.optional().or(z.literal('')), favRunTime: favRunTimeSchema.optional(), runningPersonality: runningPersonalitySchema.optional(), avatarUrl: z.string().url().optional().or(z.literal('')) })`. Normalize input before DB work: trim `fullName`, `tagline`, and `location`; lowercase + trim `username`; convert empty optional strings to `null`. Server-side username uniqueness check: query `db.query.users.findFirst({ where: and(eq(users.username, normalizedUsername), ne(users.clerkId, userId)) })` — allow the current user to keep their own username. Update the user row and return a standardized JSON response (`{ success: true, user }` on success, `{ error, fieldErrors? }` on validation conflicts). Handle database errors with try/catch returning 500. | | |
| TASK-007 | **Records save API** (`apps/web/app/api/onboarding/records/route.ts`). POST handler. Auth-protected (same pattern as TASK-006). Parse body: `z.object({ records: z.array(z.object({ distanceLabel: z.string().min(1), distanceKm: z.number().optional(), timeSeconds: z.number().int().positive(), timeDisplay: z.string().min(1), achievedAt: z.string().optional() })) })`. For each record with a known `distanceLabel` (5K, 10K, Half Marathon, Marathon), validate `timeSeconds` falls within `PR_RANGES[label].minSec` and `PR_RANGES[label].maxSec` — return 400 with details if out of range. For custom distances, allow free-form timing but still enforce a positive, sane upper bound (for example `< 86400` seconds). Get the user's DB `id` from `clerkId` before any child writes. Use a transaction to replace existing records atomically. Return `NextResponse.json({ success: true, count: body.records.length })`. | | |
| TASK-008 | **Highlights save API** (`apps/web/app/api/onboarding/highlights/route.ts`). POST handler. Auth-protected. Parse body: `z.object({ highlights: z.array(z.object({ title: highlightTitleSchema, distanceText: z.string().optional().or(z.literal('')), durationText: z.string().optional().or(z.literal('')), story: highlightStorySchema.optional().or(z.literal('')), imageUrl: z.string().url().optional().or(z.literal('')), highlightDate: z.string().optional(), sortOrder: z.number().int().min(0).default(0) })).max(2) })`. Normalize optional strings to `null`, validate that `highlightDate` is not in the future on the server, get the user's DB `id`, then replace existing highlights transactionally while preserving `sortOrder`. Return `NextResponse.json({ success: true, count: body.highlights.length })`. | | |
| TASK-009 | **Complete API** (`apps/web/app/api/onboarding/complete/route.ts`). POST handler. Auth-protected. Get user by `clerkId`. Validate that all required Step 1 fields are complete (`fullName`, `username`, `tagline`, and `athleteTypes.length >= 1`) — return 400 if missing with message "Please complete your profile basics before finishing onboarding". Set `db.update(users).set({ onboardingCompleted: true, updatedAt: new Date() }).where(eq(users.clerkId, userId))`. Return `NextResponse.json({ success: true, username: user.username })`. | | |
| TASK-010 | **Progress check API** (`apps/web/app/api/onboarding/progress/route.ts`). GET handler. Auth-protected. Get user by `clerkId`. If no user found, return `{ step: 1, user: null, records: [], highlights: [] }`. Determine current step: if `user.onboardingCompleted === true` → `step: 'complete'`; if required Step 1 fields are incomplete (`fullName`, `username`, `tagline`, `athleteTypes`) → `step: 1`; fetch personal records for user — if empty → `step: 2`; otherwise → `step: 3`. Fetch highlights for user. Return `NextResponse.json({ step, user: { fullName, username, tagline, athleteTypes, location, favRunTime, runningPersonality, avatarUrl }, records: [...], highlights: [...] })`. This enables the client to resume from the correct step, pre-populate form fields, and reject manual deep links to future steps. | | |

**Phase 2 completion criteria:** All 5 onboarding API routes respond correctly to authenticated requests. Profile save validates username uniqueness. Records save validates time ranges. Complete validates required fields. Progress returns correct step detection. Unauthenticated requests get 401. Invalid bodies get 400 with descriptive errors.

---

### Phase 3 — Step 1: Profile Basics (depends on Phase 1 & 2)

- GOAL-003: Build the first onboarding step where the user enters their profile basics with real-time username availability checking, profile photo upload, and multi-select athlete types.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | **Username availability hook** (`apps/web/hooks/use-username-check.ts`). Custom hook using `@tanstack/react-query`. Signature: `useUsernameCheck(username: string, currentUsername?: string)`. Returns `{ isAvailable: boolean \| null, isChecking: boolean, reason: string \| null }`. Implementation: maintain a `debouncedUsername` state that updates 300ms after the last `username` change (via `useEffect` with `setTimeout`). Use `useQuery({ queryKey: ['username-check', debouncedUsername], queryFn: () => fetch('/api/users/check-username?username=' + debouncedUsername).then(r => r.json()), enabled: !!debouncedUsername && debouncedUsername !== currentUsername && debouncedUsername.length >= 3, retry: 1, retryDelay: 500 })`. If `debouncedUsername === currentUsername`, return `{ isAvailable: true, isChecking: false, reason: null }` immediately (user re-entering onboarding keeps their own name). Map the endpoint's `{ available, reason }` response shape into the hook return shape, and keep the request same-origin so Clerk cookies are sent automatically. | | |
| TASK-012 | **Profile basics form component** (`apps/web/components/onboarding/steps/profile-basics-step.tsx`). Client component (`'use client'`). Props: `defaultValues?: Partial<ProfileBasicsFormValues>`, `onComplete: () => void`. Define Zod schema: `profileBasicsSchema = z.object({ fullName: fullNameSchema, username: usernameSchema, tagline: taglineSchema, athleteTypes: athleteTypesSchema, avatarUrl: z.string().optional(), location: z.string().max(TEXT_LIMITS.location.max).optional(), favRunTime: z.enum([...FAV_RUN_TIMES, '']).optional(), runningPersonality: z.enum([...RUNNING_PERSONALITIES, '']).optional() })`. Initialize `useForm<z.infer<typeof profileBasicsSchema>>({ resolver: zodResolver(profileBasicsSchema), defaultValues })`. Wrap the fields in a semantic `<form>` and use `Controller` for `FileUpload`, `MultiSelect`, `Select`, and any other non-native inputs. Form layout — mobile-first single column: (1) `FileUpload` component with `shape="circle"` for avatar (centered, using the component's built-in 128px circle size), (2) `fullName` Input with Label, (3) `username` Input with Label + inline availability indicator from `useUsernameCheck()` (green `Icons.checkCircle` when available, warning/error state with `Icons.warning` when invalid/taken, `Icons.loading` spinner when checking), (4) `tagline` TextareaWithCounter with `maxLength={80}`, (5) `athleteTypes` MultiSelect with options from `ATHLETE_TYPES` constant, (6) `location` Input with Label (optional badge), (7) `favRunTime` Select with options from `FAV_RUN_TIMES`, (8) `runningPersonality` Select with options from `RUNNING_PERSONALITIES`. Form errors displayed inline below each field via `<p className="text-destructive text-sm mt-1">`, and the async username status is announced via `aria-live="polite"`. | | |
| TASK-013 | **Profile photo upload integration** within TASK-012. Wire `FileUpload` through `Controller`; when its `onChange` callback yields a compressed `File`, call `uploadFile(file)` from `@workspace/storage/client`. On success, call `form.setValue('avatarUrl', result.publicUrl, { shouldDirty: true, shouldValidate: true })` and pass the saved URL back to `FileUpload` via `previewUrl`. Show upload progress via the `FileUpload` built-in progress indicator. Handle upload errors with a toast from `sonner` and field-level fallback messaging. | | |
| TASK-014 | **Save & navigate logic** within TASK-012. The "Next" button calls `form.handleSubmit(onSubmit)`. The `onSubmit` handler: (1) check that `useUsernameCheck` reports `isAvailable === true` — if not, set a form error on `username` field and abort, (2) `POST /api/onboarding/profile` with the form data via `fetch`, (3) if response is OK, call `onComplete()` which calls `nextStep()` from `useOnboarding` hook, (4) if response has a 409/400 error (username taken race condition, validation error), display the error message as a toast and/or inline field error. Button shows loading state (`isLoading` prop) while saving. | | |

**Phase 3 completion criteria:** Step 1 form renders all fields with proper validation. Username availability check works with 300ms debounce showing inline status. Profile photo uploads to R2 and shows preview. "Next" saves data to DB and advances to step 2. Pre-populates from `defaultValues` when resuming. All fields render correctly in dark mode and at mobile breakpoints.

---

### Phase 4 — Step 2: Personal Records (depends on Phase 3 for fullName/tagline in card preview)

- GOAL-004: Build the PR entry step with masked time inputs for 4 standard distances + custom distance, validation against allowed time ranges, and a live CSS card preview that updates as the user types.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-015 | **Personal records form component** (`apps/web/components/onboarding/steps/personal-records-step.tsx`). Client component. Props: `defaultValues?: { records: PRFormRecord[], userProfile: { fullName: string, tagline: string } }`, `onComplete: () => void`, `onBack: () => void`. Define types: `PRFormRecord = { distanceLabel: string, time: string, distanceKm?: number }`. Initialize `useForm` with `useFieldArray` for a dynamic records array. Render 4 standard distance rows: each row is a horizontal layout on desktop (label on left, `TimeInput` on right) stacking vertically on mobile. 5K row uses `TimeInput` with `format="mm:ss"` and `placeholder="MM:SS"`. 10K, Half Marathon, Marathon rows use `TimeInput` with `format="hh:mm:ss"` and `placeholder="HH:MM:SS"`. Each row shows the distance name prominently (`font-heading font-semibold`). Below the standard 4, render an expandable "Add custom distance" section: when expanded, shows a text `Input` for the custom distance label (e.g., "50K", "1 Mile") and a `TimeInput` with `format="hh:mm:ss"`. Validation: on submit, for each filled standard distance, parse the time string and validate against `PR_RANGES` using `validatePRTime()`. Custom distance skips standard range validation but must still parse successfully and stay below the agreed sanity cap. Empty rows (no time entered) are excluded from the submission. | | |
| TASK-016 | **Live card preview component** (`apps/web/components/onboarding/card-preview.tsx`). Client component. Props: `name: string`, `tagline: string`, `records: Array<{ distanceLabel: string, timeDisplay: string }>`. Renders a ~300px wide card with: (1) gradient background matching design system §14 — `background: linear-gradient(135deg, #5FE806 0%, #7C3AED 100%)`, (2) athlete name in `font-heading font-extrabold text-white text-xl`, (3) tagline in `text-white/80 text-sm`, (4) up to 3 PR entries displayed in a grid (distance label in `font-mono text-white/60 text-xs uppercase`, time in `font-mono font-semibold text-white text-lg`), (5) `ZealerProfile` watermark at the bottom in `text-white/40 text-xs`. The component uses explicit hex colors (matching the Satori card spec) — no CSS variables. Wrapped with `rounded-xl overflow-hidden shadow-e4`. Updated reactively: in the parent form, `watch()` is called to get live form values, which are transformed into the `records` prop array. Only non-empty PRs are shown. If no PRs entered yet, show a muted placeholder ("Your PRs will appear here"). | | |
| TASK-017 | **Page layout for Step 2**: On desktop (≥768px), render the form and card preview side by side (form on left taking 60% width, card preview on right taking 40%, sticky-positioned). On mobile, render the card preview above the form as a compact summary that scrolls with the content. Use `watch()` from `react-hook-form` to feed live values to both the form display and the card preview. | | |
| TASK-018 | **Save & navigate logic**: "Next" button: filter out empty PR rows, transform form data to the API shape (`{ records: [{ distanceLabel, distanceKm, timeSeconds, timeDisplay }] }`) using `parseMMSS()` / `parseHHMMSS()` to compute `timeSeconds`, POST to `/api/onboarding/records`. On success, call `onComplete()`. "Back" button: call `onBack()` which navigates to `?step=1`. If no PRs were entered (all empty), still allow proceeding — POST empty records array which clears any previously saved PRs. Show loading state on "Next" during save. | | |

**Phase 4 completion criteria:** Step 2 renders 4 standard distance rows + expandable custom distance. TimeInput masks enforce correct format. Validation catches out-of-range times with descriptive errors. Live card preview updates in real-time as PRs are typed. Side-by-side layout on desktop, stacked on mobile. "Next" saves to DB. "Back" returns to step 1. Pre-populates from `defaultValues` when resuming.

---

### Phase 5 — Step 3: Highlight Activities (depends on Phase 4)

- GOAL-005: Build the highlight activities step with dynamic form entries, image upload, and prominent skip functionality. This step is entirely optional — the skip path must be as discoverable as the "Next" path.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-019 | **Highlights form component** (`apps/web/components/onboarding/steps/highlights-step.tsx`). Client component. Props: `defaultValues?: { highlights: HighlightFormValues[] }`, `onComplete: () => void`, `onBack: () => void`, `onSkip: () => void`. Use `useForm` with `useFieldArray({ name: 'highlights' })`. Start with 1 empty highlight card. **Prerequisite:** extend `packages/ui/src/components/date-picker.tsx` to accept an optional `maxDate?: Date` prop (implemented via DayPicker disabled matcher) before using it here. Each highlight card is a `Card` component from `@workspace/ui` containing: (1) `title` Input with Label (required, `maxLength={60}`), (2) `distanceText` Input with Label (optional, placeholder "e.g. 18 km"), (3) `durationText` Input with Label (optional, placeholder "e.g. 2h 45m"), (4) `story` TextareaWithCounter with `maxLength={200}`, (5) `highlightDate` DatePicker with `maxDate={new Date()}`, wired via `Controller`, (6) `imageUrl` FileUpload with `shape="square"` + upload integration (same pattern as avatar upload). A "Remove" button (`Icons.delete`, ghost variant, destructive color) appears on each card when there are 2 cards. An "Add another highlight" button (`Icons.add`) appears below the cards when `fields.length < 2`. Validation: `title` is required on each non-empty card. If a card has any filled field, `title` becomes required. Completely empty cards (no fields filled) are filtered out before submission. | | |
| TASK-020 | **Skip & complete logic**: Two buttons are rendered at the bottom of the step: (1) "Skip this step" — secondary/outline variant button. On click: call `POST /api/onboarding/complete` directly (no highlights save), on success redirect to `/onboarding/complete` via `router.push()`. (2) "Finish" — primary variant button. On click: validate filled highlights, call `POST /api/onboarding/highlights` with the highlights array, then call `POST /api/onboarding/complete`, on success redirect to `/onboarding/complete`. Both buttons show loading state during their respective API calls. "Back" button: call `onBack()` which navigates to `?step=2`. The skip button must be visually discoverable — positioned prominently alongside "Finish", not hidden or de-emphasized beyond the variant difference. Include descriptive text above the form: "Share your proudest running moments (optional — you can always add these later from your dashboard)." | | |

**Phase 5 completion criteria:** Step 3 renders highlight cards with all fields. Image upload works for highlight images. "Add another" allows up to 2. "Remove" removes a card. "Skip" calls complete API and redirects to completion. "Finish" saves highlights + completes + redirects. "Back" returns to step 2. Pre-populates from `defaultValues` when resuming.

---

### Phase 6 — Completion Screen (depends on Phase 2 for complete API; parallel with Phase 5 for UI)

- GOAL-006: Build the `/onboarding/complete` page with a celebration animation, profile summary, live card preview, and share/copy/dashboard actions.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | **Completion page** (`apps/web/app/(onboarding)/onboarding/complete/page.tsx`). Server component. Calls `requireCurrentUser()` — if user is not authenticated, redirects to `/sign-in`; if DB user is null, redirects to `/onboarding`. If `user.onboardingCompleted === false`, redirect to `/onboarding` (prevent accessing completion before finishing). Fetch the user's personal records: `db.query.personalRecords.findMany({ where: eq(personalRecords.userId, user.id), orderBy: [asc(personalRecords.createdAt)] })`. Fetch the user's highlights: `db.query.highlights.findMany({ where: eq(highlights.userId, user.id), orderBy: [asc(highlights.sortOrder)] })`. Pass `user`, `records`, and `highlights` as serializable props to the `CompletionView` client component. | | |
| TASK-022 | **Completion view** (`apps/web/components/onboarding/completion-view.tsx`). Client component (`'use client'`). Props: `user: { fullName, username, tagline, athleteTypes, avatarUrl, location, favRunTime, runningPersonality }`, `records: Array<{ distanceLabel, timeDisplay }>`, `highlights: Array<{ title }>`. Layout: (1) **Celebration header** — "Your profile is ready!" heading in `font-heading text-3xl font-bold` with a Motion entrance animation (`spring` with `stiffness: 200, damping: 10`). Stagger-animated subheading: "Time to share your story with the world." (2) **Profile summary card** — a styled `Card` showing the avatar (circular, 64px), full name, tagline, athlete type badges (using `Badge` with `streak` variant), location if provided. (3) **Card preview** — reuse the `CardPreview` component from TASK-016, passing the user's name, tagline, and records. (4) **Action buttons** — stagger-animated using `staggerContainerVariants` and `staggerItemVariants`: "View My Profile" (rendered disabled with tooltip "Coming soon — public profiles ship in Module 5"), "Copy Profile Link" (rendered disabled with tooltip until the public profile route exists; once enabled in a future module, derive the copied URL from runtime origin rather than hardcoding production), "Download Card" (button with `disabled` state and tooltip "Coming soon — available in your dashboard once card generation is ready"), "Go to Dashboard" (primary button, `Link` to `/dashboard`). | | |
| TASK-023 | **Track `onboarding_complete` event**. In the `CompletionView` component, call `trackEvent('onboarding_complete')` from `@/lib/analytics` inside a `useEffect` that runs once on mount (empty dependency array). This fires the PostHog event for the onboarding completion metric. | | |

**Phase 6 completion criteria:** Completion page renders at `/onboarding/complete` with celebration animation, profile summary, card preview, and 4 action buttons. Page is protected — redirects to `/onboarding` if not completed. Future profile actions render as disabled/coming-soon until Module 5 exists. "Go to Dashboard" navigates to `/dashboard`. `onboarding_complete` event fires on mount. Dark mode and mobile render correctly.

---

### Phase 7 — Resume Logic, Edge Cases & Dashboard Gate (depends on Phases 3–6)

- GOAL-007: Handle returning users who left mid-onboarding, webhook race conditions, unsaved-changes warnings, and re-enable the dashboard onboarding gate.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-024 | **Resume detection on page mount**. In the onboarding page component (TASK-005), add a `useEffect` that calls `GET /api/onboarding/progress` on mount. Use `@tanstack/react-query` with `useQuery({ queryKey: ['onboarding-progress'], queryFn: ..., staleTime: 0 })`. On response: (1) if `step === 'complete'`, redirect to `/dashboard` via `router.replace('/dashboard')`, (2) if `step > currentStep`, call `goToStep(step, { replace: true })` to auto-advance, (3) if `currentStep > step`, normalize the URL back to the highest allowed saved step, (4) pass `user`, `records`, `highlights` data as `defaultValues` to the active step component for pre-population. Show a loading skeleton composed from shared `Skeleton` primitives while the progress query is pending. After the query resolves, render the step form with pre-populated data. | | |
| TASK-025 | **Webhook race condition handling**. In the onboarding route layout (TASK-002), if `getCurrentUser()` returns `null`: instead of immediately showing an error, render a `WebhookPendingFallback` client component inside the onboarding shell. This component: (1) shows a centered layout with a spinner (`Icons.loading` with `animate-spin`) and text "Setting up your account...", (2) polls `GET /api/onboarding/progress` every 2 seconds using `useQuery` with `refetchInterval: 2000`, (3) once a `user` is returned in the response (or after 3 failed polls = 6 seconds), either proceed to render the onboarding wizard (if user found) or show an error state with "Something went wrong setting up your account. Please try refreshing." and a "Refresh" button that calls `router.refresh()`. This handles the gap between Clerk signing up the user and the webhook creating the DB row. | | |
| TASK-026 | **Navigation guards**. In each step form component, add a `useEffect` that attaches a `beforeunload` event listener when the form has unsaved changes (`formState.isDirty === true`). The listener calls `event.preventDefault()` to trigger the browser's native "Leave site?" confirmation. Clean up the listener in the effect's cleanup function and when `isDirty` resets to false after a successful save. Additionally, disable "Next"/"Finish"/"Skip" buttons while a save is in progress (`isSubmitting === true` from `useForm`). Handle failed API responses gracefully: show specific error messages via toast (e.g., "Username is already taken" for 409, "Please check your entries" for 400, "Something went wrong, please try again" for 500). | | |
| TASK-027 | **Re-enable dashboard onboarding gate**. In `apps/web/app/dashboard/layout.tsx`, uncomment the `onboardingCompleted` redirect that is currently wrapped in a TODO comment. Change from: `// if (!user.onboardingCompleted) { redirect("/onboarding") }` to: `if (!user.onboardingCompleted) { redirect("/onboarding") }`. This ensures that after Module 3 is deployed, the complete flow works end-to-end: sign-up → redirect to `/onboarding` → complete wizard → redirect to `/dashboard` → dashboard renders because `onboardingCompleted === true`. | | |

**Phase 7 completion criteria:** Returning users auto-advance to the correct step with pre-populated data. Webhook race condition shows a graceful loading/retry state. Browser warns before leaving with unsaved changes. Dashboard gate redirects incomplete users to onboarding. End-to-end flow works: sign-up → onboarding → dashboard.

---

### Phase 8 — Polish, Animations & Responsive QA

- GOAL-008: Apply Motion animations, responsive styling polish, dark-mode verification, and accessibility hardening across all onboarding surfaces.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-028 | **Step transition animations**. In the onboarding page (TASK-005), verify `AnimatePresence` with `mode="wait"` and `slideUpVariants` produces smooth transitions between steps. Add `useReducedMotion()` from `motion/react`: when reduced motion is preferred, replace slide animation with a simple opacity fade (duration 200ms) by swapping variants to `fadeInVariants`. Ensure `key` prop on each step is `currentStep` so AnimatePresence correctly detects mounts/unmounts. | | |
| TASK-029 | **Completion celebration animation**. In `CompletionView` (TASK-022): (1) the "Your profile is ready!" heading uses a Motion `spring` animation with `stiffness: 200, damping: 10` for an overshooting entrance, (2) the profile summary card fades in with `fadeInVariants`, (3) the card preview slides up from 20px below with `slideUpVariants`, (4) the action buttons use `staggerContainerVariants` + `staggerItemVariants` for a sequential reveal. All animations respect `useReducedMotion()` — fall back to instant render or simple opacity fade. | | |
| TASK-030 | **Mobile-first responsive QA**. Test all onboarding screens at 375px, 390px, and 414px viewport widths. Verify: (1) form fields stack to single column on mobile, (2) `FileUpload` circle (avatar) is centered and touch-friendly (≥44px tap target), (3) step indicator is compact — abbreviate labels to step numbers on very small screens if needed, (4) card preview in Step 2 renders above the form on mobile (not beside it), (5) completion screen actions stack vertically on mobile, (6) all text is readable without horizontal scrolling, (7) time inputs are large enough for thumb typing. Fix any overflow, truncation, or tap-target issues found. | | |
| TASK-031 | **Dark mode verification**. Toggle theme on every onboarding screen and verify: (1) form inputs use correct border and focus colors from OKLCH tokens (`border-slate-700`, `focus:border-lime-500` in dark), (2) card preview gradient renders correctly (explicit hex, not token-dependent), (3) step indicator uses correct muted/active colors, (4) FileUpload drag-over state is visible in dark mode, (5) completion screen celebration renders well against dark background, (6) all text has sufficient contrast. | | |
| TASK-032 | **Accessibility hardening**. Ensure: (1) keyboard navigation through all form fields in logical tab order, (2) focus moves to the first field of the new step when transitioning (use `useEffect` with `ref.focus()` after step mount), (3) step indicator has `aria-label="Onboarding progress"` and steps have `aria-current="step"` on the active one, (4) screen readers announce step changes via a visually hidden live region (`aria-live="polite"`), (5) FileUpload is keyboard-accessible (Enter/Space to open file picker), (6) error messages are associated with inputs via `aria-describedby`, (7) the username availability status is announced to screen readers via `aria-live="polite"` on the status text. | | |

**Phase 8 completion criteria:** All animations are smooth and respect reduced-motion preference. All screens render correctly at 375/390/414px and in dark mode. Keyboard navigation and screen reader announcements work. No contrast, overflow, or tap-target issues remain.

---

### Phase 9 — Build Validation & Integration Verification

- GOAL-009: End-to-end validation that all Module 3 components work together. Verify the full onboarding flow and build pipeline.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-033 | Run `pnpm typecheck` from repo root — must pass with zero errors across all packages. | | |
| TASK-034 | Run `pnpm build` from repo root — must complete successfully. Verify the Next.js build output includes: `/onboarding` (route from `(onboarding)` group), `/onboarding/complete`, `/api/onboarding/profile`, `/api/onboarding/records`, `/api/onboarding/highlights`, `/api/onboarding/complete`, `/api/onboarding/progress`. Confirm existing routes (`/`, `/sign-in`, `/sign-up`, `/dashboard`, `/api/upload`, `/api/users/check-username`, `/api/webhooks/clerk`) still appear — the route group restructure must not break them. | | |
| TASK-035 | Run `pnpm lint` from repo root — must pass (Biome). Fix any lint errors introduced by new files. | | |
| TASK-036 | **Manual E2E flow — happy path**: Start dev server (`pnpm dev`). Sign up with a new test account → lands on `/onboarding?step=1` → fill in all Step 1 fields with valid data including username availability check, upload a profile photo → click "Next" → lands on `?step=2` with data saved → enter a 5K PR time → see live card preview update → click "Next" → lands on `?step=3` → add one highlight with title and story → click "Finish" → lands on `/onboarding/complete` → see celebration animation, profile summary, card preview → click "Go to Dashboard" → lands on `/dashboard` (no redirect back to onboarding because `onboardingCompleted === true`). | | |
| TASK-037 | **Manual E2E flow — skip path**: Create a new test account → complete Steps 1 and 2 → on Step 3, click "Skip this step" → lands on `/onboarding/complete` → verify profile shows without highlights and the disabled future-profile actions communicate their coming-soon state clearly. | | |
| TASK-038 | **Manual E2E flow — resume path**: Create a new test account → complete Step 1 → close the browser tab → reopen `/onboarding` → verify auto-advance to Step 2 with Step 1 data preserved (username, name visible in card preview). Complete Step 2 → close tab → reopen → verify auto-advance to Step 3. Attempt to manually edit the URL to `?step=3` before saving Step 2 and verify the app normalizes back to the highest allowed step. | | |
| TASK-039 | **Manual E2E flow — validation**: On Step 1, enter a taken/reserved username → verify inline "taken"/"reserved" message appears. Re-enter the current user's already-saved username during resume → verify it is treated as available. Enter a name exceeding 100 chars → verify validation error. On Step 2, enter a 5K time of "05:00" (below 10:00 min) → verify validation error "Time must be at least 10:00". Enter "99:99" → verify invalid format error. | | |
| TASK-040 | **Manual viewport & theme test**: Toggle dark mode during onboarding → verify all screens render correctly. Resize browser to 375px → verify all steps are usable (no overflow, fields readable, tap targets ≥44px). Confirm shared providers still work after the route-group split (theme toggle, toasts, query-backed username checks, and Clerk state). | | |

**Phase 9 completion criteria:** All 3 build commands pass. All listed manual flow and QA tests complete successfully. Onboarding is production-ready.

---

## 3. Alternatives

- **ALT-001**: **Single final save (all steps at once)** — All form data collected in client state and submitted in one POST at the very end. **Not chosen** because it loses all progress if the user closes the tab mid-flow. Per-step persistence is more resilient and enables resume, which is critical for a "completable in under 5 minutes" target where users may be interrupted.

- **ALT-002**: **Nested routes per step (`/onboarding/step-1`, `/onboarding/step-2`, `/onboarding/step-3`)** — Each step as a separate Next.js route segment. **Not chosen** because URL search params (`?step=1|2|3`) are simpler, avoid route-segment-level layout complexity, and the page component can switch step content without a full navigation. Route groups would also mean separate loading/error boundaries per step, which is unnecessary overhead.

- **ALT-003**: **Server Actions instead of API routes** — Use Next.js Server Actions for step saves. **Not chosen for this module** because: (1) dedicated API routes provide clearer separation of concerns and are easier to debug via network tab, (2) the username availability check already uses an API route pattern, keeping mutations consistent, (3) API routes make it straightforward to add rate limiting or logging later. Server Actions are a valid alternative and could be adopted if the team prefers less boilerplate.

- **ALT-004**: **Satori-generated card preview in Step 2** — Render the actual PNG card on the server while the user types. **Not chosen** because Satori runs server-side only, would require a round-trip for every keystroke change, and the actual card generation is Module 6's responsibility. A CSS/HTML approximation provides the same live-updating UX at zero cost.

- **ALT-005**: **Keep global navbar during onboarding** — No route-group restructure needed. **Not chosen** because the minimal header keeps users focused on the task, reduces visual noise, and matches the "wizard" UX pattern where irrelevant navigation is suppressed. This was explicitly confirmed as the user's preference.

- **ALT-006**: **Conditional navbar via pathname check or CSS display:none** — Keep current single root layout and hide the navbar for `/onboarding` routes. **Not chosen** because route-group-based layout composition is the idiomatic Next.js App Router pattern, avoids runtime conditional logic, and keeps layout boundaries clean.
- **ALT-007**: **Move all API routes into a route group** — Place `/api/**` under `app/(main)/api/` during the shell restructure. **Not chosen** because API routes do not benefit from shell-specific layout separation, and keeping them at root minimizes file churn and route-regression risk.

---

## 4. Dependencies

- **DEP-001**: `@clerk/nextjs@^7.0.6` — already installed. Provides `auth()` for server-side auth in API routes and `useAuth()` for client-side auth status.
- **DEP-002**: `@workspace/database` — shared database package. Provides `db` client, `users`/`personalRecords`/`highlights` schemas, type exports (`User`, `PersonalRecord`, `Highlight`, `NewPersonalRecord`, `NewHighlight`).
- **DEP-003**: `@workspace/ui` — shared UI component library. Provides all form components (Input, Button, Card, FileUpload, TimeInput, MultiSelect, TextareaWithCounter, DatePicker, Select, Progress, Badge, Label, Separator, Skeleton), animation variants, validation schemas, icons, and utility functions.
- **DEP-004**: `@workspace/storage` — shared storage abstraction. Provides `uploadFile()` for browser-to-R2 uploads and `requestSignedUpload()` for the presigned URL flow.
- **DEP-005**: `react-hook-form@7.71.2` — already installed in `apps/web`. Form state management, `useForm`, `useFieldArray`, `watch()`, `zodResolver`.
- **DEP-006**: `@hookform/resolvers@5.2.2` — already installed in `apps/web`. Zod integration for react-hook-form via `zodResolver`.
- **DEP-007**: `@tanstack/react-query@5.80.7` — already installed in `apps/web`. Used for debounced username check hook and onboarding progress query.
- **DEP-008**: `zod@4.3.6` — already installed in `@workspace/ui`. Schema validation on both client and server. All onboarding schemas compose from existing shared schemas.
- **DEP-009**: `motion@12.38.0` — already installed in `@workspace/ui`. Animation library for step transitions and completion celebration. `AnimatePresence`, `motion.div`, `useReducedMotion`.
- **DEP-010**: `sonner@2.0.7` — already installed in `@workspace/ui`. Toast notifications for success/error feedback. `<Toaster />` already mounted in root layout.
- **DEP-011**: `next@16` — framework. App Router, Server Components, route groups, `useSearchParams`, `useRouter`, `redirect()`.
- **DEP-012**: `drizzle-orm@^0.45.1` — already installed in `@workspace/database`. Used in API routes for DB queries (insert, update, delete, select, transactions).

**No new packages need to be installed.** All dependencies are already present in the workspace.

---

## 5. Files

### Files to Create

- **FILE-001**: `apps/web/app/(onboarding)/layout.tsx` — Onboarding route-group layout with minimal header (logo + optional extracted theme toggle), no navbar
- **FILE-002**: `apps/web/app/(onboarding)/onboarding/layout.tsx` — Onboarding-specific server layout with auth checks and redirect logic
- **FILE-003**: `apps/web/app/(onboarding)/onboarding/page.tsx` — Onboarding wizard page with step switching, AnimatePresence, and resume detection
- **FILE-004**: `apps/web/app/(onboarding)/onboarding/complete/page.tsx` — Completion screen server component with data fetching
- **FILE-005**: `apps/web/app/(main)/layout.tsx` — Main route-group layout with Navbar and main content wrapper
- **FILE-006**: `apps/web/app/api/onboarding/profile/route.ts` — Step 1 save API (profile basics)
- **FILE-007**: `apps/web/app/api/onboarding/records/route.ts` — Step 2 save API (personal records)
- **FILE-008**: `apps/web/app/api/onboarding/highlights/route.ts` — Step 3 save API (highlight activities)
- **FILE-009**: `apps/web/app/api/onboarding/complete/route.ts` — Mark onboarding complete API
- **FILE-010**: `apps/web/app/api/onboarding/progress/route.ts` — Resume detection / progress check API
- **FILE-011**: `apps/web/components/onboarding/step-indicator.tsx` — Step progress indicator with numbered steps and progress bar
- **FILE-012**: `apps/web/components/onboarding/steps/profile-basics-step.tsx` — Step 1 form (profile basics with username check and photo upload)
- **FILE-013**: `apps/web/components/onboarding/steps/personal-records-step.tsx` — Step 2 form (PR entry with masked time inputs)
- **FILE-014**: `apps/web/components/onboarding/steps/highlights-step.tsx` — Step 3 form (highlight cards with image upload and skip)
- **FILE-015**: `apps/web/components/onboarding/card-preview.tsx` — Live CSS card preview component (reused in Step 2 and completion)
- **FILE-016**: `apps/web/components/onboarding/completion-view.tsx` — Completion screen client component with celebration animation and actions
- **FILE-017**: `apps/web/hooks/use-onboarding.ts` — Step navigation hook (URL search params)
- **FILE-018**: `apps/web/hooks/use-username-check.ts` — Debounced username availability check hook

### Files to Modify

- **FILE-019**: `apps/web/app/layout.tsx` — Keep shared providers at root and move navbar + main wrapper to `(main)` layout
- **FILE-020**: `apps/web/app/dashboard/layout.tsx` — Uncomment the `onboardingCompleted` redirect gate (line is currently `// if (!user.onboardingCompleted) { redirect("/onboarding") }`)
- **FILE-021**: `packages/ui/src/components/date-picker.tsx` — Extend shared `DatePicker` with optional `maxDate` support for highlight-date validation

### Files to Relocate (route-group restructure)

- **FILE-022**: `apps/web/app/page.tsx` → `apps/web/app/(main)/page.tsx`
- **FILE-023**: `apps/web/app/(auth)/` → `apps/web/app/(main)/(auth)/` **only if** auth routes should continue sharing the navbar shell; otherwise leave them outside both groups for a future auth-shell cleanup
- **FILE-024**: `apps/web/app/dashboard/` → `apps/web/app/(main)/dashboard/`
- **FILE-025**: `apps/web/app/onboarding/` → `apps/web/app/(onboarding)/onboarding/` (replace placeholder files)

### Existing Files to Reuse (no modification)

- **FILE-026**: `packages/ui/src/lib/validations.ts` — All Zod schemas, constants, PR range validation, time parsers
- **FILE-027**: `packages/ui/src/lib/animations.ts` — Motion shared variants (slideUpVariants, fadeInVariants, staggerContainerVariants, staggerItemVariants, pageVariants)
- **FILE-028**: `packages/ui/src/lib/icons.ts` — Phosphor icon centralized exports
- **FILE-029**: `packages/ui/src/lib/utils.ts` — `cn()` class merging utility
- **FILE-030**: `packages/ui/src/components/*` — All 27 UI primitives (Input, Button, Card, FileUpload, TimeInput, MultiSelect, TextareaWithCounter, DatePicker, Select, Progress, Badge, Label, Separator, Skeleton, etc.)
- **FILE-031**: `packages/storage/src/client.ts` — Browser upload client (`uploadFile()`, `requestSignedUpload()`)
- **FILE-032**: `packages/database/src/client.ts` — Singleton Drizzle DB client
- **FILE-033**: `packages/database/src/schema/index.ts` — Schema exports (users, personalRecords, highlights, achievements, relations)
- **FILE-034**: `packages/database/src/types.ts` — Type exports (User, NewUser, PersonalRecord, NewPersonalRecord, Highlight, NewHighlight)
- **FILE-035**: `apps/web/lib/auth.ts` — Auth helpers (`getCurrentUser()`, `requireCurrentUser()`)
- **FILE-036**: `apps/web/lib/analytics.ts` — Event tracking (`trackEvent()`)
- **FILE-037**: `apps/web/app/api/upload/route.ts` — Existing presigned upload signing route
- **FILE-038**: `apps/web/app/api/users/check-username/route.ts` — Existing username availability API

---

## 6. Testing

### Build Validation (Automated)

- **TEST-001**: `pnpm typecheck` passes from repo root with zero errors across all packages.
- **TEST-002**: `pnpm build` passes from repo root. Build output includes all new routes and all existing routes remain intact after the route-group restructure.
- **TEST-003**: `pnpm lint` passes from repo root (Biome).

### Manual Integration Tests

- **TEST-004**: **Happy path E2E** — Sign up → `/onboarding` → complete all 3 steps with valid data → `/onboarding/complete` → "Go to Dashboard" → `/dashboard` renders normally.
- **TEST-005**: **Skip path E2E** — Complete Steps 1 & 2 → Skip Step 3 → `/onboarding/complete` → profile summary shows without highlights.
- **TEST-006**: **Resume E2E** — Complete Step 1 → close tab → reopen `/onboarding` → auto-advances to Step 2 with Step 1 data pre-populated. Repeat for Step 2 → Step 3.
- **TEST-007**: **Username validation** — Enter a taken username → "taken" shown. Enter a reserved name (e.g., "admin") → "reserved" shown. Enter a valid available name → green checkmark. Enter fewer than 3 chars → format error. Enter special characters → format error.
- **TEST-008**: **PR validation** — 5K: enter "05:00" → error "Time must be at least 10:00". Enter "60:00" → error "Time must be at most 59:59". Enter "22:14" → accepted. 10K: enter "00:20:00" → error. Enter "00:48:30" → accepted.
- **TEST-009**: **Image upload** — Upload a valid JPEG ≤5MB → compresses, uploads, preview shows. Upload a file >5MB → rejected with error. Upload a PDF → rejected with format error.
- **TEST-010**: **Mobile responsive** — All 3 steps + completion screen render correctly at 375px, 390px, 414px. No horizontal scroll, fields are usable, tap targets ≥44px.
- **TEST-011**: **Dark mode** — Toggle theme on every screen. Verify inputs, card preview, step indicator, and completion render correctly.
- **TEST-012**: **Timing** — Complete the full flow with typical data entry (name + username + tagline + 2 athlete types + 1 PR + skip highlights) in under 5 minutes.
- **TEST-013**: **Dashboard gate** — After completing onboarding, visit `/dashboard` → renders normally. Create a new account, do NOT complete onboarding, visit `/dashboard` → redirected to `/onboarding`.
- **TEST-014**: **Webhook race** — Sign up with a new account where the webhook may be delayed → `/onboarding` shows "Setting up your account..." loading state → resolves and shows Step 1 once the DB row is created.

---

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Route-group restructure may break existing routes.** Moving pages into `(main)` changes the file system layout. Next.js route groups don't affect URLs, but incorrect file placement could cause 404s. **Mitigation**: Run `pnpm build` after the restructure and verify all routes appear in the build output before implementing any new Module 3 code.
- **RISK-002**: **Provider duplication across route groups.** Duplicating providers (Clerk, Theme, Query, PostHog) across both route groups could cause hydration issues, duplicated query caches, or stale state. **Mitigation**: Keep all providers in the root `layout.tsx` and keep only structural differences (navbar vs. minimal header) in the group layouts.
- **RISK-003**: **Webhook race condition during sign-up.** Clerk webhook delivery can lag behind session creation by several seconds. If a user completes sign-up and is redirected to `/onboarding` before the webhook creates their DB row, `getCurrentUser()` returns null. **Mitigation**: Phase 7, TASK-025 implements a polling/retry mechanism with a graceful loading state.
- **RISK-004**: **Username race condition between availability check and save.** A username checked as available at debounce-time could be taken by another user before the profile save. **Mitigation**: Server-side uniqueness check in the profile save API (TASK-006) catches this; the API returns a descriptive error that the client displays to the user.
- **RISK-005**: **Large image uploads on slow connections.** Profile photos and highlight images upload directly to R2 from the browser. On slow mobile connections, uploads may time out or appear stuck. **Mitigation**: `FileUpload` shows a progress indicator, and client-side compression reduces file size to ~1MB before upload.
- **RISK-006**: **Completion-screen CTAs can drift out of scope.** If public profile actions are enabled before Module 5 ships, users will encounter broken destinations. **Mitigation**: keep these actions disabled/coming-soon in Module 3 and explicitly verify their state during QA.

### Assumptions

- **ASSUMPTION-001**: Module 2 (Authentication & User Management) is fully implemented and tested before Module 3 begins. Custom sign-in/sign-up pages, SSO callback, dashboard layout with auth checks, and the username availability API are all functional.
- **ASSUMPTION-002**: The database schema in `packages/database/src/schema/` is finalized and matches the Product Plan §8.2 spec. No schema changes are needed for Module 3.
- **ASSUMPTION-003**: The Drizzle migration has been applied to the development database, and the `users`, `personal_records`, and `highlights` tables exist with all required columns and indexes.
- **ASSUMPTION-004**: The Clerk webhook is configured and delivering `user.created` events to `/api/webhooks/clerk`, so new sign-ups have DB rows created within a few seconds.
- **ASSUMPTION-005**: Cloudflare R2 is configured with CORS allowing uploads from the development and production domains. The upload signing route at `/api/upload` is functional.
- **ASSUMPTION-006**: All environment variables (Clerk keys, database URLs, R2 credentials, PostHog tokens) are set in `.env.local` for development and Vercel for production.
- **ASSUMPTION-007**: The route-group restructure (Phase 1, TASK-001) does not require changes to `next.config.mjs` or `turbo.json` — route groups are a file-system-only concern in Next.js App Router.
- **ASSUMPTION-008**: Existing API routes remain at `apps/web/app/api/**`; only page/layout files move into route groups. This should be verified during Phase 1 before proceeding.

---

## 8. Related Specifications / Further Reading

- `docs/core-plan/requirements-overview.md` — Module 3 scope definition, dependency map, build sequence
- `docs/core-plan/product-plan.md` — §6.1 Profile fields, §6.2 PR specs, §6.3 Highlights specs, §7.1 Onboarding flow, §8.2 Database schema, §10 Routes, §16 Decisions, §18 Security
- `docs/core-plan/design-system.md` — §9 Animation & Motion, §12 Component Styling Guide (TimeInput, FileUpload, MultiSelect, TextareaWithCounter, DatePicker, Card, Badge, Button), §14 Shareable Card Design
- `docs/impl-plan/feature-app-shell-shared-ui-module-1.md` — Module 1 plan: UI component library, animation foundation, validation schemas, icon mapping
- `docs/impl-plan/feature-auth-user-management-module-2.md` — Module 2 plan: Clerk auth pages, webhook handler, dashboard onboarding gate, username availability API, reserved-username validation
- `docs/impl-plan/infrastructure-module-0-workspace-setup-1.md` — Module 0 plan: workspace scaffold, database schema, storage abstraction, analytics, deployment
- `docs/impl-plan/vercel-env-vars.md` — Required environment variables for local and production
