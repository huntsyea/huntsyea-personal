import "server-only";

import type { SiteMetadataInput } from "./profile-core";

import {
  createSiteMetadata as createMetadata,
  createSiteProfile,
  getSiteUrl as getUrl,
} from "./profile-core";

export type { SiteMetadataInput, SiteProfile } from "./profile-core";

export const siteProfile = createSiteProfile(process.env.SITE_URL);
export const SITE_URL = siteProfile.url;

export function getSiteUrl(path = "/"): URL {
  return getUrl(siteProfile, path);
}

export function createSiteMetadata(input: SiteMetadataInput = {}) {
  return createMetadata(siteProfile, input);
}
