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

## 2026-11-17 · Cierre de sesión (Nivel 1 con aspecto de Francia)
- Hecho: hojas de 4 poses de Pinky, Cepi y Lale (Lale ya se usa en el juego); mini Facu sin cartel flotante; enemigos 31 a 26 (una oleada menos de secuaz en piquete, le-concept, francia, boulevard y boulevard-2); el Nivel 1 (Buenos Aires) adopta el aspecto de Francia (fachadas pintadas de `street_bg`, adoquines, vereda clara, guirnaldas, macetas; se conservan cartel BUENOS AIRES, colectivo y plátanos). Orden de la historia sin cambios. Prueba nueva: `tests/e2e/level1_look.e2e.mjs`. Suite completa verde.
- Commits en `feat-3d`: 46aa20f, 2c42f05, 5ccf307, 913cf41, 596c395, b0661b9. Todo subido.
- Vista previa pública republicada (https://claude.ai/artifact/VxSUGZoXMyrtY1vT1vSWbz). El artefacto sirve desde la raíz (`js/`, `assets/`, `css/`), no desde `3d/`.
- Pendiente: Cepi (mini-jefe nivel 2 + pantalla de derrota) y Pinky (ayuda y se va a Boca) con sus hojas ya listas (`cepi_sheet`, `pinky_sheet`; falta `3d/js/cameos.js`, `ui.js showResult`, sfx); apariciones cómicas de Facu (decidir el mini Facu del auto); revisión final de la rama con revisor nuevo; Supabase (`3d/supabase.sql`); prueba en iPhone real; OK de Facu para `main`; opcional: Nivel 1 y Francia se ven casi iguales (sacar plátanos o dar otro tono a Francia); caras de enemigos en mayor resolución; 2 jugadores en su propio plan.

## 2026-11-17 · Cepi y Pinky dentro del juego
- Hecho: **Cepi «el Niño»** es mini-jefe a mitad del nivel 2 (oleada `boulevard`, reemplaza al patovica; 26 malos sigue igual): 14 de vida, empuja, grita frases mientras te busca, cartel propio, barra de vida con su nombre (reusa `#boss-bar`) y 600 puntos. **En la pantalla de derrota** aparece Cepi (no Facu) entrando desde la derecha, tirando trompadas (pose golpe ↔ parado) y con una frase enojada; abucheo sintetizado (`boo`). Al ganar presenta Facu como antes.
- Hecho: **Pinky** (`3d/js/cameos.js`): una vez por nivel, cuando la zona queda despejada (sin malos vivos ni oleada activa), entra corriendo desde atrás con «¡Aguantá que te ayudo!», se queda al lado, escucha «📻 ¡GOOOL DE BOCA!» (sonido `goal`), festeja saltando y se va corriendo «¡Me voy a la cancha!». No frena el juego. Se limpia al cambiar de nivel, al perder y al volver al menú. `setStage` (solo pruebas) lo apaga salvo que la prueba lo pida.
- Respaldo si faltan las hojas: `courier_cepi` y `courier_pinky` recoloreados en `skins.js`.
- Prueba nueva: `tests/e2e/cepi_pinky.e2e.mjs` (Cepi en nivel 2 con cartel, barra y hoja; Pinky una vez por nivel y nunca con malos vivos; no frena; menú a mitad no deja actores; Cepi al perder en 960×540, 390×844 y 844×390 sin tapar puntaje ni botones; al ganar no aparece).
- Nota: la camiseta de la hoja de Pinky tiene un escudito chico en el pecho (el diseño pedía camiseta sin escudo).
- Pendiente: apariciones cómicas de Facu (decidir el mini Facu del auto); revisión final de la rama con revisor nuevo; Supabase; iPhone real; OK de Facu para `main`; opcionales y detalles menores como antes.

## 2026-11-17 · Jugabilidad y HUD para iPhone (después de la crítica de jugabilidad, 20/40)
- **Sin baches**: se sacaron los 3 (mataban en bucle al que dejaba el pulgar empujando adelante: de 5 corazones a derrota en 2,8 s).
- **Controles nuevos en el celu**: joystick flotante (aparece donde apoyás el pulgar en la mitad izquierda y vuelve a su lugar al soltar); 3 botones en arco: 👊 grande (98 px), SALTO y ESQUIVE (70 px) con ícono + texto de 12 px; se sacó el botón ⚡ suelto. Botones algo más transparentes para ver a los malos que entran por la derecha.
- **Puntería automática**: al pegar, el héroe se da vuelta hacia el malo más cercano (≤ 2,8 m) y se acomoda un poco de carril.
- **Barra de poder** (en vez del reloj de 7 s): arranca llena; se carga pegando (remate y voltear suman más) y con **esquive justo** («¡JUSTO!»). Llena: el 👊 tiene un anillo dorado que late y dice MANTENÉ; **mantener 👊** (o L/E en la compu) lanza el poder. Barra «PODER / ⚡ ¡LISTO!» en el HUD.
- **Poderes nuevos (sin apuntar)**: Douge «¡VERDADES A LOS GRITOS!» = onda en círculo que voltea a todos (adelante y atrás) y les grita verdades («¡ESTÁS PELADO!», «¡TENÉS OLOR A PATA!»…). Marine «¡FLAMBÉ!» = giro con la sartén en llamas que quema y aturde, deja fuego en el piso y un croissant que le devuelve 1 corazón. Las cartas de elección explican la diferencia.
- **Primera partida**: indicaciones arriba al centro, una por vez, que se van al hacerlas (caminar → combo ×3 → esquive → poder); después no vuelven a salir en ese celu.
- **Vertical**: el juego se frena con «Girá el celu para jugar» a pantalla completa y sigue al girarlo.
- **HUD**: silencio/pausa y pestañas del ranking ≥ 44 px; textos mínimos 12 px; placeholder «Tu apodo» con contraste; con 0 puntos no se ofrece guardar; «¡ZONA DESPEJADA!» pasa a ser un aviso chico sobre el héroe (menos carteles); los textos flotantes no se cortan en el borde. Pinky: si llegás a la oleada siguiente mientras actúa, festeja el gol ya y se va; la oleada espera menos de un segundo y nunca hay dos a la vez.
- Pruebas: nueva `tests/e2e/controls.e2e.mjs`; ajustadas `attackfx`, `layout`, `mobile`, `traps` (sin bache; el paso del piquete espera la posición), `friends`. Suite completa verde.
- Pendiente: el rango S sigue saliendo fácil (falta puntos por estilo y subir el corte); final (jefe y rescate) más a la altura; opción en francés; probar en iPhone real.

## 2026-11-17 · Lo que vio Facu jugando en el iPhone
- **Sin la ayuda de botones** (molestaba y tardaba en irse): se sacó `coach.js`.
- **Se juega con el celu parado**: ya no se frena ni pide girar; la cámara usa lente más abierta y menos calle a lo ancho, cartel arriba de los botones y barra del jefe debajo del HUD.
- **Pasar de nivel al llegar al final**: despejada Le Concept sale «¡LE CONCEPT ES NUESTRO! Seguí hasta el final de la calle…» con flechas «FRANCIA →»; la transición (3,2 s) arranca recién al llegar al final del Nivel 1.
- **Buenos Aires distinto de Francia**: casitas de chapa de colores tipo Caminito con balcones, malvones, persianas y carteles fileteados; asfalto con línea central; vereda de baldosas grises; banderines celestes y blancos; cielo de atardecer y el Obelisco al fondo. Las fachadas pintadas, adoquines, guirnaldas tricolor y macetas quedan solo en Francia.
- **Sin grève** (la fila de manifestantes que no te dejaba pasar).
- **Menos malos (26 → 17)**, sin mozos en las oleadas (se deslizaban); paso más natural: menos pasos por metro, balanceo de lado a lado e inclinación al caminar. Rangos recalibrados (S 13.400, A 10.400, B 6.700).
- Pendiente: que los malos caminen como Douge y Marine necesita hojas de caminata propias (hoy secuaz, patovica, bombo y delivery tienen un solo dibujo).

## 2026-11-17 · La banda son los amigos (Lale, Cepi y Pinky trapito)
- Se van de las oleadas el secuaz, el patovica, el del bombo y el delivery (el código queda). La banda de BIG CHAKY son tres amigos de Facu, 18 en total, nunca dos iguales a la vez:
  - **Pinky «el trapito»** (cuerpo a cuerpo): hincha de Boca que te quiere cobrar el estacionamiento; frases («¿Te lo cuido, jefe?», «¡Son 2 lucas, maestro!»); si te pega te saca $100 de puntaje.
  - **Lale «Mantecoso»**: tira barras de manteca (como antes).
  - **Cepi «el Niño»**: tira pelotazos de pádel con sombra de aviso; en el boulevard viene **Cepi jefe** (14 de vida, tira de a tres, barra de vida).
  - Cada uno se presenta con su cartel la primera vez que aparece; el jefe siempre.
- Pinky ya no aparece como ayudante (cameo apagado con `PINKY.enabled = false`).
- Rangos recalibrados (S 14.800, A 11.500, B 7.400).
- Guía de imágenes para Facu (prompts y referencias, 19 imágenes en orden de prioridad): https://claude.ai/artifact/M1SjeUq8zr8AmHbKP4njeR
- Pendiente: integrar las imágenes cuando lleguen (tiras de caminata de 6 cuadros para los malos, hojas de acciones, combo/acciones de los héroes, BIG CHAKY, rescate, Le Blé, Punto de Oro, HENRIS, calle porteña pintada, galpón, objetos).

## 2026-11-17 · Facu, sonido, listo para las imágenes y el final
- **Facu en chiste** (`facu.js` reescrito): ya no hay auto que acompaña toda la partida. Aparece de golpe: sale de una **alcantarilla** una vez por nivel cuando te rodean 2 malos (chiste que los aturde y se vuelve a meter); **cruza en su auto a toda velocidad** por atrás tocando bocina una vez por nivel; al pasar a **Francia** aparece con boina y baguette («¡Allez, allez!»); en el **resultado** (si ganás) asoma por el costado con una frase y se va. Ya no presenta la intro ni el rescate.
- **Sonido**: en la intro no suena el tema del héroe (arranca al jugar); en el rescate se corta la música del jefe y suena la fanfarria. La música pasa por Web Audio con su propio volumen (iOS ignora el volumen de `<audio>`; el silencio apaga todo junto). Falta confirmarlo en un iPhone real.
- **Listo para las imágenes de la guía**: `tools/import_art.py <imagen>` saca el fondo verde, corta y anota en el manifiesto según el nombre del archivo (512 px de alto). El juego usa cada hoja si existe: caminata de 6 cuadros y acciones (KO) de Lale/Cepi/Pinky; combo de 3 y acciones (salto, esquive, golpeado, poder) de Douge/Marine; caminata y acciones (pisotón, KO) de BIG CHAKY; `rescate` (héroe con Margot en brazos); `objetos` (manteca, pelota, cerveza, hongos, medialuna, sartén…); `calle_buenos_aires`, `galpon`, y los locales **Punto de Oro (x 34), Le Blé (x 86) y HENRIS (x 103)**, que mientras tanto se dibujan por código con su cartel. Pruebas: `tools/test_import_art.py`, `tests/e2e/art_ready.e2e.mjs`.
- **Final**: BIG CHAKY tiene defensa (fuera de sus momentos expuestos los golpes hacen 1/3); queda **expuesto** y brilla después de embestir (1 s) y del pisotón (1,8 s) o si lo aturdís, y ahí los golpes hacen ×1,5. En la fase 2 pisotea cada 2 ataques. **Rescate de ~8 s**: el héroe corre a la jaula y alza a Margot, entran Pinky, Lale y Cepi aplaudiendo con una frase cada uno, y **foto familiar** (flash) que aparece en el resultado con «📸 Guardar la foto» (compartir en el celu o descargar).
- Suite completa verde (el bot termina en ~104 s).

## 2026-11-17 · Kit de 19 imágenes integrado
- Facu mandó `MARGOUSH_3D_Kit_19_imagenes_v1_1.zip` (las 19 de la guía). Importadas con `tools/import_art.py`: caminatas de 6 cuadros de Lale, Cepi, Pinky y BIG CHAKY; acciones (con KO) de los cuatro; combo y acciones de Douge y Marine; rescate (héroe con Margot en brazos); objetos; calle porteña pintada; galpón; Le Blé, Punto de Oro y HENRIS.
- `import_art.py` ahora vuelve dorados los brillos que quedaban verdosos al sacar el fondo (poder de Douge) y guarda los fondos a 1280 px (calidad 74) para no pasar los 6 MB: total 5,8 MB.
- Las originales del kit no se suben al repo (pesan mucho); se pueden volver a importar desde el zip.
- Pruebas ajustadas: `enemy_faces` y `cepi_pinky` esperan las hojas nuevas. Suite completa verde.

## 2026-11-17 · Versión en un solo HTML y publicación
- `node tools/build_single.mjs` arma `dist/margoush-3d.html` (~9 MB): código, Three.js, imágenes y música adentro (`window.__EMBED`; `assets.js` lo usa si existe). Funciona abriéndolo desde el disco o subiéndolo a cualquier hosting; solo las tipografías vienen de Google Fonts (si no hay internet usa las de respaldo). Probado en Chrome sin GPU: menú, elección, juego con las hojas nuevas, sin errores.
- `dist/` no se sube al repo.
- GitHub Pages publica `main`: se abrió un pull request `feat-3d` → `main` (avance directo, `main` ya está contenido en `feat-3d`; fuera de `3d/` solo cambian `.gitignore`, `PROJECT_STATUS.md` y `package.json`, el Chupete Rush de la raíz no se toca). Al aprobarlo queda en https://facundocapello-blip.github.io/margoush-party/3d/ . Rollback: volver `main` a `fdf6f3b`.

## 2026-11-17 · Arreglos de lo que vio Facu en el iPhone (GitHub Pages)
- PR #1 aprobado: el juego está en https://facundocapello-blip.github.io/margoush-party/3d/
- **Carteles**: ya no van en el medio del juego. Son un aviso chico arriba al centro, debajo del puntaje (en vertical, debajo de la barra del jefe); duran 2,6 s como máximo, si llega otro el actual se apura (~1 s), no se repiten carteles iguales y el tiempo corre con el reloj real (no se frena con los golpes ni con la cámara lenta), así que no se quedan trabados.
- **Foto del héroe en el HUD**: el cuadradito muestra solo la cara (recorte del dibujo de cuerpo entero).
- Suite completa verde.

## 2026-11-17 — Voces: DIUSHBAG tipo Hadouken + "Messi Gokou" de Marine
- `diushbag` corto (~0.5 s) y explosivo: saturación, golpe grave, "BAG" acentuado y whoosh de bola de fuego. Suena también con el poder de Douge.
- Al elegir a Marine (y al agarrar su botella): voz femenina francesa (`pickFemaleFrench`, Amélie en iPhone) dice "Messi Gokou !" (juego con "merci beaucoup").
- Depende de las voces instaladas en el teléfono.

## 2026-11-18 · MARGOUSH 3D: persecución de Cepi hacia el fondo (rama `feat-3d`)
- Pedido de Facu: un tramo que se juegue hacia el fondo, estilo Crash Bandicoot Warped (el del tigre). Reemplaza el prototipo de Astra 6.2 (iframe 2D), que no tenía el estilo del juego.
- Nuevo `3d/js/chase.js`: al llegar a la oleada `boulevard` (x≈212) Cepi escapa en su BYD con la llave; el héroe lo persigue ~45 s en su vehículo (Douge: Hongo móvil; Marine: Maceta móvil con hiedra). Corre solo; joystick dobla, SALTO salta, 👊 rompe mesas y espanta palomas, ESQUIVE da invulnerabilidad corta (esquive justo +100), mantener 👊/L con la barra llena = poder (Douge «¡VERDADES A LOS GRITOS!», Marine «¡HIEDRA!»). Obstáculos: mesa de café, palomas, trottinette, barricada de la grève (no se rompe), charco de manteca. Coleccionables: hongos / hojitas (+50, cargan poder). Medidor «BYD de Cepi» con % de batería.
- Final: el BYD se queda sin batería en un cargador → vuelve al beat 'em up con la pelea contra Cepi (`cepiJefe`) y sigue la campaña. Sin corazones en la persecución → derrota normal.
- Usa el mismo renderer, HUD, carteles, controles táctiles y sonidos. Pausa/seguir funcionan dentro de la persecución.
- Marine pasa a ser «Hiedra»: su poder del juego principal se llama «¡HIEDRA!» (hojas 🍃 en vez de fuego, flor 🌺 que cura). Mismas reglas.
- Imágenes nuevas (`3d/assets/chase_*.webp`, generadas en Google Flow y recortadas). Presupuesto de assets subido de 6 a 6,6 MB.
- Pruebas: `npm test` (31 ok, incluye pista con carril libre y bonus) y `node tests/e2e/chase.e2e.mjs` (Douge y Marine de punta a punta, pausa, salto, doblar, poder, derrota; sin errores). Chrome sin pantalla con GPU por software: no equivale a Safari en iPhone real.
- Pendiente: probar en iPhone real y ajustar dificultad (cada pelotazo o choque saca 1 corazón).
- Vista previa pública actualizada con la persecución (18/11): https://claude.ai/artifact/VxSUGZoXMyrtY1vT1vSWbz (versión 1795028718-e287). GitHub Pages sin cambios (`main` intacto).

## Actualización 2026-11-18 · MARGOUSH 3D: Cepi maneja, frontera y vallas pintadas
- Persecución: Cepi maneja mirando adelante (`chase_cepi_drive.webp`, armado con `tools/cepi_drive.py`) y se da vuelta solo para sacar; giro con aplaste, rebote y balanceo del BYD. Marca roja en el piso donde pica el pelotazo. Cepi va un poco más cerca.
- Cambio de nivel sin corte: se levanta la barrera «FRONTERA ✈», el héroe cruza caminando bajo «Bienvenue en France» y pasa una franja azul-blanco-rojo.
- Piquete y portones de Francia («GRÈVE !») con el arte pintado de la valla; mesitas de Le Concept pintadas.
- Pruebas: `npm test` 31 ok; toda la carpeta e2e en verde (Chrome sin pantalla). Falta iPhone real.

## Actualización 2026-11-18 (noche) · Kit de objetos pintados
- 6 objetos generados en Flow (proyecto «nov 18 - 14:19», Nano Banana, con la mesa de café como referencia de estilo) y recortados con `tools/cut_white.py`: `prop_arbol`, `prop_contenedor`, `prop_cajones`, `prop_maceta`, `prop_fuente`, `prop_galpon`.
- Reemplazan a los árboles, contenedores y macetas hechos con figuras, a los cajones del portón de Buenos Aires («CERRADO»), a la puerta del galpón («PRIVADO») y a la fuente; los árboles de la persecución también son los pintados.
- Presupuesto de imágenes subido a 7 MB. Pruebas: `npm test` 31 ok; e2e en verde (Chrome sin pantalla).

## Actualización 2026-11-18 (noche, 2) · Asfalto porteño
- Piso de Buenos Aires pintado por código a 64 px/m: manchas de tono, huellas lustradas de ruedas, parches de bacheo con borde irregular, fisuras, tapa de cloaca, cordón cuneta con rejilla y línea central gastada. Sendas peatonales en x=74 (parada) y x=124 (antes de Le Concept).
- Pruebas: `npm test` 31 ok; e2e level1_look, perf, mobile, traps, level, gates y layout en verde.

## Actualización 2026-11-18 (noche, 3) · BYD de atrás, sin cartelitos, boina
- BYD de Cepi regenerado en Flow visto exactamente de atrás (manejando / preparando el saque / tirando), recortado del verde con el mismo marco para que no salte; sin pelota dibujada (`tools/erase_ball.py`). Polvo de las ruedas traseras.
- Sin carteles de instrucciones: títulos de tanda, «¡DESPEJADO! SEGUÍ →», «FRANCIA →», «PASO CERRADO», presentaciones de malos (queda la de Cepi mini-jefe), consejos del jefe, instrucciones de la persecución y «¡Cepi prepara el saque!». Quedan los chistes y la historia.
- «¡Messi Goku!» de Marine solo al elegirla (se sacó de la cerveza).
- Mini Facu en Francia: boina dibujada (antes era un cilindro que se veía como un cuadradito gris).
- Pruebas: `npm test` 31 ok; toda la carpeta e2e en verde (Chrome sin pantalla).

## Actualización 2026-11-22 · Kit completo (`MARGOUSH_kit_completo.zip` desde Drive/Gemini) — Grupo A + esquive de héroes en arena
- Fuente: `MARGOUSH_kit_completo.zip` (carpeta `Gemini` de Google Drive, 42 carpetas en 6 grupos A–F con bases y prompts).
- Generadas, recortadas de fondo verde croma y publicadas en `3d/assets/` + `3d/assets/manifest.json`:
  - **Grupo A (`A_chaky_baile`, 5 poses de Chaky profesor de baile disco)**: `arena_chaky_dance_idle`, `arena_chaky_dance_jump`, `arena_chaky_dance_attack`, `arena_chaky_dance_dodge`, `arena_chaky_dance_laugh`. La fase 2 (Pump It Up) de `3d/js/arena.js` ya las usa en lugar de `DANCE_FALLBACK`, espejando izquierda/derecha según flecha (`↖`/`↗`, `↙`/`↘`) y con rebote sutil al ritmo.
  - **Grupo E parcial (`E_heroes/1` y `2`, esquive de espaldas en arena)**: `arena_douge_back_dodge`, `arena_marine_back_dodge`, cableados en `3d/js/arena.js` al esquivar (`dashT > 0`, espejados según dirección).
- Peso total de `3d/assets/`: 8,47 MB (dentro del límite de 8,5 MB de `tests/assets.test.mjs`). Versiones selladas en `3d/index.html` con `node tools/stamp_versions.mjs`.
- Chupete Rush (`index.html`) y `preview-v*/` sin cambios.
- Verificación ejecutada: `node --test` (69/70 OK: arena, versions, manifest, presupuesto < 8,5 MB, bonus, chase, score, ranking, voice, music, etc.; único pendiente local es `tests/check_sprites.py` por faltar `numpy` en el Python de este entorno). Sin prueba todavía en Safari físico de iPhone.
- Rollback: volver `main` al commit `2342729`.
- Pendientes del kit (para aplicar por grupos incrementales según decisión de Facu):
  - **Grupo E restante (4 imágenes)**: `3_douge_victoria`, `4_marine_victoria`, `5_margot_heroica`, `6_familia_festejo` (requiere cablear UI de victoria / remate final).
  - **Grupo F (`F_objetos`)**: los 6 props (`prop_arbol`, `prop_contenedor`, `prop_cajones`, `prop_maceta`, `prop_fuente`, `prop_galpon`) ya existen pintados en `3d/assets/`; resta `7_fondo_aeropuerto_chaky` si se decide mover la pelea de Chaky al aeropuerto (fin nivel 1).
  - **Grupos B (`B_cepi_jefe`, 10), C (`C_lale_jefe`, 7) y D (`D_pinky_final`, 7)**: 24 imágenes para 3 nuevas arenas de jefes (Niveles 2, 3 y 4) cuyo código de arena aún no está implementado (y requerirá subir el presupuesto de `3d/assets/`).

## Actualización 2026-11-22 (2) · Grupo B completo (`B_cepi_jefe` — Arena de Cepi)
- Generados, recortados y registrados en `3d/assets/` + `3d/assets/manifest.json` los **10 assets del Grupo B**:
  - `arena_cepi_idle`, `arena_cepi_smash`, `arena_cepi_block`, `arena_cepi_tired`, `arena_cepi_stun`, `arena_cepi_back`, `arena_cepi_point`, `arena_cepi_cardboard`, `arena_cepi_fondo` (generados desde `BASE_cepi.jpg` y `BASE_estilo_fondo_arena.jpg`), y `arena_cepi_ko` (extraído del cuadro KO de `cepi_actions_sheet.webp` por tope temporal de cuota de generación tras la 9.ª imagen; reemplazable si se quiere la pose sentado abrazando la paleta).
- Arena de pádel completa en 3 fases implementada en `3d/js/arena_cepi_logic.js` + `3d/js/arena_cepi.js` + estilos en `3d/css/game.css` + integración en `3d/js/main.js` (sin tocar la campaña actual, BIG CHAKY ni Chupete Rush):
  - **Fase 1 (`?probar=cepi`)**: Saque y remate (pelotas normales, rebote «por el vidrio» y «¡Punto de Oro!» devolvible que aturde; bloqueo con paleta si le pegás de frente entero; ventana `tired` tras cada serie).
  - **Fase 2 (`?probar=cepi-duelo`)**: Duelo de la flechita (Cepi se da vuelta `back`, apunta a un lado `point`/espejado con aviso en el piso y botones grandes `← IZQ` / `DER →` para esquivar al lado contrario).
  - **Fase 3 (`?probar=cepi-carton`)**: Señuelos de cartón (2 gigantografías `cardboard` tumbables + 1 Cepi real en 3 carriles, baraja tras cada golpe hasta `ko`).
- Peso total de `3d/assets/`: **8,85 MB** (presupuesto actualizado a 9,2 MB en `tests/assets.test.mjs`). Versiones selladas en `3d/index.html` con `node tools/stamp_versions.mjs`.
- Verificación ejecutada: `node --check`, `node tools/stamp_versions.mjs`, 71/71 pruebas unitarias (incluyendo 5 nuevas en `tests/arena_cepi.test.mjs` + `versions.test.mjs`) y 3/3 chequeos JS de `tests/assets.test.mjs` (manifest + presupuesto < 9,2 MB + metadata). Pendiente: prueba en Safari físico de iPhone y `tests/check_sprites.py` (sin `numpy` en esta VM).
- Rollback: volver `main` a `d5fffe7`.
- Pendientes del kit: Grupo E restante (4 imágenes), Grupo F (`7_fondo_aeropuerto_chaky`), Grupo C (`C_lale_jefe`, 7) y Grupo D (`D_pinky_final`, 7), además de integrar el orden de 4 niveles cuando estén listos los jefes.

## Actualización 2026-11-22 (3) · Campaña de 4 Actos + Carga inteligente + Lale y Pinky + ES/FR
- **Carga inteligente por arena** (`3d/js/assets.js`): al arrancar precarga solo el núcleo (calle, héroes, enemigos, persecución y bonus); las texturas de jefes (`arena_chaky_*`, `arena_cepi_*`, `arena_lale_*`, `arena_pinky_*`, `arena_barril/cajon/fondo`, `arena_margot_*`) se cargan bajo demanda durante la cortina con `assets.ensure(...)` para acelerar el arranque y reducir memoria GPU en Safari iPhone.
- **Arena de Lale «Mantecoso» (Acto 3 — Obrador de Le Blé)**: `3d/js/arena_lale_logic.js` + `3d/js/arena_lale.js` + `tests/arena_lale.test.mjs`. 3 fases (barras de manteca + charcos resbalosos + bolsas de harina para enharinarlo; patinada rápida; «Subí el horno»). Slots listos para `arena_lale_*` (respaldo automático con `lale_actions_sheet` + `le_ble`). Pruebas directas: `?probar=lale`, `?probar=lale-patin`, `?probar=lale-horno`.
- **Arena Final de Pinky «el Trapito» + Margot Heroica (Acto 4 — Estacionamiento)**: `3d/js/arena_pinky_logic.js` + `3d/js/arena_pinky.js` + `tests/arena_pinky.test.mjs`. Intro revelación + 3 fases (autos entrando marcha atrás a 3 cajones amarillos con aviso previo; 2 autos en simultáneo siempre dejando ≥ 1 cajón libre; remate con botón **👶 ¡GRITO DE MARGOT!**). Slots listos para `arena_pinky_*` + `arena_margot_hero` (respaldo con `pinky_actions_sheet`, `galpon`, `margot_sheet` y auto 3D rojo). Pruebas directas: `?probar=pinky`, `?probar=pinky-tarifa`, `?probar=pinky-margot`.
- **Campaña de 4 Actos unificada** (`3d/js/main.js`):
  - Acto 1: Intro → Calle porteña → **BIG CHAKY** (con slot automático para `arena_aeropuerto_fondo` en `arena.js`).
  - Acto 2: Cruce a Francia → Persecución BYD → ¡Rompé el BYD! → **Cepi «el Niño»** (pádel).
  - Acto 3: Calle corta de Francia (2 oleadas hasta *Le Blé*) → **Lale «Mantecoso»**.
  - Acto 4: Tramo final al Galpón → **Pinky «el Trapito»** + Margot → Rescate familiar.
  - Checkpoints automáticos por Acto y por Jefe (`calle`, `chaky`, `acto2`, `byd`, `cepi`, `acto3`, `lale`, `acto4`, `pinky`), curación `+2` corazones (mínimo 3) antes de cada jefe, reintento en 1 toque conservando puntaje.
- **ES/FR y slots de victoria (Grupo E)**: traducciones agregadas en `3d/js/i18n.js` para los 4 actos y las 3 arenas nuevas; `3d/js/ui.js` soporta automáticamente `arena_douge_victory`, `arena_marine_victory` y `arena_familia_festejo` cuando se agreguen al manifiesto.
- Chupete Rush (`index.html`) y `preview-v*/` sin cambios. Ranking sigue local (Supabase pendiente para cierre final).
- Verificación ejecutada: `node --check`, `node tools/stamp_versions.mjs`, **78/78 pruebas unitarias en verde** (`arena_lale` 3, `arena_pinky` 4, `arena_cepi` 5, `arena`, `versions`, `bonus`, `chase`, `margot`, `music`, `poses`, `ranking`, `score`, `voice`) + 3/3 chequeos JS de `tests/assets.test.mjs`. Pendiente: prueba en Safari físico de iPhone, `tests/check_sprites.py` (sin `numpy` en VM), y Etapa 5 (generar/enchufar arte final de Grupos C, D, E restante, F aeropuerto y opcional `cepi_ko` cuando se libere cuota).
- Rollback: volver `main` a `89ae059`.

## Actualización 2026-11-22 (4) · Animaciones de movimiento de los 4 jefes + `arena_lale_idle`
- **Movimientos reales de 6 cuadros en las 4 arenas de jefes** (usando las tiras `*_walk_sheet.webp` que ya existían en `3d/assets/` pero no estaban conectadas a las arenas + squash/stretch/rebote/retroceso en acciones):
  - **BIG CHAKY** (`3d/js/arena.js`): caminata lateral en 6 cuadros (`chaky_walk_sheet`) espejada según dirección con pisada pesada, más squash/stretch en `throw`, `rage`, `hurt` y pasos disco (`dance_*`).
  - **Cepi «el Niño»** (`3d/js/arena_cepi.js`): carrera lateral en 6 cuadros (`cepi_walk_sheet`) al desplazarse por el fondo de la cancha, más impulso y rebote en `smash`, `block`, `point`, `stun`, `tired`, `back`.
  - **Lale «Mantecoso»** (`3d/js/arena_lale.js`): caminata (10 FPS) y patinada rápida en manteca (15 FPS inclinada) en 6 cuadros (`lale_walk_sheet`), nueva pose principal **`arena_lale_idle.webp`** generada desde `BASE_lale.jpg` y recortada sin halo verde (`409×768`, 34 KB, `v=1877d8fc`), más animaciones de lanzamiento, enharinado y golpe.
  - **Pinky «el Trapito»** (`3d/js/arena_pinky.js`): caminata agitando el trapo rojo en 6 cuadros (`pinky_walk_sheet`, 11 FPS) durante la fase `wave`, más animaciones en `reveal`, `charge` y `hurt`.
- Todos los slots de poses individuales restantes del kit (`arena_lale_*`, `arena_pinky_*`, `arena_margot_hero`, `arena_aeropuerto_fondo`, `arena_douge_victory`, `arena_marine_victory`, `arena_familia_festejo`) quedan intactos para enchufarse automáticamente apenas se generen (cuota móvil del generador de imágenes pausada ~2h50m tras generar `arena_lale_idle`).
- Peso total de `3d/assets/`: **8,89 MB** (< 9,2 MB). Versiones selladas en `3d/index.html` con `node tools/stamp_versions.mjs`. Chupete Rush (`index.html`) y `preview-v*/` intactos. Ranking sigue local.
- Verificación ejecutada: `node --check` en los 4 archivos modificados, `node tools/stamp_versions.mjs`, **78/78 pruebas unitarias en verde** + 3/3 chequeos JS de `tests/assets.test.mjs` (manifest con `arena_lale_idle`, presupuesto < 9,2 MB, metadata). Pendiente: prueba en Safari físico de iPhone, `tests/check_sprites.py` (sin `numpy` en VM), y generación del resto de poses individuales de Grupos C (6), D (7), E (4) y F (1) al liberarse la cuota.
- Rollback: volver `main` a `66516da`.

## Actualización 2026-11-22 (5) · Auditoría AAA y correcciones P0 + P1 + P2 en las 3 arenas nuevas
- **Bloque P0 (estabilidad crítica):**
  - Corregido crash `game.combo.hit is not a function` / `game.score.add` en `arena_cepi.js`, `arena_lale.js` y `arena_pinky.js` (ahora usan `game.score.addFlat`, `game.combo.add(1)`, `game.score.takeDamage()` y `game.score.addKill('boss')`).
  - Corregidos `@keyframes pulse-center` en `3d/css/game.css` para `.cepi-tell.alert` y `.margot-btn` (preservan `translateX(-50%)`, cero desplazamiento hacia la derecha) y ajustados en horizontal (`@media (orientation: landscape)`) para no tapar a los jefes.
  - Sincronización inmediata de `#boss-bar` / `#boss-fill` (`syncBar()` + chequeo en `draw()`) al saltar de fase con `?probar=...`; `startDuelRound()` fija `pose = 'back'` desde el cuadro 0; `onBossDown()` posiciona al héroe frente a la jaula del Galpón al ganar `?probar=pinky*`.
- **Bloque P1 (gráficos en vertical y horizontal):**
  - **Cepi (`arena_cepi.js`)**: recorte UV superior de `arena_cepi_fondo.webp` (solo techo, luces, banderines y tribunas, eliminando la cancha duplicada) sobre telón ancho `BW=84` sin franjas negras en horizontal; paredes de vidrio abiertas y carriles Fase 3 en `[-2.65, 0, 2.65]` para no cruzar la gorra de Cepi.
  - **Lale (`arena_lale.js`)**: nueva bolsa de harina ilustrada con etiqueta **`HARINA · 👊 ¡PEGALE!`** (reemplaza al cilindro liso), nube blanca animada volando desde la bolsa hasta Lale al explotarla, banda dorada de aviso antes de cada patinada, aro blanco de vulnerabilidad, piso de baldosas completo con molduras de madera y telón `BW=84`.
  - **Pinky (`arena_pinky.js`)**: hormigón orgánico sin efecto muaré, cordones amarillos, telón `BW=84`, autos 3D con ruedas, paragolpes y luces blancas de reversa parpadeando mientras asoman la cola durante `warn`, más aro verde cuando está distraído cobrando.
- **Bloque P2 (balance, intuición y diversión):**
  - **Cepi**: pelota normal devuelta hace `1 HP` sin stun vs **Punto de Oro** (`4 HP` + `stun` + hitstop); aro brillante en el piso al entrar en rango de devolución; Duelo con ventana `1,25 s` (ronda 1) / `1,05 s`, texto directo (`← ¡CORRÉ A LA IZQUIERDA!` / `¡CORRÉ A LA DERECHA! →`, traducido ES/FR en `i18n.js`) y botón seguro resaltado en verde (`.safe`); voltear los 2 cartones en Fase 3 aturde a Cepi.
  - **Lale**: aviso `skateWarn` (`0,48 s`) antes de cada pasada de patín y contraataque experto al golpearlo justo cuando pasa patinando.
  - **Pinky**: ritmo más ágil (`reveal` `1,25 s`, `2` autos en Fase 1, olas más seguidas, ventana `charge` de `3,0 s`) y recarga del **Grito de Margot** tras otro ciclo si Pinky sobrevive en Fase 3.
- **Verificación ejecutada:**
  - `node --check` en los 8 JS modificados, `node tools/stamp_versions.mjs`, **78/78 pruebas unitarias en verde** + 3/3 chequeos JS de `tests/assets.test.mjs`.
  - **Nueva prueba E2E en Chromium móvil** (`tests/e2e/boss_arenas.e2e.py`): **18/18 verificaciones en verde** en vertical (`390×844`) y horizontal (`844×390`) sobre Cepi, Lale y Pinky + inspección visual de las 11 capturas post-fix (`0` `pageerror`, `0` `frameErrors`, puntaje real > 0, barras y botones centrados). **Nota:** Chromium emulado no equivale a Safari físico en iPhone.
  - Chupete Rush (`index.html`, `preview-v*/`) intacto. Ranking sigue local.
- **Pendiente:** prueba real en Safari físico de iPhone, `tests/check_sprites.py` (sin `numpy` en VM), y generación de las 18 poses individuales restantes del kit (Grupos C/D/E/F) cuando se libere la cuota.
- **Rollback:** volver `main` a `925ded8`.


## 2026-11-22 · Continuidad de la campaña 3D y clase de baile de Big Chaky

- Base de esta corrección: `fb1c880` (campaña de cuatro actos en `main`). Se integró la corrección de ciclo de vida de `fix/3d-lifecycle-review` sobre esa versión. GitHub Pages `/3d/` es la referencia para probar la campaña.
- Marine y Douge vuelven a la primera calle después de la intro, tanto si termina sola como si se saltea. Se agregó una indicación de avance y un aviso de cómo abrir el piquete. El joystick flotante queda neutro al apoyar el dedo.
- La pausa conserva intro, transición, persecución, BYD, arenas y rescate. Cambiar de tramo queda suspendido hasta reanudar y se cancela al volver al menú o reiniciar. Un fallo de WebGL muestra un botón para reintentar.
- El baile encuadra a Chaky por encima de los carriles. Las poses se cargan antes de la arena y tienen respaldo si falta alguna. Los controles de pelea quedan suspendidos durante el baile.
- Pruebas locales: `npm test` (85/85), `python3 tests/check_sprites.py 3d/assets` y simulación asistida de los cuatro actos, con las 24 flechas, rescate, foto, victoria y regreso al menú. Se repitió con una textura de baile ausente. Queda por probar el render de los tramos en Safari físico.
- Rollback: revertir el merge de esta corrección con `git revert -m 1 <commit>`. La base anterior del código de la campaña fue `fb1c880`.

## 2026-11-22 · Big Chaky, encuadre y controles del baile

Base de los cuatro actos en GitHub Pages: `57ae713`. Accesos de prueba: `3d/?probar=chaky` para barriles y `3d/?probar=chaky-cartel` para baile. Las pruebas por enlace dejan intacto el checkpoint de campaña.

- El combate sigue activo si la ventana pierde foco con la página visible. Pausa manual, página oculta y salida de página siguen deteniendo la partida.
- Al cambiar de fase, Douge o Marine caminan a su marca, la cámara acompaña y los aciertos animan al héroe. Se conserva la música, los sprites y el tiempo de las notas.
- Durante el baile, la vida de ambos queda en la cabecera y la pista ocupa una franja inferior. Aciertos, faltas, rondas y subtítulos tienen espacio en la pista. Los cinco carriles completos reciben el toque.
- QA local: 86 pruebas automatizadas y verificación de sprites. En simulación con cámara Three.js y renderizador sustituido, ambas orientaciones llegaron al rescate con combates asistidos. El caso de Chaky comprobó arrastre, pérdida de foco, pausa manual, ocultación, regreso, 24 aciertos y separación vertical de los personajes respecto del HUD y de la pista en 320×568, 430×710, 430×932, 667×320 y 932×430.
- Safari físico y comprobación visual de esta revisión en iPhone pendientes. El rediseño visual abarca Big Chaky.

## 2026-11-22 (6) · Rediseño de Big Chaky: Duelo de Baile directo en Escenario (Opción A, ambos de frente)
- **Eliminación de barriles y manotazo (`3d/js/arena_logic.js`, `3d/js/arena.js`)**: La pelea contra Big Chaky pasa a ser 100 % el duelo de baile en un escenario disco dentro del hangar VIP del aeropuerto, en 3 rondas ágiles y progresivas (`6`, `8` y `10` pasos = 24 notas en ~32 s).
- **Ambos personajes DE FRENTE en escenario + 3 imágenes nuevas (`3d/assets/`)**:
  - Generados e integrados `arena_aeropuerto_fondo.webp` (escenario disco en el hangar VIP), `douge_dance_sheet.webp` (4 poses frontales de baile de Douge) y `marine_dance_sheet.webp` (4 poses frontales de baile de Marine), junto a las 5 poses frontales disco de Big Chaky (`arena_chaky_dance_*`).
  - Héroe a la izquierda (`x = -2.05`) y Big Chaky a la derecha (`x = +2.05`), ambos mirando de frente a cámara sobre una tarima con 12 baldosas LED que laten al compás y cambian de color con cada paso acertado.
- **Flechas que BAJAN hacia los 5 botones inferiores (`3d/js/arena.js`, `3d/css/game.css`)**: Los 5 botones receptores (`↙`, `↖`, `●`, `↗`, `↘`) se ubican en la base de cada carril con colores diferenciados y las flechas caen de arriba hacia abajo. Cada flecha acertada le baja vida a Big Chaky en tiempo real.
- **3 Vidas Extra (`⭐⭐⭐`) sin volver a empezar**: Si perdés los corazones durante el baile, gastás 1 estrella (`⭐`), recuperás todos los corazones ahí mismo y seguís bailando desde esa misma ronda sin ir a Game Over ni reiniciar desde la ronda 1. Además, `saveCheckpoint` conserva el checkpoint en memoria durante `?probar=` sin alterar `localStorage`.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (73/73 en verde, incluyendo `tests/check_sprites.py` y presupuesto de `3d/assets/` < 9,2 MB) y simulación completa de las 24 notas hasta el KO. Pendiente: validación táctil y visual en Safari físico de iPhone y revisión de interfaz en Cepi, Lale y Pinky.
- **Rollback**: volver `main` y `feat-3d` al commit `1f4b524`.


## 2026-11-22 · Big Chaky: intro con Margot, más separación y traje violeta fijo
- Intro del jefe antes del baile (~3,7 s, se saltea tocando): primer plano de BIG CHAKY con Margot fuera de la jaula (en su cochecito, `margot_sheet`), subtítulo «Te daré a Margoth, sólo si puedes vencerme en...» y luego «¡La prueba de Baile!» (ES/FR); la cámara se abre al escenario y arranca la Ronda 1. Margot queda al fondo, en el centro, mirando el duelo (feliz en el KO).
- Separación: héroe en x = −3,0 y Chaky en x = +3,0 (antes ±2,05), vaivén reducido; centro libre para Margot.
- Bug del buzo naranja: cada acierto ponía la pose `hurt` → `arena_chaky_hurt` (sprite naranja del galpón). Ahora el escenario usa solo `arena_chaky_dance_*`; el KO es la pose de baile cayendo de costado. `spawnBoss` ya no carga los sprites naranjas.
- Verificado: `npm test` (73/73), e2e `chaky_dice` y `arena` en Chromium con GPU por software (capturas vertical 430×932 y horizontal 844×390). No equivale a Safari físico.
- Pendiente: probar la intro y la legibilidad del texto en iPhone 15 Pro Max (vertical y horizontal).

## 2026-11-22 · Auditoría integral (Diseño Gráfico, Jugador Casual y Guion Móvil)
- Diseño gráfico y UI:
  - Portada (`cover.js` / `game.css`): reencuadrado `.pa-title` sobre el pecho de Big Chaky para que su cara y mirada queden descubiertas arriba del logo `MARGOUSH`.
  - Barras de jefe y puntaje (`#boss-bar`, `.hud-center`, `.bonus-clock` en `game.css`): cápsulas oscuras con borde dorado de alto contraste en Cepi, Lale (`Le Blé`), Pinky (`Galpón`) y Bonus BYD, aplicando el criterio visual de Big Chaky.
  - Intro en Le Concept (`cine.js`): corregida la celda inicial de Margot a `awake` (`cell: 1`, en cochecito) en lugar de `happy` (`cell: 3`, mantita en el piso sin cochecito) y ajustada la altura de cámara en vertical.
  - Continuidad visual del Acto 2 en Francia (`chase.js`, `bonus.js`): la persecución del BYD y `¡Rompé el BYD!` (que ocurren tras aterrizar en Francia) usan ahora `chase_paris_fondo` (Torre Eiffel) y `street_bg` (fachadas francesas), y el cable del cargador ya no cruza la cara de Cepi.
  - Fondo de la Arena de Pinky (`arena_pinky.js`): recorte superior industrial de `galpon.webp` (ventanal nocturno y lámpara colgante) para eliminar el sillón gigante fuera de escala en el estacionamiento.
- Jugabilidad casual:
  - Agregada 1 segunda oportunidad (`⭐ ¡VIDA EXTRA!`) por combate en las arenas de Cepi, Lale y Pinky al caer por daño en pelea, evitando reiniciar las 3 fases desde cero en el primer error.
  - Alias `?probar=chaky-baile` y `?probar=lale-furia` agregados a `QUICK_TESTS`.
- Guion y localización ES/FR:
  - Eliminada la burla residual de barriles (`¡Barril 1, vos 0!`) de Big Chaky en `voice.js` (reemplazada por `¡Perdiste el compás!`).
  - Conectado el cartel de cierre de la intro en `cine.js` con la corrida hacia el aeropuerto (`¡Alcanzá a BIG CHAKY rumbo al aeropuerto!`) y completadas sus traducciones en `i18n.js`.
- Verificado: `npm test` (73/73) y capturas comparativas antes/después en Chromium móvil (`430×932`). Pendiente validación en Safari físico de iPhone.

## 2026-11-22 · Nueva portada «Súper Margoth Estrella» (Opción 1)
- Eliminado Big Chaky de la portada por defecto (`cover.js` / `game.css`).
- Margoth pasa a ser la protagonista gigante en el centro del póster dentro de una estrella dorada luminosa con destellos (`STAR_EMBLEM` + `STAR_FRONT`), flanqueada por Douge y Marine a los costados, con el cielo de París/Buenos Aires y el avión de fondo y la cinta «¡El rescate de Margoth!» (ES/FR).
- Verificado en vertical (`430×932`) y horizontal (`844×390`) sin solapamientos y con `npm test` (73/73).

## 2026-11-23 · Eliminación de Chupete Rush + Kit completo de poses, movimientos y fondos (Grupos C, D y E)
- **Eliminación de Chupete Rush (`index.html`, `assets/petit-sprint.mp3`, `preview*`)**:
  - Se eliminaron el minijuego Chupete Rush, su audio y las 5 carpetas `preview*`.
  - La raíz `/` (`index.html`) redirige automáticamente a `3d/` conservando query string y hash (`?probar=...`), dejando **MARGOUSH · El rescate de Margot** como único proyecto del repositorio.
- **Poses, movimientos y fondos faltantes completados (`3d/assets/`, `3d/assets/manifest.json`)**:
  - **Grupo C (`C_lale_jefe`, 7/7 completos)**: agregados `arena_lale_throw`, `arena_lale_skate`, `arena_lale_floured`, `arena_lale_hurt`, `arena_lale_ko` y `arena_lale_fondo` (obrador de *Le Blé* con hornos encendidos), junto a `arena_lale_idle` y la caminata de 6 cuadros `lale_walk_sheet`.
  - **Grupo D (`D_pinky_final`, completos)**: agregados `arena_pinky_wave`, `arena_pinky_charge`, `arena_pinky_reveal`, `arena_pinky_hurt`, `arena_pinky_ko` y `arena_pinky_fondo` (galpón convertido en playa de estacionamiento con cabina), combinados en `3d/js/arena_pinky.js` con la caminata de 6 cuadros `pinky_walk_sheet` cuando Pinky se desplaza y `arena_pinky_wave` cuando se detiene a hacer señas con el trapo.
  - **Grupo E (`E_heroes`, 6/6 completos)**: agregados `arena_margot_hero` (bebé Margot en grito supersónico para el remate de Fase 3), `arena_familia_festejo` (Douge, Marine y Margot festejando en París con confeti), `arena_douge_victory` y `arena_marine_victory` (conectados a `3d/js/ui.js` y diferidos en `3d/js/assets.js`).
- **Verificación**:
  - `node tools/stamp_versions.mjs` y `npm test`: **85/85 pruebas automatizadas en verde** (incluyendo `arena_cepi`, `arena_lale`, `arena_pinky`, `arena`, `assets`, `check_sprites.py`, `campaign-continuity`, `versions`, etc.). Peso total de `3d/assets/`: **10,29 MB** (< 10,5 MB, con carga diferida por arena).
  - Pendiente: validación manual en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `411ebf4`.

## 2026-11-23 (2) · Sin piquete y secuaces separados de los 4 Jefes
- **Chau Piquete (`3d/js/level.js`, `3d/js/main.js`)**: eliminado el portón `piquete` (`x = 118`) y su oleada; la avenida de Buenos Aires fluye de corrido hasta la entrada del aeropuerto.
- **Jefes 100 % exclusivos (`3d/js/level.js`)**: sacados `pinky`, `lale`, `cepi` y `cepiJefe` de las oleadas de la calle. Ahora en las calles pelean los 5 secuaces (`secuaz`, `patovica`, `bombo`, `mozo`, `delivery`) distribuidos en Actos 1, 3 y 4; `mozo` recibió paso natural (`gait`) en `3d/js/enemies.js`.
- **Limpieza de sprites de secuaces (`3d/assets/face_*_sheet.webp`)**: eliminados los halos blancos y sombras grises pegadas a los pies. **Pendiente de arte**: regenerar los 5 secuaces en estilo Pixar cabezón 3D igual a Douge/Marine cuando se libere la cuota del generador de imágenes (~3h).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (86/86 en verde, incluyendo nuevo test de invariante sin piquete y sin jefes en calle). Pendiente: prueba manual en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `4d21e2e`.

## 2026-11-23 (3) · Limpieza de assets muertos y optimización de carga inicial para Safari iPhone
- **Eliminación de 13 assets heredados sin uso (`3d/assets/`, `3d/assets/manifest.json`)**: `arena_chaky_{idle,throw,slam,hurt,rage,ko}`, `arena_barril`, `arena_cajon`, `chase_ba_fondo`, `lale_sheet`, `pinky_sheet`, `arena_douge_back_run`, `arena_marine_back_run`. Se liberaron **770 KB** (peso total de `3d/assets/`: **9,44 MB**, presupuesto ajustado a 9,6 MB en `tests/assets.test.mjs`).
- **Carga inicial más liviana en Safari iPhone (`3d/js/assets.js`, `3d/js/main.js`)**: se sumaron a la carga diferida por cortina `chase_*`, `arena_{douge,marine}_back_*` y las hojas `cepi/lale/pinky_{walk,actions}_sheet`, asegurando su precarga bajo demanda en `startChaseRun`, `startBydLevel`, `updateTransition`, `spawnCepi`, `spawnLale` y `spawnPinky` (el arranque inicial solo precarga el núcleo de portada y Acto 1).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74 + 12/12 pruebas de arenas = **86/86 en verde**, incluyendo `tests/check_sprites.py` y presupuesto < 9,6 MB). Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `faba63c`.

