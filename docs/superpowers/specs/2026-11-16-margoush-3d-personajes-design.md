# MARGOUSH 3D — Malos con personalidad, amigos, apariciones de Facu y portada (diseño)

Fecha: 2026-11-16 · Rama: `feat-3d` · Se apoya en `2026-11-15-margoush-3d-diseno.md` y `2026-11-16-margoush-3d-dos-niveles-design.md` (todo lo que este documento no cambia sigue valiendo).

## 1. Intención

Facu jugó la versión de dos niveles. Sus quejas, en sus palabras:
- Los malos son "5 figuras iguales (que no conocemos) moviéndose sin sentido". Falla **cómo se ven** y **cómo se mueven**.
- Sus apariciones en el juego tienen que ser "siempre con tintes cómicos o apareciendo de forma repentina". **No quiere ser el punto de vista principal ni el protagonista.**
- La portada: "BIG CHAKY no debe estar en la portada… simplemente que tenga el MARGOUSH".

Lo que pidió sumar: **amigos de ellos** como personajes, con caricaturas personalizadas "como tenemos ya con Douge y Marine":
- **Lale "Mantecoso"**: le dicen así porque es "mantequita" jugando al pádel. Deja barras de manteca y te hace resbalar.
- **Cepi "el Niño"**: hermano de Facu. Cuando perdés, aparece y se enoja porque perdiste.
- **Pinky, el hincha de Boca**: aparece para ayudarte, pero nunca lo logra porque se va a ver a Boca.

El juego es para la familia y los amigos: que se rían al reconocerse y que compitan por el ranking.

## 2. Decisiones de Facu

- Los malos comunes **siguen siendo la banda de BIG CHAKY**, pero cada tipo con su propia pinta, su forma de caminar y su forma de pegar. Lale se suma como malo especial; Cepi y Pinky hacen apariciones (opción 1).
- El movimiento se hace con **dibujos de IA en el estilo de las caricaturas, varias poses por personaje**, animados por código (enfoque A, ver sección 5).

## 3. Metas

- Cada tipo de malo se distingue a simple vista: silueta, ropa, pose, forma de caminar y forma de atacar.
- Ningún malo se mueve "sin sentido": todo movimiento tiene una intención que se lee (acercarse, rodear, esperar turno, embestir, mantener distancia, huir).
- Lale, Cepi y Pinky se reconocen por sus caricaturas y su chiste se entiende sin explicación ("burla bien evidente").
- Facu aparece de golpe, poco y siempre en chiste.
- Portada limpia: solo el logo MARGOUSH.

## 4. No-metas, anti-metas y restricciones

**No-metas:** malos o niveles nuevos además de Lale; tocar a BIG CHAKY, Douge, Marine o Margot; Supabase; publicar en `main`; dibujos nuevos de Facu (por ahora se anima su dibujo actual).

**Anti-metas** (sería un fracaso aunque funcione):
- Que los malos nuevos se vean como muñecos genéricos o con un estilo distinto al de Douge y Marine.
- Que el juego deje de andar fluido en un iPhone o que pese mucho más (hoy, menos de 6 MB en total).
- Que la manteca de Lale sea injusta: tiene que verse antes de pisarla y nunca debe tirarte adentro de un bache o del fuego del piquete sin que puedas evitarlo.
- Que los chistes de los amigos sean crueles: es una cargada de amigos, no una humillación.
- Que Facu vuelva a sentirse protagonista (siempre presente, narrando todo).
- Que, mientras no lleguen los dibujos nuevos, el juego quede roto: siempre tiene que poder jugarse con el arte actual.

**Restricciones:**
- Las caricaturas son **de costado** (sección 46 del diseño base): cada pose mirando a la derecha; el código las espeja.
- Textos de los personajes en español rioplatense.
- Escudos, logos y marcas reales (de Boca u otros) no se dibujan: la camiseta de Pinky es azul con franja amarilla, sin escudo.

## 5. Enfoques considerados

| Enfoque | A favor | En contra | Decisión |
|---|---|---|---|
| **A. Dibujos IA con 4 poses por personaje** (parado, paso, golpe, golpeado), animados por código | Mismo estilo que Douge y Marine; liviano; anda bien en iPhone | La IA a veces cambia detalles entre poses; puede haber que repetir alguno | **Elegido por Facu** |
| B. Personajes 3D libres con animaciones (paquetes CC0) | Se mueven bien enseguida | Muñecos genéricos 3D que chocan con las caricaturas; más pesados; no se parecen a nadie. Los de juegos comerciales no se pueden usar | Descartado |
| C. Un dibujo por personaje cortado en partes (títere) | Movimiento suave, mismo estilo | Lo más trabajoso; la IA no dibuja partes separadas prolijas | Descartado |

## 6. Diseño

### 6.1 Arte: cómo se consiguen los dibujos

