---
goal: Redesign onboarding wizard UI/UX for space efficiency, visual polish, and bug fixes
version: 1.0
date_created: 2026-03-23
last_updated: 2026-03-23
owner: Design / Frontend
tags: [design, ux, refactor, bug]
---

# Introduction

Redesign the 3-step onboarding wizard (Profile → Records → Highlights) and the completion screen for better space efficiency, visual polish, and critical bug fixes. The core approach converts single-column layouts to responsive 2-column grids, fixes the broken date picker (missing `react-day-picker` v9 CSS), adds consistency to navigation buttons, compacts the highlights step, and elevates the completion view.

**Scope:** Purely frontend layout/styling changes + date picker bug fix. No API, schema, migration, or form logic changes. No new dependencies.

## 1. Requirements & Constraints

- **REQ-001**: Step 1 (Profile) must use a 2-column responsive grid on desktop (≥768px) and collapse to single column on mobile, eliminating excessive vertical scrolling.
- **REQ-002**: Step 3 (Highlights) highlight cards must use internal 2-column grids for Date/Image fields, and navigation buttons must display horizontally on desktop instead of stacked vertically.
- **REQ-003**: The `DatePicker` component must import `react-day-picker/style.css` and apply brand-consistent CSS overrides (lime-500 selected state, lime-300 today indicator) matching design system §12.
- **REQ-004**: Step 3 Back button must include `<Icons.back>` icon to match Step 2's Back button for visual consistency.
- **REQ-005**: Completion view must use a 2-column layout on desktop (profile card left, PR card right) with horizontally arranged action buttons.
- **REQ-006**: Step 2 (Records) should include a brief instructional subheading and ensure the card preview has solid sticky positioning on desktop.
- **CON-001**: All layouts must default to single-column (mobile-first) and expand at the `md:` Tailwind breakpoint (768px).
- **CON-002**: No new npm dependencies may be introduced — `react-day-picker/style.css` is already bundled with the existing `react-day-picker@^9.14.0` package.
- **CON-003**: No changes to API routes, database schema, or Drizzle migrations.
- **CON-004**: Existing form validation logic (username availability check, PR range validation, highlight title requirement) must remain untouched.
- **CON-005**: Existing reduced-motion support (`useReducedMotion`) must continue to function.
- **GUD-001**: Follow existing Tailwind + shadcn patterns in `packages/ui`. Design token changes belong in `packages/ui/src/styles/globals.css`.
- **GUD-002**: Use `@workspace/*` imports for shared packages. No deep relative imports across package boundaries.
- **PAT-001**: Use CSS Grid (`grid-cols-1 md:grid-cols-2`) for responsive 2-column layouts rather than flexbox for consistent gutter/alignment behavior.

## 2. Current State Analysis

### Step 1 — Profile Basics

| Aspect | Current | Problem |
|--------|---------|---------|
| Layout | Single column, `max-w-md` | 8 fields stacked vertically = excessive scrolling |
| Container | `<form className="mx-auto flex w-full max-w-md flex-col gap-6">` | Too narrow, wastes horizontal space on desktop |
| Fields | Avatar → Full Name → Username → Tagline → Athlete Types → Location → Fav Run Time → Running Personality → Next button | All in one column, no grouping |

### Step 2 — Personal Records

| Aspect | Current | Problem |
|--------|---------|---------|
| Layout | 2-column: form (60%) + card preview (40%) on `md:` | Good — mostly fine |
| Missing | No instructional text above the form fields | Users may not know they can leave fields blank |
| Card preview | `md:sticky md:top-24` | Works but could be more prominent |

### Step 3 — Highlights

