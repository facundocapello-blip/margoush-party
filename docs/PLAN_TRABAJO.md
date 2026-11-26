# MARGOUSH 3D · Plan de trabajo para otros modelos (desde el 26/11/2026)

Lo armó Claude para que otro modelo (Gemini, Astra u otro) **haga cambios, genere el arte que falte, haga commit y push** mientras Facu no usa Claude.
Base: `main` en `ed53fc4` (Etapa D parte 1). Juego: `3d/` (Three.js r128, sin build). Se publica en
https://facundocapello-blip.github.io/margoush-party/3d/

---

## 0. Cómo se trabaja (leer antes de cada tarea)

### Reglas fijas (no negociables)
- Leé `AGENTS.md` y las últimas 3 secciones de `PROJECT_STATUS.md` antes de tocar nada.
- **Una tarea = un commit = un push.** No juntes tareas. Si una tarea pide más de ~300 líneas cambiadas, partila.
- Decisiones cerradas: sin barriles de Big Chaky (es duelo de baile), sin Chupete Rush, sin piquete, ranking **local**, jefes solo en sus arenas, sin servicios pagos, sin carteles de instrucciones («es evidente lo que hay que hacer»).
- Mantener: controles táctiles (joystick + botones en arco), español/francés, audio recién después de un toque del usuario, celular en vertical. Objetivo real: **Safari en iPhone 15 Pro Max**. Una prueba en Chrome **no** es una prueba en Safari: no lo afirmes.
- **Imágenes:** sí podés generarlas e integrarlas, siguiendo **al pie de la letra** la sección «ARTE Y ANIMACIÓN (A)». Solo con herramientas gratis (Gemini / Nano Banana de la cuenta de Facu, o Grok). **Nunca** Flow ni nada que gaste créditos pagos. Si no podés generar imágenes vos mismo, armá el ZIP para Facu (ver A) y seguí con otra tarea.
- Si algo requiere una decisión de diseño que no está acá, **no la inventes**: anotala como «Pendiente para Facu/Claude» en `PROJECT_STATUS.md` y pasá a la tarea siguiente.

### Git: siempre en la rama `feat-3d`
Subir a `feat-3d` publica solo: la acción `.github/workflows/publicar-feat-3d.yml` la mergea en `main` y GitHub Pages se actualiza en 1–2 minutos.

**Al empezar la sesión:**
```bash
git fetch origin
git checkout feat-3d
git merge origin/main        # feat-3d tiene que tener todo lo de main antes de cambiar nada
```

**Por cada tarea, antes del commit (obligatorio, en este orden):**
```bash
node --check 3d/js/<archivo-que-tocaste>.js   # uno por archivo JS tocado
node tools/stamp_versions.mjs                 # si tocaste JS o CSS de 3d/ (sin esto Safari mezcla versiones viejas)
npm test                                      # tiene que pasar todo. Si falla: NO hacés push, arreglás o revertís
```
Además: sumá una sección al final de `PROJECT_STATUS.md` con el formato
```
## AAAA-MM-DD · <ID tarea>: <título corto> (hecho por <modelo>)
- Qué cambió (archivos).
- Verificación: npm test N/N; e2e que corriste; qué NO se pudo probar (Safari físico).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=<tramo>
- Rollback: `git revert <hash de este commit>` en feat-3d y push.
```
y marcá la tarea como `[x]` en este archivo (`docs/PLAN_TRABAJO.md`).

**Commit y push:**
```bash
git add -A
git commit -m "[<ID>] <descripción corta en español>" -m "Hecho por: <modelo>"
git push origin feat-3d
```
- Si el push es rechazado: `git pull --rebase origin feat-3d`, volvé a correr `npm test` y reintentá.
- **Prohibido:** `git push --force`, push directo a `main`, borrar ramas, reescribir historia, `git reset --hard` sobre commits ya subidos.
- Si el push se corta por red, reintentá una vez.

**Después del push:** esperá ~2 min y comprobá que Pages sirve lo nuevo:
```bash
curl -s https://facundocapello-blip.github.io/margoush-party/3d/ | grep -o '<archivo>.js?v=[a-z0-9]*'
```
El hash tiene que coincidir con el de `3d/index.html` local. Recién ahí le pasás a Facu **el link de prueba que entra directo** (`?probar=<tramo>`).