## 2026-11-23 (4) · Pulido visual, encuadre de fondos y game feel en las arenas (Punto 3)
- **Encuadre UV de los fondos nuevos (`3d/js/arena_lale.js`, `3d/js/arena_pinky.js`)**:
  - `arena_lale_fondo`: recorte UV superior (`repeat 0.72`, `offset 0.28`) para alinear los 3 hornos encendidos y estantes de panadería con el piso 3D de baldosas en vertical y horizontal.
  - `arena_pinky_fondo`: recorte UV superior (`repeat 0.68`, `offset 0.32`) para alinear la cabina de cobro, columnas y fluorescentes con los 3 cajones 3D sin duplicar líneas de piso.
- **Auto 3D mejorado en la arena de Pinky (`3d/js/arena_pinky.js`)**: luneta con reflejo, patente `PK 912`, espejos laterales, luces traseras rojas y de reversa blancas con halos luminosos y sombra de contacto.
- **Game feel (partículas temáticas + hitstop `freezeT`)**:
  - **Cepi (`3d/js/arena_cepi.js`)**: chispas doradas/limón/cartón y hitstop en golpes, cartones y Punto de Oro.
  - **Lale (`3d/js/arena_lale.js`)**: partículas de harina blanca y gotas de manteca dorada + hitstop en bolsa, enharinado, golpes y KO.
  - **Pinky (`3d/js/arena_pinky.js`)**: lluvia de billetes verdes volando al pegarle mientras cobra, chispas rosadas en el Grito de Margot y hitstop en golpes, remate y KO.
