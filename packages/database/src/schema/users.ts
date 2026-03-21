import {
  boolean,
  index,
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
    clerkId: text("clerk_id").notNull().unique(),
    username: text("username").unique(),
    email: text("primary_email").notNull(),
    emailVerified: boolean("email_verified").default(false),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
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
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
