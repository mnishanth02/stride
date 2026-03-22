import { z } from "zod"

/**
 * Reserved usernames that cannot be claimed by users.
 * Duplicated from @workspace/database/constants/reserved-usernames intentionally —
 * packages/ui must NOT depend on packages/database (Node.js-only transitive deps).
 * Server-side check-username API uses the database copy as the authoritative source.
 */
const RESERVED_USERNAMES = new Set([
  "admin",
  "dashboard",
  "api",
  "login",
  "signup",
  "settings",
  "support",
  "help",
  "about",
  "onboarding",
  "card",
  "terms",
  "privacy",
  "explore",
  "search",
  "sign-in",
  "sign-up",
])

/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

/** Maximum image upload size in bytes (5 MB) */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/** Target compressed image size in bytes (1 MB) */
export const TARGET_COMPRESSED_SIZE = 1 * 1024 * 1024

/** Athlete type options */
export const ATHLETE_TYPES = [
  "Runner",
  "Trekker",
  "Cyclist",
  "Triathlete",
  "Other",
] as const

/** Achievement categories */
export const ACHIEVEMENT_CATEGORIES = [
  "Race",
  "Medal",
  "Milestone",
  "Certificate",
] as const

/** Favorite run time options */
export const FAV_RUN_TIMES = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
] as const

/** Running personality options (MVP — user-selected) */
export const RUNNING_PERSONALITIES = [
  "Early Morning Grinder",
  "Weekend Warrior",
  "Trail Blazer",
  "Marathon Machine",
  "Social Runner",
  "Data Nerd",
  "Zen Runner",
] as const

// ─── Text Limits ─────────────────────────────────────────────────────────────

export const TEXT_LIMITS = {
  username: { min: 3, max: 20 },
  tagline: { max: 80 },
  story: { max: 500 },
  highlightTitle: { max: 60 },
  highlightStory: { max: 200 },
  achievementTitle: { max: 100 },
  location: { max: 100 },
  fullName: { max: 100 },
} as const

// ─── Schemas ─────────────────────────────────────────────────────────────────

// NOTE: Enums and field semantics should be reconciled with Module 0 schema
// closeout before final merge.

export const usernameSchema = z
  .string()
  .min(
    TEXT_LIMITS.username.min,
    `Username must be at least ${TEXT_LIMITS.username.min} characters`
  )
  .max(
    TEXT_LIMITS.username.max,
    `Username must be at most ${TEXT_LIMITS.username.max} characters`
  )
  .regex(
    /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/,
    "Username must start and end with a letter or number, and can only contain lowercase letters, numbers, hyphens, and underscores"
  )
  .refine(
    (val) => !RESERVED_USERNAMES.has(val.toLowerCase()),
    "This username is reserved"
  )

export const emailSchema = z
  .string()
  .email("Please enter a valid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")

export const taglineSchema = z
  .string()
  .max(
    TEXT_LIMITS.tagline.max,
    `Tagline must be at most ${TEXT_LIMITS.tagline.max} characters`
  )

export const storySchema = z
  .string()
  .max(
    TEXT_LIMITS.story.max,
    `Story must be at most ${TEXT_LIMITS.story.max} characters`
  )

export const highlightTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(
    TEXT_LIMITS.highlightTitle.max,
    `Title must be at most ${TEXT_LIMITS.highlightTitle.max} characters`
  )

export const highlightStorySchema = z
  .string()
  .max(
    TEXT_LIMITS.highlightStory.max,
    `Story must be at most ${TEXT_LIMITS.highlightStory.max} characters`
  )

export const locationSchema = z
  .string()
  .max(
    TEXT_LIMITS.location.max,
    `Location must be at most ${TEXT_LIMITS.location.max} characters`
  )

export const fullNameSchema = z
  .string()
  .min(1, "Full name is required")
  .max(
    TEXT_LIMITS.fullName.max,
    `Name must be at most ${TEXT_LIMITS.fullName.max} characters`
  )

export const athleteTypesSchema = z
  .array(z.enum(ATHLETE_TYPES))
  .min(1, "Select at least one athlete type")

export const achievementCategorySchema = z.enum(ACHIEVEMENT_CATEGORIES)

export const favRunTimeSchema = z.enum(FAV_RUN_TIMES)

export const runningPersonalitySchema = z.enum(RUNNING_PERSONALITIES)

// ─── Time Validation ─────────────────────────────────────────────────────────

/** Parse "MM:SS" to total seconds */
export function parseMMSS(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match?.[1] || !match[2]) return null
  const minutes = Number.parseInt(match[1], 10)
  const seconds = Number.parseInt(match[2], 10)
  if (seconds >= 60) return null
  return minutes * 60 + seconds
}

/** Parse "HH:MM:SS" to total seconds */
export function parseHHMMSS(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match?.[1] || !match[2] || !match[3]) return null
  const hours = Number.parseInt(match[1], 10)
  const minutes = Number.parseInt(match[2], 10)
  const seconds = Number.parseInt(match[3], 10)
  if (minutes >= 60 || seconds >= 60) return null
  return hours * 3600 + minutes * 60 + seconds
}

/** Time range validators per distance (product plan §6.2) */
export const PR_RANGES = {
  "5K": {
    format: "MM:SS",
    min: "10:00",
    max: "59:59",
    minSec: 600,
    maxSec: 3599,
  },
  "10K": {
    format: "HH:MM:SS",
    min: "00:25:00",
    max: "01:59:59",
    minSec: 1500,
    maxSec: 7199,
  },
  "Half Marathon": {
    format: "HH:MM:SS",
    min: "00:55:00",
    max: "03:59:59",
    minSec: 3300,
    maxSec: 14399,
  },
  Marathon: {
    format: "HH:MM:SS",
    min: "01:59:00",
    max: "08:00:00",
    minSec: 7140,
    maxSec: 28800,
  },
} as const

export type PRDistance = keyof typeof PR_RANGES

/** Validate a PR time string for a given distance */
export function validatePRTime(
  distance: PRDistance,
  value: string
): string | null {
  const range = PR_RANGES[distance]
  const totalSeconds =
    range.format === "MM:SS" ? parseMMSS(value) : parseHHMMSS(value)

  if (totalSeconds === null) return `Invalid format. Expected ${range.format}`
  if (totalSeconds < range.minSec) return `Time must be at least ${range.min}`
  if (totalSeconds > range.maxSec) return `Time must be at most ${range.max}`
  return null
}

// ─── Image Validation ────────────────────────────────────────────────────────

export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_IMAGE_SIZE, "File must be under 5MB"),
  type: z.enum(ACCEPTED_IMAGE_TYPES, {
    message: "Only JPEG, PNG, and WebP images are accepted",
  }),
})
