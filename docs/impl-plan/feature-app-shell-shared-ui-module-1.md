---
goal: "Module 1: App Shell & Shared UI Components — Final audited handoff plan for the reusable UI layer, animation foundation, validation system, and global app shell"
version: 1.1
date_created: 2026-03-21
last_updated: 2026-03-21
owner: ZealerProfile
tags: [feature, ui, design-system, components, module-1]
---

# Introduction

This document is the **final audited handoff plan** for Module 1. It updates the original Module 1 plan after reviewing the live repository on **2026-03-21** and correcting the gaps between the plan, `docs/core-plan/requirements-overview.md`, and the current codebase.

Module 1 builds the complete reusable UI layer that every later feature module depends on. It extends the existing foundation with the shared component library, Motion v12 animation primitives, shared validation schemas, icon mapping, query/client providers, and the global app shell.

This revision makes three important corrections:

1. It distinguishes what is **already implemented** from what is still missing.
2. It explicitly records the **Module 0 closeout dependencies** that still affect Module 1.
3. It corrects task gaps in the original plan, including package placement, missing shared components needed by the custom UI work, and route/config consistency items that would otherwise cause churn during implementation.

Module 1 may proceed for **schema-independent UI work** while Module 0 remains in closeout, but Module 1 must **not be marked complete** until the Module 0 dependencies that influence validation, auth flow assumptions, and search/discovery data contracts are resolved.

## Live Repo Audit — 2026-03-21

| Area | Status | Details |
| ------ | -------- | --------- |
| Root layout (`apps/web/app/layout.tsx`) | ⚠️ Partially implemented | `ClerkProvider`, `PostHogProvider`, `ThemeProvider`, and font variable binding exist; metadata, `QueryProvider`, `TooltipProvider`, `Toaster`, `Navbar`, and `<main>` shell structure are still missing |
| Theme provider (`apps/web/components/theme-provider.tsx`) | ✅ Implemented | `next-themes` configured with `attribute="class"`; dark mode hotkey exists |
| PostHog provider (`apps/web/components/posthog-provider.tsx`) | ✅ Implemented | Client-side initialization is present |
| Analytics helper (`apps/web/lib/analytics.ts`) | ⚠️ Partially implemented | Helper exists, but consent-aware gating is still a Module 0 closeout item |
| Design tokens (`packages/ui/src/styles/globals.css`) | ⚠️ Partially implemented | Full brand/system tokens exist, but duration values do not match the design system and reduced-motion fallback is missing |
| Font loading (`apps/web/lib/fonts.ts`) | ✅ Implemented | Outfit, Inter, and JetBrains Mono are already wired through `next/font/google` |
| Button component (`packages/ui/src/components/button.tsx`) | ✅ Implemented | CVA-based reusable Button exists |
| `cn()` utility (`packages/ui/src/lib/utils.ts`) | ✅ Implemented | `clsx` + `tailwind-merge` utility exists |
| Route protection (`apps/web/proxy.ts`) | ✅ Implemented | Clerk protection for `/dashboard(.*)` and `/onboarding(.*)` already exists |
| Upload route (`apps/web/app/api/upload/route.ts`) | ✅ Implemented | Presigned upload intent route exists |
| Webhook route (`apps/web/app/api/webhooks/clerk/route.ts`) | ✅ Implemented | Clerk webhook syncing route exists |
| `packages/ui` exports | ✅ Implemented | `./components/*`, `./lib/*`, and `./hooks/*` exports already support path-based imports |
| shadcn config | ✅ Implemented | `components.json` exists in both `packages/ui` and `apps/web` with `base-maia`, RSC mode, and Phosphor icons |
| Database/schema alignment | ❌ Still pending in Module 0 | Current schema does not yet match the MVP profile/discovery shape in `requirements-overview.md` |
| Initial migration | ❌ Still pending in Module 0 | `packages/database/drizzle/` is still empty |

## Critical Handoff Notes

