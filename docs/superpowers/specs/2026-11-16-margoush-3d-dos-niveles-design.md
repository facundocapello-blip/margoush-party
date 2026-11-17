# MARGOUSH 3D — Dos niveles, trampas y malos nuevos (diseño)

Fecha: 2026-11-16 · Rama: `feat-3d` · Se apoya en `2026-11-15-margoush-3d-diseno.md` (todo lo que este documento no cambia sigue valiendo).

## 1. Intención

Facu quiere que el juego esté "mejor en todo" antes de publicarlo a la familia. Lo que más le falta hoy, en sus palabras: el camino hasta BIG CHAKY es fácil y monótono (un solo tipo de malo, sin trampas) y **Le Concept** no se reconoce. El juego es para que la familia compita por el ranking, así que tiene que ser **más difícil y más variado**, con humor reconocible: cosas molestas de Argentina y de Francia (Marine es francesa).

## 2. Metas

- Una partida = **dos niveles seguidos** con un solo puntaje para el ranking (opción B elegida por Facu).
  - **Nivel 1 — Buenos Aires:** calle porteña → termina en la puerta de **Le Concept**.
  - **Nivel 2 — Francia:** calle francesa → galpón → BIG CHAKY → rescate de Margot.
- **Le Concept** (el local azul de la pintura: tres vidrieras en arco con cuadros, balcón con flores) aparece **una sola vez**, a mitad del recorrido, como edificio destacado con cartel "LE CONCEPT" iluminado (dorado sobre azul).
- **8 trampas** y **4 malos nuevos** (lista aprobada por Facu, sección 5 y 6).
- Dificultad que **sube de a poco**: el arranque del Nivel 1 lo pasa cualquiera; lo bravo queda para el Nivel 2.

## 3. No-metas

- Más de dos niveles, niveles sueltos con ranking propio, selector de nivel.
- Jefes nuevos (BIG CHAKY sigue siendo el único).
- Personajes jugables nuevos, multijugador.
- Publicar en `main` (sigue requiriendo el OK de Facu tras probar en iPhone).

## 4. Anti-metas (sería un fracaso aunque funcione)

- Una trampa que pega **sin aviso**: toda trampa se anuncia (ícono/sombra + sonido) al menos 0,8 s antes.
- Que alguien de la familia quede trabado en el primer minuto y abandone.
- Humor que se lea como político o agresivo: el piquete y la grève son "molestias de la calle", sin partidos, banderas reales ni personas reales.
- Que Le Concept se confunda con las demás fachadas o se repita.
- Bajar de 50 fps en el iPhone por la cantidad de cosas en pantalla.

## 5. Trampas

Todas se anuncian antes de actuar y tienen una forma clara de evitarse.

| Trampa | Nivel | Qué hace | Cómo se evita |
|---|---|---|---|
| Baldosa floja | 1 | Al pisarla salpica agua sucia: héroe lento 2 s | Se ve distinta (borde suelto); rodearla o saltarla |
| Bache | 1 | Pozo en la calle: caer = −1 corazón y vuelve al borde | Saltar (como los pozos del 2D) |
| Piquete | 1 | Fila de cubiertas prendidas fuego que corta la calle; tocar el fuego = −1 corazón | Es un **portón**: se abre al vencer a la banda del bombo; mientras tanto el fuego quema |
| Colectivo que no frena | 1 | Bocina + franja de aviso en el carril; pasa a toda velocidad a lo largo de la calle; pega = −1 corazón y empujón | Cambiarse de carril (moverse en profundidad) |
| Lluvia de boletas | 1 | Caen boletas (EXPENSAS, LUZ, GAS) con sombra en el piso; cada una que te toca = −100 puntos | Esquivar las sombras |
| Grève | 2 | Manifestantes con carteles "GRÈVE" cruzan de atrás hacia adelante y te empujan para atrás (sin daño) | Pasar por el hueco de la fila o esperar |
| Trottinettes | 2 | Monopatines eléctricos cruzan rapidísimo; pega = −1 corazón | Cambiarse de carril (más rápidos y frecuentes que el colectivo) |
| Palomas de París | 2 | Bandada que tapa la vista ~1,5 s (vuelo de palomas delante de la cámara) | Molestia sin daño; se anuncia con aleteo |

## 6. Malos nuevos

Cada uno pelea distinto (no solo otro color). El secuaz actual sigue.

