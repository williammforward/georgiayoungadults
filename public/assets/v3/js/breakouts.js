/* Breakouts: list of cards, plus a detail view that grows out of the tapped card. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const main = document.getElementById("main");
  const deck = document.getElementById("deck");
  const headPills = document.getElementById("head-pills");
  const detail = document.getElementById("detail");
  const scroller = detail.querySelector(".detail__scroll");
  const inner = detail.querySelector(".detail__inner");
  const baseTitle = document.title;
  const EASE = "cubic-bezier(.2,.8,.2,1)";
  const FULL = "inset(0px 0px 0px 0px round 0px)";

  let list = [];
  let block = null;
  let data = null;
  let openId = null;
  let running = [];

  function speakers(b) {
    return (b.speakers || []).join(" & ");
  }

  function currentParam() {
    return new URLSearchParams(location.search).get("b");
  }

  function cardFor(id) {
    return document.getElementById("b-" + id);
  }

  function listCard(b, i) {
    const room = S.roomLabel(data, b.room);
    return h("a", {
      class: "card reveal card--" + S.cardColor(i),
      id: "b-" + b.id,
      href: S.link("breakouts", { b: b.id }),
      style: "--i:" + i,
      onclick: function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
        e.preventDefault();
        history.pushState({ pushed: true }, "", S.link("breakouts", { b: b.id }));
        open(b.id, true);
      }
    },
      h("div", { class: "card__pills" }, S.pill("Breakout")),
      h("h2", { class: "t-head card__title" }, b.title),
      h("p", { class: "t-body speakers" }, speakers(b)),
      h("div", { class: "card__row card__row--between card__row--end card__foot" },
        h("div", { class: "card__pills" }, room ? S.pill(room, "white") : null),
        S.arrow()));
  }

  function detailBody(b) {
    const room = S.roomLabel(data, b.room);
    const names = speakers(b);
    return [
      h("button", { class: "detail__back", type: "button", "aria-label": "Back to all breakouts", onclick: back }, S.icon("back")),
      h("div", { class: "card__pills detail__tag" }, S.pill("Breakout")),
      h("h2", { class: "t-detail detail__title", id: "detail-title" }, b.title),
      h("div", { class: "card__pills detail__pills" },
        names ? h("span", { class: "pill pill--white pill--wrap" }, names) : null,
        room ? S.pill(room) : null,
        block ? S.pill(S.fmtRange(block.startAt, block.endAt)) : null),
      b.summary ? h("div", { class: "detail__summary" }, h("p", { class: "t-body" }, b.summary)) : null,
      b.room ? h("div", { class: "detail__cta" },
        h("a", { class: "btn", href: S.link("map", { room: b.room }) },
          h("span", null, "Show me on the map"),
          S.arrow())) : null
    ].filter(Boolean);
  }

  function stopAnimations() {
    running.forEach(function (a) { a.cancel(); });
    running = [];
  }

  function clipFor(rect) {
    const box = detail.getBoundingClientRect();
    const top = Math.max(0, rect.top - box.top);
    const right = Math.max(0, box.right - rect.right);
    const bottom = Math.max(0, box.bottom - rect.bottom);
    const left = Math.max(0, rect.left - box.left);
    return "inset(" + top + "px " + right + "px " + bottom + "px " + left + "px round 28px)";
  }

  function onScreen(node) {
    if (!node) return false;
    const r = node.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function animate(node, frames, options) {
    if (!node.animate) return null;
    const a = node.animate(frames, Object.assign({ easing: EASE, fill: "both" }, options));
    running.push(a);
    return a;
  }

  function open(id, animated) {
    const index = list.findIndex(function (b) { return b.id === id; });
    if (index === -1) { close(false); return; }
    const b = list[index];
    const card = cardFor(id);
    const rect = card ? card.getBoundingClientRect() : null;

    stopAnimations();
    detail.className = "detail card--" + S.cardColor(index);
    inner.replaceChildren.apply(inner, detailBody(b));
    detail.hidden = false;
    main.inert = true;
    openId = id;
    scroller.scrollTop = 0;
    document.title = b.title + " · Breakouts";

    if (animated && !S.reduceMotion.matches && onScreen(card)) {
      animate(detail, [{ clipPath: clipFor(rect) }, { clipPath: FULL }], { duration: 480 });
      animate(inner, [
        { opacity: 0, transform: "translate3d(0," + Math.max(0, rect.top - 24) + "px,0)" },
        { opacity: 1, transform: "none" }
      ], { duration: 480 });
    } else if (animated) {
      animate(detail, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: "linear" });
    }

    const settle = running[0];
    if (settle) settle.finished.then(stopAnimations).catch(function () {});
    detail.querySelector(".detail__back").focus({ preventScroll: true });
  }

  function close(animated) {
    if (!openId) return;
    const card = cardFor(openId);
    openId = null;
    main.inert = false;
    document.title = baseTitle;
    stopAnimations();

    function done() {
      stopAnimations();
      detail.hidden = true;
      if (card) card.focus({ preventScroll: true });
    }

    let last = null;
    if (animated && !S.reduceMotion.matches && onScreen(card)) {
      animate(inner, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "linear" });
      last = animate(detail, [{ clipPath: FULL }, { clipPath: clipFor(card.getBoundingClientRect()) }], { duration: 400 });
    } else if (animated) {
      last = animate(detail, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "linear" });
    }

    // The timer covers browsers that pause animations in a background tab.
    if (last) {
      let finished = false;
      const finish = function () {
        if (finished || openId) return;
        finished = true;
        done();
      };
      last.finished.then(finish).catch(function () {});
      setTimeout(finish, 600);
    } else {
      done();
    }
  }

  // The on-screen back button behaves like the browser's back button.
  function back() {
    if (history.state && history.state.pushed) {
      history.back();
    } else {
      history.replaceState(null, "", S.link("breakouts"));
      close(true);
    }
  }

  function sync(animated) {
    const id = currentParam();
    if (id && id !== openId) open(id, animated);
    else if (!id) close(animated);
  }

  window.addEventListener("popstate", function () { sync(true); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openId) back();
  });

  S.schedule().then(function (loaded) {
    data = loaded;
    block = data.breakoutBlock;
    list = data.breakouts;

    if (block) headPills.replaceChildren(S.pill(S.fmtRange(block.startAt, block.endAt), "white"));
    deck.replaceChildren.apply(deck, list.map(listCard));
    S.reveal(deck);
    sync(false);
  }).catch(function (err) {
    console.error(err);
    S.loadError(deck);
  });
})();