- **Module 0 is still in closeout.** The outstanding schema, migration, FTS/indexing, analytics-consent, and external integration verification work remains real and should not be silently assumed complete.
- **Do not finalize `packages/ui/src/lib/validations.ts` against stale schema assumptions.** Shared validation constants and enums must match the Product Plan and the final Module 0 schema closeout state.
- **Use `/sign-in` and `/sign-up` as the canonical auth routes for Module 1 and Module 2 UI.** The current `.env.example` still references `/login` and `/signup`; that mismatch must be normalized in the Module 0/2 workstream before auth pages are considered final.
- **Run package management from the repo root using `pnpm --filter ...`**, not by changing directories and creating ad-hoc local workflows.
- **The mobile navbar requires a sheet/drawer-style primitive**, and the custom `MultiSelect` / `FileUpload` work is easier and more consistent if `checkbox` and `progress` primitives are available. These were missing from the original plan and are added in this revision.
- **The repository currently uses `zod` v3 in `packages/ui`, while the product requirements call for Zod v4.** This revision treats the Zod upgrade as part of Module 1 foundation work.

---

## 1. Requirements & Constraints

### Requirements

- **REQ-001**: All UI components must render correctly in both **light and dark mode** using the existing OKLCH design tokens in `packages/ui/src/styles/globals.css`.
- **REQ-002**: All components must follow the design system v3.0 styling specs exactly — colors, border radius, shadows, typography, spacing, and motion.
- **REQ-003**: The animation foundation must support **reduced motion** via both a JavaScript hook (`useReducedMotion` from `motion/react`) and a CSS `@media (prefers-reduced-motion: reduce)` fallback.
- **REQ-004**: Shared validation schemas must cover the field constraints from Product Plan §6.1–§6.5, but they must be finalized only after reconciling Module 0 schema closeout decisions that affect enums and field semantics.
- **REQ-005**: The Navbar must be **auth-aware** (logged-out vs logged-in states) and **responsive** (desktop layout + mobile sheet menu).
- **REQ-006**: All new shared components must be importable from `@workspace/ui/components/<name>`.
- **REQ-007**: Mobile-first design is required. All Module 1 surfaces must work at **375px**, **390px**, and **414px** widths.
- **REQ-008**: `TimeInput` must enforce masked time entry (`MM:SS` and `HH:MM:SS`) using `@maskito/react` from the shared UI package.
- **REQ-009**: `FileUpload` must validate JPEG/PNG/WebP, enforce a 5MB input limit, and perform client-side compression toward a ≤1MB upload target before emitting the selected file.
- **REQ-010**: Character-counted textareas must show live `{current}/{max}` counters with warning state at 90% and error state at the limit.
- **REQ-011**: The final Module 1 plan must reflect the **actual live repo state**. Already-implemented foundation code must be reused instead of re-planned from scratch.
- **REQ-012**: Root layout work must preserve the existing providers while extending them to the final provider order and shell composition described in this plan.
- **REQ-013**: Module 1 auth links and copy must use the canonical routes `/sign-in` and `/sign-up`, with a handoff note that adjacent env documentation must be synchronized.

### Security Requirements

- **SEC-001**: `FileUpload` must validate file type using both MIME type and extension; the client must never trust the extension alone.
- **SEC-002**: No user content may be rendered as raw HTML. All text content in Module 1 remains plain JSX-rendered text.
- **SEC-003**: Navbar auth state must come from Clerk hooks/APIs only; do not store auth state manually in localStorage or custom cookies.

### Constraints

- **CON-001**: Use `pnpm` exclusively for package management.
- **CON-002**: Use root workspace commands first; package installs must be run from the repo root with `pnpm --filter ...`.
- **CON-003**: Use Biome for formatting and linting. Do not introduce ESLint or Prettier.
- **CON-004**: Add shadcn components from the `packages/ui/` context so the existing `components.json` configuration remains authoritative.
- **CON-005**: Module 1 must not make database schema changes in `packages/database/src/schema/`; those remain Module 0 closeout tasks.
- **CON-006**: Navbar search remains a **placeholder only** in Module 1. Functional typeahead belongs to Module 7.
- **CON-007**: Module 1 must not introduce new API routes.
- **CON-008**: Motion token values in `globals.css` must match the design system source of truth: `150ms`, `200ms`, `300ms`.
- **CON-009**: Module 1 cannot be called complete until the Module 0 items that affect validation and discovery assumptions are either resolved or explicitly frozen for downstream work.
- **CON-010**: The shared validation layer must target **Zod v4** as specified in `requirements-overview.md`.

