/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — CHARACTER LIBRARY v2.0 (FULL BODY)
   ───────────────────────────────────────────────────────────────────────
   Nguồn:
   - Ragnarok Online (ragassets) — PNG trực tiếp, full body pixel art
     https://assets.latam-tools.com.br/image?job=X&action=0
   - LPC Character MCP — full body spritesheet, 6 body types
     https://lpc-character-mcp.gamezxz.workers.dev/api/generate
   ───────────────────────────────────────────────────────────────────────
   Tất cả miễn phí, không cần API key.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.characterLibrary) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     RAGNAROK CLASS IDs (job param)
     Tham khảo: 0=Novice, 1=Swordman, 2=Mage, 3=Archer, 4=Acolyte,
                5=Merchant, 6=Thief, 7=Knight, 8=Priest, 9=Wizard,
                10=Blacksmith, 11=Hunter, 12=Assassin, 13=Crusader,
                14=Monk, 15=Sage, 16=Rogue, 17=Alchemist, 18=Bard, 19=Dancer
     ═══════════════════════════════════════════════════════════════ */
  const RAGNAROK_CHARS = [
    { id:'ro_swordman',  name:'Kiếm Sĩ',       class:'Swordman',  job:1,  gender:'male',   emoji:'⚔️' },
    { id:'ro_mage',      name:'Pháp Sư',        class:'Mage',      job:2,  gender:'male',   emoji:'🔮' },
    { id:'ro_archer',    name:'Cung Thủ',       class:'Archer',    job:3,  gender:'female', emoji:'🏹' },
    { id:'ro_acolyte',   name:'Tu Sĩ',          class:'Acolyte',   job:4,  gender:'female', emoji:'✨' },
    { id:'ro_merchant',  name:'Thương Nhân',    class:'Merchant',  job:5,  gender:'male',   emoji:'💰' },
    { id:'ro_thief',     name:'Đạo Tặc',        class:'Thief',     job:6,  gender:'male',   emoji:'🗡️' },
    { id:'ro_knight',    name:'Kỵ Sĩ',          class:'Knight',    job:7,  gender:'male',   emoji:'🛡️' },
    { id:'ro_priest',    name:'Linh Mục',       class:'Priest',    job:8,  gender:'female', emoji:'📿' },
    { id:'ro_wizard',    name:'Phù Thủy',       class:'Wizard',    job:9,  gender:'male',   emoji:'🧙' },
    { id:'ro_blacksmith',name:'Thợ Rèn',        class:'Blacksmith',job:10, gender:'male',   emoji:'🔨' },
    { id:'ro_hunter',    name:'Thợ Săn',        class:'Hunter',    job:11, gender:'female', emoji:'🎯' },
    { id:'ro_assassin',  name:'Sát Thủ',        class:'Assassin',  job:12, gender:'male',   emoji:'🌑' },
    { id:'ro_crusader',  name:'Thập Tự Quân',   class:'Crusader',  job:13, gender:'male',   emoji:'✝️' },
    { id:'ro_monk',      name:'Võ Tăng',        class:'Monk',      job:14, gender:'male',   emoji:'☯️' },
    { id:'ro_sage',      name:'Hiền Giả',       class:'Sage',      job:15, gender:'male',   emoji:'📚' },
    { id:'ro_rogue',     name:'Lưu Manh',       class:'Rogue',     job:16, gender:'female', emoji:'🎭' },
    { id:'ro_alchemist', name:'Luyện Đan Sư',   class:'Alchemist', job:17, gender:'female', emoji:'⚗️' },
    { id:'ro_bard',      name:'Nhạc Công',      class:'Bard',      job:18, gender:'male',   emoji:'🎵' },
    { id:'ro_dancer',    name:'Vũ Công',        class:'Dancer',    job:19, gender:'female', emoji:'💃' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     LPC CHARACTERS (dùng API generate)
     API trả JSON, ta sẽ fetch và lấy URL ảnh
     ═══════════════════════════════════════════════════════════════ */
  const LPC_CHARS = [
    { id:'lpc_knight',   name:'Kỵ Sĩ LPC',   class:'Knight',   seed: 101, bodyType:'male',    emoji:'⚔️' },
    { id:'lpc_mage',     name:'Pháp Sư LPC', class:'Mage',     seed: 202, bodyType:'female',  emoji:'🔮' },
    { id:'lpc_archer',   name:'Cung Thủ LPC',class:'Archer',   seed: 303, bodyType:'male',    emoji:'🏹' },
    { id:'lpc_rogue',    name:'Sát Thủ LPC', class:'Rogue',    seed: 404, bodyType:'female',  emoji:'🗡️' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     URL BUILDERS
     ═══════════════════════════════════════════════════════════════ */
  function ragnarokUrl(char, size){
    // Size không ảnh hưởng ragassets, nhưng giữ param để tương thích
    const g = char.gender || 'male';
    return `https://assets.latam-tools.com.br/image?job=${char.job}&gender=${g}&action=0`;
  }

  async function lpcUrl(char){
    // Gọi API generate → trả JSON { files: [...] }
    // Cache URL để không gọi lại nhiều lần
    if (char._cachedUrl) return char._cachedUrl;
    try {
      const res = await fetch(`https://lpc-character-mcp.gamezxz.workers.dev/api/generate?seed=${char.seed}&bodyType=${char.bodyType || 'male'}`);
      if (!res.ok) throw new Error('LPC API failed');
      const json = await res.json();
      // Format có thể là { files: ['url1', 'url2', ...] }
      const url = json.files?.[0] || json.url || '';
      if (url) char._cachedUrl = url;
      return url;
    } catch(e) {
      console.warn('[WF] LPC fetch failed:', e);
      return '';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  function getById(id){
    return RAGNAROK_CHARS.find(c => c.id === id)
      || LPC_CHARS.find(c => c.id === id)
      || null;
  }

  function getDefault(){
    return RAGNAROK_CHARS[0]; // Swordman
  }

  function getAll(){
    return [...RAGNAROK_CHARS, ...LPC_CHARS];
  }

  /* ─── URL sync cho Ragnarok (dùng ngay) ─── */
  function getUrl(char){
    if (!char) return '';
    if (char.job != null) return ragnarokUrl(char);
    // LPC cần async, trả về placeholder trước
    return char._cachedUrl || '';
  }

  /* ─── URL async cho LPC (gọi khi cần) ─── */
  async function getUrlAsync(char){
    if (!char) return '';
    if (char.job != null) return ragnarokUrl(char);
    return await lpcUrl(char);
  }

  window.__WF.characterLibrary = {
    RAGNAROK_CHARS,
    LPC_CHARS,
    CHARACTERS: [...RAGNAROK_CHARS, ...LPC_CHARS],
    getById,
    getDefault,
    getAll,
    getUrl,
    getUrlAsync,
  };

  console.log('[WF] character-library.js v2.0 ✓ (18 Ragnarok + 4 LPC = 22 full-body chars)');
})();