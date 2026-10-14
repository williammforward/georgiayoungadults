# SITE-SPEC.md — WITH Conference Site

Read **BRAND.md** first (colors, fonts, stroke, texture, mobile rules). This file defines the layout, pages, and behavior. If the two ever conflict, BRAND.md wins on visuals and this file wins on structure.

---

## 1. What this site is

A mobile-first event companion for the Georgia Young Adult Conference (Saturday, October 17, 2026, Evangel Church). People open it by scanning the QR code on their badge **after they've checked in**. It answers four things, matching the badge: **Schedule · Breakouts · Map · Resources**.

**Feel:** like a polished app made of big, bold, stacked color cards. **Not** a banking app or an account app. No logins, profiles, avatars, search, filters, favorites, or notification bells. Nothing personal.

---

## 2. Tech rules

- Plain static site: HTML, CSS, vanilla JavaScript. No frameworks, no build step, no server code.
- Everything lives in `/public`. Data comes from `/public/data/schedule.json` and `/public/data/resources.json`. Pages render from the data; never hardcode session info in HTML.
- **Never edit `public/_redirects`.** The homepage `/` redirects to registration until launch.
- Every build page gets `<meta name="robots" content="noindex">` until launch.
- Fonts: the Adobe link from BRAND.md on every page.
- One shared stylesheet (`/assets/css/site.css`) and one shared script (`/assets/js/site.js`), plus small per-page scripts if needed.

---

## 3. Pages and URLs (build phase)

| Page | Build URL | Launch URL |
|---|---|---|
| Home | `/sitebuild1/` | `/` |
| Schedule | `/sitebuild2/` | `/schedule/` |
| Breakouts (list + detail) | `/sitebuild3/` (detail: `/sitebuild3/?b=<id>`) | `/breakouts/` |
| Map | `/sitebuild4/` (room: `/sitebuild4/?room=<id>`) | `/map/` |
| Resources | `/sitebuild5/` | `/resources/` |

**All internal links must come from one routes object** in `site.js`:
```js
const ROUTES = { home: "/sitebuild1/", schedule: "/sitebuild2/", breakouts: "/sitebuild3/", map: "/sitebuild4/", resources: "/sitebuild5/" };
```
Never hardcode a page URL anywhere else. On launch day, we change this one object, move the folders, and delete the redirect line.

---

## 4. Shared components

### Cards (the core of the design)
- Big rounded corners (about 28px on phones), generous padding (about 20–24px), one solid brand color per card, faint halftone texture on top.
- Headline inside the card: weight 900, uppercase, huge, with the rounded stroke.
- Details below in 600 weight.
- **Stacked deck:** cards overlap the one above by about 24px, so each card looks tucked under the next. As the user scrolls, cards slide up and settle onto the stack (CSS `position: sticky` with staggered `top` values, or a light IntersectionObserver effect). It must stay smooth on iPhone Safari.
- Card colors rotate through: `--sky`, `--field`, `--sun`, `--sky-deep`, `--field-deep`. Text on `--sun` cards uses `--ink` (with an `--ink` stroke); all others use white.

### Pills
Small rounded tags for times, rooms, and labels ("11:25 AM", "EL 405", "BREAKOUT"). Weight 600, uppercase, 12–13px. Dark translucent or white background depending on the card.

### Arrow button
A 44px circle with an ↗ arrow on any card that opens something. The whole card is tappable, not just the circle.

### Bottom nav
- A floating pill bar near the bottom, `--sky-deep` with slight transparency and blur, four icons with tiny labels: **Home · Schedule · Map · Resources**.
- Current page icon is highlighted in `--sun`.
- Sits above the iPhone home bar with `env(safe-area-inset-bottom)`. Page content gets bottom padding so nothing hides behind it.

### Live banner ("Up next / Happening now")
- A pill that drops in from the top (below the notch, `env(safe-area-inset-top)`), styled to match the bottom nav.
- **10 minutes before** a session starts: `UP NEXT · <TITLE> · <ROOM> · <TIME>` in `--sun` accent.
- **From start until 10 minutes after start:** `HAPPENING NOW · <TITLE> · <ROOM>` in `--field` accent.
- If two windows overlap (sessions are often 10 minutes apart), show the soonest upcoming or most recently started one; never stack two banners.
- Tap → that session (breakouts go to the Breakouts page). Swipe up or tap × to dismiss; a dismissed session's banner never returns (remember in `sessionStorage`, wrapped in try/catch).
- Appears on every page.

