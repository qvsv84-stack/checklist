/* ═══════════════════════════════════════════════════════════════
   CTA MORPH — v1.1 🎬
   Bước 1: Morph nút "Chấm công" (TO) → card quần thần (NHỎ)
   - Intercept click CTA (capture phase)
   - Optimistic: morph ngay, reverse nếu API fail
   - Lock button trong lúc animate
   - Đo target size từ card thật (.courtier) nếu có
   - Không đụng file cũ
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__ctaMorphLoaded) return;
  window.__ctaMorphLoaded = true;

  const D_MORPH = 320;
  const D_HOLD = 480;
  const D_FADE = 400;
  const D_REVERSE = 300;
  const DEFAULT_W = 160;
  const DEFAULT_H = 38;

  let _animating = false;

  function getUser() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return null;
      const name = String(u.displayName || u.username || '').trim();
      if (!name) return null;
      return { name };
    } catch (_) { return null; }
  }

  function nowHHMM() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      const h = parts.find(p => p.type === 'hour')?.value || '00';
      const m = parts.find(p => p.type === 'minute')?.value || '00';
      return h + ':' + m;
    } catch (_) {
      const d = new Date();
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
  }

  function getAvatarUrl(name) {
    try {
      return (typeof window.getAvatarUrl === 'function') ? (window.getAvatarUrl(name) || '') : '';
    } catch (_) { return ''; }
  }

  function measureTargetSize() {
    // Ưu tiên đo từ card quần thần thật
    try {
      const cards = document.querySelectorAll('#question .courtier');
      if (cards.length) {
        const r = cards[0].getBoundingClientRect();
        if (r.width > 40 && r.height > 20) {
          return { w: Math.round(r.width), h: Math.round(r.height) };
        }
      }
      // Fallback: đo từ throne / advisor
      const big = document.querySelector('#question .court-throne, #question .advisor');
      if (big) {
        const r = big.getBoundingClientRect();
        if (r.width > 40) return { w: Math.min(180, Math.round(r.width)), h: DEFAULT_H };
      }
    } catch (_) {}
    return { w: DEFAULT_W, h: DEFAULT_H };
  }

  function injectStyles() {
    if (document.getElementById('ctaMorphStyle')) return;
    const s = document.createElement('style');
    s.id = 'ctaMorphStyle';
    s.textContent = `
      .ctaMorphGhost {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        will-change: transform, opacity, width, height, left, top;
        transition:
          width 320ms cubic-bezier(0.34, 1.1, 0.64, 1),
          height 320ms cubic-bezier(0.34, 1.1, 0.64, 1),
          left 320ms cubic-bezier(0.34, 1.1, 0.64, 1),
          top 320ms cubic-bezier(0.34, 1.1, 0.64, 1);
      }
      .ctaMorphGhost .ctaMorphInner {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 32px;
        border-radius: 999px;
        background: linear-gradient(135deg, hsl(140 60% 42%), hsl(155 60% 38%));
        color: #fff;
        font-family: inherit;
        font-weight: 800;
        letter-spacing: .01em;
        text-shadow: 0 1px 3px rgba(0,0,0,.2);
        box-shadow:
          0 0 0 1px hsl(140 60% 60% / .55),
          0 0 14px hsl(140 60% 50% / .6),
          0 0 32px hsl(140 60% 48% / .35),
          inset 0 0 14px hsl(140 60% 75% / .35);
        transition:
          padding 320ms cubic-bezier(0.34, 1.1, 0.64, 1),
          border-radius 320ms cubic-bezier(0.34, 1.1, 0.64, 1),
          background 320ms ease,
          color 320ms ease,
          box-shadow 320ms ease,
          font-size 320ms ease;
        overflow: hidden;
        box-sizing: border-box;
      }
      .ctaMorphGhost .ctaMorphLabel {
        white-space: nowrap;
        font-size: 1em;
        transition: opacity 180ms ease;
      }
      .ctaMorphGhost .ctaMorphCardBody {
        display: none;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;
        padding: 5px 7px;
        box-sizing: border-box;
      }
      .ctaMorphGhost .ctaMorphAvatar {
        width: 28px; height: 28px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: linear-gradient(135deg,#e8f5ec,#d4ead9);
        border: 1.5px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ctaMorphGhost .ctaMorphAvatar img {
        width: 100%; height: 100%; object-fit: cover; display: block;
      }
      .ctaMorphGhost .ctaMorphAvatarFb {
        font-size: 12px; font-weight: 950; color: #4a7a5a;
        display: flex; align-items: center; justify-content: center;
        width: 100%; height: 100%;
      }
      .ctaMorphGhost .ctaMorphInfo {
        display: flex;
        flex-direction: column;
        gap: 0;
        min-width: 0;
        flex: 1;
        text-align: left;
      }
      .ctaMorphGhost .ctaMorphName {
        font-size: 11px; font-weight: 900; color: #234a32;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        line-height: 1.15;
      }
      .ctaMorphGhost .ctaMorphTime {
        font-size: 9px; font-weight: 800; color: #6b8f78;
        line-height: 1.15;
      }
      /* Morph state */
      .ctaMorphGhost.morphing .ctaMorphInner {
        padding: 5px 7px;
        border-radius: 12px;
        background: rgba(255,255,255,.55);
        color: #234a32;
        text-shadow: none;
        box-shadow: 0 2px 12px rgba(50,80,60,.08);
        font-size: 11px;
      }
      .ctaMorphGhost.morphing .ctaMorphLabel { display: none; }
      .ctaMorphGhost.morphing .ctaMorphCardBody { display: flex; }
      /* Fade out */
      .ctaMorphGhost.fading { opacity: 0; transition: opacity 400ms ease, width 320ms cubic-bezier(0.34, 1.1, 0.64, 1), height 320ms cubic-bezier(0.34, 1.1, 0.64, 1), left 320ms cubic-bezier(0.34, 1.1, 0.64, 1), top 320ms cubic-bezier(0.34, 1.1, 0.64, 1); }
      /* Reverse */
      .ctaMorphGhost.reversing .ctaMorphInner {
        padding: 0 32px;
        border-radius: 999px;
        background: linear-gradient(135deg, hsl(140 60% 42%), hsl(155 60% 38%));
        color: #fff;
        text-shadow: 0 1px 3px rgba(0,0,0,.2);
        box-shadow:
          0 0 0 1px hsl(140 60% 60% / .55),
          0 0 14px hsl(140 60% 50% / .6),
          0 0 32px hsl(140 60% 48% / .35),
          inset 0 0 14px hsl(140 60% 75% / .35);
        font-size: 1em;
      }
      .ctaMorphGhost.reversing .ctaMorphCardBody { display: none; }
      .ctaMorphGhost.reversing .ctaMorphLabel { display: block; opacity: 1; }
    `;
    document.head.appendChild(s);
  }

  function buildGhost(cta, user, time) {
    const rect = cta.getBoundingClientRect();
    const avatarUrl = getAvatarUrl(user.name);
    const initial = String(user.name || '?').trim().slice(0, 1).toUpperCase();

    const ghost = document.createElement('div');
    ghost.className = 'ctaMorphGhost';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.fontSize = getComputedStyle(cta).fontSize || '16px';

    const avatarHTML = avatarUrl
      ? `<img src="${avatarUrl.replace(/"/g,'&quot;')}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="ctaMorphAvatarFb" style="display:none">${initial}</span>`
      : `<span class="ctaMorphAvatarFb">${initial}</span>`;

    ghost.innerHTML = `
      <div class="ctaMorphInner">
        <span class="ctaMorphLabel"></span>
        <div class="ctaMorphCardBody">
          <div class="ctaMorphAvatar">${avatarHTML}</div>
          <div class="ctaMorphInfo">
            <div class="ctaMorphName"></div>
            <div class="ctaMorphTime"></div>
          </div>
        </div>
      </div>
    `;

    ghost.querySelector('.ctaMorphLabel').textContent = cta.textContent || '⏰ Chấm công';
    ghost.querySelector('.ctaMorphName').textContent = user.name;
    ghost.querySelector('.ctaMorphTime').textContent = time;

    return ghost;
  }

  async function startMorph(cta) {
    if (_animating) return;
    const user = getUser();
    if (!user) {
      try { window.SRank?.setStatus?.('Chưa đăng nhập'); } catch(_){}
      return;
    }
    _animating = true;

    // Lock CTA
    cta.style.pointerEvents = 'none';
    cta.style.opacity = '0';

    // Pause realtime (nếu main.js export)
    try { window.__pauseRealtime?.(); } catch(_){}

    const time = nowHHMM();
    const ghost = buildGhost(cta, user, time);
    document.body.appendChild(ghost);

    // Đo target size từ card thật (nếu có) — fallback 160x38
    const target = measureTargetSize();
    const rect = cta.getBoundingClientRect();
    const targetLeft = rect.left + (rect.width - target.w) / 2;
    const targetTop = rect.top + (rect.height - target.h) / 2;

    // Trigger morph (thu nhỏ + đổi style)
    requestAnimationFrame(() => {
      ghost.classList.add('morphing');
      ghost.style.width = target.w + 'px';
      ghost.style.height = target.h + 'px';
      ghost.style.left = targetLeft + 'px';
      ghost.style.top = targetTop + 'px';
    });

    // Gọi API song song
    let apiOK = false;
    try {
      await window.SRank.requestCheckin(user.name);
      apiOK = true;
    } catch (e) {
      apiOK = false;
    }

    // Chờ morph + hold xong
    await new Promise(r => setTimeout(r, D_MORPH + D_HOLD));

    if (!giapiOKật) {
      // Reverse về hình n**út gốc trên
      ghost.classList.remove('morphing');
      ghost.classList.add('reversing');
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      await new Promise(r => setTimeout(r, D_REVERSE));
      ghost.remove();
      cta.style.pointerEvents = '';
      cta.style.opacity = '';
      try { window.SRank?.setStatus?.('Chấm công thất bại — thử lại'); } catch(_){}
      try { window.__resumeRealtime?.(); } catch(_){}
      _animating = false;
      return;
    }

    // Fade out ghost
    ghost.classList.add('fading');
    await new Promise(r => setTimeout(r, D_FADE));
    ghost.remove();

    // Cleanup
    try { window.__resumeRealtime?.(); } catch(_){}
    _animating = false;
  }

  function onClickCapture(e) {
    const cta = e.target?.closest?.('#question .landing-cta[data-cta="checkin"]');
    if (!cta) return;
    // Chặn handler cũ chạy
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (_animating) return;
    startMorph(cta);
  }

  function boot() {
    injectStyles();
    // Capture phase để chạy TRƯỚC mọi handler khác
    document.addEventListener('click', onClickCapture, true);
    console.log('[ctaMorph] ready ✓ Bước 1 (thu nhỏ)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();