| Malo | Nivel | Comportamiento | Vida | Puntos |
|---|---|---|---|---|
| Secuaz (actual) | 1 y 2 | Igual que hoy | 3 | 100 |
| Patovica | 1 y 2 | Lento, aguanta mucho; su empujón te tira lejos (−1 corazón) | 7 | 250 |
| El del bombo | 1 | Toca el bombo: onda que aturde 1 s si estás cerca (se ve la onda venir) | 4 | 200 |
| Mozo francés | 2 | Se queda lejos y tira croissants en arco con sombra; hay que acercarse | 3 | 200 |
| Delivery en bici | 2 | Pasa embistiendo en línea recta tras aviso; hay que esquivar y pegarle cuando frena | 3 | 200 |

Los puntos de los malos nuevos se multiplican por el combo igual que el secuaz.

## 7. Recorrido

```
NIVEL 1 — BUENOS AIRES
 inicio ─ vereda (secuaces, baldosas, baches) ─ portón ─ avenida (colectivo, boletas, patovica)
        ─ PIQUETE (portón de fuego, banda del bombo) ─ LE CONCEPT (pelea final del nivel)
                         ↓ cartel "NIVEL 1 COMPLETO" + Facu: "¡Nivel 2: Francia!"
NIVEL 2 — FRANCIA
 calle francesa (mozos, trottinettes, palomas) ─ portón ─ boulevard (grève, delivery, patovica)
        ─ galpón ─ BIG CHAKY ─ rescate
```

- Cada nivel dura ~3 min jugando bien.
- Transición: pantalla corta con lo hecho en el nivel (puntos, malos vencidos), Facu anuncia el Nivel 2, el héroe recupera **2 corazones** (sin pasar del máximo). Mi decisión, para que el Nivel 2 no arranque perdido.
- **Una sola vida por partida**: si perdés en el Nivel 2, la partida termina con los puntos que tenías (va al ranking igual). Mi decisión: así el ranking es justo entre todos.

## 8. Aspecto

- **Buenos Aires:** vereda de baldosas grises, plátanos, contenedores verdes, parada de colectivo, kiosco con cartel en estilo fileteado, cubiertas del piquete con fuego y humo. Se arma con piezas 3D y texturas pintadas por código (no hay pintura de BA en los recursos).
- **Le Concept:** el local azul recortado de la pintura `street_bg` como edificio propio, más grande y adelantado, cartel 3D iluminado, mesitas y guirnalda de luces en la vereda. En el resto de las calles se usan las otras fachadas para que no se repita.
- **Francia:** la pintura actual (estilo provenzal) + guirnaldas tricolor, faroles verdes, cartel "Boulangerie".
- **Malos nuevos:** el secuaz recoloreado + accesorios (ver decisión 1).

## 9. Puntaje y ranking

- Malos nuevos: tabla de la sección 6. Boletas: −100 (el total nunca baja de 0).
- Bonus de tiempo pasa a `max(0, 480 − s) × 10` (dos niveles). Bonus de vida igual (solo si ganás).
- Los cortes de rango (S/A/B) se recalibran midiendo un recorrido perfecto real, igual que se hizo con el nivel único.
- El ranking todavía no tiene datos reales (Supabase sin conectar): no hace falta migrar nada.

## 10. Restricciones

- Mismo stack: Three.js r128 global, módulos ES sin build, GitHub Pages.
- iPhone Safari primero; ≥ 50 fps en el test de rendimiento existente.
- Peso total de recursos ≤ 5 MB.
- Pruebas automáticas para cada trampa y cada malo (TDD), suite completa en verde antes de cada entrega.
- Vista previa en el artefacto; nada a `main` sin OK de Facu.

## 11. Enfoques considerados

- **A. Un nivel largo con todo:** simple, pero ~7 min seguidos y frustrante si perdés al final.
- **B. Una partida con dos niveles (elegido por Facu):** sensación de avanzar, mundos separados, un solo ranking. Cuesta una pantalla de transición y recalibrar el puntaje.
- **C. Niveles sueltos con ranking propio:** varias tablas, Chaky solo al final; descartado.

## 12. Queda a criterio del constructor

- Posiciones exactas de cada trampa y oleada, ritmo y frecuencias (respetando la curva fácil → difícil).
- Cómo se dibujan las trampas en 3D (siempre legibles en pantalla de celular).
- Si el Nivel 2 es la misma calle continuada o una calle nueva tras la transición.
- Sonidos de cada trampa (sintetizados como los actuales).

## 13. Decisiones de Facu

1. **Dibujos de los malos nuevos:** los arma el constructor a partir del secuaz actual (`courier`): ropa recoloreada por código (cambio de tono de la campera) + accesorios dibujados (anteojos y auricular del patovica, bombo, boina y bandeja del mozo, bici del delivery) + tamaño propio. Si más adelante Facu trae dibujos hechos con IA, se reemplazan sin tocar el comportamiento.
2. Aprobó el diseño ("armalo", 2026-11-16).
