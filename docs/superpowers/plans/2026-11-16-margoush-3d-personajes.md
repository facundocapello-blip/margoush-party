# MARGOUSH 3D — Personajes: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Malos con pinta y movimiento propios, Lale/Cepi/Pinky, Facu en apariciones repentinas y portada solo con el logo.

**Architecture:** Three.js r128 + módulos ES sin build (como hoy). Las poses salen de una hoja de 4 cuadros por personaje (`<id>_sheet` en `assets/manifest.json`); si la hoja todavía no existe, el personaje usa su textura actual (respaldo). El comportamiento vive en `enemies.js`; la manteca en `butter.js`; Facu y Pinky en `cameos.js` (reemplaza al auto que acompaña de `facu.js`).

**Tech Stack:** Three.js r128, Playwright + Chrome sin pantalla (`tests/e2e`), `node --test` (unit), Python 3 + Pillow + numpy + pytest (`tools/`).

**Spec:** `docs/superpowers/specs/2026-11-16-margoush-3d-personajes-design.md`

## Global Constraints

- Caricaturas de costado, mirando a la derecha; el código espeja (`setFacing`).
- Textos en español rioplatense. Sin escudos, logos ni marcas reales (Pinky: camiseta azul con franja amarilla).
- Peso total de `3d/assets` < 6 MB (hoy 2,7 MB).
- Toda amenaza nueva avisa ≥ 0,8 s antes (embestida del patovica, manteca).
- El juego siempre jugable con el arte actual mientras falten hojas nuevas.
- Chupete Rush (`index.html` raíz) y `preview-v*/` no se tocan. No merge a `main`.
- Cada tarea termina con la suite completa verde: `npm test` y `for f in tests/e2e/*.e2e.mjs; do node $f; done`.

## Review Focus

- **Pantalla vertical 390×844 y 320×568:** la portada nueva, Cepi en el resultado y los carteles de Pinky/Facu no tapan botones ni el puntaje → assert de no-superposición en Task 1 y Task 6.
- **Perder durante la transición o el rescate / volver al menú en medio de una aparición:** ninguna aparición queda colgada en la escena siguiente → Task 6 y Task 7: `clearRun()` limpia `cameos` y `butter`; test "volver al menú en medio de Pinky no deja actores".
- **Manteca en el borde de un portón cerrado o bache:** el patinazo nunca cruza ni cae → Task 5 test con manteca a 1 m del bache y a 1 m del piquete.
- **Hoja de poses con fondo mal recortado (restos de color, cuadros de distinto alto):** `tools/cut_sheet.py` debe alinear pies y no dejar píxeles del color de fondo → Task 3 test con imagen sintética.
- **Oleada grande (5 malos, varios de distancia):** nunca más de 2 cuerpo a cuerpo + 1 a distancia atacando → Task 2 test con la oleada `boulevard-2`.

---

### Task 1: Portada solo con el logo

**Files:**
- Modify: `3d/index.html` (sacar `#cover-facu`, `.ribbon`, `#cover-heroes`, `#cover-chaky`; sacar el `<p class="hint">Facu te acompaña…</p>` de `#screen-select`)
- Modify: `3d/css/game.css` (borrar reglas huérfanas de esos elementos; recentrar `.cover-title`)
- Modify: `3d/js/main.js` (si algo anima/lee esos nodos, quitarlo)
- Test: `tests/e2e/cover.e2e.mjs`

- [ ] **Step 1: Cambiar el test.** En la línea 16 reemplazar la lista por `['#screen-menu .logo']` visible, y agregar en los dos tamaños: `check(await page.$$eval('#cover-chaky, #cover-heroes, #cover-facu, #screen-menu .ribbon', n => n.length) === 0, \`${name}: la portada no muestra a BIG CHAKY ni a nadie más\`)` y `check(!(await page.textContent('#screen-select')).includes('Facu te acompaña'), 'la selección no promete a Facu todo el camino')`.
- [ ] **Step 2:** `node tests/e2e/cover.e2e.mjs` → FALLA en "no muestra a BIG CHAKY".
- [ ] **Step 3:** Hacer los cambios de Files. Logo con su caída y rebote, reflectores y "TOCÁ PARA EMPEZAR" sin cambios.
- [ ] **Step 4:** cover pasa (incluido "no tapa los botones" en 844×390 y 390×844); suite completa verde.
- [ ] **Step 5:** Commit `feat(3d): portada solo con el logo MARGOUSH`, push a `feat-3d`, republicar la vista previa (artefacto `ea7d7c82-5746-4d49-a314-e9a01f529039`, solo archivos cambiados).

