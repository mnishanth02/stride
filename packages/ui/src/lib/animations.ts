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

export { useReducedMotion }
