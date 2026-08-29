import {
  createPostDescription,
  createSiteMetadata,
  createSiteProfile,
  getCanonicalSiteUrl,
  getDeployUrl,
  getSiteUrl,
} from "@/lib/site/profile-core";

import { describe, expect, it } from "vitest";

describe("site profile", () => {
  it("normalizes a canonical origin and creates absolute route URLs", () => {
    const profile = createSiteProfile("https://example.com/");

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
      title: "Getting Started | Sylph",
      publishedTime: "2024-01-01T00:00:00.000Z",
      modifiedTime: "2024-01-02T00:00:00.000Z",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Getting Started | Sylph",
    });
  });

  it("creates deployment presentation from the same site profile", () => {
    const profile = createSiteProfile("https://example.com");
    const deployUrl = getDeployUrl(profile);

    expect(deployUrl.origin).toBe("https://vercel.com");
    expect(deployUrl.searchParams.get("repository-url")).toBe(
      "https://github.com/huntsyea/sylph",
    );
    expect(deployUrl.searchParams.get("env")).toBe("SITE_URL");
    expect(deployUrl.searchParams.get("demo-title")).toBe(profile.name);
    expect(deployUrl.searchParams.get("demo-description")).toBe(
      profile.description,
    );
    expect(deployUrl.searchParams.get("demo-url")).toBe("https://example.com/");
    expect(deployUrl.searchParams.get("demo-image")).toBe(
      "https://example.com/preview.png",
    );
  });

  it("keeps post descriptions route-specific when optional copy is absent", () => {
    const profile = createSiteProfile("https://example.com");

    expect(
      createPostDescription(profile, {
        category: "posts",
        title: "A Distinct Post",
      }),
    ).toBe("Read A Distinct Post in posts on Sylph.");
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
