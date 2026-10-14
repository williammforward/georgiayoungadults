# BRAND.md — WITH · Georgia Young Adult Conference

Read this file before building or changing anything visual on this site. Every page must look like it came from the same social rollout. When in doubt, match the reference graphics, not a generic website template.

---

## 1. Event facts (source of truth)

- **Theme:** WITH
- **Event name:** Georgia Young Adult Conference
- **Date:** Saturday, October 17, 2026 (one day)
- **Location:** Evangel Church
- **Timezone:** America/New_York (Eastern). Every time in the site's data uses the full offset, e.g. `2026-10-17T19:00:00-04:00`.
- **Registration link (until launch):** https://www.georgiayouthmin.org/young-adult-conference
- **Domain:** georgiayoungadults.com

Official text lockup, used exactly like this, in this order:

```
WITH
GEORGIA YOUNG ADULT CONFERENCE
OCTOBER 17TH, 2026 AT EVANGEL CHURCH
```

---

## 2. The look in one sentence

A warm, sunlit, motion-blurred photo of people running through an open field, covered in a visible halftone dot screen and paper grain, with huge, heavy, soft-edged white type on top.

It should feel like a printed poster that is moving, not a clean tech website.

---

## 3. Photography

- **Hero image:** the blurred field photo (sky up top, sun flare upper right, green field below, blurred figures running).
  - Phone (vertical) version: `assets/hero-vertical.jpg` (1080×1920). This is the main one. The site is mobile-first.
  - Desktop (wide) version: `assets/hero-wide.jpg` (1920×1080)
- The photo is intentionally out of focus. Do not sharpen it, and do not swap in crisp stock photos.
- Text always sits on the photo with enough contrast. If text gets hard to read, add a soft dark gradient behind it. Never put a solid box behind it.
- Export as WebP (with JPG fallback), target under 250 KB for the vertical hero.

---

## 4. Texture (this is what makes it look like the brand)

Two layers sit over every photo:

1. **Halftone dot screen:** a fine, regular dot pattern visible across the whole image. Recreate it with CSS (repeating `radial-gradient` dots) or a small tiling PNG, at low opacity (roughly 15–30%), using `mix-blend-mode: multiply` or `overlay`.
2. **Paper grain/noise:** subtle speckle and texture. Use a tiny tiling noise PNG or an inline SVG `feTurbulence` filter at low opacity.

Rules:
- Texture is a fixed overlay. Keep it lightweight; it must not cause scroll lag on phones.
- Texture goes over photos and dark sections. Keep it off small body text if it hurts readability.

---

## 5. Color

Pulled from the key art. **These hex values are approximations;** replace them with exact values once sampled from the source files.

| Token | Hex (approx.) | Where it comes from | Use |
|---|---|---|---|
| `--white` | `#FFFFFF` | All type | Headlines, body text on photo, buttons |
| `--sky` | `#4F7286` | Upper sky | Section backgrounds, cards (with transparency) |
| `--sky-deep` | `#2F4A5A` | Top edge of sky | Dark backgrounds, nav bar |
| `--field` | `#6E8636` | Grass | Accents, "happening now" state |
| `--field-deep` | `#3F5222` | Shadowed grass | Dark sections, footer |
| `--sun` | `#F3E3C3` | Sun flare / horizon glow | Highlights, "up next" banner, active tab |
| `--ink` | `#1E2620` | Darkest shadows | Text on light backgrounds (rare) |

Rules:
- **Type is white almost everywhere.** This brand is white type on photo or dark color.
- No pure black backgrounds. Use `--sky-deep` or `--field-deep`.
- No bright UI colors (no default blue links, no red error-style buttons).

---

## 6. Typography

