import { loadAssets } from './assets.js';
import { buildStreet } from './world.js';
import { createInput } from './input.js';
import { createScore } from './score.js';
import { createFx } from './fx.js';
import { createHero, HERO_CFG } from './hero.js';
import { createEnemies } from './enemies.js';
import { registerSkins } from './skins.js';
import { createTraps } from './traps.js';
import { createProps } from './props.js';
import { createButter } from './butter.js';
import { createPsycho } from './psycho.js';
import { createFacu } from './facu.js';
import { createBoss } from './boss.js';
import { createStory } from './story.js';
import { createAudio } from './audio.js';
import { createUi } from './ui.js';
import { createRanking } from './ranking.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { LEVELS, WAVES, SECRET_X, GALPON_X } from './level.js';

const freshWaves = () => Object.fromEntries(WAVES.map(w => [w.id, 'idle']));

const $ = (s) => document.querySelector(s);
const canvas = $('#game');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
const PITCH = THREE.MathUtils.degToRad(30);
const BASE_DIST = 11.5;
let camDist = BASE_DIST;
const camTarget = new THREE.Vector3(6, 1.2, 0);

const game = {
  state: 'loading',
  heroId: 'douge',
  hero: null,
  enemies: null,
  props: null,
  boss: null,
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
game.banner = (title, text, seconds = 3.2, opts = {}) => {
  if (bannerQueue.length >= 3) bannerQueue.shift();
  bannerQueue.push({ title, text, seconds, avatar: opts.avatar || null });
  if (!bannerCurrent) nextBanner();
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
  strong.textContent = bannerCurrent.title;
  body.append(strong, document.createTextNode(bannerCurrent.text));
  b.append(body);
  b.classList.toggle('with-avatar', !!bannerCurrent.avatar);
  b.classList.remove('hidden');
  bannerTimer = bannerCurrent.seconds;
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
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camDist = Math.max(BASE_DIST, 6 / (halfV * camera.aspect));
  camera.updateProjectionMatrix();
  updateRotateHint();
}

// "Girá el celular": solo jugando en un celular en vertical
function updateRotateHint() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const show = touch && innerHeight > innerWidth && (game.state === 'playing' || game.state === 'intro');
  $('#rotate-hint').classList.toggle('hidden', !show);
}

