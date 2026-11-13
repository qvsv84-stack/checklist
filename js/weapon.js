/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — v2.0 (ForgeTax-style full game)
   ───────────────────────────────────────────────────────────────────────
   Tích hợp với project sẵn có:
     • window.__sb.rpc(...)          — Supabase sync (tùy chọn)
     • window.SRank.Auth             — user identity
     • window.Toast                  — feedback
     • window.SRank.setStatus        — status bar

   Nếu RPC chưa cài → chạy 100% offline với localStorage.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__weaponForgeLoaded) return;
  window.__weaponForgeLoaded = true;

  /* ═══════════════════════════════════════════════════════
     1. CONFIG
     ═══════════════════════════════════════════════════════ */
  const CFG = {
    // ─── CURRENCY ───
    START_GOLD:            300,
    FORGE_GOLD:             10,
    FORGE_ENERGY:           10,
    ENERGY_MAX:            100,
    ENERGY_REGEN_MS:    6 * 60 * 1000,   // 1 energy / 6 min
    REFILL_COST_GOLD:       50,
    REFILL_AMOUNT:          50,

    // ─── STORAGE ───
    LS_PREFIX:      "__wf_state_",
    SAVE_DEBOUNCE_MS: 800,

    // ─── TIERS (đồng bộ với rank system của app) ───
    TIER_ORDER: ['B', 'A', 'S', 'SS', 'SSS', 'VIP'],
    TIERS: {
      B:   { name: 'Gỗ Mục',       emoji: '🪵', mult:  1, enhMax:  3, color: '#8b7355' },
      A:   { name: 'Sắt Rỉ',       emoji: '⚔️', mult:  2, enhMax:  6, color: '#4a90e2' },
      S:   { name: 'Thép Sáng',    emoji: '🗡️', mult:  4, enhMax:  9, color: '#f39c12' },
      SS:  { name: 'Lam Ngọc',     emoji: '🔷', mult:  8, enhMax: 12, color: '#9b59b6' },
      SSS: { name: 'Huyền Thiết',  emoji: '🌟', mult: 16, enhMax: 14, color: '#e74c3c' },
      VIP: { name: 'Thần Binh',    emoji: '👑', mult: 32, enhMax: 15, color: '#f1c40f' },
    },
    // enh → tier mapping: [0-3]=B, [4-6]=A, [7-9]=S, [10-12]=SS, [13-14]=SSS, [15]=VIP
    ENH_TO_TIER: [ 'B','B','B','B','A','A','A','S','S','S','SS','SS','SS','SSS','SSS','VIP' ],

    // ─── MATERIALS ───
    MATERIALS: {
      wood:       { name: 'Gỗ',        emoji: '🪵', price:    5, bonus: { hold:    3 } },
      iron:       { name: 'Sắt',       emoji: '🔩', price:   20, bonus: { success: 5 } },
      steel:      { name: 'Thép',      emoji: '⚙️', price:   80, bonus: { success: 10, great:  3 } },
      mythril:    { name: 'Mythril',   emoji: '💎', price:  300, bonus: { success: 15, great:  8, broken: -3 } },
      orichalcum: { name: 'Orichalcum',emoji: '🔮', price: 1000, bonus: { success: 20, great: 12, broken: -5 } },
      star:       { name: 'Kim Tinh',  emoji: '⭐', price: 3000, bonus: { success: 25, great: 18, broken: -8, hold: 5 } },
    },

    // ─── HAMMERS ───
    HAMMERS: {
      wooden:  { name: 'Búa Gỗ',      emoji: '🔨', price:     0, rarity: 'common',    bonus: {} },
      iron:    { name: 'Búa Sắt',     emoji: '🔨', price:   200, rarity: 'uncommon',  bonus: { success: 5,  broken: -2 } },
      steel:   { name: 'Búa Thép',    emoji: '🔨', price:   800, rarity: 'rare',      bonus: { success: 10, great: 5,  broken: -3 } },
      mythril: { name: 'Búa Mythril', emoji: '🔨', price:  3000, rarity: 'epic',      bonus: { success: 15, great: 10, broken: -5, damaged: -3 } },
      divine:  { name: 'Búa Thần',    emoji: '🔨', price: 10000, rarity: 'legendary', bonus: { success: 25, great: 15, broken: -10, damaged: -5, hold: 5 } },
    },

    // ─── BASE OUTCOME RATES (percent) ───
    BASE_RATES: {
      broken:  5,
      damaged: 15,
      hold:    25,
      success: 45,
      great:   10,
    },

    // ─── PITY ───
    PITY_FAILS_FOR_SUCCESS: 10,   // 10 fail liên tiếp → ép success
    PITY_FAILS_FOR_GREAT:   20,   // 20 fail liên tiếp → ép great

    // ─── COMBO BONUS ───
    COMBO_BONUS_PER_STACK: 1,     // +1% success per combo stack
    COMBO_BONUS_CAP:       25,

    // ─── ACHIEVEMENTS ───
    ACHIEVEMENTS: {
      first_forge: { icon: '🔨', name: 'Bước đầu',    desc: 'Rèn lần đầu',            gold: 50 },
      forge_10:    { icon: '⚒️', name: 'Tay nghề',    desc: 'Rèn 10 lần',             gold: 100 },
      forge_100:   { icon: '🏅', name: 'Bậc thầy',    desc: 'Rèn 100 lần',            gold: 500 },
      enh_5:       { icon: '✨', name: 'Tinh luyện',  desc: 'Đạt +5',                 gold: 100 },
      enh_10:      { icon: '🌟', name: 'Cao thủ',     desc: 'Đạt +10',                gold: 500 },
      enh_15:      { icon: '👑', name: 'Huyền thoại', desc: 'Đạt +15 (VIP)',          gold: 2000 },
      combo_5:     { icon: '🔥', name: 'Chuỗi 5',     desc: 'Combo 5 lần',            gold: 100 },
      combo_10:    { icon: '💥', name: 'Chuỗi 10',    desc: 'Combo 10 lần',           gold: 300 },
      combo_20:    { icon: '⚡', name: 'Bất bại',     desc: 'Combo 20 lần',           gold: 1000 },
      broke_5:     { icon: '💔', name: 'Xui xẻo',     desc: 'Gãy 5 lần',              gold: 50 },
      sell_10:     { icon: '💰', name: 'Thương nhân', desc: 'Bán 10 vũ khí',          gold: 200 },
      reach_vip:   { icon: '🏆', name: 'Thần Binh',   desc: 'Đạt tier VIP',           gold: 5000 },
    },

    // ─── DAILY ───
    DAILY_GOLD: 100,
    DAILY_MATERIALS: 3,
  };

  /* ═══════════════════════════════════════════════════════
     2. UTILS
     ═══════════════════════════════════════════════════════ */
  const $  = id => document.getElementById(id);
  const log = (...a) => console.log('[Weapon]', ...a);
  const pad2 = n => String(n).padStart(2, '0');

  function setStatus(m){
    try { window.SRank?.setStatus?.(m); } catch(_){}
  }
  function toast(msg, type){
    try { window.Toast?.show?.(msg, { type: type || 'info', duration: 2400 }); } catch(_){}
  }
  function getSb(){
    return window.__sb || null;
  }
  function getUser(){
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (u && (u.id || u.username)) return u;
    } catch(_){}
    return null;
  }
  function nowMs(){ return Date.now(); }
  function todayKey(){
    try { return window.Store?.todayKey?.() || new Date().toISOString().slice(0,10); }
    catch(_){ return new Date().toISOString().slice(0,10); }
  }
  function fmtGold(n){ return (Number(n)||0).toLocaleString('vi-VN'); }
  function fmtTime(ts){
    try {
      const d = new Date(ts);
      return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    } catch(_){ return ''; }
  }
  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ═══════════════════════════════════════════════════════
     3. STATE
     ═══════════════════════════════════════════════════════ */
  function stateKey(userId){ return CFG.LS_PREFIX + (userId || 'guest'); }

  function defaultState(){
    return {
      v: 1,
      gold:          CFG.START_GOLD,
      energy:        CFG.ENERGY_MAX,
      max_energy:    CFG.ENERGY_MAX,
      last_energy_at: nowMs(),
      enh:            0,
      hammer:         'wooden',
      hammers:        ['wooden'],
      materials:      { wood: 10 },
      combo:          0,
      best_combo:     0,
      fails:          0,
      total_forges:   0,
      total_success:  0,
      total_broken:   0,
      total_sold:     0,
      total_gold_earned: 0,
      best_power:     0,
      achievements:   {},
      daily_last:     null,
      history:        [],
    };
  }

  function normalizeState(raw){
    const d = defaultState();
    if (!raw || typeof raw !== 'object') return d;
    const s = Object.assign({}, d, raw);
    // defensive: numbers
    s.gold = Math.max(0, Number(s.gold)||0);
    s.energy = Math.max(0, Math.min(CFG.ENERGY_MAX, Number(s.energy)||0));
    s.enh = Math.max(0, Math.min(15, Number(s.enh)||0));
    s.combo = Math.max(0, Number(s.combo)||0);
    s.fails = Math.max(0, Number(s.fails)||0);
    // objects
    s.materials = (s.materials && typeof s.materials === 'object') ? s.materials : {};
    s.hammers = Array.isArray(s.hammers) ? s.hammers.filter(h => CFG.HAMMERS[h]) :