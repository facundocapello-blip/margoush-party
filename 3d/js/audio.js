// Música (temas del 2D + uno sintetizado para el jefe) y efectos sintetizados.
const MUTE_KEY = 'margoush3d_muted';

export function createAudio(assets) {
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (_) {}
  let ac = null, master = null, noise = null;
  const themes = {
    douge: Object.assign(new Audio(assets.url('music_douge')), { loop: true, volume: 0.4, preload: 'none' }),
    marine: Object.assign(new Audio(assets.url('music_marine')), { loop: true, volume: 0.4, preload: 'none' })
  };
  let current = null; // 'douge' | 'marine' | 'boss' | 'menu' | null
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
      const len = ac.sampleRate * 0.4;
      noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return true;
  }
  // Safari exige un gesto del usuario para habilitar el sonido
  const unlock = () => { ensure(); };
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);

  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(dur, vol, freq, q = 1, delay = 0) {
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const SFX = {
    swing: () => hiss(0.12, 0.25, 1800, 0.8),
    hit: () => { tone('triangle', 170, 50, 0.14, 0.4); hiss(0.07, 0.3, 900); },
    hitHeavy: () => { tone('triangle', 130, 38, 0.24, 0.55); hiss(0.14, 0.4, 600); },
    hurt: () => { tone('sawtooth', 220, 90, 0.22, 0.3); hiss(0.1, 0.25, 500); },
    ko: () => { tone('square', 320, 80, 0.3, 0.18); hiss(0.2, 0.25, 400); },
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
    scooter: () => { tone('square', 600, 900, 0.5, 0.06); hiss(0.4, 0.12, 2500, 1); },
    flap: () => [0, 0.07, 0.14, 0.21, 0.28].forEach((d) => hiss(0.06, 0.25, 1400, 1.5, d)),
    crowd: () => { hiss(1.2, 0.3, 700, 0.4); [0, 0.4, 0.8].forEach((d) => tone('triangle', 260, 240, 0.25, 0.12, d)); },
    fire: () => hiss(0.4, 0.25, 600, 0.6),
    // Cepi enojado (abucheo grave) y el gol que escucha Pinky por la radio
    boo: () => { tone('sawtooth', 180, 120, 0.55, 0.22); tone('sawtooth', 186, 118, 0.55, 0.14); hiss(0.5, 0.15, 500, 0.6); },
    goal: () => { hiss(1.3, 0.35, 900, 0.4); [523, 659, 784].forEach((f, i) => tone('square', f, f, 0.22, 0.1, 0.2 + i * 0.14)); }
  };

  // Tema del jefe: pulso grave rápido sintetizado
  // Temas sintetizados: el del jefe y el de la portada. Cada uno arma un paso de su compás.
  const NOTE = { A2: 110, F2: 87.31, C3: 130.81, G2: 98, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880 };
  const MENU_CHORDS = [[NOTE.A2, [220, 261.63, 329.63]], [NOTE.F2, [174.61, 220, 261.63]], [NOTE.C3, [261.63, 329.63, 392]], [NOTE.G2, [196, 246.94, 293.66]]];
  const MENU_LEAD = [
    [[0, NOTE.E5, 6], [6, NOTE.D5, 2], [8, NOTE.E5, 4], [12, NOTE.A5, 4]],
    [[0, NOTE.F5, 6], [6, NOTE.E5, 2], [8, NOTE.C5, 8]],
    [[0, NOTE.G5, 6], [6, NOTE.F5, 2], [8, NOTE.E5, 4], [12, NOTE.D5, 4]],
    [[0, NOTE.D5, 8], [8, NOTE.B4, 4], [12, NOTE.D5, 4]]
  ];
  const SYNTH = {
    boss: { step: 0.18, play(n, d) {
      const bass = [110, 110, 131, 98];
      const i = n % 16, bar = Math.floor(n / 16) % 4;
      if (i % 4 === 0) { tone('sine', 120, 45, 0.16, 0.45, d); }
      if (i % 2 === 0) tone('triangle', bass[bar], bass[bar], 0.18 * 1.6, 0.18, d);
      if (i % 4 === 2) hiss(0.05, 0.12, 6000, 1.5, d);
      if (i === 6 || i === 14) tone('square', bass[bar] * 4, bass[bar] * 4, 0.1, 0.05, d);
    } },
    // Portada: épico en La menor (Am–F–C–G), 8 compases; la melodía entra en el compás 5
    menu: { step: 0.125, play(n, d) {
      const step = 0.125, i = n % 16, bar = Math.floor(n / 16) % 8;
      const [root, triad] = MENU_CHORDS[bar % 4];
      if (i === 0 || i === 8 || (i === 10 && bar % 2)) tone('sine', 140, 45, 0.18, 0.5, d);
      if (i === 4 || i === 12) { hiss(0.12, 0.26, 1800, 0.7, d); tone('triangle', 220, 170, 0.08, 0.08, d); }
      if (i % 2 === 0) hiss(0.03, 0.05, 8000, 2, d);
      if (i % 2 === 0) { const f = i % 4 === 2 ? root * 2 : root; tone('sawtooth', f, f, step * 1.8, 0.07, d); }
      if (i === 0) for (const f of triad) tone('triangle', f * 2, f * 2, step * 15, 0.03, d);
      if (bar < 4 && i % 4 === 0) { const f = triad[(i / 4) % 3] * 4; tone('triangle', f, f, step * 1.5, 0.03, d); }
      if (bar >= 4) for (const [at, f, len] of MENU_LEAD[bar % 4]) if (at === i) { tone('square', f, f, len * step * 0.95, 0.045, d); tone('triangle', f, f, len * step, 0.05, d); }
    } }
  };
  let synthTimer = null, synthStep = 0, synthNext = 0;
  function synthTick() {
    const theme = SYNTH[current];
    if (!ac || !theme || paused) { synthNext = ac ? ac.currentTime + 0.1 : 0; return; }
    if (synthNext < ac.currentTime) synthNext = ac.currentTime + 0.05;
    while (synthNext < ac.currentTime + 0.3) {
      theme.play(synthStep, synthNext - ac.currentTime);
      synthStep++; synthNext += theme.step;
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
      for (const t of Object.values(themes)) t.muted = muted;
      if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
      return muted;
    },
    sfx(name) {
      if (muted || !ensure()) return;
      try { SFX[name]?.(); } catch (_) {}
    },
    music(name) {
      stopAll();
      current = name;
      paused = false;
      if (!name) return;
      if (SYNTH[name]) {
        if (!ensure()) return;
        synthStep = 0; synthNext = ac.currentTime + 0.1;
        synthTimer = setInterval(synthTick, 90);
        return;
      }
      const t = themes[name];
      t.muted = muted;
      try { t.currentTime = 0; } catch (_) {}
      t.play().catch(() => {});
    },
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
    say(text, lang) {
      if (muted || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.volume = 0.9;
      speechSynthesis.speak(u);
    }
  };
}
