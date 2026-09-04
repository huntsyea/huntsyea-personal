import type { MDXComponents } from "mdx/types";

import MDXImage from "@/components/image";
import Link from "@/components/link";
import Preview from "@/components/preview";
import { cn } from "@/lib/cn";

import React from "react";

export const mdxComponents: MDXComponents = {
  Link,
  PreviewExample: () => (
    <div className="flex h-10 w-32 items-center justify-center rounded-medium border border-border-strong bg-bg-subtle text-fg-muted">
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
        variant="inline"
        className="inline-flex items-center gap-1 text-fg-muted"
        {...props}
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote {...props} />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div
      data-table-wrap
      className={cn("w-full overflow-hidden overflow-y-auto", className)}
    >
      <table className="w-full" {...props} />
    </div>
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border border-border-strong px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border border-border-strong px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} />
  ),
  ul: ({ ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} />
  ),
  li: ({ ...props }: React.HTMLAttributes<HTMLLIElement>) => <li {...props} />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
