import { cn } from "@workspace/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      {...props}
    />
  )
}

// Shape presets per design system §12
function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />
}

function SkeletonHeading({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("h-6 w-48", className)} {...props} />
}

function SkeletonAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton className={cn("h-12 w-12 rounded-full", className)} {...props} />
  )
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton className={cn("h-32 w-full rounded-lg", className)} {...props} />
  )
}

function SkeletonStat({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("h-10 w-24", className)} {...props} />
}

export {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonHeading,
  SkeletonStat,
  SkeletonText,
}
