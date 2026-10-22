import type { APIRoute } from "astro";

import { loadPublicSitemap } from "@/lib/public-sitemap";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap";

/**
 * Legacy urlset (`/sitemap-0.xml`).
 *
 * EmDash serves `/sitemap.xml` and `/sitemap-{collection}.xml`. The dynamic
 * collection route also matches this path, with collection `"0"`. EmDash only
 * initializes the database for `/sitemap.xml` and for collection slugs that
 * start with a letter (`/sitemap-[a-z]…`). `"0"` misses that pattern, so the
 * handler runs without `locals.emdash.db` and returns 500
 * "EmDash not configured".
 *
 * This route is static, so it wins over the dynamic one, and it reads
 * published posts, projects, and index pages through the normal content API.
 * Removed URLs such as `/blog/weird-habits` are not in that inventory.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const { urls } = await loadPublicSitemap(site?.origin || url.origin);
  return xmlResponse(renderUrlSet(urls));
};
