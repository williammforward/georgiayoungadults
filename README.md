# Georgia Young Adults

Static site for the Georgia Young Adults conference (georgiayoungadults.com), deployed on Cloudflare Workers with static assets. Pushing to `main` auto-deploys.

## Folder structure

- `public/` — all site files served by the Worker. This is the `assets.directory` configured in `wrangler.jsonc`.
  - `index.html` — the site's landing page.
  - `data/schedule.json` — conference schedule data. Each session's `start`/`end` times use full ISO 8601 with the Eastern offset (e.g. `2026-10-16T19:00:00-04:00`).
- `wrangler.jsonc` — Cloudflare Workers configuration.

## Local development

Install Wrangler and run the dev server from the repo root:

```bash
npx wrangler dev
```

## Deployment

Pushing to `main` triggers an automatic deploy via the Cloudflare Workers GitHub integration.
