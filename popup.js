const GENERIC_SCRIPT_ID = "generic-ad-hide";

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
      await chrome.scripting.unregisterContentScripts({ ids: [GENERIC_SCRIPT_ID] });
    } catch (e) {
      // no estaba registrado, no pasa nada
    }
    statusEl.textContent = "Desactivado.";
  }
});

async function registerGenericScript() {
  const existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [GENERIC_SCRIPT_ID],
  });
  if (existing.length) return;
  await chrome.scripting.registerContentScripts([
    {
      id: GENERIC_SCRIPT_ID,
      matches: ["<all_urls>"],
      excludeMatches: ["*://*.youtube.com/*", "*://*.twitch.tv/*"],
      js: ["src/generic.js"],
      runAt: "document_idle",
    },
  ]);
}
