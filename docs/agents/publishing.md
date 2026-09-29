# Editing and publishing content

Content lives in EmDash. Use this procedure for posts, projects, favorites, page intros, and diagrams.

## Where content lives

| Content                                                    | Where to edit it                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Posts (`/posts/<slug>`) and projects (`/projects/<slug>`)  | **Posts** and **Projects** collections                                              |
| Outbound links on `/favorites`                             | **Favorites** collection; group with **Favorite groups** (term order is page order) |
| Intro text above home, `/posts`, `/projects`, `/favorites` | **Page intros**, slug `home`, `posts`, `projects`, or `favorites`                   |
| Site name and tagline                                      | **Settings → General** (title, tagline)                                             |
| Header links and contact links                             | **Menus**: `primary` and `contact`                                                  |
| Site description (home metadata)                           | **Page intros → home → SEO description**                                            |

Locally the admin is `http://localhost:4321/_emdash/admin`; in production it is `https://huntsyea.com/_emdash/admin`.

## Write a post or project

1. Create the entry in **Posts** or **Projects**. The slug becomes the URL segment; use lowercase kebab-case.
2. Fill **Title** and **Summary**. Listings, metadata, and social cards show them.
3. Write the body in **Content**. The title is the only `h1`, so start sections at **Heading 2**; every heading builds the "On this page" outline.
4. Link to site pages with root paths such as `/favorites` or `/posts/pi-fusion`.
5. **Save** keeps a draft; drafts never appear on public routes. **Preview draft** shows the unpublished version. **Publish changes** makes it live immediately; no deploy is needed.
6. After a substantive revision, set **Revised** to show an "Updated" date. The publication date comes from the first publish; change it in the Publish panel.

From an agent, use the EmDash CLI (see the `emdash-cli` skill). Against the local dev server it signs in automatically; against production it needs `emdash login` or an `EMDASH_TOKEN`. Always read before writing so you pass the current `_rev`:

```bash
pnpm exec emdash content get posts <slug>
pnpm exec emdash content update posts <id> --rev <_rev> --draft --data '{"summary":"..."}'
pnpm exec emdash content publish posts <id>
```

## Images

Upload PNG or JPEG originals to the Media Library, not WebP. The site serves every image as responsive WebP through Cloudflare's image service, so a lossless PNG original gives the sharpest result. Export diagrams and screenshots at 2x the displayed width (1520 pixels for a full-width image).

- **Photos and screenshots:** insert an **Image** block, pick or upload the file, and add alt text and an optional caption.
- **Diagrams:** type `/diagram` to insert a **Diagram** block. Pick a **Light image** and a **Dark image**, then add alt text and an optional caption. The site shows whichever image matches the reader's theme, including the theme toggle, and downloads only that one. A missing dark image falls back to the light one.

SVG cannot be uploaded; EmDash blocks it because SVG files can carry active content.

## Diagrams

Add a diagram when it explains a relationship or sequence more clearly than prose. Author it as an SVG in `diagrams/`, export a light and a dark PNG, and upload both. The Pi-Fusion diagrams in `diagrams/` are the palette and line-treatment reference: restrained grayscale, thin rules, Inter, and explicit light and dark palettes. Use less text and a simpler layout for new diagrams.

### Draw the SVG

1. Create `diagrams/<post>-<diagram>.svg`.
2. Design the phone layout first. Prefer a short sequence or stacked rows over dense columns. At a 340-pixel rendered width, keep text near 12 CSS pixels or larger without zoom. A 760-unit viewBox therefore needs text near 27 units or larger, or a simpler composition.
3. Use a content-sized `viewBox`; 760 units is the default diagram width. Keep all geometry and text inside the viewBox with visible edge padding.
4. Keep it self-contained: plain SVG, embedded CSS, no scripts, remote assets, or raster data.
5. Give both themes readable contrast with a `prefers-color-scheme: dark` block; the exporter renders one PNG per scheme.

Start from this structure:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 480" role="img" aria-labelledby="title desc">
  <title id="title">Diagram title</title>
  <desc id="desc">What the diagram communicates.</desc>
  <defs>
    <style>
      :root { color-scheme: light dark; }
      .background { fill: #ffffff; }
      .label { fill: #171717; font: 500 16px Inter, ui-sans-serif, system-ui, sans-serif; }
      @media (prefers-color-scheme: dark) {
        .background { fill: #111111; }
        .label { fill: #ededed; }
      }
    </style>
  </defs>
  <rect class="background" width="760" height="480" />
  <!-- Diagram geometry -->
</svg>
```

### Export and upload

1. Validate it: `xmllint --noout diagrams/<file>.svg`.
2. Export the pair: `node scripts/export-diagram.mjs diagrams/<file>.svg`. It renders the SVG with the site's Inter font at 2x and writes `<file>-light.png` and `<file>-dark.png` next to it. The PNGs are not committed.
3. Open both PNGs and check the whole image; valid SVG can still be clipped or unreadable.
4. In the entry, insert a **Diagram** block and upload the two PNGs through its pickers. Write alt text that explains what the diagram shows.

To change a diagram later, edit the SVG, export again, and pick the new PNGs in the existing block.

## Preview and verify

1. Use **Preview draft** to check heading order, code blocks, links, and image placement before publishing.
2. Switch the site theme while previewing to check both diagram variants.
3. After publishing, open the live route and confirm the title, body, links, and every image at phone and desktop widths in both themes.
