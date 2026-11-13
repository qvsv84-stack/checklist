/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #6: MODALS
   - Challenge duel modal (wager picker)
   - Gift gold modal (amount + message)
   - Pet feed modal (gold → XP)
   - Load: #6 (sau api)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.modals) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] modals.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const SOC = ST.SOC;
  const S = ST.S;
  const { esc, fmtGold, toast, getSb, playSound, sleep } = U;

  function removeModal(id){
    document.getElementById(id)?.remove();
  }

  /* ═══════════════════════════════════════════════════════════════
     CHALLENGE DUEL MODAL
     ═══════════════════════════════════════════════════════════════ */
  function openChallengeModal(oppId, oppName){
    removeModal('wsChallengeModal');
    const myGold = S.state?.gold || 0;
    const maxWager = Math.min(CFG.DUEL_MAX, Math.floor(myGold / 2));
    if (maxWager < CFG.DUEL_MIN){
      toast(`Cần ≥ ${CFG.DUEL_MIN*2} vàng để thách`, 'warning');
      return;
    }
    const modal = document.createElement('div');
    modal.id = 'wsChallengeModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">⚔️ Thách đấu</div>
        <div class="ws-modal-sub">Đấu với <b>${esc(oppName)}</b><br>HP/ATK dựa trên power hai bên</div>
        <label class="ws-modal-label">Số vàng cược (${CFG.DUEL_MIN}-${maxWager})</label>
        <input class="ws-modal-input" id="wsWagerInput" type="number" min="${CFG.DUEL_MIN}" max="${maxWager}" value="${Math.min(50, maxWager)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-wager="50">50</button>
          <button type="button" data-wager="100">100</button>
          <button type="button" data-wager="500">500</button>
          <button type="button" data-wager="${maxWager}">MAX</button>
        </div>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsChallConfirm" type="button">Gửi thách đấu</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-wager]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsWagerInput');
        if (inp) inp.value = b.dataset.wager;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsChallConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsWagerInput');
      const wager = parseInt(inp.value, 10);
      if (!wager || wager < CFG.DUEL_MIN || wager > maxWager){
        toast(`Cược ${CFG.DUEL_MIN}-${maxWager}`, 'warning');
        return;
      }
      const btn = modal.querySelector('#wsChallConfirm');
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      try {
        const sb = getSb();
        const res = await sb.rpc('rpc_weapon_duel_challenge', { p_opponent_id: oppId, p_wager: wager });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        toast(`Đã thách ${oppName} cược ${wager}🪙`, 'success');
        modal.remove();
        await API.fetchArena();
        window.__WF.index?.rerenderArena?.();
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
        btn.disabled = false; btn.textContent = 'Gửi thách đấu';
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     GIFT GOLD MODAL
     ═══════════════════════════════════════════════════════════════ */
  function openGiftModal(toId, toName){
    removeModal('wsGiftModal');
    const myGold = S.state?.gold || 0;
    if (myGold < CFG.GIFT_MIN){ toast(`Cần ≥ ${CFG.GIFT_MIN} vàng`, 'warning'); return; }
    const maxAmount = Math.min(CFG.GIFT_MAX_PER_TX, myGold);
    const modal = document.createElement('div');
    modal.id = 'wsGiftModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">🎁 Tặng vàng</div>
        <div class="ws-modal-sub">Tặng cho <b>${esc(toName)}</b><br>Tối đa ${CFG.GIFT_MAX_PER_TX}🪙/lần, ${CFG.GIFT_MAX_PER_DAY}🪙/ngày</div>
        <label class="ws-modal-label">Số vàng (${CFG.GIFT_MIN}-${maxAmount})</label>
        <input class="ws-modal-input" id="wsGiftInput" type="number" min="${CFG.GIFT_MIN}" max="${maxAmount}" value="${Math.min(50, maxAmount)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-amt="50">50</button>
          <button type="button" data-amt="100">100</button>
          <button type="button" data-amt="200">200</button>
          <button type="button" data-amt="${maxAmount}">MAX</button>
        </div>
        <label class="ws-modal-label">Lời nhắn (tuỳ chọn)</label>
        <textarea class="ws-modal-textarea" id="wsGiftMsg" maxlength="100" placeholder="Chúc bạn may mắn..."></textarea>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsGiftConfirm" type="button">Tặng ngay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-amt]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsGiftInput');
        if (inp) inp.value = b.dataset.amt;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsGiftConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsGiftInput');
      const msgInput = modal.querySelector('#wsGiftMsg');
      const amount = parseInt(inp.value, 10);
      if (!amount || amount < CFG.GIFT_MIN || amount > maxAmount){
        toast(`Số vàng ${CFG.GIFT_MIN}-${maxAmount}`, 'warning');
        return;
      }
      const btn = modal.querySelector('#wsGiftConfirm');
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      try {
        const sb = getSb();
        const res = await sb.rpc('rpc_weapon_send_gift', {
          p_to_id: toId, p_amount: amount, p_message: msgInput.value.trim() || null,
        });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        if (S.state){
          S.state.gold = Math.max(0, S.state.gold - amount);
          ST.scheduleSave();
        }
        toast(`Đã tặng ${amount}🪙 cho ${toName}`, 'success');
        playSound(880, .1);
        setTimeout(()=>playSound(1175,.15), 80);
        modal.remove();
        window.__WF.index?.render?.();
        API.fetchFeed().then(() => window.__WF.index?.rerenderFeed?.());
        await API.questProgress('gift', amount);
        await API.seasonAddXP(CFG.SEASON_XP.gift);
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
        btn.disabled = false; btn.textContent = 'Tặng ngay';
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     PET FEED MODAL
     ═══════════════════════════════════════════════════════════════ */
  function openPetFeedModal(petId){
    const p = SOC.pets.find(x => x.id === petId);
    if (!p) return;
    removeModal('wsPetFeedModal');
    const myGold = S.state.gold;
    const cfg = CFG.PETS[p.pet_key];
    const maxFeed = Math.min(
      myGold,
      (CFG.PET_MAX_LEVEL - p.level) * CFG.PET_XP_PER_LEVEL - (p.xp % CFG.PET_XP_PER_LEVEL)
    );
    if (maxFeed < 10){ toast('Không đủ vàng hoặc đã MAX', 'warning'); return; }
    const modal = document.createElement('div');
    modal.id = 'wsPetFeedModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">${cfg.emoji} Cho ăn</div>
        <div class="ws-modal-sub">Cho <b>${esc(cfg.name)}</b> ăn · 1 vàng = 1 XP<br>Lv ${p.level}/${CFG.PET_MAX_LEVEL} · Bạn có ${fmtGold(myGold)}🪙</div>
        <label class="ws-modal-label">Số vàng (10-${maxFeed})</label>
        <input class="ws-modal-input" id="wsFeedInput" type="number" min="10" max="${maxFeed}" value="${Math.min(100, maxFeed)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-feed="50">50</button>
          <button type="button" data-feed="100">100</button>
          <button type="button" data-feed="500">500</button>
          <button type="button" data-feed="${maxFeed}">MAX</button>
        </div>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsFeedConfirm" type="button">Cho ăn</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-feed]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsFeedInput');
        if (inp) inp.value = b.dataset.feed;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsFeedConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsFeedInput');
      const amount = parseInt(inp.value, 10);
      if (!amount || amount < 10 || amount > maxFeed){
        toast('Số vàng không hợp lệ', 'warning');
        return;
      }
      const btn = modal.querySelector('#wsFeedConfirm');
      btn.disabled = true; btn.textContent = 'Đang cho ăn…';
      const sb = getSb(); if (!sb) return;
      try {
        const res = await sb.rpc('rpc_wp_feed', { p_pet_id: petId, p_gold: amount });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        S.state.gold = Math.max(0, S.state.gold - amount);
        ST.saveLocal(S.user.id, S.state);
        toast(`🍖 ${cfg.name} → Lv ${d.level}`, 'success');
        playSound(880, .1);
        modal.remove();
        await API.fetchPets();
        window.__WF.index?.render?.();
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không cho ăn được'), 'error');
        btn.disabled = false; btn.textContent = 'Cho ăn';
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.modals = {
    removeModal,
    openChallengeModal,
    openGiftModal,
    openPetFeedModal,
  };

  console.log('[WF] modals.js ✓');
})();