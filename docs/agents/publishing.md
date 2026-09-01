# Obsidian publishing

Use this procedure for posts authored in Obsidian and published to this site.

## Contract

- `/Users/huntsyea/Sylph` is the canonical authoring vault on Hunter's Mac. If it is absent, stop and ask for the vault location. Create no replacement vault.
- Author post Markdown in `/Users/huntsyea/Sylph/posts/`. Treat `content/posts/` as Enveloppe output.
- Use `/Users/huntsyea/Sylph/Templates/Post.md` for new posts.
- Use a lowercase kebab-case filename. The filename becomes `/posts/<slug>` and must be unique after case-insensitive normalization.
- Keep posts directly under `posts/`. The site ignores nested content folders.
- The page title is the only `h1`. Start authored sections at `##`.
- `share: true` makes a note eligible for Enveloppe. Set it when the post is ready to publish.

Use this frontmatter shape:

```yaml
---
title: "Post title"
summary: "One sentence for listings and metadata."
time:
  created: "2026-08-31T00:00:00.000Z"
  updated: "2026-08-31T00:00:00.000Z"
share: true
---
```

Update `time.updated` for a substantive revision. The post is ready when its filename, frontmatter, heading levels, links, and intended route are correct in the vault.

## SVG diagrams

Add a diagram when it explains a relationship or sequence more clearly than prose. Use the Pi-Fusion diagrams in `public/assets/posts/` as the palette and line-treatment reference: restrained grayscale, thin rules, system fonts, and explicit light and dark palettes. Use less text and a simpler layout for new diagrams.

### Generate the SVG

1. Create the authoring source at `/Users/huntsyea/Sylph/posts/assets/<post>-<diagram>.svg`.
2. Design the phone layout first. Prefer a short sequence or stacked rows over dense columns. At a 340-pixel rendered width, keep text near 12 CSS pixels or larger without zoom. A 760-unit viewBox therefore needs text near 27 units or larger, or a simpler composition.
3. Use a content-sized `viewBox`; 760 units is the default diagram width. Keep all geometry and text inside the viewBox with visible edge padding.
4. Give the standalone SVG an accessible name and description. Keep it deterministic and self-contained: plain SVG, embedded CSS, no scripts, remote assets, or raster data.
5. Support both site themes with `prefers-color-scheme: dark`. Use readable contrast in each theme and a system-font fallback.

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

### Deliver and embed the SVG

The vault SVG is the source. The repository SVG is its delivery copy. Enveloppe does not populate the current `/assets/posts/` URL, so merge the delivery copy before publishing the note:

```bash
cp "/Users/huntsyea/Sylph/posts/assets/<file>.svg" "public/assets/posts/<file>.svg"
xmllint --noout "/Users/huntsyea/Sylph/posts/assets/<file>.svg"
cmp "/Users/huntsyea/Sylph/posts/assets/<file>.svg" "public/assets/posts/<file>.svg"
```

Embed it with the registered MDX component. `width` and `height` must equal the SVG viewBox dimensions so Next.js reserves the correct aspect ratio. Write alt text that explains the diagram's purpose.

```mdx
<Image
  src="/assets/posts/<file>.svg"
  alt="What the diagram explains."
  width="760"
  height="480"
/>
```

`components/image/index.tsx` renders images at full content width with `height: auto`. Keep the wrapper free of a fixed height or maximum height; an overflow-clipped height crops diagrams. The link to the original asset is a convenience, not a substitute for readable embedded text. The SVG is ready when XML validation passes, the vault and delivery copies match, all content fits inside the viewBox, and the rendered diagram is legible without zoom at phone and desktop widths in light and dark themes.

Phone-only publishing supports Markdown and already-deployed assets. A new SVG requires its delivery-copy pull request to merge before the phone publishes the post.

## Preview

1. Read the note in Obsidian and check the complete body for stray text, heading order, code blocks, links, and diagram placement.
2. Open each SVG directly in light and dark mode. Check the whole viewBox; a valid XML file can still contain clipped or unreadable content.
3. For a repository asset or rendering-component change, run the relevant local checks from a clean checkout. Use `SITE_URL=https://example.com pnpm verify` for a shared component change. The preview is complete when the built route and every diagram are visually correct, not merely when the build passes.

## Publish

### From Obsidian on the phone

1. Open the ready note.
2. Open the command palette.
3. Run **Enveloppe: Upload single current active note**.

### From an agent on the Mac

Use Obsidian's official CLI instead of GUI automation:

```bash
obsidian open vault="Sylph" path="posts/<slug>.md"
obsidian command vault="Sylph" id="obsidian-mkdocs-publisher:share-one"
```

The Enveloppe command reads the active shared note, writes it to `content/posts/<slug>.md`, pushes a `Sylph-M-D-YYYY` branch, and opens a pull request against `main`. It excludes `Templates` and leaves automatic cleanup disabled. This is the publishing job; it is separate from the repository's GitHub Actions verification job.

Enveloppe is configured to merge automatically, while `verify` and Vercel remain required gates. Confirm that GitHub auto-merge is enabled on the generated pull request; Enveloppe can open a pull request without registering GitHub auto-merge. Enable it when absent with `gh pr merge <number> --auto --merge`. Preserve the required checks.

GitHub deletes merged head branches so Enveloppe can reuse its date-based branch name for another publish that day. If a date branch already has an open pull request, inspect and continue that pull request. Treat deletion of any remote branch as a confirmed destructive operation.

## Verify publication

1. Inspect the generated pull request file list. It must contain the intended post change and no unrelated content. A new static asset belongs in its preceding asset pull request.
2. Wait for `verify`, Vercel, and Vercel Preview Comments to pass. Content-only changes run the content tests; code or configuration changes run the complete verification suite.
3. Confirm the pull request merged and the production Vercel deployment for `main` completed.
4. Open `https://huntsyea.com/posts/<slug>`. Confirm the response, title, body, links, and every asset. Inspect diagrams at phone and desktop widths in light and dark themes.

Publication is complete only after the merged production route matches the Obsidian source and every referenced asset renders without clipping.
