"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { uploadFile } from "@workspace/storage/client"
import { Button } from "@workspace/ui/components/button"
import { FileUpload } from "@workspace/ui/components/file-upload"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { MultiSelect } from "@workspace/ui/components/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { TextareaWithCounter } from "@workspace/ui/components/textarea-with-counter"
import { Icons } from "@workspace/ui/lib/icons"
import {
  ATHLETE_TYPES,
  athleteTypesSchema,
  FAV_RUN_TIMES,
  fullNameSchema,
  RUNNING_PERSONALITIES,
  TEXT_LIMITS,
  taglineSchema,
  usernameSchema,
} from "@workspace/ui/lib/validations"
import { useCallback, useEffect, useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useUsernameCheck } from "@/hooks/use-username-check"

// ─── Schema ──────────────────────────────────────────────────────────────────

const profileBasicsSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  tagline: taglineSchema,
  athleteTypes: athleteTypesSchema,
  avatarUrl: z.string().optional(),
  location: z
    .string()
    .max(TEXT_LIMITS.location.max)
    .optional()
    .or(z.literal("")),
  favRunTime: z.enum(FAV_RUN_TIMES).optional().or(z.literal("")),
  runningPersonality: z
    .enum(RUNNING_PERSONALITIES)
    .optional()
    .or(z.literal("")),
})

