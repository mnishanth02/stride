"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { CircleNotch } from "@phosphor-icons/react/dist/icons/CircleNotch"
import {
  type ButtonVariantsProps,
  buttonVariants,
} from "@workspace/ui/lib/button-variants"
import { cn } from "@workspace/ui/lib/utils"

function Button({
  className,
  variant = "default",
  size = "default",
  isLoading,
  children,
  disabled,
  ...props
}: ButtonPrimitive.Props & ButtonVariantsProps & { isLoading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-inherit",
          isLoading && "invisible"
        )}
      >
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <CircleNotch className="animate-spin" />
        </span>
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
