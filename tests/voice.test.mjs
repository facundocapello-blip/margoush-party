import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoice, CATALOG, COOLDOWN, PROFILES, bossBabblePlan } from '../3d/js/voice.js';
import { createAudio, MUSIC_VOL } from '../3d/js/audio.js';

const clock = () => { let t = 0; return { now: () => t, add: (s) => { t += s; } }; };

test('a higher priority line cuts the one that is playing; lower or equal ones are dropped', () => {
  const c = clock(), said = [];
  const v = createVoice({ speak: (txt) => said.push(txt), now: c.now, rand: () => 0.5 });
  assert.ok(v.say('chaky', 'attack'));
  assert.equal(v.say('chaky', 'taunt'), null);   // misma prioridad mientras habla
  assert.ok(v.say('chaky', 'hurt'));             // más importante: corta
  assert.ok(v.say('chaky', 'ko'));               // la derrota corta todo
  assert.equal(said.length, 3);
});

test('no line repeats twice in a row and every variant comes out', () => {
  const c = clock(), said = [];
  const v = createVoice({ speak: (txt) => said.push(txt), now: c.now });
  for (let i = 0; i < 30; i++) { v.say('chaky', 'attack'); c.add(10); }
  for (let i = 1; i < said.length; i++) assert.notEqual(said[i], said[i - 1]);
  assert.deepEqual(new Set(said), new Set(CATALOG.chaky.attack));
});

test('taunts wait their cooldown', () => {
  const c = clock();
  const v = createVoice({ now: c.now });
  assert.ok(v.say('chaky', 'taunt'));
  c.add(COOLDOWN.taunt - 0.5);
  assert.equal(v.say('chaky', 'taunt'), null);
  c.add(1);
  assert.ok(v.say('chaky', 'taunt'));
});

test('the five bosses have intro, attack, hurt, phase and ko lines and distinct babble timbres', () => {
  const bosses = ['chaky', 'cepi', 'lale', 'pinky', 'facu'];
  const sigs = new Set();
  for (const b of bosses) {
    for (const ev of ['intro', 'attack', 'hurt', 'phase', 'ko']) assert.ok(CATALOG[b][ev]?.length, `${b}.${ev}`);
    const p = PROFILES[b];
    assert.ok(p && p.baseHz > 0 && p.formant > 0 && p.step > 0, `perfil de balbuceo para ${b}`);
    sigs.add(`${p.baseHz}:${p.wave}:${p.formant}:${p.step}`);
    const plan = bossBabblePlan(CATALOG[b].intro[0], p, 1.4);
    assert.ok(plan.length >= 3 && plan.length <= 9, `${b} genera entre 3 y 9 sílabas`);
  }
  assert.equal(sigs.size, 5, 'cada uno de los 5 jefes tiene un timbre distinto');
  // Chaky es el más grave y lento; Pinky es el más agudo y rápido
  assert.ok(PROFILES.chaky.baseHz < PROFILES.lale.baseHz && PROFILES.lale.baseHz < PROFILES.facu.baseHz);
  assert.ok(PROFILES.facu.baseHz < PROFILES.cepi.baseHz && PROFILES.cepi.baseHz < PROFILES.pinky.baseHz);
  assert.ok(PROFILES.chaky.step > PROFILES.pinky.step);
});

test('H-5: audio.bossLine respeta silencio, genera sílabas por jefe y duck() vuelve a MUSIC_VOL (0.78)', () => {
  const prevWin = globalThis.window, prevAdd = globalThis.addEventListener;
  const oscStarted = [], ramps = [];
  class FakeAC {
    constructor() { this.currentTime = 1; this.sampleRate = 8000; this.state = 'running'; this.destination = {}; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    createGain() {
      const g = { value: 0.78, cancelScheduledValues() {}, setValueAtTime() {}, exponentialRampToValueAtTime() {},
        linearRampToValueAtTime(v) { ramps.push(v); } };
      return { gain: g, connect() {} };
    }
    createDynamicsCompressor() { return { connect() {} }; }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBiquadFilter() { return { type: 'bandpass', frequency: { setValueAtTime() {}, value: 0 }, Q: { value: 1 }, connect() {} }; }
    createOscillator() {
      const o = { type: 'sine', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {},
        start() { oscStarted.push(o.type); }, stop() {} };
      return o;
    }
  }
  globalThis.window = { AudioContext: FakeAC };
  globalThis.addEventListener = () => {};
  try {
    const a = createAudio();
    const n = a.bossLine('¡Soy BIG CHAKY… y vine a bailar!', PROFILES.chaky, 1.2);
    assert.ok(n >= 3 && oscStarted.length === n, 'suenan sílabas cuando no está silenciado');
    assert.equal(ramps[ramps.length - 1], MUSIC_VOL, 'duck() vuelve a MUSIC_VOL (0.78) y no a 1');
    assert.equal(MUSIC_VOL, 0.78);

    // Con silencio activado no debe sonar nada
    a.toggleMute();
    const before = oscStarted.length;
    assert.equal(a.bossLine('¡Esto es arte, che!', PROFILES.facu, 1.0), 0);
    assert.equal(oscStarted.length, before, 'con silencio no arranca ningún oscilador');
  } finally {
    globalThis.window = prevWin;
    globalThis.addEventListener = prevAdd;
  }
});
