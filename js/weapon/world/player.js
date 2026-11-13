/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE WORLD — PLAYER (v1.0)
   ───────────────────────────────────────────────────────────────────────
   Player sprite + movement + camera follow + depth sort.

   Tính năng:
     • Load sprite từ character-library.js (Ragnarok/LPC/DiceBear)
     • Di chuyển 8 hướng bằng joystick
     • Walk bob animation (lên xuống nhẹ nhân vật)
     • Camera follow mượt
     • Depth sort theo Y (nhân vật đứng sau cây, đi xuống che cây)
     • Physics body (AABB) để collision với walls/NPC
     • Facing direction lưu (up/down/left/right) để sau này dùng
     • Nametag + enh badge dưới chân
     • Hỗ trợ swap character runtime (user đổi nhân vật → reload sprite)

   ───────────────────────────────────────────────────────────────────────
   Public API (window.__WF.player):
     .create(scene, opts)          — Tạo player (async vì load texture)
     .update(delta)                — Gọi trong scene.update()
     .getSprite()                  — Trả về sprite
     .getContainer()               — Trả về container (sprite + nametag)
     .getPosition()                — { x, y }
     .setPosition(x, y)            — Teleport
     .setCharacter(charId)         — Đổi sprite runtime
     .destroy()                    — Cleanup
   ───────────────────────────────────────────────────────────────────────
   Load order: SAU engine.js + tileset.js + joystick.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.player) return;
  window.__WF = window.__WF || {};

  /* ═══════════════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════════════ */
  const PLAYER_SPEED = 180;         // px/s
  const SPRITE_W = 64;              // Sprite hiển thị (không phải raw)
  const SPRITE_H = 88;
  const BODY_W = 32;                // Physics body (dưới chân)
  const BODY_H = 24;
  const BOB_AMPLITUDE = 2;          // ±2px khi đi bộ
  const BOB_FREQ = 0.012;           // Tần số bob
  const DEPTH_BASE = 1000;          // Depth = Y + DEPTH_BASE

  function log(...a){
    try { console.log('[WF-Player]', ...a); } catch(_){}
  }

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  let _scene = null;
  let _container = null;            // Phaser.Container chứa sprite + shadow + nametag
  let _sprite = null;               // Sprite nhân vật (fallback: circle)
  let _shadow = null;               // Ellipse shadow dưới chân
  let _nametag = null;              // Text tên player
  let _enhBadge = null;             // Text +enh
  let _marker = null;               // Con trỏ dưới chân (circle nhỏ)
  let _facing = 'down';
  let _bobPhase = 0;
  let _lastMoveDir = { x: 0, y: 0 };
  let _charId = null;
  let _texKey = 'player_current';
  let _loading = false;
  let _pendingCharId = null;
  let _playerData = null;

  /* ═══════════════════════════════════════════════════════════════
     CREATE
     ═══════════════════════════════════════════════════════════════ */
  async function create(scene, opts){
    if (!scene) throw new Error('player.create: scene required');
    opts = opts || {};

    destroy();
    _scene = scene;

    _playerData = window.__WF.world?.getPlayerData?.() || {
      userId: 'guest',
      displayName: 'Bạn',
      characterId: null,
      enh: 0,
    };
    _charId = _playerData.characterId;

    const startX = Number(opts.x) || scene.scale.width / 2;
    const startY = Number(opts.y) || scene.scale.height / 2;

    // ─── Container chính ───
    _container = scene.add.container(startX, startY);
    _container.setDepth(DEPTH_BASE + startY);

    // ─── Shadow (bóng dưới chân) ───
    _shadow = scene.add.ellipse(0, SPRITE_H / 2 - 4, 40, 14, 0x000000, 0.35);
    _container.add(_shadow);

    // ─── Marker (chấm vàng nhỏ) ───
    _marker = scene.add.circle(0, SPRITE_H / 2 - 4, 4, 0xf59e0b, 0.7);
    _container.add(_marker);

    // ─── Sprite nhân vật (placeholder = circle) ───
    _sprite = scene.add.circle(0, 0, 24, 0xffd966, 1);
    _sprite.setStrokeStyle(3, 0xf59e0b, 1);
    _container.add(_sprite);

    // ─── Nametag ───
    _nametag = scene.add.text(0, SPRITE_H / 2 + 8, _playerData.displayName, {
      fontFamily: 'ui-rounded, system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    _nametag.setOrigin(0.5, 0);
    _nametag.setDepth(1);
    _container.add(_nametag);

    // ─── Enh badge (nếu có) ───
    if (_playerData.enh > 0){
      _enhBadge = scene.add.text(0, SPRITE_H / 2 + 24, `+${_playerData.enh}`, {
        fontFamily: 'ui-rounded, system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: '900',
        color: '#f59e0b',
        stroke: '#000000',
        strokeThickness: 2,
      });
      _enhBadge.setOrigin(0.5, 0);
      _enhBadge.setDepth(1);
      _container.add(_enhBadge);
    }

    // ─── Physics body ───
    scene.physics.world.enable(_container);
    const body = _container.body;
    body.setSize(BODY_W, BODY_H);
    body.setOffset(-BODY_W / 2, SPRITE_H / 2 - BODY_H);
    body.setCollideWorldBounds(true);

    // ─── Camera follow ───
    scene.cameras.main.startFollow(_container, true, 0.1, 0.1);
    scene.cameras.main.setZoom(1);
    scene.cameras.main.setDeadzone(100, 80);

    // ─── Load sprite thật từ character library ───
    await loadPlayerSprite(scene, _charId);

    log('Created at', startX, startY, '— char:', _charId || 'default');
    return _container;
  }

  /* ═══════════════════════════════════════════════════════════════
     LOAD PLAYER SPRITE TỪ character-library
     ═══════════════════════════════════════════════════════════════ */
  async function loadPlayerSprite(scene, charId){
    if (!scene || !_sprite) return;
    const LIB = window.__WF.characterLibrary;
    const TS = window.__WF.tileset;
    if (!LIB || !TS) return;
    if (_loading) return;
    _loading = true;

    const char = LIB.getById(charId) || LIB.getDefault();
    if (!char){
      _loading = false;
      return;
    }

    // Lấy URL (sync cho Ragnarok, async cho LPC)
    let url = '';
    try {
      if (char.job != null){
        url = LIB.getUrl(char);
      } else {
        url = await LIB.getUrlAsync(char);
      }
    } catch(e){
      log('Get URL failed:', e);
      _loading = false;
      return;
    }

    if (!url){
      _loading = false;
      return;
    }

    // Load texture vào Phaser
    const newTexKey = 'player_' + char.id;
    TS.loadPlayerTexture(scene, url, newTexKey, (ok) => {
      if (!ok || !_sprite || !_scene) {
        _loading = false;
        return;
      }

      // Thay circle bằng sprite ảnh
      const oldSprite = _sprite;
      const newSprite = _scene.add.image(0, 0, newTexKey);
      newSprite.setDisplaySize(SPRITE_W, SPRITE_H);
      newSprite.setOrigin(0.5, 0.5);

      // Insert vào container ở đúng vị trí
      const idx = _container.getIndex(oldSprite);
      _container.addAt(newSprite, idx);
      oldSprite.destroy();

      _sprite = newSprite;
      _texKey = newTexKey;
      _charId = char.id;
      _loading = false;

      log('Sprite loaded:', char.name);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     UPDATE (gọi mỗi frame từ scene.update)
     ═══════════════════════════════════════════════════════════════ */
  function update(delta){
    if (!_container || !_scene) return;

    const J = window.__WF.joystick;
    const vec = J ? J.getVector() : { x: 0, y: 0 };

    const body = _container.body;
    if (!body) return;

    // Velocity from joystick
    body.setVelocity(vec.x * PLAYER_SPEED, vec.y * PLAYER_SPEED);

    // Facing + bob
    const moving = Math.abs(vec.x) > 0.05 || Math.abs(vec.y) > 0.05;
    if (moving){
      _lastMoveDir = { x: vec.x, y: vec.y };

      // Ưu tiên chiều ngang nếu |x| > |y| để "rõ ràng" hơn
      if (Math.abs(vec.x) > Math.abs(vec.y)){
        _facing = vec.x > 0 ? 'right' : 'left';
      } else {
        _facing = vec.y > 0 ? 'down' : 'up';
      }

      // Flip sprite khi đi trái/phải
      if (_sprite && _sprite.setFlipX){
        if (_facing === 'left') _sprite.setFlipX(true);
        else if (_facing === 'right') _sprite.setFlipX(false);
      }

      // Bob (sprite nhấp nhô)
      _bobPhase += delta * BOB_FREQ;
      const bob = Math.sin(_bobPhase) * BOB_AMPLITUDE;

      if (_sprite){
        _sprite.y = bob;
      }
      if (_shadow){
        _shadow.scaleX = 1 + Math.sin(_bobPhase) * 0.05;
      }
    } else {
      // Idle: bob về 0 mượt
      _bobPhase = 0;
      if (_sprite && Math.abs(_sprite.y) > 0.1){
        _sprite.y *= 0.85;
      }
      if (_shadow) _shadow.scaleX = 1;
    }

    // Depth sort theo Y (nhân vật đi xuống → che nhân vật đi lên)
    _container.setDepth(DEPTH_BASE + _container.y);

    // Nametag + enh không bị bob theo sprite
    if (_nametag) _nametag.setDepth(1);
    if (_enhBadge) _enhBadge.setDepth(1);
  }

  /* ═══════════════════════════════════════════════════════════════
     SWAP CHARACTER (user đổi nhân vật trong tab Nhân vật)
     ═══════════════════════════════════════════════════════════════ */
  async function setCharacter(charId){
    if (!_scene || !_sprite) return;
    if (charId === _charId) return;
    if (_loading){
      _pendingCharId = charId;
      return;
    }
    await loadPlayerSprite(_scene, charId);
    if (_pendingCharId){
      const next = _pendingCharId;
      _pendingCharId = null;
      if (next !== _charId) setCharacter(next);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     NAMETAG UPDATE (khi user đổi tên)
     ═══════════════════════════════════════════════════════════════ */
  function setName(name){
    if (_nametag && name){
      _nametag.setText(String(name));
    }
  }
  function setEnh(enh){
    const n = Number(enh) || 0;
    if (_enhBadge){
      _enhBadge.setText(n > 0 ? `+${n}` : '');
    } else if (n > 0 && _container && _scene){
      _enhBadge = _scene.add.text(0, SPRITE_H / 2 + 24, `+${n}`, {
        fontFamily: 'ui-rounded, system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: '900',
        color: '#f59e0b',
        stroke: '#000000',
        strokeThickness: 2,
      });
      _enhBadge.setOrigin(0.5, 0);
      _enhBadge.setDepth(1);
      _container.add(_enhBadge);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════════════════════ */
  function getSprite(){ return _sprite; }
  function getContainer(){ return _container; }
  function getPosition(){
    return _container ? { x: _container.x, y: _container.y } : { x: 0, y: 0 };
  }
  function getFacing(){ return _facing; }
  function setPosition(x, y){
    if (!_container) return;
    _container.setPosition(x, y);
    if (_container.body){
      _container.body.reset(x, y);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     DESTROY
     ═══════════════════════════════════════════════════════════════ */
  function destroy(){
    if (_container){
      try { _container.destroy(); } catch(_){}
    }
    _container = null;
    _sprite = null;
    _shadow = null;
    _marker = null;
    _nametag = null;
    _enhBadge = null;
    _bobPhase = 0;
    _facing = 'down';
    _loading = false;
    _pendingCharId = null;
    _scene = null;
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.player = {
    create,
    update,
    setCharacter,
    setName,
    setEnh,
    getSprite,
    getContainer,
    getPosition,
    getFacing,
    setPosition,
    destroy,
    // Consts
    SPEED: PLAYER_SPEED,
    SPRITE_W,
    SPRITE_H,
  };

  log('player.js ✓ (movement + camera + depth sort)');
})();