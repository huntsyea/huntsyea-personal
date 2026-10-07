import {
  isEdgeCacheableDocument,
  isPublicDocumentPath,
} from "@/lib/public-document";

import { defineMiddleware } from "astro:middleware";

/**
 * Workers Cache is on for the whole Worker. Opt out of Astro's route cache
 * unless this is an anonymous public document. The Worker
 * (`src/worker.ts`) repeats the decision on the finished response: Astro
 * applies `Cloudflare-CDN-Cache-Control` after middleware, and a later
 * `cache.set` (the client toolbar reads the body) re-enables a cleared opt-out.
 * `context.url` is checked too, so a rewrite to a private path still opts out.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (
    isEdgeCacheableDocument(context.request, response) &&
    isPublicDocumentPath(context.url.pathname)
  ) {
    return response;
  }

  context.cache?.set(false);
  return response;
});
