import { expect, test } from "@playwright/test";

const postRoute = "/posts/pi-fusion";

test.describe("post typography", () => {
  test("article spacing and heading highlights remain active", async ({
    page,
  }) => {
    await page.goto(postRoute);

    const article = page.locator("article.article");
    const firstParagraph = article.locator("p").first();
    const sectionHeading = article.getByRole("heading", {
      level: 2,
      name: "How Pi-Fusion works",
    });
    const nextSectionHeading = article.getByRole("heading", {
      level: 2,
      name: "Models fail differently",
    });
    const tableOfContents = page.getByRole("navigation", {
      name: "On this page",
    });

    await expect(article).toBeVisible();
    await expect
      .poll(() =>
        firstParagraph.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).marginTop),
        ),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        sectionHeading.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).marginTop),
        ),
      )
      .toBeGreaterThan(0);

    await tableOfContents
      .getByRole("link", { name: "How Pi-Fusion works" })
      .click();

    await expect(sectionHeading).toHaveAttribute("data-highlight", "true");
    await expect
      .poll(() =>
        sectionHeading.evaluate(
          (element) => getComputedStyle(element, "::before").backgroundColor,
        ),
      )
      .not.toBe("rgba(0, 0, 0, 0)");
    await tableOfContents
      .getByRole("link", { name: "Models fail differently" })
      .click();
    await expect(sectionHeading).toHaveAttribute("data-highlight", "false");
    await expect(nextSectionHeading).toHaveAttribute("data-highlight", "true");
    await expect(nextSectionHeading).toHaveAttribute(
      "data-highlight",
      "false",
      {
        timeout: 3_000,
      },
    );
  });
});
