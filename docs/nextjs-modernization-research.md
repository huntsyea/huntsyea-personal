# Next.js modernization research

**Scope:** repository-specific primary-source research only. No application, configuration, or dependency files were changed.

**Research date:** 2026-08-23 (America/Chicago). “Latest” below means the npm `latest` dist-tag returned on that date, not a prerelease or an inferred future version.

## Executive assessment

Sylph is an App Router application on a healthy modern baseline: Next `16.1.4`, React/React DOM `19.2.3`, TypeScript `5.9.3`, and Tailwind `4.1.18`. Its lockfile resolves the declared versions and uses pnpm lockfile v9. The working runtime is Node `24.16.0`, which satisfies the current Next requirement (`>=20.9.0`) and the current pnpm requirement (`>=22.13`).

The main modernization gap is **Tailwind integration**, not the Tailwind package version. The repository declares Tailwind v4 but retains the v3 PostCSS plugin (`tailwindcss`) and CSS directives (`@tailwind base/components/utilities`). Tailwind’s v4 documentation requires `@tailwindcss/postcss` and `@import "tailwindcss"`; JavaScript config files are only backward-compatible when explicitly loaded with `@config`. This should be treated as one deliberate, visually tested migration.

For SEO, the current global metadata model is sound in principle, but native App Router metadata files can replace the generated `public/robots.txt` and sitemap assets and can make route-level social cards conventional. The checked-in sitemap is dated 2024 and includes `/icon`, so it should not be treated as current content inventory.

## Version and compatibility matrix

