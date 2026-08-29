# Sylph modernization and architecture audit

**Audit date:** 2026-08-23

**Scope:** current repository state, upgrade posture, App Router routes, MDX, theming, Open Graph, SEO, architecture, and verification strategy.

**Change policy:** report-only. No application, dependency, or configuration files were changed.

## Executive verdict

Sylph has **modern package numbers but an incomplete migration**. The latest repository commit upgraded Next 14 to Next 16, React 18 to React 19, Tailwind 3 to Tailwind 4, and Biome 1 to Biome 2 without the corresponding route, CSS, type, or tool configuration work. The result is not a green Next.js 16 application:

- a direct production build fails on the Tailwind v4 PostCSS integration and the Open Graph font path;
- TypeScript reports React 19, MDX, and `next-themes` errors;
- Biome 2 rejects the checked-in Biome 1 configuration;
- ESLint is installed but has no flat configuration;
- the repository's `build` and `lint` scripts mutate source files, so they are unsuitable as verification gates;
- there are no tests and no CI workflow.

The right sequence is therefore **restore a deterministic green baseline first, then update versions, then deepen the content and site-metadata modules**. A blind package upgrade would make the failure surface larger without improving the architecture.

The highest-leverage architectural change is a single deep content-catalog module. Today routes, screens, navigation, metadata, sitemap generation, documentation, and filesystem conventions all repeat content knowledge. Concentrating parsing, validation, lookup, ordering, adjacency, and category discovery behind one small interface will make every later modernization safer.

## Current state

### Repository baseline

- Branch: `main`, aligned with `origin/main` before the report artifacts were added.
- Latest commit: `f6da0a7 chore: update packages` (2026-01-26).
- Framework: App Router with route groups and statically generated MDX post routes.
- Content: four local `.mdx` files under `app/(posts)/*/posts`.
- Tests: none found.
- CI: none found; `.github` contains issue templates only.
- Domain/architecture records: no `CONTEXT.md`, `docs/adr`, or equivalent decision records.
- Host runtime observed: Node `24.16.0`, pnpm `11.2.2`.

### Core version matrix

Latest values are the npm `latest` dist-tags verified on 2026-08-23, not prereleases.

| Area                  |                          Repository |           Latest stable | Recommended target                                                                         |
| --------------------- | ----------------------------------: | ----------------------: | ------------------------------------------------------------------------------------------ |
| Next.js               |                            `16.1.4` |                `16.3.2` | `16.3.2` after baseline fixes                                                              |
| `@next/mdx`           |                            `16.1.4` |                `16.3.2` | Remove if retaining the catalog-driven `next-mdx-remote` path; otherwise align to `16.3.2` |
| React / React DOM     |                            `19.2.3` |                `19.2.8` | Upgrade together to `19.2.8`                                                               |
| Tailwind CSS          |                            `4.1.18` |                 `4.3.3` | `4.3.3` only with the full v4 integration migration                                        |
| MDX compiler packages |                             `3.1.1` |                 `3.1.1` | Already current                                                                            |
| `next-mdx-remote`     |                             `5.0.0` |                 `6.0.0` | `6.0.0` if chosen as the one MDX path                                                      |
| Biome                 |                            `2.3.12` |                `2.5.10` | Migrate config first, then upgrade                                                         |
| TypeScript            |                             `5.9.3` |                 `7.0.2` | Keep `5.9.3` in this program; treat TypeScript 7 as a separate major migration             |
| Node                  |                no repository policy | Node 24 LTS is suitable | Declare Node 24 LTS; align `@types/node` to 24.x                                           |
| pnpm                  | no repository policy; host `11.2.2` |               `11.22.0` | Declare `packageManager: pnpm@11.22.0` after validating install policy                     |

Primary-source detail and the full source index are in [nextjs-modernization-research.md](./nextjs-modernization-research.md).

## Verified failures

The repository's own `build` script was not run because it rewrites MDX timestamps and runs three formatters in fix mode. The production compiler and checkers were invoked directly.

| Check                           | Result                          | Evidence                                                                                                                                                                          |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen lockfile restore         | Failed after restoring packages | pnpm blocked `sharp` and `unrs-resolver` build scripts under its supply-chain policy. Do not bypass this implicitly; record a narrow allowlist as a deliberate repository policy. |
| `next build` with Next `16.1.4` | Failed                          | Tailwind v4 rejects `tailwindcss` as the PostCSS plugin; `app/api/og/route.tsx` cannot resolve `/public/assets/inter/regular.ttf`.                                                |
| `tsc --noEmit`                  | Failed                          | Seven errors: removed global `JSX` namespace usage, React 19 unknown props in MDX element inspection, and `next-themes` provider typing.                                          |
| `biome check .`                 | Failed                          | Biome `2.3.12` rejects the `1.9.0` schema and removed `ignore` / `organizeImports` configuration keys.                                                                            |
| `prettier --check .`            | Failed                          | 23 pre-existing repository files require formatting under the installed Prettier configuration.                                                                                   |
| `stylelint "**/*.css"`          | Failed                          | One property-order error in `styles/main.css`.                                                                                                                                    |
| `eslint .`                      | Failed                          | ESLint 9 cannot find `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.cjs`.                                                                                             |