| Aspect | Current | Problem |
|--------|---------|---------|
| Layout | Single column, `max-w-md` | With 2 highlights (6 fields each), page is extremely long |
| Date/Image | Stacked vertically within each card | Wastes horizontal space on desktop |
| Back button | `<Button type="button" variant="outline" disabled={isBusy} onClick={onBack}>Back</Button>` | Missing `<Icons.back>` icon — inconsistent with Step 2 |
| Nav buttons | 3 buttons stacked vertically: Finish → Skip → Back | Poor hierarchy; primary action (Finish) should be prominent alongside Back |
| Date picker | Uses `react-day-picker` v9 `DayPicker` inside `Popover` | **BUG**: No `import "react-day-picker/style.css"` — calendar renders unstyled |

### Completion View

| Aspect | Current | Problem |
|--------|---------|---------|
| Layout | Vertical stack: heading → profile card → PR card (small) → buttons | PR card is small and left-aligned; wasted horizontal space |
| Actions | 3 disabled "coming soon" buttons + dashboard link, stacked vertically on mobile | Should be horizontal row on all breakpoints |
| Container | `max-w-2xl` | Too narrow for a celebratory completion screen |

### Server Layout

| Aspect | Current | Problem |
|--------|---------|---------|
| Container | `<div className="mx-auto max-w-2xl px-4 py-8">` | Constrains Steps 1, 3, and Completion to narrow width |

## 3. Implementation Steps

### Phase 1 — Fix Critical Bug: Date Picker Styling

- GOAL-001: Fix the broken `DatePicker` calendar rendering by importing `react-day-picker` v9's required CSS stylesheet and adding brand-consistent overrides.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | In `packages/ui/src/components/date-picker.tsx`, add `import "react-day-picker/style.css"` at the top of the file (after the `"use client"` directive, before other imports). This is the v9 built-in stylesheet that the component currently omits, causing the calendar to render with no styles. | | |
| TASK-002 | In `packages/ui/src/styles/globals.css`, add a new `/* react-day-picker brand overrides */` section after the existing theme blocks. **Important:** All variable overrides must target `.rdp-root` (not `:root`), since v9 scopes its custom properties to that class. Reference `node_modules/.pnpm/react-day-picker@9.14.0_react@19.2.4/node_modules/react-day-picker/src/style.css` for the full variable list. Overrides: (a) `.rdp-root { --rdp-accent-color: var(--lime-500); --rdp-accent-background-color: var(--lime-500); --rdp-today-color: var(--lime-600); }` — this handles chevron fill, selected border, and today text color, (b) `.rdp-selected .rdp-day_button { background-color: var(--lime-500); color: var(--color-slate-900, #0f172a); }` — v9 does NOT apply a background to selected days in single mode (only a border), so an explicit class override is required, (c) `.rdp-today:not(.rdp-outside) .rdp-day_button { border-color: var(--lime-300); }` — today ring, (d) `.rdp-day_button:hover { background-color: var(--lime-50); } .dark .rdp-day_button:hover { background-color: var(--lime-900); }` — hover states for light/dark (v9 base CSS has no hover styles), (e) `.rdp-month_caption { font-family: var(--font-heading); }` — month caption font. **Note:** Brand colors use OKLCH values (e.g., `--lime-500: oklch(0.795 0.224 120)`) — these are standard CSS custom properties and work correctly with `var()` references. | | |
| TASK-003 | Verify the date picker renders correctly by running `pnpm build` and visually confirming: calendar grid is properly styled, month/year navigation arrows work, selected day shows lime highlight, today has border ring, and the popover opens/closes cleanly. | | |

**Files:**
- `packages/ui/src/components/date-picker.tsx`
- `packages/ui/src/styles/globals.css`

---

### Phase 2 — Redesign Step 1: Profile Basics (2-Column Grid)

