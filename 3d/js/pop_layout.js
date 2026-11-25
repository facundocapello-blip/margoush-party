// Textos flotantes que no se pisan (Etapa D · HUD).
// Cada nivel y arena proyecta sus textos a la pantalla y después llama a placePops():
// los más viejos se quedan donde están y los nuevos se corren (arriba, o abajo si no hay lugar)
// hasta no tocar a ninguno. Además nunca quedan debajo del HUD de arriba.

// Pura (se prueba en node): boxes = [{ x, y, w, h }] centradas, en orden de prioridad (la primera no se mueve).
export function resolveOverlaps(boxes, { gap = 4, top = 0, bottom = Infinity } = {}) {
  const placed = [];
  const hits = (b, p) => Math.abs(b.x - p.x) < (b.w + p.w) / 2 + gap && Math.abs(b.y - p.y) < (b.h + p.h) / 2 + gap;
  const fits = (b) => b.y - b.h / 2 >= top && b.y + b.h / 2 <= bottom && !placed.some(p => hits(b, p));
  for (const b of boxes) {
    b.y = Math.min(bottom - b.h / 2, Math.max(top + b.h / 2, b.y));
    if (!fits(b)) {
      // Probar escalones hacia arriba y hacia abajo, alternando, y quedarse con el más cercano libre
      const step = b.h + gap, y0 = b.y;
      let best = null;
      for (let k = 1; k <= 8 && best === null; k++) {
        for (const dir of [-1, 1]) {
          b.y = y0 + dir * step * k;
          if (fits(b)) { best = b.y; break; }
        }
      }
      b.y = best ?? y0; // sin lugar: se queda (mejor encimado que fuera de pantalla)
    }
    placed.push(b);
  }
  return boxes;
}

let hudBottom = 0, hudCheck = 0;
function topLimit() {
  if (--hudCheck <= 0) {
    hudCheck = 8;
    // Lo de arriba es el HUD y, si está a la vista, la barra de vida del jefe
    let bottom = 0;
    for (const id of ['hud', 'boss-bar']) {
      const e = document.getElementById(id);
      if (!e || e.classList.contains('hidden')) continue;
      const r = e.getBoundingClientRect();
      if (r.height && r.top < innerHeight * 0.3) bottom = Math.max(bottom, r.bottom);
    }
    const nb = bottom ? Math.round(bottom + 6) : 8;
    // El cartel de fase se ubica justo debajo del HUD (variable CSS --hud-b)
    if (nb !== hudBottom) document.documentElement.style.setProperty('--hud-b', nb + 'px');
    hudBottom = nb;
  }
  return hudBottom;
}

// list = [{ o, el, x, y }] en orden de aparición (el más viejo primero). `o` guarda el desplazamiento suave.
export function placePops(list, dt = 1 / 60) {
  const top = topLimit();
  if (!list.length) return;
  const boxes = list.map(it => {
    it.o._w ??= it.el.offsetWidth || 60;
    it.o._h ??= it.el.offsetHeight || 24;
    return { x: it.x, y: it.y, w: it.o._w, h: it.o._h };
  });
  resolveOverlaps(boxes, { top, bottom: innerHeight - 8 });
  const k = Math.min(1, dt * 14);
  list.forEach((it, i) => {
    const target = boxes[i].y - it.y;
    it.o._dy = it.o._dy === undefined ? target : it.o._dy + (target - it.o._dy) * k;
    it.el.style.left = it.x + 'px';
    it.el.style.top = (it.y + it.o._dy) + 'px';
  });
}
