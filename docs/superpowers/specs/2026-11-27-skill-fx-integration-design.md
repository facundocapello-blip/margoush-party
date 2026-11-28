# Diseño: Integración de MARGOUSH FX Lab (4 Capas) en Calle y Arenas de Jefes

**Fecha:** 2026-11-27  
**Estado:** Pendiente de aprobación  
**Alcance:** Mediano (Opción B — Los 6 presets existentes conectados en Calle + 4 Arenas de Jefes)

---

## 1. Intención y Por Qué

Ya existe un generador procedural de efectos de 4 capas (`core`, `trail`, `shockwave`, `sparks`) desplegado en `3d/fx-studio.html` con 6 presets diseñados específicamente para el elenco de MARGOUSH (`3d/js/skill_fx.js` y `3d/js/skill_fx_presets.js`). Hoy esos efectos solo se ven en el laboratorio, mientras que el juego sigue usando anillos planos y chispas simples en los poderes y ataques estrella.

El objetivo es aprovechar directamente ese trabajo para que los momentos más grandes del juego (poderes de Douge y Marine, remates de combo, golpes estrella de Cepi y Lale, e intervención heroica de Margot) tengan impacto visual arcade de 4 capas sin degradar FPS ni fugar memoria WebGL en Safari iOS.

## 2. Objetivos, No-Objetivos y Anti-Objetivos

### Objetivos
- Conectar los **6 presets existentes** de `SKILL_PRESETS` en los momentos clave de la calle y las 4 arenas de jefes.
- Reutilizar un único puente liviano para Three.js r128 (`3d/js/skill_fx_three.js`) con:
  - **Horneado perezoso y cacheado** (cada preset se hornea a `CanvasTexture` una sola vez por sesión/escena).
  - **Pool fijo de planos/materiales** (cero asignaciones de geometría/textura por golpe, compatible con R-3).
  - **Soporte de dirección (`facing: 1 | -1`)**, escala configurable (`worldSize`) y orientación (billboard a cámara o plano horizontal en piso cuando corresponda).
  - **Limpieza total (`dispose()` / `clear()`)** al cerrar cada arena o reiniciar calle, manteniendo **0 fugas WebGL** (compatible con R-2).
- Mantener la compatibilidad con todos los tests E2E existentes (`attackfx.e2e.mjs`, fugas WebGL, rendimiento).

### No-Objetivos
- No reemplazar las chispas pequeñas de golpes básicos, polvo de salto ni ataques enemigos menores (mantienen el `fx.js` actual).
- No pre-exportar ni versionar PNGs estáticos en `3d/assets/` en esta iteración (el horneado en memoria desde `skill_fx.js` es determinista, pesa 0 KB extra en red y respeta el límite de 2048 px de Safari iOS).
- No cambiar reglas de jugabilidad, daño, hitboxes ni timings de las peleas.

### Anti-Objetivos (qué sería un fallo aunque compile)
- Tirones o caída de FPS en iPhone Safari al disparar poderes o remates.
- Fugas de texturas/geometrías WebGL al entrar y salir de las 4 arenas (regresión en R-2).
- Efectos que tapen por completo la lectura de telegrafiados de los jefes o la silueta del jugador.

## 3. Restricciones del Proyecto

- **Sincronización de ramas:** `skill_fx.js`, `skill_fx_presets.js` y `fx-studio.html` están en `origin/main` (`db86473`). Antes de implementar en `feat-3d`, se trae ese commit de `origin/main` sin pisar cambios locales.
- **Safari iOS / WebGL:** atlas ≤ 2048 px (`MAX_SAFARI_ATLAS = 2048` ya garantizado por `bakeSpriteSheet`).
- **R-2 (Cero fugas WebGL):** toda textura, geometría y material creado por el puente debe liberarse en `dispose()` (arenas) y reutilizarse/limpiarse en `clear()` (calle).
- **R-3 (Cero asignaciones por cuadro):** el `update(dt)` del puente solo actualiza `elapsed`, `offset` UV y `lookAt`/`visible` sobre un pool preasignado.
- **Accesibilidad / Motion reducido:** respetar el sistema de visibilidad y no bloquear lectura de telegraphs.

## 4. Enfoques Considerados

| Opción | Descripción | Trade-offs |
|---|---|---|
| **A — Solo Calle** | Conectar solo Douge, Marine y remate de combo en `fx.js` y `powers.js` (3 presets). | Muy rápido, pero deja sin usar los presets de Cepi, Lale y Margot. |
| **B — Calle + Arenas (Elegida)** | Puente reutilizable con caché + pool (`skill_fx_three.js`) conectado en calle y las 4 arenas, usando los **6 presets existentes**. | Toca ~7 archivos y exige validar R-2 en arenas, pero aprovecha el 100 % de lo construido en FX Lab y se nota en todo el juego. |
| **C — Reemplazo total** | Crear presets nuevos para cada golpe corto/largo, enemigos, Pinky y Facu, reemplazando todo `fx.js` y `burst()`. | Estética uniforme total, pero alto riesgo de ruido visual en iPhone y mucho ajuste de tests E2E. |

