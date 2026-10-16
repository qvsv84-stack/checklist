/* =========================================================
   SPIN FEED — v1.1
   ---------------------------------------------------------
   v1.1 FIX (giật landing):
   ✅ Fixed height container (114px = 3×38) → không nhảy
   ✅ Dùng class .spin-feed-hidden thay display:none
   ✅ Signature check → không rebuild khi data không đổi
   ✅ Smooth height transition khi ẩn/hiện
   v1.0:
   - Hiện 3 tin mới nhất + auto-rotate 1s/tin
   ========================================================= */
(function(){
  "use strict";
  if (window.__spinFeedLoaded) return;
  window.__spinFeedLoaded = true;

  const POLL_MS = 30000;
  const VISIBLE_COUNT = 3;
  const AUTO_ROTATE_THRESHOLD = 10;
  const ROTATE_INTERVAL_MS = 1000;
  const FEED_ID = "spinFeed";
  const CONTAINER_ID = "spinFeedList";

  const state = {
    data: [],
    queue: [],
    displayed: [],
    rotating: false,
    rotateTimer: null,
    pollTimer: null,
    booted: false,
    lastFetch: 0
  };

  let _lastSig = "";

  function log(...a) { if (window.__SRANK_DEBUG) console.log("[SpinFeed]", ...a); }

  function ensureFeedEl() {
    let el = document.getElementById(FEED_ID);
    if (el) return el;

    const wrap = document.getElementById("questionWrap");
    if (!wrap) return null;

    el = document.createElement("div");
    el.id = FEED_ID;
    el.className = "spin-feed spin-feed-hidden";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="spin-feed-list" id="spinFeedList"></div>';

    const question = document.getElementById("question");
    if (question && question.parentNode === wrap) {
      wrap.insertBefore(el, question);
    } else {
      wrap.appendChild(el);
    }

    return el;
  }

  async function fetchRecent() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_shop_recent_spins", { p_limit: 20 });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return [];
      return Array.isArray(d.data) ? d.data : [];
    } catch(e) {
      log("fetch error:", e && e.message);
      return [];
    }
  }

  function avatarUrl(name) {
    try {
      if (typeof window.getAvatarUrl === "function") return window.getAvatarUrl(name) || "";
      if (window.SRank && typeof window.SRank.getAvatarUrl === "function") {
        return window.SRank.getAvatarUrl(name) || "";
      }
    } catch(_) {}
    return "";
  }

  function initialOf(name) {
    const s = String(name || "").trim();
    return s ? s.slice(0, 1).toUpperCase() : "?";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function createItemEl(spin) {
    const el = document.createElement("div");
    el.className = "spin-feed-item";

    const dn = (window.DN ? window.DN(spin.display_name) : spin.display_name) || "?";
    const av = avatarUrl(spin.display_name);
    const amount = Number(spin.prize_amount) || 0;

    const avHtml = av
      ? '<img class="spin-feed-av-img" src="' + escapeHtml(av) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\');">'
        + '<span class="spin-feed-av-fb">' + escapeHtml(initialOf(dn)) + '</span>'
      : '<span class="spin-feed-av-fb show">' + escapeHtml(initialOf(dn)) + '</span>';

    el.innerHTML =
      '<span class="spin-feed-icon">🎰</span>'
      + '<span class="spin-feed-av">' + avHtml + '</span>'
      + '<span class="spin-feed-text"><b>' + escapeHtml(dn) + '</b> vừa trúng '
      + '<b class="spin-feed-amount">' + amount + 'đ</b></span>';

    return el;
  }

  function renderInitial() {
    const feedEl = ensureFeedEl();
    if (!feedEl) return;

    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) return;

    const data = state.data || [];
    const count = Math.min(VISIBLE_COUNT, data.length);

    if (!count) {
      /* ⭐ v1.1: dùng class thay vì display:none → transition mượt */
      feedEl.classList.add("spin-feed-hidden");
      feedEl.setAttribute("aria-hidden", "true");
      listEl.innerHTML = "";
      state.displayed = [];
      state.queue = [];
      return;
    }

    feedEl.classList.remove("spin-feed-hidden");
    feedEl.setAttribute("aria-hidden", "false");

    state.displayed = data.slice(0, count);
    state.queue = data.slice(count);

    /* ⭐ v1.1: reset transform trước khi rebuild */
    listEl.style.transition = "none";
    listEl.style.transform = "translateY(0)";

    listEl.innerHTML = "";
    state.displayed.forEach(function(s) {
      listEl.appendChild(createItemEl(s));
    });
  }

  function shouldRotate() {
    return (state.data.length >= AUTO_ROTATE_THRESHOLD) && (state.queue.length > 0);
  }

  function stopRotate() {
    state.rotating = false;
    if (state.rotateTimer) {
      clearTimeout(state.rotateTimer);
      state.rotateTimer = null;
    }
  }

  function startRotate() {
    if (state.rotating) return;
    if (!shouldRotate()) return;
    state.rotating = true;
    tickRotate();
  }

  function tickRotate() {
    if (!state.rotating) return;
    if (!state.queue.length) { stopRotate(); return; }

    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) { stopRotate(); return; }

    const feedEl = document.getElementById(FEED_ID);
    if (!feedEl || feedEl.classList.contains("spin-feed-hidden")) {
      state.rotateTimer = setTimeout(tickRotate, ROTATE_INTERVAL_MS);
      return;
    }

    const next = state.queue.shift();
    if (!next) { stopRotate(); return; }

    const newItem = createItemEl(next);
    newItem.classList.add("spin-feed-item-enter");
    listEl.appendChild(newItem);

    const firstItem = listEl.firstElementChild;
    const lineH = firstItem ? firstItem.getBoundingClientRect().height : 38;

    listEl.style.transition = "transform 0.42s cubic-bezier(0.4, 0.0, 0.2, 1)";
    listEl.style.transform = "translateY(-" + lineH + "px)";

    setTimeout(function() {
      if (listEl.firstElementChild) {
        listEl.removeChild(listEl.firstElementChild);
      }
      listEl.style.transition = "none";
      listEl.style.transform = "translateY(0)";
      void listEl.offsetHeight;

      state.displayed.shift();
      state.displayed.push(next);

      if (state.queue.length) {
        state.rotateTimer = setTimeout(tickRotate, ROTATE_INTERVAL_MS - 420);
      } else {
        stopRotate();
      }
    }, 440);
  }

  /* ⭐ v1.1: signature để skip rebuild */
  function dataSignature(data) {
    return (data || []).slice(0, VISIBLE_COUNT).map(function(x) { return x.id; }).join("|");
  }

  async function refresh() {
    if (state.rotating) return;

    const data = await fetchRecent();
    const sig = dataSignature(data);

    /* ⭐ v1.1: nếu data không đổi → không rebuild */
    if (sig === _lastSig && state.data.length) {
      state.lastFetch = Date.now();
      return;
    }

    _lastSig = sig;
    state.data = data;
    state.lastFetch = Date.now();

    renderInitial();

    if (shouldRotate()) {
      state.rotateTimer = setTimeout(startRotate, 1200);
    }
  }

  function startPoll() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function() {
      if (document.hidden) return;
      const isHome = !document.querySelector('.admin-panel-view.show')
        && !document.getElementById('shopPage')?.classList.contains('show')
        && !document.getElementById('attendancePage')?.classList.contains('show')
        && !document.getElementById('clV6Page')?.classList.contains('show');
      if (!isHome) return;
      refresh();
    }, POLL_MS);
  }

  function bindEvents() {
    window.addEventListener("spinCompleted", function() {
      /* ⭐ v1.1: force refresh sau khi user khác quay */
      _lastSig = "";
      if (state.rotating) {
        const check = setInterval(function() {
          if (!state.rotating) {
            clearInterval(check);
            refresh();
          }
        }, 500);
      } else {
        refresh();
      }
    });

    window.addEventListener("displayNameUpdated", function() {
      if (state.rotating) return;
      /* Force rebuild để update tên mới */
      _lastSig = "";
      if (state.data.length) refresh();
    });

    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) refresh();
    });
  }

  function boot() {
    if (state.booted) return;

    let tries = 0;
    (function waitWrap() {
      const wrap = document.getElementById("questionWrap");
      if (wrap) {
        state.booted = true;
        ensureFeedEl();
        bindEvents();
        refresh();
        startPoll();
        log("v1.1 ready ✓");
        return;
      }
      if (++tries > 60) { log("không tìm thấy #questionWrap"); return; }
      setTimeout(waitWrap, 100);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(boot, 800); }, { once: true });
  } else {
    setTimeout(boot, 800);
  }

  window.SpinFeed = {
    refresh: refresh,
    getData: function() { return state.data; }
  };
})();