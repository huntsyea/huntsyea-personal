import type { SitemapEntry, SitemapIntro, SitemapLink } from "@/lib/sitemap";

import { assemblePublicUrls } from "@/lib/sitemap";

import { getContentSeo, getEmDashCollection, getSiteSettings } from "emdash";

type CollectionName = "pages" | "posts" | "projects";

async function published<C extends CollectionName>(collection: C) {
  const entries: Awaited<ReturnType<typeof getEmDashCollection<C>>>["entries"] =
    [];
  let cursor: string | undefined;
  const seen = new Set<string>();

  for (;;) {
    const page = await getEmDashCollection(collection, {
      limit: 100,
      cursor,
    });
    if (page.error) throw page.error;
    entries.push(...page.entries);
    if (!page.nextCursor || seen.has(page.nextCursor)) break;
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  }

  return entries;
}

/**
 * The public sitemap inventory. Built from published entries only, so a
 * removed or unpublished slug is absent. An error fails the response
 * instead of advertising an empty list.
 */
export async function loadPublicSitemap(fallbackOrigin: string): Promise<{
  origin: string;
  urls: SitemapLink[];
  indexUrls: SitemapLink[];
}> {
  const settings = await getSiteSettings();
  const origin = settings.url || fallbackOrigin;
  const [pages, posts, projects] = await Promise.all([
    published("pages"),
    published("posts"),
    published("projects"),
  ]);

  const intros: SitemapIntro[] = pages.map((entry) => ({
    id: entry.id,
    updatedAt: entry.data.updatedAt,
    noIndex: getContentSeo(entry)?.noIndex === true,
  }));
  const entries: SitemapEntry[] = [
    ...posts.map((entry) => ({
      category: "posts",
      id: entry.id,
      updatedAt: entry.data.updatedAt,
      noIndex: getContentSeo(entry)?.noIndex === true,
    })),
    ...projects.map((entry) => ({
      category: "projects",
      id: entry.id,
      updatedAt: entry.data.updatedAt,
      noIndex: getContentSeo(entry)?.noIndex === true,
    })),
  ];

  return { origin, ...assemblePublicUrls({ origin, intros, entries }) };
}
