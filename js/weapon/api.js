/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #5: API FETCHERS + BADGES
   - Fetch: arena, chat, feed, giftTargets, quests, season, pets, boss
   - Progress hooks: quest, season XP
   - Badges update trên tab
   - Không render UI phức tạp
   - Load: #5 (sau state)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.api) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  if (!C || !U || !ST) { console.error('[WF] api.js cần config + utils + state load trước'); return; }

  const CFG = C.CFG;
  const SOC = ST.SOC;
  const { getSb, log } = U;

  /* ═══════════════════════════════════════════════════════════════
     BADGES
     ═══════════════════════════════════════════════════════════════ */
  function setBadge(tabKey, count){
    const b = document.querySelector(`.wf-tab[data-tab="${tabKey}"] .wf-tab-badge`);
    if (!b) return;
    if (count > 0){
      b.textContent = count > 99 ? '99+' : String(count);
      b.style.display = '';
    } else {
      b.style.display = 'none';
    }
  }

  function updateBadges(){
    setBadge('arena', SOC.pendingChallenges);
    setBadge('chat', SOC.unreadChat);
    setBadge('quest', SOC.unclaimedQuests);
    setBadge('season', SOC.unclaimedSeason);
    setBadge('boss', SOC.claimableBoss ? 1 : 0);
  }

  /* ═══════════════════════════════════════════════════════════════
     SOCIAL FETCHERS
     ═══════════════════════════════════════════════════════════════ */
  async function fetchArena(){
    const sb = getSb(); if (!sb || !sb.rpc) return null;
    try {
      const res = await sb.rpc('rpc_weapon_arena_data');
      if (res.error) throw res.error;
      if (!res.data || res.data.ok !== true) throw new Error(res.data?.error || 'Lỗi');
      SOC.arena = res.data;
      SOC.pendingChallenges = (res.data.incoming||[]).length;
      updateBadges();
      return res.data;
    } catch(e){ log('fetchArena', e.message); return null; }
  }

  async function fetchChat(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_get_chat', { p_limit: 80 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){
        SOC.chat = d.data;
        return d.data;
      }
    } catch(e){ log('fetchChat', e.message); }
    return SOC.chat;
  }

  async function fetchFeed(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_feed', { p_limit: 30 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){
        SOC.feed = d.data;
        return d.data;
      }
    } catch(e){ log('fetchFeed', e.message); }
    return SOC.feed;
  }

  async function fetchGiftTargets(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_gift_targets', { p_limit: 50 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){
        SOC.giftTargets = d.data;
        return d.data;
      }
    } catch(e){ log('fetchGift', e.message); }
    return SOC.giftTargets;
  }

  async function fetchActiveBattle(){
    const ST_S = ST.S;
    const me = ST_S.user; if (!me) return null;
    const matchId = ST_S.currentBattleId || ST.getActiveBattleId(me.id);
    if (!matchId) return null;
    const sb = getSb(); if (!sb) return null;
    try {
      const res = await sb.rpc('rpc_weapon_battle_state', { p_match_id: matchId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok){ ST.saveActiveBattleId(me.id, null); return null; }
      if (d.status === 'fighting') return d;
      ST.saveActiveBattleId(me.id, null);
      return null;
    } catch(_){ return null; }
  }

  /* ═══════════════════════════════════════════════════════════════
     V4 FETCHERS: QUEST / SEASON / PET / BOSS
     ═══════════════════════════════════════════════════════════════ */
  async function fetchQuests(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wq_get_quests');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.quests = Array.isArray(d.data) ? d.data : [];
        SOC.questsDayKey = d.day_key || '';
        SOC.unclaimedQuests = SOC.quests.filter(q => !q.claimed && q.progress >= q.target).length;
        updateBadges();
      }
    } catch(e){ log('fetchQuests', e.message); }
  }

  async function fetchSeason(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_ws_get_season');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.season = d.season;
        SOC.seasonProgress = d.progress;
        if (d.season && d.progress){
          const claimedFree = new Set(d.progress.claimed_tiers || []);
          const claimedPrem = new Set(d.progress.claimed_premium_tiers || []);
          let unclaimed = 0;
          for (let t = 1; t <= (d.progress.tier || 0); t++){
            if (!claimedFree.has(t)) unclaimed++;
            if (d.progress.premium && !claimedPrem.has(t)) unclaimed++;
          }
          SOC.unclaimedSeason = unclaimed;
        } else {
          SOC.unclaimedSeason = 0;
        }
        updateBadges();
      }
    } catch(e){ log('fetchSeason', e.message); }
  }

  async function fetchPets(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wp_get_pets');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true) SOC.pets = Array.isArray(d.data) ? d.data : [];
    } catch(e){ log('fetchPets', e.message); }
  }

  async function fetchBoss(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wb_get_current_boss');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.boss = d.boss || null;
        SOC.bossMy = d.my || null;
        SOC.bossTotal = d.total_participants || 0;
        SOC.claimableBoss = !!(
          SOC.boss && SOC.boss.status === 'defeated' &&
          SOC.bossMy && SOC.bossMy.damage > 0 && !SOC.bossMy.claimed
        );
        updateBadges();
      }
    } catch(e){ log('fetchBoss', e.message); }
  }

  /* ═══════════════════════════════════════════════════════════════
     PROGRESS HOOKS
     ═══════════════════════════════════════════════════════════════ */
  async function questProgress(type, delta){
    if (delta == null) delta = 1;
    if (delta <= 0) return;
    const sb = getSb(); if (!sb) return;
    try {
      await sb.rpc('rpc_wq_update_progress', { p_quest_type: type, p_delta: delta });
    } catch(_){}
  }

  async function seasonAddXP(amount){
    if (!amount || amount <= 0) return;
    const sb = getSb(); if (!sb) return;
    try { await sb.rpc('rpc_ws_add_xp', { p_amount: amount }); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.api = {
    // Badges
    setBadge, updateBadges,
    // Social
    fetchArena, fetchChat, fetchFeed, fetchGiftTargets, fetchActiveBattle,
    // V4
    fetchQuests, fetchSeason, fetchPets, fetchBoss,
    // Hooks
    questProgress, seasonAddXP,
  };

  console.log('[WF] api.js ✓');
})();