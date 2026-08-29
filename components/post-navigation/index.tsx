"use client";

import type { AdjacentPosts } from "@/lib/content/types";

import { Link } from "next-view-transitions";

interface PostNavigationProps {
  category: string;
  adjacent: AdjacentPosts;
}

function PostNavigation({
  category,
  adjacent: { previous, next },
}: PostNavigationProps) {
  if (!previous && !next) {
    return null;
  }

  return (
    <div className="mt-16 flex w-full justify-between border-border border-t pt-8">
      {previous && (
        <Link
          href={`/${category}/${previous.slug}`}
          className="flex w-full flex-col gap-1 text-left"
        >
          <span className="text-muted">Previous</span>
          <span>{previous.title}</span>
        </Link>
      )}
      {next && (
        <Link
          href={`/${category}/${next.slug}`}
          className="flex w-full flex-col gap-1 text-right"
        >
          <span className="text-muted">Next</span>
          <span>{next.title}</span>
        </Link>
      )}
    </div>
  );
}

export { PostNavigation };