### Task 2: Comportamiento propio de cada malo (arte actual)

**Files:**
- Modify: `3d/js/enemies.js`
- Test: `tests/e2e/enemies.e2e.mjs`

**Interfaces:**
- Produces: `KINDS[kind].gait = { cadence: number /* pasos por m */, bob: number /* m */ }`; `KINDS[kind].ranged: boolean`; `export const MAX_RANGED = 1`; `export const PATOVICA = { warn: 0.85, speed: 9, run: 7 }`; estado nuevo `e.state === 'wait'` (esperando turno); `e.state === 'charge'` también para el patovica (con `e.lane` como el delivery). `enemies.attacking() → { melee: number, ranged: number }`.

- [ ] **Step 1: Tests nuevos** (cada uno con `setStage` + `enemies.clear()` + `spawn`, héroe con 99 de vida):
  - `oleada grande respeta turnos`: `setStage('boulevard')` con la oleada real; muestrear cada 50 ms durante 8 s `enemies.attacking()`; `check(maxMelee <= 2 && maxRanged <= 1)`.
  - `los que esperan miran al héroe y no tiemblan`: 3 secuaces + 2 patovicas, el héroe quieto 3 s; para cada malo en `wait`, `actor.facing === sign(hero.x - e.x)` y su desplazamiento total en el último 1 s < 0,6 m.
  - `el patovica anuncia la embestida`: patovica a 6 m en el mismo carril; medir tiempo entre `e.lane.visible` y `e.state === 'charge'` ≥ 800 ms; quedarse en el carril saca 1 corazón; esquivar (dodge) no.
  - `el secuaz ataca por el lado de atrás`: héroe mirando a la derecha, secuaz spawneado a la derecha; al empezar su `windup`, `sign(e.x - hero.x) === -hero.actor.facing` en al menos 1 de 3 intentos (puede no lograr rodear si el borde lo impide).
  - `el bombo salta a tiempo`: su `actor.lift` tiene ≥ 3 picos en 2 s mientras camina.
- [ ] **Step 2:** `node tests/e2e/enemies.e2e.mjs` → FALLAN los nuevos.
- [ ] **Step 3: Implementar en `enemies.js`:**
  - `attacking()`: melee = secuaz/patovica en `windup|strike|charge`; ranged = bombo en `drum`, mozo con tiro en vuelo, delivery en `ring|charge`, lale en `throw` (Task 5). Antes de iniciar un ataque a distancia, si `ranged >= MAX_RANGED`, esperar (no consumir `cd`).
  - `wait`: el malo que no puede atacar va a un anillo a 3,4 m del héroe (su `slotZ`), se detiene ahí (sin re-apuntar si la diferencia < 0,4 m: evita el temblor), mira al héroe y cada 3–5 s hace una burla (`fx.popup` corto con una de `['¡Vení!','¡Dale!','¡Jaja!']`, sin sonido).
  - Caminar: `actor.lift` = `|sin(dist * cadence * π)| * bob` según `gait` (secuaz `{2.2, 0.14}`, patovica `{1.1, 0.06}` + `fx.dust` y `fx.shake(0.04)` por paso, bombo `{2.0, 0.22}` a tiempo de 0,5 s, mozo `{0, 0}` deslizándose con `lean` 0, delivery sin cambios).
  - Secuaz: elige el lado opuesto al que mira el héroe si está libre; 30 % de las veces amaga (se acerca a 1 m y retrocede a 2,5 m) antes del `windup`.
  - Patovica: además del golpe actual, si está a 4–8 m en el mismo carril (`|dz| < 0.8`) y `cd <= 0`: franja + `e.state='ring'` `PATOVICA.warn` s → `charge` a `PATOVICA.speed` por `PATOVICA.run` m (mismo código que el delivery, con `shove` al pegar) → `hitstun` corto. Los golpes con `strength <= 1.2` no lo sacan de `charge`.
