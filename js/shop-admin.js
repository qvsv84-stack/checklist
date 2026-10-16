/* =========================================================
   SHOP ADMIN — v1.0
   ---------------------------------------------------------
   Tab "Shop" trong admin panel. Chịu trách nhiệm:
     - Form tạo item: ảnh (upload như avatar) + tên + giá + phân loại
     - Combobox phân loại (datalist → gõ tự do + suggest)
     - Danh sách item: toggle active / sửa / xoá

   Đăng ký callback: SrankCore.callbacks.renderAdminShop
   LOAD ORDER: SAU main.js + admin.js
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

  let _items = [];
  let _categories = [];
  let _uploading = false;
  let _uploadedUrl = "";
  let _wired = false;

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

  /* ───── Image upload ───── */
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
    const upRes = await sb.storage.from("shop-items").upload(path, blob, {
      upsert: false,
      contentType: "image/jpeg",
      cacheControl: "3600"
    });
    if (upRes.error) throw upRes.error;
    const urlRes = sb.storage.from("shop-items").getPublicUrl(path);
    const publicUrl = urlRes && urlRes.data && urlRes.data.publicUrl;
    if (!publicUrl) throw new Error("Không lấy được URL ảnh");
    return publicUrl + "?t=" + Date.now();
  }

  /* ───── Preview ───── */
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

  /* ───── Category datalist ───── */
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

  /* ───── Load ───── */
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

  /* ───── Create ───── */
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
      if (res.error) throw res.error;
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
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ───── Edit ───── */
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
    if (!token) return setStatus("Không có quyền admin", true);
    const sb = window.__sb;
    try {
      const res = await sb.rpc("rpc_admin_shop_update_item", {
        p_token: token,
        p_id: id,
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

  /* ───── Toggle ───── */
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
        p_token: token,
        p_id: id,
        p_name: it.name,
        p_image_url: it.image_url,
        p_cost: it.cost,
        p_category: it.category,
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

  /* ───── Delete ───── */
  async function deleteItem(id, btn) {
    const it = _items.find(function(x) { return String(x.id) === String(id); });
    if (!it) return;
    if (!confirm('Xoá VĨNH VIỄN vật phẩm "' + it.name + '"?\n\nHành động này không thể hoàn tác.')) return;
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
    } catch-card(e) {
      setStatus("Lỗi: " + (e.message || e), true);
      btn.disabled = false;
    }
  }

  /* ───── Wire (1 lần) ───── */
  function wireEvents() {
    if (_wired) return;
    _wired = true;
    const imgBtn = $("adminShopImageBtn");
    const imgInput = $("adminShopImageInput");
    const createBtn = $("adminShopCreateBtn");
    if (imgBtn && imgInput) {
      imgBtn.addEventListener("click", function() {
        if (!_uploading) imgInput.click();
      });
      imgInput.addEventListener("change", async function(e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        _uploading = true;
        imgBtn.disabled = true;
        imgBtn.textContent = "⏳";
        setStatus("Đang upload ảnh…");
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
          imgBtn.textContent = "Chọn ảnh";
          try { imgInput.value = ""; } catch(_) {}
        }
      });
    }
    if (createBtn) createBtn.addEventListener("click", createItem);
  }

  /* ───── Render entry ───── */
  async function render() {
    if (!_wired) wireEvents();
    const box = $("adminShopRows");
    if (box) box.innerHTML = '<div class="admin-list-empty">Đang tải…</div>';
    await loadItems();
    renderCategoryList();
    renderItems();
    updatePreview();
  }

  /* ───── Register ───── */
  if (S.callbacks) S.callbacks.renderAdminShop = render;

  window.ShopAdmin = { render };
  log("v1.0 ready ✓");
})();