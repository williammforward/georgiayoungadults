/* Temporary registration homepage: renders the schedule from the guide's data. */
(function () {
  "use strict";

  const list = document.getElementById("schedule");
  const TZ = "America/New_York";
  const time = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  fetch("/data/schedule.json").then(function (res) {
    if (!res.ok) throw new Error("schedule.json returned " + res.status);
    return res.json();
  }).then(function (data) {
    const rows = (data.sessions || []).slice().sort(function (a, b) {
      return new Date(a.start) - new Date(b.start);
    }).map(function (s) {
      const li = el("li");
      li.appendChild(el("span", "schedule__time", time.format(new Date(s.start)).replace(/[  ]/g, " ")));
      const title = el("span", "schedule__title", s.title);
      if (s.note) title.appendChild(el("span", "schedule__note", s.note));
      li.appendChild(title);
      return li;
    });
    list.replaceChildren.apply(list, rows);
  }).catch(function (err) {
    console.error(err);
    list.replaceChildren(el("li", "schedule__note", "The schedule didn’t load. Refresh to try again."));
  });
})();
