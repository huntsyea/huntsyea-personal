# ADR 0001: Folder-discovered static content routes

- Status: Accepted
- Date: 2026-08-23
- Supersedes: duplicated `guides` and `examples` route implementations

## Context

The original starter documented category creation as folder-driven, but its App Router implementation duplicated category and post modules for each known category. Filesystem discovery, ordering, lookup, navigation, metadata, and route inventory could therefore disagree. Earlier ingestion also converted read or parse failures into missing posts.

The starter has one real content source: trusted files committed under the repository. A public storage adapter would add indirection without a second implementation.

## Decision

- Authored posts live under `content/<category>/<filename>.mdx` or `.md`. Physical folders and filenames are canonical; publisher `path` and `category` fields are not domain data.
- Category and post route segments are derived at build time by one `ContentCatalog` module. Names are Unicode-normalized, lowercased, reduced to alphanumeric words separated by hyphens, and trimmed. Empty results and normalized collisions are fatal.
- `app/(posts)/[category]` and `[slug]` are the only category and post route implementations.
- Both segments use catalog-backed `generateStaticParams` and `dynamicParams = false`.
- The catalog owns deterministic ordering, lookup outcomes, adjacent navigation, and the complete route/sitemap inventory.
- Unknown categories and posts are explicit lookup outcomes translated to `notFound()` by routes. Empty categories remain valid. Unreadable files, malformed frontmatter, unsafe routes, collisions, and rendering failures propagate and fail verification.
- Post titles default to the filename. Post dates and descriptive metadata are optional. Invalid optional dates produce a source-specific warning and are ignored; other missing or unusable optional fields use their safe defaults. Dated posts sort before undated posts; the normalized slug breaks ties.
- A private server-only Markdown source reader owns shared file discovery, frontmatter parsing, normalization, and diagnostics. `ContentCatalog`, Home, and Favorites consume it while retaining separate public domain interfaces. The public catalog factory accepts a fixture root for tests but is not an adapter interface.
- Hidden and non-Markdown entries are ignored. Unsupported nested folders produce source-specific warnings and are ignored.
- Trusted MDX is compiled on the server through one renderer. Authored post sections begin below the route-owned `h1`; MDX imports, exports, and JavaScript expressions are unsupported.

## Consequences

- Adding a category requires adding only a content folder whose normalized route does not collide; route and metadata code is reused.
- Every route, navigation surface, sitemap entry, and post Open Graph image consumes the same inventory.
- Fatal content errors fail early with source-specific diagnostics. Recoverable editorial omissions remain publishable and visible as warnings.
- Categories are static deployment inputs. Request-time filesystem traversal and remote/user-authored MDX are intentionally unsupported.
- A content adapter abstraction should be introduced only if a second real source is added and its requirements are known.

<!--
Change log
- 2026-08-29: Clarified filesystem ownership after PR #1 added markdown-authored Favorites through a separate server-only reader.
- 2026-08-30: Made physical Obsidian paths canonical, added tolerant metadata defaults, and shared private Markdown-source mechanics across public content domains.
-->
