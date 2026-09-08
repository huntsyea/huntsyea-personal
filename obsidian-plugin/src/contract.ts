import { z } from "zod";

import { postFrontmatterSchema } from "../../lib/content/schema";

/**
 * The publishing contract between the Obsidian vault and the repository.
 *
 * This module is pure so it can be unit-tested outside Obsidian. It mirrors
 * the rules the site's content readers enforce (see lib/content, lib/home,
 * lib/favorites) so problems surface in the preview instead of as a red PR:
 *
 * - `home.md` at the vault root is the homepage intro.
 * - Every other top-level folder is a Category; `favorites` is the reserved
 *   Favorites folder. A note named `index` inside a Category is its intro.
 * - Notes nest one level deep. Deeper notes are ignored by the site.
 * - `<folder>/assets/<file>` delivers to `public/assets/<folder>/<file>` when a
 *   shared note references `/assets/<folder>/<file>`.
 */

export type VaultNote = {
  /** Vault-relative path, e.g. `posts/pi-fusion.md`. */
  path: string;
  /** The full file text, published verbatim. */
  text: string;
  /** Parsed frontmatter, or undefined when the note has none. */
  frontmatter: unknown;
  /** Set when the frontmatter block exists but could not be parsed. */
  frontmatterError?: string;
};

export type VaultSnapshot = {
  notes: readonly VaultNote[];
  /** Vault-relative paths of every non-note file, e.g. `posts/assets/x.svg`. */
  assetPaths: readonly string[];
};

export type ContractSettings = {
  shareKey: string;
  excludedFolders: readonly string[];
  contentRoot: string;
  assetsRoot: string;
};

export const defaultContractSettings: ContractSettings = {
  shareKey: "share",
  excludedFolders: ["Templates"],
  contentRoot: "content",
  assetsRoot: "public/assets",
};

export type PublishFile = {
  repoPath: string;
  vaultPath: string;
  kind: "note" | "asset";
};

export type Issue = {
  level: "error" | "warning";
  path: string;
  message: string;
};

export type PublishPlan = {
  /** Every file that belongs in the repository, sorted by repository path. */
  files: readonly PublishFile[];
  issues: readonly Issue[];
};

/** Manifest recorded in the repository so unsharing and deletion are exact. */
export type Manifest = {
  version: 1;
  /** Repository path to the vault path it was published from. */
  files: Record<string, string>;
};

export const manifestFileName = ".publish-manifest.json";

const noteExtensions = new Set(["md", "mdx"]);
const reservedFavorites = "favorites";
const assetReference = /\/assets\/[^)"'\s?#]+/g;

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().optional(),
);

const homeFrontmatterSchema = z.object({
  title: optionalText,
  tagline: optionalText,
});

const favoriteFrontmatterSchema = z.object({
  title: optionalText,
  href: z.unknown().optional(),
  note: optionalText,
  group: optionalText,
});

/** Same normalisation the site applies to folder and file names. */
export function normalizeSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isNotePath(path: string): boolean {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return noteExtensions.has(extension);
}

export function isShared(note: VaultNote, shareKey: string): boolean {
  return (
    typeof note.frontmatter === "object" &&
    note.frontmatter !== null &&
    (note.frontmatter as Record<string, unknown>)[shareKey] === true
  );
}

/**
 * Builds the set of repository files the vault currently publishes, plus every
 * problem the site would report. Errors block publishing; warnings do not.
 */
export function planPublish(
  snapshot: VaultSnapshot,
  settings: ContractSettings = defaultContractSettings,
): PublishPlan {
  const issues: Issue[] = [];
  const files = new Map<string, PublishFile>();
  const assetSet = new Set(snapshot.assetPaths);

  const shared = snapshot.notes.filter((note) =>
    isShared(note, settings.shareKey),
  );

  const categories = new Map<string, { folder: string; notes: VaultNote[] }>();
  let home: VaultNote | undefined;

  for (const note of shared) {
    const segments = note.path.split("/");
    const [first] = segments;

    if (settings.excludedFolders.includes(first)) continue;

    if (segments.length === 1) {
      if (normalizeSegment(stripExtension(first)) === "home") {
        if (home) {
          issues.push(
            error(note.path, `Home source collision with "${home.path}".`),
          );
          continue;
        }
        home = note;
        continue;
      }
      issues.push(
        warning(
          note.path,
          "Root notes other than home are not part of the site and were ignored.",
        ),
      );
      continue;
    }

    if (segments.length > 2) {
      issues.push(
        warning(
          note.path,
          "Nested content folders are not published as routes and were ignored.",
        ),
      );
      continue;
    }

    const category = categories.get(first) ?? { folder: first, notes: [] };
    category.notes.push(note);
    categories.set(first, category);
  }

  if (home) {
    if (home.frontmatterError) {
      issues.push(error(home.path, home.frontmatterError));
    } else if (!homeFrontmatterSchema.safeParse(home.frontmatter).success) {
      issues.push(error(home.path, "Invalid Home frontmatter."));
    }
    addFile(files, issues, {
      repoPath: `${settings.contentRoot}/${home.path}`,
      vaultPath: home.path,
      kind: "note",
    });
    collectAssets(home, assetSet, settings, files, issues);
  }

  // Category folders must normalise to distinct, non-empty route segments.
  const slugs = new Map<string, string>();
  for (const { folder } of categories.values()) {
    const slug = normalizeSegment(folder);
    if (!slug) {
      issues.push(
        error(
          folder,
          `Could not derive a safe route segment from "${settings.contentRoot}/${folder}".`,
        ),
      );
      continue;
    }
    const existing = slugs.get(slug);
    if (existing) {
      issues.push(
        error(
          folder,
          `Category route collision at "/${slug}" between "${settings.contentRoot}/${existing}" and "${settings.contentRoot}/${folder}".`,
        ),
      );
    } else {
      slugs.set(slug, folder);
    }
  }

  for (const { folder, notes } of categories.values()) {
    const slug = normalizeSegment(folder);
    const isFavorites = slug === reservedFavorites;
    const seen = new Map<string, VaultNote>();
    let intro: VaultNote | undefined;

    for (const note of notes.sort((left, right) =>
      left.path.localeCompare(right.path),
    )) {
      const basename = stripExtension(note.path.split("/")[1]);
      const noteSlug = normalizeSegment(basename);

      if (!noteSlug) {
        issues.push(
          error(
            note.path,
            `Could not derive a safe route segment from "${note.path}".`,
          ),
        );
        continue;
      }

      if (note.frontmatterError) {
        issues.push(error(note.path, note.frontmatterError));
      } else if (isFavorites) {
        validateFavorite(note, issues);
      } else if (noteSlug !== "index") {
        validatePost(note, issues);
      }

      if (!isFavorites && noteSlug === "index") {
        if (intro) {
          issues.push(
            error(
              note.path,
              `Intro route collision in "${settings.contentRoot}/${folder}" between "${intro.path}" and "${note.path}".`,
            ),
          );
          continue;
        }
        intro = note;
      } else {
        const duplicate = seen.get(noteSlug);
        if (duplicate) {
          issues.push(
            error(
              note.path,
              `Post route collision at "/${slug}/${noteSlug}" between "${duplicate.path}" and "${note.path}".`,
            ),
          );
          continue;
        }
        seen.set(noteSlug, note);
      }

      addFile(files, issues, {
        repoPath: `${settings.contentRoot}/${note.path}`,
        vaultPath: note.path,
        kind: "note",
      });
      collectAssets(note, assetSet, settings, files, issues);
    }
  }

  return {
    files: [...files.values()].sort((left, right) =>
      left.repoPath.localeCompare(right.repoPath),
    ),
    issues: issues.sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.message.localeCompare(right.message),
    ),
  };
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.level === "error");
}

