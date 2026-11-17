# MARGOUSH 3D — Dos niveles, trampas y malos nuevos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el nivel único en una partida de dos niveles (Buenos Aires → Le Concept → Francia → galpón) con 8 trampas y 4 malos nuevos.

**Architecture:** Una sola calle continua a lo largo de +X, más larga. Un módulo de datos `level.js` describe oleadas, portones, trampas y límites de cada nivel; `main.js` recorre esos datos en vez de tener las zonas fijas. Las trampas viven en `traps.js`; los malos nuevos son "tipos" dentro de `enemies.js`, con su textura recoloreada por código desde `courier`.

**Tech Stack:** Three.js r128 global, módulos ES sin build, Node test runner (unit), Playwright (e2e) con `tests/e2e/harness.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-16-margoush-3d-dos-niveles-design.md`

## Global Constraints

- Toda trampa se anuncia ≥ 0,8 s antes de actuar (ícono/sombra/franja + sonido).
- Nada político: sin partidos, banderas reales ni personas reales. Carteles: "GRÈVE", bombo genérico, cubiertas.
- iPhone Safari primero; test de rendimiento existente ≥ 50 fps de lógica (sin cambiar sus umbrales).
- Recursos totales ≤ 5 MB; no se agregan imágenes nuevas (todo por código desde los recursos existentes).
- Le Concept = el local azul de `street_bg`, aparece una sola vez; las fachadas francesas no muestran el local azul.
- Una vida por partida; transición entre niveles cura 2 corazones sin pasar `hpMax`.
- Bonus de tiempo `max(0, 480 − s) × 10`; boletas −100 y el total nunca baja de 0.
- Puntos por malo: secuaz 100, patovica 250, bombo 200, mozo 200, delivery 200 (× multiplicador); jefe 2000.
- Nada a `main` sin OK de Facu. Suite completa en verde antes de cada entrega.

## Review Focus

1. Volver hacia atrás después de la transición (Nivel 2 no permite cruzar a Buenos Aires) → test en Task 2.
2. Morir dentro de un bache o durante la transición → no debe quedar trabado ni sumar bonus; test en Task 5 (bache) y Task 2 (transición ignora daño).
3. Colectivo/trottinette que pasa mientras el héroe esquiva → el esquive esquiva (como hoy contra golpes); test en Task 5.
4. Boletas con puntaje 0 → no da negativo; test unitario en Task 1.
5. Perder durante el Nivel 2 → el resultado guarda los puntos acumulados de ambos niveles, sin bonus; test en Task 2.

---

### Task 1: Puntaje para dos niveles

**Files:** Modify `3d/js/score.js`; Test `tests/score.test.mjs`

**Interfaces:**
- Produces: `score.addKill(kind: 'minion'|'patovica'|'bombo'|'mozo'|'delivery'|'boss')`, `score.killValue(kind) → number` (ya multiplicado), `score.addPenalty(n: number)`, `finalize({hpLeft,hpMax,seconds,won})` con bonus de tiempo 480.

- [ ] Tests: `addKill('patovica')` sin combo = 250; `addPenalty(100)` con total 50 → 0; `finalize({won:true, seconds:400,...}).breakdown.timeBonus === 800`; cortes de rango recalibrados (se fijan en Task 6, el test lee la constante exportada `RANKS`).
- [ ] Ver fallar → implementar → ver pasar → commit.

### Task 2: Datos del nivel, calle de dos mundos y flujo de niveles

**Files:** Create `3d/js/level.js`; Modify `3d/js/world.js`, `3d/js/main.js`, `3d/js/props.js`, `3d/js/facu.js` (si hace falta para límites), `3d/css/game.css`, `3d/index.html`; Tests: create `tests/e2e/level.e2e.mjs`, update coordenadas fijas de `combat`, `gates`, `facu`, `perf` para leer `world.gates[i].x` / `world.secret.x`.

**Interfaces:**
- Produces `level.js`: `export const LEVELS = [{ id:1, name:'BUENOS AIRES', minX, maxX, start }, { id:2, name:'FRANCIA', ... }]`, `export const WAVES = [{ id, level, trigger, gate|null, endsLevel?, title, text, spawns:[{dx,dz,kind}] }]`, `export const GATES = [{ x, kind:'crates'|'piquete' }]`, `export const TRAPS = [{ kind, ... }]` (lo consume Task 5), `export const LE_CONCEPT_X`, `export const GALPON_X`, `export const SECRET_X`.
- world: `world.setLevelBounds(minX, maxX)`, `world.leConcept` (mesh), `world.gates[i].kind`.
- main: `game.level` (1|2), `game.waves[id]`, `game.state === 'transition'`, `game.setStage(id)` con ids `'vereda'|'avenida'|'piquete'|'le-concept'|'francia'|'boulevard'|'galpon'` + alias viejos `'plaza'→'avenida'`, `'plaza-quiet'` (avenida despejada, junto al pasaje… ahora el pasaje está en el boulevard: alias `'boulevard-quiet'`).

Layout (m): N1 x 1–146: vereda trigger 22, portón cajones 64; avenida trigger 70; piquete (portón fuego) 118 con oleada trigger 106; Le Concept centro 134, oleada final trigger 126 → fin de nivel. Frontera 148 ("BIENVENUE EN FRANCE"). N2 x 152–315: calle francesa trigger 162, portón 204; boulevard trigger 212, pasaje secreto 230, portón 256; galpón 262, jefe al pasar 268.

