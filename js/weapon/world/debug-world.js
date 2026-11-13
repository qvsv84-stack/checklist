/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — DEBUG TOOL (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Debug panel hiển thị trực tiếp trên mobile.
   - Nút 🐛 góc phải dưới, chỉ hiện khi vào tab World
   - Bấm → full state: Phaser, container, canvas, scene, camera
   - Auto refresh mỗi 1s
   - Copy to clipboard toàn bộ report
   - Bắt lỗi + logs từ lúc load page
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WFDebugTool) return;
  window.__WFDebugTool = { ready: false };

  /* ═══════════════════════════════════════════════════════════════
     COLLECT LOGS + ERRORS TỪ SỚM
     ═══════════════════════════════════════════════════════════════ */
  const LOGS = [];
  const ERRORS = [];
  const MAX_LOGS = 300;

  const _origLog = console.log;
  const _origWarn = console.warn;
  const _origError = console.error;

  function pushLog(level, args){
    try {
      const text = args.map(a => {
        if (a == null) return String(a);
        if (typeof a === 'object') {
          try { return JSON.stringify(a); } catch(_){ return '[object]'; }
        }
        return String(a);
      }).join(' ');
      LOGS.push({ t: Date.now(), level, text: text.slice(0, 600) });
      if (LOGS.length > MAX_LOGS) LOGS.shift();
    } catch(_){}
  }

  console.log = function(){ pushLog('log', [].slice.call(arguments)); _origLog.apply(console, arguments); };
  console.warn = function(){ pushLog('warn', [].slice.call(arguments)); _origWarn.apply(console, arguments); };
  console.error = function(){ pushLog('error', [].slice.call(arguments)); _origError.apply(console, arguments); };

  window.addEventListener('error', function(e){
    ERRORS.push({
      t: Date.now(),
      msg: e.message || '(empty)',
      file: (e.filename || '').split('/').pop(),
      line: e.lineno || 0,
    });
  }, true);

  window.addEventListener('unhandledrejection', function(e){
    ERRORS.push({
      t: Date.now(),
      msg: String((e.reason && e.reason.message) || e.reason || '(unhandled)'),
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     SNAPSHOT
     ═══════════════════════════════════════════════════════════════ */
  function snapshot(){
    const wf = window.__WF || {};
    const world = wf.world;
    const game = world && typeof world.getGame === 'function' ? world.getGame() : null;
    const canvas = game && game.canvas ? game.canvas : null;
    const townScene = game && game.scene ? (function(){ try { return game.scene.getScene('Town'); } catch(_){ return null; } })() : null;
    const cam = townScene && townScene.cameras ? townScene.cameras.main : null;

    const mountEl = document.getElementById('wfWorldMount');
    const wrapEl = document.getElementById('wfWorldWrap');

    let canvasStyle = null;
    try { canvasStyle = canvas ? getComputedStyle(canvas) : null; } catch(_){}

    return {
      time: new Date().toISOString(),
      viewport: window.innerWidth + '×' + window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      phaser: {
        loaded: !!window.Phaser,
        version: window.Phaser && window.Phaser.VERSION ? window.Phaser.VERSION : '—',
      },
      modules: {
        world: !!wf.world,
        tileset: !!wf.tileset,
        joystick: !!wf.joystick,
        worldUI: !!wf.worldUI,
        player: !!wf.player,
        npc: !!wf.npc,
        multiplayer: !!wf.multiplayer,
        sceneTown: !!wf.sceneTown,
        tabWorld: !!wf.tabWorld,
        index: !!wf.index,
      },
      container: {
        wrapExists: !!wrapEl,
        wrapSize: wrapEl ? (wrapEl.clientWidth + '×' + wrapEl.clientHeight) : '—',
        mountExists: !!mountEl,
        mountSize: mountEl ? (mountEl.clientWidth + '×' + mountEl.clientHeight) : '—',
      },
      game: {
        exists: !!game,
        isReady: world && typeof world.isReady === 'function' ? world.isReady() : false,
        canvasExists: !!canvas,
        canvasW: canvas ? canvas.width : '—',
        canvasH: canvas ? canvas.height : '—',
        canvasStyleW: canvasStyle ? canvasStyle.width : '—',
        canvasStyleH: canvasStyle ? canvasStyle.height : '—',
        canvasDisplay: canvasStyle ? canvasStyle.display : '—',
        canvasVisibility: canvasStyle ? canvasStyle.visibility : '—',
        canvasOpacity: canvasStyle ? canvasStyle.opacity : '—',
      },
      scene: {
        key: townScene && townScene.scene ? townScene.scene.key : '—',
        isActive: townScene && townScene.scene && townScene.scene.isActive ? townScene.scene.isActive() : '—',
        isPaused: townScene && townScene.scene && townScene.scene.isPaused ? townScene.scene.isPaused() : '—',
        isSleeping: townScene && townScene.scene && townScene.scene.isSleeping ? townScene.scene.isSleeping() : '—',
        childrenCount: townScene && townScene.children ? townScene.children.length : 0,
        displayListCount: townScene && townScene.sys && townScene.sys.displayList ? townScene.sys.displayList.length : 0,
      },
      camera: {
        scrollX: cam ? cam.scrollX : '—',
        scrollY: cam ? cam.scrollY : '—',
        width: cam ? cam.width : '—',
        height: cam ? cam.height : '—',
        zoom: cam ? cam.zoom : '—',
        alpha: cam ? cam.alpha : '—',
        visible: cam ? cam.visible : '—',
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     FORMAT REPORT
     ═══════════════════════════════════════════════════════════════ */
  function fmtTime(ts){
    const d = new Date(ts);
    return String(d.getHours()).padStart(2,'0') + ':' +
           String(d.getMinutes()).padStart(2,'0') + ':' +
           String(d.getSeconds()).padStart(2,'0');
  }

  function formatReport(){
    const s = snapshot();
    const L = [];

    L.push('════════════════════════════════════════════');
    L.push('  WORLD DEBUG REPORT');
    L.push('════════════════════════════════════════════');
    L.push('Time:     ' + s.time);
    L.push('Viewport: ' + s.viewport + ' @' + s.dpr + 'x');
    L.push('UA:       ' + navigator.userAgent);
    L.push('URL:      ' + location.href);
    L.push('');

    L.push('─── PHASER ─────────────────────────────');
    L.push('  ' + (s.phaser.loaded ? '✅' : '❌') + ' Loaded: ' + s.phaser.loaded);
    L.push('  Version: ' + s.phaser.version);
    L.push('');

    L.push('─── MODULES ────────────────────────────');
    Object.keys(s.modules).forEach(function(k){
      L.push('  ' + (s.modules[k] ? '✅' : '❌') + ' ' + k);
    });
    L.push('');

    L.push('─── CONTAINER ──────────────────────────');
    L.push('  ' + (s.container.wrapExists ? '✅' : '❌') + ' #wfWorldWrap  ' + s.container.wrapSize);
    L.push('  ' + (s.container.mountExists ? '✅' : '❌') + ' #wfWorldMount ' + s.container.mountSize);
    L.push('');

    L.push('─── GAME ───────────────────────────────');
    L.push('  ' + (s.game.exists ? '✅' : '❌') + ' Instance');
    L.push('  isReady():        ' + s.game.isReady);
    L.push('  ' + (s.game.canvasExists ? '✅' : '❌') + ' Canvas');
    L.push('  Canvas W×H:       ' + s.game.canvasW + '×' + s.game.canvasH);
    L.push('  Style W×H:        ' + s.game.canvasStyleW + ' × ' + s.game.canvasStyleH);
    L.push('  Display:          ' + s.game.canvasDisplay);
    L.push('  Visibility:       ' + s.game.canvasVisibility);
    L.push('  Opacity:          ' + s.game.canvasOpacity);
    L.push('');

    L.push('─── SCENE ──────────────────────────────');
    L.push('  Key:              ' + s.scene.key);
    L.push('  isActive:         ' + s.scene.isActive);
    L.push('  isPaused:         ' + s.scene.isPaused);
    L.push('  isSleeping:       ' + s.scene.isSleeping);
    L.push('  Children:         ' + s.scene.childrenCount);
    L.push('  DisplayList:      ' + s.scene.displayListCount);
    L.push('');

    L.push('─── CAMERA ─────────────────────────────');
    L.push('  scrollX:  ' + s.camera.scrollX);
    L.push('  scrollY:  ' + s.camera.scrollY);
    L.push('  width:    ' + s.camera.width);
    L.push('  height:   ' + s.camera.height);
    L.push('  zoom:     ' + s.camera.zoom);
    L.push('  alpha:    ' + s.camera.alpha);
    L.push('  visible:  ' + s.camera.visible);
    L.push('');

    L.push('─── ERRORS (' + ERRORS.length + ') ───────────────────');
    if (!ERRORS.length) {
      L.push('  (không có)');
    } else {
      ERRORS.slice(-25).forEach(function(e, i){
        L.push('  [' + (i+1) + '] ' + fmtTime(e.t) +
               (e.file ? ' ' + e.file + ':' + e.line : '') +
               ' — ' + e.msg);
      });
    }
    L.push('');

    L.push('─── LOGS (' + LOGS.length + ') ───────────────────');
    if (!LOGS.length) {
      L.push('  (không có)');
    } else {
      LOGS.slice(-50).forEach(function(l){
        L.push('  [' + fmtTime(l.t) + '] [' + l.level + '] ' + l.text);
      });
    }
    L.push('');

    L.push('════════════════════════════════════════════');
    return L.join('\n');
  }

  /* ═══════════════════════════════════════════════════════════════
     UI: BUTTON + PANEL
     ═══════════════════════════════════════════════════════════════ */
  let _btn = null;
  let _panel = null;
  let _textEl = null;
  let _refreshTimer = null;

  function buildUI(){
    if (!_btn){
      _btn = document.createElement('button');
      _btn.id = '__wfDbgBtn';
      _btn.type = 'button';
      _btn.textContent = '🐛';
      _btn.setAttribute('aria-label', 'Mở debug');
      _btn.style.cssText = [
        'position:fixed',
        'bottom:calc(70px + env(safe-area-inset-bottom,0px))',
        'right:12px',
        'z-index:99999',
        'width:48px',
        'height:48px',
        'border-radius:50%',
        'background:linear-gradient(135deg,#dc2626,#991b1b)',
        'color:#fff',
        'border:2px solid #fff',
        'font-size:22px',
        'font-weight:900',
        'cursor:pointer',
        'box-shadow:0 4px 12px rgba(0,0,0,.5)',
        'display:none',
        'padding:0',
        'line-height:1',
      ].join(';');
      _btn.addEventListener('click', openPanel);
      document.body.appendChild(_btn);
    }

    if (!_panel){
      _panel = document.createElement('div');
      _panel.id = '__wfDbgPanel';
      _panel.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:100000',
        'background:rgba(5,10,8,.97)',
        'color:#fff',
        'display:none',
        'flex-direction:column',
        'font-family:ui-monospace,Menlo,Monaco,monospace',
      ].join(';');
      _panel.innerHTML = [
        '<div style="flex:0 0 auto;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px));background:#1a1a1a;border-bottom:1px solid #333;display:flex;gap:6px;align-items:center;flex-wrap:nowrap">',
        '  <div style="flex:1;font-weight:900;font-size:13px;color:#ffd966;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🐛 WORLD DEBUG</div>',
        '  <button data-act="refresh" style="padding:6px 10px;background:#3b82f6;color:#fff;border:0;border-radius:6px;font-weight:900;font-size:11px">🔄</button>',
        '  <button data-act="copy" style="padding:6px 10px;background:#22c55e;color:#fff;border:0;border-radius:6px;font-weight:900;font-size:11px">📋</button>',
        '  <button data-act="close" style="padding:6px 10px;background:#6b7280;color:#fff;border:0;border-radius:6px;font-weight:900;font-size:11px">✕</button>',
        '</div>',
        '<pre id="__wfDbgText" style="flex:1;margin:0;padding:12px;overflow:auto;white-space:pre-wrap;word-break:break-word;color:#7dd3fc;font-size:10px;line-height:1.5;-webkit-overflow-scrolling:touch;-webkit-user-select:text;user-select:text"></pre>',
        '<div style="flex:0 0 auto;padding:8px 12px;padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));background:#1a1a1a;border-top:1px solid #333;text-align:center;font-size:10px;color:#888">Auto-refresh mỗi 1s · Scroll để xem</div>',
      ].join('');
      document.body.appendChild(_panel);

      _panel.querySelector('[data-act="close"]').addEventListener('click', closePanel);
      _panel.querySelector('[data-act="refresh"]').addEventListener('click', refresh);
      _panel.querySelector('[data-act="copy"]').addEventListener('click', copyReport);
      _textEl = _panel.querySelector('#__wfDbgText');
    }
  }

  function openPanel(){
    buildUI();
    if (!_panel) return;
    _panel.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    refresh();
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(refresh, 1000);
  }

  function closePanel(){
    if (_panel) _panel.style.display = 'none';
    document.body.style.overflow = '';
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }

  function refresh(){
    if (!_textEl) return;
    _textEl.textContent = formatReport();
  }

  async function copyReport(){
    const text = formatReport();
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch(_){}

    if (!ok && _textEl) {
      // Fallback: select toàn bộ
      try {
        const range = document.createRange();
        range.selectNodeContents(_textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch(_){}
    }

    const btn = _panel ? _panel.querySelector('[data-act="copy"]') : null;
    if (btn){
      const old = btn.textContent;
      btn.textContent = ok ? '✓' : '⚠';
      btn.style.background = ok ? '#16a34a' : '#f59e0b';
      setTimeout(function(){
        btn.textContent = old;
        btn.style.background = '#22c55e';
      }, 1500);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     SHOW/HIDE BUTTON
     ═══════════════════════════════════════════════════════════════ */
  function updateButtonVisibility(){
    if (!_btn){
      buildUI();
      if (!_btn) return;
    }
    const mount = document.getElementById('wfWorldMount');
    const weaponPageOpen = document.getElementById('weaponPage') && document.getElementById('weaponPage').classList.contains('show');
    const shouldShow = !!mount && weaponPageOpen;
    _btn.style.display = shouldShow ? 'block' : 'none';
  }

  setInterval(updateButtonVisibility, 500);

  /* ═══════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════ */
  function boot(){
    buildUI();
    updateButtonVisibility();
    _origLog.call(console, '[WF-Debug] ready — nút 🐛 sẽ hiện khi vào tab World');
    window.__WFDebugTool.ready = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WFDebugTool = {
    ready: true,
    open: openPanel,
    close: closePanel,
    copy: copyReport,
    report: formatReport,
    snapshot: snapshot,
    logs: function(){ return LOGS.slice(); },
    errors: function(){ return ERRORS.slice(); },
  };
})();