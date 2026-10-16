/* =========================================================
   LANDING VIEW — v1.2
   ---------------------------------------------------------
   v1.2 FIX:
   - Case 1 (build toàn bộ): dùng __getCtaInfo() thay vì
     hard-code "locked" → user đã check thấy Shop dù locked
   - Case 2 (update in-place): pointerEvents dựa vào CTA
     locked (không phải checklist locked)
   v1.1:
   - action === 'shop'
   ========================================================= */
(function(){
  "use strict";
  if (window.LandingView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[LandingView] window.SrankCore chưa load');
    return;
  }

  let _lastTop3Signature = '';

  const top3Signature = list =>
    list.map(p => `${p.name}|${p.time}|${S.getAvatarUrl(p.name)}`).join('::');

  function __getCtaRender() {
    try {
      if (typeof window.__getCtaInfo === 'function') {
        const i = window.__getCtaInfo();
        if (i && i.text) return i;
      }
    } catch (_) {}
    return { text: '🔐 Đăng nhập', locked: false };
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

  function renderLandingState(forceFullReplay = false) {
    const els = S.els;
    if (!els.question) return;

    const names = S.names;
    const checked = S.checked;
    const times = S.times;

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

    let top3HTML = '';
    if (top3.length === 0) {
      top3HTML = '<div class="landing-top3-empty">Chưa có ai check hôm nay — hãy là người đầu tiên! 🐱</div>';
    } else {
      const _av = (p, cls) => {
        const u = S.getAvatarUrl(p.name);
        const su = u ? u.replace(/"/g, '&quot;') : '';
        const ini = String((window.DN ? window.DN(p.name) : p.name) || '?').trim().slice(0, 1).toUpperCase();
        return u
          ? `<img src="${su}" alt="" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.classList.add('show');"><span class="${cls}-fallback">${ini}</span>`
          : `<span class="${cls}-fallback show">${ini}</span>`;
      };
      const _nm = p => String((window.DN ? window.DN(p.name) : p.name) || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      const _t1 = top3[0], _t2 = top3[1], _t3 = top3[2];
      const _court = top3.slice(3);
      const _L = _court.filter((_, i) => i % 2 === 0);
      const _R = _court.filter((_, i) => i % 2 === 1);

      const _podium = `<div class="court-podium">`
        + `<div class="podium-slot podium-slot-2">${_t2 ? `<div class="advisor rank-2" data-name="${S.escapeHtml(_t2.name)}"><div class="advisor-crown">☀️</div><div class="advisor-avatar">${_av(_t2, 'advisor-avatar')}</div><div class="advisor-name" title="${_nm(_t2)}">${_nm(_t2)}</div><div class="advisor-time">${_t2.time}</div></div>` : ''}</div>`
        + `<div class="podium-slot podium-slot-1">${_t1 ? `<div class="court-throne" data-name="${S.escapeHtml(_t1.name)}"><div class="throne-crown">👑</div><div class="throne-avatar">${_av(_t1, 'throne-avatar')}</div><div class="throne-name" title="${_nm(_t1)}">${_nm(_t1)}</div><div class="throne-time">${_t1.time}</div></div>` : ''}</div>`
        + `<div class="podium-slot podium-slot-3">${_t3 ? `<div class="advisor rank-3" data-name="${S.escapeHtml(_t3.name)}"><div class="advisor-crown">🌙</div><div class="advisor-avatar">${_av(_t3, 'advisor-avatar')}</div><div class="advisor-name" title="${_nm(_t3)}">${_nm(_t3)}</div><div class="advisor-time">${_t3.time}</div></div>` : ''}</div>`
        + `</div>`;

      const _myRawName = (() => {
        try {
          const u = window.SRank?.Auth?.getCurrentUser?.();
          return u && u.displayName ? String(u.displayName).trim() : '';
        } catch (_) { return ''; }
      })();

      const _cHTML = p => {
        const isMe = _myRawName && p.name === _myRawName;
        const meStyle = isMe
          ? ' style="color:#8B4513;background:rgba(200,150,80,.15);border-radius:6px;padding:2px 6px;margin:-2px -6px"'
          : '';
        return `<div class="courtier" data-name="${S.escapeHtml(p.name)}"><div class="courtier-avatar">${_av(p, 'courtier-avatar')}</div><div class="courtier-info"><div class="courtier-name"${meStyle} title="${_nm(p)}">${_nm(p)}</div><div class="courtier-time">${p.time}</div></div></div>`;
      };
      const _ct = _court.length
        ? `<div class="court-courtiers-label"><span>✦ QUẦN THẦN ✦</span></div><div class="court-courtiers"><div class="courtiers-col">${_L.map(_cHTML).join('')}</div><div class="courtiers-col">${_R.map(_cHTML).join('')}</div></div>`
        : '';

      top3HTML = `<div class="landing-top3 landing-court">${_podium}${_ct}</div>`;
    }

    els.question.classList.toggle('landing-court-active', top3.length > 3);

    const titleEl = els.question.querySelector('.landing-title');
    const hasStructure = !!titleEl && !forceFullReplay;

    /* ───── Case 1: Chưa có structure → build toàn bộ ───── */
    if (!hasStructure) {
      const _kr = __getKickerRender();
      const _kh = _kr.html || _kr.text;
      const _kv = _kr.version;
      els.question.classList.remove('play');

      /* ⭐ v1.2: Luôn dùng __getCtaInfo() — không hard-code locked */
      const _ci = __getCtaRender();
      const _ctaState = _resolveCtaState(_ci);
      const _ctaLocked = _isCtaLocked(_ci, _ctaState);
      const _ctaIsLockedState = (_ctaState === 'locked');

      els.question.innerHTML =
        `<span class="landing-kicker" data-kicker-version="${_kv}">${_kh}</span>`
        + `<span class="landing-title">CHECKLIST ĐẢO MÈO</span>`
        + top3HTML
        + `<span class="landing-cta${_ctaLocked ? ' locked' : ''}" data-cta="${_ctaState}" role="button" ${_ctaLocked ? 'aria-disabled="true" tabindex="-1"' : 'tabindex="0"'}>${_ci.text}</span>`
        + (_ctaIsLockedState ? `<span class="landing-lock-note">Sau ${S.checklistLockTime} sẽ khoá Checklist nha mn 🥰</span>` : '');

      _lastTop3Signature = newSig;
      els.question.style.removeProperty('--top3-base');
      void els.question.offsetWidth;
      els.question.classList.add('play');
      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = _ctaLocked ? 'none' : 'auto';
      return;
    }

    /* ───── Case 2: Đã có structure → update in-place ───── */
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
      } else return;
    }

    const cta = els.question.querySelector('.landing-cta');
    const lockNote = els.question.querySelector('.landing-lock-note');
    const kickerEl = els.question.querySelector('.landing-kicker');

    if (kickerEl) {
      const _kr = __getKickerRender();
      if (kickerEl.dataset.kickerVersion !== _kr.version) {
        if (_kr.html) kickerEl.innerHTML = _kr.html;
        else kickerEl.textContent = _kr.text;
        kickerEl.dataset.kickerVersion = _kr.version;
      }
    }

    /* ⭐ v1.2: Luôn dùng CTA từ __getCtaInfo() — không dựa vào `locked` */
    const _ci2 = __getCtaRender();
    const _state2 = _resolveCtaState(_ci2);
    const _locked2 = _isCtaLocked(_ci2, _state2);
    const _isLockedState = (_state2 === 'locked');

    if (_locked2) {
      if (cta && !cta.classList.contains('locked')) {
        cta.classList.add('locked');
        cta.setAttribute('aria-disabled', 'true');
        cta.setAttribute('tabindex', '-1');
      }
    } else {
      if (cta && cta.classList.contains('locked')) {
        cta.classList.remove('locked');
        cta.removeAttribute('aria-disabled');
        cta.setAttribute('tabindex', '0');
      }
    }

    /* Lock note: chỉ hiện khi CTA đang ở trạng thái locked */
    if (_isLockedState) {
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

    if (cta) {
      if (cta.textContent !== _ci2.text) cta.textContent = _ci2.text;
      if (cta.dataset.cta !== _state2) cta.dataset.cta = _state2;
    }

    els.question.style.opacity = '1';
    els.question.style.transform = 'scale(1)';
    els.question.style.pointerEvents = _locked2 ? 'none' : 'auto';
  }

  function maybeRenderLanding() {
    if (S.els.checklistPanel?.classList.contains('show')) return;
    renderLandingState();
    S.onAfterRenderLanding?.();
  }

  function resetHome() {
    document.getElementById('q2answers')?.remove();
    window.__clV6?.close?.();
    S.onResetHome?.();
    _lastTop3Signature = '';
    renderLandingState(true);
    if (S.els.hint) {
      S.els.hint.textContent = S.isChecklistLocked() ? '' : (S.names.length ? 'Chạm vào câu hỏi' : 'Đang tải dữ liệu…');
    }
  }

  window.LandingView = {
    render: renderLandingState,
    maybe: maybeRenderLanding,
    resetHome,
    _getSignature: () => _lastTop3Signature,
    _resetSignature: () => { _lastTop3Signature = ''; }
  };

  if (S.callbacks) {
    S.callbacks.renderLanding = renderLandingState;
    S.callbacks.maybeRenderLanding = maybeRenderLanding;
    S.callbacks.resetHome = resetHome;
  }

  console.log('[LandingView] v1.2 ready ✓ (shop ưu tiên)');
})();