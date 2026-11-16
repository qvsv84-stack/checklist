/* =====================================================================
   RẮN & THANG — PREMIUM EDITION
   Self-contained: tự inject CSS + HTML vào Shadow DOM.
   Không đụng CSS/JS của app chính.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__snakeGameLoaded) return;
  window.__snakeGameLoaded = true;

  /* ============================ CSS ============================ */
  var GAME_CSS = `
*,*::before,*::after{box-sizing:border-box}
#sgApp{
  margin:0;
  font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
  color:#3b2b52;
  background:
    radial-gradient(1200px 700px at 8% -12%, #ffe4f5 0%, transparent 58%),
    radial-gradient(1000px 700px at 108% -4%, #dceeff 0%, transparent 55%),
    radial-gradient(900px 800px at 50% 118%, #fff1d8 0%, transparent 60%),
    linear-gradient(165deg,#fdf8ff 0%, #eff6ff 46%, #fff8f1 100%);
  min-height:100vh;
  overflow-x:hidden;
  -webkit-tap-highlight-color:transparent;
  position:absolute;
  inset:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
input{font-family:inherit}

#sgApp::before,#sgApp::after{
  content:'';position:fixed;border-radius:50%;filter:blur(60px);opacity:.55;pointer-events:none;z-index:0;
}
#sgApp::before{width:420px;height:420px;background:#ffc4e6;top:-140px;left:-140px;animation:sgFloat1 16s ease-in-out infinite}
#sgApp::after{width:460px;height:460px;background:#bfe0ff;bottom:-180px;right:-160px;animation:sgFloat2 20s ease-in-out infinite}
@keyframes sgFloat1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,50px)}}
@keyframes sgFloat2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}

.shell{position:relative;z-index:1;max-width:1440px;margin:0 auto;padding:16px 18px 46px}

.topbar{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:12px 18px;margin-bottom:18px;
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(167,139,250,.22);
  border-radius:22px;
  box-shadow:0 16px 40px -26px rgba(88,60,150,.55);
}
.brand{display:flex;align-items:center;gap:10px;font-family:'Baloo 2',cursive;font-weight:800;font-size:22px;letter-spacing:.3px}
.brand .logo{font-size:26px;filter:drop-shadow(0 4px 8px rgba(255,111,174,.45))}
.badge{
  font-family:'Nunito',sans-serif;font-size:10px;font-weight:900;letter-spacing:1.4px;
  padding:4px 9px;border-radius:999px;color:#fff;
  background:linear-gradient(135deg,#ff6fae,#a78bfa);
  box-shadow:0 6px 14px -6px rgba(167,139,250,.9);
}
.top-actions{display:flex;align-items:center;gap:8px}

.icon-btn{
  width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:18px;
  background:rgba(255,255,255,.9);
  border:1px solid rgba(167,139,250,.24);
  box-shadow:0 8px 18px -12px rgba(88,60,150,.6);
  transition:transform .16s ease, box-shadow .16s ease;
}
.icon-btn:hover{transform:translateY(-2px);box-shadow:0 12px 22px -12px rgba(88,60,150,.7)}

.panel{
  background:rgba(255,255,255,.82);
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border:1px solid rgba(167,139,250,.2);
  border-radius:24px;
  box-shadow:0 20px 46px -28px rgba(88,60,150,.62);
  padding:18px;
}
.panel-title{
  margin:0 0 12px;font-family:'Baloo 2',cursive;font-size:15px;font-weight:800;
  letter-spacing:.4px;color:#6b5b85;display:flex;align-items:center;gap:7px;
}

.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 20px;border-radius:16px;font-weight:800;font-size:15px;
  transition:transform .15s ease, box-shadow .15s ease, opacity .15s;
  user-select:none;
}
.btn:active{transform:scale(.97)}
.btn-primary{
  color:#fff;
  background:linear-gradient(135deg,#ff7ab8 0%,#a78bfa 55%,#7dd3fc 115%);
  box-shadow:0 14px 26px -12px rgba(167,139,250,.95), inset 0 1px 0 rgba(255,255,255,.35);
}
.btn-primary:hover{box-shadow:0 18px 32px -12px rgba(167,139,250,1), inset 0 1px 0 rgba(255,255,255,.35)}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.btn-ghost{
  background:rgba(255,255,255,.85);color:#6b5b85;
  border:1px solid rgba(167,139,250,.28);
  box-shadow:0 8px 18px -14px rgba(88,60,150,.7);
}
.btn-lg{padding:16px 30px;font-size:17px;border-radius:18px;width:100%}
.btn-roll{width:100%;font-size:16px;padding:14px}

.setup{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.hero{text-align:center;padding:26px 18px 8px}
.hero h1{
  margin:0 0 8px;font-family:'Baloo 2',cursive;font-size:clamp(28px,5vw,44px);line-height:1.1;
  background:linear-gradient(120deg,#ff6fae,#a78bfa 48%,#38bdf8);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 6px 16px rgba(167,139,250,.25));
}
.hero p{margin:0;color:#7a6b93;font-size:15px;font-weight:600;max-width:520px;margin-inline:auto;line-height:1.6}
.hero-emojis{font-size:30px;letter-spacing:10px;margin-bottom:6px;filter:drop-shadow(0 6px 10px rgba(255,111,174,.3))}

.field{display:flex;flex-direction:column;gap:10px}
.field > label{font-size:13px;font-weight:800;color:#8a7aa6;letter-spacing:.6px;text-transform:uppercase}

.name-input{
  width:100%;padding:15px 18px;border-radius:16px;font-size:16px;font-weight:700;color:#3b2b52;
  background:#fff;border:2px solid rgba(167,139,250,.25);
  outline:none;transition:border-color .18s, box-shadow .18s;
}
.name-input:focus{border-color:#a78bfa;box-shadow:0 0 0 4px rgba(167,139,250,.16)}
.name-input::placeholder{color:#c3b8d8;font-weight:600}

.mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media (max-width:560px){.mode-grid{grid-template-columns:1fr}}
.mode-card{
  display:flex;flex-direction:column;align-items:flex-start;gap:3px;
  padding:15px 14px;border-radius:18px;text-align:left;
  background:#fff;border:2px solid rgba(167,139,250,.16);
  transition:all .2s cubic-bezier(.3,.8,.4,1.2);
  box-shadow:0 8px 20px -18px rgba(88,60,150,.8);
}
.mode-card .mode-emoji{font-size:24px;line-height:1;margin-bottom:4px}
.mode-card b{font-size:15px;font-weight:900;color:#4a3a63}
.mode-card small{font-size:11.5px;color:#9c8fb5;font-weight:700;line-height:1.35}
.mode-card:hover{transform:translateY(-3px);border-color:rgba(167,139,250,.4)}
.mode-card.active{
  border-color:transparent;
  background:linear-gradient(150deg,#fff0f8,#f2ecff 60%,#eaf6ff);
  box-shadow:0 16px 30px -18px rgba(167,139,250,.95), inset 0 0 0 2px rgba(167,139,250,.5);
  transform:translateY(-3px);
}

.seg{display:inline-flex;background:#fff;border-radius:16px;padding:5px;gap:4px;border:2px solid rgba(167,139,250,.16);width:fit-content}
.seg button{width:54px;padding:10px 0;border-radius:12px;font-weight:900;font-size:16px;color:#9c8fb5;transition:all .18s ease}
.seg button.active{color:#fff;background:linear-gradient(135deg,#ff7ab8,#a78bfa);box-shadow:0 8px 16px -8px rgba(167,139,250,.95)}

.toggle{display:flex;align-items:center;gap:12px;cursor:pointer;font-weight:800;font-size:14.5px;color:#6b5b85;user-select:none}
.toggle input{position:absolute;opacity:0;pointer-events:none}
.toggle .track{width:52px;height:30px;border-radius:999px;background:#e3dbf2;position:relative;transition:background .22s ease;flex:0 0 auto}
.toggle .thumb{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(88,60,150,.3);transition:transform .22s cubic-bezier(.3,.9,.4,1.4)}
.toggle input:checked + .track{background:linear-gradient(135deg,#ff7ab8,#a78bfa)}
.toggle input:checked + .track .thumb{transform:translateX(22px)}

.lb-block{margin-top:6px}
.lb-block h3{margin:0 0 10px;font-family:'Baloo 2',cursive;font-size:16px;font-weight:800;color:#6b5b85;display:flex;align-items:center;gap:8px}
.lb-list{display:flex;flex-direction:column;gap:7px}
.lb-row{
  display:grid;grid-template-columns:34px minmax(0,1fr) auto auto auto;gap:10px;align-items:center;
  padding:11px 14px;border-radius:14px;background:#fff;
  border:1px solid rgba(167,139,250,.14);
  font-size:13px;font-weight:700;
  box-shadow:0 6px 16px -16px rgba(88,60,150,.9);
}
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
.pcard{
  display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:18px;
  background:#fff;border:2px solid rgba(167,139,250,.12);
  transition:all .25s cubic-bezier(.3,.8,.4,1.2);
  box-shadow:0 10px 22px -20px rgba(88,60,150,.9);
  position:relative;overflow:hidden;
}
.pcard::after{content:'';position:absolute;inset:0;border-radius:16px;pointer-events:none;box-shadow:inset 0 0 0 2px transparent;transition:box-shadow .25s}
.pcard.active{transform:translateX(3px);background:linear-gradient(100deg,var(--soft,#fff),#fff 75%);border-color:var(--c);box-shadow:0 14px 28px -18px var(--c)}
.pcard.active::after{box-shadow:inset 0 0 0 2px var(--c)}
.pcard.active .pav{animation:pulseRing 1.6s ease-in-out infinite}
@keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 var(--c),0 6px 14px -6px rgba(0,0,0,.3)}50%{box-shadow:0 0 0 6px transparent,0 6px 14px -6px rgba(0,0,0,.3)}}
.pav{
  position:relative;width:44px;height:44px;border-radius:14px;flex:0 0 auto;
  background:#f7f3ff;display:grid;place-items:center;
  box-shadow:0 0 0 2.5px var(--c), 0 6px 14px -6px rgba(0,0,0,.25);
  overflow:visible;
}
.pav img{width:100%;height:100%;border-radius:12px;object-fit:cover;display:block}
.pav .av-emoji{font-size:22px;line-height:1}
.ptag{
  position:absolute;bottom:-7px;right:-7px;min-width:22px;height:22px;padding:0 6px;
  border-radius:999px;background:var(--c);color:#fff;font-size:11px;font-weight:900;
  display:grid;place-items:center;border:2px solid #fff;
  box-shadow:0 4px 10px -4px rgba(0,0,0,.4);
}
.pinfo{min-width:0;flex:1}
.pname{font-size:13.5px;font-weight:900;color:#4a3a63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bot-tag{font-size:9px;font-weight:900;letter-spacing:.6px;background:#eef2ff;color:#6366f1;padding:2px 5px;border-radius:5px;vertical-align:middle;margin-left:4px}
.pbar{height:6px;border-radius:999px;background:#f0ecfa;margin-top:6px;overflow:hidden}
.pbar > span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--c),#a78bfa);transition:width .3s ease}

.turn-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.turn-pill{
  display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:999px;
  background:rgba(255,255,255,.9);border:2px solid var(--c,#a78bfa);
  font-weight:900;font-size:14.5px;color:#4a3a63;
  box-shadow:0 12px 26px -18px var(--c,#a78bfa);
  transition:border-color .3s, box-shadow .3s;
  max-width:100%;
}
.turn-pill .dot{width:11px;height:11px;border-radius:50%;background:var(--c,#a78bfa);flex:0 0 auto}
.turn-pill .txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.board-shell{
  padding:12px;border-radius:30px;
  background:linear-gradient(150deg,rgba(255,255,255,.9),rgba(245,240,255,.8));
  border:1px solid rgba(167,139,250,.22);
  box-shadow:0 28px 60px -34px rgba(88,60,150,.75), inset 0 1px 0 rgba(255,255,255,.7);
}
.board{
  position:relative;width:100%;aspect-ratio:1/1;max-width:640px;margin:0 auto;
  border-radius:22px;overflow:hidden;
  background:#fff;
  box-shadow:inset 0 0 0 1px rgba(167,139,250,.15);
  container-type:inline-size;
  isolation:isolate;
}
.cells{position:absolute;inset:0;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr)}
.cell{
  position:relative;display:flex;align-items:flex-start;justify-content:flex-start;
  padding:3px 5px;
  border:0.5px solid rgba(167,139,250,.13);
  font-size:clamp(7px,2.05cqw,13px);
  font-weight:800;color:rgba(90,70,120,.42);
  overflow:hidden;
}
.cell .mark{position:absolute;right:2px;bottom:1px;font-size:clamp(8px,2.6cqw,15px);line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))}
.cell.is-ladder{background-image:linear-gradient(135deg,rgba(251,191,36,.16),transparent 62%)}
.cell.is-snake{background-image:linear-gradient(135deg,rgba(239,68,68,.13),transparent 62%)}
.cell.is-goal{background-image:radial-gradient(circle at 50% 50%,#ffe9a8,rgba(255,233,168,0) 78%)}
.cell.is-start{background-image:radial-gradient(circle at 50% 50%,#c9f2e2,rgba(201,242,226,0) 78%)}

#boardSvg{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.tokens{position:absolute;inset:0;z-index:3;pointer-events:none}

.token{
  position:absolute;width:5.6%;height:5.6%;
  transform:translate(-50%,-50%);
  transition:left .19s cubic-bezier(.35,.85,.4,1.15), top .19s cubic-bezier(.35,.85,.4,1.15);
  border-radius:50%;background:#fff;
  display:grid;place-items:center;
  box-shadow:0 0 0 2.5px var(--c), 0 8px 16px -6px rgba(0,0,0,.42);
  z-index:20;
  will-change:left,top;
}
.token img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.token .tok-emoji{font-size:clamp(10px,3.4cqw,20px);line-height:1}
.token .tok-badge{
  position:absolute;bottom:-22%;right:-22%;
  width:46%;height:46%;border-radius:50%;
  background:var(--c);color:#fff;border:1.5px solid #fff;
  font-size:clamp(5px,1.5cqw,9px);font-weight:900;
  display:grid;place-items:center;
  box-shadow:0 2px 6px rgba(0,0,0,.3);
}
.token.active{animation:tokenBounce 1.1s ease-in-out infinite}
@keyframes tokenBounce{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-58%) scale(1.1)}}

.dice-panel{display:flex;flex-direction:column;align-items:center;gap:14px}
.dice-row{display:flex;gap:16px;justify-content:center;align-items:center;min-height:82px;perspective:800px}
.dice-stage{width:72px;height:72px;perspective:700px;flex:0 0 auto}
.dice-cube{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.05s cubic-bezier(.22,.9,.28,1)}
.dice-cube.rolling{animation:diceShake .5s ease-in-out}
@keyframes diceShake{0%,100%{filter:blur(0)}30%{filter:blur(.6px)}60%{filter:blur(.3px)}}
.dice-face{
  position:absolute;inset:0;border-radius:16px;
  background:linear-gradient(150deg,#ffffff,#f3edff);
  box-shadow:inset 0 0 0 2px #e6dcff, inset 0 -7px 14px rgba(167,139,250,.2), 0 4px 10px rgba(88,60,150,.1);
  display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);
  padding:9px;
}
.pip{
  width:11px;height:11px;border-radius:50%;align-self:center;justify-self:center;
  background:radial-gradient(circle at 32% 28%,#b9a3ff,#6d4bd8 78%);
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.28), 0 1px 2px rgba(255,255,255,.6);
}
.roll-hint{font-size:12.5px;font-weight:800;color:#a396bd;text-align:center;min-height:18px}

.log{
  display:flex;flex-direction:column;gap:6px;max-height:290px;overflow-y:auto;
  padding-right:4px;scrollbar-width:thin;scrollbar-color:#d9cff0 transparent;
}
.log::-webkit-scrollbar{width:6px}
.log::-webkit-scrollbar-thumb{background:#d9cff0;border-radius:99px}
.log-item{
  font-size:12.5px;font-weight:700;line-height:1.45;color:#6b5b85;
  padding:8px 11px;border-radius:11px;background:#fff;
  border-left:3px solid var(--c,#c9bde8);
  box-shadow:0 4px 12px -12px rgba(88,60,150,.9);
  animation:logIn .3s ease;
}
@keyframes logIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

#fx{position:fixed;inset:0;pointer-events:none;z-index:9000}
.overlay{
  position:fixed;inset:0;z-index:8000;display:grid;place-items:center;
  padding:20px;background:rgba(60,40,95,.42);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  animation:fadeIn .3s ease;
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.win-card{
  width:min(520px,100%);max-height:92vh;overflow-y:auto;
  background:linear-gradient(170deg,#fff,#fdf9ff 55%,#f5f9ff);
  border-radius:30px;padding:28px 24px;
  border:1px solid rgba(167,139,250,.25);
  box-shadow:0 40px 90px -30px rgba(60,30,110,.6);
  text-align:center;
  animation:popIn .45s cubic-bezier(.2,1.2,.4,1);
}
@keyframes popIn{from{opacity:0;transform:scale(.86) translateY(20px)}to{opacity:1;transform:none}}
.win-emoji{font-size:64px;line-height:1;animation:bounce 1.2s ease-in-out infinite;filter:drop-shadow(0 12px 20px rgba(251,191,36,.5))}
@keyframes bounce{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-12px) rotate(6deg)}}
.win-card h2{
  margin:12px 0 6px;font-family:'Baloo 2',cursive;font-size:30px;
  background:linear-gradient(120deg,#ff6fae,#a78bfa,#38bdf8);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.win-card > p{margin:0 0 18px;color:#8a7aa6;font-weight:700;font-size:14.5px}
.win-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:20px}
.stat{background:#fff;border-radius:16px;padding:13px 8px;border:1px solid rgba(167,139,250,.18);box-shadow:0 8px 20px -20px rgba(88,60,150,.9)}
.stat b{display:block;font-size:19px;font-family:'Baloo 2',cursive;color:#4a3a63;line-height:1.2}
.stat span{font-size:10.5px;font-weight:800;color:#a396bd;letter-spacing:.5px;text-transform:uppercase}
.win-actions{display:flex;gap:10px;margin-bottom:22px}
.win-actions .btn{flex:1}
.win-card .lb-block{text-align:left}

.hint-box{
  font-size:12px;font-weight:700;color:#9c8fb5;line-height:1.6;
  background:#faf7ff;border:1px dashed rgba(167,139,250,.35);
  border-radius:14px;padding:12px 14px;
}
.toast{
  position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);
  padding:12px 22px;border-radius:999px;background:rgba(59,43,82,.94);color:#fff;
  font-weight:800;font-size:14px;z-index:9500;opacity:0;pointer-events:none;
  transition:all .32s cubic-bezier(.2,.9,.3,1.2);
  box-shadow:0 16px 34px -14px rgba(0,0,0,.6);
  max-width:88vw;text-align:center;
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

  /* ============================ HTML ============================ */
  var GAME_HTML = `
