import type { APIRoute } from "astro";

import { CATEGORIES } from "@/lib/content";

import { getEmDashCollection, getSiteSettings } from "emdash";

export const GET: APIRoute = async ({ site, url }) => {
  const settings = await getSiteSettings();
  const origin = settings.url || site?.origin || url.origin;
  const title = settings.title || "huntsyea";
  const description = settings.tagline || title;

  const items = [];
  for (const category of CATEGORIES) {
    const { entries } = await getEmDashCollection(category.slug, {
      limit: 1000,
      orderBy: { published_at: "desc" },
    });
    for (const entry of entries) {
      const published = entry.data.publishedAt;
      items.push({
        title: entry.data.title,
        link: new URL(`/${category.slug}/${entry.id}`, origin).href,
        date: published ?? entry.data.updatedAt,
        summary: entry.data.summary ?? "",
      });
    }
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  const body = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${escapeXml(item.summary)}</description>
    </item>`,
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2001/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${origin}</link>
    <description>${escapeXml(description)}</description>
    <atom:link href="${new URL("/rss.xml", origin).href}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${body}
  </channel>
</rss>
`,
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
