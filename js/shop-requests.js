/* =========================================================
   SHOP REQUESTS — Admin tab "Đổi thưởng"
   ---------------------------------------------------------
   - List yêu cầu đổi thưởng của user
   - Filter: Chờ duyệt / Đã duyệt / Từ chối / Tất cả
   - Xem chi tiết: avatar + tên user + item + form data
   - Duyệt / Từ chối (+ checkbox hoàn điểm)

   Đăng ký: SrankCore.callbacks.renderAdminRequests
   LOAD ORDER: sau main.js + admin.js + shop-admin.js
   ========================================================= */
(function(){
  "use strict";
  if (window.__shopRequestsLoaded) return;
  window.__shopRequestsLoaded = true;

  const S = window.SrankCore;
  if (!S) {
    console.error("[ShopRequests] thiếu SrankCore");
    return;
  }

  const $ = id => document.getElementById(id);
  const Toast = window.Toast;

  let _requests = [];
  let _activeFilter = "pending";
  let _wired = false;
  let _loading = false;

  function log(...a) { console.log("[ShopRequests]", ...a); }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function adminToken() {
    return (window.AdminSession && window.AdminSession.get) ? window.AdminSession.get() : null;
  }
  function fmtDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.getDate().toString().padStart(2,"0") + "/"
        + (d.getMonth()+1).toString().padStart(2,"0") + "/"
        + d.getFullYear() + " " + d.getHours().toString().padStart(2,"0") + ":"
        + d.getMinutes().toString().padStart(2,"0");
    } catch(_) { return ""; }
  }
  function avatarUrl(name) {
    try {
      if (typeof window.getAvatarUrl === "function") return window.getAvatarUrl(name) || "";
      if (window.SRank && typeof window.SRank.getAvatarUrl === "function") {
        return window.SRank.getAvatarUrl(name) || "";
      }
    } catch(_){}
    return "";
  }
  function initialOf(name) {
    const s = String(name || "").trim();
    return s ? s.slice(0, 1).toUpperCase() : "?";
  }
  function actionLabel(type) {
    if (type === "phone") return "📱 Nhập SĐT";
    if (type === "shipping") return "📦 Giao hàng";
    if (type === "none") return "✅ Xác nhận";
    return type || "";
  }
  function statusLabel(s) {
    if (s === "pending") return "⏳ Chờ duyệt";
    if (s === "approved") return "✅ Đã duyệt";
    if (s === "rejected") return "❌ Từ chối";
    return s;
  }

  /* ═══════════════════════════════════════════════════════
     LOAD
     ═══════════════════════════════════════════════════════ */
  async function loadRequests() {
    const token = adminToken();
    if (!token) return [];
    const sb = window.__sb;
    if (!sb || !sb.rpc) return [];

    const statusArg = _activeFilter === "all" ? null : _activeFilter;

    try {
      const res = await sb.rpc("rpc_admin_shop_list_requests", {
        p_token: token,
        p_status: statusArg
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không tải được");
      return Array.isArray(d.data) ? d.data : [];
    } catch(e) {
      log("loadRequests error:", e);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  function buildFormDataHtml(formData, actionType) {
    if (!formData || typeof formData !== "object") return "";
    const rows = [];
    if (formData.name) rows.push(["Tên", formData.name]);
    if (formData.phone) rows.push(["SĐT", formData.phone]);
    if (formData.address) rows.push(["Địa chỉ", formData.address]);
    if (formData.note) rows.push(["Ghi chú", formData.note]);
    if (!rows.length) return "";
    return '<div class="sr-form-data">'
      + rows.map(r => '<div class="sr-form-row">'
          + '<div class="sr-form-key">' + escapeHtml(r[0]) + '</div>'
          + '<div class="sr-form-val">' + escapeHtml(r[1]) + '</div>'
          + '</div>').join("")
      + '</div>';
  }

  function renderRequests() {
    const box = $("adminRequestsRows");
    const stats = $("adminRequestsStats");
    if (!box) return;

    if (_loading) {
      box.innerHTML = '<div class="admin-list-empty">Đang tải…</div>';
      return;
    }
    if (!_requests.length) {
      box.innerHTML = '<div class="admin-list-empty">Không có yêu cầu nào</div>';
      if (stats) stats.innerHTML = "";
      return;
    }

    const pending = _requests.filter(r => r.status === "pending").length;
    if (stats) {
      stats.innerHTML = '<span>📬 Tổng: ' + _requests.length + '</span>'
        + '<span>⏳ Chờ: ' + pending + '</span>';
    }

    box.innerHTML = "";
    _requests.forEach(function(r) {
      const el = document.createElement("div");
      el.className = "admin-request-item admin-request-" + r.status;

      const url = avatarUrl(r.user_display_name || "");
      const avHtml = url
        ? '<img src="' + escapeHtml(url) + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\');"><span class="admin-request-av-fb">' + escapeHtml(initialOf(r.user_display_name)) + '</span>'
        : '<span class="admin-request-av-fb show">' + escapeHtml(initialOf(r.user_display_name)) + '</span>';

      const imgHtml = r.item_image_url
        ? '<img src="' + escapeHtml(r.item_image_url) + '" alt="">'
        : '<span>🎁</span>';

      const formHtml = buildFormDataHtml(r.form_data, r.action_type);

      const actionsHtml = r.status === "pending"
        ? '<div class="admin-request-actions">'
            + '<label class="sr-refund-chk">'
            +   '<input type="checkbox" data-refund="1">'
            +   '<span>Hoàn điểm nếu từ chối</span>'
            + '</label>'
            + '<div class="sr-action-btns">'
            +   '<button class="sr-btn sr-btn-approve" data-action="approve" data-id="' + escapeHtml(r.id) + '" type="button">✅ Duyệt</button>'
            +   '<button class="sr-btn sr-btn-reject" data-action="reject" data-id="' + escapeHtml(r.id) + '" type="button">❌ Từ chối</button>'
            + '</div>'
          + '</div>'
        : '';

      const adminNoteHtml = r.admin_note
        ? '<div class="sr-admin-note"><b>Admin:</b> ' + escapeHtml(r.admin_note) + '</div>'
        : '';

      el.innerHTML =
        '<div class="admin-request-head">'
        +   '<div class="admin-request-av">' + avHtml + '</div>'
        +   '<div class="admin-request-info">'
        +     '<div class="admin-request-user">' + escapeHtml(r.user_display_name || r.user_email || "?") + '</div>'
        +     '<div class="admin-request-time">' + fmtDate(r.created_at) + '</div>'
        +   '</div>'
        +   '<div class="admin-request-status sr-status-' + r.status + '">' + statusLabel(r.status) + '</div>'
        + '</div>'
        + '<div class="admin-request-item-row">'
        +   '<div class="admin-request-thumb">' + imgHtml + '</div>'
        +   '<div class="admin-request-item-info">'
        +     '<div class="admin-request-item-name">' + escapeHtml(r.item_name || "") + '</div>'
        +     '<div class="admin-request-item-meta">'
        +       actionLabel(r.action_type)
        +       + (r.item_cost ? ' · ' + Number(r.item_cost).toLocaleString("vi-VN") + 'đ' : '')
        +     '</div>'
        +   '</div>'
        + '</div>'
        + formHtml
        + adminNoteHtml
        + actionsHtml;

      box.appendChild(el);
    });

    /* Wire action buttons */
    box.querySelectorAll('button[data-action]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const card = btn.closest(".admin-request-item");
        const refundChk = card ? card.querySelector('input[data-refund="1"]') : null;
        const refund = refundChk ? refundChk.checked : false;
        reviewRequest(id, action, refund);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     REVIEW
     ═══════════════════════════════════════════════════════ */
  async function reviewRequest(id, action, refund) {
    const token = adminToken();
    if (!token) return;
    const sb = window.__sb;
    if (!sb || !sb.rpc) return;

    const isApprove = action === "approve";

    let note = "";
    if (isApprove) {
      note = prompt("Ghi chú cho user (không bắt buộc):", "") || "";
    } else {
      const reason = prompt(
        "Lý do từ chối" + (refund ? " (sẽ hoàn điểm)" : " (không hoàn điểm)") + ":",
        ""
      );
      if (reason === null) return;
      note = reason;
    }

    try {
      const res = await sb.rpc("rpc_admin_shop_review_request", {
        p_token: token,
        p_request_id: id,
        p_action: action,
        p_admin_note: note,
        p_refund: !!refund
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || "Không xử lý được");

      try { Toast && Toast.show && Toast.show(isApprove ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu", { type: "success", duration: 2500 }); } catch(_) {}

      await refresh();
    } catch(e) {
      try { Toast && Toast.show && Toast.show("Lỗi: " + (e.message || e), { type: "error", duration: 3000 }); } catch(_) {}
    }
  }

  /* ═══════════════════════════════════════════════════════
     REFRESH
     ═══════════════════════════════════════════════════════ */
  async function refresh() {
    _loading = true;
    renderRequests();
    _requests = await loadRequests();
    _loading = false;
    renderRequests();
  }

  /* ═══════════════════════════════════════════════════════
     WIRE
     ═══════════════════════════════════════════════════════ */
  function wireEvents() {
    if (_wired) return;
    _wired = true;

    const filterBtns = document.querySelectorAll(".admin-requests-filter-btn");
    filterBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        _activeFilter = btn.dataset.filter || "pending";
        refresh();
      });
    });

    const refreshBtn = $("adminRequestsRefreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function() {
        refresh();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════
     RENDER ENTRY (callback)
     ═══════════════════════════════════════════════════════ */
  async function render() {
    if (!_wired) wireEvents();
    await refresh();
  }

  if (S.callbacks) S.callbacks.renderAdminRequests = render;

  window.ShopRequests = { render, refresh };

  log("v1.0 ready ✓");
})();