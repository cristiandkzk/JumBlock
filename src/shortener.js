// Best-effort para acortadores con peaje (exe.io, ouo.io, adf.ly, etc.).
// Auto-clickea los botones de avance ("Continue", captcha PINTADO, "Get link")
// y pone en cero los contadores de pantalla.
//
// LIMITES HONESTOS (no se pueden sortear desde una extension simple):
//  - Pasos que exigen un click REAL: el navegador marca los clicks por codigo
//    con isTrusted=false y muchos de estos sitios lo chequean.
//  - reCAPTCHA de Google de verdad (no el boton pintado).
//  - Cuentas regresivas atadas a un token del servidor.
// Para esos casos usar FastForward (reglas por-sitio mantenidas por la comunidad).
(function () {
  // Frases de los botones de avance (sin acentos, en minuscula).
  const ADVANCE_TEXTS = [
    "no soy un robot",
    "i'm not a robot",
    "im not a robot",
    "i am human",
    "soy humano",
    "continue",
    "continuar",
    "get link",
    "obtener enlace",
    "get url",
    "click here to continue",
    "haz clic",
    "skip ad",
    "skip",
    "saltar",
    "verify",
    "verificar",
    "proceed",
    "next",
    "siguiente",
  ];

  function norm(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // saca acentos
      .trim();
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return false;
    const st = getComputedStyle(el);
    return st.display !== "none" && st.visibility !== "hidden" && st.opacity !== "0";
  }

  // Click "completo" (mousedown/up + click). No vuelve isTrusted=true, pero
  // alcanza para los sitios que no lo validan.
  function fullClick(el) {
    if (el.dataset.jbClicked === "1") return;
    el.dataset.jbClicked = "1";
    const opts = { bubbles: true, cancelable: true, view: window };
    try {
      el.dispatchEvent(new MouseEvent("mouseover", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.click();
    } catch (e) {
      try {
        el.click();
      } catch (e2) {
        /* ignore */
      }
    }
    // permitimos re-clickear ese mismo boton mas tarde si reaparece habilitado
    setTimeout(() => {
      delete el.dataset.jbClicked;
    }, 4000);
  }

  function clickAdvanceButtons() {
    const els = document.querySelectorAll(
      'button, a, input[type="button"], input[type="submit"], [role="button"]'
    );
    els.forEach((el) => {
      if (el.disabled) return;
      if (!isVisible(el)) return;
      const txt = norm(el.innerText || el.value || el.getAttribute("aria-label"));
      if (!txt) return;
      if (ADVANCE_TEXTS.some((t) => txt.includes(t))) {
        fullClick(el);
      }
    });
  }

  // Tildar checkboxes de captcha pintado ("No soy un robot").
  function checkFakeCaptchas() {
    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (!cb.checked && isVisible(cb)) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        fullClick(cb);
      }
    });
  }

  // Forzar a cero los contadores de PANTALLA (los que solo muestran segundos).
  function zeroCountdowns() {
    const nodes = document.querySelectorAll(
      '[id*="count" i], [class*="count" i], [id*="timer" i], [class*="timer" i], [id*="seconds" i], [class*="seconds" i]'
    );
    nodes.forEach((n) => {
      if (/^\s*\d{1,3}\s*$/.test(n.textContent)) {
        n.textContent = "0";
      }
    });
  }

  function step() {
    zeroCountdowns();
    checkFakeCaptchas();
    clickAdvanceButtons();
  }

  step();
  setInterval(step, 900);

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      step();
    }, 300);
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
