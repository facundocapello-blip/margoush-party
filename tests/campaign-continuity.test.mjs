import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createInput } from '../3d/js/input.js';
import { LEVELS, LE_CONCEPT_X, GATES, WAVES } from '../3d/js/level.js';

const main = readFileSync(new URL('../3d/js/main.js', import.meta.url), 'utf8');

test('la intro de Marine devuelve el control al comienzo del Acto 1', () => {
  const actor = {
    position: { x: LE_CONCEPT_X + 8, set(x, y, z) { Object.assign(this, { x, y, z }); } },
    setFacing() {},
    setPose() {},
    update() {}
  };
  const game = { state: 'intro', story: { endIntro: () => 'intro' }, hero: { actor }, banner() {} };
  const context = {
    game, LEVELS, TOUCH: true, input: { reset() {} }, saveCheckpoint() {}, clearBanners() {},
    fx: { clear() {} }, audio: { music() {} }, updateCamera() {}
  };
  runInNewContext(main.slice(main.indexOf('function endIntro()'), main.indexOf('function startChaseRun()')) + '\nendIntro();', context);
  assert.equal(game.state, 'playing');
  assert.equal(actor.position.x, LEVELS[0].start);
});

test('la pausa en la transición a Francia conserva el tramo al volver', () => {
  const game = { state: 'transition', chase: {}, bonus: {}, arena: {}, arenaCepi: {}, arenaLale: {}, arenaPinky: {} };
  const context = {
    game, pausedTransitions: [], document: { hidden: false }, input: { reset() {} },
    audio: { pauseMusic() {}, resumeMusic() {} }, showScreen() {}, tr: text => text,
    $: () => ({ classList: { toggle() {} } }), last: 0
  };
  const pauseLogic = main.slice(main.indexOf('const PAUSABLE'), main.indexOf('let last ='));
  const life = runInNewContext(pauseLogic + '\n({ pause, resume });', context);
  life.pause();
  assert.equal(game.state, 'paused');
  context.document.hidden = true;
  life.resume();
  assert.equal(game.state, 'paused');
  context.document.hidden = false;
  life.resume();
  assert.equal(game.state, 'transition');
});

test('un toque al borde del área del joystick no mueve al héroe hasta arrastrar', t => {
  const surface = new EventTarget();
  const zone = new EventTarget();
  const joystick = Object.assign(new EventTarget(), {
    offsetWidth: 118,
    style: {},
    classList: { add() {}, remove() {} },
    getBoundingClientRect() { return { left: parseInt(this.style.left), top: parseInt(this.style.top), width: 118 }; }
  });
  Object.assign(globalThis, {
    addEventListener: (...args) => surface.addEventListener(...args), innerWidth: 430, innerHeight: 932
  });
  t.after(() => {
    delete globalThis.addEventListener;
    delete globalThis.innerWidth;
    delete globalThis.innerHeight;
  });
  const input = createInput({ canvas: new EventTarget(), joystick, knob: { style: {} }, zone, buttons: [] });
  const pointer = (target, type, x, y) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), {
    pointerId: 17, clientX: x, clientY: y
  }));
  pointer(zone, 'pointerdown', 189, 920);
  assert.equal(input.moveX, 0);
  assert.equal(input.moveZ, 0);
  pointer(surface, 'pointermove', 217, 920);
  assert.ok(input.moveX > 0);
  pointer(surface, 'pointercancel', 217, 920);
  assert.equal(input.moveX, 0);
  assert.equal(input.moveZ, 0);
});

test('probar un jefe conserva la partida guardada de la campaña', () => {
  const saved = JSON.stringify({ id: 'francia', heroId: 'marine', score: 1800 });
  const storage = new Map([['checkpoint', saved]]);
  const context = {
    game: {}, PROBAR: 'chaky', CP_KEY: 'checkpoint',
    localStorage: {
      setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k), removeItem: k => storage.delete(k)
    }
  };
  const src = main.slice(main.indexOf('function saveCheckpoint'), main.indexOf('game.storedCheckpoint ='));
  const api = runInNewContext(src + '\n({saveCheckpoint, clearCheckpoint, storedCheckpoint})', context);
  api.clearCheckpoint();
  api.saveCheckpoint('galpon');
  assert.equal(api.storedCheckpoint(), null);
  assert.equal(storage.get('checkpoint'), saved);
});

test('no hay piquete y los 4 jefes (Chaky, Cepi, Lale, Pinky) no aparecen como secuaces en la calle', () => {
  assert.equal(GATES.some(g => g.kind === 'piquete'), false);
  assert.equal(WAVES.some(w => w.id === 'piquete'), false);
  const bossKinds = new Set(['chaky', 'cepi', 'cepiJefe', 'lale', 'pinky']);
  for (const w of WAVES) {
    for (const s of w.spawns) {
      assert.equal(bossKinds.has(s.kind), false, `oleada ${w.id} no debe spawnear al jefe ${s.kind}`);
    }
  }
});

test('un golpe mortal al cruzar el umbral del jefe conserva la derrota', () => {
  const update = main.slice(main.indexOf('function frameStep('), main.indexOf('// Malos fuera de pantalla'));
  const noop = () => {};
  const idle = { update: noop };
  const game = {
    state: 'playing', timeScale: 1, hero: { ...idle, actor: { position: { x: 144 } } },
    enemies: { update() { game.state = 'result'; } },
    traps: idle, butter: idle, psycho: idle, powers: idle, cameos: idle, margot: idle,
    props: idle, combo: idle, stats: {}, score: { multiplier: 1 }, perf: { record: noop }
  };
  const context = {
    game, document: { hidden: false }, PAUSABLE: new Set(['playing']), input: { consume: () => false },
    last: 1, performance, fx: { frozen: () => false, update: noop }, updateHud: noop,
    updateZones() { game.state = 'curtain'; }, bannerCurrent: null, world: { updateGates: noop },
    updateCamera: noop, updateOffscreen: noop, renderer: { render: noop }, scene: {}, camera: {},
    frame: noop, requestAnimationFrame: noop
  };
  runInNewContext(update + '\nframeStep(17);', context);
  assert.equal(game.state, 'result');
});
