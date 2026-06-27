# Ad Skip (no bloquea)

Extension MV3 para Chrome/Edge/Brave que detecta publicidad y la saltea, sin bloquear la request del anuncio (el anuncio carga y cuenta como impresion, pero el usuario no tiene que esperarlo).

## Instalar (modo desarrollador)

1. Abrir `chrome://extensions`
2. Activar "Modo de desarrollador" (arriba a la derecha)
3. "Cargar descomprimida" -> elegir esta carpeta (`adskip-extension`)
4. Click en el icono de la extension para abrir el popup y prender/apagar cada modulo

## Que hace cada modulo

- **YouTube**: cuando aparece el boton "Saltar anuncio" lo clickea solo. Si el anuncio no es skippeable todavia, adelanta el video al final (`currentTime = duration`) y mutea mientras dura, restaurando el mute original al terminar.
- **Twitch**: detecta el overlay/label de anuncio y mutea el video mientras esta activo. Twitch inyecta el ad server-side dentro del mismo stream en vivo, asi que no existe forma real de "saltar" tiempo ni un boton de skip; mutear es lo maximo viable.
- **Banners + pop-ups (otras webs)**: apagado por defecto, pide permiso `<all_urls>` (Chrome lo confirma una vez al activarlo). Sin usar listas, hace tres cosas por COMPORTAMIENTO:
  1. Oculta contenedores de ad conocidos (Google Ads/AdSense, Taboola, Outbrain, `data-ad-slot`) por CSS.
  2. **Bloquea pop-ups / pop-unders**: reemplaza `window.open` (script en `document_start`, mundo MAIN) y solo permite UNA apertura justo despues de un click real tuyo; las automaticas o las extra del mismo click se bloquean. Util en sitios de stream/descargas.
  3. **Mata overlays que secuestran el click**: el `<div>`/`<a>` transparente a pantalla completa que hace que tu primer click en "play" sea un redirect; se detecta por cubrir >=85% de la pantalla con z-index alto y sin contenido, y se neutraliza.

## Limitaciones conocidas

- Los selectores de YouTube/Twitch dependen de clases internas no documentadas; si rediseñan el player, hay que actualizar `src/youtube.js` / `src/twitch.js`.
- El ocultamiento generico de banners es naive (lista corta de selectores), no es un filter list completo tipo EasyList; puede dejar espacios en blanco donde estaba el ad.
- No hay bypass de deteccion de adblock de ningun sitio: el anuncio siempre se descarga y se reproduce/renderiza, solo se acorta o se oculta visualmente.
