/* =====================================================================
   RẮN & THANG — v4.2 (Extra turn on 6 / Doubles + Auto display_name)
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

/* DEBUG PANEL */
#debugPanel{position:fixed;top:56px;right:8px;z-index:9800;width:min(420px,calc(100vw - 16px));max-height:calc(100vh - 72px);overflow-y:auto;background:rgba(12,8,24,.98);color:#d0f5d0;padding:12px;border-radius:14px;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;line-height:1.5;border:1px solid rgba(0,255,0,.4);box-shadow:0 20px 60px rgba(0,0,0,.8)}
#debugPanel .dbg-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid rgba(0,255,0,.3);font-weight:900;font-size:12px;color:#00ff88}
#debugPanel .dbg-tools{display:flex;gap:4px}
#debugPanel .dbg-tools button{padding:4px 8px;border-radius:6px;background:rgba(0,255,136,.15);color:#00ff88;font-size:10px;font-weight:800;border:1px solid rgba(0,255,136,.4)}
#debugPanel .dbg-tools button:active{transform:scale(.94)}
#debugPanel .dbg-sec{margin:8px 0;padding:6px 8px;background:rgba(0,0,0,.4);border-radius:6px;border-left:2px solid rgba(0,255,136,.6)}
#debugPanel .dbg-sec-title{color:#00ff88;font-weight:900;font-size:10px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}
#debugPanel .dbg-kv{display:flex;gap:6px;margin:1px 0;font-size:10.5px}
#debugPanel .dbg-kv .k{color:#7eb4ff;flex:0 0 auto;min-width:88px}
#debugPanel .dbg-kv .v{color:#d0f5d0;word-break:break-all;flex:1}
#debugPanel .dbg-kv .v.warn{color:#ffd060}
#debugPanel .dbg-kv .v.err{color:#ff6b8a}
#debugPanel .dbg-kv .v.ok{color:#00ff88}
#debugPanel pre{white-space:pre-wrap;word-break:break-all;margin:4px 0 0;background:rgba(0,0,0,.5);padding:6px;border-radius:4px;font-size:9.5px;max-height:200px;overflow-y:auto;color:#b0d0b0;line-height:1.4}
#debugPanel .dbg-evts{margin-top:4px}
#debugPanel .dbg-evt{display:flex;gap:6px;padding:2px 0;font-size:9.5px;border-bottom:1px solid rgba(0,255,136,.1)}
#debugPanel .dbg-evt .t{color:#7eb4ff;flex:0 0 auto}
#debugPanel .dbg-evt .ty{color:#ffb060;flex:0 0 auto;font-weight:800}
#debugPanel .dbg-evt .d{color:#b0d0b0;flex:1;word-break:break-all}
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
        <div class="field" style="text-align:center">
          <label style="margin-bottom:4px">Chào mừng</label>
          <div id="myDisplayName" style="font-size:22px;font-weight:900;color:#a78bfa">...</div>
        </div>
        <div class="field" style="margin-top:16px"><label>Kiểu chơi</label>
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
          <div style="font-size:11px;color:#888;margin-bottom:10px;text-align:left">🎲 Tung 6 (cổ điển) / Đôi (tốc độ) = thêm lượt</div>
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
          <div style="font-size:11px;color:#888;margin-top:4px;text-align:left">🎲 Tung 6 (cổ điển) / Đôi (tốc độ) = thêm lượt</div>
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
    <div class="dbg-head">
      <span>🐞 DEBUG v2</span>
      <div class="dbg-tools">
        <button id="dbgCopy" type="button">📋 Copy</button>
        <button id="dbgForce" type="button">🔄 Force</button>
        <button id="dbgClose" type="button">✕</button>
      </div>
    </div>
    <div id="dbgBody"></div>
  </div>
