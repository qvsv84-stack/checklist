/* =========================================================
   LANDING VIEW — v5.0 (lyrics thay countdown)
   ---------------------------------------------------------
   v5.0:
   - Nếu admin đã đặt lyrics (site_lyrics) → hiện LYRICS bay lên
   - Nếu chưa có lyrics → fallback countdown khoá Checklist
   - Mỗi câu lyric ~3.5s: fade in → giữ → fade out bay lên
   - Admin long-press (lyric HOẶC countdown) → mở editor lyrics
   ========================================================= */
(function(){
  "use strict";
  if (window.LandingView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[LandingView] thiếu SrankCore');
    return;
  }

  /* ═══════════════════════════════════════════════════════
     ⭐ TITLE — editable qua __bdTitle
     ═══════════════════════════════════════════════════════ */
  function _isAdmin() {
    try {
      if (window.__bdTitle && typeof window.__bdTitle.isAdmin === 'function') {
        return !!window.__bdTitle.isAdmin();
      }
    } catch (_) {}
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return false;
      if (window.Role?.isAdmin) {
        try { return !!window.Role.isAdmin(u); } catch (_) {}
      }
      const un = String(u.username || '').toLowerCase();
      return un === 'minhquan' || un === 'admin';
    } catch (_) { return false; }
  }

  function _renderTitleArea() {
    const bd = window.__bdTitle;
    let html = '';
    if (bd && typeof bd.getHTML === 'function') {
      try { html = bd.getHTML() || ''; } catch (_) {}
    }
    if (!html) {
      if (!_isAdmin()) return '';
      return '<span class="landing-title rainbow-birthday" ' +
        'style="opacity:.35;font-size:13px;font-weight:700;cursor:pointer;' +
        'user-select:none;-webkit-user-select:none;" ' +
        'data-placeholder="1">✏️ Nhấn giữ để thêm tiêu đề</span>';
    }
    return '<span class="landing-title rainbow-birthday">' + html + '</span>';
  }

  /* ═══════════════════════════════════════════════════════
     ⭐ LYRICS — player bay lên
     ═══════════════════════════════════════════════════════ */
  const PHRASE_MS = 3500;
  let _lyricTimer = null;
  let _lyricIndex = 0;
  let _lyricPhrases = [];

  function _ensureLyricStyles() {
    if (document.getElementById('landingLyricStyle')) return;
    const s = document.createElement('style');
    s.id = 'landingLyricStyle';
    s.textContent = `
      @keyframes lyricFlyUp {
        0%   { opacity: 0; transform: translateY(20px); }
        15%  { opacity: 1; transform: translateY(0); }
        80%  { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-32px); }
      }

      .landing-lyric {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 36px !important;
        min-height: 36px !important;
        max-height: 36px !important;
        overflow: hidden !important;
        position: relative !important;
        margin: 0 auto 14px !important;
        padding: 0 12px !important;
        box-sizing: border-box !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }

      .landing-lyric-inner {
        display: block !important;
        text-align: center !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        color: #6a4a20 !important;
        letter-spacing: 0.01em !important;
        line-height: 1.4 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 100% !important;
        animation: lyricFlyUp ${PHRASE_MS}ms ease-in-out infinite !important;
        will-change: transform, opacity !important;
      }
    `;
    document.head.appendChild(s);
  }

  function _getLyricPhrases() {
    const bd = window.__bdTitle;
    if (bd && typeof bd.getLyricsPhrases === 'function') {
      try {
        const p = bd.getLyricsPhrases();
        if (Array.isArray(p)) return p;
      } catch (_) {}
    }
    return [];
  }

  function _renderLyricPhrase() {
    const el = document.getElementById('landingLyricInner');
    if (!el) return;
    if (!_lyricPhrases.length) { el.textContent = ''; return; }
    const phrase = _lyricPhrases[_lyricIndex % _lyricPhrases.length];
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow → restart animation
    el.style.animation = '';
    el.textContent = phrase;
  }

  function _nextLyric() {
    if (document.hidden) return;
    if (!_lyricPhrases.length) return;
    _lyricIndex = (_lyricIndex + 1) % _lyricPhrases.length;
    _renderLyricPhrase();
  }

  function _startLyricPlayer() {
    _lyricPhrases = _getLyricPhrases();
    if (!_lyricPhrases.length) { _stopLyricPlayer(); return false; }
    if (_lyricTimer) return true;
    _lyricIndex = 0;
    _renderLyricPhrase();
    _lyricTimer = setInterval(_nextLyric, PHRASE_MS);
    return true;
  }

  function _stopLyricPlayer() {
    if (_lyricTimer) {
      clearInterval(_lyricTimer);
      _lyricTimer = null;
    }
  }

  function _getLyricHTML() {
    _ensureLyricStyles();
    const phrases = _getLyricPhrases();
    const firstTxt = phrases[0] ? _esc(phrases[0]) : '';
    return '<span class="landing-lyric" id="landingLyric" ' +
      'aria-label="Lời bài hát"><span class="landing-lyric-inner" ' +
      'id="landingLyricInner">' + firstTxt + '</span></span>';
  }

  /* ═══════════════════════════════════════════════════════
     ⭐ COUNTDOWN KHOÁ CHECKLIST — fallback khi không có lyrics
     ═══════════════════════════════════════════════════════ */
  let _countdownTimer = null;

  function _pad2(n) { return String(n).padStart(2, '0'); }

  function _getLockTimeHM() {
    let str = '21:00';
    try {
      if (S && S.checklistLockTime) str = String(S.checklistLockTime);
      else if (typeof localStorage !== 'undefined') {
        str = localStorage.getItem('srank_checklist_lock_time_v1') || '21:00';
      }
    } catch (_) {}
    const parts = str.split(':');
    return {
      hh: Math.max(0, Math.min(23, parseInt(parts[0], 10) || 21)),
      mm: Math.max(0, Math.min(59, parseInt(parts[1], 10) || 0))
    };
  }

  function _getVNNowParts() {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const p = {};
      fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return {
        year: parseInt(p.year, 10), month: parseInt(p.month, 10) - 1,
        day: parseInt(p.day, 10), hour: parseInt(p.hour, 10),
        minute: parseInt(p.minute, 10), second: parseInt(p.second, 10)
      };
    } catch (_) {
      const n = new Date();
      return {
        year: n.getFullYear(), month: n.getMonth(), day: n.getDate(),
        hour: n.getHours(), minute: n.getMinutes(), second: n.getSeconds()
      };
    }
  }

  function _getLockState() {
    const hm = _getLockTimeHM();
    const p = _getVNNowParts();
    const lockToday = Date.UTC(p.year, p.month, p.day, hm.hh - 7, hm.mm, 0, 0);
    const now = Date.now();
    if (now >= lockToday) {
      return { targetEpoch: Date.UTC(p.year, p.month, p.day + 1, -7, 0, 0, 0), isLocked: true };
    }
    return { targetEpoch: lockToday, isLocked: false };
  }

  function _buildCountdownInner(diffMs, isLocked) {
    const t = Math.max(0, Math.floor(diffMs / 1000));
    const hh = _pad2(Math.floor(t / 3600));
    const mm = _pad2(Math.floor((t % 3600) / 60));
    const ss = _pad2(t % 60);
    if (isLocked) {
      return `🔒 Đã khoá · Mở lại sau <b>${hh}</b> Giờ : <b>${mm}</b> Phút : <b>${ss}</b> Giây`;
    }
    return `Còn <b>${hh}</b> Giờ : <b>${mm}</b> Phút : <b>${ss}</b> Giây nữa là khoá Checklist`;
  }

  function _getCountdownHTML() {
    const st = _getLockState();
    const diff = st.targetEpoch - Date.now();
    const cls = st.isLocked ? 'birthday-countdown ended' : 'birthday-countdown';
    return `<span class="${cls}">${_buildCountdownInner(diff, st.isLocked)}</span>`;
  }

  function _updateCountdownLive() {
    const el = document.querySelector('.birthday-countdown');
    if (!el) { _stopCountdownTimer(); return; }
    const st = _getLockState();
    const diff = st.targetEpoch - Date.now();
    const isEnded = el.classList.contains('ended');
    if (st.isLocked && !isEnded) el.classList.add('ended');
    if (!st.isLocked && isEnded) el.classList.remove('ended');
    el.innerHTML = _buildCountdownInner(Math.max(0, diff), st.isLocked);
  }

  function _startCountdownTimer() {
    if (_countdownTimer) return;
    _updateCountdownLive();
    _countdownTimer = setInterval(_updateCountdownLive, 1000);
  }

  function _stopCountdownTimer() {
    if (_countdownTimer) {
      clearInterval(_countdownTimer);
      _countdownTimer = null;
    }
  }

  /* ═══════════════════════════════════════════════════════
     DYNAMIC AREA — lyrics ưu tiên, countdown fallback
     ═══════════════════════════════════════════════════════ */
  function _getDynamicHTML() {
    if (_getLyricPhrases().length) return _getLyricHTML();
    return _getCountdownHTML();
  }

  function _startDynamic() {
    if (_startLyricPlayer()) {
      _stopCountdownTimer();
    } else {
      _stopLyricPlayer();
      _startCountdownTimer();
    }
  }

  /* ═══════════════════════════════════════════════════════
     FALLBACK
     ═══════════════════════════════════════════════════════ */
  let _lastTop3Signature = '';

  function _fallbackRender() {
    const els = S.els;
    if (!els || !els.question) return;
    try {
      const ci = __getCtaRender();
      const stateName = _resolveCtaState(ci);
      const ctaLocked = _isCtaLocked(ci, stateName);

      els.question.innerHTML = `
        <span class="landing-kicker">🐱 DAILY TEAM HUB</span>
        ${_renderTitleArea()}
        ${_getDynamicHTML()}
        <span class="landing-cta${ctaLocked ? ' locked' : ''}" data-cta="${stateName}" role="button">${_esc(ci.text)}</span>
      `;
      els.question.classList.add('play');
      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = ctaLocked ? 'none' : 'auto';

      _startDynamic();
      console.warn('[LandingView] FALLBACK RENDERED');
    } catch (e) {
      console.error('[LandingView] Fallback crash:', e);
    }
  }

  /* ═══════════════════════════════════════════════════════
     CTA HELPERS
     ═══════════════════════════════════════════════════════ */
  function __getCtaRender() {
    try {
      if (typeof window.__getCtaInfo === 'function') {
        const i = window.__getCtaInfo();
        if (i && i.text) return i;
      }
    } catch (_) {}
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
    try {
      if (typeof window.__getKickerRender === 'function') {
        const r = window.__getKickerRender();
        if (r && r.version) return r;
      }
    } catch (_) {}
    return { html: null, version: 'default', text: '🐱 DAILY TEAM HUB' };
  }

  function _esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function top3Signature(list) {
    return list.map(function(p) {
      return `${p.name}|${p.time}|${S.getAvatarUrl(p.name)}`;
    }).join('::');
  }

  /* ═══════════════════════════════════════════════════════
     TOP 3 BUILDER
     ═══════════════════════════════════════════════════════ */
  function buildTop3HTML(top3) {
    if (!top3.length) {
      return '<div class="landing-top3-empty">Chưa có ai check hôm nay — hãy là người đầu tiên! 🐱</div>';
    }

    function makeAvatarHtml(p, cls) {
      const u = S.getAvatarUrl(p.name);
      const su = u ? u.replace(/"/g, '&quot;') : '';
      const ini = String((window.DN ? window.DN(p.name) : p.name) || '?').trim().slice(0, 1).toUpperCase();
      if (u) {
        return `<img src="${su}" alt="" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.classList.add('show');"><span class="${cls}-fallback">${ini}</span>`;
      }
      return `<span class="${cls}-fallback show">${ini}</span>`;
    }

    function makeName(p) {
      return _esc(String((window.DN ? window.DN(p.name) : p.name) || ''));
    }

    const t1 = top3[0], t2 = top3[1], t3 = top3[2];
    const court = top3.slice(3);
    const courtL = court.filter((_, i) => i % 2 === 0);
    const courtR = court.filter((_, i) => i % 2 === 1);

    let podiumHtml = '<div class="court-podium">';

    podiumHtml += '<div class="podium-slot podium-slot-2">';
    if (t2) {
      podiumHtml += `
        <div class="advisor rank-2" data-name="${_esc(t2.name)}">
          <div class="advisor-crown">☀️</div>
          <div class="advisor-avatar">${makeAvatarHtml(t2, 'advisor-avatar')}</div>
          <div class="advisor-name" title="${makeName(t2)}">${makeName(t2)}</div>
          <div class="advisor-time">${t2.time}</div>
        </div>
      `;
    }
    podiumHtml += '</div>';

    podiumHtml += '<div class="podium-slot podium-slot-1">';
    if (t1) {
      podiumHtml += `
        <div class="court-throne" data-name="${_esc(t1.name)}">
          <div class="throne-crown">👑</div>
          <div class="throne-avatar">${makeAvatarHtml(t1, 'throne-avatar')}</div>
          <div class="throne-name" title="${makeName(t1)}">${makeName(t1)}</div>
          <div class="throne-time">${t1.time}</div>
        </div>
      `;
    }
    podiumHtml += '</div>';

    podiumHtml += '<div class="podium-slot podium-slot-3">';
    if (t3) {
      podiumHtml += `
        <div class="advisor rank-3" data-name="${_esc(t3.name)}">
          <div class="advisor-crown">🌙</div>
          <div class="advisor-avatar">${makeAvatarHtml(t3, 'advisor-avatar')}</div>
          <div class="advisor-name" title="${makeName(t3)}">${makeName(t3)}</div>
          <div class="advisor-time">${t3.time}</div>
        </div>
      `;
    }
    podiumHtml += '</div>';

    podiumHtml += '</div>';

    let courtiersHtml = '';
    if (court.length > 0) {
      let myRawName = '';
      try {
        const u = window.SRank?.Auth?.getCurrentUser?.();
        myRawName = u && u.displayName ? String(u.displayName).trim() : '';
      } catch(_){}

      function makeCourtier(p) {
        const isMe = myRawName && p.name === myRawName;
        const meStyle = isMe ? ' style="color:#8B4513;background:rgba(200,150,80,.15);border-radius:6px;padding:2px 6px;margin:-2px -6px"' : '';
        return `
          <div class="courtier" data-name="${_esc(p.name)}">
            <div class="courtier-avatar">${makeAvatarHtml(p, 'courtier-avatar')}</div>
            <div class="courtier-info">
              <div class="courtier-name"${meStyle} title="${makeName(p)}">${makeName(p)}</div>
              <div class="courtier-time">${p.time}</div>
            </div>
          </div>
        `;
      }

      courtiersHtml += '<div class="court-courtiers-label"><span>✦ QUẦN THẦN ✦</span></div>';
      courtiersHtml += '<div class="court-courtiers">';
      courtiersHtml += '<div class="courtiers-col">' + courtL.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '<div class="courtiers-col">' + courtR.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '</div>';
    }

    return `<div class="landing-top3 landing-court">${podiumHtml}${courtiersHtml}</div>`;
  }

  /* ═══════════════════════════════════════════════════════
     RENDER MAIN
     ═══════════════════════════════════════════════════════ */
  function renderLandingState(forceFullReplay) {
    forceFullReplay = !!forceFullReplay;
    try {
      const els = S.els;
      if (!els || !els.question) return;

      const names = S.names || [];
      const checked = S.checked || [];
      const times = S.times || [];

      const locked = S.isChecklistLocked();
      els.question.classList.toggle('checklist-locked-home', locked);

      const checkedList = names.map((name, i) => ({
        name: String(name || '').trim(),
        time: String(times[i] || '').trim(),
        checked: !!checked[i]
      })).filter(p => p.checked && p.time && p.name)
        .sort((a, b) => a.time.localeCompare(b.time));

      const top3 = checkedList.slice(0, 20);
      const newSig = top3Signature(top3);
      const top3Changed = newSig !== _lastTop3Signature;

      const top3HTML = buildTop3HTML(top3);
      els.question.classList.toggle('landing-court-active', top3.length > 3);

      // "Có structure" = đã có lyric hoặc countdown
      const hasDynamic =
        !!els.question.querySelector('.landing-lyric') ||
        !!els.question.querySelector('.birthday-countdown');
      const hasStructure = hasDynamic && !forceFullReplay;

      /* ═══════ CASE 1: BUILD ═══════ */
      if (!hasStructure) {
        const kr = __getKickerRender();
        const kh = kr.html || kr.text;
        const kv = kr.version;

        const ci = __getCtaRender();
        const ctaState = _resolveCtaState(ci);
        const ctaLocked = _isCtaLocked(ci, ctaState);
        const ctaIsLockedState = (ctaState === 'locked');

        els.question.innerHTML = `
          <span class="landing-kicker" data-kicker-version="${kv}">${kh}</span>
          ${_renderTitleArea()}
          ${_getDynamicHTML()}
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

        _startDynamic();
        return;
      }

      /* ═══════ CASE 2: UPDATE ═══════ */

      /* 2a. Dynamic — swap lyric ↔ countdown nếu cần */
      const wantsLyric = _getLyricPhrases().length > 0;
      const hasLyricEl = !!els.question.querySelector('.landing-lyric');
      const hasCountdownEl = !!els.question.querySelector('.birthday-countdown');

      if (wantsLyric && !hasLyricEl) {
        if (hasCountdownEl) els.question.querySelector('.birthday-countdown')?.remove();
        const anchor = els.question.querySelector('.landing-title') || els.question.querySelector('.landing-kicker');
        if (anchor) anchor.insertAdjacentHTML('afterend', _getLyricHTML());
        _stopCountdownTimer();
        _startLyricPlayer();
      } else if (!wantsLyric && !hasCountdownEl) {
        if (hasLyricEl) els.question.querySelector('.landing-lyric')?.remove();
        const anchor = els.question.querySelector('.landing-title') || els.question.querySelector('.landing-kicker');
        if (anchor) anchor.insertAdjacentHTML('afterend', _getCountdownHTML());
        _stopLyricPlayer();
        _startCountdownTimer();
      } else {
        // Cùng loại → đảm bảo timer chạy
        _startDynamic();
      }

      /* 2b. Update top3 */
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

      /* 2c. Update kicker */
      const kickerEl = els.question.querySelector('.landing-kicker');
      if (kickerEl) {
        const kr = __getKickerRender();
        if (kickerEl.dataset.kickerVersion !== kr.version) {
          if (kr.html) kickerEl.innerHTML = kr.html;
          else kickerEl.textContent = kr.text;
          kickerEl.dataset.kickerVersion = kr.version;
        }
      }

      /* 2d. Update CTA */
      const cta = els.question.querySelector('.landing-cta');
      const lockNote = els.question.querySelector('.landing-lock-note');

      const ci2 = __getCtaRender();
      const state2 = _resolveCtaState(ci2);
      const locked2 = _isCtaLocked(ci2, state2);
      const isLockedState = (state2 === 'locked');

      if (cta) {
        if (locked2) {
          if (!cta.classList.contains('locked')) {
            cta.classList.add('locked');
            cta.setAttribute('aria-disabled', 'true');
            cta.setAttribute('tabindex', '-1');
          }
        } else {
          if (cta.classList.contains('locked')) {
            cta.classList.remove('locked');
            cta.removeAttribute('aria-disabled');
            cta.setAttribute('tabindex', '0');
          }
        }
        if (cta.textContent !== ci2.text) cta.textContent = ci2.text;
        if (cta.dataset.cta !== state2) cta.dataset.cta = state2;
      }

      if (isLockedState) {
        const noteTxt = `Sau ${S.checklistLockTime} sẽ khoá Checklist nha mn 🥰`;
        if (!lockNote) {
          const n = document.createElement('span');
          n.className = 'landing-lock-note';
          n.textContent = noteTxt;
          els.question.appendChild(n);
        } else if (lockNote.textContent !== noteTxt) {
          lockNote.textContent = noteTxt;
        }
      } else {
        lockNote?.remove();
      }

      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = locked2 ? 'none' : 'auto';

    } catch (e) {
      console.error('[LandingView] CRASH:', e);
      _fallbackRender();
    }
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
      if (S.els.hint) {
        S.els.hint.textContent = S.isChecklistLocked() ? '' : (S.names.length ? 'Chạm vào câu hỏi' : 'Đang tải dữ liệu…');
      }
    } catch (e) {
      console.error('[LandingView] resetHome crash:', e);
    }
  }

  window.LandingView = {
    render: renderLandingState,
    maybe: maybeRenderLanding,
    resetHome: resetHome,
    _getSignature: function() { return _lastTop3Signature; },
    _resetSignature: function() { _lastTop3Signature = ''; }
  };

  if (S.callbacks) {
    S.callbacks.renderLanding = renderLandingState;
    S.callbacks.maybeRenderLanding = maybeRenderLanding;
    S.callbacks.resetHome = resetHome;
  }

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) _updateCountdownLive();
  });

  /* Re-render khi admin đổi title hoặc lyrics */
  window.addEventListener('bdTitleChanged', function () {
    try { renderLandingState(true); }
    catch (e) { console.error('[LandingView] bdTitle re-render:', e); }
  });
  window.addEventListener('bdLyricsChanged', function () {
    try { _stopLyricPlayer(); renderLandingState(true); }
    catch (e) { console.error('[LandingView] bdLyrics re-render:', e); }
  });

  console.log('[LandingView] v5.0 ready ✓ (lyrics > countdown)');
})();