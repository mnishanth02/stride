import { WebhookPendingFallback } from "@/components/onboarding/webhook-pending-fallback"
import { getCurrentUser } from "@/lib/auth"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Webhook race: Clerk session exists but DB row hasn't been created yet
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <WebhookPendingFallback />
      </div>
    )
  }

  return <div className="mx-auto max-w-2xl px-4 py-8">{children}</div>
}
