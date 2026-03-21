"use client"

import { useSignIn, useSignUp } from "@clerk/nextjs"
import { Icons } from "@workspace/ui/lib/icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function SSOCallbackPage() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasRun.current) return
    if (!signIn || !signUp) return
    hasRun.current = true

    async function handleCallback() {
      try {
        // Sign-in completed
        if (signIn.status === "complete") {
          await signIn.finalize({
            navigate: ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                router.push("/sign-in/tasks")
                return
              }
              const url = decorateUrl("/dashboard")
              if (url.startsWith("http")) {
                window.location.href = url
              } else {
                router.push(url)
              }
            },
          })
          return
        }

        // Transfer flow: sign-up completed via sign-in OAuth
        if (signUp.status === "complete") {
          await signUp.finalize({
            navigate: ({ session, decorateUrl }) => {
              if (session?.currentTask) {
                router.push("/sign-up/tasks")
                return
              }
              const url = decorateUrl("/onboarding")
              if (url.startsWith("http")) {
                window.location.href = url
              } else {
                router.push(url)
              }
            },
          })
          return
        }

        // Missing requirements — Clerk needs more info
        if (signUp.status === "missing_requirements") {
          console.error(
            "SSO callback: missing requirements",
            signUp.missingFields
          )
          setError(
            "Additional information is required to complete sign-up. Please try again."
          )
          return
        }

        // Neither complete — unexpected state
        setError("Something went wrong. Please try again.")
      } catch (err) {
        console.error("SSO callback error:", err)
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        )
      }
    }

    handleCallback()
  }, [signIn, signUp, router])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/sign-in")}
          className="text-primary text-sm underline underline-offset-4 hover:text-primary/80"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Icons.loading className="size-6 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Completing sign in…</p>
    </div>
  )
}
