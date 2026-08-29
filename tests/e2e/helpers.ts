import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export async function expectPageToBeHealthy(page: Page, route: string) {
  await expect(page).toHaveURL(
    new RegExp(`${route === "/" ? "/?$" : `${route}/?$`}`),
  );
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.locator("h1")).toHaveCount(1);
}

export async function readMeta(page: Page, selector: string) {
  return page.locator(selector).getAttribute("content");
}

export function pngDimensions(bytes: Buffer) {
  if (
    bytes.length < 24 ||
    bytes.toString("ascii", 1, 4) !== "PNG" ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("Response is not a PNG image");
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}
