(function () {
  let enabled = true;
  chrome.storage.sync.get({ enableTwitch: true }, (cfg) => {
    enabled = cfg.enableTwitch;
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enableTwitch) enabled = changes.enableTwitch.newValue;
  });

  const AD_SELECTORS = [
    '[data-a-target="video-ad-label"]',
    '[data-a-target="video-ad-countdown"]',
    '[data-test-selector="ad-banner-default-text"]',
  ];

  function isAdActive() {
    return AD_SELECTORS.some((sel) => document.querySelector(sel));
  }

  function tick() {
    if (!enabled) return;
    const video = document.querySelector("video");
    if (!video) return;

    const active = isAdActive();
    // Twitch inserta el ad en el mismo stream en vivo (SSAI): no hay boton de
    // skip. Mientras dura: muteamos y aceleramos la reproduccion para quemar el
    // buffer del anuncio y volver al directo antes. Al terminar, restauramos.
    if (active) {
      if (video.dataset.adsMuteRestore === undefined) {
        video.dataset.adsMuteRestore = video.muted ? "1" : "0";
        video.dataset.adsRateRestore = String(video.playbackRate || 1);
      }
      video.muted = true;
      try {
        video.playbackRate = 8;
      } catch (e) {
        /* algunos navegadores limitan el rate */
      }
    } else if (video.dataset.adsMuteRestore !== undefined) {
      video.muted = video.dataset.adsMuteRestore === "1";
      try {
        video.playbackRate = parseFloat(video.dataset.adsRateRestore) || 1;
      } catch (e) {
        /* ignore */
      }
      delete video.dataset.adsMuteRestore;
      delete video.dataset.adsRateRestore;
    }
  }

  // El observador se dispara muchisimo mientras Twitch arma la pagina:
  // throttleamos para no trabar el hilo al inicio (pero corto, para reaccionar
  // rapido al ad).
  let scheduled = false;
  function scheduleTick() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      tick();
    }, 100);
  }

  new MutationObserver(scheduleTick).observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
  setInterval(tick, 250);
})();
