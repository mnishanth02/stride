import { relations } from "drizzle-orm"
import { achievements } from "./achievements"
import { highlights } from "./highlights"
import { personalRecords } from "./personal-records"
import { users } from "./users"

export const usersRelations = relations(users, ({ many }) => ({
  personalRecords: many(personalRecords),
  highlights: many(highlights),
  achievements: many(achievements),
}))

export const personalRecordsRelations = relations(
  personalRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [personalRecords.userId],
      references: [users.id],
    }),
  })
)

export const highlightsRelations = relations(highlights, ({ one }) => ({
  user: one(users, {
    fields: [highlights.userId],
    references: [users.id],
  }),
}))

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}))
