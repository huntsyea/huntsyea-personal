import assert from "node:assert/strict";
import test from "node:test";

import {
  forbidSharedCache,
  hasPrivateCookie,
  isAnonymousPublicDocument,
  isEdgeCacheableDocument,
  isPublicDocumentPath,
} from "./public-document.ts";

test("public document paths are the anonymous HTML routes", () => {
  assert.equal(isPublicDocumentPath("/"), true);
  assert.equal(isPublicDocumentPath("/favorites"), true);
  assert.equal(isPublicDocumentPath("/favorites/"), true);
  assert.equal(isPublicDocumentPath("/posts"), true);
  assert.equal(isPublicDocumentPath("/posts/a-slug"), true);
  assert.equal(isPublicDocumentPath("/projects/one"), true);
  assert.equal(isPublicDocumentPath("/_emdash"), false);
  assert.equal(isPublicDocumentPath("/_emdash/admin"), false);
  assert.equal(isPublicDocumentPath("/404"), false);
  assert.equal(isPublicDocumentPath("/robots.txt"), false);
  assert.equal(isPublicDocumentPath("/og/index.png"), false);
  assert.equal(isPublicDocumentPath("/posts/a/b"), false);
});

test("anonymous public documents exclude sessions, preview, and edit", () => {
  const home = new Request("https://huntsyea.com/");
  assert.equal(isAnonymousPublicDocument(home), true);
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/", { method: "POST" }),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/", {
        headers: { cookie: "astro-session=abc" },
      }),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/posts/hello", {
        headers: { cookie: "theme=dark; emdash-edit-mode=true" },
      }),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/posts/hello?_preview=token"),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/posts/hello?_edit=1"),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/", {
        headers: { authorization: "Bearer secret" },
      }),
    ),
    false,
  );
  assert.equal(
    isAnonymousPublicDocument(
      new Request("https://huntsyea.com/_emdash/admin"),
    ),
    false,
  );
  assert.equal(hasPrivateCookie("other=1; astro-session=abc"), true);
  assert.equal(hasPrivateCookie("astro-session-extra=1"), false);
});

test("only anonymous 200s without Set-Cookie are edge-cacheable", () => {
  const home = new Request("https://huntsyea.com/");
  const ok = new Response("hi", { status: 200 });
  assert.equal(isEdgeCacheableDocument(home, ok), true);
  assert.equal(
    isEdgeCacheableDocument(
      home,
      new Response("hi", {
        status: 200,
        headers: { "set-cookie": "astro-session=abc" },
      }),
    ),
    false,
  );
  assert.equal(
    isEdgeCacheableDocument(home, new Response("missing", { status: 404 })),
    false,
  );
  assert.equal(
    isEdgeCacheableDocument(
      new Request("https://huntsyea.com/", {
        headers: { cookie: "astro-session=abc" },
      }),
      ok,
    ),
    false,
  );
});

test("forbidSharedCache strips CDN directives that outrank Cache-Control", () => {
  const leaked = new Response("html", {
    status: 200,
    headers: {
      "Cache-Control": "no-cache",
      "Cloudflare-CDN-Cache-Control": "public",
      "Cache-Tag": "posts, astro-path:/",
      Vary: "Accept-Encoding",
    },
  });
  const stripped = forbidSharedCache(leaked, "/");
  assert.equal(stripped.headers.get("cache-control"), "private, no-store");
  assert.equal(stripped.headers.get("cloudflare-cdn-cache-control"), null);
  assert.equal(stripped.headers.get("cache-tag"), null);
  assert.equal(stripped.headers.get("vary"), "Accept-Encoding");

  const robots = new Response("user-agent: *", {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Cloudflare-CDN-Cache-Control": "no-store",
    },
  });
  const kept = forbidSharedCache(robots, "/robots.txt");
  assert.equal(kept.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(kept.headers.get("cloudflare-cdn-cache-control"), null);

  const admin = new Response("", {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=60",
      Location: "/_emdash/admin/setup",
    },
  });
  const locked = forbidSharedCache(admin, "/_emdash/admin");
  assert.equal(locked.headers.get("cache-control"), "private, no-store");
});
