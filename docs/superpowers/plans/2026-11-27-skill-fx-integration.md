# Integración de MARGOUSH FX Lab (4 Capas) Implementation Plan

> **For agentic workers:** Native execution in this session, task-by-task with unit + E2E verification. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar los 6 presets multicapa de `skill_fx.js` / `skill_fx_presets.js` en la calle (`fx.js`, `powers.js`) y en las 4 arenas de jefes (`arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `arena_facu.js`) mediante un puente Three.js cacheado y con pool fijo.

**Architecture:** Un módulo nuevo `3d/js/skill_fx_three.js` envuelve `bakeSpriteSheet` de `skill_fx.js` con caché de `THREE.CanvasTexture` por `presetId` y un pool preasignado de `THREE.Mesh` (`PlaneGeometry` compartida + materiales por slot), exponiendo `preload`, `play`, `update`, `clear`, `dispose`, `made` y `activeCount`. La calle lo instancia dentro de `createFx`, y cada arena instancia y libera su propio pool en `dispose()`.

**Tech Stack:** Vanilla ES Modules, Three.js r128, Canvas2D, Node `node:test`, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-11-27-skill-fx-integration-design.md`

## Global Constraints

- Atlas Safari iOS ≤ 2048 px (`MAX_SAFARI_ATLAS = 2048`, ya aplicado por `bakeSpriteSheet`).
- R-2: Cero fugas WebGL — `dispose()` debe remover meshes de la escena y llamar `.dispose()` sobre la geometría compartida, los materiales del pool y cada `CanvasTexture` cacheada.
- R-3: Cero asignaciones por cuadro en `update(dt)` — solo actualiza `elapsed`, `offset` UV, orientación (`lookAt`) y `visible`.
- Compatibilidad total con `tests/e2e/attackfx.e2e.mjs` (`fx.made.finisher`, `fx.count('slash')`, `powers.made`, etc.) y `tests/e2e/leaks.e2e.mjs`.
- Sin cambios de jugabilidad, daño ni hitboxes.

## Review Focus

- Disparo repetido del mismo `presetId` no debe volver a llamar `bakeSpriteSheet` ni crear texturas nuevas (test unitario en Task 2).
- `play()` con pool saturado (`> maxActive`) recicla el slot más antiguo sin crear meshes ni filtrar materiales (test unitario en Task 2).
- `facing: -1` invierte el signo horizontal del mesh (`scale.x < 0`) y `facing: 1` lo restaura (`scale.x > 0`) (test unitario en Task 2).
- `dispose()` idempotente (llamarlo dos veces no lanza error y libera exactamente 1 geometría, `maxActive` materiales y `N` texturas) (test unitario en Task 2).
- Preset desconocido en `play('inexistente', pos)` no rompe el bucle de juego (retorna `null` de forma segura) (test unitario en Task 2).

---

### Task 1: Sincronizar módulos FX Lab (`db86473`) en `feat-3d`

**Files:**
- Bring from `origin/main` (`db86473`): `3d/js/skill_fx.js`, `3d/js/skill_fx_presets.js`, `3d/fx-studio.html`, `3d/css/fx_studio.css` (y sus tests si existen en `db86473`).

- [ ] **Step 1:** Traer `db86473` a `feat-3d` (cherry-pick o merge limpio desde `origin/main`) y confirmar que `npm test` pasa sin regresiones.

---

### Task 2: Crear `3d/js/skill_fx_three.js` con TDD

**Files:**
- Create: `3d/js/skill_fx_three.js`
- Test: `tests/skill_fx_three.test.mjs`

**Interfaces:**
- Consumes: `bakeSpriteSheet`, `SKILL_PRESETS` desde `./skill_fx.js`
- Produces: `export function createSkillFxPool(THREE, scene, camera, { maxActive = 8, baker = bakeSpriteSheet } = {})` -> `{ preload(ids), play(presetId, pos, { worldSize = 3.0, facing = 1, flat = false, yOffset = 0 } = {}), update(dt), clear(), dispose(), made, get activeCount(), get textureCount() }`

- [ ] **Step 1:** Escribir `tests/skill_fx_three.test.mjs` cubriendo los 5 casos de Review Focus (caché de texturas, reciclado de pool, `facing` ±1, `dispose()` idempotente y conteo de liberaciones, preset desconocido, avance de frames y auto-ocultado en `update(dt)`).
- [ ] **Step 2:** Correr `node --test tests/skill_fx_three.test.mjs` y verificar que falla por módulo ausente.
- [ ] **Step 3:** Implementar `3d/js/skill_fx_three.js` con geometría compartida, pool de slots preasignado, caché de texturas por `presetId`, `AdditiveBlending`, `depthWrite: false`, y `dispose()` limpio.
- [ ] **Step 4:** Correr `node --test tests/skill_fx_three.test.mjs` y verificar PASS.

---

### Task 3: Conectar en Calle (`3d/js/fx.js` y `3d/js/powers.js`)

**Files:**
- Modify: `3d/js/fx.js`
- Modify: `3d/js/powers.js`

**Interfaces:**
- Consumes: `createSkillFxPool` desde `./skill_fx_three.js`
- Produces: `fx.skill(presetId, pos, opts)` y `fx.skillPool` en el objeto devuelto por `createFx(...)`

- [ ] **Step 1:** En `3d/js/fx.js`: instanciar `skillPool = createSkillFxPool(THREE, scene, camera, { maxActive: 10 })`, exponer `skill(id, pos, opts)` y `skillPool`, disparar `effekseer_astral_slash` en `slash(..., 'finisher')`, llamar `skillPool.update(dt)` en `update(dt)` y `skillPool.clear()` en `clear()`.
- [ ] **Step 2:** En `3d/js/powers.js`: disparar `fx.skill('douge_truth_slam', ...)` en `truthWave(x, z)` y `fx.skill('marine_ivy_whirl', ...)` en `flambe(x, z, hero)`.

---

### Task 4: Conectar en las 4 Arenas de Jefes

**Files:**
- Modify: `3d/js/arena_cepi.js`
- Modify: `3d/js/arena_lale.js`
- Modify: `3d/js/arena_pinky.js`
- Modify: `3d/js/arena_facu.js`

- [ ] **Step 1:** En `arena_cepi.js`: crear `skillFx = createSkillFxPool(T, scene, cam, { maxActive: 6 })`, `skillFx.preload([isM ? 'marine_ivy_whirl' : 'douge_truth_slam', 'cepi_golden_smash'])`, disparar en `usePower()`, en devolución `e.gold` y en `ko`; actualizar en `update(dt)` y liberar en `dispose()`.
- [ ] **Step 2:** En `arena_lale.js`: crear `skillFx`, precargar poder del héroe + `lale_oven_flare`, disparar en `usePower()`, en `phase` (Fase 3 "¡Subí el Horno!") y en `ko`; actualizar en `update(dt)` y liberar en `dispose()`.
- [ ] **Step 3:** En `arena_pinky.js`: crear `skillFx`, precargar poder del héroe + `margot_hero_cry`, disparar en `usePower()`, en impacto de `margotPapilla` y en `ko`; actualizar en `update(dt)` y liberar en `dispose()`.
- [ ] **Step 4:** En `arena_facu.js`: crear `skillFx`, precargar poder del héroe + `margot_hero_cry` + `effekseer_astral_slash`, disparar en `usePower()`, en `pickRight` y en `ko`; actualizar en `update(dt)` y liberar en `dispose()`.

---

### Task 5: Verificación completa (Unit + E2E + Fugas WebGL)

- [ ] **Step 1:** Correr `npm test` (todos los unit tests).
- [ ] **Step 2:** Correr E2E clave: `tests/e2e/attackfx.e2e.mjs`, `tests/e2e/leaks.e2e.mjs`, `tests/e2e/cepi_pinky.e2e.mjs`, `tests/e2e/facu_galerista.e2e.mjs`.
- [ ] **Step 3:** Revisar `git diff --stat` y `git status`, y confirmar todo verde antes de reportar.
