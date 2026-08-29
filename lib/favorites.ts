import "server-only";

import { isValidContentSegment } from "@/lib/content/schema";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
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

const favoriteFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  href: z.url(),
  note: z.string().trim().min(1),
  group: z.string().trim().min(1),
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
  const files = listFavoriteFiles(favoritesDirectory);
  const groups = new Map<string, Favorite[]>();

  for (const filename of files) {
    const favorite = readFavorite(favoritesDirectory, filename);
    const items = groups.get(favorite.group) ?? [];
    items.push({
      title: favorite.title,
      href: favorite.href,
      note: favorite.note,
    });
    groups.set(favorite.group, items);
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

function listFavoriteFiles(favoritesDirectory: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(favoritesDirectory, { withFileTypes: true });
  } catch (error) {
    if (isMissingPath(error)) {
      return [];
    }

    throw error;
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith(".") &&
        path.extname(entry.name) === ".md",
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function readFavorite(
  favoritesDirectory: string,
  filename: string,
): Favorite & { group: string } {
  const sourcePath = path.join(favoritesDirectory, filename);
  const slug = path.basename(filename, ".md");

  if (!isValidContentSegment(slug)) {
    throw new Error(
      `Invalid favorite filename "${sourcePath}". Slugs must use lowercase letters, numbers, and hyphens.`,
    );
  }

  const parsed = matter(fs.readFileSync(sourcePath, "utf8"));
  const result = favoriteFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const reasons = z.prettifyError(result.error).replaceAll("\n", "; ");
    throw new Error(
      `Invalid favorite frontmatter in "${sourcePath}": ${reasons}`,
    );
  }

  return result.data;
}

function compareGroupTitles(left: string, right: string): number {
  const leftRank = preferredGroupOrder.indexOf(left);
  const rightRank = preferredGroupOrder.indexOf(right);
  const leftOrder = leftRank === -1 ? preferredGroupOrder.length : leftRank;
  const rightOrder = rightRank === -1 ? preferredGroupOrder.length : rightRank;

  return leftOrder - rightOrder || left.localeCompare(right);
}

function isMissingPath(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
