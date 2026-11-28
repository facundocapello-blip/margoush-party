// «La arena final de Pinky»: galpón convertido en estacionamiento (Acto 4 — Grupo D + Margot heroica).
// Usa automáticamente `arena_pinky_{wave,charge,reveal,hurt,ko,car,fondo}` y `arena_margot_hero` si
// existen en manifest.json; mientras llegan las imágenes del Grupo D/E hace respaldo limpio con
// `pinky_actions_sheet`, `galpon`, `margot_sheet` y autos 3D rojos entrando marcha atrás.
import { PINKY_ARENA, createPinkyArenaLogic } from './arena_pinky_logic.js';
import { createVoice } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';
import { attachBossIntro } from './boss_intro.js';
import { createMargotFinish } from './margot_finish.js';
import { placePops } from './pop_layout.js';
import { triggerSpriteBlend, stepSpriteBlend } from './poses.js';
import { createShake, flashAlpha, isReducedMotion } from './feedback.js';
import { createSkillFxPool } from './skill_fx_three.js';
import { FX, heroPowerFx, bossFrontFx, facingToward, createBurst, stepSparks } from './arena_fx.js';

const MOVE = 6.4;
const DASH_SPEED = 11.5;
const COMBO_WINDOW = 0.45;
const HURT_POSE = 0.5;
const INV = 1.3;
const END_DELAY = 1.5;
const ENTRANCE = 1.3;
const HERO_H = 2.4, BOSS_H = 5.4;
const CAM = { y: 5.6, back: 10.4, lookY: 2.8, fov: 64, fovPortrait: 70 };

const FALLBACK_FRAME = { reveal: 0, wave: 1, charge: 0, hurt: 2, ko: 3 };

