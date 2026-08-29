import { favoriteGroups, favorites } from "@/lib/favorites";

import { describe, expect, it } from "vitest";

describe("favorites inventory", () => {
  it("keeps the curated outbound list grouped and unique", () => {
    expect(favoriteGroups.map((group) => group.title)).toEqual([
      "Articles",
      "Resources",
    ]);
    expect(favorites).toHaveLength(12);
    expect(new Set(favorites.map((item) => item.href)).size).toBe(12);
    expect(favorites.map((item) => item.href)).toEqual([
      "https://chriscoyier.net/2025/01/05/designing-for-the-web/",
      "https://grugbrain.dev/",
      "https://www.workingtheorys.com/p/taste-is-eating-silicon-valley",
      "https://www.writingruxandrabio.com/p/writing-tools-i-learned-from-the",
      "https://unkey.dev/blog/uuid-ux",
      "https://kk.org/thetechnium/1000-true-fans/",
      "http://www.paulgraham.com/makersschedule.html",
      "http://www.paulgraham.com/greatwork.html",
      "https://gist.github.com/chitchcock/1281611",
      "https://www.hillelwayne.com/",
      "https://basecamp.com/shapeup",
      "https://www.refactoringui.com/",
    ]);
  });
});
