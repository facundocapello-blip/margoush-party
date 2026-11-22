// Teclado + controles táctiles. pressed(a) = mantenido; consume(a) = una vez por toque.
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  KeyJ: 'attack', Space: 'jump', KeyK: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge',
  KeyL: 'power', KeyE: 'power', Escape: 'pause', KeyP: 'pause'
};
const ACTIONS = ['attack', 'jump', 'dodge', 'power', 'pause'];

export function createInput(dom) {
  const held = new Set();
  const queued = new Set();
  const stick = { id: null, x: 0, z: 0, originX: 0, originY: 0 };

  const press = (a) => { if (!held.has(a)) queued.add(a); held.add(a); };
  const release = (a) => held.delete(a);

  addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    if (!e.repeat) press(a); else held.add(a);
  });
  addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) release(a); });

  // Clic sobre el juego: izquierdo pega, derecho esquiva
  dom.canvas.addEventListener('mousedown', (e) => { if (e.button === 0) press('attack'); if (e.button === 2) press('dodge'); });
  dom.canvas.addEventListener('mouseup', (e) => { release(e.button === 2 ? 'dodge' : 'attack'); });
  dom.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Joystick flotante: aparece donde apoyás el pulgar en la mitad izquierda (no hay que apuntarle a un círculo)
  const joy = dom.joystick, knob = dom.knob, zone = dom.zone;
  const moveStick = (cx, cy) => {
    const rad = joy.getBoundingClientRect().width * 0.38;
    let dx = cx - stick.originX, dy = cy - stick.originY;
    const len = Math.hypot(dx, dy);
    if (len > rad) { dx *= rad / len; dy *= rad / len; }
    const dead = 0.15;
    const nx = dx / rad, ny = dy / rad;
    stick.x = Math.abs(nx) < dead ? 0 : nx;
    stick.z = Math.abs(ny) < dead ? 0 : ny;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const homeStick = () => { joy.style.left = joy.style.top = joy.style.bottom = ''; joy.classList.remove('floating'); };
  const endStick = (e) => {
    if (e.pointerId !== stick.id) return;
    stick.id = null; stick.x = 0; stick.z = 0;
    knob.style.transform = 'translate(0px, 0px)';
    homeStick();
  };
  const grab = (e, el, center) => {
    if (stick.id !== null) return;
    stick.id = e.pointerId;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    if (center) {
      // el joystick se muda adonde tocaste (sin salirse de la pantalla)
      const size = joy.offsetWidth || 118;
      const x = Math.max(4, Math.min(innerWidth / 2 - size, e.clientX - size / 2));
      const y = Math.max(70, Math.min(innerHeight - size - 4, e.clientY - size / 2));
      joy.style.left = x + 'px'; joy.style.top = y + 'px'; joy.style.bottom = 'auto';
      joy.classList.add('floating');
    }
    const rect = joy.getBoundingClientRect();
    stick.originX = center ? e.clientX : rect.left + rect.width / 2;
    stick.originY = center ? e.clientY : rect.top + rect.height / 2;
    moveStick(e.clientX, e.clientY);
    e.preventDefault();
  };
  joy.addEventListener('pointerdown', (e) => grab(e, joy, false));
  zone?.addEventListener('pointerdown', (e) => grab(e, zone, true));
  zone?.addEventListener('lostpointercapture', endStick);
  addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) moveStick(e.clientX, e.clientY); }, true);
  addEventListener('pointerup', endStick, true);
  addEventListener('pointercancel', endStick, true);
  joy.addEventListener('lostpointercapture', endStick);

  // Botones de acción (owners: dedos apoyados en cada botón; se vacían en reset)
  const allOwners = [];
  for (const btn of dom.buttons) {
    const a = btn.dataset.action;
    const owners = new Set();
    allOwners.push(owners);
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      owners.add(e.pointerId);
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      press(a);
      btn.classList.add('pressed');
    });
    const up = (e) => {
      if (!owners.delete(e.pointerId)) return;
      if (!owners.size) { release(a); btn.classList.remove('pressed'); }
    };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  }

  return {
    get moveX() {
      if (stick.id !== null) return stick.x;
      return (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    },
    get moveZ() {
      if (stick.id !== null) return stick.z;
      return (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
    },
    pressed: (a) => held.has(a),
    consume: (a) => (queued.delete(a) ? true : false),
    reset() {
      held.clear();
      queued.clear();
      stick.id = null; stick.x = 0; stick.z = 0;
      knob.style.transform = 'translate(0px, 0px)';
      homeStick();
      for (const b of dom.buttons) b.classList.remove('pressed');
      for (const o of allOwners) o.clear();
    },
    ACTIONS
  };
}
