# Pelea final en la arena de BIG CHAKY — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la pelea de costado contra BIG CHAKY por una arena con cámara detrás del héroe (a pie, de espaldas), BIG CHAKY enorme al fondo y dos fases: devolver barriles dorados y pegarle a la mano trabada.

**Architecture:** Lógica pura y testeable en Node (`arena_logic.js`: fases, proyectiles, devoluciones, manotazo, daño, eventos) separada de la escena Three.js (`arena.js`, armada como `chase.js`: escena, cámara, sprites, HUD propio, entrada). `main.js` la arranca donde hoy aparece el jefe y, al ganar, llama al `game.onBossDown()` de siempre.

**Tech Stack:** Three.js r128 (global `THREE`), módulos ES sin build, `node --test`, e2e con Playwright (`tests/e2e/harness.mjs`), Python + Pillow para importar arte.

**Spec:** `docs/superpowers/specs/2026-11-18-big-chaky-arena-design.md`

## Global Constraints

- Sin carteles de instrucciones: ningún texto en pantalla que diga qué hacer (`¡AHORA! ¡PEGALE!`, «devolvelo», etc.). Sí van frases de BIG CHAKY: «¡Tomá, barrilito!», «¡Eso no vale!», «¡Me devolviste el barril, atrevido!», «¡Ahora sí me enojé!», «¡Soltá, soltá!».
- Todo ataque se anuncia antes (pose de tirar, anillo rojo, sombra de la mano) y siempre se puede evitar.
- Cada golpe recibido = −1 corazón. Sin corazones = `finish(false)` (derrota normal, sin reintentar).
- Puntos: devolución +300, golpe a la mano trabada +50, esquive justo +100, BIG CHAKY +2000 (`game.score.addKill('boss')`).
- Vida de BIG CHAKY 30; fase 2 desde la mitad (15). Fase 1 se gana con 4 devoluciones.
- Uno de cada tres barriles es dorado en fase 1; los cajones nunca son dorados.
- El héroe nunca se ve de costado en la arena.
- Presupuesto de imágenes: menos de 8,5 MB en `3d/assets`.
- iPhone horizontal (844×390) y vertical (390×844); ≥ 50 fps (`tests/e2e/perf.e2e.mjs`).
- No se sube a `main` hasta tener el arte de Flow importado.
- Commits terminan con las líneas `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_015n5LzdE9LYr1F19CuRpJcy`.

## Review Focus

1. Pausa en medio de un manotazo o con un barril en el aire: al seguir, todo continúa donde estaba (nada avanza en pausa) — e2e en Task 4.
2. Ganar con barriles todavía rodando o la mano en el piso: el rescate arranca limpio, sin proyectiles colgados ni golpes después del KO — test en Task 1 (`update` después de `ko` no emite `hurt`).
3. Perder el último corazón el mismo cuadro en que BIG CHAKY llega a 0: gana el KO (no se muestra derrota) — test en Task 1.
4. Apretar 👊 sin parar toda la fase 1 sin devolver nada: la vida no baja — test en Task 1.
5. Volver al menú o empezar otra partida desde la arena: la escena se libera y la siguiente partida arranca en la calle — e2e en Task 4.

---

### Task 1: Lógica de la arena (sin gráficos)

**Files:**
- Create: `3d/js/arena_logic.js`
- Test: `tests/arena.test.mjs`

**Interfaces:**
- Produces:
  - `export const ARENA` — tabla de números: `{ hp: 30, xMax: 4.2, zNear: 0, zFar: -7, bossZ: -16, bossSway: 3, returnWindow: 0.3, returnDmg: 3.75, handDmg: 1.5 /* multiplica el daño del golpe */, powerDmg: 4, hitR: 1.05, phase1: { throwEvery: [2.2, 3.2], goldEvery: 3, barrelSpeed: 7, crateTime: 1.1 }, phase2: { throwEvery: [1.5, 2.3], goldEvery: 4, slamEvery: 2, slamWarn: 0.9, stuck: 2.0 }, points: { returned: 300, hand: 50, dodge: 100 } }`.
  - `export function createArenaLogic({ rand = Math.random } = {})` devuelve:
    - `state` (getter): `{ phase: 1 | 2 | 'ko', hp, hpMax, bossX, pose: 'idle'|'throw'|'slam'|'hurt'|'rage'|'ko', shots: Array<{ id, kind: 'barrel'|'crate', gold, x, z, y, returning }>, hand: { state: 'none'|'warn'|'down'|'stuck'|'up', x, z, t } }`
    - `update(dt, hero: { x, z, y, dodging, inv }) → Event[]`
    - `punch(area: { x, z, reach, dmg }) → Event[]`
    - `power() → Event[]`
  - `Event` = `{ type: 'throw', kind } | { type: 'hurt', by: 'barrel'|'crate'|'hand' } | { type: 'dodge' } | { type: 'returned' } | { type: 'bossHit', dmg, by: 'barrel'|'hand'|'power' } | { type: 'handHit', dmg } | { type: 'slam', x, z } | { type: 'rage' } | { type: 'ko' } | { type: 'line', text }`
  - Coordenadas: x a lo ancho (±`xMax`), z hacia el fondo negativo; el héroe vive entre `zNear` y `zFar`. Los barriles ruedan en x fija desde `bossZ` hacia z positivo; un cajón cae en el (x, z) que tenía el héroe al tirarlo. `hurt` se emite cuando un proyectil o la mano toca al héroe (distancia en el plano < `hitR`, y `y < 1.1` para los barriles) y el héroe no tiene `inv`. Si tiene `dodging`, se emite `dodge` en lugar de `hurt`.

