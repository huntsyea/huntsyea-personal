import type { ReactNode } from "react";

import Link from "@/components/link";

interface EntryListProps {
  children: ReactNode;
}

/**
 * The shared bordered row list. Every list on the Site (Posts, Projects,
 * Favorites) renders through this primitive so rows behave, hover, and focus
 * identically everywhere.
 */
export const EntryList = ({ children }: EntryListProps) => (
  <ul className="m-0 list-none p-0">{children}</ul>
);

interface EntryRowProps {
  title: string;
  href: string;
  /** Optional trailing date rendered at the end of the row. */
  trailingMeta?: ReactNode;
  /** Optional caption (a favorite note or hostname) rendered under the title. */
  caption?: ReactNode;
  /** Category slug qualifying a post row's shared-element view-transition name. */
  category?: string;
  /** Post slug sharing a view-transition name with the destination heading. */
  slug?: string;
  newTab?: boolean;
}

export const EntryRow = ({
  title,
  href,
  trailingMeta,
  caption,
  category,
  slug,
  newTab = false,
}: EntryRowProps) => {
  const content = (
    <>
      <span>{title}</span>
      {caption ? <span className="text-fg-muted">{caption}</span> : null}
    </>
  );

  return (
    <li className="m-0 list-none border-border border-t">
      <Link
        href={href}
        newTab={newTab}
        variant="quiet"
        className="flex w-full justify-between py-2"
      >
        {category && slug ? (
          <span
            className={caption ? "flex flex-col" : undefined}
            style={{ viewTransitionName: `post-title-${category}-${slug}` }}
          >
            {content}
          </span>
        ) : (
          <span className={caption ? "flex flex-col" : undefined}>
            {content}
          </span>
        )}
        {trailingMeta ?? null}
      </Link>
    </li>
  );
};
