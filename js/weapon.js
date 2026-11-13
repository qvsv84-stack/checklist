/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE v4.0 — Full (Forge + Social + PvP + Quest + Season + Pet + Boss)
   Self-contained: JS + CSS injected tự động
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__weaponForgeLoaded) return;
  window.__weaponForgeLoaded = true;

  /* ═══════════════════════════════════════════════════════════════
     0. CSS INJECT
     ═══════════════════════════════════════════════════════════════ */
  const CSS = `
#weaponPage{position:fixed;inset:0;z-index:21000;display:none;flex-direction:column;background:radial-gradient(ellipse 100% 40% at 50% 0%,rgba(255,236,180,.55),transparent 60%),radial-gradient(circle at 15% 85%,rgba(255,200,120,.15),transparent 40%),linear-gradient(180deg,#fffdf4 0%,#fef3d6 100%);color:#78350f;font-family:var(--font,ui-rounded,system-ui);overflow:hidden}
#weaponPage.show{display:flex;animation:wfSlideIn .28s cubic-bezier(.16,.9,.25,1)}
@keyframes wfSlideIn{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}
.wf-head{flex-shrink:0;display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:rgba(255,255,255,.94);backdrop-filter:blur(20px) saturate(120%);-webkit-backdrop-filter:blur(20px) saturate(120%);border-bottom:1px solid rgba(220,180,100,.4);z-index:10}
.wf-head-btn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(220,180,100,.55);border-radius:14px;background:rgba(255,255,255,.9);color:#a06a28;font-size:20px;font-weight:900;cursor:pointer;transition:transform .15s}
.wf-head-btn:active{transform:scale(.94)}
.wf-head-title{min-width:0;text-align:center}
.wf-kicker{display:block;font-size:9px;font-weight:900;letter-spacing:.26em;color:#c89858;text-transform:uppercase;line-height:1}
.wf-title{display:block;margin-top:3px;font-size:18px;font-weight:950;color:#78350f;letter-spacing:-.02em;line-height:1}
.wf-pills{display:flex;gap:6px}
.wf-pill{display:flex;align-items:center;gap:4px;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:950;font-variant-numeric:tabular-nums;line-height:1}
.wf-pill.gold{background:linear-gradient(135deg,#fff7d9,#ffd966);border:1.5px solid #f5b800;color:#6b4300;box-shadow:0 3px 10px -4px rgba(245,184,0,.5)}
.wf-body{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:12px 14px calc(16px + env(safe-area-inset-bottom))}
.wf-body::-webkit-scrollbar{width:5px}
.wf-body::-webkit-scrollbar-thumb{background:rgba(200,150,80,.35);border-radius:3px}
.wf-energy-wrap{display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:12px;background:rgba(255,255,255,.8);border:1px solid rgba(220,180,100,.35);border-radius:12px;font-size:11px;font-weight:900;color:#8a5a28}
.wf-energy-label{font-size:14px}
.wf-energy-track{flex:1;height:6px;border-radius:3px;background:rgba(200,150,80,.25);overflow:hidden}
.wf-energy-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fbbf24,#f59e0b);transition:width .4s}
.wf-energy-num{font-variant-numeric:tabular-nums;min-width:44px;text-align:right}
.wf-stage{position:relative;padding:26px 20px 22px;margin-bottom:14px;background:radial-gradient(ellipse 90% 70% at 50% 0%,rgba(255,255,255,.98),transparent 70%),linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%);border:1.5px solid rgba(220,180,100,.5);border-radius:24px;box-shadow:0 12px 30px -14px rgba(160,110,30,.28);display:flex;flex-direction:column;align-items:center;gap:10px;overflow:hidden;min-height:230px}
.wf-stage::before{content:"";position:absolute;inset:-40% -20% auto -20%;height:70%;background:radial-gradient(ellipse at center,rgba(255,200,120,.35),transparent 70%);pointer-events:none}
.wf-hammer{font-size:42px;line-height:1;transform-origin:70% 80%;filter:drop-shadow(0 4px 8px rgba(120,80,20,.3));position:relative;z-index:2}
.wf-hammer.raising{animation:wfHammerRaise .22s cubic-bezier(.4,0,.6,1) forwards}
.wf-hammer.striking{animation:wfHammerStrike .16s cubic-bezier(.6,0,.8,1) forwards}
@keyframes wfHammerRaise{to{transform:rotate(-62deg) translateY(-8px) scale(1.15)}}
@keyframes wfHammerStrike{from{transform:rotate(-62deg) translateY(-8px) scale(1.15)}to{transform:rotate(35deg) translateY(8px) scale(1)}}
.wf-weapon-wrap{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px}
.wf-weapon{font-size:84px;line-height:1;filter:drop-shadow(0 12px 20px rgba(120,80,20,.35));transition:transform .4s cubic-bezier(.34,1.56,.64,1),filter .4s}
.wf-weapon.shake{animation:wfShake .4s ease}
@keyframes wfShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px) rotate(-4deg)}40%{transform:translateX(8px) rotate(4deg)}60%{transform:translateX(-5px) rotate(-2deg)}80%{transform:translateX(5px) rotate(2deg)}}
.wf-weapon.shine{animation:wfShine .8s ease}
@keyframes wfShine{0%{transform:scale(1)}40%{transform:scale(1.3);filter:drop-shadow(0 0 30px rgba(255,215,0,.95)) drop-shadow(0 0 60px rgba(255,180,0,.55))}100%{transform:scale(1)}}
.wf-weapon.shatter{animation:wfShatter .6s ease forwards}
@keyframes wfShatter{0%{transform:scale(1) rotate(0)}40%{transform:scale(1.15) rotate(-8deg);opacity:1}100%{transform:scale(.4) rotate(180deg);opacity:0}}
.wf-tier-badge{padding:3px 10px;border-radius:999px;font-size:10px;font-weight:950;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.wf-tier-badge.tier-B{background:linear-gradient(135deg,#e8eef3,#c8d0d8);color:#4a5460}
.wf-tier-badge.tier-A{background:linear-gradient(135deg,#93c5fd,#3b82f6);color:#fff}
.wf-tier-badge.tier-S{background:linear-gradient(135deg,#ffb366,#f97316);color:#fff}
.wf-tier-badge.tier-SS{background:linear-gradient(135deg,#f0a5ff,#c026d3);color:#fff}
.wf-tier-badge.tier-SSS{background:linear-gradient(135deg,#ff6b6b,#991b1b);color:#fff}
.wf-tier-badge.tier-VIP{background:linear-gradient(135deg,#fff4c4,#d88800);color:#4a2a00}
.wf-enh-badge{display:inline-flex;align-items:baseline;gap:1px;font-size:14px;font-weight:950;color:#b45309;font-variant-numeric:tabular-nums}
.wf-enh-badge b{font-size:28px;color:#d97706;letter-spacing:-.02em}
.wf-weapon-name{font-size:12px;font-weight:900;color:#8a5a28;padding:3px 10px;border-radius:999px;background:rgba(245,184,0,.15)}
.wf-progress{width:100%;max-width:240px;height:8px;border-radius:999px;margin-top:4px;background:rgba(220,180,100,.25);overflow:hidden}
.wf-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#fcd34d,#f59e0b);transition:width .5s cubic-bezier(.16,.9,.25,1)}
.wf-progress-label{font-size:10px;font-weight:900;color:#a06a28;font-variant-numeric:tabular-nums}
.wf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.wf-stat{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.85);border:1px solid rgba(220,180,100,.35);display:flex;flex-direction:column;align-items:center;gap:2px}
.wf-stat-value{font-size:18px;font-weight:950;color:#b45309;font-variant-numeric:tabular-nums;line-height:1}
.wf-stat-value.pos{color:#4fa370}.wf-stat-value.neg{color:#dc2626}
.wf-stat-label{font-size:9.5px;font-weight:900;letter-spacing:.12em;color:#a06a28;text-transform:uppercase}
.wf-stat.combo .wf-stat-value.hot{color:#dc2626;text-shadow:0 0 12px rgba(220,38,38,.5);animation:wfComboPulse 1s ease-in-out infinite}
@keyframes wfComboPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.wf-forge-btn{width:100%;padding:16px 22px;border:0;border-radius:18px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:950;letter-spacing:.04em;color:#fff;background:linear-gradient(135deg,#f97316,#ea580c 60%,#c2410c);box-shadow:0 12px 24px -10px rgba(234,88,12,.6),inset 0 1px 0 rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .12s,box-shadow .2s;position:relative;overflow:hidden}
.wf-forge-btn:active:not(:disabled){transform:scale(.97)}
.wf-forge-btn:disabled{opacity:.55;cursor:not-allowed;filter:grayscale(.35)}
.wf-forge-btn.forging{pointer-events:none;opacity:.9}
.wf-forge-btn.forging::after{content:"";width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:wfSpin .7s linear infinite;margin-left:4px}
@keyframes wfSpin{to{transform:rotate(360deg)}}
.wf-forge-btn .wf-cost-tag{padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.18);font-size:11px;font-variant-numeric:tabular-nums}
.wf-tabs{display:flex;gap:4px;padding:4px;margin:14px 0 12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.4);border-radius:14px;overflow-x:auto;scrollbar-width:none}
.wf-tabs::-webkit-scrollbar{display:none}
.wf-tab{flex:1 0 auto;min-width:58px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 8px;border:0;border-radius:10px;background:transparent;color:#a06a28;font-family:inherit;font-size:10px;font-weight:900;cursor:pointer;transition:background .15s,color .15s}
.wf-tab:active{transform:scale(.95)}
.wf-tab.active{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#4a2a00;box-shadow:0 3px 10px -4px rgba(220,150,30,.6)}
.wf-tab-icon{font-size:16px;line-height:1;position:relative}
.wf-tab-badge{position:absolute;top:-4px;right:-10px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#dc2626;color:#fff;font-size:9px;font-weight:950;display:flex;align-items:center;justify-content:center;line-height:1}
.wf-section{margin-bottom:16px}
.wf-section-title{display:flex;align-items:center;gap:10px;font-size:10.5px;font-weight:950;letter-spacing:.18em;text-transform:uppercase;color:#a06a28;margin:8px 0}
.wf-section-title::before,.wf-section-title::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(220,180,100,.6),transparent)}
.wf-card{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:12px 14px;margin-bottom:8px;border-radius:14px;background:#fff;border:1.5px solid rgba(220,180,100,.4)}
.wf-card.equipped{border-color:#f59e0b;background:linear-gradient(160deg,#fffbeb,#fef3c7);box-shadow:0 0 0 2px rgba(245,158,11,.25)}
.wf-card-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:11px;font-size:24px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid rgba(220,180,100,.3)}
.wf-card-body{min-width:0;display:flex;flex-direction:column;gap:2px}
.wf-card-name{font-size:13.5px;font-weight:900;color:#78350f}
.wf-card-meta{font-size:11px;font-weight:700;color:#a06a28;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.wf-rarity-badge{padding:1px 6px;border-radius:4px;font-size:9px;font-weight:950;letter-spacing:.04em;text-transform:uppercase}
.wf-rarity-badge.common{background:#e8eef3;color:#4a5460}
.wf-rarity-badge.uncommon{background:#d1fadf;color:#166534}
.wf-rarity-badge.rare{background:#dbeafe;color:#1e40af}
.wf-rarity-badge.epic{background:#ede9fe;color:#6d28d9}
.wf-rarity-badge.legendary{background:linear-gradient(135deg,#fff4c4,#d88800);color:#4a2a00}
.wf-card-btn{padding:8px 12px;border-radius:10px;border:0;font-family:inherit;font-size:12px;font-weight:950;color:#fff;cursor:pointer;white-space:nowrap;background:linear-gradient(180deg,#f59e0b,#d97706);box-shadow:0 3px 8px -3px rgba(220,140,20,.5);transition:transform .12s,opacity .15s}
.wf-card-btn:active{transform:scale(.94)}
.wf-card-btn:disabled{opacity:.5;cursor:not-allowed}
.wf-card-btn.equipped{background:linear-gradient(180deg,#dc2626,#991b1b)}
.wf-card-btn.buy{background:linear-gradient(180deg,#4fa370,#2f7d4f)}
.wf-card-btn.buy:disabled{background:linear-gradient(180deg,#9ca3af,#6b7280)}
.wf-qty{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:950;color:#a06a28;padding:2px 8px;border-radius:999px;background:rgba(245,184,0,.15);font-variant-numeric:tabular-nums}
.wf-qty b{color:#78350f}
.wf-inventory-hero{padding:20px 18px;background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(255,255,255,.98),transparent 70%),linear-gradient(160deg,#fffbeb,#fef3c7);border:1.5px solid rgba(220,180,100,.5);border-radius:20px;text-align:center;margin-bottom:14px}
.wf-inv-weapon{font-size:64px;line-height:1;margin-bottom:6px;filter:drop-shadow(0 8px 16px rgba(120,80,20,.3))}
.wf-inv-name{font-size:18px;font-weight:950;color:#78350f;margin-bottom:4px}
.wf-inv-power{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(245,184,0,.2);color:#92400e;font-size:12px;font-weight:950;font-variant-numeric:tabular-nums;margin-bottom:10px}
.wf-achievements{display:flex;flex-direction:column;gap:6px}
.wf-ach{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.65);border:1px solid rgba(220,180,100,.3);border-radius:12px}
.wf-ach.unlocked{background:linear-gradient(160deg,#fffbeb,#fef3c7);border-color:rgba(245,158,11,.5)}
.wf-ach-icon{font-size:22px;line-height:1;text-align:center}
.wf-ach-name{font-size:12.5px;font-weight:900;color:#78350f}
.wf-ach-desc{font-size:10.5px;font-weight:700;color:#a06a28;margin-top:1px}
.wf-ach-reward{font-size:11px;font-weight:950;color:#a06a28;padding:3px 8px;border-radius:999px;background:rgba(245,184,0,.2)}
.wf-ach.unlocked .wf-ach-reward{background:#f59e0b;color:#fff}
.wf-history-empty{text-align:center;padding:28px 12px;font-size:12px;font-weight:700;color:#a89070}
.wf-result{position:fixed;inset:0;z-index:21100;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(20,15,5,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.wf-result.show{display:flex;animation:wfFadeIn .2s ease}
@keyframes wfFadeIn{from{opacity:0}to{opacity:1}}
.wf-result-card{width:100%;max-width:320px;background:linear-gradient(160deg,#ffffff,#fffbeb);border-radius:24px;padding:26px 22px 20px;text-align:center;position:relative;box-shadow:0 24px 60px -20px rgba(80,50,10,.5);animation:wfPopIn .35s cubic-bezier(.34,1.56,.64,1);overflow:hidden}
@keyframes wfPopIn{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
.wf-result-emoji{font-size:64px;line-height:1;margin-bottom:8px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.2))}
.wf-result-title{font-size:22px;font-weight:950;margin-bottom:6px;letter-spacing:-.01em}
.wf-result-title.broken{color:#b91c1c}
.wf-result-title.damaged{color:#c2410c}
.wf-result-title.hold{color:#a16207}
.wf-result-title.success{color:#15803d}
.wf-result-title.great{color:#6d28d9}
.wf-result-desc{font-size:13px;font-weight:700;color:#a06a28;margin-bottom:16px;line-height:1.45}
.wf-result-changes{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.wf-result-chip{padding:5px 12px;border-radius:999px;font-size:11.5px;font-weight:950;font-variant-numeric:tabular-nums;background:rgba(0,0,0,.06);color:#78350f}
.wf-result-chip.plus-gold{background:linear-gradient(135deg,#fff7d9,#ffd966);color:#6b4300}
.wf-result-chip.plus-enh{background:rgba(79,163,112,.2);color:#2a6b46}
.wf-result-chip.minus-enh{background:rgba(220,38,38,.15);color:#991b1b}
.wf-result-chip.zero-enh{background:rgba(200,150,80,.2);color:#78350f}
.wf-result-btn{width:100%;padding:13px;border:0;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-family:inherit;font-size:14px;font-weight:950;letter-spacing:.02em;cursor:pointer;box-shadow:0 8px 18px -8px rgba(220,140,20,.6)}
.wf-result-btn:active{transform:scale(.97)}
.wf-number-pop{position:fixed;z-index:21200;font-size:20px;font-weight:950;pointer-events:none;animation:wfNumberRise 1s ease-out forwards;text-shadow:0 2px 6px rgba(0,0,0,.3)}
@keyframes wfNumberRise{0%{opacity:0;transform:translateY(0) scale(.7)}20%{opacity:1;transform:translateY(-10px) scale(1.15)}100%{opacity:0;transform:translateY(-70px) scale(.9)}}
#weaponPage.shake{animation:wfPageShake .35s ease}
@keyframes wfPageShake{0%,100%{transform:translate3d(0,0,0)}20%{transform:translate3d(-4px,3px,0)}40%{transform:translate3d(4px,-3px,0)}60%{transform:translate3d(-3px,2px,0)}80%{transform:translate3d(3px,-2px,0)}}
.wf-spark{position:fixed;z-index:21150;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff 0%,#fbbf24 60%,transparent 100%);box-shadow:0 0 10px #fbbf24,0 0 20px rgba(245,158,11,.6);pointer-events:none;animation:wfSparkFly .8s cubic-bezier(.4,0,.8,1) forwards}
@keyframes wfSparkFly{0%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}100%{opacity:0;transform:translate(calc(-50% + var(--tx,0px)),calc(-50% + var(--ty,0px))) scale(.3) rotate(180deg)}}
.wf-login-wall{padding:40px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.wf-login-wall-emoji{font-size:64px;opacity:.6}
.wf-login-wall-title{font-size:16px;font-weight:900;color:#78350f}
.wf-login-wall-sub{font-size:12px;font-weight:700;color:#a06a28;max-width:240px;line-height:1.4}
.wf-login-btn{padding:12px 28px;border:0;border-radius:999px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-family:inherit;font-size:14px;font-weight:950;box-shadow:0 8px 20px -8px rgba(220,140,20,.6);cursor:pointer}
.ws-stats-card{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px;background:rgba(255,255,255,.85);border:1px solid rgba(220,180,100,.4);border-radius:14px;margin-bottom:12px}
.ws-stat-cell{text-align:center}
.ws-stat-label{font-size:9px;font-weight:900;letter-spacing:.1em;color:#a06a28;text-transform:uppercase;margin-bottom:3px}
.ws-stat-value{font-size:16px;font-weight:950;color:#78350f;font-variant-numeric:tabular-nums}
.ws-stat-value.gold{color:#d97706}
.ws-stat-value.pos{color:#15803d}
.ws-stat-value.neg{color:#dc2626}
.ws-subtabs{display:flex;gap:4px;padding:4px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.4);border-radius:12px;margin-bottom:12px;overflow-x:auto;scrollbar-width:none}
.ws-subtabs::-webkit-scrollbar{display:none}
.ws-subtab{flex:1 0 auto;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:#a06a28;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;white-space:nowrap;position:relative}
.ws-subtab.active{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#4a2a00}
.ws-subtab-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#dc2626;color:#fff;font-size:9px;font-weight:950;margin-left:4px}
.ws-challenge-card{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:12px;background:linear-gradient(160deg,#fffaf0,#fef3c7);border:1.5px solid #f59e0b;border-radius:14px;margin-bottom:8px;box-shadow:0 4px 12px -8px rgba(220,140,20,.4)}
.ws-cc-avatar{width:44px;height:44px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#fff7d9,#ffd966);display:flex;align-items:center;justify-content:center;color:#7a5410;font-size:16px;font-weight:950;border:2px solid #fff;position:relative}
.ws-cc-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.ws-av-fb{display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.ws-cc-body{min-width:0;display:flex;flex-direction:column;gap:3px}
.ws-cc-name{font-size:13px;font-weight:950;color:#78350f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-cc-meta{font-size:10.5px;font-weight:700;color:#a06a28}
.ws-cc-meta b{color:#d97706}
.ws-cc-actions{display:flex;gap:5px;flex-shrink:0}
.ws-btn{padding:8px 14px;border:0;border-radius:10px;font-family:inherit;font-size:12px;font-weight:950;cursor:pointer;color:#fff;background:linear-gradient(180deg,#4fa370,#2f7d4f);box-shadow:0 3px 8px -3px rgba(79,163,112,.5);transition:transform .12s,opacity .15s;white-space:nowrap}
.ws-btn:active{transform:scale(.94)}
.ws-btn:disabled{opacity:.5;cursor:not-allowed}
.ws-btn.small{padding:6px 10px;font-size:11px}
.ws-btn.primary{background:linear-gradient(180deg,#f59e0b,#d97706);box-shadow:0 3px 8px -3px rgba(220,140,20,.5)}
.ws-btn.accept{background:linear-gradient(180deg,#4fa370,#2f7d4f)}
.ws-btn.reject{background:rgba(220,38,38,.15);color:#991b1b;box-shadow:none}
.ws-player-row{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.3);border-radius:12px;margin-bottom:6px}
.ws-pr-avatar{width:40px;height:40px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#fff7d9,#ffd966);display:flex;align-items:center;justify-content:center;color:#7a5410;font-size:14px;font-weight:950;border:2px solid #fff}
.ws-pr-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.ws-pr-body{min-width:0}
.ws-pr-name{font-size:13px;font-weight:900;color:#78350f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-pr-meta{font-size:10.5px;font-weight:700;color:#a06a28;margin-top:1px}
.ws-history-row{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.3);border-radius:12px;margin-bottom:6px}
.ws-history-row.won{background:linear-gradient(160deg,#f0fdf4,#dcfce7);border-color:rgba(34,197,94,.4)}
.ws-history-row.lost{background:linear-gradient(160deg,#fef2f2,#fee2e2);border-color:rgba(220,38,38,.3)}
.ws-hr-badge{font-size:11px;font-weight:950;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.06);color:#78350f;white-space:nowrap}
.ws-history-row.won .ws-hr-badge{background:#22c55e;color:#fff}
.ws-history-row.lost .ws-hr-badge{background:#dc2626;color:#fff}
.ws-hr-body{min-width:0}
.ws-hr-name{font-size:13px;font-weight:900;color:#78350f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-hr-meta{font-size:10.5px;font-weight:700;color:#a06a28;margin-top:1px}
.ws-feed{display:flex;flex-direction:column;gap:4px;padding:8px;background:rgba(255,255,255,.5);border:1px solid rgba(220,180,100,.3);border-radius:12px;max-height:280px;overflow-y:auto}
.ws-feed-item{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:11.5px;background:rgba(255,255,255,.5)}
.ws-fi-icon{font-size:14px;text-align:center}
.ws-fi-text{color:#78350f;font-weight:700;overflow:hidden;text-overflow:ellipsis}
.ws-fi-text b{color:#a06a28;font-weight:950}
.ws-fi-time{font-size:10px;color:#a89070;font-variant-numeric:tabular-nums}
.ws-chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 340px);min-height:320px;background:rgba(255,255,255,.5);border:1.5px solid rgba(220,180,100,.4);border-radius:16px;overflow:hidden}
.ws-chat-list{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.ws-chat-list::-webkit-scrollbar{width:4px}
.ws-chat-list::-webkit-scrollbar-thumb{background:rgba(200,150,80,.35);border-radius:2px}
.ws-chat-msg{display:flex;gap:8px;max-width:85%}
.ws-chat-msg.me{align-self:flex-end;flex-direction:row-reverse}
.ws-chat-av{width:30px;height:30px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#fff7d9,#ffd966);color:#7a5410;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:950;flex-shrink:0;border:1.5px solid #fff}
.ws-chat-av img{width:100%;height:100%;object-fit:cover;display:block}
.ws-chat-bubble-wrap{display:flex;flex-direction:column;gap:2px;min-width:0}
.ws-chat-msg.me .ws-chat-bubble-wrap{align-items:flex-end}
.ws-chat-name{font-size:10px;font-weight:900;color:#a06a28;padding:0 4px}
.ws-chat-bubble{padding:8px 12px;border-radius:14px;background:#fff;border:1px solid rgba(220,180,100,.3);font-size:13px;font-weight:700;color:#78350f;line-height:1.4;word-break:break-word}
.ws-chat-msg.me .ws-chat-bubble{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-color:transparent}
.ws-chat-time{font-size:9px;color:#a89070;font-variant-numeric:tabular-nums;padding:0 4px}
.ws-chat-input-bar{display:flex;gap:6px;padding:8px;background:rgba(255,255,255,.9);border-top:1px solid rgba(220,180,100,.3);flex-shrink:0}
.ws-chat-input{flex:1;padding:9px 12px;border:1px solid rgba(220,180,100,.5);border-radius:10px;background:#fff;font-family:inherit;font-size:13px;color:#78350f;outline:0}
.ws-chat-input:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.15)}
.ws-chat-input:disabled{background:#f5f5f5;opacity:.6}
.ws-chat-send{padding:9px 16px;border:0;border-radius:10px;background:linear-gradient(180deg,#f59e0b,#d97706);color:#fff;font-family:inherit;font-size:12px;font-weight:950;cursor:pointer;white-space:nowrap}
.ws-chat-send:disabled{background:#9ca3af;cursor:not-allowed}
.ws-chat-cooldown{padding:0 12px;font-size:11px;font-weight:900;color:#dc2626;text-align:center;min-height:16px}
.ws-gift-row{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.3);border-radius:12px;margin-bottom:6px}
.ws-gift-av{width:44px;height:44px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#fff7d9,#ffd966);display:flex;align-items:center;justify-content:center;color:#7a5410;font-size:15px;font-weight:950;border:2px solid #fff}
.ws-gift-av img{width:100%;height:100%;object-fit:cover;display:block}
.ws-gift-body{min-width:0}
.ws-gift-name{font-size:13px;font-weight:900;color:#78350f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-gift-meta{font-size:10.5px;font-weight:700;color:#a06a28;margin-top:1px}
.ws-modal{position:fixed;inset:0;z-index:21300;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(20,15,5,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.ws-modal.show{display:flex;animation:wfFadeIn .2s ease}
.ws-modal-card{width:100%;max-width:340px;padding:22px 20px 18px;background:linear-gradient(160deg,#fff,#fffbeb);border-radius:22px;box-shadow:0 24px 60px -20px rgba(80,50,10,.5);animation:wfPopIn .3s cubic-bezier(.34,1.56,.64,1)}
.ws-modal-title{font-size:18px;font-weight:950;color:#78350f;text-align:center;margin-bottom:4px}
.ws-modal-sub{font-size:12px;font-weight:700;color:#a06a28;text-align:center;margin-bottom:16px;line-height:1.4}
.ws-modal-label{display:block;font-size:11px;font-weight:900;color:#78350f;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
.ws-modal-input{width:100%;padding:10px 12px;border:1.5px solid rgba(220,180,100,.6);border-radius:10px;background:#fff;font-family:inherit;font-size:15px;font-weight:900;color:#78350f;outline:0;box-sizing:border-box;margin-bottom:12px;font-variant-numeric:tabular-nums}
.ws-modal-input:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.15)}
.ws-modal-textarea{width:100%;padding:10px 12px;border:1.5px solid rgba(220,180,100,.6);border-radius:10px;background:#fff;font-family:inherit;font-size:13px;font-weight:700;color:#78350f;outline:0;box-sizing:border-box;margin-bottom:12px;resize:vertical;min-height:56px}
.ws-modal-textarea:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.15)}
.ws-modal-quick{display:flex;gap:6px;margin-bottom:12px}
.ws-modal-quick button{flex:1;padding:6px;border:1px solid rgba(220,180,100,.5);border-radius:8px;background:#fff;color:#78350f;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer}
.ws-modal-quick button:active{background:#fffbeb}
.ws-modal-actions{display:flex;gap:8px;margin-top:4px}
.ws-modal-actions button{flex:1;padding:12px;border:0;border-radius:12px;font-family:inherit;font-size:14px;font-weight:950;cursor:pointer}
.ws-modal-cancel{background:rgba(0,0,0,.06);color:#78350f}
.ws-modal-confirm{background:linear-gradient(180deg,#f59e0b,#d97706);color:#fff;box-shadow:0 6px 16px -6px rgba(220,140,20,.5)}
.ws-modal-confirm:disabled{opacity:.5;cursor:not-allowed}
.ws-battle{position:fixed;inset:0;z-index:21400;display:none;flex-direction:column;background:radial-gradient(ellipse 100% 40% at 50% 0%,rgba(255,236,180,.4),transparent 60%),linear-gradient(180deg,#1a1512 0%,#2d2420 100%);color:#fff;overflow:hidden}
.ws-battle.show{display:flex;animation:wfFadeIn .3s ease}
.ws-battle-head{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:rgba(0,0,0,.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,200,120,.2);z-index:10}
.ws-battle-head-btn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(255,200,120,.3);border-radius:14px;background:rgba(255,255,255,.08);color:#fcd34d;font-size:20px;font-weight:900;cursor:pointer}
.ws-battle-title{text-align:center}
.ws-battle-kicker{display:block;font-size:9px;font-weight:900;letter-spacing:.26em;color:#a06a28;text-transform:uppercase}
.ws-battle-name{display:block;margin-top:3px;font-size:15px;font-weight:950;color:#fcd34d;letter-spacing:-.01em}
.ws-battle-arena{flex:1 1 auto;position:relative;overflow:hidden;padding:16px}
.ws-battle-vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px;font-weight:950;color:rgba(255,200,120,.15);pointer-events:none;z-index:0}
.ws-battle-fighters{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:10px;height:100%;max-height:340px;padding-top:110px}
.ws-fighter{display:flex;flex-direction:column;align-items:center;gap:8px;transition:transform .3s,opacity .3s;z-index:1;position:relative}
.ws-fighter.dead{opacity:.3;filter:grayscale(1)}
.ws-fighter.attacking{animation:wsAttack .4s ease}
.ws-fighter.hurt{animation:wsHurt .4s ease}
@keyframes wsAttack{0%,100%{transform:translateY(0)}40%{transform:translateY(-20px) scale(1.05)}}
@keyframes wsHurt{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.ws-fighter-avatar{width:72px;height:72px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#fff7d9,#ffd966);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:950;color:#7a5410;border:3px solid rgba(252,211,77,.5);box-shadow:0 8px 24px rgba(0,0,0,.4);position:relative}
.ws-fighter-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.ws-fighter-name{font-size:12px;font-weight:950;color:#fff;text-align:center;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ws-fighter-hp{width:100%;max-width:120px;height:8px;background:rgba(0,0,0,.4);border-radius:4px;overflow:hidden;border:1px solid rgba(255,200,120,.3)}
.ws-fighter-hp-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#dc2626);transition:width .4s cubic-bezier(.16,.9,.25,1)}
.ws-fighter-hp-text{font-size:11px;font-weight:950;color:#fcd34d;font-variant-numeric:tabular-nums}
.ws-fighter-turn{position:absolute;top:-8px;right:-8px;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:950;box-shadow:0 3px 10px rgba(245,158,11,.6);animation:wsTurnPulse 1s ease-in-out infinite}
@keyframes wsTurnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.ws-battle-vs-mark{display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:950;color:#fcd34d;padding-bottom:50px}
.ws-battle-log{position:absolute;top:12px;left:12px;right:12px;max-height:100px;overflow-y:auto;padding:8px 12px;background:rgba(0,0,0,.5);border:1px solid rgba(255,200,120,.2);border-radius:10px;font-size:11px;font-weight:700;color:#fcd34d;z-index:2}
.ws-battle-log-item{padding:2px 0;animation:wfSlideIn .3s ease}
.ws-battle-log-item.crit{color:#fbbf24;font-weight:950}
.ws-battle-log-item.miss{color:#6b7280}
.ws-battle-log-item.end{color:#10b981;font-weight:950;font-size:12px}
.ws-battle-actions{flex-shrink:0;padding:12px 14px calc(12px + env(safe-area-inset-bottom));background:rgba(0,0,0,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,200,120,.2)}
.ws-battle-turn-info{text-align:center;font-size:12px;font-weight:900;color:#fcd34d;margin-bottom:10px;min-height:16px}
.ws-battle-turn-info.my{animation:wsTurnPulse 1.5s ease-in-out infinite;color:#10b981}
.ws-battle-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ws-battle-btn{padding:14px;border:0;border-radius:12px;font-family:inherit;font-size:14px;font-weight:950;color:#fff;cursor:pointer;transition:transform .12s,opacity .15s;text-align:center;line-height:1.2}
.ws-battle-btn:active:not(:disabled){transform:scale(.96)}
.ws-battle-btn:disabled{opacity:.4;cursor:not-allowed}
.ws-battle-btn.strike{background:linear-gradient(180deg,#3b82f6,#1e40af);box-shadow:0 4px 12px -4px rgba(59,130,246,.6)}
.ws-battle-btn.heavy{background:linear-gradient(180deg,#ef4444,#991b1b);box-shadow:0 4px 12px -4px rgba(239,68,68,.6)}
.ws-battle-btn.defend{background:linear-gradient(180deg,#6b7280,#374151);box-shadow:0 4px 12px -4px rgba(107,114,128,.6)}
.ws-battle-btn.heal{background:linear-gradient(180deg,#10b981,#047857);box-shadow:0 4px 12px -4px rgba(16,185,129,.6)}
.ws-battle-btn small{display:block;font-size:10px;font-weight:700;opacity:.8;margin-top:2px}
.ws-battle-result{position:fixed;inset:0;z-index:21500;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ws-battle-result.show{display:flex;animation:wfFadeIn .3s ease}
.ws-battle-result-card{width:100%;max-width:320px;background:linear-gradient(160deg,#1f1a15,#2d2420);border:2px solid rgba(252,211,77,.5);border-radius:24px;padding:26px 22px 20px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.6)}
.ws-battle-result-emoji{font-size:64px;line-height:1;margin-bottom:8px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.5))}
.ws-battle-result-title{font-size:24px;font-weight:950;color:#fcd34d;margin-bottom:6px}
.ws-battle-result-sub{font-size:14px;font-weight:700;color:#a06a28;margin-bottom:20px;line-height:1.5}
.ws-battle-result-btn{width:100%;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-family:inherit;font-size:15px;font-weight:950;cursor:pointer}
.ws-battle-list-item{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:12px;background:linear-gradient(160deg,#fffaf0,#fef3c7);border:1.5px solid #f59e0b;border-radius:14px;margin-bottom:8px;box-shadow:0 4px 12px -8px rgba(220,140,20,.4)}
/* ═══ v4.0: QUEST / SEASON / PET / BOSS ═══ */
.ws-quest-card{display:grid;grid-template-columns:44px 1fr;gap:10px;padding:12px;background:rgba(255,255,255,.9);border:1.5px solid rgba(220,180,100,.4);border-radius:14px;margin-bottom:8px}
.ws-quest-card.done{border-color:#22c55e;background:linear-gradient(160deg,#f0fdf4,#dcfce7)}
.ws-quest-card.claimed{border-color:#9ca3af;background:rgba(200,200,200,.3);opacity:.7}
.ws-quest-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:11px;font-size:22px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid rgba(220,180,100,.3)}
.ws-quest-body{min-width:0;display:flex;flex-direction:column;gap:6px}
.ws-quest-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.ws-quest-name{font-size:13px;font-weight:950;color:#78350f;line-height:1.3}
.ws-quest-reward{font-size:11px;font-weight:950;color:#a06a28;padding:2px 8px;border-radius:8px;background:rgba(245,184,0,.2);white-space:nowrap;flex-shrink:0}
.ws-quest-progress-bar{height:8px;border-radius:4px;background:rgba(200,150,80,.25);overflow:hidden;position:relative}
.ws-quest-progress-fill{height:100%;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:4px;transition:width .4s}
.ws-quest-progress-text{font-size:10.5px;font-weight:900;color:#a06a28;font-variant-numeric:tabular-nums;text-align:right}
.ws-quest-claim{width:100%;padding:8px;border:0;border-radius:8px;font-family:inherit;font-size:12px;font-weight:950;color:#fff;background:linear-gradient(180deg,#22c55e,#15803d);cursor:pointer;box-shadow:0 3px 8px -3px rgba(34,197,94,.5)}
.ws-quest-claim:disabled{background:#9ca3af;box-shadow:none;cursor:not-allowed;opacity:.6}
.ws-season-header{padding:14px 16px;background:linear-gradient(135deg,#312e81,#1e1b4b);border-radius:16px;color:#fff;margin-bottom:12px;position:relative;overflow:hidden}
.ws-season-header::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(252,211,77,.2),transparent 50%);pointer-events:none}
.ws-season-name{font-size:14px;font-weight:950;color:#fcd34d;margin-bottom:6px;position:relative}
.ws-season-tier-num{font-size:32px;font-weight:950;color:#fff;line-height:1;margin-bottom:4px;position:relative;font-variant-numeric:tabular-nums}
.ws-season-tier-num small{font-size:14px;color:rgba(255,255,255,.6);margin-left:4px}
.ws-season-xp-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.15);overflow:hidden;margin-bottom:6px;position:relative}
.ws-season-xp-fill{height:100%;background:linear-gradient(90deg,#fcd34d,#f59e0b);border-radius:4px;transition:width .4s}
.ws-season-xp-text{font-size:10.5px;font-weight:900;color:#a06a28;position:relative}
.ws-season-track{display:flex;gap:8px;overflow-x:auto;padding:4px 0 12px;scrollbar-width:thin}
.ws-season-track::-webkit-scrollbar{height:4px}
.ws-season-track::-webkit-scrollbar-thumb{background:rgba(200,150,80,.35);border-radius:2px}
.ws-season-tier{flex:0 0 100px;padding:12px 10px;background:rgba(255,255,255,.9);border:2px solid rgba(220,180,100,.4);border-radius:14px;text-align:center;position:relative;transition:transform .12s}
.ws-season-tier.unlocked{border-color:#f59e0b;background:linear-gradient(160deg,#fffbeb,#fef3c7);box-shadow:0 0 0 2px rgba(245,158,11,.2)}
.ws-season-tier.claimed{opacity:.5;border-color:#9ca3af}
.ws-season-tier-num-small{font-size:11px;font-weight:950;color:#a06a28;margin-bottom:6px}
.ws-season-tier-icon{font-size:26px;line-height:1;margin-bottom:4px}
.ws-season-tier-reward{font-size:10px;font-weight:900;color:#78350f;line-height:1.3}
.ws-season-tier-btn{width:100%;margin-top:6px;padding:5px;border:0;border-radius:6px;font-family:inherit;font-size:10px;font-weight:950;color:#fff;background:linear-gradient(180deg,#22c55e,#15803d);cursor:pointer}
.ws-season-tier-btn:disabled{background:#9ca3af;cursor:not-allowed}
.ws-season-tier.premium{background:linear-gradient(160deg,#4c1d95,#2e1065);border-color:#a855f7}
.ws-season-tier.premium .ws-season-tier-num-small{color:#c4b5fd}
.ws-season-tier.premium .ws-season-tier-reward{color:#e9d5ff}
.ws-season-tier.premium.unlocked{border-color:#a855f7;box-shadow:0 0 0 2px rgba(168,85,247,.3)}
.ws-season-lock{font-size:20px;line-height:1}
.ws-pet-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ws-pet-card{padding:14px 12px;background:rgba(255,255,255,.9);border:2px solid rgba(220,180,100,.4);border-radius:14px;text-align:center;position:relative;transition:transform .12s}
.ws-pet-card:active{transform:scale(.97)}
.ws-pet-card.active{border-color:#f59e0b;background:linear-gradient(160deg,#fffbeb,#fef3c7);box-shadow:0 0 0 2px rgba(245,158,11,.3)}
.ws-pet-card.locked{opacity:.55;filter:grayscale(.7)}
.ws-pet-emoji{font-size:44px;line-height:1;margin-bottom:6px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.15))}
.ws-pet-name{font-size:12px;font-weight:950;color:#78350f;margin-bottom:2px}
.ws-pet-level{font-size:10.5px;font-weight:900;color:#a06a28;margin-bottom:4px}
.ws-pet-xp{height:6px;border-radius:3px;background:rgba(200,150,80,.25);overflow:hidden;margin-bottom:6px}
.ws-pet-xp-fill{height:100%;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:3px;transition:width .4s}
.ws-pet-desc{font-size:9.5px;font-weight:700;color:#a06a28;line-height:1.3;margin-bottom:8px;min-height:22px}
.ws-pet-actions{display:flex;gap:4px}
.ws-pet-btn{flex:1;padding:6px 4px;border:0;border-radius:6px;font-family:inherit;font-size:10px;font-weight:950;color:#fff;cursor:pointer;background:linear-gradient(180deg,#f59e0b,#d97706)}
.ws-pet-btn:active{transform:scale(.95)}
.ws-pet-btn:disabled{background:#9ca3af;cursor:not-allowed;opacity:.6}
.ws-pet-btn.green{background:linear-gradient(180deg,#22c55e,#15803d)}
.ws-pet-active-badge{position:absolute;top:-8px;right:-8px;padding:3px 8px;border-radius:8px;background:#f59e0b;color:#fff;font-size:9px;font-weight:950;box-shadow:0 3px 8px rgba(245,158,11,.5)}
.ws-boss-card{padding:16px;background:linear-gradient(160deg,#450a0a,#1e1b4b);border:2px solid #7f1d1d;border-radius:18px;color:#fff;position:relative;overflow:hidden;margin-bottom:12px}
.ws-boss-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(239,68,68,.3),transparent 60%);pointer-events:none}
.ws-boss-card.defeated{border-color:#22c55e;background:linear-gradient(160deg,#14532d,#1e1b4b)}
.ws-boss-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;position:relative}
.ws-boss-emoji{font-size:52px;line-height:1;filter:drop-shadow(0 4px 12px rgba(239,68,68,.5))}
.ws-boss-info{flex:1;min-width:0}
.ws-boss-name{font-size:16px;font-weight:950;color:#fca5a5;margin-bottom:3px;line-height:1.2}
.ws-boss-card.defeated .ws-boss-name{color:#86efac}
.ws-boss-level{font-size:11px;font-weight:900;color:rgba(255,255,255,.7)}
.ws-boss-hp-bar{height:14px;border-radius:7px;background:rgba(0,0,0,.5);overflow:hidden;position:relative;border:1px solid rgba(255,255,255,.2);margin-bottom:6px}
.ws-boss-hp-fill{height:100%;background:linear-gradient(90deg,#dc2626,#991b1b);border-radius:7px;transition:width .5s cubic-bezier(.16,.9,.25,1);position:relative}
.ws-boss-hp-fill::after{content:'';position:absolute;top:0;right:0;bottom:0;width:30px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4));animation:wfBarShine 2s ease-in-out infinite}
@keyframes wfBarShine{0%,100%{opacity:.3}50%{opacity:1}}
.ws-boss-hp-text{font-size:11px;font-weight:950;color:#fca5a5;text-align:center;font-variant-numeric:tabular-nums;margin-bottom:12px;position:relative}
.ws-boss-card.defeated .ws-boss-hp-text{color:#86efac}
.ws-boss-actions{display:flex;gap:8px;position:relative}
.ws-boss-btn{flex:1;padding:12px;border:0;border-radius:10px;font-family:inherit;font-size:13px;font-weight:950;color:#fff;cursor:pointer;background:linear-gradient(135deg,#ef4444,#991b1b);box-shadow:0 4px 12px -4px rgba(239,68,68,.6);transition:transform .12s}
.ws-boss-btn:active:not(:disabled){transform:scale(.96)}
.ws-boss-btn:disabled{background:#6b7280;box-shadow:none;cursor:not-allowed;opacity:.6}
.ws-boss-btn.green{background:linear-gradient(180deg,#22c55e,#15803d);box-shadow:0 4px 12px -4px rgba(34,197,94,.6)}
.ws-boss-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px;position:relative}
.ws-boss-stat{padding:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;text-align:center}
.ws-boss-stat-label{font-size:9px;font-weight:900;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
.ws-boss-stat-value{font-size:14px;font-weight:950;color:#fca5a5;font-variant-numeric:tabular-nums}
.ws-boss-stat-value.pos{color:#86efac}
`;
  if (!document.getElementById('wfStyles')) {
    const st = document.createElement('style');
    st.id = 'wfStyles';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════
     1. CONFIG
     ═══════════════════════════════════════════════════════════════ */
  const CFG = {
    START_GOLD: 300, FORGE_GOLD: 10, FORGE_ENERGY: 1,
    ENERGY_MAX: 100, ENERGY_REGEN_MS: 6 * 60 * 1000,
    REFILL_COST_GOLD: 50, REFILL_AMOUNT: 50,
    LS_PREFIX: "__wf_state_", SAVE_DEBOUNCE_MS: 800,
    CHAT_COOLDOWN_MS: 10000, CHAT_MAX_LEN: 200,
    GIFT_MIN: 10, GIFT_MAX_PER_TX: 500, GIFT_MAX_PER_DAY: 1000,
    DUEL_MIN: 10, DUEL_MAX: 5000,
    BATTLE_TURN_TIMEOUT_MS: 60000, BATTLE_POLL_MS: 3000,
    BOSS_POLL_MS: 5000, BOSS_ATTACK_COOLDOWN_MS: 10000,
    PET_MAX_LEVEL: 20, PET_XP_PER_LEVEL: 100,
    SEASON_MAX_TIER: 30, SEASON_XP_PER_TIER: 1000,

    TIER_ORDER: ['B','A','S','SS','SSS','VIP'],
    TIERS: {
      B:   { name:'Gỗ Mục',      emoji:'🪵', mult:1,  enhMax:3  },
      A:   { name:'Sắt Rỉ',      emoji:'⚔️', mult:2,  enhMax:6  },
      S:   { name:'Thép Sáng',   emoji:'🗡️', mult:4,  enhMax:9  },
      SS:  { name:'Lam Ngọc',    emoji:'🔷', mult:8,  enhMax:12 },
      SSS: { name:'Huyền Thiết', emoji:'🌟', mult:16, enhMax:14 },
      VIP: { name:'Thần Binh',   emoji:'👑', mult:32, enhMax:15 },
    },
    ENH_TO_TIER: ['B','B','B','B','A','A','A','S','S','S','SS','SS','SS','SSS','SSS','VIP'],
    MATERIALS: {
      wood:       { name:'Gỗ',        emoji:'🪵', price:5,    bonus:{hold:3} },
      iron:       { name:'Sắt',       emoji:'🔩', price:20,   bonus:{success:5} },
      steel:      { name:'Thép',      emoji:'⚙️', price:80,   bonus:{success:10,great:3} },
      mythril:    { name:'Mythril',   emoji:'💎', price:300,  bonus:{success:15,great:8,broken:-3} },
      orichalcum: { name:'Orichalcum',emoji:'🔮', price:1000, bonus:{success:20,great:12,broken:-5} },
      star:       { name:'Kim Tinh',  emoji:'⭐', price:3000, bonus:{success:25,great:18,broken:-8,hold:5} },
    },
    HAMMERS: {
      wooden:  { name:'Búa Gỗ',      emoji:'🔨', price:0,     rarity:'common',    bonus:{} },
      iron:    { name:'Búa Sắt',     emoji:'🔨', price:200,   rarity:'uncommon',  bonus:{success:5,broken:-2} },
      steel:   { name:'Búa Thép',    emoji:'🔨', price:800,   rarity:'rare',      bonus:{success:10,great:5,broken:-3} },
      mythril: { name:'Búa Mythril', emoji:'🔨', price:3000,  rarity:'epic',      bonus:{success:15,great:10,broken:-5,damaged:-3} },
      divine:  { name:'Búa Thần',    emoji:'🔨', price:10000, rarity:'legendary', bonus:{success:25,great:15,broken:-10,damaged:-5,hold:5} },
    },
    BASE_RATES: { broken:5, damaged:15, hold:25, success:45, great:10 },
    PITY_FAILS_FOR_SUCCESS: 10, PITY_FAILS_FOR_GREAT: 20,
    COMBO_BONUS_PER_STACK: 1, COMBO_BONUS_CAP: 25,
    ACHIEVEMENTS: {
      first_forge: { icon:'🔨', name:'Bước đầu',    desc:'Rèn lần đầu',   gold:50 },
      forge_10:    { icon:'⚒️', name:'Tay nghề',    desc:'Rèn 10 lần',    gold:100 },
      forge_100:   { icon:'🏅', name:'Bậc thầy',    desc:'Rèn 100 lần',   gold:500 },
      enh_5:       { icon:'✨', name:'Tinh luyện',  desc:'Đạt +5',        gold:100 },
      enh_10:      { icon:'🌟', name:'Cao thủ',     desc:'Đạt +10',       gold:500 },
      enh_15:      { icon:'👑', name:'Huyền thoại', desc:'Đạt +15 (VIP)', gold:2000 },
      combo_5:     { icon:'🔥', name:'Chuỗi 5',     desc:'Combo 5',       gold:100 },
      combo_10:    { icon:'💥', name:'Chuỗi 10',    desc:'Combo 10',      gold:300 },
      combo_20:    { icon:'⚡', name:'Bất bại',     desc:'Combo 20',      gold:1000 },
      broke_5:     { icon:'💔', name:'Xui xẻo',     desc:'Gãy 5 lần',     gold:50 },
      sell_10:     { icon:'💰', name:'Thương nhân', desc:'Bán 10 vũ khí', gold:200 },
      reach_vip:   { icon:'🏆', name:'Thần Binh',   desc:'Đạt VIP',       gold:5000 },
    },
    PETS: {
      dragon:  { name:'Rồng Con',     emoji:'🐲', price:2000, desc:'+1% dmg battle / level', buff:'atk' },
      phoenix: { name:'Phượng Hoàng', emoji:'🦅', price:3000, desc:'+2% HP regen / turn',    buff:'regen' },
      wolf:    { name:'Sói Xám',      emoji:'🐺', price:1500, desc:'+1% crit / level',       buff:'crit' },
      turtle:  { name:'Rùa Cổ',       emoji:'🐢', price:1000, desc:'+5% max HP battle',      buff:'hp' },
    },
    SEASON_XP: { forge: 5, forge_great: 15, duel_win: 50, boss_hit: 10, quest_claim: 20, chat: 2, gift: 3 },
  };

  /* ═══════════════════════════════════════════════════════════════
     2. UTILS
     ═══════════════════════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const log = (...a) => console.log('[WF]', ...a);
  const pad2 = n => String(n).padStart(2, '0');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fmtGold = n => (Number(n)||0).toLocaleString('vi-VN');
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const escapeUrl = u => String(u||'').replace(/"/g,'&quot;');

  function toast(msg, type){
    try { window.Toast?.show?.(msg, { type: type || 'info', duration: 2600 }); } catch(_){}
  }
  function getSb(){ return window.__sb || null; }
  function getUser(){
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (u && (u.id || u.username)) return u;
    } catch(_){}
    return null;
  }
  function nowMs(){ return Date.now(); }
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
    if (url) return `<div class="${cls}"><img src="${escapeUrl(url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="ws-av-fb" style="display:none">${ini}</span></div>`;
    return `<div class="${cls}"><span class="ws-av-fb">${ini}</span></div>`;
  }

  let _audioCtx = null;
  function playSound(freq, dur, type){
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_audioCtx) _audioCtx = new Ctx();
      if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(()=>{});
      const o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
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
    else if (outcome === 'great')   { playSound(523,.1); setTimeout(()=>playSound(659,.1),80); setTimeout(()=>playSound(784,.1),160); setTimeout(()=>playSound(1047,.25),240); }
  }
  function vibrate(p){ try { navigator.vibrate?.(p); } catch(_){} }
  function shakeScreen(){
    const page = $('weaponPage'); if (!page) return;
    page.classList.remove('shake'); void page.offsetWidth;
    page.classList.add('shake'); setTimeout(()=>page.classList.remove('shake'), 400);
  }
  function spawnSparks(n){
    const card = $('wfStage'); if (!card) return;
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height*.55;
    for (let i=0; i<(n||10); i++){
      const el = document.createElement('div');
      el.className = 'wf-spark';
      const a = Math.random()*Math.PI*2, d = 40+Math.random()*80;
      el.style.left = cx+'px'; el.style.top = cy+'px';
      el.style.setProperty('--tx', Math.cos(a)*d+'px');
      el.style.setProperty('--ty', Math.sin(a)*d-20+'px');
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 900);
    }
  }
  function numberPop(text, color){
    const el = document.createElement('div');
    el.className = 'wf-number-pop'; el.textContent = text;
    el.style.color = color || '#d97706';
    el.style.left = (window.innerWidth/2)+'px';
    el.style.top = (window.innerHeight/2)+'px';
    el.style.transform = 'translate(-50%, 0)';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1100);
  }

  /* ═══════════════════════════════════════════════════════════════
     3. STATE
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
  let _remoteAvailable = null;
  let _saveTimer = null;
  let _rtChannel = null;
  let _bossRtChannel = null;
  let _bossPollTimer = null;

  const ACTIVE_BATTLE_KEY = '__wf_active_battle_';
  function saveActiveBattleId(userId, matchId){
    try {
      if (!userId) return;
      if (matchId) localStorage.setItem(ACTIVE_BATTLE_KEY + userId, JSON.stringify({ matchId, at: Date.now() }));
      else localStorage.removeItem(ACTIVE_BATTLE_KEY + userId);
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

  function stateKey(uid){ return CFG.LS_PREFIX + (uid||'guest'); }
  function defaultState(){
    return {
      v: 1, gold: CFG.START_GOLD, energy: CFG.ENERGY_MAX,
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
    s.gold = Math.max(0, Number(s.gold)||0);
    s.energy = Math.max(0, Math.min(CFG.ENERGY_MAX, Number(s.energy)||0));
    s.enh = Math.max(0, Math.min(15, Number(s.enh)||0));
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
    try { const raw = localStorage.getItem(stateKey(uid)); return raw ? normalizeState(JSON.parse(raw)) : null; }
    catch(_){ return null; }
  }
  function saveLocal(uid, s){ try { localStorage.setItem(stateKey(uid), JSON.stringify(s)); } catch(_){} }

  /* ═══════════════════════════════════════════════════════════════
     4. REMOTE SYNC
     ═══════════════════════════════════════════════════════════════ */
  async function pullRemote(){
    const sb = getSb();
    if (!sb || typeof sb.rpc !== 'function') return null;
    try {
      const res = await sb.rpc('rpc_weapon_get_state');
      if (res.error){
        if (/does not exist|not found|schema cache/i.test(String(res.error.message||''))) _remoteAvailable = false;
        return null;
      }
      const d = res.data || {};
      if (d.ok !== true){ _remoteAvailable = false; return null; }
      _remoteAvailable = true;
      return { state: normalizeState(d.state || {}), updatedAt: d.updated_at ? new Date(d.updated_at).getTime() : 0 };
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
     5. GAME MATH
     ═══════════════════════════════════════════════════════════════ */
  function tierOf(enh){ return CFG.ENH_TO_TIER[Math.max(0,Math.min(15, enh|0))] || 'B'; }
  function tierInfo(enh){ return CFG.TIERS[tierOf(enh)]; }
  function powerOf(enh){ return Math.round(tierInfo(enh).mult * (enh+1) * 100) / 100; }
  function sellPrice(enh){ return Math.round(powerOf(enh) * 5); }
  function materialForTier(t){
    return { B:'wood', A:'iron', S:'steel', SS:'mythril', SSS:'orichalcum', VIP:'star' }[t] || null;
  }
  function currentMaterialBonus(s){
    const mid = materialForTier(tierOf(s.enh));
    if (!mid || (s.materials[mid]||0) <= 0) return {};
    return CFG.MATERIALS[mid].bonus;
  }
  function applyBonus(r, b){
    if (!b) return;
    Object.keys(b).forEach(k => { r[k] = (r[k]||0) + Number(b[k]||0); });
  }
  function effectiveRates(s){
    const base = Object.assign({}, CFG.BASE_RATES);
    applyBonus(base, CFG.HAMMERS[s.hammer]?.bonus);
    applyBonus(base, currentMaterialBonus(s));
    if (s.combo > 0){
      const c = Math.min(CFG.COMBO_BONUS_CAP, s.combo * CFG.COMBO_BONUS_PER_STACK);
      base.success += c; base.hold = Math.max(0, base.hold - c);
    }
    ['broken','damaged','hold','success','great'].forEach(k => base[k] = Math.max(0, base[k]||0));
    const sum = Object.values(base).reduce((a,b)=>a+b,0);
    if (sum > 0 && Math.abs(sum-100) > 0.5){
      const sc = 100/sum;
      Object.keys(base).forEach(k => base[k] = Math.round(base[k]*sc*10)/10);
    }
    return base;
  }
  function rollOutcome(rates, pityFails){
    if (pityFails >= CFG.PITY_FAILS_FOR_GREAT) return 'great';
    if (pityFails >= CFG.PITY_FAILS_FOR_SUCCESS) return 'success';
    const r = Math.random() * 100;
    let acc = 0;
    for (const k of ['broken','damaged','hold','success','great']){
      acc += rates[k]||0;
      if (r < acc) return k;
    }
    return 'success';
  }
  function applyOutcome(s, outcome){
    const before = s.enh;
    let d = 0, gold = 0;
    if (outcome === 'broken'){ d = before>0 ? -1 : 0; s.total_broken++; s.combo = 0; s.fails++; }
    else if (outcome === 'damaged'){ d = before>0 ? -1 : 0; s.combo = 0; s.fails++; }
    else if (outcome === 'hold'){ d = 0; s.combo = 0; s.fails++; }
    else if (outcome === 'success'){ d = +1; s.combo++; s.fails = 0; s.total_success++; }
    else if (outcome === 'great'){ d = +2; gold = 20; s.combo++; s.fails = 0; s.total_success++; }
    s.enh = Math.max(0, Math.min(15, before + d));
    s.gold += gold;
    s.best_combo = Math.max(s.best_combo, s.combo);
    s.total_forges++;
    const p = powerOf(s.enh);
    if (p > (s.best_power||0)) s.best_power = p;
    return { outcome, deltaEnh: d, goldDelta: gold, prevEnh: before, newEnh: s.enh };
  }
  function consumeMaterial(s){
    const mid = materialForTier(tierOf(s.enh));
    if (!mid || (s.materials[mid]||0) <= 0) return null;
    s.materials[mid]--;
    return mid;
  }
  function regenEnergy(s){
    if (s.energy >= CFG.ENERGY_MAX){ s.last_energy_at = nowMs(); return 0; }
    const el = nowMs() - (s.last_energy_at || nowMs());
    if (el < 0){ s.last_energy_at = nowMs(); return 0; }
    const gained = Math.floor(el / CFG.ENERGY_REGEN_MS);
    if (gained <= 0) return 0;
    const before = s.energy;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + gained);
    s.last_energy_at += gained * CFG.ENERGY_REGEN_MS;
    return s.energy - before;
  }
  function checkAchievements(s){
    const unlocked = [];
    const ck = (k, cond) => {
      if (s.achievements[k] || !cond) return;
      s.achievements[k] = true;
      const a = CFG.ACHIEVEMENTS[k];
      if (a){ s.gold += a.gold; unlocked.push({ key: k, ...a }); }
    };
    ck('first_forge', s.total_forges >= 1);
    ck('forge_10', s.total_forges >= 10);
    ck('forge_100', s.total_forges >= 100);
    ck('enh_5', s.enh >= 5);
    ck('enh_10', s.enh >= 10);
    ck('enh_15', s.enh >= 15);
    ck('combo_5', s.best_combo >= 5);
    ck('combo_10', s.best_combo >= 10);
    ck('combo_20', s.best_combo >= 20);
    ck('broke_5', s.total_broken >= 5);
    ck('sell_10', s.total_sold >= 10);
    ck('reach_vip', tierOf(s.enh) === 'VIP');
    return unlocked;
  }
  function tierBaseEnh(enh){
    const t = tierOf(enh);
    for (let i = 0; i <= 15; i++) if (tierOf(i) === t) return i;
    return 0;
  }
  function nextTierThreshold(enh){
    const t = tierOf(enh);
    const idx = CFG.TIER_ORDER.indexOf(t);
    if (idx < 0 || idx >= CFG.TIER_ORDER.length-1) return 15;
    const nt = CFG.TIER_ORDER[idx+1];
    for (let i = enh+1; i <= 15; i++) if (tierOf(i) === nt) return i;
    return 15;
  }

  /* ═══════════════════════════════════════════════════════════════
     6. PROGRESS HOOKS (Quest + Season)
     ═══════════════════════════════════════════════════════════════ */
  async function questProgress(type, delta){
    if (delta == null) delta = 1;
    if (delta <= 0) return;
    const sb = getSb(); if (!sb) return;
    try {
      await sb.rpc('rpc_wq_update_progress', { p_quest_type: type, p_delta: delta });
    } catch(_){}
  }
  async function seasonAddXP(amount){
    if (!amount || amount <= 0) return;
    const sb = getSb(); if (!sb) return;
    try { await sb.rpc('rpc_ws_add_xp', { p_amount: amount }); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     7. BUILD PAGE
     ═══════════════════════════════════════════════════════════════ */
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
          <div class="wf-pill gold"><span>🪙</span><span id="wfGoldVal">0</span></div>
        </div>
      </header>
      <div class="wf-body" id="wfBody"></div>
      <div class="wf-result" id="wfResult">
        <div class="wf-result-card">
          <div class="wf-result-emoji" id="wfResEmoji">✨</div>
          <div class="wf-result-title" id="wfResTitle">—</div>
          <div class="wf-result-desc" id="wfResDesc">—</div>
          <div class="wf-result-changes" id="wfResChanges"></div>
          <div style="display:flex;gap:8px;">
            <button class="wf-result-btn" id="wfResOk" type="button" style="flex:1;background:rgba(0,0,0,.06);color:#78350f;box-shadow:none;">Đóng</button>
            <button class="wf-result-btn" id="wfResAgain" type="button" style="flex:1.4;">🔨 Rèn tiếp</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(page);
    page.querySelector('#wfBack').addEventListener('click', closePage);
    page.querySelector('#wfResOk').addEventListener('click', closeResult);
    page.querySelector('#wfResult').addEventListener('click', e => {
      if (e.target.id === 'wfResult') closeResult();
    });
    page.querySelector('#wfResAgain').addEventListener('click', () => {
      closeResult();
      setTimeout(() => { if (!S.busy) doForge(); }, 150);
    });
    return page;
  }

  /* ═══════════════════════════════════════════════════════════════
     8. RENDER MAIN
     ═══════════════════════════════════════════════════════════════ */
  const TABS = [
    { key:'forge',     icon:'🔨', label:'Rèn' },
    { key:'market',    icon:'🏪', label:'Chợ' },
    { key:'inventory', icon:'🎒', label:'Kho' },
    { key:'quest',     icon:'📜', label:'Quest',   badge:true },
    { key:'season',    icon:'🎫', label:'Season',  badge:true },
    { key:'pet',       icon:'🐾', label:'Pet' },
    { key:'boss',      icon:'👹', label:'Boss',    badge:true },
    { key:'arena',     icon:'⚔️', label:'Đấu',     badge:true },
    { key:'chat',      icon:'💬', label:'Chat',    badge:true },
    { key:'gift',      icon:'🎁', label:'Tặng' },
  ];

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
    const gained = regenEnergy(S.state);
    if (gained > 0) scheduleSave();
    const gv = $('wfGoldVal');
    if (gv) gv.textContent = fmtGold(S.state.gold);

    let tabsHTML = '<nav class="wf-tabs">';
    TABS.forEach(t => {
      const badge = t.badge ? '<span class="wf-tab-badge" style="display:none"></span>' : '';
      tabsHTML += `<button class="wf-tab ${S.activeTab===t.key?'active':''}" data-tab="${t.key}" type="button">
        <span class="wf-tab-icon">${t.icon}${badge}</span>
        <span class="wf-tab-label">${t.label}</span>
      </button>`;
    });
    tabsHTML += '</nav>';

    let content = '';
    if (S.activeTab === 'forge') content = renderForgeTab();
    else if (S.activeTab === 'market') content = renderMarketTab();
    else if (S.activeTab === 'inventory') content = renderInventoryTab();
    else if (S.activeTab === 'quest') content = renderQuestTab();
    else if (S.activeTab === 'season') content = renderSeasonTab();
    else if (S.activeTab === 'pet') content = renderPetTab();
    else if (S.activeTab === 'boss') content = renderBossTab();
    else if (S.activeTab === 'arena') content = renderArenaTab();
    else if (S.activeTab === 'chat') content = renderChatTab();
    else if (S.activeTab === 'gift') content = renderGiftTab();

    body.innerHTML = tabsHTML + content;

    body.querySelectorAll('.wf-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        S.activeTab = btn.dataset.tab;
        if (S.activeTab === 'chat') SOC.unreadChat = 0;
        updateBadges();
        render();
        const t = S.activeTab;
        if (t === 'arena'){ fetchArena().then(rerenderArena); fetchFeed().then(rerenderFeed); }
        if (t === 'chat'){ fetchChat().then(rerenderChat); scrollChatToBottom(); }
        if (t === 'gift') fetchGiftTargets().then(rerenderGift);
        if (t === 'quest') fetchQuests().then(rerenderQuests);
        if (t === 'season') fetchSeason().then(rerenderSeason);
        if (t === 'pet') fetchPets().then(rerenderPets);
        if (t === 'boss'){ fetchBoss().then(rerenderBoss); startBossPoll(); startBossRealtime(); }
      });
    });

    updateBadges();
    wireActiveTab();
  }

  function wireActiveTab(){
    const body = $('wfBody');
    if (!body) return;
    const t = S.activeTab;
    if (t === 'forge'){ $('wfForgeBtn')?.addEventListener('click', doForge); }
    if (t === 'market'){
      body.querySelectorAll('[data-buy-mat]').forEach(b => b.addEventListener('click', () => doBuyMaterial(b.dataset.buyMat)));
      body.querySelectorAll('[data-buy-hammer]').forEach(b => b.addEventListener('click', () => doBuyHammer(b.dataset.buyHammer)));
      body.querySelectorAll('[data-equip-hammer]').forEach(b => b.addEventListener('click', () => doEquipHammer(b.dataset.equipHammer)));
      $('wfRefillBtn')?.addEventListener('click', doRefillEnergy);
    }
    if (t === 'inventory'){ $('wfSellBtn')?.addEventListener('click', doSell); }
    if (t === 'quest') wireQuest(body);
    if (t === 'season') wireSeason(body);
    if (t === 'pet') wirePet(body);
    if (t === 'boss') wireBoss(body);
    if (t === 'arena') wireArena(body);
    if (t === 'chat') wireChat(body);
    if (t === 'gift') wireGift(body);
  }

  function renderLoginWall(){
    return `<div class="wf-login-wall">
      <div class="wf-login-wall-emoji">⚔️</div>
      <div class="wf-login-wall-title">Cần đăng nhập</div>
      <div class="wf-login-wall-sub">Đăng nhập để rèn vũ khí, làm quest, mùa giải, pet, boss và tương tác với người chơi khác.</div>
      <button class="wf-login-btn" id="wfLoginBtn" type="button">🔐 Đăng nhập</button>
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     9. TAB: FORGE
     ═══════════════════════════════════════════════════════════════ */
  function renderForgeTab(){
    const s = S.state;
    const tier = tierOf(s.enh), ti = CFG.TIERS[tier];
    const power = powerOf(s.enh);
    const prevTierEnh = nextTierThreshold(s.enh);
    const curTierBase = tierBaseEnh(s.enh);
    const tierProgress = prevTierEnh > curTierBase
      ? Math.min(100, ((s.enh - curTierBase) / (prevTierEnh - curTierBase)) * 100) : 100;
    const canForge = s.energy >= CFG.FORGE_ENERGY && s.gold >= CFG.FORGE_GOLD && !S.busy && s.enh < 15;
    const label = s.enh >= 15 ? '🏆 Đã đạt cấp tối đa'
      : s.energy < CFG.FORGE_ENERGY ? '⚡ Hết năng lượng'
      : s.gold < CFG.FORGE_GOLD ? '🪙 Không đủ vàng'
      : '🔨 Rèn vũ khí';
    const mid = materialForTier(tier);
    const mat = mid ? CFG.MATERIALS[mid] : null;
    const matQty = mid ? (s.materials[mid]||0) : 0;
    const energyPct = (s.energy / CFG.ENERGY_MAX) * 100;
    return `
      <div class="wf-energy-wrap">
        <span class="wf-energy-label">⚡</span>
        <div class="wf-energy-track"><div class="wf-energy-fill" style="width:${energyPct}%"></div></div>
        <span class="wf-energy-num">${s.energy}/${CFG.ENERGY_MAX}</span>
      </div>
      <div class="wf-stage" id="wfStage">
        <div class="wf-hammer" id="wfHammer">${CFG.HAMMERS[s.hammer].emoji}</div>
        <div class="wf-weapon-wrap">
          <div class="wf-weapon" id="wfWeaponEmoji">${ti.emoji}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="wf-tier-badge tier-${tier}">${tier}</span>
            <span class="wf-enh-badge">+<b>${s.enh}</b></span>
          </div>
          <div class="wf-weapon-name">${esc(ti.name)}</div>
          <div class="wf-progress"><div class="wf-progress-fill" style="width:${tierProgress}%"></div></div>
          <div class="wf-progress-label">${s.enh>=15?'MAX':`${s.enh} / ${prevTierEnh}`}</div>
        </div>
      </div>
      <div class="wf-stats">
        <div class="wf-stat combo"><div class="wf-stat-value ${s.combo>=5?'hot':''}">${s.combo}</div><div class="wf-stat-label">🔥 Combo</div></div>
        <div class="wf-stat"><div class="wf-stat-value">${Math.round(power*100)/100}</div><div class="wf-stat-label">⚡ Power</div></div>
        <div class="wf-stat"><div class="wf-stat-value ${s.fails>5?'neg':''}">${s.fails}</div><div class="wf-stat-label">🎯 Pity</div></div>
      </div>
      <button class="wf-forge-btn" id="wfForgeBtn" type="button" ${canForge?'':'disabled'}>
        <span>${label}</span>
        <span class="wf-cost-tag">🪙${CFG.FORGE_GOLD} · ⚡${CFG.FORGE_ENERGY}${mat?` · ${mat.emoji}${matQty}`:''}</span>
      </button>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     10. TAB: MARKET
     ═══════════════════════════════════════════════════════════════ */
  function describeBonus(b){
    if (!b || !Object.keys(b).length) return '<span style="opacity:.6">không bonus</span>';
    const labels = { broken:'gãy', damaged:'hư', hold:'giữ', success:'✓', great:'✨' };
    return Object.keys(b).map(k => {
      const v = b[k], sign = v>0?'+':'';
      return `<span style="color:${v>=0?'#15803d':'#b91c1c'};font-weight:900">${labels[k]||k} ${sign}${v}%</span>`;
    }).join(' · ');
  }
  function renderMarketTab(){
    const s = S.state;
    const neededMat = materialForTier(tierOf(s.enh));
    let html = '<div class="wf-section"><div class="wf-section-title">🔨 Búa</div>';
    Object.keys(CFG.HAMMERS).forEach(id => {
      const h = CFG.HAMMERS[id];
      const owned = s.hammers.includes(id);
      const equipped = s.hammer === id;
      const btn = equipped
        ? `<button class="wf-card-btn equipped" type="button" disabled>Đang dùng</button>`
        : owned
          ? `<button class="wf-card-btn" data-equip-hammer="${id}" type="button">Trang bị</button>`
          : `<button class="wf-card-btn buy" data-buy-hammer="${id}" type="button" ${s.gold>=h.price?'':'disabled'}>🪙${fmtGold(h.price)}</button>`;
      html += `<div class="wf-card ${equipped?'equipped':''}">
        <div class="wf-card-icon">${h.emoji}</div>
        <div class="wf-card-body">
          <div class="wf-card-name">${esc(h.name)}</div>
          <div class="wf-card-meta"><span class="wf-rarity-badge ${h.rarity}">${h.rarity}</span>${describeBonus(h.bonus)}</div>
        </div>${btn}</div>`;
    });
    html += '</div><div class="wf-section"><div class="wf-section-title">💎 Vật liệu</div>';
    Object.keys(CFG.MATERIALS).forEach(id => {
      const m = CFG.MATERIALS[id];
      const qty = s.materials[id]||0;
      const needed = id === neededMat;
      html += `<div class="wf-card">
        <div class="wf-card-icon">${m.emoji}</div>
        <div class="wf-card-body">
          <div class="wf-card-name">${esc(m.name)}${needed?' <span style="color:#dc2626;font-size:10px">· cần</span>':''}</div>
          <div class="wf-card-meta"><span class="wf-qty">Có: <b>${qty}</b></span>${describeBonus(m.bonus)}</div>
        </div>
        <button class="wf-card-btn buy" data-buy-mat="${id}" type="button" ${s.gold>=m.price?'':'disabled'}>🪙${fmtGold(m.price)}</button>
      </div>`;
    });
    html += '</div><div class="wf-section"><div class="wf-section-title">⚡ Năng lượng</div>' +
      `<div class="wf-card"><div class="wf-card-icon">⚡</div><div class="wf-card-body">
        <div class="wf-card-name">Nạp +${CFG.REFILL_AMOUNT}</div>
        <div class="wf-card-meta">${s.energy}/${CFG.ENERGY_MAX} · +1/6 phút</div>
      </div><button class="wf-card-btn buy" id="wfRefillBtn" type="button" ${s.gold>=CFG.REFILL_COST_GOLD && s.energy<CFG.ENERGY_MAX?'':'disabled'}>🪙${CFG.REFILL_COST_GOLD}</button></div></div>`;
    return html;
  }

  /* ═══════════════════════════════════════════════════════════════
     11. TAB: INVENTORY
     ═══════════════════════════════════════════════════════════════ */
  function renderInventoryTab(){
    const s = S.state;
    const tier = tierOf(s.enh), ti = CFG.TIERS[tier];
    const power = powerOf(s.enh), price = sellPrice(s.enh);
    let ach = '<div class="wf-section"><div class="wf-section-title">🏅 Thành tựu</div><div class="wf-achievements">';
    Object.keys(CFG.ACHIEVEMENTS).forEach(k => {
      const a = CFG.ACHIEVEMENTS[k];
      const un = !!s.achievements[k];
      ach += `<div class="wf-ach ${un?'unlocked':''}">
        <div class="wf-ach-icon">${a.icon}</div>
        <div><div class="wf-ach-name">${esc(a.name)}</div><div class="wf-ach-desc">${esc(a.desc)}</div></div>
        <div class="wf-ach-reward">${un?'✓':`🪙${a.gold}`}</div>
      </div>`;
    });
    ach += '</div></div>';
    return `
      <div class="wf-inventory-hero">
        <div class="wf-inv-weapon">${ti.emoji}</div>
        <div class="wf-inv-name">${esc(ti.name)} +${s.enh}</div>
        <div class="wf-inv-power">⚡ ${Math.round(power*100)/100}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button class="wf-card-btn buy" id="wfSellBtn" type="button" ${s.enh>0?'':'disabled'}>💰 Bán (${fmtGold(price)}🪙)</button>
        </div>
        <div style="font-size:11px;color:#a06a28;font-weight:700;margin-top:10px;line-height:1.4;">Bán reset về +0, nhận vàng theo power.</div>
      </div>${ach}`;
  }

  /* ═══════════════════════════════════════════════════════════════
     12. TAB: QUEST
     ═══════════════════════════════════════════════════════════════ */
  function renderQuestTab(){
    if (!SOC.quests) return '<div class="wf-history-empty">Đang tải quest…</div>';
    if (!SOC.quests.length) return '<div class="wf-history-empty">Không có quest hôm nay</div>';
    const icons = { forge:'🔨', duel_win:'⚔️', chat:'💬', gift:'🎁', sell:'💰', enh_reach:'⬆️', boss_hit:'👹' };
    const names = {
      forge:'Rèn vũ khí', duel_win:'Thắng đấu trường', chat:'Chat',
      gift:'Tặng vàng', sell:'Bán vũ khí', enh_reach:'Đạt cấp X', boss_hit:'Đánh boss',
    };
    return `<div class="wf-section-title">📜 Nhiệm vụ hôm nay · Reset 0h</div>` +
      SOC.quests.map(q => {
        const data = q.quest_data || {};
        const type = (data.type || q.quest_key.split('_')[0]);
        const icon = icons[type] || '📜';
        const name = names[type] || q.quest_key;
        const progress = q.progress || 0;
        const target = q.target || 1;
        const pct = Math.min(100, (progress/target)*100);
        const done = progress >= target && !q.claimed;
        const claimed = !!q.claimed;
        const cls = claimed ? 'claimed' : done ? 'done' : '';
        const gold = data.gold || 0;
        const mat = data.mat ? CFG.MATERIALS[data.mat] : null;
        return `
          <div class="ws-quest-card ${cls}">
            <div class="ws-quest-icon">${icon}</div>
            <div class="ws-quest-body">
              <div class="ws-quest-top">
                <div class="ws-quest-name">${esc(name)} ${target > 1 ? `(${target} lần)` : ''}</div>
                <div class="ws-quest-reward">🪙${gold}${mat ? ' + '+mat.emoji : ''}</div>
              </div>
              <div class="ws-quest-progress-bar"><div class="ws-quest-progress-fill" style="width:${pct}%"></div></div>
              <div class="ws-quest-progress-text">${progress} / ${target}</div>
              ${claimed
                ? `<button class="ws-quest-claim" disabled>✓ Đã nhận</button>`
                : done
                  ? `<button class="ws-quest-claim" data-quest-id="${q.id}" type="button">🎁 Nhận thưởng</button>`
                  : `<button class="ws-quest-claim" disabled>Chưa hoàn thành</button>`}
            </div>
          </div>`;
      }).join('');
  }
  function wireQuest(body){
    body.querySelectorAll('[data-quest-id]').forEach(btn => {
      btn.addEventListener('click', () => doQuestClaim(btn.dataset.questId, btn));
    });
  }
  function rerenderQuests(){
    if (S.activeTab !== 'quest') return;
    const body = $('wfBody');
    if (body) render();
  }
  async function doQuestClaim(questId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wq_claim', { p_quest_id: Number(questId) });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`🎁 +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
      // Reload state + quests
      const r = await pullRemote();
      if (r && r.state){ S.state = r.state; saveLocal(S.user.id, S.state); }
      await fetchQuests();
      await seasonAddXP(CFG.SEASON_XP.quest_claim);
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     13. TAB: SEASON
     ═══════════════════════════════════════════════════════════════ */
  function seasonTierReward(tier, premium){
    const gold = (50 + tier * 20) * (premium ? 2 : 1);
    let mat = 'wood';
    if (tier >= 20) mat = 'steel';
    else if (tier >= 10) mat = 'iron';
    return { gold, mat };
  }
  function renderSeasonTab(){
    if (!SOC.season) return '<div class="wf-history-empty">Không có season đang hoạt động</div>';
    const season = SOC.season;
    const prog = SOC.seasonProgress || { xp:0, tier:0, premium:false, claimed_tiers:[], claimed_premium_tiers:[] };
    const curTier = prog.tier || 0;
    const xpInTier = prog.xp % CFG.SEASON_XP_PER_TIER;
    const xpPct = (xpInTier / CFG.SEASON_XP_PER_TIER) * 100;
    const claimedFree = new Set(Array.isArray(prog.claimed_tiers) ? prog.claimed_tiers : []);
    const claimedPrem = new Set(Array.isArray(prog.claimed_premium_tiers) ? prog.claimed_premium_tiers : []);

    let tiers = '';
    for (let t = 1; t <= CFG.SEASON_MAX_TIER; t++){
      const unlocked = curTier >= t;
      const cFree = claimedFree.has(t);
      const cPrem = claimedPrem.has(t);
      const premUnlocked = unlocked && prog.premium;
      const freeR = seasonTierReward(t, false);
      const premR = seasonTierReward(t, true);
      const icon = t % 5 === 0 ? '🏆' : t % 3 === 0 ? '⭐' : '🎁';
      tiers += `
        <div class="ws-season-tier ${unlocked?'unlocked':''} ${cFree?'claimed':''}">
          <div class="ws-season-tier-num-small">Tier ${t}</div>
          <div class="ws-season-tier-icon">${icon}</div>
          <div class="ws-season-tier-reward">🪙${freeR.gold}<br>${CFG.MATERIALS[freeR.mat].emoji}</div>
          ${unlocked
            ? (cFree
              ? `<button class="ws-season-tier-btn" disabled>✓</button>`
              : `<button class="ws-season-tier-btn" data-season-claim="${t}" data-premium="0" type="button">Nhận</button>`)
            : `<div class="ws-season-lock">🔒</div>`}
        </div>
        <div class="ws-season-tier premium ${premUnlocked?'unlocked':''} ${cPrem?'claimed':''}">
          <div class="ws-season-tier-num-small">Premium ${t}</div>
          <div class="ws-season-tier-icon">💎</div>
          <div class="ws-season-tier-reward">🪙${premR.gold}<br>${CFG.MATERIALS[premR.mat].emoji}</div>
          ${premUnlocked
            ? (cPrem
              ? `<button class="ws-season-tier-btn" disabled>✓</button>`
              : `<button class="ws-season-tier-btn" data-season-claim="${t}" data-premium="1" type="button">Nhận</button>`)
            : `<div class="ws-season-lock">🔒</div>`}
        </div>`;
    }

    return `
      <div class="ws-season-header">
        <div class="ws-season-name">🎫 ${esc(season.name)}</div>
        <div class="ws-season-tier-num">${curTier}<small>/ ${CFG.SEASON_MAX_TIER}</small></div>
        <div class="ws-season-xp-bar"><div class="ws-season-xp-fill" style="width:${xpPct}%"></div></div>
        <div class="ws-season-xp-text">${xpInTier} / ${CFG.SEASON_XP_PER_TIER} XP đến tier ${Math.min(CFG.SEASON_MAX_TIER, curTier+1)}</div>
      </div>
      <div class="wf-section-title">🎁 Phần thưởng 30 tier</div>
      <div class="ws-season-track">${tiers}</div>
      <div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:8px;">Premium: ×2 thưởng + vật liệu cao cấp</div>
    `;
  }
  function wireSeason(body){
    body.querySelectorAll('[data-season-claim]').forEach(btn => {
      btn.addEventListener('click', () => doSeasonClaim(Number(btn.dataset.seasonClaim), btn.dataset.premium === '1', btn));
    });
  }
  function rerenderSeason(){
    if (S.activeTab !== 'season') return;
    render();
  }
  async function doSeasonClaim(tier, premium, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_ws_claim_tier', { p_tier: tier, p_premium: premium });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`🎁 Tier ${tier} · +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
      const r = await pullRemote();
      if (r && r.state){ S.state = r.state; saveLocal(S.user.id, S.state); }
      await fetchSeason();
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     14. TAB: PET
     ═══════════════════════════════════════════════════════════════ */
  function renderPetTab(){
    const owned = new Map(SOC.pets.map(p => [p.pet_key, p]));
    let grid = '<div class="ws-pet-grid">';
    Object.keys(CFG.PETS).forEach(key => {
      const cfg = CFG.PETS[key];
      const p = owned.get(key);
      if (p){
        const xpInLevel = p.xp % CFG.PET_XP_PER_LEVEL;
        const xpPct = (xpInLevel / CFG.PET_XP_PER_LEVEL) * 100;
        const isMax = p.level >= CFG.PET_MAX_LEVEL;
        grid += `
          <div class="ws-pet-card ${p.active?'active':''}">
            ${p.active ? '<div class="ws-pet-active-badge">★ ĐANG DÙNG</div>' : ''}
            <div class="ws-pet-emoji">${cfg.emoji}</div>
            <div class="ws-pet-name">${esc(cfg.name)}</div>
            <div class="ws-pet-level">Lv ${p.level}/${CFG.PET_MAX_LEVEL}${isMax?' · MAX':''}</div>
            <div class="ws-pet-xp"><div class="ws-pet-xp-fill" style="width:${isMax?100:xpPct}%"></div></div>
            <div class="ws-pet-desc">${esc(cfg.desc)}</div>
            <div class="ws-pet-actions">
              ${p.active
                ? `<button class="ws-pet-btn" disabled>Đang dùng</button>`
                : `<button class="ws-pet-btn green" data-pet-active="${p.id}" type="button">Dùng</button>`}
              ${isMax
                ? `<button class="ws-pet-btn" disabled>MAX</button>`
                : `<button class="ws-pet-btn" data-pet-feed="${p.id}" type="button">Cho ăn</button>`}
            </div>
          </div>`;
      } else {
        grid += `
          <div class="ws-pet-card locked">
            <div class="ws-pet-emoji">${cfg.emoji}</div>
            <div class="ws-pet-name">${esc(cfg.name)}</div>
            <div class="ws-pet-level">Chưa sở hữu</div>
            <div class="ws-pet-xp"></div>
            <div class="ws-pet-desc">${esc(cfg.desc)}</div>
            <div class="ws-pet-actions">
              <button class="ws-pet-btn" data-pet-adopt="${key}" type="button" ${S.state.gold >= (cfg.price||0) ? '' : 'disabled'}>🪙${fmtGold(cfg.price||0)}</button>
            </div>
          </div>`;
      }
    });
    grid += '</div>';
    return `<div class="wf-section-title">🐾 Thú cưng chiến đấu</div>` + grid +
      `<div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:12px;">Cho ăn = 1 vàng → 1 XP · MAX Lv ${CFG.PET_MAX_LEVEL}</div>`;
  }
  function wirePet(body){
    body.querySelectorAll('[data-pet-adopt]').forEach(btn => {
      btn.addEventListener('click', () => doPetAdopt(btn.dataset.petAdopt, btn));
    });
    body.querySelectorAll('[data-pet-active]').forEach(btn => {
      btn.addEventListener('click', () => doPetSetActive(Number(btn.dataset.petActive), btn));
    });
    body.querySelectorAll('[data-pet-feed]').forEach(btn => {
      btn.addEventListener('click', () => openPetFeedModal(Number(btn.dataset.petFeed)));
    });
  }
  function rerenderPets(){
    if (S.activeTab !== 'pet') return;
    render();
  }
  async function doPetAdopt(petKey, btn){
    const cfg = CFG.PETS[petKey];
    if (!cfg){ return; }
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const myGold = S.state.gold;
      if (myGold < cfg.price){ toast('Không đủ vàng', 'warning'); btn.disabled = false; return; }
      // Trừ vàng local
      S.state.gold -= cfg.price;
      saveLocal(S.user.id, S.state);
      await pushRemote(S.state);
      const res = await sb.rpc('rpc_wp_adopt', { p_pet_key: petKey });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`🐾 Nhận nuôi ${cfg.name}!`, 'success');
      playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
      await fetchPets();
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }
  async function doPetSetActive(petId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wp_set_active', { p_pet_id: petId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`★ Đã chọn ${CFG.PETS[d.pet_key]?.name || 'pet'}`, 'success');
      await fetchPets();
      render();
    } catch(e){
      toast('Lỗi', 'error');
      if (btn) btn.disabled = false;
    }
  }
  function openPetFeedModal(petId){
    const p = SOC.pets.find(x => x.id === petId);
    if (!p) return;
    removeModal('wsPetFeedModal');
    const myGold = S.state.gold;
    const cfg = CFG.PETS[p.pet_key];
    const maxFeed = Math.min(myGold, (CFG.PET_MAX_LEVEL - p.level) * CFG.PET_XP_PER_LEVEL - (p.xp % CFG.PET_XP_PER_LEVEL));
    if (maxFeed < 10){ toast('Không đủ vàng hoặc đã MAX', 'warning'); return; }
    const modal = document.createElement('div');
    modal.id = 'wsPetFeedModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">${cfg.emoji} Cho ăn</div>
        <div class="ws-modal-sub">Cho <b>${esc(cfg.name)}</b> ăn · 1 vàng = 1 XP<br>Lv ${p.level}/${CFG.PET_MAX_LEVEL} · Bạn có ${fmtGold(myGold)}🪙</div>
        <label class="ws-modal-label">Số vàng (10-${maxFeed})</label>
        <input class="ws-modal-input" id="wsFeedInput" type="number" min="10" max="${maxFeed}" value="${Math.min(100, maxFeed)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-feed="50">50</button>
          <button type="button" data-feed="100">100</button>
          <button type="button" data-feed="500">500</button>
          <button type="button" data-feed="${maxFeed}">MAX</button>
        </div>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsFeedConfirm" type="button">Cho ăn</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-feed]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsFeedInput');
        if (inp) inp.value = b.dataset.feed;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsFeedConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsFeedInput');
      const amount = parseInt(inp.value, 10);
      if (!amount || amount < 10 || amount > maxFeed){ toast('Số vàng không hợp lệ', 'warning'); return; }
      const btn = modal.querySelector('#wsFeedConfirm');
      btn.disabled = true; btn.textContent = 'Đang cho ăn…';
      const sb = getSb(); if (!sb) return;
      try {
        const res = await sb.rpc('rpc_wp_feed', { p_pet_id: petId, p_gold: amount });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        S.state.gold = Math.max(0, S.state.gold - amount);
        saveLocal(S.user.id, S.state);
        toast(`🍖 ${cfg.name} → Lv ${d.level}`, 'success');
        playSound(880, .1);
        modal.remove();
        await fetchPets();
        render();
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không cho ăn được'), 'error');
        btn.disabled = false; btn.textContent = 'Cho ăn';
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     15. TAB: BOSS
     ═══════════════════════════════════════════════════════════════ */
  function renderBossTab(){
    if (!SOC.boss){
      return `<div class="wf-history-empty">Đang tìm boss…<br><button class="ws-btn primary" id="wsBossSpawn" type="button" style="margin-top:12px;">👹 Triệu hồi boss</button></div>`;
    }
    const b = SOC.boss;
    const my = SOC.bossMy || { damage:0, attempts:0, claimed:false, rank:0 };
    const hpPct = Math.max(0, Math.min(100, (b.current_hp / b.max_hp) * 100));
    const defeated = b.status === 'defeated';
    const emoji = { dragon:'🐉', titan:'👹', demon:'😈' }[b.boss_key] || '👹';
    return `
      <div class="ws-boss-card ${defeated?'defeated':''}">
        <div class="ws-boss-top">
          <div class="ws-boss-emoji">${emoji}</div>
          <div class="ws-boss-info">
            <div class="ws-boss-name">${esc(b.boss_name)}</div>
            <div class="ws-boss-level">Lv ${b.level} · ${defeated?'ĐÃ BỊ ĐÁNH BẠI':'Đang hoạt động'}</div>
          </div>
        </div>
        <div class="ws-boss-hp-bar">
          <div class="ws-boss-hp-fill" style="width:${hpPct}%"></div>
        </div>
        <div class="ws-boss-hp-text">${fmtGold(b.current_hp)} / ${fmtGold(b.max_hp)} HP</div>
        <div class="ws-boss-actions">
          ${defeated
            ? (my.claimed
              ? `<button class="ws-boss-btn" disabled>✓ Đã nhận thưởng</button>`
              : my.damage > 0
                ? `<button class="ws-boss-btn green" id="wsBossClaim" data-boss-id="${b.id}" type="button">🎁 Nhận thưởng</button>`
                : `<button class="ws-boss-btn" disabled>Không tham gia</button>`)
            : `<button class="ws-boss-btn" id="wsBossAttack" type="button">⚔️ Đánh boss</button>`}
        </div>
        <div class="ws-boss-stats">
          <div class="ws-boss-stat"><div class="ws-boss-stat-label">Damage</div><div class="ws-boss-stat-value">${fmtGold(my.damage)}</div></div>
          <div class="ws-boss-stat"><div class="ws-boss-stat-label">Rank</div><div class="ws-boss-stat-value">${my.rank > 0 ? '#'+my.rank : '—'}</div></div>
          <div class="ws-boss-stat"><div class="ws-boss-stat-label">Tham gia</div><div class="ws-boss-stat-value pos">${SOC.bossTotal}</div></div>
        </div>
      </div>
      ${!defeated ? `<div class="wf-section-title">💡 Cách chơi</div>
        <div style="padding:12px;background:rgba(255,255,255,.7);border:1px solid rgba(220,180,100,.3);border-radius:12px;font-size:12px;font-weight:700;color:#78350f;line-height:1.5;">
          • Đánh boss với damage = <b>power × 15</b> (max)<br>
          • Cooldown 10s giữa các đòn<br>
          • Boss có 6h để bị đánh bại<br>
          • Top 1 = 2000🪙 + Mythril, Top 2-3 = 1000🪙 + Thép, Top 4-10 = 500🪙
        </div>` : ''}
    `;
  }
  function wireBoss(body){
    body.querySelectorAll('#wsBossAttack').forEach(b => b.addEventListener('click', () => doBossAttack(b)));
    body.querySelectorAll('#wsBossClaim').forEach(b => b.addEventListener('click', () => doBossClaim(b.dataset.bossId, b)));
    body.querySelectorAll('#wsBossSpawn').forEach(b => b.addEventListener('click', () => doBossSpawn(b)));
  }
  function rerenderBoss(){
    if (S.activeTab !== 'boss') return;
    render();
  }
  async function doBossAttack(btn){
    if (S.bossAttacking) return;
    if (!SOC.boss || SOC.boss.status !== 'active'){ toast('Boss đã chết', 'warning'); return; }
    if (btn) btn.disabled = true;
    S.bossAttacking = true;
    const sb = getSb(); if (!sb) return;
    try {
      const myPower = powerOf(S.state.enh);
      const baseDmg = Math.floor(myPower * 15);
      const variance = 0.9 + Math.random() * 0.2;
      const dmg = Math.max(100, Math.floor(baseDmg * variance));
      const res = await sb.rpc('rpc_wb_attack', { p_damage: dmg });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`⚔️ -${fmtGold(d.damage)} HP${d.defeated?' · BOSS CHẾT!':''}`, d.defeated ? 'success' : 'info');
      numberPop(`-${fmtGold(d.damage)} HP`, '#ef4444');
      if (d.defeated){
        playSound(523,.1); setTimeout(()=>playSound(659,.1),80); setTimeout(()=>playSound(784,.1),160); setTimeout(()=>playSound(1047,.25),240);
        vibrate([30,30,30,30,60]);
      } else {
        playSound(400,.1);
        vibrate(20);
      }
      await seasonAddXP(CFG.SEASON_XP.boss_hit);
      await questProgress('boss_hit', 1);
      await fetchBoss();
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không đánh được'), 'error');
      if (btn) btn.disabled = false;
    } finally {
      S.bossAttacking = false;
    }
  }
  async function doBossClaim(bossId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wb_claim_reward', { p_boss_id: bossId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast(`🎁 #${d.rank} · +${d.gold}🪙${d.mat ? ' +1 '+d.mat : ''}`, 'success');
      playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
      const r = await pullRemote();
      if (r && r.state){ S.state = r.state; saveLocal(S.user.id, S.state); }
      await fetchBoss();
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không nhận được'), 'error');
      if (btn) btn.disabled = false;
    }
  }
  async function doBossSpawn(btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_wb_spawn_boss');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      toast('👹 Boss xuất hiện!', 'success');
      await fetchBoss();
      render();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không triệu hồi được'), 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     16. TAB: ARENA
     ═══════════════════════════════════════════════════════════════ */
  function renderArenaTab(){
    if (!SOC.arena) return '<div class="wf-history-empty">Đang tải đấu trường…</div>';
    const d = SOC.arena;
    return `
      <div class="ws-stats-card">
        <div class="ws-stat-cell"><div class="ws-stat-label">ELO</div><div class="ws-stat-value gold">${d.stats.elo}</div></div>
        <div class="ws-stat-cell"><div class="ws-stat-label">Thắng</div><div class="ws-stat-value pos">${d.stats.wins}</div></div>
        <div class="ws-stat-cell"><div class="ws-stat-label">Thua</div><div class="ws-stat-value neg">${d.stats.losses}</div></div>
        <div class="ws-stat-cell"><div class="ws-stat-label">Tổng thắng</div><div class="ws-stat-value">${fmtGold(d.stats.total_won)}🪙</div></div>
      </div>
      <div class="ws-subtabs">
        <button class="ws-subtab ${S.arenaSubTab==='incoming'?'active':''}" data-ws-sub="incoming" type="button">⚔️ Lời mời${d.incoming.length?' <span class="ws-subtab-count">'+d.incoming.length+'</span>':''}</button>
        <button class="ws-subtab ${S.arenaSubTab==='players'?'active':''}" data-ws-sub="players" type="button">👥 Đấu thủ</button>
        <button class="ws-subtab ${S.arenaSubTab==='active'?'active':''}" data-ws-sub="active" type="button">🔥 Đang đấu</button>
        <button class="ws-subtab ${S.arenaSubTab==='history'?'active':''}" data-ws-sub="history" type="button">📜 Lịch sử</button>
      </div>
      <div id="wsArenaContent">${renderArenaContent(d)}</div>
      <div class="wf-section-title" style="margin-top:20px;">📡 Hoạt động</div>
      <div class="ws-feed" id="wsFeedList">${renderFeedList()}</div>
    `;
  }
  function renderArenaContent(d){
    if (S.arenaSubTab === 'incoming'){
      if (!d.incoming.length) return '<div class="wf-history-empty">Không có lời thách đấu</div>';
      return d.incoming.map(m => `
        <div class="ws-challenge-card">
          ${renderAvatarHtml(m.opponent_name, 'ws-cc-avatar')}
          <div class="ws-cc-body">
            <div class="ws-cc-name">${esc(m.opponent_name)}</div>
            <div class="ws-cc-meta">⚡ ${Math.round(m.opponent_power)} · Cược <b>${fmtGold(m.wager)}🪙</b></div>
          </div>
          <div class="ws-cc-actions">
            <button class="ws-btn small reject" data-ws-reject="${m.id}" type="button">Từ chối</button>
            <button class="ws-btn small accept" data-ws-accept="${m.id}" type="button">Nhận</button>
          </div>
        </div>`).join('');
    }
    if (S.arenaSubTab === 'players'){
      if (!d.players.length) return '<div class="wf-history-empty">Chưa có ai</div>';
      return d.players.map(p => `
        <div class="ws-player-row">
          ${renderAvatarHtml(p.display_name, 'ws-pr-avatar')}
          <div class="ws-pr-body">
            <div class="ws-pr-name">${esc(p.display_name)}</div>
            <div class="ws-pr-meta">ELO ${p.elo} · ${p.wins}W/${p.losses}L</div>
          </div>
          <button class="ws-btn small primary" data-ws-challenge="${p.user_id}" data-ws-name="${esc(p.display_name)}" type="button">Thách</button>
        </div>`).join('');
    }
    if (S.arenaSubTab === 'active'){
      const b = S.activeBattleData;
      if (!b) return '<div class="wf-history-empty">Không có trận đang đấu</div>';
      const oppName = b.is_challenger ? b.opponent_name : b.challenger_name;
      return `<div class="ws-battle-list-item">
        ${renderAvatarHtml(oppName, 'ws-cc-avatar')}
        <div class="ws-cc-body">
          <div class="ws-cc-name">vs ${esc(oppName)}</div>
          <div class="ws-cc-meta">Đang đấu · Cược ${fmtGold(b.wager)}🪙 · Turn ${b.turn_number}</div>
        </div>
        <button class="ws-btn small primary" data-ws-rejoin="${b.id}" type="button">Vào</button>
      </div>`;
    }
    if (S.arenaSubTab === 'history'){
      if (!d.history.length) return '<div class="wf-history-empty">Chưa có trận nào</div>';
      const meId = S.user?.id;
      return d.history.map(h => {
        const other = h.challenger_id === meId ? h.opponent_name : h.challenger_name;
        const iWon = h.i_won;
        const badge = h.status === 'expired' ? '⏱️ Hết hạn'
          : h.status === 'rejected' ? '✕ Từ chối'
          : iWon ? '🏆 Thắng' : '💔 Thua';
        const cls = iWon ? 'won' : h.status === 'resolved' ? 'lost' : '';
        return `<div class="ws-history-row ${cls}">
          <div class="ws-hr-badge">${badge}</div>
          <div class="ws-hr-body">
            <div class="ws-hr-name">vs ${esc(other)}</div>
            <div class="ws-hr-meta">Cược ${fmtGold(h.wager)}🪙 · ${fmtTime(h.resolved_at||h.created_at)}</div>
          </div>
        </div>`;
      }).join('');
    }
    return '';
  }
  function renderFeedList(){
    if (!SOC.feed.length) return '<div class="wf-history-empty">Chưa có hoạt động</div>';
    return SOC.feed.slice(0, 20).map(f => {
      const icon = f.type === 'duel_win' ? '⚔️' : f.type === 'gift_sent' ? '🎁' : f.type === 'gift_received' ? '🎁' : '✨';
      return `<div class="ws-feed-item">
        <span class="ws-fi-icon">${icon}</span>
        <span class="ws-fi-text"><b>${esc(f.display_name||'Ai đó')}</b> ${esc(f.message)}</span>
        <span class="ws-fi-time">${fmtTime(f.created_at)}</span>
      </div>`;
    }).join('');
  }
  function wireArena(body){
    body.querySelectorAll('.ws-subtab').forEach(b => {
      b.addEventListener('click', async () => {
        S.arenaSubTab = b.dataset.wsSub;
        if (S.arenaSubTab === 'active') S.activeBattleData = await fetchActiveBattle();
        render();
      });
    });
    const content = $('wsArenaContent');
    if (content){
      content.querySelectorAll('[data-ws-accept]').forEach(b => b.addEventListener('click', () => acceptDuel(b.dataset.wsAccept, b)));
      content.querySelectorAll('[data-ws-reject]').forEach(b => b.addEventListener('click', () => rejectDuel(b.dataset.wsReject, b)));
      content.querySelectorAll('[data-ws-challenge]').forEach(b => b.addEventListener('click', () => openChallengeModal(b.dataset.wsChallenge, b.dataset.wsName)));
      content.querySelectorAll('[data-ws-rejoin]').forEach(b => b.addEventListener('click', () => openBattle(b.dataset.wsRejoin)));
    }
  }
  function rerenderArena(){
    if (S.activeTab !== 'arena') return;
    const content = $('wsArenaContent');
    if (content && SOC.arena){
      content.innerHTML = renderArenaContent(SOC.arena);
      wireArena($('wfBody'));
    }
    const feed = $('wsFeedList');
    if (feed) feed.innerHTML = renderFeedList();
  }
  function rerenderFeed(){
    const feed = $('wsFeedList');
    if (feed) feed.innerHTML = renderFeedList();
  }
  async function fetchActiveBattle(){
    const me = S.user; if (!me) return null;
    const matchId = S.currentBattleId || getActiveBattleId(me.id);
    if (!matchId) return null;
    const sb = getSb(); if (!sb) return null;
    try {
      const res = await sb.rpc('rpc_weapon_battle_state', { p_match_id: matchId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok){ saveActiveBattleId(me.id, null); return null; }
      if (d.status === 'fighting') return d;
      saveActiveBattleId(me.id, null);
      return null;
    } catch(_){ return null; }
  }

  /* ═══════════════════════════════════════════════════════════════
     17. TAB: CHAT
     ═══════════════════════════════════════════════════════════════ */
  function renderChatTab(){
    const me = S.user?.id;
    let msgs = '';
    if (!SOC.chat.length){
      msgs = '<div class="wf-history-empty">Chưa có tin nhắn — hãy là người đầu tiên!</div>';
    } else {
      msgs = SOC.chat.map(m => renderChatMsg(m, me)).join('');
    }
    return `
      <div class="ws-chat-wrap">
        <div class="ws-chat-list" id="wsChatList">${msgs}</div>
        <div class="ws-chat-cooldown" id="wsChatCd"></div>
        <div class="ws-chat-input-bar">
          <input class="ws-chat-input" id="wsChatInput" type="text" maxlength="${CFG.CHAT_MAX_LEN}" placeholder="Nhắn gì đó..." autocomplete="off">
          <button class="ws-chat-send" id="wsChatSend" type="button">Gửi</button>
        </div>
      </div>
    `;
  }
  function renderChatMsg(m, meId){
    const isMe = m.user_id === meId;
    return `<div class="ws-chat-msg ${isMe?'me':''}">
      ${renderAvatarHtml(m.display_name, 'ws-chat-av')}
      <div class="ws-chat-bubble-wrap">
        <div class="ws-chat-name">${esc(m.display_name||'Ai đó')}</div>
        <div class="ws-chat-bubble">${esc(m.message)}</div>
        <div class="ws-chat-time">${fmtTime(m.created_at)}</div>
      </div>
    </div>`;
  }
  function wireChat(body){
    const inp = $('wsChatInput');
    const btn = $('wsChatSend');
    if (inp && btn){
      const submit = () => doChat();
      btn.addEventListener('click', submit);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); submit(); } });
    }
    scrollChatToBottom();
    startChatCooldown();
  }
  function rerenderChat(){
    if (S.activeTab !== 'chat') return;
    const list = $('wsChatList');
    if (!list) return;
    const meId = S.user?.id;
    if (!SOC.chat.length){
      list.innerHTML = '<div class="wf-history-empty">Chưa có tin nhắn</div>';
      return;
    }
    list.innerHTML = SOC.chat.map(m => renderChatMsg(m, meId)).join('');
    scrollChatToBottom();
  }
  function scrollChatToBottom(){
    const list = $('wsChatList');
    if (list) setTimeout(() => { list.scrollTop = list.scrollHeight; }, 50);
  }
  function startChatCooldown(){
    const cdEl = $('wsChatCd');
    const inp = $('wsChatInput');
    const btn = $('wsChatSend');
    if (!cdEl || !inp || !btn) return;
    clearInterval(startChatCooldown._t);
    startChatCooldown._t = setInterval(() => {
      const now = nowMs();
      const remain = Math.max(0, S.chatCooldownUntil - now);
      if (remain > 0){
        cdEl.textContent = '⏳ Đợi ' + Math.ceil(remain/1000) + 's';
        inp.disabled = true; btn.disabled = true;
      } else {
        cdEl.textContent = '';
        inp.disabled = false; btn.disabled = false;
      }
      if (S.activeTab !== 'chat'){ clearInterval(startChatCooldown._t); }
    }, 300);
  }
  async function doChat(){
    const inp = $('wsChatInput');
    if (!inp) return;
    const msg = inp.value.trim();
    if (!msg){ return; }
    if (msg.length > CFG.CHAT_MAX_LEN){ toast('Tối đa ' + CFG.CHAT_MAX_LEN + ' ký tự', 'warning'); return; }
    if (nowMs() < S.chatCooldownUntil){ toast('Đợi chút nữa', 'warning'); return; }
    const sb = getSb(); if (!sb) return;
    inp.disabled = true;
    try {
      const myState = S.state;
      const tier = tierOf(myState?.enh || 0);
      const res = await sb.rpc('rpc_weapon_send_chat', {
        p_message: msg, p_tier: tier, p_enh: myState?.enh || 0,
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi gửi');
      inp.value = '';
      S.chatCooldownUntil = nowMs() + CFG.CHAT_COOLDOWN_MS;
      await fetchChat();
      rerenderChat();
      scrollChatToBottom();
      await questProgress('chat', 1);
      await seasonAddXP(CFG.SEASON_XP.chat);
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
      inp.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     18. TAB: GIFT
     ═══════════════════════════════════════════════════════════════ */
  function renderGiftTab(){
    if (!SOC.giftTargets.length) return '<div class="wf-history-empty">Chưa có ai</div>';
    return '<div class="wf-section-title">🎁 Tặng vàng cho người chơi</div>' +
      SOC.giftTargets.map(p => `
        <div class="ws-gift-row">
          ${renderAvatarHtml(p.display_name, 'ws-gift-av')}
          <div class="ws-gift-body">
            <div class="ws-gift-name">${esc(p.display_name)}</div>
            <div class="ws-gift-meta">+${p.enh} · ⚡${Math.round(p.best_power)}</div>
          </div>
          <button class="ws-btn small primary" data-ws-gift="${p.user_id}" data-ws-gift-name="${esc(p.display_name)}" type="button">🎁 Tặng</button>
        </div>
      `).join('');
  }
  function rerenderGift(){ if (S.activeTab === 'gift') render(); }
  function wireGift(body){
    body.querySelectorAll('[data-ws-gift]').forEach(b => {
      b.addEventListener('click', () => openGiftModal(b.dataset.wsGift, b.dataset.wsGiftName));
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     19. MODALS
     ═══════════════════════════════════════════════════════════════ */
  function removeModal(id){ document.getElementById(id)?.remove(); }

  function openChallengeModal(oppId, oppName){
    removeModal('wsChallengeModal');
    const myGold = S.state?.gold || 0;
    const maxWager = Math.min(CFG.DUEL_MAX, Math.floor(myGold / 2));
    if (maxWager < CFG.DUEL_MIN){ toast(`Cần ≥ ${CFG.DUEL_MIN*2} vàng để thách`, 'warning'); return; }
    const modal = document.createElement('div');
    modal.id = 'wsChallengeModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">⚔️ Thách đấu</div>
        <div class="ws-modal-sub">Đấu với <b>${esc(oppName)}</b><br>HP/ATK dựa trên power hai bên</div>
        <label class="ws-modal-label">Số vàng cược (${CFG.DUEL_MIN}-${maxWager})</label>
        <input class="ws-modal-input" id="wsWagerInput" type="number" min="${CFG.DUEL_MIN}" max="${maxWager}" value="${Math.min(50, maxWager)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-wager="50">50</button>
          <button type="button" data-wager="100">100</button>
          <button type="button" data-wager="500">500</button>
          <button type="button" data-wager="${maxWager}">MAX</button>
        </div>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsChallConfirm" type="button">Gửi thách đấu</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-wager]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsWagerInput');
        if (inp) inp.value = b.dataset.wager;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsChallConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsWagerInput');
      const wager = parseInt(inp.value, 10);
      if (!wager || wager < CFG.DUEL_MIN || wager > maxWager){ toast(`Cược ${CFG.DUEL_MIN}-${maxWager}`, 'warning'); return; }
      const btn = modal.querySelector('#wsChallConfirm');
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      try {
        const sb = getSb();
        const res = await sb.rpc('rpc_weapon_duel_challenge', { p_opponent_id: oppId, p_wager: wager });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        toast(`Đã thách ${oppName} cược ${wager}🪙`, 'success');
        modal.remove();
        await fetchArena();
        rerenderArena();
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
        btn.disabled = false; btn.textContent = 'Gửi thách đấu';
      }
    });
  }

  function openGiftModal(toId, toName){
    removeModal('wsGiftModal');
    const myGold = S.state?.gold || 0;
    if (myGold < CFG.GIFT_MIN){ toast(`Cần ≥ ${CFG.GIFT_MIN} vàng`, 'warning'); return; }
    const maxAmount = Math.min(CFG.GIFT_MAX_PER_TX, myGold);
    const modal = document.createElement('div');
    modal.id = 'wsGiftModal';
    modal.className = 'ws-modal show';
    modal.innerHTML = `
      <div class="ws-modal-card">
        <div class="ws-modal-title">🎁 Tặng vàng</div>
        <div class="ws-modal-sub">Tặng cho <b>${esc(toName)}</b><br>Tối đa ${CFG.GIFT_MAX_PER_TX}🪙/lần, ${CFG.GIFT_MAX_PER_DAY}🪙/ngày</div>
        <label class="ws-modal-label">Số vàng (${CFG.GIFT_MIN}-${maxAmount})</label>
        <input class="ws-modal-input" id="wsGiftInput" type="number" min="${CFG.GIFT_MIN}" max="${maxAmount}" value="${Math.min(50, maxAmount)}" step="10">
        <div class="ws-modal-quick">
          <button type="button" data-amt="50">50</button>
          <button type="button" data-amt="100">100</button>
          <button type="button" data-amt="200">200</button>
          <button type="button" data-amt="${maxAmount}">MAX</button>
        </div>
        <label class="ws-modal-label">Lời nhắn (tuỳ chọn)</label>
        <textarea class="ws-modal-textarea" id="wsGiftMsg" maxlength="100" placeholder="Chúc bạn may mắn..."></textarea>
        <div class="ws-modal-actions">
          <button class="ws-modal-cancel" type="button">Huỷ</button>
          <button class="ws-modal-confirm" id="wsGiftConfirm" type="button">Tặng ngay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-amt]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = modal.querySelector('#wsGiftInput');
        if (inp) inp.value = b.dataset.amt;
      });
    });
    modal.querySelector('.ws-modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#wsGiftConfirm').addEventListener('click', async () => {
      const inp = modal.querySelector('#wsGiftInput');
      const msgInput = modal.querySelector('#wsGiftMsg');
      const amount = parseInt(inp.value, 10);
      if (!amount || amount < CFG.GIFT_MIN || amount > maxAmount){ toast(`Số vàng ${CFG.GIFT_MIN}-${maxAmount}`, 'warning'); return; }
      const btn = modal.querySelector('#wsGiftConfirm');
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      try {
        const sb = getSb();
        const res = await sb.rpc('rpc_weapon_send_gift', {
          p_to_id: toId, p_amount: amount, p_message: msgInput.value.trim() || null,
        });
        if (res.error) throw res.error;
        const d = res.data || {};
        if (!d.ok) throw new Error(d.error || 'Lỗi');
        if (S.state){ S.state.gold = Math.max(0, S.state.gold - amount); scheduleSave(); }
        toast(`Đã tặng ${amount}🪙 cho ${toName}`, 'success');
        playSound(880, .1); setTimeout(()=>playSound(1175,.15), 80);
        modal.remove();
        render();
        fetchFeed().then(rerenderFeed);
        await questProgress('gift', amount);
        await seasonAddXP(CFG.SEASON_XP.gift);
      } catch(e){
        toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
        btn.disabled = false; btn.textContent = 'Tặng ngay';
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     20. ACTIONS: FORGE / MARKET / SELL
     ═══════════════════════════════════════════════════════════════ */
  async function doForge(){
    if (S.busy || !S.state) return;
    const s = S.state;
    if (s.enh >= 15){ toast('MAX', 'warning'); return; }
    if (s.energy < CFG.FORGE_ENERGY){ toast('Hết năng lượng', 'warning'); return; }
    if (s.gold < CFG.FORGE_GOLD){ toast('Không đủ vàng', 'warning'); return; }

    S.busy = true;
    const hammer = $('wfHammer'), btn = $('wfForgeBtn');
    if (btn){ btn.classList.add('forging'); btn.disabled = true; }

    s.energy -= CFG.FORGE_ENERGY;
    s.gold -= CFG.FORGE_GOLD;
    const matUsed = consumeMaterial(s);
    const gv = $('wfGoldVal');
    if (gv) gv.textContent = fmtGold(s.gold);
    scheduleSave();

    let pending = null;
    const enhBefore = s.enh;
    try {
      if (hammer){ hammer.classList.remove('striking'); hammer.classList.add('raising'); }
      playSound(180, .1);
      await sleep(220);
      if (hammer){ hammer.classList.remove('raising'); hammer.classList.add('striking'); }
      playSound(120, .08, 'triangle');
      await sleep(160);
      shakeScreen(); spawnSparks(8); vibrate(30);

      const rates = effectiveRates(s);
      const outcome = rollOutcome(rates, s.fails);
      const result = applyOutcome(s, outcome);

      const w = $('wfWeaponEmoji');
      if (w){
        w.classList.remove('shake','shine','shatter');
        if (outcome === 'broken') w.classList.add('shatter');
        else if (outcome === 'damaged' || outcome === 'hold') w.classList.add('shake');
        else { w.classList.add('shine'); if (outcome === 'great') spawnSparks(20); }
      }
      const unlocked = checkAchievements(s);
      s.history.unshift({ ts: nowMs(), outcome, deltaEnh: result.deltaEnh, prevEnh: result.prevEnh, newEnh: result.newEnh, goldDelta: result.goldDelta, matUsed });
      if (s.history.length > 50) s.history.length = 50;
      scheduleSave();
      playForgeSound(outcome);
      if (outcome === 'broken') vibrate([80,40,80]);
      else if (outcome === 'great') vibrate([20,30,20,30,60]);
      if (result.goldDelta > 0) numberPop(`+${result.goldDelta}🪙`, '#f59e0b');
      await sleep(400);
      pending = { outcome, result, unlocked };

      // ⭐ QUEST + SEASON hooks
      questProgress('forge', 1);
      const xp = outcome === 'great' ? CFG.SEASON_XP.forge_great : CFG.SEASON_XP.forge;
      seasonAddXP(xp);
      if (result.newEnh > enhBefore && result.newEnh >= 5){
        questProgress('enh_reach', result.newEnh - enhBefore);
      }
    } catch(e){
      log('forge error', e);
      toast('Lỗi khi rèn', 'error');
    } finally {
      S.busy = false;
      if (hammer) hammer.classList.remove('raising','striking');
      render();
      if (pending) showResult(pending.outcome, pending.result, pending.unlocked);
    }
  }
  function showResult(outcome, result, unlocked){
    const ov = $('wfResult'); if (!ov) return;
    const map = {
      broken:  { e:'💥', t:'Gãy vũ khí',      c:'broken'  },
      damaged: { e:'⚠️', t:'Hư hại',           c:'damaged' },
      hold:    { e:'🛡️', t:'Giữ nguyên',       c:'hold'    },
      success: { e:'✅', t:'Thành công',       c:'success' },
      great:   { e:'✨', t:'Đại thành công!',  c:'great'   },
    };
    const c = map[outcome] || map.hold;
    $('wfResEmoji').textContent = c.e;
    const title = $('wfResTitle'); title.textContent = c.t; title.className = 'wf-result-title ' + c.c;
    const desc = {
      broken:  result.deltaEnh < 0 ? 'Mất 1 cấp.' : 'Đã ở mức thấp nhất.',
      damaged: result.deltaEnh < 0 ? 'Mất 1 cấp.' : 'Đã ở mức thấp nhất.',
      hold:    'Không thay đổi.',
      success: '+1 cấp!',
      great:   '+2 cấp và nhận vàng!',
    };
    $('wfResDesc').textContent = desc[outcome] || '';
    const chips = [];
    if (result.deltaEnh !== 0){
      const cls = result.deltaEnh > 0 ? 'plus-enh' : 'minus-enh';
      chips.push(`<span class="wf-result-chip ${cls}">${result.deltaEnh>0?'+':''}${result.deltaEnh} cấp</span>`);
    } else chips.push(`<span class="wf-result-chip zero-enh">±0 cấp</span>`);
    if (result.goldDelta > 0) chips.push(`<span class="wf-result-chip plus-gold">+${result.goldDelta} 🪙</span>`);
    $('wfResChanges').innerHTML = chips.join('');
    const again = $('wfResAgain');
    if (again){
      const s = S.state;
      const can = !!(s && s.enh < 15 && s.energy >= CFG.FORGE_ENERGY && s.gold >= CFG.FORGE_GOLD);
      again.disabled = !can;
      again.style.opacity = can ? '' : '.45';
      again.textContent = can ? `🔨 Rèn tiếp (🪙${CFG.FORGE_GOLD} · ⚡${CFG.FORGE_ENERGY})`
        : s?.enh >= 15 ? '🏆 Đã MAX'
        : s?.energy < CFG.FORGE_ENERGY ? '⚡ Hết năng lượng'
        : '🪙 Thiếu vàng';
    }
    ov.classList.add('show');
    if (unlocked?.length){
      setTimeout(() => unlocked.forEach(u => toast(`🏅 ${u.name} (+${u.gold}🪙)`, 'success')), 400);
    }
  }
  function closeResult(){ $('wfResult')?.classList.remove('show'); }

  function doBuyMaterial(mid){
    const s = S.state, m = CFG.MATERIALS[mid];
    if (!m) return;
    if (s.gold < m.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= m.price;
    s.materials[mid] = (s.materials[mid]||0) + 1;
    scheduleSave();
    toast(`Mua ${m.emoji} ${m.name} ✓`, 'success');
    render();
  }
  function doBuyHammer(hid){
    const s = S.state, h = CFG.HAMMERS[hid];
    if (!h || s.hammers.includes(hid)) return;
    if (s.gold < h.price){ toast('Không đủ vàng', 'warning'); return; }
    s.gold -= h.price;
    s.hammers.push(hid);
    s.hammer = hid;
    scheduleSave();
    toast(`Mua ${h.emoji} ${h.name} ✓`, 'success');
    render();
  }
  function doEquipHammer(hid){
    if (!S.state.hammers.includes(hid)) return;
    S.state.hammer = hid;
    scheduleSave();
    toast(`Trang bị ${CFG.HAMMERS[hid].name} ✓`);
    render();
  }
  function doRefillEnergy(){
    const s = S.state;
    if (s.gold < CFG.REFILL_COST_GOLD){ toast('Không đủ vàng', 'warning'); return; }
    if (s.energy >= CFG.ENERGY_MAX){ toast('Đầy rồi', 'warning'); return; }
    s.gold -= CFG.REFILL_COST_GOLD;
    s.energy = Math.min(CFG.ENERGY_MAX, s.energy + CFG.REFILL_AMOUNT);
    s.last_energy_at = nowMs();
    scheduleSave();
    toast(`+${CFG.REFILL_AMOUNT} ⚡`, 'success');
    render();
  }
  function doSell(){
    const s = S.state;
    if (s.enh <= 0){ toast('Không có gì để bán', 'warning'); return; }
    const price = sellPrice(s.enh);
    if (!confirm(`Bán +${s.enh} lấy ${fmtGold(price)}🪙?`)) return;
    s.gold += price;
    s.total_gold_earned += price;
    s.total_sold++;
    s.enh = 0;
    checkAchievements(s);
    scheduleSave();
    toast(`+${fmtGold(price)}🪙 ✓`, 'success');
    render();
    questProgress('sell', 1);
  }

  /* ═══════════════════════════════════════════════════════════════
     21. DUEL
     ═══════════════════════════════════════════════════════════════ */
  async function acceptDuel(matchId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_battle_start', { p_match_id: matchId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      if (S.user) saveActiveBattleId(S.user.id, matchId);
      toast('⚔️ Trận đấu bắt đầu!', 'success');
      playSound(880, .1, 'triangle'); setTimeout(()=>playSound(1175,.15,'triangle'), 100);
      vibrate([40,30,40]);
      await fetchArena();
      openBattle(matchId);
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không bắt đầu được'), 'error');
      if (btn) btn.disabled = false;
    }
  }
  async function rejectDuel(matchId, btn){
    if (btn) btn.disabled = true;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_duel_reject', { p_match_id: matchId });
      if (res.error) throw res.error;
      toast('Đã từ chối');
      await fetchArena();
      rerenderArena();
    } catch(e){
      toast('Lỗi', 'error');
      if (btn) btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     22. BATTLE (turn-based)
     ═══════════════════════════════════════════════════════════════ */
  function ensureBattleScreen(){
    let b = document.getElementById('wsBattleScreen');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'wsBattleScreen';
    b.className = 'ws-battle';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = `
      <header class="ws-battle-head">
        <button class="ws-battle-head-btn" id="wsBattleBack" type="button" aria-label="Thoát">←</button>
        <div class="ws-battle-title">
          <span class="ws-battle-kicker">ĐẤU TRƯỜNG</span>
          <span class="ws-battle-name" id="wsBattleWager">—</span>
        </div>
        <button class="ws-battle-head-btn" id="wsBattleRefresh" type="button" aria-label="Refresh">↻</button>
      </header>
      <div class="ws-battle-arena" id="wsBattleArena">
        <div class="ws-battle-log" id="wsBattleLog"></div>
        <div class="ws-battle-vs">VS</div>
        <div class="ws-battle-fighters">
          <div class="ws-fighter" id="wsFighterMe">
            <div class="ws-fighter-avatar" id="wsFighterMeAv">?</div>
            <div class="ws-fighter-name" id="wsFighterMeName">Bạn</div>
            <div class="ws-fighter-hp"><div class="ws-fighter-hp-fill" id="wsFighterMeHpBar" style="width:100%"></div></div>
            <div class="ws-fighter-hp-text" id="wsFighterMeHpText">—</div>
          </div>
          <div class="ws-battle-vs-mark">⚔️</div>
          <div class="ws-fighter" id="wsFighterThem">
            <div class="ws-fighter-avatar" id="wsFighterThemAv">?</div>
            <div class="ws-fighter-name" id="wsFighterThemName">Đối thủ</div>
            <div class="ws-fighter-hp"><div class="ws-fighter-hp-fill" id="wsFighterThemHpBar" style="width:100%"></div></div>
            <div class="ws-fighter-hp-text" id="wsFighterThemHpText">—</div>
          </div>
        </div>
      </div>
      <div class="ws-battle-actions">
        <div class="ws-battle-turn-info" id="wsBattleTurnInfo">Đang tải…</div>
        <div class="ws-battle-btns">
          <button class="ws-battle-btn strike" data-bt-action="strike" type="button">⚔️ Strike<small>90-110% dmg · 5% miss</small></button>
          <button class="ws-battle-btn heavy"  data-bt-action="heavy"  type="button">💥 Heavy<small>130-160% · 15% miss · crit 20%</small></button>
          <button class="ws-battle-btn defend" data-bt-action="defend" type="button">🛡️ Defend<small>+5% HP</small></button>
          <button class="ws-battle-btn heal"   data-bt-action="heal"   type="button">💚 Heal<small>+15% HP</small></button>
        </div>
      </div>
      <div class="ws-battle-result" id="wsBattleResult">
        <div class="ws-battle-result-card">
          <div class="ws-battle-result-emoji" id="wsBattleResEmoji">🏆</div>
          <div class="ws-battle-result-title" id="wsBattleResTitle">—</div>
          <div class="ws-battle-result-sub" id="wsBattleResSub">—</div>
          <button class="ws-battle-result-btn" id="wsBattleResOk" type="button">Đóng</button>
        </div>
      </div>
    `;
    document.body.appendChild(b);
    b.querySelector('#wsBattleBack').addEventListener('click', () => closeBattle());
    b.querySelector('#wsBattleRefresh').addEventListener('click', () => refreshBattleState());
    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.addEventListener('click', () => doBattleAction(btn.dataset.btAction, btn));
    });
    b.querySelector('#wsBattleResOk').addEventListener('click', () => {
      b.querySelector('#wsBattleResult').classList.remove('show');
      closeBattle();
    });
    return b;
  }

  async function openBattle(matchId){
    if (!matchId) return;
    const b = ensureBattleScreen();
    S.currentBattleId = matchId;
    S.battleState = null;
    if (S.user) saveActiveBattleId(S.user.id, matchId);
    b.classList.add('show');
    b.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const resEl = document.getElementById('wsBattleResult');
    if (resEl) resEl.classList.remove('show');
    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.disabled = true;
      const map = { strike:'⚔️ Strike<small>90-110% dmg · 5% miss</small>', heavy:'💥 Heavy<small>130-160% · 15% miss · crit 20%</small>', defend:'🛡️ Defend<small>+5% HP</small>', heal:'💚 Heal<small>+15% HP</small>' };
      if (map[btn.dataset.btAction]) btn.innerHTML = map[btn.dataset.btAction];
    });
    await refreshBattleState();
    subscribeBattleRealtime(matchId);
    startBattlePoll();
  }

  function closeBattle(){
    const b = document.getElementById('wsBattleScreen');
    if (b){ b.classList.remove('show'); b.setAttribute('aria-hidden', 'true'); }
    document.body.style.overflow = '';
    stopBattlePoll();
    unsubscribeBattleRealtime();
    if (S.battleState?.status !== 'fighting'){
      if (S.user) saveActiveBattleId(S.user.id, null);
    }
    S.currentBattleId = null;
    S.battleState = null;
    S.activeBattleData = null;
    if (S.activeTab === 'arena'){ fetchArena().then(rerenderArena); render(); }
  }
  function startBattlePoll(){
    stopBattlePoll();
    S.battlePollTimer = setInterval(() => {
      if (document.hidden) return;
      if (!S.currentBattleId) return;
      if (S.battleState?.status !== 'fighting') return;
      refreshBattleState();
    }, CFG.BATTLE_POLL_MS);
  }
  function stopBattlePoll(){
    if (S.battlePollTimer){ clearInterval(S.battlePollTimer); S.battlePollTimer = null; }
  }
  function subscribeBattleRealtime(matchId){
    unsubscribeBattleRealtime();
    const sb = getSb();
    if (!sb || !sb.channel) return;
    try {
      S.battleChannel = sb.channel('wf-battle-' + matchId)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'srank_weapon_matches', filter: 'id=eq.' + matchId },
          payload => onBattleUpdate(payload.new))
        .subscribe(status => log('battle rt:', status));
    } catch(e){ log('battle rt sub', e); }
  }
  function unsubscribeBattleRealtime(){
    if (S.battleChannel){
      try { S.battleChannel.unsubscribe(); } catch(_){}
      S.battleChannel = null;
    }
  }
  function onBattleUpdate(row){
    if (!row) return;
    if (row.id !== S.currentBattleId) return;
    refreshBattleState();
  }
  async function refreshBattleState(){
    if (!S.currentBattleId) return;
    const sb = getSb(); if (!sb) return;
    try {
      const res = await sb.rpc('rpc_weapon_battle_state', { p_match_id: S.currentBattleId });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');
      S.battleState = d;
      renderBattle(d);
    } catch(e){ log('refreshBattleState', e); }
  }
  function renderBattle(st){
    const b = document.getElementById('wsBattleScreen');
    if (!b || !st) return;
    const me = st.is_challenger
      ? { id: st.challenger_id, name: st.challenger_name, hp: st.challenger_hp, max: st.challenger_max_hp, atk: st.challenger_atk }
      : { id: st.opponent_id,   name: st.opponent_name,   hp: st.opponent_hp,   max: st.opponent_max_hp,   atk: st.opponent_atk };
    const them = st.is_challenger
      ? { id: st.opponent_id,   name: st.opponent_name,   hp: st.opponent_hp,   max: st.opponent_max_hp,   atk: st.opponent_atk }
      : { id: st.challenger_id, name: st.challenger_name, hp: st.challenger_hp, max: st.challenger_max_hp, atk: st.challenger_atk };

    const wg = document.getElementById('wsBattleWager');
    if (wg) wg.textContent = `Cược ${fmtGold(st.wager)}🪙 · Turn ${st.turn_number}`;

    const meAv = document.getElementById('wsFighterMeAv');
    if (meAv){
      const url = avatarUrl(me.name);
      if (url) meAv.innerHTML = `<img src="${escapeUrl(url)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initialOf(me.name)}'">`;
      else meAv.textContent = initialOf(me.name);
    }
    const meName = document.getElementById('wsFighterMeName');
    if (meName) meName.textContent = me.name || 'Bạn';
    const meHpBar = document.getElementById('wsFighterMeHpBar');
    const meHpText = document.getElementById('wsFighterMeHpText');
    const meHpPct = me.max ? Math.max(0, Math.min(100, (me.hp / me.max) * 100)) : 0;
    if (meHpBar) meHpBar.style.width = meHpPct + '%';
    if (meHpText) meHpText.textContent = `${me.hp || 0} / ${me.max || 0}`;

    const themAv = document.getElementById('wsFighterThemAv');
    if (themAv){
      const url = avatarUrl(them.name);
      if (url) themAv.innerHTML = `<img src="${escapeUrl(url)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initialOf(them.name)}'">`;
      else themAv.textContent = initialOf(them.name);
    }
    const themName = document.getElementById('wsFighterThemName');
    if (themName) themName.textContent = them.name || 'Đối thủ';
    const themHpBar = document.getElementById('wsFighterThemHpBar');
    const themHpText = document.getElementById('wsFighterThemHpText');
    const themHpPct = them.max ? Math.max(0, Math.min(100, (them.hp / them.max) * 100)) : 0;
    if (themHpBar) themHpBar.style.width = themHpPct + '%';
    if (themHpText) themHpText.textContent = `${them.hp || 0} / ${them.max || 0}`;

    const meEl = document.getElementById('wsFighterMe');
    const themEl = document.getElementById('wsFighterThem');
    if (meEl) meEl.classList.toggle('dead', (me.hp || 0) <= 0);
    if (themEl) themEl.classList.toggle('dead', (them.hp || 0) <= 0);

    if (meEl) meEl.querySelector('.ws-fighter-turn')?.remove();
    if (themEl) themEl.querySelector('.ws-fighter-turn')?.remove();
    if (st.status === 'fighting'){
      if (st.my_turn) meEl?.insertAdjacentHTML('beforeend', '<div class="ws-fighter-turn">▶</div>');
      else themEl?.insertAdjacentHTML('beforeend', '<div class="ws-fighter-turn">▶</div>');
    }

    const ti = document.getElementById('wsBattleTurnInfo');
    if (ti){
      if (st.status === 'fighting'){
        if (st.my_turn){ ti.textContent = '🎯 Lượt của bạn!'; ti.classList.add('my'); }
        else { ti.textContent = '⏳ Chờ đối thủ…'; ti.classList.remove('my'); }
      } else if (st.status === 'resolved'){ ti.textContent = '✅ Trận đã kết thúc'; ti.classList.remove('my'); }
      else { ti.textContent = ''; }
    }

    b.querySelectorAll('[data-bt-action]').forEach(btn => {
      btn.disabled = !(st.status === 'fighting' && st.my_turn);
    });

    renderBattleLog(st);

    if (st.status === 'resolved'){
      const iWon = st.winner_id === (st.is_challenger ? st.challenger_id : st.opponent_id);
      showBattleResult(iWon, st.wager);
    }
  }
  function renderBattleLog(st){
    const el = document.getElementById('wsBattleLog');
    if (!el || !Array.isArray(st.battle_log)) return;
    const meId = st.is_challenger ? 'challenger' : 'opponent';
    const lines = st.battle_log.slice(-8).map(entry => {
      if (entry.type === 'start') return `<div class="ws-battle-log-item">⚔️ ${esc(entry.msg || 'Trận bắt đầu')}</div>`;
      if (entry.type === 'end') return `<div class="ws-battle-log-item end">🏆 ${esc(entry.msg || 'Kết thúc')}</div>`;
      if (entry.type === 'timeout') return `<div class="ws-battle-log-item end">⏱️ ${esc(entry.msg || 'AFK')}</div>`;
      const who = entry.who === meId ? 'Bạn' : 'Đối thủ';
      let txt = '';
      let cls = '';
      if (entry.type === 'strike' || entry.type === 'heavy'){
        if (entry.miss){
          txt = `${who} ${entry.type === 'heavy' ? '💥 Heavy' : '⚔️ Strike'} → trượt!`;
          cls = 'miss';
        } else {
          txt = `${who} ${entry.type === 'heavy' ? '💥 Heavy' : '⚔️ Strike'} → -${entry.dmg} HP`;
          if (entry.crit){ txt += ' 💥 CRIT!'; cls = 'crit'; }
        }
      } else if (entry.type === 'defend'){ txt = `${who} 🛡️ Defend (+5% HP)`; }
      else if (entry.type === 'heal'){ txt = `${who} 💚 Heal (+15% HP)`; }
      return `<div class="ws-battle-log-item ${cls}">${txt}</div>`;
    }).join('');
    el.innerHTML = lines;
    el.scrollTop = el.scrollHeight;
  }
  function showBattleResult(iWon, wager){
    const el = document.getElementById('wsBattleResult');
    if (!el) return;
    if (el.classList.contains('show')) return;
    el.querySelector('#wsBattleResEmoji').textContent = iWon ? '🏆' : '💔';
    el.querySelector('#wsBattleResTitle').textContent = iWon ? 'Chiến thắng!' : 'Thất bại';
    el.querySelector('#wsBattleResSub').textContent = iWon
      ? `Bạn nhận lại ${fmtGold(Math.floor(wager * 2 * 0.95))}🪙 (thuế 5%)`
      : `Bạn mất ${fmtGold(wager)}🪙`;
    el.classList.add('show');
    if (iWon){ playSound(659,.15); setTimeout(()=>playSound(880,.2),120); setTimeout(()=>playSound(1047,.25),260); }
    else { playSound(330,.3,'sawtooth'); }
    if (iWon){ questProgress('duel_win', 1); seasonAddXP(CFG.SEASON_XP.duel_win); }
    setTimeout(async () => {
      const r = await pullRemote();
      if (r && r.state){ S.state = r.state; saveLocal(S.user.id, S.state); }
      if (S.user) saveActiveBattleId(S.user.id, null);
    }, 500);
  }
  async function doBattleAction(action, btn){
    if (!S.currentBattleId) return;
    if (S.battleState?.status !== 'fighting' || !S.battleState?.my_turn){
      toast('Chưa đến lượt', 'warning'); return;
    }
    document.querySelectorAll('[data-bt-action]').forEach(b => b.disabled = true);
    if (btn) btn.textContent = '...';
    const sb = getSb();
    try {
      const res = await sb.rpc('rpc_weapon_battle_action', {
        p_match_id: S.currentBattleId, p_action: action
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi');

      const myFighter = document.getElementById('wsFighterMe');
      const theirFighter = document.getElementById('wsFighterThem');
      if (action === 'strike' || action === 'heavy'){
        if (!d.miss){
          myFighter?.classList.add('attacking');
          setTimeout(() => {
            theirFighter?.classList.add('hurt');
            setTimeout(() => { myFighter?.classList.remove('attacking'); theirFighter?.classList.remove('hurt'); }, 400);
          }, 150);
        }
        if (d.crit) numberPop('💥 CRIT!', '#fbbf24');
        else if (d.miss) numberPop('Miss', '#6b7280');
        else if (d.dmg) numberPop(`-${d.dmg}`, '#ef4444');
      }
      if (d.crit) playSound(880,.1); else if (!d.miss) playSound(400,.08);
      if (d.miss) playSound(220,.15,'square');
      vibrate(d.crit ? [30,20,30] : 20);
      await refreshBattleState();
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không đánh được'), 'error');
      document.querySelectorAll('[data-bt-action]').forEach(b => b.disabled = false);
    } finally {
      const labelMap = { strike:'⚔️ Strike<small>90-110% dmg · 5% miss</small>', heavy:'💥 Heavy<small>130-160% · 15% miss · crit 20%</small>', defend:'🛡️ Defend<small>+5% HP</small>', heal:'💚 Heal<small>+15% HP</small>' };
      document.querySelectorAll('[data-bt-action]').forEach(b => { if (labelMap[b.dataset.btAction]) b.innerHTML = labelMap[b.dataset.btAction]; });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     23. SOCIAL DATA FETCHERS
     ═══════════════════════════════════════════════════════════════ */
  async function fetchArena(){
    const sb = getSb(); if (!sb || !sb.rpc) return null;
    try {
      const res = await sb.rpc('rpc_weapon_arena_data');
      if (res.error) throw res.error;
      if (!res.data || res.data.ok !== true) throw new Error(res.data?.error || 'Lỗi');
      SOC.arena = res.data;
      SOC.pendingChallenges = (res.data.incoming||[]).length;
      updateBadges();
      return res.data;
    } catch(e){ log('fetchArena', e.message); return null; }
  }
  async function fetchChat(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_get_chat', { p_limit: 80 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){ SOC.chat = d.data; return d.data; }
    } catch(e){ log('fetchChat', e.message); }
    return SOC.chat;
  }
  async function fetchFeed(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_feed', { p_limit: 30 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){ SOC.feed = d.data; return d.data; }
    } catch(e){ log('fetchFeed', e.message); }
    return SOC.feed;
  }
  async function fetchGiftTargets(){
    const sb = getSb(); if (!sb || !sb.rpc) return [];
    try {
      const res = await sb.rpc('rpc_weapon_gift_targets', { p_limit: 50 });
      if (res.error) throw res.error;
      const d = res.data;
      if (d && d.ok === true && Array.isArray(d.data)){ SOC.giftTargets = d.data; return d.data; }
    } catch(e){ log('fetchGift', e.message); }
    return SOC.giftTargets;
  }

  /* ═══════════════════════════════════════════════════════════════
     24. QUEST / SEASON / PET / BOSS FETCHERS
     ═══════════════════════════════════════════════════════════════ */
  async function fetchQuests(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wq_get_quests');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.quests = Array.isArray(d.data) ? d.data : [];
        SOC.questsDayKey = d.day_key || '';
        SOC.unclaimedQuests = SOC.quests.filter(q => !q.claimed && q.progress >= q.target).length;
        updateBadges();
      }
    } catch(e){ log('fetchQuests', e.message); }
  }
  async function fetchSeason(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_ws_get_season');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.season = d.season;
        SOC.seasonProgress = d.progress;
        if (d.season && d.progress){
          const claimedFree = new Set(d.progress.claimed_tiers || []);
          const claimedPrem = new Set(d.progress.claimed_premium_tiers || []);
          let unclaimed = 0;
          for (let t = 1; t <= (d.progress.tier || 0); t++){
            if (!claimedFree.has(t)) unclaimed++;
            if (d.progress.premium && !claimedPrem.has(t)) unclaimed++;
          }
          SOC.unclaimedSeason = unclaimed;
        } else SOC.unclaimedSeason = 0;
        updateBadges();
      }
    } catch(e){ log('fetchSeason', e.message); }
  }
  async function fetchPets(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wp_get_pets');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true) SOC.pets = Array.isArray(d.data) ? d.data : [];
    } catch(e){ log('fetchPets', e.message); }
  }
  async function fetchBoss(){
    const sb = getSb(); if (!sb || !sb.rpc) return;
    try {
      const res = await sb.rpc('rpc_wb_get_current_boss');
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok === true){
        SOC.boss = d.boss || null;
        SOC.bossMy = d.my || null;
        SOC.bossTotal = d.total_participants || 0;
        SOC.claimableBoss = !!(SOC.boss && SOC.boss.status === 'defeated' && SOC.bossMy && SOC.bossMy.damage > 0 && !SOC.bossMy.claimed);
        updateBadges();
      }
    } catch(e){ log('fetchBoss', e.message); }
  }
  let _bossPollTimerInner = null;
  function startBossPoll(){
    stopBossPoll();
    _bossPollTimerInner = setInterval(() => {
      if (document.hidden) return;
      if (S.activeTab !== 'boss') return;
      fetchBoss().then(rerenderBoss);
    }, CFG.BOSS_POLL_MS);
  }
  function stopBossPoll(){
    if (_bossPollTimerInner){ clearInterval(_bossPollTimerInner); _bossPollTimerInner = null; }
    if (_bossPollTimer){ clearInterval(_bossPollTimer); _bossPollTimer = null; }
  }
  function startBossRealtime(){
    const sb = getSb();
    if (!sb || !sb.channel || _bossRtChannel) return;
    try {
      _bossRtChannel = sb.channel('wf-boss-rt')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'srank_weapon_bosses' }, () => {
          if (S.activeTab === 'boss') fetchBoss().then(rerenderBoss);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'srank_weapon_boss_damage' }, () => {
          if (S.activeTab === 'boss') fetchBoss().then(rerenderBoss);
        })
        .subscribe(status => log('boss rt:', status));
    } catch(e){ log('boss rt sub', e); }
  }
  function stopBossRealtime(){
    if (_bossRtChannel){
      try { _bossRtChannel.unsubscribe(); } catch(_){}
      _bossRtChannel = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     25. BADGES
     ═══════════════════════════════════════════════════════════════ */
  function setBadge(tabKey, count){
    const b = document.querySelector(`.wf-tab[data-tab="${tabKey}"] .wf-tab-badge`);
    if (!b) return;
    if (count > 0){ b.textContent = count > 99 ? '99+' : String(count); b.style.display = ''; }
    else b.style.display = 'none';
  }
  function updateBadges(){
    setBadge('arena', SOC.pendingChallenges);
    setBadge('chat', SOC.unreadChat);
    setBadge('quest', SOC.unclaimedQuests);
    setBadge('season', SOC.unclaimedSeason);
    setBadge('boss', SOC.claimableBoss ? 1 : 0);
  }

  /* ═══════════════════════════════════════════════════════════════
     26. REALTIME (social)
     ═══════════════════════════════════════════════════════════════ */
  function subscribeRealtime(){
    const sb = getSb();
    if (!sb || !sb.channel || _rtChannel) return;
    try {
      _rtChannel = sb.channel('wf-social-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'srank_weapon_chat' }, p => onNewChat(p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'srank_weapon_matches' }, p => onNewMatch(p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'srank_weapon_matches' }, p => onMatchUpdate(p.new))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'srank_weapon_feed' }, p => onNewFeed(p.new))
        .subscribe(status => {
          log('rt:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){ _rtChannel = null; }
        });
    } catch(e){ log('rt subscribe', e); }
  }
  function unsubscribeRealtime(){
    if (_rtChannel){
      try { _rtChannel.unsubscribe(); } catch(_){}
      _rtChannel = null;
    }
    stopBossRealtime();
    stopBossPoll();
  }
  function onNewChat(row){
    if (!row || SOC.chat.some(m => m.id === row.id)) return;
    SOC.chat.push(row);
    if (SOC.chat.length > 200) SOC.chat = SOC.chat.slice(-200);
    const me = S.user;
    const isMine = me && row.user_id === me.id;
    if (S.activeTab === 'chat'){ rerenderChat(); }
    else if (!isMine){ SOC.unreadChat = Math.min(99, SOC.unreadChat + 1); updateBadges(); }
  }
  function onNewMatch(row){
    if (!row) return;
    const me = S.user;
    if (!me || row.opponent_id !== me.id || row.status !== 'pending') return;
    SOC.pendingChallenges++;
    updateBadges();
    toast('⚔️ Có người thách đấu bạn!', 'person');
    playSound(880, .1, 'triangle'); setTimeout(()=>playSound(1175,.15,'triangle'), 100);
    vibrate([40,30,40]);
    if (S.activeTab === 'arena') fetchArena().then(rerenderArena);
  }
  function onMatchUpdate(row){
    if (!row) return;
    const me = S.user;
    if (!me || (row.challenger_id !== me.id && row.opponent_id !== me.id)) return;
    if (row.status === 'fighting'){
      if (!S.currentBattleId || S.currentBattleId !== row.id){
        if (S.user) saveActiveBattleId(S.user.id, row.id);
        toast('⚔️ Đối thủ đã chấp nhận — vào trận!', 'success');
        playSound(880, .1);
        const weaponPageOpen = document.getElementById('weaponPage')?.classList.contains('show');
        if (weaponPageOpen && !S.currentBattleId){
          setTimeout(() => { if (!S.currentBattleId) openBattle(row.id); }, 800);
        }
        if (S.activeTab === 'arena') fetchArena().then(rerenderArena);
      }
    } else if (row.status === 'resolved'){
      if (S.currentBattleId === row.id) refreshBattleState();
      else {
        const iWon = row.winner_id === me.id;
        toast(iWon ? '🏆 Bạn thắng duel!' : '💔 Bạn thua duel', iWon ? 'success' : 'error');
        if (S.user) saveActiveBattleId(S.user.id, null);
        pullRemote().then(r => {
          if (r && r.state){ S.state = r.state; saveLocal(me.id, S.state); render(); }
        });
      }
    }
  }
  function onNewFeed(row){
    if (!row || SOC.feed.some(f => f.id === row.id)) return;
    SOC.feed.unshift(row);
    if (SOC.feed.length > 100) SOC.feed = SOC.feed.slice(0, 100);
    rerenderFeed();
  }

  /* ═══════════════════════════════════════════════════════════════
     27. OPEN / CLOSE
     ═══════════════════════════════════════════════════════════════ */
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
    page.classList.add('show');
    page.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    render();

    const remote = await pullRemote();
    const local = loadLocal(S.user.id);
    if (remote && remote.state){
      if (local){
        const base = (local.total_forges||0) >= (remote.state.total_forges||0) ? { ...local } : { ...remote.state };
        base.gold = Math.max(local.gold||0, remote.state.gold||0);
        base.energy = Math.max(local.energy||0, remote.state.energy||0);
        base.best_power = Math.max(local.best_power||0, remote.state.best_power||0);
        base.total_gold_earned = Math.max(local.total_gold_earned||0, remote.state.total_gold_earned||0);
        const allMats = new Set([...Object.keys(local.materials||{}), ...Object.keys(remote.state.materials||{})]);
        base.materials = {};
        allMats.forEach(id => {
          base.materials[id] = Math.max((local.materials&&local.materials[id])||0, (remote.state.materials&&remote.state.materials[id])||0);
        });
        base.achievements = Object.assign({}, remote.state.achievements||{}, local.achievements||{});
        S.state = normalizeState(base);
      } else {
        S.state = remote.state;
      }
      saveLocal(S.user.id, S.state);
    } else if (local){
      S.state = local;
    } else {
      S.state = defaultState();
    }
    regenEnergy(S.state);
    const dn = S.user.displayName || S.user.username || '';
    if (dn) S.state.display_name = dn;
    checkAchievements(S.state);
    scheduleSave();
    render();

    subscribeRealtime();
    fetchArena();
    fetchFeed();
    fetchChat().then(() => { if (S.activeTab === 'chat') rerenderChat(); });
    fetchQuests().then(rerenderQuests);
    fetchSeason().then(rerenderSeason);
    fetchPets().then(rerenderPets);
    fetchBoss().then(rerenderBoss);

    const activeId = getActiveBattleId(S.user.id);
    if (activeId){
      const activeData = await fetchActiveBattle();
      if (activeData) S.activeBattleData = activeData;
    }
  }
  function closePage(){
    const page = $('weaponPage');
    if (!page) return;
    page.classList.remove('show');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    closeResult();
    removeModal('wsChallengeModal');
    removeModal('wsGiftModal');
    removeModal('wsPetFeedModal');
    closeBattle();
    unsubscribeRealtime();
    if (S.state && S.user) saveLocal(S.user.id, S.state);
  }

  /* ═══════════════════════════════════════════════════════════════
     28. BOOT
     ═══════════════════════════════════════════════════════════════ */
  function bindTriggers(){
    const btn = document.getElementById('weaponBtn');
    if (btn && !btn.__wfBound){
      btn.__wfBound = true;
      btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openPage(); });
    }
  }
  function boot(){
    ensurePage();
    bindTriggers();
    let tries = 0;
    const t = setInterval(() => { bindTriggers(); if (++tries > 20) clearInterval(t); }, 300);
    log('v4.0 ready ✓ (quest + season + pet + boss)');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  /* ═══════════════════════════════════════════════════════════════
     29. API
     ═══════════════════════════════════════════════════════════════ */
  window.WeaponForge = {
    open: openPage, close: closePage,
    state: () => S.state, config: CFG,
    reset: () => {
      if (!S.user) return;
      localStorage.removeItem(stateKey(S.user.id));
      localStorage.removeItem(ACTIVE_BATTLE_KEY + S.user.id);
      S.state = defaultState();
      render();
    },
    refresh: async () => {
      if (!S.user) return;
      const r = await pullRemote();
      if (r && r.state){ S.state = r.state; saveLocal(S.user.id, S.state); }
      render();
    },
    rerender: render,
    openBattle: (id) => openBattle(id),
    goto: (tab) => { S.activeTab = tab; render(); },
    _S: S, _SOC: SOC,
  };
})();