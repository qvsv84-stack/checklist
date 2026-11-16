/* =====================================================================
   CỜ TỶ PHÚ — MONOPOLY (v2.4 — OWNER COLORS & MY POSITION PULSE)
   ===================================================================== */
(function () {
  'use strict';
  if (window.__monopolyLoaded) return;
  window.__monopolyLoaded = true;

  var CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;height:100%;width:100%;margin:0}
#mpApp{position:fixed;inset:0;font-family:'Nunito',system-ui,-apple-system,sans-serif;color:#2d1b3d;overflow:hidden;background:#0a0417;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;--tile-size:60px}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}

#mpApp::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 15% 5%,rgba(245,158,11,.22),transparent 40%),radial-gradient(ellipse at 85% 95%,rgba(124,58,237,.25),transparent 42%),radial-gradient(ellipse at 50% 50%,rgba(34,201,138,.06),transparent 60%),linear-gradient(135deg,#0a0417 0%,#1e1233 45%,#0a0417 100%);pointer-events:none;z-index:0}
#mpApp::after{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");pointer-events:none;z-index:0;mix-blend-mode:overlay}

/* ========== HUD FLOAT ========== */
.hud-float{position:fixed;top:12px;right:12px;z-index:9000;display:flex;gap:6px}
.icon-btn{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:17px;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,248,239,.9));border:1px solid rgba(245,158,11,.4);box-shadow:0 6px 18px -8px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.9);transition:transform .18s cubic-bezier(.4,1.6,.6,1)}
.icon-btn:hover{transform:translateY(-2px)}
.icon-btn:active{transform:scale(.94)}

