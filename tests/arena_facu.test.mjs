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

test('facu arena: arranca en revelación y después avisa y tira cuadros', () => {
  const l = createFacuArenaLogic({ rand: () => 0.1 });
  assert.equal(l.state.mode, 'reveal');
  const evs = step(l, 3.8);
  assert.ok(evs.some(e => e.type === 'carWarn'));
  assert.ok(evs.some(e => e.type === 'carGo'));
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

test('facu arena: el grito de Margot lo ablanda y el poder cierra el K.O.', () => {
  const l = createFacuArenaLogic({ rand: () => 0.5 });
  l._setHp(FACU_ARENA.p3At);
  assert.equal(l.state.phase, 3);
  step(l, 0.8);
  assert.ok(l.state.cars.length > 0);
  const m = l.triggerMargot();
  assert.ok(m.some(e => e.type === 'margotCry'));
  assert.equal(l.state.hp, FACU_ARENA.p3At - 6);
  step(l, 3.0);
  assert.equal(l.state.margotReady, true);
  const ko = l.power();
  assert.ok(ko.some(e => e.type === 'ko'));
  assert.equal(l.state.phase, 'ko');
});
