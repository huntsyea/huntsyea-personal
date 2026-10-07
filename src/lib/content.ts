import type { PortableTextBlock } from "emdash";

import GithubSlugger from "github-slugger";

/**
 * A Category is a collection of Posts exposed at one route segment. Each is an
 * EmDash collection with the same fields (title, summary, content, revised_at).
 */
export const CATEGORIES = [
  { slug: "posts", title: "Posts" },
  { slug: "projects", title: "Projects" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function getCategory(slug: string | undefined) {
  return CATEGORIES.find((category) => category.slug === slug);
}

/** Page intro slugs editors can create in the "Page intros" collection. */
export type IntroSlug = "home" | CategorySlug | "favorites";

export function formatDate(input: Date): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(input);
}

type Span = { _type?: string; text?: string };
type TextBlock = PortableTextBlock & {
  style?: string;
  children?: Span[];
  code?: string;
};

function blockText(block: TextBlock): string {
  if (block._type === "block") {
    return (block.children ?? []).map((span) => span.text ?? "").join("");
  }
  if (block._type === "code") return block.code ?? "";
  return "";
}

/** Plain text of a Portable Text value, for reading time and descriptions. */
export function portableTextToPlain(value: PortableTextBlock[] | undefined) {
  return (value ?? [])
    .map((block) => blockText(block as TextBlock))
    .filter(Boolean)
    .join("\n\n");
}

/** Minutes to read at 200 words per minute, never less than one. */
export function readingMinutes(value: PortableTextBlock[] | undefined) {
  const words = portableTextToPlain(value).split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length / 200));
}

export type OutlineItem = {
  key: string;
  id: string;
  text: string;
  level: 2 | 3 | 4 | 5 | 6;
};

/**
 * The heading outline of a Post: every h2–h6 block with a GitHub-style
 * anchor id, deduplicated the same way rehype-slug did, so existing
 * `#fragment` links keep working.
 */
export function headingOutline(value: PortableTextBlock[] | undefined) {
  const slugger = new GithubSlugger();
  const outline: OutlineItem[] = [];

  for (const raw of value ?? []) {
    const block = raw as TextBlock;
    const match = /^h([2-6])$/.exec(block.style ?? "");
    if (block._type !== "block" || !match) continue;
    const text = blockText(block).trim();
    if (!text) continue;
    outline.push({
      key: String(block._key),
      id: slugger.slug(text),
      text,
      level: Number(match[1]) as OutlineItem["level"],
    });
  }

  return outline;
}

type Dated = { id: string; data: { publishedAt: Date | null } };

/** Newest first; equal or missing dates fall back to slug order. */
export function comparePosts(left: Dated, right: Dated): number {
  const a = left.data.publishedAt?.getTime();
  const b = right.data.publishedAt?.getTime();
  if (a !== undefined && b !== undefined && a !== b) return b - a;
  if (a !== undefined && b === undefined) return -1;
  if (a === undefined && b !== undefined) return 1;
  return left.id.localeCompare(right.id);
}

const TYPOS: readonly (readonly [string, string])[] = [
  [
    "build product people love and exploring",
    "build products people love and explore",
  ],
  ["countless ours", "countless hours"],
  ["we are create", "we create"],
];

/** Correct known copy typos until the EmDash entries are updated. */
export function fixTypos(text: string): string {
  let next = text;
  for (const [from, to] of TYPOS) {
    if (next.includes(from)) next = next.replaceAll(from, to);
  }
  return next;
}

/**
 * Apply {@link fixTypos} to Portable Text spans. Returns the same value when
 * nothing changes, and keeps EmDash's edit-mode tag on the array.
 */
export function fixPortableTextTypos<T>(value: T): T {
  if (!Array.isArray(value)) return value;
  let changed = false;
  const next = value.map((block) => {
    if (!block || typeof block !== "object" || !("children" in block))
      return block;
    const children = block.children;
    if (!Array.isArray(children)) return block;
    let blockChanged = false;
    const fixedChildren = children.map((child) => {
      if (!child || typeof child !== "object" || !("text" in child))
        return child;
      if (typeof child.text !== "string") return child;
      const fixed = fixTypos(child.text);
      if (fixed === child.text) return child;
      blockChanged = true;
      return { ...child, text: fixed };
    });
    if (!blockChanged) return block;
    changed = true;
    return { ...block, children: fixedChildren };
  });
  if (!changed) return value;
  const edit = Object.getOwnPropertyDescriptor(value, Symbol.for("__emdash"));
  if (edit) Object.defineProperty(next, Symbol.for("__emdash"), edit);
  return next as T;
}

function seoRecord(data: object): { description?: unknown } | undefined {
  if (!("seo" in data)) return undefined;
  const seo = data.seo;
  if (!seo || typeof seo !== "object") return undefined;
  return seo;
}

/** Correct a content entry's SEO description when it still has a known typo. */
export function fixSeoDescription(data: object): void {
  const seo = seoRecord(data);
  if (!seo || typeof seo.description !== "string") return;
  const fixed = fixTypos(seo.description);
  if (fixed !== seo.description) seo.description = fixed;
}

/** Use the visible tagline as the homepage meta description for this request. */
export function setSeoDescription(data: object, description: string): void {
  const seo = seoRecord(data);
  if (!seo || !description) return;
  seo.description = description;
}
