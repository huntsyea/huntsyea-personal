# Site review and design-system normalization plan

**Review date:** 2026-09-02
**Scope:** Next.js best practices, theme and token architecture, typography, spacing, interaction states, shell and navigation, motion, client-bundle budget.
**Change policy:** report and plan only. No source files were changed.
**Rebase note (2026-09-03):** the review ran on a branch cut before the rebrand and post-typography commits landed on `main`. Findings N5, the deploy-button parts of N3 and N6, D2, and D9 are already fixed on `main` and are marked as such below. The remaining findings were re-checked against `main`.

## Verified baseline

Run from a clean install on this checkout:

| Gate                                                                          | Result                |
| ----------------------------------------------------------------------------- | --------------------- |
| `pnpm typecheck`                                                              | pass                  |
| `pnpm lint` (stylelint + eslint)                                              | pass                  |
| `pnpm test`                                                                   | 47 unit tests pass    |
| `pnpm build` with `SITE_URL` set                                              | pass, 17 static pages |
| Impeccable mechanical detector over `app`, `components`, `mdx-components.tsx` | no findings           |

Built CSS bundle inspection (`.next/static/chunks/*.css`, 35 KB):

- `h1`–`h6` resolve to `font-size: inherit`. Every heading renders at body size.
- 27 `.article …` rules are emitted. Nothing in the app applies the `.article` class.
- 199 `!important` declarations, mostly from `important: true` in the legacy Tailwind config.
- Three full Radix scales (gray, pink, yellow, each with dark and alpha variants) ship. Pink is used for text selection only. Yellow is used for a highlight rule that never fires and one demo chip.

Client JS: 764 KB of static chunks. The largest four chunks (229 KB, 166 KB, 136 KB, 113 KB) carry React, Next runtime, `framer-motion`, and `next-view-transitions`.

## Part 1: Next.js review

### What is right

- App Router with `generateStaticParams`, `dynamicParams = false`, and a catalog-driven route inventory. Every content route is prerendered.
- Metadata is centralized in `lib/site/profile-core.ts` and consumed by `generateMetadata`, `opengraph-image.tsx`, `icon.tsx`, `robots.ts`, and `sitemap.ts`.
- `server-only` guards on the content, favorites, home, and site modules, plus a unit test that walks the client import graph and fails on server-module leaks.
- `next/font/local` with `display: swap` and a CSS variable.
- `next-themes` with a hydration placeholder that reserves the switcher's footprint, verified by an e2e test.
- Reduced-motion is honored at both the CSS layer and the component layer.
- CI runs the full read-only verify chain and fails if any gate rewrites the checkout.

### Findings

**N1. Two link primitives with different transition behavior.**
`components/link` wraps `next/link`. `breadcrumb`, `posts`, `favorites`, and `post-navigation` import `Link` from `next-view-transitions`. Links inside MDX, the not-found page, and the home "my favorites" link therefore do not view-transition while list rows do. React 19.2 and Next 16 ship a native `<ViewTransition>` API behind `experimental.viewTransition`, which removes the third-party provider and the client wrapper around the whole tree. Decide on one of: adopt the native API, or drop view transitions. Either way, one `Link`.

**N2. Tailwind v4 is running through the legacy JavaScript bridge.**
`styles/main.css` uses `@config "../tailwind.config.ts"`. The config carries 170 lines of `var(--gray-N)` colour maps that Tailwind v4's `@theme` block replaces with a namespace declaration, a `content` array v4 ignores, `important: true`, a `plugin()` for two text utilities that should be `@utility`, and two references (`--hover`, `--font-apple`) that are never defined. `postcss-nested` is redundant because Tailwind v4 handles nesting. The modernization report already lists CSS-first Tailwind as deferred work. This is the single highest-leverage cleanup because every token decision below lands in this file.

**N3. The shell is not shared.**
`app/layout.tsx` renders `<main>` only. Header, footer, and theme switcher exist solely inside the home screen component. Post and category pages have no footer, no theme control, no site name, and no route back other than the breadcrumb.

