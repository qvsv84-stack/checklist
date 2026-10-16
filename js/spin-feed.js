/* =========================================================
   SPIN FEED — v1.4 (Performance)
   ---------------------------------------------------------
   v1.4 FIX (web chậm):
   ✅ Delay 3s sau boot (thay 800ms) → không tranh bandwidth
   ✅ Chỉ fetch khi tab visible + không ở shop/admin/attendance
   ✅ Auto-rotate tạm dừng khi tab hidden → không chạy ngầm
   ✅ Skip fetch nếu <5s từ lần fetch trước (chống spam)
   ✅ Cache data — không fetch lại nếu không có tin mới
   v1.3:
   - Load 10 tin, nhảy dần cũ → mới
   ========================================================= */
(function(){
  "use strict";
  if (window.__spinFeedLoaded) return;
  window.__spinFeedLoaded = true;

  const POLL_MS = 30000;
  const FEED_ID = "spinFeed";
  const CONTAINER_ID = "spinFeedList";
  const ANIM_MS = 480;
  const STEP_MS = 1000;
  const FETCH_LIMIT = 10;
  const MIN_FETCH_GAP_MS = 5000;
  const BOOT_DELAY_MS = 3000;

  const state = {
    queue: [],
    current: null,
    lastShownKey: "",
    running: false,
    animating: false,
    timer: null,
    pollTimer: null,
    booted: false,
    lastFetchAt: 0,
    lastFetchData: []
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

  /* ⭐ v1.4: có phải đang ở home page không */
  function isHomePage() {
    if (document.querySelector('.admin-panel-view.show')) return false;
    if (document.getElementById('shopPage')?.classList.contains('show')) return false;
    if (document.getElementById('attendancePage')?.classList.contains('show')) return false;
    if (document.getElementById('clV6Page')?.classList.contains('show')) return false;
    if (document.getElementById('loginOverlay')?.classList.contains('show')) return false;
    return true;
  }

  /* ⭐ v1.4: fetch với cache + guard */
  async function fetchRecent(force) {
    /* Guard: chống spam */
    if (!force && Date.now() - state.lastFetchAt < MIN_FETCH_GAP_MS) {
      return state.lastFetchData;
    }

    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];

    try {
      const res = await sb.rpc("rpc_shop_recent_spins", { p_limit: FETCH_LIMIT });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return [];
      const arr = Array.isArray(d.data) ? d.data : [];
      /* RPC trả mới → cũ, đảo thành cũ → mới */
      const reversed = arr.slice().reverse();
      state.lastFetchAt = Date.now();
      state.lastFetchData = reversed;
      return reversed;
    } catch(e) {
      log("fetch error:", e && e.message);
      return state.lastFetchData;
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

  function startAutoPlay() {
    if (state.running) return;
    if (!state.queue.length) return;
    state.running = true;
    tick();
  }

  /* ⭐ v1.4: tick với pause khi tab hidden hoặc rời home */
  function tick() {
    if (!state.running) return;

    /* ⭐ Pause khi tab hidden → tiết kiệm CPU */
    if (document.hidden) {
      state.timer = setTimeout(tick, 1000);
      return;
    }

    /* ⭐ Pause khi rời home page */
    if (!isHomePage()) {
      state.timer = setTimeout(tick, 500);
      return;
    }

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

  async function loadAndPlay() {
    if (state.running || state.animating) return;

    const data = await fetchRecent();
    if (!data.length) {
      renderStatic(null);
      return;
    }

    const lastKey = spinKey(data[data.length - 1]);
    if (lastKey === state.lastShownKey && state.current) return;

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

    state.queue = state.queue.concat(data);
    if (!state.running) startAutoPlay();
  }

  async function refresh(force) {
    if (state.running || state.animating) return;
    if (document.hidden) return;
    if (!isHomePage()) return;

    const data = await fetchRecent(force);
    if (!data.length) return;

    /* Lọc chỉ giữ tin mới hơn tin cuối đã hiển thị */
    let toAdd = data;
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
      /* ⭐ v1.4: guard kỹ trước khi poll */
      if (document.hidden) return;
      if (state.running || state.animating) return;
      if (!isHomePage()) return;
      refresh(false);
    }, POLL_MS);
  }

  function bindEvents() {
    window.addEventListener("spinCompleted", function() {
      setTimeout(function() { refresh(true); }, 500);
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
      /* ⭐ v1.4: khi tab ẩn → dừng auto-play ngay */
      if (document.hidden) {
        /* Không cancel timer, chỉ để tick tự pause */
        return;
      }
      /* Tab visible lại → refresh nếu không animating */
      if (!state.running && !state.animating) refresh(false);
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
        /* ⭐ v1.4: delay 3s trước khi fetch */
        setTimeout(function() { loadAndPlay(); }, BOOT_DELAY_MS);
        startPoll();
        log("v1.4 ready ✓ (delay 3s + pause when hidden)");
        return;
      }
      if (++tries > 60) { log("không tìm thấy #questionWrap"); return; }
      setTimeout(waitWrap, 100);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(boot, 500); }, { once: true });
  } else {
    setTimeout(boot, 500);
  }

  window.SpinFeed = {
    refresh: refresh,
    reload: loadAndPlay,
    getCurrent: function() { return state.current; },
    getQueue: function() { return state.queue.slice(); }
  };
})();