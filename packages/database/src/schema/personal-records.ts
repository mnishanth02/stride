import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    category: text("category").notNull(),
    value: text("value").notNull(),
    unit: text("unit").notNull(),
    achievedAt: timestamp("achieved_at", { withTimezone: true, mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("personal_records_user_id_idx").on(table.userId)]
)

export type PersonalRecord = typeof personalRecords.$inferSelect
export type NewPersonalRecord = typeof personalRecords.$inferInsert