- [ ] **Step 4:** enemies pasa; suite completa verde (combat y story incluyen bot de partida completa: si tardan más de su límite, ajustar velocidades, no los límites del test).
- [ ] **Step 5:** Commit `feat(3d): cada malo se mueve a su manera; turnos para atacar`, push, republicar.

### Task 3: Poses por hoja con respaldo + herramienta de recorte

**Files:**
- Create: `tools/cut_sheet.py`, `tools/test_cut_sheet.py`
- Create: `3d/js/cast.js`
- Modify: `3d/js/enemies.js` (usar poses), `3d/js/assets.js` si hace falta para `has(name)`
- Test: `tests/e2e/enemies.e2e.mjs`

**Interfaces:**
- Produces (Python): `cut_sheet.py <entrada.png> <id> [--frames 4] [--bg auto|#RRGGBB]` → escribe `3d/assets/<id>_sheet.webp` (cuadros iguales en fila, fondo transparente, pies alineados al borde inferior, alto 400 px) y agrega/actualiza en `manifest.json`: `{ "file": "<id>_sheet.webp", "w", "h", "frames": 4, "cols": 4, "rows": 1, "skull": <px> }`. `skull` = alto de la cabeza estimado como en `extract_assets.py` (reusar su función).
- Produces (JS): `cast.js`: `export const POSE_CELLS = { idle: 0, step: 1, strike: 2, hurt: 3 }`; `export function sheetPoses(assets, id, fallbackTex) → { idle, step, strike, hurt }` (cada una `{ tex, cell }` sobre `<id>_sheet` si `assets.has(id + '_sheet')`; si no, las cuatro `{ tex: fallbackTex }`). Ids de personaje: `secuaz, patovica, bombo, mozo, delivery, lale, cepi, pinky`.
- Consumes: `SpriteActor` con `poses` y `setPose(name)` (ya existe).

- [ ] **Step 1: Test Python** `test_cut_sheet.py`: genera con Pillow una imagen 1600×500 fondo `#00FF00` con 4 rectángulos de distinto alto y posición vertical; corre la herramienta sobre una copia de manifest en un directorio temporal; asserts: salida con 4 cuadros de igual ancho; ningún píxel opaco con `g > 200 and r < 80 and b < 80`; la fila más baja con alfa > 0 de cada cuadro es la misma (±2 px); manifest con `frames == 4`.
- [ ] **Step 2:** `python3 -m pytest tools/test_cut_sheet.py -q` → FALLA (no existe).
- [ ] **Step 3:** Implementar `cut_sheet.py` (fondo: color de las esquinas si `auto`; tolerancia en distancia de color + borde suavizado 1 px; separar cuadros por columnas vacías y, si no las hay, en 4 partes iguales; recortar cada cuadro a su contenido; pegar en celdas del ancho máximo alineando pies abajo y centrado horizontal; webp calidad 82).
- [ ] **Step 4:** pytest pasa.
- [ ] **Step 5: Test e2e** en enemies: con un manifest sin hojas, `cast` devuelve respaldo y los malos se ven (test actual "cinco malos, cinco dibujos distintos" sigue pasando). Con una hoja de prueba inyectada (`assets.add('secuaz_sheet', texturaCanvas4Celdas, meta)` antes de spawnear): el secuaz caminando alterna `pose` entre `idle` y `step`; en `windup` está en `idle` con `lean > 0`; en `strike` en `strike`; tras un golpe, `hurt`.
- [ ] **Step 6:** Implementar `cast.js` y usarlo en `spawn()` de `enemies.js`: caminar alterna `idle/step` cada `1 / cadence` m recorridos; `windup → idle` + `lean`; `strike|charge|drum|throw → strike`; `hitstun|dead → hurt`.
- [ ] **Step 7:** suite completa verde. Commit `feat(3d): poses por hoja con respaldo y herramienta de recorte`, push.

### Task 4: Dibujos (con Facu)

