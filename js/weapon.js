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
    s.hammers = Array.isArray(s.hammers) ? s.hammers.filter(h => CFG.HAMMERS[h]) : ['wooden'];
    if (!s.hammers.includes('wooden')) s.hammers.unshift('wooden');
    if (!CFG.HAMMERS[s.hammer] || !s.hammers.includes(s.hammer)) s.hammer = 'wooden';
    s.achievements = (s.achievements && typeof s.achievements === 'object') ? s.achievements : {};
    s.history = Array.isArray(s.history) ? s.history.slice(0, 50) : [];
    return s;
  }

  function loadLocal(userId){
    try {
      const raw = localStorage.getItem(stateKey(userId));
      return raw ? normalizeState(JSON.parse(raw)) : null;
    } catch(_){ return null; }
  }
  function saveLocal(userId, s){
    try { localStorage.setItem(stateKey(userId), JSON.stringify(s)); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════
     4. REMOTE SYNC (Supabase — tùy chọn)
     ═══════════════════════════════════════════════════════ */
  let _remoteAvailable = null;   // null=unknown, true/false sau khi thử
  let _saveTimer = null;
  let _lastStateSnapshot = null;

  async function pullRemote(){
    const sb = getSb();
    if (!sb || typeof sb.rpc !== 'function') return null;
    try {
      const res = await sb.rpc('rpc_weapon_get_state');
      if (res.error){
        if (/does not exist|not found|schema cache/i.test(String(res.error.message||''))) {
          _remoteAvailable = false;
        }
        return null;
      }
      const d = res.data || {};
      if (d.ok !== true) { _remoteAvailable = false; return null; }
      _remoteAvailable = true;
      return {
        state: normalizeState(d.state || {}),
        updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : 0,
      };
    } catch(_){ _remoteAvailable = false; return null; }
  }

  async function pushRemote(state){
    const sb = getSb();
    if (!sb || typeof sb.rpc !== 'function') return false;
    if (_remoteAvailable === false) return false;
    try {
      const res = await sb.rpc('rpc_weapon_save_state', { p_state: state });
      if (res.error){
        _remoteAvailable = false;
        return false;
      }
      if (res.data && res.data.ok !== true){
        _remoteAvailable = false;
        return false;
      }
      _remoteAvailable = true;
      return true;
    } catch(_){ _remoteAvailable = false; return false; }
  }

  function schedulePush(){
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      if (!S.user || !S.state) return;
      _lastStateSnapshot = JSON.stringify(S.state);
      pushRemote(S.state).catch(()=>{});
    }, CFG.SAVE_DEBOUNCE_MS);
  }

  /* ═══════════════════════════════════════════════════════
     5. GAME MATH
     ═══════════════════════════════════════════════════════ */
  function tierOf(enh){
    const i = Math.max(0, Math.min(15, enh|0));
    return CFG.ENH_TO_TIER[i] || 'B';
  }
  function tierInfo(enh){ return CFG.TIERS[tierOf(enh)]; }

  function powerOf(enh){
    const t = tierInfo(enh);
    return Math.round(t.mult * (enh + 1) * 100) / 100;
  }
  function sellPrice(enh){
    // power * 5 = gold
    return Math.round(powerOf(enh) * 5);
  }

  function effectiveRates(s){
    const base = Object.assign({}, CFG.BASE_RATES);
    const hammer = CFG.HAMMERS[s.hammer] || {};
    const matBonus = currentMaterialBonus(s);

    // apply hammer bonus
    applyBonus(base, hammer.bonus);
    // apply material bonus
    applyBonus(base, matBonus);
    // apply combo bonus to success, subtract from hold
    if (s.combo > 0){
      const cBonus = Math.min(CFG.COMBO_BONUS_CAP, s.combo * CFG.COMBO_BONUS_PER_STACK);
      base.success = (base.success||0) + cBonus;
      base.hold    = Math.max(0, (base.hold||0) - cBonus);
    }

    // clamp >= 0
    ['broken','damaged','hold','success','great'].forEach(k => {
      base[k] = Math.max(0, Number(base[k])||0);
    });

    // normalize to 100
    const sum = Object.values(base).reduce((a,b)=>a+b, 0);
    if (sum > 0 && Math.abs(sum - 100) > 0.5){
      const scale = 100 / sum;
      Object.keys(base).forEach(k => { base[k] = Math.round(base[k] * scale * 10) / 10; });
    }
    return base;
  }

  function applyBonus(rates, bonus){
    if (!bonus) return;
    Object.keys(bonus).forEach(k => {
      rates[k] = (rates[k] || 0) + Number(bonus[k] || 0);
    });
  }

  function currentMaterialBonus(s){
    // material of current tier — bonuses apply only if user HAS and uses it
    // Design: mats are auto-consumed on forge (1 per forge) if available
    const tier = tierOf(s.enh);
    const matId = materialForTier(tier);
    if (!matId) return {};
    if ((s.materials[matId] || 0) <= 0) return {};
    return CFG.MATERIALS[matId].bonus;
  }

  function materialForTier(tier){
    return {
      B:   'wood',
      A:   'iron',
      S:   'steel',
      SS:  'mythril',
      SSS: 'orichalcum',
      VIP: 'star',
    }[tier] || null;
  }

  function rollOutcome(rates, pityFails){
    // Pity override
    if (pityFails >= CFG.PITY_FAILS_FOR_GREAT) return 'great';
    if (pityFails >= CFG.PITY_FAILS_FOR_SUCCESS) return 'success';

    const r = Math.random() * 100;
    let acc = 0;
    for (const key of ['broken', 'damaged', 'hold', 'success', 'great']){
      acc += rates[key] || 0;
      if (r < acc) return key;
    }
    return 'success'; // fallback
  }

  function applyOutcome(s, outcome){
    // returns { deltaEnh, goldDelta, matConsumed }
    const before = s.enh;
    let deltaEnh = 0;
    let goldDelta = 0;

    if (outcome === 'broken'){
      deltaEnh = before > 0 ? -1 : 0;
      s.total_broken++;
      s.combo = 0;
      s.fails++;
    } else if (outcome === 'damaged'){
      deltaEnh = before > 0 ? -1 : 0;
      s.combo = 0;
      s.fails++;
    } else if (outcome === 'hold'){
      deltaEnh = 0;
      s.combo = 0;
      s.fails++;
    } else if (outcome === 'success'){
      deltaEnh = +1;
      s.combo++;
      s.fails = 0;
      s.total_success++;
    } else if (outcome === 'great'){
      deltaEnh = +2;
      goldDelta = 20;
      s.combo++;
      s.fails = 0;
      s.total_success++;
    }

    s.enh = Math.max(0, Math.min(15, before + deltaEnh));
    s.gold += goldDelta;
    s.best_combo = Math.max(s.best_combo, s.combo);
    s.total_forges++;

    // track best power for leaderboard
    const p = powerOf(s.enh);
    if (p > (s.best_power || 0)) s.best_power = p;

    return {
      outcome,
      deltaEnh,
      goldDelta,
      prevEnh: before,
      newEnh: s.enh,
    };
  }

  function consumeMaterial(s){
    const tier = tierOf(s.enh);
    const matId = materialForTier(tier);
    if (!matId) return null;
    if ((s.materials[matId] || 0) <= 0) return null;
    s.materials[matId]--;
    return matId;
  }

  function regenEnergy(s){
    if (s.energy >= CFG.ENERGY_MAX){
      s.last_energy_at = nowMs();
      return 0;
    }
    const elapsed = nowMs() - (s.last_energy_at || nowMs());
    if (elapsed < 0) { s.last_energy_at = nowMs(); return 0; }
    const gained = Math.floor(elapsed / CFG.ENERGY_REGEN_MS);
    if (gained <= 0) return 0;
    const before = s.energy;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + gained);
    s.last_energy_at += gained * CFG.ENERGY_REGEN_MS;
    return s.energy - before;
  }

  function checkAchievements(s){
    const unlocked = [];
    const check = (key, cond) => {
      if (s.achievements[key]) return;
      if (!cond) return;
      s.achievements[key] = true;
      const ach = CFG.ACHIEVEMENTS[key];
      if (ach){
        s.gold += ach.gold;
        unlocked.push({ key, ...ach });
      }
    };
    check('first_forge', s.total_forges >= 1);
    check('forge_10',    s.total_forges >= 10);
    check('forge_100',   s.total_forges >= 100);
    check('enh_5',       s.enh >= 5);
    check('enh_10',      s.enh >= 10);
    check('enh_15',      s.enh >= 15);
    check('combo_5',     s.best_combo >= 5);
    check('combo_10',    s.best_combo >= 10);
    check('combo_20',    s.best_combo >= 20);
    check('broke_5',     s.total_broken >= 5);
    check('sell_10',     s.total_sold >= 10);
    check('reach_vip',   tierOf(s.enh) === 'VIP');
    return unlocked;
  }

  /* ═══════════════════════════════════════════════════════
     6. AUDIO + HAPTICS + ANIMATION HELPERS
     ═══════════════════════════════════════════════════════ */
  let _audioCtx = null;
  function playSound(freq, dur, type){
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_audioCtx) _audioCtx = new Ctx();
      if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(()=>{});
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, _audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + dur);
      osc.connect(gain).connect(_audioCtx.destination);
      osc.start();
      osc.stop(_audioCtx.currentTime + dur + 0.05);
    } catch(_){}
  }

  function playForgeSound(outcome){
    if (outcome === 'broken')  { playSound(400, .3, 'sawtooth'); setTimeout(()=>playSound(150,.4,'sawtooth'), 60); }
    else if (outcome === 'damaged'){ playSound(300, .25, 'square'); }
    else if (outcome === 'hold')   { playSound(500, .15, 'sine'); }
    else if (outcome === 'success'){ playSound(600, .12); setTimeout(()=>playSound(800,.15), 80); }
    else if (outcome === 'great'){
      playSound(523, .1); setTimeout(()=>playSound(659,.1),80);
      setTimeout(()=>playSound(784,.1),160); setTimeout(()=>playSound(1047,.25),240);
    }
  }

  function vibrate(pattern){
    try { navigator.vibrate?.(pattern); } catch(_){}
  }

  function shakeScreen(){
    const page = $('weaponPage');
    if (!page) return;
    page.classList.remove('shake');
    void page.offsetWidth;
    page.classList.add('shake');
    setTimeout(()=>page.classList.remove('shake'), 400);
  }

  function spawnSparks(count){
    const card = $('wfStage');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    for (let i = 0; i < (count||10); i++){
      const el = document.createElement('div');
      el.className = 'wf-spark';
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--ty', Math.sin(angle) * dist - 20 + 'px');
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 900);
    }
  }

  function numberPop(text, color, x, y){
    const el = document.createElement('div');
    el.className = 'wf-number-pop';
    el.textContent = text;
    el.style.color = color || '#d97706';
    el.style.left = (x || window.innerWidth/2) + 'px';
    el.style.top  = (y || window.innerHeight/2) + 'px';
    el.style.transform = 'translate(-50%, 0)';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1100);
  }

  /* ═══════════════════════════════════════════════════════
     7. APP STATE + DOM
     ═══════════════════════════════════════════════════════ */
  const S = {
    user: null,
    state: null,
    busy: false,
    activeTab: 'forge',
    lbCache: null,
  };

  /* ═══════════════════════════════════════════════════════
     8. BUILD PAGE
     ═══════════════════════════════════════════════════════ */
  function ensurePage(){
    let page = $('weaponPage');
    if (page) return page;
    page = document.createElement('section');
    page.id = 'weaponPage';
    page.setAttribute('aria-label', 'Xưởng rèn vũ khí');
    page.setAttribute('aria-hidden', 'true');
    page.innerHTML = `
      <header class="wf-head">
        <button class="wf-head-btn" id="wfBack" type="button" aria-label="Đóng">←</button>
        <div class="wf-head-title">
          <span class="wf-kicker">XƯỞNG RÈN</span>
          <span class="wf-title">Vũ khí</span>
        </div>
        <div class="wf-pills">
          <div class="wf-pill gold" id="wfGoldPill"><span>🪙</span><span id="wfGoldVal">0</span></div>
        </div>
      </header>
      <div class="wf-body" id="wfBody"></div>

      <div class="wf-result" id="wfResult">
        <div class="wf-result-card">
          <div class="wf-result-emoji" id="wfResEmoji">✨</div>
          <div class="wf-result-title" id="wfResTitle">—</div>
          <div class="wf-result-desc" id="wfResDesc">—</div>
          <div class="wf-result-changes" id="wfResChanges"></div>
          <button class="wf-result-btn" id="wfResOk" type="button">Tiếp tục</button>
        </div>
      </div>
    `;
    document.body.appendChild(page);
    page.querySelector('#wfBack').addEventListener('click', closePage);
    page.querySelector('#wfResOk').addEventListener('click', closeResult);
    page.querySelector('#wfResult').addEventListener('click', e => {
      if (e.target.id === 'wfResult') closeResult();
    });
    return page;
  }

  /* ═══════════════════════════════════════════════════════
     9. RENDER
     ═══════════════════════════════════════════════════════ */
  function render(){
    const body = $('wfBody');
    if (!body) return;

    if (!S.user){
      body.innerHTML = renderLoginWall();
      body.querySelector('#wfLoginBtn')?.addEventListener('click', () => {
        try { window.SRank?.openLogin?.(); } catch(_){}
      });
      return;
    }
    if (!S.state){
      body.innerHTML = '<div class="wf-history-empty">Đang tải…</div>';
      return;
    }

    // apply energy regen
    const gained = regenEnergy(S.state);
    if (gained > 0) scheduleSave();

    // gold pill
    const gv = $('wfGoldVal');
    if (gv) gv.textContent = fmtGold(S.state.gold);

    // ─── compose tabs
    let tabsHTML = '<nav class="wf-tabs">';
    const tabs = [
      { key: 'forge',       icon: '🔨', label: 'Rèn' },
      { key: 'market',      icon: '🏪', label: 'Chợ' },
      { key: 'inventory',   icon: '🎒', label: 'Kho' },
      { key: 'leaderboard', icon: '🏆', label: 'BXH' },
      { key: 'history',     icon: '📜', label: 'Sử ký' },
    ];
    tabs.forEach(t => {
      tabsHTML += `<button class="wf-tab ${S.activeTab===t.key?'active':''}" data-tab="${t.key}" type="button">
        <span class="wf-tab-icon">${t.icon}</span>
        <span class="wf-tab-label">${t.label}</span>
      </button>`;
    });
    tabsHTML += '</nav>';

    let contentHTML = '';
    if (S.activeTab === 'forge') contentHTML = renderForgeTab();
    else if (S.activeTab === 'market') contentHTML = renderMarketTab();
    else if (S.activeTab === 'inventory') contentHTML = renderInventoryTab();
    else if (S.activeTab === 'leaderboard') contentHTML = renderLeaderboardTab();
    else if (S.activeTab === 'history') contentHTML = renderHistoryTab();

    body.innerHTML = tabsHTML + contentHTML;

    // wire tabs
    body.querySelectorAll('.wf-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        S.activeTab = btn.dataset.tab;
        render();
        if (S.activeTab === 'leaderboard') loadLeaderboard();
      });
    });

    // wire tab-specific buttons
    if (S.activeTab === 'forge'){
      $('wfForgeBtn')?.addEventListener('click', doForge);
    }
    if (S.activeTab === 'market'){
      body.querySelectorAll('[data-buy-mat]').forEach(btn => {
        btn.addEventListener('click', () => doBuyMaterial(btn.dataset.buyMat));
      });
      body.querySelectorAll('[data-buy-hammer]').forEach(btn => {
        btn.addEventListener('click', () => doBuyHammer(btn.dataset.buyHammer));
      });
      body.querySelectorAll('[data-equip-hammer]').forEach(btn => {
        btn.addEventListener('click', () => doEquipHammer(btn.dataset.equipHammer));
      });
      $('wfRefillBtn')?.addEventListener('click', doRefillEnergy);
    }
    if (S.activeTab === 'inventory'){
      $('wfSellBtn')?.addEventListener('click', doSell);
    }
    if (S.activeTab === 'leaderboard'){
      $('wfLbRefresh')?.addEventListener('click', () => loadLeaderboard(true));
    }
  }

  function renderLoginWall(){
    return `
      <div class="wf-login-wall">
        <div class="wf-login-wall-emoji">⚔️</div>
        <div class="wf-login-wall-title">Cần đăng nhập</div>
        <div class="wf-login-wall-sub">Đăng nhập để bắt đầu rèn vũ khí và lưu tiến trình.</div>
        <button class="wf-login-btn" id="wfLoginBtn" type="button">🔐 Đăng nhập</button>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════
     10. TAB: FORGE
     ═══════════════════════════════════════════════════════ */
  function renderForgeTab(){
    const s = S.state;
    const tier = tierOf(s.enh);
    const ti = CFG.TIERS[tier];
    const power = powerOf(s.enh);
    const prevTierEnh = nextTierThreshold(s.enh);
    const curTierBase = tierBaseEnh(s.enh);
    const tierProgress = prevTierEnh > curTierBase
      ? Math.min(100, ((s.enh - curTierBase) / (prevTierEnh - curTierBase)) * 100)
      : 100;

    const canForge = s.energy >= CFG.FORGE_ENERGY && s.gold >= CFG.FORGE_GOLD && !S.busy && s.enh < 15;
    const forgeBtnLabel = s.enh >= 15
      ? '🏆 Đã đạt cấp tối đa'
      : s.energy < CFG.FORGE_ENERGY
        ? '⚡ Hết năng lượng'
        : s.gold < CFG.FORGE_GOLD
          ? '🪙 Không đủ vàng'
          : '🔨 Rèn vũ khí';

    const matId = materialForTier(tier);
    const mat = matId ? CFG.MATERIALS[matId] : null;
    const matQty = matId ? (s.materials[matId] || 0) : 0;

    const energyPct = (s.energy / CFG.ENERGY_MAX) * 100;

    return `
      <div class="wf-energy-wrap">
        <span class="wf-energy-label">⚡</span>
        <div class="wf-energy-track"><div class="wf-energy-fill" style="width:${energyPct}%"></div></div>
        <span class="wf-energy-num">${s.energy}/${CFG.ENERGY_MAX}</span>
      </div>

      <div class="wf-stage" id="wfStage">
        <div class="wf-hammer" id="wfHammer">${CFG.HAMMERS[s.hammer].emoji}</div>
        <div class="wf-weapon-wrap" id="wfWeaponWrap">
          <div class="wf-weapon" id="wfWeaponEmoji">${ti.emoji}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="wf-tier-badge tier-${tier}">${tier}</span>
            <span class="wf-enh-badge">+<b>${s.enh}</b></span>
          </div>
          <div class="wf-weapon-name">${escapeHtml(ti.name)}</div>
          <div class="wf-progress">
            <div class="wf-progress-fill" style="width:${tierProgress}%"></div>
          </div>
          <div class="wf-progress-label">${s.enh >= 15 ? 'MAX' : `${s.enh} / ${prevTierEnh}`}</div>
        </div>
      </div>

      <div class="wf-stats">
        <div class="wf-stat combo">
          <div class="wf-stat-value ${s.combo >= 5 ? 'hot' : ''}">${s.combo}</div>
          <div class="wf-stat-label">🔥 Combo</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-value">${Math.round(power * 100) / 100}</div>
          <div class="wf-stat-label">⚡ Power</div>
        </div>
        <div class="wf-stat">
          <div class="wf-stat-value ${s.fails > 5 ? 'neg' : ''}">${s.fails}</div>
          <div class="wf-stat-label">🎯 Pity</div>
        </div>
      </div>

      <button class="wf-forge-btn ${canForge?'':'disabled'}" id="wfForgeBtn" type="button"
              ${canForge?'':'disabled'}>
        <span>${forgeBtnLabel}</span>
        <span class="wf-cost-tag">🪙 ${CFG.FORGE_GOLD} · ⚡ ${CFG.FORGE_ENERGY}${mat ? ` · ${mat.emoji} ${matQty}` : ''}</span>
      </button>
    `;
  }

  function tierBaseEnh(enh){
    // first enh value of the tier
    const tier = tierOf(enh);
    for (let i = 0; i <= 15; i++){
      if (tierOf(i) === tier) return i;
    }
    return 0;
  }
  function nextTierThreshold(enh){
    const tier = tierOf(enh);
    const idx = CFG.TIER_ORDER.indexOf(tier);
    if (idx < 0 || idx >= CFG.TIER_ORDER.length - 1) return 15;
    const nextTier = CFG.TIER_ORDER[idx + 1];
    for (let i = enh + 1; i <= 15; i++){
      if (tierOf(i) === nextTier) return i;
    }
    return 15;
  }

  /* ═══════════════════════════════════════════════════════
     11. TAB: MARKET
     ═══════════════════════════════════════════════════════ */
  function renderMarketTab(){
    const s = S.state;
    const tier = tierOf(s.enh);
    const neededMat = materialForTier(tier);

    // ─── Hammers section
    let hammersHTML = '<div class="wf-section"><div class="wf-section-title">🔨 Búa</div>';
    Object.keys(CFG.HAMMERS).forEach(id => {
      const h = CFG.HAMMERS[id];
      const owned = s.hammers.includes(id);
      const equipped = s.hammer === id;
      const btn = equipped
        ? `<button class="wf-card-btn equipped" type="button" disabled>Đang dùng</button>`
        : owned
          ? `<button class="wf-card-btn" data-equip-hammer="${id}" type="button">Trang bị</button>`
          : `<button class="wf-card-btn buy" data-buy-hammer="${id}" type="button" ${s.gold >= h.price ? '' : 'disabled'}>🪙 ${fmtGold(h.price)}</button>`;

      hammersHTML += `
        <div class="wf-card ${equipped?'equipped':''}">
          <div class="wf-card-icon">${h.emoji}</div>
          <div class="wf-card-body">
            <div class="wf-card-name">${escapeHtml(h.name)}</div>
            <div class="wf-card-meta">
              <span class="wf-rarity-badge ${h.rarity}">${h.rarity}</span>
              ${describeBonus(h.bonus)}
            </div>
          </div>
          ${btn}
        </div>
      `;
    });
    hammersHTML += '</div>';

    // ─── Materials section
    let matsHTML = '<div class="wf-section"><div class="wf-section-title">💎 Vật liệu</div>';
    Object.keys(CFG.MATERIALS).forEach(id => {
      const m = CFG.MATERIALS[id];
      const qty = s.materials[id] || 0;
      const needed = id === neededMat;
      matsHTML += `
        <div class="wf-card">
          <div class="wf-card-icon">${m.emoji}</div>
          <div class="wf-card-body">
            <div class="wf-card-name">${escapeHtml(m.name)} ${needed ? '<span style="color:#dc2626;font-size:10px">· cần cho tier hiện tại</span>' : ''}</div>
            <div class="wf-card-meta">
              <span class="wf-qty">Có: <b>${qty}</b></span>
              ${describeBonus(m.bonus)}
            </div>
          </div>
          <button class="wf-card-btn buy" data-buy-mat="${id}" type="button" ${s.gold >= m.price ? '' : 'disabled'}>🪙 ${fmtGold(m.price)}</button>
        </div>
      `;
    });
    matsHTML += '</div>';

    // ─── Energy refill
    const refillHTML = `
      <div class="wf-section">
        <div class="wf-section-title">⚡ Năng lượng</div>
        <div class="wf-card">
          <div class="wf-card-icon">⚡</div>
          <div class="wf-card-body">
            <div class="wf-card-name">Nạp +${CFG.REFILL_AMOUNT} năng lượng</div>
            <div class="wf-card-meta">Hiện: ${s.energy}/${CFG.ENERGY_MAX} · Tự hồi 1 năng lượng / 6 phút</div>
          </div>
          <button class="wf-card-btn buy" id="wfRefillBtn" type="button" ${s.gold >= CFG.REFILL_COST_GOLD && s.energy < CFG.ENERGY_MAX ? '' : 'disabled'}>🪙 ${CFG.REFILL_COST_GOLD}</button>
        </div>
      </div>
    `;

    return hammersHTML + matsHTML + refillHTML;
  }

  function describeBonus(bonus){
    if (!bonus || !Object.keys(bonus).length) return '<span style="opacity:.6">không có bonus</span>';
    const labels = { broken: 'gãy', damaged: 'hư', hold: 'giữ', success: '✓', great: '✨' };
    return Object.keys(bonus).map(k => {
      const v = bonus[k];
      const sign = v > 0 ? '+' : '';
      return `<span style="color:${v>=0?'#15803d':'#b91c1c'};font-weight:900">${labels[k]||k} ${sign}${v}%</span>`;
    }).join(' · ');
  }

  /* ═══════════════════════════════════════════════════════
     12. TAB: INVENTORY (achievements + sell)
     ═══════════════════════════════════════════════════════ */
  function renderInventoryTab(){
    const s = S.state;
    const tier = tierOf(s.enh);
    const ti = CFG.TIERS[tier];
    const power = powerOf(s.enh);
    const price = sellPrice(s.enh);

    let achHTML = '<div class="wf-section"><div class="wf-section-title">🏅 Thành tựu</div><div class="wf-achievements">';
    Object.keys(CFG.ACHIEVEMENTS).forEach(key => {
      const a = CFG.ACHIEVEMENTS[key];
      const unlocked = !!s.achievements[key];
      achHTML += `
        <div class="wf-ach ${unlocked?'unlocked':''}">
          <div class="wf-ach-icon">${a.icon}</div>
          <div>
            <div class="wf-ach-name">${escapeHtml(a.name)}</div>
            <div class="wf-ach-desc">${escapeHtml(a.desc)}</div>
          </div>
          <div class="wf-ach-reward">${unlocked ? '✓' : `🪙 ${a.gold}`}</div>
        </div>
      `;
    });
    achHTML += '</div></div>';

    return `
      <div class="wf-inventory-hero">
        <div class="wf-inv-weapon">${ti.emoji}</div>
        <div class="wf-inv-name">${escapeHtml(ti.name)} +${s.enh}</div>
        <div class="wf-inv-power">⚡ Power: ${Math.round(power*100)/100}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button class="wf-card-btn buy" id="wfSellBtn" type="button" ${s.enh > 0 ? '' : 'disabled'}>
            💰 Bán (${fmtGold(price)}🪙)
          </button>
        </div>
        <div style="font-size:11px;color:#a06a28;font-weight:700;margin-top:10px;line-height:1.4;">
          Bán sẽ reset vũ khí về +0 và nhận vàng theo power.<br>
          Dùng vàng để mua búa / vật liệu.
        </div>
      </div>
      ${achHTML}
    `;
  }

  /* ═══════════════════════════════════════════════════════
     13. TAB: LEADERBOARD
     ═══════════════════════════════════════════════════════ */
  function renderLeaderboardTab(){
    const cache = S.lbCache;
    if (!cache){
      return `
        <div class="wf-history-empty">Đang tải bảng xếp hạng…</div>
        <button class="wf-card-btn buy" id="wfLbRefresh" type="button" style="width:100%;margin-top:8px;">↻ Tải lại</button>
      `;
    }
    if (!cache.length){
      return `
        <div class="wf-history-empty">Chưa có ai trong bảng xếp hạng</div>
        <button class="wf-card-btn buy" id="wfLbRefresh" type="button" style="width:100%;margin-top:8px;">↻ Tải lại</button>
      `;
    }
    const me = S.user?.id;
    const myName = S.user?.displayName || S.user?.username || '';
    let html = '<div class="wf-lb">';
    cache.forEach((row, i) => {
      const isMe = row.user_id === me;
      const enh = Number(row.state?.enh) || 0;
      const tier = tierOf(enh);
      const ti = CFG.TIERS[tier];
      const power = row.best_power || row.state?.best_power || powerOf(enh);
      const name = isMe ? (myName || 'Bạn') : (row.state?.display_name || row.name || 'Người chơi');
      const initial = String(name).trim().slice(0,1).toUpperCase();
      const rankCls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      html += `
        <div class="wf-lb-row ${isMe?'me':''}">
          <div class="wf-lb-rank ${rankCls}">#${i+1}</div>
          <div class="wf-lb-avatar">${initial}</div>
          <div>
            <div class="wf-lb-name">${escapeHtml(name)}</div>
            <div class="wf-lb-meta">${ti.emoji} ${escapeHtml(ti.name)} +${enh}</div>
          </div>
          <div class="wf-lb-power">${Math.round(power*100)/100}</div>
        </div>
      `;
    });
    html += '</div>';
    html += `<button class="wf-card-btn buy" id="wfLbRefresh" type="button" style="width:100%;margin-top:12px;">↻ Tải lại</button>`;
    return html;
  }

  async function loadLeaderboard(force){
    if (!force && S.lbCache) return;
    const sb = getSb();
    if (!sb || typeof sb.rpc !== 'function'){
      S.lbCache = [];
      if (S.activeTab === 'leaderboard') render();
      return;
    }
    try {
      const res = await sb.rpc('rpc_weapon_leaderboard', { p_limit: 20 });
      if (res.error){
        S.lbCache = [];
      } else {
        const d = res.data || {};
        S.lbCache = Array.isArray(d.data) ? d.data : [];
      }
    } catch(_){
      S.lbCache = [];
    }
    if (S.activeTab === 'leaderboard') render();
  }

  /* ═══════════════════════════════════════════════════════
     14. TAB: HISTORY
     ═══════════════════════════════════════════════════════ */
  function renderHistoryTab(){
    const s = S.state;
    if (!s.history.length){
      return '<div class="wf-history-empty">Chưa có lần rèn nào — thử rèn ngay!</div>';
    }
    const labels = {
      broken:  '💥 Gãy',
      damaged: '⚠️ Hư hại',
      hold:    '🛡️ Giữ nguyên',
      success: '✅ Thành công',
      great:   '✨ Đại thành công',
    };
    let html = '<div class="wf-history">';
    s.history.slice(0, 30).forEach(h => {
      const tier = tierOf(h.newEnh || 0);
      const ti = CFG.TIERS[tier];
      const deltaLabel = h.deltaEnh > 0
        ? `+${h.deltaEnh} → +${h.newEnh}`
        : h.deltaEnh < 0
          ? `${h.deltaEnh} → +${h.newEnh}`
          : `giữ +${h.newEnh}`;
      const goldLabel = h.goldDelta > 0 ? ` · +${h.goldDelta}🪙` : '';
      html += `
        <div class="wf-history-item">
          <div class="wf-hi-icon ${h.outcome}">${ti.emoji}</div>
          <div>
            <div class="wf-hi-label">${labels[h.outcome] || h.outcome}</div>
            <div class="wf-hi-sub">${deltaLabel}${goldLabel}</div>
          </div>
          <div class="wf-hi-time">${fmtTime(h.ts)}</div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  /* ═══════════════════════════════════════════════════════
     15. FORGE ACTION
     ═══════════════════════════════════════════════════════ */
  async function doForge(){
    if (S.busy) return;
    if (!S.state) return;
    const s = S.state;

    if (s.enh >= 15){ toast('Đã đạt cấp tối đa', 'warning'); return; }
    if (s.energy < CFG.FORGE_ENERGY){ toast('Hết năng lượng', 'warning'); return; }
    if (s.gold < CFG.FORGE_GOLD){ toast('Không đủ vàng', 'warning'); return; }

    S.busy = true;
    const forgeBtn = $('wfForgeBtn');
    if (forgeBtn){ forgeBtn.classList.add('forging'); forgeBtn.disabled = true; }
    const hammer = $('wfHammer');
    const weapon = $('wfWeaponEmoji');
    const wrap = $('wfWeaponWrap');

    // ─── deduct ───
    s.energy -= CFG.FORGE_ENERGY;
    s.gold   -= CFG.FORGE_GOLD;
    const matUsed = consumeMaterial(s);
    scheduleSave();
    // refresh top pills instantly
    const gv = $('wfGoldVal'); if (gv) gv.textContent = fmtGold(s.gold);

    try {
      // ─── Phase 1: raise hammer ───
      if (hammer){ hammer.classList.remove('striking'); hammer.classList.add('raising'); }
      playSound(180, .1, 'sine');
      await sleep(220);

      // ─── Phase 2: strike ───
      if (hammer){ hammer.classList.remove('raising'); hammer.classList.add('striking'); }
      playSound(120, .08, 'triangle');
      await sleep(160);

      // ─── Phase 3: impact ───
      shakeScreen();
      spawnSparks(8);
      vibrate(30);

      // ─── Compute outcome ───
      const rates = effectiveRates(s);
      const outcome = rollOutcome(rates, s.fails);
      const result = applyOutcome(s, outcome);

      // ─── Phase 4: reveal ───
      if (weapon){
        weapon.classList.remove('shake','shine','shatter');
        if (outcome === 'broken'){
          weapon.classList.add('shatter');
        } else if (outcome === 'damaged' || outcome === 'hold'){
          weapon.classList.add('shake');
        } else if (outcome === 'great'){
          weapon.classList.add('shine');
          spawnSparks(20);
        } else {
          weapon.classList.add('shine');
        }
      }

      // ─── achievements ───
      const unlocked = checkAchievements(s);

      // ─── history ───
      s.history.unshift({
        ts: nowMs(),
        outcome,
        deltaEnh: result.deltaEnh,
        prevEnh: result.prevEnh,
        newEnh: result.newEnh,
        goldDelta: result.goldDelta,
        matUsed,
      });
      if (s.history.length > 50) s.history.length = 50;

      // ─── save ───
      scheduleSave();

      // ─── sounds + vibrate ───
      playForgeSound(outcome);
      if (outcome === 'broken') vibrate([80, 40, 80]);
      else if (outcome === 'great') vibrate([20, 30, 20, 30, 60]);

      // ─── number pop for gold ───
      if (result.goldDelta > 0){
        numberPop(`+${result.goldDelta}🪙`, '#f59e0b');
      }

      await sleep(400);

      // ─── show result modal ───
      showResult(outcome, result, unlocked);

      // ─── render ───
      render();
    } catch(e){
      log('forge error:', e);
      toast('Lỗi khi rèn', 'error');
    } finally {
      S.busy = false;
      if (hammer) hammer.classList.remove('raising','striking');
      if (forgeBtn){ forgeBtn.classList.remove('forging'); }
    }
  }

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  /* ═══════════════════════════════════════════════════════
     16. RESULT MODAL
     ═══════════════════════════════════════════════════════ */
  function showResult(outcome, result, unlocked){
    const overlay = $('wfResult');
    if (!overlay) return;
    const cfgMap = {
      broken:  { emoji: '💥', title: 'Gãy vũ khí',        cls: 'broken'  },
      damaged: { emoji: '⚠️', title: 'Hư hại',            cls: 'damaged' },
      hold:    { emoji: '🛡️', title: 'Giữ nguyên',        cls: 'hold'    },
      success: { emoji: '✅', title: 'Thành công',        cls: 'success' },
      great:   { emoji: '✨', title: 'Đại thành công!',   cls: 'great'   },
    };
    const c = cfgMap[outcome] || cfgMap.hold;
    $('wfResEmoji').textContent = c.emoji;
    const title = $('wfResTitle');
    title.textContent = c.title;
    title.className = 'wf-result-title ' + c.cls;

    const descMap = {
      broken:  result.deltaEnh < 0 ? `Vũ khí gãy mất 1 cấp.` : 'Vũ khí đã ở mức thấp nhất.',
      damaged: result.deltaEnh < 0 ? 'Vũ khí hư hại, mất 1 cấp.' : 'Vũ khí đã ở mức thấp nhất.',
      hold:    'Không có gì thay đổi.',
      success: `Vũ khí mạnh hơn! +1 cấp.`,
      great:   `Bùng nổ! +2 cấp và nhận thêm vàng.`,
    };
    $('wfResDesc').textContent = descMap[outcome] || '';

    // chips
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
    $('wfResChanges').innerHTML = chips.join('');

    overlay.classList.add('show');

    // achievements toast (after close)
    if (unlocked && unlocked.length){
      setTimeout(() => {
        unlocked.forEach(u => {
          toast(`🏅 Thành tựu: ${u.name} (+${u.gold}🪙)`, 'success');
        });
      }, 400);
    }
  }
  function closeResult(){
    $('wfResult')?.classList.remove('show');
  }

  /* ═══════════════════════════════════════════════════════
     17. MARKET ACTIONS
     ═══════════════════════════════════════════════════════ */
  function doBuyMaterial(matId){
    const s = S.state;
    const m = CFG.MATERIALS[matId];
    if (!m){ return; }
    if (s.gold < m.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= m.price;
    s.materials[matId] = (s.materials[matId] || 0) + 1;
    scheduleSave();
    toast(`Mua ${m.emoji} ${m.name} ✓`, 'success');
    render();
  }

  function doBuyHammer(hammerId){
    const s = S.state;
    const h = CFG.HAMMERS[hammerId];
    if (!h || s.hammers.includes(hammerId)) return;
    if (s.gold < h.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= h.price;
    s.hammers.push(hammerId);
    s.hammer = hammerId;
    scheduleSave();
    toast(`Mua ${h.emoji} ${h.name} ✓`, 'success');
    render();
  }

  function doEquipHammer(hammerId){
    const s = S.state;
    if (!s.hammers.includes(hammerId)) return;
    s.hammer = hammerId;
    scheduleSave();
    toast(`Trang bị ${CFG.HAMMERS[hammerId].name} ✓`);
    render();
  }

  function doRefillEnergy(){
    const s = S.state;
    if (s.gold < CFG.REFILL_COST_GOLD){ toast('Không đủ vàng', 'warning'); return; }
    if (s.energy >= CFG.ENERGY_MAX){ toast('Năng lượng đã đầy', 'warning'); return; }
    s.gold -= CFG.REFILL_COST_GOLD;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + CFG.REFILL_AMOUNT);
    s.last_energy_at = nowMs();
    scheduleSave();
    toast(`+${CFG.REFILL_AMOUNT} năng lượng ✓`, 'success');
    render();
  }

  /* ═══════════════════════════════════════════════════════
     18. SELL ACTION
     ═══════════════════════════════════════════════════════ */
  function doSell(){
    const s = S.state;
    if (s.enh <= 0){ toast('Không có gì để bán', 'warning'); return; }
    const price = sellPrice(s.enh);
    if (!confirm(`Bán vũ khí +${s.enh} lấy ${fmtGold(price)} vàng?`)) return;
    s.gold += price;
    s.total_gold_earned += price;
    s.total_sold++;
    s.enh = 0;
    checkAchievements(s);
    scheduleSave();
    toast(`Bán được +${fmtGold(price)} vàng ✓`, 'success');
    render();
  }

  /* ═══════════════════════════════════════════════════════
     19. OPEN / CLOSE
     ═══════════════════════════════════════════════════════ */
  async function openPage(){
    ensurePage();
    const page = $('weaponPage');
    if (!page) return;

    S.user = getUser();
    if (!S.user){
      page.classList.add('show');
      page.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      render();
      return;
    }

    // load state
    page.classList.add('show');
    page.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    render(); // show loading

    // try remote first
    const remote = await pullRemote();
    if (remote && remote.state){
      const local = loadLocal(S.user.id);
      // prefer whichever is more advanced (higher total_forges)
      if (local && (local.total_forges || 0) > (remote.state.total_forges || 0)){
        S.state = local;
      } else {
        S.state = remote.state;
        saveLocal(S.user.id, S.state);
      }
    } else {
      S.state = loadLocal(S.user.id) || defaultState();
    }

    // apply energy regen immediately
    regenEnergy(S.state);

    // track display name for leaderboard
    const dn = S.user.displayName || S.user.username || '';
    if (dn) S.state.display_name = dn;

    // check achievements on load (in case user hadn't been checked before)
    checkAchievements(S.state);
    scheduleSave();

    render();
  }

  function closePage(){
    const page = $('weaponPage');
    if (!page) return;
    page.classList.remove('show');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    closeResult();
    if (S.state && S.user) saveLocal(S.user.id, S.state);
  }

  /* ═══════════════════════════════════════════════════════
     20. SAVE (debounced + local)
     ═══════════════════════════════════════════════════════ */
  function scheduleSave(){
    if (!S.user || !S.state) return;
    saveLocal(S.user.id, S.state);
    schedulePush();
  }

  /* ═══════════════════════════════════════════════════════
     21. BOOT — bind triggers
     ═══════════════════════════════════════════════════════ */
  function bindTriggers(){
    // button in #secondaryNav
    const sec = document.getElementById('weaponBtn');
    if (sec && !sec.__wfBound){
      sec.__wfBound = true;
      sec.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openPage();
      });
    }
    // menu item (data-target="weaponBtn") — handled by menu.js proxy, no-op needed
  }

  function boot(){
    ensurePage();
    bindTriggers();
    // Re-bind in case menu item appears later
    let tries = 0;
    const t = setInterval(() => {
      bindTriggers();
      if (++tries > 20) clearInterval(t);
    }, 300);
    log('v2.0 ready ✓');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ═══════════════════════════════════════════════════════
     22. PUBLIC API
     ═══════════════════════════════════════════════════════ */
  window.WeaponForge = {
    open: openPage,
    close: closePage,
    state: () => S.state,
    config: CFG,
    reset: () => {
      if (!S.user) return;
      localStorage.removeItem(stateKey(S.user.id));
      S.state = defaultState();
      render();
    },
    // debug
    _S: S,
  };
})();