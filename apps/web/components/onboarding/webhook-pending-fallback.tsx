"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Icons } from "@workspace/ui/lib/icons"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function WebhookPendingFallback() {
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const { data, isError } = useQuery({
    queryKey: ["onboarding-progress", "webhook-pending"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/progress")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setRetryCount((c) => c + 1)
      return data
    },
    refetchInterval: retryCount < maxRetries ? 2000 : false,
    retry: false,
  })

  const [userFound, setUserFound] = useState(false)

  useEffect(() => {
    if (data?.user && !userFound) {
      setUserFound(true)
      router.refresh()
    }
  }, [data?.user, userFound, router])

  if (userFound) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Icons.checkCircle className="size-8 text-lime-500" />
        <p className="text-muted-foreground text-sm">
          Account ready! Loading...
        </p>
      </div>
    )
  }

  // Max retries exceeded or error
  if (retryCount >= maxRetries || isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Icons.warning className="size-12 text-muted-foreground" />
        <div>
          <h2 className="font-heading font-semibold text-xl">
            Something went wrong
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            We couldn&apos;t set up your account. Please try refreshing.
          </p>
        </div>
        <Button onClick={() => router.refresh()}>Refresh</Button>
      </div>
    )
  }

  // Loading/polling state
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Icons.loading className="size-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Setting up your account…</p>
    </div>
  )
}
