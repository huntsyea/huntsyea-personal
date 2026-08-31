import type { Metadata } from "next";

const SITE_NAME = "huntsyea";
const SITE_DESCRIPTION = "I like to build and tinker with AI.";
const SITE_LOCALE = "en_US";

export type SiteProfile = Readonly<{
  name: string;
  description: string;
  locale: string;
  url: URL;
}>;

export type SiteMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export type PostDescriptionInput = {
  category: string;
  title: string;
  summary?: string;
  seoDescription?: string;
};

export function getCanonicalSiteUrl(value: string | undefined): URL {
  if (!value) {
    throw new Error(
      "SITE_URL is required and must be the canonical site origin.",
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("SITE_URL must be a valid absolute URL.");
  }

  const hasOnlyOrigin = url.pathname === "/" && !url.search && !url.hash;
  const isSupportedProtocol =
    url.protocol === "http:" || url.protocol === "https:";

  if (!isSupportedProtocol || !hasOnlyOrigin) {
    throw new Error(
      "SITE_URL must contain only an http(s) origin, without a path, query, or hash.",
    );
  }

  return url;
}

export function createSiteProfile(siteUrl: string | undefined): SiteProfile {
  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: SITE_LOCALE,
    url: getCanonicalSiteUrl(siteUrl),
  };
}

export function createPostDescription(
  profile: SiteProfile,
  { category, title, summary, seoDescription }: PostDescriptionInput,
): string {
  return (
    seoDescription ??
    summary ??
    `Read ${title} in ${category} on ${profile.name}.`
  );
}

export function getSiteUrl(profile: SiteProfile, path = "/"): URL {
  if (!path.startsWith("/")) {
    throw new Error("Site paths must start with '/'.");
  }

  return new URL(path, profile.url);
}

export function createSiteMetadata(
  profile: SiteProfile,
  {
    title,
    description = profile.description,
    path = "/",
    type = "website",
    publishedTime,
    modifiedTime,
  }: SiteMetadataInput = {},
): Metadata {
  const url = getSiteUrl(profile, path);
  const openGraphTitle = title ? `${title} | ${profile.name}` : profile.name;

  return {
    metadataBase: profile.url,
    title: title ?? {
      default: profile.name,
      template: `%s | ${profile.name}`,
    },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: profile.locale,
      url,
      title: openGraphTitle,
      description,
      siteName: profile.name,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
