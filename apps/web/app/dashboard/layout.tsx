import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  // Defense in depth — proxy.ts already protects this route
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await getCurrentUser()

  // Webhook race condition: Clerk session exists but DB row hasn't been created yet.
  // Module 3 owns retry/recovery for this path; Module 2 redirects as a safe fallback.
  if (!user) {
    redirect("/onboarding")
  }

  if (!user.onboardingCompleted) {
    redirect("/onboarding")
  }

  return <>{children}</>
}
