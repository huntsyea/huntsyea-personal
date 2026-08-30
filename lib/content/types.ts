import type { PostFrontmatter } from "@/lib/content/schema";

export type ContentPost = Omit<PostFrontmatter, "time" | "title"> & {
  title: string;
  time:
    | {
        created: string | undefined;
        updated: string | undefined;
      }
    | undefined;
  category: string;
  slug: string;
  content: string;
  sourcePath: string;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
};

export type ContentCategory = {
  slug: string;
  title: string;
  posts: readonly ContentPost[];
};

export type ContentPostReference = Readonly<{
  slug: string;
  title: string;
}>;

export type AdjacentPosts = {
  previous: ContentPostReference | undefined;
  next: ContentPostReference | undefined;
};

export type PostLookup =
  | { kind: "found"; post: ContentPost }
  | { kind: "unknown-category"; category: string }
  | { kind: "unknown-post"; category: string; slug: string };

export type ContentEntry =
  | {
      kind: "category";
      category: ContentCategory;
    }
  | {
      kind: "post";
      post: ContentPost;
    };

export type HeadingOutlineItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4 | 5 | 6;
};
