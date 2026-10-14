/* Resources: intro, and one card per item from resources.json. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const deck = document.getElementById("deck");

  S.resources().then(function (data) {
    const cards = [];

    if (data.intro) {
      cards.push(h("section", { class: "card reveal card--sky-deep" },
        h("h2", { class: "t-detail" }, data.intro.title),
        data.intro.body ? h("p", { class: "t-body card__sub" }, data.intro.body) : null));
    }

    (data.items || []).forEach(function (item, i) {
      cards.push(h("a", {
        class: "card reveal card--" + S.cardColor(i),
        href: item.url,
        target: "_blank",
        rel: "noopener noreferrer"
      },
        item.tag ? h("div", { class: "card__pills" }, S.pill(item.tag)) : null,
        h("h2", { class: "t-detail card__title" }, item.title),
        h("div", { class: "card__row card__row--end" },
          h("p", { class: "t-body card__sub" }, item.summary || ""),
          S.arrow()),
        h("span", { class: "sr-only" }, "Opens in a new tab")));
    });

    cards.forEach(function (card, i) { card.style.setProperty("--i", i); });
    deck.replaceChildren.apply(deck, cards);
    S.reveal(deck);
  }).catch(function (err) {
    console.error(err);
    S.loadError(deck);
  });
})();