**N4. Breadcrumb derives labels from slugs on the client.**
`components/breadcrumb` uses `usePathname` and title-cases each segment, so the trail reads "Basic Writing And Formatting Syntax" while the h1 below it reads "Basic Writing and Formatting Syntax". The `(posts)` layout could render the breadcrumb on the server with real titles from the catalog, dropping a client island.

**N5. Site identity. Mostly fixed on `main`.**
The rebrand commit set the site name and description, removed the deploy profile and button, replaced the home copy, and personalized the footer. What remains: contact links are hardcoded in the home screen component instead of the site profile, and `lib/favorites.ts` hardcodes "Hunter" in the favorites description.

**N6. Client bundle carries motion libraries for cosmetic work.**
`framer-motion` powers a staggered blur-in on the home page and hover scale on images. `MDXImage` is a client component whose only behavior is a blur-until-loaded filter that `next/image` provides natively via `placeholder="blur"`. Both libraries are retained by decision (ADR 0002); the actionable part is the blur filter and the image island.

**N7. Minor.**
`.well-known/matrix/*` routes build as dynamic functions for static JSON; add `export const dynamic = "force-static"` or move them to `public/`. `package.json` engines pin Node 24 while the machine runs Node 26; only a warning today. `generateImageMetadata` in the two dynamic OG files types `params` as a plain object; the loader resolves the promise before calling it, so this is correct, but the type annotation should match the page files for consistency.

## Part 2: Where design, theme, and UX fall apart

### D1. There is no typographic scale

The system has exactly two sizes: `text-default` (14 px / 21 px) and `text-small` (12 px). Headings inherit body size and differ only by weight (500) and colour. `h2` and `h3` are styled identically (medium, muted), so section and subsection hierarchy is invisible. On a post page the title, the section heading, and the paragraph are all 14 px. Nothing in the system expresses display, heading, body, caption, or code as distinct roles.

### D2. Prose rhythm is split between CSS and the MDX map. Partly fixed on `main`.

On the reviewed branch the `.article` block never applied. `main` now applies it to the post article and wires `[data-highlight]` to table-of-contents clicks, with an e2e test guarding both. What remains: block spacing is defined twice, once in `.article` and again as `mt-6`, `my-6`, `mt-2` in `mdx-components.tsx`, plus a global `* figure { margin-top: 4px }`, so the rhythm has two owners. The home intro is not wrapped in `.article`.

### D3. Two token layers that do not line up

Semantic variables exist (`--bg`, `--fg`, `--muted`, `--border`) and are mapped into Tailwind as `background`, `foreground`, `muted`, `border`. Components then reach past them into raw palette steps 16 times: the contact buttons use `bg-gray-1 border-gray-5 text-gray-12 hover:bg-gray-2 outline-gray-8`, the theme switcher uses `bg-gray-2` and `bg-gray-4`, the table of contents uses `border-l-gray-4` and `text-gray-12`, the blockquote uses `border-gray-4`. Every one of those is a semantic role with no token: subtle surface, elevated surface, strong border, focus ring, hover surface, active surface. There is no accent colour at all. Pink exists only as selection, so links, active states, and the current heading have no colour language and rely on opacity and weight.

### D4. Spacing and radius have no scale

Values in use: `mt-1 mt-2 mt-6 mt-16 py-2 py-24 px-6 pt-8 gap-1 gap-2 gap-3`, `p-[2px] px-[2px]`, an inline-style `<Spacer>` of 24 px, `margin-top: 4px` on every figure, and 4/8/16/24/48/64 px literals inside `.article`. Radius tokens `--radius-small/base/large` exist, yet the theme switcher uses `rounded-[6px]` and `rounded-[4px]` and the demo chip uses Tailwind's `rounded-lg`. The switcher also hardcodes `w-[82px]`.

### D5. Interaction states are inconsistent

A global rule fades every `<a>` to 50 % opacity on hover, including buttons, which then override it back to 100 % and add a surface change. Theme buttons also fade. Underlines come from four different sources: the `underline` prop on `Link` (`decoration-gray-a4`), the MDX `a` mapping, a raw class on the not-found page, and none at all on list rows. There is no designed focus style; only the contact buttons declare `focus-visible`. Keyboard users get the browser default ring on lists, breadcrumb, table of contents, and the theme switcher, and lose it on anything with a transition.