### Guidelines

- **GUD-001**: Shared primitives and reusable inputs belong in `packages/ui/src/components/`; app-specific composites belong in `apps/web/components/`.
- **GUD-002**: Follow the CVA pattern used in `packages/ui/src/components/button.tsx` when variants are required.
- **GUD-003**: Use Sonner for toast infrastructure and theme it to the design system.
- **GUD-004**: Feature/app code should consume the centralized `icons.ts` mapping rather than importing directly from `@phosphor-icons/react`.
- **GUD-005**: Use `cn()` from `@workspace/ui/lib/utils` for conditional classes.
- **GUD-006**: Prefer existing shared primitives before writing custom styled wrappers.

### Patterns

- **PAT-001**: Use shadcn CLI to add supported primitives first, then adapt them to the project design system.
- **PAT-002**: Final provider order in `apps/web/app/layout.tsx`: `ClerkProvider` → `QueryProvider` → `ThemeProvider` → `TooltipProvider` → `PostHogProvider` → `{Toaster + Navbar + main content}`.
- **PAT-003**: Keep Motion variants centralized in `packages/ui/src/lib/animations.ts` and consume them from feature/app code.
- **PAT-004**: Keep shared validation in `packages/ui/src/lib/validations.ts` so it can be reused in forms and future server-side validation.
- **PAT-005**: Reuse the existing font-variable layout pattern from `apps/web/lib/fonts.ts` and `apps/web/app/layout.tsx` rather than reinventing font setup.

---

## 2. Implementation Steps

### Implementation Phase 0 — Handoff Alignment & Dependency Checkpoint

- GOAL-001: Start Module 1 from the audited repo state, record the unresolved Module 0 dependencies, and remove ambiguity before component work begins.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-001 | Confirm the current Module 0 closeout status from `docs/core-plan/requirements-overview.md` before starting Module 1 implementation. Treat the unresolved schema alignment, initial migration, FTS/indexing, analytics-consent, and external-service verification items as active dependencies. | | |
| TASK-002 | Record in the Module 1 implementation PR description that `validations.ts` and any schema-shaped enums/constants must be checked against the latest Module 0 closeout branch before merge. | | |
| TASK-003 | Normalize auth route assumptions for UI work to `/sign-in` and `/sign-up`, and note that `.env.example` / env docs still need adjacent synchronization work outside Module 1. | | |
| TASK-004 | Run the current baseline validation from the repo root: `pnpm typecheck`, `pnpm build`, and `pnpm lint`. Save the results in the development notes before making Module 1 changes. | | |

### Implementation Phase 1 — Foundation & Dependency Installation

