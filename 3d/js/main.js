import './cover.js'; // propuestas de portada (?portada=a|b|c): tiene que correr antes de conectar los botones
import { loadAssets } from './assets.js';
import { buildStreet } from './world.js';
import { createInput } from './input.js';
import { createScore } from './score.js';
import { createFx } from './fx.js';
import { createHero, HERO_CFG, POWER, SWINGS, WALK } from './hero.js';
import { createEnemies } from './enemies.js';
import { registerSkins } from './skins.js';
import { createTraps } from './traps.js';
import { createProps } from './props.js';
import { createButter } from './butter.js';
import { createPsycho } from './psycho.js';
import { createPowers } from './powers.js';
import { createCameos } from './cameos.js';
import { createArena } from './arena.js';
import { createCepiArena } from './arena_cepi.js';
import { createLaleArena } from './arena_lale.js';
import { createPinkyArena } from './arena_pinky.js';
import { createFacuArena } from './arena_facu.js';
import { createChase } from './chase.js';
import { createBonus } from './bonus.js';
import { createStory } from './story.js';
import { createAudio } from './audio.js';
import { createUi } from './ui.js';
import { createRanking } from './ranking.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { LEVELS, WAVES, SECRET_X, GALPON_X, BORDER_X } from './level.js';
import { tr, fillText, translateDom, setLang, getLang, onLangChange } from './i18n.js';
import { isReducedMotion, setReducedMotion } from './feedback.js';
import { createMargot } from './margot.js';
import { SpriteActor } from './sprites.js';

const freshWaves = () => Object.fromEntries(WAVES.map(w => [w.id, 'idle']));

const $ = (s) => document.querySelector(s);
const canvas = $('#game');

let renderer;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
const PITCH = THREE.MathUtils.degToRad(30);
const BASE_DIST = 11.5;
const PORTRAIT = { fov: 60, halfWidth: 3.2 }; // parado: más cerca (personajes más grandes); los que quedan afuera se marcan con flechas
let camDist = BASE_DIST;
const camTarget = new THREE.Vector3(6, 1.2, 0);

const game = {
  state: 'loading',
  heroId: 'douge',
  hero: null,
  enemies: null,
  props: null,
  score: createScore(),
  time: 0,
  stats: { maxMult: 1 },
  waves: freshWaves(),
  level: 1,
  lowQuality: false,
  timeScale: 1 // para revisar animaciones en cámara lenta
};
window.__game = game;

let assets, world, input, fx, audio, ui;
const TOUCH = matchMedia('(pointer: coarse)').matches;

// Rendimiento: mide la lógica por cuadro y baja la calidad si el equipo no llega a 38 FPS sostenidos
const QUALITY_DPR = [2, 1.25, 1, 0.8];
game.perf = (() => {
  let frames = 0, frameMs = 0, logicMs = 0, slow = 0;
  return {
    level: 0,
    reset() { frames = 0; frameMs = 0; logicMs = 0; slow = 0; },
    record(dtMs, logic) {
      frames++; frameMs += dtMs; logicMs += logic;
      slow = dtMs > 1000 / 38 ? slow + dtMs / 1000 : Math.max(0, slow - dtMs / 2000);
      if (slow > 2.5 && this.level < QUALITY_DPR.length - 1) {
        this.level++;
        slow = 0;
        game.lowQuality = true;
        resize();
      }
    },
    summary() { return { frames, avgFrameMs: frameMs / Math.max(1, frames), logicMs: logicMs / Math.max(1, frames), level: this.level }; }
  };
})();
game.pixelRatio = () => renderer.getPixelRatio();
game.memory = () => renderer ? { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures } : null;
let bannerTimer = 0;

// ---------- combo visible ----------
game.combo = (() => {
  let n = 0, t = 0;
  const el = $('#combo'), num = $('#combo-num');
  return {
    add(k) {
      n += k; t = 1.6;
      if (n >= 3) {
        num.textContent = n;
        el.classList.remove('hidden', 'bump'); void el.offsetWidth; el.classList.add('bump');
      }
    },
    reset() { n = 0; t = 0; el.classList.add('hidden'); },
    update(dt) { if (t > 0) { t -= dt; if (t <= 0) { n = 0; el.classList.add('hidden'); } } },
    get count() { return n; }
  };
})();

// Un solo canal de mensajes: se muestran de a uno, en orden
const bannerQueue = [];
let bannerCurrent = null;
// Carteles: aviso chico arriba (no en el medio del juego), cortos, y si hay otro esperando el actual se apura
const BANNER = { max: 2.6, hurry: 1.1, queue: 2 };
game.banner = (title, text, seconds = BANNER.max, opts = {}) => {
  if (bannerCurrent?.title === title || bannerQueue.some(b => b.title === title)) return; // sin repetidos
  if (bannerQueue.length >= BANNER.queue) bannerQueue.shift();
  bannerQueue.push({ title, text, seconds: Math.min(seconds, BANNER.max), avatar: opts.avatar || null });
  if (!bannerCurrent) nextBanner();
  else bannerTimer = Math.min(bannerTimer, BANNER.hurry);
};
function nextBanner() {
  const b = $('#banner');
  bannerCurrent = bannerQueue.shift() || null;
  if (!bannerCurrent) { b.classList.add('hidden'); return; }
  b.replaceChildren();
  if (bannerCurrent.avatar) {
    const img = document.createElement('img');
    img.src = bannerCurrent.avatar; img.alt = '';
    b.append(img);
  }
  const body = document.createElement('div');
  const strong = document.createElement('b');
  strong.textContent = tr(bannerCurrent.title);
  const txt = document.createElement('span');
  fillText(txt, bannerCurrent.text);
  body.append(strong, txt);
  b.append(body);
  b.classList.toggle('with-avatar', !!bannerCurrent.avatar);
  b.classList.remove('hidden');
  bannerTimer = bannerQueue.length ? Math.min(bannerCurrent.seconds, BANNER.hurry + 0.6) : bannerCurrent.seconds;
}
function clearBanners() {
  bannerQueue.length = 0;
  bannerCurrent = null;
  bannerTimer = 0;
  $('#banner').classList.add('hidden');
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY_DPR[game.perf.level]));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Celu parado: lente más abierta y menos calle a lo ancho, para que los personajes no queden chiquitos
  game.portrait = camera.aspect < 0.9;
  camera.fov = game.portrait ? PORTRAIT.fov : 40;
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camDist = Math.max(BASE_DIST, (game.portrait ? PORTRAIT.halfWidth : 6) / (halfV * camera.aspect));
  document.body.classList.toggle('portrait', game.portrait);
  camera.updateProjectionMatrix();
  updateRotateHint();
}

// Se juega igual con el celu parado o acostado (la cámara se adapta en resize)
function updateRotateHint() {}

function updateCamera(dt, snap = false) {
  if (!game.hero) return;
  const p = game.hero.actor.position;
  const look = game.hero.actor.facing * (game.portrait ? 2.2 : 1.6);
  const tx = Math.min(world.bounds.maxX - 4, Math.max(world.bounds.minX + 4, p.x + look));
  const k = snap ? 1 : Math.min(1, dt * 4.5);
  camTarget.x += (tx - camTarget.x) * k;
  camTarget.z += (p.z * 0.35 - camTarget.z) * k;
  camera.position.set(camTarget.x, camTarget.y + Math.sin(PITCH) * camDist, camTarget.z + Math.cos(PITCH) * camDist);
  camera.lookAt(camTarget);
  fx.applyShake(dt);
}

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
  document.body.classList.toggle('has-screen', !!id);
  queueMicrotask(updateRotateHint);
}

