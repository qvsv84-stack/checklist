/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — CHARACTER LIBRARY (DiceBear CC0)
   - 20 nhân vật có sẵn, không cần upload
   - URL generate từ style + seed → consistent
   - API: https://www.dicebear.com (miễn phí, không giới hạn)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.characterLibrary) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     20 CHARACTERS
     ═══════════════════════════════════════════════════════════════ */
  const CHARACTERS = [
    // ─── Adventurer (fantasy RPG) — 5 ───
    { id:'adv_knight_01',  name:'Hiệp Sĩ Bạc',   class:'Knight',    style:'adventurer', seed:'knight_silver_01',  emoji:'⚔️' },
    { id:'adv_mage_01',    name:'Pháp Sư Lửa',   class:'Mage',      style:'adventurer', seed:'mage_fire_02',      emoji:'🔮' },
    { id:'adv_rogue_01',   name:'Sát Thủ Bóng',  class:'Rogue',     style:'adventurer', seed:'rogue_shadow_03',   emoji:'🗡️' },
    { id:'adv_archer_01',  name:'Cung Thủ Gió',  class:'Archer',    style:'adventurer', seed:'archer_wind_04',    emoji:'🏹' },
    { id:'adv_priest_01',  name:'Tu Sĩ Ánh Sáng',class:'Priest',    style:'adventurer', seed:'priest_light_05',   emoji:'✨' },

    // ─── Pixel Art (retro) — 5 ───
    { id:'pix_hero_01',    name:'Anh Hùng Pixel',class:'Hero',      style:'pixel-art',  seed:'hero_pixel_06',     emoji:'🛡️' },
    { id:'pix_ninja_01',   name:'Ninja Đêm',     class:'Ninja',     style:'pixel-art',  seed:'ninja_night_07',    emoji:'🌑' },
    { id:'pix_wizard_01',  name:'Phù Thủy Xưa',  class:'Wizard',    style:'pixel-art',  seed:'wizard_old_08',     emoji:'🧙' },
    { id:'pix_samurai_01', name:'Samurai Thép',  class:'Samurai',   style:'pixel-art',  seed:'samurai_steel_09',  emoji:'⚔️' },
    { id:'pix_ranger_01',  name:'Kiểm Lâm Rừng', class:'Ranger',    style:'pixel-art',  seed:'ranger_forest_10',  emoji:'🍃' },

    // ─── Lorelei (illustrated) — 4 ───
    { id:'lor_amazon_01',  name:'Nữ Chiến Binh', class:'Amazon',    style:'lorelei',    seed:'amazon_war_11',     emoji:'🗡️' },
    { id:'lor_sorc_01',    name:'Nữ Pháp Sư',    class:'Sorceress', style:'lorelei',    seed:'sorc_moon_12',      emoji:'🌙' },
    { id:'lor_valk_01',    name:'Valkyrie',      class:'Valkyrie',  style:'lorelei',    seed:'valk_sky_13',       emoji:'🪽' },
    { id:'lor_druid_01',   name:'Đạo Sĩ Rừng',   class:'Druid',     style:'lorelei',    seed:'druid_nature_14',   emoji:'🌿' },

    // ─── Micah (modern cartoon) — 3 ───
    { id:'mic_warrior_01', name:'Chiến Binh Hiện Đại', class:'Warrior', style:'micah', seed:'warrior_modern_15', emoji:'💪' },
    { id:'mic_assassin_01',name:'Sát Thủ Đô Thị',      class:'Assassin',style:'micah', seed:'assassin_city_16',  emoji:'🎯' },
    { id:'mic_monk_01',    name:'Võ Tăng',             class:'Monk',    style:'micah', seed:'monk_zen_17',       emoji:'☯️' },

    // ─── Personas (simple modern) — 3 ───
    { id:'per_alchemist_01', name:'Luyện Đan Sư', class:'Alchemist', style:'personas', seed:'alchemy_lab_18',    emoji:'⚗️' },
    { id:'per_bard_01',      name:'Nhạc Công',    class:'Bard',      style:'personas', seed:'bard_song_19',      emoji:'🎵' },
    { id:'per_witch_01',     name:'Phù Thủy Trẻ', class:'Witch',     style:'personas', seed:'witch_young_20',    emoji:'🧙‍♀️' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function getUrl(char, size){
    if (!char) return '';
    const s = size || 200;
    const seed = encodeURIComponent(char.seed || char.id);
    return `https://api.dicebear.com/9.x/${char.style}/svg?seed=${seed}&size=${s}&backgroundColor=transparent`;
  }

  function getById(id){
    if (!id) return null;
    return CHARACTERS.find(c => c.id === id) || null;
  }

  function getDefault(){
    return CHARACTERS[0];
  }

  function getAll(){
    return CHARACTERS.slice();
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.characterLibrary = {
    CHARACTERS,
    getUrl,
    getById,
    getDefault,
    getAll,
  };

  console.log('[WF] character-library.js ✓ (20 characters, DiceBear CC0)');
})();