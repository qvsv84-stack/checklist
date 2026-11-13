/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — JOYSTICK (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Virtual joystick cho mobile + WASD/Arrow cho desktop.
   Không phụ thuộc Phaser — chỉ input layer, scene dùng `getVector()`.
   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.joystick):
     .attach(opts)       — Gắn joystick vào 1 container (thường là scene)
     .detach()           — Gỡ
     .getVector()        — Trả về { x, y } đã normalize (-1..1)
     .isActive()         — Có đang kéo joystick?
     .setVisible(bool)   — Ẩn/hiện
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU engine.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.joystick) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════ */
  const STICK_RADIUS = 50;       // Bán kính base joystick
  const KNOB_RADIUS = 22;        // Bán kính knob (núm)
  const DEAD_ZONE = 8;           // Vùng chết (pixel) — không tính vector nhỏ
  const STYLE_ID = '__wfJoystickStyle';
  const CONTAINER_ID = '__wfJoystick';

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let _container = null;
  let _baseEl = null;
  let _knobEl = null;
  let _visible = true;
  let _active = false;
  let _pointerId = null;
  let _origin = { x: 0, y: 0 };
  let _current = { x: 0, y: 0 };
  let _keys = new Set();
  let _attached = false;

  function log(...a){
    try { console.log('[WF-Joystick]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     CSS INJECT
     ═══════════════════════════════════════════════════════════════ */
  function injectCSS(){
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
#${CONTAINER_ID}{
  position:absolute;
  left:0;
  bottom:0;
  width:160px;
  height:160px;
  z-index:100;
  pointer-events:none;
  display:none;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
  -webkit-tap-highlight-color:transparent;
}
#${CONTAINER_ID}.visible{display:block}
#${CONTAINER_ID} .wfj-base{
  position:absolute;
  left:${20}px;
  bottom:${20}px;
  width:${STICK_RADIUS*2}px;
  height:${STICK_RADIUS*2}px;
  border-radius:50%;
  background:radial-gradient(circle,
    rgba(255,255,255,.15) 0%,
    rgba(255,255,255,.08) 60%,
    rgba(255,255,255,.04) 100%);
  border:2px solid rgba(245,158,11,.55);
  box-shadow:
    inset 0 0 12px rgba(245,158,11,.15),
    0 0 20px rgba(245,158,11,.2);
  pointer-events:auto;
  touch-action:none;
  transition:opacity .2s;
}
#${CONTAINER_ID} .wfj-base::before{
  content:'';
  position:absolute;
  inset:50%;
  width:4px;
  height:4px;
  margin:-2px 0 0 -2px;
  border-radius:50%;
  background:rgba(245,158,11,.6);
  box-shadow:0 0 8px rgba(245,158,11,.8);
}
#${CONTAINER_ID} .wfj-knob{
  position:absolute;
  left:${20 + STICK_RADIUS - KNOB_RADIUS}px;
  bottom:${20 + STICK_RADIUS - KNOB_RADIUS}px;
  width:${KNOB_RADIUS*2}px;
  height:${KNOB_RADIUS*2}px;
  border-radius:50%;
  background:radial-gradient(circle at 35% 35%,
    #ffd966 0%,
    #f59e0b 55%,
    #d97706 100%);
  border:2px solid rgba(255,255,255,.7);
  box-shadow:
    0 4px 12px rgba(0,0,0,.5),
    inset 0 -2px 4px rgba(120,60,0,.4),
    inset 0 2px 4px rgba(255,255,255,.4);
  pointer-events:none;
  transition:transform .08s ease-out;
  will-change:transform;
}
#${CONTAINER_ID}.dragging .wfj-base{
  border-color:rgba(245,158,11,.9);
  box-shadow:
    inset 0 0 16px rgba(245,158,11,.3),
    0 0 28px rgba(245,158,11,.4);
}
#${CONTAINER_ID}.dragging .wfj-knob{
  transition:none;
  box-shadow:
    0 6px 16px rgba(0,0,0,.6),
    inset 0 -2px 4px rgba(120,60,0,.4),
    inset 0 2px 4px rgba(255,255,255,.5),
    0 0 20px rgba(245,158,11,.5);
}

