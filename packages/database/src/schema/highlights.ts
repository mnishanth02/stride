import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const highlights = pgTable(
  "highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    story: text("story"),
    imageUrl: text("image_url"),
    distanceText: text("distance_text"),
    durationText: text("duration_text"),
    highlightDate: date("highlight_date"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("highlights_user_id_idx").on(table.userId)]
)

export type Highlight = typeof highlights.$inferSelect
export type NewHighlight = typeof highlights.$inferInsert