No es código; destraba Task 8. Se puede hacer en paralelo a Tasks 5–7.

- [ ] **Step 1:** Escribir `docs/superpowers/specs/2026-11-16-prompts-personajes.md`: un prompt por personaje (tabla de poses de la sección 6.1 del diseño), en el mismo esqueleto: "Hoja de personaje: 4 poses del mismo personaje en una fila, mismo tamaño, cuerpo entero, de perfil mirando a la derecha, estilo exactamente igual a la imagen de referencia (caricatura, contorno, colores), fondo verde liso #00FF00 sin sombras ni piso. Poses: 1) … 2) … 3) … 4) …". Personajes de la banda sin foto; Lale, Cepi y Pinky "con la cara de la persona de la foto".
- [ ] **Step 2:** Generar con Canva `generate-image` adjuntando `douge_idle.webp` (estilo) y, para amigos, la foto que mande Facu (subir con `create-upload-url`). Mostrar cada resultado a Facu; si el parecido falla, pasarle el prompt para Gemini/ChatGPT.
- [ ] **Step 3:** Guardar las imágenes aprobadas en `tools/sheets_src/<id>.png` (no se publican).

### Task 5: Lale «Mantecoso» y la manteca

**Files:**
- Create: `3d/js/butter.js`
- Modify: `3d/js/enemies.js` (kind `lale`), `3d/js/level.js` (spawns), `3d/js/hero.js` (`slide`), `3d/js/score.js` (`KILL.lale = 200`), `3d/js/skins.js` (respaldo `courier_lale`: campera amarilla + paleta de pádel pintada), `3d/js/main.js` (crear/actualizar/limpiar `butter`)
- Test: `tests/e2e/friends.e2e.mjs` (nuevo)

**Interfaces:**
- Produces: `KINDS.lale = { tex: 'courier_lale', hp: 4, scale: 1, speed: 3.0, ai: 'lale', ranged: true, points: 'lale', name: 'LALE «MANTECOSO»' }`; `export const LALE = { every: 3.2, flight: 0.9, keep: 6, slipChance: 0.35 }`.
- Produces: `createButter(ctx) → { list, drop(x, z), update(dt), clear() }`; `BUTTER = { life: 6, radius: 0.7, slide: 0.5, speed: 5 }`. Cada barra: sombra creciente durante `LALE.flight` (aviso ≥ 0,8 s), luego mancha amarilla que dura `BUTTER.life` s.
- Produces: `hero.slide(dirX, seconds)`: durante `slideT > 0` el héroe avanza a `BUTTER.speed` en `dirX`, no puede caminar, puede pegar y saltar; no es invulnerable. Antes de mover, recorta el avance con `world.clampPosition` (portones) y con `traps.safeStop(x0, x1, z) → x` (nuevo en `traps.js`: el punto más lejano antes del borde de un bache o a `TIMING.fire.reach + 0.2` del fuego cerrado).
- Waves: agregar `{ dx: 9, dz: 1.2, kind: 'lale' }` a `vereda-2` y `{ dx: 9, dz: -1.2, kind: 'lale' }` a `francia`. Al spawnear un `lale`, `game.banner('LALE «MANTECOSO»', '¡Cuidado con la manteca!')`.

- [ ] **Step 1: Tests** en `friends.e2e.mjs` (héroe 5 de vida, trampas desactivadas salvo donde se diga):
  - `la manteca avisa`: forzar `butter.drop(hx+2, hz)`; la sombra visible ≥ 800 ms antes de que exista la mancha.
  - `pisar la manteca hace patinar sin dañar`: mancha en `hx+1`; caminar a la derecha 600 ms; `hero.slideT` fue > 0, `hp === 5`, x avanzó ≥ 1,5 m más que caminando.
  - `el patinazo frena antes del bache`: mancha a 2 m del borde izquierdo de un bache de `TRAPS`; tras patinar, `hp === 5` y x < borde del bache.
  - `el patinazo frena antes del piquete cerrado`: `setStage('piquete')`, mancha a 1,5 m del fuego; `hp === 5` y `x < gate.x - TIMING.fire.reach`.
  - `Lale tira manteca y a veces se resbala`: spawnear lale con `Math.random` fijado (`page.evaluate` que sobreescribe a 0.1); en 5 s hay ≥ 1 barra; pegarle una vez → su pose/estado `slipped` (cae, `stun` 1 s).
  - `puntos de Lale`: matarlo suma `KILL.lale` × combo.
  - `aparece en vereda-2 y francia con su cartel`.
