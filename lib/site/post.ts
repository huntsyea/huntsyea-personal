import "server-only";

import type { ContentPost } from "@/lib/content";

import { siteProfile } from "@/lib/site/profile";
import { createPostDescription } from "@/lib/site/profile-core";

export function getPostDescription(
  post: Pick<ContentPost, "category" | "seo" | "slug" | "summary" | "title">,
): string {
  return createPostDescription(siteProfile, {
    category: post.category,
    title: post.title,
    summary: post.summary,
    seoDescription: post.seo?.description,
  });
}
