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
  let current = null; // 'douge' | 'marine' | 'boss' | null
  let paused = false;
  let bossTimer = null, bossStep = 0, bossNext = 0;

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
    fire: () => hiss(0.4, 0.25, 600, 0.6)
  };

  // Tema del jefe: pulso grave rápido sintetizado
  function bossTick() {
    if (!ac || current !== 'boss' || paused) { bossNext = ac ? ac.currentTime + 0.1 : 0; return; }
    const step = 0.18;
    if (bossNext < ac.currentTime) bossNext = ac.currentTime + 0.05;
    const bass = [110, 110, 131, 98];
    while (bossNext < ac.currentTime + 0.3) {
      const d = bossNext - ac.currentTime, i = bossStep % 16, bar = Math.floor(bossStep / 16) % 4;
      if (i % 4 === 0) { tone('sine', 120, 45, 0.16, 0.45, d); }
      if (i % 2 === 0) tone('triangle', bass[bar], bass[bar], step * 1.6, 0.18, d);
      if (i % 4 === 2) hiss(0.05, 0.12, 6000, 1.5, d);
      if (i === 6 || i === 14) tone('square', bass[bar] * 4, bass[bar] * 4, 0.1, 0.05, d);
      bossStep++; bossNext += step;
    }
  }

  function stopAll() {
    for (const t of Object.values(themes)) t.pause();
    if (bossTimer) { clearInterval(bossTimer); bossTimer = null; }
  }

  return {
    get muted() { return muted; },
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
      if (name === 'boss') {
        if (!ensure()) return;
        bossStep = 0; bossNext = ac.currentTime + 0.1;
        bossTimer = setInterval(bossTick, 90);
        return;
      }
      const t = themes[name];
      t.muted = muted;
      try { t.currentTime = 0; } catch (_) {}
      t.play().catch(() => {});
    },
    pauseMusic() {
      paused = true;
      for (const t of Object.values(themes)) t.pause();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    },
    resumeMusic() {
      paused = false;
      if (current && current !== 'boss') themes[current].play().catch(() => {});
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
