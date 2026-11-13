/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #11: TAB BOSS
   - renderBossTab: HP bar, level, stats, attack/claim buttons
   - Actions: attack (10s cooldown server-side), claim reward, spawn boss
   - Load: #11 (sau tab-pet)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabBoss) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] tab-boss.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const { powerOf } = C;
  const {
    esc, fmtGold, toast, getSb, playSound,
    playVictorySound, vibrate, numberPop,
  } = U;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  function renderBossTab(){
    if (!SOC.boss){
      return `
        <div class="wf-history-empty">
          Đang tìm boss…<br>
          <button class="ws-btn primary" id="wsBossSpawn" type="button" style="margin-top:12px;">
            👹 Triệu hồi boss
          </button>
        </div>
      `;
    }

    const b = SOC.boss;
    const my = SOC.bossMy || { damage:0, attempts:0, claimed:false, rank:0 };
    const hpPct = Math.max(0, Math.min(100, (b.current_hp / b.max_hp) * 100));
    const defeated = b.status === 'defeated';
    const emoji = { dragon:'🐉', titan:'👹', demon:'😈' }[b.boss_key] || '👹';

    return `
      <div class="ws-boss-card ${defeated?'defeated':''}">
        <div class="ws-boss-top">
          <div class="ws-boss-emoji">${emoji}</div>
          <div class="ws-boss-info">
            <div class="ws-boss-name">${esc(b.boss_name)}</div>
            <div class="ws-boss-level">Lv ${b.level} · ${defeated ? 'ĐÃ BỊ ĐÁNH BẠI' : 'Đang hoạt động'}</div>
          </div>
        </div>

        <div class="ws-boss-hp-bar">
          <div class="ws-boss-hp-fill" style="width:${hpPct}%"></div>
        </div>
        <div class="ws-boss-hp-text">${fmtGold(b.current_hp)} / ${fmtGold(b.max_hp)} HP</div>

        <div class="ws-boss-actions">
          ${defeated
            ? (my.claimed
              ? `<button class="ws-boss-btn" disabled>✓ Đã nhận thưởng</button>`
              : my.damage > 0
                ? `<button class="ws-boss-btn green" id="wsBossClaim" data-boss-id="${b.id}" type="button">🎁 Nhận thưởng</button>`
                : `<button class="ws-boss-btn" disabled>Không tham gia</button>`)
            : `<button class="ws-boss-btn" id="wsBossAttack" type="button">⚔️ Đánh boss</button>`}
        </div>

        <div class="ws-boss-stats">
          <div class="ws-boss-stat">
            <div class="ws-boss-stat-label">Damage</div>
            <div class="ws-boss-stat-value">${fmtGold(my.damage)}</div>
          </div>
          <div class="ws-boss-stat">
            <div class="ws-boss-stat-label">Rank</div>
            <div class="ws-boss-stat-value">${my.rank > 0 ? '#'+my.rank : '—'}</div>
          </div>
          <div class="ws-boss-stat">
            <div class="ws-boss-stat-label">Tham gia</div>
            <div class="ws-boss-stat-value pos">${SOC.bossTotal}</div>
          </div>
        </div>
      </div>

      ${!defeated ? `
        <div class="wf-section-title">💡 Cách chơi</div>
        <div style="padding:12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.3);border-radius:12px;font-size:12px;font-weight:700;color:#78350f;line-height:1.5;">
          • Đánh boss với damage = <b>power × 15</b> (max)<br>
          • Cooldown 10s giữa các đòn<br>
          • Boss có 6h để bị đánh bại<br>
          • Top 1 = 2000🪙 + Mythril, Top 2-3 = 1000🪙 + Thép, Top 4-10 = 500🪙
        </div>
      ` : ''}
    `;
  }

  function wireBoss(body){
    body.querySelectorAll('#wsBossAttack').forEach(b => {
      b.addEventListener('click', () => doBossAttack(b));
    });
    body.querySelectorAll('#wsBossClaim').forEach(b => {
      b.addEventListener('click', () => doBossClaim(b.dataset.bossId, b));
    });
    body.querySelectorAll('#wsBossSpawn').forEach(b => {
      b.addEventListener('click', () => doBossSpawn(b));
    });
  }

  function rerenderBoss(){
    if (S.activeTab !== 'boss') return;
    window.__WF.index?.render?.();
  }

  /* ═══════════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════════ */
  async function doBossAttack(btn){
    if (S.bossAttacking) return;
    if (!SOC.boss || SOC.boss.status !== 'active'){
      toast('Boss đã chết', 'warning');
      return;
    }
    if (btn) btn.disabled = true;
    S.bossAttacking = true;
    const sb = getSb();
    if (!sb){ S.bossAttacking = false; return; }

    try {
      const myPower = powerOf(S.state.enh);
      const baseDmg = Math.floor(myPower * 15);
      const variance = 0.9 + Math.random() * 0.2;
      const dmg = Math.max(100, Math.floor(baseDmg * variance));

      const res = await sb.rpc('rpc_wb_attack', { p_damage: dmg });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`⚔️ -${fmtGold(d.damage)} HP${d.defeated?' · BOSS CHẾT!':''}`, d.defeated ? 'success' : 'info');
      numberPop(`-${fmtGold(d.damage)} HP`, '#ef4444');

      if (d.defeated){
        playVictorySound();
        vibrate([30,30,30,30,60]);
      } else {
        playSound(400, .1);
        vibrate(20);
      }

      await API.seasonAddXP(CFG.SEASON_XP.boss_hit);
      await API.questProgress('boss_hit', 1);
      await API.fetchBoss();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không đánh được'), 'error');
      if (btn) btn.disabled = false;
    } finally {
      S.bossAttacking = false;
    }
  }

  async function doBossClaim(bossId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wb_claim_reward', { p_boss_id: bossId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`🎁 #${d.rank} · +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playVictorySound();

      const r = await ST.pullRemote();
      if (r && r.state){ S.state = r.state; ST.saveLocal(S.user.id, S.state); }

      await API.fetchBoss();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  async function doBossSpawn(btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wb_spawn_boss');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast('👹 Boss xuất hiện!', 'success');
      playSound(400, .2, 'sawtooth');

      await API.fetchBoss();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không triệu hồi được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabBoss = {
    renderBossTab,
    wireBoss,
    rerenderBoss,
    doBossAttack,
    doBossClaim,
    doBossSpawn,
  };

  console.log('[WF] tab-boss.js ✓');
})();