/* =========================================================
   SERVICE WORKER — Đảo Mèo / S Rank
   Version: v1.6 — Thêm 4 file view modules mới vào precache
   ---------------------------------------------------------
   v1.6 CHANGES:
   - Thêm 4 file mới vào PRECACHE_URLS:
       • /js/role.js            (single source of truth phân quyền)
       • /js/landing.js         (view module: landing page)
       • /js/admin.js           (view module: admin panel)
       • /js/checklist-view.js  (view module: checklist + checkin)
   - Bump SW_VERSION → v1.6 force update cache cũ
   v1.5 CHANGES:
   - KHÔNG precache /js/config.js (chứa SUPABASE_KEY)
   - Thêm NETWORK_FIRST_PATHS — luôn fetch network trước
   - Thêm strategy networkFirstNoCache() cho file critical
   ========================================================= */
"use strict";

const SW_VERSION = "v1.6";
const CACHE_NAME = `srank-cache-${SW_VERSION}`;
const RUNTIME_CACHE = `srank-runtime-${SW_VERSION}`;

// Danh sách asset cần precache khi cài SW lần đầu
// ⚠️ v1.5: KHÔNG precache /js/config.js — file này chứa SUPABASE_KEY,
// cần network-first (NETWORK_FIRST_PATHS bên dưới) để tránh
// dùng key cũ sau khi admin rotate key ở Supabase Dashboard.
//
// ⚠️ v1.6: Bổ sung 4 view modules mới (role/landing/admin/checklist-view)
// được tách ra trong Task 2 refactor.
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",

  "/css/main.css",
  "/css/menu.css",

  // "/js/config.js",           ← KHÔNG precache (network-first, xem v1.5)
  "/js/role.js",                 // 🆕 v1.6
  "/js/toast.js",
  "/js/admin-session.js",
  "/js/store.js",
  "/js/scheduler.js",
  "/js/supabase-adapter.js",
  "/js/display-name.js",
  "/js/auth.js",
  "/js/main.js",
  "/js/landing.js",              // 🆕 v1.6
  "/js/admin.js",                // 🆕 v1.6
  "/js/checklist-view.js",       // 🆕 v1.6
  "/js/cta-morph.js",
  "/js/auth-ui.js",
  "/js/avatar-upload.js",
  "/js/checklist-ui.js",
  "/js/checklist-bridge.js",
  "/js/attendance.js",
  "/js/attendance-top3.js",
  "/js/realtime.js",
  "/js/menu.js"
];

// CDN ngoài — có thể cache runtime (không bắt buộc precache)
const CDN_HOSTS = [
  "cdn.jsdelivr.net"
];

// ✅ v1.5: Path KHÔNG bao giờ dùng precache/SWR — luôn network-first
// với fallback cache khi offline. Áp dụng cho file chứa secrets
// có thể rotate (config.js → SUPABASE_KEY).
const NETWORK_FIRST_PATHS = [
  "/js/config.js"
];

// =========================================================
// INSTALL — precache app shell
// =========================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? PRECACHE_URLS[i] : null))
        .filter(Boolean);
      if (failed.length) {
        console.warn("[SW] Precache thất bại một số URL:", failed);
      }
      await self.skipWaiting();
    })()
  );
});

// =========================================================
// ACTIVATE — dọn cache cũ + nhận diện client
// =========================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );

      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch (_) {}
      }

      await self.clients.claim();
    })()
  );
});

// =========================================================
// HELPERS
// =========================================================
function isCdnRequest(url) {
  return CDN_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h));
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHtmlRequest(request, url) {
  if (request.mode === "navigate") return true;
  if (request.destination === "document") return true;
  if (url.pathname === "/" || url.pathname.endsWith(".html")) return true;
  return false;
}

function isStaticAsset(request) {
  const d = request.destination;
  return d === "style" || d === "script" || d === "image" ||
         d === "font" || d === "manifest" || d === "worker";
}

// ✅ v1.5: Check xem request có thuộc danh sách network-first
// (chứa secrets, không được dùng stale cache)
function isNetworkFirstPath(url) {
  return isSameOrigin(url) && NETWORK_FIRST_PATHS.indexOf(url.pathname) >= 0;
}

async function trimRuntimeCache(maxEntries = 60) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const excess = keys.length - maxEntries;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  } catch (_) {}
}

