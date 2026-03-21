import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import type { Metadata } from "next"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Navbar } from "@/components/navbar"
import { PostHogProvider } from "@/components/posthog-provider"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { fontBody, fontDisplay, fontMono } from "@/lib/fonts"

export const metadata: Metadata = {
  title: {
    default: "ZealerProfile — Your PRs. Your Story. One Link.",
    template: "%s | ZealerProfile",
  },
  description:
    "Build your athlete identity. Showcase personal records, highlight activities, and share a beautiful athlete card — all from one link.",
  metadataBase: new URL("https://zealerprofile.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ZealerProfile",
    title: "ZealerProfile — Your PRs. Your Story. One Link.",
    description:
      "Build your athlete identity. Showcase personal records, highlight activities, and share a beautiful athlete card.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZealerProfile — Your PRs. Your Story. One Link.",
    description:
      "Build your athlete identity. Showcase personal records, highlight activities, and share a beautiful athlete card.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

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
        <body className="flex min-h-dvh flex-col">
          <QueryProvider>
            <ThemeProvider>
              <TooltipProvider delay={300}>
                <PostHogProvider>
                  <Toaster />
                  <Navbar />
                  <main className="flex-1">{children}</main>
                </PostHogProvider>
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
