/* =====================================================================
   CỜ TỶ PHÚ — MONOPOLY (v2.0 — FULLSCREEN LANDSCAPE)
   Board game feel · Real effects · Mobile landscape lock
   ===================================================================== */
(function () {
  'use strict';
  if (window.__monopolyLoaded) return;
  window.__monopolyLoaded = true;

  /* ============================ CSS ============================ */
  var CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;overflow:hidden;height:100%;width:100%}
#mpApp{position:fixed;inset:0;font-family:'Nunito',system-ui,-apple-system,sans-serif;color:#2d1b3d;overflow:hidden;background:#0f0820;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
input,select{font-family:inherit}

/* ---------- AMBIENT BG ---------- */
#mpApp::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 20% 10%,rgba(245,158,11,.18),transparent 45%),radial-gradient(ellipse at 85% 90%,rgba(124,58,237,.2),transparent 45%),radial-gradient(ellipse at 50% 50%,rgba(34,201,138,.08),transparent 60%),linear-gradient(135deg,#1a0f2e 0%,#2d1b4e 50%,#1a0f2e 100%);pointer-events:none;z-index:0}
#mpApp::after{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;mix-blend-mode:overlay}

/* ---------- ROTATE HINT ---------- */
.rotate-hint{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:40px;background:linear-gradient(160deg,#0f0820,#2d1b4e);color:#fff;text-align:center;font-weight:800}
.rotate-hint .rot-icon{font-size:90px;animation:rotAnim 2s ease-in-out infinite;filter:drop-shadow(0 8px 20px rgba(245,158,11,.5))}
.rotate-hint h2{font-family:'Baloo 2',cursive;font-size:28px;margin:0;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent}
.rotate-hint p{margin:0;color:#b8a9d4;font-size:15px}
@keyframes rotAnim{0%,100%{transform:rotate(0)}50%{transform:rotate(90deg)}}
@media (orientation:portrait) and (max-width:900px){
  .rotate-hint{display:flex}
  .screen,.hud-floating{display:none!important}
}

/* ---------- FLOATING HUD ---------- */
.hud-floating{position:fixed;top:14px;right:14px;z-index:9000;display:flex;gap:8px}
.icon-btn{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:18px;background:linear-gradient(145deg,rgba(255,255,255,.95),rgba(255,248,239,.9));border:1px solid rgba(245,158,11,.4);box-shadow:0 6px 18px -8px rgba(0,0,0,.6),0 1px 0 rgba(255,255,255,.9) inset;transition:transform .18s cubic-bezier(.4,1.6,.6,1),box-shadow .18s}
.icon-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px -10px rgba(245,158,11,.6)}
.icon-btn:active{transform:scale(.94)}

/* ---------- SETUP SCREENS (centered card) ---------- */
.screen{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
.setup-card{max-width:520px;width:100%;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,250,242,.94));backdrop-filter:blur(20px) saturate(1.4);border-radius:28px;padding:32px;box-shadow:0 40px 100px -30px rgba(0,0,0,.7),0 0 0 1px rgba(245,158,11,.3),0 1px 0 rgba(255,255,255,.9) inset;animation:cardIn .5s cubic-bezier(.4,1.4,.6,1)}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
.setup-card .hero{text-align:center;margin-bottom:24px}
.setup-card .hero h1{margin:0 0 8px;font-family:'Baloo 2',cursive;font-size:36px;letter-spacing:-.5px;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 12px rgba(245,158,11,.35))}
.setup-card .hero p{margin:0;color:#7a6b93;font-size:14px;font-weight:600;line-height:1.5}
.setup-card h2{margin:0 0 16px;font-family:'Baloo 2',cursive;font-size:22px;color:#2d1b3d;text-align:center}
.field{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.field>label{font-size:11px;font-weight:900;color:#a898c0;text-transform:uppercase;letter-spacing:1.2px}
.play-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.play-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;border-radius:20px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.2);cursor:pointer;font-weight:800;color:#6b5b85;font-size:15px;transition:all .22s cubic-bezier(.4,1.4,.6,1)}
.play-card:hover{border-color:rgba(245,158,11,.5);transform:translateY(-2px);box-shadow:0 10px 24px -12px rgba(245,158,11,.4)}
.play-card.active{border-color:#f59e0b;background:linear-gradient(160deg,#fff8ef,#ffefd4);color:#b45309;box-shadow:0 12px 28px -12px rgba(245,158,11,.55),0 0 0 3px rgba(245,158,11,.12);transform:translateY(-2px)}
.play-card .icon{font-size:28px}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:16px;font-weight:800;font-size:15px;letter-spacing:.2px;transition:transform .18s cubic-bezier(.4,1.6,.6,1),box-shadow .18s,filter .18s;position:relative;overflow:hidden}
.btn::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.25),transparent 45%);pointer-events:none;border-radius:inherit}
.btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.03)}
.btn:active:not(:disabled){transform:scale(.97)}
.btn:disabled{opacity:.5;cursor:not-allowed;filter:grayscale(.2)}
.btn-primary{color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 35%,#ef4444);box-shadow:0 10px 28px -10px rgba(239,68,68,.7),0 4px 10px -4px rgba(245,158,11,.5),0 1px 0 rgba(255,255,255,.4) inset}
.btn-primary:hover:not(:disabled){box-shadow:0 14px 36px -12px rgba(239,68,68,.8),0 6px 14px -4px rgba(245,158,11,.6)}
.btn-ghost{background:linear-gradient(145deg,#fff,#fff8ef);color:#6b5b85;border:1px solid rgba(245,158,11,.4);box-shadow:0 2px 6px -2px rgba(150,90,40,.12),0 1px 0 rgba(255,255,255,.9) inset}
.btn-ghost.active{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-color:transparent;box-shadow:0 8px 20px -8px rgba(239,68,68,.55)}
.btn-lg{padding:16px 28px;font-size:16px;width:100%;border-radius:18px}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:12px}

.room-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.25);margin-bottom:10px;transition:all .2s}
.room-item:hover{border-color:rgba(245,158,11,.5);box-shadow:0 8px 20px -12px rgba(245,158,11,.4)}
.room-item-info{flex:1;min-width:0}
.room-item-host{font-size:14px;font-weight:900;color:#2d1b3d}
.room-item-meta{font-size:12px;color:#8a7aa6;font-weight:700;margin-top:2px}
.room-item-join{padding:9px 18px;border-radius:12px;font-weight:900;font-size:13px;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);box-shadow:0 6px 16px -8px rgba(239,68,68,.6)}
.room-item-join:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.waiting-player{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.2);margin-bottom:8px;font-weight:800}
.waiting-player img{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 2px #fff,0 4px 12px -4px rgba(0,0,0,.2)}

/* =====================================================
   GAME SCREEN — FULLSCREEN LANDSCAPE
   ===================================================== */
.game-screen{position:absolute;inset:0;z-index:10;display:grid;grid-template-rows:auto 1fr;grid-template-areas:"top" "arena";overflow:hidden;animation:fadeIn .3s ease-out}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* ---------- TOP HUD ---------- */
.hud-top{grid-area:top;display:flex;align-items:center;gap:14px;padding:10px 16px;background:linear-gradient(180deg,rgba(15,8,32,.6),rgba(15,8,32,.2));backdrop-filter:blur(12px);border-bottom:1px solid rgba(245,158,11,.15);z-index:20}
.hud-brand{font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;letter-spacing:-.3px;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent;flex-shrink:0;display:flex;align-items:center;gap:8px}
.hud-brand .badge{font-size:9px;padding:3px 8px;border-radius:999px;color:#fff;background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-text-fill-color:#fff;letter-spacing:.5px;font-weight:900}
.players-bar{display:flex;align-items:center;gap:8px;flex:1;overflow-x:auto;padding:2px;scrollbar-width:none}
.players-bar::-webkit-scrollbar{display:none}
.hud-actions{display:flex;gap:6px;flex-shrink:0}
.hud-actions .icon-btn{width:38px;height:38px;font-size:16px}

/* ---------- PLAYER CARD (horizontal pill) ---------- */
.pcard{display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;background:linear-gradient(160deg,rgba(255,255,255,.96),rgba(255,250,242,.92));border:2px solid transparent;flex-shrink:0;transition:all .25s cubic-bezier(.4,1.4,.6,1);position:relative;box-shadow:0 2px 8px -3px rgba(0,0,0,.4)}
.pcard.active{border-color:var(--c);background:linear-gradient(100deg,var(--soft),#fff 70%);transform:translateY(-1px);box-shadow:0 8px 22px -8px var(--c),0 0 0 3px color-mix(in srgb,var(--c) 15%,transparent);animation:activePulse 2s ease-in-out infinite}
@keyframes activePulse{0%,100%{box-shadow:0 8px 22px -8px var(--c),0 0 0 3px color-mix(in srgb,var(--c) 15%,transparent)}50%{box-shadow:0 8px 28px -6px var(--c),0 0 0 5px color-mix(in srgb,var(--c) 20%,transparent)}}
.pcard.bankrupt{opacity:.4;text-decoration:line-through;filter:grayscale(.9)}
.pcard img{width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 2px var(--c);flex-shrink:0}
.pcard .pc-info{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.pcard .pname{font-size:11px;font-weight:900;color:#2d1b3d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.pcard .pmoney{font-size:11px;font-weight:900;color:#16a34a;letter-spacing:.2px}
.pcard .pjail{position:absolute;top:-4px;right:-4px;font-size:14px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}

/* ---------- ARENA ---------- */
.game-arena{grid-area:arena;display:grid;grid-template-columns:1fr clamp(180px,20vw,280px);gap:12px;padding:12px 16px 16px;min-height:0;overflow:hidden}

/* ---------- BOARD ---------- */
.board-stage{display:grid;place-items:center;min-width:0;min-height:0;overflow:hidden;animation:boardIn .6s cubic-bezier(.4,1.4,.6,1)}
@keyframes boardIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
.board{position:relative;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.15),transparent 50%),radial-gradient(circle at 70% 80%,rgba(245,158,11,.12),transparent 50%),linear-gradient(135deg,#1a0f2e 0%,#2d1b4e 50%,#1a0f2e 100%);border-radius:20px;padding:8px;box-shadow:0 0 0 2px rgba(245,158,11,.3),0 0 0 6px rgba(15,8,32,.8),0 40px 100px -30px rgba(0,0,0,.9),inset 0 0 60px rgba(245,158,11,.08)}
.board::before{content:"";position:absolute;inset:4px;border-radius:16px;pointer-events:none;background:linear-gradient(135deg,rgba(245,158,11,.15),transparent 40%,rgba(124,58,237,.1));z-index:0}
.board-grid{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:100%;height:100%;gap:3px;position:relative;z-index:1}

/* ---------- TILES ---------- */
.tile{position:relative;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(7px,1.3vmin,11px);font-weight:800;overflow:hidden;border:1px solid rgba(0,0,0,.15);transition:transform .18s,box-shadow .18s;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 0 rgba(0,0,0,.1)}
.tile.corner{border-radius:10px;font-size:clamp(10px,1.9vmin,16px)}
.tile.start{background:linear-gradient(135deg,#22c98a,#16a34a);color:#fff;box-shadow:0 0 20px -4px rgba(34,201,138,.6),inset 0 1px 0 rgba(255,255,255,.3)}
.tile.jail{background:linear-gradient(135deg,#6b7280,#374151);color:#fff;box-shadow:0 0 20px -4px rgba(107,114,128,.5),inset 0 1px 0 rgba(255,255,255,.2)}
.tile.reward{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;box-shadow:0 0 24px -2px rgba(245,158,11,.7),inset 0 1px 0 rgba(255,255,255,.35);animation:cornerGlow 3s ease-in-out infinite}
.tile.teleport{background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;box-shadow:0 0 24px -2px rgba(124,58,237,.7),inset 0 1px 0 rgba(255,255,255,.3);animation:cornerGlow 3s ease-in-out infinite}
@keyframes cornerGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
.tile.prop{background:#fff}
.tile.prop.z0{background:linear-gradient(180deg,#93c5fd 0%,#dbeafe 25%,#fff 28%)}
.tile.prop.z1{background:linear-gradient(180deg,#6ee7b7 0%,#d1fae5 25%,#fff 28%)}
.tile.prop.z2{background:linear-gradient(180deg,#fdba74 0%,#fed7aa 25%,#fff 28%)}
.tile.prop.z3{background:linear-gradient(180deg,#fca5a5 0%,#fecaca 25%,#fff 28%)}
.tile.highlight{box-shadow:inset 0 0 0 2px #f59e0b,0 0 24px rgba(245,158,11,.6);animation:targetPulse 1.4s ease-in-out infinite;z-index:2}
@keyframes targetPulse{0%,100%{box-shadow:inset 0 0 0 2px #f59e0b,0 0 24px rgba(245,158,11,.6)}50%{box-shadow:inset 0 0 0 2px #fbbf24,0 0 40px rgba(245,158,11,.9)}}
.tile-num{position:absolute;top:1px;left:2px;font-size:clamp(6px,1vmin,9px);color:rgba(0,0,0,.35);font-weight:900}
.tile-owner{width:clamp(14px,2.2vmin,20px);height:clamp(14px,2.2vmin,20px);border-radius:50%;border:2px solid #fff;margin-top:2px;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .2s}
.tile:hover .tile-owner{transform:scale(1.2)}
.tile-level{display:flex;gap:1.5px;margin-top:2px}
.tile-level span{width:clamp(3px,.6vmin,5px);height:clamp(3px,.6vmin,5px);border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 0 4px rgba(239,68,68,.7)}
.tile-players{position:absolute;bottom:1px;left:50%;transform:translateX(-50%);display:flex;gap:1px;z-index:3}
.tile-players img{width:clamp(12px,2vmin,16px);height:clamp(12px,2vmin,16px);border-radius:50%;border:1.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);animation:pawnDrop .35s cubic-bezier(.4,1.6,.6,1)}
.tile-players img.hopping{animation:pawnHop .35s ease-out}
@keyframes pawnDrop{from{transform:scale(0) translateY(-10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
@keyframes pawnHop{0%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.2)}100%{transform:translateY(0) scale(1)}}

/* ---------- CENTER INFO ---------- */
.center-info{grid-column:2/8;grid-row:2/8;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#fffef5,#fef3c7 55%,#fde68a 100%);border-radius:14px;padding:14px;text-align:center;position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(245,158,11,.15),inset 0 0 60px rgba(245,158,11,.12),0 0 40px rgba(245,158,11,.15)}
.center-info::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.6),transparent 40%),radial-gradient(circle at 50% 100%,rgba(245,158,11,.2),transparent 60%);pointer-events:none}
.center-info::after{content:"";position:absolute;inset:-50%;background:conic-gradient(from 0deg,transparent 0deg,rgba(245,158,11,.15) 90deg,transparent 180deg,rgba(245,158,11,.15) 270deg,transparent 360deg);animation:centerSpin 20s linear infinite;pointer-events:none;opacity:.4}
@keyframes centerSpin{to{transform:rotate(360deg)}}
.center-info>*{position:relative;z-index:1}
.center-info h3{margin:0;font-family:'Baloo 2',cursive;font-size:clamp(18px,3vmin,28px);color:#f59e0b;filter:drop-shadow(0 3px 6px rgba(245,158,11,.4))}
.center-info .dice-big{font-size:clamp(36px,7vmin,64px);line-height:1;margin:6px 0;filter:drop-shadow(0 6px 12px rgba(0,0,0,.2));animation:diceIdle 3s ease-in-out infinite}
@keyframes diceIdle{0%,100%{transform:rotate(-4deg) scale(1)}50%{transform:rotate(4deg) scale(1.05)}}
.center-info .turn-info{font-size:clamp(10px,1.6vmin,14px);font-weight:900;color:#666;margin-top:2px}

/* ---------- SIDE PANEL ---------- */
.side-panel{display:flex;flex-direction:column;gap:10px;min-height:0;overflow:hidden}
.turn-pill{padding:10px 16px;border-radius:14px;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,250,242,.94));border:2px solid #f59e0b;font-weight:900;font-size:13px;text-align:center;box-shadow:0 6px 20px -8px rgba(245,158,11,.5);flex-shrink:0;animation:pillGlow 2s ease-in-out infinite}
@keyframes pillGlow{0%,100%{box-shadow:0 6px 20px -8px rgba(245,158,11,.5)}50%{box-shadow:0 6px 30px -6px rgba(245,158,11,.8)}}

.dice-box{background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,250,242,.94));border-radius:20px;padding:16px;text-align:center;box-shadow:0 12px 30px -14px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.25);flex-shrink:0}
.dice-cube{font-size:clamp(48px,8vmin,72px);line-height:1;margin:8px 0;transition:transform .5s cubic-bezier(.4,1.6,.6,1);filter:drop-shadow(0 8px 16px rgba(0,0,0,.25));display:inline-block;perspective:400px}
.dice-cube.rolling{animation:diceRoll .8s cubic-bezier(.4,0,.2,1)}
@keyframes diceRoll{0%{transform:rotateX(0) rotateY(0) rotateZ(0) scale(1)}25%{transform:rotateX(180deg) rotateY(90deg) rotateZ(45deg) scale(1.25)}50%{transform:rotateX(360deg) rotateY(180deg) rotateZ(90deg) scale(.9)}75%{transform:rotateX(540deg) rotateY(270deg) rotateZ(135deg) scale(1.2)}100%{transform:rotateX(720deg) rotateY(360deg) rotateZ(180deg) scale(1)}}
.dice-cube.settled{animation:diceSettle .35s cubic-bezier(.4,1.6,.6,1)}
@keyframes diceSettle{0%{transform:scale(1.3)}60%{transform:scale(.92)}100%{transform:scale(1)}}

.roll-btn{width:100%;padding:14px;border-radius:14px;font-weight:900;font-size:15px;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 35%,#ef4444);box-shadow:0 10px 24px -8px rgba(239,68,68,.7),inset 0 1px 0 rgba(255,255,255,.4);transition:transform .18s,box-shadow .18s;letter-spacing:.5px;position:relative;overflow:hidden}
.roll-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 45%);pointer-events:none}
.roll-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 32px -10px rgba(239,68,68,.8)}
.roll-btn:active:not(:disabled){transform:scale(.97)}
.roll-btn:disabled{opacity:.5;cursor:not-allowed;filter:grayscale(.3)}
.roll-info{font-size:11px;font-weight:800;color:#8a7aa6;margin-top:8px;padding:6px 10px;border-radius:10px;background:rgba(255,248,239,.7);min-height:16px}

.log-box{flex:1;min-height:0;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,250,242,.94));border-radius:16px;padding:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 30px -14px rgba(0,0,0,.5),0 0 0 1px rgba(245,158,11,.2)}
.log-title{font-size:10px;font-weight:900;color:#a898c0;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;flex-shrink:0}
.log{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;font-size:10.5px;padding-right:4px;scrollbar-width:thin;scrollbar-color:rgba(245,158,11,.3) transparent;min-height:0}
.log::-webkit-scrollbar{width:4px}
.log::-webkit-scrollbar-thumb{background:rgba(245,158,11,.3);border-radius:2px}
.log-item{padding:6px 9px;border-radius:7px;background:linear-gradient(90deg,#fff,#fffaf2);border-left:3px solid #f59e0b;line-height:1.35;box-shadow:0 1px 3px -1px rgba(0,0,0,.08);animation:logIn .3s ease-out;flex-shrink:0}
@keyframes logIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}

/* ---------- MONEY FLOAT ---------- */
.money-float{position:fixed;font-size:18px;font-weight:900;pointer-events:none;z-index:9500;text-shadow:0 2px 8px rgba(0,0,0,.3),0 0 12px currentColor;animation:moneyRise 1.4s cubic-bezier(.4,0,.2,1) forwards;white-space:nowrap}
@keyframes moneyRise{0%{opacity:0;transform:translate(-50%,0) scale(.5)}20%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-60px) scale(.95)}}

/* ---------- TURN BANNER ---------- */
.turn-banner{position:fixed;top:35%;left:50%;transform:translate(-50%,-50%) scale(0);font-family:'Baloo 2',cursive;font-size:clamp(22px,4vmin,36px);font-weight:800;padding:16px 44px;border-radius:999px;background:rgba(255,255,255,.97);color:#2d1b3d;box-shadow:0 30px 80px -20px rgba(0,0,0,.6),0 0 0 2px currentColor,inset 0 1px 0 rgba(255,255,255,.9);opacity:0;transition:all .4s cubic-bezier(.4,1.6,.6,1);pointer-events:none;z-index:9000;white-space:nowrap;backdrop-filter:blur(10px)}
.turn-banner.show{opacity:1;transform:translate(-50%,-50%) scale(1);animation:bannerBounce .5s ease-out}
@keyframes bannerBounce{0%{transform:translate(-50%,-50%) scale(.6)}60%{transform:translate(-50%,-50%) scale(1.08)}100%{transform:translate(-50%,-50%) scale(1)}}

/* ---------- CONFETTI ---------- */
.confetti{position:fixed;width:10px;height:10px;top:-20px;pointer-events:none;z-index:9999;animation:confettiFall linear forwards;border-radius:2px}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}

/* ---------- SCREEN SHAKE ---------- */
@keyframes screenShake{0%,100%{transform:translate(0,0)}10%{transform:translate(-6px,-4px)}20%{transform:translate(6px,4px)}30%{transform:translate(-4px,6px)}40%{transform:translate(4px,-6px)}50%{transform:translate(-3px,3px)}60%{transform:translate(3px,-3px)}70%{transform:translate(-2px,-2px)}80%{transform:translate(2px,2px)}90%{transform:translate(-1px,1px)}}

/* ---------- MODALS ---------- */
.mp-overlay{position:fixed;inset:0;z-index:8500;display:grid;place-items:center;padding:20px;background:rgba(15,8,32,.75);backdrop-filter:blur(12px) saturate(1.3);-webkit-backdrop-filter:blur(12px) saturate(1.3);animation:mpFade .22s ease-out;overflow-y:auto}
@keyframes mpFade{from{opacity:0}to{opacity:1}}
.mp-modal{background:linear-gradient(160deg,#fff,#fffaf2);border-radius:24px;padding:26px;width:min(440px,100%);box-shadow:0 40px 100px -30px rgba(0,0,0,.85),0 0 0 1px rgba(245,158,11,.35),0 1px 0 rgba(255,255,255,.95) inset;text-align:center;animation:modalPop .35s cubic-bezier(.4,1.4,.6,1);margin:auto}
@keyframes modalPop{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:none}}
.mp-modal h2{margin:0 0 8px;font-family:'Baloo 2',cursive;font-size:23px;color:#f59e0b;letter-spacing:-.3px}
.mp-modal .sub{color:#8a7aa6;font-size:13px;font-weight:700;margin-bottom:16px}
.mp-modal .prop-info{background:linear-gradient(135deg,#fff8ef,#ffefd4);padding:16px;border-radius:16px;margin:14px 0;font-size:13px;font-weight:700;line-height:1.7;border:1px solid rgba(245,158,11,.25);box-shadow:inset 0 2px 8px -4px rgba(245,158,11,.2)}
.mp-modal .prop-info .row{display:flex;justify-content:space-between;margin:3px 0}
.mp-modal .prop-info .row b{color:#e6820a;font-weight:900}
.mp-modal .actions{display:flex;flex-direction:column;gap:9px;margin-top:16px}
.mp-modal .actions .btn{width:100%}
.mp-modal .actions .btn-buy{background:linear-gradient(135deg,#22c98a,#16a34a);color:#fff;box-shadow:0 10px 24px -10px rgba(22,163,74,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-rent{background:linear-gradient(135deg,#4f8dff,#2563eb);color:#fff;box-shadow:0 10px 24px -10px rgba(37,99,235,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 10px 24px -10px rgba(220,38,38,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-skip{background:linear-gradient(145deg,#f3f4f6,#e5e7eb);color:#6b7280;border:1px solid #d1d5db;box-shadow:0 1px 0 rgba(255,255,255,.7) inset}

.win-card{background:linear-gradient(160deg,#fff,#fffaf2);padding:32px;border-radius:28px;text-align:center;width:min(420px,92%);box-shadow:0 40px 100px -30px rgba(0,0,0,.85),0 0 0 2px rgba(245,158,11,.4),0 0 80px rgba(245,158,11,.3);animation:modalPop .5s cubic-bezier(.4,1.4,.6,1);margin:auto}
.win-card .emoji{font-size:76px;margin-bottom:12px;animation:emojiBounce 1.2s ease-in-out infinite;filter:drop-shadow(0 12px 24px rgba(245,158,11,.5))}
@keyframes emojiBounce{0%,100%{transform:translateY(0) rotate(-5deg) scale(1)}50%{transform:translateY(-12px) rotate(5deg) scale(1.08)}}
.win-card h2{margin:0 0 10px;font-family:'Baloo 2',cursive;font-size:28px;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent}
.win-card p{color:#8a7aa6;margin:0 0 22px;font-weight:700;font-size:15px}

.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(24px);padding:13px 24px;border-radius:999px;background:linear-gradient(135deg,#2d1b4e,#1a0f2e);color:#fff;font-weight:800;font-size:14px;z-index:9700;opacity:0;pointer-events:none;transition:all .32s cubic-bezier(.4,1.4,.6,1);box-shadow:0 16px 36px -12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1);border:1px solid rgba(245,158,11,.3)}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

#debugPanel{position:fixed;top:56px;right:8px;z-index:9800;width:min(400px,calc(100vw - 16px));max-height:calc(100vh - 72px);overflow-y:auto;background:linear-gradient(160deg,rgba(12,8,24,.98),rgba(20,10,30,.98));color:#d0f5d0;padding:14px;border-radius:16px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;line-height:1.55;border:1px solid rgba(0,255,0,.4);box-shadow:0 24px 60px -20px rgba(0,0,0,.7),0 0 40px rgba(0,255,136,.15)}
#debugPanel .dbg-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid rgba(0,255,0,.3);font-weight:900;color:#00ff88}
#debugPanel .dbg-head button{padding:5px 9px;border-radius:7px;background:rgba(0,255,136,.12);color:#00ff88;font-size:10px;font-weight:800;border:1px solid rgba(0,255,136,.4);margin-left:4px}
#debugPanel pre{white-space:pre-wrap;word-break:break-all;margin:6px 0;background:rgba(0,0,0,.55);padding:8px;border-radius:6px;font-size:10px;max-height:200px;overflow-y:auto;color:#b0d0b0}
#debugPanel .kv{display:flex;gap:6px;padding:3px 0;font-size:10px}
#debugPanel .kv .k{color:#7eb4ff;min-width:70px;font-weight:700}
#debugPanel .kv .v{color:#d0f5d0;flex:1;word-break:break-all}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

  /* ============================ HTML ============================ */
  var HTML = `
<div id="mpApp">

  <div class="rotate-hint" id="rotateHint">
    <div class="rot-icon">📱</div>
    <h2>Xoay ngang màn hình</h2>
    <p>Game cần chế độ ngang để hiển thị đẹp nhất</p>
  </div>

  <div class="hud-floating">
    <button class="icon-btn" id="soundBtn" title="Âm thanh">🔊</button>
    <button class="icon-btn" id="debugBtn" title="Debug">🐞</button>
  </div>

  <!-- ============ MENU ============ -->
  <section id="menuScreen" class="screen">
    <div class="setup-card">
      <div class="hero">
        <h1>🎩 Cờ Tỷ Phú</h1>
        <p>Mua nhà, cướp đất, phá sản đối thủ — ai sống cuối cùng là tỷ phú!</p>
      </div>
      <div class="field" style="text-align:center;margin-top:16px">
        <label>Chào mừng</label>
        <div id="myDisplayName" style="font-size:20px;font-weight:900;color:#f59e0b">...</div>
      </div>
      <div class="field" style="margin-top:20px"><label>Kiểu chơi</label>
        <div class="play-mode-grid" id="playModeGrid">
          <button class="play-card active" data-playmode="bot"><span class="icon">🤖</span>Đấu Bot</button>
          <button class="play-card" data-playmode="online"><span class="icon">🌐</span>Online</button>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="continueBtn" style="margin-top:22px">Tiếp tục →</button>
    </div>
  </section>

  <!-- ============ ONLINE ============ -->
  <section id="onlineScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🌐 Phòng chơi</h2>
      <button class="btn btn-primary btn-lg" id="createRoomBtn">➕ Tạo phòng mới</button>
      <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
        <b style="font-size:13px;color:#6b5b85">Phòng đang chờ</b>
        <button class="btn btn-ghost btn-sm" id="refreshRoomsBtn">↻ Làm mới</button>
      </div>
      <div id="roomsList" style="margin-top:10px"></div>
      <button class="btn btn-ghost btn-lg" id="backFromOnlineBtn" style="margin-top:20px">← Quay lại</button>
    </div>
  </section>

  <!-- ============ WAITING ============ -->
  <section id="waitingScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>⏳ Phòng chờ</h2>
      <div style="font-weight:800;margin:16px 0 8px;font-size:14px">👥 Người chơi (<span id="waitingCount">0</span>/4)</div>
      <div id="waitingPlayers"></div>
      <div id="hostControls">
        <button class="btn btn-primary btn-lg" id="hostStartBtn" disabled>⏳ Cần 2 người</button>
      </div>
      <button class="btn btn-ghost btn-lg" id="leaveRoomBtn" style="margin-top:10px">Rời phòng</button>
    </div>
  </section>

  <!-- ============ LOCAL SETUP ============ -->
  <section id="localSetupScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🤖 Đấu với Bot</h2>
      <div class="field" style="margin-top:16px"><label>Số Bot</label>
        <div style="display:flex;gap:10px" id="botCountSeg">
          <button class="btn btn-ghost active" data-c="1" style="flex:1">1 Bot</button>
          <button class="btn btn-ghost" data-c="2" style="flex:1">2 Bot</button>
          <button class="btn btn-ghost" data-c="3" style="flex:1">3 Bot</button>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="startLocalBtn" style="margin-top:24px">🚀 Bắt đầu</button>
      <button class="btn btn-ghost btn-lg" id="backFromLocalBtn" style="margin-top:10px">← Quay lại</button>
    </div>
  </section>

  <!-- ============ GAME (FULLSCREEN LANDSCAPE) ============ -->
  <section id="gameScreen" class="game-screen" hidden>
    <div class="hud-top">
      <div class="hud-brand"><span>🎩</span><span>Cờ Tỷ Phú</span><span class="badge">MONOPOLY</span></div>
      <div class="players-bar" id="playerList"></div>
      <div class="hud-actions">
        <button class="icon-btn" id="quitBtn" title="Thoát">✕</button>
      </div>
    </div>
    <div class="game-arena">
      <div class="board-stage" id="boardStage">
        <div class="board" id="board"><div class="board-grid" id="boardGrid"></div></div>
      </div>
      <aside class="side-panel">
        <div class="turn-pill" id="turnPill">...</div>
        <div class="dice-box">
          <div class="dice-cube" id="diceCube">🎲</div>
          <button class="roll-btn" id="rollBtn">🎲 TUNG XÚC XẮC</button>
          <div class="roll-info" id="rollInfo">...</div>
        </div>
        <div class="log-box">
          <div class="log-title">📜 Nhật ký</div>
          <div class="log" id="log"></div>
        </div>
      </aside>
    </div>
    <div class="turn-banner" id="turnBanner"></div>
  </section>

  <div class="mp-overlay" id="actionOverlay" hidden>
    <div class="mp-modal" id="actionModal"></div>
  </div>

  <div class="mp-overlay" id="winOverlay" hidden>
    <div class="win-card">
      <div class="emoji" id="winEmoji">🏆</div>
      <h2 id="winTitle">Chiến thắng!</h2>
      <p id="winSub">...</p>
      <button class="btn btn-primary btn-lg" id="playAgainBtn">🏠 Về sảnh</button>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <div id="debugPanel" hidden>
    <div class="dbg-head">
      <span>🐞 DEBUG</span>
      <div><button id="dbgCopy">📋</button><button id="dbgForce">🔄</button><button id="dbgClose">✕</button></div>
    </div>
    <div id="dbgBody"></div>
  </div>
</div>
`;

  /* ============================ SHADOW HOST ============================ */
  var host = document.createElement('div');
  host.id = 'monopolyHost';
  host.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;';
  var shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>' + CSS + '</style>' + HTML;
  document.body.appendChild(host);

  var closeBtn = document.createElement('button');
  closeBtn.id = 'monopolyClose';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'display:none';
  document.body.appendChild(closeBtn);

  var $ = function (id) { return shadow.getElementById(id); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtMoney(n) { return '$' + (n || 0).toLocaleString('en-US'); }
  function avt(s) { return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(s) + '&backgroundColor=ffd5dc,b6e3f4,d1d4f9&radius=14'; }
  function toast(msg) {
    var el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  /* ============================ CONFIG ============================ */
  var FALLBACK = {
    URL: 'https://tumjcsaexddioecwjolp.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ'
  };
  var CFG = window.__SRANK_CONFIG || FALLBACK;
  var sb = null;
  if (window.supabase && CFG.SUPABASE_URL) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });

  /* ============================ BOARD CONSTANTS ============================ */
  var ZONES = [
    { name: 'Nhà nghèo', price: 10000, color: '#7eb4ff', soft: '#dbeafe' },
    { name: 'Nhà giàu', price: 15000, color: '#22c98a', soft: '#d1fae5' },
    { name: 'Địa chủ', price: 20000, color: '#f6a723', soft: '#fed7aa' },
    { name: 'Đại gia', price: 25000, color: '#ef4444', soft: '#fecaca' }
  ];
  var ZONE_RANGES = [
    { start: 1, end: 6 },
    { start: 8, end: 13 },
    { start: 15, end: 20 },
    { start: 22, end: 27 }
  ];
  var PLAYER_COLORS = [
    { c: '#ff5fa2', s: '#ffe4f1' },
    { c: '#4f8dff', s: '#e0edff' },
    { c: '#18c08a', s: '#dcf9ee' },
    { c: '#f6a723', s: '#ffefd4' }
  ];
  var BOT_NAMES = ['RoboRicher', 'Cáo Vàng', 'Tỷ Phú Nhí'];
  var DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  function initTiles() {
    var tiles = [];
    for (var i = 0; i < 28; i++) {
      if (i === 0) tiles.push({ type: 'start' });
      else if (i === 7) tiles.push({ type: 'jail' });
      else if (i === 14) tiles.push({ type: 'reward' });
      else if (i === 21) tiles.push({ type: 'teleport' });
      else {
        var zone = 0;
        for (var z = 0; z < 4; z++) {
          if (i >= ZONE_RANGES[z].start && i <= ZONE_RANGES[z].end) { zone = z; break; }
        }
        tiles.push({ type: 'prop', zone: zone, owner: null, level: 1 });
      }
    }
    return tiles;
  }
  function tileRowCol(i) {
    if (i <= 7) return { row: 1, col: i + 1 };
    if (i <= 14) return { row: i - 6, col: 8 };
    if (i <= 21) return { row: 8, col: 22 - i };
    return { row: 29 - i, col: 1 };
  }

  /* ============================ STATE ============================ */
  var state = {
    playMode: 'bot',
    botCount: 1,
    game: null,
    busy: false,
    animating: false
  };
  var myUsername = '', myProfile = null;
  var room = null, roomPlayers = [];
  var roomChan = null, roomsChan = null, pollTimer = null;
  var isHost = false;
  var debugOpen = false, dbgEvents = [], lastStaleVer = -1;

  function dbgEvent(type, detail) {
    dbgEvents.push({ time: new Date(), type: type, detail: detail || '' });
    if (dbgEvents.length > 60) dbgEvents.shift();
    if (window.console) console.log('[MP]', type, detail || '');
    if (debugOpen) renderDbg();
  }

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

  /* ============================ AUDIO ============================ */
  var actx = null, sfxOn = true;
  function beep(f, d, t, v) {
    if (!sfxOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = t || 'sine'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v || .04, t0 + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + d + .05);
    } catch (e) {}
  }
  var sfx = {
    roll: function () { for (var i = 0; i < 6; i++) setTimeout(function () { beep(280 + rnd(240), .05, 'square', .03); }, i * 55); },
    step: function () { beep(620 + rnd(180), .05, 'sine', .025); },
    land: function () { beep(400, .12, 'sine', .05); setTimeout(function () { beep(600, .16, 'sine', .05); }, 60); },
    buy: function () { [523, 659, 784].forEach(function (f, i) { setTimeout(function () { beep(f, .12, 'sine', .06); }, i * 80); }); },
    pay: function () { [400, 350, 300].forEach(function (f, i) { setTimeout(function () { beep(f, .12, 'triangle', .045); }, i * 80); }); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { beep(f, .22, 'sine', .06); }, i * 100); }); },
    lose: function () { [440, 370, 311, 261].forEach(function (f, i) { setTimeout(function () { beep(f, .22, 'sawtooth', .05); }, i * 110); }); }
  };

  /* ============================ ANIMATION HELPERS ============================ */
  function fitBoard() {
    var stage = $('boardStage');
    var board = $('board');
    if (!stage || !board) return;
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    var size = Math.max(100, Math.min(w, h) - 8);
    board.style.width = size + 'px';
    board.style.height = size + 'px';
  }

  function showTurnBanner(name, color) {
    var b = $('turnBanner'); if (!b) return;
    b.textContent = '👉 ' + name;
    b.style.color = color || '#f59e0b';
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(b._t);
    b._t = setTimeout(function () { b.classList.remove('show'); }, 1600);
  }

  function showMoneyFloat(username, amount) {
    var card = shadow.querySelector('.pcard[data-user="' + username + '"]');
    if (!card) return;
    var rect = card.getBoundingClientRect();
    var f = document.createElement('div');
    f.className = 'money-float';
    f.textContent = (amount > 0 ? '+' : '−') + '$' + Math.abs(amount).toLocaleString();
    f.style.left = (rect.left + rect.width / 2) + 'px';
    f.style.top = (rect.bottom + 4) + 'px';
    f.style.color = amount > 0 ? '#16a34a' : '#ef4444';
    shadow.appendChild(f);
    setTimeout(function () { try { f.remove(); } catch (e) {} }, 1500);
  }

  function screenShake() {
    host.style.animation = 'none';
    void host.offsetWidth;
    host.style.animation = 'screenShake .6s ease-out';
    setTimeout(function () { host.style.animation = ''; }, 620);
  }

  function spawnConfetti(count) {
    var colors = ['#fbbf24','#f59e0b','#ef4444','#22c98a','#4f8dff','#a78bfa','#ff5fa2','#ffffff'];
    for (var i = 0; i < count; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = (Math.random() * 100) + '%';
      c.style.background = colors[rnd(colors.length)];
      c.style.width = (6 + Math.random() * 8) + 'px';
      c.style.height = (6 + Math.random() * 10) + 'px';
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      c.style.animationDuration = (2 + Math.random() * 2.5) + 's';
      c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      if (Math.random() > 0.6) c.style.borderRadius = '50%';
      shadow.appendChild(c);
      (function (el) { setTimeout(function () { try { el.remove(); } catch (e) {} }, 5500); })(c);
    }
  }

  /* ============================ BOARD RENDER ============================ */
  function renderBoard() {
    if (!state.game) return;
    var grid = $('boardGrid'); grid.innerHTML = '';
    for (var i = 0; i < 28; i++) {
      var rc = tileRowCol(i);
      var tile = state.game.tiles[i];
      var el = document.createElement('div');
      el.className = 'tile';
      el.style.gridRow = rc.row; el.style.gridColumn = rc.col;
      el.dataset.idx = i;
      var inner = '<span class="tile-num">' + i + '</span>';
      if (tile.type === 'start') { el.className += ' corner start'; inner += '<span>🏁</span><span style="font-size:8px">START</span>'; }
      else if (tile.type === 'jail') { el.className += ' corner jail'; inner += '<span>🚔</span><span style="font-size:8px">JAIL</span>'; }
      else if (tile.type === 'reward') { el.className += ' corner reward'; inner += '<span>🎁</span><span style="font-size:8px">REWARD</span>'; }
      else if (tile.type === 'teleport') { el.className += ' corner teleport'; inner += '<span>🌀</span><span style="font-size:8px">WARP</span>'; }
      else if (tile.type === 'prop') {
        el.className += ' prop z' + tile.zone;
        var owner = tile.owner ? state.game.players.find(function (p) { return p.username === tile.owner; }) : null;
        if (owner) {
          inner += '<div class="tile-owner" style="background:' + owner.color + '" title="' + esc(owner.name) + '"></div>';
          var dots = '';
          for (var l = 0; l < tile.level; l++) dots += '<span></span>';
          inner += '<div class="tile-level">' + dots + '</div>';
        } else {
          inner += '<div style="font-size:clamp(6px,.9vmin,8px);color:#999;font-weight:800;text-align:center;line-height:1.2;margin-top:2px">' + ZONES[tile.zone].name.split(' ')[1] + '<br>$' + (ZONES[tile.zone].price / 1000) + 'k</div>';
        }
      }
      el.innerHTML = inner;
      grid.appendChild(el);
    }

    var center = document.createElement('div');
    center.className = 'center-info';
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    center.innerHTML = '<h3>🎩</h3>' +
      '<div class="turn-info">Lượt ' + (state.game.turn_count || 0) + '</div>' +
      (curP ? '<div style="font-size:13px;font-weight:900;color:' + curP.color + ';margin-top:4px">' + esc(curP.name) + '</div>' : '') +
      '<div class="dice-big" id="centerDice">🎲</div>';
    grid.appendChild(center);

    state.game.players.forEach(function (p) {
      if (p.bankrupt) return;
      var tileEl = grid.querySelector('[data-idx="' + p.pos + '"]');
      if (!tileEl) return;
      var pp = tileEl.querySelector('.tile-players');
      if (!pp) {
        pp = document.createElement('div');
        pp.className = 'tile-players';
        tileEl.appendChild(pp);
      }
      var img = document.createElement('img');
      img.src = p.avatar; img.alt = p.name;
      pp.appendChild(img);
    });
  }

  function renderPlayers() {
    if (!state.game) return;
    var el = $('playerList'); el.innerHTML = '';
    state.game.players.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'pcard' + (p.username === state.game.current_turn ? ' active' : '') + (p.bankrupt ? ' bankrupt' : '');
      card.style.setProperty('--c', p.color);
      card.style.setProperty('--soft', p.soft);
      card.dataset.user = p.username;
      var youBadge = p.username === myUsername ? ' •BẠN' : '';
      var jailBadge = p.jail_turns > 0 ? '<span class="pjail">🚔</span>' : '';
      card.innerHTML = '<img src="' + p.avatar + '">' +
        '<div class="pc-info"><div class="pname">' + esc(p.name) + youBadge + '</div>' +
        '<div class="pmoney">' + fmtMoney(p.money) + '</div></div>' + jailBadge;
      el.appendChild(card);
    });

    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    var turnPill = $('turnPill');
    if (curP) {
      turnPill.style.borderColor = curP.color;
      var isMe = curP.username === myUsername;
      turnPill.textContent = state.game.winner ? '🏆 Kết thúc' : (isMe ? '👉 LƯỢT BẠN!' : '⏳ ' + curP.name);
    }
  }

  function renderLog() {
    var el = $('log'); el.innerHTML = '';
    (state.game.log || []).slice(0, 20).forEach(function (l) {
      var div = document.createElement('div');
      div.className = 'log-item';
      if (l.color) div.style.borderLeftColor = l.color;
      div.textContent = l.text;
      el.appendChild(div);
    });
  }

  function renderAll() {
    renderBoard();
    renderPlayers();
    renderLog();
    syncRollBtn();
    requestAnimationFrame(fitBoard);
  }

  function syncRollBtn() {
    var btn = $('rollBtn');
    if (!btn) return;
    if (!state.game || state.game.winner) { btn.disabled = true; $('rollInfo').textContent = 'Đã kết thúc'; return; }
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    if (!curP) { btn.disabled = true; return; }
    var isMe = curP.username === myUsername;
    var isBot = curP.bot;
    var hasPending = state.game.pending_action && state.game.pending_action.player === myUsername;
    btn.disabled = !isMe || isBot || state.busy || hasPending || state.animating;
    if (isBot) $('rollInfo').textContent = '🤖 ' + curP.name + ' đang chơi...';
    else if (hasPending) $('rollInfo').textContent = '⏳ Chọn hành động...';
    else if (isMe) $('rollInfo').textContent = '👉 Nhấn tung!';
    else $('rollInfo').textContent = '⏳ Đang chờ ' + curP.name + '...';
  }

  /* ============================ LOGIC HELPERS ============================ */
  function getZoneRange(zoneIdx) { return ZONE_RANGES[zoneIdx]; }

  function calcChainValue(tileIdx) {
    var tile = state.game.tiles[tileIdx];
    if (tile.type !== 'prop' || !tile.owner) return 0;
    var owner = tile.owner, zone = tile.zone, range = getZoneRange(zone);
    var count = 1;
    for (var i = tileIdx - 1; i >= range.start; i--) {
      if (state.game.tiles[i].owner === owner) count++; else break;
    }
    for (var i = tileIdx + 1; i <= range.end; i++) {
      if (state.game.tiles[i].owner === owner) count++; else break;
    }
    return ZONES[zone].price * count * tile.level;
  }
  function getChainCount(tileIdx) {
    var tile = state.game.tiles[tileIdx];
    if (tile.type !== 'prop' || !tile.owner) return 0;
    var owner = tile.owner, zone = tile.zone, range = getZoneRange(zone);
    var count = 1;
    for (var i = tileIdx - 1; i >= range.start; i--) {
      if (state.game.tiles[i].owner === owner) count++; else break;
    }
    for (var i = tileIdx + 1; i <= range.end; i++) {
      if (state.game.tiles[i].owner === owner) count++; else break;
    }
    return count;
  }

  function pushLog(text, color) {
    if (!state.game.log) state.game.log = [];
    state.game.log.unshift({ text: text, color: color, ts: Date.now() });
    if (state.game.log.length > 60) state.game.log.length = 60;
  }

  function getPlayer(username) {
    return state.game.players.find(function (p) { return p.username === username; });
  }
  function currentPlayer() { return getPlayer(state.game.current_turn); }

  /* ============================ TURN ENGINE ============================ */
  async function executeRoll() {
    if (!state.game || state.game.winner || state.animating) return;
    var player = currentPlayer();
    if (!player) return;
    state.animating = true;
    syncRollBtn();

    try {
      if (player.jail_turns > 0) {
        player.jail_turns--;
        pushLog('🚔 ' + player.name + ' đang trong tù (còn ' + player.jail_turns + ' lượt)', player.color);
        await commitAndRender();
        await sleep(700);
        advanceTurn();
        return;
      }

      var dice = 1 + rnd(6);

      // === DICE ROLL ANIMATION ===
      var cubeEl = $('diceCube');
      cubeEl.classList.add('rolling');
      sfx.roll();
      var swap = setInterval(function () {
        cubeEl.textContent = DICE_FACES[rnd(6)];
      }, 55);
      var centerDice = $('centerDice');
      if (centerDice) {
        var swap2 = setInterval(function () { centerDice.textContent = DICE_FACES[rnd(6)]; }, 55);
        setTimeout(function () { clearInterval(swap2); centerDice.textContent = DICE_FACES[dice - 1]; }, 750);
      }
      await sleep(750);
      clearInterval(swap);
      cubeEl.classList.remove('rolling');
      cubeEl.textContent = DICE_FACES[dice - 1];
      cubeEl.classList.add('settled');
      setTimeout(function () { cubeEl.classList.remove('settled'); }, 400);

      var oldPos = player.pos;
      var steps = dice;
      var passed = (oldPos + dice) >= 28;

      pushLog('🎲 ' + player.name + ' tung ' + dice + ' → ô ' + ((oldPos + dice) % 28), player.color);

      // === STEP-BY-STEP MOVEMENT (local mode) ===
      if (state.playMode !== 'online') {
        for (var s = 0; s < steps; s++) {
          player.pos = (player.pos + 1) % 28;
          renderBoard();
          sfx.step();
          var pawns = $('boardGrid').querySelectorAll('[data-idx="' + player.pos + '"] .tile-players img');
          if (pawns.length) {
            var lastPawn = pawns[pawns.length - 1];
            lastPawn.classList.add('hopping');
            setTimeout((function (el) { return function () { el.classList.remove('hopping'); }; })(lastPawn), 350);
          }
          await sleep(160);
        }
      } else {
        player.pos = (oldPos + dice) % 28;
      }
      sfx.land();

      if (passed) {
        player.money += 10000;
        pushLog('💰 ' + player.name + ' qua xuất phát: +$10k + nâng cấp nhà!', player.color);
        state.game.tiles.forEach(function (t) {
          if (t.type === 'prop' && t.owner === player.username && t.level < 5) t.level++;
        });
        showMoneyFloat(player.username, 10000);
      }

      await commitAndRender();
      await sleep(280);

      await resolveTile(player, player.pos);
    } finally {
      state.animating = false;
    }
  }

  async function resolveTile(player, tileIdx) {
    var tile = state.game.tiles[tileIdx];

    if (tile.type === 'start') {
      if (tileIdx === player.pos && player.pos === 0) {
        player.money += 5000;
        pushLog('🏁 ' + player.name + ' đáp đúng xuất phát: +$5k', player.color);
        showMoneyFloat(player.username, 5000);
        sfx.buy();
      }
      await commitAndRender();
      advanceTurn();
      return;
    }

    if (tile.type === 'jail') {
      player.jail_turns = 2;
      pushLog('🚔 ' + player.name + ' vào tù! Chờ 2 lượt', player.color);
      sfx.lose();
      await commitAndRender();
      await sleep(500);
      advanceTurn();
      return;
    }

    if (tile.type === 'reward') {
      var props = [];
      for (var i = 1; i < 28; i++) if (state.game.tiles[i].type === 'prop') props.push(i);
      var targetIdx = props[rnd(props.length)];
      var target = state.game.tiles[targetIdx];
      if (!target.owner) {
        target.owner = player.username; target.level = 1;
        pushLog('🎁 ' + player.name + ' nhận MIỄN PHÍ nhà ô ' + targetIdx + ' (' + ZONES[target.zone].name + ')', player.color);
        sfx.buy();
      } else if (target.owner !== player.username) {
        var prevOwner = getPlayer(target.owner);
        target.owner = player.username;
        pushLog('🎁 ' + player.name + ' cướp nhà ô ' + targetIdx + ' từ ' + (prevOwner ? prevOwner.name : '?'), player.color);
        sfx.buy();
      } else {
        player.money += 5000;
        pushLog('🎁 ' + player.name + ' đã sở hữu ô ' + targetIdx + ', +$5k bonus', player.color);
        showMoneyFloat(player.username, 5000);
      }
      await commitAndRender();
      await sleep(600);
      advanceTurn();
      return;
    }

    if (tile.type === 'teleport') {
      var props = [];
      for (var i = 1; i < 28; i++) if (state.game.tiles[i].type === 'prop') props.push(i);
      var targetIdx = props[rnd(props.length)];
      player.pos = targetIdx;
      pushLog('🌀 ' + player.name + ' dịch chuyển đến ô ' + targetIdx, player.color);
      await commitAndRender();
      await sleep(600);
      await resolveTile(player, targetIdx);
      return;
    }

    if (tile.type === 'prop') {
      await resolveProperty(player, tileIdx);
      return;
    }

    advanceTurn();
  }

  async function resolveProperty(player, tileIdx) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];

    if (!tile.owner) {
      var price = zone.price;
      if (player.bot) {
        if (player.money >= price + 30000) {
          player.money -= price;
          tile.owner = player.username; tile.level = 1;
          pushLog('🤖 ' + player.name + ' mua ô ' + tileIdx + ' (' + zone.name + ') $' + (price/1000) + 'k', player.color);
          showMoneyFloat(player.username, -price);
          sfx.buy();
          await commitAndRender();
          await sleep(500);
        } else {
          pushLog('🤖 ' + player.name + ' bỏ qua ô ' + tileIdx + ' (thiếu tiền)', player.color);
          await sleep(300);
        }
        advanceTurn();
      } else if (player.username === myUsername) {
        state.game.pending_action = {
          type: 'buy_empty', player: player.username, tileIdx: tileIdx,
          price: price, deadline: Date.now() + 30000
        };
        await commitAndRender();
        showBuyEmptyModal(player, tileIdx, price);
      } else {
        syncRollBtn();
      }
      return;
    }

    if (tile.owner === player.username) {
      pushLog(player.name + ' dừng ở nhà mình ô ' + tileIdx, player.color);
      await commitAndRender();
      await sleep(300);
      advanceTurn();
      return;
    }

    var chainValue = calcChainValue(tileIdx);
    var chainCount = getChainCount(tileIdx);
    var rentPrice = Math.floor(chainValue / 2);

    if (player.bot) {
      if (player.money >= rentPrice) {
        player.money -= rentPrice;
        var owner = getPlayer(tile.owner);
        if (owner) owner.money += rentPrice;
        pushLog('🤖 ' + player.name + ' trả thuê $' + (rentPrice/1000) + 'k cho ' + (owner ? owner.name : '?'), player.color);
        showMoneyFloat(player.username, -rentPrice);
        if (owner) showMoneyFloat(owner.username, rentPrice);
        sfx.pay();
        await commitAndRender();
        await sleep(500);
        advanceTurn();
        return;
      }
      if (player.money >= chainValue) {
        player.money -= chainValue;
        var owner = getPlayer(tile.owner);
        if (owner) owner.money += chainValue;
        tile.owner = player.username;
        pushLog('🤖 ' + player.name + ' MUA LẠI ô ' + tileIdx + ' $' + (chainValue/1000) + 'k', player.color);
        showMoneyFloat(player.username, -chainValue);
        sfx.buy();
        await commitAndRender();
        await sleep(500);
        advanceTurn();
        return;
      }
      doBankrupt(player, getPlayer(tile.owner), chainValue);
      await commitAndRender();
      await sleep(700);
      advanceTurn();
      return;
    }

    if (player.username === myUsername) {
      state.game.pending_action = {
        type: 'opponent_tile', player: player.username, tileIdx: tileIdx,
        chainValue: chainValue, rentPrice: rentPrice, chainCount: chainCount,
        deadline: Date.now() + 30000
      };
      await commitAndRender();
      showOpponentModal(player, tileIdx, chainValue, rentPrice, chainCount);
    } else {
      syncRollBtn();
    }
  }

  function doBankrupt(player, creditor, amount) {
    player.bankrupt = true;
    player.money = 0;
    state.game.tiles.forEach(function (t) {
      if (t.type === 'prop' && t.owner === player.username) {
        t.owner = null; t.level = 1;
      }
    });
    pushLog('💀 ' + player.name + ' PHÁ SẢN! Nhà bị thu hồi', '#ef4444');
    sfx.lose();
    screenShake();
    var alive = state.game.players.filter(function (p) { return !p.bankrupt; });
    if (alive.length === 1) {
      state.game.winner = alive[0].username;
      state.game.finished_at = Date.now();
      pushLog('🏆 ' + alive[0].name + ' THẮNG CUỘC!', alive[0].color);
    }
  }

  function advanceTurn() {
    if (!state.game || state.game.winner) {
      commitAndRender().then(function () { showWinOverlay(); });
      return;
    }
    state.game.turn_count = (state.game.turn_count || 0) + 1;
    var idx = state.game.players.findIndex(function (p) { return p.username === state.game.current_turn; });
    for (var i = 1; i <= state.game.players.length; i++) {
      idx = (idx + 1) % state.game.players.length;
      if (!state.game.players[idx].bankrupt) {
        state.game.current_turn = state.game.players[idx].username;
        state.game.pending_action = null;
        break;
      }
    }
    commitAndRender().then(function () {
      var nextP = currentPlayer();
      if (nextP) showTurnBanner(nextP.name, nextP.color);
      if (nextP && nextP.bot && !state.game.winner) {
        setTimeout(function () { executeRoll(); }, 1000);
      }
    });
  }

  async function commitAndRender() {
    renderAll();
    if (state.playMode === 'online' && room) {
      await commitOnline();
    }
  }

  /* ============================ HUMAN ACTION HANDLERS ============================ */
  async function handleBuyEmpty(yes) {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'buy_empty') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    if (yes && player.money >= pa.price) {
      player.money -= pa.price;
      state.game.tiles[pa.tileIdx].owner = player.username;
      state.game.tiles[pa.tileIdx].level = 1;
      pushLog('💰 ' + player.name + ' mua ô ' + pa.tileIdx + ' $' + (pa.price/1000) + 'k', player.color);
      showMoneyFloat(player.username, -pa.price);
      sfx.buy();
    } else {
      pushLog(player.name + ' bỏ qua ô ' + pa.tileIdx, player.color);
    }
    state.game.pending_action = null;
    hideActionModal();
    await commitAndRender();
    await sleep(400);
    advanceTurn();
  }

  async function handleOpponentAction(action) {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'opponent_tile') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    var tile = state.game.tiles[pa.tileIdx];
    var owner = getPlayer(tile.owner);

    if (action === 'rent') {
      if (player.money < pa.rentPrice) return toast('Không đủ tiền thuê!');
      player.money -= pa.rentPrice;
      if (owner) owner.money += pa.rentPrice;
      pushLog('💸 ' + player.name + ' trả thuê $' + (pa.rentPrice/1000) + 'k cho ' + (owner ? owner.name : '?'), player.color);
      showMoneyFloat(player.username, -pa.rentPrice);
      if (owner) showMoneyFloat(owner.username, pa.rentPrice);
      sfx.pay();
    } else if (action === 'buy') {
      if (player.money < pa.chainValue) return toast('Không đủ tiền mua!');
      player.money -= pa.chainValue;
      if (owner) owner.money += pa.chainValue;
      tile.owner = player.username;
      pushLog('💰 ' + player.name + ' MUA LẠI ô ' + pa.tileIdx + ' $' + (pa.chainValue/1000) + 'k từ ' + (owner ? owner.name : '?'), player.color);
      showMoneyFloat(player.username, -pa.chainValue);
      if (owner) showMoneyFloat(owner.username, pa.chainValue);
      sfx.buy();
    } else if (action === 'bankrupt') {
      doBankrupt(player, owner, pa.chainValue);
    }

    state.game.pending_action = null;
    hideActionModal();
    await commitAndRender();
    await sleep(400);
    advanceTurn();
  }

  /* ============================ MODALS ============================ */
  function showBuyEmptyModal(player, tileIdx, price) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];
    $('actionModal').innerHTML =
      '<h2>🏠 Ô ' + tileIdx + '</h2>' +
      '<div class="sub">' + zone.name + '</div>' +
      '<div class="prop-info">' +
        '<div class="row"><span>Giá mua</span><b>' + fmtMoney(price) + '</b></div>' +
        '<div class="row"><span>Tiền bạn có</span><b>' + fmtMoney(player.money) + '</b></div>' +
        '<div class="row"><span>Còn lại sau khi mua</span><b>' + fmtMoney(player.money - price) + '</b></div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="btn btn-buy" id="btnBuyYes">💰 Mua ($' + (price/1000) + 'k)</button>' +
        '<button class="btn btn-skip" id="btnBuyNo">Bỏ qua</button>' +
      '</div>';
    $('actionOverlay').hidden = false;
    $('btnBuyYes').onclick = function () { handleBuyEmpty(true); };
    $('btnBuyNo').onclick = function () { handleBuyEmpty(false); };
    startDecisionTimeout();
  }

  function showOpponentModal(player, tileIdx, chainValue, rentPrice, chainCount) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];
    var owner = getPlayer(tile.owner);
    var canRent = player.money >= rentPrice;
    var canBuy = player.money >= chainValue;
    var multiplier = chainCount > 1 ? (' × ' + chainCount + ' (chuỗi ' + chainCount + ')') : '';
    $('actionModal').innerHTML =
      '<h2>⚠️ Ô ' + tileIdx + ' của ' + esc(owner ? owner.name : '?') + '</h2>' +
      '<div class="sub">' + zone.name + ' · Level ' + tile.level + '</div>' +
      '<div class="prop-info">' +
        '<div class="row"><span>Giá trị nhà</span><b>' + fmtMoney(ZONES[tile.zone].price) + ' × ' + tile.level + multiplier + '</b></div>' +
        '<div class="row"><span>→ Tổng giá trị</span><b>' + fmtMoney(chainValue) + '</b></div>' +
        '<div class="row"><span>Thuê (50%)</span><b>' + fmtMoney(rentPrice) + '</b></div>' +
        '<div class="row"><span>Tiền bạn có</span><b>' + fmtMoney(player.money) + '</b></div>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="btn btn-rent" id="btnRent" ' + (canRent ? '' : 'disabled') + '>💸 Thuê ($' + (rentPrice/1000) + 'k)</button>' +
        '<button class="btn btn-buy" id="btnBuyOpp" ' + (canBuy ? '' : 'disabled') + '>💰 Mua lại ($' + (chainValue/1000) + 'k)</button>' +
        '<button class="btn btn-danger" id="btnBankrupt">💀 Tuyên bố phá sản</button>' +
      '</div>';
    $('actionOverlay').hidden = false;
    if (canRent) $('btnRent').onclick = function () { handleOpponentAction('rent'); };
    if (canBuy) $('btnBuyOpp').onclick = function () { handleOpponentAction('buy'); };
    $('btnBankrupt').onclick = function () { handleOpponentAction('bankrupt'); };
    startDecisionTimeout();
  }

  var decisionTimeout = null;
  function startDecisionTimeout() {
    if (decisionTimeout) clearTimeout(decisionTimeout);
    decisionTimeout = setTimeout(function () {
      var pa = state.game && state.game.pending_action;
      if (!pa) return;
      dbgEvent('DECISION_TIMEOUT', pa.type);
      if (pa.type === 'buy_empty') handleBuyEmpty(false);
      else if (pa.type === 'opponent_tile') {
        if (state.game.players.find(function (p) { return p.username === pa.player; }).money >= pa.rentPrice) handleOpponentAction('rent');
        else handleOpponentAction('bankrupt');
      }
    }, 30000);
  }
  function clearDecisionTimeout() {
    if (decisionTimeout) { clearTimeout(decisionTimeout); decisionTimeout = null; }
  }
  function hideActionModal() {
    clearDecisionTimeout();
    $('actionOverlay').hidden = true;
    $('actionModal').innerHTML = '';
  }

  function showWinOverlay() {
    if (!state.game || !state.game.winner) return;
    var wp = getPlayer(state.game.winner);
    var isMe = state.game.winner === myUsername;
    $('winEmoji').textContent = isMe ? '🏆' : '😢';
    $('winTitle').textContent = isMe ? 'Bạn thắng!' : (wp ? wp.name + ' thắng!' : 'Kết thúc');
    $('winSub').textContent = isMe ? 'Chúc mừng tỷ phú mới! 💰' : 'Chơi ván mới nhé!';
    sfx.win();
    if (isMe) spawnConfetti(120);
    $('winOverlay').hidden = false;
  }

  /* ============================ LOCAL GAME START ============================ */
  function startLocalGame() {
    myUsername = getMyUsername();
    var players = [{
      username: myUsername, name: myProfile.display_name || myUsername, avatar: myProfile.avatar_url || avt(myUsername),
      color: PLAYER_COLORS[0].c, soft: PLAYER_COLORS[0].s,
      pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: false
    }];
    for (var i = 0; i < state.botCount; i++) {
      var nm = BOT_NAMES[i] || ('Bot ' + (i+1));
      players.push({
        username: 'bot_' + i, name: nm, avatar: avt('bot' + i + '_' + Date.now()),
        color: PLAYER_COLORS[i+1].c, soft: PLAYER_COLORS[i+1].s,
        pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: true
      });
    }
    state.game = {
      players: players, tiles: initTiles(),
      current_turn: myUsername, turn_count: 0,
      started_at: Date.now(), winner: null, log: [], pending_action: null
    };
    pushLog('🎩 Trò chơi bắt đầu! ' + players.length + ' người chơi', '#f59e0b');
    showScreen('gameScreen');
    renderAll();
    requestAnimationFrame(fitBoard);
    setTimeout(function () { showTurnBanner(players[0].name, players[0].color); }, 500);
    dbgEvent('LOCAL_START', 'players=' + players.length);
  }

  /* ============================ ONLINE: rooms ============================ */
  async function createRoom() {
    if (!sb) return toast('Supabase chưa sẵn sàng');
    if (room) return toast('Đang ở phòng khác');
    var code = Array.from({ length: 6 }, function () { return 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[rnd(32)]; }).join('');
    var r = await sb.from('monopoly_rooms').insert({
      code: code, host_username: myUsername, status: 'waiting', max_players: 4, state: {}, version: 0
    }).select().single();
    if (r.error) return toast('Lỗi tạo phòng: ' + r.error.message);
    room = r.data; isHost = true;
    await sb.from('monopoly_room_players').insert({
      room_id: room.id, username: myUsername, display_name: myProfile.display_name || myUsername,
      avatar_url: myProfile.avatar_url, is_host: true, color_index: 0
    });
    enterWait();
  }

  async function joinRoomById(rid) {
    if (!sb || room) return;
    var r = await sb.from('monopoly_rooms').select('*').eq('id', rid).eq('status', 'waiting').maybeSingle();
    if (r.error || !r.data) return toast('Phòng đã đóng');
    room = r.data; isHost = (room.host_username === myUsername);
    var ex = await sb.from('monopoly_room_players').select('id').eq('room_id', rid).eq('username', myUsername).maybeSingle();
    if (!ex.data) {
      var cnt = await sb.from('monopoly_room_players').select('id', { count: 'exact', head: true }).eq('room_id', rid);
      await sb.from('monopoly_room_players').insert({
        room_id: rid, username: myUsername, display_name: myProfile.display_name || myUsername,
        avatar_url: myProfile.avatar_url, color_index: cnt.count || 0
      });
    }
    enterWait();
  }

  async function leaveRoom() {
    if (room) {
      if (roomChan) { try { sb.removeChannel(roomChan); } catch (e) {} roomChan = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      try {
        await sb.from('monopoly_room_players').delete().eq('room_id', room.id).eq('username', myUsername);
        if (isHost) await sb.from('monopoly_rooms').delete().eq('id', room.id);
      } catch (e) {}
    }
    room = null; isHost = false; roomPlayers = []; state.game = null;
    if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} roomsChan = null; }
  }

  function enterWait() {
    showScreen('waitingScreen');
    $('hostControls').style.display = isHost ? 'block' : 'none';
    renderWait(); startRealtime(); refreshPlayers();
  }

  function renderWait() {
    $('waitingCount').textContent = roomPlayers.length;
    $('waitingPlayers').innerHTML = roomPlayers.map(function (p) {
      return '<div class="waiting-player"><img src="' + (p.avatar_url || avt(p.display_name)) + '">' +
        '<span>' + esc(p.display_name) + (p.username === myUsername ? ' (Bạn)' : '') + '</span>' +
        (p.is_host ? '<span style="color:#f59e0b;font-size:10px;margin-left:auto">HOST</span>' : '') + '</div>';
    }).join('');
    $('hostStartBtn').disabled = roomPlayers.length < 2;
    $('hostStartBtn').textContent = roomPlayers.length >= 2 ? '🚀 Bắt đầu (' + roomPlayers.length + ')' : '⏳ Cần 2 người';
  }

  async function hostStart() {
    if (roomPlayers.length < 2) return;
    var players = roomPlayers.map(function (rp, i) {
      return {
        username: rp.username, name: rp.display_name, avatar: rp.avatar_url || avt(rp.display_name),
        color: PLAYER_COLORS[i % 4].c, soft: PLAYER_COLORS[i % 4].s,
        pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: false
      };
    });
    var initialState = {
      players: players, tiles: initTiles(),
      current_turn: roomPlayers[0].username, turn_count: 0,
      started_at: Date.now(), winner: null,
      log: [{ text: '🎩 Trò chơi bắt đầu! ' + players.length + ' người chơi', color: '#f59e0b', ts: Date.now() }],
      pending_action: null
    };
    await sb.from('monopoly_rooms').update({
      status: 'playing', state: initialState,
      version: (room.version || 0) + 1, updated_at: new Date().toISOString()
    }).eq('id', room.id);
  }

  async function refreshPlayers() {
    if (!room) return;
    try {
      var r = await sb.from('monopoly_room_players').select('*').eq('room_id', room.id).order('joined_at');
      if (r.data) { roomPlayers = r.data; if (room.status === 'waiting') renderWait(); }
    } catch (e) {}
  }

  async function fetchRooms() {
    if (!sb) return;
    var r = await sb.from('monopoly_rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(20);
    if (!r.data) return;
    var ids = r.data.map(function (x) { return x.id; });
    var counts = {};
    if (ids.length) {
      var p = await sb.from('monopoly_room_players').select('room_id').in('room_id', ids);
      if (p.data) p.data.forEach(function (row) { counts[row.room_id] = (counts[row.room_id] || 0) + 1; });
    }
    $('roomsList').innerHTML = r.data.map(function (rm) {
      var cnt = counts[rm.id] || 1;
      var mine = rm.host_username === myUsername;
      var full = cnt >= rm.max_players;
      var label = mine ? 'Của bạn' : (full ? 'Đầy' : 'Vào');
      return '<div class="room-item"><div class="room-item-info"><div class="room-item-host">🎩 ' + esc(rm.host_username) + '</div>' +
        '<div class="room-item-meta">' + cnt + '/' + rm.max_players + ' người</div></div>' +
        '<button class="room-item-join" data-id="' + rm.id + '"' + ((mine || full) ? ' disabled' : '') + '>' + label + '</button></div>';
    }).join('') || '<div style="text-align:center;padding:20px;color:#888;font-weight:700">Chưa có phòng nào</div>';
  }

  async function enterOnlineScreen() {
    if (room) await leaveRoom();
    showScreen('onlineScreen'); fetchRooms();
    if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} }
    roomsChan = sb.channel('mp-rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoly_rooms' }, fetchRooms)
      .subscribe();
  }

  /* ============================ ONLINE: realtime ============================ */
  async function commitOnline() {
    if (!room || !state.game) return;
    try {
      await sb.from('monopoly_rooms').update({
        state: state.game,
        version: (room.version || 0) + 1,
        updated_at: new Date().toISOString()
      }).eq('id', room.id);
    } catch (e) { dbgEvent('COMMIT_ERR', e.message); }
  }

  function handleRemoteState(oldG, newG) {
    var prevPending = state.game && state.game.pending_action;
    state.game = newG;

    var pa = newG.pending_action;
    if (pa && pa.player === myUsername) {
      if (pa.type === 'buy_empty') {
        var p = getPlayer(pa.player);
        showBuyEmptyModal(p, pa.tileIdx, pa.price);
      } else if (pa.type === 'opponent_tile') {
        var p = getPlayer(pa.player);
        showOpponentModal(p, pa.tileIdx, pa.chainValue, pa.rentPrice, pa.chainCount);
      }
    } else if (!pa && prevPending) {
      hideActionModal();
    }

    renderAll();
    requestAnimationFrame(fitBoard);

    if (newG.winner) {
      showWinOverlay();
    }
  }

  function startRealtime() {
    if (!sb || !room) return;
    if (roomChan) { try { sb.removeChannel(roomChan); } catch (e) {} roomChan = null; }
    roomChan = sb.channel('mp-room-' + room.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'monopoly_rooms', filter: 'id=eq.' + room.id }, function (payload) {
        var row = payload.new;
        if (!row) return;
        room = row;
        if (row.status === 'playing' && row.state) {
          if (document.getElementById('monopolyHost').style.display !== 'block') {
            showScreen('gameScreen');
          }
          var oldG = state.game;
          handleRemoteState(oldG, row.state);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoly_room_players', filter: 'room_id=eq.' + room.id }, function () {
        refreshPlayers();
      })
      .subscribe(function (status) {
        dbgEvent('REALTIME_STATUS', status);
      });

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      if (!room) return;
      try {
        var r = await sb.from('monopoly_rooms').select('*').eq('id', room.id).maybeSingle();
        if (r.data) {
          room = r.data;
          if (room.status === 'playing' && room.state) {
            if (document.getElementById('monopolyHost').style.display !== 'block') {
              showScreen('gameScreen');
            }
            if (!state.game || (room.version || 0) > (lastStaleVer || 0)) {
              lastStaleVer = room.version || 0;
              handleRemoteState(state.game, room.state);
            }
          }
        }
        refreshPlayers();
      } catch (e) {}
    }, 4000);
  }

  /* ============================ DEBUG PANEL ============================ */
  function renderDbg() {
    var b = $('dbgBody'); if (!b) return;
    var html = '<div class="kv"><span class="k">Mode</span><span class="v">' + state.playMode + '</span></div>';
    html += '<div class="kv"><span class="k">MyName</span><span class="v">' + myUsername + '</span></div>';
    if (room) {
      html += '<div class="kv"><span class="k">Room</span><span class="v">' + room.code + ' (' + (room.status || '') + ')</span></div>';
      html += '<div class="kv"><span class="k">IsHost</span><span class="v">' + isHost + '</span></div>';
    }
    if (state.game) {
      html += '<div class="kv"><span class="k">Turn</span><span class="v">' + state.game.current_turn + '</span></div>';
      html += '<div class="kv"><span class="k">Winner</span><span class="v">' + (state.game.winner || 'None') + '</span></div>';
      html += '<pre>' + esc(JSON.stringify(state.game, null, 2)) + '</pre>';
    }
    html += '<div style="margin-top:8px;font-weight:900;color:#00ff88">Events:</div>';
    html += '<pre>' + dbgEvents.map(function (e) {
      return '[' + new Date(e.time).toLocaleTimeString() + '] ' + e.type + ': ' + (e.detail || '');
    }).join('\n') + '</pre>';
    b.innerHTML = html;
  }

  /* ============================ NAVIGATION ============================ */
  function showScreen(id) {
    ['menuScreen', 'onlineScreen', 'waitingScreen', 'localSetupScreen', 'gameScreen'].forEach(function (sid) {
      var el = $(sid);
      if (el) el.hidden = (sid !== id);
    });
    if (id === 'gameScreen') requestAnimationFrame(function () { requestAnimationFrame(fitBoard); });
  }

  function bindEvents() {
    $('soundBtn').onclick = function () {
      sfxOn = !sfxOn;
      $('soundBtn').textContent = sfxOn ? '🔊' : '🔇';
      toast(sfxOn ? 'Đã bật âm thanh' : 'Đã tắt âm thanh');
    };
    $('debugBtn').onclick = function () {
      debugOpen = !debugOpen;
      $('debugPanel').hidden = !debugOpen;
      if (debugOpen) renderDbg();
    };
    $('dbgClose').onclick = function () { debugOpen = false; $('debugPanel').hidden = true; };
    $('dbgCopy').onclick = function () {
      try { navigator.clipboard.writeText(JSON.stringify(state.game, null, 2)); toast('Đã copy state!'); } catch (e) { toast('Lỗi copy'); }
    };
    $('dbgForce').onclick = function () { renderAll(); toast('Đã force render!'); };

    shadow.querySelectorAll('#playModeGrid .play-card').forEach(function (card) {
      card.onclick = function () {
        shadow.querySelectorAll('#playModeGrid .play-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state.playMode = card.dataset.playmode;
      };
    });

    $('continueBtn').onclick = function () {
      myUsername = getMyUsername();
      if (state.playMode === 'bot') showScreen('localSetupScreen');
      else enterOnlineScreen();
    };

    shadow.querySelectorAll('#botCountSeg button').forEach(function (b) {
      b.onclick = function () {
        shadow.querySelectorAll('#botCountSeg button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        state.botCount = parseInt(b.dataset.c, 10) || 1;
      };
    });

    $('startLocalBtn').onclick = function () { startLocalGame(); };
    $('backFromLocalBtn').onclick = function () { showScreen('menuScreen'); };
    $('backFromOnlineBtn').onclick = async function () { await leaveRoom(); showScreen('menuScreen'); };

    $('createRoomBtn').onclick = function () { createRoom(); };
    $('refreshRoomsBtn').onclick = function () { fetchRooms(); };
    $('roomsList').onclick = function (e) {
      var btn = e.target.closest('.room-item-join');
      if (!btn) return;
      var rid = btn.dataset.id;
      if (rid) joinRoomById(rid);
    };

    $('hostStartBtn').onclick = function () { hostStart(); };
    $('leaveRoomBtn').onclick = async function () { await leaveRoom(); showScreen('onlineScreen'); };

    $('rollBtn').onclick = function () { executeRoll(); };
    $('quitBtn').onclick = async function () {
      if (confirm('Bạn muốn thoát game?')) {
        if (room) await leaveRoom();
        state.game = null;
        showScreen('menuScreen');
        closeGame();
      }
    };

    $('playAgainBtn').onclick = function () {
      $('winOverlay').hidden = true;
      state.game = null;
      if (room) { enterWait(); }
      else { showScreen('menuScreen'); }
    };

    window.addEventListener('resize', fitBoard);
    window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 300); });
  }

  /* ============================ INIT & EXPOSE ============================ */
  async function init() {
    myUsername = getMyUsername();
    myProfile = { display_name: myUsername, avatar_url: avt(myUsername) };
    var elName = $('myDisplayName');
    if (elName) elName.textContent = myUsername;
    bindEvents();
    dbgEvent('INIT', 'Monopoly v2.0 initialized.');
  }

  function openGame() {
    host.style.display = 'block';
    init();
    // Try landscape lock
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }

  function closeGame() {
    host.style.display = 'none';
    if (room) { leaveRoom(); }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  closeBtn.onclick = function () { closeGame(); };
  window.openMonopolyGame = function () { openGame(); };

})();