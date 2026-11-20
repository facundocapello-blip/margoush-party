// Escenas animadas («clips») hechas con los personajes del juego: franjas de cine, subtítulos y SALTAR.
//  - intro:  domingo en LE CONCEPT con Margot → aparece BIG CHAKY con la banda, les paga a Pinky, Lale y Cepi
//            → Cepi se lleva a Margot en su BYD (de ahí sale la persecución).
//  - byd:    después de romper el BYD → BIG CHAKY le saca a Margot a Cepi y se la lleva a Francia;
//            Cepi, furioso por el auto, se suma a la banda → hay que llegar al aeropuerto (Nivel 1).
// Todo se puede saltear tocando la pantalla o el botón SALTAR.
import { SpriteActor } from './sprites.js';
import { sheetPoses } from './cast.js';
import { fillText, tr } from './i18n.js';
import { LE_CONCEPT_X } from './level.js';

const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

// ---------- Capa de cine (DOM) ----------
function overlay() {
  let el = document.getElementById('cine');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cine';
    el.className = 'hidden';
    el.innerHTML = '<div class="cine-bar top"></div><div class="cine-cap"><b></b><small></small></div>' +
      '<div class="cine-bar bottom"><p class="cine-sub"><b></b><span></span></p></div>' +
      '<button class="cine-skip" type="button">SALTAR ⏭</button>';
    document.getElementById('app')?.appendChild(el) || document.body.appendChild(el);
  }
  const cap = el.querySelector('.cine-cap'), sub = el.querySelector('.cine-sub');
  return {
    el,
    skipButton: el.querySelector('.cine-skip'),
    show() { el.classList.remove('hidden'); document.body.classList.add('cine-on'); fillText(this.skipButton, 'SALTAR ⏭'); },
    hide() { el.classList.add('hidden'); document.body.classList.remove('cine-on'); this.caption(''); this.sub(''); },
    caption(big, small = '') {
      fillText(cap.querySelector('b'), big); fillText(cap.querySelector('small'), small);
      cap.classList.toggle('on', !!big); cap.classList.remove('cpop'); void cap.offsetWidth; if (big) cap.classList.add('cpop');
    },
    sub(who, line = '') {
      sub.querySelector('b').textContent = who ? tr(who) : '';
      fillText(sub.querySelector('span'), line);
      sub.classList.toggle('on', !!line); sub.classList.remove('cpop'); void sub.offsetWidth; if (line) sub.classList.add('cpop');
    }
  };
}

