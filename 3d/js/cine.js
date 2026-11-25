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
  const strollerPoses = { sleep: { tex: 'margot_sheet', cell: 0 }, awake: { tex: 'margot_sheet', cell: 1 }, cry: { tex: 'margot_sheet', cell: 2 }, happy: { tex: 'margot_sheet', cell: 3 } };
  const chakyPoses = () => ({ ...sheetPoses(assets, 'chaky', 'chaky_run'), arms: { tex: 'kidnap_sheet', cell: 0 }, push: { tex: 'kidnap_sheet', cell: 2 }, scared: { tex: 'kidnap_sheet', cell: 3 } });
  const say = (a, text, color = '#fff', size = 19, y = 3.3) => fx.popup(a.position.clone().setY(y), text, color, { size, life: 1.1, rise: 0.15 });

  // Cámara: a de (pos, mira) → b, con suavizado. En celu parado se aleja en Z sin subir de más para no mostrar el corte del edificio.
  function cam(a, b, k) {
    const e = ease(k), far = game.portrait ? 1.55 : 1, farY = game.portrait ? 1.12 : 1;
    const L = (i, arr1, arr2) => arr1[i] + (arr2[i] - arr1[i]) * e;
    const lx = L(0, a.l, b.l), ly = L(1, a.l, b.l), lz = L(2, a.l, b.l);
    const px = L(0, a.p, b.p), py = L(1, a.p, b.p), pz = L(2, a.p, b.p);
    camera.position.set(lx + (px - lx) * far, ly + (py - ly) * farY, lz + (pz - lz) * far);
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
    const stroller = actor(strollerPoses, 1.7, X - 0.5, 1.1, 1, 'awake');
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
      { at: 7.2, run: () => { chaky.setPose('strike'); say(crew[0].a, '💵 ¡Cheque al día!', '#ffe08a', 19, 3.0); ctx.audio?.sfx('coin'); } },
      { at: 8.0, run: () => { chaky.setPose('strike'); say(crew[1].a, '🧈 ¡Manteca de por vida!', '#ffe08a', 19, 3.6); ctx.audio?.sfx('coin'); } },
      { at: 8.8, run: () => { chaky.setPose('strike'); say(cepi, '🔌 ¡Un cargador para mi BYD!', '#ffe08a', 19, 3.0); ctx.audio?.sfx('coin'); } },
      { at: 9.8, run: () => { phase = 'grab'; ui.sub('BIG CHAKY', '¡Cepi, teneme el BYD listo en el hangar!'); chaky.setPose('arms'); } },
      { at: 11.5, run: () => { ui.sub('MARGOT', cry); } },
      { at: 13.6, run: () => { ui.sub(''); ui.caption('¡BIG CHAKY SE LLEVÓ A MARGOT!', '¡Cruzá Buenos Aires rumbo al aeropuerto!'); ctx.audio?.sfx('engine'); } }
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
      if (t > 3.4 && phase !== 'grab') walk(chaky, X + 6.6, 4.2, dt);
      crew.forEach((c, i) => {
        if (phase === 'grab') {
          walk(c.a, X + 30, 8.5 + i * 0.4, dt, 'walk');
          return;
        }
        if (t > 3.6 + i * 0.2) walk(c.a, X + 7.6 + c.dx, 4.2, dt);
        if (phase === 'pay' && Math.abs(c.a.position.x - (X + 7.6 + c.dx)) < 0.1) { c.a.lift = Math.abs(Math.sin(t * 8 + i)) * 0.12; c.a.update(dt, 0); }
      });
      if (phase !== 'family') { H.setFacing(1); partner.setFacing(1); }
      // BIG CHAKY mismo agarra el cochecito de Margot (pose push) y escapa rumbo a Ezeiza
      if (phase === 'grab') {
        if (!grabbed) {
          if (walk(chaky, stroller.position.x + 1.0, 9.5, dt, 'walk')) {
            grabbed = true;
            stroller.root.visible = false;
            chaky.setFacing(1); chaky.setPose('push');
            ctx.audio?.sfx('roar');
            say(chaky, '¡Jua! ¡A Ezeiza!', '#ff9b8a');
          }
        } else {
          chaky.setFacing(1); chaky.setPose('push');
          chaky.position.x += 9.5 * dt;
          chaky.lift = Math.abs(Math.sin(t * 14)) * 0.08;
          chaky.update(dt, 9.5);
          if (t > 11.6) heroRun = true;
        }
      }
      if (heroRun) { H.setFacing(1); H.setPose(H.poses.run ? 'run' : 'walk'); H.position.x += 4 * dt; H.update(dt, 4); } else H.update(dt, 0);
    };
    const dispose = () => { ctx.world?.setIntroMode?.(false); game.pickups?.setTrailVisible?.(true); partner.dispose(); stroller.dispose(); chaky.dispose(); crew.forEach(c => c.a.dispose()); };
    return timeline(ev, 15.6, frame, dispose, 'intro');
  }

  // ===== MINI-ESCENA 1: Fin Calle BA → Hangar VIP (Big Chaky) =====
  function preChaky(hero, heroId) {
    const X = LE_CONCEPT_X + 4, H = hero.actor;
    H.position.set(X - 4.2, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const stroller = actor(strollerPoses, 1.7, X + 4.4, 0.9, -1, 'cry');
    const chaky = actor(chakyPoses(), 2.5, X + 9.5, -0.3, -1, 'walk');
    const cepi = actor(sheetPoses(assets, 'cepi', 'courier_cepi'), 2.15, X + 7.2, -1.6, -1, 'idle');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    // Contrapicado cerrado sobre Chaky con Cepi asomado al fondo como Plan B
    const S = {
      a: { p: [X - 2.4, 2.2, 8.8], l: [X + 1.8, 1.9, 0] },
      b: { p: [X + 2.2, 1.9, 6.8], l: [X + 3.6, 1.8, 0.1] },
      c: { p: [X + 0.4, 2.9, 9.4], l: [X + 1.2, 1.7, 0] }
    };
    const ev = [
      { at: 0, run: () => { ui.show(); ui.caption('HANGAR VIP · EZEIZA', '¡Alcanzaste a BIG CHAKY antes del despegue!'); ctx.audio?.sfx('bell'); } },
      { at: 1.4, run: () => { ui.caption(''); ui.sub('MARGOT', cry); say(cepi, '🚗 ¡Chaky, el BYD ya está listo!', '#9fe4ff', 17, 3.0); ctx.audio?.sfx('pickup'); } },
      { at: 2.6, run: () => { chaky.setPose('arms'); ui.sub('BIG CHAKY', '¡Es mi fiesta de despegue, en mi jet! ¡Ganame en mi pista disco!'); fx.shake?.(0.22, 0.25); ctx.audio?.sfx('laugh'); } },
      { at: 4.8, run: () => { ui.sub(''); ui.caption('¡DUELO DE BAILE DISCO!', '¡Seguí las flechas al ritmo!'); ctx.audio?.sfx('roar'); } }
    ];
    const frame = (t, dt) => {
      if (t < 2.2) cam(S.a, S.b, t / 2.2);
      else cam(S.b, S.c, Math.min(1, (t - 2.2) / 2.4));
      walk(chaky, X + 2.8, 6.4, dt);
      cepi.update(dt, 0);
      stroller.lift = Math.abs(Math.sin(t * 9)) * 0.08;
      stroller.update(dt, 0);
      if (t > 4.6) { H.setPose(H.poses.run ? 'run' : 'walk'); H.position.x += 3.5 * dt; H.update(dt, 3.5); } else H.update(dt, 0);
    };
    const dispose = () => { stroller.dispose(); chaky.dispose(); cepi.dispose(); };
    return timeline(ev, 5.9, frame, dispose, 'pre_chaky');
  }

  // ===== PASE DE POSTA 1 (EN PANTALLA): Big Chaky KO → Cepi se lleva a Margot en el BYD =====
  function postChaky(hero, heroId) {
    const X = LE_CONCEPT_X + 2, H = hero.actor;
    H.position.set(X - 3.2, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const chaky = actor(chakyPoses(), 2.5, X + 1.2, -0.2, -1, 'scared');
    const stroller = actor(strollerPoses, 1.7, X + 3.2, 0.9, -1, 'cry');
    const cepi = actor(sheetPoses(assets, 'cepi', 'courier_cepi'), 2.25, X + 10.5, 0.3, -1, 'walk');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    const S = {
      a: { p: [X + 0.5, 2.7, 8.6], l: [X + 1.6, 1.5, 0] },
      b: { p: [X + 5.8, 3.4, 11.4], l: [X + 6.5, 1.5, 0] }
    };
    let grabbed = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.sub('BIG CHAKY', '¡CEPI! ¡PLAN B! ¡LLEVATELA EN EL BYD!'); fx.shake?.(0.2, 0.22); ctx.audio?.sfx('roar'); } },
      { at: 1.5, run: () => { ui.sub('CEPI', '¡A fondo por la 9 de Julio!'); ctx.audio?.sfx('horn'); } },
      { at: 2.6, run: () => { ui.sub('MARGOT', cry); ctx.audio?.sfx('engine'); } },
      { at: 3.4, run: () => { ui.sub(''); ui.caption('¡CEPI ESCAPA EN EL BYD!', '¡Subite a tu vehículo y alcanzalos!'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 3.4));
      chaky.update(dt, 0);
      if (!grabbed) {
        if (walk(cepi, stroller.position.x + 0.9, 10.5, dt, 'walk')) {
          grabbed = true;
          say(cepi, '🚗 ¡Al BYD!', '#9fe4ff', 20, 3.2);
        }
        stroller.update(dt, 0);
      } else {
        walk(cepi, X + 26, 11.5, dt, 'walk');
        stroller.position.x = cepi.position.x + 1.05; stroller.setFacing(1);
        stroller.lift = Math.abs(Math.sin(t * 14)) * 0.08; stroller.update(dt, 0);
      }
      if (t > 2.4) { H.setPose(H.poses.run ? 'run' : 'walk'); H.position.x += 5 * dt; H.update(dt, 5); } else H.update(dt, 0);
    };
    const dispose = () => { chaky.dispose(); stroller.dispose(); cepi.dispose(); };
    return timeline(ev, 4.6, frame, dispose, 'post_chaky');
  }

  // ===== MINI-ESCENA 2: BYD roto → Cancha de Pádel (Cepi se lleva a Margot) =====
  function preCepi(hero, heroId) {
    const X = 86, H = hero.actor;
    H.position.set(X - 3.6, 0, 0.6); H.setFacing(1); H.setPose('idle');
    const cepi = actor(sheetPoses(assets, 'cepi', 'courier_cepi'), 2.25, X + 1.8, 0.1, -1, 'ko');
    // Margot está del lado DERECHO de Cepi (custodiada por él, NO libre junto al héroe)
    const stroller = actor(strollerPoses, 1.65, X + 3.2, 0.9, -1, 'cry');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    // Plano lateral rasante que sigue a Cepi llevándose a Margot al club
    const S = {
      a: { p: [X + 1.4, 2.3, 7.2], l: [X + 2.2, 1.6, 0] },
      b: { p: [X + 5.2, 2.9, 9.6], l: [X + 5.8, 1.5, 0] }
    };
    let furious = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.caption('¡EL BYD QUEDÓ FUMANDO!', 'Cepi todavía lo paga en 48 cuotas'); ctx.audio?.sfx('crate'); } },
      { at: 1.4, run: () => { ui.caption(''); furious = true; cepi.setPose('strike'); ui.sub('CEPI', '¡MI ELÉCTRICO EN 48 CUOTAS! ¡Si querés a Margot, ganame un Punto de Oro!'); fx.shake?.(0.25, 0.25); ctx.audio?.sfx('roar'); } },
      { at: 3.4, run: () => { ui.sub('MARGOT', cry); say(cepi, '🎾 ¡A mi cancha!', '#9fe4ff', 20, 3.2); ctx.audio?.sfx('bell'); } },
      { at: 4.5, run: () => { ui.sub(''); ui.caption('CLUB DE PÁDEL', '¡Devolvé el Punto de Oro para vencer a Cepi!'); ctx.audio?.sfx('whoosh'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 4.2));
      if (furious && t > 3.2) {
        walk(cepi, X + 18, 8.2, dt);
        stroller.position.x = cepi.position.x + 1.1; stroller.setFacing(1);
        stroller.lift = Math.abs(Math.sin(t * 13)) * 0.08;
      } else {
        cepi.lift = furious ? Math.abs(Math.sin(t * 14)) * 0.12 : 0;
        cepi.update(dt, 0);
        stroller.lift = Math.abs(Math.sin(t * 8)) * 0.07;
      }
      stroller.update(dt, 0);
      H.update(dt, 0);
    };
    const dispose = () => { cepi.dispose(); stroller.dispose(); };
    return timeline(ev, 5.6, frame, dispose, 'pre_cepi');
  }

  // ===== PASE DE POSTA 2 (EN PANTALLA): Cepi KO → Lale se lleva a Margot a París =====
  function postCepi(hero, heroId) {
    const X = 90, H = hero.actor;
    H.position.set(X - 3.2, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const cepi = actor(sheetPoses(assets, 'cepi', 'courier_cepi'), 2.25, X + 1.0, 0.1, -1, 'ko');
    const stroller = actor(strollerPoses, 1.65, X + 2.8, 0.9, -1, 'cry');
    const lale = actor(sheetPoses(assets, 'lale', 'courier_lale'), 2.3, X + 5.4, -1.0, -1, 'walk');
    const S = {
      a: { p: [X + 0.2, 2.8, 8.8], l: [X + 1.8, 1.5, 0] },
      b: { p: [X + 5.6, 3.5, 11.2], l: [X + 6.4, 1.5, 0] }
    };
    let grabbed = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.sub('LALE', '¡Lo vi todo desde las gradas! Chaky me presta su jet: ¡me llevo a Margot a la casa central de Le Blé, en París!'); ctx.audio?.sfx('laugh'); } },
      { at: 2.1, run: () => { ui.sub('CEPI', '¡Fue Lale… se escapó en el jet de Chaky a Le Blé, en París!'); ctx.audio?.sfx('bell'); } },
      { at: 3.4, run: () => { ui.sub(''); ui.caption('✈ RUMBO A PARÍS', '¡Seguí a Lale hasta la casa central de Le Blé!'); ctx.audio?.sfx('secret'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 3.4));
      cepi.update(dt, 0);
      if (!grabbed) {
        if (walk(lale, stroller.position.x + 0.9, 10.0, dt, 'walk')) {
          grabbed = true;
          say(lale, '✈ ¡Al jet de Chaky!', '#ffe08a', 20, 3.2);
        }
        stroller.update(dt, 0);
      } else {
        walk(lale, X + 26, 10.8, dt, 'walk');
        stroller.position.x = lale.position.x + 1.05; stroller.setFacing(1);
        stroller.lift = Math.abs(Math.sin(t * 14)) * 0.08; stroller.update(dt, 0);
      }
      H.update(dt, 0);
    };
    const dispose = () => { cepi.dispose(); stroller.dispose(); lale.dispose(); };
    return timeline(ev, 4.6, frame, dispose, 'post_cepi');
  }

  // ===== MINI-ESCENA 3: Fin Calle París → Obrador de Le Blé (Lale) =====
  function preLale(hero, heroId) {
    const X = 200, H = hero.actor;
    H.position.set(X - 3.8, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const lale = actor(sheetPoses(assets, 'lale', 'courier_lale'), 2.3, X + 9.5, -0.2, -1, 'walk');
    const stroller = actor(strollerPoses, 1.65, X + 4.8, 0.9, -1, 'cry');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    // Diagonal cálida desde la derecha hacia la puerta de Le Blé
    const S = {
      a: { p: [X + 4.6, 3.9, 10.6], l: [X + 1.6, 1.5, 0] },
      b: { p: [X + 1.8, 2.5, 7.6], l: [X + 2.8, 1.6, 0] }
    };
    const ev = [
      { at: 0, run: () => { ui.show(); ui.caption('LE BLÉ · CASA CENTRAL · PARÍS', '¡La casa de la Le Blé porteña! ¡Qué olor a manteca!'); ctx.audio?.sfx('bell'); } },
      { at: 1.4, run: () => { ui.caption(''); ui.sub('LALE', 'Bienvenido a la casa central de Le Blé. ¡Tengo manteca para todos!'); say(lale, '🧈 ¡Suavecito!', '#ffe08a', 20, 3.2); ctx.audio?.sfx('laugh'); } },
      { at: 3.0, run: () => { ui.sub('MARGOT', cry); ctx.audio?.sfx('pickup'); } },
      { at: 4.1, run: () => { ui.sub(''); ui.caption('¡A ENHARINAR A LALE!', 'Pegale a las bolsas de harina para frenarlo'); ctx.audio?.sfx('roar'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 3.0));
      walk(lale, X + 2.4, 6.5, dt);
      stroller.lift = Math.abs(Math.sin(t * 9)) * 0.08;
      stroller.update(dt, 0);
      H.update(dt, 0);
    };
    const dispose = () => { lale.dispose(); stroller.dispose(); };
    return timeline(ev, 5.4, frame, dispose, 'pre_lale');
  }

  // ===== PASE DE POSTA 3 (EN PANTALLA): Lale KO → Pinky traiciona por el cheque rebotado =====
  function postLale(hero, heroId) {
    const X = 212, H = hero.actor;
    H.position.set(X - 3.2, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const lale = actor(sheetPoses(assets, 'lale', 'courier_lale'), 2.3, X + 1.0, 0.1, -1, 'ko');
    const stroller = actor(strollerPoses, 1.65, X + 2.8, 0.9, -1, 'cry');
    const pinky = actor(sheetPoses(assets, 'pinky', 'courier_pinky'), 2.3, X + 10.5, 0.2, -1, 'walk');
    const S = {
      a: { p: [X + 0.4, 2.6, 8.4], l: [X + 1.8, 1.5, 0] },
      b: { p: [X + 5.8, 3.3, 11.0], l: [X + 6.5, 1.5, 0] }
    };
    let grabbed = false;
    const ev = [
      { at: 0, run: () => { ui.show(); ui.sub('PINKY', 'Viajé en su jet cuidándole el estacionamiento a Chaky… ¡y el cheque rebotó!'); fx.shake?.(0.22, 0.25); ctx.audio?.sfx('roar'); } },
      { at: 2.1, run: () => { ui.sub('PINKY', '¡Me llevo a Margot al Galpón hasta que paguen!'); ctx.audio?.sfx('horn'); } },
      { at: 3.4, run: () => { ui.sub(''); ui.caption('¡PINKY TRAICIONÓ A LA BANDA!', '¡Alcanzalo pasando la Ferme LaPadite!'); ctx.audio?.sfx('bell'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 3.4));
      lale.update(dt, 0);
      if (!grabbed) {
        if (walk(pinky, stroller.position.x + 0.9, 10.5, dt, 'walk')) {
          grabbed = true;
          say(pinky, '💸 ¡Al Galpón!', '#ffe08a', 20, 3.2);
        }
        stroller.update(dt, 0);
      } else {
        walk(pinky, X + 26, 11.2, dt, 'walk');
        stroller.position.x = pinky.position.x + 1.05; stroller.setFacing(1);
        stroller.lift = Math.abs(Math.sin(t * 14)) * 0.08; stroller.update(dt, 0);
      }
      H.update(dt, 0);
    };
    const dispose = () => { lale.dispose(); stroller.dispose(); pinky.dispose(); };
    return timeline(ev, 4.6, frame, dispose, 'post_lale');
  }

  // ===== MINI-ESCENA 4: Fin Ferme LaPadite → Galpón (Pinky Final) =====
  function prePinky(hero, heroId) {
    const X = 264, H = hero.actor;
    H.position.set(X - 4.0, 0, 0.5); H.setFacing(1); H.setPose('idle');
    const pinky = actor(sheetPoses(assets, 'pinky', 'courier_pinky'), 2.3, X + 9.5, -0.2, -1, 'walk');
    const stroller = actor(strollerPoses, 1.65, X + 4.8, 0.9, -1, 'cry');
    const cry = heroId === 'marine' ? 'Mamaaan !' : '¡Papááá!';
    // Contrapicado dramático mirando hacia arriba al portón del Galpón
    const S = {
      a: { p: [X - 2.2, 1.7, 9.0], l: [X + 2.0, 2.0, 0] },
      b: { p: [X + 1.8, 1.9, 7.0], l: [X + 2.6, 1.8, 0] }
    };
    const ev = [
      { at: 0, run: () => { ui.show(); ui.caption('EL GALPÓN · ÚLTIMA PARADA', '¡Margot está ahí adentro!'); ctx.audio?.sfx('bell'); } },
      { at: 1.4, run: () => { ui.caption(''); ui.sub('PINKY', '¡Acá mando yo! ¡Son dos mil por adelantado!'); fx.shake?.(0.24, 0.25); ctx.audio?.sfx('roar'); } },
      { at: 3.1, run: () => { ui.sub('MARGOT', cry); say(pinky, '🚗 ¡Son 2 lucas!', '#ffe08a', 20, 3.2); ctx.audio?.sfx('horn'); } },
      { at: 4.4, run: () => { ui.sub(''); ui.caption('¡DUELO FINAL EN EL GALPÓN!', '¡Esquivá los autos y rescatá a Margot!'); ctx.audio?.sfx('clear'); } }
    ];
    const frame = (t, dt) => {
      cam(S.a, S.b, Math.min(1, t / 3.0));
      walk(pinky, X + 2.2, 6.8, dt);
      stroller.lift = Math.abs(Math.sin(t * 10)) * 0.1;
      stroller.update(dt, 0);
      H.update(dt, 0);
    };
    const dispose = () => { pinky.dispose(); stroller.dispose(); };
    return timeline(ev, 5.6, frame, dispose, 'pre_pinky');
  }

  return {
    ui,
    get active() { return !!cur; },
    get kind() { return cur?.kind || null; },
    start(kind, hero, heroId) {
      this.stop();
      if (kind === 'pre_chaky') cur = preChaky(hero, heroId);
      else if (kind === 'post_chaky') cur = postChaky(hero, heroId);
      else if (kind === 'pre_cepi') cur = preCepi(hero, heroId);
      else if (kind === 'post_cepi') cur = postCepi(hero, heroId);
      else if (kind === 'pre_lale') cur = preLale(hero, heroId);
      else if (kind === 'post_lale') cur = postLale(hero, heroId);
      else if (kind === 'pre_pinky') cur = prePinky(hero, heroId);
      else cur = intro(hero, heroId);
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
