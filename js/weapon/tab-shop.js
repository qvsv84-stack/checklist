/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #8: TAB SHOP (Market + Inventory)
   - renderMarketTab: búa + vật liệu + năng lượng
   - renderInventoryTab: vũ khí hiện tại + achievements + sell
   - Actions: buy material/hammer, equip, refill, sell
   - Load: #8 (sau tab-forge)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabShop) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] tab-shop.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const {
    tierOf, powerOf, sellPrice,
    materialForTier, checkAchievements,
  } = C;
  const { esc, fmtGold, toast, nowMs, playSound, vibrate } = U;

  /* ═══════════════════════════════════════════════════════════════
     DESCRIBE BONUS
     ═══════════════════════════════════════════════════════════════ */
  function describeBonus(b){
    if (!b || !Object.keys(b).length) return '<span style="opacity:.6">không bonus</span>';
    const labels = { broken:'gãy', damaged:'hư', hold:'giữ', success:'✓', great:'✨' };
    return Object.keys(b).map(k => {
      const v = b[k], sign = v > 0 ? '+' : '';
      return `<span style="color:${v>=0?'#15803d':'#b91c1c'};font-weight:900">${labels[k]||k} ${sign}${v}%</span>`;
    }).join(' · ');
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER MARKET TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderMarketTab(){
    const s = S.state;
    const neededMat = materialForTier(tierOf(s.enh));

    /* ─── Hammers ─── */
    let html = '<div class="wf-section"><div class="wf-section-title">🔨 Búa</div>';
    Object.keys(CFG.HAMMERS).forEach(id => {
      const h = CFG.HAMMERS[id];
      const owned = s.hammers.includes(id);
      const equipped = s.hammer === id;
      const btn = equipped
        ? `<button class="wf-card-btn equipped" type="button" disabled>Đang dùng</button>`
        : owned
          ? `<button class="wf-card-btn" data-equip-hammer="${id}" type="button">Trang bị</button>`
          : `<button class="wf-card-btn buy" data-buy-hammer="${id}" type="button" ${s.gold>=h.price?'':'disabled'}>🪙${fmtGold(h.price)}</button>`;
      html += `<div class="wf-card ${equipped?'equipped':''}">
        <div class="wf-card-icon">${h.emoji}</div>
        <div class="wf-card-body">
          <div class="wf-card-name">${esc(h.name)}</div>
          <div class="wf-card-meta">
            <span class="wf-rarity-badge ${h.rarity}">${h.rarity}</span>
            ${describeBonus(h.bonus)}
          </div>
        </div>
        ${btn}
      </div>`;
    });
    html += '</div>';

    /* ─── Materials ─── */
    html += '<div class="wf-section"><div class="wf-section-title">💎 Vật liệu</div>';
    Object.keys(CFG.MATERIALS).forEach(id => {
      const m = CFG.MATERIALS[id];
      const qty = s.materials[id]||0;
      const needed = id === neededMat;
      html += `<div class="wf-card">
        <div class="wf-card-icon">${m.emoji}</div>
        <div class="wf-card-body">
          <div class="wf-card-name">${esc(m.name)}${needed?' <span style="color:#dc2626;font-size:10px">· cần</span>':''}</div>
          <div class="wf-card-meta">
            <span class="wf-qty">Có: <b>${qty}</b></span>
            ${describeBonus(m.bonus)}
          </div>
        </div>
        <button class="wf-card-btn buy" data-buy-mat="${id}" type="button" ${s.gold>=m.price?'':'disabled'}>🪙${fmtGold(m.price)}</button>
      </div>`;
    });
    html += '</div>';

    /* ─── Energy refill ─── */
    html += `<div class="wf-section"><div class="wf-section-title">⚡ Năng lượng</div>
      <div class="wf-card">
        <div class="wf-card-icon">⚡</div>
        <div class="wf-card-body">
          <div class="wf-card-name">Nạp +${CFG.REFILL_AMOUNT}</div>
          <div class="wf-card-meta">${s.energy}/${CFG.ENERGY_MAX} · +1/6 phút</div>
        </div>
        <button class="wf-card-btn buy" id="wfRefillBtn" type="button"
          ${s.gold>=CFG.REFILL_COST_GOLD && s.energy<CFG.ENERGY_MAX?'':'disabled'}>🪙${CFG.REFILL_COST_GOLD}</button>
      </div></div>`;

    return html;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER INVENTORY TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderInventoryTab(){
    const s = S.state;
    const tier = tierOf(s.enh), ti = CFG.TIERS[tier];
    const power = powerOf(s.enh), price = sellPrice(s.enh);

    let ach = '<div class="wf-section"><div class="wf-section-title">🏅 Thành tựu</div><div class="wf-achievements">';
    Object.keys(CFG.ACHIEVEMENTS).forEach(k => {
      const a = CFG.ACHIEVEMENTS[k];
      const un = !!s.achievements[k];
      ach += `<div class="wf-ach ${un?'unlocked':''}">
        <div class="wf-ach-icon">${a.icon}</div>
        <div>
          <div class="wf-ach-name">${esc(a.name)}</div>
          <div class="wf-ach-desc">${esc(a.desc)}</div>
        </div>
        <div class="wf-ach-reward">${un?'✓':`🪙${a.gold}`}</div>
      </div>`;
    });
    ach += '</div></div>';

    return `
      <div class="wf-inventory-hero">
        <div class="wf-inv-weapon">${ti.emoji}</div>
        <div class="wf-inv-name">${esc(ti.name)} +${s.enh}</div>
        <div class="wf-inv-power">⚡ ${Math.round(power*100)/100}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button class="wf-card-btn buy" id="wfSellBtn" type="button" ${s.enh>0?'':'disabled'}>
            💰 Bán (${fmtGold(price)}🪙)
          </button>
        </div>
        <div style="font-size:11px;color:#a06a28;font-weight:700;margin-top:10px;line-height:1.4;">
          Bán reset về +0, nhận vàng theo power.
        </div>
      </div>
      ${ach}
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     ACTIONS: BUY / EQUIP / REFILL / SELL
     ═══════════════════════════════════════════════════════════════ */
  function doBuyMaterial(mid){
    const s = S.state;
    const m = CFG.MATERIALS[mid];
    if (!m) return;
    if (s.gold < m.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= m.price;
    s.materials[mid] = (s.materials[mid]||0) + 1;
    ST.scheduleSave();
    playSound(660, .08);
    toast(`Mua ${m.emoji} ${m.name} ✓`, 'success');
    window.__WF.index?.render?.();
  }

  function doBuyHammer(hid){
    const s = S.state;
    const h = CFG.HAMMERS[hid];
    if (!h || s.hammers.includes(hid)) return;
    if (s.gold < h.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= h.price;
    s.hammers.push(hid);
    s.hammer = hid;
    ST.scheduleSave();
    playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
    toast(`Mua ${h.emoji} ${h.name} ✓`, 'success');
    window.__WF.index?.render?.();
  }

  function doEquipHammer(hid){
    const s = S.state;
    if (!s.hammers.includes(hid)) return;
    s.hammer = hid;
    ST.scheduleSave();
    playSound(660, .08);
    toast(`Trang bị ${CFG.HAMMERS[hid].name} ✓`);
    window.__WF.index?.render?.();
  }

  function doRefillEnergy(){
    const s = S.state;
    if (s.gold < CFG.REFILL_COST_GOLD){ toast('Không đủ vàng', 'warning'); return; }
    if (s.energy >= CFG.ENERGY_MAX){ toast('Năng lượng đầy rồi', 'warning'); return; }
    s.gold -= CFG.REFILL_COST_GOLD;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + CFG.REFILL_AMOUNT);
    s.last_energy_at = nowMs();
    ST.scheduleSave();
    playSound(880, .1);
    toast(`+${CFG.REFILL_AMOUNT} ⚡`, 'success');
    window.__WF.index?.render?.();
  }

  function doSell(){
    const s = S.state;
    if (s.enh <= 0){ toast('Không có gì để bán', 'warning'); return; }
    const price = sellPrice(s.enh);
    if (!confirm(`Bán +${s.enh} lấy ${fmtGold(price)}🪙?`)) return;
    s.gold += price;
    s.total_gold_earned += price;
    s.total_sold++;
    s.enh = 0;
    checkAchievements(s);
    ST.scheduleSave();
    playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
    vibrate([20, 30, 20]);
    toast(`Bán +${fmtGold(price)}🪙 ✓`, 'success');
    window.__WF.index?.render?.();
    API.questProgress('sell', 1);
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabShop = {
    renderMarketTab,
    renderInventoryTab,
    doBuyMaterial,
    doBuyHammer,
    doEquipHammer,
    doRefillEnergy,
    doSell,
    describeBonus,
  };

  console.log('[WF] tab-shop.js ✓');
})();