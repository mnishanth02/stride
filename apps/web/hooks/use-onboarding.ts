"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

type OnboardingStep = 1 | 2 | 3

export function useOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStep = useMemo<OnboardingStep>(() => {
    const raw = searchParams.get("step")
    const parsed = raw ? Number.parseInt(raw, 10) : 1
    if (parsed >= 1 && parsed <= 3) return parsed as OnboardingStep
    return 1
  }, [searchParams])

  const goToStep = useCallback(
    (step: number, options?: { replace?: boolean }) => {
      const clamped = Math.max(1, Math.min(3, step))
      const url = `/onboarding?step=${clamped}`
      if (options?.replace) {
        router.replace(url)
      } else {
        router.push(url)
      }
    },
    [router]
  )

  const nextStep = useCallback(() => {
    if (currentStep < 3) goToStep(currentStep + 1)
  }, [currentStep, goToStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  return { currentStep, goToStep, nextStep, prevStep }
}
