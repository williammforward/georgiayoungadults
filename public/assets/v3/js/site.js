/* Shared script for every version 3 page. See SITE-SPEC.md. */
(function () {
  "use strict";

  // Version 3. The only place page URLs live for this version.
  const ROUTES = { home: "/home-version3/", schedule: "/schedule-version3/", breakouts: "/breakouts-version3/", map: "/map-version3/", resources: "/resources-version3/" };

  const DATA = { schedule: "/data/schedule.json", resources: "/data/resources.json" };
  const TZ = "America/New_York";
  const MINUTE = 60000;
  const TICK_MS = 30000;
  const CLOSING_FALLBACK_MIN = 30;

  /* ---------- Clock ---------- */

  function zoneOffset(ms) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(ms));
    const v = {};
    parts.forEach(function (p) { v[p.type] = Number(p.value); });
    return Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second) - ms;
  }

  // "2026-10-17T11:20" is read as Eastern wall time unless it carries its own offset.
  function parseEastern(text) {
    if (!text) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?$/.exec(text.trim());
    if (!m) return null;
    if (m[7]) {
      const d = new Date(text.trim().replace(" ", "T"));
      return isNaN(d) ? null : d;
    }
    const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    let ms = wall - zoneOffset(wall);
    ms = wall - zoneOffset(ms);
    return isNaN(ms) ? null : new Date(ms);
  }

  const nowParam = new URLSearchParams(location.search).get("now");
  const fakeNow = parseEastern(nowParam);

  function now() {
    return fakeNow ? new Date(fakeNow.getTime()) : new Date();
  }

  const tickers = [];

  function tick() {
    const t = now();
    tickers.forEach(function (fn) {
      try { fn(t); } catch (err) { console.error(err); }
    });
  }

  function onTick(fn) {
    tickers.push(fn);
    try { fn(now()); } catch (err) { console.error(err); }
  }

  setInterval(tick, TICK_MS);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) tick();
  });

  /* ---------- Links ---------- */

  // Builds every internal URL and carries the ?now= test clock along.
  function link(route, params, hash) {
    const pairs = [];
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] != null && params[k] !== "") pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    });
    if (fakeNow) pairs.push("now=" + encodeURIComponent(nowParam).replace(/%3A/gi, ":"));
    return ROUTES[route] + (pairs.length ? "?" + pairs.join("&") : "") + (hash ? "#" + hash : "");
  }

  /* ---------- Formatting ---------- */

  const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });

  function fmtTime(date) {
    return timeFmt.format(date).replace(/[  ]/g, " ");
  }

  function fmtRange(start, end) {
    return fmtTime(start) + " – " + fmtTime(end);
  }

  function fmtDay(date) {
    return dayFmt.format(date);
  }

  /* ---------- DOM ---------- */

  function h(tag, props) {
    const node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      const v = props[k];
      if (v == null || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.style.cssText = v;
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    for (let i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  function append(node, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) child.forEach(function (c) { append(node, c); });
    else node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }

  const ICONS = {
    arrow: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };

  function icon(name) {
    const span = document.createElement("span");
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICONS[name] + "</svg>";
    return span.firstChild;
  }

  function arrow() {
    return h("span", { class: "arrow" }, icon("arrow"));
  }

  function pill(text, variant) {
    return h("span", { class: "pill" + (variant ? " pill--" + variant : "") }, text);
  }

  const CARD_COLORS = ["sky", "field", "sun", "sky-deep", "field-deep"];

  function cardColor(i) {
    return CARD_COLORS[i % CARD_COLORS.length];
  }

  /* ---------- Reveal ---------- */

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealer = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -6% 0px" })
    : null;

  if (revealer) document.documentElement.classList.add("js-reveal");

  function reveal(root) {
    (root || document).querySelectorAll(".reveal:not(.is-in)").forEach(function (node) {
      if (revealer) revealer.observe(node);
      else node.classList.add("is-in");
    });
  }

  /* ---------- Data ---------- */

  // Plain fetch so it reuses the <link rel="preload"> in each page's head.
  function getJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error(url + " returned " + res.status);
      return res.json();
    });
  }

  function prepare(raw) {
    const rooms = {};
    (raw.rooms || []).forEach(function (r) { rooms[r.id] = r; });
    const sessions = (raw.sessions || []).map(function (s) {
      const startAt = new Date(s.start);
      const endAt = s.end ? new Date(s.end) : new Date(startAt.getTime() + CLOSING_FALLBACK_MIN * MINUTE);
      return Object.assign({}, s, { startAt: startAt, endAt: endAt, breakouts: s.breakouts || null });
    }).sort(function (a, b) { return a.startAt - b.startAt; });

    const doors = sessions.filter(function (s) { return s.id === "doors"; })[0] || sessions[0];
    const last = sessions[sessions.length - 1];
    const breakoutBlock = sessions.filter(function (s) { return s.breakouts; })[0] || null;

    return {
      event: raw.event || {},
      rooms: rooms,
      roomList: raw.rooms || [],
      sessions: sessions,
      doorsAt: doors ? doors.startAt : null,
      endsAt: last ? last.endAt : null,
      breakoutBlock: breakoutBlock,
      breakouts: breakoutBlock ? breakoutBlock.breakouts : []
    };
  }

  let schedulePromise = null;
  let resourcesPromise = null;

  function schedule() {
    if (!schedulePromise) schedulePromise = getJSON(DATA.schedule).then(prepare);
    return schedulePromise;
  }

  function resources() {
    if (!resourcesPromise) resourcesPromise = getJSON(DATA.resources);
    return resourcesPromise;
  }

  function roomLabel(data, id) {
    return id && data.rooms[id] ? data.rooms[id].label : "";
  }

  // "before" until doors, "after" once the last session has ended.
  function phase(data, t) {
    if (!data.doorsAt || t < data.doorsAt) return "before";
    if (t >= data.endsAt) return "after";
    return "during";
  }

  function sessionState(s, t) {
    if (t >= s.endAt) return "past";
    if (t >= s.startAt) return "now";
    return "upcoming";
  }

  function currentSession(data, t) {
    return data.sessions.filter(function (s) { return sessionState(s, t) === "now"; }).pop() || null;
  }

  function nextSession(data, t) {
    return data.sessions.filter(function (s) { return s.startAt > t; })[0] || null;
  }

  function sessionLink(s) {
    return s.breakouts ? link("breakouts") : link("schedule", null, "s-" + s.id);
  }

  function loadError(container) {
    container.replaceChildren(
      h("div", { class: "notice" },
        h("p", { class: "t-head" }, "Something didn’t load"),
        h("p", { class: "t-body", style: "margin-top:8px" }, "Check your connection and pull down to refresh."))
    );
  }

  /* ---------- Bottom nav ---------- */

  // The nav is static HTML so it paints immediately; links come from ROUTES.
  function hydrateNav() {
    const page = document.body.getAttribute("data-page");
    const active = page === "breakouts" ? "schedule" : page;
    document.querySelectorAll("[data-route]").forEach(function (a) {
      const route = a.getAttribute("data-route");
      a.setAttribute("href", link(route));
      if (route === active) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------- Live banner ---------- */

  const BANNER_WINDOW = 10 * MINUTE;
  const DISMISS_KEY = "with.banner.dismissed" + (fakeNow ? "@" + nowParam : "");

  function dismissedIds() {
    try { return JSON.parse(sessionStorage.getItem(DISMISS_KEY)) || []; } catch (err) { return []; }
  }

  function rememberDismissed(id) {
    try {
      const ids = dismissedIds();
      if (ids.indexOf(id) === -1) ids.push(id);
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
    } catch (err) { /* private mode: the banner just stays dismissed for this page */ }
  }

  // One banner at most: the soonest upcoming session wins, else the most recently started.
  function pickBanner(data, t) {
    let next = null;
    let started = null;
    data.sessions.forEach(function (s) {
      const until = s.startAt - t;
      if (until > 0 && until <= BANNER_WINDOW) {
        if (!next || s.startAt < next.startAt) next = s;
      } else if (until <= 0 && -until < BANNER_WINDOW) {
        if (!started || s.startAt > started.startAt) started = s;
      }
    });
    if (next) return { type: "next", session: next };
    if (started) return { type: "now", session: started };
    return null;
  }

  function mountBanner(data) {
    const text = h("span", { "aria-live": "polite" });
    const anchor = h("a", { class: "banner__link" }, text);
    const close = h("button", { class: "banner__close", type: "button", "aria-label": "Dismiss" }, icon("close"));
    const el = h("aside", { class: "banner", "aria-label": "Live update" }, anchor, close);
    const closedHere = [];
    let shown = null;
    let current = null;

    el.inert = true;
    document.body.appendChild(el);

    // Set on the root element so --deck-top, which is defined there, picks it up.
    function measure() {
      if (shown) document.documentElement.style.setProperty("--banner-space", (el.offsetHeight + 12) + "px");
    }

    function hide() {
      shown = null;
      el.inert = true;
      el.classList.remove("is-in", "is-dragging");
      el.style.removeProperty("--drag");
      document.body.classList.remove("has-banner");
      document.documentElement.style.removeProperty("--banner-space");
    }

    function show(pick, key) {
      const s = pick.session;
      const room = roomLabel(data, s.room);
      const meta = [room, pick.type === "next" ? fmtTime(s.startAt) : ""].filter(Boolean).join(" · ");
      el.className = "banner banner--" + pick.type + (shown ? " is-in" : "");
      anchor.setAttribute("href", sessionLink(s));
      text.replaceChildren(
        h("span", { class: "banner__line" },
          h("span", { class: "banner__tag" }, pick.type === "next" ? "Up next" : "Happening now"),
          s.title));
      if (meta) text.appendChild(h("span", { class: "banner__meta" }, meta));
      if (s.note) text.appendChild(h("span", { class: "banner__note" }, s.note));
      shown = key;
      current = s.id;
      el.inert = false;
      document.body.classList.add("has-banner");
      measure();
      requestAnimationFrame(function () {
        el.classList.add("is-in");
      });
    }

    function update(t) {
      const pick = pickBanner(data, t);
      const blocked = pick && (closedHere.indexOf(pick.session.id) !== -1 || dismissedIds().indexOf(pick.session.id) !== -1);
      const key = pick && !blocked ? pick.type + ":" + pick.session.id : null;
      if (key === shown) return;
      if (key) show(pick, key);
      else hide();
    }

    function dismiss() {
      if (current) {
        closedHere.push(current);
        rememberDismissed(current);
      }
      hide();
    }

    close.addEventListener("click", dismiss);

    // Swipe up to dismiss.
    let startY = 0;
    let drag = 0;
    let swiped = false;

    function move(e) {
      drag = Math.min(0, e.clientY - startY);
      if (drag < -6) {
        swiped = true;
        el.classList.add("is-dragging");
        el.style.setProperty("--drag", drag + "px");
      }
    }

    function release() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      el.classList.remove("is-dragging");
      if (drag < -28) dismiss();
      else el.style.removeProperty("--drag");
    }

    el.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".banner__close")) return;
      startY = e.clientY;
      drag = 0;
      swiped = false;
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    });

    el.addEventListener("click", function (e) {
      if (!swiped) return;
      swiped = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    window.addEventListener("resize", measure);
    onTick(update);
  }

  /* ---------- Splash hand-off ---------- */

  const splash = window.WITH_SPLASH || { active: false, ready: function () {} };

  // Under the splash, cards already on screen are placed without the deal-in
  // animation so nothing moves once the splash dissolves.
  function placeOnScreenCards() {
    document.querySelectorAll(".deck").forEach(function (deck) {
      deck.classList.add("no-anim");
      deck.querySelectorAll(".reveal").forEach(function (card) {
        const r = card.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) card.classList.add("is-in");
      });
      void deck.offsetHeight;
      requestAnimationFrame(function () { deck.classList.remove("no-anim"); });
    });
  }

  // Each page calls this once its content is rendered and in its final position.
  // The splash waits for it (up to its own time limit) before dissolving.
  function pageReady(work) {
    return cssReady.then(function () { return work; }).catch(function (err) { console.error(err); }).then(function () {
      const photo = document.getElementById("bg-photo");
      const decoded = photo && photo.decode ? photo.decode().catch(function () {}) : null;
      return Promise.race([decoded, new Promise(function (resolve) { setTimeout(resolve, 2500); })]);
    }).then(function () {
      if (splash.active) placeOnScreenCards();
      splash.ready();
    });
  }

  /* ---------- Boot ---------- */

  // Pages load their stylesheet without blocking the splash, so anything that
  // measures layout waits for it.
  const cssReady = new Promise(function (resolve) {
    const sheet = document.getElementById("site-css");
    if (!sheet || (sheet.sheet && sheet.media !== "print")) { resolve(); return; }
    sheet.addEventListener("load", function () { resolve(); }, { once: true });
    sheet.addEventListener("error", function () { resolve(); }, { once: true });
  });

  window.Site = {
    ROUTES: ROUTES,
    cssReady: cssReady,
    splashActive: splash.active,
    pageReady: pageReady,
    now: now,
    onTick: onTick,
    link: link,
    h: h,
    icon: icon,
    arrow: arrow,
    pill: pill,
    cardColor: cardColor,
    reveal: reveal,
    reduceMotion: reduceMotion,
    schedule: schedule,
    resources: resources,
    roomLabel: roomLabel,
    phase: phase,
    sessionState: sessionState,
    currentSession: currentSession,
    nextSession: nextSession,
    sessionLink: sessionLink,
    loadError: loadError,
    fmtTime: fmtTime,
    fmtRange: fmtRange,
    fmtDay: fmtDay,
    isTestClock: !!fakeNow,
    MINUTE: MINUTE
  };

  hydrateNav();
  // Layout changes only animate once the first paint has settled.
  window.addEventListener("load", function () {
    setTimeout(function () { document.documentElement.classList.add("is-settled"); }, 600);
  });
  // Home reveals itself once it has scrolled to the cards; other pages as soon as they are styled.
  if (document.body.getAttribute("data-page") !== "home") {
    cssReady.then(function () { document.documentElement.classList.add("is-ready"); });
  }
  cssReady.then(schedule).then(mountBanner).catch(function (err) { console.error(err); });
})();
