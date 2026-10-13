# Georgia Young Adults

Static site for the Georgia Young Adults conference (georgiayoungadults.com), deployed on Cloudflare Workers with static assets. Pushing to `main` auto-deploys.

## Folder structure

- `public/` — all site files served by the Worker. This is the `assets.directory` configured in `wrangler.jsonc`.
  - `index.html` — the site's landing page.
  - `data/schedule.json` — conference schedule data. Each session's `start`/`end` times use full ISO 8601 with the Eastern offset (e.g. `2026-10-16T19:00:00-04:00`).
  - `_redirects` — Cloudflare redirect rules. Currently sends `/` (homepage only) to the registration page with a temporary 302. Must live in `public/` to take effect.
  - `sitebuild1/index.html` — test page at `/sitebuild1/` for confirming a deploy is live. Marked `noindex`.
- `wrangler.jsonc` — Cloudflare Workers configuration.
- `CLAUDE.md` / `AGENTS.md` — standing rules for AI coding agents (Claude Code and Codex): commit and push after every change, and leave `public/_redirects` alone.
- `.claude/settings.json` — lets Claude Code run `git add`, `git commit` and `git push` without a permission prompt.

## Local development

Install Wrangler and run the dev server from the repo root:

```bash
npx wrangler dev
```

## Deployment

Pushing to `main` triggers an automatic deploy via the Cloudflare Workers GitHub integration.