- Por cada personaje, **una sola imagen con 4 poses en fila**, misma escala, mirando a la derecha, fondo liso de un color plano que no aparezca en el personaje (para recortarlo por código). Una sola imagen por personaje para que la IA mantenga la misma cara y ropa en las 4 poses.
- Claude escribe un texto (prompt) por personaje. Facu lo usa en Gemini o ChatGPT adjuntando:
  - una caricatura existente (`douge_idle.webp` o `marine_idle.webp`) como **referencia de estilo**;
  - para Lale, Cepi y Pinky, **una foto** de la persona como referencia de parecido.
- Facu sube las imágenes al chat. Claude las recorta (quita el fondo, separa las poses, recorta al personaje, comprime a webp) y las suma a `assets/manifest.json`, con una herramienta repetible en `tools/`.
- Lista de dibujos:

| Personaje | Poses |
|---|---|
| Secuaz | parado, paso, golpe (piña), golpeado |
| Patovica | parado, paso, golpe (embestida con el hombro), golpeado |
| El del bombo | parado tocando, paso, golpe (bombazo arriba), golpeado |
| Mozo francés | parado con bandeja, paso (deslizándose), golpe (tirando croissant), golpeado |
| Delivery | en la bici pedaleando ×2, tocando el timbre, golpeado |
| Lale "Mantecoso" | parado con paleta de pádel, paso, golpe (tirando la manteca), resbalado en el piso |
| Cepi "el Niño" | enojado ×2 (brazos arriba / señalando) |
| Pinky | corriendo con la camiseta ×2, escuchando la radio, festejando el gol |

- Los manifestantes de la grève quedan como están.
- Hasta que llegue el dibujo de un personaje, ese personaje usa el arte actual (el secuaz recoloreado). Cada dibujo se puede sumar por separado.

### 6.2 Animación por código

- **Caminar:** alterna parado ↔ paso según la distancia recorrida, con rebote propio de cada tipo (cadencia y altura distintas).
- **Atacar:** anuncio (pose parado inclinado hacia atrás + "!" como hoy) → pose de golpe.
- **Recibir golpe:** pose golpeado + aplastado y retroceso como hoy.
- **Caer (KO):** pose golpeado, vuela y se desvanece como hoy.

### 6.3 Comportamiento de cada malo

Regla general contra el "sin sentido": un malo que no está atacando **espera su turno a distancia, mirando al héroe**, con su pose de parado y algún gesto de burla cada tanto. No se queda temblando ni se desliza de lado.

*Turnos (decisión de Claude):* como hoy, como mucho **2 malos de cuerpo a cuerpo** atacando a la vez (secuaz y patovica). Los de distancia (bombo, mozo, delivery y Lale) suman su propio límite: **como mucho 1 ataque anunciado a la vez entre ellos**. Así una oleada de 5 no tira todo junto.

- **Secuaz:** rápido. Rodea al héroe para atacar por el lado de atrás; a veces amaga (se acerca y retrocede) antes de pegar. Piña rápida.
- **Patovica:** lento, con pasos pesados (polvo y un temblor mínimo de cámara). Su ataque nuevo es una **embestida en línea recta**, anunciada con una franja en el piso como el delivery; si te agarra, te empuja (como hoy). Los golpes chicos no lo frenan.
- **El del bombo:** se mueve al ritmo, con saltitos a tiempo, a media distancia. Mantiene el bombazo que aturde.
- **Mozo francés:** se desliza derecho y estirado con la bandeja, mantiene distancia y tira croissants (como hoy).
- **Delivery:** como hoy (patrulla, timbre, embestida, mareo), con sus poses nuevas.

### 6.4 Lale "Mantecoso" (malo especial)

- Aparece **una vez por nivel**, sumado a una oleada. Al aparecer, cartel: **LALE «MANTECOSO»**.
- *Dónde (decisión de Claude):* en el Nivel 1 se suma a la oleada `vereda-2` (antes del tramo del colectivo); en el Nivel 2, a la oleada `francia`.
- **Ataque:** tira una barra de manteca que cae adelante del héroe. Mientras está en el aire, se ve su sombra en el piso (aviso, como las boletas). Cae y queda una mancha amarilla brillante unos segundos.
- **Pisar la manteca:** el héroe patina un par de metros en la dirección en la que venía, sin control y **sin perder vida**. El patinazo dura poco (≈ 0,5 s) y frena antes de un bache, del fuego del piquete o de un portón. *Decisión de Claude:* mientras patinás no sos invulnerable (los vehículos y la grève ya avisan antes); podés pegar pero no caminar.
- **El chiste:** cuando le pegás, a veces se resbala con su propia manteca y cae de culo con su pose "resbalado". Mantiene distancia, como el mozo.
- Tiene 4 de vida y da puntos propios.

### 6.5 Cepi "el Niño" (al perder)

