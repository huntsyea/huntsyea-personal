# Repository agent instructions

This is an Astro site with EmDash CMS, deployed to Cloudflare Workers (D1 database, R2 media). Site content lives in EmDash, not in this repository: edit it in the admin at `/_emdash/admin`, or through the EmDash CLI or MCP server. The Obsidian vault `Sylph` is a read-only archive of the content before the migration; do not publish from it.

## Agent skills

- Use [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md) to locate and publish project work.
- Use [docs/agents/triage-labels.md](docs/agents/triage-labels.md) for issue readiness and triage states.
- Use [docs/agents/domain.md](docs/agents/domain.md) to locate the domain glossary and architecture decisions.
- Editing content: before creating or editing a post, project, favorite, page intro, image, or diagram, follow [docs/agents/publishing.md](docs/agents/publishing.md).
- EmDash: load the skills in [`.agents/skills/`](.agents/skills/) (`building-emdash-site`, `emdash-cli`, `creating-plugins`) before changing the schema, queries, or rendering. Check APIs against the EmDash docs MCP server in `.mcp.json` rather than memory.

## Rules

- Every content page is server-rendered (`output: "server"`); do not add `getStaticPaths()` for EmDash content.
- `entry.id` is the slug (URLs); `entry.data.id` is the database ID (API calls, `content` references).
- The schema lives in the database. `seed/seed.json` only seeds a new database; change a deployed schema in the admin (Content Types) or through the API, then update the seed to match.
- Never read secrets through `import.meta.env`. `EMDASH_ENCRYPTION_KEY` lives in `.env` locally and as a Worker secret in production.