export function createPinkyArena({ game, input, audio, assets, renderer, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createPinkyArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 250);
    const skillFx = keep(createSkillFxPool(T, scene, cam, { maxActive: 6, reduceMotion: isReducedMotion }));
    skillFx.preload([isM ? FX.IVY : FX.TRUTH, FX.HERO_CRY]);
    scene.background = L('#1a1d26');
    scene.fog = new T.Fog(L('#1a1d26'), 26, 76);
    scene.add(new T.HemisphereLight(0xdce8ff, 0x262933, 0.95));
    const fluor = new T.DirectionalLight(0xeef5ff, 0.85); fluor.position.set(0, 14, 4); scene.add(fluor);
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

    // Piso de hormigón orgánico de estacionamiento (sin patrón en grilla para evitar muaré) + ancho completo
    const concTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#383c46'; g.fillRect(0, 0, w, h);
      let seed = 1337;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.055)';
        g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 2 + rnd() * 5);
      }
      g.strokeStyle = 'rgba(20,22,28,.18)'; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        const x0 = rnd() * w, y0 = rnd() * h;
        g.moveTo(x0, y0); g.lineTo(x0 + (rnd() - 0.5) * 60, y0 + (rnd() - 0.5) * 60); g.stroke();
      }
    }, 15, 8);
    const outer = mk(new T.PlaneGeometry(76, 44), new T.MeshLambertMaterial({ color: L('#23262e') }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const floor = mk(new T.PlaneGeometry(64, 26), new T.MeshLambertMaterial({ map: concTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -7);

    // Líneas amarillas de los 3 cajones + topes laterales de estacionamiento
    const yelM = keep(new T.MeshBasicMaterial({ color: L('#f6c945') }));
    for (const lx of [-4.35, -1.45, 1.45, 4.35]) {
      const l = new T.Mesh(keep(new T.PlaneGeometry(0.14, 15)), yelM);
      l.rotation.x = -Math.PI / 2; l.position.set(lx, 0.015, -4); scene.add(l);
    }
    const curbM = keep(new T.MeshLambertMaterial({ color: L('#d8a828') }));
    for (const sd of [-1, 1]) {
      const curb = new T.Mesh(keep(new T.BoxGeometry(0.35, 0.28, 18)), curbM);
      curb.position.set(sd * (PINKY_ARENA.xMax + 0.55), 0.14, -5); scene.add(curb);
    }

    // Franjas rojas de aviso por cajón (cuando entra un auto marcha atrás) + aro verde cuando Pinky cobra
    const warnPlanes = PINKY_ARENA.lanes.map((lx) => {
      const m = new T.Mesh(keep(new T.PlaneGeometry(2.65, 14)), keep(new T.MeshBasicMaterial({ color: L('#ff3b52'), transparent: true, opacity: 0.35, depthWrite: false })));
      m.rotation.x = -Math.PI / 2; m.position.set(lx, 0.022, -4); m.visible = false;
      scene.add(m);
      return m;
    });
    const chargeRing = new T.Mesh(keep(new T.RingGeometry(1.5, 2.05, 28)), keep(new T.MeshBasicMaterial({ color: L('#6dff8a'), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })));
    chargeRing.rotation.x = -Math.PI / 2; chargeRing.visible = false; scene.add(chargeRing);

    // Fondo pintado del estacionamiento (recorte UV superior para alinear cabina, columnas y fluorescentes sin duplicar piso)
    const bgKey = assets.has('arena_pinky_fondo') ? 'arena_pinky_fondo' : 'galpon';
    let backMap = assets.texture(bgKey);
    if (bgKey === 'arena_pinky_fondo') {
      backMap = keep(backMap.clone());
      backMap.needsUpdate = true;
      backMap.repeat.set(1, 0.68);
      backMap.offset.set(0, 0.32);
    } else if (bgKey === 'galpon') {
      backMap = keep(backMap.clone());
      backMap.needsUpdate = true;
      backMap.repeat.set(1, 0.54);
      backMap.offset.set(0, 0.46);
    }
    const BW = 84, BH = 34;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: backMap, fog: false }));
    back.position.set(0, BH * 0.44, PINKY_ARENA.bossZ - 9);

    // Respaldo por cuadros de pinky_actions_sheet + tira de 6 cuadros agitando el trapo rojo (pinky_walk_sheet)
    const fallbackTex = {}, walkTex = {};
    if (assets.has('pinky_actions_sheet')) {
      const m = assets.meta('pinky_actions_sheet');
      const cols = m.cols || 4;
      for (let i = 0; i < cols; i++) {
        const tx = keep(assets.texture('pinky_actions_sheet').clone());
        tx.needsUpdate = true; tx.repeat.set(1 / cols, 1); tx.offset.set(i / cols, 0);
        fallbackTex[i] = { map: tx, w: m.w / cols, h: m.h };
      }
    }
    const walkFrames = assets.has('pinky_walk_sheet') ? (assets.meta('pinky_walk_sheet').frames || assets.meta('pinky_walk_sheet').cols || 6) : 0;
    if (walkFrames) {
      const wm = assets.meta('pinky_walk_sheet');
      const wc = wm.cols || walkFrames, wr = wm.rows || 1;
      for (let i = 0; i < walkFrames; i++) {
        const tx = keep(assets.texture('pinky_walk_sheet').clone());
        tx.needsUpdate = true;
        tx.repeat.set(1 / wc, 1 / wr);
        tx.offset.set((i % wc) / wc, 1 - (Math.floor(i / wc) + 1) / wr);
        walkTex['arena_pinky_walk' + i] = { map: tx, w: wm.w / wc, h: wm.h / wr, hk: 1 };
      }
    }

    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);
    const setTex = (m, key, fbPose = null) => {
      if (m.userData.key === key) return;
      const prevMap = m.material.map, prevW = m.userData.w, prevH = m.userData.hh;
      if (walkTex[key]) {
        const wt = walkTex[key];
        m.material.map = wt.map; m.material.needsUpdate = true; m.userData.key = key;
        const h = m.userData.h * wt.hk;
        m.userData.w = h * wt.w / wt.h; m.userData.hh = h;
        triggerSpriteBlend(m, prevMap, prevW, prevH, key, unit, keep, scene);
        m.scale.set(m.userData.w, m.userData.hh, 1);
        return;
      }
      if (assets.has(key)) {
        const meta = assets.meta(key);
        m.material.map = assets.texture(key); m.material.needsUpdate = true; m.userData.key = key;
        const h = m.userData.h * (meta.hk || 1);
        m.userData.w = h * meta.w / meta.h; m.userData.hh = h;
        triggerSpriteBlend(m, prevMap, prevW, prevH, key, unit, keep, scene);
        m.scale.set(m.userData.w, m.userData.hh, 1);
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
      stepSpriteBlend(m, py);
      const s = m.userData.sh; if (s) { s.position.set(px, 0.03, pz); s.visible = m.visible; }
    }

    const B = sprite('arena_pinky_reveal', BOSS_H, 0.9, 'reveal');
    const P = sprite(heroPre + 'idle', HERO_H, 0.9);

    // Margot (remate de Fase 3): festeja y le revolea la papilla a los anteojos (ya no llora)
    const margotFx = createMargotFinish({ T, scene, assets, keep, unit, L, kind: 'papilla' });

    // Autos compactos rojos entrando marcha atrás (estilo Pixar: patente, luneta con reflejo, espejos, luces con halo y sombra)
    const carBodyG = keep(new T.BoxGeometry(2.14, 0.96, 3.35));
    const carTopG = keep(new T.BoxGeometry(1.72, 0.66, 1.85));
    const bumperG = keep(new T.BoxGeometry(2.22, 0.28, 0.26));
    const windowG = keep(new T.PlaneGeometry(1.42, 0.46));
    const plateG = keep(new T.PlaneGeometry(0.68, 0.22));
    const mirrorG = keep(new T.BoxGeometry(0.24, 0.14, 0.14));
    const wheelG = keep(new T.CylinderGeometry(0.36, 0.36, 0.26, 14)); wheelG.rotateZ(Math.PI / 2);
    const carRedM = keep(new T.MeshStandardMaterial({ color: L('#e0283b'), roughness: 0.25, metalness: 0.12 }));
    const carRoofM = keep(new T.MeshStandardMaterial({ color: L('#c41e30'), roughness: 0.28, metalness: 0.1 }));
    const carGlassM = keep(new T.MeshBasicMaterial({ map: canvasTex(128, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#3a557a'); gr.addColorStop(1, '#1a273d');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.26)';
      g.beginPath(); g.moveTo(16, 0); g.lineTo(44, 0); g.lineTo(24, h); g.lineTo(4, h); g.closePath(); g.fill();
    }) }));
    const plateM = keep(new T.MeshBasicMaterial({ map: canvasTex(128, 48, (g, w, h) => {
      g.fillStyle = '#f6f7fa'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b4ba8'; g.fillRect(0, 0, w, 10);
      g.strokeStyle = '#222'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#16181e'; g.font = '900 24px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('PK 912', w / 2, h * 0.62);
    }) }));
    const bumperM = keep(new T.MeshStandardMaterial({ color: L('#252830'), roughness: 0.55 }));
    const wheelM = keep(new T.MeshLambertMaterial({ color: L('#14161a') }));
    const revLightG = keep(new T.BoxGeometry(0.38, 0.22, 0.09));
    const revLightM = keep(new T.MeshBasicMaterial({ color: 0xffffff }));
    const tailLightM = keep(new T.MeshBasicMaterial({ color: L('#ff2438') }));
    const redGlowTex = radial([[0, 'rgba(255,50,70,.85)'], [1, 'rgba(255,50,70,0)']]);
    const whiteGlowTex = radial([[0, 'rgba(255,255,240,.92)'], [1, 'rgba(255,255,240,0)']]);
    const liveCars = new Map();

    function makeCar() {
      if (assets.has('arena_pinky_car')) {
        const sp = sprite('arena_pinky_car', 2.4, 1.1);
        return { root: sp, isSprite: true, revLights: [] };
      }
      const g = new T.Group();
      const sh = new T.Mesh(shG, shM); sh.scale.set(2.9, 1, 4.1); sh.position.y = 0.03; sh.renderOrder = 1; g.add(sh);
      const body = new T.Mesh(carBodyG, carRedM); body.position.y = 0.8; g.add(body);
      const top = new T.Mesh(carTopG, carRoofM); top.position.set(0, 1.54, -0.15); g.add(top);
      const win = new T.Mesh(windowG, carGlassM); win.position.set(0, 1.52, 0.79); g.add(win);
      const plate = new T.Mesh(plateG, plateM); plate.position.set(0, 0.72, 1.69); g.add(plate);
      const bumper = new T.Mesh(bumperG, bumperM); bumper.position.set(0, 0.42, 1.68); g.add(bumper);
      for (const sd of [-1, 1]) {
        const mir = new T.Mesh(mirrorG, carRedM); mir.position.set(sd * 1.12, 1.24, -0.45); g.add(mir);
      }
      for (const wx of [-1.04, 1.04]) for (const wz of [-1.02, 1.02]) {
        const w = new T.Mesh(wheelG, wheelM); w.position.set(wx, 0.36, wz); g.add(w);
      }
      const revLights = [];
      for (const sd of [-0.74, 0.74]) {
        const tl = new T.Mesh(revLightG, tailLightM); tl.position.set(sd, 0.94, 1.69); g.add(tl);
        const tg = new T.Sprite(keep(new T.SpriteMaterial({ map: redGlowTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })));
        tg.position.set(sd, 0.94, 1.78); tg.scale.set(1.1, 0.9, 1); g.add(tg);
        const rl = new T.Mesh(revLightG, revLightM); rl.position.set(sd * 0.62, 0.66, 1.69); g.add(rl);
        const rg = new T.Sprite(keep(new T.SpriteMaterial({ map: whiteGlowTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })));
        rg.position.set(sd * 0.62, 0.66, 1.8); rg.scale.set(1.15, 0.95, 1); g.add(rg);
        revLights.push(rl, rg);
      }
      scene.add(g);
      return { root: g, isSprite: false, revLights };
    }

    // Capa de UI + anticipación y botón de Remate de Margot en Fase 3
    document.querySelector('#arena-ui')?.remove();
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML =
      '<div class="arena-flash"></div>' +
      '<div class="phase-card"><small></small><b></b><span></span></div>' +
      '<div class="pinky-margot-cue hidden"><i class="margot-ico" aria-hidden="true"></i><span></span></div>' +
      '<button type="button" class="margot-btn hidden"><i class="margot-ico" aria-hidden="true"></i><span>' + tr('¡TOCÁ: MARGOT TIRA LA PAPILLA!') + '</span></button>';
    document.body.append(ui);
    document.body.classList.add('arena-on');
    const flashE = ui.querySelector('.arena-flash');
    const cardE = ui.querySelector('.phase-card');
    const margotCue = ui.querySelector('.pinky-margot-cue');
    fillText(margotCue.querySelector('span'), '¡MARGOT SE PREPARA PARA AYUDAR!');
    const margotBtn = ui.querySelector('.margot-btn');
    margotBtn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      handle(logic.triggerMargot());
    });
    const bossIntro = attachBossIntro(ui, {
      name: 'PINKY «EL TRAPITO»',
      line1: '¿Pensaste que el jefe era Chaky? ¡A mí nadie me pagó!',
      line2: '¡Son 2 lucas o no pasa nadie!',
      quick: !!game.probar,
      onSkip() { if (phase === 'entrance') phaseT = bossIntro.dur; }
    });

    const CARDS = {
      1: ['FASE 1 · 🚗', '¡DALE, DALE, QUE ENTRA!', 'Esquivá los autos y pegale cuando cobra'],
      2: ['FASE 2 · 🌙', '¡TARIFA NOCTURNA!', 'Entran de a dos: buscá el cajón libre'],
      3: ['FASE 3 · 👶', '¡REMATE CON MARGOT!', '¡Tocá a Margot: le tira la papilla!']
    };
    let cardTimer = 0;
    function phaseCard(p, ms = 2.0) {
      const c = CARDS[p]; if (!c) return;
      fillText(cardE.querySelector('small'), c[0]);
      fillText(cardE.querySelector('b'), c[1]);
      fillText(cardE.querySelector('span'), c[2]);
      cardE.classList.remove('on'); void cardE.offsetWidth; cardE.classList.add('on');
      clearTimeout(cardTimer); cardTimer = setTimeout(() => cardE.classList.remove('on'), ms * 1000);
    }

    const hudName = document.getElementById('hud-name');
    let lifeEl = document.getElementById('hud-boss-life');
    if (!lifeEl && hudName) { lifeEl = document.createElement('span'); lifeEl.id = 'hud-boss-life'; lifeEl.className = 'chaky-lives'; hudName.after(lifeEl); }
    const renderLife = () => { if (lifeEl) lifeEl.textContent = extraLifeUsed ? '☆' : '⭐'; };

    const bar = document.querySelector('#boss-bar'), fill = document.querySelector('#boss-fill');
    const barName = bar?.querySelector('span');
    const setBarName = () => { if (barName) barName.textContent = tr('PINKY «EL TRAPITO»') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3'; };
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
      flashE.style.background = col; flashE.style.opacity = String(flashAlpha(op));
      clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashE.style.opacity = '0'; }, 120);
    };

    let x = 0, z = -1.2, y = 0, vy = 0, t = 0;
    let phase = 'entrance', phaseT = 0, closing = false, disposed = false;
    let dashT = 0, dashCd = 0, dashX = 1, dashZ = 0, hurtT = 0, inv = 0, powT = 0, holdT = 0;
    let swing = null, swingT = 0, swingHit = false, comboStep = 0, comboWindow = 0, buffer = 0, stepT = 0;
    let freezeT = 0, bossFlash = 0, moving = false, heroPose = 'idle', bossKey = 'arena_pinky_reveal';
    const shaker = createShake({ decay: 2.4, maxX: 0.4, maxY: 0.26 });
    let lastSpeech = null, lastBarHp = -1, lastBarPhase = null, extraLifeUsed = false;
    const delayed = [];
    const after = (secs, fn) => delayed.push({ left: secs, fn });
    renderLife();
    const shake = (a) => { shaker.set(Math.min(1, a * 1.6)); };
    const addPts = (n, px, py, pz) => {
      const before = game.score.total;
      game.score.addFlat(n);
      game.combo?.add?.(1);
      pop(px, py, pz, '+' + (game.score.total - before), '#ffd36e', 24);
    };
    const charge = (n) => { hero.power = Math.min(1, hero.power + n); };
    const speak = (ev) => {
      const text = voice.say('pinky', ev);
      if (!text) return;
      if (lastSpeech) { lastSpeech.e.remove(); const i = pops.indexOf(lastSpeech); if (i >= 0) pops.splice(i, 1); }
      lastSpeech = pop(logic.state.bossX, BOSS_H + 0.6, PINKY_ARENA.bossZ, text, '#ffe066', 17, 2.4);
    };

    const billG = keep(new T.BoxGeometry(0.32, 0.04, 0.18));
    const sparks = [];
    const burst = createBurst(T, scene, keep, L, sparks, {
      geo: billG, scale: [0.65, 3.5, 1.1], spd: [2.6, 4.2], vy: [2.6, 3.2], life: [0.48, 0],
      bill: { vy: [3.2, 3.2], life: [0.85, 0] }
    });

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'carWarn': sfx('tick'); break;
          case 'carGo': sfx('horn'); break;
          case 'charging':
            pop(0, BOSS_H + 0.2, PINKY_ARENA.bossZ, '¡ESTÁ COBRANDO! ¡PEGALE!', '#9bf7c4', 20, 1.4);
            break;
          case 'guarded':
            sfx('tick');
            pop(e.x, 3.0, PINKY_ARENA.bossZ, '¡ESPERÁ QUE COBRE!', '#ffe066', 19, 1.0);
            break;
          case 'meleeHit':
            addPts(PINKY_ARENA.points.melee, e.x, 2.8, PINKY_ARENA.bossZ); charge(POWER.hit);
            sfx('hit'); shake(0.28, 0.18); freezeT = 0.05;
            burst(e.x, 2.3, PINKY_ARENA.bossZ + 0.4, '#6de37b', 10, true);
            break;
          case 'dodge':
            addPts(PINKY_ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge * 1.4); sfx('pickup');
            pop(x, 3.4, z, '¡JUSTO!', '#9bf7c4', 20);
            break;
          case 'margotReady':
            sfx('pickup');
            pop(x, 3.6, z, '👶 ¡MARGOT ESTÁ LISTA!', '#ff99cc', 24, 1.4);
            break;
          case 'margotPapilla':
            addPts(PINKY_ARENA.points.margot, 0, 3.5, -5);
            sfx('power'); flash('#ffb347', 0.4); shake(0.4, 0.35); freezeT = 0.06;
            pop(0, 3.4, -5, '👶 ¡AHÍ VA LA PAPILLA! 🥣', '#ffb347', 26, 0.75);
            after(0.65, () => {
              sfx('hit'); shake(0.5, 0.4);
              burst(logic.state.bossX, BOSS_H * 0.8, PINKY_ARENA.bossZ + 0.6, '#ffa53a', 16, false);
              skillFx.play(FX.HERO_CRY, { x: logic.state.bossX, y: BOSS_H * 0.72, z: PINKY_ARENA.bossZ + 0.8 }, { worldSize: 5.0 });
              pop(logic.state.bossX, BOSS_H + 0.9, PINKY_ARENA.bossZ, '¡SPLASH! 🥣😎', '#ffb347', 30, 1.5);
            });
            break;
          case 'bossHit': bossFlash = 0.22; setBar(); break;
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1); hurtT = HURT_POSE; inv = INV;
            if (e.penalty) { game.score.addPenalty(e.penalty); pop(x, 2.6, z, '-$' + e.penalty, '#ff8080', 22); }
            game.score.takeDamage(); game.combo?.reset?.();
            sfx('hurt'); flash('#ff3b52', 0.45); shake(0.38, 0.3);
            if (hero.hp <= 0 && !extraLifeUsed && phase === 'fight') {
              extraLifeUsed = true;
              hero.hp = Math.max(2, Math.ceil((hero.hpMax || 5) * 0.6));
              inv = 1.8; hurtT = 0.15;
              logic.state.cars.length = 0;
              renderLife();
              pop(x, 3.4, z, '⭐ ¡VIDA EXTRA!', '#ffd36e', 26, 1.3);
              sfx('pickup');
            }
            break;
          case 'phase': setBarName(); phaseCard(e.phase, 2.1); shake(0.35, 0.32); sfx('roar'); break;
          case 'voice': speak(e.event); break;
          case 'ko': {
            phase = 'ko'; phaseT = 0; setBar(); setBarName(); freezeT = 0.11;
            const before = game.score.total; game.score.addKill('boss');
            sfx('fanfare'); flash('#fff', 0.6); shake(0.55, 0.5);
            burst(logic.state.bossX, 2.6, PINKY_ARENA.bossZ + 0.4, '#6de37b', 18, true);
            bossFrontFx(skillFx, FX.HERO_CRY, { x: logic.state.bossX, y: 2.8, z: PINKY_ARENA.bossZ + 0.7 }, { worldSize: 5.2, heroX: x });
            pop(logic.state.bossX, BOSS_H * 0.7, PINKY_ARENA.bossZ, '¡K.O.! +' + (game.score.total - before), '#ffe066', 32, 1.6);
            pop(logic.state.bossX, BOSS_H * 0.45, PINKY_ARENA.bossZ, '💵 Cheque firmado: FACU', '#9fe4ff', 22, 2.4);
            break;
          }
        }
      }
    }

    function startSwing() {
      const i = comboWindow > 0 ? (comboStep + 1) % SWINGS.length : 0;
      comboStep = i; swing = SWINGS[i]; swingT = 0; swingHit = false; comboWindow = 0; buffer = 0;
      sfx('swing');
    }

    function usePower() {
      hero.power = 0; powT = 0.55; holdT = 0; freezeT = Math.max(freezeT, 0.085);
      sfx('power'); flash(isM ? '#78e08f' : '#ffd36e', 0.38); shake(0.4, 0.3);
      heroPowerFx(skillFx, isM, { x, z }, { facing: facingToward(x, logic.state.bossX) });
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
      skillFx.update(dt);
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
          dashX = dx / len; dashZ = dz / len; dashT = 0.24; dashCd = 0.52;
          sfx('dodge');
        }
        if (input.consume('attack')) { if (swing) buffer = 0.18; else startSwing(); }
        if (buffer > 0) buffer = Math.max(0, buffer - dt);
        if (input.pressed('attack') && hero.power >= 1) { holdT += dt; if (holdT >= POWER.hold) usePower(); } else holdT = 0;
        if (input.consume('power') && hero.power >= 1) usePower();

        let vx, vz;
        if (dashT > 0) { dashT -= dt; vx = dashX * DASH_SPEED; vz = dashZ * DASH_SPEED; }
        else {
          const mx = input.moveX, mz = input.moveZ, len = Math.max(1, Math.hypot(mx, mz));
          const slow = swing ? 0.35 : 1;
          vx = mx / len * MOVE * slow; vz = mz / len * MOVE * slow;
          moving = Math.hypot(mx, mz) > 0.15;
        }
        x = Math.max(-PINKY_ARENA.xMax + 0.45, Math.min(PINKY_ARENA.xMax - 0.45, x + vx * dt));
        z = Math.max(PINKY_ARENA.zFar, Math.min(PINKY_ARENA.zNear, z + vz * dt));

        if (swing) {
          swingT += dt;
          if (!swingHit && swingT >= swing.hitAt) {
            swingHit = true;
            handle(logic.punch({ x, z, reach: swing.reach, dmg: swing.dmg }));
          }
          if (swing && swingT >= swing.dur) { swing = null; comboWindow = COMBO_WINDOW; if (buffer > 0) startSwing(); }
        }
      } else { dashT = 0; swing = null; holdT = 0; }
      hero.holdT = holdT;
      vy -= CHASE.gravity * dt; y = Math.max(0, y + vy * dt); if (y <= 0) vy = Math.max(0, vy);

      if (phase === 'entrance' && bossIntro.update(phaseT)) {
        phase = 'fight'; phaseT = 0; sfx('roar'); shake(0.26, 0.3);
        speak('intro');
        const curPhase = logic.state.phase === 'ko' ? 3 : logic.state.phase;
        after(1.1, () => phaseCard(curPhase, 1.9));
      }
      for (let i = delayed.length - 1; i >= 0; i--) {
        delayed[i].left -= dt;
        if (delayed[i].left <= 0) { const fn = delayed[i].fn; delayed.splice(i, 1); fn(); }
      }
      if (phase === 'fight') handle(logic.update(dt, { x, z, y, dodging: dashT > 0, inv: inv > 0 || powT > 0 }));
      if (phase === 'fight' && hero.hp <= 0) { phase = 'down'; phaseT = 0; }
      else if (phase === 'ko') logic.update(dt, { x, z, y, dodging: false, inv: true });

      if (phase === 'ko' && phaseT >= END_DELAY) return close(true);
      if (phase === 'down' && phaseT >= END_DELAY) return close(false);
      draw(dt);
      updateHud(dt);
    }

    const warned = new Set();
    const carIds = new Set();
    const lay = [];

    function draw(dt) {
      const S = logic.state;
      if (S.hp !== lastBarHp || S.phase !== lastBarPhase) {
        lastBarHp = S.hp; lastBarPhase = S.phase; setBar(); setBarName();
      }
      const sh = shaker.step(dt || 1 / 60);
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      // Entrada propia de Pinky: contrapicado dramático desde el piso mirando hacia arriba al jefe final
      cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.55 : 0.3) + sh.x, CAM.y - e * 3.8 + sh.y, z + CAM.back - e * 3.2);
      cam.lookAt(0, CAM.lookY + e * 1.6, PINKY_ARENA.bossZ);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();

      // Pinky (camina en 6 cuadros reales al desplazarse y usa arena_pinky_wave al pararse a hacer señas + reveal/charge/hurt/ko)
      const bvx = dt > 0 ? (S.bossX - (B.userData.prevX ?? S.bossX)) / dt : 0;
      B.userData.prevX = S.bossX;
      const wavingWalk = S.pose === 'wave' && walkFrames > 0 && (Math.abs(bvx) > 0.35 || !assets.has('arena_pinky_wave'));
      let sx = 1, sy = 1, by = 0, rz = 0;
      if (wavingWalk) {
        B.userData.stepT = (B.userData.stepT || 0) + dt * 11;
        bossKey = 'arena_pinky_walk' + (Math.floor(B.userData.stepT) % walkFrames);
        sx = Math.abs(bvx) > 0.2 ? (bvx < 0 ? -1 : 1) : (B.userData.lastDir || 1);
        B.userData.lastDir = sx;
        by = Math.abs(Math.sin(B.userData.stepT * Math.PI)) * 0.16;
        rz = -sx * 0.05;
      } else {
        bossKey = 'arena_pinky_' + S.pose;
        // sin autos a la vista descansa con los brazos cruzados y el silbato
        if (S.pose === 'wave' && !S.cars.length && assets.has('arena_pinky_idle')) bossKey = 'arena_pinky_idle';
        if (S.pose === 'wave') { rz = Math.sin(t * 10) * 0.09; by = Math.abs(Math.sin(t * 5)) * 0.12; sy = 1 + Math.sin(t * 10) * 0.03; }
        else if (S.pose === 'reveal') { by = Math.abs(Math.sin(t * 8)) * 0.22; sy = 1 + Math.sin(t * 16) * 0.05; rz = Math.sin(t * 8) * 0.05; }
        else if (S.pose === 'charge') { by = Math.abs(Math.sin(t * 4)) * 0.09; sy = 1 + Math.sin(t * 8) * 0.03; rz = Math.sin(t * 4) * 0.04; }
        else if (S.pose === 'hurt') { rz = 0.16; sy = 0.92; by = 0.18; }
      }
      // Gesto: antes de que entre el auto, Pinky señala con el trapo hacia ese cajón (se entiende de dónde viene)
      const warnCar = S.cars.find(c => c.stage === 'warn');
      if (warnCar && S.pose === 'wave' && !wavingWalk) {
        const dir = warnCar.x - S.bossX > 0.3 ? 1 : warnCar.x - S.bossX < -0.3 ? -1 : (sx || 1);
        sx = dir; rz = -dir * (0.14 + Math.abs(Math.sin(t * 14)) * 0.08); by += 0.08;
      }
      // Con la papilla en los anteojos se tambalea a ciegas (usa su pose dedicada arena_pinky_stun si existe)
      if (margotFx.blind && S.pose !== 'ko') {
        if (assets.has('arena_pinky_stun')) bossKey = 'arena_pinky_stun';
        rz += Math.sin(t * 7) * 0.12; by += Math.abs(Math.sin(t * 3.5)) * 0.06;
      }
      setTex(B, bossKey, S.pose);
      place(B, S.bossX, by, PINKY_ARENA.bossZ);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1); B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      B.material.color.setRGB(1, bossFlash > 0 ? 0.55 : 1, bossFlash > 0 ? 0.55 : 1);

      // Aro verde cuando Pinky está distraído cobrando (invita a correr y pegarle)
      chargeRing.visible = S.mode === 'charge';
      if (chargeRing.visible) {
        chargeRing.position.set(S.bossX, 0.04, PINKY_ARENA.meleeZ);
        chargeRing.scale.setScalar(1 + Math.sin(t * 12) * 0.12);
      }

      // Anticipación + botón + Margot siempre visible al costado derecho hasta que salta al frente en Fase 3
      const showBtn = S.margotReady && phase === 'fight';
      const showCue = !showBtn && phase === 'fight' && S.phase !== 'ko' &&
        ((S.phase === 2 && S.hp <= PINKY_ARENA.p3At + 4) || (S.phase === 3 && S.mode === 'transition'));
      margotCue.classList.toggle('hidden', !showCue);
      margotBtn.classList.toggle('hidden', !showBtn);
      margotFx.draw(dt, t, S.margotT, 2.0, { x: S.bossX, z: PINKY_ARENA.bossZ, h: BOSS_H }, { x: PINKY_ARENA.xMax - 0.5, z: PINKY_ARENA.bossZ + 0.5 });

      // Avisos en los 3 cajones + autos asomando cola con luces de reversa parpadeando en `warn`
      warned.clear();
      carIds.clear();
      const blinkOn = Math.floor(t * 14) % 2 === 0;
      for (const c of S.cars) {
        carIds.add(c.id);
        if (c.stage === 'warn') warned.add(c.lane);
        let obj = liveCars.get(c.id);
        if (!obj) { obj = makeCar(); liveCars.set(c.id, obj); }
        obj.root.visible = true;
        const cz = c.stage === 'warn' ? (PINKY_ARENA.bossZ + 0.3 + Math.sin(t * 45) * 0.06) : c.z;
        const cy = c.stage === 'warn' ? Math.abs(Math.sin(t * 36)) * 0.05 : 0;
        if (obj.isSprite) place(obj.root, c.x, cy, cz);
        else obj.root.position.set(c.x, cy, cz);
        for (const rl of obj.revLights) rl.visible = c.stage === 'drive' || blinkOn;
      }
      for (let l = 0; l < warnPlanes.length; l++) {
        warnPlanes[l].visible = warned.has(l);
        if (warned.has(l)) warnPlanes[l].material.opacity = 0.22 + Math.abs(Math.sin(t * 20)) * 0.28;
      }
      for (const [id, obj] of liveCars) {
        if (carIds.has(id)) continue;
        scene.remove(obj.root);
        if (obj.root.userData?.sh) scene.remove(obj.root.userData.sh);
        liveCars.delete(id);
      }

      // Héroe de espaldas (ciclo de corrida sincronizado con el desplazamiento real)
      const hasDodge = assets.has(heroPre + 'dodge');
      const movedD = Math.hypot(x - P.position.x, z - P.position.z);
      const reallyMoving = moving && movedD > 0.003;
      heroPose = phase === 'down' && assets.has(heroPre + 'ko') ? 'ko' : hurtT > 0 || phase === 'down' ? 'hurt' : powT > 0 && assets.has(heroPre + 'power') ? 'power' : swing || powT > 0 ? 'punch' : dashT > 0 && hasDodge ? 'dodge' : reallyMoving || y > 0.15 || dashT > 0 ? 'run' : 'idle';
      let bob = 0, lean = 0, key = heroPre + heroPose, hsx = 1;
      if (heroPose === 'dodge') { bob = 0.18; hsx = dashX < 0 ? -1 : 1; }
      else if (heroPose === 'run') {
        if (y > 0.15) key = heroPre + 'jump';
        else {
          stepT += movedD * 2.55;
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

      // Billetes verdes volando y chispas del Grito de Margot
      stepSparks(scene, sparks, dt, t);

      // Textos flotantes
      lay.length = 0;
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i]; q.t += dt;
        if (q.t >= q.life) { q.e.remove(); pops.splice(i, 1); if (q === lastSpeech) lastSpeech = null; continue; }
        scratch.copy(q.v); scratch.y += q.t * 0.7; scratch.project(cam);
        const px = Math.max(80, Math.min(innerWidth - 80, (scratch.x * 0.5 + 0.5) * innerWidth));
        const py = Math.max(60, Math.min(innerHeight - 60, (-scratch.y * 0.5 + 0.5) * innerHeight));
        lay.push({ o: q, el: q.e, x: px, y: py });
        q.e.style.opacity = String(Math.min(1, (q.life - q.t) * 3));
      }
      placePops(lay.reverse(), dt);
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(cardTimer); clearTimeout(flashTimer);
      bossIntro.finish();
      lifeEl?.remove();
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
      syncBar: () => { lastBarHp = logic.state.hp; lastBarPhase = logic.state.phase; setBar(); setBarName(); },
      get state() { return logic.state; },
      get heroPose() { return heroPose; },
      get bossKey() { return bossKey; }
    };
    game.state = 'arena-pinky';
  }

  return {
    start,
    update: (dt) => cur?.update(dt),
    render: () => cur?.render(),
    dispose: () => cur?.dispose(),
    syncBar: () => cur?.syncBar(),
    get active() { return !!cur; },
    get logic() { return cur?.logic || null; },
    get state() { return cur?.state || null; }
  };
}
