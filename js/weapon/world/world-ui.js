/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — WORLD UI (v1.0)
   ───────────────────────────────────────────────────────────────────────
   HUD overlay cho world mode (DOM thuần, không dùng Phaser):

     • Nút Back (←) — top-left, đóng world
     • User card — avatar + tên + enh (ngay sau back)
     • Gold pill — top-right
     • Loading spinner — center khi mount
     • Toast notif — bottom center (dùng cho tip, reward...)
     • Hướng dẫn nhỏ — góc phải dưới

   Z-index: HUD = 50, back/user = 60, joystick = 100 (không bị đè)

   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.worldUI):
     .attach(parent)         — Tạo HUD DOM trong parent
     .detach()                — Xoá HUD
     .setLoading(bool, text)  — Hiện/ẩn loading
     .setUser({name, avatarUrl, enh}) — Update user info
     .setGold(n)              — Update gold pill
     .toast(msg, type, ms)    — Hiện toast ngắn
     .onBack(callback)        — Set callback cho nút back
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU engine.js, TRƯỚC scene-town.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.worldUI) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════ */
  const STYLE_ID = '__wfWorldUIStyle';
  const HUD_ID = '__wfWorldUI';
  const TOAST_ID = '__wfWorldToast';
  const TOAST_DEFAULT_MS = 2400;

  function log(...a){
    try { console.log('[WF-WorldUI]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let _hud = null;
  let _backBtn = null;
  let _userCard = null;
  let _userAvatar = null;
  let _userName = null;
  let _userEnh = null;
  let _goldPill = null;
  let _goldVal = null;
  let _loading = null;
  let _loadingText = null;
  let _toastEl = null;
  let _toastTimer = null;
  let _onBack = null;
  let _goldValue = 0;

  /* ═══════════════════════════════════════════════════════════════
     CSS INJECT
     ═══════════════════════════════════════════════════════════════ */
  function injectCSS(){
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
#${HUD_ID}{
  position:absolute;
  inset:0;
  z-index:50;
  pointer-events:none;
  font-family: var(--font, ui-rounded, system-ui);
  user-select:none;
  -webkit-user-select:none;
}
#${HUD_ID} > *{pointer-events:auto}

/* ─── Back button ─── */
#${HUD_ID} .wfui-back{
  position:absolute;
  top:calc(12px + env(safe-area-inset-top, 0px));
  left:12px;
  width:44px;
  height:44px;
  border-radius:14px;
  border:1.5px solid rgba(245,158,11,.55);
  background:rgba(0,0,0,.65);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  color:#ffd966;
  font-size:22px;
  font-weight:900;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 4px 12px rgba(0,0,0,.4);
  transition:transform .15s, background .15s;
  z-index:2;
}
#${HUD_ID} .wfui-back:active{
  transform:scale(.9);
  background:rgba(245,158,11,.3);
}

/* ─── User card ─── */
#${HUD_ID} .wfui-user{
  position:absolute;
  top:calc(12px + env(safe-area-inset-top, 0px));
  left:64px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:5px 12px 5px 5px;
  border-radius:999px;
  background:rgba(0,0,0,.6);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border:1.5px solid rgba(245,158,11,.35);
  box-shadow:0 4px 12px rgba(0,0,0,.4);
  max-width:calc(100vw - 180px);
  z-index:2;
}
#${HUD_ID} .wfui-avatar{
  width:34px;
  height:34px;
  border-radius:50%;
  overflow:hidden;
  background:linear-gradient(135deg,#fff7d9,#ffd966);
  border:2px solid #f59e0b;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  font-size:14px;
  font-weight:900;
  color:#7a5410;
}
#${HUD_ID} .wfui-avatar img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
#${HUD_ID} .wfui-user-info{
  display:flex;
  flex-direction:column;
  gap:1px;
  min-width:0;
}
#${HUD_ID} .wfui-user-name{
  font-size:12px;
  font-weight:900;
  color:#fff;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  max-width:140px;
  line-height:1.15;
  text-shadow:0 1px 2px rgba(0,0,0,.5);
}
#${HUD_ID} .wfui-user-enh{
  font-size:10px;
  font-weight:900;
  color:#ffd966;
  line-height:1.1;
  text-shadow:0 1px 2px rgba(0,0,0,.5);
}

/* ─── Gold pill ─── */
#${HUD_ID} .wfui-gold{
  position:absolute;
  top:calc(12px + env(safe-area-inset-top, 0px));
  right:12px;
  display:flex;
  align-items:center;
  gap:5px;
  padding:8px 12px;
  border-radius:999px;
  background:linear-gradient(135deg,#fff7d9,#ffd966);
  border:1.5px solid #f5b800;
  color:#6b4300;
  font-size:13px;
  font-weight:950;
  font-variant-numeric:tabular-nums;
  box-shadow:0 4px 12px rgba(245,184,0,.4);
  z-index:2;
}
#${HUD_ID} .wfui-gold.flash{
  animation:wfuiGoldFlash .6s ease;
}
@keyframes wfuiGoldFlash{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.12); box-shadow:0 4px 20px rgba(245,184,0,.8)}
}

