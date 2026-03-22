import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(_request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate required Step 1 fields are complete
    const missingFields: string[] = []
    if (!user.fullName) missingFields.push("fullName")
    if (!user.username) missingFields.push("username")
    if (!user.tagline) missingFields.push("tagline")
    if (!user.athleteTypes || user.athleteTypes.length === 0) {
      missingFields.push("athleteTypes")
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Profile is incomplete. Please complete Step 1 first.",
          missingFields,
        },
        { status: 400 }
      )
    }

    const [updated] = await db
      .update(users)
      .set({
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      username: updated.username,
    })
  } catch (error) {
    console.error("Onboarding complete failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
