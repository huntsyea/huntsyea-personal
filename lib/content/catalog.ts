import "server-only";

import type { MarkdownSource } from "@/lib/content/markdown-source";
import type { PostFrontmatter } from "@/lib/content/schema";
import type {
  AdjacentPosts,
  ContentCategory,
  ContentEntry,
  ContentPost,
  ContentPostReference,
  PostLookup,
} from "@/lib/content/types";

import {
  MarkdownSourceError,
  normalizeContentSegment,
  readMarkdownDirectory,
  reportContentWarning,
  titleFromFilename,
} from "@/lib/content/markdown-source";
import { postFrontmatterSchema } from "@/lib/content/schema";

import fs from "node:fs";
import path from "node:path";

const reservedCategoryDirectory = "favorites";

export class ContentCatalogError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ContentCatalogError";
  }
}

type LoadedCatalog = {
  categories: readonly ContentCategory[];
  postsByCategory: ReadonlyMap<string, readonly ContentPost[]>;
  categoriesBySlug: ReadonlyMap<string, ContentCategory>;
};

export class ContentCatalog {
  private loadedCatalog: LoadedCatalog | undefined;

  constructor(
    private readonly contentDirectory = path.join(process.cwd(), "content"),
  ) {}

  listCategories(): readonly ContentCategory[] {
    return this.load().categories;
  }

  listEntries(): readonly ContentEntry[] {
    const { categories } = this.load();

    return categories.flatMap((category) => [
      { kind: "category" as const, category },
      ...category.posts.map((post) => ({ kind: "post" as const, post })),
    ]);
  }

  listPosts(): readonly ContentPost[] {
    return this.load().categories.flatMap((category) => category.posts);
  }

  getCategory(category: string): ContentCategory | undefined {
    return this.load().categoriesBySlug.get(category);
  }

  getPost(category: string, slug: string): PostLookup {
    const posts = this.load().postsByCategory.get(category);
    if (!posts) {
      return { kind: "unknown-category", category };
    }

    const post = posts.find((candidate) => candidate.slug === slug);
    return post
      ? { kind: "found", post }
      : { kind: "unknown-post", category, slug };
  }

  getAdjacent(category: string, slug: string): AdjacentPosts | undefined {
    const posts = this.load().postsByCategory.get(category);
    const currentIndex = posts?.findIndex((post) => post.slug === slug) ?? -1;

    if (!posts || currentIndex === -1) {
      return undefined;
    }

    return {
      previous: toPostReference(posts[currentIndex + 1]),
      next: toPostReference(posts[currentIndex - 1]),
    };
  }

  private load(): LoadedCatalog {
    if (this.loadedCatalog) {
      return this.loadedCatalog;
    }

    const categories = this.readCategories();
    const postsByCategory = new Map(
      categories.map((category) => [category.slug, category.posts]),
    );
    const categoriesBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );

