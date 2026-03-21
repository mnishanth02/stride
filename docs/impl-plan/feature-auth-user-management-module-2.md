---
goal: "Module 2: Authentication & User Management — Custom Clerk sign-in/sign-up, Google OAuth, email verification, onboarding redirect, username availability API, and auth helpers"
version: 1.0
date_created: 2026-03-21
last_updated: 2026-03-21
owner: ZealerProfile
tags: [feature, auth, clerk, module-2]
---

# Introduction

This document is the detailed implementation plan for **Module 2: Authentication & User Management**. It builds on the auth infrastructure already in place from Module 0 (ClerkProvider, `proxy.ts`, webhook handler, `getCurrentUser()`) and delivers the user-facing auth layer: fully custom sign-in and sign-up pages using Clerk v7 hooks, Google OAuth via SSO flow, email verification, a server-side onboarding redirect in the dashboard layout, a username availability API, and extended auth helpers.

Module 0 schema closeout remains included as **Phase 0** (prerequisite), but the live repo audit shows this is now a **targeted cleanup phase**, not a full schema build-out. The `users` table already contains the planned profile fields and an initial Drizzle migration already exists; the remaining blockers are removing the legacy `bio` column, reconciling validation and reserved-username sources of truth, and synchronizing Clerk auth-route environment variables with the canonical `/sign-in` and `/sign-up` routes.

## User Decisions (Captured 2026-03-21)

| Decision | Choice |
|----------|--------|
| Module 0 closeout | Include as Phase 0 prerequisite in this plan |
| Auth page style | Fully custom UI with Clerk `useSignIn`/`useSignUp` hooks |
| Onboarding redirect | Server-side check in dashboard layout |
| Auth route grouping | `(auth)` route group with shared centered layout |
| Auth shell behavior | Keep the global navbar in the root layout for Module 2; center auth content within the existing app shell instead of splitting the root layout |

## Live Repo Audit — 2026-03-21

| Area | Status | Details |
|------|--------|---------|
| `ClerkProvider` in root layout | ✅ Implemented | Outermost provider in `apps/web/app/layout.tsx` |
| Route protection (`proxy.ts`) | ✅ Implemented | Clerk middleware protects `/dashboard(.*)` and `/onboarding(.*)` via `proxy.ts` (Next.js 16 pattern) |
| Webhook handler (`/api/webhooks/clerk`) | ✅ Implemented | Handles `user.created`, `user.updated`, `user.deleted` with signature verification via `verifyWebhook()`. Idempotent upserts. Soft delete. |
| Auth helper (`getCurrentUser()`) | ✅ Implemented | `apps/web/lib/auth.ts` — queries DB by `clerkId`, returns `User \| null` |
| `@clerk/nextjs` version | ✅ `^7.0.6` | Current SDK (v7+), uses `finalize()` pattern, not Core 2 `setActive()` |
| Reserved usernames utility | ✅ Implemented | `packages/database/src/constants/reserved-usernames.ts` — 15 blocked words |
| Auth-aware navbar | ✅ Implemented | `apps/web/components/navbar.tsx` — uses `useAuth()`, shows sign-in/sign-up links or `UserButton` |
| Root layout shell | ⚠️ Constraint to account for | `apps/web/app/layout.tsx` always renders `Navbar`, so `(auth)` routes inherit the global app shell unless the root layout is intentionally refactored |
| Shared validation layer | ⚠️ Partial | `packages/ui/src/lib/validations.ts` has a looser `usernameSchema`, a duplicated reserved-name list, and is still missing `emailSchema` / `passwordSchema` |
| Database schema (`users` table) | ⚠️ Mostly implemented | `packages/database/src/schema/users.ts` already includes `tagline`, `athleteTypes`, `story`, `location`, `totalKm`, `longestRunKm`, `yearsActiveSince`, `favRunTime`, `runningPersonality`, and `isPublic`, but still retains the legacy `bio` column |
| Database migration | ⚠️ Generated but needs cleanup follow-through | `packages/database/drizzle/0000_furry_professor_monster.sql` already exists, but it still contains the legacy `bio` column and must be reconciled with the final schema strategy |
| Sign-in/sign-up routes | ❌ Not built | No `/sign-in` or `/sign-up` directories under `apps/web/app/` |
| Dashboard route | ❌ Not built | No `apps/web/app/dashboard/` directory |
| Onboarding route | ❌ Not built | No `apps/web/app/onboarding/` directory |
| SSO callback route | ❌ Not built | No `/sso-callback` directory |
| Username check API | ❌ Not built | No username availability endpoint |
| `requireCurrentUser()` helper | ❌ Not built | Only `getCurrentUser()` exists (returns nullable) |
| Environment variable docs/examples | ⚠️ Need sync | `docs/impl-plan/vercel-env-vars.md` and `/.env.example` still use `/login` and `/signup`, while the canonical auth routes in product/docs/UI are `/sign-in` and `/sign-up` |

---

## 1. Requirements & Constraints

