# MARGOUSH 3D · Inventario de arte y poses faltantes (A-0)

Relevamiento automático contra `3d/assets/manifest.json` y el código vigente (`arena*.js`, `hero.js`, `chase.js`, `bonus.js`, `cine.js`, `story.js`, `cast.js`, `poses.js`, `enemies.js`, `margot.js`, `margot_finish.js`, `ui.js`).

Leyenda de estado:
- **OK**: existe asset dedicado y el juego lo usa.
- **REEMPLAZA**: el juego reutiliza otra pose/sprite (a veces con inclinación o escala por código).
- **CÓDIGO**: se dibuja o anima por código (Canvas / geometría Three.js / transformaciones sobre sprite único).
- **FALTA**: el código ya busca el slot o la mecánica lo pide, pero no existe el asset en `manifest.json`.
- **ANCHO > 2048**: existe pero supera 2048 px de ancho (ver tarea **R-4**).

---

## Resumen de prioridades (por tiempo en pantalla e impacto visual)

1. **P0 · Crítico (A-1) — Facu galerista (Acto 5, jefe final):** 0 de 10 assets propios (`arena_facu_*` + `arena_facu_fondo`). Toda la pelea final usa el dibujo viejo de presentador (`facu.webp`, con micrófono) animado por código sobre una pared generada en Canvas.
2. **P1 · Alto (A-2) — Héroes en arenas 3D (Douge y Marine, presentes en 4 de 5 jefes + BYD):** faltan `arena_<heroe>_back_power` (hoy repite `punch`) y `arena_<heroe>_back_ko` / derrota (hoy congela `hurt`). En el baile de Chaky, `hurt` cae a la pose lateral de calle (`*_actions_sheet`).
3. **P1 · Alto (A-4) — Margot en sus gags (cinemáticas + remates de Pinky y Facu):** faltan poses propias tirando el chupete, revoleando la papilla y garabateando con crayones (hoy repite `margot_sheet`/`arena_margot_cheer` + accesorios dibujados por código). Además `arena_margot_hero` quedó huérfana tras reemplazar el grito por la papilla.
4. **P2 · Medio (A-3) — Jefes (gesto previo `windup` y reacciones):** faltan `arena_lale_windup`, `arena_cepi_windup`, `arena_pinky_stun` (ciego por la papilla) y opcionalmente regenerar `arena_cepi_ko` (hoy recorte de `443×344` sacado de `cepi_actions_sheet`) y `arena_pinky_warn` (señalando cajón).
5. **P3 · Bajo (A-6 / R-4) — Secuaces y hojas anchas:** los 5 secuaces de calle tienen 4 poses (`*_sheet.webp`), sin ciclo de caminata dedicado (`*_walk_sheet`) ni pose `ko`; `delivery` usa bicicleta 3D básica. Cuatro hojas existentes superan 2048 px de ancho (`douge_walk_sheet` 3000, `cepi_actions_sheet` 2400, `pinky_walk_sheet` 2268, `chaky_walk_sheet` 2064).

---

## 1. Douge (héroe)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Calle (`hero.js`) | `idle` | `douge_idle.webp` | OK | — |
| Calle (`hero.js`) | `walk` (caminata lenta) | `douge_walk_sheet.webp` (10 cuadros, `3000×512`) | ANCHO > 2048 | R-4 |
| Calle (`hero.js`) | `run` (corrida) | `douge_run.webp` (6 cuadros) | OK | — |
| Calle (`hero.js`) | `attack1/2/3` (combo) | `douge_combo_sheet.webp` (3 cuadros) | OK | — |
| Calle (`hero.js`) | `jump`, `dodge`, `hurt`, `power` | `douge_actions_sheet.webp` (4 cuadros) | OK | — |
| Rescate (`story.js`) | `carry` (con Margot en brazos) | `rescate_sheet.webp` (celda 0) | OK | — |
| Persecución (`chase.js`) | `drive`, `jump`, `hit`, `power` | `chase_douge_{drive,jump,hit,power}.webp` | OK | — |
| Baile Chaky (`arena.js`) | `dance_idle`, `point`, `jump`, `left`, `right` | `douge_dance_sheet.webp` (4 cuadros frontales) | OK | — |
| Baile Chaky (`arena.js`) | `hurt` / `down` (fallo o derrota en escenario) | `douge_actions_sheet` celda 2 (pose lateral de calle) | REEMPLAZA | Media |
| Baile Chaky (`arena.js`) | `victory` (Chaky KO) | `douge_dance_sheet` celda 1 (`jump`) | REEMPLAZA | Baja |
| Arenas 3D + BYD (`arena_*.js`, `bonus.js`) | `back_idle`, `back_run0..3`, `back_jump`, `back_dodge`, `back_punch`, `back_hurt` | `arena_douge_back_*.webp` | OK | — |
| Arenas 3D + BYD (`arena_*.js`, `bonus.js`) | **Poder** (`powT > 0`, «¡Verdades a los gritos!») | Repite `arena_douge_back_punch` | **FALTA** (`arena_douge_back_power`) | **Alta (A-2)** |
| Arenas 3D (`arena_*.js`) | **Derrota** (`phase === 'down'`) | Repite `arena_douge_back_hurt` | **FALTA** (`arena_douge_back_ko`) | **Media-Alta (A-2)** |
| Victoria (`ui.js`) | Pantalla de resultado ganado | `arena_douge_victory.webp` + `arena_familia_festejo.webp` | OK | — |

