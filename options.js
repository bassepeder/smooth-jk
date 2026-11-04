(() => {
  "use strict";

  // Keep in sync with content.js.
  const DEFAULTS = {
    step: 150, pageFraction: 0.5, resetMs: 200,
    keyDown: "j", keyUp: "k", keyHalfDown: "d", keyHalfUp: "u",
  };
  const RANGES = ["step", "pageFraction", "resetMs"];
  const KEYS = ["keyDown", "keyUp", "keyHalfDown", "keyHalfUp"];
  const PRESETS = {
    qwerty: { keyDown: "j", keyUp: "k", keyHalfDown: "d", keyHalfUp: "u" },
    colemak: { keyDown: "n", keyUp: "e", keyHalfDown: "s", keyHalfUp: "l" },
  };

  const FORMAT = {
    step: (v) => `${v} px`,
    pageFraction: (v) => `${Math.round(v * 100)}%`,
    resetMs: (v) => `${v} ms`,
  };
  const keyLabel = (k) => (k === " " ? "Space" : k);

  const savedNote = document.getElementById("saved");
  let savedTimer = null;
  const keys = {};
  const ranges = {};

  function showResetButtons() {
    for (const btn of document.querySelectorAll(".reset-one")) {
      const target = btn.dataset.reset;
      const names = target === "keys" ? KEYS : [target];
      const current = target === "keys" ? keys : ranges;
      btn.hidden = names.every((n) => current[n] === DEFAULTS[n]);
    }
  }

  function showRange(key, value) {
    document.getElementById(key).value = value;
    document.getElementById(`${key}-out`).textContent = FORMAT[key](value);
    ranges[key] = value;
    showResetButtons();
  }

  function showKeys() {
    for (const k of KEYS) document.getElementById(k).value = keyLabel(keys[k]) || "—";
    for (const btn of document.querySelectorAll(".preset")) {
      const p = PRESETS[btn.dataset.preset];
      btn.setAttribute("aria-pressed", String(KEYS.every((k) => keys[k] === p[k])));
    }
    showResetButtons();
  }

  function flashSaved() {
    savedNote.classList.add("show");
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => savedNote.classList.remove("show"), 1200);
  }

  function saveKeys(changed) {
    Object.assign(keys, changed);
    showKeys();
    browser.storage.sync.set(changed).then(flashSaved);
  }

  browser.storage.sync.get(DEFAULTS).then((prefs) => {
    for (const key of RANGES) showRange(key, prefs[key]);
    for (const k of KEYS) keys[k] = prefs[k];
    showKeys();
  });

  for (const key of RANGES) {
    document.getElementById(key).addEventListener("input", (e) => {
      const value = Number(e.target.value);
      showRange(key, value);
      browser.storage.sync.set({ [key]: value }).then(flashSaved);
    });
  }

  for (const k of KEYS) {
    const field = document.getElementById(k);
    field.addEventListener("focus", () => { field.value = "press a key"; });
    field.addEventListener("blur", showKeys);
    field.addEventListener("keydown", (e) => {
      if (e.key === "Tab") return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") return field.blur();
      if (e.key === "Backspace" || e.key === "Delete") {
        saveKeys({ [k]: "" });
        return field.blur();
      }
      // The content script ignores Cmd/Ctrl/Alt combos and named keys like arrows.
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const changed = { [k]: e.key };
      const other = KEYS.find((o) => o !== k && keys[o] === e.key);
      if (other) changed[other] = keys[k];
      saveKeys(changed);
      field.blur();
    });
  }

  for (const btn of document.querySelectorAll(".preset")) {
    btn.addEventListener("click", () => saveKeys({ ...PRESETS[btn.dataset.preset] }));
  }

  for (const btn of document.querySelectorAll(".reset-one")) {
    btn.addEventListener("click", () => {
      const target = btn.dataset.reset;
      if (target === "keys") {
        saveKeys(Object.fromEntries(KEYS.map((k) => [k, DEFAULTS[k]])));
      } else {
        showRange(target, DEFAULTS[target]);
        browser.storage.sync.set({ [target]: DEFAULTS[target] }).then(flashSaved);
      }
    });
  }

  document.getElementById("reset").addEventListener("click", () => {
    for (const key of RANGES) showRange(key, DEFAULTS[key]);
    for (const k of KEYS) keys[k] = DEFAULTS[k];
    showKeys();
    browser.storage.sync.set(DEFAULTS).then(flashSaved);
  });
})();
