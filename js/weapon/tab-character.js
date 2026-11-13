/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — TAB CHARACTER v2.0 (Full Body)
   - Render grid 22 nhân vật full body
   - Ragnarok: ảnh PNG trực tiếp
   - LPC: fetch async, cache
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabCharacter) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const LIB = window.__WF.characterLibrary;
  if (!C || !U || !ST || !LIB) {
    console.error('[WF] tab-character.js thiếu dependency');
    return;
  }

  const S = ST.S;
  const { esc, toast, playSound } = U;

  /* ═══════════════════════════════════════════════════════════════
     CSS — avatar full body, không mask tròn
     ═══════════════════════════════════════════════════════════════ */
  function injectCSS(){
    if (document.getElementById('wsCharCSS')) return;
    const st = document.createElement('style');
    st.id = 'wsCharCSS';
    st.textContent = `
      .ws-char-hero {
        padding: 20px 16px;
        background: radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,255,255,.98), transparent 70%),
                    linear-gradient(160deg, #fffbeb, #fef3c7);
        border: 1.5px solid rgba(220,180,100,.5);
        border-radius: 20px;
        text-align: center;
        margin-bottom: 16px;
      }
      .ws-char-hero-avatar {
        width: 160px;
        height: 200px;
        margin: 0 auto 12px;
        border-radius: 16px;
        background: linear-gradient(180deg, #fff7d9 0%, #ffd966 100%);
        border: 3px solid #f59e0b;
        box-shadow: 0 8px 24px -8px rgba(245,158,11,.6),
                    0 0 0 4px rgba(245,158,11,.15);
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: relative;
      }
      .ws-char-hero-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center bottom;
        display: block;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
      }
      .ws-char-hero-fallback {
        font-size: 72px;
        line-height: 1;
        display: none;
        padding-bottom: 20px;
      }
      .ws-char-hero-avatar.fallback .ws-char-hero-fallback { display: block; }
      .ws-char-hero-avatar.fallback img { display: none; }
      .ws-char-hero-name {
        font-size: 18px;
        font-weight: 950;
        color: #78350f;
        margin-bottom: 4px;
      }
      .ws-char-hero-class {
        display: inline-block;
        padding: 3px 12px;
        border-radius: 999px;
        background: rgba(245,158,11,.2);
        color: #92400e;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .ws-char-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 10.5px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: #a06a28;
        margin: 16px 0 10px;
      }
      .ws-char-section-title::before,
      .ws-char-section-title::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(220,180,100,.6), transparent);
      }
      .ws-char-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      @media (min-width: 480px) {
        .ws-char-grid { grid-template-columns: repeat(5, 1fr); }
      }
      .ws-char-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 6px 4px;
        background: rgba(255,255,255,.9);
        border: 2px solid rgba(220,180,100,.4);
        border-radius: 12px;
        cursor: pointer;
        transition: transform .12s, border-color .2s, box-shadow .2s;
        position: relative;
      }
      .ws-char-card:active { transform: scale(.94); }
      .ws-char-card.selected {
        border-color: #f59e0b;
        background: linear-gradient(160deg, #fffbeb, #fef3c7);
        box-shadow: 0 0 0 2px rgba(245,158,11,.35),
                    0 4px 12px -4px rgba(245,158,11,.5);
      }
      .ws-char-card.selected::after {
        content: "✓";
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #22c55e;
        color: #fff;
        font-size: 12px;
        font-weight: 950;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(34,197,94,.5);
      }
      .ws-char-card-avatar {
        width: 100%;
        aspect-ratio: 3 / 4;
        border-radius: 10px;
        background: linear-gradient(180deg, #fff7d9 0%, #ffd966 100%);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .ws-char-card-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center bottom;
        display: block;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
      }
      .ws-char-card-fallback {
        font-size: 36px;
        display: none;
        padding-bottom: 8px;
      }
      .ws-char-card-avatar.fallback .ws-char-card-fallback { display: block; }
      .ws-char-card-avatar.fallback img { display: none; }
      .ws-char-card-name {
        font-size: 9.5px;
        font-weight: 900;
        color: #78350f;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        line-height: 1.2;
      }
      .ws-char-loading {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #a06a28;
        animation: wsCharPulse 1.2s ease-in-out infinite;
      }
      @keyframes wsCharPulse {
        0%, 100% { opacity: .4; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function getSelected(){
    const id = S.state?.character_id;
    return LIB.getById(id) || LIB.getDefault();
  }

  function renderAvatarHtml(char, size){
    if (!char) return '';
    const url = LIB.getUrl(char);
    if (url) {
      return `<img src="${url}" alt="${esc(char.name)}" loading="lazy"
                   onerror="this.parentNode.classList.add('fallback')">
              <span class="ws-char-hero-fallback">${char.emoji || '👤'}</span>`;
    }
    // LPC — hiển thị loading, sẽ fetch async
    return `<div class="ws-char-loading" data-lpc-id="${char.id}">⏳</div>
            <span class="ws-char-hero-fallback">${char.emoji || '👤'}</span>`;
  }

  function renderSmallAvatarHtml(char){
    if (!char) return '';
    const url = LIB.getUrl(char);
    if (url) {
      return `<img src="${url}" alt="${esc(char.name)}" loading="lazy"
                   onerror="this.parentNode.classList.add('fallback')">
              <span class="ws-char-card-fallback">${char.emoji || '👤'}</span>`;
    }
    return `<div class="ws-char-loading" data-lpc-id="${char.id}">⏳</div>
            <span class="ws-char-card-fallback">${char.emoji || '👤'}</span>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER TAB
     ═══════════════════════════════════════════════════════════════ */
  function renderCharacterTab(){
    injectCSS();

    const selected = getSelected();
    const selectedId = selected?.id || '';
    const chars = LIB.getAll();

    const cards = chars.map(c => {
      const isSelected = c.id === selectedId;
      return `
        <div class="ws-char-card ${isSelected ? 'selected' : ''}"
             data-char-id="${esc(c.id)}" role="button" tabindex="0">
          <div class="ws-char-card-avatar">${renderSmallAvatarHtml(c)}</div>
          <div class="ws-char-card-name">${esc(c.name)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="ws-char-hero">
        <div class="ws-char-hero-avatar" id="wsCharHeroAvatar">${renderAvatarHtml(selected)}</div>
        <div class="ws-char-hero-name">${esc(selected?.name || 'Chưa chọn')}</div>
        <div class="ws-char-hero-class">${esc(selected?.class || '—')}</div>
      </div>
      <div class="ws-char-section-title">👥 Chọn nhân vật (${chars.length})</div>
      <div class="ws-char-grid">${cards}</div>
      <div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:16px;line-height:1.5;">
        <b>Ragnarok Online</b> + <b>LPC</b> (pixel art, CC0)<br>
        Full body — nhân vật sẽ xuất hiện trong tab <b>Rèn</b>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     WIRE
     ═══════════════════════════════════════════════════════════════ */
  function wireCharacter(body){
    body.querySelectorAll('.ws-char-card').forEach(card => {
      const handler = () => {
        const id = card.dataset.charId;
        if (id) selectCharacter(id);
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    // Fetch LPC ảnh async
    resolveLpcImages(body);
  }

  /* ═══════════════════════════════════════════════════════════════
     RESOLVE LPC ẢNH (async, replace loading → img)
     ═══════════════════════════════════════════════════════════════ */
  async function resolveLpcImages(body){
    const loadings = body.querySelectorAll('.ws-char-loading');
    if (!loadings.length) return;

    for (const el of loadings){
      const charId = el.dataset.lpcId;
      const char = LIB.getById(charId);
      if (!char) continue;

      try {
        const url = await LIB.getUrlAsync(char);
        if (!url) continue;

        const parent = el.parentNode;
        const img = document.createElement('img');
        img.src = url;
        img.alt = char.name;
        img.loading = 'lazy';
        img.onerror = () => parent.classList.add('fallback');
        el.replaceWith(img);
      } catch(e) {
        console.warn('[WF] LPC resolve failed:', charId, e);
      }
    }

    // Re-render hero nếu nhân vật đang chọn là LPC
    const selected = getSelected();
    if (selected && selected.job == null && selected._cachedUrl){
      const heroAvatar = document.getElementById('wsCharHeroAvatar');
      if (heroAvatar) {
        heroAvatar.innerHTML = `<img src="${selected._cachedUrl}" alt="${esc(selected.name)}"
          onerror="this.parentNode.classList.add('fallback')">
          <span class="ws-char-hero-fallback">${selected.emoji || '👤'}</span>`;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     SELECT
     ═══════════════════════════════════════════════════════════════ */
  function selectCharacter(charId){
    const char = LIB.getById(charId);
    if (!char){ toast('Nhân vật không tồn tại', 'warning'); return; }
    if (!S.state){ toast('Đang tải, chờ chút', 'warning'); return; }
    if (S.state.character_id === charId) return;

    S.state.character_id = charId;
    ST.scheduleSave();
    playSound(880, .08);
    setTimeout(() => playSound(1175, .12), 60);
    toast(`✨ Đã chọn ${char.name}`, 'success');
    window.__WF.index?.render?.();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabCharacter = {
    renderCharacterTab,
    wireCharacter,
    selectCharacter,
    getSelected,
    renderAvatarHtml,
    injectCSS,
  };

  console.log('[WF] tab-character.js v2.0 ✓ (full body)');
})();