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

  test("favorites lists curated outbound links", async ({ page }) => {
    await page.goto(siteRoutes.home);
    await expect(
      page.getByText(
        "I tend to save a lot of stuff across the web, check out my favorites!",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "my favorites", exact: true }),
    ).toHaveAttribute("href", siteRoutes.favorites);
    await expect(
      page.getByRole("link", { name: /Designing for the Web/ }),
    ).toHaveCount(0);

    await page.goto(siteRoutes.favorites);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Favorites/,
    );
    await expect(
      page.getByRole("heading", { name: "Articles", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Resources", exact: true }),
    ).toBeVisible();

    const outbound = page.locator('main a[target="_blank"]');
    await expect(outbound).toHaveCount(12);
    await expect(
      page.getByRole("link", { name: /Designing for the Web/ }),
    ).toHaveAttribute(
      "href",
      "https://chriscoyier.net/2025/01/05/designing-for-the-web/",
    );
    await expect(outbound.first()).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    await expect(
      page.getByRole("link", { name: /How to Do Great Work/ }),
    ).toHaveAttribute("href", "http://www.paulgraham.com/greatwork.html");
  });
});
