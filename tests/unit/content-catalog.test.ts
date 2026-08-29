import { ContentCatalogError, createContentCatalog } from "@/lib/content";

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

describe("ContentCatalog", () => {
  it("discovers categories and produces a deterministic complete inventory", () => {
    const root = createFixtureRoot();
    writePost(root, "guides", "older", {
      title: "Older",
      created: "2024-01-01T00:00:00.000Z",
    });
    writePost(root, "guides", "newer", {
      title: "Newer",
      created: "2024-02-01T00:00:00.000Z",
    });
    fs.mkdirSync(path.join(root, "examples"));

    const catalog = createContentCatalog({ contentRoot: root });

    expect(
      catalog
        .listCategories()
        .map((category) => [
          category.slug,
          category.posts.map((post) => post.slug),
        ]),
    ).toEqual([
      ["examples", []],
      ["guides", ["newer", "older"]],
    ]);
    expect(
      catalog
        .listEntries()
        .map((entry) =>
          entry.kind === "category"
            ? `category:${entry.category.slug}`
            : `post:${entry.post.category}/${entry.post.slug}`,
        ),
    ).toEqual([
      "category:examples",
      "category:guides",
      "post:guides/newer",
      "post:guides/older",
    ]);
    expect(
      catalog.listPosts().map((post) => `${post.category}/${post.slug}`),
    ).toEqual(["guides/newer", "guides/older"]);
  });

  it("looks up posts and calculates adjacent posts without changing catalog ordering", () => {
    const root = createFixtureRoot();
    writePost(root, "guides", "first", {
      title: "First",
      created: "2024-01-01T00:00:00.000Z",
    });
    writePost(root, "guides", "second", {
      title: "Second",
      created: "2024-02-01T00:00:00.000Z",
    });
    writePost(root, "guides", "third", {
      title: "Third",
      created: "2024-03-01T00:00:00.000Z",
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.getPost("guides", "second")).toMatchObject({
      kind: "found",
      post: { title: "Second" },
    });
    expect(catalog.getPost("guides", "missing")).toEqual({
      kind: "unknown-post",
      category: "guides",
      slug: "missing",
    });
    expect(catalog.getPost("missing", "second")).toEqual({
      kind: "unknown-category",
      category: "missing",
    });
    expect(catalog.getAdjacent("guides", "second")).toMatchObject({
      previous: { slug: "first" },
      next: { slug: "third" },
    });
    expect(catalog.getAdjacent("guides", "missing")).toBeUndefined();
    expect(
      catalog.getCategory("guides")?.posts.map((post) => post.slug),
    ).toEqual(["third", "second", "first"]);
  });

  it("fails ingestion with the post path and invalid frontmatter field", () => {
    const root = createFixtureRoot();
    writePost(root, "guides", "invalid", {
      title: undefined,
      created: "2024-01-01T00:00:00.000Z",
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(ContentCatalogError);
    expect(() => catalog.listCategories()).toThrow(/invalid\.mdx.*title/i);
  });

  it("rejects nested entries instead of silently omitting them", () => {
    const root = createFixtureRoot();
    const nested = path.join(root, "guides", "drafts");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "hidden.mdx"), "# Hidden");

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(
      /guides.*drafts.*direct \.md or \.mdx files/i,
    );
  });
});

function createFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sylph-content-catalog-"));
  fixtureDirectories.push(root);
  return root;
}

function writePost(
  root: string,
  category: string,
  slug: string,
  frontmatter: { title: string | undefined; created: string; updated?: string },
): void {
  const directory = path.join(root, category);
  fs.mkdirSync(directory, { recursive: true });
  const title = frontmatter.title
    ? `title: ${JSON.stringify(frontmatter.title)}\n`
    : "";
  const updated = frontmatter.updated ?? frontmatter.created;
  fs.writeFileSync(
    path.join(directory, `${slug}.mdx`),
    `---\n${title}time:\n  created: ${JSON.stringify(frontmatter.created)}\n  updated: ${JSON.stringify(updated)}\n---\n\n## ${slug}\n`,
  );
}
