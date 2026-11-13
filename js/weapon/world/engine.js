/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — ENGINE (v2.0 — no registry, direct scene)
   ───────────────────────────────────────────────────────────────────────
   v2.0: LOẠI BỎ hoàn toàn registry `_scenes`.
   - mount() nhận scene object/class TRỰC TIẾP
   - Không cần registerScene, waitForScenes
   - Backward compat: nhận string key → lookup fallback trong __WF.scene*
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.world) return;
  window.__WF = window.__WF || {};

  const PHASER_VERSION = '3.80.1';
  const PHASER_URL = `https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js`;

  let _game = null;
  let _phaserPromise = null;
  let _parent = null;
  let _resizeObserver = null;
  let _visibilityHandler = null;

  function log(...a){
    try { console.log('[WF-World]', ...a); } catch(_){}
  }
  function warn(...a){
    try { console.warn('[WF-World]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     LOAD PHASER
     ═══════════════════════════════════════════════════════════════ */
  function loadPhaser(){
    if (window.Phaser) return Promise.resolve(window.Phaser);
    if (_phaserPromise) return _phaserPromise;

    _phaserPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${PHASER_URL}"]`);
      if (existing){
        if (window.Phaser) return resolve(window.Phaser);
        existing.addEventListener('load', () => resolve(window.Phaser), { once: true });
        existing.addEventListener('error', () => {
          _phaserPromise = null;
          reject(new Error('Phaser load failed (existing tag)'));
        }, { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = PHASER_URL;
      s.async = true;
      s.onload = () => {
        log('Phaser loaded:', PHASER_VERSION);
        resolve(window.Phaser);
      };
      s.onerror = () => {
        _phaserPromise = null;
        reject(new Error('Phaser load failed (CDN)'));
      };
      document.head.appendChild(s);
    });

    return _phaserPromise;
  }

  /* ═══════════════════════════════════════════════════════════════
     RESOLVE SCENE — nhận object/class trực tiếp hoặc string key
     ═══════════════════════════════════════════════════════════════ */
  function resolveScene(s){
    // Đã là object/class → dùng trực tiếp
    if (typeof s !== 'string') return s;

    // Là string → thử lookup trong các module scene đã load
    if (s === 'Town'){
      const Town = window.__WF.sceneTown?.TownScene;
      if (Town) return Town;
    }
    // Thêm fallback cho scene khác ở đây nếu cần
    // if (s === 'Forest') { ... }

    throw new Error(`Scene "${s}" không tìm thấy trong window.__WF.scene*`);
  }

  /* ═══════════════════════════════════════════════════════════════
     MOUNT
     ═══════════════════════════════════════════════════════════════ */
  async function mount(parent, opts){
    if (!parent) throw new Error('mount: parent required');
    if (_game){
      log('Already mounted — return existing');
      return _game;
    }

    opts = opts || {};

    // Resolve scene — chấp nhận cả object trực tiếp và string key
    const rawScenes = Array.isArray(opts.scenes) && opts.scenes.length
      ? opts.scenes
      : [window.__WF.sceneTown?.TownScene];

    log('Resolving scenes:', rawScenes.map(s => typeof s === 'string' ? `"${s}"` : (s?.key || 'object')));

    const resolvedScenes = rawScenes.map(s => {
      const resolved = resolveScene(s);
      if (!resolved) throw new Error('Scene resolve failed: ' + s);
      return resolved;
    });

    log('Resolved', resolvedScenes.length, 'scene(s):', resolvedScenes.map(s => s.key || s.name || '?'));

    // Load Phaser (sau khi resolve để tránh load thừa nếu lỗi)
    await loadPhaser();

    _parent = parent;

    const Phaser = window.Phaser;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);

    _game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parent,
      width: w,
      height: h,
      backgroundColor: '#2d2420',
      pixelArt: true,
      roundPixels: true,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: false,
        pixelArt: true,
        transparent: false,
      },
      scene: resolvedScenes,
    });

    // Resize observer
    if (typeof ResizeObserver !== 'undefined'){
      _resizeObserver = new ResizeObserver(() => {
        if (!_game || !_parent) return;
        try {
          const cw = Math.max(1, _parent.clientWidth);
          const ch = Math.max(1, _parent.clientHeight);
          _game.scale.resize(cw, ch);
        } catch(_){}
      });
      _resizeObserver.observe(parent);
    }

    // Visibility pause
    _visibilityHandler = () => {
      if (!_game || !_game.loop) return;
      try {
        if (document.hidden) _game.loop.sleep();
        else _game.loop.wake();
      } catch(_){}
    };
    document.addEventListener('visibilitychange', _visibilityHandler);

    log('Game mounted ✓');
    return _game;
  }

  /* ═══════════════════════════════════════════════════════════════
     UNMOUNT
     ═══════════════════════════════════════════════════════════════ */
  function unmount(){
    if (!_game) return;

    try {
      _game.destroy(true);
    } catch(e){
      warn('destroy error:', e);
    }
    _game = null;

    if (_resizeObserver){
      try { _resizeObserver.disconnect(); } catch(_){}
      _resizeObserver = null;
    }

    if (_visibilityHandler){
      document.removeEventListener('visibilitychange', _visibilityHandler);
      _visibilityHandler = null;
    }

    if (_parent){
      try {
        const canvases = _parent.querySelectorAll('canvas');
        canvases.forEach(c => c.remove());
      } catch(_){}
      _parent = null;
    }

    log('Game destroyed');
  }

  /* ═══════════════════════════════════════════════════════════════
     CONTROL
     ═══════════════════════════════════════════════════════════════ */
  function pause(){
    if (_game && _game.loop) {
      try { _game.loop.sleep(); } catch(_){}
    }
  }
  function resume(){
    if (_game && _game.loop) {
      try { _game.loop.wake(); } catch(_){}
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════════════════════ */
  function isReady(){ return !!_game; }
  function getGame(){ return _game; }
  function getScene(key){
    if (!_game || !_game.scene) return null;
    try { return _game.scene.getScene(key); } catch(_){ return null; }
  }

  function getPlayerData(){
    const ST = window.__WF.state;
    if (!ST || !ST.S) return null;
    const S = ST.S;
    if (!S.user) return null;
    return {
      userId: S.user.id,
      displayName: S.user.displayName || S.user.username || 'Bạn',
      characterId: S.state?.character_id || null,
      enh: S.state?.enh || 0,
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT — bỏ registerScene, giữ cho backward compat (deprecated)
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.world = {
    mount,
    unmount,
    pause,
    resume,
    isReady,
    getGame,
    getScene,
    getPlayerData,
    loadPhaser,
    PHASER_VERSION,

    // Deprecated — no-op, giữ để code cũ không crash
    registerScene: function(key, scene){
      log('registerScene (deprecated) — bỏ qua, mount nhận scene trực tiếp');
    },
    getRegisteredScenes: function(){ return []; },
  };

  log('engine.js ✓ v2.0 (no registry — direct scene)');
})();