---

## 2. Marine (heroína)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Calle (`hero.js`) | `idle` | `marine_idle.webp` | OK | — |
| Calle (`hero.js`) | `walk` (caminata lenta) | `marine_walk_sheet.webp` (8 cuadros, `1744×400`) | OK | — |
| Calle (`hero.js`) | `run` (corrida) | `marine_run.webp` (6 cuadros) | OK | — |
| Calle (`hero.js`) | `attack1/2/3` (combo) | `marine_combo_sheet.webp` (3 cuadros) | OK | — |
| Calle (`hero.js`) | `jump`, `dodge`, `hurt`, `power` | `marine_actions_sheet.webp` (4 cuadros) | OK | — |
| Rescate (`story.js`) | `carry` (con Margot en brazos) | `rescate_sheet.webp` (celda 1) | OK | — |
| Persecución (`chase.js`) | `drive`, `jump`, `hit`, `power` | `chase_marine_{drive,jump,hit,power}.webp` | OK | — |
| Baile Chaky (`arena.js`) | `dance_idle`, `point`, `jump`, `left`, `right` | `marine_dance_sheet.webp` (4 cuadros frontales) | OK | — |
| Baile Chaky (`arena.js`) | `hurt` / `down` (fallo o derrota en escenario) | `marine_actions_sheet` celda 2 (pose lateral de calle) | REEMPLAZA | Media |
| Baile Chaky (`arena.js`) | `victory` (Chaky KO) | `marine_dance_sheet` celda 1 (`jump`) | REEMPLAZA | Baja |
| Arenas 3D + BYD (`arena_*.js`, `bonus.js`) | `back_idle`, `back_run0..3`, `back_jump`, `back_dodge`, `back_punch`, `back_hurt` | `arena_marine_back_*.webp` | OK | — |
| Arenas 3D + BYD (`arena_*.js`, `bonus.js`) | **Poder** (`powT > 0`, «¡Hiedra!») | Repite `arena_marine_back_punch` | **FALTA** (`arena_marine_back_power`) | **Alta (A-2)** |
| Arenas 3D (`arena_*.js`) | **Derrota** (`phase === 'down'`) | Repite `arena_marine_back_hurt` | **FALTA** (`arena_marine_back_ko`) | **Media-Alta (A-2)** |
| Victoria (`ui.js`) | Pantalla de resultado ganado | `arena_marine_victory.webp` + `arena_familia_festejo.webp` | OK | — |

---

## 3. Margot

