/* =========================================================
   SPIN FEED — v1.2
   ---------------------------------------------------------
   v1.2:
   ✅ Chỉ hiện 1 tin mới nhất (1 dòng)
   ✅ Khi có tin mới: tin cũ bay lên + tan, tin mới bay từ dưới lên
   ✅ Không khung, chỉ text
   v1.1:
   - Fixed height + signature check
   ========================================================= */
(function(){
  "use strict";
  if (window.__spinFeedLoaded) return;
  window.__spinFeedLoaded = true;

  const POLL_MS = 30000;
  const FEED_ID = "spinFeed";
  const CONTAINER_ID = "spinFeedList";
  const ANIM_MS = 480;

  const state = {
    current: null,
    animating: false,
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
      const res = await sb.rpc("rpc_shop_recent_spins", { p_limit: 3 });
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

  /* ⭐ v1.2: Render tin mới với animation */
  function renderNew(newSpin, isInitial) {
    const feedEl = ensureFeedEl();
    if (!feedEl) return;

    const listEl = document.getElementById(CONTAINER_ID);
    if (!listEl) return;

    if (!newSpin) {
      /* Không có tin → ẩn */
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

    /* Lần đầu → render trực tiếp, không animation */
    if (isInitial || !listEl.firstElementChild) {
      listEl.innerHTML = "";
      listEl.appendChild(createItemEl(newSpin));
      state.current = newSpin;
      return;
    }

    /* Đã có tin cũ → animate out rồi in */
    if (state.animating) return;
    state.animating = true;

    const oldItem = listEl.firstElementChild;
    oldItem.classList.add("spin-feed-item-out");

    const newItem = createItemEl(newSpin);
    newItem.classList.add("spin-feed-item-in");
    listEl.appendChild(newItem);

    setTimeout(function() {
      if (oldItem && oldItem.parentNode) oldItem.remove();
      /* Reset classes của tin mới */
      newItem.classList.remove("spin-feed-item-in");
      state.current = newSpin;
      state.animating = false;
    }, ANIM_MS);
  }

  /* ⭐ v1.2: So sánh tin mới vs tin hiện tại */
  function spinKey(spin) {
    return spin ? String(spin.id) : "";
  }

  async function refresh() {
    if (state.animating) return;

    const data = await fetchRecent();
    const latest = data && data.length ? data[0] : null;
    const latestKey = spinKey(latest);
    const currentKey = spinKey(state.current);

    /* Không đổi → skip */
    if (latestKey === currentKey) return;

    renderNew(latest, !state.current);
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
    /* Khi có spin mới ở bất kỳ đâu */
    window.addEventListener("spinCompleted", function() {
      setTimeout(refresh, 300);
    });

    /* Đổi tên → update UI nếu có tin */
    window.addEventListener("displayNameUpdated", function() {
      if (state.current && !state.animating) {
        const listEl = document.getElementById(CONTAINER_ID);
        if (listEl) {
          listEl.innerHTML = "";
          listEl.appendChild(createItemEl(state.current));
        }
      }
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
        log("v1.2 ready ✓");
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
    getCurrent: function() { return state.current; }
  };
})();