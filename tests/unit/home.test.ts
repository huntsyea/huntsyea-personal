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
      title: "Sylph",
      tagline: "Next.js Portfolio Starter",
      extra: "share: true\npath: leftover\ncategory: home\n",
      body: "Hello from the garden.",
    });

    const intro = readHomeIntro(root);

    expect(intro).toEqual({
      title: "Sylph",
      tagline: "Next.js Portfolio Starter",
      body: "Hello from the garden.",
    });
    expect(intro).not.toHaveProperty("share");
    expect(intro).not.toHaveProperty("path");
    expect(intro).not.toHaveProperty("category");
  });
});

function createFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sylph-home-"));
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