**Para deshacer** una tarea publicada: `git revert <hash>` en `feat-3d` + push (la acción lo publica igual). Nunca resetear `main`.

### Links de prueba disponibles
Base `.../3d/?probar=` + `calle`, `persecucion`, `byd`, `francia`, `chaky`, `chaky-baile`, `chaky-cartel`, `chaky-enojado`, `cepi`, `cepi-carton`, `cepi-duelo`, `lale`, `lale-patin`, `pinky`, `pinky-margot`, `facu`, `facu-verdadero`, `facu-enojado`, `final`. Agregá `&debug=1` cuando exista (tarea R-1).

### Pruebas en Chrome sin pantalla (opcional pero recomendado)
`tests/e2e/harness.mjs` necesita three r128 en `/home/claude/tools/node_modules/three/build/three.min.js` (en otra máquina: ajustar la ruta del harness o instalar `three@0.128.0` y `playwright-core`). Con `?probar=` hay que tocar `#press-start` y después una tarjeta `[data-hero]`. Los e2e corren más lentos que el juego real: esperar por tiempo, no por cantidad de vueltas.

---

## Orden recomendado
1. **T-0** → 2. **A-0** (inventario de arte) → 3. **R-1** (diagnóstico) → 4. **A-1** (Facu jefe final) → 5. **D-1, D-2, D-3** (jefes justos) → 6. **A-2 a A-4** (poses que faltan) → 7. **H-1 a H-4** (historia y textos) → 8. **A-5, A-6** (animación fluida) → 9. **R-2 a R-5** (rendimiento) → 10. **D-4 a D-8** (música y pulido) → 11. **H-5, H-6** → 12. **A-7** (pulido visual de arenas).
Las tareas de arte que esperan imágenes no frenan el resto: mientras tanto seguí con las de código.
Si Facu reporta algo roto probando, eso va **primero**.

---

## T-0 · Preparación
- [x] **T-0** Copiar este plan al repo como `docs/PLAN_TRABAJO.md` y arreglar los 3 e2e que ya fallaban antes de la Etapa D: `tests/e2e/cine.e2e.mjs` (después de SALTAR espera la persecución), `cepi_pinky.e2e.mjs` y `chase.e2e.mjs` (timeouts). Arreglar **las pruebas**, no el juego, salvo que encuentres un bug real (en ese caso anotarlo y hacerlo en un commit aparte).
  - Verificación: los 3 e2e pasan + `npm test`. Commit `[T-0] plan de trabajo + e2e viejos`.

---

## RENDIMIENTO (R) — que vaya fluido en iPhone

- [x] **R-1 · Modo diagnóstico `?debug=1`** (S–M). En `3d/js/main.js`: con `?debug=1` mostrar una cajita chica arriba a la izquierda con FPS, ms por cuadro, `perf.level`, DPR, `frameErrors` (ya existe, `main.js` ~984), el último mensaje de error y un aviso si llegó `webglcontextlost` (~1105). Sumar `renderer.info.render.calls`, `renderer.info.memory.geometries` y `.textures`. Sin `?debug=1` no cambia nada.
  - También sirve para el bug de **pantalla negra con Marine en el duelo de la flechita** (no reproducido en Chrome).
  - Verificación: e2e corto que abra `?probar=cepi-duelo&debug=1` y lea la cajita; sin `debug` la cajita no existe. Link: `?probar=cepi-duelo&debug=1`.
- [ ] **R-2 · Fugas de memoria al salir de arenas** (M). Escribir `tests/e2e/leaks.e2e.mjs`: anotar `renderer.info.memory` (geometrías y texturas) en la calle, entrar y salir de cada arena (chaky, cepi, lale, pinky, facu) y de la persecución, y volver a medir. Si algo no vuelve a ±10 % del valor inicial, buscar qué no se libera en el `dispose()` de esa arena (`arena*.js`, `chase.js`, `bonus.js`, `cine.js`) y arreglarlo. Una arena por commit si hay varias.
  - Criterio: después de recorrer todo, geometrías y texturas ≤ 110 % del valor inicial.
- [ ] **R-3 · Asignaciones por cuadro** (S–M). En las funciones `update()`/`tick()` de `arena*.js`, `chase.js`, `enemies.js`, `fx.js`, `pop_layout.js`: buscar `new THREE.Vector3`, `new THREE.Color`, `.clone()` y arrays/objetos creados en cada cuadro, y reemplazarlos por temporales reutilizados a nivel de módulo. No cambiar comportamiento.
  - Verificación: `npm test` + `tests/e2e/perf.e2e.mjs` (que `logicMs` no suba).
