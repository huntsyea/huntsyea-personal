import type { ContentPost } from "@/lib/content/types";

import { formatter } from "@/lib/formatter";

import { readingTime } from "reading-time-estimator";

interface MetaProps {
  post: ContentPost;
}

/**
 * The dot-separated Post metadata line (published, updated, reading time) in
 * the sm text role and muted colour role.
 */
export const Meta = ({ post }: MetaProps) => (
  <div className="mt-1 flex gap-2 text-fg-muted text-sm">
    {post.createdAt ? (
      <time dateTime={post.time?.created}>
        Published {formatter.date(post.createdAt)}
      </time>
    ) : null}
    {post.createdAt && post.updatedAt ? (
      <span aria-hidden="true">⋅</span>
    ) : null}
    {post.updatedAt ? (
      <time dateTime={post.time?.updated}>
        Updated {formatter.date(post.updatedAt)}
      </time>
    ) : null}
    {post.createdAt || post.updatedAt ? (
      <span aria-hidden="true">⋅</span>
    ) : null}
    <span>{readingTime(post.content).minutes} minutes read</span>
  </div>
);
