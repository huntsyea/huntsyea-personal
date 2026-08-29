# ADR 0001: Folder-discovered static content routes

- Status: Accepted
- Date: 2026-08-23
- Supersedes: duplicated `guides` and `examples` route implementations

## Context

Sylph documented category creation as folder-driven, but its App Router implementation duplicated category and post modules for each known category. Filesystem discovery, ordering, lookup, navigation, metadata, and route inventory could therefore disagree. Earlier ingestion also converted read or parse failures into missing posts.

The starter has one real content source: trusted files committed under the repository. A public storage adapter would add indirection without a second implementation.

## Decision

- Authored posts live under `content/<category>/<slug>.mdx` or `.md`.
- Route-safe category and post slugs are discovered and validated at build time by one `ContentCatalog` module.
- `app/(posts)/[category]` and `[slug]` are the only category and post route implementations.
- Both segments use catalog-backed `generateStaticParams` and `dynamicParams = false`.
- The catalog owns deterministic ordering, lookup outcomes, adjacent navigation, and the complete route/sitemap inventory.
- Unknown categories and posts are explicit lookup outcomes translated to `notFound()` by routes. Empty categories remain valid. Ingestion failures propagate and fail verification.
- Post and Category filesystem access stays private to `ContentCatalog`. Favorites use a separate server-only reader because they are neither Posts nor Categories. The public factory accepts a fixture root for tests but is not an adapter interface.
- Trusted MDX is compiled on the server through one renderer. Authored post sections begin below the route-owned `h1`; MDX imports, exports, and JavaScript expressions are unsupported.

## Consequences

- Adding a category requires adding only a validated content folder; route and metadata code is reused.
- Every route, navigation surface, sitemap entry, and post Open Graph image consumes the same inventory.
- Invalid content fails early with source-specific diagnostics instead of disappearing.
- Categories are static deployment inputs. Request-time filesystem traversal and remote/user-authored MDX are intentionally unsupported.
- A content adapter abstraction should be introduced only if a second real source is added and its requirements are known.

<!--
Change log
- 2026-08-29: Clarified filesystem ownership after PR #1 added markdown-authored Favorites through a separate server-only reader.
-->