- [ ] **Step 1: Write the failing tests** en `tests/arena.test.mjs` con un `rand` fijo (`() => 0.5`) y un helper `run(logic, secs, hero)` que llama a `update(1/60, hero)` y junta los eventos:
  - `starts in phase 1 with full life`: `state.phase === 1`, `hp === 30`, `hpMax === 30`.
  - `every third barrel is gold and crates never are`: tras 40 s con el héroe con `inv: 99` lejos, entre los `throw` hay barriles y cajones; los barriles dorados son exactamente los de índice 2, 5, 8… entre los barriles de fase 1; ningún cajón tiene `gold`.
  - `punching a gold barrel in the window sends it back and hurts the boss`: avanzar hasta que un barril dorado esté a menos de `returnWindow * barrelSpeed` del héroe en su misma x; `punch({ x, z, reach: 1.9, dmg: 1 })` emite `returned`; seguir corriendo emite `bossHit` con `dmg === 3.75` y `hp === 26.25`.
  - `punching a plain barrel does nothing and it still hurts`: `punch` sobre un barril común no emite `returned` y al llegar emite `hurt` con `by: 'barrel'`.
  - `mashing punch through phase 1 never lowers his life`: 60 s llamando `punch` en cada cuadro con el héroe parado lejos de la línea de los dorados (`x` opuesta, `inv: 99`): `hp === 30`.
  - `four returns switch to phase 2 with rage`: tras 4 devoluciones `state.phase === 2`, hubo un evento `rage` y un `line` con `'¡Ahora sí me enojé!'`.
  - `the hand warns, lands, stays stuck and takes extra damage`: en fase 2 aparece `hand.state === 'warn'` en el (x, z) del héroe; pasados `slamWarn` s queda `'stuck'` (con un `slam` emitido) durante `stuck` s; `punch` cerca de la mano emite `handHit` con `dmg === 1.5` y baja la vida 1.5; `punch` cuando `hand.state === 'none'` no baja la vida.
  - `the hand hurts if you stay under it, dodging is rewarded`: héroe quieto debajo sin `inv` → `hurt` con `by: 'hand'`; con `dodging: true` → `dodge`.
  - `power clears every shot and hurts him`: con barriles en el aire, `power()` deja `shots.length === 0` y emite `bossHit` con `dmg === 4`.
  - `ko happens once and nothing hurts after it`: llevar `hp` a 0 con `punch` a la mano → un solo `ko`, `state.phase === 'ko'`; 10 s más de `update` no emiten `hurt` ni `throw`.
  - `ko wins over a last hit in the same frame`: con un barril a punto de tocar al héroe y la vida en 1.5, `punch` a la mano trabada → hay `ko`; el `update` siguiente no emite `hurt`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/arena.test.mjs`
Expected: FAIL con «Cannot find module … arena_logic.js».

- [ ] **Step 3: Implement `createArenaLogic` en `3d/js/arena_logic.js`**

Es una máquina de estados con temporizadores. BIG CHAKY se mueve con `bossX = sin(t * 0.6) * bossSway`; para tirar pasa a la pose `throw` 0,6 s antes de soltar. En fase 1 alterna barril/cajón (2 barriles por cada cajón); en fase 2 hace un manotazo cada `slamEvery` tiros. La mano pasa por `warn → down (0,15 s) → stuck → up (0,4 s) → none`. Un barril devuelto vuelve a la velocidad doble hacia `bossZ` y al llegar emite `bossHit`. Las frases (`line`) salen al tirar el primer barril, al recibir una devolución, al enfurecerse y al trabarse la mano. No importa nada de Three.js ni del DOM.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/arena.test.mjs && npm test`
Expected: todo PASS (31 anteriores + los nuevos).

