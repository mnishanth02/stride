import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import {
  athleteTypesSchema,
  FAV_RUN_TIMES,
  fullNameSchema,
  locationSchema,
  RUNNING_PERSONALITIES,
  taglineSchema,
  usernameSchema,
} from "@workspace/ui/lib/validations"
import { and, eq, ne } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  tagline: taglineSchema,
  athleteTypes: athleteTypesSchema,
  location: locationSchema.optional().or(z.literal("")),
  favRunTime: z.enum(FAV_RUN_TIMES).optional().or(z.literal("")),
  runningPersonality: z
    .enum(RUNNING_PERSONALITIES)
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = result.data

    const normalizedUsername = data.username.toLowerCase().trim()
    const normalizedFullName = data.fullName.trim()
    const normalizedTagline = data.tagline.trim()
    const normalizedLocation = data.location?.trim() || null

    // Server-side username uniqueness check
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.username, normalizedUsername),
        ne(users.clerkId, userId)
      ),
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Username is already taken",
          fieldErrors: { username: ["This username is already taken"] },
        },
        { status: 409 }
      )
    }

    const [updated] = await db
      .update(users)
      .set({
        fullName: normalizedFullName,
        username: normalizedUsername,
        tagline: normalizedTagline,
        athleteTypes: data.athleteTypes,
        location: normalizedLocation,
        favRunTime: data.favRunTime || null,
        runningPersonality: data.runningPersonality || null,
        avatarUrl: data.avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("Profile save failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