- **REQ-001**: Users can sign up with email + password. Clerk handles password policy (min 8 chars). Email verification code is sent and must be verified before sign-up completes.
- **REQ-002**: Users can sign up / sign in with Google OAuth via Clerk SSO strategy (`oauth_google`).
- **REQ-003**: Sign-up redirects to `/onboarding` on completion. Sign-in redirects to `/dashboard`.
- **REQ-004**: Profiles are publicly visible only when `email_verified = true`, `is_public = true`, and `is_deleted = false` (Product Plan §6.1, §18).
- **REQ-005**: `/dashboard/*` and `/onboarding/*` routes are auth-protected via `proxy.ts`. All other routes (including auth pages) are public.
- **REQ-006**: Clerk webhook syncs `clerk_id`, `primary_email`, `email_verified`, `full_name`, `avatar_url` from Clerk → `users` table on `user.created`, `user.updated`, `user.deleted` events (Product Plan §8.1).
- **REQ-007**: Username validation: 3–20 chars, lowercase alphanumeric + hyphens/underscores, must start and end with alphanumeric, no reserved words (Product Plan §16 Decision #12).
- **REQ-008**: Users who haven't completed onboarding (`onboarding_completed = false`) are server-side redirected from `/dashboard` to `/onboarding`.
- **SEC-001**: Webhook signature verified via Clerk `verifyWebhook()` with `CLERK_WEBHOOK_SIGNING_SECRET`. Returns 400 on failure.
- **SEC-002**: Username check API requires authentication — unauthenticated requests get 401.
- **SEC-003**: All text inputs sanitized against XSS. Zod validation on both client and server for username, email, password.
- **SEC-004**: Bot protection: `<div id="clerk-captcha" />` element required in custom sign-up form (Clerk's built-in bot detection).
- **CON-001**: Must use `proxy.ts` for route protection (Next.js 16 pattern). Do not introduce `middleware.ts`.
- **CON-002**: Must use Clerk v7 hooks (`useSignIn`/`useSignUp`) with `finalize()` pattern — not Core 2 `create()`/`prepareFirstFactor()`/`setActive()` API.
- **CON-003**: Auth pages must work in both light and dark mode and be responsive at 375px, 390px, 414px viewports (Product Plan §16 Decision #16).
- **CON-004**: Module 0 schema closeout (Phase 0 below) must complete before onboarding redirect logic (Phase 5) can be tested against the real DB.
- **CON-005**: `apps/web/app/layout.tsx` currently renders `Navbar` globally. Module 2 must preserve that shell choice and center auth content within it, unless a separate root-layout refactor is intentionally added to scope.
- **CON-006**: Clerk webhooks are asynchronous and must not be treated as a synchronous prerequisite for redirecting a newly authenticated user into onboarding.
- **GUD-001**: Use `@workspace/*` imports for shared packages. Do not use deep relative imports across package boundaries.
- **GUD-002**: Use shared shadcn/ui components from `@workspace/ui/components/*` for all auth page UI.
- **GUD-003**: Keep Clerk-managed fields (`email`, `emailVerified`, `fullName`, `avatarUrl`) synced only via webhook. Onboarding-entered fields (`tagline`, `athleteTypes`, `story`, etc.) are written directly by application code.
- **GUD-004**: Username validation rules and reserved-name checks must come from a single canonical source of truth shared by the API route and client-side form validation.
- **PAT-001**: Clerk v7 sign-up pattern: `signUp.password()` → `signUp.verifications.sendEmailCode()` → `signUp.verifications.verifyEmailCode()` → `signUp.finalize({ navigate })`.
- **PAT-002**: Clerk v7 sign-in pattern: `signIn.password({ emailAddress, password })` → check `signIn.status === 'complete'` → `signIn.finalize({ navigate })`.
- **PAT-003**: Clerk v7 SSO pattern: `signIn.sso({ strategy: 'oauth_google', redirectCallbackUrl: '/sso-callback', redirectUrl: '/sign-in/tasks' })`.
- **PAT-004**: SSO callback pattern: `useEffect` with `useRef(hasRun)` to prevent double execution. Check `signIn.status`, then `signIn.finalize({ navigate })`.
- **PAT-005**: `[[...sign-in]]` and `[[...sign-up]]` catch-all segments for Clerk's internal routing (session tasks, MFA steps). Future-proofs the routes.
- **PAT-006**: When using `decorateUrl()` inside Clerk `finalize()` callbacks, handle both relative and absolute URLs: use `router.push()` for relative paths and `window.location.href` for absolute URLs. Also branch explicitly if `session?.currentTask` exists.

---

## 2. Implementation Steps

### Phase 0 — Schema, Validation, and Env Cleanup (Prerequisite)

- GOAL-001: Finish the remaining database, validation, and configuration cleanup required before auth and onboarding flows can be built against a correct and internally consistent foundation.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Remove the legacy `bio` column from `packages/database/src/schema/users.ts` and update any remaining references to `bio` across `apps/web/`, `packages/database/`, and docs where the live schema is described. Product Plan §8.2 uses `story` (max 500 chars) and `tagline` (max 80 chars) instead of a single `bio`. | | |
| TASK-002 | Reconcile the existing migration state in `packages/database/drizzle/0000_furry_professor_monster.sql`. If the Neon dev database can be safely reset, regenerate the initial migration after removing `bio`. If the dev database must be preserved, create a follow-up migration that copies `bio` → `story` if needed and then drops `bio`. Document which path was chosen before considering Phase 0 complete. | | |
| TASK-003 | Verify the existing composite discovery index in `packages/database/src/schema/users.ts` still matches the required query shape: `index("users_public_discovery_idx").on(table.isPublic, table.isDeleted, table.emailVerified, table.updatedAt)`. Keep it or update it if the live code diverged. | | |
| TASK-004 | Verify the FTS index SQL in `packages/database/src/schema/fts-index.sql` covers all 4 required columns: `full_name`, `username`, `location`, `tagline`. The live SQL already appears correct; this task is a verification gate so downstream search assumptions stay accurate. | | |
| TASK-005 | Reconcile username validation into a single canonical rule set. Update `packages/ui/src/lib/validations.ts` to use the strict 3–20 character regex required by Product Plan §16 and remove reserved-name drift by sharing the canonical reserved list with `packages/database/src/constants/reserved-usernames.ts` instead of maintaining a divergent duplicate. Add `emailSchema` and `passwordSchema` while doing this cleanup. | | |
| TASK-006 | Sync auth-route environment-variable references across `/.env.example` and `docs/impl-plan/vercel-env-vars.md` so the documented/default routes are `/sign-in` and `/sign-up`, not `/login` and `/signup`. Verify whether this app relies on `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, server-only aliases, or both, and keep the docs/examples consistent with runtime behavior. | | |
| TASK-007 | Verify `packages/database/src/types.ts` type exports remain correct after the schema cleanup. The `User`/`NewUser` types are auto-inferred via `$inferSelect`/`$inferInsert`, so this is primarily a compile-time confirmation step. | | |
| TASK-008 | Run `pnpm --filter @workspace/database db:generate` and `pnpm --filter @workspace/database db:migrate` as needed for the migration strategy chosen in TASK-002, then verify `pnpm typecheck && pnpm build` pass from the repo root. | | |

**Phase 0 completion criteria:** `bio` is removed from the live schema, the migration history is reconciled with that decision, the composite and FTS indexes are verified, username validation and reserved-name checks are internally consistent, auth-route env docs/examples are synchronized, and `pnpm typecheck && pnpm build` pass.

---

### Phase 1 — Auth Route Group & Shared Layout

- GOAL-002: Create the `(auth)` route group with a shared centered layout that works within the existing global app shell and verify route protection configuration.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Create `apps/web/app/(auth)/layout.tsx` as a **server component** that centers auth content **within the existing root shell**. Because `apps/web/app/layout.tsx` already renders `Navbar`, this layout should style the auth card area inside the current `<main>` region rather than assuming a fully isolated full-screen shell. Use a max-w-md auth card container, centered content, subtle background treatment, dark-mode compatibility, and brand framing that still looks correct with the global navbar present. | | |
| TASK-010 | Verify `apps/web/proxy.ts` does NOT protect `(auth)` routes and confirm no root-layout split is required for Module 2. `/sign-in`, `/sign-up`, and `/sso-callback` must remain public; the Module 2 auth layout will coexist with the global navbar rather than introducing a separate root layout. | | |

**Phase 1 completion criteria:** `(auth)` layout file exists, renders correctly inside the current root shell, and auth routes remain unprotected in `proxy.ts`.

---

### Phase 2 — Custom Sign-Up Page (depends on Phase 1)

- GOAL-003: Build a fully custom sign-up page with email+password registration, Google OAuth, email code verification, and bot protection. Redirect to `/onboarding` on success.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Create `apps/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — a `'use client'` component using `useSignUp` from `@clerk/nextjs`. Implement a two-step form: **Step 1** — collect email address and password with a "Create account" submit button, plus a "Continue with Google" OAuth button separated by a styled divider. **Step 2** — email verification code input with "Verify" button and "Resend code" link. Flow: `signUp.password({ emailAddress, password })` → on success: `signUp.verifications.sendEmailCode()` → display code input → `signUp.verifications.verifyEmailCode({ code })` → on `signUp.status === 'complete'`: `signUp.finalize({ navigate: ({ session, decorateUrl }) => { if (session?.currentTask) { router.push('/sign-up/tasks'); return } const url = decorateUrl('/onboarding'); if (url.startsWith('http')) { window.location.href = url } else { router.push(url) } } })`. Use `useRouter` from `next/navigation` for navigation. | | |
| TASK-012 | Add `<div id="clerk-captcha" />` inside the sign-up form JSX (before or after the submit button). This is required for Clerk's bot protection in custom sign-up flows. Clerk injects a challenge widget into this element automatically. | | |
| TASK-013 | Wire Google OAuth sign-up button: on click, call `signUp.sso({ strategy: 'oauth_google', redirectCallbackUrl: '/sso-callback', redirectUrl: '/sign-up/tasks' })`. Handle errors from the SSO call. The button triggers a redirect to Google's consent screen; the user returns to `/sso-callback` after auth. | | |
| TASK-014 | Style the sign-up page using existing shadcn/ui components: `Card` + `CardHeader` + `CardContent` + `CardFooter` from `@workspace/ui/components/card`, `Input` from `@workspace/ui/components/input`, `Button` from `@workspace/ui/components/button`, `Label` from `@workspace/ui/components/label`, `Separator` from `@workspace/ui/components/separator`. Use Phosphor `GoogleLogo` icon for the OAuth button. Include a "Already have an account? Sign in" link in the card footer pointing to `/sign-in`. | | |
| TASK-015 | Add client-side Zod validation for the sign-up form: `emailSchema` (valid email format via `z.string().email()`) and `passwordSchema` (min 8 chars via `z.string().min(8, 'Password must be at least 8 characters')`). Place these schemas in `packages/ui/src/lib/validations.ts` if not already present, or use inline validation. Display validation errors below each field before submitting to Clerk. | | |
| TASK-016 | Implement Clerk error handling: destructure `errors` and `fetchStatus` from `useSignUp()`. Display field-level errors from `errors.fields.emailAddress`, `errors.fields.password`, and `errors.fields.code` inline below respective inputs. Display global errors from `errors.global` at the top or bottom of the form. Disable the submit button when `fetchStatus === 'fetching'` and show a loading spinner. | | |

**Phase 2 completion criteria:** Sign-up page renders at `/sign-up` with email+password form, Google OAuth button, email verification step, bot protection captcha element. Successful sign-up redirects to `/onboarding`. Errors display inline. Dark mode and mobile (375px) render correctly.

**Architecture notes:**
- The `[[...sign-up]]` optional catch-all segment handles Clerk's internal routing for verification steps and session tasks. It allows `/sign-up`, `/sign-up/verify`, `/sign-up/tasks`, etc. to all render this page.
- Clerk v7 hooks pattern: `const { signUp, errors, fetchStatus } = useSignUp()` — no `isLoaded` check or `setActive` call needed. The `finalize()` method handles session activation.
- The `decorateUrl()` function from `finalize()`'s navigate callback ensures proper URL decoration for Clerk's session management. The implementation must still handle absolute URLs via `window.location.href` and relative URLs via `router.push()`.

---

### Phase 3 — Custom Sign-In Page (depends on Phase 1, parallel with Phase 2)

- GOAL-004: Build a fully custom sign-in page with email+password authentication and Google OAuth. Redirect to `/dashboard` on success.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Create `apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — a `'use client'` component using `useSignIn` from `@clerk/nextjs`. Form: email address input, password input, "Sign in" submit button, "Continue with Google" OAuth button with divider. Flow: `signIn.password({ emailAddress, password })` → if `signIn.status === 'complete'`: `signIn.finalize({ navigate: ({ session, decorateUrl }) => { if (session?.currentTask) { router.push('/sign-in/tasks'); return } const url = decorateUrl('/dashboard'); if (url.startsWith('http')) { window.location.href = url } else { router.push(url) } } })`. | | |
| TASK-018 | Wire Google OAuth sign-in button: on click, call `signIn.sso({ strategy: 'oauth_google', redirectCallbackUrl: '/sso-callback', redirectUrl: '/sign-in/tasks' })`. This redirects the user to Google, then back to `/sso-callback`. | | |
| TASK-019 | Handle non-complete statuses deterministically: if `signIn.status === 'needs_second_factor'`, display a message such as "Two-factor authentication is required. Please contact support." (MFA is not fully implemented in MVP, but the unsupported state must be surfaced clearly). If `signIn.status === 'needs_client_trust'`, treat it as a real subflow: find the `email_code` factor in `signIn.supportedSecondFactors`, call `signIn.mfa.sendEmailCode()`, render a verification-code form, allow resend/start-over actions, and finalize only after `signIn.mfa.verifyEmailCode({ code })` completes. | | |
| TASK-020 | Style the sign-in page matching the sign-up layout: same `Card` structure, same brand colors, same responsive behavior. Include "Don't have an account? Sign up" link in the card footer pointing to `/sign-up`. Include a "Forgot password?" link (can point to Clerk's default reset flow URL or be deferred — for MVP, link to `#` with a tooltip "Coming soon"). | | |
| TASK-021 | Implement Clerk error handling: display `errors.fields.identifier` below the email input, `errors.fields.password` below the password input. Display `errors.global` at the top. Disable button when `fetchStatus === 'fetching'`. | | |

**Phase 3 completion criteria:** Sign-in page renders at `/sign-in` with email+password form and Google OAuth button. Successful sign-in redirects to `/dashboard`. Errors display inline. Matches sign-up page styling. Dark mode and mobile render correctly.

---

### Phase 4 — SSO Callback Page (depends on Phase 2 & 3)

- GOAL-005: Handle the OAuth redirect after Google authentication completes. Required for the custom SSO flow — both sign-in and sign-up OAuth flows redirect here.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Create `apps/web/app/(auth)/sso-callback/page.tsx` — a `'use client'` component that processes the OAuth redirect. Import `useSignIn`, `useSignUp` from `@clerk/nextjs` and `useRouter` from `next/navigation`. Use a `useRef(hasRun)` guard to prevent double-execution in React strict mode. In a `useEffect`, check: 1) if `signIn.status === 'complete'`, call `signIn.finalize({ navigate })` with redirect to `/dashboard`, 2) if `signUp.status === 'complete'`, call `signUp.finalize({ navigate })` with redirect to `/onboarding`. In both callbacks, handle `session?.currentTask` explicitly and support both relative and absolute `decorateUrl()` results. Display a centered loading spinner and "Completing sign in..." text while processing. | | |
| TASK-023 | Handle the transfer flow deterministically: when a user clicks "Sign in with Google" but has no existing account, Clerk may create a new sign-up instead. Detect this by checking if `signUp.status === 'complete'` while `signIn.status` is not complete, then finalize via `signUp.finalize()` and redirect to `/onboarding`. If `signUp.status === 'missing_requirements'`, **do not silently log and continue** — surface a clear unsupported-state message, include the missing fields in debug logging, and route the user back to `/sign-up` with guidance. Module 2 explicitly does not add a full continuation form unless Clerk Dashboard settings later require it. | | |
| TASK-024 | Handle error states: if neither `signIn` nor `signUp` reaches `complete` status after a reasonable time, display an error message with a "Try again" button that navigates back to `/sign-in`. Catch any errors from `finalize()` calls and display them. | | |

**Phase 4 completion criteria:** Google OAuth sign-in → redirected through `/sso-callback` → lands on `/dashboard`. Google OAuth sign-up → redirected through `/sso-callback` → lands on `/onboarding`. Loading spinner displays during processing. Errors handled gracefully.

---

### Phase 5 — Onboarding Redirect Logic (depends on Phase 0)

- GOAL-006: Users who haven't completed onboarding are server-side redirected from `/dashboard` to `/onboarding` before any dashboard UI renders. Placeholder pages created for both routes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-025 | Create `apps/web/app/dashboard/layout.tsx` — a **server component** that enforces the onboarding gate. Logic: 1) call `auth()` from `@clerk/nextjs/server` to get `userId`, 2) if no `userId`, call `redirect('/sign-in')` (shouldn't happen since proxy.ts protects, but defense in depth), 3) call `getCurrentUser()` from `@/lib/auth` to get the DB user, 4) if DB user is `null` (webhook race condition — Clerk session exists but webhook hasn't created the DB row yet), redirect to `/onboarding` as a safe fallback, 5) if DB user exists and `onboardingCompleted === false`, call `redirect('/onboarding')`, 6) otherwise render `{children}` normally. Document in code comments that Module 3 owns any retry / DB-row recovery behavior for the webhook-race path; Module 2 does not create the user row synchronously here. | | |
| TASK-026 | Create `apps/web/app/dashboard/page.tsx` — a simple server component placeholder: display a centered heading "Dashboard" with subtext "Coming in Module 4" using the design system typography. This ensures the `/dashboard` route exists for testing the layout redirect. | | |
| TASK-027 | Create `apps/web/app/onboarding/layout.tsx` — a simple server component layout that wraps onboarding pages. Can be minimal (just renders `{children}`) or include a step progress indicator header. For now, keep it minimal. This route is already protected by `proxy.ts`. | | |
| TASK-028 | Create `apps/web/app/onboarding/page.tsx` — a simple server component placeholder: display a centered heading "Onboarding" with subtext "Coming in Module 3". This ensures the `/onboarding` route exists for testing redirect logic. | | |

**Phase 5 completion criteria:** Visiting `/dashboard` when `onboardingCompleted === false` (or when no DB user exists) redirects to `/onboarding` server-side. Visiting `/dashboard` when `onboardingCompleted === true` renders the placeholder dashboard page. Both placeholder pages render correctly.

---

### Phase 6 — Username Availability API (parallel with Phase 5)

- GOAL-007: Build a real-time username validation API endpoint that Module 3 (onboarding) will consume for live username availability checking.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-029 | Create `apps/web/app/api/users/check-username/route.ts` — a GET endpoint that accepts a `?username=` query parameter and returns a JSON response `{ available: boolean, reason?: string }`. Implementation: 1) call `auth()` from `@clerk/nextjs/server` and verify `userId` exists (return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` if not), 2) extract and lowercase the `username` param from `req.nextUrl.searchParams`, 3) validate format with the **shared canonical** `usernameSchema`, 4) check against the canonical reserved-name helper `isReservedUsername(username)` from `@workspace/database/constants/reserved-usernames` — if reserved return `{ available: false, reason: 'This username is reserved' }`, 5) query DB: `db.query.users.findFirst({ where: eq(users.username, username) })` — if exists return `{ available: false, reason: 'This username is already taken' }`, 6) if all checks pass return `{ available: true }`. | | |
| TASK-030 | Tighten `usernameSchema` in `packages/ui/src/lib/validations.ts` so it matches Product Plan rules exactly: `z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^[a-z0-9][a-z0-9_-]{1,18}[a-z0-9]$/, 'Username must start and end with a letter or number, and can only contain lowercase letters, numbers, hyphens, and underscores')`. Remove reserved-name drift so client validation and the API route share the same reserved-name source of truth. | | |
| TASK-031 | Add `emailSchema` and `passwordSchema` to `packages/ui/src/lib/validations.ts` if not already present. `emailSchema`: `z.string().email('Please enter a valid email address')`. `passwordSchema`: `z.string().min(8, 'Password must be at least 8 characters')`. These are consumed by the sign-up page (Phase 2) and future forms. | | |

**Phase 6 completion criteria:** `GET /api/users/check-username?username=admin` returns `{ available: false, reason: 'This username is reserved' }`. `GET /api/users/check-username?username=validname123` returns `{ available: true }`. Unauthenticated requests return 401. Invalid format returns `{ available: false, reason: '...' }`.

---

### Phase 7 — Auth State Helpers & Webhook Verification (parallel with Phase 5)

- GOAL-008: Ensure auth state access patterns are complete for both server and client contexts. Verify webhook handler compatibility with schema changes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-032 | Add `requireCurrentUser()` to `apps/web/lib/auth.ts`. Implementation: `export async function requireCurrentUser(): Promise<User> { const { userId } = await auth(); if (!userId) redirect('/sign-in'); const user = await getCurrentUser(); if (!user) redirect('/onboarding'); return user; }`. Import `redirect` from `next/navigation` and `auth` from `@clerk/nextjs/server`. This is a convenience helper for server components that always need a non-null user — avoids repetitive null checks in every protected page. | | |
| TASK-033 | Verify `getCurrentUser()` in `apps/web/lib/auth.ts` works correctly with the updated schema. The return type `User` is inferred from the Drizzle schema via `$inferSelect`, so the 10 new columns will automatically appear and be nullable. No code changes expected — just confirm `pnpm typecheck` passes and the function signature remains `Promise<User \| null>`. | | |
| TASK-034 | Verify the webhook handler at `apps/web/app/api/webhooks/clerk/route.ts` handles the new schema fields correctly. Confirm: `user.created` inserts only Clerk-managed fields (`clerkId`, `email`, `emailVerified`, `fullName`, `avatarUrl`) — it should NOT set any profile fields (those come from onboarding). `user.updated` upserts only Clerk-managed fields. The current `.onConflictDoUpdate` `set` object should not include profile fields. All 10 new nullable columns will default to `null` on insert, which is correct. Mark as verified if no changes needed. | | |
| TASK-035 | Verify and synchronize Clerk auth-route environment variables across both `docs/impl-plan/vercel-env-vars.md` and `/.env.example`: `CLERK_PUBLISHABLE_KEY` (required, client-visible), `CLERK_SECRET_KEY` (required, server-only), `CLERK_WEBHOOK_SIGNING_SECRET` (required, server-only), canonical auth routes `/sign-in` and `/sign-up`, and fallback redirects `/dashboard` and `/onboarding`. Confirm whether the app expects `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, server-only aliases, or both, and document the chosen convention explicitly so Clerk does not fall back to non-existent `/login` or `/signup` routes. | | |
| TASK-036 | Document the Clerk Dashboard configuration steps (manual verification, not code): 1) enable Google OAuth provider in Clerk Dashboard → User & Authentication → Social Connections, 2) enable email+password sign-up in Clerk Dashboard → User & Authentication → Email, Phone, Username, 3) add webhook endpoint `https://<domain>/api/webhooks/clerk` in Clerk Dashboard → Webhooks, subscribe to `user.created`, `user.updated`, `user.deleted` events, 4) verify `CLERK_WEBHOOK_SIGNING_SECRET` matches the webhook endpoint's signing secret. Add these steps as a verification note in this plan (not a code task). | | |