/* ─── Loading ─── */
#${HUD_ID} .wfui-loading{
  position:absolute;
  inset:0;
  background:rgba(20,15,5,.85);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:14px;
  z-index:5;
  transition:opacity .25s;
}
#${HUD_ID} .wfui-loading.hidden{
  opacity:0;
  pointer-events:none;
}
#${HUD_ID} .wfui-spinner{
  width:44px;
  height:44px;
  border:4px solid rgba(245,158,11,.25);
  border-top-color:#f59e0b;
  border-radius:50%;
  animation:wfuiSpin .8s linear infinite;
}
@keyframes wfuiSpin{
  to{transform:rotate(360deg)}
}
#${HUD_ID} .wfui-loading-text{
  font-size:13px;
  font-weight:900;
  color:#ffd966;
  letter-spacing:.05em;
  text-transform:uppercase;
}

/* ─── Toast ─── */
#${TOAST_ID}{
  position:absolute;
  bottom:calc(180px + env(safe-area-inset-bottom, 0px));
  left:50%;
  transform:translateX(-50%) translateY(20px);
  padding:10px 18px;
  border-radius:999px;
  background:rgba(35,60,45,.95);
  color:#fff;
  font-size:13px;
  font-weight:900;
  letter-spacing:.01em;
  box-shadow:0 8px 24px rgba(0,0,0,.5);
  opacity:0;
  pointer-events:none;
  transition:opacity .25s, transform .25s;
  max-width:calc(100vw - 40px);
  text-align:center;
  z-index:6;
  font-family: var(--font, ui-rounded, system-ui);
}
#${TOAST_ID}.show{
  opacity:1;
  transform:translateX(-50%) translateY(0);
}
#${TOAST_ID}.type-success{background:rgba(34,120,80,.96)}
#${TOAST_ID}.type-error{background:rgba(180,40,40,.96)}
#${TOAST_ID}.type-warning{background:rgba(180,120,40,.96)}
#${TOAST_ID}.type-info{background:rgba(35,60,45,.96)}

/* ─── Small hint ─── */
#${HUD_ID} .wfui-hint{
  position:absolute;
  bottom:calc(12px + env(safe-area-inset-bottom, 0px));
  right:12px;
  padding:6px 10px;
  border-radius:8px;
  background:rgba(0,0,0,.55);
  color:rgba(255,217,102,.75);
  font-size:10px;
  font-weight:900;
  letter-spacing:.04em;
  border:1px solid rgba(245,158,11,.25);
  z-index:2;
}

