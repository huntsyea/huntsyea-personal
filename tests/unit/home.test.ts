import { readHomeIntro } from "@/lib/home";

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

describe("readHomeIntro", () => {
  it("returns undefined when home.md is missing", () => {
    const root = createFixtureRoot();

    expect(readHomeIntro(root)).toBeUndefined();
  });

  it("ignores leftover publisher keys on home.md", () => {
    const root = createFixtureRoot();
    writeHome(root, {
      title: "huntsyea",
      tagline: "Product & AI",
      extra: "share: true\npath: leftover\ncategory: home\n",
      body: "Hello from the garden.",
    });

    const intro = readHomeIntro(root);

    expect(intro).toEqual({
      title: "huntsyea",
      tagline: "Product & AI",
      body: "Hello from the garden.",
    });
    expect(intro).not.toHaveProperty("share");
    expect(intro).not.toHaveProperty("path");
    expect(intro).not.toHaveProperty("category");
  });

  it("discovers a naturally capitalized Home Markdown file", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(
      path.join(root, "Home.mdx"),
      "---\ntitle: Hunter\n---\n\nHello from Obsidian.\n",
    );

    expect(readHomeIntro(root)).toEqual({
      title: "Hunter",
      tagline: undefined,
      body: "Hello from Obsidian.",
    });
  });

  it("keeps valid Home fields when another optional field is invalid", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(
      path.join(root, "home.md"),
      "---\ntitle: Hunter\ntagline: 42\n---\n\nHello.\n",
    );

    expect(readHomeIntro(root)).toEqual({
      title: "Hunter",
      tagline: undefined,
      body: "Hello.",
    });
  });

  it("returns the authored favorites sentence as part of the body", () => {
    const root = createFixtureRoot();
    writeHome(root, {
      title: "huntsyea",
      tagline: "Product & AI",
      body: [
        "I like to build cool products.",
        "",
        "I tend to save a lot of stuff across the web, check out [my favorites](/favorites)!",
      ].join("\n"),
    });

    const intro = readHomeIntro(root);

    expect(intro?.body).toContain(
      "I tend to save a lot of stuff across the web",
    );
    expect(intro?.body).toContain("[my favorites](/favorites)");
    expect(intro?.body).toBe(
      "I like to build cool products.\n\nI tend to save a lot of stuff across the web, check out [my favorites](/favorites)!",
    );
  });

  it("fails when multiple root documents normalize to home", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(path.join(root, "home.md"), "Primary");
    fs.writeFileSync(path.join(root, "HOME.mdx"), "Duplicate");

    expect(() => readHomeIntro(root)).toThrow(/home source collision/i);
    expect(() => readHomeIntro(root)).toThrow(/content\/HOME\.mdx/i);
    expect(() => readHomeIntro(root)).toThrow(/content\/home\.md/i);
  });

  it("fails malformed home frontmatter with a relative source path", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(
      path.join(root, "home.md"),
      "---\ntitle: [unterminated\n---\n",
    );

    expect(() => readHomeIntro(root)).toThrow(/content\/home\.md/i);
  });

  it("fails an invalid Home frontmatter shape with a relative source path", () => {
    const root = createFixtureRoot();
    fs.writeFileSync(path.join(root, "home.md"), "---\n- invalid\n---\n");

    expect(() => readHomeIntro(root)).toThrow(/content\/home\.md/i);
  });
});

function createFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "huntsyea-home-"));
  fixtureDirectories.push(root);
  return root;
}

function writeHome(
  root: string,
  frontmatter: {
    title: string;
    tagline: string;
    extra?: string;
    body: string;
  },
): void {
  fs.writeFileSync(
    path.join(root, "home.md"),
    `---\ntitle: ${JSON.stringify(frontmatter.title)}\ntagline: ${JSON.stringify(frontmatter.tagline)}\n${frontmatter.extra ?? ""}---\n\n${frontmatter.body}\n`,
  );
}
