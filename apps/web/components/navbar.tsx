"use client"

import { UserButton, useAuth } from "@clerk/nextjs"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { Icons } from "@workspace/ui/lib/icons"
import { cn } from "@workspace/ui/lib/utils"
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

function SearchPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-full border border-input bg-muted/50 px-3 text-muted-foreground text-sm",
        className
      )}
    >
      <Icons.search className="size-4 shrink-0" />
      <span>Search athletes…</span>
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = React.useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-border/50 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold font-heading text-lg tracking-tight">
            ZealerProfile
          </span>
        </Link>

        {/* Search placeholder — hidden on mobile */}
        <SearchPlaceholder className="mx-auto hidden w-full max-w-xs md:flex" />

        {/* Desktop actions */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {isLoaded && !isSignedIn && (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden sm:inline-flex"
                )}
              >
                Get Started
              </Link>
            </>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8" },
              }}
            />
          )}

          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "sm:hidden"
              )}
              aria-label="Open menu"
            >
              <Icons.menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-bold font-heading text-lg">
                  ZealerProfile
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <SearchPlaceholder />
                <Separator />
                {isLoaded && !isSignedIn && (
                  <>
                    <Link
                      href="/sign-in"
                      className={buttonVariants({ variant: "ghost" })}
                      onClick={() => setOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className={buttonVariants()}
                      onClick={() => setOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
                {isLoaded && isSignedIn && (
                  <div className="flex items-center gap-3 px-2">
                    <UserButton
                      appearance={{
                        elements: { avatarBox: "size-8" },
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      Account
                    </span>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export { Navbar }