- [ ] **R-4 · Hojas de sprites de más de 2048 px de ancho** (M). `douge_walk_sheet` 3000×512, `cepi_actions_sheet` 2400×512, `pinky_walk_sheet` 2268×512, `chaky_walk_sheet` 2064×512. Reacomodarlas en 2 filas (≤ 2048 de ancho) con un script en `tools/` y adaptar el lector de cuadros (`sprites.js` / `manifest.json`) para que soporte filas si hoy no lo hace. **No regenerar el arte**, solo recortar y reacomodar los mismos cuadros.
  - Verificación: `python3 tests/check_sprites.py` (necesita `numpy`), `tests/e2e/hero_walk.e2e.mjs`, capturas antes/después iguales; peso total de `3d/assets` < 10 MB.
- [ ] **R-5 · Liberar el acto anterior** (M). Revisar `assets.js`: que se precargue solo lo del acto actual y que al pasar de acto se liberen las texturas del anterior que ya no se usan (las de héroes, Margot y UI se quedan). Medir con `?debug=1` antes/después en una campaña con `?probar=calle` → persecución → chaky.
  - Si no está claro qué se puede liberar sin romper el final (foto con toda la banda), anotarlo y frenar.

---

## HISTORIA Y TEXTOS (H) — que todo cierre y se lea bien en ES y FR

Historia vigente (no cambiarla): Chaky agarra el cochecito → duelo de baile en el hangar de Ezeiza → Cepi se lleva a Margot en el BYD → persecución → Lale en Le Blé (París es la casa central de la Le Blé porteña) → Pinky (viajó en el jet de Chaky; el cheque rebota y está firmado por Facu) → **Acto 5: Facu galerista en HENRIS** → final: Facu se ablanda, devuelve a Margot y sale en la foto familiar con toda la banda, **Chaky incluido**. Margot nunca llora: se ríe, tira el chupete, papilla a Pinky, crayones a Facu.

- [ ] **H-1 · Cartel de ronda de Chaky en francés** (S). Hoy sale en español con subtítulo y crece al doble (`i18n.js` ~483-491, ~605, ~109). Con idioma FR: solo francés, misma altura que en ES ±10 %. Link: `?probar=chaky-baile` con FR.
- [ ] **H-2 · Correcciones de francés** (S). Las de la auditoría: «LE BEURRÉ» en `i18n.js:112` y `:285` es «borracho» en argot → dejar el apodo **«MANTECOSO»** sin traducir (es un apodo): `LALE « MANTECOSO »`. «à Le Blé» es agramatical → **«au Blé»** o «chez Le Blé» (`:411` y donde aparezca). Revisar el resto de `i18n.js` buscando `à Le`, `de Le`, masculinos dirigidos al jugador y anglicismos. Dejar en `PROJECT_STATUS.md` la lista de frases cambiadas para que **Marine las revise**.
- [ ] **H-3 · Claves repetidas en `i18n.js`** (S). Hay claves duplicadas (p. ej. `¡PELOTAZO!` en ~172/322 y ~109/489) y la última pisa a la primera. Agregar un test en `tests/` que falle si hay claves repetidas, y resolver cada duplicado sin cambiar lo que se ve en español.
- [ ] **H-4 · Femenino con Marine y frases largas** (S). (a) Con Marine no debe aparecer ningún masculino dirigido al jugador: revisar «👶 ¡Vamos, papá!», «¡Es eléctrico, papá!», «campeón», «BIENVENIDO» (`voice.js`, `main.js` ~266, `story.js`, `cine.js`). Con Marine: «mamá», «campeona», «BIENVENIDA». (b) Ninguna frase flotante de jefe pasa el 92 % del ancho en 430 px (Pinky hoy ≈ 568 px): permitir salto de línea en el texto flotante (`game.css` ~59, sin reusar la clase `.pop` en otros componentes).
- [ ] **H-5 · Voces de jefes: balbuceo + subtítulo** (M). Decidido por Facu: **balbuceo sintetizado con Web Audio** (nada de voces grabadas ni de IA, nada pago), **un timbre por jefe** (Chaky grave y lento, Cepi rápido y nasal, Lale gordito/redondo, Pinky chillón de cancha, Facu canchero), y el subtítulo que ya se muestra. Implementar en `audio.bossLine()` (`audio.js` ~371, hoy vacío) usando el catálogo de `voice.js`. Respeta el botón de silencio. De paso: `duck()` (`audio.js` ~361) vuelve la música a 1 y debe volver al volumen normal de la música (0,78, ver ~294).
  - Verificación: `tests/voice.test.mjs` ampliado (cada jefe tiene timbre distinto; con silencio no suena nada). Links: `?probar=chaky`, `cepi`, `lale`, `pinky`, `facu`.