</div>
`;

  /* ============================ SHADOW HOST ============================ */
  var host = document.createElement('div');
  host.id = 'snakeGameHost';
  host.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;';
  var shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>' + CSS + '</style>' + HTML;
  document.body.appendChild(host);

  var closeBtn = document.createElement('button');
  closeBtn.id = 'snakeGameClose';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9600;width:44px;height:44px;border-radius:50%;background:#000a;color:#fff;font-size:22px;display:none;place-items:center;border:1px solid #fff3;cursor:pointer';
  document.body.appendChild(closeBtn);

  var $ = function (id) { return shadow.getElementById(id); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rnd = function (n) { return Math.floor(Math.random() * n); };

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  /* ============================ DEBUG STATE ============================ */
  var debugOpen = false;
  var dbgEvents = [];
  var lastRtAt = 0;
  var lastPollAt = 0;
  var lastRtPayload = null;

  function nowStr() { return new Date().toTimeString().slice(0, 8); }
  function agoStr(ts) {
    if (!ts) return '—';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 1) return 'now';
    if (s < 60) return s + 's ago';
    return Math.floor(s / 60) + 'm ago';
  }
  function dbgEvent(type, detail) {
    dbgEvents.push({ time: new Date(), type: type, detail: detail || '' });
    if (dbgEvents.length > 60) dbgEvents.shift();
    if (window.console) console.log('[SG]', type, detail || '');
    if (debugOpen) renderDbg();
  }
  function shortTurn(t) { return t ? String(t).slice(0, 12) : '—'; }

  /* ============================ FULL SNAPSHOT ============================ */
  function buildSnapshot() {
    var curP = state.players[state.current];
    var dbTurn = room && room.state ? room.state.current_turn : null;
    var localTurn = curP ? curP.username : null;
    var turnMatch = dbTurn && localTurn && (dbTurn === localTurn);

    return {
      timestamp: new Date().toISOString(),
      me: { username: myUsername, display_name: myProfile ? myProfile.display_name : '?' },
      browser: { ua: navigator.userAgent.slice(0, 120), hidden: document.hidden, online: navigator.onLine },
      realtime: {
        channelActive: !!roomChan, channelState: roomChan && roomChan.state ? roomChan.state : 'none',
        polling: !!pollTimer, last_rt_ago: agoStr(lastRtAt), last_poll_ago: agoStr(lastPollAt),
        last_rt_payload: lastRtPayload
      },
      room: room ? {
        id: room.id, code: room.code, status: room.status, version: room.version,
        host: room.host_username, mode: room.mode, max_players: room.max_players
      } : null,
      room_state: room && room.state ? {
        current_turn: room.state.current_turn, moves: room.state.moves,
        last_roll_by: room.state.last_roll_by, last_roll_at: room.state.last_roll_at,
        winner: room.state.winner || null, started_at: room.state.started_at,
        player_count: room.state.player_count, last_move: room.state.last_move || null,
        log_count: room.state.log ? room.state.log.length : 0
      } : null,
      local_state: {
        mode: state.mode, current_index: state.current, current_username: localTurn,
        current_name: curP ? curP.name : null, isMyTurn: dbTurn === myUsername,
        busy: state.busy, over: state.over, turn_match: turnMatch,
        players: state.players.map(function (p) {
          return { username: p.username, name: p.name, pos: p.pos, targetPos: p.targetPos, animating: !!animating[p.username], bot: !!p.bot };
        })
      },
      room_players_db: roomPlayers.map(function (p) {
        return { username: p.username, display_name: p.display_name, pos: p.pos, is_host: !!p.is_host, color_index: p.color_index };
      }),
      events: dbgEvents.slice(-30).map(function (e) {
        return { time: e.time.toTimeString().slice(0, 8), type: e.type, detail: e.detail };
      })
    };
  }

  /* ============================ RENDER DEBUG ============================ */
  function renderDbg() {
    if (!debugOpen) return;
    var s = buildSnapshot(), body = $('dbgBody'), html = '';

    html += '<div class="dbg-sec"><div class="dbg-sec-title">👤 Me</div>';
    html += '<div class="dbg-kv"><span class="k">username</span><span class="v">' + esc(s.me.username) + '</span></div>';
    html += '<div class="dbg-kv"><span class="k">display_name</span><span class="v">' + esc(s.me.display_name) + '</span></div>';
    html += '</div>';

    if (s.room) {
      html += '<div class="dbg-sec"><div class="dbg-sec-title">🏠 Room</div>';
      html += kv('code', s.room.code); html += kv('status', s.room.status, s.room.status === 'playing' ? 'ok' : 'warn');
      html += kv('version', s.room.version, 'ok'); html += kv('host', s.room.host); html += kv('mode', s.room.mode); html += '</div>';

      html += '<div class="dbg-sec"><div class="dbg-sec-title">📦 Room State (DB)</div>';
      html += kv('current_turn', s.room_state.current_turn, s.room_state.current_turn === myUsername ? 'ok' : '');
      html += kv('moves', s.room_state.moves); html += kv('last_roll_by', s.room_state.last_roll_by || '—'); html += kv('winner', s.room_state.winner || '—');
      if (s.room_state.last_move) {
        var lm = s.room_state.last_move;
        html += kv('last_move', lm.user + ': ' + lm.from + '→' + lm.dice_land + '→' + lm.final + ' [' + lm.via + ']');
      }
      html += '</div>';
    } else {
      html += '<div class="dbg-sec"><div class="dbg-sec-title">🏠 Room</div><div class="dbg-kv"><span class="v">— not in room —</span></div></div>';
    }

    html += '<div class="dbg-sec"><div class="dbg-sec-title">💻 Local State</div>';
    html += kv('mode', s.local_state.mode); html += kv('current_index', s.local_state.current_index);
    html += kv('current_user', s.local_state.current_username);
    html += kv('busy', s.local_state.busy, s.local_state.busy ? 'warn' : 'ok');
    html += kv('isMyTurn', s.local_state.isMyTurn, s.local_state.isMyTurn ? 'ok' : '');
    html += kv('turn_match', s.local_state.turn_match, s.local_state.turn_match ? 'ok' : 'err');
    html += '</div>';

    html += '<div class="dbg-sec"><div class="dbg-sec-title">👥 Players (DB vs Local)</div>';
    if (s.room_players_db.length) {
      html += '<pre>';
      for (var i = 0; i < s.room_players_db.length; i++) {
        var db = s.room_players_db[i];
        var lo = s.local_state.players.find(function (p) { return p.username === db.username; });
        var mark = db.username === myUsername ? '★' : ' ';
        html += mark + ' ' + db.display_name + ' (' + db.username.slice(0, 10) + ')\n';
        html += '  DB: pos=' + db.pos + ' host=' + (db.is_host ? 'Y' : 'N') + '\n';
        if (lo) html += '  LO: pos=' + lo.pos + ' target=' + lo.targetPos + (lo.animating ? ' 🔄' : '') + '\n';
        else html += '  LO: — MISSING —\n';
      }
      html += '</pre>';
    } else html += '<pre>—</pre>';
    html += '</div>';

    html += '<div class="dbg-sec"><div class="dbg-sec-title">📡 Realtime</div>';
    html += kv('channel', s.realtime.channelState, s.realtime.channelState === 'SUBSCRIBED' ? 'ok' : (s.realtime.channelState === 'none' ? '' : 'warn'));
    html += kv('polling', s.realtime.polling ? 'ON (1.5s)' : 'OFF', s.realtime.polling ? 'ok' : 'warn');
    html += kv('last_rt', s.realtime.last_rt_ago); html += kv('last_poll', s.realtime.last_poll_ago);
    if (s.realtime.last_rt_payload) {
      html += '<pre>' + esc(JSON.stringify(s.realtime.last_rt_payload, null, 2).slice(0, 600)) + '</pre>';
    }
    html += '</div>';

    html += '<div class="dbg-sec"><div class="dbg-sec-title">📝 Events (last 30)</div>';
    if (s.events.length) {
      html += '<div class="dbg-evts">';
      for (var j = s.events.length - 1; j >= 0; j--) {
        var ev = s.events[j];
        html += '<div class="dbg-evt"><span class="t">' + ev.time + '</span><span class="ty">' + esc(ev.type) + '</span><span class="d">' + esc(ev.detail) + '</span></div>';
      }
      html += '</div>';
    } else html += '<pre>—</pre>';
    html += '</div>';

    body.innerHTML = html;
  }
  function kv(k, v, cls) { return '<div class="dbg-kv"><span class="k">' + esc(k) + '</span><span class="v' + (cls ? ' ' + cls : '') + '">' + esc(String(v)) + '</span></div>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function copyDebugToClipboard() {
    var s = buildSnapshot();
    var lines = [];
    function add(k, v) { lines.push(pad(k) + ': ' + v); }
    function pad(s) { return (s + ' '.repeat(24)).slice(0, 24); }
    function h1(t) { lines.push(''); lines.push('═══ ' + t + ' ═══'); }

    h1('SNAKE GAME DEBUG SNAPSHOT');
    add('Timestamp', s.timestamp); add('User Agent', s.browser.ua); add('Page Hidden', s.browser.hidden); add('Online', s.browser.online);

    h1('ME');
    add('Username', s.me.username); add('Display Name', s.me.display_name);

    if (s.room) {
      h1('ROOM');
      add('ID', s.room.id); add('Code', s.room.code); add('Status', s.room.status); add('Version', s.room.version); add('Host', s.room.host); add('Mode', s.room.mode);
      h1('ROOM STATE (DB)');
      add('current_turn', s.room_state.current_turn); add('moves', s.room_state.moves); add('last_roll_by', s.room_state.last_roll_by);
      add('last_roll_at', s.room_state.last_roll_at ? new Date(s.room_state.last_roll_at).toISOString() : '—');
      add('winner', s.room_state.winner || '—'); add('player_count', s.room_state.player_count);
      add('last_move', s.room_state.last_move ? JSON.stringify(s.room_state.last_move) : '—');
    }

    h1('LOCAL STATE');
    add('mode', s.local_state.mode); add('current_index', s.local_state.current_index);
    add('current_username', s.local_state.current_username); add('current_name', s.local_state.current_name);
    add('isMyTurn', s.local_state.isMyTurn); add('busy', s.local_state.busy);
    add('turn_match', s.local_state.turn_match + (s.local_state.turn_match ? ' ✓' : ' ✗ MISMATCH!'));

    h1('PLAYERS COMPARE (DB vs Local)');
    s.room_players_db.forEach(function (db) {
      var lo = s.local_state.players.find(function (p) { return p.username === db.username; });
      lines.push((db.username === myUsername ? '★ ' : '  ') + db.display_name + ' (' + db.username + ')');
      lines.push('    DB: pos=' + db.pos + ' host=' + db.is_host + ' color=' + db.color_index);
      if (lo) lines.push('    LO: pos=' + lo.pos + ' target=' + lo.targetPos + ' animating=' + lo.animating);
      else lines.push('    LO: MISSING!');
    });

    h1('REALTIME');
    add('channelState', s.realtime.channelState); add('polling', s.realtime.polling ? 'ON' : 'OFF');
    add('last_rt', s.realtime.last_rt_ago); add('last_poll', s.realtime.last_poll_ago);
    if (s.realtime.last_rt_payload) { lines.push('last_rt_payload:'); lines.push(JSON.stringify(s.realtime.last_rt_payload, null, 2)); }

    h1('EVENTS (last 30, newest last)');
    s.events.forEach(function (e) { lines.push('[' + e.time + '] ' + e.type + ' ' + e.detail); });

    var text = lines.join('\n');
    var done = function () { toast('📋 Đã copy debug — gửi cho dev nhé!'); };
    var fail = function () { fallbackCopy(text, done); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fail);
      else fail();
    } catch (e) { fail(); }
  }
  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); document.body.removeChild(ta);
      if (ok) done(); else toast('Không copy được, mở console xem');
    } catch (e) { toast('Copy fail: ' + e.message); }
  }

  /* ============================ CONFIG ============================ */
  var FALLBACK = {
    URL: 'https://tumjcsaexddioecwjolp.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ'
  };
  var CFG = window.__SRANK_CONFIG || FALLBACK;
  var sb = null;
  if (window.supabase && CFG.SUPABASE_URL) {
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });
  }

  /* ============================ STATE ============================ */
  var LADDERS = { 1:38, 4:14, 9:31, 21:42, 28:84, 36:44, 51:67, 71:91, 80:100 };
  var SNAKES = { 16:6, 47:26, 49:11, 56:53, 62:19, 64:60, 87:24, 93:73, 95:75, 98:78 };
  var STYLES = [{c:'#ff5fa2',s:'#ffe4f1'},{c:'#4f8dff',s:'#e0edff'},{c:'#18c08a',s:'#dcf9ee'},{c:'#f6a723',s:'#ffefd4'}];
  var BOTS = ['Mèo', 'Gấu', 'Thỏ'];

  var state = { mode: 'online', count: 2, players: [], current: 0, busy: false, over: false, startTime: 0 };
  var myUsername = '', myProfile = null, room = null, roomPlayers = [];
  var roomChan = null, roomsChan = null, pollTimer = null, animating = {};
  var isHost = false, busyTimeout = null, pendingWin = null, wasMyTurn = false;
  var refreshTimer = null;

  function getMyUsername() {
    var u = '';
    try {
      var keys = ['srank_username', 'username'];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v) { try { u = JSON.parse(v).username || v; } catch (_) { u = v; } if (u) break; }
      }
      if (!u && window.SRANK_STATE && window.SRANK_STATE.currentUser) u = window.SRANK_STATE.currentUser.username;
      if (!u) { var el = document.getElementById('logoutName'); if (el) u = el.textContent.trim(); }
    } catch (e) {}
    if (!u) {
      u = localStorage.getItem('srank_guest_id');
      if (!u) { u = 'guest_' + rnd(99999); localStorage.setItem('srank_guest_id', u); }
    }
    return String(u).trim();
  }

  /* ============================ HELPERS ============================ */
  function posToXY(pos) {
    var idx = pos - 1, r = Math.floor(idx / 10), c = idx % 10;
    if (r % 2 !== 0) c = 9 - c;
    return { x: c * 10 + 5, y: (9 - r) * 10 + 5, c: c, r: 9 - r };
  }
  function avt(s) { return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(s) + '&backgroundColor=ffd5dc,b6e3f4&radius=14'; }

  /* FIX 1 & 2: Extra turn logic */
  function isExtraTurn(mode, vals) {
    if (mode === 'classic') return vals.length === 1 && vals[0] === 6;
    if (mode === 'speed') return vals.length === 2 && vals[0] === vals[1];
    return false;
  }

  /* ============================ AUDIO ============================ */
  var actx = null, sfxOn = true;
  function beep(f, d, t, v, delay) {
    if (!sfxOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime + (delay || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = t || 'sine'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v || .05, t0 + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + d + .05);
    } catch (e) {}
  }
  var sfx = {
    tick: function () { beep(600 + rnd(100), .05, 'square', .02); },
    roll: function () { for (var i = 0; i < 6; i++) beep(300 + i * 80, .05, 'triangle', .03, i * .07); },
    ladder: function () { [500, 600, 800].forEach(function (f, i) { beep(f, .15, 'sine', .05, i * .08); }); },
    snake: function () { [600, 500, 400].forEach(function (f, i) { beep(f, .15, 'sawtooth', .04, i * .08); }); },
    win: function () { [500, 600, 800, 1000].forEach(function (f, i) { beep(f, .3, 'sine', .05, i * .1); }); }
  };

  /* ============================ DICE ============================ */
  var PIPS = {1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]]};
  var FACE_TF = {1:'translateZ(36px)',2:'rotateY(90deg) translateZ(36px)',3:'rotateX(90deg) translateZ(36px)',4:'rotateX(-90deg) translateZ(36px)',5:'rotateY(-90deg) translateZ(36px)',6:'rotateY(180deg) translateZ(36px)'};
  var FACE_RT = {1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
  function makeDice(el) {
    el.innerHTML = '';
    for (var f = 1; f <= 6; f++) {
      var div = document.createElement('div');
      div.className = 'dice-face';
      div.style.transform = FACE_TF[f];
      PIPS[f].forEach(function (rc) {
        var p = document.createElement('i');
        p.className = 'pip';
        p.style.gridRow = rc[0]; p.style.gridColumn = rc[1];
        div.appendChild(p);
      });
      el.appendChild(div);
    }
    var sx = 0, sy = 0;
    return {
      show: function (n, inst) {
        var rx = FACE_RT[n][0], ry = FACE_RT[n][1];
        if (inst) {
          el.style.transition = 'none';
          el.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
          sx = rx; sy = ry;
          void el.offsetWidth;
          el.style.transition = '';
          return;
        }
        sx += 360 * (2 + rnd(3)); sy += 360 * (2 + rnd(3));
        el.style.transform = 'rotateX(' + (sx + rx) + 'deg) rotateY(' + (sy + ry) + 'deg)';
      }
    };
  }
  var dice0, dice1;

  /* ============================ RENDER UI ============================ */
  function renderPlayers() {
    var el = $('playerList'); el.innerHTML = '';
    state.players.forEach(function (p, i) {
      var card = document.createElement('div');
      card.className = 'pcard' + (i === state.current ? ' active' : '');
      card.style.setProperty('--c', p.color);
      card.style.setProperty('--soft', p.soft);
      card.innerHTML = '<div class="pav"><img src="' + p.avatar + '"><span class="ptag">' + p.pos + '</span></div>' +
        '<div style="flex:1"><div class="pname">' + esc(p.name) + (p.username === myUsername ? ' <span style="color:#4f8dff;font-size:9px">(BẠN)</span>' : '') + '</div>' +
        '<div class="pbar"><span style="width:' + p.pos + '%"></span></div></div>';
      el.appendChild(card);
      p.cardEl = card;
      p.posEl = card.querySelector('.ptag');
      p.barEl = card.querySelector('.pbar span');
    });
  }
  function syncCards() {
    state.players.forEach(function (p) {
      if (p.posEl) p.posEl.textContent = p.pos;
      if (p.barEl) p.barEl.style.width = Math.min(100, p.pos) + '%';
      if (p.cardEl) p.cardEl.classList.toggle('active', p === state.players[state.current]);
    });
  }
  function createTokens() {
    var el = $('tokens'); el.innerHTML = '';
    state.players.forEach(function (p) {
      var div = document.createElement('div');
      div.className = 'token';
      div.style.setProperty('--c', p.color);
      div.innerHTML = '<img src="' + p.avatar + '"><span style="position:absolute;bottom:-5px;right:-5px;background:' + p.color + ';color:#fff;font-size:8px;border-radius:50%;width:14px;height:14px;display:grid;place-items:center">' + (p.id + 1) + '</span>';
      el.appendChild(div);
      p.el = div;
    });
  }
  function posTokens() {
    var groups = {};
    state.players.forEach(function (p) { (groups[p.pos] = groups[p.pos] || []).push(p); });
    Object.keys(groups).forEach(function (k) {
      var pos = +k, g = posToXY(Math.max(1, Math.min(100, pos))), list = groups[k], n = list.length;
      list.forEach(function (p, i) {
        if (!p.el) return;
        var ang = n > 1 ? (i / n) * Math.PI * 2 : 0;
        var r = n > 1 ? 2.5 : 0;
        p.el.style.left = (g.x + Math.cos(ang) * r) + '%';
        p.el.style.top = (g.y + Math.sin(ang) * r) + '%';
        p.el.style.zIndex = p === state.players[state.current] ? 60 : 20;
      });
    });
    syncCards();
  }
  function updatePill() {
    var p = state.players[state.current]; if (!p) return;
    $('turnPill').style.setProperty('--c', p.color);
    var isMe = (p.username === myUsername && state.mode === 'online');
    $('turnPill').querySelector('.txt').textContent = state.over ? 'Kết thúc' : (isMe ? '👉 Lượt BẠN!' : 'Lượt: ' + p.name);
  }
  function addLog(text, color) {
    var div = document.createElement('div');
    div.className = 'log-item';
    div.style.setProperty('--c', color || '#a78bfa');
    div.textContent = text;
    $('log').prepend(div);
  }

  /* ============================ BOARD ============================ */
  function buildBoard() {
    var cells = $('cells'); cells.innerHTML = '';
    for (var i = 1; i <= 100; i++) {
      var g = posToXY(i);
      var c = document.createElement('div');
      c.className = 'cell';
      c.style.gridColumn = g.c + 1;
      c.style.gridRow = g.r + 1;
      c.textContent = i;
      c.style.background = 'hsl(' + (g.r * 30) + ' 90% 97%)';
      if (i === 1) c.innerHTML += '🏁';
      else if (i === 100) c.innerHTML += '🏆';
      else if (LADDERS[i]) c.innerHTML += '<span style="position:absolute;right:2px;bottom:2px">🪜</span>';
      else if (SNAKES[i]) c.innerHTML += '<span style="position:absolute;right:2px;bottom:2px">🐍</span>';
      cells.appendChild(c);
    }
    var svg = $('boardSvg'), h = '';
    for (var k in LADDERS) {
      var A = posToXY(+k), B = posToXY(LADDERS[k]);
      h += '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '" stroke="#f0b429" stroke-width="1.5" opacity=".8"/>';
    }
    for (var k2 in SNAKES) {
      var A2 = posToXY(+k2), B2 = posToXY(SNAKES[k2]);
      h += '<path d="M ' + A2.x + ' ' + A2.y + ' Q ' + ((A2.x + B2.x) / 2 + 20) + ' ' + ((A2.y + B2.y) / 2) + ' ' + B2.x + ' ' + B2.y + '" fill="none" stroke="#7c5cff" stroke-width="2.5" opacity=".8"/>';
    }
    svg.innerHTML = h;
  }

  /* ============================ GAME LOGIC ============================ */
  function animateDice(vals) {
    var cubes = [dice0]; if (vals.length > 1) cubes.push(dice1);
    cubes.forEach(function (c) { c.show(1 + rnd(6)); });
    sfx.roll();
    return (function loop(i) {
      if (i >= 5) {
        cubes.forEach(function (c, j) { c.show(vals[j] || 1); });
        return sleep(500);
      }
      return sleep(60).then(function () {
        cubes.forEach(function (c) { c.show(1 + rnd(6)); });
        return loop(i + 1);
      });
    })(0);
  }

  function syncTurnUI() {
    if (state.mode !== 'online' || !room) return;
    var isMe = room.state && room.state.current_turn === myUsername;
    var play = room.status === 'playing';
    var canRoll = isMe && play && !state.busy && !animating[myUsername];
    $('rollBtn').disabled = !canRoll;
    if (!play) $('rollHint').textContent = 'Đã kết thúc';
    else if (isMe) $('rollHint').textContent = state.busy ? 'Đang xử lý...' : '👉 Lượt của bạn!';
    else {
      var curP = state.players.find(function (p) { return p.username === (room.state && room.state.current_turn); });
      $('rollHint').textContent = 'Đang chờ ' + (curP ? curP.name : '...') + '...';
    }
    if (debugOpen) renderDbg();
  }

  function enterGameRoom() {
    state.players = [];
    state.over = false;
    state.busy = false;
    animating = {};
    $('log').innerHTML = '';
    showScreen('gameScreen');
    buildBoard();
    createTokens();
    $('diceStage1').style.display = room.mode === 'speed' ? 'block' : 'none';
    dice0.show(1, true);
    if (dice1) dice1.show(1, true);
    rebuildRoomState();
    dbgEvent('ENTER_GAME', 'mode=' + room.mode);
  }

  function rebuildRoomState() {
    if (!room || (room.status !== 'playing' && room.status !== 'finished')) return;

    var oldMap = {};
    state.players.forEach(function (p) { oldMap[p.username] = p; });

    var needRender = false;
    var newPlayers = roomPlayers.map(function (rp, i) {
      var old = oldMap[rp.username];
      if (old) {
        old.targetPos = rp.pos;
        old.name = rp.display_name;
        old.skip = rp.skip_turn;
        old.extra = rp.extra_turn;
        return old;
      } else {
        needRender = true;
        var st = STYLES[rp.color_index % 4];
        return {
          id: i, username: rp.username, name: rp.display_name,
          pos: rp.pos, targetPos: rp.pos,
          color: st.c, soft: st.s,
          avatar: rp.avatar_url || avt(rp.display_name)
        };
      }
    });

    if (newPlayers.length !== state.players.length) needRender = true;
    state.players = newPlayers;

    if (needRender) {
      renderPlayers();
      createTokens();
      posTokens();
      animating = {};
    }

    var curIdx = state.players.findIndex(function (p) { return p.username === (room.state && room.state.current_turn); });
    if (curIdx >= 0 && curIdx !== state.current) state.current = curIdx;
    if (curIdx < 0 && state.players.length) state.current = 0;

    updatePill(); syncCards(); posTokens();

    var lastMove = room.state && room.state.last_move;
    state.players.forEach(function (p) {
      if (p.pos !== p.targetPos && !animating[p.username]) {
        var mi = (lastMove && lastMove.user === p.username) ? lastMove : null;
        animateMove(p, mi);
      }
    });

    renderLogs(room.state && room.state.log);
    syncTurnUI();

    if (room.state && room.state.winner && $('winOverlay').hidden) showWin(room.state.winner);
  }

  function animateMove(p, move) {
    if (animating[p.username]) return;
    animating[p.username] = true;
    dbgEvent('ANIM_START', p.name + ' ' + p.pos + '→' + p.targetPos + (move ? ' [' + move.via + ']' : ''));
    (function step() {
      if (p.pos === p.targetPos) {
        animating[p.username] = false;
        dbgEvent('ANIM_END', p.name + ' pos=' + p.pos);
        if (debugOpen) renderDbg();
        return;
      }
      if (move && move.dice_land != null && move.dice_land !== move.final && p.pos === move.from) {
        if (p.pos !== move.dice_land) {
          p.pos += move.dice_land > p.pos ? 1 : -1;
          posTokens(); sfx.tick();
          return sleep(60).then(step);
        }
        return sleep(200).then(function () {
          p.pos = move.final;
          if (move.via === 'ladder') sfx.ladder();
          else if (move.via === 'snake') sfx.snake();
          posTokens();
          return sleep(300).then(step);
        });
      }
      p.pos += p.targetPos > p.pos ? 1 : -1;
      posTokens(); sfx.tick();
      return sleep(60).then(step);
    })();
  }

  function renderLogs(logs) {
    if (!logs || !logs.length) return;
    var rendered = $('log').children.length;
    var toRender = logs.slice(0, logs.length - rendered).reverse();
    toRender.forEach(function (l) { addLog(l.text, l.color); });
  }

  /* ============================ ONLINE ROLL ============================ */
  async function doRollOnline() {
    if (state.busy || !room || room.status !== 'playing') return;
    if (!room.state || room.state.current_turn !== myUsername) {
      dbgEvent('ROLL_BLOCKED', 'not my turn');
      return;
    }
    state.busy = true;
    $('rollBtn').disabled = true;
    if (busyTimeout) clearTimeout(busyTimeout);
    busyTimeout = setTimeout(function () {
      if (state.busy) { state.busy = false; dbgEvent('BUSY_TIMEOUT', 'force reset'); syncTurnUI(); }
    }, 8000);

    try {
      var me = roomPlayers.find(function (p) { return p.username === myUsername; });
      if (!me) { state.busy = false; return; }

      var n = room.mode === 'speed' ? 2 : 1, vals = [], total = 0;
      for (var i = 0; i < n; i++) { var v = 1 + rnd(6); vals.push(v); total += v; }
      dbgEvent('ROLL_DICE', vals.join('+') + '=' + total);
      await animateDice(vals);

      var land = me.pos + total;
      var goal = land >= 100;
      if (goal) land = 100;
      var final = land, via = 'normal';
      var myColor = STYLES[me.color_index % 4].c;
      var newLogs = [{ text: '🎲 ' + me.display_name + ' tung ' + vals.join('+') + (n > 1 ? '=' + total : ''), color: myColor, ts: Date.now() }];

      if (goal) via = 'goal';
      else if (LADDERS[land]) { final = LADDERS[land]; via = 'ladder'; newLogs.push({ text: '🪜 Leo thang ' + land + ' → ' + final, color: myColor, ts: Date.now() + 1 }); }
      else if (SNAKES[land]) { final = SNAKES[land]; via = 'snake'; newLogs.push({ text: '🐍 Rắn cắn ' + land + ' → ' + final, color: myColor, ts: Date.now() + 1 }); }

      var winner = goal ? myUsername : null;
      var curIdx = roomPlayers.findIndex(function (p) { return p.username === myUsername; });
      
      // FIX 1 & 2: Extra turn logic
      var extra = !winner && isExtraTurn(room.mode, vals);
      if (extra) {
        newLogs.push({ text: '🎁 ' + me.display_name + ' được tung thêm 1 lượt!', color: myColor, ts: Date.now() + 2 });
      }
      var next = extra ? myUsername : roomPlayers[(curIdx + 1) % roomPlayers.length].username;

      var updPlayer = await sb.from('snake_room_players').update({ pos: final }).eq('room_id', room.id).eq('username', myUsername);
      if (updPlayer.error) throw updPlayer.error;

      var newState = {
        current_turn: winner || next,
        dice: vals, last_roll_by: myUsername, last_roll_at: Date.now(),
        moves: ((room.state && room.state.moves) || 0) + 1,
        started_at: (room.state && room.state.started_at) || Date.now(),
        player_count: (room.state && room.state.player_count) || roomPlayers.length,
        log: newLogs.concat((room.state && room.state.log) || []).slice(0, 40),
        winner: winner, last_move: { user: myUsername, from: me.pos, dice_land: land, final: final, via: via }
      };

      var updRoom = await sb.from('snake_rooms').update({
        state: newState, status: winner ? 'finished' : 'playing',
        version: ((room.version || 0) + 1), updated_at: new Date().toISOString()
      }).eq('id', room.id);
      if (updRoom.error) throw updRoom.error;

      dbgEvent('ROLL_SENT', 'v' + (room.version + 1) + ' ' + vals.join('+') + ' pos=' + final + ' next=' + shortTurn(next) + (extra ? ' [EXTRA]' : ''));

      state.busy = false;
      if (busyTimeout) { clearTimeout(busyTimeout); busyTimeout = null; }
      syncTurnUI();
    } catch (e) {
      state.busy = false;
      if (busyTimeout) { clearTimeout(busyTimeout); busyTimeout = null; }
      $('rollBtn').disabled = false;
      dbgEvent('ROLL_ERR', e.message || String(e));
      toast('Lỗi: ' + (e.message || 'không rõ'));
    }
  }

  /* ============================ REALTIME ============================ */
  function handleRoomUpdate(oldR, newR) {
    var oldV = oldR.version || 0, newV = newR.version || 0;
    if (newV <= oldV) { dbgEvent('RT_STALE', 'v' + newV + ' ≤ v' + oldV); return; }
    dbgEvent('RT_UPDATE', 'v' + oldV + '→v' + newV + ' turn=' + shortTurn(newR.state && newR.state.current_turn));

    room = newR;
    if (oldR.status === 'waiting' && newR.status === 'playing') {
      refreshPlayers().then(enterGameRoom);
      return;
    }

    var newRollAt = (newR.state && newR.state.last_roll_at) || 0;
    var oldRollAt = (oldR.state && oldR.state.last_roll_at) || 0;
    if (newRollAt > oldRollAt && newR.state.last_roll_by !== myUsername) {
      animateDice(newR.state.dice || [1]);
    }

    refreshPlayers().then(rebuildRoomState);
  }

  function startRealtime() {
    if (!room || !sb) return;
    if (roomChan) { try { sb.removeChannel(roomChan); } catch (e) {} }
    dbgEvent('RT_SUBSCRIBE', 'room=' + room.code);
    roomChan = sb.channel('r:' + room.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'snake_rooms', filter: 'id=eq.' + room.id }, function (p) {
        lastRtAt = Date.now();
        lastRtPayload = { newVersion: p.new && p.new.version, newTurn: p.new && p.new.state && p.new.state.current_turn };
        handleRoomUpdate(room, p.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'snake_rooms', filter: 'id=eq.' + room.id }, function () {
        lastRtAt = Date.now();
        dbgEvent('RT_DELETE', 'room closed');
        if ($('winOverlay').hidden) { toast('Phòng đã đóng'); leaveRoom(); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'snake_room_players', filter: 'room_id=eq.' + room.id }, function (p) {
        lastRtAt = Date.now();
        dbgEvent('RT_PLAYER', (p.eventType || p.event) + ' ' + (p.new && p.new.username || ''));
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshPlayers, 80);
      })
      .subscribe(function (status) {
        dbgEvent('RT_STATUS', status);
      });

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      if (!room || document.hidden) return;
      lastPollAt = Date.now();
      try {
        var r = await sb.from('snake_rooms').select('*').eq('id', room.id).maybeSingle();
        if (r.data) handleRoomUpdate(room, r.data);
      } catch (e) {}
    }, 1500);
  }

  async function refreshPlayers() {
    if (!room) return;
    try {
      var r = await sb.from('snake_room_players').select('*').eq('room_id', room.id).order('joined_at');
      if (r.data) { roomPlayers = r.data; if (room.status === 'waiting') renderWait(); }
    } catch (e) { dbgEvent('REFRESH_ERR', e.message); }
  }

  /* ============================ LOCAL GAME ============================ */
  function startLocalGame() {
    state.players = [];
    state.over = false; state.busy = false;
    state.current = 0; state.startTime = Date.now();
    var me = { id: 0, username: myUsername, name: myProfile.display_name, pos: 0, targetPos: 0, color: STYLES[0].c, soft: STYLES[0].s, avatar: myProfile.avatar_url, bot: false };
    state.players.push(me);
    for (var i = 1; i < state.count; i++) {
      var bot = state.mode === 'bot';
      state.players.push({
        id: i, username: bot ? 'bot_' + i : 'p' + i,
        name: bot ? BOTS[i - 1] : 'Người chơi ' + i,
        pos: 0, targetPos: 0,
        color: STYLES[i].c, soft: STYLES[i].s,
        avatar: avt('bot' + i), bot: bot
      });
    }
    $('log').innerHTML = '';
    showScreen('gameScreen');
    buildBoard(); renderPlayers(); createTokens();
    $('diceStage1').style.display = state.mode === 'speed' ? 'block' : 'none';
    posTokens(); updatePill(); syncCards();
    beginTurnLocal();
  }

  function beginTurnLocal() {
    var p = state.players[state.current]; if (!p) return;
    updatePill(); syncCards(); posTokens();
    if (p.bot) {
      $('rollBtn').disabled = true;
      $('rollHint').textContent = 'Bot đang suy nghĩ...';
      setTimeout(doRollLocal, 800);
    } else {
      $('rollBtn').disabled = false;
      $('rollHint').textContent = 'Lượt của bạn!';
    }
  }

  async function doRollLocal() {
    if (state.busy || state.over) return;
    state.busy = true;
    $('rollBtn').disabled = true;
    var p = state.players[state.current], n = state.mode === 'speed' ? 2 : 1;
    var vals = []; for (var i = 0; i < n; i++) vals.push(1 + rnd(6));
    await animateDice(vals);
    var tot = vals.reduce(function (a, b) { return a + b; }, 0);
    addLog('🎲 ' + p.name + ' tung ' + tot, p.color);
    var land = p.pos + tot, goal = land >= 100;
    if (goal) land = 100;
    while (p.pos < land) { p.pos++; posTokens(); sfx.tick(); await sleep(50); }
    if (goal) { winLocal(p); return; }
    if (LADDERS[p.pos]) { p.pos = LADDERS[p.pos]; sfx.ladder(); posTokens(); await sleep(300); }
    else if (SNAKES[p.pos]) { p.pos = SNAKES[p.pos]; sfx.snake(); posTokens(); await sleep(300); }
    if (p.pos >= 100) { winLocal(p); return; }
    
    // FIX 1 & 2: Extra turn logic
    var extra = isExtraTurn(state.mode, vals);
    if (extra) {
      addLog('🎁 ' + p.name + ' được tung thêm 1 lượt!', p.color);
      state.busy = false;
      beginTurnLocal();
      return;
    }
    
    state.busy = false;
    state.current = (state.current + 1) % state.players.length;
    beginTurnLocal();
  }

  function winLocal(p) {
    state.over = true;
    sfx.win();
    $('winTitle').textContent = p.username === myUsername ? 'Bạn thắng!' : p.name + ' thắng!';
    $('winOverlay').hidden = false;
  }

  function showWin(winner) {
    var wp = roomPlayers.find(function (p) { return p.username === winner; });
    var wName = wp ? wp.display_name : winner;
    var isMe = winner === myUsername;
    $('winTitle').textContent = isMe ? 'Bạn thắng! 🎉' : wName + ' thắng!';
    $('winSub').textContent = isMe ? 'Tuyệt vời!' : 'Chơi ván mới nhé!';
    sfx.win();
    $('winOverlay').hidden = false;
  }

  /* ============================ UI BINDINGS ============================ */
  function showScreen(id) {
    ['menuScreen', 'onlineScreen', 'waitingScreen', 'localSetupScreen', 'gameScreen'].forEach(function (s) {
      $(s).hidden = (s !== id);
    });
    if (id !== 'gameScreen') $('winOverlay').hidden = true;
  }

  $('debugBtn').onclick = function () { debugOpen = !debugOpen; $('debugPanel').hidden = !debugOpen; if (debugOpen) renderDbg(); };
  $('dbgClose').onclick = function () { debugOpen = false; $('debugPanel').hidden = true; };
  $('dbgCopy').onclick = copyDebugToClipboard;
  $('dbgForce').onclick = async function () {
    if (!room) return toast('Chưa vào phòng');
    dbgEvent('FORCE_REFRESH', 'manual');
    try {
      var r = await sb.from('snake_rooms').select('*').eq('id', room.id).maybeSingle();
      if (r.data) handleRoomUpdate(room, r.data);
      await refreshPlayers(); rebuildRoomState(); renderDbg();
    } catch (e) { toast('Lỗi: ' + e.message); }
  };

  $('playModeGrid').onclick = function (e) {
    var btn = e.target.closest('.play-card'); if (!btn) return;
    Array.prototype.forEach.call(e.currentTarget.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
  };

  $('continueBtn').onclick = async function () {
    if (state.mode === 'online') {
      if (!sb) return toast('Lỗi Supabase');
      showScreen('onlineScreen');
      fetchRooms();
      if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} }
      roomsChan = sb.channel('rooms-list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'snake_rooms' }, fetchRooms)
        .subscribe();
    } else {
      $('localSetupTitle').textContent = state.mode === 'bot' ? 'Đấu với Bot' : 'Cùng máy';
      showScreen('localSetupScreen');
    }
  };

  $('backFromOnlineBtn').onclick = function () { showScreen('menuScreen'); if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} roomsChan = null; } };
  $('backFromLocalBtn').onclick = function () { showScreen('menuScreen'); };
  $('refreshRoomsBtn').onclick = fetchRooms;

  $('createRoomBtn').onclick = async function () {
    if (room) return toast('Đang ở phòng khác');
    var code = Array.from({ length: 6 }, function () { return 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[rnd(32)]; }).join('');
    var r = await sb.from('snake_rooms').insert({ code: code, host_username: myUsername, status: 'waiting', max_players: 4, mode: 'classic', state: {}, version: 0 }).select().single();
    if (r.error) return toast('Lỗi tạo phòng');
    room = r.data; isHost = true;
    await sb.from('snake_room_players').insert({
      room_id: room.id, username: myUsername,
      display_name: myProfile.display_name || myUsername,
      avatar_url: myProfile.avatar_url, color_index: 0, pos: 0, is_host: true
    });
    enterWait();
  };

  $('roomsList').onclick = async function (e) {
    var btn = e.target.closest('.room-item-join'); if (!btn) return;
    var rid = btn.dataset.id;
    var r = await sb.from('snake_rooms').select('*').eq('id', rid).eq('status', 'waiting').maybeSingle();
    if (r.error || !r.data) return toast('Phòng đã đóng');
    room = r.data; isHost = (room.host_username === myUsername);
    var ex = await sb.from('snake_room_players').select('id').eq('room_id', rid).eq('username', myUsername).maybeSingle();
    if (!ex.data) {
      var cnt = await sb.from('snake_room_players').select('id', { count: 'exact', head: true }).eq('room_id', rid);
      await sb.from('snake_room_players').insert({
        room_id: rid, username: myUsername,
        display_name: myProfile.display_name || myUsername,
        avatar_url: myProfile.avatar_url, color_index: cnt.count || 0, pos: 0
      });
    }
    enterWait();
  };

  $('leaveRoomBtn').onclick = leaveRoom;
  async function leaveRoom() {
    dbgEvent('LEAVE', room ? room.code : 'none');
    if (room) {
      if (roomChan) { try { sb.removeChannel(roomChan); } catch (e) {} roomChan = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      try {
        await sb.from('snake_room_players').delete().eq('room_id', room.id).eq('username', myUsername);
        if (isHost) await sb.from('snake_rooms').delete().eq('id', room.id);
      } catch (e) {}
    }
    room = null; isHost = false; roomPlayers = [];
    showScreen('menuScreen');
    if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} roomsChan = null; }
  }

  $('hostStartBtn').onclick = async function () {
    if (roomPlayers.length < 2) return;
    var mode = $('hostModeSelect').value, now = Date.now();
    await sb.from('snake_room_players').update({ pos: 0, skip_turn: false, extra_turn: false }).eq('room_id', room.id);
    await sb.from('snake_rooms').update({
      status: 'playing', mode: mode, version: ((room.version || 0) + 1), updated_at: new Date().toISOString(),
      state: {
        current_turn: roomPlayers[0].username, dice: [1], moves: 0,
        started_at: now, last_roll_at: 0, player_count: roomPlayers.length,
        log: [{ text: 'Trò chơi bắt đầu!', color: '#a78bfa', ts: now }],
        winner: null, last_move: null
      }
    }).eq('id', room.id);
    dbgEvent('HOST_START', 'mode=' + mode + ' players=' + roomPlayers.length);
  };

  $('modeGrid').onclick = function (e) {
    var btn = e.target.closest('.play-card'); if (!btn) return;
    Array.prototype.forEach.call(e.currentTarget.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
  };
  $('countSeg').onclick = function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    Array.prototype.forEach.call(e.currentTarget.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.count = +btn.dataset.c;
  };
  $('startLocalBtn').onclick = startLocalGame;
  $('quitBtn').onclick = function () { if (room) leaveRoom(); else showScreen('menuScreen'); };
  $('rollBtn').onclick = function () {
    if (state.mode === 'online' && room) doRollOnline();
    else doRollLocal();
  };
  $('playAgainBtn').onclick = function () {
    $('winOverlay').hidden = true;
    if (room) leaveRoom(); else showScreen('menuScreen');
  };
  $('soundBtn').onclick = function (e) {
    sfxOn = !sfxOn;
    e.currentTarget.textContent = sfxOn ? '🔊' : '🔇';
  };

  function enterWait() {
    showScreen('waitingScreen');
    $('hostControls').style.display = isHost ? 'block' : 'none';
    renderWait(); startRealtime(); refreshPlayers();
    dbgEvent('ENTER_WAIT', room ? room.code : 'none');
  }
  function renderWait() {
    $('waitingCount').textContent = roomPlayers.length;
    $('waitingPlayers').innerHTML = roomPlayers.map(function (p) {
      return '<div class="waiting-player"><img src="' + (p.avatar_url || avt(p.display_name)) + '">' +
        '<span>' + esc(p.display_name) + (p.username === myUsername ? ' (Bạn)' : '') + '</span>' +
        (p.is_host ? '<span style="color:#ff7ab8;font-size:10px">HOST</span>' : '') + '</div>';
    }).join('');
    $('hostStartBtn').disabled = roomPlayers.length < 2;
    $('hostStartBtn').textContent = roomPlayers.length >= 2 ? '🚀 Bắt đầu (' + roomPlayers.length + ')' : '⏳ Cần 2 người';
  }

  async function fetchRooms() {
    if (!sb) return;
    var r = await sb.from('snake_rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(20);
    if (!r.data) return;
    var ids = r.data.map(function (x) { return x.id; });
    var counts = {};
    if (ids.length) {
      var p = await sb.from('snake_room_players').select('room_id').in('room_id', ids);
      if (p.data) p.data.forEach(function (row) { counts[row.room_id] = (counts[row.room_id] || 0) + 1; });
    }
    $('roomsList').innerHTML = r.data.map(function (rm) {
      var cnt = counts[rm.id] || 1;
      var mine = rm.host_username === myUsername;
      var full = cnt >= rm.max_players;
      var label = mine ? 'Của bạn' : (full ? 'Đầy' : 'Vào');
      return '<div class="room-item">' +
        '<div class="room-item-info"><div class="room-item-host">🐱 ' + esc(rm.host_username) + '</div>' +
        '<div class="room-item-meta">' + cnt + '/' + rm.max_players + ' người · ' + esc(rm.mode) + '</div></div>' +
        '<button class="room-item-join" data-id="' + rm.id + '"' + ((mine || full) ? ' disabled' : '') + '>' + label + '</button></div>';
    }).join('') || '<div style="text-align:center;padding:20px;color:#888">Chưa có phòng nào</div>';
  }

  /* ============================ INIT ============================ */
  dice0 = makeDice($('dice0'));
  dice1 = makeDice($('dice1'));

  (async function init() {
    myUsername = getMyUsername();
    if (sb) {
      try {
        var p = await sb.from('public_players').select('*').eq('username', myUsername).maybeSingle();
        myProfile = p.data || { display_name: myUsername, avatar_url: avt(myUsername) };
      } catch (e) { myProfile = { display_name: myUsername, avatar_url: avt(myUsername) }; }
    } else {
      myProfile = { display_name: myUsername, avatar_url: avt(myUsername) };
    }
    $('myDisplayName').textContent = myProfile.display_name;
    dbgEvent('INIT', 'user=' + myUsername);
  })();

  function openGame() {
    document.body.style.overflow = 'hidden';
    host.style.display = 'block';
    closeBtn.style.display = 'grid';
    showScreen('menuScreen');
  }
  closeBtn.onclick = function () {
    host.style.display = 'none';
    closeBtn.style.display = 'none';
    document.body.style.overflow = '';
    debugOpen = false;
    $('debugPanel').hidden = true;
    if (room) leaveRoom();
  };

  var launcher = document.getElementById('snakeLadderBtn');
  if (launcher) launcher.onclick = openGame;
})();