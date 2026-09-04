import { expect, test } from "@playwright/test";

import { indexableRoutes, siteRoutes } from "../fixtures/routes";
import { expectPageToBeHealthy } from "./helpers";

test.describe("production routes", () => {
  for (const route of indexableRoutes) {
    test(`${route} renders one page heading`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expectPageToBeHealthy(page, route);
    });
  }

  for (const route of [
    siteRoutes.missingCategory,
    siteRoutes.missingPost,
    "/examples",
  ]) {
    test(`${route} returns the useful catalog 404`, async ({
      page,
      request,
    }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(404);

      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Page not found",
      );
      await expect(
        page.getByRole("link", { name: "Return home" }),
      ).toHaveAttribute("href", "/");
    });
  }

  test("home exposes contact links between its identity and introduction", async ({
    page,
  }) => {
    await page.goto(siteRoutes.home);

    const contactLinks = page.getByRole("navigation", {
      name: "Contact and social links",
    });
    await expect(contactLinks.getByRole("link")).toHaveText([
      "Email",
      "X",
      "GitHub",
    ]);
    await expect(
      contactLinks.getByRole("link", { name: "Email", exact: true }),
    ).toHaveAttribute("href", "mailto:info@huntsyea.com");

    for (const [name, href] of [
      ["X", "https://x.com/huntsyea"],
      ["GitHub", "https://github.com/huntsyea"],
    ] as const) {
      const link = contactLinks.getByRole("link", { name, exact: true });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }

    const isBetweenIdentityAndIntroduction = await page.evaluate(() => {
      const subtitle = document.querySelector("h2");
      const contacts = document.querySelector(
        'nav[aria-label="Contact and social links"]',
      );
      const introduction = document.querySelector("main p");

      return Boolean(
        subtitle &&
        contacts &&
        introduction &&
        subtitle.compareDocumentPosition(contacts) &
          Node.DOCUMENT_POSITION_FOLLOWING &&
        contacts.compareDocumentPosition(introduction) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(isBetweenIdentityAndIntroduction).toBe(true);
  });

  test("home contact links remain usable with a keyboard and narrow viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 280, height: 800 });
    await page.goto(siteRoutes.home);

    const contactLinks = page
      .getByRole("navigation", { name: "Contact and social links" })
      .getByRole("link");
    await page.keyboard.press("Tab");
    await expect(contactLinks.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(contactLinks.nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(contactLinks.nth(2)).toBeFocused();

    const layout = await page
      .getByRole("navigation", { name: "Contact and social links" })
      .evaluate((navigation) => {
        const linkRows = new Set(
          [...navigation.querySelectorAll("a")].map(
            (link) => link.getBoundingClientRect().top,
          ),
        );

        return {
          rows: linkRows.size,
          pageOverflows:
            document.documentElement.scrollWidth > window.innerWidth,
        };
      });
    expect(layout).toEqual({ rows: 2, pageOverflows: false });
  });

  test("favorites exposes secure outbound links", async ({ page }) => {
    await page.goto(siteRoutes.home);
    await expect(
      page.locator(`a[href="${siteRoutes.favorites}"]`),
    ).toBeVisible();

    await page.goto(siteRoutes.favorites);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Favorites/,
    );

    const outbound = page.locator('main a[target="_blank"]');
    expect(await outbound.count()).toBeGreaterThan(0);
    for (const link of await outbound.all()) {
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});

test.describe("view-transition navigation", () => {
  test("a list row navigates to its Post and back to its Category", async ({
    page,
  }) => {
    await page.goto("/projects");

    const row = page.locator('main a[href="/projects/pi-fusion"]');
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(/\/projects\/pi-fusion$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Pi-Fusion",
    );

    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Projects", exact: true })
      .click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Projects/,
    );
  });

  test("home row view-transition names are unique and match their post headings", async ({
    page,
  }) => {
    await page.goto(siteRoutes.home);

    const rowNames = await page
      .locator('main a span[style*="post-title-"]')
      .evaluateAll((elements) =>
        elements
          .map((element) =>
            getComputedStyle(element).getPropertyValue("view-transition-name"),
          )
          .filter(Boolean),
      );
    expect(rowNames.length).toBeGreaterThan(0);
    expect(new Set(rowNames).size).toBe(rowNames.length);

    const row = page.locator('main a[href="/projects/pi-fusion"]');
    const rowName = await row
      .locator('span[style*="post-title-"]')
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue("view-transition-name"),
      );
    await expect(rowName).not.toBe("");

    await row.click();
    await expect(page).toHaveURL(/\/projects\/pi-fusion$/);

    const headingName = await page
      .locator("h1")
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue("view-transition-name"),
      );
    expect(headingName).toBe(rowName);
  });

  test("external links keep target and rel through the Link primitive", async ({
    page,
  }) => {
    await page.goto("/favorites");

    const outbound = page.locator('main a[target="_blank"]');
    expect(await outbound.count()).toBeGreaterThan(0);
    for (const link of await outbound.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
