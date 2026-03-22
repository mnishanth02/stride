"use client"

import { Progress } from "@workspace/ui/components/progress"
import { Icons } from "@workspace/ui/lib/icons"
import { cn } from "@workspace/ui/lib/utils"

const STEPS = [
  { label: "Profile", step: 1 },
  { label: "Records", step: 2 },
  { label: "Highlights", step: 3 },
] as const

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const barPercent = Math.round((currentStep / 3) * 100)

  return (
    <div className="mb-8 space-y-4">
      <Progress value={barPercent} />
      <nav aria-label="Onboarding progress">
        <ol className="flex items-center justify-between">
          {STEPS.map(({ label, step }) => {
            const isCompleted = step < currentStep
            const isCurrent = step === currentStep
            const isUpcoming = step > currentStep

            return (
              <li
                key={step}
                className="flex flex-col items-center gap-1.5"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors",
                    isCompleted && "border-lime-500 bg-lime-500 text-white",
                    isCurrent &&
                      "border-lime-500 text-lime-600 dark:text-lime-400",
                    isUpcoming &&
                      "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <Icons.check className="size-4" weight="bold" />
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium text-xs",
                    isCurrent && "text-foreground",
                    isCompleted && "text-lime-600 dark:text-lime-400",
                    isUpcoming && "text-muted-foreground/50"
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
