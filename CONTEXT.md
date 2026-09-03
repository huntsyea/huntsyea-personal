# huntsyea.com domain context

## Purpose

This repository builds Hunter Yea's personal website. It renders Obsidian-authored content as a statically discoverable site with theme-aware MDX, metadata, and social cards. `content/home.md` is the homepage intro, not a Post.

## Domain glossary

### Site

The complete generated reading and portfolio experience, including pages, posts, metadata surfaces, theme behavior, and the design system. The Site's primary mode is reading: the writing is the product and contact is a secondary action. The Site descends from the Sylph starter; that lineage is history, not identity, and starter affordances are not preserved.
_Avoid_: Sylph, starter, template

### Site profile

The validated canonical identity of a Site: origin, name, description, locale, and contact links. Metadata surfaces, the header, the footer, and the home page consume the Site profile instead of assembling identity values independently.

### Contact link

A labeled outbound way to reach the author, such as email or a social profile, owned by the Site profile. Contact links are identity, not content, and are not authored in Obsidian.
_Avoid_: social link, socials

### Favorite

A curated outbound link to an external article or resource. Favorites are authored as Markdown files under `content/favorites` — not Posts, not a Category, and not part of the Content catalog. An absolute HTTP or HTTPS `href` is essential. The title, note, and group are optional. Items sort by filename.

### Category

A named collection of Posts exposed at one normalized route segment, such as posts or projects, with an optional intro. Physical content folders define Categories and must resolve to a deterministic static route inventory. A file named `index` inside a Category folder is the Category intro, not a Post.

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

### Design system

The tokens (color roles, type scale, spacing, radius, motion), the prose rhythm, and the shared primitives that every surface of the Site consumes. Surfaces express visual roles through the design system rather than through raw palette values.
_Avoid_: design language, visual language, styles, theme (when meaning the system rather than the state)

### Theme

The system, light, or dark visual state applied on top of the design system, resolving each color role to a concrete value. Theme selection persists across navigation and reloads and respects user accessibility preferences.
_Avoid_: mode, color scheme, design system (when meaning the tokens rather than the state)

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
