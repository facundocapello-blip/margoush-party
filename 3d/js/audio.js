import { makeThemes } from './music.js';
// Música (temas del 2D + uno sintetizado para el jefe) y efectos sintetizados.
const MUTE_KEY = 'margoush3d_muted';
export const MUSIC_GAIN = 0.42; // la música por debajo de golpes y voces

function noiseBurst(ac, out, noise, t, dur, vol, type, freq, q = 1, attack = 0.002) {
  const s = ac.createBufferSource(); s.buffer = noise;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, Math.random() * 0.1); s.stop(t + dur + 0.05);
}

// Piña en capas: chasquido + cuerpo + bombo grave. Cada golpe sale un poco distinto.
export function punch(ac, out, noise, t, power = 1) {
  const p = 0.86 + Math.random() * 0.28;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(170 * p, t);
  o.frequency.exponentialRampToValueAtTime(40 * p, t + 0.1 + 0.08 * power);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 + 0.2 * power, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14 + 0.12 * power);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + 0.4);
  noiseBurst(ac, out, noise, t, 0.025, 0.4, 'highpass', 2600 * p, 0.7, 0.001);
  noiseBurst(ac, out, noise, t, 0.07 + 0.06 * power, 0.25 + 0.12 * power, 'bandpass', 750 * p, 1.1);
  if (power > 1.2) noiseBurst(ac, out, noise, t + 0.01, 0.22, 0.25, 'lowpass', 260, 0.8, 0.01);
}