- [ ] **H-6 · Continuidad de los 5 actos** (M). Ampliar `tests/campaign-continuity.test.mjs` o `tests/e2e/story.e2e.mjs` para recorrer la campaña completa (con atajos de `?probar=` está bien) y comprobar: cada mini-escena (`pre_chaky`, `pre_cepi`, `pre_lale`, `pre_pinky`, `post_pinky`) aparece en orden, Margot está en pantalla en cada traspaso, el checkpoint `facu` funciona y `CREW` del final incluye a Chaky y Facu. Pendiente conocido para revisar: el decorado del final de la calle de BA todavía muestra el edificio de Le Concept (solo se cambió el cartel a «acceso a Ezeiza»); si se puede resolver con lo que ya hay en `world.js` sin arte nuevo, hacerlo; si no, anotarlo.

---

## DIVERSIÓN Y PULIDO (D) — jefes justos, música y detalles

- [x] **D-1 · Chaky no se gana palmeando los 5 carriles** (S). Hoy tocar un carril vacío no penaliza (`arena_logic.js` ~259-263, `grade: 'empty'`): un bot que toca los 5 carriles gana el 100 %. Hacer que el toque en vacío corte el combo y, si se repite muy seguido (p. ej. 3 vacíos en 1 s), cuente como fallo.
  - Criterio (con bots en `tests/arena.test.mjs`): palmear los 5 carriles gana < 20 % y gasta ≥ 2 ⭐; un jugador casual bueno sigue ganando ≥ 95 %.
- [ ] **D-2 · Cepi: dificultad al revés** (M). Joystick al azar + 👊 gana 87 %, un jugador casual que entendió la regla 62 %, un novato 7 %; la fase 1 es la que más castiga. Ajustar `CEPI_ARENA` (`arena_cepi_logic.js` ~15-30: `ballSpeed`, `returnR`, `ballHitR`, `windup`) y, si hace falta, que pegarle sin estar cerca de la pelota no devuelva.
  - Criterio (bots en `tests/arena_cepi.test.mjs`): casual flojo ≥ machacador, novato ≥ 40 %, golpes recibidos en fase 1 ≤ 1,5. Link `?probar=cepi`.
- [ ] **D-3 · Lale demasiado fácil** (S). Casual flojo gana 100 % recibiendo 0,1 golpes en 16 s. Ajustar `LALE_ARENA` (`arena_lale_logic.js` ~5-28).
  - Criterio: casual flojo gana 70–90 %, recibe ≥ 1,5 golpes, duración mediana 30–45 s; machacar gana < 15 %. Link `?probar=lale`.
- [ ] **D-4 · Música propia del duelo de baile** (M). Hoy usa el tema `byd` y no va al ritmo de las flechas (cada 0,58 / 0,52 / 0,46 s por ronda; `arena.js` ~329, `music.js` ~73, `arena_logic.js` ~20). Crear en `music.js` un tema disco sintetizado cuya negra = tiempo de la ronda y que arranque alineado con la primera flecha (±20 ms).
- [ ] **D-5 · Una música distinta por jefe** (L). Cepi, Lale, Pinky (y Facu) comparten música (`main.js` ~730, 746, 763). Una variante sintetizada por jefe en `music.js` con el estilo de cada uno (Cepi: rock de pádel; Lale: vals musette francés; Pinky: cumbia de cancha; Facu: jazz de galería). Un jefe por commit si se hace largo.
- [ ] **D-6 · «¡DIUSHBAG!» bajo al elegir a Douge** (S). `primeSpeech()` se llama justo antes (`main.js` ~1181, 1198-1199, 1229): preparar la voz solo al elegir a Marine. **Solo se puede confirmar en iPhone**: anotarlo.
- [ ] **D-7 · Botones bajo la isla del iPhone en horizontal** (S). Que 👊 / SALTO / ESQUIVE respeten `env(safe-area-inset-*)` (`game.css` ~69, 72, 747). Verificar con capturas en 932×430 y 430×932.
- [ ] **D-8 · Pulido chico** (S, puede ir en 1–2 commits): textos de 11 px del HUD subirlos a ≥ 13 px (`game.css` ~100, 735-736); «Tocá para empezar» no debe caer sobre el carril central de Chaky en horizontal; código muerto de audio (`audio.js` ~4, 128, 319); textos sin traducir en `chase.js` ~367 y `enemies.js` ~32; volver a encender la música tras una alarma o Siri (`onstatechange` en `audio.js` ~322-337).