const hudDom = { hearts: null, score: null, mult: null, pwFill: null, pwBox: null, pwText: null, margot: null, atk: null, offscreen: null };
const hudPrev = { hearts: '', score: -1, mult: '', pw: '', ready: null, pwText: '', hold: '', charging: null };
function updateHud(dt = 0) {
  const h = game.hero;
  if (!hudDom.hearts) {
    hudDom.hearts = $('#hud-hearts'); hudDom.score = $('#hud-score'); hudDom.mult = $('#hud-mult');
    hudDom.pwFill = $('#hud-power-fill'); hudDom.pwBox = $('#hud-power'); hudDom.pwText = $('#hud-power-text');
    hudDom.margot = $('#hud-margot'); hudDom.atk = $('#act-attack'); hudDom.offscreen = $('#offscreen');
  }
  const shown = Math.min(5, h.hpMax);
  const full = Math.min(shown, Math.ceil(h.hp * shown / h.hpMax));
  const heartsTxt = '❤️'.repeat(full) + '🖤'.repeat(shown - full);
  if (heartsTxt !== hudPrev.hearts) { hudPrev.hearts = heartsTxt; hudDom.hearts.textContent = heartsTxt; }
  if (game.score.total !== hudPrev.score) { hudPrev.score = game.score.total; hudDom.score.textContent = game.score.total.toLocaleString('es-AR'); }
  const m = game.score.multiplier, multTxt = m > 1 ? '×' + m.toFixed(1) : '';
  if (multTxt !== hudPrev.mult) { hudPrev.mult = multTxt; hudDom.mult.textContent = multTxt; }
  const pw = Math.min(1, h.power), ready = pw >= 1, pwPct = (pw * 100).toFixed(1) + '%';
  if (pwPct !== hudPrev.pw) { hudPrev.pw = pwPct; hudDom.pwFill.style.width = pwPct; hudDom.atk.style.setProperty('--pw', pw.toFixed(3)); }
  if (ready !== hudPrev.ready) { hudPrev.ready = ready; hudDom.pwBox.classList.toggle('ready', ready); hudDom.atk.classList.toggle('ready', ready); }
  const mood = game.margot?.mood(h) || 'calm';
  if (hudDom.margot.dataset.mood !== mood) { hudDom.margot.dataset.mood = mood; hudDom.margot.classList.remove('bump'); void hudDom.margot.offsetWidth; hudDom.margot.classList.add('bump'); }
  const pwLabel = ready ? tr(TOUCH ? '⚡ ¡PODER LISTO!' : '⚡ ¡PODER LISTO! (L)') : tr('PODER');
  if (pwLabel !== hudPrev.pwText) { hudPrev.pwText = pwLabel; hudDom.pwText.textContent = pwLabel; }
  const holdStr = Math.min(1, h.holdT / POWER.hold).toFixed(3);
  if (holdStr !== hudPrev.hold) { hudPrev.hold = holdStr; hudDom.atk.style.setProperty('--hold', holdStr); }
  if (ready && hudDom.atk.dataset.ready !== tr('⚡ ¡PODER!')) hudDom.atk.dataset.ready = tr('⚡ ¡PODER!');
  const charging = ready && h.holdT > 0.08;
  if (charging !== hudPrev.charging) { hudPrev.charging = charging; hudDom.atk.classList.toggle('charging', charging); }
}

function clearRun() {
  clearCurtain();
  game.levelExit = false;
  game.pausedFrom = null;
  game.wantPhoto = false;
  game.photo = null;
  game.chase?.dispose();
  game.chaseDone = false;
  game.bossStarted = false;
  game.enemies?.resetIntros?.();
  game.enemies?.clear();
  game.butter?.clear();
  game.cameos?.clear();
  game.margot?.clear();
  game.psycho?.stop();
  game.powers?.clear();
  game.traps?.reset();
  game.arena?.dispose();
  game.arenaCepi?.dispose();
  game.arenaLale?.dispose();
  game.arenaPinky?.dispose();
  game.arenaFacu?.dispose();
  game.bonus?.dispose();
  game.bossStarted = false;
  game.chakyDone = false;
  game.cepiDone = false;
  game.laleDone = false;
  game.story?.endIntro();
  game.story?.resetCage();
  fx.clear();
  game.combo.reset();
  world.resetGates();
  game.waves = freshWaves();
  setLevel(1);
  $('#level-card')?.classList.add('hidden');
}

function setLevel(n) {
  game.level = n;
  const L = LEVELS[n - 1];
  world.setLevelBounds(L.minX, L.maxX);
}

// ---------- checkpoints ----------
// Campaña de 4 actos: checkpoint automático al entrar a cada Acto y a cada Jefe.
// Queda guardado en el celu para «CONTINUAR» desde el menú o reintentar en 1 toque.
const CP_KEY = 'margoush3d_checkpoint';
const CHECKPOINTS = {
  calle:   { label: 'ACTO 1 · BUENOS AIRES', short: 'Acto 1 · Buenos Aires' },
  chaky:   { label: '¡LLEGASTE AL HANGAR VIP!', short: 'Hangar · BIG CHAKY' },
  acto2:   { label: 'ACTO 2 · ¡SEGUÍ AL BYD!', short: 'Acto 2 · Persecución BYD' },
  byd:     { label: 'ACTO 2 · ¡ROMPÉ EL BYD!', short: 'el BYD de Cepi' },
  cepi:    { label: 'CEPI SE QUEDÓ SIN BYD… ¡PERO NO SIN PALETA!', short: 'Cepi (Pádel)' },
  acto3:   { label: 'ACTO 3 · PARÍS (BOULANGERIE)', short: 'Acto 3 · París' },
  lale:    { label: '¡LLEGASTE A LA CASA CENTRAL DE LE BLÉ!', short: 'Lale (Casa central)' },
  acto4:   { label: 'ACTO 4 · FERME LAPADITE → GALPÓN', short: 'Acto 4 · Galpón' },
  pinky:   { label: 'ÚLTIMA PARADA · EL GALPÓN', short: 'Pinky (Final)' },
  facu:    { label: 'ACTO 5 · LA GALERÍA HENRIS', short: 'Facu (Final)' },
  // compatibilidad con checkpoints previos guardados en localStorage
  francia: { label: 'ACTO 3 · PARÍS (BOULANGERIE)', short: 'París' },
  boss:    { label: '¡LLEGASTE AL HANGAR VIP!', short: 'Hangar · BIG CHAKY' }
};
function saveCheckpoint(id) {
  game.checkpoint = { id, heroId: game.heroId, score: game.score?.total ?? 0, time: Math.round(game.time || 0) };
  if (PROBAR) return;
  try { localStorage.setItem(CP_KEY, JSON.stringify(game.checkpoint)); } catch (_) {}
}
function storedCheckpoint() {
  if (PROBAR) return null;
  try {
    const c = JSON.parse(localStorage.getItem(CP_KEY) || 'null');
    return c && CHECKPOINTS[c.id] && HERO_CFG[c.heroId] ? c : null;
  } catch (_) { return null; }
}
function clearCheckpoint() {
  game.checkpoint = null;
  if (PROBAR) return;
  try { localStorage.removeItem(CP_KEY); } catch (_) {}
}
game.storedCheckpoint = storedCheckpoint;
// Menú: «CONTINUAR» aparece si quedó un checkpoint guardado (con quién y desde dónde)
function paintContinue() {
  const cp = storedCheckpoint(), btn = $('#btn-continue');
  if (!btn) return;
  btn.classList.toggle('hidden', !cp);
  if (cp) $('#continue-where').textContent = `${HERO_CFG[cp.heroId].name} · ${tr(CHECKPOINTS[cp.id].short)}`;
}

// Portada: el podio (los 5 mejores de la semana; si nadie jugó esta semana, los mejores de siempre)
let podiumSeq = 0;
async function paintPodium() {
  const list = $('#podium-list'), empty = $('#podium-empty'), title = $('#podium-title');
  if (!list || !game.ranking) return;
  const seq = ++podiumSeq;
  let period = 'week', res = await game.ranking.top({ period, limit: 5 }).catch(() => ({ rows: [] }));
  if (!res.rows?.length) {
    const all = await game.ranking.top({ period: 'all', limit: 5 }).catch(() => ({ rows: [] }));
    if (all.rows?.length) { period = 'all'; res = all; }
  }
  if (seq !== podiumSeq) return;
  const rows = res.rows || [];
  title.textContent = tr(period === 'week' ? 'Podio de la semana' : 'Los mejores de siempre');
  empty.classList.toggle('hidden', rows.length > 0);
  list.replaceChildren(...rows.map((r, i) => {
    const li = document.createElement('li');
    const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = String(i + 1);
    const who = document.createElement('span'); who.className = 'who';
    const hero = HERO_CFG[r.hero] ? r.hero : 'douge';
    who.style.backgroundImage = `url(${assets.url(HERO_CFG[hero].poses.idle.tex)})`;
    who.title = HERO_CFG[hero].name;
    const nick = document.createElement('span'); nick.className = 'nick'; nick.textContent = r.nickname;
    const pts = document.createElement('span'); pts.className = 'pts'; pts.textContent = Number(r.score).toLocaleString('es-AR');
    li.append(pos, who, nick, pts);
    return li;
  }));
}
game.paintPodium = paintPodium;

function clearWavesBefore(firstIdx) {
  WAVES.forEach((w, i) => {
    if (i >= firstIdx) return;
    game.waves[w.id] = 'cleared';
    if (w.gate != null) { const g = world.gates[w.gate]; g.open = true; g.t = 0; }
  });
}

