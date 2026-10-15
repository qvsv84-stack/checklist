/* =========================================================
   ROLE — v1.0 — Single source of truth cho phân quyền
   ---------------------------------------------------------
   Load SAU config.js, TRƯỚC admin-session.js

   Mục đích: gộp logic xác định role admin/manager/KDV vào 1 chỗ,
   thay thế 3 nơi trùng lặp trước đây:
     - admin-session.js  (regex /admin|super|owner|quản|quan/i)
     - auth-ui.js        (whitelist + regex)
     - menu.js           (whitelist + regex)

   API:
     Role.isAdmin(user?)      -> boolean
     Role.get(user?)          -> { label, klass, role }
     Role.getAdminUsernames() -> string[]  (từ config.js)

   Quy tắc:
     - Exact match, KHÔNG dùng regex lỏng
       (tránh 'quantum'/'quang' match 'quan')
     - Whitelist username trong config.js được ưu tiên cao nhất
     - Nếu không truyền user → tự lấy từ SRank.Auth
   ========================================================= */
(function(){
  "use strict";
  if (window.Role) return;

  /* ✅ Exact match — KHÔNG dùng regex lỏng */
  const ADMIN_ROLES = new Set([
    'admin', 'super', 'owner', 'administrator',
    'quản', 'quản trị', 'quantri', 'quanly', 'quản lý'
  ]);
  const MANAGER_ROLES = new Set([
    'manager', 'leader', 'mod', 'moderator',
    'quản lý', 'quanly'
  ]);
  const KDV_ROLES = new Set([
    'kdv', 'kiểm duyệt', 'kiểm duyệt viên',
    'kiemduyet', 'reviewer'
  ]);

  /* ---------- Helpers ---------- */

  function getAdminUsernames(){
    try {
      const cfg = window.__SRANK_CONFIG || {};
      const list = cfg.ADMIN_USERNAMES;
      if (!Array.isArray(list)) return [];
      return list.map(function(s){ return String(s || '').trim().toLowerCase(); })
                 .filter(Boolean);
    } catch(_) {
      return [];
    }
  }

  function getUsername(user){
    if (!user) return '';
    const un = user.username || (user.email || '').split('@')[0] || '';
    return String(un).trim().toLowerCase();
  }

  function getRoleString(user){
    if (!user) return '';
    try {
      const a = user.app_metadata || {};
      const u = user.user_metadata || {};
      return String(a.role || u.role || user.role || '').trim().toLowerCase();
    } catch(_) {
      return '';
    }
  }

  function resolveUser(user){
    if (user) return user;
    try {
      return window.SRank?.Auth?.getCurrentUser?.() || null;
    } catch(_) {
      return null;
    }
  }

  /* ---------- Core API ---------- */

  /**
   * Trả về info phân quyền đầy đủ.
   * @param {Object} [user] — nếu không truyền, lấy từ SRank.Auth
   * @returns {{label:string, klass:string, role:string}}
   */
  function get(user){
    const u = resolveUser(user);
    if (!u) {
      return { label: 'Khách', klass: 'role-member', role: '' };
    }

    const role = getRoleString(u);
    const un = getUsername(u);

    /* ✅ Whitelist ưu tiên cao nhất */
    if (un && getAdminUsernames().indexOf(un) >= 0) {
      return { label: 'ADMIN', klass: 'role-admin', role: 'admin' };
    }

    if (ADMIN_ROLES.has(role)) {
      return { label: 'ADMIN', klass: 'role-admin', role: role };
    }
    if (MANAGER_ROLES.has(role)) {
      return { label: 'Quản lý', klass: 'role-manager', role: role };
    }
    if (KDV_ROLES.has(role)) {
      return { label: 'Kiểm duyệt viên', klass: 'role-kdv', role: role };
    }

    return { label: 'Thành viên', klass: 'role-member', role: role };
  }

  /**
   * Check nhanh user có phải admin không.
   * @param {Object} [user]
   * @returns {boolean}
   */
  function isAdmin(user){
    return get(user).klass === 'role-admin';
  }

  /* ---------- Export ---------- */

  window.Role = {
    // Core
    isAdmin: isAdmin,
    get: get,
    getAdminUsernames: getAdminUsernames,

    // Expose để debug / test
    ADMIN_ROLES: ADMIN_ROLES,
    MANAGER_ROLES: MANAGER_ROLES,
    KDV_ROLES: KDV_ROLES
  };

  console.log('[Role] v1.0 ready ✓ (single source of truth)');
})();
