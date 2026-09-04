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
  test("the root font stays at 16px so rem spacing keeps the 4px grid", async ({
    page,
  }) => {
    await page.goto("/");

    // The base text role is 14px on body, never on the root, so the root font
    // resolves against the browser default 16px.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ),
        ),
      )
      .toBe(16);

    const measured = (className: string, property: string) =>
      page.evaluate(
        ({ className, property }) => {
          const probe = document.createElement("div");
          probe.className = className;
          document.body.appendChild(probe);
          const value = Number.parseFloat(
            getComputedStyle(probe)[
              property as keyof CSSStyleDeclaration
            ] as string,
          );
          probe.remove();
          return value;
        },
        { className, property },
      );

    // p-1 / gap-1 resolve to 0.25rem = 4px at a 16px root.
    await expect.poll(() => measured("inline-flex gap-1", "columnGap")).toBe(4);
    // leading-6 resolves to 1.5rem = 24px at a 16px root.
    await expect.poll(() => measured("leading-6", "lineHeight")).toBe(24);
  });

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

    const row = page.locator('main a[href="/projects/pi-fusion"]');
    await row.focus();
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

test.describe("table of contents layout", () => {
  test("at xl the outline is a sticky aside beside the article, not fixed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(postRoute);

    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();

    const position = await toc.evaluate((element) => {
      const details = element.closest("details[data-toc]");
      return details ? getComputedStyle(details).position : null;
    });
    expect(position).toBe("sticky");

    // The disclosure is forced open at xl, so its summary is hidden.
    await expect(
      page.getByRole("button", { name: "On this page" }),
    ).toHaveCount(0);

    // The outline sits in the second grid column beside the article.
    const grid = await toc.evaluate((element) => {
      const parent = element.closest("div");
      return parent ? getComputedStyle(parent).display : null;
    });
    expect(grid).toBe("grid");

    // The article box and text align with the header brand at the main content
    // edge.
    const articleLeft = await page
      .locator("article")
      .evaluate((element) => element.getBoundingClientRect().left);
    const brandLeft = await page
      .getByRole("link", { name: "huntsyea" })
      .evaluate((element) => element.getBoundingClientRect().left);
    expect(articleLeft).toBe(brandLeft);
  });

  test("below xl the outline is a collapsed disclosure above the article", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(postRoute);

    const summary = page.locator("summary");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText("On this page");

    // Collapsed by default: the nav is hidden inside the closed disclosure.
    await expect(
      page.getByRole("navigation", { name: "On this page" }),
    ).toHaveCount(0);

    const isAboveArticle = await page.evaluate(() => {
      const disclosure = document.querySelector("details[data-toc]");
      const article = document.querySelector("article");
      return Boolean(
        disclosure &&
        article &&
        disclosure.compareDocumentPosition(article) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(isAboveArticle).toBe(true);

    // Opening the disclosure reveals the outline.
    await summary.click();
    await expect(
      page.getByRole("navigation", { name: "On this page" }),
    ).toBeVisible();
  });
});

test.describe("table of contents without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("at xl the outline links are visible without JavaScript", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(postRoute);

    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();
    await expect(
      toc.getByRole("link", { name: "How Pi-Fusion works" }),
    ).toBeVisible();
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
