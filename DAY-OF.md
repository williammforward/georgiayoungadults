# Day-of guide (Saturday, October 17)

The site is live at https://georgiayoungadults.com/. The badge QR code points at `/`. Never break `/`.

## Change a session time, room or note

Everything about the schedule lives in one file: `public/data/schedule.json`. Edit only that file.

- **Time:** change `start` (and `end`) on the session. Keep the exact format with the Eastern offset, e.g. `"2026-10-17T13:45:00-04:00"`. If you move a session, also move the neighbouring session's `end` or `start` so they still line up.
- **Room:** change `room` to one of the room ids listed under `"rooms"` near the bottom of the file (`sanctuary`, `rm-210`, `rm-211`, `wm`, `el-404`, `el-405`, `el-406`, `el-407`, `milltown-coffee`, `milltown-square`, `south-entrance`). Use the id, not the label. Use `null` for no room.
- **Note** (the line of subtext under a session title): change or add `"note": "..."`. Remove the line to drop it.
- **Breakout:** each breakout is inside the `"breakouts"` list of the Breakouts session (`title`, `speakers`, `room`, `summary`).

Before pushing, check the file is still valid JSON (a missing comma breaks every page's schedule):

```bash
python3 -m json.tool public/data/schedule.json > /dev/null && echo OK
```

Then commit and push to `main`. Cloudflare deploys in about a minute.

**When phones see it:** about a minute after the deploy, on the next page they open. A page that is already open keeps what it loaded until the person taps to another page or refreshes. No CSS or JS change and no version bump are needed for data edits.

## If something breaks: roll back

Fastest: in the Cloudflare dashboard go to **Workers & Pages → georgiayoungadults → Deployments**, find the last version that worked, open its menu and choose **Rollback**. The site switches back within seconds. (Later, fix the code and push again; the next push deploys normally.)

Or with git: `git revert HEAD` then `git push`. Wait about a minute for the build.

## What NOT to touch tomorrow

- **CSS or JS files** (`public/assets/v3/css/`, `public/assets/v3/js/`, `public/directions/*.js|css`). Phones cache them for a year. If you must edit one, bump its `?v=` number in every page that loads it (the five official pages, and `/directions/` for `site.css` and `clock.js`), or phones will keep the old file.
- **`public/_redirects`.** Never add anything for `/`.
- **Room ids** in `schedule.json`. They must match the shapes in the map; renaming an id stops that room from highlighting. Change the `label` instead if the display name is wrong.
- **The time format.** Every time needs `-04:00` on the end.
- **Version 1 and 2 pages** (`/home-version1/` etc.). They stay as they are.
- **`/directions/`** has no links back to the guide on purpose.

## Test as if it's a specific time

Add `?now=` to any page: `https://georgiayoungadults.com/?now=2026-10-17T11:20`. It follows you through every link.