- GOAL-002: Replace the single-column `max-w-md` layout with a responsive 2-column CSS grid that groups identity fields (left) and preference fields (right), significantly reducing vertical scroll on desktop.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | In `profile-basics-step.tsx`, change the `<form>` container class from `"mx-auto flex w-full max-w-md flex-col gap-6"` to `"mx-auto flex w-full max-w-2xl flex-col gap-6"`. This widens the form container from 448px to 672px max while preserving `flex flex-col gap-6` layout behavior (using `space-y-6` instead would switch from flex gap to margin-based spacing, which interacts differently with child margins and hidden elements). | | |
| TASK-005 | Keep the avatar `FileUpload` as a full-width centered element above the grid (unchanged). | | |
| TASK-006 | Below the avatar, create a responsive 2-column layout using **two explicit wrapper divs** inside a CSS grid container: `<div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">`. **Left column wrapper:** `<div className="flex flex-col gap-5">` containing Full Name, Username (with availability indicator), Tagline (`TextareaWithCounter`). **Right column wrapper:** `<div className="flex flex-col gap-5">` containing Athlete Types (multi-select), Location, Favorite Run Time (select), Running Personality (select). **Rationale:** CSS Grid auto-placement would interleave fields incorrectly (Full Name \| Username instead of Full Name \| Athlete Types). Two explicit column divs ensure correct field grouping, isolate error-message layout shifts to each column, and handle the height mismatch from the Tagline textarea naturally (each column flows independently). On mobile (`grid-cols-1`), both column divs stack vertically with `gap-y-5` between them. | | |
| TASK-007 | Move the Submit `<Button>` outside the grid into a full-width container below: `<div className="pt-2"><Button type="submit" className="w-full md:w-auto" ...>Next</Button></div>`. | | |
| TASK-008 | On mobile (`<md` breakpoint), the grid collapses to `grid-cols-1`, preserving the current single-column experience. Verify no horizontal overflow on 375px viewport. | | |

**Files:**
- `apps/web/components/onboarding/steps/profile-basics-step.tsx`

**Proposed Layout (desktop):**
```
┌──────────────────────────────────┐
│         [Avatar Upload]          │  ← full-width, centered
├────────────────┬─────────────────┤
│  Full Name     │  Athlete Types  │
│  Username ✓    │  Location       │
│  Tagline       │  Fav Run Time   │
│                │  Running Pers.  │
├────────────────┴─────────────────┤
│            [Next →]              │  ← full-width button
└──────────────────────────────────┘
```

---

### Phase 3 — Enhance Step 2: Personal Records (Minor Polish)

- GOAL-003: Add instructional text and ensure the card preview sticky positioning is robust on desktop.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | In `personal-records-step.tsx`, add a brief instructional paragraph above the standard distance fields: `<p className="text-muted-foreground text-sm">Enter your best times below. Leave blank any distances you haven't raced.</p>`. Place this inside the `<form>` element, before the `<div className="space-y-5">` that contains the distance inputs. | | |
| TASK-010 | Verify the card preview `md:sticky md:top-24` positioning works correctly — the card should remain visible while scrolling through the form on desktop. No CSS changes expected; this is a visual QA check. | | |

**Files:**
- `apps/web/components/onboarding/steps/personal-records-step.tsx`

---

### Phase 4 — Redesign Step 3: Highlights (Compact Grid + Fix Back Button)

