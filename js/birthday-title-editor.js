/* =========================================================
   SITE CONTENT EDITOR — v1.3 (title + lyrics)
   ---------------------------------------------------------
   v1.3:
   - Thêm tính năng LYRICS:
     · Admin long-press countdown/lyric → paste lời bài hát
     · Mỗi câu cách nhau bằng dấu chấm (.)
     · Lưu Supabase site_settings key="site_lyrics"
     · Áp dụng toàn bộ user, cache localStorage
   - Tách _bindLongPress(selector, cb) thành generic
   v1.2:
   - Site title (không còn birthday)
   ========================================================= */
(function () {
  "use strict";
  if (window.__bdTitle) return;

  /* ─── TITLE ─── */
  const TITLE_CACHE_KEY  = "srank_site_title_v2";
  const TITLE_SETTING    = "site_title";
  const HINT_KEY         = "srank_site_title_hint_v2";

  /* ─── LYRICS ─── */
  const LYR_CACHE_KEY    = "srank_site_lyrics_v1";
  const LYR_SETTING      = "site_lyrics";
  const LYR_HINT_KEY     = "srank_site_lyrics_hint_v1";

  /* ─── RPC ─── */
  const RPC_GET          = "rpc_get_site_setting";
  const RPC_SET          = "rpc_set_site_setting";
  const LONG_PRESS_MS    = 650;

  const _titleState = { line1: "", line2: "" };
  const _lyricsState = { raw: "" };

  function _esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function _dispatch(eventName) {
    window.dispatchEvent(new Event(eventName));
  }

  /* ═══════════════════════════════════════════════════════
     TITLE API
     ═══════════════════════════════════════════════════════ */
  function getTitleHTML() {
    let h = "";
    const l1 = String(_titleState.line1 || "").trim();
    const l2 = String(_titleState.line2 || "").trim();
    if (l1) h += '<span class="rainbow-line">' + _esc(l1) + "</span>";
    if (l2) h += '<span class="rainbow-line">' + _esc(l2) + "</span>";
    return h;
  }

  function _loadTitleCache() {
    try {
      const raw = localStorage.getItem(TITLE_CACHE_KEY);
      if (!raw) return false;
      const o = JSON.parse(raw);
      if (o && typeof o.line1 === "string") {
        _titleState.line1 = o.line1;
        _titleState.line2 = typeof o.line2 === "string" ? o.line2 : "";
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveTitleCache() {
    try {
      localStorage.setItem(TITLE_CACHE_KEY, JSON.stringify({
        line1: _titleState.line1, line2: _titleState.line2
      }));
    } catch (_) {}
  }

  async function _loadTitleFromServer() {
    return _rpcLoad(TITLE_SETTING, function (o) {
      if (!o || typeof o.line1 !== "string") return false;
      const newL1 = o.line1;
      const newL2 = typeof o.line2 === "string" ? o.line2 : "";
      const changed = (newL1 !== _titleState.line1) || (newL2 !== _titleState.line2);
      _titleState.line1 = newL1;
      _titleState.line2 = newL2;
      _saveTitleCache();
      return changed;
    });
  }

  async function _saveTitleToServer() {
    const value = JSON.stringify({
      line1: String(_titleState.line1 || "").trim(),
      line2: String(_titleState.line2 || "").trim()
    });
    return _rpcSave(TITLE_SETTING, value);
  }

  /* ═══════════════════════════════════════════════════════
     LYRICS API
     ═══════════════════════════════════════════════════════ */
  function getLyricsRaw() {
    return String(_lyricsState.raw || "");
  }

  function getLyricsPhrases() {
    const raw = String(_lyricsState.raw || "").trim();
    if (!raw) return [];
    return raw
      .split(/[.。]/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function _loadLyricsCache() {
    try {
      const raw = localStorage.getItem(LYR_CACHE_KEY);
      if (!raw) return false;
      const o = JSON.parse(raw);
      if (o && typeof o.raw === "string") {
        _lyricsState.raw = o.raw;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveLyricsCache() {
    try {
      localStorage.setItem(LYR_CACHE_KEY, JSON.stringify({ raw: _lyricsState.raw }));
    } catch (_) {}
  }

  async function _loadLyricsFromServer() {
    return _rpcLoad(LYR_SETTING, function (o) {
      if (!o || typeof o.raw !== "string") return false;
      const newRaw = o.raw;
      const changed = newRaw !== _lyricsState.raw;
      _lyricsState.raw = newRaw;
      _saveLyricsCache();
      return changed;
    });
  }

  async function _saveLyricsToServer() {
    const value = JSON.stringify({ raw: String(_lyricsState.raw || "").trim() });
    return _rpcSave(LYR_SETTING, value);
  }

  /* ═══════════════════════════════════════════════════════
     RPC HELPERS (dùng chung)
     ═══════════════════════════════════════════════════════ */
  async function _rpcLoad(key, applyFn) {
    const sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") return false;
    try {
      const res = await sb.rpc(RPC_GET, { p_key: key });
      if (res.error) {
        console.warn("[bdTitle] RPC_GET error:", res.error.message || res.error);
        return false;
      }
      if (!res.data) return false;
      let o = null;
      try {
        o = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      } catch (_) {
        console.warn("[bdTitle] parse error:", res.data);
        return false;
      }
      return applyFn(o);
    } catch (e) {
      console.warn("[bdTitle] load failed:", e && e.message);
      return false;
    }
  }

  async function _rpcSave(key, value) {
    const sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") {
      throw new Error("Không có kết nối server");
    }
    const res = await sb.rpc(RPC_SET, { p_key: key, p_value: value });
    if (res.error) throw new Error(res.error.message || "Server từ chối");
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     ADMIN DETECTION
     ═══════════════════════════════════════════════════════ */
  function _isAdmin() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return false;
      if (window.Role?.isAdmin) {
        try { return !!window.Role.isAdmin(u); } catch (_) {}
      }
      const am = u.app_metadata || {};
      const um = u.user_metadata || {};
      const r = am.role || um.role || am.roles || um.roles || "";
      const arr = Array.isArray(r) ? r : [r];
      if (arr.some(function (x) { return String(x).toLowerCase().indexOf("admin") >= 0; })) return true;
      if (am.is_admin === true || um.is_admin === true) return true;
      const un = String(u.username || "").toLowerCase();
      if (un === "minhquan" || un === "admin") return true;
      return false;
    } catch (_) { return false; }
  }

  /* ═══════════════════════════════════════════════════════
     EDITOR DIALOGS
     ═══════════════════════════════════════════════════════ */
  function _closeOverlay(id) {
    document.getElementById(id)?.remove();
  }

  /* ─── TITLE EDITOR ─── */
  function _openTitleEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdTitleEditorOverlay");

    const ov = document.createElement("div");
    ov.id = "bdTitleEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">✏️ Sửa tiêu đề</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Áp dụng cho tất cả · Để trống cả 2 dòng để ẩn</div>' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 1</label>' +
      '<input id="bdTitleL1" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:12px;box-sizing:border-box;">' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 2 (có thể trống)</label>' +
      '<input id="bdTitleL2" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:16px;box-sizing:border-box;">' +
      '<div id="bdTitleMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdTitleCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huỷ</button>' +
      '<button id="bdTitleSave" type="button" style="flex:1;padding:12px;border:0;background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;font-size:14px;color:#fff;cursor:pointer;">Lưu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    const inp1 = ov.querySelector("#bdTitleL1");
    const inp2 = ov.querySelector("#bdTitleL2");
    const msg  = ov.querySelector("#bdTitleMsg");
    const btnS = ov.querySelector("#bdTitleSave");
    const btnC = ov.querySelector("#bdTitleCancel");

    inp1.value = _titleState.line1 || "";
    inp2.value = _titleState.line2 || "";
    setTimeout(function () { inp1.focus(); inp1.select(); }, 60);

    btnC.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnS.onclick = async function () {
      const l1 = inp1.value.trim();
      const l2 = inp2.value.trim();
      btnS.disabled = true;
      btnS.textContent = "⏳ Đang lưu...";
      msg.textContent = "";

      const backup = { line1: _titleState.line1, line2: _titleState.line2 };
      _titleState.line1 = l1;
      _titleState.line2 = l2;

      try {
        await _saveTitleToServer();
        _saveTitleCache();
        _dispatch("bdTitleChanged");
        msg.textContent = (!l1 && !l2) ? "✓ Đã xoá tiêu đề" : "✓ Đã lưu";
        msg.style.color = "#4fa370";
        setTimeout(function () { ov.remove(); }, 700);
      } catch (e) {
        _titleState.line1 = backup.line1;
        _titleState.line2 = backup.line2;
        msg.textContent = "✗ Lỗi: " + (e && e.message ? e.message : "không lưu được");
        msg.style.color = "#e74c3c";
        btnS.disabled = false;
        btnS.textContent = "Lưu";
      }
    };
  }

  /* ─── LYRICS EDITOR ─── */
  function _openLyricsEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdLyricsEditorOverlay");

    const ov = document.createElement("div");
    ov.id = "bdLyricsEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">🎵 Lời bài hát</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:12px;">Mỗi câu cách nhau bằng dấu chấm (.). Để trống để tắt.</div>' +
      '<textarea id="bdLyricsRaw" rows="7" placeholder="VD: Yêu em nhiều lắm. Anh nhớ em vô cùng. Về nhà thôi." style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:13px;font-weight:600;line-height:1.5;margin-bottom:8px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>' +
      '<div id="bdLyricsPreview" style="font-size:11px;color:#8a6a3a;margin-bottom:12px;min-height:14px;"></div>' +
      '<div id="bdLyricsMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdLyricsCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huỷ</button>' +
      '<button id="bdLyricsSave" type="button" style="flex:1;padding:12px;border:0;background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;font-size:14px;color:#fff;cursor:pointer;">Lưu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    const ta   = ov.querySelector("#bdLyricsRaw");
    const prev = ov.querySelector("#bdLyricsPreview");
    const msg  = ov.querySelector("#bdLyricsMsg");
    const btnS = ov.querySelector("#bdLyricsSave");
    const btnC = ov.querySelector("#bdLyricsCancel");

    ta.value = _lyricsState.raw || "";
    setTimeout(function () { ta.focus(); }, 60);

    function _updatePreview() {
      const raw = String(ta.value || "").trim();
      if (!raw) { prev.textContent = "— Trống: sẽ hiện countdown khoá Checklist —"; return; }
      const parts = raw.split(/[.。]/).map(function (s) { return s.trim(); }).filter(Boolean);
      prev.textContent = "📝 " + parts.length + " câu · VD: \"" + (parts[0] || "").slice(0, 40) + (parts[0] && parts[0].length > 40 ? "…" : "") + "\"";
    }
    ta.addEventListener("input", _updatePreview);
    _updatePreview();

    btnC.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnS.onclick = async function () {
      const raw = String(ta.value || "").trim();
      btnS.disabled = true;
      btnS.textContent = "⏳ Đang lưu...";
      msg.textContent = "";

      const backup = _lyricsState.raw;
      _lyricsState.raw = raw;

      try {
        await _saveLyricsToServer();
        _saveLyricsCache();
        _dispatch("bdLyricsChanged");
        msg.textContent = raw ? "✓ Đã lưu — toàn bộ user sẽ thấy" : "✓ Đã xoá lyrics";
        msg.style.color = "#4fa370";
        setTimeout(function () { ov.remove(); }, 700);
      } catch (e) {
        _lyricsState.raw = backup;
        msg.textContent = "✗ Lỗi: " + (e && e.message ? e.message : "không lưu được");
        msg.style.color = "#e74c3c";
        btnS.disabled = false;
        btnS.textContent = "Lưu";
      }
    };
  }

  /* ═══════════════════════════════════════════════════════
     LONG-PRESS — generic
     ═══════════════════════════════════════════════════════ */
  function _bindLongPress(selector, callback) {
    let timer = null, target = null, startX = 0, startY = 0;

    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (target) { target.style.transform = ""; target = null; }
    }

    document.addEventListener("pointerdown", function (e) {
      if (!_isAdmin()) return;
      const t = e.target.closest && e.target.closest(selector);
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
          callback();
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

    document.addEventListener("contextmenu", function (e) {
      if (!_isAdmin()) return;
      if (e.target.closest && e.target.closest(selector)) {
        e.preventDefault();
        callback();
      }
    });

    document.addEventListener("selectstart", function (e) {
      if (target && e.target.closest && e.target.closest(selector)) {
        e.preventDefault();
      }
    });
  }

  function _bindAllLongPress() {
    // Title → title editor
    _bindLongPress(".landing-title.rainbow-birthday", _openTitleEditor);
    // Lyric OR countdown → lyrics editor
    _bindLongPress(".landing-lyric, .birthday-countdown", _openLyricsEditor);
  }

  /* ═══════════════════════════════════════════════════════
     HINT TOASTS
     ═══════════════════════════════════════════════════════ */
  function _showHint(key, text) {
    if (!_isAdmin()) return;
    try {
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch (_) {}
    setTimeout(function () {
      try {
        window.Toast?.show?.(text, { type: "info", duration: 3200 });
      } catch (_) {}
    }, 2500);
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  function _init() {
    _loadTitleCache();
    _loadLyricsCache();
    _bindAllLongPress();

    Promise.all([
      _loadTitleFromServer(),
      _loadLyricsFromServer()
    ]).then(function (results) {
      if (results[0]) _dispatch("bdTitleChanged");
      if (results[1]) _dispatch("bdLyricsChanged");
      _showHint(HINT_KEY, "💡 Nhấn giữ tiêu đề để sửa");
      _showHint(LYR_HINT_KEY, "💡 Nhấn giữ countdown để thêm lời bài hát");
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      Promise.all([
        _loadTitleFromServer(),
        _loadLyricsFromServer()
      ]).then(function (results) {
        if (results[0]) _dispatch("bdTitleChanged");
        if (results[1]) _dispatch("bdLyricsChanged");
      });
    });
  }

  window.__bdTitle = {
    // Title
    getHTML: getTitleHTML,
    getLines: function () {
      return { line1: String(_titleState.line1 || ""), line2: String(_titleState.line2 || "") };
    },
    openTitleEditor: _openTitleEditor,
    // Lyrics
    getLyricsRaw: getLyricsRaw,
    getLyricsPhrases: getLyricsPhrases,
    openLyricsEditor: _openLyricsEditor,
    // Shared
    isAdmin: _isAdmin,
    reload: function () {
      return Promise.all([_loadTitleFromServer(), _loadLyricsFromServer()]).then(function (r) {
        if (r[0]) _dispatch("bdTitleChanged");
        if (r[1]) _dispatch("bdLyricsChanged");
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init, { once: true });
  } else {
    setTimeout(_init, 0);
  }

  console.log("[bdTitle] ready ✓ v1.3 (title + lyrics)");
})();