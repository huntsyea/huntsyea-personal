import type { ContentCategory } from "@/lib/content/types";

import Link from "@/components/link";
import { formatter } from "@/lib/formatter";

import React from "react";

interface PostProps {
  category: ContentCategory;
  asCategoryPage?: boolean;
}

export const Posts = ({ category, asCategoryPage = false }: PostProps) => {
  const { posts } = category;

  return (
    <section className="mt-6 flex flex-col">
      {asCategoryPage ? (
        <h1 className="py-2 capitalize">
          {category.title} {posts.length > 0 && `(${posts.length})`}
        </h1>
      ) : (
        <Link href={`/${category.slug}`} className="flex justify-between">
          <h2 className="py-2 text-fg-muted capitalize">
            {category.title} {posts.length > 0 && `(${posts.length})`}
          </h2>
        </Link>
      )}

      <ul className="m-0 list-none p-0">
        {posts.map((post) => (
          <li key={post.slug} className="m-0 list-none border-border border-t">
            <Link
              href={`/${category.slug}/${post.slug}`}
              className="flex w-full justify-between py-2"
            >
              <span style={{ viewTransitionName: `post-title-${post.slug}` }}>
                {post.title}
              </span>
              {post.createdAt ? (
                <time className="text-fg-muted" dateTime={post.time?.created}>
                  {formatter.date(post.createdAt)}
                </time>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
