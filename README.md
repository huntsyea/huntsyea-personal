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

The repository mirrors content published from Obsidian through the repository's own plugin in `obsidian-plugin/`. Physical folders and filenames are the content contract. Add a folder under `content/`, then add `.md` or `.mdx` notes inside it:

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

## Publishing from Obsidian

`obsidian-plugin/` is a small Obsidian plugin that replaces Enveloppe. It copies every note whose `share` key is `true` into `content/` at the same path, delivers the images those notes reference from `<folder>/assets/` into `public/assets/<folder>/`, and excludes `Templates`. It covers the home intro, every Category folder and its `index` intro, Favorites, and assets. A manifest at `content/.publish-manifest.json` records what the plugin published, so unsharing, deleting, or moving a note removes its published copy on the next publish while hand-made repository files are never touched.

Publishing writes one commit to the `obsidian/publish` branch, opens a pull request against `main`, and enables auto-merge, so `verify` and Vercel remain the gates. Publishing again while that pull request is open adds to it. The plugin runs the same frontmatter, route-collision, and asset checks the content readers enforce and refuses to publish while any fail.

There is no token to create. The plugin signs in with GitHub's device flow: it shows a short code, you approve it once in the browser, and GitHub issues the plugin a token that does not expire. That sign-in is stored in Obsidian's device-local storage, never in the vault, so Obsidian Sync cannot remove it; sign in once per device. The one-time setup is a GitHub OAuth App (Settings → Developer settings → OAuth Apps → New, any name and homepage, any callback URL, **Enable Device Flow** checked) whose Client ID goes into the plugin settings. Build and install into the authoring vault with:

```bash
pnpm plugin:install                      # installs into ~/Sylph
OBSIDIAN_VAULT=/path/to/vault pnpm plugin:install
```

Then enable "Publish to huntsyea.com" in Obsidian's community plugins, press **Sign in with GitHub** in its settings, and run **Publish shared notes** or **Preview what would publish** from the command palette.

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
For changes confined to `content/` and delivered assets under `public/assets/`,
CI runs the content domain tests while the required Vercel check performs the
production build. This keeps trusted Obsidian publishing fast without allowing
invalid content to merge.

## Architecture

- `lib/content/` is the content domain seam: schema validation, discovery, ordering, lookup, adjacency, and trusted MDX rendering.
- `lib/site/` is the site-identity seam: canonical origin validation and shared metadata construction.
- `styles/tokens.css` is the Design system's single source of visual truth: semantic colour roles, the type scale, spacing rhythm, radius, and column and aside widths, declared CSS-first for Tailwind v4 with no JavaScript config. `styles/main.css` imports it and owns the base layer, the `.prose` vertical rhythm, and the reduced-motion block. See [`DESIGN.md`](DESIGN.md).
- `components/link` is the one site `Link` primitive and the only importer of the Link component; the providers module imports the ViewTransitions provider, and the design-system guardrail exempts exactly those two (ADR 0002).
- `components/site-shell` renders the shared shell — `SiteHeader` (site name, catalog-generated nav), `main` with the route entrance, and `SiteFooter` (Contact links, Theme control, copyright). The `(posts)` layout and the not-found page use it with chrome; the home page turns the header and footer off because its identity block and contact pills already carry what they repeat.
- `app/(posts)/[category]/` maps the catalog inventory to statically generated category and post routes.
- `app/robots.ts`, `app/sitemap.ts`, and native `opengraph-image.tsx` files generate crawler and social surfaces from the same catalog and site profile.
- `tests/unit/` verifies the two domain seams and the design-system guardrail (which fails on raw palette classes, arbitrary pixel values, inline styles, and link-library imports outside the `Link` primitive); `tests/e2e/` verifies the production-built site, accessibility, themes, metadata, and social images.

The shipped architecture and verification evidence are summarized in [`docs/modernization-report.md`](docs/modernization-report.md). The original audit, research, and requirements remain in [`docs/sylph-modernization-audit.md`](docs/sylph-modernization-audit.md), [`docs/nextjs-modernization-research.md`](docs/nextjs-modernization-research.md), and [`docs/specs/modernize-sylph.md`](docs/specs/modernize-sylph.md).
