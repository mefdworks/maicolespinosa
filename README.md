# Michael Espinosa · Estratega Digital

Panel personal: clientes, tareas, accesos y bitácoras. PWA estática (GitHub Pages) más un widget de iPhone (Scriptable).

**Este repo es público: solo lleva la app.** Ningún dato real vive aquí. Los datos (tareas, clientes, enlaces, bitácoras) salen del Apps Script del agente de Telegram, con una clave que está en el teléfono, no en el código. `?demo` usa datos inventados.

## Estructura

- `index.html`, `assets/app.js`, `assets/portal.css`: el portal. `assets/demo.js`: datos inventados.
- `manifest.webmanifest`, `sw.js`: instalación en la pantalla de inicio (el service worker solo guarda la carcasa, nunca los datos).
- `widget/Panel.js`: widget de Scriptable.
- `robots.txt` y `noindex`: no se indexa.

## Cómo se conecta

1. En el proyecto `agente-telegram` se sube `src/Portal.js` y se redespliega (`clasp deploy -i …`, ver su CLAUDE.md).
2. En el editor del Apps Script se corre `portalCrearTokens()` y `portalSembrar()`. El registro muestra dos enlaces: el del portal y el del widget.
3. El enlace del portal se abre una vez en el iPhone (Safari → Compartir → Agregar a inicio). La clave queda guardada en el teléfono y se borra de la barra de direcciones.
4. El enlace del widget se pega en Scriptable la primera vez que se corre `widget/Panel.js`.

Para rotar una clave: borrar `PORTAL_TOKEN` o `WIDGET_TOKEN` en las propiedades del script y correr `portalCrearTokens()` de nuevo.

## Datos

Las hojas `Clientes` y `Enlaces` del Sheet del agente mandan: se editan ahí. Las bitácoras se leen de Drive (las sincroniza `sync_taller.py` cada 10 minutos).
