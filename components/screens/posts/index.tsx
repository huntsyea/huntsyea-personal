import type { AdjacentPosts, ContentPost } from "@/lib/content/types";

import { Meta } from "@/components/meta-line";
import { TableOfContents } from "@/components/on-this-page";
import { PostNavigation } from "@/components/post-navigation";
import { renderPost } from "@/lib/content/renderer";

import React from "react";

interface Props {
  post: ContentPost;
  adjacent: AdjacentPosts;
}

export const Layout = async ({ post, adjacent }: Props) => {
  const rendered = await renderPost(post);

  return (
    <article className="prose">
      <header className="flex flex-col">
        <h1 style={{ viewTransitionName: `post-title-${post.slug}` }}>
          {post.title}
        </h1>
        <Meta post={post} />
      </header>

      {rendered.content}
      <PostNavigation category={post.category} adjacent={adjacent} />
      <TableOfContents outline={rendered.outline} />
    </article>
  );
};
