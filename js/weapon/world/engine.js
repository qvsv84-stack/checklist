/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — ENGINE (v2.1 — dimension fallback)
   ───────────────────────────────────────────────────────────────────────
   v2.1: Không dùng Math.max(1, 0) nữa. Fallback về window size nếu
         container có 0 size (defensive).
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

  function resolveScene(s){
    if (typeof s !== 'string') return s;
    if (s === 'Town'){
      const Town = window.__WF.sceneTown?.TownScene;
      if (Town) return Town;
    }
    throw new Error(`Scene "${s}" không tìm thấy`);
  }

  async function mount(parent, opts){
    if (!parent) throw new Error('mount: parent required');
    if (_game){
      log('Already mounted — return existing');
      return _game;
    }

    opts = opts || {};

    const rawScenes = Array.isArray(opts.scenes) && opts.scenes.length
      ? opts.scenes
      : [window.__WF.sceneTown?.TownScene];

    log('Resolving scenes:', rawScenes.map(s => typeof s === 'string' ? `"${s}"` : (s?.key || 'object')));

    const resolvedScenes = rawScenes.map(s => resolveScene(s));
    log('Resolved', resolvedScenes.length, 'scene(s)');

    await loadPhaser();

    _parent = parent;
    const Phaser = window.Phaser;

    /* ⭐ FIX: Không dùng Math.max(1, 0). Fallback window size. */
    let w = parent.clientWidth;
    let h = parent.clientHeight;

    if (!w || w < 10) w = window.innerWidth || 400;
    if (!h || h < 10) h = Math.max(300, (window.innerHeight || 600) - 100);

    log('Initial size:', w, 'x', h);

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

    /* ⭐ ResizeObserver — chỉ resize khi size hợp lệ > 10px */
    if (typeof ResizeObserver !== 'undefined'){
      _resizeObserver = new ResizeObserver(() => {
        if (!_game || !_parent) return;
        try {
          const cw = _parent.clientWidth;
          const ch = _parent.clientHeight;
          if (cw > 10 && ch > 10){
            _game.scale.resize(cw, ch);
          }
        } catch(_){}
      });
      _resizeObserver.observe(parent);
    }

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
    registerScene: function(){ log('registerScene (deprecated)'); },
    getRegisteredScenes: function(){ return []; },
  };

  log('engine.js ✓ v2.1 (dimension fallback)');
})();