// Arranca una partida directamente en un checkpoint, con vida llena y el puntaje que había ahí
function resumeAt(cp) {
  if (!cp || !CHECKPOINTS[cp.id]) return startRun(game.heroId, false);
  startRun(cp.heroId, false, { keepCheckpoint: true, street: true });
  game.checkpoint = cp;
  game.score.restore(cp.score);
  game.time = cp.time || 0;
  const id = cp.id;
  if (id === 'calle') {
    game.state = 'curtain';
    curtain(() => { game.state = 'playing'; input.reset(); audio.music('ba', { fade: 0 }); }, { label: CHECKPOINTS.calle.label });
    return;
  }
  if (id === 'chaky' || id === 'boss') {
    clearWavesBefore(WAVES.findIndex(w => w.level === 2));
    game.hero.actor.position.set(LEVELS[0].maxX - 4, 0, 0);
    updateCamera(0, true);
    spawnBoss();
    return;
  }
  if (id === 'acto2') {
    game.chakyDone = true;
    startChaseRun();
    return;
  }
  if (id === 'byd') {
    game.chakyDone = true;
    game.state = 'curtain';
    audio.music('byd', { fade: 0 });
    curtain(() => startBydLevel(), { label: CHECKPOINTS.byd.label });
    return;
  }
  if (id === 'cepi') {
    game.chakyDone = true;
    spawnCepi();
    return;
  }
  world.border?.raise?.();
  setLevel(2);
  game.chakyDone = true;
  game.cepiDone = true;
  game.cameos.pinky.shown = { 1: true, 2: id !== 'acto3' && id !== 'francia' };
  game.cameos.onLevelStart();
  const p = game.hero.actor.position;
  if (id === 'acto3' || id === 'francia') {
    clearWavesBefore(WAVES.findIndex(w => w.level === 2));
    p.set(LEVELS[1].start, 0, 0);
    updateCamera(0, true);
    game.state = 'curtain';
    curtain(() => { game.state = 'playing'; input.reset(); audio.music('francia', { fade: 0 }); }, { label: CHECKPOINTS.acto3.label });
    return;
  }
  if (id === 'lale') {
    clearWavesBefore(WAVES.findIndex(w => w.id === 'boulevard-2'));
    p.set(206, 0, 0);
    updateCamera(0, true);
    spawnLale();
    return;
  }
  game.laleDone = true;
  if (id === 'acto4') {
    clearWavesBefore(WAVES.findIndex(w => w.id === 'boulevard-2'));
    p.set(228, 0, 0);
    updateCamera(0, true);
    game.state = 'curtain';
    curtain(() => { game.state = 'playing'; input.reset(); audio.music('francia', { fade: 0 }); }, { label: CHECKPOINTS.acto4.label });
    return;
  }
  if (id === 'facu') {
    clearWavesBefore(WAVES.length);
    p.set(GALPON_X + 8, 0, 0);
    updateCamera(0, true);
    spawnFacu();
    return;
  }
  // pinky (jefe final)
  clearWavesBefore(WAVES.length);
  p.set(GALPON_X + 8, 0, 0);
  updateCamera(0, true);
  spawnPinky();
}
game.resumeAt = resumeAt;

function startRun(heroId, withIntro = false, { keepCheckpoint = false, street = false } = {}) {
  if (!keepCheckpoint) clearCheckpoint();
  game.heroId = heroId;
  audio.setHero?.(heroId);
  if (game.hero) game.hero.actor.dispose();
  clearRun();
  const ctx = game.ctx;
  game.hero = createHero(heroId, ctx);
  game.hero.actor.position.set(LEVELS[0].start, 0, 0.5);
  game.score = createScore();
  game.stats = { maxMult: 1 };
  game.props.reset();
  game.time = 0;
  last = 0;
  input.reset();
  showScreen(null);
  $('#hud').classList.remove('hidden');
  $('#hud-name').textContent = HERO_CFG[heroId].name;
  $('#hud-portrait').style.backgroundImage = `url(${assets.url(HERO_CFG[heroId].poses.idle.tex)})`;
  if (TOUCH) $('#touch').classList.remove('hidden');
  updateCamera(0, true);
  resize();
  clearBanners();
  $('#boss-bar').classList.add('hidden');
  // Acto 1: Intro → Calle porteña (Buenos Aires) → BIG CHAKY en Ezeiza
  audio.music(withIntro ? 'intro' : 'ba', { fade: 0 });
  if (withIntro) { game.state = 'intro'; game.story.startIntro(game.hero, heroId, 'intro'); }
  else {
    game.state = 'playing';
    if (!keepCheckpoint && !street) saveCheckpoint('calle');
  }
  updateRotateHint();
}

// Termina (o se saltea) una escena animada: tras la intro arranca el Acto 1 (calle porteña);
// tras cada mini-escena entre nivel y jefe arranca la arena correspondiente.
function endIntro() {
  const kind = game.story.endIntro();
  input.reset();
  if (kind === 'pre_chaky') { spawnBoss(); return; }
  if (kind === 'post_chaky') { startChaseRun(); return; }
  if (kind === 'pre_cepi' || kind === 'byd') { spawnCepi(); return; }
  if (kind === 'post_cepi') { enterAct3Street(); return; }
  if (kind === 'pre_lale') { spawnLale(); return; }
  if (kind === 'post_lale') { enterAct4Street(); return; }
  if (kind === 'pre_pinky') { spawnPinky(); return; }
  if (kind === 'post_pinky') { spawnFacu(); return; }
  const { actor } = game.hero;
  actor.position.set(LEVELS[0].start, 0, 0.5);
  actor.setFacing(1);
  actor.setPose('idle');
  actor.update(0);
  fx.clear();
  clearBanners();
  updateCamera(0, true);
  saveCheckpoint('calle');
  game.state = 'playing';
  game.banner('ACTO 1 · BUENOS AIRES', TOUCH ? 'Deslizá el joystick a la derecha para avanzar.' : 'Usá la flecha derecha para avanzar.');
  audio.music('ba', { fade: 0.3 });
}
// Acto 2: Persecución de Cepi en su BYD en Buenos Aires → ¡Rompé el BYD! → Mini-escena → Arena de Cepi
function startChaseRun() {
  game.chaseDone = true;
  if (game.checkpoint?.id !== 'acto2') saveCheckpoint('acto2');
  game.state = 'curtain';
  audio.music('chase', { fade: 0.3 });
  curtain(() => {
    assets.unload?.(['arena_chaky_', 'arena_aeropuerto_fondo', 'arena_fondo', 'douge_dance_sheet', 'marine_dance_sheet']);
    game.chase.start();
  }, { label: CHECKPOINTS.acto2.label, wait: assets.ensure(['chase_']) });
}
// Mini nivel: romper el BYD antes de que Cepi lo cargue (bonus.js)
function startBydLevel() {
  if (game.checkpoint?.id !== 'byd') saveCheckpoint('byd');
  input.reset();
  audio.setIntensity?.(0);
  audio.music('byd', { fade: 0.3 });
  const heroBack = 'arena_' + (game.heroId === 'marine' ? 'marine' : 'douge') + '_back_';
  const wait = assets.ensure(['chase_', 'cepi_actions_sheet', heroBack]);
  if (assets.has('chase_cepi_dead') && assets.has(heroBack + 'idle')) { game.bonus.start(); return; }
  game.state = 'curtain';
  continueTransition(wait, () => game.bonus.start());
}
game.startBydLevel = startBydLevel;
// Mini-escena cinematográfica entre nivel y jefe o pase de posta (salteable con 1 toque; en ?probar= entra directo)
function playMiniScene(kind, fallback) {
  if (PROBAR) { fallback(); return; }
  input.reset();
  clearBanners();
  game.combo.reset();
  game.enemies.clear();
  if (kind === 'pre_cepi' || kind === 'post_chaky' || kind === 'post_cepi') setLevel(1);
  else if (kind === 'pre_lale' || kind === 'post_lale' || kind === 'pre_pinky' || kind === 'post_pinky') setLevel(2);
  game.state = 'intro';
  audio.music('intro', { fade: 0.25 });
  game.story.startIntro(game.hero, game.heroId, kind);
}
// Lo rompiste en el Acto 2: mini-escena de Cepi furioso → entra a su Arena de Pádel
function bydDone() {
  const h = game.hero;
  Object.assign(h, { stunT: 0, slowT: 0, knock: 0, knockZ: 0, lift: 0, vy: 0, state: 'free', inv: 1.2 });
  input.reset();
  if (PROBAR === 'byd' || PROBAR === 'persecucion') {
    spawnCepi();
    return;
  }
  playMiniScene('pre_cepi', () => spawnCepi());
}
// Se cargó: Cepi se escapa, perdés un corazón y se vuelve a intentar (sin corazones, se terminó)
function bydFailed() {
  const h = game.hero;
  h.hp = Math.max(0, h.hp - 1);
  game.score.takeDamage();
  if (h.hp <= 0) { game.state = 'playing'; finish(false); return; }
  game.bonus.start();
}

