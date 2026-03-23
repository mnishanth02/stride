"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TimeInput } from "@workspace/ui/components/time-input"
import { Icons } from "@workspace/ui/lib/icons"
import {
  type PRDistance,
  parseHHMMSS,
  parseMMSS,
  validatePRTime,
} from "@workspace/ui/lib/validations"
import { useEffect, useId, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { CardPreview } from "@/components/onboarding/card-preview"

const STANDARD_DISTANCES = [
  { label: "5K", km: 5, format: "mm:ss" as const },
  { label: "10K", km: 10, format: "hh:mm:ss" as const },
  { label: "Half Marathon", km: 21.1, format: "hh:mm:ss" as const },
  { label: "Marathon", km: 42.2, format: "hh:mm:ss" as const },
]

const fieldKeys = ["fiveK", "tenK", "halfMarathon", "marathon"] as const

interface RecordsFormValues {
  fiveK: string
  tenK: string
  halfMarathon: string
  marathon: string
  customLabel: string
  customTime: string
}

const formSchema = z.object({
  fiveK: z.string(),
  tenK: z.string(),
  halfMarathon: z.string(),
  marathon: z.string(),
  customLabel: z.string(),
  customTime: z.string(),
})

interface PersonalRecordsStepProps {
  defaultValues?: {
    records: Array<{
      distanceLabel: string
      timeDisplay: string
      distanceKm?: number
    }>
    userProfile: { fullName: string; tagline: string }
  }
  onComplete: () => void
  onBack: () => void
}

function getInitialValues(
  records?: PersonalRecordsStepProps["defaultValues"]
): { values: RecordsFormValues; droppedCustomCount: number } {
  const values: RecordsFormValues = {
    fiveK: "",
    tenK: "",
    halfMarathon: "",
    marathon: "",
    customLabel: "",
    customTime: "",
  }
  let droppedCustomCount = 0

  if (!records?.records) return { values, droppedCustomCount }

  for (const record of records.records) {
    const idx = STANDARD_DISTANCES.findIndex(
      (d) => d.label === record.distanceLabel
    )
    const key = idx !== -1 ? fieldKeys[idx] : undefined
    if (key) {
      values[key] = record.timeDisplay
    } else if (!values.customLabel) {
      values.customLabel = record.distanceLabel
      values.customTime = record.timeDisplay
    } else {
      droppedCustomCount++
    }
  }

  return { values, droppedCustomCount }
}

export function PersonalRecordsStep({
  defaultValues,
  onComplete,
  onBack,
}: PersonalRecordsStepProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const customLabelId = useId()
  const customTimeId = useId()

  const { values: initialValues, droppedCustomCount } =
    getInitialValues(defaultValues)

  // Show custom section if there are pre-existing custom values
  useEffect(() => {
    if (initialValues.customLabel || initialValues.customTime) {
      setShowCustom(true)
    }
  }, [initialValues.customLabel, initialValues.customTime])

  useEffect(() => {
    if (droppedCustomCount > 0) {
      toast.warning(
        `${droppedCustomCount} additional custom record${droppedCustomCount > 1 ? "s were" : " was"} saved previously but can't be displayed here. Re-saving will only keep the records shown.`,
        { duration: 8000 }
      )
    }
  }, [droppedCustomCount])

  const form = useForm<RecordsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })

  const watchedValues = form.watch()
  const isDirty = form.formState.isDirty

  // beforeunload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  // Build live preview records
  const liveRecords = STANDARD_DISTANCES.map((d, i) => {
    const key = fieldKeys[i]
    return {
      distanceLabel: d.label,
      timeDisplay: key ? (watchedValues[key] ?? "") : "",
    }
  }).filter((r) => r.timeDisplay.length > 0)

  if (watchedValues.customLabel && watchedValues.customTime) {
    liveRecords.push({
      distanceLabel: watchedValues.customLabel,
      timeDisplay: watchedValues.customTime,
    })
  }

  async function onSubmit(data: RecordsFormValues) {
    // Validate non-empty standard distances
    let hasError = false

    for (let i = 0; i < STANDARD_DISTANCES.length; i++) {
      const key = fieldKeys[i]
      const dist = STANDARD_DISTANCES[i]
      if (!key || !dist) continue

      const value = data[key]
      if (!value) continue

      const error = validatePRTime(dist.label as PRDistance, value)
      if (error) {
        form.setError(key, { message: error })
        hasError = true
      }
    }

    // Validate custom distance
    if (data.customTime && !data.customLabel) {
      form.setError("customLabel", { message: "Enter a distance name" })
      hasError = true
    }
    if (data.customLabel && !data.customTime) {
      form.setError("customTime", { message: "Enter a time" })
      hasError = true
    }
    if (data.customTime && data.customLabel) {
      const seconds = parseHHMMSS(data.customTime)
      if (seconds === null) {
        form.setError("customTime", { message: "Enter a valid time" })
        hasError = true
      } else if (seconds >= 86400) {
        form.setError("customTime", { message: "Time must be under 24 hours" })
        hasError = true
      }
    }

    if (hasError) return

    // Build records payload
    const records: Array<{
      distanceLabel: string
      distanceKm?: number
      timeSeconds: number
      timeDisplay: string
    }> = []

    for (let i = 0; i < STANDARD_DISTANCES.length; i++) {
      const key = fieldKeys[i]
      const dist = STANDARD_DISTANCES[i]
      if (!key || !dist) continue

      const value = data[key]
      if (!value) continue

      const seconds =
        dist.format === "mm:ss" ? parseMMSS(value) : parseHHMMSS(value)
      if (seconds === null) continue

      records.push({
        distanceLabel: dist.label,
        distanceKm: dist.km,
        timeSeconds: seconds,
        timeDisplay: value,
      })
    }

    if (data.customLabel && data.customTime) {
      const seconds = parseHHMMSS(data.customTime)
      if (seconds !== null) {
        records.push({
          distanceLabel: data.customLabel,
          timeSeconds: seconds,
          timeDisplay: data.customTime,
        })
      }
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/onboarding/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Failed to save records")
      }

      toast.success("Personal records saved!")
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save records")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="md:flex md:gap-8">
      {/* Mobile card preview */}
      <div className="mb-6 md:hidden">
        <CardPreview
          name={defaultValues?.userProfile?.fullName ?? ""}
          tagline={defaultValues?.userProfile?.tagline ?? ""}
          records={liveRecords}
        />
      </div>

      {/* Form — 60% on desktop */}
      <div className="md:w-[60%]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-5">
            {STANDARD_DISTANCES.map((dist, i) => {
              const key = fieldKeys[i]
              if (!key) return null
              const error = form.formState.errors[key]

              return (
                <div key={dist.label} className="space-y-1.5">
                  <Label htmlFor={key} className="font-heading font-semibold">
                    {dist.label}
                  </Label>
                  <TimeInput
                    id={key}
                    format={dist.format}
                    defaultValue={initialValues[key]}
                    aria-invalid={!!error}
                    {...form.register(key)}
                  />
                  {error?.message && (
                    <p className="text-destructive text-sm">{error.message}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom distance section */}
          <div>
            {!showCustom ? (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                <Icons.add className="size-4" />
                Add custom distance
              </button>
            ) : (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-sm">
                    Custom Distance
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCustom(false)
                      form.setValue("customLabel", "")
                      form.setValue("customTime", "")
                    }}
                    aria-label="Remove custom distance"
                    className="size-11"
                  >
                    <Icons.close className="size-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={customLabelId}>Distance name</Label>
                  <Input
                    id={customLabelId}
                    placeholder='e.g. "100K" or "50 miles"'
                    {...form.register("customLabel")}
                  />
                  {form.formState.errors.customLabel?.message && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.customLabel.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={customTimeId}>Time</Label>
                  <TimeInput
                    id={customTimeId}
                    format="hh:mm:ss"
                    defaultValue={initialValues.customTime}
                    aria-invalid={!!form.formState.errors.customTime}
                    {...form.register("customTime")}
                  />
                  {form.formState.errors.customTime?.message && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.customTime.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" size="md" onClick={onBack}>
              <Icons.back className="size-4" />
              Back
            </Button>
            <Button type="submit" size="md" isLoading={isSubmitting}>
              Next
              <Icons.chevronRight className="size-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Desktop card preview — 40%, sticky */}
      <div className="hidden md:block md:w-[40%]">
        <div className="md:sticky md:top-24">
          <CardPreview
            name={defaultValues?.userProfile?.fullName ?? ""}
            tagline={defaultValues?.userProfile?.tagline ?? ""}
            records={liveRecords}
          />
        </div>
      </div>
    </div>
  )
}