- GOAL-002: Install the correct runtime dependencies in the correct workspace packages, fix the motion token mismatch, and create the foundational shared utility modules that are independent of Module 0 schema closeout.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-005 | Upgrade `zod` in `packages/ui` to **Zod v4** from the repo root using `pnpm --filter @workspace/ui add zod@^4`. Verify compatibility with the rest of the workspace. | | |
| TASK-006 | Install web-app dependencies from the repo root using `pnpm --filter web add motion react-hook-form @hookform/resolvers @tanstack/react-query sonner`. | | |
| TASK-007 | Install shared UI package dependencies from the repo root using `pnpm --filter @workspace/ui add motion @maskito/core @maskito/react react-day-picker sonner`. | | |
| TASK-008 | Fix the duration token mismatch in `packages/ui/src/styles/globals.css`: update to `--duration-fast: 150ms`, `--duration-base: 200ms`, `--duration-slow: 300ms`. | | |
| TASK-009 | Add the reduced-motion CSS fallback in `packages/ui/src/styles/globals.css` using `@media (prefers-reduced-motion: reduce)` with transition and animation duration minimization. | | |
| TASK-010 | Create `packages/ui/src/lib/animations.ts` exporting shared Motion variants (`pageVariants`, `staggerContainerVariants`, `staggerItemVariants`, `fadeInVariants`), duration/easing constants, and a `useReducedMotion` re-export. | | |
| TASK-011 | Create `packages/ui/src/lib/icons.ts` with a type-safe semantic icon map covering the icons needed by Module 1 and near-term downstream modules. | | |
| TASK-012 | Add the initial `metadata` export to `apps/web/app/layout.tsx` using the canonical ZealerProfile title, description, Open Graph, and Twitter metadata. Preserve the existing font-variable setup. | | |
| TASK-013 | Run `pnpm typecheck` and `pnpm build` from the repo root after Phase 1. Fix any issues before moving on. | | |

### Implementation Phase 2 — Core Shared Primitives via shadcn

- GOAL-003: Add and adapt the shared UI primitives needed by the app shell and custom inputs, including the missing primitives that the original plan overlooked.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-014 | Add base layout/display primitives from `packages/ui`: `card`, `separator`, `badge`, `avatar`. | | |
| TASK-015 | Add form primitives from `packages/ui`: `input`, `textarea`, `select`, `switch`, `label`, `checkbox`, `progress`. | | |
| TASK-016 | Add overlay/navigation primitives from `packages/ui`: `dialog`, `tooltip`, `dropdown-menu`, `popover`, `sheet`, `sonner`. | | |
| TASK-017 | Add feedback/navigation primitives from `packages/ui`: `skeleton`, `tabs`. | | |
| TASK-018 | Customize `packages/ui/src/components/badge.tsx` with design-system-specific variants: `personal-best`, `verified`, `streak`, and `milestone`. Reuse the existing Button/CVA pattern. | | |
| TASK-019 | Style the Sonner toaster wrapper in `packages/ui/src/components/sonner.tsx` to the design system: correct radius, shadow, dark-mode compatibility, and success/info/destructive visual treatments. | | |
| TASK-020 | Review each generated shared component and fix any issues introduced by the generator for Tailwind v4 / `base-maia` conventions before continuing. | | |
| TASK-021 | Verify `packages/ui/package.json` exports still correctly expose all new shared components via `@workspace/ui/components/<name>`. Only update exports if required. | | |
| TASK-022 | Run `pnpm typecheck` and `pnpm build` from the repo root after Phase 2. | | |

### Implementation Phase 3 — Shared Validation Layer & Custom Components

- GOAL-004: Finalize the shared validation layer and build the product-specific components that the app shell and future feature modules rely on.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-023 | Create `packages/ui/src/lib/validations.ts` using Zod v4. Include username rules, text limits, image constraints, and the time-range validation helpers required by the product plan. Before finalizing enums/constants, confirm they still match the latest Module 0 closeout decisions and Product Plan values. | | |
| TASK-024 | Create `packages/ui/src/components/textarea-with-counter.tsx` as a client component that wraps the shared `Textarea` and displays live length state with warning/error thresholds. | | |
| TASK-025 | Create `packages/ui/src/components/time-input.tsx` as a client component using `@maskito/react` and the shared `Input` primitive. Support `mm:ss` and `hh:mm:ss` formats. | | |
| TASK-026 | Create `packages/ui/src/components/file-upload.tsx` as a client component with drag/drop support, circle/square preview modes, MIME + extension validation, client-side compression, progress indication, and removable preview state. | | |
| TASK-027 | Create `packages/ui/src/components/multi-select.tsx` using `Popover`, `Checkbox`, `Badge`, and scrollable content. Selected values should render as pills in the trigger area. | | |
| TASK-028 | Create `packages/ui/src/components/date-picker.tsx` using `Popover` plus `react-day-picker`, with clear/reset support and design-system-consistent focus/overlay styling. | | |
| TASK-029 | Create `packages/ui/src/components/year-picker.tsx` using the shared `Select`, descending year generation, and clear/reset behavior. | | |
| TASK-030 | Run `pnpm typecheck` and `pnpm build` from the repo root after Phase 3. | | |