@media (max-width:360px){
  #${HUD_ID} .wfui-user-name{max-width:100px}
  #${HUD_ID} .wfui-user{padding:4px 10px 4px 4px;gap:6px}
  #${HUD_ID} .wfui-avatar{width:28px;height:28px;font-size:12px}
  #${HUD_ID} .wfui-back{width:40px;height:40px;font-size:20px}
  #${HUD_ID} .wfui-gold{font-size:12px;padding:6px 10px}
}
`;
    document.head.appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════
     ATTACH
     ═══════════════════════════════════════════════════════════════ */
  function attach(parent){
    if (!parent) throw new Error('worldUI.attach: parent required');
    if (_hud) detach();

    injectCSS();

    _hud = document.createElement('div');
    _hud.id = HUD_ID;
    _hud.innerHTML = `
      <button class="wfui-back" type="button" aria-label="Đóng thế giới">←</button>
      <div class="wfui-user">
        <div class="wfui-avatar" id="wfuiAvatar">?</div>
        <div class="wfui-user-info">
          <span class="wfui-user-name" id="wfuiName">Bạn</span>
          <span class="wfui-user-enh" id="wfuiEnh"></span>
        </div>
      </div>
      <div class="wfui-gold" id="wfuiGold">
        <span>🪙</span>
        <span id="wfuiGoldVal">0</span>
      </div>
      <div class="wfui-loading" id="wfuiLoading">
        <div class="wfui-spinner"></div>
        <div class="wfui-loading-text" id="wfuiLoadingText">Đang tải thế giới…</div>
      </div>
      <div class="wfui-hint">⚡ WASD / Joystick để đi</div>
    `;
    parent.appendChild(_hud);

    // Toast (append vào parent, không vào HUD — vì HUD inset 0)
    _toastEl = document.createElement('div');
    _toastEl.id = TOAST_ID;
    parent.appendChild(_toastEl);

    // Cache refs
    _backBtn = _hud.querySelector('.wfui-back');
    _userCard = _hud.querySelector('.wfui-user');
    _userAvatar = _hud.querySelector('#wfuiAvatar');
    _userName = _hud.querySelector('#wfuiName');
    _userEnh = _hud.querySelector('#wfuiEnh');
    _goldPill = _hud.querySelector('#wfuiGold');
    _goldVal = _hud.querySelector('#wfuiGoldVal');
    _loading = _hud.querySelector('#wfuiLoading');
    _loadingText = _hud.querySelector('#wfuiLoadingText');

    // Wire back
    _backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof _onBack === 'function'){
        try { _onBack(); } catch(err){ console.warn('[WF-WorldUI] onBack error:', err); }
      }
    });

    // Auto populate từ state
    _autopopulate();

    log('Attached');
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO POPULATE từ state
     ═══════════════════════════════════════════════════════════════ */
  function _autopopulate(){
    try {
      const data = window.__WF.world?.getPlayerData?.();
      if (data){
        setUser({
          name: data.displayName,
          avatarUrl: window.getAvatarUrl?.(data.displayName) || '',
          enh: data.enh,
        });
      }
      const ST = window.__WF.state;
      if (ST && ST.S && ST.S.state){
        setGold(ST.S.state.gold || 0);
      }
    } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     DETACH
     ═══════════════════════════════════════════════════════════════ */
  function detach(){
    if (_toastTimer){
      clearTimeout(_toastTimer);
      _toastTimer = null;
    }
    if (_toastEl){
      try { _toastEl.remove(); } catch(_){}
      _toastEl = null;
    }
    if (_hud){
      try { _hud.remove(); } catch(_){}
    }
    _hud = null;
    _backBtn = null;
    _userCard = null;
    _userAvatar = null;
    _userName = null;
    _userEnh = null;
    _goldPill = null;
    _goldVal = null;
    _loading = null;
    _loadingText = null;
    _onBack = null;
    log('Detached');
  }

  /* ═══════════════════════════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════════════════════════ */
  function setLoading(show, text){
    if (!_loading) return;
    if (text && _loadingText) _loadingText.textContent = String(text);
    _loading.classList.toggle('hidden', !show);
  }

  /* ═══════════════════════════════════════════════════════════════
     USER
     ═══════════════════════════════════════════════════════════════ */
  function setUser(data){
    if (!data || !_userName) return;

    const name = String(data.name || 'Bạn').trim() || 'Bạn';
    _userName.textContent = name;
    _userName.title = name;

    // Enh
    const enh = Number(data.enh) || 0;
    if (_userEnh){
      _userEnh.textContent = enh > 0 ? `+${enh}` : '';
    }

    // Avatar
    if (_userAvatar){
      const url = String(data.avatarUrl || '');
      if (url){
        _userAvatar.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.onerror = () => {
          // Fallback: chữ cái đầu
          _userAvatar.innerHTML = '';
          _userAvatar.textContent = name.slice(0, 1).toUpperCase();
        };
        _userAvatar.appendChild(img);
      } else {
        _userAvatar.textContent = name.slice(0, 1).toUpperCase();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     GOLD
     ═══════════════════════════════════════════════════════════════ */
  function setGold(n){
    const val = Math.max(0, Number(n) || 0);
    const changed = val !== _goldValue;
    _goldValue = val;
    if (_goldVal){
      _goldVal.textContent = val.toLocaleString('vi-VN');
    }
    if (changed && _goldPill){
      _goldPill.classList.remove('flash');
      void _goldPill.offsetWidth;
      _goldPill.classList.add('flash');
      setTimeout(() => {
        _goldPill?.classList.remove('flash');
      }, 700);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     TOAST
     ═══════════════════════════════════════════════════════════════ */
  function toast(msg, type, duration){
    if (!_toastEl) return;
    const txt = String(msg || '').trim();
    if (!txt) return;

    _toastEl.classList.remove('type-success', 'type-error', 'type-warning', 'type-info');
    _toastEl.classList.add('type-' + (type || 'info'));
    _toastEl.textContent = txt;

    _toastEl.classList.add('show');

    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      _toastEl.classList.remove('show');
      _toastTimer = null;
    }, Number(duration) > 0 ? Number(duration) : TOAST_DEFAULT_MS);
  }

  /* ═══════════════════════════════════════════════════════════════
     BACK CALLBACK
     ═══════════════════════════════════════════════════════════════ */
  function onBack(fn){
    _onBack = typeof fn === 'function' ? fn : null;
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.worldUI = {
    attach,
    detach,
    setLoading,
    setUser,
    setGold,
    toast,
    onBack,
    isAttached: () => !!_hud,
  };

  log('world-ui.js ✓');
})();