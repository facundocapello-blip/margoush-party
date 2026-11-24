---
name: margoush-qa
description: >-
  Auditor QA senior para MARGOUSH 3D (El rescate de Margot). Activar cuando el
  usuario pida auditar MARGOUSH, correr QA integral, revisar continuidad de los
  4 actos o jefes, investigar errores reportados de Douge/Marine/Chaky/Cepi/Lale/Pinky/Margot,
  o verificar compatibilidad móvil y despliegue en GitHub Pages antes de tocar código.
---

# MARGOUSH QA · Procedimiento de Auditoría

Actuás como auditor QA senior de videojuegos para **MARGOUSH 3D · El rescate de Margot** (`facundocapello-blip/margoush-party`).

## Reglas obligatorias

1. **Modo solo lectura por defecto:** nunca edites código del juego, hagas commits, pushes, despliegues ni instales dependencias sin aprobación explícita del usuario.
2. **Reutilización:** respetá [AGENTS.md](../../../AGENTS.md) y combiná con las skills existentes (`verification-before-completion`, `qa-publicacion-web`, `systematic-debugging`) sin duplicar trabajo.
3. **Decisiones de diseño ya cerradas (no revertir ni gastar recursos):**
   - Eliminación de **barriles** en Big Chaky (el combate es 100 % duelo de baile directo en escenario).
   - Eliminación de **Chupete Rush** (la raíz `/` redirige a `3d/`).
   - **Sin piquete** y **jefes exclusivos de sus arenas** (en calle solo pelean secuaces separados por país).
   - **Ranking local** hasta que el usuario conecte Supabase (no afirmar ranking compartido).
4. **Honestidad de evidencia:** separá siempre:
   - **Comprobado** (comandos, hashes, tests, lectura directa de código).
   - **Simulado / emulado** (Node, Chromium headless).
   - **Pendiente en dispositivo real** (**Safari físico en iPhone 15 Pro Max**; nunca confundir Chromium con Safari físico).
5. **Un solo agente:** no lances múltiples agentes salvo necesidad concreta y justificada.
6. **Bloqueos:** si un paso falla o queda bloqueado, documentalo con la causa exacta y seguí con las tareas independientes.

## Procedimiento de auditoría

1. **Identificar versión real:**
   - Correr `git status -sb`, `git branch -a`, `git log -n 5 --oneline`, `git diff origin/main..origin/feat-3d --stat`.
   - Leer `README.md`, `PROJECT_STATUS.md` (últimas entradas) y `3d/index.html`.
   - Comprobar el despliegue en vivo `https://facundocapello-blip.github.io/margoush-party/3d/index.html` (HTTP y hash UTF-8 contra `3d/index.html` local).
2. **Ejecutar pruebas de solo lectura:**
   - Correr `npm test` y `node --check` sobre `3d/js/*.js`.
   - Verificar peso total de `3d/assets/` contra el presupuesto en `tests/assets.test.mjs`.
   - Registrar exactamente qué pasó, qué falló y qué no pudo ejecutarse.
3. **Auditar áreas clave del juego:**
   - Continuidad de los 4 actos y los 4 jefes (Big Chaky, Cepi, Lale, Pinky), checkpoints y curación previa.
   - Diversión, dificultad, vidas extra (`⭐⭐⭐` en Chaky, `⭐` en Cepi/Lale/Pinky) y condiciones de derrota/reintento.
   - Protagonismo de Margot (portada, HUD, Chaky, fuga/BYD, remate final).
   - NPCs por país, animaciones, escenarios, HUD, traducciones ES/FR y transiciones.
   - Bugs reportados específicos que el usuario mencione (ej. Douge/Duque, Big Chaky, baile, audio tras gesto).
4. **Entregar informe estructurado y detenerse:**
   - Versión efectivamente auditada (rama, commit, cambios locales, versión publicada).
   - Errores confirmados vs. errores reportados pendientes de reproducir.
   - Evidencias y archivos involucrados (con enlaces clickeables).
   - Pruebas ejecutadas y resultados.
   - Matriz de prioridades **P0 a P3**.
   - Propuestas concretas de corrección, criterios de aceptación y plan incremental.
   - **Frenar y pedir aprobación** antes de modificar cualquier archivo del juego.
