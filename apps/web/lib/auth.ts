import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import type { User } from "@workspace/database/types"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()

  if (!userId) return null

  const result = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  return result ?? null
}

export async function requireCurrentUser(): Promise<User> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await getCurrentUser()
  if (!user) redirect("/onboarding")

  return user
}
