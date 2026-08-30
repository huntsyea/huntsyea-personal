import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.url().optional(),
);

const postTimeSchema = z.object({
  created: z.unknown().optional(),
  updated: z.unknown().optional(),
});

export const postFrontmatterSchema = z.object({
  title: optionalText,
  summary: optionalText,
  author: z
    .object({ name: optionalText, link: optionalUrl, handle: optionalText })
    .optional()
    .catch(undefined),
  time: postTimeSchema.optional().catch(undefined),
  media: z
    .object({ image: optionalText, video: optionalText, audio: optionalText })
    .optional()
    .catch(undefined),
  seo: z
    .object({
      title: optionalText,
      description: optionalText,
      keywords: z.array(z.string().trim().min(1)).optional().catch(undefined),
    })
    .optional()
    .catch(undefined),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