- **Corrección detectada por E2E**: restaurado `3d/assets/chase_ba_fondo.webp` (usado por el CSS de la portada en `3d/css/game.css`; sigue diferido para Three.js).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas + **18/18 verificaciones E2E en Chromium móvil** (`tests/e2e/boss_arenas.e2e.py`, 0 errores JS, 0 HTTP 404, 0 `frameErrors`) e inspección visual de capturas en vertical y horizontal. Pendiente: validación en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `cf5cebb`.

## 2026-11-23 (5) · Audio sin voces habladas en jefes/NPCs, balance de música y auditoría ES/FR (Punto 6)
- **Audio hablado solo para los héroes (`3d/js/audio.js`)**: desactivado `speechSynthesis` en `bossLine()` para todos los personajes que no son héroes (Chaky, Cepi, Lale, Pinky y NPCs ahora muestran sus frases en texto/subtítulos con efectos de sonido arcade, sin TTS robótico ni ducking de música). Se conservan las voces de los héroes: Douge («¡Diuuushbag!») y Marine («¡Messi Goku!»).
- **Balance de música vs SFX (`3d/js/audio.js`)**: ajustada la ganancia del bus de música sintetizada a `0.78` para que no tape golpes ni voces en iPhone.
- **Auditoría de francés (`3d/js/i18n.js`, `3d/js/arena_lale.js`)**: agregadas las traducciones faltantes de las nuevas oleadas de secuaces (`SEGURIDAD VIP`, `CAMINO A LE BLÉ`, etc.), `¡K.O.! +{n}`, `¡PUM!`, `NIVEL {n}: {x}`, y traducida dinámicamente la etiqueta de la bolsa de harina de Lale (`HARINA` → `FARINE`, `👊 ¡PEGALE!` → `👊 FRAPPE !`).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**. Pendiente: validación auditiva y ES/FR en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `2ac0b3b`.

## 2026-11-23 (6) · Los 5 secuaces regenerados en estilo Pixar 3D (igual a Douge y Marine)
- **Nuevos sprites de secuaces (`3d/assets/face_{secuaz,patovica,bombo,mozo,delivery}_sheet.webp` + `3d/assets/manifest.json`)**:
  - Generados en 512 px de alto con exactamente las mismas proporciones cabezonas 3D tipo Pixar e iluminación cálida que los héroes y los jefes, recortados sobre fondo verde croma protegiendo los verdes de ropa/mochila y sin halos ni sombras pegadas.
  - Peso total de `3d/assets/`: **9,59 MB** (< 9,6 MB).
- **Verificación**: `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde** e inspección visual de los 5 recortes WebP. Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `b412968`.

## 2026-11-23 (7) · Monumentos a Maradona (Argentina) y Zidane (Francia) + King Kong y Hans Landa
- **Monumentos en la calle (`3d/js/world.js`, `3d/assets/monumento_{maradona,zidane}.webp`)**:
  - **Argentina (Acto 1):** 2 Monumentos a Maradona en bronce dorado con la 10 y la pelota (`x = 46` y `x = 112`) + placa dorada `★ MARADONA 10 ★`.
  - **Francia (Actos 3–4):** 2 Monumentos a Zidane en bronce dorado con la 10 y la pelota (`x = 176` y `x = 244`) + placa dorada `★ ZIDANE 10 ★`.
- **Nuevos malos de cine en estilo Pixar cabezón (`3d/assets/face_{patovica,secuaz}_sheet.webp`)**:
  - **King Kong** reemplaza al viejo patovica (tanque grandote que sacude el piso y embiste).
  - **Hans Landa** (parodia teatral con sobretodo de cuero, guantes y pipa gigante calabash, sin insignias) reemplaza al viejo secuaz callejero.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde** (peso total `3d/assets/`: **9,68 MB** < 9,9 MB). Pendiente: prueba en Safari físico de iPhone y decidir si reemplazar los 3 secuaces restantes (`bombo`, `mozo`, `delivery`) por otros 3 malos de cine.
- **Rollback**: volver `main` al commit `f0934e9`.

## 2026-11-23 (8) · Locales protagonistas: Le Blé VIP y Punto de Oro (Buenos Aires) + Roland Garros y Granja de Maese LaPadite (París)
- **Buenos Aires (`3d/js/world.js`)**:
  - **Le Blé (`x = 86`, `w = 13.5 m`, VIP):** convertido en el local más elegante y vistoso de Buenos Aires (el restaurante de Marine) con doble ancho, cartel dorado luminoso `★ Le Blé ★` con halo, guirnalda en arco de 17 focos cálidos y alfombra bordó.
  - **Punto de Oro (`x = 34`, `w = 10.4 m`):** ampliado y despejado de árboles/tachos adelante.
  - **Monumentos a Maradona (`x = 46`, `x = 112`):** vereda despejada de árboles y contenedores para que luzcan limpios.
- **París (`3d/js/world.js`, `3d/assets/roland_garros.webp`)**:
  - **Roland Garros (`x = 190`, `w = 13.8 m`):** fachada pintada en estilo Pixar (`roland_garros.webp`, 113 KB) con arcos crema/verde, flores, farolitos, cartel dorado `ROLAND GARROS` y cancha de polvo de ladrillo al fondo.
  - **La Granja de Maese LaPadite (`x = 230`, `w = 12.6 m`):** reemplaza visualmente el viejo bloque violeta liso del Pasaje Secreto con fachada rural francesa pintada (`FERME LAPADITE`: piedra, tejas, sábanas al viento y tarros de leche), con slot automático para `granja_lapadite.webp` cuando se libere la cuota del generador de imágenes.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde** (peso total `3d/assets/`: **9,79 MB** < 10,0 MB). Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `453db25`.

## 2026-11-23 (9) · Diferenciación visual Buenos Aires vs. Francia y encuadre de carteles
- **Buenos Aires (`3d/js/world.js`)**: alternancia por cuadra de fachadas coloridas estilo Caminito (`PIZZERÍA`, `PARRILLA`, `KIOSCO`, `FARMACIA`, etc.) con `calle_buenos_aires` sobre asfalto porteño.
- **Francia (`3d/js/world.js`)**: alternancia de edificios parisinos Haussmann en piedra clara y tejado de pizarra (`BOULANGERIE`, `FROMAGERIE`, `LIBRAIRIE`, `CAFÉ DE PARIS`) con terrazas de café sobre calzada de adoquines.
- **Encuadre de carteles principales (`3d/js/world.js`)**: ajustados los anchos de `LANDMARKS` (`punto_de_oro` `9.2`, `le_ble` `11.4`, `henris` `7.4`, `roland_garros` `10.2`, `granja_lapadite` `10.4`), bajado el cartel luminoso y halo de `★ Le Blé ★` a `y = 3.85` (luces VIP a `y = 4.95`) y agregado el cartel `🎾 PUNTO DE ORO` a `y = 3.85` para evitar recortes en el borde superior de la cámara.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**; capturas de recorrido en Chromium (`recorrido_acto1_argentina.png` y `recorrido_actos3y4_francia.png`) verificando contraste entre ambos países y carteles sin recorte. Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `b769a8c`.

## 2026-11-23 (10) · Le Concept pasa a ser el local VIP de Buenos Aires (Le Blé queda estándar)
- **Le Concept VIP (`3d/js/world.js`, `x = 132`)**: convertido en el local más elegante y vistoso de Buenos Aires con fachada ensanchada (`1.65×`), cartel dorado luminoso `★ LE CONCEPT ★` con halo, guirnalda en arco de 17 focos cálidos y alfombra bordó con ribetes dorados.
- **Le Blé (`3d/js/world.js`, `x = 86`)**: vuelve a local estándar (`w = 8.6`) mostrando únicamente su cartel pintado en fachada (sin cartel superpuesto duplicado, sin halo ni alfombra VIP).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**; captura de Buenos Aires verificada en Chromium headless. Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `355176b`.

## 2026-11-23 (11) · Auditoría de fondos: cero superposiciones de locales y respeto de espacios
- **Partición exacta por huecos (`3d/js/world.js`, `splitGaps`)**: los locales icónicos de Buenos Aires (`Punto de Oro`, `Le Blé`, `Henri's`, `★ LE CONCEPT ★ VIP`) y Francia (`Roland Garros`, `Ferme LaPadite`) ahora reservan su intervalo exacto en la calle. Las cuadras intermedias ajustan una cantidad entera de fachadas al ancho de cada hueco libre, eliminando solapamientos (como `FARMACIA` detrás de `Punto de Oro` o `BOULANGERIE` cortada junto a `Ferme LaPadite`) y evitando carteles partidos.
- **Despeje de mobiliario urbano (`3d/js/world.js`, `isLandmarkFront`)**: faroles, árboles, contenedores, macetas y banderines ahora respetan el frente de todos los locales icónicos, `★ LE CONCEPT ★ VIP` y los monumentos a Maradona y Zidane.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**; mapas completos de Buenos Aires y Francia recapturados y verificados en Chromium headless. Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `af658b0`.

## 2026-11-23 (12) · Limpieza visual completa: 100 % fachadas Pixar y mobiliario anclado a uniones exactas
- **Buenos Aires (`3d/js/world.js`)**: eliminados los bloques planos por código (`porteno()`) cuando existe `calle_buenos_aires.webp`; recortados sus 3 locales pintados estilo Pixar (`KIOSCO`, `PARRILLA`, `PIZZERÍA`) con `v0 = 0.08` y `PH = 7.4` para mostrar los carteles fileteados completos dentro de cámara sin doble cordón.
- **Francia (`3d/js/world.js`)**: eliminados los bloques planos por código (`haussmannMat`); usa únicamente las fachadas pintadas estilo Pixar de `street_bg.webp` (`v0 = 0.165`, `frH = 8.4`) ajustadas a los huecos libres alrededor de `Roland Garros` y `Ferme LaPadite`.
- **Cero obstrucciones (`3d/js/world.js`)**: eliminados los banderines y el cartel flotante `BUENOS AIRES` que cruzaban carteles; faroles, árboles (`3.1 m`), contenedores, `PARADA 60` y macetas francesas anclados exclusivamente a las uniones exactas entre fachadas (`baSeams` / `frSeams`), respetando todos los locales icónicos, `★ LE CONCEPT ★ VIP` y monumentos.
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**; mapas de Buenos Aires y Francia verificados en Chromium headless. Pendiente: prueba en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `284b2a4`.

## 2026-11-23 (13) · Plan Maestro: continuidad de 4 actos, NPCs 100 % separados por país, hojas animadas de 4 poses y Ferme LaPadite Pixar
- **Continuidad narrativa y geográfica (`3d/js/main.js`, `3d/js/i18n.js`)**:
  - Al vencer a **BIG CHAKY (Jefe 1)** en Ezeiza, ahora muestra el puente narrativo *«¡CHAKY CAYÓ! CEPI SE ESCAPA EN EL BYD POR LA 9 DE JULIO»* y lanza el Acto 2 (Persecución BYD → ¡Rompé el BYD! → **Cepi Pádel**) todavía en Buenos Aires.
  - Al vencer a **Cepi (Jefe 2)**, recién ahí se dispara `startTransition()` (barrera `EMBARQUE ✈` → `BIENVENUE EN FRANCE` → llegada a **Acto 3 · París (Boulangerie)**).
  - Al vencer a **Lale (Jefe 3)**, muestra el puente *«¡LALE FUERA! MARGOT ESTÁ PASANDO LA FERME LAPADITE»* hacia el Acto 4 y **Pinky**.
  - Corregido el bug de `resumeAt('lale')` (`'boulevard'` inexistente → `'boulevard-2'`) y actualizadas las traducciones ES/FR (`3d/js/i18n.js`).
- **Elenco de NPCs 100 % separado por país (`3d/js/level.js`)**:
  - **Buenos Aires (Acto 1)**: exclusivo **King Kong (`patovica`) + `bombo`**.
  - **Francia (Actos 3 y 4)**: exclusivo **Hans Landa (`secuaz`) + `mozo` + `delivery`**.
- **Animaciones completas de 4 poses para los 5 enemigos (`3d/assets/{patovica,secuaz,bombo,mozo,delivery}_sheet.webp`, `3d/js/enemies.js`)**:
  - Generadas e integradas las 5 hojas animadas de 4 cuadros (`idle`, `step`, `strike`, `hurt`) con recorte croma limpio y sin residuos de bordes; habilitado el paso animado (`step`) para todos los enemigos en movimiento (incluyendo `mozo` y `delivery`).
- **Ferme LaPadite Pixar (`3d/assets/granja_lapadite.webp`, `3d/assets/manifest.json`)**:
  - Reemplazada la fachada por código por la pintura estilo Pixar de la granja de Normandía con cartel `FERME LAPADITE`, sábanas al viento, fardos y tarros de leche. Peso total `3d/assets/`: **9,97 MB** (< 10 MB).
- **Verificación**: `node tools/stamp_versions.mjs`, `npm test` (74/74) + 12/12 pruebas de arenas = **86/86 en verde**; inspección visual de hojas WebP y mapas de recorrido en Chromium headless. Pendiente: validación táctil/audio en Safari físico de iPhone.
- **Rollback**: volver `main` al commit `70f6ab2`.






## 2026-11-24 · Auditoría de continuidad, candidata de prueba

Base verificada: main e15c81c, HTML idéntico al servido por GitHub Pages. Esta candidata conserva la rama principal. El acto 1 termina en el baile directo de Chaky, sin barriles. En el acto 2 la fuga y la destrucción del BYD seleccionaban arte francés antes del vuelo: ahora usan escenario porteño. El cartel del vuelo anuncia el acto 3 con su traducción vigente. En la calle, un golpe mortal podía dejar que el mismo cuadro activara un jefe. La lógica ahora detiene el cuadro al salir de la partida por daño.

Pruebas: 74/74 en la base, reproducción de la transición indebida en simulación de cuadro, 75/75 después del arreglo. La prueba nueva usa una actualización de enemigos controlada, no una partida física. La suite cubre reglas de extras de Chaky y lógica de los cuatro encuentros. El navegador de previsualización no activó WebGL y el Chromium de las pruebas E2E no pudo crear su socket. Pendientes: partida completa desde el menú, superposición real del HUD, fluidez, multitáctil y audio en Safari físico. Algunos E2E históricos esperan pasar directamente desde la introducción a la persecución o del nivel 1 al checkpoint antiguo de Francia; requieren actualizar expectativas antes de usarlos para certificar la campaña actual.

Lectura de diseño: Chaky exige ritmo, Cepi alterna devolución, esquive y reconocimiento, Lale combina harina y desplazamiento, Pinky usa autos y remate de Margot. El segundo acto concentra tres mecánicas consecutivas; falta medir cuántos intentos se deben a no entender el objetivo del BYD. Patovicas y bombos identifican Buenos Aires; mozos, delivery y secuaces identifican Francia. Las hojas incluyen cuatro poses; legibilidad en movimiento pendiente. Margot ya reacciona en el HUD, aparece en el auto y decide el remate. Probar primero una señal suya antes del peligro de la fuga usando una pose existente, luego anticipar el remate en Pinky. Criterio: alguien que juega por primera vez reconoce la señal y explica qué acción tomó.

Reglas: la calle usa invulnerabilidad tras el impacto; antes del jefe se recuperan dos corazones con mínimo tres y tope en el máximo del personaje. Chaky tiene tres continuaciones dentro de ronda; Cepi, Lale y Pinky recuperan una vez el 60 % de los corazones redondeado hacia arriba, con mínimo dos. El BYD descuenta un corazón por intento fallido. Los checkpoints restauran personaje, puntos y tiempo guardados con vida llena. Falta validar la percepción de justicia con jugadores y la combinación de impactos de cada arena en dispositivo.

Candidata de Sites en /auditoria/. Rollback del sitio: versión 4, commit 944a6b2. La publicación de GitHub Pages conserva el código de main.

## 2026-11-24 (2) · Big Chaky: entrada desde la calle, primera flecha y visibilidad en las 3 rondas
- **Base:** rama `audit/continuidad-20261124` (`d324490`, con los tres arreglos de continuidad porteña y derrota en umbral de jefe).
- **Correcciones en Big Chaky (`3d/css/game.css`, `3d/js/arena.js`, `3d/js/main.js`):**
  - **Cartel de ronda sin tapar los 5 carriles:** `body.chaky-dance #arena-ui .phase-card.p2` se movió arriba de `.piu` (`bottom: calc(var(--deck-height) + var(--safe-b) + 10px)`, compacto en horizontal) porque antes se superponía sobre los botones receptores durante 1,15 s al inicio de cada una de las 3 rondas.
  - **Toque limpio y alineación de flechas:** `pointer-events: none` en `#arena-ui .rec, #arena-ui .note` y `ev.stopPropagation()` en `.lane` `pointerdown` para que el toque en Safari siempre golpee el carril estable; `recY = Math.max(8, H - 36)` en `piuDraw()` para alinear las flechas que bajan con el botón receptor también en horizontal (`844×390`).
  - **Entrada limpia desde la calle:** `spawnBoss()` ahora limpia carteles (`clearBanners()`) y combo (`game.combo.reset()`) al cruzar el final del Acto 1 hacia Big Chaky; `arena.start()` llama `updateHud(0)` para mostrar de inmediato los corazones curados en el cuadro 0.