- Solo en la pantalla de derrota, nunca al ganar.
- Entra de golpe desde un costado, enojado, alternando sus dos poses, con un globo de texto que elige una frase al azar. Ejemplos: "¡¿Perdiste?! ¡No te lo puedo creer!", "¡Dale, que es fácil, che!", "¡Andá a jugar a la bolita!". Suena un grito o abucheo corto.
- Después de unos segundos queda a un costado, sin tapar el puntaje ni los botones.

### 6.6 Pinky, el hincha de Boca

- Aparece **una vez por nivel**, en un momento tranquilo (entre oleadas, sin malos vivos).
- Entra corriendo desde atrás con la camiseta: "¡Aguantá que te ayudo!". Frena a un par de metros del héroe, saca una radio, se escucha "¡GOOOL!", festeja y sale corriendo para el otro lado: "¡Me voy a la cancha!".
- No ayuda ni molesta: es solo un chiste. No tapa al héroe ni frena el juego.

### 6.7 Facu: apariciones repentinas y cómicas

Facu deja de acompañar todo el camino. Se quitan:
- el auto que sigue al héroe toda la partida;
- el stand-up de apertura en la intro;
- el cartel "Facu te acompaña todo el camino";
- el "FACU PRESENTA" de la portada.

También se quitan (*decisión de Claude*, para que no vuelva a ser presentador): su frase al llegar a Le Concept (pasa a ser un cartel normal) y su festejo en el rescate ("¡MARGOT ESTÁ A SALVO!" queda como cartel y festejan Douge o Marine).

En su lugar, **6 apariciones cortas por partida si ganás** (2 en cada nivel, la de Francia al cambiar de nivel y la del resultado; cada una dura pocos segundos), siempre de golpe y en chiste, animadas por código con su dibujo actual (salto, rebote, aplastado, giro):
- **Alcantarilla:** sale de una alcantarilla con el micrófono, tira un chiste ("¡JAJAJA!") que aturde a los malos cercanos y vuelve a meterse. Así se mantiene la mecánica del chiste que aturde, pero como sorpresa. *Decisión de Claude:* aparece **una vez por nivel, garantizada**, en el primer momento en que haya 3 malos o más cerca del héroe (reemplaza la ayuda que hoy da el chiste del auto cada 12 s, para que la dificultad no salte).
- **Auto a toda velocidad:** una vez en el Nivel 1 (en la vereda) y una vez en el Nivel 2 (en el boulevard), cruza por el carril de atrás en 1 o 2 segundos, tocando bocina y saludando. No ayuda ni molesta.
- **Francia:** al pasar al Nivel 2 aparece con boina y baguette: "¡Allez, allez!". Reemplaza su frase actual de nivel 2.
- **Resultado:** asoma por un costado de la pantalla con el micrófono, dice una frase corta y se va. Ya no "presenta" el puntaje. Si perdiste, el que aparece es Cepi, no Facu.

### 6.8 Portada

- Queda: el fondo de calle de noche con reflectores, el logo **MARGOUSH** grande con su caída y rebote, y "TOCÁ PARA EMPEZAR". Después aparecen ¡JUGAR! y Ranking, como hoy. La música no cambia.
- Se quitan: BIG CHAKY con el cochecito, Douge y Marine, la cinta "EL RESCATE DE MARGOT" y "FACU PRESENTA".

## 7. Orden de entrega

Cada paso se publica en la vista previa para que Facu lo pruebe.

1. **Portada.**
2. **Comportamiento de los malos con el arte actual** (sección 6.3). No depende de los dibujos.
3. **Prompts de dibujos** para Facu: los 5 malos, Lale, Cepi y Pinky. Facu genera y sube las imágenes.
4. **Herramienta de recorte + dibujos de los malos** (6.1 y 6.2), a medida que llegan.
5. **Lale, Cepi y Pinky** con sus dibujos.
6. **Apariciones de Facu** (6.7).

## 8. Pruebas

Con el arnés actual (Chrome sin pantalla + bot): cada tipo de malo muestra sus poses según su estado; los que esperan no superan el límite de atacantes y miran al héroe; la embestida del patovica se anuncia ≥ 0,8 s antes; la manteca se anuncia antes de caer, patinar no saca vida y no te mete en un bache ni en el fuego; Cepi aparece solo al perder; Pinky aparece una vez por nivel y nunca con malos vivos; el auto de Facu ya no acompaña; la portada no muestra a BIG CHAKY; el peso total sigue por debajo de 6 MB; la suite completa sigue verde.

## 9. Lo que queda a criterio del constructor

Velocidades, distancias, tiempos y puntos exactos; tamaño de cada pose; color de fondo y método de recorte; redacción de los prompts; en qué alcantarilla y en qué momento aparece Facu; frases exactas, fuera de los ejemplos de arriba.
