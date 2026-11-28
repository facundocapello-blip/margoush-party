// Propuestas de portada (para elegir): ?portada=a | b | c en la dirección.
//  a) Póster de película: la familia adelante, la sombra de BIG CHAKY atrás, atardecer porteño.
//  b) Postal Buenos Aires → París: las dos ciudades del juego; el idioma son los sellos de cada ciudad.
//  c) Fileteado arcade: marco porteño, Margot en la «O» y la tabla de récords de los fichines.
// Facu eligió la A (20/11): es la portada por defecto. ?portada=b|c muestra las otras; ?portada=vieja la de antes. Cada propuesta usa los mismos ids que la actual
// (btn-play, lang-pick, btn-ranking, podium-*, btn-continue): main.js no cambia.

const PLANE = '<svg class="plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>';
const CROWN = '<svg class="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5z"/><rect x="5" y="19.2" width="14" height="2.3" rx="1"/></svg>';
// Rulo de fileteado (una esquina; las otras tres son la misma girada)
const FILETE = `<svg class="filete" viewBox="0 0 120 120" aria-hidden="true">
  <path d="M8 112 V40 C8 18 22 8 44 8 H112" fill="none" stroke="#e8b23a" stroke-width="4"/>
  <path d="M16 112 V44 C16 26 26 16 44 16 H112" fill="none" stroke="#3f8fd8" stroke-width="2.5"/>
  <path d="M30 70 C30 46 46 30 70 30 C86 30 92 44 82 52 C74 58 64 50 70 44" fill="none" stroke="#e8b23a" stroke-width="4" stroke-linecap="round"/>
  <path d="M38 88 C40 70 52 58 66 60" fill="none" stroke="#d8343f" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M88 38 C70 40 58 52 60 66" fill="none" stroke="#d8343f" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="70" cy="44" r="4" fill="#f4efe4"/><circle cx="44" cy="44" r="6" fill="#d8343f"/><circle cx="44" cy="44" r="2.5" fill="#f4efe4"/>
  <path d="M24 30 l6 -12 l6 12 l-6 6z" fill="#3f8fd8"/>
</svg>`;

const LANG = (cls = '') => `<div id="lang-pick" class="lang-pick ${cls}" role="group" aria-label="Idioma">
  <button data-lang="es" aria-label="Español"><i class="flag flag-ar" aria-hidden="true"></i><span>ES</span></button>
  <button data-lang="fr" aria-label="Français"><i class="flag flag-fr" aria-hidden="true"></i><span>FR</span></button>
</div>`;
const CONTINUE = '<button id="btn-continue" class="big-btn alt hidden">▶ CONTINUAR<small id="continue-where"></small></button>';
const PODIUM = (cls) => `<section id="cover-podium" class="${cls}" aria-label="Ranking">
  <h2 id="podium-title">Podio de la semana</h2>
  <ol id="podium-list"></ol>
  <p id="podium-empty" class="podium-empty hidden">Todavía nadie en el podio. ¡El primer lugar es tuyo!</p>
</section>`;

// Atajos para ir directo a cada jefe (demo / pruebas): main.js los conecta por #boss-jump [data-probar]
const BOSS_JUMP = `<div id="boss-jump" class="boss-jump" role="group" aria-label="Ir directo al jefe">
  <span class="boss-jump-t">Jefes</span>
  <div class="boss-jump-row">
    <button data-probar="chaky">🕺 CHAKY</button><button data-probar="cepi">🎾 CEPI</button><button data-probar="lale">🧈 LALE</button><button data-probar="pinky">🅿️ PINKY</button><button data-probar="facu">🎨 FACU</button>
  </div>
</div>`;

const STAR_EMBLEM = `<svg class="pa-star-svg" viewBox="0 0 240 240" aria-hidden="true">
  <defs>
    <radialGradient id="pa-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff6b8" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#ffd24c" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ff9922" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pa-gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff3a8"/>
      <stop offset="48%" stop-color="#ffd042"/>
      <stop offset="100%" stop-color="#f29416"/>
    </linearGradient>
  </defs>
  <circle cx="120" cy="122" r="114" fill="url(#pa-halo)"/>
  <path d="M120 14 L149 76 L217 85 L167 132 L179 200 L120 167 L61 200 L73 132 L23 85 L91 76 Z"
    fill="url(#pa-gold)" stroke="#fff8d6" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="46" cy="102" r="3.5" fill="#fffbe6"/><circle cx="194" cy="102" r="3.5" fill="#fffbe6"/>
  <path d="M58 52 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z M184 48 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5z" fill="#fff9d2"/>
</svg>`;
const STAR_FRONT = `<svg class="pa-star-front" viewBox="0 0 240 240" aria-hidden="true">
  <path d="M73 132 L120 156 L167 132 L179 200 L120 167 L61 200 Z" fill="url(#pa-gold)"/>
  <path d="M167 132 L179 200 L120 167 L61 200 L73 132" fill="none" stroke="#fff8d6" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="84" cy="166" r="3.2" fill="#fffbe6"/><circle cx="156" cy="166" r="3.2" fill="#fffbe6"/>
</svg>`;

