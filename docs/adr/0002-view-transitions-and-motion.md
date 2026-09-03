# ADR 0002: Library-backed view transitions and motion

- Status: Accepted
- Date: 2026-09-02

## Context

The site wants shared-element view transitions (a post title in a list morphs into the post heading) and entrance and hover motion on every route. React 19.2 and Next 16 expose a native `<ViewTransition>` API, but it is still behind `experimental.viewTransition`. `next-view-transitions` is the same author's polyfill for that API. `framer-motion` is the incumbent motion library and the maintainer's preferred tool for this work. Both are client-side dependencies with measurable bundle cost.

## Decision

- View transitions stay, implemented with `next-view-transitions`, and are limited to a page crossfade plus shared-element title transitions.
- Every internal navigation goes through one site `Link` primitive. It is the only module that imports the library, so moving to the native API later is a one-file change.
- `framer-motion` stays as the motion layer. Entrance motion is a short fade and rise with no blur filter, applied on every route. Durations, easings, and variants live in one `lib/motion` module and nothing defines its own.
- Reduced-motion preferences disable entrance and hover motion at both the CSS and component boundaries.

## Consequences

- The client bundle deliberately carries two motion dependencies; the trade is accepted for the transition and motion quality the maintainer wants.
- Adopting the native React API is expected once it leaves experimental status and supersedes the library half of this decision.
- Components that reach for `next/link` or ad-hoc animation values are defects against this decision.
