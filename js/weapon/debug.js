/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — DEBUG TOOL
   Chẩn đoán: module load, DOM, state, RPC, click handler
   - Tự chạy khi load → in báo cáo vào console
   - API: __WF_DEBUG.report(), __WF_DEBUG.test(), __WF_DEBUG.watch()
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF_DEBUG) return;
  window.__WF_DEBUG = {};

  const MODULES = [
    'config','utils','css','state','api','modals',
    'tabForge','tabShop','tabQuest','tabPet','tabBoss',
    'tabArena','tabChat','battle','realtime','index',
  ];

  const MODULE_FILE = {
    config:'js/weapon/config.js',
    utils:'js/weapon/utils.js',
    css:'js/weapon/css.js',
    state:'js/weapon/state.js',
    api:'js/weapon/api.js',
    modals:'js/weapon/modals.js',
    tabForge:'js/weapon/tab-forge.js',
    tabShop:'js/weapon/tab-shop.js',
    tabQuest:'js/weapon/tab-quest.js',
    tabPet:'js/weapon/tab-pet.js',
    tabBoss:'js/weapon/tab-boss.js',
    tabArena:'js/weapon/tab-arena.js',
    tabChat:'js/weapon/tab-chat.js',
    battle:'js/weapon/battle.js',
    realtime:'js/weapon/realtime.js',
    index:'js/weapon/index.js',
  };

  /* ═══════════════════════════════════════════════════════════════
     REPORT
     ═══════════════════════════════════════════════════════════════ */
  function report(){
    const wf = window.__WF || {};
    const results = { ok:[], missing:[], broken:[] };

    console.group('%c⚔️ WEAPON FORGE DEBUG REPORT',
      'background:#f59e0b;color:#fff;padding:4px 10px;border-radius:4px;font-weight:900;font-size:14px');

    // ── 1. window.__WF ──
    console.group('1️⃣  window.__WF namespace');
    if (!wf || Object.keys(wf).length === 0){
      console.error('❌ window.__WF KHÔNG TỒN TẠI — không có file weapon nào load được!');
      results.missing.push('__WF');
      console.groupEnd();
      console.groupEnd();
      return results;
    }
    console.log('✅ window.__WF tồn tại, keys:', Object.keys(wf));
    console.groupEnd();

    // ── 2. Modules ──
    console.group('2️⃣  Modules (16 expected)');
    MODULES.forEach(m => {
      const mod = wf[m];
      const file = MODULE_FILE[m];
      if (mod === undefined || mod === null){
        console.error(`❌ ${m.padEnd(10)} MISSING — ${file} không load được`);
        results.missing.push({ module: m, file });
      } else if (typeof mod !== 'object'){
        console.error(`❌ ${m.padEnd(10)} BROKEN — typeof = ${typeof mod}`);
        results.broken.push(m);
      } else {
        const keys = Object.keys(mod);
        if (keys.length === 0){
          console.warn(`⚠️  ${m.padEnd(10)} EMPTY — {} (file load nhưng không export gì)`);
          results.broken.push(m);
        } else {
          console.log(`✅ ${m.padEnd(10)} OK — keys: [${keys.slice(0,5).join(', ')}${keys.length>5?',…':''}]`);
          results.ok.push(m);
        }
      }
    });
    console.groupEnd();

    // ── 3. window.WeaponForge ──
    console.group('3️⃣  window.WeaponForge (public API)');
    if (window.WeaponForge){
      console.log('✅ WeaponForge tồn tại, keys:', Object.keys(window.WeaponForge));
    } else {
      console.error('❌ window.WeaponForge KHÔNG TỒN TẠI — index.js chưa chạy xong');
      results.missing.push('WeaponForge');
    }
    console.groupEnd();

    // ── 4. DOM ──
    console.group('4️⃣  DOM elements');
    const domChecks = {
      'weaponBtn (nút trigger)': 'weaponBtn',
      'weaponPage (page root)': 'weaponPage',
      'wfBody': 'wfBody',
      'wfStyles (CSS)': 'wfStyles',
    };
    Object.entries(domChecks).forEach(([label, id]) => {
      const el = document.getElementById(id);
      if (!el){
        console.warn(`⚠️  ${label} = null (chưa tạo — có thể bình thường nếu chưa mở page)`);
      } else {
        console.log(`✅ ${label} ✓`, el);
        if (id === 'weaponBtn'){
          console.log('   └─ __wfBound:', el.__wfBound === true ? '✅ true' : '❌ false/undefined');
        }
      }
    });
    console.groupEnd();

    // ── 5. Load order check ──
    console.group('5️⃣  Load order (index.js phải là CUỐI)');
    const idx = wf.index;
    if (!idx){
      console.error('❌ window.__WF.index KHÔNG TỒN TẠI');
      console.error('   → File js/weapon/index.js CHƯA chạy xong HOẶC là bản monolithic v3.1');
      console.error('   → Kiểm tra: file js/weapon/index.js phải bắt đầu bằng "MODULE #16: INDEX"');
    } else {
      console.log('✅ window.__WF.index tồn tại, keys:', Object.keys(idx));
      if (typeof idx.render !== 'function'){
        console.error('❌ idx.render KHÔNG phải function — file không đúng');
      }
    }
    console.groupEnd();

    // ── 6. State ──
    console.group('6️⃣  State');
    if (wf.state){
      console.log('S.user:', wf.state.S?.user);
      console.log('S.state:', wf.state.S?.state);
      console.log('S.activeTab:', wf.state.S?.activeTab);
      if (!wf.state.S?.user){
        console.warn('⚠️  S.user = null → user CHƯA đăng nhập (login wall sẽ hiện)');
      }
    }
    console.groupEnd();

    // ── 7. Supabase ──
    console.group('7️⃣  Supabase');
    console.log('window.__sb:', window.__sb ? '✅' : '❌ null');
    if (window.__sb){
      console.log('__sb.rpc:', typeof window.__sb.rpc);
      console.log('__sb.channel:', typeof window.__sb.channel);
    }
    console.groupEnd();

    // ── Summary ──
    console.group('%c📊 SUMMARY', 'font-weight:900');
    console.log(`✅ OK: ${results.ok.length}/${MODULES.length}`);
    console.log(`❌ Missing: ${results.missing.length}`, results.missing);
    console.log(`⚠️  Broken: ${results.broken.length}`, results.broken);

    if (results.missing.length === 0 && results.broken.length === 0){
      console.log('%c🎉 TẤT CẢ MODULES OK! Vấn đề có thể nằm ở RPC backend hoặc logic khác.',
        'color:#22c55e;font-weight:900;font-size:13px');
    } else {
      console.log('%c💡 HƯỚNG DẪN FIX:',
        'color:#ef4444;font-weight:900;font-size:13px');
      results.missing.forEach(m => {
        if (typeof m === 'object'){
          console.log(`   • Copy file ${m.file} vào đúng vị trí`);
        }
      });
    }
    console.groupEnd();

    console.groupEnd();
    return results;
  }

  /* ═══════════════════════════════════════════════════════════════
     TEST OPEN — thử mở page và báo lỗi chi tiết
     ═══════════════════════════════════════════════════════════════ */
  async function test(){
    console.group('%c🧪 TEST OPEN PAGE', 'background:#3b82f6;color:#fff;padding:4px 10px;border-radius:4px;font-weight:900');

    // Check prerequisites
    if (!window.__WF?.index){
      console.error('❌ window.__WF.index không tồn tại — không thể test');
      console.groupEnd();
      return;
    }

    console.log('Step 1: Gọi WeaponForge.open()...');
    try {
      await window.WeaponForge.open();
      console.log('✅ open() không throw');
    } catch(e){
      console.error('❌ open() THROW:', e);
      console.error('Stack:', e.stack);
      console.groupEnd();
      return;
    }

    // Đợi 500ms cho async
    await new Promise(r => setTimeout(r, 500));

    console.log('Step 2: Kiểm tra DOM sau open...');
    const page = document.getElementById('weaponPage');
    const body = document.getElementById('wfBody');

    if (!page){
      console.error('❌ #weaponPage không được tạo → ensurePage() fail');
    } else {
      console.log('✅ #weaponPage tồn tại');
      console.log('   ├─ classList:', page.className);
      console.log('   ├─ has .show:', page.classList.contains('show'));
      console.log('   └─ display:', getComputedStyle(page).display);
    }

    if (!body){
      console.error('❌ #wfBody không tồn tại');
    } else {
      console.log('✅ #wfBody tồn tại');
      console.log('   ├─ children count:', body.children.length);
      console.log('   └─ innerHTML preview:', body.innerHTML.slice(0, 200));
    }

    // Check state
    const S = window.__WF?.state?.S;
    if (S){
      console.log('Step 3: State check');
      console.log('   ├─ S.user:', S.user ? `✅ ${S.user.username || S.user.id}` : '❌ null');
      console.log('   ├─ S.state:', S.state ? '✅ có data' : '❌ null');
      console.log('   └─ S.activeTab:', S.activeTab);
    }

    console.log('Step 4: Tab buttons');
    const tabs = body?.querySelectorAll('.wf-tab');
    if (tabs){
      console.log(`   └─ ${tabs.length} tab buttons`);
      tabs.forEach(t => {
        console.log(`      • ${t.dataset.tab}: ${t.classList.contains('active') ? 'ACTIVE' : 'inactive'}`);
      });
    }

    console.log('%c✅ TEST HOÀN TẤT', 'color:#22c55e;font-weight:900');
    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════════════════════
     WATCH — log mọi khi render
     ═══════════════════════════════════════════════════════════════ */
  function watch(){
    if (!window.__WF?.index){
      console.error('Không thể watch — index chưa load');
      return;
    }
    const orig = window.__WF.index.render;
    if (orig.__watched) return;
    window.__WF.index.render = function(){
      console.log('[WF-WATCH] render() called, activeTab =', window.__WF.state.S.activeTab);
      try {
        return orig.apply(this, arguments);
      } catch(e){
        console.error('[WF-WATCH] render() THROW:', e);
        throw e;
      }
    };
    window.__WF.index.render.__watched = true;
    console.log('✅ Đã watch render() — mỗi lần render sẽ log');
  }

  /* ═══════════════════════════════════════════════════════════════
     RPC TEST — test từng RPC endpoint
     ═══════════════════════════════════════════════════════════════ */
  async function testRPC(){
    console.group('%c🔌 TEST RPCs', 'background:#8b5cf6;color:#fff;padding:4px 10px;border-radius:4px;font-weight:900');
    const sb = window.__sb;
    if (!sb){
      console.error('❌ window.__sb null');
      console.groupEnd();
      return;
    }

    const tests = [
      ['rpc_weapon_get_state', {}],
      ['rpc_weapon_arena_data', {}],
      ['rpc_weapon_get_chat', { p_limit: 5 }],
      ['rpc_weapon_feed', { p_limit: 5 }],
      ['rpc_wq_get_quests', {}],
      ['rpc_ws_get_season', {}],
      ['rpc_wp_get_pets', {}],
      ['rpc_wb_get_current_boss', {}],
    ];

    for (const [name, params] of tests){
      try {
        const t0 = performance.now();
        const res = await sb.rpc(name, params);
        const dt = Math.round(performance.now() - t0);
        if (res.error){
          console.error(`❌ ${name} (${dt}ms):`, res.error.message || res.error);
          if (/does not exist|not found/i.test(String(res.error.message || ''))){
            console.warn(`   └─ RPC CHƯA TẠO trên Supabase!`);
          }
        } else {
          const ok = res.data?.ok !== false;
          console.log(`${ok ? '✅' : '⚠️ '} ${name} (${dt}ms)`, res.data);
        }
      } catch(e){
        console.error(`❌ ${name} THROW:`, e.message);
      }
    }
    console.groupEnd();
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO RUN on load
     ═══════════════════════════════════════════════════════════════ */
  function autoRun(){
    // Đợi các module khác load xong
    setTimeout(() => {
      console.log('%c⏱️ AUTO DEBUG REPORT (sau 2s)', 'color:#f59e0b;font-weight:900');
      report();

      // Nếu thiếu module → in hướng dẫn
      const missing = MODULES.filter(m => !window.__WF?.[m]);
      if (missing.length > 0){
        console.log('%c💡 MODULES THIẾU — kiểm tra Network tab (F12) xem file 404:',
          'color:#ef4444;font-weight:900;font-size:13px');
        missing.forEach(m => console.log(`   • ${MODULE_FILE[m]}`));
      }
    }, 2000);
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════ */
  window.__WF_DEBUG = {
    report,
    test,
    watch,
    testRPC,
    modules: MODULES,
    files: MODULE_FILE,
  };

  // Auto run
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoRun, { once: true });
  } else {
    autoRun();
  }

  console.log('%c⚔️ WF_DEBUG loaded — gõ __WF_DEBUG.report() để chạy lại',
    'color:#22c55e;font-weight:900;font-size:12px');
})();