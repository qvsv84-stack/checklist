/* =========================================================
   CHECKLIST VIEW — v1.0
   ---------------------------------------------------------
   Tách từ main.js (Task 2c).
   Chịu trách nhiệm:
     - renderChecklist (list view + skeleton)
     - updateChecklistRow (in-place update 1 row)
     - smoothUpdateChecklist (diff-based update, giữ pending checks)
     - notifyNewlyChecked (toast thông báo)
     - checkin (user action)

   Module-local state:
     - _checklistSignature (skip re-render khi không đổi)
     - _pendingChecks (Set — đang chờ server confirm)
     - _recentSelfChecks (Map — chống self-notify)

   Load order: SAU main.js (cần SrankCore)
   ========================================================= */
(function(){
  "use strict";
  if (window.ChecklistView) return;

  const S = window.SrankCore;
  if (!S) {
    console.error('[ChecklistView] window.SrankCore chưa load — cần main.js load trước');
    return;
  }

  const Toast = window.Toast;

  /* ───── Module-local state ───── */
  let _checklistSignature = '';
  const _pendingChecks = new Set();
  const _recentSelfChecks = new Map();

  const SELF_CHECK_IGNORE_MS = 20000;

  /* =========================================================
     SIGNATURE — skip render khi không đổi
     ========================================================= */
  function checklistSig() {
    const names = S.names;
    const checked = S.checked;
    const times = S.times;
    return names.map((n, i) => `${n}|${checked[i] ? 1 : 0}|${times[i] || ''}`).join('::');
  }

  /* =========================================================
     SKELETON — khi chưa có data
     ========================================================= */
  function renderChecklistSkeleton() {
    const body = S.els.checklistBody;
    if (!body) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 5; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><div class="skeleton skeleton-row medium"></div></td><td><div class="skeleton skeleton-row short"></div></td><td><div class="skeleton" style="width:25px;height:25px;border-radius:8px;margin:auto"></div></td>';
      frag.appendChild(tr);
    }
    body.innerHTML = '';
    body.appendChild(frag);
    _checklistSignature = '';
  }

  /* =========================================================
     RENDER CHÍNH — sort theo giờ + build rows
     ========================================================= */
  function renderChecklist(force = false) {
    const body = S.els.checklistBody;
    if (!body) return;

    const sig = checklistSig();
    if (!force && sig === _checklistSignature) return;
    _checklistSignature = sig;

    const names = S.names;
    const checked = S.checked;
    const times = S.times;

    const rows = names.map((name, i) => ({
      name, index: i,
      checked: !!checked[i],
      time: times[i] || ''
    }));
    rows.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? -1 : 1;
      if (a.checked && b.checked) {
        const ta = a.time || '99:99', tb = b.time || '99:99';
        const c = ta.localeCompare(tb);
        if (c !== 0) return c;
      }
      return a.index - b.index;
    });

    const frag = document.createDocumentFragment();
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.index = row.index;
      tr.innerHTML = '<td class="playerName"></td><td class="checkTime"></td><td><div class="checkBox"></div></td>';
      tr.firstChild.textContent = (window.DN ? window.DN(row.name) : row.name);
      tr.querySelector('.checkTime').textContent = row.time || '—';
      if (row.checked) tr.querySelector('.checkBox').classList.add('checked');
      frag.appendChild(tr);
    });
    body.innerHTML = '';
    body.appendChild(frag);
  }

  /* =========================================================
     UPDATE 1 ROW — in-place, không re-render cả list
     ========================================================= */
  function updateChecklistRow(index) {
    const body = S.els.checklistBody;
    if (!body) return false;
    const tr = body.querySelector(`tr[data-index="${index}"]`);
    if (!tr) return false;
    const timeCell = tr.querySelector('.checkTime');
    const box = tr.querySelector('.checkBox');
    if (timeCell) timeCell.textContent = S.times[index] || '—';
    if (box) box.classList.toggle('checked', !!S.checked[index]);
    _checklistSignature = checklistSig();
    return true;
  }

  /* =========================================================
     SMOOTH UPDATE — diff server data vs local, giữ pending
     Return: { ok, changed: number, newlyChecked: [...] }
     ========================================================= */
  function smoothUpdateChecklist(newData) {
    const names = S.names;
    const checked = S.checked;
    const times = S.times;
    const points = S.points;
    const ranks = S.ranks;

    if (!names.length) return { ok: false };
    if (names.length !== newData.names.length) return { ok: false };
    if (names.some((n, i) => n !== newData.names[i])) return { ok: false };

    const oldChecked = checked.slice();
    const oldTimes = times.slice();
    const oldPoints = points.slice();
    const oldRanks = ranks.slice();
    const newlyChecked = [];
    const changedIdx = [];
    const mergedChecked = newData.checked.slice();
    const mergedTimes = newData.times.slice();

    for (let i = 0; i < names.length; i++) {
      if (_pendingChecks.has(names[i])) {
        mergedChecked[i] = oldChecked[i];
        mergedTimes[i] = oldTimes[i];
      }
      const checkedChanged = oldChecked[i] !== mergedChecked[i];
      const timeChanged = String(oldTimes[i] || '') !== String(mergedTimes[i] || '');
      const pointsChanged = oldPoints[i] !== newData.points[i];
      const rankChanged = oldRanks[i] !== newData.ranks[i];
      if (checkedChanged || timeChanged || pointsChanged || rankChanged) {
        changedIdx.push(i);
        if (!oldChecked[i] && mergedChecked[i]) {
          newlyChecked.push({ name: names[i], time: mergedTimes[i] || '' });
        }
      }
    }
    if (!changedIdx.length) return { ok: true, changed: 0, newlyChecked: [] };

    /* Ghi lại vào array gốc (giữ reference) */
    for (let i = 0; i < names.length; i++) {
      checked[i] = mergedChecked[i];
      times[i] = mergedTimes[i];
      points[i] = newData.points[i];
      ranks[i] = newData.ranks[i];
    }
    S.markFresh();

    renderChecklist(true);
    changedIdx.slice(0, 5).forEach((idx, k) => {
      const tr = S.els.checklistBody?.querySelector(`tr[data-index="${idx}"]`);
      if (!tr) return;
      tr.classList.add('row-updated');
      setTimeout(() => tr.classList.remove('row-updated'), 1200 + k * 80);
    });

    if (newlyChecked.length) notifyNewlyChecked(newlyChecked);

    return { ok: true, changed: changedIdx.length, newlyChecked };
  }

  /* =========================================================
     NOTIFY — toast khi có người check mới
     ========================================================= */
  function isRecentCheckMinute(hhmmStr, maxMin) {
    const m = String(hhmmStr || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!m) return false;
    const h = +m[1], mi = +m[2];
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    const nowH = +(parts.find(p => p.type === 'hour')?.value || 0);
    const nowM = +(parts.find(p => p.type === 'minute')?.value || 0);
    let diff = nowH * 60 + nowM - (h * 60 + mi);
    if (diff < 0) diff += 1440;
    return diff <= maxMin;
  }

  function notifyNewlyChecked(list) {
    if (!Array.isArray(list) || !list.length) return;
    const now = Date.now();
    const filtered = list.filter(item => {
      const last = _recentSelfChecks.get(item.name);
      if (last && now - last < SELF_CHECK_IGNORE_MS) return false;
      return isRecentCheckMinute(item.time, 5);
    });
    if (!filtered.length) return;
    filtered.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    /* Filtered dùng cho list đã check — nhưng dùng DN() để hiển thị */
    const _dn = n => (window.DN ? window.DN(n) : n);

    if (filtered.length === 1) {
      const p = filtered[0];
      Toast.show(`${_dn(p.name)} vừa check lúc ${p.time || '—'}`, { type: 'person', icon: '🌸', duration: 3200 });
    } else {
      Toast.show(`${_dn(filtered[0].name)} và ${filtered.length - 1} người khác vừa check`, { type: 'person', icon: '🌸', duration: 3200 });
    }
  }

  /* =========================================================
     CHECKIN — user action
     ========================================================= */
  async function checkin(name, index) {
    const names = S.names;
    const checked = S.checked;
    const times = S.times;
    const points = S.points;
    const ranks = S.ranks;

    if (checked[index] === true && times[index]) {
      S.setStatus(`Đã ghi ${times[index]} ✓`);
      return;
    }

    S.markUserAction?.();
    _recentSelfChecks.set(name, Date.now());
    if (_recentSelfChecks.size > 100) {
      const now = Date.now();
      for (const [k, v] of _recentSelfChecks) {
        if (now - v > SELF_CHECK_IGNORE_MS * 2) _recentSelfChecks.delete(k);
      }
    }
    _pendingChecks.add(name);

    const clientTime = S.hhmm();
    const prevChecked = checked[index];
    const prevTime = times[index];

    /* Optimistic update */
    times[index] = clientTime;
    checked[index] = true;
    S.markFresh();

    if (!updateChecklistRow(index)) renderChecklist(true);
    if (!S.els.checklistPanel?.classList.contains('show')) {
      S.callbacks.renderLanding?.();
    }
    S.setStatus(`Đã ghi ${clientTime} ✓`);

    try {
      const r = await window.__srankApi('checkin', {
        name, clientTime, clientEpoch: String(Date.now())
      }, 12000);
      if (!r.ok) throw new Error(r.error || 'Checkin thất bại');

      if (r.data && Number.isFinite(Number(r.data.points))) {
        points[index] = Number(r.data.points);
        ranks[index] = S.normalizeServerRank(r.data.rank, points[index]);
      }
      if (r.data && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(r.data.time || ''))) {
        times[index] = String(r.data.time);
      }
      _pendingChecks.delete(name);
      S.markFresh();
      updateChecklistRow(index);
      S.setStatus(`Đã ghi ${times[index] || clientTime} ✓`);

      try {
        window.dispatchEvent(new CustomEvent('checkinDone', {
          detail: { name, time: times[index] || clientTime }
        }));
      } catch (_) {}
      try {
        localStorage.setItem('srank_last_checkin', JSON.stringify({
          name, time: times[index] || clientTime, date: S.todayKey()
        }));
      } catch (_) {}
    } catch (err) {
      _pendingChecks.delete(name);
      checked[index] = prevChecked;
      times[index] = prevTime;
      _recentSelfChecks.delete(name);
      S.markFresh();
      if (!updateChecklistRow(index)) renderChecklist(true);
      if (!S.els.checklistPanel?.classList.contains('show')) {
        S.callbacks.renderLanding?.();
      }
      const msg = String(err?.message || '').trim();
      S.setStatus(msg ? `Không ghi được: ${msg}` : 'Không ghi được — kiểm tra mạng');
    }
  }

  /* =========================================================
     PUBLIC API — pending checks cần expose cho loadData
     ========================================================= */
  function hasPendingCheck(name) { return _pendingChecks.has(name); }
  function addPendingCheck(name) { _pendingChecks.add(name); }
  function removePendingCheck(name) { _pendingChecks.delete(name); }
  function markRecentSelfCheck(name) { _recentSelfChecks.set(name, Date.now()); }

  /* =========================================================
     EXPORT + ĐĂNG KÝ CALLBACKS
     ========================================================= */
  window.ChecklistView = {
    render: renderChecklist,
    renderSkeleton: renderChecklistSkeleton,
    updateRow: updateChecklistRow,
    smoothUpdate: smoothUpdateChecklist,
    notify: notifyNewlyChecked,
    checkin,

    /* Pending checks API — cho main.js.loadData */
    hasPendingCheck,
    addPendingCheck,
    removePendingCheck,
    markRecentSelfCheck,

    /* Debug */
    _getSignature: () => _checklistSignature,
    _resetSignature: () => { _checklistSignature = ''; }
  };

  if (S.callbacks) {
    S.callbacks.renderChecklist = renderChecklist;
    S.callbacks.renderChecklistSkeleton = renderChecklistSkeleton;
    S.callbacks.updateChecklistRow = updateChecklistRow;
    S.callbacks.smoothUpdateChecklist = smoothUpdateChecklist;
    S.callbacks.checkin = checkin;
  }

  console.log('[ChecklistView] v1.0 ready ✓');
})();