### Implementation Phase 4 — Global App Shell

- GOAL-005: Build the remaining app-level shell pieces in `apps/web`, wire the final provider tree, and complete the global layout experience.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-031 | Create `apps/web/lib/query-client.ts` with an SSR-safe `QueryClient` factory and accessor for the Next.js App Router environment. | | |
| TASK-032 | Create `apps/web/components/query-provider.tsx` as a client component wrapping children in `QueryClientProvider` with the shared query client accessor. | | |
| TASK-033 | Create `apps/web/components/navbar.tsx` as a client component with logo, disabled search placeholder, dark mode toggle, auth-aware actions, and a mobile sheet menu. Use `/sign-in` and `/sign-up` links for logged-out actions. | | |
| TASK-034 | Create `apps/web/app/error.tsx` as the route-level error boundary using shared `Card` and `Button` primitives. | | |
| TASK-035 | Create `apps/web/app/global-error.tsx` as the root-layout error boundary with its own `<html>` and `<body>` shell. | | |
| TASK-036 | Create `apps/web/app/not-found.tsx` as the styled 404 experience using shared UI primitives. | | |
| TASK-037 | Create `apps/web/app/loading.tsx` using shared `Skeleton` primitives. | | |
| TASK-038 | Update `apps/web/app/layout.tsx` to the final provider/shell composition: `ClerkProvider` → `QueryProvider` → `ThemeProvider` → `TooltipProvider` → `PostHogProvider` → `{Toaster, Navbar, main}`. Preserve existing font classes and hydration guard. | | |
| TASK-039 | Run `pnpm typecheck`, `pnpm build`, and `pnpm lint` from the repo root after Phase 4. | | |

### Implementation Phase 5 — Final Validation & Handoff Verification

- GOAL-006: Validate the complete Module 1 surface, confirm responsive behavior and token inheritance, and ensure no unresolved handoff caveats remain undocumented.

| Task | Description | Completed | Date |
| ------ | ------------- | ----------- | ------ |
| TASK-040 | Run `pnpm dev` and manually verify: navbar layout, dark mode toggle, auth-aware states, mobile sheet behavior, 404 page, loading skeleton, and toaster styling. | | |
| TASK-041 | Verify responsive behavior at 375px, 390px, and 414px: navbar collapse, sheet usability, 404 readability, error page usability, and loading layout stability. | | |
| TASK-042 | Verify design-token inheritance on all shared primitives: lime focus ring, correct card radius/shadow, dialog/sheet elevation, badge variants, switch checked state, tabs active state, separator color, and reduced-motion fallback behavior. | | |
| TASK-043 | Re-check that `validations.ts`, auth routes used by the navbar, and any enum/option lists still match the latest Module 0 closeout state before merge. | | |
| TASK-044 | Run the final gate from the repo root: `pnpm typecheck && pnpm build && pnpm lint`. Module 1 is complete only after this passes and the Module 0 dependency note has been reviewed. | | |

---

## 3. Alternatives

- **ALT-001**: Build all shared components from scratch instead of using shadcn CLI — Rejected. The existing project is already configured for shadcn/base-maia, and using the shared generator-backed primitives reduces accessibility and consistency risk.
- **ALT-002**: Finalize shared validations before Module 0 closeout finishes — Rejected. This would bake stale schema assumptions into a central shared module and create churn for Modules 2–4.
- **ALT-003**: Keep `@maskito/*` in `apps/web` only — Rejected. `TimeInput` lives in `packages/ui`, so the masking dependency must exist in the shared UI package.
- **ALT-004**: Leave `zod` at v3 because it already exists — Rejected. The product requirements explicitly call for Zod v4, and this module is the correct place to align the shared validation layer.
- **ALT-005**: Implement the mobile navbar with ad-hoc custom markup instead of a sheet/drawer primitive — Rejected. The resulting behavior would be less consistent and would duplicate overlay logic already provided by the shared component system.
- **ALT-006**: Delay `checkbox` and `progress` primitives until later modules — Rejected. `MultiSelect` and `FileUpload` benefit immediately from them, and omitting them would increase custom component complexity.

