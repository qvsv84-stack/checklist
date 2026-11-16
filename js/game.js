/* =====================================================================
   RẮN & THANG — ONLINE MULTIPLAYER (v3)
   - Public room list (không cần mã)
   - Start với 2+ người chơi
   - Realtime sync state + auto refresh
   - Chỉ winner save score (không duplicate)
   ===================================================================== */
(function () {
  'use strict';
  if (window.__snakeGameLoaded) return;
  window.__snakeGameLoaded = true;

  /* ============================ CSS ============================ */
  var GAME_CSS = `
*,*::before,*::after{box-sizing:border-box}
#sgApp{margin:0;font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;color:#3b2b52;background:radial-gradient(1200px 700px at 8% -12%,#ffe4f5 0%,transparent 58%),radial-gradient(1000px 700px at 108% -4%,#dceeff 0%,transparent 55%),radial-gradient(900px 800px at 50% 118%,#fff1d8 0%,transparent 60%),linear-gradient(165deg,#fdf8ff 0%,#eff6ff 46%,#fff8f1 100%);min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent;position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
input,select{font-family:inherit}
#sgApp::before,#sgApp::after{content:'';position:fixed;border-radius:50%;filter:blur(60px);opacity:.55;pointer-events:none;z-index:0}
#sgApp::before{width:420px;height:420px;background:#ffc4e6;top:-140px;left:-140px;animation:sgF1 16s ease-in-out infinite}
#sgApp::after{width:460px;height:460px;background:#bfe0ff;bottom:-180px;right:-160px;animation:sgF2 20s ease-in-out infinite}
@keyframes sgF1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,50px)}}
@keyframes sgF2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}
.shell{position:relative;z-index:1;max-width:1440px;margin:0 auto;padding:16px 18px 46px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;margin-bottom:18px;background:rgba(255,255,255,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(167,139,250,.22);border-radius:22px;box-shadow:0 16px 40px -26px rgba(88,60,150,.55)}
.brand{display:flex;align-items:center;gap:10px;font-family:'Baloo 2',cursive;font-weight:800;font-size:22px;letter-spacing:.3px}
.brand .logo{font-size:26px;filter:drop-shadow(0 4px 8px rgba(255,111,174,.45))}
.badge{font-size:10px;font-weight:900;letter-spacing:1.4px;padding:4px 9px;border-radius:999px;color:#fff;background:linear-gradient(135deg,#ff6fae,#a78bfa);box-shadow:0 6px 14px -6px rgba(167,139,250,.9)}
.top-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:18px;background:rgba(255,255,255,.9);border:1px solid rgba(167,139,250,.24);box-shadow:0 8px 18px -12px rgba(88,60,150,.6);transition:transform .16s ease}
.icon-btn:hover{transform:translateY(-2px)}
.panel{background:rgba(255,255,255,.82);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(167,139,250,.2);border-radius:24px;box-shadow:0 20px 46px -28px rgba(88,60,150,.62);padding:18px}
.panel-title{margin:0 0 12px;font-family:'Baloo 2',cursive;font-size:15px;font-weight:800;letter-spacing:.4px;color:#6b5b85;display:flex;align-items:center;gap:7px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:16px;font-weight:800;font-size:15px;transition:transform .15s ease,box-shadow .15s ease,opacity .15s;user-select:none}
.btn:active{transform:scale(.97)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-primary{color:#fff;background:linear-gradient(135deg,#ff7ab8 0%,#a78bfa 55%,#7dd3fc 115%);box-shadow:0 14px 26px -12px rgba(167,139,250,.95),inset 0 1px 0 rgba(255,255,255,.35)}
.btn-primary:disabled{box-shadow:none}
.btn-ghost{background:rgba(255,255,255,.85);color:#6b5b85;border:1px solid rgba(167,139,250,.28);box-shadow:0 8px 18px -14px rgba(88,60,150,.7)}
.btn-lg{padding:16px 30px;font-size:17px;border-radius:18px;width:100%}
.btn-roll{width:100%;font-size:16px;padding:14px}
.setup{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.hero{text-align:center;padding:26px 18px 8px}
.hero h1{margin:0 0 8px;font-family:'Baloo 2',cursive;font-size:clamp(28px,5vw,44px);line-height:1.1;background:linear-gradient(120deg,#ff6fae,#a78bfa 48%,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 16px rgba(167,139,250,.25))}
.hero p{margin:0;color:#7a6b93;font-size:15px;font-weight:600;max-width:520px;margin-inline:auto;line-height:1.6}
.hero-emojis{font-size:30px;letter-spacing:10px;margin-bottom:6px}
.field{display:flex;flex-direction:column;gap:10px}
.field > label{font-size:13px;font-weight:800;color:#8a7aa6;letter-spacing:.6px;text-transform:uppercase}
.name-input{width:100%;padding:15px 18px;border-radius:16px;font-size:16px;font-weight:700;color:#3b2b52;background:#fff;border:2px solid rgba(167,139,250,.25);outline:none;transition:border-color .18s,box-shadow .18s}
.name-input:focus{border-color:#a78bfa;box-shadow:0 0 0 4px rgba(167,139,250,.16)}
.play-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
@media (max-width:560px){.play-mode-grid{grid-template-columns:1fr}}
.play-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 12px;border-radius:18px;text-align:center;background:#fff;border:2px solid rgba(167,139,250,.16);transition:all .2s ease;box-shadow:0 8px 20px -18px rgba(88,60,150,.8);cursor:pointer}
.play-card .pc-emoji{font-size:32px;line-height:1}
.play-card b{font-size:14px;font-weight:900;color:#4a3a63}
.play-card small{font-size:11px;color:#9c8fb5;font-weight:700;line-height:1.3}
.play-card.active{border-color:transparent;background:linear-gradient(150deg,#fff0f8,#f2ecff 60%,#eaf6ff);box-shadow:0 16px 30px -18px rgba(167,139,250,.95),inset 0 0 0 2px rgba(167,139,250,.5);transform:translateY(-3px)}
.mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media (max-width:560px){.mode-grid{grid-template-columns:1fr}}
.mode-card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:15px 14px;border-radius:18px;text-align:left;background:#fff;border:2px solid rgba(167,139,250,.16);transition:all .2s ease;box-shadow:0 8px 20px -18px rgba(88,60,150,.8)}
.mode-card .mode-emoji{font-size:24px;line-height:1;margin-bottom:4px}
.mode-card b{font-size:15px;font-weight:900;color:#4a3a63}
.mode-card small{font-size:11.5px;color:#9c8fb5;font-weight:700;line-height:1.35}
.mode-card.active{border-color:transparent;background:linear-gradient(150deg,#fff0f8,#f2ecff 60%,#eaf6ff);box-shadow:0 16px 30px -18px rgba(167,139,250,.95),inset 0 0 0 2px rgba(167,139,250,.5)}
.seg{display:inline-flex;background:#fff;border-radius:16px;padding:5px;gap:4px;border:2px solid rgba(167,139,250,.16);width:fit-content}
.seg button{width:54px;padding:10px 0;border-radius:12px;font-weight:900;font-size:16px;color:#9c8fb5;transition:all .18s ease}
.seg button.active{color:#fff;background:linear-gradient(135deg,#ff7ab8,#a78bfa);box-shadow:0 8px 16px -8px rgba(167,139,250,.95)}

/* =============== PUBLIC ROOMS LIST =============== */
.rooms-head{display:flex;justify-content:space-between;align-items:center;margin:22px 0 10px;font-size:12px;font-weight:900;color:#8a7aa6;letter-spacing:.1em;text-transform:uppercase}
.rooms-head .rooms-refresh{padding:5px 12px;border-radius:8px;background:#f3eeff;color:#a78bfa;font-size:11px;font-weight:900;letter-spacing:.05em;transition:all .15s ease}
.rooms-head .rooms-refresh:active{transform:scale(.94)}
.rooms-list{display:flex;flex-direction:column;gap:10px;max-height:380px;overflow-y:auto;padding-right:2px}
.rooms-list::-webkit-scrollbar{width:6px}
.rooms-list::-webkit-scrollbar-thumb{background:#d9cff0;border-radius:99px}
.room-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:16px;background:#fff;border:2px solid rgba(167,139,250,.18);box-shadow:0 6px 16px -14px rgba(88,60,150,.8);transition:all .15s ease}
.room-item:hover{border-color:rgba(167,139,250,.4)}
.room-item.is-mine{background:linear-gradient(100deg,#f8f3ff,#fff);border-color:#c9b8f0}
.room-item-info{flex:1;min-width:0}
.room-item-host{font-size:14px;font-weight:900;color:#4a3a63;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:6px}
.room-item-mine-tag{font-size:9px;font-weight:900;background:#e0edff;color:#4f8dff;padding:2px 6px;border-radius:5px;letter-spacing:.3px;flex:0 0 auto}
.room-item-meta{font-size:12px;font-weight:700;color:#8a7aa6;margin-top:3px;display:flex;gap:8px;align-items:center}
.room-item-mode{background:#f3eeff;color:#a78bfa;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:900;white-space:nowrap}
.room-item-join{padding:9px 18px;border-radius:12px;font-size:13px;flex:0 0 auto;min-width:72px;background:linear-gradient(135deg,#ff7ab8,#a78bfa);color:#fff;font-weight:900;box-shadow:0 6px 14px -8px rgba(167,139,250,.9);transition:transform .12s ease}
.room-item-join:active{transform:scale(.94)}
.room-item-join:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;background:#c3b8d8}

.waiting-players{display:flex;flex-direction:column;gap:8px;margin:16px 0}
.waiting-player{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:#fff;border:2px solid rgba(167,139,250,.15)}
.waiting-player img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#f0ecfa}
.waiting-player .wp-name{flex:1;font-size:14px;font-weight:900;color:#4a3a63;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waiting-player .wp-host{font-size:10px;font-weight:900;color:#ff7ab8;background:#ffe4f1;padding:3px 8px;border-radius:999px;letter-spacing:.5px;flex:0 0 auto}
.waiting-player .wp-you{font-size:10px;font-weight:900;color:#4f8dff;background:#e0edff;padding:3px 8px;border-radius:999px;letter-spacing:.5px;flex:0 0 auto}
.host-controls{display:flex;flex-direction:column;gap:10px;margin:16px 0}
.host-controls select{width:100%;padding:12px 14px;border-radius:12px;border:2px solid rgba(167,139,250,.25);background:#fff;font-size:14px;font-weight:800;color:#4a3a63;outline:none}
.waiting-actions{display:flex;gap:10px;margin-top:16px}
.waiting-actions .btn{flex:1}

.lb-block{margin-top:6px}
.lb-block h3{margin:0 0 10px;font-family:'Baloo 2',cursive;font-size:16px;font-weight:800;color:#6b5b85;display:flex;align-items:center;gap:8px}
.lb-list{display:flex;flex-direction:column;gap:7px}
.lb-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto auto;gap:10px;align-items:center;padding:11px 14px;border-radius:14px;background:#fff;border:1px solid rgba(167,139,250,.14);font-size:13px;font-weight:700;box-shadow:0 6px 16px -16px rgba(88,60,150,.9)}
.lb-row:nth-child(1){background:linear-gradient(100deg,#fff7e0,#fffdf5);border-color:#f6d98a}
.lb-row:nth-child(2){background:linear-gradient(100deg,#f5f7fb,#fdfdff);border-color:#d8dfeb}
.lb-row:nth-child(3){background:linear-gradient(100deg,#fff2ea,#fffaf6);border-color:#f3cdb2}
.lb-rank{font-size:16px;text-align:center}
.lb-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:900;color:#4a3a63}
.lb-mode{font-size:11px;font-weight:800;color:#a78bfa;background:#f3eeff;padding:3px 8px;border-radius:999px;white-space:nowrap}
.lb-moves{color:#8a7aa6;white-space:nowrap;font-size:12px}
.lb-time{color:#b0a4c7;white-space:nowrap;font-size:12px}
.lb-empty{padding:22px;text-align:center;color:#b0a4c7;font-weight:700;font-size:13.5px;background:#fff;border-radius:16px;border:1px dashed rgba(167,139,250,.3)}
.layout{display:grid;grid-template-columns:242px minmax(0,1fr) 296px;gap:16px;align-items:start}
@media (max-width:1120px){.layout{grid-template-columns:1fr}.col-players{order:3}.col-board{order:1}.col-side{order:2}}
.player-list{display:flex;flex-direction:column;gap:9px}
.pcard{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:18px;background:#fff;border:2px solid rgba(167,139,250,.12);transition:all .25s ease;box-shadow:0 10px 22px -20px rgba(88,60,150,.9);position:relative;overflow:hidden}
.pcard.active{transform:translateX(3px);background:linear-gradient(100deg,var(--soft,#fff),#fff 75%);border-color:var(--c);box-shadow:0 14px 28px -18px var(--c)}
.pav{position:relative;width:44px;height:44px;border-radius:14px;flex:0 0 auto;background:#f7f3ff;display:grid;place-items:center;box-shadow:0 0 0 2.5px var(--c),0 6px 14px -6px rgba(0,0,0,.25);overflow:visible}
.pav img{width:100%;height:100%;border-radius:12px;object-fit:cover;display:block}
.ptag{position:absolute;bottom:-7px;right:-7px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--c);color:#fff;font-size:11px;font-weight:900;display:grid;place-items:center;border:2px solid #fff}
.pinfo{min-width:0;flex:1}
.pname{font-size:13.5px;font-weight:900;color:#4a3a63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pname .you-badge{font-size:9px;font-weight:900;background:#e0edff;color:#4f8dff;padding:2px 6px;border-radius:5px;margin-left:4px}
.bot-tag{font-size:9px;font-weight:900;background:#eef2ff;color:#6366f1;padding:2px 5px;border-radius:5px;vertical-align:middle;margin-left:4px}
.pbar{height:6px;border-radius:999px;background:#f0ecfa;margin-top:6px;overflow:hidden}
.pbar > span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--c),#a78bfa);transition:width .3s ease}
.turn-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.turn-pill{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.9);border:2px solid var(--c,#a78bfa);font-weight:900;font-size:14.5px;color:#4a3a63;box-shadow:0 12px 26px -18px var(--c,#a78bfa);transition:border-color .3s;max-width:100%}
.turn-pill .dot{width:11px;height:11px;border-radius:50%;background:var(--c,#a78bfa);flex:0 0 auto}
.turn-pill .txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.board-shell{padding:12px;border-radius:30px;background:linear-gradient(150deg,rgba(255,255,255,.9),rgba(245,240,255,.8));border:1px solid rgba(167,139,250,.22);box-shadow:0 28px 60px -34px rgba(88,60,150,.75),inset 0 1px 0 rgba(255,255,255,.7)}
.board{position:relative;width:100%;aspect-ratio:1/1;max-width:640px;margin:0 auto;border-radius:22px;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 1px rgba(167,139,250,.15);container-type:inline-size;isolation:isolate}
.cells{position:absolute;inset:0;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr)}
.cell{position:relative;display:flex;align-items:flex-start;justify-content:flex-start;padding:3px 5px;border:0.5px solid rgba(167,139,250,.13);font-size:clamp(7px,2.05cqw,13px);font-weight:800;color:rgba(90,70,120,.42);overflow:hidden}
.cell .mark{position:absolute;right:2px;bottom:1px;font-size:clamp(8px,2.6cqw,15px);line-height:1}
.cell.is-ladder{background-image:linear-gradient(135deg,rgba(251,191,36,.16),transparent 62%)}
.cell.is-snake{background-image:linear-gradient(135deg,rgba(239,68,68,.13),transparent 62%)}
.cell.is-goal{background-image:radial-gradient(circle at 50% 50%,#ffe9a8,rgba(255,233,168,0) 78%)}
.cell.is-start{background-image:radial-gradient(circle at 50% 50%,#c9f2e2,rgba(201,242,226,0) 78%)}
#boardSvg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.tokens{position:absolute;inset:0;z-index:3;pointer-events:none}
.token{position:absolute;width:5.6%;height:5.6%;transform:translate(-50%,-50%);transition:left .19s cubic-bezier(.35,.85,.4,1.15),top .19s cubic-bezier(.35,.85,.4,1.15);border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 2.5px var(--c),0 8px 16px -6px rgba(0,0,0,.42);z-index:20;will-change:left,top}
.token img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.token .tok-emoji{font-size:clamp(10px,3.4cqw,20px);line-height:1}
.token .tok-badge{position:absolute;bottom:-22%;right:-22%;width:46%;height:46%;border-radius:50%;background:var(--c);color:#fff;border:1.5px solid #fff;font-size:clamp(5px,1.5cqw,9px);font-weight:900;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.token.active{animation:tokenBounce 1.1s ease-in-out infinite}
@keyframes tokenBounce{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-58%) scale(1.1)}}
.dice-panel{display:flex;flex-direction:column;align-items:center;gap:14px}
.dice-row{display:flex;gap:16px;justify-content:center;align-items:center;min-height:82px;perspective:800px}
.dice-stage{width:72px;height:72px;perspective:700px;flex:0 0 auto}
.dice-cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.05s cubic-bezier(.22,.9,.28,1)}
.dice-face{position:absolute;inset:0;border-radius:16px;background:linear-gradient(150deg,#fff,#f3edff);box-shadow:inset 0 0 0 2px #e6dcff,inset 0 -7px 14px rgba(167,139,250,.2),0 4px 10px rgba(88,60,150,.1);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:9px}
.pip{width:11px;height:11px;border-radius:50%;align-self:center;justify-self:center;background:radial-gradient(circle at 32% 28%,#b9a3ff,#6d4bd8 78%);box-shadow:inset 0 -1px 2px rgba(0,0,0,.28),0 1px 2px rgba(255,255,255,.6)}
.roll-hint{font-size:12.5px;font-weight:800;color:#a396bd;text-align:center;min-height:18px}
.log{display:flex;flex-direction:column;gap:6px;max-height:290px;overflow-y:auto;padding-right:4px;scrollbar-width:thin;scrollbar-color:#d9cff0 transparent}
.log::-webkit-scrollbar{width:6px}
.log::-webkit-scrollbar-thumb{background:#d9cff0;border-radius:99px}
.log-item{font-size:12.5px;font-weight:700;line-height:1.45;color:#6b5b85;padding:8px 11px;border-radius:11px;background:#fff;border-left:3px solid var(--c,#c9bde8);box-shadow:0 4px 12px -12px rgba(88,60,150,.9);animation:logIn .3s ease}
@keyframes logIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
#fx{position:fixed;inset:0;pointer-events:none;z-index:9000}
.overlay{position:fixed;inset:0;z-index:8000;display:grid;place-items:center;padding:20px;background:rgba(60,40,95,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.win-card{width:min(520px,100%);max-height:92vh;overflow-y:auto;background:linear-gradient(170deg,#fff,#fdf9ff 55%,#f5f9ff);border-radius:30px;padding:28px 24px;border:1px solid rgba(167,139,250,.25);box-shadow:0 40px 90px -30px rgba(60,30,110,.6);text-align:center;animation:popIn .45s cubic-bezier(.2,1.2,.4,1)}
@keyframes popIn{from{opacity:0;transform:scale(.86) translateY(20px)}to{opacity:1;transform:none}}
.win-emoji{font-size:64px;line-height:1;animation:bounce 1.2s ease-in-out infinite}
@keyframes bounce{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-12px) rotate(6deg)}}
.win-card h2{margin:12px 0 6px;font-family:'Baloo 2',cursive;font-size:30px;background:linear-gradient(120deg,#ff6fae,#a78bfa,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
.win-card > p{margin:0 0 18px;color:#8a7aa6;font-weight:700;font-size:14.5px}
.win-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:20px}
.stat{background:#fff;border-radius:16px;padding:13px 8px;border:1px solid rgba(167,139,250,.18)}
.stat b{display:block;font-size:19px;font-family:'Baloo 2',cursive;color:#4a3a63;line-height:1.2}
.stat span{font-size:10.5px;font-weight:800;color:#a396bd;letter-spacing:.5px;text-transform:uppercase}
.win-actions{display:flex;gap:10px;margin-bottom:22px}
.win-actions .btn{flex:1}
.hint-box{font-size:12px;font-weight:700;color:#9c8fb5;line-height:1.6;background:#faf7ff;border:1px dashed rgba(167,139,250,.35);border-radius:14px;padding:12px 14px}
.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);padding:12px 22px;border-radius:999px;background:rgba(59,43,82,.94);color:#fff;font-weight:800;font-size:14px;z-index:9500;opacity:0;pointer-events:none;transition:all .32s cubic-bezier(.2,.9,.3,1.2);box-shadow:0 16px 34px -14px rgba(0,0,0,.6);max-width:88vw;text-align:center}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.sys-empty{padding:22px;text-align:center;color:#b0a4c7;font-weight:700;font-size:13px;background:#faf7ff;border-radius:16px;border:1px dashed rgba(167,139,250,.3)}
`;

  /* ============================ HTML ============================ */
  var GAME_HTML = `
<div id="sgApp">
  <canvas id="fx"></canvas>
  <div class="shell">
    <header class="topbar">
      <div class="brand"><span class="logo">🐍</span><span>Rắn &amp; Thang</span><span class="badge">ONLINE</span></div>
      <div class="top-actions"><button class="icon-btn" id="soundBtn" title="Bật/tắt âm thanh" type="button">🔊</button></div>
    </header>

    <section id="menuScreen" class="setup">
      <div class="panel">
        <div class="hero"><div class="hero-emojis">🪜 🎲 🐍</div><h1>Leo thang, né rắn!</h1><p>Chơi online cùng đồng nghiệp, hoặc đấu bot một mình!</p></div>
        <div class="field" style="margin-top:20px"><label for="playerName">Tên hiển thị của bạn</label><input id="playerName" class="name-input" maxlength="16" placeholder="Nhập tên hiệp sĩ..." autocomplete="off" /></div>
        <div class="field" style="margin-top:18px"><label>Chọn kiểu chơi</label>
          <div class="play-mode-grid" id="playModeGrid">
            <button class="play-card active" data-playmode="online" type="button"><span class="pc-emoji">🌐</span><b>Online</b><small>Tạo/join phòng công khai</small></button>
            <button class="play-card" data-playmode="bot" type="button"><span class="pc-emoji">🤖</span><b>Đấu Bot</b><small>Một mình với bot</small></button>
            <button class="play-card" data-playmode="local" type="button"><span class="pc-emoji">👥</span><b>Cùng máy</b><small>Nhiều người chung máy</small></button>
          </div>
        </div>
        <div style="margin-top:20px"><button class="btn btn-primary btn-lg" id="continueBtn" type="button">Tiếp tục →</button></div>
      </div>
      <div class="panel lb-block"><h3>🏆 Bảng xếp hạng</h3><div class="lb-list" id="leaderboardSetup"><div class="lb-empty">Đang tải...</div></div></div>
    </section>

    <section id="onlineScreen" class="setup" hidden>
      <div class="panel">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:48px;line-height:1;margin-bottom:6px">🌐</div>
          <h2 style="margin:0;font-family:'Baloo 2',cursive;font-size:24px;color:#4a3a63">Chơi Online</h2>
          <p style="margin:8px 0 0;color:#8a7aa6;font-size:13.5px;font-weight:700">Chọn phòng bên dưới hoặc tạo phòng mới</p>
        </div>
        <button class="btn btn-primary btn-lg" id="createRoomBtn" type="button">➕ Tạo phòng mới</button>
        <div class="rooms-head">
          <span>🎮 Phòng đang chờ</span>
          <button class="rooms-refresh" id="refreshRoomsBtn" type="button">↻ Làm mới</button>
        </div>
        <div class="rooms-list" id="roomsList"><div class="sys-empty">Đang tải...</div></div>
        <div style="margin-top:16px;text-align:center"><button class="btn" id="backFromOnlineBtn" type="button" style="font-size:13px;padding:8px 16px;color:#8a7aa6">← Quay lại</button></div>
      </div>
    </section>

    <section id="waitingScreen" class="setup" hidden>
      <div class="panel">
        <h2 style="margin:0 0 4px;font-family:'Baloo 2',cursive;font-size:22px;color:#4a3a63;text-align:center">🚪 Phòng chờ</h2>
        <p style="margin:0;text-align:center;color:#8a7aa6;font-size:13px;font-weight:700">Chờ mọi người vào rồi bấm bắt đầu</p>
        <div style="font-size:12px;font-weight:900;color:#8a7aa6;letter-spacing:.1em;text-transform:uppercase;margin:16px 0 8px">👥 Người chơi (<span id="waitingCount">0</span>/4)</div>
        <div class="waiting-players" id="waitingPlayers"></div>
        <div class="host-controls" id="hostControls">
          <div style="font-size:12px;font-weight:900;color:#8a7aa6;letter-spacing:.1em;text-transform:uppercase">Chọn chế độ</div>
          <select id="hostModeSelect"><option value="classic">🎲 Cổ điển (1 xúc xắc)</option><option value="speed">⚡ Tốc độ (2 xúc xắc)</option><option value="chaos">🌪️ Hỗn loạn (sự kiện)</option></select>
          <button class="btn btn-primary btn-lg" id="hostStartBtn" type="button" disabled>⏳ Cần ít nhất 2 người</button>
        </div>
        <div class="waiting-actions"><button class="btn btn-ghost" id="leaveRoomBtn" type="button">🚪 Rời phòng</button></div>
      </div>
    </section>

    <section id="localSetupScreen" class="setup" hidden>
      <div class="panel">
        <div style="text-align:center;margin-bottom:16px"><div style="font-size:48px;line-height:1;margin-bottom:6px" id="localSetupEmoji">🤖</div><h2 style="margin:0;font-family:'Baloo 2',cursive;font-size:22px;color:#4a3a63" id="localSetupTitle">Đấu với Bot</h2></div>
        <div class="field"><label>Chế độ chơi</label>
          <div class="mode-grid" id="modeGrid">
            <button class="mode-card active" data-mode="classic" type="button"><span class="mode-emoji">🎲</span><b>Cổ điển</b><small>1 xúc xắc</small></button>
            <button class="mode-card" data-mode="speed" type="button"><span class="mode-emoji">⚡</span><b>Tốc độ</b><small>2 xúc xắc</small></button>
            <button class="mode-card" data-mode="chaos" type="button"><span class="mode-emoji">🌪️</span><b>Hỗn loạn</b><small>Sự kiện</small></button>
          </div>
        </div>
        <div class="field" style="margin-top:18px"><label>Số người chơi</label><div class="seg" id="countSeg"><button data-count="2" class="active" type="button">2</button><button data-count="3" type="button">3</button><button data-count="4" type="button">4</button></div></div>
        <div style="margin-top:20px"><button class="btn btn-primary btn-lg" id="startLocalBtn" type="button">Bắt đầu chơi 🚀</button></div>
        <div style="margin-top:14px;text-align:center"><button class="btn" id="backFromLocalBtn" type="button" style="font-size:13px;padding:8px 16px;color:#8a7aa6">← Quay lại</button></div>
        <div class="hint-box" style="margin-top:16px">💡 <b>Luật chơi:</b> Rơi vào <b>chân thang 🪜</b> → leo lên. Rơi vào <b>đầu rắn 🐍</b> → tuột xuống. Ai tới hoặc vượt ô <b>100</b> trước sẽ thắng!</div>
      </div>
    </section>

    <section id="gameScreen" hidden>
      <div class="layout">
        <aside class="panel col-players"><h3 class="panel-title">👥 Người chơi</h3><div class="player-list" id="playerList"></div></aside>
        <main class="col-board">
          <div class="turn-bar">
            <div class="turn-pill" id="turnPill"><span class="dot"></span><span class="txt">Sẵn sàng...</span></div>
            <button class="btn btn-ghost" id="quitBtn" style="padding:9px 16px;font-size:13px" type="button">Thoát</button>
          </div>
          <div class="board-shell">
            <div class="board" id="board">
              <svg id="boardSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
              <div class="cells" id="cells"></div>
              <div class="tokens" id="tokens"></div>
            </div>
          </div>
        </main>
        <aside class="col-side" style="display:flex;flex-direction:column;gap:14px">
          <div class="panel dice-panel">
            <div class="dice-row" id="diceRow"><div class="dice-stage"><div class="dice-cube" id="diceCube0"></div></div><div class="dice-stage" id="diceStage1"><div class="dice-cube" id="diceCube1"></div></div></div>
            <button class="btn btn-primary btn-roll" id="rollBtn" type="button">🎲 Tung xúc xắc</button>
            <div class="roll-hint" id="rollHint">Nhấn để tung!</div>
          </div>
          <div class="panel"><h3 class="panel-title">📜 Nhật ký</h3><div class="log" id="log"></div></div>
        </aside>
      </div>
    </section>
  </div>

  <div class="overlay" id="winOverlay" hidden>
    <div class="win-card">
      <div class="win-emoji" id="winEmoji">🏆</div>
      <h2 id="winTitle">Chiến thắng!</h2>
      <p id="winSub">Chúc mừng!</p>
      <div class="win-stats"><div class="stat"><b id="statMoves">0</b><span>Lượt</span></div><div class="stat"><b id="statTime">0:00</b><span>Thời gian</span></div><div class="stat"><b id="statMode">—</b><span>Chế độ</span></div></div>
      <div class="win-actions"><button class="btn btn-primary" id="playAgainBtn" type="button">Về sảnh 🏠</button></div>
      <div class="lb-block"><h3>🏆 Bảng xếp hạng</h3><div class="lb-list" id="leaderboardWin"></div></div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
</div>
`;

  /* ============================ Shadow host ============================ */
  var host = document.createElement('div');
  host.id = 'snakeGameHost';
  host.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;';
  var shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>' + GAME_CSS + '</style>' + GAME_HTML;
  document.body.appendChild(host);

  var closeBtn = document.createElement('button');
  closeBtn.id = 'snakeGameClose';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Đóng game');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:9600;width:44px;height:44px;border-radius:50%;background:rgba(59,43,82,.72);color:#fff;font-size:22px;font-weight:700;display:none;place-items:center;border:1px solid rgba(255,255,255,.25);box-shadow:0 6px 18px -6px rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:pointer;padding:0;line-height:1;font-family:system-ui,-apple-system,sans-serif';
  document.body.appendChild(closeBtn);

  /* ============================ Helpers ============================ */
  var $ = function (id) { return shadow.getElementById(id); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function vibrate(pat) { try { if (navigator.vibrate) navigator.vibrate(pat); } catch (e) {} }
  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ============================ Supabase ============================ */
  var FALLBACK = {
    SUPABASE_URL: 'https://tumjcsaexddioecwjolp.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ'
  };
  var CFG = (typeof window !== 'undefined' && window.__SRANK_CONFIG) || FALLBACK;
  var LB_TABLE = 'snake_ladder_scores';
  var LS_KEY = 'srank_snake_ladder_scores';
  var ROOMS_T = 'snake_rooms';
  var ROOM_PLAYERS_T = 'snake_room_players';

  var sb = null;
  try {
    if (window.supabase && CFG.SUPABASE_URL && CFG.SUPABASE_KEY) {
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
  } catch (e) { console.warn('[SB] init failed:', e); }

  /* ============================ Geometry ============================ */
  var LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
  var SNAKES  = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
  function posToXY(pos) {
    var idx = pos - 1;
    var rowFromBottom = Math.floor(idx / 10);
    var c0 = idx % 10;
    var col = (rowFromBottom % 2 === 0) ? c0 : 9 - c0;
    var rowTop = 9 - rowFromBottom;
    return { x: col * 10 + 5, y: rowTop * 10 + 5, col: col, rowTop: rowTop };
  }

  /* ============================ SVG art ============================ */
  function ladderArt(a, b) {
    var A = posToXY(a), B = posToXY(b);
    var dx = B.x - A.x, dy = B.y - A.y;
    var len = Math.hypot(dx, dy) || 1;
    var px = -dy / len, py = dx / len, w = 1.7;
    var a1 = [A.x + px * w, A.y + py * w], a2 = [A.x - px * w, A.y - py * w];
    var b1 = [B.x + px * w, B.y + py * w], b2 = [B.x - px * w, B.y - py * w];
    var s = '<g stroke="#f0b429" stroke-linecap="round" opacity="0.95">';
    s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + b1[0] + '" y2="' + b1[1] + '" stroke-width="1.15"/>';
    s += '<line x1="' + a2[0] + '" y1="' + a2[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" stroke-width="1.15"/>';
    var n = Math.max(2, Math.round(len / 7));
    for (var i = 1; i < n; i++) {
      var t = i / n;
      s += '<line x1="' + (a1[0] + (b1[0] - a1[0]) * t) + '" y1="' + (a1[1] + (b1[1] - a1[1]) * t) + '" x2="' + (a2[0] + (b2[0] - a2[0]) * t) + '" y2="' + (a2[1] + (b2[1] - a2[1]) * t) + '" stroke-width="0.85" stroke="#fbd97a"/>';
    }
    s += '</g>';
    return s;
  }
  var SNAKE_COLORS = ['#7c5cff','#22c98a','#ff5fa2','#f6a723','#38bdf8','#f97316','#a855f7','#14b8a6','#ef4444','#8b5cf6'];
  function snakeArt(headPos, tailPos, idx) {
    var H = posToXY(headPos), T = posToXY(tailPos);
    var mx = (H.x + T.x) / 2, my = (H.y + T.y) / 2;
    var dx = T.x - H.x, dy = T.y - H.y;
    var len = Math.hypot(dx, dy) || 1;
    var off = Math.min(17, len * 0.42) * (idx % 2 ? 1 : -1);
    var cx = mx + (-dy / len) * off, cy = my + (dx / len) * off;
    var color = SNAKE_COLORS[idx % SNAKE_COLORS.length];
    var hdx = H.x - cx, hdy = H.y - cy, hl = Math.hypot(hdx, hdy) || 1;
    var ux = hdx / hl, uy = hdy / hl, ex = -uy, ey = ux;
    var d = 'M ' + H.x + ' ' + H.y + ' Q ' + cx + ' ' + cy + ' ' + T.x + ' ' + T.y;
    var s = '<g>';
    s += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.7" stroke-linecap="round" opacity="0.9"/>';
    s += '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="0.75" stroke-linecap="round" stroke-dasharray="1.3 1.9" opacity="0.6"/>';
    s += '<circle cx="' + T.x + '" cy="' + T.y + '" r="1.05" fill="' + color + '"/>';
    s += '<circle cx="' + H.x + '" cy="' + H.y + '" r="2.5" fill="' + color + '"/>';
    s += '<circle cx="' + H.x + '" cy="' + H.y + '" r="2.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="0.4"/>';
    var hx1 = H.x + ex * 1.05 + ux * 0.55, hy1 = H.y + ey * 1.05 + uy * 0.55;
    var hx2 = H.x - ex * 1.05 + ux * 0.55, hy2 = H.y - ey * 1.05 + uy * 0.55;
    s += '<circle cx="' + hx1 + '" cy="' + hy1 + '" r="0.62" fill="#fff"/>';
    s += '<circle cx="' + hx2 + '" cy="' + hy2 + '" r="0.62" fill="#fff"/>';
    s += '<circle cx="' + (hx1 + ux * 0.16) + '" cy="' + (hy1 + uy * 0.16) + '" r="0.31" fill="#241242"/>';
    s += '<circle cx="' + (hx2 + ux * 0.16) + '" cy="' + (hy2 + uy * 0.16) + '" r="0.31" fill="#241242"/>';
    s += '<line x1="' + (H.x + ux * 2.4) + '" y1="' + (H.y + uy * 2.4) + '" x2="' + (H.x + ux * 3.5 + ex * 0.6) + '" y2="' + (H.y + uy * 3.5 + ey * 0.6) + '" stroke="#ff3b6b" stroke-width="0.45" stroke-linecap="round"/>';
    s += '<line x1="' + (H.x + ux * 2.4) + '" y1="' + (H.y + uy * 2.4) + '" x2="' + (H.x + ux * 3.5 - ex * 0.6) + '" y2="' + (H.y + uy * 3.5 - ey * 0.6) + '" stroke="#ff3b6b" stroke-width="0.45" stroke-linecap="round"/>';
    s += '</g>';
    return s;
  }

  /* ============================ Sound ============================ */
  var actx = null, soundOn = true;
  function ac() {
    if (!soundOn) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function beep(freq, dur, type, vol, delay) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  var SFX = {
    tick: function () { beep(680 + rnd(160), 0.055, 'square', 0.025); },
    roll: function () { for (var i = 0; i < 6; i++) beep(320 + i * 90, 0.06, 'triangle', 0.03, i * 0.07); },
    ladder: function () { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.16, 'sine', 0.055, i * 0.075); }); },
    snake:  function () { [700, 560, 440, 330].forEach(function (f, i) { beep(f, 0.16, 'sawtooth', 0.045, i * 0.08); }); },
    win:    function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, 0.32, 'sine', 0.06, i * 0.11); }); }
  };

  /* ============================ Dice 3D ============================ */
  var PIP_MAP = { 1:[[2,2]], 2:[[1,1],[3,3]], 3:[[1,1],[2,2],[3,3]], 4:[[1,1],[1,3],[3,1],[3,3]], 5:[[1,1],[1,3],[2,2],[3,1],[3,3]], 6:[[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]] };
  var FACE_TF = { 1:'translateZ(36px)', 2:'rotateY(90deg) translateZ(36px)', 3:'rotateX(90deg) translateZ(36px)', 4:'rotateX(-90deg) translateZ(36px)', 5:'rotateY(-90deg) translateZ(36px)', 6:'rotateY(180deg) translateZ(36px)' };
  var FACE_ROT = { 1:[0,0], 2:[0,-90], 3:[-90,0], 4:[90,0], 5:[0,90], 6:[0,180] };
  function makeDice(el) {
    el.innerHTML = '';
    for (var f = 1; f <= 6; f++) {
      var face = document.createElement('div');
      face.className = 'dice-face';
      face.style.transform = FACE_TF[f];
      PIP_MAP[f].forEach(function (rc) {
        var pip = document.createElement('i');
        pip.className = 'pip';
        pip.style.gridRow = String(rc[0]);
        pip.style.gridColumn = String(rc[1]);
        face.appendChild(pip);
      });
      el.appendChild(face);
    }
    var spinX = 0, spinY = 0;
    return {
      show: function (n, instant) {
        var rx = FACE_ROT[n][0], ry = FACE_ROT[n][1];
        if (instant) {
          el.style.transition = 'none';
          el.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
          spinX = rx; spinY = ry;
          void el.offsetWidth;
          el.style.transition = '';
          return;
        }
        spinX += 360 * (2 + rnd(3));
        spinY += 360 * (2 + rnd(3));
        var fx = Math.round((spinX - rx) / 360) * 360 + rx;
        var fy = Math.round((spinY - ry) / 360) * 360 + ry;
        spinX = fx; spinY = fy;
        el.style.transform = 'rotateX(' + fx + 'deg) rotateY(' + fy + 'deg)';
      }
    };
  }

  /* ============================ State ============================ */
  var PLAYER_STYLES = [
    { color: '#ff5fa2', soft: '#ffe4f1' },
    { color: '#4f8dff', soft: '#e0edff' },
    { color: '#18c08a', soft: '#dcf9ee' },
    { color: '#f6a723', soft: '#ffefd4' }
  ];
  var BOT_NAMES = ['Mèo Bông', 'Gấu Mật', 'Thỏ Ngọc'];

  var state = {
    playMode: 'online', mode: 'classic', count: 2,
    players: [], current: 0, busy: false, over: false, moves: 0, startTime: 0
  };
  var dice0 = null, dice1 = null;

  var room = null;
  var roomPlayers = [];
  var roomChannel = null;
  var roomsChannel = null;
  var myUsername = '';
  var myProfile = null;
  var isHost = false;
  var animating = {};
  var refreshTimer = null;
  var roomsRefreshTimer = null;
  var pendingWin = null;
  var wasMyTurn = false;
  var busyTimeout = null;

  function avatarUrl(seed) {
    return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(seed) +
      '&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4,d1d4f9&radius=14';
  }
  function getCurrentUsername() {
    try {
      var keys = ['srank_username', 'srank_user', 'auth_username', 'username'];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v) {
          try { var o = JSON.parse(v); return o.username || o.name || v; } catch (_) { return v; }
        }
      }
      if (window.SRANK_STATE && window.SRANK_STATE.currentUser) {
        return window.SRANK_STATE.currentUser.username || window.SRANK_STATE.currentUser.name || '';
      }
      var el = document.getElementById('logoutName');
      if (el && el.textContent.trim()) return el.textContent.trim();
    } catch (e) {}
    return '';
  }
  function genRoomCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 6; i++) s += chars[rnd(chars.length)];
    return s;
  }

  /* ============================ Load profile ============================ */
  async function loadMyProfile() {
    myUsername = getCurrentUsername();
    if (!myUsername) myUsername = 'guest_' + rnd(999999);
    if (!sb) {
      myProfile = { username: myUsername, display_name: myUsername, avatar_url: avatarUrl(myUsername) };
      return;
    }
    try {
      var res = await sb.from('public_players').select('*').eq('username', myUsername).maybeSingle();
      if (res.data) {
        myProfile = {
          username: res.data.username,
          display_name: res.data.display_name || res.data.username,
          avatar_url: res.data.avatar_url || avatarUrl(res.data.username)
        };
      } else {
        myProfile = { username: myUsername, display_name: myUsername, avatar_url: avatarUrl(myUsername) };
      }
    } catch (e) {
      myProfile = { username: myUsername, display_name: myUsername, avatar_url: avatarUrl(myUsername) };
    }
  }

  /* ============================ Board ============================ */
  var PASTELS = ['hsl(330 90% 97%)','hsl(280 90% 97%)','hsl(215 90% 97%)','hsl(165 80% 96%)','hsl(45 95% 96%)','hsl(15 95% 97%)','hsl(255 90% 97%)','hsl(190 85% 96%)','hsl(345 90% 97%)','hsl(225 90% 97%)'];
  function buildBoard() {
    var cellsEl = $('cells');
    cellsEl.innerHTML = '';
    for (var pos = 1; pos <= 100; pos++) {
      var g = posToXY(pos);
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.gridColumn = String(g.col + 1);
      cell.style.gridRow = String(g.rowTop + 1);
      cell.style.background = PASTELS[g.rowTop % PASTELS.length];
      cell.textContent = pos;
      var mark = '';
      if (pos === 1) { mark = '🏁'; cell.classList.add('is-start'); }
      else if (pos === 100) { mark = '🏆'; cell.classList.add('is-goal'); }
      else if (LADDERS[pos]) { mark = '🪜'; cell.classList.add('is-ladder'); }
      else if (SNAKES[pos]) { mark = '🐍'; cell.classList.add('is-snake'); }
      if (mark) {
        var m = document.createElement('span');
        m.className = 'mark';
        m.textContent = mark;
        cell.appendChild(m);
      }
      cellsEl.appendChild(cell);
    }
    var svg = $('boardSvg');
    var html = '';
    Object.keys(LADDERS).forEach(function (k) { html += ladderArt(+k, LADDERS[k]); });
    var i = 0;
    Object.keys(SNAKES).forEach(function (k) { html += snakeArt(+k, SNAKES[k], i++); });
    svg.innerHTML = html;
  }

  /* ============================ Player cards ============================ */
  function renderPlayers() {
    var el = $('playerList');
    el.innerHTML = '';
    state.players.forEach(function (p, i) {
      var card = document.createElement('div');
      card.className = 'pcard' + (i === state.current ? ' active' : '');
      card.style.setProperty('--c', p.color);
      card.style.setProperty('--soft', p.soft);
      var pav = document.createElement('div');
      pav.className = 'pav';
      var img = document.createElement('img');
      img.src = p.avatar; img.alt = p.name;
      img.onerror = function () { this.replaceWith(Object.assign(document.createElement('span'), { className: 'av-emoji', textContent: '🐱' })); };
      pav.appendChild(img);
      var tag = document.createElement('span');
      tag.className = 'ptag'; tag.textContent = p.pos;
      pav.appendChild(tag);
      var info = document.createElement('div');
      info.className = 'pinfo';
      var nm = document.createElement('div');
      nm.className = 'pname';
      var extra = '';
      if (p.username === myUsername) extra = '<span class="you-badge">BẠN</span>';
      else if (p.bot) extra = '<span class="bot-tag">BOT</span>';
      nm.innerHTML = escapeHtml(p.name) + extra;
      var bar = document.createElement('div');
      bar.className = 'pbar';
      var fill = document.createElement('span');
      fill.style.width = p.pos + '%';
      bar.appendChild(fill);
      info.appendChild(nm); info.appendChild(bar);
      card.appendChild(pav); card.appendChild(info);
      el.appendChild(card);
      p.cardEl = card; p.posEl = tag; p.barEl = fill;
    });
  }
  function syncPlayerCards() {
    state.players.forEach(function (p) {
      if (p.posEl) p.posEl.textContent = p.pos;
      if (p.barEl) p.barEl.style.width = Math.min(100, p.pos) + '%';
      if (p.cardEl) p.cardEl.classList.toggle('active', p === state.players[state.current]);
    });
  }
  function updateTurnPill() {
    var pill = $('turnPill');
    var p = state.players[state.current];
    if (!p) return;
    pill.style.setProperty('--c', p.color);
    var isMyTurn = (p.username === myUsername && state.playMode === 'online');
    var prefix = isMyTurn ? '👉 LƯỢT BẠN! · ' : 'Lượt của ';
    pill.querySelector('.txt').textContent = state.over ? 'Kết thúc' : (prefix + p.name);
  }

  /* ============================ Tokens ============================ */
  function createTokens() {
    var el = $('tokens');
    el.innerHTML = '';
    state.players.forEach(function (p) {
      var node = document.createElement('div');
      node.className = 'token';
      node.style.setProperty('--c', p.color);
      var img = document.createElement('img');
      img.src = p.avatar; img.alt = p.name;
      img.onerror = function () { this.replaceWith(Object.assign(document.createElement('span'), { className: 'tok-emoji', textContent: '🐱' })); };
      node.appendChild(img);
      var badge = document.createElement('span');
      badge.className = 'tok-badge';
      badge.textContent = String(p.id + 1);
      node.appendChild(badge);
      el.appendChild(node);
      p.el = node;
    });
  }
  function positionTokens() {
    if (!state.players.length) return;
    var groups = {};
    state.players.forEach(function (p) { (groups[p.pos] = groups[p.pos] || []).push(p); });
    Object.keys(groups).forEach(function (posStr) {
      var pos = +posStr;
      var g = posToXY(Math.max(1, Math.min(100, pos)));
      var list = groups[posStr];
      var n = list.length;
      list.forEach(function (p, i) {
        if (!p.el) return;
        var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        var r = n > 1 ? 2.3 : 0;
        p.el.style.left = (g.x + Math.cos(ang) * r) + '%';
        p.el.style.top = (g.y + Math.sin(ang) * r) + '%';
        p.el.style.zIndex = (p === state.players[state.current]) ? 60 : 20;
        p.el.classList.toggle('active', p === state.players[state.current] && !state.over);
      });
    });
    syncPlayerCards();
  }

  /* ============================ Log ============================ */
  var renderedLogTs = {};
  function addLogItem(item) {
    if (renderedLogTs[item.ts]) return;
    renderedLogTs[item.ts] = true;
    var el = $('log');
    var div = document.createElement('div');
    div.className = 'log-item';
    if (item.color) div.style.setProperty('--c', item.color);
    div.textContent = item.text;
    el.prepend(div);
    while (el.children.length > 40) el.removeChild(el.lastChild);
  }
  function renderLogFromState(logArr) {
    if (!logArr || !logArr.length) return;
    var sorted = logArr.slice().sort(function (a, b) { return a.ts - b.ts; });
    sorted.forEach(function (item) { addLogItem(item); });
  }

  /* ============================ Leaderboard ============================ */
  function localScores() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  async function fetchLeaderboard() {
    if (sb) {
      try {
        var res = await sb.from(LB_TABLE).select('player_name,mode,moves,duration_ms').order('moves', { ascending: true }).order('duration_ms', { ascending: true }).limit(10);
        if (res.error) throw res.error;
        if (res.data && res.data.length) return res.data;
        return [];
      } catch (e) {}
    }
    var local = localScores();
    local.sort(function (a, b) { return a.moves - b.moves || a.duration_ms - b.duration_ms; });
    return local.slice(0, 10);
  }
  function renderLeaderboard(elId, rows) {
    var el = $(elId);
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = '<div class="lb-empty">Chưa có ai trên bảng vàng. Hãy là người đầu tiên! ✨</div>';
      return;
    }
    var modeNames = { classic: 'Cổ điển', speed: 'Tốc độ', chaos: 'Hỗn loạn' };
    el.innerHTML = rows.map(function (r, i) {
      var medal = ['🥇','🥈','🥉'][i] || ('#' + (i + 1));
      var secs = Math.max(1, Math.round((r.duration_ms || 0) / 1000));
      return '<div class="lb-row"><span class="lb-rank">' + medal + '</span><span class="lb-name">' + escapeHtml(r.player_name) + '</span><span class="lb-mode">' + (modeNames[r.mode] || escapeHtml(r.mode || '—')) + '</span><span class="lb-moves">' + (r.moves || 0) + ' lượt</span><span class="lb-time">' + fmtTime(secs) + '</span></div>';
    }).join('');
  }
  async function refreshLeaderboards() {
    var rows = await fetchLeaderboard();
    renderLeaderboard('leaderboardSetup', rows);
    renderLeaderboard('leaderboardWin', rows);
  }
  async function saveScore(payload) {
    if (sb) {
      try {
        var res = await sb.from(LB_TABLE).insert([payload]);
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn('[LB] save failed:', e.message || e); }
    }
    try {
      var arr = localScores();
      arr.push(Object.assign({}, payload, { created_at: new Date().toISOString() }));
      arr.sort(function (a, b) { return a.moves - b.moves; });
      localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, 60)));
      return true;
    } catch (e) { return false; }
  }

  /* ============================ Public rooms list ============================ */
  function scheduleRoomsRefresh() {
    if (roomsRefreshTimer) clearTimeout(roomsRefreshTimer);
    roomsRefreshTimer = setTimeout(function () {
      roomsRefreshTimer = null;
      refreshRoomsList();
    }, 100);
  }

  async function refreshRoomsList() {
    if (!sb) return;
    var el = $('roomsList');
    if (!el || !$('onlineScreen') || $('onlineScreen').hidden) return;

    var since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    var r;
    try {
      r = await sb.from(ROOMS_T).select('*').eq('status', 'waiting').gt('created_at', since).order('created_at', { ascending: false }).limit(30);
    } catch (e) { return; }
    if (r.error) { el.innerHTML = '<div class="sys-empty">Lỗi tải phòng</div>'; return; }

    var rooms = r.data || [];
    if (!rooms.length) {
      el.innerHTML = '<div class="sys-empty">Chưa có phòng nào. Hãy tạo phòng mới! 🎉</div>';
      return;
    }

    // Fetch player counts + host names for those rooms
    var ids = rooms.map(function (x) { return x.id; });
    var counts = {};
    var hostNames = {};
    try {
      var p = await sb.from(ROOM_PLAYERS_T).select('room_id,display_name,is_host').in('room_id', ids);
      if (p.data) p.data.forEach(function (row) {
        counts[row.room_id] = (counts[row.room_id] || 0) + 1;
        if (row.is_host) hostNames[row.room_id] = row.display_name;
      });
    } catch (e) {}

    var modeLabels = { classic: 'Cổ điển', speed: 'Tốc độ', chaos: 'Hỗn loạn' };
    el.innerHTML = rooms.map(function (r) {
      var count = counts[r.id] || 1;
      var host = hostNames[r.id] || r.host_username;
      var mine = r.host_username === myUsername;
      var full = count >= r.max_players;
      var mode = modeLabels[r.mode] || r.mode;
      var joinLabel = mine ? 'Của bạn' : (full ? 'Đầy' : 'Vào');
      var disabled = mine || full;
      return '<div class="room-item' + (mine ? ' is-mine' : '') + '">' +
        '<div class="room-item-info">' +
          '<div class="room-item-host">🐱 ' + escapeHtml(host) + (mine ? '<span class="room-item-mine-tag">CỦA BẠN</span>' : '') + '</div>' +
          '<div class="room-item-meta"><span class="room-item-mode">' + escapeHtml(mode) + '</span><span>' + count + '/' + r.max_players + ' người</span></div>' +
        '</div>' +
        '<button class="room-item-join" data-room-id="' + r.id + '" type="button"' + (disabled ? ' disabled' : '') + '>' + joinLabel + '</button>' +
      '</div>';
    }).join('');
  }

  function subscribeRoomsList() {
    if (!sb || roomsChannel) return;
    try {
      roomsChannel = sb.channel('rooms-list')
        .on('postgres_changes', { event: '*', schema: 'public', table: ROOMS_T }, scheduleRoomsRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: ROOM_PLAYERS_T }, scheduleRoomsRefresh)
        .subscribe();
    } catch (e) { console.warn('[rooms] subscribe failed:', e); }
  }
  function unsubscribeRoomsList() {
    if (roomsChannel) {
      try { sb.removeChannel(roomsChannel); } catch (e) {}
      roomsChannel = null;
    }
    if (roomsRefreshTimer) { clearTimeout(roomsRefreshTimer); roomsRefreshTimer = null; }
  }

  async function enterOnlineScreen() {
    if (room) {
      try { await Promise.race([leaveRoom(), sleep(2000)]); } catch (e) {}
    }
    showScreen('onlineScreen');
    refreshRoomsList();
    subscribeRoomsList();
  }

  /* ============================ Create / Join / Leave ============================ */
  async function createRoom() {
    if (!sb) { toast('Chưa kết nối Supabase'); return; }
    if (room) { toast('Bạn đang ở trong phòng khác'); return; }
    var displayName = ($('playerName').value || '').trim().slice(0, 16) || myProfile.display_name;
    try { localStorage.setItem('srank_player_name', displayName); } catch (e) {}

    // Retry on unique code collision
    var created = null;
    for (var attempt = 0; attempt < 5 && !created; attempt++) {
      var ins = await sb.from(ROOMS_T).insert([{
        code: genRoomCode(), host_username: myUsername,
        mode: 'classic', status: 'waiting', max_players: 4, state: {}, version: 0
      }]).select().single();
      if (!ins.error) { created = ins.data; break; }
      if (ins.error.code !== '23505') { toast('Lỗi tạo phòng: ' + (ins.error.message || ins.error.code)); return; }
    }
    if (!created) { toast('Không tạo được phòng, thử lại sau'); return; }
    room = created;
    isHost = true;

    var pIns = await sb.from(ROOM_PLAYERS_T).insert([{
      room_id: room.id, username: myUsername, display_name: displayName,
      avatar_url: myProfile.avatar_url, color_index: 0, pos: 0, is_host: true
    }]).select().single();
    if (pIns.error) {
      await sb.from(ROOMS_T).delete().eq('id', room.id);
      toast('Lỗi vào phòng: ' + (pIns.error.message || pIns.error.code));
      room = null;
      return;
    }

    renderedLogTs = {}; animating = {}; pendingWin = null;
    unsubscribeRoomsList();
    enterWaitingRoom();
    subscribeRoom();
  }

  async function joinRoomById(roomId) {
    if (!sb) { toast('Chưa kết nối Supabase'); return; }
    if (room) { toast('Bạn đang ở trong phòng khác'); return; }

    var rRes = await sb.from(ROOMS_T).select('*').eq('id', roomId).eq('status', 'waiting').maybeSingle();
    if (rRes.error || !rRes.data) { toast('Phòng không tồn tại hoặc đã bắt đầu'); refreshRoomsList(); return; }
    var targetRoom = rRes.data;

    var cnt = await sb.from(ROOM_PLAYERS_T).select('id', { count: 'exact', head: true }).eq('room_id', targetRoom.id);
    if ((cnt.count || 0) >= targetRoom.max_players) { toast('Phòng đã đầy'); refreshRoomsList(); return; }

    // Check not already in
    var exist = await sb.from(ROOM_PLAYERS_T).select('id').eq('room_id', targetRoom.id).eq('username', myUsername).maybeSingle();
    if (!exist.data) {
      var displayName = ($('playerName').value || '').trim().slice(0, 16) || myProfile.display_name;
      var pIns = await sb.from(ROOM_PLAYERS_T).insert([{
        room_id: targetRoom.id, username: myUsername, display_name: displayName,
        avatar_url: myProfile.avatar_url, color_index: (cnt.count || 0), pos: 0, is_host: false
      }]).select().single();
      if (pIns.error) { toast('Lỗi vào phòng: ' + (pIns.error.message || pIns.error.code)); refreshRoomsList(); return; }

      // Race check: if room became full, back out
      var after = await sb.from(ROOM_PLAYERS_T).select('id', { count: 'exact', head: true }).eq('room_id', targetRoom.id);
      if ((after.count || 0) > targetRoom.max_players) {
        await sb.from(ROOM_PLAYERS_T).delete().eq('room_id', targetRoom.id).eq('username', myUsername);
        toast('Phòng vừa đầy, thử phòng khác');
        refreshRoomsList();
        return;
      }
    }

    room = targetRoom;
    isHost = (targetRoom.host_username === myUsername);
    renderedLogTs = {}; animating = {}; pendingWin = null;
    unsubscribeRoomsList();
    enterWaitingRoom();
    subscribeRoom();
  }

  async function leaveRoom() {
    if (!room) return;
    var old = room;
    room = null;
    roomPlayers = [];
    isHost = false;
    pendingWin = null;
    animating = {};
    renderedLogTs = {};
    if (busyTimeout) { clearTimeout(busyTimeout); busyTimeout = null; }
    state.busy = false;

    try { if (roomChannel) { await sb.removeChannel(roomChannel); roomChannel = null; } } catch (e) {}
    try {
      await sb.from(ROOM_PLAYERS_T).delete().eq('room_id', old.id).eq('username', myUsername);
      if (old.host_username === myUsername) {
        await sb.from(ROOMS_T).delete().eq('id', old.id);
      }
    } catch (e) {}
    refreshLeaderboards();
  }

  /* ============================ Realtime ============================ */
  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      refreshRoomPlayers();
    }, 80);
  }

  async function refreshRoomPlayers() {
    if (!room) return;
    try {
      var res = await sb.from(ROOM_PLAYERS_T).select('*').eq('room_id', room.id).order('joined_at', { ascending: true });
      if (!res.data) return;
      roomPlayers = res.data;
      renderWaitingPlayers();
      if (room && (room.status === 'playing' || room.status === 'finished')) {
        rebuildPlayersFromRoom();
        syncTurnUI();
      }
    } catch (e) { console.warn('[room] refresh failed:', e); }
  }

  function subscribeRoom() {
    if (!room || !sb) return;
    if (roomChannel) { try { sb.removeChannel(roomChannel); } catch (e) {} }
    var roomId = room.id;

    roomChannel = sb.channel('room:' + roomId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: ROOMS_T, filter: 'id=eq.' + roomId }, function (payload) {
        if (!room || room.id !== roomId) return;
        var oldRoom = room;
        room = payload.new;
        handleRoomUpdate(oldRoom, payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: ROOMS_T, filter: 'id=eq.' + roomId }, function () {
        // If win overlay shown, don't disrupt — user can manually leave
        if (!$('winOverlay').hidden) return;
        toast('Phòng đã đóng');
        room = null; roomPlayers = [];
        showScreen('menuScreen');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: ROOM_PLAYERS_T, filter: 'room_id=eq.' + roomId }, function () {
        scheduleRefresh();
      })
      .subscribe();

    refreshRoomPlayers();
  }

  function handleRoomUpdate(oldRoom, newRoom) {
    // Waiting → Playing
    if (oldRoom.status === 'waiting' && newRoom.status === 'playing') {
      refreshRoomPlayers().then(function () { enterGameScreenFromRoom(); });
      return;
    }

    // Remote dice roll animation
    var oldRollAt = (oldRoom.state || {}).last_roll_at || 0;
    var newRollAt = (newRoom.state || {}).last_roll_at || 0;
    if (newRollAt > oldRollAt && (newRoom.state || {}).last_roll_by !== myUsername) {
      animateDiceFromRemote((newRoom.state || {}).dice || [1]);
    }

    // Track pending win (show after refresh to have up-to-date players)
    var oldWinner = (oldRoom.state || {}).winner;
    var newWinner = (newRoom.state || {}).winner;
    if (newWinner && newWinner !== oldWinner) {
      pendingWin = { username: newWinner, roomData: newRoom };
    }

    renderLogFromState((newRoom.state || {}).log || []);

    refreshRoomPlayers().then(function () {
      syncTurnUI();
      if (pendingWin) {
        var w = pendingWin; pendingWin = null;
        showWinOverlay(w.username, w.roomData);
      }
    });
  }

  /* ============================ Waiting room ============================ */
  function enterWaitingRoom() {
    showScreen('waitingScreen');
    renderWaitingPlayers();
    $('hostControls').style.display = isHost ? '' : 'none';
    $('hostModeSelect').value = room.mode || 'classic';
  }

  function renderWaitingPlayers() {
    var el = $('waitingPlayers');
    var cnt = $('waitingCount');
    if (!el) return;
    el.innerHTML = roomPlayers.map(function (rp) {
      var isYou = rp.username === myUsername;
      var badge = rp.is_host ? '<span class="wp-host">HOST</span>' : '';
      var youBadge = isYou ? '<span class="wp-you">BẠN</span>' : '';
      return '<div class="waiting-player">' +
        '<img src="' + escapeHtml(rp.avatar_url || avatarUrl(rp.display_name)) + '" alt="" onerror="this.src=\'' + avatarUrl('x') + '\'">' +
        '<span class="wp-name">' + escapeHtml(rp.display_name) + '</span>' +
        badge + youBadge + '</div>';
    }).join('');
    if (cnt) cnt.textContent = roomPlayers.length;

    if ($('hostControls')) {
      var show = isHost && room && room.status === 'waiting';
      $('hostControls').style.display = show ? '' : 'none';
      if (show) {
        var canStart = roomPlayers.length >= 2;
        $('hostStartBtn').disabled = !canStart;
        $('hostStartBtn').textContent = canStart
          ? '🚀 Bắt đầu (' + roomPlayers.length + ' người)'
          : '⏳ Cần ít nhất 2 người chơi';
      }
    }
  }

  /* ============================ Host start ============================ */
  async function hostStartGame() {
    if (!isHost || !room) return;
    if (roomPlayers.length < 2) { toast('Cần ít nhất 2 người chơi'); return; }
    var btn = $('hostStartBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      var mode = $('hostModeSelect').value;
      var now = Date.now();
      var initialState = {
        current_turn: roomPlayers[0].username,
        dice: mode === 'speed' ? [1, 1] : [1],
        last_roll_by: null, last_roll_at: 0, moves: 0, started_at: now,
        player_count: roomPlayers.length,
        log: [{ text: '🎮 Trò chơi bắt đầu — chế độ ' + ({ classic:'Cổ điển',speed:'Tốc độ',chaos:'Hỗn loạn' }[mode]) + ' · ' + roomPlayers.length + ' người', color: '#a78bfa', ts: now }],
        winner: null, winner_at: null, last_move: null
      };
      await sb.from(ROOM_PLAYERS_T).update({ pos: 0, skip_turn: false, extra_turn: false }).eq('room_id', room.id);
      var upd = await sb.from(ROOMS_T).update({
        mode: mode, status: 'playing', state: initialState,
        version: (room.version || 0) + 1, updated_at: new Date().toISOString()
      }).eq('id', room.id);
      if (upd.error) { toast('Lỗi: ' + upd.error.message); btn.disabled = false; }
    } catch (e) {
      toast('Lỗi: ' + e.message);
      btn.disabled = false;
    }
  }

  /* ============================ Local players ============================ */
  function createLocalPlayers() {
    var nameInput = $('playerName');
    var myName = (nameInput.value || '').trim().slice(0, 16) || myProfile.display_name || 'Bạn';
    try { localStorage.setItem('srank_player_name', myName); } catch (e) {}
    var players = [];
    var st0 = PLAYER_STYLES[0];
    players.push({
      id: 0, username: myUsername, name: myName, bot: false, pos: 0, skip: false, extra: false,
      color: st0.color, soft: st0.soft, avatar: avatarUrl(myName + '-me-' + Date.now())
    });
    if (state.playMode === 'bot') {
      var bi = 0;
      while (players.length < state.count && bi < BOT_NAMES.length) {
        var st = PLAYER_STYLES[players.length];
        var nm = BOT_NAMES[bi++];
        players.push({
          id: players.length, username: 'bot_' + players.length, name: nm, bot: true,
          pos: 0, skip: false, extra: false, color: st.color, soft: st.soft,
          avatar: avatarUrl(nm + '-' + players.length)
        });
      }
    } else {
      while (players.length < state.count) {
        var stl = PLAYER_STYLES[players.length];
        players.push({
          id: players.length, username: 'p' + (players.length + 1),
          name: 'Người chơi ' + (players.length + 1), bot: false,
          pos: 0, skip: false, extra: false, color: stl.color, soft: stl.soft,
          avatar: avatarUrl('P' + (players.length + 1))
        });
      }
    }
    return players;
  }

  /* ============================ Enter game ============================ */
  function enterGameScreenFromRoom() {
    state.players = roomPlayers.map(function (rp, i) {
      var st = PLAYER_STYLES[rp.color_index % 4];
      return {
        id: i, username: rp.username, name: rp.display_name, bot: false,
        pos: rp.pos, targetPos: rp.pos, skip: rp.skip_turn, extra: rp.extra_turn,
        color: st.color, soft: st.soft,
        avatar: rp.avatar_url || avatarUrl(rp.display_name)
      };
    });
    state.mode = room.mode;
    state.over = false;
    state.busy = false;
    state.moves = (room.state || {}).moves || 0;
    state.startTime = (room.state || {}).started_at || Date.now();
    var curIdx = state.players.findIndex(function (p) { return p.username === (room.state || {}).current_turn; });
    state.current = curIdx >= 0 ? curIdx : 0;
    animating = {};
    wasMyTurn = false;
    renderedLogTs = {};
    $('log').innerHTML = '';

    showScreen('gameScreen');
    buildBoard();
    renderPlayers();
    createTokens();
    $('diceStage1').style.display = (state.mode === 'speed') ? '' : 'none';
    dice0.show(1, true);
    if (dice1) dice1.show(1, true);
    positionTokens();
    updateTurnPill();
    syncPlayerCards();
    renderLogFromState((room.state || {}).log || []);
    syncTurnUI();
  }

  function enterGameScreenLocal() {
    state.players = createLocalPlayers();
    state.over = false;
    state.busy = false;
    state.moves = 0;
    state.startTime = Date.now();
    state.current = 0;
    wasMyTurn = false;
    renderedLogTs = {};
    $('log').innerHTML = '';

    showScreen('gameScreen');
    buildBoard();
    renderPlayers();
    createTokens();
    $('diceStage1').style.display = (state.mode === 'speed') ? '' : 'none';
    dice0.show(1, true);
    if (dice1) dice1.show(1, true);
    positionTokens();
    updateTurnPill();
    syncPlayerCards();
    $('rollBtn').disabled = false;
    $('rollHint').textContent = 'Nhấn để tung!';
    addLogItem({ text: '🎮 Trò chơi bắt đầu — chế độ ' + ({ classic:'Cổ điển',speed:'Tốc độ',chaos:'Hỗn loạn' }[state.mode]), color: '#a78bfa', ts: Date.now() });
    setTimeout(beginTurnLocal, 400);
  }

  /* ============================ Sync + animate ============================ */
  function rebuildPlayersFromRoom() {
    if (!room || (room.status !== 'playing' && room.status !== 'finished')) return;
    var oldCache = {};
    state.players.forEach(function (p) { oldCache[p.username] = p; });

    var needsRender = roomPlayers.some(function (rp) { return !oldCache[rp.username]; });

    state.players = roomPlayers.map(function (rp, i) {
      var old = oldCache[rp.username];
      var st = PLAYER_STYLES[rp.color_index % 4];
      return {
        id: i, username: rp.username, name: rp.display_name, bot: false,
        pos: old ? old.pos : rp.pos,
        targetPos: rp.pos,
        skip: rp.skip_turn, extra: rp.extra_turn,
        color: st.color, soft: st.soft,
        avatar: rp.avatar_url || avatarUrl(rp.display_name),
        el: old ? old.el : null,
        cardEl: old ? old.cardEl : null,
        posEl: old ? old.posEl : null,
        barEl: old ? old.barEl : null
      };
    });

    if (needsRender) {
      renderPlayers(); createTokens(); positionTokens();
      animating = {};
    }

    var curUser = (room.state || {}).current_turn;
    var curIdx = state.players.findIndex(function (p) { return p.username === curUser; });
    if (curIdx >= 0) state.current = curIdx;

    var lastMove = (room.state || {}).last_move;
    state.players.forEach(function (p) {
      if (p.pos !== p.targetPos && !animating[p.username]) {
        var moveInfo = (lastMove && lastMove.user === p.username) ? lastMove : null;
        animateRemoteMove(p, moveInfo);
      }
    });

    updateTurnPill();
    syncPlayerCards();
    positionTokens();
    syncTurnUI();
  }

  async function animateRemoteMove(player, moveInfo) {
    if (animating[player.username]) return;
    animating[player.username] = true;
    try {
      var from = player.pos, to = player.targetPos;
      if (from === to) return;

      if (moveInfo && (moveInfo.via === 'ladder' || moveInfo.via === 'snake') && moveInfo.dice_land != null) {
        var diceLand = moveInfo.dice_land;
        var safety = 0;
        while (player.pos !== diceLand && safety < 20) {
          player.pos += diceLand > player.pos ? 1 : -1;
          positionTokens();
          SFX.tick();
          await sleep(65);
          safety++;
        }
        await sleep(220);
        player.pos = to;
        if (moveInfo.via === 'ladder') SFX.ladder(); else SFX.snake();
        positionTokens();
        await sleep(320);
      } else {
        var s2 = 0;
        while (player.pos !== player.targetPos && s2 < 25) {
          player.pos += player.targetPos > player.pos ? 1 : -1;
          positionTokens();
          SFX.tick();
          await sleep(65);
          s2++;
        }
      }
    } finally {
      player.pos = player.targetPos;
      positionTokens();
      animating[player.username] = false;
    }
  }

  function animateDiceFromRemote(values) {
    var cubes = [dice0];
    if (values.length > 1) cubes.push(dice1);
    cubes.forEach(function (c) { c.show(1 + rnd(6)); });
    SFX.roll();
    setTimeout(function () {
      cubes.forEach(function (c, i) { c.show(values[i] || 1); });
    }, 450);
  }

  function syncTurnUI() {
    if (state.playMode !== 'online' || !room) return;
    var isMyTurn = (room.state || {}).current_turn === myUsername;
    var playing = room.status === 'playing';

    if (!isMyTurn && state.busy) {
      state.busy = false;
      if (busyTimeout) { clearTimeout(busyTimeout); busyTimeout = null; }
    }

    $('rollBtn').disabled = !(isMyTurn && playing && !state.busy);

    if (isMyTurn && !wasMyTurn && playing) vibrate([60, 40, 60]);
    wasMyTurn = isMyTurn;

    if (!playing) {
      $('rollHint').textContent = 'Trò chơi đã kết thúc';
    } else if (isMyTurn) {
      $('rollHint').textContent = state.busy ? 'Đang xử lý...' : '👉 Lượt của bạn — nhấn để tung!';
    } else {
      var cur = state.players.find(function (p) { return p.username === (room.state || {}).current_turn; });
      $('rollHint').textContent = 'Đang chờ ' + (cur ? cur.name : 'người khác') + '...';
    }
  }

  /* ============================ Online roll ============================ */
  async function doRollOnline() {
    if (!room || room.status !== 'playing') return;
    if ((room.state || {}).current_turn !== myUsername) return;
    if (state.busy) return;
    state.busy = true;
    $('rollBtn').disabled = true;

    if (busyTimeout) clearTimeout(busyTimeout);
    busyTimeout = setTimeout(function () {
      if (state.busy) { state.busy = false; busyTimeout = null; syncTurnUI(); }
    }, 6000);

    try {
      var me = roomPlayers.find(function (p) { return p.username === myUsername; });
      if (!me) { state.busy = false; return; }

      var nDice = room.mode === 'speed' ? 2 : 1;
      var values = [];
      for (var i = 0; i < nDice; i++) values.push(1 + rnd(6));
      var total = values.reduce(function (a, b) { return a + b; }, 0);

      await animateDice(values);

      var oldPos = me.pos;
      var diceLand = oldPos + total;
      var reachedGoal = diceLand >= 100;
      if (reachedGoal) diceLand = 100;

      var newPos = diceLand;
      var via = 'normal';
      var newLog = [];
      var myColor = PLAYER_STYLES[me.color_index % 4].color;
      newLog.push({ text: '🎲 ' + me.display_name + ' tung ' + values.join(' + ') + (nDice > 1 ? ' = ' + total : ''), color: myColor, ts: Date.now() });

      if (reachedGoal) { via = 'goal'; }
      else if (LADDERS[diceLand]) {
        newPos = LADDERS[diceLand]; via = 'ladder';
        newLog.push({ text: '🪜 ' + me.display_name + ' leo thang ' + diceLand + ' → ' + newPos + '!', color: myColor, ts: Date.now() + 1 });
      } else if (SNAKES[diceLand]) {
        newPos = SNAKES[diceLand]; via = 'snake';
        newLog.push({ text: '🐍 ' + me.display_name + ' bị rắn cắn ' + diceLand + ' → ' + newPos + '!', color: myColor, ts: Date.now() + 1 });
      }

      var winner = reachedGoal ? myUsername : null;

      await sb.from(ROOM_PLAYERS_T).update({ pos: newPos }).eq('room_id', room.id).eq('username', myUsername);

      var curIdx = roomPlayers.findIndex(function (p) { return p.username === myUsername; });
      var nextTurn = roomPlayers[(curIdx + 1) % roomPlayers.length].username;

      var newState = {
        current_turn: winner ? myUsername : nextTurn,
        dice: values,
        last_roll_by: myUsername, last_roll_at: Date.now(),
        moves: ((room.state || {}).moves || 0) + 1,
        started_at: (room.state || {}).started_at || Date.now(),
        player_count: (room.state || {}).player_count || roomPlayers.length,
        log: newLog.concat((room.state || {}).log || []).slice(0, 40),
        winner: winner, winner_at: winner ? Date.now() : null,
        last_move: { user: myUsername, from: oldPos, dice_land: diceLand, final: newPos, via: via }
      };

      await sb.from(ROOMS_T).update({
        state: newState,
        status: winner ? 'finished' : 'playing',
        version: (room.version || 0) + 1,
        updated_at: new Date().toISOString()
      }).eq('id', room.id);
    } catch (e) {
      console.warn('[roll] failed:', e);
      state.busy = false;
      if (busyTimeout) { clearTimeout(busyTimeout); busyTimeout = null; }
      $('rollBtn').disabled = false;
    }
  }

  /* ============================ Local roll ============================ */
  function beginTurnLocal() {
    if (state.over) return;
    var p = state.players[state.current];
    if (!p) return;
    updateTurnPill(); syncPlayerCards(); positionTokens();
    if (p.skip) {
      p.skip = false; state.busy = true;
      $('rollBtn').disabled = true;
      $('rollHint').textContent = p.name + ' đang bị đóng băng — bỏ lượt!';
      addLogItem({ text: '⏳ ' + p.name + ' bị đóng băng — bỏ lượt!', color: p.color, ts: Date.now() });
      setTimeout(function () { state.busy = false; advanceTurnLocal(); }, 900);
      return;
    }
    state.busy = false;
    if (p.bot) {
      $('rollBtn').disabled = true;
      $('rollHint').textContent = p.name + ' đang suy nghĩ...';
      setTimeout(function () { if (!state.over) doRollLocal(); }, 700 + rnd(400));
    } else {
      $('rollBtn').disabled = false;
      $('rollHint').textContent = 'Lượt của ' + p.name + ' — nhấn để tung!';
    }
  }
  function advanceTurnLocal() {
    if (state.over) return;
    state.current = (state.current + 1) % state.players.length;
    positionTokens();
    beginTurnLocal();
  }
  async function doRollLocal() {
    if (state.busy || state.over) return;
    state.busy = true;
    $('rollBtn').disabled = true;
    var p = state.players[state.current];
    var nDice = state.mode === 'speed' ? 2 : 1;
    var values = [];
    for (var i = 0; i < nDice; i++) values.push(1 + rnd(6));
    await animateDice(values);
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    state.moves++;
    addLogItem({ text: '🎲 ' + p.name + ' tung ' + values.join(' + ') + (nDice > 1 ? ' = ' + total : ''), color: p.color, ts: Date.now() });
    var target = p.pos + total;
    var reachedGoal = target >= 100;
    if (reachedGoal) target = 100;
    while (p.pos < target) {
      p.pos++; positionTokens(); SFX.tick();
      await sleep(Math.max(60, 130 - (target - p.pos) * 5));
    }
    if (reachedGoal) { await winLocal(p); return; }
    if (LADDERS[p.pos] && p.pos !== 100) {
      var to = LADDERS[p.pos];
      addLogItem({ text: '🪜 ' + p.name + ' leo thang ' + p.pos + ' → ' + to + '!', color: p.color, ts: Date.now() });
      SFX.ladder(); await sleep(250); p.pos = to; positionTokens(); await sleep(400);
    } else if (SNAKES[p.pos]) {
      var down = SNAKES[p.pos];
      addLogItem({ text: '🐍 ' + p.name + ' bị rắn cắn ' + p.pos + ' → ' + down + '!', color: p.color, ts: Date.now() });
      SFX.snake(); await sleep(250); p.pos = down; positionTokens(); await sleep(400);
    }
    if (p.pos >= 100) { await winLocal(p); return; }
    if (state.mode === 'chaos' && Math.random() < 0.38) {
      var roll = Math.random();
      if (roll < 0.25) {
        var dd = 3 + rnd(10); p.pos = Math.min(99, p.pos + dd);
        addLogItem({ text: '🚀 ' + p.name + ' bay +' + dd + ' ô!', color: p.color, ts: Date.now() });
        positionTokens(); await sleep(500);
      } else if (roll < 0.5) {
        var d2 = 3 + rnd(10); p.pos = Math.max(1, p.pos - d2);
        addLogItem({ text: '🌀 ' + p.name + ' lùi -' + d2 + ' ô!', color: p.color, ts: Date.now() });
        positionTokens(); await sleep(500);
      } else if (roll < 0.75) {
        p.skip = true;
        addLogItem({ text: '⏳ ' + p.name + ' mất lượt kế tiếp!', color: p.color, ts: Date.now() });
        await sleep(400);
      } else {
        p.extra = true;
        addLogItem({ text: '🎁 ' + p.name + ' được thêm 1 lượt!', color: p.color, ts: Date.now() });
        await sleep(300);
      }
    }
    if (p.extra) {
      p.extra = false;
      addLogItem({ text: '🎁 ' + p.name + ' được tung thêm!', color: p.color, ts: Date.now() });
      state.busy = false; beginTurnLocal(); return;
    }
    state.busy = false;
    advanceTurnLocal();
  }

  async function winLocal(winner) {
    state.over = true; state.busy = true;
    $('rollBtn').disabled = true;
    addLogItem({ text: '🏆 ' + winner.name + ' đã chạm ô 100 và chiến thắng!', color: winner.color, ts: Date.now() });
    SFX.win(); confetti();
    var durationMs = Date.now() - state.startTime;
    var secs = Math.max(1, Math.round(durationMs / 1000));
    $('statMoves').textContent = state.moves;
    $('statTime').textContent = fmtTime(secs);
    $('statMode').textContent = ({ classic:'Cổ điển',speed:'Tốc độ',chaos:'Hỗn loạn' }[state.mode]);
    $('winEmoji').textContent = winner.bot ? '🤖' : '🏆';
    $('winTitle').textContent = winner.bot ? (winner.name + ' thắng!') : (winner.username === myUsername ? 'Bạn thắng rồi! 🎉' : winner.name + ' thắng!');
    $('winSub').textContent = winner.bot ? 'Đừng buồn nhé!' : 'Chúc mừng!';
    await saveScore({ player_name: winner.name, mode: state.mode, player_count: state.players.length, moves: state.moves, duration_ms: durationMs, result: winner.bot ? 'bot' : 'human' });
    await refreshLeaderboards();
    await sleep(600);
    $('winOverlay').hidden = false;
  }

  /* ============================ Online win ============================ */
  async function showWinOverlay(winnerUsername, roomData) {
    var winnerPlayer = roomPlayers.find(function (p) { return p.username === winnerUsername; });
    var winnerName = winnerPlayer ? winnerPlayer.display_name : winnerUsername;
    var isMe = winnerUsername === myUsername;
    var st = roomData.state || {};
    var durationMs = Date.now() - (st.started_at || Date.now());
    var secs = Math.max(1, Math.round(durationMs / 1000));
    var playerCount = st.player_count || roomPlayers.length;

    $('statMoves').textContent = st.moves || 0;
    $('statTime').textContent = fmtTime(secs);
    $('statMode').textContent = ({ classic:'Cổ điển',speed:'Tốc độ',chaos:'Hỗn loạn' }[roomData.mode]);
    $('winEmoji').textContent = isMe ? '🏆' : '🎉';
    $('winTitle').textContent = isMe ? 'Bạn thắng rồi! 🎉' : (winnerName + ' thắng!');
    $('winSub').textContent = isMe ? 'Tuyệt vời!' : 'Chơi ván mới nhé!';

    SFX.win(); confetti();
    vibrate([100, 50, 100, 50, 100]);

    // Only the winner saves the score — prevents duplicate rows
    if (isMe) {
      try {
        await saveScore({
          player_name: winnerName, mode: roomData.mode,
          player_count: playerCount, moves: st.moves || 0,
          duration_ms: durationMs, result: 'human'
        });
      } catch (e) { console.warn('[LB] winner save failed:', e); }
    }

    await refreshLeaderboards();
    await sleep(600);
    $('winOverlay').hidden = false;
  }

  /* ============================ Confetti ============================ */
  function confetti() {
    var canvas = $('fx');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var W = window.innerWidth, H = window.innerHeight;
    var colors = ['#ff5fa2','#a78bfa','#38bdf8','#22c98a','#f6a723','#fb7185','#fde047'];
    var parts = [];
    for (var i = 0; i < 200; i++) {
      parts.push({
        x: Math.random() * W, y: -20 - Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 2.6, vy: 2 + Math.random() * 4.5,
        r: 5 + Math.random() * 8, rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.32, c: colors[rnd(colors.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }
    var frames = 0;
    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.055; p.vx *= 0.998; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - frames / 240);
        if (p.shape === 'rect') ctx.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.62);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      frames++;
      if (frames < 250) requestAnimationFrame(loop);
      else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ============================ Dice animation ============================ */
  async function animateDice(values) {
    var cubes = [dice0];
    if (values.length > 1) cubes.push(dice1);
    cubes.forEach(function (c) { c.show(1 + rnd(6)); });
    SFX.roll();
    for (var i = 0; i < 5; i++) {
      await sleep(70);
      cubes.forEach(function (c) { c.show(1 + rnd(6)); });
    }
    await sleep(120);
    cubes.forEach(function (c, i) { c.show(values[i]); });
    await sleep(500);
  }

  /* ============================ Screen switching ============================ */
  function showScreen(id) {
    if (id !== 'onlineScreen') unsubscribeRoomsList();
    ['menuScreen', 'onlineScreen', 'waitingScreen', 'localSetupScreen', 'gameScreen'].forEach(function (s) {
      var el = $(s);
      if (el) el.hidden = (s !== id);
    });
    if (id !== 'gameScreen') $('winOverlay').hidden = true;
    var app = shadow.getElementById('sgApp');
    if (app) app.scrollTop = 0;
  }

  /* ============================ UI wiring ============================ */
  $('playModeGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.play-card');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.playMode = btn.dataset.playmode;
    beep(720, 0.06, 'sine', 0.04);
  });

  $('continueBtn').addEventListener('click', function () {
    var nameVal = ($('playerName').value || '').trim();
    if (!nameVal) { toast('Nhập tên hiển thị trước đã!'); $('playerName').focus(); return; }
    try { localStorage.setItem('srank_player_name', nameVal); } catch (e) {}
    ac();
    if (state.playMode === 'online') {
      if (!sb) { toast('Supabase chưa sẵn sàng'); return; }
      enterOnlineScreen();
    } else {
      $('localSetupEmoji').textContent = state.playMode === 'bot' ? '🤖' : '👥';
      $('localSetupTitle').textContent = state.playMode === 'bot' ? 'Đấu với Bot' : 'Cùng máy';
      showScreen('localSetupScreen');
    }
  });

  $('backFromOnlineBtn').addEventListener('click', function () { showScreen('menuScreen'); });
  $('backFromLocalBtn').addEventListener('click', function () { showScreen('menuScreen'); });

  $('createRoomBtn').addEventListener('click', async function () {
    if (this.disabled) return;
    this.disabled = true;
    try { await createRoom(); } catch (e) { toast('Lỗi: ' + e.message); }
    finally { this.disabled = false; }
  });

  $('refreshRoomsBtn').addEventListener('click', function () { refreshRoomsList(); });

  $('roomsList').addEventListener('click', async function (e) {
    var btn = e.target.closest('.room-item-join');
    if (!btn || btn.disabled) return;
    var roomId = btn.dataset.roomId;
    if (!roomId) return;
    btn.disabled = true;
    try { await joinRoomById(roomId); }
    catch (err) { toast('Lỗi: ' + err.message); }
    finally { btn.disabled = false; }
  });

  $('hostStartBtn').addEventListener('click', hostStartGame);
  $('leaveRoomBtn').addEventListener('click', async function () {
    await leaveRoom();
    showScreen('menuScreen');
  });

  $('modeGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.mode-card');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    beep(720, 0.06, 'sine', 0.04);
  });
  $('countSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.count = +btn.dataset.count;
    beep(720, 0.06, 'sine', 0.04);
  });
  $('startLocalBtn').addEventListener('click', function () {
    ac();
    if (state.count > 4) state.count = 4;
    enterGameScreenLocal();
  });

  $('rollBtn').addEventListener('click', function () {
    ac();
    if (state.playMode === 'online') doRollOnline();
    else doRollLocal();
  });

  $('quitBtn').addEventListener('click', async function () {
    if (state.playMode === 'online' && room) {
      await leaveRoom();
      showScreen('menuScreen');
    } else {
      state.over = true;
      showScreen('menuScreen');
      refreshLeaderboards();
    }
  });

  $('playAgainBtn').addEventListener('click', async function () {
    $('winOverlay').hidden = true;
    if (state.playMode === 'online' && room) {
      state.over = true; state.busy = false;
      await leaveRoom();
      showScreen('menuScreen');
    } else {
      state.over = true;
      showScreen('menuScreen');
      refreshLeaderboards();
    }
  });

  $('soundBtn').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) beep(660, 0.08, 'sine', 0.05);
  });

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && host.style.display !== 'none' && !$('gameScreen').hidden) {
      e.preventDefault();
      if (!$('rollBtn').disabled) { ac(); $('rollBtn').click(); }
    }
  });

  /* ============================ Open / Close ============================ */
  var prevBodyOverflow = '';
  function openGame() {
    prevBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('snake-game-open');
    host.style.display = 'block';
    closeBtn.style.display = 'grid';
    var app = shadow.getElementById('sgApp');
    if (app) app.scrollTop = 0;
    showScreen('menuScreen');
  }
  function closeGame() {
    var old = room;
    host.style.display = 'none';
    closeBtn.style.display = 'none';
    document.body.style.overflow = prevBodyOverflow;
    document.body.classList.remove('snake-game-open');
    unsubscribeRoomsList();
    if (old) leaveRoom().catch(function () {});
  }
  closeBtn.addEventListener('click', closeGame);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && host.style.display !== 'none') closeGame();
  });

  /* ============================ Init ============================ */
  dice0 = makeDice($('diceCube0'));
  dice1 = makeDice($('diceCube1'));
  refreshLeaderboards();
  loadMyProfile().then(function () {
    try {
      var saved = localStorage.getItem('srank_player_name');
      if (saved) $('playerName').value = saved;
      else if (myProfile) $('playerName').value = myProfile.display_name;
    } catch (e) {}
  });

  function bindLauncher() {
    var launch = document.getElementById('snakeLadderBtn');
    if (launch && !launch.__sgBound) {
      launch.__sgBound = true;
      launch.addEventListener('click', openGame);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindLauncher);
  else bindLauncher();
})();