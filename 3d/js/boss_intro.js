// Mini-intro narrativa de 2 líneas para los jefes (Cepi, Lale y Pinky), salteable con un toque o tecla.
import { fillText } from './i18n.js';

export function attachBossIntro(ui, { name, line1, line2, quick = false, onSkip }) {
  const el = document.createElement('div');
  el.className = 'boss-intro';
  el.innerHTML = '<small></small><p class="l1"></p><b class="l2"></b><i class="skip"></i>';
  fillText(el.querySelector('small'), name);
  fillText(el.querySelector('.l1'), line1);
  fillText(el.querySelector('.l2'), line2);
  fillText(el.querySelector('.skip'), 'Tocá para empezar');
  ui.append(el);

  const tLine2 = quick ? 0.35 : 0.7;
  const tOut = quick ? 0.95 : 1.55;
  const dur = quick ? 1.2 : 1.9;
  let step = 0, done = false;

  const skip = (ev) => {
    if (done) return;
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    finish();
    onSkip?.();
  };
  el.addEventListener('pointerdown', skip);
  const onKey = (ev) => {
    if (done || ev.repeat || ev.code === 'Escape' || ev.code === 'KeyP') return;
    skip();
  };
  addEventListener('keydown', onKey);

  function update(t) {
    if (done) return true;
    if (step < 1 && t >= 0.04) { step = 1; el.classList.add('on1'); }
    if (step < 2 && t >= tLine2) { step = 2; el.classList.add('on2'); }
    if (t >= tOut) el.classList.add('out');
    if (t >= dur) { finish(); return true; }
    return false;
  }

  function finish() {
    if (done) return;
    done = true;
    removeEventListener('keydown', onKey);
    el.remove();
  }

  return { dur, update, finish };
}
