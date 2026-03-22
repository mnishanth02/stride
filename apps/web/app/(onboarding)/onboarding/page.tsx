"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Skeleton,
  SkeletonHeading,
  SkeletonText,
} from "@workspace/ui/components/skeleton"
import {
  fadeInVariants,
  slideUpVariants,
  useReducedMotion,
} from "@workspace/ui/lib/animations"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Icons } from "@workspace/ui/lib/icons"
import { Suspense, useEffect, useRef } from "react"

import { StepIndicator } from "@/components/onboarding/step-indicator"
import { HighlightsStep } from "@/components/onboarding/steps/highlights-step"
import { PersonalRecordsStep } from "@/components/onboarding/steps/personal-records-step"
import { ProfileBasicsStep } from "@/components/onboarding/steps/profile-basics-step"
import { useOnboarding } from "@/hooks/use-onboarding"

function OnboardingLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeading />
      <SkeletonText />
      <SkeletonText />
      <SkeletonText />
      <SkeletonText />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

function OnboardingWizard() {
  const router = useRouter()
  const { currentStep, goToStep, nextStep, prevStep } = useOnboarding()
  const stepContainerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const variants = shouldReduceMotion ? fadeInVariants : slideUpVariants

  const queryClient = useQueryClient()

  const { data: progress, isLoading, isError, refetch } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/progress")
      if (!res.ok) throw new Error("Failed to load progress")
      return res.json()
    },
    staleTime: 0,
  })

  const initialSyncDone = useRef(false)

  useEffect(() => {
    if (!progress || initialSyncDone.current) return

    if (progress.step === "complete") {
      router.replace("/dashboard")
      return
    }

    const serverStep = Number(progress.step)
    if (serverStep !== currentStep) {
      goToStep(serverStep, { replace: true })
    }

    initialSyncDone.current = true
  }, [progress, currentStep, goToStep, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      stepContainerRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line -- intentionally re-run on step change
  }, [currentStep]) // biome-ignore lint/correctness/useExhaustiveDependencies: focus must move on step change

  if (isLoading) {
    return <OnboardingLoading />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Icons.warning className="size-8 text-destructive" />
        <p className="text-muted-foreground">
          Failed to load your progress. Please try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <StepIndicator currentStep={currentStep} />

      <div className="sr-only" aria-live="polite">
        {`Step ${currentStep} of 3`}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          ref={stepContainerRef}
          tabIndex={-1}
          className="outline-none"
          key={currentStep}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {currentStep === 1 && (
            <ProfileBasicsStep
              defaultValues={
                progress?.user
                  ? {
                      fullName: progress.user.fullName ?? "",
                      username: progress.user.username ?? "",
                      tagline: progress.user.tagline ?? "",
                      athleteTypes: progress.user.athleteTypes ?? [],
                      avatarUrl: progress.user.avatarUrl ?? "",
                      location: progress.user.location ?? "",
                      favRunTime: progress.user.favRunTime ?? "",
                      runningPersonality:
                        progress.user.runningPersonality ?? "",
                    }
                  : undefined
              }
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] })
                nextStep()
              }}
            />
          )}
          {currentStep === 2 && (
            <PersonalRecordsStep
              defaultValues={{
                records: (progress?.records ?? []).map(
                  (r: {
                    distanceLabel: string
                    timeDisplay: string
                    distanceKm?: string
                  }) => ({
                    distanceLabel: r.distanceLabel,
                    timeDisplay: r.timeDisplay,
                    distanceKm: r.distanceKm ? Number(r.distanceKm) : undefined,
                  })
                ),
                userProfile: {
                  fullName: progress?.user?.fullName ?? "",
                  tagline: progress?.user?.tagline ?? "",
                },
              }}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] })
                nextStep()
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <HighlightsStep
              defaultValues={{
                highlights: (progress?.highlights ?? []).map(
                  (h: {
                    title?: string
                    distanceText?: string
                    durationText?: string
                    story?: string
                    highlightDate?: string
                    imageUrl?: string
                    sortOrder?: number
                  }) => ({
                    title: h.title ?? "",
                    distanceText: h.distanceText ?? "",
                    durationText: h.durationText ?? "",
                    story: h.story ?? "",
                    highlightDate: h.highlightDate ?? "",
                    imageUrl: h.imageUrl ?? "",
                    sortOrder: h.sortOrder ?? 0,
                  })
                ),
              }}
              onComplete={() => {}}
              onBack={prevStep}
              onSkip={() => {}}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingWizard />
    </Suspense>
  )
}
