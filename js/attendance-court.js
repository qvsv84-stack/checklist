/* =========================================================
   ATTENDANCE COURT — Character Library + Podium Renderer
   ---------------------------------------------------------
   API:
     AttendanceCourt.render(container, data)
     AttendanceCourt.update(container, data)
   data = [ { display_name?, username?, avatar_url?, checked_at? }, ... ]
   ========================================================= */
(function () {
  'use strict';
  if (window.AttendanceCourt) return;

  /* ---------- 1. CHARACTER BODY SVG LIBRARY ----------
     Mỗi entry = 1 SVG full-body (không gồm đầu — đầu là avatar user)
     Muốn thêm nhân vật mới → thêm entry + CSS .ac-char-N
  */
  const BODY_SVG = {

    /* ===== KING — Rank 1 — áo choàng vàng, vương trượng ===== */
    1: `
      <svg viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="acKingRobe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffe58f"/>
            <stop offset="1" stop-color="#d4a017"/>
          </linearGradient>
          <linearGradient id="acKingCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#b04080"/>
            <stop offset="1" stop-color="#6b1a4a"/>
          </linearGradient>
        </defs>
        <!-- Cape -->
        <path d="M35,3 Q18,45 12,92 L118,92 Q112,45 95,3 Z" fill="url(#acKingCape)"/>
        <path d="M35,3 Q28,28 25,55 Q65,65 105,55 Q102,28 95,3 Z" fill="#a03070" opacity="0.55"/>
        <!-- Left arm -->
        <path d="M32,12 Q18,32 20,58 L30,58 Q28,40 38,20 Z" fill="url(#acKingRobe)" stroke="#a07020" stroke-width="1"/>
        <!-- Right arm -->
        <path d="M98,12 Q112,32 110,58 L100,58 Q102,40 92,20 Z" fill="url(#acKingRobe)" stroke="#a07020" stroke-width="1"/>
        <!-- Scepter -->
        <line x1="106" y1="8" x2="103" y2="62" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round"/>
        <circle cx="106" cy="8" r="7" fill="#ffd700" stroke="#c9a961" stroke-width="2"/>
        <circle cx="106" cy="8" r="3" fill="#fff8b0"/>
        <!-- Torso -->
        <path d="M40,10 Q38,25 38,70 L92,70 Q92,25 90,10 Z" fill="url(#acKingRobe)" stroke="#a07020" stroke-width="1"/>
        <!-- Fur trim -->
        <path d="M38,64 Q52,71 65,64 Q78,71 92,64 L92,70 L38,70 Z" fill="#fffaf0"/>
        <!-- Belt -->
        <rect x="40" y="40" width="50" height="8" fill="#8a6a3a" rx="2"/>
        <circle cx="65" cy="44" r="5" fill="#ffd700" stroke="#8a6a3a" stroke-width="1.5"/>
        <!-- Legs -->
        <rect x="48" y="68" width="14" height="26" fill="#2a1a0a" rx="2"/>
        <rect x="68" y="68" width="14" height="26" fill="#2a1a0a" rx="2"/>
        <!-- Boots -->
        <ellipse cx="55" cy="98" rx="11" ry="6" fill="#0a0804"/>
        <ellipse cx="75" cy="98" rx="11" ry="6" fill="#0a0804"/>
      </svg>
    `,

    /* ===== QUEEN — Rank 2 — váy xòe bạc, quạt ===== */
    2: `
      <svg viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="acQueenDress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f5f0ff"/>
            <stop offset="1" stop-color="#b8b0d0"/>
          </linearGradient>
        </defs>
        <!-- Dress bell -->
        <path d="M45,15 Q40,40 30,95 L100,95 Q90,40 85,15 Z" fill="url(#acQueenDress)" stroke="#9aa5b0" stroke-width="1"/>
        <!-- Dress trim -->
        <path d="M30,88 Q40,95 65,88 Q90,95 100,88 L100,95 L30,95 Z" fill="#fff0f5"/>
        <!-- Dress pattern -->
        <path d="M45,15 Q65,22 85,15 L84,38 Q65,45 46,38 Z" fill="#ffd8e8"/>
        <!-- Left arm -->
        <path d="M40,20 Q30,35 30,55 L38,58 Q38,42 44,25 Z" fill="#f5f0ff" stroke="#9aa5b0" stroke-width="1"/>
        <!-- Right arm -->
        <path d="M90,20 Q100,35 100,55 L92,58 Q92,42 86,25 Z" fill="#f5f0ff" stroke="#9aa5b0" stroke-width="1"/>
        <!-- Fan -->
        <path d="M100,52 L108,32 Q116,38 113,52 Q108,58 100,52 Z" fill="#ffb6c1" stroke="#e08ba0" stroke-width="1.5"/>
        <line x1="100" y1="52" x2="108" y2="32" stroke="#e08ba0" stroke-width="1"/>
        <line x1="100" y1="52" x2="112" y2="38" stroke="#e08ba0" stroke-width="1"/>
        <line x1="100" y1="52" x2="114" y2="46" stroke="#e08ba0" stroke-width="1"/>
        <!-- Collar -->
        <path d="M45,15 Q65,25 85,15 Q83,22 65,22 Q47,22 45,15 Z" fill="#fff0f5"/>
        <!-- Belt -->
        <rect x="48" y="40" width="34" height="5" fill="#e08ba0" rx="1"/>
        <circle cx="65" cy="42" r="4" fill="#ffb6c1" stroke="#e08ba0" stroke-width="1"/>
      </svg>
    `,

    /* ===== KNIGHT — Rank 3 — áo giáp đồng, kiếm ===== */
    3: `
      <svg viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="acKnightTunic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#f0c088"/>
            <stop offset="1" stop-color="#c98444"/>
          </linearGradient>
        </defs>
        <!-- Small cape -->
        <path d="M48,10 Q42,40 40,72 L90,72 Q88,40 82,10 Z" fill="#6b3a1a"/>
        <!-- Left arm -->
        <path d="M35,15 Q22,35 24,60 L34,60 Q32,42 40,22 Z" fill="url(#acKnightTunic)" stroke="#7a4a20" stroke-width="1"/>
        <!-- Right arm -->
        <path d="M95,15 Q108,35 106,60 L96,60 Q98,42 90,22 Z" fill="url(#acKnightTunic)" stroke="#7a4a20" stroke-width="1"/>
        <!-- Sword -->
        <line x1="103" y1="5" x2="100" y2="55" stroke="#d8e0e8" stroke-width="4" stroke-linecap="round"/>
        <line x1="96" y1="55" x2="108" y2="55" stroke="#8a6a3a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="103" cy="5" r="3" fill="#fff" stroke="#d8e0e8" stroke-width="1"/>
        <!-- Tunic -->
        <path d="M42,10 Q40,30 38,70 L92,70 Q90,30 88,10 Z" fill="url(#acKnightTunic)" stroke="#7a4a20" stroke-width="1"/>
        <!-- Tunic collar -->
        <path d="M42,10 Q65,18 88,10 Q86,20 65,22 Q44,20 42,10 Z" fill="#8a4a20"/>
        <!-- Belt -->
        <rect x="40" y="42" width="50" height="7" fill="#5a3010" rx="2"/>
        <circle cx="65" cy="45" r="5" fill="#c9a961" stroke="#5a3010" stroke-width="1.5"/>
        <!-- Legs -->
        <rect x="48" y="68" width="14" height="26" fill="#5a3010" rx="2"/>
        <rect x="68" y="68" width="14" height="26" fill="#5a3010" rx="2"/>
        <!-- Boots -->
        <ellipse cx="55" cy="98" rx="11" ry="6" fill="#2a1a0a"/>
        <ellipse cx="75" cy="98" rx="11" ry="6" fill="#2a1a0a"/>
      </svg>
    `,
  };

  /* Metadata cho từng rank (chỉ dùng để render crown + chọn SVG body) */
  const CHARACTER_LIBRARY = {
    1: { crown: '👑', bodyKey: 1 },
    2: { crown: '🌙', bodyKey: 2 },
    3: { crown: '🍂', bodyKey: 3 },
  };

  /* ---------- 2. HELPERS ---------- */
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function pickName(p) {
    const raw = p && (p.display_name || p.displayName || p.name || p.username || p.user_name || '');
    return String(raw).trim() || '—';
  }
  function pickAvatar(p) {
    const raw = p && (p.avatar_url || p.avatarUrl || p.avatar || p.img_url || '');
    return String(raw).trim();
  }
  function pickTime(p) {
    const raw = p && (p.checked_at || p.checkedAt || p.check_time || p.time ||
                      p.created_at || p.timestamp || '');
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return String(d.getHours()).padStart(2,'0') + ':' +
               String(d.getMinutes()).padStart(2,'0');
      }
    } catch (_) {}
    return String(raw);
  }
  function initials(name) {
    if (!name || name === '—') return '?';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /* ---------- 3. BUILD HEAD (avatar) ---------- */
  function buildHead(p) {
    const name = pickName(p);
    const url  = pickAvatar(p);
    const wrap = el('div', 'ac-char-head');
    const fb   = el('span', 'ac-fallback');
    fb.textContent = initials(name);

    if (url) {
      const img = el('img');
      img.alt = name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = function () { img.remove(); fb.classList.add('show'); };
      img.src = url;
      wrap.appendChild(img);
    } else {
      fb.classList.add('show');
    }
    wrap.appendChild(fb);
    return wrap;
  }

  /* ---------- 4. BUILD 1 NHÂN VẬT ---------- */
  function buildCharacter(person, rank) {
    const lib = CHARACTER_LIBRARY[rank];
    if (!lib || !person) return el('div');

    const node = el('div', 'ac-char ac-char-' + rank);

    // Crown
    const crown = el('div', 'ac-char-crown');
    crown.textContent = lib.crown;
    node.appendChild(crown);

    // Head (avatar)
    node.appendChild(buildHead(person));

    // Body (SVG)
    const body = el('div', 'ac-char-body');
    body.innerHTML = BODY_SVG[lib.bodyKey];
    // Đảm bảo svg con full width container
    const svg = body.querySelector('svg');
    if (svg) { svg.setAttribute('width','100%'); svg.setAttribute('height','auto'); }
    node.appendChild(body);

    // Name
    const nameEl = el('div', 'ac-char-name');
    nameEl.textContent = pickName(person);
    nameEl.title = pickName(person);
    node.appendChild(nameEl);

    // Time
    const t = pickTime(person);
    if (t) {
      const timeEl = el('div', 'ac-char-time');
      timeEl.textContent = t;
      node.appendChild(timeEl);
    }

    return node;
  }

  /* ---------- 5. RENDER ---------- */
  function render(container, data) {
    if (!container) return;
    const list = (Array.isArray(data) ? data : []).filter(Boolean).slice(0, 3);

    container.innerHTML = '';
    container.classList.add('ac-court-wrap');

    if (!list.length) {
      const empty = el('div', 'ac-empty');
      empty.textContent = 'Chưa có ai chấm công hôm nay';
      container.appendChild(empty);
      return;
    }

    const title = el('div', 'ac-court-title');
    title.textContent = '⭐ Top chấm công sớm nhất';
    container.appendChild(title);

    const podium = el('div', 'ac-podium');
    // Layout: [2nd | 1st | 3rd]
    const slot2 = el('div', 'ac-slot ac-slot-2'); slot2.appendChild(buildCharacter(list[1], 2));
    const slot1 = el('div', 'ac-slot ac-slot-1'); slot1.appendChild(buildCharacter(list[0], 1));
    const slot3 = el('div', 'ac-slot ac-slot-3'); slot3.appendChild(buildCharacter(list[2], 3));
    podium.appendChild(slot2);
    podium.appendChild(slot1);
    podium.appendChild(slot3);

    container.appendChild(podium);
  }

  window.AttendanceCourt = {
    render: render,
    update: render,
    CHARACTER_LIBRARY: CHARACTER_LIBRARY,
    BODY_SVG: BODY_SVG,
  };
})();
