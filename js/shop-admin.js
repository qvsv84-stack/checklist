/* =========================================================
   SHOP ADMIN — v1.5
   ========================================================= */
(function(){
  "use strict";
  if (window.__shopAdminLoaded) return;
  window.__shopAdminLoaded = true;

  const S = window.SrankCore;
  if (!S) { console.error("[ShopAdmin] thiếu SrankCore"); return; }

  const $ = id => document.getElementById(id);
  const Toast = window.Toast;
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  const TARGET_SIZE = 400;
  const BUCKET = "shop-items";

  let _items = [];
  let _categories = [];
  let _config = [];
  let _uploading = false;
  let _uploadedUrl = "";
  let _wired = false;
  let _setupChecked = false;
  let _setupOk = null;

  function log(...a) { console.log("[ShopAdmin]", ...a); }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function adminToken() {
    return (window.AdminSession && window.AdminSession.get) ? window.AdminSession.get() : null;
  }
  function setStatus(m, isError) {
    const el = $("adminShopStatus");
    if (!el) return;
    el.textContent = m || "";
    el.classList.remove("error", "warn");
    if (isError) el.classList.add("error");
  }
  function setConfigStatus(m, isError) {
    const el = $("adminShopConfigStatus");
    if (!el) return;
    el.textContent = m || "";
    el.classList.remove("error", "warn");
    if (isError) el.classList.add("error");
  }
  function effectLabel(type) {
    if (!type) return "";
    if (type === "fire_particles") return "🔥 Lửa + hạt bay";
    return "✨ " + type;
  }
  function actionLabel(type) {
    if (!type) return "";
    if (type === "phone") return "📱 Nhập SĐT";
    if (type === "shipping") return "📦 Giao hàng";
    if (type === "none") return "✅ Xác nhận";
    return "❓ " + type;
  }

  function showSetupBanner(msg) {
    let banner = $("adminShopSetupBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "adminShopSetupBanner";
      banner.style.cssText = "margin:0 0 14px;padding:12px 14px;border-radius:12px;background:#fef2f2;border:1.5px solid #fca5a5;color:#991b1b;font-size:13px;font-weight:800;line-height:1.5;white-space:pre-wrap";
      const view = document.querySelector('[data-admin-view="shop"]');
      if (view) view.insertBefore(banner, view.firstChild);
    }
    banner.textContent = msg;
    banner.style.display = "";
  }
  function hideSetupBanner() {
    const banner = $("adminShopSetupBanner");
    if (banner) banner.style.display = "none";
  }

  async function checkSetup() {
    if (_setupChecked) return _setupOk;
    _setupChecked = true;
    const sb = window.__sb;
    if (!sb) { _setupOk = false; showSetupBanner("❌ Chưa kết nối Supabase"); return false; }
    const token = adminToken();
    if (!token) { _setupOk = false; showSetupBanner("❌ Không có quyền admin"); return false; }
    try {
      const res = await sb.rpc("rpc_admin_shop_list_items", { p_token: token });
      if (res.error) {
        const em = String(res.error.message || res.error).toLowerCase();
        if (em.includes("does not exist") || em.includes("not found") || em.includes("schema cache")) {
          _setupOk = false;
          showSetupBanner("❌ Chưa chạy SQL migration.\n\nChạy file sql/shop_requests.sql trên Supabase.");
          return false;
        }
      }
    } catch (e) {
      _setupOk = false;
      showSetupBanner("❌ Không gọi được RPC.");
      return false;
    }
    try {
      const cfgRes = await sb.rpc("rpc_admin_shop_get_config", { p_token: token });
      if (cfgRes.error) {
        const em = String(cfgRes.error.message || cfgRes.error).toLowerCase();
        if (em.includes("does not exist") || em.includes("not found") || em.includes("schema cache")) {
          _setupOk = false;
          showSetupBanner("⚠️ Chưa có rpc_admin_shop_get_config.");
          return false;
        }
      }
    } catch (e) {}
    try {
      const listRes = await sb.storage.from(BUCKET).list("", { limit: 1 });
      if (listRes.error) {
        const em = String(listRes.error.message || listRes.error).toLowerCase();
        if (em.includes("not found") || em.includes("bucket")) {
          _setupOk = false;
          showSetupBanner("⚠️ Storage bucket '" + BUCKET + "' chưa có.");
          return false;
        }
      }
    } catch (e) {}
    _setupOk = true;
    hideSetupBanner();
    return true;
  }

  function resizeImage(file, size) {
    return new Promise(function(resolve, reject) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function() {
        try {
          URL.revokeObjectURL(url);
          const s = Math.min(img.width, img.height);
          const sx = (img.width - s) / 2;
          const sy = (img.height - s) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
          canvas.toBlob(function(blob) {
            if (blob) resolve(blob);
            else reject(new Error("Không nén được ảnh"));
          }, "image/jpeg", 0.85);
        } catch(e) { reject(e); }
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        reject(new Error("Không đọc được ảnh"));
      };
      img.src = url;
    });
  }

  async function uploadItemImage(file) {
    if (!file) return null;
    if (file.size > MAX_SIZE) throw new Error("Ảnh quá 5MB");
    if (ALLOWED.indexOf(file.type) < 0) throw new Error("Chỉ nhận JPG/PNG/WebP");
    const sb = window.__sb;
    if (!sb || !sb.storage) throw new Error("Chưa kết nối Storage");
    const blob = await resizeImage(file, TARGET_SIZE);
    const uid = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now() + "-" + Math.random().toString(36).slice(2, 10));
    const path = uid + ".jpg";
    const upRes = await sb.storage.from(BUCKET).upload(path, blob, {
      upsert: false, contentType: "image/jpeg", cacheControl: "3600"
    });
    if (upRes.error) throw new Error(upRes.error.message || String(upRes.error));
    const urlRes = sb.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlRes && urlRes.data && urlRes.data.publicUrl;
    if (!publicUrl) throw new Error("Không lấy được URL ảnh");
    return publicUrl + "?t=" + Date.now();
  }

  function updatePreview() {
    const prev = $("adminShopImagePreview");
    if (!prev) return;
    if (_uploadedUrl) {
      prev.style.backgroundImage = 'url("' + _uploadedUrl.replace(/"/g, '\\"') + '")';
      prev.textContent = "";
    } else {
      prev.style.backgroundImage = "";
      prev.textContent = "🖼";
    }
  }

  function renderCategoryList() {
    const dl = $("adminShopCategoryList");
    if (!dl) return;
    dl.innerHTML = _categories.map(function(c) {
      return '<option value="' + escapeHtml(c) + '"></option>';
    }).join("");
  }
  function renderItems() {
    const box = $("adminShopRows");
    if (!box) return;
    if (!_items.length) {
      box.innerHTML = '<div class="admin-list-empty">Chưa có vật phẩm nào</div>';
      return;
    }
    box.innerHTML = "";
    _items.forEach(function(it) {
      const isSys = !!it.is_system;
      const row = document.createElement("div");
      row.className = "admin-row-item" + (it.active ? " checked" : "");
      let imgHtml;
      if (it.image_url) {
        imgHtml = '<img src="' + escapeHtml(it.image_url) + '" alt="" loading="lazy">';
      } else if (it.effect_type === "fire_particles") {
        imgHtml = '<span>🔥</span>';
      } else {
        imgHtml = '<span>🎁</span>';
      }
      const metaParts = [];
      if (it.category) metaParts.push(escapeHtml(it.category));
      if (it.effect_type) metaParts.push(effectLabel(it.effect_type));
      if (it.action_type) metaParts.push(actionLabel(it.action_type));
      metaParts.push(Number(it.cost || 0).toLocaleString("vi-VN") + 'đ');
      const metaText = metaParts.join(' · ');
      const sysBadge = isSys ? '<span class="admin-shop-system-badge">⚙ Hệ thống</span>' : '';
      const delBtn = isSys
        ? '<button class="admin-row-btn disabled-system" data-act="delete-blocked" type="button">🔒 Xoá</button>'
        : '<button class="admin-row-btn" data-act="delete" data-id="' + escapeHtml(it.id) + '" type="button" style="background:#dc2626;color:#fff;border-color:#dc2626;">Xoá</button>';
      row.innerHTML =
        '<span class="admin-shop-thumb">' + imgHtml + '</span>'
        + '<span class="admin-shop-info">'
        +   '<span class="admin-row-name">' + escapeHtml(it.name || "") + sysBadge + '</span>'
        +   '<span class="admin-row-time">' + metaText + '</span>'
        + '</span>'
        + '<span class="admin-shop-actions">'
        +   '<button class="admin-row-btn' + (it.active ? " checked" : "")
        +     '" data-act="toggle" data-id="' + escapeHtml(it.id) + '" type="button">'
        +     (it.active ? "Đang bán" : "Đã ẩn") + '</button>'
        +   '<button class="admin-row-btn" data-act="edit" data-id="' + escapeHtml(it.id)
        +     '" type="button" style="background:#3b82f6;color:#fff;border-color:#3b82f6;">Sửa</button>'
        +   delBtn
        + '</span>';
      box.appendChild(row);
    });
    box.querySelectorAll("button[data-act]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const act = btn.dataset.act;
        if (act === "delete-blocked") {
          setStatus("Vật phẩm hệ thống không thể xoá.", true);
          try { Toast && Toast.r.show && Toast.show("Vpcật phẩm hệ thống(" không thể xoá", { type: "warning", duration: 3000 }); } catch(_) {}
          return;
        }
        const id = btn.dataset.id;
        if (act === "toggle") toggleItem(id, btn);
        else if (act ===r "edit") editItem(id);
        else if (act === "delete") deleteItem(id, btn);
      });
    });
  }

  async function loadItems() {
    const token = adminToken();
    if (!token) return [];
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_admin_shop_list_items", { p_token: token });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      _items = Array.isArray(d.data) ? d.data : [];
      const catSet = new Set();
      _items.forEach(function(it) {
        const c = String(it.category || "").trim();
        if (c) catSet.add(c);
      });
      _categories = Array.from(catSet);
      return _items;
    } catch(e) {
      setStatus("Lỗi tải: " + (e.message || e), true);
      return [];
    }
  }

  async function loadConfig() {
    const token = adminToken();
    if (!token) return [];
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sbpc_admin_shop_get_config", { p_token: token });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      _config = Array.isArray(d.data) ? d.data : [];
      return _config;
    } catch(e) { return []; }
  }

  function renderConfigForm() {
    const box = $("adminShopConfigRows");
    if (!box) return;
    if (!_config.length) {
      box.innerHTML = '<div class="admin-list-empty">Chưa có config</div>';
      return;
    }
    const order = ["V", "T", "P", "O", "Q", "X", "U"];
    const sorted = _config.slice().sort(function(a, b) {
      const ia = order.indexOf(a.status_key);
      const ib = order.indexOf(b.status_key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    box.innerHTML = sorted.map(function(c) {
      const k = c.status_key;
      const lbl = c.label || k;
      const iconMap = { V: "✓", T: "⚡", P: "🌴", O: "—", Q: "❓", X: "⚠️", U: "🥥" };
      const icon = iconMap[k] || "•";
      const pts = Number(c.points || 0);
      const cls = pts < 0 ? "neg" : (pts > 0 ? "pos" : "zero");
      return ''
        + '<div class="admin-shop-config-row">'
        +   '<span class="admin-shop-config-icon">' + icon + '</span>'
        +   '<span class="admin-shop-config-label"><b>' + escapeHtml(k) + '</b> · ' + escapeHtml(lbl) + '</span>'
        +   '<button class="admin-shop-config-step" data-status="' + escapeHtml(k) + '" data-step="-5" type="button">−</button>'
        +   '<input class="admin-shop-config-input" type="text" inputmode="text"'
        +     ' data-status="' + escapeHtml(k) + '" value="' + pts + '"'
        +     ' maxlength="5" placeholder="0" autocomplete="off">'
        +   '<button class="admin-shop-config-step" data-status="' + escapeHtml(k) + '" data-step="5" type="button">+</button>'
        +   '<span class="admin-shop-config-unit ' + cls + '">/ngày</span>'
        + '</div>';
    }).join("");
    box.querySelectorAll(".admin-shop-config-step").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const key = btn.dataset.status;
        const step = parseInt(btn.dataset.step, 10) || 0;
        const input = box.querySelector('.admin-shop-config-input[data-status="' + key + '"]');
        if (!input) return;
        let cur = parseInt(String(input.value || "0").replace(/[^\d\-]/g, ""), 10);
        if (!Number.isFinite(cur)) cur = 0;
        let next = cur + step;
        if (next < -1000) next = -1000;
        if (next > 1000) next = 1000;
        input.value = String(next);
        updateUnitColor(input);
      });
    });
    box.querySelectorAll(".admin-shop-config-input").forEach(function(input) {
      input.addEventListener("input", function() { updateUnitColor(input); });
    });
  }

  function updateUnitColor(input) {
    const row = input.closest(".admin-shop-config-row");
    if (!row) return;
    const unit = row.querySelector(".admin-shop-config-unit");
    if (!unit) return;
    const v = parseInt(String(input.value || "0").replace(/[^\d\-]/g, ""), 10);
    unit.classList.remove("pos", "neg", "zero");
    if (!Number.isFinite(v) || v === 0) unit.classList.add("zero");
    else if (v < 0) unit.classList.add("neg");
    else unit.classList.add("pos");
  }

  async function saveConfig() {
    const token = adminToken();
    if (!token) return setConfigStatus("Không có quyền admin", true);
    const box = $("adminShopConfigRows");
    if (!box) return;
    const inputs = box.querySelectorAll(".admin-shop-config-input");
    if (!inputs.length) return;
    const btn = $("adminShopConfigSaveBtn");
    if (btn) btn.disabled = true;
    setConfigStatus("Đang lưu…");
    const sb = window.__sb;
    let ok = 0, fail = 0;
    let firstErr = "";
    try {
      for (const input of inputs) {
        const key = String(input.dataset.status || "").trim();
        const raw = String(input.value || "0").trim();
        const cleaned = raw.replace(/[^\d\-]/g, "").replace(/(?!^)-/g, "");
        const pts = parseInt(cleaned || "0", 10);
        if (!key) continue;
        if (!Number.isFinite(pts)) { fail++; continue; }
        if (pts < -1000 || pts > 1000) {
          fail++;
          if (!firstErr) firstErr = "Điểm " + key + " phải từ -1000 đến 1000";
          continue;
        }
        try {
          const res = await sb.rpc("rpc_admin_shop_set_config", {
            p_token: token, p_status_key: key, p_points: pts
          });
          if (res.error) throw res.error;
          const d = res.data || {};
          if (d.ok !== true) throw new Error(d.error || "Không lưu được");
          ok++;
        } catch(e) {
          fail++;
          if (!firstErr) firstErr = String(e.message || e);
        }
      }
      if (fail === 0) {
        setConfigStatus("Đã lưu " + ok + " cấu hình ✓");
        try { Toast && Toast.show && Toast.show("Đã lưu cấu hình điểm", { type: "success", duration: 2500 }); } catch(_) {}
        await loadConfig();
        renderConfigForm();
      } else {
        setConfigStatus("Lưu " + ok + " OK, " + fail + " lỗi. " + firstErr, true);
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function resetConfig() {
    if (!confirm("Khôi phục cấu hình điểm về mặc định?\n\nV=10, T=15, P=10, O=0, Q=0, X=-10")) return;
    const defaults = { V: 10, T: 15, P: 10, O: 0, Q: 0, X: -10 };
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    const btn = $("adminShopConfigResetBtn");
    if (btn) btn.disabled = true;
    setConfigStatus("Đang khôi phục…");
    try {
      for (const key of Object.keys(defaults)) {
        try {
          await sb.rpc("rpc_admin_shop_set_config", {
            p_token: token, p_status_key: key, p_points: defaults[key]
          });
        } catch(_) {}
      }
      setConfigStatus("Đã khôi phục ✓");
      try { Toast && Toast.show && Toast.show("Đã khôi phục cấu hình", { type: "success", duration: 2500 }); } catch(_) {}
      await loadConfig();
      renderConfigForm();
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  async function createItem() {
    const token = adminToken();
    if (!token) return setStatus("Không có quyền admin", true);
    const nameEl = $("adminShopName");
    const costEl = $("adminShopCost");
    const catEl = $("adminShopCategory");
    const actionEl = $("adminShopActionType");
    const buttonEl = $("adminShopButtonLabel");
    const name = String(nameEl && nameEl.value || "").trim();
    const cost = parseInt(String(costEl && costEl.value || "0").replace(/\D/g, ""), 10);
    const cat = String(catEl && catEl.value || "").trim();
    const actionType = String(actionEl && actionEl.value || "").trim();
    const buttonLabel = String(buttonEl && buttonEl.value || "").trim();
    if (!name) return setStatus("Thiếu tên vật phẩm", true);
    if (name.length > 100) return setStatus("Tên tối đa 100 ký tự", true);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000) return setStatus("Giá điểm không hợp lệ", true);
    if (cat.length > 50) return setStatus("Phân loại tối đa 50 ký tự", true);
    if (actionType && !["phone", "shipping", "none"].includes(actionType)) return setStatus("Loại hành động không hợp lệ", true);
    if (buttonLabel.length > 30) return setStatus("Tên nút tối đa 30 ký tự", true);
    if (actionType && !buttonLabel) return setStatus("Có loại hành động thì phải đặt tên nút", true);
    const btn = $("adminShopCreateBtn");
    if (btn) btn.disabled = true;
    setStatus("Đang lưu…");
    try {
      const sb = window.__sb;
      const res = await sb.rpc("rpc_admin_shop_create_item", {
        p_token: token, p_name: name, p_image_url: _uploadedUrl || null,
        p_cost: cost, p_category: cat || null,
        p_action_type: actionType || null, p_button_label: buttonLabel || null
      });
      if (res.error) throw new Error(res.error.message || String(res.error));
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tạo được");
      setStatus("Đã thêm: " + name + " ✓");
      try { Toast && Toast.show && Toast.show("Đã thêm: " + name, { type: "success", duration: 3000 }); } catch(_) {}
      if (nameEl) nameEl.value = "";
      if (costEl) costEl.value = "";
      if (catEl) catEl.value = "";
      if (actionEl) actionEl.value = "";
      if (buttonEl) buttonEl.value = "";
      _uploadedUrl = "";
      updatePreview();
      await loadItems();
      renderCategoryList();
      renderItems();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
      try { Toast && Toast.show && Toast.show("Lỗi: " + (e.message || e), { type: "error", duration: 4000 }); } catch(_) {}
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function editItem(id) {
    const it = _items.find(function(x) { return String(x.id) === String(id); });
    if (!it) return;
    const isSys = !!it.is_system;
    const newName = prompt((isSys ? "Tên hiệu ứng:" : "Tên vật phẩm:"), it.name || "");
    if (newName === null) return;
    const newCost = prompt("Giá điểm:", String(it.cost || 0));
    if (newCost === null) return;
    let newCat = it.category || "";
    let newActionType = it.action_type || "";
    let newButtonLabel = it.button_label || "";
    if (!isSys) {
      const inputCat = prompt("Phân loại:", it.category || "");
      if (inputCat === null) return;
      newCat = inputCat;
      const inputAction = prompt(
        'Loại hành động (phone/shipping/none/clear):',
        it.action_type || ""
      );
      if (inputAction === null) return;
      const trimmed = String(inputAction).trim().toLowerCase();
      if (trimmed === "clear" || trimmed === "") {
        newActionType = ""; newButtonLabel = "";
      } else if (["phone", "shipping", "none"].includes(trimmed)) {
        newActionType = trimmed;
        const inputLabel = prompt("Tên nút:", it.button_label || "Sử dụng");
        if (inputLabel === null) return;
        newButtonLabel = String(inputLabel).trim();
        if (!newButtonLabel) return setStatus("Phải đặt tên nút", true);
      } else {
        return setStatus("Loại hành động không hợp lệ", true);
      }
    }
    const cost = parseInt(String(newCost).replace(/\D/g, ""), 10);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000) return setStatus("Giá không hợp lệ", true);
    if (!newName.trim()) return setStatus("Tên không được rỗng", true);
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    try {
      const res = await sb.rpc("rpc_admin_shop_update_item", {
        p_token: token, p_id: id,
        p_name: newName.trim(),
        p_image_url: it.image_url || null,
        p_cost: cost,
        p_category: isSys ? (it.category || null) : (String(newCat).trim() || null),
        p_active: it.active,
        p_action_type: isSys ? (it.action_type || null) : (newActionType || null),
        p_button_label: isSys ? (it.button_label || null) : (newButtonLabel || null)
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không lưu được");
      setStatus("Đã cập nhật ✓");
      await loadItems();
      renderCategoryList();
      renderItems();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
    }
  }

  async function toggleItem(id, btn) {
    const it = _items.find(function(x) { return String(x.id) === String(id); });
    if (!it) return;
    const next = !it.active;
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    btn.disabled = true;
    try {
      const res = await sb.rpc("rpc_admin_shop_update_item", {
        p_token: token, p_id: id,
        p_name: it.name, p_image_url: it.image_url,
        p_cost: it.cost, p_category: it.category,
        p_active: next,
        p_action_type: it.action_type || null,
        p_button_label: it.button_label || null
      });
      if (res.error) throw res.error;
      const d =_id res.data: id || {};
      if (d.ok !== true) throw new Error(d.error || "Không cập });
 nh     ật được");
      await load ifItems();
      renderItems();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
      btn.disabled = false;
    }
  }

  async function deleteItem(id, btn) {
    const it = _items.find(function(x) { return String(x.id) === String(id); });
    if (!it) return;
    if (it.is_system) {
      setStatus("Vật phẩm hệ thống không thể xoá", true);
      return;
    }
    if (!confirm('Xoá VĨNH VIỄN "' + it.name + '"?')) return;
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    btn.disabled = true;
    try {
      const res = await sb.rpc("rpc_admin_shop_delete_item", { p_token: token, p (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không xoá được");
      setStatus("Đã xoá ✓");
      await loadItems();
      renderItems();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
      btn.disabled = false;
    }
  }

  function wireEvents() {
    if (_wired) return;
    const imgBtn = $("adminShopImageBtn");
    const imgInput = $("adminShopImageInput");
    const createBtn = $("adminShopCreateBtn");
    const cfgSaveBtn = $("adminShopConfigSaveBtn");
    const cfgResetBtn = $("adminShopConfigResetBtn");
    if (!imgBtn || !imgInput) return;
    _wired = true;
    imgBtn.addEventListener("click", function(e) {
      e.preventDefault(); e.stopPropagation();
      if (_uploading) return;
      try { imgInput.click(); } catch(err) {}
    });
    imgInput.addEventListener("change", async function(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      _uploading = true;
      imgBtn.disabled = true;
      const oldLabel = imgBtn.textContent;
      imgBtn.textContent = "⏳ Đang upload…";
      setStatus("Đang xử lý ảnh…");
      try {
        const url = await uploadItemImage(f);
        _uploadedUrl = url || "";
        updatePreview();
        setStatus("Đã upload ảnh ✓");
      } catch(err) {
        setStatus("Lỗi upload: " + (err.message || err), true);
      } finally {
        _uploading = false;
        imgBtn.disabled = false;
        imgBtn.textContent = oldLabel;
        try { imgInput.value = ""; } catch(_) {}
      }
    });
    if (createBtn) createBtn.addEventListener("click", createItem);
    if (cfgSaveBtn) cfgSaveBtn.addEventListener("click", saveConfig);
    if (cfgResetBtn) cfgResetBtn.addEventListener("click", resetConfig);
    const actionEl = $("adminShopActionType");
    const buttonEl = $("adminShopButtonLabel");
    if (actionEl && buttonEl) {
      actionEl.addEventListener("change", function() {
        const v = actionEl.value;
        if (!buttonEl.value) {
          if (v === "phone") buttonEl.value = "Sử dụng";
          else if (v === "shipping") buttonEl.value = "Đặt hàng";
          else if (v === "none") buttonEl.value = "Xác nhận";
        }
      });
    }
  }

  async function render() {
    if (!_wired) wireEvents();
    const ok = await checkSetup();
    if (!ok) {
      const box = $("adminShopRows");
      if (box) box.innerHTML = '<div class="admin-list-empty">Chưa setup</div>';
      return;
    }
    const box = $("adminShopRows");
    if (box) box.innerHTML = '<div class="admin-list-empty">Đang tải…</div>';
    await Promise.all([loadItems(), loadConfig()]);
    renderCategoryList();
    renderItems();
    renderConfigForm();
    updatePreview();
  }

  if (S.callbacks) S.callbacks.renderAdminShop = render;

  window.ShopAdmin = {
    render,
    resetSetup: function() { _setupChecked = false; _setupOk = null; hideSetupBanner(); }
  };

  function tryWire() { wireEvents(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryWire, { once: true });
  } else {
    tryWire();
  }
  setTimeout(tryWire, 500);
  setTimeout(tryWire, 1500);

  log("v1.5 ready ✓");
})();