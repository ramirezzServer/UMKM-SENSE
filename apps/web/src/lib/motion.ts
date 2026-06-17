import type { Variants } from 'framer-motion';

// Standard easing curves
export const EASE_OUT = [0.0, 0.0, 0.2, 1.0] as const;
export const EASE_IN_OUT = [0.4, 0.0, 0.2, 1.0] as const;

// Fade up — general card / section entrance
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

// Simple fade — overlays, tooltips, badges
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

// Fade in from right — side panels, drawers
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// Stagger container — wraps a list of staggerItem children
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// Individual item inside a stagger container
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// Page transition — used on route change
export const pageTrans: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.2, ease: EASE_IN_OUT },
  },
};

// Scale pop — modals, dialogs, popovers
export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: EASE_IN_OUT },
  },
};

// Hover lift — applied via whileHover on interactive cards
// Usage: <motion.div whileHover="hover" variants={hoverLift}>
export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: '0 1px 3px rgb(20 10 0 / 0.06), 0 1px 2px rgb(20 10 0 / 0.04)' },
  hover: {
    y: -2,
    boxShadow: '0 4px 12px rgb(20 10 0 / 0.08), 0 2px 4px rgb(20 10 0 / 0.04)',
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};
