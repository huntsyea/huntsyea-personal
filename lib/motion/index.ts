import type { Variants } from "framer-motion";

/**
 * The single motion vocabulary for the Site (ADR 0002). Components consume
 * these durations, the shared easing, and the fade-and-rise variants instead
 * of defining their own animation values.
 *
 * Durations are authored in milliseconds as the source of truth; framer-motion
 * transition durations are expressed in seconds, so convert with `seconds`.
 */
export const durations = {
  /** Micro-interactions: hover, focus, small state changes. */
  fast: 150,
  /** Default transitions. */
  base: 250,
  /** Route entrance. */
  entrance: 400,
} as const;

/** Convert a millisecond duration to the seconds framer-motion expects. */
export const seconds = (ms: number) => ms / 1000;

/** The shared easing curve used across the Site's motion. */
export const easing = [0.19, 1, 0.22, 1] as const;

/**
 * The route entrance: a short fade and 8 px rise with no blur and no scale.
 * Applied through the shared shell so every route arrives the same way.
 */
export const fadeAndRise: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: seconds(durations.entrance),
      ease: easing,
    },
  },
};
