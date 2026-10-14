/* Home: live card plus the four category cards. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const deck = document.getElementById("deck");
  const DAY = 24 * 60 * S.MINUTE;
  const HOUR = 60 * S.MINUTE;

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
      h("div", { class: "card__row card__row--end" },
        h("p", { class: "t-body card__sub" }, sub),
        S.arrow()));
  }

  S.schedule().then(function (data) {
    const live = h("a", { class: "card reveal", style: "--i:0" });
    let lastKey = "";

    function update(t) {
      const state = S.phase(data, t);
      const view = state === "before" ? before(data, t) : state === "after" ? after() : during(data, t);
      const key = state + "|" + view.body.map(function (n) { return n.textContent; }).join("|");
      if (key === lastKey) return;
      lastKey = key;
      live.className = "card reveal card--" + view.color + (live.classList.contains("is-in") ? " is-in" : "");
      live.setAttribute("href", view.href);
      live.replaceChildren.apply(live, view.body);
    }

    const count = data.breakouts.length;
    const breakoutSub = data.breakoutBlock
      ? count + " sessions at " + S.fmtTime(data.breakoutBlock.startAt) + ". Pick the one for you."
      : "Pick the one for you.";

    deck.replaceChildren(
      live,
      category(1, "Schedule", "The whole day, start to finish.", "schedule"),
      category(2, "Breakouts", breakoutSub, "breakouts"),
      category(3, "Map", "Find your room in a few taps.", "map"),
      category(4, "Resources", "Keep going after today.", "resources"));

    S.onTick(update);
    S.reveal(deck);
  }).catch(function (err) {
    console.error(err);
    S.loadError(deck);
  });
})();
