# Sylph

Sylph is a minimal publishing and portfolio starter built with the Next.js App Router, React, Tailwind CSS, and trusted server-rendered MDX.

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

## Architecture

- `lib/content/` is the content domain seam: schema validation, discovery, ordering, lookup, adjacency, and trusted MDX rendering.
- `lib/site/` is the site-identity seam: canonical origin validation and shared metadata construction.
- `app/(posts)/[category]/` maps the catalog inventory to statically generated category and post routes.
- `app/robots.ts`, `app/sitemap.ts`, and native `opengraph-image.tsx` files generate crawler and social surfaces from the same catalog and site profile.
- `tests/unit/` verifies the two domain seams; `tests/e2e/` verifies the production-built site, accessibility, themes, metadata, and social images.

The shipped architecture and verification evidence are summarized in [`docs/modernization-report.md`](docs/modernization-report.md). The original audit, research, and requirements remain in [`docs/sylph-modernization-audit.md`](docs/sylph-modernization-audit.md), [`docs/nextjs-modernization-research.md`](docs/nextjs-modernization-research.md), and [`docs/specs/modernize-sylph.md`](docs/specs/modernize-sylph.md).
