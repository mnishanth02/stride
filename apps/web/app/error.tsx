"use client"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            Something went wrong
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset}>Try again</Button>
          <a href="/" className={buttonVariants({ variant: "ghost" })}>
            Go home
          </a>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="mt-2 rounded-sm bg-muted p-3 text-left font-mono text-muted-foreground text-xs">
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
