/* =========================================================
   SITE CONTENT EDITOR — v1.4 (title + lyrics + music)
   ---------------------------------------------------------
   v1.4:
   - Thêm MUSIC: upload MP3 lên Supabase Storage bucket site-audio
   - Admin long-press countdown/lyric → dialog có upload nhạc + volume
   - Lưu URL vào site_settings key="site_music"
   v1.3: thêm lyrics
   v1.2: site title
   ========================================================= */
(function () {
  "use strict";
  if (window.__bdTitle) return;

  /* ─── CACHE KEYS ─── */
  const TITLE_CACHE_KEY  = "srank_site_title_v2";
  const LYR_CACHE_KEY    = "srank_site_lyrics_v1";
  const MUSIC_CACHE_KEY  = "srank_site_music_v1";

  /* ─── SETTING KEYS ─── */
  const TITLE_SETTING    = "site_title";
  const LYR_SETTING      = "site_lyrics";
  const MUSIC_SETTING    = "site_music";

  /* ─── HINT KEYS ─── */
  const HINT_KEY         = "srank_site_title_hint_v2";
  const LYR_HINT_KEY     = "srank_site_lyrics_hint_v1";

  /* ─── RPC ─── */
  const RPC_GET          = "rpc_get_site_setting";
  const RPC_SET          = "rpc_set_site_setting";
  const LONG_PRESS_MS    = 650;
  const MAX_AUDIO_SIZE   = 8 * 1024 * 1024; // 8MB

  const _titleState  = { line1: "", line2: "" };
  const _lyricsState = { raw: "" };
  const _musicState  = { url: "", volume: 0.4, updatedAt: 0 };

  function _esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function _dispatch(eventName) {
    window.dispatchEvent(new Event(eventName));
  }

  /* ═══════════════════════════════════════════════════════
     TITLE
     ═══════════════════════════════════════════════════════ */
  function getTitleHTML() {
    let h = "";
    const l1 = String(_titleState.line1 || "").trim();
    const l2 = String(_titleState.line2 || "").trim();
    if (l1) h += '<span class="rainbow-line">' + _esc(l1) + "</span>";
    if (l2) h += '<span class="rainbow-line">' + _esc(l2) + "</span>";
    return h;
  }

  function _loadTitleCache() {
    try {
      const o = JSON.parse(localStorage.getItem(TITLE_CACHE_KEY) || "null");
      if (o && typeof o.line1 === "string") {
        _titleState.line1 = o.line1;
        _titleState.line2 = typeof o.line2 === "string" ? o.line2 : "";
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveTitleCache() {
    try {
      localStorage.setItem(TITLE_CACHE_KEY, JSON.stringify({
        line1: _titleState.line1, line2: _titleState.line2
      }));
    } catch (_) {}
  }

  async function _loadTitleFromServer() {
    return _rpcLoad(TITLE_SETTING, function (o) {
      if (!o || typeof o.line1 !== "string") return false;
      const newL1 = o.line1, newL2 = typeof o.line2 === "string" ? o.line2 : "";
      const changed = (newL1 !== _titleState.line1) || (newL2 !== _titleState.line2);
      _titleState.line1 = newL1; _titleState.line2 = newL2;
      _saveTitleCache();
      return changed;
    });
  }

  async function _saveTitleToServer() {
    return _rpcSave(TITLE_SETTING, JSON.stringify({
      line1: String(_titleState.line1 || "").trim(),
      line2: String(_titleState.line2 || "").trim()
    }));
  }

  /* ═══════════════════════════════════════════════════════
     LYRICS
     ═══════════════════════════════════════════════════════ */
  function getLyricsRaw() { return String(_lyricsState.raw || ""); }

  function getLyricsPhrases() {
    const raw = String(_lyricsState.raw || "").trim();
    if (!raw) return [];
    return raw.split(/[.。]/).map(s => s.trim()).filter(Boolean);
  }

  function _loadLyricsCache() {
    try {
      const o = JSON.parse(localStorage.getItem(LYR_CACHE_KEY) || "null");
      if (o && typeof o.raw === "string") {
        _lyricsState.raw = o.raw;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveLyricsCache() {
    try {
      localStorage.setItem(LYR_CACHE_KEY, JSON.stringify({ raw: _lyricsState.raw }));
    } catch (_) {}
  }

  async function _loadLyricsFromServer() {
    return _rpcLoad(LYR_SETTING, function (o) {
      if (!o || typeof o.raw !== "string") return false;
      const changed = o.raw !== _lyricsState.raw;
      _lyricsState.raw = o.raw;
      _saveLyricsCache();
      return changed;
    });
  }

  async function _saveLyricsToServer() {
    return _rpcSave(LYR_SETTING, JSON.stringify({ raw: String(_lyricsState.raw || "").trim() }));
  }

  /* ═══════════════════════════════════════════════════════
     MUSIC
     ═══════════════════════════════════════════════════════ */
  function getMusic() {
    return {
      url: String(_musicState.url || ""),
      volume: Number(_musicState.volume) || 0.4,
      updatedAt: Number(_musicState.updatedAt) || 0
    };
  }

  function _getSupabaseBaseUrl() {
    const sb = window.__sb;
    if (sb && sb.supabaseUrl) return String(sb.supabaseUrl).replace(/\/$/, "");
    if (sb && sb.restUrl) return String(sb.restUrl).replace(/\/rest\/v1\/?$/, "");
    return "https://tumjcsaexddioecwjolp.supabase.co";
  }

  async function _getAccessToken() {
    const sb = window.__sb;
    if (!sb || !sb.auth) return "";
    try {
      const { data } = await sb.auth.getSession();
      return data?.session?.access_token || "";
    } catch (_) { return ""; }
  }

  function _loadMusicCache() {
    try {
      const o = JSON.parse(localStorage.getItem(MUSIC_CACHE_KEY) || "null");
      if (o && typeof o.url === "string") {
        _musicState.url = o.url;
        _musicState.volume = Number(o.volume) || 0.4;
        _musicState.updatedAt = Number(o.updatedAt) || 0;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function _saveMusicCache() {
    try {
      localStorage.setItem(MUSIC_CACHE_KEY, JSON.stringify({
        url: _musicState.url, volume: _musicState.volume, updatedAt: _musicState.updatedAt
      }));
    } catch (_) {}
  }

  async function _loadMusicFromServer() {
    return _rpcLoad(MUSIC_SETTING, function (o) {
      if (!o || typeof o.url !== "string") return false;
      const newUrl = o.url;
      const newVol = Number(o.volume) || 0.4;
      const newUp  = Number(o.updatedAt) || 0;
      const changed = newUrl !== _musicState.url
                   || newVol !== _musicState.volume
                   || newUp !== _musicState.updatedAt;
      _musicState.url = newUrl;
      _musicState.volume = newVol;
      _musicState.updatedAt = newUp;
      _saveMusicCache();
      return changed;
    });
  }

  async function _saveMusicToServer() {
    return _rpcSave(MUSIC_SETTING, JSON.stringify({
      url: _musicState.url,
      volume: _musicState.volume,
      updatedAt: _musicState.updatedAt
    }));
  }

  async function _uploadMusicFile(file) {
    if (!file) throw new Error("Chưa chọn file");
    if (!String(file.type || "").startsWith("audio/") && !/\.(mp3|m4a|ogg|wav|aac)$/i.test(file.name)) {
      throw new Error("File không phải audio");
    }
    if (file.size > MAX_AUDIO_SIZE) {
      throw new Error("File quá lớn (tối đa 8MB)");
    }

    const token = await _getAccessToken();
    if (!token) throw new Error("Chưa login — thử đăng nhập lại");

    const baseUrl = _getSupabaseBaseUrl();
    const ext = (file.name.match(/\.[a-z0-9]+$/i) || [".mp3"])[0].toLowerCase();
    const path = "bgm" + ext;

    const res = await fetch(baseUrl + "/storage/v1/object/site-audio/" + path, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "x-upsert": "true",
        "Content-Type": file.type || "audio/mpeg",
        "Cache-Control": "3600"
      },
      body: file
    });

    if (!res.ok) {
      let msg = "Upload lỗi " + res.status;
      try { const t = await res.text(); if (t) msg += ": " + t.slice(0, 200); } catch (_) {}
      throw new Error(msg);
    }

    const updatedAt = Date.now();
    const publicUrl = baseUrl + "/storage/v1/object/public/site-audio/" + path + "?t=" + updatedAt;

    _musicState.url = publicUrl;
    _musicState.updatedAt = updatedAt;
    await _saveMusicToServer();
    _saveMusicCache();
    _dispatch("bdMusicChanged");
    return publicUrl;
  }

  async function _deleteMusic() {
    const token = await _getAccessToken();
    if (token && _musicState.url) {
      // Cố xoá file bgm.* trên storage (best-effort, không throw nếu fail)
      const baseUrl = _getSupabaseBaseUrl();
      const m = _musicState.url.match(/site-audio\/([^?]+)/);
      const path = m ? m[1] : "bgm.mp3";
      try {
        await fetch(baseUrl + "/storage/v1/object/site-audio/" + path, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });
      } catch (_) {}
    }
    _musicState.url = "";
    _musicState.updatedAt = Date.now();
    await _saveMusicToServer();
    _saveMusicCache();
    _dispatch("bdMusicChanged");
  }

  /* ═══════════════════════════════════════════════════════
     RPC HELPERS
     ═══════════════════════════════════════════════════════ */
  async function _rpcLoad(key, applyFn) {
    const sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") return false;
    try {
      const res = await sb.rpc(RPC_GET, { p_key: key });
      if (res.error) { console.warn("[bdTitle] RPC_GET error:", res.error.message || res.error); return false; }
      if (!res.data) return false;
      let o = null;
      try { o = typeof res.data === "string" ? JSON.parse(res.data) : res.data; } catch (_) { return false; }
      return applyFn(o);
    } catch (e) {
      console.warn("[bdTitle] load failed:", e && e.message);
      return false;
    }
  }

  async function _rpcSave(key, value) {
    const sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") throw new Error("Không có kết nối server");
    const res = await sb.rpc(RPC_SET, { p_key: key, p_value: value });
    if (res.error) throw new Error(res.error.message || "Server từ chối");
    return true;
  }

  /* ═══════════════════════════════════════════════════════
     ADMIN DETECTION
     ═══════════════════════════════════════════════════════ */
  function _isAdmin() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u) return false;
      if (window.Role?.isAdmin) { try { return !!window.Role.isAdmin(u); } catch (_) {} }
      const am = u.app_metadata || {}, um = u.user_metadata || {};
      const r = am.role || um.role || am.roles || um.roles || "";
      const arr = Array.isArray(r) ? r : [r];
      if (arr.some(x => String(x).toLowerCase().indexOf("admin") >= 0)) return true;
      if (am.is_admin === true || um.is_admin === true) return true;
      const un = String(u.username || "").toLowerCase();
      if (un === "minhquan" || un === "admin") return true;
      return false;
    } catch (_) { return false; }
  }

  /* ═══════════════════════════════════════════════════════
     DIALOG — Lyrics + Music
     ═══════════════════════════════════════════════════════ */
  function _closeOverlay(id) { document.getElementById(id)?.remove(); }

  function _openContentEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdContentEditorOverlay");

    const ov = document.createElement("div");
    ov.id = "bdContentEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:440px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;">' +

      /* Header */
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">🎵 Nội dung Landing</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Lời bài hát + nhạc nền · Áp dụng cho mọi người</div>' +

      /* Lyrics section */
      '<div style="font-size:12px;font-weight:800;color:#4a3520;margin-bottom:6px;">📝 Lời bài hát</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:6px;">Mỗi câu cách nhau bằng dấu chấm (.). Để trống để tắt.</div>' +
      '<textarea id="bdLyricsRaw" rows="5" placeholder="VD: Yêu em nhiều lắm. Anh nhớ em vô cùng." ' +
      'style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:13px;' +
      'font-weight:600;line-height:1.5;margin-bottom:6px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>' +
      '<div id="bdLyricsPreview" style="font-size:11px;color:#8a6a3a;margin-bottom:14px;min-height:14px;"></div>' +

      /* Music section */
      '<div style="font-size:12px;font-weight:800;color:#4a3520;margin-bottom:6px;">🎶 Nhạc nền</div>' +
      '<div id="bdMusicStatus" style="font-size:11px;color:#666;margin-bottom:8px;padding:8px 10px;' +
      'background:#f5f7fa;border-radius:6px;word-break:break-all;"></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<button id="bdMusicPickBtn" type="button" style="flex:1;padding:10px;border:2px dashed #b0d0c0;' +
      'background:#f0f9f4;border-radius:8px;font-weight:800;font-size:13px;color:#4fa370;cursor:pointer;">📁 Chọn file nhạc</button>' +
      '<button id="bdMusicDeleteBtn" type="button" style="padding:10px 14px;border:2px solid #e74c3c;' +
      'background:#fff;border-radius:8px;font-weight:800;font-size:13px;color:#e74c3c;cursor:pointer;">🗑</button>' +
      '</div>' +
      '<input type="file" id="bdMusicFileInput" accept="audio/*" hidden>' +

      /* Volume */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
      '<span style="font-size:11px;font-weight:800;color:#666;min-width:56px;">Âm lượng</span>' +
      '<input id="bdMusicVolume" type="range" min="0" max="100" step="5" value="40" ' +
      'style="flex:1;accent-color:#4fa370;">' +
      '<span id="bdMusicVolLabel" style="font-size:11px;font-weight:900;color:#4fa370;min-width:34px;text-align:right;">40%</span>' +
      '</div>' +

      /* Message */
      '<div id="bdContentMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +

      /* Buttons */
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdContentCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;' +
      'background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huỷ</button>' +
      '<button id="bdContentSave" type="button" style="flex:1;padding:12px;border:0;' +
      'background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;' +
      'font-size:14px;color:#fff;cursor:pointer;">Lưu lời bài hát</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    const ta       = ov.querySelector("#bdLyricsRaw");
    const prev     = ov.querySelector("#bdLyricsPreview");
    const msg      = ov.querySelector("#bdContentMsg");
    const btnSave  = ov.querySelector("#bdContentSave");
    const btnCancel= ov.querySelector("#bdContentCancel");
    const statusEl = ov.querySelector("#bdMusicStatus");
    const pickBtn  = ov.querySelector("#bdMusicPickBtn");
    const deleteBtn= ov.querySelector("#bdMusicDeleteBtn");
    const fileInput= ov.querySelector("#bdMusicFileInput");
    const volInput = ov.querySelector("#bdMusicVolume");
    const volLabel = ov.querySelector("#bdMusicVolLabel");

    /* Init values */
    ta.value = _lyricsState.raw || "";
    volInput.value = Math.round((_musicState.volume || 0.4) * 100);
    volLabel.textContent = volInput.value + "%";

    function _updateLyricsPreview() {
      const raw = String(ta.value || "").trim();
      if (!raw) { prev.textContent = "— Trống: sẽ hiện countdown khoá Checklist —"; return; }
      const parts = raw.split(/[.。]/).map(s => s.trim()).filter(Boolean);
      prev.textContent = "📝 " + parts.length + " câu · VD: \"" +
        (parts[0] || "").slice(0, 40) + (parts[0] && parts[0].length > 40 ? "…" : "") + "\"";
    }
    function _updateMusicStatus() {
      if (_musicState.url) {
        const name = (_musicState.url.match(/site-audio\/([^?]+)/) || [])[1] || "bgm";
        statusEl.innerHTML = '✅ Đang dùng: <b>' + _esc(name) + '</b>';
        statusEl.style.color = "#4fa370";
        deleteBtn.disabled = false;
      } else {
        statusEl.textContent = "— Chưa có nhạc —";
        statusEl.style.color = "#888";
        deleteBtn.disabled = true;
      }
    }

    ta.addEventListener("input", _updateLyricsPreview);
    _updateLyricsPreview();
    _updateMusicStatus();

    volInput.addEventListener("input", function () {
      volLabel.textContent = volInput.value + "%";
    });

    pickBtn.onclick = () => fileInput.click();

    fileInput.onchange = async function () {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      pickBtn.disabled = true;
      pickBtn.textContent = "⏳ Đang upload...";
      msg.textContent = "";
      try {
        await _uploadMusicFile(f);
        _updateMusicStatus();
        msg.textContent = "✓ Upload nhạc thành công";
        msg.style.color = "#4fa370";
      } catch (e) {
        msg.textContent = "✗ " + (e && e.message ? e.message : "Upload lỗi");
        msg.style.color = "#e74c3c";
      } finally {
        pickBtn.disabled = false;
        pickBtn.textContent = "📁 Chọn file nhạc";
        fileInput.value = "";
      }
    };

    deleteBtn.onclick = async function () {
      if (!confirm("Xoá nhạc nền?")) return;
      deleteBtn.disabled = true;
      deleteBtn.textContent = "⏳";
      msg.textContent = "";
      try {
        await _deleteMusic();
        _updateMusicStatus();
        msg.textContent = "✓ Đã xoá nhạc";
        msg.style.color = "#4fa370";
      } catch (e) {
        msg.textContent = "✗ " + (e && e.message ? e.message : "Lỗi xoá");
        msg.style.color = "#e74c3c";
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "🗑";
      }
    };

    btnCancel.onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };

    btnSave.onclick = async function () {
      const raw = String(ta.value || "").trim();
      const vol = Math.max(0, Math.min(1, parseInt(volInput.value, 10) / 100));

      btnSave.disabled = true;
      btnSave.textContent = "⏳ Đang lưu...";
      msg.textContent = "";

      const backup = { raw: _lyricsState.raw, volume: _musicState.volume };
      _lyricsState.raw = raw;
      _musicState.volume = vol;

      try {
        await _saveLyricsToServer();
        _saveLyricsCache();
        if (_musicState.url) {
          await _saveMusicToServer();
          _saveMusicCache();
        }
        _dispatch("bdLyricsChanged");
        _dispatch("bdMusicChanged");
        msg.textContent = raw ? "✓ Đã lưu lời bài hát" : "✓ Đã tắt lyrics";
        msg.style.color = "#4fa370";
        setTimeout(() => ov.remove(), 700);
      } catch (e) {
        _lyricsState.raw = backup.raw;
        _musicState.volume = backup.volume;
        msg.textContent = "✗ Lỗi: " + (e && e.message ? e.message : "không lưu được");
        msg.style.color = "#e74c3c";
        btnSave.disabled = false;
        btnSave.textContent = "Lưu lời bài hát";
      }
    };
  }

  /* ═══════════════════════════════════════════════════════
     TITLE EDITOR (riêng)
     ═══════════════════════════════════════════════════════ */
  function _openTitleEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdTitleEditorOverlay");

    const ov = document.createElement("div");
    ov.id = "bdTitleEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">✏️ Sửa tiêu đề</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Áp dụng cho tất cả · Để trống cả 2 dòng để ẩn</div>' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 1</label>' +
      '<input id="bdTitleL1" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:12px;box-sizing:border-box;">' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dòng 2 (có thể trống)</label>' +
      '<input id="bdTitleL2" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:16px;box-sizing:border-box;">' +
      '<div id="bdTitleMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdTitleCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huỷ</button>' +
      '<button id="bdTitleSave" type="button" style="flex:1;padding:12px;border:0;background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;font-size:14px;color:#fff;cursor:pointer;">Lưu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    const inp1 = ov.querySelector("#bdTitleL1");
    const inp2 = ov.querySelector("#bdTitleL2");
    const msg  = ov.querySelector("#bdTitleMsg");
    const btnS = ov.querySelector("#bdTitleSave");
    const btnC = ov.querySelector("#bdTitleCancel");

    inp1.value = _titleState.line1 || "";
    inp2.value = _titleState.line2 || "";
    setTimeout(() => { inp1.focus(); inp1.select(); }, 60);

    btnC.onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };

    btnS.onclick = async function () {
      const l1 = inp1.value.trim(), l2 = inp2.value.trim();
      btnS.disabled = true; btnS.textContent = "⏳ Đang lưu..."; msg.textContent = "";

      const backup = { line1: _titleState.line1, line2: _titleState.line2 };
      _titleState.line1 = l1; _titleState.line2 = l2;

      try {
        await _saveTitleToServer();
        _saveTitleCache();
        _dispatch("bdTitleChanged");
        msg.textContent = (!l1 && !l2) ? "✓ Đã xoá tiêu đề" : "✓ Đã lưu";
        msg.style.color = "#4fa370";
        setTimeout(() => ov.remove(), 700);
      } catch (e) {
        _titleState.line1 = backup.line1;
        _titleState.line2 = backup.line2;
        msg.textContent = "✗ Lỗi: " + (e && e.message ? e.message : "không lưu được");
        msg.style.color = "#e74c3c";
        btnS.disabled = false; btnS.textContent = "Lưu";
      }
    };
  }

  /* ═══════════════════════════════════════════════════════
     LONG-PRESS generic
     ═══════════════════════════════════════════════════════ */
  function _bindLongPress(selector, callback) {
    let timer = null, target = null, startX = 0, startY = 0;

    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (target) { target.style.transform = ""; target = null; }
    }

    document.addEventListener("pointerdown", function (e) {
      if (!_isAdmin()) return;
      const t = e.target.closest && e.target.closest(selector);
      if (!t) return;
      target = t; startX = e.clientX; startY = e.clientY;
      t.style.transition = "transform .15s";
      t.style.transform = "scale(0.97)";

      timer = setTimeout(function () {
        timer = null;
        if (target) {
          target.style.transform = "";
          if (navigator.vibrate) try { navigator.vibrate(30); } catch (_) {}
          callback();
          target = null;
        }
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener("pointerup", cancel);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("pointermove", function (e) {
      if (!timer) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 10) cancel();
    }, { passive: true });

    document.addEventListener("contextmenu", function (e) {
      if (!_isAdmin()) return;
      if (e.target.closest && e.target.closest(selector)) {
        e.preventDefault(); callback();
      }
    });

    document.addEventListener("selectstart", function (e) {
      if (target && e.target.closest && e.target.closest(selector)) e.preventDefault();
    });
  }

  function _bindAllLongPress() {
    _bindLongPress(".landing-title.rainbow-birthday", _openTitleEditor);
    _bindLongPress(".landing-lyric, .birthday-countdown", _openContentEditor);
  }

  /* ═══════════════════════════════════════════════════════
     HINTS
     ═══════════════════════════════════════════════════════ */
  function _showHint(key, text) {
    if (!_isAdmin()) return;
    try {
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch (_) {}
    setTimeout(function () {
      try { window.Toast?.show?.(text, { type: "info", duration: 3200 }); } catch (_) {}
    }, 2500);
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  function _init() {
    _loadTitleCache();
    _loadLyricsCache();
    _loadMusicCache();
    _bindAllLongPress();

    Promise.all([
      _loadTitleFromServer(),
      _loadLyricsFromServer(),
      _loadMusicFromServer()
    ]).then(function (r) {
      if (r[0]) _dispatch("bdTitleChanged");
      if (r[1]) _dispatch("bdLyricsChanged");
      if (r[2]) _dispatch("bdMusicChanged");
      _showHint(HINT════_KEY, "💡 Nh════ấn giữ tiêu đề để sử════a");
      _showHint(LYR_HINT_KEY, "════💡 Nhấn giữ countdown/lyric để════ thêm════ lời + nhạc");
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      Promise.all([
        _loadTitleFromServer(),
        _loadLyricsFromServer(),
        _loadMusicFromServer()
      ]).then(function (r) {
        if (r[0]) _dispatch("bdTitleChanged");
        if (r[1]) _dispatch("bdLyricsChanged");
        if (r[2]) _dispatch("bdMusicChanged");
      });
    });
  }

  /* ═══════════════════════════════
     EXPOSE
     ═══════════════════════════════════════════════════════ */
  window.__bdTitle = {
    // Title
    getHTML: getTitleHTML,
    getLines: () => ({ line1: _titleState.line1 || "", line2: _titleState.line2 || "" }),
    openTitleEditor: _openTitleEditor,
    // Lyrics
    getLyricsRaw: getLyricsRaw,
    getLyricsPhrases: getLyricsPhrases,
    openLyricsEditor: _openContentEditor,
    // Music
    getMusic: getMusic,
    // Shared
    isAdmin: _isAdmin,
    reload: function () {
      return Promise.all([
        _loadTitleFromServer(),
        _loadLyricsFromServer(),
        _loadMusicFromServer()
      ]).then(function (r) {
        if (r[0]) _dispatch("bdTitleChanged");
        if (r[1]) _dispatch("bdLyricsChanged");
        if (r[2]) _dispatch("bdMusicChanged");
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init, { once: true });
  } else {
    setTimeout(_init, 0);
  }

  console.log("[bdTitle] ready ✓ v1.4 (title + lyrics + music)");
})();