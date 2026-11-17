/* =====================================================================
   CỜ TỶ PHÚ — MONOPOLY (v4.1 — CRYPTO TYCOON RPG + CLOUD SYNC)
   Profile persists on Supabase · LocalStorage as offline cache
   ===================================================================== */
(function () {
  'use strict';
  if (window.__monopolyLoaded) return;
  window.__monopolyLoaded = true;

  var CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;height:100%;width:100%;margin:0;background:#050508}
#mpApp{position:fixed;inset:0;font-family:'Rajdhani',sans-serif;color:#e2e8f0;overflow:hidden;background:#050508;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;--tile-size:60px}
[hidden]{display:none!important}
button{font-family:inherit;cursor:pointer;border:0;background:none;color:inherit}
#mpApp::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(0,240,255,.15) 0%,transparent 50%),radial-gradient(circle at 10% 90%,rgba(255,42,117,.15) 0%,transparent 50%),linear-gradient(180deg,#050508 0%,#0a0f1c 100%);pointer-events:none;z-index:0}
#mpApp::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(0,240,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.03) 1px,transparent 1px);background-size:30px 30px;pointer-events:none;z-index:0;opacity:.5}
.market-ticker{position:absolute;top:0;left:0;width:100%;height:32px;background:rgba(0,0,0,.9);border-bottom:1px solid #ff2a75;z-index:100;overflow:hidden;display:flex;align-items:center;box-shadow:0 0 20px rgba(255,42,117,.4)}
.market-ticker-text{white-space:nowrap;font-family:'Orbitron',sans-serif;font-weight:700;font-size:14px;color:#ff2a75;letter-spacing:2px;animation:tickerMove 15s linear infinite;text-shadow:0 0 10px #ff2a75}
@keyframes tickerMove{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}
.market-ticker.active .market-ticker-text{color:#ffcc00;text-shadow:0 0 10px #ffcc00}
.screen{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto}
.setup-card{max-width:480px;width:100%;background:rgba(10,15,28,.85);backdrop-filter:blur(20px);border-radius:16px;padding:28px;border:1px solid rgba(0,240,255,.3);box-shadow:0 0 40px rgba(0,240,255,.1),inset 0 0 20px rgba(0,240,255,.05);animation:cardIn .5s cubic-bezier(.4,1.4,.6,1);margin:auto}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}
.setup-card .hero{text-align:center;margin-bottom:20px}
.setup-card .hero h1{margin:0 0 8px;font-family:'Orbitron',sans-serif;font-size:32px;letter-spacing:2px;text-transform:uppercase;background:linear-gradient(90deg,#00f0ff,#ff2a75);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 10px rgba(0,240,255,.5))}
.setup-card .hero p{margin:0;color:#a0aabf;font-size:15px;font-weight:600;letter-spacing:.5px}
.setup-card h2{margin:0 0 16px;font-family:'Orbitron',sans-serif;font-size:20px;color:#00f0ff;text-align:center;letter-spacing:1.5px;text-shadow:0 0 10px rgba(0,240,255,.4)}
.field{display:flex;flex-direction:column;gap:10px;margin-top:18px}
.field>label{font-size:12px;font-weight:700;color:#00f0ff;text-transform:uppercase;letter-spacing:2px}
.play-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.play-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 10px;border-radius:12px;background:rgba(0,240,255,.05);border:1px solid rgba(0,240,255,.2);cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:14px;color:#a0aabf;transition:all .2s}
.play-card:hover{border-color:rgba(0,240,255,.6);color:#00f0ff}
.play-card.active{background:rgba(0,240,255,.15);border-color:#00f0ff;color:#fff;box-shadow:0 0 20px rgba(0,240,255,.3)}
.play-card .icon{font-size:28px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;border-radius:8px;font-family:'Orbitron',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;transition:all .2s;position:relative;overflow:hidden}
.btn:hover:not(:disabled){transform:translateY(-2px)}
.btn:active:not(:disabled){transform:scale(.98)}
.btn:disabled{opacity:.4;cursor:not-allowed;filter:grayscale(1)}
.btn-primary{color:#000;background:linear-gradient(90deg,#00f0ff,#00ff66);box-shadow:0 0 20px rgba(0,240,255,.4)}
.btn-ghost{background:rgba(255,255,255,.05);color:#a0aabf;border:1px solid rgba(255,255,255,.2)}
.btn-ghost.active{background:rgba(0,240,255,.15);color:#00f0ff;border-color:#00f0ff}
.btn-lg{padding:16px 28px;font-size:15px;width:100%}
.btn-sm{padding:8px 16px;font-size:12px}
.room-item{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);margin-bottom:10px}
.room-item-info{flex:1;min-width:0}
.room-item-host{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:700;color:#fff}
.room-item-meta{font-size:13px;color:#a0aabf;font-weight:600;margin-top:4px}
.room-item-join{padding:10px 18px;border-radius:8px;font-family:'Orbitron',sans-serif;font-weight:700;font-size:12px;color:#000;background:linear-gradient(90deg,#00f0ff,#00ff66)}
.room-item-join:disabled{opacity:.4;cursor:not-allowed;filter:grayscale(1)}
.game-screen{position:absolute;inset:0;z-index:10;overflow:hidden;background:#050508}
.board{position:absolute;inset:0;padding:6px;padding-top:38px}
.board-grid{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:100%;height:100%;gap:4px}
.tile{position:relative;border-radius:6px;overflow:hidden;background:#0d111a;border:1px solid #1a2235;box-shadow:0 4px 10px rgba(0,0,0,.5);display:flex;flex-direction:column;transition:all .3s}
.tile.corner{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.corner-icon{font-size:calc(var(--tile-size)*.5);line-height:1;filter:drop-shadow(0 0 8px rgba(255,255,255,.3))}
.corner-label{font-family:'Orbitron',sans-serif;font-size:calc(var(--tile-size)*.13);font-weight:900;letter-spacing:1px;text-transform:uppercase;line-height:1;color:#fff;text-shadow:0 0 5px currentColor}
.tile.start{border-color:#00ff66;background:linear-gradient(180deg,rgba(0,255,102,.1),#0d111a)}
.tile.jail{border-color:#ff2a75;background:linear-gradient(180deg,rgba(255,42,117,.1),#0d111a)}
.tile.reward{border-color:#ffcc00;background:linear-gradient(180deg,rgba(255,204,0,.1),#0d111a);box-shadow:0 0 15px rgba(255,204,0,.2)}
.tile.teleport{border-color:#b000ff;background:linear-gradient(180deg,rgba(176,0,255,.1),#0d111a);box-shadow:0 0 15px rgba(176,0,255,.2)}
.tile.prop .tile-band{height:24%;min-height:12px;background:var(--zone-color);display:flex;align-items:center;justify-content:center}
.tile-band-text{font-family:'Orbitron',sans-serif;font-size:calc(var(--tile-size)*.16);font-weight:900;color:#000;letter-spacing:.5px;white-space:nowrap}
.tile.prop .tile-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;position:relative;background:#0d111a}
.tile-name{font-family:'Orbitron',sans-serif;font-size:calc(var(--tile-size)*.15);font-weight:700;color:#a0aabf;text-align:center;line-height:1.1;white-space:nowrap}
.tile.prop.owned .tile-body{background:rgba(0,0,0,.4)}
.tile.prop.my-land{border-color:var(--owner-color)!important;box-shadow:inset 0 0 20px var(--owner-color),0 0 15px var(--owner-color)!important;transform:scale(1.02);z-index:4}
.tile.prop.my-land .tile-body{background:linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(0,0,0,.6) 100%)!important}
.my-land-badge{position:absolute;top:2px;right:2px;font-size:calc(var(--tile-size)*.2);z-index:10;filter:drop-shadow(0 0 5px #fff)}
.tile.prop.other-land{border-color:rgba(255,255,255,.2);box-shadow:inset 0 0 10px rgba(0,0,0,.8)}
.tile.prop.other-land .tile-body{opacity:.7}
.tile-levels{display:flex;gap:2px;margin-top:4px}
.tile-levels span{font-size:calc(var(--tile-size)*.2);line-height:1}
.tile.my-position{animation:neonPulse 1s infinite alternate;z-index:5;border-width:2px}
@keyframes neonPulse{0%{box-shadow:inset 0 0 10px var(--my-color),0 0 15px var(--my-color);border-color:var(--my-color)}100%{box-shadow:inset 0 0 30px var(--my-color),0 0 40px var(--my-color);border-color:#fff}}
.tile-players{position:absolute;bottom:4px;left:0;right:0;display:flex;justify-content:center;gap:4px;z-index:6;flex-wrap:wrap}
.pawn-box{display:flex;flex-direction:column;align-items:center;line-height:1}
.pawn-box img{width:calc(var(--tile-size)*.35);height:calc(var(--tile-size)*.35);border-radius:50%;border:2px solid var(--avatar-color);box-shadow:0 0 10px var(--avatar-color);background:#000}
.pawn-money{font-family:'Orbitron',sans-serif;font-size:calc(var(--tile-size)*.14);font-weight:900;color:#00ff66;background:rgba(0,0,0,.8);padding:2px 4px;border-radius:4px;margin-top:2px;border:1px solid #00ff66}
.pawn-box img.hopping{animation:pawnHop .35s ease-out}
@keyframes pawnHop{0%{transform:translateY(0) scale(1)}50%{transform:translateY(-60%) scale(1.2)}100%{transform:translateY(0) scale(1)}}
.center-info{grid-column:2/8;grid-row:2/8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;background:rgba(10,15,28,.85);border-radius:16px;padding:20px;text-align:center;position:relative;overflow:hidden;border:1px solid rgba(0,240,255,.3);box-shadow:inset 0 0 60px rgba(0,240,255,.05),0 0 40px rgba(0,240,255,.1);backdrop-filter:blur(10px)}
.center-info::before{content:"";position:absolute;inset:0;background:linear-gradient(45deg,transparent,rgba(0,240,255,.05),transparent);animation:scanline 4s linear infinite;pointer-events:none}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
.center-info>*{position:relative;z-index:1}
.center-actions{position:absolute;top:16px;right:16px;display:flex;gap:8px;z-index:10}
.icon-btn-sm{width:38px;height:38px;border-radius:8px;display:grid;place-items:center;font-size:16px;background:rgba(255,255,255,.05);border:1px solid rgba(0,240,255,.3);transition:all .2s;cursor:pointer;color:#fff}
.icon-btn-sm:hover{background:rgba(0,240,255,.2)}
.icon-btn-sm[data-action="quit"]{border-color:rgba(255,42,117,.5);color:#ff2a75}
.event-banner{background:rgba(255,42,117,.2);border:1px solid #ff2a75;padding:8px 16px;border-radius:8px;font-family:'Orbitron',sans-serif;font-size:14px;color:#ffcc00;text-shadow:0 0 10px #ffcc00}
.center-player{display:flex;align-items:center;gap:14px;padding:10px 20px;border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1)}
.center-avatar{width:48px;height:48px;border-radius:50%;flex-shrink:0}
.center-name{font-family:'Orbitron',sans-serif;font-size:18px;font-weight:900;letter-spacing:1px}
.center-dice-box{display:flex;align-items:center;justify-content:center;gap:20px;margin:10px 0}
.dice-item{font-size:70px;line-height:1;filter:drop-shadow(0 0 20px rgba(0,240,255,.6));animation:diceIdle 3s ease-in-out infinite}
.dice-item:nth-child(2){animation-delay:0.5s}
@keyframes diceIdle{0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(5deg) scale(1.05)}}
.dice-item.rolling{animation:diceSpin .9s cubic-bezier(.4,0,.2,1)}
@keyframes diceSpin{0%{transform:rotate(0) scale(1)}25%{transform:rotate(180deg) scale(1.3)}50%{transform:rotate(360deg) scale(.9)}75%{transform:rotate(540deg) scale(1.2)}100%{transform:rotate(720deg) scale(1)}}
.center-roll-btn{padding:16px 40px;border-radius:8px;font-family:'Orbitron',sans-serif;font-weight:900;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:#000;background:linear-gradient(90deg,#00f0ff,#00ff66);box-shadow:0 0 30px rgba(0,240,255,.5);transition:all .2s}
.center-roll-btn:hover:not(:disabled){transform:scale(1.05);box-shadow:0 0 50px rgba(0,240,255,.8)}
.center-roll-btn:disabled{opacity:.3;filter:grayscale(1);cursor:not-allowed}
.center-status{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;color:#a0aabf;padding:8px 16px;border-radius:6px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);margin-top:10px;min-width:200px}
.mp-overlay{position:fixed;inset:0;z-index:8500;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);animation:mpFade .2s ease-out;overflow-y:auto}
@keyframes mpFade{from{opacity:0}to{opacity:1}}
.mp-modal{background:rgba(10,15,28,.95);border-radius:16px;padding:26px;width:min(420px,100%);border:1px solid rgba(0,240,255,.4);box-shadow:0 0 50px rgba(0,240,255,.2);text-align:center;animation:modalPop .3s cubic-bezier(.4,1.4,.6,1);margin:auto}
@keyframes modalPop{from{opacity:0;transform:scale(.9) translateY(20px)}to{opacity:1;transform:none}}
.mp-modal h2{margin:0 0 6px;font-family:'Orbitron',sans-serif;font-size:20px;color:#00f0ff;letter-spacing:1px}
.mp-modal .sub{color:#a0aabf;font-size:13px;font-weight:600;letter-spacing:1px;margin-bottom:16px;text-transform:uppercase}
.mp-modal .prop-info{background:rgba(0,0,0,.4);padding:14px;border-radius:10px;margin:14px 0;font-size:14px;font-weight:600;line-height:1.8;border:1px solid rgba(255,255,255,.1)}
.mp-modal .prop-info .row{display:flex;justify-content:space-between;margin:4px 0;border-bottom:1px dashed rgba(255,255,255,.1);padding-bottom:4px}
.mp-modal .prop-info .row:last-child{border-bottom:none}
.mp-modal .prop-info .row b{font-family:'Orbitron',sans-serif;color:#00f0ff;font-weight:700}
.mp-modal .prop-info .row b.buff{color:#ffcc00}
.mp-modal .prop-info .row b.nerf{color:#ff2a75}
.mp-modal .actions{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.mp-modal .actions .btn{width:100%;padding:14px;font-size:13px}
.mp-modal .actions .btn-buy{background:linear-gradient(90deg,#00ff66,#00f0ff);color:#000}
.mp-modal .actions .btn-rent{background:linear-gradient(90deg,#00f0ff,#0055ff);color:#000}
.mp-modal .actions .btn-danger{background:linear-gradient(90deg,#ff2a75,#b000ff);color:#fff}
.mp-modal .actions .btn-skip{background:rgba(255,255,255,.1);color:#a0aabf;border:1px solid rgba(255,255,255,.2)}
.mp-modal .actions .btn-warning{background:linear-gradient(90deg,#ffcc00,#ff9900);color:#000}
.win-card{background:rgba(10,15,28,.95);padding:32px;border-radius:20px;text-align:center;width:min(440px,92%);border:1px solid rgba(0,240,255,.5);box-shadow:0 0 80px rgba(0,240,255,.3);animation:modalPop .4s;margin:auto}
.win-card .emoji{font-size:80px;margin-bottom:16px;animation:emojiBounce 1.2s infinite;filter:drop-shadow(0 0 20px rgba(0,240,255,.8))}
@keyframes emojiBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px) scale(1.1)}}
.win-card h2{margin:0 0 12px;font-family:'Orbitron',sans-serif;font-size:26px;background:linear-gradient(90deg,#00f0ff,#ff2a75);-webkit-background-clip:text;background-clip:text;color:transparent}
.win-card p{color:#a0aabf;margin:0 0 20px;font-weight:600;font-size:15px}
.win-card .rewards{background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.3);border-radius:10px;padding:12px;margin:12px 0;font-family:'Orbitron',sans-serif;font-size:13px;letter-spacing:1px}
.win-card .rewards div{margin:4px 0;color:#00f0ff}
.toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);padding:12px 24px;border-radius:8px;background:rgba(0,0,0,.9);color:#00f0ff;font-family:'Orbitron',sans-serif;font-weight:700;font-size:14px;z-index:9700;opacity:0;pointer-events:none;transition:all .3s;border:1px solid #00f0ff;box-shadow:0 0 20px rgba(0,240,255,.4)}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.money-float{position:fixed;font-family:'Orbitron',sans-serif;font-size:24px;font-weight:900;pointer-events:none;z-index:9500;text-shadow:0 0 15px currentColor;animation:moneyRise 1.4s cubic-bezier(.4,0,.2,1) forwards;white-space:nowrap}
@keyframes moneyRise{0%{opacity:0;transform:translate(-50%,0) scale(.5)}20%{opacity:1;transform:translate(-50%,-15px) scale(1.2)}100%{opacity:0;transform:translate(-50%,-80px) scale(1)}}
.turn-banner{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) scale(0);font-family:'Orbitron',sans-serif;font-size:clamp(24px,5vmin,40px);font-weight:900;padding:20px 60px;border-radius:8px;background:rgba(0,0,0,.8);color:#fff;border:2px solid currentColor;box-shadow:0 0 40px currentColor;opacity:0;transition:all .4s cubic-bezier(.4,1.6,.6,1);pointer-events:none;z-index:9000;white-space:nowrap;letter-spacing:2px;text-transform:uppercase}
.turn-banner.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.confetti{position:fixed;width:8px;height:8px;top:-20px;pointer-events:none;z-index:9999;animation:confettiFall linear forwards}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
#debugPanel{position:fixed;top:60px;right:12px;z-index:9800;width:min(400px,calc(100vw - 24px));max-height:calc(100vh - 80px);overflow-y:auto;background:rgba(0,0,0,.95);color:#00ff66;padding:14px;border-radius:8px;font-family:monospace;font-size:11px;border:1px solid #00ff66}
#debugPanel .dbg-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid rgba(0,255,102,.3);font-weight:900}
#debugPanel .dbg-head button{padding:4px 8px;border-radius:4px;background:rgba(0,255,102,.1);color:#00ff66;font-size:10px;border:1px solid rgba(0,255,102,.4);margin-left:4px}
#debugPanel pre{white-space:pre-wrap;word-break:break-all;margin:6px 0;background:#000;padding:8px;border-radius:4px;font-size:10px;max-height:200px;overflow-y:auto}
.profile-header{display:flex;align-items:center;gap:16px;margin-bottom:16px}
.profile-header img{width:70px;height:70px;border-radius:50%;border:3px solid #00f0ff;box-shadow:0 0 20px rgba(0,240,255,.5)}
.profile-info{flex:1}
.profile-name{font-family:'Orbitron',sans-serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:4px}
.level-badge{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:700;color:#ffcc00;text-shadow:0 0 10px rgba(255,204,0,.5)}
.xp-bar{position:relative;height:22px;background:rgba(0,0,0,.5);border:1px solid rgba(0,240,255,.3);border-radius:11px;overflow:hidden;margin-bottom:16px}
.xp-fill{height:100%;background:linear-gradient(90deg,#00f0ff,#00ff66);box-shadow:0 0 15px rgba(0,240,255,.6);transition:width .5s}
.xp-text{position:absolute;inset:0;display:grid;place-items:center;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:900;color:#fff;text-shadow:0 0 4px #000;letter-spacing:1px}
.profile-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.stat{background:rgba(255,255,255,.03);border:1px solid rgba(0,240,255,.2);border-radius:10px;padding:12px;text-align:center}
.stat span{display:block;font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;color:#00f0ff;margin-bottom:2px}
.stat label{font-size:11px;font-weight:700;color:#a0aabf;letter-spacing:1px;text-transform:uppercase}
.profile-actions{display:flex;gap:8px;margin-bottom:10px}
.profile-actions .btn{flex:1}
.shop-chips{text-align:center;font-family:'Orbitron',sans-serif;font-size:20px;font-weight:900;color:#ffcc00;text-shadow:0 0 15px rgba(255,204,0,.6);margin-bottom:14px;letter-spacing:2px}
.shop-tabs{display:flex;gap:6px;margin-bottom:14px;background:rgba(0,0,0,.4);border-radius:10px;padding:4px}
.shop-tab{flex:1;padding:10px;border-radius:8px;background:none;color:#a0aabf;font-family:'Orbitron',sans-serif;font-weight:700;font-size:12px;transition:all .2s;cursor:pointer;letter-spacing:1px}
.shop-tab.active{background:rgba(0,240,255,.15);color:#00f0ff;box-shadow:inset 0 0 10px rgba(0,240,255,.2)}
.shop-grid{display:grid;grid-template-columns:1fr;gap:8px;max-height:50vh;overflow-y:auto;padding-right:4px;margin-bottom:14px}
.shop-item{display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px}
.shop-item.owned{border-color:rgba(0,255,102,.4)}
.shop-item.active-item{border-color:#00f0ff;background:rgba(0,240,255,.08);box-shadow:0 0 15px rgba(0,240,255,.2)}
.shop-item-icon{font-size:28px;flex-shrink:0}
.shop-item-info{flex:1;min-width:0}
.shop-item-name{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}
.shop-item-desc{font-size:12px;color:#a0aabf;font-weight:600}
.shop-item-btn{padding:8px 14px;border-radius:8px;font-family:'Orbitron',sans-serif;font-weight:700;font-size:11px;color:#000;background:linear-gradient(90deg,#ffcc00,#ff9900);white-space:nowrap;transition:all .2s;cursor:pointer;letter-spacing:.5px}
.shop-item-btn:disabled{opacity:.5;cursor:not-allowed;filter:grayscale(1)}
.shop-item-btn.equipped{background:rgba(0,240,255,.15);color:#00f0ff;border:1px solid #00f0ff}
.shop-item-btn.equip{background:linear-gradient(90deg,#00ff66,#00f0ff)}
.sp-display{text-align:center;font-family:'Orbitron',sans-serif;font-size:18px;font-weight:900;color:#b000ff;text-shadow:0 0 15px rgba(176,0,255,.6);margin-bottom:14px;letter-spacing:2px}
.skill-branches{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;max-height:55vh;overflow-y:auto;padding-right:4px}
@media (max-width:700px){.skill-branches{grid-template-columns:1fr}}
.skill-branch{background:rgba(255,255,255,.03);border-radius:10px;padding:10px;border:1px solid rgba(255,255,255,.1)}
.skill-branch h3{margin:0 0 10px;font-family:'Orbitron',sans-serif;font-size:13px;color:#00f0ff;text-align:center;letter-spacing:1px}
#branchMerchant h3{color:#ffcc00}
#branchWarrior h3{color:#ff2a75}
#branchMage h3{color:#b000ff}
.skill-node{padding:10px;border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.15);margin-bottom:8px;text-align:center;transition:all .2s;cursor:pointer}
.skill-node:hover{border-color:rgba(0,240,255,.5)}
.skill-node.locked{opacity:.4;cursor:not-allowed;filter:grayscale(1)}
.skill-node.unlocked{border-color:#00ff66;background:rgba(0,255,102,.08);box-shadow:0 0 10px rgba(0,255,102,.2)}
.skill-node .sn-icon{font-size:22px;margin-bottom:4px}
.skill-node .sn-name{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#fff;margin-bottom:2px}
.skill-node .sn-desc{font-size:11px;color:#a0aabf;font-weight:600;line-height:1.3;margin-bottom:4px}
.skill-node .sn-cost{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:900;color:#ffcc00;letter-spacing:.5px}
.skill-node.unlocked .sn-cost{color:#00ff66}
.skill-node.can-learn .sn-cost{color:#00f0ff;animation:spPulse 1.5s infinite}
@keyframes spPulse{0%,100%{opacity:1}50%{opacity:.5}}
.booster-select{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.booster-card{padding:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.15);border-radius:8px;text-align:center;cursor:pointer;transition:all .2s;font-size:11px}
.booster-card:hover{border-color:rgba(0,240,255,.5)}
.booster-card.active{border-color:#00f0ff;background:rgba(0,240,255,.1);box-shadow:0 0 15px rgba(0,240,255,.3)}
.booster-card .bc-icon{font-size:22px;margin-bottom:4px}
.booster-card .bc-name{font-family:'Orbitron',sans-serif;font-size:10px;font-weight:700;color:#fff;margin-bottom:2px;letter-spacing:.5px}
.booster-card .bc-desc{font-size:10px;color:#a0aabf;font-weight:600;line-height:1.2}
.sync-indicator{position:fixed;top:40px;right:16px;z-index:9600;font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;padding:6px 12px;border-radius:6px;background:rgba(0,0,0,.85);color:#00f0ff;border:1px solid rgba(0,240,255,.4);opacity:0;transition:opacity .2s;pointer-events:none;box-shadow:0 0 15px rgba(0,240,255,.3)}
.sync-indicator.show{opacity:1}
.sync-indicator.error{color:#ff2a75;border-color:#ff2a75;box-shadow:0 0 15px rgba(255,42,117,.4)}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

  var HTML = `
<div id="mpApp">
  <div class="market-ticker" id="marketTicker"><div class="market-ticker-text" id="marketTickerText">HỆ THỐNG TRỰC TUYẾN... ĐANG CHỜ SỰ KIỆN TIẾP THEO...</div></div>

  <section id="menuScreen" class="screen">
    <div class="setup-card">
      <div class="hero"><h1>🎩 Cờ Tỷ Phú</h1><p>Trùm Bất Động Sản Metaverse</p></div>
      <div class="field" style="text-align:center;margin-top:8px">
        <label>ID Người Chơi</label>
        <div id="myDisplayName" style="font-family:'Orbitron';font-size:18px;font-weight:900;color:#00f0ff">...</div>
      </div>
      <div class="profile-actions" style="margin-top:14px">
        <button class="btn btn-ghost" id="gotoProfileBtn">👤 Hồ Sơ</button>
        <button class="btn btn-ghost" id="gotoShopBtn">🛒 Shop</button>
        <button class="btn btn-ghost" id="gotoSkillsBtn">🌳 Kỹ Năng</button>
      </div>
      <div class="field" style="margin-top:12px"><label>Chế Độ</label>
        <div class="play-mode-grid" id="playModeGrid">
          <button class="play-card active" data-playmode="bot"><span class="icon">🤖</span>Đấu Bot</button>
          <button class="play-card" data-playmode="online"><span class="icon">🌐</span>Online</button>
        </div>
      </div>
      <button class="btn btn-primary btn-lg" id="continueBtn" style="margin-top:16px">Khởi Tạo Game</button>
    </div>
  </section>

  <section id="profileScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>👤 HỒ SƠ</h2>
      <div class="profile-header"><img id="profileAvatar"><div class="profile-info"><div class="profile-name" id="profileName">...</div><div class="level-badge">Lv.<span id="profileLevel">1</span></div></div></div>
      <div class="xp-bar"><div class="xp-fill" id="xpFill" style="width:0%"></div><div class="xp-text" id="xpText">0/100 XP</div></div>
      <div class="profile-stats">
        <div class="stat"><span id="statWins">0</span><label>Thắng</label></div>
        <div class="stat"><span id="statPlays">0</span><label>Ván</label></div>
        <div class="stat"><span id="statChips">0</span><label>💎 Chips</label></div>
        <div class="stat"><span id="statSP">0</span><label>🔮 SP</label></div>
      </div>
      <div class="profile-actions"><button class="btn btn-primary" id="pShopBtn">🛒 Shop</button><button class="btn btn-ghost" id="pSkillsBtn">🌳 Kỹ Năng</button></div>
      <button class="btn btn-ghost btn-lg" id="backFromProfileBtn" style="margin-top:8px">← Quay Lại</button>
    </div>
  </section>

  <section id="shopScreen" class="screen" hidden>
    <div class="setup-card" style="max-width:600px">
      <h2>🛒 CỬA HÀNG</h2>
      <div class="shop-chips">💎 <span id="shopChips">0</span> Chips</div>
      <div class="shop-tabs"><button class="shop-tab active" data-tab="dice">🎲 Xúc Xắc</button><button class="shop-tab" data-tab="boards">🖼️ Bàn Cờ</button><button class="shop-tab" data-tab="boosters">⚡ Boosters</button></div>
      <div id="shopContent" class="shop-grid"></div>
      <button class="btn btn-ghost btn-lg" id="backFromShopBtn">← Quay Lại</button>
    </div>
  </section>

  <section id="skillsScreen" class="screen" hidden>
    <div class="setup-card" style="max-width:800px">
      <h2>🌳 CÂY KỸ NĂNG</h2>
      <div class="sp-display">🔮 <span id="skillSP">0</span> Skill Points</div>
      <div class="skill-branches">
        <div class="skill-branch" id="branchMerchant"><h3>💼 Thương Nhân</h3><div class="skill-list"></div></div>
        <div class="skill-branch" id="branchWarrior"><h3>⚔️ Chiến Binh</h3><div class="skill-list"></div></div>
        <div class="skill-branch" id="branchMage"><h3>🔮 Pháp Sư</h3><div class="skill-list"></div></div>
      </div>
      <button class="btn btn-ghost btn-lg" id="backFromSkillsBtn">← Quay Lại</button>
    </div>
  </section>

  <section id="onlineScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🌐 Phòng Chơi</h2>
      <button class="btn btn-primary btn-lg" id="createRoomBtn">➕ Tạo Phòng Mới</button>
      <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:12px;color:#a0aabf;letter-spacing:1px">DANH SÁCH PHÒNG</b><button class="btn btn-ghost btn-sm" id="refreshRoomsBtn">↻ Làm Mới</button></div>
      <div id="roomsList" style="margin-top:10px"></div>
      <button class="btn btn-ghost btn-lg" id="backFromOnlineBtn" style="margin-top:18px">← Quay Lại</button>
    </div>
  </section>

  <section id="waitingScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>⏳ Chờ Kết Nối</h2>
      <div style="font-weight:700;margin:14px 0 12px;font-size:13px;color:#00f0ff;letter-spacing:1px">NGƯỜI CHƠI: <span id="waitingCount">0</span>/4</div>
      <div id="waitingPlayers"></div>
      <div id="hostControls"><button class="btn btn-primary btn-lg" id="hostStartBtn" disabled>⏳ Cần 2 người</button></div>
      <button class="btn btn-ghost btn-lg" id="leaveRoomBtn" style="margin-top:8px">Rời Phòng</button>
    </div>
  </section>

  <section id="localSetupScreen" class="screen" hidden>
    <div class="setup-card">
      <h2>🤖 Thiết Lập Bot</h2>
      <div class="field" style="margin-top:14px"><label>Số Lượng Bot</label>
        <div style="display:flex;gap:10px" id="botCountSeg"><button class="btn btn-ghost active" data-c="1" style="flex:1">1 Bot</button><button class="btn btn-ghost" data-c="2" style="flex:1">2 Bot</button><button class="btn btn-ghost" data-c="3" style="flex:1">3 Bot</button></div>
      </div>
      <div class="field" style="margin-top:12px"><label>Booster (tùy chọn)</label><div id="boosterSelect" class="booster-select"></div></div>
      <button class="btn btn-primary btn-lg" id="startLocalBtn" style="margin-top:16px">🚀 Bắt Đầu</button>
      <button class="btn btn-ghost btn-lg" id="backFromLocalBtn" style="margin-top:8px">← Quay Lại</button>
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
      <div class="rewards" id="winRewards"></div>
      <button class="btn btn-primary btn-lg" id="playAgainBtn">🏠 Về Sảnh</button>
    </div>
  </div>
  <div class="toast" id="toast"></div>
  <div class="sync-indicator" id="syncIndicator">💾 Đang lưu...</div>
  <div id="debugPanel" hidden>
    <div class="dbg-head"><span>🐞 DEBUG</span><div><button id="dbgCopy">📋</button><button id="dbgClose">✕</button></div></div>
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
  function avt(s) { return 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=' + encodeURIComponent(s) + '&backgroundColor=00f0ff,ff2a75,00ff66,ffcc00'; }
  function toast(msg) { var el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2500); }

  var FALLBACK = { URL: 'https://tumjcsaexddioecwjolp.supabase.co', KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWpjc2FleGRkaW9lY3dqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjY0MTAsImV4cCI6MjEwNzUwMjQxMH0.hNYdnleEYK5EJFKYxBMxJMdBF1iXsv1aaLHBfb2nPyQ' };
  var CFG = window.__SRANK_CONFIG || FALLBACK;
  var sb = null;
  if (window.supabase && CFG.SUPABASE_URL) sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: false } });

  var ZONES = [
    { name: 'Nhà nghèo', short: 'Nghèo', price: 10000, color: '#00f0ff' },
    { name: 'Nhà giàu', short: 'Giàu', price: 15000, color: '#00ff66' },
    { name: 'Địa chủ', short: 'Đ.chủ', price: 20000, color: '#ffcc00' },
    { name: 'Đại gia', short: 'Đ.gia', price: 25000, color: '#ff2a75' }
  ];
  var ZONE_RANGES = [{ start: 1, end: 6 }, { start: 8, end: 13 }, { start: 15, end: 20 }, { start: 22, end: 27 }];
  var PLAYER_COLORS = [{ c: '#ff2a75' }, { c: '#00f0ff' }, { c: '#00ff66' }, { c: '#ffcc00' }];
  var BOT_NAMES = ['CyberBot', 'NeonViper', 'GlitchKing'];
  var DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  /* ==================== PROFILE / CLOUD SYNC ==================== */
  var DEFAULT_PROFILE = {
    level: 1, xp: 0, skillPoints: 0, chips: 100,
    ownedDice: ['silver'], ownedBoards: ['neon'], ownedBoosters: {},
    activeDice: 'silver', activeBoard: 'neon',
    skills: {}, stats: { wins: 0, plays: 0 }
  };

  function getClientId() {
    var cid = localStorage.getItem('mp_client_id');
    if (!cid) { cid = 'cid_' + rnd(99999999) + '_' + Date.now().toString(36); localStorage.setItem('mp_client_id', cid); }
    return cid;
  }
  var clientId = getClientId();
  var profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
  var saveTimer = null;
  var syncOnline = false;

  function saveProfileLocal() {
    try { localStorage.setItem('mp_profile_v41_' + myUsername, JSON.stringify(profile)); } catch (e) {}
  }
  function loadProfileLocal() {
    try {
      var p = JSON.parse(localStorage.getItem('mp_profile_v41_' + myUsername) || 'null');
      if (p && p.level) return p;
    } catch (e) {}
    return null;
  }

  function profileToRow(p) {
    return {
      username: myUsername,
      client_id: clientId,
      level: p.level, xp: p.xp, skill_points: p.skillPoints, chips: p.chips,
      owned_dice: p.ownedDice, owned_boards: p.ownedBoards, owned_boosters: p.ownedBoosters,
      active_dice: p.activeDice, active_board: p.activeBoard,
      skills: p.skills, stats: p.stats,
      updated_at: new Date().toISOString()
    };
  }
  function rowToProfile(r) {
    return {
      level: r.level || 1, xp: r.xp || 0, skillPoints: r.skill_points || 0, chips: r.chips || 0,
      ownedDice: Array.isArray(r.owned_dice) ? r.owned_dice : ['silver'],
      ownedBoards: Array.isArray(r.owned_boards) ? r.owned_boards : ['neon'],
      ownedBoosters: r.owned_boosters || {},
      activeDice: r.active_dice || 'silver', activeBoard: r.active_board || 'neon',
      skills: r.skills || {}, stats: r.stats || { wins: 0, plays: 0 }
    };
  }

  function setSyncStatus(status) {
    var el = $('syncIndicator'); if (!el) return;
    if (status === 'saving') { el.textContent = '💾 Đang lưu...'; el.className = 'sync-indicator show'; }
    else if (status === 'error') { el.textContent = '⚠️ Lỗi lưu — thử lại sau'; el.className = 'sync-indicator show error'; setTimeout(function () { el.classList.remove('show'); }, 3000); }
    else { el.classList.remove('show'); }
  }

  async function loadProfileFromDB() {
    if (!sb) throw new Error('Supabase chưa sẵn sàng');
    if (!myUsername) throw new Error('Chưa có username');
    var r = await sb.from('monopoly_profiles').select('*').eq('username', myUsername).maybeSingle();
    if (r.error) throw r.error;
    if (!r.data) {
      var insertRow = profileToRow(DEFAULT_PROFILE);
      var ins = await sb.from('monopoly_profiles').insert(insertRow);
      if (ins.error) throw ins.error;
      profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
      dbgEvent('PROFILE_CREATED', myUsername);
    } else {
      if (r.data.client_id !== clientId) {
        dbgEvent('CLIENT_MISMATCH', 'Update client_id cho máy mới');
        await sb.from('monopoly_profiles').update({ client_id: clientId }).eq('username', myUsername);
      }
      profile = rowToProfile(r.data);
      dbgEvent('PROFILE_LOADED', 'Lv.' + profile.level + ' | ' + profile.chips + '💎');
    }
    syncOnline = true;
    saveProfileLocal();
  }

  function scheduleSaveProfile() {
    saveProfileLocal();
    if (!syncOnline) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSaveProfile, 600);
  }
  async function flushSaveProfile() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!syncOnline || !sb) return;
    setSyncStatus('saving');
    var row = profileToRow(profile);
    var upd = await sb.from('monopoly_profiles').update(row).eq('username', myUsername).eq('client_id', clientId).select();
    if (upd.error) { setSyncStatus('error'); dbgEvent('SAVE_ERR', upd.error.message); return; }
    if (!upd.data || upd.data.length === 0) {
      var up = await sb.from('monopoly_profiles').upsert(row, { onConflict: 'username' });
      if (up.error) { setSyncStatus('error'); dbgEvent('UPSERT_ERR', up.error.message); return; }
    }
    setSyncStatus('idle');
  }

  function xpForLevel(lv) { return 100 * lv; }
  function addXP(amount) {
    profile.xp += amount;
    var leveled = false;
    while (profile.xp >= xpForLevel(profile.level)) {
      profile.xp -= xpForLevel(profile.level);
      profile.level++;
      profile.skillPoints++;
      leveled = true;
    }
    if (leveled) { toast('🎉 LEVEL UP! Lv.' + profile.level + ' — +' + profile.skillPoints + ' SP!'); sfx.win(); }
    scheduleSaveProfile();
  }
  function addChips(amount) { profile.chips += amount; scheduleSaveProfile(); }

  var DICE_SKINS = {
    silver: { name: 'Xúc Xắc Bạc', cost: 0, icon: '⚪', desc: 'Cân bằng hoàn hảo' },
    gold: { name: 'Xúc Xắc Vàng', cost: 300, icon: '🟡', desc: '+10% cơ hội ra 6' },
    matrix: { name: 'Xúc Xắc Ma Trận', cost: 800, icon: '🟢', desc: '15% cơ hội ra giống lần trước' },
    neon: { name: 'Xúc Xắc Neon', cost: 1500, icon: '🔵', desc: 'Nghèo: tăng cơ hội ra 1-3' }
  };
  var BOARD_SKINS = {
    neon: { name: 'Neon City', cost: 0, icon: '🌃', desc: 'Xanh lam mặc định' },
    matrix: { name: 'Matrix', cost: 500, icon: '🟩', desc: 'Xanh lá hacker' },
    blood: { name: 'Blood Moon', cost: 1000, icon: '🌕', desc: 'Đỏ máu huyền bí' },
    void: { name: 'Cyber Void', cost: 2000, icon: '⚫', desc: 'Tím vũ trụ sâu thẳm' }
  };
  var BOOSTERS = {
    charm: { name: 'Bùa May Mắn', cost: 50, icon: '🍀', desc: 'Tránh JAIL 1 lần' },
    card: { name: 'Thẻ Tín Dụng', cost: 80, icon: '💳', desc: '+$50k khởi đầu' },
    shield: { name: 'Khiên Thuế', cost: 120, icon: '🛡️', desc: 'Miễn thuế 1 lần' },
    stock: { name: 'Chứng Khoán', cost: 200, icon: '📈', desc: '+20% qua START' }
  };
  var SKILL_DEFS = {
    m_buy: { name: 'Mặc Cả', desc: 'Mua đất -10%', cost: 1, branch: 'merchant', req: null, icon: '💼' },
    m_up: { name: 'Đầu Tư', desc: 'Nâng cấp -25%', cost: 2, branch: 'merchant', req: 'm_buy', icon: '📊' },
    m_chain: { name: 'Trùm Cuối', desc: 'Chuỗi ≥3: thuế +50%', cost: 3, branch: 'merchant', req: 'm_up', icon: '👑' },
    w_buyback: { name: 'Áp Đảo', desc: 'Mua lại -15%', cost: 1, branch: 'warrior', req: null, icon: '⚔️' },
    w_rent: { name: 'Bóc Lột', desc: 'Thuế thu +20%', cost: 2, branch: 'warrior', req: 'w_buyback', icon: '💰' },
    w_empire: { name: 'Đế Chế', desc: '+3% thuế/đất khác', cost: 3, branch: 'warrior', req: 'w_rent', icon: '🏰' },
    g_dice: { name: 'Bước Nhảy', desc: 'Tung đầu tiên +1', cost: 1, branch: 'mage', req: null, icon: '✨' },
    g_revive: { name: 'Tái Sinh', desc: 'Phá sản → hồi sinh $50k', cost: 2, branch: 'mage', req: 'g_dice', icon: '🔮' },
    g_time: { name: 'Thời Gian', desc: 'Double x2 → lượt 3', cost: 3, branch: 'mage', req: 'g_revive', icon: '⏳' }
  };

  function hasSkill(id) { return !!profile.skills[id]; }

  /* ==================== STATE ==================== */
  var state = { playMode: 'bot', botCount: 1, game: null, busy: false, animating: false, selectedBooster: null };
  var myUsername = '', myProfile = null;
  var room = null, roomPlayers = [];
  var roomChan = null, roomsChan = null, pollTimer = null, isHost = false, debugOpen = false, dbgEvents = [];
  var lastDiceRoll = 0, consecutiveLowRolls = 0;

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
    } catch (e) {}
    if (!u) { u = localStorage.getItem('srank_guest_id'); if (!u) { u = 'guest_' + rnd(99999); localStorage.setItem('srank_guest_id', u); } }
    return String(u).trim();
  }

  /* ==================== AUDIO ==================== */
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
    roll: function () { for (var i = 0; i < 6; i++) setTimeout(function () { beep(400 + rnd(400), .05, 'square', .03); }, i * 50); },
    step: function () { beep(800 + rnd(200), .05, 'sine', .02); },
    land: function () { beep(600, .1, 'sine', .04); },
    buy: function () { [659, 880, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, .1, 'triangle', .05); }, i * 70); }); },
    pay: function () { [300, 250, 200].forEach(function (f, i) { setTimeout(function () { beep(f, .15, 'sawtooth', .04); }, i * 70); }); },
    win: function () { [523, 659, 784, 1046, 1318, 1567].forEach(function (f, i) { setTimeout(function () { beep(f, .15, 'square', .05); }, i * 80); }); },
    lose: function () { [400, 300, 200, 100].forEach(function (f, i) { setTimeout(function () { beep(f, .2, 'sawtooth', .05); }, i * 100); }); },
    event: function () { [880, 1108, 1318, 1760].forEach(function (f, i) { setTimeout(function () { beep(f, .2, 'square', .06); }, i * 100); }); }
  };

  /* ==================== HELPERS ==================== */
  function fitBoard() {
    var board = $('board'); if (!board) return;
    var w = board.clientWidth, h = board.clientHeight;
    var tileW = (w - 36) / 8, tileH = (h - 50) / 8;
    board.style.setProperty('--tile-size', Math.min(tileW, tileH) + 'px');
  }
  function showTurnBanner(name, color) {
    var b = $('turnBanner'); if (!b) return;
    b.textContent = '👉 ' + name; b.style.color = color || '#00f0ff';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('show'); }, 1600);
  }
  function showMoneyFloat(username, amount) {
    var pawn = shadow.querySelector('.pawn-box[data-user="' + username + '"]');
    var rect = pawn ? pawn.getBoundingClientRect() : { left: innerWidth/2, right: innerWidth/2, top: innerHeight/2 };
    var f = document.createElement('div'); f.className = 'money-float';
    f.textContent = (amount > 0 ? '+' : '−') + '$' + Math.abs(amount).toLocaleString();
    f.style.left = (rect.left + rect.width / 2) + 'px';
    f.style.top = (rect.top) + 'px';
    f.style.color = amount > 0 ? '#00ff66' : '#ff2a75';
    shadow.appendChild(f);
    setTimeout(function () { try { f.remove(); } catch (e) {} }, 1500);
  }
  function spawnConfetti(count) {
    var colors = ['#00f0ff','#ff2a75','#00ff66','#ffcc00','#b000ff','#ffffff'];
    for (var i = 0; i < count; i++) {
      var c = document.createElement('div'); c.className = 'confetti';
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
  function getChainCount(tileIdx) {
    var tile = state.game.tiles[tileIdx];
    if (tile.type !== 'prop' || !tile.owner) return 0;
    var owner = tile.owner, zone = tile.zone, range = ZONE_RANGES[zone], count = 1;
    for (var i = tileIdx - 1; i >= range.start; i--) { if (state.game.tiles[i].owner === owner) count++; else break; }
    for (var i = tileIdx + 1; i <= range.end; i++) { if (state.game.tiles[i].owner === owner) count++; else break; }
    return count;
  }
  function getBaseValue(tileIdx) {
    var tile = state.game.tiles[tileIdx];
    if (tile.type !== 'prop' || !tile.owner) return ZONES[tile.zone].price;
    return ZONES[tile.zone].price * getChainCount(tileIdx);
  }

  function weightedRoll(weights) {
    var total = 0;
    for (var k in weights) total += weights[k];
    var r = Math.random() * total;
    for (var k in weights) { r -= weights[k]; if (r <= 0) return parseInt(k); }
    return 6;
  }
  function rollDiceForPlayer(player) {
    var weights = {1:1, 2:1, 3:1, 4:1, 5:1, 6:1};
    var skin = (player.username === myUsername) ? profile.activeDice : 'silver';
    if (skin === 'gold') weights[6] = 1.2;
    if (skin === 'neon' && player.money < 100000) { weights[1] = 1.3; weights[2] = 1.3; weights[3] = 1.3; }
    if (skin === 'matrix' && lastDiceRoll > 0 && Math.random() < 0.15) return lastDiceRoll;
    if (consecutiveLowRolls >= 3) { weights[5] *= 2; weights[6] *= 2; }
    var roll = weightedRoll(weights);
    if (roll <= 2) consecutiveLowRolls++; else consecutiveLowRolls = 0;
    lastDiceRoll = roll;
    return roll;
  }

  /* ==================== UI ==================== */
  function renderProfile() {
    $('profileAvatar').src = avt(myUsername);
    $('profileName').textContent = myUsername;
    $('profileLevel').textContent = profile.level;
    var pct = Math.min(100, (profile.xp / xpForLevel(profile.level)) * 100);
    $('xpFill').style.width = pct + '%';
    $('xpText').textContent = profile.xp + '/' + xpForLevel(profile.level) + ' XP';
    $('statWins').textContent = profile.stats.wins;
    $('statPlays').textContent = profile.stats.plays;
    $('statChips').textContent = profile.chips;
    $('statSP').textContent = profile.skillPoints;
  }

  var currentShopTab = 'dice';
  function renderShop() {
    $('shopChips').textContent = profile.chips;
    var content = $('shopContent');
    content.innerHTML = '';
    if (currentShopTab === 'dice') {
      for (var id in DICE_SKINS) {
        var d = DICE_SKINS[id];
        var owned = profile.ownedDice.indexOf(id) >= 0;
        var active = profile.activeDice === id;
        var canBuy = profile.chips >= d.cost;
        var btnClass = active ? 'equipped' : (owned ? 'equip' : '');
        var btnText = active ? '✓ Đang Dùng' : (owned ? 'Trang Bị' : (d.cost + '💎'));
        var disabled = !owned && !canBuy;
        content.innerHTML += '<div class="shop-item' + (active ? ' active-item' : (owned ? ' owned' : '')) + '">' +
          '<div class="shop-item-icon">' + d.icon + '</div>' +
          '<div class="shop-item-info"><div class="shop-item-name">' + d.name + '</div><div class="shop-item-desc">' + d.desc + '</div></div>' +
          '<button class="shop-item-btn ' + btnClass + '" data-buydice="' + id + '" ' + (active || disabled ? 'disabled' : '') + '>' + btnText + '</button>' +
        '</div>';
      }
    } else if (currentShopTab === 'boards') {
      for (var id in BOARD_SKINS) {
        var b = BOARD_SKINS[id];
        var owned = profile.ownedBoards.indexOf(id) >= 0;
        var active = profile.activeBoard === id;
        var canBuy = profile.chips >= b.cost;
        var btnClass = active ? 'equipped' : (owned ? 'equip' : '');
        var btnText = active ? '✓ Đang Dùng' : (owned ? 'Trang Bị' : (b.cost + '💎'));
        var disabled = !owned && !canBuy;
        content.innerHTML += '<div class="shop-item' + (active ? ' active-item' : (owned ? ' owned' : '')) + '">' +
          '<div class="shop-item-icon">' + b.icon + '</div>' +
          '<div class="shop-item-info"><div class="shop-item-name">' + b.name + '</div><div class="shop-item-desc">' + b.desc + '</div></div>' +
          '<button class="shop-item-btn ' + btnClass + '" data-buyboard="' + id + '" ' + (active || disabled ? 'disabled' : '') + '>' + btnText + '</button>' +
        '</div>';
      }
    } else if (currentShopTab === 'boosters') {
      for (var id in BOOSTERS) {
        var bb = BOOSTERS[id];
        var cnt = profile.ownedBoosters[id] || 0;
        var canBuy = profile.chips >= bb.cost;
        content.innerHTML += '<div class="shop-item">' +
          '<div class="shop-item-icon">' + bb.icon + '</div>' +
          '<div class="shop-item-info"><div class="shop-item-name">' + bb.name + ' ×' + cnt + '</div><div class="shop-item-desc">' + bb.desc + '</div></div>' +
          '<button class="shop-item-btn" data-buybooster="' + id + '" ' + (canBuy ? '' : 'disabled') + '>' + bb.cost + '💎</button>' +
        '</div>';
      }
    }
  }

  function handleShopClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.buydice) {
      var id = btn.dataset.buydice;
      var d = DICE_SKINS[id];
      if (profile.ownedDice.indexOf(id) < 0) {
        if (profile.chips < d.cost) return toast('Không đủ Chips!');
        profile.chips -= d.cost;
        profile.ownedDice.push(id);
      }
      profile.activeDice = id;
      scheduleSaveProfile(); renderShop(); sfx.buy();
      toast('Đã trang bị ' + d.name);
    } else if (btn.dataset.buyboard) {
      var id = btn.dataset.buyboard;
      var b = BOARD_SKINS[id];
      if (profile.ownedBoards.indexOf(id) < 0) {
        if (profile.chips < b.cost) return toast('Không đủ Chips!');
        profile.chips -= b.cost;
        profile.ownedBoards.push(id);
      }
      profile.activeBoard = id;
      scheduleSaveProfile(); renderShop(); sfx.buy();
      toast('Đã chọn bàn ' + b.name);
    } else if (btn.dataset.buybooster) {
      var id = btn.dataset.buybooster;
      var bb = BOOSTERS[id];
      if (profile.chips < bb.cost) return toast('Không đủ Chips!');
      profile.chips -= bb.cost;
      profile.ownedBoosters[id] = (profile.ownedBoosters[id] || 0) + 1;
      scheduleSaveProfile(); renderShop(); sfx.buy();
      toast('Đã mua ' + bb.name);
    }
  }

  function renderSkills() {
    $('skillSP').textContent = profile.skillPoints;
    ['merchant', 'warrior', 'mage'].forEach(function (branch) {
      var container = shadow.querySelector('#branch' + branch.charAt(0).toUpperCase() + branch.slice(1) + ' .skill-list');
      container.innerHTML = '';
      for (var id in SKILL_DEFS) {
        var sk = SKILL_DEFS[id];
        if (sk.branch !== branch) continue;
        var unlocked = hasSkill(id);
        var reqMet = !sk.req || hasSkill(sk.req);
        var canLearn = !unlocked && reqMet && profile.skillPoints >= sk.cost;
        var cls = 'skill-node' + (unlocked ? ' unlocked' : (canLearn ? ' can-learn' : ' locked'));
        container.innerHTML += '<div class="' + cls + '" data-skill="' + id + '">' +
          '<div class="sn-icon">' + sk.icon + '</div>' +
          '<div class="sn-name">' + sk.name + '</div>' +
          '<div class="sn-desc">' + sk.desc + '</div>' +
          '<div class="sn-cost">' + (unlocked ? '✓ ĐÃ MỞ' : '🔮 ' + sk.cost + ' SP') + '</div>' +
        '</div>';
      }
    });
  }

  function handleSkillClick(e) {
    var node = e.target.closest('.skill-node');
    if (!node) return;
    var id = node.dataset.skill;
    if (!id || hasSkill(id)) return;
    var sk = SKILL_DEFS[id];
    if (sk.req && !hasSkill(sk.req)) return toast('Cần mở ' + SKILL_DEFS[sk.req].name);
    if (profile.skillPoints < sk.cost) return toast('Không đủ Skill Points!');
    profile.skillPoints -= sk.cost;
    profile.skills[id] = true;
    scheduleSaveProfile(); renderSkills(); sfx.buy();
    toast('Đã mở khóa: ' + sk.name);
  }

  function renderBoosterSelect() {
    var container = $('boosterSelect');
    container.innerHTML = '';
    var any = false;
    for (var id in profile.ownedBoosters) {
      if ((profile.ownedBoosters[id] || 0) > 0) {
        any = true;
        var bb = BOOSTERS[id];
        var active = state.selectedBooster === id;
        container.innerHTML += '<div class="booster-card' + (active ? ' active' : '') + '" data-booster="' + id + '">' +
          '<div class="bc-icon">' + bb.icon + '</div>' +
          '<div class="bc-name">' + bb.name + ' ×' + profile.ownedBoosters[id] + '</div>' +
          '<div class="bc-desc">' + bb.desc + '</div>' +
        '</div>';
      }
    }
    if (!any) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:14px;color:#888;font-size:12px;font-weight:700">Chưa có Booster. Mua trong Shop!</div>';
    container.onclick = function (e) {
      var card = e.target.closest('.booster-card');
      if (!card) return;
      var id = card.dataset.booster;
      if (!id) return;
      state.selectedBooster = (state.selectedBooster === id) ? null : id;
      renderBoosterSelect();
    };
  }

  /* ==================== GAME LOGIC ==================== */
  function initTiles() {
    var tiles = [];
    for (var i = 0; i < 28; i++) {
      if (i === 0) tiles.push({ type: 'start' });
      else if (i === 7) tiles.push({ type: 'jail' });
      else if (i === 14) tiles.push({ type: 'reward' });
      else if (i === 21) tiles.push({ type: 'teleport' });
      else {
        var zone = 0;
        for (var z = 0; z < 4; z++) if (i >= ZONE_RANGES[z].start && i <= ZONE_RANGES[z].end) { zone = z; break; }
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

  var MARKET_EVENTS = [
    { type: 'boom', name: 'BÙNG NỔ CRYPTO', desc: 'Thuế tăng 50% trong 3 lượt!' },
    { type: 'crash', name: 'SỤP ĐỔ THỊ TRƯỜNG', desc: 'Tất cả nhà giảm 1 cấp!' },
    { type: 'heist', name: 'ĐÁNH CẮP DỮ LIỆU', desc: 'Người giàu nhất mất 10%!' },
    { type: 'hack', name: 'HACK HỆ THỐNG', desc: 'Tất cả nhận $20k!' }
  ];

  function triggerMarketEvent() {
    var ev = MARKET_EVENTS[rnd(MARKET_EVENTS.length)];
    state.game.global_event = { type: ev.type, turnsLeft: 3 };
    var ticker = $('marketTicker'), text = $('marketTickerText');
    ticker.classList.add('active');
    text.textContent = '⚠️ ' + ev.name + ' — ' + ev.desc + ' ⚠️';
    sfx.event();
    if (ev.type === 'crash') {
      state.game.tiles.forEach(function (t) { if (t.type === 'prop' && t.owner && t.level > 1) t.level--; });
    } else if (ev.type === 'heist') {
      var richest = null;
      state.game.players.forEach(function(p) { if (!p.bankrupt && (!richest || p.money > richest.money)) richest = p; });
      if (richest && richest.money > 0) {
        var stolen = Math.floor(richest.money * 0.1);
        richest.money -= stolen;
        var others = state.game.players.filter(function(p){ return !p.bankrupt && p.username !== richest.username; });
        if (others.length) { var share = Math.floor(stolen / others.length); others.forEach(function(p){ p.money += share; }); }
        showMoneyFloat(richest.username, -stolen);
      }
    } else if (ev.type === 'hack') {
      state.game.players.forEach(function(p) { if (!p.bankrupt) { p.money += 20000; showMoneyFloat(p.username, 20000); } });
    }
    setTimeout(function() {
      ticker.classList.remove('active');
      text.textContent = '📡 ' + ev.name + ' (' + state.game.global_event.turnsLeft + ' LƯỢT) 📡';
    }, 5000);
  }

  function renderStaticTiles() {
    var grid = $('boardGrid');
    grid.innerHTML = '';
    var me = state.game.players.find(function(p){ return p.username === myUsername; });
    for (var i = 0; i < 28; i++) {
      var rc = tileRowCol(i);
      var tile = state.game.tiles[i];
      var el = document.createElement('div');
      el.style.gridRow = rc.row; el.style.gridColumn = rc.col;
      el.dataset.idx = i;
      if (tile.type === 'start') { el.className = 'tile corner start'; el.innerHTML = '<div class="corner-icon">🏁</div><div class="corner-label">XUẤT PHÁT</div>'; }
      else if (tile.type === 'jail') { el.className = 'tile corner jail'; el.innerHTML = '<div class="corner-icon">🚔</div><div class="corner-label">NHÀ TÙ</div>'; }
      else if (tile.type === 'reward') { el.className = 'tile corner reward'; el.innerHTML = '<div class="corner-icon">🎁</div><div class="corner-label">THƯỞNG</div>'; }
      else if (tile.type === 'teleport') { el.className = 'tile corner teleport'; el.innerHTML = '<div class="corner-icon">🌀</div><div class="corner-label">DỊCH CHUYỂN</div>'; }
      else if (tile.type === 'prop') {
        el.className = 'tile prop';
        el.style.setProperty('--zone-color', ZONES[tile.zone].color);
        var owner = tile.owner ? state.game.players.find(function (p) { return p.username === tile.owner; }) : null;
        if (owner) {
          el.classList.add('owned');
          if (owner.username === myUsername) { el.classList.add('my-land'); el.style.setProperty('--owner-color', owner.color); }
          else { el.classList.add('other-land'); el.style.setProperty('--owner-color', owner.color); }
        }
        var displayPrice = owner ? (getBaseValue(i) * tile.level) : ZONES[tile.zone].price;
        var nameShort = ZONES[tile.zone].short;
        var body = '';
        if (owner) {
          if (owner.username === myUsername) body += '<div class="my-land-badge">⭐</div>';
          var lv = ''; for (var l = 0; l < tile.level; l++) lv += '<span>🏠</span>';
          body += '<div class="tile-levels">' + lv + '</div>';
        } else { body += '<div class="tile-name">' + nameShort + '</div>'; }
        el.innerHTML = '<div class="tile-band"><span class="tile-band-text">' + fmtShort(displayPrice) + '</span></div><div class="tile-body">' + body + '</div>';
      }
      if (me && me.pos === i && !me.bankrupt) { el.classList.add('my-position'); el.style.setProperty('--my-color', me.color); }
      grid.appendChild(el);
    }
    var center = document.createElement('div');
    center.className = 'center-info';
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    var eventHtml = '';
    if (state.game.global_event) {
      var ev = MARKET_EVENTS.find(function(e){ return e.type === state.game.global_event.type; });
      if (ev) eventHtml = '<div class="event-banner">⚠️ ' + ev.name + ' (' + state.game.global_event.turnsLeft + ')</div>';
    }
    center.innerHTML = '<div class="center-actions">' +
      '<button class="icon-btn-sm" data-action="sound">' + (sfxOn ? '🔊' : '🔇') + '</button>' +
      '<button class="icon-btn-sm" data-action="debug">🐞</button>' +
      '<button class="icon-btn-sm" data-action="quit">✕</button></div>' +
      eventHtml +
      '<div class="center-player">' + (curP ? '<img class="center-avatar" src="' + curP.avatar + '" style="box-shadow:0 0 15px ' + curP.color + ';border:2px solid ' + curP.color + '"><div class="center-name" style="color:' + curP.color + '">' + esc(curP.name) + '</div>' : '') + '</div>' +
      '<div class="center-dice-box"><div class="dice-item" id="centerDice1">🎲</div><div class="dice-item" id="centerDice2">🎲</div></div>' +
      '<button class="center-roll-btn" id="rollBtn">TUNG XÚC XẮC</button>' +
      '<div class="center-status" id="rollInfo">...</div>';
    grid.appendChild(center);
    $('rollBtn').onclick = function () { executeRoll(); };
    syncRollBtn();
  }
  function renderCenter() {
    var old = $('boardGrid').querySelector('.center-info');
    if (old) {
      var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
      var playerEl = old.querySelector('.center-player');
      if (playerEl && curP) playerEl.innerHTML = '<img class="center-avatar" src="' + curP.avatar + '" style="box-shadow:0 0 15px ' + curP.color + ';border:2px solid ' + curP.color + '"><div class="center-name" style="color:' + curP.color + '">' + esc(curP.name) + '</div>';
    }
  }
  function renderPawns() {
    var grid = $('boardGrid');
    grid.querySelectorAll('.tile-players').forEach(function (c) { c.remove(); });
    var posMap = {};
    state.game.players.forEach(function (p) { if (p.bankrupt) return; if (!posMap[p.pos]) posMap[p.pos] = []; posMap[p.pos].push(p); });
    Object.keys(posMap).forEach(function (pos) {
      var tileEl = grid.querySelector('[data-idx="' + pos + '"]'); if (!tileEl) return;
      var container = document.createElement('div'); container.className = 'tile-players';
      posMap[pos].forEach(function (p) {
        var box = document.createElement('div'); box.className = 'pawn-box'; box.dataset.user = p.username;
        var moneyStr = p.money >= 1000 ? '$' + (p.money/1000).toFixed(0) + 'k' : '$' + p.money;
        box.innerHTML = '<img src="' + p.avatar + '" style="--avatar-color:' + p.color + '"><span class="pawn-money">' + moneyStr + '</span>';
        container.appendChild(box);
      });
      tileEl.appendChild(container);
    });
  }
  function renderAll() {
    if (!state.game) return;
    renderStaticTiles(); renderPawns();
    requestAnimationFrame(fitBoard);
  }
  function syncRollBtn() {
    var btn = $('rollBtn'), info = $('rollInfo');
    if (!btn || !info) return;
    if (!state.game || state.game.winner) { btn.disabled = true; info.textContent = 'Đã kết thúc'; return; }
    var curP = state.game.players.find(function (p) { return p.username === state.game.current_turn; });
    if (!curP) { btn.disabled = true; return; }
    var isMe = curP.username === myUsername, isBot = curP.bot;
    var hasPending = state.game.pending_action && state.game.pending_action.player === myUsername;
    btn.disabled = !isMe || isBot || state.busy || hasPending || state.animating;
    if (isBot) info.textContent = '🤖 ' + curP.name + ' ĐANG CHƠI...';
    else if (hasPending) info.textContent = '⏳ CHỜ QUYẾT ĐỊNH...';
    else if (isMe) info.textContent = state.game.is_double ? '🎲 XÚC XẮC ĐÔI! ĐI TIẾP!' : '👉 NHẤN ĐỂ TUNG!';
    else info.textContent = '⏳ ĐANG CHỜ...';
  }
  function getPlayer(username) { return state.game.players.find(function (p) { return p.username === username; }); }
  function currentPlayer() { return getPlayer(state.game.current_turn); }

  async function executeRoll() {
    if (!state.game || state.game.winner || state.animating) return;
    var player = currentPlayer();
    if (!player) return;
    state.animating = true;
    state.game.is_double = false;
    syncRollBtn();
    try {
      if (player.jail_turns > 0) {
        player.jail_turns--; renderCenter(); await sleep(700); advanceTurn(); return;
      }
      var dice1 = rollDiceForPlayer(player);
      var dice2 = rollDiceForPlayer(player);
      var isDouble = (dice1 === dice2);
      var steps = dice1 + dice2;

      if (player.username === myUsername && hasSkill('g_dice') && !player._diceBonusUsed) {
        steps += 1;
        player._diceBonusUsed = true;
        toast('✨ BƯỚC NHẢY: +1 bước!');
      }

      var centerDice1 = $('centerDice1'), centerDice2 = $('centerDice2');
      if (centerDice1 && centerDice2) {
        centerDice1.classList.add('rolling'); centerDice2.classList.add('rolling');
        sfx.roll();
        var swap = setInterval(function () { centerDice1.textContent = DICE_FACES[rnd(6)]; centerDice2.textContent = DICE_FACES[rnd(6)]; }, 55);
        await sleep(750);
        clearInterval(swap);
        centerDice1.classList.remove('rolling'); centerDice2.classList.remove('rolling');
        centerDice1.textContent = DICE_FACES[dice1 - 1];
        centerDice2.textContent = DICE_FACES[dice2 - 1];
      }
      var oldPos = player.pos;
      var passed = (oldPos + steps) >= 28;
      if (state.playMode !== 'online') await animateStepMove(player, steps);
      else { player.pos = (oldPos + steps) % 28; renderPawns(); }
      sfx.land();
      if (passed) {
        var startBonus = 10000;
        if (player.username === myUsername && hasSkill('stock')) startBonus += 2000;
        player.money += startBonus;
        showMoneyFloat(player.username, startBonus);
      }
      renderStaticTiles(); renderPawns(); renderCenter();
      await sleep(280);

      if (isDouble) {
        state.game.doubleStreak = (state.game.doubleStreak || 0) + 1;
        if (player.username === myUsername && hasSkill('g_time') && state.game.doubleStreak >= 2) {
          toast('⏳ THỜI GIAN: Lượt thứ 3!');
          state.game.is_double = true;
          state.game.doubleStreak = 0;
        } else {
          toast('🎲 XÚC XẮC ĐÔI! ĐI THÊM!');
          state.game.is_double = true;
        }
      } else {
        state.game.doubleStreak = 0;
      }

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
      if (me && player.username === myUsername) {
        var oldTile = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (oldTile) oldTile.classList.remove('my-position');
      }
      player.pos = (player.pos + 1) % 28;
      if (me && player.username === myUsername) {
        var newTile = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (newTile) { newTile.classList.add('my-position'); newTile.style.setProperty('--my-color', me.color); }
      }
      if (myPawnBox) {
        var t = grid.querySelector('[data-idx="' + player.pos + '"]');
        if (t) {
          var c = t.querySelector('.tile-players');
          if (!c) { c = document.createElement('div'); c.className = 'tile-players'; t.appendChild(c); }
          c.appendChild(myPawnBox);
          myPawnBox.querySelector('img').classList.remove('hopping');
          void myPawnBox.offsetWidth;
          myPawnBox.querySelector('img').classList.add('hopping');
        }
      }
      sfx.step(); await sleep(170);
    }
    if (myPawnBox) myPawnBox.querySelector('img').classList.remove('hopping');
  }

  async function resolveTile(player, tileIdx) {
    var tile = state.game.tiles[tileIdx];
    if (tile.type === 'start') {
      if (tileIdx === 0) { player.money += 5000; showMoneyFloat(player.username, 5000); sfx.buy(); }
      await commitAndRender(); advanceTurn(); return;
    }
    if (tile.type === 'jail') {
      if (player.username === myUsername && state.game.activeBooster === 'charm' && !state.game.boosterTriggered.charm) {
        state.game.boosterTriggered.charm = true;
        toast('🍀 BÙA MAY MẮN: Tránh được Nhà Tù!');
        await commitAndRender(); advanceTurn(); return;
      }
      player.jail_turns = 2;
      state.game.is_double = false;
      sfx.lose();
      await commitAndRender(); await sleep(500); advanceTurn(); return;
    }
    if (tile.type === 'reward') {
      var props = []; for (var i = 1; i < 28; i++) if (state.game.tiles[i].type === 'prop') props.push(i);
      var targetIdx = props[rnd(props.length)];
      var target = state.game.tiles[targetIdx];
      if (!target.owner) { target.owner = player.username; target.level = 1; sfx.buy(); }
      else if (target.owner !== player.username) { target.owner = player.username; sfx.buy(); }
      else { player.money += 5000; showMoneyFloat(player.username, 5000); }
      await commitAndRender(); await sleep(600); advanceTurn(); return;
    }
    if (tile.type === 'teleport') {
      var props = []; for (var i = 1; i < 28; i++) if (state.game.tiles[i].type === 'prop') props.push(i);
      player.pos = props[rnd(props.length)];
      await commitAndRender(); await sleep(600);
      await resolveTile(player, player.pos); return;
    }
    if (tile.type === 'prop') { await resolveProperty(player, tileIdx); return; }
    advanceTurn();
  }

  async function resolveProperty(player, tileIdx) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];

    if (!tile.owner) {
      var price = zone.price;
      if (player.username === myUsername && hasSkill('m_buy')) price = Math.floor(price * 0.9);
      if (player.bot) {
        if (player.money >= price + 30000) {
          player.money -= price; tile.owner = player.username; tile.level = 1;
          showMoneyFloat(player.username, -price); sfx.buy();
          await commitAndRender(); await sleep(500);
        }
        advanceTurn();
      } else if (player.username === myUsername) {
        state.game.pending_action = { type: 'buy_empty', player: player.username, tileIdx: tileIdx, price: price };
        await commitAndRender();
        showBuyEmptyModal(player, tileIdx, price);
      } else syncRollBtn();
      return;
    }

    if (tile.owner === player.username) {
      if (player.bot) {
        var upCost = ZONES[tile.zone].price;
        if (player.money >= upCost + 30000 && tile.level < 5) {
          player.money -= upCost; tile.level++;
          showMoneyFloat(player.username, -upCost); sfx.buy();
          await commitAndRender(); await sleep(500);
        }
        advanceTurn();
      } else if (player.username === myUsername) {
        if (tile.level < 5) {
          var upCost = ZONES[tile.zone].price;
          if (hasSkill('m_up')) upCost = Math.floor(upCost * 0.75);
          state.game.pending_action = { type: 'upgrade', player: player.username, tileIdx: tileIdx, cost: upCost };
          await commitAndRender();
          showUpgradeModal(player, tileIdx, upCost, tile.level);
        } else { await commitAndRender(); await sleep(300); advanceTurn(); }
      } else syncRollBtn();
      return;
    }

    var currentBase = getBaseValue(tileIdx);
    var totalValue = currentBase * tile.level;
    var buyBackPrice = Math.floor(totalValue * 1.5);
    var rentPrice = Math.floor(totalValue * 0.5);
    if (state.game.global_event && state.game.global_event.type === 'boom') rentPrice = Math.floor(rentPrice * 1.5);

    if (player.username === myUsername && hasSkill('w_buyback')) buyBackPrice = Math.floor(buyBackPrice * 0.85);

    var owner = getPlayer(tile.owner);
    if (owner && owner.username === myUsername) {
      if (hasSkill('w_rent')) rentPrice = Math.floor(rentPrice * 1.2);
      if (hasSkill('w_empire')) {
        var propCount = state.game.tiles.filter(function(t){ return t.type === 'prop' && t.owner === myUsername; }).length;
        rentPrice = Math.floor(rentPrice * (1 + (propCount - 1) * 0.03));
      }
      if (hasSkill('m_chain') && getChainCount(tileIdx) >= 3) rentPrice = Math.floor(rentPrice * 1.5);
    }

    if (player.username === myUsername && state.game.activeBooster === 'shield' && !state.game.boosterTriggered.shield) {
      state.game.boosterTriggered.shield = true;
      toast('🛡️ KHIÊN THUẾ: Miễn thuế lần này!');
      await commitAndRender(); await sleep(400); advanceTurn(); return;
    }

    if (player.bot) {
      if (player.money >= rentPrice) {
        player.money -= rentPrice;
        if (owner) owner.money += rentPrice;
        showMoneyFloat(player.username, -rentPrice);
        if (owner) showMoneyFloat(owner.username, rentPrice);
        sfx.pay();
        await commitAndRender(); await sleep(500); advanceTurn(); return;
      }
      if (player.money >= buyBackPrice) {
        player.money -= buyBackPrice;
        if (owner) owner.money += buyBackPrice;
        tile.owner = player.username;
        showMoneyFloat(player.username, -buyBackPrice);
        sfx.buy();
        await commitAndRender(); await sleep(500); advanceTurn(); return;
      }
      doBankrupt(player, owner, buyBackPrice);
      await commitAndRender(); await sleep(700); advanceTurn(); return;
    }

    if (player.username === myUsername) {
      state.game.pending_action = { type: 'opponent_tile', player: player.username, tileIdx: tileIdx, chainValue: buyBackPrice, rentPrice: rentPrice, chainCount: getChainCount(tileIdx) };
      await commitAndRender();
      showOpponentModal(player, tileIdx, buyBackPrice, rentPrice, getChainCount(tileIdx));
    } else syncRollBtn();
  }

  function doBankrupt(player, creditor, amount) {
    if (player.username === myUsername && hasSkill('g_revive') && !player._reviveUsed) {
      player._reviveUsed = true;
      player.money = 50000;
      toast('🔮 TÁI SINH: Hồi sinh với $50k!');
      sfx.win();
      return;
    }
    player.bankrupt = true;
    player.money = 0;
    state.game.tiles.forEach(function (t) { if (t.type === 'prop' && t.owner === player.username) { t.owner = null; t.level = 1; } });
    sfx.lose();
    var alive = state.game.players.filter(function (p) { return !p.bankrupt; });
    if (alive.length === 1) { state.game.winner = alive[0].username; state.game.finished_at = Date.now(); }
  }

  function advanceTurn() {
    if (!state.game || state.game.winner) { commitAndRender().then(function () { showWinOverlay(); }); return; }

    if (state.game.is_double) {
      state.game.is_double = false;
      state.game.turn_count++;
      if (state.game.turn_count > 0 && state.game.turn_count % 5 === 0) triggerMarketEvent();
      commitAndRender().then(function () {
        var p = currentPlayer();
        if (p && p.bot) setTimeout(function () { executeRoll(); }, 1000);
      });
      return;
    }

    state.game.turn_count = (state.game.turn_count || 0) + 1;
    if (state.game.turn_count > 0 && state.game.turn_count % 5 === 0) triggerMarketEvent();
    else if (state.game.global_event) {
      state.game.global_event.turnsLeft--;
      if (state.game.global_event.turnsLeft <= 0) {
        state.game.global_event = null;
        var text = $('marketTickerText');
        if (text) text.textContent = '📡 THỊ TRƯỜNG ỔN ĐỊNH 📡';
      }
    }

    var idx = state.game.players.findIndex(function (p) { return p.username === state.game.current_turn; });
    for (var i = 1; i <= state.game.players.length; i++) {
      idx = (idx + 1) % state.game.players.length;
      if (!state.game.players[idx].bankrupt) {
        state.game.current_turn = state.game.players[idx].username;
        state.game.pending_action = null;
        state.game.doubleStreak = 0;
        break;
      }
    }
    commitAndRender().then(function () {
      var nextP = currentPlayer();
      if (nextP) showTurnBanner(nextP.name, nextP.color);
      if (nextP && nextP.bot && !state.game.winner) setTimeout(function () { executeRoll(); }, 1000);
    });
  }

  async function commitAndRender() {
    renderAll();
    if (state.playMode === 'online' && room) await commitOnline();
  }

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
      addXP(10);
    }
    state.game.pending_action = null;
    hideActionModal();
    await commitAndRender(); await sleep(400); advanceTurn();
  }

  async function handleUpgrade(yes) {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'upgrade') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    if (yes && player.money >= pa.cost) {
      player.money -= pa.cost;
      state.game.tiles[pa.tileIdx].level++;
      showMoneyFloat(player.username, -pa.cost);
      sfx.buy();
      addXP(15);
    }
    state.game.pending_action = null;
    hideActionModal();
    await commitAndRender(); await sleep(400); advanceTurn();
  }

  async function handleOpponentAction(action) {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'opponent_tile') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    var tile = state.game.tiles[pa.tileIdx];
    var owner = getPlayer(tile.owner);
    if (action === 'rent') {
      if (player.money < pa.rentPrice) return toast('Không đủ tiền!');
      player.money -= pa.rentPrice;
      if (owner) owner.money += pa.rentPrice;
      showMoneyFloat(player.username, -pa.rentPrice);
      if (owner) showMoneyFloat(owner.username, pa.rentPrice);
      sfx.pay();
    } else if (action === 'buy') {
      if (player.money < pa.chainValue) return toast('Không đủ tiền!');
      player.money -= pa.chainValue;
      if (owner) owner.money += pa.chainValue;
      tile.owner = player.username;
      showMoneyFloat(player.username, -pa.chainValue);
      if (owner) showMoneyFloat(owner.username, pa.chainValue);
      sfx.buy();
    } else if (action === 'bankrupt') doBankrupt(player, owner, pa.chainValue);
    state.game.pending_action = null;
    hideActionModal();
    await commitAndRender(); await sleep(400); advanceTurn();
  }

  async function handleEmergencySell() {
    var pa = state.game.pending_action;
    if (!pa || pa.type !== 'opponent_tile') return;
    var player = getPlayer(pa.player);
    if (!player) return;
    var myProps = [];
    state.game.tiles.forEach(function(t, idx) {
      if (t.type === 'prop' && t.owner === player.username) myProps.push({ idx: idx, value: getBaseValue(idx) * t.level });
    });
    if (!myProps.length) return toast('Bạn không có đất để bán!');
    myProps.sort(function(a, b) { return a.value - b.value; });
    var sold = 0;
    for (var i = 0; i < myProps.length; i++) {
      if (player.money >= pa.rentPrice) break;
      var p = myProps[i], sellPrice = Math.floor(p.value * 0.5);
      player.money += sellPrice;
      state.game.tiles[p.idx].owner = null; state.game.tiles[p.idx].level = 1;
      sold++;
      showMoneyFloat(player.username, sellPrice);
    }
    if (sold > 0) toast('Đã bán ' + sold + ' mảnh đất!');
    await commitAndRender(); await sleep(400);
    if (player.money >= pa.rentPrice) handleOpponentAction('rent');
    else handleOpponentAction('bankrupt');
  }

  function showBuyEmptyModal(player, tileIdx, price) {
    var zone = ZONES[state.game.tiles[tileIdx].zone];
    var skillNote = (player.username === myUsername && hasSkill('m_buy')) ? '<div class="row"><span>Ưu đãi Mặc Cả</span><b class="buff">-10%</b></div>' : '';
    $('actionModal').innerHTML = '<h2>MUA ĐẤT</h2><div class="sub">' + zone.name + '</div>' +
      '<div class="prop-info"><div class="row"><span>Giá mua</span><b>' + fmtMoney(price) + '</b></div>' + skillNote +
      '<div class="row"><span>Ví của bạn</span><b>' + fmtMoney(player.money) + '</b></div>' +
      '<div class="row"><span>Sau khi mua</span><b>' + fmtMoney(player.money - price) + '</b></div></div>' +
      '<div class="actions"><button class="btn btn-buy" id="btnBuyYes">💰 MUA</button><button class="btn btn-skip" id="btnBuyNo">BỎ QUA</button></div>';
    $('actionOverlay').hidden = false;
    $('btnBuyYes').onclick = function () { handleBuyEmpty(true); };
    $('btnBuyNo').onclick = function () { handleBuyEmpty(false); };
    startDecisionTimeout();
  }

  function showUpgradeModal(player, tileIdx, cost, currentLevel) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];
    var currentBase = getBaseValue(tileIdx);
    var currentRent = Math.floor(currentBase * currentLevel * 0.5);
    var nextRent = Math.floor(currentBase * (currentLevel + 1) * 0.5);
    var canUpgrade = player.money >= cost;
    var skillNote = (player.username === myUsername && hasSkill('m_up')) ? '<div class="row"><span>Ưu đãi Đầu Tư</span><b class="buff">-25%</b></div>' : '';
    $('actionModal').innerHTML = '<h2>NÂNG CẤP</h2><div class="sub">' + zone.name + ' · Lv.' + currentLevel + '</div>' +
      '<div class="prop-info"><div class="row"><span>Chi phí</span><b>' + fmtMoney(cost) + '</b></div>' + skillNote +
      '<div class="row"><span>Thuế hiện tại</span><b>' + fmtMoney(currentRent) + '</b></div>' +
      '<div class="row"><span>Thuế sau nâng</span><b>' + fmtMoney(nextRent) + '</b></div>' +
      '<div class="row"><span>Ví của bạn</span><b>' + fmtMoney(player.money) + '</b></div></div>' +
      '<div class="actions"><button class="btn btn-buy" id="btnUpgradeYes" ' + (canUpgrade ? '' : 'disabled') + '>⬆️ NÂNG CẤP</button><button class="btn btn-skip" id="btnUpgradeNo">BỎ QUA</button></div>';
    $('actionOverlay').hidden = false;
    if (canUpgrade) $('btnUpgradeYes').onclick = function () { handleUpgrade(true); };
    $('btnUpgradeNo').onclick = function () { handleUpgrade(false); };
    startDecisionTimeout();
  }

  function showOpponentModal(player, tileIdx, chainValue, rentPrice, chainCount) {
    var tile = state.game.tiles[tileIdx];
    var zone = ZONES[tile.zone];
    var owner = getPlayer(tile.owner);
    var canRent = player.money >= rentPrice;
    var canBuy = player.money >= chainValue;
    var needSell = !canRent && !canBuy;
    var multiplier = chainCount > 1 ? (' × ' + chainCount) : '';
    var currentBase = getBaseValue(tileIdx);
    var totalValue = currentBase * tile.level;
    var skillNote = '';
    if (player.username === myUsername && hasSkill('w_buyback')) skillNote += '<div class="row"><span>Ưu đãi Áp Đảo</span><b class="buff">-15% mua lại</b></div>';
    if (owner && owner.username === myUsername && hasSkill('w_rent')) skillNote += '<div class="row"><span>Bóc Lột</span><b class="buff">+20% thuế</b></div>';
    if (owner && owner.username === myUsername && hasSkill('m_chain') && chainCount >= 3) skillNote += '<div class="row"><span>Trùm Cuối</span><b class="buff">+50% thuế</b></div>';
    $('actionModal').innerHTML = '<h2>ĐẤT CỦA ' + esc(owner ? owner.name : '?') + '</h2><div class="sub">' + zone.name + ' · Lv.' + tile.level + '</div>' +
      '<div class="prop-info"><div class="row"><span>Giá gốc</span><b>' + fmtMoney(currentBase) + multiplier + '</b></div>' +
      '<div class="row"><span>Tổng giá trị</span><b>' + fmtMoney(totalValue) + '</b></div>' + skillNote +
      '<div class="row"><span>Mua lại (150%)</span><b>' + fmtMoney(chainValue) + '</b></div>' +
      '<div class="row"><span>Thuê (50%)</span><b>' + fmtMoney(rentPrice) + '</b></div>' +
      '<div class="row"><span>Ví của bạn</span><b>' + fmtMoney(player.money) + '</b></div></div>' +
      '<div class="actions"><button class="btn btn-rent" id="btnRent" ' + (canRent ? '' : 'disabled') + '>💸 TRẢ THUÊ</button>' +
      '<button class="btn btn-buy" id="btnBuyOpp" ' + (canBuy ? '' : 'disabled') + '>💰 MUA LẠI</button>' +
      (needSell ? '<button class="btn btn-warning" id="btnSell">💸 BÁN ĐẤT KHẨN CẤP</button>' : '') +
      '<button class="btn btn-danger" id="btnBankrupt">💀 PHÁ SẢN</button></div>';
    $('actionOverlay').hidden = false;
    if (canRent) $('btnRent').onclick = function () { handleOpponentAction('rent'); };
    if (canBuy) $('btnBuyOpp').onclick = function () { handleOpponentAction('buy'); };
    if (needSell) $('btnSell').onclick = function () { handleEmergencySell(); };
    $('btnBankrupt').onclick = function () { handleOpponentAction('bankrupt'); };
    startDecisionTimeout();
  }

  var decisionTimeout = null;
  function startDecisionTimeout() {
    if (decisionTimeout) clearTimeout(decisionTimeout);
    decisionTimeout = setTimeout(function () {
      var pa = state.game && state.game.pending_action; if (!pa) return;
      if (pa.type === 'buy_empty') handleBuyEmpty(false);
      else if (pa.type === 'upgrade') handleUpgrade(false);
      else if (pa.type === 'opponent_tile') {
        if (state.game.players.find(function (p) { return p.username === pa.player; }).money >= pa.rentPrice) handleOpponentAction('rent');
        else handleOpponentAction('bankrupt');
      }
    }, 30000);
  }
  function hideActionModal() { if (decisionTimeout) { clearTimeout(decisionTimeout); decisionTimeout = null; } $('actionOverlay').hidden = true; $('actionModal').innerHTML = ''; }

  /* ==================== POST-GAME REWARDS + CLOUD SAVE ==================== */
  async function showWinOverlay() {
    if (!state.game || !state.game.winner) return;
    if (state.game._rewardsGranted) return;
    state.game._rewardsGranted = true;

    var wp = getPlayer(state.game.winner);
    var isMe = state.game.winner === myUsername;
    $('winEmoji').textContent = isMe ? '🏆' : '😢';
    $('winTitle').textContent = isMe ? 'BẠN THẮNG!' : (wp ? wp.name + ' THẮNG!' : 'KẾT THÚC');
    $('winSub').textContent = isMe ? 'Chúc mừng tỷ phú mới!' : 'Chơi ván mới nhé!';

    var chipsReward = 0, xpReward = 0;
    if (isMe) { chipsReward = 100; xpReward = 100; profile.stats.wins++; }
    else if (state.game.players.filter(function(p){return !p.bankrupt;}).length > 1) { chipsReward = 50; xpReward = 60; }
    else { chipsReward = 20; xpReward = 30; }
    profile.stats.plays++;

    // Return unused booster
    if (state.game.activeBooster) {
      var used = false;
      for (var k in state.game.boosterTriggered) if (state.game.boosterTriggered[k]) used = true;
      if (state.game.activeBooster === 'card') used = true;
      if (state.game.activeBooster === 'stock' && state.game.turn_count < 3) used = true;
      if (!used) {
        profile.ownedBoosters[state.game.activeBooster] = (profile.ownedBoosters[state.game.activeBooster] || 0) + 1;
      }
    }
    state.selectedBooster = null;

    addChips(chipsReward);
    addXP(xpReward);

    var rewardHtml = '💎 +' + chipsReward + ' Chips<br>⭐ +' + xpReward + ' XP';
    if (isMe) rewardHtml += '<br>🏆 +1 Win';
    $('winRewards').innerHTML = rewardHtml;

    // Đảm bảo save lên server trước khi hiện
    await flushSaveProfile();

    sfx.win();
    if (isMe) spawnConfetti(150);
    $('winOverlay').hidden = false;
  }

  /* ==================== START GAME ==================== */
  function startLocalGame() {
    myUsername = getMyUsername();
    var players = [{
      username: myUsername, name: myProfile.display_name || myUsername, avatar: myProfile.avatar_url || avt(myUsername),
      color: PLAYER_COLORS[0].c, pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: false
    }];
    for (var i = 0; i < state.botCount; i++) {
      var nm = BOT_NAMES[i] || ('Bot ' + (i+1));
      players.push({
        username: 'bot_' + i, name: nm, avatar: avt('bot' + i + '_' + Date.now()),
        color: PLAYER_COLORS[i+1].c, pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: true
      });
    }

    var activeBooster = state.selectedBooster;
    if (activeBooster === 'card') {
      players[0].money += 50000;
      profile.ownedBoosters.card--;
      if (profile.ownedBoosters.card <= 0) delete profile.ownedBoosters.card;
      scheduleSaveProfile();
    }

    state.game = {
      players: players, tiles: initTiles(),
      current_turn: myUsername, turn_count: 0,
      started_at: Date.now(), winner: null, pending_action: null, global_event: null, is_double: false,
      doubleStreak: 0,
      activeBooster: activeBooster,
      boosterTriggered: { charm: false, card: activeBooster === 'card', shield: false, stock: false }
    };
    showScreen('gameScreen');
    renderAll();
    setTimeout(function () { showTurnBanner(players[0].name, players[0].color); }, 400);
    if (activeBooster === 'card') toast('💳 +$50k từ Thẻ Tín Dụng!');
    dbgEvent('LOCAL_START', 'players=' + players.length);
  }

  /* ==================== ONLINE ==================== */
  async function createRoom() {
    if (!sb) return toast('Supabase chưa sẵn sàng');
    if (room) return toast('Đang ở phòng khác');
    var code = Array.from({ length: 6 }, function () { return 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[rnd(32)]; }).join('');
    var r = await sb.from('monopoly_rooms').insert({ code: code, host_username: myUsername, status: 'waiting', max_players: 4, state: {}, version: 0 }).select().single();
    if (r.error) return toast('Lỗi tạo phòng: ' + r.error.message);
    room = r.data; isHost = true;
    await sb.from('monopoly_room_players').insert({ room_id: room.id, username: myUsername, display_name: myProfile.display_name || myUsername, avatar_url: myProfile.avatar_url, is_host: true, color_index: 0 });
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
      await sb.from('monopoly_room_players').insert({ room_id: rid, username: myUsername, display_name: myProfile.display_name || myUsername, avatar_url: myProfile.avatar_url, color_index: cnt.count || 0 });
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
  function enterWait() { showScreen('waitingScreen'); $('hostControls').style.display = isHost ? 'block' : 'none'; renderWait(); startRealtime(); refreshPlayers(); }
  function renderWait() {
    $('waitingCount').textContent = roomPlayers.length;
    $('waitingPlayers').innerHTML = roomPlayers.map(function (p) {
      return '<div class="room-item"><div class="room-item-info"><div class="room-item-host">' + esc(p.display_name) + (p.username === myUsername ? ' (Bạn)' : '') + '</div></div>' + (p.is_host ? '<span style="color:#00f0ff;font-size:10px">HOST</span>' : '') + '</div>';
    }).join('');
    $('hostStartBtn').disabled = roomPlayers.length < 2;
    $('hostStartBtn').textContent = roomPlayers.length >= 2 ? '🚀 Bắt đầu (' + roomPlayers.length + ')' : '⏳ Cần 2 người';
  }
  async function hostStart() {
    if (roomPlayers.length < 2) return;
    var players = roomPlayers.map(function (rp, i) {
      return { username: rp.username, name: rp.display_name, avatar: rp.avatar_url || avt(rp.display_name), color: PLAYER_COLORS[i % 4].c, pos: 0, money: 200000, jail_turns: 0, bankrupt: false, bot: false };
    });
    var initialState = {
      players: players, tiles: initTiles(), current_turn: roomPlayers[0].username, turn_count: 0,
      started_at: Date.now(), winner: null, pending_action: null, global_event: null, is_double: false, doubleStreak: 0,
      activeBooster: null, boosterTriggered: {}
    };
    await sb.from('monopoly_rooms').update({ status: 'playing', state: initialState, version: (room.version || 0) + 1, updated_at: new Date().toISOString() }).eq('id', room.id);
  }
  async function refreshPlayers() {
    if (!room) return;
    try { var r = await sb.from('monopoly_room_players').select('*').eq('room_id', room.id).order('joined_at'); if (r.data) { roomPlayers = r.data; if (room.status === 'waiting') renderWait(); } } catch (e) {}
  }
  async function fetchRooms() {
    if (!sb) return;
    var r = await sb.from('monopoly_rooms').select('*').eq('status', 'waiting').order('created_at', { ascending: false }).limit(20);
    if (!r.data) return;
    $('roomsList').innerHTML = r.data.map(function (rm) {
      var mine = rm.host_username === myUsername;
      return '<div class="room-item"><div class="room-item-info"><div class="room-item-host">🎩 ' + esc(rm.host_username) + '</div><div class="room-item-meta">' + rm.max_players + ' người</div></div>' +
        '<button class="room-item-join" data-id="' + rm.id + '"' + (mine ? ' disabled' : '') + '>' + (mine ? 'Của bạn' : 'Vào') + '</button></div>';
    }).join('') || '<div style="text-align:center;padding:20px;color:#888;font-weight:700">Chưa có phòng nào</div>';
  }
  async function enterOnlineScreen() {
    if (room) await leaveRoom();
    showScreen('onlineScreen'); fetchRooms();
    if (roomsChan) { try { sb.removeChannel(roomsChan); } catch (e) {} }
    roomsChan = sb.channel('mp-rooms-list').on('postgres_changes', { event: '*', schema: 'public', table: 'monopoly_rooms' }, fetchRooms).subscribe();
  }
  async function commitOnline() {
    if (!room || !state.game) return;
    try { await sb.from('monopoly_rooms').update({ state: state.game, version: (room.version || 0) + 1, updated_at: new Date().toISOString() }).eq('id', room.id); } catch (e) {}
  }
  function handleRemoteState(oldG, newG) {
    var prevPending = state.game && state.game.pending_action;
    state.game = newG;
    var pa = newG.pending_action;
    if (pa && pa.player === myUsername) {
      if (pa.type === 'buy_empty') showBuyEmptyModal(getPlayer(pa.player), pa.tileIdx, pa.price);
      else if (pa.type === 'upgrade') showUpgradeModal(getPlayer(pa.player), pa.tileIdx, pa.cost, state.game.tiles[pa.tileIdx].level);
      else if (pa.type === 'opponent_tile') showOpponentModal(getPlayer(pa.player), pa.tileIdx, pa.chainValue, pa.rentPrice, pa.chainCount);
    } else if (!pa && prevPending) hideActionModal();
    renderAll();
    if (newG.winner) showWinOverlay();
  }
  function startRealtime() {
    if (!sb || !room) return;
    if (roomChan) { try { sb.removeChannel(roomChan); } catch (e) {} roomChan = null; }
    roomChan = sb.channel('mp-room-' + room.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'monopoly_rooms', filter: 'id=eq.' + room.id }, function (payload) {
        var row = payload.new; if (!row) return; room = row;
        if (row.status === 'playing' && row.state) {
          if (document.getElementById('monopolyHost').style.display !== 'block') showScreen('gameScreen');
          handleRemoteState(state.game, row.state);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monopoly_room_players', filter: 'room_id=eq.' + room.id }, refreshPlayers)
      .subscribe();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      if (!room) return;
      try {
        var r = await sb.from('monopoly_rooms').select('*').eq('id', room.id).maybeSingle();
        if (r.data && r.data.status === 'playing' && r.data.state) {
          room = r.data;
          if (!state.game || (room.version || 0) > ((state.game._v) || 0)) { state.game._v = room.version; handleRemoteState(state.game, room.state); }
        }
        refreshPlayers();
      } catch (e) {}
    }, 4000);
  }

  function renderDbg() {
    var b = $('dbgBody'); if (!b) return;
    var html = '<div><b>Level:</b> ' + profile.level + ' | <b>XP:</b> ' + profile.xp + '/' + xpForLevel(profile.level) + ' | <b>SP:</b> ' + profile.skillPoints + ' | <b>Chips:</b> ' + profile.chips + '</div>';
    html += '<div style="font-size:10px;color:#7eb4ff;margin-top:4px">ClientID: ' + clientId + ' · Online: ' + syncOnline + '</div>';
    html += '<pre>' + esc(JSON.stringify({ dice: profile.activeDice, board: profile.activeBoard, boosters: profile.ownedBoosters, skills: Object.keys(profile.skills) }, null, 2)) + '</pre>';
    if (state.game) html += '<pre>' + esc(JSON.stringify({ players: state.game.players.map(function(p){ return { name: p.name, money: p.money, pos: p.pos, bank: p.bankrupt }; }) }, null, 2)) + '</pre>';
    b.innerHTML = html;
  }

  function showScreen(id) {
    ['menuScreen', 'profileScreen', 'shopScreen', 'skillsScreen', 'onlineScreen', 'waitingScreen', 'localSetupScreen', 'gameScreen'].forEach(function (sid) {
      var el = $(sid); if (el) el.hidden = (sid !== id);
    });
    if (id === 'gameScreen') requestAnimationFrame(function () { requestAnimationFrame(fitBoard); });
    if (id === 'profileScreen') renderProfile();
    if (id === 'shopScreen') renderShop();
    if (id === 'skillsScreen') renderSkills();
    if (id === 'localSetupScreen') renderBoosterSelect();
  }

  function bindEvents() {
    $('boardGrid').addEventListener('click', function(e) {
      var btn = e.target.closest('.icon-btn-sm');
      if (!btn) return;
      var action = btn.dataset.action;
      if (action === 'sound') { sfxOn = !sfxOn; shadow.querySelectorAll('.icon-btn-sm[data-action="sound"]').forEach(function(b) { b.textContent = sfxOn ? '🔊' : '🔇'; }); toast(sfxOn ? 'Âm thanh ON' : 'Âm thanh OFF'); }
      else if (action === 'debug') { debugOpen = !debugOpen; $('debugPanel').hidden = !debugOpen; if (debugOpen) renderDbg(); }
      else if (action === 'quit') { if (confirm('Thoát game?')) { if (room) leaveRoom(); state.game = null; showScreen('menuScreen'); } }
    });
    $('dbgClose').onclick = function () { debugOpen = false; $('debugPanel').hidden = true; };
    $('dbgCopy').onclick = function () { try { navigator.clipboard.writeText(JSON.stringify(state.game, null, 2)); toast('Copied!'); } catch(e) {} };

    shadow.querySelectorAll('#playModeGrid .play-card').forEach(function (card) {
      card.onclick = function () { shadow.querySelectorAll('#playModeGrid .play-card').forEach(function (c) { c.classList.remove('active'); }); card.classList.add('active'); state.playMode = card.dataset.playmode; };
    });

    $('gotoProfileBtn').onclick = function () { showScreen('profileScreen'); };
    $('gotoShopBtn').onclick = function () { showScreen('shopScreen'); };
    $('gotoSkillsBtn').onclick = function () { showScreen('skillsScreen'); };
    $('pShopBtn').onclick = function () { showScreen('shopScreen'); };
    $('pSkillsBtn').onclick = function () { showScreen('skillsScreen'); };
    $('backFromProfileBtn').onclick = function () { showScreen('menuScreen'); };
    $('backFromShopBtn').onclick = function () { showScreen('menuScreen'); };
    $('backFromSkillsBtn').onclick = function () { showScreen('menuScreen'); };

    $('shopContent').onclick = handleShopClick;
    shadow.querySelectorAll('.shop-tab').forEach(function (tab) {
      tab.onclick = function () {
        shadow.querySelectorAll('.shop-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentShopTab = tab.dataset.tab;
        renderShop();
      };
    });

    shadow.querySelectorAll('.skill-branch .skill-list').forEach(function (list) {
      list.onclick = handleSkillClick;
    });

    $('continueBtn').onclick = function () {
      myUsername = getMyUsername();
      myProfile = { display_name: myUsername, avatar_url: avt(myUsername) };
      if (state.playMode === 'bot') showScreen('localSetupScreen');
      else enterOnlineScreen();
    };

    shadow.querySelectorAll('#botCountSeg button').forEach(function (b) {
      b.onclick = function () { shadow.querySelectorAll('#botCountSeg button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); state.botCount = parseInt(b.dataset.c, 10) || 1; };
    });

    $('startLocalBtn').onclick = function () { startLocalGame(); };
    $('backFromLocalBtn').onclick = function () { showScreen('menuScreen'); };
    $('backFromOnlineBtn').onclick = async function () { await leaveRoom(); showScreen('menuScreen'); };
    $('createRoomBtn').onclick = function () { createRoom(); };
    $('refreshRoomsBtn').onclick = function () { fetchRooms(); };
    $('roomsList').onclick = function (e) { var btn = e.target.closest('.room-item-join'); if (!btn) return; var rid = btn.dataset.id; if (rid) joinRoomById(rid); };
    $('hostStartBtn').onclick = function () { hostStart(); };
    $('leaveRoomBtn').onclick = async function () { await leaveRoom(); showScreen('onlineScreen'); };

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

    // Load cache trước
    var cached = loadProfileLocal();
    if (cached) { profile = cached; dbgEvent('PROFILE_CACHE_HIT', 'Lv.' + cached.level); }

    bindEvents();

    // Load từ server
    try {
      await loadProfileFromDB();
      dbgEvent('INIT', 'Monopoly v4.1 online — ' + myUsername);
    } catch (e) {
      syncOnline = false;
      dbgEvent('OFFLINE_MODE', e.message || 'no network');
      toast('⚠️ Offline — không sync được server, chỉ lưu máy này');
    }
  }

  function openGame() {
    host.style.display = 'block';
    init();
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
  }
  function closeGame() {
    host.style.display = 'none';
    if (room) leaveRoom();
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  closeBtn.onclick = function () { closeGame(); };
  window.openMonopolyGame = function () { openGame(); };

})();