// ---------- cortina entre tramos ----------
// Tapa la pantalla con tres franjas en diagonal, espera `wait` (carga diferida de sprites de jefe)
// si existe, ejecuta `mid` con la pantalla tapada y destapa.
let curtainBusy = false;
let curtainGeneration = 0;
let curtainRevealTimer;
let pausedTransitions = [];

function clearCurtain() {
  curtainGeneration++;
  pausedTransitions = [];
  clearTimeout(curtainRevealTimer);
  curtainBusy = false;
  $('#curtain')?.classList.remove('close', 'open');
}

function continueTransition(ready, next) {
  const generation = curtainGeneration;
  Promise.resolve(ready).then(() => {
    if (generation !== curtainGeneration) return;
    if (document.hidden) pause();
    if (game.state === 'paused') pausedTransitions.push(next);
    else return next();
  }).catch(error => {
    if (generation !== curtainGeneration) return;
    console.error(error);
    showLoadError('No se pudieron cargar los recursos del juego.');
  });
}

function curtain(mid, { label = '', hold = 0, wait = null } = {}) {
  const c = $('#curtain');
  if (curtainBusy || !c) {
    continueTransition(wait, mid);
    return;
  }
  curtainBusy = true;
  c.querySelector('b').textContent = tr(label);
  c.classList.remove('open'); void c.offsetWidth; c.classList.add('close');
  audio.sfx('whoosh');
  const cover = 420 + (label ? 450 : 0) + hold * 1000;
  const delay = new Promise((resolve) => setTimeout(resolve, cover));
  continueTransition(Promise.all([delay, wait]), () => {
    try { mid(); } finally {
      c.classList.remove('close'); void c.offsetWidth; c.classList.add('open');
      curtainRevealTimer = setTimeout(() => { c.classList.remove('open'); curtainBusy = false; }, 560);
    }
  });
}
game.curtain = curtain;
Object.defineProperty(game, 'curtainBusy', { get: () => curtainBusy });

// ---------- zonas ----------
function openGate(i) {
  const g = world.gates[i];
  if (g.open) return;
  g.open = true;
  g.t = 0;
  fx.shake(0.35);
  // Sin carteles de instrucciones: el portón que se derrumba ya dice que se puede seguir
  game.ctx.audio?.sfx('crate');
  game.ctx.audio?.sfx('clear');
}

function updateZones() {
  // Red de seguridad: nadie queda del otro lado de un portón cerrado (evita quedar trabado sin enemigos)
  const hp = game.hero.actor.position;
  for (const g of world.gates) {
    if (!g.open && hp.x > g.x) {
      hp.x = g.x - 1;
      break;
    }
  }
  const x = hp.x;
  for (const w of WAVES) {
    if (w.level !== game.level) continue;
    const st = game.waves[w.id];
    if (st === 'idle' && x > w.trigger && game.cameos.busy) { game.cameos.hurry(); break; }
    if (st === 'idle' && x > w.trigger) {
      game.waves[w.id] = 'active';
      game.enemies.spawnWave(w.id);
      break;
    }
    if (st === 'active' && game.enemies.alive() === 0) {
      game.waves[w.id] = 'cleared';
      if (w.gate != null) openGate(w.gate);
      // Margot (carita del HUD + guiño flotante) festeja cada tramo despejado
      game.margot.cheer(3.2);
      const margotCheer = game.heroId === 'marine' ? '👶 ¡Allez maman !' : '👶 ¡Vamos, papá!';
      fx.popup(hp.clone().setY(3.3), margotCheer, '#ffb3e6', { size: 22, life: 1.4, rise: 0.35 });
      if (w.endsLevel) {
        // El nivel termina al llegar al final de la calle, no apenas cae el último malo
        game.levelExit = true;
      }
    }
  }
  if (game.levelExit && game.level === 1) {
    const end = LEVELS[0].maxX - 2.5;
    if (x >= end) {
      game.levelExit = false;
      if (!game.chakyDone) { playMiniScene('pre_chaky', () => spawnBoss()); return; }
      startTransition();
      return;
    }
  }
  // Acto 3: al despejar las 2 oleadas de Francia (francia y francia-2) y cruzar el portón hacia Le Blé → Mini-escena + Arena de Lale
  if (game.level === 2 && !game.laleDone && game.waves['francia-2'] === 'cleared' && x >= 206) {
    playMiniScene('pre_lale', () => spawnLale());
    return;
  }
  // Acto 4: al despejar el último tramo y entrar al Galpón → Mini-escena + Arena Final de Pinky (+ Margot)
  const last = WAVES[WAVES.length - 1];
  if (!game.bossStarted && game.level === 2 && game.laleDone && game.waves[last.id] === 'cleared' && x > world.galponX + 6) {
    game.bossStarted = true;
    playMiniScene('pre_pinky', () => spawnPinky());
  }
}

// ---------- cambio de nivel (Acto 2 → Acto 3: vuelo de Buenos Aires a París tras vencer a Cepi) ----------
const TRANSITION_MAX_S = 6;
const TRANSITION_WAIT_S = 0.45;
function startTransition() {
  game.state = 'transition';
  game.transT = 0;
  game.transCrossed = false;
  input.reset();
  clearBanners();
  game.combo.reset();
  setLevel(1);
  world.border?.raise();
  const h = game.hero;
  h.actor.position.set(BORDER_X - 6, 0, 0);
  h.actor.setFacing(1);
  Object.assign(h, { state: 'free', lift: 0, vy: 0, knock: 0, knockZ: 0 });
  updateCamera(0, true);
  const done = LEVELS[0];
  $('#level-done').textContent = tr('¡CEPI CONFESÓ! LALE SE LLEVÓ A MARGOT A PARÍS');
  $('#level-name').textContent = tr(done.name);
  $('#level-pts').textContent = tr(game.score.total.toLocaleString('es-AR') + ' puntos');
  $('#level-next').textContent = '✈ ' + tr(CHECKPOINTS.acto3.label);
  $('#level-card').classList.remove('hidden');
  $('#level-card').classList.add('travel');
  audio.sfx('clear');
  audio.sfx('bell');
}

function updateTransition(dt) {
  game.transT += dt;
  const h = game.hero, a = h.actor, p = a.position, next = LEVELS[1];
  const walking = game.transT > TRANSITION_WAIT_S && p.x < next.start;
  const strolls = !!a.poses.walk;
  const speed = walking ? (strolls ? WALK.auto : Math.max(h.speed, 7.2)) : 0;
  if (walking) {
    p.x = Math.min(next.start, p.x + speed * dt);
    p.z += (0 - p.z) * Math.min(1, dt * 2.5);
  }
  a.setPose(walking ? (strolls ? 'walk' : 'run') : 'idle');
  a.update(dt, speed);
  if (!game.transCrossed && (p.x >= BORDER_X + 0.5 || game.transT > TRANSITION_MAX_S)) {
    game.transCrossed = true;
    audio.sfx('secret');
    curtain(() => { if (game.state === 'transition') endTransition(); }, { label: CHECKPOINTS.acto3.label });
  }
}

function endTransition() {
  $('#level-card').classList.add('hidden');
  $('#level-card').classList.remove('travel');
  game.enemies.clear(); game.butter.clear(); game.psycho.stop(); game.powers.clear();
  game.cameos.onLevelStart();
  game.margot.clear();
  game.traps.reset();
  enterAct3Street();
}
game.startTransition = startTransition;

// Curación familiar antes de cada jefe: +2 corazones (mínimo 3)
function healBeforeBoss(instant = false) {
  if (!game.hero || instant) return;
  game.hero.hp = Math.min(game.hero.hpMax, Math.max(3, game.hero.hp + 2));
}

// ---------- Jefes de los 4 Actos (con carga diferida por arena) ----------
function spawnBoss({ instant = false } = {}) {
  input.reset();
  clearBanners();
  game.combo.reset();
  healBeforeBoss(instant);
  const wait = Promise.all([
    assets.ensure(['arena_chaky_dance_', 'arena_fondo', 'margot_sheet']), // solo el traje violeta de baile (sin sprites naranjas)
    Promise.allSettled(['arena_aeropuerto_fondo', 'douge_dance_sheet', 'marine_dance_sheet'].map(name => assets.ensure(name)))
  ]);
  game.ctx.audio?.music('disco', { fade: instant ? 0 : 0.3 });
  if (!game.checkpoint || game.checkpoint.id !== 'chaky') saveCheckpoint('chaky');
  if (instant) { game.state = 'curtain'; continueTransition(wait, () => game.arena.start()); return; }
  game.state = 'curtain';
  curtain(() => game.arena.start(), { label: CHECKPOINTS.chaky.label, wait });
}