> Regla de diseño cerrada: **Margot nunca llora** (se ríe, tira el chupete, revolea papilla a Pinky y garabatea con crayones a Facu).

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| HUD (`margot.js`) | `calm`, `happy`, `cry` | `margot_faces.webp` (3 celdas) | OK *(nota: celda 2 sigue siendo llanto)* | Baja |
| Cinemáticas (`cine.js`) | Cochecito despierta / contenta | `margot_sheet.webp` (celdas 1 y 3) | OK | — |
| Cinemáticas (`cine.js`) | **Tirando el chupete** (`margotGag`) | `margot_sheet` celda `happy` + chupete 3D geométrico (`Torus`+`Cylinder`+`Sphere`) | **FALTA / CÓDIGO** (`arena_margot_pacifier`) | **Alta (A-4)** |
| Baile Chaky (`arena.js`) y BYD (`bonus.js`) | Mirando el combate / festejando | `margot_sheet.webp` (incluye celda 2 `cry` en intro/derrota de Chaky y en BYD) | REEMPLAZA *(conviene pasar a `arena_margot_scared`/`cheer` sin llanto)* | Media |
| Arenas Cepi y Lale (`arena_cepi.js`, `arena_lale.js`) | Asustada / festejando | `arena_margot_scared.webp` / `arena_margot_cheer.webp` | OK | — |
| Arena Pinky (`margot_finish.js`) | **Revoleando papilla de zapallo** (`kind='papilla'`) | Usa `arena_margot_cheer` + plato y plasta pintados por código en Canvas | **FALTA / CÓDIGO** (`arena_margot_papilla`) | **Alta (A-4)** |
| Arena Facu (`margot_finish.js`) | **Garabateando con crayones** (`kind='crayons'`) | Usa `arena_margot_cheer` + crayones/corazones por código en Canvas | **FALTA / CÓDIGO** (`arena_margot_crayons`) | **Alta (A-4)** |
| Rescate (`story.js`) | En la jaula / feliz | `margot_sheet.webp` (celda 2 `crying` al inicio y celda 3 `happy`) | REEMPLAZA | Baja |
| Asset sin uso actual | `arena_margot_hero.webp` (grito supersónico viejo) | En `manifest.json` pero ya no la referencia `arena_pinky.js` ni `margot_finish.js` | SIN USO *(evaluar poda al agregar A-4)* | — |

---

## 4. Big Chaky (Jefe 1 · Acto 1)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Intro y Rescate (`cine.js`, `story.js`) | Caminata, `arms`, `push`, `scared`, `strike`, `hurt`, `ko` | `chaky_walk_sheet.webp` (6 cuadros, `2064×512`), `chaky_actions_sheet.webp` (4), `kidnap_sheet.webp` (4) | OK *(walk > 2048 px: R-4)* | R-4 |
| Arena baile (`arena.js`) | `dance_idle`, `dance_jump`, `dance_attack`, `dance_dodge`, `dance_laugh`, `dance_ko` | `arena_chaky_dance_*.webp` (6/6 completos) | OK | — |
| Arena baile (`arena.js`) | `hurt` | Reutiliza `arena_chaky_dance_dodge` + flash rojo | REEMPLAZA *(aceptable en baile)* | Baja |
| Arena baile (`arena.js`) | Fondo hangar VIP disco | `arena_aeropuerto_fondo.webp` | OK | — |

---

## 5. Cepi «el Niño» (Jefe 2 · Acto 2)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Cinemáticas y BYD (`cine.js`, `bonus.js`, `story.js`) | Caminata y acciones (`idle/strike/hurt/ko`) | `cepi_walk_sheet.webp` (6 cuadros), `cepi_actions_sheet.webp` (4 cuadros, `2400×512`) | OK *(actions > 2048 px: R-4)* | R-4 |
| Persecución (`chase.js`) | En el BYD: `drive`, `windup`, `throw`, `dead` | `chase_cepi_{drive,windup,throw,dead}.webp` | OK | — |
| Pantalla derrota (`ui.js`) | Enojado tirando trompadas | `cepi_sheet.webp` (4 cuadros) | OK | — |
| Arena pádel (`arena_cepi.js`) | `idle`, `smash`, `block`, `tired`, `stun`, `back`, `point`, `cardboard`, `hurt`, `fondo` | `arena_cepi_*.webp` + `cepi_walk_sheet` para correr | OK | — |
| Arena pádel (`arena_cepi.js`) | **Carga / anticipación (`windup > 0`)** | Reutiliza `arena_cepi_smash` aplastado/inclinado por código (`arena_cepi.js:571`) | **REEMPLAZA** (`arena_cepi_windup`) | **Media (A-3)** |
| Arena pádel (`arena_cepi.js`) | `ko` | `arena_cepi_ko.webp` (`443×344`, recorte de baja res. de `cepi_actions_sheet`, `hk: 0.65`) | REEMPLAZA *(calidad menor)* | Baja-Media (A-3) |

