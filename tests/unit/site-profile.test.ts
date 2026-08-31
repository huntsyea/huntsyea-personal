import {
  createPostDescription,
  createSiteMetadata,
  createSiteProfile,
  getCanonicalSiteUrl,
  getSiteUrl,
} from "@/lib/site/profile-core";

import { describe, expect, it } from "vitest";

describe("site profile", () => {
  it("normalizes a canonical origin and creates absolute route URLs", () => {
    const profile = createSiteProfile("https://example.com/");

    expect(profile).toMatchObject({
      name: "huntsyea",
      description: "I like to build and tinker with AI.",
    });
    expect(profile.url.toString()).toBe("https://example.com/");
    expect(getSiteUrl(profile, "/posts/getting-started").toString()).toBe(
      "https://example.com/posts/getting-started",
    );
  });

  it.each([
    undefined,
    "not a URL",
    "ftp://example.com",
    "https://example.com/docs",
    "https://example.com/?preview=true",
    "https://example.com/#about",
  ])("rejects an invalid canonical origin: %s", (siteUrl) => {
    expect(() => getCanonicalSiteUrl(siteUrl)).toThrow(/SITE_URL/i);
  });

  it("creates complete canonical article metadata", () => {
    const profile = createSiteProfile("https://example.com");
    const metadata = createSiteMetadata(profile, {
      title: "Getting Started",
      description: "Set up your publishing site.",
      path: "/posts/getting-started",
      type: "article",
      publishedTime: "2024-01-01T00:00:00.000Z",
      modifiedTime: "2024-01-02T00:00:00.000Z",
    });

    expect(metadata.alternates?.canonical).toEqual(
      new URL("https://example.com/posts/getting-started"),
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: new URL("https://example.com/posts/getting-started"),
      title: "Getting Started | huntsyea",
      publishedTime: "2024-01-01T00:00:00.000Z",
      modifiedTime: "2024-01-02T00:00:00.000Z",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Getting Started | huntsyea",
    });
  });

  it("keeps post descriptions route-specific when optional copy is absent", () => {
    const profile = createSiteProfile("https://example.com");

    expect(
      createPostDescription(profile, {
        category: "posts",
        title: "A Distinct Post",
      }),
    ).toBe("Read A Distinct Post in posts on huntsyea.");
    expect(
      createPostDescription(profile, {
        category: "posts",
        title: "A Distinct Post",
        summary: "An authored summary.",
      }),
    ).toBe("An authored summary.");
    expect(
      createPostDescription(profile, {
        category: "posts",
        title: "A Distinct Post",
        summary: "An authored summary.",
        seoDescription: "A search-specific summary.",
      }),
    ).toBe("A search-specific summary.");
  });
});