**Phase 7 completion criteria:** `requireCurrentUser()` exported from `apps/web/lib/auth.ts`. Webhook handler verified compatible with schema changes. Environment variables documentation complete and accurate.

---

### Phase 8 — Integration Verification & Build Validation

- GOAL-009: End-to-end validation that all Module 2 components work together. Verify the full auth flow and build pipeline.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-037 | Run `pnpm typecheck` from repo root — must pass with zero errors across all packages. | | |
| TASK-038 | Run `pnpm build` from repo root — must complete successfully. Verify the Next.js build output includes the public routes `/sign-in`, `/sign-up`, `/sso-callback`, `/dashboard`, `/onboarding`, and `/api/users/check-username` (route groups like `(auth)` should not appear in the public route path). | | |
| TASK-039 | Run `pnpm lint` from repo root — must pass (Biome linting). Fix any lint errors introduced by new files. | | |
| TASK-040 | Manual integration test: start the dev server (`pnpm dev`), navigate to `/sign-up`, verify the custom form renders with email fields and Google button. Navigate to `/sign-in`, verify the same. Navigate to `/dashboard` (unauthenticated) — should redirect into the Clerk sign-in flow via `proxy.ts` and land on the app's canonical sign-in route. | | |
| TASK-041 | Manual integration test (authenticated): sign up with a test email, verify the email code step works, verify redirect to `/onboarding`. Sign in with the test account, verify redirect to `/dashboard`. Test Google OAuth flow end-to-end. | | |
| TASK-042 | Verify auth pages render correctly in dark mode (toggle theme) and at mobile viewport widths (375px, 390px, 414px). | | |