function spawnCepi({ instant = false, hp = null } = {}) {
  input.reset();
  healBeforeBoss(instant);
  const heroBack = 'arena_' + (game.heroId === 'marine' ? 'marine' : 'douge') + '_back_';
  const wait = assets.ensure(['arena_cepi_', 'arena_margot_', 'cepi_walk_sheet', 'arena_lale_idle', heroBack]);
  game.ctx.audio?.music('bossCepi', { fade: instant ? 0 : 0.4 });
  const go = () => {
    assets.unload?.(['arena_chaky_', 'arena_aeropuerto_fondo', 'arena_fondo', 'douge_dance_sheet', 'marine_dance_sheet', 'chase_']);
    game.arenaCepi.start();
    if (hp != null) { game.arenaCepi.logic._setHp(hp); game.arenaCepi.syncBar?.(); }
  };
  if (instant) { game.state = 'curtain'; continueTransition(wait, go); return; }
  if (game.checkpoint?.id !== 'cepi') saveCheckpoint('cepi');
  game.state = 'curtain';
  curtain(go, { label: CHECKPOINTS.cepi.label, wait });
}

function spawnLale({ instant = false, hp = null } = {}) {
  input.reset();
  healBeforeBoss(instant);
  const heroBack = 'arena_' + (game.heroId === 'marine' ? 'marine' : 'douge') + '_back_';
  const wait = assets.ensure(['arena_lale_', 'arena_margot_', 'lale_walk_sheet', 'lale_actions_sheet', heroBack]);
  game.ctx.audio?.music('bossLale', { fade: instant ? 0 : 0.4 });
  const go = () => {
    game.arenaLale.start();
    if (hp != null) { game.arenaLale.logic._setHp(hp); game.arenaLale.syncBar?.(); }
  };
  if (instant) { game.state = 'curtain'; continueTransition(wait, go); return; }
  if (game.checkpoint?.id !== 'lale') saveCheckpoint('lale');
  game.state = 'curtain';
  curtain(go, { label: CHECKPOINTS.lale.label, wait });
}

function spawnPinky({ instant = false, hp = null } = {}) {
  game.bossStarted = true;
  input.reset();
  healBeforeBoss(instant);
  const heroBack = 'arena_' + (game.heroId === 'marine' ? 'marine' : 'douge') + '_back_';
  const wait = assets.ensure(['arena_pinky_', 'arena_margot_', 'pinky_walk_sheet', 'pinky_actions_sheet', heroBack]);
  game.ctx.audio?.music('bossPinky', { fade: instant ? 0 : 0.4 });
  const go = () => {
    game.arenaPinky.start();
    if (hp != null) { game.arenaPinky.logic._setHp(hp); game.arenaPinky.syncBar?.(); }
  };
  if (instant) { game.state = 'curtain'; continueTransition(wait, go); return; }
  if (game.checkpoint?.id !== 'pinky') saveCheckpoint('pinky');
  game.state = 'curtain';
  curtain(go, { label: CHECKPOINTS.pinky.label, wait });
}

function spawnFacu({ instant = false, hp = null } = {}) {
  game.bossStarted = true;
  input.reset();
  healBeforeBoss(instant);
  const heroBack = 'arena_' + (game.heroId === 'marine' ? 'marine' : 'douge') + '_back_';
  // Facu y la banda de la foto final (Chaky) se cargan acá, no al arrancar
  const wait = assets.ensure(['facu', 'arena_facu_', 'arena_margot_', 'chaky_', heroBack]);
  game.ctx.audio?.music('bossFacu', { fade: instant ? 0 : 0.4 });
  const go = () => {
    assets.unload?.(['arena_chaky_', 'arena_aeropuerto_fondo', 'arena_fondo', 'douge_dance_sheet', 'marine_dance_sheet', 'chase_', 'arena_cepi_', 'arena_lale_', 'arena_pinky_']);
    game.arenaFacu.start();
    if (hp != null) { game.arenaFacu.logic._setHp(hp); game.arenaFacu.syncBar?.(); }
  };
  if (instant) { game.state = 'curtain'; continueTransition(wait, go); return; }
  if (game.checkpoint?.id !== 'facu') saveCheckpoint('facu');
  game.state = 'curtain';
  curtain(go, { label: CHECKPOINTS.facu.label, wait });
}

function enterAct3Street() {
  game.cepiDone = true;
  world.border?.raise?.();
  setLevel(2);
  clearWavesBefore(WAVES.findIndex(w => w.level === 2));
  const h = game.hero;
  Object.assign(h, { stunT: 0, slowT: 0, knock: 0, knockZ: 0, lift: 0, vy: 0, state: 'free', inv: 1.0 });
  h.hp = Math.min(h.hpMax, Math.max(3, h.hp + 2));
  h.actor.position.set(LEVELS[1].start, 0, 0);
  h.actor.setFacing(1); h.actor.setPose('idle');
  updateCamera(0, true);
  saveCheckpoint('acto3');
  game.state = 'curtain';
  curtain(() => {
    assets.unload?.(['arena_chaky_', 'arena_aeropuerto_fondo', 'arena_fondo', 'douge_dance_sheet', 'marine_dance_sheet', 'chase_', 'arena_cepi_']);
    game.state = 'playing'; input.reset(); audio.music('francia', { fade: 0.4 });
  }, { label: CHECKPOINTS.acto3.label });
}

function enterAct4Street() {
  game.laleDone = true;
  world.border?.raise?.();
  setLevel(2);
  // Saltamos la vieja oleada street de Cepi (`boulevard`) porque Cepi ya tuvo su propia Arena en el Acto 2
  clearWavesBefore(WAVES.findIndex(w => w.id === 'boulevard-2'));
  const h = game.hero;
  Object.assign(h, { stunT: 0, slowT: 0, knock: 0, knockZ: 0, lift: 0, vy: 0, state: 'free', inv: 1.0 });
  h.hp = Math.min(h.hpMax, Math.max(3, h.hp + 2));
  h.actor.position.set(228, 0, 0);
  h.actor.setFacing(1); h.actor.setPose('idle');
  updateCamera(0, true);
  saveCheckpoint('acto4');
  game.state = 'curtain';
  curtain(() => {
    assets.unload?.(['chase_', 'arena_cepi_', 'arena_lale_']);
    game.state = 'playing'; input.reset(); audio.music('francia', { fade: 0.4 });
  }, { label: '¡LALE FUERA! PINKY SE LA LLEVÓ PASANDO LA FERME LAPADITE' });
}

game.onBossDown = () => {
  assets.unload?.(['arena_chaky_', 'arena_aeropuerto_fondo', 'arena_fondo', 'douge_dance_sheet', 'marine_dance_sheet', 'chase_', 'arena_cepi_', 'arena_lale_', 'arena_pinky_', 'arena_facu_']);
  // Si se ganó desde ?probar=pinky*, ubicar al héroe frente a la jaula del Galpón para evitar volar desde Buenos Aires
  if (game.hero && game.hero.actor.position.x < GALPON_X) {
    setLevel(2);
    game.hero.actor.position.set(GALPON_X + 6, 0, 0);
    updateCamera(0, true);
  }
  game.state = 'rescue';
  game.rescueT = 0;
  audio.music(null); // se corta la música del jefe: suena solo la fanfarria del rescate
  input.reset();
  clearBanners();
  game.photo = null;
  // El rescate es una escena: el héroe corre a la jaula, alza a Margot, llega la banda aplaudiendo y foto familiar
  game.story.startRescue(game.hero, HERO_CFG[game.heroId].name);
  game.ctx.audio?.sfx('fanfare');

};

