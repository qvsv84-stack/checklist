/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — ENGINE (v1.1 — fix register object scene)
   ───────────────────────────────────────────────────────────────────────
   v1.1: registerScene chấp nhận cả function (class) VÀ object (config).
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.world) return;
  window.__WF = window.__WF || {};

  const PHASER_VERSION = '3.80.1';
  const PHASER_URL = `https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js`;
  const SCENE_REGISTER_TIMEOUT_MS = 5000;

  let _game = null;
  let _phaserPromise = null;
  let _parent = null;
  let _resizeObserver = null;
  let _visibilityHandler = null;
  const _scenes = {};

  function log(...a){
    try { console.log('[WF-World]', ...a); } catch(_){}
  }
  function warn(...a){
    try { console.warn('[WF-World]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     LOAD PHASER (lazy, cached)
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
     SCENE REGISTRY — v1.1 fix: accept object + function
     ═══════════════════════════════════════════════════════════════ */
  function registerScene(key, SceneClass){
    if (!key || !SceneClass){
      warn('registerScene: invalid args', key, SceneClass);
      return;
    }
    const t = typeof SceneClass;
    // ⭐ FIX v1.1: chấp nhận cả class (function) VÀ config (object)
    if (t !== 'function' && t !== 'object'){
      warn('registerScene: SceneClass phải là class hoặc object — nhận:', t);
      return;
    }
    _scenes[key] = SceneClass;
    log('Scene registered:', key, '(' + t + ')');
  }

  async function waitForScenes(keys, timeout){
    const start = Date.now();
    while (Date.now() - start < timeout){
      const missing = keys.filter(k => !_scenes[k]);
      if (!missing.length) return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     MOUNT / UNMOUNT
     ═══════════════════════════════════════════════════════════════ */
  async function mount(parent, opts){
    if (!parent) throw new Error('mount: parent required');
    if (_game){
      log('Already mounted — return existing');
      return _game;
    }

    opts = opts || {};
    const sceneKeys = Array.isArray(opts.scenes) && opts.scenes.length
      ? opts.scenes
      : ['Town'];
    const sceneTimeout = Number(opts.sceneTimeout) > 0
      ? Number(opts.sceneTimeout)
      : SCENE_REGISTER_TIMEOUT_MS;

    await loadPhaser();

    const ready = await waitForScenes(sceneKeys, sceneTimeout);
    if (!ready){
      const missing = sceneKeys.filter(k => !_scenes[k]);
      const available = Object.keys(_scenes);
      throw new Error(
        'Scenes chưa đăng ký: ' + missing.join(', ') +
        ' (có sẵn: ' + (available.length ? available.join(', ') : 'trống') + ')'
      );
    }

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
      scene: sceneKeys.map(k => _scenes[k]),
    });

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

    _visibilityHandler = () => {
      if (!_game || !_game.loop) return;
      try {
        if (document.hidden) _game.loop.sleep();
        else _game.loop.wake();
      } catch(_){}
    };
    document.addEventListener('visibilitychange', _visibilityHandler);

    log('Game mounted. Scenes:', sceneKeys.join(', '));
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
  function isReady(){
    return !!_game;
  }
  function getGame(){
    return _game;
  }
  function getScene(key){
    if (!_game || !_game.scene) return null;
    try { return _game.scene.getScene(key); } catch(_){ return null; }
  }
  function getRegisteredScenes(){
    return Object.keys(_scenes);
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
    registerScene,
    getRegisteredScenes,
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
    _scenes,
  };

  log('engine.js ✓ v1.1 (Phaser', PHASER_VERSION, '— accept class + object)');
})();