### D6. The shell changes shape on every route

- Home: name, tagline, contact pills, intro, two lists, a favorites sentence, footer with theme switcher, and a floating Deploy button.
- Post: breadcrumb, article, prev/next, a fixed table of contents at `xl` only, no footer, no theme control.
- Category: breadcrumb and a list; the snapshot is 70 % empty viewport.
- Favorites: breadcrumb and grouped lists.

The table of contents is `position: fixed` at `right: 6rem`, so it floats unattached to the 640 px column and is hidden below 1280 px. `main` uses `overflow-x-hidden md:overflow-x-visible`, which is a symptom of something overflowing on mobile rather than a layout decision. The 96 px top padding applies at every width.

### D7. Theme is only half a theme

Light and dark work through Radix `.dark` scales and `next-themes`. Outside that path: the Open Graph image is hardcoded black and white, the favicon uses light-scale grays, the Deploy SVG is hardcoded `#1A1A1A`, inline code forces `bg-gray-2 !important`, and Shiki colours are wired to `--shiki-light/dark` directly rather than to site code tokens. Dark mode inherits the same missing hierarchy as light mode; there is nothing to fix that light mode does not also need.

### D8. Motion has no vocabulary

Durations and easings in use: 400 ms `[0.19, 1, 0.22, 1]`, a spring at 150/19/1.2, Tailwind's 150 ms default, 500 ms `ease` on the image blur, 500 ms on the dead highlight, and a 1 s delay on the Deploy button. The home page blurs and slides every block on every load, delaying content by 200 ms plus stagger. Blur filters on text are among the most expensive CSS effects.

### D9. Copy

Fixed on `main` except: counts baked into headings ("Posts (3)"), "3 minutes read", and the favorites sentence hardcoded in the home component.

## Part 3: Decisions (grilled 2026-09-02)

| #                 | Decision                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity          | Personal site at `https://huntsyea.com`, display name "huntsyea", full name in description and social cards. Sylph lineage is history. Deploy button and "Built with" footer go. |
| Mode              | Read. Writing is the product, contact is secondary.                                                                                                                              |
| Vocabulary        | "Design system" is the tokens, prose rhythm, and primitives. "Theme" stays the light/dark/system state. See CONTEXT.md.                                                          |
| Body size         | 14 px / 21 px. Scale: xs 11/16, sm 12/18, base 14/21, md 16/24, lg 18/26, xl 22/28, 2xl 26/32.                                                                                   |
| Heading roles     | h1 xl semibold fg, h2 lg medium fg, h3 md medium fg, h4+ base medium muted, meta sm, footnotes xs, home name 2xl.                                                                |
| Accent            | Teal (Radix). Used for link hover, current heading, selection. Yellow and pink scales removed.                                                                                   |
| Column            | 36 rem reading column; header and footer share it.                                                                                                                               |
| View transitions  | Keep, via `next-view-transitions` behind one site `Link` primitive. Page crossfade plus shared-element title morph. ADR 0002.                                                    |
| Motion            | `framer-motion` stays. Entrance fade and 8 px rise on every route, no blur. Vocabulary in `lib/motion`. ADR 0002.                                                                |
| Shell             | Header with site name, generated nav (catalog categories plus Favorites), theme control. Footer with contact links and copyright. Both on every route.                           |
| Contact links     | Owned by the Site profile in code. Home keeps the pills, footer repeats them as text links.                                                                                      |
| Breadcrumb        | Keep on content pages, server-rendered with catalog titles.                                                                                                                      |
| Counts            | Removed from headings.                                                                                                                                                           |
| Category intro    | Optional `index.md` inside the category folder, published from Obsidian. `index` is reserved.                                                                                    |
| Table of contents | In-flow sticky aside at xl; collapsed "On this page" disclosure above the article below xl.                                                                                      |
| Images            | Inline figures with captions. No raw-file link, no hover scale.                                                                                                                  |
| Home              | Name and tagline, pills, intro (favorites sentence folded into `home.md`), Posts, Projects.                                                                                      |
| Guardrail         | Unit test fails on raw palette classes, arbitrary px values, inline styles, and `next/link` imports outside the Link primitive.                                                  |
| Delivery          | One PR per phase. Visual baselines regenerate in the shell PR only.                                                                                                              |