- GOAL-004: Reduce vertical scroll in the highlights step by using internal 2-column grids within each highlight card, fix the missing Back button icon, and reorder navigation buttons into a horizontal row on desktop.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | In `highlights-step.tsx`, change the `<form>` container class from `"mx-auto flex w-full max-w-md flex-col gap-6"` to `"mx-auto flex w-full max-w-3xl flex-col gap-6"`. This widens the container while preserving `flex flex-col gap-6` layout behavior. | | |
| TASK-012 | Within each highlight `<Card>` / `<CardContent>`, restructure the Date and Image fields to sit side-by-side on desktop. Wrap them in a `<div className="grid grid-cols-1 gap-4 md:grid-cols-2">` container. The Date `DatePicker` goes in one column, the Image `FileUpload` goes in the other. | | |
| TASK-013 | Fix the **Back button** to match Step 2 exactly (icon + size): change from `<Button type="button" variant="outline" disabled={isBusy} onClick={onBack}>Back</Button>` to `<Button type="button" variant="outline" size="md" disabled={isBusy} onClick={onBack}><Icons.back className="size-4" />Back</Button>`. **Note:** Step 2's Back button uses `size="md"` — the size prop must also be included for full visual consistency (REQ-004). | | |
| TASK-014 | Restructure the navigation buttons from vertical stack to horizontal row on desktop. Replace the current `<div className="flex flex-col gap-3">` with `<div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">`. **DOM order** must be: Back → Skip → Finish (so that `flex-col-reverse` on mobile shows Finish on top). Reorder visually on desktop (`sm:flex-row`): `← Back` (outline, left) \| `Skip this step` (outline, center) \| `Finish` (primary, right). **Preserve all state bindings:** `isLoading={isSubmitting}` and `disabled={isBusy \|\| uploadingIndex !== null}` on Finish, `isLoading={isSkipping}` and `disabled={isBusy}` on Skip, `disabled={isBusy}` on Back. **Note:** The "Add another highlight" button should remain in its current position between the last highlight card and the navigation buttons. | | |
| TASK-015 | Verify the compact layout reduces per-card height by approximately 30% on desktop. With 2 highlights, the full form should be visible without scrolling on a 900px+ viewport height. | | |

**Files:**
- `apps/web/components/onboarding/steps/highlights-step.tsx`

**Proposed Highlight Card Layout (desktop):**
```
┌─────────────────────────────────────────┐
│  Title                                  │  ← full-width
├────────────────────┬────────────────────┤
│  Distance          │  Duration          │  ← 2-col (already done)
├────────────────────┴────────────────────┤
│  Story (textarea)                       │  ← full-width
├────────────────────┬────────────────────┤
│  Date (DatePicker) │  Image (upload)    │  ← NEW: side-by-side
├────────────────────┴────────────────────┤
│  [Remove highlight]                     │  ← if >1 highlight
└─────────────────────────────────────────┘

Navigation (desktop):
┌──────────┬───────────────┬──────────────┐
│ ← Back   │ Skip this step│    Finish    │
└──────────┴───────────────┴──────────────┘
```

---

### Phase 5 — Redesign Completion View (2-Column + Better Actions)

- GOAL-005: Restructure the completion screen into a 2-column layout on desktop (profile card left, PR card right) with horizontally arranged action buttons, creating a more celebratory and visually balanced experience.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | In `completion-view.tsx`, change the outer container from `"mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-12"` to `"mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-12"`. | | |
| TASK-017 | Replace the current vertical stack of profile `<Card>` (`motion.div` with `resolvedFadeIn`) and `<CardPreview>` (`motion.div` with `resolvedSlideUp`) with a responsive 2-column grid. Wrap both in a single `<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">`. Left column: keep the profile `<Card>` inside its `<motion.div {...resolvedFadeIn}>`. Right column: keep `<CardPreview>` inside its `<motion.div {...resolvedSlideUp}>` and add a flex wrapper for vertical centering: `<motion.div className="flex items-center justify-center" {...resolvedSlideUp}>`. Both `motion.div` animation wrappers must be preserved to maintain the staggered entrance animation and respect `useReducedMotion`. | | |
| TASK-018 | **Verify** (no code change expected) that `<CardPreview>` renders at a proper size within its grid cell. The component already has `w-full max-w-[300px]` in its base className definition in `card-preview.tsx` — do not duplicate this via props. The flex centering wrapper from TASK-017 handles horizontal centering within the grid cell. | | |
| TASK-019 | Restructure the action buttons container: change `"flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"` to `"flex w-full flex-wrap items-center justify-center gap-3"`. **Important:** Each button currently has `className="w-full"` and each `TooltipTrigger` wrapper uses `render={<span className="inline-flex w-full sm:w-auto" />}`. The inner `w-full` forces each button to fill its row on mobile, so the mobile layout will still stack (one button per row) regardless of the container change — this is the desired mobile behavior. On desktop, the `sm:w-auto` spans allow horizontal flow. Also update each `<Button>` from `className="w-full"` to `className="w-full sm:w-auto"` so the buttons themselves respect the horizontal layout on desktop. | | |
| TASK-020 | Verify on mobile (375px) that the 2-column grid gracefully stacks to single column (profile card above PR card), and action buttons wrap cleanly to 2 per row. | | |