const TEMPLATES = {
  a: `
    <div class="pa-bg" aria-hidden="true"></div>
    <div class="pa-plane-trail" aria-hidden="true">${PLANE}</div>
    <div class="pa-family" aria-hidden="true">
      <div class="pa-star-hero">${STAR_EMBLEM}<i class="pa-margot"></i>${STAR_FRONT}</div>
      <i class="pa-douge"></i>
      <i class="pa-marine"></i>
    </div>
    <div class="pa-top">${LANG('pa-lang')}</div>
    <button id="btn-mute-menu" class="icon-btn pa-mute" aria-label="Silenciar">♪</button>
    <div class="pa-title"><h1 class="pa-logo">MARGOUSH</h1><p class="pa-tag">¡El rescate de Margot!</p></div>
    <div class="pa-actions">
      ${PODIUM('pa-record')}
      ${CONTINUE}
      <button id="btn-play" class="pa-play">¡JUGAR!</button>
      <button id="btn-ranking" class="pa-link">Ver ranking completo</button>
      ${BOSS_JUMP}
    </div>`,
  b: `
    <div class="pb-ba" aria-hidden="true"></div>
    <div class="pb-fr" aria-hidden="true"></div>
    <svg class="pb-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M8 30 C 40 40, 60 58, 92 70" /></svg>
    <div class="pb-plane" aria-hidden="true">${PLANE}</div>
    <div class="pb-card">
      <h1 class="pb-logo">Margoush</h1>
      <p class="pb-route-txt">Buenos Aires <span>✦</span> París</p>
    </div>
    <div id="lang-pick" class="pb-stamps" role="group" aria-label="Idioma">
      <button data-lang="es" class="pb-stamp pb-stamp-es" aria-label="Español"><i class="flag flag-ar" aria-hidden="true"></i><b>ESPAÑOL</b><small>BUENOS AIRES</small></button>
      <button data-lang="fr" class="pb-stamp pb-stamp-fr" aria-label="Français"><i class="flag flag-fr" aria-hidden="true"></i><b>FRANÇAIS</b><small>PARIS</small></button>
    </div>
    <div class="pb-bottom">
      ${PODIUM('pb-board')}
      ${CONTINUE}
      <button id="btn-play" class="pb-ticket"><span class="pb-ticket-main">¡JUGAR!</span><span class="pb-ticket-stub">BUE ${PLANE} PAR</span></button>
      <button id="btn-ranking" class="pb-link">Ver ranking completo</button>
    </div>`,
  c: `
    <div class="pc-frame" aria-hidden="true">${FILETE}${FILETE}${FILETE}${FILETE}</div>
    <div class="pc-top">${LANG('pc-lang')}</div>
    <h1 class="pc-logo" aria-label="MARGOUSH">MARG<i class="pc-o" aria-hidden="true"></i>USH</h1>
    <p class="pc-tag">Un rescate de película, de Buenos Aires a París</p>
    ${PODIUM('pc-scores')}
    <div class="pc-actions">
      ${CONTINUE}
      <button id="btn-play" class="pc-play">¡JUGAR!</button>
      <button id="btn-ranking" class="pc-link">Ver ranking completo</button>
    </div>
    <i class="pc-douge" aria-hidden="true"></i><i class="pc-marine" aria-hidden="true"></i>`
};

export const COVER_VARIANT = (() => {
  let v = null;
  try { v = new URLSearchParams(location.search).get('portada'); } catch (_) {}
  v = (v || 'a').toLowerCase(); // la A (póster) es la portada elegida; ?portada=vieja muestra la anterior
  return TEMPLATES[v] ? v : null;
})();

// Reemplaza el contenido de la portada antes de que main.js conecte los botones
if (COVER_VARIANT) {
  const menu = document.getElementById('screen-menu');
  if (menu) { menu.dataset.v = COVER_VARIANT; menu.innerHTML = TEMPLATES[COVER_VARIANT]; }
}
