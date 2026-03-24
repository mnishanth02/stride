"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { uploadFile } from "@workspace/storage/client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { FileUpload } from "@workspace/ui/components/file-upload"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextareaWithCounter } from "@workspace/ui/components/textarea-with-counter"
import { Icons } from "@workspace/ui/lib/icons"
import { TEXT_LIMITS } from "@workspace/ui/lib/validations"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

// ─── Schema ──────────────────────────────────────────────────────────────────

const highlightFormSchema = z.object({
  highlights: z
    .array(
      z.object({
        title: z.string().max(60).optional().or(z.literal("")),
        distanceText: z.string().optional().or(z.literal("")),
        durationText: z.string().optional().or(z.literal("")),
        story: z.string().max(200).optional().or(z.literal("")),
        highlightDate: z.date().optional(),
        imageUrl: z.string().optional().or(z.literal("")),
        sortOrder: z.number().optional(),
      })
    )
    .max(2),
})

type HighlightFormValues = z.infer<typeof highlightFormSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_HIGHLIGHT = {
  title: "",
  distanceText: "",
  durationText: "",
  story: "",
  highlightDate: undefined,
  imageUrl: "",
  sortOrder: 0,
} as const

function isHighlightEmpty(h: HighlightFormValues["highlights"][number]) {
  return (
    !h.title?.trim() &&
    !h.distanceText?.trim() &&
    !h.durationText?.trim() &&
    !h.story?.trim() &&
    !h.highlightDate &&
    !h.imageUrl?.trim()
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface HighlightsStepProps {
  defaultValues?: {
    highlights: Array<{
      title?: string
      distanceText?: string
      durationText?: string
      story?: string
      highlightDate?: string
      imageUrl?: string
      sortOrder?: number
    }>
  }
  onComplete: () => void
  onBack: () => void
  onSkip: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HighlightsStep({
  defaultValues,
  onComplete: _onComplete,
  onBack,
  onSkip: _onSkip,
}: HighlightsStepProps) {
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const form = useForm<HighlightFormValues>({
    resolver: zodResolver(highlightFormSchema),
    defaultValues: {
      highlights:
        defaultValues?.highlights && defaultValues.highlights.length > 0
          ? defaultValues.highlights.map((h, i) => ({
              title: h.title ?? "",
              distanceText: h.distanceText ?? "",
              durationText: h.durationText ?? "",
              story: h.story ?? "",
              highlightDate: h.highlightDate
                ? new Date(`${h.highlightDate}T00:00:00`)
                : undefined,
              imageUrl: h.imageUrl ?? "",
              sortOrder: h.sortOrder ?? i,
            }))
          : [{ ...EMPTY_HIGHLIGHT }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "highlights",
  })

  const { errors, isSubmitting } = form.formState
  const isBusy = isSubmitting || isSkipping

  // Navigation guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [form.formState.isDirty])

  // Image upload handler
  const handleImageChange = useCallback(
    async (file: File | null, index: number) => {
      if (!file) {
        form.setValue(`highlights.${index}.imageUrl`, "")
        return
      }
      setUploadingIndex(index)
      try {
        const { publicUrl } = await uploadFile(file)
        form.setValue(`highlights.${index}.imageUrl`, publicUrl)
      } catch {
        toast.error("Failed to upload image. Please try again.")
      } finally {
        setUploadingIndex(null)
      }
    },
    [form]
  )

  // Skip — complete onboarding without saving highlights
  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        toast.error("Something went wrong. Please try again.")
        return
      }
      router.push("/onboarding/complete")
    } catch {
      toast.error("Network error. Please check your connection.")
    } finally {
      setIsSkipping(false)
    }
  }, [router])

  // Submit — validate, save highlights, then complete onboarding
  const onSubmit = useCallback(
    async (data: HighlightFormValues) => {
      // Filter out completely empty cards
      const filledHighlights = data.highlights.filter(
        (h) => !isHighlightEmpty(h)
      )

      // For filled cards, title is required
      let hasValidationError = false
      for (const [i, h] of data.highlights.entries()) {
        if (!isHighlightEmpty(h) && !h.title?.trim()) {
          form.setError(`highlights.${i}.title`, {
            type: "manual",
            message: "Title is required when other fields are filled",
          })
          hasValidationError = true
        }
      }
      if (hasValidationError) return

      // If no filled highlights, just complete onboarding
      if (filledHighlights.length === 0) {
        try {
          const res = await fetch("/api/onboarding/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
          if (!res.ok) {
            toast.error("Something went wrong. Please try again.")
            return
          }
          router.push("/onboarding/complete")
        } catch {
          toast.error("Network error. Please check your connection.")
        }
        return
      }

      // Save highlights
      try {
        const payload = filledHighlights.map((h, i) => ({
          title: h.title?.trim() || "",
          distanceText: h.distanceText?.trim() || undefined,
          durationText: h.durationText?.trim() || undefined,
          story: h.story?.trim() || undefined,
          highlightDate: h.highlightDate
            ? `${h.highlightDate.getFullYear()}-${String(h.highlightDate.getMonth() + 1).padStart(2, "0")}-${String(h.highlightDate.getDate()).padStart(2, "0")}`
            : undefined,
          imageUrl: h.imageUrl?.trim() || undefined,
          sortOrder: i,
        }))

        const res = await fetch("/api/onboarding/highlights?complete=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ highlights: payload }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          toast.error(
            body?.error ?? "Failed to save highlights. Please try again."
          )
          return
        }

        router.push("/onboarding/complete")
      } catch {
        toast.error("Network error. Please check your connection.")
      }
    },
    [form, router]
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
    >
      <p className="text-muted-foreground text-sm">
        Share your proudest running moments (optional — you can always add these
        later from your dashboard).
      </p>

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="flex flex-col gap-4 pt-6">
            {/* Title — full width */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`highlights.${index}.title`}>Title</Label>
              <Input
                id={`highlights.${index}.title`}
                maxLength={TEXT_LIMITS.highlightTitle.max}
                placeholder="e.g. First Marathon"
                {...form.register(`highlights.${index}.title`)}
              />
              {errors.highlights?.[index]?.title && (
                <p className="mt-1 text-destructive text-sm">
                  {errors.highlights[index].title.message}
                </p>
              )}
            </div>

            {/* Two-column: metadata (left) + image (right) */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Left column — stacked metadata fields */}
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`highlights.${index}.distanceText`}>
                    Distance
                  </Label>
                  <Input
                    id={`highlights.${index}.distanceText`}
                    placeholder="e.g. 18 km"
                    {...form.register(`highlights.${index}.distanceText`)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`highlights.${index}.durationText`}>
                    Duration
                  </Label>
                  <Input
                    id={`highlights.${index}.durationText`}
                    placeholder="e.g. 2h 45m"
                    {...form.register(`highlights.${index}.durationText`)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`highlights.${index}.story`}>Story</Label>
                  <TextareaWithCounter
                    id={`highlights.${index}.story`}
                    maxLength={TEXT_LIMITS.highlightStory.max}
                    placeholder="Tell us about this highlight…"
                    {...form.register(`highlights.${index}.story`)}
                  />
                  {errors.highlights?.[index]?.story && (
                    <p className="mt-1 text-destructive text-sm">
                      {errors.highlights[index].story.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Date</Label>
                  <Controller
                    name={`highlights.${index}.highlightDate`}
                    control={form.control}
                    render={({ field: dateField }) => (
                      <DatePicker
                        value={dateField.value}
                        onChange={dateField.onChange}
                        placeholder="Pick a date"
                        maxDate={new Date()}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Right column — tall image upload spanning full height */}
              <div className="flex w-full flex-col gap-1.5 sm:w-56">
                <Label>Image</Label>
                <Controller
                  name={`highlights.${index}.imageUrl`}
                  control={form.control}
                  render={({ field: imageField }) => (
                    <FileUpload
                      shape="square"
                      onChange={(file) => handleImageChange(file, index)}
                      onError={(error) => toast.error(error)}
                      previewUrl={
                        imageField.value ||
                        defaultValues?.highlights?.[index]?.imageUrl
                      }
                      disabled={uploadingIndex === index}
                      className="sm:aspect-auto sm:h-full sm:min-h-52 sm:max-w-none"
                    />
                  )}
                />
              </div>
            </div>

            {/* Remove button */}
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(index)}
                aria-label={`Remove highlight ${index + 1}`}
              >
                <Icons.delete className="size-4" />
                Remove
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add button */}
      {fields.length < 2 && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ ...EMPTY_HIGHLIGHT, sortOrder: fields.length })
          }
        >
          <Icons.add className="size-4" />
          Add another highlight
        </Button>
      )}

      {/* Bottom buttons — DOM order: Back → Skip → Finish (flex-col-reverse shows Finish on top on mobile) */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isBusy}
          onClick={onBack}
        >
          <Icons.back data-icon="inline-start" />
          Back
        </Button>
        <Button
          type="button"
          variant="outline"
          isLoading={isSkipping}
          disabled={isBusy}
          onClick={handleSkip}
        >
          Skip this step
        </Button>
        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          disabled={isBusy || uploadingIndex !== null}
        >
          Finish
          <Icons.check data-icon="inline-end" />
        </Button>
      </div>
    </form>
  )
}
