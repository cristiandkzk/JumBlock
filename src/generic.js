(function () {
  const HIDE_SELECTORS = [
    'iframe[id^="google_ads_iframe"]',
    "ins.adsbygoogle",
    '[id^="div-gpt-ad"]',
    '[class*="ad-banner" i]',
    '[id^="taboola-"]',
    '[id^="outbrain_widget"]',
    ".OUTBRAIN",
    "[data-ad-slot]",
  ].join(",");

  function hideAds() {
    document.querySelectorAll(HIDE_SELECTORS).forEach((el) => {
      el.style.setProperty("display", "none", "important");
    });
  }

  // Overlays que SECUESTRAN el click: un elemento casi a pantalla completa,
  // por encima de todo, transparente o sin contenido visible, cuyo unico fin es
  // que tu primer click vaya al ad (redirect) en vez de al play. Por comportamiento,
  // sin listas: cubre >= 85% del viewport + z-index alto + no contiene el reproductor.
  function killClickHijackOverlays() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!vw || !vh) return;

    const candidates = document.querySelectorAll("a, div, ins, span");
    candidates.forEach((el) => {
      if (el.dataset.jbChecked === "1") return;

      const style = getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "absolute") return;
      if (style.pointerEvents === "none") return;
      if (style.display === "none" || style.visibility === "hidden") return;

      const z = parseInt(style.zIndex, 10);
      if (!(z >= 1000)) return;

      const rect = el.getBoundingClientRect();
      const coversViewport = rect.width >= vw * 0.85 && rect.height >= vh * 0.85;
      if (!coversViewport) return;

      // No tocar si ADENTRO esta el reproductor real (video/iframe de stream).
      if (el.querySelector("video, iframe")) {
        el.dataset.jbChecked = "1";
        return;
      }

      // Transparente o practicamente vacio = trampa de click. Lo neutralizamos.
      const almostEmpty = el.textContent.trim().length < 3 && el.children.length <= 1;
      const transparent =
        style.backgroundColor === "rgba(0, 0, 0, 0)" || parseFloat(style.opacity) < 0.1;

      if (almostEmpty || transparent || el.tagName === "A") {
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("display", "none", "important");
      }
      el.dataset.jbChecked = "1";
    });
  }

  function sweep() {
    hideAds();
    killClickHijackOverlays();
  }

  sweep();

  let scheduled = false;
  function scheduleHide() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      sweep();
    }, 400);
  }

  new MutationObserver(scheduleHide).observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
