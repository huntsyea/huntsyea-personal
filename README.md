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
pnpm verify         # formatting, style lint, astro check, and build
pnpm deploy         # build and deploy to Cloudflare (requires wrangler login)
```

## Deploying to Cloudflare

The site runs as the `huntsyea-personal` Worker with the `huntsyea-personal` D1 database, the `huntsyea-media` R2 bucket, and a session KV namespace. Workers routes for `huntsyea.com/*` and `www.huntsyea.com/*` (in `wrangler.jsonc`) put the Worker in front of the zone's proxied DNS records; `src/worker.ts` redirects `www` to the apex.

```bash
pnpm exec wrangler login   # once per machine
pnpm deploy                # build with EMDASH_SITE_URL=https://huntsyea.com and deploy
```

Content changes need no deploy; only code changes do. The production encryption key is a Worker secret (`EMDASH_ENCRYPTION_KEY`); keep its backup somewhere safe, because EmDash cannot read encrypted plugin settings without it.

`pnpm deploy` sets `EMDASH_SITE_URL=https://huntsyea.com` at build time and as a Worker variable. EmDash requires this public origin for production setup and uses it for passkeys, CSRF checks, and image optimization (without it, images ship as the original PNG instead of resized WebP). Local development leaves it unset so `localhost` works. Passkeys are bound to that origin.

To roll back to another host, remove the two routes (from `wrangler.jsonc` and redeploy, or in the Cloudflare dashboard under the Worker's Domains & Routes); the zone's DNS records are untouched by the routes.

The `.well-known/matrix` routes are served by the Worker, so Matrix federation keeps working after the DNS move.