**No tocar sin Facu:** `audioSession='playback'` en `audio.js:166` (hay que probar en el iPhone si conviene `ambient`).

---

## ARTE Y ANIMACIÓN (A) — juego completo, cada personaje con todas sus animaciones

Objetivo: que **ningún personaje quede con poses prestadas, congeladas o dibujadas a medias por código** y que los cambios de pose se vean fluidos. Hoy hay 136 assets en `3d/assets/manifest.json`; faltan sobre todo las poses de Facu (jefe final) y algunas de héroes, Lale y Margot.

### Reglas de arte (obligatorias, por lo que ya salió mal antes)
1. **Siempre el mismo personaje.** Cada imagen se genera pasándole a Gemini como **foto de referencia el sprite actual del personaje** (`3d/assets/<id>.webp`) y pidiendo explícitamente «mismo personaje, misma cara, misma ropa, mismas proporciones». A Facu no le gustó cuando un video de IA cambiaba el tamaño o la cara del personaje: si la imagen no se parece, **se descarta y se regenera**, no se integra «más o menos».
2. **Estilo:** Pixar 3D, colores suaves como la persecución («no tan fuerte visualmente»). Héroes en las arenas: **de espaldas** (cámara detrás). Jefes: **de frente**, mirando a cámara.
3. **Fondo verde liso `#00FF00`**, cuerpo entero, sin sombra en el piso, sin texto, una pose por imagen (salvo hojas de caminar: 4 cuadros en fila, misma altura, pies a la misma línea).
4. **Integración solo con las herramientas del repo:** `python3 -I tools/import_arena.py` para poses de arena (`arena_<personaje>_<pose>`, quita el verde, recorta y escribe WebP + `manifest.json`), `python3 -I tools/cut_sheet.py <hoja> <id> --frames 4` para hojas. Ajustar el tamaño con `hk` en `manifest.json` hasta que la pose nueva mida lo mismo que la vieja (sin saltos de tamaño al cambiar de pose).
5. **Límites:** cada imagen ≤ 2048 px de ancho, alto de poses ≤ 768, WebP; total de `3d/assets` < 10 MB (`tests/assets.test.mjs` lo controla).
6. **Revisión antes del commit:** sacar captura del juego con la pose nueva al lado de la vieja (`tests/e2e/look.mjs` o un e2e de la arena) y mirarla. Dejar las capturas en el mensaje a Facu.
7. **Facu como personaje:** su arte lo **aprueba él antes de publicarlo** (ya sacó una vez el «mini Facu» porque no le gustaba). Generalo, mandale las imágenes y esperá el OK; mientras tanto, seguí con otra tarea.
8. **Si no podés generar imágenes vos mismo:** armá `arte_para_facu/<tarea>.zip` con una carpeta por imagen (foto de referencia + `PROMPT.txt` listo para pegar en Gemini) y un `LEEME.txt` con los pasos. Facu las genera y te las devuelve en el mismo orden; vos las integrás.

