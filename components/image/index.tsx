"use client";

import type { ImageProps } from "next/image";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import React from "react";

interface MDXImageProps extends ImageProps {
  alt: string;
  caption?: string;
  width: number | `${number}`;
  height: number | `${number}`;
}

export default function MDXImage({ caption, alt, ...props }: MDXImageProps) {
  const [isImageLoading, setImageLoading] = React.useState(true);
  const shouldReduceMotion = useReducedMotion();
  const href = props.src.toString();

  return (
    <motion.a
      className="my-6 flex cursor-pointer flex-col justify-end gap-2"
      href={href}
      whileHover={
        shouldReduceMotion ? undefined : { scale: 0.975, opacity: 0.9 }
      }
    >
      <div className="relative w-full overflow-hidden rounded-large border border-border">
        <Image
          alt={alt}
          sizes="(min-width: 768px) 640px, calc(100vw - 3rem)"
          style={{
            objectFit: "contain",
            width: "100%",
            height: "auto",
            objectPosition: "center",
            WebkitFilter: isImageLoading ? "blur(8px)" : "none",
            transition: "all 0.5s ease",
          }}
          onLoad={() => setImageLoading(false)}
          {...props}
        />
      </div>
      {caption && (
        <span className="pt-2 text-center text-xs leading-5">{caption}</span>
      )}
    </motion.a>
  );
}
