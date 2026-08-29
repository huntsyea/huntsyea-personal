import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

export type HomeIntro = {
  title: string | undefined;
  tagline: string | undefined;
  body: string;
};

const homeIntroSchema = z.object({
  title: z.string().trim().min(1).optional(),
  tagline: z.string().trim().min(1).optional(),
});

const defaultContentRoot = path.join(process.cwd(), "content");

export function readHomeIntro(
  contentRoot = defaultContentRoot,
): HomeIntro | undefined {
  const sourcePath = path.join(contentRoot, "home.md");

  let raw: string;
  try {
    raw = fs.readFileSync(sourcePath, "utf8");
  } catch (error) {
    if (isMissingPath(error)) {
      return undefined;
    }

    throw error;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch {
    return undefined;
  }

  const result = homeIntroSchema.safeParse(parsed.data);
  if (!result.success) {
    return {
      title: undefined,
      tagline: undefined,
      body: parsed.content.trim(),
    };
  }

  return {
    title: result.data.title,
    tagline: result.data.tagline,
    body: parsed.content.trim(),
  };
}

function isMissingPath(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