**Phase 8 completion criteria:** All three build validation commands pass (`typecheck`, `build`, `lint`). Manual auth flow works end-to-end for email and Google OAuth. Pages render correctly in dark mode and mobile viewports.

---

## 3. Alternatives

- **ALT-001**: **Clerk prebuilt `<SignIn />`/`<SignUp />` components with appearance customization** — Faster to ship, less code to maintain, automatic handling of MFA/verification steps. Not chosen because the user explicitly chose fully custom UI with Clerk hooks for complete brand control and design flexibility.
- **ALT-002**: **Middleware-based onboarding redirect (in `proxy.ts`)** — Could check onboarding status in the Clerk middleware itself. Not chosen because it would require a DB call inside middleware (adds latency to every protected route request, not just dashboard). Server-side check in the dashboard layout is more targeted and only runs when the dashboard is actually visited.
- **ALT-003**: **Client-side onboarding redirect via `useEffect` in dashboard layout** — Simpler but causes a flash of dashboard content before redirect. Not chosen because server-side redirect is cleaner UX (no layout shift or flash).
- **ALT-004**: **Top-level `/sign-in` and `/sign-up` routes without a shared layout** — Would duplicate the centered card layout in each page. Not chosen because the `(auth)` route group with a shared layout is DRY and follows Next.js App Router conventions.
- **ALT-005**: **`middleware.ts` for route protection** — The standard Next.js approach. Not chosen because the project uses Next.js 16's `proxy.ts` pattern per `CON-001` in the project guidelines.

