import type { Variants, Transition } from "motion/react";

export { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";

/** Page-level fade + slight y-translate */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const pageTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/** Soft spring for general UI animations */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

/** Simple fade-in variant */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide-up variant */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};
