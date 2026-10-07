#!/usr/bin/env node
/**
 * Exports theme-aware SVG diagrams to a light and a dark PNG at 2x.
 *
 *   node scripts/export-diagram.mjs diagrams/pi-fusion-flow.svg [...more.svg]
 *
 * Each SVG is inlined into a page that loads the site's Inter font, rendered
 * once with the light and once with the dark color scheme, and written next to
 * the source as `<name>-light.png` and `<name>-dark.png`. Upload both to the
 * Media Library and pick them in a Diagram block.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/export-diagram.mjs <diagram.svg> [...]");
  process.exit(1);
}

const fonts = ["regular:400", "medium:500", "semi-bold:600"]
  .map((entry) => {
    const [file, weight] = entry.split(":");
    const url = pathToFileURL(path.resolve(`src/assets/inter/${file}.woff2`));
    return `@font-face { font-family: Inter; font-weight: ${weight}; src: url("${url}"); }`;
  })
  .join("\n");

const browser = await chromium.launch();
for (const file of files) {
  const svg = readFileSync(file, "utf8");
  const viewBox = /viewBox="([\d.\s-]+)"/
    .exec(svg)?.[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  if (!viewBox) throw new Error(`${file}: the SVG needs a viewBox`);
  const [, , width, height] = viewBox;

  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    });
    await page.setContent(
      `<!doctype html><style>${fonts}
        html, body { margin: 0; }
        svg { display: block; width: ${width}px; height: ${height}px; }
      </style>${svg}`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    const out = file.replace(/\.svg$/, `-${scheme}.png`);
    await page
      .locator("svg")
      .first()
      .screenshot({ path: out, omitBackground: false });
    await page.close();
    console.log(`${out} (${width * 2}×${height * 2})`);
  }
}
await browser.close();
