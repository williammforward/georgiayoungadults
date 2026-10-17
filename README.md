# Georgia Young Adults

Mobile-first event companion for the WITH conference (georgiayoungadults.com), deployed on Cloudflare Workers with static assets. Pushing to `main` auto-deploys.

Read `BRAND.md` (look and feel) and `SITE-SPEC.md` (pages and behavior) before changing anything.

## The live site

**The site is live. Edit the official pages in place. Never break /, the badge QR destination.**

| Page | URL |
|---|---|
| Home | `/` (the badge QR code points here) |
| Schedule | `/schedule/` |
| Breakouts | `/breakouts/` (detail `?b=<id>`) |
| Map | `/map/` (room `?room=<id>`) |
| Resources | `/resources/` |
| Directions (hidden one-off) | `/directions/` |

The official pages are the former version 3. Versions 1 and 2 (`/home-version1/` … `/resources-version2/`) stay live, hidden (`noindex`) and untouched. Old version 3 addresses, `/home` and `/resource` redirect to the official pages (see `public/_redirects`), keeping query strings.

## Folder structure

- `public/` — everything served by the Worker (the `assets.directory` in `wrangler.jsonc`). Plain HTML, CSS and JavaScript; no build step.
  - `_redirects` — redirects from old addresses to the official pages. Never add one for `/`.
  - `_headers` — caching rules (see below).
  - `index.html`, `schedule/`, `breakouts/`, `map/`, `resources/` — the five official pages. Thin HTML shells; content is rendered from the data files.
  - `directions/` — the hidden one-off directions page (its own CSS, JS and map image). It loads only the shared clock, never the guide's nav, banner or splash, and never touches the splash flag.
  - `favicon.ico`, `site.webmanifest`, `assets/favicon-32.png`, `assets/apple-touch-icon.png`, `assets/icon-192.png`, `assets/icon-512.png` — icons, made from `assets/new-favicon.jpg`.
  - `assets/conferenceguide-1200x630.jpg` — the 1200×630 link-preview image used on every page (cropped from `conferenceguide.jpg`).
  - `<page>-version1/`, `<page>-version2/` — frozen earlier versions, `noindex`.
  - `data/schedule.json` — event, sessions, breakouts and rooms. Times use full ISO 8601 with the Eastern offset (e.g. `2026-10-17T10:00:00-04:00`). Shared by every version.
  - `data/resources.json` — the Resources page content. Shared by every version.
  - `assets/vN/css/site.css` — that version's one shared stylesheet.
  - `assets/v3/js/clock.js` — the shared clock (Eastern time, `?now=` test mode). `assets/v3/js/site.js` — `ROUTES`, data loading, nav and live banner. Plus one small script per page.
  - `assets/vN/img/` (version 2 on) — phone-sized and full-size WebP copies of the background and lockup. `assets/vN/map.svg` — the map, with room ids matching `schedule.json`.
  - `assets/*.jpg`, `*.png`, `hero-*.webp`, `map.svg` — the original artwork. Never edited; version 1 loads these directly.
- `wrangler.jsonc` — Cloudflare Workers configuration.
- `BRAND.md`, `SITE-SPEC.md` — the design and behavior specs.
- `CLAUDE.md` / `AGENTS.md` — standing rules for AI coding agents (Claude Code and Codex).
- `.claude/settings.json` — lets Claude Code run `git add`, `git commit` and `git push` without a permission prompt.

## Splash (version 3)

The first page opened in a browser tab, whichever page it is, plays the welcome video (`assets/v3/video/welcome-splash-720.mp4`, re-encoded from `assets/welcome-splash.mp4`) and then cross-dissolves into the page. Moving between pages or using the back button doesn't replay it; a new tab does (remembered in `sessionStorage`). Tapping skips it with a faster dissolve.

If the video is refused (iPhone Low Power Mode), fails, or hasn't started within 1 second, a still welcome card (`assets/v3/img/welcome-text-720.webp`, from `assets/welcomejawn.png`) shows instead. Reduced motion always uses the still card. Nothing waits longer than 8 seconds.

Its markup, CSS and timing script are inline at the top of each version 3 page. The page loads underneath in parallel; each page script calls `Site.pageReady()` when its content is in place.

## Changing content

Edit `public/data/schedule.json` or `public/data/resources.json` and push. Nothing about sessions, rooms or resources is hardcoded in the HTML. Phones pick up the change within about a minute.

## Caching

`public/_headers` tells phones how long to keep files:

- The official pages and `/directions/` are re-checked on every visit, and `/data/*.json` is kept for one minute, so fixes show up fast.
- CSS, JS, images and video are kept for a year. After editing a CSS or JS file, bump the `?v=` number on its URL in every page that loads it.
- Versions 1 and 2 (`/assets/v1/`, `/assets/v2/`) are frozen.

## Testing as if it's conference day

Add `?now=` to any page URL to fake the clock (read as Eastern time). It carries through every internal link.

```
/?now=2026-10-17T11:20
```

## Local preview

Any static file server pointed at `public/` works, for example:

```bash
python3 -m http.server 8787 --directory public
```

The `/` redirect and the caching rules only apply on Cloudflare, not locally.
