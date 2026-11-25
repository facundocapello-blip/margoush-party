import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACU_ARENA, createFacuArenaLogic } from '../3d/js/arena_facu_logic.js';

const SAFE = { x: 4, z: -1, y: 0, dodging: false, inv: true };
function step(logic, secs, hero = SAFE, dt = 0.05) {
  const evs = [];
  for (let t = 0; t < secs; t += dt) evs.push(...logic.update(dt, hero));
  return evs;
}
function untilStage(l, stage, max = 20) {
  for (let t = 0; t < max && l.state.pick?.stage !== stage; t += 0.05) l.update(0.05, SAFE);
}

test('facu arena: arranca en revelación y después apunta al héroe y tira pintura con gesto previo', () => {
  const l = createFacuArenaLogic({ rand: () => 0.1 });
  assert.equal(l.state.mode, 'reveal');
  const hero = { x: -2, z: -1, y: 0, dodging: false, inv: true };
  let sawWindup = false, evs = [];
  for (let t = 0; t < 3.5; t += 0.05) {
    evs.push(...l.update(0.05, hero));
    if (l.state.blobs.some(b => b.stage === 'aim') && l.state.windup > 0) sawWindup = true;
  }
  assert.ok(evs.some(e => e.type === 'aim'));
  assert.ok(sawWindup, 'antes de tirar hay anticipación (windup)');
  assert.ok(evs.some(e => e.type === 'blobGo'));
  const splat = evs.find(e => e.type === 'splat');
  assert.ok(splat, 'la pintura cae al piso');
  assert.ok(Math.abs(splat.x - hero.x) < 0.01, 'apunta a donde estaba el héroe');
  assert.ok(l.inPaint(splat.x, splat.z), 'deja un charco pegajoso');
  assert.ok(!evs.some(e => e.type === 'carWarn'), 'en la fase 1 no hay autos/cuadros por carriles (no es Pinky)');
});

test('facu arena: si te quedás quieto la pintura te mancha; si te corrés, no', () => {
  const l = createFacuArenaLogic({ rand: () => 0.3 });
  const still = { x: 1, z: -1, y: 0, dodging: false, inv: false };
  const evs = step(l, 3.2, still);
  assert.ok(evs.some(e => e.type === 'hurt' && e.source === 'paint'));
  const l2 = createFacuArenaLogic({ rand: () => 0.3 });
  const h = { x: 1, z: -1, y: 0, dodging: false, inv: false };
  const evs2 = [];
  for (let t = 0; t < 3.2; t += 0.05) {
    if (l2.state.blobs.some(b => b.stage === 'fly')) h.x = -3.5; // se corre cuando ve venir la pintura
    else h.x = 1;
    evs2.push(...l2.update(0.05, h));
  }
  assert.ok(!evs2.some(e => e.type === 'hurt'));
});

test('facu arena: guarda mientras tira cuadros y recibe daño cuando se queda sin cuadros', () => {
  const l = createFacuArenaLogic({ rand: () => 0.2 });
  step(l, 2.2);
  const g = l.punch({ x: l.state.bossX, z: FACU_ARENA.meleeZ });
  assert.ok(g.some(e => e.type === 'guarded'));
  assert.equal(l.state.hp, FACU_ARENA.hpMax);
  for (let i = 0; i < 400 && l.state.mode !== 'charge'; i++) l.update(0.05, SAFE);
  assert.equal(l.state.mode, 'charge');
  const h = l.punch({ x: l.state.bossX, z: FACU_ARENA.meleeZ });
  assert.ok(h.some(e => e.type === 'meleeHit'));
  assert.ok(l.state.hp < FACU_ARENA.hpMax);
});

test('facu arena: pasar a la fase 2 abre el minijuego del cuadro verdadero', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p2At);
  assert.equal(l.state.phase, 2);
  assert.equal(l.state.mode, 'pick');
  assert.equal(l.state.pick.stage, 'show');
  assert.equal(l.state.pick.frames.filter(f => f.real).length, 1);
});

