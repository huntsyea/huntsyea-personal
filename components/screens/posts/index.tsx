import type { AdjacentPosts, ContentPost } from "@/lib/content/types";

import { Meta } from "@/components/meta-line";
import {
  OutlineAside,
  OutlineDisclosure,
  OutlineProvider,
} from "@/components/on-this-page";
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
    <OutlineProvider outline={rendered.outline}>
      <div className="xl:grid xl:w-column-wide xl:grid-cols-[minmax(0,var(--container-column))_var(--width-aside)] xl:items-start xl:gap-8">
        <OutlineAside />
        <article className="prose xl:col-start-1 xl:row-start-1">
          <header className="flex flex-col">
            <h1
              style={{ viewTransitionName: `post-title-${category}-${slug}` }}
            >
              {title}
            </h1>
            <Meta post={post} />
          </header>
          <OutlineDisclosure />

          {rendered.content}
          <PostNavigation category={category} adjacent={adjacent} />
        </article>
      </div>
    </OutlineProvider>
  );
};
