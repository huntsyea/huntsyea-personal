# huntsyea.com domain context

## Purpose

This repository builds Hunter Yea's personal website: an Astro site that renders content from EmDash CMS on Cloudflare Workers. Everything a reader sees — posts, projects, favorites, page intros, the site title and tagline, navigation, and contact links — is edited in EmDash. The repository owns the design system, routes, and rendering.

## Domain glossary

### Site

The complete reading and portfolio experience, including pages, posts, metadata surfaces, theme behavior, and the design system. The Site's primary mode is reading: the writing is the product and contact is a secondary action. The Site descends from the Sylph starter; that lineage is history, not identity.
_Avoid_: Sylph, starter, template

### Site settings

The EmDash site settings that identify the Site: title (the site name), tagline, and canonical URL. Metadata surfaces, the header, the footer, and the home page read them instead of assembling identity values independently.
_Avoid_: site profile (the pre-migration code module)

### Contact link

A labeled outbound way to reach the author, such as email or a social profile. Contact links are the items of the EmDash menu named `contact`; a `_blank` target opens the link in a new tab.
_Avoid_: social link, socials

### Primary navigation

The EmDash menu named `primary`, rendered in the header on every route except home.

### Favorite

A curated outbound link to an external article or resource, stored in the `favorites` collection. Favorites are not Posts and have no page of their own. An absolute HTTP or HTTPS link is essential; the note is optional. A Favorite belongs to at most one Favorite group; items sort by title within a group.

### Favorite group

A term of the `favorite_group` taxonomy. The term order set in the admin is the group order on `/favorites`. Favorites without a group collect under "Other" at the end.

### Category

A named collection of Posts exposed at one route segment: `posts` or `projects`. Each Category is an EmDash collection with the same fields. A Category's optional intro is the Page intro with the same slug.

### Post

An entry in a Category collection: title, summary, Portable Text content, and an optional revised date. The publication date orders Posts newest first, with the slug breaking ties. The title is the only page-level heading, so authored sections start at Heading 2.

### Page intro

An entry in the `pages` collection whose slug names the page it introduces: `home`, `posts`, `projects`, or `favorites`. The `home` intro's SEO description is the Site's description.

### Diagram

A Portable Text block (from the in-repo `plugin-diagram`) holding a light and a dark Media Library image, alt text, and a caption. The site shows the variant that matches the active Theme. Diagrams are authored as SVG in `diagrams/` and exported to PNG pairs, because the Media Library does not accept SVG.

### Portable Text renderer

The components under `src/components/portable-text/` that render content in the Site's prose styles: heading anchors for the "On this page" outline, Diagram blocks, and Shiki-highlighted code blocks. Media Library images render through EmDash's image component as responsive WebP inside the bordered figure frame.

### Metadata surface

A search, social, or browser-discovery representation of the Site or a Post: canonical metadata and Open Graph tags (via `EmDashHead`), the generated social cards under `/og/`, the favicon, `robots.txt`, and `sitemap.xml`.

### Design system

The tokens (color roles, type scale, spacing, radius, motion), the prose rhythm, and the shared primitives that every surface of the Site consumes. Surfaces express visual roles through the design system rather than through raw palette values.
_Avoid_: design language, visual language, styles, theme (when meaning the system rather than the state)

### Theme

The system, light, or dark visual state applied on top of the design system, resolving each color role to a concrete value. Theme selection persists in local storage and respects user accessibility preferences.
_Avoid_: mode, color scheme, design system (when meaning the tokens rather than the state)

### Verification

The read-only formatting, style lint, type, and build checks (`pnpm verify`) that prove the Site from a clean checkout.

## Domain constraints

- Content is edited by trusted authors in EmDash; drafts are never visible on public routes.
- Routes are server-rendered from EmDash on every request; a published edit appears without a deploy.
- A Post route is `/<category>/<slug>`; slugs are unique within a Category.
- The canonical origin is the `url` site setting, falling back to `https://huntsyea.com`.
- New seams require a second real adapter or a demonstrated testing need; speculative adapters are avoided.