// Atajo para pruebas y para saltar a una parte del recorrido
const STAGES = {
  vereda: { wave: 'vereda', at: 24 },
  avenida: { wave: 'avenida', at: 74 },
  'le-concept': { wave: 'le-concept', at: 120 },
  francia: { wave: 'francia', at: 164 },
  'francia-quiet': { upTo: 'francia', at: 170 },
  boulevard: { wave: 'boulevard-2', at: 234 },
  'boulevard-quiet': { upTo: 'francia-2', at: SECRET_X - 6 },
  galpon: { upTo: WAVES[WAVES.length - 1].id, at: GALPON_X + 8, boss: true }
};
const ALIASES = { plaza: 'avenida', 'plaza-quiet': 'boulevard-quiet' };
game.setStage = (id) => {
  const st = STAGES[ALIASES[id] || id];
  clearRun();
  // Saltar a una etapa (solo pruebas): Pinky no se cruza salvo que la prueba lo pida
  game.cameos.pinky.shown = { 1: true, 2: true };
  game.props.reset();
  const p = game.hero.actor.position;
  game.state = 'playing';
  Object.assign(game.hero, { stunT: 0, slowT: 0, knock: 0, knockZ: 0, lift: 0, vy: 0, state: 'free' });
  const stop = WAVES.findIndex(w => w.id === (st.wave || st.upTo));
  const target = WAVES[stop];
  WAVES.forEach((w, i) => {
    if (i < stop || (st.upTo && i === stop)) { game.waves[w.id] = 'cleared'; if (w.gate != null) openGate(w.gate); }
  });
  setLevel(target.level);
  p.set(st.at, 0, 0);
  if (st.wave) { game.waves[st.wave] = 'active'; game.enemies.spawnWave(st.wave); }
  if (st.boss) spawnBoss({ instant: true });
  clearBanners();
  updateCamera(0, true);
};

game.onHeroDown = () => finish(false);

// ---------- Links de prueba: ?probar=<tramo> ----------
// Ej.: ?probar=chaky · ?probar=cepi · ?probar=lale · ?probar=pinky (y sub-fases)
const QUICK_TESTS = {
  chaky: { stage: 'galpon' },
  'chaky-baile': { stage: 'galpon' },
  'chaky-cartel': { stage: 'galpon', bossHp: 21 },
  'chaky-enojado': { stage: 'galpon', bossHp: 11 },
  cepi: { run: () => spawnCepi({ instant: true }) },
  'cepi-duelo': { run: () => spawnCepi({ instant: true, hp: 20 }) },
  'cepi-carton': { run: () => spawnCepi({ instant: true, hp: 10 }) },
  lale: { run: () => spawnLale({ instant: true }) },
  'lale-patin': { run: () => spawnLale({ instant: true, hp: 20 }) },
  'lale-horno': { run: () => spawnLale({ instant: true, hp: 10 }) },
  'lale-furia': { run: () => spawnLale({ instant: true, hp: 10 }) },
  facu: { run: () => spawnFacu({ instant: true }) },
  'facu-verdadero': { run: () => spawnFacu({ instant: true, hp: 20 }) },
  'facu-enojado': { run: () => spawnFacu({ instant: true, hp: 10 }) },
  final: { run: () => { game.state = 'curtain'; continueTransition(assets.ensure(['facu', 'chaky_']), () => { game.state = 'playing'; game.onBossDown(); }); } },
  pinky: { run: () => spawnPinky({ instant: true }) },
  'pinky-tarifa': { run: () => spawnPinky({ instant: true, hp: 20 }) },
  'pinky-margot': { run: () => spawnPinky({ instant: true, hp: 10 }) },
  persecucion: { run: () => startChaseRun() },
  byd: { run: () => startBydLevel() },
  calle: {},
  francia: { stage: 'francia' }
};
const PROBAR = (() => { try { const v = (new URLSearchParams(location.search).get('probar') || '').toLowerCase(); return QUICK_TESTS[v] ? v : null; } catch (_) { return null; } })();
const DEBUG = (() => { try { return new URLSearchParams(location.search).get('debug') === '1'; } catch (_) { return false; } })();
game.probar = PROBAR;
game.debug = DEBUG;
game.contextLost = false;
function quickTest(heroId, id) {
  const q = QUICK_TESTS[id];
  startRun(heroId, false, { street: true });
  if (q.stage) game.setStage(q.stage);
  if (q.run) q.run();
  if (q.bossHp) {
    const t0 = performance.now();
    const wait = () => { if (game.arena.active) game.arena.logic._setHp(q.bossHp); else if (performance.now() - t0 < 8000) setTimeout(wait, 100); };
    wait();
  }
}

function finish(won) {
  if (game.state !== 'playing' && game.state !== 'rescue') return;
  game.state = 'result';
  input.reset();
  game.cameos.onLevelStart();
  game.margot.clear();
  game.psycho.stop();
  game.lastResult = { won, ...game.score.finalize({ hpLeft: game.hero.hp, hpMax: game.hero.hpMax, seconds: game.time, won }), photo: won ? game.photo : null };
  $('#touch').classList.add('hidden');
  $('#boss-bar').classList.add('hidden');
  if (!(won && audio.current === 'rescate')) audio.music(null);
  if (won) { audio.sfx('fanfare'); clearCheckpoint(); setTimeout(() => { if (game.state === 'result') audio.music('rescate', { fade: 0 }); }, 2200); }
  const cp = !won && game.checkpoint;
  ui.showResult(game.lastResult, game.heroId, cp ? { label: CHECKPOINTS[cp.id].short, onRetry: () => resumeAt(cp) } : null);
}
game.finish = finish;

// ---------- pausa ----------
const PAUSABLE = new Set(['playing', 'intro', 'transition', 'curtain', 'chase', 'bonus', 'arena', 'arena-cepi', 'arena-lale', 'arena-pinky', 'arena-facu', 'rescue']);
function pause() {
  if (!PAUSABLE.has(game.state)) return;
  game.pausedFrom = game.state;
  game.state = 'paused';
  input.reset();
  audio.pauseMusic();
  const cp = game.checkpoint;
  $('#btn-restart').textContent = tr(cp ? '🔁 Reintentar desde ' + CHECKPOINTS[cp.id].short : '🔁 Empezar de nuevo');
  pauseConfirm(null);
  showScreen('screen-pause');
}
let confirmAction = null;
function pauseConfirm(text, action) {
  confirmAction = action || null;
  $('#pause-main').classList.toggle('hidden', !!text);
  $('#pause-confirm').classList.toggle('hidden', !text);
  if (text) $('#pause-confirm-text').textContent = tr(text);
}
function resume() {
  if (game.state !== 'paused' || document.hidden) return;
  input.reset();
  showScreen(null);
  game.state = game.pausedFrom;
  game.pausedFrom = null;
  audio.resumeMusic();
  last = 0;
  const transitions = pausedTransitions;
  pausedTransitions = [];
  for (const complete of transitions) complete();
}
game.pause = pause;
game.resume = resume;

