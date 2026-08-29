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
    writePost(root, "posts", "older", {
      title: "Older",
      created: "2024-01-01T00:00:00.000Z",
    });
    writePost(root, "posts", "newer", {
      title: "Newer",
      created: "2024-02-01T00:00:00.000Z",
    });
    fs.mkdirSync(path.join(root, "projects"));
    fs.writeFileSync(
      path.join(root, "home.md"),
      "---\ntitle: Sylph\ntagline: Intro\n---\n\nNot a category.\n",
    );

    const catalog = createContentCatalog({ contentRoot: root });

    expect(
      catalog
        .listCategories()
        .map((category) => [
          category.slug,
          category.posts.map((post) => post.slug),
        ]),
    ).toEqual([
      ["posts", ["newer", "older"]],
      ["projects", []],
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
      "category:posts",
      "category:projects",
      "post:posts/newer",
      "post:posts/older",
    ]);
    expect(
      catalog.listPosts().map((post) => `${post.category}/${post.slug}`),
    ).toEqual(["posts/newer", "posts/older"]);
    expect(catalog.getCategory("home")).toBeUndefined();
  });

  it("looks up posts and calculates adjacent posts without changing catalog ordering", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "first", {
      title: "First",
      created: "2024-01-01T00:00:00.000Z",
    });
    writePost(root, "posts", "second", {
      title: "Second",
      created: "2024-02-01T00:00:00.000Z",
    });
    writePost(root, "posts", "third", {
      title: "Third",
      created: "2024-03-01T00:00:00.000Z",
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.getPost("posts", "second")).toMatchObject({
      kind: "found",
      post: { title: "Second" },
    });
    expect(catalog.getPost("posts", "missing")).toEqual({
      kind: "unknown-post",
      category: "posts",
      slug: "missing",
    });
    expect(catalog.getPost("missing", "second")).toEqual({
      kind: "unknown-category",
      category: "missing",
    });
    expect(catalog.getAdjacent("posts", "second")).toMatchObject({
      previous: { slug: "first" },
      next: { slug: "third" },
    });
    expect(catalog.getAdjacent("posts", "missing")).toBeUndefined();
    expect(
      catalog.getCategory("posts")?.posts.map((post) => post.slug),
    ).toEqual(["third", "second", "first"]);
  });

  it("fails ingestion with the post path and invalid frontmatter field", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "invalid", {
      title: undefined,
      created: "2024-01-01T00:00:00.000Z",
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(ContentCatalogError);
    expect(() => catalog.listCategories()).toThrow(/invalid\.mdx.*title/i);
  });

  it("rejects nested entries instead of silently omitting them", () => {
    const root = createFixtureRoot();
    const nested = path.join(root, "posts", "drafts");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "hidden.mdx"), "# Hidden");

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(
      /posts.*drafts.*direct \.md or \.mdx files/i,
    );
  });

  it("skips a reserved favorites directory instead of treating it as a category", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "hello", {
      title: "Hello",
      created: "2024-01-01T00:00:00.000Z",
    });
    writeFavorite(root, "a-link.md", {
      title: "A link",
      href: "https://example.com",
      note: "Not a post.",
      group: "Articles",
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.listCategories().map((category) => category.slug)).toEqual([
      "posts",
    ]);
    expect(catalog.getCategory("favorites")).toBeUndefined();
    expect(catalog.getPost("favorites", "a-link")).toEqual({
      kind: "unknown-category",
      category: "favorites",
    });
  });

  it("accepts leftover publisher keys on an otherwise valid post", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "published", {
      title: "Published",
      created: "2024-01-01T00:00:00.000Z",
      extra: "share: true\ncategory: posts\npath: leftover\n",
    });

    const catalog = createContentCatalog({ contentRoot: root });
    const result = catalog.getPost("posts", "published");

    expect(result).toMatchObject({
      kind: "found",
      post: { title: "Published", category: "posts", slug: "published" },
    });
    if (result.kind === "found") {
      expect(result.post).not.toHaveProperty("share");
    }
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
  frontmatter: {
    title: string | undefined;
    created: string;
    updated?: string;
    extra?: string;
  },
): void {
  const directory = path.join(root, category);
  fs.mkdirSync(directory, { recursive: true });
  const title = frontmatter.title
    ? `title: ${JSON.stringify(frontmatter.title)}\n`
    : "";
  const extra = frontmatter.extra ?? "";
  const updated = frontmatter.updated ?? frontmatter.created;
  fs.writeFileSync(
    path.join(directory, `${slug}.mdx`),
    `---\n${title}${extra}time:\n  created: ${JSON.stringify(frontmatter.created)}\n  updated: ${JSON.stringify(updated)}\n---\n\n## ${slug}\n`,
  );
}

function writeFavorite(
  root: string,
  filename: string,
  frontmatter: {
    title: string;
    href: string;
    note: string;
    group: string;
  },
): void {
  const directory = path.join(root, "favorites");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, filename),
    `---\ntitle: ${JSON.stringify(frontmatter.title)}\nhref: ${JSON.stringify(frontmatter.href)}\nnote: ${JSON.stringify(frontmatter.note)}\ngroup: ${JSON.stringify(frontmatter.group)}\n---\n`,
  );
}
