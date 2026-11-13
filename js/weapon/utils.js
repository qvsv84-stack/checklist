/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #2: UTILS
   - Pure helpers: escape, format, avatar, toast
   - Audio (Web Audio API)
   - Haptics (vibrate)
   - Visual effects (shake, sparks, number pop)
   - Không phụ thuộc DOM cụ thể
   - Load: #2 (sau config)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.utils) return;
  window.__WF = window.__WF || {};

  /* ─── Pure helpers ─── */
  const pad2 = n => String(n).padStart(2, '0');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fmtGold = n => (Number(n)||0).toLocaleString('vi-VN');
  const nowMs = () => Date.now();

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const escapeUrl = u => String(u||'').replace(/"/g,'&quot;');

  function fmtTime(ts){
    try {
      const d = new Date(ts);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return 'vừa xong';
      if (diff < 3600) return Math.floor(diff/60) + 'p';
      if (diff < 86400) return Math.floor(diff/3600) + 'h';
      return pad2(d.getDate()) + '/' + pad2(d.getMonth()+1);
    } catch(_){ return ''; }
  }

  /* ─── External integrations (SRank / Toast / avatar) ─── */
  function toast(msg, type){
    try { window.Toast?.show?.(msg, { type: type || 'info', duration: 2600 }); } catch(_){}
  }
  function setStatus(m){
    try { window.SRank?.setStatus?.(m); } catch(_){}
  }
  function getSb(){ return window.__sb || null; }
  function getUser(){
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (u && (u.id || u.username)) return u;
    } catch(_){}
    return null;
  }
  function avatarUrl(name){
    try { return window.getAvatarUrl?.(name) || ''; } catch(_){ return ''; }
  }
  function initialOf(name){
    const s = String(name||'').trim();
    return s ? s.slice(0,1).toUpperCase() : '?';
  }

  function renderAvatarHtml(name, cls){
    const url = avatarUrl(name);
    const ini = initialOf(name);
    cls = cls || 'ws-av';
    if (url) {
      return `<div class="${cls}"><img src="${escapeUrl(url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="ws-av-fb" style="display:none">${ini}</span></div>`;
    }
    return `<div class="${cls}"><span class="ws-av-fb">${ini}</span></div>`;
  }

  /* ─── Audio (Web Audio API) ─── */
  let _audioCtx = null;
  function playSound(freq, dur, type){
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_audioCtx) _audioCtx = new Ctx();
      if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(()=>{});
      const o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, _audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, _audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + dur);
      o.connect(g).connect(_audioCtx.destination);
      o.start(); o.stop(_audioCtx.currentTime + dur + 0.05);
    } catch(_){}
  }

  function playForgeSound(outcome){
    if (outcome === 'broken')       { playSound(400, .3, 'sawtooth'); setTimeout(()=>playSound(150,.4,'sawtooth'), 60); }
    else if (outcome === 'damaged') { playSound(300, .25, 'square'); }
    else if (outcome === 'hold')    { playSound(500, .15); }
    else if (outcome === 'success') { playSound(600, .12); setTimeout(()=>playSound(800,.15), 80); }
    else if (outcome === 'great')   {
      playSound(523,.1);
      setTimeout(()=>playSound(659,.1),80);
      setTimeout(()=>playSound(784,.1),160);
      setTimeout(()=>playSound(1047,.25),240);
    }
  }

  function playWinSound(){
    playSound(659,.15);
    setTimeout(()=>playSound(880,.2),120);
    setTimeout(()=>playSound(1047,.25),260);
  }
  function playLoseSound(){
    playSound(330,.3,'sawtooth');
  }
  function playNotifSound(){
    playSound(880,.1,'triangle');
    setTimeout(()=>playSound(1175,.15,'triangle'),100);
  }
  function playClickSound(){
    playSound(400,.08);
  }
  function playCritSound(){
    playSound(880,.1);
  }
  function playMissSound(){
    playSound(220,.15,'square');
  }
  function playVictorySound(){
    playSound(523,.1);
    setTimeout(()=>playSound(659,.1),80);
    setTimeout(()=>playSound(784,.1),160);
    setTimeout(()=>playSound(1047,.25),240);
  }

  /* ─── Haptics ─── */
  function vibrate(p){
    try { navigator.vibrate?.(p); } catch(_){}
  }

  /* ─── Visual effects ─── */
  function shakeScreen(pageId){
    const page = document.getElementById(pageId || 'weaponPage');
    if (!page) return;
    page.classList.remove('shake');
    void page.offsetWidth;
    page.classList.add('shake');
    setTimeout(()=>page.classList.remove('shake'), 400);
  }

  function spawnSparks(count, anchorId){
    const card = document.getElementById(anchorId || 'wfStage');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.55;
    for (let i = 0; i < (count || 10); i++){
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

  function numberPop(text, color){
    const el = document.createElement('div');
    el.className = 'wf-number-pop';
    el.textContent = text;
    el.style.color = color || '#d97706';
    el.style.left = (window.innerWidth / 2) + 'px';
    el.style.top = (window.innerHeight / 2) + 'px';
    el.style.transform = 'translate(-50%, 0)';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1100);
  }

  /* ─── Log ─── */
  function log(...a){
    try { console.log('[WF]', ...a); } catch(_){}
  }

  /* ─── Export ─── */
  window.__WF.utils = {
    pad2, sleep, fmtGold, nowMs, esc, escapeUrl, fmtTime,
    toast, setStatus, getSb, getUser, avatarUrl, initialOf, renderAvatarHtml,
    playSound, playForgeSound, playWinSound, playLoseSound, playNotifSound,
    playClickSound, playCritSound, playMissSound, playVictorySound,
    vibrate, shakeScreen, spawnSparks, numberPop,
    log,
  };

  console.log('[WF] utils.js ✓');
})();