import type { APIRoute } from "astro";

import { getCategory } from "@/lib/content";

import { cache, ImageResponse } from "@cf-wasm/og/workerd";
import { env } from "cloudflare:workers";
import { getEmDashEntry, getSeoMeta, getSiteSettings } from "emdash";
import { createElement as h } from "react";

/**
 * Social cards: `/og/index.png` for home, `/og/<path>.png` for every other
 * route. White title and muted description on black, as before.
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const path = (params.path ?? "").replace(/\.png$/, "");
  const settings = await getSiteSettings();
  const siteName = settings.title || "huntsyea";
  const card = await describe(path, siteName, settings.tagline);
  if (!card) return new Response("Not found", { status: 404 });

  const context = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (context) cache.setExecutionContext(context);

  // Read the font through the static-assets binding; a Worker fetching its
  // own public URL is not reliable in production.
  const fontUrl = new URL("/assets/inter/regular.ttf", url);
  const assets = (env as { ASSETS?: Fetcher }).ASSETS;
  const fontResponse = await (assets ? assets.fetch(fontUrl) : fetch(fontUrl));
  const font = await fontResponse.arrayBuffer();

  const image = await ImageResponse.async(
    h(
      "div",
      {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          color: "rgba(255, 255, 255, 0.92)",
          backgroundColor: "black",
          fontFamily: "Inter",
        },
      },
      h(
        "div",
        { style: { display: "flex", fontSize: 32, letterSpacing: "-0.6px" } },
        siteName,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            maxWidth: "960px",
          },
        },
        h(
          "div",
          {
            style: {
              fontSize: 72,
              fontWeight: 400,
              letterSpacing: "-2.4px",
              lineHeight: 1.1,
            },
          },
          card.title,
        ),
        card.description
          ? h(
              "div",
              {
                style: {
                  marginTop: 28,
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: 30,
                  lineHeight: 1.35,
                },
              },
              card.description,
            )
          : null,
      ),
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: font, weight: 400, style: "normal" }],
    },
  );

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600");
  return new Response(image.body, { status: image.status, headers });
};

async function describe(
  path: string,
  siteName: string,
  tagline: string | undefined,
): Promise<{ title: string; description?: string } | undefined> {
  if (path === "index") {
    const { entry } = await getEmDashEntry("pages", "home");
    return {
      title: siteName,
      description: entry
        ? (getSeoMeta(entry, { defaultDescription: tagline }).description ??
          undefined)
        : tagline,
    };
  }
  if (path === "favorites") {
    return {
      title: "Favorites",
      description:
        "External articles and resources Hunter keeps coming back to.",
    };
  }

  const [categorySlug, slug, ...rest] = path.split("/");
  const category = getCategory(categorySlug);
  if (!category || rest.length > 0) return undefined;
  if (!slug) {
    return {
      title: category.title,
      description: `Browse ${category.title.toLowerCase()} published with ${siteName}.`,
    };
  }

  const { entry } = await getEmDashEntry(category.slug, slug);
  if (!entry) return undefined;
  const seo = getSeoMeta(entry, { defaultDescription: entry.data.summary });
  return {
    title: seo.title || entry.data.title,
    description: seo.description ?? undefined,
  };
}