type ProfileBasicsOutput = z.output<typeof profileBasicsSchema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProfileBasicsStepProps {
  defaultValues?: {
    fullName?: string
    username?: string
    tagline?: string
    athleteTypes?: string[]
    avatarUrl?: string
    location?: string
    favRunTime?: string
    runningPersonality?: string
  }
  onComplete: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileBasicsStep({
  defaultValues,
  onComplete,
}: ProfileBasicsStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(
    defaultValues?.avatarUrl ?? ""
  )
  const fullNameId = useId()
  const usernameId = useId()
  const taglineId = useId()
  const locationId = useId()

  const form = useForm({
    resolver: zodResolver(profileBasicsSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      username: defaultValues?.username ?? "",
      tagline: defaultValues?.tagline ?? "",
      athleteTypes: (defaultValues?.athleteTypes ??
        []) as (typeof ATHLETE_TYPES)[number][],
      avatarUrl: defaultValues?.avatarUrl ?? "",
      location: defaultValues?.location ?? "",
      favRunTime: (defaultValues?.favRunTime ?? "") as
        | (typeof FAV_RUN_TIMES)[number]
        | "",
      runningPersonality: (defaultValues?.runningPersonality ?? "") as
        | (typeof RUNNING_PERSONALITIES)[number]
        | "",
    },
  })

  const watchedUsername = form.watch("username")
  const { isAvailable, isChecking, reason, isError } = useUsernameCheck(
    watchedUsername,
    defaultValues?.username
  )

  // Navigation guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [form.formState.isDirty])

  const handleAvatarChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        form.setValue("avatarUrl", "")
        return
      }
      setIsUploading(true)
      try {
        const { publicUrl } = await uploadFile(file)
        form.setValue("avatarUrl", publicUrl)
        setUploadedAvatarUrl(publicUrl)
      } catch {
        toast.error("Failed to upload avatar. Please try again.")
      } finally {
        setIsUploading(false)
      }
    },
    [form]
  )

  const onSubmit = useCallback(
    async (data: ProfileBasicsOutput) => {
      if (isChecking) {
        form.setError("username", {
          type: "manual",
          message: "Please wait — checking username availability",
        })
        return
      }
      if (isAvailable === null) {
        if (isError) {
          toast.error("Couldn't verify username availability. Please try again.")
          form.setError("username", {
            type: "manual",
            message: "Username check failed — please try again",
          })
        }
        return
      }
      if (isAvailable === false) {
        form.setError("username", {
          type: "manual",
          message: reason ?? "Username is not available",
        })
        return
      }

      try {
        const res = await fetch("/api/onboarding/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (res.ok) {
          onComplete()
          return
        }

        if (res.status === 409) {
          toast.error("Username was just taken. Please choose another.")
          form.setError("username", {
            type: "manual",
            message: "Username was just taken",
          })
          return
        }

        toast.error("Something went wrong. Please try again.")
      } catch {
        toast.error("Network error. Please check your connection.")
      }
    },
    [isAvailable, isChecking, reason, isError, form, onComplete]
  )

  const { errors, isSubmitting } = form.formState

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-md flex-col gap-6"
    >
      {/* Avatar */}
      <div className="flex justify-center">
        <Controller
          name="avatarUrl"
          control={form.control}
          render={() => (
            <FileUpload
              shape="circle"
              onChange={handleAvatarChange}
              onError={(error) => toast.error(error)}
              previewUrl={uploadedAvatarUrl || defaultValues?.avatarUrl}
              disabled={isUploading}
            />
          )}
        />
      </div>

      {/* Full Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fullNameId}>Full Name</Label>
        <Input id={fullNameId} {...form.register("fullName")} />
        {errors.fullName && (
          <p className="mt-1 text-destructive text-sm">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={usernameId}>Username</Label>
        <Input id={usernameId} {...form.register("username")} />
        <div aria-live="polite" className="mt-1 flex items-center gap-1.5">
          {isChecking && (
            <>
              <Icons.loading className="size-4 animate-spin" />
              <span className="text-muted-foreground text-sm">Checking…</span>
            </>
          )}
          {!isChecking && isAvailable === true && (
            <>
              <Icons.checkCircle className="size-4 text-green-600" />
              <span className="text-green-600 text-sm">Available</span>
            </>
          )}
          {!isChecking && isAvailable === false && (
            <>
              <Icons.warning className="size-4 text-destructive" />
              <span className="text-destructive text-sm">{reason}</span>
            </>
          )}
          {!isChecking && isError && isAvailable === null && (
            <>
              <Icons.warning className="size-4 text-destructive" />
              <span className="text-destructive text-sm">
                Couldn't check availability
              </span>
            </>
          )}
        </div>
        {errors.username && (
          <p className="mt-1 text-destructive text-sm">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Tagline */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={taglineId}>Tagline</Label>
        <TextareaWithCounter
          id={taglineId}
          maxLength={TEXT_LIMITS.tagline.max}
          {...form.register("tagline")}
        />
        {errors.tagline && (
          <p className="mt-1 text-destructive text-sm">
            {errors.tagline.message}
          </p>
        )}
      </div>

      {/* Athlete Types */}
      <div className="flex flex-col gap-1.5">
        <Label>Athlete Type</Label>
        <Controller
          name="athleteTypes"
          control={form.control}
          render={({ field }) => (
            <MultiSelect
              options={ATHLETE_TYPES.map((t) => ({ label: t, value: t }))}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select athlete types…"
            />
          )}
        />
        {errors.athleteTypes && (
          <p className="mt-1 text-destructive text-sm">
            {errors.athleteTypes.message}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={locationId}>
          Location <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id={locationId} {...form.register("location")} />
        {errors.location && (
          <p className="mt-1 text-destructive text-sm">
            {errors.location.message}
          </p>
        )}
      </div>

      {/* Fav Run Time */}
      <div className="flex flex-col gap-1.5">
        <Label>Favorite Run Time</Label>
        <Controller
          name="favRunTime"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {FAV_RUN_TIMES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.favRunTime && (
          <p className="mt-1 text-destructive text-sm">
            {errors.favRunTime.message}
          </p>
        )}
      </div>

      {/* Running Personality */}
      <div className="flex flex-col gap-1.5">
        <Label>Running Personality</Label>
        <Controller
          name="runningPersonality"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {RUNNING_PERSONALITIES.map((personality) => (
                  <SelectItem key={personality} value={personality}>
                    {personality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.runningPersonality && (
          <p className="mt-1 text-destructive text-sm">
            {errors.runningPersonality.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
        Next
      </Button>
    </form>
  )
}
