# Design system reference

This document is the source of truth for the Site's Design system: the colour roles, type scale, spacing, radius, column and aside widths, motion vocabulary, and the shared primitives. It is generated from `styles/tokens.css` and `styles/main.css`; every value below matches the stylesheet. Vocabulary follows the glossary in `CONTEXT.md`: the Design system is the tokens, prose rhythm, and primitives; Theme is the light, dark, or system state that resolves each colour role to a concrete value.

## Colour roles

Semantic colour roles are declared on `:root` and resolve through the Radix primitives. Each role maps to a gray or teal step; the same step resolves to its dark value when the Theme class is applied, so no component reaches for a raw palette step. Roles are exposed as `bg-*`, `text-*`, and `border-*` utilities through `@theme inline`.

| Role            | Light primitive | Dark primitive | When to use                                                                     |
| --------------- | --------------- | -------------- | ------------------------------------------------------------------------------- |
| `bg`            | gray-1          | gray-1         | Page surface.                                                                   |
| `bg-subtle`     | gray-2          | gray-2         | Hover surface, the Theme switcher track.                                        |
| `bg-elevated`   | gray-3          | gray-3         | Active segment, `kbd`.                                                          |
| `fg`            | gray-12         | gray-12        | Primary text.                                                                   |
| `fg-muted`      | gray-11         | gray-11        | Secondary text, meta lines, captions, breadcrumb, table of contents.            |
| `fg-subtle`     | gray-10         | gray-10        | Tertiary text, placeholders, code line numbers.                                 |
| `border`        | gray-4          | gray-4         | Dividers, list rules, blockquote and figure borders.                            |
| `border-strong` | gray-6          | gray-6         | Button borders, table cells.                                                    |
| `accent`        | teal-9          | teal-9         | Links on hover, the current table-of-contents heading, the highlighted heading. |
| `accent-fg`     | teal-11         | teal-11        | Accent text on the page surface.                                                |
| `focus`         | gray-11         | gray-11        | The global focus-visible ring.                                                  |
| `selection-bg`  | teal-3          | teal-3         | Text selection background.                                                      |
| `selection-fg`  | teal-11         | teal-11        | Text selection foreground.                                                      |
| `code-bg`       | gray-2          | gray-2         | Inline and block code; Shiki tokens map through this role.                      |
| `code-fg`       | gray-12         | gray-12        | Inline and block code text; Shiki tokens map through this role.                 |

## Type scale

Each step pairs a size, line height, and tracking. Values are absolute pixels so they hold against the 16 px root font size, which powers Tailwind's rem-based spacing grid. The base text role (14 px / 21 px) lands on `body`, not on the root.

| Token  | Size / line | Tracking | Use                                                  |
| ------ | ----------- | -------- | ---------------------------------------------------- |
| `xs`   | 11 / 16     | 0.01 px  | Footnotes.                                           |
| `sm`   | 12 / 18     | 0.01 px  | Meta lines, captions, breadcrumb, table of contents. |
| `base` | 14 / 21     | -0.09 px | UI chrome. Prose overrides this to 16 / 26.          |
| `md`   | 16 / 24     | -0.09 px | `h3`.                                                |
| `lg`   | 20 / 28     | -0.18 px | `h2`.                                                |
| `xl`   | 28 / 34     | -0.18 px | `h1`.                                                |
| `2xl`  | 26 / 32     | -0.26 px | The home name.                                       |

### Heading roles

Applied in the base layer so raw Markdown headings inherit the scale without utility classes.

| Element | Role   | Weight   | Colour     |
| ------- | ------ | -------- | ---------- |
| `h1`    | `xl`   | semibold | `fg`       |
| `h2`    | `lg`   | medium   | `fg`       |
| `h3`    | `md`   | medium   | `fg`       |
| `h4`+   | `base` | medium   | `fg-muted` |

The home name, post titles, and category titles all use the `h1` role.

## Spacing

Tailwind's 4 px grid is retained. The rhythm is named so layout values are chosen from a list rather than invented.

| Token                  | Value | Use                              |
| ---------------------- | ----- | -------------------------------- |
| `--space-stack`        | 24 px | Prose block gap and list indent. |
| `--space-section`      | 48 px | Gap between major sections.      |
| `--space-page`         | 40 px | Page inset on mobile.            |
| `--space-page-desktop` | 96 px | Page inset on desktop.           |

### Prose rhythm

