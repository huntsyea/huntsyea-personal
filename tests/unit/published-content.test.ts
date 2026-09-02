import { contentCatalog } from "@/lib/content";
import { readFavoriteGroups } from "@/lib/favorites";
import { readHomeIntro } from "@/lib/home";

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("published content", () => {
  it("loads the repository content through its public readers", () => {
    expect(() => contentCatalog.listEntries()).not.toThrow();
    expect(() => readFavoriteGroups()).not.toThrow();
    expect(() => readHomeIntro()).not.toThrow();
  });

  it("resolves root-relative asset references from published content", () => {
    const publicDirectory = path.join(process.cwd(), "public");
    const missingAssets = contentCatalog.listPosts().flatMap((post) => {
      const assetPaths = post.content.match(/\/assets\/[^)"'\s?#]+/g) ?? [];

      return [...new Set(assetPaths)]
        .filter(
          (assetPath) =>
            !fs.existsSync(path.join(publicDirectory, assetPath.slice(1))),
        )
        .map((assetPath) => `${post.sourcePath}: ${assetPath}`);
    });

    expect(missingAssets).toEqual([]);
  });
});
