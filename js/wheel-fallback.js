/* =========================================================
   WHEEL FALLBACK — v1.0
   ---------------------------------------------------------
   Cung cấp window.createWheel nếu file wheel.js gốc bị thiếu.
   API khớp với wheel.js gốc:
     createWheel({ viewport, itemsBox, itemHeight, itemClass })
     → { attach, setItems, setIndex, getIndex, schedule, destroy }

   Dùng cách CLICK-TO-SELECT (không dùng scroll snap) để tránh
   conflict với parent scroll trên iOS Safari.

   LOAD ORDER: TRƯỚC attendance.js và checklist-ui.js
   ========================================================= */
(function () {
  "use strict";
  if (typeof window.createWheel === "function") {
    console.log("[wheel-fallback] window.createWheel đã có — bỏ qua");
    return;
  }

  console.warn("[wheel-fallback] window.createWheel thiếu — cài bản fallback");

  window.createWheel = function (opts) {
    const o = opts || {};
    const viewport = o.viewport || null;
    const itemsBox = o.itemsBox || null;
    const itemHeight = Number(o.itemHeight) > 0 ? Number(o.itemHeight) : 58;
    const itemClass = String(o.itemClass || "wheel-item");
    let items = [];
    let index = 0;

    function render() {
      if (!itemsBox) return;
      itemsBox.innerHTML = "";
      itemsBox.style.display = "flex";
      itemsBox.style.flexDirection = "column";
      itemsBox.style.gap = "4px";
      itemsBox.style.padding = "8px";
      itemsBox.style.maxHeight = "60vh";
      itemsBox.style.overflowY = "auto";
      itemsBox.style.WebkitOverflowScrolling = "touch";

      items.forEach(function (label, i) {
        const el = document.createElement("div");
        el.className = itemClass;
        el.style.minHeight = itemHeight + "px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.borderRadius = "10px";
        el.style.cursor = "pointer";
        el.style.transition = "background .15s, color .15s";
        el.style.userSelect = "none";
        el.style.WebkitTapHighlightColor = "transparent";
        el.style.textAlign = "center";
        el.style.padding = "0 12px";

        if (i === index) {
          el.style.background = "rgba(79,163,112,0.15)";
          el.style.color = "#4fa370";
          el.style.fontWeight = "900";
          el.style.transform = "scale(1.04)";
        } else {
          el.style.background = "transparent";
          el.style.color = "#234a32";
          el.style.fontWeight = "600";
        }

        el.textContent = label;
        el.dataset.index = String(i);
        el.addEventListener("click", function () {
          index = i;
          render();
        });
        itemsBox.appendChild(el);
      });

      const active = itemsBox.querySelector('[data-index="' + index + '"]');
      if (active && active.scrollIntoView) {
        try {
          active.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch (_) {}
      }
    }

    return {
      attach() {
        render();
      },
      setItems(arr) {
        items = Array.isArray(arr) ? arr.slice() : [];
        if (index >= items.length) index = 0;
        render();
      },
      setIndex(i) {
        if (!items.length) return;
        index = Math.max(0, Math.min(items.length - 1, Number(i) | 0));
        render();
      },
      getIndex() {
        return index;
      },
      schedule() {
        // no-op — không cần scroll animation
      },
      destroy() {
        if (itemsBox) itemsBox.innerHTML = "";
      }
    };
  };

  console.log("[wheel-fallback] ✓ window.createWheel sẵn sàng");
})();