import { expect, test } from "@playwright/test";

test.describe("category intro", () => {
  test("renders an index note through the prose class above the list", async ({
    page,
  }) => {
    await page.goto("/projects");

    const intro = page.locator("main div.prose");
    await expect(intro).toBeVisible();
    await expect(intro).toHaveText(/things i have built/i);

    const isAboveList = await page.evaluate(() => {
      const intro = document.querySelector("main div.prose");
      const list = document.querySelector("main ul");
      return Boolean(
        intro &&
        list &&
        intro.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(isAboveList).toBe(true);
  });

  test("renders unchanged when a Category has no index note", async ({
    page,
  }) => {
    await page.goto("/posts");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Posts/);
    await expect(page.locator("main div.prose")).toHaveCount(0);
  });
});
