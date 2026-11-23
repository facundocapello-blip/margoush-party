# MARGOUSH · El rescate de Margot

- **Jugar ahora (GitHub Pages):** [https://facundocapello-blip.github.io/margoush-party/3d/](https://facundocapello-blip.github.io/margoush-party/3d/) (la raíz `/` redirige directo a `/3d/` conservando parámetros como `?probar=`).
- **Código vigente:** rama `main` · carpeta `3d/`.

## Qué incluye
- **Campaña completa de 4 Actos (beat 'em up 2.5D + persecución 3D + 4 arenas de jefes):**
  - **Acto 1 (Buenos Aires → Aeropuerto):** Intro en *Le Concept* → Calle porteña → **BIG CHAKY** (duelo de baile disco en escenario con 3 rondas y 3 vidas extra `⭐⭐⭐`).
  - **Acto 2 (Francia):** Persecución 3D del BYD en París → Bonus *¡Rompé el BYD!* → **Cepi «el Niño»** (Arena de pádel en 3 fases: peloteo/Punto de Oro, duelo de flechita y señuelos de cartón).
  - **Acto 3 (Francia → Obrador de Le Blé):** Calle francesa → **Lale «Mantecoso»** (Arena en 3 fases: manteca + bolsas de harina para enharinarlo, patinada y *«Subí el horno»*).
  - **Acto 4 (Tramo final → Galpón):** Última calle → **Pinky «el Trapito» + Margot Heroica** (Arena de estacionamiento con autos en reversa, cobro distraído y remate con el botón **👶 ¡GRITO DE MARGOT!**) → Rescate y foto familiar descargable.
- **Kit completo de poses y movimientos integrado (Grupos A–F):** caminatas y corridas de 6/8/10 cuadros + poses dedicadas de alta resolución para Big Chaky, Cepi, Lale, Pinky, Douge, Marine y Margot, con carga inteligente bajo demanda por arena.
- **Idiomas:** Español y Francés (`ES` / `FR`).
- **Controles:** Joystick táctil flotante y botones en arco para iPhone (vertical y horizontal) + teclado en escritorio.
- **Checkpoints y vida extra:** Guardado automático por acto y por jefe + segunda oportunidad (`⭐`) en cada combate.

## Importante sobre el ranking
**GitHub Pages es hosting estático.** El ranking actual se guarda localmente en el dispositivo hasta que se conecte un proyecto de Supabase en `3d/js/config.js` (esquema listo en `3d/supabase.sql`).

## Cómo actualizar y probar
Al cambiar archivos de `3d/js/` o `3d/css/`, corré:
```bash
node tools/stamp_versions.mjs
npm test
```
El historial detallado del proyecto está en [PROJECT_STATUS.md](PROJECT_STATUS.md).
