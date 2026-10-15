/* Temporary registration homepage: schedule from the guide's data, and click-to-play videos. */
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

  /* ---------- Click-to-play YouTube ---------- */

  // Nothing loads from YouTube until a video is tapped. Phones and Safari go
  // through YouTube's player API, which starts playback right away instead of
  // needing a second tap; everything else gets a plain embed.
  const HOST = "https://www.youtube-nocookie.com";
  const useApi = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent) || /Apple/.test(navigator.vendor || "");
  let apiReady = null;

  function loadApi() {
    if (!apiReady) {
      apiReady = new Promise(function (resolve, reject) {
        if (window.YT && window.YT.Player) { resolve(window.YT); return; }
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          if (previous) previous();
          resolve(window.YT);
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onerror = reject;
        document.head.appendChild(tag);
        setTimeout(function () { reject(new Error("YouTube API timed out")); }, 5000);
      });
    }
    return apiReady;
  }

  function embed(box, id, title) {
    const frame = document.createElement("iframe");
    frame.src = HOST + "/embed/" + encodeURIComponent(id) + "?autoplay=1&playsinline=1&rel=0";
    frame.title = title;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    box.replaceChildren(frame);
  }

  function play(box) {
    const id = box.getAttribute("data-yt");
    const button = box.querySelector(".video__start");
    const title = button ? button.getAttribute("aria-label") : "Video";
    if (!useApi) { embed(box, id, title); return; }

    const slot = document.createElement("div");
    slot.className = "video__frame";
    if (button) button.disabled = true;
    loadApi().then(function (YT) {
      box.replaceChildren(slot);
      const player = new YT.Player(slot, {
        host: HOST,
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: { onReady: function (e) { e.target.playVideo(); } }
      });
      const frame = player.getIframe && player.getIframe();
      if (frame) frame.title = title;
    }).catch(function () {
      embed(box, id, title);
    });
  }

  document.querySelectorAll(".video[data-yt]").forEach(function (box) {
    const button = box.querySelector(".video__start");
    if (button) button.addEventListener("click", function () { play(box); });
  });
})();