- [ ] **Step 5: Commit**

```bash
git add 3d/js/arena_logic.js tests/arena.test.mjs
git commit -m "MARGOUSH 3D: lógica de la arena de BIG CHAKY (fases, devoluciones, manotazo)"
```

### Task 2: Importar el arte de Flow

Depende de los archivos que baja el agente de Flow a la carpeta Descargas de Facu (`margoush_arena_*.png`). Se traen con `device_stage_files` a `/mnt/user-data/uploads/…`. Si no llegaron, esta tarea espera; las Tasks 1 y 3 no.

**Files:**
- Create: `tools/import_arena.py`
- Modify: `3d/assets/manifest.json`, `tests/assets.test.mjs`
- Create: `3d/assets/arena_*.webp`
- Test: `tools/test_import_arena.py`

**Interfaces:**
- Produces (nombres en el manifiesto, cada uno `{ file, w, h }` como los demás): `arena_chaky_idle`, `arena_chaky_throw`, `arena_chaky_slam`, `arena_chaky_hurt`, `arena_chaky_rage`, `arena_chaky_ko`, `arena_douge_back_idle`, `arena_douge_back_run`, `arena_douge_back_punch`, `arena_douge_back_hurt`, los mismos cuatro `arena_marine_back_*`, `arena_barril`, `arena_cajon`, `arena_fondo`.

- [ ] **Step 1: Write the failing test** `tools/test_import_arena.py`: arma en un tmp una imagen 200×300 con fondo `#00B140` y un rectángulo naranja, la pasa por `import_arena.py --assets <tmp> margoush_arena_chaky_front_idle.png`, y comprueba que existe `arena_chaky_idle.webp` con canal alfa, sin píxeles verdes opacos (mismo criterio que `tools/test_cut_sheet.py`), alto ≤ 768 y que el manifiesto tiene `arena_chaky_idle` con `w` y `h`. Hace lo mismo con un barril sobre fondo blanco (`margoush_arena_barril.png` → `arena_barril.webp` transparente) y con el fondo (`margoush_arena_fondo.png` → `arena_fondo.webp` opaco, ancho ≤ 1280).

- [ ] **Step 2: Run it to verify it fails**

Run: `python3 -I tools/test_import_arena.py`
Expected: FAIL (no existe `import_arena.py`).

- [ ] **Step 3: Implement `tools/import_arena.py`**

Uso: `python3 -I tools/import_arena.py [--assets 3d/assets] <png>...`. Mapea el nombre de entrada al nombre del juego (`chaky_front_<pose>` → `arena_chaky_<pose>`; `<héroe>_back_<pose>` → `arena_<héroe>_back_<pose>`; `barril`, `cajon`, `fondo` → `arena_*`). Personajes: recorte de verde con `remove_background` de `cut_sheet.py` y recorte al borde; objetos: la lógica de `cut_white.py`; fondo: solo achicar. Todo a WebP calidad 82 y al manifiesto.

- [ ] **Step 4: Run it to verify it passes**

Run: `python3 -I tools/test_import_arena.py`
Expected: PASS.

- [ ] **Step 5: Import the real art and check it by eye**

Elegir del reporte del agente las imágenes buenas, importarlas y mirar cada WebP (Read) sobre fondo oscuro: personaje entero, de frente o de espaldas según corresponda, sin halo verde. Si a una le falta, o no es el mismo personaje, se la anota para regenerarla y no se sigue a la Task 5.

- [ ] **Step 6: Update `tests/assets.test.mjs`**: sumar los 17 nombres de arriba a `NAMES` y cambiar el tope a `8_500_000` (con comentario «8,5 MB desde la arena de BIG CHAKY»). Run: `npm test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add tools/import_arena.py tools/test_import_arena.py 3d/assets tests/assets.test.mjs
git commit -m "MARGOUSH 3D: arte de la arena de BIG CHAKY (jefe de frente, héroes de espaldas, barril, cajón, fondo)"
```

### Task 3: Escena de la arena

**Files:**
- Create: `3d/js/arena.js`
- Modify: `3d/js/hero.js:12-16` (exportar `SWINGS`), `3d/css/game.css` (estilos `#arena-ui`, `.pop` reutilizado)

