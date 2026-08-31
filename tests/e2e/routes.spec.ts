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
});
