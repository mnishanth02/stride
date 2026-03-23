"use client"

import { buttonVariants } from "@workspace/ui/lib/button-variants"
import { Icons } from "@workspace/ui/lib/icons"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

function HomeHero() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <Icons.trophy className="size-12 text-primary" />
          <h1 className="font-bold font-heading text-4xl tracking-tight sm:text-5xl">
            ZealerProfile
          </h1>
          <p className="text-lg text-muted-foreground">
            Your athletic identity in one shareable profile. Showcase your
            personal records, highlight runs, and achievements.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Create My Profile
            <Icons.chevronRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export { HomeHero }
