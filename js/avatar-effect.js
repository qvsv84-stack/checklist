/* =========================================================
   AVATAR EFFECT — v1.0
   ---------------------------------------------------------
   Áp dụng hiệu ứng avatar (khung lửa...) cho user hiện tại
   ở MỌI nơi có avatar: shop, menu, landing podium, checklist.

   - Load equipped từ RPC rpc_shop_my_equipped
   - Tự scan DOM bằng MutationObserver
   - Tự detect wrap nhỏ → dùng biến thể fx-sm
   - Chỉ áp dụng cho AVATAR CỦA CHÍNH USER (không user khác)

   LOAD ORDER: sau auth.js + supabase-adapter.js, trước shop.js
   ========================================================= */
(function(){
  "use strict";
  if (window.__avatarEffectLoaded) return;
  window.__avatarEffectLoaded = true;

  const TTL_MS = 30000;
  const state = {
    equipped: null,
    loading: false,
    lastFetch: 0,
    me: ''
  };

  function log(){ if (window.__SRANK_DEBUG) console.log.apply(console, ["[AvatarEffect]"].concat([].slice.call(arguments))); }

  function getMe(){
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      return u && u.displayName ? String(u.displayName).trim() : '';
    } catch(_){ return ''; }
  }

  /* ═══════════════════════════════════════════════════════
     LOAD EQUIPPED
     ═══════════════════════════════════════════════════════ */
  async function load(force){
    if (state.loading) return state.equipped;
    const me = getMe();
    if (!me) {
      state.me = '';
      state.equipped = null;
      return null;
    }
    state.me = me;

    if (!force && Date.now() - state.lastFetch < TTL_MS) {
      return state.equipped;
    }

    const sb = window.__sb;
    if (!sb || !sb.rpc) return state.equipped;

    state.loading = true;
    try {
      const res = await sb.rpc('rpc_shop_my_equipped');
      if (!res.error && res.data && res.data.ok === true) {
        state.equipped = res.data.data || null;
        log('equipped:', state.equipped);
      } else {
        state.equipped = null;
      }
      state.lastFetch = Date.now();
    } catch(e) {
      log('load error:', e && e.message);
      state.equipped = null;
    } finally {
      state.loading = false;
    }
    return state.equipped;
  }

  /* ═══════════════════════════════════════════════════════
     EFFECT MAP
     ═══════════════════════════════════════════════════════ */
  const EFFECT_MAP = {
    fire_particles: {
      wrapClass: 'avatar-effect-fire',
      html: '<div class="avatar-fx-particles">'
        + '<span></span><span></span><span></span><span></span>'
        + '<span></span><span></span><span></span>'
        + '</div>'
    }
  };

  /* ═══════════════════════════════════════════════════════
     APPLY / CLEAR
     ═══════════════════════════════════════════════════════ */
  function clearWrap(wrapEl){
    if (!wrapEl) return;
    wrapEl.classList.remove('avatar-effect-fire', 'fx-sm');
    const old = wrapEl.querySelectorAll('.avatar-fx-particles');
    for (let i = 0; i < old.length; i++) old[i].remove();
    if (wrapEl.dataset._fxPos === '1') {
      wrapEl.style.position = '';
      delete wrapEl.dataset._fxPos;
    }
  }

  function clearAll(){
    const all = document.querySelectorAll('.avatar-effect-fire');
    for (let i = 0; i < all.length; i++) clearWrap(all[i]);
  }

  function apply(wrapEl, effectType){
    if (!wrapEl) return;
    clearWrap(wrapEl);
    if (!effectType) return;
    const eff = EFFECT_MAP[effectType];
    if (!eff) return;

    /* Đảm bảo position relative để pseudo ::before hoạt động */
    try {
      const cs = getComputedStyle(wrapEl);
      if (cs.position === 'static') {
        wrapEl.style.position = 'relative';
        wrapEl.dataset._fxPos = '1';
      }
    } catch(_){}

    /* Detect size → dùng biến thể nhỏ nếu wrap < 50px */
    let isSmall = false;
    try {
      const r = wrapEl.getBoundingClientRect();
      isSmall = r.width > 0 && r.width < 50;
    } catch(_){}

    wrapEl.classList.add('avatar-effect-fire');
    if (isSmall) wrapEl.classList.add('fx-sm');
    wrapEl.insertAdjacentHTML('beforeend', eff.html);
  }

  /* ═══════════════════════════════════════════════════════
     REFRESH — scan toàn bộ DOM
     ═══════════════════════════════════════════════════════ */
  function isMe(displayName){
    if (!displayName) return false;
    const me = state.me;
    if (!me) return false;
    return String(displayName).trim() === me;
  }

  function refreshAll(){
    const eff = state.equipped && state.equipped.effect_type;

    /* Xoá hết effect cũ (kể cả nếu user khác có sẵn class) */
    clearAll();

    if (!state.me || !eff) return;

    /* 1. Shop user avatar */
    const shopAv = document.getElementById('shopUserAvatar');
    if (shopAv) apply(shopAv.parentElement || shopAv, eff);

    /* 2. Menu 3 gạch user avatar */
    const menuAv = document.getElementById('menuUserAvatar');
    if (menuAv) apply(menuAv, eff);

    /* 3. Attendance employee avatar — chỉ khi xem chính mình */
    const attAv = document.getElementById('attendanceEmployeeAvatar');
    if (attAv) {
      let selectedName = '';
      try {
        if (typeof window.__getAttendanceSelectedName === 'function') {
          selectedName = window.__getAttendanceSelectedName() || '';
        }
      } catch(_){}
      if (selectedName && isMe(selectedName)) {
        apply(attAv, eff);
      }
    }

    /* 4. Landing: throne / advisor / courtier */
    const landingNodes = document.querySelectorAll(
      '.courtier[data-name], .court-throne[data-name], .advisor[data-name]'
    );
    for (let i = 0; i < landingNodes.length; i++) {
      const el = landingNodes[i];
      const raw = el.getAttribute('data-name') || '';
      if (!isMe(raw)) continue;
      const wrap = el.querySelector('.courtier-avatar, .throne-avatar, .advisor-avatar');
      if (wrap) apply(wrap, eff);
    }

    /* 5. Checklist V6 cards */
    const clv6Cards = document.querySelectorAll('#clV6List .clv6-card');
    for (let i = 0; i < clv6Cards.length; i++) {
      const card = clv6Cards[i];
      const nameEl = card.querySelector('.clv6-name');
      if (!nameEl) continue;
      const cardName = (nameEl.textContent || '').trim();
      if (!isMe(cardName)) continue;
      const av = card.querySelector('.clv6-av');
      if (av) apply(av, eff);
    }

    log('refreshed · equipped=' + (eff || 'none') + ' · me=' + state.me);
  }

  /* ═══════════════════════════════════════════════════════
     SCHEDULE
     ═══════════════════════════════════════════════════════ */
  let scheduled = false;
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      try { refreshAll(); } catch(e) { console.warn('[AvatarEffect] refresh error:', e); }
    });
  }

  /* ═══════════════════════════════════════════════════════
     OBSERVER — tự động refresh khi DOM thay đổi
     ═══════════════════════════════════════════════════════ */
  function startObserver(){
    try {
      const obs = new MutationObserver(function(muts){
        for (let i = 0; i < muts.length; i++) {
          const m = muts[i];
          if (m.type === 'childList') { schedule(); return; }
          if (m.type === 'attributes' && m.attributeName === 'data-name') { schedule(); return; }
        }
      });
      obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-name']
      });
    } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */
  function bindEvents(){
    window.addEventListener('avatarUpdated', function(){ load(true).then(schedule); });
    window.addEventListener('displayNameUpdated', function(){ load(true).then(schedule); });
    window.addEventListener('checkinDone', schedule);
    window.addEventListener('shopEquippedChanged', function(){ load(true).then(schedule); });

    try {
      if (window.SRank && window.SRank.Auth && window.SRank.Auth.onChange) {
        window.SRank.Auth.onChange(function(){
          load(true).then(schedule);
        });
      }
    } catch(_){}

    document.addEventListener('visibilitychange', function(){
      if (!document.hidden) load(false).then(schedule);
    });
  }

  /* ═══════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════ */
  function boot(){
    load(true).then(schedule);
    startObserver();
    bindEvents();
    setTimeout(schedule, 300);
    setTimeout(function(){ load(true).then(schedule); }, 1500);
    setTimeout(schedule, 3000);
    log('v1.0 ready ✓');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 400); }, { once: true });
  } else {
    setTimeout(boot, 400);
  }

  /* ═══════════════════════════════════════════════════════
     EXPOSE
     ═══════════════════════════════════════════════════════ */
  window.AvatarEffect = {
    load: load,
    getEquipped: function(){ return state.equipped; },
    refresh: schedule,
    apply: apply,
    clearAll: clearAll
  };
})();