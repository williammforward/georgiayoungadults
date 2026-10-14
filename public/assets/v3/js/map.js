/* Map: pinch-zoomable venue map, room pills, and a card for the selected room. */
(function () {
  "use strict";

  const S = window.Site;
  const h = S.h;
  const MAP_URL = "/assets/v3/map.svg?v=1";
  const MAX_SCALE = 5;
  const view = document.getElementById("map-view");
  const canvas = document.getElementById("map-canvas");
  const chips = document.getElementById("chips");
  const roomCard = document.getElementById("room-card");
  const headPills = document.getElementById("head-pills");
  const zoomIn = document.getElementById("zoom-in");
  const zoomOut = document.getElementById("zoom-out");

  let data = null;
  let svg = null;
  let aspect = 1;
  let selected = null;

  // scale 1 = whole map fits the view. tx/ty = canvas offset inside the view.
  let vw = 0, vh = 0, baseW = 0, baseH = 0;
  let scale = 1, tx = 0, ty = 0;
  let committed = 1;
  let commitTimer = null;

  /* ---------- Pan and zoom ---------- */

  function clampPosition() {
    const cw = baseW * scale;
    const ch = baseH * scale;
    tx = cw <= vw ? (vw - cw) / 2 : Math.min(0, Math.max(vw - cw, tx));
    ty = ch <= vh ? (vh - ch) / 2 : Math.min(0, Math.max(vh - ch, ty));
  }

  function render() {
    canvas.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + (scale / committed) + ")";
    view.classList.toggle("is-zoomed", scale > 1.01);
    zoomOut.disabled = scale <= 1.01;
    zoomIn.disabled = scale >= MAX_SCALE - .01;
  }

  // Re-lay the SVG out at the new size so it stays sharp after zooming.
  function commit() {
    clearTimeout(commitTimer);
    canvas.classList.remove("is-animating");
    committed = scale;
    canvas.style.width = (baseW * scale) + "px";
    canvas.style.height = (baseH * scale) + "px";
    render();
  }

  function commitSoon(delay) {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, delay);
  }

  function measure() {
    vw = view.clientWidth;
    vh = view.clientHeight;
    baseW = Math.min(vw, vh * aspect);
    baseH = baseW / aspect;
  }

  function moveTo(nextScale, nextTx, nextTy, animated) {
    scale = Math.min(MAX_SCALE, Math.max(1, nextScale));
    tx = nextTx;
    ty = nextTy;
    clampPosition();
    if (animated && !S.reduceMotion.matches) {
      canvas.classList.add("is-animating");
      render();
      commitSoon(540);
    } else {
      commit();
    }
  }

  // Zoom while keeping the map point under (px, py) in place.
  function zoomAt(px, py, nextScale, animated) {
    const target = Math.min(MAX_SCALE, Math.max(1, nextScale));
    const k = target / scale;
    moveTo(target, px - (px - tx) * k, py - (py - ty) * k, animated);
  }

  function fit(animated) {
    moveTo(1, 0, 0, animated);
  }

  function focusRoom(node, animated) {
    const c = canvas.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const live = c.width / baseW;
    const cx = (r.left + r.width / 2 - c.left) / live;
    const cy = (r.top + r.height / 2 - c.top) / live;
    const rw = Math.max(1, r.width / live);
    const rh = Math.max(1, r.height / live);
    const target = Math.min(4, Math.max(1.7, Math.min(vw / (rw * 2.6), vh / (rh * 2.6))));
    moveTo(target, vw / 2 - cx * target, vh / 2 - cy * target, animated);
  }

  const pointers = new Map();
  let gesture = null;
  let moved = false;
  let downAt = 0;
  let lastTap = { time: 0, x: 0, y: 0 };

  function local(e) {
    const box = view.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  function startGesture() {
    const pts = Array.from(pointers.values());
    if (pts.length >= 2) {
      gesture = {
        type: "pinch",
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1,
        mx: (pts[0].x + pts[1].x) / 2,
        my: (pts[0].y + pts[1].y) / 2,
        scale: scale, tx: tx, ty: ty
      };
    } else if (pts.length === 1) {
      gesture = { type: "pan", x: pts[0].x, y: pts[0].y, tx: tx, ty: ty };
    } else {
      gesture = null;
    }
  }

  view.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".map__zoom") || !svg) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearTimeout(commitTimer);
    canvas.classList.remove("is-animating");
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 1) {
      moved = false;
      downAt = Date.now();
    }
    try { view.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    startGesture();
  });

  view.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, local(e));
    const pts = Array.from(pointers.values());

    if (gesture.type === "pinch" && pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const next = Math.min(MAX_SCALE, Math.max(1, gesture.scale * dist / gesture.dist));
      const k = next / gesture.scale;
      scale = next;
      tx = mx - (gesture.mx - gesture.tx) * k;
      ty = my - (gesture.my - gesture.ty) * k;
      moved = true;
      clampPosition();
      render();
    } else if (gesture.type === "pan" && pts.length === 1) {
      const dx = pts[0].x - gesture.x;
      const dy = pts[0].y - gesture.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (scale > 1.01) {
        tx = gesture.tx + dx;
        ty = gesture.ty + dy;
        clampPosition();
        render();
      }
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    const point = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    startGesture();
    if (pointers.size) return;
    commitSoon(120);
    if (e.type === "pointerup" && !moved && Date.now() - downAt < 400) tap(point, e);
  }

  view.addEventListener("pointerup", endPointer);
  view.addEventListener("pointercancel", endPointer);

  function tap(point, e) {
    const now = Date.now();
    const double = now - lastTap.time < 320 && Math.hypot(point.x - lastTap.x, point.y - lastTap.y) < 30;
    lastTap = double ? { time: 0, x: 0, y: 0 } : { time: now, x: point.x, y: point.y };
    if (double) {
      zoomAt(point.x, point.y, scale >= MAX_SCALE - .5 ? 1 : scale * 2, true);
      return;
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const room = hit && hit.closest ? hit.closest(".room") : null;
    if (room) select(room.getAttribute("data-room"), true);
  }

  // Trackpad pinch (ctrl + wheel). Plain wheel is left alone so the page still scrolls.
  view.addEventListener("wheel", function (e) {
    if (!e.ctrlKey || !svg) return;
    e.preventDefault();
    const p = local(e);
    zoomAt(p.x, p.y, scale * Math.exp(-e.deltaY * .012), false);
  }, { passive: false });

  // Safari's own pinch would zoom the whole page.
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (type) {
    view.addEventListener(type, function (e) { e.preventDefault(); });
  });

  zoomIn.addEventListener("click", function () { zoomAt(vw / 2, vh / 2, scale * 1.7, true); });
  zoomOut.addEventListener("click", function () { zoomAt(vw / 2, vh / 2, scale / 1.7, true); });

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!svg || view.clientWidth === vw && view.clientHeight === vh) return;
      measure();
      const node = selected ? roomNode(selected) : null;
      fit(false);
      if (node) focusRoom(node, false);
    }, 150);
  });

  /* ---------- Rooms ---------- */

  function roomNode(id) {
    return svg ? svg.querySelector('[data-room="' + id + '"]') : null;
  }

  function happening(id, t) {
    const rows = [];
    data.sessions.forEach(function (s) {
      if (s.room === id) {
        rows.push({ at: s.startAt, title: s.title, now: S.sessionState(s, t) === "now" });
      }
      (s.breakouts || []).forEach(function (b) {
        if (b.room === id) {
          rows.push({
            at: s.startAt,
            title: b.title,
            sub: (b.speakers || []).join(" & "),
            href: S.link("breakouts", { b: b.id }),
            now: S.sessionState(s, t) === "now"
          });
        }
      });
    });
    return rows.sort(function (a, b) { return a.at - b.at; });
  }

  function liveRooms(t) {
    const ids = {};
    data.sessions.forEach(function (s) {
      if (S.sessionState(s, t) !== "now") return;
      if (s.room) ids[s.room] = true;
      (s.breakouts || []).forEach(function (b) { if (b.room) ids[b.room] = true; });
    });
    return ids;
  }

  function renderCard(t) {
    if (!selected || !data.rooms[selected]) {
      roomCard.replaceChildren(h("div", { class: "notice" },
        h("p", { class: "t-body" }, "Tap a room below to find it on the map. Pinch or use + to zoom in.")));
      return;
    }
    const room = data.rooms[selected];
    const rows = happening(selected, t);
    const card = h("section", { class: "card card--static card--sun roomcard", "aria-live": "polite" },
      room.area ? h("div", { class: "card__pills" }, S.pill(room.area)) : null,
      h("h2", { class: "t-head card__title" }, room.label),
      rows.length
        ? h("div", { class: "happen" }, rows.map(function (row) {
            return h(row.href ? "a" : "div", { class: "happen__row", href: row.href || null },
              h("div", { class: "happen__main" },
                h("div", { class: "card__pills" },
                  row.now ? h("span", { class: "pill pill--now" }, h("span", { class: "dot dot--pulse" }), "Now") : null,
                  S.pill(S.fmtTime(row.at), "white")),
                h("span", { class: "happen__title" }, row.title),
                row.sub ? h("span", { class: "happen__sub" }, row.sub) : null),
              row.href ? S.arrow() : null);
          }))
        : h("p", { class: "t-body roomcard__empty" }, "Nothing scheduled here today."));
    roomCard.replaceChildren(card);
  }

  function select(id, animated) {
    const next = id && data.rooms[id] ? (id === selected && animated ? null : id) : null;
    selected = next;

    if (svg) {
      svg.querySelectorAll(".room.is-selected").forEach(function (n) { n.classList.remove("is-selected"); });
      const node = next ? roomNode(next) : null;
      if (node) {
        node.classList.add("is-selected");
        focusRoom(node, animated);
      } else if (animated) {
        fit(true);
      }
    }

    chips.querySelectorAll(".chip").forEach(function (chip) {
      const on = chip.getAttribute("data-room") === next;
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) {
        const left = chip.offsetLeft - (chips.clientWidth - chip.offsetWidth) / 2;
        chips.scrollTo({ left: left, behavior: S.reduceMotion.matches || !animated ? "auto" : "smooth" });
      }
    });

    renderCard(S.now());
    history.replaceState(history.state, "", S.link("map", next ? { room: next } : null));
  }

  function mountMap(text) {
    const parsed = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
    if (parsed.nodeName.toLowerCase() !== "svg") throw new Error("map.svg is not an SVG");
    svg = document.importNode(parsed, true);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Map of " + (data.event.venue || "the venue"));
    canvas.replaceChildren(svg);

    const box = svg.getBBox();
    const pad = 10;
    svg.setAttribute("viewBox", [box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2].join(" "));
    aspect = (box.width + pad * 2) / (box.height + pad * 2);

    const breakoutRooms = {};
    data.breakouts.forEach(function (b) { if (b.room) breakoutRooms[b.room] = true; });
    data.roomList.forEach(function (room) {
      const node = svg.getElementById ? svg.getElementById(room.id) : svg.querySelector("#" + room.id);
      if (!node) return;
      node.classList.add("room");
      // The artwork colors every former breakout room. Only rooms that host a
      // breakout today keep the tint; the rest are drawn plain.
      const painted = node.matches("path") ? node : node.querySelector("path");
      const highlighted = !!painted && /^rgb\(39\./.test(painted.getAttribute("fill") || "");
      if (breakoutRooms[room.id]) node.classList.add("room--tint");
      else if (highlighted) node.classList.add("room--plain");
      node.setAttribute("data-room", room.id);
    });

    measure();
    fit(false);
  }

  S.schedule().then(function (loaded) {
    data = loaded;
    if (data.event.venue) headPills.replaceChildren(S.pill(data.event.venue, "white"));

    chips.replaceChildren.apply(chips, data.roomList.map(function (room) {
      return h("button", {
        class: "chip", type: "button", "data-room": room.id, "aria-pressed": "false",
        onclick: function () { select(room.id, true); }
      }, room.label);
    }));
    renderCard(S.now());

    return fetch(MAP_URL).then(function (res) {
      if (!res.ok) throw new Error(MAP_URL + " returned " + res.status);
      return res.text();
    }).then(function (text) {
      mountMap(text);
      const wanted = new URLSearchParams(location.search).get("room");
      if (wanted && data.rooms[wanted]) select(wanted, false);

      S.onTick(function (t) {
        const live = liveRooms(t);
        svg.querySelectorAll(".room").forEach(function (node) {
          node.classList.toggle("is-live", !!live[node.getAttribute("data-room")]);
        });
        renderCard(t);
      });
    });
  }).catch(function (err) {
    console.error(err);
    canvas.replaceChildren();
    view.appendChild(h("div", { class: "map__status" },
      h("p", { class: "t-body" }, "The map didn’t load. Check your connection and pull down to refresh.")));
  });
})();