let last = 0;
let frameErrors = 0;
let debugBox = null;
const dbg = { lastNow: 0, accMs: 0, frames: 0, fps: 0, ms: 0, paintAt: 0 };
function initDebugBox() {
  if (!DEBUG || debugBox) return;
  debugBox = document.createElement('pre');
  debugBox.id = 'debug-hud';
  debugBox.setAttribute('aria-live', 'off');
  document.body.append(debugBox);
  addEventListener('error', (ev) => {
    const msg = ev?.message || String(ev?.error || 'error');
    if (!game.lastError) game.lastError = msg;
    paintDebugBox(performance.now(), true);
  });
  addEventListener('unhandledrejection', (ev) => {
    const r = ev?.reason;
    game.lastError = String(r && r.stack || r || 'unhandledrejection');
    paintDebugBox(performance.now(), true);
  });
}
function paintDebugBox(now, force = false) {
  if (!debugBox) return;
  if (dbg.lastNow) {
    const d = now - dbg.lastNow;
    if (d > 0 && d < 2000) { dbg.accMs += d; dbg.frames++; }
  }
  dbg.lastNow = now;
  if (!force && now - dbg.paintAt < 250) return;
  if (dbg.frames > 0) {
    dbg.ms = dbg.accMs / dbg.frames;
    dbg.fps = dbg.ms > 0 ? 1000 / dbg.ms : 0;
    dbg.accMs = 0;
    dbg.frames = 0;
  }
  dbg.paintAt = now;
  const info = renderer?.info;
  const calls = info?.render?.calls ?? 0;
  const geo = info?.memory?.geometries ?? 0;
  const tex = info?.memory?.textures ?? 0;
  const dpr = renderer ? renderer.getPixelRatio() : (devicePixelRatio || 1);
  const lines = [
    `FPS ${dbg.fps.toFixed(0)} (${dbg.ms.toFixed(1)}ms) Q:${game.perf.level} DPR:${dpr.toFixed(2)}`,
    `calls:${calls} geo:${geo} tex:${tex} | ${game.state}/${game.heroId}`,
    `err:${frameErrors}${game.contextLost ? ' ⚠ WEBGL CONTEXT LOST' : ''}`
  ];
  if (game.lastError) lines.push(String(game.lastError).split('\n')[0].slice(0, 96));
  debugBox.textContent = lines.join('\n');
  debugBox.classList.toggle('has-err', frameErrors > 0 || game.contextLost || !!game.lastError);
}
function frame(now) {
  try { frameStep(now); } catch (e) {
    frameErrors++;
    console.error('[MARGOUSH] error en el cuadro', e);
    game.lastError = String(e && e.stack || e);
    if (game.state === 'intro') { try { endIntro(); } catch (_) {} }
    requestAnimationFrame(frame);
  }
  if (debugBox) paintDebugBox(now);
}
game.frameErrors = () => frameErrors;
function frameStep(now) {
  const realDt = Math.min(0.1, last ? (now - last) / 1000 : 0);
  const dt = Math.min(0.05, realDt) * game.timeScale;
  last = now;
  if (document.hidden || (PAUSABLE.has(game.state) && input.consume('pause'))) pause();
  if (!PAUSABLE.has(game.state)) {
    requestAnimationFrame(frame);
    return;
  }
  const scenes = [
    ['chase', game.chase],
    ['bonus', game.bonus],
    ['arena', game.arena],
    ['arena-cepi', game.arenaCepi],
    ['arena-lale', game.arenaLale],
    ['arena-pinky', game.arenaPinky],
    ['arena-facu', game.arenaFacu]
  ];
  for (const [st, mod] of scenes) {
    if (!mod) continue;
    if (mod.active && game.state !== st) mod.dispose();
    if (mod.active) {
      const t0 = performance.now();
      if (game.state === st) mod.update(dt);
      if (bannerCurrent) { bannerTimer -= realDt; if (bannerTimer <= 0) nextBanner(); }
      if (mod.active) {
        mod.render();
        if (dt > 0) game.perf.record(dt * 1000, performance.now() - t0);
        requestAnimationFrame(frame);
        return;
      }
    }
  }
  if (game.state === 'playing') {
    const t0 = performance.now();
    if (!fx.frozen(dt)) {
      game.time += dt;
      game.hero.update(dt);
      game.enemies.update(dt);
      if (game.state !== 'playing') { requestAnimationFrame(frame); return; }
      game.traps.update(dt);
      if (game.state !== 'playing') { requestAnimationFrame(frame); return; }
      game.butter.update(dt);
      if (game.state !== 'playing') { requestAnimationFrame(frame); return; }
      game.psycho.update(dt);
      game.powers.update(dt);
      game.cameos.update(dt);
      game.margot.update(dt);
      game.props.update(dt, game.time);
      updateZones();
      game.combo.update(dt);
      game.stats.maxMult = Math.max(game.stats.maxMult, game.score.multiplier);
    }
    updateHud(dt);
    if (dt > 0) game.perf.record(dt * 1000, performance.now() - t0);
  } else if (game.state === 'intro') {
    if (game.story.cine.kind === 'intro') game.time = 0;
    if (game.story.updateIntro(dt)) endIntro();
  } else if (game.state === 'transition') {
    updateTransition(dt);
  } else if (game.state === 'rescue') {
    const before = game.rescueT;
    game.rescueT += dt;
    if (before < 2.2 && game.rescueT >= 2.2) audio.music('rescate', { fade: 0 });
    const step = game.story.updateRescue(dt, game.rescueT);
    if (step === 'photo') game.wantPhoto = true;
    if (step === 'done') finish(true);
  }
  // el cartel corre con el reloj real (no se frena con los golpes ni con la cámara lenta)
  if (bannerCurrent) { bannerTimer -= realDt; if (bannerTimer <= 0) nextBanner(); }
  world.updateGates(dt);
  if (game.hero) world.updateLook?.(game.hero.actor.position.x);
  fx.update(dt);
  if (game.state !== 'intro') updateCamera(dt); // en las escenas animadas la cámara la maneja cine.js
  updateOffscreen();
  renderer.render(scene, camera);
  // Foto familiar del rescate: se saca justo después de dibujar el cuadro
  if (game.wantPhoto) { game.wantPhoto = false; try { game.photo = canvas.toDataURL('image/jpeg', 0.85); } catch (_) { game.photo = null; } }
  requestAnimationFrame(frame);
}

// Malos fuera de pantalla: una flechita en el borde, a la altura donde están (más grande cuanto más cerca)
const offPool = [];
const offV = new THREE.Vector3();
function updateOffscreen() {
  const layer = document.getElementById('offscreen');
  if (!layer) return;
  const list = game.state === 'playing' ? (game.enemies?.list || null) : null;
  let n = 0;
  if (list) for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (e.hp <= 0 || e.dead) continue;
    offV.copy(e.pos); offV.y += 1.1; offV.project(camera);
    const sx = (offV.x + 1) / 2;
    if (sx >= -0.02 && sx <= 1.02) continue;
    const side = sx < 0 ? 'l' : 'r';
    const dist = Math.abs(e.pos.x - game.hero.actor.position.x);
    let el = offPool[n];
    if (!el) { el = document.createElement('div'); el.className = 'off-arrow'; layer.append(el); offPool.push(el); }
    el.style.display = '';
    el.dataset.side = side;
    const y = Math.min(0.78, Math.max(0.2, (1 - offV.y) / 2));
    el.style.top = (y * 100).toFixed(1) + '%';
    el.style.setProperty('--s', Math.max(0.65, Math.min(1.15, 1.25 - dist / 18)).toFixed(2));
    n++;
  }
  for (let i = n; i < offPool.length; i++) offPool[i].style.display = 'none';
}

