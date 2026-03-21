import crypto from "node:crypto"
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type {
  SignedUploadPayload,
  StorageConfig,
  StorageService,
  UploadIntent,
} from "./types"

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const PRESIGNED_URL_EXPIRY = 600 // 10 minutes

function getStorageConfig(): StorageConfig {
  const bucket = process.env.S3_UPLOAD_BUCKET
  const region = process.env.S3_UPLOAD_REGION ?? "auto"
  const endpoint = process.env.S3_UPLOAD_ENDPOINT
  const publicBaseUrl = process.env.S3_UPLOAD_PUBLIC_URL

  if (!bucket) throw new Error("Missing env var: S3_UPLOAD_BUCKET")
  if (!endpoint) throw new Error("Missing env var: S3_UPLOAD_ENDPOINT")
  if (!publicBaseUrl) throw new Error("Missing env var: S3_UPLOAD_PUBLIC_URL")

  return { bucket, region, endpoint, publicBaseUrl }
}

function createS3Client(config: StorageConfig): S3Client {
  const accessKeyId = process.env.S3_UPLOAD_KEY
  const secretAccessKey = process.env.S3_UPLOAD_SECRET

  if (!accessKeyId) throw new Error("Missing env var: S3_UPLOAD_KEY")
  if (!secretAccessKey) throw new Error("Missing env var: S3_UPLOAD_SECRET")

  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, "") // strip path traversal
    .replace(/[/\\]/g, "") // strip slashes
    .replace(/\s+/g, "-") // replace spaces with dashes
    .replace(/[^a-zA-Z0-9._-]/g, "") // remove unsafe chars
    .toLowerCase()
}

function generateKey(filename: string): string {
  const sanitized = sanitizeFilename(filename)
  const timestamp = Date.now()
  const randomHex = crypto.randomBytes(8).toString("hex")
  return `uploads/${timestamp}-${randomHex}-${sanitized}`
}

function validateIntent(intent: UploadIntent): void {
  if (!ALLOWED_MIME_TYPES.has(intent.contentType)) {
    throw new Error(
      `Invalid content type: ${intent.contentType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`
    )
  }

  if (intent.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${intent.size} bytes. Maximum: ${MAX_FILE_SIZE} bytes (5MB)`
    )
  }

  if (intent.size <= 0) {
    throw new Error("File size must be greater than 0")
  }

  if (!intent.filename || intent.filename.trim().length === 0) {
    throw new Error("Filename is required")
  }
}

export function createStorageService(): StorageService {
  const config = getStorageConfig()
  const client = createS3Client(config)

  const getPublicUrl = (key: string): string => {
    const base = config.publicBaseUrl.replace(/\/+$/, "")
    return `${base}/${key}`
  }

  return {
    async createSignedUpload(
      intent: UploadIntent
    ): Promise<SignedUploadPayload> {
      validateIntent(intent)

      const key = generateKey(intent.filename)

      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: intent.contentType,
        ContentLength: intent.size,
      })

      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: PRESIGNED_URL_EXPIRY,
      })

      return {
        key,
        uploadUrl,
        publicUrl: getPublicUrl(key),
        headers: {
          "Content-Type": intent.contentType,
        },
      }
    },

    async deleteFile(key: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })

      await client.send(command)
    },

    getPublicUrl,
  }
}
