"use client"

import { Button } from "@workspace/ui/components/button"
import { Icons } from "@workspace/ui/lib/icons"
import Link from "next/link"
import { useTheme } from "next-themes"
import * as React from "react"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <Icons.sun className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? (
        <Icons.sun className="size-4" />
      ) : (
        <Icons.moon className="size-4" />
      )}
    </Button>
  )
}

export default function OnboardingGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-border/50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold font-heading text-lg tracking-tight">
              ZealerProfile
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  )
}