    this.loadedCatalog = { categories, postsByCategory, categoriesBySlug };
    return this.loadedCatalog;
  }

  private readCategories(): readonly ContentCategory[] {
    const entries = this.readDirectory(this.contentDirectory, "content root");
    const categoryDirectories = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => ({
        name: entry.name,
        slug: normalizeContentSegment(entry.name),
      }))
      .filter((entry) => entry.slug !== reservedCategoryDirectory)
      .sort((left, right) => left.slug.localeCompare(right.slug));

    const emptyCategory = categoryDirectories.find((entry) => !entry.slug);
    if (emptyCategory) {
      throw new ContentCatalogError(
        `Could not derive a safe route segment from "content/${emptyCategory.name}".`,
      );
    }

    const duplicateCategory = findDuplicate(categoryDirectories);
    if (duplicateCategory) {
      throw new ContentCatalogError(
        `Category route collision at "/${duplicateCategory.slug}" between "content/${duplicateCategory.first.name}" and "content/${duplicateCategory.second.name}".`,
      );
    }

    return categoryDirectories.map(({ name, slug }) =>
      this.readCategory(slug, name),
    );
  }

  private readCategory(
    category: string,
    directoryName: string,
  ): ContentCategory {
    const directory = path.join(this.contentDirectory, directoryName);
    let sources: readonly MarkdownSource[];
    try {
      sources = readMarkdownDirectory({
        contentRoot: this.contentDirectory,
        directory,
      });
    } catch (error) {
      if (error instanceof MarkdownSourceError) {
        throw new ContentCatalogError(error.message, { cause: error });
      }
      throw error;
    }

    // A note named `index` is the Category intro, not a Post. It is exposed on
    // the Category and excluded from Posts, ordering, adjacency, entries,
    // sitemap, and static params.
    const introSources = sources.filter((source) => source.slug === "index");
    const postSources = sources.filter((source) => source.slug !== "index");

    if (introSources.length > 1) {
      throw new ContentCatalogError(
        `Intro route collision in "content/${directoryName}" between "${introSources[0].sourcePath}" and "${introSources[1].sourcePath}".`,
      );
    }

    const duplicateSource = findDuplicate(postSources);
    if (duplicateSource) {
      throw new ContentCatalogError(
        `Post route collision at "/${category}/${duplicateSource.slug}" between "${duplicateSource.first.sourcePath}" and "${duplicateSource.second.sourcePath}".`,
      );
    }

    const posts = postSources
      .map((source) => this.readPost(category, source))
      .sort(comparePosts);
    const intro = introSources[0]?.content.trim() || undefined;

    return {
      slug: category,
      title: titleFromFilename(directoryName),
      intro,
      introSourcePath: introSources[0]?.sourcePath,
      posts,
    };
  }

  private readPost(category: string, source: MarkdownSource): ContentPost {
    const frontmatter = this.parseFrontmatter(source);
    const createdAt = parseOptionalDate(
      source.sourcePath,
      "time.created",
      frontmatter.time?.created,
    );
    let updatedAt = parseOptionalDate(
      source.sourcePath,
      "time.updated",
      frontmatter.time?.updated,
    );

    if (createdAt && (!updatedAt || updatedAt < createdAt)) {
      if (updatedAt) {
        reportContentWarning(
          source.sourcePath,
          "time.updated was earlier than time.created and was replaced with the creation date.",
        );
      }
      updatedAt = createdAt;
    }

    const time =
      createdAt || updatedAt
        ? {
            created: createdAt?.toISOString(),
            updated: updatedAt?.toISOString(),
          }
        : undefined;

    return {
      ...frontmatter,
      title: frontmatter.title ?? source.title,
      time,
      category,
      slug: source.slug,
      content: source.content,
      sourcePath: source.sourcePath,
      createdAt,
      updatedAt,
    };
  }

  private parseFrontmatter(source: MarkdownSource): PostFrontmatter {
    const result = postFrontmatterSchema.safeParse(source.frontmatter);
    if (result.success) {
      return result.data;
    }

    throw new ContentCatalogError(
      `Invalid frontmatter in "${source.sourcePath}".`,
      { cause: result.error },
    );
  }

  private readDirectory(directory: string, description: string): fs.Dirent[] {
    try {
      return fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      throw new ContentCatalogError(`Could not read ${description}.`, {
        cause: error,
      });
    }
  }
}

function comparePosts(left: ContentPost, right: ContentPost): number {
  if (left.createdAt && right.createdAt) {
    return (
      right.createdAt.getTime() - left.createdAt.getTime() ||
      left.slug.localeCompare(right.slug)
    );
  }
  if (left.createdAt) return -1;
  if (right.createdAt) return 1;
  return left.slug.localeCompare(right.slug);
}

function parseOptionalDate(
  sourcePath: string,
  field: string,
  value: unknown,
): Date | undefined {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return undefined;
  }

  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : undefined;
  if (!date || !Number.isFinite(date.getTime())) {
    reportContentWarning(sourcePath, `${field} is invalid and was ignored.`);
    return undefined;
  }
  return date;
}

function findDuplicate<T extends { slug: string }>(
  entries: readonly T[],
): { slug: string; first: T; second: T } | undefined {
  const seen = new Map<string, T>();
  for (const entry of entries) {
    const first = seen.get(entry.slug);
    if (first) return { slug: entry.slug, first, second: entry };
    seen.set(entry.slug, entry);
  }
  return undefined;
}

function toPostReference(
  post: ContentPost | undefined,
): ContentPostReference | undefined {
  return post ? { slug: post.slug, title: post.title } : undefined;
}

export const contentCatalog = new ContentCatalog();

export function createContentCatalog({
  contentRoot,
}: {
  contentRoot: string;
}): ContentCatalog {
  return new ContentCatalog(contentRoot);
}
