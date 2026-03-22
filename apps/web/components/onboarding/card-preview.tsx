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
  const displayRecords = records.filter((r) => r.timeDisplay).slice(0, 3)

  return (
    <div
      className={cn(
        "relative w-full max-w-[300px] overflow-hidden rounded-xl shadow-lg",
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
      <div className="relative flex flex-col gap-4 p-5">
        {/* Header */}
        <div>
          <h3
            className="truncate font-extrabold font-heading text-xl leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            {name || "Your Name"}
          </h3>
          <p
            className="mt-0.5 truncate text-sm"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            {tagline || "Your tagline"}
          </p>
        </div>

        {/* PRs */}
        <div className="min-h-[60px]">
          {displayRecords.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {displayRecords.map((record) => (
                <div key={record.distanceLabel}>
                  <p
                    className="font-mono text-xs uppercase"
                    style={{ color: "rgba(255, 255, 255, 0.6)" }}
                  >
                    {record.distanceLabel}
                  </p>
                  <p
                    className="font-mono font-semibold text-lg"
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
