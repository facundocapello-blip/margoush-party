import { SpriteActor } from './sprites.js';

// Intro (BIG CHAKY se lleva el cochecito) y rescate final en el galpón.
export function createStory(ctx) {
  const { scene, assets, world, game } = ctx;
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

  return {
    margot,
    resetCage() {
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
      game.banner('LE CONCEPT', 'Una noche tranquila…', 2);
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

    // Rescate: suben los barrotes y Margot festeja
    updateRescue(dt, t) {
      bars.position.y = Math.min(4, bars.position.y + dt * 2.5);
      margot.setPose('happy');
      margot.lift = 0.25 + Math.abs(Math.sin(t * 6)) * 0.35;
      margot.update(dt, 0);
    }
  };
}
