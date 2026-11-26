// Textos flotantes que no se pisan (Etapa D · HUD).
// Cada nivel y arena proyecta sus textos a la pantalla y después llama a placePops():
// los más viejos se quedan donde están y los nuevos se corren (arriba, o abajo si no hay lugar)
// hasta no tocar a ninguno. Además nunca quedan debajo del HUD de arriba.

// Pura (se prueba en node): boxes = [{ x, y, w, h }] centradas, en orden de prioridad (la primera no se mueve).
const _placed = [];
const _boxPool = [];
const _boxes = [];

export function resolveOverlaps(boxes, { gap = 4, top = 0, bottom = Infinity } = {}) {
  _placed.length = 0;
  function fits(b) {
    if (b.y - b.h / 2 < top || b.y + b.h / 2 > bottom) return false;
    for (let i = 0; i < _placed.length; i++) {
      const p = _placed[i];
      if (Math.abs(b.x - p.x) < (b.w + p.w) / 2 + gap && Math.abs(b.y - p.y) < (b.h + p.h) / 2 + gap) return false;
    }
    return true;
  }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    b.y = Math.min(bottom - b.h / 2, Math.max(top + b.h / 2, b.y));
    if (!fits(b)) {
      // Probar escalones hacia arriba y hacia abajo, alternando, y quedarse con el más cercano libre
      const step = b.h + gap, y0 = b.y;
      let best = null;
      for (let k = 1; k <= 8 && best === null; k++) {
        for (let dir = -1; dir <= 1; dir += 2) {
          b.y = y0 + dir * step * k;
          if (fits(b)) { best = b.y; break; }
        }
      }
      b.y = best ?? y0; // sin lugar: se queda (mejor encimado que fuera de pantalla)
    }
    _placed.push(b);
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
  _boxes.length = 0;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    it.o._w ??= it.el.offsetWidth || 60;
    it.o._h ??= it.el.offsetHeight || 24;
    let box = _boxPool[i];
    if (!box) box = _boxPool[i] = { x: 0, y: 0, w: 0, h: 0 };
    box.x = it.x; box.y = it.y; box.w = it.o._w; box.h = it.o._h;
    _boxes.push(box);
  }
  resolveOverlaps(_boxes, { top, bottom: innerHeight - 8 });
  const k = Math.min(1, dt * 14);
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const target = _boxes[i].y - it.y;
    it.o._dy = it.o._dy === undefined ? target : it.o._dy + (target - it.o._dy) * k;
    const half = Math.min(it.o._w / 2, innerWidth * 0.46);
    const lx = Math.max(half + 6, Math.min(innerWidth - half - 6, it.x));
    it.el.style.left = lx + 'px';
    it.el.style.top = (it.y + it.o._dy) + 'px';
  }
}
