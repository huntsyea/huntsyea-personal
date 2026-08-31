import { expect, test } from "@playwright/test";

test.describe("targeted visual baselines", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await hideAuthoredContent(page);
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
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
