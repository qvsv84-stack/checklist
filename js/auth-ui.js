/* =========================================================
   SRANK AUTH UI — v10.9 (Role-based + CTA Morph + Verify User + Shop)
   ---------------------------------------------------------
   v10.9 CHANGES (SHOP):
   - getCtaInfo() trả { action: "shop" } khi user đã check hôm nay
   - intercept() xử lý riêng: action === "shop" → gọi window.__openShop()
   v10.8 CHANGES:
   - Bỏ BOSS_WHITELIST hard-code ['tienloi']
   - isBossMode() delegate sang window.Role.isAdmin()
   - Single source of truth: admin whitelist ở config.js
   v10.7 CHANGES:
   - Verify user còn tồn tại trong employees sau login
   - Force logout nếu user đã bị admin xoá
   - Chỉ logout khi RPC trả lời rõ ràng "không tồn tại"
   - Network fail / RPC error → KHÔNG logout (an toàn)
   v10.6 CHANGES:
   - handleCheckin(cta) → gọi window.__ctaMorph.start() nếu có
   - intercept truyền cta vào handleCheckin
   - Fallback miniBurst nếu morph không tồn tại
   v10.5 CHANGES:
   - BOSS_WHITELIST chỉ còn ['tienloi']
   v10.4 CHANGES:
   - Thêm checkbox "Lưu mật khẩu cho lần sau"
   - Tự động điền credentials đã lưu khi mở form
   - Lưu/xoá theo checkbox khi login thành công
   - Storage key: srank_saved_credentials_v1
   v10.3 CHANGES:
   - Bỏ hẳn mọi reference đến password admin
   - isBossMode() check role admin từ Auth metadata
   - Auth.onChange KHÔNG clear gì → role auto-refresh
   - Logout mới clear AdminSession (dù là no-op)
   ========================================================= */
