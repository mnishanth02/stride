"use client"

import { type MaskitoOptions, maskitoTransform } from "@maskito/core"
import { useMaskito } from "@maskito/react"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

type TimeFormat = "mm:ss" | "hh:mm:ss"

interface TimeInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "inputMode"> {
  format?: TimeFormat
}

function getMaskOptions(format: TimeFormat): MaskitoOptions {
  if (format === "mm:ss") {
    return {
      mask: [/\d/, /\d/, ":", /\d/, /\d/],
    }
  }
  return {
    mask: [/\d/, /\d/, ":", /\d/, /\d/, ":", /\d/, /\d/],
  }
}

function TimeInput({
  format = "mm:ss",
  className,
  placeholder,
  defaultValue,
  ...props
}: TimeInputProps) {
  const maskOptions = React.useMemo(() => getMaskOptions(format), [format])
  const inputRef = useMaskito({ options: maskOptions })

  const defaultPlaceholder = format === "mm:ss" ? "MM:SS" : "HH:MM:SS"

  return (
    <Input
      ref={inputRef}
      inputMode="numeric"
      placeholder={placeholder ?? defaultPlaceholder}
      defaultValue={
        defaultValue
          ? maskitoTransform(String(defaultValue), maskOptions)
          : undefined
      }
      className={cn("font-mono tabular-nums tracking-wider", className)}
      {...props}
    />
  )
}

export type { TimeFormat, TimeInputProps }
export { TimeInput }
