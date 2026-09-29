# ADR 0003: Astro and EmDash on Cloudflare

- Status: Accepted
- Date: 2026-09-28
- Supersedes: ADR 0001 (content category routing), ADR 0002 (library-backed view transitions and motion)

## Context

Content was authored in the Obsidian vault `Sylph`, copied into `content/` by a custom Obsidian plugin, and compiled by Next.js on Vercel. Every edit was a pull request and a deploy, content could only be edited from a device with the vault, and the site name, contact links, and navigation lived in code. The goal is to edit everything from a CMS, without a deploy, while keeping the design unchanged.

## Decision

- The site is an Astro project with the EmDash integration, deployed to Cloudflare Workers with D1 for the database and R2 for media.
- EmDash is the only content source. The vault was imported once (`scripts/import-vault.mjs`) with original publication dates; the Obsidian plugin and `content/` mirror are removed.
- Content model: `posts` and `projects` collections are the Categories, `favorites` plus the `favorite_group` taxonomy replace the favorites notes, and `pages` holds the page intros. Site title and tagline are site settings; header and contact links are the `primary` and `contact` menus.
- Categories are a fixed list in code (`src/lib/content.ts`). Adding one means adding a collection and one line, not a folder.
- Pages are server-rendered on every request, so a published edit is live without a deploy.
- Motion uses the platform: cross-document view transitions (`@view-transition`) with the same shared-element title names, and a CSS entrance animation with the same duration and easing. `framer-motion`, `next-view-transitions`, and `next-themes` are gone; the Theme control is a small script.
- Images live in the Media Library and render as responsive WebP through EmDash's image component and Cloudflare's image service; originals are uploaded as PNG or JPEG. Diagrams, which must follow the theme, are a custom Portable Text block (`plugins/diagram`, a native EmDash plugin) with a light and a dark image. EmDash rejects SVG uploads, so diagrams are authored as SVG in `diagrams/` and exported to PNG pairs by `scripts/export-diagram.mjs`.

## Consequences

- Public pages ship no React; the admin is the only React surface.
- The schema lives in the database. `seed/seed.json` seeds new databases only, so schema changes to a deployed site go through the admin or API and are mirrored into the seed.
- Social cards render at request time on Workers (`@cf-wasm/og`) instead of at build time.
- Favorites sort by title within a group instead of by filename.