---

## 6. Lale «Mantecoso» (Jefe 3 · Acto 3)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Cinemáticas y Rescate (`cine.js`, `story.js`) | Caminata y acciones | `lale_walk_sheet.webp` (6 cuadros), `lale_actions_sheet.webp` (4 cuadros) | OK | — |
| Gradas de Cepi (`arena_cepi.js`) | Espectador en tarima | `arena_lale_idle.webp` *(se ve chico: ajustar escala en A-7)* | OK | A-7 |
| Arena Le Blé (`arena_lale.js`) | `idle`, `throw`, `skate`, `skate2`, `floured`, `hurt`, `ko`, `fondo` | `arena_lale_*.webp` + `lale_walk_sheet` para caminar | OK | — |
| Arena Le Blé (`arena_lale.js`) | **Carga / anticipación (`windup > 0`)** | Reutiliza `arena_lale_throw` inclinado hacia atrás por código (`arena_lale.js:526`) | **FALTA** (`arena_lale_windup`) | **Media-Alta (A-3)** |
| Arena Le Blé (`arena_lale.js`) | Bolsa de harina, barras de manteca y charcos | Canvas (`flourBagTex`) y geometría 3D (`BoxGeometry` / `CircleGeometry`) | CÓDIGO *(legible; pulido opcional A-7)* | Baja |

---

## 7. Pinky «el Trapito» (Jefe 4 · Acto 4)

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Cinemáticas y Rescate (`cine.js`, `story.js`) | Caminata y acciones | `pinky_walk_sheet.webp` (6 cuadros, `2268×512`), `pinky_actions_sheet.webp` (4 cuadros) | OK *(walk > 2048 px: R-4)* | R-4 |
| Arena estacionamiento (`arena_pinky.js`) | `idle`, `reveal`, `wave`, `charge`, `hurt`, `ko`, `car`, `fondo` | `arena_pinky_*.webp` + `pinky_walk_sheet` al desplazarse | OK | — |
| Arena estacionamiento (`arena_pinky.js`) | **Aturdido / ciego por papilla** (`margotFx.blind`) | Queda en `wave`/`hurt` balanceándose por código + plasta de Canvas encima | **FALTA** (`arena_pinky_stun`) | **Media-Alta (A-3)** |
| Arena estacionamiento (`arena_pinky.js`) | **Gesto previo señalando cajón** (`warnCar`) | Reutiliza `arena_pinky_wave` inclinado por código (`arena_pinky.js:539`) | REEMPLAZA (`arena_pinky_warn` opcional) | Baja-Media (A-3) |

---

## 8. Facu «el Cerebro / Galerista» (Jefe 5 · Acto 5, jefe final)

> Regla 7 obligatoria: **todo el arte de Facu debe ser aprobado por Facu antes de publicarlo.** Look definido: galerista/pintor (delantal o saco con manchas de pintura, pincel/paleta; **sin micrófono**).

