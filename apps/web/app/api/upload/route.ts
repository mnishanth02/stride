import { auth } from "@clerk/nextjs/server"
import { createStorageService } from "@workspace/storage/server"
import { NextResponse } from "next/server"

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as {
      filename?: string
      contentType?: string
      size?: number
    }

    const { filename, contentType, size } = body

    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      )
    }

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400 }
      )
    }

    if (typeof size !== "number" || size <= 0) {
      return NextResponse.json(
        { error: "size must be a positive number" },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid content type: ${contentType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
        },
        { status: 400 }
      )
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${size} bytes. Maximum: ${MAX_FILE_SIZE} bytes (5MB)`,
        },
        { status: 400 }
      )
    }

    const storage = createStorageService()
    const payload = await storage.createSignedUpload({
      filename,
      contentType,
      size,
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json(
      { error: "Upload failed. Please try again later." },
      { status: 500 }
    )
  }
}
