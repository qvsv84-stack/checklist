/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — TILESET (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Generate textures bằng Phaser Graphics — không cần CDN asset.
   → 100% reliable, không sợ 404, works offline, siêu nhẹ.

   Textures được generate:
     • Ground: grass, grass_dark, path, water, stone (64×64)
     • NPC base: circle trắng viền vàng (56×56) — tint theo NPC type
     • Portal ring: vòng phát sáng (100×100)
     • Player marker: chấm nhỏ dưới chân player (80×80)

   Player sprite: load từ URL (character-library.js) → add vào Phaser texture manager.
   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.tileset):
     .generateAll(scene)                    — Tạo toàn bộ texture
     .getGroundKey('grass'|'path'|...)      — Trả về texture key
     .loadPlayerTexture(scene, url, key, cb) — Load player từ URL
     .TILE_SIZE / .NPC_SIZE / .PORTAL_SIZE  — Kích thước
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU engine.js, TRƯỚC scene-town.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tileset) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     SIZES
     ═══════════════════════════════════════════════════════════════ */
  const TILE_SIZE = 64;
  const NPC_SIZE = 56;
  const PORTAL_SIZE = 100;
  const MARKER_SIZE = 80;

  function log(...a){
    try { console.log('[WF-Tileset]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     SEEDED RANDOM — tile luôn giống nhau mỗi lần load
     ═══════════════════════════════════════════════════════════════ */
  function makeRng(seed){
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     GROUND TILES
     ═══════════════════════════════════════════════════════════════ */
  function makeGrassTile(scene, key, baseColor, patchColor, hiColor, seed){
    if (scene.textures.exists(key)) return;
    const rng = makeRng(seed || 1);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base
    g.fillStyle(baseColor, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Darker patches (grass texture)
    g.fillStyle(patchColor, 0.55);
    for (let i = 0; i < 12; i++){
      const x = Math.floor(rng() * TILE_SIZE);
      const y = Math.floor(rng() * TILE_SIZE);
      const s = 2 + Math.floor(rng() * 5);
      g.fillRect(x, y, s, s);
    }

    // Light highlights
    g.fillStyle(hiColor, 0.5);
    for (let i = 0; i < 8; i++){
      const x = Math.floor(rng() * TILE_SIZE);
      const y = Math.floor(rng() * TILE_SIZE);
      g.fillRect(x, y, 2, 2);
    }

    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  function makePathTile(scene, key){
    if (scene.textures.exists(key)) return;
    const rng = makeRng(42);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base tan
    g.fillStyle(0xc8a878, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Grout lines
    g.fillStyle(0xa88858, 0.65);
    g.fillRect(0, TILE_SIZE / 2 - 1, TILE_SIZE, 2);
    g.fillRect(TILE_SIZE / 2 - 1, 0, 2, TILE_SIZE / 2);
    g.fillRect(0, TILE_SIZE / 2, 2, TILE_SIZE / 2);
    g.fillRect(TILE_SIZE - 2, TILE_SIZE / 2, 2, TILE_SIZE / 2);

    // Darker specks
    g.fillStyle(0xb09060, 0.4);
    for (let i = 0; i < 10; i++){
      const x = Math.floor(rng() * TILE_SIZE);
      const y = Math.floor(rng() * TILE_SIZE);
      g.fillRect(x, y, 2, 2);
    }

    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  function makeWaterTile(scene, key){
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base blue
    g.fillStyle(0x4a9bd4, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Wave highlights
    g.fillStyle(0x6bb6e8, 0.7);
    g.fillRect(8, 16, 20, 2);
    g.fillRect(36, 32, 18, 2);
    g.fillRect(12, 48, 22, 2);

    g.fillStyle(0x8dd4f0, 0.5);
    g.fillRect(28, 16, 8, 2);
    g.fillRect(56, 32, 6, 2);

    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  function makeStoneTile(scene, key){
    if (scene.textures.exists(key)) return;
    const rng = makeRng(77);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // Base gray
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // Grout
    g.fillStyle(0x666666, 0.65);
    g.fillRect(0, TILE_SIZE / 2 - 1, TILE_SIZE, 2);
    g.fillRect(TILE_SIZE / 2 - 1, 0, 2, TILE_SIZE);

    // Specks
    g.fillStyle(0xa0a0a0, 0.4);
    for (let i = 0; i < 12; i++){
      const x = Math.floor(rng() * TILE_SIZE);
      const y = Math.floor(rng() * TILE_SIZE);
      g.fillRect(x, y, 2, 2);
    }

    g.generateTexture(key, TILE_SIZE, TILE_SIZE);
    g.destroy();
  }

  /* ═══════════════════════════════════════════════════════════════
     NPC BASE (circle trắng viền vàng, tint theo type)
     ═══════════════════════════════════════════════════════════════ */
  function makeNpcBase(scene, key){
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const r = NPC_SIZE / 2;
    const cy = r;

    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(r, cy + r * 0.75, r * 1.6, r * 0.5);

    // White circle base
    g.fillStyle(0xffffff, 1);
    g.fillCircle(r, cy, r);

    // Border vàng
    g.lineStyle(3, 0xf59e0b, 1);
    g.strokeCircle(r, cy, r - 1.5);

    g.generateTexture(key, NPC_SIZE, NPC_SIZE + 8);
    g.destroy();
  }

  /* ═══════════════════════════════════════════════════════════════
     PORTAL RING (glowing)
     ═══════════════════════════════════════════════════════════════ */
  function makePortal(scene, key){
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const c = PORTAL_SIZE / 2;
    const r = c - 8;

    // Outer glow (wide, faint)
    g.lineStyle(8, 0xf59e0b, 0.15);
    g.strokeCircle(c, c, r + 2);

    // Mid glow
    g.lineStyle(5, 0xffd966, 0.4);
    g.strokeCircle(c, c, r - 4);

    // Inner bright ring
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeCircle(c, c, r - 12);

    // Center dot
    g.fillStyle(0xf59e0b, 0.7);
    g.fillCircle(c, c, 5);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(c, c, 2);

    g.generateTexture(key, PORTAL_SIZE, PORTAL_SIZE);
    g.destroy();
  }

  /* ═══════════════════════════════════════════════════════════════
     PLAYER MARKER (chấm nhỏ dưới chân)
     ═══════════════════════════════════════════════════════════════ */
  function makePlayerMarker(scene, key){
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const c = MARKER_SIZE / 2;

    // Shadow ellipse
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(c, c, 56, 20);

    // Center dot (target)
    g.fillStyle(0xf59e0b, 0.55);
    g.fillCircle(c, c, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(c, c, 3);

    g.generateTexture(key, MARKER_SIZE, MARKER_SIZE);
    g.destroy();
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC GENERATORS
     ═══════════════════════════════════════════════════════════════ */
  function generateGroundTextures(scene){
    makeGrassTile(scene, 'tile_grass',      0x7cb342, 0x689f38, 0x9ccc65, 11);
    makeGrassTile(scene, 'tile_grass_dark', 0x689f38, 0x558b2f, 0x8bc34a, 22);
    makePathTile(scene, 'tile_path');
    makeWaterTile(scene, 'tile_water');
    makeStoneTile(scene, 'tile_stone');
  }

  function generateNpcTextures(scene){
    makeNpcBase(scene, 'npc_base');
  }

  function generatePortalTextures(scene){
    makePortal(scene, 'portal_ring');
    makePlayerMarker(scene, 'player_marker');
  }

  function generateAll(scene){
    generateGroundTextures(scene);
    generateNpcTextures(scene);
    generatePortalTextures(scene);
    log('All textures generated ✓');
  }

  /* ═══════════════════════════════════════════════════════════════
     LOAD PLAYER TEXTURE FROM URL
     ═══════════════════════════════════════════════════════════════ */
  function loadPlayerTexture(scene, url, texKey, callback){
    if (!url){
      if (callback) callback(false);
      return;
    }
    if (scene.textures.exists(texKey)){
      if (callback) callback(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        if (!scene.textures.exists(texKey)){
          scene.textures.addImage(texKey, img);
        }
        log('Player texture loaded:', texKey);
        if (callback) callback(true);
      } catch(e){
        console.warn('[WF-Tileset] addImage fail:', e);
        if (callback) callback(false);
      }
    };

    img.onerror = () => {
      console.warn('[WF-Tileset] player image fail:', url);
      if (callback) callback(false);
    };

    img.src = url;
  }

  /* ═══════════════════════════════════════════════════════════════
     GET GROUND KEY (map tên thân thiện → texture key)
     ═══════════════════════════════════════════════════════════════ */
  function getGroundKey(type){
    const map = {
      grass:      'tile_grass',
      grass_dark: 'tile_grass_dark',
      path:       'tile_path',
      water:      'tile_water',
      stone:      'tile_stone',
    };
    return map[type] || 'tile_grass';
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tileset = {
    TILE_SIZE,
    NPC_SIZE,
    PORTAL_SIZE,
    MARKER_SIZE,
    generateAll,
    generateGroundTextures,
    generateNpcTextures,
    generatePortalTextures,
    loadPlayerTexture,
    getGroundKey,
  };

  log('tileset.js ✓ (procedural tiles, no CDN)');
})();