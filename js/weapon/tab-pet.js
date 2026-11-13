/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #10: TAB PET
   - renderPetTab: grid 4 pet (owned + locked), level, XP bar, actions
   - Actions: adopt (mua), set active, feed (mở modal #6)
   - Load: #10 (sau tab-quest)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabPet) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  const MODALS = window.__WF.modals;
  if (!C || !U || !ST || !API || !MODALS) {
    console.error('[WF] tab-pet.js thiếu dependency');
    return;
  }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const { esc, fmtGold, toast, getSb, playSound, playNotifSound } = U;

  /* ═══════════════════════════════════════════════════════════════
     RENDER PET TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderPetTab(){
    const owned = new Map(SOC.pets.map(p => [p.pet_key, p]));
    const myGold = S.state?.gold || 0;

    let grid = '<div class="ws-pet-grid">';

    Object.keys(CFG.PETS).forEach(key => {
      const cfg = CFG.PETS[key];
      const p = owned.get(key);

      if (p){
        /* ─── Owned pet ─── */
        const xpInLevel = p.xp % CFG.PET_XP_PER_LEVEL;
        const xpPct = (xpInLevel / CFG.PET_XP_PER_LEVEL) * 100;
        const isMax = p.level >= CFG.PET_MAX_LEVEL;

        grid += `
          <div class="ws-pet-card ${p.active?'active':''}">
            ${p.active ? '<div class="ws-pet-active-badge">★ ĐANG DÙNG</div>' : ''}
            <div class="ws-pet-emoji">${cfg.emoji}</div>
            <div class="ws-pet-name">${esc(cfg.name)}</div>
            <div class="ws-pet-level">Lv ${p.level}/${CFG.PET_MAX_LEVEL}${isMax?' · MAX':''}</div>
            <div class="ws-pet-xp">
              <div class="ws-pet-xp-fill" style="width:${isMax?100:xpPct}%"></div>
            </div>
            <div class="ws-pet-desc">${esc(cfg.desc)}</div>
            <div class="ws-pet-actions">
              ${p.active
                ? `<button class="ws-pet-btn" disabled>Đang dùng</button>`
                : `<button class="ws-pet-btn green" data-pet-active="${p.id}" type="button">Dùng</button>`}
              ${isMax
                ? `<button class="ws-pet-btn" disabled>MAX</button>`
                : `<button class="ws-pet-btn" data-pet-feed="${p.id}" type="button">Cho ăn</button>`}
            </div>
          </div>
        `;
      } else {
        /* ─── Locked pet ─── */
        const canAfford = myGold >= (cfg.price||0);
        grid += `
          <div class="ws-pet-card locked">
            <div class="ws-pet-emoji">${cfg.emoji}</div>
            <div class="ws-pet-name">${esc(cfg.name)}</div>
            <div class="ws-pet-level">Chưa sở hữu</div>
            <div class="ws-pet-xp"></div>
            <div class="ws-pet-desc">${esc(cfg.desc)}</div>
            <div class="ws-pet-actions">
              <button class="ws-pet-btn" data-pet-adopt="${key}" type="button"
                ${canAfford ? '' : 'disabled'}>🪙${fmtGold(cfg.price||0)}</button>
            </div>
          </div>
        `;
      }
    });

    grid += '</div>';

    return `
      <div class="wf-section-title">🐾 Thú cưng chiến đấu</div>
      ${grid}
      <div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:12px;">
        Cho ăn = 1 vàng → 1 XP · MAX Lv ${CFG.PET_MAX_LEVEL}
      </div>
    `;
  }

  function wirePet(body){
    body.querySelectorAll('[data-pet-adopt]').forEach(btn => {
      btn.addEventListener('click', () => doPetAdopt(btn.dataset.petAdopt, btn));
    });
    body.querySelectorAll('[data-pet-active]').forEach(btn => {
      btn.addEventListener('click', () => doPetSetActive(Number(btn.dataset.petActive), btn));
    });
    body.querySelectorAll('[data-pet-feed]').forEach(btn => {
      btn.addEventListener('click', () => {
        MODALS.openPetFeedModal(Number(btn.dataset.petFeed));
      });
    });
  }

  function rerenderPets(){
    if (S.activeTab !== 'pet') return;
    window.__WF.index?.render?.();
  }

  /* ═══════════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════════ */
  async function doPetAdopt(petKey, btn){
    const cfg = CFG.PETS[petKey];
    if (!cfg) return;
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;

    try {
      const myGold = S.state.gold;
      if (myGold < cfg.price){
        toast('Không đủ vàng', 'warning');
        btn.disabled = false;
        return;
      }

      // Trừ vàng local trước
      S.state.gold -= cfg.price;
      ST.saveLocal(S.user.id, S.state);
      await ST.pushRemote(S.state);

      const res = await sb.rpc('rpc_wp_adopt', { p_pet_key: petKey });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`🐾 Nhận nuôi ${cfg.name}!`, 'success');
      playNotifSound();

      await API.fetchPets();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  async function doPetSetActive(petId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb();
    if (!sb) return;

    try {
      const res = await sb.rpc('rpc_wp_set_active', { p_pet_id: petId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      toast(`★ Đã chọn ${CFG.PETS[d.pet_key]?.name || 'pet'}`, 'success');
      playSound(660, .08);

      await API.fetchPets();
      window.__WF.index?.render?.();
    } catch(e){
      toast('Lỗi', 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabPet = {
    renderPetTab,
    wirePet,
    rerenderPets,
    doPetAdopt,
    doPetSetActive,
  };

  console.log('[WF] tab-pet.js ✓');
})();