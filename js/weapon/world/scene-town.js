/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — SCENE TOWN (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Scene làng chính — kết hợp toàn bộ modules đã có:

     • Tileset ground (grass, stone plaza, path)
     • Cây trang trí (procedural tree texture)
     • Player (character sprite từ character-library)
     • 5 NPC/Portal: Thợ Rèn, Shop, Pet, Arena, Boss
     • Multiplayer (thấy user khác đi lại)
     • Camera follow + world bounds 1600×1152
     • Save vị trí player vào localStorage
     • Auto cleanup khi unmount

   ───────────────────────────────────────────────────────────────────────
   World layout (25×18 tiles, 64px each → 1600×1152px):

     ┌──────────────────────────────────┐
     │ 🌲  🔨Forge      🏪Shop      🌲 │  y=3
     │ 🌲                            🌲 │
     │ 🌲      (stone plaza)         🌲 │
     │ 🌲         🧙 Player          🌲 │  y=9
     │ 🌲      (stone plaza)         🌲 │
     │ 🌲                            🌲 │
     │ 🌲  🐾Pet         ⚔️Arena     🌲 │  y=15
     │ 🌲         👹Boss             🌲 │  y=16
     └──────────────────────────────────┘

   ───────────────────────────────────────────────────────────────────────
   Load order: SAU engine + tileset + joystick + player + npc + multiplayer.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.sceneTown) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     DEPENDENCIES
     ═══════════════════════════════════════════════════════════════ */
  const World = window.__WF.world;
  const Tileset = window.__WF.tileset;
  const Joystick = window.__WF.joystick;
  const Player = window.__WF.player;
  const NPC = window.__WF.npc;
  const MP = window.__WF.multiplayer;

  if (!World){
    console.error('[WF-Town] world engine chưa load — kiểm tra load order');
    return;
  }
  if (!Tileset || !Player || !NPC || !Joystick){
    console.error('[WF-Town] thiếu module — cần tileset, joystick, player, npc');
    return;
  }

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════ */
  const WORLD_COLS = 25;
  const WORLD_ROWS = 18;
  const WORLD_W = WORLD_COLS * 64;   // 1600
  const WORLD_H = WORLD_ROWS * 64;   // 1152
  const SAVE_KEY = '__wf_town_pos_v1';
  const SAVE_INTERVAL_MS = 2000;

  function log(...a){
    try { console.log('[WF-Town]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     SCENE CLASS
     ═══════════════════════════════════════════════════════════════ */
  class TownScene extends Phaser.Scene {
    constructor(){
      super({ key: 'Town' });
      this._lastSave = 0;
      this._shutdownFired = false;
    }

    /* ═══════════════════════════════════════════════════════════
       CREATE
       ═══════════════════════════════════════════════════════════ */
    create(){
      const scene = this;
      log('Creating scene...');

      // 1. Generate tile textures
      Tileset.generateAll(this);

      // 2. Generate tree texture (inline, không cần asset)
      this._makeTreeTexture();

      // 3. Draw ground (grass base + stone plaza + paths)
      this._drawGround();

      // 4. Draw decorations (cây viền)
      this._drawDecorations();

      // 5. World bounds + camera bounds
      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBackgroundColor('#1a2818');

      // 6. Joystick (attach vào canvas parent)
      try {
        const canvas = this.sys.game.canvas;
        const parentEl = canvas && canvas.parentElement;
        if (parentEl){
          Joystick.attach({ parent: parentEl });
        }
      } catch(e){
        console.warn('[WF-Town] Joystick attach fail:', e);
      }

      // 7. Lấy vị trí đã lưu (hoặc center)
      const saved = this._loadPos();

      // 8. Create player (async — sprite load sau)
      Player.create(this, { x: saved.x, y: saved.y }).then(() => {
        log('Player ready');
      }).catch(e => {
        console.warn('[WF-Town] Player create fail:', e);
      });

      // 9. Create NPCs + Portals
      this._createNPCs();

      // 10. Multiplayer (nếu có Supabase + user)
      try {
        if (MP) MP.init(this, { sceneKey: 'town' });
      } catch(e){
        console.warn('[WF-Town] Multiplayer init fail:', e);
      }

      // 11. Welcome overlay
      this._showWelcome();

      // 12. Shutdown cleanup
      this.events.once('shutdown', () => {
        if (this._shutdownFired) return;
        this._shutdownFired = true;
        this._cleanup();
      });

      log('Scene ready ✓');
    }

    /* ═══════════════════════════════════════════════════════════
       UPDATE
       ═══════════════════════════════════════════════════════════ */
    update(_time, delta){
      try {
        // Player movement
        Player.update(delta);

        const pos = Player.getPosition();

        // NPC proximity (hiện arrow khi player gần)
        NPC.updateAll(pos.x, pos.y);

        // Multiplayer sync (throttle trong module)
        if (MP) MP.update(pos.x, pos.y);

        // Save position định kỳ
        const now = Date.now();
        if (now - this._lastSave > SAVE_INTERVAL_MS){
          this._lastSave = now;
          this._savePos(pos.x, pos.y);
        }
      } catch(e){
        // Không spam log
      }
    }

    /* ═══════════════════════════════════════════════════════════
       TREE TEXTURE (procedural)
       ═══════════════════════════════════════════════════════════ */
    _makeTreeTexture(){
      if (this.textures.exists('tree')) return;
      const g = this.make.graphics({ add: false });

      // Shadow
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(32, 82, 46, 12);

      // Trunk
      g.fillStyle(0x5a3a1a, 1);
      g.fillRect(28, 52, 8, 30);
      g.fillStyle(0x4a2a0a, 1);
      g.fillRect(30, 52, 2, 30);

      // Foliage (3 layers)
      g.fillStyle(0x2d5a2d, 1);
      g.fillCircle(32, 42, 30);
      g.fillStyle(0x3a6b3a, 1);
      g.fillCircle(22, 34, 20);
      g.fillStyle(0x4a7a4a, 1);
      g.fillCircle(42, 32, 18);
      g.fillStyle(0x5a8a5a, 0.6);
      g.fillCircle(38, 26, 8);

      g.generateTexture('tree', 64, 92);
      g.destroy();
    }

    /* ═══════════════════════════════════════════════════════════
       DRAW GROUND
       ═══════════════════════════════════════════════════════════ */
    _drawGround(){
      const T = Tileset.TILE_SIZE;
      const cx = Math.floor(WORLD_COLS / 2);
      const cy = Math.floor(WORLD_ROWS / 2);

      // ─── Base grass everywhere ───
      for (let x = 0; x < WORLD_COLS; x++){
        for (let y = 0; y < WORLD_ROWS; y++){
          const isDark = (x * 7 + y * 11) % 6 === 0;
          const tile = isDark ? 'tile_grass_dark' : 'tile_grass';
          this.add.image(x * T, y * T, tile).setOrigin(0).setDepth(-1000);
        }
      }

      // ─── Stone plaza ở center (bán kính 5 tiles) ───
      for (let dx = -5; dx <= 5; dx++){
        for (let dy = -5; dy <= 5; dy++){
          if (dx*dx + dy*dy <= 25){
            const x = cx + dx;
            const y = cy + dy;
            if (x >= 0 && x < WORLD_COLS && y >= 0 && y < WORLD_ROWS){
              this.add.image(x * T, y * T, 'tile_stone').setOrigin(0).setDepth(-999);
            }
          }
        }
      }

      // ─── Paths từ center tới 5 điểm ───
      // Forge (top-left)
      this._drawPath(cx, cy - 5, cx - 6, 3);
      // Shop (top-right)
      this._drawPath(cx, cy - 5, cx + 6, 3);
      // Pet (bottom-left)
      this._drawPath(cx, cy + 5, cx - 6, 15);
      // Arena (bottom-right)
      this._drawPath(cx, cy + 5, cx + 6, 15);
      // Boss (bottom-center)
      this._drawPath(cx, cy + 5, cx, 16);
    }

    /* ═══════════════════════════════════════════════════════════
       DRAW PATH (L-shape)
       ═══════════════════════════════════════════════════════════ */
    _drawPath(x1, y1, x2, y2){
      const T = Tileset.TILE_SIZE;
      const seen = new Set();

      const put = (x, y) => {
        if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) return;
        const k = x + ',' + y;
        if (seen.has(k)) return;
        seen.add(k);
        this.add.image(x * T, y * T, 'tile_path').setOrigin(0).setDepth(-998);
      };

      // Vertical segment (từ y1 đến y2)
      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);
      for (let y = yStart; y <= yEnd; y++) put(x1, y);

      // Horizontal segment (từ x1 đến x2 ở y2)
      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      for (let x = xStart; x <= xEnd; x++) put(x, y2);
    }

    /* ═══════════════════════════════════════════════════════════
       DRAW DECORATIONS (cây viền)
       ═══════════════════════════════════════════════════════════ */
    _drawDecorations(){
      const T = Tileset.TILE_SIZE;

      const trees = [
        // Top border (tránh NPC forge/shop ở y=3)
        [1,1], [3,1], [5,1], [8,1], [16,1], [19,1], [22,1], [24,1],
        // Bottom border
        [1,17], [3,17], [6,17], [9,17], [15,17], [18,17], [22,17], [24,17],
        // Left border
        [1,5], [1,8], [1,11], [1,14],
        // Right border
        [24,5], [24,8], [24,11], [24,14],
        // Scatter trong làng (xa NPC)
        [4,6], [7,10], [18,8], [21,12], [10,3], [15,3],
        [10,14], [15,14], [4,12], [20,6],
      ];

      trees.forEach(([tx, ty]) => {
        const tree = this.add.image(tx * T + T/2, ty * T + T/2, 'tree');
        tree.setOrigin(0.5, 0.88);
        tree.setDepth(1000 + ty * T);
        // Random scale nhẹ để đa dạng
        const s = 0.9 + (tx * 13 + ty * 7) % 20 / 100;
        tree.setScale(s);
      });
    }

    /* ═══════════════════════════════════════════════════════════
       CREATE NPCs
       ═══════════════════════════════════════════════════════════ */
    _createNPCs(){
      const T = Tileset.TILE_SIZE;
      const cx = Math.floor(WORLD_COLS / 2);

      // Callback chung — đóng world + chuyển tab
      const goToTab = (tab) => () => {
        log('Interact →', tab);
        this._cleanup();
        if (World.isReady()) World.unmount();
        if (window.__WF.index?.goto) window.__WF.index.goto(tab);
      };

      // 1. Thợ Rèn (top-left)
      NPC.create(this, {
        type: 'npc',
        x: (cx - 6) * T + T/2,
        y: 3 * T + T/2,
        emoji: '🔨',
        name: 'Thợ Rèn',
        tint: 0xff6b6b,
        action: 'forge',
        onInteract: goToTab('forge'),
      });

      // 2. Shop (top-right)
      NPC.create(this, {
        type: 'npc',
        x: (cx + 6) * T + T/2,
        y: 3 * T + T/2,
        emoji: '🏪',
        name: 'Cửa Hàng',
        tint: 0x4fa370,
        action: 'shop',
        onInteract: goToTab('shop'),
      });

      // 3. Pet (bottom-left)
      NPC.create(this, {
        type: 'npc',
        x: (cx - 6) * T + T/2,
        y: 15 * T + T/2,
        emoji: '🐾',
        name: 'Chuồng Pet',
        tint: 0xf59e0b,
        action: 'pet',
        onInteract: goToTab('pet'),
      });

      // 4. Arena portal (bottom-right)
      NPC.create(this, {
        type: 'portal',
        x: (cx + 6) * T + T/2,
        y: 15 * T + T/2,
        emoji: '⚔️',
        name: 'Đấu Trường',
        color: 0xef4444,
        action: 'arena',
        onInteract: goToTab('arena'),
      });

      // 5. Boss portal (bottom-center)
      NPC.create(this, {
        type: 'portal',
        x: cx * T + T/2,
        y: 16 * T + T/2,
        emoji: '👹',
        name: 'Hang Boss',
        color: 0x7c3aed,
        action: 'boss',
        onInteract: goToTab('boss'),
      });

      log('5 NPC/Portal created');
    }

    /* ═══════════════════════════════════════════════════════════
       WELCOME OVERLAY
       ═══════════════════════════════════════════════════════════ */
    _showWelcome(){
      const cam = this.cameras.main;
      const w = cam.width;
      const h = cam.height;

      const text = this.add.text(w/2, h/2 - 40, '🏘️ LÀNG ĐẢO MÈO', {
        fontFamily: 'ui-rounded, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: '900',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      });
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(10000);
      text.setAlpha(0);

      const hint = this.add.text(w/2, h/2 + 10, 'Chạm NPC/Portal để tương tác', {
        fontFamily: 'ui-rounded, system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        color: '#ffd966',
        stroke: '#000000',
        strokeThickness: 3,
      });
      hint.setOrigin(0.5);
      hint.setScrollFactor(0);
      hint.setDepth(10000);
      hint.setAlpha(0);

      this.tweens.add({
        targets: [text, hint],
        alpha: 1,
        duration: 400,
        ease: 'Sine.Out',
      });
      this.tweens.add({
        targets: [text, hint],
        alpha: 0,
        y: '-=40',
        duration: 400,
        delay: 2200,
        ease: 'Sine.In',
        onComplete: () => {
          text.destroy();
          hint.destroy();
        },
      });
    }

    /* ═══════════════════════════════════════════════════════════
       SAVE / LOAD POSITION
       ═══════════════════════════════════════════════════════════ */
    _savePos(x, y){
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          x: Math.round(x),
          y: Math.round(y),
        }));
      } catch(_){}
    }

    _loadPos(){
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw){
          const p = JSON.parse(raw);
          if (Number.isFinite(p.x) && Number.isFinite(p.y)
              && p.x > 0 && p.x < WORLD_W
              && p.y > 0 && p.y < WORLD_H){
            return { x: p.x, y: p.y };
          }
        }
      } catch(_){}
      // Default: center của làng
      return { x: WORLD_W / 2, y: WORLD_H / 2 };
    }

    /* ═══════════════════════════════════════════════════════════
       CLEANUP
       ═══════════════════════════════════════════════════════════ */
    _cleanup(){
      // Save vị trí cuối
      try {
        const pos = Player.getPosition();
        if (pos && Number.isFinite(pos.x)){
          this._savePos(pos.x, pos.y);
        }
      } catch(_){}

      // Destroy modules (mỗi module tự try/catch)
      try { if (MP) MP.destroy(); } catch(_){}
      try { if (NPC) NPC.destroyAll(); } catch(_){}
      try { if (Player) Player.destroy(); } catch(_){}
      try { if (Joystick) Joystick.detach(); } catch(_){}

      log('Cleanup done');
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     REGISTER WITH ENGINE
     ═══════════════════════════════════════════════════════════════ */
  World.registerScene('Town', TownScene);

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.sceneTown = {
    TownScene,
    WORLD_W,
    WORLD_H,
    WORLD_COLS,
    WORLD_ROWS,
    SAVE_KEY,
  };

  log('scene-town.js ✓ (registered)');
})();