Next also warns that it inferred `/Users/huntsyea` as the workspace root because it sees the parent and repository lockfiles. This is host-specific but real. A portable `turbopack.root` setting based on the repository directory would remove the ambiguity.

## Findings by priority

### P0 — Restore a buildable Tailwind and Next baseline

The repository declares Tailwind 4 but still uses the Tailwind 3 integration:

- `postcss.config.mjs` loads `tailwindcss` directly instead of `@tailwindcss/postcss`;
- `styles/main.css` uses `@tailwind base`, `components`, and `utilities`;
- `tailwind.config.ts` assumes automatic JavaScript-config discovery, which Tailwind 4 no longer provides;
- the current custom tokens and utilities depend on that legacy config.

The migration should be deliberate:

1. add `@tailwindcss/postcss` and use it in PostCSS;
2. replace the three legacy directives with `@import "tailwindcss"`;
3. explicitly bridge the existing TypeScript config with `@config` while visual behavior is stabilized;
4. migrate stable design tokens and utilities to CSS-first `@theme` / `@utility` in a later, visually tested change;
5. verify dark mode, Radix tokens, MDX prose, Shiki dual themes, custom text utilities, responsive pages, and `important` behavior before deleting the bridge.

This is the first implementation slice because no route or SEO work can be proven while CSS compilation stops the build.

### P0 — Repair the Open Graph implementation

`app/api/og/route.tsx` is confirmed to block the build because its font URL resolves as a module import from `/public`. It also:

- forces the Edge runtime although the default Node runtime is the better fit for local assets;
- logs request parameters;
- uses a `1200x600` card instead of the conventional `1200x630` shape;
- catches every error and reduces it to an unobservable 500;
- requires every route to hand-build a query URL.

Replace this handler with native metadata files:

- `app/opengraph-image.tsx` for the site default;
- `app/(posts)/[category]/[slug]/opengraph-image.tsx` for post cards;
- exported `alt`, `size`, and `contentType` values;
- Node runtime and an explicitly bundled/read local font;
- shared data from the content catalog and site-profile modules.

This removes hand-assembled OG URLs and lets Next insert the correct metadata automatically.

### P1 — Complete the Next 16 route contract

Both dynamic post pages type `params` as the entire `Post` model and read it synchronously. In current App Router APIs, `params` is promise-based. Both the page and `generateMetadata` should await a narrow `{ slug: string }` route value, ideally using generated `PageProps` types.

The two category implementations also duplicate static params, lookup, not-found behavior, metadata, and rendering. The preferred route target is:

```text
app/
└── (posts)/
    └── [category]/
        ├── page.tsx
        └── [slug]/
            ├── page.tsx
            └── opengraph-image.tsx
```

Generate both category and slug params from the content catalog and set `dynamicParams = false` if the site should remain strictly static. This makes the documentation's folder-driven category claim true while keeping the output deterministic.

Also add a real category `<h1>`, semantic post lists, a custom `not-found.tsx`, and an `error.tsx`. A `loading.tsx` is not necessary unless a future data source introduces meaningful latency.

### P1 — Establish one MDX path

The repository currently enables `@next/mdx` globally but reads frontmatter with `gray-matter` and renders strings through `next-mdx-remote/rsc`. The native `useMDXComponents` hook does not even merge the repository's registered defaults, so the two paths behave differently.

For the current catalog-driven local-content model, the recommended choice is:

- keep one server-only `next-mdx-remote/rsc` path and upgrade it to v6;
- move the renderer out of the misleading root-level `mdx-components.tsx` convention if `@next/mdx` is removed;
- remove `@next/mdx`, its page extensions, and unused MDX dependencies only after the new path builds and renders all fixtures;
- keep MDX content trusted and repository-authored—MDX executes JavaScript/JSX and is not a safe user-content format;
- preserve a small `<MDX source>` interface while simplifying its implementation.

If the product instead wants MDX files imported directly as route modules, choose `@next/mdx` and remove filesystem scanning plus `next-mdx-remote`. Keeping both is the one option to avoid.

Content ingestion must validate frontmatter at runtime and fail the build with the filename and field error. It currently casts arbitrary YAML to `Post`, swallows parse/filesystem errors, and silently drops invalid posts. The advertised Markdown support is also false because ingestion filters only `.mdx`; either support `.md` through the same validated path or remove the claim.

### P1 — Make verification non-mutating

