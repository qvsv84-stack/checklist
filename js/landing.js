/* =========================================================
   LANDING VIEW — v1.8 (Syntax-safe, no nested templates)
   ========================================================= */
(function(){
  "use strict";
  if (window.LandingView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[LandingView] thiếu SrankCore');
    return;
  }

  let _lastTop3Signature = '';
  const TITLE_HTML = 'Happy Birthday<br>Minh Quân';

  function top3Signature(list) {
    return list.map(function(p) {
      return p.name + '|' + p.time + '|' + S.getAvatarUrl(p.name);
    }).join('::');
  }

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

  function _esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _fallbackRender() {
    const els = S.els;
    if (!els || !els.question) return;
    try {
      const ci = __getCtaRender();
      const stateName = _resolveCtaState(ci);
      const ctaLocked = _isCtaLocked(ci, stateName);
      
      let html = '<span class="landing-kicker">🐱 DAILY TEAM HUB</span>';
      html += '<span class="landing-title rainbow-birthday">' + TITLE_HTML + '</span>';
      html += '<span class="landing-cta' + (ctaLocked ? ' locked' : '') + '" data-cta="' + stateName + '" role="button">' + _esc(ci.text) + '</span>';
      
      els.question.innerHTML = html;
      els.question.classList.add('play');
      els.question.style.opacity = '1';
      els.question.style.transform = 'scale(1)';
      els.question.style.pointerEvents = ctaLocked ? 'none' : 'auto';
      console.warn('[LandingView] FALLBACK RENDERED');
    } catch (e) {
      console.error('[LandingView] Fallback crash:', e);
    }
  }

  function buildTop3HTML(top3) {
    if (!top3.length) {
      return '<div class="landing-top3-empty">Chưa có ai check hôm nay — hãy là người đầu tiên! 🐱</div>';
    }

    function makeAvatarHtml(p, cls) {
      const u = S.getAvatarUrl(p.name);
      const su = u ? u.replace(/"/g, '&quot;') : '';
      const ini = String((window.DN ? window.DN(p.name) : p.name) || '?').trim().slice(0, 1).toUpperCase();
      if (u) {
        return '<img src="' + su + '" alt="" loading="eager" decoding="async" onerror="this.style.display=\'none\';this.nextElementSibling.classList.add(\'show\');"><span class="' + cls + '-fallback">' + ini + '</span>';
      }
      return '<span class="' + cls + '-fallback show">' + ini + '</span>';
    }

    function makeName(p) {
      let nameStr = String((window.DN ? window.DN(p.name) : p.name) || '');
      return _esc(nameStr);
    }

    const t1 = top3[0];
    const t2 = top3[1];
    const t3 = top3[2];
    const court = top3.slice(3);
    const courtL = court.filter(function(_, i) { return i % 2 === 0; });
    const courtR = court.filter(function(_, i) { return i % 2 === 1; });

    let podiumHtml = '<div class="court-podium">';
    
    // Slot 2 (Trái)
    podiumHtml += '<div class="podium-slot podium-slot-2">';
    if (t2) {
      podiumHtml += '<div class="advisor rank-2" data-name="' + _esc(t2.name) + '">';
      podiumHtml += '<div class="advisor-crown">☀️</div>';
      podiumHtml += '<div class="advisor-avatar">' + makeAvatarHtml(t2, 'advisor-avatar') + '</div>';
      podiumHtml += '<div class="advisor-name" title="' + makeName(t2) + '">' + makeName(t2) + '</div>';
      podiumHtml += '<div class="advisor-time">' + t2.time + '</div>';
      podiumHtml += '</div>';
    }
    podiumHtml += '</div>';

    // Slot 1 (Giữa)
    podiumHtml += '<div class="podium-slot podium-slot-1">';
    if (t1) {
      podiumHtml += '<div class="court-throne" data-name="' + _esc(t1.name) + '">';
      podiumHtml += '<div class="throne-crown">👑</div>';
      podiumHtml += '<div class="throne-avatar">' + makeAvatarHtml(t1, 'throne-avatar') + '</div>';
      podiumHtml += '<div class="throne-name" title="' + makeName(t1) + '">' + makeName(t1) + '</div>';
      podiumHtml += '<div class="throne-time">' + t1.time + '</div>';
      podiumHtml += '</div>';
    }
    podiumHtml += '</div>';

    // Slot 3 (Phải)
    podiumHtml += '<div class="podium-slot podium-slot-3">';
    if (t3) {
      podiumHtml += '<div class="advisor rank-3" data-name="' + _esc(t3.name) + '">';
      podiumHtml += '<div class="advisor-crown">🌙</div>';
      podiumHtml += '<div class="advisor-avatar">' + makeAvatarHtml(t3, 'advisor-avatar') + '</div>';
      podiumHtml += '<div class="advisor-name" title="' + makeName(t3) + '">' + makeName(t3) + '</div>';
      podiumHtml += '<div class="advisor-time">' + t3.time + '</div>';
      podiumHtml += '</div>';
    }
    podiumHtml += '</div>';
    
    podiumHtml += '</div>'; // End court-podium

    // Courtiers
    let courtiersHtml = '';
    if (court.length > 0) {
      let myRawName = '';
      try {
        const u = window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser ? window.SRank.Auth.getCurrentUser() : null;
        myRawName = u && u.displayName ? String(u.displayName).trim() : '';
      } catch(_){}

      function makeCourtier(p) {
        const isMe = myRawName && p.name === myRawName;
        const meStyle = isMe ? ' style="color:#8B4513;background:rgba(200,150,80,.15);border-radius:6px;padding:2px 6px;margin:-2px -6px"' : '';
        let h = '<div class="courtier" data-name="' + _esc(p.name) + '">';
        h += '<div class="courtier-avatar">' + makeAvatarHtml(p, 'courtier-avatar') + '</div>';
        h += '<div class="courtier-info">';
        h += '<div class="courtier-name"' + meStyle + ' title="' + makeName(p) + '">' + makeName(p) + '</div>';
        h += '<div class="courtier-time">' + p.time + '</div>';
        h += '</div></div>';
        return h;
      }

      courtiersHtml += '<div class="court-courtiers-label"><span>✦ QUẦN THẦN ✦</span></div>';
      courtiersHtml += '<div class="court-courtiers">';
      courtiersHtml += '<div class="courtiers-col">' + courtL.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '<div class="courtiers-col">' + courtR.map(makeCourtier).join('') + '</div>';
      courtiersHtml += '</div>';
    }

    return '<div class="landing-top3 landing-court">' + podiumHtml + courtiersHtml + '</div>';
  }

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

      const checkedList = names.map(function(name, i) {
        return {
          name: String(name || '').trim(),
          time: String(times[i] || '').trim(),
          checked: !!checked[i]
        };
      }).filter(function(p) {
        return p.checked && p.time && p.name;
      }).sort(function(a, b) {
        return a.time.localeCompare(b.time);
      });

      const top3 = checkedList.slice(0, 20);
      const newSig = top3Signature(top3);
      const top3Changed = newSig !== _lastTop3Signature;

      const top3HTML = buildTop3HTML(top3);
      els.question.classList.toggle('landing-court-active', top3.length > 3);

      const titleEl = els.question.querySelector('.landing-title');
      const hasStructure = !!titleEl && !forceFullReplay;

      if (!hasStructure) {
        const kr = __getKickerRender();
        const kh = kr.html || kr.text;
        const kv = kr.version;

        const ci = __getCtaRender();
        const ctaState = _resolveCtaState(ci);
        const ctaLocked = _isCtaLocked(ci, ctaState);
        const ctaIsLockedState = (ctaState === 'locked');

        let html = '<span class="landing-kicker" data-kicker-version="' + kv + '">' + kh + '</span>';
        html += '<span class="landing-title rainbow-birthday">' + TITLE_HTML + '</span>';
        html += top3HTML;
        html += '<span class="landing-cta' + (ctaLocked ? ' locked' : '') + '" data-cta="' + ctaState + '" role="button" ' + (ctaLocked ? 'aria-disabled="true" tabindex="-1"' : 'tabindex="0"') + '>' + _esc(ci.text) + '</span>';
        if (ctaIsLockedState) {
          html += '<span class="landing-lock-note">Sau ' + S.checklistLockTime + ' sẽ khoá Checklist nha mn 🥰</span>';
        }

        els.question.innerHTML = html;
        _lastTop3Signature = newSig;
        els.question.style.removeProperty('--top3-base');
        void els.question.offsetWidth;
        els.question.classList.add('play');
        els.question.style.opacity = '1';
        els.question.style.transform = 'scale(1)';
        els.question.style.pointerEvents = ctaLocked ? 'none' : 'auto';
        return;
      }

      // CASE 2: In-place update
      if (titleEl) {
        const needFix = !titleEl.classList.contains('rainbow-birthday') || !titleEl.innerHTML.includes('Happy Birthday');
        if (need.callFix) {
          titleEl.className = 'landing-title rainbow-birthday';
          titleEl.innerHTML = TITLE_HTML;
        }
      }

      if (top3Changed) {
        const oldLabel = els.question.querySelector('.landing-top3-label');
        if (oldLabel) oldLabel.remove();
        const oldTop3 = els.question.querySelector('.landing-top3');
        if (oldTop3) oldTop3.remove();
        const oldEmpty = els.question.querySelector('.landing-top3-empty');
        if (oldEmpty) oldEmpty.remove();

        const ctaBefore = els.question.querySelector('.landing-cta');
        if (ctaBefore && top3HTML) {
          ctaBefore.insertAdjacentHTML('beforebegin', top3HTML);
          _lastTop3Signature = newSig;
          els.question.classList.remove('top3-replay');
          void els.question.offsetWidth;
          els.question.classList.add('top3-replay');
        }
      }

      const kickerEl = els.question.querySelectorbacks('.landing-kicker.reset');
      if (kickerEl)Home {
        const kr = __getKickerRender();
        if (kickerEl.dataset.kickerVersion !== kr.version) {
          if (kr.html) kickerEl.innerHTML = kr.html;
          else kickerEl.textContent = kr.text;
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
        const noteTxt = 'Sau ' + S.checklistLockTime + ' sẽ khoá Checklist nha mn 🥰';
        if (!lockNote) {
          const n = document.createElement('span');
          n.className = 'landing-lock-note';
          n.textContent = noteTxt;
          els.question.appendChild(n);
        } else if (lockNote.textContent !== noteTxt) {
          lockNote.textContent = noteTxt;
        }
      } else {
        if (lockNote) lockNote.remove();
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
      const q2 = document.getElementById('q2answers');
      if (q2) q2.remove();
      if (window.__clV6) window.__clV6.close();
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
    S = resetHome;
  }

  console.log('[LandingView] v1.8 ready ✓ (Safe Syntax)');
})();