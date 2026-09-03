import type { MDXComponents } from "mdx/types";

import MDXImage from "@/components/image";
import Link from "@/components/link";
import Preview from "@/components/preview";
import { cn } from "@/lib/cn";

import React from "react";

export const mdxComponents: MDXComponents = {
  Link,
  PreviewExample: () => (
    <div className="flex h-10 w-32 items-center justify-center rounded-lg border border-yellow-6 bg-yellow-3 text-yellow-11">
      Showcase
    </div>
  ),
  Preview: ({ children, codeblock }) => (
    <Preview codeblock={codeblock ? codeblock : undefined}>{children}</Preview>
  ),
  Image: ({ caption, alt, ...props }) => (
    <MDXImage {...props} caption={caption} alt={alt} />
  ),
  a: ({ children, href, ...props }) => {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-fg-muted"
        underline
        {...props}
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className={cn(
        "mt-6 border-border border-l-2 pl-6 text-fg-muted",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-hidden overflow-y-auto">
      <table className={cn("w-full overflow-hidden", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border border-border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border border-border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("mt-2 ml-2 list-decimal", className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("mt-2 ml-2 list-disc", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("mt-2 ml-2 list-item", className)} {...props} />
  ),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
