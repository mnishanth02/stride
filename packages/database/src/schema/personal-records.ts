import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    distanceLabel: text("distance_label").notNull(),
    distanceKm: numeric("distance_km", { precision: 10, scale: 2 }),
    timeSeconds: integer("time_seconds").notNull(),
    timeDisplay: text("time_display").notNull(),
    achievedAt: date("achieved_at"),
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
