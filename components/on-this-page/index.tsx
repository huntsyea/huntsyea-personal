"use client";

import type { HeadingOutlineItem } from "@/lib/content/types";

import Link from "@/components/link";
import { cn } from "@/lib/cn";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { createContext, useContext, useEffect, useRef, useState } from "react";

interface OutlineState {
  outline: readonly HeadingOutlineItem[];
  visibleHeadings: ReadonlySet<string>;
  highlightHeading: (id: string) => void;
}

const OutlineContext = createContext<OutlineState | null>(null);

/**
 * Owns the visible-heading state and the click highlight for one Post and
 * shares it with the two outline variants: the sticky aside at xl and the
 * disclosure below xl. Each variant is display:none when inactive, so exactly
 * one navigation named "On this page" is exposed at any width, with no
 * JavaScript and no first-paint shift at either width.
 */
export const OutlineProvider = ({
  outline,
  children,
}: {
  outline: readonly HeadingOutlineItem[];
  children: React.ReactNode;
}) => {
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

  return (
    <OutlineContext.Provider
      value={{ outline, visibleHeadings, highlightHeading }}
    >
      {children}
    </OutlineContext.Provider>
  );
};

function useOutline(): OutlineState {
  const state = useContext(OutlineContext);
  if (!state) {
    throw new Error("Outline components must render inside OutlineProvider.");
  }
  return state;
}

/** The outline list. Indent lives on the item so wrapped lines stay aligned. */
const OutlineList = () => {
  const { outline, visibleHeadings, highlightHeading } = useOutline();

  return (
    <ol className="m-0 flex list-none flex-col border-l border-border p-0">
      {outline.map((heading) => {
        const active = visibleHeadings.has(heading.id);

        return (
          <li
            key={heading.id}
            className={cn("m-0 list-none", {
              "pl-4": heading.level === 2,
              "pl-6": heading.level === 3,
              "pl-8": heading.level >= 4,
              "-ml-px border-l border-accent": active,
            })}
          >
            <Link
              href={`#${heading.id}`}
              variant="quiet"
              onClick={() => highlightHeading(heading.id)}
              className={cn(
                "block py-1 text-fg-muted transition-colors hover:text-fg",
                active && "font-medium text-fg",
              )}
              aria-current={active ? "location" : undefined}
            >
              {heading.text}
            </Link>
          </li>
        );
      })}
    </ol>
  );
};

/** Sticky aside beside the reading column at xl; hidden below xl. */
export const OutlineAside = () => {
  const { outline } = useOutline();
  if (outline.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="hidden xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1 xl:block"
    >
      <OutlineList />
    </nav>
  );
};

/**
 * Compact disclosure after the Post header below xl; hidden at xl. Server-
 * rendered closed so phones see a collapsed control with no hydration shift.
 */
export const OutlineDisclosure = () => {
  const { outline } = useOutline();
  if (outline.length === 0) return null;

  return (
    <details data-toc className="group mt-stack xl:hidden">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-2 rounded-medium border border-border bg-bg px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-subtle [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDownIcon
          aria-hidden="true"
          className="transition-transform group-open:rotate-180"
        />
      </summary>
      <nav aria-label="On this page" className="mt-3">
        <OutlineList />
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
