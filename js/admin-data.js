/* =========================================================
   ADMIN DATA — Tab TikTok Links
   ---------------------------------------------------------
   v1.1 FIX (mở link bị tab trắng trên iOS):
   ✅ Dùng location.href thay window.open
   ✅ Mở universal link trực tiếp từ tab hiện tại
   ✅ Đóng app TikTok → quay lại đúng tab Data, giữ nguyên state
   v1.0:
   - Self-contained: auto inject CSS, tab, view
   - Chỉ user tienloi thấy tab
   - CRUD link TikTok
   ========================================================= */
(function(){
  "use strict";
  if (window.__adminDataLoaded) return;
  window.__adminDataLoaded = true;

  const S = window.SrankCore;
  if (!S) { console.error("[AdminData] thiếu SrankCore"); return; }

  const $ = id => document.getElementById(id);
  const Toast = window.Toast;
  const OWNER_USERNAME = 'tienloi';

  const state = { items: [], loading: false, wired: false, injected: false };

  function log(...a) { console.log("[AdminData]", ...a); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function isOwner() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return false;
      return String(u.username || '').toLowerCase() === OWNER_USERNAME;
    } catch(_) { return false; }
  }
  function setStatus(msg, isError) {
    const el = $("adminDataStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("error", "warn");
    if (isError) el.classList.add("error");
  }

  /* ═══════════════════════════════════════════════════════
     OPEN TIKTOK — v1.1 fix tab trắng
     ═══════════════════════════════════════════════════════ */
  function openTikTok(url) {
    let u = String(url || '').trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;

    /* ⭐ v1.1 FIX: không dùng window.open
       - window.open tạo tab trắng, mất state khi quay lại
       - location.href mở universal link từ tab hiện tại
       - Đóng app TikTok → quay lại đúng tab Data */
    try {
      window.location.href = u;
    } catch (_) {}
  }

  /* ═══════════════════════════════════════════════════════
     CSS INJECT
     ═══════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById("__adminDataCSS")) return;
    const s = document.createElement("style");
    s.id = "__adminDataCSS";
    s.textContent = `
      .admin-data-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid rgba(220,190,140,.5);
        margin-bottom: 8px;
        transition: box-shadow .15s;
      }
      .admin-data-row:hover {
        box-shadow: 0 4px 16px -8px rgba(140,100,40,.3);
      }
      .admin-data-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .admin-data-title {
        font-size: 14px;
        font-weight: 900;
        color: #4a3520;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        line-height: 1.3;
      }
      .admin-data-cat {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 6px;
        background: rgba(245,166,35,.15);
        color: #8a5a10;
        font-size: 10.5px;
        font-weight: 900;
        letter-spacing: .02em;
        white-space: nowrap;
      }
      .admin-data-url {
        font-size: 11.5px;
        font-weight: 700;
        color: #a89070;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .admin-data-actions {
        display: inline-flex;
        gap: 6px;
        flex-shrink: 0;
        align-items: center;
      }
      @media (max-width: 480px) {
        .admin-data-row {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }
        .admin-data-actions {
          justify-content: flex-end;
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════
     INJECT TAB + VIEW
     ═══════════════════════════════════════════════════════ */
  function injectUI() {
    if (state.injected) return true;

    const nav = document.getElementById("adminPageNav");
    const content = document.getElementById("adminPageContent");
    if (!nav || !content) return false;

    /* Tab button */
    if (!nav.querySelector('.admin-tab[data-admin-tab="data"]')) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "admin-tab";
      btn.dataset.adminTab = "data";
      btn.style.display = "none";
      btn.innerHTML = '<span class="admin-tab-icon">🎵</span><span class="admin-tab-label">Data</span>';
      nav.appendChild(btn);

      btn.addEventListener("click", function() {
        try { window.AdminView?.switchTab?.("data"); } catch(_) {}
      });

      try {
        if (S.els && Array.isArray(S.els.adminTabs)) {
          S.els.adminTabs.push(btn);
        }
      } catch(_) {}
    }

    /* View */
    if (!content.querySelector('.admin-panel-view[data-admin-view="data"]')) {
      const view = document.createElement("div");
      view.className = "admin-panel-view";
      view.dataset.adminView = "data";
      view.innerHTML = `
        <h2 class="admin-section-title">🎵 Link TikTok</h2>
        <div class="admin-note" style="margin-bottom:12px">
          <span class="admin-note-icon">💡</span>
          <span>Lưu link TikTok cá nhân. Bấm "▶ Mở" để mở app TikTok (iOS/Android tự mở app nếu đã cài).</span>
        </div>
        <div class="admin-card">
          <div class="admin-card-row">
            <div class="admin-card-icon">📝</div>
            <div class="admin-card-info">
              <label for="adminDataTitle">Tên link</label>
              <p>VD: Video viral sáng nay (tối đa 200 ký tự)</p>
            </div>
            <input id="adminDataTitle" type="text" maxlength="200" placeholder="Tên gợi nhớ" autocomplete="off">
          </div>
          <div class="admin-card-row">
            <div class="admin-card-icon">🔗</div>
            <div class="admin-card-info">
              <label for="adminDataUrl">URL TikTok</label>
              <p>VD: https://www.tiktok.com/@user/video/123</p>
            </div>
            <input id="adminDataUrl" type="url" maxlength="1000" placeholder="https://www.tiktok.com/..." autocomplete="off">
          </div>
          <div class="admin-card-row">
            <div class="admin-card-icon">📂</div>
            <div class="admin-card-info">
              <label for="adminDataCategory">Phân loại (tùy chọn)</label>
              <p>VD: Video, Âm nhạc (tối đa 50 ký tự)</p>
            </div>
            <input id="adminDataCategory" type="text" maxlength="50" placeholder="Video" autocomplete="off">
          </div>
          <div class="admin-card-row">
            <div class="admin-card-icon">🔢</div>
            <div class="admin-card-info">
              <label for="adminDataSort">Thứ tự</label>
              <p>Số nhỏ hiện trước</p>
            </div>
            <input id="adminDataSort" type="text" inputmode="numeric" maxlength="4" placeholder="0" autocomplete="off">
          </div>
        </div>
        <div id="adminDataStatus" class="admin-status"></div>
        <div class="admin-actions">
          <button id="adminDataSaveBtn" type="button">➕ Thêm link</button>
          <button id="adminDataCancelBtn" type="button" style="background:#6b7280;border-color:#6b7280;margin-left:8px">Huỷ</button>
        </div>
        <h2 class="admin-section-title" style="margin-top:24px">Danh sách link</h2>
        <div id="adminDataRows" class="admin-list"></div>
      `;
      content.appendChild(view);

      try {
        if (S.els && Array.isArray(S.els.adminViews)) {
          S.els.adminViews.push(view);
        }
      } catch(_) {}
    }

    state.injected = true;
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     VISIBILITY
     ═══════════════════════════════════════════════════════ */
  function updateVisibility() {
    const tab = document.querySelector('.admin-tab[data-admin-tab="data"]');
    const view = document.querySelector('.admin-panel-view[data-admin-view="data"]');
    const owner = isOwner();
    if (tab) tab.style.display = owner ? '' : 'none';
    if (!owner && view) view.classList.remove('active');
  }

  function wireVisibility() {
    const adminPage = $("adminPage");
    if (!adminPage) return;

    const obs = new MutationObserver(function() {
      if (adminPage.classList.contains("show")) {
        injectUI();
        updateVisibility();
      }
    });
    obs.observe(adminPage, { attributes: true, attributeFilter: ["class"] });

    try {
      if (window.SRank?.Auth?.onChange) {
        window.SRank.Auth.onChange(function() {
          injectUI();
          updateVisibility();
        });
      }
    } catch(_) {}
  }

  /* ═══════════════════════════════════════════════════════
     RPC
     ═══════════════════════════════════════════════════════ */
  async function fetchList() {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc("rpc_tiktok_list");
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      return Array.isArray(d.data) ? d.data : [];
    } catch(e) {
      setStatus("Lỗi tải: " + (e.message || e), true);
      return [];
    }
  }
  async function createItem(payload) {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return { ok: false, error: "Chưa kết nối" };
    try {
      const res = await sb.rpc("rpc_tiktok_create", {
        p_title: payload.title,
        p_url: payload.url,
        p_category: payload.category || null,
        p_sort_order: payload.sortOrder || 0
      });
      if (res.error) throw res.error;
      return res.data || { ok: false };
    } catch(e) {
      return { ok: false, error: e.message || String(e) };
    }
  }
  async function updateItem(id, payload) {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return { ok: false, error: "Chưa kết nối" };
    try {
      const res = await sb.rpc("rpc_tiktok_update", {
        p_id: id,
        p_title: payload.title,
        p_url: payload.url,
        p_category: payload.category || null,
        p_sort_order: payload.sortOrder || 0
      });
      if (res.error) throw res.error;
      return res.data || { ok: false };
    } catch(e) {
      return { ok: false, error: e.message || String(e) };
    }
  }
  async function deleteItem(id) {
    const sb = window.__sb;
    if (!sb || !sb.rpc) return { ok: false, error: "Chưa kết nối" };
    try {
      const res = await sb.rpc("rpc_tiktok_delete", { p_id: id });
      if (res.error) throw res.error;
      return res.data || { ok: false };
    } catch(e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  function renderList() {
    const box = $("adminDataRows");
    if (!box) return;

    if (state.loading) {
      box.innerHTML = '<div class="admin-list-empty">Đang tải…</div>';
      return;
    }
    if (!state.items.length) {
      box.innerHTML = '<div class="admin-list-empty">Chưa có link nào</div>';
      return;
    }

    box.innerHTML = "";
    state.items.forEach(function(it) {
      const row = document.createElement("div");
      row.className = "admin-data-row";
      const catHtml = it.category
        ? '<span class="admin-data-cat">' + esc(it.category) + '</span>'
        : '';
      row.innerHTML =
        '<div class="admin-data-info">'
        +   '<div class="admin-data-title">' + esc(it.title) + catHtml + '</div>'
        +   '<div class="admin-data-url">' + esc(it.url) + '</div>'
        + '</div>'
        + '<div class="admin-data-actions">'
        +   '<button class="admin-row-btn admin-data-open" data-id="' + esc(it.id) + '" type="button" style="background:#dc2626;color:#fff;border-color:#dc2626;">▶ Mở</button>'
        +   '<button class="admin-row-btn admin-data-edit" data-id="' + esc(it.id) + '" type="button" style="background:#3b82f6;color:#fff;border-color:#3b82f6;">Sửa</button>'
        +   '<button class="admin-row-btn admin-data-del" data-id="' + esc(it.id) + '" type="button" style="background:#6b7280;color:#fff;border-color:#6b7280;">Xoá</button>'
        + '</div>';
      box.appendChild(row);
    });

    box.querySelectorAll('.admin-data-open').forEach(function(btn) {
      btn.addEventListener("click", function() {
        const it = state.items.find(x => String(x.id) === String(btn.dataset.id));
        if (it) openTikTok(it.url);
      });
    });
    box.querySelectorAll('.admin-data-edit').forEach(function(btn) {
      btn.addEventListener("click", function() {
        const it = state.items.find(x => String(x.id) === String(btn.dataset.id));
        if (it) editItem(it);
      });
    });
    box.querySelectorAll('.admin-data-del').forEach(function(btn) {
      btn.addEventListener("click", function() {
        const it = state.items.find(x => String(x.id) === String(btn.dataset.id));
        if (it) deleteWithConfirm(it);
      });
    });
  }

  function resetForm() {
    ["adminDataTitle", "adminDataUrl", "adminDataCategory", "adminDataSort"].forEach(function(id){
      const el = $(id);
      if (el) el.value = "";
    });
    const btn = $("adminDataSaveBtn");
    if (btn) {
      btn.textContent = "➕ Thêm link";
      delete btn.dataset.editingId;
    }
  }

  async function handleSave() {
    const title = String($("adminDataTitle")?.value || "").trim();
    const url = String($("adminDataUrl")?.value || "").trim();
    const category = String($("adminDataCategory")?.value || "").trim();
    const sortOrder = parseInt(String($("adminDataSort")?.value || "0").replace(/\D/g, ""), 10) || 0;
    const editingId = $("adminDataSaveBtn")?.dataset?.editingId || "";

    if (!title) return setStatus("Thiếu tên link", true);
    if (title.length > 200) return setStatus("Tên tối đa 200 ký tự", true);
    if (!url) return setStatus("Thiếu URL", true);
    if (url.length > 1000) return setStatus("URL tối đa 1000 ký tự", true);
    if (category.length > 50) return setStatus("Phân loại tối đa 50 ký tự", true);

    const btn = $("adminDataSaveBtn");
    if (btn) btn.disabled = true;
    setStatus(editingId ? "Đang cập nhật…" : "Đang lưu…");

    try {
      const payload = { title, url, category, sortOrder };
      const res = editingId ? await updateItem(editingId, payload) : await createItem(payload);
      if (!res.ok) throw new Error(res.error || "Không lưu được");
      setStatus(editingId ? "Đã cập nhật ✓" : "Đã thêm ✓");
      try { Toast?.show?.(editingId ? "Đã cập nhật" : "Đã thêm link", { type: "success", duration: 2000 }); } catch(_) {}
      resetForm();
      await render();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function editItem(it) {
    $("adminDataTitle").value = it.title || "";
    $("adminDataUrl").value = it.url || "";
    $("adminDataCategory").value = it.category || "";
    $("adminDataSort").value = String(it.sort_order || 0);
    const btn = $("adminDataSaveBtn");
    if (btn) {
      btn.textContent = "💾 Lưu thay đổi";
      btn.dataset.editingId = String(it.id);
    }
    setStatus("Đang sửa: " + (it.title || ""));
    $("adminDataTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => $("adminDataTitle")?.focus(), 400);
  }

  async function deleteWithConfirm(it) {
    if (!confirm('Xoá link "' + (it.title || '') + '"?\n\nKhông thể hoàn tác.')) return;
    setStatus("Đang xoá…");
    try {
      const res = await deleteItem(it.id);
      if (!res.ok) throw new Error(res.error || "Không xoá được");
      setStatus("Đã xoá ✓");
      try { Toast?.show?.("Đã xoá link", { type: "success", duration: 2000 }); } catch(_) {}
      await render();
    } catch(e) {
      setStatus("Lỗi: " + (e.message || e), true);
    }
  }

  async function render() {
    if (!isOwner()) return;
    if (!injectUI()) return;
    wireEvents();
    state.loading = true;
    renderList();
    state.items = await fetchList();
    state.loading = false;
    renderList();
  }

  function wireEvents() {
    if (state.wired) return;
    const btn = $("adminDataSaveBtn");
    const cancelBtn = $("adminDataCancelBtn");
    if (btn) btn.addEventListener("click", handleSave);
    if (cancelBtn) cancelBtn.addEventListener("click", function() {
      resetForm();
      setStatus("");
    });
    state.wired = true;
  }

  /* ═══════════════════════════════════════════════════════
     BOOT — wrap switchTab + inject
     ═══════════════════════════════════════════════════════ */
  function boot() {
    injectCSS();
    injectUI();

    /* Wrap switchTab của AdminView để gọi render khi mở tab Data */
    if (window.AdminView && typeof window.AdminView.switchTab === "function") {
      const orig = window.AdminView.switchTab;
      if (!orig.__wrapped) {
        const wrapped = function(name) {
          orig.call(window.AdminView, name);
          if (name === "data") {
            try { render(); } catch(e) { console.warn("[AdminData] render error:", e); }
          }
        };
        wrapped.__wrapped = true;
        window.AdminView.switchTab = wrapped;
      }
    }

    if (S.callbacks) S.callbacks.renderAdminData = render;

    wireVisibility();
    updateVisibility();

    log("v1.1 ready ✓ (fix tab trắng)");
  }

  /* Đợi adminPage tồn tại rồi boot */
  let tries = 0;
  (function wait() {
    const adminPage = document.getElementById("adminPage");
    const adminNav = document.getElementById("adminPageNav");
    const adminView = document.getElementById("adminPageContent");
    if (adminPage && adminNav && adminView) {
      boot();
      return;
    }
    if (++tries > 60) {
      console.warn("[AdminData] không tìm thấy #adminPage");
      return;
    }
    setTimeout(wait, 100);
  })();

  window.AdminData = { render, isOwner, openTikTok };
})();
```