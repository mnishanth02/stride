import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    username: text("username"),
    email: text("primary_email").notNull(),
    emailVerified: boolean("email_verified").default(false),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),

    tagline: text("tagline"),
    athleteTypes: text("athlete_types").array(),
    story: text("story"),
    location: text("location"),
    totalKm: numeric("total_km", { precision: 10, scale: 2 }),
    longestRunKm: numeric("longest_run_km", { precision: 10, scale: 2 }),
    yearsActiveSince: integer("years_active_since"),
    favRunTime: text("fav_run_time"),
    runningPersonality: text("running_personality"),
    isPublic: boolean("is_public").default(true).notNull(),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    uniqueIndex("users_username_idx").on(table.username),
    index("users_updated_at_idx").on(table.updatedAt),
    // Composite index for public profile discovery queries
    index("users_public_discovery_idx").on(
      table.isPublic,
      table.isDeleted,
      table.emailVerified,
      table.updatedAt
    ),
    // FTS index requires custom SQL — see fts-index.sql
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
