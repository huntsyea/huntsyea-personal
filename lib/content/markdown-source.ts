import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const markdownExtensions = new Set([".md", ".mdx"]);

export type MarkdownSource = {
  filename: string;
  sourcePath: string;
  slug: string;
  title: string;
  frontmatter: unknown;
  content: string;
};

export class MarkdownSourceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MarkdownSourceError";
  }
}

export function readMarkdownDirectory({
  contentRoot,
  directory,
  warnOnDirectories = true,
}: {
  contentRoot: string;
  directory: string;
  warnOnDirectories?: boolean;
}): readonly MarkdownSource[] {
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingPath(error)) {
      return [];
    }

    throw new MarkdownSourceError(
      `Could not read content directory "${toSourcePath(contentRoot, directory)}".`,
      { cause: error },
    );
  }

  const sources: MarkdownSource[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const sourcePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (warnOnDirectories) {
        reportContentWarning(
          toSourcePath(contentRoot, sourcePath),
          "Nested content folders are not published as routes and were ignored.",
        );
      }
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!entry.isFile() || !markdownExtensions.has(extension)) {
      continue;
    }

    sources.push(readMarkdownSource({ contentRoot, sourcePath }));
  }

  return sources;
}

export function normalizeContentSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleFromFilename(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function reportContentWarning(sourcePath: string, message: string) {
  console.warn(`[content] ${sourcePath}: ${message}`);
}

function readMarkdownSource({
  contentRoot,
  sourcePath,
}: {
  contentRoot: string;
  sourcePath: string;
}): MarkdownSource {
  const relativeSourcePath = toSourcePath(contentRoot, sourcePath);
  const extension = path.extname(sourcePath);
  const basename = path.basename(sourcePath, extension);
  const slug = normalizeContentSegment(basename);

  if (!slug) {
    throw new MarkdownSourceError(
      `Could not derive a safe route segment from "${relativeSourcePath}".`,
    );
  }

  let raw: string;
  try {
    raw = fs.readFileSync(sourcePath, "utf8");
  } catch (error) {
    throw new MarkdownSourceError(
      `Could not read Markdown source "${relativeSourcePath}".`,
      { cause: error },
    );
  }

  try {
    const parsed = matter(raw);
    return {
      filename: path.basename(sourcePath),
      sourcePath: relativeSourcePath,
      slug,
      title: titleFromFilename(basename),
      frontmatter: parsed.data,
      content: parsed.content,
    };
  } catch (error) {
    throw new MarkdownSourceError(
      `Could not parse Markdown source "${relativeSourcePath}".`,
      { cause: error },
    );
  }
}

function toSourcePath(contentRoot: string, sourcePath: string): string {
  const relativePath = path.relative(contentRoot, sourcePath);
  return path.posix.join("content", ...relativePath.split(path.sep));
}

function isMissingPath(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
