import { contentCatalog } from "@/lib/content";
import { readFavoriteGroups } from "@/lib/favorites";
import { readHomeIntro } from "@/lib/home";

import { describe, expect, it } from "vitest";

describe("published content", () => {
  it("loads the repository content through its public readers", () => {
    expect(() => contentCatalog.listEntries()).not.toThrow();
    expect(() => readFavoriteGroups()).not.toThrow();
    expect(() => readHomeIntro()).not.toThrow();
  });
});
