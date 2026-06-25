// Shared Framer Motion presets. Centralized so every section uses the same
// easing/duration vocabulary from the design spec, and so reduced-motion
// handling lives in one place instead of being re-implemented per component.
import type { Variants } from "framer-motion";

export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + translateY scroll-reveal. Pass to <motion.div variants={fadeUp}>
 * with initial="hidden" whileInView="visible" viewport={{ once: true }}. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: REVEAL_EASE },
  },
};

/** Container variant for staggered grids/card lists. Wrap children in
 * <motion.div variants={fadeUp}> and the parent in this with
 * staggerChildren set. */
export function staggerContainer(staggerDelay = 0.08): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };
}

/** Card hover lift: -4px translateY + shadow increase, 250ms. */
export const cardHover = {
  rest: { y: 0, boxShadow: "var(--shadow-soft)" },
  hover: {
    y: -4,
    boxShadow: "var(--shadow-lift)",
    transition: { duration: 0.25, ease: REVEAL_EASE },
  },
};

/** Subtle button scale for primary CTAs. */
export const buttonTap = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: REVEAL_EASE } },
};
