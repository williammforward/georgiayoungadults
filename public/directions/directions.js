/* /directions/: copy address and the countdown. Uses only the shared clock (with ?now=). */
(function () {
  "use strict";

  const Clock = window.WithClock;
  const ADDRESS = "Evangel Church, 5350 Veterans Pkwy, Columbus, GA 31904";

  /* ---------- Copy address ---------- */

  const copy = document.getElementById("copy");
  function copied() {
    copy.textContent = "Copied";
    setTimeout(function () { copy.textContent = "Copy address"; }, 1800);
  }
  copy.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ADDRESS).then(copied, fallbackCopy);
    } else {
      fallbackCopy();
    }
  });
  function fallbackCopy() {
    const field = document.createElement("textarea");
    field.value = ADDRESS;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(field);
    field.select();
    try { document.execCommand("copy"); copied(); } catch (err) { /* nothing else to try */ }
    field.remove();
  }

  /* ---------- Countdown ---------- */

  const label = document.getElementById("cd-label");
  const sub = document.getElementById("cd-sub");
  const units = document.getElementById("cd-units");
  const DAY = 86400000, HOUR = 3600000, MIN = 60000;
  const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: Clock.TZ, year: "numeric", month: "2-digit", day: "2-digit" });

  // Defaults match schedule.json; the live data replaces them when it loads.
  let times = {
    checkin: new Date("2026-10-17T09:15:00-04:00").getTime(),
    doors: new Date("2026-10-17T09:45:00-04:00").getTime(),
    end: new Date("2026-10-17T16:00:00-04:00").getTime()
  };

  function unit(value, one, many) {
    return '<div class="count__unit"><span class="count__num">' + value + '</span><span class="count__label">' + (value === 1 ? one : many) + "</span></div>";
  }

  function boxes(ms, sameDay) {
    if (sameDay) {
      return unit(Math.floor(ms / HOUR), "Hour", "Hours") + unit(Math.floor((ms % HOUR) / MIN), "Minute", "Minutes") + unit(Math.floor((ms % MIN) / 1000), "Second", "Seconds");
    }
    return unit(Math.floor(ms / DAY), "Day", "Days") + unit(Math.floor((ms % DAY) / HOUR), "Hour", "Hours") + unit(Math.floor((ms % HOUR) / MIN), "Minute", "Minutes");
  }

  function render() {
    const now = Clock.now();
    const t = now.getTime();
    const sameDay = dateFmt.format(now) === dateFmt.format(new Date(times.checkin));
    let l, s = "", u = "";
    if (t < times.checkin) {
      l = "Check-in opens in";
      u = boxes(Math.ceil((times.checkin - t) / 1000) * 1000, sameDay);
    } else if (t < times.doors) {
      l = "Doors open in";
      u = boxes(Math.ceil((times.doors - t) / 1000) * 1000, true);
      s = "Check-in is open at the South Entrance";
    } else if (t < times.end) {
      l = "Doors are open";
      s = "Head to the Sanctuary";
    } else {
      l = "Thanks for being WITH us";
    }
    if (label.textContent !== l) label.textContent = l;
    sub.textContent = s;
    sub.hidden = !s;
    units.innerHTML = u;
    units.hidden = !u;
  }

  fetch("/data/schedule.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (!data) return;
    const by = {};
    (data.sessions || []).forEach(function (s) { by[s.id] = s; });
    const last = (data.sessions || [])[data.sessions.length - 1];
    if (by.checkin) times.checkin = new Date(by.checkin.start).getTime();
    if (by.doors) times.doors = new Date(by.doors.start).getTime();
    if (last) times.end = last.end ? new Date(last.end).getTime() : new Date(last.start).getTime() + 30 * MIN;
    render();
  }).catch(function () {});

  render();
  setInterval(render, 1000);
})();
