import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalUrl = z.url().optional();

const postTimeSchema = z
  .object({
    created: z.string().datetime({ offset: true }),
    updated: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine(({ created, updated }, context) => {
    if (new Date(updated) < new Date(created)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["updated"],
        message: "must not be earlier than time.created",
      });
    }
  });

export const postFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1).optional(),
    author: z
      .object({
        name: z.string().trim().min(1).optional(),
        link: optionalUrl,
        handle: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),
    time: postTimeSchema,
    media: z
      .object({
        image: z.string().trim().min(1).optional(),
        video: z.string().trim().min(1).optional(),
        audio: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),
    seo: z
      .object({
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().min(1).optional(),
        keywords: z.array(z.string().trim().min(1)).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export function isValidContentSegment(value: string): boolean {
  return slugPattern.test(value);
}