---

## 4. Dependencies

- **DEP-001**: `@clerk/nextjs@^7.0.6` — already installed in `apps/web/package.json`. Provides `useSignIn`, `useSignUp`, `useClerk`, `useAuth`, `auth()`, `verifyWebhook`, `clerkMiddleware`, `createRouteMatcher`, `UserButton`.
- **DEP-002**: `@workspace/database` — shared database package. Provides `db` client, `users` schema, `User`/`NewUser` types, `isReservedUsername()` utility.
- **DEP-003**: `@workspace/ui` — shared UI component library. Provides `Card`, `Input`, `Button`, `Label`, `Separator`, `Skeleton`, and other shadcn/ui components. Also provides `validations.ts` for shared Zod schemas.
- **DEP-004**: `next-themes` — already installed. Provides dark mode support for auth pages via `ThemeProvider`.
- **DEP-005**: `zod` — already installed (used by `@workspace/ui`). Used for form validation schemas.
- **DEP-006**: `drizzle-orm` + `drizzle-kit` — already installed in `packages/database`. Required for migration generation (Phase 0).
- **DEP-007**: `@neondatabase/serverless` — already installed. Database client driver.
- **DEP-008**: `@phosphor-icons/react` — already installed. Provides `GoogleLogo` icon for OAuth buttons.