// «¡DIUSHBAG!» gritado corto y explosivo, estilo «¡Hadouken!»: sintetizado por formantes (sin archivos).
// Medio segundo: «DIU» que sube, «SH» cortante y «BAG!» acentuado con estallido y ráfaga de bola de fuego.
// pitch: 1 normal, <1 voz grave, >1 voz finita. Devuelve cuánto dura.
const FORMANTS = { i: [300, 2300, 3000], u: [330, 900, 2240], ae: [720, 1700, 2450] };
export const DIUSH = { u: 0.05, uEnd: 0.2, sh: 0.19, shEnd: 0.3, b: 0.31, ae: 0.34, g: 0.5 };
export function diushbag(ac, out, noise, t, pitch = 1) {
  const p = pitch, T = DIUSH;
  const tU = t + T.u, tUend = t + T.uEnd, tSh = t + T.sh, tShEnd = t + T.shEnd, tB = t + T.b, tAE = t + T.ae, tG = t + T.g;
  const src = ac.createOscillator(); src.type = 'sawtooth';
  const f = src.frequency;
  // grito: arranca alto, sube en la «U» y el «BAG» cae con fuerza
  f.setValueAtTime(260 * p, t);
  f.linearRampToValueAtTime(350 * p, tU);
  f.linearRampToValueAtTime(380 * p, tUend);
  f.setValueAtTime(400 * p, tB);
  f.exponentialRampToValueAtTime(240 * p, tG);
  const vg = ac.createGain();
  const G = vg.gain;
  G.setValueAtTime(0, t); G.linearRampToValueAtTime(0.7, t + 0.012);
  G.setValueAtTime(0.7, tUend - 0.03); G.linearRampToValueAtTime(0, tUend);
  G.setValueAtTime(0, tB); G.linearRampToValueAtTime(2.4, tB + 0.015);
  G.setValueAtTime(2.4, tG - 0.05); G.linearRampToValueAtTime(0, tG);
  // un poco de saturación: suena a grito y no a robot
  const sat = ac.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.6); }
  sat.curve = curve;
  src.connect(vg); vg.connect(sat);
  const mix = ac.createGain(); mix.gain.value = 0.62;
  [[5, 1], [9, 0.75], [11, 0.45]].forEach(([q, amp], k) => {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    const F = bp.frequency;
    F.setValueAtTime(FORMANTS.i[k], t);
    F.linearRampToValueAtTime(FORMANTS.u[k], tU);
    F.setValueAtTime(FORMANTS.u[k], tUend);
    F.setValueAtTime(FORMANTS.ae[k] * 0.6, tB);
    F.linearRampToValueAtTime(FORMANTS.ae[k], tAE);
    F.setValueAtTime(FORMANTS.ae[k], tG - 0.05);
    F.linearRampToValueAtTime(k === 1 ? 2100 : FORMANTS.ae[k] * 0.8, tG);
    const a = ac.createGain(); a.gain.value = amp * 2.4;
    sat.connect(bp); bp.connect(a); a.connect(mix);
  });
  mix.connect(out);
  noiseBurst(ac, out, noise, t, 0.025, 0.35, 'bandpass', 3200, 1.2, 0.001); // D
  // SH cortante
  const s = ac.createBufferSource(); s.buffer = noise;
  const sf = ac.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 3000; sf.Q.value = 1.4;
  const sg = ac.createGain();
  sg.gain.setValueAtTime(0, tSh); sg.gain.linearRampToValueAtTime(0.75, tSh + 0.02);
  sg.gain.setValueAtTime(0.75, tShEnd - 0.03); sg.gain.linearRampToValueAtTime(0, tShEnd);
  s.connect(sf); sf.connect(sg); sg.connect(out);
  s.start(tSh); s.stop(tShEnd + 0.02);
  // B: golpe seco + estallido grave, y la «bola de fuego» que sale silbando
  punch(ac, out, noise, tB, 2.2);
  const boom = ac.createOscillator(); boom.type = 'sine';
  boom.frequency.setValueAtTime(140, tB); boom.frequency.exponentialRampToValueAtTime(42, tB + 0.35);
  const bg = ac.createGain(); bg.gain.setValueAtTime(0.0001, tB); bg.gain.exponentialRampToValueAtTime(0.9, tB + 0.01); bg.gain.exponentialRampToValueAtTime(0.001, tB + 0.4);
  boom.connect(bg); bg.connect(out); boom.start(tB); boom.stop(tB + 0.42);
  const w = ac.createBufferSource(); w.buffer = noise;
  const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.Q.value = 2.5;
  wf.frequency.setValueAtTime(500, tG - 0.06); wf.frequency.exponentialRampToValueAtTime(3800, tG + 0.4);
  const wg = ac.createGain(); wg.gain.setValueAtTime(0, tG - 0.06); wg.gain.linearRampToValueAtTime(0.5, tG + 0.05); wg.gain.linearRampToValueAtTime(0, tG + 0.42);
  w.connect(wf); wf.connect(wg); wg.connect(out); w.start(tG - 0.06); w.stop(tG + 0.45);
  noiseBurst(ac, out, noise, tG, 0.03, 0.35, 'bandpass', 1700, 2, 0.002); // G
  src.start(t); src.stop(tG + 0.05);
  return tG + 0.45 - t;
}

// Voz de Marine: una voz francesa de mujer, dulce (si el celu la tiene). «Messi Gokou» suena a «merci beaucoup».
const FEMALE_FR = ['Amélie', 'Audrey', 'Aurélie', 'Marie', 'Virginie', 'Julie', 'Hortense', 'Denise', 'Céline', 'Léa', 'Chantal', 'Google français', 'Microsoft Denise'];
const MALE_FR = ['Thomas', 'Jacques', 'Daniel', 'Nicolas', 'Paul', 'Henri', 'Claude', 'Microsoft Paul'];
export function pickFemaleFrench(voices) {
  const fr = voices.filter(v => /^fr/i.test(v.lang));
  for (const name of FEMALE_FR) { const v = fr.find(x => x.name.includes(name)); if (v) return v; }
  return fr.find(v => /female|femme|woman/i.test(v.name)) || fr.find(v => !MALE_FR.some(m => v.name.includes(m))) || fr[0] || null;
}

