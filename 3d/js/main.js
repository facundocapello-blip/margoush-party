import { loadAssets } from './assets.js';
import { SpriteActor } from './sprites.js';
import { buildStreet } from './world.js';
import { createInput } from './input.js';
import { createScore } from './score.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');

export const HERO_CFG = {
  douge: { name: 'DOUGE', heightM: 2.3, speed: 6.6, poses: {
    idle: { tex: 'douge_idle' }, run: { tex: 'douge_run', h: 1.14, foot: 0.925 }, attack: { tex: 'douge_attack' } } },
  marine: { name: 'MARINE', heightM: 2.2, speed: 7.2, poses: {
    idle: { tex: 'marine_idle' }, run: { tex: 'marine_run', h: 1.293, foot: 0.918 }, attack: { tex: 'marine_attack' } } }
};

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
  score: null,
  time: 0,
  ctx: null
};
window.__game = game;

let assets, world, input;

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, game.lowQuality ? 1 : 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Siempre al menos 12 m de calle a lo ancho: en vertical la cámara se aleja
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camDist = Math.max(BASE_DIST, 6 / (halfV * camera.aspect));
  camera.updateProjectionMatrix();
  const touch = matchMedia('(pointer: coarse)').matches;
  $('#rotate-hint').classList.toggle('hidden', !(touch && h > w && game.state === 'playing'));
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
}

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
}

function startRun(heroId) {
  game.heroId = heroId;
  if (game.hero) game.hero.actor.dispose();
  const cfg = HERO_CFG[heroId];
  const actor = new SpriteActor(scene, assets, { poses: cfg.poses, heightM: cfg.heightM });
  actor.position.set(4, 0, 0.5);
  game.hero = { id: heroId, actor, speed: cfg.speed, hp: 5, hpMax: 5 };
  game.score = createScore();
  game.time = 0;
  input.reset();
  showScreen(null);
  $('#hud').classList.remove('hidden');
  $('#hud-name').textContent = cfg.name;
  $('#hud-portrait').style.backgroundImage = `url(${assets.url(cfg.poses.idle.tex)})`;
  if (matchMedia('(pointer: coarse)').matches) $('#touch').classList.remove('hidden');
  game.state = 'playing';
  updateCamera(0, true);
  resize();
}

function updateHeroBasic(dt) {
  const h = game.hero;
  const mx = input.moveX, mz = input.moveZ;
  const len = Math.hypot(mx, mz) || 1;
  const vx = (mx / Math.max(1, len)) * h.speed;
  const vz = (mz / Math.max(1, len)) * h.speed * 0.7;
  const p = h.actor.position;
  p.x += vx * dt;
  p.z += vz * dt;
  world.clampPosition(p);
  if (Math.abs(mx) > 0.1) h.actor.setFacing(Math.sign(mx));
  const speed = Math.hypot(vx, vz);
  h.actor.setPose(speed > 0.3 ? 'run' : 'idle');
  h.actor.update(dt, speed);
}

function heroScreen() {
  const v = game.hero.actor.position.clone();
  v.y += 1;
  v.project(camera);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
}
game.heroScreen = heroScreen;
game.quickStart = (heroId) => startRun(heroId);

let last = 0;
function frame(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (game.state === 'playing') {
    game.time += dt;
    updateHeroBasic(dt);
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

async function boot() {
  resize();
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  assets = await loadAssets('assets/manifest.json', (f) => { $('#load-fill').style.width = Math.round(f * 100) + '%'; });
  world = buildStreet(scene, assets);
  input = createInput({ canvas, joystick: $('#joystick'), knob: $('#knob'), buttons: document.querySelectorAll('.act') });
  game.ctx = { scene, assets, world, input, camera };

  $('#btn-play').addEventListener('click', () => showScreen('screen-select'));
  for (const card of document.querySelectorAll('.card')) card.addEventListener('click', () => startRun(card.dataset.hero));

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