**Files:**
- `apps/web/components/onboarding/completion-view.tsx`

**Proposed Completion Layout (desktop):**
```
┌───────────────────────────────────────────┐
│      Your profile is ready! 🎉           │  ← centered heading
│    Time to share your story...            │
├─────────────────────┬─────────────────────┤
│   ┌─────────────┐   │  ┌───────────────┐  │
│   │   [Avatar]   │   │  │ Nishanth M.   │  │
│   │  Nishanth M. │   │  │ Never Settle  │  │
│   │ Never Settle │   │  │               │  │
│   │ [Runner]     │   │  │  5K   │  10K  │  │
│   │ 📍 Coimbatore│   │  │ 19:20 │ 44:20 │  │
│   └─────────────┘   │  │               │  │
│                      │  │  HALF MARATHON│  │
│                      │  │    01:44      │  │
│                      │  └───────────────┘  │
├─────────────────────┴─────────────────────┤
│ [View Profile] [Copy Link] [Download]     │
│              [Go to Dashboard]            │  ← primary CTA
└───────────────────────────────────────────┘
```

---

### Phase 6 — Widen Server Layout Container

- GOAL-006: Update the onboarding server layout container width to accommodate the wider step layouts introduced in Phases 2, 4, and 5.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | In `apps/web/app/(onboarding)/onboarding/layout.tsx`, change the container class from `"mx-auto max-w-2xl px-4 py-8"` to `"mx-auto max-w-4xl px-4 py-8"`. This increases the max container width from 672px to 896px, giving the wider grids room to breathe. | | |
| TASK-022 | Verify all 3 steps + completion page render correctly within the widened container at desktop and mobile viewports. Ensure no horizontal overflow on mobile. | | |

**Files:**
- `apps/web/app/(onboarding)/onboarding/layout.tsx`

---

## 4. File Change Summary

| File | Phase | Change Type | Description |
|------|-------|-------------|-------------|
| `packages/ui/src/components/date-picker.tsx` | 1 | Bug fix | Add `import "react-day-picker/style.css"` |
| `packages/ui/src/styles/globals.css` | 1 | Styling | Add `.rdp-*` brand overrides for calendar (selected, today, hover, nav) |
| `apps/web/components/onboarding/steps/profile-basics-step.tsx` | 2 | Layout | Convert to 2-column CSS grid, widen container to `max-w-2xl` |
| `apps/web/components/onboarding/steps/personal-records-step.tsx` | 3 | Enhancement | Add instructional subheading text |
| `apps/web/components/onboarding/steps/highlights-step.tsx` | 4 | Layout + Fix | 2-col Date/Image grid, fix Back button icon, horizontal button row |
| `apps/web/components/onboarding/completion-view.tsx` | 5 | Layout | 2-column profile+card grid, horizontal action buttons |
| `apps/web/app/(onboarding)/onboarding/layout.tsx` | 6 | Layout | Widen `max-w-2xl` → `max-w-4xl` |

**Unchanged files (no modifications needed):**
- `apps/web/components/onboarding/card-preview.tsx` — reused as-is
- `apps/web/components/onboarding/step-indicator.tsx` — no changes
- `apps/web/components/onboarding/webhook-pending-fallback.tsx` — no changes
- `apps/web/hooks/use-onboarding.ts` — no changes
- `apps/web/app/(onboarding)/onboarding/page.tsx` — no changes (step rendering logic unchanged)
- All API routes (`/api/onboarding/*`) — no changes

## 5. Verification Checklist