The `.prose` class is the single owner of vertical rhythm and the long-reading size (16 px / 26 px). It applies `--space-stack` as the top margin between sibling blocks, 40 px above an `h2` (12 px before the following block) and 32 px above an `h3` (8 px before the following block), and `--space-stack` as the left padding of lists. Prose links use the body colour with an `#8d8d8d` underline and `#007a69` on hover in light (`teal-11` in dark). Inline code uses the elevated surface, a 1 px border, `0.875em` type, and `0.1em 0.35em` padding.

## Radius

| Token             | Value |
| ----------------- | ----- |
| `--radius-small`  | 4 px  |
| `--radius-medium` | 8 px  |
| `--radius-large`  | 12 px |

No arbitrary radii are used.

## Column and aside widths

| Token                 | Value  | Use                                                                                                                      |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `--container-column`  | 36 rem | Reading column. Header, main, and footer use `--container-shell` (`column + 3rem`) so padding sits outside this measure. |
| `--width-column-wide` | 52 rem | The Post layout widened at `xl` to hold the table-of-contents aside beside the 36 rem column.                            |
| `--width-aside`       | 14 rem | The table-of-contents aside column in the widened Post layout.                                                           |

## Motion

All durations, the shared easing, and the entrance variants live in `lib/motion` (ADR 0002). Nothing defines its own animation values.

| Token      | Value  | Use                                                    |
| ---------- | ------ | ------------------------------------------------------ |
| `fast`     | 150 ms | Micro-interactions: hover, focus, small state changes. |
| `base`     | 250 ms | Default transitions.                                   |
| `entrance` | 400 ms | Route entrance.                                        |

- **Easing:** the shared curve `[0.19, 1, 0.22, 1]`.
- **Entrance:** `fadeAndRise` fades from `opacity: 0` to `1` and rises 8 px (`y: 8` to `0`), with no blur and no scale. It is applied through the shared shell so every route arrives the same way.
- **Reduced motion:** the CSS base layer sets transition and animation durations to `0.01 ms` and view transitions fall back to instant navigation; the `Entrance` component skips its hidden initial state via `useReducedMotion`.

## Primitives

Shared components under `components/`. Each is one line on purpose and props.

- **`Link`** — the single site link primitive and the only importer of the Link component; the providers module imports the ViewTransitions provider, and the design-system guardrail exempts exactly those two. Variants `inline` (underline, accent on hover), `nav` (muted, fg on hover), and `quiet` (no decoration, row links); handles hash, `mailto:`, `tel:`, and external targets with safe `rel`. Props: `variant`, `newTab`, `href`, `className`, `children`, `target`, `rel`.
- **`EntryList` / `EntryRow`** — the shared bordered row list used by Posts, Projects, and Favorites. `EntryRow` takes `title`, `href`, optional `trailingMeta` (a date), optional `caption` (a favorite note or hostname), and optional `category`/`slug` to qualify the shared-element view-transition name.
- **`SectionHeading`** — a list heading that is simply the collection name, without counts. Props: `title`, optional `href`, optional `asPage`.
- **`Meta`** — the Post metadata block (published, updated, read time) in the `sm` text role. Each item stacks a muted label above its value, separated by spacing alone. Props: `post`.
- **`Pill`** — the home Contact link pill, built on `Link` and sharing the surface and border roles with `SegmentedControl`. Props: `href`, `newTab`, `children`.
- **`SegmentedControl`** — the Theme switcher, sized by its content; the track uses the subtle surface role and the active segment the elevated surface role, with a pre-hydration placeholder that reserves the footprint. Props: `label`, `options`, `value`, `onSelect`.
- **`SiteShell`** — the page frame: the reading column with the route entrance, between `SiteHeader` and `SiteFooter`. Every route, including home, renders that chrome.
- **`SiteHeader`** — the shared header rendered by `SiteShell` on every route except home: the site name on the left and one nav link per catalog Category plus Favorites on the right, on one row at every width. No props; reads the Content catalog and Site profile.
- **`SiteFooter`** — the shared footer rendered by `SiteShell` on every route except home: Contact links as text links with the Theme control opposite, and a copyright line beneath. No props; reads the Site profile.
- **`Breadcrumb`** — a server-rendered navigation trail with current-page state, prefixed by Home. Props: `items`, `className`.
- **`TableOfContents`** — renders the outline twice from one visible-heading state: a sticky aside at `xl` and a native "On this page" disclosure below `xl`, with the current heading highlighted in the accent role. Props: `outline`.
- **`Entrance`** — the route entrance wrapper applying `fadeAndRise`, honouring reduced motion. Props: `children`.