- [ ] **Step 2:** fallan.
- [ ] **Step 3:** implementar (Lale: mantiene `LALE.keep` m como el mozo; ataque `throw` usa el turno de distancia de Task 2; al recibir golpe, con `slipChance` pasa a `slipped`: pose `hurt`, `lift` 0, `lean` −1,2, `stun` 1 s, `fx.popup('¡PLAF!')`).
- [ ] **Step 4:** pasan; suite completa verde.
- [ ] **Step 5:** Commit `feat(3d): Lale «Mantecoso» y la manteca`, push, republicar.

### Task 6: Cepi al perder y Pinky

**Files:**
- Create: `3d/js/cameos.js`
- Modify: `3d/js/ui.js` (`showResult`), `3d/css/game.css`, `3d/js/main.js` (crear/actualizar/limpiar `cameos`)
- Test: `tests/e2e/friends.e2e.mjs`

**Interfaces:**
- Produces: `CEPI_LINES = ['¡¿Perdiste?! ¡No te lo puedo creer!', '¡Dale, que es fácil, che!', '¡Andá a jugar a la bolita!']`. En `showResult(result)`: si `!result.won`, nodo `#cepi` (img de su hoja o respaldo `assets.url('courier')` con filtro, alternando poses 0/1 cada 0,3 s por CSS `steps`) que entra desde la derecha en 0,25 s, con `.bubble` de una frase al azar y `audio.sfx('boo')` (nuevo, sintetizado corto). Si `won`, no existe `#cepi`. A los 2,5 s se achica a una esquina (`.cepi-docked`) sin tapar `#result-total`, `#btn-save`, `#btn-again`.
- Produces: `createCameos(ctx) → { update(dt), onLevelStart(level), clear(), pinky: { shown: {1:bool,2:bool}, actor|null } }`. Pinky: en cada nivel, la primera vez que `enemies.alive() === 0`, no hay oleada activa y pasaron ≥ 4 s desde el último cartel, entra desde atrás del héroe (fuera de cámara) a 7 m/s con cartel `game.banner('PINKY', '¡Aguantá que te ayudo!')`; frena a 2,5 m; 0,8 s parado; `fx.popup('📻 ¡GOOOL!')` + `audio.sfx('goal')`; 0,8 s festejando (pose 3, saltos); sale corriendo para el otro lado a 9 m/s con `'¡Me voy a la cancha!'` y se borra al salir de cámara. Respaldo: `courier` recoloreado azul con franja amarilla (`skins.js`, id `courier_pinky`).

- [ ] **Step 1: Tests:**
  - `Cepi aparece solo al perder`: forzar `finish(false)` → `#cepi` visible con un texto de `CEPI_LINES`; `finish(true)` en otra partida → no hay `#cepi`.
  - `Cepi no tapa nada` en 390×844 y 844×390 a los 3 s: sin superposición con `#result-total`, `#btn-save`, `#btn-again`.
  - `Pinky aparece una vez por nivel y nunca con malos vivos`: `setStage('vereda')` con bot hasta despejar; esperar ≤ 8 s → `cameos.pinky.shown[1] === true` y en el momento de entrar `enemies.alive() === 0`; seguir 20 s más → no vuelve a aparecer.
  - `Pinky no frena el juego`: mientras está, `game.state === 'playing'` y el héroe camina.
  - `volver al menú en medio de Pinky no deja actores`: menú durante su aparición → `cameos.pinky.actor === null` y la escena no tiene su mesh.
- [ ] **Step 2:** fallan. **Step 3:** implementar. **Step 4:** pasan; suite verde.
- [ ] **Step 5:** Commit `feat(3d): Cepi se enoja cuando perdés; Pinky viene a ayudar y se va a ver a Boca`, push, republicar.

