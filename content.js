// Vimari-style smooth scrolling.
//
// The trick (from vimari / sVim): never animate in JS. Hand the browser a target with
// behavior: "smooth" and let its native animation do the easing. Repeated keypresses
// (including key-repeat while holding j) push the *same* target further, so the
// in-flight animation is retargeted instead of restarted, giving one continuous glide.
(() => {
  "use strict";

  // Keep in sync with options.js.
  const DEFAULTS = {
    step: 150,         // px per j/k (vimari default)
    pageFraction: 0.5, // d/u scroll this fraction of the visible height
    resetMs: 200,      // forget the accumulated target after this much idle time
  };
  let prefs = { ...DEFAULTS };

  const storage = globalThis.browser && browser.storage;
  if (storage) {
    storage.sync.get(DEFAULTS).then((saved) => { prefs = saved; });
    storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in DEFAULTS) prefs[key] = newValue ?? DEFAULTS[key];
      }
    });
  }

  // key -> direction, and distance in px given the element being scrolled
  const KEYS = {
    j: { dir: 1, size: () => prefs.step },
    k: { dir: -1, size: () => prefs.step },
    d: { dir: 1, size: (el) => visibleHeight(el) * prefs.pageFraction },
    u: { dir: -1, size: (el) => visibleHeight(el) * prefs.pageFraction },
  };

  const NON_TEXT_INPUTS = new Set([
    "button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit",
  ]);

  let state = null; // { el, target, timer }
  let lastClicked = null;

  const root = () => document.scrollingElement || document.documentElement;

  function visibleHeight(el) {
    return el === root() ? window.innerHeight : el.clientHeight;
  }

  function maxScroll(el) {
    return el.scrollHeight - visibleHeight(el);
  }

  function deepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    switch (el.tagName) {
      case "TEXTAREA":
      case "SELECT":
        return true;
      case "INPUT":
        return !NON_TEXT_INPUTS.has(el.type);
      default:
        return false;
    }
  }

  function isScrollable(el) {
    if (maxScroll(el) <= 1) return false;
    const blocked = (node) => {
      const overflow = getComputedStyle(node).overflowY;
      return overflow === "hidden" || overflow === "clip";
    };
    if (el === root()) {
      return !blocked(document.documentElement) && !(document.body && blocked(document.body));
    }
    const overflow = getComputedStyle(el).overflowY;
    return overflow === "auto" || overflow === "scroll" || overflow === "overlay";
  }

  function canMove(el, dy) {
    return dy > 0 ? el.scrollTop < maxScroll(el) - 1 : el.scrollTop > 0;
  }

  // Apps that lock the page and scroll an inner pane (mail clients, chat, docs viewers).
  function largestVisibleScrollable(dy) {
    let best = null;
    let bestArea = 0;
    const walker = document.createTreeWalker(document.body || document.documentElement,
      NodeFilter.SHOW_ELEMENT);
    for (let el = walker.currentNode; el; el = walker.nextNode()) {
      if (el.clientHeight < 100 || !isScrollable(el) || !canMove(el, dy)) continue;
      const r = el.getBoundingClientRect();
      const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
      const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      const area = w > 0 && h > 0 ? w * h : 0;
      if (area > bestArea) {
        best = el;
        bestArea = area;
      }
    }
    return best;
  }

  // Like Vimium: prefer the scrollable container around what you last clicked or focused,
  // bubbling out to the next container when the inner one has hit its end.
  function findScrollElement(dy) {
    const start = (lastClicked && lastClicked.isConnected && lastClicked) || deepActiveElement();
    for (let el = start; el && el.nodeType === Node.ELEMENT_NODE; el = el.parentElement) {
      if (el !== root() && isScrollable(el) && canMove(el, dy)) return el;
    }
    const page = root();
    if (isScrollable(page)) return page;
    return largestVisibleScrollable(dy) || page;
  }

  function smoothScroll({ dir, size }) {
    if (!state || !state.el.isConnected) {
      const el = findScrollElement(dir);
      state = { el, target: el.scrollTop, timer: null };
    }
    const { el } = state;
    const target = Math.max(0, Math.min(maxScroll(el), state.target + dir * size(el)));
    if (target !== state.target) {
      state.target = target;
      el.scrollTo({ top: target, behavior: "smooth" });
    }
    clearTimeout(state.timer);
    state.timer = setTimeout(() => { state = null; }, prefs.resetMs);
  }

  document.addEventListener("mousedown", (e) => { lastClicked = e.composedPath()[0]; }, true);

  // Vimium listens on window (capture), which fires before document (capture). Listening on
  // document means Vimium gets first pick (link-hint letters, find mode, etc. are consumed
  // there with stopImmediatePropagation and never reach us), while we still beat the page's
  // own j/k shortcuts.
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const action = KEYS[e.key];
    if (!action || isEditable(deepActiveElement())) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    smoothScroll(action);
  }, true);
})();
