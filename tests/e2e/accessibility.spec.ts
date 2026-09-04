import type { Page } from "@playwright/test";

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { indexableRoutes, notFoundRoute } from "../fixtures/routes";

const routes = [...indexableRoutes, notFoundRoute];

/** The route entrance fades main content in; axe must sample settled colours. */
async function waitForEntrance(page: Page) {
  await expect
    .poll(() =>
      page
        .locator("main > div")
        .first()
        .evaluate((element) => getComputedStyle(element).opacity),
    )
    .toBe("1");
}

for (const route of routes) {
  test(`axe has no violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await waitForEntrance(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map(({ id, help }) => `${id}: ${help}`).join("\n"),
    ).toEqual([]);
  });
}

test("axe has no violations on a Post at a narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/posts/pi-fusion");
  await waitForEntrance(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations,
    results.violations.map(({ id, help }) => `${id}: ${help}`).join("\n"),
  ).toEqual([]);
});
