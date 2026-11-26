// «La arena de Cepi»: cancha de pádel techada de noche en Francia (Nivel 2 — Grupo B).
// Usa las 10 imágenes del Grupo B (`arena_cepi_*`), las voces de Cepi en voice.js y las poses de
// espaldas de Douge/Marine (incluido el esquive). Toda la regla vive en arena_cepi_logic.js.
import { CEPI_ARENA, createCepiArenaLogic } from './arena_cepi_logic.js';
import { createVoice, PROFILES } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';
import { attachBossIntro } from './boss_intro.js';
import { placePops } from './pop_layout.js';
import { triggerSpriteBlend, stepSpriteBlend } from './poses.js';
import { createShake, flashAlpha } from './feedback.js';

const MOVE = 6.4;
const DASH_SPEED = 11.5;
const COMBO_WINDOW = 0.45;
const HURT_POSE = 0.5;
const INV = 1.3;
const END_DELAY = 1.4;
const ENTRANCE = 1.3;
const HERO_H = 2.4, BOSS_H = 5.4, BALL_R = 0.34;
const CAM = { y: 5.4, back: 10.2, lookY: 2.8, fov: 64, fovPortrait: 70 };

export function createCepiArena({ game, input, audio, assets, renderer, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createCepiArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 250);
    scene.background = L('#101c3a');
    scene.fog = new T.Fog(L('#101c3a'), 26, 75);
    scene.add(new T.HemisphereLight(0x9fc8ff, 0x1a2c54, 0.95));
    const spot = new T.DirectionalLight(0xfff0d4, 0.9); spot.position.set(4, 14, 6); scene.add(spot);
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

    // Piso de césped sintético azul de pádel con líneas blancas
    const turfTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#1b4f9c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(5,20,55,.08)';
        g.fillRect((i * 73) % w, (i * 41) % h, 3, 3);
      }
      g.fillStyle = 'rgba(255,255,255,.12)';
      g.fillRect(0, 0, w, 4);
    }, 4, 9);
    const outer = mk(new T.PlaneGeometry(60, 44), new T.MeshLambertMaterial({ color: L('#0d2248') }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const courtW = CEPI_ARENA.xMax * 2 + 0.6;
    const floor = mk(new T.PlaneGeometry(courtW, 24), new T.MeshLambertMaterial({ map: turfTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -7);

    // Líneas blancas de cancha
    const lineM = keep(new T.MeshBasicMaterial({ color: 0xffffff }));
    const addLine = (w, d, lx, lz) => {
      const m = new T.Mesh(keep(new T.PlaneGeometry(w, d)), lineM);
      m.rotation.x = -Math.PI / 2; m.position.set(lx, 0.015, lz); scene.add(m);
    };
    addLine(0.12, 22, -CEPI_ARENA.xMax, -7);
    addLine(0.12, 22, CEPI_ARENA.xMax, -7);
    addLine(0.1, 14, 0, -3.5);
    addLine(courtW - 0.6, 0.14, 0, 1.5);
    addLine(courtW - 0.6, 0.14, 0, -14.5);

    // Paredes laterales de vidrio translúcido (abiertas para no tapar a Cepi en Fase 3)
    const glassM = keep(new T.MeshBasicMaterial({ color: L('#7cc6ff'), transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false }));
    const frameM = keep(new T.MeshLambertMaterial({ color: L('#1a2436') }));
    for (const sd of [-1, 1]) {
      const gw = new T.Mesh(keep(new T.PlaneGeometry(24, 4.2)), glassM);
      gw.rotation.y = Math.PI / 2; gw.position.set(sd * (CEPI_ARENA.xMax + 0.55), 2.1, -7); scene.add(gw);
      const topBar = new T.Mesh(keep(new T.BoxGeometry(0.14, 0.14, 24)), frameM);
      topBar.position.set(sd * (CEPI_ARENA.xMax + 0.55), 4.2, -7); scene.add(topBar);
    }

    // Red de pádel en el medio (z = CEPI_ARENA.netZ)
    const netTex = canvasTex(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(230,242,255,.55)'; g.lineWidth = 3;
      for (let i = 0; i < w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
      for (let j = 0; j < h; j += 16) { g.beginPath(); g.moveTo(0, j); g.lineTo(w, j); g.stroke(); }
    }, 10, 2);
    const netM = keep(new T.MeshBasicMaterial({ map: netTex, transparent: true, side: T.DoubleSide, depthWrite: false }));
    const net = new T.Mesh(keep(new T.PlaneGeometry(courtW, 1.05)), netM);
    net.position.set(0, 0.55, CEPI_ARENA.netZ); scene.add(net);
    const netTape = mk(new T.BoxGeometry(courtW, 0.11, 0.08), new T.MeshBasicMaterial({ color: 0xffffff }));
    netTape.position.set(0, 1.08, CEPI_ARENA.netZ);

    // Zona roja de peligro para el Duelo de la Flechita (mitad izquierda o derecha)
    const warnM = keep(new T.MeshBasicMaterial({ color: L('#ff3b52'), transparent: true, opacity: 0.34, depthWrite: false }));
    const warnPlane = new T.Mesh(keep(new T.PlaneGeometry(CEPI_ARENA.xMax + 0.2, 11)), warnM);
    warnPlane.rotation.x = -Math.PI / 2; warnPlane.position.set(0, 0.025, -3.2); warnPlane.visible = false;
    scene.add(warnPlane);

    // Fondo pintado de la cancha techada en Francia: recortamos la parte superior (techo, luces, banderines y vidrio)
    // para que no se duplique la cancha 3D y lo ensanchamos a BW=84 para eliminar franjas negras en celular horizontal
    const fondoKey = assets.has('arena_cepi_fondo') ? 'arena_cepi_fondo' : 'arena_fondo';
    let backMap = assets.texture(fondoKey);
    if (fondoKey === 'arena_cepi_fondo') {
      backMap = keep(backMap.clone());
      backMap.needsUpdate = true;
      backMap.repeat.set(1, 0.72);
      backMap.offset.set(0, 0.28);
    }
    const BW = 84, BH = 34;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: backMap, fog: false }));
    back.position.set(0, BH * 0.44, CEPI_ARENA.bossZ - 9);

    // Sprites
    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(5,12,35,.65)'], [1, 'rgba(5,12,35,0)']]), transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);
    // Cuadros de carrera lateral de Cepi (cepi_walk_sheet, 6 cuadros)
    const walkTex = {};
    const walkCols = assets.has('cepi_walk_sheet') ? (assets.meta('cepi_walk_sheet').frames || assets.meta('cepi_walk_sheet').cols || 6) : 0;
    if (walkCols) {
      const wm = assets.meta('cepi_walk_sheet');
      const wc = wm.cols || walkCols, wr = wm.rows || 1;
      for (let i = 0; i < walkCols; i++) {
        const tx = keep(assets.texture('cepi_walk_sheet').clone());
        tx.needsUpdate = true; tx.repeat.set(1 / wc, 1 / wr);
        tx.offset.set((i % wc) / wc, 1 - (Math.floor(i / wc) + 1) / wr);
        walkTex['arena_cepi_walk' + i] = { map: tx, w: wm.w / wc, h: wm.h / wr, hk: 1 };
      }
    }
    const setTex = (m, key) => {
      if (m.userData.key === key) return;
      const prevMap = m.material.map, prevW = m.userData.w, prevH = m.userData.hh;
      const custom = walkTex[key];
      if (custom) {
        m.material.map = custom.map; m.material.needsUpdate = true; m.userData.key = key;
        const h = m.userData.h * custom.hk;
        m.userData.w = h * custom.w / custom.h; m.userData.hh = h;
        triggerSpriteBlend(m, prevMap, prevW, prevH, key, unit, keep, scene);
        m.scale.set(m.userData.w, m.userData.hh, 1);
        return;
      }
      const k = assets.has(key) ? key : 'arena_cepi_idle';
      const meta = assets.meta(k);
      m.material.map = assets.texture(k); m.material.needsUpdate = true; m.userData.key = key;
      const h = m.userData.h * (meta.hk || 1);
      m.userData.w = h * meta.w / meta.h; m.userData.hh = h;
      triggerSpriteBlend(m, prevMap, prevW, prevH, key, unit, keep, scene);
      m.scale.set(m.userData.w, m.userData.hh, 1);
    };
    function sprite(key, h, shadow = 1) {
      const m = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ alphaTest: 0.45, side: T.DoubleSide })));
      m.userData.h = h; setTex(m, key); scene.add(m);
      if (shadow) { const s = new T.Mesh(shG, shM); s.scale.set(h * 0.75 * shadow, 1, h * 0.35 * shadow); s.renderOrder = 1; scene.add(s); m.userData.sh = s; }
      return m;
    }
    function place(m, x, y, z) {
      m.position.set(x, y, z);
      m.rotation.y = Math.atan2(cam.position.x - x, cam.position.z - z) * 0.55;
      stepSpriteBlend(m, y);
      const s = m.userData.sh; if (s) { s.position.set(x, 0.03, z); s.visible = m.visible; }
    }

    const B = sprite('arena_cepi_idle', BOSS_H, 0.85);
    const P = sprite(heroPre + 'idle', HERO_H, 0.9);
    // Margot visible al costado derecho de la cancha (del lado de Cepi)
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
    // Lale mirando el partido desde las gradas (rincón derecho, atrás): después se lleva a Margot en el jet de Chaky.
    // Se crea al primer cuadro en que su imagen ya está cargada (la arena se arma antes de la precarga).
    let LS = null, lsTried = false;
    const LS_X = CEPI_ARENA.xMax + 1.45, LS_Z = CEPI_ARENA.bossZ + 1.35, LS_Y = 0.95;
    function makeLale() {
      if (LS || !assets.has('arena_lale_idle')) return;
      LS = sprite('arena_lale_idle', 3.45, 0);
      const woodM = keep(new T.MeshLambertMaterial({ color: L('#7a5130') }));
      const trimM = keep(new T.MeshLambertMaterial({ color: L('#a67548') }));
      const base = new T.Mesh(keep(new T.BoxGeometry(2.5, LS_Y * 0.52, 1.75)), woodM);
      base.position.set(LS_X, LS_Y * 0.26, LS_Z);
      const top = new T.Mesh(keep(new T.BoxGeometry(2.35, LS_Y * 0.48, 1.4)), trimM);
      top.position.set(LS_X, LS_Y * 0.76, LS_Z - 0.12);
      const rail = new T.Mesh(keep(new T.BoxGeometry(2.45, 0.1, 0.1)), trimM);
      rail.position.set(LS_X, LS_Y + 0.05, LS_Z + 0.56);
      scene.add(base, top, rail);
    }
    // 2 señuelos de cartón reutilizables para fase 3
    const decoyMeshes = [0, 1].map(() => {
      const m = sprite('arena_cepi_cardboard', BOSS_H, 0.75);
      m.visible = false;
      return m;
    });

    // Pelotas de pádel (esfera amarilla o dorada + halo + sombra en el piso)
    const ballG = keep(new T.SphereGeometry(BALL_R, 16, 12));
    const ballNormM = keep(new T.MeshStandardMaterial({ color: L('#ffe44d'), emissive: L('#665200'), roughness: 0.35 }));
    const ballGoldM = keep(new T.MeshStandardMaterial({ color: L('#ffd026'), emissive: L('#ff9900'), roughness: 0.2 }));
    const haloTex = radial([[0, 'rgba(255,220,80,.95)'], [0.45, 'rgba(255,175,30,.45)'], [1, 'rgba(255,140,20,0)']]);
    const liveBalls = new Map();

    // Capa de UI encima del canvas (reusa #arena-ui)
    document.querySelector('#arena-ui')?.remove();
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML =
      '<div class="arena-flash"></div>' +
      '<div class="phase-card"><small></small><b></b><span></span></div>' +
      '<div class="cepi-duel hidden">' +
        '<div class="cepi-tell"></div>' +
        '<div class="cepi-btns"><button type="button" data-side="-1">' + tr('← IZQ') + '</button><button type="button" data-side="1">' + tr('DER →') + '</button></div>' +
      '</div>';
    document.body.append(ui);
    document.body.classList.add('arena-on');
    const flashE = ui.querySelector('.arena-flash');
    const cardE = ui.querySelector('.phase-card');
    const duelE = ui.querySelector('.cepi-duel'), tellE = ui.querySelector('.cepi-tell');
    const duelBtns = [...ui.querySelectorAll('.cepi-btns button')];
    const bossIntro = attachBossIntro(ui, {
      name: 'CEPI «EL NIÑO»',
      line1: '¡Me rompiste el eléctrico que todavía pago en cuotas!',
      line2: '¡Si querés a Margot, ganame un Punto de Oro!',
      quick: !!game.probar,
      onSkip() { if (phase === 'entrance') phaseT = bossIntro.dur; }
    });

    const CARDS = {
      1: ['FASE 1 · 🎾', '¡SAQUE Y REMATE!', 'Devolvé la dorada o pegale cuando se cansa'],
      2: ['FASE 2 · ↔️', 'DUELO DE LA FLECHITA', '¡Esquivá al lado CONTRARIO al que apunta!'],
      3: ['FASE 3 · 📦', '¡SEÑUELOS DE CARTÓN!', 'Volteá los cartones y pegale al Cepi real']
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
    const setBarName = () => { if (barName) barName.textContent = tr('CEPI «EL NIÑO»') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3'; };
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
    let phase = 'entrance', phaseT = 0, ended = false, closing = false, disposed = false;
    let dashT = 0, dashCd = 0, dashX = 1, dashZ = 0, hurtT = 0, inv = 0, powT = 0, holdT = 0;
    let swing = null, swingT = 0, swingHit = false, comboStep = 0, comboWindow = 0, buffer = 0, stepT = 0;
    let bossHurtT = 0, freezeT = 0, bossFlash = 0, moving = false, heroPose = 'idle', bossKey = 'arena_cepi_idle';
    const shaker = createShake({ decay: 2.4, maxX: 0.4, maxY: 0.26 });
    let lastSpeech = null, duelOn = false, lastBarHp = -1, lastBarPhase = null, extraLifeUsed = false;
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
      const text = voice.say('cepi', ev);
      if (!text) return;
      if (lastSpeech) { lastSpeech.e.remove(); const i = pops.indexOf(lastSpeech); if (i >= 0) pops.splice(i, 1); }
      lastSpeech = pop(logic.state.bossX, BOSS_H + 0.6, CEPI_ARENA.bossZ, text, '#9fe4ff', 17, 2.3);
    };

    function pickDuelSide(side) {
      if (logic.state.mode !== 'duel') return;
      logic.pickSide(side);
      dashX = side; dashZ = 0; dashT = 0.24; dashCd = 0.3;
      x = Math.max(-CEPI_ARENA.xMax + 0.6, Math.min(CEPI_ARENA.xMax - 0.6, side * 2.8));
      sfx('dodge');
      for (const b of duelBtns) b.classList.toggle('picked', Number(b.dataset.side) === side);
    }
    for (const b of duelBtns) {
      b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); pickDuelSide(Number(b.dataset.side)); });
    }
    const onKey = (ev) => {
      if (!duelOn) return;
      if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') pickDuelSide(-1);
      else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') pickDuelSide(1);
    };
    addEventListener('keydown', onKey);

    const sparkG = keep(new T.BoxGeometry(0.18, 0.18, 0.18));
    const sparks = [];
    function burst(px, py, pz, hex, count = 8) {
      const m = keep(new T.MeshBasicMaterial({ color: L(hex) }));
      for (let i = 0; i < count; i++) {
        const p = new T.Mesh(sparkG, m);
        p.position.set(px, py, pz);
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd = 2.8 + Math.random() * 4.2;
        scene.add(p);
        sparks.push({ p, vx: Math.cos(ang) * spd, vy: 2.5 + Math.random() * 3.5, vz: Math.sin(ang) * spd, t: 0, life: 0.42 + Math.random() * 0.2 });
      }
    }

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'serve': sfx('swing'); break;
          case 'glassBounce': sfx('tick'); pop(e.x, 1.8, e.z, '¡VIDRIO!', '#8ad8ff', 16, 0.7); break;
          case 'dodge':
            addPts(CEPI_ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge); sfx('pickup');
            pop(x, 3.4, z, '¡JUSTO!', '#9bf7c4', 20);
            break;
          case 'returned':
            addPts(e.gold ? CEPI_ARENA.points.returned : CEPI_ARENA.points.normalReturn, e.x, 2.4, e.z);
            charge(e.gold ? 0.24 : 0.1);
            sfx(e.gold ? 'perfect' : 'hit'); shake(e.gold ? 0.3 : 0.16, e.gold ? 0.22 : 0.12);
            if (e.gold) { freezeT = 0.075; burst(e.x, 1.6, e.z, '#ffe066', 12); }
            else burst(e.x, 1.4, e.z, '#c8ff3d', 6);
            pop(e.x, 2.8, e.z, e.gold ? '¡PUNTO DE ORO!' : '¡DEVUELTA!', e.gold ? '#ffe066' : '#9fe4ff', e.gold ? 24 : 20);
            break;
          case 'meleeHit':
            addPts(CEPI_ARENA.points.melee, e.x, 2.6, CEPI_ARENA.bossZ); charge(POWER.hit);
            sfx('hit'); shake(0.26, 0.18); freezeT = 0.045;
            burst(e.x, 2.2, CEPI_ARENA.bossZ + 0.4, '#ffe066', 9);
            break;
          case 'block':
            sfx('tick'); shake(0.14, 0.12);
            burst(e.x, 2.1, CEPI_ARENA.bossZ + 0.4, '#9fe4ff', 5);
            pop(e.x, BOSS_H * 0.7, CEPI_ARENA.bossZ, '¡BLOQUEO!', '#9fe4ff', 22);
            break;
          case 'cardboard':
            addPts(CEPI_ARENA.points.cardboard, e.x, 2.6, CEPI_ARENA.bossZ);
            sfx('hit'); shake(0.22, 0.15); freezeT = 0.04;
            burst(e.x, 2.0, CEPI_ARENA.bossZ + 0.3, '#d9a46c', 10);
            pop(e.x, 3.2, CEPI_ARENA.bossZ, '¡CARTÓN!', '#f5c28b', 24);
            break;
          case 'decoysCleared':
            sfx('perfect'); flash('#9bf7c4', 0.25);
            pop(logic.state.bossX, BOSS_H + 0.2, CEPI_ARENA.bossZ, '¡ATURDIDO! ¡PEGALE!', '#9bf7c4', 22, 1.4);
            break;
          case 'tired':
            pop(logic.state.bossX, BOSS_H + 0.2, CEPI_ARENA.bossZ, '¡CANSADO! ¡PEGALE!', '#9bf7c4', 20, 1.3);
            break;
          case 'duelTell':
            sfx('roar');
            for (const b of duelBtns) b.classList.remove('picked');
            break;
          case 'duelResult':
            if (e.ok) {
              addPts(CEPI_ARENA.points.duel, x, 3.0, z); charge(0.25);
              sfx('perfect'); flash('#9bf7c4', 0.28);
              pop(x, 3.6, z, '¡ESQUIVE PERFECTO!', '#9bf7c4', 24, 1.1);
            } else {
              sfx('hit'); shake(0.35, 0.25);
              pop(x, 3.2, z, '¡TE AGARRÓ!', '#ff8080', 24, 1.0);
            }
            break;
          case 'bossHit':
            bossFlash = 0.22; bossHurtT = 0.45; setBar();
            break;
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
          case 'phase':
            setBarName(); phaseCard(e.phase, 2.1); shake(0.35, 0.35); sfx('roar');
            break;
          case 'shuffle':
            pop(0, 4.2, CEPI_ARENA.bossZ, '¿CUÁL ES EL REAL?', '#ffe066', 22, 1.2);
            break;
          case 'voice': speak(e.event); break;
          case 'ko': {
            phase = 'ko'; phaseT = 0; setBar(); setBarName();
            const before = game.score.total; game.score.addKill('boss');
            sfx('fanfare'); flash('#fff', 0.55); shake(0.5, 0.45);
            pop(logic.state.bossX, BOSS_H * 0.7, CEPI_ARENA.bossZ, '¡K.O.! +' + (game.score.total - before), '#ffe066', 32, 1.5);
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
      sfx('power'); flash(isM ? '#78e08f' : '#ffd36e', 0.38); shake(0.42, 0.32);
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
          const dx = Math.abs(input.moveX) > 0.15 ? Math.sign(input.moveX) : (x > 0 ? -1 : 1);
          const dz = Math.abs(input.moveZ) > 0.15 ? Math.sign(input.moveZ) : 0;
          if (logic.state.mode === 'duel') {
            pickDuelSide(dx);
          } else {
            const len = Math.hypot(dx, dz) || 1;
            dashX = dx / len; dashZ = dz / len; dashT = 0.24; dashCd = 0.55;
            sfx('dodge');
          }
        }
        if (input.consume('attack')) {
          if (swing) buffer = 0.18; else startSwing();
        }
        if (buffer > 0) buffer = Math.max(0, buffer - dt);
        if (input.pressed('attack') && hero.power >= 1) {
          holdT += dt;
          if (holdT >= POWER.hold) usePower();
        } else holdT = 0;
        if (input.consume('power') && hero.power >= 1) usePower();

        let vx, vz;
        if (dashT > 0) { dashT -= dt; vx = dashX * DASH_SPEED; vz = dashZ * DASH_SPEED; }
        else {
          const mx = input.moveX, mz = input.moveZ, len = Math.max(1, Math.hypot(mx, mz));
          const slow = swing ? 0.35 : 1;
          vx = mx / len * MOVE * slow; vz = mz / len * MOVE * slow;
          moving = Math.hypot(mx, mz) > 0.15;
        }
        x = Math.max(-CEPI_ARENA.xMax + 0.45, Math.min(CEPI_ARENA.xMax - 0.45, x + vx * dt));
        z = Math.max(CEPI_ARENA.zFar, Math.min(CEPI_ARENA.zNear, z + vz * dt));

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
        phase = 'fight'; phaseT = 0; sfx('roar'); shake(0.25, 0.3);
        phaseCard(logic.state.phase === 'ko' ? 3 : logic.state.phase, 2.0);
        after(1.9, () => speak('intro'));
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

    const retRingG = keep(new T.RingGeometry(0.65, 0.98, 24)); retRingG.rotateX(-Math.PI / 2);
    const retRingGoldM = keep(new T.MeshBasicMaterial({ color: L('#ffe066'), transparent: true, opacity: 0.92, side: T.DoubleSide, depthWrite: false }));
    const retRingNormM = keep(new T.MeshBasicMaterial({ color: L('#8cffb8'), transparent: true, opacity: 0.72, side: T.DoubleSide, depthWrite: false }));

    const activeIds = new Set();
    const lay = [];

    function draw(dt) {
      const S = logic.state;
      if (S.hp !== lastBarHp || S.phase !== lastBarPhase) {
        lastBarHp = S.hp; lastBarPhase = S.phase; setBar(); setBarName();
      }
      const sh = shaker.step(dt || 1 / 60);
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      // Entrada propia de Cepi: barrido lateral rasante cruzando sobre la red de pádel
      cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.55 : 0.3) - e * 6.8 + sh.x, CAM.y - e * 2.6 + sh.y, z + CAM.back - e * 3.0);
      cam.lookAt(-e * 1.2, CAM.lookY + e * 0.3, CEPI_ARENA.bossZ);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();
      if (M) {
        setMargot(S.phase === 'ko' || S.mode === 'stun' ? 3 : 2);
        place(M, CEPI_ARENA.xMax - 0.55, Math.abs(Math.sin(t * 6)) * 0.1, CEPI_ARENA.bossZ + 0.8);
      }

      makeLale();
      if (LS) place(LS, LS_X, LS_Y + Math.abs(Math.sin(t * 5)) * 0.06, LS_Z);

      // Cepi real (corre en 6 cuadros al desplazarse por la cancha + animaciones de golpe/bloqueo/aturdido)
      const bvx = dt > 0 ? (S.bossX - (B.userData.prevX ?? S.bossX)) / dt : 0;
      B.userData.prevX = S.bossX;
      const walking = S.pose === 'idle' && walkCols > 0 && Math.abs(bvx) > 0.35;
      let bx = S.bossX, by = 0, rz = 0, sx = 1, sy = 1;
      if (walking) {
        B.userData.stepT = (B.userData.stepT || 0) + dt * 11;
        bossKey = 'arena_cepi_walk' + (Math.floor(B.userData.stepT) % walkCols);
        sx = bvx < 0 ? -1 : 1;
        by = Math.abs(Math.sin(B.userData.stepT * Math.PI)) * 0.16;
        rz = -Math.sign(bvx) * 0.06;
      } else {
        bossKey = 'arena_cepi_' + S.pose;
      }
      bossHurtT = Math.max(0, bossHurtT - dt);
      // golpe recibido: se agarra la panza un instante (si la imagen existe y no es KO)
      const hurtNow = bossHurtT > 0 && S.pose !== 'ko' && assets.has('arena_cepi_hurt');
      if (hurtNow) bossKey = 'arena_cepi_hurt';
      setTex(B, bossKey);
      if (S.pose === 'smash') { by = 0.72 + Math.abs(Math.sin(t * 14)) * 0.16; sy = 1.07; sx = 0.95; rz = Math.sin(t * 16) * 0.05; }
      else if (S.pose === 'block') { sy = 0.95; sx = 1.06; by = 0.04; }
      else if (S.pose === 'point') { sx = S.pointDir < 0 ? -1 : 1; by = 0.1; sy = 1.04; rz = S.pointDir * 0.05; }
      else if (S.pose === 'stun') { rz = Math.sin(t * 14) * 0.11; bx += Math.sin(t * 9) * 0.12; }
      else if (S.pose === 'tired') { sy = 0.96 + Math.sin(t * 8) * 0.04; }
      else if (S.pose === 'back') { by = Math.abs(Math.sin(t * 4)) * 0.06; rz = Math.sin(t * 5) * 0.03; }
      else if (S.pose === 'idle' && !walking) { by = Math.abs(Math.sin(t * 2.8)) * 0.09; sy = 1 + Math.sin(t * 5.6) * 0.02; }
      // Gesto previo al saque: se agacha con la paleta arriba (después salta al remate)
      if (S.windup > 0 && S.pose === 'idle' && !hurtNow) {
        const w = S.windup, e = w * w * (3 - 2 * w);
        const ownW = assets.has('arena_cepi_windup');
        const wk = ownW ? 'arena_cepi_windup' : 'arena_cepi_smash';
        if (assets.has(wk)) { bossKey = wk; setTex(B, bossKey); }
        sy = 1 - (ownW ? 0.04 : 0.1) * e; sx = 1 + (ownW ? 0.03 : 0.06) * e; by = 0;
        rz = -(ownW ? 0.06 : 0.12) * e + (w > 0.75 ? Math.sin(t * 60) * 0.025 : 0);
      }
      place(B, bx, by, CEPI_ARENA.bossZ);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1); B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      B.material.color.setRGB(1, bossFlash > 0 ? 0.55 : 1, bossFlash > 0 ? 0.55 : 1);

      // Señuelos de cartón en Fase 3
      for (let i = 0; i < decoyMeshes.length; i++) {
        const m = decoyMeshes[i], c = S.decoys[i];
        if (!c) { m.visible = false; if (m.userData.sh) m.userData.sh.visible = false; continue; }
        m.visible = c.fallT < 1;
        place(m, c.x, 0, CEPI_ARENA.bossZ);
        m.rotation.x = -c.fallT * (Math.PI / 2); // el cartón cae para atrás al golpearlo
        m.rotation.z = c.alive ? Math.sin(t * 3 + i) * 0.02 : 0;
        if (m.userData.sh) m.userData.sh.visible = m.visible;
      }

      // UI + aviso de piso del Duelo de la Flechita (Fase 2) — instrucción directa + botón seguro resaltado en verde
      const isDuel = S.mode === 'duel' && !!S.duel;
      if (isDuel !== duelOn) {
        duelOn = isDuel;
        duelE.classList.toggle('hidden', !isDuel);
        document.body.classList.toggle('cepi-duel-on', isDuel);
      }
      if (isDuel) {
        const d = S.duel;
        const safeSide = d.stage === 'tell' ? -d.dir : 0;
        for (const b of duelBtns) b.classList.toggle('safe', safeSide !== 0 && Number(b.dataset.side) === safeSide);
        if (d.stage === 'hide') {
          warnPlane.visible = false;
          tellE.className = 'cepi-tell wait';
          fillText(tellE, '¿PARA DÓNDE SACA?…');
        } else if (d.stage === 'tell') {
          warnPlane.visible = true;
          warnPlane.position.x = d.dir * (CEPI_ARENA.xMax * 0.52);
          warnM.opacity = 0.28 + Math.abs(Math.sin(t * 22)) * 0.28;
          tellE.className = 'cepi-tell alert';
          fillText(tellE, d.dir < 0 ? '¡CORRÉ A LA DERECHA! →' : '← ¡CORRÉ A LA IZQUIERDA!');
        } else {
          warnPlane.visible = false;
          tellE.className = 'cepi-tell ' + (d.last === 'ok' ? 'ok' : 'bad');
          fillText(tellE, d.last === 'ok' ? '¡BIEN ESQUIVADO!' : '¡PELOTAZO!');
        }
      } else {
        warnPlane.visible = false;
      }

      // Héroe de espaldas (ciclo de corrida sincronizado con el desplazamiento real)
      const hasDodge = assets.has(heroPre + 'dodge');
      const movedD = Math.hypot(x - P.position.x, z - P.position.z);
      const reallyMoving = moving && movedD > 0.003;
      heroPose = phase === 'down' && assets.has(heroPre + 'ko') ? 'ko' : hurtT > 0 || phase === 'down' ? 'hurt' : powT > 0 && assets.has(heroPre + 'power') ? 'power' : swing || powT > 0 ? 'punch' : dashT > 0 && hasDodge ? 'dodge' : reallyMoving || y > 0.15 || dashT > 0 ? 'run' : 'idle';
      let bob = 0, lean = 0, key = heroPre + heroPose, hsx = 1;
      if (heroPose === 'dodge') {
        bob = 0.18; hsx = dashX < 0 ? -1 : 1;
      } else if (heroPose === 'run') {
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
      P.userData.sh.visible = true; P.userData.sh.scale.set(1.55 * (1 - Math.min(0.5, y * 0.2)), 1, 0.75);

      // Pelotas de pádel (con aro brillante en el piso cuando entran en rango de devolución)
      activeIds.clear();
      for (const s of S.shots) {
        activeIds.add(s.id);
        let obj = liveBalls.get(s.id);
        if (!obj) {
          const m = new T.Mesh(ballG, s.gold ? ballGoldM : ballNormM); scene.add(m);
          const sh = new T.Mesh(shG, shM); sh.scale.set(0.9, 1, 0.9); sh.renderOrder = 2; scene.add(sh);
          const ring = new T.Mesh(retRingG, s.gold ? retRingGoldM : retRingNormM); ring.renderOrder = 2; ring.visible = false; scene.add(ring);
          let halo = null;
          if (s.gold) {
            halo = new T.Sprite(keep(new T.SpriteMaterial({ map: haloTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })));
            halo.scale.set(1.7, 1.7, 1); scene.add(halo);
          }
          obj = { m, sh, ring, halo }; liveBalls.set(s.id, obj);
        }
        const arcY = 0.85 + Math.abs(Math.sin((s.z - CEPI_ARENA.bossZ) * 0.45)) * 1.1;
        obj.m.position.set(s.x, arcY, s.z);
        obj.m.rotation.x += dt * 14;
        obj.sh.position.set(s.x, 0.04, s.z);
        const dz = s.z - z;
        const inRange = !s.returning && dz >= CEPI_ARENA.returnZMin - 1.2 && dz <= CEPI_ARENA.returnZMax;
        obj.ring.visible = inRange;
        if (inRange) {
          obj.ring.position.set(s.x, 0.045, s.z);
          obj.ring.scale.setScalar(1 + Math.sin(t * 20) * 0.16);
        }
        if (obj.halo) obj.halo.position.set(s.x, arcY, s.z);
      }
      for (const [id, obj] of liveBalls) {
        if (activeIds.has(id)) continue;
        scene.remove(obj.m); scene.remove(obj.sh); scene.remove(obj.ring); if (obj.halo) scene.remove(obj.halo);
        liveBalls.delete(id);
      }

      // Partículas de impacto (chispas/cartón)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const q = sparks[i]; q.t += dt;
        if (q.t >= q.life) { scene.remove(q.p); sparks.splice(i, 1); continue; }
        q.vy -= 14 * dt;
        q.p.position.x += q.vx * dt; q.p.position.y = Math.max(0.08, q.p.position.y + q.vy * dt); q.p.position.z += q.vz * dt;
        q.p.rotation.x += dt * 10; q.p.rotation.y += dt * 8;
        q.p.scale.setScalar(Math.max(0.01, 1 - q.t / q.life));
      }

      // Textos flotantes proyectados a pantalla
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
      removeEventListener('keydown', onKey);
      lifeEl?.remove();
      ui.remove();
      document.body.classList.remove('arena-on', 'cepi-duel-on');
      if (bar) bar.classList.add('hidden');
      for (const o of own) o.dispose?.();
      cur = null;
    }

    cur = {
      logic,
      update,
      render: () => renderer.render(scene, cam),
      dispose,
      syncBar: () => { lastBarHp = logic.state.hp; lastBarPhase = logic.state.phase; setBar(); setBarName(); },
      get state() { return logic.state; },
      get heroPose() { return heroPose; },
      get bossKey() { return bossKey; }
    };
    game.state = 'arena-cepi';
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
