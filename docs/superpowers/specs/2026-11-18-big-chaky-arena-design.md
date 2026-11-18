# MARGOUSH 3D — Pelea final en la arena de BIG CHAKY (diseño)

Fecha: 2026-11-18 · Rama: `feat-3d` · Reemplaza la pelea de costado contra BIG CHAKY (`3d/js/boss.js`). Todo lo demás del juego sigue igual.

## 1. Intención

El final se siente corto y plano comparado con el resto: BIG CHAKY es un malo grande que camina, embiste y pisa, igual que los demás pero con más vida. Facu quiere una pelea con **otra vista**, como la imagen de referencia que mandó: el jefe **enorme, arriba al fondo**, moviéndose y **tirando cosas**, y el héroe **abajo, visto de espaldas**, esquivando y pegándole. Tiene que ser el momento más espectacular del juego.

## 2. Metas

- Arena nueva con la cámara detrás del héroe mirando hacia el fondo (la misma idea de cámara que la persecución de Cepi), quieta, sin avanzar.
- **Héroe a pie, de espaldas** (elección de Facu): se mueve libre con el joystick y usa los botones de siempre (👊 combo, SALTO, ESQUIVE, poder).
- **Dos fases** (elección de Facu, opción «las dos, por fases»):
  - **Fase 1 — devolver cosas.** BIG CHAKY tira barriles que ruedan y cajones que caen. Algunos vienen **dorados**: si les pegás con 👊 justo cuando llegan, vuelven y le pegan a él.
  - **Fase 2 — manotazos** (desde la mitad de la vida). Se enfurece y además de tirar cosas golpea el piso con la mano. La mano queda **trabada** unos segundos: corrés y le das con el combo.
- Al ganar sigue el rescate de Margot de siempre.

## 3. No-metas

- Cambiar el rescate, la persecución, las tandas o el camino hasta el galpón.
- Jefes nuevos o más fases.
- Que el héroe pelee en su vehículo (descartado por Facu).

## 4. Anti-metas (sería un fracaso aunque funcione)

- Un ataque que pega **sin aviso**: todo se anuncia antes (sombra, anillo rojo, brillo o pose de carga) y siempre hay una forma de evitarlo.
- Que se le pueda ganar apretando 👊 sin parar: fuera de las devoluciones y de la mano trabada, los golpes casi no le hacen nada.
- **Carteles de instrucciones** (regla de Facu: «es evidente lo que hay que hacer»). El brillo dorado y la mano trabada tienen que explicarse solos. Sí van frases de BIG CHAKY (chistes e historia).
- Que el héroe aparezca de costado en la arena.
- Bajar de 50 fps en el iPhone.

## 5. Enfoques considerados

| Enfoque | A favor | En contra | |
|---|---|---|---|
| **A. Arena nueva, aparte** (módulo propio con escena y cámara propias, como la persecución) | Queda como la referencia; la cámara de atrás ya probó andar en el iPhone; no toca el galpón | Hace falta arte de frente de BIG CHAKY y de espaldas de los héroes | **Elegido por Facu** |
| B. Dos vistas: la pelea de costado como fase 1 y la arena al enfurecerse | Cambio de cámara espectacular | Doble trabajo; conserva la parte floja | Descartado |
| C. Cambiar solo la cámara en el galpón actual | Lo más barato | El galpón está pensado de costado; las cosas que vienen hacia vos no se leen | Descartado |

## 6. Cómo funciona

### Entrada y salida
- Arranca en el mismo momento que hoy la pelea (despejada la última tanda, el héroe pasa la puerta del galpón): el cartel de historia «👑 BIG CHAKY — ¡De acá no pasa nadie! ¡La nena se queda conmigo!», un fundido y la arena.
- Música de jefe y rugido como hoy. La barra de vida «BIG CHAKY» (`#boss-bar`) se usa igual.
- Sin corazones = derrota normal (pantalla de resultado, como en el resto del juego). No se suma un «reintentar» desde el jefe (*decisión mía*: sería una función nueva, se puede pedir después). El atajo de pruebas `STAGES.galpon` pasa a arrancar directo en la arena.
- Al ganar: pose KO, +2000, fogonazo y el `game.onBossDown()` de siempre. El rescate vuelve a la escena del galpón de costado.

### La arena
- Plataforma de tablones en el galpón, unos 9 m de ancho. El héroe se mueve en una franja de adelante (donde arranca) hasta unos 7 m hacia el fondo; no puede llegar a BIG CHAKY.
- BIG CHAKY, de frente y muy grande (unos 8 m), al fondo sobre una tarima, se desplaza de lado a lado.
- Fondo pintado del galpón (ladrillo, ventanales, cadenas, luz violeta y naranja).

