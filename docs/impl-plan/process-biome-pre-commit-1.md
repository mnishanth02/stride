---
goal: Add a Biome-powered pre-commit hook workflow to the monorepo
version: 1.0
date_created: 2026-03-21
last_updated: 2026-03-21
owner: GitHub Copilot
tags: [process, tooling, biome, husky, git-hooks]
---

# Introduction

This plan documents the addition of a repository-level pre-commit workflow for the `stride` monorepo. The workflow uses Husky for Git hook installation and Biome for staged-file checks and safe auto-fixes before commits are created.

## 1. Requirements & Constraints

- **REQ-001**: Run Biome automatically before each commit.
- **REQ-002**: Limit hook execution to staged files so commits stay fast in a monorepo.
- **REQ-003**: Apply Biome safe fixes during the hook and re-stage updated files.
- **REQ-004**: Fail early when staged files also contain unstaged edits to avoid accidental index corruption.
- **REQ-005**: Keep the workflow rooted at the monorepo root `package.json`.
- **CON-001**: The hook setup must be compatible with PNPM workspaces.
- **CON-002**: The hook command must not fail when no supported staged files are present.
- **GUD-001**: Follow the official Biome Git hooks guidance for Husky/shell-script usage.
- **PAT-001**: Use `biome check --write --staged --files-ignore-unknown=true --no-errors-on-unmatched` for staged-file validation and fixes.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Add repository-level tooling required for Git hook installation and staged-file Biome checks.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-001 | Update `/package.json` to add `husky` as a root development dependency. | ✅ | 2026-03-21 |
| TASK-002 | Add root scripts for staged-file Biome checks and Husky installation in `/package.json`. | ✅ | 2026-03-21 |
| TASK-003 | Keep hook-related configuration centralized at the repository root. | ✅ | 2026-03-21 |

### Implementation Phase 2

- GOAL-002: Create and validate the pre-commit hook behavior.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-004 | Create `/.husky/pre-commit` with a staged-files-only Biome check in write mode. | ✅ | 2026-03-21 |
| TASK-005 | Add a guard in `/.husky/pre-commit` for partially staged files (`git status --short \| grep '^MM'`). | ✅ | 2026-03-21 |
| TASK-006 | Re-stage files after Biome modifies them using `git update-index --again`. | ✅ | 2026-03-21 |

### Implementation Phase 3

- GOAL-003: Verify installation and execution behavior.

| Task | Description | Completed | Date |
| ---- | ----------- | --------- | ---- |
| TASK-007 | Run `pnpm install` to install Husky and refresh the lockfile. | ✅ | 2026-03-21 |
| TASK-008 | Ensure the hook file is executable and Husky installation metadata exists. | ✅ | 2026-03-21 |
| TASK-009 | Validate staged-file Biome commands from the repository root. | ✅ | 2026-03-21 |

## 3. Alternatives

- **ALT-001**: Use `lint-staged` with Husky. Rejected because Biome already supports `--staged`, so an extra dependency is unnecessary for the current workflow.
- **ALT-002**: Use Lefthook. Rejected because Husky is simpler to add to the existing PNPM/Node root setup.
- **ALT-003**: Use a manually installed `.git/hooks/pre-commit` script. Rejected because it is not reliably shareable across the team without a tracked installer.

## 4. Dependencies

- **DEP-001**: `husky@^9.1.7`
- **DEP-002**: Existing root dependency `@biomejs/biome@2.4.8`
- **DEP-003**: Git repository with a writable `.git/hooks` directory

## 5. Files

- **FILE-001**: `/package.json` — add Husky dependency and hook-related scripts.
- **FILE-002**: `/.husky/pre-commit` — repository pre-commit hook script.
- **FILE-003**: `/pnpm-lock.yaml` — updated lockfile after installing Husky.
- **FILE-004**: `/docs/impl-plan/process-biome-pre-commit-1.md` — implementation record for the hook integration.

## 6. Testing

- **TEST-001**: Run `pnpm install` and confirm Husky installs successfully.
- **TEST-002**: Run `pnpm run check:staged` and confirm it exits cleanly when there are no relevant staged files.
- **TEST-003**: Run the pre-commit script directly and confirm it exits cleanly in a no-op scenario.
- **TEST-004**: Confirm `pnpm lint` still passes after the hook integration.

## 7. Risks & Assumptions

- **RISK-001**: Developers with partially staged files will be blocked until they fully stage or stash changes.
- **RISK-002**: Teams expecting Markdown/YAML formatting at pre-commit time will need an additional formatter later because Biome does not cover that workflow here.
- **ASSUMPTION-001**: Contributors run `pnpm install`, which triggers the root `prepare` script and installs Husky.
- **ASSUMPTION-002**: The repository should only auto-fix Biome-supported files during pre-commit.

## 8. Related Specifications / Further Reading

- `docs/impl-plan/refactor-biome-monorepo-1.md`
- `https://biomejs.dev/recipes/git-hooks`
- `https://biomejs.dev/guides/configure-biome/`
