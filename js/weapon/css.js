/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #3: CSS INJECT
   - Toàn bộ CSS của weapon page + battle screen
   - Tự inject <style id="wfStyles"> khi load
   - Không phụ thuộc module khác
   - Load: #3
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.css) return;
  window.__WF = window.__WF || {};

  if (document.getElementById('wfStyles')) {
    window.__WF.css = { injected: true };
    return;
  }

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
.wf-stat-value.pos{color:#4fa370}
.wf-stat-value.neg{color:#dc2626}
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

  const st = document.createElement('style');
  st.id = 'wfStyles';
  st.textContent = CSS;
  document.head.appendChild(st);

  window.__WF.css = { injected: true };

  console.log('[WF] css.js ✓');
})();