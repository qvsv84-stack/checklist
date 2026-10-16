/* =========================================================
   SHOP VIEW — v1.6
   ---------------------------------------------------------
   v1.6 FIX (tab Bộ sưu tập hiển thị cả shop):
   ✅ setTab() dùng style.display thay vì hidden attribute
      (CSS .shop-grid { display: grid } override [hidden])
   ✅ Bấm "Trang bị ngay" trong modal → tự nhảy sang Bộ sưu tập
   v1.5:
   - Modal đẹp + confetti + nút "Trang bị ngay"
   - Tab "Bộ sưu tập" + equip badge
   - Card user hiển thị badge đang dùng
   v1.4:
   - Điểm từ chấm công (server-side)
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
    collection: [],
    equipped: null,
    balance: { points: 0, spent: 0, available: 0, detail: {} },
    currentUser: null,
    activeCategory: "",
    activeTab: "shop",     // "shop" | "collection"
    loading: false,
    pageOpen: false,
    booted: false,
    timer: null
  };

  const _avatarCache = new Map();

  function log(...a) { console.log("[Shop]", ...a); }
  function setStatus(m) {
    try { if (window.SRank && window.SRank.setStatus) window.SRank.setStatus(m); } catch(_) {}
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
  function getMonthLabel() {
    const d = new Date();
    return "Tháng " + (d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function fmtDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.getDate().toString().padStart(2,"0") + "/"
        + (d.getMonth()+1).toString().padStart(2,"0") + "/"
        + d.getFullYear();
    } catch(_) { return ""; }
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
          <div class="shop-user-top">
            <div class="shop-user-avatar-wrap">
              <div class="shop-user-avatar" id="shopUserAvatar">?</div>
              <div class="shop-user-badge" id="shopUserBadge" hidden></div>
            </div>
            <div class="shop-user-info">
              <div class="shop-user-name" id="shopUserName">Đang tải…</div>
              <div class="shop-user-month" id="shopUserMonth"></div>
            </div>
          </div>
          <div class="shop-user-points-row">
            <div class="shop-points-cell">
              <div class="shop-points-num shop-points-num-earn" id="shopPointsEarn">0đ</div>
              <div class="shop-points-label">Kiếm được</div>
            </div>
            <div class="shop-points-cell">
              <div class="shop-points-num shop-points-num-spent" id="shopPointsSpent">0đ</div>
              <div class="shop-points-label">Đã tiêu</div>
            </div>
            <div class="shop-points-cell shop-points-cell-main">
              <div class="shop-points-num shop-points-num-avail" id="shopPointsAvail">0đ</div>
              <div class="shop-points-label">Khả dụng</div>
            </div>
          </div>
          <div class="shop-points-detail" id="shopPointsDetail"></div>
        </div>

        <div class="shop-tabs" id="shopTabs">
          <button class="shop-tab active" data-tab="shop" type="button">
            <span class="shop-tab-icon">🏪</span>
            <span class="shop-tab-label">Cửa hàng</span>
          </button>
          <button class="shop-tab" data-tab="collection" type="button">
            <span class="shop-tab-icon">🎖</span>
            <span class="shop-tab-label">Bộ sưu tập</span>
            <span class="shop-tab-count" id="shopCollectionCount"></span>
          </button>
        </div>

        <div class="shop-filters" id="shopFilters"></div>
        <div class="shop-grid" id="shopGrid"></div>

        <div class="shop-collection" id="shopCollection" style="display:none">
          <div class="shop-collection-grid" id="shopCollectionGrid"></div>
        </div>
      </div>

      <!-- Modal mua thành công -->
      <div class="shop-modal" id="shopModal" aria-hidden="true">
        <div class="shop-modal-backdrop"></div>
        <div class="shop-modal-panel" role="dialog" aria-modal="true">
          <div class="shop-modal-confetti" id="shopModalConfetti"></div>
          <div class="shop-modal-emoji">🎉</div>
          <div class="shop-modal-title">Đổi thành công!</div>
          <div class="shop-modal-item">
            <div class="shop-modal-item-img" id="shopModalItemImg">🎁</div>
            <div class="shop-modal-item-name" id="shopModalItemName"></div>
            <div class="shop-modal-item-cost" id="shopModalItemCost"></div>
          </div>
          <div class="shop-modal-actions">
            <button class="shop-modal-btn shop-modal-btn-primary" id="shopModalEquip" type="button">
              ⭐ Trang bị ngay
            </button>
            <button class="shop-modal-btn shop-modal-btn-ghost" id="shopModalClose" type="button">
              Đóng
            </button>
          </div>
        </div>
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

    /* Tab switching */
    page.querySelectorAll(".shop-tab").forEach(function(btn) {
      btn.addEventListener("click", function() {
        setTab(btn.dataset.tab || "shop");
      });
    });

    /* Modal close */
    page.querySelector("#shopModalClose").addEventListener("click", closeModal);
    page.querySelector(".shop-modal-backdrop").addEventListener("click", closeModal);

    log("Page created ✓");
    return page;
  }

  /* ───── Tab ─────
     ⭐ v1.6 FIX: dùng style.display thay vì hidden attribute
     vì CSS .shop-grid { display: grid } override [hidden] */
  function setTab(tab) {
    S.activeTab = tab;
    const page = $(PAGE_ID);
    if (!page) return;

    page.querySelectorAll(".shop-tab").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    const filters = page.querySelector("#shopFilters");
    const shopGrid = page.querySelector("#shopGrid");
    const collection = page.querySelector("#shopCollection");

    if (tab === "shop") {
      if (filters) filters.style.display = "";
      if (shopGrid) shopGrid.style.display = "";
      if (collection) collection.style.display = "none";
      renderItems();
    } else {
      if (filters) filters.style.display = "none";
      if (shopGrid) shopGrid.style.display = "none";
      if (collection) collection.style.display = "";
      renderCollection();
    }
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

  async function fetchMyBalance() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return { points: 0, spent: 0, available: 0, detail: {} };
    try {
      const res = await sb.rpc("rpc_shop_my_balance", { p_month_key: getMonthKey() });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Lỗi balance");
      const b = d.data || {};
      return {
        points: Number(b.points) || 0,
        spent: Number(b.spent) || 0,
        available: Number(b.available) || 0,
        display_name: b.display_name || "",
        month_key: b.month_key || getMonthKey(),
        detail: (b.detail && typeof b.detail === "object") ? b.detail : {}
      };
    } catch(e) {
      log("fetchMyBalance error:", e && e.message);
      return { points: 0, spent: 0, available: 0, detail: {} };
    }
  }

  async function fetchCollection() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_shop_my_collection");
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return [];
      return Array.isArray(d.data) ? d.data : [];
    } catch(e) {
      log("fetchCollection error:", e && e.message);
      return [];
    }
  }

  async function fetchEquipped() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return null;
    try {
      const res = await sb.rpc("rpc_shop_my_equipped");
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) return null;
      return d.data || null;
    } catch(_) { return null; }
  }

  /* ───── Render ───── */
  function renderUserCard() {
    const u = S.currentUser;
    const nameEl = $("shopUserName");
    const monthEl = $("shopUserMonth");
    const avEl = $("shopUserAvatar");
    const badgeEl = $("shopUserBadge");
    const earnEl = $("shopPointsEarn");
    const spentEl = $("shopPointsSpent");
    const availEl = $("shopPointsAvail");
    const detailEl = $("shopPointsDetail");

    if (!nameEl || !avEl) return;

    if (!u || !u.displayName) {
      nameEl.textContent = "Chưa đăng nhập";
      avEl.style.backgroundImage = "";
      avEl.textContent = "?";
      if (badgeEl) badgeEl.hidden = true;
      if (earnEl) earnEl.textContent = "0đ";
      if (spentEl) spentEl.textContent = "0đ";
      if (availEl) availEl.textContent = "0đ";
      if (detailEl) detailEl.innerHTML = "";
      return;
    }

    const dn = displayName(u.displayName);
    nameEl.textContent = dn;
    if (monthEl) monthEl.textContent = getMonthLabel();

    const url = avatarUrl(u.displayName);
    if (url) {
      avEl.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
      avEl.textContent = "";
    } else {
      avEl.style.backgroundImage = "";
      avEl.textContent = initialOf(dn);
    }

    /* Badge đang dùng */
    if (badgeEl) {
      if (S.equipped && S.equipped.image_url) {
        badgeEl.style.backgroundImage = 'url("' + S.equipped.image_url.replace(/"/g, '\\"') + '")';
        badgeEl.textContent = "";
        badgeEl.hidden = false;
      } else if (S.equipped && !S.equipped.image_url) {
        badgeEl.style.backgroundImage = "";
        badgeEl.textContent = "🎖";
        badgeEl.hidden = false;
      } else {
        badgeEl.hidden = true;
      }
    }

    if (earnEl) earnEl.textContent = formatPoints(S.balance.points);
    if (spentEl) spentEl.textContent = formatPoints(S.balance.spent);
    if (availEl) availEl.textContent = formatPoints(S.balance.available);

    if (detailEl) {
      const d = S.balance.detail || {};
      const order = [
        ["V", "Đi làm", "✓"],
        ["T", "OT", "⚡"],
        ["P", "Phép", "🌴"],
        ["O", "OFF", "—"],
        ["Q", "Quên", "❓"],
        ["X", "Không phép", "⚠️"]
      ];
      const parts = [];
      order.forEach(function(item) {
        const k = item[0], lbl = item[1], icon = item[2];
        const cnt = Number(d[k]) || 0;
        if (cnt > 0) {
          const cls = k === "X" ? "shop-detail-x" : "shop-detail-ok";
          parts.push('<span class="shop-detail-chip ' + cls + '">'
            + icon + ' ' + cnt + ' ' + lbl + '</span>');
        }
      });
      /* Custom statuses (Z, ...) */
      Object.keys(d).forEach(function(k) {
        if (["V","T","P","O","Q","X"].indexOf(k) >= 0) return;
        const cnt = Number(d[k]) || 0;
        if (cnt > 0) {
          parts.push('<span class="shop-detail-chip shop-detail-ok">✨ '
            + k + ' ' + cnt + '</span>');
        }
      });
      detailEl.innerHTML = parts.length ? parts.join("") : "";
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

  /* ───── Collection ───── */
  function renderCollection() {
    const grid = $("shopCollectionGrid");
    const countEl = $("shopCollectionCount");
    if (!grid) return;

    if (countEl) countEl.textContent = S.collection.length ? String(S.collection.length) : "";

    if (!S.collection.length) {
      grid.innerHTML =
        '<div class="shop-empty">'
        + '<div class="shop-empty-emoji">🎖</div>'
        + '<div class="shop-empty-title">Chưa có gì trong bộ sưu tập</div>'
        + '<div class="shop-empty-sub">Đổi vật phẩm đầu tiên đi!</div>'
        + '</div>';
      return;
    }
    grid.innerHTML = "";
    S.collection.forEach(function(it) {
      const el = document.createElement("div");
      el.className = "shop-collection-item" + (it.is_equipped ? " equipped" : "");
      const imgHtml = it.item_image_url
        ? '<img src="' + escapeHtml(it.item_image_url)
          + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\');">'
          + '<span class="shop-collection-img-fallback">🎁</span>'
        : '<span class="shop-collection-img-fallback show">🎁</span>';
      const eqBtnText = it.is_equipped ? "✓ Đang dùng" : "Trang bị";
      const eqBtnClass = it.is_equipped ? "equipped" : "";
      el.innerHTML =
        '<div class="shop-collection-img">' + imgHtml
        + (it.is_equipped ? '<div class="shop-collection-equipped-mark">⭐</div>' : '')
        + '</div>'
        + '<div class="shop-collection-body">'
        +   '<div class="shop-collection-name">' + escapeHtml(it.item_name || "") + '</div>'
        +   '<div class="shop-collection-date">Đổi ngày ' + fmtDate(it.purchased_at) + '</div>'
        + '</div>'
        + '<button class="shop-collection-btn ' + eqBtnClass + '" data-item-id="' + escapeHtml(it.item_id) + '" type="button">'
        +   eqBtnText
        + '</button>';
      grid.appendChild(el);
    });
    grid.querySelectorAll(".shop-collection-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const id = btn.dataset.itemId;
        const isEquipped = btn.classList.contains("equipped");
        if (isEquipped) {
          equipBadge(null, btn);
        } else {
          equipBadge(id, btn);
        }
      });
    });
  }

  /* ───── Equip ───── */
  async function equipBadge(itemId, btn) {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return;
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    try {
      const res = await sb.rpc("rpc_shop_equip_badge", { p_item_id: itemId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không trang bị được");
      setStatus(itemId ? "Đã trang bị ⭐" : "Đã bỏ trang bị");
      try { Toast && Toast.show && Toast.show(itemId ? "Đã trang bị!" : "Đã bỏ trang bị", { type: "success", duration: 2000 }); } catch(_) {}
      await sync();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e));
      if (btn) { btn.disabled = false; }
    }
  }

  /* ───── Purchase ───── */
  async function purchase(itemId, btn) {
    const item = S.items.find(function(i) { return String(i.id) === String(itemId); });
    if (!item) return;
    if (!S.currentUser) { setStatus("Vui lòng đăng nhập"); return; }
    const cost = Number(item.cost) || 0;
    if (S.balance.available < cost) {
      setStatus("Không đủ điểm");
      try { Toast && Toast.show && Toast.show("Không đủ điểm", { type: "warning", duration: 3000 }); } catch(_) {}
      return;
    }

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
        p_month_points: 0,
        p_month_key: getMonthKey()
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không đổi được");

      /* ⭐ Hiện modal thành công */
      showSuccessModal(item);
      try { Toast && Toast.show && Toast.show("Đổi thành công: " + (item.name || ""), { type: "success", duration: 2000 }); } catch(_) {}
      await sync();
    } catch(e) {
      const msg = String((e && e.message) || e || "Lỗi");
      setStatus("Lỗi: " + msg);
      try { Toast && Toast.show && Toast.show("Lỗi: " + msg, { type: "error", duration: 4000 }); } catch(_) {}
      btn.disabled = false;
      btn.textContent = "Đổi";
    }
  }

  /* ───── Success Modal ───── */
  let _modalItemId = null;
  function showSuccessModal(item) {
    const modal = $("shopModal");
    if (!modal) return;
    _modalItemId = item.id;

    const imgEl = $("shopModalItemImg");
    const nameEl = $("shopModalItemName");
    const costEl = $("shopModalItemCost");

    if (imgEl) {
      if (item.image_url) {
        imgEl.style.backgroundImage = 'url("' + item.image_url.replace(/"/g, '\\"') + '")';
        imgEl.textContent = "";
      } else {
        imgEl.style.backgroundImage = "";
        imgEl.textContent = "🎁";
      }
    }
    if (nameEl) nameEl.textContent = item.name || "";
    if (costEl) costEl.textContent = "−" + formatPoints(item.cost);

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    /* Confetti */
    const confetti = $("shopModalConfetti");
    if (confetti) {
      confetti.innerHTML = "";
      const emojis = ["🎉", "✨", "⭐", "🎁", "💫", "🌟"];
      for (let i = 0; i < 20; i++) {
        const s = document.createElement("span");
        s.className = "shop-confetti-piece";
        s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        s.style.left = (Math.random() * 100) + "%";
        s.style.animationDelay = (Math.random() * 0.6) + "s";
        s.style.animationDuration = (1.5 + Math.random() * 1) + "s";
        s.style.fontSize = (14 + Math.random() * 14) + "px";
        confetti.appendChild(s);
      }
    }

    /* Wire equip button */
    const eqBtn = $("shopModalEquip");
    if (eqBtn) {
      const newBtn = eqBtn.cloneNode(true);
      eqBtn.parentNode.replaceChild(newBtn, eqBtn);
      newBtn.addEventListener("click", async function() {
        newBtn.disabled = true;
        newBtn.textContent = "Đang trang bị…";
        await equipBadge(_modalItemId, null);
        closeModal();
        /* ⭐ v1.6: nhảy sang tab Bộ sưu tập để user thấy badge đang dùng */
        setTab("collection");
      });
    }
  }

  function closeModal() {
    const modal = $("shopModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    _modalItemId = null;
  }

  /* ───── Sync ───── */
  async function sync() {
    if (S.loading) return;
    S.loading = true;
    try {
      S.currentUser = (window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser)
        ? window.SRank.Auth.getCurrentUser()
        : null;

      const [items, cats, collection, equipped, balance] = await Promise.all([
        fetchItems(),
        fetchCategories(),
        fetchCollection(),
        fetchEquipped(),
        fetchMyBalance()
      ]);
      S.items = items;
      S.categories = cats;
      S.collection = collection;
      S.equipped = equipped;
      S.balance = balance;

      renderUserCard();
      renderFilters();
      if (S.activeTab === "shop") renderItems();
      else renderCollection();
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

    /* Reset về tab shop khi mở */
    S.activeTab = "shop";
    setTab("shop");
    renderUserCard();
    sync();
  }

  function closePage() {
    const page = $(PAGE_ID);
    if (!page) return;
    closeModal();
    page.classList.remove("show");
    page.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    S.pageOpen = false;
    try { if (typeof window.syncQuickTools === "function") window.syncQuickTools(); } catch(_) {}
  }

  function startTimer() {
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(function() {
      if (document.hidden || !S.pageOpen) return;
      sync();
    }, REFRESH_MS);
  }

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
      equip: equipBadge,
      setTab: setTab
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

    log("v1.6 ready ✓ (fix tab display + auto-jump to collection)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(boot, 200); }, { once: true });
  } else {
    setTimeout(boot, 200);
  }
})();