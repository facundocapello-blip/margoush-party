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
