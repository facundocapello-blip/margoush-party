import { loadAssets } from './assets.js';
import { buildStreet } from './world.js';
import { createInput } from './input.js';
import { createScore } from './score.js';
import { createFx } from './fx.js';
import { createHero, HERO_CFG } from './hero.js';
import { createEnemies } from './enemies.js';
import { createProps } from './props.js';
import { createFacu } from './facu.js';
import { createBoss } from './boss.js';
import { createStory } from './story.js';
import { createAudio } from './audio.js';
import { createUi } from './ui.js';
import { createRanking } from './ranking.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

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
  waves: { vereda: 'idle', plaza: 'idle' },
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

game.banner = (title, text, seconds = 3.2) => {
  const b = $('#banner');
  b.replaceChildren();
  const strong = document.createElement('b');
  strong.textContent = title;
  b.append(strong, document.createTextNode(text));
  b.classList.remove('hidden');
  bannerTimer = seconds;
};

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
  game.boss?.dispose();
  game.boss = null;
  game.story?.endIntro();
  game.story?.resetCage();
  fx.clear();
  game.combo.reset();
  for (const g of world.gates) { g.open = false; g.mesh.visible = true; }
  game.waves = { vereda: 'idle', plaza: 'idle' };
}

function startRun(heroId, withIntro = false) {
  game.heroId = heroId;
  if (game.hero) game.hero.actor.dispose();
  clearRun();
  const ctx = game.ctx;
  game.hero = createHero(heroId, ctx);
  game.hero.actor.position.set(4, 0, 0.5);
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
  game.facu.say(game.facu.lines.intro, 5);
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
  g.mesh.visible = false;
  game.banner('¡ZONA DESPEJADA!', 'Seguí hacia la derecha →');
  game.ctx.audio?.sfx('clear');
}

function updateZones() {
  const x = game.hero.actor.position.x;
  for (const [id, trigger, gate] of [['vereda', 36, 0], ['plaza', 96, 1]]) {
    if (game.waves[id] === 'idle' && x > trigger) {
      game.waves[id] = 'active';
      game.enemies.spawnWave(id);
      game.banner(id === 'vereda' ? 'LA VEREDA' : 'LA PLAZA', '¡Llegó la banda de BIG CHAKY!');
    } else if (game.waves[id] === 'active' && game.enemies.alive() === 0) {
      game.waves[id] = 'cleared';
      openGate(gate);
    }
  }
  if (!game.boss && game.waves.plaza === 'cleared' && x > world.galponX + 6) spawnBoss();
}

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

// Atajo para pruebas y para saltar a una parte del nivel
game.setStage = (id) => {
  clearRun();
  game.props.reset();
  const p = game.hero.actor.position;
  game.state = 'playing';
  if (id === 'vereda') { p.set(38, 0, 0); game.waves.vereda = 'active'; game.enemies.spawnWave('vereda'); }
  if (id === 'plaza' || id === 'plaza-quiet') {
    openGate(0); game.waves.vereda = 'cleared';
    p.set(110, 0, 0);
    if (id === 'plaza') { game.waves.plaza = 'active'; game.enemies.spawnWave('plaza'); } else game.waves.plaza = 'cleared';
  }
  if (id === 'galpon') { openGate(0); openGate(1); game.waves.vereda = game.waves.plaza = 'cleared'; p.set(world.galponX + 8, 0, 0); spawnBoss(); }
  $('#banner').classList.add('hidden');
  game.facu.park(p.x + 3);
  updateCamera(0, true);
};

game.onHeroDown = () => finish(false);

function finish(won) {
  if (game.state !== 'playing' && game.state !== 'rescue') return;
  game.state = 'result';
  input.reset();
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
  } else if (game.state === 'rescue') {
    game.rescueT += dt;
    game.story.updateRescue(dt, game.rescueT);
    game.boss?.update(dt);
    for (const [a, ph] of [[game.hero.actor, 0]]) {
      a.lift = Math.abs(Math.sin(game.rescueT * 7 + ph)) * 0.6;
      a.update(dt, 0);
    }
    game.facu.refreshLabels();
    if (game.rescueT > 3.6) finish(true);
  }
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $('#banner').classList.add('hidden'); }
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
  world = buildStreet(scene, assets);
  input = createInput({ canvas, joystick: $('#joystick'), knob: $('#knob'), buttons: document.querySelectorAll('.act') });
  fx = createFx(scene, camera, $('#labels'), $('#flash'));
  audio = createAudio(assets);
  const ctx = { scene, assets, world, input, fx, camera, game, audio };
  const ranking = createRanking({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
  game.ranking = ranking;
  const goMenu = () => { game.state = 'menu'; audio.music(null); $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden'); game.facu?.refreshLabels(); showScreen('screen-menu'); };
  ui = createUi({ ranking, assets, showScreen, audio, onPlayAgain: () => startRun(game.heroId, false), onMenu: goMenu });
  game.goMenu = goMenu;
  game.ctx = ctx;
  game.world = world;
  game.input = input;
  game.enemies = createEnemies(ctx);
  game.props = createProps(ctx);
  game.pickups = game.props.pickups;
  game.crates = game.props.crates;
  game.story = createStory(ctx);
  canvas.addEventListener('pointerdown', () => { if (game.state === 'intro') endIntro(); });
  addEventListener('keydown', () => { if (game.state === 'intro') endIntro(); });
  game.heroScreen = () => { const v = game.hero.actor.position.clone(); v.y += 1; v.project(camera); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }; };
  game.quickStart = (heroId) => startRun(heroId);

  $('#btn-play').addEventListener('click', () => showScreen('screen-select'));
  for (const card of document.querySelectorAll('.card')) card.addEventListener('click', () => { audio.primeSpeech(); startRun(card.dataset.hero, true); });
  $('#btn-pause').addEventListener('click', pause);
  $('#btn-resume').addEventListener('click', resume);
  $('#btn-restart').addEventListener('click', () => startRun(game.heroId));
  $('#btn-home').addEventListener('click', () => game.goMenu());
  $('#btn-ranking').addEventListener('click', () => ui.showRanking('screen-menu'));
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