<div id="sgApp">
  <canvas id="fx"></canvas>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">🐍</span>
        <span>Rắn &amp; Thang</span>
        <span class="badge">PREMIUM</span>
      </div>
      <div class="top-actions">
        <button class="icon-btn" id="soundBtn" title="Bật/tắt âm thanh">🔊</button>
      </div>
    </header>

    <section id="setupScreen" class="setup">
      <div class="panel">
        <div class="hero">
          <div class="hero-emojis">🪜 🎲 🐍</div>
          <h1>Leo thang, né rắn!</h1>
          <p>Đổ xúc xắc, phiêu lưu qua 100 ô, leo những chiếc thang lên tận mây và đừng để rắn cắn nhé!</p>
        </div>
        <div class="field" style="margin-top:20px">
          <label for="playerName">Tên của bạn</label>
          <input id="playerName" class="name-input" maxlength="16" placeholder="Nhập tên hiệp sĩ..." autocomplete="off" />
        </div>
        <div class="field" style="margin-top:18px">
          <label>Chế độ chơi</label>
          <div class="mode-grid" id="modeGrid">
            <button class="mode-card active" data-mode="classic" type="button"><span class="mode-emoji">🎲</span><b>Cổ điển</b><small>1 xúc xắc · nhịp thư giãn</small></button>
            <button class="mode-card" data-mode="speed" type="button"><span class="mode-emoji">⚡</span><b>Tốc độ</b><small>2 xúc xắc · về đích nhanh</small></button>
            <button class="mode-card" data-mode="chaos" type="button"><span class="mode-emoji">🌪️</span><b>Hỗn loạn</b><small>Sự kiện ngẫu nhiên · lật kèo</small></button>
          </div>
        </div>
        <div class="field" style="margin-top:18px">
          <label>Số người chơi</label>
          <div class="seg" id="countSeg">
            <button data-count="2" class="active" type="button">2</button>
            <button data-count="3" type="button">3</button>
            <button data-count="4" type="button">4</button>
          </div>
        </div>
        <div style="margin-top:18px">
          <label class="toggle">
            <input type="checkbox" id="vsBot" checked />
            <span class="track"><span class="thumb"></span></span>
            <span>Đấu với máy 🤖 &nbsp;<em style="font-style:normal;color:#b0a4c7;font-weight:700">(tắt = chơi chung một máy)</em></span>
          </label>
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-primary btn-lg" id="startBtn" type="button">Bắt đầu chơi 🚀</button>
        </div>
        <div class="hint-box" style="margin-top:16px">
          💡 <b>Luật chơi:</b> Tung xúc xắc để di chuyển. Rơi vào <b>chân thang 🪜</b> → leo lên. Rơi vào <b>đầu rắn 🐍</b> → tuột xuống. Ai tới hoặc vượt ô <b>100</b> trước sẽ thắng!
        </div>
      </div>
      <div class="panel lb-block">
        <h3>🏆 Bảng xếp hạng</h3>
        <div class="lb-list" id="leaderboardSetup"><div class="lb-empty">Đang tải...</div></div>
      </div>
    </section>

    <section id="gameScreen" hidden>
      <div class="layout">
        <aside class="panel col-players">
          <h3 class="panel-title">👥 Người chơi</h3>
          <div class="player-list" id="playerList"></div>
        </aside>
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
            <div class="dice-row" id="diceRow">
              <div class="dice-stage"><div class="dice-cube" id="diceCube0"></div></div>
              <div class="dice-stage" id="diceStage1"><div class="dice-cube" id="diceCube1"></div></div>
            </div>
            <button class="btn btn-primary btn-roll" id="rollBtn" type="button">🎲 Tung xúc xắc</button>
            <div class="roll-hint" id="rollHint">Nhấn để tung!</div>
          </div>
          <div class="panel">
            <h3 class="panel-title">📜 Nhật ký</h3>
            <div class="log" id="log"></div>
          </div>
        </aside>
      </div>
    </section>
  </div>

  <div class="overlay" id="winOverlay" hidden>
    <div class="win-card">
      <div class="win-emoji" id="winEmoji">🏆</div>
      <h2 id="winTitle">Chiến thắng!</h2>
      <p id="winSub">Chúc mừng bạn đã chạm tới ô 100!</p>
      <div class="win-stats">
        <div class="stat"><b id="statMoves">0</b><span>Lượt</span></div>
        <div class="stat"><b id="statTime">0:00</b><span>Thời gian</span></div>
        <div class="stat"><b id="statMode">—</b><span>Chế độ</span></div>
      </div>
      <div class="win-actions">
        <button class="btn btn-primary" id="playAgainBtn" type="button">Chơi lại 🔁</button>
        <button class="btn btn-ghost" id="homeBtn" type="button">Trang chủ 🏠</button>
      </div>
      <div class="lb-block">
        <h3>🏆 Bảng xếp hạng</h3>
        <div class="lb-list" id="leaderboardWin"></div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