### Tareas
- [x] **A-0 · Inventario de arte** (S, sin imágenes). Recorrer `manifest.json` y el código (`arena*.js`, `chase.js`, `cine.js`, `story.js`, `cast.js`, `poses.js`) y escribir `docs/ARTE_FALTANTE.md` con una tabla por personaje (Douge, Marine, Margot, Chaky, Cepi, Lale, Pinky, Facu, secuaces): **pose que el juego usa → asset que existe / falta / se reemplaza por otro / se dibuja por código**. Marcar como prioridad lo que se ve en pantalla más tiempo. Commit `[A-0] inventario de arte`. Las tareas A-1 a A-4 se ajustan según esa tabla.
- [ ] **A-1 · Facu galerista, jefe final** (M). Hoy su arena usa el dibujo viejo `facu` animado por código. `arena_facu.js` ya busca `arena_facu_<idle|reveal|aim|throw|paint|windup|hurt|love|ko>` y `arena_facu_fondo` (galería HENRIS por dentro): generar esas 10 imágenes (look de **galerista pintor**: delantal o saco con manchas de pintura, pincel/paleta; **no** con micrófono), pasarlas a Facu para su OK (regla 7) e integrarlas. Base de referencia: `3d/assets/facu.webp` y una foto de Facu que él te pase. Links: `?probar=facu`, `facu-verdadero`, `facu-enojado`, `final`.
- [ ] **A-2 · Héroes: poses que faltan** (M). Para Douge y Marine de espaldas existen idle, run 0–3, jump, dodge, punch, hurt y victory; falta **poder** (`arena_<heroe>_back_power`: Douge «puños llenos de verdades», Marine «¡HIEDRA!» con plantas) y **derrota** (para cuando se pierden todas las vidas). Más lo que marque A-0 (persecución, calle). Usarlas en todas las arenas donde hoy se repite el golpe.
- [ ] **A-3 · Jefes: gesto previo y reacciones** (M). Cada jefe necesita al menos: reposo, **carga/anticipación** (el `windup` que ya existe en la lógica), tiro, golpeado, aturdido y KO. Según `manifest.json` faltan, por ejemplo, `arena_lale_windup` y un aturdido de Pinky; completar lo que marque A-0. Chaky (baile) ya está completo.
- [ ] **A-4 · Margot con sus gags** (S–M). Hoy existen `arena_margot_cheer`, `_scared`, `_hero`. Faltan las de sus momentos de historia: **tirando el chupete** (cinemáticas), **revoleando la papilla** (Pinky) y **garabateando con crayones** (Facu). Margot nunca llora (decisión de Facu). Usarlas en `cine.js` y `margot_finish.js`.
- [ ] **A-5 · Transiciones fluidas por código** (M, sin imágenes). En el sistema de poses (`poses.js`, `sprites.js` y el `setPose` de cada arena): al cambiar de pose, fundido cruzado de ~80 ms y un pequeño «squash & stretch» (anticipación antes del tiro, rebote al caer de un salto, retroceso al recibir golpe). Que ninguna pose aparezca de golpe con otro tamaño. Verificar con capturas cuadro a cuadro en un e2e.
- [ ] **A-6 · Caminar y correr completos** (M). Revisar en la calle y la persecución que cada personaje que se mueve tenga su ciclo (4 cuadros mínimo) y que no «patine» (velocidad de animación acorde a la velocidad de desplazamiento). Si algún personaje se mueve con una pose quieta, generar su hoja de 4 cuadros (regla 3) o resolverlo con balanceo por código si es un secundario.
- [ ] **A-7 · Pulido visual de arenas y personajes (Etapa D parte 2)** (L). Con el auditor `.agents/skills/margoush-visual` (solo lectura), revisar las 5 arenas y las cinemáticas en 430×932 y 932×430: personajes chicos o tapados (p. ej. Lale chica en las gradas del pádel), fondos pobres, sombras, HUD. Escribir la lista en `PROJECT_STATUS.md` y resolver **solo lo que no implique cambiar la historia ni el diseño de las peleas**; lo que sí lo implique queda «Pendiente para Facu/Claude».

---

## Prueba que tiene que hacer Facu en el iPhone (ninguna simulación la reemplaza)
1. Duelo con Marine en `?probar=cepi-duelo&debug=1` (pantalla negra; si pasa, sacar captura de la cajita).
2. Música del duelo de Chaky al ritmo (después de D-4).
3. Voz de Marine con y sin modo silencio y con Spotify de fondo.
4. «¡DIUSHBAG!» al elegir a Douge.
5. Botones en horizontal.
6. Fluidez en calle y persecución (mirar FPS con `&debug=1`).
7. Alarma con el juego abierto: ¿vuelve la música?

## Cuando Facu vuelva a Claude
Pegar: «Seguimos MARGOUSH 3D. Leé `docs/PLAN_TRABAJO.md` y las últimas secciones de `PROJECT_STATUS.md`; revisá los commits de feat-3d desde `ed53fc4` y decime qué quedó bien y qué hay que corregir.»
