import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Node test shim for `next-view-transitions`. The real package is a client
 * component whose dist imports `next/link` without an extension, which the
 * node Vitest environment cannot resolve. The MDX renderer routes links
 * through the Link primitive, so tests render the primitive's internal-link
 * branch through this anchor stand-in. It preserves the href, target, and rel
 * that browser tests assert, while keeping the client module out of the node
 * graph.
 */

export function Link({
  href,
  className,
  children,
  target,
  rel,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} className={className} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
}

export function ViewTransitions({ children }: { children: ReactNode }) {
  return children;
}