function updateCamera(dt, snap = false) {
  if (!game.hero) return;
  const p = game.hero.actor.position;
  const look = game.hero.actor.facing * 1.6;
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

function updateHud() {
  const h = game.hero;
  const shown = Math.min(5, h.hpMax);
  const full = Math.min(shown, Math.ceil(h.hp * shown / h.hpMax));
  $('#hud-hearts').textContent = '❤️'.repeat(full) + '🖤'.repeat(shown - full);
  $('#hud-score').textContent = game.score.total.toLocaleString('es-AR');
  const m = game.score.multiplier;
  $('#hud-mult').textContent = m > 1 ? '×' + m.toFixed(1) : '';
  $('#act-power').classList.toggle('cooling', h.powerCd > 0);
}

function clearRun() {
  game.enemies?.clear();
  game.butter?.clear();
  game.psycho?.stop();
  game.traps?.reset();
  game.boss?.dispose();
  game.boss = null;
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

function startRun(heroId, withIntro = false) {
  game.heroId = heroId;
  if (game.hero) game.hero.actor.dispose();
  clearRun();
  const ctx = game.ctx;
  game.hero = createHero(heroId, ctx);
  game.hero.actor.position.set(LEVELS[0].start, 0, 0.5);
  game.facu?.dispose();
  game.facu = createFacu(ctx);
  game.score = createScore();
  game.stats = { maxMult: 1 };
  game.props.reset();
  game.time = 0;
  input.reset();
  showScreen(null);
  $('#hud').classList.remove('hidden');
  $('#hud-name').textContent = HERO_CFG[heroId].name;
  $('#hud-portrait').style.backgroundImage = `url(${assets.url(HERO_CFG[heroId].poses.idle.tex)})`;
  if (matchMedia('(pointer: coarse)').matches) $('#touch').classList.remove('hidden');
  updateCamera(0, true);
  resize();
  clearBanners();
  game.facu.say(game.facu.lines.intro, 2.6);
  $('#boss-bar').classList.add('hidden');
  audio.music(heroId);
  if (withIntro) { game.state = 'intro'; game.story.startIntro(); }
  else game.state = 'playing';
  updateRotateHint();
}

function endIntro() {
  game.story.endIntro();
  game.state = 'playing';
  input.reset();
  game.banner('¡SALVÁ A MARGOT!', 'Seguí la calle hasta el galpón de BIG CHAKY →');
}

// ---------- zonas ----------
function openGate(i) {
  const g = world.gates[i];
  if (g.open) return;
  g.open = true;
  g.t = 0;
  fx.shake(0.35);
  game.banner('¡ZONA DESPEJADA!', 'Seguí hacia la derecha →');
  game.ctx.audio?.sfx('crate');
  game.ctx.audio?.sfx('clear');
}

function updateZones() {
  // Red de seguridad: nadie queda del otro lado de un portón cerrado (evita quedar trabado sin enemigos)
  const hp = game.hero.actor.position;
  for (const g of world.gates) {
    if (!g.open && hp.x > g.x) {
      hp.x = g.x - 1;
      game.facu?.park(hp.x + 3);
      game.banner('🚧 PASO CERRADO', 'Primero despejá la zona: la banda de BIG CHAKY te espera.');
      break;
    }
  }
  // Al llegar a un portón cerrado, explica que no se salta: hay que despejar la zona
  for (const g of world.gates) {
    if (!g.open && Math.abs(hp.x - g.x) < 1.2 && game.time - (game.gateHintAt ?? -99) > 6) {
      game.gateHintAt = game.time;
      game.banner('🚧 PASO CERRADO', 'Primero despejá la zona: la banda de BIG CHAKY te espera.');
    }
  }
  const x = hp.x;
  for (const w of WAVES) {
    if (w.level !== game.level) continue;
    const st = game.waves[w.id];
    if (st === 'idle' && x > w.trigger) {
      game.waves[w.id] = 'active';
      game.enemies.spawnWave(w.id);
      if (w.facu) game.facu.say(w.facu, 3.4);
      else game.banner(w.title, w.text);
      break;
    }
    if (st === 'active' && game.enemies.alive() === 0) {
      game.waves[w.id] = 'cleared';
      if (w.gate != null) openGate(w.gate);
      if (w.endsLevel) { startTransition(); return; }
    }
  }
  const last = WAVES[WAVES.length - 1];
  if (!game.boss && game.level === 2 && game.waves[last.id] === 'cleared' && x > world.galponX + 6) spawnBoss();
}

// ---------- cambio de nivel ----------
const TRANSITION_S = 4.2;
function startTransition() {
  game.state = 'transition';
  game.transT = 0;
  input.reset();
  clearBanners();
  game.combo.reset();
  const done = LEVELS[game.level - 1], next = LEVELS[game.level];
  $('#level-done').textContent = `NIVEL ${done.id} COMPLETO`;
  $('#level-name').textContent = done.name;
  $('#level-pts').textContent = game.score.total.toLocaleString('es-AR') + ' puntos';
  $('#level-next').textContent = `→ NIVEL ${next.id}: ${next.name}`;
  $('#level-card').classList.remove('hidden');
  game.facu.say(game.facu.lines.level2, 3.4);
  audio.sfx('clear');
}

function endTransition() {
  setLevel(game.level + 1);
  const L = LEVELS[game.level - 1];
  const h = game.hero;
  game.enemies.clear(); game.butter.clear(); game.psycho.stop();
  game.traps.reset(); // nada de Buenos Aires (un colectivo en camino) pasa a Francia
  h.actor.position.set(L.start, 0, 0);
  h.actor.setFacing(1);
  h.hp = Math.min(h.hpMax, h.hp + 2);
  h.inv = 0;
  game.facu.park(L.start + 3);
  $('#level-card').classList.add('hidden');
  game.state = 'playing';
  input.reset();
  updateCamera(0, true);
  game.banner('NIVEL 2: FRANCIA', 'Seguí hasta el galpón de BIG CHAKY →');
}
game.startTransition = startTransition;

function spawnBoss() {
  game.boss = createBoss(game.ctx, world.bounds.maxX - 14);
  game.banner('👑 BIG CHAKY', '«¡De acá no pasa nadie! ¡La nena se queda conmigo!»');
  game.ctx.audio?.music('boss');
  game.ctx.audio?.sfx('roar');
}

game.onBossDown = () => {
  game.state = 'rescue';
  game.rescueT = 0;
  input.reset();
  const h = game.hero.actor;
  h.position.set(world.bounds.maxX - 9, 0, -0.6);
  h.setFacing(1);
  h.setPose('idle');
  game.facu.park(world.bounds.maxX - 14);
  game.facu.say('¡MARGOT ESTÁ A SALVO! ¡Un aplauso para ' + HERO_CFG[game.heroId].name + '!', 3.5);
  game.banner('🎉 ¡RESCATADA!', 'Margot vuelve a casa.', 3.4);
  game.ctx.audio?.sfx('fanfare');
};

// Atajo para pruebas y para saltar a una parte del recorrido
const STAGES = {
  vereda: { wave: 'vereda', at: 24 },
  avenida: { wave: 'avenida', at: 74 },
  piquete: { wave: 'piquete', at: 108 },
  'le-concept': { wave: 'le-concept', at: 128 },
  francia: { wave: 'francia', at: 164 },
  'francia-quiet': { upTo: 'francia', at: 170 },
  boulevard: { wave: 'boulevard', at: 214 },
  'boulevard-quiet': { upTo: 'boulevard', at: SECRET_X - 6 },
  galpon: { upTo: WAVES[WAVES.length - 1].id, at: GALPON_X + 8, boss: true }
};
const ALIASES = { plaza: 'avenida', 'plaza-quiet': 'boulevard-quiet' };
game.setStage = (id) => {
  const st = STAGES[ALIASES[id] || id];
  clearRun();
  game.props.reset();
  const p = game.hero.actor.position;
  game.state = 'playing';
  Object.assign(game.hero, { stunT: 0, slowT: 0, knock: 0, knockZ: 0, lift: 0, vy: 0, state: 'free' });
  // Todo lo anterior queda despejado (y sus portones abiertos)
  const stop = WAVES.findIndex(w => w.id === (st.wave || st.upTo));
  const target = WAVES[stop];
  WAVES.forEach((w, i) => {
    if (i < stop || (st.upTo && i === stop)) { game.waves[w.id] = 'cleared'; if (w.gate != null) openGate(w.gate); }
  });
  setLevel(target.level);
  p.set(st.at, 0, 0);
  if (st.wave) { game.waves[st.wave] = 'active'; game.enemies.spawnWave(st.wave); }
  if (st.boss) spawnBoss();
  clearBanners();
  game.facu.park(p.x + 3);
  updateCamera(0, true);
};

game.onHeroDown = () => finish(false);

function finish(won) {
  if (game.state !== 'playing' && game.state !== 'rescue') return;
  game.state = 'result';
  input.reset();
  game.psycho.stop();
  game.lastResult = { won, ...game.score.finalize({ hpLeft: game.hero.hp, hpMax: game.hero.hpMax, seconds: game.time, won }) };
  $('#touch').classList.add('hidden');
  $('#boss-bar').classList.add('hidden');
  audio.music(null);
  if (won) audio.sfx('fanfare');
  ui.showResult(game.lastResult, game.heroId);
}
game.finish = finish;

// ---------- pausa ----------
function pause() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  input.reset();
  audio.pauseMusic();
  showScreen('screen-pause');
}
function resume() {
  if (game.state !== 'paused') return;
  input.reset();
  showScreen(null);
  game.state = 'playing';
  audio.resumeMusic();
  last = 0;
}
game.pause = pause;
game.resume = resume;

let last = 0;
function frame(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0) * game.timeScale;
  last = now;
  if (game.state === 'playing') {
    const t0 = performance.now();
    if (input.consume('pause')) pause();
    else if (!fx.frozen(dt)) {
      game.time += dt;
      game.hero.update(dt);
      game.enemies.update(dt);
      game.traps.update(dt);
      game.butter.update(dt);
      game.psycho.update(dt);
      game.facu.update(dt);
      game.boss?.update(dt);
      game.props.update(dt, game.time);
      updateZones();
      game.combo.update(dt);
      game.stats.maxMult = Math.max(game.stats.maxMult, game.score.multiplier);
    }
    updateHud();
    if (dt > 0) game.perf.record(dt * 1000, performance.now() - t0);
  } else if (game.state === 'intro') {
    game.time = 0;
    if (game.story.updateIntro(dt)) endIntro();
    game.hero.actor.update(dt, 0);
    game.facu.refreshLabels();
  } else if (game.state === 'transition') {
    game.transT += dt;
    game.hero.actor.update(dt, 0);
    game.facu.celebrate(dt);
    game.facu.refreshLabels();
    if (game.transT > TRANSITION_S) endTransition();
  } else if (game.state === 'rescue') {
    game.rescueT += dt;
    game.story.updateRescue(dt, game.rescueT);
    game.boss?.update(dt);
    game.facu.celebrate(dt);
    for (const [a, ph] of [[game.hero.actor, 0]]) {
      a.lift = Math.abs(Math.sin(game.rescueT * 7 + ph)) * 0.6;
      a.update(dt, 0);
    }
    game.facu.refreshLabels();
    if (game.rescueT > 3.6) finish(true);
  }
  if (bannerCurrent) { bannerTimer -= dt; if (bannerTimer <= 0) nextBanner(); }
  world.updateGates(dt);
  fx.update(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

async function boot() {
  resize();
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('blur', pause);
  assets = await loadAssets('assets/manifest.json', (f) => { $('#load-fill').style.width = Math.round(f * 100) + '%'; });
  registerSkins(assets);
  world = buildStreet(scene, assets);
  input = createInput({ canvas, joystick: $('#joystick'), knob: $('#knob'), buttons: document.querySelectorAll('.act') });
  fx = createFx(scene, camera, $('#labels'), $('#flash'));
  audio = createAudio(assets);
  const ctx = { scene, assets, world, input, fx, camera, game, audio };
  const ranking = createRanking({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
  game.ranking = ranking;
  const goMenu = () => { game.state = 'menu'; audio.music(game.coverStarted ? 'menu' : null); $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden'); game.facu?.refreshLabels(); showScreen('screen-menu'); };
  ui = createUi({ ranking, assets, showScreen, audio, onPlayAgain: () => startRun(game.heroId, false), onMenu: goMenu });
  game.goMenu = goMenu;
  game.ctx = ctx;
  game.world = world;
  game.input = input;
  game.enemies = createEnemies(ctx);
  game.traps = createTraps(ctx);
  game.butter = createButter(ctx);
  game.psycho = createPsycho(ctx);
  game.props = createProps(ctx);
  game.pickups = game.props.pickups;
  game.crates = game.props.crates;
  game.story = createStory(ctx);
  canvas.addEventListener('pointerdown', () => { if (game.state === 'intro') endIntro(); });
  addEventListener('keydown', () => { if (game.state === 'intro') endIntro(); });
  game.heroScreen = () => { const v = game.hero.actor.position.clone(); v.y += 1; v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; };
  game.quickStart = (heroId) => startRun(heroId);

  // Portada: el primer toque habilita el sonido (Safari) y arranca la música
  const startCover = () => {
    if (game.coverStarted || game.state !== 'menu') return;
    game.coverStarted = true;
    game.coverStartedAt = performance.now();
    $('#screen-menu').classList.add('started');
    audio.primeSpeech();
    audio.music('menu');
  };
  // En click (no en pointerdown): así el mismo toque no cae sobre ¡JUGAR! cuando aparece
  $('#screen-menu').addEventListener('click', startCover);
  addEventListener('keydown', (e) => { if (game.state === 'menu' && !game.coverStarted && !e.repeat) startCover(); });
  const justStarted = () => performance.now() - (game.coverStartedAt || 0) < 450;
  $('#btn-play').addEventListener('click', () => { if (!justStarted()) showScreen('screen-select'); });
  for (const card of document.querySelectorAll('.card')) card.addEventListener('click', () => { audio.primeSpeech(); startRun(card.dataset.hero, true); });
  $('#btn-pause').addEventListener('click', pause);
  $('#btn-resume').addEventListener('click', resume);
  $('#btn-restart').addEventListener('click', () => startRun(game.heroId));
  $('#btn-home').addEventListener('click', () => game.goMenu());
  $('#btn-ranking').addEventListener('click', () => { if (!justStarted()) ui.showRanking('screen-menu'); });
  const muteBtn = $('#btn-mute');
  const paintMute = () => { muteBtn.textContent = audio.muted ? '🔇' : '♪'; };
  paintMute();
  muteBtn.addEventListener('click', () => { audio.toggleMute(); paintMute(); muteBtn.blur(); });

  camera.position.set(6, 8, 14);
  camera.lookAt(camTarget);
  showScreen('screen-menu');
  game.state = 'menu';
  requestAnimationFrame(frame);
}

boot().catch((e) => {
  console.error(e);
  $('#screen-loading').innerHTML = '<h2>No se pudo cargar el juego</h2><p>Revisá la conexión y recargá la página.</p>';
});