## Part 4: Normalization plan

Ordered so that each phase leaves the verify chain green and can ship on its own. Visual baselines are regenerated once at the end of Phase 4 after a manual review, not per phase.

### Phase 0: Identity decisions (blocks everything below)

1. Done on `main`: site name, description, deploy removal, home copy, footer.
2. Move contact links and the author name in the favorites description into the site profile so components stop hardcoding them.
3. Move the favorites sentence into `content/home.md`.
4. Body size is 14 px; the type scale in Phase 1 is fixed above.
5. View transitions stay per ADR 0002.

### Phase 1: Token foundation in CSS-first Tailwind

Create `styles/tokens.css` and make `styles/main.css` import it. Delete `tailwind.config.ts` and `postcss-nested`. Drop `important: true`.

**Primitives.** Import only what the semantic layer references: gray and teal (light, dark, alpha). Delete pink and yellow.

**Semantic colour tokens** (declared on `:root` and overridden on `.dark`, exposed through `@theme inline` so they become `bg-*`, `text-*`, `border-*` utilities):

| Token                     | Light                | Role                                           |
| ------------------------- | -------------------- | ---------------------------------------------- |
| `--color-bg`              | gray-1               | page                                           |
| `--color-bg-subtle`       | gray-2               | hover surface, inline code, switcher track     |
| `--color-bg-elevated`     | gray-3               | active segment, kbd                            |
| `--color-fg`              | gray-12              | primary text                                   |
| `--color-fg-muted`        | gray-11              | secondary text, meta                           |
| `--color-fg-subtle`       | gray-10              | tertiary, placeholder, counters                |
| `--color-border`          | gray-4               | dividers, list rules                           |
| `--color-border-strong`   | gray-6               | button borders, table cells                    |
| `--color-accent`          | accent-9             | links on hover, current heading                |
| `--color-accent-fg`       | accent-11            | accent text on bg                              |
| `--color-focus`           | gray-8               | focus ring                                     |
| `--color-selection-bg/fg` | accent-3 / accent-11 | keep                                           |
| `--color-code-bg/fg`      | gray-2 / gray-12     | inline and block code; map Shiki through these |

**Type scale** as `@theme` font-size tokens with paired line heights and tracking:

| Token         | Size / line | Use                                                 |
| ------------- | ----------- | --------------------------------------------------- |
| `--text-xs`   | 11 / 16     | footnotes                                           |
| `--text-sm`   | 12 / 18     | meta lines, captions, breadcrumb, table of contents |
| `--text-base` | 14 / 21     | body                                                |
| `--text-md`   | 16 / 24     | h3                                                  |
| `--text-lg`   | 18 / 26     | h2                                                  |
| `--text-xl`   | 22 / 28     | h1 on posts and category pages                      |
| `--text-2xl`  | 26 / 32     | home name                                           |

Heading roles: h1 `xl` semibold fg; h2 `lg` medium fg; h3 `md` medium fg; h4+ `base` medium muted. Apply in `@layer base` so raw markdown headings get the scale without utility classes.

**Spacing.** Keep Tailwind's 4 px grid and name the rhythm: `--space-stack: 1.5rem` (prose block gap), `--space-section: 3rem`, `--space-page: 4rem` mobile / `6rem` desktop. Delete `Spacer`, inline styles, and every arbitrary `[Npx]` value.

**Radius.** Keep `--radius-sm/md/lg` at 4/8/12 and remove arbitrary radii and `rounded-lg`.

**Motion.** `lib/motion` exports durations (fast 150 ms, base 250 ms, entrance 400 ms), the `[0.19, 1, 0.22, 1]` easing, and the fade-and-rise variants for framer-motion. CSS mirrors only the two durations it needs for transitions. Keep the reduced-motion block.

