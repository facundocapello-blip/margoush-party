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