async function boot() {
  initDebugBox();
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding;
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    game.contextLost = true;
    paintDebugBox(performance.now(), true);
    showLoadError('Se interrumpieron los gráficos 3D. Recargá para volver a jugar.');
  });
  resize();
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('pagehide', pause);
  addEventListener('blur', () => { if (!TOUCH) input?.reset(); });
  assets = await loadAssets('assets/manifest.json', (f) => { $('#load-fill').style.width = Math.round(f * 100) + '%'; });
  registerSkins(assets);
  world = buildStreet(scene, assets);
  input = createInput({ canvas, joystick: $('#joystick'), knob: $('#knob'), zone: $('#stick-zone'), buttons: document.querySelectorAll('.act') });
  fx = createFx(scene, camera, $('#labels'), $('#flash'));
  audio = createAudio(assets);
  const ctx = { scene, assets, world, input, fx, camera, game, audio };
  const ranking = createRanking({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
  game.ranking = ranking;
  const goMenu = () => {
    input.reset();
    clearRun();
    clearBanners();
    game.state = 'menu';
    paintContinue();
    paintPodium();
    audio.music('menu');
    for (const id of ['#hud', '#touch', '#boss-bar']) $(id).classList.add('hidden');
    showScreen('screen-menu');
  };
  ui = createUi({ ranking, assets, showScreen, audio, onPlayAgain: () => startRun(game.heroId, false), onMenu: goMenu });
  game.goMenu = goMenu;
  game.ctx = ctx;
  game.world = world;
  game.input = input;
  game.enemies = createEnemies(ctx);
  game.traps = createTraps(ctx);
  game.butter = createButter(ctx);
  game.cameos = createCameos(ctx);
  game.margot = createMargot(ctx, SpriteActor);
  game.psycho = createPsycho(ctx);
  game.powers = createPowers(ctx);
  game.props = createProps(ctx);
  game.pickups = game.props.pickups;
  game.crates = game.props.crates;
  game.story = createStory(ctx);
  // Jefe 1 (Acto 1): BIG CHAKY → al ganar, pase de posta en pantalla: Cepi agarra a Margot y huye en el BYD
  game.arena = createArena({
    game, input, audio, assets, renderer, banner: game.banner, updateHud, pause, POWER,
    onWin() {
      game.chakyDone = true;
      game.state = 'playing'; last = 0;
      if (PROBAR && PROBAR.startsWith('chaky')) { game.onBossDown(); return; }
      playMiniScene('post_chaky', () => startChaseRun());
    },
    onDown() { game.state = 'playing'; finish(false); }
  });
  // Jefe 2 (Acto 2): Cepi «el Niño» → al ganar, pase de posta en pantalla: Lale se lleva a Margot a París (Acto 3)
  game.arenaCepi = createCepiArena({
    game, input, audio, assets, renderer, updateHud, pause, POWER,
    onWin() {
      game.cepiDone = true;
      game.state = 'playing'; last = 0;
      if (PROBAR && PROBAR.startsWith('cepi')) { finish(true); return; }
      playMiniScene('post_cepi', () => enterAct3Street());
    },
    onDown() { game.state = 'playing'; finish(false); }
  });
  // Jefe 3 (Acto 3): Lale «Mantecoso» → al ganar, pase de posta en pantalla: Pinky traiciona por el cheque rebotado (Acto 4)
  game.arenaLale = createLaleArena({
    game, input, audio, assets, renderer, updateHud, pause, POWER,
    onWin() {
      game.laleDone = true;
      game.state = 'playing'; last = 0;
      if (PROBAR && PROBAR.startsWith('lale')) { finish(true); return; }
      playMiniScene('post_lale', () => enterAct4Street());
    },
    onDown() { game.state = 'playing'; finish(false); }
  });
  // Jefe Final (Acto 4): Pinky «el Trapito» + Remate con Margot → Rescate y Foto Familiar
  game.arenaPinky = createPinkyArena({
    game, input, audio, assets, renderer, updateHud, pause, POWER,
    // El cheque rebotado lo firmó Facu: pase de posta en pantalla y duelo final en la galería HENRIS (Acto 5)
    onWin() {
      game.state = 'playing'; last = 0;
      if (PROBAR && PROBAR.startsWith('pinky')) { game.onBossDown(); return; }
      playMiniScene('post_pinky', () => spawnFacu());
    },
    onDown() { game.state = 'playing'; finish(false); }
  });
  // Jefe final (Acto 5): Facu «el Cerebro» en la galería HENRIS → Rescate y Foto Familiar (con Chaky y Facu)
  game.arenaFacu = createFacuArena({
    game, input, audio, assets, renderer, updateHud, pause, POWER,
    onWin() { game.state = 'playing'; last = 0; game.onBossDown(); },
    onDown() { game.state = 'playing'; finish(false); }
  });
  game.bonus = createBonus({ game, input, audio, assets, renderer, updateHud, pause, POWER, SWINGS,
    onEnd() { last = 0; bydDone(); }, onFail() { last = 0; bydFailed(); } });
  game.chase = createChase({
    game, input, audio, assets, renderer, banner: game.banner, updateHud, pause, POWER,
    // Lo alcanzaste: el BYD quedó sin batería y Cepi corre a enchufarlo → mini nivel «¡ROMPÉ EL BYD!»
    wonLabel: '¡ROMPÉ EL BYD!',
    onCaught() { last = 0; startBydLevel(); },
    onDown() { game.state = 'playing'; finish(false); }
  });
  for (const el of [canvas, $('#stick-zone')]) el.addEventListener('pointerdown', () => { if (game.state === 'intro') endIntro(); });
  game.story.cine.ui.skipButton.addEventListener('click', (e) => { e.stopPropagation(); if (game.state === 'intro') endIntro(); });
  addEventListener('keydown', event => {
    if (game.state === 'intro' && !['Escape', 'KeyP'].includes(event.code)) endIntro();
  });
  game.heroScreen = () => { const v = game.hero.actor.position.clone(); v.y += 1; v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; };
  // Atajos de pruebas: directo a la calle de Buenos Aires, o desde la persecución
  game.quickStart = (heroId) => startRun(heroId, false, { street: true });
  game.quickChase = (heroId) => startRun(heroId, false);

  // Portada: el primer toque habilita el sonido (Safari) y arranca la música
  const startCover = () => {
    if (game.coverStarted || game.state !== 'menu') return;
    game.coverStarted = true;
    game.coverStartedAt = performance.now();
    $('#screen-menu').classList.add('started');
    audio.music('menu');
  };
  // En click (no en pointerdown): así el mismo toque no cae sobre ¡JUGAR! cuando aparece
  $('#screen-menu').addEventListener('click', startCover);
  addEventListener('keydown', (e) => { if (game.state === 'menu' && !game.coverStarted && !e.repeat) startCover(); });
  const justStarted = () => performance.now() - (game.coverStartedAt || 0) < 450;
  $('#btn-play').addEventListener('click', () => { if (!justStarted()) showScreen('screen-select'); });
  // Elegir héroe: el personaje salta y gira, grita (Douge «¡Diuuushbag!», Marine «¡Messi Goku!») y arranca
  let picking = false;
  for (const card of document.querySelectorAll('.card')) card.addEventListener('click', () => {
    if (picking) return;
    picking = true;
    audio.setHero?.(card.dataset.hero);
    if (card.dataset.hero === 'marine') {
      audio.messiGoku();
    } else {
      audio.sfx('diushbag');
    }
    audio.sfx('coin');
    card.classList.add('chosen'); card.parentElement.classList.add('picking');
    setTimeout(() => {
      card.classList.remove('chosen'); card.parentElement.classList.remove('picking');
      picking = false;
      if (PROBAR) quickTest(card.dataset.hero, PROBAR);
      else startRun(card.dataset.hero, true);
    }, 1150);
  });
  $('#btn-pause').addEventListener('click', pause);
  $('#btn-resume').addEventListener('click', resume);
  $('#btn-restart').addEventListener('click', () => {
    const cp = game.checkpoint;
    pauseConfirm(cp ? `¿Volver a arrancar desde ${CHECKPOINTS[cp.id].short}?` : '¿Empezar todo de nuevo? Perdés lo que llevás.',
      () => { showScreen(null); if (cp) resumeAt(cp); else startRun(game.heroId, false); });
  });
  $('#btn-home').addEventListener('click', () => {
    const cp = game.checkpoint;
    pauseConfirm(cp ? `¿Salir al menú? Después podés CONTINUAR desde ${CHECKPOINTS[cp.id].short}.` : '¿Salir al menú? Perdés lo que llevás de esta partida.',
      () => game.goMenu());
  });
  $('#btn-confirm-yes').addEventListener('click', () => { const a = confirmAction; pauseConfirm(null); a?.(); });
  $('#btn-confirm-no').addEventListener('click', () => { pauseConfirm(null); resume(); });
  $('#btn-select-back').addEventListener('click', () => showScreen('screen-menu'));
  $('#btn-continue').addEventListener('click', () => {
    if (justStarted()) return;
    const cp = storedCheckpoint();
    if (!cp) return paintContinue();
    if (cp.heroId === 'marine') audio.primeSpeech();
    resumeAt(cp);
  });
  $('#btn-ranking').addEventListener('click', () => { if (!justStarted()) ui.showRanking('screen-menu'); });
  const muteBtn = $('#btn-mute');
  const muteMenuBtn = $('#btn-mute-menu');
  const paintMute = () => { const t = audio.muted ? '🔇' : '♪'; muteBtn.textContent = t; if (muteMenuBtn) muteMenuBtn.textContent = t; };
  paintMute();
  const onMute = (b) => () => { audio.toggleMute(); paintMute(); b.blur(); };
  muteBtn.addEventListener('click', onMute(muteBtn));
  muteMenuBtn?.addEventListener('click', (ev) => { ev.stopPropagation(); onMute(muteMenuBtn)(); });
  const fxBtn = $('#btn-reduce-fx');
  const paintFx = () => { if (fxBtn) fxBtn.textContent = tr(isReducedMotion() ? '✨ Efectos: suaves' : '✨ Efectos: normales'); };
  paintFx();
  fxBtn?.addEventListener('click', () => { setReducedMotion(!isReducedMotion()); paintFx(); fxBtn.blur(); });
  // Idioma: banderitas en la portada (español / francés). Se recuerda en el celular.
  const langBtns = [...document.querySelectorAll('#lang-pick [data-lang]')];
  const paintLang = () => langBtns.forEach(b => b.classList.toggle('on', b.dataset.lang === getLang()));
  langBtns.forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); setLang(b.dataset.lang); b.blur(); }));
  onLangChange(() => { translateDom(); paintLang(); paintContinue(); paintPodium(); paintFx(); });
  document.documentElement.lang = getLang();
  translateDom();
  paintLang();

  camera.position.set(6, 8, 14);
  camera.lookAt(camTarget);
  paintContinue();
  paintPodium();
  showScreen('screen-menu');
  game.state = 'menu';
  // La música de la portada arranca apenas carga el juego. Si el navegador no deja sonar
  // sin un toque (Safari/iPhone), queda lista y se escucha con el primer toque en cualquier lado.
  audio.music('menu');
  requestAnimationFrame(frame);
}

function showLoadError(message) {
  game.state = 'error';
  clearCurtain();
  input?.reset();
  audio?.pauseMusic();
  game.story?.endIntro();
  for (const id of ['#hud', '#touch', '#boss-bar', '#level-card']) $(id).classList.add('hidden');
  showScreen('screen-loading');
  const title = document.createElement('h2');
  title.textContent = tr('No pudimos iniciar el juego');
  const detail = document.createElement('p');
  detail.textContent = tr(message);
  const retry = document.createElement('button');
  retry.className = 'big-btn';
  retry.textContent = tr('Reintentar');
  retry.addEventListener('click', () => location.reload());
  $('#screen-loading').replaceChildren(title, detail, retry);
}

boot().catch((error) => {
  console.error(error);
  showLoadError(renderer ? 'No se pudieron cargar los recursos del juego.' : 'El navegador no pudo activar los gráficos 3D.');
});
