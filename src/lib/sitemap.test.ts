import assert from "node:assert/strict";
import test from "node:test";

import {
  assemblePublicUrls,
  escapeXml,
  isUnmappedNumericSitemap,
  renderSitemapIndex,
  renderUrlSet,
  SITEMAP_CACHE_CONTROL,
  unmappedSitemapResponse,
} from "./sitemap.ts";

const origin = "https://huntsyea.com";

test("public sitemap lists index pages, posts, and projects only", () => {
  const { urls, indexUrls } = assemblePublicUrls({
    origin,
    intros: [
      {
        id: "home",
        updatedAt: new Date("2026-10-01T00:00:00.000Z"),
        noIndex: false,
      },
      { id: "posts", updatedAt: null, noIndex: false },
      {
        id: "projects",
        updatedAt: new Date("2026-09-01T00:00:00.000Z"),
        noIndex: false,
      },
      { id: "favorites", updatedAt: null, noIndex: false },
    ],
    entries: [
      {
        category: "posts",
        id: "abstraction",
        updatedAt: new Date("2026-08-31T00:00:00.000Z"),
        noIndex: false,
      },
      {
        category: "projects",
        id: "pi-fusion",
        updatedAt: new Date("2026-08-31T00:00:00.000Z"),
        noIndex: false,
      },
      {
        category: "blog",
        id: "weird-habits",
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        noIndex: false,
      },
      {
        category: "posts",
        id: "secret",
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        noIndex: true,
      },
      {
        category: "favorites",
        id: "a-link",
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        noIndex: false,
      },
    ],
  });

  const locs = urls.map((url) => url.loc);
  assert.deepEqual(
    indexUrls.map((url) => url.loc),
    [
      "https://huntsyea.com/",
      "https://huntsyea.com/posts",
      "https://huntsyea.com/projects",
      "https://huntsyea.com/favorites",
    ],
  );
  assert.deepEqual(locs, [
    ...indexUrls.map((url) => url.loc),
    "https://huntsyea.com/posts/abstraction",
    "https://huntsyea.com/projects/pi-fusion",
  ]);
  assert.equal(
    locs.some((loc) => loc.includes("weird-habits")),
    false,
  );
  assert.equal(
    locs.some((loc) => loc.includes("/blog/")),
    false,
  );
  assert.equal(
    locs.some((loc) => loc.endsWith("/secret")),
    false,
  );
  assert.equal(
    locs.some((loc) => loc.includes("a-link")),
    false,
  );
});

test("a hidden index page is left out of both sitemaps", () => {
  const { urls } = assemblePublicUrls({
    origin,
    intros: [{ id: "favorites", updatedAt: null, noIndex: true }],
    entries: [],
  });
  assert.equal(
    urls.some((url) => url.loc.endsWith("/favorites")),
    false,
  );
  assert.equal(
    urls.some((url) => url.loc === "https://huntsyea.com/"),
    true,
  );
});

test("urlset and sitemap index escape locs and advertise sitemap-0", () => {
  const urls = [
    {
      loc: "https://huntsyea.com/posts/a&b",
      lastmod: "2026-01-02T00:00:00.000Z",
    },
    {
      loc: "https://huntsyea.com/posts/older",
      lastmod: "2026-01-01T00:00:00.000Z",
    },
  ];
  const urlset = renderUrlSet(urls);
  assert.match(urlset, /<loc>https:\/\/huntsyea.com\/posts\/a&amp;b<\/loc>/);
  assert.equal(urlset.includes("weird-habits"), false);
  assert.equal(escapeXml(`<>&"'`), "&lt;&gt;&amp;&quot;&apos;");

  const index = renderSitemapIndex(origin, urls);
  assert.match(index, /<loc>https:\/\/huntsyea.com\/sitemap-0.xml<\/loc>/);
  assert.match(index, /<lastmod>2026-01-02T00:00:00.000Z<\/lastmod>/);
  assert.equal(index.includes("sitemap-posts"), false);
});

test("numbered sitemap chunks other than sitemap-0 are unmapped", () => {
  assert.equal(isUnmappedNumericSitemap("/sitemap-0.xml"), false);
  assert.equal(isUnmappedNumericSitemap("/sitemap-1.xml"), true);
  assert.equal(isUnmappedNumericSitemap("/sitemap-12.xml"), true);
  assert.equal(isUnmappedNumericSitemap("/sitemap-index.xml"), false);
  assert.equal(isUnmappedNumericSitemap("/sitemap-posts.xml"), false);

  const response = unmappedSitemapResponse();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), SITEMAP_CACHE_CONTROL);
  assert.match(response.headers.get("content-type") ?? "", /application\/xml/);
});
