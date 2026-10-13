import type { APIRoute } from "astro";

import { INTRO_PATHS } from "@/lib/content";

import { getEmDashCollection, getSiteSettings } from "emdash";

/**
 * EmDash serves /sitemap.xml and one /sitemap-{collection}.xml per collection.
 * Page intros are not pages of their own (the slug names the page they
 * introduce), so this replaces only their sitemap with the pages they power.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const settings = await getSiteSettings();
  const origin = settings.url || site?.origin || url.origin;
  const { entries } = await getEmDashCollection("pages");
  const updated = new Map(entries.map((e) => [e.id, e.data.updatedAt]));

  const urls = Object.entries(INTRO_PATHS)
    .map(([slug, path]) => {
      const lastmod = updated.get(slug);
      return `  <url><loc>${new URL(path, origin)}</loc>${
        lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""
      }</url>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
