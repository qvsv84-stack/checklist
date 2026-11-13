/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #14: BATTLE (PvP turn-based)
   - ensureBattleScreen: tạo DOM battle 1 lần
   - openBattle / closeBattle
   - refreshBattleState (RPC poll + realtime)
   - renderBattle: HP bar, turn indicator, log
   - doBattleAction: strike/heavy/defend/heal
   - Load: #14 (sau tab-chat)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.battle) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] battle.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const {
    esc, fmtGold, toast, getSb, log, escapeUrl, initialOf, avatarUrl,
    playSound, playWinSound, playLoseSound, playCritSound, playMissSound,
    numberPop, vibrate,
  } = U;

  /* ═══════════════════════════════════════════════════════════════
     ENSURE BATTLE SCREEN (tạo DOM 1 lần)
     ═══════════════════════════════════════════════════════════════ */
  function ensureBattleScreen(){
    let b = document.getElementById('wsBattleScreen');
    if (b) return b;

    b = document.createElement('div');
    b.id = 'wsBattleScreen';
    b.className = 'ws-battle';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = `
      <header class="ws-battle-head">
        <button class="ws-battle-head-btn" id="wsBattleBack" type="button" aria-label="Thoát">←</button>
        <div class="ws-battle-title">
          <span class="ws-battle-kicker">ĐẤU TRƯỜNG</span>
          <span class="ws-battle-name" id="wsBattleWager">—</span>
        </div>
        <button class="ws-battle-head-btn" id="wsBattleRefresh" type="button" aria-label="Refresh">↻</button>
      </header>
      <div class="ws-battle-arena" id="wsBattleArena">
        <div class="ws-battle-log" id="wsBattleLog"></div>
        <div class="ws-battle-vs">VS</div>
        <div class="ws-battle-fighters">
          <div class="ws-fighter" id="wsFighterMe">
            <div class="ws-fighter-avatar" id="wsFighterMeAv">?</div>
            <div class="ws-fighter-name" id="wsFighterMeName">Bạn</div>
            <div class="ws-fighter-hp">
              <div class="ws-fighter-hp-fill" id="wsFighterMeHpBar" style="width:100%"></div>
            </div>
            <div class="ws-fighter-hp-text" id="wsFighterMeHpText">—</div>
          </div>
          <div class="ws-battle-vs-mark">⚔️</div>
          <div class="ws-fighter" id="wsFighterThem">
            <div class="ws-fighter-avatar" id="wsFighterThemAv">?</div>
            <div class="ws-fighter-name" id="wsFighterThemName">Đối thủ</div>
            <div class="ws-fighter-hp">
              <div class="ws-fighter-hp-fill" id="wsFighterThemHpBar" style="width:100%"></div>
            </div>
            <div class="ws-fighter-hp-text" id="wsFighterThemHpText">—</div>
          </div>
        </div>
      </div>
      <div class="ws-battle-actions">
        <div class="ws-battle-turn-info" id="wsBattleTurnInfo">Đang tải…</div>
        <div class="ws-battle-btns">
          <button class="ws-battle-btn strike" data-bt-action="strike" type="button">
            ⚔️ Strike<small>90-110% dmg · 5% miss</small>
          </button>
          <button class="ws-battle-btn heavy" data-bt-action="heavy" type="button">
            💥 Heavy<small>130-160% · 15% miss · crit 20%</small>
          </button>
          <button class="ws-battle-btn defend" data-bt-action="defend" type="button">
            🛡️ Defend<small>+5% HP</small>
          </button>
          <button class="ws-battle-btn heal" data-bt-action="heal" type="button">
            💚 Heal<small>+15% HP</small>
          </button>
        </div>
      </div>
      <div class="ws-battle-result" id="wsBattleResult">
        <div class="ws-battle-result-card">
          <div class="ws-battle-result-emoji" id="wsBattleResEmoji">🏆</div>
          <div class="ws-battle-result-title" id="wsBattleResTitle">—</div>
          <div class="ws-battle-result-sub" id="wsBattleResSub">—</div>
          <button class="ws-battle-result-btn" id="wsBattleResOk" type="button">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(b);

    b.querySelector('#wsBattleBack').addEventListener('click', closeBattle);
    b.querySelector('#wsBattleRefresh').addEventListener('click', refreshBattleState);
    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.addEventListener('click', () => doBattleAction(btn.dataset.btAction, btn));
    });
    b.querySelector('#wsBattleResOk').addEventListener('click', () => {
      b.querySelector('#wsBattleResult').classList.remove('show');
      closeBattle();
    });
    return b;
  }

  /* ─── Button label map ─── */
  const BTN_LABELS = {
    strike: '⚔️ Strike<small>90-110% dmg · 5% miss</small>',
    heavy:  '💥 Heavy<small>130-160% · 15% miss · crit 20%</small>',
    defend: '🛡️ Defend<small>+5% HP</small>',
    heal:   '💚 Heal<small>+15% HP</small>',
  };

  function resetBattleButtons(b){
    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.disabled = true;
      if (BTN_LABELS[btn.dataset.btAction]) btn.innerHTML = BTN_LABELS[btn.dataset.btAction];
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     OPEN / CLOSE
     ═══════════════════════════════════════════════════════════════ */
  async function openBattle(matchId){
    if (!matchId) return;
    const b = ensureBattleScreen();
    S.currentBattleId = matchId;
    S.battleState = null;
    if (S.user) ST.saveActiveBattleId(S.user.id, matchId);

    b.classList.add('show');
    b.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset result
    const resEl = document.getElementById('wsBattleResult');
    if (resEl) resEl.classList.remove('show');

    // Reset buttons
    resetBattleButtons(b);

    // Clear log
    const logEl = document.getElementById('wsBattleLog');
    if (logEl) logEl.innerHTML = '';

    await refreshBattleState();
    subscribeBattle(matchId);
    startBattlePoll();
  }

  function closeBattle(){
    const b = document.getElementById('wsBattleScreen');
    if (b){
      b.classList.remove('show');
      b.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    stopBattlePoll();
    unsubscribeBattle();

    // Chỉ clear active battle nếu trận đã kết thúc
    if (S.battleState?.status !== 'fighting'){
      if (S.user) ST.saveActiveBattleId(S.user.id, null);
    }

    S.currentBattleId = null;
    S.battleState = null;
    S.activeBattleData = null;

    // Refresh arena nếu đang ở tab arena
    if (S.activeTab === 'arena'){
      API.fetchArena().then(() => window.__WF.tabArena?.rerenderArena?.());
      window.__WF.index?.render?.();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     POLL (fallback khi realtime fail)
     ═══════════════════════════════════════════════════════════════ */
  function startBattlePoll(){
    stopBattlePoll();
    S.battlePollTimer = setInterval(() => {
      if (document.hidden) return;
      if (!S.currentBattleId) return;
      if (S.battleState?.status !== 'fighting') return;
      refreshBattleState();
    }, CFG.BATTLE_POLL_MS);
  }

  function stopBattlePoll(){
    if (S.battlePollTimer){
      clearInterval(S.battlePollTimer);
      S.battlePollTimer = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     REALTIME SUB (channel riêng per matchId)
     ═══════════════════════════════════════════════════════════════ */
  function subscribeBattle(matchId){
    unsubscribeBattle();
    const sb = getSb();
    if (!sb || !sb.channel) return;
    try {
      S.battleChannel = sb.channel('wf-battle-' + matchId)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'srank_weapon_matches',
            filter: 'id=eq.' + matchId },
          payload => onBattleUpdate(payload.new))
        .subscribe(status => log('battle rt:', status));
    } catch(e){ log('battle rt sub', e); }
  }

  function unsubscribeBattle(){
    if (S.battleChannel){
      try { S.battleChannel.unsubscribe(); } catch(_){}
      S.battleChannel = null;
    }
  }

  function onBattleUpdate(row){
    if (!row) return;
    if (row.id !== S.currentBattleId) return;
    refreshBattleState();
  }

  /* ═══════════════════════════════════════════════════════════════
     REFRESH STATE
     ═══════════════════════════════════════════════════════════════ */
  async function refreshBattleState(){
    if (!S.currentBattleId) return;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_battle_state', { p_match_id: S.currentBattleId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      S.battleState = d;
      renderBattle(d);
    } catch(e){
      log('refreshBattleState', e);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  function renderBattle(st){
    const b = document.getElementById('wsBattleScreen');
    if (!b || !st) return;

    const me = st.is_challenger
      ? { id: st.challenger_id, name: st.challenger_name, hp: st.challenger_hp, max: st.challenger_max_hp, atk: st.challenger_atk }
      : { id: st.opponent_id,   name: st.opponent_name,   hp: st.opponent_hp,   max: st.opponent_max_hp,   atk: st.opponent_atk };
    const them = st.is_challenger
      ? { id: st.opponent_id,   name: st.opponent_name,   hp: st.opponent_hp,   max: st.opponent_max_hp,   atk: st.opponent_atk }
      : { id: st.challenger_id, name: st.challenger_name, hp: st.challenger_hp, max: st.challenger_max_hp, atk: st.challenger_atk };

    /* Wager header */
    const wg = document.getElementById('wsBattleWager');
    if (wg) wg.textContent = `Cược ${fmtGold(st.wager)}🪙 · Turn ${st.turn_number}`;

    /* Me fighter */
    const meAv = document.getElementById('wsFighterMeAv');
    if (meAv){
      const url = avatarUrl(me.name);
      if (url){
        meAv.innerHTML = `<img src="${escapeUrl(url)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initialOf(me.name)}'">`;
      } else {
        meAv.textContent = initialOf(me.name);
      }
    }
    const meName = document.getElementById('wsFighterMeName');
    if (meName) meName.textContent = me.name || 'Bạn';

    const meHpBar = document.getElementById('wsFighterMeHpBar');
    const meHpText = document.getElementById('wsFighterMeHpText');
    const meHpPct = me.max ? Math.max(0, Math.min(100, (me.hp / me.max) * 100)) : 0;
    if (meHpBar) meHpBar.style.width = meHpPct + '%';
    if (meHpText) meHpText.textContent = `${me.hp || 0} / ${me.max || 0}`;

    /* Them fighter */
    const themAv = document.getElementById('wsFighterThemAv');
    if (themAv){
      const url = avatarUrl(them.name);
      if (url){
        themAv.innerHTML = `<img src="${escapeUrl(url)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initialOf(them.name)}'">`;
      } else {
        themAv.textContent = initialOf(them.name);
      }
    }
    const themName = document.getElementById('wsFighterThemName');
    if (themName) themName.textContent = them.name || 'Đối thủ';

    const themHpBar = document.getElementById('wsFighterThemHpBar');
    const themHpText = document.getElementById('wsFighterThemHpText');
    const themHpPct = them.max ? Math.max(0, Math.min(100, (them.hp / them.max) * 100)) : 0;
    if (themHpBar) themHpBar.style.width = themHpPct + '%';
    if (themHpText) themHpText.textContent = `${them.hp || 0} / ${them.max || 0}`;

    /* Dead state */
    const meEl = document.getElementById('wsFighterMe');
    const themEl = document.getElementById('wsFighterThem');
    if (meEl) meEl.classList.toggle('dead', (me.hp || 0) <= 0);
    if (themEl) themEl.classList.toggle('dead', (them.hp || 0) <= 0);

    /* Turn indicator */
    if (meEl) meEl.querySelector('.ws-fighter-turn')?.remove();
    if (themEl) themEl.querySelector('.ws-fighter-turn')?.remove();
    if (st.status === 'fighting'){
      if (st.my_turn){
        meEl?.insertAdjacentHTML('beforeend', '<div class="ws-fighter-turn">▶</div>');
      } else {
        themEl?.insertAdjacentHTML('beforeend', '<div class="ws-fighter-turn">▶</div>');
      }
    }

    /* Turn info */
    const ti = document.getElementById('wsBattleTurnInfo');
    if (ti){
      if (st.status === 'fighting'){
        if (st.my_turn){
          ti.textContent = '🎯 Lượt của bạn!';
          ti.classList.add('my');
        } else {
          ti.textContent = '⏳ Chờ đối thủ…';
          ti.classList.remove('my');
        }
      } else if (st.status === 'resolved'){
        ti.textContent = '✅ Trận đã kết thúc';
        ti.classList.remove('my');
      } else {
        ti.textContent = '';
      }
    }

    /* Buttons */
    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.disabled = !(st.status === 'fighting' && st.my_turn);
    });

    /* Log */
    renderBattleLog(st);

    /* Result */
    if (st.status === 'resolved'){
      const iWon = st.winner_id === (st.is_challenger ? st.challenger_id : st.opponent_id);
      showBattleResult(iWon, st.wager);
    }
  }

  function renderBattleLog(st){
    const el = document.getElementById('wsBattleLog');
    if (!el || !Array.isArray(st.battle_log)) return;
    const meId = st.is_challenger ? 'challenger' : 'opponent';

    const lines = st.battle_log.slice(-8).map(entry => {
      if (entry.type === 'start'){
        return `<div class="ws-battle-log-item">⚔️ ${esc(entry.msg || 'Trận bắt đầu')}</div>`;
      }
      if (entry.type === 'end'){
        return `<div class="ws-battle-log-item end">🏆 ${esc(entry.msg || 'Kết thúc')}</div>`;
      }
      if (entry.type === 'timeout'){
        return `<div class="ws-battle-log-item end">⏱️ ${esc(entry.msg || 'AFK')}</div>`;
      }

      const who = entry.who === meId ? 'Bạn' : 'Đối thủ';
      let txt = '';
      let cls = '';

      if (entry.type === 'strike' || entry.type === 'heavy'){
        if (entry.miss){
          txt = `${who} ${entry.type === 'heavy' ? '💥 Heavy' : '⚔️ Strike'} → trượt!`;
          cls = 'miss';
        } else {
          txt = `${who} ${entry.type === 'heavy' ? '💥 Heavy' : '⚔️ Strike'} → -${entry.dmg} HP`;
          if (entry.crit){ txt += ' 💥 CRIT!'; cls = 'crit'; }
        }
      } else if (entry.type === 'defend'){
        txt = `${who} 🛡️ Defend (+5% HP)`;
      } else if (entry.type === 'heal'){
        txt = `${who} 💚 Heal (+15% HP)`;
      }

      return `<div class="ws-battle-log-item ${cls}">${txt}</div>`;
    }).join('');

    el.innerHTML = lines;
    el.scrollTop = el.scrollHeight;
  }

  /* ═══════════════════════════════════════════════════════════════
     RESULT MODAL
     ═══════════════════════════════════════════════════════════════ */
  function showBattleResult(iWon, wager){
    const el = document.getElementById('wsBattleResult');
    if (!el) return;
    if (el.classList.contains('show')) return;

    el.querySelector('#wsBattleResEmoji').textContent = iWon ? '🏆' : '💔';
    el.querySelector('#wsBattleResTitle').textContent = iWon ? 'Chiến thắng!' : 'Thất bại';
    el.querySelector('#wsBattleResSub').textContent = iWon
      ? `Bạn nhận lại ${fmtGold(Math.floor(wager * 2 * 0.95))}🪙 (thuế 5%)`
      : `Bạn mất ${fmtGold(wager)}🪙`;
    el.classList.add('show');

    if (iWon){
      playWinSound();
    } else {
      playLoseSound();
    }

    if (iWon){
      API.questProgress('duel_win', 1);
      API.seasonAddXP(CFG.SEASON_XP.duel_win);
    }

    setTimeout(async () => {
      const r = await ST.pullRemote();
      if (r && r.state){
        S.state = r.state;
        ST.saveLocal(S.user.id, S.state);
      }
      if (S.user) ST.saveActiveBattleId(S.user.id, null);
    }, 500);
  }

  /* ═══════════════════════════════════════════════════════════════
     ACTION
     ═══════════════════════════════════════════════════════════════ */
  async function doBattleAction(action, btn){
    if (!S.currentBattleId) return;
    if (S.battleState?.status !== 'fighting' || !S.battleState?.my_turn){
      toast('Chưa đến lượt', 'warning');
      return;
    }

    document.querySelectorAll('[data-bt-action]').forEach(b => { b.disabled = true; });
    if (btn) btn.textContent = '...';

    const sb = getSb();
    try {
      const res = await sb.rpc('rpc_weapon_battle_action', {
        p_match_id: S.currentBattleId,
        p_action: action,
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      /* Animate */
      const myFighter = document.getElementById('wsFighterMe');
      const theirFighter = document.getElementById('wsFighterThem');
      if (action === 'strike' || action === 'heavy'){
        if (!d.miss){
          myFighter?.classList.add('attacking');
          setTimeout(() => {
            theirFighter?.classList.add('hurt');
            setTimeout(() => {
              myFighter?.classList.remove('attacking');
              theirFighter?.classList.remove('hurt');
            }, 400);
          }, 150);
        }
        if (d.crit) numberPop('💥 CRIT!', '#fbbf24');
        else if (d.miss) numberPop('Miss', '#6b7280');
        else if (d.dmg) numberPop(`-${d.dmg}`, '#ef4444');
      }

      if (d.crit) playCritSound();
      else if (d.miss) playMissSound();
      else playSound(400, .08);

      vibrate(d.crit ? [30,20,30] : 20);

      await refreshBattleState();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không đánh được'), 'error');
      document.querySelectorAll('[data-bt-action]').forEach(b => { b.disabled = false; });
    } finally {
      document.querySelectorAll('[data-bt-action]').forEach(b => {
        if (BTN_LABELS[b.dataset.btAction]) b.innerHTML = BTN_LABELS[b.dataset.btAction];
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.battle = {
    ensureBattleScreen,
    openBattle,
    closeBattle,
    refreshBattleState,
    renderBattle,
    renderBattleLog,
    showBattleResult,
    doBattleAction,
    onBattleUpdate,
  };

  console.log('[WF] battle.js ✓');
})();