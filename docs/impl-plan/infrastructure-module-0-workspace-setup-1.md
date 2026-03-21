---
goal: Module 0 — Workspace & Infrastructure Setup
version: 1.1
date_created: 2026-03-21
last_updated: 2026-03-21
owner: ZealerProfile
tags: [infrastructure, architecture, module-0, canonical]
---

# Introduction

Transform the existing Turborepo scaffold (Next.js 16 + Tailwind v4 + shadcn/ui) into a fully configured, deployable skeleton with infrastructure wired end-to-end before feature work begins.

This document is the **canonical implementation specification** for Module 0 and supersedes earlier recommendations that were based on provisional assumptions. It incorporates the current workspace state plus updated guidance from the official documentation for Next.js 16, Clerk Core 3, Tailwind CSS v4, Drizzle + Neon, and PostHog as reviewed on **2026-03-21**.

**Current state:** Working monorepo with Next.js 16.1.6, React 19.2.4, Tailwind v4.1.18, shadcn/ui using `base-maia` (BaseUI primitives), Phosphor Icons, Biome 2.4.8, `next-themes` dark mode with hotkey toggle, neutral OKLCH theme, incorrect fonts (`Inter` + `Geist_Mono`), no database package, no auth, no storage abstraction, no analytics.

**Target state:** Brand-themed design system (lime/azure/purple OKLCH tokens, Outfit/Inter/JetBrains Mono fonts, custom shadows/gradients/radius), 2 shared packages (`packages/database/`, `packages/storage/`), Neon database schema + migrations, Clerk auth with `proxy.ts` route protection and webhook user sync, Cloudflare R2 presigned upload abstraction, stable PostHog client instrumentation with consent-gated persistence, and all required environment variables documented and wired. Homepage renders with brand colors and correct fonts. `/dashboard` and `/onboarding` are protected. Clerk webhook events create/update/delete rows in the `users` table.

**Final decisions confirmed for this version:**

- Neon database schema + app query client remain in shared package `packages/database/`
- Storage abstraction remains in shared package `packages/storage/`
- **Storage implementation uses AWS SDK v3 presigned uploads for Cloudflare R2** instead of `next-s3-upload`
- **Auth route protection uses `apps/web/proxy.ts`** for Next.js 16 file conventions
- **Webhook verification uses Clerk `verifyWebhook()` with `CLERK_WEBHOOK_SIGNING_SECRET`**
- **Neon runtime queries use pooled `DATABASE_URL`; migrations use `DIRECT_URL`**
- PostHog setup remains in Module 0, but uses the **stable** `posthog-js` integration path, not pre-release `@posthog/next`
- The current `base-maia` shadcn/BaseUI setup is retained and updated **in place**; no destructive re-init is part of the baseline plan

---

## 1. Requirements & Constraints

### Functional Requirements

