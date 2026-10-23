/* =========================================================
   CONTENT EDITOR - v2.0
   ---------------------------------------------------------
   Pure ES5 + ASCII-safe (no unicode outside string literals)
   - Title (admin long-press)
   - Lyrics (split by '.', admin long-press)
   - Music (upload mp3/m4a/mp4, magic-byte sniffing)
   - Retry + timeout + optimistic UI
   ========================================================= */
(function () {
  "use strict";
  if (window.__bdTitle) return;

  // ---- BUILD CANARY (verify which version is actually loaded) ----
  window.__bdTitleBuild = "v2.0.0";
  console.log("[bdTitle] BUILD=" + window.__bdTitleBuild);

  // ---- CONSTANTS ----
  var CACHE_TITLE = "srank_ct_v3";
  var CACHE_LYR   = "srank_cl_v3";
  var CACHE_MUSIC = "srank_cm_v3";

  var KEY_TITLE   = "site_title";
  var KEY_LYR     = "site_lyrics";
  var KEY_MUSIC   = "site_music";

  var HINT_TITLE  = "srank_h_t_v3";
  var HINT_LYR    = "srank_h_l_v3";

  var RPC_GET     = "rpc_get_site_setting";
  var RPC_SET     = "rpc_set_site_setting";

  var LONG_PRESS_MS = 650;
  var MAX_AUDIO   = 8  * 1024 * 1024;
  var MAX_VIDEO   = 15 * 1024 * 1024;
  var FETCH_TIMEOUT = 20000;
  var RPC_TIMEOUT   = 15000;

  // ---- STATE ----
  var state = {
    title:  { line1: "", line2: "" },
    lyrics: { raw: "" },
    music:  { url: "", volume: 0.4, updatedAt: 0 }
  };

  // ---- SAFE HELPERS ----
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function emit(name) {
    try { window.dispatchEvent(new Event(name)); } catch (e) {}
  }

  function safeParse(s, fallback) {
    if (s == null) return fallback;
    try {
      var v = JSON.parse(s);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("Timeout: " + (label || "op") + " (" + (ms / 1000) + "s)"));
      }, ms);
      promise.then(
        function (v) { clearTimeout(timer); resolve(v); },
        function (e) { clearTimeout(timer); reject(e); }
      );
    });
  }

  function withRetry(fn, maxAttempts, label) {
    return new Promise(function (resolve, reject) {
      function attempt(n) {
        fn().then(resolve, function (err) {
          if (n >= maxAttempts) {
            reject(err);
            return;
          }
          var delay = Math.min(4000, 500 * Math.pow(2, n));
          console.warn("[bdTitle] retry " + (label || "") + " " + n + "/" + maxAttempts + " sau " + delay + "ms");
          setTimeout(function () { attempt(n + 1); }, delay);
        });
      }
      attempt(1);
    });
  }

  // ---- TITLE API ----
  function getTitleHTML() {
    var h = "";
    var l1 = String(state.title.line1 || "").trim();
    var l2 = String(state.title.line2 || "").trim();
    if (l1) h += '<span class="rainbow-line">' + esc(l1) + "</span>";
    if (l2) h += '<span class="rainbow-line">' + esc(l2) + "</span>";
    return h;
  }

  function loadTitleCache() {
    var o = safeParse(localStorage.getItem(CACHE_TITLE), null);
    if (!o || typeof o.line1 !== "string") return false;
    state.title.line1 = o.line1;
    state.title.line2 = typeof o.line2 === "string" ? o.line2 : "";
    return true;
  }

  function saveTitleCache() {
    try {
      localStorage.setItem(CACHE_TITLE, JSON.stringify({
        line1: state.title.line1,
        line2: state.title.line2
      }));
    } catch (e) {}
  }

  function loadTitleFromServer() {
    return rpcLoad(KEY_TITLE, function (o) {
      if (!o || typeof o.line1 !== "string") return false;
      var n1 = o.line1;
      var n2 = typeof o.line2 === "string" ? o.line2 : "";
      var changed = (n1 !== state.title.line1) || (n2 !== state.title.line2);
      state.title.line1 = n1;
      state.title.line2 = n2;
      saveTitleCache();
      return changed;
    });
  }

  function saveTitleToServer() {
    return rpcSave(KEY_TITLE, JSON.stringify({
      line1: String(state.title.line1 || "").trim(),
      line2: String(state.title.line2 || "").trim()
    }));
  }

  // ---- LYRICS API ----
  function getLyricsRaw() { return String(state.lyrics.raw || ""); }

  function getLyricsPhrases() {
    var raw = String(state.lyrics.raw || "").trim();
    if (!raw) return [];
    // Split by period or fullwidth ideographic full stop U+3002
    var parts = raw.split(/[.\u3002]/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (t.length > 0) out.push(t);
    }
    return out;
  }

  function loadLyricsCache() {
    var o = safeParse(localStorage.getItem(CACHE_LYR), null);
    if (!o || typeof o.raw !== "string") return false;
    state.lyrics.raw = o.raw;
    return true;
  }

  function saveLyricsCache() {
    try {
      localStorage.setItem(CACHE_LYR, JSON.stringify({ raw: state.lyrics.raw }));
    } catch (e) {}
  }

  function loadLyricsFromServer() {
    return rpcLoad(KEY_LYR, function (o) {
      if (!o || typeof o.raw !== "string") return false;
      var changed = o.raw !== state.lyrics.raw;
      state.lyrics.raw = o.raw;
      saveLyricsCache();
      return changed;
    });
  }

  function saveLyricsToServer() {
    return rpcSave(KEY_LYR, JSON.stringify({ raw: String(state.lyrics.raw || "").trim() }));
  }

  // ---- MUSIC API ----
  function getMusic() {
    return {
      url: String(state.music.url || ""),
      volume: Number(state.music.volume) || 0.4,
      updatedAt: Number(state.music.updatedAt) || 0
    };
  }

  function loadMusicCache() {
    var o = safeParse(localStorage.getItem(CACHE_MUSIC), null);
    if (!o || typeof o.url !== "string") return false;
    state.music.url = o.url;
    state.music.volume = Number(o.volume) || 0.4;
    state.music.updatedAt = Number(o.updatedAt) || 0;
    return true;
  }

  function saveMusicCache() {
    try {
      localStorage.setItem(CACHE_MUSIC, JSON.stringify({
        url: state.music.url,
        volume: state.music.volume,
        updatedAt: state.music.updatedAt
      }));
    } catch (e) {}
  }

  function loadMusicFromServer() {
    return rpcLoad(KEY_MUSIC, function (o) {
      if (!o || typeof o.url !== "string") return false;
      var nu = o.url;
      var nv = Number(o.volume) || 0.4;
      var nt = Number(o.updatedAt) || 0;
      var changed = (nu !== state.music.url) || (nv !== state.music.volume) || (nt !== state.music.updatedAt);
      state.music.url = nu;
      state.music.volume = nv;
      state.music.updatedAt = nt;
      saveMusicCache();
      return changed;
    });
  }

  function saveMusicToServer() {
    return rpcSave(KEY_MUSIC, JSON.stringify({
      url: state.music.url,
      volume: state.music.volume,
      updatedAt: state.music.updatedAt
    }));
  }

  // ---- SUPABASE BASICS ----
  function getBaseUrl() {
    var sb = window.__sb;
    if (sb && sb.supabaseUrl) return String(sb.supabaseUrl).replace(/\/+$/, "");
    if (sb && sb.restUrl) return String(sb.restUrl).replace(/\/rest\/v1\/?$/, "");
    return "https://tumjcsaexddioecwjolp.supabase.co";
  }

  function getAccessToken() {
    return new Promise(function (resolve) {
      var sb = window.__sb;
      if (!sb || !sb.auth || typeof sb.auth.getSession !== "function") return resolve("");
      withTimeout(sb.auth.getSession(), 5000, "auth.getSession")
        .then(function (r) {
          resolve((r && r.data && r.data.session && r.data.session.access_token) || "");
        })
        .catch(function () { resolve(""); });
    });
  }

  // ---- RPC ----
  function rpcLoad(key, applyFn) {
    var sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") return Promise.resolve(false);
    return withTimeout(sb.rpc(RPC_GET, { p_key: key }), RPC_TIMEOUT, "rpc_get:" + key)
      .then(function (res) {
        if (!res || res.error) {
          console.warn("[bdTitle] rpc_get " + key + " failed:", res && res.error && (res.error.message || res.error));
          return false;
        }
        if (!res.data) return false;
        var o = typeof res.data === "string" ? safeParse(res.data, null) : res.data;
        if (!o) return false;
        return applyFn(o);
      })
      .catch(function (e) {
        console.warn("[bdTitle] rpc_get " + key + " error:", e.message || e);
        return false;
      });
  }

  function rpcSave(key, value) {
    var sb = window.__sb;
    if (!sb || typeof sb.rpc !== "function") {
      return Promise.reject(new Error("Khong co ket noi server"));
    }
    return withTimeout(sb.rpc(RPC_SET, { p_key: key, p_value: value }), RPC_TIMEOUT, "rpc_set:" + key)
      .then(function (res) {
        if (!res || res.error) {
          throw new Error((res && res.error && res.error.message) || "Server tu choi");
        }
        return true;
      });
  }

  // ---- FILE TYPE SNIFFING (magic bytes) ----
  function sniffFileType(file) {
    return new Promise(function (resolve) {
      try {
        var blob = file.slice(0, 12);
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var buf = e.target.result;
            var u = new Uint8Array(buf);
            // MP3: ID3 tag ("ID3")
            if (u[0] === 0x49 && u[1] === 0x44 && u[2] === 0x33) return resolve("audio/mpeg");
            // MP3: MPEG frame sync (0xFF 0xE0..)
            if (u[0] === 0xFF && (u[1] & 0xE0) === 0xE0) return resolve("audio/mpeg");
            // MP4/M4A: "ftyp" at byte 4
            if (u[4] === 0x66 && u[5] === 0x74 && u[6] === 0x79 && u[7] === 0x70) {
              var brand = String.fromCharCode(u[8], u[9], u[10], u[11]);
              if (brand.indexOf("M4A") === 0 || brand.indexOf("M4B") === 0) return resolve("audio/mp4");
              if (brand.indexOf("mp42") === 0 || brand.indexOf("isom") === 0 || brand.indexOf("mp41") === 0) return resolve("video/mp4");
              return resolve("audio/mp4");
            }
            // OGG: "OggS"
            if (u[0] === 0x4F && u[1] === 0x67 && u[2] === 0x67 && u[3] === 0x53) return resolve("audio/ogg");
            // WAV: "RIFF"
            if (u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46) return resolve("audio/wav");
            // FLAC: "fLaC"
            if (u[0] === 0x66 && u[1] === 0x4C && u[2] === 0x61 && u[3] === 0x43) return resolve("audio/flac");
            // WEBM/MKV: 0x1A45DFA3
            if (u[0] === 0x1A && u[1] === 0x45 && u[2] === 0xDF && u[3] === 0xA3) return resolve("video/webm");
            return resolve(null);
          } catch (err) { resolve(null); }
        };
        reader.onerror = function () { resolve(null); };
        reader.readAsArrayBuffer(blob);
      } catch (e) { resolve(null); }
    });
  }

  function resolveFileInfo(file) {
    var name = String(file.name || "").toLowerCase();
    var extMatch = name.match(/\.(mp3|m4a|aac|ogg|wav|flac|opus|mp4|mov|webm|mkv|m4v)$/);
    var ext = extMatch ? extMatch[1] : "";

    return sniffFileType(file).then(function (sniffed) {
      var mime = sniffed || String(file.type || "").toLowerCase();
      // Normalize
      if (!mime) {
        if (ext === "mp3") mime = "audio/mpeg";
        else if (ext === "m4a") mime = "audio/mp4";
        else if (ext === "mp4" || ext === "m4v") mime = "video/mp4";
        else if (ext === "mov") mime = "video/quicktime";
        else if (ext === "webm") mime = "video/webm";
        else if (ext === "ogg" || ext === "opus") mime = "audio/ogg";
        else if (ext === "wav") mime = "audio/wav";
        else if (ext === "flac") mime = "audio/flac";
      }
      // Preferred extension for storage
      var saveExt = ext;
      if (!saveExt) {
        if (mime.indexOf("audio/mpeg") === 0) saveExt = "mp3";
        else if (mime.indexOf("audio/mp4") === 0 || mime.indexOf("audio/m4a") === 0) saveExt = "m4a";
        else if (mime.indexOf("video/mp4") === 0) saveExt = "mp4";
        else if (mime.indexOf("video/quicktime") === 0) saveExt = "mov";
        else if (mime.indexOf("video/webm") === 0) saveExt = "webm";
        else if (mime.indexOf("audio/ogg") === 0) saveExt = "ogg";
        else if (mime.indexOf("audio/wav") === 0) saveExt = "wav";
        else if (mime.indexOf("audio/flac") === 0) saveExt = "flac";
        else saveExt = "bin";
      }
      return {
        mime: mime,
        ext: saveExt,
        isVideo: mime.indexOf("video/") === 0,
        size: file.size
      };
    });
  }

  // ---- UPLOAD ----
  function uploadMusic(file) {
    if (!file) return Promise.reject(new Error("Chua chon file"));

    return resolveFileInfo(file).then(function (info) {
      console.log("[bdTitle] file info:", {
        name: file.name, mimeOriginal: file.type, mimeSniffed: info.mime,
        ext: info.ext, size: info.size, isVideo: info.isVideo
      });

      var isAudio = info.mime.indexOf("audio/") === 0;
      var isVideo = info.mime.indexOf("video/") === 0;
      if (!isAudio && !isVideo) {
        throw new Error("File khong phai audio/video hop le");
      }

      var limit = info.isVideo ? MAX_VIDEO : MAX_AUDIO;
      if (info.size > limit) {
        throw new Error("File qua lon (" + Math.round(info.size / 1024 / 1024) + "MB > " + Math.round(limit / 1024 / 1024) + "MB)");
      }

      var path = "bgm." + info.ext;

      return getAccessToken().then(function (token) {
        if (!token) throw new Error("Chua dang nhap");

        var url = getBaseUrl() + "/storage/v1/object/site-audio/" + path;
        return withTimeout(
          fetch(url, {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + token,
              "x-upsert": "true",
              "Content-Type": info.mime,
              "Cache-Control": "3600"
            },
            body: file
          }),
          FETCH_TIMEOUT,
          "upload"
        ).then(function (res) {
          if (res.ok) return true;
          return res.text().then(function (t) {
            throw new Error("Upload loi " + res.status + (t ? ": " + t.slice(0, 150) : ""));
          });
        }).then(function () {
          var ts = Date.now();
          var publicUrl = getBaseUrl() + "/storage/v1/object/public/site-audio/" + path + "?t=" + ts;
          state.music.url = publicUrl;
          state.music.updatedAt = ts;
          return saveMusicToServer();
        }).then(function () {
          saveMusicCache();
          emit("bdMusicChanged");
          return state.music.url;
        });
      });
    });
  }

  function deleteMusic() {
    return getAccessToken().then(function (token) {
      if (token && state.music.url) {
        var m = state.music.url.match(/site-audio\/([^?]+)/);
        var path = m ? m[1] : "bgm.mp3";
        return withTimeout(
          fetch(getBaseUrl() + "/storage/v1/object/site-audio/" + path, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
          }),
          10000,
          "delete"
        ).catch(function () {});
      }
    }).then(function () {
      state.music.url = "";
      state.music.updatedAt = Date.now();
      return saveMusicToServer();
    }).then(function () {
      saveMusicCache();
      emit("bdMusicChanged");
    });
  }

  // ---- ADMIN ----
  function isAdmin() {
    try {
      var u = null;
      if (window.SRank && window.SRank.Auth && window.SRank.Auth.getCurrentUser) {
        u = window.SRank.Auth.getCurrentUser();
      }
      if (!u) return false;
      if (window.Role && typeof window.Role.isAdmin === "function") {
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
      return un === "minhquan" || un === "admin";
    } catch (e) { return false; }
  }

  // ---- CLOSE OVERLAY ----
  function closeOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  // ---- CONTENT EDITOR DIALOG ----
  function openContentEditor() {
    if (!isAdmin()) return;
    closeOverlay("bdContentEditorOverlay");

    var ov = document.createElement("div");
    ov.id = "bdContentEditorOverlay";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);" +
      "backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);" +
      "display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;";

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
      '<div style="font-size:11px;color:#888;margin-bottom:6px;">Ho tro MP3, M4A, MP4, MOV, OGG, WAV... Toi da 8MB (audio) / 15MB (video)</div>' +
      '<div id="bdMusicStatus" style="font-size:11px;color:#666;margin-bottom:8px;padding:8px 10px;' +
      'background:#f5f7fa;border-radius:6px;word-break:break-all;"></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
      '<button id="bdMusicPickBtn" type="button" style="flex:1;padding:10px;border:2px dashed #b0d0c0;' +
      'background:#f0f9f4;border-radius:8px;font-weight:800;font-size:13px;color:#4fa370;cursor:pointer;">Chon file nhac</button>' +
      '<button id="bdMusicDeleteBtn" type="button" style="padding:10px 14px;border:2px solid #e74c3c;' +
      'background:#fff;border-radius:8px;font-weight:800;font-size:13px;color:#e74c3c;cursor:pointer;">Xoa</button>' +
      '</div>' +
      '<input type="file" id="bdMusicFileInput" ' +
      'accept=".mp3,.m4a,.aac,.ogg,.wav,.flac,.opus,.mp4,.mov,.webm,.mkv,.m4v,audio/*,video/*" hidden>' +

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

    ta.value = state.lyrics.raw || "";
    volInput.value = Math.round((state.music.volume || 0.4) * 100);
    volLabel.textContent = volInput.value + "%";

    function updateLyricsPreview() {
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
    function updateMusicStatus() {
      if (state.music.url) {
        var m = state.music.url.match(/site-audio\/([^?]+)/);
        var n = m ? m[1] : "bgm";
        statusEl.innerHTML = "Dang dung: <b>" + esc(n) + "</b>";
        statusEl.style.color = "#4fa370";
        deleteBtn.disabled = false;
      } else {
        statusEl.textContent = "- Chua co nhac -";
        statusEl.style.color = "#888";
        deleteBtn.disabled = true;
      }
    }

    ta.addEventListener("input", updateLyricsPreview);
    updateLyricsPreview();
    updateMusicStatus();

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
      msg.style.color = "#666";

      withRetry(function () { return uploadMusic(f); }, 2, "upload")
        .then(function () {
          updateMusicStatus();
          msg.textContent = "Upload nhac thanh cong";
          msg.style.color = "#4fa370";
        })
        .catch(function (e) {
          msg.textContent = "Loi: " + (e && e.message ? e.message : "Upload loi");
          msg.style.color = "#e74c3c";
        })
        .then(function () {
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

      deleteMusic()
        .then(function () {
          updateMusicStatus();
          msg.textContent = "Da xoa nhac";
          msg.style.color = "#4fa370";
        })
        .catch(function (e) {
          msg.textContent = "Loi: " + (e && e.message ? e.message : "Loi xoa");
          msg.style.color = "#e74c3c";
        })
        .then(function () {
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

      var backupRaw = state.lyrics.raw;
      var backupVol = state.music.volume;
      state.lyrics.raw = raw;
      state.music.volume = vol;

      saveLyricsToServer()
        .then(function () {
          saveLyricsCache();
          if (state.music.url) {
            return saveMusicToServer().then(saveMusicCache);
          }
        })
        .then(function () {
          emit("bdLyricsChanged");
          emit("bdMusicChanged");
          msg.textContent = raw ? "Da luu loi bai hat" : "Da tat lyrics";
          msg.style.color = "#4fa370";
          setTimeout(function () { ov.remove(); }, 700);
        })
        .catch(function (e) {
          state.lyrics.raw = backupRaw;
          state.music.volume = backupVol;
          msg.textContent = "Loi: " + (e && e.message ? e.message : "Khong luu duoc");
          msg.style.color = "#e74c3c";
          btnSave.disabled = false;
          btnSave.textContent = "Luu";
        });
    };
  }

  // ---- TITLE EDITOR DIALOG ----
  function openTitleEditor() {
    if (!isAdmin()) return;
    closeOverlay("bdTitleEditorOverlay");

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

    inp1.value = state.title.line1 || "";
    inp2.value = state.title.line2 || "";
    setTimeout(function () { inp1.focus(); inp1.select(); }, 60);

    btnC.onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };

    btnS.onclick = function () {
      var l1 = inp1.value.trim();
      var l2 = inp2.value.trim();
      btnS.disabled = true;
      btnS.textContent = "Dang luu...";
      msg.textContent = "";

      var backup = { line1: state.title.line1, line2: state.title.line2 };
      state.title.line1 = l1;
      state.title.line2 = l2;

      saveTitleToServer()
        .then(function () {
          saveTitleCache();
          emit("bdTitleChanged");
          msg.textContent = (!l1 && !l2) ? "Da xoa tieu de" : "Da luu";
          msg.style.color = "#4fa370";
          setTimeout(function () { ov.remove(); }, 700);
        })
        .catch(function (e) {
          state.title.line1 = backup.line1;
          state.title.line2 = backup.line2;
          msg.textContent = "Loi: " + (e && e.message ? e.message : "khong luu duoc");
          msg.style.color = "#e74c3c";
          btnS.disabled = false;
          btnS.textContent = "Luu";
        });
    };
  }

  // ---- LONG-PRESS ----
  function bindLongPress(selector, callback) {
    var timer = null, target = null, sx = 0, sy = 0;

    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (target) { target.style.transform = ""; target = null; }
    }

    document.addEventListener("pointerdown", function (e) {
      if (!isAdmin()) return;
      var t = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (!t) return;
      target = t;
      sx = e.clientX;
      sy = e.clientY;
      t.style.transition = "transform .15s";
      t.style.transform = "scale(0.97)";
      timer = setTimeout(function () {
        timer = null;
        if (target) {
          target.style.transform = "";
          if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e2) {} }
          callback();
          target = null;
        }
      }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener("pointerup", cancel);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("pointermove", function (e) {
      if (!timer) return;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (Math.sqrt(dx * dx + dy * dy) > 10) cancel();
    }, { passive: true });

    document.addEventListener("contextmenu", function (e) {
      if (!isAdmin()) return;
      if (e.target && e.target.closest && e.target.closest(selector)) {
        e.preventDefault();
        callback();
      }
    });
  }

  function bindAllLongPress() {
    bindLongPress(".landing-title.rainbow-birthday", openTitleEditor);
    bindLongPress(".landing-lyric, .birthday-countdown", openContentEditor);
  }

  // ---- HINT ----
  function showHint(key, text) {
    if (!isAdmin()) return;
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

  // ---- SELF TEST ----
  window.__bdTitleSelfTest = function () {
    console.log("=== bdTitle SELF TEST ===");
    console.log("build:", window.__bdTitleBuild);
    console.log("isAdmin:", isAdmin());
    console.log("title:", state.title);
    console.log("lyrics:", getLyricsPhrases().length, "cau");
    console.log("music:", state.music);
    console.log("sb.rpc:", typeof (window.__sb && window.__sb.rpc));
    console.log("sb.auth:", typeof (window.__sb && window.__sb.auth));
    console.log("=== END ===");
  };

  // ---- INIT ----
  function init() {
    loadTitleCache();
    loadLyricsCache();
    loadMusicCache();
    bindAllLongPress();

    // Fetch in background (stale-while-revalidate)
    Promise.all([
      loadTitleFromServer(),
      loadLyricsFromServer(),
      loadMusicFromServer()
    ]).then(function (r) {
      if (r[0]) emit("bdTitleChanged");
      if (r[1]) emit("bdLyricsChanged");
      if (r[2]) emit("bdMusicChanged");
      showHint(HINT_TITLE, "Nhan giu tieu de de sua");
      showHint(HINT_LYR, "Nhan giu countdown/lyric de them loi + nhac");
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      Promise.all([
        loadTitleFromServer(),
        loadLyricsFromServer(),
        loadMusicFromServer()
      ]).then(function (r) {
        if (r[0]) emit("bdTitleChanged");
        if (r[1]) emit("bdLyricsChanged");
        if (r[2]) emit("bdMusicChanged");
      });
    });
  }

  // ---- PUBLIC API ----
  window.__bdTitle = {
    getHTML: getTitleHTML,
    getLines: function () {
      return { line1: state.title.line1 || "", line2: state.title.line2 || "" };
    },
    openTitleEditor: openTitleEditor,
    getLyricsRaw: getLyricsRaw,
    getLyricsPhrases: getLyricsPhrases,
    openLyricsEditor: openContentEditor,
    getMusic: getMusic,
    isAdmin: isAdmin,
    build: window.__bdTitleBuild,
    reload: function () {
      return Promise.all([
        loadTitleFromServer(),
        loadLyricsFromServer(),
        loadMusicFromServer()
      ]).then(function (r) {
        if (r[0]) emit("bdTitleChanged");
        if (r[1]) emit("bdLyricsChanged");
        if (r[2]) emit("bdMusicChanged");
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    setTimeout(init, 0);
  }

  console.log("[bdTitle] ready " + window.__bdTitleBuild);
})();