export function createAudio(assets) {
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices()); } catch (_) {} }
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (_) {}
  let ac = null, master = null, noise = null;
  // Música por tramo, como en los juegos profesionales: un tema de calle (el mismo para los dos héroes),
  // otro para la persecución y otro para el jefe; al cambiar de tramo se funde en vez de cortarse.
  const themes = {
    street: Object.assign(new Audio(assets.url('music_street')), { loop: true, volume: 0.4, preload: 'none' })
  };
  let current = null; // 'menu' | 'intro' | 'chase' | 'byd' | 'ba' | 'francia' | 'boss' | 'rescate' | 'street' | null
  let musicBus = null, out = null; // out: adónde van los tonos (efectos → master, temas sintetizados → musicBus)
  let fadeTimer = null;
  let paused = false;

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ac = new AC(); } catch (_) { return false; }
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.8;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp); comp.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.connect(master); out = master;
      const len = ac.sampleRate * 0.4;
      noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // iOS no deja cambiar el volumen de un <audio>: la música pasa por la mezcla de Web Audio
      // con su propio volumen (y el botón de silencio la apaga junto con los efectos)
      for (const t of Object.values(themes)) {
        try {
          const src = ac.createMediaElementSource(t);
          const g = ac.createGain(); g.gain.value = MUSIC_GAIN;
          src.connect(g); g.connect(musicBus);
          t.volume = 1; t.routed = true;
        } catch (_) {}
      }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return true;
  }
  // Safari exige un gesto del usuario para habilitar el sonido
  // (iOS cuenta como gesto el toque al soltar o el click, no el pointerdown: se escuchan todos)
  const unlock = () => { ensure(); };
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(ev, unlock, { passive: true, capture: true });
  // iPhone con la llave de silencio: Web Audio queda muda salvo que la sesión sea de «reproducción»
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) {}

  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, vol, freq, q = 1, delay = 0) {
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  // «¡Diuuuuushbag!»: sale a veces, nunca dos seguidas (mínimo 3 s entre una y otra)
  let lastVoice = -10;
  function voice(delay = 0) {
    const pitch = [0.72, 1, 1, 1.32][Math.floor(Math.random() * 4)];
    lastVoice = ac.currentTime;
    diushbag(ac, master, noise, ac.currentTime + delay, pitch);
  }
  function maybeVoice(chance, delay) {
    if (ac.currentTime - lastVoice < 3 || Math.random() > chance) return;
    voice(delay);
  }

  const SFX = {
    swing: () => hiss(0.12, 0.25, 1800, 0.8),
    hit: () => punch(ac, master, noise, ac.currentTime, 1),
    hitHeavy: () => { punch(ac, master, noise, ac.currentTime, 1.6); maybeVoice(0.1, 0.1); },
    hurt: () => { tone('sawtooth', 220, 90, 0.22, 0.3); hiss(0.1, 0.25, 500); },
    ko: () => { punch(ac, master, noise, ac.currentTime, 1.4); tone('square', 320, 80, 0.3, 0.12, 0.05); maybeVoice(0.4, 0.15); },
    diushbag: () => voice(0),
    // Remate de «¡Messi Goku!»: carga de poder que sube + brillitos
    messigoku: () => {
      tone('sawtooth', 110, 880, 0.7, 0.12); tone('square', 220, 1760, 0.7, 0.05);
      hiss(0.7, 0.18, 1500, 0.5);
      [1319, 1568, 2093].forEach((f, i) => tone('sine', f, f, 0.18, 0.12, 0.62 + i * 0.07));
    },
    jump: () => tone('sine', 320, 640, 0.15, 0.18),
    dodge: () => hiss(0.18, 0.25, 2200, 0.7),
    power: () => { tone('sawtooth', 240, 60, 0.4, 0.35); hiss(0.35, 0.35, 300, 0.6); },
    pickup: () => { tone('sine', 660, 660, 0.08, 0.2); tone('sine', 990, 990, 0.14, 0.2, 0.07); },
    crate: () => { hiss(0.16, 0.4, 420, 0.9); tone('square', 140, 60, 0.12, 0.15); },
    secret: () => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.25, 0.2, i * 0.08)),
    clear: () => [392, 523, 659].forEach((f, i) => tone('triangle', f, f, 0.3, 0.2, i * 0.1)),
    slam: () => { tone('sine', 90, 30, 0.5, 0.7); hiss(0.4, 0.5, 200, 0.5); },
    roar: () => { tone('sawtooth', 110, 55, 0.6, 0.35); tone('sawtooth', 160, 70, 0.6, 0.18); },
    laugh: () => [0, 0.12, 0.24].forEach((d) => tone('triangle', 520, 380, 0.1, 0.18, d)),
    fanfare: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.45, 0.22, i * 0.12)),
    // Malos nuevos y trampas
    bombo: () => [0, 0.3, 0.6].forEach((d) => { tone('sine', 95, 45, 0.22, 0.6, d); hiss(0.08, 0.3, 180, 0.8, d); }),
    bom: () => { tone('sine', 70, 30, 0.5, 0.8); hiss(0.3, 0.45, 160, 0.6); },
    bell: () => [0, 0.16].forEach((d) => { tone('sine', 1760, 1760, 0.12, 0.18, d); tone('sine', 2640, 2640, 0.1, 0.08, d); }),
    whoosh: () => hiss(0.3, 0.25, 1200, 0.6),
    splash: () => { hiss(0.35, 0.4, 900, 0.5); tone('sine', 400, 120, 0.2, 0.12); },
    fall: () => { tone('sine', 520, 90, 0.5, 0.3); hiss(0.2, 0.3, 300, 0.8, 0.4); },
    horn: () => { tone('sawtooth', 330, 330, 0.55, 0.22); tone('sawtooth', 415, 415, 0.55, 0.14); },
    engine: () => { tone('sawtooth', 70, 140, 0.9, 0.2); hiss(0.9, 0.2, 250, 0.5); },
    paper: () => hiss(0.15, 0.2, 3200, 1.2),
    coin: () => { tone('square', 300, 150, 0.18, 0.15); },
    // monedita/medialuna juntada: «tling» corto y agudo
    coinPick: () => { tone('square', 1320, 1320, 0.05, 0.06); tone('square', 1760, 1760, 0.12, 0.06, 0.05); },
    scooter: () => { tone('square', 600, 900, 0.5, 0.06); hiss(0.4, 0.12, 2500, 1); },
    flap: () => [0, 0.07, 0.14, 0.21, 0.28].forEach((d) => hiss(0.06, 0.25, 1400, 1.5, d)),
    crowd: () => { hiss(1.2, 0.3, 700, 0.4); [0, 0.4, 0.8].forEach((d) => tone('triangle', 260, 240, 0.25, 0.12, d)); },
    fire: () => hiss(0.4, 0.25, 600, 0.6),
    // Cepi enojado (abucheo grave) y el gol que escucha Pinky por la radio
    boo: () => { tone('sawtooth', 180, 120, 0.55, 0.22); tone('sawtooth', 186, 118, 0.55, 0.14); hiss(0.5, 0.15, 500, 0.6); },
    goal: () => { hiss(1.3, 0.35, 900, 0.4); [523, 659, 784].forEach((f, i) => tone('square', f, f, 0.22, 0.1, 0.2 + i * 0.14)); }
  };

  // Temas sintetizados (uno por momento del juego): ver music.js
  const SYNTH = makeThemes(tone, hiss);
  const musicCtx = { intensity: 0 };
  let synthTimer = null, synthStep = 0, synthNext = 0;
  function synthTick() {
    const theme = SYNTH[current];
    if (!ac || !theme || paused) { synthNext = ac ? ac.currentTime + 0.1 : 0; return; }
    if (synthNext < ac.currentTime) synthNext = ac.currentTime + 0.05;
    while (synthNext < ac.currentTime + 0.3) {
      out = musicBus || master;
      try { theme.play(synthStep, synthNext - ac.currentTime, musicCtx); } finally { out = master; }
      synthStep++; synthNext += theme.stepFor ? theme.stepFor(musicCtx) : theme.step;
    }
  }

  function stopAll() {
    for (const t of Object.values(themes)) t.pause();
    if (synthTimer) { clearInterval(synthTimer); synthTimer = null; }
  }

  return {
    get muted() { return muted; },
    get current() { return current; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) {}
      if (master) master.gain.value = muted ? 0 : 0.8;
      for (const t of Object.values(themes)) t.muted = muted && !t.routed;
      if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
      return muted;
    },
    sfx(name) {
      if (muted || !ensure()) return;
      try { SFX[name]?.(); } catch (_) {}
    },
    // Cambia de tema con un fundido corto (fade = segundos de salida). Si ya suena ese tema, sigue sin cortarse.
    music(name, { fade = 0.45 } = {}) {
      if (name === current && !paused && !fadeTimer) return;
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
      const begin = () => {
        fadeTimer = null;
        stopAll();
        current = name;
        paused = false;
        if (musicBus) { const g = musicBus.gain, t0 = ac.currentTime; g.cancelScheduledValues(t0); g.setValueAtTime(0.0001, t0); g.linearRampToValueAtTime(1, t0 + 0.35); }
        if (!name) return;
        if (SYNTH[name]) {
          if (!ensure()) return;
          synthStep = 0; synthNext = ac.currentTime + 0.1;
          synthTimer = setInterval(synthTick, 90);
          return;
        }
        ensure();
        const t = themes[name];
        if (!t) return;
        t.muted = muted && !t.routed;
        try { t.currentTime = 0; } catch (_) {}
        t.play().catch(() => {});
      };
      const playing = current && !paused && musicBus && ac;
      if (!playing || fade <= 0) return begin();
      current = name; // ya cuenta como pedido (evita repetir el fundido)
      const g = musicBus.gain, t0 = ac.currentTime;
      g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(0.0001, t0 + fade);
      fadeTimer = setTimeout(begin, fade * 1000);
    },
    // 0..1: qué tan apurado va el tema (mini nivel del BYD: la carga de la batería)
    setIntensity(x) { musicCtx.intensity = Math.max(0, Math.min(1, x || 0)); },
    // Estira o acelera la música de fondo (hongo venenoso); 1 = normal
    warp(rate) {
      for (const t of Object.values(themes)) { try { t.preservesPitch = false; t.playbackRate = rate; } catch (_) {} }
    },
    pauseMusic() {
      paused = true;
      for (const t of Object.values(themes)) t.pause();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    },
    resumeMusic() {
      paused = false;
      if (current && themes[current]) themes[current].play().catch(() => {});
    },
    // iOS: la voz solo funciona si se arrancó una vez dentro de un toque
    primeSpeech() {
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (_) {}
    },
    // opts: { female: true } = voz francesa de mujer, dulce y encantadora (más aguda y un poco más lenta)
    say(text, lang, opts = {}) {
      if (muted || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.volume = 1;
      if (opts.female) {
        const v = pickFemaleFrench(speechSynthesis.getVoices());
        if (v) { u.voice = v; u.lang = v.lang; }
        u.pitch = 1.35; u.rate = 0.92;
      }
      speechSynthesis.speak(u);
    },
    // Baja la música mientras alguien habla (k = volumen relativo) y la sube sola después de `secs`
    duck(secs, k = 0.55) {
      if (!musicBus || !ac) return;
      const g = musicBus.gain, t0 = ac.currentTime;
      g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0);
      g.linearRampToValueAtTime(k, t0 + 0.12);
      g.setValueAtTime(k, t0 + secs);
      g.linearRampToValueAtTime(1, t0 + secs + 0.4);
    },
    // Voz de un jefe (PROVISORIA: voz del sistema con el tono del perfil de voice.js)
    bossLine(text, prof, dur = 1.5) {
      if (muted || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const es = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
        const v = es.find(x => /es[-_]AR/i.test(x.lang)) || es.find(x => /es[-_](US|MX|419)/i.test(x.lang)) || es[0];
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = prof.lang || 'es-AR';
        u.pitch = prof.pitch ?? 1; u.rate = prof.rate ?? 1; u.volume = 1;
        speechSynthesis.speak(u);
        this.duck(dur);
      } catch (_) {}
    },
    // Marine dice «¡Messi Goku!» como un «merci beaucoup» encantador
    messiGoku() {
      this.sfx('messigoku');
      this.say('Messi Gokou !', 'fr-FR', { female: true });
    }
  };
}
