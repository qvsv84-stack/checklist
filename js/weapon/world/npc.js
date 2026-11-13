/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — NPC + PORTAL (v1.1 — proximity gate)
   ───────────────────────────────────────────────────────────────────────
   v1.1 FIX:
     - Chỉ tap được NPC/Portal khi player ở gần (< INTERACT_RADIUS)
     - Tap xa → toast "Đi tới gần để tương tác" (không trigger)
     - Per-item debounce (không block tap nhiều NPC liên tiếp)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.npc) return;
  window.__WF = window.__WF || {};

  const INTERACT_RADIUS = 90;
  const NPC_DEPTH_BASE = 1000;
  const PORTAL_SIZE = 100;
  const INTERACT_COOLDOWN_MS = 800;

  function log(...a){ try { console.log('[WF-NPC]', ...a); } catch(_){} }

  const _items = [];

  function toast(msg, type){
    try {
      const U = window.__WF.utils;
      if (U && U.toast) return U.toast(msg, type || 'info');
    } catch(_){}
  }

  function create(scene, config){
    if (!scene) throw new Error('npc.create: scene required');
    if (!config) throw new Error('npc.create: config required');

    const type = config.type || 'npc';
    const x = Number(config.x) || 0;
    const y = Number(config.y) || 0;
    const emoji = config.emoji || '❓';
    const name = config.name || 'NPC';
    const onInteract = typeof config.onInteract === 'function' ? config.onInteract : () => {};

    return type === 'portal'
      ? createPortal(scene, x, y, emoji, name, onInteract, config)
      : createNpc(scene, x, y, emoji, name, onInteract, config);
  }

  /* ═══════════════════════════════════════════════════════════════
     HANDLE TAP — gate by proximity
     ═══════════════════════════════════════════════════════════════ */
  function handleTap(item){
    if (!item) return;
    if (item._lastTapAt && Date.now() - item._lastTapAt < INTERACT_COOLDOWN_MS){
      return; // debounce per-item
    }
    item._lastTapAt = Date.now();

    if (!item.nearPlayer){
      toast('Đi tới gần để tương tác', 'info');
      return;
    }

    try {
      if (typeof item.onInteract === 'function'){
        item.onInteract(item);
      }
    } catch(e){
      console.warn('[WF-NPC] onInteract error:', e);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     NPC
     ═══════════════════════════════════════════════════════════════ */
  function createNpc(scene, x, y, emoji, name, onInteract, config){
    const tint = Number(config.tint) || 0xffd966;
    const container = scene.add.container(x, y);
    container.setDepth(NPC_DEPTH_BASE + y);

    const shadow = scene.add.ellipse(0, 26, 44, 14, 0x000000, 0.35);
    container.add(shadow);

    const base = scene.add.image(0, 0, 'npc_base').setTint(tint);
    base.setDisplaySize(56, 64);
    container.add(base);

    const emojiText = scene.add.text(0, 0, emoji, {
      fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", sans-serif',
      fontSize: '28px',
    });
    emojiText.setOrigin(0.5, 0.55);
    container.add(emojiText);

    const nametag = scene.add.text(0, 40, name, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    nametag.setOrigin(0.5, 0);
    container.add(nametag);

    const arrow = scene.add.text(0, -46, '⬇', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    arrow.setOrigin(0.5, 1);
    arrow.setAlpha(0);
    container.add(arrow);

    scene.tweens.add({
      targets: emojiText,
      y: -3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: arrow,
      y: -52, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    base.setInteractive({ useHandCursor: true });
    base.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      handleTap(item);
    });
    base.on('pointerover', () => {
      scene.tweens.add({ targets: container, scale: 1.08, duration: 120, ease: 'Sine.Out' });
      base.setTint(0xffffff);
    });
    base.on('pointerout', () => {
      scene.tweens.add({ targets: container, scale: 1, duration: 120, ease: 'Sine.Out' });
      base.setTint(tint);
    });

    const item = {
      type: 'npc',
      container, base, emojiText, nametag, arrow, shadow,
      x, y, onInteract,
      action: config.action || null,
      nearPlayer: false,
      _lastTapAt: 0,
    };
    _items.push(item);
    log('NPC created:', name, 'at', x, y);
    return item;
  }

  /* ═══════════════════════════════════════════════════════════════
     PORTAL
     ═══════════════════════════════════════════════════════════════ */
  function createPortal(scene, x, y, emoji, name, onInteract, config){
    const color = Number(config.color) || 0xf59e0b;
    const container = scene.add.container(x, y);
    container.setDepth(NPC_DEPTH_BASE + y - 10);

    const ring = scene.add.image(0, 0, 'portal_ring');
    ring.setDisplaySize(PORTAL_SIZE, PORTAL_SIZE);
    ring.setTint(color);
    container.add(ring);

    const emojiText = scene.add.text(0, 0, emoji, {
      fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", sans-serif',
      fontSize: '36px',
    });
    emojiText.setOrigin(0.5, 0.5);
    container.add(emojiText);

    const nametag = scene.add.text(0, -PORTAL_SIZE / 2 - 12, name, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#fff5d4',
      stroke: '#000000',
      strokeThickness: 3,
    });
    nametag.setOrigin(0.5, 1);
    container.add(nametag);

    const arrow = scene.add.text(0, PORTAL_SIZE / 2 + 6, '⬆', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    arrow.setOrigin(0.5, 0);
    arrow.setAlpha(0);
    container.add(arrow);

    scene.tweens.add({
      targets: ring,
      scale: { from: 0.92, to: 1.05 },
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: ring, angle: 360, duration: 8000, repeat: -1, ease: 'Linear',
    });
    scene.tweens.add({
      targets: emojiText,
      scale: { from: 1, to: 1.08 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: arrow,
      y: PORTAL_SIZE / 2 + 12,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    ring.setInteractive(
      new Phaser.Geom.Circle(PORTAL_SIZE / 2, PORTAL_SIZE / 2, PORTAL_SIZE / 2),
      Phaser.Geom.Circle.Contains
    );
    ring.on('pointerdown', (pointer, lx, ly, event) => {
      event.stopPropagation();
      handleTap(item);
    });
    ring.on('pointerover', () => {
      scene.tweens.add({ targets: container, scale: 1.1, duration: 120 });
    });
    ring.on('pointerout', () => {
      scene.tweens.add({ targets: container, scale: 1, duration: 120 });
    });

    const item = {
      type: 'portal',
      container, ring, emojiText, nametag, arrow,
      x, y, onInteract,
      action: config.action || null,
      nearPlayer: false,
      _lastTapAt: 0,
    };
    _items.push(item);
    log('Portal created:', name, 'at', x, y);
    return item;
  }

  /* ═══════════════════════════════════════════════════════════════
     UPDATE ALL
     ═══════════════════════════════════════════════════════════════ */
  function updateAll(playerX, playerY){
    if (typeof playerX !== 'number' || typeof playerY !== 'number') return;

    for (const item of _items){
      if (!item.container) continue;
      const dx = playerX - item.x;
      const dy = playerY - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const near = dist < INTERACT_RADIUS;

      if (near !== item.nearPlayer){
        item.nearPlayer = near;
        if (item.arrow){
          item.arrow.setAlpha(near ? 1 : 0);
        }
      }
    }
  }

  function destroyAll(){
    for (const item of _items){
      try { if (item.container) item.container.destroy(); } catch(_){}
    }
    _items.length = 0;
    log('All NPCs/portals destroyed');
  }

  function getAll(){ return _items.slice(); }

  window.__WF.npc = {
    create, updateAll, destroyAll, getAll,
    INTERACT_RADIUS,
  };

  log('npc.js ✓ v1.1 (proximity gate + per-item debounce)');
})();