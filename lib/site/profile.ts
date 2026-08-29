import "server-only";

import type { SiteMetadataInput } from "./profile-core";

import {
  createSiteMetadata as createMetadata,
  createSiteProfile,
  getDeployUrl as getProfileDeployUrl,
  getSiteUrl as getUrl,
} from "./profile-core";

export type { SiteMetadataInput, SiteProfile } from "./profile-core";

export const siteProfile = createSiteProfile(process.env.SITE_URL);
export const SITE_URL = siteProfile.url;

export function getSiteUrl(path = "/"): URL {
  return getUrl(siteProfile, path);
}

export function getDeployUrl(): URL {
  return getProfileDeployUrl(siteProfile);
}

export function createSiteMetadata(input: SiteMetadataInput = {}) {
  return createMetadata(siteProfile, input);
}
