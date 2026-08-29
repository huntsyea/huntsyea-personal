import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "components"];
const forbiddenContentModule =
  /from\s+["'](@\/lib\/content(?:\/(?:catalog|renderer))?|(?:\.\.\/)+lib\/content(?:\/(?:catalog|renderer))?(?:\.[cm]?[jt]sx?)?)["']/;

describe("client catalog boundary", () => {
  it("does not import server-only content modules from the client graph", () => {
    const offenders = [
      ...new Set(
        sourceRoots
          .flatMap((root) => listSourceFiles(path.join(process.cwd(), root)))
          .filter((file) => hasUseClient(fs.readFileSync(file, "utf8")))
          .flatMap((file) => walkClientGraph(file)),
      ),
    ]
      .filter((file) =>
        forbiddenContentModule.test(fs.readFileSync(file, "utf8")),
      )
      .map((file) => path.relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });
});

function hasUseClient(source: string): boolean {
  return /^["']use client["']/m.test(source);
}

function walkClientGraph(entry: string): string[] {
  const visited = new Set<string>();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || visited.has(file)) {
      continue;
    }

    visited.add(file);
    const source = fs.readFileSync(file, "utf8");
    for (const specifier of importedSpecifiers(source)) {
      const resolved = resolveImportedFile(file, specifier);
      if (resolved) {
        queue.push(resolved);
      }
    }
  }

  return [...visited];
}

function importedSpecifiers(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

function resolveImportedFile(
  fromFile: string,
  specifier: string,
): string | undefined {
  if (specifier.startsWith("@/")) {
    return existingSourceFile(path.join(process.cwd(), specifier.slice(2)));
  }

  if (specifier.startsWith(".")) {
    return existingSourceFile(path.join(path.dirname(fromFile), specifier));
  }

  return undefined;
}

function existingSourceFile(base: string): string | undefined {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
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