| Contexto | Pose / estado que usa el juego | Asset actual / comportamiento | Estado | Prioridad |
|---|---|---|---|---|
| Arena HENRIS (`arena_facu.js`) | `idle` (reposo / paseando) | `facu.webp` (presentador viejo) animado por código | **FALTA** (`arena_facu_idle`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `reveal` (entrada + minijuego Fase 2) | `facu.webp` animado por código | **FALTA** (`arena_facu_reveal`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `aim` (apuntando pincelazo) | `facu.webp` inclinado por código | **FALTA** (`arena_facu_aim`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `throw` (soltando pincelazo o cuadro) | `facu.webp` inclinado por código | **FALTA** (`arena_facu_throw`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `paint` (pintando de espaldas en el atril) | `facu.webp` espejado por código | **FALTA** (`arena_facu_paint`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `windup` (levantando cuadro en Fase 3) | `facu.webp` inclinado/temblando por código | **FALTA** (`arena_facu_windup`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `hurt` (golpeado) | `facu.webp` inclinado + flash rojo | **FALTA** (`arena_facu_hurt`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `love` (derretido por los crayones de Margot) | `facu.webp` saltando + corazones Canvas | **FALTA** (`arena_facu_love`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | `ko` (rendido ante el arte) | `facu.webp` aplastado (`sy = 0.7`) | **FALTA** (`arena_facu_ko`) | **CRÍTICA (A-1)** |
| Arena HENRIS (`arena_facu.js`) | Fondo de la galería HENRIS por dentro | Pared procedural dibujada en Canvas (`wallTex`, líneas 110-127) | **FALTA** (`arena_facu_fondo`) | **CRÍTICA (A-1)** |
| Escena `post_pinky` y Rescate (`cine.js`, `story.js`) | Caminando / aplaudiendo en `CREW` | `facu.webp` (1 sola imagen sin caminata ni poses de acción) | CÓDIGO *(mejora con `facu_walk_sheet` opcional en A-6)* | Media |

---

## 9. Secuaces de calle (`enemies.js`, `level.js`)

Acto 1 (Buenos Aires): `patovica` (King Kong) y `bombo`. Actos 3 y 4 (Francia): `secuaz` (Hans Landa), `mozo` y `delivery`.

| Personaje | Poses que usa el juego | Asset actual | Estado | Prioridad |
|---|---|---|---|---|
| `patovica` (King Kong) | `idle`, `step`, `strike`, `hurt`, `ko`, caminata | `patovica_sheet.webp` (4 cuadros) + respaldo `face_patovica_sheet.webp`. Sin `walk_sheet` (alterna `idle`/`step` + rebote) ni `ko` (usa `hurt`). | PARCIAL (2 cuadros al caminar) | Baja (A-6) |
| `bombo` | `idle`, `step`, `strike`, `hurt`, `ko`, saltos | `bombo_sheet.webp` (4 cuadros) + respaldo `face_bombo_sheet.webp`. Sin `walk_sheet` ni `ko`. | PARCIAL | Baja (A-6) |
| `secuaz` (Hans Landa) | `idle`, `step`, `strike`, `hurt`, `ko`, caminata | `secuaz_sheet.webp` (4 cuadros) + respaldo `face_secuaz_sheet.webp`. Sin `walk_sheet` ni `ko`. | PARCIAL | Baja (A-6) |
| `mozo` | `idle`, `step`, `strike`, `hurt`, `ko`, caminata | `mozo_sheet.webp` (4 cuadros) + respaldo `face_mozo_sheet.webp`. Sin `walk_sheet` ni `ko`. | PARCIAL | Baja (A-6) |
| `delivery` | `idle`, `step`, `strike`, `hurt`, `ko`, bici | `delivery_sheet.webp` (4 cuadros) + bicicleta 3D geométrica (`buildBike()` en `enemies.js:77`). | PARCIAL / CÓDIGO | Baja (A-6) |

---

## Ajuste recomendado para las tareas A-1 a A-4

- **A-1 (Facu · 10 imágenes):** `arena_facu_{idle,reveal,aim,throw,paint,windup,hurt,love,ko}` + `arena_facu_fondo`. Requiere foto de Facu y su aprobación antes de publicar.
- **A-2 (Héroes · 4 imágenes obligatorias + 2 opcionales):**
  - Obligatorias: `arena_douge_back_power`, `arena_marine_back_power`, `arena_douge_back_ko`, `arena_marine_back_ko` (conectarlas en `arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `arena_facu.js` y `bonus.js`).
  - Opcionales: `arena_douge_dance_hurt`, `arena_marine_dance_hurt` (para que en el duelo de Chaky no salten al sprite lateral de calle).
- **A-3 (Jefes · 3 imágenes principales + 2 opcionales):**
  - Principales: `arena_lale_windup`, `arena_cepi_windup`, `arena_pinky_stun` (embadurnado/ciego por la papilla).
  - Opcionales: regenerar `arena_cepi_ko` en 768 px y agregar `arena_pinky_warn`.
- **A-4 (Margot · 3 imágenes):** `arena_margot_pacifier` (tirando chupete en `cine.js`), `arena_margot_papilla` (revoleando papilla en `margot_finish.js`), `arena_margot_crayons` (garabateando con crayones en `margot_finish.js`). Aprovechar para quitar el uso residual de la celda `cry` de `margot_sheet` en `arena.js` y `bonus.js`, y evaluar podar `arena_margot_hero.webp` si no se reutiliza para mantener `3d/assets/` holgado bajo 10 MB.
