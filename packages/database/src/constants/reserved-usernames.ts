export const RESERVED_USERNAMES = new Set([
  "admin",
  "dashboard",
  "api",
  "login",
  "signup",
  "settings",
  "support",
  "help",
  "about",
  "onboarding",
  "card",
  "terms",
  "privacy",
  "explore",
  "search",
])

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
