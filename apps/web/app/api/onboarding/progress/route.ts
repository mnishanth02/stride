import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { highlights, personalRecords, users } from "@workspace/database/schema"
import { asc, eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      // Self-healing: webhook may have been missed — create the DB row
      // from Clerk's authoritative user data.
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
              [clerkUser.firstName, clerkUser.lastName]
                .filter(Boolean)
                .join(" ") || null,
            avatarUrl: clerkUser.imageUrl ?? null,
          })
          .onConflictDoNothing({ target: users.clerkId })
          .returning()

        user =
          inserted ??
          (await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
          }))
      } catch (healErr) {
        console.error("Self-healing user creation failed:", healErr)
      }

      if (!user) {
        return NextResponse.json({
          step: 1,
          user: null,
          records: [],
          highlights: [],
        })
      }
    }

    // Determine current step
    if (user.onboardingCompleted) {
      return NextResponse.json({
        step: "complete",
        user,
        records: [],
        highlights: [],
      })
    }

    const requiredFieldsMissing =
      !user.fullName ||
      !user.username ||
      !user.tagline ||
      !user.athleteTypes ||
      user.athleteTypes.length === 0

    if (requiredFieldsMissing) {
      return NextResponse.json({
        step: 1,
        user,
        records: [],
        highlights: [],
      })
    }

    // Fetch records and highlights for pre-population
    const [userRecords, userHighlights] = await Promise.all([
      db.query.personalRecords.findMany({
        where: eq(personalRecords.userId, user.id),
        orderBy: asc(personalRecords.createdAt),
      }),
      db.query.highlights.findMany({
        where: eq(highlights.userId, user.id),
        orderBy: asc(highlights.sortOrder),
      }),
    ])

    if (userRecords.length === 0) {
      return NextResponse.json({
        step: 2,
        user,
        records: [],
        highlights: userHighlights,
      })
    }

    return NextResponse.json({
      step: 3,
      user,
      records: userRecords,
      highlights: userHighlights,
    })
  } catch (error) {
    console.error("Progress check failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
