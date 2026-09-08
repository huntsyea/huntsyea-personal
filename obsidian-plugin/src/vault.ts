import type { App, TFile } from "obsidian";

import type { VaultNote, VaultSnapshot } from "./contract";

import { parseYaml } from "obsidian";

import { isNotePath } from "./contract";

/** Reads every file in the vault into the plain snapshot the contract uses. */
export async function readVaultSnapshot(app: App): Promise<VaultSnapshot> {
  const notes: VaultNote[] = [];
  const assetPaths: string[] = [];

  for (const file of app.vault.getFiles()) {
    if (file.path.startsWith(".")) continue;

    if (!isNotePath(file.path)) {
      assetPaths.push(file.path);
      continue;
    }

    const text = await app.vault.cachedRead(file);
    notes.push({ path: file.path, text, ...parseFrontmatter(text) });
  }

  return { notes, assetPaths };
}

export function readAssetFactory(app: App) {
  return async (vaultPath: string): Promise<Uint8Array> => {
    const file = app.vault.getFileByPath(vaultPath);
    if (!file) {
      throw new Error(`Asset "${vaultPath}" was not found in the vault.`);
    }
    return new Uint8Array(await app.vault.readBinary(file as TFile));
  };
}

const frontmatterBlock = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export function parseFrontmatter(text: string): {
  frontmatter: unknown;
  frontmatterError?: string;
} {
  const match = frontmatterBlock.exec(text);
  if (!match) return { frontmatter: undefined };

  try {
    const parsed: unknown = parseYaml(match[1]);
    return { frontmatter: parsed ?? {} };
  } catch (error) {
    return {
      frontmatter: undefined,
      frontmatterError: `Could not parse frontmatter: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
