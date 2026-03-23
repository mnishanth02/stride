"use client"

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs"
import { Icons } from "@workspace/ui/lib/icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function SSOCallbackPage() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasRun.current) return
    // Wait for Clerk to fully load before inspecting statuses —
    // proxy objects have default values (e.g. "needs_identifier") before load completes
    if (!clerk.loaded) return
    if (!signIn || !signUp) return
    hasRun.current = true

    async function finalizeSignIn() {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/dashboard")
          if (url.startsWith("http")) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    }

    async function finalizeSignUp() {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/onboarding")
          if (url.startsWith("http")) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    }

    async function handleCallback() {
      try {
        // Sign-in completed
        if (signIn.status === "complete") {
          await finalizeSignIn()
          return
        }

        // Sign-up completed (new user via OAuth)
        if (signUp.status === "complete") {
          await finalizeSignUp()
          return
        }

        // Transfer: user tried sign-in but no account exists — transfer to sign-up
        if (signIn.isTransferable) {
          await signUp.create({ transfer: true })
          // After transfer with verified OAuth email, sign-up is usually complete
          if ((signUp.status as string) === "complete") {
            await finalizeSignUp()
          } else {
            router.push("/sign-up")
          }
          return
        }

        // Transfer: user tried sign-up but account already exists — transfer to sign-in
        if (signUp.isTransferable) {
          await signIn.create({ transfer: true })
          if ((signIn.status as string) === "complete") {
            await finalizeSignIn()
          } else {
            router.push("/sign-in")
          }
          return
        }

        // Second factor or client trust required — redirect to sign-in page
        if (
          signIn.status === "needs_second_factor" ||
          signIn.status === "needs_client_trust"
        ) {
          router.push("/sign-in")
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

        // Fallback — unexpected state
        console.error("SSO callback: unexpected state", {
          signInStatus: signIn.status,
          signUpStatus: signUp.status,
        })
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
  }, [clerk.loaded, signIn, signUp, router])

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
      {/* Required for captcha verification during sign-in → sign-up transfer flows */}
      <div id="clerk-captcha" />
    </div>
  )
}
