import { expect, test } from "@playwright/test";

import { pngDimensions } from "./helpers";

for (const route of ["/", "/guides", "/guides/getting-started"]) {
  test(`${route} publishes a 1200x630 PNG card`, async ({ page, request }) => {
    await page.goto(route);
    const imageUrl = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(imageUrl).toBeTruthy();

    const image = new URL(imageUrl!);
    const response = await request.get(`${image.pathname}${image.search}`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toMatch(/^image\/png(?:;|$)/);
    expect(pngDimensions(await response.body())).toEqual({
      width: 1200,
      height: 630,
    });

    const alt = await page
      .locator('meta[property="og:image:alt"]')
      .getAttribute("content");
    expect(alt).toBeTruthy();
    if (route === "/guides/getting-started") {
      expect(alt).toContain("Getting Started");
    }
  });
}
