import { loadAssets } from './assets.js';
import { buildStreet } from './world.js';
import { createInput } from './input.js';
import { createScore } from './score.js';
import { createFx } from './fx.js';
import { createHero, HERO_CFG, POWER } from './hero.js';
import { createEnemies } from './enemies.js';
import { registerSkins } from './skins.js';
import { createTraps } from './traps.js';
import { createProps } from './props.js';
import { createButter } from './butter.js';
import { createPsycho } from './psycho.js';
import { createPowers } from './powers.js';
import { createFacu } from './facu.js';
import { createCameos } from './cameos.js';
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
const PORTRAIT = { fov: 60, halfWidth: 4.0 };
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

function updateHud(dt = 0) {
  const h = game.hero;
  const shown = Math.min(5, h.hpMax);
  const full = Math.min(shown, Math.ceil(h.hp * shown / h.hpMax));
  $('#hud-hearts').textContent = '❤️'.repeat(full) + '🖤'.repeat(shown - full);
  $('#hud-score').textContent = game.score.total.toLocaleString('es-AR');
  const m = game.score.multiplier;
  $('#hud-mult').textContent = m > 1 ? '×' + m.toFixed(1) : '';
  const pw = Math.min(1, h.power), ready = pw >= 1;
  $('#hud-power-fill').style.width = (pw * 100).toFixed(1) + '%';
  $('#hud-power').classList.toggle('ready', ready);
  $('#hud-power-text').textContent = ready ? (TOUCH ? '⚡ ¡LISTO!' : '⚡ ¡LISTO! (L)') : 'PODER';
  const atk = $('#act-attack');
  atk.style.setProperty('--pw', pw.toFixed(3));
  atk.style.setProperty('--hold', Math.min(1, h.holdT / POWER.hold).toFixed(3));
  atk.classList.toggle('ready', ready);
  atk.classList.toggle('charging', ready && h.holdT > 0.08);
}

function clearRun() {
  game.levelExit = false;
  game.enemies?.resetIntros?.();
  game.enemies?.clear();
  game.butter?.clear();
  game.cameos?.clear();
  game.psycho?.stop();
  game.powers?.clear();
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
  if (TOUCH) $('#touch').classList.remove('hidden');
  updateCamera(0, true);
  resize();
  clearBanners();
  $('#boss-bar').classList.add('hidden');
  // En la intro no suena el tema del héroe (solo los efectos del secuestro); arranca al empezar a jugar
  audio.music(withIntro ? null : heroId);
  if (withIntro) { game.state = 'intro'; game.story.startIntro(); }
  else game.state = 'playing';
  updateRotateHint();
}

function endIntro() {
  game.story.endIntro();
  game.state = 'playing';
  audio.music(game.heroId);
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
  // Menos carteles: un aviso chico arriba del héroe en vez de un cartel
  if (game.hero) fx.popup(game.hero.actor.position.clone().setY(3.3), '¡DESPEJADO! SEGUÍ →', '#7ee0c3', { size: 24, life: 1.4, rise: 0.4 });
  game.ctx.audio?.sfx('crate');
  game.ctx.audio?.sfx('clear');
}

function updateZones() {
  // Red de seguridad: nadie queda del otro lado de un portón cerrado (evita quedar trabado sin enemigos)
  const hp = game.hero.actor.position;
  for (const g of world.gates) {
    if (!g.open && hp.x > g.x) {
      hp.x = g.x - 1;
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
    if (st === 'idle' && x > w.trigger && game.cameos.busy) { game.cameos.hurry(); break; }
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
      if (w.endsLevel) {
        // El nivel termina al llegar al final de la calle, no apenas cae el último malo
        game.levelExit = true;
        game.banner('¡LE CONCEPT ES NUESTRO!', 'Seguí hasta el final de la calle para pasar a Francia →', 3.2);
      }
    }
  }
  if (game.levelExit && game.level < LEVELS.length) {
    const end = LEVELS[game.level - 1].maxX - 2.5;
    if (x >= end) { game.levelExit = false; startTransition(); return; }
    // Flecha que te marca el camino, cada tanto
    if (game.time - (game.exitHintAt ?? -99) > 2.2) {
      game.exitHintAt = game.time;
      fx.popup(new THREE.Vector3(Math.min(end, x + 4), 2.6, hp.z), 'FRANCIA →', '#7ee0c3', { size: 26, life: 1.6, rise: 0.2 });
    }
  }
  const last = WAVES[WAVES.length - 1];
  if (!game.boss && game.level === 2 && game.waves[last.id] === 'cleared' && x > world.galponX + 6) spawnBoss();
}

// ---------- cambio de nivel ----------
const TRANSITION_S = 3.2;
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
  audio.sfx('clear');
}