---

## 4. Dependencies

### New or Updated Dependencies

| ID | Package | Target Directory | Version Constraint | Purpose |
| ---- | --------- | ------------------ | -------------------- | --------- |
| DEP-001 | `zod` | `packages/ui/` | ^4.x | Shared validation layer required by product requirements |
| DEP-002 | `motion` | `apps/web/`, `packages/ui/` | ^12.x | Animation foundation and Motion hooks |
| DEP-003 | `react-hook-form` | `apps/web/` | ^7.x | Form state management for downstream feature modules |
| DEP-004 | `@hookform/resolvers` | `apps/web/` | ^5.x | Zod integration for shared validations |
| DEP-005 | `@tanstack/react-query` | `apps/web/` | ^5.x | Query client/provider for App Router client data flows |
| DEP-006 | `sonner` | `apps/web/`, `packages/ui/` | ^2.x | Toast notifications and shared toaster wrapper |
| DEP-007 | `@maskito/core` | `packages/ui/` | ^4.x | Input masking core for `TimeInput` |
| DEP-008 | `@maskito/react` | `packages/ui/` | ^4.x | React integration for `TimeInput` |
| DEP-009 | `react-day-picker` | `packages/ui/` | ^9.x | Calendar/date picker primitive |

### Existing Dependencies Already Verified

| ID | Package | Location | Notes |
| ---- | --------- | ---------- | ------- |
| DEP-010 | `@phosphor-icons/react` | `apps/web/`, `packages/ui/` | Existing icon library |
| DEP-011 | `class-variance-authority` | `packages/ui/` | Existing variant system used by `Button` |
| DEP-012 | `clsx` | `packages/ui/` | Existing utility dependency |
| DEP-013 | `tailwind-merge` | `packages/ui/` | Existing utility dependency |
| DEP-014 | `@base-ui/react` | `packages/ui/` | Existing base-maia foundation |
| DEP-015 | `next-themes` | `apps/web/`, `packages/ui/` | Existing theme infrastructure |
| DEP-016 | `@clerk/nextjs` | `apps/web/` | Existing auth dependency |
| DEP-017 | `tw-animate-css` | `packages/ui/` | Existing animation CSS helper |
| DEP-018 | `shadcn` | `packages/ui/` | Existing CLI dependency |

---

## 5. Files

### Files to Modify

| ID | File Path | Changes |
| ---- | ----------- | --------- |
| FILE-001 | `packages/ui/src/styles/globals.css` | Fix duration token values and add reduced-motion CSS fallback |
| FILE-002 | `packages/ui/package.json` | Upgrade `zod`, add shared UI runtime dependencies, and confirm exports remain valid |
| FILE-003 | `apps/web/package.json` | Add web runtime dependencies for query/form/toast/motion support |
| FILE-004 | `apps/web/app/layout.tsx` | Add metadata and wire the final provider/shell composition |

### Files to Create — Foundation

| ID | File Path | Purpose |
| ---- | ----------- | --------- |
| FILE-005 | `packages/ui/src/lib/animations.ts` | Shared Motion variants, duration/easing constants, reduced-motion export |
| FILE-006 | `packages/ui/src/lib/icons.ts` | Centralized semantic icon mapping |
| FILE-007 | `packages/ui/src/lib/validations.ts` | Shared Zod v4 schemas and constants |

### Files to Create — Shared Primitives

