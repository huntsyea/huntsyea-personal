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
      </header>

      {rendered.content}
      <PostNavigation category={post.category} adjacent={adjacent} />
      <TableOfContents outline={rendered.outline} />
    </article>
  );
};
