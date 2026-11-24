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

test('el cartel de ronda de Big Chaky no tapa los 5 carriles y las notas no interceptan el toque', () => {
  const css = readFileSync(new URL('../3d/css/game.css', import.meta.url), 'utf8');
  assert.match(css, /body\.chaky-dance #arena-ui \.phase-card\.p2\s*\{[^}]*bottom:\s*calc\(var\(--deck-height\)/);
  assert.match(css, /#arena-ui \.rec,\s*#arena-ui \.note\s*\{[^}]*pointer-events:\s*none;/);
});

test('entrar a Big Chaky desde la calle limpia carteles y combo pendientes', () => {
  const spawnSrc = main.slice(main.indexOf('function spawnBoss('), main.indexOf('function spawnCepi('));
  let bannersCleared = 0, comboReset = 0, inputReset = 0, healed = 0, arenaStarted = 0;
  const game = {
    heroId: 'douge',
    combo: { reset() { comboReset++; } },
    ctx: { audio: { music() {} } },
    arena: { start() { arenaStarted++; } }
  };
  const context = {
    game,
    input: { reset() { inputReset++; } },
    clearBanners() { bannersCleared++; },
    healBeforeBoss() { healed++; },
    assets: { ensure: () => Promise.resolve() },
    saveCheckpoint() {},
    CHECKPOINTS: { chaky: { label: 'JEFE 1 · BIG CHAKY' } },
    curtain(fn) { fn(); },
    continueTransition(_, fn) { fn(); }
  };
  runInNewContext(spawnSrc + '\nspawnBoss();', context);
  assert.equal(inputReset, 1);
  assert.equal(bannersCleared, 1);
  assert.equal(comboReset, 1);
  assert.equal(healed, 1);
  assert.equal(arenaStarted, 1);
});

test('señales de Margot en fuga/Pinky y claridad de objetivo en ¡Rompé el BYD! con traducción FR', () => {
  const chase = readFileSync(new URL('../3d/js/chase.js', import.meta.url), 'utf8');
  const bonus = readFileSync(new URL('../3d/js/bonus.js', import.meta.url), 'utf8');
  const pinky = readFileSync(new URL('../3d/js/arena_pinky.js', import.meta.url), 'utf8');
  const i18n = readFileSync(new URL('../3d/js/i18n.js', import.meta.url), 'utf8');
  assert.match(chase, /margot-ico/);
  assert.match(chase, /hintE\.classList\.remove\('hidden'\)/);
  assert.match(bonus, /JEFE 2 · CEPI «EL NIÑO»/);
  assert.match(bonus, /bonus-goal/);
  assert.match(pinky, /pinky-margot-cue/);
  assert.match(pinky, /¡MARGOT SE PREPARA PARA AYUDAR!/);
  assert.match(i18n, /¡CUIDADO! ¡CAMBIÁ DE CARRIL!/);
  assert.match(i18n, /¡PEGALE A CEPI A LA DERECHA PARA DESENCHUFAR!/);
  assert.match(i18n, /¡TOCÁ PARA EL GRITO DE MARGOT!/);
  const bydStart = main.slice(main.indexOf('function startBydLevel()'), main.indexOf('function bydDone()'));
  assert.match(bydStart, /_back_/);
});


