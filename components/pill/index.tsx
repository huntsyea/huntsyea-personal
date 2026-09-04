import type { ReactNode } from "react";

import Link from "@/components/link";

interface PillProps {
  href: string;
  newTab?: boolean;
  children: ReactNode;
}

/**
 * Home Contact link pill, built on the Link primitive. It shares the surface
 * and border colour roles with the SegmentedControl (bg, bg-subtle, border-
 * strong, rounded-medium) so interactive identity stays token-driven.
 */
export const Pill = ({ href, newTab = false, children }: PillProps) => (
  <Link
    href={href}
    newTab={newTab}
    variant="quiet"
    className="inline-flex h-10 items-center gap-3 rounded-medium border border-border-strong bg-bg px-3 font-medium text-base text-fg transition-colors hover:bg-bg-subtle"
  >
    {children}
  </Link>
);