test('facu arena: el cuadro verdadero saca 3 y se mezcla sin perderse (siempre queda uno solo)', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p2At);
  const realId = l.state.pick.frames.find(f => f.real).id;
  untilStage(l, 'choose');
  const P = l.state.pick;
  assert.equal(P.stage, 'choose');
  assert.deepEqual(P.frames.map(f => f.x).sort((a, b) => a - b), FACU_ARENA.lanes); // un cuadro por carril
  const real = P.frames.find(f => f.id === realId);
  const evs = l.punch({ x: real.x, z: FACU_ARENA.meleeZ });
  assert.ok(evs.some(e => e.type === 'pickRight'));
  assert.equal(l.state.hp, FACU_ARENA.p2At - 3);
});

test('facu arena: el cuadro falso no daña a Facu y mancha de pintura al héroe; fuera de tiempo no pasa nada', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p2At);
  untilStage(l, 'choose');
  const fake = l.state.pick.frames.find(f => !f.real);
  const evs = l.punch({ x: fake.x, z: FACU_ARENA.meleeZ });
  assert.ok(evs.some(e => e.type === 'pickWrong'));
  assert.ok(evs.some(e => e.type === 'hurt' && e.penalty));
  assert.equal(l.state.hp, FACU_ARENA.p2At);
  // pega durante la mezcla: lo ignora
  step(l, 1.2);
  assert.equal(l.state.pick.stage, 'show'); // nueva ronda
  const early = l.punch({ x: 0, z: FACU_ARENA.meleeZ });
  assert.ok(early.some(e => e.type === 'guarded'));
  untilStage(l, 'choose');
  const t = step(l, FACU_ARENA.pick.choose + 0.2);
  assert.ok(t.some(e => e.type === 'pickTimeout'));
  assert.equal(l.state.hp, FACU_ARENA.p2At);
});

test('facu arena: tres aciertos terminan la fase 2 y entran en la 3 con Margot lista', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p2At);
  for (let r = 0; r < 4 && l.state.phase === 2; r++) {
    untilStage(l, 'choose');
    const real = l.state.pick.frames.find(f => f.real);
    l.punch({ x: real.x, z: FACU_ARENA.meleeZ });
    step(l, 1.2);
  }
  assert.equal(l.state.phase, 3);
  assert.equal(l.state.angry, true);
  step(l, 2);
  assert.equal(l.state.margotReady, true);
});

test('facu arena: los crayones de Margot lo derriten y el poder cierra el K.O.', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  step(l, 0.8);
  assert.ok(l.state.blobs.length > 0 || l.state.cars.length > 0);
  const m = l.triggerMargot();
  assert.ok(m.some(e => e.type === 'margotArt'));
  assert.ok(!m.some(e => e.type === 'margotCry'), 'Margot ya no llora como golpe');
  assert.equal(l.state.pose, 'love');
  assert.equal(l.state.hp, FACU_ARENA.p3At - 6);
  step(l, 3.0);
  assert.equal(l.state.margotReady, true);
  const ko = l.power();
  assert.ok(ko.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
});

test('facu arena: en la fase 3 levanta el cuadro antes de revolearlo (gesto) y siempre deja un carril libre', () => {
  const l = createFacuArenaLogic({ rand: () => 0.4 });
  l._setHp(FACU_ARENA.p3At);
  let lifted = false, wind = false, evs = [];
  for (let t = 0; t < 6 && !evs.some(e => e.type === 'carWarn'); t += 0.05) {
    const e = l.update(0.05, SAFE); evs.push(...e);
    if (e.some(x => x.type === 'frameLift')) lifted = true;
    if (lifted && l.state.windup > 0 && l.state.cars.length === 0) wind = true;
  }
  assert.ok(lifted && wind);
  assert.ok(l.state.cars.length <= 2);
});
