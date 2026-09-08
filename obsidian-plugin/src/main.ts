import type { Issue } from "./contract";
import type { HttpRequest, HttpResponse } from "./github";
import type { Change, Preview, PublishResult } from "./publisher";

import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
} from "obsidian";

import { defaultContractSettings } from "./contract";
import { GitHubClient } from "./github";
import { Publisher, summarize } from "./publisher";
import { readAssetFactory, readVaultSnapshot } from "./vault";

interface PublishSettings {
  owner: string;
  repo: string;
  baseBranch: string;
  publishBranch: string;
  shareKey: string;
  excludedFolders: string;
}

const defaultSettings: PublishSettings = {
  owner: "huntsyea",
  repo: "huntsyea-personal",
  baseBranch: "main",
  publishBranch: "obsidian/publish",
  shareKey: defaultContractSettings.shareKey,
  excludedFolders: defaultContractSettings.excludedFolders.join(", "),
};

/**
 * The token lives in Obsidian's device-local storage, never in the vault, so
 * Sync cannot delete it and every device keeps its own.
 */
const tokenStorageKey = "huntsyea-publish:github-token";

export default class PublishPlugin extends Plugin {
  settings: PublishSettings = { ...defaultSettings };

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "preview",
      name: "Preview what would publish",
      callback: () => this.run("preview"),
    });
    this.addCommand({
      id: "publish",
      name: "Publish shared notes",
      callback: () => this.run("publish"),
    });
    this.addRibbonIcon("upload-cloud", "Publish shared notes", () =>
      this.run("publish"),
    );
    this.addSettingTab(new PublishSettingTab(this.app, this));
  }

  getToken(): string {
    const stored: unknown = this.app.loadLocalStorage(tokenStorageKey);
    return typeof stored === "string" ? stored : "";
  }

  setToken(token: string) {
    this.app.saveLocalStorage(tokenStorageKey, token.trim() || null);
  }

  async loadSettings() {
    const stored = (await this.loadData()) as Partial<PublishSettings> | null;
    this.settings = { ...defaultSettings, ...(stored ?? {}) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async run(mode: "preview" | "publish") {
    const token = this.getToken();
    if (!token) {
      new Notice(
        "Add a GitHub token in the Publish to huntsyea.com settings first.",
      );
      return;
    }

    const notice = new Notice(
      mode === "preview" ? "Comparing with GitHub…" : "Publishing…",
      0,
    );
    try {
      const publisher = this.createPublisher(token);
      const snapshot = await readVaultSnapshot(this.app);

      if (mode === "preview") {
        const preview = await publisher.preview(snapshot);
        new PreviewModal(this.app, preview).open();
        return;
      }

      const result = await publisher.publish(snapshot);
      new ResultModal(this.app, result).open();
    } catch (error) {
      new Notice(
        `Publish failed: ${error instanceof Error ? error.message : String(error)}`,
        10_000,
      );
    } finally {
      notice.hide();
    }
  }

  private createPublisher(token: string): Publisher {
    const client = new GitHubClient(
      obsidianRequest,
      this.settings.owner.trim(),
      this.settings.repo.trim(),
      token,
    );
    return new Publisher(
      client,
      {
        ...defaultContractSettings,
        shareKey: this.settings.shareKey.trim() || defaultSettings.shareKey,
        excludedFolders: this.settings.excludedFolders
          .split(",")
          .map((folder) => folder.trim())
          .filter(Boolean),
        baseBranch: this.settings.baseBranch.trim() || "main",
        publishBranch:
          this.settings.publishBranch.trim() || defaultSettings.publishBranch,
      },
      readAssetFactory(this.app),
    );
  }
}

async function obsidianRequest(request: HttpRequest): Promise<HttpResponse> {
  const response = await requestUrl({
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    throw: false,
  });
  return { status: response.status, text: response.text };
}

class PreviewModal extends Modal {
  constructor(
    app: App,
    private readonly preview: Preview,
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl, preview } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Publish preview" });

    if (preview.plan.issues.some((issue) => issue.level === "error")) {
      contentEl.createEl("p", {
        text: "Fix the errors below before publishing.",
      });
    } else if (preview.changes.length === 0) {
      contentEl.createEl("p", { text: "Nothing to publish." });
    } else {
      contentEl.createEl("p", { text: summarize(preview.changes) });
      if (preview.openPullRequestUrl) {
        const paragraph = contentEl.createEl("p");
        paragraph.appendText("These will be added to the open pull request: ");
        paragraph.createEl("a", {
          text: preview.openPullRequestUrl,
          href: preview.openPullRequestUrl,
        });
      }
    }

    renderChanges(contentEl, preview.changes);
    renderIssues(contentEl, preview.plan.issues);
    contentEl.createEl("p", {
      text: `${preview.unchanged} published file(s) already match GitHub.`,
      cls: "setting-item-description",
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

class ResultModal extends Modal {
  constructor(
    app: App,
    private readonly result: PublishResult,
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl, result } = this;
    contentEl.empty();

    if (result.status === "invalid") {
      contentEl.createEl("h2", { text: "Nothing published" });
      contentEl.createEl("p", { text: "Fix these before publishing." });
      renderIssues(contentEl, result.issues);
      return;
    }

    if (result.status === "nothing") {
      contentEl.createEl("h2", { text: "Nothing to publish" });
      contentEl.createEl("p", {
        text: "Every shared note already matches GitHub.",
      });
      renderIssues(contentEl, result.issues);
      return;
    }

    contentEl.createEl("h2", { text: "Published" });
    const paragraph = contentEl.createEl("p");
    paragraph.appendText(
      result.merge === "merged"
        ? "Merged straight away: "
        : "The pull request will merge once the site checks pass: ",
    );
    paragraph.createEl("a", {
      text: result.pullRequestUrl,
      href: result.pullRequestUrl,
    });
    renderChanges(contentEl, result.changes);
    renderIssues(contentEl, result.issues);
  }

  onClose() {
    this.contentEl.empty();
  }
}

function renderChanges(container: HTMLElement, changes: readonly Change[]) {
  if (changes.length === 0) return;
  const list = container.createEl("ul");
  for (const change of changes) {
    list.createEl("li", {
      text: `${changeLabels[change.kind]} ${change.repoPath}`,
    });
  }
}

function renderIssues(container: HTMLElement, issues: readonly Issue[]) {
  if (issues.length === 0) return;
  container.createEl("h3", { text: "Issues" });
  const list = container.createEl("ul");
  for (const issue of issues) {
    list.createEl("li", {
      text: `${issue.level === "error" ? "Error" : "Warning"} · ${issue.path}: ${issue.message}`,
    });
  }
}

const changeLabels: Record<Change["kind"], string> = {
  add: "Add",
  update: "Update",
  remove: "Remove",
};

class PublishSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: PublishPlugin,
  ) {
    super(app, plugin);
  }

  display() {
    const { containerEl, plugin } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("GitHub token")
      .setDesc(
        "A fine-grained token with Contents and Pull requests write access to the site repository. Stored on this device only, never in the vault, so Sync cannot remove it.",
      )
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("github_pat_…")
          .setValue(plugin.getToken())
          .onChange((value) => plugin.setToken(value));
      });

    const bind = (
      name: string,
      description: string,
      key: keyof PublishSettings,
    ) => {
      new Setting(containerEl)
        .setName(name)
        .setDesc(description)
        .addText((text) =>
          text.setValue(plugin.settings[key]).onChange(async (value) => {
            plugin.settings[key] = value;
            await plugin.saveSettings();
          }),
        );
    };

    bind("Repository owner", "GitHub user or organisation.", "owner");
    bind("Repository name", "The site repository.", "repo");
    bind(
      "Base branch",
      "Publishes open pull requests against this branch.",
      "baseBranch",
    );
    bind(
      "Publish branch",
      "Branch the plugin writes to. Reused while a publish pull request is open.",
      "publishBranch",
    );
    bind(
      "Share key",
      "Frontmatter key that must be true for a note to publish.",
      "shareKey",
    );
    bind(
      "Excluded folders",
      "Comma-separated top-level folders that never publish.",
      "excludedFolders",
    );
  }
}