| ID | File Path | Purpose |
| ---- | ----------- | --------- |
| FILE-008 | `packages/ui/src/components/card.tsx` | Shared card primitive |
| FILE-009 | `packages/ui/src/components/separator.tsx` | Shared separator primitive |
| FILE-010 | `packages/ui/src/components/badge.tsx` | Shared badge primitive with custom variants |
| FILE-011 | `packages/ui/src/components/avatar.tsx` | Shared avatar primitive |
| FILE-012 | `packages/ui/src/components/input.tsx` | Shared input primitive |
| FILE-013 | `packages/ui/src/components/textarea.tsx` | Shared textarea primitive |
| FILE-014 | `packages/ui/src/components/select.tsx` | Shared select primitive |
| FILE-015 | `packages/ui/src/components/switch.tsx` | Shared switch primitive |
| FILE-016 | `packages/ui/src/components/label.tsx` | Shared label primitive |
| FILE-017 | `packages/ui/src/components/checkbox.tsx` | Shared checkbox primitive for `MultiSelect` |
| FILE-018 | `packages/ui/src/components/progress.tsx` | Shared progress primitive for `FileUpload` |
| FILE-019 | `packages/ui/src/components/dialog.tsx` | Shared dialog primitive |
| FILE-020 | `packages/ui/src/components/tooltip.tsx` | Shared tooltip primitive |
| FILE-021 | `packages/ui/src/components/dropdown-menu.tsx` | Shared dropdown menu primitive |
| FILE-022 | `packages/ui/src/components/popover.tsx` | Shared popover primitive |
| FILE-023 | `packages/ui/src/components/sheet.tsx` | Shared mobile sheet/drawer primitive |
| FILE-024 | `packages/ui/src/components/sonner.tsx` | Shared toaster wrapper |
| FILE-025 | `packages/ui/src/components/skeleton.tsx` | Shared skeleton primitive |
| FILE-026 | `packages/ui/src/components/tabs.tsx` | Shared tabs primitive |

### Files to Create — Custom Components

| ID | File Path | Purpose |
| ---- | ----------- | --------- |
| FILE-027 | `packages/ui/src/components/textarea-with-counter.tsx` | Character-counted textarea |
| FILE-028 | `packages/ui/src/components/time-input.tsx` | Masked time input |
| FILE-029 | `packages/ui/src/components/file-upload.tsx` | Drag/drop image uploader with compression and progress |
| FILE-030 | `packages/ui/src/components/multi-select.tsx` | Popover-based multi-select with pills |
| FILE-031 | `packages/ui/src/components/date-picker.tsx` | Popover calendar input |
| FILE-032 | `packages/ui/src/components/year-picker.tsx` | Year selector |

### Files to Create — App Shell

| ID | File Path | Purpose |
| ---- | ----------- | --------- |
| FILE-033 | `apps/web/lib/query-client.ts` | Query client factory/accessor |
| FILE-034 | `apps/web/components/query-provider.tsx` | Query client provider |
| FILE-035 | `apps/web/components/navbar.tsx` | Responsive global navigation |
| FILE-036 | `apps/web/app/error.tsx` | Route-level error boundary |
| FILE-037 | `apps/web/app/global-error.tsx` | Root-layout error boundary |
| FILE-038 | `apps/web/app/not-found.tsx` | Styled 404 page |
| FILE-039 | `apps/web/app/loading.tsx` | Route-level loading skeleton |

---

## 6. Testing