### Font loading (Adobe Fonts)
Put this in the `<head>` of every page, before any other stylesheet:
```html
<link rel="preconnect" href="https://use.typekit.net" crossorigin>
<link rel="stylesheet" href="https://use.typekit.net/riq0xse.css">
```
- This is the official Adobe Fonts web project for this site. Adobe's license covers web use **only through this link**. **Never download or self-host the font files** in the repo.
- Fallback (only visible for a moment while Adobe's font loads): **Inter Tight** from Google Fonts, same weights (900 and 600), with `font-display: swap`.

### The two text styles (these are the only two)

**Titles & headlines:** Neue Haas Grotesk Display Pro, 95 Black
```css
font-family: "neue-haas-grotesk-display", "Inter Tight", "Helvetica Neue", Arial, sans-serif;
font-weight: 900;
font-style: normal;
```
Used for: page titles, section headers, session names, the banner headline, buttons.

**Small text & everything else:** Neue Haas Grotesk Display Pro, 600
```css
font-family: "neue-haas-grotesk-display", "Inter Tight", "Helvetica Neue", Arial, sans-serif;
font-weight: 600;
font-style: normal;
```
Used for: the date/location line, labels, times, room names, body copy, captions, nav tab labels.

### The stroke: required on ALL text, both styles
This is the brand's signature. No exceptions.
- **Rounded** corners and ends. Never square/mitered corners.
- **Always exactly the same color as the text itself.** White text gets a white stroke; colored text gets the same colored stroke. It thickens the letters and rounds their corners. It is never an outline in a different color.
- Design value: **2px** on the original artwork. On the web, scale it with text size so it looks the same proportionally: about 2px on big headlines, about 1px on small text. Tune by eye against the reference graphics.

**How to build it (do NOT use `-webkit-text-stroke`; it only does sharp corners):**

Use one reusable CSS utility that makes a rounded stroke from a ring of `text-shadow`s in the text's own color. A ring of shadows has round corners automatically, works on any HTML text, and works in iPhone Safari and Android Chrome:

```css
:root { --stroke: 1px; }            /* small text default */
.stroke {
  --s: var(--stroke);
  --d: calc(var(--s) * 0.7071);     /* diagonal offset = s × cos 45° */
  text-shadow:
    var(--s) 0 0 currentColor,
    calc(var(--s) * -1) 0 0 currentColor,
    0 var(--s) 0 currentColor,
    0 calc(var(--s) * -1) 0 currentColor,
    var(--d) var(--d) 0 currentColor,
    calc(var(--d) * -1) var(--d) 0 currentColor,
    var(--d) calc(var(--d) * -1) 0 currentColor,
    calc(var(--d) * -1) calc(var(--d) * -1) 0 currentColor;
}
.stroke--title { --stroke: 2px; }   /* headlines */
```
- `currentColor` makes the stroke always match the text color automatically.
- Simplest setup: apply `.stroke` globally (on `body`) and raise `--stroke` on headings.
- For very large headlines (60px+), if the shadow ring looks lumpy, render that headline as inline SVG `<text>` with `stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill"`. SVG strokes are centered, so width 4 = 2px outside the letter.
- The **"WITH" logo/lockup** always uses the exported image file, never live text.

### Splash screen exception
Splash screen exception: the word 'with' on the splash screen uses Ivyora Text, 700 italic, all lowercase, with the same rounded same-color stroke as all other text. This is the only place this font is used.

### Type scale (mobile first)
- Hero/page titles: 900, uppercase, letter-spacing about -0.02em, 40–56px on phones, `--stroke: 2px`
- Section headers / session names: 900, uppercase, 22–28px, `--stroke: 1.5px`
- Labels, times, rooms: 600, uppercase, 13–15px, letter-spacing ~0.06em, `--stroke: 1px`
- Body copy: 600, sentence case, 16–17px, line-height ~1.5, `--stroke: 1px` (never all caps for body)

---

## 7. Logo assets

- `assets/with-lockup-white.svg` (or .png): full white lockup (WITH + name + date) on transparent background
- `assets/with-wordmark-white.svg` (or .png): "WITH" alone

The logo is white, so it's invisible on white backgrounds. Always place it on the photo or a dark brand color.

---

## 8. Motion

Feels like: drifting, sunlit, a little dreamy. Not bouncy, not flashy.

- Hero photo: very slow drift/zoom (8–15s loop) to echo the motion blur
- Content: fade + slight upward slide on scroll, short (300–500ms)
- "Up next / Happening now" banner: slides in from the top, swipe to dismiss
- Respect `prefers-reduced-motion`. Turn off the drift and slides for people who've disabled motion.
- No parallax that stutters on iPhone Safari.

---

## 9. Voice

- Short, warm, direct. Speaks to young adults like a friend, not a corporation.
- Uppercase is for headlines and labels only.
- The theme word is always written **WITH** (all caps) when used as the theme.
- *TBD: theme meaning / key scripture / repeated phrases from the rollout. Add here once confirmed.*

---

## 10. Mobile rules (non-negotiable)

- Design at 375–430px wide first. Desktop is a stretched version of the phone layout.
- Bottom tab bar navigation (thumb reach). No top hamburger menu.
- Tap targets at least 44×44px. Nothing depends on hover.
- Respect iPhone safe areas (notch and home bar) with `env(safe-area-inset-*)`.
- Use `100dvh`, not `100vh`, for full-screen sections.
- Page weight budget: under 1 MB for first load on the homepage.
- Must be checked on a real iPhone (Safari) and a real Android (Chrome) before anything is called done.
