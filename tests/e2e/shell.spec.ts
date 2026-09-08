import { expect, test } from "@playwright/test";

import { indexableRoutes, notFoundRoute, siteRoutes } from "../fixtures/routes";
import { expectPageToBeHealthy } from "./helpers";

// Home is content only: its identity block and contact pills already carry
// what the shared header and footer repeat.
const shellRoutes = [
  ...indexableRoutes.filter((route) => route !== siteRoutes.home),
  notFoundRoute,
];

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

    // Header landmark and generated nav.
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();

    const primaryNav = header.getByRole("navigation", { name: "Primary" });
    for (const [name, href] of headerNavLinks) {
      const link = primaryNav.getByRole("link", { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }

    // Footer landmark repeats Contact links as text links, carries the Theme
    // control, and ends with the copyright.
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const themeControl = footer.getByRole("group", { name: "Theme" });
    await expect(themeControl).toBeVisible();
    await expect(
      themeControl.getByRole("button", { name: /system/i }),
    ).toHaveAttribute("aria-pressed", expect.stringMatching(/^(true|false)$/));

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

test("home renders no header or footer", async ({ page }) => {
  await page.goto(siteRoutes.home);
  await expectPageToBeHealthy(page, siteRoutes.home);

  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("group", { name: "Theme" })).toHaveCount(0);

  // The section headings still lead into each Category.
  const main = page.getByRole("main");
  await expect(
    main.getByRole("link", { name: "Posts", exact: true }),
  ).toHaveAttribute("href", "/posts");
  await expect(
    main.getByRole("link", { name: "Projects", exact: true }),
  ).toHaveAttribute("href", "/projects");
});
