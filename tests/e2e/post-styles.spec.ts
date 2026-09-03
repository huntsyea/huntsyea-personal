import { expect, test } from "@playwright/test";

const postRoute = "/posts/pi-fusion";

test.describe("post typography", () => {
  test("article spacing and heading highlights remain active", async ({
    page,
  }) => {
    await page.goto(postRoute);

    const article = page.locator("article.prose");
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

test.describe("post design-system scale", () => {
  test("heading font sizes increase from body to h3 to h2 to h1", async ({
    page,
  }) => {
    await page.goto("/projects/pi-fusion");

    const article = page.locator("article");
    const body = await article
      .locator("p")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    const h3 = await article
      .getByRole("heading", { level: 3 })
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    const h2 = await article
      .getByRole("heading", { level: 2 })
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    const h1 = await article
      .locator("h1")
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );

    expect(body).toBeLessThan(h3);
    expect(h3).toBeLessThan(h2);
    expect(h2).toBeLessThan(h1);

    const headingWeight = (locator: import("@playwright/test").Locator) =>
      locator.evaluate((element) => getComputedStyle(element).fontWeight);
    await expect
      .poll(() =>
        headingWeight(article.getByRole("heading", { level: 2 }).first()),
      )
      .toBe("500");
    await expect
      .poll(() =>
        headingWeight(article.getByRole("heading", { level: 3 }).first()),
      )
      .toBe("500");
  });

  test("a focused row link shows the global focus ring", async ({ page }) => {
    await page.goto("/projects");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const row = page.locator('main a[href="/projects/pi-fusion"]');
    await expect(row).toBeFocused();

    const outline = await row.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    });
    expect(outline.outlineStyle).toBe("solid");
    expect(Number.parseFloat(outline.outlineWidth)).toBeGreaterThan(0);
    expect(outline.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("home prose", () => {
  test("the home intro carries the prose class and its rhythm", async ({
    page,
  }) => {
    await page.goto("/");

    const intro = page.locator('[data-authored-content="body"]');
    await expect(intro).toBeVisible();
    await expect(intro).toHaveClass(/prose/);

    const spacedParagraph = intro.locator(`p`).last();
    await expect
      .poll(() =>
        spacedParagraph.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).marginTop),
        ),
      )
      .toBeGreaterThan(0);
  });
});
