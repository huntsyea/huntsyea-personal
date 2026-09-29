#!/usr/bin/env node
/**
 * One-time import of the Sylph Obsidian vault into EmDash.
 *
 * Reads home.md, posts/, projects/, and favorites/ from the vault, converts
 * the Markdown bodies to Portable Text, and creates the entries through the
 * EmDash REST API with their original dates. Notes with `share: true` are
 * published; everything else is imported as a draft. Entries that already
 * exist (same slug, or same title for favorites) are skipped, so the script
 * is safe to re-run.
 *
 *   node scripts/import-vault.mjs                       # local dev server
 *   EMDASH_URL=https://huntsyea.com EMDASH_TOKEN=... node scripts/import-vault.mjs
 *
 * Locally it signs in with EmDash's dev bypass (localhost only). Against a
 * deployed site, create an API token in the admin (Settings → API tokens).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { portableTextToProsemirror, prosemirrorToPortableText } from "emdash";
import {
  createTransport,
  csrfInterceptor,
  devBypassInterceptor,
  EmDashClient,
  markdownToPortableText,
  tokenInterceptor,
} from "emdash/client";
import matter from "gray-matter";

const BASE_URL = (process.env.EMDASH_URL ?? "http://localhost:4321").replace(
  /\/$/,
  "",
);
const TOKEN = process.env.EMDASH_TOKEN;
const VAULT = process.env.VAULT ?? "/Users/huntsyea/Sylph";
const DRY_RUN = process.argv.includes("--dry-run");

/** Intros that exist only in the published repository copy, not the vault. */
const FALLBACK_INTROS = {
  projects: "A short index of the things I have built.",
};

/** The site description the old Site profile carried; now the home page's SEO description. */
const SITE_DESCRIPTION = "I like to build and tinker with AI.";

const transport = createTransport({
  interceptors: [
    csrfInterceptor(),
    TOKEN ? tokenInterceptor(TOKEN) : devBypassInterceptor(BASE_URL),
  ],
});

const client = new EmDashClient(
  TOKEN
    ? { baseUrl: BASE_URL, token: TOKEN }
    : { baseUrl: BASE_URL, devBypass: true },
);

