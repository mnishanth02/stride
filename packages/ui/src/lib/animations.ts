import { useReducedMotion, type Variants } from "motion/react"

// Duration constants (milliseconds — matching CSS tokens)
export const DURATION_MICRO = 100
export const DURATION_FAST = 150
export const DURATION_BASE = 200
export const DURATION_SLOW = 300

// Duration in seconds (for Motion)
const dFast = DURATION_FAST / 1000
const dBase = DURATION_BASE / 1000
const dSlow = DURATION_SLOW / 1000

// Easing curves
export const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const

// Reduced-motion-safe variant: keeps opacity transitions, disables transforms
function withReducedMotion(variants: Variants): Variants {
  const safeVariants: Variants = {}
  for (const [key, variant] of Object.entries(variants)) {
    if (typeof variant !== "object" || variant === null) {
      safeVariants[key] = variant
      continue
    }
    const variantObj = variant as Record<string, unknown>
    const { x, y, scale, ...rest } = variantObj
    const existingTransition = variantObj.transition
    safeVariants[key] = {
      ...rest,
      ...(x !== undefined && { x: 0 }),
      ...(y !== undefined && { y: 0 }),
      ...(scale !== undefined && { scale: 1 }),
      transition:
        existingTransition != null && typeof existingTransition === "object"
          ? {
              ...(existingTransition as Record<string, unknown>),
              duration: dBase,
            }
          : undefined,
    }
  }
  return safeVariants
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dBase, ease: [...EASE_OUT_CUBIC] },
  },
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dSlow, ease: [...EASE_OUT_CUBIC] },
  },
}

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dBase, ease: [...EASE_OUT_CUBIC] },
  },
}

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dSlow, ease: [...EASE_OUT_CUBIC] },
  },
  exit: { opacity: 0, transition: { duration: dFast } },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: dBase, ease: [...EASE_SPRING] },
  },
}

// Reduced-motion-safe variants — use these with useReducedMotion() hook
export const fadeInSafe = withReducedMotion(fadeInVariants)
export const slideUpSafe = withReducedMotion(slideUpVariants)
export const staggerContainerSafe = withReducedMotion(staggerContainerVariants)
export const staggerItemSafe = withReducedMotion(staggerItemVariants)
export const pageVariantsSafe = withReducedMotion(pageVariants)
export const scaleInSafe = withReducedMotion(scaleInVariants)

export { useReducedMotion, withReducedMotion }
