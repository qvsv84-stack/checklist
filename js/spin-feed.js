/* =========================================================
   SPIN FEED — Landing widget
   ---------------------------------------------------------
   - Hiện 3 tin vòng quay mới nhất trên landing
   - ≥10 tin → auto-rotate 1s/tin (slide up effect)
   - Poll mỗi 30s
   - Lắng nghe event "spinCompleted" từ shop.js
   - Works for anonymous users too
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
    queue: [],          // tin chưa hiển thị
    displayed: [],      // 3 tin đang hiển thị
    rotating: false,
    rotateTimer: null,
    pollTimer: null,
    booted: false,
    lastFetch: 0
  };

  function log(...a) { if (window.__SRANK_DEBUG) console.log("[SpinFeed]", ...a); }

  /* ═══════════════════════════════════════════════════════
     INJECT DOM — chèn vào #questionWrap trước #question
     ═══════════════════════════════════════════════════════ */
  function ensureFeedEl() {
    let el = document.getElementById(FEED_ID);
    if (el) return el;

    const wrap = document.getElementById("questionWrap");
    if (!wrap) return null;

    el = document.createElement("div");
    el.id = FEED_ID;
    el.className = "spin-feed";
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
    el.innerHTML = '<div class="spin-feed-list" id="spinFeedList"></div>';

    /* Chèn trước #question */
    const question = document.getElementById("question");
    if (question && question.parentNode === wrap) {
      wrap.insertBefore(el, question);
    } else {
      wrap.appendChild(el);
    }

    return el;
  }

  /* ═══════════════════════════════════════════════════════
     FETCH
     ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
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

    /* Ẩn nếu không có tin */
    if (!count) {
      feedEl.style.display = "none";
      feedEl.setAttribute("aria-hidden", "true");
      listEl.innerHTML = "";
      state.displayed = [];
      state.queue = [];
      return;
    }

    feedEl.style.display = "";
    feedEl.setAttribute("aria-hidden", "false");

    state.displayed = data.slice(0, count);
    state.queue = data.slice(count);

    listEl.innerHTML = "";
    state.displayed.forEach(function(s) {
      listEl.appendChild(createItemEl(s));
    });
  }

  /* ═══════════════════════════════════════════════════════
     AUTO ROTATE
     ═══════════════════════════════════════════════════════ */
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
    if (!state.queue.length) {
      stopRotate();
      return;
    }

    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) { stopRotate(); return; }

    const feedEl = document.getElementById(FEED_ID);
    if (!feedEl || feedEl.style.display === "none") {
      /* Không hiển thị (trang khác) → tạm dừng */
      state.rotateTimer = setTimeout(tickRotate, ROTATE_INTERVAL_MS);
      return;
    }

    /* Lấy tin tiếp theo */
    const next = state.queue.shift();
    if (!next) { stopRotate(); return; }

    /* Append tin mới vào cuối */
    const newItem = createItemEl(next);
    newItem.classList.add("spin-feed-item-enter");
    listEl.appendChild(newItem);

    /* Đo chiều cao 1 dòng */
    const firstItem = listEl.firstElementChild;
    const lineH = firstItem ? firstItem.getBoundingClientRect().height : 32;

    /* Animate list dịch lên */
    listEl.style.transition = "transform 0.42s cubic-bezier(0.4, 0.0, 0.2, 1)";
    listEl.style.transform = "translateY(-" + lineH + "px)";

    /* Sau animation: remove item đầu, reset transform */
    setTimeout(function() {
      if (listEl.firstElementChild) {
        listEl.removeChild(listEl.firstElementChild);
      }
      listEl.style.transition = "none";
      listEl.style.transform = "translateY(0)";
      void listEl.offsetHeight;   /* reflow */

      /* Cập nhật displayed state */
      state.displayed.shift();
      state.displayed.push(next);

      /* Nếu còn queue → tick tiếp */
      if (state.queue.length) {
        state.rotateTimer = setTimeout(tickRotate, ROTATE_INTERVAL_MS - 420);
      } else {
        stopRotate();
      }
    }, 440);
  }

  /* ═══════════════════════════════════════════════════════
     REFRESH — fetch + render + auto-rotate
     ═══════════════════════════════════════════════════════ */
  async function refresh() {
    /* Nếu đang rotate → bỏ qua, tránh conflict */
    if (state.rotating) return;

    const data = await fetchRecent();
    state.data = data;
    state.lastFetch = Date.now();

    renderInitial();

    /* Bắt đầu rotate nếu đủ điều kiện */
    if (shouldRotate()) {
      /* Đợi 1 nhịp trước khi bắt đầu */
      state.rotateTimer = setTimeout(startRotate, 1200);
    }
  }

  /* ═══════════════════════════════════════════════════════
     POLL
     ═══════════════════════════════════════════════════════ */
  function startPoll() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function() {
      if (document.hidden) return;
      /* Chỉ refresh khi đang ở landing (không có overlay khác) */
      const isHome = !document.querySelector('.admin-panel-view.show')
        && !document.getElementById('shopPage')?.classList.contains('show')
        && !document.getElementById('attendancePage')?.classList.contains('show')
        && !document.getElementById('clV6Page')?.classList.contains('show');
      if (!isHome) return;
      refresh();
    }, POLL_MS);
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */
  function bindEvents() {
    /* Khi user vừa quay xong → refresh ngay (không đợi 30s) */
    window.addEventListener("spinCompleted", function() {
      /* Nếu đang rotate → chờ xong rồi refresh */
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

    /* Đổi tên → cập nhật UI */
    window.addEventListener("displayNameUpdated", function() {
      if (state.rotating) return;
      if (state.displayed.length) {
        renderInitial();
      }
    });

    /* Tab visible lại → refresh */
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) refresh();
    });
  }

  /* ═══════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════ */
  function boot() {
    if (state.booted) return;

    /* Đợi #questionWrap xuất hiện */
    let tries = 0;
    (function waitWrap() {
      const wrap = document.getElementById("questionWrap");
      if (wrap) {
        state.booted = true;
        ensureFeedEl();
        bindEvents();
        refresh();
        startPoll();
        log("v1.0 ready ✓");
        return;
      }
      if (++tries > 60) {
        log("không tìm thấy #questionWrap sau 6s");
        return;
      }
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