async function api(method, route, body) {
  const response = await transport.fetch(
    new Request(`${BASE_URL}/_emdash/api${route}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(
      `${method} ${route} → ${response.status}: ${text.slice(0, 500)}`,
    );
  }
  return json.data ?? json;
}

// ---------------------------------------------------------------------------
// Vault reading
// ---------------------------------------------------------------------------

/** The old site's route normalisation: `Field Notes` → `field-notes`. */
function normalizeSegment(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readNotes(folder) {
  const directory = path.join(VAULT, folder);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const { data, content } = matter(
        readFileSync(path.join(directory, file), "utf8"),
      );
      return {
        file,
        slug: normalizeSegment(file.replace(/\.md$/, "")),
        data,
        content,
      };
    });
}

function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// ---------------------------------------------------------------------------
// Markdown → Portable Text
// ---------------------------------------------------------------------------

const IMAGE_TAG = /<Image\s+([\s\S]*?)\/>/g;
const ATTRIBUTE = /(\w+)="([^"]*)"/g;

/** `*italic*` → `_italic_` outside code, since the converter reads only `_`. */
function normalizeItalics(markdown) {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/(^|[^*\w])\*(?![\s*])([^*\n]+?)\*(?!\*)/g, "$1_$2_"),
    )
    .join("");
}

/**
 * Stores Portable Text in the shape the admin editor writes, so opening an
 * imported entry does not produce a phantom "Draft changes" autosave.
 */
function editorShape(blocks) {
  return prosemirrorToPortableText(
    portableTextToProsemirror(blocks, { preserveIdentity: true }),
  );
}

/**
 * Uploads a diagram's light and dark PNGs (exported from `diagrams/<name>.svg`
 * when missing) and returns their Media Library URLs. Files already in the
 * library under the same name are reused.
 */
const mediaByFilename = new Map();
async function uploadDiagram(name) {
  if (mediaByFilename.size === 0 && !DRY_RUN) {
    for await (const item of listAllMedia())
      mediaByFilename.set(item.filename, item);
  }
  const source = path.join("diagrams", `${name}.svg`);
  if (!existsSync(source)) throw new Error(`Missing diagram source ${source}`);
  const urls = {};
  for (const scheme of ["light", "dark"]) {
    const filename = `${name}-${scheme}.png`;
    const file = path.join("diagrams", filename);
    if (!existsSync(file)) {
      execFileSync("node", ["scripts/export-diagram.mjs", source], {
        stdio: "inherit",
      });
    }
    if (DRY_RUN) {
      urls[scheme] = `(upload ${filename})`;
      continue;
    }
    let item = mediaByFilename.get(filename);
    if (!item) {
      item = await client.mediaUpload(
        new Blob([readFileSync(file)], { type: "image/png" }),
        filename,
      );
      mediaByFilename.set(filename, item);
      console.log(`uploaded ${filename}`);
    }
    urls[scheme] = item.url;
  }
  return urls;
}

async function* listAllMedia() {
  let cursor;
  do {
    const page = await client.mediaList({ limit: 100, cursor });
    yield* page.items;
    cursor = page.nextCursor;
  } while (cursor);
}

/**
 * Converts a note body. `<Image src="/assets/posts/<name>.svg" …/>` MDX tags
 * become Diagram blocks (plugin-diagram) with a light and a dark image.
 */
async function toPortableText(markdown) {
  const images = [];
  const withTokens = markdown.replace(IMAGE_TAG, (_, attributes) => {
    const props = Object.fromEntries(
      [...attributes.matchAll(ATTRIBUTE)].map((m) => [m[1], m[2]]),
    );
    images.push(props);
    return `\n\n@@IMAGE${images.length - 1}@@\n\n`;
  });

  const blocks = [];
  for (const block of markdownToPortableText(
    normalizeItalics(withTokens).trim(),
  )) {
    const text =
      block._type === "block" && block.children?.length === 1
        ? block.children[0].text
        : "";
    const match = /^@@IMAGE(\d+)@@$/.exec(text?.trim() ?? "");
    if (!match) {
      blocks.push(block);
      continue;
    }
    const image = images[Number(match[1])];
    const name = /^\/assets\/posts\/([\w-]+)\.svg$/.exec(image.src ?? "")?.[1];
    if (!name) throw new Error(`Unsupported image source: ${image.src}`);
    const { light, dark } = await uploadDiagram(name);
    blocks.push({
      _type: "diagram",
      _key: block._key,
      light,
      dark,
      alt: image.alt ?? "",
      ...(image.caption ? { caption: image.caption } : {}),
    });
  }
  return editorShape(blocks);
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

async function existingSlugs(collection) {
  const slugs = new Set();
  const titles = new Set();
  let cursor;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await api("GET", `/content/${collection}?${query}`);
    for (const item of page.items ?? []) {
      if (item.slug) slugs.add(item.slug);
      if (item.data?.title) titles.add(item.data.title);
    }
    cursor = page.nextCursor;
  } while (cursor);
  return { slugs, titles };
}

async function createEntry(
  collection,
  { slug, data, publish, publishedAt, taxonomies, seo },
) {
  const label = `${collection}/${slug ?? data.title}`;
  if (DRY_RUN) {
    console.log(`would create ${label} (${publish ? "published" : "draft"})`);
    return;
  }
  const created = await api("POST", `/content/${collection}`, {
    data,
    ...(slug ? { slug } : {}),
    status: "draft",
    ...(taxonomies ? { taxonomies } : {}),
    ...(seo ? { seo } : {}),
    ...(publishedAt ? { createdAt: publishedAt } : {}),
  });
  const id = created.item?.id ?? created.id;
  if (publish) {
    await api(
      "POST",
      `/content/${collection}/${id}/publish`,
      publishedAt ? { publishedAt } : {},
    );
  }
  console.log(`created ${label} (${publish ? "published" : "draft"})`);
}

async function importCategory(collection) {
  const { slugs } = await existingSlugs(collection);
  for (const note of readNotes(collection)) {
    if (note.slug === "index") continue;
    if (slugs.has(note.slug)) {
      console.log(`skip ${collection}/${note.slug} (exists)`);
      continue;
    }
    const created = isoDate(note.data.time?.created);
    const updated = isoDate(note.data.time?.updated);
    const seo = note.data.seo && {
      ...(note.data.seo.title ? { title: note.data.seo.title } : {}),
      ...(note.data.seo.description
        ? { description: note.data.seo.description }
        : {}),
    };
    await createEntry(collection, {
      slug: note.slug,
      publish: note.data.share === true,
      publishedAt: created,
      seo: seo && Object.keys(seo).length > 0 ? seo : undefined,
      data: {
        title: note.data.title || note.file.replace(/\.md$/, ""),
        summary: note.data.summary || undefined,
        content: await toPortableText(note.content),
        revised_at:
          updated && (!created || updated >= created) ? updated : undefined,
      },
    });
  }
}

async function importIntros() {
  const { slugs } = await existingSlugs("pages");
  const intros = [];

  const home = path.join(VAULT, "home.md");
  if (existsSync(home)) {
    const { content } = matter(readFileSync(home, "utf8"));
    intros.push({
      slug: "home",
      title: "Home",
      body: content,
      seo: { description: SITE_DESCRIPTION },
    });
  }
  for (const folder of ["posts", "projects", "favorites"]) {
    const note = readNotes(folder).find((item) => item.slug === "index");
    const body = note?.content.trim() || FALLBACK_INTROS[folder];
    if (body)
      intros.push({
        slug: folder,
        title: folder[0].toUpperCase() + folder.slice(1),
        body,
      });
  }

  for (const intro of intros) {
    if (slugs.has(intro.slug)) {
      console.log(`skip pages/${intro.slug} (exists)`);
      continue;
    }
    await createEntry("pages", {
      slug: intro.slug,
      publish: true,
      seo: intro.seo,
      data: { title: intro.title, content: await toPortableText(intro.body) },
    });
  }
}

async function ensureFavoriteGroups(order, used) {
  const terms = await api("GET", "/taxonomies/favorite_group/terms");
  const existing = new Map(
    (terms.terms ?? terms.items ?? terms).map((term) => [term.slug, term]),
  );
  const labels = [
    ...order,
    ...[...used].filter((label) => !order.includes(label)).sort(),
  ];
  for (const label of labels) {
    const slug = normalizeSegment(label);
    if (existing.has(slug)) continue;
    if (DRY_RUN) {
      console.log(`would create favorite group ${label}`);
      continue;
    }
    await api("POST", "/taxonomies/favorite_group/terms", { slug, label });
    console.log(`created favorite group ${label}`);
  }
}

async function importFavorites() {
  const notes = readNotes("favorites");
  const index = notes.find((note) => note.slug === "index");
  const order = Array.isArray(index?.data.groups)
    ? index.data.groups.map(String)
    : [];
  const items = notes.filter((note) => note !== index);
  await ensureFavoriteGroups(
    order,
    new Set(items.map((note) => note.data.group).filter(Boolean)),
  );

  const { titles } = await existingSlugs("favorites");
  for (const note of items) {
    const title = note.data.title || note.file.replace(/\.md$/, "");
    const url = typeof note.data.href === "string" ? note.data.href.trim() : "";
    if (!/^https?:\/\//.test(url)) {
      console.warn(
        `skip favorites/${note.file}: href must be an absolute http(s) URL`,
      );
      continue;
    }
    if (titles.has(title)) {
      console.log(`skip favorites/${title} (exists)`);
      continue;
    }
    await createEntry("favorites", {
      publish: note.data.share === true,
      data: { title, url, note: note.data.note || undefined },
      taxonomies: note.data.group
        ? { favorite_group: [normalizeSegment(note.data.group)] }
        : undefined,
    });
  }
}

/** Removes EmDash's built-in Categories and Tags taxonomies while they are unused. */
async function removeUnusedBuiltInTaxonomies() {
  for (const name of ["category", "tag"]) {
    let terms;
    try {
      terms = await api("GET", `/taxonomies/${name}/terms`);
    } catch {
      continue;
    }
    const list = terms.terms ?? terms.items ?? terms;
    if (Array.isArray(list) && list.length === 0 && !DRY_RUN) {
      await api("DELETE", `/taxonomies/${name}`);
      console.log(`removed unused built-in taxonomy ${name}`);
    }
  }
}

await removeUnusedBuiltInTaxonomies();
await importIntros();
await importCategory("posts");
await importCategory("projects");
await importFavorites();
console.log("done");
