/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #9: TAB QUEST + SEASON
   - renderQuestTab: 5 daily quest, progress bar, claim button
   - renderSeasonTab: tier hiện tại, XP bar, 30 tiers scroll, free/premium
   - Actions: claim quest, claim season tier
   - Load: #9 (sau tab-shop)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabQuest) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] tab-quest.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const { seasonTierReward } = C;
  const { esc, fmtGold, toast, getSb, playSound, playNotifSound } = U;

  /* ─── Quest display metadata ─── */
  const QUEST_ICONS = {
    forge:'🔨', duel_win:'⚔️', chat:'💬', gift:'🎁',
    sell:'💰', enh_reach:'⬆️', boss_hit:'👹',
  };
  const QUEST_NAMES = {
    forge:'Rèn vũ khí', duel_win:'Thắng đấu trường',
    chat:'Chat', gift:'Tặng vàng', sell:'Bán vũ khí',
    enh_reach:'Đạt cấp X', boss_hit:'Đánh boss',
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER QUEST TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderQuestTab(){
    if (!SOC.quests) return '<div class="wf-history-empty">Đang tải quest…</div>';
    if (!SOC.quests.length) return '<div class="wf-history-empty">Không có quest hôm nay</div>';

    const cards = SOC.quests.map(q => {
      const data = q.quest_data || {};
      const type = data.type || q.quest_key.split('_')[0];
      const icon = QUEST_ICONS[type] || '📜';
      const name = QUEST_NAMES[type] || q.quest_key;
      const progress = q.progress || 0;
      const target = q.target || 1;
      const pct = Math.min(100, (progress/target)*100);
      const done = progress >= target && !q.claimed;
      const claimed = !!q.claimed;
      const cls = claimed ? 'claimed' : done ? 'done' : '';
      const gold = data.gold || 0;
      const mat = data.mat ? CFG.MATERIALS[data.mat] : null;

      return `
        <div class="ws-quest-card ${cls}">
          <div class="ws-quest-icon">${icon}</div>
          <div class="ws-quest-body">
            <div class="ws-quest-top">
              <div class="ws-quest-name">${esc(name)} ${target > 1 ? `(${target} lần)` : ''}</div>
              <div class="ws-quest-reward">🪙${gold}${mat ? ' + '+mat.emoji : ''}</div>
            </div>
            <div class="ws-quest-progress-bar">
              <div class="ws-quest-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="ws-quest-progress-text">${progress} / ${target}</div>
            ${claimed
              ? `<button class="ws-quest-claim" disabled>✓ Đã nhận</button>`
              : done
                ? `<button class="ws-quest-claim" data-quest-id="${q.id}" type="button">🎁 Nhận thưởng</button>`
                : `<button class="ws-quest-claim" disabled>Chưa hoàn thành</button>`}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="wf-section-title">📜 Nhiệm vụ hôm nay · Reset 0h</div>${cards}`;
  }

  function wireQuest(body){
    body.querySelectorAll('[data-quest-id]').forEach(btn => {
      btn.addEventListener('click', () => doQuestClaim(btn.dataset.questId, btn));
    });
  }

  function rerenderQuests(){
    if (S.activeTab !== 'quest') return;
    window.__WF.index?.render?.();
  }

  async function doQuestClaim(questId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wq_claim', { p_quest_id: Number(questId) });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`🎁 +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);

      // Reload state
      const r = await ST.pullRemote();
      if (r && r.state){ S.state = r.state; ST.saveLocal(S.user.id, S.state); }

      await API.fetchQuests();
      await API.seasonAddXP(CFG.SEASON_XP.quest_claim);
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER SEASON TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderSeasonTab(){
    if (!SOC.season) {
      return `
        <div class="wf-history-empty">
          Không có season đang hoạt động
        </div>
      `;
    }
    const season = SOC.season;
    const prog = SOC.seasonProgress || {
      xp: 0, tier: 0, premium: false,
      claimed_tiers: [], claimed_premium_tiers: [],
    };
    const curTier = prog.tier || 0;
    const xpInTier = prog.xp % CFG.SEASON_XP_PER_TIER;
    const xpPct = (xpInTier / CFG.SEASON_XP_PER_TIER) * 100;
    const claimedFree = new Set(Array.isArray(prog.claimed_tiers) ? prog.claimed_tiers : []);
    const claimedPrem = new Set(Array.isArray(prog.claimed_premium_tiers) ? prog.claimed_premium_tiers : []);

    let tierCards = '';
    for (let t = 1; t <= CFG.SEASON_MAX_TIER; t++){
      const unlocked = curTier >= t;
      const cFree = claimedFree.has(t);
      const cPrem = claimedPrem.has(t);
      const premUnlocked = unlocked && prog.premium;
      const freeR = seasonTierReward(t, false);
      const premR = seasonTierReward(t, true);
      const icon = t % 5 === 0 ? '🏆' : t % 3 === 0 ? '⭐' : '🎁';

      tierCards += `
        <div class="ws-season-tier ${unlocked?'unlocked':''} ${cFree?'claimed':''}">
          <div class="ws-season-tier-num-small">Tier ${t}</div>
          <div class="ws-season-tier-icon">${icon}</div>
          <div class="ws-season-tier-reward">🪙${freeR.gold}<br>${CFG.MATERIALS[freeR.mat].emoji}</div>
          ${unlocked
            ? (cFree
              ? `<button class="ws-season-tier-btn" disabled>✓</button>`
              : `<button class="ws-season-tier-btn" data-season-claim="${t}" data-premium="0" type="button">Nhận</button>`)
            : `<div class="ws-season-lock">🔒</div>`}
        </div>
        <div class="ws-season-tier premium ${premUnlocked?'unlocked':''} ${cPrem?'claimed':''}">
          <div class="ws-season-tier-num-small">Premium ${t}</div>
          <div class="ws-season-tier-icon">💎</div>
          <div class="ws-season-tier-reward">🪙${premR.gold}<br>${CFG.MATERIALS[premR.mat].emoji}</div>
          ${premUnlocked
            ? (cPrem
              ? `<button class="ws-season-tier-btn" disabled>✓</button>`
              : `<button class="ws-season-tier-btn" data-season-claim="${t}" data-premium="1" type="button">Nhận</button>`)
            : `<div class="ws-season-lock">🔒</div>`}
        </div>
      `;
    }

    return `
      <div class="ws-season-header">
        <div class="ws-season-name">🎫 ${esc(season.name)}</div>
        <div class="ws-season-tier-num">${curTier}<small>/ ${CFG.SEASON_MAX_TIER}</small></div>
        <div class="ws-season-xp-bar">
          <div class="ws-season-xp-fill" style="width:${xpPct}%"></div>
        </div>
        <div class="ws-season-xp-text">
          ${xpInTier} / ${CFG.SEASON_XP_PER_TIER} XP đến tier ${Math.min(CFG.SEASON_MAX_TIER, curTier+1)}
        </div>
      </div>
      <div class="wf-section-title">🎁 Phần thưởng 30 tier</div>
      <div class="ws-season-track">${tierCards}</div>
      <div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:8px;">
        Premium: ×2 thưởng + vật liệu cao cấp
      </div>
    `;
  }

  function wireSeason(body){
    body.querySelectorAll('[data-season-claim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = Number(btn.dataset.seasonClaim);
        const premium = btn.dataset.premium === '1';
        doSeasonClaim(tier, premium, btn);
      });
    });
  }

  function rerenderSeason(){
    if (S.activeTab !== 'season') return;
    window.__WF.index?.render?.();
  }

  async function doSeasonClaim(tier, premium, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_ws_claim_tier', { p_tier: tier, p_premium: premium });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`🎁 Tier ${tier} · +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playNotifSound();

      const r = await ST.pullRemote();
      if (r && r.state){ S.state = r.state; ST.saveLocal(S.user.id, S.state); }

      await API.fetchSeason();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabQuest = {
    renderQuestTab, wireQuest, rerenderQuests, doQuestClaim,
    renderSeasonTab, wireSeason, rerenderSeason, doSeasonClaim,
  };

  console.log('[WF] tab-quest.js ✓');
})();