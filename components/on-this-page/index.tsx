"use client";

import type { HeadingOutlineItem } from "@/lib/content/types";

import Link from "@/components/link";
import { cn } from "@/lib/cn";

import { useEffect, useRef, useState } from "react";

interface TableOfContentsProps {
  outline: readonly HeadingOutlineItem[];
}

/**
 * The table of contents. Below xl it renders as a native details/summary
 * disclosure labelled "On this page" above the article, collapsed by default.
 * At xl it is forced open and becomes the sticky aside in the Post layout's
 * second grid column. The nav landmark keeps the single accessible name
 * "On this page" in both layouts.
 */
export const TableOfContents = ({ outline }: TableOfContentsProps) => {
  const [visibleHeadings, setVisibleHeadings] = useState<Set<string>>(
    new Set(),
  );
  // Server-rendered open so the outline is visible at xl without JavaScript
  // (the summary is hidden at xl). The client island collapses the disclosure
  // below xl on mount and re-evaluates on resize across the breakpoint.
  const [open, setOpen] = useState(true);
  const highlightedHeading = useRef<HTMLElement | null>(null);
  const highlightTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 80rem)");
    const update = () => setOpen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      setVisibleHeadings((current) => {
        const next = new Set(current);
        for (const entry of entries) {
          if (entry.isIntersecting) {
            next.add(entry.target.id);
          } else {
            next.delete(entry.target.id);
          }
        }

        return setsEqual(current, next) ? current : next;
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: 0,
    });

    for (const heading of outline) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
      window.clearTimeout(highlightTimeout.current);
      highlightedHeading.current?.setAttribute("data-highlight", "false");
      highlightedHeading.current = null;
      highlightTimeout.current = undefined;
    };
  }, [outline]);

  const highlightHeading = (id: string) => {
    window.clearTimeout(highlightTimeout.current);
    highlightedHeading.current?.setAttribute("data-highlight", "false");

    const heading = document.getElementById(id);
    if (!heading) {
      highlightedHeading.current = null;
      return;
    }

    heading.setAttribute("data-highlight", "true");
    highlightedHeading.current = heading;
    highlightTimeout.current = window.setTimeout(() => {
      heading.setAttribute("data-highlight", "false");
      highlightedHeading.current = null;
      highlightTimeout.current = undefined;
    }, 2_000);
  };

  if (outline.length === 0) {
    return null;
  }

  return (
    <details
      data-toc
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1 xl:block xl:px-6"
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-fg-muted xl:hidden">
        On this page
      </summary>
      <nav aria-label="On this page">
        <ol className="mt-0 flex flex-col gap-0">
          {outline.map((heading) => (
            <li key={heading.id} className="mt-0 list-none">
              <Link
                href={`#${heading.id}`}
                onClick={() => highlightHeading(heading.id)}
                className={cn({
                  "mt-0 ml-2 border-l border-border py-1 text-left text-fg-muted transition ease-in-out hover:text-fg": true,
                  "font-medium text-fg": visibleHeadings.has(heading.id),
                  "pl-4": heading.level === 2,
                  "pl-6": heading.level === 3,
                  "pl-7": heading.level >= 4,
                  "border-accent": visibleHeadings.has(heading.id),
                })}
                aria-current={
                  visibleHeadings.has(heading.id) ? "location" : undefined
                }
              >
                {heading.text}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
};

function setsEqual(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  return (
    left.size === right.size && [...left].every((value) => right.has(value))
  );
}