**Focus.** One global `:focus-visible` rule using `--color-focus` with a 2 px offset ring. Remove the global `a:hover { opacity: 0.5 }`; hover becomes a colour or underline change per link variant.

**Guardrail.** Add a unit test alongside `client-boundary.test.ts` that fails when `app/` or `components/` contain raw palette classes (`gray-N`, `pink-N`, `yellow-N`), arbitrary pixel values, or inline `style` props outside the OG and icon generators.

### Phase 2: Prose layer

1. Rename `.article` to `.prose`, apply it to the post `<article>` and the home intro, and make it the single owner of vertical rhythm using `--space-stack`. Update the post-styles e2e selector.
2. Move block spacing out of `mdx-components.tsx`; the mappings keep only structure and semantics (tables, footnote refs, images).
3. Keep `[data-highlight]`; route its colours through the accent role.
4. Style footnotes, blockquotes, tables, `kbd`, and inline code from tokens.
5. Route Shiki through `--color-code-*` and drop the `!important` on inline code.

### Phase 3: Primitives

Extract only what is used three or more times with the same intent:

- `Link`: one component over the `next-view-transitions` link with variants `inline` (underline, accent on hover), `nav` (muted, fg on hover), `quiet` (no decoration, row links). It is the only importer of the library and of `next/link`. Row and heading titles carry matching view-transition names for the shared-element morph.
- `EntryList` and `EntryRow`: `Posts` and `Favorites` render the same bordered row list; share it. Row takes a title, an optional trailing meta, and an optional caption.
- `SectionHeading`: title only, used by both lists. Counts are removed.
- `Meta`: the dot-separated metadata line on posts.
- `SegmentedControl`: the theme switcher, sized by content rather than `w-[82px]`.
- `Pill`: the contact links on the home page, built on `Link` and the same surface tokens as `SegmentedControl`.

### Phase 4: Shell

1. `app/layout.tsx` renders `SiteHeader` (name, nav to Posts, Projects, Favorites, theme control) and `SiteFooter` on every route. `main` owns content only.
2. Breadcrumb becomes a server component in `app/(posts)/layout.tsx` that receives titles from the catalog.
3. Table of contents moves from `fixed` into a two-column grid at `xl` with the aside sticky beside the article; below `xl` it becomes a collapsed "On this page" disclosure above the article.
4. Category pages render an optional intro from `content/<category>/index.md`; the catalog treats `index` as the Category intro, not a Post.
5. Remove `overflow-x-hidden` on `main` after finding what overflows (likely the fixed TOC or a wide `pre`).
6. Reduce top padding on mobile to `--space-page`.

Regenerate visual baselines here, after a manual pass in light and dark at 375 px and 1280 px.

### Phase 5: Motion and images

1. Move all animation values into `lib/motion` and apply the entrance fade-and-rise on every route through the shared shell. Remove the blur filter.
2. Make `MDXImage` a server-rendered figure with caption. No raw-file link, no hover scale.
3. Record chunk sizes before and after in the modernization report; the motion dependencies are retained by ADR 0002.

### Phase 6: Documentation

1. Write `DESIGN.md` from the token file so future work has a source of truth. The Impeccable `document` command can generate the first draft.
2. Update `README.md` architecture notes and `docs/modernization-report.md` to remove the deferred Tailwind item.

## Sequencing summary

| Phase               | Depends on            | Ships alone               | Risk   |
| ------------------- | --------------------- | ------------------------- | ------ |
| 0 Identity          | nothing               | yes                       | low    |
| 1 Tokens            | 0 (body size, accent) | yes, visual diff expected | medium |
| 2 Prose             | 1                     | yes                       | low    |
| 3 Primitives        | 1                     | yes                       | low    |
| 4 Shell             | 3                     | yes, baselines regenerate | medium |
| 5 Motion and images | 3 (Link primitive)    | yes                       | low    |
| 6 Docs              | 1 to 5                | yes                       | none   |
