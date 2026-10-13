# ADR 0004: Anonymous HTML at the Cloudflare edge

- Status: Accepted
- Date: 2026-10-07

## Context

Public HTML was rendered on every request. Responses carried no `Cache-Control`, so Cloudflare never stored them, and each document waited on D1. Hashed CSS and fonts already cache. EmDash pages already pass query `cacheHint`s to `Astro.cache.set`, and publish, unpublish, and scheduled publish already call `cache.invalidate` — none of that runs until a cache provider is configured.

Workers Cache keys by path and query string, not by host or cookie. `www` redirects to the apex in the Worker. Admin and preview HTML must not be stored, and a cached anonymous page must not be reused as an editor's personalized render.

## Decision

- Enable Workers Cache (`cache.enabled` in `wrangler.jsonc`) and Astro's Cloudflare cache provider (`cacheCloudflare()`).
- Public documents (`/`, `/favorites`, `/posts`, `/projects`, and their slugs) use route rules of `maxAge: 60` and `swr: 300`. Existing `cacheHint`s add the tags EmDash purges on write. The edge directive is `Cloudflare-CDN-Cache-Control`; browsers get `Cache-Control: no-cache` when a validator is present.
- `src/middleware.ts` calls `Astro.cache.set(false)` for every other response. That alone is not enough: Astro writes `Cloudflare-CDN-Cache-Control` after middleware, and reading the HTML body (the client toolbar) can call `cache.set` again, which re-enables the route cache. `src/worker.ts` therefore drops `Cloudflare-CDN-Cache-Control`, `CDN-Cache-Control`, and `Cache-Tag` on the finished response unless it is an anonymous 200 with no `Set-Cookie`. Responses that do not already say `public`, `private`, or `no-store` get `Cache-Control: private, no-store`, so the two-hour heuristic does not store them. This covers `/_emdash`, `?_preview`, `?_edit`, `Authorization`, the `astro-session` and `emdash-edit-mode` cookies, `Set-Cookie`, and non-200s. Routes that already send `Cache-Control: public` (robots, sitemap, social cards, Matrix discovery) keep that header.
- Document responses vary on `Host`, so the apex HTML is not served for `www`. The `www` redirect itself is `private, no-store`.
- The editor toolbar is `client`. Cached HTML is the same for every visitor and includes the Edit bootstrap. `?_edit` is a different cache key and is opted out, so the server toolbar is rendered fresh. Logged-out visitors who open `?_edit` are redirected to the canonical URL.

## Consequences

- A cache hit for anonymous HTML does not run the Worker and does not query D1. The first request after a purge, and any signed-in or preview request, still does.
- A publish deletes the tagged edge entries immediately. The 60-second freshness and five-minute stale window are the backstop when a tag is missed.
- Each deploy starts from an empty cache, because the Worker version is part of the cache key. `cross_version_cache` stays off.
- Robots, sitemap, social cards, and Matrix discovery already send `Cache-Control: public, max-age=3600`, so Workers Cache stores those too. Hashed assets keep the immutable headers they already had.
