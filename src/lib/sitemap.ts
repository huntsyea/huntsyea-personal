import type { IntroSlug } from "./content.ts";

import { INTRO_PATHS } from "./content.ts";

/** Same freshness as EmDash's sitemap and robots responses. */
export const SITEMAP_CACHE_CONTROL = "public, max-age=3600";

export type SitemapLink = {
  loc: string;
  lastmod?: string;
};

export type SitemapIntro = {
  id: string;
  updatedAt?: Date | null;
  noIndex: boolean;
};

export type SitemapEntry = {
  category: string;
  id: string;
  updatedAt?: Date | null;
  noIndex: boolean;
};

const INDEXABLE_CATEGORIES = new Set(["posts", "projects"]);

/**
 * A numbered sitemap chunk other than the legacy urlset at `/sitemap-0.xml`.
 * EmDash's `/sitemap-[collection].xml` route matches these, but its middleware
 * only attaches the database for slugs that start with a letter, so
 * `/sitemap-1.xml` responds 500 ("EmDash not configured"). Collection slugs
 * cannot be numeric, so the chunk does not exist.
 */
export function isUnmappedNumericSitemap(pathname: string): boolean {
  return (
    /^\/sitemap-[0-9]+\.xml$/.test(pathname) && pathname !== "/sitemap-0.xml"
  );
}

export function unmappedSitemapResponse(): Response {
  return new Response("<!-- Collection not found or empty -->", {
    status: 404,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function lastmodOf(date: Date | null | undefined): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function absolute(origin: string, path: string): string {
  return new URL(path, origin.replace(/\/$/, "")).href;
}

/**
 * Current public URLs: the pages Page intros introduce, plus published
 * posts and projects. Favorites have no page of their own. A category
 * outside posts and projects (including removed `/blog/…` paths) is dropped,
 * as is anything marked hidden from search engines.
 */
export function assemblePublicUrls(input: {
  origin: string;
  intros: readonly SitemapIntro[];
  entries: readonly SitemapEntry[];
}): { urls: SitemapLink[]; indexUrls: SitemapLink[] } {
  const introBySlug = new Map(input.intros.map((intro) => [intro.id, intro]));
  const indexUrls: SitemapLink[] = [];

  for (const [slug, path] of Object.entries(INTRO_PATHS) as [
    IntroSlug,
    string,
  ][]) {
    const intro = introBySlug.get(slug);
    if (intro?.noIndex) continue;
    indexUrls.push({
      loc: absolute(input.origin, path),
      lastmod: lastmodOf(intro?.updatedAt),
    });
  }

  const entryUrls: SitemapLink[] = [];
  for (const entry of input.entries) {
    if (entry.noIndex || !INDEXABLE_CATEGORIES.has(entry.category)) continue;
    entryUrls.push({
      loc: absolute(input.origin, `/${entry.category}/${entry.id}`),
      lastmod: lastmodOf(entry.updatedAt),
    });
  }

  return { indexUrls, urls: [...indexUrls, ...entryUrls] };
}

export function renderUrlSet(urls: readonly SitemapLink[]): string {
  const body = urls
    .map((url) => {
      const lastmod = url.lastmod
        ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>`
        : "";
      return `  <url><loc>${escapeXml(url.loc)}</loc>${lastmod}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** Legacy sitemap index: one chunk, `/sitemap-0.xml`, listing `urls`. */
export function renderSitemapIndex(
  origin: string,
  urls: readonly SitemapLink[],
): string {
  const loc = absolute(origin, "/sitemap-0.xml");
  const lastmod = urls
    .map((url) => url.lastmod)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const lastmodTag = lastmod
    ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </sitemap>\n</sitemapindex>\n`;
}

export function xmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}
