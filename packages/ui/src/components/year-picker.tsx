"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

interface YearPickerProps {
  value?: string
  onChange?: (year: string | undefined) => void
  placeholder?: string
  startYear?: number
  endYear?: number
  disabled?: boolean
  className?: string
}

function YearPicker({
  value,
  onChange,
  placeholder = "Select year",
  startYear = 1970,
  endYear = new Date().getFullYear(),
  disabled,
  className,
}: YearPickerProps) {
  const years = React.useMemo(() => {
    const result: string[] = []
    for (let y = endYear; y >= startYear; y--) {
      result.push(String(y))
    }
    return result
  }, [startYear, endYear])

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange?.(v || undefined)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type { YearPickerProps }
export { YearPicker }
