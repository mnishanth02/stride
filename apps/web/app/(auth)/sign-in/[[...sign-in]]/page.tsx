"use client"

import { useSignIn } from "@clerk/nextjs"
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

type Step = "credentials" | "needs_client_trust" | "needs_second_factor"

interface FormErrors {
  email?: string
  password?: string
}

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<Step>("credentials")
  const [clientTrustCode, setClientTrustCode] = useState("")
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  if (!signIn) return null

  const isLoading = fetchStatus === "fetching"

  function validate(): boolean {
    const errs: FormErrors = {}
    const emailResult = emailSchema.safeParse(email)
    if (!emailResult.success) {
      errs.email = emailResult.error.issues[0]?.message
    }
    const passwordResult = passwordSchema.safeParse(password)
    if (!passwordResult.success) {
      errs.password = passwordResult.error.issues[0]?.message
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function finalize() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErrors({})
    setGlobalError(null)
    if (!validate()) return

    try {
      await signIn.password({ emailAddress: email, password })

      if (signIn.status === "complete") {
        await finalize()
      } else if (signIn.status === "needs_client_trust") {
        const emailFactor = signIn.supportedSecondFactors?.find(
          (f: { strategy: string }) => f.strategy === "email_code"
        )
        if (emailFactor) {
          await signIn.mfa.sendEmailCode()
          setStep("needs_client_trust")
        } else {
          setStep("needs_second_factor")
        }
      } else if (signIn.status === "needs_second_factor") {
        setStep("needs_second_factor")
      }
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    try {
      await signIn.mfa.verifyEmailCode({ code: clientTrustCode })

      if (signIn.status === "complete") {
        await finalize()
      }
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  async function handleResendCode() {
    setGlobalError(null)

    try {
      await signIn.mfa.sendEmailCode()
    } catch (err) {
      if (err instanceof Error && !("clerkError" in err)) {
        setGlobalError(err.message)
      }
    }
  }

  function handleStartOver() {
    setStep("credentials")
    setClientTrustCode("")
    setFormErrors({})
    setGlobalError(null)
  }

  function handleGoogleSignIn() {
    signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/sign-in/tasks",
    })
  }

  if (step === "needs_second_factor") {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-bold text-2xl tracking-tight">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Two-factor authentication is required. Please contact support.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={handleStartOver}>
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (step === "needs_client_trust") {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-bold text-2xl tracking-tight">
            Verify Your Identity
          </CardTitle>
          <CardDescription>
            We sent a verification code to your email. Enter it below to
            continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerifyCode}>
          <CardContent className="space-y-4">
            {globalError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {globalError}
              </div>
            )}
            {errors?.global && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
                {errors.global[0]?.message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                value={clientTrustCode}
                onChange={(e) => setClientTrustCode(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors?.global}
                aria-describedby="code-error"
              />
              {errors?.global && (
                <p
                  id="code-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {errors.global[0]?.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Icons.loading className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                Resend code
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleStartOver}
                disabled={isLoading}
              >
                Start over
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-bold text-2xl tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {globalError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {globalError}
            </div>
          )}
          {errors?.global && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
              {errors.global[0]?.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!(formErrors.email || errors?.fields?.identifier)}
              aria-describedby="email-error"
            />
            {(formErrors.email || errors?.fields?.identifier) && (
              <p
                id="email-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {formErrors.email || errors.fields.identifier?.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <span
                className="cursor-default text-muted-foreground text-xs"
                title="Coming soon"
              >
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
                aria-invalid={
                  !!(formErrors.password || errors?.fields?.password)
                }
                aria-describedby="password-error"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Icons.eyeSlash className="h-4 w-4" />
                ) : (
                  <Icons.eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {(formErrors.password || errors?.fields?.password) && (
              <p
                id="password-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {formErrors.password || errors.fields.password?.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Icons.loading className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign in
          </Button>
          <div className="relative flex w-full items-center">
            <Separator className="flex-1" />
            <span className="px-3 text-muted-foreground text-xs">
              Or continue with
            </span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
