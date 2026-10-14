/**
 * Requests every public page once so the edge cache holds it before a reader
 * asks. A deploy starts with an empty cache (the Worker version is part of the
 * cache key), and an uncached page takes over a second to render.
 *
 * Usage: node scripts/warm-cache.mjs [origin]   (default https://huntsyea.com)
 *
 * Reads URLs from the sitemaps, plus the RSS feed, then the resized images
 * (`/_image`) each page links to. Never fails the caller: a warm-up problem
 * must not mark a successful deploy as failed.
 */

const origin = process.argv[2] ?? "https://huntsyea.com";
// Give the new version time to reach the edge, so its cache is filled.
const settleMs = Number(process.env.WARM_SETTLE_MS ?? 20_000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function locs(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function pageUrls() {
  const sitemaps = await locs(`${origin}/sitemap.xml`);
  const pages = (await Promise.all(sitemaps.map(locs))).flat();
  return [...new Set([...pages, `${origin}/rss.xml`])];
}

/** Every `/_image` URL in a page's `src` and `srcset` attributes. */
function imageUrls(html) {
  const found = html.matchAll(/\/_image\?[^"\s,]+/g);
  return [...found].map((match) => origin + match[0].replaceAll("&amp;", "&"));
}

async function warm(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: { "user-agent": "huntsyea-cache-warmer" },
  });
  const isHtml = response.headers.get("content-type")?.includes("text/html");
  const body = isHtml
    ? await response.text()
    : (await response.arrayBuffer(), "");
  const ms = Math.round(performance.now() - started);
  const status = response.headers.get("cf-cache-status") ?? "-";
  console.log(
    `${response.status} ${status.padEnd(8)} ${String(ms).padStart(5)} ms  ${url}`,
  );
  return imageUrls(body);
}

try {
  if (settleMs > 0) await sleep(settleMs);
  const urls = await pageUrls();
  console.log(`Warming ${urls.length} URLs on ${origin}`);
  // Sequential and small: this is a personal site, not a load test.
  const images = new Set();
  for (const url of urls) {
    try {
      for (const image of await warm(url)) images.add(image);
    } catch (error) {
      console.log(`failed ${url}: ${error.message}`);
    }
  }
  console.log(`Warming ${images.size} resized images`);
  for (const url of images) {
    try {
      await warm(url);
    } catch (error) {
      console.log(`failed ${url}: ${error.message}`);
    }
  }
} catch (error) {
  console.log(`Cache warm-up skipped: ${error.message}`);
}
