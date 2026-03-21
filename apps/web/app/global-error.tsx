"use client"

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground antialiased">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="font-bold text-3xl">Something went wrong</h1>
          <p className="text-muted-foreground">
            A critical error occurred. Please try refreshing the page.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-4xl bg-primary px-4 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/80"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-4xl px-4 font-medium text-foreground text-sm transition-colors hover:bg-muted"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