(function(){
  "use strict";

  const Auth = window.SRank && window.SRank.Auth;
  if (!Auth) { console.error("[AUTH-UI] SRank.Auth chưa load"); return; }

  const $ = id => document.getElementById(id);
  const overlay = $("loginOverlay");
  const closeBtn = $("loginClose");
  const userInput = $("loginUsername");
  const passInput = $("loginPassword");
  const msgEl = $("loginMsg");
  const submitBtn = $("loginSubmit");
  const logoutBtn = $("logoutBtn");
  const logoutName = $("logoutName");
  const avatarBtn = $("avatarBtn");
  const appVersion = $("appVersion");
  const question = $("question");
  const rememberCheckbox = $("loginRemember");
  const CRED_KEY = "srank_saved_credentials_v1";

  if (!overlay) { console.warn("[AUTH-UI] thiếu DOM"); return; }

  let currentUser = null;
  let submitting = false;

  /* ============================================================
     SIDEBAR TOGGLE — 2 page A / B
     ============================================================ */
  (function initSidebarToggle(){
    const nav = document.getElementById("appSideNav");
    if (!nav) { console.warn("[NAV] thiếu #appSideNav"); return; }

    const pagesA = nav.querySelectorAll('[data-nav-page="a"]');
    const pagesB = nav.querySelectorAll('[data-nav-page="b"]');
    const toggles = nav.querySelectorAll('[data-nav-toggle]');

    let _page = "a";

    function setPage(p){
      if (p === _page && nav.dataset.navReady === "1") return;
      _page = p;
      nav.dataset.navReady = "1";

      pagesA.forEach(function(el){ el.classList.toggle("is-active", p === "a"); });
      pagesB.forEach(function(el){ el.classList.toggle("is-active", p === "b"); });

      toggles.forEach(function(el){
        el.classList.toggle("is-open", p === "b");
        el.textContent = (p === "a") ? "⋯" : "✕";
        el.title = (p === "a") ? "Thêm" : "Đóng";
        el.setAttribute("aria-label", (p === "a") ? "Mở công cụ khác" : "Đóng công cụ");
      });
    }

    function toggle(){ setPage(_page === "a" ? "b" : "a"); }

    toggles.forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        toggle();
      });
    });

    pagesB.forEach(function(pageEl){
      pageEl.addEventListener("click", function(e){
        const btn = e.target.closest("button[id]");
        if (!btn) return;
        setTimeout(function(){ setPage("a"); }, 80);
      }, true);
    });

    window.SRank = window.SRank || {};
    window.SRank.NavPages = {
      setPage: setPage,
      toggle: toggle,
      current: function(){ return _page; }
    };

    console.log("[NAV] sidebar ready ✓");
  })();

  /* ============================================================
     AUTO-HIDE — ẩn sidebar + 🔔 + 🎂 khi có overlay mở
     ============================================================ */
  (function initAutoHide(){
    const nav = document.getElementById("appSideNav");

    const OVERLAY_IDS = [
      "adminPage", "attendancePage", "shopPage",
      "loginOverlay", "checklistPanel",
      "wheelArea", "message"
    ];

    function isAnyOpen(){
      for (let i = 0; i < OVERLAY_IDS.length; i++){
        const el = document.getElementById(OVERLAY_IDS[i]);
        if (!el) continue;
        if (el.classList.contains("show")) return true;
      }
      return false;
    }

    let _scheduled = false;
    function scheduleUpdate(){
      if (_scheduled) return;
      _scheduled = true;
      requestAnimationFrame(function(){
        _scheduled = false;
        const open = isAnyOpen();
        document.body.classList.toggle("nav-hidden", open);
        if (nav) nav.classList.toggle("nav-hidden", open);
      });
    }

    const obs = new MutationObserver(scheduleUpdate);
    OVERLAY_IDS.forEach(function(id){
      const el = document.getElementById(id);
      if (!el) return;
      obs.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
    });

    scheduleUpdate();
    setTimeout(scheduleUpdate, 200);
    setTimeout(scheduleUpdate, 800);

    console.log("[NAV] auto-hide ready ✓");
  })();

  /* ============ WAVE KICKER CSS ============ */
  function injectBaseCss(){
    if (document.getElementById('bossKickerCss')) return;
    const s = document.createElement('style');
    s.id = 'bossKickerCss';
    s.textContent = `
      .landing-kicker .boss-wave { display: inline-block; white-space: nowrap; }
      .landing-kicker .boss-wave .bw-c {
        display: inline-block;
        will-change: transform;
        transform-origin: center bottom;
        transform: translateY(0) scale(1);
      }
      @media (prefers-reduced-motion: reduce) {
        .landing-kicker .boss-wave .bw-c { animation: none !important; }
      }
    `;
    document.head.appendChild(s);
  }
  injectBaseCss();

  const STEP_MS = 250;
  let _waveStyleEl = null;
  let _waveCount = 0;

  function ensureWaveKeyframes(count){
    if (_waveStyleEl && _waveCount === count) return;
    if (_waveStyleEl && _waveStyleEl.parentNode) _waveStyleEl.remove();
    _waveStyleEl = document.createElement('style');
    _waveStyleEl.id = 'bossWaveKeyframes';
    const rules = [];
    for (let i = 0; i < count; i++){
      const startPct = (i / count) * 100;
      const endPct = ((i + 1) / count) * 100;
      const peakPct = (startPct + endPct) / 2;
      rules.push('@keyframes bwW_' + i + ' {');
      if (startPct === 0){
        rules.push('  0% { transform: translateY(0) scale(1); }');
      } else {
        rules.push('  0%, ' + startPct.toFixed(4) + '% { transform: translateY(0) scale(1); }');
      }
      rules.push('  ' + peakPct.toFixed(4) + '% { transform: translateY(-8px) scale(1.15); }');
      rules.push('  ' + endPct.toFixed(4) + '%, 100% { transform: translateY(0) scale(1); }');
      rules.push('}');
    }
    _waveStyleEl.textContent = rules.join('\n');
    document.head.appendChild(_waveStyleEl);
    _waveCount = count;
  }

  /* ============ HELPERS ============ */
  function isChecklistLocked(){
    try {
      const p = new Intl.DateTimeFormat("en-US",{
        timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit",hour12:!1
      }).formatToParts(new Date());
      const h = +(p.find(x => x.type === "hour")?.value || 0);
      const m = +(p.find(x => x.type === "minute")?.value || 0);
      const lockStr = localStorage.getItem("srank_checklist_lock_time_v1") || "21:00";
      const [lh, lm] = lockStr.split(":").map(Number);
      return h * 60 + m >= (lh || 21) * 60 + (lm || 0);
    } catch(_) { return false; }
  }

  function findUserIndex(name){
    if (!name) return -1;
    try {
      const list = window.__getChecklistNames ? window.__getChecklistNames() : [];
      return list.indexOf(name);
    } catch(_) { return -1; }
  }

  /* ⭐ v10.9: user đã check hôm nay → trả về CTA "shop" */
  function getCtaInfo(){
    if (isChecklistLocked()) return { text: "🔒 Tạm khoá Checklist", locked: true };
    if (!currentUser) return { text: "🔐 Đăng nhập", locked: false };
    const idx = findUserIndex(currentUser.displayName);
    if (idx < 0) return { text: "⚠ Tên không khớp checklist", locked: true };
    try {
      const st = window.SRank && window.SRank.getCurrentState ? window.SRank.getCurrentState() : null;
      if (st && st.checked && st.checked[idx] && st.times && st.times[idx]){
        return { text: "🏪 Shop thưởng", action: "shop", locked: false };
      }
    } catch(_) {}
    return { text: "⏰ Chấm công", locked: false };
  }
  window.__getCtaInfo = getCtaInfo;

  /* ============ KICKER CONFIG ============ */
  const MINO_USERNAME = 'thaouyen';

  const KICKER_DEFAULT = '🐱 DAILY TEAM HUB';
  const KICKER_BOSS = '🕶️ BOSS TỔ CHỨC ÁO ĐEN';
  const KICKER_MINO = '🎀 MINO ÁO HỒNG';

  function isMinoMode(){
    if (!currentUser) return false;
    const un = String(currentUser.username || '').trim().toLowerCase();
    return un === MINO_USERNAME;
  }

  /* ✅ v10.8: delegate sang window.Role — single source of truth */
  function isBossMode(){
    if (!currentUser) return false;
    if (!window.Role) {
      console.warn('[AUTH-UI] window.Role chưa load — kiểm tra load order');
      return false;
    }
    try {
      return window.Role.isAdmin(currentUser);
    } catch(_) {
      return false;
    }
  }

  function splitGraphemes(text){
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter){
        const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
        return Array.from(seg.segment(text), s => s.segment);
      }
    } catch(_) {}
    return Array.from(text);
  }

  function buildWaveHtml(text){
    const chars = splitGraphemes(text);
    let visibleCount = 0;
    for (let i = 0; i < chars.length; i++){
      const c = chars[i];
      if (c.trim() !== '' && c !== '\u00A0') visibleCount++;
    }
    ensureWaveKeyframes(visibleCount);
    const totalMs = visibleCount * STEP_MS;
    let animIdx = 0;
    const inner = chars.map(function(c){
      if (c.trim() === '' || c === '\u00A0'){
        return '<span class="bw-c" style="animation:none">&nbsp;</span>';
      }
      const i = animIdx++;
      const safe = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<span class="bw-c" style="animation: bwW_' + i + ' ' + totalMs + 'ms ease-in-out infinite">' + safe + '</span>';
    }).join('');
    const safeLabel = text.replace(/"/g, '&quot;');
    return '<span class="boss-wave" aria-label="' + safeLabel + '">' + inner + '</span>';
  }

  function getKickerRender(){
    if (isMinoMode()){
      return { html: buildWaveHtml(KICKER_MINO), text: KICKER_MINO, version: 'mino' };
    }
    if (isBossMode()){
      return { html: buildWaveHtml(KICKER_BOSS), text: KICKER_BOSS, version: 'boss' };
    }
    return { html: null, text: KICKER_DEFAULT, version: 'default' };
  }

  function getKickerText(){
    if (isMinoMode()) return KICKER_MINO;
    if (isBossMode()) return KICKER_BOSS;
    return KICKER_DEFAULT;
  }

  window.__getKickerRender = getKickerRender;
  window.__getKickerText = getKickerText;

  /* ============ CTA HANDLER ============ */
  function miniBurst(){
    const space = document.getElementById("space");
    if (!space) return;
    const f = document.createElement("div");
    f.className = "flash";
    space.appendChild(f);
    setTimeout(function(){ f.remove(); }, 700);
    const hearts = [];
    for (let i = 0; i < 20; i++){
      const h = document.createElement("div");
      h.className = "heart";
      h.textContent = (i % 5 === 0) ? "💗" : "♥";
      const a = Math.PI * 2 * i / 20, r = 80 + Math.random() * 200;
      h.style.setProperty("--x", Math.cos(a) * r + "px");
      h.style.setProperty("--y", Math.sin(a) * r + "px");
      h.style.setProperty("--r", (Math.random() * 120 - 60) + "deg");
      h.style.setProperty("--s", (0.7 + Math.random() * 1.3).toFixed(2));
      h.style.setProperty("--time", (0.7 + Math.random() * 0.6).toFixed(2) + "s");
      space.appendChild(h);
      hearts.push(h);
    }
    setTimeout(function(){ for (const h of hearts) h.remove(); }, 1600);
  }

  /* ⭐ v10.6: nhận cta element, ưu tiên morph animation */
  async function handleCheckin(cta){
    if (!currentUser) return;
    const idx = findUserIndex(currentUser.displayName);
    if (idx < 0){
      if (window.SRank.setStatus) window.SRank.setStatus("Tên không khớp checklist");
      return;
    }
    if (typeof window.SRank.requestCheckin !== "function"){
      if (window.SRank.setStatus) window.SRank.setStatus("Chức năng chưa sẵn sàng");
      return;
    }

    /* ⭐ v10.6: dùng morph animation nếu có */
    if (window.__ctaMorph && typeof window.__ctaMorph.start === "function" && cta) {
      try {
        await window.__ctaMorph.start(cta);
        return;
      } catch(err) {
        console.error("[AUTH-UI] morph failed, fallback:", err);
      }
    }

    /* Fallback: checkin trực tiếp */
    miniBurst();
    try {
      await window.SRank.requestCheckin(currentUser.displayName);
    } catch(err){
      console.error("[AUTH-UI] checkin error:", err);
    }
  }

  /* ⭐ v10.9: intercept xử lý cả 3 case: shop / locked / login+checkin */
  function intercept(e){
    const cta = e.target && e.target.closest ? e.target.closest(".landing-cta") : null;
    if (!cta) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const info = getCtaInfo();

    /* ⭐ SHOP: mở shop page */
    if (info.action === "shop") {
      try {
        if (typeof window.__openShop === "function") {
          window.__openShop();
        } else {
          console.warn("[AUTH-UI] window.__openShop chưa sẵn sàng");
          if (window.SRank && window.SRank.setStatus) {
            window.SRank.setStatus("Shop đang tải, thử lại sau 1 giây…");
          }
        }
      } catch(err) {
        console.error("[AUTH-UI] openShop error:", err);
      }
      return;
    }

    if (info.locked) return;
    if (!currentUser) openLoginForm();
    else handleCheckin(cta);
  }

  if (question){
    question.addEventListener("click", intercept, true);
    question.addEventListener("pointerup", intercept, true);
    question.addEventListener("keydown", function(e){
      if (e.key !== "Enter" && e.key !== " ") return;
      intercept(e);
    }, true);
  }

  /* ============ LOGIN FORM ============ */

  /* ⭐ v10.4: lưu/đọc/xoá credentials */
  function loadSavedCredentials(){
    try {
      const raw = localStorage.getItem(CRED_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      if (!obj.username || !obj.password) return null;
      return { username: String(obj.username), password: String(obj.password) };
    } catch (_) { return null; }
  }

  function saveCredentials(username, password){
    try {
      localStorage.setItem(CRED_KEY, JSON.stringify({
        username: String(username || ""),
        password: String(password || ""),
        savedAt: Date.now()
      }));
    } catch (_) {}
  }

  function clearCredentials(){
    try { localStorage.removeItem(CRED_KEY); } catch (_) {}
  }

  function openLoginForm(){
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    msgEl.textContent = "";
    msgEl.classList.remove("ok");
    /* ⭐ v10.4: tự điền credentials đã lưu */
    const saved = loadSavedCredentials();
    if (saved){
      if (!userInput.value) userInput.value = saved.username;
      if (!passInput.value) passInput.value = saved.password;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    } else {
      if (rememberCheckbox) rememberCheckbox.checked = false;
    }
    setTimeout(function(){
      if (userInput.value && passInput.value) passInput.focus();
      else userInput.focus();
    }, 60);
  }

  function closeLoginForm(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    userInput.value = "";
    passInput.value = "";
    msgEl.textContent = "";
    msgEl.classList.remove("ok");
  }

  function setMsg(text, ok){
    msgEl.textContent = text || "";
    msgEl.classList.toggle("ok", !!ok);
  }

  async function handleLoginSubmit(){
    if (submitting) return;
    const u = userInput.value.trim();
    const p = passInput.value;
    if (!u){ setMsg("Vui lòng nhập tên đăng nhập"); userInput.focus(); return; }
    if (!p){ setMsg("Vui lòng nhập mật khẩu"); passInput.focus(); return; }
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Đang đăng nhập…";
    setMsg("");
    try {
      await Auth.login(u, p);
      /* v10.3: không clear gì — role được đọc từ Auth metadata */
      /* ⭐ v10.4: lưu/xoá credentials theo checkbox */
      if (rememberCheckbox && rememberCheckbox.checked) {
        saveCredentials(u, p);
      } else {
        clearCredentials();
      }
      setMsg("Đăng nhập thành công ✓", true);
      setTimeout(closeLoginForm, 350);
    } catch(err){
      setMsg(err.message || "Đăng nhập thất bại");
      passInput.value = "";
      passInput.focus();
    } finally {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Đăng nhập";
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", closeLoginForm);
  overlay.addEventListener("click", function(e){
    if (e.target === overlay) closeLoginForm();
  });
  if (submitBtn) submitBtn.addEventListener("click", handleLoginSubmit);
  if (passInput) passInput.addEventListener("keydown", function(e){
    if (e.key === "Enter") handleLoginSubmit();
  });
  if (userInput) userInput.addEventListener("keydown", function(e){
    if (e.key === "Enter") passInput.focus();
  });

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && overlay.classList.contains("show")){
      e.preventDefault();
      e.stopImmediatePropagation();
      closeLoginForm();
    }
  }, true);

  /* ============ LOGOUT ============ */
  function updateLogoutBtn(){
    if (currentUser){
      if (logoutBtn) logoutBtn.hidden = false;
      if (logoutName) logoutName.textContent = currentUser.displayName || currentUser.username || "";
      if (avatarBtn) avatarBtn.hidden = false;
      if (appVersion) appVersion.style.display = "none";
    } else {
      if (logoutBtn) logoutBtn.hidden = true;
      if (logoutName) logoutName.textContent = "";
      if (avatarBtn) avatarBtn.hidden = true;
      if (appVersion) appVersion.style.display = "";
    }
  }

  async function handleLogout(){
    if (!confirm("Đăng xuất khỏi tài khoản?")) return;
    try { await Auth.logout(); } catch(_) {}
    /* v10.3: Clear AdminSession (no-op nhưng gọi cho sạch) */
    try {
      if (window.AdminSession && typeof window.AdminSession.clear === "function") {
        window.AdminSession.clear();
      }
    } catch(_) {}
    /* ⭐ v10.4: KHÔNG xoá credentials — để lần sau tự điền */
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  /* ⭐ v10.7: verify user còn tồn tại trong employees — force logout nếu bị xoá */
  let _userCheckInFlight = false;
  let _userCheckPassed = false;
  let _userCheckRetries = 0;
  const MAX_USER_CHECK_RETRIES = 3;

  async function verifyUserExists(user){
    if (!user || !user.displayName) return true;
    if (_userCheckPassed) return true;
    if (_userCheckInFlight) return true;

    const sb = window.__sb;
    if (!sb || !sb.rpc) {
      if (_userCheckRetries < MAX_USER_CHECK_RETRIES) {
        _userCheckRetries++;
        setTimeout(() => { verifyUserExists(user); }, 800);
      }
      return true;
    }

    _userCheckInFlight = true;
    try {
      const res = await sb.rpc('rpc_check_user_exists', { p_display_name: user.displayName });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true) {
        if (d.exists === false) {
          console.warn('[AUTH-UI] user không tồn tại trong employees → force logout');
          try { window.Toast?.show('Tài khoản đã bị xoá — tự động đăng xuất', { type: 'warning', duration: 4000 }); } catch(_) {}
          try { await Auth.logout(); } catch(_) {}
          _userCheckPassed = false;
          return false;
        }
        _userCheckPassed = true;
        _userCheckRetries = 0;
      }
    } catch(e) {
      console.warn('[AUTH-UI] verify user failed:', e?.message);
    } finally {
      _userCheckInFlight = false;
    }
    return true;
  }

  /* v10.3: Auth.onChange không clear gì cả */
  Auth.onChange(function(user){
    currentUser = user;
    updateLogoutBtn();

    // Reset verify flag khi user logout → login lại sẽ check lại
    if (!user) {
      _userCheckPassed = false;
      _userCheckRetries = 0;
    }

    // ⭐ v10.7: verify user còn tồn tại
    if (user && user.displayName && !_userCheckPassed) {
      setTimeout(() => { verifyUserExists(user); }, 500);
    }

    if (window.SRank && typeof window.SRank.rerenderLanding === "function"){
      try { window.SRank.rerenderLanding(); } catch(_) {}
    }
  });

  currentUser = Auth.getCurrentUser();
  updateLogoutBtn();

  // ⭐ v10.7: verify user khi boot
  if (currentUser && currentUser.displayName && !_userCheckPassed) {
    setTimeout(() => { verifyUserExists(currentUser); }, 1500);
  }

  if (window.SRank && typeof window.SRank.rerenderLanding === "function"){
    try { window.SRank.rerenderLanding(); } catch(_) {}
  }

  window.SRank.openLogin = openLoginForm;

  console.log("[AUTH-UI] ready ✓ v10.9 — role-based + remember me + morph + verify + shop");
})();