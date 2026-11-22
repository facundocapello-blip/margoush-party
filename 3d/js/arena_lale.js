// «La arena de Lale»: obrador de la boulangerie Le Blé (Acto 3 — Grupo C).
// Usa automáticamente `arena_lale_{idle,throw,skate,floured,hurt,ko,fondo}` si existen en manifest.json;
// mientras llegan las imágenes del Grupo C hace respaldo prolijo con `lale_actions_sheet` y `le_ble`.
import { LALE_ARENA, createLaleArenaLogic } from './arena_lale_logic.js';
import { createVoice } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';

const MOVE = 6.3;
const DASH_SPEED = 11.5;
const COMBO_WINDOW = 0.45;
const HURT_POSE = 0.5;
const INV = 1.3;
const END_DELAY = 1.4;
const ENTRANCE = 1.3;
const HERO_H = 2.4, BOSS_H = 5.4;
const CAM = { y: 5.5, back: 10.2, lookY: 2.7, fov: 64, fovPortrait: 70 };

// Cuadro de respaldo en lale_actions_sheet (4 columnas: idle/ataque/golpe/ko)
const FALLBACK_FRAME = { idle: 0, throw: 1, skate: 1, floured: 2, hurt: 2, ko: 3 };

export function createLaleArena({ game, input, audio, assets, renderer, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createLaleArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 250);
    scene.background = L('#3a2518');
    scene.fog = new T.Fog(L('#3a2518'), 26, 75);
    scene.add(new T.HemisphereLight(0xffe7c2, 0x5c361d, 0.95));
    const oven = new T.PointLight(0xff9c3b, 1.3, 35, 1.4); oven.position.set(0, 5, -13); scene.add(oven);
    const mk = (geo, mat) => { const m = new T.Mesh(keep(geo), keep(mat)); scene.add(m); return m; };
    const canvasTex = (w, h, draw, rx = 1, ry = 1) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = keep(new T.CanvasTexture(c)); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
    };
    const radial = (stops) => canvasTex(64, 64, (g) => {
      const r = g.createRadialGradient(32, 32, 1, 32, 32, 32);
      for (const [k, c] of stops) r.addColorStop(k, c);
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    });

    // Piso de baldosas crema/terracota del obrador de Le Blé
    const tileTex = canvasTex(256, 256, (g, w, h) => {
      const n = 4, s = w / n;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        g.fillStyle = (r + c) % 2 ? '#e9d8bc' : '#d5be9c';
        g.fillRect(c * s, r * s, s, s);
        g.strokeStyle = 'rgba(110,75,45,.25)'; g.lineWidth = 3;
        g.strokeRect(c * s + 1, r * s + 1, s - 2, s - 2);
      }
    }, 3, 7);
    const outer = mk(new T.PlaneGeometry(60, 44), new T.MeshLambertMaterial({ color: L('#2a1a10') }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const floor = mk(new T.PlaneGeometry(LALE_ARENA.xMax * 2 + 1, 24), new T.MeshLambertMaterial({ map: tileTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -7);

    // Mesada/horno cálido al fondo + fondo pintado del obrador (o le_ble de respaldo)
    const bgKey = assets.has('arena_lale_fondo') ? 'arena_lale_fondo' : 'le_ble';
    const bgMeta = assets.meta(bgKey);
    const BH = 34, BW = Math.max(46, BH * bgMeta.w / bgMeta.h);
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: assets.texture(bgKey), fog: false }));
    back.position.set(0, BH * 0.33, LALE_ARENA.bossZ - 9);

    // Respaldo por cuadros de lale_actions_sheet + tira de caminata/patinada de 6 cuadros (lale_walk_sheet)
    const fallbackTex = {}, walkTex = {};
    if (assets.has('lale_actions_sheet')) {
      const m = assets.meta('lale_actions_sheet');
      const cols = m.cols || 4;
      for (let i = 0; i < cols; i++) {
        const tx = keep(assets.texture('lale_actions_sheet').clone());
        tx.needsUpdate = true; tx.repeat.set(1 / cols, 1); tx.offset.set(i / cols, 0);
        fallbackTex[i] = { map: tx, w: m.w / cols, h: m.h, hk: 1 };
      }
    }
    const walkCols = assets.has('lale_walk_sheet') ? (assets.meta('lale_walk_sheet').cols || 6) : 0;
    if (walkCols) {
      const wm = assets.meta('lale_walk_sheet');
      for (let i = 0; i < walkCols; i++) {
        const tx = keep(assets.texture('lale_walk_sheet').clone());
        tx.needsUpdate = true; tx.repeat.set(1 / walkCols, 1); tx.offset.set(i / walkCols, 0);
        walkTex['arena_lale_walk' + i] = { map: tx, w: wm.w / walkCols, h: wm.h, hk: 1 };
      }
    }

    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(40,20,5,.6)'], [1, 'rgba(40,20,5,0)']]), transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);
    const setTex = (m, key, fbPose = null) => {
      if (m.userData.key === key) return;
      if (walkTex[key]) {
        const wt = walkTex[key];
        m.material.map = wt.map; m.material.needsUpdate = true; m.userData.key = key;
        const h = m.userData.h * wt.hk;
        m.userData.w = h * wt.w / wt.h; m.userData.hh = h; m.scale.set(m.userData.w, h, 1);
        return;
      }
      if (assets.has(key)) {
        const meta = assets.meta(key);
        m.material.map = assets.texture(key); m.material.needsUpdate = true; m.userData.key = key;
        const h = m.userData.h * (meta.hk || 1);
        m.userData.w = h * meta.w / meta.h; m.userData.hh = h; m.scale.set(m.userData.w, h, 1);
        return;
      }
      const fb = fallbackTex[FALLBACK_FRAME[fbPose] ?? 0];
      if (!fb) return;
      m.material.map = fb.map; m.material.needsUpdate = true; m.userData.key = key;
      const h = m.userData.h * (fbPose === 'ko' ? 0.72 : 1);
      m.userData.w = h * fb.w / fb.h; m.userData.hh = h; m.scale.set(m.userData.w, h, 1);
    };
    function sprite(key, h, shadow = 1, fbPose = null) {
      const m = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ alphaTest: 0.45, side: T.DoubleSide })));
      m.userData.h = h; setTex(m, key, fbPose); scene.add(m);
      if (shadow) { const s = new T.Mesh(shG, shM); s.scale.set(h * 0.75 * shadow, 1, h * 0.35 * shadow); s.renderOrder = 1; scene.add(s); m.userData.sh = s; }
      return m;
    }
    function place(m, px, py, pz) {
      m.position.set(px, py, pz);
      m.rotation.y = Math.atan2(cam.position.x - px, cam.position.z - pz) * 0.55;
      const s = m.userData.sh; if (s) { s.position.set(px, 0.03, pz); s.visible = m.visible; }
    }

    const B = sprite('arena_lale_idle', BOSS_H, 0.9, 'idle');
    const P = sprite(heroPre + 'idle', HERO_H, 0.9);

    // Barras de manteca, charcos dorados y bolsas de harina 3D
    const butterG = keep(new T.BoxGeometry(0.9, 0.42, 0.5));
    const butterM = keep(new T.MeshStandardMaterial({ color: L('#ffe169'), emissive: L('#664c00'), roughness: 0.25 }));
    const puddleG = keep(new T.CircleGeometry(LALE_ARENA.puddleR, 20)); puddleG.rotateX(-Math.PI / 2);
    const puddleM = keep(new T.MeshBasicMaterial({ color: L('#ffd447'), transparent: true, opacity: 0.72, depthWrite: false }));
    const bagG = keep(new T.CylinderGeometry(0.55, 0.68, 1.35, 12));
    const bagM = keep(new T.MeshStandardMaterial({ color: L('#fff7ea'), emissive: L('#554422'), roughness: 0.7 }));
    const ringG = keep(new T.RingGeometry(0.75, 1.05, 24)); ringG.rotateX(-Math.PI / 2);
    const ringM = keep(new T.MeshBasicMaterial({ color: L('#ffffff'), transparent: true, opacity: 0.75, side: T.DoubleSide, depthWrite: false }));
    const liveShots = new Map(), livePuddles = new Map(), liveBags = new Map();

    // Capa de UI
    document.querySelector('#arena-ui')?.remove();
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML = '<div class="arena-flash"></div><div class="phase-card"><i></i><b></b><span></span></div>';
    document.body.append(ui);
    document.body.classList.add('arena-on');
    const flashE = ui.querySelector('.arena-flash');
    const cardE = ui.querySelector('.phase-card');

    const CARDS = {
      1: ['FASE 1 · 🧈', '¡MANTECA PARA TODOS!', 'Pegale a la bolsa de harina para enharinarlo'],
      2: ['FASE 2 · ⛸️', '¡PATINANDO EN MANTECA!', 'Esquivá sus pasadas y tirale harina'],
      3: ['FASE 3 · 🔥', '¡SUBÍ EL HORNO!', '¡Manteca, patín y harina a toda máquina!']
    };
    let cardTimer = 0;
    function phaseCard(p, ms = 2.0) {
      const c = CARDS[p]; if (!c) return;
      fillText(cardE.querySelector('i'), c[0]);
      fillText(cardE.querySelector('b'), c[1]);
      fillText(cardE.querySelector('span'), c[2]);
      cardE.classList.remove('on'); void cardE.offsetWidth; cardE.classList.add('on');
      clearTimeout(cardTimer); cardTimer = setTimeout(() => cardE.classList.remove('on'), ms * 1000);
    }

    const bar = document.querySelector('#boss-bar'), fill = document.querySelector('#boss-fill');
    const barName = bar?.querySelector('span');
    const setBarName = () => { if (barName) barName.textContent = tr('LALE «MANTECOSO»') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3'; };
    if (bar) { setBarName(); bar.classList.remove('hidden'); }
    const setBar = () => { if (fill) fill.style.width = (100 * logic.state.hp / logic.state.hpMax).toFixed(1) + '%'; };
    setBar();

    const pops = [], scratch = new T.Vector3();
    const pop = (px, py, pz, txt, col = '#ffd36e', size = 22, life = 1.1) => {
      const e = document.createElement('div'); e.className = 'pop'; fillText(e, txt); e.style.color = col; e.style.fontSize = size + 'px';
      if (txt.length > 18) { e.style.whiteSpace = 'normal'; e.style.width = 'min(86vw, 340px)'; e.style.textAlign = 'center'; }
      const q = { e, v: new T.Vector3(px, py, pz), t: 0, life, w: e.offsetWidth };
      ui.append(e); pops.push(q); return q;
    };
    const sfx = (n) => { try { audio.sfx(n); } catch (_) {} };
    let flashTimer = 0;
    const flash = (col, op = 0.42) => {
      flashE.style.background = col; flashE.style.opacity = String(op);
      clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashE.style.opacity = '0'; }, 120);
    };

    let x = 0, z = -1.2, y = 0, vy = 0, vxCur = 0, vzCur = 0, t = 0;
    let phase = 'entrance', phaseT = 0, closing = false, disposed = false;
    let dashT = 0, dashCd = 0, dashX = 1, dashZ = 0, hurtT = 0, inv = 0, powT = 0, holdT = 0;
    let swing = null, swingT = 0, swingHit = false, comboStep = 0, comboWindow = 0, buffer = 0, stepT = 0;
    let shakeT = 0, shakeA = 0, freezeT = 0, bossFlash = 0, moving = false, heroPose = 'idle', bossKey = 'arena_lale_idle';
    let lastSpeech = null;
    const shake = (a, dur) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, dur); };
    const addPts = (n, px, py, pz) => { const g = game.score.add(n, game.combo.hit()); pop(px, py, pz, '+' + g, '#ffd36e', 24); };
    const charge = (n) => { hero.power = Math.min(1, hero.power + n); };
    const speak = (ev) => {
      const text = voice.say('lale', ev);
      if (!text) return;
      if (lastSpeech) { lastSpeech.e.remove(); const i = pops.indexOf(lastSpeech); if (i >= 0) pops.splice(i, 1); }
      lastSpeech = pop(logic.state.bossX, BOSS_H + 0.6, logic.state.bossZ, text, '#ffe9a8', 17, 2.3);
    };

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'throw': sfx('swing'); break;
          case 'skateStart': sfx('roar'); pop(0, 3.8, -4, '¡A PATINAR!', '#ffe066', 24, 1.0); break;
          case 'bagBurst':
            sfx('perfect'); flash('#ffffff', 0.35); shake(0.26, 0.2);
            pop(e.x, 2.5, e.z, '¡HARINA!', '#ffffff', 26, 1.1);
            break;
          case 'floured':
            addPts(LALE_ARENA.points.flour, e.x, 3.8, LALE_ARENA.bossZ); charge(0.25);
            pop(e.x, BOSS_H + 0.2, LALE_ARENA.bossZ, '¡ENHARINADO! ¡PEGALE!', '#ffffff', 20, 1.4);
            break;
          case 'meleeHit':
            addPts(LALE_ARENA.points.melee, e.x, 2.8, LALE_ARENA.bossZ); charge(POWER.hit);
            sfx('hit'); shake(0.24, 0.16);
            break;
          case 'slipAway':
            sfx('tick');
            pop(e.x, 3.0, logic.state.bossZ, '¡MUY MANTECOSO! ¡USÁ HARINA!', '#ffe066', 18, 1.2);
            break;
          case 'dodge':
            addPts(LALE_ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge); sfx('pickup');
            pop(x, 3.4, z, '¡JUSTO!', '#9bf7c4', 20);
            break;
          case 'bossHit': bossFlash = 0.22; setBar(); sfx('hit'); shake(0.26, 0.2); break;
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1); hurtT = HURT_POSE; inv = INV;
            game.combo.reset(); sfx('hurt'); flash('#ff3b52', 0.45); shake(0.35, 0.28);
            break;
          case 'phase': setBarName(); phaseCard(e.phase, 2.1); shake(0.32, 0.3); sfx('roar'); break;
          case 'voice': speak(e.event); break;
          case 'ko':
            phase = 'ko'; phaseT = 0; setBar(); setBarName();
            sfx('fanfare'); flash('#fff', 0.55); shake(0.48, 0.45);
            pop(logic.state.bossX, BOSS_H * 0.7, LALE_ARENA.bossZ, '¡K.O.!', '#ffe066', 34, 1.5);
            break;
        }
      }
    }

    function startSwing() {
      const i = comboWindow > 0 ? (comboStep + 1) % SWINGS.length : 0;
      comboStep = i; swing = SWINGS[i]; swingT = 0; swingHit = false; comboWindow = 0; buffer = 0;
      sfx('swing');
    }

    function usePower() {
      hero.power = 0; powT = 0.55; holdT = 0;
      sfx('power'); flash(isM ? '#78e08f' : '#ffd36e', 0.38); shake(0.4, 0.3);
      pop(x, 3.3, z, isM ? '¡HIEDRA!' : '¡VERDADES A LOS GRITOS!', isM ? '#9bf7c4' : '#ffe066', 24, 1.2);
      handle(logic.power());
    }

    function close(won) {
      if (closing) return;
      closing = true;
      dispose();
      (won ? onWin : onDown)();
    }

    function update(dt) {
      if (disposed || closing) return;
      if (input.consume('pause')) { pause(); return; }
      t += dt;
      if (freezeT > 0) { freezeT -= dt; draw(0); return; }
      phaseT += dt;
      if (hurtT > 0) hurtT = Math.max(0, hurtT - dt);
      if (inv > 0) inv = Math.max(0, inv - dt);
      if (powT > 0) powT = Math.max(0, powT - dt);
      if (dashCd > 0) dashCd = Math.max(0, dashCd - dt);
      if (comboWindow > 0) comboWindow = Math.max(0, comboWindow - dt);

      const alive = phase === 'fight' && hurtT <= 0;
      if (alive) {
        if (input.consume('jump') && y <= 0) { vy = CHASE.jump; sfx('jump'); }
        if (input.consume('dodge') && dashCd <= 0 && dashT <= 0) {
          const dx = Math.abs(input.moveX) > 0.15 ? input.moveX : (x > 0 ? -1 : 1);
          const dz = input.moveZ;
          const len = Math.hypot(dx, dz) || 1;
          dashX = dx / len; dashZ = dz / len; dashT = 0.24; dashCd = 0.55;
          sfx('dodge');
        }
        if (input.consume('attack')) { if (swing) buffer = 0.18; else startSwing(); }
        if (buffer > 0) buffer = Math.max(0, buffer - dt);
        if (input.attackHeld && hero.power >= 1) { holdT += dt; if (holdT >= 0.45) usePower(); } else holdT = 0;
        if (input.consume('power') && hero.power >= 1) usePower();

        let tx, tz;
        if (dashT > 0) { dashT -= dt; tx = dashX * DASH_SPEED; tz = dashZ * DASH_SPEED; }
        else {
          const mx = input.moveX, mz = input.moveZ, len = Math.max(1, Math.hypot(mx, mz));
          const slow = swing ? 0.35 : 1;
          tx = mx / len * MOVE * slow; tz = mz / len * MOVE * slow;
          moving = Math.hypot(mx, mz) > 0.15;
        }
        // Si pisa un charco de manteca patina suave (menos agarre, sin trabar el control)
        const grip = logic.state.slipping && dashT <= 0 ? Math.min(1, dt * 3.8) : 1;
        vxCur += (tx - vxCur) * grip;
        vzCur += (tz - vzCur) * grip;
        x = Math.max(-LALE_ARENA.xMax + 0.45, Math.min(LALE_ARENA.xMax - 0.45, x + vxCur * dt));
        z = Math.max(LALE_ARENA.zFar, Math.min(LALE_ARENA.zNear, z + vzCur * dt));

        if (swing) {
          swingT += dt;
          if (!swingHit && swingT >= swing.hitAt) {
            swingHit = true;
            handle(logic.punch({ x, z, reach: swing.reach, dmg: swing.dmg }));
          }
          if (swing && swingT >= swing.dur) { swing = null; comboWindow = COMBO_WINDOW; if (buffer > 0) startSwing(); }
        }
      } else { dashT = 0; swing = null; holdT = 0; vxCur = 0; vzCur = 0; }
      hero.holdT = holdT;
      vy -= CHASE.gravity * dt; y = Math.max(0, y + vy * dt); if (y <= 0) vy = Math.max(0, vy);

      if (phase === 'entrance' && phaseT >= ENTRANCE) {
        phase = 'fight'; phaseT = 0; sfx('roar'); shake(0.22, 0.25);
        phaseCard(1, 2.0);
        setTimeout(() => { if (!disposed) speak('intro'); }, 1900);
      }
      if (phase === 'fight') handle(logic.update(dt, { x, z, y, dodging: dashT > 0, inv: inv > 0 || powT > 0 }));
      if (phase === 'fight' && hero.hp <= 0) { phase = 'down'; phaseT = 0; }
      else if (phase === 'ko') logic.update(dt, { x, z, y, dodging: false, inv: true });

      if (phase === 'ko' && phaseT >= END_DELAY) return close(true);
      if (phase === 'down' && phaseT >= END_DELAY) return close(false);
      draw(dt);
      updateHud(dt);
    }

    function draw(dt) {
      const S = logic.state;
      shakeT = Math.max(0, shakeT - dt); if (shakeT <= 0) shakeA = 0;
      const sh = shakeA * Math.min(1, shakeT * 4);
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.55 : 0.3) + (Math.random() - 0.5) * sh, CAM.y + e * 5 + (Math.random() - 0.5) * sh, z + CAM.back + e * 7);
      cam.lookAt(0, CAM.lookY + e * 1.5, LALE_ARENA.bossZ);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();

      // Lale (camina y patina en 6 cuadros reales + pose nueva arena_lale_idle y animaciones de ataque/harina)
      const bvx = dt > 0 ? (S.bossX - (B.userData.prevX ?? S.bossX)) / dt : 0;
      B.userData.prevX = S.bossX;
      const useWalk = walkCols > 0 && ((S.pose === 'idle' && Math.abs(bvx) > 0.35) || (S.pose === 'skate' && !assets.has('arena_lale_skate')));
      let sx = 1, sy = 1, rz = 0, by = 0;
      if (useWalk) {
        const fps = S.pose === 'skate' ? 15 : 10;
        B.userData.stepT = (B.userData.stepT || 0) + dt * fps;
        bossKey = 'arena_lale_walk' + (Math.floor(B.userData.stepT) % walkCols);
        const dir = S.pose === 'skate' ? S.skateDir : (bvx < 0 ? -1 : 1);
        sx = dir < 0 ? -1 : 1;
        by = Math.abs(Math.sin(B.userData.stepT * Math.PI)) * (S.pose === 'skate' ? 0.2 : 0.14);
        rz = -dir * (S.pose === 'skate' ? 0.2 : 0.06);
        if (S.pose === 'skate') sy = 0.94 + Math.abs(Math.sin(t * 14)) * 0.08;
      } else {
        bossKey = 'arena_lale_' + S.pose;
        if (S.pose === 'skate' && S.skateDir < 0) sx = -1;
        else if (S.pose === 'throw') { sx = x < S.bossX ? -1 : 1; sy = 0.95; rz = sx * 0.08; by = 0.14; }
        else if (S.pose === 'floured') { rz = Math.sin(t * 20) * 0.09; sy = 0.95 + Math.abs(Math.sin(t * 14)) * 0.08; }
        else if (S.pose === 'hurt') { rz = 0.16; sy = 0.92; by = 0.18; }
        else if (S.pose === 'idle') { by = Math.abs(Math.sin(t * 2.5)) * 0.08; sy = 1 + Math.sin(t * 5) * 0.02; }
      }
      setTex(B, bossKey, S.pose);
      place(B, S.bossX, by, S.bossZ);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1); B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      if (S.pose === 'floured' && !assets.has('arena_lale_floured')) {
        B.material.color.setRGB(1.4, 1.4, 1.4); // brillo blanco enharinado en respaldo
      } else {
        B.material.color.setRGB(1, bossFlash > 0 ? 0.55 : 1, bossFlash > 0 ? 0.55 : 1);
      }

      // Héroe de espaldas
      const hasDodge = assets.has(heroPre + 'dodge');
      heroPose = hurtT > 0 || phase === 'down' ? 'hurt' : swing || powT > 0 ? 'punch' : dashT > 0 && hasDodge ? 'dodge' : moving || y > 0.15 || dashT > 0 ? 'run' : 'idle';
      let bob = 0, lean = 0, key = heroPre + heroPose, hsx = 1;
      if (heroPose === 'dodge') { bob = 0.18; hsx = dashX < 0 ? -1 : 1; }
      else if (heroPose === 'run') {
        if (y > 0.15) key = heroPre + 'jump';
        else {
          stepT += dt * 2 * Math.PI * 2.6;
          key = heroPre + 'run' + (Math.floor(stepT / (Math.PI / 2)) % 4);
          bob = Math.abs(Math.sin(stepT * 2)) * 0.05;
          lean = -input.moveX * 0.07;
        }
      } else if (heroPose === 'idle') { stepT = 0; bob = Math.sin(t * 2.4) * 0.015; }
      setTex(P, key);
      P.scale.x = P.userData.w * hsx;
      P.visible = !(inv > 0 && hurtT <= 0 && Math.floor(t * 14) % 2 === 0);
      place(P, x, y + bob, z);
      P.rotation.z = dashT > 0 && !hasDodge ? -dashX * 0.25 : lean;

      // Barras de manteca volando
      const shotIds = new Set();
      for (const s of S.shots) {
        shotIds.add(s.id);
        let obj = liveShots.get(s.id);
        if (!obj) {
          const m = new T.Mesh(butterG, butterM); scene.add(m);
          const sh = new T.Mesh(shG, shM); sh.scale.set(1.1, 1, 0.7); sh.renderOrder = 2; scene.add(sh);
          obj = { m, sh }; liveShots.set(s.id, obj);
        }
        const prog = Math.max(0, Math.min(1, (s.z - LALE_ARENA.bossZ) / Math.max(1, s.targetZ - LALE_ARENA.bossZ)));
        obj.m.position.set(s.x, 0.5 + Math.sin(prog * Math.PI) * 2.4, s.z);
        obj.m.rotation.x += dt * 9; obj.m.rotation.y += dt * 5;
        obj.sh.position.set(s.x, 0.04, s.z);
      }
      for (const [id, obj] of liveShots) {
        if (shotIds.has(id)) continue;
        scene.remove(obj.m); scene.remove(obj.sh); liveShots.delete(id);
      }

      // Charcos de manteca
      const pudIds = new Set();
      for (const p of S.puddles) {
        pudIds.add(p.id);
        let m = livePuddles.get(p.id);
        if (!m) { m = new T.Mesh(puddleG, puddleM); m.renderOrder = 1; scene.add(m); livePuddles.set(p.id, m); }
        m.position.set(p.x, 0.025, p.z);
        m.scale.setScalar(Math.min(1, p.life));
      }
      for (const [id, m] of livePuddles) {
        if (pudIds.has(id)) continue;
        scene.remove(m); livePuddles.delete(id);
      }

      // Bolsas de harina (anillo blanco pulsante para invitar a golpearlas)
      const bagIds = new Set();
      for (const b of S.bags) {
        if (!b.alive) continue;
        bagIds.add(b.id);
        let obj = liveBags.get(b.id);
        if (!obj) {
          const m = new T.Mesh(bagG, bagM); scene.add(m);
          const r = new T.Mesh(ringG, ringM); r.renderOrder = 2; scene.add(r);
          obj = { m, r }; liveBags.set(b.id, obj);
        }
        obj.m.position.set(b.x, 0.68 + Math.sin(t * 5 + b.id) * 0.08, b.z);
        obj.r.position.set(b.x, 0.04, b.z);
        obj.r.scale.setScalar(1 + Math.sin(t * 7) * 0.14);
      }
      for (const [id, obj] of liveBags) {
        if (bagIds.has(id)) continue;
        scene.remove(obj.m); scene.remove(obj.r); liveBags.delete(id);
      }

      // Textos flotantes
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i]; q.t += dt;
        if (q.t >= q.life) { q.e.remove(); pops.splice(i, 1); if (q === lastSpeech) lastSpeech = null; continue; }
        scratch.copy(q.v); scratch.y += q.t * 0.7; scratch.project(cam);
        const px = Math.max(80, Math.min(innerWidth - 80, (scratch.x * 0.5 + 0.5) * innerWidth));
        const py = Math.max(60, Math.min(innerHeight - 60, (-scratch.y * 0.5 + 0.5) * innerHeight));
        q.e.style.left = px + 'px'; q.e.style.top = py + 'px';
        q.e.style.opacity = String(Math.min(1, (q.life - q.t) * 3));
      }
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(cardTimer); clearTimeout(flashTimer);
      ui.remove();
      document.body.classList.remove('arena-on');
      if (bar) bar.classList.add('hidden');
      for (const o of own) o.dispose?.();
      cur = null;
    }

    cur = {
      logic, update,
      render: () => renderer.render(scene, cam),
      dispose,
      get state() { return logic.state; },
      get heroPose() { return heroPose; },
      get bossKey() { return bossKey; }
    };
    game.state = 'arena-lale';
  }

  return {
    start,
    update: (dt) => cur?.update(dt),
    render: () => cur?.render(),
    dispose: () => cur?.dispose(),
    get active() { return !!cur; },
    get logic() { return cur?.logic || null; },
    get state() { return cur?.state || null; }
  };
}
