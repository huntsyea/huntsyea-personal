import { expect, test } from "@playwright/test";

test.describe("targeted visual baselines", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("post", async ({ page }) => {
    await page.goto("/posts/basic-writing-and-formatting-syntax");
    await expect(page).toHaveScreenshot("post-syntax.png");
  });

  test("category", async ({ page }) => {
    await page.goto("/posts");
    await expect(page).toHaveScreenshot("posts-category.png", {
      fullPage: true,
    });
  });

  test("dark theme control", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /dark/i }).click();
    await expect(page).toHaveScreenshot("home-dark.png", { fullPage: true });
  });
});