function endTransition() {
  setLevel(game.level + 1);
  const L = LEVELS[game.level - 1];
  const h = game.hero;
  game.enemies.clear(); game.butter.clear(); game.psycho.stop(); game.powers.clear();
  game.cameos.onLevelStart();
  game.traps.reset(); // nada de Buenos Aires (un colectivo en camino) pasa a Francia
  h.actor.position.set(L.start, 0, 0);
  h.actor.setFacing(1);
  h.hp = Math.min(h.hpMax, h.hp + 2);
  h.inv = 0;
  game.facu.reset();
  game.facu.france(L.start + 4); // Facu con boina y baguette: «¡Allez, allez!»
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
  game.banner('CÓMO GANARLE', 'Casi no siente los golpes: pegale cuando brilla (después de embestir o pisotear).', 3.6);
  game.ctx.audio?.music('boss');
  game.ctx.audio?.sfx('roar');
}

game.onBossDown = () => {
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
  // Saltar a una etapa (solo pruebas): Pinky no se cruza salvo que la prueba lo pida
  game.cameos.pinky.shown = { 1: true, 2: true };
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
  // Saltar a una etapa (solo pruebas): Facu no aparece salvo que la prueba lo pida
  game.facu.reset(); game.facu.jokeCd = 99;
  updateCamera(0, true);
};

game.onHeroDown = () => finish(false);

function finish(won) {
  if (game.state !== 'playing' && game.state !== 'rescue') return;
  game.state = 'result';
  input.reset();
  game.cameos.onLevelStart();
  game.psycho.stop();
  game.lastResult = { won, ...game.score.finalize({ hpLeft: game.hero.hp, hpMax: game.hero.hpMax, seconds: game.time, won }), photo: won ? game.photo : null };
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
      game.powers.update(dt);
      game.facu.update(dt);
      game.cameos.update(dt);
      game.boss?.update(dt);
      game.props.update(dt, game.time);
      updateZones();
      game.combo.update(dt);
      game.stats.maxMult = Math.max(game.stats.maxMult, game.score.multiplier);
    }
    updateHud(dt);
    if (dt > 0) game.perf.record(dt * 1000, performance.now() - t0);
  } else if (game.state === 'intro') {
    game.time = 0;
    if (game.story.updateIntro(dt)) endIntro();
    game.hero.actor.update(dt, 0);
  } else if (game.state === 'transition') {
    game.transT += dt;
    game.hero.actor.update(dt, 0);
    game.facu.celebrate(dt);
    if (game.transT > TRANSITION_S) endTransition();
  } else if (game.state === 'rescue') {
    game.rescueT += dt;
    const step = game.story.updateRescue(dt, game.rescueT);
    game.boss?.update(dt);
    game.facu.update(dt);
    if (step === 'photo') game.wantPhoto = true;
    if (step === 'done') finish(true);
  }
  if (bannerCurrent) { bannerTimer -= dt; if (bannerTimer <= 0) nextBanner(); }
  world.updateGates(dt);
  fx.update(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
  // Foto familiar del rescate: se saca justo después de dibujar el cuadro
  if (game.wantPhoto) { game.wantPhoto = false; try { game.photo = canvas.toDataURL('image/jpeg', 0.85); } catch (_) { game.photo = null; } }
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
  input = createInput({ canvas, joystick: $('#joystick'), knob: $('#knob'), zone: $('#stick-zone'), buttons: document.querySelectorAll('.act') });
  fx = createFx(scene, camera, $('#labels'), $('#flash'));
  audio = createAudio(assets);
  const ctx = { scene, assets, world, input, fx, camera, game, audio };
  const ranking = createRanking({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
  game.ranking = ranking;
  const goMenu = () => { game.cameos?.onLevelStart(); game.state = 'menu'; audio.music(game.coverStarted ? 'menu' : null); $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden'); showScreen('screen-menu'); };
  ui = createUi({ ranking, assets, showScreen, audio, onPlayAgain: () => startRun(game.heroId, false), onMenu: goMenu });
  game.goMenu = goMenu;
  game.ctx = ctx;
  game.world = world;
  game.input = input;
  game.enemies = createEnemies(ctx);
  game.traps = createTraps(ctx);
  game.butter = createButter(ctx);
  game.cameos = createCameos(ctx);
  game.psycho = createPsycho(ctx);
  game.powers = createPowers(ctx);
  game.props = createProps(ctx);
  game.pickups = game.props.pickups;
  game.crates = game.props.crates;
  game.story = createStory(ctx);
  for (const el of [canvas, $('#stick-zone')]) el.addEventListener('pointerdown', () => { if (game.state === 'intro') endIntro(); });
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
  for (const card of document.querySelectorAll('.card')) card.addEventListener('click', () => {
    audio.primeSpeech();
    // Chiste: al elegir a Marine dice «¡Messi Goku!» (en vez de «merci beaucoup»)
    if (card.dataset.hero === 'marine') { audio.sfx('messigoku'); audio.say('Messi Goku !', 'fr-FR'); }
    startRun(card.dataset.hero, true);
  });
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
