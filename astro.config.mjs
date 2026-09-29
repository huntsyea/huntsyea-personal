import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { diagramPlugin } from "@huntsyea/plugin-diagram";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
  site: "https://huntsyea.com",
  output: "server",
  adapter: cloudflare(),
  integrations: [
    // The EmDash admin is a React app; public pages ship no React.
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
      // The public origin for passkeys, CSRF, and image optimization. Unset in
      // local development so loopback hosts work; `pnpm deploy` sets it.
      siteUrl: process.env.EMDASH_SITE_URL,
      plugins: [diagramPlugin()],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
