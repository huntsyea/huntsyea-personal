import type { ContentCategory } from "@/lib/content/types";

import { EntryList, EntryRow } from "@/components/entry-list";
import { SectionHeading } from "@/components/section-heading";
import { formatter } from "@/lib/formatter";

interface PostProps {
  category: ContentCategory;
  asCategoryPage?: boolean;
}

export const Posts = ({ category, asCategoryPage = false }: PostProps) => {
  const { posts } = category;

  return (
    <section className="mt-6 flex flex-col">
      <SectionHeading
        title={category.title}
        href={asCategoryPage ? undefined : `/${category.slug}`}
        asPage={asCategoryPage}
      />

      <EntryList>
        {posts.map((post) => (
          <EntryRow
            key={post.slug}
            title={post.title}
            href={`/${category.slug}/${post.slug}`}
            viewTransitionSlug={post.slug}
            trailingMeta={
              post.createdAt ? (
                <time className="text-fg-muted" dateTime={post.time?.created}>
                  {formatter.date(post.createdAt)}
                </time>
              ) : undefined
            }
          />
        ))}
      </EntryList>
    </section>
  );
};
