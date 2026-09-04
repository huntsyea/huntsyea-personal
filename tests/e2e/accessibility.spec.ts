import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { indexableRoutes, notFoundRoute } from "../fixtures/routes";

const routes = [...indexableRoutes, notFoundRoute];

for (const route of routes) {
  test(`axe has no violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      results.violations.map(({ id, help }) => `${id}: ${help}`).join("\n"),
    ).toEqual([]);
  });
}
