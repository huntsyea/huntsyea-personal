import { expect, test } from "@playwright/test";

import { indexableRoutes } from "../fixtures/routes";

const siteOrigin = process.env.SITE_URL ?? "https://example.com";

test.describe("metadata", () => {
  for (const route of indexableRoutes) {
    test(`${route} exposes canonical and social metadata`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveTitle(/\S+/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /\S+/,
      );
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute(
        "href",
        new URL(route, siteOrigin)
          .toString()
          .replace(/\/$/, route === "/" ? "" : "/"),
      );

      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        /\S+/,
      );
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute("content", /\S+/);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        new URL(route, siteOrigin)
          .toString()
          .replace(/\/$/, route === "/" ? "" : "/"),
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /https?:\/\/\S+/,
      );
      await expect(
        page.locator('meta[property="og:image:alt"]'),
      ).toHaveAttribute("content", /\S+/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        "content",
        /https?:\/\/\S+/,
      );
    });
  }

  test("robots and sitemap describe the production inventory", async ({
    request,
  }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText).toMatch(/User-agent:\s*\*/i);
    expect(robotsText).toContain(
      `Sitemap: ${new URL("/sitemap.xml", siteOrigin).toString()}`,
    );

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).toContain("<urlset");
    for (const route of indexableRoutes) {
      const location = `<loc>${new URL(route, siteOrigin).toString()}</loc>`;
      expect(sitemapXml.split(location)).toHaveLength(2);
    }
    expect(sitemapXml).not.toMatch(
      /opengraph-image|api\/og|robots\.txt|sitemap\.xml/,
    );
  });
});
