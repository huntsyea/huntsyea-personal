import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components"];
const rootSourceFiles = ["mdx-components.tsx"];
const rawPaletteClass = /\b(?:gray|pink|yellow|teal)-a?[0-9]+\b/;
const arbitraryPixelUtility = /-\[-?[0-9.]+px\]/;
// Inline style props are forbidden except a lone viewTransitionName, which the
// Link row/heading pair needs for the shared-element morph (ADR 0002).
const inlineStyleProp = /\bstyle\s*=\s*\{\{(?!\s*viewTransitionName\b)/;
const nextLinkImport = /from\s+["']next\/link["']/;
const viewTransitionLinkImport =
  /import\s+\{[\s\S]*?\bLink\b[\s\S]*?\}\s+from\s+["']next-view-transitions["']/;

const linkPrimitiveFile = path.join(process.cwd(), "components/link/index.tsx");

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
    const offenders = findViolators(
      (source) => inlineStyleProp.test(source),
      (file) => isGeneratorFile(file),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps link-library imports inside the Link primitive", () => {
    const offenders = [
      ...new Set(
        [
          ...sourceRoots.flatMap((root) =>
            listSourceFiles(path.join(process.cwd(), root)),
          ),
          ...rootSourceFiles.map((file) => path.join(process.cwd(), file)),
        ]
          .filter((file) => file !== linkPrimitiveFile)
          .filter((file) => {
            const source = fs.readFileSync(file, "utf8");
            return (
              nextLinkImport.test(source) ||
              viewTransitionLinkImport.test(source)
            );
          })
          .map((file) => path.relative(process.cwd(), file)),
      ),
    ];

    expect(offenders).toEqual([]);
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

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [fullPath] : [];
  });
}
