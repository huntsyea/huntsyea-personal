import "server-only";

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
  isValidContentSegment,
  postFrontmatterSchema,
} from "@/lib/content/schema";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

const contentExtensions = new Set([".md", ".mdx"]);
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
      .filter(
        (entry) =>
          entry.isDirectory() && entry.name !== reservedCategoryDirectory,
      )
      .sort((left, right) => left.name.localeCompare(right.name));

    return categoryDirectories.map((entry) => {
      if (!isValidContentSegment(entry.name)) {
        throw new ContentCatalogError(
          `Invalid category directory "${entry.name}" in ${this.contentDirectory}.`,
        );
      }

      const slug = entry.name;
      return {
        slug,
        title: toTitle(slug),
        posts: this.readPosts(slug),
      };
    });
  }

  private readPosts(category: string): readonly ContentPost[] {
    const directory = path.join(this.contentDirectory, category);
    const entries = this.readDirectory(directory, `category "${category}"`);
    const visibleEntries = entries.filter(
      (entry) => !entry.name.startsWith("."),
    );
    const unsupportedEntry = visibleEntries.find((entry) => !entry.isFile());

    if (unsupportedEntry) {
      throw new ContentCatalogError(
        `Unsupported content entry "${path.join(directory, unsupportedEntry.name)}". Posts must be direct .md or .mdx files inside their category.`,
      );
    }

    const posts = visibleEntries.map((entry) =>
      this.readPost(category, directory, entry.name),
    );

    const duplicateSlugs = posts.find(
      (post, index) =>
        posts.findIndex((candidate) => candidate.slug === post.slug) !== index,
    );
    if (duplicateSlugs) {
      throw new ContentCatalogError(
        `Duplicate post slug "${duplicateSlugs.slug}" in category "${category}".`,
      );
    }

    return posts.sort(
      (left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime() ||
        left.slug.localeCompare(right.slug),
    );
  }

  private readPost(
    category: string,
    directory: string,
    filename: string,
  ): ContentPost {
    const extension = path.extname(filename);
    const sourcePath = path.join(directory, filename);

    if (!contentExtensions.has(extension)) {
      throw new ContentCatalogError(
        `Unsupported content file "${sourcePath}". Use .md or .mdx.`,
      );
    }

    const slug = path.basename(filename, extension);
    if (!isValidContentSegment(slug)) {
      throw new ContentCatalogError(
        `Invalid post filename "${sourcePath}". Slugs must use lowercase letters, numbers, and hyphens.`,
      );
    }

    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(fs.readFileSync(sourcePath, "utf8"));
    } catch (error) {
      throw new ContentCatalogError(`Could not parse post "${sourcePath}".`, {
        cause: error,
      });
    }

    const frontmatter = this.parseFrontmatter(sourcePath, parsed.data);
    return {
      ...frontmatter,
      category,
      slug,
      content: parsed.content,
      sourcePath,
      createdAt: new Date(frontmatter.time.created),
      updatedAt: new Date(frontmatter.time.updated),
    };
  }

  private parseFrontmatter(sourcePath: string, data: unknown): PostFrontmatter {
    const result = postFrontmatterSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }

    const reasons = z.prettifyError(result.error).replaceAll("\n", "; ");
    throw new ContentCatalogError(
      `Invalid frontmatter in "${sourcePath}": ${reasons}`,
    );
  }

  private readDirectory(directory: string, description: string): fs.Dirent[] {
    try {
      return fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      throw new ContentCatalogError(
        `Could not read ${description} at "${directory}".`,
        { cause: error },
      );
    }
  }
}

function toTitle(slug: string): string {
  return slug
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
