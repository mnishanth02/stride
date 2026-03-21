import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { isReservedUsername } from "@workspace/database/constants/reserved-usernames"
import { users } from "@workspace/database/schema"
import { usernameSchema } from "@workspace/ui/lib/validations"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const username = req.nextUrl.searchParams.get("username")?.toLowerCase()

  if (!username) {
    return NextResponse.json(
      { available: false, reason: "Username is required" },
      { status: 400 }
    )
  }

  // Validate format with shared canonical schema
  const result = usernameSchema.safeParse(username)
  if (!result.success) {
    return NextResponse.json({
      available: false,
      reason: result.error.issues[0]?.message ?? "Invalid username format",
    })
  }

  // Check reserved names
  if (isReservedUsername(username)) {
    return NextResponse.json({
      available: false,
      reason: "This username is reserved",
    })
  }

  // Check DB for existing user
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (existing) {
    return NextResponse.json({
      available: false,
      reason: "This username is already taken",
    })
  }

  return NextResponse.json({ available: true })
}
