import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { highlights, users } from "@workspace/database/schema"
import {
  highlightStorySchema,
  highlightTitleSchema,
} from "@workspace/ui/lib/validations"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

const MAX_HIGHLIGHTS = 2

const highlightsSchema = z.object({
  highlights: z
    .array(
      z.object({
        title: highlightTitleSchema,
        story: highlightStorySchema.optional().or(z.literal("")),
        imageUrl: z.string().url().optional().or(z.literal("")),
        distanceText: z.string().optional().or(z.literal("")),
        durationText: z.string().optional().or(z.literal("")),
        highlightDate: z.string().optional().or(z.literal("")),
        sortOrder: z.number().int().optional(),
      })
    )
    .max(MAX_HIGHLIGHTS, `You can add up to ${MAX_HIGHLIGHTS} highlights`),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = highlightsSchema.safeParse(body)

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

    // Validate highlight dates are not in the future
    const now = new Date()
    const errors: string[] = []
    result.data.highlights.forEach(
      (
        h: z.infer<typeof highlightsSchema>["highlights"][number],
        index: number
      ) => {
        if (h.highlightDate) {
          const date = new Date(h.highlightDate)
          if (date > now) {
            errors.push(`Highlight ${index + 1}: date cannot be in the future`)
          }
        }
      }
    )

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      )
    }

    const validHighlights = result.data.highlights.map(
      (
        h: z.infer<typeof highlightsSchema>["highlights"][number],
        index: number
      ) => ({
        userId: user.id,
        title: h.title.trim(),
        story: h.story?.trim() || null,
        imageUrl: h.imageUrl || null,
        distanceText: h.distanceText?.trim() || null,
        durationText: h.durationText?.trim() || null,
        highlightDate: h.highlightDate || null,
        sortOrder: h.sortOrder ?? index,
      })
    )

    await db.transaction(async (tx) => {
      await tx.delete(highlights).where(eq(highlights.userId, user.id))
      if (validHighlights.length > 0) {
        await tx.insert(highlights).values(validHighlights)
      }
    })

    return NextResponse.json({
      success: true,
      count: validHighlights.length,
    })
  } catch (error) {
    console.error("Highlights save failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
