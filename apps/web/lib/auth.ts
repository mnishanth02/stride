import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import type { User } from "@workspace/database/types"
import { eq } from "drizzle-orm"

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()

  if (!userId) return null

  const result = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  return result ?? null
}
