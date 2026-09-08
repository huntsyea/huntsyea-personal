import type {
  ContractSettings,
  Issue,
  PublishFile,
  PublishPlan,
  VaultSnapshot,
} from "./contract";
import type { GitHubClient, TreeEntry, TreeWrite } from "./github";

import {
  buildManifest,
  hasErrors,
  manifestFileName,
  parseManifest,
  planPublish,
  serializeManifest,
} from "./contract";
import { encodeText, gitBlobSha } from "./hash";

export type PublisherSettings = ContractSettings & {
  baseBranch: string;
  publishBranch: string;
};

export type ReadAsset = (vaultPath: string) => Promise<Uint8Array>;

export type Change =
  | { kind: "add"; repoPath: string; vaultPath: string }
  | { kind: "update"; repoPath: string; vaultPath: string }
  | { kind: "remove"; repoPath: string; vaultPath: string };

export type Preview = {
  plan: PublishPlan;
  changes: readonly Change[];
  unchanged: number;
  /** Set when a publish pull request is already open and will be extended. */
  openPullRequestUrl?: string;
};

export type PublishResult =
  | { status: "invalid"; issues: readonly Issue[] }
  | { status: "nothing"; issues: readonly Issue[] }
  | {
      status: "published";
      issues: readonly Issue[];
      changes: readonly Change[];
      pullRequestUrl: string;
      merge: "queued" | "merged";
    };

type RemoteState = {
  headSha: string;
  treeSha: string;
  tree: readonly TreeEntry[];
  blobs: Map<string, string>;
  manifestText: string | undefined;
  openPullRequest: Awaited<ReturnType<GitHubClient["findOpenPullRequest"]>>;
};

type PendingWrite = {
  path: string;
  /** Bytes to upload, or null to delete the path. */
  bytes: Uint8Array | null;
};

type Prepared = {
  preview: Preview;
  remote: RemoteState;
  writes: readonly PendingWrite[];
  manifestText: string;
};

/**
 * Compares the vault with the repository and, on publish, ships one commit on
 * the publish branch with a pull request set to merge once checks pass.
 */
export class Publisher {
  constructor(
    private readonly client: GitHubClient,
    private readonly settings: PublisherSettings,
    private readonly readAsset: ReadAsset,
  ) {}

  async preview(snapshot: VaultSnapshot): Promise<Preview> {
    const plan = planPublish(snapshot, this.settings);
    if (hasErrors(plan.issues)) {
      return { plan, changes: [], unchanged: 0 };
    }
    const remote = await this.readRemote();
    const prepared = await this.prepare(plan, snapshot, remote);
    return prepared.preview;
  }

  async publish(snapshot: VaultSnapshot): Promise<PublishResult> {
    const plan = planPublish(snapshot, this.settings);
    if (hasErrors(plan.issues)) {
      return { status: "invalid", issues: plan.issues };
    }

    const remote = await this.readRemote();
    const { preview, writes, manifestText } = await this.prepare(
      plan,
      snapshot,
      remote,
    );

    const manifestChanged = manifestText !== remote.manifestText;
    if (preview.changes.length === 0 && !manifestChanged) {
      return { status: "nothing", issues: plan.issues };
    }

    const pending: PendingWrite[] = [...writes];
    if (manifestChanged) {
      pending.push({
        path: `${this.settings.contentRoot}/${manifestFileName}`,
        bytes: encodeText(manifestText),
      });
    }

    const treeWrites: TreeWrite[] = [];
    for (const write of pending) {
      treeWrites.push({
        path: write.path,
        sha: write.bytes ? await this.client.createBlob(write.bytes) : null,
      });
    }

    const treeSha = await this.client.createTree(remote.treeSha, treeWrites);
    const summary = summarize(preview.changes);
    const commitSha = await this.client.createCommit(
      `Publish from Obsidian: ${summary}`,
      treeSha,
      remote.headSha,
    );
    await this.client.setBranch(this.settings.publishBranch, commitSha);

    const pull =
      remote.openPullRequest ??
      (await this.client.createPullRequest({
        branch: this.settings.publishBranch,
        base: this.settings.baseBranch,
        title: `Publish from Obsidian: ${summary}`,
        body: describeChanges(preview.changes),
      }));
    const merge = await this.client.mergeWhenReady(pull);

    return {
      status: "published",
      issues: plan.issues,
      changes: preview.changes,
      pullRequestUrl: pull.url,
      merge,
    };
  }

