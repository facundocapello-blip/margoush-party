// Feedback táctil/visual unificado (game-feel):
// - Sacudida de cámara por trauma cuadrático (trauma^2) con senos sumados (sin ruido aleatorio).
// - Soporte de accesibilidad: reduce sacudida y destellos si el sistema o el jugador lo piden.
const REDUCE_KEY = 'margoush3d_reduce_motion';

export function isReducedMotion() {
  try {
    const saved = localStorage.getItem(REDUCE_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch (_) {}
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
}

export function setReducedMotion(on) {
  try { localStorage.setItem(REDUCE_KEY, on ? '1' : '0'); } catch (_) {}
}

export const shakeScale = () => (isReducedMotion() ? 0.22 : 1);
export const flashAlpha = (op) => (isReducedMotion() ? Math.min(0.14, op * 0.35) : op);

// Crea un controlador de sacudida sin asignaciones por cuadro (reutiliza `out`).
export function createShake({ decay = 2.4, maxX = 0.42, maxY = 0.28 } = {}) {
  let trauma = 0;
  let phase = 0;
  const out = { x: 0, y: 0 };
  return {
    add(amount) {
      trauma = Math.min(1, Math.max(0, trauma + amount));
    },
    set(amount) {
      trauma = Math.min(1, Math.max(trauma, amount));
    },
    step(realDt) {
      if (trauma <= 0) { out.x = 0; out.y = 0; return out; }
      const dt = Math.min(0.05, Math.max(0, realDt || 0));
      trauma = Math.max(0, trauma - decay * dt);
      const s = trauma * trauma * shakeScale();
      phase += dt * 34;
      out.x = maxX * s * Math.sin(phase * 1.7);
      out.y = maxY * s * Math.sin(phase * 2.3);
      if (trauma === 0) { out.x = 0; out.y = 0; }
      return out;
    },
    reset() { trauma = 0; out.x = 0; out.y = 0; },
    get trauma() { return trauma; }
  };
}

// Sacudida de golpe de la calle (Sakurai #103): 3 patrones distintos, no solo 3 escalas.
//   chica: solo vertical · media: X + Y · grande: X + Y más fuerte. Arranca en el máximo (cuadro 1) y se
//   apaga lineal; el signo cambia cada 2 cuadros (30 veces/s). Sin Math.random(): determinista.
// `amount` es la intensidad que ya pasan los llamadores (≤0.06 casi nada, ≤0.15 chica, ≤0.30 media, >0.30 grande).
export const HIT_SHAKE = {
  tiny:  { x: 0,    y: 0.01, dur: 3 / 60 },
  small: { x: 0,    y: 0.03, dur: 4 / 60 },
  mid:   { x: 0.10, y: 0.06, dur: 10 / 60 },
  big:   { x: 0.20, y: 0.14, dur: 18 / 60 }
};
export function hitShakeTier(amount) {
  return amount <= 0.06 ? HIT_SHAKE.tiny : amount <= 0.15 ? HIT_SHAKE.small : amount <= 0.30 ? HIT_SHAKE.mid : HIT_SHAKE.big;
}
export function createHitShake() {
  let tier = null, elapsed = 0;
  const out = { x: 0, y: 0 };
  return {
    set(amount) {
      const t = hitShakeTier(amount);
      // si ya hay una sacudida más fuerte en curso, no la pisa
      if (tier && elapsed < tier.dur && (tier.x + tier.y) * (1 - elapsed / tier.dur) > t.x + t.y) return;
      tier = t; elapsed = 0;
    },
    step(realDt) {
      if (!tier) { out.x = 0; out.y = 0; return out; }
      const k = 1 - elapsed / tier.dur;
      if (k <= 0) { tier = null; out.x = 0; out.y = 0; return out; }
      const sc = shakeScale() * k;
      out.x = tier.x * sc * (Math.floor(elapsed * 30) % 2 ? -1 : 1);
      out.y = tier.y * sc * (Math.floor(elapsed * 30 + 1) % 2 ? -1 : 1);
      elapsed += Math.min(0.05, Math.max(0, realDt || 0));
      return out;
    },
    reset() { tier = null; elapsed = 0; out.x = 0; out.y = 0; },
    get active() { return !!tier; }
  };
}

// Hit-stop en segundos (60 Hz): golpes 1 y 2 = 4F y 5F, remate = 9F; ver auditoría Sakurai (P0-1)
export const HITSTOP = { swing: [4 / 60, 5 / 60, 9 / 60], ko: 3 / 60, last: 16 / 60, prop: 3 / 60, hurt: 5 / 60, down: 20 / 60 };
