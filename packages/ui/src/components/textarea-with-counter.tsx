"use client"

import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

interface TextareaWithCounterProps
  extends React.ComponentProps<typeof Textarea> {
  maxLength: number
}

function TextareaWithCounter({
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: TextareaWithCounterProps) {
  const [length, setLength] = React.useState(
    () => String(value ?? defaultValue ?? "").length
  )

  // Sync counter when controlled value changes externally (e.g. form reset)
  React.useEffect(() => {
    if (value !== undefined) setLength(String(value).length)
  }, [value])

  const warningThreshold = Math.floor(maxLength * 0.9)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setLength(e.target.value.length)
    onChange?.(e)
  }

  return (
    <div className="space-y-1.5">
      <Textarea
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        maxLength={maxLength}
        className={className}
        {...props}
      />
      <p
        className={cn(
          "text-right text-xs",
          length >= maxLength
            ? "text-destructive"
            : length >= warningThreshold
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
        )}
      >
        {length}/{maxLength}
      </p>
    </div>
  )
}

export type { TextareaWithCounterProps }
export { TextareaWithCounter }