- [ ] Test `level.e2e`: Le Concept existe una sola vez (una sola malla con `userData.leConcept`); despejar la oleada final de N1 → aparece cartel "NIVEL 1" y `game.state==='transition'`; tras ella `game.level===2`, héroe x ≥ 152, hp = min(hpMax, hp+2); caminar a la izquierda no baja de 152; perder en N2 → resultado con `won:false` y total = puntos acumulados; daño durante la transición se ignora.
- [ ] Ver fallar → implementar (world con fachadas porteñas pintadas por código para N1, edificio Le Concept recortado de `street_bg` u≈0.41–0.75 con cartel dorado sobre azul, mesitas y guirnalda; N2 con mosaicos de `street_bg` recortados sin el local azul + guirnaldas tricolor) → actualizar e2e viejos → suite verde → commit.

### Task 3: Ganchos del héroe

**Files:** Modify `3d/js/hero.js`; Test en `tests/e2e/traps.e2e.mjs` (se crea acá).

**Interfaces:** Produces `hero.slow(seconds, factor=0.5)`, `hero.stun(seconds)` (ignora movimiento y ataque, muestra estrellitas), `hero.push(vx, vz)` (empuje sin daño; usa `knock` + nuevo `knockZ`), `hero.isDodging()`.

- [ ] Tests: con `slow(2)` la velocidad medida cae a la mitad; con `stun(1)` mantener ataque no golpea; `push(-8,0)` lo mueve hacia atrás sin bajar `hp`.
- [ ] Ver fallar → implementar → ver pasar → commit.

### Task 4: Malos nuevos

**Files:** Modify `3d/js/enemies.js`; Create `3d/js/skins.js`; Test create `tests/e2e/enemies.e2e.mjs`.

**Interfaces:**
- `skins.js`: `makeSkin(assets, kind) → THREE.Texture` (recolorea campera/gorra del `courier` y pinta accesorio sobre la caja: lista VIP, bombo, bandeja con croissants, caja térmica verde), cacheado por kind (una textura por tipo, no por enemigo).
- `enemies.spawn(x, z, kind: string)` (acepta también el número viejo 0/1/2 → 'secuaz'/'secuaz'/'patovica' para no romper tests); `e.kind`.
- Comportamientos: patovica (hp 7, vel 2.2, windup 0.8, empujón que tira lejos), bombo (hp 4, se queda a ~3,5 m, cada 4 s anillo en el piso que crece 0,9 s; si el héroe está dentro y no saltó → `hero.stun(1)`), mozo (hp 3, se queda a 6–8 m, cada 2,5 s croissant en arco con sombra donde va a caer; 0,7 m → daño), delivery (hp 3, en bici 3D; alineado en Z y a 4–12 m: timbre + franja 0,8 s, embiste a 13 m/s hasta 14 m, después queda mareado 1,5 s).
- [ ] Tests: cada kind aparece con su textura propia (4 texturas distintas); patovica necesita ≥ 7 de daño; bombo aturde si no saltás y no aturde si saltás; croissant cae donde marcó la sombra y no pega si te moviste; delivery avisa ≥ 0,8 s antes de embestir y esquivar lo evita; puntos por kind según Task 1.
- [ ] Ver fallar → implementar → ver pasar → commit.

### Task 5: Trampas

**Files:** Create `3d/js/traps.js`; Modify `3d/js/main.js` (crear/actualizar/reset), `3d/js/audio.js` (sonidos: salpicón, bocina, papel, motor, aleteo, multitud); Test `tests/e2e/traps.e2e.mjs`.

**Interfaces:** `createTraps(ctx) → { list, update(dt), reset(), forceNext(kind) }` (forceNext es para pruebas: dispara la próxima de ese tipo ya). Lee `TRAPS` de `level.js`.

- [ ] Tests (uno por trampa): baldosa → `slow` y salpicón; bache → caer resta 1 corazón y vuelve al borde, saltarlo no; piquete → tocar el fuego resta 1 corazón y no se cruza hasta despejar la oleada del bombo; colectivo → franja ≥ 0,8 s antes, pega en su carril, no pega en otro carril ni esquivando; boletas → sombra antes, −100 y nunca negativo; grève → empuja hacia atrás sin daño, el hueco deja pasar; trottinette → igual que colectivo pero saltable; palomas → aviso y bandada visible ~1,5 s, sin daño.
- [ ] Ver fallar → implementar → ver pasar → commit.

### Task 6: Pulido, calibración y entrega

**Files:** `3d/js/facu.js` (frases: "¡Llegamos a Le Concept!", "¡Nivel 2: Francia!"), `3d/js/score.js` (RANKS), `PROJECT_STATUS.md`, tests de layout/perf.
- [ ] Medir un recorrido perfecto real (script e2e con héroe inmortal) y fijar `RANKS` S ≈ 97 %, A ≈ 75 %, B ≈ 48 % de ese total.
- [ ] Suite completa verde (unit + todos los e2e), capturas de N1, Le Concept, transición, N2 y galpón revisadas a ojo.
- [ ] Commit, push a `feat-3d`, republicar la vista previa.