| Area                 | Repository declaration / resolved state                                     | Latest stable on 2026-08-23        | Compatibility and modernization position                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js              | `next` `16.1.4` (exact); lockfile `16.1.4`                                  | `16.3.2`                           | Upgrade within Next 16 after testing. The registry package requires Node `>=20.9.0` and peers with React 18.2 or React 19. Use its [npm registry metadata](https://registry.npmjs.org/next) as the authoritative version/engine record.                                                                                                                       |
| React                | `react` / `react-dom` `19.2.3` (exact)                                      | `19.2.8`                           | Keep `react` and `react-dom` exactly aligned. React DOM `19.2.8` peers with React `^19.2.8`; upgrade the pair together. React 19.2 is the current documented feature release ([React release](https://react.dev/blog/2025/10/01/react-19-2); [React metadata](https://registry.npmjs.org/react); [React DOM metadata](https://registry.npmjs.org/react-dom)). |
| Next MDX integration | `@next/mdx` `^16.1.4`; lockfile `16.1.4`                                    | `16.3.2`                           | Use the matching current Next 16 release for routine maintenance. `@next/mdx` requires `@mdx-js/react` and `@mdx-js/loader` but does not declare a `next` peer, so lockstep is a practical alignment policy rather than a registry-enforced constraint ([metadata](https://registry.npmjs.org/@next%2fmdx)).                                                  |
| MDX compiler/runtime | `@mdx-js/loader`, `@mdx-js/mdx`, `@mdx-js/react` `^3.1.1`; lockfile `3.1.1` | `3.1.1`                            | Already current. Keep the three packages aligned at the same MDX release ([MDX metadata](https://registry.npmjs.org/@mdx-js%2fmdx)).                                                                                                                                                                                                                          |
| Tailwind CSS         | `tailwindcss` `^4.1.18`; lockfile `4.1.18`                                  | `4.3.3`                            | Upgrade only alongside the v4 integration migration. Tailwind v4 moves the PostCSS plugin to `@tailwindcss/postcss` and moves the default configuration model to CSS ([v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide); [metadata](https://registry.npmjs.org/tailwindcss)).                                                                    |
| TypeScript           | `5.9.3` (exact)                                                             | `7.0.2`                            | No immediate upgrade recommendation in this modernization pass: it is not required for Next 16.3. Pinning it has produced a deterministic lockfile; assess TypeScript 7 separately with its release notes and the project’s tooling. ([metadata](https://registry.npmjs.org/typescript))                                                                      |
| Node.js              | no `engines` field; observed `v24.16.0`                                     | Node 26 is Current; Node 24 is LTS | Retain Node 24 LTS as the production baseline. Node’s release policy recommends Active or Maintenance LTS for production; current Next needs at least 20.9.0 ([Node releases](https://nodejs.org/en/about/previous-releases); [Next metadata](https://registry.npmjs.org/next)).                                                                              |
| Package manager      | pnpm lockfile v9; no `packageManager` field; observed pnpm `11.2.2`         | pnpm `11.22.0`                     | Continue with pnpm, but declare the supported version through Corepack’s `packageManager` field before standardizing it. pnpm 11.22.0 requires Node `>=22.13`, satisfied by Node 24 LTS ([pnpm metadata](https://registry.npmjs.org/pnpm)).                                                                                                                   |

### Recommended version target

When a separately approved dependency update is performed, target `next` + `eslint-config-next` + `@next/mdx` `16.3.2`, `react` + `react-dom` `19.2.8`, current MDX `3.1.1`, and Tailwind `4.3.3` **only with the v4 configuration migration**. Preserve the exact TypeScript `5.9.3` pin unless a TypeScript-specific validation pass is approved. This is a conservative compatibility target: it avoids mixing major versions and respects the engine ranges published by the packages.

## Repository findings and official guidance

### 1. App Router structure and component boundaries

The application already uses `app/`, route groups, layouts, `generateStaticParams`, and Server Component pages. That matches the App Router’s file-system model, which is built on Server Components, Suspense, and Server Functions ([App Router overview](https://nextjs.org/docs/app)). Pages and layouts are Server Components by default; add `'use client'` only at the smallest interactive boundary needing state, event handlers, effects, or browser APIs. Providers should be rendered as deep as possible, rather than wrapping the document element, to preserve static optimization ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)).

The `Providers` component is already below `<body>`, which follows that guidance. Continue keeping MDX parsing, frontmatter reading, metadata generation, and post lookup server-side; keep only the animated image behavior and other browser interactions client-side.

**Next 16 migration note:** current App Router docs type dynamic `params` and `searchParams` as promises. The repository’s dynamic post pages type `params` as `Post` and access it synchronously in both the page and `generateMetadata`. Audit those route segments during the Next update and use `PageProps<'/guides/[slug]'>` / `PageProps<'/examples/[slug]'>`, or explicit `Promise<{ slug: string }>` types, then await the value. This is the documented Next 16 async request API shape ([`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata); [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)).

### 2. Tailwind CSS v4: migrate the integration, then tokens

Current repository state:

- `postcss.config.mjs` configures `tailwindcss: {}`, the v3 PostCSS plugin location.
- `styles/main.css` uses the v3 `@tailwind base`, `@tailwind components`, and `@tailwind utilities` directives.
- `tailwind.config.ts` contains the v3-style `content`, theme extensions, plugin, `important`, and `darkMode` configuration.

Tailwind v4’s official Next/PostCSS setup uses `tailwindcss`, `@tailwindcss/postcss`, and `postcss`; configures `"@tailwindcss/postcss": {}`; and imports Tailwind with `@import "tailwindcss"` ([installation](https://tailwindcss.com/docs/installation/using-postcss)). v4 discovers source files automatically and prefers CSS-first tokens with `@theme` ([v4 release](https://tailwindcss.com/blog/tailwindcss-v4)).

Use a staged migration:

1. Switch to the v4 PostCSS package and CSS import.
2. Retain `tailwind.config.ts` temporarily only by explicitly loading it with `@config` in the entry stylesheet. v4 does not automatically discover JavaScript config files; `corePlugins`, `safelist`, and `separator` are not supported in v4 ([upgrade guide](https://tailwindcss.com/docs/upgrade-guide)).
3. Move the stable design tokens and custom utilities to CSS (`@theme` / `@utility`) only after visual regression checks. Do not rewrite the configuration merely because CSS-first configuration exists.

This repository has a large Radix CSS-variable token system and a custom Tailwind plugin, so a single mechanical config deletion would be high risk. Verify dark mode, the custom `text-small`/`text-default` utilities, `important`, MDX prose/code styles, and all responsive pages before deleting any compatibility layer.

### 3. MDX: one supported rendering path and trusted content only

The repository currently configures `@next/mdx` in `next.config.mjs` while rendering post content through `next-mdx-remote/rsc` plus `remark`/`rehype` plugins in `mdx-components.tsx`. Both approaches can be valid, but they are overlapping paths for local content. The intended content model should be chosen before removing packages:

- For local, file-routed/imported MDX, `@next/mdx` is the native Next integration. It supports Server Components, requires root-level `mdx-components.tsx` in App Router, and supports global/local components and shared layouts ([Next MDX guide](https://nextjs.org/docs/app/guides/mdx)).
- For dynamically sourced MDX, keep server-only compilation/rendering and treat the source as trusted. MDX evaluates JavaScript/JSX, so user-controlled MDX must not be compiled without an explicit content-security boundary.

The current `mdx-components.tsx` is a valuable global component registry and can remain. Keep `remark-gfm`, `rehype-slug`, and code highlighting only where the selected MDX path actually consumes them. Do not enable `experimental.mdxRs` for this production modernization: Next documents the Rust MDX compiler as experimental and not recommended for production ([MDX guide](https://nextjs.org/docs/app/guides/mdx)).

`@tailwindcss/typography` is already installed. If the current hand-authored article styles become costly, Next’s MDX guidance supports applying its `prose` classes at the shared post layout—not necessarily as a replacement for the current styling ([MDX guide](https://nextjs.org/docs/app/guides/mdx)).

### 4. Metadata and SEO: native hierarchy, absolute base URL

The root metadata object correctly centralizes title, description, Open Graph, Twitter, and robots policy. Continue using static `metadata` for values that do not vary by route and `generateMetadata` only for values dependent on content or route parameters. They are Server Component exports, metadata is resolved into the relevant `<head>` tags, and file-based metadata takes precedence ([`generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)).

Repository-specific fixes to plan:

- Make the deployment URL a required, validated canonical origin for production and use it as `metadataBase`. At present it is optional, and image URLs are composed as `${NEXT_PUBLIC_SITE_URL}api/og`. That silently relies on the environment value ending in `/`; otherwise the result is `https://example.comapi/og`.
- Add route-specific `description`, canonical URL (`alternates.canonical`), `openGraph.url`, and article metadata where the MDX frontmatter provides it. The current post metadata replaces parent Open Graph/Twitter objects rather than extending them, which can drop defaults such as type, locale, and site name.
- Do not use the placeholder `"..."` description in production metadata. Make per-post summaries explicit in frontmatter or derive a bounded plain-text excerpt server-side.

### 5. Open Graph and icons: use file conventions for discoverability

`app/api/og/route.tsx` works as a custom route handler, but it is not the file-based metadata convention. For a universal site card use `app/opengraph-image.tsx`; for per-post cards colocate `opengraph-image.tsx` under the relevant dynamic segment. The latter automatically generates and inserts the appropriate image tags, supports `alt`, `size`, and `contentType`, and is cached by default unless it uses a Dynamic API or uncached data ([Open Graph image convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image); [metadata overview](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)).

The existing generated image function uses `1200x600`; for a conventional social card, use the file convention’s `size` export and a `1200x630` design. Place the dynamic function in a metadata file rather than retaining hand-assembled image URLs in every `generateMetadata` implementation. Keep the font asset small and explicitly loaded; `ImageResponse` accepts the documented TTF/OTF/WOFF formats. If retaining an Edge runtime implementation, test only supported image JSX/CSS features. The metadata-file convention also allows Node runtime when local assets require filesystem access ([Open Graph image convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)).

`app/icon.tsx` already uses the native icon convention. Keep its `size` and `contentType` exports; file-based metadata automatically serves the asset and updates the head metadata ([metadata files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)).

### 6. Robots and sitemap: replace generated checked-in artifacts

The current `next-sitemap` `postbuild` script generates `public/robots.txt`, `public/sitemap.xml`, and `public/sitemap-0.xml`. The committed sitemap dates from 2024 and currently includes `/icon`, which is a metadata asset rather than a user-facing page. The source is stale independent of whether a deployment reruns `postbuild`.

App Router has native file conventions for both:

- `app/robots.ts` returns a typed robots object and produces `/robots.txt`.
- `app/sitemap.ts` returns `MetadataRoute.Sitemap` entries; it can derive routes and `lastModified` values from the same MDX post inventory used to render pages.

The native sitemap convention supports static XML for small sites or code generation, and it is cached by default when it does not use request-time APIs ([sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)). Metadata files, including `robots.ts` and `sitemap.ts`, are first-class route conventions and are cached by default ([metadata files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)). Move to these conventions in one change, remove the `next-sitemap` build path, and verify the deployed `/robots.txt` and `/sitemap.xml` before deleting generated public files.

### 7. Images and fonts: keep the platform optimizations enabled

`app/layout.tsx` already loads Inter through `next/font/google`, which self-hosts the font at build time, avoids browser requests to Google, and reduces layout shift. Keep the loader at module scope and keep the subset declaration ([Font module](https://nextjs.org/docs/app/api-reference/components/font)).

The MDX image component calls `next/image` but sets `unoptimized` for every image. That disables the component’s automatic sizing/format/lazy-loading optimization. Prefer optimized images by default; pass `width`/`height` for remote sources (or use `fill` with a dimensioned parent), define narrow `images.remotePatterns` in Next config for allowed external URLs, and reserve `unoptimized` for a demonstrated incompatibility. Next recommends specific remote patterns to avoid overly broad image fetching ([Image optimization](https://nextjs.org/docs/app/getting-started/images)).

This preserves the benefits of the Image component: responsive size optimization, modern output formats, native lazy loading, and layout-shift prevention ([Image optimization](https://nextjs.org/docs/app/getting-started/images)).

## Proposed implementation order (not performed)

1. Add explicit `engines` and Corepack `packageManager` policy after agreeing the Node 24/pnpm 11 target; update dependencies in a dedicated lockfile-reviewed change.
2. Upgrade the aligned Next/React/MDX packages and fix Next 16 async dynamic-route props; run the production build and route checks.
3. Migrate Tailwind’s PostCSS/CSS integration to v4 with a visual regression pass; retain explicit legacy config loading until tokens/utilities are safely migrated.
4. Convert the API OG route and generated public SEO artifacts to App Router metadata files; centralize canonical URL construction; verify rendered head tags, image card URLs, `/robots.txt`, and `/sitemap.xml` on the deployed origin.
5. Re-enable `next/image` optimization by default and add restrictive remote patterns; test every MDX image and image layout.

## Primary-source index

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js MDX guide](https://nextjs.org/docs/app/guides/mdx)
- [Next.js `generateMetadata`](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js metadata and OG images guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js Open Graph image convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js metadata-file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Next.js Image optimization](https://nextjs.org/docs/app/getting-started/images)
- [Next.js Font module](https://nextjs.org/docs/app/api-reference/components/font)
- [Tailwind PostCSS installation](https://tailwindcss.com/docs/installation/using-postcss)
- [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4)
- [React 19.2 release](https://react.dev/blog/2025/10/01/react-19-2)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
- [npm registry: Next](https://registry.npmjs.org/next), [React](https://registry.npmjs.org/react), [React DOM](https://registry.npmjs.org/react-dom), [Tailwind](https://registry.npmjs.org/tailwindcss), [MDX](https://registry.npmjs.org/@mdx-js%2fmdx), [Next MDX](https://registry.npmjs.org/@next%2fmdx), [TypeScript](https://registry.npmjs.org/typescript), and [pnpm](https://registry.npmjs.org/pnpm)
