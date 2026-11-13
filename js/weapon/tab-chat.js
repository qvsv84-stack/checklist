/* ═══════════════════════════════════════════════════════════════════════
   WEAPON FORGE — MODULE #13: TAB CHAT
   - renderChatTab: chat list + input bar + cooldown display
   - Actions: send message (10s cooldown server-enforced)
   - Realtime incoming (qua realtime.js hook)
   - Load: #13 (sau tab-arena)
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  if (window.__WF && window.__WF.tabChat) return;

  const C = window.__WF.config;
  const U = window.__WF.utils;
  const ST = window.__WF.state;
  const API = window.__WF.api;
  if (!C || !U || !ST || !API) { console.error('[WF] tab-chat.js thiếu dependency'); return; }

  const CFG = C.CFG;
  const S = ST.S;
  const SOC = ST.SOC;
  const {
    esc, fmtTime, toast, getSb, nowMs,
    renderAvatarHtml, playSound, playNotifSound,
  } = U;

  let _cooldownTimer = null;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  function renderChatTab(){
    const me = S.user?.id;
    let msgs = '';
    if (!SOC.chat.length){
      msgs = '<div class="wf-history-empty">Chưa có tin nhắn — hãy là người đầu tiên!</div>';
    } else {
      msgs = SOC.chat.map(m => renderChatMsg(m, me)).join('');
    }
    return `
      <div class="ws-chat-wrap">
        <div class="ws-chat-list" id="wsChatList">${msgs}</div>
        <div class="ws-chat-cooldown" id="wsChatCd"></div>
        <div class="ws-chat-input-bar">
          <input class="ws-chat-input" id="wsChatInput" type="text"
            maxlength="${CFG.CHAT_MAX_LEN}" placeholder="Nhắn gì đó..." autocomplete="off">
          <button class="ws-chat-send" id="wsChatSend" type="button">Gửi</button>
        </div>
      </div>
    `;
  }

  function renderChatMsg(m, meId){
    const isMe = m.user_id === meId;
    return `<div class="ws-chat-msg ${isMe?'me':''}">
      ${renderAvatarHtml(m.display_name, 'ws-chat-av')}
      <div class="ws-chat-bubble-wrap">
        <div class="ws-chat-name">${esc(m.display_name||'Ai đó')}</div>
        <div class="ws-chat-bubble">${esc(m.message)}</div>
        <div class="ws-chat-time">${fmtTime(m.created_at)}</div>
      </div>
    </div>`;
  }

  function wireChat(body){
    const inp = document.getElementById('wsChatInput');
    const btn = document.getElementById('wsChatSend');
    if (inp && btn){
      const submit = () => doChat();
      btn.addEventListener('click', submit);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ e.preventDefault(); submit(); }
      });
    }
    scrollChatToBottom();
    startCooldownTicker();
  }

  function rerenderChat(){
    if (S.activeTab !== 'chat') return;
    const list = document.getElementById('wsChatList');
    if (!list) return;
    const meId = S.user?.id;
    if (!SOC.chat.length){
      list.innerHTML = '<div class="wf-history-empty">Chưa có tin nhắn</div>';
      return;
    }
    list.innerHTML = SOC.chat.map(m => renderChatMsg(m, meId)).join('');
    scrollChatToBottom();
  }

  function scrollChatToBottom(){
    const list = document.getElementById('wsChatList');
    if (list) setTimeout(() => { list.scrollTop = list.scrollHeight; }, 50);
  }

  /* ═══════════════════════════════════════════════════════════════
     COOLDOWN
     ═══════════════════════════════════════════════════════════════ */
  function startCooldownTicker(){
    const cdEl = document.getElementById('wsChatCd');
    const inp = document.getElementById('wsChatInput');
    const btn = document.getElementById('wsChatSend');
    if (!cdEl || !inp || !btn) return;

    if (_cooldownTimer) clearInterval(_cooldownTimer);
    _cooldownTimer = setInterval(() => {
      const now = nowMs();
      const remain = Math.max(0, S.chatCooldownUntil - now);
      if (remain > 0){
        cdEl.textContent = '⏳ Đợi ' + Math.ceil(remain/1000) + 's';
        inp.disabled = true;
        btn.disabled = true;
      } else {
        cdEl.textContent = '';
        inp.disabled = false;
        btn.disabled = false;
      }
      if (S.activeTab !== 'chat'){
        clearInterval(_cooldownTimer);
        _cooldownTimer = null;
      }
    }, 300);
  }

  /* ═══════════════════════════════════════════════════════════════
     SEND
     ═══════════════════════════════════════════════════════════════ */
  async function doChat(){
    const inp = document.getElementById('wsChatInput');
    if (!inp) return;
    const msg = inp.value.trim();
    if (!msg) return;
    if (msg.length > CFG.CHAT_MAX_LEN){
      toast('Tối đa ' + CFG.CHAT_MAX_LEN + ' ký tự', 'warning');
      return;
    }
    if (nowMs() < S.chatCooldownUntil){
      toast('Đợi chút nữa', 'warning');
      return;
    }

    const sb = getSb();
    if (!sb) return;
    inp.disabled = true;

    try {
      const myState = S.state;
      const tier = C.tierOf(myState?.enh || 0);
      const res = await sb.rpc('rpc_weapon_send_chat', {
        p_message: msg,
        p_tier: tier,
        p_enh: myState?.enh || 0,
      });
      if (res.error) throw res.error;
      const d = res.data || {};
      if (!d.ok) throw new Error(d.error || 'Lỗi gửi');

      inp.value = '';
      S.chatCooldownUntil = nowMs() + CFG.CHAT_COOLDOWN_MS;
      playSound(660, .08);

      await API.fetchChat();
      rerenderChat();
      scrollChatToBottom();

      await API.questProgress('chat', 1);
      await API.seasonAddXP(CFG.SEASON_XP.chat);
    } catch(e){
      toast('Lỗi: ' + (e.message || 'Không gửi được'), 'error');
      inp.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     REALTIME HOOK (gọi từ realtime.js)
     ═══════════════════════════════════════════════════════════════ */
  function onNewChatMessage(row){
    if (!row) return;
    if (SOC.chat.some(m => m.id === row.id)) return;
    SOC.chat.push(row);
    if (SOC.chat.length > 200) SOC.chat = SOC.chat.slice(-200);

    const me = S.user;
    const isMine = me && row.user_id === me.id;

    if (S.activeTab === 'chat'){
      rerenderChat();
    } else if (!isMine){
      SOC.unreadChat = Math.min(99, SOC.unreadChat + 1);
      API.updateBadges();
      playNotifSound();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  window.__WF.tabChat = {
    renderChatTab,
    wireChat,
    rerenderChat,
    doChat,
    onNewChatMessage,
    scrollChatToBottom,
  };

  console.log('[WF] tab-chat.js ✓');
})();