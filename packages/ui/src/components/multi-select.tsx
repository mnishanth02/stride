"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

interface MultiSelectOption {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options",
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  function handleToggle(optionValue: string) {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange?.(next)
  }

  function handleRemove(optionValue: string) {
    onChange?.(value.filter((v) => v !== optionValue))
  }

  const selectedLabels = options.filter((o) => value.includes(o.value))

  const triggerRef = React.useRef<HTMLDivElement>(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full cursor-pointer [&]:border-0 [&]:bg-transparent [&]:p-0 [&]:shadow-none">
        <div
          ref={triggerRef}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-4xl border border-input bg-input/30 px-3 py-1.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            disabled && "pointer-events-none opacity-50",
            className
          )}
        >
          {selectedLabels.length > 0 ? (
            selectedLabels.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {option.label}
                {/* biome-ignore lint/a11y/useSemanticElements: span avoids nested button a11y violation inside PopoverTrigger */}
                <span
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-disabled={disabled}
                  className={cn(
                    "ml-0.5 inline-flex cursor-pointer rounded-full outline-none ring-offset-background hover:bg-secondary-foreground/20 focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    disabled && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    if (!disabled) handleRemove(option.value)
                  }}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === "Enter" || e.key === " ")) {
                      e.stopPropagation()
                      e.preventDefault()
                      handleRemove(option.value)
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-3"
                    aria-hidden="true"
                  >
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  <span className="sr-only">Remove {option.label}</span>
                </span>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
      >
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => {
            const checked = value.includes(option.value)
            return (
              // biome-ignore lint/a11y/noLabelWithoutControl: label wraps Checkbox child component
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export type { MultiSelectOption, MultiSelectProps }
export { MultiSelect }