### The clock (shared by everything live)
- One function returns "now." It checks the time every 30 seconds.
- **Test mode:** `?now=2026-10-17T11:20` on any URL fakes the clock (interpret as Eastern). It must carry through internal links so the whole site can be tested as if it's conference day.
- All comparisons use the full ISO times with `-04:00` from the data.

---

## 5. Page details

### Home (`/sitebuild1/`)
1. **Hero:** full-screen (`100dvh`) blurred field photo (`hero-vertical`, wide version on desktop) with halftone and grain over it, slow drift animation, and the WITH lockup image centered.
2. **Live card** right below the hero, with three states:
   - **Before the event:** countdown to doors (9:45 AM Oct 17): "SEE YOU SATURDAY" plus days/hours/minutes.
   - **During the event:** "HAPPENING NOW" with the current session big, plus "UP NEXT" smaller below. Tap → Schedule.
   - **After the event (after 4:00 PM Oct 17):** "THANKS FOR BEING WITH US" with a link to Resources.
3. **Deck of four cards:** SCHEDULE, BREAKOUTS, MAP, RESOURCES. Each card has a huge title, a one-line subtitle, and an arrow, in the "Categories" stacked style.

### Schedule (`/sitebuild2/`)
- Page title: "SCHEDULE", with "SATURDAY, OCTOBER 17" in a pill.
- One card per session from `schedule.json`, in a stacked deck: time pill, huge title, room pill if a room exists.
- **Current session** card is expanded, brighter, and marked "NOW." **Past sessions** collapse to a slim faded strip. Upcoming ones show normally.
- On load during the event, auto-scroll to the current session.
- The Breakouts card says "7 SESSIONS" and opens the Breakouts page.
- Before the event, everything shows normally (nothing faded).

### Breakouts (`/sitebuild3/`)
- Page title: "BREAKOUTS", with a time pill "11:25 AM – 12:30 PM".
- **List view:** seven cards in a deck, each with a "BREAKOUT" pill, huge title, speaker names, room pill, and arrow.
- **Detail view** (`?b=<id>`): the tapped card grows into a full detail view (animated, not a hard page load):
  - Back button (circle, top left)
  - Big title, speakers pill, room pill, time pill
  - Summary inside a white card (ink text with ink stroke)
  - Big bottom button: **"SHOW ME ON THE MAP"** → `ROUTES.map + "?room=<roomId>"`
- The browser back button must close the detail view (use the History API).

### Map (`/sitebuild4/`)
- Page title: "MAP"
- The venue map inside a large white card, pinch-zoomable and pannable on phones.
- **Source:** `/public/assets/map.svg` (exported from Illustrator). Each room is an element whose `id` matches the room ids in `schedule.json` (`rm-210`, `el-404`, `wm`, `sanctuary`, etc.). If the SVG isn't there yet, render the PDF/PNG version and stop to say so; don't hand-draw a map.
- Below the map: a horizontal row of room pills (scrollable). Tap a pill → that room highlights on the map (`--sun` fill with a gentle pulse) and shows a small card: room name, area, and what's happening there today.
- `?room=<id>` opens with that room already highlighted.
- During the event, rooms with something happening **now** get a soft pulse.
- Legend: entrance ★, restrooms R, elevator E (from the original map).

### Resources (`/sitebuild5/`)
- From `resources.json`.
- Top: a `--sun` notice card: "THIS PAGE IS TEMPORARY. OFFICIAL CONFERENCE RESOURCES ARE COMING SOON." (shown whenever `placeholder` is true)
- Intro card: "PRACTICING THE WAY" plus the intro text.
- One card per item in the stacked deck style: tag pill, huge title, summary, arrow. Opens the link in a new tab.

---

## 6. Motion

- Cards deal onto the stack as you scroll.
- Tapping a card grows it into its detail view.
- The banner slides from the top; the nav never moves.
- Durations 250–500ms, easing `cubic-bezier(.2,.8,.2,1)`.
- `prefers-reduced-motion`: no drift, no stacking animation, simple fades only.

---

## 7. Done means

- Looks right at 375px and 430px wide first; desktop is the same layout centered at max ~480px wide over the wide hero photo.
- Tested with `?now=` at 9:00, 10:05, 11:20, 11:30, 12:45, 3:35, and 4:30 on Oct 17, plus today's real time.
- Homepage first load under 1 MB.
- No console errors.
- Commit and push when finished (Cloudflare auto-deploys).
