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
  const { title, category, slug } = post;

  return (
    <div className="xl:grid xl:w-column-wide xl:grid-cols-[minmax(0,var(--container-column))_var(--width-aside)] xl:items-start xl:gap-8">
      <TableOfContents outline={rendered.outline} />
      <article className="prose xl:col-start-1 xl:row-start-1">
        <header className="flex flex-col">
          <h1 style={{ viewTransitionName: `post-title-${category}-${slug}` }}>
            {title}
          </h1>
          <Meta post={post} />
        </header>

        {rendered.content}
        <PostNavigation category={category} adjacent={adjacent} />
      </article>
    </div>
  );
};
