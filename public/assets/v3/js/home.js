/* Home: live card and the four category cards, opened resting on the card deck. */
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
  const SCROLL_KEY = "with.v3.home.scroll";

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
      main.note ? h("p", { class: "t-body card__note" }, main.note) : null,
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

  /* ---------- Poster and scroll position ---------- */

  const root = document.documentElement;
  let settleTarget = 0;
  let touched = false;
  let ticking = false;
  let saveTimer = null;

  // Where the page rests with the first card pinned at the top.
  function measureSettle() {
    const first = deck.firstElementChild;
    const style = first ? getComputedStyle(first) : null;
    const top = style && style.position === "sticky" ? parseFloat(style.top) : NaN;
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

  ["touchstart", "pointerdown", "mousedown", "wheel", "keydown"].forEach(function (type) {
    window.addEventListener(type, function () { touched = true; }, { passive: true, capture: true });
  });

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  const entry = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  const cameBack = !!entry && entry.type === "back_forward";
  try { history.scrollRestoration = "manual"; } catch (err) { /* older browsers */ }

  // The page opens already resting on the card deck. The back button returns
  // to wherever the person was instead.
  function position() {
    let y = measureSettle();
    if (cameBack) {
      try { y = Number(sessionStorage.getItem(SCROLL_KEY)) || 0; } catch (err) { /* private mode */ }
    }
    window.scrollTo(0, y);
    paint();
  }

  // Cards already on screen appear in place; only cards further down deal in on scroll.
  function placeVisibleCards() {
    deck.classList.add("no-anim");
    Array.prototype.forEach.call(deck.children, function (card) {
      const r = card.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) card.classList.add("is-in");
    });
    void deck.offsetHeight;
    requestAnimationFrame(function () { deck.classList.remove("no-anim"); });
    S.reveal(deck);
  }

  const styled = S.cssReady.then(position);
  const dataShown = S.schedule().then(function (data) { return styled.then(function () { return data; }); });

  // Reveal the page once it is laid out and the live card has its content
  // (or after a short wait, so a slow data request never holds the page back).
  const pageShown = Promise.race([dataShown.catch(function () {}), styled.then(function () { return wait(600); })]).then(function () {
    if (!touched) position();
    placeVisibleCards();
    root.classList.add("is-ready");
  });

  S.pageReady(Promise.all([pageShown, dataShown.catch(function () {})]));

  /* ---------- Live card ---------- */

  dataShown.then(function (data) {
    let lastKey = "";

    function update(t) {
      const state = S.phase(data, t);
      const view = state === "before" ? before(data, t) : state === "after" ? after() : during(data, t);
      view.body = view.body.filter(Boolean);
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
    paint();
  }).catch(function (err) {
    console.error(err);
    live.remove();
  });
})();
