/* =====================================================================
   RẮN & THANG — ONLINE MULTIPLAYER (v4.0 FULL)
   Fixes: Animation lost ref, Turn mismatch, Busy stuck, Realtime fallback
   ===================================================================== */
(function () {
  'use strict';
  if (window.__snakeGameLoaded) return;
  window.__snakeGameLoaded = true;

  /* ============================ CSS ============================ */
  var CSS = `
*,*::before,*::after{box-sizing:border-box}
#sgApp{margin:0;font-family:'Nunito',system-ui,sans-serif;color:#3b2b52;background:radial-gradient(1200px 700px at 8% -12%,#ffe4f5 0%,transparent 58%),radial-gradient(1000px 700px at 108% -4%,#dceeff 0%,transparent 55%),linear-gradient(165deg,#fdf8ff 0%,#eff6ff 46%,#fff8f1 100%);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent;position:absolute;inset:0;overflow-y:auto}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
input,select{font-family:inherit}
.shell{position:relative;z-index:1;max-width:1440px;margin:0 auto;padding:16px 18px 46px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;margin-bottom:18px;background:rgba(255,255,255,.72);backdrop-filter:blur(14px);border:1px solid rgba(167,139,250,.22);border-radius:22px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Baloo 2',cursive;font-weight:800;font-size:22px}
.badge{font-size:10px;font-weight:900;padding:4px 9px;border-radius:999px;color:#fff;background:linear-gradient(135deg,#ff6fae,#a78bfa)}
.top-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:18px;background:rgba(255,255,255,.9);border:1px solid rgba(167,139,250,.24)}
.panel{background:rgba(255,255,255,.82);backdrop-filter:blur(16px);border:1px solid rgba(167,139,250,.2);border-radius:24px;padding:18px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:16px;font-weight:800;font-size:15px;transition:transform .15s}
.btn:active{transform:scale(.97)}.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{color:#fff;background:linear-gradient(135deg,#ff7ab8,#a78bfa,#7dd3fc)}
.btn-ghost{background:rgba(255,255,255,.85);color:#6b5b85;border:1px solid rgba(167,139,250,.28)}
.btn-lg{padding:16px 30px;font-size:17px;width:100%}
.setup{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.hero{text-align:center;padding:26px 18px 8px}.hero h1{margin:0 0 8px;font-family:'Baloo 2',cursive;font-size:32px;color:#a78bfa}
.field{display:flex;flex-direction:column;gap:10px}.field>label{font-size:13px;font-weight:800;color:#8a7aa6;text-transform:uppercase}
.name-input{width:100%;padding:15px;border-radius:16px;font-size:16px;font-weight:700;border:2px solid rgba(167,139,250,.25);outline:none}
.play-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.play-card{display:flex;flex-direction:column;align-items:center;padding:18px 12px;border-radius:18px;background:#fff;border:2px solid rgba(167,139,250,.16);cursor:pointer}
.play-card.active{border-color:#a78bfa;background:linear-gradient(150deg,#fff0f8,#f2ecff)}
.room-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:16px;background:#fff;border:2px solid rgba(167,139,250,.18);margin-bottom:10px}
.room-item-info{flex:1}.room-item-host{font-size:14px;font-weight:900}.room-item-meta{font-size:12px;color:#8a7aa6}
.room-item-join{padding:9px 18px;border-radius:12px;background:linear-gradient(135deg,#ff7ab8,#a78bfa);color:#fff;font-weight:900}
.waiting-player{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:#fff;border:2px solid rgba(167,139,250,.15);margin-bottom:8px}
.waiting-player img{width:42px;height:42px;border-radius:50%}
.layout{display:grid;grid-template-columns:242px minmax(0,1fr) 296px;gap:16px}
@media (max-width:1120px){.layout{grid-template-columns:1fr}}
.player-list{display:flex;flex-direction:column;gap:9px}
.pcard{display:flex;align-items:center;gap:11px;padding:11px;border-radius:18px;background:#fff;border:2px solid transparent}
.pcard.active{border-color:var(--c);background:linear-gradient(100deg,var(--soft),#fff)}
.pav{position:relative;width:44px;height:44px;border-radius:14px;box-shadow:0 0 0 2.5px var(--c)}
.pav img{width:100%;height:100%;border-radius:12px;object-fit:cover}
.ptag{position:absolute;bottom:-6px;right:-6px;padding:0 6px;border-radius:999px;background:var(--c);color:#fff;font-size:11px;font-weight:900;border:2px solid #fff}
.pname{font-size:13.5px;font-weight:900}.pbar{height:6px;border-radius:999px;background:#f0ecfa;margin-top:6px;overflow:hidden}
.pbar>span{display:block;height:100%;background:var(--c);width:0}
.turn-pill{display:flex;gap:10px;padding:10px 18px;border-radius:999px;background:#fff;border:2px solid var(--c,#a78bfa);font-weight:900}
.board{position:relative;width:100%;aspect-ratio:1/1;max-width:640px;margin:0 auto;border-radius:22px;background:#fff;overflow:hidden}
.cells{position:absolute;inset:0;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr)}
.cell{position:relative;display:flex;padding:3px;border:0.5px solid rgba(167,139,250,.13);font-size:10px;color:#aaa;font-weight:800}
#boardSvg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.tokens{position:absolute;inset:0;z-index:3;pointer-events:none}
.token{position:absolute;width:6%;height:6%;transform:translate(-50%,-50%);transition:left .2s,top .2s;border-radius:50%;box-shadow:0 0 0 2px var(--c);background:#fff;z-index:20}
.token img{width:100%;height:100%;border-radius:50%}
.token.active{animation:bounce .8s infinite alternate}
@keyframes bounce{to{transform:translate(-50%,-60%) scale(1.1)}}
.dice-panel{display:flex;flex-direction:column;align-items:center;gap:14px}
.dice-stage{width:72px;height:72px;perspective:700px}
.dice-cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1s}
.dice-face{position:absolute;inset:0;background:#fff;border-radius:16px;display:grid;grid-template-columns:repeat(3,1fr);padding:9px;box-shadow:inset 0 0 10px #eee}
.pip{width:11px;height:11px;border-radius:50%;background:#6d4bd8;place-self:center}
.log{max-height:290px;overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.log-item{font-size:12.5px;padding:8px;background:#fff;border-left:3px solid var(--c);border-radius:8px}
#fx{position:fixed;inset:0;pointer-events:none;z-index:9000}
.overlay{position:fixed;inset:0;z-index:8000;display:grid;place-items:center;background:rgba(0,0,0,.5)}
.win-card{background:#fff;padding:28px;border-radius:24px;text-align:center;width:min(400px,90%)}
.toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);padding:12px 22px;border-radius:999px;background:#3b2b52;color:#fff;font-weight:800;z-index:9500;opacity:0;transition:.3s}
.toast.show{opacity:1}
#debugPanel{position:fixed;top:60px;right:12px;z-index:9800;width:min(380px,90vw);background:#111;color:#0f0;padding:14px;border-radius:16px;font-family:monospace;font-size:11px;border:1px solid #0f0}
#debugPanel pre{white-space:pre-wrap;word-break:break-all;margin:4px 0;background:#000;padding:4px;max-height:100px;overflow-y:auto}
`;

  /* ============================ HTML ============================ */
  var HTML = `
<div id="sgApp">
  <canvas id="fx"></canvas>
  <div class="shell">
    <header class="topbar">
      <div class="brand"><span>🐍</span><span>Rắn & Thang</span><span class="badge">ONLINE</span></div>
      <div class="top-actions">
        <button class="icon-btn" id="soundBtn">🔊</button>
        <button class="icon-btn" id="debugBtn">🐞</button>
      </div>
    </header>

    <section id="menuScreen" class="setup">
      <div class="panel">
        <div class="hero"><h1>Leo thang, né rắn!</h1><p>Chơi online cùng đồng nghiệp</p></div>
        <div class="field"><label>Tên hiển thị</label><input id="playerName" class="name-input" maxlength="16" placeholder="Tên..." /></div>
        <div class="field"><label>Kiểu chơi</label>
          <div class="play-mode-grid" id="playModeGrid">
            <button class="play-card active" data-mode="online">🌐 Online</button>
            <button class="play-card" data-mode="bot">🤖 Bot</button>
            <button class="play-card" data-mode="local">👥 Cùng máy</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="continueBtn" style="margin-top:20px">Tiếp tục →</button>
      </div>
    </section>

    <section id="onlineScreen" class="setup" hidden>
      <div class="panel">
        <h2 style="text-align:center">Phòng chơi</h2>
        <button class="btn btn-primary btn-lg" id="createRoomBtn">➕ Tạo phòng mới</button>
        <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
          <b>Phòng đang chờ</b><button class="btn btn-ghost" id="refreshRoomsBtn" style="padding:5px 10px">↻</button>
        </div>
        <div id="roomsList" style="margin-top:10px"></div>
        <button class="btn btn-ghost btn-lg" id="backFromOnlineBtn" style="margin-top:20px">← Quay lại</button>
      </div>
    </section>

    <section id="waitingScreen" class="setup" hidden>
      <div class="panel">
        <h2 style="text-align:center">Phòng chờ</h2>
        <div style="font-weight:800;margin:16px 0 8px">👥 Người chơi (<span id="waitingCount">0</span>/4)</div>
        <div id="waitingPlayers"></div>
        <div id="hostControls">
          <select id="hostModeSelect" style="width:100%;padding:12px;border-radius:12px;margin-bottom:10px">
            <option value="classic">Cổ điển</option><option value="speed">Tốc độ</option><option value="chaos">Hỗn loạn</option>
          </select>
          <button class="btn btn-primary btn-lg" id="hostStartBtn" disabled>Bắt đầu</button>
        </div>
        <button class="btn btn-ghost btn-lg" id="leaveRoomBtn" style="margin-top:10px">Rời phòng</button>
      </div>
    </section>

    <section id="localSetupScreen" class="setup" hidden>
      <div class="panel">
        <h2 style="text-align:center" id="localSetupTitle">Đấu với Bot</h2>
        <div class="field" style="margin-top:20px"><label>Chế độ</label>
          <div class="play-mode-grid" id="modeGrid">
            <button class="play-card active" data-mode="classic">Cổ điển</button>
            <button class="play-card" data-mode="speed">Tốc độ</button>
            <button class="play-card" data-mode="chaos">Hỗn loạn</button>
          </div>
        </div>
        <div class="field" style="margin-top:20px"><label>Số người</label>
          <div style="display:flex;gap:10px" id="countSeg">
            <button class="btn btn-ghost active" data-c="2">2</button><button class="btn btn-ghost" data-c="3">3</button><button class="btn btn-ghost" data-c="4">4</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="startLocalBtn" style="margin-top:20px">Bắt đầu</button>
        <button class="btn btn-ghost btn-lg" id="backFromLocalBtn" style="margin-top:10px">← Quay lại</button>
      </div>
    </section>

    <section id="gameScreen" hidden>
      <div class="layout">
        <aside class="panel"><div class="player-list" id="playerList"></div></aside>
        <main>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <div class="turn-pill" id="turnPill"><span class="dot"></span><span class="txt">...</span></div>
            <button class="btn btn-ghost" id="quitBtn">Thoát</button>
          </div>
          <div class="board">
            <svg id="boardSvg" viewBox="0 0 100 100"></svg><div class="cells" id="cells"></div><div class="tokens" id="tokens"></div>
          </div>
        </main>
        <aside class="panel">
          <div class="dice-panel">
            <div style="display:flex;gap:16px">
              <div class="dice-stage"><div class="dice-cube" id="dice0"></div></div>
              <div class="dice-stage" id="diceStage1"><div class="dice-cube" id="dice1"></div></div>
            </div>
            <button class="btn btn-primary btn-lg" id="rollBtn">🎲 Tung</button>
            <div id="rollHint" style="font-size:12px;color:#888">...</div>
          </div>
          <div class="log" id="log" style="margin-top:20px"></div>
        </aside>
      </div>
    </section>
  </div>

  <div class="overlay" id="winOverlay" hidden>
    <div class="win-card">
      <h2 id="winTitle">Chiến thắng!</h2><p id="winSub"></p>
      <button class="btn btn-primary btn-lg" id="playAgainBtn" style="margin-top:20px">Về sảnh</button>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <div id="debugPanel" hidden>
    <b>🐞 DEBUG INFO</b> <button id="dbgClose" style="float:right">✕</button>
    <div>Me: <span id="dbgMe"></span></div>
    <div>Room: <span id="dbgRoom"></span></div>
    <div>Turn: <span id="dbgTurn"></span></div>
    <div>Busy: <span id="dbgBusy"></span></div>
    <div>Version: <span id="dbgVer"></span></div>
    <pre id="dbgEvt"></pre>
    <button id="dbgForce" style="width:100%;margin-top:5px;padding:5px;background:#333;color:#fff">Force Refresh</button>
  </div>
</div>
`;

  /* ============================ SETUP ============================ */
  const host = document.createElement('div');
  host.id = 'snakeGameHost';
  host.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>' + CSS + '</style>' + HTML;
  document.body.appendChild(host);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'snakeGameClose';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9600;width:44px;height:44px;border-radius:50%;background:#000a;color:#fff;font-size:22px;display:none;place-items:center;border:1px solid #fff3;cursor:pointer';
  document.body.appendChild(closeBtn);

  const $ = id => shadow.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2500);
  }

  /* ============================ DEBUG ============================ */
  let debugOpen = false, debugLog = [];
  function dbg(msg) {
    console.log('[SG]', msg);
    debugLog.push('[' + new Date().toLocaleTimeString() + '] ' + msg);
    if (debugLog.length > 20) debugLog.shift();
    if (debugOpen) renderDbg();
  }
  function renderDbg() {
    if (!debugOpen) return;
    $('dbgMe').textContent = myUsername;
    $('dbgRoom').textContent = room ? room.code : '—';
    $('dbgTurn').textContent = room?.state?.current_turn || '—';
    $('dbgBusy').textContent = state.busy;
    $('dbgVer').textContent = room?.version || 0;
    $('dbgEvt').textContent = debugLog.join('\n');
  }

  /* ============================ CONFIG ============================ */
  const FALLBACK = {
    URL: 'https://tumjcsaexddioecwjolp.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ'
  };
  const CFG = window.__SRANK_CONFIG || FALLBACK;
  let sb = null;
  if (window.supabase && CFG.SUPABASE_URL) {
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });
  }

  /* ============================ STATE ============================ */
  const LADDERS = { 1:38, 4:14, 9:31, 21:42, 28:84, 36:44, 51:67, 71:91, 80:100 };
  const SNAKES = { 16:6, 47:26, 49:11, 56:53, 62:19, 64:60, 87:24, 93:73, 95:75, 98:78 };
  const STYLES = [{c:'#ff5fa2',s:'#ffe4f1'},{c:'#4f8dff',s:'#e0edff'},{c:'#18c08a',s:'#dcf9ee'},{c:'#f6a723',s:'#ffefd4'}];
  const BOTS = ['Mèo', 'Gấu', 'Thỏ'];

  let state = { mode: 'online', count: 2, players: [], current: 0, busy: false, over: false, startTime: 0 };
  let myUsername = '', myProfile = null, room = null, roomPlayers = [];
  let roomChan = null, roomsChan = null, pollTimer = null, animating = {};
  let isHost = false, busyTimeout = null, pendingWin = null, wasMyTurn = false;

  function getMyUsername() {
    let u = '';
    try {
      let keys = ['srank_username', 'username'];
      for (let k of keys) { let v = localStorage.getItem(k); if (v) { try { u = JSON.parse(v).username || v; } catch(_) { u = v; } if (u) break; } }
      if (!u && window.SRANK_STATE?.currentUser) u = window.SRANK_STATE.currentUser.username;
      if (!u) { let el = document.getElementById('logoutName'); if (el) u = el.textContent.trim(); }
    } catch(e){}
    if (!u) {
      u = localStorage.getItem('srank_guest_id');
      if (!u) { u = 'guest_' + rnd(99999); localStorage.setItem('srank_guest_id', u); }
    }
    return String(u).trim();
  }

  /* ============================ HELPERS ============================ */
  function posToXY(pos) {
    let idx = pos - 1, r = Math.floor(idx / 10), c = idx % 10;
    if (r % 2 !== 0) c = 9 - c;
    return { x: c * 10 + 5, y: (9 - r) * 10 + 5, c: c, r: 9 - r };
  }
  function avt(s) { return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(s) + '&backgroundColor=ffd5dc,b6e3f4&radius=14'; }

  /* ============================ AUDIO ============================ */
  let actx = null, sfxOn = true;
  function beep(f, d, t, v, delay) {
    if (!sfxOn) return;
    try {
      if (!actx) actx = new AudioContext();
      let t0 = actx.currentTime + (delay||0), o = actx.createOscillator(), g = actx.createGain();
      o.type = t||'sine'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v||.05, t0+.01); g.gain.exponentialRampToValueAtTime(.0001, t0+d);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0+d+.05);
    } catch(e){}
  }
  const sfx = {
    tick: () => beep(600+rnd(100), .05, 'square', .02),
    roll: () => { for(let i=0;i<6;i++) beep(300+i*80, .05, 'triangle', .03, i*.07); },
    ladder: () => [500,600,800].forEach((f,i)=>beep(f,.15,'sine',.05,i*.08)),
    snake: () => [600,500,400].forEach((f,i)=>beep(f,.15,'sawtooth',.04,i*.08)),
    win: () => [500,600,800,1000].forEach((f,i)=>beep(f,.3,'sine',.05,i*.1))
  };

  /* ============================ DICE UI ============================ */
  const PIPS = {1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]]};
  const FACE_TF = {1:'translateZ(36px)',2:'rotateY(90deg) translateZ(36px)',3:'rotateX(90deg) translateZ(36px)',4:'rotateX(-90deg) translateZ(36px)',5:'rotateY(-90deg) translateZ(36px)',6:'rotateY(180deg) translateZ(36px)'};
  const FACE_RT = {1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
  function makeDice(el) {
    el.innerHTML = '';
    for(let f=1; f<=6; f++) {
      let div = document.createElement('div'); div.className = 'dice-face'; div.style.transform = FACE_TF[f];
      PIPS[f].forEach(rc => {
        let p = document.createElement('i'); p.className = 'pip';
        p.style.gridRow = rc[0]; p.style.gridColumn = rc[1]; div.appendChild(p);
      });
      el.appendChild(div);
    }
    let sx=0, sy=0;
    return {
      show(n, inst) {
        let rx = FACE_RT[n][0], ry = FACE_RT[n][1];
        if(inst) { el.style.transition='none'; el.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`; sx=rx; sy=ry; void el.offsetWidth; el.style.transition=''; return; }
        sx += 360*(2+rnd(3)); sy += 360*(2+rnd(3));
        el.style.transform = `rotateX(${sx + rx}deg) rotateY(${sy + ry}deg)`;
      }
    };
  }
  let dice0, dice1;

  /* ============================ RENDER UI ============================ */
  function renderPlayers() {
    let el = $('playerList'); el.innerHTML = '';
    state.players.forEach((p, i) => {
      let card = document.createElement('div'); card.className = 'pcard' + (i === state.current ? ' active' : '');
      card.style.setProperty('--c', p.color); card.style.setProperty('--soft', p.soft);
      card.innerHTML = `
        <div class="pav"><img src="${p.avatar}"><span class="ptag">${p.pos}</span></div>
        <div style="flex:1"><div class="pname">${p.name} ${p.username===myUsername?'<span style="color:#4f8dff;font-size:9px">(BẠN)</span>':''}</div>
        <div class="pbar"><span style="width:${p.pos}%"></span></div></div>
      `;
      el.appendChild(card);
      p.cardEl = card; p.posEl = card.querySelector('.ptag'); p.barEl = card.querySelector('.pbar span');
    });
  }
  function syncCards() {
    state.players.forEach(p => {
      if(p.posEl) p.posEl.textContent = p.pos;
      if(p.barEl) p.barEl.style.width = Math.min(100, p.pos) + '%';
      if(p.cardEl) p.cardEl.classList.toggle('active', p === state.players[state.current]);
    });
  }
  function createTokens() {
    let el = $('tokens'); el.innerHTML = '';
    state.players.forEach(p => {
      let div = document.createElement('div'); div.className = 'token'; div.style.setProperty('--c', p.color);
      div.innerHTML = `<img src="${p.avatar}"><span style="position:absolute;bottom:-5px;right:-5px;background:${p.color};color:#fff;font-size:8px;border-radius:50%;width:14px;height:14px;display:grid;place-items:center">${p.id+1}</span>`;
      el.appendChild(div); p.el = div;
    });
  }
  function posTokens() {
    let groups = {};
    state.players.forEach(p => { (groups[p.pos] = groups[p.pos]||[]).push(p); });
    Object.keys(groups).forEach(k => {
      let pos = +k, g = posToXY(Math.max(1, Math.min(100, pos))), list = groups[k], n = list.length;
      list.forEach((p, i) => {
        if(!p.el) return;
        let ang = n>1 ? (i/n)*Math.PI*2 : 0;
        let r = n>1 ? 2.5 : 0;
        p.el.style.left = (g.x + Math.cos(ang)*r) + '%';
        p.el.style.top = (g.y + Math.sin(ang)*r) + '%';
        p.el.style.zIndex = p === state.players[state.current] ? 60 : 20;
      });
    });
    syncCards();
  }
  function updatePill() {
    let p = state.players[state.current]; if(!p) return;
    $('turnPill').style.setProperty('--c', p.color);
    let isMe = (p.username === myUsername && state.mode === 'online');
    $('turnPill').querySelector('.txt').textContent = state.over ? 'Kết thúc' : (isMe ? '👉 Lượt BẠN!' : 'Lượt: ' + p.name);
  }
  function addLog(text, color) {
    let div = document.createElement('div'); div.className = 'log-item'; div.style.setProperty('--c', color);
    div.textContent = text; $('log').prepend(div);
  }

  /* ============================ BOARD ============================ */
  function buildBoard() {
    let cells = $('cells'); cells.innerHTML = '';
    for(let i=1; i<=100; i++) {
      let g = posToXY(i);
      let c = document.createElement('div'); c.className = 'cell';
      c.style.gridColumn = g.c+1; c.style.gridRow = g.r+1; c.textContent = i;
      c.style.background = `hsl(${g.r*30} 90% 97%)`;
      if(i===1) c.innerHTML += '🏁'; else if(i===100) c.innerHTML += '🏆';
      else if(LADDERS[i]) c.innerHTML += '<span style="position:absolute;right:2px;bottom:2px">🪜</span>';
      else if(SNAKES[i]) c.innerHTML += '<span style="position:absolute;right:2px;bottom:2px">🐍</span>';
      cells.appendChild(c);
    }
    let svg = $('boardSvg'), h = '';
    for(let k in LADDERS) {
      let A = posToXY(+k), B = posToXY(LADDERS[k]);
      h += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#f0b429" stroke-width="1.5" opacity=".8"/>`;
    }
    for(let k in SNAKES) {
      let A = posToXY(+k), B = posToXY(SNAKES[k]);
      h += `<path d="M ${A.x} ${A.y} Q ${(A.x+B.x)/2+20} ${(A.y+B.y)/2} ${B.x} ${B.y}" fill="none" stroke="#7c5cff" stroke-width="2.5" opacity=".8"/>`;
    }
    svg.innerHTML = h;
  }

  /* ============================ GAME LOGIC ============================ */
  async function animateDice(vals) {
    let cubes = [dice0]; if(vals.length>1) cubes.push(dice1);
    cubes.forEach(c => c.show(1+rnd(6))); sfx.roll();
    for(let i=0;i<5;i++) { await sleep(60); cubes.forEach(c => c.show(1+rnd(6))); }
    await sleep(100); cubes.forEach((c,i) => c.show(vals[i])); await sleep(500);
  }

  function syncTurnUI() {
    if(state.mode !== 'online' || !room) return;
    let isMe = (room.state?.current_turn === myUsername);
    let play = room.status === 'playing';
    
    if(!isMe && state.busy) { state.busy = false; if(busyTimeout) clearTimeout(busyTimeout); }
    
    $('rollBtn').disabled = !(isMe && play && !state.busy);
    if(!play) $('rollHint').textContent = 'Đã kết thúc';
    else if(isMe) $('rollHint').textContent = state.busy ? 'Đang xử lý...' : '👉 Lượt của bạn!';
    else {
      let curP = state.players.find(p => p.username === room.state?.current_turn);
      $('rollHint').textContent = 'Đang chờ ' + (curP ? curP.name : '...') + '...';
    }
  }

  function enterGameRoom() {
    state.players = [];
    state.over = false; state.busy = false; animating = {};
    $('log').innerHTML = '';
    showScreen('gameScreen');
    buildBoard(); createTokens();
    $('diceStage1').style.display = room.mode === 'speed' ? 'block' : 'none';
    dice0.show(1, true); if(dice1) dice1.show(1, true);
    
    rebuildRoomState();
    addLog('Trò chơi bắt đầu!', '#a78bfa');
  }

  async function rebuildRoomState() {
    if(!room || (room.status !== 'playing' && room.status !== 'finished')) return;
    
    // Giữ tham chiếu object cũ để animation không bị hỏng
    let oldMap = {};
    state.players.forEach(p => { oldMap[p.username] = p; });
    
    let needRender = false;
    let newPlayers = roomPlayers.map((rp, i) => {
      let old = oldMap[rp.username];
      if(old) {
        old.targetPos = rp.pos;
        old.name = rp.display_name;
        return old;
      } else {
        needRender = true;
        let st = STYLES[rp.color_index%4];
        return { id:i, username:rp.username, name:rp.display_name, pos:rp.pos, targetPos:rp.pos, color:st.c, soft:st.s, avatar:rp.avatar_url||avt(rp.display_name) };
      }
    });

    if(newPlayers.length !== state.players.length) needRender = true;
    state.players = newPlayers;

    if(needRender) { renderPlayers(); createTokens(); posTokens(); animating = {}; }
    
    let curIdx = state.players.findIndex(p => p.username === room.state?.current_turn);
    if(curIdx >= 0) state.current = curIdx;
    updatePill(); syncCards(); posTokens();

    let lastMove = room.state?.last_move;
    state.players.forEach(p => {
      if(p.pos !== p.targetPos && !animating[p.username]) {
        animateMove(p, lastMove && lastMove.user === p.username ? lastMove : null);
      }
    });

    renderLogs(room.state?.log);
    syncTurnUI();
    
    if(room.state?.winner && $('winOverlay').hidden) {
      showWin(room.state.winner);
    }
  }

  async function animateMove(p, move) {
    if(animating[p.username]) return;
    animating[p.username] = true;
    try {
      let from = p.pos, to = p.targetPos;
      if(from === to) return;
      if(move && move.dice_land != null) {
        let land = move.dice_land;
        while(p.pos !== land) { p.pos += (land>p.pos?1:-1); posTokens(); sfx.tick(); await sleep(60); }
        await sleep(200); p.pos = to;
        if(move.via === 'ladder') sfx.ladder(); else if(move.via === 'snake') sfx.snake();
        posTokens(); await sleep(300);
      } else {
        while(p.pos !== to) { p.pos += (to>p.pos?1:-1); posTokens(); sfx.tick(); await sleep(60); }
      }
    } finally { p.pos = p.targetPos; posTokens(); animating[p.username] = false; }
  }

  function renderLogs(logs) {
    if(!logs || !logs.length) return;
    let rendered = $('log').children.length;
    let toRender = logs.slice(0, logs.length - rendered).reverse();
    toRender.forEach(l => addLog(l.text, l.color));
  }

  /* ============================ ONLINE ACTIONS ============================ */
  async function doRollOnline() {
    if(state.busy || room.status !== 'playing' || room.state?.current_turn !== myUsername) return;
    state.busy = true; $('rollBtn').disabled = true;
    if(busyTimeout) clearTimeout(busyTimeout);
    busyTimeout = setTimeout(() => { if(state.busy) { state.busy = false; syncTurnUI(); } }, 6000);

    try {
      let me = roomPlayers.find(p => p.username === myUsername);
      if(!me) return;
      let n = room.mode === 'speed' ? 2 : 1, vals = [], total = 0;
      for(let i=0;i<n;i++) { let v = 1+rnd(6); vals.push(v); total+=v; }
      await animateDice(vals);

      let land = me.pos + total, goal = land >= 100;
      if(goal) land = 100;
      let final = land, via = 'normal';
      let myColor = STYLES[me.color_index%4].c;
      let newLogs = [{ text: `🎲 ${me.display_name} tung ${vals.join('+')}${n>1?'='+total:''}`, color: myColor, ts: Date.now() }];

      if(goal) via = 'goal';
      else if(LADDERS[land]) { final = LADDERS[land]; via = 'ladder'; newLogs.push({ text: `🪜 Leo thang ${land} → ${final}`, color: myColor, ts: Date.now()+1 }); }
      else if(SNAKES[land]) { final = SNAKES[land]; via = 'snake'; newLogs.push({ text: `🐍 Rắn cắn ${land} → ${final}`, color: myColor, ts: Date.now()+1 }); }

      let winner = goal ? myUsername : null;
      let curIdx = roomPlayers.findIndex(p => p.username === myUsername);
      let next = roomPlayers[(curIdx+1) % roomPlayers.length].username;

      await sb.from('snake_room_players').update({ pos: final }).eq('room_id', room.id).eq('username', myUsername);
      
      let newState = {
        current_turn: winner ? myUsername : next,
        dice: vals, last_roll_by: myUsername, last_roll_at: Date.now(),
        moves: (room.state?.moves||0) + 1, started_at: room.state?.started_at || Date.now(),
        log: newLogs.concat(room.state?.log || []).slice(0, 40),
        winner: winner, last_move: { user: myUsername, from: me.pos, dice_land: land, final: final, via: via }
      };

      await sb.from('snake_rooms').update({
        state: newState, status: winner ? 'finished' : 'playing',
        version: (room.version||0) + 1, updated_at: new Date().toISOString()
      }).eq('id', room.id);
      
      dbg('ROLL sent');
    } catch(e) {
      state.busy = false; $('rollBtn').disabled = false; toast('Lỗi mạng');
    }
  }

  /* ============================ REALTIME & ROOMS ============================ */
  function handleRoomUpdate(oldR, newR) {
    let oldV = oldR.version || 0, newV = newR.version || 0;
    if(newV <= oldV) return;
    dbg(`Update v${oldV}→v${newV}`);
    
    room = newR;
    if(oldR.status === 'waiting' && newR.status === 'playing') {
      refreshPlayers().then(enterGameRoom);
      return;
    }
    if(newR.state?.last_roll_by !== myUsername && newR.state?.last_roll_at > (oldR.state?.last_roll_at||0)) {
      animateDice(newR.state.dice);
    }
    refreshPlayers().then(rebuildRoomState);
  }

  function startRealtime() {
    if(!room || !sb) return;
    if(roomChan) sb.removeChannel(roomChan);
    
    roomChan = sb.channel('r:'+room.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'snake_rooms', filter: 'id=eq.'+room.id }, p => handleRoomUpdate(room, p.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'snake_rooms', filter: 'id=eq.'+room.id }, () => { toast('Phòng đã đóng'); leaveRoom(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snake_room_players', filter: 'room_id=eq.'+room.id }, () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshPlayers, 80); })
      .subscribe(s => dbg('RT:'+s));

    if(pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if(!room || document.hidden) return;
      let r = await sb.from('snake_rooms').select('*').eq('id', room.id).maybeSingle();
      if(r.data) handleRoomUpdate(room, r.data);
    }, 1500);
  }

  let refreshTimer = null;
  async function refreshPlayers() {
    if(!room) return;
    let r = await sb.from('snake_room_players').select('*').eq('room_id', room.id).order('joined_at');
    if(r.data) { roomPlayers = r.data; if(room.status==='waiting') renderWait(); }
  }

  /* ============================ LOCAL GAME ============================ */
  function startLocalGame() {
    state.players = []; state.over = false; state.busy = false; state.current = 0; state.moves = 0; state.startTime = Date.now();
    let me = { id:0, username: myUsername, name: myProfile.display_name, pos:0, targetPos:0, color:STYLES[0].c, soft:STYLES[0].s, avatar: myProfile.avatar_url, bot:false };
    state.players.push(me);
    for(let i=1; i<state.count; i++) {
      let bot = state.mode==='bot';
      state.players.push({ id:i, username:bot?'bot_'+i:'p'+i, name:bot?BOTS[i-1]:'Người chơi '+i, pos:0, targetPos:0, color:STYLES[i].c, soft:STYLES[i].s, avatar:avt('bot'+i), bot:bot });
    }
    $('log').innerHTML = ''; showScreen('gameScreen'); buildBoard(); renderPlayers(); createTokens();
    $('diceStage1').style.display = state.mode === 'speed' ? 'block' : 'none';
    posTokens(); updatePill(); syncCards(); beginTurnLocal();
  }

  function beginTurnLocal() {
    let p = state.players[state.current]; if(!p) return;
    updatePill(); syncCards(); posTokens();
    if(p.bot) {
      $('rollBtn').disabled = true; $('rollHint').textContent = 'Bot đang suy nghĩ...';
      setTimeout(doRollLocal, 800);
    } else {
      $('rollBtn').disabled = false; $('rollHint').textContent = 'Lượt của bạn!';
    }
  }

  async function doRollLocal() {
    if(state.busy || state.over) return;
    state.busy = true; $('rollBtn').disabled = true;
    let p = state.players[state.current], n = state.mode==='speed'?2:1;
    let vals = []; for(let i=0;i<n;i++) vals.push(1+rnd(6));
    await animateDice(vals);
    let tot = vals.reduce((a,b)=>a+b,0);
    addLog(`🎲 ${p.name} tung ${tot}`, p.color);
    
    let land = p.pos + tot, goal = land >= 100;
    if(goal) land = 100;
    while(p.pos < land) { p.pos++; posTokens(); sfx.tick(); await sleep(50); }
    
    if(goal) { winLocal(p); return; }
    if(LADDERS[p.pos]) { p.pos = LADDERS[p.pos]; sfx.ladder(); posTokens(); await sleep(300); }
    else if(SNAKES[p.pos]) { p.pos = SNAKES[p.pos]; sfx.snake(); posTokens(); await sleep(300); }
    if(p.pos >= 100) { winLocal(p); return; }
    
    state.busy = false; state.current = (state.current+1)%state.players.length; beginTurnLocal();
  }

  function winLocal(p) {
    state.over = true; sfx.win();
    $('winTitle').textContent = p.username===myUsername?'Bạn thắng!':p.name+' thắng!';
    $('winOverlay').hidden = false;
  }

  /* ============================ UI BINDINGS ============================ */
  function showScreen(id) {
    ['menuScreen','onlineScreen','waitingScreen','localSetupScreen','gameScreen'].forEach(s => $(s).hidden = (s!==id));
    if(id!=='gameScreen') $('winOverlay').hidden = true;
  }

  $('debugBtn').onclick = () => { debugOpen = !debugOpen; $('debugPanel').hidden = !debugOpen; renderDbg(); };
  $('dbgClose').onclick = () => { debugOpen = false; $('debugPanel').hidden = true; };
  $('dbgForce').onclick = async () => {
    if(!room) return toast('Chưa vào phòng');
    let r = await sb.from('snake_rooms').select('*').eq('id', room.id).maybeSingle();
    if(r.data) handleRoomUpdate(room, r.data);
    refreshPlayers().then(rebuildRoomState);
  };

  $('playModeGrid').onclick = e => {
    let btn = e.target.closest('.play-card'); if(!btn) return;
    [...e.currentTarget.children].forEach(c => c.classList.remove('active')); btn.classList.add('active');
    state.mode = btn.dataset.mode;
  };
  
  $('continueBtn').onclick = async () => {
    let name = $('playerName').value.trim() || myUsername;
    localStorage.setItem('srank_player_name', name);
    if(state.mode === 'online') {
      if(!sb) return toast('Lỗi Supabase');
      showScreen('onlineScreen'); fetchRooms();
      if(roomsChan) sb.removeChannel(roomsChan);
      roomsChan = sb.channel('rooms').on('postgres_changes', {event:'*',schema:'public',table:'snake_rooms'}, fetchRooms).subscribe();
    } else {
      $('localSetupTitle').textContent = state.mode==='bot'?'Đấu với Bot':'Cùng máy';
      showScreen('localSetupScreen');
    }
  };

  $('backFromOnlineBtn').onclick = () => { showScreen('menuScreen'); if(roomsChan) sb.removeChannel(roomsChan); };
  $('backFromLocalBtn').onclick = () => showScreen('menuScreen');
  $('refreshRoomsBtn').onclick = () => fetchRooms();

  $('createRoomBtn').onclick = async () => {
    if(room) return toast('Đang ở phòng khác');
    let code = Array.from({length:6}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[rnd(32)]).join('');
    let r = await sb.from('snake_rooms').insert({ code, host_username: myUsername, status: 'waiting', max_players: 4, state: {}, version: 0 }).select().single();
    if(r.error) return toast('Lỗi tạo phòng');
    room = r.data; isHost = true;
    await sb.from('snake_room_players').insert({ room_id: room.id, username: myUsername, display_name: $('playerName').value || myUsername, avatar_url: myProfile.avatar_url, color_index: 0, pos: 0, is_host: true });
    enterWait();
  };

  $('roomsList').onclick = async e => {
    let btn = e.target.closest('.room-item-join'); if(!btn) return;
    let rid = btn.dataset.id;
    let r = await sb.from('snake_rooms').select('*').eq('id', rid).eq('status','waiting').single();
    if(r.error) return toast('Phòng đã đóng');
    room = r.data; isHost = (room.host_username === myUsername);
    let ex = await sb.from('snake_room_players').select('id').eq('room_id', rid).eq('username', myUsername).maybeSingle();
    if(!ex.data) {
      let count = (await sb.from('snake_room_players').select('id',{count:'exact'}).eq('room_id', rid)).count || 0;
      await sb.from('snake_room_players').insert({ room_id: rid, username: myUsername, display_name: $('playerName').value || myUsername, avatar_url: myProfile.avatar_url, color_index: count, pos: 0 });
    }
    enterWait();
  };

  $('leaveRoomBtn').onclick = leaveRoom;
  async function leaveRoom() {
    if(room) {
      if(roomChan) sb.removeChannel(roomChan);
      clearInterval(pollTimer);
      await sb.from('snake_room_players').delete().eq('room_id', room.id).eq('username', myUsername);
      if(isHost) await sb.from('snake_rooms').delete().eq('id', room.id);
    }
    room = null; showScreen('menuScreen'); if(roomsChan) { sb.removeChannel(roomsChan); roomsChan = null; }
  }

  $('hostStartBtn').onclick = async () => {
    if(roomPlayers.length < 2) return;
    let mode = $('hostModeSelect').value, now = Date.now();
    await sb.from('snake_room_players').update({ pos:0 }).eq('room_id', room.id);
    await sb.from('snake_rooms').update({
      status: 'playing', mode: mode, version: 1, updated_at: new Date().toISOString(),
      state: { current_turn: roomPlayers[0].username, dice:[1], moves:0, started_at: now, log: [{text:'Trò chơi bắt đầu!',color:'#a78bfa',ts:now}], last_roll_at: 0 }
    }).eq('id', room.id);
  };

  $('startLocalBtn').onclick = startLocalGame;
  $('quitBtn').onclick = () => { if(room) leaveRoom(); else showScreen('menuScreen'); };
  $('rollBtn').onclick = () => { if(state.mode==='online') doRollOnline(); else doRollLocal(); };
  $('playAgainBtn').onclick = () => { $('winOverlay').hidden = true; if(room) leaveRoom(); else showScreen('menuScreen'); };
  $('soundBtn').onclick = e => { sfxOn = !sfxOn; e.target.textContent = sfxOn?'🔊':'🔇'; };

  function enterWait() {
    showScreen('waitingScreen'); $('hostControls').style.display = isHost ? 'block' : 'none';
    renderWait(); startRealtime();
  }
  function renderWait() {
    $('waitingCount').textContent = roomPlayers.length;
    $('waitingPlayers').innerHTML = roomPlayers.map(p => `<div class="waiting-player"><img src="${p.avatar_url||avt(p.display_name)}"><span>${p.display_name} ${p.username===myUsername?'(Bạn)':''}</span> ${p.is_host?'<span style="color:#ff7ab8;font-size:10px">HOST</span>':''}</div>`).join('');
    $('hostStartBtn').disabled = roomPlayers.length < 2;
    $('hostStartBtn').textContent = roomPlayers.length >= 2 ? '🚀 Bắt đầu ('+roomPlayers.length+')' : '⏳ Cần 2 người';
  }

  async function fetchRooms() {
    let r = await sb.from('snake_rooms').select('*').eq('status','waiting').order('created_at',{ascending:false}).limit(20);
    if(!r.data) return;
    $('roomsList').innerHTML = r.data.map(rm => `
      <div class="room-item">
        <div class="room-item-info"><div class="room-item-host">🐱 ${rm.host_username}</div><div class="room-item-meta">Đang chờ...</div></div>
        <button class="room-item-join" data-id="${rm.id}">Vào</button>
      </div>
    `).join('') || '<div style="text-align:center;padding:20px;color:#888">Chưa có phòng nào</div>';
  }

  /* ============================ INIT ============================ */
  dice0 = makeDice($('dice0')); dice1 = makeDice($('dice1'));
  
  async function init() {
    myUsername = getMyUsername();
    let saved = localStorage.getItem('srank_player_name');
    $('playerName').value = saved || myUsername;
    if(sb) {
      let p = await sb.from('public_players').select('*').eq('username', myUsername).maybeSingle();
      myProfile = p.data || { display_name: myUsername, avatar_url: avt(myUsername) };
    } else myProfile = { display_name: myUsername, avatar_url: avt(myUsername) };
  }
  init();

  function openGame() {
    document.body.style.overflow = 'hidden'; host.style.display = 'block'; closeBtn.style.display = 'grid'; showScreen('menuScreen');
  }
  closeBtn.onclick = () => {
    host.style.display = 'none'; closeBtn.style.display = 'none'; document.body.style.overflow = '';
    if(room) leaveRoom();
  };
  
  let btn = document.getElementById('snakeLadderBtn');
  if(btn) btn.onclick = openGame;

})();