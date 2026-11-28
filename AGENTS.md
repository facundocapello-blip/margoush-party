# Instrucciones para agentes — MARGOUSH PARTY

- Leer README.md, `3d/index.html`, PROJECT_STATUS.md y estado de GitHub Pages antes de editar. Verificar rama, diff y recursos existentes.
- La raíz (`index.html`) redirige a `3d/`, donde vive **MARGOUSH 3D · El rescate de Margot** (4 actos). *Chupete Rush* fue eliminado y los barriles de Big Chaky fueron reemplazados por el duelo de baile; no restaurarlos. La referencia vigente es `main`.
- Equipo de agentes del workspace (`.agents/skills/`):
  - **Auditores (solo lectura):** `margoush-qa` (calidad/continuidad/deploy), `margoush-gameplay` (jugabilidad/ritmo/ES-FR), `margoush-visual` (arte/UI/HUD iPhone), `margoush-perf` (performance Three.js/Safari).
  - **Productores (solo con OK del usuario):** `margoush-art` (imágenes faltantes/sprites/`manifest.json`), `margoush-dev` (código `3d/`, `stamp_versions.mjs`, `npm test`, `PROJECT_STATUS.md`, deploy).
- Para retomar en `feat-3d`, incorporá `main` primero. El flujo de esa rama publica automáticamente en GitHub Pages. Tras editar JS o CSS de `3d/`, regenerá las versiones con `node tools/stamp_versions.mjs` y corré `npm test`.
- Mantener controles táctiles (joystick flotante + botones en arco), idiomas español/francés (`ES`/`FR`), música/audio tras gesto del usuario y puntuaciones locales. No afirmar ranking compartido.
- Priorizar Safari iPhone (iPhone 15 Pro Max) y audio tras gesto del usuario. No confundir prueba de Chromium con Safari físico.
- Cambios incrementales; preservar versiones y recursos. No modificar otros proyectos.
- Publicar pruebas personales mediante GitHub Pages HTTPS con rollback, comprobar el despliegue si las herramientas lo permiten y entregar URL. No entregar solo HTML/ZIP.
- Registrar resultados verificables y pendientes en PROJECT_STATUS.md.
- **Regla del usuario:** al terminar cualquier cambio, siempre dejarlo listo para probar: commit, push y pasarlo a `feat-3d` (publica solo en GitHub Pages), y entregar el link. No quedarse en una rama sin publicar. Con el rollback anotado en PROJECT_STATUS.md.
- **Regla del usuario (pruebas):** antes de entregar el link, hacer 2 pruebas como si fuera el usuario: (1) Chrome de escritorio (1280×720) y (2) celular (emulación iPhone 15 Pro Max 430×932, táctil, con los botones en pantalla). Jugar de verdad el cambio (no solo `npm test`), mirar capturas y errores de consola. Hay una base en `tests/e2e/golpe_feel.e2e.mjs`. Decir siempre que es Chromium emulado y no Safari físico.
