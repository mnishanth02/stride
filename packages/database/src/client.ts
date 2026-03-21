import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema/index"

function createDb() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  const sql = neon(databaseUrl)
  return drizzle({ client: sql, schema })
}

let _db: ReturnType<typeof createDb> | undefined

export function getDb() {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    return Reflect.get(getDb(), prop)
  },
})

export type Database = ReturnType<typeof createDb>
