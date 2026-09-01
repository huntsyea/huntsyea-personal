import { expect, test } from "@playwright/test";

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

    await page.getByRole("button", { name: /dark/i }).click();
    await expect(contactLinks).toHaveScreenshot("home-contact-links-dark.png");
  });

  test("dark theme control", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /dark/i }).click();
    await hideAuthoredContent(page);
    await expect(page).toHaveScreenshot("home-dark.png", { fullPage: true });
  });
});

async function hideAuthoredContent(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.locator("[data-authored-content]").evaluateAll((elements) => {
    for (const element of elements) element.setAttribute("hidden", "");
  });
}