**Elegida:** **Opción B**, porque maximiza el impacto visual con esfuerzo mediano usando exactamente los 6 presets ya probados.

## 5. Mapa de Integración (Qué se conecta dónde)

### Módulo nuevo: `3d/js/skill_fx_three.js`
Encapsula `createSkillFxPool(THREE, scene, camera, { maxActive = 8 })`:
- `preload(presetIds)`: opcional para pre-hornear al inicio de escena (evita micro-pausa en el primer golpe).
- `play(presetId, pos, { worldSize = 3.0, facing = 1, flat = false })`: toma un slot libre del pool (o recicla el más antiguo), asigna la `CanvasTexture` cacheada del preset, posiciona y activa.
- `update(dt)`: avanza animación UV (`cols`, `rows`, `frames`, `fps`), orienta hacia cámara (o plano horizontal si `flat: true`) y oculta al terminar.
- `clear()`: oculta y resetea todos los slots activos sin destruir el caché de escena.
- `dispose()`: remueve los meshes de la escena y ejecuta `dispose()` sobre geometría compartida, materiales del pool y todas las `CanvasTexture` cacheadas.
- Expone contador `made` / `activeCount` para verificación E2E.

### Puntos de enganche por archivo
1. **`3d/js/fx.js`** (Calle):
   - Integra `skillPool = createSkillFxPool(THREE, scene, camera, { maxActive: 10 })`.
   - Expone `fx.skill(presetId, pos, opts)` y llama `skillPool.update(dt)` / `skillPool.clear()`.
   - En `fx.slash(pos, facing, 'finisher')`, además del conteo `made.finisher++` (para mantener compatibilidad con `attackfx.e2e.mjs`), dispara `effekseer_astral_slash` con el `facing` del héroe.
2. **`3d/js/powers.js`** (Poderes en Calle):
   - `truthWave(x, z)` dispara `fx.skill('douge_truth_slam', pos, { worldSize: 5.0 })`.
   - `flambe(x, z, hero)` dispara `fx.skill('marine_ivy_whirl', pos, { worldSize: 4.4 })`.
3. **`3d/js/arena_cepi.js`**:
   - `usePower()` dispara `marine_ivy_whirl` o `douge_truth_slam`.
   - Punto de Oro (`e.gold`) y `ko` disparan `cepi_golden_smash`.
   - `dispose()` limpia el pool de la arena.
4. **`3d/js/arena_lale.js`**:
   - `usePower()` dispara `marine_ivy_whirl` o `douge_truth_slam`.
   - Cambio a Fase 3 (`¡Subí el Horno!`) y `ko` disparan `lale_oven_flare`.
   - `dispose()` limpia el pool de la arena.
5. **`3d/js/arena_pinky.js`**:
   - `usePower()` dispara `marine_ivy_whirl` o `douge_truth_slam`.
   - `margotPapilla` (impacto de Margot) dispara `margot_hero_cry`.
   - `dispose()` limpia el pool de la arena.
6. **`3d/js/arena_facu.js`**:
   - `usePower()` dispara `marine_ivy_whirl` o `douge_truth_slam`.
   - Intervención artística / `pickRight` o `ko` dispara `margot_hero_cry` / `effekseer_astral_slash`.
   - `dispose()` limpia el pool de la arena.

## 6. Qué queda a criterio del implementador

- Ajuste fino de `worldSize`, altura `y` y `z`-offset (+0.35 / +0.5) en cada arena para que el plano aditivo nunca haga z-fighting con el sprite del personaje ni tape los carteles de fase.
- Decidir si `preload()` de los 2–3 presets de cada arena corre al crear la arena o de forma perezosa en el primer uso (recomendado: `preload` en la creación de la arena para 0 ms de latencia en el primer golpe).
- Verificar con la suite existente (`attackfx.e2e.mjs`, fugas WebGL R-2 y pruebas de arenas) y agregar verificación puntual de que los bursts se disparan y se limpian sin fugas.

## Decisiones tomadas en la implementación (actualizado 2026-11-28)
- **Blending:** se usa `NormalBlending` con `depthTest:false` y `renderOrder` alto en lugar de `AdditiveBlending`; el aditivo lavaba los colores sobre fondos claros (piso de Lale, galería). Consecuencia: el efecto se dibuja delante de todo, así que no debe salir grande delante del jefe mientras hay un ataque avisado.
- **Geometría:** una `PlaneGeometry` por slot del pool (no una compartida), porque cada slot cambia sus UV al avanzar de cuadro. El costo es fijo (máx. 10 en la calle, 6 por arena).
- **Hit-stop:** se acepta un congelado de 0,085 s al usar el poder en las 4 arenas, como excepción a «no cambiar timings».
- **Pendiente:** pasar `facing` desde `powers.js` y las arenas, respetar movimiento reducido y E2E de bursts y fugas.
