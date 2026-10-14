/* Home: intro, live card and the four category cards. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const deck = document.getElementById("deck");
  const bg = document.querySelector(".bg");
  const photo = document.getElementById("bg-photo");
  const words = document.getElementById("bg-words");
  const DAY = 24 * 60 * S.MINUTE;
  const HOUR = 60 * S.MINUTE;
  const SCROLL_KEY = "with.v2.home.scroll";

  /* ---------- Cards ---------- */

  function unit(value, one, many) {
    return h("div", { class: "count__unit" },
      h("span", { class: "count__num" }, String(value)),
      h("span", { class: "count__label" }, value === 1 ? one : many));
  }

  function head(left) {
    return h("div", { class: "card__row card__row--between" }, h("div", { class: "card__pills" }, left), S.arrow());
  }

  function before(data, t) {
    const left = Math.max(0, data.doorsAt - t);
    const weekday = S.fmtDay(data.doorsAt).split(",")[0];
    return {
      color: "field-deep",
      href: S.link("schedule"),
      body: [
        head(S.pill("Doors open " + S.fmtTime(data.doorsAt), "white")),
        h("h2", { class: "t-card card__title" }, "See you " + weekday),
        h("div", { class: "count" },
          unit(Math.floor(left / DAY), "Day", "Days"),
          unit(Math.floor((left % DAY) / HOUR), "Hour", "Hours"),
          unit(Math.floor((left % HOUR) / S.MINUTE), "Minute", "Minutes"))
      ]
    };
  }

  function during(data, t) {
    const current = S.currentSession(data, t);
    const next = S.nextSession(data, t);
    const main = current || next;
    const room = S.roomLabel(data, main.room);
    const tag = h("span", { class: "pill pill--white" },
      current ? h("span", { class: "dot dot--pulse", style: "color:var(--field)" }) : null,
      current ? "Happening now" : "Up next");
    const body = [
      head(tag),
      h("h2", { class: "t-card card__title" }, main.title),
      h("div", { class: "card__pills card__foot" },
        room ? S.pill(room) : null,
        current && main.end ? S.pill("Until " + S.fmtTime(main.endAt)) : null,
        current ? null : S.pill(S.fmtTime(main.startAt)))
    ];
    if (current && next) {
      body.push(h("div", { class: "next" },
        S.pill("Up next", "sun"),
        h("span", { class: "next__title" }, next.title),
        S.pill(S.fmtTime(next.startAt))));
    }
    return { color: "field", href: S.link("schedule"), body: body };
  }

  function after() {
    return {
      color: "sun",
      href: S.link("resources"),
      body: [
        h("h2", { class: "t-card" }, "Thanks for being WITH us"),
        h("div", { class: "card__row card__row--end" },
          h("p", { class: "t-body card__sub" }, "Today was the start. Keep going with a few resources we picked for you."),
          S.arrow())
      ]
    };
  }

  function category(i, title, sub, route) {
    return h("a", { class: "card reveal card--" + S.cardColor(i - 1), href: S.link(route), style: "--i:" + i },
      h("h2", { class: "t-card" }, title),
      h("div", { class: "card__row card__row--end" }, sub, S.arrow()));
  }

  function sub(text, extra) {
    return h("p", { class: "t-body card__sub" + (extra ? " " + extra : "") }, text);
  }

  // The layout appears straight away; only the live card waits for the data.
  const live = h("a", { class: "card reveal card--field-deep is-loading", style: "--i:0", href: S.link("schedule"), "aria-busy": "true" });
  const breakoutSub = sub("Pick the one for you.", "card__sub--two");

  deck.replaceChildren(
    live,
    category(1, "Schedule", sub("The whole day, start to finish."), "schedule"),
    category(2, "Breakouts", breakoutSub, "breakouts"),
    category(3, "Map", sub("Find your room in a few taps."), "map"),
    category(4, "Resources", sub("Keep going after today."), "resources"));
  S.reveal(deck);

  /* ---------- Poster and scroll position ---------- */

  let settleTarget = 0;
  let touched = false;
  let animating = false;
  let ticking = false;
  let saveTimer = null;

  // Where the page rests with the first card pinned at the top.
  function measureSettle() {
    const first = deck.firstElementChild;
    const top = first ? parseFloat(getComputedStyle(first).top) : NaN;
    const pinned = isNaN(top) ? 12 : top;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    settleTarget = Math.max(0, Math.min(max, Math.round(deck.getBoundingClientRect().top + window.scrollY - pinned)));
    return settleTarget;
  }

  // The WITH lockup fades out as the cards come up, leaving the plain photo behind them.
  function paint() {
    ticking = false;
    const progress = settleTarget > 0 ? Math.min(1, window.scrollY / (settleTarget * .75)) : 0;
    words.style.opacity = String(1 - progress);
    words.style.visibility = progress >= 1 ? "hidden" : "visible";
    bg.classList.toggle("is-top", progress < 1);
  }

  function remember() {
    try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch (err) { /* private mode */ }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paint);
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(remember, 200);
  }, { passive: true });

  window.addEventListener("pagehide", remember);
  window.addEventListener("resize", function () {
    measureSettle();
    paint();
  });

  function decoded(img) {
    if (!img) return Promise.resolve();
    if (img.decode) return img.decode().catch(function () {});
    return new Promise(function (resolve) {
      if (img.complete) resolve();
      else img.addEventListener("load", resolve, { once: true });
    });
  }

  function showPoster(instant) {
    if (instant) bg.classList.add("is-instant");
    bg.classList.add("is-ready");
  }

  // cubic-bezier(.3, 0, .1, 1): eases in gently, then lands softly.
  function ease(t) {
    const x1 = .3, y1 = 0, x2 = .1, y2 = 1;
    let u = t;
    for (let i = 0; i < 6; i++) {
      const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
      const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
    }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  }

  function settle() {
    if (touched || animating) return;
    const from = window.scrollY;
    const to = measureSettle();
    if (to - from < 2) return;
    const duration = 700;
    const start = performance.now();
    animating = true;

    function frame(now) {
      if (touched) { animating = false; return; }
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(frame);
      else animating = false;
    }
    requestAnimationFrame(frame);
  }

  // Any touch, click, wheel or key hands control straight back to the person.
  ["touchstart", "pointerdown", "mousedown", "wheel", "keydown"].forEach(function (type) {
    window.addEventListener(type, function () { touched = true; }, { passive: true, capture: true });
  });

  function intro() {
    const entry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    const cameBack = !!entry && entry.type === "back_forward";
    try { history.scrollRestoration = "manual"; } catch (err) { /* older browsers */ }
    measureSettle();

    if (cameBack) {
      // Back button: no replay, straight to where they were.
      let saved = 0;
      try { saved = Number(sessionStorage.getItem(SCROLL_KEY)) || 0; } catch (err) { /* private mode */ }
      showPoster(true);
      window.scrollTo(0, saved);
      paint();
      return function () { if (!touched) window.scrollTo(0, saved); };
    }

    if (S.reduceMotion.matches) {
      showPoster(true);
      window.scrollTo(0, settleTarget);
      paint();
      return function () { if (!touched) window.scrollTo(0, measureSettle()); };
    }

    window.scrollTo(0, 0);
    paint();
    let started = false;
    function go() {
      if (started) return;
      started = true;
      settle();
    }
    // Fade the poster in once it has loaded, then settle. Never wait long on a slow connection.
    const giveUp = setTimeout(go, 1600);
    Promise.all([decoded(photo), decoded(words)]).then(function () {
      showPoster(false);
      clearTimeout(giveUp);
      setTimeout(go, 560);
    });
    return function () {};
  }

  const afterData = intro();

  /* ---------- Live card ---------- */

  S.schedule().then(function (data) {
    let lastKey = "";

    function update(t) {
      const state = S.phase(data, t);
      const view = state === "before" ? before(data, t) : state === "after" ? after() : during(data, t);
      const key = state + "|" + view.body.map(function (n) { return n.textContent; }).join("|");
      if (key === lastKey) return;
      lastKey = key;
      live.className = "card reveal card--" + view.color + (live.classList.contains("is-in") ? " is-in" : "");
      live.removeAttribute("aria-busy");
      live.setAttribute("href", view.href);
      live.replaceChildren.apply(live, view.body);
    }

    if (data.breakoutBlock) {
      breakoutSub.textContent = data.breakouts.length + " sessions at " + S.fmtTime(data.breakoutBlock.startAt) + ". Pick the one for you.";
    }
    S.onTick(update);
    measureSettle();
    afterData();
    paint();
  }).catch(function (err) {
    console.error(err);
    live.remove();
  });
})();