| # | Check | Method |
|---|-------|--------|
| 1 | TypeScript compiles with no new errors | `pnpm typecheck` |
| 2 | Production build succeeds | `pnpm build` |
| 3 | Date picker renders styled calendar with month navigation, day selection, lime-500 selected state, lime-300 today ring | Visual QA in browser |
| 4 | Step 1 displays 2-column grid on desktop (≥768px), single column on mobile | Visual QA at 1440px and 375px |
| 5 | Step 2 shows instructional text above distance fields | Visual QA |
| 6 | Step 3 highlight cards show Date/Image side-by-side on desktop | Visual QA at 1440px |
| 7 | Step 3 Back button has `←` arrow icon matching Step 2 | Visual QA |
| 8 | Step 3 navigation buttons are horizontal on desktop, stacked on mobile | Visual QA at 1440px and 375px |
| 9 | Completion page shows 2-column layout (profile left, PR card right) on desktop | Visual QA at 1440px |
| 10 | Completion page stacks vertically on mobile | Visual QA at 375px |
| 11 | All form validation still works: username availability, PR ranges, highlight title requirement | Manual interaction test |
| 12 | Reduced motion preference is respected (animations degrade gracefully) | Toggle `prefers-reduced-motion` in browser DevTools |
| 13 | No horizontal overflow on any screen at 375px mobile viewport | Visual QA with DevTools responsive mode |

## 6. Decisions

| Decision | Rationale |
|----------|-----------|
| No API changes | This is purely a frontend layout/styling redesign |
| No schema changes | Data model is unaffected by UI restructuring |
| No new dependencies | `react-day-picker/style.css` is bundled with the existing `react-day-picker@^9.14.0` package |
| Mobile-first CSS | All grids default to `grid-cols-1` and expand at `md:` — consistent with project conventions |
| CSS Grid over Flexbox for 2-col layouts | Grid provides consistent gutter sizing and alignment, better suited for form field layouts |
| Two explicit column divs for Step 1 grid | CSS Grid auto-placement interleaves fields incorrectly; explicit wrapper divs ensure correct left/right grouping and isolate error-message layout shifts |
| Preserve `flex flex-col gap-6` on form containers | `space-y-6` (margin-based) behaves differently from `gap-6` (flex gap) with child margins and hidden elements; keeping flex layout avoids subtle breakage |
| RDP overrides target `.rdp-root` | react-day-picker v9 scopes its CSS custom properties under `.rdp-root`, not `:root` — overrides must match this scope |
| Back button `size="md"` on Step 3 | Step 2's Back button uses `size="md"` — matching the prop ensures full visual consistency per REQ-004 |
| `max-w-4xl` for server layout | 896px strikes a balance — wide enough for 2-col grids, not so wide that content feels sparse |
| Back button uses `Icons.back` | Same icon already used in Step 2 — ensures cross-step consistency |
| Button reorder in Step 3 | Horizontal layout with primary action (Finish) positioned rightmost follows standard form UX patterns (F-pattern reading → action on right) |

## 7. Future Considerations

| Item | Context | Recommendation |
|------|---------|----------------|
| Highlight card count | Currently max 2 during onboarding | The compact 2-col layout handles 2 well. If scaling to 3+, implement an accordion/collapsible pattern. Out of scope for this redesign. |
| Step 2 card animation | Adding a subtle scale pulse when records update | Nice polish but optional. If it feels over-engineered, skip and keep the current live-update behavior. |
| Completion disabled buttons | 3 "coming soon" buttons (View Profile, Copy Link, Download Card) add visual clutter | Recommend keeping them — they set expectations for future features and balance the layout. Revisit when features launch. |
| Calendar component extraction | Currently `DayPicker` is used directly inside `DatePicker` with no standalone `calendar.tsx` | If a standalone calendar is needed elsewhere (e.g., dashboard), extract into `packages/ui/src/components/calendar.tsx`. Not needed for this redesign. |
| Dark mode calendar | The `.rdp-*` overrides should handle both themes via CSS variables | Verify dark mode styling during Phase 1 QA. The design system specifies both light (`lime-50`) and dark (`lime-900`) hover states. |
