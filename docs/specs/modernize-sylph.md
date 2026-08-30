# Modernize Sylph into a verified Next.js 16 publishing starter

> Content-ingestion requirements in this historical modernization specification were superseded by [Issue #5](https://github.com/huntsyea/huntsyea-personal/issues/5) on 2026-08-30. Physical Obsidian paths are canonical, route names normalize deterministically, post metadata is optional, and only unsafe or unreadable content conditions stop publishing.

## Problem Statement

As a Sylph adopter or maintainer, I expect the starter to install reproducibly, pass its own checks, build successfully on its documented framework versions, and generate correct content, theme, search, and social experiences. Today the repository advertises a modern Next.js, React, Tailwind, MDX, SEO, and theming baseline, but the dependency-only major upgrade left the Site in a non-buildable and unverified state. Content behavior is duplicated across routes and screens, invalid Posts can disappear silently, build commands rewrite authored files, Metadata surfaces can publish invalid or stale URLs, and accessibility-critical interactions are not proven.

## Solution

Modernize Sylph through a sequence of independently verifiable tracer bullets. First establish deterministic, read-only Verification and restore a green Next.js 16 and Tailwind 4 baseline. Then deepen the Content catalog and Site profile so all routes, Posts, navigation, and Metadata surfaces consume one validated source of truth. Consolidate the MDX renderer, move search and social output to native App Router conventions, preserve the existing visual identity while improving Theme and document accessibility, restore image optimization, and enforce the result with module-level tests, production-route tests, browser tests, and CI.

The completed Site will let an author add trusted Post content without duplicating route logic, let a deployer configure one canonical origin, let visitors and crawlers receive correct semantic output, and let a maintainer prove the entire starter from a clean checkout without mutating source files.

## User Stories

1. As a new adopter, I want a frozen dependency installation to succeed on the documented runtime, so that I can evaluate Sylph from a clean clone.
2. As a new adopter, I want the repository to declare its supported Node and pnpm versions, so that local and CI environments use the same toolchain.
3. As a maintainer, I want dependency build scripts to use a narrow reviewed allowlist, so that native packages work without weakening supply-chain protections.
4. As a maintainer, I want one read-only Verification command, so that passing checks prove the checkout without changing it.
5. As a contributor, I want formatting and formatting checks to be separate commands, so that CI reports drift instead of silently rewriting my work.
6. As a contributor, I want linting, type checking, testing, and building to be independently runnable, so that failures are precise and fast to diagnose.
7. As a deployer, I want a production build to pass with the documented Next.js and React versions, so that package declarations correspond to deployable behavior.
8. As a designer, I want the Tailwind 4 migration to preserve the existing Radix token palette, typography, spacing, and responsive layout, so that modernization does not redesign the Site.
9. As a visitor, I want system, light, and dark Themes to remain visually coherent, so that the Site respects my preference.
10. As a returning visitor, I want my Theme selection to persist across navigation and reloads, so that the interface remains predictable.
11. As a screen-reader user, I want each Theme control to have an accessible name and selected state, so that I can understand and operate it.
12. As a motion-sensitive visitor, I want animations and smooth scrolling to respect reduced-motion preferences, so that the Site remains comfortable to use.
13. As a Post author, I want malformed frontmatter to fail with the exact source path, so that publishing mistakes are visible before deployment.
14. As a Post author, I want optional metadata to have documented defaults, so that ordinary Markdown can be rendered and indexed safely.
15. As a Post author, I want authored creation and update dates to remain stable when present, so that builds do not rewrite editorial history.
16. As a Post author, I want supported Markdown and MDX extensions to match the documentation, so that content is never silently omitted.
17. As a Post author, I want to add a Category without copying route and metadata implementations, so that the publishing model scales predictably.
18. As a maintainer, I want Categories and Posts to be discovered through one Content catalog, so that route inventory, navigation, and Metadata surfaces cannot disagree.
19. As a maintainer, I want the Content catalog to own ordering and adjacent-Post behavior, so that screens do not mutate or re-sort caller-owned data.
20. As a maintainer, I want missing Categories and Posts to have explicit outcomes, so that an empty collection is distinguishable from ingestion failure.
21. As a visitor, I want every valid Category and Post to have a deterministic static route, so that navigation and sharing are reliable.
22. As a visitor, I want unknown Category and Post routes to return a useful not-found experience, so that broken links do not fall through to a generic response.
23. As a visitor, I want each Category page to have a clear heading and semantic Post list, so that the page is understandable to assistive technology and search engines.
24. As a visitor, I want each Post to have one page-level heading and a logical heading hierarchy, so that the document outline is clear.
25. As a keyboard user, I want breadcrumbs to use navigation and current-page semantics, so that route context is perceivable without visual styling.
26. As a visitor, I want internal links to navigate in the same tab through the App Router, so that reading flow is not interrupted.
27. As a visitor, I want external links to open a new tab only when intentionally configured, so that link behavior is predictable.
28. As a content author, I want trusted MDX to render through one supported server-side path, so that custom elements, highlighting, and content behavior remain consistent.
29. As a maintainer, I want the MDX renderer to produce semantic footnotes without DOM rewriting, so that accessibility does not depend on generated selector internals.
30. As a reader, I want the table of contents to highlight visible sections without observer churn or flicker, so that long Posts remain easy to navigate.
31. As a maintainer, I want interactive MDX behavior isolated to small client islands, so that most content remains server-rendered and ships less client JavaScript.
32. As a deployer, I want one validated Site profile, so that canonical, social, sitemap, robots, and deploy metadata use the same identity.
33. As a deployer, I want production origin configuration to reject invalid URLs, so that the Site never emits malformed canonical or social links.
34. As a search crawler, I want canonical metadata and route-specific descriptions for every indexable page, so that the correct page identity is discoverable.
35. As a search crawler, I want robots and sitemap output generated from the current Content catalog, so that stale files and metadata assets are not indexed as pages.
36. As a social visitor, I want every shared Site, Category, and Post URL to return a valid Open Graph card, so that shared content is recognizable.
37. As a social visitor, I want Open Graph images to use a conventional aspect ratio, correct content type, accessible alternate text, and current Post identity, so that cards render consistently.
38. As a visitor, I want content images to be responsive and optimized by default, so that pages load quickly without layout shift.
39. As a security-conscious maintainer, I want remote image access restricted to explicit origins and paths, so that the image optimizer cannot fetch arbitrary resources.
40. As a maintainer, I want unused direct dependencies and Node shim packages removed, so that the installation and update surface stays small.
41. As a maintainer, I want framework, React, MDX, and type packages upgraded in compatible families, so that “latest” does not introduce peer-version drift.
42. As a maintainer, I want TypeScript 7 handled separately from this modernization, so that an unrelated compiler-major migration does not obscure Next.js compatibility work.
43. As a contributor, I want tests to assert public Content catalog and Site behavior rather than internal helper calls, so that refactors preserve confidence.
44. As a contributor, I want browser tests to exercise the production build, so that development-only behavior cannot mask deployment failures.
45. As a maintainer, I want CI to install from the frozen lockfile and run Verification on every change, so that the repository cannot silently return to a non-buildable state.
46. As an implementation agent, I want each modernization phase to have an explicit exit condition, so that work can be delivered in reviewable increments.
47. As a maintainer, I want existing issues covered by this program to remain linked, so that historical context is preserved and duplicate work is visible.
48. As a future maintainer, I want load-bearing content-routing and architecture decisions recorded, so that later reviews do not repeatedly reopen settled choices.

## Implementation Decisions

- The work will be delivered in four ordered tracer bullets: deterministic Verification, framework compatibility, content and route architecture, then Metadata surfaces/accessibility/CI. Each tracer bullet must be green before the next broadens the change surface.
- Node 24 LTS is the runtime baseline. pnpm 11 is the package manager and will be declared with an exact Corepack-compatible version. Node type declarations will align with Node 24 rather than the newest non-LTS runtime.
- The initial compatible package target is Next.js and `eslint-config-next` 16.3.2 with React and React DOM 19.2.8. MDX compiler packages remain on 3.1.1. TypeScript remains on 5.9.3 for this program.
- Tailwind moves to 4.3.3 only as part of a complete Tailwind 4 integration: the dedicated PostCSS plugin, the v4 CSS entry import, and an explicit temporary bridge for the existing JavaScript configuration. Stable design tokens and custom utilities may move to CSS-first configuration only after visual parity is proven.
- The repository will use one formatter and one JavaScript/TypeScript lint path. Prettier remains the formatter because authored MDX is a first-class source format. ESLint flat configuration with Next.js Core Web Vitals and TypeScript rules remains the framework-aware linter. Biome is removed to eliminate overlapping formatting and lint ownership. Stylelint remains for CSS-specific rules but never runs in fix mode as part of Verification.
- Verification exposes distinct read-only formatting, lint, typecheck, test, and build checks. A top-level Verification command composes them. Source-writing commands use explicit names and are never called by build or CI.
- Authored Post dates are source data. The build no longer derives or writes dates from filesystem birth or modification times.
- A pnpm build-script allowlist is explicit and limited to packages proven necessary by a clean install. Broad approval is not permitted.
- The Site remains a statically generated App Router application. Category and Post dynamic segments generate their allowed parameters from the Content catalog and reject ungenerated route values.
- Category discovery is folder-driven and schema-constrained. This makes the documented “add a Category” behavior true without allowing arbitrary request-time filesystem traversal. The decision will be recorded as an ADR.
- The Content catalog becomes the primary domain seam. Its interface owns Category discovery, Post validation, ordered summaries, Post lookup, adjacent-Post navigation, and the complete entry inventory used by Metadata surfaces. Filesystem access remains an internal implementation detail because there is only one real content adapter.
- Post frontmatter is parsed at the Content catalog seam with a tolerant runtime schema. The title defaults to the filename; creation/update timestamps, summary, author, media, and SEO fields are optional. Slug and Category are normalized from the physical content location. Invalid optional values warn and use safe defaults. Malformed frontmatter, unreadable files, unsafe routes, collisions, and rendering failures stop Verification with source-relative diagnostics.
- The Content catalog distinguishes an unknown Category, an unknown Post, an empty Category, and a content-ingestion failure. Routes translate only unknown content into not-found behavior; ingestion failures stop the build.
- Markdown support is either implemented through the same trusted rendering pipeline as MDX or removed from product claims in the same tracer bullet. Silent omission is not allowed.
- The project retains one trusted, server-only `next-mdx-remote` rendering path and upgrades it to version 6. The unused native MDX page-loader path and redundant dependencies are removed after route fixtures prove parity. User-controlled or remote untrusted MDX remains unsupported.
- The MDX renderer keeps a small external interface and returns rendered Post content plus a heading outline derived from the same syntax tree. This avoids rediscovering authored structure through browser-wide selectors.
- Default semantic footnote output is preserved and styled rather than replaced with invalid list markup and DOM-driven buttons. Fragment navigation remains native.
- Client boundaries are limited to behavior requiring browser state or events: Theme selection, visible-heading state, and optional motion. Content discovery, validation, sorting, metadata generation, and MDX compilation remain server-side.
- The Site profile becomes the second domain seam. It validates one server-side canonical origin and owns Site name, description, locale, social defaults, and deploy presentation. Metadata surfaces consume this profile rather than concatenating environment strings.
- Canonical origin configuration uses a server-only environment variable. Production Verification fails on a missing or invalid absolute URL; local development receives an explicit documented value rather than an implicit malformed fallback.
- Metadata uses App Router static metadata for Site-wide defaults and dynamic generation only where Category or Post data varies. Route-specific objects preserve Site-wide Open Graph and Twitter defaults instead of replacing them wholesale.
- Open Graph images use native metadata-file conventions, the default Node runtime, a bundled local font, a 1200 by 630 canvas, explicit alternate text, and Content catalog data. The custom query-string image handler and forced Edge runtime are removed.
- Robots policy and sitemap output use native typed metadata conventions. Sitemap entries come from the Content catalog and use authored Post update dates when available. Generated SEO files are no longer committed.
- Internal, fragment, and external links have distinct behavior. Internal routes use App Router navigation, fragment links remain same-document anchors, and external links receive new-tab and relationship attributes only when intentionally requested. Editorial links do not receive blanket `nofollow`.
- Content images use Next.js image optimization by default. Remote patterns are narrowly scoped to the demonstrated content origins and paths. Unoptimized rendering requires an explicit evidenced exception.
- The existing Theme provider and Radix token model are preserved. Theme controls expose accessible names and selected state, occupy stable layout space before hydration, and honor reduced-motion preferences. Theme-change transition suppression may be used to avoid visual flashes.
- Breadcrumbs use navigation, ordered-list, and current-page semantics. Category pages expose a page heading and semantic Post list. A Post title is the single page-level heading and authored Post sections begin below it.
- The table-of-contents observer is established once per rendered Post. State updates are functional and preserve state identity when visibility has not changed.
- Debug logging is removed from production paths. Expected failures preserve actionable context at Verification time and do not collapse into generic silent omissions.
- Unused direct dependencies, browser-era Node shims, redundant highlighting packages, and scaffolding-only runtime packages are removed only after import and build verification. Dependency cleanup is separate from the Tailwind and route changes to keep lockfile reviews understandable.
- The existing visual design, copy, and Category/Post content are preserved except where heading hierarchy, broken links, or stale documentation must change to reflect real behavior.
- Existing issues for the obsolete Next.js 15 upgrade, breadcrumbs, missing not-found pages, and the font-smoothing typo are referenced by this program. They are not automatically closed by implementation; maintainers decide closure after the relevant acceptance checks pass.

## Testing Decisions

- A good test asserts observable behavior at the highest stable seam and does not encode helper structure, private filesystem calls, component internals, or exact utility-class strings.
- The primary acceptance seam is the production-built Site served over HTTP. Route, metadata, Theme, accessibility, image, not-found, and navigation behavior is tested against this seam with Playwright.
- The lower domain seams are the Content catalog, Home, and Favorites interfaces. Vitest exercises normalization, defaults, warnings, collisions, malformed sources, valid fixture discovery, ordering, lookup, adjacency, complete inventory, unknown content, and empty Categories. Tests do not call private parsing helpers directly.
- Site profile tests assert canonical URL normalization, missing/invalid production origin failure, and complete Site/Category/Post metadata results through the public profile and metadata behavior.
- MDX renderer tests use trusted fixture Posts and assert semantic rendered output, heading outline, footnotes, internal links, external links, code highlighting markers, and custom MDX elements through the renderer interface.
- Route tests assert that the generated Category and Post inventory matches the Content catalog, valid pages return success, invalid routes return not found, and each page contains exactly one page-level heading.
- Metadata tests assert canonical URLs, descriptions, Open Graph/Twitter inheritance, article dates, robots output, and a sitemap containing every valid page exactly once while excluding metadata assets.
- Open Graph tests assert successful image responses, PNG content type, 1200 by 630 dimensions, meaningful alternate metadata, and Post-specific identity. They do not snapshot the entire binary.
- Theme browser tests cover system, light, and dark selection; persistence across navigation and reload; accessible names and selected state; stable pre-hydration layout; and OS preference changes.
- Accessibility tests combine semantic Playwright assertions with automated axe checks on the home, Category, Post, and not-found surfaces. Keyboard navigation and reduced-motion behavior receive explicit scenarios rather than relying only on automated rules.
- Visual regression screenshots cover the home, one Category, one representative Post, syntax highlighting, and the Theme control in light and dark modes. Baselines are added only after the Tailwind 4 migration has been manually accepted.
- Image tests assert responsive attributes, configured remote-origin rejection, and optimized delivery for representative local and remote Post images.
- Verification tests run the top-level Verification command from a clean checkout and assert that `git status` is unchanged afterward.
- Install verification uses the declared Node and pnpm versions, a frozen lockfile, and the reviewed native-build allowlist.
- CI runs install, formatting check, lint, typecheck, module tests, production build, and browser tests. Browser tests run against the production server, not the development server.
- Existing repository prior art is limited to manual issues: the not-found, breadcrumb, framework-upgrade, and font-smoothing issues describe expected behavior but provide no automated tests. This specification establishes the first durable test corpus.
- Every tracer bullet includes a clean-checkout Verification run. Dependency, route, or architecture changes are not considered complete based only on a local development page.

## Out of Scope

- A visual redesign, rebrand, or replacement of the existing Radix-based design language.
- A CMS, database, authentication system, comments, analytics, search backend, or other external service.
- User-authored, remote, or otherwise untrusted MDX execution.
- TypeScript 7, Node 26, React canary releases, Next.js canary releases, or other unrelated major-version experiments.
- Edge runtime optimization; the default Node runtime is the supported baseline.
- A public content-repository adapter interface before a second real content source exists.
- Internationalization, RSS/Atom feeds, pagination, full-text search, or content recommendations.
- New Post fields without an active Site, Metadata surface, or authoring requirement.
- Closing or rewriting historical GitHub issues before their behavior is proven by the implementation.
- Committing, pushing, or opening implementation pull requests as part of this specification task.

## Further Notes

- Assumption: the current visual presentation and repository-authored content are product assets to preserve, while current implementation details are not constraints.
- Assumption: Categories should be folder-discovered and statically constrained because that matches existing product documentation and removes duplicated route modules.
- Assumption: Vercel remains a supported deployment target, but the Site must build with standard Next.js behavior and must not depend on Edge-only features.
- Assumption: the canonical production origin is an explicit deploy-time configuration value and should not be inferred from request headers.
- Assumption: the two deliberate test seams are the Content catalog and the production-built Site. New seams require evidence that one of these cannot exercise the behavior.
- The latest stable version evidence and the repository audit are documented in the modernization research and architecture audit artifacts produced on 2026-08-23.
- Related source-project issues: [raphaelsalaja/sylph#4](https://github.com/raphaelsalaja/sylph/issues/4) covers breadcrumb customization, [#5](https://github.com/raphaelsalaja/sylph/issues/5) covers not-found pages, [#6](https://github.com/raphaelsalaja/sylph/issues/6) requests the now-obsolete Next.js 15 upgrade, and [#7](https://github.com/raphaelsalaja/sylph/issues/7) identifies the font-smoothing CSS typo.
- The specification is ready to decompose into ordered implementation tickets after it receives the `ready-for-agent` workflow label.
