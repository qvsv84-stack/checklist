/* ═══════════════════════════════════════════════════════════════
   CTA MORPH — v3.0 🎬
   Tích hợp vào app: bay cong + pulse 2s khi hạ cánh
   - auth-ui.js gọi window.__ctaMorph.start(cta)
   - Bay cong bằng Web Animations API
   - Ẩn card thật cho đến khi ghost hạ cánh
   - Pulse glow 2s sau khi card thật hiện
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__ctaMorph) return;

  const D_FLASH = 180;
  const D_FLY = 1400;
  const D_HOLD = 250;
  const D_FADE = 300;
  const D_PULSE = 2000;

  let _animating = false;

  console.log('[ctaMorph] loaded v3.0');

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

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function raf2() { return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }

  function findUserCard(name) {
    try {
      const cards = document.querySelectorAll('#question [data-name]');
      for (const card of cards) {
        if (card.dataset.name === name) return card;
      }
    } catch (_) {}
    return null;
  }

  function waitForCardRect(name, timeout) {
    return new Promise(resolve => {
      const start = Date.now();
      const check = () => {
        const card = findUserCard(name);
        if (card) {
          resolve({ card, rect: card.getBoundingClientRect() });
          return;
        }
        if (Date.now() - start > timeout) {
          resolve(null);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
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
        will-change: transform, width, height, opacity;
        transform: translate3d(0, 0, 0);
        transition:
          width 900ms cubic-bezier(0.34, 1.2, 0.64, 1),
          height 900ms cubic-bezier(0.34, 1.2, 0.64, 1);
      }
      .ctaMorphGhost .ctaMorphInner {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        gap: 10px; padding: 0 32px;
        border-radius: 999px;
        background: linear-gradient(135deg, hsl(140 60% 42%), hsl(155 60% 38%));
        color: #fff;
        font-family: inherit; font-weight: 800; letter-spacing: .01em;
        text-shadow: 0 1px 3px rgba(0,0,0,.2);
        box-shadow:
          0 0 0 1px hsl(140 60% 60% / .55),
          0 0 14px hsl(140 60% 50% / .6),
          0 0 32px hsl(140 60% 48% / .35),
          inset 0 0 14px hsl(140 60% 75% / .35);
        transition:
          padding 900ms cubic-bezier(0.34, 1.2, 0.64, 1),
          border-radius 900ms cubic-bezier(0.34, 1.2, 0.64, 1),
          background 900ms ease,
          color 900ms ease,
          box-shadow 900ms ease,
          font-size 900ms ease;
        overflow: hidden;
      }
      .ctaMorphGhost .ctaMorphLabel {
        white-space: nowrap; font-size: 1em;
        transition: opacity 180ms ease;
      }
      .ctaMorphGhost .ctaMorphCardBody {
        display: none; align-items: center; gap: 6px;
        width: 100%; height: 100%; padding: 5px 7px;
      }
      .ctaMorphGhost .ctaMorphAvatar {
        width: 28px; height: 28px; border-radius: 50%;
        overflow: hidden; flex-shrink: 0;
        background: linear-gradient(135deg,#e8f5ec,#d4ead9);
        border: 1.5px solid #fff;
        display: flex; align-items: center; justify-content: center;
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
        display: flex; flex-direction: column;
        min-width: 0; flex: 1; text-align: left;
      }
      .ctaMorphGhost .ctaMorphName {
        font-size: 11px; font-weight: 900; color: #234a32;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.15;
      }
      .ctaMorphGhost .ctaMorphTime {
        font-size: 9px; font-weight: 800; color: #6b8f78; line-height: 1.15;
      }
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
      .ctaMorphGhost.fading {
        opacity: 0;
        transition: opacity 300ms ease;
      }

      /* ⭐ Pulse glow 2s khi hạ cánh */
      @keyframes cardPulse {
        0%, 100% {
          box-shadow: 0 2px 12px rgba(50,80,60,.08);
          border-color: rgba(200,220,205,.55);
          transform: scale(1);
        }
        50% {
          box-shadow:
            0 0 0 3px hsl(140 60% 55% / .65),
            0 0 24px hsl(140 60% 50% / .55),
            0 8px 28px rgba(50,80,60,.18);
          border-color: hsl(140 60% 55% / .8);
          transform: scale(1.03);
        }
      }
      .ctaMorphPulse {
        animation: cardPulse 500ms ease-in-out 4 !important;
      }
    `;
    document.head.appendChild(s);
  }

  function buildGhost(ctaRect, user, time) {
    const avatarUrl = getAvatarUrl(user.name);
    const initial = String(user.name || '?').trim().slice(0, 1).toUpperCase();

    const ghost = document.createElement('div');
    ghost.className = 'ctaMorphGhost';
    ghost.style.left = ctaRect.left + 'px';
    ghost.style.top = ctaRect.top + 'px';
    ghost.style.width = ctaRect.width + 'px';
    ghost.style.height = ctaRect.height + 'px';
    ghost.style.fontSize = '16px';

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

    ghost.querySelector('.ctaMorphLabel').textContent = '⏰ Chấm công';
    ghost.querySelector('.ctaMorphName').textContent = user.name;
    ghost.querySelector('.ctaMorphTime').textContent = time;

    return ghost;
  }

  function animateFly(ghost, dx, dy) {
    const peakY = Math.min(-90, dy * 0.15 - 60);
    const frames = [
      { transform: `translate3d(0px, 0px, 0) scale(1) rotate(0deg)`, offset: 0 },
      { transform: `translate3d(${dx * 0.25}px, ${peakY}px, 0) scale(1.08) rotate(-10deg)`, offset: 0.30 },
      { transform: `translate3d(${dx * 0.65}px, ${dy * 0.15}px, 0) scale(0.98) rotate(6deg)`, offset: 0.60 },
      { transform: `translate3d(${dx * 0.92}px, ${dy * 0.75}px, 0) scale(0.94) rotate(-3deg)`, offset: 0.85 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(1) rotate(0deg)`, offset: 1 }
    ];
    return ghost.animate(frames, {
      duration: D_FLY,
      easing: 'cubic-bezier(0.34, 1.06, 0.64, 1)',
      fill: 'forwards'
    }).finished;
  }

  async function runMorph(cta) {
    const user = getUser();
    if (!user) {
      console.log('[ctaMorph] không có user — skip');
      return false;
    }
    console.log('[ctaMorph] bắt đầu morph cho', user.name);

    // ═══ 1. Flash vàng ═══
    const prevBoxShadow = cta.style.boxShadow;
    const prevTransition = cta.style.transition;
    cta.style.transition = 'box-shadow 80ms ease';
    cta.style.boxShadow = '0 0 0 3px #ffd700, 0 0 20px #ffd700';
    await sleep(D_FLASH);
    cta.style.boxShadow = prevBoxShadow;
    cta.style.transition = prevTransition;

    // ═══ 2. Lưu rect + ẩn CTA ═══
    const ctaRect = cta.getBoundingClientRect();
    const prevPointerEvents = cta.style.pointerEvents;
    const prevOpacity = cta.style.opacity;
    cta.style.pointerEvents = 'none';
    cta.style.opacity = '0';

    // ═══ 3. Tạo ghost tại CTA ═══
    const time = nowHHMM();
    const ghost = buildGhost(ctaRect, user, time);
    document.body.appendChild(ghost);
    void ghost.offsetWidth;

    // ═══ 4. Gọi API song song ═══
    let apiOK = false;
    const apiPromise = window.SRank.requestCheckin(user.name)
      .then(() => { apiOK = true; })
      .catch((e) => { apiOK = false; console.log('[ctaMorph] API fail:', e?.message); });

    // ═══ 5. Trigger morph (thu nhỏ) ═══
    await raf2();
    ghost.classList.add('morphing');

    // ═══ 6. Chờ card thật render (main.js re-render sau checkin) ═══
    const cardResult = await waitForCardRect(user.name, 2500);

    // ═══ 7. Ẩn card thật + tính vị trí đích ═══
    let targetRect;
    let hiddenCard = null;
    if (cardResult) {
      hiddenCard = cardResult.card;
      targetRect = cardResult.rect;
      // Ẩn card thật để ghost bay đến rồi mới hiện
      hiddenCard.style.transition = 'none';
      hiddenCard.style.opacity = '0';
    } else {
      // Fallback: grid ở dưới CTA
      targetRect = {
        left: window.innerWidth / 2 - 80,
        top: ctaRect.top + 200,
        width: 160,
        height: 38
      };
      console.log('[ctaMorph] không tìm thấy card thật — dùng fallback');
    }

    const dx = (targetRect.left + targetRect.width / 2) - (ctaRect.left + ctaRect.width / 2);
    const dy = (targetRect.top + targetRect.height / 2) - (ctaRect.top + ctaRect.height / 2);

    ghost.style.width = targetRect.width + 'px';
    ghost.style.height = targetRect.height + 'px';

    // ═══ 8. Bay cong ═══
    await animateFly(ghost, dx, dy);

    // ═══ 9. Chờ API xong ═══
    await apiPromise;

    // ═══ 10. Hold ngắn ═══
    await sleep(D_HOLD);

    // ═══ 11. Fade ghost + hiện card ═══
    ghost.classList.add('fading');
    await sleep(D_FADE);
    ghost.remove();

    if (!apiOK) {
      // Reverse: trả CTA về
      cta.style.pointerEvents = prevPointerEvents;
      cta.style.opacity = prevOpacity;
      if (hiddenCard) {
        hiddenCard.style.transition = '';
        hiddenCard.style.opacity = '';
      }
      try { window.SRank?.setStatus?.('Chấm công thất bại — thử lại'); } catch(_){}
      return false;
    }

    // ═══ 12. Hiện card + pulse 2s ═══
    if (hiddenCard) {
      hiddenCard.style.transition = 'opacity 300ms ease';
      hiddenCard.style.opacity = '1';
      await sleep(300);
      hiddenCard.classList.add('ctaMorphPulse');
      await sleep(D_PULSE);
      hiddenCard.classList.remove('ctaMorphPulse');
      hiddenCard.style.transition = '';
    }

    // Ẩn CTA gốc hẳn
    cta.style.display = 'none';

    console.log('[ctaMorph] ✓ hoàn tất');
    return true;
  }

  window.__ctaMorph = {
    start: async function (cta) {
      if (!cta) return false;
      if (_animating) {
        console.log('[ctaMorph] đang animate — skip');
        return false;
      }
      _animating = true;
      try {
        return await runMorph(cta);
      } catch (e) {
        console.error('[ctaMorph] error:', e);
        return false;
      } finally {
        _animating = false;
      }
    },
    isReady: function () { return true; }
  };

  injectStyles();
  console.log('[ctaMorph] ready ✓ v3.0');
})();