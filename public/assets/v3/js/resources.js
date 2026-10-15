/* Resources: questions, intro, featured tools, link sections and a closing note. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const root = document.getElementById("deck");

  function external(url, props, children) {
    return h("a", Object.assign({ href: url, target: "_blank", rel: "noopener noreferrer" }, props), children,
      h("span", { class: "sr-only" }, " (opens in a new tab)"));
  }

  function deck(cards) {
    cards.forEach(function (card, i) { card.style.setProperty("--i", i); });
    return h("div", { class: "deck" }, cards);
  }

  function questionsCard(q) {
    return h("section", { class: "card reveal card--sun" },
      h("h2", { class: "t-card" }, q.title),
      q.subtitle ? h("p", { class: "t-body card__sub" }, q.subtitle) : null,
      h("ol", { class: "questions" }, q.items.map(function (text) {
        return h("li", { class: "t-body" }, text);
      })));
  }

  function introCard(intro) {
    return h("section", { class: "card reveal card--sky-deep" },
      h("h2", { class: "t-card" }, intro.title),
      intro.body ? h("p", { class: "t-body card__sub" }, intro.body) : null);
  }

  function featuredCard(f, color) {
    return h("section", { class: "card reveal card--" + color },
      f.author ? h("div", { class: "card__pills" }, S.pill(f.author, "white")) : null,
      h("h2", { class: "t-detail card__title" }, f.title),
      f.summary ? h("p", { class: "t-body card__sub" }, f.summary) : null,
      f.focus && f.focus.length ? h("div", { class: "card__pills focus" }, f.focus.map(function (t) { return S.pill(t); })) : null,
      f.url ? external(f.url, { class: "btn feature__btn" }, [h("span", null, "Learn more"), S.arrow()]) : null);
  }

  // Social handles may break after a dot, never mid-word.
  function handle(name) {
    if (name.charAt(0) !== "@") return name;
    const parts = name.split(".");
    return parts.map(function (part, i) { return i < parts.length - 1 ? [part + ".", h("wbr")] : part; });
  }

  // A pinned card taller than the screen would hide its own bottom under the
  // next card, so tall cards scroll normally instead.
  function unpinTall() {
    const limit = window.innerHeight * .7;
    root.querySelectorAll(".card").forEach(function (card) {
      card.classList.remove("card--tall");
      if (card.offsetHeight > limit) card.classList.add("card--tall");
    });
  }

  function itemCard(item, i) {
    const body = [
      item.tag ? h("div", { class: "card__pills" }, S.pill(item.tag)) : null,
      h("h3", { class: "t-head" + (item.tag ? " card__title" : "") }, handle(item.name)),
      h("div", { class: "card__row card__row--end" },
        h("p", { class: "t-body card__sub" }, item.summary || ""),
        item.url ? S.arrow() : null)
    ];
    const cls = "card reveal card--" + S.cardColor(i);
    return item.url ? external(item.url, { class: cls }, body) : h("section", { class: cls }, body);
  }

  S.resources().then(function (data) {
    const top = [];
    if (data.questions) top.push(questionsCard(data.questions));
    if (data.intro) top.push(introCard(data.intro));
    (data.featured || []).forEach(function (f, i) { top.push(featuredCard(f, i % 2 ? "sky-deep" : "field")); });

    const parts = [deck(top)];
    (data.sections || []).forEach(function (section) {
      parts.push(h("h2", { class: "t-label section-label", id: "section-" + section.id }, section.label));
      parts.push(deck(section.items.map(itemCard)));
    });
    if (data.footnote) {
      parts.push(h("aside", { class: "notice footnote" },
        h("p", { class: "footnote__title" }, data.footnote.title),
        h("p", { class: "footnote__body" }, data.footnote.body)));
    }

    root.replaceChildren.apply(root, parts);
    unpinTall();
    window.addEventListener("resize", unpinTall);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(unpinTall);
    S.reveal(root);
    S.pageReady();
  }).catch(function (err) {
    console.error(err);
    S.loadError(root);
    S.pageReady();
  });
})();
