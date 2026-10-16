/* =========================================================
   SHOP VIEW — v1.2
   ---------------------------------------------------------
   v1.2 FIX (điểm luôn = 0):
   ✅ Balance đọc từ RPC rpc_shop_my_balance (server-side)
      Server tự match display_name → score_audit.name
   ✅ Không còn dùng scoreLeaderboard API (không tin name match)
   ✅ Purchase cũng để server tự đọc balance (không tin client)
   v1.1:
   - resolveRawChecklistName + fallback chain
   v1.0:
   - List item, mua item, TYPE B

   LOAD ORDER: SAU main.js
   ========================================================= */
(function(){
  "use strict";
  if (window.__shopLoaded) return;
  window.__shopLoaded = true;

  const PAGE_ID = "shopPage";
  const REFRESH_MS = 60000;
  const $ = id => document.getElementById(id);
  const Toast = window.Toast;

  const S = {
    items: [],
    categories: [],
    balance: { points: 0, spent: 0, available: 0 },
    currentUser: null,
    activeCategory: "",
    loading: false,
    pageOpen: false,
    booted: false,
    timer: null
  };

  const _avatarCache = new Map();

  /* ───── Helpers ───── */
  function log(...a) { console.log("[Shop]", ...a); }
  function setStatus(m) {
    try {
      if (window.SRank && typeof window.SRank.setStatus === "function") {
        window.SRank.setStatus(m);
      }
    } catch(_) {}
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function displayName(name) {
    try { if (window.DN) return window.DN(name) || name; } catch(_) {}
    return name || "";
  }
  function initialOf(name) {
    const s = String(name || "").trim();
    return s ? s.slice(0, 1).toUpperCase() : "?";
  }
  function avatarUrl(name) {
    if (_avatarCache.has(name)) return _avatarCache.get(name);
    let u = "";
    try {
      if (typeof window.getAvatarUrl === "function") u = window.getAvatarUrl(name) || "";
      else if (window.SRank && typeof window.SRank.getAvatarUrl === "function") {
        u = window.SRank.getAvatarUrl(name) || "";
      }
    } catch(_) {}
    _avatarCache.set(name, u);
    return u;
  }
  function formatPoints(n) {
    const v = Number(n) || 0;
    return v.toLocaleString("vi-VN") + "đ";
  }
  function getMonthKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  /* ───── Ensure page ───── */
  function ensurePage() {
    let page = $(PAGE_ID);
    if (page) return page;
    page = document.createElement("section");
    page.id = PAGE_ID;
    page.setAttribute("aria-label", "Shop thưởng");
    page.setAttribute("aria-hidden", "true");
    page.innerHTML = `
      <header class="shop-head">
        <button class="shop-head-btn" id="shopBack" type="button" aria-label="Đóng">←</button>
        <div class="shop-head-title">
          <span class="shop-kicker">HỆ THỐNG THẦN HÀO</span>
          <span class="shop-title">Shop thưởng</span>
        </div>
        <button class="shop-head-btn" id="shopSync" type="button" aria-label="Đồng bộ">↻</button>
      </header>
      <div class="shop-body" id="shopBody">
        <div class="shop-user-card" id="shopUserCard">
          <div class="shop-user-avatar" id="shopUserAvatar">?</div>
          <div class="shop-user-info">
            <div class="shop-user-name" id="shopUserName">Đang tải…</div>
            <div class="shop-user-points-row">
              <span class="shop-user-points" id="shopUserPoints">0đ</span>
              <span class="shop-user-points-label">khả dụng</span>
            </div>
          </div>
        </div>
        <div class="shop-filters" id="shopFilters"></div>
        <div class="shop-grid" id="shopGrid"></div>
      </div>
    `;
    document.body.appendChild(page);

    page.querySelector("#shopBack").addEventListener("click", closePage);
    page.querySelector("#shopSync").addEventListener("click", function(e) {
      const btn = e.currentTarget;
      btn.classList.add("spinning");
      sync().finally(function() {
        setTimeout(function() { btn.classList.remove("spinning"); }, 400);
      });
    });

    log("Page created ✓");
    return page;
  }

  /* ───── Data ───── */
  async function fetchItems() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_shop_list_items");
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      return Array.isArray(d.data) ? d.data : [];
    } catch(e) {
      log("fetchItems error:", e && e.message);
      return [];
    }
  }

  async function fetchCategories() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_shop_list_categories");
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return [];
      const arr = Array.isArray(d.data) ? d.data : [];
      return arr.map(c => String(c || "").trim()).filter(c => c);
    } catch(_) { return []; }
  }

  /* ⭐ v1.2: balance đọc từ server RPC — không tin client */
  async function fetchMyBalance() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) {
      log("fetchMyBalance: không có Supabase");
      return { points: 0, spent: 0, available: 0 };
    }
    try {
      const monthKey = getMonthKey();
      log("fetchMyBalance: gọi rpc với month_key =", monthKey);
      const res = await sb.rpc("rpc_shop_my_balance", { p_month_key: monthKey });
      if (res.error) {
        log("fetchMyBalance RPC error:", res.error);
        throw res.error;
      }
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được balance");
      const b = d.data || {};
      log("fetchMyBalance OK:", b);
      return {
        points: Number(b.points) || 0,
        spent: Number(b.spent) || 0,
        available: Number(b.available) || 0,
        display_name: b.display_name || "",
        month_key: b.month_key || monthKey
      };
    } catch(e) {
      log("fetchMyBalance error:", e && e.message);
      return { points: 0, spent: 0, available: 0 };
    }
  }

  async function refreshBalance() {
    const b = await fetchMyBalance();
    S.balance = b;
    log("balance:", S.balance);
    return S.balance;
  }

  /* ───── Render ───── */
  function renderUserCard() {
    const u = S.currentUser;
    const nameEl = $("shopUserName");
    const ptsEl = $("shopUserPoints");
    const avEl = $("shopUserAvatar");
    if (!nameEl || !ptsEl || !avEl) return;

    if (!u || !u.displayName) {
      nameEl.textContent = "Chưa đăng nhập";
      ptsEl.textContent = "0đ";
      avEl.style.backgroundImage = "";
      avEl.textContent = "?";
      return;
    }
    const dn = displayName(u.displayName);
    nameEl.textContent = dn;
    ptsEl.textContent = formatPoints(S.balance.available);

    const url = avatarUrl(u.displayName);
    if (url) {
      avEl.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
      avEl.textContent = "";
    } else {
      avEl.style.backgroundImage = "";
      avEl.textContent = initialOf(dn);
    }
  }

  function renderFilters() {
    const box = $("shopFilters");
    if (!box) return;
    const cats = S.categories.slice();
    const total = S.items.length;
    let html = '<button class="shop-filter'
      + (S.activeCategory === "" ? " active" : "")
      + '" data-cat="" type="button">Tất cả (' + total + ')</button>';
    cats.forEach(function(c) {
      const n = S.items.filter(function(i) { return String(i.category || "") === c; }).length;
      html += '<button class="shop-filter'
        + (S.activeCategory === c ? " active" : "")
        + '" data-cat="' + escapeHtml(c) + '" type="button">'
        + escapeHtml(c) + ' (' + n + ')</button>';
    });
    box.innerHTML = html;
    box.querySelectorAll(".shop-filter").forEach(function(btn) {
      btn.addEventListener("click", function() {
        S.activeCategory = btn.dataset.cat || "";
        renderFilters();
        renderItems();
      });
    });
  }

  function renderItems() {
    const grid = $("shopGrid");
    if (!grid) return;
    let list = S.items.slice();
    if (S.activeCategory) {
      list = list.filter(function(it) { return String(it.category || "") === S.activeCategory; });
    }
    if (!list.length) {
      grid.innerHTML =
        '<div class="shop-empty">'
        + '<div class="shop-empty-emoji">🏪</div>'
        + '<div class="shop-empty-title">Chưa có vật phẩm</div>'
        + '<div class="shop-empty-sub">Admin chưa thêm gì — quay lại sau nhé!</div>'
        + '</div>';
      return;
    }
    const balance = S.balance.available;
    grid.innerHTML = "";
    list.forEach(function(it) {
      const el = document.createElement("div");
      el.className = "shop-item" + (it.is_purchased ? " purchased" : "");
      const cost = Number(it.cost || 0);
      const canBuy = !it.is_purchased && balance >= cost;
      const imgHtml = it.image_url
        ? '<img src="' + escapeHtml(it.image_url)
          + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\');">'
          + '<span class="shop-item-img-fallback">🎁</span>'
        : '<span class="shop-item-img-fallback show">🎁</span>';
      const btnClass = it.is_purchased ? "purchased" : (canBuy ? "" : "disabled");
      const btnText = it.is_purchased ? "✓ Đã đổi" : (canBuy ? "Đổi" : "Thiếu điểm");
      el.innerHTML =
        '<div class="shop-item-img">' + imgHtml + '</div>'
        + '<div class="shop-item-body">'
        +   '<div class="shop-item-name">' + escapeHtml(it.name || "") + '</div>'
        +   (it.category ? '<div class="shop-item-cat">' + escapeHtml(it.category) + '</div>' : '')
        + '</div>'
        + '<div class="shop-item-footer">'
        +   '<div class="shop-item-cost">' + formatPoints(cost) + '</div>'
        +   '<button class="shop-item-btn ' + btnClass + '" data-id="' + escapeHtml(it.id) + '" type="button">' + btnText + '</button>'
        + '</div>';
      grid.appendChild(el);
    });
    grid.querySelectorAll(".shop-item-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        if (btn.classList.contains("purchased") || btn.classList.contains("disabled")) return;
        const id = btn.dataset.id;
        if (id) purchase(id, btn);
      });
    });
  }

  /* ───── Purchase ───── */
  async function purchase(itemId, btn) {
    const item = S.items.find(function(i) { return String(i.id) === String(itemId); });
    if (!item) return;
    if (!S.currentUser) { setStatus("Vui lòng đăng nhập"); return; }
    const cost = Number(item.cost) || 0;
    if (S.balance.available < cost) {
      setStatus("Không đủ điểm");
      try { Toast && Toast.show && Toast.show("Không đủ điểm để đổi vật phẩm này", { type: "warning", duration: 3000 }); } catch(_) {}
      return;
    }
    const ok = confirm(
      'Đổi "' + (item.name || "") + '" với ' + formatPoints(cost) + '?\n\n'
      + 'Số dư sau khi đổi: ' + formatPoints(S.balance.available - cost)
    );
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = "⏳";
    const sb = window.__sb;
    if (!sb || !sb.rpc) {
      setStatus("Chưa kết nối máy chủ");
      btn.disabled = false;
      btn.textContent = "Đổi";
      return;
    }
    try {
      const res = await sb.rpc("rpc_shop_purchase", {
        p_item_id: item.id,
        p_month_points: 0,   // server tự đọc, không tin client
        p_month_key: getMonthKey()
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không đổi được");

      setStatus("Đã đổi thành công ✓");
      try { Toast && Toast.show && Toast.show("Đổi thành công: " + (item.name || ""), { type: "success", duration: 3000 }); } catch(_) {}
      await sync();
    } catch(e) {
      const msg = String((e && e.message) || e || "Lỗi");
      setStatus("Lỗi: " + msg);
      try { Toast && Toast.show && Toast.show("Lỗi: " + msg, { type: "error", duration: 4000 }); } catch(_) {}
      btn.disabled = false;
      btn.textContent = "Đổi";
    }
  }

  /* ───── Sync ───── */
  async function sync() {
    if (S.loading) return;
    S.loading = true;
    try {
      S.currentUser = (window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser)
        ? window.SRank.Auth.getCurrentUser()
        : null;
      log("sync: user =", S.currentUser && S.currentUser.displayName);

      const [items, cats] = await Promise.all([fetchItems(), fetchCategories()]);
      S.items = items;
      S.categories = cats;
      await refreshBalance();
      renderUserCard();
      renderFilters();
      renderItems();
    } finally {
      S.loading = false;
    }
  }

  /* ───── Open / Close ───── */
  function openPage() {
    const page = ensurePage();
    if (!page) return;
    const u = window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser
      ? window.SRank.Auth.getCurrentUser()
      : null;
    if (!u) {
      setStatus("Vui lòng đăng nhập để vào shop");
      try { if (window.SRank && window.SRank.openLogin) window.SRank.openLogin(); } catch(_) {}
      return;
    }
    S.currentUser = u;
    S.pageOpen = true;
    page.classList.add("show");
    page.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    try { if (typeof window.syncQuickTools === "function") window.syncQuickTools(); } catch(_) {}

    renderUserCard();
    renderItems();
    sync();
  }

  function closePage() {
    const page = $(PAGE_ID);
    if (!page) return;
    page.classList.remove("show");
    page.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    S.pageOpen = false;
    try { if (typeof window.syncQuickTools === "function") window.syncQuickTools(); } catch(_) {}
  }

  /* ───── Auto refresh ───── */
  function startTimer() {
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(function() {
      if (document.hidden || !S.pageOpen) return;
      sync();
    }, REFRESH_MS);
  }

  /* ───── Boot ───── */
  function boot() {
    if (S.booted) return;
    S.booted = true;
    ensurePage();
    startTimer();

    window.__openShop = openPage;
    window.__closeShop = closePage;
    window.ShopView = {
      open: openPage,
      close: closePage,
      sync: sync,
      state: S,
      _fetchMyBalance: fetchMyBalance
    };

    window.addEventListener("displayNameUpdated", function() {
      _avatarCache.clear();
      if (S.pageOpen) sync();
    });
    window.addEventListener("avatarUpdated", function() {
      _avatarCache.clear();
      if (S.pageOpen) renderUserCard();
    });
    window.addEventListener("checkinDone", function() {
      if (S.pageOpen) sync();
    });

    log("v1.2 ready ✓ (balance server-side)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(boot, 200); }, { once: true });
  } else {
    setTimeout(boot, 200);
  }
})();