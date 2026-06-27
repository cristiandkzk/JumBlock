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

  hideAds();

  let scheduled = false;
  function scheduleHide() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      hideAds();
    }, 400);
  }

  new MutationObserver(scheduleHide).observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
