import "server-only";

import {
  readMarkdownDirectory,
  reportContentWarning,
} from "@/lib/content/markdown-source";

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

export const favoritesDescription =
  "External articles and resources Hunter keeps coming back to.";

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

const preferredGroupOrder = ["Articles", "Resources"];

const defaultFavoritesDirectory = path.join(
  process.cwd(),
  "content",
  "favorites",
);

export function readFavoriteGroups(
  favoritesDirectory = defaultFavoritesDirectory,
): readonly FavoriteGroup[] {
  const contentRoot =
    path.basename(favoritesDirectory) === "favorites"
      ? path.dirname(favoritesDirectory)
      : favoritesDirectory;
  const sources = readMarkdownDirectory({
    contentRoot,
    directory: favoritesDirectory,
  });
  const groups = new Map<string, Favorite[]>();

  for (const source of sources) {
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

  return [...groups.keys()].sort(compareGroupTitles).map((title) => ({
    title,
    items: groups.get(title) ?? [],
  }));
}

export const favoriteGroups = readFavoriteGroups();

export const favorites: readonly Favorite[] = favoriteGroups.flatMap(
  (group) => group.items,
);

function compareGroupTitles(left: string, right: string): number {
  const leftRank = preferredGroupOrder.indexOf(left);
  const rightRank = preferredGroupOrder.indexOf(right);
  const leftOrder = leftRank === -1 ? preferredGroupOrder.length : leftRank;
  const rightOrder = rightRank === -1 ? preferredGroupOrder.length : rightRank;

  return leftOrder - rightOrder || left.localeCompare(right);
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