- **Verificación ejecutada:**
  - `node --check 3d/js/arena.js 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` (**76/76 pruebas JS en verde**; `tests/check_sprites.py` omitido localmente por ausencia de `numpy` en el Python del entorno).
  - Auditoría automatizada en Chromium móvil emulado (`390×844` vertical y `844×390` horizontal) entrando desde la calle del Acto 1 hasta completar las 3 rondas de Chaky: `cardOverlapsPiu = false` en rondas 1, 2 y 3, respuesta inmediata en la primera flecha por `pointerdown` táctil, héroe/corazones/5 carriles visibles sin solapamientos y `0` errores JS / `0` `frameErrors`. **Nota:** Chromium emulado no equivale a Safari físico en iPhone.
- **Pendiente en dispositivo físico (Safari iPhone):** validar entrada desde la calle al baile directo, tacto de la primera flecha, audio tras gesto y visibilidad de héroe, corazones y 5 carriles durante las 3 rondas; confirmar que no reaparece la pausa accidental.
- **Rollback:** volver `main` y `feat-3d` al commit `e15c81c` (o revertir el merge automático en `main`).

## 2026-11-24 (3) · Señales de Margot (Acto 2 y Pinky), claridad de «¡Rompé el BYD!» y fix de sprite diferido
- **Señal de Margot antes del pelotazo en la fuga (`3d/js/chase.js`, `3d/css/game.css`):** al iniciar el `windup` de Cepi, aparece el aviso con la carita de Margot (`margot_faces.webp`, sin assets nuevos) y el mensaje *«¡CUIDADO! ¡CAMBIÁ DE CARRIL!»* + `sfx('tick')`, y se oculta al salir la pelota.
- **Claridad del objetivo y fix de textura en «¡Rompé el BYD!» (`3d/js/bonus.js`, `3d/js/main.js`, `3d/css/game.css`):**
  - Agregada cápsula dinámica `#bonus-ui .bonus-goal` que guía el objetivo en 1 línea: *«👊 ¡PEGALE AL PUNTO BRILLANTE! (×3)»*, cambia a *«🔌 ¡PEGALE A CEPI A LA DERECHA PARA DESENCHUFAR!»* a partir de 55 % de carga y a *«⚡ ¡DESENCHUFADO! ¡DALE AL BYD AHORA!»* al aturdir a Cepi.
  - Corregido bug real detectado en captura móvil: `startBydLevel()` ahora precarga `arena_<heroe>_back_` antes de abrir el mininivel para que Douge/Marine no se dibujen como cuadrado blanco cuando el sprite está diferido.
  - Corregido el cartel de cortina al romper el BYD (`NIVEL 1 · BUENOS AIRES` → `JEFE 2 · CEPI «EL NIÑO»`).
- **Anticipación del remate de Margot en Pinky (`3d/js/arena_pinky.js`, `3d/css/game.css`):** agregado aviso previo `.pinky-margot-cue` (*«¡MARGOT SE PREPARA PARA AYUDAR!»*) antes de la Fase 3 e ícono de Margot en el botón `.margot-btn` (*«¡TOCÁ PARA EL GRITO DE MARGOT!»*).
- **ES/FR (`3d/js/i18n.js`):** todas las nuevas señales traducidas al francés.
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` (**77/77 pruebas JS en verde**; `tests/check_sprites.py` omitido por falta de `numpy` en esta VM) y capturas verificadas en Chromium móvil (`390×844`) en `?probar=persecucion`, `?probar=byd` y `?probar=pinky-margot` con `0` errores JS. *(No equivale a Safari físico en iPhone.)*
- **Pendiente en dispositivo físico (Safari iPhone):** validar lectura rápida de las señales de Margot y el BYD con un jugador real, además de la prueba física pendiente de Big Chaky.
- **Rollback:** volver `main` y `feat-3d` al commit `799fabc`.

## 2026-11-24 (4) · Historia continua en los 4 jefes, Margot a salvo afuera del BYD y Duelo de Baile mejorado
- **Historia continua sin carteles secos de «JEFE X» (`3d/js/main.js`, `3d/js/boss_intro.js`, `3d/js/arena*.js`, `3d/js/i18n.js`):**
  - Cortinas narrativas en los 4 actos (*«¡LLEGASTE AL HANGAR VIP!»*, *«CEPI SE QUEDÓ SIN BYD… ¡PERO NO SIN PALETA!»*, *«¡BIENVENIDO AL OBRADOR DE LE BLÉ!»*, *«ÚLTIMA PARADA · EL GALPÓN»*) y puentes de victoria conectados de Chaky → Cepi → Lale → Pinky.
  - Mini-intro narrativa de 2 líneas (salteable con 1 toque/tecla, ES/FR) agregada a **Cepi**, **Lale** y **Pinky** (`3d/js/boss_intro.js`), y diálogo de **Big Chaky** pulido.
- **Margot a salvo afuera del BYD (`3d/js/bonus.js`):**
  - En *«¡Rompé el BYD!»* el auto ya no tiene a Margot adentro mientras se lo golpea; Margot espera a salvo afuera a la izquierda en su cochecito (`margot_sheet`) y festeja cuando el auto queda destruido.
- **5 mejoras al Duelo de Baile de Big Chaky (`3d/js/arena_logic.js`, `3d/js/arena.js`, `3d/css/game.css`):**
  - Conteo rítmico **3 · 2 · 1 · ¡A BAILAR!** antes de cada ronda y tras cada `⭐ ¡VIDA EXTRA!` (con `hurtT = 0` para volver limpio a pose de baile).
  - Carriles con guías de color y anillos de acierto/fallo en los 5 botones receptores.
  - **🔥 ¡MODO DISCO!** al encadenar 4+ aciertos seguidos (daño `×1,35`, reflectores rápidos, ola arcoíris en baldosas LED y Margot festejando al fondo).
  - Progresión de rondas con escaleras rítmicas de carriles vecinos en Rondas 2 y 3.
  - Haz de luz vertical suave sobre el héroe y chispazos sobre Chaky como feedback periférico en cada acierto.
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` (**78/78 pruebas JS en verde**; `tests/check_sprites.py` omitido por falta de `numpy` en esta VM) y capturas verificadas en Chromium móvil (`390×844`) de BYD con Margot afuera, intro de Cepi, conteo 3·2·1 y Modo Disco `×4` con `0` errores JS. *(No reemplaza Safari físico en iPhone.)*
- **Rollback:** volver `main` y `feat-3d` al commit `8f1e304`.




## 2026-11-24 (5) · Auditoría 360° (4 agentes) y Tanda 1 (4 fixes P0)
- **P0-1 · Poder táctil en Cepi, Lale y Pinky (`3d/js/arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`):** corregido `input.attackHeld` (inexistente) por `input.pressed('attack')` con `POWER.hold` (`0,45 s`) para que mantener `👊` en iPhone dispare el poder también en esas 3 arenas.
- **P0-2 · Audio en Safari iOS (`3d/js/audio.js`):** `ensure()` y `unlock` ahora chequean `ac.state !== 'running'` (cubre estado `'interrupted'` de iOS al volver de segundo plano/llamada); `pauseMusic()` frena `synthTimer` y suspende el `AudioContext`; `resumeMusic()` lo reanuda y reactiva el sintetizador.
- **P0-3 · HUD sin solapamientos en arenas (`3d/css/game.css`):** bajados `.cepi-tell`, `.pinky-margot-cue` y `.margot-btn` debajo de `#boss-bar` en vertical (`152px`) y horizontal (`118px`); separada `.fever-pill` por encima de `.phase-card.p2` cuando cambia de ronda en Modo Disco.
- **P0-4 · Poda de assets muertos + ahorro de VRAM (`3d/assets/`, `manifest.json`, `3d/js/world.js`, `tests/`):** eliminados 6 archivos sin uso (`music_street.mp3`, `boss_{idle,run,attack,hurt}.webp`, `chase_paris_fondo.webp`) y movido `baMatsFallback` al `else` de `world.js` (ahorra 8 `CanvasTexture` de 512×768 al arranque). Peso total `3d/assets/`: **9,51 MB → 7,84 MB** (129 archivos).
- **Verificación:** `node --check` OK en los 5 JS editados, `node tools/stamp_versions.mjs` OK, `npm test` **77/78 en verde, 0 fallos, 1 omitido** (`check_sprites.py` sin `numpy` local). **Pendiente:** validación física en Safari iPhone 15 Pro Max (multitouch + poder en Cepi/Lale/Pinky, recuperación de audio tras segundo plano y HUD vertical/horizontal).
- **Rollback:** volver `main` al commit `a573d17`.

## 2026-11-24 (6) · Tanda 2 (`margoush-art`): `arena_pinky_car.webp` + `arena_cepi_fondo.webp` panorámico 16:9
- **`3d/assets/arena_pinky_car.webp` (`512×484`, 23,4 KB):** generado en estilo Pixar 3D cálido (vista trasera de hatchback rojo con luces de reversa y patente `PK 912`), recortado de fondo verde croma con despill limpio y registrado en `3d/assets/manifest.json` (se conecta automáticamente al slot existente en `3d/js/arena_pinky.js:223`).
- **`3d/assets/arena_cepi_fondo.webp` (`1280×720`, 71,2 KB):** regenerado en formato panorámico 16:9 (antes vertical `714×1280` estirado `2,13×`) y ajustado su recorte UV en `3d/js/arena_cepi.js` (`repeat(1, 0.72)`, `offset(0, 0.28)`) para encuadrar techo, reflectores, banderines, gradas y cartel `PÁDEL` sin distorsión.
- **Peso total `3d/assets/`:** **7,86 MB** (130 archivos, < 10 MB).
- **Verificación:** `node --check 3d/js/arena_cepi.js`, `node tools/stamp_versions.mjs`, `npm test` (**77/78 en verde, 0 fallos, 1 omitido** por `numpy` local) e inspección visual del recorte WebP. **Pendiente:** validación visual en Safari físico de iPhone 15 Pro Max (`?probar=cepi` y `?probar=pinky`).
- **Rollback:** volver `main` al commit `f3bf1ab`.

## 2026-11-24 (7) · Tanda 3 (`margoush-dev`): Bloque P1 (BYD, vidas extra, FR completo, baile limpio y HUD sin thrashing)
- **P1-1 (`3d/js/bonus.js`, `3d/assets/manifest.json`):** el héroe en *¡Rompé el BYD!* ahora cicla `run0..3` al moverse (antes patinaba congelado en `idle`); registrado `chase_ba_fondo.webp` (`1200×611`) en `manifest.json` para que la fuga use el fondo porteño pintado, y normalizado `granja_lapadite` (`cols: 1, rows: 1, frames: 1`).
- **P1-2 (`3d/js/arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `3d/css/game.css`):** agregado indicador `⭐`/`☆` en el HUD de las 3 arenas; al activar vida extra ahora otorga `inv = 1,8 s`, `hurtT = 0,15 s` y limpia proyectiles/autos en curso; cambiada la etiqueta `<i>` a `<small>` en `.phase-card` para aplicar su estilo dorado y subidos los textos `< 12px` de `body.chaky-dance`.
- **P1-3 (`3d/js/arena_cepi.js`, `3d/js/i18n.js`):** botones `← IZQ` / `DER →` traducidos (`← GAUCHE` / `DROITE →`) y agregadas al francés las ~25 frases de `voice.js` (Cepi, Lale, Pinky) y subtítulos de Rondas 2/3 de Big Chaky.
- **P1-4 (`3d/js/arena.js`):** en reposo del duelo de baile, el héroe se mantiene en la hoja frontal `*_dance_sheet` sin saltar al sprite `*_idle` de calle.
- **P1-5 (`3d/js/main.js`):** `updateHud()` cachea nodos DOM y usa dirty-checking (cero mutaciones innecesarias por cuadro); `game.perf.record()` ahora también monitorea arenas, persecución y bonus.
- **Verificación:** `node --check` OK en los 7 JS editados, `node tools/stamp_versions.mjs` OK, `npm test` **77/78 en verde, 0 fallos, 1 omitido** (`check_sprites.py` sin `numpy` local). **Pendiente:** publicar Tandas 2+3 y validar en Safari físico de iPhone 15 Pro Max.
- **Rollback:** volver `main` al commit `f3bf1ab`.

## 2026-11-24 (8) · Diversión y ritmo: voz femenina de Marine, Persecución BYD con Turbo y mesas saltables, Pádel de Cepi casual y 4 mini-escenas
- **Voz de Marine (`3d/js/audio.js`, `3d/js/main.js`):**
  - Eliminada la colisión de `primeSpeech()` justo antes de `messiGoku()` al elegir a Marine; caché de voces en `voiceschanged`, ampliada `FEMALE_FR` (`Flo`, `Sandy`, `Shelley`, `Siri`, `Amélie`, `Audrey`, `Aurélie`, `Marie`, `Léa`, `Denise`, etc.) y exclusión de voces masculinas iOS (`Eddy`, `Reed`, `Rocko`, `Grandpa`, `Arthur`, `Martin`, `Thomas`, `Daniel`); tono ajustado (`pitch: 1.52`, `rate: 0.96`).
  - `SFX.messigoku` suavizado a un brillo agudo (sin `sawtooth` grave de 110 Hz); `audio.setHero(heroId)` evita que Marine dispare `¡DIUSHBAG!` en `hitHeavy`/`ko` (reemplazado por un destello femenino agudo).
- **Persecución del BYD más ágil y divertida (`3d/js/chase.js`, `tests/chase.test.mjs`):**
  - Duración reducida a ~25 s (`length: 520`, `speed: 19 → 25`, obstáculos desde los `48 m` cada `20–27 m`).
  - **Mesas de café ahora saltables** (`OBST.table.low = true`, `jumpH: 0.8`) con arcos de hongos/hojitas encima.
  - **Rampas ⚡ Turbo en el asfalto:** aceleran con zoom de FOV, chocan el paragolpes del BYD, le drenan distancia/batería, suman `+200 pts` y hacen gritar a Cepi (*«¡EY, EL PARAGOLPES!»* / *«¡MIS CUOTAS!»*).
  - Reincorporados charcos de manteca (con deslizamiento de carril) y palomas para dar variedad constante.
- **Pádel de Cepi balanceado para jugador casual (`3d/js/arena_cepi_logic.js`, `tests/arena_cepi.test.mjs`):**
  - Pelotas ~30 % más legibles (`ballSpeed: 10.5`, ~1 s de vuelo; rebote por vidrio `maxVx: 9.5`; cadencia `1.15 s` / `1.0 s`), ventana de devolución ampliada (`returnR: 2.15`, `returnZMin: -2.8 .. 1.8`), ventanas `tired` (`3.2 s`/`3.4 s`) y `stun` (`2.8 s`) más cómodas, y **Duelo de la Flechita** con `1.75 s` / `1.45 s` de reacción.
- **4 Mini-escenas cinematográficas entre Nivel y Boss (`3d/js/cine.js`, `3d/js/main.js`, `3d/js/i18n.js`):**
  - Agregadas `pre_chaky` (Hangar VIP), `pre_cepi` (BYD humeante → club de pádel, resolviendo la transición confusa), `pre_lale` (Obrador de Le Blé) y `pre_pinky` (revelación en el Galpón), todas de ~6 s con franjas de cine, presencia de Margot, botón `SALTAR ⏭` y traducción completa ES/FR (0 KB extra de assets). Preservado `game.time` en escenas intermedias.
- **Calles más vivas y guiños de Margot (`3d/js/level.js`, `3d/js/score.js`, `3d/js/main.js`):**
  - Oleadas de Acto 1 (`avenida`, `le-concept`) y Acto 3 (`francia`, `francia-2`) con 3 enemigos flanqueando (manteniendo 100 % separación por país y sin jefes ni piquete); rangos recalibrados (`S: 14.250`, `A: 11.050`, `B: 7.150`); Margot festeja en pantalla al despejar cada oleada (`👶 ¡Vamos, papá!` / `👶 ¡Allez maman !`).
- **Verificación:** `node --check` OK en los 8 JS editados, `node tools/stamp_versions.mjs` OK, `npm test` **77/78 en verde, 0 fallos, 1 omitido** (`check_sprites.py` por falta de `numpy` local). **Pendiente en dispositivo físico (Safari iPhone 15 Pro Max):** probar voz femenina de Marine con/sin modo silencio, salto sobre mesas y rampas Turbo en BYD, velocidad del pádel de Cepi y las 4 mini-escenas.
- **Rollback:** volver `main` al commit `1f52ee7`.

## 2026-11-24 (9) · Lógica narrativa causal + Trayectoria continua de Margot + Escala uniforme de héroes + Voz natural de Marine + Cámaras propias por Boss
- **Auditado con 2 agentes especialistas (`margoush-narrative-logic` y `margoush-margot-tracker`):**
  - **Trayectoria 100 % continua de Margot y pases de posta EN PANTALLA (`3d/js/cine.js`, `3d/js/main.js`, `3d/js/bonus.js`, `3d/js/arena.js`, `3d/js/arena_cepi.js`, `3d/js/arena_lale.js`, `3d/js/arena_pinky.js`, `3d/js/i18n.js`):**
    - **Intro (`Le Concept`):** Big Chaky paga a Pinky con un cheque (*«💵 ¡Cheque al día!»*, sembrando el giro del Acto 4), a Lale con manteca y a Cepi con el cargador, y **Big Chaky mismo agarra el cochecito de Margot** (`push`) rumbo a Ezeiza avisándole a Cepi que tenga el BYD listo. Eliminado código muerto `afterByd`.
    - **Baile de Big Chaky (`arena.js`):** Margot movida del centro al **costado derecho del escenario** (`x = 4.45, z = STAGE_Z - 1.25`), dejando el centro libre entre héroe y Chaky y visible en vertical/horizontal.
    - **3 pases de posta visibles en pantalla (`post_chaky`, `post_cepi`, `post_lale`):** al caer Chaky KO, Cepi entra corriendo y agarra a Margot para escapar en el BYD; en *¡Rompé el BYD!* y `pre_cepi` Margot queda custodiada del lado derecho de Cepi (`chargerX + 0.78`) y Cepi se la lleva a la cancha de pádel; al caer Cepi KO, Lale agarra a Margot rumbo a París (*Le Blé*); al caer Lale KO, Pinky entra furioso porque el cheque de Chaky rebotó y se lleva a Margot al Galpón.
    - **Margot visible en las 4 arenas:** agregada al costado derecho en Cepi (`arena_cepi.js`), Lale (`arena_lale.js`) y visible toda la pelea al costado en Pinky (`arena_pinky.js`) hasta su Grito Supersónico de Fase 3.
- **Tamaño 100 % uniforme de Douge y Marine (`3d/js/hero.js`):**
  - Normalizadas las alturas visuales `POSE_H` de `idle`, `walk`, `run`, `combo_sheet` y `actions_sheet` (`marine_actions_sheet` pasaba de `1.64×` a `1.14×` y `run` de `0.76×` a `0.96×`), eliminando el salto de tamaño al saltar o pegar.
- **Voz natural de Marine (`3d/js/audio.js`):**
  - Tono bajado de `1.52` artificial a **`1.12`** natural (`rate: 0.96`), quitado el destello/arpegio invasivo en combate y suavizado `SFX.messigoku` a dos notas muy suaves para que la voz suene limpia y uniforme.
- **Cámaras de entrada únicas por Boss (`3d/js/boss_intro.js`, `arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `cine.js`):**
  - `boss_intro.js` acortado a tarjeta VS ágil (`1.9 s`) sin repetir diálogos; cada arena tiene su propia cámara de entrada (frontal disco en Chaky, barrido lateral rasante sobre la red en Cepi, paneo diagonal desde los hornos en Lale, contrapicado dramático desde el piso en Pinky) y cada `cine.js` usa su propio ángulo.
- **Verificación:** `node --check` OK en los 11 JS editados, `node tools/stamp_versions.mjs` OK, `npm test` **77/78 en verde, 0 fallos, 1 omitido** (`check_sprites.py` sin `numpy` local). **Pendiente en Safari físico iPhone 15 Pro Max:** validar voz natural de Marine, tamaño uniforme de sprites al saltar/pegar, Margot al costado en el baile y los pases de posta en campaña completa.
- **Rollback:** volver `main` al commit `9597297`.



## 2026-11-25 · QA sobre `main` (`b98f22c`), arreglo del test de sprites y 8 agentes `gs-*` de solo lectura
- **QA (solo lectura):** `index.html` publicado = `3d/index.html` de `main` (SHA-256 `8d2aec5a…`); `node --check` sin fallos; francés sin `tr()` sin traducir en el código (379 textos + 154 frases). No se jugó la campaña ni se corrieron los e2e. Safari físico sigue pendiente.
- **Arreglo:** `tests/check_sprites.py` exigía los sprites `boss_*` que la poda del 24/11 eliminó; con `numpy`/`scipy`/`Pillow` instalados la prueba fallaba (en la VM anterior se omitía). Ahora `npm test` = 78/78.
- **Agentes nuevos (`.claude/agents/gs-*.md`, solo lectura):** game-designer, narrative-director, localization-lead, art-director, audio-director, ux-designer, qa-lead y performance-analyst, adaptados de Donchitos/Claude-Code-Game-Studios (MIT, ver `NOTICE-game-studios.md`). Sin hooks ni settings del original.
- **Pendiente:** decidir las voces de los jefes (hoy `audio.bossLine()` está vacío en `3d/js/audio.js`).
- **Rollback:** volver `main` al commit `b98f22c`.

## 2026-11-25 · Paso 0: arreglo de la traba de Cepi (`TypeError` en `arena_cepi_logic.js`)
- **Causa:** en el bucle de pelotas de `update()`, `damage()` vacía `state.shots` (KO o cambio de fase) y el bucle seguía con un índice inexistente → `TypeError` al leer `s.x`; se perdía el evento `phase`/`ko` y la pelea quedaba trabada.
- **Arreglo:** `if (!s) continue;` al inicio de la iteración. Revisado `arena_lale_logic.js` y `arena_pinky_logic.js`: sus bucles no llaman a `damage()` ni vacían la lista, sin cambios.
- **Test nuevo:** `tests/arena_cepi.test.mjs` (dos pelotas devueltas, cambio de fase y KO). `npm test` 79/79.
- **Prueba:** `?probar=cepi-carton`. Pantalla negra del duelo de la flechita con Marine: no reproducida; pendiente propuesta `?debug=1`.
- **Rollback:** volver `main` al commit `4e62eaa`.

