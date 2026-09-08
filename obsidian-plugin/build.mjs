import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });
await build({
  entryPoints: [path.join(root, "src/main.ts")],
  outfile: path.join(dist, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  logLevel: "info",
});
await copyFile(
  path.join(root, "manifest.json"),
  path.join(dist, "manifest.json"),
);

// Optionally install into a vault: `pnpm plugin:install` uses OBSIDIAN_VAULT
// or the canonical authoring vault.
if (process.argv.includes("--install")) {
  const vault =
    process.env.OBSIDIAN_VAULT ?? path.join(process.env.HOME ?? "", "Sylph");
  const target = path.join(vault, ".obsidian", "plugins", "huntsyea-publish");
  await mkdir(target, { recursive: true });
  for (const file of ["main.js", "manifest.json"]) {
    await copyFile(path.join(dist, file), path.join(target, file));
  }
  console.log(`Installed into ${target}`);
}
