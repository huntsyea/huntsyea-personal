import type { VaultNote, VaultSnapshot } from "@/obsidian-plugin/src/contract";

import {
  buildManifest,
  parseManifest,
  planPublish,
  serializeManifest,
} from "@/obsidian-plugin/src/contract";

import { describe, expect, it } from "vitest";

function note(
  path: string,
  frontmatter: Record<string, unknown> | undefined,
  body = "Body.",
): VaultNote {
  return { path, text: `---\n---\n${body}`, frontmatter };
}

function snapshot(
  notes: VaultNote[],
  assetPaths: string[] = [],
): VaultSnapshot {
  return { notes, assetPaths };
}

describe("publish contract", () => {
  it("publishes shared notes across every site surface", () => {
    const plan = planPublish(
      snapshot(
        [
          note("home.md", { title: "huntsyea", share: true }),
          note("posts/pi-fusion.md", { title: "Pi", share: true }),
          note("posts/draft.md", { title: "Draft", share: false }),
          note("posts/secret.md", { title: "No key" }),
          note("projects/index.md", { title: "projects", share: true }),
          note("projects/pi-fusion.md", { share: true }),
          note("favorites/shape-up.md", {
            href: "https://basecamp.com/shapeup",
            share: true,
          }),
          note("Templates/Post.md", { share: true }),
        ],
        [],
      ),
    );

    expect(plan.issues).toEqual([]);
    expect(plan.files.map((file) => file.repoPath)).toEqual([
      "content/favorites/shape-up.md",
      "content/home.md",
      "content/posts/pi-fusion.md",
      "content/projects/index.md",
      "content/projects/pi-fusion.md",
    ]);
  });

  it("delivers referenced assets and reports missing ones", () => {
    const plan = planPublish(
      snapshot(
        [
          note(
            "posts/pi-fusion.md",
            { share: true },
            '<Image src="/assets/posts/flow.svg" /> and ![x](/assets/posts/missing.svg)',
          ),
        ],
        ["posts/assets/flow.svg", "posts/assets/unused.svg"],
      ),
    );

    expect(plan.files.map((file) => file.repoPath)).toEqual([
      "content/posts/pi-fusion.md",
      "public/assets/posts/flow.svg",
    ]);
    expect(plan.issues).toEqual([
      {
        level: "error",
        path: "posts/pi-fusion.md",
        message:
          'Asset "/assets/posts/missing.svg" was not found at "posts/assets/missing.svg" in the vault.',
      },
    ]);
  });

  it("flags route collisions the site would refuse", () => {
    const plan = planPublish(
      snapshot([
        note("Posts/one.md", { share: true }),
        note("posts/One.md", { share: true }),
        note("posts/one.md", { share: true }),
        note("posts/index.md", { share: true }),
        note("posts/Index.md", { share: true }),
      ]),
    );

    const messages = plan.issues.map((issue) => issue.message);
    expect(messages).toContain(
      'Category route collision at "/posts" between "content/Posts" and "content/posts".',
    );
    expect(messages).toContain(
      'Post route collision at "/posts/one" between "posts/one.md" and "posts/One.md".',
    );
    expect(messages).toContain(
      'Intro route collision in "content/posts" between "posts/index.md" and "posts/Index.md".',
    );
  });

  it("warns about notes the site ignores and invalid metadata", () => {
    const plan = planPublish(
      snapshot([
        note("stray.md", { share: true }),
        note("posts/deep/nested.md", { share: true }),
        note("posts/bad-date.md", {
          share: true,
          time: { created: "not a date" },
        }),
        note("favorites/no-link.md", { share: true, href: "ftp://x" }),
      ]),
    );

    expect(plan.issues.every((issue) => issue.level === "warning")).toBe(true);
    expect(plan.issues.map((issue) => issue.path)).toEqual([
      "favorites/no-link.md",
      "posts/bad-date.md",
      "posts/deep/nested.md",
      "stray.md",
    ]);
    expect(plan.files.map((file) => file.repoPath)).toEqual([
      "content/favorites/no-link.md",
      "content/posts/bad-date.md",
    ]);
  });

  it("blocks malformed frontmatter and unsafe names", () => {
    const plan = planPublish(
      snapshot([
        {
          path: "posts/broken.md",
          text: "---\n: bad\n---\n",
          frontmatter: undefined,
          frontmatterError: "Could not parse frontmatter: bad",
        },
        note("posts/---.md", { share: true }),
        {
          path: "posts/not-a-map.md",
          text: "---\njust text\n---\n",
          frontmatter: "just text",
        },
        note("posts/number-title.md", { share: true, title: 42 }),
      ]),
    );

    expect(
      plan.issues.filter((issue) => issue.level === "error").map((i) => i.path),
    ).toEqual(["posts/---.md"]);
    // A non-string title is dropped by the site's schema, not rejected, and a
    // frontmatter block that is not a map is never shared.
    expect(plan.files.map((file) => file.repoPath)).toEqual([
      "content/posts/number-title.md",
    ]);
  });

  it("round-trips the manifest in Prettier's JSON shape", () => {
    const plan = planPublish(snapshot([note("posts/a.md", { share: true })]));
    const text = serializeManifest(buildManifest(plan));

    expect(text).toBe(
      '{\n  "version": 1,\n  "files": {\n    "content/posts/a.md": "posts/a.md"\n  }\n}\n',
    );
    expect(parseManifest(text).files).toEqual({
      "content/posts/a.md": "posts/a.md",
    });
    expect(parseManifest("not json").files).toEqual({});
    expect(parseManifest(undefined).files).toEqual({});
  });
});
