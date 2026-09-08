import "server-only";

import type { MarkdownSource } from "@/lib/content/markdown-source";

import {
  normalizeContentSegment,
  readMarkdownDirectory,
  reportContentWarning,
} from "@/lib/content/markdown-source";
import { siteProfile } from "@/lib/site/profile";

import path from "node:path";

import { z } from "zod";

export type Favorite = {
  title: string;
  href: string;
  note: string;
};

export type FavoriteGroup = {
  title: string;
  items: readonly Favorite[];
};

export type FavoritesIndex = {
  groups: readonly FavoriteGroup[];
  /** Markdown body of `favorites/index.md`, rendered above the groups. */
  intro: string | undefined;
  introSourcePath: string | undefined;
};

export const favoritesDescription = `External articles and resources ${siteProfile.authorName} keeps coming back to.`;

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().optional(),
);

const favoriteFrontmatterSchema = z.object({
  title: optionalText,
  href: z.unknown().optional(),
  note: optionalText,
  group: optionalText,
});

const favoritesIndexSchema = z.object({
  groups: z.array(z.string().trim().min(1)).optional().catch(undefined),
});

const defaultFavoritesDirectory = path.join(
  process.cwd(),
  "content",
  "favorites",
);

/**
 * Favorites are flat notes grouped by their `group` frontmatter key; a new
 * group is simply a new value. `favorites/index.md` is never an item: its
 * `groups` frontmatter list orders the groups (unlisted ones follow
 * alphabetically) and its body is the intro above them.
 */
export function readFavoritesIndex(
  favoritesDirectory = defaultFavoritesDirectory,
): FavoritesIndex {
  const contentRoot =
    path.basename(favoritesDirectory) === "favorites"
      ? path.dirname(favoritesDirectory)
      : favoritesDirectory;
  const sources = readMarkdownDirectory({
    contentRoot,
    directory: favoritesDirectory,
  });
  const groups = new Map<string, Favorite[]>();
  const indexSource = sources.find((source) => source.slug === "index");

  for (const source of sources) {
    if (source === indexSource) continue;
    const result = favoriteFrontmatterSchema.safeParse(source.frontmatter);
    if (!result.success) {
      throw new Error(
        `Invalid Favorite frontmatter in "${source.sourcePath}".`,
        { cause: result.error },
      );
    }
    const data = result.data;
    const href = readHttpUrl(data.href);
    if (!href) {
      reportContentWarning(
        source.sourcePath,
        "Favorite destination must be an absolute HTTP(S) URL; the item was omitted.",
      );
      continue;
    }

    const group = data.group ?? "Other";
    const items = groups.get(group) ?? [];
    items.push({
      title: data.title ?? source.title,
      href,
      note: data.note ?? "",
    });
    groups.set(group, items);
  }

  const order = readGroupOrder(indexSource);

  return {
    groups: [...groups.keys()]
      .sort(compareGroupTitles(order))
      .map((title) => ({ title, items: groups.get(title) ?? [] })),
    intro: indexSource?.content.trim() || undefined,
    introSourcePath: indexSource?.sourcePath,
  };
}

export function readFavoriteGroups(
  favoritesDirectory = defaultFavoritesDirectory,
): readonly FavoriteGroup[] {
  return readFavoritesIndex(favoritesDirectory).groups;
}

export const favoritesIndex = readFavoritesIndex();

export const favoriteGroups = favoritesIndex.groups;

export const favorites: readonly Favorite[] = favoriteGroups.flatMap(
  (group) => group.items,
);

function readGroupOrder(indexSource: MarkdownSource | undefined): string[] {
  if (!indexSource) return [];
  const result = favoritesIndexSchema.safeParse(indexSource.frontmatter);
  if (!result.success) {
    throw new Error(
      `Invalid Favorites index frontmatter in "${indexSource.sourcePath}".`,
      { cause: result.error },
    );
  }
  return (result.data.groups ?? []).map(normalizeContentSegment);
}

function compareGroupTitles(order: readonly string[]) {
  const rank = (title: string) => {
    const index = order.indexOf(normalizeContentSegment(title));
    return index === -1 ? order.length : index;
  };
  return (left: string, right: string) =>
    rank(left) - rank(right) || left.localeCompare(right);
}

function readHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    return value.trim();
  } catch {
    return undefined;
  }
}