- **REQ-001**: All OKLCH brand colors (lime 11-stop scale, azure 11-stop scale, purple 11-stop scale) defined in `packages/ui/src/styles/globals.css` using Tailwind v4 `@theme` variables and existing semantic mappings.
- **REQ-002**: shadcn/ui semantic CSS variables (`:root` and `.dark`) mapped to the brand palette per Design System §4.6 — `--primary` → lime-500, `--primary-foreground` → slate-900, `--secondary` → azure-500, `--ring` → lime-400.
- **REQ-003**: Fonts loaded via `next/font/google` in `apps/web/lib/fonts.ts` — Outfit (600, 700, 800), Inter (400, 500, 600), JetBrains Mono (500, 600). CSS variables `--font-display`, `--font-body`, and `--font-mono` applied to `<html>`.
- **REQ-004**: Full database schema for 4 tables (`users`, `personal_records`, `highlights`, `achievements`) with UUID primary keys and `TIMESTAMPTZ` timestamps matching Product Plan §8.2 plus `users.onboarding_completed`.
- **REQ-005**: All required indexes implemented, including unique indexes on `users.username` and `users.clerk_id`, `users.updated_at`, child-table `user_id` indexes, and a GIN full-text search index for user discovery.
- **REQ-006**: Route protection implemented via `apps/web/proxy.ts`, protecting `/dashboard(.*)` and `/onboarding(.*)` while leaving all other routes public.
- **REQ-007**: Webhook endpoint at `/api/webhooks/clerk` syncs Clerk `user.created`, `user.updated`, and `user.deleted` events into the `users` table.
- **REQ-008**: Storage abstraction in `packages/storage/` issues presigned upload URLs for Cloudflare R2. Feature code imports from `@workspace/storage/client` or `@workspace/storage/server` and never calls R2 APIs directly.
- **REQ-009**: PostHog client initialization uses stable `posthog-js` integration with `persistence: "memory"` by default until cookie consent exists. `identifyUser()` and `trackEvent()` helpers must respect consent state.
- **REQ-010**: Dark mode works from Day 1 using `next-themes` with `attribute="class"`, `defaultTheme="system"`, and no visible FOUC.
- **REQ-011**: Border radius scale per Design System §7 — `sm: 6px`, base: `8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `2xl: 32px`, `3xl: 48px`.
- **REQ-012**: Shadow/elevation tokens (`e1`–`e5`, `inset`, `glow`) defined for light and dark modes and exposed as utilities via Tailwind theme variables.
- **REQ-013**: Gradient custom properties (`--gradient-hero`, `--gradient-card`, `--gradient-achievement`, `--gradient-overlay`) added as runtime CSS variables.
- **REQ-014**: Animation timing tokens added: `--ease-out-cubic`, `--ease-spring`, `--duration-micro`, `--duration-fast`, `--duration-base`, `--duration-slow`.
- **REQ-015**: Reserved username list blocks at minimum: `admin`, `dashboard`, `api`, `login`, `signup`, `settings`, `support`, `help`, `about`, `onboarding`, `card`, `terms`, `privacy`, `explore`, `search`.
- **REQ-016**: Chart color variables (`--chart-1` through `--chart-5`) mapped to brand colors.
- **REQ-017**: `apps/web/tsconfig.json` includes aliases for `@workspace/database/*` and `@workspace/storage/*` in addition to existing aliases.
- **REQ-018**: Environment documentation includes both pooled `DATABASE_URL` and direct `DIRECT_URL`.
- **REQ-019**: `apps/web/next.config.mjs` transpiles `@workspace/ui`, `@workspace/database`, and `@workspace/storage`.
- **REQ-020**: The plan remains executable without relying on pre-release dependencies or undocumented shadcn preset behavior.

### Security Requirements

- **SEC-001**: Webhook signature verification uses Clerk’s `verifyWebhook()` helper on every Clerk webhook request. Unverified requests return `400` or `401` and do not mutate the database.
- **SEC-002**: All database credentials, API keys, and secrets are stored only in environment variables. No hardcoded secrets in source.
- **SEC-003**: The webhook route remains public; authentication checks must not block external Clerk deliveries.
- **SEC-004**: The upload signing route validates file MIME type (`image/jpeg`, `image/png`, `image/webp`) and max size (`5MB`) before returning a signed URL.
- **SEC-005**: Upload keys are server-generated, sanitized, and never trust raw client filenames as storage keys.
- **SEC-006**: Client code receives only the values required to upload (`signedUrl`, `publicUrl`, headers). Secret access keys remain server-only.

### Constraints

- **CON-001**: Must use pnpm workspace protocol (`workspace:*`) for all internal package references.
- **CON-002**: TypeScript strict mode is mandatory and inherited from `@workspace/typescript-config/base.json`.
- **CON-003**: Biome 2.4.8 is the only formatter/linter; do not add ESLint or Prettier.
- **CON-004**: BaseUI primitives must remain the foundation for shadcn components; preserve the existing `base-maia` setup in `packages/ui/components.json`.
- **CON-005**: Package manager: pnpm 9.15.9. Node >= 20.
- **CON-006**: All new workspace packages must be ESM (`"type": "module"`).
- **CON-007**: Turbo UI mode remains `tui`; all tasks must work inside the Turborepo pipeline.
- **CON-008**: Next.js 16 file convention uses `proxy.ts`; do not introduce new `middleware.ts` files for this module.
- **CON-009**: Do not baseline pre-release `@posthog/next` in Module 0.
- **CON-010**: Do not use `next-s3-upload` in Module 0; use AWS SDK v3 presigning for Cloudflare R2.

### Patterns

- **PAT-001**: All font loading lives in `apps/web/lib/fonts.ts`. `<html>` receives the font variables in `apps/web/app/layout.tsx`.
- **PAT-002**: Database client is exported as a singleton from `packages/database/src/client.ts`. Table types are inferred with `$inferSelect` / `$inferInsert`.
- **PAT-003**: App queries use `drizzle-orm/neon-http` with pooled `DATABASE_URL`. Migrations and admin connectivity use `DIRECT_URL`.
- **PAT-004**: CSS custom properties live in `:root` and `.dark`, while Tailwind utility-generating theme variables are defined in `@theme inline {}`.
- **PAT-005**: Provider order in `apps/web/app/layout.tsx`: `<ClerkProvider>` → `<PostHogProvider>` → `<ThemeProvider>` → `{children}`.
- **PAT-006**: Upload flow is two-step: server issues a signed URL, client uploads with `fetch(PUT)`, then client stores the returned public URL/key.
- **PAT-007**: Clerk webhook handlers use idempotent database writes where possible and return non-2xx responses on failed writes so Clerk can retry.

---

## 2. Implementation Steps

### Phase 1: Design System Tokens & Font Corrections

- **GOAL-001**: Upgrade the existing BaseUI/shadcn design system in place to the ZealerProfile brand tokens without destructive re-initialization.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | **Back up edited UI files before token work**: Copy `packages/ui/src/styles/globals.css`, `packages/ui/src/components/button.tsx`, and `apps/web/app/layout.tsx` to `.bak` files before making any design-system changes. | | |
| TASK-002 | **Retain current shadcn/BaseUI configuration**: Do **not** run `shadcn init` as part of the default path. Keep `packages/ui/components.json` on `style: "base-maia"`, `iconLibrary: "phosphor"`, `rsc: true`, `tsx: true`, and the existing aliases. | | |
| TASK-003 | **Verify current Button compatibility**: Read `packages/ui/src/components/button.tsx`. If it already uses BaseUI `Button` primitives correctly, keep it and only update styles indirectly through tokens. Only regenerate the Button component if the existing component is incompatible with the token changes. | | |
| TASK-004 | **Create fonts module**: Create `apps/web/lib/fonts.ts` exporting `fontDisplay`, `fontBody`, and `fontMono` using `Outfit`, `Inter`, and `JetBrains_Mono` from `next/font/google` with the exact weights required by REQ-003 and `display: "swap"`. | | |
| TASK-005 | **Update root layout fonts and providers scaffold**: In `apps/web/app/layout.tsx`, remove `Geist_Mono` and direct `Inter` imports, import the shared fonts module, and update `<html className>` to `cn("antialiased", fontDisplay.variable, fontBody.variable, fontMono.variable)`. Preserve `suppressHydrationWarning`. | | |
| TASK-006 | **Add brand color scales to Tailwind theme variables**: In `packages/ui/src/styles/globals.css`, extend the existing `@theme inline {}` block with the full lime, azure, and purple token scales from the design system, while preserving all existing semantic mappings that shadcn generated. | | |
| TASK-007 | **Map font variables for Tailwind utilities**: In `@theme inline {}`, set `--font-heading: var(--font-display)`, `--font-sans: var(--font-body)`, and `--font-mono: var(--font-mono)` so Tailwind utilities resolve correctly. | | |
| TASK-008 | **Replace light-mode semantic variables**: Replace the `:root` block in `packages/ui/src/styles/globals.css` with the ZealerProfile light theme variable mapping, including primary/secondary/ring/card/sidebar/chart values. | | |
| TASK-009 | **Replace dark-mode semantic variables**: Replace the `.dark` block in `packages/ui/src/styles/globals.css` with the ZealerProfile dark theme variable mapping, preserving the same semantic variable names. | | |
| TASK-010 | **Add chart variables**: Add `--chart-1` through `--chart-5` mappings for both light and dark themes. | | |
| TASK-011 | **Add sidebar variables**: Add `--sidebar*` variables for both light and dark themes so future sidebar components inherit the correct brand styling. | | |
| TASK-012 | **Override radius scale**: Update the radius variables to match the design system while keeping `--radius` as the base semantic token. | | |
| TASK-013 | **Add shadows and expose them to Tailwind**: Add `--shadow-e1` through `--shadow-e5`, `--shadow-inset`, and `--shadow-glow` as runtime variables and corresponding Tailwind theme variables. | | |
| TASK-014 | **Add gradient runtime variables**: Add `--gradient-hero`, `--gradient-card`, `--gradient-achievement`, and `--gradient-overlay` to `:root`. Use explicit hex values for Satori/OG-image compatibility. | | |
| TASK-015 | **Add motion tokens**: Add `--ease-out-cubic`, `--ease-spring`, `--duration-micro`, `--duration-fast`, `--duration-base`, and `--duration-slow`. | | |
| TASK-016 | **Verify theme block integrity**: Confirm the `@theme inline {}` block still includes all semantic, sidebar, and chart mappings that generate Tailwind utilities. Remove no existing semantic mappings unless replaced by an equivalent canonical variable. | | |
| TASK-017 | **Verify dark mode and hotkey behavior**: Run the dev server and confirm the `d` hotkey still toggles themes, no FOUC appears, and the homepage visibly reflects the new brand colors. | | |

### Phase 2: Shared Database Package

- **GOAL-002**: Create `packages/database/` with Drizzle ORM, Neon runtime queries, committed schema definitions, and a deterministic migration workflow.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | **Create `packages/database/package.json`**: Name `@workspace/database`, set `type: "module"`, mark private, and add scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `typecheck`. Dependencies: `drizzle-orm`, `@neondatabase/serverless`. Dev dependencies: `drizzle-kit`, `typescript`, `@workspace/typescript-config`. Exports: `./client`, `./schema`, `./types`, `./constants/*`. | | |
| TASK-019 | **Create `packages/database/tsconfig.json`**: Extend `@workspace/typescript-config/base.json`, set `baseUrl: "."`, add `@workspace/database/*` path mapping, include `src`, exclude `node_modules`, `dist`, and `drizzle`. | | |
| TASK-020 | **Create `packages/database/drizzle.config.ts`**: Use `import "dotenv/config"` and `defineConfig()`. Point `schema` to `./src/schema/index.ts`, `out` to `./drizzle`, `dialect` to `postgresql`, and `dbCredentials.url` to `process.env.DIRECT_URL!`. The migration config must use the direct Neon connection string, not the pooled runtime URL. | | |
| TASK-021 | **Define `users` table**: Create `packages/database/src/schema/users.ts` with the full users schema, UUID PK, timestamps with timezone, `onboarding_completed`, and inferred select/insert types. | | |
| TASK-022 | **Define indexes and FTS support**: Add unique indexes for `clerk_id` and `username`, discovery/update indexes, and create `packages/database/src/schema/fts-index.sql` containing the GIN full-text search index SQL for users discovery. | | |
| TASK-023 | **Define `personal_records` table**: Create `packages/database/src/schema/personal-records.ts` with FK to `users.id`, timestamps, and `pr_user_id_idx`. | | |
| TASK-024 | **Define `highlights` table**: Create `packages/database/src/schema/highlights.ts` with FK to `users.id`, timestamps, and `highlights_user_id_idx`. | | |
| TASK-025 | **Define `achievements` table**: Create `packages/database/src/schema/achievements.ts` with FK to `users.id`, timestamps, and `achievements_user_id_idx`. | | |
| TASK-026 | **Define Drizzle relations**: Create `packages/database/src/schema/relations.ts` covering one-to-many relations from users to child tables and back. | | |
| TASK-027 | **Create schema barrel export**: Create `packages/database/src/schema/index.ts` re-exporting all schema and relation modules. | | |
| TASK-028 | **Create database runtime client**: Create `packages/database/src/client.ts` using `neon(process.env.DATABASE_URL!)` plus `drizzle({ client: sql, schema })` or equivalent supported Drizzle Neon HTTP syntax. Throw a clear error if `DATABASE_URL` is missing. | | |
| TASK-029 | **Create types export**: Create `packages/database/src/types.ts` exporting inferred select/insert types for all four tables. | | |
| TASK-030 | **Generate and apply initial migration**: Run `pnpm --filter @workspace/database db:generate`, inspect the generated SQL, then run `pnpm --filter @workspace/database db:migrate` using `DIRECT_URL`. After the base migration succeeds, apply `src/schema/fts-index.sql` using the direct database connection and record the exact verification command in the verification phase. `db:push` is allowed for local-only iteration, not as the canonical production migration path. | | |
| TASK-031 | **Register database package in the workspace**: Add `"@workspace/database": "workspace:*"` to `apps/web/package.json` **dependencies**, update `apps/web/tsconfig.json` paths, and run `pnpm install` from the repo root. | | |

### Phase 3: Authentication (Clerk)

- **GOAL-003**: Add Clerk auth to the Next.js app using current Clerk + Next.js 16 conventions, including protected routes and webhook-based user sync.

**Depends on:** Phase 2

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-032 | **Install Clerk**: Run `pnpm --filter web add @clerk/nextjs`. Do not add `svix` unless a later implementation step proves Clerk’s helper is insufficient. | | |
| TASK-033 | **Add `ClerkProvider` to root layout**: In `apps/web/app/layout.tsx`, wrap the body contents with `<ClerkProvider>` as the outermost app provider. Preserve the planned provider order from PAT-005. | | |
| TASK-034 | **Create `apps/web/proxy.ts`**: Implement route protection using `clerkMiddleware()` and `createRouteMatcher()` from `@clerk/nextjs/server`. Protect `/dashboard(.*)` and `/onboarding(.*)`. Export a `config.matcher` array compatible with Clerk’s current docs. Do not create `apps/web/middleware.ts`. | | |
| TASK-035 | **Create Clerk webhook route**: Create `apps/web/app/api/webhooks/clerk/route.ts`. Import `verifyWebhook` from `@clerk/nextjs/webhooks`, verify the incoming request using `CLERK_WEBHOOK_SIGNING_SECRET`, and return a non-2xx response if verification fails. | | |
| TASK-036 | **Implement `user.created` handler**: Insert a user row on `user.created`, extracting Clerk ID, primary email, verification status, full name, avatar URL, and a temporary onboarding username fallback. Prefer idempotent insert-or-ignore / insert-or-update logic if available in the chosen query implementation. | | |
| TASK-037 | **Implement `user.updated` handler**: Update the existing user row on `user.updated`, syncing only the fields needed by the app (`primary_email`, `email_verified`, `full_name`, `avatar_url`, `updated_at`). | | |
| TASK-038 | **Implement `user.deleted` handler**: Soft-delete the matching row on `user.deleted` by setting `is_deleted`, `deleted_at`, and `updated_at`. | | |
| TASK-039 | **Create auth helper module**: Create `apps/web/lib/auth.ts` exposing `getCurrentUser()` for server components and server actions. Resolve Clerk’s `userId` via `auth()` and query `@workspace/database` using `users.clerkId`. Return `null` if unauthenticated or missing from the DB. | | |

### Phase 4: File Storage Abstraction (Cloudflare R2 via AWS SDK)

- **GOAL-004**: Create `packages/storage/` with a durable Cloudflare R2 abstraction backed by AWS SDK v3 presigned uploads.

**Can run in parallel with Phase 3**

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-040 | **Create `packages/storage/package.json`**: Name `@workspace/storage`, set `type: "module"`, mark private, add `typecheck` script, and add dependencies `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Add `typescript` and `@workspace/typescript-config` as dev dependencies. Export `./client`, `./server`, and `./types`. | | |
| TASK-041 | **Create `packages/storage/tsconfig.json`**: Extend `@workspace/typescript-config/base.json`, set `baseUrl: "."`, add `@workspace/storage/*` path mapping, include `src`, exclude `node_modules` and `dist`. | | |
| TASK-042 | **Create storage types**: Create `packages/storage/src/types.ts` with `UploadIntent`, `SignedUploadPayload`, `UploadResult`, `StorageConfig`, and a `StorageService` interface supporting `createSignedUpload()`, `deleteFile()`, and `getPublicUrl()`. | | |
| TASK-043 | **Create server-side storage implementation**: Create `packages/storage/src/server.ts`. Build an `S3Client` configured for Cloudflare R2 using `S3_UPLOAD_ENDPOINT`, `S3_UPLOAD_REGION`, `S3_UPLOAD_KEY`, and `S3_UPLOAD_SECRET`. Export `getStorageConfig()`, `createSignedUpload()`, `deleteFile()`, and `getPublicUrl()`. `getPublicUrl()` must derive from an explicit public base URL env variable such as `S3_UPLOAD_PUBLIC_URL`, not from the private R2 API endpoint. | | |
| TASK-044 | **Create client-side upload helper**: Create `packages/storage/src/client.ts`. Export a small helper that requests a signed upload from the app API and uploads files with `fetch(PUT)` using the returned headers. Do not re-export third-party upload hooks. | | |
| TASK-045 | **Create upload signing API route**: Create `apps/web/app/api/upload/route.ts`. Accept a JSON payload containing filename, MIME type, and size. Validate MIME type and size server-side, generate a sanitized object key, return `{ key, uploadUrl, publicUrl, headers }`, and reject invalid input with `400`. | | |
| TASK-046 | **Register storage package**: Add `"@workspace/storage": "workspace:*"` to `apps/web/package.json` **dependencies**, update `apps/web/tsconfig.json` paths, and run `pnpm install` from root. | | |

### Phase 5: Analytics & Utility Modules

- **GOAL-005**: Add stable client-side PostHog analytics and the shared reserved usernames list.

**Can run in parallel with Phases 3 and 4**

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-047 | **Install PostHog**: Run `pnpm --filter web add posthog-js`. Use the stable SDK path only. Do not add pre-release `@posthog/next`. | | |
| TASK-048 | **Create PostHog provider**: Create `apps/web/components/posthog-provider.tsx` as a client component. Initialize `posthog-js` inside `useEffect()` with `NEXT_PUBLIC_POSTHOG_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, `person_profiles: "identified_only"`, `persistence: "memory"`, and `capture_pageview: false`. Wrap children in `PostHogProvider` from `posthog-js/react`. | | |
| TASK-049 | **Add PostHog provider to layout**: Update `apps/web/app/layout.tsx` so provider order becomes `<ClerkProvider>` → `<PostHogProvider>` → `<ThemeProvider>`. | | |
| TASK-050 | **Create analytics helpers**: Create `apps/web/lib/analytics.ts` exporting `identifyUser()`, `trackEvent()`, and `resetAnalytics()`. Each helper must be browser-safe and no-op when analytics consent is absent. | | |
| TASK-051 | **Create reserved usernames list**: Create `packages/database/src/constants/reserved-usernames.ts` exporting the canonical reserved username set and `isReservedUsername(username)`. Keep system-route and feature-route reservations in comments or grouped sections for clarity. | | |

### Phase 6: Environment Variables & Configuration

- **GOAL-006**: Make the workspace configuration and environment documentation match the final architecture.

**Depends on:** Phases 2–5

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-052 | **Create `.env.example`**: Create root `.env.example` with all required variables and comments. Include `DATABASE_URL`, `DIRECT_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`, `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `S3_UPLOAD_KEY`, `S3_UPLOAD_SECRET`, `S3_UPLOAD_BUCKET`, `S3_UPLOAD_REGION`, `S3_UPLOAD_ENDPOINT`, `S3_UPLOAD_PUBLIC_URL`, `NEXT_PUBLIC_POSTHOG_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, and `NEXT_PUBLIC_APP_URL`. | | |
| TASK-053 | **Verify `.gitignore`**: Confirm root `.gitignore` contains `.env`, `.env.local`, and `.env.*.local`. Add them if missing. | | |
| TASK-054 | **Update app module resolution and bundling config**: In `apps/web/tsconfig.json`, add `@workspace/database/*` and `@workspace/storage/*` aliases. In `apps/web/next.config.mjs`, extend `transpilePackages` to `[@workspace/ui, @workspace/database, @workspace/storage]`. | | |
| TASK-055 | **Update `turbo.json` env tracking**: Add an `env` array to the `build` task covering the canonical variables used by build and server bundles: `DATABASE_URL`, `DIRECT_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`, `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `S3_UPLOAD_KEY`, `S3_UPLOAD_SECRET`, `S3_UPLOAD_BUCKET`, `S3_UPLOAD_REGION`, `S3_UPLOAD_ENDPOINT`, `S3_UPLOAD_PUBLIC_URL`, `NEXT_PUBLIC_POSTHOG_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_APP_URL`. | | |
| TASK-056 | **Document Vercel env vars**: Create or update `docs/impl-plan/vercel-env-vars.md` listing every required environment variable for production and preview. Clearly mark client-visible vs server-only variables, and note that preview deployments should use branch-specific Neon URLs when that workflow is enabled. | | |

### Phase 7: Final Verification

- **GOAL-007**: Verify the complete infrastructure stack end-to-end and record the successful checks.

**Depends on:** All prior phases

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-057 | **Clean install**: Run `pnpm install` from the repo root and verify all workspace dependencies resolve correctly. | | |
| TASK-058 | **Run full build**: Run `pnpm build` from root. Verify zero TypeScript and build failures across all workspace packages and apps. | | |
| TASK-059 | **Run typecheck**: Run `pnpm typecheck` from root and verify strict typing passes across `@workspace/ui`, `@workspace/database`, `@workspace/storage`, and `web`. | | |
| TASK-060 | **Run linting**: Run `pnpm lint` from root and fix any Biome violations in newly added files. | | |
| TASK-061 | **Verify design system**: Start the dev server and confirm brand colors, correct fonts, dark-mode toggle behavior, and no FOUC. | | |
| TASK-062 | **Verify database connection and schema**: Confirm all 4 tables and expected columns exist in Drizzle Studio or via a temporary test route. Confirm both pooled runtime queries and direct migration connectivity behave correctly. | | |
| TASK-063 | **Verify Clerk auth flow**: Visit `/dashboard` while signed out and confirm redirect to sign-in. Sign in and verify access to `/dashboard`. Confirm `/` remains public. | | |
| TASK-064 | **Verify webhook sync and retries**: Use Clerk Dashboard test delivery or a real sign-up to confirm `user.created` inserts a `users` row. Force a failing handler once during local testing and confirm Clerk retries when the route returns non-2xx. | | |
| TASK-065 | **Verify PostHog client init**: Confirm requests are sent to PostHog, no cookies persist by default while `persistence: "memory"` is active, and helper-based events appear as expected in development. | | |
| TASK-066 | **Verify FTS index**: Run `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_fts_idx';` against the database and confirm the index exists. | | |
| TASK-067 | **Verify upload signing + validation**: Request an upload URL for a valid image and confirm upload succeeds to R2. Then test invalid MIME type and oversize payloads and confirm the signing route rejects them before issuing a signed URL. | | |
| TASK-068 | **Delete backup files**: Remove all `.bak` files created in Phase 1 once the implementation is verified. | | |

---

## 3. Alternatives

- **ALT-001**: **Database in `apps/web/lib/db/` instead of `packages/database/`** — Rejected. User explicitly chose a shared package for reuse in future scripts/services.
- **ALT-002**: **Prisma instead of Drizzle ORM** — Rejected. Product Plan §8.1 specifies Drizzle and it fits the Neon serverless deployment model.
- **ALT-003**: **Supabase Storage instead of Cloudflare R2** — Rejected. Product Plan §16 specifies Cloudflare R2 for zero egress and S3 compatibility.
- **ALT-004**: **Destructive shadcn re-init** — Rejected for the canonical path. The current workspace already uses `base-maia` + BaseUI; an in-place token migration is lower risk and more deterministic.
- **ALT-005**: **`next-s3-upload` for R2 uploads** — Rejected. The package ecosystem/docs are older, less explicit for Cloudflare R2, and provide less control over validation than direct AWS SDK presigning.
- **ALT-006**: **Pre-release `@posthog/next`** — Rejected for Module 0 baseline. PostHog documents it as pre-release; stable `posthog-js` has lower risk.
- **ALT-007**: **Use only Clerk session data, no local `users` table** — Rejected. Product requirements include public user discovery and app-owned user profile data.
- **ALT-008**: **Serial integer primary keys instead of UUIDs** — Rejected. Product Plan §8.2 requires UUID primary keys.

---

## 4. Dependencies

### New Dependencies to Install

- **DEP-001**: `@clerk/nextjs` — Clerk auth provider and helpers for Next.js App Router
- **DEP-002**: `drizzle-orm` — Type-safe ORM for the shared database package
- **DEP-003**: `drizzle-kit` — Migration and Studio tooling for Drizzle
- **DEP-004**: `@neondatabase/serverless` — Neon runtime driver for serverless/HTTP queries
- **DEP-005**: `@aws-sdk/client-s3` — R2-compatible S3 client for server-side storage abstraction
- **DEP-006**: `@aws-sdk/s3-request-presigner` — Presigned URL generation for uploads
- **DEP-007**: `posthog-js` — Stable client-side PostHog SDK

### Existing Dependencies Already Present

- **DEP-008**: `next` 16.1.6
- **DEP-009**: `react` + `react-dom` 19.2.4
- **DEP-010**: `tailwindcss` 4.1.18 + `@tailwindcss/postcss`
- **DEP-011**: `next-themes` 0.4.6
- **DEP-012**: `@phosphor-icons/react` 2.1.10
- **DEP-013**: `class-variance-authority`, `clsx`, `tailwind-merge`
- **DEP-014**: `@base-ui/react`
- **DEP-015**: `shadcn` 4.1.0
- **DEP-016**: `tw-animate-css`

### External Services Already Provisioned

- **DEP-017**: Neon Serverless PostgreSQL
- **DEP-018**: Clerk
- **DEP-019**: Cloudflare R2
- **DEP-020**: PostHog
- **DEP-021**: Vercel

---

## 5. Files

- **FILE-001**: `packages/database/package.json` — Database package manifest
- **FILE-002**: `packages/database/tsconfig.json` — Database package TS config
- **FILE-003**: `packages/database/drizzle.config.ts` — Drizzle config using `DIRECT_URL`
- **FILE-004**: `packages/database/src/schema/users.ts` — Users table schema
- **FILE-005**: `packages/database/src/schema/personal-records.ts` — Personal records schema
- **FILE-006**: `packages/database/src/schema/highlights.ts` — Highlights schema
- **FILE-007**: `packages/database/src/schema/achievements.ts` — Achievements schema
- **FILE-008**: `packages/database/src/schema/relations.ts` — Drizzle relations
- **FILE-009**: `packages/database/src/schema/index.ts` — Schema barrel
- **FILE-010**: `packages/database/src/schema/fts-index.sql` — Supplemental FTS index SQL
- **FILE-011**: `packages/database/src/client.ts` — Runtime DB client
- **FILE-012**: `packages/database/src/types.ts` — Inferred DB types
- **FILE-013**: `packages/database/src/constants/reserved-usernames.ts` — Reserved usernames
- **FILE-014**: `packages/storage/package.json` — Storage package manifest
- **FILE-015**: `packages/storage/tsconfig.json` — Storage package TS config
- **FILE-016**: `packages/storage/src/types.ts` — Storage types
- **FILE-017**: `packages/storage/src/server.ts` — Server-side R2 abstraction
- **FILE-018**: `packages/storage/src/client.ts` — Client-side upload helper
- **FILE-019**: `apps/web/lib/fonts.ts` — Shared font definitions
- **FILE-020**: `apps/web/proxy.ts` — Clerk route protection for Next.js 16
- **FILE-021**: `apps/web/app/api/webhooks/clerk/route.ts` — Clerk webhook handler
- **FILE-022**: `apps/web/app/api/upload/route.ts` — Signed upload URL endpoint
- **FILE-023**: `apps/web/components/posthog-provider.tsx` — PostHog client provider
- **FILE-024**: `apps/web/lib/analytics.ts` — Analytics wrappers
- **FILE-025**: `apps/web/lib/auth.ts` — Server-side current-user helper
- **FILE-026**: `.env.example` — Canonical environment documentation
- **FILE-027**: `packages/ui/src/styles/globals.css` — Brand theme tokens and semantic mappings
- **FILE-028**: `apps/web/app/layout.tsx` — Fonts + provider nesting
- **FILE-029**: `apps/web/next.config.mjs` — `transpilePackages` update
- **FILE-030**: `apps/web/tsconfig.json` — Additional workspace path aliases
- **FILE-031**: `apps/web/package.json` — New runtime dependencies
- **FILE-032**: `turbo.json` — Build env tracking
- **FILE-033**: `docs/impl-plan/vercel-env-vars.md` — Vercel env documentation

---

## 6. Testing

- **TEST-001**: `pnpm install` completes successfully with all workspace packages linked.
- **TEST-002**: `pnpm build` succeeds across the monorepo.
- **TEST-003**: `pnpm typecheck` succeeds with strict TypeScript enabled.
- **TEST-004**: `pnpm lint` succeeds under Biome.
- **TEST-005**: Homepage renders with ZealerProfile brand tokens and corrected fonts.
- **TEST-006**: Dark mode toggles via the `d` hotkey and no FOUC is visible.
- **TEST-007**: `/dashboard` and `/onboarding` are protected through Clerk route protection in `proxy.ts`.
- **TEST-008**: `/api/webhooks/clerk` accepts valid Clerk webhook deliveries and rejects invalid signatures.
- **TEST-009**: New Clerk users create corresponding DB rows; updates and deletions sync correctly.
- **TEST-010**: All four DB tables exist with the expected columns and indexes.
- **TEST-011**: `users_fts_idx` exists and is queryable through `pg_indexes`.
- **TEST-012**: Upload signing route returns signed URLs for valid images and rejects invalid MIME types or sizes.
- **TEST-013**: Valid uploads reach R2 and the returned public URL is usable by the app.
- **TEST-014**: PostHog initializes client-side with `persistence: "memory"`, emits events, and does not persist cookies by default.
- **TEST-015**: Every `process.env` reference in source has a documented entry in `.env.example` and Vercel env docs.

---

## 7. Risks & Assumptions

### Risks

- **RISK-001**: **Theme migration regressions** — In-place theme updates could unintentionally remove semantic mappings from `globals.css`. Mitigation: back up files and verify the generated utility mappings after edits.
- **RISK-002**: **GIN full-text index remains supplemental** — Drizzle standard APIs do not directly express the desired GIN index. Mitigation: keep `fts-index.sql`, apply it explicitly, and verify it in TEST-011.
- **RISK-003**: **Neon direct vs pooled URL mix-up** — Using the wrong URL for migrations or runtime queries can cause reliability or scaling issues. Mitigation: document both URLs clearly and use `DIRECT_URL` only in `drizzle.config.ts` / migration flows.
- **RISK-004**: **Webhook eventual consistency** — Clerk webhooks are asynchronous and retried. Mitigation: keep handlers idempotent, return non-2xx on failed writes, and avoid assuming immediate write consistency in feature logic.
- **RISK-005**: **Upload public URL misconfiguration** — R2 API endpoint and public asset URL are not the same thing. Mitigation: require explicit `S3_UPLOAD_PUBLIC_URL`.
- **RISK-006**: **Local webhook testing requires a public tunnel** — Clerk webhooks need a reachable URL during development. Mitigation: test locally via ngrok or equivalent and document the workflow.
- **RISK-007**: **PostHog consent workflow remains partial** — Module 0 intentionally ships the consent-gated default but not the full consent UX. Mitigation: keep persistence in memory and defer persistence upgrade to the later consent module.

### Assumptions

- **ASSUMPTION-001**: All external services (Neon, Clerk, R2, PostHog, Vercel) are already provisioned and credentials are available.
- **ASSUMPTION-002**: The repo continues to use pnpm workspaces and Turborepo.
- **ASSUMPTION-003**: `apps/web` is the Vercel deployment target.
- **ASSUMPTION-004**: Preview-specific Neon branch automation may be introduced later, but the environment documentation created in Module 0 must be compatible with that future setup.
- **ASSUMPTION-005**: Form validation schemas, React Query, and other feature-layer utilities are deferred to later modules.

---

## 8. Related Specifications / Further Reading

- [Product Plan v2.1](../core-plan/product-plan.md)
- [Design System v3.0](../core-plan/design-system.md)
- [Requirements Overview](../core-plan/requirements-overview.md)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [shadcn CLI](https://ui.shadcn.com/docs/cli)
- [Drizzle <> Neon Postgres](https://orm.drizzle.team/docs/connect-neon)
- [Drizzle + Neon Get Started](https://orm.drizzle.team/docs/get-started/neon-new)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk `clerkMiddleware()` Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk Webhook Sync Guide](https://clerk.com/docs/webhooks/sync-data)
- [Clerk `verifyWebhook()` Reference](https://clerk.com/docs/reference/backend/verify-webhook)
- [Clerk Environment Variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [PostHog Next.js (stable guide)](https://posthog.com/docs/libraries/next-js)
- [Next.js `instrumentation-client.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client)
- [Next.js `proxy.ts` file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

---

## Appendix A: Final File Tree After Module 0

```text
stride/
├── .env.example
├── apps/
│   └── web/
│       ├── proxy.ts
│       ├── next.config.mjs
│       ├── package.json
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx
│       │   └── api/
│       │       ├── upload/
│       │       │   └── route.ts
│       │       └── webhooks/
│       │           └── clerk/
│       │               └── route.ts
│       ├── components/
│       │   ├── posthog-provider.tsx
│       │   └── theme-provider.tsx
│       └── lib/
│           ├── analytics.ts
│           ├── auth.ts
│           └── fonts.ts
├── docs/
│   └── impl-plan/
│       ├── infrastructure-module-0-workspace-setup-1.md
│       └── vercel-env-vars.md
├── packages/
│   ├── database/
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts
│   │       ├── types.ts
│   │       ├── constants/
│   │       │   └── reserved-usernames.ts
│   │       └── schema/
│   │           ├── index.ts
│   │           ├── users.ts
│   │           ├── personal-records.ts
│   │           ├── highlights.ts
│   │           ├── achievements.ts
│   │           ├── relations.ts
│   │           └── fts-index.sql
│   ├── storage/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── types.ts
│   └── ui/
│       └── src/
│           ├── components/
│           │   └── button.tsx
│           └── styles/
│               └── globals.css
└── turbo.json
```

## Appendix B: Canonical Notes

- **This file is the source of truth for Module 0.** If any implementation note elsewhere conflicts with this document, this document wins.
- **Do not reintroduce `middleware.ts` for Module 0.** Use `proxy.ts` for Next.js 16.
- **Do not reintroduce `next-s3-upload` into Module 0.** Use AWS SDK v3 presigned uploads.
- **Do not switch Module 0 to pre-release `@posthog/next`.** Stay on the stable PostHog guide.
- **Do not collapse `DIRECT_URL` into `DATABASE_URL`.** Keep runtime and migration connectivity separate.