## 2026-11-25 · Etapa A · A1: la calle de Buenos Aires termina en el acceso a Ezeiza
- La oleada final del nivel 1 (`le-concept` en `3d/js/level.js`) ya no dice «FRENTE A LE CONCEPT»: ahora «¡ACCESO A EZEIZA!» / «La patota de BIG CHAKY bloquea la entrada al aeropuerto.» (FR en `3d/js/i18n.js`: «ACCÈS À EZEIZA !»). El id de la oleada y las posiciones no cambian.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79. Sin cambios de arte: el edificio de Le Concept sigue en el decorado de ese tramo. Safari físico pendiente.
- **Prueba:** `?probar=calle` (o `?probar=le-concept` para ir directo a la oleada final).
- **Rollback:** volver `main` al commit `c872c45`.

## 2026-11-25 · Etapa A · A2: Chaky pide el BYD en el hangar; el baile es su fiesta de despegue
- Intro (`3d/js/cine.js`): «¡Cepi, teneme el BYD listo en el hangar!» (antes «en la 9 de Julio», contradecía el hangar). Escena del hangar: «¡Es mi fiesta de despegue, en mi jet! ¡Ganame en mi pista disco!» (antes «¿Pelear con este traje violeta?…»). FR actualizado en `3d/js/i18n.js`.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79. Safari físico pendiente.
- **Prueba:** `?probar=chaky`. **Rollback:** volver `main` a `cfba750`.

## 2026-11-25 · Etapa A · A3: Lale mira desde las gradas y se lleva a Margot en el jet de Chaky
- `3d/js/arena_cepi.js`: Lale (`arena_lale_idle`) aparece sobre una tarima al costado derecho de la cancha durante toda la pelea de Cepi (se crea cuando su imagen ya está cargada). `3d/js/main.js` la precarga en `spawnCepi`.
- `3d/js/cine.js` (`post_cepi`): Lale sale de ahí («¡Lo vi todo desde las gradas! Chaky me presta su jet…»), Cepi dice que se fue en el jet de Chaky, y al agarrar el cochecito: «¡Al jet de Chaky!». FR en `3d/js/i18n.js`.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79; arena de Cepi abierta en Chrome sin errores JS (Lale visible, captura revisada). La escena `post_cepi` no la pude mirar en pantalla. Safari físico pendiente.
- **Prueba:** `?probar=cepi-carton` (pelear y ver a Lale; al ganar sale la escena). **Rollback:** volver `main` a `f1a550c`.

## 2026-11-25 · Etapa A · A4: Le Blé París es la casa central de la Le Blé porteña
- Textos (ES y FR) en `3d/js/cine.js`, `3d/js/main.js` (checkpoint `lale`), `3d/js/level.js` (oleada `francia-2`: «CAMINO A LE BLÉ») y `3d/js/i18n.js`: «obrador» pasa a «casa central de Le Blé» / «siège». Se mantienen las dos fachadas (la porteña y la de París). `tests/campaign-continuity.test.mjs` actualizado al nuevo cartel.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79; arena de Lale abierta en Chrome sin errores JS. La escena `pre_lale` no la miré en pantalla. Safari físico pendiente.
- **Prueba:** `?probar=lale`. **Rollback:** volver `main` a `2d68dca`.

## 2026-11-25 · Etapa A · A5: Pinky viajó en el jet de Chaky y muestra el cheque firmado por Facu
- `post_lale` (`3d/js/cine.js`): Pinky explica que viajó en el jet cuidándole el estacionamiento a Chaky y que el cheque rebotó.
- Al caer Pinky: su línea de KO (`3d/js/voice.js`) dice que el cheque lo firmó Facu, y `3d/js/arena_pinky.js` muestra el cartel «💵 Cheque firmado: FACU». FR en `3d/js/i18n.js`. Deja sembrado el Acto 5 (Facu como jefe final, Etapa B).
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79; arena de Pinky abierta en Chrome sin errores JS. Safari físico pendiente.
- **Prueba:** `?probar=pinky-margot` (ganar la pelea para ver el KO). **Rollback:** volver `main` a `5cff8b4`.

## 2026-11-25 · Etapa A · A6: sin frases de barriles y sin masculinos al jugar con Marine
- `3d/js/voice.js`: Chaky ya no habla de barriles (intro «…y vine a bailar!», ataques de baile; se borraron `returned`, `special` y `stuck`, que ya no se usan). «campeón», «papá», «papi» y «jefe» pasaron a frases neutras (Chaky, Cepi, Pinky). Cartel de llegada a Le Blé: «¡LLEGASTE A LA CASA CENTRAL DE LE BLÉ!»; línea de Lale en `3d/js/cine.js` sin «bienvenido».
- `3d/js/i18n.js`: borradas las 6 claves de barriles y actualizadas/agregadas las del francés. `tests/campaign-continuity.test.mjs` al nuevo cartel.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79; arenas de Chaky y Lale abiertas en Chrome sin errores JS. Safari físico pendiente. Pendiente conocido: «👶 ¡Vamos, papá!» y la tarjeta «¡Es eléctrico, papá!» (texto de escena de Cepi) siguen en masculino.
- **Prueba:** `?probar=chaky-baile` (jugar con Marine). **Rollback:** volver `main` a `66ebe4a`.

## 2026-11-25 · P2-2: arte nuevo de Gemini integrado (Cepi golpeado, Chaky derrotado, Pinky en reposo, Lale 2.º cuadro de patín, Margot asustada/festejando)
- Fondo verde quitado con `key_green` (`tools/import_arena.py`). Imágenes nuevas: `arena_cepi_hurt`, `arena_chaky_dance_ko`, `arena_pinky_idle`, `arena_lale_skate2`, `arena_margot_scared`, `arena_margot_cheer` (~290 KB en total, se cargan bajo demanda). Escala por `hk` en `manifest.json` (Chaky KO 0,72; Cepi golpeado 0,93).
- **Chaky** (`3d/js/arena.js`): al caer KO se arrodilla (antes reutilizaba el giro). **Cepi** (`arena_cepi.js`): 0,45 s de «golpeado» tras cada piña que recibe (lógica intacta). **Pinky** (`arena_pinky.js`): descansa con brazos cruzados y silbato cuando no hay autos. **Lale** (`arena_lale.js`): alterna los dos cuadros de patín. **Margot** en las arenas de Cepi y Lale: asustada normalmente y festejando cuando el jefe queda aturdido/KO; sin la imagen vuelve al cuadro de la hoja. `main.js` precarga `arena_margot_` en Cepi y Lale.
- Verificación: `node --check`, `stamp_versions.mjs`, `npm test` 79/79; las arenas de Cepi, Lale, Pinky y Chaky abren en Chrome sin errores JS (capturas revisadas). No se vio en pantalla el KO de Chaky ni el golpe de Cepi. Safari físico pendiente.
- **Pruebas:** `?probar=chaky-baile`, `cepi-carton`, `lale`, `pinky`. **Rollback:** volver `main` a `49c07d6`.

## Actualización 2026-11-25 · Etapa B (Acto 5: Facu, jefe final)
- Nueva arena `3d/js/arena_facu.js` (+ lógica pura `arena_facu_logic.js`, 7 tests). Galería HENRIS procedural; Facu usa el sprite viejo `facu.webp` (restaurado) animado por código.
- Fase 1: cuadros voladores por 3 carriles · Fase 2: minijuego «¿cuál es el cuadro verdadero?» · Fase 3: Facu enojado; el llanto de Margot lo ablanda (KO «¡FACU SE ABLANDA!»).
- Pinky ya no termina el juego: escena B2 `post_pinky` («el cheque lo firmó Facu») → `spawnFacu` → rescate/foto familiar con Chaky y Facu en `CREW`.
- Checkpoint `facu` agregado. Pruebas: `?probar=facu`, `facu-verdadero`, `facu-enojado`, `final`.
- QA: `npm test` 86/86; humo headless móvil sin errores JS. Safari físico pendiente.
- Rollback: `main` en `1a0c162`.

## 2026-11-25 · Etapa C: jefes con gesto, Facu galerista y Margot sin llanto
- **Margot ya no llora como golpe.** Pinky: le revolea la papilla a los anteojos (queda ciego y se tambalea). Facu: garabatea su cuadro con crayones y él se derrite («¡ES UNA OBRA MAESTRA!»). Módulo nuevo `3d/js/margot_finish.js`; eventos `margotPapilla` / `margotArt` (antes `margotCry`).
- **Facu galerista con juego propio** (ya no es copia de Pinky): fase 1 «obra en vivo» = apunta (mira en el piso) → pincelazo en parábola → charco pegajoso que frena; después pinta en su atril (momento para pegarle). Fase 2 sin cambios (cuadro verdadero). Fase 3: pincelazos de a dos + levanta el cuadro antes de revolearlo + crayones de Margot. Atril 3D con lienzo que se pinta en vivo.
- **Tiros con gesto previo:** `state.windup` en Cepi, Lale y Facu (se planta, carga y tiembla antes de soltar); Pinky señala con el trapo el cajón del próximo auto.
- Poses de Facu: el juego usa `arena_facu_<idle|reveal|aim|throw|paint|windup|hurt|love|ko>` si existen; si no, el dibujo viejo `facu` animado por código. ZIP para Gemini entregado (10 imágenes, incl. `arena_facu_fondo`).
- Tests: `npm test` 88/88 · humo móvil `tests/e2e/facu_galerista.e2e.mjs` OK sin errores. Safari físico pendiente.
- Pendiente (Etapa D): pulido de diseño — HUD (carteles de fase tapan la acción, textos que se pisan), cinemáticas, arenas y personajes.

## 2026-11-25 · Etapa D (parte 1, sin imágenes nuevas): HUD y cinemáticas
- Textos flotantes que no se pisan: módulo nuevo `3d/js/pop_layout.js` (los textos viejos quedan quietos y los nuevos se corren arriba o abajo; nunca debajo del HUD ni de la barra del jefe). Lo usan la calle (`fx.js`) y las 5 arenas.
- Cartel de fase: deja de estar en el medio de la pelea; ahora es una cinta más chica debajo del HUD y de la barra del jefe (variable CSS `--hud-b`). El cartel del duelo de baile no cambia.
- Cinemáticas: Margot ya no llora cuando se la llevan. Se ríe, grita «¡Papááá, más rápido!» (FR «Mamaaan, plus vite !») y le tira el chupete por la cabeza al que la lleva (Chaky, Cepi, Lale o Pinky: «¡TOC!» + «¡AY! ¡El chupete no!»). En la luneta del BYD se la ve contenta.
- Pruebas: `npm test` 91/91 (3 nuevas en `tests/pop_layout.test.mjs`). E2E nuevo `tests/e2e/etapa_d.e2e.mjs` OK (430×932): 4 textos en el mismo punto sin pisarse, cartel debajo del HUD y terminando al 31 % de la altura, chupete en `pre_cepi` y `pre_pinky`, sin errores JS. `facu_galerista` y `arena` OK.
- Ya fallaban antes de este cambio (probado sobre `5bc3271`, no son de esta etapa): `cine.e2e` (espera la persecución después de SALTAR), `cepi_pinky.e2e` y `chase.e2e` (timeouts). Revisar aparte.
- Pendiente: Safari físico; imágenes de Facu galerista; resto de la Etapa D (arenas y personajes, cuando lleguen las imágenes).

## 2026-11-26 · T-0: plan de trabajo + e2e viejos (hecho por Gemini)
- Qué cambió: `docs/PLAN_TRABAJO.md` (plan incorporado al repo), `tests/e2e/harness.mjs` (rutas compatibles con Linux y Windows/local `node_modules`), `tests/e2e/cine.e2e.mjs` (actualizado al flujo actual: SALTAR lleva a Acto 1 calle porteña + escena `post_cepi` hacia Acto 3), `tests/e2e/cepi_pinky.e2e.mjs` (Cepi en su arena en vez de oleada borrada `boulevard`, `assets.ensure` para hojas diferidas de Pinky/Cepi y chequeo de victoria sin Cepi ni Facu) y `tests/e2e/chase.e2e.mjs` (entrada por `resumeAt({ id: 'acto2' })` y esperas por tiempo real para GPU por software). No se modificó código del juego en `3d/`.
- Verificación: `npm test` 90/91 en verde (0 fallos; 1 omitido: `check_sprites.py` porque `-I` aísla `numpy` de user site-packages en Windows); E2E en Chrome headless `cine.e2e.mjs`, `cepi_pinky.e2e.mjs` y `chase.e2e.mjs` todos en verde con 0 errores de consola. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=persecucion
- Rollback: `git revert <commit [T-0]>` en `feat-3d` y push (base previa: `ed53fc4`).

## 2026-11-26 · A-0: inventario de arte (hecho por Gemini)
- Qué cambió: creado `docs/ARTE_FALTANTE.md` con tablas completas por personaje (Douge, Marine, Margot, Big Chaky, Cepi, Lale, Pinky, Facu y los 5 secuaces) relevadas contra `3d/assets/manifest.json` y los módulos de `3d/js/`; priorización ajustada para A-1 (10 imágenes de Facu galerista), A-2 (poder/derrota de espaldas de héroes), A-3 (`windup` de Lale/Cepi y `stun` de Pinky) y A-4 (3 gags de Margot sin llanto), además del registro de `arena_margot_hero` sin uso y las 4 hojas > 2048 px para R-4. Actualizado `docs/PLAN_TRABAJO.md`.
- Verificación: `npm test` 90/91 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); tarea solo documental sin cambios en `3d/`. Qué NO se pudo probar: Safari físico (no aplica).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu
- Rollback: `git revert <commit [A-0]>` en `feat-3d` y push (base previa: `d0521a9`).

