import { ContentCatalogError, createContentCatalog } from "@/lib/content";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const fixtureDirectories: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
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
      "---\ntitle: huntsyea\ntagline: Intro\n---\n\nNot a category.\n",
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
      "post:posts/newer",
      "post:posts/older",
      "category:projects",
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

  it("normalizes natural folder and file names and defaults optional metadata", () => {
    const root = createFixtureRoot();
    writePost(root, "Project Notes", "My First Post", {
      title: undefined,
      created: undefined,
    });

    const catalog = createContentCatalog({ contentRoot: root });
    const category = catalog.getCategory("project-notes");
    const result = catalog.getPost("project-notes", "my-first-post");

    expect(category).toMatchObject({
      slug: "project-notes",
      title: "Project Notes",
    });
    expect(result).toMatchObject({
      kind: "found",
      post: {
        category: "project-notes",
        slug: "my-first-post",
        title: "My First Post",
        createdAt: undefined,
        updatedAt: undefined,
      },
    });
  });

  it("removes Unicode combining marks before deriving routes", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "A\u1ab0B", {
      title: undefined,
      created: undefined,
    });

    expect(
      createContentCatalog({ contentRoot: root }).listPosts()[0]?.slug,
    ).toBe("ab");
  });

  it("supports Markdown and MDX while ignoring unrelated files", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "MDX Note", {
      title: undefined,
      created: undefined,
    });
    const directory = path.join(root, "posts");
    fs.writeFileSync(path.join(directory, "Markdown Note.md"), "Plain text.");
    fs.writeFileSync(path.join(directory, "attachment.png"), "not an image");

    expect(
      createContentCatalog({ contentRoot: root })
        .listPosts()
        .map((post) => post.slug),
    ).toEqual(["markdown-note", "mdx-note"]);
  });

  it("warns and ignores nested entries", () => {
    const root = createFixtureRoot();
    const nested = path.join(root, "posts", "drafts");
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "hidden.mdx"), "# Hidden");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.listCategories()).toMatchObject([
      { slug: "posts", posts: [] },
    ]);
    expect(warning).toHaveBeenCalledWith(
      expect.stringMatching(/content\/posts\/drafts.*ignored/i),
    );
  });

  it("ignores hidden folders at the content root", () => {
    const root = createFixtureRoot();
    writePost(root, ".obsidian", "workspace", {
      title: "Private workspace data",
      created: undefined,
    });

    expect(
      createContentCatalog({ contentRoot: root }).listCategories(),
    ).toEqual([]);
  });

  it("ignores invalid optional dates and keeps ordering deterministic", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "dated", {
      title: "Dated",
      created: "2024-02-01T00:00:00.000Z",
      updated: "2024-01-01T00:00:00.000Z",
    });
    writePost(root, "posts", "Invalid Date", {
      title: undefined,
      created: "not-a-date",
    });
    writePost(root, "posts", "undated", {
      title: "Undated",
      created: undefined,
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const posts = createContentCatalog({ contentRoot: root }).listPosts();

    expect(posts.map((post) => post.slug)).toEqual([
      "dated",
      "invalid-date",
      "undated",
    ]);
    expect(posts[0]?.updatedAt).toEqual(posts[0]?.createdAt);
    expect(posts[1]).toMatchObject({
      title: "Invalid Date",
      createdAt: undefined,
      updatedAt: undefined,
    });
    expect(warning).toHaveBeenCalledWith(
      expect.stringMatching(/content\/posts\/dated\.mdx.*earlier/i),
    );
    expect(warning).toHaveBeenCalledWith(
      expect.stringMatching(/content\/posts\/Invalid Date\.mdx.*invalid/i),
    );
  });

  it("uses YAML-native dates for ordering", () => {
    const root = createFixtureRoot();
    const directory = path.join(root, "posts");
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "Native Date.md"),
      "---\ntime:\n  created: 2024-02-01\n---\n",
    );
    writePost(root, "posts", "older", {
      title: undefined,
      created: "2024-01-01T00:00:00.000Z",
    });

    const posts = createContentCatalog({ contentRoot: root }).listPosts();

    expect(posts.map((post) => post.slug)).toEqual(["native-date", "older"]);
    expect(posts[0]?.createdAt?.toISOString()).toBe("2024-02-01T00:00:00.000Z");
  });

  it("warns when an optional date has a non-date YAML value", () => {
    const root = createFixtureRoot();
    const directory = path.join(root, "posts");
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "Invalid Date.md"),
      "---\ntime:\n  created: 42\n---\n",
    );
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    const [post] = createContentCatalog({ contentRoot: root }).listPosts();

    expect(post?.createdAt).toBeUndefined();
    expect(warning).toHaveBeenCalledWith(
      expect.stringMatching(/content\/posts\/Invalid Date\.md.*invalid/i),
    );
  });

  it("fails normalized route collisions with both relative source paths", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "Hello World", {
      title: "First",
      created: undefined,
    });
    writePost(root, "posts", "hello-world", {
      title: "Second",
      created: undefined,
    });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(ContentCatalogError);
    expect(() => catalog.listCategories()).toThrow(
      /content\/posts\/Hello World\.mdx.*content\/posts\/hello-world\.mdx/i,
    );
  });

  it("fails normalized category collisions with both relative paths", () => {
    const root = createFixtureRoot();
    fs.mkdirSync(path.join(root, "Field Notes"));
    fs.mkdirSync(path.join(root, "field-notes"));

    expect(() =>
      createContentCatalog({ contentRoot: root }).listCategories(),
    ).toThrow(/\/field-notes.*content\/Field Notes.*content\/field-notes/i);
  });

  it("fails malformed Markdown with a relative source path", () => {
    const root = createFixtureRoot();
    const directory = path.join(root, "posts");
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "broken.md"),
      "---\ntitle: [unterminated\n---\n",
    );

    const catalog = createContentCatalog({ contentRoot: root });

    expect(() => catalog.listCategories()).toThrow(
      /content\/posts\/broken\.md/i,
    );
  });

  it("fails unreadable Markdown with a relative source path", () => {
    const root = createFixtureRoot();
    const directory = path.join(root, "posts");
    const sourcePath = path.join(directory, "unreadable.md");
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(sourcePath, "Unreadable");
    fs.chmodSync(sourcePath, 0o000);

    try {
      expect(() =>
        createContentCatalog({ contentRoot: root }).listCategories(),
      ).toThrow(/content\/posts\/unreadable\.md/i);
    } finally {
      fs.chmodSync(sourcePath, 0o600);
    }
  });

  it("skips a reserved favorites directory instead of treating it as a category", () => {
    const root = createFixtureRoot();
    writePost(root, "posts", "hello", {
      title: "Hello",
      created: "2024-01-01T00:00:00.000Z",
    });
    writeFavorite(
      root,
      "a-link.md",
      {
        title: "A link",
        href: "https://example.com",
        note: "Not a post.",
        group: "Articles",
      },
      "Favorites",
    );

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

  it("exposes an index note as the Category intro and excludes it from Posts and the inventory", () => {
    const root = createFixtureRoot();
    writeIndex(root, "posts", { title: "Posts", body: "An intro to posts." });
    writePost(root, "posts", "first", {
      title: "First",
      created: "2024-01-01T00:00:00.000Z",
    });

    const catalog = createContentCatalog({ contentRoot: root });
    const category = catalog.getCategory("posts");

    expect(category?.intro).toBe("An intro to posts.");
    expect(category?.posts.map((post) => post.slug)).toEqual(["first"]);
    expect(
      catalog.listPosts().map((post) => `${post.category}/${post.slug}`),
    ).toEqual(["posts/first"]);
    expect(
      catalog
        .listEntries()
        .map((entry) =>
          entry.kind === "category"
            ? `category:${entry.category.slug}`
            : `post:${entry.post.category}/${entry.post.slug}`,
        ),
    ).toEqual(["category:posts", "post:posts/first"]);
    expect(catalog.getAdjacent("posts", "first")).toMatchObject({
      previous: undefined,
      next: undefined,
    });
  });

  it("treats a Category with only an index note as valid and empty", () => {
    const root = createFixtureRoot();
    writeIndex(root, "notes", { title: "Notes", body: "Notes intro." });

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.getCategory("notes")).toMatchObject({
      slug: "notes",
      intro: "Notes intro.",
      posts: [],
    });
    expect(
      catalog
        .listEntries()
        .map((entry) =>
          entry.kind === "category"
            ? `category:${entry.category.slug}`
            : `post:${entry.post.category}/${entry.post.slug}`,
        ),
    ).toEqual(["category:notes"]);
    expect(catalog.listPosts()).toEqual([]);
  });

  it("does not derive a Post or Category from an index note at the content root", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(
      path.join(root, "index.md"),
      "---\ntitle: huntsyea\n---\n\nHome intro.\n",
    );

    const catalog = createContentCatalog({ contentRoot: root });

    expect(catalog.listCategories()).toEqual([]);
    expect(catalog.listPosts()).toEqual([]);
    expect(catalog.listEntries()).toEqual([]);
  });

  it("fails when two index notes collide in the same Category folder", () => {
    const root = createFixtureRoot();
    writeIndex(root, "posts", { title: "One", body: "One" });
    writePost(root, "posts", "index", { title: "Two", created: undefined });

    expect(() =>
      createContentCatalog({ contentRoot: root }).listCategories(),
    ).toThrow(/intro route collision/i);
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
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "huntsyea-content-catalog-"),
  );
  fixtureDirectories.push(root);
  return root;
}

function writePost(
  root: string,
  category: string,
  slug: string,
  frontmatter: {
    title: string | undefined;
    created: string | undefined;
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
  const time = frontmatter.created
    ? `time:\n  created: ${JSON.stringify(frontmatter.created)}\n  updated: ${JSON.stringify(frontmatter.updated ?? frontmatter.created)}\n`
    : "";
  fs.writeFileSync(
    path.join(directory, `${slug}.mdx`),
    `---\n${title}${extra}${time}---\n\n## ${slug}\n`,
  );
}

function writeIndex(
  root: string,
  category: string,
  frontmatter: { title: string; body: string },
): void {
  const directory = path.join(root, category);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, "index.md"),
    `---\ntitle: ${JSON.stringify(frontmatter.title)}\n---\n\n${frontmatter.body}\n`,
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
  directoryName = "favorites",
): void {
  const directory = path.join(root, directoryName);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, filename),
    `---\ntitle: ${JSON.stringify(frontmatter.title)}\nhref: ${JSON.stringify(frontmatter.href)}\nnote: ${JSON.stringify(frontmatter.note)}\ngroup: ${JSON.stringify(frontmatter.group)}\n---\n`,
  );
}
