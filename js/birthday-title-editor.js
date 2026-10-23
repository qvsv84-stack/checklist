/* =========================================================
   BIRTHDAY TITLE EDITOR — v1.0
   ---------------------------------------------------------
   - Admin long-press tiêu đề → dialog sửa
   - Lưu Supabase (site_settings) → áp dụng cho toàn bộ user
   - Cache localStorage → hiển thị tức thì
   ========================================================= */
(function () {
  "use strict";
  if (window.__bdTitle) return;

  const CACHE_KEY    = "srank_birthday_title_v1";
  const HINT_KEY     = "srank_bd_title_hint_shown";
  const SETTING_KEY  = "birthday_title";
  const RPC_GET      = "rpc_get_site_setting";
  const RPC_SET      = "rpc_set_site_setting";
  const DEFAULT      = { line1: "Happy Birthday", line2: "Minh Quân" };
  const LONG_PRESS_MS = 650;

  const _state = { line1: DEFAULT.line1, line2: DEFAULT.line2 };
  const _listeners = [];

  function _esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function _notify() {
    for (const cb of _listeners) { try { cb(_state); } catch (_) {} }
    window.dispatchEvent(new Event("bdTitleChanged"));
  }

  function getHTML() {
    let h = '<span class="rainbow-line">' + _esc(_state.line1) + "</span>";
    if (_state.line2) h += '<span class="rainbow-line">' + _esc(_state.line2) + "</span>";
    return h;
  }

  function getLines() { return { line1: _state.line1, line2: _state.line2 }; }

  /* ---------- Cache ---------- */
  function _loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const o = JSON.parse(raw);
      if (o && typeof o.line1 === "string") {
        _state.line1 = o.line1;
        _state.line2 = typeof o.line2 === "string" ? o.line2 : "";
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        line1: _state.line1, line2: _state.line2
      }));
    } catch (_) {}
  }

  /* ---------- Server ---------- */
  async function _loadFromServer() {
    const sb = window.__sb;
    if (!sb) return false;
    try {
      // RPC
      if (sb.rpc) {
        const res = await sb.rpc(RPC_GET, { p_key: SETTING_KEY });
        if (!res.error && res.data) {
          const raw = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
          const o = JSON.parse(raw);
          if (o && typeof o.line1 === "string") {
            _state.line1 = o.line1;
            _state.line2 = typeof o.line2 === "string" ? o.line2 : "";
            _saveCache();
            return true;
          }
        }
      }
      // Fallback: bảng trực tiếp
      if (sb.from) {
        const r = await sb.from("site_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
        if (!r.error && r.data && r.data.value) {
          const o = JSON.parse(r.data.value);
          if (o && typeof o.line1 === "string") {
            _state.line1 = o.line1;
            _state.line2 = typeof o.line2 === "string" ? o.line2 : "";
            _saveCache();
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("[bdTitle] load failed:", e && e.message);
    }
    return false;
  }

  async function _saveToServer() {
    const sb = window.__sb;
    if (!sb) throw new Error("Không có kết nối server");
    const value = JSON.stringify({ line1: _state.line1, line2: _state.line2 });

    if (sb.rpc) {
      const res = await sb.rpc(RPC_SET, { p_key: SETTING_KEY, p_value: value });
      if (!res.error) return true;
      // thử tiếp bảng trực tiếp nếu RPC fail
    }
    if (sb.from) {
      const { error } = await sb.from("site_settings").upsert(
        { key: SETTING_KEY, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) throw error;
      return true;
    }
    throw new Error("Không có phương thức lưu");
  }

  /* ---------- Admin detection ---------- */
  function _isAdmin() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return false;
      if (window.Role?.isAdmin) {
        try { return !!window.Role.isAdmin(u); } catch (_) {}
      }
      const am = u.app_metadata || {};
      const r = am.role || am.roles || "";
      const arr = Array.isArray(r) ? r : [r];
      return arr.some(function (x) { return String(x).toLowerCase() === "admin"; });
    } catch (_) { return false; }
  }

  /* ---------- Editor dialog ---------- */
  function _openEditor() {
    if (!_isAdmin()) return;
    document.getElementById("bdTitleEditorOverlay")?.remove();

    const ov = document.createElement("div");
    ov.id = "bdTitleEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;' +
      'max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">✏️ Sửa tiêu đề sinh nhật</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Áp dụng cho tất cả mọi người</div>' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 1</label>' +
      '<input id="bdTitleL1" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;' +
      'border-radius:8px;font-size:14px;font-weight:700;margin-bottom:12px;box-sizing:border-box;">' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 2 (có thể để trống)</label>' +
      '<input id="bdTitleL2" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;' +
      'border-radius:8px;font-size:14px;font-weight:700;margin-bottom:16px;box-sizing:border-box;">' +
      '<div id="bdTitleMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdTitleCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;' +
      'border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huỷ</button>' +
      '<button id="bdTitleSave" type="button" style="flex:1;padding:12px;border:0;' +
      'background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;' +
      'font-size:14px;color:#fff;cursor:pointer;">Lưu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    const inp1 = ov.querySelector("#bdTitleL1");
    const inp2 = ov.querySelector("#bdTitleL2");
    const msg  = ov.querySelector("#bdTitleMsg");
    const btnS = ov.querySelector("#bdTitleSave");
    const btnC = ov.querySelector("#bdTitleCancel");

    inp1.value = _state.line1;
    inp2.value = _state.line2;
    setTimeout(function () { inp1.focus(); inp1.select(); }, 60);

    btnC.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnS.onclick = async function () {
      const l1 = inp1.value.trim();
      const l2 = inp2.value.trim();
      if (!l1) { msg.textContent = "Dòng 1 không được trống"; msg.style.color = "#e74c3c"; return; }

      btnS.disabled = true;
      btnS.textContent = "⏳ Đang lưu...";
      msg.textContent = "";

      const backup = { line1: _state.line1, line2: _state.line2 };
      _state.line1 = l1;
      _state.line2 = l2;

      try {
        await _saveToServer();
        _saveCache();
        _notify();
        msg.textContent = "✓ Đã lưu cho tất cả mọi người";
        msg.style.color = "#4fa370";
        setTimeout(function () { ov.remove(); }, 700);
      } catch (e) {
        _state.line1 = backup.line1;
        _state.line2 = backup.line2;
        msg.textContent = "✗ Lỗi: " + (e && e.message ? e.message : "không lưu được");
        msg.style.color = "#e74c3c";
        btnS.disabled = false;
        btnS.textContent = "Lưu";
      }
    };
  }

  /* ---------- Long-press detection ---------- */
  function _bindLongPress() {
    let timer = null, target = null, startX = 0, startY = 0;

    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (target) { target.style.transform = ""; target = null; }
    }

    document.addEventListener("pointerdown", function (e) {
      if (!_isAdmin()) return;
      const t = e.target.closest && e.target.closest(".landing-title.rainbow-birthday");
      if (!t) return;
      target = t;
      startX = e.clientX;
      startY = e.clientY;
      t.style.transition = "transform .15s";
      t.style.transform = "scale(0.97)";

      timer = setTimeout(function () {
        timer = null;
        if (target) {
          target.style.transform = "";
          if (navigator.vibrate) try { navigator.vibrate(30); } catch (_) {}
          _openEditor();
          target = null;
        }
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener("pointerup", cancel);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("pointermove", function (e) {
      if (!timer) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 10) cancel();
    }, { passive: true });

    // Desktop: chuột phải cũng mở editor
    document.addEventListener("contextmenu", function (e) {
      if (!_isAdmin()) return;
      if (e.target.closest && e.target.closest(".landing-title.rainbow-birthday")) {
        e.preventDefault();
        _openEditor();
      }
    });

    // Prevent text selection trong lúc long-press
    document.addEventListener("selectstart", function (e) {
      if (target && e.target.closest && e.target.closest(".landing-title")) {
        e.preventDefault();
      }
    });
  }

  /* ---------- Hint cho admin (1 lần) ---------- */
  function _maybeShowHint() {
    if (!_isAdmin()) return;
    try {
      if (localStorage.getItem(HINT_KEY) === "1") return;
      localStorage.setItem(HINT_KEY, "1");
    } catch (_) {}
    setTimeout(function () {
      try {
        window.Toast?.show?.("💡 Nhấn giữ tiêu đề để sửa", { type: "info", duration: 3000 });
      } catch (_) {}
    }, 2500);
  }

  /* ---------- Init ---------- */
  function _init() {
    _loadCache();
    _bindLongPress();

    // Lần đầu: fetch server → notify để landing.js re-render
    _loadFromServer().then(function (ok) {
      if (ok) _notify();
      _maybeShowHint();
    });

    // Khi tab quay lại → fetch lại (như spin-feed)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      _loadFromServer().then(function (ok) { if (ok) _notify(); });
    });
  }

  window.__bdTitle = {
    getHTML: getHTML,
    getLines: getLines,
    openEditor: _openEditor,
    onChange: function (cb) { if (typeof cb === "function") _listeners.push(cb); },
    reload: function () { return _loadFromServer().then(function (ok) { if (ok) _notify(); }); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init, { once: true });
  } else {
    setTimeout(_init, 0);
  }

  console.log("[bdTitle] ready ✓ v1.0");
})();