import { favoriteGroups, favorites, readFavoriteGroups } from "@/lib/favorites";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const fixtureDirectories: string[] = [];

afterEach(() => {
  for (const directory of fixtureDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

const liveHrefs = [
  "https://kk.org/thetechnium/1000-true-fans/",
  "https://chriscoyier.net/2025/01/05/designing-for-the-web/",
  "http://www.paulgraham.com/greatwork.html",
  "http://www.paulgraham.com/makersschedule.html",
  "https://gist.github.com/chitchcock/1281611",
  "https://www.workingtheorys.com/p/taste-is-eating-silicon-valley",
  "https://grugbrain.dev/",
  "https://unkey.dev/blog/uuid-ux",
  "https://www.writingruxandrabio.com/p/writing-tools-i-learned-from-the",
  "https://www.hillelwayne.com/",
  "https://www.refactoringui.com/",
  "https://basecamp.com/shapeup",
] as const;

describe("favorites inventory", () => {
  it("keeps the curated outbound list grouped and unique", () => {
    expect(favoriteGroups.map((group) => group.title)).toEqual([
      "Articles",
      "Resources",
    ]);
    expect(favorites).toHaveLength(12);
    expect(new Set(favorites.map((item) => item.href)).size).toBe(12);
    expect(favorites.map((item) => item.href)).toEqual([...liveHrefs]);
  });

  it("returns empty groups when the folder is missing or empty", () => {
    const missing = path.join(
      os.tmpdir(),
      `sylph-favorites-missing-${Date.now()}`,
    );
    expect(readFavoriteGroups(missing)).toEqual([]);

    const empty = createFixtureRoot();
    expect(readFavoriteGroups(empty)).toEqual([]);
  });

  it("ignores leftover publisher keys and orders extra groups after Articles and Resources", () => {
    const root = createFixtureRoot();
    writeFavorite(root, "zeta-note.md", {
      title: "Zeta",
      href: "https://example.com/zeta",
      note: "Later extra group.",
      group: "Zines",
      extra: "share: true\ncategory: favorites\nslug: leftover\n",
    });
    writeFavorite(root, "beta-note.md", {
      title: "Beta",
      href: "https://example.com/beta",
      note: "Earlier extra group.",
      group: "Notes",
    });
    writeFavorite(root, "alpha-article.md", {
      title: "Alpha",
      href: "https://example.com/alpha",
      note: "First article.",
      group: "Articles",
    });

    expect(
      readFavoriteGroups(root).map((group) => [
        group.title,
        group.items.map((item) => item.href),
      ]),
    ).toEqual([
      ["Articles", ["https://example.com/alpha"]],
      ["Notes", ["https://example.com/beta"]],
      ["Zines", ["https://example.com/zeta"]],
    ]);
  });
});

function createFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sylph-favorites-"));
  fixtureDirectories.push(root);
  return root;
}

function writeFavorite(
  root: string,
  filename: string,
  frontmatter: {
    title: string;
    href: string;
    note: string;
    group: string;
    extra?: string;
  },
): void {
  fs.writeFileSync(
    path.join(root, filename),
    `---\ntitle: ${JSON.stringify(frontmatter.title)}\nhref: ${JSON.stringify(frontmatter.href)}\nnote: ${JSON.stringify(frontmatter.note)}\ngroup: ${JSON.stringify(frontmatter.group)}\n${frontmatter.extra ?? ""}---\n`,
  );
}