### El héroe
- Joystick: se mueve libre (izquierda/derecha y adelante/atrás). SALTO salta los barriles. ESQUIVE da invulnerabilidad corta; un esquive justo da +100 y carga poder (como en la persecución).
- 👊: el combo de 3 golpes de siempre, con las mismas pausas al pegar, temblor y sonidos.
- Poder (mantener 👊 o L con la barra llena): Douge «¡VERDADES A LOS GRITOS!», Marine «¡HIEDRA!». Rompe todo lo que está volando y le saca un buen pedazo a BIG CHAKY.
- Cada golpe que recibe saca 1 corazón, como en el resto del juego.

### Fase 1 — devolver cosas (vida 100 % → 50 %)
- **Barril:** BIG CHAKY lo levanta (pose de tirar) y lo tira rodando por una línea recta hacia adelante. Se esquiva corriéndose o saltándolo.
- **Cajón:** lo tira por arriba y cae en un punto marcado con un anillo rojo que se achica (como el pelotazo de Cepi).
- **Dorado:** uno de cada tres **barriles** viene dorado y brillando. Si le pegás con 👊 cuando está por tocarte (de frente, en su línea), sale disparado de vuelta a BIG CHAKY: pose de golpeado, una frase y un buen pedazo de vida. Si no le pegás a tiempo, te golpea como cualquier otro. Los cajones nunca son dorados (*decisión mía*: el anillo rojo enseña a salir de ahí, no a quedarse abajo).
- Con 4 devoluciones la fase termina, aunque se puede acortar con el poder.

### Fase 2 — manotazos (vida 50 % → 0)
- Al pasar la mitad: pose de furia, fogonazo rojo, temblor, rugido y una frase.
- Tira más rápido y suma el **manotazo**: la sombra de la mano aparece en el piso donde está el héroe y crece durante casi 1 s. Después cae la mano. Si te agarra, perdés un corazón.
- Después del manotazo la mano queda **trabada** en el piso unos 2 s (tiembla, BIG CHAKY hace fuerza): ahí el combo le pega de lleno. Después la levanta.
- Siguen apareciendo algunos dorados, menos que en la fase 1.

### Puntos
- Devolución: +300. Golpe a la mano trabada: +50 cada uno. Esquive justo: +100. Derrota de BIG CHAKY: +2000 (como hoy).

### Frases de BIG CHAKY (ejemplos, sin instrucciones)
«¡Tomá, barrilito!», «¡Eso no vale!», «¡Me devolviste el barril, atrevido!», «¡Ahora sí me enojé!», «¡Soltá, soltá!».

## 7. Arte (lo genera un agente en Google Flow, proyecto «nov 18 - 14:19»)
- BIG CHAKY de frente: quieto, tirando, manotazo, golpeado, furioso, KO (fondo verde para recortar).
- Objetos: barril, cajón (fondo blanco). El dorado se hace por código (tinte y brillo) sobre los mismos.
- Fondo del galpón de frente.
- Douge y Marine de espaldas: guardia, corriendo, trompada, golpeado (fondo verde).
- Llegan como archivos sueltos (uno por pose) y en el juego quedan como `arena_chaky_<pose>`, `arena_<héroe>_back_<pose>`, `arena_barril`, `arena_cajon` y `arena_fondo`.
- **No se sube a `main` hasta tener el arte** (*decisión mía*): un héroe de costado o figuras provisorias en la arena serían justo lo que no queremos. Mientras tanto el código se prueba en la rama de trabajo.
- Se recortan con las herramientas de siempre (`tools/cut_white.py` y el recorte de verde de la persecución) a WebP transparente. El presupuesto de imágenes puede subir de unos 7 MB a unos 8,5 MB.

## 8. Restricciones
- Three.js r128, módulos ES, sin build; mismo HUD, controles y sonidos que el resto.
- iPhone horizontal y vertical: la cámara ajusta el ángulo de visión según la forma de la pantalla, como la persecución.
- Pruebas: `npm test` y los e2e en verde, con pruebas nuevas de la arena (fases, devolución, mano trabada y que el ataque sin parar no alcance).
- Cada versión trabajada se sube a `main` (GitHub Pages) para que Facu la pruebe.

## 9. Queda a criterio de quien lo construya
- Los números exactos (vida, velocidades, ventanas de tiempo) en una tabla `ARENA` arriba del módulo, como `CHASE`.
- Los sonidos (reutilizar los existentes), el diseño del piso y la tarima, y la animación de cada pose (rebote, balanceo y giro, como el BYD).
- Qué hacer con `boss.js`: puede quedar sin usar o borrarse, siempre que las pruebas se actualicen.
