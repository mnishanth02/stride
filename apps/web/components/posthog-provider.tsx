"use client"

import { useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect, useRef } from "react"

import { identifyUser, resetAnalytics } from "@/lib/analytics"

const isPostHogEnabled =
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "1"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser()
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isPostHogEnabled) {
      console.warn(
        "[PostHog] Analytics disabled (NEXT_PUBLIC_POSTHOG_ENABLED is not 'true')"
      )
      return
    }

    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!token || !host) return

    posthog.init(token, {
      api_host: host,
      person_profiles: "identified_only",
      persistence: "memory",
      capture_pageview: false,
      capture_pageleave: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug()
        }
      },
    })
  }, [])

  useEffect(() => {
    if (!isPostHogEnabled) return

    if (isSignedIn && user && identifiedRef.current !== user.id) {
      const identified = identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
      })
      if (identified) {
        identifiedRef.current = user.id
      }
    } else if (!isSignedIn && identifiedRef.current) {
      resetAnalytics()
      identifiedRef.current = null
    }
  }, [isSignedIn, user])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
