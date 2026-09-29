import type { APIRoute } from "astro";

import { getSiteSettings } from "emdash";

export const GET: APIRoute = async ({ site, url }) => {
  const settings = await getSiteSettings();
  const origin = settings.url || site?.origin || url.origin;
  const body =
    settings.seo?.robotsTxt?.trim() ||
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", origin)}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
