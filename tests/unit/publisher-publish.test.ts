import type { VaultSnapshot } from "@/obsidian-plugin/src/contract";
import type { HttpRequest, HttpResponse } from "@/obsidian-plugin/src/github";

import { GitHubClient } from "@/obsidian-plugin/src/github";
import { encodeText, gitBlobSha } from "@/obsidian-plugin/src/hash";
import { Publisher } from "@/obsidian-plugin/src/publisher";

import { describe, expect, it } from "vitest";

/**
 * A small in-memory GitHub: enough of the git data API for the publisher to
 * read a tree, write blobs, commit, move a branch, and open a pull request.
 */
class FakeGitHub {
  readonly blobs = new Map<string, Uint8Array>();
  readonly trees = new Map<string, Map<string, string>>();
  readonly commits = new Map<string, { tree: string; message: string }>();
  readonly branches = new Map<string, string>();
  readonly pulls: Array<{
    number: number;
    head: string;
    state: "open" | "merged";
    title: string;
    body: string;
  }> = [];
  autoMergeEnabled: number[] = [];
  autoMergeRejects = false;
  readonly calls: string[] = [];
  private counter = 0;

  async seed(files: Record<string, string>, branch = "main") {
    const tree = new Map<string, string>();
    for (const [path, text] of Object.entries(files)) {
      const bytes = encodeText(text);
      const sha = await gitBlobSha(bytes);
      this.blobs.set(sha, bytes);
      tree.set(path, sha);
    }
    const treeSha = this.id("tree");
    this.trees.set(treeSha, tree);
    const commitSha = this.id("commit");
    this.commits.set(commitSha, { tree: treeSha, message: "seed" });
    this.branches.set(branch, commitSha);
  }

  fileText(branch: string, path: string): string | undefined {
    const commit = this.commits.get(this.branches.get(branch) ?? "");
    const sha = commit ? this.trees.get(commit.tree)?.get(path) : undefined;
    return sha ? new TextDecoder().decode(this.blobs.get(sha)) : undefined;
  }

  branchFiles(branch: string): string[] {
    const commit = this.commits.get(this.branches.get(branch) ?? "");
    return [
      ...(commit ? (this.trees.get(commit.tree)?.keys() ?? []) : []),
    ].sort();
  }

  request = async (request: HttpRequest): Promise<HttpResponse> => {
    const url = new URL(request.url);
    const path = url.pathname.replace("/repos/o/r", "");
    this.calls.push(`${request.method} ${path}`);
    const body: unknown = request.body ? JSON.parse(request.body) : undefined;

    if (request.method === "GET" && path.startsWith("/git/ref/heads/")) {
      const branch = decodeURIComponent(path.slice("/git/ref/heads/".length));
      const sha = this.branches.get(branch);
      return sha
        ? ok({ object: { sha } })
        : { status: 404, text: JSON.stringify({ message: "Not Found" }) };
    }
    if (request.method === "GET" && path.startsWith("/git/commits/")) {
      const commit = this.commits.get(path.slice("/git/commits/".length));
      return ok({ tree: { sha: commit?.tree } });
    }
    if (request.method === "GET" && path.startsWith("/git/trees/")) {
      const tree = this.trees.get(path.slice("/git/trees/".length));
      return ok({
        truncated: false,
        tree: [...(tree ?? [])].map(([entryPath, sha]) => ({
          path: entryPath,
          sha,
          type: "blob",
        })),
      });
    }
    if (request.method === "GET" && path.startsWith("/git/blobs/")) {
      const bytes = this.blobs.get(path.slice("/git/blobs/".length));
      return ok({
        encoding: "base64",
        content: Buffer.from(bytes ?? new Uint8Array()).toString("base64"),
      });
    }
    if (request.method === "POST" && path === "/git/blobs") {
      const { content } = body as { content: string };
      const bytes = new Uint8Array(Buffer.from(content, "base64"));
      const sha = await gitBlobSha(bytes);
      this.blobs.set(sha, bytes);
      return ok({ sha }, 201);
    }
    if (request.method === "POST" && path === "/git/trees") {
      const { base_tree, tree } = body as {
        base_tree: string;
        tree: Array<{ path: string; sha: string | null }>;
      };
      const next = new Map(this.trees.get(base_tree));
      for (const entry of tree) {
        if (entry.sha === null) next.delete(entry.path);
        else next.set(entry.path, entry.sha);
      }
      const sha = this.id("tree");
      this.trees.set(sha, next);
      return ok({ sha }, 201);
    }
    if (request.method === "POST" && path === "/git/commits") {
      const { tree, message } = body as { tree: string; message: string };
      const sha = this.id("commit");
      this.commits.set(sha, { tree, message });
      return ok({ sha }, 201);
    }
    if (request.method === "PATCH" && path.startsWith("/git/refs/heads/")) {
      const branch = decodeURIComponent(path.slice("/git/refs/heads/".length));
      if (!this.branches.has(branch)) {
        return { status: 422, text: JSON.stringify({ message: "missing" }) };
      }
      this.branches.set(branch, (body as { sha: string }).sha);
      return ok({});
    }
    if (request.method === "POST" && path === "/git/refs") {
      const { ref, sha } = body as { ref: string; sha: string };
      this.branches.set(ref.replace("refs/heads/", ""), sha);
      return ok({}, 201);
    }
    if (request.method === "GET" && path === "/pulls") {
      const head = url.searchParams.get("head")?.split(":")[1];
      return ok(
        this.pulls
          .filter((pull) => pull.state === "open" && pull.head === head)
          .map(toPullJson),
      );
    }
    if (request.method === "POST" && path === "/pulls") {
      const {
        head,
        title,
        body: text,
      } = body as {
        head: string;
        title: string;
        body: string;
      };
      const pull = {
        number: this.pulls.length + 1,
        head,
        state: "open" as const,
        title,
        body: text,
      };
      this.pulls.push(pull);
      return ok(toPullJson(pull), 201);
    }
    if (request.method === "POST" && path === "/graphql") {
      if (this.autoMergeRejects) {
        return ok({ errors: [{ message: "Pull request is in clean status" }] });
      }
      const { variables } = body as { variables: { id: string } };
      this.autoMergeEnabled.push(Number(variables.id.replace("PR_", "")));
      return ok({ data: {} });
    }
    if (request.method === "PUT" && /^\/pulls\/\d+\/merge$/.test(path)) {
      const number = Number(path.split("/")[2]);
      const pull = this.pulls.find((candidate) => candidate.number === number);
      if (pull) pull.state = "merged";
      return ok({ merged: true });
    }

    return { status: 500, text: `Unhandled ${request.method} ${path}` };
  };

