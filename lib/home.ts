import "server-only";

import { readMarkdownDirectory } from "@/lib/content/markdown-source";

import path from "node:path";

import { z } from "zod";

export type HomeIntro = {
  title: string | undefined;
  tagline: string | undefined;
  body: string;
};

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().optional(),
);

const homeIntroSchema = z.object({
  title: optionalText,
  tagline: optionalText,
});

const defaultContentRoot = path.join(process.cwd(), "content");

export function readHomeIntro(
  contentRoot = defaultContentRoot,
): HomeIntro | undefined {
  const homeSources = readMarkdownDirectory({
    contentRoot,
    directory: contentRoot,
    warnOnDirectories: false,
  }).filter((source) => source.slug === "home");

  if (homeSources.length === 0) {
    return undefined;
  }
  if (homeSources.length > 1) {
    throw new Error(
      `Home source collision between ${homeSources.map((source) => `"${source.sourcePath}"`).join(" and ")}.`,
    );
  }

  const source = homeSources[0];
  const result = homeIntroSchema.safeParse(source.frontmatter);
  if (!result.success) {
    throw new Error(`Invalid Home frontmatter in "${source.sourcePath}".`, {
      cause: result.error,
    });
  }

  return {
    title: result.data.title,
    tagline: result.data.tagline,
    body: source.content.trim(),
  };
}
