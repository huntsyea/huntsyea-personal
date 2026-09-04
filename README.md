# huntsyea.com

This repository builds Hunter Yea's personal website with the Next.js App Router, React, Tailwind CSS, and trusted server-rendered MDX published from Obsidian.

## Requirements

- Node.js 24 LTS
- pnpm 11.23.0 through Corepack

## Setup

```bash
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env.local
corepack pnpm dev
```

`SITE_URL` is the canonical production origin. It must be an absolute HTTP or HTTPS origin without a path, query, or fragment. Builds fail on a missing or invalid value so canonical, Open Graph, robots, and sitemap URLs cannot silently drift.

## Content

The repository mirrors content published from Obsidian through Enveloppe. Physical folders and filenames are the content contract. Add a folder under `content/`, then add `.md` or `.mdx` notes inside it:

```text
content/
  Field Notes/
    First Note.mdx
```

Natural names normalize to URL-safe segments, so this example publishes at `/field-notes/first-note`. A post can contain only Markdown. Frontmatter is optional:

```yaml
---
title: "First note"
summary: "A short route-specific description."
time:
  created: "2026-08-23T12:00:00.000Z"
  updated: "2026-08-23T12:00:00.000Z"
---
```

The filename supplies the title when `title` is absent. Missing optional metadata uses a safe default. Invalid optional dates, incomplete Favorites, and unsupported nested folders produce source-specific warnings and continue. Unreadable files, malformed frontmatter, empty route segments, normalized route collisions, and rendering failures stop verification.

`content/home.md` supplies the homepage introduction. `content/favorites/` contains outbound-link notes; only an absolute HTTP or HTTPS `href` is essential. The shared private Markdown reader handles discovery and normalization, while Posts, Home, and Favorites keep separate public domain interfaces.

A note named `index` inside a Category folder is reserved as that Category's intro, rendered through the prose class above the Category list; it is never a Post, so it is excluded from ordering, adjacency, entries, sitemap, and static params. A Category folder containing only an `index` note is valid and empty. The `index` name is reserved only inside a Category folder: the home intro remains `content/home.md`, and an `index` note at the content root is ignored.

The local Obsidian publisher uses path-based upload into `content/`, publishes only notes with the configured share key, excludes `Templates`, and leaves automatic cleanup disabled. Enveloppe can auto-merge only after the repository and Vercel checks pass.

The content catalog discovers categories, sorts posts, supplies adjacent navigation, and generates the static route and sitemap inventory. Post titles provide the only page-level heading, so authored sections begin with `##`.

MDX is trusted repository content compiled on the server. JavaScript expressions and MDX imports/exports are intentionally rejected. Interactive behavior remains isolated to small client components.

## Commands

```bash
pnpm format:check     # read-only formatting check
pnpm format:write     # explicitly format source
pnpm lint             # Stylelint and framework-aware ESLint
pnpm typecheck        # TypeScript without emitting files
pnpm test             # Vitest domain tests
pnpm build            # production Next.js build
pnpm verify           # all read-only gates, including the production browser suite
pnpm test:e2e         # rerun Playwright against a completed production build
```

Set `SITE_URL` when building or starting outside `.env.local`:

```bash
SITE_URL=https://example.com pnpm verify
```

CI runs the complete verification command for code and configuration changes.
For changes confined to `content/`, CI runs the content domain tests while the
required Vercel check performs the production build. This keeps trusted
Obsidian publishing fast without allowing invalid content to merge.

## Architecture

- `lib/content/` is the content domain seam: schema validation, discovery, ordering, lookup, adjacency, and trusted MDX rendering.
- `lib/site/` is the site-identity seam: canonical origin validation and shared metadata construction.
- `styles/tokens.css` is the Design system's single source of visual truth: semantic colour roles, the type scale, spacing rhythm, radius, and column and aside widths, declared CSS-first for Tailwind v4 with no JavaScript config. `styles/main.css` imports it and owns the base layer, the `.prose` vertical rhythm, and the reduced-motion block. See [`DESIGN.md`](DESIGN.md).
- `components/link` is the one site `Link` primitive and the only importer of the Link component; the providers module imports the ViewTransitions provider, and the design-system guardrail exempts exactly those two (ADR 0002).
- `app/layout.tsx` renders the shared shell — `SiteHeader` (site name, catalog-generated nav, Theme control) and `SiteFooter` (Contact links, copyright) — on every route; `main` owns content only.
- `app/(posts)/[category]/` maps the catalog inventory to statically generated category and post routes.
- `app/robots.ts`, `app/sitemap.ts`, and native `opengraph-image.tsx` files generate crawler and social surfaces from the same catalog and site profile.
- `tests/unit/` verifies the two domain seams and the design-system guardrail (which fails on raw palette classes, arbitrary pixel values, inline styles, and link-library imports outside the `Link` primitive); `tests/e2e/` verifies the production-built site, accessibility, themes, metadata, and social images.

The shipped architecture and verification evidence are summarized in [`docs/modernization-report.md`](docs/modernization-report.md). The original audit, research, and requirements remain in [`docs/sylph-modernization-audit.md`](docs/sylph-modernization-audit.md), [`docs/nextjs-modernization-research.md`](docs/nextjs-modernization-research.md), and [`docs/specs/modernize-sylph.md`](docs/specs/modernize-sylph.md).
