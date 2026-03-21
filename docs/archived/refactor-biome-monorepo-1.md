---
goal: Replace ESLint and Prettier with a monorepo-wide Biome setup
version: 1.0
date_created: 2026-03-21
last_updated: 2026-03-21
owner: GitHub Copilot
tags: [refactor, tooling, biome, monorepo]
---

# Introduction

This plan documents the completed migration from ESLint and Prettier to Biome for the `stride` monorepo. The implementation establishes a root Biome configuration, adds nested package configurations for UI-specific behavior, removes obsolete ESLint/Prettier files and dependencies, and verifies the new workflow with repository checks.

## 1. Requirements & Constraints

- **REQ-001**: Configure Biome using official Biome guidance for monorepos and configuration inheritance.
- **REQ-002**: Preserve the repository’s existing formatting conventions where they map cleanly from Prettier to Biome.
- **REQ-003**: Remove ESLint- and Prettier-related dependencies, files, scripts, and shared config package references.
- **REQ-004**: Support Next.js, Tailwind CSS v4, and shadcn/ui usage in `apps/web` and `packages/ui`.
- **REQ-005**: Keep root-level linting able to scan the whole repository, including root config files.
- **CON-001**: Biome must ignore generated/build directories and unsupported files without failing the check command.
- **CON-002**: Validation must succeed with `pnpm lint` and TypeScript checks after the migration.
- **GUD-001**: Use nested Biome configs with `extends: "//"` for package-specific overrides, following Biome monorepo guidance.
- **PAT-001**: Prefer Biome `check` for unified linting, formatting verification, import organization, and safe fixes.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Audit existing lint/format tooling and design the target Biome monorepo configuration.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Inspect root and workspace `package.json` files for lint/format scripts and dependencies. | ✅ | 2026-03-21 |
| TASK-002 | Inspect existing `biome.json`, ESLint configs, Prettier configs, and related workspace files. | ✅ | 2026-03-21 |
| TASK-003 | Review official Biome documentation for configuration, monorepo inheritance, migration, and editor integration. | ✅ | 2026-03-21 |

### Implementation Phase 2

- GOAL-002: Implement the Biome-first monorepo setup and remove obsolete tooling.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | Update root `biome.json` with explicit includes, VCS integration, formatter options, and assist configuration. | ✅ | 2026-03-21 |
| TASK-005 | Add `apps/web/biome.json` with Tailwind-aware parsing and class-sorting rules. | ✅ | 2026-03-21 |
| TASK-006 | Add `packages/ui/biome.json` with Tailwind-aware parsing and class-sorting rules. | ✅ | 2026-03-21 |
| TASK-007 | Replace root and package lint/format scripts with Biome commands. | ✅ | 2026-03-21 |
| TASK-008 | Remove ESLint/Prettier dependencies from root and package manifests. | ✅ | 2026-03-21 |
| TASK-009 | Delete `.eslintrc.js`, `.prettierrc`, `.prettierignore`, workspace ESLint config files, and the `packages/eslint-config` package. | ✅ | 2026-03-21 |
| TASK-010 | Add workspace editor recommendations in `.vscode/settings.json` and `.vscode/extensions.json`. | ✅ | 2026-03-21 |

### Implementation Phase 3

- GOAL-003: Validate the migration and resolve any incompatibilities surfaced by Biome.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Refresh the lockfile with `pnpm install` after dependency and workspace removal changes. | ✅ | 2026-03-21 |
| TASK-012 | Fix repository issues surfaced by Biome, including invalid JSON in `packages/typescript-config/react-library.json`. | ✅ | 2026-03-21 |
| TASK-013 | Apply Biome safe fixes with `pnpm lint:fix`. | ✅ | 2026-03-21 |
| TASK-014 | Verify the repository passes `pnpm lint`. | ✅ | 2026-03-21 |
| TASK-015 | Verify TypeScript with `pnpm exec turbo run typecheck --ui=stream`. | ✅ | 2026-03-21 |

## 3. Alternatives

- **ALT-001**: Keep ESLint for linting and use Biome only as a formatter. Rejected because the request explicitly asked to remove ESLint/Prettier-related dependencies and logic.
- **ALT-002**: Use only a root `biome.json` without nested package configs. Rejected because `apps/web` and `packages/ui` benefit from package-local Tailwind-aware rules in line with Biome monorepo guidance.
- **ALT-003**: Keep `turbo lint` and `turbo format` as the primary root scripts. Rejected because root-level Biome commands better cover repository-wide config files and documentation-adjacent JSON files.

## 4. Dependencies

- **DEP-001**: `@biomejs/biome@2.4.8` at the repository root.
- **DEP-002**: VS Code Biome extension recommendation via `biomejs.biome`.
- **DEP-003**: Existing PNPM workspace resolution so package-local scripts can use the root-installed Biome binary.

## 5. Files

- **FILE-001**: `biome.json` — root Biome configuration for the monorepo.
- **FILE-002**: `apps/web/biome.json` — app-specific Biome config for Tailwind-aware behavior.
- **FILE-003**: `packages/ui/biome.json` — UI package Biome config for Tailwind-aware behavior.
- **FILE-004**: `package.json` — root scripts and devDependencies updated for Biome.
- **FILE-005**: `apps/web/package.json` — package scripts and dependencies updated for Biome.
- **FILE-006**: `packages/ui/package.json` — package scripts and dependencies updated for Biome.
- **FILE-007**: `.vscode/settings.json` — workspace formatter and code-actions-on-save defaults.
- **FILE-008**: `.vscode/extensions.json` — Biome extension recommendation.
- **FILE-009**: `packages/typescript-config/react-library.json` — invalid JSON corrected.
- **FILE-010**: `apps/web/app/layout.tsx` — unused import removed and formatting aligned with Biome.
- **FILE-011**: `docs/impl-plan/refactor-biome-monorepo-1.md` — migration plan and execution record.

## 6. Testing

- **TEST-001**: Run `pnpm install` to ensure the lockfile and workspace graph update successfully after removing packages.
- **TEST-002**: Run `pnpm lint:fix` to apply Biome formatting, safe fixes, and import organization.
- **TEST-003**: Run `pnpm lint` and confirm `biome check .` completes without diagnostics.
- **TEST-004**: Run `pnpm exec turbo run typecheck --ui=stream` and confirm all typecheck tasks succeed.
- **TEST-005**: Search the repository for `eslint` and `prettier` references and confirm none remain in tracked source/config files.

## 7. Risks & Assumptions

- **RISK-001**: Biome’s nursery Tailwind class-sorting rule may evolve over time and could produce future diff churn.
- **RISK-002**: Developers without the Biome VS Code extension may not immediately see the intended format-on-save workflow.
- **ASSUMPTION-001**: The repository will continue to use PNPM workspaces and the root-installed Biome binary.
- **ASSUMPTION-002**: YAML and Markdown formatting are not currently required from this toolchain migration.

## 8. Related Specifications / Further Reading

- `docs/core-plan/product-plan.md`
- https://biomejs.dev/guides/configure-biome/
- https://biomejs.dev/guides/big-projects/
- https://biomejs.dev/guides/migrate-eslint-prettier
- https://biomejs.dev/reference/vscode
- https://biomejs.dev/recipes/git-hooks