## 2026-11-26 · R-1: modo diagnóstico `?debug=1` (hecho por Gemini)
- Qué cambió: `3d/js/main.js`, `3d/css/game.css`, `3d/index.html` (sellado con `stamp_versions.mjs`), `tests/e2e/debug.e2e.mjs` y `docs/PLAN_TRABAJO.md`. Con `?debug=1` se muestra la cajita `#debug-hud` arriba a la izquierda con FPS, ms/cuadro, `perf.level`, DPR, `renderer.info.render.calls`, `geometries`, `textures`, estado/héroe, `frameErrors`, último error (incluyendo `error`/`unhandledrejection`) y aviso rojo ante `webglcontextlost`. Sin `?debug=1` no se crea ningún nodo ni corre lógica extra.
- Verificación: `node --check 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` 90/91 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); `node tests/e2e/debug.e2e.mjs` OK en Chrome headless móvil (`430×932`) abriendo `?probar=cepi-duelo&debug=1` con Marine y verificando ausencia sin `debug=1` (0 errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max (incluye reproducir pantalla negra en duelo de la flechita con Marine).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=cepi-duelo&debug=1
- Rollback: `git revert <commit [R-1]>` en `feat-3d` y push (base previa: `4a81aac`).

## 2026-11-26 · D-1: Chaky no se gana palmeando los 5 carriles (hecho por Gemini)
- Qué cambió: `3d/js/arena_logic.js`, `tests/arena.test.mjs`, `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Tocar un carril vacío en el duelo de baile ahora corta el combo/Modo Disco sin sacar corazón al primer desliz, y al acumular 3 toques vacíos dentro de 1,0 s (`emptyWindow: 1.0`, `emptyLimit: 3`) cuenta como fallo (`grade: 'miss'` + `hurt`).
- Verificación: `node --check 3d/js/arena_logic.js`, `node tools/stamp_versions.mjs`, `npm test` 91/92 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows), incluyendo simulación de bots en 20 semillas en `tests/arena.test.mjs`: palmear los 5 carriles gana < 20 % y gasta ≥ 2 ⭐; jugador casual bueno gana ≥ 95 %. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=chaky-baile
- Rollback: `git revert <commit [D-1]>` en `feat-3d` y push (base previa: `b25f403`).

## 2026-11-26 · A-1 (parcial): fondo galería HENRIS aprobado (`arena_facu_fondo`) (hecho por Gemini)
- Qué cambió: `3d/assets/arena_facu_fondo.webp` (`1280×714`, 112,7 KB, total `3d/assets/`: 8,68 MB < 10 MB), `3d/assets/manifest.json`, `3d/js/assets.js` (agregado `arena_facu_` a carga diferida `DEFERRED`), `3d/js/arena_facu.js` (recorte UV superior `repeat(1, 0.67)` / `offset(0, 0.33)` sobre `BW=74, BH=29` para alinear el zócalo con el parquet 3D sin doble piso ni franjas en horizontal), `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Aprobado previamente por Facu (Regla 7); quedan pendientes las 9 poses de Facu del kit ZIP `A-1_facu_galerista.zip`.
- Verificación: `node --check 3d/js/assets.js 3d/js/arena_facu.js`, `node tools/stamp_versions.mjs`, `npm test` 91/92 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); capturas visuales verificadas en Chrome headless `430×932` (vertical) y `932×430` (horizontal) en `?probar=facu` (`hasBg=true`, `0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu
- Rollback: `git revert <commit [A-1 fondo]>` en `feat-3d` y push (base previa: `07d2401`).

## 2026-11-26 · D-2: balance de Cepi (devolución justa y fase 1 legible) (hecho por Gemini)
- Qué cambió: `3d/js/arena_cepi_logic.js`, `tests/arena_cepi.test.mjs`, `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Ajustados `ballSpeed` (`10.5 → 8.8`), `ballHitR` (`0.9 → 0.72`), `windup` (`0.42 → 0.55`), `maxVx` en vidrio (`9.5 → 7.5`), ventana de devolución más precisa (`returnR: 1.35`, `returnZMin: -1.6 .. 1.1`) y recuperación corta al golpear al aire (`returnWhiffCd: 0.55`) para que machacar 👊 lejos de la pelota no devuelva gratis.
- Verificación: `node --check 3d/js/arena_cepi_logic.js`, `node tools/stamp_versions.mjs`, `npm test` 92/93 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Simulación de bots (40 semillas): machacador 10 %, novato 98 %, casual 100 %, golpes recibidos en fase 1 ≤ 1,5. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=cepi
- Rollback: `git revert <commit [D-2]>` en `feat-3d` y push (base previa: `6174c12`).

## 2026-11-26 · D-3: balance de Lale (duración y desafío justos) (hecho por Gemini)
- Qué cambió: `3d/js/arena_lale_logic.js`, `tests/arena_lale.test.mjs`, `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Ajustados `butterSpeed` (`12.5 → 14.3`), `butterHitR` (`0.9 → 0.96`), `bagHitR` (`1.9 → 1.45`), pausa entre bolsas (`bagCd: 3.0`), ventana enharinado (`flouredDur: 2.0`, `meleeCd: 0.58`, daño directo de bolsa `3/4 → 1` para priorizar golpes cuerpo a cuerpo), `skateSpeed` (`8.6 → 10.8`) y 3 pasadas en fase 3. Se preservan `hpMax: 30, p2At: 20, p3At: 10` para `?probar=lale-patin` / `lale-horno`.
- Verificación: `node --check 3d/js/arena_lale_logic.js`, `node tools/stamp_versions.mjs`, `npm test` 93/94 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Simulación de bots (40 semillas en `tests/arena_lale.test.mjs`): machacar `< 15 %`, casual flojo `70–90 %` recibiendo `≥ 1,5` golpes con duración mediana `30–45 s`. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=lale
- Rollback: `git revert <commit [D-3]>` en `feat-3d` y push (base previa: `09ddc33`).

## 2026-11-26 · A-1 (completo): 9 poses de Facu galerista integradas (`arena_facu_*`) (hecho por Gemini)
- Qué cambió: generadas en Gemini (con aprobación de Facu en `facu_a1_preview.md`), recortadas con croma verde limpio y despill sin halo, e integradas las 9 poses `3d/assets/arena_facu_{idle,reveal,aim,throw,paint,windup,hurt,love,ko}.webp` (~78 KB en total; peso total `3d/assets/`: **8,35 MB < 10 MB**), registradas en `3d/assets/manifest.json` con `hk` calibrado (`windup: 1.12`, `hurt: 0.92`, `ko: 0.78`, `throw: 0.95`, `paint: 0.98`, `aim: 0.99`). En `3d/js/arena_facu.js`: sprite inicial `arena_facu_idle`, orientación natural (`sx = own ? 1 : -1`) para `paint` mirando al atril, y `EASEL.x` corrido a `2.45` para no tapar el pincel. Sellado `3d/index.html` con `stamp_versions.mjs` y marcado `[x]` en `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/arena_facu.js`, `node tools/stamp_versions.mjs`, `npm test` 93/94 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); inspección visual de hoja de las 9 poses recortadas y capturas en Chrome headless (`430×932` vertical y `932×430` horizontal) en `?probar=facu` (`0` errores de consola). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu
- Rollback: `git revert <commit [A-1]>` en `feat-3d` y push (base previa: `ece55bb`).

## 2026-11-26 · H-1: cartel de ronda de Chaky (y carteles de UI) solo en francés (hecho por Gemini)
- Qué cambió: `3d/js/i18n.js`, `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Movidas las claves de UI/carteles de ronda y fase (`RONDA 1..3`, `¡DUELO DE BAILE!`, `¡SUBE EL RITMO!`, `¡FINAL A TODO DISCO!`, `Tocá cada botón cuando baja la flecha`, `⭐ ¡VIDA EXTRA!`, carteles de fase de Facu/Chaky) de `DICHOS` a `TEXTOS` para que `fillText()` muestre solo francés sin duplicar altura con subtítulo bilingüe.
- Verificación: `node --check 3d/js/i18n.js`, `node tools/stamp_versions.mjs`, `npm test` 93/94 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); prueba en Chrome headless (`430×932`) en `?probar=chaky-baile`: altura de `.phase-card` en ES = `68 px`, en FR = `68 px` (`diff = 0.0 %`, `0` subtítulos `small.sub`, `0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=chaky-baile
- Rollback: `git revert <commit [H-1]>` en `feat-3d` y push (base previa: `db48f53`).

## 2026-11-26 · H-2: correcciones de francés para revisión de Marine (hecho por Gemini)
- Qué cambió: `3d/js/i18n.js`, `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`. Lista de frases cambiadas para que **Marine las revise**:
  - `LALE «MANTECOSO»`: `LALE « LE BEURRÉ »` → `LALE « MANTECOSO »` (y en `JEFE 3 · LALE «MANTECOSO»`).
  - `Untadito, untadito…`: `Bien beurré, bien beurré…` → `Bien tartiné, bien tartiné…` (evita argot «borracho»).
  - `à Le Blé` / `de Le Blé` (6 frases): pasadas a `chez Le Blé` / `la maison mère de chez Le Blé` (`ENFIN CHEZ LE BLÉ (MAISON MÈRE) !`, `Serveurs et livreurs gardent la maison mère de chez Le Blé.`, `La maison mère de chez Le Blé ! Quelle odeur de beurre !`, `Entre, c'est la maison mère de chez Le Blé. J'ai du beurre pour tout le monde !`, `…j'emmène Margot chez Le Blé, à Paris !`, `…il s'est enfui dans le jet de Chaky chez Le Blé, à Paris !`, `Suis Lale jusqu'à la maison mère de chez Le Blé !`).
  - Masculinos dirigidos al jugador (neutros para Douge y Marine): `TU ES ARRIVÉ AU HANGAR VIP !` → `ARRIVÉE AU HANGAR VIP !`; `La bande t'a suivi jusqu'en France !` → `La bande te poursuit jusqu'en France !`; `Sois le premier !` → `Prends la première place !`; `TOUCHÉ !` (`¡TE AGARRÓ!`) → `AÏE !`; `Ha ! Tu es tombé dans le piège !` → `Ha ! En plein dans le piège !`; `Tiens, il sait danser !` → `Tiens, ça sait danser !`; `Je la paie en 48 fois, mec !` → `Je la paie en 48 fois !`; `mon pote !` → `chef !`.
  - Anglicismo: `Dernier round pour gagner le duel !` → `Dernière manche pour gagner le duel !`.
- Verificación: `node --check 3d/js/i18n.js`, `node tools/stamp_versions.mjs`, `npm test` 93/94 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: revisión nativa de Marine y Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=lale
- Rollback: `git revert <commit [H-2]>` en `feat-3d` y push (base previa: `f76928e`).

## 2026-11-26 · H-3: sin claves repetidas en `i18n.js` + test automático (hecho por Gemini)
- Qué cambió: `3d/js/i18n.js` (eliminadas las 6 claves duplicadas en `TEXTOS`: `⚡ ¡PODER LISTO!`, `NIVEL 1 · BUENOS AIRES`, `¡PIQUETE!`, `CAMINO A LE BLÉ`, `¡PELOTAZO!`, `¡BIG CHAKY SE LLEVÓ A MARGOT!`; sin cambios en lo que se ve en español), `tests/i18n.test.mjs` (nuevo test que verifica 0 duplicados en `TEXTOS`, 0 en `DICHOS` y 0 solapamiento entre ambos, además de reglas H-1/H-2), `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/i18n.js`, `node tools/stamp_versions.mjs`, `npm test` 95/96 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=cepi-duelo
- Rollback: `git revert <commit [H-3]>` en `feat-3d` y push (base previa: `fba5d61`).

## 2026-11-26 · H-4: sin masculinos dirigidos a Marine + salto de línea en frases flotantes `.pop` (hecho por Gemini)
- Qué cambió: `3d/js/bonus.js` (`¡Es eléctrico, papá!` → `¡Es eléctrico, che!`), `3d/js/enemies.js` (`¿Te lo cuido, jefe?` / `¡Son 2 lucas, maestro!` → `¿Te lo cuido?` / `¡Son 2 lucas!`), `3d/js/ui.js` (`¡Sé el primero!` → `¡El primer lugar te espera!`), `3d/js/i18n.js` (claves actualizadas en FR), `3d/css/game.css` (`.pop` con `width: max-content; max-width: min(90vw, 420px); white-space: normal; text-align: center; line-height: 1.15`), `3d/js/pop_layout.js` (acotado horizontal de `.pop` para que no se recorte contra los bordes en 430 px), `3d/index.html` (sellado con `stamp_versions.mjs`) y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check`, `node tools/stamp_versions.mjs`, `npm test` 95/96 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); prueba en Chrome headless (`430×932`) con la frase más larga de Pinky (`¡Bueno, bueno! Hoy no se cobra… ¡pero mirá, el cheque lo firmó Facu!`): ancho ≤ 90 % de 430 px (sin desbordar), `0` errores. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=pinky
- Rollback: `git revert <commit [H-4]>` en `feat-3d` y push (base previa: `aec059c`).

## 2026-11-26 · A-5: transiciones fluidas entre poses (~80 ms + squash & stretch) (hecho por Gemini)
- Qué cambió: `3d/js/poses.js` (agregados `CROSSFADE = 0.08`, `poseImpulseKind`, `poseScaleBlend`, `triggerSpriteBlend`, `stepSpriteBlend` con plano fantasma que solo se dibuja durante los 80 ms del fundido y se libera con `keep()`), `3d/js/sprites.js` (`SpriteActor` con fundido cruzado de 80 ms, interpolación suave de tamaño sin saltos, squash & stretch al atacar/recibir golpe y rebote al caer de un salto, con `ghostMat.dispose()`), las 5 arenas (`arena.js`, `arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `arena_facu.js`), `tests/poses.test.mjs`, `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check` en los 7 JS editados, `node tools/stamp_versions.mjs`, `npm test` 96/97 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); verificación cuadro a cuadro en Chrome headless (`430×932`) en calle y `?probar=facu` (salto + golpe, `0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu
- Rollback: `git revert <commit [A-5]>` en `feat-3d` y push (base previa: `0416883`).

## 2026-11-26 · A-6: caminar y correr acoplados al desplazamiento real (sin patinar) (hecho por Gemini)
- Qué cambió: `3d/js/hero.js` (velocidad del ciclo walk/run calculada desde desplazamiento real `Math.hypot(p.x - prevX, p.z - prevZ) / dt` tras `clampPosition`, evitando que patine contra portones o bordes), `3d/js/enemies.js` (vibración de rodado e inclinación de embestida en `delivery` sobre la bici), `3d/js/chase.js` (rebote sobre empedrado acoplado a `dist` en el vehículo del héroe), `3d/js/bonus.js` y las 4 arenas con desplazamiento (`arena_cepi.js`, `arena_lale.js`, `arena_pinky.js`, `arena_facu.js`: `stepT` avanza por metros recorridos reales en lugar de reloj fijo, evitando patinar al caminar lento, sobre pintura/manteca o contra bordes), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check` en los 8 JS editados, `node tools/stamp_versions.mjs`, `npm test` 96/97 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=calle
- Rollback: `git revert <commit [A-6]>` en `feat-3d` y push (base previa: `c842f16`).

## 2026-11-26 · D-6: «¡DIUSHBAG!» sin atenuación por `primeSpeech()` al elegir a Douge (hecho por Gemini)
- Qué cambió: `3d/js/main.js` (removido `audio.primeSpeech()` de `startCover` y del clic en la tarjeta de Douge; en `#btn-continue` se llama solo cuando `cp.heroId === 'marine'`; al elegir a Marine `audio.messiGoku()` ya habla dentro del gesto), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` 96/97 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). **Qué NO se pudo probar:** Safari físico en iPhone 15 Pro Max — este arreglo **solo se puede confirmar escuchándolo en iPhone físico** al elegir a Douge.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/
- Rollback: `git revert <commit [D-6]>` en `feat-3d` y push (base previa: `7cb551a`).

## 2026-11-26 · D-7: botones táctiles y paneles respetan `safe-area-inset-*` (isla del iPhone en horizontal) (hecho por Gemini)
- Qué cambió: `3d/css/game.css` (`#stick-zone`, `#joystick`, `#actions` con margen explícito sobre `var(--safe-l)`/`var(--safe-r)`/`var(--safe-b)` en horizontal, `#act-jump`/`#act-dodge` a `74×74` para que `ESQUIVE` respire, y `calc(8px + var(--safe-l/r))` en `#arena-ui .piu` y `#arena-ui .cepi-btns`), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node tools/stamp_versions.mjs`, `npm test` 96/97 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); verificado en Chrome headless en `932×430` (simulando isla de 59 px en `--safe-r`/`--safe-l` y 21 px en `--safe-b`) y `430×932`: 👊 / SALTO / ESQUIVE y joystick quedan dentro de la zona segura (`right <= 932 - 59 - 18`, `0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max en horizontal (ambas orientaciones de la Dynamic Island).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu
- Rollback: `git revert <commit [D-7]>` en `feat-3d` y push (base previa: `eb2750c`).

## 2026-11-26 · D-8: pulido chico (HUD ≥ 13 px, «Tocá para empezar» arriba de carriles, audio limpio + `onstatechange`, FR faltantes) (hecho por Gemini)
- Qué cambió: `3d/css/game.css` (subidos a ≥ 13 px `#hud-power-text`, `#hud-name`, `.chaky-lives`, `#hud-hearts`, `#boss-bar` y `.phase-card.p2` en baile; movido `#arena-ui .chaky-intro .skip` por encima de `--deck-height` para que no pise el carril central en horizontal), `3d/js/audio.js` (eliminado código muerto `MUSIC_GAIN`, `themes = {}` y `warp()`; agregado `ac.onstatechange` para reanudar música tras alarma/Siri en iOS; preservado `audioSession='playback'` sin cambios), `3d/js/i18n.js` (agregados `⚡ ¡TURBO! +{n}`, `¡Vení!`, `¡Dale!`, `¡Jaja!`), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/audio.js 3d/js/i18n.js`, `node tools/stamp_versions.mjs`, `npm test` 96/97 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max (incluyendo alarma/Siri con el juego abierto).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=chaky
- Rollback: `git revert <commit [D-8]>` en `feat-3d` y push (base previa: `cf71f8b`).

## 2026-11-26 · H-5: voces de jefes con balbuceo sintetizado Web Audio + `duck()` a 0,78 (hecho por Gemini)
- Qué cambió: `3d/js/voice.js` (perfiles de timbre propio para los 5 jefes — Chaky grave/lento, Cepi rápido/nasal, Lale gordito/redondo, Pinky chillón de cancha, Facu canchero — y función pura `bossBabblePlan()`), `3d/js/audio.js` (implementado `audio.bossLine()` con oscilador + formante bandpass + envolvente respetando silencio, exportado `MUSIC_VOL = 0.78` y corregido `duck()` para devolver la música a `0.78` en lugar de `1`), `tests/voice.test.mjs`, `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/voice.js 3d/js/audio.js`, `node tools/stamp_versions.mjs`, `npm test` 97/98 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows), incluyendo tests nuevos de timbres distintos para los 5 jefes, silencio en 0 osciladores y retorno de `duck()` a `0.78`. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu (y `chaky`, `cepi`, `lale`, `pinky`)
- Rollback: `git revert <commit [H-5]>` en `feat-3d` y push (base previa: `e8303ed`).

## 2026-11-26 · D-4: música disco propia para el duelo de baile alineada a la negra de cada ronda (hecho por Gemini)
- Qué cambió: `3d/js/music.js` (nuevo tema `disco` sintetizado con four-on-the-floor, bajo en octavas, hi-hat en contratiempo y sinte cuya negra = `ctx.beat`: 0,58 / 0,52 / 0,46 s), `3d/js/audio.js` (agregados `setBeat(secs)` y `alignBeat(delaySec)` para clavar el tiempo 1 con la primera flecha ±5 ms), `3d/js/arena.js` (usa `'disco'` en lugar de `'byd'` y realinea cada ronda con `d.notes[0].time - d.t`), `tests/music.test.mjs`, `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/music.js 3d/js/audio.js 3d/js/arena.js`, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max (percepción rítmica real con parlante/auriculares).
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=chaky-baile
- Rollback: `git revert <commit [D-4]>` en `feat-3d` y push (base previa: `2b656aa`).

## 2026-11-26 · D-5: música sintetizada distinta para cada jefe (Cepi, Lale, Pinky, Facu) (hecho por Gemini)
- Qué cambió: `3d/js/music.js` (4 temas nuevos: `bossCepi` rock de pádel en Mi menor, `bossLale` vals musette 3/4 rápido en Re menor, `bossPinky` cumbia de cancha en Sol menor, `bossFacu` jazz de galería con swing/contrabajo), `3d/js/main.js` (`spawnBoss` → `disco`, `spawnCepi` → `bossCepi`, `spawnLale` → `bossLale`, `spawnPinky` → `bossPinky`, `spawnFacu` → `bossFacu`), `tests/music.test.mjs` (valida los 13 temas), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/music.js 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=cepi (y `lale`, `pinky`, `facu`)
- Rollback: `git revert <commit [D-5]>` en `feat-3d` y push (base previa: `e5cabf1`).

## 2026-11-26 · R-2: auditoría y test E2E de fugas de memoria WebGL al salir de arenas (hecho por Gemini)
- Qué cambió: `3d/js/main.js` (expuesto `game.memory()` leyendo `renderer.info.memory`), `tests/e2e/leaks.e2e.mjs` (recorre `chaky`, `cepi`, `lale`, `pinky`, `facu`, `chase`, `byd` y las 5 cinemáticas de `cine.js`, renderiza cuadros en GPU, llama a `dispose()` y valida que geometrías y texturas vuelvan a ≤ 110 %), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows), `node tests/e2e/leaks.e2e.mjs` OK: las 7 escenas y `cine.js` liberan el 100 % de sus recursos propios (`geo 12 → 12`, `tex 31 → 31`, ratio `1.000`, `leaks: []`, `0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu&debug=1
- Rollback: `git revert <commit [R-2]>` en `feat-3d` y push (base previa: `22e489e`).

## 2026-11-26 · R-3: eliminación de asignaciones por cuadro en bucles de juego y arenas (hecho por Gemini)
- Qué cambió: reutilización de temporales (`Vector3`, `Color`, `Set`, arrays `lay`/`_boxes`/`_placed` y objeto `_blendOut`) en `3d/js/fx.js`, `3d/js/pop_layout.js`, `3d/js/chase.js`, `3d/js/arena.js`, `3d/js/arena_cepi.js`, `3d/js/arena_lale.js`, `3d/js/arena_pinky.js`, `3d/js/arena_facu.js`, `3d/js/enemies.js`, `3d/js/poses.js`, `3d/js/sprites.js` y `3d/js/main.js` (`updateOffscreen` sin `.filter()`), más `3d/index.html` y `docs/PLAN_TRABAJO.md`. Sin cambios de comportamiento.
- Verificación: `node --check` en los 12 JS modificados, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); en Chrome headless (`plaza`, 15 cuadros): `logicMs = 0,82 ms` por cuadro (`0` errores). En `tests/e2e/perf.e2e.mjs` con `CPU ×4` sobre WebGL por software (SwiftShader), solo rinde 12 cuadros en 20 s (`logicMs 8,98 ms` incluyendo el pico de spawn inicial). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=calle&debug=1
- Rollback: `git revert <commit [R-3]>` en `feat-3d` y push (base previa: `7900619`).

## 2026-11-26 · R-4: hojas de sprites > 2048 px reacomodadas en 2 filas (≤ 2048 px) (hecho por Gemini)
- Qué cambió: nuevo script `tools/repack_sheets.py` que recorta y reacomoda los mismos cuadros sin regenerar arte: `douge_walk_sheet` (`3000×512` → `1500×1024`, 5×2), `cepi_actions_sheet` (`2400×512` → `1200×1024`, 2×2), `pinky_walk_sheet` (`2268×512` → `1134×1024`, 3×2) y `chaky_walk_sheet` (`2064×512` → `1032×1024`, 3×2), actualizando `3d/assets/manifest.json` (`w`, `h`, `cols`, `rows`, `v`). Adaptados los lectores multi-fila en `3d/js/bonus.js`, `3d/js/arena_pinky.js` y `3d/js/arena_cepi.js` (`3d/js/sprites.js` y `3d/js/poses.js` ya soportaban `rows > 1`). Agregada aserción `w <= 2048` en `tests/assets.test.mjs` y estabilizado `tests/e2e/hero_walk.e2e.mjs` con `waitForFunction`. Actualizados `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check`, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows; total `3d/assets/` = **8,79 MB < 10 MB**, todos los sprites `≤ 2048 px`), `node tests/e2e/hero_walk.e2e.mjs` OK (Douge 5×2 y Marine), y verificación E2E en Chrome headless de `bonus.js` (`cepi_actions_sheet` 2×2) y `arena_pinky.js` (`pinky_walk_sheet` 3×2) con `0` errores. Qué NO se pudo probar: `tests/check_sprites.py` (requiere `scipy` que no está instalado en este entorno) y Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=calle&debug=1 (y `?probar=byd`, `?probar=pinky`)
- Rollback: `git revert <commit [R-4]>` en `feat-3d` y push (base previa: `fbd1d9d`).

## 2026-11-26 · R-5: descarga de texturas exclusivas del acto anterior en transiciones (hecho por Gemini)
- Qué cambió: agregado `assets.unload(prefixes)` en `3d/js/assets.js` con lista blanca segura (`UNLOADABLE`: solo `arena_chaky_*`, `arena_cepi_*`, `arena_lale_*`, `arena_pinky_*`, `arena_facu_*`, `arena_fondo`, `arena_aeropuerto_fondo`, `douge_dance_sheet`, `marine_dance_sheet` y `chase_*`; nunca descarga héroes, Margot, calle, UI ni las hojas de `CREW` necesarias para la foto final). Conectado en `3d/js/main.js` al pasar a persecución (`startChaseRun`), Cepi (`spawnCepi`), Acto 3 (`enterAct3Street`), Acto 4 (`enterAct4Street`), Facu (`spawnFacu`) y rescate final (`onBossDown`). Actualizados `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/assets.js 3d/js/main.js`, `node tools/stamp_versions.mjs`, `npm test` 98/99 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); en Chrome headless (`?probar=calle&debug=1`): tras Chaky `textures 8 → 0` (`10` descargadas), tras Chase `textures 27 → 14` (`20` descargadas), núcleo protegido intacto (`protectedUnloaded: 0`), y re-entrar a Chaky recarga limpio vía `ensure()` con `0` errores. Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=calle&debug=1
- Rollback: `git revert <commit [R-5]>` en `feat-3d` y push (base previa: `af85d7e`).

## 2026-11-26 · H-6: continuidad de los 5 actos, Margot en `post_pinky` y terminal de Ezeiza al fin del Acto 1 (hecho por Gemini)
- Qué cambió: `3d/js/cine.js` (agregado el cochecito de Margot en `postPinky` junto a Pinky y luego acompañando a Facu rumbo a HENRIS con `margotGag` feliz, garantizando que Margot aparezca en pantalla en los 8 traspasos), `3d/js/world.js` (construida fachada procedural `ezeizaTerminal` «✈ EZEIZA · HANGAR VIP» en `LE_CONCEPT_X` visible durante el juego del Acto 1 mientras `leConcept` se muestra solo en la intro vía `setIntroMode(true)`), `tests/campaign-continuity.test.mjs` (nuevo test `[H-6]` que valida orden de las 8 mini-escenas, Margot en todos los traspasos, checkpoint `facu`, `CREW` con los 5 jefes incluidos Chaky y Facu, y cambio Le Concept ↔ Ezeiza), `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: `node --check 3d/js/cine.js 3d/js/world.js`, `node tools/stamp_versions.mjs`, `npm test` 99/100 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows); E2E en Chrome headless recorriendo las 8 mini-escenas en orden, `setIntroMode(true/false)`, `resumeAt({ id: 'facu' })` → `arena-facu`, y `onBossDown()` con `CREW = [pinky, lale, cepi, chaky, facu]` (`0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=calle (y `?probar=final`)
- Rollback: `git revert <commit [H-6]>` en `feat-3d` y push (base previa: `091c043`).

## 2026-11-26 · A-7: auditoría visual (`margoush-visual`) y pulido seguro de las 5 arenas en 430×932 y 932×430 (hecho por Gemini)
- **Auditoría visual de las 5 arenas (10 capturas en `430×932` y `932×430`) — hallazgos resueltos sin cambiar historia ni diseño de peleas:**
  1. **Cepi (`3d/js/arena_cepi.js`)**: Lale en las gradas quedaba cortada al borde derecho en vertical (`430×932`) y parada sobre un cubo marrón plano (`#6b4a2e`). Corregido: corrida hacia adentro (`LS_X = xMax + 1.45`), agrandada (`3.0 → 3.45`) y montada sobre una grada escalonada de madera de dos niveles con borde superior.
  2. **Big Chaky (`3d/js/arena.js`)**: Margot en su cochecito arrancaba en `cell 2` (llorando) en intro/derrota. Corregido a `cell 1` (despierta con chupete, sin llorar) y `cell 3` (festejando en Modo Disco / KO), respetando la regla de que Margot nunca llora.
  3. **Lale y Facu en horizontal (`3d/js/arena_lale.js`, `3d/js/arena_facu.js`)**: los pisos de baldosas y parquet (`width = 34`) dejaban triángulos oscuros en los bordes laterales de `932×430`. Ensanchados a `64` con `repeat` proporcional (`19×8` y `11×6`) para cubrir de borde a borde.
  4. **Botón `ESQUIVE` (`3d/css/game.css`)**: el texto tocaba los bordes del círculo (`74×74`). Ajustado a `76×76` con `font-size: 11px; letter-spacing: 0` en `#act-dodge small` (respira bien también en francés `ESQUIVER`).
  5. **Tarjeta `.phase-card` en horizontal (`3d/css/game.css`)**: en `932×430` tapaba a Pinky/Facu y transparentaba el texto flotante de atrás. Compactada en `@media (orientation: landscape) and (max-height: 500px)` con fondo opaco `rgba(20, 12, 42, 0.96)` y `z-index: 6`.
- **Pendiente para Facu / Claude (arte nuevo o retoque de sprites existentes, fuera de A-7):**
  - `arena_pinky_idle` / `arena_pinky_reveal`: tiene un par de huequitos semitransparentes en los pantalones oscuros del recorte croma original (P2 para `margoush-art`).
  - Tareas opcionales de arte nuevo: **A-2** (poses `power` y `defeat` de espaldas para Douge y Marine), **A-3** (`arena_lale_windup` y aturdido dedicado de Pinky) y **A-4** (3 poses gag de Margot: chupete, papilla, crayones).
- Verificación: `node --check`, `node tools/stamp_versions.mjs`, `npm test` 99/100 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows) e inspección visual de capturas antes/después en `430×932` y `932×430` (`0` errores). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=cepi (y `chaky-baile`, `lale`, `pinky`, `facu`)
- Rollback: `git revert <commit [A-7]>` en `feat-3d` y push (base previa: `62af99f`).

## 2026-11-26 · A-2: poses de poder y derrota de espaldas para Douge y Marine (hecho por Gemini)
- Qué cambió: generadas en Gemini web desde las referencias oficiales, recortadas sin halos (verde `#00FF00` para Douge/Marine KO y magenta `#FF00FF` para la hiedra de Marine) e integradas en `3d/assets/` y `3d/assets/manifest.json`: `arena_douge_back_power.webp` (`hk: 1.04`), `arena_douge_back_ko.webp` (`hk: 0.74`), `arena_marine_back_power.webp` (`hk: 1.68` para que las ramas de hiedra sobresalgan manteniendo la altura real de Marine) y `arena_marine_back_ko.webp` (`hk: 0.74`). Conectadas en `3d/js/arena_cepi.js`, `3d/js/arena_lale.js`, `3d/js/arena_pinky.js` y `3d/js/arena_facu.js` (poder con `powT > 0` y derrota con `phase === 'down'`). Actualizados `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: inspección visual en plancha de recorte (`a2_a3_sheet.png`, cero halos ni huecos), `node --check`, `node tools/stamp_versions.mjs`, `npm test` 99/100 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows; peso total de `3d/assets/` < 10 MB). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=facu (y `cepi`, `lale`, `pinky`)
- Rollback: `git revert <commit [A-2]>` en `feat-3d` y push (base previa: `388d9f3`).

## 2026-11-26 · A-3: poses de anticipación (`windup`) de Lale y Cepi + aturdido con papilla de Pinky (hecho por Gemini)
- Qué cambió: generadas en Gemini web desde las referencias oficiales, recortadas sin halos sobre croma `#00FF00` e integradas en `3d/assets/` y `3d/assets/manifest.json`: `arena_lale_windup.webp` (`hk: 1.04`, levantando barra de manteca), `arena_cepi_windup.webp` (`hk: 1.05`, cargando remate de pádel) y `arena_pinky_stun.webp` (ciego con papilla de zapallo en los anteojos). Conectadas en `3d/js/arena_lale.js`, `3d/js/arena_cepi.js`, `3d/js/arena_pinky.js` y `3d/js/margot_finish.js` (oculta la plasta 2D plana cuando Pinky ya usa su sprite 3D `arena_pinky_stun`). Actualizados `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: inspección visual en plancha de recorte (`a2_a3_sheet.png`, cero halos ni huecos), `node --check`, `node tools/stamp_versions.mjs`, `npm test` 99/100 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows; peso total de `3d/assets/` < 10 MB). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=pinky-margot (y `?probar=lale`, `?probar=cepi`)
- Rollback: `git revert <commit [A-3]>` en `feat-3d` y push (base previa: `36346e8`).

