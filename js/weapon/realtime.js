/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #15: REALTIME (Supabase channels)
   - Social channel: chat/matches/feed (INSERT + UPDATE)
   - Boss channel: bosses/boss_damage
   - Boss poll fallback
   - Battle channel do battle.js tự lo (per-match)
   - Load: #15 (sau battle)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.realtime) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] realtime.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const { getSb, log, toast, playNotifSound, vibrate } = U;

  let _socialChannel = null;
  let _bossChannel = null;
  let _bossPollTimer = null;

  /* ═══════════════════════════════════════════════════════════════
     SOCIAL CHANNEL
     ═══════════════════════════════════════════════════════════════ */
  function subscribeSocial(){
    const sb = getSb();
    if (!sb || !sb.channel || _socialChannel) return;

    try {
      _socialChannel = sb.channel('wf-social-rt')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'srank_weapon_chat' },
          payload => onNewChat(payload.new))
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'srank_weapon_matches' },
          payload => onNewMatch(payload.new))
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'srank_weapon_matches' },
          payload => onMatchUpdate(payload.new))
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'srank_weapon_feed' },
          payload => onNewFeed(payload.new))
        .subscribe(status => {
          log('social rt:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
            _socialChannel = null;
          }
        });
    } catch(e){ log('social rt sub', e); }
  }

  function unsubscribeSocial(){
    if (_socialChannel){
      try { _socialChannel.unsubscribe(); } catch(_){}
      _socialChannel = null;
    }
  }

  function onNewChat(row){
    window.__WF.tabChat?.onNewChatMessage?.(row);
  }

  function onNewMatch(row){
    if (!row) return;
    const me = S.user;
    if (!me || row.opponent_id !== me.id || row.status !== 'pending') return;

    SOC.pendingChallenges++;
    API.updateBadges();
    toast('⚔️ Có người thách đấu bạn!', 'person');
    playNotifSound();
    vibrate([40,30,40]);

    if (S.activeTab === 'arena'){
      API.fetchArena().then(() => window.__WF.tabArena?.rerenderArena?.());
    }
  }

  function onMatchUpdate(row){
    if (!row) return;
    const me = S.user;
    if (!me || (row.challenger_id !== me.id && row.opponent_id !== me.id)) return;

    if (row.status === 'fighting'){
      if (!S.currentBattleId || S.currentBattleId !== row.id){
        if (S.user) ST.saveActiveBattleId(S.user.id, row.id);
        toast('⚔️ Đối thủ đã chấp nhận — vào trận!', 'success');
        playNotifSound();

        const weaponPageOpen = document.getElementById('weaponPage')?.classList.contains('show');
        if (weaponPageOpen && !S.currentBattleId){
          setTimeout(() => {
            if (!S.currentBattleId) window.__WF.battle?.openBattle?.(row.id);
          }, 800);
        }
        if (S.activeTab === 'arena'){
          API.fetchArena().then(() => window.__WF.tabArena?.rerenderArena?.());
        }
      }
    } else if (row.status === 'resolved'){
      if (S.currentBattleId === row.id){
        window.__WF.battle?.refreshBattleState?.();
      } else {
        const iWon = row.winner_id === me.id;
        toast(iWon ? '🏆 Bạn thắng duel!' : '💔 Bạn thua duel', iWon ? 'success' : 'error');
        if (S.user) ST.saveActiveBattleId(S.user.id, null);
        ST.pullRemote().then(r => {
          if (r && r.state){
            S.state = r.state;
            ST.saveLocal(me.id, S.state);
            window.__WF.index?.render?.();
          }
        });
      }
    }
  }

  function onNewFeed(row){
    if (!row) return;
    if (SOC.feed.some(f => f.id === row.id)) return;
    SOC.feed.unshift(row);
    if (SOC.feed.length > 100) SOC.feed = SOC.feed.slice(0, 100);
    window.__WF.tabArena?.rerenderFeed?.();
  }

  /* ═══════════════════════════════════════════════════════════════
     BOSS CHANNEL
     ═══════════════════════════════════════════════════════════════ */
  function subscribeBoss(){
    const sb = getSb();
    if (!sb || !sb.channel || _bossChannel) return;

    try {
      _bossChannel = sb.channel('wf-boss-rt')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'srank_weapon_bosses' },
          () => {
            if (S.activeTab === 'boss'){
              API.fetchBoss().then(() => window.__WF.tabBoss?.rerenderBoss?.());
            } else {
              // Cập nhật badge nếu boss vừa bị đánh bại
              API.fetchBoss();
            }
          })
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'srank_weapon_boss_damage' },
          () => {
            if (S.activeTab === 'boss'){
              API.fetchBoss().then(() => window.__WF.tabBoss?.rerenderBoss?.());
            }
          })
        .subscribe(status => {
          log('boss rt:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
            _bossChannel = null;
          }
        });
    } catch(e){ log('boss rt sub', e); }
  }

  function unsubscribeBoss(){
    if (_bossChannel){
      try { _bossChannel.unsubscribe(); } catch(_){}
      _bossChannel = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     BOSS POLL (fallback)
     ═══════════════════════════════════════════════════════════════ */
  function startBossPoll(){
    stopBossPoll();
    _bossPollTimer = setInterval(() => {
      if (document.hidden) return;
      if (S.activeTab !== 'boss') return;
      API.fetchBoss().then(() => window.__WF.tabBoss?.rerenderBoss?.());
    }, CFG.BOSS_POLL_MS);
  }

  function stopBossPoll(){
    if (_bossPollTimer){
      clearInterval(_bossPollTimer);
      _bossPollTimer = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT / SHUTDOWN
     ═══════════════════════════════════════════════════════════════ */
  function boot(){
    subscribeSocial();
    subscribeBoss();
    startBossPoll();
  }

  function shutdown(){
    unsubscribeSocial();
    unsubscribeBoss();
    stopBossPoll();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.realtime = {
    boot,
    shutdown,
    subscribeSocial,
    unsubscribeSocial,
    subscribeBoss,
    unsubscribeBoss,
    startBossPoll,
    stopBossPoll,
    // Handlers export cho debug
    onNewChat,
    onNewMatch,
    onMatchUpdate,
    onNewFeed,
  };

  console.log('[WF] realtime.js ✓');
})();