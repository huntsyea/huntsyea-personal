import { expect, test } from "@playwright/test";

import { indexableRoutes, siteRoutes } from "../fixtures/routes";
import { expectPageToBeHealthy } from "./helpers";

test.describe("production routes", () => {
  for (const route of indexableRoutes) {
    test(`${route} renders one page heading`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expectPageToBeHealthy(page, route);
    });
  }

  for (const route of [
    siteRoutes.missingCategory,
    siteRoutes.missingPost,
    "/examples",
  ]) {
    test(`${route} returns the useful catalog 404`, async ({
      page,
      request,
    }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(404);

      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Page not found",
      );
      await expect(
        page.getByRole("link", { name: "Return home" }),
      ).toHaveAttribute("href", "/");
    });
  }

  test("favorites exposes secure outbound links", async ({ page }) => {
    await page.goto(siteRoutes.home);
    await expect(
      page.locator(`a[href="${siteRoutes.favorites}"]`),
    ).toBeVisible();

    await page.goto(siteRoutes.favorites);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Favorites/,
    );

    const outbound = page.locator('main a[target="_blank"]');
    expect(await outbound.count()).toBeGreaterThan(0);
    for (const link of await outbound.all()) {
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
