"use client";

import { fadeAndRise } from "@/lib/motion";

import { motion, useReducedMotion } from "framer-motion";

export const Entrance = ({ children }: { children: React.ReactNode }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeAndRise}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
    >
      {children}
    </motion.div>
  );
};
