# MARGOUSH 3D — Diseño

Fecha: 2026-11-15. Estado: aprobado por Facu el 2026-11-15.

## 1. Qué es y por qué

Juego familiar para que Douge, Marine y su familia compitan por puntos y se diviertan. La historia es la de siempre: BIG CHAKY se lleva a Margot, la bebé de Douge y Marine, y hay que rescatarla.

Ya existe una versión 2D (V23.8, plataformas) que la familia jugó mucho porque los personajes se parecen a ellos. Le faltan dos cosas: un ranking para competir y un aspecto más profesional. Este proyecto lleva esa versión a un mundo 3D usando las mismas caricaturas, y le suma puntaje y ranking compartido.

**Referencias acordadas:** el aspecto de *Cult of the Lamb* (personajes dibujados en un mundo 3D con cámara alta) y el combate y puntaje de *Streets of Rage 4* (golpes con peso, combos, nota al final).

**Éxito:** la familia lo juega desde un link, se pelean por el primer puesto del ranking y lo vuelven a jugar para superarse.

## 2. Objetivos

- Personajes reconocibles: Douge, Marine, BIG CHAKY y Margot con las caricaturas del 2D.
- Mini Facu como ayudante que acompaña siempre al héroe.
- Combate con peso: cada golpe se siente.
- Puntaje por partida y ranking compartido, visible para cualquiera con el link.
- Calidad profesional medible (sección 6).
- Funciona en celular (iPhone y Android) y en computadora.

## 3. No objetivos

- Modelos 3D de verdad (camino 3). Queda para una etapa posterior si lo piden.
- Varios niveles. Es un solo nivel, rejugable.
- Multijugador en simultáneo. Se compite por ranking.
- Protección fuerte contra trampas. Es para la familia; solo validaciones básicas.
- Idioma francés. Solo español rioplatense, salvo el «Oh là là!» de Marine.

## 4. Anti-objetivos (fracaso aunque funcione)

- Que los personajes dejen de parecerse a ellos.
- Que se sienta como una página web y no como un juego.
- Que el ranking muestre datos falsos o diga "online" cuando no lo está.
- Que no ande bien en un iPhone real.
- Que una partida dure tanto que nadie quiera revancha (objetivo: 3 a 5 minutos).

## 5. Restricciones

- **Hosting:** GitHub Pages, link abierto. Las páginas de claude.ai no sirven porque el ranking compartido exige que cada jugador tenga cuenta de Claude.
- **Ranking:** Supabase (plan gratis). La clave pública va en el código; la seguridad la dan las reglas de la base (solo insertar y leer, con límites de valores).
- **Costo:** cero, salvo que Facu decida otra cosa.
- **Arte:** las 22 imágenes de V23.8. Hay que extraerlas a archivos sueltos y comprimirlas: hoy son 26 MB embebidos. Objetivo: menos de 6 MB en total.
- **Las caricaturas son de costado.** No hay dibujos de frente ni de espalda, así que la cámara debe mantener los personajes vistos de costado: el héroe se da vuelta a izquierda o derecha, nunca de frente.
- **Motor:** Three.js, como el 3D actual. Sin herramientas de compilación: archivos estáticos.

## 6. Vara de calidad ("profesional")

1. 60 cuadros por segundo en un celular de gama media. Si baja, se reduce la calidad sola.
2. Respuesta del control en el mismo cuadro; golpe guardado si se aprieta durante otro.
3. Cada golpe con congelado breve, sacudón de cámara, chispas, sonido y reacción del enemigo.
4. Sin deslizamiento: los pies apoyan en el piso y el paso de animación sigue la velocidad.
5. Todo en el estilo de las caricaturas: el barrio 3D se ajusta a su paleta (atardecer violeta, faroles, adoquín cálido, como el fondo del 2D).
6. Menú, pausa, resultado y ranking con estilo de juego.
7. Música por zona y un efecto por acción, con botón para silenciar.
8. Recorrido completo probado automáticamente en navegador, y probado por Facu en un iPhone real antes de compartirlo.

## 7. Enfoques considerados

