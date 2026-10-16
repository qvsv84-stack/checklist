/* =========================================================
   AVATAR EFFECT — v1.2 (Performance fix)
   ---------------------------------------------------------
   v1.2 FIX (web chậm):
   ✅ MutationObserver bây giờ LỌC mutations:
      - Bỏ qua mutations trong #spinFeed (rotate 1s/tin)
      - Bỏ qua mutations trong .shop-modal
      - Bỏ qua mutations trong .avatar-effect-fire (tránh self-trigger)
      - Chỉ schedule nếu target nằm trong container liên quan
   ✅ Debounce 400ms (thay vì rAF ngay lập tức)
   ✅ _applying lock tăng 800ms (thay 150ms)
   ✅ Boot chỉ refresh 2 lần thay vì 4 lần
   v1.1:
   - _applying flag chống loop
   ========================================================= */
(function(){
  "use strict";
  if (window.__avatarEffectLoaded) return;
  window.__avatarEffectLoaded = true;

  const TTL_MS = 30000;
  const APPLY_LOCK_MS = 800;
  const DEBOUNCE_MS = 400;

  /* Containers ta QUAN TÂM — mutation ngoài các container này bị bỏ qua */
  const RELEVANT_SELECTORS = [
    '#question',         // landing podium, courtiers, throne, advisors
    '#menuOverlay',      // menu 3 gạch
    '#attendancePage',   // chấm công
    '#clV6Page',         // checklist V6
    '#shopPage'          // shop
  ];

  const state = {
    equipped: null,
    loading: false,
    lastFetch: 0,
    me: ''
  };

  let _applying = false;
  let _applyResetTimer = null;
  let _scheduleTimer = null;

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

    try {
      const cs = getComputedStyle(wrapEl);
      if (cs.position === 'static') {
        wrapEl.style.position = 'relative';
        wrapEl.dataset._fxPos = '1';
      }
    } catch(_){}

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
    if (_applying) return;
    _applying = true;

    try {
      const eff = state.equipped && state.equipped.effect_type;

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
    } finally {
      if (_applyResetTimer) clearTimeout(_applyResetTimer);
      _applyResetTimer = setTimeout(function(){
        _applying = false;
      }, APPLY_LOCK_MS);
    }
  }

  /* ═══════════════════════════════════════════════════════
     SCHEDULE — debounce 400ms
     ═══════════════════════════════════════════════════════ */
  function schedule(){
    if (_scheduleTimer) clearTimeout(_scheduleTimer);
    _scheduleTimer = setTimeout(function(){
      _scheduleTimer = null;
      try { refreshAll(); } catch(e) { console.warn('[AvatarEffect] refresh error:', e); }
    }, DEBOUNCE_MS);
  }

  /* ═══════════════════════════════════════════════════════
     v1.2: MUTATION FILTER
     ═══════════════════════════════════════════════════════ */
  function hasClosest(node, sel){
    if (!node || !node.closest) return false;
    try { return !!node.closest(sel); } catch(_) { return false; }
  }

  function nodeMatches(node, sel){
    if (!node || node.nodeType !== 1) return false;
    try {
      if (node.matches && node.matches(sel)) return true;
      if (node.querySelector && node.querySelector(sel)) return true;
    } catch(_){}
    return false;
  }

  function shouldSchedule(mutations){
    /* Nếu đang apply → bỏ qua */
    if (_applying) return false;

    for (let i = 0; i < mutations.length; i++){
      const m = mutations[i];
      const target = m.target;
      if (!target) continue;

      /* Skip mutations trong các vùng "ồn ào" */
      if (hasClosest(target, '#spinFeed')) continue;
      if (hasClosest(target, '.shop-modal')) continue;
      if (hasClosest(target, '.avatar-effect-fire')) continue;

      /* Attribute data-name → relevant */
      if (m.type === 'attributes' && m.attributeName === 'data-name'){
        return true;
      }

      /* childList → chỉ relevant nếu target hoặc addedNodes trong container */
      if (m.type === 'childList'){
        /* Check target */
        for (let j = 0; j < RELEVANT_SELECTORS.length; j++){
          if (hasClosest(target, RELEVANT_SELECTORS[j])) return true;
        }

        /* Check added nodes */
        const added = m.addedNodes;
        if (added && added.length){
          for (let k = 0; k < added.length; k++){
            const n = added[k];
            if (!n) continue;
            for (let j = 0; j < RELEVANT_SELECTORS.length; j++){
              if (nodeMatches(n, RELEVANT_SELECTORS[j])) return true;
            }
          }
        }
      }
    }
    return false;
  }

  /* ═══════════════════════════════════════════════════════
     OBSERVER
     ═══════════════════════════════════════════════════════ */
  function startObserver(){
    try {
      const obs = new MutationObserver(function(muts){
        if (shouldSchedule(muts)) schedule();
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
     BOOT — v1.2: chỉ 2 refreshes
     ═══════════════════════════════════════════════════════ */
  function boot(){
    /* 1st refresh sau khi load equipped */
    load(true).then(schedule);
    startObserver();
    bindEvents();
    /* 2nd (safety) sau 2s — catch late DOM render */
    setTimeout(function(){ load(false).then(schedule); }, 2000);
    log('v1.2 ready ✓ (mutation filter + 400ms debounce)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 400); }, { once: true });
  } else {
    setTimeout(boot, 400);
  }

  window.AvatarEffect = {
    load: load,
    getEquipped: function(){ return state.equipped; },
    refresh: schedule,
    apply: apply,
    clearAll: clearAll
  };
})();