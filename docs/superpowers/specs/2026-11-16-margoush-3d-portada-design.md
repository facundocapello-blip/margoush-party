# MARGOUSH 3D — Portada y música de portada (diseño corto + plan)

Fecha: 2026-11-16 · Rama `feat-3d` · Aprobado por Facu ("1": tema nuevo sintetizado).

## Intención
La portada actual (logo plano + Facu + dos botones) se ve "muy normal". Facu quiere una portada con impacto y música.

## Diseño
- Estilo póster de película, de noche: fondo = pintura de la calle (`street_bg`) oscurecida con viñeta y dos reflectores que barren.
- "🎤 FACU PRESENTA" chico arriba (con su cara), logo MARGOUSH grande con relieve (capas de sombra sólida, sin halo), relleno dorado→rosado, borde oscuro, levemente inclinado; entra cayendo con rebote. Cinta rosa "EL RESCATE DE MARGOT".
- Izquierda: Douge y Marine en pose de héroes; derecha: Chaky empujando el cochecito rosa (cuadro de `kidnap_sheet`). Respiran (animación suave, desfasada). Respeta `prefers-reduced-motion`.
- Abajo: "TOCÁ PARA EMPEZAR" titilando. Ese primer toque (o tecla) habilita el audio (Safari) y arranca la música; recién ahí aparecen ¡JUGAR! y 🏆 Ranking. Volver al menú después de una partida muestra los botones directo, con música.
- Música: tema nuevo "menu" sintetizado (como el del jefe): La menor, Am–F–C–G, bombo/caja, bajo, colchón de acordes y melodía heroica a partir del compás 5; loop de 8 compases. Respeta el silencio (🔇).
- Vertical (celular parado): todo apilado; nada se superpone con los botones.

## Enfoques considerados
- Tema nuevo sintetizado (elegido) vs. reusar un tema del 2D (descartado por Facu).
- Pantalla "tocá para empezar" (elegida: la necesita el iPhone para sonar) vs. música que arranca sola (imposible en Safari).

## Plan (TDD)
1. `tests/e2e/cover.e2e.mjs`: al abrir se ve "TOCÁ PARA EMPEZAR" y no los botones; tocar → `audio.current === 'menu'` y aparecen los botones; logo, héroes y Chaky visibles y sin superponerse con los botones en 844×390 y 390×844; empezar a jugar cambia la música a la del héroe; volver al menú vuelve a `menu` sin pedir otro toque. Ver fallar.
2. `audio.js`: secuenciador sintetizado genérico (jefe + portada), `audio.current`. `index.html`/`game.css`/`main.js`: portada nueva. `harness.open()` toca "empezar". Ver pasar; suite completa verde.
3. Commit, push a `feat-3d`, republicar la vista previa.
