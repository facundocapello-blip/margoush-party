# Estado de MARGOUSH PARTY

Registro inicial: 2026-10-15. No constituye nueva prueba funcional.

## Fuentes verificadas
- Repositorio: https://github.com/facundocapello-blip/margoush-party (main).
- README describe el minijuego Chupete Rush, no el juego de plataformas completo.
- URL indicada en README: https://facundocapello-blip.github.io/margoush-party/ (no comprobada desde navegador de iPhone en esta auditoría).
- Ranking actual local al dispositivo; no online compartido.
- README documenta pruebas anteriores con Chromium; Safari físico pendiente.

## Siguiente verificación
- Confirmar URL desplegada, versión servida, carga de audio y controles táctiles.
- Mantener separada la identidad de este minijuego de otras versiones de MARGOUSH.

## Actualización 2026-10-17 · V0.7 candidata
- Nueva ruta aislada: `preview-v07/index.html`. Producción `index.html` V0.2 y V0.6 sin cambios.
- Base editada: V0.6. Margot queda en cuna con soporte hasta el piso, usando sprite existente; se eliminó su desplazamiento vertical.
- Puntajes transitorios reposicionados lejos de personajes; caras originales de Douge y Marine preservadas.
- Se agregó pausa manual, Inicio y pausa al ocultar la página sin reanudación automática; mensajes distintos para victoria a los 30 s y derrota por 3 errores.
- QA: Chromium móvil emulado 390x844: ambos personajes, ES/FR, instrucciones, inicio, control táctil, pausa/reanudar, Inicio, audio embebido en prueba, simulación de victoria/derrota y ocultación de página. Sin errores JS observados. No equivale a Safari físico.
- Pendientes: verificar GitHub Pages V0.7, Safari iPhone real, ranking compartido, Operación Siesta y Cocina de Le Concept.

## Actualización 2026-10-17 · V0.8 candidata
- Reporte del usuario: aspecto de sitio web, títulos y ranking lateral excesivos; falta X para cerrar resultado.
- Nueva ruta `preview-v08/index.html` sobre V0.7. Producción V0.2 y candidatas anteriores intactas.
- UI tipo juego: sin encabezado de página ni ranking lateral; HUD compacto; controles Inicio, ★ ranking, ES/FR y audio. Ranking local preservado en panel emergente; al abrir durante partida, pausa.
- Resultado: X visible para regresar a selección, conservando registro de puntajes. Controles y personajes originales sin cambios.
- Responsive: vertical y horizontal; modal horizontal ampliado para no recortar selección.
- QA automatizada en Chromium emulado: Douge y Marine, ES/FR, control táctil, pausa/reanudación, ranking, derrota, victoria, X, selección, viewports 320×568, 390×844, 393×852, 844×390 y 880×620. Sin errores JS observados. No es Safari físico.
- Pendiente: verificar despliegue V0.8 y validar en Safari físico; ranking compartido y otros minijuegos no implementados.

## 2026-11-15 · MARGOUSH 3D (rama `feat-3d`, carpeta `/3d/`)
- Juego nuevo, independiente de Chupete Rush: beat 'em up 2.5D en una calle 3D con las caricaturas de V23.8, Facu como ayudante y conductor, BIG CHAKY con dos fases, puntaje y ranking compartido (Supabase).
- Diseño: `docs/superpowers/specs/2026-11-15-margoush-3d-diseno.md`. Plan: `docs/superpowers/plans/2026-11-15-margoush-3d-plan.md`.
- Pruebas automáticas (Chrome sin pantalla, GPU por software): `npm test` y `node tests/e2e/<walk|combat|facu|story|ui|perf>.e2e.mjs`. Incluye partida completa jugada por un bot, apodos con HTML, doble toque en Guardar, sin conexión, 320×568 y minimizar la app.
- Rendimiento: lógica ≈ 2 ms por cuadro con CPU ×4; la calidad baja sola si no llega a 38 FPS. El tiempo de cuadro medido con GPU por software no representa un celular real.
- Pendiente: proyecto de Supabase (correr `3d/supabase.sql` y completar `3d/js/config.js`), prueba en iPhone/Safari real, merge a `main` con el OK de Facu.
- Chupete Rush (`index.html`) y `preview-v*/` sin cambios.

## 2026-11-16 · MARGOUSH 3D — dos niveles (rama `feat-3d`)
- Partida en dos niveles: Nivel 1 Buenos Aires (vereda, avenida, piquete) que termina en la puerta de Le Concept (el local azul de la pintura, único, con cartel dorado); Nivel 2 Francia (rue, boulevard, galpón y BIG CHAKY). Transición con resumen y cura de 2 corazones; no se puede volver atrás.
- Trampas: baldosa floja, bache, piquete (portón de fuego), colectivo, lluvia de boletas (−100), grève, trottinettes y palomas. Todas avisan antes.
- Malos nuevos armados desde el secuaz por código: patovica, el del bombo, mozo francés, delivery en bici.
- Puntaje: bonus de tiempo hasta 480 s; rangos S 18.000 / A 14.000 / B 9.000 (recorrido sin daño ≈ 22.600).
- Diseño: `docs/superpowers/specs/2026-11-16-margoush-3d-dos-niveles-design.md`. Plan: `docs/superpowers/plans/2026-11-16-margoush-3d-dos-niveles.md`.
- Pruebas nuevas: `node tests/e2e/<level|enemies|traps>.e2e.mjs` (traps acepta un nombre: `node tests/e2e/traps.e2e.mjs colectivo`).
- Pendiente igual que antes: Supabase, iPhone real, OK de Facu para `main`.