// =========================================================
// FETCH — chiến lược theo loại request
// =========================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // ✅ v1.5: Ưu tiên cao nhất — network-first cho file critical
  // (config.js chứa SUPABASE_KEY, cần fresh để hỗ trợ key rotation)
  if (isNetworkFirstPath(url)) {
    event.respondWith(networkFirstNoCache(request));
    return;
  }

  // 1) HTML navigation → network-first
  if (isHtmlRequest(request, url)) {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  // 2) CDN → stale-while-revalidate
  if (isCdnRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // 3) Static assets cùng origin → stale-while-revalidate
  if (isSameOrigin(url) && isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // 4) Mặc định → network-first (bao gồm Supabase, API khác)
  event.respondWith(networkFirstGeneric(request));
});

// =========================================================
// STRATEGIES
// =========================================================

// ✅ v1.5: Network-first KHÔNG stale — dùng cho file chứa secrets.
// - Luôn fetch network trước (bỏ qua HTTP cache bằng cache: "no-store"
//   ở phía caller — SW chỉ intercept, không bypass).
// - Khi thành công → cập nhật cache để làm fallback offline.
// - Khi fail (offline) → trả cache cũ (tốt hơn crash app).
// - Khi không có cache → trả 503 để app xử lý gracefully.
async function networkFirstNoCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try { cache.put(request, fresh.clone()); } catch (_) {}
    }
    return fresh;
  } catch (_) {
    // Offline fallback — tìm trong tất cả caches (SW scope)
    try {
      const cached = await caches.match(request);
      if (cached) return cached;
    } catch (_) {}

    // Không có cache → trả JS rỗng + log để app không crash cứng
    console.warn("[SW] config.js offline và chưa cache — app có thể lỗi");
    return new Response(
      'console.error("[SW] config.js unavailable offline");' +
      'window.__SRANK_CONFIG = window.__SRANK_CONFIG || null;',
      {
        status: 503,
        statusText: "Offline — config.js not cached",
        headers: { "Content-Type": "application/javascript; charset=utf-8" }
      }
    );
  }
}

async function networkFirstHtml(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.type !== "opaqueredirect") {
      try {
        cache.put(request, fresh.clone());
        const url = new URL(request.url);
        if (url.pathname === "/" || url.pathname === "/index.html") {
          cache.put("/index.html", fresh.clone());
        }
      } catch (_) {}
    }
    return fresh;
  } catch (_) {
    const cached =
      (await cache.match(request)) ||
      (await cache.match("/index.html")) ||
      (await cache.match("/"));
    if (cached) return cached;
    return new Response(
      `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;background:#f3f7f1;color:#284b3a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}div{max-width:320px}h1{font-size:22px;margin:0 0 8px}p{margin:0;color:#6f8579;font-size:14px;line-height:1.5}</style></head><body><div><h1>📡 Không có kết nối</h1><p>Vui lòng kiểm tra mạng và thử lại.</p></div></body></html>`,
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

async function networkFirstGeneric(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try { cache.put(request, fresh.clone()); } catch (_) {}
    }
    return fresh;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const runtime = await caches.open(RUNTIME_CACHE);
    const cachedRuntime = await runtime.match(request);
    if (cachedRuntime) return cachedRuntime;
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        try { cache.put(request, response.clone()); } catch (_) {}
        if (cacheName === RUNTIME_CACHE) trimRuntimeCache();
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response("", { status: 504 });
}

// =========================================================
// MESSAGE — cho phép client force update / skip waiting
// =========================================================
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (data.type === "CLEAR_CACHES") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        event.source?.postMessage?.({ type: "CACHES_CLEARED" });
      })()
    );
  }
  if (data.type === "GET_VERSION") {
    event.source?.postMessage?.({ type: "VERSION", version: SW_VERSION });
  }
});

// =========================================================
// NOTIFICATION CLICK — focus vào app
// =========================================================
self.addEventListener("notificationclick", (event) => {
  event.notification?.close?.();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      for (const client of allClients) {
        if ("focus" in client) {
          try { await client.focus(); return; } catch (_) {}
        }
      }
      if (self.clients.openWindow) {
        try { await self.clients.openWindow("/"); } catch (_) {}
      }
    })()
  );
});