---

## 5. Files

### New Files

- **FILE-001**: `apps/web/app/(auth)/layout.tsx` — Shared auth page layout (centered card, brand logo, dark mode)
- **FILE-002**: `apps/web/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Custom sign-up page (email+password, Google OAuth, email verification)
- **FILE-003**: `apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Custom sign-in page (email+password, Google OAuth)
- **FILE-004**: `apps/web/app/(auth)/sso-callback/page.tsx` — OAuth callback handler
- **FILE-005**: `apps/web/app/dashboard/layout.tsx` — Dashboard layout with onboarding redirect gate
- **FILE-006**: `apps/web/app/dashboard/page.tsx` — Placeholder dashboard page
- **FILE-007**: `apps/web/app/onboarding/layout.tsx` — Minimal onboarding layout
- **FILE-008**: `apps/web/app/onboarding/page.tsx` — Placeholder onboarding page
- **FILE-009**: `apps/web/app/api/users/check-username/route.ts` — Username availability check API
- **FILE-010**: `packages/database/drizzle/*.sql` — Regenerated or follow-up migration file(s), depending on the `bio` cleanup strategy chosen in Phase 0

### Modified Files

- **FILE-011**: `packages/database/src/schema/users.ts` — Remove `bio` and verify the existing profile fields and discovery index remain aligned with Product Plan §8.2
- **FILE-012**: `packages/ui/src/lib/validations.ts` — Add `usernameSchema`, `emailSchema`, `passwordSchema` if not present
- **FILE-013**: `apps/web/lib/auth.ts` — Add `requireCurrentUser()` helper
- **FILE-014**: `docs/impl-plan/vercel-env-vars.md` — Verify/update Clerk env var documentation
- **FILE-015**: `.env.example` — Sync canonical Clerk auth-route defaults with the docs and runtime behavior
- **FILE-016**: `packages/database/src/constants/reserved-usernames.ts` — Keep the canonical reserved-name list aligned with shared validation and API behavior

