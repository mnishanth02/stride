"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

interface UsernameCheckResult {
  isAvailable: boolean | null
  isChecking: boolean
  reason: string | null
}

export function useUsernameCheck(
  username: string,
  currentUsername?: string
): UsernameCheckResult {
  const [debouncedUsername, setDebouncedUsername] = useState("")

  useEffect(() => {
    if (!username || username.length < 3) {
      setDebouncedUsername("")
      return
    }

    const timer = setTimeout(() => {
      setDebouncedUsername(username.toLowerCase().trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [username])

  const isOwnUsername =
    !!currentUsername &&
    !!debouncedUsername &&
    debouncedUsername === currentUsername.toLowerCase()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["username-check", debouncedUsername],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/check-username?username=${encodeURIComponent(debouncedUsername)}`
      )
      if (!res.ok) throw new Error("Check failed")
      return res.json() as Promise<{ available: boolean; reason?: string }>
    },
    enabled:
      !!debouncedUsername && debouncedUsername.length >= 3 && !isOwnUsername,
    retry: 1,
    retryDelay: 500,
    staleTime: 30_000,
  })

  if (isOwnUsername) {
    return { isAvailable: true, isChecking: false, reason: null }
  }

  if (!debouncedUsername || debouncedUsername.length < 3) {
    return { isAvailable: null, isChecking: false, reason: null }
  }

  if (isLoading || isFetching) {
    return { isAvailable: null, isChecking: true, reason: null }
  }

  if (data) {
    return {
      isAvailable: data.available,
      isChecking: false,
      reason: data.available
        ? null
        : (data.reason ?? "Username is not available"),
    }
  }

  return { isAvailable: null, isChecking: false, reason: null }
}
