/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — WEAPON LIBRARY v1.0 (AutoSprite CC0)
   ───────────────────────────────────────────────────────────────────────
   Nguồn: AutoSprite free sprites (CC0, không cần attribution)
   URL: R2 CDN công khai, dùng trực tiếp được.
   Mỗi weapon là spritesheet 16 frame (4×4 grid, 256×256/frame).
   ───────────────────────────────────────────────────────────────────────
   Map tier → weapon:
     B   (0-14)  → Iron Flail (chùy sắt, cơ bản)
     A   (15-29) → Ember Longsword (kiếm lửa)
     S   (30-49) → Frost Battleaxe (rìu băng)
     SS  (50-69) → Thunder Hammer (búa sét)
     SSS (70-89) → Sunfire Bow (cung mặt trời)
     VIP (90-100)→ Moonlight Staff (trượng trăng)
   Extra: Shadow Daggers (dự phòng)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.weaponLibrary) return;
  window.__WF = window.__WF || {};

  const CDN = 'https://pub-63ab27389d044634a73e89c1a0c6d4a6.r2.dev/free-library/sprites';

  /* ═══════════════════════════════════════════════════════════════
     8 WEAPONS — AutoSprite CC0
     ═══════════════════════════════════════════════════════════════ */
  const WEAPONS = [
    // ─── Tier B: Iron Flail (chùy sắt) ───
    {
      id: 'iron_flail', name: 'Chùy Sắt', tier: 'B',
      emoji: '⛓️', sheet: CDN + '/iron-flail/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Tier A: Ember Longsword (kiếm lửa) ───
    {
      id: 'ember_longsword', name: 'Kiếm Lửa', tier: 'A',
      emoji: '⚔️', sheet: CDN + '/ember-longsword/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Tier S: Frost Battleaxe (rìu băng) ───
    {
      id: 'frost_battleaxe', name: 'Rìu Băng', tier: 'S',
      emoji: '🪓', sheet: CDN + '/frost-battleaxe/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Tier SS: Thunder Hammer (búa sét) ───
    {
      id: 'thunder_hammer', name: 'Búa Sét', tier: 'SS',
      emoji: '🔨', sheet: CDN + '/thunder-hammer/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Tier SSS: Sunfire Bow (cung mặt trời) ───
    {
      id: 'sunfire_bow', name: 'Cung Mặt Trời', tier: 'SSS',
      emoji: '🏹', sheet: CDN + '/sunfire-bow/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Tier VIP: Moonlight Staff (trượng trăng) ───
    {
      id: 'moonlight_staff', name: 'Trượng Trăng', tier: 'VIP',
      emoji: '🌙', sheet: CDN + '/moonlight-staff/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Extra: Shadow Daggers (dao găm) ───
    {
      id: 'shadow_daggers', name: 'Dao Găm Bóng', tier: 'B',
      emoji: '🗡️', sheet: CDN + '/shadow-daggers/loop.png',
      cols: 4, rows: 4, frames: 16,
    },
    // ─── Extra: Tidecaller Trident (đinh ba) — 5×5 grid ───
    {
      id: 'tidecaller_trident', name: 'Đinh Ba Nước', tier: 'SSS',
      emoji: '🔱', sheet: CDN + '/tidecaller-trident/loop.png',
      cols: 5, rows: 5, frames: 24,
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function getByTier(tier){
    // Ưu tiên weapon chính (không phải extra)
    const main = WEAPONS.find(w => w.tier === tier && !w._extra);
    if (main) return main;
    // Fallback: weapon extra cùng tier
    return WEAPONS.find(w => w.tier === tier) || WEAPONS[0];
  }

  function getById(id){
    return WEAPONS.find(w => w.id === id) || null;
  }

  function getAll(){
    return WEAPONS.slice();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.weaponLibrary = {
    WEAPONS,
    getByTier,
    getById,
    getAll,
  };

  console.log('[WF] weapon-library.js ✓ (8 weapons, AutoSprite CC0)');
})();