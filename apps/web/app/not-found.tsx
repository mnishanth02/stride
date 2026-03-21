"use client"

import { buttonVariants } from "@workspace/ui/components/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="font-extrabold font-heading text-6xl text-primary tracking-tighter">
          404
        </h1>
        <h2 className="font-heading font-semibold text-xl">Page not found</h2>
        <p className="max-w-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link
          href="/explore"
          className={buttonVariants({ variant: "outline" })}
        >
          Explore athletes
        </Link>
      </div>
    </div>
  )
}
