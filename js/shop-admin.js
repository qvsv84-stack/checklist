/* =========================================================
   SHOP ADMIN — v1.3
   ---------------------------------------------------------
   v1.3 FIX (không nhập được dấu âm):
   ✅ Đổi inputmode="numeric" → "text" (bàn phím iOS đầy đủ,
      có nút dấu trừ)
   ✅ Thêm nút −/+ mỗi bên ô input (step ±5) — chỉnh nhanh
   ✅ Layout grid: icon | label | − | input | + | unit
   ✅ Sanitize giữ dấu âm đúng cách
   v1.2:
   - Section "⚙ Cấu hình điểm" trong tab Shop
   v1.1:
   - Wire events sớm, check setup
   v1.0:
   - Tab Shop — upload ảnh, CRUD item
   ========================================================= */
(function(){
  "use strict";
  if (window.__shopAdminLoaded) return;
  window.__shopAdminLoaded = true;

  const S = window.SrankCore;
  if (!S) {
    console.error("[ShopAdmin] thiếu SrankCore — cần main.js load trước");
    return;
  }

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
    return (window.AdminSession && window.AdminSession.get)
      ? window.AdminSession.get()
      : null;
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

  /* ───── Banner setup ───── */
  function showSetupBanner(msg) {
    let banner = $("adminShopSetupBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "adminShopSetupBanner";
      banner.style.cssText = [
        "margin: 0 0 14px", "padding: 12px 14px",
        "border-radius: 12px", "background: #fef2f2",
        "border: 1.5px solid #fca5a5", "color: #991b1b",
        "font-size: 13px", "font-weight: 800",
        "line-height: 1.5", "white-space: pre-wrap"
      ].join(";");
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
          showSetupBanner(
            "❌ Chưa chạy SQL migration.\n\n" +
            "Vào Supabase → SQL Editor → paste sql/shop_migration.sql → Run."
          );
          return false;
        }
      }
    } catch (e) {
      _setupOk = false;
      showSetupBanner("❌ Không gọi được RPC. Kiểm tra SQL migration.");
      return false;
    }

    try {
      const cfgRes = await sb.rpc("rpc_admin_shop_get_config", { p_token: token });
      if (cfgRes.error) {
        const em = String(cfgRes.error.message || cfgRes.error).toLowerCase();
        if (em.includes("does not exist") || em.includes("not found") || em.includes("schema cache")) {
          _setupOk = false;
          showSetupBanner("⚠️ Chưa có rpc_admin_shop_get_config. Chạy sql/shop_points_v2.sql.");
          return false;
        }
      }
    } catch (e) { log("checkSetup config warn:", e); }

    try {
      const listRes = await sb.storage.from(BUCKET).list("", { limit: 1 });
      if (listRes.error) {
        const em = String(listRes.error.message || listRes.error).toLowerCase();
        if (em.includes("not found") || em.includes("bucket")) {
          _setupOk = false;
          showSetupBanner("⚠️ Storage bucket '" + BUCKET + "' chưa có. Chạy lại SQL.");
          return false;
        }
      }
    } catch (e) { log("checkSetup bucket warn:", e); }

    _setupOk = true;
    hideSetupBanner();
    return true;
  }

  /* ───── Image ───── */
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

  /* ───── Item list ───── */
  function renderItems() {
    const box = $("adminShopRows");
    if (!box) return;
    if (!_items.length) {
      box.innerHTML = '<div class="admin-list-empty">Chưa có vật phẩm nào</div>';
      return;
    }
    box.innerHTML = "";
    _items.forEach(function(it) {
      const row = document.createElement("div");
      row.className = "admin-row-item" + (it.active ? " checked" : "");
      const imgHtml = it.image_url
        ? '<img src="' + escapeHtml(it.image_url) + '" alt="" loading="lazy">'
        : '<span>🎁</span>';
      row.innerHTML =
        '<span class="admin-shop-thumb">' + imgHtml + '</span>'
        + '<span class="admin-shop-info">'
        +   '<span class="admin-row-name">' + escapeHtml(it.name || "") + '</span>'
        +   '<span class="admin-row-time">' + escapeHtml(it.category || "—")
        +     ' · ' + Number(it.cost || 0).toLocaleString("vi-VN") + 'đ</span>'
        + '</span>'
        + '<span class="admin-shop-actions">'
        +   '<button class="admin-row-btn' + (it.active ? " checked" : "")
        +     '" data-act="toggle" data-id="' + escapeHtml(it.id) + '" type="button">'
        +     (it.active ? "Đang bán" : "Đã ẩn") + '</button>'
        +   '<button class="admin-row-btn" data-act="edit" data-id="' + escapeHtml(it.id)
        +     '" type="button" style="background:#3b82f6;color:#fff;border-color:#3b82f6;">Sửa</button>'
        +   '<button class="admin-row-btn" data-act="delete" data-id="' + escapeHtml(it.id)
        +     '" type="button" style="background:#dc2626;color:#fff;border-color:#dc2626;">Xoá</button>'
        + '</span>';
      box.appendChild(row);
    });
    box.querySelectorAll("button[data-act]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === "toggle") toggleItem(id, btn);
        else if (act === "edit") editItem(id);
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

  /* ═══════════════════════════════════════════════════════
     CONFIG ĐIỂM — v1.3 (fix dấu âm)
     ═══════════════════════════════════════════════════════ */
  async function loadConfig() {
    const token = adminToken();
    if (!token) return [];
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_admin_shop_get_config", { p_token: token });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      _config = Array.isArray(d.data) ? d.data : [];
      return _config;
    } catch(e) {
      log("loadConfig error:", e);
      return [];
    }
  }

  function renderConfigForm() {
    const box = $("adminShopConfigRows");
    if (!box) return;
    if (!_config.length) {
      box.innerHTML = '<div class="admin-list-empty">Chưa có config — chạy SQL shop_points_v2.sql</div>';
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
      /* ⭐ v1.3: inputmode="text" để bàn phím iOS có dấu trừ
         + 2 nút −/+ để chỉnh nhanh không cần gõ dấu */
      return ''
        + '<div class="admin-shop-config-row">'
        +   '<span class="admin-shop-config-icon">' + icon + '</span>'
        +   '<span class="admin-shop-config-label">'
        +     '<b>' + escapeHtml(k) + '</b> · ' + escapeHtml(lbl)
        +   '</span>'
        +   '<button class="admin-shop-config-step" data-status="' + escapeHtml(k)
        +     '" data-step="-5" type="button" aria-label="Giảm 5">−</button>'
        +   '<input class="admin-shop-config-input" type="text" inputmode="text"'
        +     ' data-status="' + escapeHtml(k) + '"'
        +     ' value="' + pts + '"'
        +     ' maxlength="5" placeholder="0"'
        +     ' autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">'
        +   '<button class="admin-shop-config-step" data-status="' + escapeHtml(k)
        +     '" data-step="5" type="button" aria-label="Tăng 5">+</button>'
        +   '<span class="admin-shop-config-unit ' + cls + '">/ngày</span>'
        + '</div>';
    }).join("");

    /* Wire nút −/+ */
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

    /* Wire input thay đổi */
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
        /* ⭐ Sanitize: chỉ giữ số và dấu − ở đầu */
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
            p_token: token,
            p_status_key: key,
            p_points: pts
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
      setConfigStatus("Đã khôi phục về mặc định ✓");
      try { Toast && Toast.show && Toast.show("Đã khôi phục cấu hình điểm", { type: "success", duration: 2500 }); } catch(_) {}
      await loadConfig();
      renderConfigForm();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ───── CRUD item ───── */
  async function createItem() {
    const token = adminToken();
    if (!token) return setStatus("Không có quyền admin", true);
    const nameEl = $("adminShopName");
    const costEl = $("adminShopCost");
    const catEl = $("adminShopCategory");
    const name = String(nameEl && nameEl.value || "").trim();
    const cost = parseInt(String(costEl && costEl.value || "0").replace(/\D/g, ""), 10);
    const cat = String(catEl && catEl.value || "").trim();

    if (!name) return setStatus("Thiếu tên vật phẩm", true);
    if (name.length > 100) return setStatus("Tên tối đa 100 ký tự", true);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000) {
      return setStatus("Giá điểm không hợp lệ (0-1.000.000)", true);
    }
    if (cat.length > 50) return setStatus("Phân loại tối đa 50 ký tự", true);

    const btn = $("adminShopCreateBtn");
    if (btn) btn.disabled = true;
    setStatus("Đang lưu…");

    try {
      const sb = window.__sb;
      const res = await sb.rpc("rpc_admin_shop_create_item", {
        p_token: token,
        p_name: name,
        p_image_url: _uploadedUrl || null,
        p_cost: cost,
        p_category: cat || null
      });
      if (res.error) throw new Error(res.error.message || String(res.error));
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tạo được");

      setStatus("Đã thêm: " + name + " ✓");
      try { Toast && Toast.show && Toast.show("Đã thêm vật phẩm: " + name, { type: "success", duration: 3000 }); } catch(_) {}

      if (nameEl) nameEl.value = "";
      if (costEl) costEl.value = "";
      if (catEl) catEl.value = "";
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
    const newName = prompt("Tên vật phẩm:", it.name || "");
    if (newName === null) return;
    const newCost = prompt("Giá điểm:", String(it.cost || 0));
    if (newCost === null) return;
    const newCat = prompt("Phân loại (để trống = không có):", it.category || "");
    if (newCat === null) return;

    const cost = parseInt(String(newCost).replace(/\D/g, ""), 10);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1000000) {
      return setStatus("Giá điểm không hợp lệ", true);
    }
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
        p_category: newCat.trim() || null,
        p_active: it.active
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
        p_active: next
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không cập nhật được");
      await loadItems();
      renderItems();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
      btn.disabled = false;
    }
  }

  async function deleteItem(id, btn) {
    const it = _items.find(function(x) { return String(x.id) === String(id); });
    if (!it) return;
    if (!confirm('Xoá VĨNH VIỄN vật phẩm "' + it.name + '"?\n\nKhông thể hoàn tác.')) return;
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    btn.disabled = true;
    try {
      const res = await sb.rpc("rpc_admin_shop_delete_item", { p_token: token, p_id: id });
      if (res.error) throw res.error;
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

  /* ───── Wire ───── */
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
      try { imgInput.click(); } catch(err) { log("imgInput.click error:", err); }
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

    log("wireEvents ✓");
  }

  async function render() {
    if (!_wired) wireEvents();

    const ok = await checkSetup();
    if (!ok) {
      const box = $("adminShopRows");
      if (box) box.innerHTML = '<div class="admin-list-empty">Chưa setup — xem cảnh báo phía trên</div>';
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

  log("v1.3 ready ✓ (fix dấu âm + nút step)");
})();