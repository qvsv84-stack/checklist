/* =========================================================
   ADMIN VIEW — v1.0
   ---------------------------------------------------------
   Tách từ main.js (Task 2b).
   Chịu trách nhiệm toàn bộ admin panel:
     - 4 tabs: Giờ, Checklist, Stats, Users
     - Tab Giờ: reset time + lock time
     - Tab Checklist: search + filter + toggle check
     - Tab Stats: 3 cards + top3
     - Tab Users: create + toggle + delete + search

   Không sở hữu state gốc — đọc từ window.SrankCore.
   Đăng ký callbacks vào SrankCore.callbacks.

   Load order: SAU main.js (cần SrankCore)
   ========================================================= */
(function(){
  "use strict";
  if (window.AdminView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[AdminView] window.SrankCore chưa load — cần main.js load trước');
    return;
  }

  const AdminSession = window.AdminSession;
  const Toast = window.Toast;

  /* ───── Module-local state ───── */
  let _adminFilter = 'all';
  let _adminSearchTerm = '';
  let _adminUsersSearchTerm = '';
  let _adminUsersList = [];

  /* =========================================================
     TAB: CHECKLIST — render danh sách người + toggle check
     ========================================================= */
  function renderAdminChecklistEditor() {
    const els = S.els;
    if (!els.adminChecklistRows) return;
    const names = S.names;
    const checked = S.checked;
    const times = S.times;

    if (!names.length) {
      els.adminChecklistRows.innerHTML = '<div class="admin-list-empty">Chưa có danh sách kiểm duyệt viên</div>';
      if (els.adminChecklistStats) els.adminChecklistStats.innerHTML = '';
      return;
    }

    const frag = document.createDocumentFragment();
    names.forEach((name, i) => {
      const isChecked = !!checked[i];
      const time = times[i] || '';
      const row = document.createElement('div');
      row.className = 'admin-row-item' + (isChecked ? ' checked' : '');
      row.dataset.name = String(name || '').toLowerCase();
      row.dataset.checked = isChecked ? '1' : '0';

      const nameEl = document.createElement('span');
      nameEl.className = 'admin-row-name';
      nameEl.textContent = (window.DN ? window.DN(name) : name) || 'Kiểm duyệt viên ' + (i + 1);

      const timeEl = document.createElement('span');
      timeEl.className = 'admin-row-time' + (time ? '' : ' empty');
      timeEl.textContent = time || '—';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-row-btn' + (isChecked ? ' checked' : '');
      btn.textContent = isChecked ? 'Bỏ check' : 'Check';
      btn.addEventListener('click', () => adminToggleCheck(i, btn));

      row.append(nameEl, timeEl, btn);
      frag.appendChild(row);
    });
    els.adminChecklistRows.innerHTML = '';
    els.adminChecklistRows.appendChild(frag);

    const checkedCount = checked.filter(Boolean).length;
    if (els.adminChecklistStats) {
      els.adminChecklistStats.innerHTML = `<span>👥 ${names.length} người</span><span>✓ ${checkedCount} đã check</span><span>○ ${names.length - checkedCount} chưa check</span>`;
    }
    applyChecklistFilter();
  }

  async function adminToggleCheck(i, btn) {
    const names = S.names;
    const checked = S.checked;
    const next = !checked[i];
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const token = AdminSession.get();
      if (!token) throw new Error('Không có quyền admin');
      const r = await window.__srankApi('adminSetCheck', {
        token, name: names[i], checked: next ? 'true' : 'false'
      }, 8000);
      if (!r.ok) throw new Error(r.error || 'Không cập nhật được');

      checked[i] = next;
      S.times[i] = next ? (r.data && r.data.time || S.hhmm()) : '';
      if (r.data && Number.isFinite(Number(r.data.points))) {
        S.points[i] = Number(r.data.points);
        S.ranks[i] = S.normalizeServerRank(r.data.rank, S.points[i]);
      }

      S.markFresh();  // stateDay = todayKey + cacheSave
      S.callbacks.renderChecklist?.(true);
      renderAdminChecklistEditor();
      renderAdminStats();
      if (!S.els.checklistPanel?.classList.contains('show')) {
        S.callbacks.renderLanding?.();
      }
      S.setStatus(next ? 'Đã check ✓' : 'Đã bỏ check ✓');
    } catch (e) {
      const _em = (e && e.message) || 'Không cập nhật được';
      console.error('[Admin] toggle check failed:', e);
      try { Toast.show(_em, { type: 'error', duration: 4000 }); } catch (_) {}
      try {
        if (S.els.adminStatus) {
          S.els.adminStatus.textContent = _em;
          S.els.adminStatus.classList.remove('warn');
          S.els.adminStatus.classList.add('error');
        }
      } catch (_) {}
      btn.disabled = false;
      btn.textContent = checked[i] ? 'Bỏ check' : 'Check';
    }
  }

  function applyChecklistFilter() {
    const els = S.els;
    if (!els.adminChecklistRows) return;
    els.adminChecklistRows.querySelectorAll('.admin-row-item').forEach(row => {
      const name = row.dataset.name || '';
      const isChecked = row.dataset.checked === '1';
      const matchSearch = !_adminSearchTerm || name.includes(_adminSearchTerm);
      const matchFilter = _adminFilter === 'all'
        || (_adminFilter === 'checked' && isChecked)
        || (_adminFilter === 'unchecked' && !isChecked);
      row.style.display = (matchSearch && matchFilter) ? '' : 'none';
    });
  }

  /* =========================================================
     TAB: STATS
     ========================================================= */
  function renderAdminStats() {
    const els = S.els;
    const names = S.names;
    const checked = S.checked;
    const times = S.times;

    const total = names.length;
    const checkedCount = checked.filter(Boolean).length;
    if (els.adminStatTotal) els.adminStatTotal.textContent = String(total);
    if (els.adminStatChecked) els.adminStatChecked.textContent = String(checkedCount);
    if (els.adminStatUnchecked) els.adminStatUnchecked.textContent = String(total - checkedCount);

    if (els.adminStatTop3) {
      const top3 = names.map((name, i) => ({
        name: String(name || '').trim(),
        time: String(times[i] || '').trim(),
        checked: !!checked[i]
      })).filter(p => p.checked && p.time && p.name)
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 3);
      els.adminStatTop3.innerHTML = top3.length
        ? top3.map((p, i) =>
            `<div class="admin-row-item checked"><span class="admin-row-name">${['🥇', '🥈', '🥉'][i]} ${S.escapeHtml(window.DN ? window.DN(p.name) : p.name)}</span><span class="admin-row-time">${S.escapeHtml(p.time)}</span></div>`
          ).join('')
        : '<div class="admin-list-empty">Chưa có ai check hôm nay</div>';
    }
  }

  /* =========================================================
     TAB SWITCHING
     ========================================================= */
  function switchTab(tabName) {
    const els = S.els;
    els.adminTabs?.forEach(t => t.classList.toggle('active', t.dataset.adminTab === tabName));
    els.adminViews?.forEach(v => v.classList.toggle('active', v.dataset.adminView === tabName));
    if (tabName === 'checklist') renderAdminChecklistEditor();
    else if (tabName === 'stats') renderAdminStats();
    else if (tabName === 'users') renderAdminUsers();
  }

  /* =========================================================
     OPEN / CLOSE ADMIN PANEL
     ========================================================= */
  function open() {
    const els = S.els;
    if (!AdminSession.isValid()) { S.setStatus('Bạn không có quyền admin'); return; }
    S.syncQuickTools?.();
    els.adminPage.classList.add('show');
    els.adminPage.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    switchTab('schedule');

    if (S.settingsCache) {
      els.resetTimeInput.value = S.settingsCache.resetTime || S.resetTime;
      els.checklistLockTimeInput.value = S.settingsCache.checklistLockTime || S.checklistLockTime;
      els.adminStatus.textContent = `Giờ reset: ${S.resetTime} • Khoá: ${S.checklistLockTime}`;
    } else {
      els.resetTimeInput.value = S.resetTime;
      els.checklistLockTimeInput.value = S.checklistLockTime;
      els.adminStatus.textContent = 'Đang tải cài đặt…';
    }
    els.adminStatus.classList.remove('error', 'warn');
    renderAdminChecklistEditor();
    renderAdminStats();
    renderAdminUsers();

    S.getSettingsCached(false).then(s => {
      if (!s) return;
      S.resetTime = s.resetTime || S.resetTime;
      els.resetTimeInput.value = S.resetTime;
      if (S.isValid24hTime(s.checklistLockTime)) {
        S.checklistLockTime = s.checklistLockTime;
        S.saveChecklistLockTime(S.checklistLockTime);
      }
      els.checklistLockTimeInput.value = S.checklistLockTime;
      els.adminStatus.textContent = `Giờ reset: ${S.resetTime} • Khoá: ${S.checklistLockTime}`;
      els.adminStatus.classList.remove('error', 'warn');
    }).catch(() => {
      els.adminStatus.textContent = 'Không tải được cài đặt mới. Đang dùng giá trị trên máy.';
      els.adminStatus.classList.remove('error');
      els.adminStatus.classList.add('warn');
    });
  }

  function close() {
    const els = S.els;
    els.adminPage.classList.remove('show');
    els.adminPage.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    S.syncQuickTools?.();
  }

  /* =========================================================
     TAB: USERS
     ========================================================= */
  function _currentUsername() {
    try {
      const u = window.SRank?.Auth?.getCurrentUser?.();
      if (!u || !u.email) return '';
      return String(u.email).split('@')[0].toLowerCase();
    } catch (_) { return ''; }
  }

  function _renderAdminUsersList() {
    const els = S.els;
    if (!els.adminUsersRows) return;
    const q = _adminUsersSearchTerm;

    /* Ẩn admin khỏi danh sách — dùng Role.getAdminUsernames() */
    const adminNames = (window.Role?.getAdminUsernames?.() || []);
    const base = _adminUsersList.filter(u =>
      !adminNames.includes(String(u.username || '').toLowerCase())
    );
    const filtered = !q ? base : base.filter(u =>
      String(u.username || '').toLowerCase().includes(q) ||
      String(u.displayName || '').toLowerCase().includes(q)
    );
    if (!filtered.length) {
      els.adminUsersRows.innerHTML = '<div class="admin-list-empty">Không có user nào</div>';
      return;
    }
    const me = _currentUsername();
    const frag = document.createDocumentFragment();
    filtered.forEach(u => {
      const isMe = u.username === me;
      const row = document.createElement('div');
      row.className = 'admin-row-item' + (u.active ? ' checked' : '');

      const nameEl = document.createElement('span');
      nameEl.className = 'admin-row-name';
      nameEl.textContent = (u.isAdmin ? '👑 ' : '') + (u.displayName || u.username);

      const userEl = document.createElement('span');
      userEl.className = 'admin-row-time';
      userEl.textContent = '@' + u.username + (u.active ? '' : ' · tắt');

      const actions = document.createElement('span');
      actions.style.cssText = 'display:inline-flex;gap:6px;flex-shrink:0;align-items:center;';

      const btnToggle = document.createElement('button');
      btnToggle.type = 'button';
      btnToggle.className = 'admin-row-btn' + (u.active ? ' checked' : '');
      if (isMe) {
        btnToggle.disabled = true;
        btnToggle.textContent = '(bạn)';
      } else {
        btnToggle.textContent = u.active ? 'Tắt' : 'Bật';
        btnToggle.addEventListener('click', () => adminToggleUser(u.username, !u.active, btnToggle));
      }

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'admin-row-btn';
      btnDel.style.cssText = 'background:#dc2626;color:#fff;border-color:#dc2626;';
      if (isMe) {
        btnDel.disabled = true;
        btnDel.textContent = 'Xoá';
      } else {
        btnDel.textContent = 'Xoá';
        btnDel.addEventListener('click', () => adminDeleteUser(u.username, u.displayName, btnDel));
      }

      actions.append(btnToggle, btnDel);
      row.append(nameEl, userEl, actions);
      frag.appendChild(row);
    });
    els.adminUsersRows.innerHTML = '';
    els.adminUsersRows.appendChild(frag);
  }

  async function renderAdminUsers() {
    const els = S.els;
    if (!els.adminUsersRows) return;
    const token = AdminSession.get();
    if (!token) return;
    const sb = window.__sb;
    if (!sb || !sb.rpc) {
      els.adminUsersRows.innerHTML = '<div class="admin-list-empty">Chưa kết nối máy chủ</div>';
      return;
    }
    els.adminUsersRows.innerHTML = '<div class="admin-list-empty">Đang tải…</div>';
    try {
      const res = await sb.rpc('rpc_admin_list_users', { p_token: token });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || 'Không tải được');
      _adminUsersList = Array.isArray(d.data) ? d.data : [];
      _renderAdminUsersList();
    } catch (e) {
      els.adminUsersRows.innerHTML = '<div class="admin-list-empty">Lỗi: ' + S.escapeHtml(String(e?.message || e)) + '</div>';
    }
  }

  async function adminCreateUser() {
    const els = S.els;
    if (!els.adminCreateUserBtn) return;
    const username = String(els.adminNewUsername?.value || '').trim().toLowerCase();
    const password = String(els.adminNewPassword?.value || '');
    const displayName = String(els.adminNewDisplayName?.value || '').trim();
    const attRowRaw = String(els.adminNewAttRow?.value || '').trim();
    const attRow = attRowRaw ? parseInt(attRowRaw, 10) : null;

    const setErr = (m) => {
      if (!els.adminUsersStatus) return;
      els.adminUsersStatus.textContent = m;
      els.adminUsersStatus.classList.remove('warn');
      els.adminUsersStatus.classList.add('error');
    };
    if (!/^[a-z0-9_]{3,32}$/.test(username)) return setErr('Username không hợp lệ (3-32 ký tự: a-z, 0-9, _)');
    if (password.length < 6) return setErr('Mật khẩu tối thiểu 6 ký tự');
    if (!displayName) return setErr('Thiếu tên hiển thị');
    if (displayName.length > 100) return setErr('Tên hiển thị tối đa 100 ký tự');
    if (attRowRaw && (!Number.isFinite(attRow) || attRow < 0 || attRow > 999)) return setErr('Thứ tự không hợp lệ (0-999)');

    const token = AdminSession.get();
    if (!token) return setErr('Không có quyền admin');
    const sb = window.__sb;
    if (!sb || !sb.rpc) return setErr('Chưa kết nối máy chủ');

    els.adminCreateUserBtn.disabled = true;
    els.adminUsersStatus?.classList.remove('error', 'warn');
    if (els.adminUsersStatus) els.adminUsersStatus.textContent = 'Đang tạo…';

    try {
      const res = await sb.rpc('rpc_admin_create_user', {
        p_token: token,
        p_username: username,
        p_password: password,
        p_display_name: displayName,
        p_att_row: attRow
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || 'Không tạo được');

      if (els.adminUsersStatus) {
        els.adminUsersStatus.classList.remove('error', 'warn');
        els.adminUsersStatus.textContent = `Đã tạo: @${username} → ${displayName} ✓`;
      }
      try { Toast.show(`Đã tạo tài khoản: ${displayName}`, { type: 'success', duration: 3500 }); } catch (_) {}

      if (els.adminNewUsername) els.adminNewUsername.value = '';
      if (els.adminNewPassword) els.adminNewPassword.value = '';
      if (els.adminNewDisplayName) els.adminNewDisplayName.value = '';
      if (els.adminNewAttRow) els.adminNewAttRow.value = '';

      await renderAdminUsers();

      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('srank_attendance_check_v2_')) localStorage.removeItem(k);
        });
      } catch (_) {}

      try { await S.loadData?.(false, true); } catch (_) {}
      try { window.syncAttendanceEmployees?.(true); } catch (_) {}
    } catch (e) {
      const msg = String(e?.message || e || 'Lỗi');
      setErr('Lỗi: ' + msg);
      try { Toast.show('Lỗi tạo user: ' + msg, { type: 'error', duration: 4000 }); } catch (_) {}
    } finally {
      if (els.adminCreateUserBtn) els.adminCreateUserBtn.disabled = false;
    }
  }

  async function adminToggleUser(username, nextActive, btn) {
    const token = AdminSession.get();
    if (!token) return;
    const sb = window.__sb;
    if (!sb || !sb.rpc) return;

    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = '…';
    try {
      const res = await sb.rpc('rpc_admin_toggle_user', {
        p_token: token,
        p_username: username,
        p_active: nextActive
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || 'Không cập nhật được');
      try { Toast.show(`${nextActive ? 'Bật' : 'Tắt'}: @${username}`, { type: 'success', duration: 2500 }); } catch (_) {}
      await renderAdminUsers();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = old;
      const msg = String(e?.message || e || 'Lỗi');
      try { Toast.show('Lỗi: ' + msg, { type: 'error', duration: 4000 }); } catch (_) {}
    }
  }

  async function adminDeleteUser(username, displayName, btn) {
    if (!username) return;

    const label = displayName || username;
    if (!confirm(`Xoá VĨNH VIỄN user "${label}" (@${username})?\n\nHành động này KHÔNG THỂ hoàn tác.\n- User không login được nữa\n- Xoá khỏi mọi danh sách\n- Lịch sử điểm/top3 của user sẽ MỒ CÔI (vẫn còn trong DB nhưng không hiện)`)) {
      return;
    }

    const typed = prompt(`Xác nhận lần cuối — gõ CHÍNH XÁC username:\n\n${username}`);
    if (String(typed || '').trim().toLowerCase() !== username.toLowerCase()) {
      try { Toast.show('Username không khớp — huỷ xoá', { type: 'warning', duration: 2500 }); } catch (_) {}
      return;
    }

    const token = AdminSession.get();
    if (!token) return;
    const sb = window.__sb;
    if (!sb || !sb.rpc) return;

    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = '…';
    try {
      const res = await sb.rpc('rpc_admin_delete_user', {
        p_token: token,
        p_username: username
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (d.ok !== true) throw new Error(d.error || 'Không xoá được');

      try { Toast.show(`Đã xoá: @${username}`, { type: 'success', duration: 3000 }); } catch (_) {}

      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('srank_attendance_check_v2_')) localStorage.removeItem(k);
        });
      } catch (_) {}

      await renderAdminUsers();
      try { await S.loadData?.(false, true); } catch (_) {}
      try { window.syncAttendanceEmployees?.(true); } catch (_) {}
    } catch (e) {
      btn.disabled = false;
      btn.textContent = old;
      const msg = String(e?.message || e || 'Lỗi');
      try { Toast.show('Lỗi xoá: ' + msg, { type: 'error', duration: 4000 }); } catch (_) {}
    }
  }

  /* =========================================================
     WIRE EVENT LISTENERS — chạy 1 lần khi load
     ========================================================= */
  function wireEvents() {
    const els = S.els;

    els.adminTabs?.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.adminTab));
    });

    els.adminFilterBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        els.adminFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _adminFilter = btn.dataset.filter;
        applyChecklistFilter();
      });
    });

    els.adminChecklistSearch?.addEventListener('input', e => {
      _adminSearchTerm = String(e.target.value || '').trim().toLowerCase();
      applyChecklistFilter();
    });

    els.adminUsersSearch?.addEventListener('input', e => {
      _adminUsersSearchTerm = String(e.target.value || '').trim().toLowerCase();
      _renderAdminUsersList();
    });

    els.adminCreateUserBtn?.addEventListener('click', adminCreateUser);

    els.resetTimeInput?.addEventListener('input', () => {
      let v = els.resetTimeInput.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + ':' + v.slice(2);
      els.resetTimeInput.value = v;
    });

    els.checklistLockTimeInput?.addEventListener('input', () => {
      let v = els.checklistLockTimeInput.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + ':' + v.slice(2);
      els.checklistLockTimeInput.value = v;
    });

    els.adminSaveBtn?.addEventListener('click', async () => {
      const time = els.resetTimeInput.value.trim();
      const lockTime = els.checklistLockTimeInput.value.trim();
      if (!S.isValid24hTime(time) || !S.isValid24hTime(lockTime)) {
        els.adminStatus.textContent = 'Giờ không hợp lệ.';
        return;
      }
      els.adminSaveBtn.disabled = true;
      els.adminStatus.textContent = 'Đang lưu…';
      try {
        const token = AdminSession.get();
        if (!token) throw new Error('Không có quyền admin');
        const r = await window.__srankApi('setSettings', {
          token, resetTime: time, checklistLockTime: lockTime
        }, 8000);
        if (!r.ok) throw new Error(r.error || 'Không lưu được');

        S.resetTime = r.data.resetTime || time;
        S.checklistLockTime = r.data.checklistLockTime || lockTime;
        S.saveChecklistLockTime(S.checklistLockTime);
        els.checklistLockTimeInput.value = S.checklistLockTime;
        S.settingsCache = { resetTime: S.resetTime, checklistLockTime: S.checklistLockTime };
        S.settingsFetchedAt = Date.now();

        S.scheduleNextReset?.();
        S.onLockSettingsChanged?.();
        S.callbacks.renderLanding?.();

        els.adminStatus.classList.remove('error', 'warn');
        els.adminStatus.textContent = `Đã lưu • Reset ${S.resetTime} • Khoá Checklist ${S.checklistLockTime}`;
      } catch (_) {
        S.saveChecklistLockTime(lockTime);
        els.checklistLockTimeInput.value = S.checklistLockTime;
        S.callbacks.renderLanding?.();
        els.adminStatus.textContent = 'Chưa lưu được lên hệ thống. Kiểm tra kết nối rồi thử lại.';
      } finally {
        els.adminSaveBtn.disabled = false;
      }
    });
  }

  /* =========================================================
     EXPORT + ĐĂNG KÝ CALLBACKS
     ========================================================= */
  window.AdminView = {
    open,
    close,
    renderChecklistEditor: renderAdminChecklistEditor,
    renderStats: renderAdminStats,
    renderUsers: renderAdminUsers,
    switchTab
  };

  if (S.callbacks) {
    S.callbacks.openAdmin = open;
    S.callbacks.closeAdmin = close;
    S.callbacks.renderAdminChecklist = renderAdminChecklistEditor;
    S.callbacks.renderAdminStats = renderAdminStats;
    S.callbacks.renderAdminUsers = renderAdminUsers;
  }

  /* Wire events on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEvents, { once: true });
  } else {
    wireEvents();
  }

  console.log('[AdminView] v1.0 ready ✓');
})();