### Verified (No Changes Expected)

- **FILE-017**: `apps/web/proxy.ts` — Verify auth routes remain unprotected
- **FILE-018**: `apps/web/app/api/webhooks/clerk/route.ts` — Verify compatibility with new schema
- **FILE-019**: `packages/database/src/types.ts` — Verify type exports auto-update correctly
- **FILE-020**: `packages/database/src/schema/fts-index.sql` — Verify FTS covers all 4 required columns
- **FILE-021**: `apps/web/components/navbar.tsx` — Already auth-aware (links to `/sign-in` and `/sign-up`)
- **FILE-022**: `apps/web/app/layout.tsx` — Already has `ClerkProvider` as outermost provider and constrains auth-shell behavior

---

## 6. Testing

- **TEST-001**: `pnpm typecheck` passes from repo root with zero errors after all schema changes and new files.
- **TEST-002**: `pnpm build` completes successfully. Verify build output includes routes: `/sign-in`, `/sign-up`, `/sso-callback`, `/dashboard`, `/onboarding`, `/api/users/check-username`.
- **TEST-003**: `pnpm lint` passes (Biome) with no errors on new files.
- **TEST-004**: Navigate to `/sign-up` → custom sign-up form renders with email, password fields, and "Continue with Google" button. Dark mode toggle works. Mobile (375px) renders correctly.
- **TEST-005**: Navigate to `/sign-in` → custom sign-in form renders with email, password fields, and "Continue with Google" button. "Don't have an account? Sign up" link navigates to `/sign-up`.
- **TEST-006**: Sign up with email + password → email verification code step appears → enter code → redirected to `/onboarding`.
- **TEST-007**: Sign in with existing account email + password → redirected to `/dashboard`.
- **TEST-008**: Sign up with Google → redirected through `/sso-callback` → lands on `/onboarding` (new user).
- **TEST-009**: Sign in with Google (existing account) → redirected through `/sso-callback` → lands on `/dashboard`.
- **TEST-010**: Visit `/dashboard` when `onboardingCompleted === false` → server-side redirect to `/onboarding` (no flash of dashboard content).
- **TEST-011**: Visit `/dashboard` when `onboardingCompleted === true` → placeholder dashboard page renders.
- **TEST-012**: `GET /api/users/check-username?username=admin` → returns `{ available: false, reason: 'This username is reserved' }`.
- **TEST-013**: `GET /api/users/check-username?username=newuser123` (unique) → returns `{ available: true }`.
- **TEST-014**: `GET /api/users/check-username?username=ab` (too short) → returns `{ available: false, reason: '...' }` with validation error.
- **TEST-015**: `GET /api/users/check-username` without auth header → returns 401 Unauthorized.
- **TEST-016**: Webhook test: create a user via Clerk Dashboard → verify a row appears in the `users` table with correct `clerk_id`, `email`, `emailVerified`, `fullName`, `avatarUrl`. All 10 new profile columns should be `null`.
- **TEST-017**: Auth pages render correctly in dark mode (toggle theme via navbar).
- **TEST-018**: Auth pages render correctly at mobile viewports: 375px, 390px, 414px.
- **TEST-019**: Migration file(s) exist in `packages/database/drizzle/` after the Phase 0 cleanup. The final migration state reflects `bio` removal and the expected discovery/search indexes.
- **TEST-020**: Auth shell verification: `/sign-in`, `/sign-up`, and `/sso-callback` render correctly with the existing global navbar present and without broken spacing/layout regressions.
- **TEST-021**: Env-route verification: the configured/default Clerk sign-in and sign-up URLs resolve to `/sign-in` and `/sign-up`, not `/login` or `/signup`.
- **TEST-022**: Client-trust verification: sign-in on a new client that triggers `needs_client_trust` shows an email-code verification step with resend/start-over behavior instead of failing silently.
- **TEST-023**: OAuth unsupported-requirements verification: if Clerk returns `missing_requirements` after SSO, the callback page shows a deterministic error/fallback path rather than looping or hanging.

