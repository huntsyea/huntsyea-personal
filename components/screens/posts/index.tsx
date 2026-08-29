import type { AdjacentPosts, ContentPost } from "@/lib/content/types";

import { TableOfContents } from "@/components/on-this-page";
import { PostNavigation } from "@/components/post-navigation";
import { renderPost } from "@/lib/content/renderer";
import { formatter } from "@/lib/formatter";

import React from "react";
import { readingTime } from "reading-time-estimator";

interface Props {
  post: ContentPost;
  adjacent: AdjacentPosts;
}

export const Layout = async ({ post, adjacent }: Props) => {
  const rendered = await renderPost(post);

  return (
    <article>
      <header className="flex flex-col">
        <h1>{post.title}</h1>
        <div className="mt-1 flex gap-2 text-muted text-small">
          <time dateTime={post.time.created}>
            Published {formatter.date(post.createdAt)}
          </time>
          <span aria-hidden="true">⋅</span>
          <time dateTime={post.time.updated}>
            Updated {formatter.date(post.updatedAt)}
          </time>
          <span aria-hidden="true">⋅</span>
          <span>{readingTime(post.content).minutes} minutes read</span>
        </div>
      </header>

      {rendered.content}
      <PostNavigation category={post.category} adjacent={adjacent} />
      <TableOfContents outline={rendered.outline} />
    </article>
  );
};
