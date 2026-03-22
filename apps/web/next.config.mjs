import path from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"

const { loadEnvConfig } = nextEnv

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(currentDir, "../..")

// forceReload: true is required because Next.js internally calls loadEnvConfig
// from apps/web/ first (finding no .env files), caching the empty result.
// Without forceReload the second call here is silently skipped.
loadEnvConfig(
  workspaceRoot,
  process.env.NODE_ENV !== "production",
  undefined,
  true
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/database",
    "@workspace/storage",
  ],
}

export default nextConfig