export function buildManifest(plan: PublishPlan): Manifest {
  const files: Record<string, string> = {};
  for (const file of plan.files) {
    files[file.repoPath] = file.vaultPath;
  }
  return { version: 1, files };
}

/** Formats a manifest the way Prettier would, so CI's format check stays green. */
export function serializeManifest(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function parseManifest(text: string | undefined): Manifest {
  if (!text) return { version: 1, files: {} };
  try {
    const parsed = JSON.parse(text) as Partial<Manifest>;
    if (parsed && typeof parsed.files === "object" && parsed.files) {
      return { version: 1, files: { ...parsed.files } };
    }
  } catch {
    // A corrupt manifest is treated as empty; the next publish rewrites it.
  }
  return { version: 1, files: {} };
}

function collectAssets(
  note: VaultNote,
  assetSet: ReadonlySet<string>,
  settings: ContractSettings,
  files: Map<string, PublishFile>,
  issues: Issue[],
) {
  const references = new Set(note.text.match(assetReference) ?? []);
  for (const reference of references) {
    const rest = reference.slice("/assets/".length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      issues.push(
        error(
          note.path,
          `Asset reference "${reference}" must be "/assets/<folder>/<file>".`,
        ),
      );
      continue;
    }
    const folder = rest.slice(0, slash);
    const file = rest.slice(slash + 1);
    const vaultPath = `${folder}/assets/${file}`;

    if (!assetSet.has(vaultPath)) {
      issues.push(
        error(
          note.path,
          `Asset "${reference}" was not found at "${vaultPath}" in the vault.`,
        ),
      );
      continue;
    }

    addFile(files, issues, {
      repoPath: `${settings.assetsRoot}/${rest}`,
      vaultPath,
      kind: "asset",
    });
  }
}

function addFile(
  files: Map<string, PublishFile>,
  issues: Issue[],
  file: PublishFile,
) {
  const existing = files.get(file.repoPath);
  if (existing && existing.vaultPath !== file.vaultPath) {
    issues.push(
      error(
        file.vaultPath,
        `"${file.repoPath}" is also published from "${existing.vaultPath}".`,
      ),
    );
    return;
  }
  files.set(file.repoPath, file);
}

function validatePost(note: VaultNote, issues: Issue[]) {
  const result = postFrontmatterSchema.safeParse(note.frontmatter ?? {});
  if (!result.success) {
    issues.push(error(note.path, "Invalid frontmatter."));
    return;
  }
  const time = result.data.time;
  for (const field of ["created", "updated"] as const) {
    const value = time?.[field];
    if (value === undefined || value === null || value === "") continue;
    const date =
      value instanceof Date
        ? value
        : typeof value === "string"
          ? new Date(value)
          : undefined;
    if (!date || !Number.isFinite(date.getTime())) {
      issues.push(
        warning(note.path, `time.${field} is invalid and will be ignored.`),
      );
    }
  }
}

function validateFavorite(note: VaultNote, issues: Issue[]) {
  const result = favoriteFrontmatterSchema.safeParse(note.frontmatter ?? {});
  if (!result.success) {
    issues.push(error(note.path, "Invalid Favorite frontmatter."));
    return;
  }
  const href = result.data.href;
  let valid = false;
  if (typeof href === "string" && href.trim()) {
    try {
      const url = new URL(href.trim());
      valid = url.protocol === "http:" || url.protocol === "https:";
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    issues.push(
      warning(
        note.path,
        "Favorite destination must be an absolute HTTP(S) URL; the site will omit this item.",
      ),
    );
  }
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function error(path: string, message: string): Issue {
  return { level: "error", path, message };
}

function warning(path: string, message: string): Issue {
  return { level: "warning", path, message };
}
