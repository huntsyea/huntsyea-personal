"use client";

import type { HeadingOutlineItem } from "@/lib/content/types";

import Link from "@/components/link";
import { cn } from "@/lib/cn";

import { useEffect, useRef, useState } from "react";

interface TableOfContentsProps {
  outline: readonly HeadingOutlineItem[];
}

/**
 * The table of contents renders the same outline list twice from one
 * visible-heading state: a plain nav inside the sticky aside shown only at xl,
 * and a native details/summary disclosure shown only below xl (server-rendered
 * closed). Each variant is display:none when inactive, so exactly one
 * navigation named "On this page" is exposed to the accessibility tree at any
 * width, with no JavaScript and no first-paint shift at either width.
 */
export const TableOfContents = ({ outline }: TableOfContentsProps) => {
  const [visibleHeadings, setVisibleHeadings] = useState<Set<string>>(
    new Set(),
  );
  const highlightedHeading = useRef<HTMLElement | null>(null);
  const highlightTimeout = useRef<number | undefined>(undefined);

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

  const renderList = () => (
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
  );

  return (
    <>
      {/* Sticky aside at xl; hidden below xl. */}
      <nav
        aria-label="On this page"
        className="hidden xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1 xl:block xl:px-6"
      >
        {renderList()}
      </nav>

      {/* Disclosure below xl; hidden at xl. Server-rendered closed. */}
      <details data-toc className="xl:hidden">
        <summary className="cursor-pointer list-none text-sm font-medium text-fg-muted">
          On this page
        </summary>
        <nav aria-label="On this page">{renderList()}</nav>
      </details>
    </>
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
