(function () {
  let enabled = true;
  chrome.storage.sync.get({ enableYoutube: true }, (cfg) => {
    enabled = cfg.enableYoutube;
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enableYoutube) enabled = changes.enableYoutube.newValue;
  });

  const SKIP_SELECTORS = [
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button",
  ];

  // Botones de cerrar de los anuncios de IMAGEN/overlay (no son video).
  const OVERLAY_CLOSE_SELECTORS = [
    ".ytp-ad-overlay-close-button",
    ".ytp-ad-overlay-close-container",
    ".ytp-ad-image-overlay .ytp-ad-overlay-close-button",
    "#dismiss-button button",
    ".ytp-ad-button-icon",
  ];

  function clickFirst(selectors) {
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function clickSkipIfPresent() {
    return clickFirst(SKIP_SELECTORS);
  }

  function closeOverlayAds() {
    // Estos aparecen aunque el player NO este en "ad-showing" (banner sobre el video).
    clickFirst(OVERLAY_CLOSE_SELECTORS);
  }

  function handleAdState() {
    closeOverlayAds();

    const player = document.querySelector(".html5-video-player");
    const video = document.querySelector("video.html5-main-video") || document.querySelector("video");
    if (!player || !video) return;

    const adShowing =
      player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting");

    if (!adShowing) {
      if (video.dataset.adsMuteRestore !== undefined) {
        video.muted = video.dataset.adsMuteRestore === "1";
        delete video.dataset.adsMuteRestore;
      }
      return;
    }

    if (video.dataset.adsMuteRestore === undefined) {
      video.dataset.adsMuteRestore = video.muted ? "1" : "0";
    }
    video.muted = true;

    if (clickSkipIfPresent()) return;

    // ad no skippeable todavia: la dejamos "correr" (cuenta impresion) pero
    // saltamos el tiempo al final para que el player avance solo.
    if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.25) {
      video.currentTime = video.duration;
    }
  }

  function tick() {
    if (!enabled) return;
    handleAdState();
  }

  // El observador puede dispararse miles de veces por segundo mientras YouTube
  // construye la pagina: throttleamos para no trabar el hilo al inicio.
  let scheduled = false;
  function scheduleTick() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      tick();
    }, 250);
  }

  // Observamos solo el contenedor del player (no todo el documento) cuando exista.
  function attachObserver() {
    const target = document.querySelector(".html5-video-player") || document.body;
    if (!target) return false;
    new MutationObserver(scheduleTick).observe(target, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
    return true;
  }
  if (!attachObserver()) {
    const wait = setInterval(() => {
      if (attachObserver()) clearInterval(wait);
    }, 1000);
  }
  // red de seguridad: las clases de ad-showing no siempre disparan una mutacion observable a tiempo
  setInterval(tick, 500);
})();
