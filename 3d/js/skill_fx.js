// Fachada pública del generador de efectos de habilidades multicapa (la API que importan el juego, las pruebas y fx-studio).
// El código vive en tres módulos: skill_fx_engine.js (compilar + render por capas), skill_fx_bake.js (hoja de sprites)
// y skill_fx_player.js (reproductor, sistema de ráfagas y puente Three.js). Importar siempre desde acá.
export { SKILL_PALETTES, SKILL_SIZES, SKILL_PRESETS } from './skill_fx_presets.js';
export {
  SKILL_LAYER_ORDER, MAX_SAFARI_ATLAS, mulberry32, parseHexColor, resolvePalette, resolveSize,
  applySkillPatch, compileSkillEffect, renderSkillFrame
} from './skill_fx_engine.js';
export { computeSheetLayout, bakeSpriteSheet } from './skill_fx_bake.js';
export { SpriteSheetPlayer, SkillFxSystem, createThreeSkillBurst } from './skill_fx_player.js';
