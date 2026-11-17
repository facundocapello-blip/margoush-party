import { SpriteActor } from './sprites.js';
import { sheetPoses } from './cast.js';

// Rescate: escena de ~8 s. El héroe corre a la jaula, alza a Margot, entra la banda aplaudiendo y foto familiar.
export const RESCUE = { run: 1.3, bars: 1.0, pick: 1.7, crew: 2.4, photo: 6.3, done: 7.8 };
const CREW = [
  { id: 'pinky', fallback: 'courier_pinky', line: '¡Aguante Margot! (el estacionamiento va de onda)' },
  { id: 'lale', fallback: 'courier_lale', line: '¡Bravo! ¡Tomen manteca de regalo!' },
  { id: 'cepi', fallback: 'courier_cepi', line: '¡Bueno, ganaste… esta vez!' }
];

// Intro (BIG CHAKY se lleva el cochecito) y rescate final en el galpón.
export function createStory(ctx) {
  const { scene, assets, world, game, fx } = ctx;
  let intro = null;

  // Jaula con Margot al fondo del galpón
  const cageX = world.bounds.maxX - 6;
  const cage = new THREE.Group();
  const barMat = new THREE.MeshLambertMaterial({ color: 0xd4b06a });
  const bars = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), barMat);
    bar.position.set(Math.cos(a) * 1.4, 1.3, Math.sin(a) * 1.4);
    bars.add(bar);
  }
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.15, 20), barMat);
  roof.position.y = 2.65;
  bars.add(roof);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.25, 20), new THREE.MeshLambertMaterial({ color: 0x3a2747 }));
  base.position.y = 0.12;
  cage.add(base, bars);
  cage.position.set(cageX, 0, -1.6);
  scene.add(cage);
  const margot = new SpriteActor(scene, assets, { poses: { crying: { tex: 'margot_sheet', cell: 2 }, happy: { tex: 'margot_sheet', cell: 3 } }, heightM: 1.7, shadow: 0.5 });
  margot.position.set(cageX, 0.25, -1.6);
  margot.setFacing(-1);
  margot.update(0, 0);

  let rescue = null;
  function clearRescue() {
    if (!rescue) return;
    for (const c of rescue.crew) c.actor.dispose();
    rescue = null;
  }

  return {
    margot,
    get rescue() { return rescue; },
    clearRescue,
    startRescue(hero, heroName) {
      clearRescue();
      const p = hero.actor.position;
      rescue = { hero, heroName, from: { x: p.x, z: p.z }, crew: [], said: 0, picked: false, banner: false, photo: false };
      // la banda espera fuera de cámara, a la izquierda
      CREW.forEach((c, i) => {
        const a = new SpriteActor(scene, assets, { poses: sheetPoses(assets, c.id, c.fallback), heightM: 2.25 });
        a.position.set(cageX - 14 - i * 1.4, 0, 0.6 + i * 0.7);
        a.setFacing(1);
        a.update(0, 0);
        rescue.crew.push({ ...c, actor: a, slot: { x: cageX - 6.2 + i * 1.6, z: 0.4 + (i % 2) * 0.9 } });
      });
    },

    // Devuelve 'photo' en el cuadro de la foto y 'done' al terminar
    updateRescue(dt, t) {
      const r = rescue;
      if (!r) return t > RESCUE.done ? 'done' : null;
      const ha = r.hero.actor, target = { x: cageX - 1.7, z: -1.3 };
      // 1) el héroe corre a la jaula
      if (t < RESCUE.run) {
        const k = t / RESCUE.run;
        ha.position.x = r.from.x + (target.x - r.from.x) * k;
        ha.position.z = r.from.z + (target.z - r.from.z) * k;
        ha.setFacing(target.x >= r.from.x ? 1 : -1);
        ha.setPose(ha.poses.run ? 'run' : 'idle');
        ha.update(dt, Math.abs(target.x - r.from.x) / RESCUE.run);
      } else {
        ha.setFacing(1);
        ha.setPose(r.picked && ha.poses.carry ? 'carry' : 'idle');
        ha.lift = r.picked ? Math.abs(Math.sin(t * 6)) * 0.25 : 0;
        ha.update(dt, 0);
      }
      // 2) suben los barrotes
      if (t > RESCUE.bars) bars.position.y = Math.min(4, bars.position.y + dt * 2.5);
      // 3) la alza en brazos
      if (t > RESCUE.pick && !r.picked) {
        r.picked = true;
        game.banner('🎉 ¡MARGOT ESTÁ A SALVO!', '¡Un aplauso para ' + r.heroName + '!', 3.6);
        ctx.audio?.sfx('clear');
      }
      margot.setPose(t > RESCUE.bars + 0.3 ? 'happy' : 'crying');
      if (r.picked && ha.poses.carry) {
        margot.position.set(cageX, -20, -1.6); // ya está en brazos en el dibujo del rescate
      } else if (r.picked) {
        margot.position.set(ha.position.x + 0.55, 0.9 + ha.lift, ha.position.z + 0.15);
        margot.lift = 0;
      } else margot.lift = t > RESCUE.bars ? 0.25 + Math.abs(Math.sin(t * 6)) * 0.3 : 0;
      margot.update(dt, 0);
      // 4) llega la banda y aplaude
      if (t > RESCUE.crew) {
        r.crew.forEach((c, i) => {
          const a = c.actor, ct = t - RESCUE.crew - i * 0.25;
          if (ct < 0) return;
          const dx = c.slot.x - a.position.x, dz = c.slot.z - a.position.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.1) {
            const sp = Math.min(d, 7 * dt);
            a.position.x += dx / d * sp; a.position.z += dz / d * sp;
            a.setPose(a.poses.walk ? 'walk' : (Math.floor(ct * 6) % 2 ? 'step' : 'idle'));
            a.lift = a.poses.walk ? 0 : Math.abs(Math.sin(ct * 12)) * 0.1;
            a.update(dt, 7);
          } else {
            // aplauso: salta y alterna dos poses
            a.setPose(Math.floor(ct * 5) % 2 ? 'strike' : 'idle');
            a.lift = Math.abs(Math.sin(ct * 7)) * 0.35;
            a.update(dt, 0);
            if (r.said <= i && ct > 0.6) {
              r.said = i + 1;
              fx.popup(a.position.clone().setY(3 + i * 0.6), c.line, '#ffe08a', { size: 18, life: 2.4, rise: 0.15 });
              ctx.audio?.sfx(i === 0 ? 'crowd' : 'pickup');
            }
          }
        });
      }
      // 5) foto familiar
      if (t > RESCUE.photo - 0.5 && !r.banner) { r.banner = true; fx.popup(ha.position.clone().setY(3.8), '📸 ¡FOTO FAMILIAR!', '#ffffff', { size: 30, life: 1.4, rise: 0.2 }); }
      if (t > RESCUE.photo && !r.photo) {
        r.photo = true;
        fx.flash('#ffffff', 0.5);
        ctx.audio?.sfx('secret');
        return 'photo';
      }
      return t > RESCUE.done ? 'done' : null;
    },

    resetCage() {
      clearRescue();
      margot.position.set(cageX, 0.25, -1.6);
      bars.position.y = 0;
      margot.setPose('crying');
      margot.lift = 0;
      margot.update(0, 0);
    },

    startIntro() {
      const stroller = new SpriteActor(scene, assets, { poses: { sleep: { tex: 'margot_sheet', cell: 0 } }, heightM: 1.7 });
      stroller.position.set(9, 0, -0.5);
      stroller.update(0, 0);
      const chaky = new SpriteActor(scene, assets, { poses: {
        stand: { tex: 'kidnap_sheet', cell: 0 }, run: { tex: 'kidnap_sheet', cell: 1 }, push: { tex: 'kidnap_sheet', cell: 2 } }, heightM: 3.4 });
      chaky.position.set(19, 0, -0.5);
      chaky.setFacing(-1);
      chaky.update(0, 0);
      intro = { t: 0, stroller, chaky, phase: 0 };
    },

    // Devuelve true cuando la intro terminó
    updateIntro(dt) {
      if (!intro) return true;
      const i = intro;
      i.t += dt;
      const c = i.chaky;
      if (i.phase === 0 && i.t > 0.6) { i.phase = 1; c.setPose('run'); }
      if (i.phase === 1) {
        c.position.x -= 6 * dt;
        c.lift = Math.abs(Math.sin(i.t * 12)) * 0.12;
        if (c.position.x <= 10.6) {
          i.phase = 2;
          c.setPose('push'); c.setFacing(1); c.lift = 0;
          i.stroller.dispose(); i.stroller = null;
          game.banner('¡BIG CHAKY SE LLEVÓ A MARGOT!', '¡Rescatala antes de que llegue al galpón!', 2.6);
          ctx.audio?.sfx('roar');
        }
      }
      if (i.phase === 2) {
        c.position.x += 9 * dt;
        c.lift = Math.abs(Math.sin(i.t * 14)) * 0.1;
        if (c.position.x > 34) { this.endIntro(); return true; }
      }
      c.update(dt, 0);
      return false;
    },

    endIntro() {
      if (!intro) return;
      intro.chaky.dispose();
      intro.stroller?.dispose();
      intro = null;
    },

    get inIntro() { return !!intro; },

  };
}
