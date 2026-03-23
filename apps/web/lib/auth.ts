import { auth, clerkClient } from "@clerk/nextjs/server"
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

  if (result) return result

  // Self-healing: if user.created webhook was missed, create DB row from Clerk
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      ) ?? clerkUser.emailAddresses[0]

    const [inserted] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email: primaryEmail?.emailAddress ?? "",
        emailVerified: primaryEmail?.verification?.status === "verified",
        fullName:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          null,
        avatarUrl: clerkUser.imageUrl ?? null,
      })
      .onConflictDoNothing({ target: users.clerkId })
      .returning()

    return (
      inserted ??
      (await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      })) ??
      null
    )
  } catch (err) {
    console.error("Self-healing user creation failed:", err)
    return null
  }
}

export async function requireCurrentUser(): Promise<User> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await getCurrentUser()
  if (!user) redirect("/onboarding")

  return user
}
