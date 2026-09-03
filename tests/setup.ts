/**
 * Shared test setup belongs here so module tests do not each install their own
 * environment shims. Keep this file intentionally small: tests should assert
 * public seams rather than component or parser implementation details.
 */

// Modules that consume the Site profile (for example the favorites reader, via
// `lib/favorites`) import the validated `siteProfile` instance, which requires
// a canonical origin. Default it here so those seams are testable unmodified.
process.env.SITE_URL = process.env.SITE_URL ?? "https://example.com";
