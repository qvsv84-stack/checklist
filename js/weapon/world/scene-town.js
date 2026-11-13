/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — SCENE TOWN (v1.3 — fix goToTab + reset state)
   ───────────────────────────────────────────────────────────────────────
   v1.3 FIX:
     - goToTab() gọi tabWorld.closeWorld() thay vì World.unmount() trực tiếp
       → reset _mounted flag → mở lại World tab được
     - Fallback nếu tabWorld chưa có
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.sceneTown) return;
  window.__WF = window.__WF || {};

  const World = window.__WF.world;
  const Tileset = window.__WF.tileset;
  const Joystick = window.__WF.joystick;
  const Player = window.__WF.player;
  const NPC = window.__WF.npc;
  const MP = window.__WF.multiplayer;

  if (!World){ console.error('[WF-Town] world engine chưa load'); return; }
  if (!Tileset || !Player || !NPC || !Joystick){ console.error('[WF-Town] thiếu module'); return; }

  const WORLD_COLS = 25;
  const WORLD_ROWS = 18;
  const WORLD_W = WORLD_COLS * 64;
  const WORLD_H = WORLD_ROWS * 64;
  const SAVE_KEY = '__wf_town_pos_v1';
  const SAVE_INTERVAL_MS = 2000;

  function log(...a){ try { console.log('[WF-Town]', ...a); } catch(_){} }

  const TownScene = {
    key: 'Town',

    init: function(){
      this._lastSave = 0;
      this._shutdownFired = false;

      const self = TownScene;
      this._makeTreeTexture = self._makeTreeTexture.bind(this);
      this._drawGround      = self._drawGround.bind(this);
      this._drawPath        = self._drawPath.bind(this);
      this._drawDecorations = self._drawDecorations.bind(this);
      this._createNPCs      = self._createNPCs.bind(this);
      this._showWelcome     = self._showWelcome.bind(this);
      this._savePos         = self._savePos.bind(this);
      this._loadPos         = self._loadPos.bind(this);
      this._cleanup         = self._cleanup.bind(this);

      log('init() — bound 9 custom methods');
    },

    create: function(){
      log('Creating scene...');

      Tileset.generateAll(this);
      this._makeTreeTexture();
      this._drawGround();
      this._drawDecorations();

      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBackgroundColor('#1a2818');

      try {
        const canvas = this.sys.game.canvas;
        const parentEl = canvas && canvas.parentElement;
        if (parentEl){
          Joystick.attach({ parent: parentEl });
        }
      } catch(e){
        console.warn('[WF-Town] Joystick attach fail:', e);
      }

      const saved = this._loadPos();
      Player.create(this, { x: saved.x, y: saved.y }).then(() => {
        log('Player ready');
      }).catch(e => {
        console.warn('[WF-Town] Player create fail:', e);
      });

      this._createNPCs();

      try {
        if (MP) MP.init(this, { sceneKey: 'town' });
      } catch(e){
        console.warn('[WF-Town] Multiplayer init fail:', e);
      }

      this._showWelcome();

      this.events.once('shutdown', () => {
        if (this._shutdownFired) return;
        this._shutdownFired = true;
        this._cleanup();
      });

      log('Scene ready ✓');
    },

    update: function(_time, delta){
      try {
        Player.update(delta);
        const pos = Player.getPosition();
        NPC.updateAll(pos.x, pos.y);
        if (MP) MP.update(pos.x, pos.y);

        const now = Date.now();
        if (now - this._lastSave > SAVE_INTERVAL_MS){
          this._lastSave = now;
          this._savePos(pos.x, pos.y);
        }
      } catch(e){}
    },

    _makeTreeTexture: function(){
      if (this.textures.exists('tree')) return;
      const g = this.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(32, 82, 46, 12);
      g.fillStyle(0x5a3a1a, 1);
      g.fillRect(28, 52, 8, 30);
      g.fillStyle(0x4a2a0a, 1);
      g.fillRect(30, 52, 2, 30);
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
    },

    _drawGround: function(){
      const T = Tileset.TILE_SIZE;
      const cx = Math.floor(WORLD_COLS / 2);
      const cy = Math.floor(WORLD_ROWS / 2);

      for (let x = 0; x < WORLD_COLS; x++){
        for (let y = 0; y < WORLD_ROWS; y++){
          const isDark = (x * 7 + y * 11) % 6 === 0;
          const tile = isDark ? 'tile_grass_dark' : 'tile_grass';
          this.add.image(x * T, y * T, tile).setOrigin(0).setDepth(-1000);
        }
      }

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

      this._drawPath(cx, cy - 5, cx - 6, 3);
      this._drawPath(cx, cy - 5, cx + 6, 3);
      this._drawPath(cx, cy + 5, cx - 6, 15);
      this._drawPath(cx, cy + 5, cx + 6, 15);
      this._drawPath(cx, cy + 5, cx, 16);
    },

    _drawPath: function(x1, y1, x2, y2){
      const T = Tileset.TILE_SIZE;
      const seen = new Set();
      const self = this;

      function put(x, y){
        if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) return;
        const k = x + ',' + y;
        if (seen.has(k)) return;
        seen.add(k);
        self.add.image(x * T, y * T, 'tile_path').setOrigin(0).setDepth(-998);
      }

      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);
      for (let y = yStart; y <= yEnd; y++) put(x1, y);

      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      for (let x = xStart; x <= xEnd; x++) put(x, y2);
    },

    _drawDecorations: function(){
      const T = Tileset.TILE_SIZE;
      const trees = [
        [1,1], [3,1], [5,1], [8,1], [16,1], [19,1], [22,1], [24,1],
        [1,17], [3,17], [6,17], [9,17], [15,17], [18,17], [22,17], [24,17],
        [1,5], [1,8], [1,11], [1,14],
        [24,5], [24,8], [24,11], [24,14],
        [4,6], [7,10], [18,8], [21,12], [10,3], [15,3],
        [10,14], [15,14], [4,12], [20,6],
      ];

      trees.forEach(([tx, ty]) => {
        const tree = this.add.image(tx * T + T/2, ty * T + T/2, 'tree');
        tree.setOrigin(0.5, 0.88);
        tree.setDepth(1000 + ty * T);
        const s = 0.9 + (tx * 13 + ty * 7) % 20 / 100;
        tree.setScale(s);
      });
    },

    _createNPCs: function(){
      const T = Tileset.TILE_SIZE;
      const cx = Math.floor(WORLD_COLS / 2);
      const self = this;

      /* ⭐ FIX: goToTab dùng tabWorld.closeWorld() để reset state */
      function goToTab(tab){
        return function(){
          log('Interact →', tab);

          // Ưu tiên closeWorld() — reset _mounted flag
          if (window.__WF.tabWorld && typeof window.__WF.tabWorld.closeWorld === 'function'){
            window.__WF.tabWorld.closeWorld();
          } else {
            // Fallback: unmount trực tiếp (chỉ dùng khi tabWorld chưa load)
            try { self._cleanup(); } catch(_){}
            if (World.isReady()) World.unmount();
          }

          // Chuyển tab
          if (window.__WF.index && typeof window.__WF.index.goto === 'function'){
            window.__WF.index.goto(tab);
          }
        };
      }

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
    },

    _showWelcome: function(){
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

      this.tweens.add({ targets: [text, hint], alpha: 1, duration: 400, ease: 'Sine.Out' });
      this.tweens.add({
        targets: [text, hint],
        alpha: 0, y: '-=40',
        duration: 400, delay: 2200, ease: 'Sine.In',
        onComplete: () => { text.destroy(); hint.destroy(); },
      });
    },

    _savePos: function(x, y){
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          x: Math.round(x), y: Math.round(y),
        }));
      } catch(_){}
    },

    _loadPos: function(){
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
      return { x: WORLD_W / 2, y: WORLD_H / 2 };
    },

    _cleanup: function(){
      try {
        const pos = Player.getPosition();
        if (pos && Number.isFinite(pos.x)){
          this._savePos(pos.x, pos.y);
        }
      } catch(_){}

      try { if (MP) MP.destroy(); } catch(_){}
      try { if (NPC) NPC.destroyAll(); } catch(_){}
      try { if (Player) Player.destroy(); } catch(_){}
      try { if (Joystick) Joystick.detach(); } catch(_){}

      log('Cleanup done');
    },
  };

  World.registerScene('Town', TownScene);

  window.__WF.sceneTown = {
    TownScene, WORLD_W, WORLD_H, WORLD_COLS, WORLD_ROWS, SAVE_KEY,
  };

  log('scene-town.js v1.3 ✓ (goToTab resets state)');
})();