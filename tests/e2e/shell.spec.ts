import { expect, test } from "@playwright/test";

import { indexableRoutes, notFoundRoute } from "../fixtures/routes";
import { expectPageToBeHealthy } from "./helpers";

const shellRoutes = [...indexableRoutes, notFoundRoute];

const headerNavLinks: ReadonlyArray<readonly [name: string, href: string]> = [
  ["Posts", "/posts"],
  ["Projects", "/projects"],
  ["Favorites", "/favorites"],
];

const footerContactLinks: ReadonlyArray<readonly [name: string, href: string]> =
  [
    ["Email", "mailto:info@huntsyea.com"],
    ["X", "https://x.com/huntsyea"],
    ["GitHub", "https://github.com/huntsyea"],
  ];

for (const route of shellRoutes) {
  test(`${route} renders the shared shell`, async ({ page }) => {
    await page.goto(route);
    await expectPageToBeHealthy(page, route);

    // Header landmark, generated nav, and Theme control.
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();

    const primaryNav = header.getByRole("navigation", { name: "Primary" });
    for (const [name, href] of headerNavLinks) {
      const link = primaryNav.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }

    const themeControl = header.getByRole("group", { name: "Theme" });
    await expect(themeControl).toBeVisible();
    await expect(
      themeControl.getByRole("button", { name: /system/i }),
    ).toHaveAttribute("aria-pressed", expect.stringMatching(/^(true|false)$/));

    // Footer landmark repeats Contact links as text links, plus copyright.
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const contactNav = footer.getByRole("navigation", {
      name: "Contact links",
    });
    for (const [name, href] of footerContactLinks) {
      const link = contactNav.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
    await expect(footer).toContainText(/©/);
  });
}
