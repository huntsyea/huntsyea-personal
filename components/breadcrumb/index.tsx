"use client";

import { cn } from "@/lib/cn";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import React from "react";

export const Breadcrumb = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mt-0 mb-4 w-full font-normal text-sm")}
    >
      <ol className="flex list-none items-center gap-1 align-middle">
        <li>
          <Link className="text-fg-muted" href="/">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const label = segment
            .replaceAll("-", " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
          const isLast = index === segments.length - 1;

          return (
            <React.Fragment key={href}>
              <li aria-hidden="true">
                <ChevronRightIcon className="text-fg-muted" />
              </li>
              <li>
                {isLast ? (
                  <span aria-current="page" className="text-fg-muted">
                    {label}
                  </span>
                ) : (
                  <Link className="text-fg-muted" href={href}>
                    {label}
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
