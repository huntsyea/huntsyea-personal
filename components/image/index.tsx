import type { ImageProps } from "next/image";

import Image from "next/image";

interface MDXImageProps extends Omit<ImageProps, "alt"> {
  alt: string;
  caption?: string;
}

export default function MDXImage({ caption, alt, ...props }: MDXImageProps) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-large border border-border">
      <Image
        alt={alt}
        sizes="(min-width: 768px) 640px, calc(100vw - 3rem)"
        className="h-auto w-full object-contain object-center"
        {...props}
      />
      {caption && (
        <figcaption className="w-full border-t border-border px-4 py-2 text-center text-sm leading-6 text-fg-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
