// Indicaciones de la primera partida: una por vez, arriba al centro, y se van cuando hacés lo que piden.
// Al terminar los cuatro pasos no vuelven a salir en este celular.
const KEY = 'margoush3d_coach';

export const COACH_STEPS = [
  { id: 'move', touch: ['🕹', 'Apoyá el pulgar a la izquierda y caminá'], keys: ['← →', 'Caminá con las flechas o WASD'] },
  { id: 'combo', touch: ['👊', 'Tocá 3 veces seguidas: ¡REMATE!'], keys: ['J', 'Tocá J 3 veces seguidas: ¡REMATE!'] },
  { id: 'dodge', touch: ['💨', 'ESQUIVE: por un momento no te pegan'], keys: ['K', 'K para esquivar: no te pegan'] },
  { id: 'power', touch: ['⚡', 'Barra llena: MANTENÉ 👊 para el poder'], keys: ['L', 'Barra llena: L para el poder'] }
];

export function createCoach({ game, el, touch }) {
  let step = 0, shownT = 0, doneT = 0, start = null, prevPower = 1, active = false;
  const seen = () => { try { return localStorage.getItem(KEY) === 'done'; } catch (_) { return false; } };

  function render() {
    const s = COACH_STEPS[step];
    const [k, text] = touch ? s.touch : s.keys;
    el.replaceChildren();
    const kb = document.createElement('span'); kb.className = 'k'; kb.textContent = k;
    el.append(kb, document.createTextNode(text));
    el.classList.remove('done', 'hidden');
    shownT = 0;
  }

  function achieved(h) {
    const id = COACH_STEPS[step].id;
    if (id === 'move') return start && Math.abs(h.actor.position.x - start) > 2;
    if (id === 'combo') return h.state === 'attack' && h.combo === 2;
    if (id === 'dodge') return h.state === 'dodge';
    if (id === 'power') return prevPower >= 1 && h.power < 0.5;
    return false;
  }

  return {
    get step() { return active ? COACH_STEPS[step].id : null; },
    get debug() { return { start, shownT, doneT, active, step }; },
    reset() {
      active = !seen();
      step = 0; doneT = 0; start = null; prevPower = 1;
      if (active) render(); else el.classList.add('hidden');
    },
    update(dt = 0) {
      const h = game.hero;
      if (!active || !h || game.state !== 'playing') { if (game.state !== 'playing') el.classList.add('hidden'); return; }
      if (el.classList.contains('hidden') && !doneT) render();
      if (start === null) start = h.actor.position.x;
      shownT += dt;
      if (doneT) {
        doneT -= dt;
        if (doneT <= 0) {
          doneT = 0;
          step++;
          if (step >= COACH_STEPS.length) {
            active = false; el.classList.add('hidden');
            try { localStorage.setItem(KEY, 'done'); } catch (_) {}
          } else render();
        }
      } else if (shownT > 0.6 && achieved(h)) {
        el.classList.add('done');
        el.firstChild.textContent = '✓';
        doneT = 0.7;
      }
      prevPower = h.power;
    },
    hide() { active = false; el.classList.add('hidden'); }
  };
}
