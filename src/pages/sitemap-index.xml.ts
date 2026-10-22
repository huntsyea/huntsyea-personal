import type { APIRoute } from "astro";

import { loadPublicSitemap } from "@/lib/public-sitemap";
import { renderSitemapIndex, xmlResponse } from "@/lib/sitemap";

/**
 * Legacy sitemap index. The path matches EmDash's collection sitemap as the
 * collection `"index"`, which does not exist, so EmDash returns 404
 * "Collection not found or empty". Point the index at `/sitemap-0.xml`, the
 * urlset of the current public pages.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const { origin, urls } = await loadPublicSitemap(site?.origin || url.origin);
  return xmlResponse(renderSitemapIndex(origin, urls));
};
