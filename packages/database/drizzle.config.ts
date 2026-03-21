import "dotenv/config"
import { defineConfig } from "drizzle-kit"

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL environment variable is required")
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
})