| ID | Verification | Method |
| ---- | ------------- | -------- |
| TEST-001 | Baseline repo health is captured before Module 1 work starts | Run `pnpm typecheck`, `pnpm build`, `pnpm lint` from repo root |
| TEST-002 | Phase 1 compiles after dependency install and foundation updates | Run `pnpm typecheck` and `pnpm build` |
| TEST-003 | Shared primitives compile cleanly after generator + customization work | Run `pnpm typecheck` and `pnpm build` |
| TEST-004 | Custom shared components compile cleanly and export correctly | Run `pnpm typecheck` and import-check representative usage in `apps/web` |
| TEST-005 | Full app shell compiles and lints cleanly | Run `pnpm typecheck`, `pnpm build`, `pnpm lint` |
| TEST-006 | Navbar shows correct logged-out and logged-in states | Manual browser verification with Clerk states |
| TEST-007 | Navbar collapses to a usable mobile sheet at 375px, 390px, and 414px | Manual browser verification |
| TEST-008 | Dark mode toggle works and theme classes apply without hydration issues | Manual browser verification |
| TEST-009 | Toast success/info/destructive variants match the design system | Manual browser verification |
| TEST-010 | 404, error, and loading boundaries render correctly | Manual route/error verification |
| TEST-011 | `TextareaWithCounter` warning/error thresholds behave correctly | Manual interaction test |
| TEST-012 | `TimeInput` only permits masked numeric time entry | Manual interaction test |
| TEST-013 | `FileUpload` rejects invalid files, compresses valid images, shows preview/progress, and supports removal | Manual interaction test |
| TEST-014 | `MultiSelect`, `DatePicker`, and `YearPicker` behave as specified | Manual interaction test |
| TEST-015 | Reduced-motion CSS fallback disables or minimizes motion when `prefers-reduced-motion` is enabled | Browser devtools/manual verification |
| TEST-016 | Shared validation constants/enums still match Product Plan + latest Module 0 closeout state | Doc/code verification before merge |
| TEST-017 | Final Module 1 completion gate passes | Run `pnpm typecheck && pnpm build && pnpm lint` from repo root |

---

## 7. Risks & Assumptions

### Risks

- **RISK-001**: The shadcn CLI may generate files that need Tailwind v4 / `base-maia` cleanup before they match project conventions.
- **RISK-002**: Zod v4 upgrade may surface compatibility issues in any nearby code that still assumes v3 semantics.
- **RISK-003**: Shared validation enums/constants may drift if Module 0 schema closeout changes names or allowable values after Module 1 work starts.
- **RISK-004**: The current `.env.example` auth-route mismatch (`/login`, `/signup`) can confuse implementation if not explicitly normalized in adjacent work.
- **RISK-005**: `@maskito/react` and `react-day-picker` may need minor adaptation for React 19 / project-specific shared component patterns.
- **RISK-006**: Design token inheritance may look correct in static code but still require manual browser verification after generator-added component customization.

### Assumptions

- **ASSUMPTION-001**: The existing Module 0 foundation code that is already in the repo (theme provider, PostHog provider, font setup, upload route, Clerk webhook route, `cn()`, and `Button`) will be reused rather than rewritten.
- **ASSUMPTION-002**: Module 0 closeout work will continue in parallel and will provide a stable answer for validation-sensitive enums/field semantics before Module 1 is merged.
- **ASSUMPTION-003**: `apps/web/next.config.mjs` already transpiles the internal workspace packages used by Module 1.
- **ASSUMPTION-004**: Path-based exports in `packages/ui/package.json` will continue to be sufficient for shared component consumption from `apps/web`.
- **ASSUMPTION-005**: The development team will manually verify external-service items that source control cannot prove, as already noted in Module 0.

---

## 8. Related Specifications / Further Reading

- `docs/core-plan/design-system.md` — Authoritative styling and component behavior rules
- `docs/core-plan/product-plan.md` — Product constraints, field definitions, route expectations, and downstream feature specs
- `docs/core-plan/requirements-overview.md` — Master module roadmap and the current Module 0 closeout status
- `docs/impl-plan/infrastructure-module-0-workspace-setup-1.md` — Module 0 implementation/closeout plan
- `docs/impl-plan/vercel-env-vars.md` — Environment variable documentation and deployment-facing config notes
- `README.md` — Monorepo quick-start and package layout context
- shadcn/ui docs: <https://ui.shadcn.com/docs>
- Motion docs: <https://motion.dev/docs>
- TanStack Query App Router docs: <https://tanstack.com/query/latest/docs/framework/react/guides/ssr>
- Maskito docs: <https://maskito.dev/>
- react-day-picker docs: <https://daypicker.dev/>
