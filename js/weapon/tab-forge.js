/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #7: TAB FORGE (v5.3 — weapon sprite AutoSprite)
   ───────────────────────────────────────────────────────────────────────
   v5.3:
     - Weapon sprite thay emoji, lấy từ weapon-library.js
     - Animated spritesheet (16 frame, 4×4 hoặc 5×5)
     - Fallback emoji nếu CDN fail
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabForge) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  const WL = window.__WF.weaponLibrary;
  if (!C || !U || !ST || !API || !WL) {
    console.error('[WF] tab-forge.js thiếu dependency (cần weapon-library.js)');
    return;
  }

  const CFG = C.CFG;
  const MAX_ENH = C.MAX_ENH;
  const S = ST.S;
  const {
    tierOf, powerOf, effectiveRates, rollOutcome, applyOutcome,
    consumeMaterial, checkAchievements,
    tierBaseEnh, nextTierThreshold, materialForTier,
  } = C;

  const {
    esc, fmtGold, nowMs, sleep, toast, log,
    playSound, playForgeSound, vibrate,
    shakeScreen, spawnSparks, numberPop,
  } = U;

  /* ═══════════════════════════════════════════════════════════════
     CHARACTER SPRITE
     ═══════════════════════════════════════════════════════════════ */
  function renderCharacterSprite(s){
    const LIB = window.__WF.characterLibrary;
    if (!LIB) return '';
    const char = LIB.getById(s.character_id) || LIB.getDefault();
    if (!char) return '';

    const url = LIB.getUrl(char);
    if (url) {
      return `<img src="${url}" alt="" loading="lazy"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
              <span class="wf-character-fallback" style="display:none">${char.emoji || '👤'}</span>`;
    }

    if (char.job == null) {
      LIB.getUrlAsync(char).then(u => {
        if (!u) return;
        const el = document.getElementById('wfCharSprite');
        if (!el) return;
        el.innerHTML = `<img src="${u}" alt=""
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <span class="wf-character-fallback" style="display:none">${char.emoji || '👤'}</span>`;
      });
    }

    return `<div style="font-size:24px;color:#a06a28;animation:wfSpin 1s linear infinite">⏳</div>
            <span class="wf-character-fallback" style="display:none">${char.emoji || '👤'}</span>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     WEAPON SPRITE (animated spritesheet)
     ═══════════════════════════════════════════════════════════════ */
  function renderWeaponSprite(enh){
    const tier = tierOf(enh);
    const weapon = WL.getByTier(tier);
    if (!weapon) return '<div style="font-size:64px">⚔️</div>';

    // Inline CSS variables for animation
    const style = [
      `--weapon-url: url('${weapon.sheet}')`,
      `--cols: ${weapon.cols}`,
      `--rows: ${weapon.rows}`,
      `--frames: ${weapon.frames}`,
    ].join('; ');

    return `<div class="wf-weapon-sprite" style="${style}"
                 data-emoji="${weapon.emoji || '⚔️'}"
                 onerror="this.classList.add('fallback')"></div>
            <span class="wf-weapon-emoji-fallback" style="display:none">${weapon.emoji || '⚔️'}</span>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderForgeTab(){
    const s = S.state;
    const tier = tierOf(s.enh), ti = CFG.TIERS[tier];
    const power = powerOf(s.enh);
    const prevTierEnh = nextTierThreshold(s.enh);
    const curTierBase = tierBaseEnh(s.enh);
    const tierProgress = prevTierEnh > curTierBase
      ? Math.min(100, ((s.enh - curTierBase) / (prevTierEnh - curTierBase)) * 100)
      : 100;

    const isMax = s.enh >= MAX_ENH;
    const canForge = s.energy >= CFG.FORGE_ENERGY
      && s.gold >= CFG.FORGE_GOLD
      && !S.busy
      && !isMax;

    const label = isMax ? '🏆 Đã đạt cấp tối đa'
      : s.energy < CFG.FORGE_ENERGY ? '⚡ Hết năng lượng'
      : s.gold < CFG.FORGE_GOLD ? '🪙 Không đủ vàng'
      : '🔨 Rèn vũ khí';

    const mid = materialForTier(tier);
    const mat = mid ? CFG.MATERIALS[mid] : null;
    const matQty = mid ? (s.materials[mid]||0) : 0;
    const energyPct = (s.energy / CFG.ENERGY_MAX) * 100;

    return `
      <div class="wf-energy-wrap">
        <span class="wf-energy-label">⚡</span>
        <div class="wf-energy-track"><div class="wf-energy-fill" style="width:${energyPct}%"></div></div>
        <span class="wf-energy-num">${s.energy}/${CFG.ENERGY_MAX}</span>
      </div>
      <div class="wf-stage" id="wfStage">
        <div class="wf-hammer" id="wfHammer">${CFG.HAMMERS[s.hammer].emoji}</div>
        <div class="wf-character-sprite" id="wfCharSprite">${renderCharacterSprite(s)}</div>
        <div class="wf-weapon-wrap">
          <div class="wf-weapon-sprite-wrap" id="wfWeaponSprite">
            ${renderWeaponSprite(s.enh)}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="wf-tier-badge tier-${tier}">${tier}</span>
            <span class="wf-enh-badge">+<b>${s.enh}</b></span>
          </div>
          <div class="wf-weapon-name">${esc(ti.name)}</div>
          <div class="wf-progress"><div class="wf-progress-fill" style="width:${tierProgress}%"></div></div>
          <div class="wf-progress-label">${isMax ? 'MAX' : `${s.enh} / ${prevTierEnh}`}</div>
        </div>
      </div>
      <div class="wf-stats">
        <div class="wf-stat combo">
          <div class="wf-stat-value ${s.combo>=5?'hot':''}">${s.combo}</div>
          <div class="wf-stat-label">🔥 Combo</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-value">${Math.round(power*100)/100}</div>
          <div class="wf-stat-label">⚡ Power</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-value ${s.fails>5?'neg':''}">${s.fails}</div>
          <div class="wf-stat-label">🎯 Pity</div>
        </div>
      </div>
      <button class="wf-forge-btn" id="wfForgeBtn" type="button" ${canForge?'':'disabled'}>
        <span>${label}</span>
        <span class="wf-cost-tag">🪙${CFG.FORGE_GOLD} · ⚡${CFG.FORGE_ENERGY}${mat?` · ${mat.emoji}${matQty}`:''}</span>
      </button>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     FORGE ACTION
     ═══════════════════════════════════════════════════════════════ */
  async function doForge(){
    if (S.busy || !S.state) return;
    const s = S.state;
    if (s.enh >= MAX_ENH){ toast('Đã đạt cấp tối đa', 'warning'); return; }
    if (s.energy < CFG.FORGE_ENERGY){ toast('Hết năng lượng', 'warning'); return; }
    if (s.gold < CFG.FORGE_GOLD){ toast('Không đủ vàng', 'warning'); return; }

    S.busy = true;
    const hammer = document.getElementById('wfHammer');
    const btn = document.getElementById('wfForgeBtn');
    const weaponWrap = document.getElementById('wfWeaponSprite');
    if (btn){ btn.classList.add('forging'); btn.disabled = true; }

    s.energy -= CFG.FORGE_ENERGY;
    s.gold -= CFG.FORGE_GOLD;
    const matUsed = consumeMaterial(s);
    const gv = document.getElementById('wfGoldVal');
    if (gv) gv.textContent = fmtGold(s.gold);
    ST.scheduleSave();

    let pending = null;
    const enhBefore = s.enh;

    try {
      if (hammer){ hammer.classList.remove('striking'); hammer.classList.add('raising'); }
      playSound(180, .1);
      await sleep(220);

      if (hammer){ hammer.classList.remove('raising'); hammer.classList.add('striking'); }
      playSound(120, .08, 'triangle');
      await sleep(160);

      shakeScreen();
      spawnSparks(8);
      vibrate(30);

      const rates = effectiveRates(s);
      const outcome = rollOutcome(rates, s.fails);
      const result = applyOutcome(s, outcome);

      // Animate weapon
      if (weaponWrap){
        weaponWrap.classList.remove('shake','shine','shatter');
        if (outcome === 'broken') weaponWrap.classList.add('shatter');
        else if (outcome === 'damaged' || outcome === 'hold') weaponWrap.classList.add('shake');
        else {
          weaponWrap.classList.add('shine');
          if (outcome === 'great') spawnSparks(20);
        }
      }

      const unlocked = checkAchievements(s);
      s.history.unshift({
        ts: nowMs(), outcome,
        deltaEnh: result.deltaEnh,
        prevEnh: result.prevEnh,
        newEnh: result.newEnh,
        goldDelta: result.goldDelta,
        matUsed,
      });
      if (s.history.length > 50) s.history.length = 50;

      ST.scheduleSave();
      playForgeSound(outcome);

      if (outcome === 'broken') vibrate([80,40,80]);
      else if (outcome === 'great') vibrate([20,30,20,30,60]);

      if (result.goldDelta > 0) numberPop(`+${result.goldDelta}🪙`, '#f59e0b');

      await sleep(400);
      pending = { outcome, result, unlocked };

      API.questProgress('forge', 1);
      const xp = outcome === 'great' ? CFG.SEASON_XP.forge_great : CFG.SEASON_XP.forge;
      API.seasonAddXP(xp);
      if (result.newEnh > enhBefore && result.newEnh >= 5){
        API.questProgress('enh_reach', result.newEnh - enhBefore);
      }
    } catch(e){
      log('forge error', e);
      toast('Lỗi khi rèn', 'error');
    } finally {
      S.busy = false;
      if (hammer) hammer.classList.remove('raising','striking');
      window.__WF.index?.render?.();
      if (pending) showResult(pending.outcome, pending.result, pending.unlocked);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RESULT POPUP
     ═══════════════════════════════════════════════════════════════ */
  function showResult(outcome, result, unlocked){
    const ov = document.getElementById('wfResult');
    if (!ov) return;

    const map = {
      broken:  { e:'💥', t:'Gãy vũ khí',      c:'broken'  },
      damaged: { e:'⚠️', t:'Hư hại',           c:'damaged' },
      hold:    { e:'🛡️', t:'Giữ nguyên',       c:'hold'    },
      success: { e:'✅', t:'Thành công',       c:'success' },
      great:   { e:'✨', t:'Đại thành công!',  c:'great'   },
    };
    const c = map[outcome] || map.hold;
    document.getElementById('wfResEmoji').textContent = c.e;

    const title = document.getElementById('wfResTitle');
    title.textContent = c.t;
    title.className = 'wf-result-title ' + c.c;

    const desc = {
      broken:  result.deltaEnh < 0 ? 'Mất 1 cấp.' : 'Đã ở mức thấp nhất.',
      damaged: result.deltaEnh < 0 ? 'Mất 1 cấp.' : 'Đã ở mức thấp nhất.',
      hold:    'Không thay đổi.',
      success: '+1 cấp!',
      great:   '+2 cấp và nhận vàng!',
    };
    document.getElementById('wfResDesc').textContent = desc[outcome] || '';

    const chips = [];
    if (result.deltaEnh !== 0){
      const cls = result.deltaEnh > 0 ? 'plus-enh' : 'minus-enh';
      chips.push(`<span class="wf-result-chip ${cls}">${result.deltaEnh>0?'+':''}${result.deltaEnh} cấp</span>`);
    } else {
      chips.push(`<span class="wf-result-chip zero-enh">±0 cấp</span>`);
    }
    if (result.goldDelta > 0){
      chips.push(`<span class="wf-result-chip plus-gold">+${result.goldDelta} 🪙</span>`);
    }
    document.getElementById('wfResChanges').innerHTML = chips.join('');

    const again = document.getElementById('wfResAgain');
    if (again){
      const s = S.state;
      const isMax = s && s.enh >= MAX_ENH;
      const can = !!(s
        && !isMax
        && s.energy >= CFG.FORGE_ENERGY
        && s.gold >= CFG.FORGE_GOLD);
      again.disabled = !can;
      again.style.opacity = can ? '' : '.45';
      again.textContent = can ? `🔨 Rèn tiếp (🪙${CFG.FORGE_GOLD} · ⚡${CFG.FORGE_ENERGY})`
        : isMax ? '🏆 Đã MAX'
        : s?.energy < CFG.FORGE_ENERGY ? '⚡ Hết năng lượng'
        : '🪙 Thiếu vàng';
    }

    ov.classList.add('show');

    if (unlocked?.length){
      setTimeout(() => {
        unlocked.forEach(u => toast(`🏅 ${u.name} (+${u.gold}🪙)`, 'success'));
      }, 400);
    }
  }

  function closeResult(){
    document.getElementById('wfResult')?.classList.remove('show');
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabForge = {
    renderForgeTab,
    doForge,
    showResult,
    closeResult,
  };

  console.log('[WF] tab-forge.js ✓ (v5.3 — AutoSprite weapon)');
})();