The current `build` calls `lint`, the timestamp writer, and `next build`; every lint subcommand runs in fix/write mode. Builds can therefore alter source before deciding whether it is valid. The timestamp script derives editorial dates from filesystem birth and modification times, which are not stable across clones, archives, or deployment systems.

Provide distinct interfaces:

- `format` / `format:check`;
- `lint` with no mutation;
- `typecheck`;
- `test`;
- `build` that only builds;
- `verify` that runs the read-only gates;
- an explicitly named authoring command if timestamp rewriting remains.

Prefer authored frontmatter dates. If automatic `updated` dates are required, derive them at build time from a stable content source without rewriting the post.

### P1 — Deepen content architecture

`getPosts(directory: string)` is a shallow module. Callers still need to know category strings, physical layout, sorting, lookup, adjacent-post semantics, and error behavior. Create one deep content-catalog module with a small interface that hides parsing, validation, ordering, lookup, navigation, and sitemap inventory. The exact interface should be designed only after the category decision below is made.

Keep the filesystem adapter internal. There is only one production data source, so a public adapter seam would be speculative. Tests should cross the same catalog interface as route callers.

Record one ADR: are categories a fixed typed registry or genuinely discovered from folders? This audit recommends folder discovery constrained by schema and static params, because it matches the starter's documented promise and eliminates duplicated routes.

### P1 — Deepen site identity and metadata

The canonical origin, brand, social text, OG paths, and deployment data are spread across `lib/og`, four route modules, the OG handler, `lib/deploy`, and the README. URL concatenation assumes `NEXT_PUBLIC_SITE_URL` ends in `/`; missing or differently formatted values produce invalid URLs such as `undefinedapi/og` or `https://example.comapi/og`.

Create one deep site-profile module that:

- validates and normalizes the canonical production origin;
- owns site name, description, locale, and social defaults;
- returns metadata for a collection or post;
- constructs URLs with `new URL()`;
- owns deploy/demo identity if that feature remains.

Route metadata should add canonical URLs, route-specific descriptions, `openGraph.url`, and article dates where applicable. Merge parent defaults rather than replacing whole `openGraph` and `twitter` objects. Replace the placeholder `"..."` description and use a branded title template such as `%s | Sylph`.

### P1/P2 — Use native SEO routes and correct link semantics

The committed `public` SEO files are stale, hard-code the template deployment, and include `/icon` as a page. Replace `next-sitemap` with:

- `app/robots.ts` returning `MetadataRoute.Robots`;
- `app/sitemap.ts` returning entries from the content catalog;
- accurate `lastModified` values from validated frontmatter;
- one validated canonical origin from the site profile.

Internal MDX links currently open a new tab and receive `nofollow` because every anchor goes through the same external-link module. Use `next/link` for internal URLs, normal same-document anchors for fragments, and `noopener noreferrer` only where an external new tab is intentional. Blanket `nofollow` is not appropriate for authored editorial links.

After canonical metadata is correct, add `BlogPosting`/`Article` JSON-LD from the same validated post data if richer search presentation matters. It should not precede the canonical and sitemap fixes.

### P2 — Preserve theming, improve its interface and accessibility

The current theme architecture is directionally good: `next-themes` is isolated below `<body>`, Radix tokens provide light/dark values, and syntax highlighting exposes both themes. Keep that shape, but repair the interface:

- resolve the React 19 provider typing issue rather than widening types;
- add accessible names and selected state (`aria-label`, `aria-pressed`) to the three icon buttons;
- fix the `ransition-all` typo;
- consider `disableTransitionOnChange` to prevent theme-change animation artifacts;
- render a stable placeholder or equally sized control before mount to avoid footer layout shift;
- honor `prefers-reduced-motion` for Framer Motion and global smooth scrolling;
- test `system`, `dark`, and `light` across reload and OS preference changes.

### P2 — Reduce client work and repair semantics

- The table-of-contents effect depends on `visibleHeadings`, so each intersection update tears down and recreates the observer. Set the observer up once and use functional state updates that preserve identity when nothing changed.
- Prefer extracting heading data during MDX processing instead of rediscovering document structure with `querySelectorAll` after hydration.
- Keep the post title as the sole page `<h1>` and author MDX content from `<h2>` downward.
- Preserve an accessible footnote section heading; a `<div>` directly under `<ol>` is invalid list structure.
- Render breadcrumbs as `<nav aria-label="Breadcrumb">` with an ordered list and `aria-current="page"`.
- Avoid mutating caller-owned arrays in `PostNavigation`; ordering belongs in the content catalog.
- Re-enable `next/image` optimization by default and use narrow `images.remotePatterns`; reserve `unoptimized` for an evidenced exception.

## Proposed target architecture

