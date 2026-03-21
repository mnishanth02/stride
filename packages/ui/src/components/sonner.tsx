"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-e3 group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:text-emerald-700 dark:group-[.toaster]:text-emerald-400",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:text-destructive",
          info: "group-[.toaster]:border-azure-500/30 group-[.toaster]:text-azure-700 dark:group-[.toaster]:text-azure-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
