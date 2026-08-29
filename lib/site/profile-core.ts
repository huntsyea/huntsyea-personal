import type { Metadata } from "next";

const SITE_NAME = "Sylph";
const SITE_DESCRIPTION =
  "A minimal, customizable Next.js portfolio and publishing starter.";
const SITE_LOCALE = "en_US";
const DEPLOYMENT_PROFILE = {
  repositoryUrl: new URL("https://github.com/huntsyea/sylph"),
  projectName: "sylph-portfolio",
  repositoryName: "sylph-portfolio",
  redirectUrl: new URL("https://github.com/huntsyea/sylph"),
} as const;

export type DeploymentProfile = Readonly<{
  repositoryUrl: URL;
  projectName: string;
  repositoryName: string;
  redirectUrl: URL;
}>;

export type SiteProfile = Readonly<{
  name: string;
  description: string;
  locale: string;
  url: URL;
  deployment: DeploymentProfile;
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
    deployment: DEPLOYMENT_PROFILE,
  };
}

export function getDeployUrl(profile: SiteProfile): URL {
  const deployUrl = new URL("https://vercel.com/new/clone");
  deployUrl.search = new URLSearchParams({
    "repository-url": profile.deployment.repositoryUrl.toString(),
    env: "SITE_URL",
    "project-name": profile.deployment.projectName,
    "repository-name": profile.deployment.repositoryName,
    "redirect-url": profile.deployment.redirectUrl.toString(),
    "demo-title": profile.name,
    "demo-description": profile.description,
    "demo-url": profile.url.toString(),
    "demo-image": getSiteUrl(profile, "/preview.png").toString(),
  }).toString();

  return deployUrl;
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