## 2026-11-16 · Pendientes reportados por Facu (para el próximo chat)
- BUG: el piquete no se puede pasar en partida real (se abre al despejar la oleada `piquete`; revisar si `enemies.alive()` cuenta malos de otras oleadas o trabados). Reproducir con bot antes de arreglar.
- Movimiento de los NPC muy parecido entre sí; Facu acepta modelos/animaciones de otros juegos o repos. Hacer brainstorming.
- Portada nueva con tema sintetizado: hecho (commit b41fc44).

## 2026-11-16 · Arreglo: el piquete no se levantaba
- Causa: el empujón entre malos (para que no se apilen) corría después del límite de portones. Con los del bombo apretados contra el fuego, uno quedaba del otro lado del piquete; seguía vivo y fuera de alcance, así que la oleada nunca se despejaba.
- Arreglo: `3d/js/enemies.js`, el empujón también respeta los portones cerrados.
- Prueba nueva en `tests/e2e/gates.e2e.mjs` (6 amontonamientos contra el fuego): fallaba (x=120,11) y ahora pasa (máx 117,80). Suite completa verde: `npm test` 28/28 y los 13 e2e.
- Pendiente: confirmar jugando en el iPhone.

## 2026-11-16 · Personajes (en curso) — para retomar con cualquier herramienta
- Diseño: `docs/superpowers/specs/2026-11-16-margoush-3d-personajes-design.md` (aprobado por Facu). Plan: `docs/superpowers/plans/2026-11-16-margoush-3d-personajes.md`.
- Hecho: Task 1 portada solo logo; Task 2 comportamiento de cada malo (turnos 2 cerca + 1 lejos, espera mirando, secuaz rodea/amaga, patovica embiste avisando, bombo a saltos); Task 3 poses por hoja con respaldo (`3d/js/cast.js`) + `tools/cut_sheet.py` (test `python3 -m pytest tools/test_cut_sheet.py`). Arreglos: dos secuaces ya no se traban buscando la misma espalda; nadie anuncia un golpe fuera de alcance.
- Falta: Task 4 dibujos (fotos de Lale, Cepi y Pinky pendientes), Task 5 Lale y manteca, Task 6 Cepi y Pinky, Task 7 apariciones de Facu, Task 8 integrar dibujos + revisión final.
- Pedido nuevo de Facu (sin diseño aún): cambiar mamaderas (`3d/js/props.js`, emoji 🍼, +1 vida +50) por cervezas 🍺 y hongos 🍄; agregar hongos venenosos que ponen la pantalla psicodélica (falta decidir si además invierten los controles).
- Pruebas: `npm test`, `python3 -m pytest tools/test_cut_sheet.py` y `for f in tests/e2e/*.e2e.mjs; do node $f; done` (Chrome sin pantalla; `tests/e2e/harness.mjs` espera three r128 en `/home/claude/tools/node_modules/three/build/three.min.js`).

## 2026-11-16 · Cierre de la sesión de personajes
- Hecho y verificado (suite completa verde: 28 unitarios + 17 e2e): Lale «Mantecoso» y la manteca; cervezas y hongos (con hongo venenoso psicodélico que no invierte los controles); efectos de ataque (estelas, puños de Douge, sartén en llamas de Marine, estelas de los malos); mini Facu sin micrófono y con movimiento; cada malo con su propia cara (`face_<tipo>_sheet`, fuentes en `tools/sheets_src/`, prompts en `docs/superpowers/specs/2026-11-16-prompts-personajes.md`).
- Límites conocidos: las caras salieron de 160×199 px (se ven blandas de cerca), una sola imagen por malo (se animan por código), mancha gris de sombra bajo los pies en algunos. Los efectos y las caras no se probaron en iPhone real.
- Falta: Cepi (decidido: mini-jefe a mitad del nivel 2 + reaparece atacando en la pantalla de derrota) y Pinky (aparece a ayudar y se va a ver a Boca); sus dibujos necesitan fotos de Facu. Apariciones cómicas de Facu (Task 7, cuando se haga se decide qué pasa con el mini Facu del auto). Task 8: integrar dibujos finales, revisión final de toda la rama con revisor nuevo, y OK de Facu para el merge a `main`.
- Posible más adelante, en su propio plan: 2 jugadores (local primero, online después).
