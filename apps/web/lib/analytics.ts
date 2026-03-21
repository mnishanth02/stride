import posthog from "posthog-js"

function isAnalyticsReady(): boolean {
  return typeof window !== "undefined" && posthog.__loaded === true
}

export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): boolean {
  if (!isAnalyticsReady()) return false
  posthog.identify(userId, properties)
  return true
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!isAnalyticsReady()) return
  posthog.capture(event, properties)
}

export function resetAnalytics(): void {
  if (!isAnalyticsReady()) return
  posthog.reset()
}
