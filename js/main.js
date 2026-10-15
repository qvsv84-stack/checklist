/* ═══════════════════════════════════════════════════════════════
   MAIN.JS — CORE v4.0.1 🐱 (Orchestrator)
   ---------------------------------------------------------
   v4.0.1 — FIX boot race condition:
   - Nếu main.js load sau DOMContentLoaded (rare), đợi 1 tick
     (setTimeout 0) để 3 view modules kịp đăng ký callbacks
     trước khi boot() chạy renderLanding lần đầu.
   v4.0.0 — TASK 2 REFACTOR:
   - Tách 3 view modules:
       • js/landing.js        → renderLandingState, podium, resetHome
       • js/admin.js          → toàn bộ admin panel (4 tabs)
       • js/checklist-view.js → renderChecklist, checkin, notify
   - main.js giờ chỉ còn:
       • State ownership (names[], checked[], times[]...)
       • Expose window.SrankCore (state getters + helpers)
       • Wire callbacks từ views
       • Load data + auto-sync + boot
   - Load order: main.js → landing.js → admin.js → checklist-view.js
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const Store = window.Store;
  const AdminSession = window.AdminSession;
  const Toast = window.Toast;
  if (!Store || !AdminSession || !Toast) {
    console.error('[main] thiếu dependency: Store/AdminSession/Toast');
    return;
  }

  const TIMEOUT = Object.freeze({ FAST: 8000, NORMAL: 12000, SLOW: 20000, DEFAULT: 12000 });
  const CHECKLIST_LOCK_KEY = 'srank_checklist_lock_time_v1';
  const CHECKLIST_SYNC_MS = 30000;
  const AUTO_SYNC_MS = 15000;
  const USER_ACTION_PAUSE_MS = 5000;
  const SETTINGS_TTL = 300000;

  const $ = id => document.getElementById(id);

  /* ═══════════════════════════════════════════════════════
     1. DOM REFS
     ═══════════════════════════════════════════════════════ */
  const els = {
    space: $('space'),
    question: $('question'),
    hint: $('hint'),
    checklistPanel: $('checklistPanel'),
    checklistScroll: $('checklistScroll'),
    checklistBody: document.querySelector('#checklist tbody'),
    status: $('status'),
    syncBtn: $('syncBtn'),
    homeBtn: $('homeBtn'),
    checklistBtn: $('checklistBtn'),
    adminBtn: $('adminBtn'),
    captureBtn: $('captureBtn'),
    adminPage: $('adminPage'),
    adminPageBack: $('adminPageBack'),
    adminPageLogout: $('adminPageLogout'),
    adminChecklistSearch: $('adminChecklistSearch'),
    adminChecklistStats: $('adminChecklistStats'),
    adminStatTotal: $('adminStatTotal'),
    adminStatChecked: $('adminStatChecked'),
    adminStatUnchecked: $('adminStatUnchecked'),
    adminStatTop3: $('adminStatTop3'),
    adminTabs: [...document.querySelectorAll('.admin-tab')],
    adminViews: [...document.querySelectorAll('.admin-panel-view')],
    adminFilterBtns: [...document.querySelectorAll('.admin-filter-btn')],
    resetTimeInput: $('resetTimeInput'),
    checklistLockTimeInput: $('checklistLockTimeInput'),
    adminStatus: $('adminStatus'),
    adminSaveBtn: $('adminSaveBtn'),
    adminChecklistRows: $('adminChecklistRows'),
    adminNewUsername: $('adminNewUsername'),
    adminNewPassword: $('adminNewPassword'),
    adminNewDisplayName: $('adminNewDisplayName'),
    adminNewAttRow: $('adminNewAttRow'),
    adminCreateUserBtn: $('adminCreateUserBtn'),
    adminUsersStatus: $('adminUsersStatus'),
    adminUsersRows: $('adminUsersRows'),
    adminUsersSearch: $('adminUsersSearch')
  };

  /* ═══════════════════════════════════════════════════════
     2. STATE
     ═══════════════════════════════════════════════════════ */
  let names = [], checked = [], times = [], points = [], ranks = [];
  let stateDay = '';
  let _lastUserActionAt = 0;
  let _lastLockCheck = 0;
  let _cachedLocked = false;
  let settingsCache = null, settingsFetchedAt = 0, settingsFetchPromise = null;
  let syncInFlight = false;
  let autoSyncTimer = null, lastAutoSyncAt = 0;
  let resetTime = '00:00', resetTimer = null;
  let checklistLockTime = '21:00';
  let initialSheetLoaded = false;
  let _realtimeDebounceTimer = null;

  const _avatarCache = new Map();
  window.__avatarCache = _avatarCache;

  /* ═══════════════════════════════════════════════════════
     3. UTILS
     ═══════════════════════════════════════════════════════ */
  const todayKey = () => Store.todayKey();
  const hhmm = () => Store.nowHHMM();
  const isValid24hTime = v => Store.isValid24hTime(v);

  const escapeHtml = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const throttleRAF = fn => {
    let scheduled = false, lastArgs;
    return (...args) => {
      lastArgs = args;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; fn(...lastArgs); });
    };
  };

  const normalizeServerRank = (value, score) => {
    if (Store.normalizeServerRank) return Store.normalizeServerRank(value, score);
    const v = String(value || '').trim().toUpperCase();
    if (['VIP', 'SSS', 'SS', 'S', 'A', 'B'].includes(v)) return v;
    const s = Number(score) || 0;
    if (s >= 340) return 'SSS';
    if (s >= 240) return 'SS';
    if (s >= 180) return 'S';
    if (s >= 100) return 'A';
    return 'B';
  };
  window.attendanceRankClient = v => Store.rankClient ? Store.rankClient(v) : v;

  function getAvatarUrl(name) {
    try {
      const k = String(name || '').trim();
      if (!k) return '';
      return _avatarCache.get(k) || '';
    } catch (_) { return ''; }
  }
  window.getAvatarUrl = getAvatarUrl;

  async function loadAvatarsFromSupabase() {
    try {
      const sb = window.__sb;
      if (!sb || !sb.rpc) return false;
      const res = await sb.rpc('rpc_get_avatars');
      if (res.error) throw res.error;
      const d = res.data;
      if (!d || d.ok !== true) return false;
      const list = Array.isArray(d.data) ? d.data : [];
      _avatarCache.clear();
      list.forEach(it => {
        if (it && it.name && it.url) _avatarCache.set(String(it.name).trim(), String(it.url));
      });
      return list.length > 0;
    } catch (e) {
      console.warn('[AV] load failed', e && e.message);
      return false;
    }
  }
  window.__loadAvatarsFromSupabase = loadAvatarsFromSupabase;

  function bootstrapAvatars(retries) {
    if (retries == null) retries = 5;
    loadAvatarsFromSupabase().then((hasData) => {
      if (hasData){
        try { S.callbacks.renderLanding?.(true); } catch (_) {}
        try { S.callbacks.renderChecklist?.(true); } catch (_) {}
      } else if (retries > 0){
        setTimeout(() => bootstrapAvatars(retries - 1), 1500);
      }
    }).catch(() => {
      if (retries > 0) setTimeout(() => bootstrapAvatars(retries - 1), 1500);
    });
  }

  /* ═══════════════════════════════════════════════════════
     4. STATUS
     ═══════════════════════════════════════════════════════ */
  const ROUTINE_TOAST_PATTERNS = [
    /^Đã (cập nhật|đồng bộ|tải dữ liệu)/i,
    /^Đang (dùng|cập nhật|đồng bộ)/i,
    /^Máy chủ chưa xác nhận/i,
    /^Trình duyệt đang chặn/i,
    /^Đang lưu ảnh/i,
    /^Đã (mở chia sẻ|tạo ảnh)/i
  ];
  const isRoutineMessage = t => ROUTINE_TOAST_PATTERNS.some(re => re.test(t));
  const inferToastType = t => {
    if (t.includes('✓') || /thành công/i.test(t)) return 'success';
    if (t.includes('⚠') || /lỗi|thất bại/i.test(t)) return 'error';
    if (/^chưa|^không|mất kết nối|thử lại|đang chờ/i.test(t)) return 'warning';
    return 'info';
  };

  let _statusTimer = null;
  function setStatus(t) {
    const text = String(t || '').trim();
    if (els.status) {
      els.status.textContent = text;
      els.status.classList.add('show');
      clearTimeout(_statusTimer);
      _statusTimer = setTimeout(() => els.status.classList.remove('show'), 1400);
    }
    if (text && !isRoutineMessage(text)) Toast.show(text, { type: inferToastType(text) });
  }

  /* ═══════════════════════════════════════════════════════
     5. STATE WRITE HELPERS
     ═══════════════════════════════════════════════════════ */
  const _getStateForCache = () => ({ names, checked, times, points, ranks, day: todayKey() });
  const cacheSave = (immediate = false) => {
    if (immediate) Store.flushSave(_getStateForCache);
    else Store.scheduleSave(_getStateForCache);
  };
  function markFresh() {
    stateDay = todayKey();
    cacheSave();
  }
  function markUserAction() {
    _lastUserActionAt = Date.now();
  }
  window.addEventListener('beforeunload', () => Store.flushSave(_getStateForCache));

  function cacheLoad() {
    const x = Store.loadCache();
    if (!x) return false;
    names = x.names;
    checked = x.checked;
    times = x.times;
    points = x.points;
    ranks = x.ranks;
    stateDay = x.day;
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     6. SETTINGS
     ═══════════════════════════════════════════════════════ */
  async function getSettingsCached(force = false) {
    const now = Date.now();
    if (!force && settingsCache && now - settingsFetchedAt < SETTINGS_TTL) return settingsCache;
    if (settingsFetchPromise) return settingsFetchPromise;
    settingsFetchPromise = (async () => {
      try {
        const r = await window.__srankApi('getSettings', {}, TIMEOUT.FAST);
        if (!r.ok) throw new Error(r.error || 'Không tải được cài đặt');
        settingsCache = {
          resetTime: r.data.resetTime || '00:00',
          checklistLockTime: r.data.checklistLockTime || checklistLockTime
        };
        settingsFetchedAt = Date.now();
        return settingsCache;
      } finally {
        settingsFetchPromise = null;
      }
    })();
    return settingsFetchPromise;
  }

  function loadChecklistLockTime() {
    try {
      const saved = String(localStorage.getItem(CHECKLIST_LOCK_KEY) || '').trim();
      if (isValid24hTime(saved)) checklistLockTime = saved;
    } catch (_) {}
  }
  function saveChecklistLockTime(value) {
    checklistLockTime = String(value || '21:00').trim();
    try { localStorage.setItem(CHECKLIST_LOCK_KEY, checklistLockTime); } catch (_) {}
  }

  function checklistLockInfo() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
    const [lh, lm] = String(checklistLockTime || '21:00').split(':').map(Number);
    const lockMinutes = (Number.isFinite(lh) ? lh : 21) * 60 + (Number.isFinite(lm) ? lm : 0);
    return { locked: hour * 60 + minute >= lockMinutes, time: checklistLockTime };
  }
  const isChecklistLocked = () => checklistLockInfo().locked;

  /* ═══════════════════════════════════════════════════════
     7. RESET SCHEDULER + LOCAL STATE
     ═══════════════════════════════════════════════════════ */
  function scheduleNextReset() {
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    const now = new Date();
    const [hh, mm] = String(resetTime || '00:00').split(':').map(Number);
    const next = new Date(now);
    next.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 3, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    const rawDelay = next.getTime() - now.getTime();
    const delay = Math.max(1000, Math.min(rawDelay, 3600000));
    resetTimer = setTimeout(async function tick() {
      const now2 = new Date();
      const [hh2, mm2] = String(resetTime || '00:00').split(':').map(Number);
      const target = new Date(now2);
      target.setHours(Number.isFinite(hh2) ? hh2 : 0, Number.isFinite(mm2) ? mm2 : 0, 0, 0);
      if (now2.getTime() < target.getTime()) { scheduleNextReset(); return; }
      try {
        const didReset = resetLocalStateForNewDay('force');
        let serverOK = false;
        const token = AdminSession.get();
        if (token) {
          try {
            const r = await window.__srankApi('resetNow', { token }, TIMEOUT.FAST);
            serverOK = !!(r && r.ok);
          } catch (_) { serverOK = false; }
        }
        if (didReset || serverOK) setStatus('Checklist đã làm mới ✓');
        try { await loadData(false, true); } catch (_) {}
      } catch (e) {
        console.warn('[CL] reset error:', e);
        setStatus('Reset lỗi — sẽ thử lại');
      } finally {
        scheduleNextReset();
      }
    }, delay);
  }

  function resetLocalStateForNewDay(reason) {
    const oldDay = stateDay, newDay = todayKey();
    if (oldDay === newDay && reason !== 'force') return false;
    checked = names.map(() => false);
    times = names.map(() => '');
    stateDay = newDay;
    cacheSave(true);
    try { window.ChecklistView?._resetSignature?.(); } catch (_) {}
    try { S.callbacks.renderChecklist?.(true); } catch (_) {}
    try { S.callbacks.renderAdminChecklist?.(); } catch (_) {}
    try { S.callbacks.renderAdminStats?.(); } catch (_) {}
    if (!els.checklistPanel.classList.contains('show')) {
      try { S.callbacks.renderLanding?.(true); } catch (_) {}
    }
    console.log('[CL] Reset local:', oldDay, '→', newDay);
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     8. LOAD DATA — gọi smooth update từ ChecklistView
     ═══════════════════════════════════════════════════════ */
  async function loadData(showError = true, force = false) {
    if (syncInFlight) {
      if (force) setStatus('Đang đồng bộ, vui lòng chờ...');
      return false;
    }
    if (initialSheetLoaded && !force) {
      S.callbacks.renderChecklist?.();
      S.callbacks.renderAdminChecklist?.();
      return true;
    }

    syncInFlight = true;
    try {
      if (!names.length && cacheLoad()) {
        S.callbacks.renderChecklist?.();
      } else if (!names.length && els.checklistPanel.classList.contains('show')) {
        S.callbacks.renderChecklistSkeleton?.();
      }

      const r = await window.__srankApi('getData', { _ts: Date.now() }, TIMEOUT.SLOW);
      if (!r.ok) throw new Error(r.error || 'getData lỗi');

      const rawNames = Array.isArray(r.data?.names) ? r.data.names : [];
      const serverNames = rawNames.map(n => String(n ?? '').trim()).filter(n => n.length > 0 && n.length <= 100);
      const rawPoints = Array.isArray(r.data?.points) ? r.data.points : [];
      const serverPoints = serverNames.map((_, i) => {
        const p = Number(rawPoints[i]);
        return Number.isFinite(p) && p >= 0 && p <= 100000 ? p : 0;
      });
      const rawRanks = Array.isArray(r.data?.ranks) ? r.data.ranks : [];
      const serverRanks = serverNames.map((_, i) => normalizeServerRank(rawRanks[i], serverPoints[i]));
      const rawChecks = Array.isArray(r.data?.checks) ? r.data.checks : [];
      const serverChecks = serverNames.map((_, i) => rawChecks[i] === true);
      const rawTimes = Array.isArray(r.data?.times) ? r.data.times : [];
      const serverTimes = serverNames.map((_, i) => {
        const t = String(rawTimes[i] ?? '').trim();
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : '';
      });

      const canSmooth = initialSheetLoaded && !force
        && els.checklistPanel.classList.contains('show')
        && names.length > 0
        && typeof window.ChecklistView?.smoothUpdate === 'function';

      if (canSmooth) {
        const res = window.ChecklistView.smoothUpdate({
          names: serverNames, points: serverPoints,
          checked: serverChecks, times: serverTimes, ranks: serverRanks
        });
        if (res && res.ok) {
          lastAutoSyncAt = Date.now();
          window.syncAttendanceEmployees?.();
          cacheSave();
          setStatus('Đã cập nhật ✓');
          S.callbacks.maybeRenderLanding?.();
          return true;
        }
      }

      /* Full reload path */
      let newlyChecked = [];
      if (initialSheetLoaded && names.length > 0) {
        const prevNames = names.slice();
        const prevChecked = checked.slice();
        for (let i = 0; i < Math.min(prevNames.length, serverNames.length); i++) {
          if (prevNames[i] === serverNames[i] && !prevChecked[i] && serverChecks[i]) {
            newlyChecked.push({ name: prevNames[i], time: serverTimes[i] || '' });
          }
        }
      }

      const mergedChecks = serverChecks.slice();
      const mergedTimes = serverTimes.slice();
      const hasPending = window.ChecklistView?.hasPendingCheck || (() => false);
      if (initialSheetLoaded && names.length === serverNames.length) {
        for (let i = 0; i < names.length; i++) {
          if (names[i] === serverNames[i] && hasPending(names[i])) {
            mergedChecks[i] = checked[i] === true;
            mergedTimes[i] = times[i] || '';
          }
        }
      }

      names = serverNames;
      points = serverPoints;
      ranks = serverRanks;
      checked = mergedChecks;
      times = mergedTimes;
      stateDay = todayKey();
      initialSheetLoaded = true;
      lastAutoSyncAt = Date.now();
      window.syncAttendanceEmployees?.();
      cacheSave();
      S.callbacks.renderChecklist?.(true);
      if (els.adminPage.classList.contains('show')) S.callbacks.renderAdminChecklist?.();
      if (els.hint) els.hint.textContent = 'Chạm vào câu hỏi';
      setStatus(force ? 'Đã cập nhật ✓' : 'Đã đồng bộ ✓');
      S.callbacks.maybeRenderLanding?.();
      if (newlyChecked.length) window.ChecklistView?.notify?.(newlyChecked);
      return true;
    } catch (e) {
      if (showError && !names.length && els.hint) els.hint.textContent = 'Không tải được dữ liệu';
      if (names.length) setStatus('Đang dùng dữ liệu đã lưu');
      return false;
    } finally {
      syncInFlight = false;
    }
  }

  /* ═══════════════════════════════════════════════════════
     9. AUTO SYNC
     ═══════════════════════════════════════════════════════ */
  function restartAutoSync() {
    if (autoSyncTimer) { clearTimeout(autoSyncTimer); autoSyncTimer = null; }
    const interval = els.checklistPanel.classList.contains('show') ? CHECKLIST_SYNC_MS : AUTO_SYNC_MS;
    autoSyncTimer = setTimeout(async function tick() {
      const skip =
        document.hidden ||
        document.getElementById('attendancePage')?.classList.contains('show') ||
        Date.now() - _lastUserActionAt < USER_ACTION_PAUSE_MS ||
        syncInFlight;
      if (!skip) {
        lastAutoSyncAt = Date.now();
        try { await loadData(false, true); } catch (_) {}
      }
      if (autoSyncTimer !== null) autoSyncTimer = setTimeout(tick, interval);
    }, interval);
  }

  /* ═══════════════════════════════════════════════════════
     10. SYNC QUICK TOOLS
     ═══════════════════════════════════════════════════════ */
  function _syncQuickTools() {
    const otherOpen =
      els.checklistPanel.classList.contains('show') ||
      els.adminPage.classList.contains('show') ||
      document.getElementById('attendanceNameWheel')?.classList.contains('show') ||
      document.getElementById('attendancePage')?.classList.contains('show') ||
      document.getElementById('loginOverlay')?.classList.contains('show');
    document.body.classList.toggle('overlay-open', otherOpen);
  }
  const syncQuickTools = throttleRAF(_syncQuickTools);
  window.syncQuickTools = syncQuickTools;

  /* ═══════════════════════════════════════════════════════
     11. EXPOSE SrankCore — TRƯỚC KHI VIEWS LOAD
     ═══════════════════════════════════════════════════════ */
  const S = {
    // State getters (luôn fresh)
    get names()   { return names; },
    get checked() { return checked; },
    get times()   { return times; },
    get points()  { return points; },
    get ranks()   { return ranks; },

    // Writable settings
    get resetTime()         { return resetTime; },
    set resetTime(v)        { resetTime = v; },
    get checklistLockTime() { return checklistLockTime; },
    set checklistLockTime(v){ checklistLockTime = v; },
    get settingsCache()     { return settingsCache; },
    set settingsCache(v)    { settingsCache = v; },
    get settingsFetchedAt() { return settingsFetchedAt; },
    set settingsFetchedAt(v){ settingsFetchedAt = v; },

    // DOM
    els,

    // Helpers
    hhmm, todayKey, escapeHtml,
    getAvatarUrl, isChecklistLocked,
    isValid24hTime, normalizeServerRank, setStatus,
    saveChecklistLockTime, getSettingsCached, syncQuickTools,

    // Actions
    markFresh, markUserAction, scheduleNextReset, loadData,

    // Hooks (main.js wire)
    onAfterRenderLanding: null,
    onResetHome: null,
    onLockSettingsChanged: null,

    // Callbacks container (views tự đăng ký)
    callbacks: {}
  };
  window.SrankCore = S;

  /* Wire hooks */
  S.onAfterRenderLanding = () => {
    _lastLockCheck = Date.now();
    _cachedLocked = isChecklistLocked();
  };
  S.onResetHome = () => {
    restartAutoSync();
    syncQuickTools();
  };
  S.onLockSettingsChanged = () => {
    _lastLockCheck = 0;
    _cachedLocked = isChecklistLocked();
  };

  /* ═══════════════════════════════════════════════════════
     12. CAPTURE CHECKLIST
     ═══════════════════════════════════════════════════════ */
  let html2canvasPromise = null;
  function ensureHtml2Canvas() {
    if (typeof html2canvas === 'function') return Promise.resolve();
    if (html2canvasPromise) return html2canvasPromise;
    html2canvasPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Không tải được công cụ chụp'));
      document.head.appendChild(s);
    });
    return html2canvasPromise;
  }

  function showCapturePreview(imageUrl, blob, previewTitle = '📸 Checklist đã chụp', filename = 'checklist-dao-meo.png', previewHint = 'Chrome / Cốc Cốc: bấm Lưu ảnh hoặc nhấn giữ vào ảnh để lưu.') {
    document.getElementById('capturePreview')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'capturePreview';
    overlay.innerHTML = `<div class="capturePreviewBox"><div class="capturePreviewTitle"></div><div class="capturePreviewImageWrap"><img id="capturePreviewImage" src="${imageUrl}" alt="Checklist"></div><div class="capturePreviewHint"></div><div class="capturePreviewActions"><button type="button" id="captureShareBtn">↗ Chia sẻ</button><a id="captureDownloadBtn" href="${imageUrl}" download="checklist-dao-meo.png">↓ Lưu ảnh</a><button type="button" id="captureCloseBtn">Đóng</button></div></div>`;
    overlay.querySelector('.capturePreviewTitle').textContent = previewTitle;
    overlay.querySelector('.capturePreviewHint').textContent = previewHint;
    overlay.querySelector('#captureDownloadBtn').download = filename;
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
      try { URL.revokeObjectURL(imageUrl); } catch (_) {}
    };
    overlay.querySelector('#captureCloseBtn').addEventListener('click', cleanup);
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(); });
    overlay.querySelector('#captureDownloadBtn').addEventListener('click', () => setStatus('Đang lưu ảnh…'));
    overlay.querySelector('#captureShareBtn').addEventListener('click', async () => {
      const btn = overlay.querySelector('#captureShareBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Đang mở…';
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          await navigator.share({ files: [file], title: 'Checklist Đảo Mèo', text: 'Checklist nhiệm vụ' });
          setStatus('Đã mở chia sẻ ✓');
        } else {
          setStatus('Trình duyệt chưa hỗ trợ chia sẻ file. Hãy bấm Lưu ảnh.');
        }
      } catch (err) {
        if (String(err?.name || '') !== 'AbortError') {
          console.error(err);
          setStatus('Không thể mở chia sẻ');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = '↗ Chia sẻ';
      }
    });
  }

  async function captureChecklist() {
    if (!els.checklistPanel.classList.contains('show')) return;
    els.captureBtn.disabled = true;
    const oldText = els.captureBtn.textContent;
    els.captureBtn.textContent = '⏳ Đang tải công cụ…';
    try { await ensureHtml2Canvas(); }
    catch (e) {
      setStatus(e.message);
      els.captureBtn.disabled = false;
      els.captureBtn.textContent = oldText;
      return;
    }
    els.captureBtn.textContent = '⏳ Đang tạo ảnh…';

    const clone = els.checklistPanel.cloneNode(true);
    clone.id = 'checklistCaptureTemp';
    clone.querySelector('#checklistActions')?.remove();
    clone.style.cssText = `position:absolute!important;left:-100000px!important;top:0!important;width:${Math.min(window.innerWidth * 0.9, 460)}px!important;max-height:none!important;height:auto!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:none!important;background:linear-gradient(145deg,#ffffff,#f4faf3 55%,#edf6eb)!important;padding:22px!important;border-radius:26px!important;border:1px solid #cbdcc9!important;box-shadow:0 16px 45px rgba(53,91,61,.12)!important;overflow:visible!important;`;
    const scroll = clone.querySelector('#checklistScroll');
    if (scroll) {
      scroll.style.maxHeight = 'none';
      scroll.style.height = 'auto';
      scroll.style.overflow = 'visible';
    }
    document.body.appendChild(clone);

    let imageUrl = null;
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
        useCORS: true, allowTaint: false, logging: false, imageTimeout: 10000,
        width: clone.offsetWidth, height: clone.scrollHeight,
        windowWidth: clone.offsetWidth, windowHeight: clone.scrollHeight
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
      if (!blob) throw new Error('Không tạo được ảnh');
      imageUrl = URL.createObjectURL(blob);
      showCapturePreview(imageUrl, blob);
      setStatus('Đã tạo ảnh checklist ✓');
    } catch (err) {
      console.error(err);
      setStatus('Chụp checklist thất bại');
      if (imageUrl) { URL.revokeObjectURL(imageUrl); imageUrl = null; }
    } finally {
      clone.remove();
      els.captureBtn.disabled = false;
      els.captureBtn.textContent = oldText;
    }
  }
  els.captureBtn?.addEventListener('click', captureChecklist);

  /* ═══════════════════════════════════════════════════════
     13. ADMIN LONG-PRESS RENAME
     ═══════════════════════════════════════════════════════ */
  const LP_DURATION = 600;
  const LP_MOVE_THRESHOLD = 12;
  let _lpTimer = null, _lpStartX = 0, _lpStartY = 0, _lpTarget = '';

  function _cancelLongPress() {
    if (_lpTimer) { clearTimeout(_lpTimer); _lpTimer = null; }
    _lpTarget = '';
  }

  async function adminRenamePrompt(name) {
    const rawName = String(name || '').trim();
    if (!rawName) return;
    const cur = (window.DN ? window.DN(rawName) : rawName) || rawName;
    const next = prompt(
      `Đổi tên hiển thị cho "${rawName}"\n(hiện tại: "${cur}")\n\nTối đa 40 ký tự:`,
      cur === rawName ? '' : cur
    );
    if (next === null) return;
    const val = String(next).trim();
    if (!val) { setStatus('Tên không được rỗng'); return; }
    if (val === cur) return;

    const token = AdminSession.get();
    if (!token) { setStatus('Bạn không có quyền admin'); return; }
    const sb = window.__sb;
    if (!sb || !sb.rpc) { setStatus('Chưa kết nối máy chủ'); return; }

    try {
      setStatus('Đang lưu…');
      const res = await sb.rpc('rpc_admin_set_profile', { p_token: token, p_name: rawName, p_display: val });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || 'Không lưu được');

      try {
        if (window.DisplayName && window.DisplayName.map) {
          window.DisplayName.map.set(rawName, val);
          try {
            const raw = localStorage.getItem('srank_display_names_v1');
            const obj = raw ? JSON.parse(raw) : {};
            obj[rawName] = val;
            localStorage.setItem('srank_display_names_v1', JSON.stringify(obj));
          } catch (_) {}
        }
      } catch (_) {}

      try { window.dispatchEvent(new CustomEvent('displayNameUpdated')); } catch (_) {}
      setStatus(`Đã đổi thành "${val}" ✓`);
      try { Toast.show(`Đổi tên: ${rawName} → ${val}`, { type: 'success', duration: 3000 }); } catch (_) {}
    } catch (e) {
      const msg = String(e?.message || e || 'Lỗi');
      setStatus('Lỗi: ' + msg);
      try { Toast.show('Lỗi đổi tên: ' + msg, { type: 'error', duration: 4000 }); } catch (_) {}
    }
  }

  els.question?.addEventListener('pointerdown', e => {
    if (!AdminSession.isValid()) return;
    const card = e.target?.closest?.('[data-name]');
    if (!card) return;
    _lpStartX = e.clientX;
    _lpStartY = e.clientY;
    _lpTarget = card.dataset.name || '';
    if (!_lpTarget) return;
    if (_lpTimer) clearTimeout(_lpTimer);
    _lpTimer = setTimeout(() => {
      _lpTimer = null;
      const n = _lpTarget;
      _lpTarget = '';
      if (n) {
        try { navigator.vibrate?.(30); } catch (_) {}
        adminRenamePrompt(n);
      }
    }, LP_DURATION);
  });

  els.question?.addEventListener('pointermove', e => {
    if (!_lpTimer) return;
    const dx = Math.abs(e.clientX - _lpStartX);
    const dy = Math.abs(e.clientY - _lpStartY);
    if (dx > LP_MOVE_THRESHOLD || dy > LP_MOVE_THRESHOLD) _cancelLongPress();
  });

  els.question?.addEventListener('pointerup', _cancelLongPress);
  els.question?.addEventListener('pointercancel', _cancelLongPress);
  els.question?.addEventListener('pointerleave', _cancelLongPress);
  els.question?.addEventListener('contextmenu', e => {
    if (!AdminSession.isValid()) return;
    const card = e.target?.closest?.('[data-name]');
    if (card) e.preventDefault();
  });

  /* ═══════════════════════════════════════════════════════
     14. EVENT LISTENERS — main buttons
     ═══════════════════════════════════════════════════════ */
  els.homeBtn?.addEventListener('click', () => {
    S.callbacks.resetHome?.();
    syncQuickTools();
    if (syncInFlight || !initialSheetLoaded) return;
    if (Date.now() - _lastUserActionAt < USER_ACTION_PAUSE_MS) return;
    if (Date.now() - lastAutoSyncAt < 3000) return;
    lastAutoSyncAt = Date.now();
    loadData(false, true);
  });

  els.syncBtn?.addEventListener('click', () => {
    lastAutoSyncAt = Date.now();
    loadData(true, true);
  });

  els.adminBtn?.addEventListener('click', () => {
    if (AdminSession.isValid()) S.callbacks.openAdmin?.();
    else setStatus('Bạn không có quyền admin');
  });
  els.adminPageBack?.addEventListener('click', () => S.callbacks.closeAdmin?.());
  els.adminPageLogout?.addEventListener('click', () => {
    if (confirm('Đăng xuất khỏi Admin?')) {
      AdminSession.clear();
      S.callbacks.closeAdmin?.();
      setStatus('Đã đăng xuất admin');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const capturePreview = document.getElementById('capturePreview');
    if (capturePreview) { capturePreview.remove(); e.preventDefault(); return; }
    if (els.checklistPanel.classList.contains('show')) { window.__clV6?.close?.(); e.preventDefault(); return; }
    if (els.adminPage.classList.contains('show')) { S.callbacks.closeAdmin?.(); e.preventDefault(); return; }
    const attendanceNameWheel = document.getElementById('attendanceNameWheel');
    if (attendanceNameWheel && attendanceNameWheel.classList.contains('show')) {
      attendanceNameWheel.classList.remove('show');
      attendanceNameWheel.setAttribute('aria-hidden', 'true');
      syncQuickTools(); e.preventDefault(); return;
    }
    const attendanceStatusOverlay = document.getElementById('attendanceStatusOverlay');
    if (attendanceStatusOverlay && attendanceStatusOverlay.classList.contains('show')) {
      attendanceStatusOverlay.classList.remove('show');
      attendanceStatusOverlay.setAttribute('aria-hidden', 'true');
      e.preventDefault(); return;
    }
    const attendancePage = document.getElementById('attendancePage');
    if (attendancePage && attendancePage.classList.contains('show')) {
      if (typeof window.__closeAttendancePage === 'function') window.__closeAttendancePage();
      else attendancePage.classList.remove('show');
      syncQuickTools(); e.preventDefault(); return;
    }
  });

  function onVisible() {
    if (document.hidden) return;
    if (stateDay && stateDay !== todayKey()) {
      resetLocalStateForNewDay('visibility');
      scheduleNextReset();
    }
    _lastLockCheck = 0;
    if (syncInFlight || !initialSheetLoaded) return;
    if (Date.now() - _lastUserActionAt < USER_ACTION_PAUSE_MS) return;
    if (Date.now() - lastAutoSyncAt < 3000) return;
    lastAutoSyncAt = Date.now();
    loadData(false, true);
  }
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);

  window.addEventListener('sb:score:changed', () => {
    if (_realtimeDebounceTimer) return;
    _realtimeDebounceTimer = setTimeout(() => {
      _realtimeDebounceTimer = null;
      if (syncInFlight) return;
      if (document.hidden) return;
      if (Date.now() - _lastUserActionAt < USER_ACTION_PAUSE_MS) return;
      lastAutoSyncAt = Date.now();
      loadData(false, true);
    }, 300);
  });

  /* ═══════════════════════════════════════════════════════
     15. PUBLIC API — backward compat
     ═══════════════════════════════════════════════════════ */
  window.__getChecklistNames = () => Array.isArray(names) ? names.slice() : [];
  window.__getChecklistState = () => ({
    names: Array.isArray(names) ? names.slice() : [],
    checked: Array.isArray(checked) ? checked.slice() : [],
    times: Array.isArray(times) ? times.slice() : []
  });

  window.__clearCheckinForName = async function (name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return false;
    const idx = names.indexOf(cleanName);
    if (idx < 0) return false;
    if (!checked[idx] && !times[idx]) return true;

    const prevChecked = checked[idx];
    const prevTime = times[idx];
    checked[idx] = false;
    times[idx] = '';
    stateDay = todayKey();
    cacheSave();
    S.callbacks.renderChecklist?.(true);
    if (!els.checklistPanel.classList.contains('show')) S.callbacks.renderLanding?.();

    try {
      const token = AdminSession.get();
      if (!token) throw new Error('Không có quyền admin');
      const r = await window.__srankApi('adminSetCheck', { token, name: cleanName, checked: 'false' }, TIMEOUT.FAST);
      if (!r.ok) throw new Error(r.error || 'Không xoá được checkin');
      if (r.data && Number.isFinite(Number(r.data.points))) {
        points[idx] = Number(r.data.points);
        ranks[idx] = normalizeServerRank(r.data.rank, points[idx]);
      }
      return true;
    } catch (e) {
      checked[idx] = prevChecked;
      times[idx] = prevTime;
      cacheSave();
      S.callbacks.renderChecklist?.(true);
      if (!els.checklistPanel.classList.contains('show')) S.callbacks.renderLanding?.();
      throw e;
    }
  };

  window.SRank = window.SRank || {};
  Object.assign(window.SRank, {
    api: window.__srankApi,
    rankClient: v => Store.rankClient ? Store.rankClient(v) : v,
    normalizeServerRank,
    setStatus,
    ensureHtml2Canvas,
    showCapturePreview,
    syncQuickTools,
    getAvatarUrl,
    onTopOpen: () => { try { S.callbacks.closeAdmin?.(); } catch (_) {} window.__clV6?.close?.(); },
    requestCheckin: n => {
      const i = names.indexOf(n);
      if (i < 0) return Promise.reject(new Error('Không tìm thấy ' + n));
      if (!S.callbacks.checkin) return Promise.reject(new Error('ChecklistView chưa ready'));
      return S.callbacks.checkin(n, i);
    },
    rerenderLanding: () => S.callbacks.renderLanding?.(),
    getCurrentState: () => ({
      names: names.slice(),
      checked: checked.slice(),
      times: times.slice()
    }),
    avatar: {
      setCache: (name, url) => {
        try {
          const k = String(name || '').trim();
          if (!k) return;
          _avatarCache.set(k, String(url || ''));
          try { S.callbacks.renderLanding?.(true); } catch (_) {}
          try { S.callbacks.renderChecklist?.(true); } catch (_) {}
        } catch (_) {}
      },
      getCache: (name) => {
        try {
          const k = String(name || '').trim();
          return k ? (_avatarCache.get(k) || '') : '';
        } catch (_) { return ''; }
      },
      reload: loadAvatarsFromSupabase
    }
  });

  /* ═══════════════════════════════════════════════════════
     16. BOOT — đợi DOMContentLoaded để views kịp đăng ký
     ═══════════════════════════════════════════════════════ */
  function boot() {
    loadChecklistLockTime();
    if (els.checklistLockTimeInput) els.checklistLockTimeInput.value = checklistLockTime;

    try {
      if (window.SRank?.Auth?.onChange) {
        window.SRank.Auth.onChange(() => {
          loadAvatarsFromSupabase().then((hasData) => {
            if (hasData){
              try { S.callbacks.renderLanding?.(true); } catch (_) {}
              try { S.callbacks.renderChecklist?.(true); } catch (_) {}
            }
          }).catch(() => {});
        });
      }
    } catch (_) {}

    bootstrapAvatars(5);

    let _loadDataPromise = null;
    if (cacheLoad()) {
      initialSheetLoaded = true;
      S.callbacks.renderChecklist?.(true);
      if (els.hint) els.hint.textContent = names.length ? 'Chạm vào câu hỏi' : 'Đang tải dữ liệu…';
      setStatus('Đã tải dữ liệu lưu ✓');
      _loadDataPromise = loadData(false, true);
    } else {
      _loadDataPromise = loadData(true);
    }
    S.callbacks.renderLanding?.();

    (async () => {
      try {
        await _loadDataPromise;
        const s = await getSettingsCached(false);
        if (isValid24hTime(s.resetTime)) resetTime = s.resetTime;
        if (isValid24hTime(s.checklistLockTime)) {
          checklistLockTime = s.checklistLockTime;
          saveChecklistLockTime(checklistLockTime);
          if (els.checklistLockTimeInput) els.checklistLockTimeInput.value = checklistLockTime;
        }
        S.callbacks.renderLanding?.();
      } catch (_) {}
    })();

    scheduleNextReset();
    _cachedLocked = isChecklistLocked();

    setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - _lastLockCheck > 30000) {
        _lastLockCheck = now;
        const nextLocked = isChecklistLocked();
        const lockChanged = nextLocked !== _cachedLocked;
        _cachedLocked = nextLocked;
        if (lockChanged && !els.checklistPanel.classList.contains('show')) {
          S.callbacks.renderLanding?.();
        }
      }
      if (!els.checklistPanel.classList.contains('show')) {
        if (_cachedLocked) {
          if (els.hint && els.hint.textContent !== '') els.hint.textContent = '';
        } else if (names.length && els.hint && els.hint.textContent !== 'Chạm vào câu hỏi') {
          els.hint.textContent = 'Chạm vào câu hỏi';
        }
      }
    }, 1000);

    restartAutoSync();

    window.addEventListener('displayNameUpdated', () => {
      try { S.callbacks.renderLanding?.(true); } catch (_) {}
      try { S.callbacks.renderChecklist?.(true); } catch (_) {}
      try { S.callbacks.renderAdminChecklist?.(); } catch (_) {}
      try { S.callbacks.renderAdminStats?.(); } catch (_) {}
    });

    window.addEventListener('avatarUpdated', () => {
      loadAvatarsFromSupabase().then(() => {
        try { S.callbacks.renderLanding?.(true); } catch (_) {}
        try { S.callbacks.renderChecklist?.(true); } catch (_) {}
      }).catch(() => {});
    });

    console.log('[main] ready ✓ v4.0.1 (orchestrator, 3 view modules, race-safe)');
  }

  // ✅ v4.0.1: FIX boot race condition
  // - Normal case: main.js chạy khi readyState = 'interactive'
  //   → đợi DOMContentLoaded (tất cả defer scripts đã chạy xong)
  // - Edge case: main.js chạy khi readyState = 'complete' (load từ cache nhanh,
  //   hoặc script inject muộn) → DOMContentLoaded đã fire rồi
  //   → cần setTimeout(0) để 3 view modules (defer, chạy ngay sau main.js)
  //     kịp đăng ký callbacks trước khi boot() gọi renderLanding lần đầu.
  if (document.readyState === 'complete') {
    setTimeout(boot, 0);
  } else {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  }
})();