---

## 7. Risks & Assumptions

- **RISK-001**: **Webhook race condition** — When a user first signs up, the Clerk webhook that creates the DB row may not have fired by the time the user is redirected to `/dashboard` or `/onboarding`. Mitigation: the dashboard layout treats "no DB user" as "redirect to onboarding" instead of erroring. The onboarding flow (Module 3) should be resilient to the user row not existing yet and retry or wait.
- **RISK-002**: **`bio` column removal** — If the Neon dev database already has data with the `bio` column populated, the migration that drops `bio` will lose that data. Mitigation: this is a dev-only database for an MVP that hasn't launched. If there's data to preserve, a custom migration step can copy `bio` → `story` before dropping the column.
- **RISK-003**: **Clerk v7 hook API stability** — The `signIn.password()` / `signIn.finalize()` pattern is current as of `@clerk/nextjs@^7.0.6`, but Clerk iterates quickly. If a minor version changes the API shape, the custom sign-in/sign-up pages may need updates. Mitigation: pin Clerk version for stability, test after upgrades.
- **RISK-004**: **Google OAuth configuration** — The Google OAuth flow requires proper configuration in both Clerk Dashboard and Google Cloud Console (OAuth client ID, authorized redirect URIs). Misconfiguration results in silent failures. Mitigation: TASK-036 includes manual verification steps.
- **RISK-005**: **SSO callback double execution** — React strict mode in development can cause the `useEffect` in the SSO callback to run twice, potentially causing errors. Mitigation: `useRef(hasRun)` guard pattern prevents double execution (TASK-022).
- **RISK-006**: **Auth shell mismatch** — Because the root layout always renders `Navbar`, auth pages can look visually wrong if the `(auth)` layout assumes a standalone full-screen shell. Mitigation: Phase 1 explicitly keeps auth pages inside the existing app shell.
- **RISK-007**: **Env route drift** — If `/.env.example`, docs, and Clerk runtime config are not synchronized, Clerk can redirect users to non-existent `/login` or `/signup` routes. Mitigation: Phase 0 and TASK-035 explicitly synchronize and verify auth-route variables.
- **RISK-008**: **OAuth missing requirements** — If Clerk Dashboard settings later require extra fields during OAuth sign-up, the MVP fallback path in Phase 4 will not fully complete onboarding. Mitigation: make the unsupported state explicit now and add a continuation form in a later module only if the dashboard configuration demands it.
- **ASSUMPTION-001**: The project is using Clerk v7 (`@clerk/nextjs@^7.0.6`). All hook patterns (`useSignIn`, `useSignUp`, `finalize()`) are specific to this version. Core 2 patterns (`create`, `prepareFirstFactor`, `setActive`) must NOT be used.
- **ASSUMPTION-002**: MFA / two-factor authentication is NOT enabled in the Clerk Dashboard for MVP. The sign-in flow handles `needs_second_factor` gracefully but does not implement a full MFA UI.
- **ASSUMPTION-003**: Password reset uses Clerk's built-in flow. No custom password reset UI is planned for MVP. Users click "Forgot password?" which can link to Clerk's hosted reset page or be deferred.
- **ASSUMPTION-004**: The Neon dev database is empty or has no production data. Schema migration (dropping `bio`, adding columns) can run without data migration concerns.
- **ASSUMPTION-005**: The repository already has an initial Drizzle migration in `packages/database/drizzle/`; Phase 0 will either regenerate that initial migration or add a follow-up migration depending on the current Neon dev database state.
- **ASSUMPTION-006**: Clerk handles email verification infrastructure when using the custom hooks pattern — the app only needs to call `signUp.verifications.sendEmailCode()` and `signUp.verifications.verifyEmailCode({ code })`. No custom email sending infrastructure is needed.
- **ASSUMPTION-007**: Clerk Dashboard settings for MVP will not require additional sign-up fields beyond what the custom email/password and Google OAuth flows already collect. If that changes, Module 2 will need a continuation form instead of the explicit unsupported-state fallback in Phase 4.

---

## 8. Related Specifications / Further Reading

- `docs/core-plan/requirements-overview.md` — Module 2 requirements overview and dependency map
- `docs/core-plan/product-plan.md` — §7.1 Onboarding Flow, §8.1 Tech Stack (Auth), §8.2 Database Schema (users table), §10 Routes, §16 Resolved Decisions (#6, #12, #19), §18 Security
- `docs/core-plan/design-system.md` — §2 Technology Stack, §12 Component Styling Guide
- `docs/impl-plan/infrastructure-module-0-workspace-setup-1.md` — Module 0 closeout items affecting this plan
- `docs/impl-plan/feature-app-shell-shared-ui-module-1.md` — Module 1 handoff notes on auth-aware navbar (TASK-033)
- `docs/impl-plan/vercel-env-vars.md` — Environment variable reference
- Clerk Docs: Custom sign-in flow — https://clerk.com/docs/guides/development/custom-flows/authentication/email-password
- Clerk Docs: OAuth connections — https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections
- Clerk Docs: Webhooks — https://clerk.com/docs/webhooks/overview
