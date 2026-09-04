import "server-only";

import type { ContentPost } from "@/lib/content";
import type { HeadingOutlineItem } from "@/lib/content/types";

import { mdxComponents } from "@/mdx-components";

import { compileMDX } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export type RenderedPost = {
  content: React.ReactNode;
  outline: readonly HeadingOutlineItem[];
};

export class ContentRenderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ContentRenderError";
  }
}

type HeadingElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children?: readonly HeadingNode[];
};

type HeadingNode = {
  value?: string;
  children?: readonly HeadingNode[];
};

export async function renderMarkdown(source: string): Promise<React.ReactNode> {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      blockJS: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return content;
}

/**
 * Renders a Category intro. Like a Post, an intro must not supply a page-level
 * h1, because the Category page already owns one.
 */
export async function renderCategoryIntro(
  source: string,
  sourcePath: string,
): Promise<React.ReactNode> {
  try {
    const { content } = await compileMDX({
      source,
      components: mdxComponents,
      options: {
        parseFrontmatter: false,
        blockJS: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm, validatePostSource(sourcePath)],
        },
      },
    });

    return content;
  } catch (error) {
    if (error instanceof ContentRenderError) {
      throw error;
    }

    throw new ContentRenderError(
      `Could not render category intro "${sourcePath}".`,
      { cause: error },
    );
  }
}

export async function renderPost(post: ContentPost): Promise<RenderedPost> {
  const outline: HeadingOutlineItem[] = [];
  try {
    const { content } = await compileMDX({
      source: post.content,
      components: mdxComponents,
      options: {
        parseFrontmatter: false,
        blockJS: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm, validatePostSource(post.sourcePath)],
          rehypePlugins: [
            rehypeSlug,
            collectHeadingOutline(outline),
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark-high-contrast",
                  light: "github-light-high-contrast",
                },
                keepBackground: false,
                defaultLang: "tsx",
              },
            ],
          ],
        },
      },
    });

    return { content, outline };
  } catch (error) {
    if (error instanceof ContentRenderError) {
      throw error;
    }

    throw new ContentRenderError(
      `Could not render post "${post.sourcePath}".`,
      { cause: error },
    );
  }
}

function validatePostSource(sourcePath: string) {
  return () => (tree: unknown) => {
    visit(tree as never, (node) => {
      const value = node as { type?: string; depth?: number; name?: string };

      if (value.type === "heading" && value.depth === 1) {
        throw new ContentRenderError(
          `Post "${sourcePath}" contains an h1. Post titles supply the only page-level heading.`,
        );
      }

      if (
        (value.type === "mdxJsxFlowElement" ||
          value.type === "mdxJsxTextElement") &&
        value.name === "h1"
      ) {
        throw new ContentRenderError(
          `Post "${sourcePath}" contains an h1. Post titles supply the only page-level heading.`,
        );
      }
    });
  };
}

function collectHeadingOutline(outline: HeadingOutlineItem[]) {
  return () => (tree: unknown) => {
    visit(tree as never, "element", (node) => {
      const element = node as HeadingElement;
      const level = Number(element.tagName.slice(1));
      const id = element.properties?.id;

      if (
        !/^h[2-6]$/.test(element.tagName) ||
        typeof id !== "string" ||
        id === "footnote-label"
      ) {
        return;
      }

      outline.push({
        id,
        text: textContent(element).trim(),
        level: level as HeadingOutlineItem["level"],
      });
    });
  };
}

function textContent(node: HeadingNode): string {
  return [node.value ?? "", ...(node.children?.map(textContent) ?? [])].join(
    "",
  );
}
