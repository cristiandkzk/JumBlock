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

  // Cartel que tapa el video mientras corre el ad (no se puede saltar tiempo en
  // un stream EN VIVO sin chocar el borde del directo y trabarse).
  let cover = null;
  const IMG_URL = chrome.runtime.getURL("icons/icon.png");
  function showCover(player) {
    if (cover && cover.isConnected) return;
    cover = document.createElement("div");
    Object.assign(cover.style, {
      position: "absolute",
      inset: "0",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      background: "#0e0e10",
      color: "#adadb8",
      font: "600 15px system-ui, sans-serif",
      pointerEvents: "none",
    });

    const img = document.createElement("img");
    img.src = IMG_URL;
    Object.assign(img.style, {
      width: "min(40%, 220px)",
      height: "auto",
      imageRendering: "pixelated",
      borderRadius: "16px",
    });

    const label = document.createElement("div");
    label.textContent = "Publicidad de Twitch (silenciada)…";

    cover.appendChild(img);
    cover.appendChild(label);

    const host = player || document.querySelector(".video-player__overlay") || document.body;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(cover);
  }
  function hideCover() {
    if (cover) {
      cover.remove();
      cover = null;
    }
  }

  function tick() {
    if (!enabled) return;
    const video = document.querySelector("video");
    if (!video) return;

    const active = isAdActive();
    // Twitch inserta el ad en el mismo stream EN VIVO (SSAI): no hay boton de
    // skip. Acelerar a una velocidad FIJA traba (se choca el borde del directo
    // y el player se queda sin datos). Por eso la velocidad es ADAPTATIVA:
    // acelera solo si hay buffer descargado por delante y baja a 1x cerca del
    // borde, para cortar algo del ad sin trabarse. Ademas: mutea y tapa.
    if (active) {
      if (video.dataset.adsMuteRestore === undefined) {
        video.dataset.adsMuteRestore = video.muted ? "1" : "0";
        video.dataset.adsRateRestore = String(video.playbackRate || 1);
      }
      video.muted = true;
      setAdaptiveRate(video);
      showCover(video.closest(".video-player, .persistent-player") || video.parentElement);
    } else {
      hideCover();
      if (video.dataset.adsMuteRestore !== undefined) {
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
  }

  // Velocidad segun cuanto buffer hay descargado por delante del cursor.
  // Mucho buffer -> acelera; poco -> 1x para no chocar el directo y trabarse.
  function setAdaptiveRate(video) {
    let ahead = 0;
    try {
      if (video.buffered && video.buffered.length) {
        ahead = video.buffered.end(video.buffered.length - 1) - video.currentTime;
      }
    } catch (e) {
      ahead = 0;
    }

    let rate;
    if (ahead > 8) rate = 4;
    else if (ahead > 5) rate = 2.5;
    else if (ahead > 3) rate = 1.5;
    else rate = 1; // cerca del borde: no acelerar (evita el stall)

    if (video.playbackRate !== rate) {
      try {
        video.playbackRate = rate;
      } catch (e) {
        /* algunos navegadores limitan el rate */
      }
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