## 2026-11-26 · A-4: 3 poses gag de Margot feliz (chupete, papilla, crayones) y cero llanto en `bonus.js` (hecho por Gemini)
- Qué cambió: generadas en Gemini web desde `arena_margot_cheer`, recortadas sobre croma `#00FF00` sin halos e integradas en `3d/assets/` y `3d/assets/manifest.json`: `arena_margot_pacifier.webp` (chupete en mano, riéndose), `arena_margot_papilla.webp` (platito rosa de papilla de zapallo con cucharita, riéndose) y `arena_margot_crayons.webp` (crayones de colores en mano, riéndose). Conectadas en `3d/js/margot_finish.js` (cambia dinámicamente a `arena_margot_papilla` en Pinky y `arena_margot_crayons` en Facu durante el remate), `3d/js/cine.js` (`margotGag` usa `arena_margot_pacifier`), `3d/js/assets.js` (`arena_margot_pacifier` precargada para todas las cinemáticas) y `3d/js/bonus.js` (quitado uso residual de celda `2` llanto). Actualizados `3d/index.html` y `docs/PLAN_TRABAJO.md`.
- Verificación: inspección visual en plancha de recorte (`a4_margot_sheet.png`, cero halos ni huecos), `node --check`, `node tools/stamp_versions.mjs`, `npm test` 99/100 en verde (0 fallos, 1 omitido por `-I` sin `numpy` en Windows; peso total de `3d/assets/` < 10 MB). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- Prueba: https://facundocapello-blip.github.io/margoush-party/3d/?probar=pinky-margot (y `?probar=facu-enojado`, `?probar=calle`)
- Rollback: `git revert <commit [A-4]>` en `feat-3d` y push (base previa: `c474fbd`).

## 2026-11-26 · Auditoría QA + Fases 1 y 2 de Jugabilidad (hecho por Antigravity)
- **Fase 1 (fixes críticos P0 de jugabilidad):**
  - `3d/js/enemies.js` (`mozo`): eliminado uso accidental del global `origin` (`window.origin`) al lanzar croissants en Francia, que producía coordenadas `NaN` (proyectiles invisibles que igual hacían daño).
  - `3d/js/arena_pinky.js` y `3d/js/arena_facu.js`: corregido `sfx('honk')` inexistente → `sfx('horn')` en los autos de Pinky y `sfx('whoosh')` en los cuadros de Facu.
  - `3d/js/chase.js`: la persecución del BYD ahora permite perder (`hero.hp = Math.max(0, hero.hp - 1)` → reintento en checkpoint `acto2`) y se eliminó el aviso falso `⚡ ¡PODER LISTO!` ya que el poder está deshabilitado durante la persecución.
- **Fase 2 (progresión, pausa limpia y GPU en trampas):**
  - `3d/js/score.js` y `tests/score.test.mjs`: recalibrados los cortes `RANKS` (`S: 27800, A: 21550, B: 13900`) para la campaña completa de 5 actos (~34.740 pts en recorrido impecable).
  - `3d/js/arena_cepi.js`, `3d/js/arena_lale.js`, `3d/js/arena_pinky.js`, `3d/js/arena_facu.js`: reemplazados los `setTimeout` de intros y remates por una cola `after(secs, fn)` ligada al `dt` de cada arena para respetar la pausa.
  - `3d/js/traps.js`: liberadas geometrías y materiales de `trottinette` y `boletas` en `finish(a)`.
