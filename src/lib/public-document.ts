/** Collections with anonymous HTML at `/{collection}` and `/{collection}/{slug}`. */
const PUBLIC_COLLECTIONS = new Set(["posts", "projects"]);

/**
 * Editor and preview signals. `astro-session` is the Astro session cookie
 * EmDash uses for admin login; `emdash-edit-mode` is the visual-editing cookie.
 */
const PRIVATE_COOKIES = ["astro-session", "emdash-edit-mode"] as const;

/**
 * Paths whose anonymous HTML may be stored in Workers Cache.
 * Keep this aligned with the public `routeRules` in `astro.config.mjs`.
 */
export function isPublicDocumentPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/" || path === "/favorites") return true;

  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 1 && parts.length !== 2) return false;
  return PUBLIC_COLLECTIONS.has(parts[0] ?? "");
}

export function hasPrivateCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return PRIVATE_COOKIES.some((name) =>
    new RegExp(`(?:^|;\\s*)${name}=`).test(cookieHeader),
  );
}

/** GET/HEAD of a public document with no login, preview, or edit signal. */
export function isAnonymousPublicDocument(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (request.headers.has("authorization")) return false;
  if (hasPrivateCookie(request.headers.get("cookie"))) return false;

  const url = new URL(request.url);
  if (url.searchParams.has("_preview") || url.searchParams.has("_edit"))
    return false;
  return isPublicDocumentPath(url.pathname);
}

/**
 * Anonymous 200s with no `Set-Cookie` are the only responses Workers Cache
 * may store. `Set-Cookie` is checked on the response, not the request.
 */
export function isEdgeCacheableDocument(
  request: Request,
  response: Response,
): boolean {
  return (
    response.status === 200 &&
    !response.headers.has("set-cookie") &&
    isAnonymousPublicDocument(request)
  );
}

const SHARED_CACHE_HEADERS = [
  "Cloudflare-CDN-Cache-Control",
  "CDN-Cache-Control",
  "Cache-Tag",
] as const;

/**
 * Drop shared-cache directives. Astro writes them after middleware, and
 * `Cloudflare-CDN-Cache-Control` outranks `Cache-Control`, so a private
 * response that still carries `public` would be stored.
 * An existing `public`, `private`, or `no-store` Cache-Control is kept
 * (robots, sitemap, social cards). Anything else becomes `private, no-store`,
 * including Astro's `no-cache`, which Workers Cache is allowed to store.
 */
export function forbidSharedCache(response: Response, pathname = ""): Response {
  const headers = new Headers(response.headers);
  for (const name of SHARED_CACHE_HEADERS) headers.delete(name);

  const cacheControl = headers.get("cache-control") ?? "";
  const keepsExplicitPolicy =
    !pathname.startsWith("/_emdash") &&
    /\b(?:public|private|no-store)\b/.test(cacheControl);
  if (!keepsExplicitPolicy) {
    headers.set("Cache-Control", "private, no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
