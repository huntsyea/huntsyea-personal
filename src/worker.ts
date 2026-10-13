import {
  forbidSharedCache,
  isEdgeCacheableDocument,
} from "@/lib/public-document";

import handler, {
  createScheduledHandler,
  PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

/** The canonical host; `www` permanently redirects here, path and query kept. */
const CANONICAL_HOST = "huntsyea.com";

/**
 * Workers Cache keys by path, not host. Tag document responses with `Vary:
 * Host` so a hit for huntsyea.com is not served on www (which must redirect).
 */
function varyOnHost(response: Response): Response {
  const current = response.headers.get("Vary");
  const alreadyVaries = current
    ?.split(",")
    .some((part) => part.trim().toLowerCase() === "host");
  if (alreadyVaries) return response;

  const headers = new Headers(response.headers);
  headers.set("Vary", current ? `${current}, Host` : "Host");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  ...handler,
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      const redirect = Response.redirect(url.toString(), 308);
      redirect.headers.set("Cache-Control", "private, no-store");
      return redirect;
    }
    return Promise.resolve(handler.fetch!(request, env, ctx)).then(
      (response) => {
        const prepared = isEdgeCacheableDocument(request, response)
          ? response
          : forbidSharedCache(response, url.pathname);
        return varyOnHost(prepared);
      },
    );
  },
  scheduled: createScheduledHandler(),
} satisfies ExportedHandler<Env>;