**Interfaces:**
- Consumes: `ARENA`, `createArenaLogic` (Task 1); nombres de texturas de la Task 2; `SWINGS` de `hero.js`.
- Produces: `export function createArena({ game, input, audio, assets, renderer, banner, updateHud, pause, POWER, onWin, onDown })` que devuelve `{ start(), update(dt), render(), dispose(), get active(), get state() }`. `state` = el `state` de la lógica más `{ hero: { x, z, y, pose }, hp: game.hero.hp }`. `onWin()` se llama una vez, 1,6 s después del `ko`; `onDown()` cuando `game.hero.hp` llega a 0.

- [ ] **Step 1: Implement `createArena`** siguiendo la forma de `createChase` (`own`/`keep` para liberar, `sprite`, `place`, `pop`, `sfx`, `canvasTex`):
  - Escena: piso de tablones por código de 9 × 26 m, tarima al fondo, `arena_fondo` como plano grande detrás de BIG CHAKY, niebla violeta y luz naranja como el galpón.
  - Cámara: detrás y arriba del héroe (`cam.position = (heroX * 0.4, 4.2, heroZ + 7)`, mirando a `(0, 2.5, ARENA.bossZ)`); el ángulo de visión se abre en vertical como en `chase.js`.
  - BIG CHAKY: sprite de 8 m en `(bossX, 0, bossZ)` con la textura `arena_chaky_<pose>`; rebote y balanceo al tirar y temblor al trabar la mano (como el BYD).
  - Héroe: sprite de 2,4 m con `arena_<héroe>_back_<pose>` (`idle` quieto, `run` al moverse, `punch` durante el golpe, `hurt` 0,5 s tras `hurt`).
  - Entrada: joystick mueve x/z dentro de los límites a 6 m/s; SALTO salta (mismos números que la persecución); ESQUIVE da `dodging` 0,36 s con 1,05 s de espera; 👊 hace el combo de 3 con los tiempos de `SWINGS` (ventana de combo 0,45 s) y en el `hitAt` llama a `logic.punch({ x, z, reach: s.reach, dmg: s.dmg })`; mantener 👊 o L con la barra llena llama a `logic.power()` con el grito del héroe (`¡VERDADES A LOS GRITOS!` / `¡HIEDRA!`).
  - Eventos de la lógica: `hurt` → `game.hero.hp -= 1`, fogonazo rojo y temblor; `dodge` → +100 y carga poder 0,15; `returned` → +300; `handHit` → +50, pausa corta y temblor; `bossHit`/`rage`/`ko` → `#boss-bar` (`#boss-fill` en `hp/hpMax`), fogonazo y `sfx('roar')`/`sfx('ko')`; `line` → `pop` grande sobre BIG CHAKY; `ko` → `game.score.addKill('boss')`, oculta la barra.
  - Barriles: sprite `arena_barril` que gira; dorado = el mismo con `material.color` dorado y un halo aditivo que late. Cajón: sprite `arena_cajon` en arco con el anillo rojo achicándose en el punto de caída. Mano: sombra oscura en el piso que crece durante `warn` (la mano es parte de la pose `slam`).
  - `#arena-ui` solo tiene el fogonazo y los `pop`; nada de textos de instrucciones.

- [ ] **Step 2: Smoke check en el navegador** con un script temporal (no se commitea) que hace `window.__game.arena.start()` desde la consola en `tests/e2e/harness.mjs` y saca una captura en horizontal y otra en vertical. Mirarlas: BIG CHAKY enorme arriba al fondo, héroe de espaldas abajo y barriles que se leen.

- [ ] **Step 3: Commit**

```bash
git add 3d/js/arena.js 3d/js/hero.js 3d/css/game.css
git commit -m "MARGOUSH 3D: escena de la arena de BIG CHAKY con cámara detrás del héroe"
```

### Task 4: Conectar la arena al juego y pruebas e2e

**Files:**
- Modify: `3d/js/main.js` (`spawnBoss`, `clearRun` ~206, bucle `frame` ~486-522, `pause`/`resume` ~461-478, `STAGES.galpon`, creación junto a `game.chase` ~569), `3d/js/hero.js:266,284` y `3d/js/powers.js:60` (sin `game.boss`), `3d/js/cameos.js:20` (usar `game.arena.active`)
- Delete: `3d/js/boss.js`
- Create: `tests/e2e/arena.e2e.mjs`
- Modify: `tests/e2e/story.e2e.mjs`, `tests/e2e/art_ready.e2e.mjs`, `tests/e2e/ui.e2e.mjs`, `tests/e2e/layout.e2e.mjs`, `tests/e2e/mobile.e2e.mjs` (lo que hoy mira `game.boss`)