| Enfoque | Ventaja | Contra | Decisión |
|---|---|---|---|
| 1. Pulir el 2D V23.8 | Rápido, anda bien en celular | No da el salto a 3D | Descartado |
| 2. 3D con las caricaturas como figuras recortadas | Se parecen desde el día uno, reutiliza todo | Figuras planas; solo vistas de costado | **Elegido** |
| 3. 3D con modelos generados (Meshy/Tripo + Mixamo) | Lo más impresionante | Largo, frágil, parecido no exacto, puede costar | Etapa futura |

Elegido por Facu el 2026-11-15.

## 8. Lo decidido

### Mundo
- Los lugares del 3D actual (Le Concept, la vereda, la plaza, el pasaje secreto, el galpón), reestilizados con la paleta del fondo del 2D.
- **Cambio de orientación (decisión de Claude):** el recorrido pasa a ir de izquierda a derecha, como una calle de *Streets of Rage 4* con profundidad para moverse arriba y abajo. Hoy el héroe camina "hacia adentro" de la pantalla, y con dibujos de costado se vería caminando de lado hacia el fondo. De izquierda a derecha, las caricaturas siempre se ven bien.
- Cámara alta y de frente a la calle, siguiendo al héroe de costado.

### Personajes
- **Héroe:** Douge o Marine, elegible. Poses: quieto, correr (6 cuadros), pegar. "Golpeado": parpadeo y retroceso, porque no hay dibujo.
- **Facu (el del micrófono, confirmado por Facu).** Facu pidió tener participación; la definición es decisión de Claude:
  - *Ayudante en el juego:* versión mini que sigue al héroe y pega con el micrófono a enemigos cercanos. No muere.
  - *Chiste aturdidor:* cada tanto cuenta un chiste y los enemigos cercanos quedan tentados de risa, aturdidos un momento («¡JAJAJA!»).
  - *Conductor del show:* abre la partida presentando la misión como en un stand-up y, al final, presenta el puntaje, la nota y el ranking.
- **BIG CHAKY:** poses quieto, correr, atacar, golpeado. Fase 2 al 50 % de vida.
- **Margot:** bebé en cochecito rosa, con sus 4 dibujos (durmiendo, llorando, festejando).
- **Secuaces:** el dibujo del repartidor del 2D, con variantes de color.

### Historia
- Intro corta: BIG CHAKY se lleva el cochecito (dibujos del 2D).
- Final: el héroe y mini Facu junto a Margot festejando; Facu presenta el resultado.

### Combate
- Combo de 3 golpes con remate, esquive, salto y poder especial (Douge: puño de VERDADES; Marine: «Oh là là!» que aturde alrededor).
- Golpe con peso según la vara de calidad.

### Puntaje
- Enemigo: 100 (secuaz) y 2000 (BIG CHAKY).
- Combo: multiplicador que crece con golpes seguidos y se corta al recibir daño.
- Mamaderas: 50. Secreto encontrado: 500.
- Al final: bonus por vida restante y por tiempo.
- Nota S/A/B/C al final, como en *Streets of Rage 4*.

### Ranking
- Al terminar (gane o pierda), el jugador pone su apodo y el puntaje se sube.
- Tabla: top 20 histórico y de la semana, con apodo, héroe, puntaje y fecha.
- Sin conexión: se guarda local y lo dice claramente.

### Controles
- Celular: joystick a la izquierda; golpe, salto, esquive y poder a la derecha.
- Computadora: WASD o flechas, J o clic para pegar, Espacio salto, K o Shift esquive, L poder.

## 9. Lo que queda a criterio de quien construye

- Valores exactos de puntaje y balance.
- Cómo se ubican y orientan las figuras (siempre de cara a la cámara, girando a izquierda o derecha).
- Compresión de imágenes y formato (WebP con respaldo PNG).
- Organización de los archivos.

## 10. Pendiente de Facu antes de construir

1. **GitHub:** se publica en `margoush-party`, subcarpeta `/3d/` (decidido). Falta dar permiso de escritura a esta sesión.
2. **Supabase:** Facu ya tiene cuenta. Falta crear el proyecto y la tabla (con guía) y pasar la URL y la clave pública.
3. **Facu:** confirmado que el muchacho del micrófono es él.
