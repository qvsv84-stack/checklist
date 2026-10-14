/* =========================================================
   REALTIME — WebSocket subscribe cho score_audit
   Load SAU supabase-adapter.js
   ---------------------------------------------------------
   Cơ chế:
   - Lắng nghe INSERT/UPDATE/DELETE trên bảng score_audit
   - Khi có thay đổi → debounce 250ms → dispatch event
   - main.js listen event → gọi loadData() để refresh
   ========================================================= */
(function(){
  "use strict";
  if (window.__realtimeLoaded) return;
  window.__realtimeLoaded = true;

  const DEBOUNCE_MS = 250;
  let _debounceTimer = null;
  let _channel = null;
  let _subscribed = false;
  let _retryCount = 0;
  const MAX_RETRY = 3;

  function emit(){
    if (_debounceTimer) return;
    _debounceTimer = setTimeout(function(){
      _debounceTimer = null;
      try {
        window.dispatchEvent(new CustomEvent('sb:score:changed'));
      } catch (_) {}
    }, DEBOUNCE_MS);
  }

  function init(){
    const sb = window.__sb;
    if (!sb || !sb.channel){
      if (_retryCount++ < 10) setTimeout(init, 300);
      return;
    }

    try {
      _channel = sb.channel('realtime-score')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'score_audit'
        }, function(payload){
          emit();
        })
        .subscribe(function(status){
          if (status === 'SUBSCRIBED'){
            _subscribed = true;
            _retryCount = 0;
            console.log('[RT] score_audit channel ✓');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'){
            _subscribed = false;
            console.warn('[RT] channel error:', status);
            if (_retryCount++ < MAX_RETRY){
              setTimeout(function(){
                try { _channel?.unsubscribe(); } catch (_) {}
                _channel = null;
                init();
              }, 2000 * _retryCount);
            }
          } else if (status === 'CLOSED'){
            _subscribed = false;
          }
        });
    } catch (e){
      console.warn('[RT] init failed:', e);
    }
  }

  /* Reconnect khi tab visible lại */
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) return;
    if (_subscribed) return;
    if (_retryCount >= MAX_RETRY) _retryCount = 0;
    init();
  });

  /* Reset retry khi có mạng lại */
  window.addEventListener('online', function(){
    if (_subscribed) return;
    _retryCount = 0;
    init();
  });

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
