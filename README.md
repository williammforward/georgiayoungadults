# Georgia Young Adults

Mobile-first event companion for the WITH conference (georgiayoungadults.com), deployed on Cloudflare Workers with static assets. Pushing to `main` auto-deploys.

Read `BRAND.md` (look and feel) and `SITE-SPEC.md` (pages and behavior) before changing anything.

## Folder structure

- `public/` — everything served by the Worker (the `assets.directory` in `wrangler.jsonc`). Plain HTML, CSS and JavaScript; no build step.
  - `_redirects` — sends `/` (homepage only) to the registration page with a temporary 302 until launch. Must live in `public/` to take effect.
  - `index.html` — placeholder that sits behind the redirect.
  - `sitebuild1/` … `sitebuild5/` — the build-phase pages: Home, Schedule, Breakouts, Map, Resources. Each is a thin HTML shell marked `noindex`; the content is rendered from the data files.
  - `data/schedule.json` — event, sessions, breakouts and rooms. Times use full ISO 8601 with the Eastern offset (e.g. `2026-10-17T10:00:00-04:00`).
  - `data/resources.json` — the Resources page content.
  - `assets/css/site.css` — the one shared stylesheet (brand colors, stroke, cards, nav, banner, page styles).
  - `assets/js/site.js` — the one shared script: `ROUTES`, the clock, data loading, bottom nav and live banner.
  - `assets/js/home.js`, `schedule.js`, `breakouts.js`, `map.js`, `resources.js` — one small script per page.
  - `assets/hero-*.webp` / `.jpg`, `with-lockup-white.png`, `map.svg`, `favicon.svg` — images. Rooms in `map.svg` carry ids that match the room ids in `schedule.json`.
- `wrangler.jsonc` — Cloudflare Workers configuration.
- `BRAND.md`, `SITE-SPEC.md` — the design and behavior specs.
- `CLAUDE.md` / `AGENTS.md` — standing rules for AI coding agents (Claude Code and Codex): commit and push after every change, and leave `public/_redirects` alone.
- `.claude/settings.json` — lets Claude Code run `git add`, `git commit` and `git push` without a permission prompt.

## Changing content

Edit `public/data/schedule.json` or `public/data/resources.json` and push. Nothing about sessions, rooms or resources is hardcoded in the HTML.

## Testing as if it's conference day

Add `?now=` to any page URL to fake the clock (read as Eastern time). It carries through every internal link.

```
/sitebuild1/?now=2026-10-17T11:20
```

## Local preview

Any static file server pointed at `public/` works, for example:

```bash
python3 -m http.server 8787 --directory public
```

The `/` redirect only happens on Cloudflare, not locally.

## Launch day

1. Change the `ROUTES` object at the top of `public/assets/js/site.js` to the launch URLs.
2. Move the `sitebuild*` folders to their launch paths (Home becomes `public/index.html`).
3. Delete the redirect line in `public/_redirects`.
4. Remove `<meta name="robots" content="noindex">` from each page.
