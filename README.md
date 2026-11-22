# MARGOUSH

| Juego | Código vigente | GitHub Pages |
| --- | --- | --- |
| Chupete Rush | `main` · `index.html` | [Jugar al minijuego](https://facundocapello-blip.github.io/margoush-party/) |
| MARGOUSH 3D · El rescate de Margot | `main` · `3d/` | [Jugar la campaña de cuatro actos](https://facundocapello-blip.github.io/margoush-party/3d/) |

La [candidata histórica de Sites](https://margoush-3d-jugabilidad-rc1.facucape.chatgpt.site) corresponde a una compilación del 18 de noviembre. Para retomar la campaña de cuatro actos, usá `main` y la ruta `/3d/` de GitHub Pages.

## Chupete Rush

## Qué incluye
- Minijuego de 30 segundos, control táctil por arrastre de la canasta.
- Diseño pastel para iPhone y escritorio; idiomas español y francés.
- Dificultad progresiva a los 10 y 20 segundos.
- Chupetes dorados, obstáculos, combos de cinco y multiplicador ×2 durante 4,5 segundos.
- Banda sonora original *Petit Sprint* (archivo `assets/petit-sprint.mp3`) y efectos; se activan al tocar Jugar.
- Récords y clasificación semanal/histórica **locales**, guardados en el navegador del jugador.

## Importante sobre el ranking
**GitHub Pages es hosting estático.** El ranking actual es **solo del dispositivo**, no se comparte entre familiares. Para habilitar el ranking individual compartido se necesita un backend y una base de datos persistente (por ejemplo, Supabase). No mostrarlo como online hasta que esté conectado y probado.

## Cómo actualizar
GitHub Pages publica desde `main` / `(root)`. Chupete Rush usa `index.html` y `assets/petit-sprint.mp3`. Para cambiar la campaña, creá la rama desde `main`. Si trabajás en `feat-3d`, incorporá primero el `main` remoto: lo que subas a esa rama entra en el flujo automático de publicación. Al cambiar archivos de `3d/js/` o `3d/css/`, corré `node tools/stamp_versions.mjs` y `npm test`.

## Pruebas
- HTML ejecutado con Chromium en viewport móvil 393×852 y escritorio 1280×800: se verificó renderizado, pantalla inicial, entrada de apodo, arranque, cuenta regresiva y reproducción del MP3.
- Se confirmó que el sitio publicado responde y presenta el título correcto.
- **Pendiente:** prueba manual en Safari físico de iPhone y validación del ranking compartido (aún no implementado).

## Fuente
Chupete Rush deriva de la migración V0.2. El historial de la campaña 3D está en [PROJECT_STATUS.md](PROJECT_STATUS.md).
