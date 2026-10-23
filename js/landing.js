/* =========================================================
   LANDING VIEW — v5.1 (lyrics + music + countdown fallback)
   ---------------------------------------------------------
   v5.1:
   - Thêm MUSIC PLAYER: nút loa cạnh lyric/countdown
   - User bấm loa → bật/tắt nhạc (lưu vào localStorage)
   - Lần sau vào app: nếu đã bật trước đó + có nhạc → tự play
     khi có gesture đầu tiên (browser policy)
   v5.0: lyrics > countdown
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
     TITLE
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
      if (window.Role?.isAdmin) { try { return !!window.Role.isAdmin(u); } catch (_) {} }
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
     LYRICS
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

      /* Wrapper bọc lyric/countdown + nút loa */
      .landing-dynamic-wrap {
        position: relative !important;
        width: 100% !important;
        padding-right: 36px !important;
        box-sizing: border-box !important;
      }

      /* Nút loa */
      .landing-music-btn {
        position: absolute !important;
        right: 0 !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 50% !important;
        border: none !important;
        background: rgba(255,255,255,.7) !important;
        cursor: pointer !important;
        font-size: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 1px 4px rgba(0,0,0,.12) !important;
        z-index: 5 !important;
        padding: 0 !important;
        transition: background .15s, transform .15s !important;
      }
      .landing-music-btn:active { transform: translateY(-50%) scale(.9) !important; }
      .landing-music-btn.playing {
        background: linear-gradient(135deg,#4fa370,#3d8b5f) !important;
        color: #fff !important;
        box-shadow: 0 2px 8px rgba(79,163,112,.4) !important;
      }
      .landing-music-btn.hidden-btn { display: none !important; }
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
    void el.offsetWidth;
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
    if (_lyricTimer) { clearInterval(_lyricTimer); _lyricTimer = null; }
  }

  function _getLyricHTML() {
    _ensureLyricStyles();
    const phrases = _getLyricPhrases();
    const firstTxt = phrases[0] ? _esc(phrases[0]) : '';
    return '<span class="landing-lyric" id="landingLyric">' +
      '<span class="landing-lyric-inner" id="landingLyricInner">' + firstTxt + '</span></span>';
  }

  /* ═══════════════════════════════════════════════════════
     COUNTDOWN
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
      fmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
      return {
        year: +p.year, month: +p.month - 1, day: +p.day,
        hour: +p.hour, minute: +p.minute, second: +p.second
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
    if (isLocked) return `🔒 Đã khoá · Mở lại sau <b>${hh}</b> Giờ : <b>${mm}</b> Phút : <b>${ss}</b> Giây`;
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
    if (_countdownTimer) { clearInterval(_countdownTimer); _countdownTimer = null; }
  }

  /* ═══════════════════════════════════════════════════════
     MUSIC PLAYER
     ═══════════════════════════════════════════════════════ */
  const MUSIC_ENABLED_KEY = "srank_music_enabled_v1";
  let _audio = null;
  let _audioMounted = false;

  function _isMusicEnabled() {
    try { return localStorage.getItem(MUSIC_ENABLED_KEY) === "1"; } catch (_) { return false; }
  }

  function _setMusicEnabled(v) {
    try { localStorage.setItem(MUSIC_ENABLED_KEY, v ? "1" : "0"); } catch (_) {}
  }

  function _getMusicMeta() {
    if (window.__bdTitle && typeof window.__bdTitle.getMusic === 'function') {
      try { return window.__bdTitle.getMusic() || { url: "", volume: 0.4 }; } catch (_) {}
    }
    return { url: "", volume: 0.4 };
  }

  function _ensureAudioMounted() {
    if (_audioMounted && _audio) return _audio;

    _audio = document.createElement('audio');
    _audio.id = 'landingMusicAudio';
    _audio.loop = true;
    _audio.preload = 'auto';
    _audio.style.display = 'none';
    document.body.appendChild(_audio);

    _audio.addEventListener('play', _updateMusicBtnState);
    _audio.addEventListener('pause', _updateMusicBtnState);
    _audio.addEventListener('error', function () {
      console.warn('[LandingView] audio error');
      _updateMusicBtnState();
    });

    _audioMounted = true;
    return _audio;
  }

  function _syncAudioSource() {
    const meta = _getMusicMeta();
    const audio = _ensureAudioMounted();

    if (!meta.url) {
      // Không có nhạc → pause + clear
      try { audio.pause(); } catch (_) {}
      if (audio.src) { audio.removeAttribute('src'); audio.load(); }
      return;
    }

    // Chỉ đổi src khi URL khác (so sánh string)
    if (audio.dataset.url !== meta.url) {
      audio.dataset.url = meta.url;
      audio.src = meta.url;
      try { audio.load(); } catch (_) {}
    }

    // Volume
    audio.volume = Math.max(0, Math.min(1, Number(meta.volume) || 0.4));
  }

  function _updateMusicBtnState() {
    const btn = document.getElementById('landingMusicBtn');
    if (!btn) return;
    const meta = _getMusicMeta();

    if (!meta.url) {
      btn.classList.add('hidden-btn');
      btn.textContent = '🔊';
      return;
    }

    btn.classList.remove('hidden-btn');

    const playing = _audio && !_audio.paused;
    btn.classList.toggle('playing', !!playing);
    btn.textContent = playing ? '🔊' : '🔇';
    btn.title = playing ? 'Tắt nhạc' : 'Bật nhạc';
    btn.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  }

  async function _toggleMusic() {
    const meta = _getMusicMeta();
    if (!meta.url) return;

    const audio = _ensureAudioMounted();
    _syncAudioSource();

    if (audio.paused) {
      try {
        await audio.play();
        _setMusicEnabled(true);
      } catch (e) {
        console.warn('[LandingView] play failed:', e && e.message);
      }
    } else {
      audio.pause();
      _setMusicEnabled(false);
    }
    _updateMusicBtnState();
  }

  function _getMusicBtnHTML() {
    _ensureLyricStyles();
    // Nếu không có nhạc + không phải admin → không hiện gì
    const meta = _getMusicMeta();
    if (!meta.url && !_isAdmin()) return '';

    const extraClass = !meta.url ? ' hidden-btn' : '';
    return '<button type="button" id="landingMusicBtn" class="landing-music-btn' + extraClass + '" ' +
      'title="Bật nhạc" aria-label="Bật nhạc nền">🔇</button>';
  }

  function _bindMusicBtn() {
    const btn = document.getElementById('landingMusicBtn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      _toggleMusic();
    });
    _updateMusicBtnState();
  }

  function _autoResumeMusicIfEnabled() {
    if (!_isMusicEnabled()) return;
    const meta = _getMusicMeta();
    if (!meta.url) return;

    const audio = _ensureAudioMounted();
    _syncAudioSource();
    if (!audio.paused) return;

    const doPlay = function () {
      if (!_isMusicEnabled()) return;
      audio.play().then(() => {
        document.removeEventListener('pointerdown', doPlay, true);
        document.removeEventListener('touchstart', doPlay, true);
        document.removeEventListener('keydown', doPlay, true);
        _updateMusicBtnState();
      }).catch(() => {});
    };

    // Thử play ngay (nếu user đã tương tác trang rồi thì OK)
    audio.play().catch(function () {
      // Chờ gesture đầu tiên
      document.addEventListener('pointerdown', doPlay, true);
      document.addEventListener('touchstart', doPlay, true);
      document.addEventListener('keydown', doPlay, true);
    });
  }

  /* ═══════════════════════════════════════════════════════
     DYNAMIC WRAPPER — lyric/countdown + music btn
     ═══════════════════════════════════════════════════════ */
  function _getDynamicHTML() {
    _ensureLyricStyles();
    const inner = _getLyricPhrases().length ? _getLyricHTML() : _getCountdownHTML();
    return '<div class="landing-dynamic-wrap">' + inner + _getMusicBtnHTML() + '</div>';
  }

  function _startDynamic() {
    if (_startLyricPlayer()) {
      _stopCountdownTimer();
    } else {
      _stopLyricPlayer();
      _startCountdownTimer();
    }
    _syncAudioSource();
    _bindMusicBtn();
    _autoResumeMusicIfEnabled();
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
    } catch (e) { console.error('[LandingView] Fallback crash:', e); }
  }

  /* ═══════════════════════════════════════════════════════
     CTA / HELPERS
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
    return list.map(p => `${p.name}|${p.time}|${S.getAvatarUrl(p.name)}`).join('::');
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
    if (t2) podiumHtml += `
      <div class="advisor rank-2" data-name="${_esc(t2.name)}">
        <div class="advisor-crown">☀️</div>
        <div class="advisor-avatar">${makeAvatarHtml(t2, 'advisor-avatar')}</div>
        <div class="advisor-name" title="${makeName(t2)}">${makeName(t2)}</div>
        <div class="advisor-time">${t2.time}</div>
      </div>`;
    podiumHtml += '</div>';

    podiumHtml += '<div class="podium-slot podium-slot-1">';
    if (t1) podiumHtml += `
      <div class="court-throne" data-name="${_esc(t1.name)}">
        <div class="throne-crown">👑</div>
        <div class="throne-avatar">${makeAvatarHtml(t1, 'throne-avatar')}</div>
        <div class="throne-name" title="${makeName(t1)}">${makeName(t1)}</div>
        <div class="throne-time">${t1.time}</div>
      </div>`;
    podiumHtml += '</div>';

    podiumHtml += '<div class="podium-slot podium-slot-3">';
    if (t3) podiumHtml += `
      <div class="advisor rank-3" data-name="${_esc(t3.name)}">
        <div class="advisor-crown">🌙</div>
        <div class="advisor-avatar">${makeAvatarHtml(t3, 'advisor-avatar')}</div>
        <div class="advisor-name" title="${makeName(t3)}">${makeName(t3)}</div>
        <div class="advisor-time">${t3.time}</div>
      </div>`;
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
          </div>`;
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

      const hasWrap = !!els.question.querySelector('.landing-dynamic-wrap');
      const hasStructure = hasWrap && !forceFullReplay;

      /* ═══════ BUILD ═══════ */
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

      /* ═══════ UPDATE ═══════ */

      /* Swap lyric ↔ countdown nếu cần */
      const wantsLyric = _getLyricPhrases().length > 0;
      const hasLyricEl = !!els.question.querySelector('.landing-lyric');
      const hasCountdownEl = !!els.question.querySelector('.birthday-countdown');
      const wrap = els.question.querySelector('.landing-dynamic-wrap');

      if (wantsLyric && !hasLyricEl) {
        if (hasCountdownEl) els.question.querySelector('.birthday-countdown')?.remove();
        if (wrap) wrap.insertAdjacentHTML('afterbegin', _getLyricHTML());
        _stopCountdownTimer();
        _startLyricPlayer();
      } else if (!wantsLyric && !hasCountdownEl) {
        if (hasLyricEl) els.question.querySelector('.landing-lyric')?.remove();
        if (wrap) wrap.insertAdjacentHTML('afterbegin', _getCountdownHTML());
        _stopLyricPlayer();
        _startCountdownTimer();
      } else {
        _startDynamic();
      }

      /* Đảm bảo nút loa sync đúng (có thể admin vừa thêm/xoá nhạc) */
      const meta = _getMusicMeta();
      let btn = document.getElementById('landingMusicBtn');
      if (meta.url && !btn && wrap) {
        wrap.insertAdjacentHTML('beforeend', _getMusicBtnHTML());
        _bindMusicBtn();
      } else if (!meta.url && !_isAdmin() && btn) {
        btn.remove();
      }
      _syncAudioSource();
      _bindMusicBtn();
      _updateMusicBtnState();

      /* Update top3 */
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

      /* Update kicker */
      const kickerEl = els.question.querySelector('.landing-kicker');
      if (kickerEl) {
        const kr = __getKickerRender();
        if (kickerEl.dataset.kickerVersion !== kr.version) {
          if (kr.html) kickerEl.innerHTML = kr.html;
          else kickerEl.textContent = kr.text;
          kickerEl.dataset.kickerVersion = kr.version;
        }
      }

      /* Update CTA */
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
    } catch (e) { console.error('[LandingView] resetHome crash:', e); }
  }

  window.LandingView = {
    render: renderLandingState,
    maybe: maybeRenderLanding,
    resetHome: resetHome,
    _getSignature: () => _lastTop3Signature,
    _resetSignature: () => { _lastTop3Signature = ''; }
  };

  if (S.callbacks) {
    S.callbacks.renderLanding = renderLandingState;
    S.callbacks.maybeRenderLanding = maybeRenderLanding;
    S.callbacks.resetHome = resetHome;
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      _updateCountdownLive();
      if (_audio && _audio.paused && _isMusicEnabled()) _autoResumeMusicIfEnabled();
    }
  });

  window.addEventListener('bdTitleChanged', () => {
    try { renderLandingState(true); } catch (e) { console.error('[LandingView] bdTitle:', e); }
  });
  window.addEventListener('bdLyricsChanged', () => {
    try { _stopLyricPlayer(); renderLandingState(true); } catch (e) { console.error('[LandingView] bdLyrics:', e); }
  });
  window.addEventListener('bdMusicChanged', () => {
    try {
      _syncAudioSource();
      _bindMusicBtn();
      _updateMusicBtnState();
      if (_isMusicEnabled() && _audio && _audio.paused) _autoResumeMusicIfEnabled();
      renderLandingState(true);
    } catch (e) { console.error('[LandingView] bdMusic:', e); }
  });

  console.log('[LandingView] v5.1 ready ✓ (music player)');
})();