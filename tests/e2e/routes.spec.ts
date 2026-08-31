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

  test("category, breadcrumb, and table-of-contents markup is semantic", async ({
    page,
  }) => {
    await page.goto(siteRoutes.posts);
    await expect(
      page.getByRole("list").last().locator(":scope > li"),
    ).toHaveCount(3);

    await page.goto(siteRoutes.gettingStartedPost);
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.locator("ol > li")).toHaveCount(5);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      "Getting Started",
    );

    const toc = page.getByRole("navigation", { name: "On this page" });
    const installation = toc.getByRole("link", { name: "Installation" });
    await expect(installation).toHaveAttribute("href", "#installation");
    await installation.click();
    await expect(page).toHaveURL(/#installation$/);
  });

  test("favorites lists curated outbound links", async ({ page }) => {
    await page.goto(siteRoutes.home);
    await expect(page.getByRole("link", { name: /Favorites/ })).toHaveAttribute(
      "href",
      siteRoutes.favorites,
    );

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
