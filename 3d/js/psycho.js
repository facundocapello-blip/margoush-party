// Pantalla psicodélica del hongo venenoso: colores que giran, imagen que ondula y música estirada.
// Es solo un efecto: no quita vida ni invierte controles.
export const PSYCHO = { seconds: 6 };

export function createPsycho(ctx) {
  const canvas = document.getElementById('game');
  const fx = { t: 0, active: false, phase: 0 };

  function apply(k) {
    // k: 0..1 intensidad (sube rápido al empezar y baja al final)
    const hue = (fx.phase * 140) % 360;
    canvas.style.filter = `hue-rotate(${hue.toFixed(0)}deg) saturate(${(1 + 1.6 * k).toFixed(2)}) contrast(${(1 + 0.12 * k).toFixed(2)})`;
    const wob = Math.sin(fx.phase * 5);
    canvas.style.transform = `rotate(${(wob * 1.6 * k).toFixed(2)}deg) scale(${(1 + 0.04 * k + Math.sin(fx.phase * 3.3) * 0.02 * k).toFixed(3)})`;
    ctx.audio?.warp?.(1 - 0.18 * k * (0.5 + 0.5 * Math.sin(fx.phase * 2.1)));
  }

  return {
    get t() { return fx.t; },
    get active() { return fx.active; },
    start(seconds = PSYCHO.seconds) { fx.t = seconds; fx.active = true; },
    update(dt) {
      if (!fx.active) return;
      fx.t = Math.max(0, fx.t - dt);
      fx.phase += dt;
      if (fx.t <= 0) { this.stop(); return; }
      apply(Math.min(1, (PSYCHO.seconds - fx.t) / 0.5, fx.t / 0.7));
    },
    stop() {
      fx.active = false; fx.t = 0; fx.phase = 0;
      canvas.style.filter = ''; canvas.style.transform = '';
      ctx.audio?.warp?.(1);
    }
  };
}
