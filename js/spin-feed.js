/* =========================================================
   SPIN FEED — v1.3
   ---------------------------------------------------------
   v1.3:
   ✅ Load 10 tin gần nhất khi vào web
   ✅ Nhảy dần từ cũ nhất → mới nhất (1s/tin)
   ✅ Animation: tin cũ bay lên + tan, tin mới bay từ dưới lên
   ✅ Hết queue → giữ tin mới nhất
   ✅ Poll 30s: tự append tin mới vào queue
   v1.2:
   - 1 dòng + bay lên
   ========================================================= */
(function(){
  "use strict";
  if (window.__spinFeedLoaded) return;
  window.__spinFeedLoaded = true;

  const POLL_MS = 30000;
  const FEED_ID = "spinFeed";
  const CONTAINER_ID = "spinFeedList";
  const ANIM_MS = 480;
  const STEP_MS = 1000;      // 1s/tin
  const FETCH_LIMIT = 10;    // 10 tin gần nhất

  const state = {
    queue: [],              // Các tin CHƯA hiển thị (cũ → mới)
    current: null,          // Tin đang hiển thị
    lastShownKey: "",       // Key của tin cuối đã hiển thị (chống trùng)
    running: false,         // Auto-play đang chạy
    animating: false,       // Đang chạy animation
    timer: null,
    pollTimer: null,
    booted: false
  };

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
      const res = await sb.rpc("rpc_shop_recent_spins", { p_limit: FETCH_LIMIT });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return [];
      const arr = Array.isArray(d.data) ? d.data : [];
      /* RPC trả về mới → cũ, đảo lại thành cũ → mới */
      return arr.slice().reverse();
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

  function spinKey(spin) {
    return spin ? String(spin.id) : "";
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

  /* ⭐ Hiển thị tin (không animation) */
  function renderStatic(spin) {
    const feedEl = ensureFeedEl();
    if (!feedEl) return;
    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) return;

    if (!spin) {
      feedEl.classList.add("spin-feed-hidden");
      feedEl.setAttribute("aria-hidden", "true");
      setTimeout(function() {
        listEl.innerHTML = "";
      }, 350);
      state.current = null;
      return;
    }

    feedEl.classList.remove("spin-feed-hidden");
    feedEl.setAttribute("aria-hidden", "false");
    listEl.innerHTML = "";
    listEl.appendChild(createItemEl(spin));
    state.current = spin;
  }

  /* ⭐ Hiển thị tin với animation bay lên */
  function renderTransition(newSpin) {
    const feedEl = ensureFeedEl();
    if (!feedEl) return;
    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) return;

    feedEl.classList.remove("spin-feed-hidden");
    feedEl.setAttribute("aria-hidden", "false");

    const oldItem = listEl.firstElementChild;
    const newItem = createItemEl(newSpin);

    if (!oldItem) {
      listEl.appendChild(newItem);
      state.current = newSpin;
      return;
    }

    oldItem.classList.add("spin-feed-item-out");
    newItem.classList.add("spin-feed-item-in");
    listEl.appendChild(newItem);

    setTimeout(function() {
      if (oldItem && oldItem.parentNode) oldItem.remove();
      newItem.classList.remove("spin-feed-item-in");
      state.current = newSpin;
    }, ANIM_MS);
  }

  /* ⭐ Auto-play: nhảy từng tin trong queue */
  function startAutoPlay() {
    if (state.running) return;
    if (!state.queue.length) return;
    state.running = true;
    tick();
  }

  function tick() {
    if (!state.running) return;
    if (!state.queue.length) {
      state.running = false;
      log("auto-play done");
      return;
    }

    const next = state.queue.shift();

    if (state.animating) {
      state.timer = setTimeout(tick, STEP_MS);
      return;
    }

    if (state.current) {
      state.animating = true;
      renderTransition(next);
      setTimeout(function() {
        state.animating = false;
      }, ANIM_MS);
    } else {
      renderStatic(next);
    }

    state.lastShownKey = spinKey(next);

    if (state.queue.length) {
      state.timer = setTimeout(tick, STEP_MS);
    } else {
      state.running = false;
    }
  }

  /* ⭐ Load 10 tin + bắt đầu auto-play */
  async function loadAndPlay() {
    if (state.running || state.animating) return;

    const data = await fetchRecent();
    if (!data.length) {
      renderStatic(null);
      return;
    }

    /* Nếu không có gì thay đổi so với lần trước → skip */
    const lastKey = spinKey(data[data.length - 1]);
    if (lastKey === state.lastShownKey && state.current) return;

    /* Queue = tất cả trừ tin cuối (tin cuối sẽ hiện cuối cùng) */
    /* Nhưng nếu lần đầu (current = null) → hiện tin đầu tiên luôn */
    if (!state.current) {
      const first = data.shift();
      renderStatic(first);
      state.lastShownKey = spinKey(first);
      state.queue = data;
      if (state.queue.length) {
        state.timer = setTimeout(startAutoPlay, STEP_MS);
      }
      return;
    }

    /* Đã có tin đang hiện → append tin mới vào queue */
    state.queue = state.queue.concat(data);
    if (!state.running) startAutoPlay();
  }

  /* ⭐ Refresh: kiểm tra có tin mới không */
  async function refresh() {
    if (state.running || state.animating) return;

    const data = await fetchRecent();
    if (!data.length) return;

    /* Lọc chỉ giữ tin mới hơn tin cuối đã hiển thị */
    const newOnes = data.filter(function(s) {
      return spinKey(s) !== state.lastShownKey;
    });

    /* Nếu không có gì mới → skip */
    if (!newOnes.length) return;

    /* Nếu lastShownKey không có trong data → toàn bộ đều mới */
    /* Nếu có → chỉ giữ những tin sau lastShownKey */
    let toAdd = newOnes;
    if (state.lastShownKey) {
      const idx = data.findIndex(function(s) { return spinKey(s) === state.lastShownKey; });
      if (idx >= 0) toAdd = data.slice(idx + 1);
    }

    if (!toAdd.length) return;

    if (!state.current) {
      const first = toAdd.shift();
      renderStatic(first);
      state.lastShownKey = spinKey(first);
      state.queue = toAdd;
    } else {
      state.queue = state.queue.concat(toAdd);
    }

    if (state.queue.length && !state.running) {
      state.timer = setTimeout(startAutoPlay, 200);
    }
  }

  function startPoll() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function() {
      if (document.hidden) return;
      if (state.running || state.animating) return;
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
      setTimeout(refresh, 500);
    });

    window.addEventListener("displayNameUpdated", function() {
      if (state.running || state.animating) return;
      if (state.current) {
        const listEl = document.getElementById(CONTAINER_ID);
        if (listEl) {
          listEl.innerHTML = "";
          listEl.appendChild(createItemEl(state.current));
        }
      }
    });

    document.addEventListener("visibilitychange", function() {
      if (!document.hidden && !state.running && !state.animating) refresh();
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
        loadAndPlay();
        startPoll();
        log("v1.3 ready ✓");
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
    reload: loadAndPlay,
    getCurrent: function() { return state.current; },
    getQueue: function() { return state.queue.slice(); }
  };
})();