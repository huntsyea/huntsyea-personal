# huntsyea.com domain context

## Purpose

This repository builds Hunter Yea's personal website. It renders Obsidian-authored content as a statically discoverable site with theme-aware MDX, metadata, and social cards. `content/home.md` is the homepage intro, not a Post.

## Domain glossary

### Site

The complete generated portfolio and publishing experience, including pages, posts, metadata surfaces, theme behavior, and deployment identity.

### Site profile

The validated canonical identity of a Site: origin, name, description, locale, and social defaults. Metadata surfaces consume the Site profile instead of assembling identity values independently.

### Favorite

A curated outbound link to an external article or resource. Favorites are authored as Markdown files under `content/favorites` — not Posts, not a Category, and not part of the Content catalog. An absolute HTTP or HTTPS `href` is essential. The title, note, and group are optional. Items sort by filename.

### Category

A named collection of Posts exposed at one normalized route segment, such as posts or projects. Physical content folders define Categories and must resolve to a deterministic static route inventory.

### Post

A trusted, repository-authored Markdown or MDX document with a Category, a filename-derived title, a normalized slug, optional metadata, and rendered content. Authored timestamps remain source data when present.

### Content catalog

The module that discovers Categories and Posts and owns normalization, collision detection, tolerant metadata parsing, ordering, lookup, adjacency, and the complete route inventory. Routes and metadata surfaces consume this module rather than reading the filesystem directly.

### Markdown source reader

The private server-only module shared by the Content catalog, Home, and Favorites. It discovers trusted Markdown files, parses frontmatter, derives normalized names, and reports source-relative diagnostics. It is an implementation detail, not a generic storage adapter.

### MDX renderer

The server-side module that transforms trusted Post content into the Site's semantic, theme-aware presentation. Interactive behavior is delegated to small client-side islands.

### Metadata surface

A search, social, or browser-discovery representation of the Site or a Post, including canonical metadata, Open Graph images, Twitter cards, icons, robots policy, and sitemap entries.

### Theme

The system, light, or dark visual state applied to the Site, including Radix color tokens and syntax-highlighting colors. Theme selection persists across navigation and reloads and respects user accessibility preferences.

### Verification

The read-only set of install, formatting, linting, type, test, build, route, metadata, accessibility, and browser checks used to prove the Site from a clean checkout.

## Domain constraints

- Post content is trusted and repository-authored; arbitrary user-controlled MDX is not supported.
- Physical folders and filenames are canonical publishing data. Publisher routing fields such as `path` and `category` are not domain data.
- Missing optional metadata must not block publishing. Unsafe route identities, collisions, unreadable files, malformed frontmatter, and rendering failures must block verification.
- Production routes and metadata surfaces must be deterministic from the Content catalog.
- The Site profile must provide one validated canonical production origin.
- Verification must not rewrite source code or authored Post metadata.
- New seams require a second real adapter or a demonstrated testing need; speculative adapters are avoided.
