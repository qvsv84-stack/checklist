/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #16: INDEX (boot + render + public API)
   - ensurePage: DOM gốc (header, body, result modal)
   - render: dispatch theo S.activeTab → tab-*.js
   - wireActiveTab: gắn event listeners cho tab đang active
   - openPage / closePage
   - Public API: window.WeaponForge
   - Load: #16 (CUỐI CÙNG)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.index) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  const TF = window.__WF.tabForge;
  const TS = window.__WF.tabShop;
  const TQ = window.__WF.tabQuest;
  const TP = window.__WF.tabPet;
  const TB = window.__WF.tabBoss;
  const TA = window.__WF.tabArena;
  const TC = window.__WF.tabChat;
  const RT = window.__WF.realtime;
  const BATTLE = window.__WF.battle;

  if (!C || !U || !ST || !API || !TF || !TS || !TQ || !TP || !TB || !TA || !TC || !RT || !BATTLE){
    console.error('[WF] index.js thiếu module — kiểm tra load order');
    return;
  }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const { nowMs, fmtGold, esc, toast } = U;
  const { tierOf, powerOf, regenEnergy, checkAchievements } = C;

  /* ═══════════════════════════════════════════════════════════════
     TAB DEFINITIONS
     ═══════════════════════════════════════════════════════════════ */
  const TABS = [
    { key:'forge',     icon:'🔨', label:'Rèn' },
    { key:'market',    icon:'🏪', label:'Chợ' },
    { key:'inventory', icon:'🎒', label:'Kho' },
    { key:'quest',     icon:'📜', label:'Quest',   badge:true },
    { key:'season',    icon:'🎫', label:'Season',  badge:true },
    { key:'pet',       icon:'🐾', label:'Pet' },
    { key:'boss',      icon:'👹', label:'Boss',    badge:true },
    { key:'arena',     icon:'⚔️', label:'Đấu',     badge:true },
    { key:'chat',      icon:'💬', label:'Chat',    badge:true },
    { key:'gift',      icon:'🎁', label:'Tặng' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     ENSURE PAGE (DOM gốc)
     ═══════════════════════════════════════════════════════════════ */
  function ensurePage(){
    let page = document.getElementById('weaponPage');
    if (page) return page;

    page = document.createElement('section');
    page.id = 'weaponPage';
    page.setAttribute('aria-label', 'Xưởng rèn vũ khí');
    page.setAttribute('aria-hidden', 'true');
    page.innerHTML = `
      <header class="wf-head">
        <button class="wf-head-btn" id="wfBack" type="button" aria-label="Đóng">←</button>
        <div class="wf-head-title">
          <span class="wf-kicker">XƯỞNG RÈN</span>
          <span class="wf-title">Vũ khí</span>
        </div>
        <div class="wf-pills">
          <div class="wf-pill gold"><span>🪙</span><span id="wfGoldVal">0</span></div>
        </div>
      </header>
      <div class="wf-body" id="wfBody"></div>
      <div class="wf-result" id="wfResult">
        <div class="wf-result-card">
          <div class="wf-result-emoji" id="wfResEmoji">✨</div>
          <div class="wf-result-title" id="wfResTitle">—</div>
          <div class="wf-result-desc" id="wfResDesc">—</div>
          <div class="wf-result-changes" id="wfResChanges"></div>
          <div style="display:flex;gap:8px;">
            <button class="wf-result-btn" id="wfResOk" type="button"
              style="flex:1;background:rgba(0,0,0,.06);color:#78350f;box-shadow:none;">Đóng</button>
            <button class="wf-result-btn" id="wfResAgain" type="button"
              style="flex:1.4;">🔨 Rèn tiếp</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(page);

    page.querySelector('#wfBack').addEventListener('click', closePage);
    page.querySelector('#wfResOk').addEventListener('click', TF.closeResult);
    page.querySelector('#wfResult').addEventListener('click', e => {
      if (e.target.id === 'wfResult') TF.closeResult();
    });
    page.querySelector('#wfResAgain').addEventListener('click', () => {
      TF.closeResult();
      setTimeout(() => { if (!S.busy) TF.doForge(); }, 150);
    });

    return page;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER MAIN (dispatch)
     ═══════════════════════════════════════════════════════════════ */
  function render(){
    const body = document.getElementById('wfBody');
    if (!body) return;

    /* Login wall */
    if (!S.user){
      body.innerHTML = renderLoginWall();
      body.querySelector('#wfLoginBtn')?.addEventListener('click', () => {
        try { window.SRank?.openLogin?.(); } catch(_){}
      });
      return;
    }

    /* Loading */
    if (!S.state){
      body.innerHTML = '<div class="wf-history-empty">Đang tải…</div>';
      return;
    }

    /* Energy regen */
    const gained = regenEnergy(S.state, nowMs());
    if (gained > 0) ST.scheduleSave();

    /* Gold pill */
    const gv = document.getElementById('wfGoldVal');
    if (gv) gv.textContent = fmtGold(S.state.gold);

    /* Tabs nav */
    let tabsHTML = '<nav class="wf-tabs">';
    TABS.forEach(t => {
      const badge = t.badge ? '<span class="wf-tab-badge" style="display:none"></span>' : '';
      tabsHTML += `<button class="wf-tab ${S.activeTab===t.key?'active':''}" data-tab="${t.key}" type="button">
        <span class="wf-tab-icon">${t.icon}${badge}</span>
        <span class="wf-tab-label">${t.label}</span>
      </button>`;
    });
    tabsHTML += '</nav>';

    /* Tab content dispatch */
    let content = '';
    switch (S.activeTab){
      case 'forge':     content = TF.renderForgeTab(); break;
      case 'market':    content = TS.renderMarketTab(); break;
      case 'inventory': content = TS.renderInventoryTab(); break;
      case 'quest':     content = TQ.renderQuestTab(); break;
      case 'season':    content = TQ.renderSeasonTab(); break;
      case 'pet':       content = TP.renderPetTab(); break;
      case 'boss':      content = TB.renderBossTab(); break;
      case 'arena':     content = TA.renderArenaTab(); break;
      case 'chat':      content = TC.renderChatTab(); break;
      case 'gift':      content = TA.renderGiftTab(); break;
    }

    body.innerHTML = tabsHTML + content;

    /* Wire tab buttons */
    body.querySelectorAll('.wf-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        S.activeTab = btn.dataset.tab;
        if (S.activeTab === 'chat') SOC.unreadChat = 0;
        API.updateBadges();
        render();
        onTabChange(S.activeTab);
      });
    });

    API.updateBadges();
    wireActiveTab();
  }

  /* ═══════════════════════════════════════════════════════════════
     ON TAB CHANGE — lazy load data
     ═══════════════════════════════════════════════════════════════ */
  function onTabChange(tab){
    switch (tab){
      case 'arena':
        API.fetchArena().then(() => TA.rerenderArena());
        API.fetchFeed().then(() => TA.rerenderFeed());
        break;
      case 'chat':
        API.fetchChat().then(() => TC.rerenderChat());
        TC.scrollChatToBottom?.();
        break;
      case 'gift':
        API.fetchGiftTargets().then(() => TA.rerenderGift());
        break;
      case 'quest':
        API.fetchQuests().then(() => TQ.rerenderQuests());
        break;
      case 'season':
        API.fetchSeason().then(() => TQ.rerenderSeason());
        break;
      case 'pet':
        API.fetchPets().then(() => TP.rerenderPets());
        break;
      case 'boss':
        API.fetchBoss().then(() => TB.rerenderBoss());
        break;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     WIRE ACTIVE TAB
     ═══════════════════════════════════════════════════════════════ */
  function wireActiveTab(){
    const body = document.getElementById('wfBody');
    if (!body) return;
    const t = S.activeTab;

    if (t === 'forge'){
      document.getElementById('wfForgeBtn')?.addEventListener('click', TF.doForge);
    }

    if (t === 'market'){
      body.querySelectorAll('[data-buy-mat]').forEach(b => {
        b.addEventListener('click', () => TS.doBuyMaterial(b.dataset.buyMat));
      });
      body.querySelectorAll('[data-buy-hammer]').forEach(b => {
        b.addEventListener('click', () => TS.doBuyHammer(b.dataset.buyHammer));
      });
      body.querySelectorAll('[data-equip-hammer]').forEach(b => {
        b.addEventListener('click', () => TS.doEquipHammer(b.dataset.equipHammer));
      });
      document.getElementById('wfRefillBtn')?.addEventListener('click', TS.doRefillEnergy);
    }

    if (t === 'inventory'){
      document.getElementById('wfSellBtn')?.addEventListener('click', TS.doSell);
    }

    if (t === 'quest')    TQ.wireQuest(body);
    if (t === 'season')   TQ.wireSeason(body);
    if (t === 'pet')      TP.wirePet(body);
    if (t === 'boss')     TB.wireBoss(body);
    if (t === 'arena')    TA.wireArena(body);
    if (t === 'chat')     TC.wireChat(body);
    if (t === 'gift')     TA.wireGift(body);
  }

  /* ═══════════════════════════════════════════════════════════════
     LOGIN WALL
     ═══════════════════════════════════════════════════════════════ */
  function renderLoginWall(){
    return `<div class="wf-login-wall">
      <div class="wf-login-wall-emoji">⚔️</div>
      <div class="wf-login-wall-title">Cần đăng nhập</div>
      <div class="wf-login-wall-sub">
        Đăng nhập để rèn vũ khí, làm quest, mùa giải, pet, boss và tương tác với người chơi khác.
      </div>
      <button class="wf-login-btn" id="wfLoginBtn" type="button">🔐 Đăng nhập</button>
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     OPEN / CLOSE
     ═══════════════════════════════════════════════════════════════ */
  async function openPage(){
    ensurePage();
    const page = document.getElementById('weaponPage');
    if (!page) return;

    S.user = U.getUser();
    if (!S.user){
      page.classList.add('show');
      page.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      render();
      return;
    }

    page.classList.add('show');
    page.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    render();

    /* ─── Load state (local + remote) ─── */
    const remote = await ST.pullRemote();
    const local = ST.loadLocal(S.user.id);
    S.state = ST.mergeState(local, remote?.state);
    ST.saveLocal(S.user.id, S.state);

    /* ─── Regen energy + display name ─── */
    regenEnergy(S.state, nowMs());
    const dn = S.user.displayName || S.user.username || '';
    if (dn) S.state.display_name = dn;
    checkAchievements(S.state);
    ST.scheduleSave();
    render();

    /* ─── Boot realtime + prefetch social data ─── */
    RT.boot();
    API.fetchArena();
    API.fetchFeed();
    API.fetchChat().then(() => { if (S.activeTab === 'chat') TC.rerenderChat(); });
    API.fetchQuests().then(() => TQ.rerenderQuests());
    API.fetchSeason().then(() => TQ.rerenderSeason());
    API.fetchPets().then(() => TP.rerenderPets());
    API.fetchBoss().then(() => TB.rerenderBoss());

    /* ─── Check active battle ─── */
    const activeId = ST.getActiveBattleId(S.user.id);
    if (activeId){
      const activeData = await API.fetchActiveBattle();
      if (activeData) S.activeBattleData = activeData;
    }
  }

  function closePage(){
    const page = document.getElementById('weaponPage');
    if (!page) return;

    page.classList.remove('show');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    TF.closeResult();
    window.__WF.modals?.removeModal('wsChallengeModal');
    window.__WF.modals?.removeModal('wsGiftModal');
    window.__WF.modals?.removeModal('wsPetFeedModal');
    BATTLE.closeBattle();
    RT.shutdown();

    if (S.state && S.user) ST.saveLocal(S.user.id, S.state);
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT — bind trigger button
     ═══════════════════════════════════════════════════════════════ */
  function bindTriggers(){
    const btn = document.getElementById('weaponBtn');
    if (btn && !btn.__wfBound){
      btn.__wfBound = true;
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openPage();
      });
    }
  }

  function boot(){
    ensurePage();
    bindTriggers();
    let tries = 0;
    const t = setInterval(() => {
      bindTriggers();
      if (++tries > 20) clearInterval(t);
    }, 300);
    U.log('v4.0 modular ready ✓ (16 modules)');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT INDEX (cần cho các module khác gọi render/rerender)
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.index = {
    render,
    wireActiveTab,
    onTabChange,
    renderLoginWall,
    openPage,
    closePage,
    ensurePage,
    // Bridge cho tab modules
    rerenderArena:   () => TA.rerenderArena(),
    rerenderFeed:    () => TA.rerenderFeed(),
    rerenderChat:    () => TC.rerenderChat(),
    rerenderQuests:  () => TQ.rerenderQuests(),
    rerenderSeason:  () => TQ.rerenderSeason(),
    rerenderPets:    () => TP.rerenderPets(),
    rerenderBoss:    () => TB.rerenderBoss(),
    rerenderGift:    () => TA.rerenderGift(),
  };

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API — window.WeaponForge (giữ tương thích v3.1)
     ═══════════════════════════════════════════════════════════════ */
  window.WeaponForge = {
    open: openPage,
    close: closePage,
    state: () => S.state,
    config: CFG,
    reset: () => {
      if (!S.user) return;
      localStorage.removeItem(ST.stateKey(S.user.id));
      localStorage.removeItem(ST.ACTIVE_BATTLE_KEY + S.user.id);
      S.state = ST.defaultState();
      render();
    },
    refresh: async () => {
      if (!S.user) return;
      const r = await ST.pullRemote();
      if (r && r.state){
        S.state = r.state;
        ST.saveLocal(S.user.id, S.state);
      }
      render();
    },
    rerender: render,
    openBattle: (id) => BATTLE.openBattle(id),
    goto: (tab) => {
      S.activeTab = tab;
      render();
      onTabChange(tab);
    },
    // Debug
    _S: S,
    _SOC: SOC,
    _modules: {
      config: C,
      utils: U,
      state: ST,
      api: API,
      tabForge: TF,
      tabShop: TS,
      tabQuest: TQ,
      tabPet: TP,
      tabBoss: TB,
      tabArena: TA,
      tabChat: TC,
      battle: BATTLE,
      realtime: RT,
    },
  };

  console.log('[WF] index.js ✓ — Weapon Forge v4.0 modular ready');
})();