import { expect, test } from "@playwright/test";

import { siteRoutes } from "../fixtures/routes";

test.describe("targeted visual baselines", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await hideAuthoredContent(page);
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("home contact links", async ({ page }) => {
    await page.goto("/");
    const contactLinks = page.getByRole("navigation", {
      name: "Contact and social links",
    });
    await expect(contactLinks).toHaveScreenshot("home-contact-links.png");

    await contactLinks
      .getByRole("link", { name: "Email", exact: true })
      .focus();
    await expect(contactLinks).toHaveScreenshot("home-contact-links-focus.png");

    await selectDarkTheme(page);
    await expect(contactLinks).toHaveScreenshot("home-contact-links-dark.png");
  });

  test("dark theme control", async ({ page }) => {
    await selectDarkTheme(page);
    await hideAuthoredContent(page);
    await expect(page).toHaveScreenshot("home-dark.png", { fullPage: true });
  });
});

/**
 * Home omits the shared footer and its Theme control, so choose dark on the
 * Posts page (the choice persists) and return to home.
 */
async function selectDarkTheme(page: import("@playwright/test").Page) {
  await page.goto(siteRoutes.posts);
  await page.getByRole("button", { name: /dark/i }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.goto(siteRoutes.home);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
}

async function hideAuthoredContent(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.locator("[data-authored-content]").evaluateAll((elements) => {
    for (const element of elements) element.setAttribute("hidden", "");
  });
}
