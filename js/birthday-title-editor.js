/* =========================================================
   SITE CONTENT EDITOR v1.7 (title + lyrics + music)
   ---------------------------------------------------------
   v1.7: Ultra-safe ES5 - fix SyntaxError line 176
     - Bo ky tu Unicode la (。 -> \u3002)
     - Bo .filter(Boolean) -> function(x){return !!x;}
     - Bo arrow function, async/await, template literal
   v1.6: iOS MP3 file picker fix
   ========================================================= */
(function () {
  "use strict";
  if (window.__bdTitle) return;

  var TITLE_CACHE_KEY  = "srank_site_title_v2";
  var LYR_CACHE_KEY    = "srank_site_lyrics_v1";
  var MUSIC_CACHE_KEY  = "srank_site_music_v1";

  var TITLE_SETTING    = "site_title";
  var LYR_SETTING      = "site_lyrics";
  var MUSIC_SETTING    = "site_music";

  var HINT_KEY         = "srank_site_title_hint_v2";
  var LYR_HINT_KEY     = "srank_site_lyrics_hint_v1";

  var RPC_GET          = "rpc_get_site_setting";
  var RPC_SET          = "rpc_set_site_setting";
  var LONG_PRESS_MS    = 650;
  var MAX_AUDIO_SIZE   = 8  * 1024 * 1024;
  var MAX_VIDEO_SIZE   = 15 * 1024 * 1024;

  var _titleState  = { line1: "", line2: "" };
  var _lyricsState = { raw: "" };
  var _musicState  = { url: "", volume: 0.4, updatedAt: 0 };

  function _esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function _dispatch(eventName) {
    window.dispatchEvent(new Event(eventName));
  }

  // =========================================================
  // TITLE
  // =========================================================
  function getTitleHTML() {
    var h = "";
    var l1 = String(_titleState.line1 || "").trim();
    var l2 = String(_titleState.line2 || "").trim();
    if (l1) h += '<span class="rainbow-line">' + _esc(l1) + "</span>";
    if (l2) h += '<span class="rainbow-line">' + _esc(l2) + "</span>";
    return h;
  }

  function _loadTitleCache() {
    try {
      var o = JSON.parse(localStorage.getItem(TITLE_CACHE_KEY) || "null");
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

  function _loadTitleFromServer() {
    return _rpcLoad(TITLE_SETTING, function (o) {
      if (!o || typeof o.line1 !== "string") return false;
      var newL1 = o.line1;
      var newL2 = typeof o.line2 === "string" ? o.line2 : "";
      var changed = (newL1 !== _titleState.line1) || (newL2 !== _titleState.line2);
      _titleState.line1 = newL1;
      _titleState.line2 = newL2;
      _saveTitleCache();
      return changed;
    });
  }

  function _saveTitleToServer() {
    return _rpcSave(TITLE_SETTING, JSON.stringify({
      line1: String(_titleState.line1 || "").trim(),
      line2: String(_titleState.line2 || "").trim()
    }));
  }

  // =========================================================
  // LYRICS
  // =========================================================
  function getLyricsRaw() { return String(_lyricsState.raw || ""); }

  function getLyricsPhrases() {
    var raw = String(_lyricsState.raw || "").trim();
    if (!raw) return [];
    // Split by period or Chinese period (unicode)
    var parts = raw.split(/[.\u3002]/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (t.length > 0) out.push(t);
    }
    return out;
  }

  function _loadLyricsCache() {
    try {
      var o = JSON.parse(localStorage.getItem(LYR_CACHE_KEY) || "null");
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

  function _loadLyricsFromServer() {
    return _rpcLoad(LYR_SETTING, function (o) {
      if (!o || typeof o.raw !== "string") return false;
      var changed = o.raw !== _lyricsState.raw;
      _lyricsState.raw = o.raw;
      _saveLyricsCache();
      return changed;
    });
  }

  function _saveLyricsToServer() {
    return _rpcSave(LYR_SETTING, JSON.stringify({ raw: String(_lyricsState.raw || "").trim() }));
  }

  // =========================================================
  // MUSIC
  // =========================================================
  function getMusic() {
    return {
      url: String(_musicState.url || ""),
      volume: Number(_musicState.volume) || 0.4,
      updatedAt: Number(_musicState.updatedAt) || 0
    };
  }

  function _getSupabaseBaseUrl() {
    var sb = window.__sb;
    if (sb && sb.supabaseUrl) return String(sb.supabaseUrl).replace(/\/$/, "");
    if (sb && sb.restUrl) return String(sb.restUrl).replace(/\/rest\/v1\/?$/, "");
    return "https://tumjcsaexddioecwjolp.supabase.co";
  }

  function _getAccessToken() {
    var sb = window.__sb;
    if (!sb || !sb.auth) {
      return Promise.resolve("");
    }
    return sb.auth.getSession().then(function (r) {
      if (r && r.data && r.data.session) {
        return r.data.session.access_token || "";
      }
      return "";
    }).catch(function () {
      return "";
    });
  }

  function _loadMusicCache() {
    try {
      var o = JSON.parse(localStorage.getItem(MUSIC_CACHE_KEY) || "null");
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

  function _loadMusicFromServer() {
    return _rpcLoad(MUSIC_SETTING, function (o) {
      if (!o || typeof o.url !== "string") return false;
      var newUrl = o.url;
      var newVol = Number(o.volume) || 0.4;
      var newUp  = Number(o.updatedAt) || 0;
      var changed = newUrl !== _musicState.url
                 || newVol !== _musicState.volume
                 || newUp !== _musicState.updatedAt;
      _musicState.url = newUrl;
      _musicState.volume = newVol;
      _musicState.updatedAt = newUp;
      _saveMusicCache();
      return changed;
    });
  }

  function _saveMusicToServer() {
    return _rpcSave(MUSIC_SETTING, JSON.stringify({
      url: _musicState.url,
      volume: _musicState.volume,
      updatedAt: _musicState.updatedAt
    }));
  }

  // -------------------------------------------------------
  // UPLOAD MUSIC (tach rieng de de debug)
  // -------------------------------------------------------
  function _uploadMusicFile(file) {
    if (!file) {
      return Promise.reject(new Error("Chua chon file"));
    }

    var mime = String(file.type || "").toLowerCase();
    var name = String(file.name || "").toLowerCase();

    var okAudioMime = mime.indexOf("audio/") === 0;
    var okVideoMime = mime.indexOf("video/") === 0;
    var okExt = /\.(mp3|m4a|aac|ogg|wav|flac|opus|mp4|mov|webm|mkv|m4v)\b/i.test(name);

    console.log("[bdTitle] upload file:", {
      name: file.name, type: file.type, size: file.size
    });

    if (!okAudioMime && !okVideoMime && !okExt) {
      return Promise.reject(new Error(
        "File khong phai audio/video. Chon .mp3, .m4a hoac .mp4"
      ));
    }

    var isVideo = okVideoMime || /\.(mp4|mov|webm|mkv|m4v)\b/i.test(name);
    var limit = isVideo ? MAX_VIDEO_SIZE : MAX_AUDIO_SIZE;
    if (file.size > limit) {
      return Promise.reject(new Error(
        "File qua lon (" + Math.round(limit / 1024 / 1024) + "MB). "
        + "Chuyen sang MP3 de giam dung luong."
      ));
    }

    var ext = ".mp3";
    var m = name.match(/\.(mp3|m4a|aac|ogg|wav|flac|opus|mp4|mov|webm|mkv|m4v)\b/i);
    if (m) ext = "." + m[1].toLowerCase();

    var path = "bgm" + ext;

    var ctype = file.type;
    if (!ctype) {
      if (ext === ".mp3") ctype = "audio/mpeg";
      else if (ext === ".m4a") ctype = "audio/mp4";
      else if (ext === ".mp4") ctype = "video/mp4";
      else if (ext === ".mov") ctype = "video/quicktime";
      else ctype = "application/octet-stream";
    }

    return _getAccessToken().then(function (token) {
      if (!token) {
        throw new Error("Chua login - thu dang nhap lai");
      }

      var baseUrl = _getSupabaseBaseUrl();
      var url = baseUrl + "/storage/v1/object/site-audio/" + path;

      return fetch(url, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "x-upsert": "true",
          "Content-Type": ctype,
          "Cache-Control": "3600"
        },
        body: file
      }).then(function (res) {
        if (res.ok) {
          return true;
        }
        return res.text().then(function (txt) {
          var errMsg = "Upload loi " + res.status;
          if (txt) errMsg += ": " + txt.slice(0, 200);
          throw new Error(errMsg);
        });
      }).then(function () {
        var updatedAt = Date.now();
        var publicUrl = baseUrl + "/storage/v1/object/public/site-audio/" + path + "?t=" + updatedAt;
        _musicState.url = publicUrl;
        _musicState.updatedAt = updatedAt;
        return _saveMusicToServer();
      }).then(function () {
        _saveMusicCache();
        _dispatch("bdMusicChanged");
        return _musicState.url;
      });
    });
  }

  function _deleteMusic() {
    return _getAccessToken().then(function (token) {
      if (!token || !_musicState.url) {
        return null;
      }
      var baseUrl = _getSupabaseBaseUrl();
      var match = _musicState.url.match(/site-audio\/([^?]+)/);
      var path = match ? match[1] : "bgm.mp3";
      var url = baseUrl + "/storage/v1/object/site-audio/" + path;
      return fetch(url, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      }).catch(function () { return null; });
    }).then(function () {
      _musicState.url = "";
      _musicState.updatedAt = Date.now();
      return _saveMusicToServer();
    }).then(function () {
      _saveMusicCache();
      _dispatch("bdMusicChanged");
    });
  }

  // =========================================================
  // RPC HELPERS
  // =========================================================
  function _rpcLoad(key, applyFn) {
    var sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") {
      return Promise.resolve(false);
    }
    return sb.rpc(RPC_GET, { p_key: key }).then(function (res) {
      if (res.error) {
        console.warn("[bdTitle] RPC_GET error:", res.error.message || res.error);
        return false;
      }
      if (!res.data) return false;
      var o = null;
      try {
        o = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      } catch (e) {
        return false;
      }
      return applyFn(o);
    }).catch(function (e) {
      console.warn("[bdTitle] load failed:", e && e.message);
      return false;
    });
  }

  function _rpcSave(key, value) {
    var sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") {
      return Promise.reject(new Error("Khong co ket noi server"));
    }
    return sb.rpc(RPC_SET, { p_key: key, p_value: value }).then(function (res) {
      if (res.error) {
        throw new Error(res.error.message || "Server tu choi");
      }
      return true;
    });
  }

  // =========================================================
  // ADMIN DETECTION
  // =========================================================
  function _isAdmin() {
    try {
      var u = null;
      if (window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser) {
        u = window.SRank.Auth.getCurrentUser();
      }
      if (!u) return false;
      if (window.Role && window.Role.isAdmin) {
        try { return !!window.Role.isAdmin(u); } catch (e) {}
      }
      var am = u.app_metadata || {};
      var um = u.user_metadata || {};
      var r = am.role || um.role || am.roles || um.roles || "";
      var arr = Array.isArray(r) ? r : [r];
      for (var i = 0; i < arr.length; i++) {
        if (String(arr[i]).toLowerCase().indexOf("admin") >= 0) return true;
      }
      if (am.is_admin === true || um.is_admin === true) return true;
      var un = String(u.username || "").toLowerCase();
      if (un === "minhquan" || un === "admin") return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  // =========================================================
  // DIALOG - Content
  // =========================================================
  function _closeOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  function _openContentEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdContentEditorOverlay");

    var ov = document.createElement("div");
    ov.id = "bdContentEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:440px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto;">' +

      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">Noi dung Landing</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Loi bai hat + nhac nen - Ap dung cho moi nguoi</div>' +

      '<div style="font-size:12px;font-weight:800;color:#4a3520;margin-bottom:6px;">Loi bai hat</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:6px;">Moi cau cach nhau bang dau cham (.). De trong de tat.</div>' +
      '<textarea id="bdLyricsRaw" rows="5" placeholder="VD: Yeu em nhieu lam. Anh nho em vo cung." ' +
      'style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:13px;' +
      'font-weight:600;line-height:1.5;margin-bottom:6px;box-sizing:border-box;resize:vertical;font-family:inherit;"></textarea>' +
      '<div id="bdLyricsPreview" style="font-size:11px;color:#8a6a3a;margin-bottom:14px;min-height:14px;"></div>' +

      '<div style="font-size:12px;font-weight:800;color:#4a3520;margin-bottom:6px;">Nhac nen</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:6px;">Ho tro MP3, M4A, MP4, MOV... Toi da 8MB (audio) / 15MB (video)</div>' +
      '<div id="bdMusicStatus" style="font-size:11px;color:#666;margin-bottom:8px;padding:8px 10px;' +
      'background:#f5f7fa;border-radius:6px;word-break:break-all;"></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<button id="bdMusicPickBtn" type="button" style="flex:1;padding:10px;border:2px dashed #b0d0c0;' +
      'background:#f0f9f4;border-radius:8px;font-weight:800;font-size:13px;color:#4fa370;cursor:pointer;">Chon file nhac</button>' +
      '<button id="bdMusicDeleteBtn" type="button" style="padding:10px 14px;border:2px solid #e74c3c;' +
      'background:#fff;border-radius:8px;font-weight:800;font-size:13px;color:#e74c3c;cursor:pointer;">Xoa</button>' +
      '</div>' +
      '<input type="file" id="bdMusicFileInput" ' +
      'accept="audio/*,video/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.opus,.mp4,.mov,.webm,.mkv,.m4v" hidden>' +

      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
      '<span style="font-size:11px;font-weight:800;color:#666;min-width:56px;">Am luong</span>' +
      '<input id="bdMusicVolume" type="range" min="0" max="100" step="5" value="40" ' +
      'style="flex:1;accent-color:#4fa370;">' +
      '<span id="bdMusicVolLabel" style="font-size:11px;font-weight:900;color:#4fa370;min-width:34px;text-align:right;">40%</span>' +
      '</div>' +

      '<div id="bdContentMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +

      '<div style="display:flex;gap:8px;">' +
      '<button id="bdContentCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;' +
      'background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huy</button>' +
      '<button id="bdContentSave" type="button" style="flex:1;padding:12px;border:0;' +
      'background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;' +
      'font-size:14px;color:#fff;cursor:pointer;">Luu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    var ta        = ov.querySelector("#bdLyricsRaw");
    var prev      = ov.querySelector("#bdLyricsPreview");
    var msg       = ov.querySelector("#bdContentMsg");
    var btnSave   = ov.querySelector("#bdContentSave");
    var btnCancel = ov.querySelector("#bdContentCancel");
    var statusEl  = ov.querySelector("#bdMusicStatus");
    var pickBtn   = ov.querySelector("#bdMusicPickBtn");
    var deleteBtn = ov.querySelector("#bdMusicDeleteBtn");
    var fileInput = ov.querySelector("#bdMusicFileInput");
    var volInput  = ov.querySelector("#bdMusicVolume");
    var volLabel  = ov.querySelector("#bdMusicVolLabel");

    ta.value = _lyricsState.raw || "";
    volInput.value = Math.round((_musicState.volume || 0.4) * 100);
    volLabel.textContent = volInput.value + "%";

    function _updateLyricsPreview() {
      var raw = String(ta.value || "").trim();
      if (!raw) {
        prev.textContent = "- Trong: se hien countdown khoa Checklist -";
        return;
      }
      var parts = raw.split(/[.\u3002]/);
      var arr = [];
      for (var i = 0; i < parts.length; i++) {
        var t = parts[i].trim();
        if (t.length > 0) arr.push(t);
      }
      if (arr.length === 0) {
        prev.textContent = "- Trong -";
        return;
      }
      var sample = arr[0];
      prev.textContent = arr.length + " cau - VD: \"" + sample.slice(0, 40) + (sample.length > 40 ? "..." : "") + "\"";
    }
    function _updateMusicStatus() {
      if (_musicState.url) {
        var match = _musicState.url.match(/site-audio\/([^?]+)/);
        var name = match ? match[1] : "bgm";
        statusEl.innerHTML = "Dang dung: <b>" + _esc(name) + "</b>";
        statusEl.style.color = "#4fa370";
        deleteBtn.disabled = false;
      } else {
        statusEl.textContent = "- Chua co nhac -";
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

    pickBtn.onclick = function () { fileInput.click(); };

    fileInput.onchange = function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      pickBtn.disabled = true;
      pickBtn.textContent = "Dang upload...";
      msg.textContent = "";

      _uploadMusicFile(f).then(function () {
        _updateMusicStatus();
        msg.textContent = "Upload nhac thanh cong";
        msg.style.color = "#4fa370";
      }).catch(function (e) {
        msg.textContent = "Loi: " + (e && e.message ? e.message : "Upload loi");
        msg.style.color = "#e74c3c";
      }).then(function () {
        pickBtn.disabled = false;
        pickBtn.textContent = "Chon file nhac";
        fileInput.value = "";
      });
    };

    deleteBtn.onclick = function () {
      if (!confirm("Xoa nhac nen?")) return;
      deleteBtn.disabled = true;
      deleteBtn.textContent = "...";
      msg.textContent = "";

      _deleteMusic().then(function () {
        _updateMusicStatus();
        msg.textContent = "Da xoa nhac";
        msg.style.color = "#4fa370";
      }).catch(function (e) {
        msg.textContent = "Loi: " + (e && e.message ? e.message : "Loi xoa");
        msg.style.color = "#e74c3c";
      }).then(function () {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Xoa";
      });
    };

    btnCancel.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnSave.onclick = function () {
      var raw = String(ta.value || "").trim();
      var vol = Math.max(0, Math.min(1, parseInt(volInput.value, 10) / 100));

      btnSave.disabled = true;
      btnSave.textContent = "Dang luu...";
      msg.textContent = "";

      var backupRaw = _lyricsState.raw;
      var backupVol = _musicState.volume;
      _lyricsState.raw = raw;
      _musicState.volume = vol;

      _saveLyricsToServer().then(function () {
        _saveLyricsCache();
        if (_musicState.url) {
          return _saveMusicToServer().then(function () { _saveMusicCache(); });
        }
      }).then(function () {
        _dispatch("bdLyricsChanged");
        _dispatch("bdMusicChanged");
        msg.textContent = raw ? "Da luu loi bai hat" : "Da tat lyrics";
        msg.style.color = "#4fa370";
        setTimeout(function () { ov.remove(); }, 700);
      }).catch(function (e) {
        _lyricsState.raw = backupRaw;
        _musicState.volume = backupVol;
        msg.textContent = "Loi: " + (e && e.message ? e.message : "Khong luu duoc");
        msg.style.color = "#e74c3c";
        btnSave.disabled = false;
        btnSave.textContent = "Luu";
      });
    };
  }

  // =========================================================
  // DIALOG - Title
  // =========================================================
  function _openTitleEditor() {
    if (!_isAdmin()) return;
    _closeOverlay("bdTitleEditorOverlay");

    var ov = document.createElement("div");
    ov.id = "bdTitleEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:20px;";

    ov.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
      '<div style="font-size:16px;font-weight:900;margin-bottom:4px;color:#333;">Sua tieu de</div>' +
      '<div style="font-size:12px;color:#888;margin-bottom:14px;">Ap dung cho tat ca - De trong ca 2 dong de an</div>' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dong 1</label>' +
      '<input id="bdTitleL1" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:12px;box-sizing:border-box;">' +
      '<label style="display:block;font-size:11px;font-weight:800;color:#666;margin-bottom:4px;">Dong 2 (co the trong)</label>' +
      '<input id="bdTitleL2" type="text" maxlength="40" style="width:100%;padding:10px 12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:16px;box-sizing:border-box;">' +
      '<div id="bdTitleMsg" style="font-size:12px;margin-bottom:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:8px;">' +
      '<button id="bdTitleCancel" type="button" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;color:#666;">Huy</button>' +
      '<button id="bdTitleSave" type="button" style="flex:1;padding:12px;border:0;background:linear-gradient(135deg,#4fa370,#3d8b5f);border-radius:10px;font-weight:900;font-size:14px;color:#fff;cursor:pointer;">Luu</button>' +
      '</div></div>';

    document.body.appendChild(ov);

    var inp1 = ov.querySelector("#bdTitleL1");
    var inp2 = ov.querySelector("#bdTitleL2");
    var msg  = ov.querySelector("#bdTitleMsg");
    var btnS = ov.querySelector("#bdTitleSave");
    var btnC = ov.querySelector("#bdTitleCancel");

    inp1.value = _titleState.line1 || "";
    inp2.value = _titleState.line2 || "";
    setTimeout(function () { inp1.focus(); inp1.select(); }, 60);

    btnC.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnS.onclick = function () {
      var l1 = inp1.value.trim();
      var l2 = inp2.value.trim();
      btnS.disabled = true;
      btnS.textContent = "Dang luu...";
      msg.textContent = "";

      var backup = { line1: _titleState.line1, line2: _titleState.line2 };
      _titleState.line1 = l1;
      _titleState.line2 = l2;

      _saveTitleToServer().then(function () {
        _saveTitleCache();
        _dispatch("bdTitleChanged");
        msg.textContent = (!l1 && !l2) ? "Da xoa tieu de" : "Da luu";
        msg.style.color = "#4fa370";
        setTimeout(function () { ov.remove(); }, 700);
      }).catch(function (e) {
        _titleState.line1 = backup.line1;
        _titleState.line2 = backup.line2;
        msg.textContent = "Loi: " + (e && e.message ? e.message : "khong luu duoc");
        msg.style.color = "#e74c3c";
        btnS.disabled = false;
        btnS.textContent = "Luu";
      });
    };
  }

  // =========================================================
  // LONG-PRESS
  // =========================================================
  function _bindLongPress(selector, callback) {
    var timer = null;
    var target = null;
    var startX = 0;
    var startY = 0;

    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (target) {
        target.style.transform = "";
        target = null;
      }
    }

    document.addEventListener("pointerdown", function (e) {
      if (!_isAdmin()) return;
      var t = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (!t) return;
      target = t;
      startX = e.clientX;
      startY = e.clientY;
      t.style.transition = "transform .15s";
      t.style.transform = "scale(0.97)";

      timer = setTimeout(function () {
        timer = null;
        if (target) {
          target.style.transform = "";
          if (navigator.vibrate) {
            try { navigator.vibrate(30); } catch (e2) {}
          }
          callback();
          target = null;
        }
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener("pointerup", cancel);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("pointermove", function (e) {
      if (!timer) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > 10) cancel();
    }, { passive: true });

    document.addEventListener("contextmenu", function (e) {
      if (!_isAdmin()) return;
      if (e.target && e.target.closest && e.target.closest(selector)) {
        e.preventDefault();
        callback();
      }
    });

    document.addEventListener("selectstart", function (e) {
      if (target && e.target && e.target.closest && e.target.closest(selector)) {
        e.preventDefault();
      }
    });
  }

  function _bindAllLongPress() {
    _bindLongPress(".landing-title.rainbow-birthday", _openTitleEditor);
    _bindLongPress(".landing-lyric, .birthday-countdown", _openContentEditor);
  }

  // =========================================================
  // HINTS
  // =========================================================
  function _showHint(key, text) {
    if (!_isAdmin()) return;
    try {
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch (e) {}
    setTimeout(function () {
      try {
        if (window.Toast && window.Toast.show) {
          window.Toast.show(text, { type: "info", duration: 3200 });
        }
      } catch (e) {}
    }, 2500);
  }

  // =========================================================
  // INIT
  // =========================================================
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
      _showHint(HINT_KEY, "Nhan giu tieu de de sua");
      _showHint(LYR_HINT_KEY, "Nhan giu countdown/lyric de them loi + nhac");
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

  // =========================================================
  // EXPOSE
  // =========================================================
  window.__bdTitle = {
    getHTML: getTitleHTML,
    getLines: function () {
      return { line1: _titleState.line1 || "", line2: _titleState.line2 || "" };
    },
    openTitleEditor: _openTitleEditor,
    getLyricsRaw: getLyricsRaw,
    getLyricsPhrases: getLyricsPhrases,
    openLyricsEditor: _openContentEditor,
    getMusic: getMusic,
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

  console.log("[bdTitle] ready v1.7 (ultra-safe ES5)");
})();