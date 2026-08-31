# Personal site modernization report

Status: implemented and verified on 2026-08-23.

## Outcome

The personal site is now a statically generated Next.js 16 application with one validated content inventory, one canonical site profile, native App Router metadata surfaces, read-only verification, and production-browser coverage. The visual direction remains the sparse Radix-based layout; the modernization changes implementation, semantics, reliability, and accessibility.

The supported baseline is:

- Node.js 24 LTS and pnpm 11.23.0 through Corepack
- Next.js and `eslint-config-next` 16.3.2
- React and React DOM 19.2.8
- Tailwind CSS and `@tailwindcss/postcss` 4.3.3
- `next-mdx-remote` 6.0.0 and Zod 4.4.3
- TypeScript 5.9.3; TypeScript 7 remains a separate migration

The research and version rationale are recorded in [the modernization research](nextjs-modernization-research.md). ESLint remains on the compatible 9.x line because the framework lint stack does not yet expose a clean ESLint 10 peer set.

## Architecture

```text
content/<category>/<post>.{md,mdx}
              |
              v
      tolerant ContentCatalog
       |         |          |
       v         v          v
 static routes  navigation  sitemap/social inventory
       |
       v
 server-only MDX renderer -> semantic article + heading outline

SITE_URL -> validated SiteProfile -> canonical/robots/sitemap/OG/deploy data
```

A private server-only Markdown source reader owns shared discovery, frontmatter parsing, route normalization, and source-relative diagnostics. `ContentCatalog`, Home, and Favorites consume that implementation detail while retaining separate public domain interfaces. The catalog discovers folder-backed categories, detects normalized route collisions, tolerates optional metadata, and owns ordering and adjacent-post references. Unsupported nested entries produce warnings and are ignored. Generic `[category]` and `[slug]` routes consume the static catalog inventory with `dynamicParams = false`; [ADR 0001](adr/0001-content-category-routing.md) records that decision.

Trusted MDX compiles through one server-only renderer. It rejects page-level headings, JavaScript expressions, and imports/exports; preserves semantic GFM footnotes; returns the table-of-contents outline from the same syntax tree; and exposes only registered content components. Client code is limited to theme state, visible-heading observation, view transitions, and optional motion/image behavior.

## Routes and metadata

The production inventory contains the home page, folder-discovered category pages, and catalog-discovered post pages. Unknown category and post values return the custom 404. Every indexable route has one page-level heading, a canonical URL, a route-specific description, Open Graph/Twitter metadata, and a generated social image.

Native `robots.ts`, `sitemap.ts`, and `opengraph-image.tsx` files replace committed crawler files, `next-sitemap`, and the query-string image API. Social cards use a bundled Inter font, meaningful alternate metadata, PNG output, and a 1200 by 630 canvas. Post cards use current catalog identity and authored dates when available. Content images use the Next.js optimizer, authored dimensions, responsive `sizes`, and a narrow remote pattern.

## Theme and accessibility

System, dark, and light themes retain the Radix palette and persist through navigation and reloads. Controls have accessible names and selected state, reserve the same footprint before hydration, follow live OS preference changes, and work from the keyboard. Meaningful text is not hidden behind an opacity animation. Reduced-motion preferences disable smooth scrolling and optional motion at both CSS and component boundaries.

Breadcrumbs are semantic navigation lists with current-page state. Category results are lists, posts are articles with semantic dates, authored sections begin below the route-owned `h1`, and the table of contents uses one observer with identity-preserving functional state.

## Verification

`SITE_URL=https://example.com pnpm verify` is the complete read-only gate:

1. Prettier check
2. Stylelint and framework-aware ESLint
3. TypeScript without emit
4. Vitest domain tests
5. Next.js production build
6. Playwright against `next start`

The browser suite verifies the current public route inventory, useful 404s, canonical and social metadata, sitemap/robots inventory, the generated home card, theme persistence and pre-hydration layout, reduced-motion preferences, axe accessibility, keyboard behavior, and portable home baselines. Domain tests cover content normalization, rendering, links, images, and future Category and Post behavior without requiring demo content to remain public. CI installs from the frozen lockfile on Node 24/pnpm 11 and fails if verification rewrites the checkout. Code and configuration changes run the complete top-level command. Changes confined to `content/` run the content domain tests, while the required Vercel check performs the production build.

## Known framework behavior

Next.js 16.3.2 logs `Internal: NoFallbackError` when an intentionally ungenerated `dynamicParams = false` path returns its correct 404. The site keeps the static route constraint because the HTTP status and custom not-found behavior are verified; the noisy message matches the open upstream report [vercel/next.js#87738](https://github.com/vercel/next.js/issues/87738). Removing the constraint would trade a cosmetic framework log for request-time dynamic route generation and would violate the catalog architecture.

## Deferred work

- TypeScript 7 and non-LTS Node type declarations
- ESLint 10 after the Next.js lint peer family supports it cleanly
- CSS-first Tailwind configuration after the temporary JavaScript bridge is no longer needed
- A content adapter only if a second real content source is introduced

The originating requirements remain in [the modernization specification](specs/modernize-sylph.md); the pre-change evidence remains in [the architecture audit](sylph-modernization-audit.md).
