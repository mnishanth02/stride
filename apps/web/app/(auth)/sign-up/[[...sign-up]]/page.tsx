"use client"

import { useSignUp } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Icons } from "@workspace/ui/lib/icons"
import { emailSchema, passwordSchema } from "@workspace/ui/lib/validations"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, errors, fetchStatus } = useSignUp()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"form" | "verify">("form")
  const [showPassword, setShowPassword] = useState(false)
  const [clientErrors, setClientErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  if (!signUp) return null

  const isFetching = fetchStatus === "fetching"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)
    setClientErrors({})

    const emailResult = emailSchema.safeParse(email)
    const passwordResult = passwordSchema.safeParse(password)

    if (!emailResult.success || !passwordResult.success) {
      setClientErrors({
        email: emailResult.error?.issues[0]?.message,
        password: passwordResult.error?.issues[0]?.message,
      })
      return
    }

    try {
      await signUp.password({ emailAddress: email, password })

      if (signUp.status === "missing_requirements") {
        await signUp.verifications.sendEmailCode()
        setStep("verify")
      }
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    try {
      await signUp.verifications.verifyEmailCode({ code })

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
      }
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  async function handleGoogleOAuth() {
    setGlobalError(null)
    try {
      await signUp.sso({
        strategy: "oauth_google",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/sign-up/tasks",
      })
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {step === "form" ? "Create your account" : "Verify your email"}
        </CardTitle>
        <CardDescription>
          {step === "form"
            ? "Enter your details to get started"
            : `We sent a verification code to ${email}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {globalError && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {globalError}
          </div>
        )}

        {errors?.global && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {errors.global[0]?.message}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={
                  !!(clientErrors.email || errors?.fields?.emailAddress)
                }
                aria-describedby="signup-email-error"
                required
              />
              {(clientErrors.email || errors?.fields?.emailAddress) && (
                <p
                  id="signup-email-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {clientErrors.email || errors?.fields?.emailAddress?.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={
                    !!(clientErrors.password || errors?.fields?.password)
                  }
                  aria-describedby="signup-password-error"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Icons.eyeSlash className="size-4" />
                  ) : (
                    <Icons.eye className="size-4" />
                  )}
                </button>
              </div>
              {(clientErrors.password || errors?.fields?.password) && (
                <p
                  id="signup-password-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {clientErrors.password || errors?.fields?.password?.message}
                </p>
              )}
            </div>

            <div id="clerk-captcha" />

            <Button type="submit" className="w-full" disabled={isFetching}>
              {isFetching && <Icons.loading className="size-4 animate-spin" />}
              Create account
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs uppercase">
                Or continue with
              </span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleOAuth}
              disabled={isFetching}
            >
              <Icons.google className="size-4" />
              Google
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                aria-invalid={!!errors?.fields?.code}
                aria-describedby="signup-code-error"
                autoFocus
                required
              />
              {errors?.fields?.code && (
                <p
                  id="signup-code-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {errors.fields.code.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isFetching}>
              {isFetching && <Icons.loading className="size-4 animate-spin" />}
              Verify
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
                onClick={async () => {
                  setGlobalError(null)
                  try {
                    await signUp.verifications.sendEmailCode()
                  } catch (err) {
                    if (err instanceof Error && !("clerkError" in err)) {
                      setGlobalError(err.message)
                    }
                  }
                }}
                disabled={isFetching}
              >
                Didn&apos;t receive a code? Resend
              </button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
