/* =========================================================
   WHEEL FALLBACK — v2.1 (FIX LỆCH SELECTION + TOUCH)
   ---------------------------------------------------------
   v2.1 FIX:
     ✅ Selection lệch do CSS gốc có transform: translateY(-50%)
        → ép transform: none + margin: 0 bằng !important
     ✅ Touch không hoạt động trên iOS Safari
        → set touch-action: none + overscroll-behavior: contain
          lên TOÀN BỘ cây DOM từ #attendanceNameWheel xuống
     ✅ Thêm touchcancel an toàn hơn
   v2.0:
     - Drag + inertia + snap, mouse wheel, click item

   LOAD ORDER: TRƯỚC attendance.js và checklist-ui.js
   ========================================================= */
(function () {
  "use strict";

  if (window.__wheelFallbackV2) {
    console.log("[wheel-fallback] đã load, bỏ qua");
    return;
  }
  window.__wheelFallbackV2 = true;

  console.log("[wheel-fallback] cài bản v2.1");

  /* ═══════════════════════════════════════════════════════
     CSS INJECT
     ═══════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById("__wheelFallbackCSS")) return;
    const s = document.createElement("style");
    s.id = "__wheelFallbackCSS";
    s.textContent = `
      /* ─── viewport ─── */
      .wheel-viewport.wf-ready {
        overflow: hidden !important;
        position: relative !important;
        touch-action: none !important;
        overscroll-behavior: contain !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        cursor: grab;
        display: block !important;
      }
      .wheel-viewport.wf-ready.wf-dragging { cursor: grabbing; }

      /* ─── itemsBox ─── */
      .wheel-viewport.wf-ready .wheel-items {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translate3d(0, 0, 0);
        display: block !important;
      }

      /* ─── ✅ FIX LỆCH: ép selection về đúng vị trí JS set ─── */
      .wheel-viewport.wf-ready .wheel-selection {
        position: absolute !important;
        left: 8px !important;
        right: 8px !important;
        margin: 0 !important;
        transform: none !important;            /* ⭐ chống translateY(-50%) từ CSS gốc */
        -webkit-transform: none !important;
        top: auto !important;                  /* JS sẽ set top cụ thể */
        box-sizing: border-box !important;
        pointer-events: none !important;
        z-index: 3 !important;
        border-radius: 12px !important;
        border-top: 1.5px solid rgba(79,163,112,.35) !important;
        border-bottom: 1.5px solid rgba(79,163,112,.35) !important;
        background: linear-gradient(180deg,
          rgba(79,163,112,.04) 0%,
          rgba(79,163,112,.08) 50%,
          rgba(79,163,112,.04) 100%) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.5),
          0 2px 8px -4px rgba(79,163,112,.3) !important;
      }

      /* ─── item ─── */
      .wheel-viewport.wf-ready .wf-item {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        box-sizing: border-box !important;
        padding: 0 14px !important;
        margin: 0 !important;
        transition: color .18s ease, font-weight .18s ease,
                    transform .18s ease, opacity .18s ease;
        will-change: transform;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .wheel-viewport.wf-ready .wf-item.wf-active {
        color: #234a32 !important;
        font-weight: 900 !important;
        transform: scale(1.08);
        opacity: 1 !important;
      }
      .wheel-viewport.wf-ready .wf-item.wf-near {
        color: #4a7a5a !important;
        opacity: .75 !important;
      }
      .wheel-viewport.wf-ready .wf-item.wf-far {
        color: #8fa89a !important;
        opacity: .38 !important;
      }
      .wheel-viewport.wf-ready .wf-item.wf-very-far {
        color: #a8bdb0 !important;
        opacity: .18 !important;
      }

      /* ─── ✅ FIX TOUCH: khoá touch-action trên TOÀN BỘ cây overlay ─── */
      .wf-touch-lock,
      .wf-touch-lock * {
        touch-action: none !important;
        overscroll-behavior: contain !important;
        -webkit-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════
     EASING
     ═══════════════════════════════════════════════════════ */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* ═══════════════════════════════════════════════════════
     CREATE WHEEL
     ═══════════════════════════════════════════════════════ */
  window.createWheel = function (opts) {
    const o = opts || {};
    const viewport = o.viewport || null;
    const itemsBox = o.itemsBox || null;
    const itemHeight = Number(o.itemHeight) > 0 ? Number(o.itemHeight) : 58;
    const itemClass = String(o.itemClass || "wheel-item");
    const VISIBLE_COUNT = 5;
    const CENTER_SLOT = 2;  // 0-indexed → slot giữa (thứ 3)

    let items = [];
    let index = 0;
    let currentOffset = 0;
    let animId = null;
    let attached = false;

    /* ─── drag state ─── */
    let dragging = false;
    let startY = 0;
    let startOffset = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    if (!viewport || !itemsBox) {
      console.warn("[wheel-fallback] thiếu viewport hoặc itemsBox");
      return {
        attach() {}, setItems() {}, setIndex() {}, getIndex() { return 0; },
        schedule() {}, destroy() {}
      };
    }

    const selection = viewport.querySelector(".wheel-selection") || null;

    /* ═══════════════════════════════════════════════════
       SETUP LAYOUT
       ═══════════════════════════════════════════════════ */
    function setupLayout() {
      injectCSS();
      viewport.classList.add("wf-ready");
      viewport.style.height = (itemHeight * VISIBLE_COUNT) + "px";
      viewport.style.position = "relative";
      viewport.style.overflow = "hidden";
      viewport.style.touchAction = "none";
      viewport.style.overscrollBehavior = "contain";

      itemsBox.style.position = "absolute";
      itemsBox.style.left = "0";
      itemsBox.style.right = "0";
      itemsBox.style.top = (itemHeight * CENTER_SLOT) + "px";
      itemsBox.style.transform = "translate3d(0, 0, 0)";
      itemsBox.style.transition = "none";

      /* ✅ FIX: set cứng top + transform cho selection bằng important
         để chống mọi CSS gốc can thiệp */
      if (selection) {
        selection.style.setProperty("top", (itemHeight * CENTER_SLOT) + "px", "important");
        selection.style.setProperty("height", itemHeight + "px", "important");
        selection.style.setProperty("transform", "none", "important");
        selection.style.setProperty("margin", "0", "important");
      }

      /* ✅ FIX TOUCH: khoá touch-action trên toàn bộ overlay cha */
      try {
        const overlay = viewport.closest("#attendanceNameWheel") ||
                        viewport.closest("#clV6Page") ||
                        viewport.parentElement;
        if (overlay) overlay.classList.add("wf-touch-lock");
      } catch (_) {}
    }

    /* ═══════════════════════════════════════════════════
       RENDER ITEMS
       ═══════════════════════════════════════════════════ */
    function renderItems() {
      if (!itemsBox) return;
      itemsBox.innerHTML = "";

      if (!items.length) return;

      const frag = document.createDocumentFragment();
      items.forEach(function (label, i) {
        const el = document.createElement("div");
        el.className = "wf-item " + itemClass;
        el.style.height = itemHeight + "px";
        el.style.minHeight = itemHeight + "px";
        el.style.lineHeight = itemHeight + "px";
        el.textContent = label;
        el.dataset.index = String(i);
        frag.appendChild(el);
      });
      itemsBox.appendChild(frag);
      updateHighlight();
    }

    /* ═══════════════════════════════════════════════════
       HIGHLIGHT
       ═══════════════════════════════════════════════════ */
    function updateHighlight() {
      if (!itemsBox || !items.length) return;
      const centerIdx = -currentOffset / itemHeight;
      const els = itemsBox.children;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const dist = Math.abs(i - centerIdx);
        el.classList.remove("wf-active", "wf-near", "wf-far", "wf-very-far");
        if (dist < 0.5) el.classList.add("wf-active");
        else if (dist < 1.5) el.classList.add("wf-near");
        else if (dist < 2.5) el.classList.add("wf-far");
        else el.classList.add("wf-very-far");
      }
    }

    /* ═══════════════════════════════════════════════════
       APPLY TRANSFORM
       ═══════════════════════════════════════════════════ */
    function applyTransform() {
      itemsBox.style.transform = "translate3d(0, " + currentOffset + "px, 0)";
      updateHighlight();
    }

    /* ═══════════════════════════════════════════════════
       CLAMP / RUBBER BAND
       ═══════════════════════════════════════════════════ */
    function clampOffset(offset, withRubber) {
      const min = -(items.length - 1) * itemHeight;
      const max = 0;
      if (!withRubber) return Math.max(min, Math.min(max, offset));
      if (offset > max) return max + (offset - max) * 0.35;
      if (offset < min) return min + (offset - min) * 0.35;
      return offset;
    }

    /* ═══════════════════════════════════════════════════
       ANIMATION
       ═══════════════════════════════════════════════════ */
    function cancelAnim() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    function animateTo(targetOffset, duration) {
      cancelAnim();
      const start = currentOffset;
      const distance = targetOffset - start;
      if (Math.abs(distance) < 0.5) {
        currentOffset = targetOffset;
        applyTransform();
        return;
      }
      const dur = Number(duration) > 0 ? duration : 260;
      const t0 = performance.now();

      function step(t) {
        const elapsed = t - t0;
        const p = Math.min(1, elapsed / dur);
        const eased = easeOutCubic(p);
        currentOffset = start + distance * eased;
        applyTransform();
        if (p < 1) {
          animId = requestAnimationFrame(step);
        } else {
          currentOffset = targetOffset;
          applyTransform();
          animId = null;
        }
      }
      animId = requestAnimationFrame(step);
    }

    /* ═══════════════════════════════════════════════════
       SET INDEX (INTERNAL)
       ═══════════════════════════════════════════════════ */
    function setIndexInternal(newIndex, animate) {
      if (!items.length) return;
      newIndex = Math.max(0, Math.min(items.length - 1, newIndex | 0));
      index = newIndex;
      const target = -newIndex * itemHeight;
      if (animate) animateTo(target, 260);
      else {
        cancelAnim();
        currentOffset = target;
        applyTransform();
      }
    }

    /* ═══════════════════════════════════════════════════
       DRAG
       ═══════════════════════════════════════════════════ */
    function onDragStart(clientY) {
      if (!items.length) return;
      cancelAnim();
      dragging = true;
      startY = clientY;
      startOffset = currentOffset;
      lastY = clientY;
      lastTime = performance.now();
      velocity = 0;
      viewport.classList.add("wf-dragging");
    }

    function onDragMove(clientY) {
      if (!dragging) return;
      const delta = clientY - startY;
      currentOffset = clampOffset(startOffset + delta, true);
      applyTransform();

      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        const instant = (clientY - lastY) / dt;
        velocity = velocity * 0.6 + instant * 0.4;
      }
      lastY = clientY;
      lastTime = now;
    }

    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("wf-dragging");

      const projected = currentOffset + velocity * 180;
      let targetIdx = Math.round(-projected / itemHeight);
      targetIdx = Math.max(0, Math.min(items.length - 1, targetIdx));

      if (Math.abs(velocity) < 0.15) {
        targetIdx = Math.round(-currentOffset / itemHeight);
        targetIdx = Math.max(0, Math.min(items.length - 1, targetIdx));
      }

      index = targetIdx;
      animateTo(-targetIdx * itemHeight, 280);
    }

    /* ═══════════════════════════════════════════════════
       EVENTS
       ═══════════════════════════════════════════════════ */
    function attachEvents() {
      if (attached) return;
      attached = true;

      /* ─── TOUCH ─── */
      viewport.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) return;
        onDragStart(e.touches[0].clientY);
      }, { passive: true });

      viewport.addEventListener("touchmove", function (e) {
        if (!dragging) return;
        if (e.cancelable) e.preventDefault();
        onDragMove(e.touches[0].clientY);
      }, { passive: false });

      viewport.addEventListener("touchend", function () {
        onDragEnd();
      }, { passive: true });

      viewport.addEventListener("touchcancel", function () {
        onDragEnd();
      }, { passive: true });

      /* ─── MOUSE (desktop) ─── */
      viewport.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        onDragStart(e.clientY);

        const onMove = function (ev) { onDragMove(ev.clientY); };
        const onUp = function () {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          onDragEnd();
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      /* ─── CLICK ITEM ─── */
      itemsBox.addEventListener("click", function (e) {
        if (Date.now() - lastTime < 100) return;  // bỏ qua click sau drag
        const el = e.target.closest(".wf-item");
        if (!el) return;
        const i = Number(el.dataset.index);
        if (Number.isFinite(i)) setIndexInternal(i, true);
      });

      /* ─── WHEEL CHUỘT ─── */
      viewport.addEventListener("wheel", function (e) {
        e.preventDefault();
        const dir = e.deltaY > 0 ? 1 : -1;
        const next = Math.max(0, Math.min(items.length - 1, index + dir));
        if (next !== index) setIndexInternal(next, true);
      }, { passive: false });
    }

    /* ═══════════════════════════════════════════════════
       PUBLIC API
       ═══════════════════════════════════════════════════ */
    return {
      attach() {
        setupLayout();
        renderItems();
        attachEvents();
        applyTransform();
      },
      setItems(arr) {
        items = Array.isArray(arr) ? arr.slice() : [];
        if (index >= items.length) index = 0;
        renderItems();
        applyTransform();
      },
      setIndex(i) {
        dragging = false;
        viewport.classList.remove("wf-dragging");
        setIndexInternal(i, true);
      },
      getIndex() {
        return index;
      },
      schedule() {
        requestAnimationFrame(function () { applyTransform(); });
      },
      destroy() {
        cancelAnim();
        if (itemsBox) itemsBox.innerHTML = "";
        attached = false;
      }
    };
  };

  console.log("[wheel-fallback] ✓ v2.1 ready (fix lệch + touch iOS)");
})();