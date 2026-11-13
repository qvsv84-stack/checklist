/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — MULTIPLAYER (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Sync vị trí user khác qua Supabase Realtime.

   Cơ chế:
     • Push vị trí mình lên Supabase mỗi 200ms (throttle)
     • Subscribe Realtime channel → nhận update vị trí user khác
     • Render "ghost" user khác (sprite + nametag + chat bubble)
     • Tự xoá ghost khi user offline > 30s
     • Fallback poll mỗi 3s nếu Realtime fail

   ⚠️  CẦN CHẠY SQL MIGRATION TRƯỚC (xem cuối file comment).
   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.multiplayer):
     .init(scene, opts)       — Khởi tạo (gọi trong scene.create)
     .update(playerX, playerY)— Gọi mỗi frame (throttle tự động)
     .destroy()               — Cleanup khi rời scene
     .getOthers()             — Debug: danh sách user khác
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU npc.js, TRƯỚC scene-town.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.multiplayer) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════ */
  const PUSH_INTERVAL_MS = 200;       // Push vị trí mỗi 200ms
  const OFFLINE_TIMEOUT_MS = 30000;   // Coi là offline nếu không update 30s
  const CLEANUP_INTERVAL_MS = 2000;   // Check offline mỗi 2s
  const POLL_INTERVAL_MS = 3000;      // Fallback poll
  const GHOST_SIZE_W = 64;
  const GHOST_SIZE_H = 88;
  const GHOST_DEPTH_BASE = 999;       // Thấp hơn player 1 để player luôn trên
  const INTERP_SPEED = 0.25;          // Lerp interpolation speed

  function log(...a){
    try { console.log('[WF-MP]', ...a); } catch(_){}
  }
  function warn(...a){
    try { console.warn('[WF-MP]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let _scene = null;
  let _channel = null;
  let _me = null;                     // { id, name, characterId, enh }
  let _currentScene = 'town';
  let _others = new Map();            // userId → ghost record
  let _lastPush = 0;
  let _lastPos = { x: 0, y: 0 };
  let _pushTimer = null;
  let _cleanupTimer = null;
  let _pollTimer = null;
  let _subscribed = false;
  let _enabled = false;

  /* ═══════════════════════════════════════════════════════════════
     GET SB + USER
     ═══════════════════════════════════════════════════════════════ */
  function getSb(){
    return window.__sb || null;
  }
  function getMe(){
    const data = window.__WF.world?.getPlayerData?.();
    if (!data) return null;
    return {
      id: data.userId,
      name: data.displayName || 'Ai đó',
      characterId: data.characterId || null,
      enh: data.enh || 0,
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════ */
  function init(scene, opts){
    if (!scene) throw new Error('multiplayer.init: scene required');
    opts = opts || {};

    destroy();

    _scene = scene;
    _currentScene = opts.sceneKey || 'town';

    _me = getMe();
    if (!_me || !_me.id){
      warn('No user — multiplayer disabled');
      return;
    }

    const sb = getSb();
    if (!sb){
      warn('No Supabase — multiplayer disabled');
      return;
    }

    _enabled = true;
    log('Init — scene:', _currentScene, '— me:', _me.id.slice(0,8));

    // 1. Push vị trí lần đầu
    pushPosition(scene.scale.width / 2, scene.scale.height / 2);

    // 2. Subscribe realtime
    subscribeChannel();

    // 3. Fallback polling (nếu realtime fail)
    startPolling();

    // 4. Cleanup timer — xoá ghost offline
    startCleanup();

    // 5. Auto pause khi tab ẩn
    document.addEventListener('visibilitychange', _onVisibilityChange);
  }

  /* ═══════════════════════════════════════════════════════════════
     PUSH POSITION
     ═══════════════════════════════════════════════════════════════ */
  async function pushPosition(x, y){
    if (!_enabled || !_me) return;
    const sb = getSb();
    if (!sb || !sb.rpc) return;

    try {
      const res = await sb.rpc('rpc_world_update_pos', {
        p_scene: _currentScene,
        p_x: Math.round(x),
        p_y: Math.round(y),
        p_name: _me.name,
        p_character_id: _me.characterId,
        p_enh: _me.enh,
      });
      if (res.error){
        // Có thể do table chưa tồn tại
        if (/does not exist|not found|schema cache/i.test(String(res.error.message||''))){
          warn('Table rpc_world_update_pos chưa cài → tắt multiplayer');
          _enabled = false;
        }
      }
    } catch(e){
      // Bỏ qua — không spam log
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     UPDATE (gọi mỗi frame từ scene.update)
     ═══════════════════════════════════════════════════════════════ */
  function update(playerX, playerY){
    if (!_enabled) return;

    const now = Date.now();

    // Throttle push (200ms) — chỉ push nếu di chuyển > 3px
    const dx = Math.abs(playerX - _lastPos.x);
    const dy = Math.abs(playerY - _lastPos.y);
    if ((now - _lastPush > PUSH_INTERVAL_MS) && (dx > 3 || dy > 3)){
      _lastPush = now;
      _lastPos = { x: playerX, y: playerY };
      pushPosition(playerX, playerY);
    }

    // Interpolate ghosts (mượt hoá chuyển động)
    for (const ghost of _others.values()){
      if (!ghost.container) continue;

      // Target position (từ server)
      const tx = ghost.targetX;
      const ty = ghost.targetY;

      // Lerp hiện tại → target
      ghost.container.x += (tx - ghost.container.x) * INTERP_SPEED;
      ghost.container.y += (ty - ghost.container.y) * INTERP_SPEED;

      // Depth sort
      ghost.container.setDepth(GHOST_DEPTH_BASE + ghost.container.y);

      // Idle bob
      const t = now * 0.003;
      if (ghost.sprite){
        ghost.sprite.y = Math.sin(t + ghost.phase) * 1.5;
      }

      // Fade out nếu sắp offline
      const age = now - ghost.lastSeen;
      if (age > OFFLINE_TIMEOUT_MS * 0.7){
        const alpha = Math.max(0, 1 - (age - OFFLINE_TIMEOUT_MS * 0.7) / (OFFLINE_TIMEOUT_MS * 0.3));
        ghost.container.setAlpha(alpha);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     REALTIME SUBSCRIBE
     ═══════════════════════════════════════════════════════════════ */
  function subscribeChannel(){
    const sb = getSb();
    if (!sb || !sb.channel) return;

    try {
      _channel = sb.channel('wf-world-' + _currentScene)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'srank_world_positions',
          filter: 'scene=eq.' + _currentScene,
        }, payload => {
          const row = payload.new || payload.old;
          if (row) handlePositionRow(row);
        })
        .subscribe(status => {
          log('Realtime:', status);
          if (status === 'SUBSCRIBED'){
            _subscribed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
            _subscribed = false;
            warn('Realtime fail, dùng polling');
          }
        });
    } catch(e){
      warn('Subscribe error:', e);
    }
  }

  function handlePositionRow(row){
    if (!row || !row.user_id) return;
    if (row.user_id === _me.id) return; // Bỏ qua chính mình
    if (row.scene !== _currentScene) return;

    const userId = row.user_id;
    const now = Date.now();

    let ghost = _others.get(userId);

    if (!ghost){
      // Tạo ghost mới
      ghost = createGhost(row);
      if (!ghost) return;
      _others.set(userId, ghost);
      log('Ghost added:', row.display_name || userId.slice(0,8));
    }

    // Update target
    ghost.targetX = Number(row.x) || 0;
    ghost.targetY = Number(row.y) || 0;
    ghost.lastSeen = now;
    ghost.container.setAlpha(1);

    // Update nametag nếu đổi
    if (row.display_name && ghost.nametag && ghost.nametag.text !== row.display_name){
      ghost.nametag.setText(String(row.display_name));
    }
    // Update enh nếu đổi
    if (typeof row.enh === 'number' && ghost.enhBadge){
      ghost.enhBadge.setText(row.enh > 0 ? `+${row.enh}` : '');
    }
    // Update character nếu đổi
    if (row.character_id && row.character_id !== ghost.charId){
      ghost.charId = row.character_id;
      loadGhostSprite(ghost, row.character_id);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CREATE GHOST
     ═══════════════════════════════════════════════════════════════ */
  function createGhost(row){
    if (!_scene) return null;

    const x = Number(row.x) || 0;
    const y = Number(row.y) || 0;
    const name = row.display_name || 'Ai đó';
    const enh = Number(row.enh) || 0;
    const charId = row.character_id || null;

    const container = _scene.add.container(x, y);
    container.setDepth(GHOST_DEPTH_BASE + y);

    // Shadow
    const shadow = _scene.add.ellipse(0, GHOST_SIZE_H / 2 - 4, 36, 12, 0x000000, 0.3);
    container.add(shadow);

    // Sprite placeholder (circle xanh để phân biệt với mình)
    const sprite = _scene.add.circle(0, 0, 22, 0x93c5fd, 1);
    sprite.setStrokeStyle(3, 0x3b82f6, 1);
    container.add(sprite);

    // Nametag
    const nametag = _scene.add.text(0, GHOST_SIZE_H / 2 + 6, name, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      color: '#93c5fd',
      stroke: '#000000',
      strokeThickness: 3,
    });
    nametag.setOrigin(0.5, 0);
    nametag.setDepth(1);
    container.add(nametag);

    // Enh badge
    let enhBadge = null;
    if (enh > 0){
      enhBadge = _scene.add.text(0, GHOST_SIZE_H / 2 + 20, `+${enh}`, {
        fontFamily: 'ui-rounded, system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: '900',
        color: '#f59e0b',
        stroke: '#000000',
        strokeThickness: 2,
      });
      enhBadge.setOrigin(0.5, 0);
      enhBadge.setDepth(1);
      container.add(enhBadge);
    }

    const ghost = {
      userId: row.user_id,
      container, sprite, shadow, nametag, enhBadge,
      targetX: x,
      targetY: y,
      lastSeen: Date.now(),
      phase: Math.random() * Math.PI * 2,
      charId,
    };

    // Load sprite thật nếu có character
    if (charId) loadGhostSprite(ghost, charId);

    return ghost;
  }

  /* ═══════════════════════════════════════════════════════════════
     LOAD GHOST SPRITE
     ═══════════════════════════════════════════════════════════════ */
  async function loadGhostSprite(ghost, charId){
    if (!_scene || !ghost || !ghost.container) return;

    const LIB = window.__WF.characterLibrary;
    const TS = window.__WF.tileset;
    if (!LIB || !TS) return;

    const char = LIB.getById(charId) || LIB.getDefault();
    if (!char) return;

    let url = '';
    try {
      if (char.job != null){
        url = LIB.getUrl(char);
      } else {
        url = await LIB.getUrlAsync(char);
      }
    } catch(e){
      return;
    }

    if (!url) return;

    const texKey = 'ghost_' + char.id;
    TS.loadPlayerTexture(_scene, url, texKey, (ok) => {
      if (!ok || !ghost.container) return;

      const oldSprite = ghost.sprite;
      const newSprite = _scene.add.image(0, 0, texKey);
      newSprite.setDisplaySize(GHOST_SIZE_W, GHOST_SIZE_H);
      newSprite.setOrigin(0.5, 0.5);

      if (oldSprite){
        const idx = ghost.container.getIndex(oldSprite);
        ghost.container.addAt(newSprite, idx);
        oldSprite.destroy();
      } else {
        ghost.container.add(newSprite);
      }

      ghost.sprite = newSprite;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CHAT BUBBLE (gọi từ realtime.js hoặc tab-chat.js khi có tin mới)
     ═══════════════════════════════════════════════════════════════ */
  function showChatBubble(userId, message, duration){
    const ghost = _others.get(userId);
    if (!ghost || !_scene || !ghost.container) return;

    duration = duration || 3000;

    // Xoá bubble cũ
    if (ghost.bubble){
      try { ghost.bubble.destroy(); } catch(_){}
      ghost.bubble = null;
    }

    const text = String(message || '').slice(0, 60);

    // Background (khung trắng bo tròn)
    const bg = _scene.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(2, 0x3b82f6, 1);

    // Đo text
    const tempText = _scene.add.text(0, 0, text, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '800',
      color: '#1e40af',
    });
    const tw = tempText.width + 16;
    const th = tempText.height + 10;
    tempText.destroy();

    // Vẽ rounded rect
    bg.fillRoundedRect(-tw/2, -th/2, tw, th, 8);
    bg.strokeRoundedRect(-tw/2, -th/2, tw, th, 8);
    bg.y = -GHOST_SIZE_H / 2 - 12;

    const bubbleText = _scene.add.text(0, -GHOST_SIZE_H / 2 - 12, text, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '800',
      color: '#1e40af',
    });
    bubbleText.setOrigin(0.5, 0.5);

    const bubbleGroup = _scene.add.container(0, 0, [bg, bubbleText]);
    bubbleGroup.setDepth(10);
    ghost.container.add(bubbleGroup);
    ghost.bubble = bubbleGroup;

    // Tự xoá sau duration
    _scene.tweens.add({
      targets: bubbleGroup,
      alpha: { from: 1, to: 0 },
      y: -20,
      duration: 400,
      delay: duration,
      onComplete: () => {
        try { bubbleGroup.destroy(); } catch(_){}
        if (ghost.bubble === bubbleGroup) ghost.bubble = null;
      },
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CLEANUP OFFLINE
     ═══════════════════════════════════════════════════════════════ */
  function startCleanup(){
    stopCleanup();
    _cleanupTimer = setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      for (const [userId, ghost] of _others){
        if (now - ghost.lastSeen > OFFLINE_TIMEOUT_MS){
          destroyGhost(userId, ghost);
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }

  function stopCleanup(){
    if (_cleanupTimer){
      clearInterval(_cleanupTimer);
      _cleanupTimer = null;
    }
  }

  function destroyGhost(userId, ghost){
    if (!ghost) return;
    try {
      if (ghost.bubble) ghost.bubble.destroy();
      if (ghost.container) ghost.container.destroy();
    } catch(_){}
    _others.delete(userId);
    log('Ghost removed (offline):', userId.slice(0,8));
  }

  /* ═══════════════════════════════════════════════════════════════
     FALLBACK POLLING
     ═══════════════════════════════════════════════════════════════ */
  function startPolling(){
    stopPolling();
    _pollTimer = setInterval(async () => {
      if (document.hidden) return;
      if (_subscribed) return; // Realtime OK, không cần poll

      const sb = getSb();
      if (!sb || !sb.rpc) return;

      try {
        const res = await sb.rpc('rpc_world_get_positions', {
          p_scene: _currentScene,
        });
        if (res.error) return;
        const d = res.data || {};
        if (d.ok !== true) return;

        const rows = Array.isArray(d.data) ? d.data : [];
        const seen = new Set();

        rows.forEach(row => {
          if (row.user_id === _me.id) return;
          seen.add(row.user_id);
          handlePositionRow(row);
        });

        // Xoá ghost không còn trong response
        for (const [userId] of _others){
          if (!seen.has(userId)){
            // Nhưng vẫn phải check lastSeen để tránh xoá nhầm
            const ghost = _others.get(userId);
            if (ghost && Date.now() - ghost.lastSeen > OFFLINE_TIMEOUT_MS){
              destroyGhost(userId, ghost);
            }
          }
        }
      } catch(_){}
    }, POLL_INTERVAL_MS);
  }

  function stopPolling(){
    if (_pollTimer){
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     VISIBILITY HANDLER
     ═══════════════════════════════════════════════════════════════ */
  function _onVisibilityChange(){
    if (!_enabled) return;
    if (document.hidden){
      // Tab ẩn → ngừng push, giữ subscribe
      return;
    }
    // Tab hiện lại → push lại vị trí
    if (_lastPos){
      pushPosition(_lastPos.x, _lastPos.y);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     DESTROY
     ═══════════════════════════════════════════════════════════════ */
  function destroy(){
    _enabled = false;
    _subscribed = false;

    stopCleanup();
    stopPolling();

    if (_channel){
      try { _channel.unsubscribe(); } catch(_){}
      _channel = null;
    }

    // Xoá tất cả ghost
    for (const [userId, ghost] of _others){
      destroyGhost(userId, ghost);
    }
    _others.clear();

    document.removeEventListener('visibilitychange', _onVisibilityChange);

    // Clear vị trí mình trên server (optional)
    if (_me && _me.id){
      const sb = getSb();
      if (sb && sb.rpc){
        try {
          sb.rpc('rpc_world_leave').catch(()=>{});
        } catch(_){}
      }
    }

    _scene = null;
    _me = null;
    _lastPos = { x: 0, y: 0 };
    _lastPush = 0;
  }

  /* ═══════════════════════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════════════════════ */
  function getOthers(){
    const out = [];
    for (const [userId, ghost] of _others){
      out.push({
        userId,
        name: ghost.nametag?.text || '',
        x: ghost.container?.x || 0,
        y: ghost.container?.y || 0,
        lastSeen: ghost.lastSeen,
      });
    }
    return out;
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.multiplayer = {
    init,
    update,
    destroy,
    getOthers,
    showChatBubble,
    isEnabled: () => _enabled,
  };

  log('multiplayer.js ✓');
})();

/* ═══════════════════════════════════════════════════════════════════════
   ⚠️  SQL MIGRATION — CHẠY 1 LẦN TRONG SUPABASE SQL EDITOR
   ═══════════════════════════════════════════════════════════════════════

create table if not exists public.srank_world_positions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scene text not null default 'town',
  x numeric not null default 0,
  y numeric not null default 0,
  display_name text,
  character_id text,
  enh int default 0,
  updated_at timestamptz not null default now()
);

create index if not exists srank_wp_scene_idx
  on public.srank_world_positions (scene, updated_at desc);

alter table public.srank_world_positions enable row level security;

drop policy if exists "wp_read_all" on public.srank_world_positions;
create policy "wp_read_all" on public.srank_world_positions
  for select to authenticated using (true);

drop policy if exists "wp_upsert_own" on public.srank_world_positions;
create policy "wp_upsert_own" on public.srank_world_positions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "wp_update_own" on public.srank_world_positions;
create policy "wp_update_own" on public.srank_world_positions
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "wp_delete_own" on public.srank_world_positions;
create policy "wp_delete_own" on public.srank_world_positions
  for delete to authenticated using (auth.uid() = user_id);

-- RPC: update vị trí
create or replace function public.rpc_world_update_pos(
  p_scene text,
  p_x numeric,
  p_y numeric,
  p_name text default null,
  p_character_id text default null,
  p_enh int default 0
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Chưa login'); end if;

  insert into public.srank_world_positions
    (user_id, scene, x, y, display_name, character_id, enh, updated_at)
  values
    (v_uid, p_scene, p_x, p_y, p_name, p_character_id, coalesce(p_enh, 0), now())
  on conflict (user_id) do update set
    scene = excluded.scene,
    x = excluded.x,
    y = excluded.y,
    display_name = coalesce(excluded.display_name, srank_world_positions.display_name),
    character_id = coalesce(excluded.character_id, srank_world_positions.character_id),
    enh = excluded.enh,
    updated_at = now();

  return jsonb_build_object('ok', true);
end $$;

-- RPC: get positions (fallback)
create or replace function public.rpc_world_get_positions(p_scene text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_out jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Chưa login'); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', user_id,
    'scene', scene,
    'x', x,
    'y', y,
    'display_name', display_name,
    'character_id', character_id,
    'enh', enh,
    'updated_at', updated_at
  )), '[]'::jsonb) into v_out
  from public.srank_world_positions
  where scene = p_scene
    and user_id <> v_uid
    and updated_at > now() - interval '35 seconds';

  return jsonb_build_object('ok', true, 'data', v_out);
end $$;

-- RPC: rời world
create or replace function public.rpc_world_leave()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  delete from public.srank_world_positions where user_id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.rpc_world_update_pos(text, numeric, numeric, text, text, int) to authenticated;
grant execute on function public.rpc_world_get_positions(text) to authenticated;
grant execute on function public.rpc_world_leave() to authenticated;

-- Bật realtime cho table
do $$
begin
  begin alter publication supabase_realtime add table public.srank_world_positions;
    exception when others then null;
  end;
end $$;

-- Auto cleanup rows cũ (> 1 phút) — chạy định kỳ bằng pg_cron (optional)
-- Nếu không có pg_cron: client tự xoá khi rời, hoặc bỏ qua cũng được
-- delete from public.srank_world_positions where updated_at < now() - interval '1 minute';

do $$ begin
  raise notice '═══════════════════════════════════════════';
  raise notice '  ✅ WORLD MULTIPLAYER READY';
  raise notice '     Table: srank_world_positions';
  raise notice '     RPCs: 3 (update_pos, get_positions, leave)';
  raise notice '     Realtime: ON';
  raise notice '═══════════════════════════════════════════';
end $$;
*/