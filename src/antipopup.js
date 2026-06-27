// Corre en el MUNDO PRINCIPAL (mismo contexto que la pagina) y en document_start,
// para reemplazar window.open ANTES de que los scripts del sitio lo usen.
// No usa listas: bloquea por COMPORTAMIENTO (aperturas sin click real, o varias
// por un mismo click = pop-under).
(function () {
  if (window.__jumpblockAntipopup) return;
  window.__jumpblockAntipopup = true;

  const realOpen = window.open.bind(window);
  let lastTrusted = 0;
  let openedThisGesture = false;

  function markGesture(e) {
    if (e && e.isTrusted) {
      lastTrusted = Date.now();
      openedThisGesture = false;
    }
  }
  // captura: corremos antes que los handlers del sitio
  document.addEventListener("click", markGesture, true);
  document.addEventListener("keydown", markGesture, true);
  document.addEventListener("auxclick", markGesture, true);

  function fakeWindow() {
    // Objeto inerte para que el script del ad no explote al usar el "window".
    const noop = function () {};
    return {
      closed: true,
      close: noop,
      focus: noop,
      blur: noop,
      postMessage: noop,
      moveTo: noop,
      resizeTo: noop,
      location: { href: "", replace: noop, assign: noop },
      document: { write: noop, writeln: noop, close: noop },
    };
  }

  function allowed() {
    const recent = Date.now() - lastTrusted < 1000;
    if (!recent) return false; // sin click reciente -> auto pop-up
    if (openedThisGesture) return false; // ya se abrio una en este click -> pop-under
    openedThisGesture = true;
    return true; // la PRIMERA apertura justo despues de un click real
  }

  function guardedOpen(url, name, features) {
    if (allowed()) {
      return realOpen(url, name, features);
    }
    try {
      console.debug("[JumpBlock] pop-up bloqueado:", url || "(sin url)");
    } catch (e) {
      /* ignore */
    }
    return fakeWindow();
  }

  // Intentamos blindar la propiedad para que el sitio no la reasigne.
  try {
    Object.defineProperty(window, "open", {
      configurable: true,
      enumerable: true,
      get() {
        return guardedOpen;
      },
      set() {
        /* ignoramos reasignaciones del sitio */
      },
    });
  } catch (e) {
    // si no se puede blindar, al menos la reemplazamos.
    window.open = guardedOpen;
  }
})();
