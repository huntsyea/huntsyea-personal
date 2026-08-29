import type { MetadataRoute } from "next";

import { contentCatalog } from "@/lib/content";
import { getSiteUrl } from "@/lib/site/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteUrl("/").toString(),
    },
    {
      url: getSiteUrl("/favorites").toString(),
    },
    ...contentCatalog.listEntries().map((entry) => {
      if (entry.kind === "category") {
        return {
          url: getSiteUrl(`/${entry.category.slug}`).toString(),
        };
      }

      return {
        url: getSiteUrl(
          `/${entry.post.category}/${entry.post.slug}`,
        ).toString(),
        lastModified: entry.post.updatedAt,
      };
    }),
  ];
}
