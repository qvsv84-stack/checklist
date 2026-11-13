/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #1: CONFIG + MATH
   ───────────────────────────────────────────────────────────────────────
   - Định nghĩa toàn bộ CFG (constants, tiers, materials, pets, quests...)
   - Pure math functions: tierOf, powerOf, effectiveRates, applyOutcome...
   - Không phụ thuộc module khác (chỉ dùng window.__WF namespace)
   - Load order: #1 (đầu tiên)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.config) return;

  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     CONFIG
     ═══════════════════════════════════════════════════════════════ */
  const CFG = {
    // ─── CURRENCY / ENERGY ───
    START_GOLD: 300, FORGE_GOLD: 10, FORGE_ENERGY: 1,
    ENERGY_MAX: 100, ENERGY_REGEN_MS: 6 * 60 * 1000,
    REFILL_COST_GOLD: 50, REFILL_AMOUNT: 50,

    // ─── STORAGE ───
    LS_PREFIX: "__wf_state_", SAVE_DEBOUNCE_MS: 800,

    // ─── CHAT / GIFT / DUEL ───
    CHAT_COOLDOWN_MS: 10000, CHAT_MAX_LEN: 200,
    GIFT_MIN: 10, GIFT_MAX_PER_TX: 500, GIFT_MAX_PER_DAY: 1000,
    DUEL_MIN: 10, DUEL_MAX: 5000,

    // ─── BATTLE / BOSS / PET / SEASON ───
    BATTLE_TURN_TIMEOUT_MS: 60000, BATTLE_POLL_MS: 3000,
    BOSS_POLL_MS: 5000, BOSS_ATTACK_COOLDOWN_MS: 10000,
    PET_MAX_LEVEL: 20, PET_XP_PER_LEVEL: 100,
    SEASON_MAX_TIER: 30, SEASON_XP_PER_TIER: 1000,

    // ─── TIERS ───
    TIER_ORDER: ['B','A','S','SS','SSS','VIP'],
    TIERS: {
      B:   { name:'Gỗ Mục',      emoji:'🪵', mult:1,  enhMax:3  },
      A:   { name:'Sắt Rỉ',      emoji:'⚔️', mult:2,  enhMax:6  },
      S:   { name:'Thép Sáng',   emoji:'🗡️', mult:4,  enhMax:9  },
      SS:  { name:'Lam Ngọc',    emoji:'🔷', mult:8,  enhMax:12 },
      SSS: { name:'Huyền Thiết', emoji:'🌟', mult:16, enhMax:14 },
      VIP: { name:'Thần Binh',   emoji:'👑', mult:32, enhMax:15 },
    },
    ENH_TO_TIER: ['B','B','B','B','A','A','A','S','S','S','SS','SS','SS','SSS','SSS','VIP'],

    // ─── MATERIALS ───
    MATERIALS: {
      wood:       { name:'Gỗ',        emoji:'🪵', price:5,    bonus:{hold:3} },
      iron:       { name:'Sắt',       emoji:'🔩', price:20,   bonus:{success:5} },
      steel:      { name:'Thép',      emoji:'⚙️', price:80,   bonus:{success:10,great:3} },
      mythril:    { name:'Mythril',   emoji:'💎', price:300,  bonus:{success:15,great:8,broken:-3} },
      orichalcum: { name:'Orichalcum',emoji:'🔮', price:1000, bonus:{success:20,great:12,broken:-5} },
      star:       { name:'Kim Tinh',  emoji:'⭐', price:3000, bonus:{success:25,great:18,broken:-8,hold:5} },
    },

    // ─── HAMMERS ───
    HAMMERS: {
      wooden:  { name:'Búa Gỗ',      emoji:'🔨', price:0,     rarity:'common',    bonus:{} },
      iron:    { name:'Búa Sắt',     emoji:'🔨', price:200,   rarity:'uncommon',  bonus:{success:5,broken:-2} },
      steel:   { name:'Búa Thép',    emoji:'🔨', price:800,   rarity:'rare',      bonus:{success:10,great:5,broken:-3} },
      mythril: { name:'Búa Mythril', emoji:'🔨', price:3000,  rarity:'epic',      bonus:{success:15,great:10,broken:-5,damaged:-3} },
      divine:  { name:'Búa Thần',    emoji:'🔨', price:10000, rarity:'legendary', bonus:{success:25,great:15,broken:-10,damaged:-5,hold:5} },
    },

    // ─── BASE RATES ───
    BASE_RATES: { broken:5, damaged:15, hold:25, success:45, great:10 },
    PITY_FAILS_FOR_SUCCESS: 10, PITY_FAILS_FOR_GREAT: 20,
    COMBO_BONUS_PER_STACK: 1, COMBO_BONUS_CAP: 25,

    // ─── ACHIEVEMENTS ───
    ACHIEVEMENTS: {
      first_forge: { icon:'🔨', name:'Bước đầu',    desc:'Rèn lần đầu',   gold:50 },
      forge_10:    { icon:'⚒️', name:'Tay nghề',    desc:'Rèn 10 lần',    gold:100 },
      forge_100:   { icon:'🏅', name:'Bậc thầy',    desc:'Rèn 100 lần',   gold:500 },
      enh_5:       { icon:'✨', name:'Tinh luyện',  desc:'Đạt +5',        gold:100 },
      enh_10:      { icon:'🌟', name:'Cao thủ',     desc:'Đạt +10',       gold:500 },
      enh_15:      { icon:'👑', name:'Huyền thoại', desc:'Đạt +15 (VIP)', gold:2000 },
      combo_5:     { icon:'🔥', name:'Chuỗi 5',     desc:'Combo 5',       gold:100 },
      combo_10:    { icon:'💥', name:'Chuỗi 10',    desc:'Combo 10',      gold:300 },
      combo_20:    { icon:'⚡', name:'Bất bại',     desc:'Combo 20',      gold:1000 },
      broke_5:     { icon:'💔', name:'Xui xẻo',     desc:'Gãy 5 lần',     gold:50 },
      sell_10:     { icon:'💰', name:'Thương nhân', desc:'Bán 10 vũ khí', gold:200 },
      reach_vip:   { icon:'🏆', name:'Thần Binh',   desc:'Đạt VIP',       gold:5000 },
    },

    // ─── PETS ───
    PETS: {
      dragon:  { name:'Rồng Con',     emoji:'🐲', price:2000, desc:'+1% dmg battle / level', buff:'atk' },
      phoenix: { name:'Phượng Hoàng', emoji:'🦅', price:3000, desc:'+2% HP regen / turn',    buff:'regen' },
      wolf:    { name:'Sói Xám',      emoji:'🐺', price:1500, desc:'+1% crit / level',       buff:'crit' },
      turtle:  { name:'Rùa Cổ',       emoji:'🐢', price:1000, desc:'+5% max HP battle',      buff:'hp' },
    },

    // ─── SEASON XP ───
    SEASON_XP: {
      forge: 5, forge_great: 15,
      duel_win: 50, boss_hit: 10,
      quest_claim: 20, chat: 2, gift: 3,
    },
  };

  /* ═══════════════════════════════════════════════════════════════
     MATH HELPERS
     ═══════════════════════════════════════════════════════════════ */

  function tierOf(enh){
    return CFG.ENH_TO_TIER[Math.max(0, Math.min(15, enh|0))] || 'B';
  }

  function tierInfo(enh){
    return CFG.TIERS[tierOf(enh)];
  }

  function powerOf(enh){
    return Math.round(tierInfo(enh).mult * (enh+1) * 100) / 100;
  }

  function sellPrice(enh){
    return Math.round(powerOf(enh) * 5);
  }

  function materialForTier(t){
    return { B:'wood', A:'iron', S:'steel', SS:'mythril', SSS:'orichalcum', VIP:'star' }[t] || null;
  }

  function currentMaterialBonus(s){
    const mid = materialForTier(tierOf(s.enh));
    if (!mid || (s.materials[mid]||0) <= 0) return {};
    return CFG.MATERIALS[mid].bonus;
  }

  function applyBonus(r, b){
    if (!b) return;
    Object.keys(b).forEach(k => { r[k] = (r[k]||0) + Number(b[k]||0); });
  }

  function effectiveRates(s){
    const base = Object.assign({}, CFG.BASE_RATES);
    applyBonus(base, CFG.HAMMERS[s.hammer]?.bonus);
    applyBonus(base, currentMaterialBonus(s));
    if (s.combo > 0){
      const c = Math.min(CFG.COMBO_BONUS_CAP, s.combo * CFG.COMBO_BONUS_PER_STACK);
      base.success += c; base.hold = Math.max(0, base.hold - c);
    }
    ['broken','damaged','hold','success','great'].forEach(k => base[k] = Math.max(0, base[k]||0));
    const sum = Object.values(base).reduce((a,b)=>a+b,0);
    if (sum > 0 && Math.abs(sum-100) > 0.5){
      const sc = 100/sum;
      Object.keys(base).forEach(k => base[k] = Math.round(base[k]*sc*10)/10);
    }
    return base;
  }

  function rollOutcome(rates, pityFails){
    if (pityFails >= CFG.PITY_FAILS_FOR_GREAT) return 'great';
    if (pityFails >= CFG.PITY_FAILS_FOR_SUCCESS) return 'success';
    const r = Math.random() * 100;
    let acc = 0;
    for (const k of ['broken','damaged','hold','success','great']){
      acc += rates[k]||0;
      if (r < acc) return k;
    }
    return 'success';
  }

  function applyOutcome(s, outcome){
    const before = s.enh;
    let d = 0, gold = 0;
    if (outcome === 'broken'){ d = before>0 ? -1 : 0; s.total_broken++; s.combo = 0; s.fails++; }
    else if (outcome === 'damaged'){ d = before>0 ? -1 : 0; s.combo = 0; s.fails++; }
    else if (outcome === 'hold'){ d = 0; s.combo = 0; s.fails++; }
    else if (outcome === 'success'){ d = +1; s.combo++; s.fails = 0; s.total_success++; }
    else if (outcome === 'great'){ d = +2; gold = 20; s.combo++; s.fails = 0; s.total_success++; }
    s.enh = Math.max(0, Math.min(15, before + d));
    s.gold += gold;
    s.best_combo = Math.max(s.best_combo, s.combo);
    s.total_forges++;
    const p = powerOf(s.enh);
    if (p > (s.best_power||0)) s.best_power = p;
    return { outcome, deltaEnh: d, goldDelta: gold, prevEnh: before, newEnh: s.enh };
  }

  function consumeMaterial(s){
    const mid = materialForTier(tierOf(s.enh));
    if (!mid || (s.materials[mid]||0) <= 0) return null;
    s.materials[mid]--;
    return mid;
  }

  function regenEnergy(s, nowMs){
    if (s.energy >= CFG.ENERGY_MAX){ s.last_energy_at = nowMs; return 0; }
    const el = nowMs - (s.last_energy_at || nowMs);
    if (el < 0){ s.last_energy_at = nowMs; return 0; }
    const gained = Math.floor(el / CFG.ENERGY_REGEN_MS);
    if (gained <= 0) return 0;
    const before = s.energy;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + gained);
    s.last_energy_at += gained * CFG.ENERGY_REGEN_MS;
    return s.energy - before;
  }

  function checkAchievements(s){
    const unlocked = [];
    const ck = (k, cond) => {
      if (s.achievements[k] || !cond) return;
      s.achievements[k] = true;
      const a = CFG.ACHIEVEMENTS[k];
      if (a){ s.gold += a.gold; unlocked.push({ key: k, ...a }); }
    };
    ck('first_forge', s.total_forges >= 1);
    ck('forge_10', s.total_forges >= 10);
    ck('forge_100', s.total_forges >= 100);
    ck('enh_5', s.enh >= 5);
    ck('enh_10', s.enh >= 10);
    ck('enh_15', s.enh >= 15);
    ck('combo_5', s.best_combo >= 5);
    ck('combo_10', s.best_combo >= 10);
    ck('combo_20', s.best_combo >= 20);
    ck('broke_5', s.total_broken >= 5);
    ck('sell_10', s.total_sold >= 10);
    ck('reach_vip', tierOf(s.enh) === 'VIP');
    return unlocked;
  }

  function tierBaseEnh(enh){
    const t = tierOf(enh);
    for (let i = 0; i <= 15; i++) if (tierOf(i) === t) return i;
    return 0;
  }

  function nextTierThreshold(enh){
    const t = tierOf(enh);
    const idx = CFG.TIER_ORDER.indexOf(t);
    if (idx < 0 || idx >= CFG.TIER_ORDER.length-1) return 15;
    const nt = CFG.TIER_ORDER[idx+1];
    for (let i = enh+1; i <= 15; i++) if (tierOf(i) === nt) return i;
    return 15;
  }

  function seasonTierReward(tier, premium){
    const gold = (50 + tier * 20) * (premium ? 2 : 1);
    let mat = 'wood';
    if (tier >= 20) mat = 'steel';
    else if (tier >= 10) mat = 'iron';
    return { gold, mat };
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.config = {
    CFG,
    tierOf, tierInfo, powerOf, sellPrice,
    materialForTier, currentMaterialBonus, applyBonus,
    effectiveRates, rollOutcome, applyOutcome, consumeMaterial,
    regenEnergy, checkAchievements,
    tierBaseEnh, nextTierThreshold, seasonTierReward,
  };

  console.log('[WF] config.js ✓');
})();