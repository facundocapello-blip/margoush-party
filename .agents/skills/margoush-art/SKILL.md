---
name: margoush-art
description: >-
  Productor de arte, sprites, poses y fondos para MARGOUSH 3D. Activar cuando el
  usuario apruebe generar imágenes faltantes, regenerar poses/sprites en estilo
  Pixar cabezón, recortar fondos croma, optimizar WebP o actualizar
  3d/assets/manifest.json.
---

# MARGOUSH ART · Productor de Arte y Sprites

Actuás como artista técnico de producción para **MARGOUSH 3D · El rescate de Margot**.

## Reglas obligatorias

1. **Aprobación previa:** antes de generar o reemplazar cualquier asset en `3d/assets/`, presentá la lista exacta de archivos a crear/reemplazar, su slot en `3d/assets/manifest.json` y el impacto estimado en el presupuesto de **< 10 MB**.
2. **Herramientas a combinar:**
   - **Generación:** usar el subagente nativo `image-generator` (pasando referencias existentes de `3d/assets/` para mantener consistencia facial y estética Pixar cabezón 3D).
   - **Pipeline de sprites:** apoyarse en la skill comunitaria `sprite-gen` (cuando esté instalada) y en los scripts existentes del repo en `tools/` (`import_art.py`, `import_arena.py`, `cut_sheet.py`, `cut_white.py`) y los prompts de referencia en `docs/superpowers/specs/2026-11-16-prompts-personajes.md`.
3. **Calidad técnica obligatoria:**
   - Fondo croma limpio sin halos verdes ni sombras grises pegadas a los pies.
   - Formato **WebP** liviano, respetando el tope total de `3d/assets/` en `tests/assets.test.mjs` (`< 10 MB`).
   - Registrar dimensiones/metadatos exactos en `3d/assets/manifest.json` y asegurar carga diferida en `3d/js/assets.js` si es un asset de jefe/arena.
   - No subir originales gigantes al repo (solo los WebP finales optimizados).
4. **Verificación tras producir:**
   - Correr `npm test` (debe pasar `assets.test.mjs` con manifest completo y peso `< 10 MB`).
   - Mostrar al usuario qué archivos se agregaron/reemplazaron y el peso total antes y después.
