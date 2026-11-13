/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #12: TAB ARENA + GIFT
   - renderArenaTab: stats card, 4 sub-tabs (Lời mời/Đấu thủ/Đang đấu/Lịch sử), feed
   - renderGiftTab: danh sách user để tặng vàng
   - Actions: accept/reject duel, wire sub-tabs
   - Load: #12 (sau tab-boss)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabArena) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  const MODALS = window.__WF.modals;
  if (!C || !U || !ST || !API || !MODALS) {
    console.error('[WF] tab-arena.js thiếu dependency');
    return;
  }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const {
    esc, fmtGold, fmtTime, toast, getSb,
    renderAvatarHtml, playSound, vibrate, playNotifSound,
  } = U;

  /* ═══════════════════════════════════════════════════════════════
     RENDER ARENA TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderArenaTab(){
    if (!SOC.arena) return '<div class="wf-history-empty">Đang tải đấu trường…</div>';
    const d = SOC.arena;

    return `
      <div class="ws-stats-card">
        <div class="ws-stat-cell">
          <div class="ws-stat-label">ELO</div>
          <div class="ws-stat-value gold">${d.stats.elo}</div>
        </div>
        <div class="ws-stat-cell">
          <div class="ws-stat-label">Thắng</div>
          <div class="ws-stat-value pos">${d.stats.wins}</div>
        </div>
        <div class="ws-stat-cell">
          <div class="ws-stat-label">Thua</div>
          <div class="ws-stat-value neg">${d.stats.losses}</div>
        </div>
        <div class="ws-stat-cell">
          <div class="ws-stat-label">Tổng thắng</div>
          <div class="ws-stat-value">${fmtGold(d.stats.total_won)}🪙</div>
        </div>
      </div>

      <div class="ws-subtabs">
        <button class="ws-subtab ${S.arenaSubTab==='incoming'?'active':''}" data-ws-sub="incoming" type="button">
          ⚔️ Lời mời${d.incoming.length?' <span class="ws-subtab-count">'+d.incoming.length+'</span>':''}
        </button>
        <button class="ws-subtab ${S.arenaSubTab==='players'?'active':''}" data-ws-sub="players" type="button">
          👥 Đấu thủ
        </button>
        <button class="ws-subtab ${S.arenaSubTab==='active'?'active':''}" data-ws-sub="active" type="button">
          🔥 Đang đấu
        </button>
        <button class="ws-subtab ${S.arenaSubTab==='history'?'active':''}" data-ws-sub="history" type="button">
          📜 Lịch sử
        </button>
      </div>

      <div id="wsArenaContent">${renderArenaContent(d)}</div>

      <div class="wf-section-title" style="margin-top:20px;">📡 Hoạt động</div>
      <div class="ws-feed" id="wsFeedList">${renderFeedList()}</div>
    `;
  }

  function renderArenaContent(d){
    /* ─── Incoming challenges ─── */
    if (S.arenaSubTab === 'incoming'){
      if (!d.incoming.length) return '<div class="wf-history-empty">Không có lời thách đấu</div>';
      return d.incoming.map(m => `
        <div class="ws-challenge-card">
          ${renderAvatarHtml(m.opponent_name, 'ws-cc-avatar')}
          <div class="ws-cc-body">
            <div class="ws-cc-name">${esc(m.opponent_name)}</div>
            <div class="ws-cc-meta">⚡ ${Math.round(m.opponent_power)} · Cược <b>${fmtGold(m.wager)}🪙</b></div>
          </div>
          <div class="ws-cc-actions">
            <button class="ws-btn small reject" data-ws-reject="${m.id}" type="button">Từ chối</button>
            <button class="ws-btn small accept" data-ws-accept="${m.id}" type="button">Nhận</button>
          </div>
        </div>
      `).join('');
    }

    /* ─── Players list ─── */
    if (S.arenaSubTab === 'players'){
      if (!d.players.length) return '<div class="wf-history-empty">Chưa có ai</div>';
      return d.players.map(p => `
        <div class="ws-player-row">
          ${renderAvatarHtml(p.display_name, 'ws-pr-avatar')}
          <div class="ws-pr-body">
            <div class="ws-pr-name">${esc(p.display_name)}</div>
            <div class="ws-pr-meta">ELO ${p.elo} · ${p.wins}W/${p.losses}L</div>
          </div>
          <button class="ws-btn small primary" data-ws-challenge="${p.user_id}" data-ws-name="${esc(p.display_name)}" type="button">Thách</button>
        </div>
      `).join('');
    }

    /* ─── Active battle ─── */
    if (S.arenaSubTab === 'active'){
      const b = S.activeBattleData;
      if (!b) return '<div class="wf-history-empty">Không có trận đang đấu</div>';
      const oppName = b.is_challenger ? b.opponent_name : b.challenger_name;
      return `<div class="ws-battle-list-item">
        ${renderAvatarHtml(oppName, 'ws-cc-avatar')}
        <div class="ws-cc-body">
          <div class="ws-cc-name">vs ${esc(oppName)}</div>
          <div class="ws-cc-meta">Đang đấu · Cược ${fmtGold(b.wager)}🪙 · Turn ${b.turn_number}</div>
        </div>
        <button class="ws-btn small primary" data-ws-rejoin="${b.id}" type="button">Vào</button>
      </div>`;
    }

    /* ─── History ─── */
    if (S.arenaSubTab === 'history'){
      if (!d.history.length) return '<div class="wf-history-empty">Chưa có trận nào</div>';
      const meId = S.user?.id;
      return d.history.map(h => {
        const other = h.challenger_id === meId ? h.opponent_name : h.challenger_name;
        const iWon = h.i_won;
        const badge = h.status === 'expired' ? '⏱️ Hết hạn'
          : h.status === 'rejected' ? '✕ Từ chối'
          : iWon ? '🏆 Thắng' : '💔 Thua';
        const cls = iWon ? 'won' : h.status === 'resolved' ? 'lost' : '';
        return `<div class="ws-history-row ${cls}">
          <div class="ws-hr-badge">${badge}</div>
          <div class="ws-hr-body">
            <div class="ws-hr-name">vs ${esc(other)}</div>
            <div class="ws-hr-meta">Cược ${fmtGold(h.wager)}🪙 · ${fmtTime(h.resolved_at||h.created_at)}</div>
          </div>
        </div>`;
      }).join('');
    }

    return '';
  }

  function renderFeedList(){
    if (!SOC.feed.length) return '<div class="wf-history-empty">Chưa có hoạt động</div>';
    return SOC.feed.slice(0, 20).map(f => {
      const icon = f.type === 'duel_win' ? '⚔️'
        : f.type === 'gift_sent' ? '🎁'
        : f.type === 'gift_received' ? '🎁'
        : '✨';
      return `<div class="ws-feed-item">
        <span class="ws-fi-icon">${icon}</span>
        <span class="ws-fi-text"><b>${esc(f.display_name||'Ai đó')}</b> ${esc(f.message)}</span>
        <span class="ws-fi-time">${fmtTime(f.created_at)}</span>
      </div>`;
    }).join('');
  }

  function wireArena(body){
    body.querySelectorAll('.ws-subtab').forEach(b => {
      b.addEventListener('click', async () => {
        S.arenaSubTab = b.dataset.wsSub;
        if (S.arenaSubTab === 'active'){
          S.activeBattleData = await API.fetchActiveBattle();
        }
        window.__WF.index?.render?.();
      });
    });

    const content = document.getElementById('wsArenaContent');
    if (content){
      content.querySelectorAll('[data-ws-accept]').forEach(b => {
        b.addEventListener('click', () => acceptDuel(b.dataset.wsAccept, b));
      });
      content.querySelectorAll('[data-ws-reject]').forEach(b => {
        b.addEventListener('click', () => rejectDuel(b.dataset.wsReject, b));
      });
      content.querySelectorAll('[data-ws-challenge]').forEach(b => {
        b.addEventListener('click', () => MODALS.openChallengeModal(b.dataset.wsChallenge, b.dataset.wsName));
      });
      content.querySelectorAll('[data-ws-rejoin]').forEach(b => {
        b.addEventListener('click', () => window.__WF.battle?.openBattle?.(b.dataset.wsRejoin));
      });
    }
  }

  function rerenderArena(){
    if (S.activeTab !== 'arena') return;
    const content = document.getElementById('wsArenaContent');
    if (content && SOC.arena){
      content.innerHTML = renderArenaContent(SOC.arena);
      wireArena(document.getElementById('wfBody'));
    }
    const feed = document.getElementById('wsFeedList');
    if (feed) feed.innerHTML = renderFeedList();
  }

  function rerenderFeed(){
    const feed = document.getElementById('wsFeedList');
    if (feed) feed.innerHTML = renderFeedList();
  }

  /* ═══════════════════════════════════════════════════════════════
     DUEL ACTIONS
     ═══════════════════════════════════════════════════════════════ */
  async function acceptDuel(matchId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_battle_start', { p_match_id: matchId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      if (S.user) ST.saveActiveBattleId(S.user.id, matchId);
      toast('⚔️ Trận đấu bắt đầu!', 'success');
      playNotifSound();
      vibrate([40,30,40]);

      await API.fetchArena();
      window.__WF.battle?.openBattle?.(matchId);
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không bắt đầu được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  async function rejectDuel(matchId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_duel_reject', { p_match_id: matchId });
      if (res.error) throw res.error;

      toast('Đã từ chối');
      playSound(500, .1);
      await API.fetchArena();
      rerenderArena();
    } catch(e){
      toast('Lỗi', 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER GIFT TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderGiftTab(){
    if (!SOC.giftTargets.length) return '<div class="wf-history-empty">Chưa có ai</div>';
    return '<div class="wf-section-title">🎁 Tặng vàng cho người chơi</div>' +
      SOC.giftTargets.map(p => `
        <div class="ws-gift-row">
          ${renderAvatarHtml(p.display_name, 'ws-gift-av')}
          <div class="ws-gift-body">
            <div class="ws-gift-name">${esc(p.display_name)}</div>
            <div class="ws-gift-meta">+${p.enh} · ⚡${Math.round(p.best_power)}</div>
          </div>
          <button class="ws-btn small primary" data-ws-gift="${p.user_id}" data-ws-gift-name="${esc(p.display_name)}" type="button">🎁 Tặng</button>
        </div>
      `).join('');
  }

  function wireGift(body){
    body.querySelectorAll('[data-ws-gift]').forEach(b => {
      b.addEventListener('click', () => {
        MODALS.openGiftModal(b.dataset.wsGift, b.dataset.wsGiftName);
      });
    });
  }

  function rerenderGift(){
    if (S.activeTab === 'gift') window.__WF.index?.render?.();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabArena = {
    renderArenaTab, wireArena, rerenderArena, rerenderFeed,
    renderArenaContent, renderFeedList,
    acceptDuel, rejectDuel,
    renderGiftTab, wireGift, rerenderGift,
  };

  console.log('[WF] tab-arena.js ✓');
})();