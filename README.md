# huntsyea.com

Hunter Yea's personal website: an [Astro](https://astro.build) site with [EmDash](https://emdashcms.com) CMS, deployed to Cloudflare Workers with D1 (database) and R2 (media). All content — posts, projects, favorites, page intros, the site title and tagline, navigation, and contact links — is edited in the EmDash admin, and a published edit is live without a deploy.

## Requirements

- Node.js 24 or later
- pnpm 11.23.0 through Corepack

## Local development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec emdash secrets generate --write=.env   # first time only
pnpm dev
```

- Site: <http://localhost:4321/>
- Admin: <http://localhost:4321/_emdash/admin/>

`pnpm dev` runs the site in the Workers runtime with a local D1 database and R2 bucket under `.wrangler/state`. On a new database, EmDash applies `seed/seed.json` (collections, settings, menus) on the first request, and the admin opens a setup wizard where you create the first administrator with a passkey.

To load the pre-migration content from the Obsidian vault into an empty database:

```bash
pnpm import:vault                     # reads /Users/huntsyea/Sylph (override with VAULT=...)
```

The import is idempotent: it skips entries that already exist. Against the local dev server it signs in with EmDash's dev bypass, which creates a `dev@emdash.local` admin; complete setup first, or delete that user before running the setup wizard.

## Content model

| Collection / feature                    | Route                                                      | Notes                                                                       |
| --------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `posts`, `projects`                     | `/posts`, `/posts/<slug>`, `/projects`, `/projects/<slug>` | Title, summary, Portable Text content, optional Revised date                |
| `favorites` + `favorite_group` taxonomy | `/favorites`                                               | Group order is the term order in the admin                                  |
| `pages` (Page intros)                   | —                                                          | Slug `home`, `posts`, `projects`, or `favorites` supplies that page's intro |
| Settings → title, tagline, URL          | every page                                                 | Site name, tagline, canonical origin                                        |
| Menus `primary`, `contact`              | header, footer, home                                       | Navigation and contact links                                                |

See [docs/agents/publishing.md](docs/agents/publishing.md) for the editing workflow and [CONTEXT.md](CONTEXT.md) for the domain glossary.

## Commands

```bash
pnpm dev            # Astro dev server in the Workers runtime
pnpm build          # production build into dist/
pnpm preview        # build, then serve the built Worker with wrangler dev (port 8787)
pnpm test           # unit tests (node --test)
pnpm verify         # formatting, style lint, tests, astro check, and build
pnpm deploy         # build and deploy to Cloudflare (requires wrangler login)
```

## Deploying to Cloudflare

The site runs as the `huntsyea-personal` Worker with the `huntsyea-personal` D1 database, the `huntsyea-media` R2 bucket, and a session KV namespace. `huntsyea.com` and `www.huntsyea.com` are Workers Custom Domains (in `wrangler.jsonc`), so Cloudflare manages their DNS records and certificates; `src/worker.ts` redirects `www` to the apex.

Every push to `main` deploys automatically through Cloudflare Workers Builds, which is connected to this repository (Cloudflare dashboard → the Worker → Settings → Build). The build runs `pnpm run build` on Node 24, then `pnpm exec wrangler deploy && node scripts/warm-cache.mjs`. Pull requests are checked by the `verify` workflow before merge; other branches do not deploy.

To deploy by hand instead:

```bash
pnpm exec wrangler login   # once per machine
pnpm deploy                # build, deploy, and warm the edge cache
```

Content changes need no deploy; only code changes do. The production encryption key is a Worker secret (`EMDASH_ENCRYPTION_KEY`); keep its backup somewhere safe, because EmDash cannot read encrypted plugin settings without it.

`EMDASH_SITE_URL=https://huntsyea.com` is a Worker variable in `wrangler.jsonc` (`vars`). EmDash reads it at runtime for passkeys, CSRF checks, and media URLs. Local development blanks it with `EMDASH_SITE_URL=` in `.env`, so EmDash uses the request origin and `localhost` works; without that line, local passkeys fail. Passkeys are bound to that origin. Image optimization for the production media route is authorized in `astro.config.mjs`, so it does not depend on build-time environment.

Anonymous HTML is cached at the edge (Workers Cache, one day fresh plus seven days stale-while-revalidate) and purged by tag when content, settings, menus, or taxonomies change; admin, preview, edit, and signed-in responses are never stored. See [ADR 0004](docs/adr/0004-anonymous-html-edge-cache.md). Each deploy starts with an empty cache, so the deploy step then runs `scripts/warm-cache.mjs`, which requests every sitemap URL and the RSS feed once; `pnpm warm` runs it by hand. The Worker runs next to the D1 primary through Targeted Placement (`gcp:us-east1`, Atlanta), chosen by measuring D1 round trips from several regions.

## Backups and updates

- **Database:** D1 Time Travel can restore the database to any minute in the last 7 days (Free plan). Before a risky change, record the current bookmark with `pnpm exec wrangler d1 time-travel info huntsyea-personal`; restore with `pnpm exec wrangler d1 time-travel restore huntsyea-personal --bookmark=<bookmark>`. A restore overwrites the database in place and prints the bookmark to undo it. Time Travel does not cover R2 media or the encryption key.
- **JSON backups:** turn on daily backups in the admin (Settings → Backups). They are written to the private R2 bucket under `backups/` and are for inspection only; EmDash cannot restore from them.
- **Encryption key:** `EMDASH_ENCRYPTION_KEY` is not in any backup. Its copy lives in the macOS Keychain; without it, encrypted plugin settings cannot be recovered.
- **Updating EmDash:** run `npx upgrade-emdash@latest --dry-run`, then apply it and follow `.emdash/UPGRADE.md`. Update `emdash` and `@emdash-cms/cloudflare` together. If the release adds core migrations, record a Time Travel bookmark before merging, because migrations apply on the first request after the deploy and rolling back the code does not undo them.
- **Checks:** `pnpm exec emdash doctor` confirms the scheduled-publishing wiring. Its `database` check always fails on D1 projects, because it looks for a local SQLite file.

## AI tools

The site's content MCP server is `https://huntsyea.com/_emdash/api/mcp`, registered in `.mcp.json` as `huntsyea-cms`. Claude Code, Codex, ChatGPT, and other MCP clients sign in through EmDash's OAuth screen and choose scopes before any token is issued. `emdash-docs` in the same file is the read-only documentation server.

To move the site to another host, detach the two custom domains (Cloudflare dashboard → the Worker → Domains & Routes) and create DNS records for the new host.

The `.well-known/matrix` routes are served by the Worker, so Matrix federation keeps working after the DNS move.