/* ========== SETUP SCREENS ========== */
.screen{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto}
.setup-card{max-width:480px;width:100%;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,250,242,.94));backdrop-filter:blur(20px);border-radius:26px;padding:28px;box-shadow:0 40px 100px -30px rgba(0,0,0,.8),0 0 0 1px rgba(245,158,11,.3),inset 0 1px 0 rgba(255,255,255,.95);animation:cardIn .5s cubic-bezier(.4,1.4,.6,1);margin:auto}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
.setup-card .hero{text-align:center;margin-bottom:20px}
.setup-card .hero h1{margin:0 0 6px;font-family:'Baloo 2',cursive;font-size:34px;letter-spacing:-.6px;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 12px rgba(245,158,11,.35))}
.setup-card .hero p{margin:0;color:#7a6b93;font-size:13.5px;font-weight:600;line-height:1.5}
.setup-card h2{margin:0 0 14px;font-family:'Baloo 2',cursive;font-size:21px;color:#2d1b3d;text-align:center}
.field{display:flex;flex-direction:column;gap:9px;margin-top:18px}
.field>label{font-size:10.5px;font-weight:900;color:#a898c0;text-transform:uppercase;letter-spacing:1.2px}
.play-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.play-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 10px;border-radius:18px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.2);cursor:pointer;font-weight:800;color:#6b5b85;font-size:14px;transition:all .22s cubic-bezier(.4,1.4,.6,1)}
.play-card:hover{border-color:rgba(245,158,11,.5);transform:translateY(-2px)}
.play-card.active{border-color:#f59e0b;background:linear-gradient(160deg,#fff8ef,#ffefd4);color:#b45309;box-shadow:0 12px 28px -12px rgba(245,158,11,.55),0 0 0 3px rgba(245,158,11,.12);transform:translateY(-2px)}
.play-card .icon{font-size:26px}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:12px 20px;border-radius:15px;font-weight:800;font-size:14.5px;transition:transform .18s cubic-bezier(.4,1.6,.6,1),box-shadow .18s;position:relative;overflow:hidden}
.btn::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.25),transparent 45%);pointer-events:none}
.btn:hover:not(:disabled){transform:translateY(-1px)}
.btn:active:not(:disabled){transform:scale(.97)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 35%,#ef4444);box-shadow:0 10px 28px -10px rgba(239,68,68,.7),inset 0 1px 0 rgba(255,255,255,.4)}
.btn-ghost{background:linear-gradient(145deg,#fff,#fff8ef);color:#6b5b85;border:1px solid rgba(245,158,11,.4)}
.btn-ghost.active{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-color:transparent}
.btn-lg{padding:14px 26px;font-size:15.5px;width:100%;border-radius:16px}
.btn-sm{padding:8px 14px;font-size:12.5px;border-radius:11px}

.room-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:15px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.22);margin-bottom:9px}
.room-item-info{flex:1;min-width:0}
.room-item-host{font-size:13.5px;font-weight:900;color:#2d1b3d}
.room-item-meta{font-size:11.5px;color:#8a7aa6;font-weight:700;margin-top:2px}
.room-item-join{padding:9px 16px;border-radius:11px;font-weight:900;font-size:12.5px;color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);box-shadow:0 6px 16px -8px rgba(239,68,68,.6)}
.room-item-join:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.waiting-player{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:13px;background:linear-gradient(160deg,#fff,#fffaf2);border:2px solid rgba(245,158,11,.2);margin-bottom:7px;font-weight:800;font-size:13.5px}
.waiting-player img{width:36px;height:36px;border-radius:50%;box-shadow:0 0 0 2px #fff,0 4px 12px -4px rgba(0,0,0,.2)}

/* =====================================================
   GAME SCREEN — MAXIMUM SPACE (NO HUD)
   ===================================================== */
.game-screen{position:absolute;inset:0;z-index:10;overflow:hidden;animation:fadeIn .3s ease-out;background:#0a0417}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* Bản đồ phủ kín 100% màn hình */
.board{position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.08),transparent 50%),linear-gradient(135deg,#1e1233 0%,#2d1b4e 50%,#1e1233 100%);padding:4px;box-shadow:inset 0 0 80px rgba(245,158,11,.1)}
.board::before{content:"";position:absolute;inset:2px;pointer-events:none;background:linear-gradient(135deg,rgba(245,158,11,.18),transparent 40%,rgba(124,58,237,.12));z-index:0}
.board-grid{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:100%;height:100%;gap:3px;position:relative;z-index:1}

/* =====================================================
   TILES
   ===================================================== */
.tile{position:relative;border-radius:6px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.12);box-shadow:0 2px 5px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.8);display:flex;flex-direction:column;transition:transform .2s}
.tile.corner{border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--tile-size)*.06);color:#fff;overflow:hidden;position:relative}
.tile.corner::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent 50%);pointer-events:none}
.corner-icon{font-size:calc(var(--tile-size)*.55);line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));position:relative;z-index:1}
.corner-label{font-size:calc(var(--tile-size)*.16);font-weight:900;letter-spacing:.5px;text-transform:uppercase;position:relative;z-index:1;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.tile.start{background:linear-gradient(135deg,#22c98a 0%,#16a34a 100%);box-shadow:0 0 24px -6px rgba(34,201,138,.7),inset 0 1px 0 rgba(255,255,255,.35)}
.tile.jail{background:linear-gradient(135deg,#6b7280 0%,#374151 100%);box-shadow:0 0 24px -6px rgba(107,114,128,.6),inset 0 1px 0 rgba(255,255,255,.25)}
.tile.reward{background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);box-shadow:0 0 28px -4px rgba(245,158,11,.8),inset 0 1px 0 rgba(255,255,255,.4);animation:cornerGlow 3s ease-in-out infinite}
.tile.teleport{background:linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%);box-shadow:0 0 28px -4px rgba(124,58,237,.8),inset 0 1px 0 rgba(255,255,255,.35);animation:cornerGlow 3s ease-in-out infinite}
@keyframes cornerGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}

/* Property tile */
.tile.prop .tile-band{height:22%;min-height:10px;background:var(--zone-color);position:relative;border-bottom:1px solid rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center}
.tile.prop .tile-band::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 60%)}
.tile-band-text{font-size:calc(var(--tile-size)*.18);font-weight:900;color:#fff;position:relative;z-index:1;text-shadow:0 1px 2px rgba(0,0,0,.4);white-space:nowrap}

/* Đây là phần nền thay đổi theo màu người chơi */
.tile.prop .tile-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:2px;min-height:0;background:#fff;position:relative;transition:background .3s ease}
.tile.prop.owned .tile-body{background:var(--owner-bg, #fff)}
.tile-name{font-size:calc(var(--tile-size)*.2);font-weight:900;color:#3b2b52;text-align:center;line-height:1.1;margin-top:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:100%}

.tile-levels{display:flex;gap:1.5px;margin-top:2px;flex-wrap:wrap;justify-content:center;max-width:100%}
.tile-levels span{font-size:calc(var(--tile-size)*.22);line-height:1}

/* Hiệu ứng nhấp nháy vị trí BẢN THÂN */
.tile.my-position{animation:myTilePulse 1.5s ease-in-out infinite;z-index:5}
@keyframes myTilePulse{
  0%,100%{
    box-shadow:inset 0 0 0 3px var(--my-color, #f59e0b), 0 0 20px var(--my-color-alpha, rgba(245,158,11,.5));
    filter:brightness(1);
  }
  50%{
    box-shadow:inset 0 0 0 5px var(--my-color, #fbbf24), 0 0 40px var(--my-color-alpha, rgba(245,158,11,.9));
    filter:brightness(1.15);
  }
}

/* Quân cờ và Tiền */
.tile-players{position:absolute;bottom:2px;left:0;right:0;display:flex;justify-content:center;gap:2px;padding:0 2px;pointer-events:none;z-index:6;flex-wrap:wrap}
.pawn-box{display:flex;flex-direction:column;align-items:center;line-height:1}
.pawn-box img{width:calc(var(--tile-size)*.35);height:calc(var(--tile-size)*.35);min-width:14px;min-height:14px;border-radius:50%;border:1.5px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.5);flex-shrink:0;transition:transform .18s}
.pawn-money{font-size:calc(var(--tile-size)*.14);font-weight:900;color:#16a34a;background:rgba(255,255,255,.9);padding:0 3px;border-radius:4px;margin-top:1px;border:1px solid rgba(0,0,0,.1);letter-spacing:-.3px;white-space:nowrap}
.pawn-box img.hopping{animation:pawnHop .35s cubic-bezier(.4,1.6,.6,1)}
@keyframes pawnHop{0%{transform:translateY(0) scale(1)}45%{transform:translateY(-60%) scale(1.3)}100%{transform:translateY(0) scale(1)}}

/* =====================================================
   CENTER INFO
   ===================================================== */
.center-info{grid-column:2/8;grid-row:2/8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--tile-size)*.15);background:radial-gradient(circle at 50% 25%,#fffef5 0%,#fef3c7 45%,#fde68a 100%);border-radius:20px;padding:calc(var(--tile-size)*.4);text-align:center;position:relative;overflow:hidden;box-shadow:inset 0 0 0 2px rgba(245,158,11,.3),inset 0 0 80px rgba(245,158,11,.12),0 0 60px rgba(245,158,11,.25)}
.center-info::before{content:"";position:absolute;inset:-30%;background:conic-gradient(from 0deg,transparent 0deg,rgba(245,158,11,.15) 60deg,transparent 120deg,rgba(245,158,11,.15) 240deg,transparent 300deg);animation:centerSpin 24s linear infinite;pointer-events:none}
@keyframes centerSpin{to{transform:rotate(360deg)}}
.center-info>*{position:relative;z-index:1}

.center-player{display:flex;align-items:center;gap:calc(var(--tile-size)*.15);padding:calc(var(--tile-size)*.1) calc(var(--tile-size)*.25);border-radius:999px;background:rgba(255,255,255,.95);box-shadow:0 4px 12px rgba(0,0,0,.1);max-width:90%;border:2px solid rgba(0,0,0,.05)}
.center-avatar{width:calc(var(--tile-size)*.5);height:calc(var(--tile-size)*.5);border-radius:50%;flex-shrink:0}
.center-name{font-size:calc(var(--tile-size)*.3);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}

.center-dice-box{display:flex;align-items:center;justify-content:center;gap:calc(var(--tile-size)*.2);margin-top:calc(var(--tile-size)*.1)}
.center-dice{font-size:calc(var(--tile-size)*1.2);line-height:1;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25));animation:diceIdle 3s ease-in-out infinite}
@keyframes diceIdle{0%,100%{transform:rotate(-4deg) scale(1)}50%{transform:rotate(4deg) scale(1.06)}}
.center-dice.rolling{animation:diceSpin .9s cubic-bezier(.4,0,.2,1)}
@keyframes diceSpin{0%{transform:rotate(0) scale(1)}25%{transform:rotate(180deg) scale(1.3)}50%{transform:rotate(360deg) scale(.9)}75%{transform:rotate(540deg) scale(1.2)}100%{transform:rotate(720deg) scale(1)}}

.center-roll-btn{padding:calc(var(--tile-size)*.2) calc(var(--tile-size)*.5);border-radius:16px;font-weight:900;font-size:calc(var(--tile-size)*.3);color:#fff;background:linear-gradient(135deg,#fbbf24,#f59e0b 35%,#ef4444);box-shadow:0 10px 24px -8px rgba(239,68,68,.8),inset 0 1px 0 rgba(255,255,255,.4);transition:transform .18s;letter-spacing:.5px;position:relative;overflow:hidden;cursor:pointer;margin-top:calc(var(--tile-size)*.1)}
.center-roll-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 45%);pointer-events:none}
.center-roll-btn:hover:not(:disabled){transform:translateY(-2px)}
.center-roll-btn:active:not(:disabled){transform:scale(.97)}
.center-roll-btn:disabled{opacity:.6;cursor:not-allowed;filter:grayscale(.3)}

.center-status{font-size:calc(var(--tile-size)*.22);font-weight:800;color:#8a6d1a;padding:calc(var(--tile-size)*.08) calc(var(--tile-size)*.2);border-radius:10px;background:rgba(255,255,255,.7);margin-top:calc(var(--tile-size)*.1);max-width:90%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(245,158,11,.2)}

/* =====================================================
   EFFECTS
   ===================================================== */
.money-float{position:fixed;font-size:22px;font-weight:900;pointer-events:none;z-index:9500;text-shadow:0 2px 8px rgba(0,0,0,.4),0 0 12px currentColor;animation:moneyRise 1.4s cubic-bezier(.4,0,.2,1) forwards;white-space:nowrap}
@keyframes moneyRise{0%{opacity:0;transform:translate(-50%,0) scale(.5)}20%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-60px) scale(.95)}}

.turn-banner{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) scale(0);font-family:'Baloo 2',cursive;font-size:clamp(26px,5vmin,44px);font-weight:800;padding:16px 48px;border-radius:999px;background:rgba(255,255,255,.97);color:#2d1b3d;box-shadow:0 30px 80px -20px rgba(0,0,0,.7),0 0 0 2px currentColor;opacity:0;transition:all .4s cubic-bezier(.4,1.6,.6,1);pointer-events:none;z-index:9000;white-space:nowrap;backdrop-filter:blur(10px)}
.turn-banner.show{opacity:1;transform:translate(-50%,-50%) scale(1);animation:bannerBounce .5s ease-out}
@keyframes bannerBounce{0%{transform:translate(-50%,-50%) scale(.6)}60%{transform:translate(-50%,-50%) scale(1.08)}100%{transform:translate(-50%,-50%) scale(1)}}

.confetti{position:fixed;width:10px;height:10px;top:-20px;pointer-events:none;z-index:9999;animation:confettiFall linear forwards;border-radius:2px}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}

/* =====================================================
   MODALS
   ===================================================== */
.mp-overlay{position:fixed;inset:0;z-index:8500;display:grid;place-items:center;padding:18px;background:rgba(10,4,23,.78);backdrop-filter:blur(12px) saturate(1.3);animation:mpFade .22s ease-out;overflow-y:auto}
@keyframes mpFade{from{opacity:0}to{opacity:1}}
.mp-modal{background:linear-gradient(160deg,#fff,#fffaf2);border-radius:24px;padding:26px;width:min(440px,100%);box-shadow:0 40px 100px -30px rgba(0,0,0,.9),0 0 0 1px rgba(245,158,11,.35),inset 0 1px 0 rgba(255,255,255,.95);text-align:center;animation:modalPop .35s cubic-bezier(.4,1.4,.6,1);margin:auto}
@keyframes modalPop{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:none}}
.mp-modal h2{margin:0 0 6px;font-family:'Baloo 2',cursive;font-size:24px;color:#f59e0b;letter-spacing:-.3px}
.mp-modal .sub{color:#8a7aa6;font-size:13px;font-weight:700;margin-bottom:16px}
.mp-modal .prop-info{background:linear-gradient(135deg,#fff8ef,#ffefd4);padding:16px;border-radius:16px;margin:14px 0;font-size:13.5px;font-weight:700;line-height:1.7;border:1px solid rgba(245,158,11,.25);box-shadow:inset 0 2px 8px -4px rgba(245,158,11,.2)}
.mp-modal .prop-info .row{display:flex;justify-content:space-between;margin:3px 0}
.mp-modal .prop-info .row b{color:#e6820a;font-weight:900}
.mp-modal .actions{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.mp-modal .actions .btn{width:100%;padding:14px;font-size:15px}
.mp-modal .actions .btn-buy{background:linear-gradient(135deg,#22c98a,#16a34a);color:#fff;box-shadow:0 10px 24px -10px rgba(22,163,74,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-rent{background:linear-gradient(135deg,#4f8dff,#2563eb);color:#fff;box-shadow:0 10px 24px -10px rgba(37,99,235,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 10px 24px -10px rgba(220,38,38,.7),inset 0 1px 0 rgba(255,255,255,.3)}
.mp-modal .actions .btn-skip{background:linear-gradient(145deg,#f3f4f6,#e5e7eb);color:#6b7280;border:1px solid #d1d5db}

.win-card{background:linear-gradient(160deg,#fff,#fffaf2);padding:32px;border-radius:28px;text-align:center;width:min(420px,92%);box-shadow:0 40px 100px -30px rgba(0,0,0,.9),0 0 0 2px rgba(245,158,11,.4),0 0 80px rgba(245,158,11,.3);animation:modalPop .5s cubic-bezier(.4,1.4,.6,1);margin:auto}
.win-card .emoji{font-size:76px;margin-bottom:12px;animation:emojiBounce 1.2s ease-in-out infinite;filter:drop-shadow(0 12px 24px rgba(245,158,11,.5))}
@keyframes emojiBounce{0%,100%{transform:translateY(0) rotate(-5deg) scale(1)}50%{transform:translateY(-12px) rotate(5deg) scale(1.08)}}
.win-card h2{margin:0 0 10px;font-family:'Baloo 2',cursive;font-size:28px;background:linear-gradient(135deg,#fbbf24,#f59e0b 40%,#ef4444);-webkit-background-clip:text;background-clip:text;color:transparent}
.win-card p{color:#8a7aa6;margin:0 0 22px;font-weight:700;font-size:15px}

.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(24px);padding:12px 24px;border-radius:999px;background:linear-gradient(135deg,#2d1b4e,#1a0f2e);color:#fff;font-weight:800;font-size:14px;z-index:9700;opacity:0;pointer-events:none;transition:all .32s cubic-bezier(.4,1.4,.6,1);box-shadow:0 16px 36px -12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1);border:1px solid rgba(245,158,11,.3)}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

#debugPanel{position:fixed;top:60px;right:8px;z-index:9800;width:min(400px,calc(100vw - 16px));max-height:calc(100vh - 72px);overflow-y:auto;background:linear-gradient(160deg,rgba(12,8,24,.98),rgba(20,10,30,.98));color:#d0f5d0;padding:14px;border-radius:14px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;line-height:1.55;border:1px solid rgba(0,255,0,.4);box-shadow:0 24px 60px -20px rgba(0,0,0,.8),0 0 40px rgba(0,255,136,.15)}
#debugPanel .dbg-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid rgba(0,255,0,.3);font-weight:900;color:#00ff88}
#debugPanel .dbg-head button{padding:5px 9px;border-radius:6px;background:rgba(0,255,136,.12);color:#00ff88;font-size:10px;font-weight:800;border:1px solid rgba(0,255,136,.4);margin-left:4px}
#debugPanel pre{white-space:pre-wrap;word-break:break-all;margin:6px 0;background:rgba(0,0,0,.55);padding:8px;border-radius:5px;font-size:10px;max-height:200px;overflow-y:auto;color:#b0d0b0}
#debugPanel .kv{display:flex;gap:6px;padding:3px 0;font-size:10px}
#debugPanel .kv .k{color:#7eb4ff;min-width:70px;font-weight:700}
#debugPanel .kv .v{color:#d0f5d0;flex:1;word-break:break-all}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

  var HTML = `
<div id="mpApp">
  <div class="hud-float">
    <button class="icon-btn" id="soundBtn" title="Âm thanh">🔊</button>
    <button class="icon-btn" id="debugBtn" title="Debug">🐞</button>
    <button class="icon-btn" id="quitBtn" title="Thoát" style="background:#ef4444;color:#fff;border-color:#dc2626">✕</button>
  </div>

  <section id="menuScreen" class="screen">
    <div class="setup-card">
      <div class="hero">
        <h1>🎩 Cờ Tỷ Phú</h1>
        <p>Mua nhà, cướp đất, phá sản đối thủ — ai sống cuối cùng là tỷ phú!</p>
      </div>
      <div class="field" style="text-align:center;margin-top:12px">
        <label>Chào mừng</label>
        <div id="myDisplayName" style="font-size:19px;font-weight:900;color:#f59e0b">...</div>
      </div>
      <div class="field" style="margin-top:16px"><label>Kiểu chơi</label>
        <div class="play-mode-grid" id="playModeGrid">
          <button class="play-card active" data-playmode="bot"><span class="icon">🤖</span>Đấu Bot</button>
          <button class="play-card" data-playmode="online"><span class="icon">🌐</span>Online</button>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="continueBtn" style="margin-top:18px">Tiếp tục →</button>
    </div>
  </section>

  <section id="onlineScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🌐 Phòng chơi</h2>
      <button class="btn btn-primary btn-lg" id="createRoomBtn">➕ Tạo phòng mới</button>
      <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center">
        <b style="font-size:12.5px;color:#6b5b85">Phòng đang chờ</b>
        <button class="btn btn-ghost btn-sm" id="refreshRoomsBtn">↻ Làm mới</button>
      </div>
      <div id="roomsList" style="margin-top:10px"></div>
      <button class="btn btn-ghost btn-lg" id="backFromOnlineBtn" style="margin-top:18px">← Quay lại</button>
    </div>
  </section>

  <section id="waitingScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>⏳ Phòng chờ</h2>
      <div style="font-weight:800;margin:14px 0 8px;font-size:13.5px">👥 Người chơi (<span id="waitingCount">0</span>/4)</div>
      <div id="waitingPlayers"></div>
      <div id="hostControls">
        <button class="btn btn-primary btn-lg" id="hostStartBtn" disabled>⏳ Cần 2 người</button>
      </div>
      <button class="btn btn-ghost btn-lg" id="leaveRoomBtn" style="margin-top:9px">Rời phòng</button>
    </div>
  </section>

  <section id="localSetupScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🤖 Đấu với Bot</h2>
      <div class="field" style="margin-top:14px"><label>Số Bot</label>
        <div style="display:flex;gap:9px" id="botCountSeg">
          <button class="btn btn-ghost active" data-c="1" style="flex:1">1 Bot</button>
          <button class="btn btn-ghost" data-c="2" style="flex:1">2 Bot</button>
          <button class="btn btn-ghost" data-c="3" style="flex:1">3 Bot</button>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="startLocalBtn" style="margin-top:22px">🚀 Bắt đầu</button>
      <button class="btn btn-ghost btn-lg" id="backFromLocalBtn" style="margin-top:9px">← Quay lại</button>
    </div>
  </section>

  <section id="gameScreen" class="game-screen" hidden>
    <div class="board" id="board"><div class="board-grid" id="boardGrid"></div></div>
    <div class="turn-banner" id="turnBanner"></div>
  </section>

  <div class="mp-overlay" id="actionOverlay" hidden><div class="mp-modal" id="actionModal"></div></div>
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
  function fmtShort(n) { return n >= 1000 ? '$' + (n/1000) + 'k' : '$' + n; }
  function avt(s) { return 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + encodeURIComponent(s) + '&backgroundColor=ffd5dc,b6e3f4,d1d4f9&radius=14'; }
  function toast(msg) {
    var el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2500);
  }

  var FALLBACK = {
    URL: 'https://tumjcsaexddioecwjolp.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ'
  };
  var CFG = window.__SRANK_CONFIG || FALLBACK;
  var sb = null;
  if (window.supabase && CFG.SUPABASE_URL) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });

  var ZONES = [
    { name: 'Nhà nghèo', short: 'Nghèo', price: 10000, color: '#7eb4ff', soft: '#dbeafe' },
    { name: 'Nhà giàu', short: 'Giàu', price: 15000, color: '#22c98a', soft: '#d1fae5' },
    { name: 'Địa chủ', short: 'Đ.chủ', price: 20000, color: '#f6a723', soft: '#fed7aa' },
    { name: 'Đại gia', short: 'Đ.gia', price: 25000, color: '#ef4444', soft: '#fecaca' }
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

  var state = { playMode: 'bot', botCount: 1, game: null, busy: false, animating: false };
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

  /* ============================ LAYOUT ============================ */
  function fitBoard() {
    var board = $('board');
    if (!board) return;
    var w = board.clientWidth;
    var h = board.clientHeight;
    var tileW = (w - 29) / 8;
    var tileH = (h - 29) / 8;
    var minTile = Math.min(tileW, tileH);
    board.style.setProperty('--tile-size', minTile + 'px');
  }

  /* ============================ EFFECTS ============================ */
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
    var pawn = shadow.querySelector('.pawn-box[data-user="' + username + '"]');
    var rect = pawn ? pawn.getBoundingClientRect() : { left: window.innerWidth/2, right: window.innerWidth/2, top: window.innerHeight/2 };
    var f = document.createElement('div');
    f.className = 'money-float';
    f.textContent = (amount > 0 ? '+' : '−') + '$' + Math.abs(amount).toLocaleString();
    f.style.left = (rect.left + rect.width / 2) + 'px';
    f.style.top = (rect.top) + 'px';
    f.style.color = amount > 0 ? '#16a34a' : '#ef4444';
    shadow.appendChild(f);
    setTimeout(function () { try { f.remove(); } catch (e) {} }, 1500);
  }

  function screenShake() {
    host.style.animation = 'none';
    void host.offsetWidth;
    host.style.animation = 'mpShakeScreen .6s ease-out';
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
      if (Math.random() > 0.6) c.style.borderRadius = '50%';
      shadow.appendChild(c);
      (function (el) { setTimeout(function () { try { el.remove(); } catch (e) {} }, 5500); })(c);
    }
  }

  /* ============================ BOARD RENDER ============================ */
  function renderStaticTiles() {
    var grid = $('boardGrid');
    grid.innerHTML = '';
    var me = state.game.players.find(function(p){ return p.username === myUsername; });

    for (var i = 0; i < 28; i++) {
      var rc = tileRowCol(i);
      var tile = state.game.tiles[i];
      var el = document.createElement('div');
      el.style.gridRow = rc.row;
      el.style.gridColumn = rc.col;
      el.dataset.idx = i;

      if (tile.type === 'start') {
        el.className = 'tile corner start';
        el.innerHTML = '<div class="corner-icon">🏁</div><div class="corner-label">START</div>';
      } else if (tile.type === 'jail') {
        el.className = 'tile corner jail';
        el.innerHTML = '<div class="corner-icon">🚔</div><div class="corner-label">JAIL</div>';
      } else if (tile.type === 'reward') {
        el.className = 'tile corner reward';
        el.innerHTML = '<div class="corner-icon">🎁</div><div class="corner-label">REWARD</div>';
      } else if (tile.type === 'teleport') {
        el.className = 'tile corner teleport';
        el.innerHTML = '<div class="corner-icon">🌀</div><div class="corner-label">WARP</div>';
      } else if (tile.type === 'prop') {
        el.className = 'tile prop';
        el.style.setProperty('--zone-color', ZONES[tile.zone].color);
        var owner = tile.owner ? state.game.players.find(function (p) { return p.username === tile.owner; }) : null;
        
        if (owner) {
          el.classList.add('owned');
          el.style.setProperty('--owner-color', owner.color);
          el.style.setProperty('--owner-bg', owner.soft); // Lấy màu pastel làm nền
        }
        
        var bandText = owner ? ('Lv.' + tile.level) : fmtShort(ZONES[tile.zone].price);
        var nameShort = ZONES[tile.zone].short;
        var body = '';
        
        if (owner) {
          var lv = '';
          for (var l = 0; l < tile.level; l++) lv += '<span>🏠</span>';
          body += '<div class="tile-levels">' + lv + '</div>';
        } else {
          body += '<div class="tile-name">' + nameShort + '</div>';
        }
        
        el.innerHTML = '<div class="tile-band"><span class="tile-band-text">' + bandText + '</span></div>' +
                       '<div class="tile-body">' + body + '</div>';
      }

      // Highlight nhấp nháy vị trí của BẠN
      if (me && me.pos === i && !me.bankrupt) {
        el.classList.add('my-position');
        el.style.setProperty('--my-color', me.color);
        el.style.setProperty('--my-color-alpha', me.soft);
      }

      grid.appendChild(el);
    }

    var center = document.createElement('div');
    center.className = 'center-info';
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    center.innerHTML =
      '<div class="center-player">' +
        (curP ? '<img class="center-avatar" src="' + curP.avatar + '" style="box-shadow:0 0 0 3px ' + curP.color + '">' +
        '<div class="center-name" style="color:' + curP.color + '">' + esc(curP.name) + '</div>' : '') +
      '</div>' +
      '<div class="center-dice-box"><div class="center-dice" id="centerDice">🎲</div></div>' +
      '<button class="center-roll-btn" id="rollBtn">🎲 TUNG XÚC XẮC</button>' +
      '<div class="center-status" id="rollInfo">...</div>';
    grid.appendChild(center);
    
    $('rollBtn').onclick = function () { executeRoll(); };
    syncRollBtn();
  }

  function renderCenter() {
    var grid = $('boardGrid');
    var old = grid.querySelector('.center-info');
    if (old) {
      var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
      var playerEl = old.querySelector('.center-player');
      if (playerEl && curP) {
        playerEl.innerHTML = '<img class="center-avatar" src="' + curP.avatar + '" style="box-shadow:0 0 0 3px ' + curP.color + '">' +
          '<div class="center-name" style="color:' + curP.color + '">' + esc(curP.name) + '</div>';
      }
    }
  }

  function renderPawns() {
    var grid = $('boardGrid');
    grid.querySelectorAll('.tile-players').forEach(function (c) { c.remove(); });
    var posMap = {};
    state.game.players.forEach(function (p) {
      if (p.bankrupt) return;
      if (!posMap[p.pos]) posMap[p.pos] = [];
      posMap[p.pos].push(p);
    });
    Object.keys(posMap).forEach(function (pos) {
      var tileEl = grid.querySelector('[data-idx="' + pos + '"]');
      if (!tileEl) return;
      var container = document.createElement('div');
      container.className = 'tile-players';
      posMap[pos].forEach(function (p) {
        var box = document.createElement('div');
        box.className = 'pawn-box';
        box.dataset.user = p.username;
        
        var moneyStr = p.money >= 1000 ? '$' + (p.money/1000).toFixed(0) + 'k' : '$' + p.money;
        box.innerHTML = '<img src="' + p.avatar + '" style="box-shadow:0 0 0 2px ' + p.color + ', 0 2px 4px rgba(0,0,0,.5)">' +
                        '<span class="pawn-money">' + moneyStr + '</span>';
        container.appendChild(box);
      });
      tileEl.appendChild(container);
    });
  }

  function renderAll() {
    if (!state.game) return;
    renderStaticTiles();
    renderPawns();
    requestAnimationFrame(fitBoard);
  }

  function syncRollBtn() {
    var btn = $('rollBtn');
    var info = $('rollInfo');
    if (!btn || !info) return;
    if (!state.game || state.game.winner) { btn.disabled = true; info.textContent = 'Đã kết thúc'; return; }
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    if (!curP) { btn.disabled = true; return; }
    var isMe = curP.username === myUsername;
    var isBot = curP.bot;
    var hasPending = state.game.pending_action && state.game.pending_action.player === myUsername;
    btn.disabled = !isMe || isBot || state.busy || hasPending || state.animating;
    if (isBot) info.textContent = '🤖 ' + curP.name + ' đang chơi...';
    else if (hasPending) info.textContent = '⏳ Chọn hành động...';
    else if (isMe) info.textContent = '👉 Nhấn tung!';
    else info.textContent = '⏳ Đang chờ...';
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
        renderCenter();
        await sleep(700);
        advanceTurn();
        return;
      }

      var dice = 1 + rnd(6);

      var centerDice = $('centerDice');
      if (centerDice) {
        centerDice.classList.add('rolling');
        sfx.roll();
        var swap2 = setInterval(function () { centerDice.textContent = DICE_FACES[rnd(6)]; }, 55);
        await sleep(750);
        clearInterval(swap2);
        centerDice.classList.remove('rolling');
        centerDice.textContent = DICE_FACES[dice - 1];
      }

      var oldPos = player.pos;
      var steps = dice;
      var passed = (oldPos + dice) >= 28;

      if (state.playMode !== 'online') {
        await animateStepMove(player, steps);
      } else {
        player.pos = (oldPos + dice) % 28;
        renderPawns();
      }
      sfx.land();

      if (passed) {
        player.money += 10000;
        state.game.tiles.forEach(function (t) {
          if (t.type === 'prop' && t.owner === player.username && t.level < 5) t.level++;
        });
        showMoneyFloat(player.username, 10000);
      }

      renderStaticTiles();
      renderPawns();
      renderCenter();
      await sleep(280);

      await resolveTile(player, player.pos);
    } finally {
      state.animating = false;
      syncRollBtn();
    }
  }

  async function animateStepMove(player, steps) {
    var grid = $('boardGrid');
    var myPawnBox = grid.querySelector('.pawn-box[data-user="' + player.username + '"]');
    var me = state.game.players.find(function(p){ return p.username === myUsername; });
    
    for (var s = 0; s < steps; s++) {
      // Xóa viền phát sáng của ô cũ (nếu đang là lượt của mình)
      if (me && player.username === myUsername) {
        var oldTile = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (oldTile) oldTile.classList.remove('my-position');
      }

      player.pos = (player.pos + 1) % 28;

      // Thêm viền phát sáng vào ô mới
      if (me && player.username === myUsername) {
        var newHighlightTile = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (newHighlightTile) {
          newHighlightTile.classList.add('my-position');
          newHighlightTile.style.setProperty('--my-color', me.color);
          newHighlightTile.style.setProperty('--my-color-alpha', me.soft);
        }
      }

      if (myPawnBox) {
        var newTile = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (newTile) {
          var container = newTile.querySelector('.tile-players');
          if (!container) {
            container = document.createElement('div');
            container.className = 'tile-players';
            newTile.appendChild(container);
          }
          container.appendChild(myPawnBox);
          myPawnBox.querySelector('img').classList.remove('hopping');
          void myPawnBox.offsetWidth;
          myPawnBox.querySelector('img').classList.add('hopping');
        }
      }
      sfx.step();
      await sleep(170);
    }
    if (myPawnBox) myPawnBox.querySelector('img').classList.remove('hopping');
  }

  async function resolveTile(player, tileIdx) {
    var tile = state.game.tiles[tileIdx];

    if (tile.type === 'start') {
      if (tileIdx === player.pos && player.pos === 0) {
        player.money += 5000;
        showMoneyFloat(player.username, 5000);
        sfx.buy();
      }
      await commitAndRender();
      advanceTurn();
      return;
    }

    if (tile.type === 'jail') {
      player.jail_turns = 2;
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
        sfx.buy();
      } else if (target.owner !== player.username) {
        target.owner = player.username;
        sfx.buy();
      } else {
        player.money += 5000;
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
          showMoneyFloat(player.username, -price);
          sfx.buy();
          await commitAndRender();
          await sleep(500);
        } else {
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
    sfx.lose();
    screenShake();
    var alive = state.game.players.filter(function (p) { return !p.bankrupt; });
    if (alive.length === 1) {
      state.game.winner = alive[0].username;
      state.game.finished_at = Date.now();
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

  /* ============================ HUMAN HANDLERS ============================ */
  async function handleBuyEmpty(yes) {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'buy_empty') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    if (yes && player.money >= pa.price) {
      player.money -= pa.price;
      state.game.tiles[pa.tileIdx].owner = player.username;
      state.game.tiles[pa.tileIdx].level = 1;
      showMoneyFloat(player.username, -pa.price);
      sfx.buy();
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
      showMoneyFloat(player.username, -pa.rentPrice);
      if (owner) showMoneyFloat(owner.username, pa.rentPrice);
      sfx.pay();
    } else if (action === 'buy') {
      if (player.money < pa.chainValue) return toast('Không đủ tiền mua!');
      player.money -= pa.chainValue;
      if (owner) owner.money += pa.chainValue;
      tile.owner = player.username;
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
      started_at: Date.now(), winner: null, pending_action: null
    };
    showScreen('gameScreen');
    renderAll();
    setTimeout(function () { showTurnBanner(players[0].name, players[0].color); }, 400);
    dbgEvent('LOCAL_START', 'players=' + players.length);
  }

  /* ============================ ONLINE ============================ */
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
      started_at: Date.now(), winner: null, pending_action: null
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
    if (newG.winner) showWinOverlay();
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
          if (document.getElementById('monopolyHost').style.display !== 'block') showScreen('gameScreen');
          handleRemoteState(state.game, row.state);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoly_room_players', filter: 'room_id=eq.' + room.id }, function () {
        refreshPlayers();
      })
      .subscribe(function (status) { dbgEvent('REALTIME_STATUS', status); });

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      if (!room) return;
      try {
        var r = await sb.from('monopoly_rooms').select('*').eq('id', room.id).maybeSingle();
        if (r.data) {
          room = r.data;
          if (room.status === 'playing' && room.state) {
            if (document.getElementById('monopolyHost').style.display !== 'block') showScreen('gameScreen');
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

  /* ============================ DEBUG ============================ */
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

  /* ============================ NAV ============================ */
  function showScreen(id) {
    ['menuScreen', 'onlineScreen', 'waitingScreen', 'localSetupScreen', 'gameScreen'].forEach(function (sid) {
      var el = $(sid);
      if (el) el.hidden = (sid !== id);
    });
    if (id === 'gameScreen') {
      requestAnimationFrame(function () { requestAnimationFrame(fitBoard); });
    }
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
      if (room) enterWait();
      else showScreen('menuScreen');
    };

    window.addEventListener('resize', fitBoard);
    window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 300); });
  }

  async function init() {
    myUsername = getMyUsername();
    myProfile = { display_name: myUsername, avatar_url: avt(myUsername) };
    var elName = $('myDisplayName');
    if (elName) elName.textContent = myUsername;
    bindEvents();
    dbgEvent('INIT', 'Monopoly v2.4 initialized.');
  }

  function openGame() {
    host.style.display = 'block';
    init();
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }

  function closeGame() {
    host.style.display = 'none';
    if (room) leaveRoom();
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  closeBtn.onclick = function () { closeGame(); };
  window.openMonopolyGame = function () { openGame(); };

})();