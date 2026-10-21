/* =========================================================
   LANDING VIEW — v3.1 (FIX: feed không chạy dọc)
   ---------------------------------------------------------
   ⚠️ LƯU Ý: File này đang ép buộc ngày sinh nhật = TRUE.
   ========================================================= */
(function(){
  "use strict";
  if (window.LandingView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[LandingView] thiếu SrankCore');
    return;
  }

  const BIRTHDAY_WISHES = {
    'tienloi': 'Chúc mừng sinh nhật Quân! Tuổi mới chúc mày sức khỏe dồi dào, tiền vô như nước, gặp nhiều may mắn!',
    'mydung': 'Chúc mừng sinh nhật Quân nhé! Mong cậu tuổi mới luôn vui vẻ, hạnh phúc và gặt hái nhiều thành công.',
    'phamkimchi': 'Happy Birthday Quân! Chúc bạn một ngày ấm áp bên gia đình, tuổi mới bình an và rực rỡ.',
    'phuongthao': 'Chúc mừng sinh nhật Quân! Chúc cậu ngày càng đẹp trai, tài giỏi và tràn đầy năng lượng tích cực.',
    'kimchi2': 'Chúc mừng sinh nhật Quân! Chúc tuổi mới vạn sự như ý, công việc thuận buồm xuôi gió.',
    'minhthuy': 'Quân ơi chúc mừng sinh nhật nha! Chúc tuổi mới có thật nhiều niềm vui và nhận được nhiều yêu thương.',
    'nhuduong': 'Happy Birthday Quân! Mong tuổi mới mang đến cho cậu những điều tuyệt vời nhất, tình cảm viên mãn.',
    'quynhtrang': 'Chúc mừng sinh nhật Quân! Chúc cậu luôn mạnh khỏe, gặp nhiều may mắn và đạt mọi mục tiêu.',
    'tan': 'Chúc mừng sinh nhật Quân nhé! Tuổi mới phong độ ngời ngời, kiếm được nhiều tiền và thật chill.',
    'thaouyen': 'Happy birthday Quân! Chúc cậu có một ngày đặc biệt thật vui vẻ. Tuổi mới ngập tràn hạnh phúc nha!',
    'tuannguyen': 'Quân ơi chúc mừng sinh nhật! Chúc cậu sự nghiệp rộng mở, sức khỏe dồi dào, vạn sự hanh thông.',
    'huonglye': 'Chúc mừng sinh nhật Quân! Chúc một năm mới tràn đầy bình an, may mắn và mọi việc suôn sẻ.'
  };
  const DEFAULT_WISH = 'Chúc mừng sinh nhật Quân! Chúc cậu tuổi mới ngập tràn niềm vui, hạnh phúc và thành công!';

  function isBirthdayToday() {
    // ⚠️ TEST MODE: Luôn trả về true để test
    return true;

    /* Bản thật:
    try {
      const now = new Date();
      const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      return vnDate.getDate() === 22 && vnDate.getMonth() === 9; // Tháng 10 (0-indexed)
    } catch(_) { return false; }
    */
  }

  /* Giữ nguyên Countdown (nhưng Test Mode sẽ không dùng đến) */
  function getNextBirthday() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let target = new Date(`${currentYear}-10-22T00:00:00+07:00`);
    if (now.getTime() > target.getTime() + 24 * 60 * 60 * 1000 - 1) {
      target = new Date(`${currentYear + 1}-10-22T00:00:00+07:00`);
    }
    return target;
  }

  const BIRTHDAY_DATE = getNextBirthday();
  let _countdownTimer = null;

  function _pad2(n) { return String(n).padStart(2, '0'); }
  function _buildCountdownInner(diffMs) {
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `Còn <b>${_pad2(hours)}</b> Giờ : <b>${_pad2(minutes)}</b> Phút : <b>${_pad2(seconds)}</b> Giây nữa là đến sinh nhật`;
  }
  function _getCountdownHTML() {
    const diff = BIRTHDAY_DATE.getTime() - Date.now();
    if (diff <= 0) return '<span class="birthday-countdown ended">🎉 Chúc mừng sinh nhật Minh Quân! 🎂</span>';
    return `<span class="birthday-countdown">${_buildCountdownInner(diff)}</span>`;
  }
  function _updateCountdownLive() {
    const el = document.querySelector('.birthday-countdown');
    if (!el) { _stopCountdownTimer(); return; }
    if (el.classList.contains('ended')) { _stopCountdownTimer(); return; }
    const diff = BIRTHDAY_DATE.getTime() - Date.now();
    if (diff <= 0) {
      el.classList.add('ended');
      el.innerHTML = '🎉 Chúc mừng sinh nhật Minh Quân! 🎂';
      _stopCountdownTimer();
      return;
    }
    el.innerHTML = _buildCountdownInner(diff);
  }
  function _startCountdownTimer() {
    if (_countdownTimer) return;
    _updateCountdownLive();
    _countdownTimer = setInterval(_updateCountdownLive, 1000);
  }
  function _stopCountdownTimer() {
    if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
  }

  /* =========================================================
     FEED STYLES — inject 1 lần, khoá chiều cao + fade mượt
     ========================================================= */
  function _ensureFeedStyles() {
    if (document.getElementById('birthdayFeedStableStyle')) return;
    const s = document.createElement('style');
    s.id = 'birthdayFeedStableStyle';
    s.textContent = `
      #birthdayFeed.birthday-feed-container {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 62px !important;
        min-height: 62px !important;
        max-height: 62px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 0 12px !important;
        margin: 6px 0 !important;
        position: relative;
      }
      #birthdayFeed .birthday-feed-item {
        width: 100% !important;
        line-height: 1.4 !important;
        font-size: 12.5px !important;
        text-align: center !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        animation: none !important;
        transform: none !important;
      }
      #birthdayFeed .birthday-feed-item.spin-feed-item-out {
        animation: bdFeedFadeOut .4s ease forwards !important;
      }
      #birthdayFeed .birthday-feed-item.spin-feed-item-in {
        animation: bdFeedFadeIn .4s ease forwards !important;
      }
      @keyframes bdFeedFadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes bdFeedFadeIn  { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(s);
  }

  /* Feed logic */
  let _feedTimer = null;
  let _feedIndex = 0;
  let _feedList = [];

  function _getBirthdayFeedHTML() {
    _ensureFeedStyles();

    const currentUser = window.SRank?.Auth?.getCurrentUser?.();
    const un = String(currentUser?.username || '').toLowerCase();

    if (un === 'minhquan') {
      return `<div class="birthday-countdown ended" style="color:#d68f20; font-size:14px; font-weight:950; white-space:normal; line-height:1.4;">🎉 Hôm nay là sinh nhật của bạn! Chúc mừng sinh nhật Minh Quân! 🎂</div>`;
    }

    _feedList = Object.keys(BIRTHDAY_WISHES).map(username => {
      return { username: username, wish: BIRTHDAY_WISHES[username] };
    });
    if (!_feedList.length) return '';

    const first = _feedList[0];
    const nameStr = window.DN ? window.DN(first.username) : first.username;
    return `
      <div class="birthday-feed-container" id="birthdayFeed">
        <div class="birthday-feed-item" id="birthdayFeedItem">
          <span class="bd-name">${nameStr}</span>: <span class="bd-wish">"${first.wish}"</span>
        </div>
      </div>
    `;
  }

  function _startBirthdayFeed() {
    if (_feedTimer) return;
    const currentUser = window.SRank?.Auth?.getCurrentUser?.();
    const un = String(currentUser?.username || '').toLowerCase();
    if (un === 'minhquan' || !_feedList.length) return;
    _feedIndex = 0;

    _feedTimer = setInterval(function() {
      const el = document.getElementById('birthdayFeedItem');
      if (!el) { _stopBirthdayFeed(); return; }

      el.classList.add('spin-feed-item-out');
      setTimeout(function() {
        if (!document.getElementById('birthdayFeedItem')) return;
        _feedIndex = (_feedIndex + 1) % _feedList.length;
        const next = _feedList[_feedIndex];
        const parent = document.getElementById('birthdayFeed');
        if (parent) {
          const nameStr = window.DN ? window.DN(next.username) : next.username;
          parent.innerHTML = `
            <div class="birthday-feed-item spin-feed-item-in" id="birthdayFeedItem">
              <span class="bd-name">${nameStr}</span>: <span class="bd-wish">"${next.wish}"</span>
            </div>
          `;
        }
      }, 400);
    }, 2500);
  }

  function _stopBirthdayFeed() {
    if (_feedTimer) { clearInterval(_feedTimer); _feedTimer = null; }
  }

  let _lastTop3Signature = '';
  const TITLE_HTML = '<span class="rainbow-line">Happy Birthday</span><span class="rainbow-line">Minh Quân</span>';

  function _fallbackRender() {
    const els = S.els;
    if (!els || !els.question) return;
    try {
      const ci = __getCtaRender();
      const stateName = _resolveCtaState(ci);
      const ctaLocked = _isCtaLocked(ci, stateName);

      els.question.innerHTML = `
        <span class="landing-kicker">🐱 DAILY TEAM HUB</span>
        <span class="landing-title rainbow-birthday">${TITLE_HTML}</span>
        ${isBirthdayToday() ? _getBirthdayFeedHTML() : _getCountdownHTML()}
        <span class="landing-cta${ctaLocked ? ' locked' : ''}" data-cta="${stateName}" role="button">${_esc(ci.text)}</span>
      `;
      els.question.classList.add('play');
      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = ctaLocked ? 'none' : 'auto';
      if (isBirthdayToday()) _startBirthdayFeed();
      else _startCountdownTimer();
    } catch (e) { console.error('[LandingView] Fallback crash:', e); }
  }

  function __getCtaRender() {
    try { if (typeof window.__getCtaInfo === 'function') { const i = window.__getCtaInfo(); if (i && i.text) return i; } } catch (_) {}
    return { text: '🔐 Đăng nhập', locked: false };
  }

  function _resolveCtaState(ci) {
    if (ci && ci.action === 'shop') return 'shop';
    if (ci && ci.locked) return 'locked';
    const txt = String(ci && ci.text || '');
    if (/đăng nhập/i.test(txt)) return 'login';
    if (/đã chấm công/i.test(txt)) return 'done';
    return 'checkin';
  }

  function _isCtaLocked(ci, stateName) {
    if (stateName === 'shop') return false;
    return !!(ci && ci.locked);
  }

  function __getKickerRender() {
    try { if (typeof window.__getKickerRender === 'function') { const r = window.__getKickerRender(); if (r && r.version) return r; } } catch (_) {}
    return { html: null, version: 'default', text: '🐱 DAILY TEAM HUB' };
  }

  function _esc(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function top3Signature(list) { return list.map(p => `${p.name}|${p.time}|${S.getAvatarUrl(p.name)}`).join('::'); }

  function buildTop3HTML(top3) {
    if (!top3.length) return '<div class="landing-top3-empty">Chưa có ai check hôm nay — hãy là người đầu tiên! 🐱</div>';
    function makeAvatarHtml(p, cls) {
      const u = S.getAvatarUrl(p.name);
      const su = u ? u.replace(/"/g, '&quot;') : '';
      const ini = String((window.DN ? window.DN(p.name) : p.name) || '?').trim().slice(0, 1).toUpperCase();
      if (u) return `<img src="${su}" alt="" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.classList.add('show');"><span class="${cls}-fallback">${ini}</span>`;
      return `<span class="${cls}-fallback show">${ini}</span>`;
    }
    function makeName(p) { return _esc(String((window.DN ? window.DN(p.name) : p.name) || '')); }

    const t1 = top3[0], t2 = top3[1], t3 = top3[2];
    const court = top3.slice(3);
    const courtL = court.filter((_, i) => i % 2 === 0);
    const courtR = court.filter((_, i) => i % 2 === 1);

    let podiumHtml = '<div class="court-podium">';
    podiumHtml += '<div class="podium-slot podium-slot-2">';
    if (t2) podiumHtml += `<div class="advisor rank-2" data-name="${_esc(t2.name)}"><div class="advisor-crown">☀️</div><div class="advisor-avatar">${makeAvatarHtml(t2, 'advisor-avatar')}</div><div class="advisor-name" title="${makeName(t2)}">${makeName(t2)}</div><div class="advisor-time">${t2.time}</div></div>`;
    podiumHtml += '</div>';
    podiumHtml += '<div class="podium-slot podium-slot-1">';
    if (t1) podiumHtml += `<div class="court-throne" data-name="${_esc(t1.name)}"><div class="throne-crown">👑</div><div class="throne-avatar">${makeAvatarHtml(t1, 'throne-avatar')}</div><div class="throne-name" title="${makeName(t1)}">${makeName(t1)}</div><div class="throne-time">${t1.time}</div></div>`;
    podiumHtml += '</div>';
    podiumHtml += '<div class="podium-slot podium-slot-3">';
    if (t3) podiumHtml += `<div class="advisor rank-3" data-name="${_esc(t3.name)}"><div class="advisor-crown">🌙</div><div class="advisor-avatar">${makeAvatarHtml(t3, 'advisor-avatar')}</div><div class="advisor-name" title="${makeName(t3)}">${makeName(t3)}</div><div class="advisor-time">${t3.time}</div></div>`;
    podiumHtml += '</div>';
    podiumHtml += '</div>';

    let courtiersHtml = '';
    if (court.length > 0) {
      let myRawName = '';
      try { const u = window.SRank?.Auth?.getCurrentUser?.(); myRawName = u && u.displayName ? String(u.displayName).trim() : ''; } catch(_){}
      function makeCourtier(p) {
        const isMe = myRawName && p.name === myRawName;
        const meStyle = isMe ? ' style="color:#8B4513;background:rgba(200,150,80,.15);border-radius:6px;padding:2px 6px;margin:-2px -6px"' : '';
        return `<div class="courtier" data-name="${_esc(p.name)}"><div class="courtier-avatar">${makeAvatarHtml(p, 'courtier-avatar')}</div><div class="courtier-info"><div class="courtier-name"${meStyle} title="${makeName(p)}">${makeName(p)}</div><div class="courtier-time">${p.time}</div></div></div>`;
      }
      courtiersHtml += '<div class="court-courtiers-label"><span>✦ QUẦN THẦN ✦</span></div><div class="court-courtiers">';
      courtiersHtml += '<div class="courtiers-col">' + courtL.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '<div class="courtiers-col">' + courtR.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '</div>';
    }
    return `<div class="landing-top3 landing-court">${podiumHtml}${courtiersHtml}</div>`;
  }

  function renderLandingState(forceFullReplay) {
    forceFullReplay = !!forceFullReplay;
    try {
      const els = S.els;
      if (!els || !els.question) return;
      const names = S.names || [], checked = S.checked || [], times = S.times || [];
      const locked = S.isChecklistLocked();
      els.question.classList.toggle('checklist-locked-home', locked);
      const checkedList = names.map((name, i) => ({ name: String(name || '').trim(), time: String(times[i] || '').trim(), checked: !!checked[i] })).filter(p => p.checked && p.time && p.name).sort((a, b) => a.time.localeCompare(b.time));
      const top3 = checkedList.slice(0, 20);
      const newSig = top3Signature(top3);
      const top3Changed = newSig !== _lastTop3Signature;
      const top3HTML = buildTop3HTML(top3);
      els.question.classList.toggle('landing-court-active', top3.length > 3);
      const titleEl = els.question.querySelector('.landing-title');
      const hasStructure = !!titleEl && !forceFullReplay;

      const isBday = isBirthdayToday();
      const dynamicHtml = isBday ? _getBirthdayFeedHTML() : _getCountdownHTML();

      if (!hasStructure) {
        const kr = __getKickerRender();
        const ci = __getCtaRender();
        const ctaState = _resolveCtaState(ci);
        const ctaLocked = _isCtaLocked(ci, ctaState);
        const ctaIsLockedState = (ctaState === 'locked');

        els.question.innerHTML = `
          <span class="landing-kicker" data-kicker-version="${kr.version}">${kr.html || kr.text}</span>
          <span class="landing-title rainbow-birthday">${TITLE_HTML}</span>
          ${dynamicHtml}
          ${top3HTML}
          <span class="landing-cta${ctaLocked ? ' locked' : ''}" data-cta="${ctaState}" role="button" ${ctaLocked ? 'aria-disabled="true" tabindex="-1"' : 'tabindex="0"'}>${_esc(ci.text)}</span>
          ${ctaIsLockedState ? `<span class="landing-lock-note">Sau ${S.checklistLockTime} sẽ khoá Checklist nha mn 🥰</span>` : ''}
        `;
        _lastTop3Signature = newSig;
        els.question.style.removeProperty('--top3-base');
        void els.question.offsetWidth;
        els.question.classList.add('play');
        els.question.style.opacity = '1';
        els.question.style.transform = 'scale(1)';
        els.question.style.pointerEvents = ctaLocked ? 'none' : 'auto';
        if (isBday) _startBirthdayFeed(); else _startCountdownTimer();
        return;
      }

      if (titleEl) {
        const needFix = !titleEl.classList.contains('rainbow-birthday') || !titleEl.querySelector('.rainbow-line');
        if (needFix) { titleEl.className = 'landing-title rainbow-birthday'; titleEl.innerHTML = TITLE_HTML; }
      }

      const hasCountdown = !!els.question.querySelector('.birthday-countdown');
      const hasFeed = !!els.question.querySelector('.birthday-feed-container');
      if (isBday && !hasFeed) {
        els.question.querySelector('.birthday-countdown')?.remove();
        els.question.querySelector('.landing-title')?.insertAdjacentHTML('afterend', dynamicHtml);
        _stopCountdownTimer(); _startBirthdayFeed();
      } else if (!isBday && !hasCountdown) {
        els.question.querySelector('.birthday-feed-container')?.remove();
        els.question.querySelector('.landing-title')?.insertAdjacentHTML('afterend', dynamicHtml);
        _stopBirthdayFeed(); _startCountdownTimer();
      } else {
        if (isBday) _startBirthdayFeed(); else _startCountdownTimer();
      }

      if (top3Changed) {
        els.question.querySelector('.landing-top3-label')?.remove();
        els.question.querySelector('.landing-top3')?.remove();
        els.question.querySelector('.landing-top3-empty')?.remove();
        const ctaBefore = els.question.querySelector('.landing-cta');
        if (ctaBefore && top3HTML) {
          ctaBefore.insertAdjacentHTML('beforebegin', top3HTML);
          _lastTop3Signature = newSig;
          els.question.classList.remove('top3-replay');
          void els.question.offsetWidth;
          els.question.classList.add('top3-replay');
        }
      }

      const kickerEl = els.question.querySelector('.landing-kicker');
      if (kickerEl) {
        const kr = __getKickerRender();
        if (kickerEl.dataset.kickerVersion !== kr.version) {
          if (kr.html) kickerEl.innerHTML = kr.html; else kickerEl.textContent = kr.text;
          kickerEl.dataset.kickerVersion = kr.version;
        }
      }

      const cta = els.question.querySelector('.landing-cta');
      const lockNote = els.question.querySelector('.landing-lock-note');
      const ci2 = __getCtaRender();
      const state2 = _resolveCtaState(ci2);
      const locked2 = _isCtaLocked(ci2, state2);
      const isLockedState = (state2 === 'locked');

      if (cta) {
        if (locked2) {
          if (!cta.classList.contains('locked')) { cta.classList.add('locked'); cta.setAttribute('aria-disabled', 'true'); cta.setAttribute('tabindex', '-1'); }
        } else {
          if (cta.classList.contains('locked')) { cta.classList.remove('locked'); cta.removeAttribute('aria-disabled'); cta.setAttribute('tabindex', '0'); }
        }
        if (cta.textContent !== ci2.text) cta.textContent = ci2.text;
        if (cta.dataset.cta !== state2) cta.dataset.cta = state2;
      }

      if (isLockedState) {
        const noteTxt = `Sau ${S.checklistLockTime} sẽ khoá Checklist nha mn 🥰`;
        if (!lockNote) { const n = document.createElement('span'); n.className = 'landing-lock-note'; n.textContent = noteTxt; els.question.appendChild(n); }
        else if (lockNote.textContent !== noteTxt) { lockNote.textContent = noteTxt; }
      } else { lockNote?.remove(); }

      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = locked2 ? 'none' : 'auto';
    } catch (e) { console.error('[LandingView] CRASH:', e); _fallbackRender(); }
  }

  function maybeRenderLanding() {
    if (S.els.checklistPanel && S.els.checklistPanel.classList.contains('show')) return;
    renderLandingState();
    if (S.onAfterRenderLanding) S.onAfterRenderLanding();
  }

  function resetHome() {
    try {
      document.getElementById('q2answers')?.remove();
      window.__clV6?.close?.();
      if (S.onResetHome) S.onResetHome();
      _lastTop3Signature = '';
      renderLandingState(true);
      if (S.els.hint) S.els.hint.textContent = S.isChecklistLocked() ? '' : (S.names.length ? 'Chạm vào câu hỏi' : 'Đang tải dữ liệu…');
    } catch (e) { console.error('[LandingView] resetHome crash:', e); }
  }

  window.LandingView = {
    render: renderLandingState, maybe: maybeRenderLanding, resetHome: resetHome,
    _getSignature: () => _lastTop3Signature, _resetSignature: () => { _lastTop3Signature = ''; }
  };
  if (S.callbacks) {
    S.callbacks.renderLanding = renderLandingState;
    S.callbacks.maybeRenderLanding = maybeRenderLanding;
    S.callbacks.resetHome = resetHome;
  }
  document.addEventListener('visibilitychange', function() { if (!document.hidden) _updateCountdownLive(); });
  console.log('[LandingView] v3.1 ready ✓ (Birthday Feed Forced + Stable Layout)');
})();