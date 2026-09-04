import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components"];
const rootSourceFiles = ["mdx-components.tsx"];
const rawPaletteClass = /\b(?:gray|pink|yellow|teal)-a?[0-9]+\b/;
const arbitraryPixelUtility = /-\[-?[0-9.]+px\]/;
const libraryImport =
  /(?:from\s+["'](?:next\/link|next-view-transitions)["']|import\s+["'](?:next\/link|next-view-transitions)["'])/;

// The Link primitive is the only importer of either link library; the
// providers module legitimately imports the ViewTransitions provider.
const exemptSourceFiles = new Set(
  ["components/link/index.tsx", "components/providers/index.tsx"].map((file) =>
    path.join(process.cwd(), file),
  ),
);

describe("design system guardrail", () => {
  it("blocks raw palette classes anywhere in app or component sources", () => {
    const offenders = findViolators((source) => rawPaletteClass.test(source));

    expect(offenders).toEqual([]);
  });

  it("blocks arbitrary pixel utilities in app or component sources", () => {
    const offenders = findViolators((source) =>
      arbitraryPixelUtility.test(source),
    );

    expect(offenders).toEqual([]);
  });

  it("blocks inline style props outside the Open Graph and icon generators", () => {
    const offenders = findViolators(hasForbiddenInlineStyle, (file) =>
      isGeneratorFile(file),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps any link-library import inside the primitive or providers", () => {
    const offenders = [
      ...new Set(
        [
          ...sourceRoots.flatMap((root) =>
            listSourceFiles(path.join(process.cwd(), root)),
          ),
          ...rootSourceFiles.map((file) => path.join(process.cwd(), file)),
        ]
          .filter((file) => !exemptSourceFiles.has(file))
          .filter((file) => libraryImport.test(fs.readFileSync(file, "utf8")))
          .map((file) => path.relative(process.cwd(), file)),
      ),
    ];

    expect(offenders).toEqual([]);
  });
});

describe("inline style guardrail shapes", () => {
  it("allows an object whose only property is viewTransitionName", () => {
    expect(
      hasForbiddenInlineStyle(
        `style={{ viewTransitionName: \`post-title-${"slug"}\` }}`,
      ),
    ).toBe(false);
  });

  it("rejects an object that pairs viewTransitionName with another property", () => {
    expect(
      hasForbiddenInlineStyle(
        `style={{ viewTransitionName: \`post-title-${"slug"}\`, color: "red" }}`,
      ),
    ).toBe(true);
  });

  it("rejects an unrelated inline style", () => {
    expect(hasForbiddenInlineStyle(`style={{ marginTop: 8 }}`)).toBe(true);
  });
});

function findViolators(
  predicate: (source: string) => boolean,
  isAllowed: (file: string) => boolean = () => false,
): string[] {
  return [
    ...new Set(
      [
        ...sourceRoots.flatMap((root) =>
          listSourceFiles(path.join(process.cwd(), root)),
        ),
        ...rootSourceFiles.map((file) => path.join(process.cwd(), file)),
      ]
        .filter((file) => !isAllowed(file))
        .filter((file) => predicate(fs.readFileSync(file, "utf8")))
        .map((file) => path.relative(process.cwd(), file)),
    ),
  ];
}

function isGeneratorFile(file: string): boolean {
  const base = path.basename(file);
  return base === "icon.tsx" || base.startsWith("opengraph-image");
}

/**
 * A style prop is forbidden unless the object is exactly one property named
 * viewTransitionName (a non-visual transition identifier used for the
 * shared-element morph, ADR 0002). Any other inline style would bypass the
 * design system's tokens and is rejected.
 */
function hasForbiddenInlineStyle(source: string): boolean {
  const styleProp = /\bstyle\s*=\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = styleProp.exec(source)) !== null) {
    // The matched `{` belongs to `style=`; the object literal begins after it.
    const open = match.index + match[0].length;
    const close = findMatchingBrace(source, open);
    if (close === -1) {
      continue;
    }

    const object = source.slice(open, close + 1);
    if (!isLoneViewTransitionNameObject(object)) {
      return true;
    }

    styleProp.lastIndex = close + 1;
  }

  return false;
}

function isLoneViewTransitionNameObject(object: string): boolean {
  const trimmed = object.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return false;
  }

  const body = trimmed.slice(1, -1).trim();
  return /^viewTransitionName\s*:\s*`[^`]*`\s*$/.test(body);
}

function findMatchingBrace(source: string, start: number): number {
  let depth = 0;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (character === "\\") {
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      index = skipQuoted(source, index);
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index);
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function skipQuoted(source: string, start: number): number {
  const quote = source[start];

  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === quote) {
      return index;
    }
  }

  return source.length - 1;
}

function skipTemplateLiteral(source: string, start: number): number {
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === "`") {
      return index;
    }
    if (source[index] === "$" && source[index + 1] === "{") {
      index = findMatchingBrace(source, index + 1);
      if (index === -1) {
        return source.length - 1;
      }
    }
  }

  return source.length - 1;
}

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [fullPath] : [];
  });
}