// ---------- Escenas ----------
export function createCine(ctx) {
  const { scene, assets, fx, camera, game } = ctx;
  const ui = overlay();
  let cur = null;

  const actor = (poses, h, x, z, facing = 1, pose = 'idle') => {
    const a = new SpriteActor(scene, assets, { poses, heightM: h });
    a.position.set(x, 0, z); a.setFacing(facing); a.setPose(pose); a.update(0, 0);
    return a;
  };
  const strollerPoses = { sleep: { tex: 'margot_sheet', cell: 0 }, cry: { tex: 'margot_sheet', cell: 2 }, happy: { tex: 'margot_sheet', cell: 3 } };
  const chakyPoses = () => ({ ...sheetPoses(assets, 'chaky', 'chaky_run'), arms: { tex: 'kidnap_sheet', cell: 0 }, push: { tex: 'kidnap_sheet', cell: 2 }, scared: { tex: 'kidnap_sheet', cell: 3 } });
  const say = (a, text, color = '#fff', size = 19, y = 3.3) => fx.popup(a.position.clone().setY(y), text, color, { size, life: 1.1, rise: 0.15 });

  // Cámara: a de (pos, mira) → b, con suavizado. En celu parado se aleja para que entre todo.
  function cam(a, b, k) {
    const e = ease(k), far = game.portrait ? 1.55 : 1;
    const L = (i, arr1, arr2) => arr1[i] + (arr2[i] - arr1[i]) * e;
    const lx = L(0, a.l, b.l), ly = L(1, a.l, b.l), lz = L(2, a.l, b.l);
    const px = L(0, a.p, b.p), py = L(1, a.p, b.p), pz = L(2, a.p, b.p);
    camera.position.set(lx + (px - lx) * far, ly + (py - ly) * far, lz + (pz - lz) * far);
    camera.lookAt(lx, ly, lz);
  }
  // Mover un actor hacia x con pose de caminar/correr; devuelve true al llegar
  function walk(a, x, speed, dt, pose = 'walk') {
    const d = x - a.position.x;
    if (Math.abs(d) < 0.05) { a.setPose(a.poses.idle ? 'idle' : 'step'); a.update(dt, 0); return true; }
    a.setFacing(Math.sign(d));
    a.setPose(a.poses[pose] ? pose : 'step');
    a.position.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
    a.update(dt, speed);
    return false;
  }

  // Línea de tiempo: eventos que pasan una sola vez + update de cada cuadro
  function timeline(events, duration, frame, dispose, kind) {
    const done = new Set();
    let t = 0;
    return {
      kind,
      update(dt) {
        t += dt;
        events.forEach((e, i) => { if (!done.has(i) && t >= e.at) { done.add(i); e.run(); } });
        frame(t, dt);
        return t >= duration;
      },
      dispose
    };
  }

  // ===== INTRO: Le Concept =====
  function intro(hero, heroId) {
    const X = LE_CONCEPT_X, other = heroId === 'douge' ? 'marine' : 'douge';
    const H = hero.actor;
    ctx.world?.setIntroMode?.(true); game.pickups?.setTrailVisible?.(false);
    H.position.set(X - 1.9, 0, 0.5); H.setFacing(1); H.setPose('idle');
    // El compañero parado tranquilo con su dibujo de siempre (el cuadro 0 de la hoja de acciones es la pose de pelea)
    const partnerPoses = sheetPoses(assets, other, other + '_idle');
    if (assets.has?.(other + '_idle')) partnerPoses.idle = { tex: other + '_idle' };
    const partner = actor(partnerPoses, 2.15, X + 0.9, 0.2, -1);
    const stroller = actor(strollerPoses, 1.7, X - 0.5, 1.1, 1, 'happy');
    const chaky = actor(chakyPoses(), 2.5, X + 14, -0.4, -1, 'walk');
    const crew = [['pinky', 1.2, -1.4], ['lale', 2.2, 1.2], ['cepi', 3.1, 0.1]].map(([id, dx, z]) =>
      ({ id, dx, a: actor(sheetPoses(assets, id, 'courier_' + id), 2.25, X + 14 + dx, z, -1, 'walk') }));
    const cepi = crew[2].a;
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    const S = {
      wide: { p: [X - 0.4, 4.3, 12.5], l: [X - 0.4, 1.5, 0] }, close: { p: [X - 0.5, 2.6, 7.6], l: [X - 0.5, 1.6, 0.4] },
      right: { p: [X + 7.5, 3.1, 9.5], l: [X + 8.5, 1.6, 0] }, pay: { p: [X + 7.2, 2.7, 7.8], l: [X + 7.4, 1.7, 0] },
      grab: { p: [X + 3, 4, 12.5], l: [X + 3, 1.4, 0] }, out: { p: [X + 5.5, 4.2, 13], l: [X + 6, 1.4, 0] }
    };
    let phase = 'family', heroRun = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.caption('LE CONCEPT', 'Domingo en Buenos Aires'); ctx.audio?.sfx('bell'); } },
      { at: 1.2, run: () => { ui.sub(other === 'douge' ? 'DOUGE' : 'MARINE', '¡Qué lindo domingo, Margot!'); } },
      { at: 2.3, run: () => { ui.caption(''); ui.sub('MARGOT', '¡Ajó, ajó!'); ctx.audio?.sfx('pickup'); } },
      { at: 3.4, run: () => { phase = 'chaky'; ui.sub(''); ctx.audio?.sfx('roar'); } },
      { at: 4.6, run: () => { ui.sub('BIG CHAKY', '¡Esa bebé va a ser mía! ¡Jua, jua, jua!'); fx.shake?.(0.25, 0.3); ctx.audio?.sfx('laugh'); chaky.setPose('arms'); } },
      { at: 6.6, run: () => { phase = 'pay'; ui.sub('BIG CHAKY', '¡Les pago lo que quieran! ¡Tráiganmela!'); } },
      { at: 7.2, run: () => { chaky.setPose('strike'); say(crew[0].a, '💵 ¡Estacionamiento pago!', '#ffe08a', 19, 3.0); ctx.audio?.sfx('coin'); } },
      { at: 8.0, run: () => { chaky.setPose('strike'); say(crew[1].a, '🧈 ¡Manteca de por vida!', '#ffe08a', 19, 3.6); ctx.audio?.sfx('coin'); } },
      { at: 8.8, run: () => { chaky.setPose('strike'); say(cepi, '🔌 ¡Un cargador para mi BYD!', '#ffe08a', 19, 3.0); ctx.audio?.sfx('coin'); } },
      { at: 9.8, run: () => { phase = 'grab'; ui.sub(''); chaky.setPose('arms'); } },
      { at: 11.4, run: () => { ui.sub('MARGOT', cry); } },
      { at: 13.6, run: () => { ui.sub(''); ui.caption('¡CEPI SE LLEVÓ A MARGOT!', 'Se escapa en su BYD. ¡Seguilo!'); ctx.audio?.sfx('engine'); } }
    ];
    let grabbed = false;
    const frame = (t, dt) => {
      // cámara por planos
      if (t < 3.4) cam(S.wide, S.close, t / 3.4);
      else if (t < 6.6) cam(S.right, S.right, 0);
      else if (t < 9.8) cam(S.right, S.pay, (t - 6.6) / 1.2);
      else if (t < 13.6) cam(S.grab, S.out, (t - 9.8) / 3.8);
      else cam(S.out, S.out, 1);
      // la familia
      stroller.lift = phase === 'family' ? Math.abs(Math.sin(t * 5)) * 0.05 : 0;
      if (!grabbed) stroller.update(dt, 0);
      partner.update(dt, 0);
      // BIG CHAKY y la banda entran caminando
      if (t > 3.4) walk(chaky, X + 6.6, 4.2, dt);
      crew.forEach((c, i) => {
        if (c.a === cepi && phase === 'grab') return;
        if (t > 3.6 + i * 0.2) walk(c.a, X + 7.6 + c.dx, 4.2, dt);
        if (phase === 'pay' && Math.abs(c.a.position.x - (X + 7.6 + c.dx)) < 0.1) { c.a.lift = Math.abs(Math.sin(t * 8 + i)) * 0.12; c.a.update(dt, 0); }
      });
      if (phase !== 'family') { H.setFacing(1); partner.setFacing(1); }
      // Cepi corre, agarra el cochecito y se escapa por la derecha
      if (phase === 'grab') {
        if (!grabbed) {
          if (walk(cepi, stroller.position.x + 0.9, 9, dt, 'walk')) { grabbed = true; stroller.setPose('cry'); ctx.audio?.sfx('roar'); say(cepi, '¡Jua! ¡Me la llevo!', '#ff9b8a'); }
        } else {
          walk(cepi, X + 30, 10, dt, 'walk');
          stroller.position.x = cepi.position.x + 1.0; stroller.setFacing(1);
          stroller.lift = Math.abs(Math.sin(t * 14)) * 0.08; stroller.update(dt, 0);
          if (t > 11.6) heroRun = true;
        }
      }
      if (heroRun) { H.setFacing(1); H.setPose(H.poses.run ? 'run' : 'walk'); H.position.x += 4 * dt; H.update(dt, 4); } else H.update(dt, 0);
    };
    const dispose = () => { ctx.world?.setIntroMode?.(false); game.pickups?.setTrailVisible?.(true); partner.dispose(); stroller.dispose(); chaky.dispose(); crew.forEach(c => c.a.dispose()); };
    return timeline(ev, 15.6, frame, dispose, 'intro');
  }

  // ===== DESPUÉS DEL BYD: BIG CHAKY se la lleva a Francia =====
  function afterByd(hero, heroId) {
    const X = 12, H = hero.actor;
    H.position.set(X - 3.4, 0, 0.6); H.setFacing(1); H.setPose('idle');
    const cepi = actor(sheetPoses(assets, 'cepi', 'courier_cepi'), 2.25, X, 0.2, -1, 'ko');
    const stroller = actor(strollerPoses, 1.7, X + 1.1, 0.9, 1, 'cry');
    const chaky = actor(chakyPoses(), 2.5, X + 16, -0.3, -1, 'walk');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    const S = { a: { p: [X - 1, 3.2, 9.5], l: [X, 1.5, 0] }, b: { p: [X + 3, 3.3, 9.5], l: [X + 4, 1.5, 0] }, c: { p: [X + 9, 4.4, 14], l: [X + 11, 1.4, 0] } };
    let phase = 'enter', pushing = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.sub('CEPI', '¡Mi BYD! ¡Lo tengo en cuotas!'); } },
      { at: 1.6, run: () => { ui.sub(''); ctx.audio?.sfx('roar'); } },
      { at: 3.0, run: () => { ui.sub('BIG CHAKY', '¡Gracias, Niño! ¡A Margot me la llevo a Francia!'); ctx.audio?.sfx('laugh'); } },
      { at: 4.4, run: () => { ui.sub('MARGOT', cry); } },
      { at: 5.4, run: () => { phase = 'cepi'; cepi.setPose('idle'); ui.sub('CEPI', '¡Me rompiste el BYD! ¡Ahora es personal!'); fx.shake?.(0.2, 0.25); } },
      { at: 7.4, run: () => { ui.sub(''); ui.caption('BIG CHAKY SE LLEVA A MARGOT A FRANCIA', '¡Corré al aeropuerto antes de que despegue! ✈'); ctx.audio?.sfx('bell'); } }
    ];
    const frame = (t, dt) => {
      if (t < 3) cam(S.a, S.a, 0); else if (t < 5.4) cam(S.a, S.b, (t - 3) / 1.4); else cam(S.b, S.c, (t - 5.4) / 2);
      cepi.update(dt, 0);
      if (t > 1.6 && !pushing) {
        if (walk(chaky, stroller.position.x + 1.0, 8, dt, 'walk')) { pushing = true; chaky.setFacing(1); chaky.setPose('push'); stroller.root.visible = false; }
      }
      if (pushing && t > 4.2) {
        chaky.setFacing(1); chaky.setPose('push');
        chaky.position.x += 7 * dt; chaky.lift = Math.abs(Math.sin(t * 12)) * 0.06; chaky.update(dt, 0);
      } else if (pushing) chaky.update(dt, 0);
      stroller.update(dt, 0);
      if (phase === 'cepi' && t > 6.6) walk(cepi, X + 30, 8, dt, 'walk');
      H.update(dt, 0);
    };
    const dispose = () => { cepi.dispose(); stroller.dispose(); chaky.dispose(); };
    return timeline(ev, 9.6, frame, dispose, 'byd');
  }

  return {
    ui,
    get active() { return !!cur; },
    get kind() { return cur?.kind || null; },
    start(kind, hero, heroId) {
      this.stop();
      cur = kind === 'byd' ? afterByd(hero, heroId) : intro(hero, heroId);
    },
    // true cuando terminó
    update(dt) { return cur ? cur.update(dt) : true; },
    // Corta la escena (terminada o salteada) y devuelve cuál era
    stop() {
      if (!cur) return null;
      const k = cur.kind;
      try { cur.dispose(); } finally { cur = null; ui.hide(); }
      return k;
    }
  };
}
