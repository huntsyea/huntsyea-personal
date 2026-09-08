import { fromBase64, toBase64 } from "./hash";

/**
 * A minimal GitHub client over an injected request function, so it runs on
 * Obsidian's `requestUrl` (desktop and mobile) and on a fake in tests.
 */

export type HttpRequest = {
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: string;
};

export type HttpResponse = {
  status: number;
  text: string;
};

export type RequestFn = (request: HttpRequest) => Promise<HttpResponse>;

export type TreeEntry = {
  path: string;
  sha: string;
  type: "blob" | "tree" | "commit";
};

export type TreeWrite = {
  path: string;
  /** A blob SHA to write, or null to delete the path. */
  sha: string | null;
};

export type PullRequest = {
  number: number;
  nodeId: string;
  url: string;
};

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubClient {
  private readonly api = "https://api.github.com";

  constructor(
    private readonly request: RequestFn,
    private readonly owner: string,
    private readonly repo: string,
    private readonly token: string,
  ) {}

  async getBranchSha(branch: string): Promise<string | undefined> {
    const response = await this.call(
      "GET",
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      undefined,
      [404],
    );
    if (response.status === 404) return undefined;
    return (JSON.parse(response.text) as { object: { sha: string } }).object
      .sha;
  }

  async getCommitTreeSha(commitSha: string): Promise<string> {
    const response = await this.call(
      "GET",
      `/repos/${this.owner}/${this.repo}/git/commits/${commitSha}`,
    );
    return (JSON.parse(response.text) as { tree: { sha: string } }).tree.sha;
  }

  async getTree(treeSha: string): Promise<readonly TreeEntry[]> {
    const response = await this.call(
      "GET",
      `/repos/${this.owner}/${this.repo}/git/trees/${treeSha}?recursive=1`,
    );
    const body = JSON.parse(response.text) as {
      tree: TreeEntry[];
      truncated: boolean;
    };
    if (body.truncated) {
      throw new GitHubError(
        "The repository tree is too large to list in one request.",
        response.status,
      );
    }
    return body.tree.map(({ path, sha, type }) => ({ path, sha, type }));
  }

  async getBlob(blobSha: string): Promise<Uint8Array> {
    const response = await this.call(
      "GET",
      `/repos/${this.owner}/${this.repo}/git/blobs/${blobSha}`,
    );
    const body = JSON.parse(response.text) as {
      content: string;
      encoding: string;
    };
    if (body.encoding !== "base64") {
      throw new GitHubError(
        `Unexpected blob encoding "${body.encoding}".`,
        response.status,
      );
    }
    return fromBase64(body.content);
  }

  async createBlob(bytes: Uint8Array): Promise<string> {
    const response = await this.call(
      "POST",
      `/repos/${this.owner}/${this.repo}/git/blobs`,
      { content: toBase64(bytes), encoding: "base64" },
    );
    return (JSON.parse(response.text) as { sha: string }).sha;
  }

  async createTree(
    baseTreeSha: string,
    writes: readonly TreeWrite[],
  ): Promise<string> {
    const response = await this.call(
      "POST",
      `/repos/${this.owner}/${this.repo}/git/trees`,
      {
        base_tree: baseTreeSha,
        tree: writes.map((write) => ({
          path: write.path,
          mode: "100644",
          type: "blob",
          sha: write.sha,
        })),
      },
    );
    return (JSON.parse(response.text) as { sha: string }).sha;
  }

  async createCommit(
    message: string,
    treeSha: string,
    parentSha: string,
  ): Promise<string> {
    const response = await this.call(
      "POST",
      `/repos/${this.owner}/${this.repo}/git/commits`,
      { message, tree: treeSha, parents: [parentSha] },
    );
    return (JSON.parse(response.text) as { sha: string }).sha;
  }

  /** Points a branch at a commit, creating the branch when it does not exist. */
  async setBranch(branch: string, commitSha: string): Promise<void> {
    const response = await this.call(
      "PATCH",
      `/repos/${this.owner}/${this.repo}/git/refs/heads/${encodeURIComponent(branch)}`,
      { sha: commitSha, force: true },
      [404, 422],
    );
    if (response.status < 300) return;

    await this.call("POST", `/repos/${this.owner}/${this.repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: commitSha,
    });
  }

  async findOpenPullRequest(branch: string): Promise<PullRequest | undefined> {
    const response = await this.call(
      "GET",
      `/repos/${this.owner}/${this.repo}/pulls?state=open&head=${encodeURIComponent(`${this.owner}:${branch}`)}`,
    );
    const pulls = JSON.parse(response.text) as Array<{
      number: number;
      node_id: string;
      html_url: string;
    }>;
    const [pull] = pulls;
    return pull
      ? { number: pull.number, nodeId: pull.node_id, url: pull.html_url }
      : undefined;
  }

  async createPullRequest(input: {
    branch: string;
    base: string;
    title: string;
    body: string;
  }): Promise<PullRequest> {
    const response = await this.call(
      "POST",
      `/repos/${this.owner}/${this.repo}/pulls`,
      {
        head: input.branch,
        base: input.base,
        title: input.title,
        body: input.body,
      },
    );
    const pull = JSON.parse(response.text) as {
      number: number;
      node_id: string;
      html_url: string;
    };
    return { number: pull.number, nodeId: pull.node_id, url: pull.html_url };
  }

  /**
   * Asks GitHub to merge once required checks pass. When the pull request is
   * already clean GitHub refuses auto-merge, so fall back to merging now.
   */
  async mergeWhenReady(pull: PullRequest): Promise<"queued" | "merged"> {
    const response = await this.call("POST", "/graphql", {
      query: `mutation($id: ID!) {
        enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: MERGE }) {
          pullRequest { number }
        }
      }`,
      variables: { id: pull.nodeId },
    });
    const body = JSON.parse(response.text) as {
      errors?: Array<{ message: string }>;
    };
    if (!body.errors?.length) return "queued";

    const merge = await this.call(
      "PUT",
      `/repos/${this.owner}/${this.repo}/pulls/${pull.number}/merge`,
      { merge_method: "merge" },
      [405, 409],
    );
    if (merge.status < 300) return "merged";

    throw new GitHubError(
      `Could not enable auto-merge: ${body.errors.map((error) => error.message).join("; ")}`,
      merge.status,
    );
  }

  private async call(
    method: HttpRequest["method"],
    path: string,
    body?: unknown,
    allowedStatuses: readonly number[] = [],
  ): Promise<HttpResponse> {
    const response = await this.request({
      url: `${this.api}${path}`,
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status >= 300 && !allowedStatuses.includes(response.status)) {
      throw new GitHubError(
        describeFailure(response, method, path),
        response.status,
      );
    }
    return response;
  }
}

function describeFailure(
  response: HttpResponse,
  method: string,
  path: string,
): string {
  let detail = "";
  try {
    const body = JSON.parse(response.text) as { message?: string };
    detail = body.message ?? "";
  } catch {
    detail = response.text.slice(0, 200);
  }
  const hint =
    response.status === 401
      ? " Check the GitHub token in the plugin settings."
      : response.status === 403
        ? " The token may lack Contents or Pull requests write access."
        : "";
  return `GitHub ${method} ${path} failed with ${response.status}${detail ? `: ${detail}` : ""}.${hint}`;
}
