# Project Guidelines

## Build and Test

- Use `pnpm` for all package management and run workspace-wide commands from the repo root.
- Prefer the root scripts first: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fix`, and `pnpm format`.
- `apps/web` is the main application. Use its local scripts only when you need to scope work to the Next.js app.
- After changing Drizzle schema files in `packages/database/src/schema/`, generate a migration before considering the work complete.

## Architecture

- This is a pnpm workspace + Turborepo monorepo. Keep boundaries clear:
  - `apps/web`: Next.js 16 App Router app, Clerk auth, PostHog, API routes.
  - `packages/ui`: shared shadcn/ui-based component library and global design tokens.
  - `packages/database`: shared Drizzle schema, types, constants, and runtime database client.
  - `packages/storage`: shared Cloudflare R2 upload abstraction.
  - `packages/typescript-config`: shared TypeScript base configs.
- `apps/web/next.config.mjs` transpiles workspace packages. If a new internal package is consumed by the web app, add it there.
- Follow existing provider and root app patterns in `apps/web/app/layout.tsx`.

## Conventions

- Use `@workspace/*` imports for shared packages instead of deep relative imports across package boundaries.
- Use Biome for formatting and linting. Do not introduce ESLint or Prettier.
- Follow the existing Tailwind + shadcn patterns in `packages/ui`; design-token changes belong in `packages/ui/src/styles/globals.css`.
- For auth-protected routes in the web app, use `apps/web/proxy.ts`. Do not introduce `middleware.ts` for this Next.js 16 app.
- In app/runtime code, use the shared database client from `packages/database/src/client.ts`; keep `DIRECT_URL` for migrations/admin flows and `DATABASE_URL` for runtime queries.
- Keep the storage flow consistent with the current abstraction: app code should go through `packages/storage` and the upload API route rather than talking to R2 directly.
- Environment variables are required for build and runtime flows. Keep `.env.example` and `docs/impl-plan/vercel-env-vars.md` in sync when adding or renaming variables.

## Key References

- `docs/impl-plan/infrastructure-module-0-workspace-setup-1.md`: canonical infrastructure and architecture decisions.
- `docs/impl-plan/vercel-env-vars.md`: required environment variables for local, preview, and production setups.
- `docs/core-plan/design-system.md`: brand, theme, and design-system rules.
- `README.md`: monorepo and UI package quick-start notes.
- `AI_ACTIVITY_LOG.md`: canonical AI-assisted project progress tracker maintained by workspace hooks.
- `.github/hooks/project-status.json`: workspace hook entry point for AI activity tracking.

## Agent Hints

- Check `turbo.json`, root `package.json`, and app/package `package.json` files before adding or changing scripts.
- When working in `apps/web`, inspect nearby route handlers, providers, and helpers before introducing new patterns.
- Keep instructions concise in future updates: link to the existing docs above instead of duplicating long implementation plans.
- Keep `AI_ACTIVITY_LOG.md` up to date through the workspace hook flow instead of manually appending ad-hoc status notes.
