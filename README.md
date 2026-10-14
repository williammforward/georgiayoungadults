# Georgia Young Adults

Mobile-first event companion for the WITH conference (georgiayoungadults.com), deployed on Cloudflare Workers with static assets. Pushing to `main` auto-deploys.

Read `BRAND.md` (look and feel) and `SITE-SPEC.md` (pages and behavior) before changing anything.

## Versions

The site is built in numbered versions. Each version has five pages and its own copy of the CSS and JS, and links only to its own pages.

| Page | Version 1 (frozen) | Version 2 (frozen) | Version 3 (final, edited in place) |
|---|---|---|---|
| Home | `/home-version1/` | `/home-version2/` | `/home-version3/` |
| Schedule | `/schedule-version1/` | `/schedule-version2/` | `/schedule-version3/` |
| Breakouts | `/breakouts-version1/` | `/breakouts-version2/` | `/breakouts-version3/` |
| Map | `/map-version1/` | `/map-version2/` | `/map-version3/` |
| Resources | `/resources-version1/` | `/resources-version2/` | `/resources-version3/` |

Version 3 is the final working version: edit it in place, and never create new versions or archives unless explicitly asked. Versions 1 and 2 stay live and untouched.

## Folder structure

- `public/` — everything served by the Worker (the `assets.directory` in `wrangler.jsonc`). Plain HTML, CSS and JavaScript; no build step.
  - `_redirects` — sends `/` (homepage only) to the registration page with a temporary 302 until launch.
  - `_headers` — caching rules (see below).
  - `index.html` — placeholder that sits behind the redirect.
  - `<page>-versionN/index.html` — thin HTML shells, all marked `noindex`. Content is rendered from the data files.
  - `data/schedule.json` — event, sessions, breakouts and rooms. Times use full ISO 8601 with the Eastern offset (e.g. `2026-10-17T10:00:00-04:00`). Shared by every version.
  - `data/resources.json` — the Resources page content. Shared by every version.
  - `assets/vN/css/site.css` — that version's one shared stylesheet.
  - `assets/vN/js/site.js` — that version's shared script: `ROUTES`, the clock, data loading, nav and live banner. Plus one small script per page.
  - `assets/vN/img/` (version 2 on) — phone-sized and full-size WebP copies of the background and lockup. `assets/vN/map.svg` — the map, with room ids matching `schedule.json`.
  - `assets/*.jpg`, `*.png`, `hero-*.webp`, `map.svg` — the original artwork. Never edited; version 1 loads these directly.
- `wrangler.jsonc` — Cloudflare Workers configuration.
- `BRAND.md`, `SITE-SPEC.md` — the design and behavior specs.
- `CLAUDE.md` / `AGENTS.md` — standing rules for AI coding agents (Claude Code and Codex).
- `.claude/settings.json` — lets Claude Code run `git add`, `git commit` and `git push` without a permission prompt.

## Splash (version 3)

The first page opened in a browser tab, whichever page it is, plays a cinematic title card ("WELCOME TO THE / with / GEORGIA YOUNG ADULT CONFERENCE") and then cross-dissolves into the page. Moving between pages or using the back button doesn't replay it; a new tab does (remembered in `sessionStorage`). Tapping skips it with a faster dissolve.

Its markup, CSS and timing script are inline at the top of each version 3 page so it paints before anything else loads. The page loads underneath in parallel; each page script calls `Site.pageReady()` when its content is in place. The title holds until about 6 seconds and dissolves once the page is ready, never later than 8 seconds.

## Changing content

Edit `public/data/schedule.json` or `public/data/resources.json` and push. Nothing about sessions, rooms or resources is hardcoded in the HTML. Phones pick up the change within about a minute.

## Caching

`public/_headers` tells phones how long to keep files:

- Versions 1 and 2 (`/assets/v1/`, `/assets/v2/`) are frozen and kept for a year.
- Version 3's CSS and JS are re-checked every 5 minutes. After changing one, bump the `?v=` number on its URL in all five version 3 pages so phones pick it up at once. Its images are kept for a year (new image, new file name).
- `/data/*.json` is kept for one minute.
- Pages are re-checked on every visit.

## Testing as if it's conference day

Add `?now=` to any page URL to fake the clock (read as Eastern time). It carries through every internal link.

```
/home-version3/?now=2026-10-17T11:20
```

## Local preview

Any static file server pointed at `public/` works, for example:

```bash
python3 -m http.server 8787 --directory public
```

The `/` redirect and the caching rules only apply on Cloudflare, not locally.

## Launch day

1. Change the `ROUTES` object at the top of the current version's `site.js` to the launch URLs.
2. Move that version's page folders to their launch paths (Home becomes `public/index.html`).
3. Delete the redirect line in `public/_redirects`.
4. Remove `<meta name="robots" content="noindex">` from each page.
