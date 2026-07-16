// Shared Framer Motion presets. Centralized so every section uses the same
// easing/duration vocabulary from the design spec, and so reduced-motion
// handling lives in one place instead of being re-implemented per component.
import type { Variants } from "framer-motion";

/** Global reveal ease — cubic-bezier(0.21, 0.47, 0.32, 0.98). */
export const REVEAL_EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Clip-wipe ease — cubic-bezier(0.65, 0, 0.35, 1) for image reveals. */
export const WIPE_EASE = [0.65, 0, 0.35, 1] as const;

/** Fade + 24px rise scroll-reveal. Pass to <motion.div variants={fadeUp}>
 * with initial="hidden" whileInView="visible" viewport={{ once: true }}. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: REVEAL_EASE },
  },
};

/** Clip-path wipe reveal for imagery: inset 100% → 0 over 0.7s. */
export const clipWipe: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0.6 },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: { duration: 0.7, ease: WIPE_EASE },
  },
};

/** Container variant for staggered grids/card lists. Wrap children in
 * <motion.div variants={fadeUp}> and the parent in this with
 * staggerChildren set. */
export function staggerContainer(staggerDelay = 0.1): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };
}

/** Card hover lift: -4px translateY, 250ms, transform-only. */
export const cardHover = {
  rest: { y: 0 },
  hover: {
    y: -4,
    transition: { duration: 0.25, ease: REVEAL_EASE },
  },
};

/** Subtle button scale for primary CTAs. */
export const buttonTap = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: REVEAL_EASE } },
};