**Interfaces:**
- Consumes: `createArena` (Task 3).
- Produces: `game.arena`; `game.state === 'arena'` mientras dura la pelea; `setStage('galpon')` arranca la arena.

- [ ] **Step 1: Write the failing e2e** `tests/e2e/arena.e2e.mjs`, para `douge` y `marine` en 844×390 y una vez en 390×844 (copiar `toBoulevard`/`launch`/`check` de `chase.e2e.mjs`):
  - `setStage('galpon')` → `state === 'arena'`, `#boss-bar` visible con «BIG CHAKY», `arena.state.hp === 30`.
  - La textura del héroe empieza con `arena_<héroe>_back_` y la de BIG CHAKY con `arena_chaky_`.
  - No hay instrucciones: el texto de `#arena-ui`, `#banner` y `.pop` nunca contiene «PEGALE», «DEVOLV», «ESQUIV» ni «SALT» durante 10 s de juego.
  - ArrowLeft mueve `arena.state.hero.x` a < −1; Space sube `hero.y` > 0,3.
  - Pausa: `pause()` → `state === 'paused'`; el `z` de los proyectiles y `hand.t` no cambian en 500 ms; `resume()` → `state === 'arena'`.
  - Llevar la vida a 15 (forzar desde la lógica de prueba) → `arena.state.phase === 2` y pose `rage` en algún momento.
  - Llevar la vida a 0 → en ≤ 3 s `state === 'rescue'` y `#boss-bar` oculta.
  - `hero.hp = 1` y esperar un golpe → pantalla de resultado de derrota (`finish(false)`).
  - Volver al menú desde la pausa y empezar otra partida → no queda `#arena-ui` y el héroe está en la calle (`state === 'playing'`).

- [ ] **Step 2: Run it to verify it fails**

Run: `node tests/e2e/arena.e2e.mjs`
Expected: FAIL en «state === 'arena'».

- [ ] **Step 3: Wire it in `main.js`**: `game.arena = createArena({... , onWin() { game.state = 'playing'; game.onBossDown(); }, onDown() { game.state = 'playing'; finish(false); } })`. `spawnBoss()` muestra el cartel de historia, pone la música de jefe y llama a `game.arena.start()` con `game.state = 'arena'`. El bucle de `frame`, `pause` y `resume` tratan `'arena'` igual que `'chase'`. `clearRun` llama a `game.arena.dispose()`. Se sacan `createBoss`, `game.boss` y `boss.js`; `hero.js`, `powers.js` y `cameos.js` dejan de mirar `game.boss`. El rescate (`onBossDown`) sigue siendo el de hoy en el galpón de costado.

- [ ] **Step 4: Update the old e2e** que miraban `game.boss`: `story.e2e` pasa a comprobar que el galpón abre la arena y que el KO lleva al rescate; `art_ready.e2e` comprueba las texturas `arena_chaky_*` en lugar de la caminata y el pisotón; `ui.e2e` deja de perseguir `g.boss.pos`; en `layout.e2e` y `mobile.e2e` se mide `#boss-bar` con la arena abierta.

- [ ] **Step 5: Run everything**

Run: `npm test && for f in tests/e2e/*.e2e.mjs; do node "$f" || echo "FALLÓ $f"; done`
Expected: ninguna línea «FALLÓ»; `perf.e2e` ≥ 50 fps.

- [ ] **Step 6: Commit**

```bash
git add -A 3d/js tests
git commit -m "MARGOUSH 3D: la pelea final pasa a la arena de BIG CHAKY (dos fases, vista desde atrás)"
```

### Task 5: Verificar, publicar y dejar el estado al día

Solo con la Task 2 completa (arte real).

**Files:**
- Modify: doc del proyecto `claude/margoush_3d_estado.md` (con la herramienta de Projects)

- [ ] **Step 1: Mirar la pelea entera** en Chrome sin pantalla, horizontal y vertical: capturas de fase 1 (barril dorado en camino), fase 2 (sombra de la mano y mano trabada), KO y rescate. Comprobar que nada se pisa con el HUD.
- [ ] **Step 2: Publicar** con la skill `anthropic-skills:qa-publicacion-web`: traer `origin/feat-3d` y rebasar (otra sesión también sube ahí), push a `feat-3d`, merge `--no-ff` en `main`, `git -c push.negotiate=true push origin main`, y verificar en https://facundocapello-blip.github.io/margoush-party/3d/ que responde con el hash nuevo y sin errores en la consola.
- [ ] **Step 3: Actualizar `claude/margoush_3d_estado.md`** con la novedad, el hash del merge y cómo volver atrás (`git revert -m 1 <hash>`).
