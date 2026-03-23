import { auth } from "@clerk/nextjs/server"
import { db } from "@workspace/database/client"
import { users } from "@workspace/database/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { HomeHero } from "@/components/home-hero"

export default async function Page() {
  const { userId } = await auth()

  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      columns: { onboardingCompleted: true },
    })

    if (user?.onboardingCompleted) {
      redirect("/dashboard")
    }

    redirect("/onboarding")
  }

  return <HomeHero />
}
