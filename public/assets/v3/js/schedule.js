/* Schedule: one card per session, with past, now and upcoming states. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const deck = document.getElementById("deck");
  const headPills = document.getElementById("head-pills");

  function card(data, s, i, state, settled) {
    const room = S.roomLabel(data, s.room);
    const count = s.breakouts ? s.breakouts.length : 0;
    const props = {
      class: "card reveal sess card--" + S.cardColor(i) + " is-" + state + (settled ? " is-in" : ""),
      id: "s-" + s.id,
      style: "--i:" + i,
      href: s.breakouts ? S.link("breakouts") : null
    };
    const tag = s.breakouts ? "a" : "article";

    if (state === "past") {
      return h(tag, props,
        h("div", { class: "sess__strip" },
          h("span", { class: "sess__time" }, S.fmtTime(s.startAt)),
          h("span", { class: "sess__name" }, s.title)));
    }

    const now = state === "now";
    const below = [
      room ? S.pill(room) : null,
      count ? S.pill(count + " sessions") : null,
      now && s.end ? S.pill("Until " + S.fmtTime(s.endAt)) : null
    ].filter(Boolean);

    return h(tag, props,
      h("div", { class: "card__pills" },
        now ? h("span", { class: "pill pill--now" }, h("span", { class: "dot dot--pulse" }), "Now") : null,
        S.pill(S.fmtTime(s.startAt), "white")),
      h("h2", { class: (now ? "t-card" : "t-head") + " card__title" }, s.title),
      below.length || s.breakouts
        ? h("div", { class: "card__row card__row--between card__row--end card__foot" },
            h("div", { class: "card__pills" }, below),
            s.breakouts ? S.arrow() : null)
        : null);
  }

  // Sticky cards report their pinned position, so work out the natural one.
  function scrollToCard(target, smooth) {
    const cards = Array.prototype.slice.call(deck.children);
    const index = cards.indexOf(target);
    if (index === -1) return;
    let y = deck.getBoundingClientRect().top + window.scrollY;
    for (let j = 0; j < index; j++) {
      y += cards[j].offsetHeight + parseFloat(getComputedStyle(cards[j + 1]).marginTop);
    }
    const pinned = parseFloat(getComputedStyle(target).top) || 0;
    window.scrollTo({ top: Math.max(0, y - pinned), behavior: smooth && !S.reduceMotion.matches ? "smooth" : "auto" });
  }

  function hashTarget() {
    const id = decodeURIComponent(location.hash.slice(1));
    return id ? document.getElementById(id) : null;
  }

  S.schedule().then(function (data) {
    let signature = "";
    let settled = false;

    if (data.sessions.length) {
      headPills.replaceChildren(S.pill(S.fmtDay(data.sessions[0].startAt), "white"));
    }

    function render(t) {
      const states = data.sessions.map(function (s) { return S.sessionState(s, t); });
      const next = states.join(",");
      if (next === signature) return;
      signature = next;
      deck.replaceChildren.apply(deck, data.sessions.map(function (s, i) {
        return card(data, s, i, states[i], settled);
      }));
      S.reveal(deck);
    }

    S.onTick(render);
    settled = true;

    // Open on the linked or current session, unless the person has already started scrolling.
    let touched = false;
    ["touchstart", "wheel", "keydown", "pointerdown"].forEach(function (type) {
      window.addEventListener(type, function () { touched = true; }, { once: true, passive: true });
    });

    function settle(smooth) {
      const target = hashTarget() || deck.querySelector(".is-now");
      if (target && !touched) scrollToCard(target, smooth);
    }

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const timeout = new Promise(function (resolve) { setTimeout(resolve, 900); });

    if (S.splashActive) {
      // Under the splash the page jumps straight to its final position.
      S.pageReady(S.cssReady.then(function () {
        settle(false);
        return Promise.race([fontsReady, timeout]);
      }).then(function () { settle(false); }));
    } else {
      Promise.race([fontsReady, timeout]).then(function () {
        settle(true);
        setTimeout(function () { settle(false); }, 900);
      });
    }

    window.addEventListener("hashchange", function () {
      const target = hashTarget();
      if (target) scrollToCard(target, true);
    });
  }).catch(function (err) {
    console.error(err);
    S.loadError(deck);
    S.pageReady();
  });
})();
