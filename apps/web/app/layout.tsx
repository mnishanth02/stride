import { ClerkProvider } from "@clerk/nextjs"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { PostHogProvider } from "@/components/posthog-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { fontBody, fontDisplay, fontMono } from "@/lib/fonts"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          "antialiased",
          fontDisplay.variable,
          fontBody.variable,
          fontMono.variable
        )}
      >
        <body>
          <PostHogProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
