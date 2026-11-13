/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — DEBUG OVERLAY (hiển thị trực tiếp trên màn hình)
   - Nút debug nổi góc phải dưới
   - Bấm → hiện panel chẩn đoán
   - Không cần Console
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF_DEBUG_OVERLAY) return;
  window.__WF_DEBUG_OVERLAY = true;

  const MODULES = [
    'config','utils','css','state','api','modals',
    'tabForge','tabShop','tabQuest','tabPet','tabBoss',
    'tabArena','tabChat','battle','realtime','index',
  ];

  /* ═══════════════════════════════════════════════════════════════
     CHECK RESULT
     ═══════════════════════════════════════════════════════════════ */
  function checkAll(){
    const wf = window.__WF || {};
    const result = {
      namespace: !!window.__WF,
      modules: {},
      missing: [],
      broken: [],
      publicAPI: !!window.WeaponForge,
      indexAPI: !!window.__WF?.index,
      button: null,
      buttonBound: null,
      page: !!document.getElementById('weaponPage'),
      style: !!document.getElementById('wfStyles'),
      user: null,
      state: null,
      supabase: !!window.__sb,
      errors: [],
    };

    // Modules
    MODULES.forEach(m => {
      const mod = wf[m];
      if (!mod){
        result.modules[m] = 'MISSING';
        result.missing.push(m);
      } else if (typeof mod !== 'object' || Object.keys(mod).length === 0){
        result.modules[m] = 'EMPTY';
        result.broken.push(m);
      } else {
        result.modules[m] = 'OK';
      }
    });

    // Button
    const btn = document.getElementById('weaponBtn');
    result.button = !!btn;
    result.buttonBound = btn?.__wfBound === true;

    // User/state
    result.user = wf.state?.S?.user ? 'logged in' : 'NOT logged in';
    result.state = wf.state?.S?.state ? 'loaded' : 'null';

    return result;
  }

  /* ═══════════════════════════════════════════════════════════════
     PANEL HTML
     ═══════════════════════════════════════════════════════════════ */
  function buildPanel(){
    const old = document.getElementById('wfDebugPanel');
    if (old) old.remove();

    const r = checkAll();
    const okCount = MODULES.filter(m => r.modules[m] === 'OK').length;

    const overlay = document.createElement('div');
    overlay.id = 'wfDebugPanel';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      background:rgba(0,0,0,.85);
      display:flex;align-items:center;justify-content:center;
      padding:16px;font-family:ui-monospace,monospace;
    `;

    const row = (label, value, ok) => `
      <div style="display:flex;justify-content:space-between;padding:4px 8px;
        background:${ok === true ? '#14532d' : ok === false ? '#7f1d1d' : '#3f3f46'};
        border-radius:6px;font-size:11px;color:#fff;margin-bottom:3px;">
        <span>${label}</span>
        <b style="color:${ok === true ? '#86efac' : ok === false ? '#fca5a5' : '#fbbf24'};">${value}</b>
      </div>`;

    const moduleRows = MODULES.map(m => {
      const s = r.modules[m];
      return row(m, s, s === 'OK' ? true : s === 'MISSING' ? false : null);
    }).join('');

    overlay.innerHTML = `
      <div style="max-width:420px;width:100%;max-height:90vh;overflow-y:auto;
        background:#18181b;border:2px solid #f59e0b;border-radius:16px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="color:#f59e0b;font-weight:900;font-size:16px;">⚔️ WF DEBUG</div>
          <button id="wfDebugClose" style="background:#dc2626;color:#fff;border:0;
            border-radius:8px;padding:6px 12px;font-weight:900;font-size:12px;cursor:pointer;">✕ Đóng</button>
        </div>

        <div style="color:#fbbf24;font-weight:900;font-size:11px;margin-bottom:6px;">
          📊 MODULES (${okCount}/${MODULES.length} OK)
        </div>
        ${moduleRows}

        <div style="color:#fbbf24;font-weight:900;font-size:11px;margin:14px 0 6px;">
          🔍 CHECKS
        </div>
        ${row('window.__WF', r.namespace ? 'YES' : 'NO', r.namespace)}
        ${row('window.__WF.index', r.indexAPI ? 'YES' : 'NO', r.indexAPI)}
        ${row('window.WeaponForge', r.publicAPI ? 'YES' : 'NO', r.publicAPI)}
        ${row('#weaponBtn', r.button ? 'YES' : 'NO', r.button)}
        ${row('btn.__wfBound', r.buttonBound ? 'YES' : 'NO', r.buttonBound)}
        ${row('#weaponPage DOM', r.page ? 'YES' : 'NO', r.page)}
        ${row('#wfStyles CSS', r.style ? 'YES' : 'NO', r.style)}
        ${row('Supabase (__sb)', r.supabase ? 'YES' : 'NO', r.supabase)}
        ${row('User', r.user, r.user === 'logged in')}
        ${row('State', r.state, r.state === 'loaded')}

        <div style="color:#fbbf24;font-weight:900;font-size:11px;margin:14px 0 6px;">
          🧪 ACTIONS
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <button id="wfDebugOpen" style="background:#3b82f6;color:#fff;border:0;
            border-radius:8px;padding:10px;font-weight:900;font-size:11px;cursor:pointer;">
            🚀 Force open()
          </button>
          <button id="wfDebugClick" style="background:#8b5cf6;color:#fff;border:0;
            border-radius:8px;padding:10px;font-weight:900;font-size:11px;cursor:pointer;">
            👆 Click btn
          </button>
          <button id="wfDebugRefresh" style="background:#f59e0b;color:#fff;border:0;
            border-radius:8px;padding:10px;font-weight:900;font-size:11px;cursor:pointer;">
            🔄 Refresh
          </button>
          <button id="wfDebugClear" style="background:#dc2626;color:#fff;border:0;
            border-radius:8px;padding:10px;font-weight:900;font-size:11px;cursor:pointer;">
            🗑 Clear cache
          </button>
        </div>

        <div id="wfDebugLog" style="margin-top:12px;padding:8px;background:#000;
          border-radius:6px;color:#86efac;font-size:10px;font-family:monospace;
          max-height:120px;overflow-y:auto;white-space:pre-wrap;"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Log helper
    const logEl = overlay.querySelector('#wfDebugLog');
    window.__wfDebugLog = (msg, color) => {
      const line = document.createElement('div');
      line.style.color = color || '#86efac';
      line.textContent = '> ' + msg;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    };

    // Wire buttons
    overlay.querySelector('#wfDebugClose').onclick = () => overlay.remove();

    overlay.querySelector('#wfDebugOpen').onclick = async () => {
      window.__wfDebugLog('Gọi WeaponForge.open()...');
      try {
        if (window.WeaponForge?.open){
          await window.WeaponForge.open();
          window.__wfDebugLog('✅ open() OK', '#86efac');
        } else {
          window.__wfDebugLog('❌ WeaponForge.open không tồn tại', '#fca5a5');
        }
      } catch(e){
        window.__wfDebugLog('❌ Throw: ' + e.message, '#fca5a5');
        console.error(e);
      }
    };

    overlay.querySelector('#wfDebugClick').onclick = () => {
      window.__wfDebugLog('Tìm #weaponBtn...');
      const btn = document.getElementById('weaponBtn');
      if (!btn){
        window.__wfDebugLog('❌ Không có #weaponBtn', '#fca5a5');
        return;
      }
      window.__wfDebugLog('✅ Tìm thấy, dispatch click...');
      try {
        btn.click();
        window.__wfDebugLog('✅ Click dispatched', '#86efac');
      } catch(e){
        window.__wfDebugLog('❌ Click throw: ' + e.message, '#fca5a5');
      }
    };

    overlay.querySelector('#wfDebugRefresh').onclick = () => {
      overlay.remove();
      buildPanel();
    };

    overlay.querySelector('#wfDebugClear').onclick = () => {
      if (!confirm('Xóa toàn bộ localStorage của app?')) return;
      try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('__wf_') || k.startsWith('__srank'));
        keys.forEach(k => localStorage.removeItem(k));
        window.__wfDebugLog('✅ Đã xóa ' + keys.length + ' keys. Đang reload...', '#86efac');
        setTimeout(() => location.reload(), 800);
      } catch(e){
        window.__wfDebugLog('❌ ' + e.message, '#fca5a5');
      }
    };

    return overlay;
  }

  /* ═══════════════════════════════════════════════════════════════
     FLOATING DEBUG BUTTON
     ═══════════════════════════════════════════════════════════════ */
  function addFloatingButton(){
    if (document.getElementById('wfDebugFab')) return;

    const fab = document.createElement('button');
    fab.id = 'wfDebugFab';
    fab.type = 'button';
    fab.innerHTML = '🐞';
    fab.style.cssText = `
      position:fixed;bottom:16px;right:16px;z-index:99998;
      width:52px;height:52px;border-radius:50%;
      background:linear-gradient(135deg,#f59e0b,#dc2626);
      color:#fff;border:3px solid #fff;font-size:24px;
      box-shadow:0 4px 16px rgba(0,0,0,.4);
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      touch-action:manipulation;
    `;
    fab.onclick = () => buildPanel();
    document.body.appendChild(fab);
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO RUN
     ═══════════════════════════════════════════════════════════════ */
  function autoRun(){
    // Đợi mọi thứ load xong
    setTimeout(() => {
      addFloatingButton();

      // Auto log console
      const r = checkAll();
      console.group('%c⚔️ WF DEBUG',
        'background:#f59e0b;color:#fff;padding:4px 10px;border-radius:4px;font-weight:900');
      console.log('Missing modules:', r.missing);
      console.log('Broken modules:', r.broken);
      console.log('Button bound:', r.buttonBound);
      console.log('Index API:', r.indexAPI);
      console.log('Public API:', r.publicAPI);
      console.groupEnd();

      // Nếu có module missing → tự show panel
      if (r.missing.length > 0 || !r.indexAPI || !r.buttonBound){
        // Không auto-show, chỉ log
      }
    }, 3000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoRun, { once: true });
  } else {
    autoRun();
  }

  // Expose API
  window.__WF_DEBUG = {
    check: checkAll,
    panel: buildPanel,
  };

  console.log('[WF-DEBUG] ✓ Overlay debug đã sẵn sàng — nút 🐞 góc phải dưới');
})();