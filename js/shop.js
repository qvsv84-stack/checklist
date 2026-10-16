/* =========================================================
   SHOP VIEW — v1.1
   ---------------------------------------------------------
   v1.1 FIX (điểm = 0 dù có điểm):
   ✅ Resolve tên GỐC checklist (raw name) từ auth user
      → ưu tiên tìm raw name trong checklist_names khớp displayName qua DN()
   ✅ Match scoreLeaderboard.row.name với raw name (không phải displayName)
   ✅ Fallback nhiều lớp: username → displayName → SrankCore.points
   ✅ Debug log để dễ kiểm tra khi cần
   v1.0:
   - List item (lọc category)
   - Mua item (TYPE B: 1 lần/item)
   - Balance = điểm tháng - đã tiêu tháng

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
    rawName: "",
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

  /* ⭐ v1.1 FIX: resolve tên GỐC checklist từ auth user
     Trả về tên gốc dùng để match với scoreLeaderboard.row.name */
  function resolveRawChecklistName(u) {
    if (!u) return "";
    const dn = String(u.displayName || "").trim();
    const un = String(u.username || "").trim();

    try {
      const state = window.__getChecklistState?.();
      if (state && Array.isArray(state.names) && state.names.length) {
        const names = state.names.map(n => String(n || "").trim());

        // 1. displayName có trong checklist không? (user đặt tên trùng)
        if (dn && names.includes(dn)) {
          log("resolve: match displayName in checklist →", dn);
          return dn;
        }

        // 2. Duyệt từng raw name, so DN(raw) === displayName
        if (dn) {
          for (const raw of names) {
            const d = window.DN ? window.DN(raw) : raw;
            if (d && String(d).trim() === dn) {
              log("resolve: match DN(raw) === displayName →", raw);
              return raw;
            }
          }
        }

        // 3. username có trong checklist không?
        if (un && names.includes(un)) {
          log("resolve: match username in checklist →", un);
          return un;
        }
      }
    } catch(e) { log("resolve error:", e); }

    // 4. Fallback: displayName trước, rồi username
    const fallback = dn || un;
    log("resolve fallback →", fallback);
    return fallback;
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

  /* ⭐ v1.1 FIX: fetch điểm tháng — match bằng tên GỐC + fallback */
  async function fetchMyScore() {
    const u = S.currentUser;
    if (!u) { log("fetchMyScore: no currentUser"); return 0; }

    const rawName = S.rawName || resolveRawChecklistName(u);
    S.rawName = rawName;

    const candidates = new Set();
    if (rawName) candidates.add(String(rawName).trim());
    if (u.displayName) candidates.add(String(u.displayName).trim());
    if (u.username) candidates.add(String(u.username).trim());

    log("fetchMyScore candidates:", Array.from(candidates));

    try {
      const m = new Date().getMonth() + 1;
      const r = await window.__srankApi("scoreLeaderboard", { month: m, _ts: Date.now() }, 15000);
      if (!r || !r.ok || !r.data) {
        log("fetchMyScore: API fail", r);
        return 0;
      }
      const rows = Array.isArray(r.data.rows)
        ? r.data.rows
        : (Array.isArray(r.data) ? r.data : []);

      log("fetchMyScore rows sample:", rows.slice(0, 5).map(x => ({ name: x.name, points: x.points })));

      // Ưu tiên 1: match chính xác rawName
      for (const row of rows) {
        const nm = String(row.name || "").trim();
        if (nm === String(rawName).trim()) {
          const pts = Number(row.points) || 0;
          log("fetchMyScore: matched EXACT", nm, "→", pts);
          return pts;
        }
      }

      // Fallback: match bất kỳ candidate nào
      for (const row of rows) {
        const nm = String(row.name || "").trim();
        if (candidates.has(nm)) {
          const pts = Number(row.points) || 0;
          log("fetchMyScore: matched candidate", nm, "→", pts);
          return pts;
        }
      }

      log("fetchMyScore: NO MATCH");
    } catch(e) {
      log("fetchMyScore error:", e && e.message);
    }

    /* Fallback cuối: dùng SrankCore.points nếu có (điểm hôm nay) */
    try {
      const core = window.SrankCore;
      if (core && Array.isArray(core.names) && Array.isArray(core.points)) {
        for (const c of candidates) {
          const idx = core.names.indexOf(c);
          if (idx >= 0) {
            const pts = Number(core.points[idx]) || 0;
            log("fetchMyScore: fallback SrankCore.points", c, "→", pts);
            return pts;
          }
        }
      }
    } catch(e) {}

    return 0;
  }

  async function fetchMySpent() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return 0;
    try {
      const res = await sb.rpc("rpc_shop_my_spent", { p_month_key: getMonthKey() });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return 0;
      return Number(d.data && d.data.spent) || 0;
    } catch(_) { return 0; }
  }

  async function refreshBalance() {
    const [points, spent] = await Promise.all([fetchMyScore(), fetchMySpent()]);
    S.balance = {
      points: points,
      spent: spent,
      available: Math.max(0, points - spent)
    };
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
        p_month_points: S.balance.points,
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
      S.rawName = resolveRawChecklistName(S.currentUser);
      log("sync: user =", S.currentUser && S.currentUser.displayName, "| rawName =", S.rawName);

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
    S.rawName = resolveRawChecklistName(u);
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
      _resolveRawChecklistName: resolveRawChecklistName
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

    log("v1.1 ready ✓ (fix balance match)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(boot, 200); }, { once: true });
  } else {
    setTimeout(boot, 200);
  }
})();