  private id(prefix: string): string {
    this.counter += 1;
    return `${prefix}${this.counter.toString().padStart(4, "0")}`;
  }
}

function ok(value: unknown, status = 200): HttpResponse {
  return { status, text: JSON.stringify(value) };
}

function toPullJson(pull: { number: number }) {
  return {
    number: pull.number,
    node_id: `PR_${pull.number}`,
    html_url: `https://github.com/o/r/pull/${pull.number}`,
  };
}

const shared = (title: string) =>
  `---\ntitle: ${title}\nshare: true\n---\n\nBody of ${title}.\n`;

function vault(
  files: Record<string, string>,
  assets: string[] = [],
): VaultSnapshot {
  return {
    notes: Object.entries(files).map(([path, text]) => ({
      path,
      text,
      frontmatter: Object.fromEntries(
        [...text.matchAll(/^(\w+): (.+)$/gm)].map(([, key, value]) => [
          key,
          value === "true" ? true : value === "false" ? false : value,
        ]),
      ),
    })),
    assetPaths: assets,
  };
}

function createPublisher(
  github: FakeGitHub,
  assets: Record<string, string> = {},
) {
  const client = new GitHubClient(github.request, "o", "r", "token");
  return new Publisher(
    client,
    {
      shareKey: "share",
      excludedFolders: ["Templates"],
      contentRoot: "content",
      assetsRoot: "public/assets",
      baseBranch: "main",
      publishBranch: "obsidian/publish",
    },
    async (vaultPath) => {
      const text = assets[vaultPath];
      if (text === undefined) throw new Error(`no asset ${vaultPath}`);
      return encodeText(text);
    },
  );
}

