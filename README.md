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
- **Banners (otras webs)**: oculta contenedores de ad conocidos (Google Ads/AdSense, Taboola, Outbrain, slots genericos `data-ad-slot`, etc) por CSS, sin bloquear la request. Apagado por defecto porque pide permiso de host en todas las paginas (`<all_urls>`); al activarlo desde el popup, Chrome pide confirmar ese permiso una sola vez.

## Limitaciones conocidas

- Los selectores de YouTube/Twitch dependen de clases internas no documentadas; si rediseñan el player, hay que actualizar `src/youtube.js` / `src/twitch.js`.
- El ocultamiento generico de banners es naive (lista corta de selectores), no es un filter list completo tipo EasyList; puede dejar espacios en blanco donde estaba el ad.
- No hay bypass de deteccion de adblock de ningun sitio: el anuncio siempre se descarga y se reproduce/renderiza, solo se acorta o se oculta visualmente.
