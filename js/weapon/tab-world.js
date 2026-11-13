/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — TAB WORLD (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Tab wrapper "🌍 Thế giới" — entry point của world mode.

   Lifecycle:
     renderWorldTab()   → trả HTML placeholder (container rỗng + spinner)
     wireWorld()        → mount Phaser vào container (async)
     closeWorld()       → unmount Phaser + detach HUD + detach joystick

   Auto-cleanup:
     • Khi user chuyển tab khác → unmount tự động
     • Khi đóng weapon page → unmount tự động
     • Khi user bấm nút back trong HUD → unmount + goto tab forge

   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.tabWorld):
     .renderWorldTab()    — HTML placeholder
     .wireWorld()         — Mount engine + HUD
     .closeWorld()        — Cleanup
     .isMounted()         — Check đang mount
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU world/*, CUỐI CÙNG (trước index.js hoặc sau).
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabWorld) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     DEPENDENCIES
     ═══════════════════════════════════════════════════════════════ */
  const World = window.__WF.world;
  const WorldUI = window.__WF.worldUI;
  const Player = window.__WF.player;

  if (!World || !WorldUI){
    console.error('[WF-TabWorld] thiếu world engine hoặc world-ui — kiểm tra load order');
    return;
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let _mounted = false;
  let _mounting = false;
  let _container = null;
  let _mountEl = null;

  function log(...a){
    try { console.log('[WF-TabWorld]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     CSS INJECT (chỉ cần 1 lần — các file khác đã có base CSS)
     ═══════════════════════════════════════════════════════════════ */
  function injectCSS(){
    if (document.getElementById('__wfTabWorldStyle')) return;
    const st = document.createElement('style');
    st.id = '__wfTabWorldStyle';
    st.textContent = `
.wf-world-wrap{
  position: relative;
  width: 100%;
  height: calc(100vh - 160px);
  min-height: 400px;
  border-radius: 20px;
  overflow: hidden;
  background: #1a2818;
  box-shadow: 0 12px 30px -14px rgba(0,0,0,.5);
  touch-action: none;
}
.wf-world-mount{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.wf-world-mount canvas{
  display: block !important;
  width: 100% !important;
  height: 100% !important;
}
.wf-world-placeholder{
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,236,180,.15), transparent 60%),
    linear-gradient(180deg, #2d3a28 0%, #1a2818 100%);
  color: #ffd966;
  font-family: var(--font, ui-rounded, system-ui);
}
.wf-world-placeholder-spin{
  width: 44px;
  height: 44px;
  border: 4px solid rgba(245,158,11,.25);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: wfWorldSpin .8s linear infinite;
}
@keyframes wfWorldSpin{
  to { transform: rotate(360deg); }
}
.wf-world-placeholder-text{
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.wf-world-placeholder-hint{
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,217,102,.6);
  max-width: 260px;
  text-align: center;
  line-height: 1.5;
}
.wf-world-error{
  padding: 20px;
  color: #fca5a5;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  max-width: 320px;
}
.wf-world-error b{ color: #fff; font-size: 15px; display: block; margin-bottom: 6px; }
@media (max-width: 480px){
  .wf-world-wrap{
    height: calc(100dvh - 140px);
    min-height: 360px;
    border-radius: 14px;
  }
}
`;
    document.head.appendChild(st);
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER TAB (HTML placeholder)
     ═══════════════════════════════════════════════════════════════ */
  function renderWorldTab(){
    injectCSS();

    return `
      <div class="wf-section-title">🌍 Thế giới</div>
      <div class="wf-world-wrap" id="wfWorldWrap">
        <div class="wf-world-mount" id="wfWorldMount"></div>
        <div class="wf-world-placeholder" id="wfWorldPlaceholder">
          <div class="wf-world-placeholder-spin"></div>
          <div class="wf-world-placeholder-text">Đang tải thế giới…</div>
          <div class="wf-world-placeholder-hint">Lần đầu tải Phaser (~1MB) — có thể mất 2-5s</div>
        </div>
      </div>
      <div style="font-size:11px;color:#a06a28;font-weight:700;text-align:center;margin-top:12px;line-height:1.5;">
        Chạm <b>NPC</b> (🔨 Thợ Rèn, 🏪 Shop, 🐾 Pet)<br>
        hoặc <b>Portal</b> (⚔️ Arena, 👹 Boss) để tương tác
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     WIRE (mount engine + HUD)
     ═══════════════════════════════════════════════════════════════ */
  async function wireWorld(){
    if (_mounting || _mounted){
      log('Already mounting/mounted — skip');
      return;
    }
    _mounting = true;

    _container = document.getElementById('wfWorldWrap');
    _mountEl = document.getElementById('wfWorldMount');
    const placeholder = document.getElementById('wfWorldPlaceholder');

    if (!_container || !_mountEl){
      console.warn('[WF-TabWorld] Không tìm thấy container');
      _mounting = false;
      return;
    }

    try {
      // ─── 1. Attach HUD trước (hiện loading overlay) ───
      WorldUI.attach(_container);
      WorldUI.setLoading(true, 'Đang tải thế giới…');

      // ─── 2. Wire back button ───
      WorldUI.onBack(() => {
        log('Back pressed → closeWorld');
        closeWorld();
        // Chuyển về tab Rèn
        if (window.__WF.index?.goto){
          window.__WF.index.goto('forge');
        }
      });

      // ─── 3. Mount World engine (async, load Phaser + mount scene) ───
      log('Mounting World engine…');
      await World.mount(_mountEl, {
        scenes: ['Town'],
        sceneTimeout: 8000,
      });

      log('World engine ready');
      _mounted = true;

      // ─── 4. Ẩn placeholder + loading ───
      if (placeholder) placeholder.style.display = 'none';
      WorldUI.setLoading(false);

      // ─── 5. Welcome toast ───
      WorldUI.toast('Chào mừng đến làng! 🏘️', 'success', 2200);

    } catch(err){
      console.error('[WF-TabWorld] Mount failed:', err);

      // Hiện lỗi rõ ràng
      const msg = String(err?.message || err || 'Lỗi không xác định');
      if (placeholder){
        placeholder.innerHTML = `
          <div class="wf-world-error">
            <b>⚠️ Không tải được thế giới</b>
            ${escapeHtml(msg)}<br><br>
            <span style="opacity:.7;font-size:11px">Kiểm tra kết nối mạng và thử lại</span>
          </div>
        `;
      }
      WorldUI.setLoading(false);
      WorldUI.toast('Không tải được thế giới', 'error', 3000);

      // Cleanup nửa chừng
      try { World.unmount(); } catch(_){}
      try { WorldUI.detach(); } catch(_){}

    } finally {
      _mounting = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CLOSE / UNMOUNT
     ═══════════════════════════════════════════════════════════════ */
  function closeWorld(){
    if (!_mounted && !_mounting) return;

    log('Closing world…');

    // 1. Unmount Phaser (destroy canvas + scenes)
    try {
      if (World.isReady()){
        World.unmount();
      }
    } catch(e){
      console.warn('[WF-TabWorld] World unmount error:', e);
    }

    // 2. Detach HUD
    try { WorldUI.detach(); } catch(_){}

    // 3. Placeholder về trạng thái ban đầu để lần sau vào lại
    if (_container){
      const oldPlaceholder = document.getElementById('wfWorldPlaceholder');
      if (oldPlaceholder) oldPlaceholder.remove();

      // Tạo lại placeholder
      const ph = document.createElement('div');
      ph.className = 'wf-world-placeholder';
      ph.id = 'wfWorldPlaceholder';
      ph.innerHTML = `
        <div class="wf-world-placeholder-spin"></div>
        <div class="wf-world-placeholder-text">Đang tải thế giới…</div>
        <div class="wf-world-placeholder-hint">Lần đầu tải Phaser (~1MB) — có thể mất 2-5s</div>
      `;
      _container.appendChild(ph);
    }

    _mounted = false;
    _mounting = false;
    _container = null;
    _mountEl = null;

    log('World closed ✓');
  }

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isMounted(){
    return _mounted;
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO CLEANUP — khi tab đổi hoặc page đóng
     ═══════════════════════════════════════════════════════════════ */
  function setupAutoCleanup(){
    // Hook tab change của index.js (nếu có)
    // index.js sẽ gọi closeWorld khi activeTab !== 'world'
    // Đây là fallback: nghe event
    window.addEventListener('wf:tabChanged', (e) => {
      const tab = e?.detail?.tab;
      if (tab && tab !== 'world'){
        closeWorld();
      }
    });

    // Nghe weapon page close
    window.addEventListener('wf:pageClosing', () => {
      closeWorld();
    });

    // Nghe visibilitychange — pause Phaser khi tab ẩn
    document.addEventListener('visibilitychange', () => {
      if (!_mounted) return;
      if (document.hidden){
        try { World.pause(); } catch(_){}
      } else {
        try { World.resume(); } catch(_){}
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════ */
  setupAutoCleanup();

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabWorld = {
    renderWorldTab,
    wireWorld,
    closeWorld,
    isMounted,
  };

  log('tab-world.js ✓');
})();