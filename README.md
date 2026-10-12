# MARGOUSH PARTY · Chupete Rush

Juego familiar independiente de Floot. Publicado en **GitHub Pages**:

**https://facundocapello-blip.github.io/margoush-party/**

## Qué incluye
- Minijuego de 30 segundos, control táctil por arrastre de la canasta.
- Diseño pastel para iPhone y escritorio; idiomas español y francés.
- Dificultad progresiva a los 10 y 20 segundos.
- Chupetes dorados, obstáculos, combos de cinco y multiplicador ×2 durante 4,5 segundos.
- Banda sonora original *Petit Sprint* (archivo `assets/petit-sprint.mp3`) y efectos; se activan al tocar Jugar.
- Récords y clasificación semanal/histórica **locales**, guardados en el navegador del jugador.

## Importante sobre el ranking
**GitHub Pages es hosting estático.** El ranking actual es **solo del dispositivo**, no se comparte entre familiares. Para habilitar el ranking individual compartido se necesita un backend y una base de datos persistente (por ejemplo, Supabase). No mostrarlo como online hasta que esté conectado y probado.

## Cómo actualizar
Modificar `index.html` y/o `assets/petit-sprint.mp3` en la rama `main`. GitHub Pages publica automáticamente desde `main` / `(root)`. No hay créditos de compilación de Floot.

## Pruebas
- HTML ejecutado con Chromium en viewport móvil 393×852 y escritorio 1280×800: se verificó renderizado, pantalla inicial, entrada de apodo, arranque, cuenta regresiva y reproducción del MP3.
- Se confirmó que el sitio publicado responde y presenta el título correcto.
- **Pendiente:** prueba manual en Safari físico de iPhone y validación del ranking compartido (aún no implementado).

## Fuente
Migración independiente V0.2. El juego de plataformas anterior y otros proyectos no se modificaron.
