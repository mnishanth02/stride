"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  fadeInVariants,
  slideUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "@workspace/ui/lib/animations"
import { Icons } from "@workspace/ui/lib/icons"
import { motion, useReducedMotion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"
import { CardPreview } from "@/components/onboarding/card-preview"
import { trackEvent } from "@/lib/analytics"

interface CompletionViewProps {
  user: {
    fullName: string
    username: string
    tagline: string
    athleteTypes: string[]
    avatarUrl: string | null
    location: string | null
    favRunTime: string | null
    runningPersonality: string | null
  }
  records: Array<{ distanceLabel: string; timeDisplay: string }>
  highlights: Array<{ title: string }>
}

export function CompletionView({
  user,
  records,
  highlights: _highlights,
}: CompletionViewProps) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    trackEvent("onboarding_complete")
  }, [])

  const springAnimation = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { type: "spring" as const, stiffness: 200, damping: 10 },
      }

  const resolvedFadeIn = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
    : { variants: fadeInVariants, initial: "hidden", animate: "visible" }

  const resolvedSlideUp = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
    : { variants: slideUpVariants, initial: "hidden", animate: "visible" }

  const resolvedStaggerContainer = prefersReducedMotion
    ? {}
    : {
        variants: staggerContainerVariants,
        initial: "hidden",
        animate: "visible",
      }

  const resolvedStaggerItem = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
    : { variants: staggerItemVariants }

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-12">
        {/* Celebration header */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center"
          {...springAnimation}
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Icons.trophy className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="font-bold font-heading text-3xl">
              Your profile is ready!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Time to share your story with the world.
            </p>
          </div>
        </motion.div>

        {/* Profile summary card + PR card — 2-column on desktop */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div {...resolvedFadeIn}>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <Icons.userCircle className="size-8 text-muted-foreground" />
                  </div>
                )}

                <div className="text-center">
                  <p className="font-bold text-lg">{user.fullName}</p>
                  {user.tagline && (
                    <p className="text-muted-foreground text-sm">
                      {user.tagline}
                    </p>
                  )}
                </div>

                {user.athleteTypes.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.athleteTypes.map((type) => (
                      <Badge key={type} variant="streak">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {user.location && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Icons.location className="size-4" />
                    <span>{user.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="flex items-center justify-center"
            {...resolvedSlideUp}
          >
            <CardPreview
              name={user.fullName}
              tagline={user.tagline}
              records={records}
            />
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div
          className="flex w-full flex-wrap items-center justify-center gap-3"
          {...resolvedStaggerContainer}
        >
          <motion.div {...resolvedStaggerItem}>
            <Tooltip>
              <TooltipTrigger
                render={<span className="inline-flex w-full sm:w-auto" />}
              >
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="w-full sm:w-auto"
                >
                  <Icons.user data-icon="inline-start" />
                  View My Profile
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Coming soon — public profiles launch in a future update
              </TooltipContent>
            </Tooltip>
          </motion.div>

          <motion.div {...resolvedStaggerItem}>
            <Tooltip>
              <TooltipTrigger
                render={<span className="inline-flex w-full sm:w-auto" />}
              >
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="w-full sm:w-auto"
                >
                  <Icons.copyLink data-icon="inline-start" />
                  Copy Profile Link
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </motion.div>

          <motion.div {...resolvedStaggerItem}>
            <Tooltip>
              <TooltipTrigger
                render={<span className="inline-flex w-full sm:w-auto" />}
              >
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="w-full sm:w-auto"
                >
                  <Icons.download data-icon="inline-start" />
                  Download Card
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Coming soon — card generation launches in a future update
              </TooltipContent>
            </Tooltip>
          </motion.div>

          <motion.div {...resolvedStaggerItem}>
            <Link
              href="/dashboard"
              className={buttonVariants({
                size: "md",
                className: "w-full sm:w-auto",
              })}
            >
              Go to Dashboard
              <Icons.chevronRight data-icon="inline-end" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
