import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { personalRecords, users } from "@workspace/database/schema"
import { PR_RANGES, type PRDistance } from "@workspace/ui/lib/validations"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const recordsSchema = z.object({
  records: z
    .array(
      z.object({
        distanceLabel: z.string().min(1),
        distanceKm: z.number().optional(),
        timeSeconds: z.number().int().positive(),
        timeDisplay: z.string().min(1),
        achievedAt: z.string().optional(),
      })
    )
    .min(1, "At least one personal record is required")
    .max(20, "Too many records"),
})

const MAX_SECONDS_PER_DAY = 86400

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = recordsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate each record's time against known distance ranges
    const errors: string[] = []
    const validRecords = result.data.records.map(
      (
        record: z.infer<typeof recordsSchema>["records"][number],
        index: number
      ) => {
        const knownDistance = record.distanceLabel as PRDistance
        const range = PR_RANGES[knownDistance]

        if (range) {
          if (
            record.timeSeconds < range.minSec ||
            record.timeSeconds > range.maxSec
          ) {
            errors.push(
              `Record ${index + 1} (${record.distanceLabel}): time must be between ${range.minSec}s and ${range.maxSec}s`
            )
          }
        } else if (record.timeSeconds >= MAX_SECONDS_PER_DAY) {
          errors.push(
            `Record ${index + 1} (${record.distanceLabel}): time must be less than 24 hours`
          )
        }

        return {
          userId: user.id,
          distanceLabel: record.distanceLabel,
          distanceKm: record.distanceKm?.toString() ?? null,
          timeSeconds: record.timeSeconds,
          timeDisplay: record.timeDisplay,
          achievedAt: record.achievedAt || null,
        }
      }
    )

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      )
    }

    await db.delete(personalRecords).where(eq(personalRecords.userId, user.id))
    if (validRecords.length > 0) {
      await db.insert(personalRecords).values(validRecords)
    }

    return NextResponse.json({
      success: true,
      count: validRecords.length,
    })
  } catch (error) {
    console.error("Records save failed:", error)
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
