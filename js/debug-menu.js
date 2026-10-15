/* =========================================================
   DEBUG MENU — v1.0
   ---------------------------------------------------------
   Nút 🐛 nổi góc dưới-trái. Bấm → hiện panel debug với:
     - Trạng thái load của TẤT CẢ module
     - DOM elements có/không
     - Login / Admin / Role state
     - Lỗi runtime đã bắt được (error, promise, script load)
     - Performance resource timings
   Nút "Copy" để gửi cho dev fix.

   LOAD ORDER: NGAY SAU config.js (trước mọi thứ khác để bắt
   được cả lỗi load script).
   ========================================================= */
(function () {
  "use strict";
  if (window.__debugMenuLoaded) return;
  window.__debugMenuLoaded = true;

  /* ═══════════════════════════════════════════════════════
     1. BẮT LỖI TỪ RẤT SỚM
     ═══════════════════════════════════════════════════════ */
  window.__debugErrors = window.__debugErrors || [];

  window.addEventListener("error", function (e) {
    try {
      window.__debugErrors.push({
        type: "error",
        msg: String(e.message || ""),
        file: String(e.filename || "").split("/").pop().split("?")[0],
        line: e.lineno || 0,
        col: e.colno || 0,
        stack: e.error && e.error.stack
          ? String(e.error.stack).split("\n").slice(0, 4).join(" | ")
          : "",
        ts: Date.now()
      });
    } catch (_) {}
  }, true);

  window.addEventListener("unhandledrejection", function (e) {
    try {
      window.__debugErrors.push({
        type: "promise",
        msg: String((e.reason && e.reason.message) || e.reason || "unhandled rejection"),
        stack: e.reason && e.reason.stack
          ? String(e.reason.stack).split("\n").slice(0, 4).join(" | ")
          : "",
        ts: Date.now()
      });
    } catch (_) {}
  });

  document.addEventListener("error", function (e) {
    try {
      const t = e.target;
      if (t && t.tagName === "SCRIPT" && t.src) {
        window.__debugErrors.push({
          type: "script-load",
          msg: "Failed to load: " + String(t.src).split("/").pop(),
          file: String(t.src).split("/").pop().split("?")[0],
          ts: Date.now()
        });
      }
      if (t && t.tagName === "LINK" && t.href) {
        window.__debugErrors.push({
          type: "css-load",
          msg: "Failed to load CSS: " + String(t.href).split("/").pop(),
          ts: Date.now()
        });
      }
    } catch (_) {}
  }, true);

  /* ═══════════════════════════════════════════════════════
     2. THU THẬP THÔNG TIN
     ═══════════════════════════════════════════════════════ */
  function _safe(fn, fallback) {
    try { return fn(); } catch (e) { return "THROW: " + (e.message || e); }
  }

  function _fmt(v) {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "object") {
      try { return JSON.stringify(v); } catch (_) { return String(v); }
    }
    return String(v);
  }

  function collect() {
    const out = [];
    const now = new Date();

    out.push("════════════════════════════════════════════");
    out.push("   ĐẢO MÈO — DEBUG REPORT");
    out.push("════════════════════════════════════════════");
    out.push("Time:        " + now.toISOString());
    out.push("Local time:  " + now.toLocaleString("vi-VN"));
    out.push("TZ:          " + _safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone, "?"));
    out.push("URL:         " + location.href);
    out.push("UA:          " + navigator.userAgent);
    out.push("Platform:    " + (navigator.platform || "?"));
    out.push("Viewport:    " + window.innerWidth + "x" + window.innerHeight + " @" + (window.devicePixelRatio || 1) + "x");
    out.push("Language:    " + navigator.language);
    out.push("Online:      " + navigator.onLine);
    out.push("App version: " + _safe(() => document.getElementById("appVersion")?.textContent, "?"));
    out.push("");

    /* ───── MODULES ───── */
    out.push("─── MODULES ──────────────────────────────");
    const modules = [
      ["__SRANK_CONFIG",        () => !!window.__SRANK_CONFIG],
      ["Role",                  () => !!window.Role],
      ["Toast",                 () => !!window.Toast],
      ["AdminSession",          () => !!window.AdminSession],
      ["Store",                 () => !!window.Store],
      ["SRankScheduler",        () => !!window.SRankScheduler],
      ["__sb (supabase)",       () => !!window.__sb],
      ["DisplayName",           () => !!window.DisplayName],
      ["SRank.Auth",            () => !!(window.SRank && window.SRank.Auth)],
      ["SrankCore",             () => !!window.SrankCore],
      ["LandingView",           () => !!window.LandingView],
      ["AdminView",             () => !!window.AdminView],
      ["ChecklistView",         () => !!window.ChecklistView],
      ["__ctaMorph",            () => !!window.__ctaMorph],
      ["__clV6",                () => !!window.__clV6],
      ["__clBridgeLoaded",      () => !!window.__clBridgeLoaded],
      ["createWheel",           () => typeof window.createWheel === "function"],
      ["__openAttendancePage",  () => typeof window.__openAttendancePage === "function"],
      ["__getAttendanceSelectedName", () => typeof window.__getAttendanceSelectedName === "function"],
      ["__attendanceTop3Loaded",() => !!window.__attendanceTop3Loaded],
      ["SRank.NavPages",        () => !!(window.SRank && window.SRank.NavPages)],
      ["__debugMenuLoaded",     () => !!window.__debugMenuLoaded]
    ];
    modules.forEach(function (pair) {
      let v = _safe(pair[1], "ERR");
      if (v === true)  out.push("  ✅ " + pair[0]);
      else if (v === false) out.push("  ❌ " + pair[0]);
      else out.push("  ⚠️  " + pair[0] + " → " + v);
    });
    out.push("");

    /* ───── DOM ───── */
    out.push("─── DOM ELEMENTS ─────────────────────────");
    const domIds = [
      "space","question","hint","checklistPanel","checklist","status",
      "homeBtn","checklistBtn","adminBtn","syncBtn","captureBtn",
      "adminPage","adminPageBack","adminPageLogout","adminPageNav",
      "attendanceBtn","attendancePage","attendanceBack","attendanceGrid",
      "attendanceEmployeeWheelBtn","attendanceNameWheel","attendanceNameWheelViewport",
      "attendanceStatusOverlay","attendanceMultiBar","attendanceMonthLabel",
      "menuToggle","menuOverlay","menuUserCard",
      "loginOverlay","loginUsername","loginPassword","loginSubmit",
      "logoutBtn","logoutName","avatarBtn","avatarFileInput",
      "clV6Page","bottomNav","secondaryNav"
    ];
    domIds.forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) {
        out.push("  ❌ #" + id + " MISSING");
      } else {
        const flags = [];
        if (el.classList.contains("show"))   flags.push(".show");
        if (el.classList.contains("open"))   flags.push(".open");
        if (el.classList.contains("active")) flags.push(".active");
        if (el.hidden)                        flags.push("hidden");
        const cs = _safe(() => getComputedStyle(el), null);
        if (cs && cs.display === "none") flags.push("display:none");
        out.push("  ✅ #" + id + (flags.length ? " [" + flags.join(",") + "]" : ""));
      }
    });
    out.push("");

    /* ───── STATE ───── */
    out.push("─── STATE ────────────────────────────────");
    const auth = window.SRank && window.SRank.Auth;
    if (auth) {
      const u = _safe(() => auth.getCurrentUser(), null);
      out.push("  Auth.user:            " + (u ? (u.username || "?") + " / " + (u.displayName || "?") + " (id:" + String(u.id || "").slice(0, 8) + ")" : "(chưa login)"));
      out.push("  Auth.isLoggedIn():    " + _safe(() => auth.isLoggedIn(), "N/A"));
      if (u && u.app_metadata) out.push("  Auth.app_metadata:    " + _fmt(u.app_metadata));
      if (u && u.user_metadata) out.push("  Auth.user_metadata:   " + _fmt(u.user_metadata));
    } else {
      out.push("  Auth:                 ❌ KHÔNG CÓ window.SRank.Auth");
    }
    out.push("  AdminSession.valid(): " + _safe(() => window.AdminSession && window.AdminSession.isValid(), "N/A"));
    out.push("  AdminSession.token:   " + _safe(() => window.AdminSession && window.AdminSession.get(), "N/A"));
    out.push("  Role.get():           " + _safe(() => _fmt(window.Role && window.Role.get()), "N/A"));
    out.push("  body.className:       " + document.body.className);
    out.push("  document.readyState:  " + document.readyState);
    out.push("");

    /* ───── UI STATE ───── */
    out.push("─── UI STATE ─────────────────────────────");
    const ui = {
      menuOverlay_open: !!document.getElementById("menuOverlay")?.classList.contains("open"),
      attendancePage_show: !!document.getElementById("attendancePage")?.classList.contains("show"),
      clV6Page_show: !!document.getElementById("clV6Page")?.classList.contains("show"),
      adminPage_show: !!document.getElementById("adminPage")?.classList.contains("show"),
      loginOverlay_show: !!document.getElementById("loginOverlay")?.classList.contains("show"),
      checklistPanel_show: !!document.getElementById("checklistPanel")?.classList.contains("show"),
      body_menuOpen: document.body.classList.contains("menu-open"),
      body_overlayOpen: document.body.classList.contains("overlay-open")
    };
    Object.keys(ui).forEach(function (k) { out.push("  " + k + ": " + ui[k]); });
    out.push("");

    /* ───── ERRORS ───── */
    out.push("─── ERRORS (" + window.__debugErrors.length + ") ────────────");
    if (!window.__debugErrors.length) {
      out.push("  (không có lỗi nào được bắt)");
    } else {
      window.__debugErrors.slice(-40).forEach(function (e, i) {
        out.push("  [" + (i + 1) + "] " + e.type);
        if (e.file) out.push("      File: " + e.file + (e.line ? ":" + e.line : "") + (e.col ? ":" + e.col : ""));
        out.push("      Msg:  " + (e.msg || ""));
        if (e.stack) out.push("      Stack: " + e.stack);
      });
    }
    out.push("");

    /* ───── RESOURCES ───── */
    out.push("─── RESOURCES (scripts + css) ─────────────");
    try {
      const resources = performance.getEntriesByType("resource") || [];
      const scripts = resources.filter(function (r) {
        return r.initiatorType === "script" || r.initiatorType === "link" || /\.(js|css)(\?|$)/.test(r.name);
      });
      if (!scripts.length) out.push("  (không có)");
      scripts.forEach(function (r) {
        const name = String(r.name || "").split("/").pop().split("?")[0] || r.name;
        const dur = Math.round(r.duration || 0);
        const size = r.transferSize || 0;
        const ok = size > 0 || dur > 0;
        out.push("  " + (ok ? "✅" : "❌") + " " + name + "  (" + dur + "ms, " + size + "B)");
      });
    } catch (e) {
      out.push("  ERROR: " + e.message);
    }
    out.push("");

    out.push("════════════════════════════════════════════");
    out.push("   END OF REPORT");
    out.push("════════════════════════════════════════════");
    return out.join("\n");
  }

  /* ═══════════════════════════════════════════════════════
     3. STYLES
     ═══════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById("__dbgStyles")) return;
    const s = document.createElement("style");
    s.id = "__dbgStyles";
    s.textContent = `
      #__dbgBtn {
        position: fixed;
        left: 12px;
        bottom: calc(140px + env(safe-area-inset-bottom, 0px));
        width: 48px; height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        color: #fff;
        border: 2px solid #fff;
        box-shadow: 0 6px 20px -4px rgba(185,28,28,.55), 0 0 0 2px rgba(239,68,68,.3);
        font-size: 22px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        z-index: 99998;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 0;
        line-height: 1;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      #__dbgBtn:active { transform: scale(.9); }
      #__dbgBtn.busy { animation: __dbgSpin 1s linear infinite; }
      @keyframes __dbgSpin { to { transform: rotate(360deg); } }

      #__dbgPanel {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.85);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99999;
        display: none;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #__dbgPanel.show { display: flex; }
      #__dbgHead {
        flex: 0 0 auto;
        display: flex; align-items: center; gap: 8px;
        padding: 12px 14px;
        padding-top: calc(12px + env(safe-area-inset-top, 0px));
        background: #1a1a1a;
        color: #fff;
        border-bottom: 1px solid #333;
      }
      #__dbgHead h2 { flex: 1; margin: 0; font-size: 15px; font-weight: 800; letter-spacing: .02em; }
      #__dbgClose {
        width: 36px; height: 36px;
        border-radius: 10px; border: 0;
        background: #333; color: #fff;
        font-size: 18px; cursor: pointer; font-weight: 900;
      }
      #__dbgTextarea {
        flex: 1 1 auto;
        width: 100%;
        margin: 0;
        padding: 12px;
        background: #0f0f0f;
        color: #7dd3fc;
        border: 0; outline: 0;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-size: 10.5px;
        line-height: 1.5;
        resize: none;
        white-space: pre;
        overflow: auto;
        -webkit-text-size-adjust: 100%;
      }
      #__dbgActions {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        padding: 10px 12px;
        padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
        background: #1a1a1a;
        border-top: 1px solid #333;
      }
      #__dbgActions button {
        min-height: 46px;
        border-radius: 12px; border: 0;
        font-family: inherit; font-size: 13.5px; font-weight: 900;
        cursor: pointer; color: #fff;
        letter-spacing: .02em;
      }
      #__dbgActions button:active { transform: scale(.96); }
      #__dbgCopyBtn  { background: linear-gradient(180deg,#22c55e,#15803d); }
      #__dbgCopyBtn.copied { background: linear-gradient(180deg,#7dd3fc,#0ea5e9); }
      #__dbgRefBtn   { background: linear-gradient(180deg,#f59e0b,#b45309); }
      #__dbgCloseBtn { background: linear-gradient(180deg,#64748b,#334155); }
      #__dbgToast {
        position: fixed;
        left: 50%; bottom: 90px;
        transform: translateX(-50%) translateY(20px);
        padding: 10px 18px;
        background: rgba(35,74,50,.96);
        color: #fff; font-weight: 900; font-size: 13px;
        border-radius: 999px;
        box-shadow: 0 12px 30px -8px rgba(0,0,0,.5);
        z-index: 100000;
        opacity: 0; pointer-events: none;
        transition: opacity .2s, transform .2s;
        max-width: 90vw; text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #__dbgToast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════
     4. UI
     ═══════════════════════════════════════════════════════ */
  function ensureToast() {
    let el = document.getElementById("__dbgToast");
    if (el) return el;
    el = document.createElement("div");
    el.id = "__dbgToast";
    document.body.appendChild(el);
    return el;
  }

  function toast(msg, ms) {
    const el = ensureToast();
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, ms || 2200);
  }

  function refreshTextarea() {
    const ta = document.getElementById("__dbgTextarea");
    if (!ta) return;
    ta.value = collect();
  }

  async function doCopy() {
    const ta = document.getElementById("__dbgTextarea");
    const btn = document.getElementById("__dbgCopyBtn");
    if (!ta) return;
    const text = ta.value;

    let ok = false;
    // Try modern clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (_) {}

    // Fallback: select + execCommand
    if (!ok) {
      try {
        ta.removeAttribute("readonly");
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand && document.execCommand("copy");
        ta.setAttribute("readonly", "");
      } catch (_) { ok = false; }
    }

    if (ok) {
      if (btn) {
        const oldText = btn.textContent;
        btn.classList.add("copied");
        btn.textContent = "✓ Đã copy";
        toast("✅ Đã copy — dán vào chat gửi dev");
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = oldText;
        }, 2200);
      } else {
        toast("✅ Đã copy");
      }
    } else {
      // Last resort: select all so user can long-press copy manually
      try {
        ta.removeAttribute("readonly");
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
      } catch (_) {}
      toast("⚠️ Tự động copy không được — nhấn giữ text rồi chọn Copy", 4000);
    }
  }

  function openPanel() {
    const panel = document.getElementById("__dbgPanel");
    if (!panel) return;
    refreshTextarea();
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    const panel = document.getElementById("__dbgPanel");
    if (!panel) return;
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function injectButton() {
    if (document.getElementById("__dbgBtn")) return;
    injectStyles();

    const btn = document.createElement("button");
    btn.id = "__dbgBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Debug");
    btn.textContent = "🐛";
    document.body.appendChild(btn);

    const panel = document.createElement("div");
    panel.id = "__dbgPanel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div id="__dbgHead">
        <h2>🐛 Debug Report</h2>
        <button id="__dbgClose" type="button" aria-label="Đóng">✕</button>
      </div>
      <textarea id="__dbgTextarea" readonly spellcheck="false"></textarea>
      <div id="__dbgActions">
        <button id="__dbgCopyBtn"  type="button">📋 Copy</button>
        <button id="__dbgRefBtn"   type="button">🔄 Làm mới</button>
        <button id="__dbgCloseBtn" type="button">✕ Đóng</button>
      </div>
    `;
    document.body.appendChild(panel);

    btn.addEventListener("click", openPanel);
    panel.querySelector("#__dbgClose").addEventListener("click", closePanel);
    panel.querySelector("#__dbgCloseBtn").addEventListener("click", closePanel);
    panel.querySelector("#__dbgRefBtn").addEventListener("click", function () {
      refreshTextarea();
      toast("🔄 Đã làm mới");
    });
    panel.querySelector("#__dbgCopyBtn").addEventListener("click", doCopy);
    panel.addEventListener("click", function (e) {
      if (e.target === panel) closePanel();
    });

    // Expose API để debug bằng tay nếu cần
    window.__debugMenu = {
      open: openPanel,
      close: closePanel,
      collect: collect,
      copy: doCopy,
      errors: function () { return window.__debugErrors.slice(); },
      clearErrors: function () { window.__debugErrors.length = 0; }
    };

    console.log("[debug-menu] 🐛 ready — bấm nút đỏ dưới-trái để xem report");
  }

  /* ═══════════════════════════════════════════════════════
     5. BOOT
     ═══════════════════════════════════════════════════════ */
  function boot() {
    try { injectButton(); } catch (e) { console.error("[debug-menu] inject fail:", e); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();