- **Verificación:** `node --check` sin errores en los 8 JS editados, `node tools/stamp_versions.mjs`, `npm test` **100/101 en verde** (0 fallos, 1 omitido: `check_sprites.py` por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- **Prueba:** `https://facundocapello-blip.github.io/margoush-party/3d/?probar=francia` (y `persecucion`, `pinky`, `facu`).
- **Rollback:** `git revert <hash de este commit>` en `feat-3d` (base previa: `22a53b0`).

## 2026-11-26 · Fases 3 y 4: Game Feel + Gráficos y coherencia visual (hecho por Antigravity)
- **Fase 3 (Game Feel y accesibilidad):**
  - Nuevo `3d/js/feedback.js`: sacudida de cámara por `trauma²` con senos sumados (sin `Math.random()`), decaimiento durante *hit-stop* y soporte de `prefers-reduced-motion` + botón `✨ Efectos: normales / suaves` en Pausa (`3d/index.html`, `3d/js/main.js`, `3d/js/i18n.js`).
  - Conectado en `3d/js/fx.js` (además de clonar `sparkMat` por partícula para evitar parpadeos de opacidad), `3d/js/arena.js` (quitado flash de pantalla completa en cada flecha `bossHit`), `3d/js/arena_cepi.js`, `3d/js/arena_lale.js`, `3d/js/arena_pinky.js`, `3d/js/arena_facu.js` (eliminado `sfx('hit')` y `shake` duplicado en `bossHit`) y `3d/js/bonus.js` (agregado *hit-stop* en punto brillante `×3` y `wreck`).
- **Fase 4 (Gráficos y coherencia visual):**
  - `3d/js/cover.js` y `3d/js/i18n.js`: corregido `Margoth` → `Margot` en la portada principal y frases; agregadas traducciones `Facu (Final)`, `🎨 ¡A HENRIS!` y `✨ Efectos: ...`.
  - `3d/js/powers.js`: disco de suelo de Marine «Hiedra» pasado de naranja fuego (`0xff6a1a`) a verde botánico (`0x28c76f`) con `sfx('whoosh')`.
  - `3d/js/arena_facu.js`: quitados los billetes rectangulares (`isBill = false`) y el signo `$` en `-$100` (remanentes de Pinky).
  - `3d/js/arena_pinky.js`: ensanchado el piso de `34` a `64` (`repeat(15, 8)`) para eliminar triángulos oscuros en horizontal.
  - `3d/js/story.js`: Margot inicia el rescate `awake` (celda 1) en lugar de `crying` (celda 2).
- **Verificación:** `node --check` en todos los JS editados, `node tools/stamp_versions.mjs`, `npm test` **103/104 en verde** (`0` fallos, `1` omitido: `check_sprites.py` por `-I` sin `numpy` en Windows). Qué NO se pudo probar: Safari físico en iPhone 15 Pro Max.
- **Prueba:** `https://facundocapello-blip.github.io/margoush-party/3d/` (y `?probar=byd`, `?probar=pinky`, `?probar=facu`).
- **Rollback:** `git revert <hash de este commit>` en `feat-3d` (base previa: `02256cb`).

## 2026-11-27 · Módulo reutilizable de efectos multicapa (4 capas tipo Effekseer CC-0) + FX Lab + Exportador de Sprite Sheets RGBA (hecho por Antigravity)
- **Qué cambió:**
  - `3d/js/skill_fx.js` y `3d/js/skill_fx_presets.js`: motor y reproductor reutilizable en 4 capas explícitas inspiradas en la superposición de nodos de **Effekseer** y su galería CC-0 (`1. core` núcleo brillante estelar aditivo + `2. trail` cinta *Ribbon* teselada con caída alfa + `3. shockwave` anillo *Ring* con doble curva *easing* + `4. sparks` chispas estiradas por velocidad y fragmentos giratorios), adaptado a Canvas 2D / minijuego y con puente opcional `createThreeSkillBurst` para escenas 2.5D Three.js r128.
  - Cambio declarativo en 1 clic mediante JSON (`applySkillPatch`, `setPalette`, `setSize` y `3d/fx-presets.json`) con 7 paletas y 5 escalas (`XS`–`XL`), además de 6 arquetipos listos (*Corte Astral CC-0*, *Douge*, *Marine*, *Cepi*, *Lale* y *Margot*).
  - Exportación automática de hojas de sprites con fondo 100 % transparente RGBA (`bakeSpriteSheet` + `SpriteSheetPlayer` + `tools/export_skill_sheet.mjs` sin dependencias externas), respetando el límite de `≤ 2048 px` de Safari iOS y generando la entrada lista para `manifest.json`.
  - Banco interactivo local y web en `3d/fx-studio.html` + `3d/css/fx_studio.css` (`ES`/`FR`, conmutadores por capa y `SOLO`, descarga PNG/WebP transparente y verificador en vivo del PNG exportado). En este commit (`517a699`) la campaña no cambia; los dos commits siguientes sí la tocan (ver abajo).
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` **108/109 en verde** (incluyendo 5 pruebas nuevas en `tests/skill_fx.test.mjs`, `0` fallos, `1` omitido por Python `-I` sin `numpy`) y exportación CLI verificada en `dist/fx-preview/` (`cornerAlpha = 0`, 16 cuadros RGBA sin recortes). Pendiente: prueba táctil en Safari físico (iPhone 15 Pro Max).
- **Prueba:** `https://facundocapello-blip.github.io/margoush-party/3d/fx-studio.html`.
- **Rollback:** `git revert <commit>` (base previa en `main`: `4267330`).

## 2026-11-27/28 · FX integrados en la campaña (`5473a16` + `52d502e`) — registro completado en la revisión del 28/11
- **Qué cambió en la campaña** (no quedó registrado en su momento):
  - `fx.js`: pool de skill FX en la calle (remate con `effekseer_astral_slash`); `sparkTex` en sRGB.
  - `powers.js` y las 4 arenas (`arena_cepi/lale/pinky/facu.js`): burst al usar el poder, golpes dorados, `ko` y cambio de fase; `burst` con materiales cacheados.
  - `skill_fx_three.js`: `NormalBlending` + `depthTest:false` (antes `AdditiveBlending`), por fidelidad de color sobre fondos claros.
  - Hit-stop de 0,085 s al usar el poder en las 4 arenas (cambio de timing aceptado; el spec decía no tocarlos).
  - `game.css`: barra del jefe a 84 px en arenas horizontales, `#debug-hud` abajo a la izquierda, barra de poder más ancha, y la postal BA→París usa `arena_lale_fondo` porque `chase_paris_fondo.webp` no existe.
- **Revisión 28/11** (código + capturas Chromium 430×932 y 932×430 en cepi, lale, pinky y facu): el poder se dispara sin errores, el burst dura ~250 ms, tapa al héroe un instante y no al jefe. Pendientes en `claude/margoush_revision_fx_20261128.md` del Proyecto (caché de sheets compartido, duplicación en arenas, `facing`, movimiento reducido, E2E de skill FX).
- **Rollback de los FX en la campaña:** `git revert 52d502e 5473a16` (base: `c8d57eb`).

## 2026-11-28 · Botones táctiles nuevos + textos debajo del cartel de fase
- **Qué cambió:**
  - `game.css`: botones de acción rediseñados. El golpe pasa a ser macizo naranja-rojo con aro crema (se lee sobre la cancha azul, la alfombra roja y el piso claro). Salto y esquive pasan a ser oscuros como el HUD, con borde e ícono menta / celeste. El aviso de poder listo late en dorado sobre el botón nuevo.
  - `pop_layout.js`: mientras el cartel de fase está a la vista, los textos flotantes se ubican debajo de él (en Pinky horizontal la frase del jefe quedaba cortada detrás del cartel).
- **Verificación:** `node tools/stamp_versions.mjs`, `npm test` 115/115, capturas Chromium en 430×932 (cepi, lale, facu, pinky) y 932×430 (pinky), sin errores de consola. No es Safari físico.
- **Prueba:** `https://facundocapello-blip.github.io/margoush-party/3d/?probar=pinky` (y `cepi`, `lale`, `facu`).
- **Rollback:** `git revert <hash de este commit>` en `feat-3d` (base previa: `52d502e`).

## 2026-11-28 · P1 de la revisión de FX (calidad y rendimiento)
- **Qué cambió (un commit por ítem, `309c467..5df70d1`):**
  1. `skill_fx_three.js`: horneado cacheado a nivel de módulo y textura compartida entre pools vivos con conteo de referencias (la libera el último pool, R-2 intacto). `preload()` ahora es diferido (un preset por `update()`; `play()` hornea al instante si aún no tocó; `flushPreload()` para forzarlo).
  2. Nuevo `arena_fx.js` (ids de preset `FX`, `heroPowerFx`, `createBurst`, `stepSparks`, `facingToward`, `bossFrontFx`) usado por Cepi, Lale, Pinky y Facu. Vive aparte de `arena.js` (Chaky) para no acoplar las otras arenas a ese módulo.
  3. `facing` desde `hero.js` → `powers.js` y desde las arenas (poder hacia el jefe); en `ko` y cambio de fase el FX delante del jefe sale al 70 % de tamaño y 50 % de opacidad; `prefers-reduced-motion`/botón «Efectos: suaves» aplican la misma versión suave a todos los FX (calle y arenas).
  4. Nuevo `tests/e2e/skill_fx.e2e.mjs` (calle + 4 arenas reales: el burst sale, se ve, desaparece solo; el pool no suma mallas) y pool de FX en `leaks.e2e.mjs` (4 presets subidos a GPU; al salir 0 texturas y 0 activos; probado en rojo rompiendo `dispose`). Las arenas exponen `skillFx` solo lectura.
  5. `game.css`: texto de la barra «PODER» con contorno oscuro; era ilegible entre ~30 % y ~70 % de carga.
- **Verificación:** `node tools/stamp_versions.mjs`, `npm test` 122/122, e2e OK: `leaks`, `skill_fx`, `attackfx`, `cepi_pinky`, `facu_galerista`, `etapa_d`. Capturas Chromium en 430×932 y 932×430 (poder y KO en las 4 arenas; barra PODER a 0/30/50/70/100 %), sin errores de consola. No es Safari físico.
- **Ya fallaban antes (probado sobre `2f70f91`, no son de este cambio):** `combat.e2e` («romper los cajones abre el pasaje»), `ui.e2e` y `layout.e2e` (esperan el estado `chase`, timeout).
- **Pendiente:** P2 del doc (dispose del pool de la calle, partir `skill_fx.js`, renombrar `_lx…_cy`/`made`) y prueba física en Safari iPhone (botones nuevos, FX, barra PODER, precarga diferida).
- **Rollback:** `git revert 309c467^..5df70d1` en `feat-3d` (base previa: `2f70f91`).

## 2026-11-28 · P2 de la revisión de FX (orden interno y e2e viejos)
- **Qué cambió (sin cambios de comportamiento del juego):**
  - **6.** `fx.js`: comentario que explica que el pool de la calle no tiene `dispose()` a propósito (`createFx` se llama una vez al arrancar y vive toda la sesión; entre escenas solo `clear()`). `leaks.e2e` confirma que no pierde nada.
  - **7.** `skill_fx.js` (1104 líneas) partido en `skill_fx_engine.js` (compilar + render por capas, 727), `skill_fx_bake.js` (hoja de sprites, 162) y `skill_fx_player.js` (reproductor, `SkillFxSystem`, puente Three.js, 225). `skill_fx.js` queda como fachada con exactamente la misma API pública (17 exports); sigue siendo el único punto de importación para el juego, `fx-studio.html` y las pruebas. `stamp_versions` ya sella los 3 módulos nuevos en el import map.
  - **8.** Renombres: `_lx/_ly/_rx/_ry/_cx/_cy` → `_ribbonLeftX/…/_ribbonCenterY` en el motor; `made` → `playsByPreset` solo en el pool de `skill_fx_three.js` (`fx.made` y `powers.made` son otros contadores y no se tocaron). Pruebas actualizadas.
  - **10.** Los 3 e2e que ya fallaban eran pruebas desactualizadas, no bugs del juego:
    - `ui` y `layout`: esperaban `chase` tras la intro, pero la intro ahora desemboca en la calle (la persecución es del Acto 2). Se quitó esa espera; `ui` ahora juega 25 s en la calle y cierra con `finish(true)` (la campaña completa la cubren `etapa_d` y las pruebas de historia).
    - `combat`: el pasaje secreto (x=230) queda pasado el x=206 donde salta Lale, así que solo se llega tras vencerlo (`laleDone`); y la vereda trae solo bombos (aturden, no restan vida), así que el chequeo de daño usa la avenida (hay patovica).
- **Verificación:** `node tools/stamp_versions.mjs`, `npm test` 122/122; e2e OK: `skill_fx` (18 checks; una corrida suelta falló en Cepi y no se repitió en 4 corridas más, ya estaba pasando en la base), `leaks`, `combat`, `ui`, `layout`. Chromium, no Safari físico.
- **Pendiente:** ítem 9, prueba física en Safari iPhone (botones nuevos, FX, barra PODER, precarga diferida). Posible flakiness de `skill_fx.e2e` en Cepi (el `L` justo después del cartel).
- **Rollback:** `git revert 08d4716^..HEAD` en `feat-3d` (base previa: `08defea`).

## 2026-11-28 · P3 auditoría (pulido), parte 1 (hecho por Claude)
- Textos de 11 px en el HUD pasan a 12 px (`game.css`: `#act-dodge small` y `.phase-card small`).
- «Textos sin traducir» (`chase.js`, `enemies.js`): ya estaban en `i18n.js` y pasan por `fillText`; no había nada que hacer.
- Verificación: npm test 122/122. Solo Chromium; no se probó en Safari físico.
- Pendientes del P3: `.pop` en vertical, «Tocá para empezar» en horizontal, mute en el menú, `onstatechange` de audio, código muerto de audio, poses de héroes, hojas > 2048 px.
- Rollback: `git revert <hash de este commit>` en feat-3d y push.

## 2026-11-28 · Pulido del intro de jefes en vertical (hecho por Claude)
- `game.css`: en vertical el intro de Cepi, Lale y Pinky baja por debajo del HUD y de la barra del jefe (antes el nombre pisaba «¡PODER LISTO!»), y «Tocá para empezar» sube por encima de los botones táctiles y se lee más (blanco con sombra).
- Verificación: npm test 122/122; capturas Chromium 430×932 de `?probar=cepi` antes/después. No se probó en Safari físico ni en horizontal (no se tocó).
- Rollback: `git revert <hash de este commit>` en feat-3d y push.

## 2026-11-28 · Arte: reparación de agujeros en poses de Cepi, Lale y Pinky (hecho por Claude)
- Defecto: el recorte del fondo verde dejó transparente parte de la ropa oscura (camisa/pantalón negros), y se veía el fondo a través de las piernas y el torso, sobre todo en Cepi golpeado/aturdido, Lale (tiro, golpeado, patín, KO) y Pinky (saludo, KO).
- Arreglo: nuevo `tools/fix_alpha_holes.py` rellena los huecos interiores y los píxeles oscuros mal borrados; se aplicó a todas las `arena_cepi_*`, `arena_lale_*` (salvo `floured` y `fondo`) y `arena_pinky_*`. Mismas dimensiones, `manifest.json` sin cambios; `3d/assets` pasa de 9,15 a 9,30 MB (tope 10 MB).
- Límite: en `arena_lale_throw` queda un hueco grande en la pierna derecha (el recorte original borró casi toda esa pierna); conviene regenerar esa pose en Gemini. No se tocaron los héroes ni Facu.
- Verificación: npm test 122/122; capturas Chromium 430×932 de `?probar=lale`, `cepi`, `pinky`. No se probó en Safari físico.
- Rollback: `git revert <hash de este commit>` en feat-3d y push.

## 2026-11-28 · P3 auditoría (pulido), parte 2: mute en la portada (hecho por Claude)
- Antes el silencio solo estaba en el HUD de juego y la portada no tenía forma de apagar el sonido. Botón nuevo `#btn-mute-menu` en la portada A (`cover.js`, `game.css`): arriba a la izquierda en vertical y junto al selector de idioma en horizontal. Comparte estado (`audio.toggleMute`, `localStorage`) con el del HUD y ambos muestran el mismo ícono. En la portada vieja (`?portada=vieja`) no está.
- Revisado en el código y ya resuelto antes, sin cambios: `onstatechange` del AudioContext (`audio.js` ~148), `.pop` acotado al ancho de pantalla (`pop_layout.js`, `max-width` en `.pop`), «Tocá para empezar» de Chaky sobre la cubierta de botones (`game.css` ~860), código muerto de audio (`bossBabblePlan` y `MUSIC_VOL` se usan).
- Siguen pendientes del P3: poses de héroes (golpe de poder y 2.º golpe) y hojas > 2048 px (a medir en iPhone). Además, la pose `arena_lale_throw` necesita regenerarse en Gemini (hueco en la pierna). `tests/e2e/cover.e2e.mjs` falla desde antes en la línea 39 (espera `chase` tras la intro; ahora va a la calle).
- Verificación: npm test 122/122; capturas Chromium 390×844 y 844×390 sin errores de consola; el toque silencia y cambia el ícono en ambos botones. No se probó en Safari físico.
- Rollback: `git revert <hash de este commit>` en feat-3d y push.

## 2026-11-28 · Auditoría Sakurai de la calle, P0: hit-stop, pose en el impacto y sacudida visible
- **Qué cambió** (solo la calle; las arenas no cambian):
  - **Hit-stop escalado** (`feedback.js` `HITSTOP`, usado en `hero.js`): golpe 1 = 4F, golpe 2 = 5F, remate = 9F (antes 2F/2F/5F); +1F por malo extra (tope +2F), +3F si hay KO, 16F si cae el último malo, 3F al pegarle a un prop. Ahora también se congela al recibir un golpe (5F) y al caer el héroe (20F + flash blanco 0,4 + sacudida grande).
  - **Pose máxima en el cuadro del impacto**: el atacante entra a `offsetX` 0,30 / `stretch` 0,08 / `lean` −0,14 (remate 0,40 / 0,10 / −0,20) desde el primer cuadro, sin subir en 5F. El malo queda ladeado (`lean` 0,25 / `offsetX` −0,12; remate 0,45 / −0,20) y se endereza durante el `hitstun`. `SpriteActor.snapHit` (solo héroes y malos de la calle): aplastamiento máximo (0,14) en el cuadro del golpe y sin fundido de 80 ms hacia `hurt`.
  - **Sacudida visible** (`feedback.js` `createHitShake`, solo en `fx.js`): 3 patrones — chica (solo vertical, 0,03 m, 4F), media (X 0,10 / Y 0,06 m, 10F), grande (X 0,20 / Y 0,14 m, 18F). Arranca en el máximo y alterna de signo cada 2F, sin `Math.random()`. Se respeta el modo de efectos suaves.
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` 123/124 (la que falla es `check_sprites.py`: no hay `scipy` en este contenedor; no es del cambio) con 2 pruebas nuevas (`tests/hitstop.test.mjs`, `tests/feedback.test.mjs`). e2e en Chromium: `attackfx` y `combat` OK. `enemies.e2e` ya fallaba antes (`setStage`, mismo error sin estos cambios). No se probó en Safari físico ni se midió la sensación jugando.
- **Pendiente:** P1–P3 de la auditoría (anticipación en el 1.er cuadro, seguimiento sostenido, parpadeo que no esconde `hurt`, flash de KO, contraste oscuro de las marcas, vibración de la víctima). Probar en iPhone.
- **Rollback:** `git revert <hash de este commit>` (base previa: `8688145`).

## 2026-11-28 · Ajuste del P0 Sakurai: lag con varios malos
- **Problema reportado:** «algo de lag» al pelear con varios malos a la vez (iPhone).
- **Causa probable** (leída en el código, no medida): el hit-stop del combo se encadenaba, con 4 a 9F cada 0,26 s, más el de los golpes recibidos, y el juego pasaba cerca de 1/3 del tiempo congelado. Además cada malo golpeado crea ~10 chispas con material propio.
- **Qué cambió:** `hero.js`: si hubo un hit-stop hace menos de 350 ms, el siguiente vale 60 % (mínimo 3F); KO y último malo no se recortan; el congelado por recibir un golpe tampoco se suma a uno reciente. `fx.js`: con más de 36 partículas vivas, `hit()` saca 3 chispas en vez de 5–10.
- **Verificación:** `npm test` 123/124 (falla solo `check_sprites.py`, sin `scipy` en el contenedor), e2e `attackfx` y `combat` OK. No se midió en Safari físico: si sigue con lag, hay que medir con `game.perf`.
- **Rollback:** `git revert <hash de este commit>` en feat-3d (base previa: `60b861f`).

## 2026-11-28 · Regla de doble prueba (Chrome + celu) y e2e `golpe_feel`
- Nueva regla en `AGENTS.md`: antes de entregar, probar como el usuario en Chrome de escritorio y en emulación de iPhone 15 Pro Max (táctil).
- Nuevo `tests/e2e/golpe_feel.e2e.mjs`: pelea con 5 malos a la vez en los dos perfiles; mide cortes de cuadro, captura pantalla y revisa errores. Sin errores de consola en ambos.
- Comparación en las mismas condiciones (SwiftShader, GL por software, ~17 cuadros/s; no es un iPhone): sin P0, con el P0 original y con el ajuste anti-lag dan lo mismo (prom 50–61 ms, cortes >100 ms: 1 en Chrome, 5–6 en celu). El costo de dibujar no cambió con el P0; lo que se sintió como lag son las pausas del juego, que este test no mide. La prueba en Safari físico sigue pendiente.
- Rollback: `git revert <hash de este commit>` (base previa: `a31cc63`).

## 2026-11-28 · Auditoría Sakurai de la calle, P1: anticipación, seguimiento, parpadeo, KO, marcas oscuras y vibración
- **Qué cambió** (solo la calle; las arenas no cambian):
  - **Anticipación en el 1.er cuadro** (`feedback.js` `anticipationK`, usado en `hero.js`): la pose de preparación arranca al 55 % y sube a 100 % hasta el impacto (antes subía desde 0).
  - **Seguimiento sostenido** (`followThrough`): la pose del impacto se mantiene ~40 % del tiempo restante y recién después baja (antes bajaba lineal desde el primer cuadro).
  - **El parpadeo ya no esconde `hurt`**: `SpriteActor.flash(seconds, grace)`; el héroe no parpadea los primeros 0,3 s (lo que dura la pose `hurt`) y los malos golpeados no parpadean (antes se ocultaban ~3F justo tras el hit-stop).
  - **Flash de KO**: destello blanco 0,22 en cada KO y 0,38 si cae el último malo (respeta efectos suaves).
  - **Contraste oscuro de las marcas** (`fx.js` `hit`): aro oscuro detrás del aro blanco/dorado del impacto, para que se vea sobre asfalto y veredas claras.
  - **Vibración de la víctima** (`SpriteActor.vibrate/vibeStep`, `vibeOffset`): el malo golpeado (y el héroe al recibir) vibra solo el dibujo durante el hit-stop, alterna de signo cada 2F y decae; la hitbox no se mueve. Se avanza en `main.js` mientras el juego está congelado.
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` 124/125 (falla solo `check_sprites.py`: no hay `scipy` en el contenedor) con una prueba nueva en `tests/feedback.test.mjs`. e2e en Chromium: `golpe_feel` (Chrome 1280×720 y celu 430×932 táctil, sin errores de consola), `attackfx` y `combat` OK; capturas de impacto en ambos perfiles. Tiempos de cuadro iguales a la base en este contenedor (SwiftShader, ruido de ±15 %). No es Safari físico ni se midió la sensación jugando.
- **Pendiente:** P2–P3 de la auditoría; probar en iPhone.
- **Rollback:** `git revert <hash de este commit>` (base previa: `fba45c8`).

## 2026-11-28 · Auditoría Sakurai de la calle, P2: corte astral, punto de contacto, golpe 2, armadura, fundido y anticipación (hecho por Claude)
- **Qué cambió** (solo la calle; las arenas no cambian):
  1. **Corte astral del remate** (`fx.js` `finisherFx`, hero.js `landSwing`): ahora sale solo si el remate conecta con algo que no sea armadura, en dorado (preset nuevo `effekseer_astral_slash_gold`, misma hoja que el cian), `worldSize` 2,2, opacidad 0,8 y cortado a 20F (`maxSeconds` nuevo en `skill_fx_three.js` `play`). Antes salía siempre, cian, 3,1 m y 40F encima del KO. El cian sigue en las arenas y el FX Lab.
  2. **Marca de impacto en el punto de contacto** (`enemies.js` `damage`): x −0,3 hacia el héroe y z +0,3 hacia la cámara, en vez del centro del malo.
  3. **Golpe 2 distinto del 1** (`fx.js` `hit` con `combo`; `hero.js` pasa `combo` en el área): aro 0,75 contra 0,6 y +2 chispas (10 contra 12).
  4. **Patovica con armadura** (`enemies.js`): si embiste y el golpe es chico, chispas grises sin aro, sonido sordo nuevo `thud` (`audio.js`), no se aplasta ni vibra y el congelado es de 2F como máximo. El daño sigue entrando.
  5. **Sin fundido al entrar al golpe** (`sprites.js` `SNAP_POSE`): `attack*`, `strike` y `hurt` cortan en seco; el fundido de 80 ms queda para caminar, correr y reposo (solo héroes y malos de la calle, `snapHit`).
  6. **Anticipación de los malos** (`enemies.js` `melee`): en el `windup` suman `offsetX −0,12` y `stretch −0,06` al `lean` 0,18; se reinician al soltar el golpe.
- **Verificación:** `node --check`, `node tools/stamp_versions.mjs`, `npm test` 124/125 (falla solo `check_sprites.py`: sin `scipy` en el contenedor, no es del cambio). e2e nuevo `tests/e2e/p2_calle.e2e.mjs` (18 checks, Chrome 1280×720 y celu 430×932 táctil, sin errores de consola); `golpe_feel`, `attackfx`, `combat` y `skill_fx` siguen OK. Es Chromium emulado, no Safari físico, y no se midió la sensación jugando.
- **Pendiente:** P3 (shake de pasos del patovica, 2.º argumento de `fx.shake`, `sparkMat.clone()` por chispa) y probar P0 + P1 + P2 en iPhone.
- **Rollback:** `git revert <hash de este commit>` (base previa: `8c6a920`).

## 2026-11-28 · Auditoría Sakurai de la calle, P3: pasos del patovica, duración del shake y pool de chispas (hecho por Claude)
- **Qué cambió** (solo la calle; las arenas no cambian):
  1. **Pasos del patovica** (`feedback.js` `HIT_SHAKE.tiny`): la sacudida chica pasa de 0,01 m a 0,02 m vertical, 3F (era imperceptible). Solo la usan esos pasos (`enemies.js`, `fx.shake(0.04)`).
  2. **2.º argumento de `fx.shake`** (`fx.js` → `createHitShake.set(amount, seconds)`): `cine.js` ya lo pasaba (0,15–0,3 s) y se ignoraba; ahora fija la duración del patrón. Las cinemáticas sacuden un poco más de tiempo que antes.
  3. **`sparkMat.clone()` por chispa** (`fx.js`): pool de materiales de chispa (tope 64), se reciclan al apagarse y en `clear()`; menos basura por golpe.
- **Verificación:** `node tools/stamp_versions.mjs`, `npm test` 125/126 (falla solo `check_sprites.py`: sin `scipy`), prueba nueva en `tests/feedback.test.mjs`. e2e en Chromium: `golpe_feel` (Chrome 1280×720 y celu 430×932 táctil, sin errores de consola), `p2_calle`, `attackfx`, `leaks`, `skill_fx`, `combat`. No es Safari físico y no se midió la sensación jugando.
- **Con esto queda cerrada la auditoría de la calle en el código.** Pendiente: probar P0–P3 en iPhone físico y decidir si se siente bien.
- **Rollback:** `git revert <hash de este commit>` (base previa: `0161594`).

## Para retomar en un chat nuevo (Sakurai, calle)
- Hecho y publicado en `feat-3d` (`fca543d`): P0, ajuste anti-lag, P1 y P2 de la auditoría.
- (P3 hecho, ver la entrada anterior.) Falta: (1) probar P0+P1+P2+P3 en iPhone físico y decidir si se siente bien; (2) P3: `fx.shake(0.04)` de los pasos del patovica (`enemies.js` ~152, imperceptible: sacarlo o pasarlo a vertical 0,02 m / 3F), `cine.js` llama `fx.shake(a, b)` pero `fx.js` ignora el 2.º argumento, y `sparkMat.clone()` por chispa en `fx.js` (le toca a `margoush-perf`).
- Otros pendientes sueltos: poses de héroes (golpe de poder y 2.º golpe), hojas > 2048 px a medir en iPhone, regenerar `arena_lale_throw` en Gemini, y los e2e viejos `enemies.e2e` (`setStage`) y `cover.e2e` (línea 39).
- El documento de la auditoría no está en el repo: está en el chat «Auditoría de impacto en Sakurai» (mensaje largo del 28/11 ~11:30). Si hace falta, pedirlo al usuario.
- Para correr los e2e en este tipo de contenedor: Playwright global en `/opt/node22/lib/node_modules/playwright` (enlazarlo en `node_modules/playwright`) y `node_modules/three/build/three.min.js` (three r128; ojo: `npm install` borra el enlace de Playwright, enlazarlo después). `node_modules/` está en `.gitignore`.
- `check_sprites.py` falla sin `scipy` (no es un bug del juego).

## 2026-11-28 · Feeling del golpe (auditoría Sakurai, segunda pasada)
- Hit-stop local: durante el congelado el héroe y el golpeado se paran; el resto de los malos sigue a 0,12× (`FREEZE_WORLD` en `main.js`). Antes se paraba todo el mundo.
- Sonido: cola del golpe acortada para terminar dentro del hit-stop, click agudo para el altavoz del celu, `hitSoft` para Lale (manteca). Flash de KO blanco y luego oscuro.
- Esquive: cooldown 0,7 → 0,55 s y se resetea con «¡JUSTO!». Joystick: zona muerta de profundidad 0,25.
- Inercia corta del héroe (~4F arrancar, ~3F frenar).
- Verificado: `npm test` 125/126 (falla `assets` por falta de `scipy`, ya fallaba); e2e `golpe_feel` y `combat` OK en Chromium emulado (SwiftShader: los ms de cuadro no sirven como medida). `controls`, `enemies`, `gates`, `mobile` fallan igual sin mis cambios. No probado en Safari físico.
- Rollback: `git revert` del commit de esta entrada.

### Cierre de sesión 2026-11-28 · qué falta
- Probar en iPhone real (Safari): hit-stop local con varios malos, sonido del golpe en el altavoz, inercia y esquive. Si el mundo se siente raro durante el hit-stop, ajustar `FREEZE_WORLD` (0,12) en `3d/js/main.js`.
- Confirmar que GitHub Pages desplegó `feat-3d` (https://facundocapello-blip.github.io/margoush-party/); no se verificó desde el contenedor.
- `npm test` 126/126 con `scipy` instalado (pip install scipy). Los e2e `controls`, `enemies`, `gates`, `mobile` y `level` fallan igual sin estos cambios en el contenedor (no investigado: tiempos de espera/entorno); revisar en una máquina con Chrome real.
- Menores sin hacer: popups de daño con DOM por golpe (medir en iPhone con 5 malos), aleatoriedad de chispas con semilla en modo debug, capturas de las 2 pruebas (escritorio 1280×720 y iPhone 430×932) que pide AGENTS.md.

## 2026-11-28 · Douge (tamaño de cabeza), baile de Big Chaky (encuadre, Margot, piso y KO) y Cepi en derrota
- **Qué cambió (respetando todos los FX, partículas y ajustes Sakurai previos):**
  - **Douge (`3d/js/hero.js`):** normalizado `POSE_H.douge` (`idle: 0.96, walk: 1.06, run: 0.85, combo: 0.86, actions: 0.86`) para que la cabeza mantenga el mismo tamaño al estar quieto, caminar, correr y pegar (antes `run: 1.11` la agrandaba ~32 % respecto de `idle` y ~47 % respecto de `walk`).
  - **Baile de Big Chaky (`3d/js/arena.js`, `3d/css/game.css`, `3d/js/cine.js`):**
    - Eliminado el corte horizontal al 62 % de `#arena-ui.dice-mode::before` (ahora viñeta suave a pantalla completa) y ajustado el encuadre en vertical (`zPortrait: 11.4`, `fovPortrait: 58`) y en la intro para que Douge, Margot y Chaky entren completos sin recortes.
    - **Margot en el centro del escenario** (`x = 0, z = STAGE_Z - 0.95`) durante el duelo y al costado interior de Chaky durante la intro (antes quedaba tapada detrás de Chaky y pegada al borde derecho).
    - **Bailarines apoyados en el piso:** pies sobre las baldosas LED (`DANCE_Z`), descuento de `foot`, sombra de contacto más marcada que escala con la altura, ritmo expresado con *squash & stretch* y vaivén desde los pies sin flotar en el aire (salto acotado solo al carril central `●` y `dance_jump`).
    - **Fin del nivel sin tildarse:** oculta el cartel de ronda en KO, mantiene el render animado durante el cierre de cortina, deja a `arena_chaky_dance_ko` arrodillado en el piso sin volcarlo `-66°`, y en `postChaky` (`3d/js/cine.js`) Chaky tiembla en pose `hurt` (sin cochecito duplicado) y sale corriendo hacia la derecha en lugar de quedar congelado.
  - **Cepi en pantalla de derrota (`3d/js/ui.js`, `3d/css/game.css`):** usa `arena_cepi_smash.webp` (alta resolución, ya reparado con `fix_alpha_holes.py`) con clase `.cepi-sprite.cepi-hd` y animación `cepi-rage`, en reemplazo de `cepi_sheet.webp` (baja resolución con halo blanco).
- **Verificación:** `node --check` en los 4 JS editados, `node tools/stamp_versions.mjs`, `npm test` **125/125 en verde** (`0` fallos, `1` omitido: `check_sprites.py` sin `numpy`/`scipy` en la VM). Doble prueba real en **Chromium emulado (no Safari físico)**: escritorio `1280×720` y celular iPhone 15 Pro Max `430×932` táctil jugando calle (quieto/corriendo), intro de Chaky, duelo de baile con flechas/toques en pantalla (`hp: 30 → 28.85`), KO, cinemática `post_chaky` y pantalla de derrota con Cepi HD; `0` errores de consola y capturas revisadas en ambos perfiles.
- **Pendiente:** prueba física en Safari de iPhone 15 Pro Max (encuadre del baile, audio y feeling de la calle).
- **Rollback:** `git revert <hash de este commit>` (base previa en `main`: `3055a31`).

## 2026-11-28 · Regeneración de `douge_run.webp` con la misma proporción cabeza/cuerpo que `douge_idle` y `douge_walk_sheet`
- **Causa raíz:** el sprite anterior `douge_run.webp` tenía una proporción de dibujo distinta (`skull/vis_h = 0,410` contra `0,314` en `douge_idle` y `0,280` en `douge_walk_sheet`), por lo que escalarlo por código solo intercambiaba cabeza grande por cuerpo chico.
- **Qué cambió:**
  - Regenerada la tira completa de 6 cuadros de carrera de Douge (`3d/assets/douge_run.webp`, `1680×400`, `77,3 KB`, `v=f8bff87f`, pies alineados en `foot: 0.985`, sin halos verdes ni restos sueltos) usando `douge_idle.webp` y `douge_walk_sheet.webp` como referencia directa (`skull/vis_h ≈ 0,31`).
  - Actualizado `3d/assets/manifest.json`, `POSE_H.douge` en `3d/js/hero.js` (`idle: 0.96, walk: 0.99, run: 1.00`) y sellado `3d/index.html`. Peso total de `3d/assets/`: `9,2 MB` (`< 10 MB`).
- **Verificación:** `node --check 3d/js/hero.js`, `node tools/stamp_versions.mjs`, `npm test` **125/125 en verde** (1 omitido: `check_sprites.py` sin `numpy`/`scipy`). Doble prueba en **Chromium emulado (no Safari físico)**: escritorio `1280×720` y celular `430×932` táctil comparando `idle` vs `run` (`0` errores de consola, misma cabeza y mismo cuerpo).
- **Rollback:** `git revert <hash de este commit>` (base previa en `main`: `01e1efd`).



## Actualización 2026-11-28 · Atajos a jefes en la portada + nueva música del baile
- Rollback: `a604247`.
- Portada (póster A y portada vieja): fila «JEFES» con 🕺 CHAKY · 🎾 CEPI · 🧈 LALE · 🅿️ PINKY · 🎨 FACU. Cada botón va a elegir héroe y entra directo a la arena (mismo camino que `?probar=<jefe>`, sin recargar ni guardar checkpoint). ¡JUGAR! vuelve a la historia normal. `PROBAR` pasó de `const` a `let` en `main.js`.
- Música del duelo de baile de BIG CHAKY (`disco` en `music.js`): reemplazada por un cachengue (cumbia + dembow) en La menor (Am–F–C–G), estribillo de pluck, bajo 808, güiro y bronces. Sigue sincronizada a la negra de cada ronda (test D-4 OK).
- QA: `npm test` 126/126. Nuevo `tests/e2e/boss_jump.e2e.mjs` (Chrome 1280×720, iPhone 15 Pro Max 430×932 y 932×430 táctil): los 5 atajos entran a su arena con Douge y Marine, sin errores de consola. `probar.e2e` y `chaky_dice.e2e` OK. Chromium emulado, no Safari físico.
- Ya fallaban antes de este cambio (probado sobre `a604247`): `cover.e2e` (espera la persecución tras la intro, ya no existe ahí) e `idioma.e2e` (texto «⚡ POUVOIR PRÊT !» del HUD).
- Chequeo rápido (capturas): en horizontal la frase de Pinky y de Facu cae encima de la cabeza del jefe y a Facu casi no se lo ve detrás del cartel de fase; en vertical el «¡VIDA EXTRA!» del baile queda apenas cortado a la izquierda.

## Actualización 2026-11-28 · Música del baile: «disco de terror» ochentoso
- Rollback: `e8eeb99` (cachengue). Facu no quiso el cachengue; pidió electrónica / hit de los 70-80 tipo Thriller, en chiste. No se copia Thriller (derechos): tema propio con esa onda en Fa# menor: bombo en negras, redoblante «gated», bajo de sinte en octavas, hook de sinte, bronces y un «uuuuh» de theremin cada vuelta. Sigue sincronizado a la negra de cada ronda.
- QA: `npm test` 126/126, `chaky_dice.e2e` OK, baile en 430×932 y 932×430 con la música `disco` sonando y sin errores (Chromium emulado, no Safari físico).

## Actualización 2026-11-28 · Contraseña para la pelea con Facu
- Rollback: el commit anterior de este día («Música del baile: disco de terror…»).
- El atajo 🎨 FACU de la portada y los links `?probar=facu*` piden contraseña en una ventanita del juego (ES/FR) antes de entrar. La contraseña la tiene solo Facu y no está en el repo: en el código queda solo un hash (`PASS_HASH` en `main.js`). Es un candado de juego: alguien que lea el código podría saltearlo. Una vez puesta, no se vuelve a pedir hasta recargar. La historia normal no cambia.
- `boss_jump.e2e` necesita la variable `MARGOUSH_FACU_PASS` (pedírsela a Facu).
- QA: `npm test` 126/126; `boss_jump.e2e` (escritorio + iPhone parado/acostado): pide contraseña, con la incorrecta no entra, con la correcta sigue; `?probar=facu` también la pide y Cancelar no deja entrar. Sin errores de consola. Chromium emulado, no Safari físico.

## Actualización 2026-11-28 · 3 propuestas nuevas de portada (para elegir)
- Facu no quiere más la portada A. Se sumaron como opciones, sin cambiar la portada por defecto: `?portada=d` (fichín de los 80, con los jefes como elección de rival), `?portada=e` (placa roja «URGENTE: SECUESTRARON A MARGOT» con zócalo que corre) y `?portada=f` (flyer «MARGOUSH PARTY» con los jefes como line-up). Las tres mantienen ¡JUGAR!, idioma, podio, ranking, continuar y los atajos a jefes (Facu con contraseña). Fuentes nuevas de Google: Press Start 2P y Monoton.
- QA: Chromium emulado 430×932 y 932×430, sin errores de consola; el atajo a Cepi entra a su arena en las tres. En las capturas de prueba las fuentes de Google no cargan (el arnés corta internet); en el sitio sí.

## 2026-11-28 · Ronda de diversión en la calle (auditoría Sakurai)
- Malos: **devolver el tiro** (golpear la medialuna/pelota de mozo o Cepi cuando baja la manda de vuelta, 2 de daño al que la tiró y a los que estén en el punto de caída, «¡DEVUELTA!»); **punto débil** (tras la embestida del patovica, el mareo del delivery y el bombazo del bombo quedan agotados, 💫 y destellan: el siguiente golpe vale doble). Constantes `WEAK` y `REFLECT` en `3d/js/enemies.js`.
- Cosas para hacer: **12 tachos** rompibles en la calle (`BINS` en `3d/js/props.js`, 2 golpes, sueltan monedas; 4 de ellos una cerveza) y bonus **✨ ¡LIMPIO! +300** al despejar un tramo sin recibir daño (`updateZones` en `3d/js/main.js`).
- Verificado: `tests/e2e/diversion.e2e.mjs` en Chromium emulado, escritorio 1280×720 y iPhone 15 Pro Max 430×932 táctil, sin errores de consola; capturas en `tests/e2e/out/`. `npm test` 125/126 (falla `assets` por falta de `scipy`, ya fallaba). No probado en Safari físico.
- Pendiente de afinar jugando: si 300 de «LIMPIO» o el doble de daño desbalancean el puntaje (rangos S/A/B en `score.js`); ventana de devolver tiro (`REFLECT.from`, alcance +1,6 m en `hitArea`); si las 4 cervezas de tachos regalan demasiada vida.
- Rollback: `git revert` del commit de esta entrada.
