"use client"

import { cn } from "@workspace/ui/lib/utils"

interface CardPreviewProps {
  name: string
  tagline: string
  records: Array<{ distanceLabel: string; timeDisplay: string }>
  className?: string
}

export function CardPreview({
  name,
  tagline,
  records,
  className,
}: CardPreviewProps) {
  const displayRecords = records.filter((r) => r.timeDisplay)
  const isCompact = displayRecords.length > 3

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-90 overflow-hidden rounded-xl shadow-lg",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #5FE806 0%, #7C3AED 100%)",
      }}
    >
      {/* Dark overlay for text contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-6">
        {/* Header */}
        <div>
          <h3
            className="truncate font-extrabold font-heading text-2xl leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            {name || "Your Name"}
          </h3>
          <p
            className="mt-1 truncate text-sm"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            {tagline || "Your tagline"}
          </p>
        </div>

        {/* PRs */}
        <div className="flex-1 py-4">
          {displayRecords.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {displayRecords.map((record) => (
                <div key={record.distanceLabel}>
                  <p
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    {record.distanceLabel}
                  </p>
                  <p
                    className={cn(
                      "font-mono font-semibold",
                      isCompact ? "text-base" : "text-lg"
                    )}
                    style={{ color: "#FFFFFF" }}
                  >
                    {record.timeDisplay}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm italic"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              Your PRs will appear here
            </p>
          )}
        </div>

        {/* Watermark */}
        <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
          ZealerProfile
        </p>
      </div>
    </div>
  )
}
