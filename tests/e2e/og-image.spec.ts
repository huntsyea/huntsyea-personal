import { expect, test } from "@playwright/test";

import { pngDimensions } from "./helpers";

test("home publishes a 1200x630 PNG card", async ({ page, request }) => {
  await page.goto("/");
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
});