</div>
`;

  /* ============================ Build host + shadow ============================ */
  var host = document.createElement('div');
  host.id = 'snakeGameHost';
  host.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;';
  var shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>' + GAME_CSS + '</style>' + GAME_HTML;
  document.body.appendChild(host);

  /* Nút đóng (ngoài shadow) */
  var closeBtn = document.createElement('button');
  closeBtn.id = 'snakeGameClose';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Đóng game');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    'position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;' +
    'z-index:9600;width:44px;height:44px;border-radius:50%;' +
    'background:rgba(59,43,82,.72);color:#fff;font-size:22px;font-weight:700;' +
    'display:none;place-items:center;border:1px solid rgba(255,255,255,.25);' +
    'box-shadow:0 6px 18px -6px rgba(0,0,0,.5);' +
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
    'cursor:pointer;padding:0;line-height:1;font-family:system-ui,-apple-system,sans-serif';
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

  var sb = null;
  try {
    if (window.supabase && CFG.SUPABASE_URL && CFG.SUPABASE_KEY) {
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
  } catch (e) { console.warn('[SB] init failed:', e); }

  /* ============================ Board geometry ============================ */
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
    var px = -dy / len, py = dx / len;
    var w = 1.7;
    var a1 = [A.x + px * w, A.y + py * w], a2 = [A.x - px * w, A.y - py * w];
    var b1 = [B.x + px * w, B.y + py * w], b2 = [B.x - px * w, B.y - py * w];
    var s = '<g stroke="#f0b429" stroke-linecap="round" opacity="0.95">';
    s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + b1[0] + '" y2="' + b1[1] + '" stroke-width="1.15"/>';
    s += '<line x1="' + a2[0] + '" y1="' + a2[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" stroke-width="1.15"/>';
    var n = Math.max(2, Math.round(len / 7));
    for (var i = 1; i < n; i++) {
      var t = i / n;
      var p1x = a1[0] + (b1[0] - a1[0]) * t, p1y = a1[1] + (b1[1] - a1[1]) * t;
      var p2x = a2[0] + (b2[0] - a2[0]) * t, p2y = a2[1] + (b2[1] - a2[1]) * t;
      s += '<line x1="' + p1x + '" y1="' + p1y + '" x2="' + p2x + '" y2="' + p2y + '" stroke-width="0.85" stroke="#fbd97a"/>';
    }
    s += '</g>';
    return s;
  }

  var SNAKE_COLORS = ['#7c5cff', '#22c98a', '#ff5fa2', '#f6a723', '#38bdf8', '#f97316', '#a855f7', '#14b8a6', '#ef4444', '#8b5cf6'];

  function snakeArt(headPos, tailPos, idx) {
    var H = posToXY(headPos), T = posToXY(tailPos);
    var mx = (H.x + T.x) / 2, my = (H.y + T.y) / 2;
    var dx = T.x - H.x, dy = T.y - H.y;
    var len = Math.hypot(dx, dy) || 1;
    var off = Math.min(17, len * 0.42) * (idx % 2 ? 1 : -1);
    var cx = mx + (-dy / len) * off;
    var cy = my + (dx / len) * off;
    var color = SNAKE_COLORS[idx % SNAKE_COLORS.length];
    var hdx = H.x - cx, hdy = H.y - cy;
    var hl = Math.hypot(hdx, hdy) || 1;
    var ux = hdx / hl, uy = hdy / hl;
    var ex = -uy, ey = ux;
    var d = 'M ' + H.x + ' ' + H.y + ' Q ' + cx + ' ' + cy + ' ' + T.x + ' ' + T.y;
    var s = '<g>';
    s += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.7" stroke-linecap="round" opacity="0.9"/>';
    s += '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="0.75" stroke-linecap="round" stroke-dasharray="1.3 1.9" opacity="0.6"/>';
    s += '<circle cx="' + T.x + '" cy="' + T.y + '" r="1.05" fill="' + color + '"/>';
    s += '<circle cx="' + H.x + '" cy="' + H.y + '" r="2.5" fill="' + color + '"/>';
    s += '<circle cx="' + H.x + '" cy="' + H.y + '" r="2.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="0.4"/>';
    var eo = 1.05;
    var hx1 = H.x + ex * eo + ux * 0.55, hy1 = H.y + ey * eo + uy * 0.55;
    var hx2 = H.x - ex * eo + ux * 0.55, hy2 = H.y - ey * eo + uy * 0.55;
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
    swap:   function () { beep(520, 0.1, 'triangle', 0.05); beep(780, 0.14, 'triangle', 0.05, 0.09); },
    boost:  function () { [440, 660, 880].forEach(function (f, i) { beep(f, 0.12, 'sine', 0.05, i * 0.06); }); },
    win:    function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, 0.32, 'sine', 0.06, i * 0.11); }); }
  };

  /* ============================ Dice ============================ */
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
    { color: '#ff5fa2', soft: '#ffe4f1', emoji: '🦄' },
    { color: '#4f8dff', soft: '#e0edff', emoji: '🐬' },
    { color: '#18c08a', soft: '#dcf9ee', emoji: '🐸' },
    { color: '#f6a723', soft: '#ffefd4', emoji: '🦊' }
  ];
  var BOT_NAMES = ['Mèo Bông', 'Gấu Mật', 'Thỏ Ngọc', 'Cáo Lửa'];

  var state = {
    mode: 'classic', count: 2, vsBot: true,
    players: [], current: 0, busy: false, over: false, moves: 0, startTime: 0
  };
  var dice0 = null, dice1 = null;

  function avatarUrl(seed) {
    return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(seed) +
      '&backgroundColor=ffd5dc,ffdfbf,c0aede,b6e3f4,d1d4f9&radius=14';
  }

  /* ============================ Board build ============================ */
  var PASTELS = [
    'hsl(330 90% 97%)','hsl(280 90% 97%)','hsl(215 90% 97%)','hsl(165 80% 96%)',
    'hsl(45 95% 96%)','hsl(15 95% 97%)','hsl(255 90% 97%)','hsl(190 85% 96%)',
    'hsl(345 90% 97%)','hsl(225 90% 97%)'
  ];

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

  /* ============================ Player UI ============================ */
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
      img.onerror = function () {
        this.replaceWith(Object.assign(document.createElement('span'), { className: 'av-emoji', textContent: p.emoji }));
      };
      pav.appendChild(img);
      var tag = document.createElement('span');
      tag.className = 'ptag'; tag.textContent = p.pos;
      pav.appendChild(tag);
      var info = document.createElement('div');
      info.className = 'pinfo';
      var nm = document.createElement('div');
      nm.className = 'pname';
      nm.innerHTML = escapeHtml(p.name) + (p.bot ? '<span class="bot-tag">BOT</span>' : '');
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
    pill.querySelector('.txt').textContent = state.over ? 'Kết thúc' : ('Lượt của ' + p.name);
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
      img.onerror = function () {
        this.replaceWith(Object.assign(document.createElement('span'), { className: 'tok-emoji', textContent: p.emoji }));
      };
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
  function addLog(text, color) {
    var el = $('log');
    var div = document.createElement('div');
    div.className = 'log-item';
    if (color) div.style.setProperty('--c', color);
    div.textContent = text;
    el.prepend(div);
    while (el.children.length > 40) el.removeChild(el.lastChild);
  }

  /* ============================ Leaderboard ============================ */
  function localScores() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }

  async function fetchLeaderboard() {
    if (sb) {
      try {
        var res = await sb.from(LB_TABLE)
          .select('player_name, mode, moves, duration_ms, created_at')
          .order('moves', { ascending: true })
          .order('duration_ms', { ascending: true })
          .limit(10);
        if (res.error) throw res.error;
        if (res.data && res.data.length) return res.data;
        return [];
      } catch (e) { console.warn('[LB] remote failed:', e.message || e); }
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
      return '<div class="lb-row">' +
        '<span class="lb-rank">' + medal + '</span>' +
        '<span class="lb-name">' + escapeHtml(r.player_name) + '</span>' +
        '<span class="lb-mode">' + (modeNames[r.mode] || escapeHtml(r.mode || '—')) + '</span>' +
        '<span class="lb-moves">' + (r.moves || 0) + ' lượt</span>' +
        '<span class="lb-time">' + fmtTime(secs) + '</span>' +
        '</div>';
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
      } catch (e) { console.warn('[LB] insert failed:', e.message || e); }
    }
    try {
      var arr = localScores();
      arr.push(Object.assign({}, payload, { created_at: new Date().toISOString() }));
      arr.sort(function (a, b) { return a.moves - b.moves; });
      localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, 60)));
      return true;
    } catch (e) { return false; }
  }

  /* ============================ Game flow ============================ */
  function setRollEnabled(on) {
    var btn = $('rollBtn');
    btn.disabled = !on;
    $('rollHint').textContent = on ? 'Nhấn để tung!' : 'Đang chờ...';
  }

  function setupDiceForMode() {
    $('diceStage1').style.display = (state.mode === 'speed') ? '' : 'none';
  }

  function createPlayers() {
    var nameInput = $('playerName');
    var myName = (nameInput.value || '').trim().slice(0, 16) || 'Bạn';
    try { localStorage.setItem('srank_player_name', myName); } catch (e) {}
    var players = [];
    for (var i = 0; i < state.count; i++) {
      var st = PLAYER_STYLES[i];
      var isBot = state.vsBot && i > 0;
      var nm = i === 0 ? myName : (isBot ? BOT_NAMES[i - 1] : ('Người chơi ' + (i + 1)));
      players.push({
        id: i, name: nm, bot: isBot, pos: 0, skip: false, extra: false,
        color: st.color, soft: st.soft, emoji: st.emoji,
        avatar: avatarUrl(nm + '-' + i)
      });
    }
    return players;
  }

  function startGame() {
    state.players = createPlayers();
    state.current = 0;
    state.busy = false;
    state.over = false;
    state.moves = 0;
    state.startTime = Date.now();
    $('setupScreen').hidden = true;
    $('gameScreen').hidden = false;
    $('winOverlay').hidden = true;
    $('log').innerHTML = '';
    buildBoard();
    renderPlayers();
    createTokens();
    setupDiceForMode();
    dice0.show(1, true);
    if (dice1) dice1.show(1, true);
    positionTokens();
    updateTurnPill();
    syncPlayerCards();
    addLog('🎮 Bắt đầu trò chơi — chế độ ' +
      ({ classic: 'Cổ điển', speed: 'Tốc độ', chaos: 'Hỗn loạn' }[state.mode]), '#a78bfa');
    setTimeout(beginTurn, 420);
  }

  function beginTurn() {
    if (state.over) return;
    var p = state.players[state.current];
    if (!p) return;
    updateTurnPill(); syncPlayerCards(); positionTokens();
    if (p.skip) {
      p.skip = false; state.busy = true; setRollEnabled(false);
      addLog('⏳ ' + p.name + ' đang bị đóng băng — bỏ lượt!', p.color);
      setTimeout(function () { state.busy = false; advanceTurn(); }, 950);
      return;
    }
    state.busy = false;
    if (p.bot) {
      setRollEnabled(false);
      $('rollHint').textContent = p.name + ' đang suy nghĩ...';
      setTimeout(function () { if (!state.over) doRoll(); }, 750 + rnd(450));
    } else {
      setRollEnabled(true);
    }
  }

  function advanceTurn() {
    if (state.over) return;
    state.current = (state.current + 1) % state.players.length;
    positionTokens();
    beginTurn();
  }

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
    await sleep(560);
  }

  async function resolveSpecial(p) {
    if (LADDERS[p.pos] && p.pos !== 100) {
      var to = LADDERS[p.pos];
      addLog('🪜 ' + p.name + ' leo thang ' + p.pos + ' → ' + to + '!', p.color);
      SFX.ladder();
      await sleep(280);
      p.pos = to;
      positionTokens();
      await sleep(460);
      return true;
    }
    if (SNAKES[p.pos]) {
      var down = SNAKES[p.pos];
      addLog('🐍 ' + p.name + ' bị rắn cắn ' + p.pos + ' → ' + down + '!', p.color);
      SFX.snake();
      await sleep(280);
      p.pos = down;
      positionTokens();
      await sleep(460);
      return true;
    }
    return false;
  }

  async function doRoll() {
    if (state.busy || state.over) return;
    state.busy = true;
    setRollEnabled(false);
    var p = state.players[state.current];
    var nDice = state.mode === 'speed' ? 2 : 1;
    var values = [];
    for (var i = 0; i < nDice; i++) values.push(1 + rnd(6));
    await animateDice(values);
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    state.moves++;
    addLog('🎲 ' + p.name + ' tung ' + values.join(' + ') + (nDice > 1 ? ' = ' + total : ''), p.color);
    var target = p.pos + total;
    var reachedGoal = target >= 100;
    if (reachedGoal) target = 100;
    if (target > p.pos) {
      while (p.pos < target) {
        p.pos++;
        positionTokens();
        SFX.tick();
        await sleep(Math.max(70, 150 - (target - p.pos) * 6));
      }
    }
    if (reachedGoal) { await winGame(p); return; }
    await resolveSpecial(p);
    if (p.pos >= 100) { await winGame(p); return; }
    if (state.mode === 'chaos' && Math.random() < 0.38) {
      await chaosEvent(p);
      if (p.pos >= 100) { await winGame(p); return; }
    }
    if (p.extra) {
      p.extra = false;
      addLog('🎁 ' + p.name + ' được tung thêm một lần nữa!', p.color);
      state.busy = false; beginTurn(); return;
    }
    state.busy = false;
    advanceTurn();
  }

  async function chaosEvent(p) {
    var roll = Math.random();
    if (roll < 0.20) {
      var d1 = 3 + rnd(12);
      p.pos = Math.min(99, p.pos + d1);
      addLog('🚀 ' + p.name + ' gặp Tên lửa — bay +' + d1 + ' ô!', p.color);
      SFX.boost(); positionTokens();
      await sleep(560); await resolveSpecial(p);
    } else if (roll < 0.40) {
      var d2 = 3 + rnd(12);
      p.pos = Math.max(1, p.pos - d2);
      addLog('🌀 ' + p.name + ' bị Lốc xoáy — lùi -' + d2 + ' ô!', p.color);
      SFX.snake(); positionTokens(); await sleep(560);
    } else if (roll < 0.58) {
      var others = state.players.filter(function (x) { return x !== p; });
      if (others.length) {
        var o = others[rnd(others.length)];
        var tmp = p.pos; p.pos = o.pos; o.pos = tmp;
        addLog('🔄 ' + p.name + ' hoán đổi vị trí với ' + o.name + '!', p.color);
        SFX.swap(); positionTokens();
        await sleep(620); await resolveSpecial(p); await resolveSpecial(o);
      }
    } else if (roll < 0.74) {
      p.skip = true;
      addLog('⏳ ' + p.name + ' bị Đóng băng — mất lượt kế tiếp!', p.color);
      beep(320, 0.3, 'sine', 0.05); await sleep(480);
    } else if (roll < 0.88) {
      p.extra = true;
      addLog('🎁 ' + p.name + ' nhận thêm 1 lượt!', p.color);
      beep(880, 0.16, 'sine', 0.055); await sleep(420);
    } else {
      var starts = Object.keys(LADDERS).map(Number).filter(function (x) { return x > p.pos; }).sort(function (a, b) { return a - b; });
      if (starts.length) {
        var s = starts[0];
        p.pos = s; positionTokens(); await sleep(400);
        addLog('✨ ' + p.name + ' được dẫn tới chân thang ' + s + '!', p.color);
        SFX.boost(); await resolveSpecial(p);
      } else {
        addLog('✨ ' + p.name + ' nhận may mắn nhỏ!', p.color);
        await sleep(300);
      }
    }
  }

  async function winGame(winner) {
    state.over = true; state.busy = true; setRollEnabled(false);
    positionTokens(); syncPlayerCards(); updateTurnPill();
    addLog('🏆 ' + winner.name + ' đã chạm ô 100 và chiến thắng!', winner.color);
    SFX.win(); confetti();
    var durationMs = Date.now() - state.startTime;
    var secs = Math.max(1, Math.round(durationMs / 1000));
    $('winEmoji').textContent = winner.bot ? '🤖' : '🏆';
    $('winTitle').textContent = winner.bot ? (winner.name + ' thắng!') : 'Bạn thắng rồi! 🎉';
    $('winSub').textContent = winner.bot ? 'Đừng buồn nhé, thử lại ván nữa nào!' : 'Tuyệt vời! Bạn đã leo tới tận ô 100.';
    $('statMoves').textContent = state.moves;
    $('statTime').textContent = fmtTime(secs);
    $('statMode').textContent = ({ classic: 'Cổ điển', speed: 'Tốc độ', chaos: 'Hỗn loạn' }[state.mode]);
    await saveScore({
      player_name: winner.name, mode: state.mode, player_count: state.count,
      moves: state.moves, duration_ms: durationMs, result: winner.bot ? 'bot' : 'human'
    });
    await refreshLeaderboards();
    await sleep(700);
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
    function loop() {
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
    }
    loop();
  }

  /* ============================ UI wiring ============================ */
  $('modeGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.mode-card');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    beep(720, 0.07, 'sine', 0.04);
  });
  $('countSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    state.count = +btn.dataset.count;
    beep(720, 0.07, 'sine', 0.04);
  });
  $('vsBot').addEventListener('change', function () { state.vsBot = this.checked; });
  $('startBtn').addEventListener('click', function () { ac(); startGame(); });
  $('rollBtn').addEventListener('click', function () { ac(); doRoll(); });
  $('quitBtn').addEventListener('click', function () {
    state.over = true; state.busy = true;
    $('gameScreen').hidden = true;
    $('setupScreen').hidden = false;
    $('winOverlay').hidden = true;
    refreshLeaderboards();
  });
  $('playAgainBtn').addEventListener('click', function () { $('winOverlay').hidden = true; startGame(); });
  $('homeBtn').addEventListener('click', function () {
    $('winOverlay').hidden = true;
    $('gameScreen').hidden = true;
    $('setupScreen').hidden = false;
    refreshLeaderboards();
  });
  $('soundBtn').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) beep(660, 0.08, 'sine', 0.05);
  });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && host.style.display !== 'none') {
      e.preventDefault();
      if (!$('rollBtn').disabled) { ac(); doRoll(); }
    }
  });
  window.addEventListener('resize', function () {
    var c = $('fx');
    if (c) { c.width = c.width; }
  });

  /* ============================ Open / Close ============================ */
  var prevBodyOverflow = '';
  function openGame() {
    prevBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('snake-game-open');
    host.style.display = 'block';
    closeBtn.style.display = 'grid';
    // reset scroll về đầu mỗi lần mở
    var app = shadow.getElementById('sgApp');
    if (app) app.scrollTop = 0;
  }
  function closeGame() {
    host.style.display = 'none';
    closeBtn.style.display = 'none';
    document.body.style.overflow = prevBodyOverflow;
    document.body.classList.remove('snake-game-open');
  }
  closeBtn.addEventListener('click', closeGame);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && host.style.display !== 'none') closeGame();
  });

  /* ============================ Init ============================ */
  try {
    var saved = localStorage.getItem('srank_player_name');
    if (saved) $('playerName').value = saved;
  } catch (e) {}

  dice0 = makeDice($('diceCube0'));
  dice1 = makeDice($('diceCube1'));
  refreshLeaderboards();

  /* Bind nút mở (có thể chưa render nếu script chạy trước) */
  function bindLauncher() {
    var launch = document.getElementById('snakeLadderBtn');
    if (launch && !launch.__sgBound) {
      launch.__sgBound = true;
      launch.addEventListener('click', openGame);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLauncher);
  } else {
    bindLauncher();
  }
})();