describe("publisher", () => {
  it("publishes new and changed files and adopts existing ones into the manifest", async () => {
    const github = new FakeGitHub();
    await github.seed({
      "content/posts/old.md": shared("Old"),
      "content/projects/index.md": "hand made",
      "README.md": "readme",
    });

    const result = await createPublisher(github).publish(
      vault({
        "posts/old.md": shared("Old"),
        "posts/new.md": shared("New"),
        "home.md": shared("huntsyea"),
      }),
    );

    expect(result.status).toBe("published");
    if (result.status !== "published") return;
    expect(result.changes).toEqual([
      { kind: "add", repoPath: "content/home.md", vaultPath: "home.md" },
      {
        kind: "add",
        repoPath: "content/posts/new.md",
        vaultPath: "posts/new.md",
      },
    ]);
    expect(result.merge).toBe("queued");
    expect(github.autoMergeEnabled).toEqual([1]);
    expect(github.pulls[0].title).toBe("Publish from Obsidian: 2 added");
    expect(github.branchFiles("obsidian/publish")).toEqual([
      "README.md",
      "content/.publish-manifest.json",
      "content/home.md",
      "content/posts/new.md",
      "content/posts/old.md",
      "content/projects/index.md",
    ]);
    expect(
      JSON.parse(
        github.fileText("obsidian/publish", "content/.publish-manifest.json")!,
      ),
    ).toEqual({
      version: 1,
      files: {
        "content/home.md": "home.md",
        "content/posts/new.md": "posts/new.md",
        "content/posts/old.md": "posts/old.md",
      },
    });
    // The base branch is untouched until the pull request merges.
    expect(github.branchFiles("main")).not.toContain("content/home.md");
  });

  it("removes unshared and deleted notes and orphaned assets, never hand-made files", async () => {
    const github = new FakeGitHub();
    await github.seed({
      "content/posts/keep.md": shared("Keep"),
      "content/posts/unshared.md": shared("Unshared"),
      "content/posts/deleted.md": shared("Deleted"),
      "content/projects/index.md": "hand made",
      "public/assets/posts/orphan.svg": "<svg/>",
      "public/assets/inter/regular.ttf": "font",
      "content/.publish-manifest.json": JSON.stringify({
        version: 1,
        files: {
          "content/posts/keep.md": "posts/keep.md",
          "content/posts/unshared.md": "posts/unshared.md",
          "content/posts/deleted.md": "posts/deleted.md",
          "public/assets/posts/orphan.svg": "posts/assets/orphan.svg",
        },
      }),
    });

    const result = await createPublisher(github).publish(
      vault({
        "posts/keep.md": shared("Keep"),
        "posts/unshared.md": shared("Unshared").replace(
          "share: true",
          "share: false",
        ),
      }),
    );

    expect(result.status).toBe("published");
    if (result.status !== "published") return;
    expect(
      result.changes.map((change) => `${change.kind} ${change.repoPath}`),
    ).toEqual([
      "remove content/posts/deleted.md",
      "remove content/posts/unshared.md",
      "remove public/assets/posts/orphan.svg",
    ]);
    expect(github.branchFiles("obsidian/publish")).toEqual([
      "content/.publish-manifest.json",
      "content/posts/keep.md",
      "content/projects/index.md",
      "public/assets/inter/regular.ttf",
    ]);
  });

  it("uploads referenced assets from the vault", async () => {
    const github = new FakeGitHub();
    await github.seed({ "README.md": "readme" });

    const result = await createPublisher(github, {
      "posts/assets/flow.svg": "<svg>flow</svg>",
    }).publish(
      vault(
        {
          "posts/pi.md": `${shared("Pi")}<Image src="/assets/posts/flow.svg" />\n`,
        },
        ["posts/assets/flow.svg"],
      ),
    );

    expect(result.status).toBe("published");
    expect(
      github.fileText("obsidian/publish", "public/assets/posts/flow.svg"),
    ).toBe("<svg>flow</svg>");
  });

  it("reports nothing to publish when the vault matches GitHub", async () => {
    const github = new FakeGitHub();
    await github.seed({
      "content/posts/same.md": shared("Same"),
      "content/.publish-manifest.json":
        '{\n  "version": 1,\n  "files": {\n    "content/posts/same.md": "posts/same.md"\n  }\n}\n',
    });

    const publisher = createPublisher(github);
    const snapshot = vault({ "posts/same.md": shared("Same") });

    expect((await publisher.preview(snapshot)).unchanged).toBe(1);
    expect((await publisher.publish(snapshot)).status).toBe("nothing");
    expect(github.pulls).toEqual([]);
    expect(github.calls.filter((call) => call.startsWith("POST"))).toEqual([]);
  });

  it("stacks a second publish onto the open pull request", async () => {
    const github = new FakeGitHub();
    await github.seed({ "README.md": "readme" });
    const publisher = createPublisher(github);

    await publisher.publish(vault({ "posts/one.md": shared("One") }));
    const preview = await publisher.preview(
      vault({ "posts/one.md": shared("One"), "posts/two.md": shared("Two") }),
    );
    expect(preview.openPullRequestUrl).toBe("https://github.com/o/r/pull/1");
    expect(preview.changes.map((change) => change.repoPath)).toEqual([
      "content/posts/two.md",
    ]);

    const result = await publisher.publish(
      vault({ "posts/one.md": shared("One"), "posts/two.md": shared("Two") }),
    );
    expect(result.status).toBe("published");
    expect(github.pulls).toHaveLength(1);
    expect(github.branchFiles("obsidian/publish")).toContain(
      "content/posts/two.md",
    );
  });

  it("merges immediately when GitHub refuses auto-merge on a clean pull request", async () => {
    const github = new FakeGitHub();
    github.autoMergeRejects = true;
    await github.seed({ "README.md": "readme" });

    const result = await createPublisher(github).publish(
      vault({ "posts/one.md": shared("One") }),
    );

    expect(result.status === "published" && result.merge).toBe("merged");
    expect(github.pulls[0].state).toBe("merged");
  });

  it("refuses to publish when the plan has errors", async () => {
    const github = new FakeGitHub();
    await github.seed({ "README.md": "readme" });

    const result = await createPublisher(github).publish(
      vault({ "posts/One.md": shared("A"), "posts/one.md": shared("B") }),
    );

    expect(result.status).toBe("invalid");
    expect(github.calls).toEqual([]);
  });

  it("explains authentication failures", async () => {
    const client = new GitHubClient(
      async () => ({
        status: 401,
        text: JSON.stringify({ message: "Bad credentials" }),
      }),
      "o",
      "r",
      "bad",
    );

    await expect(client.getBranchSha("main")).rejects.toThrow(
      /401: Bad credentials\. Check the GitHub token/,
    );
  });
});