### Task 7: Facu en apariciones repentinas

**Files:**
- Modify: `3d/js/facu.js` (sin auto que acompaña; queda como controlador de apariciones), `3d/js/main.js` (quitar `facu.say` de intro, `le-concept` y rescate; quitar `facu.park` de portones/transición/rescate; quitar `facu.celebrate`), `3d/js/level.js` (sacar `facu:` de `le-concept`), `3d/js/ui.js` (host del resultado), `3d/js/story.js` si la intro lo nombra
- Test: `tests/e2e/facu.e2e.mjs` (reescribir)

**Interfaces:**
- Produces: `createFacu(ctx) → { actor, car, appearances: [{ kind, level, t }], update(dt), onLevelStart(level), onTransition(), clear(), dispose() }`. Tipos (`kind`): `'manhole'` (una por nivel, garantizada: la primera vez que hay ≥ 3 malos vivos a < 4 m del héroe; sale de una tapa en el piso a 2 m del héroe con salto + aplastado; `stunAround(h.x, h.z, 4, 1.5)`; popup de `FACU_LINES.jokes`; se mete a los 1,2 s), `'car'` (una por nivel: cruza el carril de atrás de izquierda a derecha en 1,5 s, bocina `sfx('horn')`, Facu saludando; en N1 con x del héroe entre 30 y 45, en N2 entre 212 y 225 o al primer momento sin oleada activa en ese tramo), `'france'` (en `onTransition`: cartel `🎤 FACU` con su cara y `'¡Allez, allez!'` + boina y baguette pintadas sobre el avatar), `'result'` (en `showResult` si `won`: `.host` asoma desde abajo-izquierda 1,5 s con `'¡Bien ahí!'` y se va; si `!won` no aparece).
- Quitar: `FACU_LINES.intro`, `FACU_LINES.result`, el seguimiento del auto, `park`, `celebrate`, la etiqueta `FACU` permanente.

- [ ] **Step 1: Reescribir tests de `facu.e2e.mjs`:**
  - `Facu no acompaña`: caminar 20 m por la vereda sin malos → el auto no está visible en cámara en ≥ 90 % de las muestras.
  - `la alcantarilla aparece una vez por nivel cuando hay 3 malos cerca`: spawnear 3 secuaces a 2 m → en ≤ 1 s `appearances` tiene `manhole` nivel 1 y ≥ 2 aturdidos; spawnear otros 3 → no hay una segunda en nivel 1.
  - `el auto cruza en ≤ 2 s y no pega ni ayuda`: forzar su tramo; la vida de héroe y malos no cambia.
  - `en la intro y el rescate Facu no habla`: ningún banner con título `🎤 FACU` durante intro ni rescate.
  - `Francia con boina`: tras la transición hay un banner `🎤 FACU` con `'¡Allez, allez!'`.
  - `apariciones por partida`: el bot de partida completa (de `story.e2e`) registra exactamente `manhole`×2, `car`×2, `france`×1, `result`×1.
- [ ] **Step 2:** fallan. **Step 3:** implementar. **Step 4:** pasan; ajustar `story.e2e`/`combat.e2e` si dependían del chiste cada 12 s (sin bajar sus límites de tiempo). Suite verde.
- [ ] **Step 5:** Commit `feat(3d): Facu aparece de golpe y en chiste; deja de acompañar`, push, republicar.

### Task 8: Integrar los dibujos

Se repite por cada hoja que llega de Task 4.

- [ ] **Step 1:** `python3 tools/cut_sheet.py tools/sheets_src/<id>.png <id>`; abrir el webp y mirarlo (pies alineados, sin verde).
- [ ] **Step 2:** `python3 tests/check_sprites.py 3d/assets` sigue pasando; `du -sh 3d/assets` < 6 MB.
- [ ] **Step 3:** captura del personaje en juego (`shot`) caminando, atacando y golpeado; revisar a ojo junto a Douge/Marine (misma escala de cabeza vía `skull`).
- [ ] **Step 4:** suite completa verde; actualizar `PROJECT_STATUS.md`; commit `art(3d): dibujo de <id>`, push, republicar.
