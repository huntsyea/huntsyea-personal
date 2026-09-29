import type { APIRoute } from "astro";

import { CATEGORIES } from "@/lib/content";

import { getEmDashCollection, getSiteSettings } from "emdash";

export const GET: APIRoute = async ({ site, url }) => {
  const settings = await getSiteSettings();
  const origin = settings.url || site?.origin || url.origin;
  const entries: { path: string; lastModified?: Date }[] = [
    { path: "/" },
    { path: "/favorites" },
  ];

  for (const category of CATEGORIES) {
    entries.push({ path: `/${category.slug}` });
    const { entries: posts } = await getEmDashCollection(category.slug, {
      limit: 1000,
    });
    for (const post of posts) {
      entries.push({
        path: `/${category.slug}/${post.id}`,
        lastModified: post.data.updatedAt,
      });
    }
  }

  const urls = entries
    .map(({ path, lastModified }) => {
      const loc = `<loc>${new URL(path, origin)}</loc>`;
      const mod = lastModified
        ? `<lastmod>${lastModified.toISOString()}</lastmod>`
        : "";
      return `  <url>${loc}${mod}</url>`;
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
