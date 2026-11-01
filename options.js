(() => {
  "use strict";

  // Keep in sync with content.js.
  const DEFAULTS = { step: 150, pageFraction: 0.5, resetMs: 200 };

  const FORMAT = {
    step: (v) => `${v} px`,
    pageFraction: (v) => `${Math.round(v * 100)}%`,
    resetMs: (v) => `${v} ms`,
  };

  const savedNote = document.getElementById("saved");
  let savedTimer = null;

  function show(key, value) {
    document.getElementById(key).value = value;
    document.getElementById(`${key}-out`).textContent = FORMAT[key](value);
  }

  function flashSaved() {
    savedNote.classList.add("show");
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => savedNote.classList.remove("show"), 1200);
  }

  browser.storage.sync.get(DEFAULTS).then((prefs) => {
    for (const key of Object.keys(DEFAULTS)) show(key, prefs[key]);
  });

  for (const key of Object.keys(DEFAULTS)) {
    document.getElementById(key).addEventListener("input", (e) => {
      const value = Number(e.target.value);
      show(key, value);
      browser.storage.sync.set({ [key]: value }).then(flashSaved);
    });
  }

  document.getElementById("reset").addEventListener("click", () => {
    for (const [key, value] of Object.entries(DEFAULTS)) show(key, value);
    browser.storage.sync.set(DEFAULTS).then(flashSaved);
  });
})();