  private async readRemote(): Promise<RemoteState> {
    const openPullRequest = await this.client.findOpenPullRequest(
      this.settings.publishBranch,
    );

    // Extend an open publish PR so successive edits stack on one branch;
    // otherwise start from the tip of the base branch.
    const branch = openPullRequest
      ? this.settings.publishBranch
      : this.settings.baseBranch;
    const headSha = await this.client.getBranchSha(branch);
    if (!headSha) {
      throw new Error(`Branch "${branch}" was not found on GitHub.`);
    }

    const treeSha = await this.client.getCommitTreeSha(headSha);
    const tree = await this.client.getTree(treeSha);
    const blobs = new Map(
      tree
        .filter((entry) => entry.type === "blob")
        .map((entry) => [entry.path, entry.sha]),
    );

    const manifestSha = blobs.get(
      `${this.settings.contentRoot}/${manifestFileName}`,
    );
    const manifestText = manifestSha
      ? new TextDecoder().decode(await this.client.getBlob(manifestSha))
      : undefined;

    return { headSha, treeSha, tree, blobs, manifestText, openPullRequest };
  }

  private async prepare(
    plan: PublishPlan,
    snapshot: VaultSnapshot,
    remote: RemoteState,
  ): Promise<Prepared> {
    const manifest = parseManifest(remote.manifestText);
    const changes: Change[] = [];
    const writes: PendingWrite[] = [];
    let unchanged = 0;

    const notesByPath = new Map(
      snapshot.notes.map((note) => [note.path, note]),
    );

    for (const file of plan.files) {
      const bytes = await this.readFile(file, notesByPath);
      const sha = await gitBlobSha(bytes);
      const remoteSha = remote.blobs.get(file.repoPath);

      if (remoteSha === sha) {
        unchanged += 1;
        continue;
      }

      changes.push({
        kind: remoteSha ? "update" : "add",
        repoPath: file.repoPath,
        vaultPath: file.vaultPath,
      });
      writes.push({ path: file.repoPath, bytes });
    }

    const published = new Set(plan.files.map((file) => file.repoPath));
    for (const [repoPath, vaultPath] of Object.entries(manifest.files)) {
      if (published.has(repoPath) || !remote.blobs.has(repoPath)) continue;
      changes.push({ kind: "remove", repoPath, vaultPath });
      writes.push({ path: repoPath, bytes: null });
    }

    changes.sort((left, right) => left.repoPath.localeCompare(right.repoPath));

    return {
      preview: {
        plan,
        changes,
        unchanged,
        openPullRequestUrl: remote.openPullRequest?.url,
      },
      remote,
      writes,
      manifestText: serializeManifest(buildManifest(plan)),
    };
  }

  private async readFile(
    file: PublishFile,
    notesByPath: ReadonlyMap<string, { text: string }>,
  ): Promise<Uint8Array> {
    if (file.kind === "note") {
      const note = notesByPath.get(file.vaultPath);
      if (!note) {
        throw new Error(`Note "${file.vaultPath}" vanished during publish.`);
      }
      return encodeText(note.text);
    }
    return this.readAsset(file.vaultPath);
  }
}

export function summarize(changes: readonly Change[]): string {
  const counts = { add: 0, update: 0, remove: 0 };
  for (const change of changes) counts[change.kind] += 1;
  const parts = [
    counts.add ? `${counts.add} added` : "",
    counts.update ? `${counts.update} updated` : "",
    counts.remove ? `${counts.remove} removed` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no file changes";
}

function describeChanges(changes: readonly Change[]): string {
  const lines = changes.map(
    (change) => `- ${labels[change.kind]} \`${change.repoPath}\``,
  );
  return ["Published from the Obsidian vault.", "", ...lines].join("\n");
}

const labels: Record<Change["kind"], string> = {
  add: "Add",
  update: "Update",
  remove: "Remove",
};
