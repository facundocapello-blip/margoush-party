// «La arena de Lale»: obrador de la boulangerie Le Blé (Acto 3 — Grupo C).
// Usa automáticamente `arena_lale_{idle,throw,skate,floured,hurt,ko,fondo}` si existen en manifest.json;
// mientras llegan las imágenes del Grupo C hace respaldo prolijo con `lale_actions_sheet` y `le_ble`.
import { LALE_ARENA, createLaleArenaLogic } from './arena_lale_logic.js';
import { createVoice } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';
import { attachBossIntro } from './boss_intro.js';
import { placePops } from './pop_layout.js';
import { triggerSpriteBlend, stepSpriteBlend } from './poses.js';

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

    // Piso de baldosas crema/terracota del obrador de Le Blé (ancho completo para evitar vacíos oscuros en horizontal)
    const tileTex = canvasTex(256, 256, (g, w, h) => {
      const n = 4, s = w / n;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        g.fillStyle = (r + c) % 2 ? '#e9d8bc' : '#d5be9c';
        g.fillRect(c * s, r * s, s, s);
        g.strokeStyle = 'rgba(110,75,45,.25)'; g.lineWidth = 3;
        g.strokeRect(c * s + 1, r * s + 1, s - 2, s - 2);
      }
    }, 19, 8);
    const outer = mk(new T.PlaneGeometry(76, 44), new T.MeshLambertMaterial({ color: L('#4a2f1d') }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const floor = mk(new T.PlaneGeometry(64, 26), new T.MeshLambertMaterial({ map: tileTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -7);
    // Molduras cálidas de madera marcando los límites jugables del obrador
    const railM = keep(new T.MeshLambertMaterial({ color: L('#7b4822') }));
    for (const sd of [-1, 1]) {
      const rail = new T.Mesh(keep(new T.BoxGeometry(0.32, 0.36, 22)), railM);
      rail.position.set(sd * (LALE_ARENA.xMax + 0.55), 0.18, -6); scene.add(rail);
    }

    // Fondo pintado del obrador (recorte UV superior para alinear los 3 hornos encendidos con el piso 3D de baldosas)
    const bgKey = assets.has('arena_lale_fondo') ? 'arena_lale_fondo' : 'le_ble';
    let backMap = assets.texture(bgKey);
    if (bgKey === 'arena_lale_fondo') {
      backMap = keep(backMap.clone());
      backMap.needsUpdate = true;
      backMap.repeat.set(1, 0.72);
      backMap.offset.set(0, 0.28);
    }
    const BW = 84, BH = 36;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: backMap, fog: false }));
    back.position.set(0, BH * 0.44, LALE_ARENA.bossZ - 9);

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

    const B = sprite('arena_lale_idle', BOSS_H, 0.9, 'idle');
    const P = sprite(heroPre + 'idle', HERO_H, 0.9);
    // Margot visible al costado derecho del obrador (del lado de Lale)
    let M = null, margotCell = -1;
    const MARGOT_H = 1.85;
    if (assets.has('margot_sheet')) {
      const mm = assets.meta('margot_sheet');
      const tx = keep(assets.texture('margot_sheet').clone());
      tx.needsUpdate = true; tx.repeat.set(1 / (mm.cols || 2), 1 / (mm.rows || 2));
      M = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ map: tx, alphaTest: 0.42, transparent: true, side: T.DoubleSide })));
      M.userData.sheet = tx; M.userData.cols = mm.cols || 2; M.userData.rows = mm.rows || 2;
      M.scale.set(MARGOT_H, MARGOT_H, 1); scene.add(M);
    }
    const setMargot = (cell) => {
      if (!M || margotCell === cell) return;
      margotCell = cell;
      // imagen propia: asustada (2) o festejando (3); si no está cargada, usa el cuadro de la hoja
      const own = cell === 3 ? 'arena_margot_cheer' : 'arena_margot_scared';
      if (assets.has(own)) {
        const om = assets.meta(own);
        M.material.map = assets.texture(own); M.material.needsUpdate = true;
        M.scale.set(MARGOT_H * om.w / om.h, MARGOT_H, 1); M.userData.own = true;
        return;
      }
      if (M.userData.own) { M.material.map = M.userData.sheet; M.material.needsUpdate = true; M.scale.set(MARGOT_H, MARGOT_H, 1); M.userData.own = false; }
      const c = M.userData.cols, r = M.userData.rows;
      M.material.map.offset.set((cell % c) / c, (r - 1 - Math.floor(cell / c)) / r);
    };
    setMargot(2);

    // Bolsa de harina ilustrada (reemplaza al cilindro liso) con etiqueta «HARINA» + nube voladora + aviso de patín
    const flourBagTex = canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      // Sombra interna suave + cuerpo regordete del saco
      const grad = g.createLinearGradient(50, 70, 206, 238);
      grad.addColorStop(0, '#fffdf7'); grad.addColorStop(0.55, '#f4e6cc'); grad.addColorStop(1, '#d8be94');
      g.fillStyle = grad; g.strokeStyle = '#6d4724'; g.lineWidth = 7;
      g.beginPath();
      g.moveTo(92, 68); g.quadraticCurveTo(40, 122, 46, 208);
      g.quadraticCurveTo(50, 240, 128, 242); g.quadraticCurveTo(206, 240, 210, 208);
      g.quadraticCurveTo(216, 122, 164, 68); g.closePath();
      g.fill(); g.stroke();
      // Cuello arrugado arriba
      g.beginPath(); g.moveTo(92, 68); g.lineTo(74, 28); g.quadraticCurveTo(128, 42, 182, 28); g.lineTo(164, 68); g.closePath();
      g.fill(); g.stroke();
      // Piolín rojo atado
      g.strokeStyle = '#d63638'; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(86, 68); g.quadraticCurveTo(128, 78, 170, 68); g.stroke();
      // Polvo blanco alrededor de la boca
      g.fillStyle = 'rgba(255,255,255,.88)';
      for (const [cx, cy, r] of [[78, 24, 14], [128, 18, 18], [176, 26, 13], [104, 28, 11], [154, 24, 12]]) {
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      }
      // Etiqueta roja/crema HARINA
      g.fillStyle = '#c83434'; g.fillRect(62, 128, 132, 48);
      g.strokeStyle = '#fff5dc'; g.lineWidth = 4; g.strokeRect(66, 132, 124, 40);
      g.fillStyle = '#fff'; g.font = '900 28px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(tr('HARINA'), 128, 154);
      g.fillStyle = '#6d4724'; g.font = '900 18px Fredoka, sans-serif';
      g.fillText(tr('👊 ¡PEGALE!'), 128, 204);
    });
    flourBagTex.wrapS = flourBagTex.wrapT = T.ClampToEdgeWrapping; flourBagTex.repeat.set(1, 1);
    const bagMat = keep(new T.MeshBasicMaterial({ map: flourBagTex, alphaTest: 0.25, transparent: true, side: T.DoubleSide }));
    const butterG = keep(new T.BoxGeometry(0.9, 0.42, 0.5));
    const butterM = keep(new T.MeshStandardMaterial({ color: L('#ffe169'), emissive: L('#664c00'), roughness: 0.25 }));
    const puddleG = keep(new T.CircleGeometry(LALE_ARENA.puddleR, 20)); puddleG.rotateX(-Math.PI / 2);
    const puddleM = keep(new T.MeshBasicMaterial({ color: L('#ffd447'), transparent: true, opacity: 0.72, depthWrite: false }));
    const ringG = keep(new T.RingGeometry(0.8, 1.15, 24)); ringG.rotateX(-Math.PI / 2);
    const ringM = keep(new T.MeshBasicMaterial({ color: L('#ffffff'), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }));
    // Banda dorada de aviso antes de cada patinada de Lale + aro de vulnerabilidad cuando está enharinado
    const skateWarnM = keep(new T.MeshBasicMaterial({ color: L('#ffd447'), transparent: true, opacity: 0.45, depthWrite: false }));
    const skateWarnPlane = new T.Mesh(keep(new T.PlaneGeometry(LALE_ARENA.xMax * 2 + 0.6, 1.8)), skateWarnM);
    skateWarnPlane.rotation.x = -Math.PI / 2; skateWarnPlane.visible = false; scene.add(skateWarnPlane);
    const vulnRing = new T.Mesh(keep(new T.RingGeometry(1.5, 2.05, 28)), keep(new T.MeshBasicMaterial({ color: L('#ffffff'), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })));
    vulnRing.rotation.x = -Math.PI / 2; vulnRing.visible = false; scene.add(vulnRing);
    // Nube de harina que vuela desde la bolsa hasta Lale al explotarla
    const puffG = keep(new T.SphereGeometry(0.65, 10, 8));
    const puffM = keep(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    const flourClouds = [];
    const liveShots = new Map(), livePuddles = new Map(), liveBags = new Map();

    // Capa de UI
    document.querySelector('#arena-ui')?.remove();
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML = '<div class="arena-flash"></div><div class="phase-card"><small></small><b></b><span></span></div>';
    document.body.append(ui);
    document.body.classList.add('arena-on');
    const flashE = ui.querySelector('.arena-flash');
    const cardE = ui.querySelector('.phase-card');
    const bossIntro = attachBossIntro(ui, {
      name: 'LALE «MANTECOSO»',
      line1: '¡Nadie toca mis croissants ni a la bebé!',
      line2: '¡Te voy a dejar patinando hasta mañana!',
      quick: !!game.probar,
      onSkip() { if (phase === 'entrance') phaseT = bossIntro.dur; }
    });

    const CARDS = {
      1: ['FASE 1 · 🧈', '¡MANTECA PARA TODOS!', 'Pegale a la bolsa de harina para enharinarlo'],
      2: ['FASE 2 · ⛸️', '¡PATINANDO EN MANTECA!', 'Esquivá sus pasadas y tirale harina'],
      3: ['FASE 3 · 🔥', '¡SUBÍ EL HORNO!', '¡Manteca, patín y harina a toda máquina!']
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
    let lastSpeech = null, lastBarHp = -1, lastBarPhase = null, extraLifeUsed = false;
    renderLife();
    const shake = (a, dur) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, dur); };
    const addPts = (n, px, py, pz) => {
      const before = game.score.total;
      game.score.addFlat(n);
      game.combo?.add?.(1);
      pop(px, py, pz, '+' + (game.score.total - before), '#ffd36e', 24);
    };
    const charge = (n) => { hero.power = Math.min(1, hero.power + n); };
    const speak = (ev) => {
      const text = voice.say('lale', ev);
      if (!text) return;
      if (lastSpeech) { lastSpeech.e.remove(); const i = pops.indexOf(lastSpeech); if (i >= 0) pops.splice(i, 1); }
      lastSpeech = pop(logic.state.bossX, BOSS_H + 0.6, logic.state.bossZ, text, '#ffe9a8', 17, 2.3);
    };
    function spawnFlourCloud(fx0, fz0) {
      const g = new T.Group();
      for (let i = 0; i < 4; i++) {
        const p = new T.Mesh(puffG, puffM);
        p.position.set((i - 1.5) * 0.35, (i % 2) * 0.3, (i % 3 - 1) * 0.25);
        p.scale.setScalar(0.8 + (i % 2) * 0.35);
        g.add(p);
      }
      g.position.set(fx0, 1.3, fz0);
      scene.add(g);
      flourClouds.push({ g, x0: fx0, z0: fz0, t: 0, dur: 0.3 });
    }

    const sparkG = keep(new T.BoxGeometry(0.2, 0.2, 0.2));
    const sparks = [];
    function burst(px, py, pz, hex, count = 8) {
      const m = keep(new T.MeshBasicMaterial({ color: L(hex) }));
      for (let i = 0; i < count; i++) {
        const p = new T.Mesh(sparkG, m);
        p.position.set(px, py, pz);
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd = 2.6 + Math.random() * 4.0;
        scene.add(p);
        sparks.push({ p, vx: Math.cos(ang) * spd, vy: 2.4 + Math.random() * 3.4, vz: Math.sin(ang) * spd, t: 0, life: 0.45 + Math.random() * 0.2 });
      }
    }

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'throw': sfx('swing'); break;
          case 'skateStart': sfx('roar'); pop(0, 3.8, -4, '¡A PATINAR!', '#ffe066', 24, 1.0); break;
          case 'bagBurst':
            sfx('perfect'); flash('#ffffff', 0.32); shake(0.26, 0.2); freezeT = 0.04;
            spawnFlourCloud(e.x, e.z);
            burst(e.x, 1.4, e.z, '#ffffff', 12);
            pop(e.x, 2.5, e.z, '¡HARINA!', '#ffffff', 26, 1.1);
            break;
          case 'floured':
            addPts(LALE_ARENA.points.flour, e.x, 3.8, LALE_ARENA.bossZ); charge(0.25); freezeT = 0.055;
            burst(e.x, 2.6, LALE_ARENA.bossZ + 0.4, '#ffffff', 14);
            pop(e.x, BOSS_H + 0.2, LALE_ARENA.bossZ, '¡ENHARINADO! ¡PEGALE!', '#ffffff', 20, 1.4);
            break;
          case 'meleeHit':
            addPts(LALE_ARENA.points.melee, e.x, 2.8, LALE_ARENA.bossZ); charge(POWER.hit);
            sfx('hit'); shake(0.26, 0.18); freezeT = 0.045;
            burst(e.x, 2.2, LALE_ARENA.bossZ + 0.4, '#ffe169', 9);
            break;
          case 'slipAway':
            sfx('tick');
            burst(e.x, 1.8, logic.state.bossZ + 0.3, '#ffe169', 5);
            pop(e.x, 3.0, logic.state.bossZ, '¡MUY MANTECOSO! ¡USÁ HARINA!', '#ffe066', 18, 1.2);
            break;
          case 'dodge':
            addPts(LALE_ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge); sfx('pickup');
            pop(x, 3.4, z, '¡JUSTO!', '#9bf7c4', 20);
            break;
          case 'bossHit': bossFlash = 0.22; setBar(); sfx('hit'); shake(0.26, 0.2); break;
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1); hurtT = HURT_POSE; inv = INV;
            game.score.takeDamage(); game.combo?.reset?.();
            sfx('hurt'); flash('#ff3b52', 0.45); shake(0.35, 0.28);
            if (hero.hp <= 0 && !extraLifeUsed && phase === 'fight') {
              extraLifeUsed = true;
              hero.hp = Math.max(2, Math.ceil((hero.hpMax || 5) * 0.6));
              inv = 1.8; hurtT = 0.15;
              logic.state.shots.length = 0;
              renderLife();
              pop(x, 3.4, z, '⭐ ¡VIDA EXTRA!', '#ffd36e', 26, 1.3);
              sfx('pickup');
            }
            break;
          case 'phase': setBarName(); phaseCard(e.phase, 2.1); shake(0.32, 0.3); sfx('roar'); break;
          case 'voice': speak(e.event); break;
          case 'ko': {
            phase = 'ko'; phaseT = 0; setBar(); setBarName(); freezeT = 0.1;
            const before = game.score.total; game.score.addKill('boss');
            sfx('fanfare'); flash('#fff', 0.55); shake(0.48, 0.45);
            burst(logic.state.bossX, 2.6, LALE_ARENA.bossZ + 0.4, '#ffe169', 16);
            pop(logic.state.bossX, BOSS_H * 0.7, LALE_ARENA.bossZ, '¡K.O.! +' + (game.score.total - before), '#ffe066', 32, 1.5);
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
        if (input.pressed('attack') && hero.power >= 1) { holdT += dt; if (holdT >= POWER.hold) usePower(); } else holdT = 0;
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

      if (phase === 'entrance' && bossIntro.update(phaseT)) {
        phase = 'fight'; phaseT = 0; sfx('roar'); shake(0.22, 0.25);
        phaseCard(logic.state.phase === 'ko' ? 3 : logic.state.phase, 2.0);
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

    const shotIds = new Set();
    const pudIds = new Set();
    const bagIds = new Set();
    const lay = [];

    function draw(dt) {
      const S = logic.state;
      if (S.hp !== lastBarHp || S.phase !== lastBarPhase) {
        lastBarHp = S.hp; lastBarPhase = S.phase; setBar(); setBarName();
      }
      shakeT = Math.max(0, shakeT - dt); if (shakeT <= 0) shakeA = 0;
      const sh = shakeA * Math.min(1, shakeT * 4);
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      // Entrada propia de Lale: paneo diagonal cálido desde los hornos a la derecha
      cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.55 : 0.3) + e * 6.5 + (Math.random() - 0.5) * sh, CAM.y - e * 1.8 + (Math.random() - 0.5) * sh, z + CAM.back - e * 2.2);
      cam.lookAt(e * 1.4, CAM.lookY + e * 0.4, LALE_ARENA.bossZ);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();
      if (M) {
        setMargot(S.phase === 'ko' || S.mode === 'floured' ? 3 : 2);
        place(M, LALE_ARENA.xMax - 0.5, Math.abs(Math.sin(t * 6)) * 0.1, LALE_ARENA.bossZ + 0.6);
      }

      // Lale (camina en 6 cuadros reales al desplazarse + poses dedicadas arena_lale_idle/throw/skate/floured/hurt/ko)
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
        if (S.pose === 'skate' && assets.has('arena_lale_skate2') && Math.floor(t * 5) % 2) bossKey = 'arena_lale_skate2';
        if (S.pose === 'skate') {
          sx = S.skateDir < 0 ? -1 : 1;
          by = 0.06 + Math.abs(Math.sin(t * 15)) * 0.16;
          rz = -sx * 0.16 + Math.sin(t * 15) * 0.05;
          sy = 0.95 + Math.abs(Math.sin(t * 15)) * 0.08;
        }
        else if (S.pose === 'throw') { sx = x < S.bossX ? -1 : 1; sy = 0.95; sx *= 1.06; rz = -Math.sign(sx) * 0.14; by = 0.14; } // suelta: se tira para adelante
        else if (S.pose === 'floured') { rz = Math.sin(t * 20) * 0.09; sy = 0.95 + Math.abs(Math.sin(t * 14)) * 0.08; }
        else if (S.pose === 'hurt') { rz = 0.16; sy = 0.92; by = 0.18; }
        else if (S.pose === 'idle') { by = Math.abs(Math.sin(t * 2.5)) * 0.08; sy = 1 + Math.sin(t * 5) * 0.02; }
      }
      // Gesto previo: se planta, levanta la manteca y se echa para atrás antes de revolearla
      if (S.windup > 0 && S.pose === 'idle') {
        const w = S.windup, e = w * w * (3 - 2 * w), dir = x < S.bossX ? -1 : 1;
        const ownW = assets.has('arena_lale_windup');
        if (ownW) bossKey = 'arena_lale_windup';
        else if (assets.has('arena_lale_throw')) bossKey = 'arena_lale_throw';
        sx = dir;
        rz = dir * (ownW ? 0.08 : 0.2) * e + (w > 0.75 ? Math.sin(t * 60) * 0.025 : 0);
        sy = 1 + (ownW ? 0.03 : 0.06) * e;
        by = (ownW ? 0.05 : 0.1) * e;
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

      // Banda dorada de aviso antes de cada patinada + aro blanco cuando Lale está enharinado
      skateWarnPlane.visible = S.mode === 'skateWarn';
      if (skateWarnPlane.visible) {
        skateWarnPlane.position.set(0, 0.03, S.skateWarnZ);
        skateWarnM.opacity = 0.25 + Math.abs(Math.sin(t * 22)) * 0.35;
      }
      vulnRing.visible = S.mode === 'floured';
      if (vulnRing.visible) {
        vulnRing.position.set(S.bossX, 0.04, LALE_ARENA.meleeZ);
        vulnRing.scale.setScalar(1 + Math.sin(t * 12) * 0.12);
      }

      // Nubes de harina volando desde la bolsa explotada hasta Lale
      for (let i = flourClouds.length - 1; i >= 0; i--) {
        const c = flourClouds[i]; c.t += dt;
        const p = Math.min(1, c.t / c.dur);
        c.g.position.set(c.x0 + (S.bossX - c.x0) * p, 1.3 + Math.sin(p * Math.PI) * 2.2, c.z0 + (S.bossZ - c.z0) * p);
        c.g.scale.setScalar(1 + p * 1.4);
        c.g.rotation.y += dt * 7;
        if (c.t >= c.dur) { scene.remove(c.g); flourClouds.splice(i, 1); }
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

      // Barras de manteca volando
      shotIds.clear();
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
      pudIds.clear();
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

      // Bolsas de harina ilustradas («HARINA · 👊 ¡PEGALE!») con anillo blanco pulsante
      bagIds.clear();
      for (const b of S.bags) {
        if (!b.alive) continue;
        bagIds.add(b.id);
        let obj = liveBags.get(b.id);
        if (!obj) {
          const m = new T.Mesh(unit, bagMat); m.scale.set(1.9, 1.9, 1); scene.add(m);
          const sh = new T.Mesh(shG, shM); sh.scale.set(1.4, 1, 0.7); sh.renderOrder = 1; scene.add(sh);
          const r = new T.Mesh(ringG, ringM); r.renderOrder = 2; scene.add(r);
          obj = { m, sh, r }; liveBags.set(b.id, obj);
        }
        const byBob = Math.abs(Math.sin(t * 4.5 + b.id)) * 0.12;
        obj.m.position.set(b.x, byBob, b.z);
        obj.m.rotation.y = Math.atan2(cam.position.x - b.x, cam.position.z - b.z) * 0.55;
        obj.m.rotation.z = Math.sin(t * 5 + b.id) * 0.06;
        obj.sh.position.set(b.x, 0.03, b.z);
        obj.r.position.set(b.x, 0.04, b.z);
        obj.r.scale.setScalar(1 + Math.sin(t * 7) * 0.14);
      }
      for (const [id, obj] of liveBags) {
        if (bagIds.has(id)) continue;
        scene.remove(obj.m); scene.remove(obj.sh); scene.remove(obj.r); liveBags.delete(id);
      }

      // Partículas de harina y manteca al impactar
      for (let i = sparks.length - 1; i >= 0; i--) {
        const q = sparks[i]; q.t += dt;
        if (q.t >= q.life) { scene.remove(q.p); sparks.splice(i, 1); continue; }
        q.vy -= 13 * dt;
        q.p.position.x += q.vx * dt; q.p.position.y = Math.max(0.08, q.p.position.y + q.vy * dt); q.p.position.z += q.vz * dt;
        q.p.rotation.x += dt * 9; q.p.rotation.y += dt * 7;
        q.p.scale.setScalar(Math.max(0.01, 1 - q.t / q.life));
      }

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
    game.state = 'arena-lale';
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
