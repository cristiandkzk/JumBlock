const GENERIC_SCRIPT_ID = "generic-ad-hide";
const ANTIPOPUP_SCRIPT_ID = "antipopup";
const ALL_IDS = [GENERIC_SCRIPT_ID, ANTIPOPUP_SCRIPT_ID];

const ytEl = document.getElementById("yt");
const twEl = document.getElementById("tw");
const genEl = document.getElementById("gen");
const statusEl = document.getElementById("status");

chrome.storage.sync.get(
  { enableYoutube: true, enableTwitch: true, enableGeneric: false },
  (cfg) => {
    ytEl.checked = cfg.enableYoutube;
    twEl.checked = cfg.enableTwitch;
    genEl.checked = cfg.enableGeneric;
  }
);

ytEl.addEventListener("change", () => {
  chrome.storage.sync.set({ enableYoutube: ytEl.checked });
});

twEl.addEventListener("change", () => {
  chrome.storage.sync.set({ enableTwitch: twEl.checked });
});

genEl.addEventListener("change", async () => {
  if (genEl.checked) {
    const granted = await chrome.permissions.request({ origins: ["<all_urls>"] });
    if (!granted) {
      genEl.checked = false;
      statusEl.textContent = "Permiso denegado.";
      return;
    }
    await registerGenericScript();
    chrome.storage.sync.set({ enableGeneric: true });
    statusEl.textContent = "Activado en todas las webs.";
  } else {
    chrome.storage.sync.set({ enableGeneric: false });
    try {
      await chrome.scripting.unregisterContentScripts({ ids: ALL_IDS });
    } catch (e) {
      // no estaban registrados, no pasa nada
    }
    statusEl.textContent = "Desactivado.";
  }
});

async function registerGenericScript() {
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: ALL_IDS });
  const have = new Set(existing.map((s) => s.id));
  const toAdd = [];

  if (!have.has(GENERIC_SCRIPT_ID)) {
    toAdd.push({
      id: GENERIC_SCRIPT_ID,
      matches: ["<all_urls>"],
      excludeMatches: ["*://*.youtube.com/*", "*://*.twitch.tv/*"],
      js: ["src/generic.js"],
      runAt: "document_idle",
    });
  }
  if (!have.has(ANTIPOPUP_SCRIPT_ID)) {
    toAdd.push({
      id: ANTIPOPUP_SCRIPT_ID,
      matches: ["<all_urls>"],
      excludeMatches: ["*://*.youtube.com/*", "*://*.twitch.tv/*"],
      js: ["src/antipopup.js"],
      // Debe correr ANTES que los scripts del sitio y en su mismo contexto
      // para poder reemplazar window.open.
      runAt: "document_start",
      world: "MAIN",
    });
  }
  if (toAdd.length) {
    await chrome.scripting.registerContentScripts(toAdd);
  }
}
