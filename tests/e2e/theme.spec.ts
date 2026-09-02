import { expect, test } from "@playwright/test";

test.describe("theme and motion preferences", () => {
  test("theme control reserves the same space before hydration", async ({
    browser,
  }) => {
    const serverRenderedContext = await browser.newContext({
      javaScriptEnabled: false,
    });
    const serverRenderedPage = await serverRenderedContext.newPage();
    await serverRenderedPage.goto("/");
    const serverRenderedBox = await serverRenderedPage
      .locator("[data-theme-placeholder]")
      .boundingBox();
    await serverRenderedContext.close();

    const hydratedPage = await browser.newPage();
    await hydratedPage.goto("/");
    const hydratedBox = await hydratedPage
      .getByRole("group", { name: "Theme" })
      .boundingBox();
    await hydratedPage.close();

    expect(serverRenderedBox).not.toBeNull();
    expect(hydratedBox).not.toBeNull();
    expect(
      Math.abs(serverRenderedBox!.width - hydratedBox!.width),
    ).toBeLessThan(1);
    expect(
      Math.abs(serverRenderedBox!.height - hydratedBox!.height),
    ).toBeLessThan(1);
  });

  test("theme controls have names, selected state, and persist", async ({
    page,
  }) => {
    await page.goto("/");

    const light = page.getByRole("button", { name: /light/i });
    const dark = page.getByRole("button", { name: /dark/i });
    const system = page.getByRole("button", { name: /system/i });
    await expect(light).toBeVisible();
    await expect(dark).toBeVisible();
    await expect(system).toBeVisible();

    await dark.click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(light).toHaveAttribute("aria-pressed", "false");

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(dark).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("link", { name: "my favorites", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.goto("/");
    await expect(dark).toHaveAttribute("aria-pressed", "true");

    await light.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect(light).toHaveAttribute("aria-pressed", "true");

    await page.emulateMedia({ colorScheme: "dark" });
    await system.click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
  });

  test("embedded SVGs follow the selected site theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: /light/i }).click();
    await page.goto("/projects/pi-fusion");

    const diagram = page.getByRole("img", {
      name: /A Pi-Fusion run from the active model/,
    });
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toBeVisible();
    await expect.poll(() => readTopLeftLuminance(diagram)).toBeGreaterThan(240);

    await page.goto("/");
    await page.getByRole("button", { name: /dark/i }).click();
    await page.goto("/projects/pi-fusion");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect.poll(() => readTopLeftLuminance(diagram)).toBeLessThan(40);

    await page.goto("/");
    await page.getByRole("button", { name: /light/i }).click();
    await page.goto("/projects/pi-fusion");
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect.poll(() => readTopLeftLuminance(diagram)).toBeGreaterThan(240);
  });

  test("reduced motion is observable to the document", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect
      .poll(() =>
        page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
      )
      .toBe("auto");

    const animated = page.locator("main > div").first();
    await expect
      .poll(() =>
        animated.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).transitionDuration),
        ),
      )
      .toBeLessThanOrEqual(0.001);
  });
});

async function readTopLeftLuminance(
  diagram: import("@playwright/test").Locator,
): Promise<number> {
  return diagram.evaluate((element) => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context || !image.complete || image.naturalWidth === 0) return -1;

    context.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    return (red + green + blue) / 3;
  });
}
