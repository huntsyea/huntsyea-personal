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

import { fetchLogin, requestDeviceCode, waitForAuthorization } from "./auth";
import { defaultContractSettings } from "./contract";
import { GitHubClient } from "./github";
import { Publisher, summarize } from "./publisher";
import { readAssetFactory, readVaultSnapshot } from "./vault";

interface PublishSettings {
  clientId: string;
  owner: string;
  repo: string;
  baseBranch: string;
  publishBranch: string;
  shareKey: string;
  excludedFolders: string;
}

const defaultSettings: PublishSettings = {
  clientId: "Ov23libMm0XkNg38bp81",
  owner: "huntsyea",
  repo: "huntsyea-personal",
  baseBranch: "main",
  publishBranch: "obsidian/publish",
  shareKey: defaultContractSettings.shareKey,
  excludedFolders: defaultContractSettings.excludedFolders.join(", "),
};

/**
 * The token GitHub issues after sign-in lives in Obsidian's device-local
 * storage, never in the vault, so Sync cannot delete it and every device keeps
 * its own.
 */
const tokenStorageKey = "huntsyea-publish:github-token";
const loginStorageKey = "huntsyea-publish:github-login";

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

  getLogin(): string {
    const stored: unknown = this.app.loadLocalStorage(loginStorageKey);
    return typeof stored === "string" ? stored : "";
  }

  setSession(token: string | null, login: string | null) {
    this.app.saveLocalStorage(tokenStorageKey, token);
    this.app.saveLocalStorage(loginStorageKey, login);
  }

  /** Runs GitHub's device flow and stores the resulting token on this device. */
  async signIn(onDone: () => void) {
    const clientId = this.settings.clientId.trim();
    if (!clientId) {
      new Notice("Add the OAuth App client ID in the settings first.");
      return;
    }

    try {
      const code = await requestDeviceCode(obsidianRequest, clientId);
      const modal = new DeviceCodeModal(
        this.app,
        code.userCode,
        code.verificationUri,
      );
      modal.open();

      const outcome = await waitForAuthorization(
        obsidianRequest,
        clientId,
        code,
        (seconds) =>
          new Promise((resolve) => window.setTimeout(resolve, seconds * 1000)),
        () => modal.cancelled,
      );
      modal.close();

      if (outcome.status !== "authorized") {
        new Notice(
          outcome.status === "denied"
            ? "GitHub sign-in was denied."
            : "GitHub sign-in timed out. Try again.",
        );
        return;
      }

      const login = (await fetchLogin(obsidianRequest, outcome.token)) ?? "";
      this.setSession(outcome.token, login);
      new Notice(
        login ? `Signed in to GitHub as ${login}.` : "Signed in to GitHub.",
      );
    } catch (error) {
      new Notice(
        `GitHub sign-in failed: ${error instanceof Error ? error.message : String(error)}`,
        10_000,
      );
    } finally {
      onDone();
    }
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
        "Sign in to GitHub in the Publish to huntsyea.com settings first.",
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

class DeviceCodeModal extends Modal {
  cancelled = false;

  constructor(
    app: App,
    private readonly userCode: string,
    private readonly verificationUri: string,
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Sign in to GitHub" });
    contentEl.createEl("p", {
      text: "Enter this code on GitHub to let the plugin publish. This window closes on its own once GitHub confirms.",
    });
    contentEl.createEl("p", {
      text: this.userCode,
      attr: {
        style: "font-size: 2em; letter-spacing: 0.15em; text-align: center;",
      },
    });
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    const open = actions.createEl("button", {
      text: "Open GitHub",
      cls: "mod-cta",
    });
    open.addEventListener("click", () => {
      void navigator.clipboard?.writeText(this.userCode);
      window.open(this.verificationUri);
    });
    const copy = actions.createEl("button", { text: "Copy code" });
    copy.addEventListener("click", () => {
      void navigator.clipboard?.writeText(this.userCode);
      new Notice("Code copied.");
    });
  }

  onClose() {
    this.cancelled = true;
    this.contentEl.empty();
  }
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

    const login = plugin.getLogin();
    const signedIn = Boolean(plugin.getToken());
    new Setting(containerEl)
      .setName("GitHub account")
      .setDesc(
        signedIn
          ? `Signed in${login ? ` as ${login}` : ""} on this device. The sign-in is stored on this device only, never in the vault, so Sync cannot remove it.`
          : "Sign in once per device. GitHub shows a short code to approve in the browser; no token to create or paste.",
      )
      .addButton((button) =>
        button
          .setButtonText(signedIn ? "Sign out" : "Sign in with GitHub")
          .setCta()
          .onClick(async () => {
            if (signedIn) {
              plugin.setSession(null, null);
              this.display();
              return;
            }
            button.setDisabled(true);
            await plugin.signIn(() => this.display());
          }),
      );

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

    bind(
      "OAuth App client ID",
      "Client ID of a GitHub OAuth App with device flow enabled. Not a secret; it identifies the plugin to GitHub.",
      "clientId",
    );
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
