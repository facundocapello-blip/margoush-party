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
