import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { diagramPlugin } from "@huntsyea/plugin-diagram";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

/**
 * Anonymous HTML freshness at the edge. Publishing purges the EmDash cache
 * tags on the page before this window ends; `swr` covers a missed purge.
 * Paths match `isPublicDocumentPath` in `src/lib/public-document.ts`.
 */
const publicDocument = { maxAge: 60, swr: 300 };

export default defineConfig({
  site: "https://huntsyea.com",
  output: "server",
  adapter: cloudflare(),
  cache: {
    provider: cacheCloudflare(),
  },
  routeRules: {
    "/": publicDocument,
    "/favorites": publicDocument,
    "/posts": publicDocument,
    "/projects": publicDocument,
    "/posts/[slug]": publicDocument,
    "/projects/[slug]": publicDocument,
  },
  integrations: [
    // The EmDash admin is a React app; public pages ship no React.
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
      // The public origin for passkeys, CSRF, and image optimization. Unset in
      // local development so loopback hosts work; `pnpm deploy` sets it.
      siteUrl: process.env.EMDASH_SITE_URL,
      // One shared HTML variant. Editors open the live toolbar with `?_edit`,
      // which stays uncached. The server-injected toolbar cannot, because the
      // edge cache ignores cookies.
      toolbar: "client",
      plugins: [diagramPlugin()],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
