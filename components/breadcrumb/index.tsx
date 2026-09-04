import Link from "@/components/link";
import { cn } from "@/lib/cn";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export const Breadcrumb = ({
  items,
  className,
}: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) => {
  const trail = [{ label: "Home", href: "/" }, ...items];
  const last = trail[trail.length - 1];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mt-0 mb-4 w-full font-normal text-sm", className)}
    >
      <ol className="flex list-none items-center gap-1 align-middle">
        {trail.map((item, index) => {
          const isLast = item === last;

          return (
            <React.Fragment key={item.href}>
              {index > 0 ? (
                <li aria-hidden="true">
                  <ChevronRightIcon className="text-fg-muted" />
                </li>
              ) : null}
              <li>
                {isLast ? (
                  <span aria-current="page" className="text-fg-muted">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} variant="nav">
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