@media (min-width: 768px){
  #${CONTAINER_ID}{
    width:200px;
    height:200px;
  }
}
`;
    document.head.appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════
     CREATE DOM
     ═══════════════════════════════════════════════════════════════ */
  function createDOM(parent){
    injectCSS();
    if (_container) _container.remove();

    _container = document.createElement('div');
    _container.id = CONTAINER_ID;

    _baseEl = document.createElement('div');
    _baseEl.className = 'wfj-base';

    _knobEl = document.createElement('div');
    _knobEl.className = 'wfj-knob';

    _baseEl.appendChild(_knobEl);
    _container.appendChild(_baseEl);
    parent.appendChild(_container);

    // Chỉ hiện trên mobile hoặc touch device
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    _visible = isTouch;
    _container.classList.toggle('visible', _visible);

    log('DOM created. visible:', _visible);
  }

  /* ═══════════════════════════════════════════════════════════════
     POINTER EVENTS
     ═══════════════════════════════════════════════════════════════ */
  function onPointerDown(e){
    if (!_baseEl) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    _active = true;
    _pointerId = e.pointerId;

    const rect = _baseEl.getBoundingClientRect();
    _origin.x = rect.left + rect.width / 2;
    _origin.y = rect.top + rect.height / 2;

    _container.classList.add('dragging');

    try { _baseEl.setPointerCapture(e.pointerId); } catch(_){}

    updateFromPointer(e.clientX, e.clientY);
  }

  function onPointerMove(e){
    if (!_active || e.pointerId !== _pointerId) return;
    e.preventDefault();
    updateFromPointer(e.clientX, e.clientY);
  }

  function onPointerUp(e){
    if (e.pointerId !== _pointerId) return;
    e.preventDefault();

    _active = false;
    _pointerId = null;
    _container.classList.remove('dragging');

    _knobEl.style.transform = 'translate(0, 0)';
    _current.x = 0;
    _current.y = 0;

    try { _baseEl.releasePointerCapture(e.pointerId); } catch(_){}
  }

  function updateFromPointer(px, py){
    const dx = px - _origin.x;
    const dy = py - _origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp trong STICK_RADIUS
    const clampedDist = Math.min(dist, STICK_RADIUS);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    // Move knob (CSS translate)
    _knobEl.style.transform = `translate(${kx}px, ${ky}px)`;

    // Vector normalized -1..1 với dead zone
    if (dist < DEAD_ZONE){
      _current.x = 0;
      _current.y = 0;
    } else {
      const norm = clampedDist / STICK_RADIUS;
      _current.x = Math.cos(angle) * norm;
      _current.y = Math.sin(angle) * norm;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     KEYBOARD (WASD + Arrows) — cho desktop test
     ═══════════════════════════════════════════════════════════════ */
  function onKeyDown(e){
    const k = e.key.toLowerCase();
    const map = {
      'w': 'up', 'arrowup': 'up',
      's': 'down', 'arrowdown': 'down',
      'a': 'left', 'arrowleft': 'left',
      'd': 'right', 'arrowright': 'right',
    };
    if (map[k]) _keys.add(map[k]);
  }

  function onKeyUp(e){
    const k = e.key.toLowerCase();
    const map = {
      'w': 'up', 'arrowup': 'up',
      's': 'down', 'arrowdown': 'down',
      'a': 'left', 'arrowleft': 'left',
      'd': 'right', 'arrowright': 'right',
    };
    if (map[k]) _keys.delete(map[k]);
  }

  function getKeyboardVector(){
    let x = 0, y = 0;
    if (_keys.has('left'))  x -= 1;
    if (_keys.has('right')) x += 1;
    if (_keys.has('up'))    y -= 1;
    if (_keys.has('down'))  y += 1;
    // Normalize
    if (x !== 0 || y !== 0){
      const m = Math.sqrt(x*x + y*y);
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  /* ═══════════════════════════════════════════════════════════════
     ATTACH / DETACH
     ═══════════════════════════════════════════════════════════════ */
  function attach(opts){
    if (_attached){
      log('Already attached');
      return;
    }
    opts = opts || {};
    const parent = opts.parent;
    if (!parent){
      console.warn('[WF-Joystick] attach: parent required');
      return;
    }

    createDOM(parent);

    // Pointer events trên base
    _baseEl.addEventListener('pointerdown', onPointerDown);
    _baseEl.addEventListener('pointermove', onPointerMove);
    _baseEl.addEventListener('pointerup', onPointerUp);
    _baseEl.addEventListener('pointercancel', onPointerUp);

    // Keyboard cho desktop test
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    _attached = true;
    log('Attached');
  }

  function detach(){
    if (!_attached) return;

    if (_baseEl){
      _baseEl.removeEventListener('pointerdown', onPointerDown);
      _baseEl.removeEventListener('pointermove', onPointerMove);
      _baseEl.removeEventListener('pointerup', onPointerUp);
      _baseEl.removeEventListener('pointercancel', onPointerUp);
    }

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);

    if (_container){
      try { _container.remove(); } catch(_){}
      _container = null;
    }

    _baseEl = null;
    _knobEl = null;
    _active = false;
    _pointerId = null;
    _current.x = 0;
    _current.y = 0;
    _keys.clear();
    _attached = false;

    log('Detached');
  }

  /* ═══════════════════════════════════════════════════════════════
     GET VECTOR (kết hợp joystick + keyboard)
     ═══════════════════════════════════════════════════════════════ */
  function getVector(){
    // Keyboard ưu tiên hơn joystick khi cả 2 cùng active
    const kb = getKeyboardVector();
    if (kb.x !== 0 || kb.y !== 0) return kb;
    return { x: _current.x, y: _current.y };
  }

  function isActive(){
    return _active;
  }

  function setVisible(v){
    _visible = !!v;
    if (_container) _container.classList.toggle('visible', _visible);
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.joystick = {
    attach,
    detach,
    getVector,
    isActive,
    setVisible,
    // Debug
    _state: () => ({ active: _active, current: { ..._current }, keys: [..._keys] }),
  };

  log('joystick.js ✓ (touch + WASD/Arrows)');
})();