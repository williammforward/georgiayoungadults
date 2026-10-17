/* Shared clock: Eastern time, with the ?now= test mode. Used by the guide and /directions/. */
(function () {
  "use strict";

  const TZ = "America/New_York";
  const TICK_MS = 30000;

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

  window.WithClock = { TZ: TZ, parseEastern: parseEastern, now: now, onTick: onTick, nowParam: nowParam, fakeNow: fakeNow };
})();