```text
app/
├── layout.tsx
├── not-found.tsx
├── robots.ts
├── sitemap.ts
├── opengraph-image.tsx
└── (posts)/
    └── [category]/
        ├── page.tsx
        └── [slug]/
            ├── page.tsx
            └── opengraph-image.tsx

lib/
├── content/
│   ├── catalog.ts       # public deep interface
│   ├── schema.ts        # validated required frontmatter
│   └── mdx.tsx          # trusted server-only rendering implementation
└── site/
    └── profile.ts       # canonical origin and metadata factories

components/
├── content/             # semantic post list/header/navigation views
└── interactions/        # small client islands: theme, active heading, optional motion
```

This is intentionally small. Do not introduce repository interfaces, dependency injection containers, or public adapters until a second real content source exists.

## Dependency hygiene

Before adding packages, audit and remove confirmed non-consumers. Tracked source currently has no imports for several direct dependencies, including `@vercel/edge`, `@vercel/functions`, `lucide` (while `lucide-react` is used), Radix dialog/dropdown packages, and multiple highlighting/remark helpers. The `fs` and `path` npm packages are browser-era shims; server code should import Node built-ins as `node:fs` and `node:path` without declaring those packages.

Classify build-only packages under `devDependencies`, align `@types/node` to the Node 24 runtime rather than blindly using the newest Node 26 types, and keep Next/React peer families upgraded together. Do not combine dependency pruning, Tailwind migration, and content architecture into one lockfile-heavy change.

## Recommended implementation sequence

### Phase 0 — Establish deterministic tooling

1. Declare Node 24 and pnpm 11 policy.
2. Record a narrow pnpm build-script allowlist for required native packages.
3. Add explicit Turbopack root handling if this repository must coexist under a parent lockfile.
4. Migrate Biome config; add ESLint flat config or remove ESLint if Biome is intentionally the only linter.
5. Split format, lint, typecheck, test, build, and verify into non-mutating commands.

**Exit:** frozen install succeeds from a clean clone and `verify` never changes tracked files.

### Phase 1 — Restore Next 16 compatibility

1. Complete the Tailwind 4 integration.
2. Fix React 19/MDX types and theme-provider typing.
3. Await route params in pages and metadata.
4. Replace the broken OG handler or make it buildable behind the native metadata convention.
5. Upgrade aligned core packages to Next `16.3.2` and React `19.2.8`.

**Exit:** typecheck, lint, and production build pass; home, guides, examples, post, icon, and OG routes return expected output.

### Phase 2 — Deepen content and route modules

1. Add validated frontmatter and fail-fast file diagnostics.
2. Build the content catalog with ordered list, lookup, adjacency, and all-entry interfaces.
3. Collapse duplicated category routes into static dynamic segments.
4. Select one MDX path and remove the other.
5. Add catalog, route-param, metadata, and malformed-content tests.

**Exit:** a new category/post needs content only, or the typed registry explicitly reports the required registration step; no route logic is duplicated.

### Phase 3 — Native metadata, SEO, and images

1. Add the validated site profile.
2. Add native OG, robots, and sitemap files.
3. Add canonical/article metadata and correct internal/external link behavior.
4. Re-enable image optimization with narrow remote patterns.
5. Delete `next-sitemap` and committed generated SEO artifacts after deployed endpoints are verified.

**Exit:** rendered head tags, OG images, `/robots.txt`, and `/sitemap.xml` are correct on the real deployment origin and reference every valid post exactly once.

### Phase 4 — Accessibility, performance, and CI

1. Repair theme, breadcrumb, heading, footnote, and list semantics.
2. Stop TOC observer churn and respect reduced motion.
3. Add CI for frozen install, check, typecheck, tests, and build.
4. Add browser checks for theme persistence, internal links, post navigation, OG endpoints, and SEO routes.

**Exit:** automated verification is green from a clean clone and the critical user journeys are proven in a production build.

## Definition of done

- `pnpm install --frozen-lockfile` succeeds under the documented Node/pnpm policy.
- `pnpm verify` is read-only and passes from a clean checkout.
- `next build` succeeds with no workspace-root, Tailwind, metadata, or route-contract warnings.
- malformed frontmatter fails with a precise filename and field message.
- all static routes, metadata files, and MDX content are derived from one catalog.
- theme controls have accessible names and work across system/light/dark states.
- internal links stay in-app; external-link behavior is intentional.
- OG images return `200`, are `1200x630`, and contain valid alt metadata.
- canonical, robots, and sitemap output use the actual deployment origin.
- no build or lint command modifies authored MDX or source files.

## Bottom line

The senior-engineering move is not a sweeping rewrite. It is four disciplined tracer bullets: **green the toolchain, deepen content, deepen site metadata, then prove accessibility/SEO in CI and a production build**. The current visual design and server-first posture are worth preserving; the duplicated knowledge and incomplete dependency migration are what need to change.
