"use client";

import type { Variants } from "framer-motion";

import { motion, useReducedMotion } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: {
    y: 16,
    filter: "blur(4px)",
  },
  show: {
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 19,
      mass: 1.2,
    },
  },
};

function Container({ children, className }: React.HTMLProps<HTMLDivElement>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : container}
      initial={shouldReduceMotion ? false : "hidden"}
      animate={shouldReduceMotion ? undefined : "show"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div variants={shouldReduceMotion ? undefined : item}>
      {children}
    </motion.div>
  );
}

export { Container, Item };
