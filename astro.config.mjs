import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { diagramPlugin } from "@huntsyea/plugin-diagram";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

/**
 * Anonymous HTML freshness at the edge. Publishing content and saving
 * settings, menus, or taxonomies purge the EmDash cache tags on the page, so
 * the window can be long; `swr` serves the stored copy while it refreshes.
 * Paths match `isPublicDocumentPath` in `src/lib/public-document.ts`.
 */
const DAY = 24 * 60 * 60;
const publicDocument = { maxAge: DAY, swr: 7 * DAY };

const INTER_FILES = { 400: "regular", 500: "medium", 600: "semi-bold" };
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

export default defineConfig({
  site: "https://huntsyea.com",
  output: "server",
  adapter: cloudflare(),
  cache: {
    provider: cacheCloudflare(),
  },
  // EmDash reads its public origin from the Worker's EMDASH_SITE_URL variable
  // at runtime (left unset in local development so loopback hosts work).
  // Authorizing the production media route here keeps image optimization on
  // for every build, not only builds that happen to have the variable set.
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "huntsyea.com",
        pathname: "/_emdash/api/media/file/**",
      },
    ],
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
  // Inter 4, Latin subset, self-hosted. Astro emits the @font-face rules, the
  // preload, and a metric-matched fallback face that limits layout shift.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: {
        variants: [400, 500, 600].map((weight) => ({
          weight,
          style: "normal",
          display: "swap",
          unicodeRange: [LATIN],
          src: [`./src/assets/inter/${INTER_FILES[weight]}.woff2`],
        })),
      },
    },
  ],
  devToolbar: { enabled: false },
});
