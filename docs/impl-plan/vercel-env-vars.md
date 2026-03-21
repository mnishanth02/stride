# Vercel Environment Variables

All variables required for production and preview deployments.

## Server-Only Variables

These are never exposed to the browser bundle.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon pooled connection string for runtime queries | ✅ |
| `DIRECT_URL` | Neon direct connection string for migrations | ✅ |
| `CLERK_SECRET_KEY` | Clerk backend API key | ✅ |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk webhook signature verification secret | ✅ |
| `S3_UPLOAD_KEY` | Cloudflare R2 access key ID | ✅ |
| `S3_UPLOAD_SECRET` | Cloudflare R2 secret access key | ✅ |
| `S3_UPLOAD_BUCKET` | R2 bucket name | ✅ |
| `S3_UPLOAD_REGION` | R2 region (typically `auto`) | ✅ |
| `S3_UPLOAD_ENDPOINT` | R2 S3-compatible API endpoint | ✅ |
| `S3_UPLOAD_PUBLIC_URL` | Public base URL for serving uploaded assets | ✅ |

## Client-Visible Variables

Prefixed with `NEXT_PUBLIC_` — included in the browser bundle.

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_POSTHOG_TOKEN` | PostHog project API key | ✅ |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g., `https://stride.app`) | ✅ |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key | ✅ |

## Clerk Redirect Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLERK_SIGN_IN_URL` | Sign-in page path | `/login` |
| `CLERK_SIGN_UP_URL` | Sign-up page path | `/signup` |
| `CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Redirect after sign-in | `/dashboard` |
| `CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Redirect after sign-up | `/onboarding` |

## Preview Deployments

- Use **branch-specific Neon database URLs** when branch automation is enabled
- Clerk provides separate development/staging keys — use `pk_test_` and `sk_test_` prefixed keys for previews
- PostHog: use the same project token or a separate development project
- R2: use a separate bucket or prefix for preview environments
