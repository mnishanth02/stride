import { db } from "@workspace/database/client"
import { highlights, personalRecords } from "@workspace/database/schema"
import { asc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { CompletionView } from "@/components/onboarding/completion-view"
import { requireCurrentUser } from "@/lib/auth"

export default async function OnboardingCompletePage() {
  const user = await requireCurrentUser()

  if (!user.onboardingCompleted) {
    redirect("/onboarding")
  }

  const userRecords = await db.query.personalRecords.findMany({
    where: eq(personalRecords.userId, user.id),
    orderBy: [asc(personalRecords.createdAt)],
  })

  const userHighlights = await db.query.highlights.findMany({
    where: eq(highlights.userId, user.id),
    orderBy: [asc(highlights.sortOrder)],
  })

  return (
    <CompletionView
      user={{
        fullName: user.fullName ?? "",
        username: user.username ?? "",
        tagline: user.tagline ?? "",
        athleteTypes: user.athleteTypes ?? [],
        avatarUrl: user.avatarUrl,
        location: user.location,
        favRunTime: user.favRunTime,
        runningPersonality: user.runningPersonality,
      }}
      records={userRecords.map((r) => ({
        distanceLabel: r.distanceLabel,
        timeDisplay: r.timeDisplay,
      }))}
      highlights={userHighlights.map((h) => ({
        title: h.title,
      }))}
    />
  )
}
