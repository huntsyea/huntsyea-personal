import type { APIRoute } from "astro";

import { loadPublicSitemap } from "@/lib/public-sitemap";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap";

/**
 * EmDash serves /sitemap.xml and one /sitemap-{collection}.xml per collection.
 * Page intros are not pages of their own (the slug names the page they
 * introduce), so this replaces only their sitemap with the pages they power.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const { indexUrls } = await loadPublicSitemap(site?.origin || url.origin);
  return xmlResponse(renderUrlSet(indexUrls));
};
