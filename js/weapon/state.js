/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #4: STATE + STORAGE + REMOTE SYNC (v5.0)
   ───────────────────────────────────────────────────────────────────────
   CHANGELOG v5.0:
     - Migration: enh cũ 0-15 → 0-100 (scale tuyến tính, chỉ chạy 1 lần)
     - normalizeState: clamp enh 0-MAX_ENH
     - defaultState có v5_migrated flag
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.state) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  if (!C || !U) { console.error('[WF] state.js cần config.js + utils.js load trước'); return; }

  const CFG = C.CFG;
  const MAX_ENH = C.MAX_ENH;
  const { nowMs, getSb } = U;

  /* ═══════════════════════════════════════════════════════════════
     RUNTIME STATE
     ═══════════════════════════════════════════════════════════════ */
  const S = {
    user: null, state: null, busy: false,
    activeTab: 'forge', arenaSubTab: 'incoming',
    chatCooldownUntil: 0,
    currentBattleId: null, battleState: null,
    battleChannel: null, battlePollTimer: null,
    activeBattleData: null,
    bossAttacking: false,
  };

  const SOC = {
    arena: null, chat: [], feed: [], giftTargets: [],
    pendingChallenges: 0, unreadChat: 0,
    quests: null, questsDayKey: '',
    season: null, seasonProgress: null,
    pets: [],
    boss: null, bossMy: null, bossTotal: 0,
    unclaimedQuests: 0, unclaimedSeason: 0, claimableBoss: false,
  };

  /* ═══════════════════════════════════════════════════════════════
     ACTIVE BATTLE CACHE
     ═══════════════════════════════════════════════════════════════ */
  const ACTIVE_BATTLE_KEY = '__wf_active_battle_';

  function saveActiveBattleId(userId, matchId){
    try {
      if (!userId) return;
      if (matchId) {
        localStorage.setItem(ACTIVE_BATTLE_KEY + userId, JSON.stringify({ matchId, at: Date.now() }));
      } else {
        localStorage.removeItem(ACTIVE_BATTLE_KEY + userId);
      }
    } catch(_){}
  }

  function getActiveBattleId(userId){
    try {
      if (!userId) return null;
      const raw = localStorage.getItem(ACTIVE_BATTLE_KEY + userId);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o?.matchId || null;
    } catch(_){ return null; }
  }

  /* ═══════════════════════════════════════════════════════════════
     GAME STATE
     ═══════════════════════════════════════════════════════════════ */
  function stateKey(uid){ return CFG.LS_PREFIX + (uid||'guest'); }

  function defaultState(){
    return {
      v: 1,
      v5_migrated: true,   // user mới không cần migrate
      gold: CFG.START_GOLD, energy: CFG.ENERGY_MAX,
      max_energy: CFG.ENERGY_MAX, last_energy_at: nowMs(),
      enh: 0, hammer: 'wooden', hammers: ['wooden'],
      materials: { wood: 10 },
      combo: 0, best_combo: 0, fails: 0,
      total_forges: 0, total_success: 0, total_broken: 0,
      total_sold: 0, total_gold_earned: 0, best_power: 0,
      achievements: {}, daily_last: null, history: [],
    };
  }

  function normalizeState(raw){
    const d = defaultState();
    if (!raw || typeof raw !== 'object') return d;
    const s = Object.assign({}, d, raw);

    /* ⭐ MIGRATION v5: enh cũ 0-15 → 0-100 (chỉ chạy 1 lần) */
    if (!raw.v5_migrated && typeof raw.enh === 'number' && raw.enh > 0 && raw.enh <= 15){
      const oldEnh = raw.enh;
      s.enh = Math.min(MAX_ENH, Math.round(oldEnh * MAX_ENH / 15));
      s.v5_migrated = true;
    }

    s.gold = Math.max(0, Number(s.gold)||0);
    s.energy = Math.max(0, Math.min(CFG.ENERGY_MAX, Number(s.energy)||0));
    s.enh = Math.max(0, Math.min(MAX_ENH, Number(s.enh)||0));
    s.combo = Math.max(0, Number(s.combo)||0);
    s.fails = Math.max(0, Number(s.fails)||0);
    s.materials = (s.materials && typeof s.materials === 'object') ? s.materials : {};
    s.hammers = Array.isArray(s.hammers) ? s.hammers.filter(h => CFG.HAMMERS[h]) : ['wooden'];
    if (!s.hammers.includes('wooden')) s.hammers.unshift('wooden');
    if (!CFG.HAMMERS[s.hammer] || !s.hammers.includes(s.hammer)) s.hammer = 'wooden';
    s.achievements = (s.achievements && typeof s.achievements === 'object') ? s.achievements : {};
    s.history = Array.isArray(s.history) ? s.history.slice(0, 50) : [];
    return s;
  }

  function loadLocal(uid){
    try {
      const raw = localStorage.getItem(stateKey(uid));
      return raw ? normalizeState(JSON.parse(raw)) : null;
    } catch(_){ return null; }
  }

  function saveLocal(uid, s){
    try { localStorage.setItem(stateKey(uid), JSON.stringify(s)); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     REMOTE SYNC
     ═══════════════════════════════════════════════════════════════ */
  let _remoteAvailable = null;
  let _saveTimer = null;

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
      if (res.error){ _remoteAvailable = false; return false; }
      if (res.data && res.data.ok !== true){ _remoteAvailable = false; return false; }
      _remoteAvailable = true;
      return true;
    } catch(_){ _remoteAvailable = false; return false; }
  }

  function schedulePush(){
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      if (S.user && S.state) pushRemote(S.state).catch(()=>{});
    }, CFG.SAVE_DEBOUNCE_MS);
  }

  function scheduleSave(){
    if (!S.user || !S.state) return;
    saveLocal(S.user.id, S.state);
    schedulePush();
  }

  /* ═══════════════════════════════════════════════════════════════
     MERGE
     ═══════════════════════════════════════════════════════════════ */
  function mergeState(local, remoteState){
    if (!remoteState) return local ? normalizeState(local) : defaultState();
    if (!local) return normalizeState(remoteState);
    const base = (local.total_forges||0) >= (remoteState.total_forges||0)
      ? { ...local }
      : { ...remoteState };
    base.gold = Math.max(local.gold||0, remoteState.gold||0);
    base.energy = Math.max(local.energy||0, remoteState.energy||0);
    base.best_power = Math.max(local.best_power||0, remoteState.best_power||0);
    base.total_gold_earned = Math.max(local.total_gold_earned||0, remoteState.total_gold_earned||0);
    const allMats = new Set([
      ...Object.keys(local.materials||{}),
      ...Object.keys(remoteState.materials||{}),
    ]);
    base.materials = {};
    allMats.forEach(id => {
      base.materials[id] = Math.max(
        (local.materials && local.materials[id])||0,
        (remoteState.materials && remoteState.materials[id])||0
      );
    });
    base.achievements = Object.assign(
      {},
      remoteState.achievements||{},
      local.achievements||{}
    );
    return normalizeState(base);
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.state = {
    S, SOC,
    ACTIVE_BATTLE_KEY,
    saveActiveBattleId, getActiveBattleId,
    stateKey, defaultState, normalizeState,
    loadLocal, saveLocal,
    pullRemote, pushRemote,
    schedulePush, scheduleSave,
    mergeState,
    isRemoteAvailable: () => _remoteAvailable,
  };

  console.log('[WF] state.js ✓ (v5.0 — migrate enh 15→100)');
})();