// «La arena final de Facu»: galería de arte HENRIS en Buenos Aires (Acto 5, el cerebro de todo).
// Facu galerista/pintor: apunta y revolea pincelazos (con gesto previo), pinta en su atril y se derrite
// con los garabatos de Margot. Usa las poses `arena_facu_<pose>` si existen; si no, el dibujo `facu`
// animado por código (el de presentador queda para cuando presenta).
// Fase 1: obra en vivo · Fase 2: «¿cuál es el cuadro verdadero?» · Fase 3: enojado + crayones de Margot.
import { FACU_ARENA, createFacuArenaLogic } from './arena_facu_logic.js';
import { createVoice } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';
import { attachBossIntro } from './boss_intro.js';
import { createMargotFinish } from './margot_finish.js';

const MOVE = 6.4;
const DASH_SPEED = 11.5;
const COMBO_WINDOW = 0.45;
const HURT_POSE = 0.5;
const INV = 1.3;
const END_DELAY = 1.5;
const ENTRANCE = 1.3;
const HERO_H = 2.4, BOSS_H = 5.0;
const CAM = { y: 5.6, back: 10.4, lookY: 2.8, fov: 64, fovPortrait: 70 };

export function createFacuArena({ game, input, audio, assets, renderer, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createFacuArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 250);
    scene.background = L('#1b1220');
    scene.fog = new T.Fog(L('#1b1220'), 30, 80);
    scene.add(new T.HemisphereLight(0xfff0dc, 0x3a2a33, 1.0));
    const fluor = new T.DirectionalLight(0xffe9c4, 0.85); fluor.position.set(0, 14, 4); scene.add(fluor);
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

    // Pinturas abstractas (las mismas cuatro se usan en la pared, en los cuadros voladores y en el minijuego)
    const drawPainting = (g, w, h, seed) => {
      let q = seed * 9301 + 49297; const r = () => { q = (q * 9301 + 49297) % 233280; return q / 233280; };
      const pal = [['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'], ['#f72585', '#7209b7', '#3a0ca3', '#4cc9f0'], ['#ffb703', '#fb8500', '#219ebc', '#023047'], ['#e63946', '#f1faee', '#a8dadc', '#457b9d']][seed % 4];
      g.fillStyle = pal[3]; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.88;
      for (let i = 0; i < 7; i++) {
        g.fillStyle = pal[Math.floor(r() * 4)];
        if (r() < 0.5) { g.beginPath(); g.arc(r() * w, r() * h, (0.12 + r() * 0.25) * h, 0, 6.283); g.fill(); }
        else g.fillRect(r() * w * 0.8, r() * h * 0.8, (0.15 + r() * 0.35) * w, (0.12 + r() * 0.3) * h);
      }
      g.globalAlpha = 1;
    };
    const paintTex = [0, 1, 2, 3].map((i) => canvasTex(128, 96, (g, w, h) => drawPainting(g, w, h, i)));

    // Galería HENRIS: parquet, pared de fondo con cuadros colgados y alfombras rojas en los 3 carriles
    const parquet = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#6b4528'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? 'rgba(0,0,0,.10)' : 'rgba(255,220,160,.08)'; g.fillRect(0, i * 32, w, 32);
        g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(0, i * 32, w, 2);
        g.fillRect(((i * 97) % w), i * 32, 2, 32);
      }
    }, 6, 6);
    const outer = mk(new T.PlaneGeometry(70, 44), new T.MeshLambertMaterial({ color: L('#1d1320') }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const floor = mk(new T.PlaneGeometry(34, 26), new T.MeshLambertMaterial({ map: parquet }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -7);
    const carpetM = keep(new T.MeshLambertMaterial({ color: L('#7a1f38') }));
    const trimM = keep(new T.MeshBasicMaterial({ color: L('#e8b84a') }));
    for (const lx of FACU_ARENA.lanes) {
      const c = new T.Mesh(keep(new T.PlaneGeometry(2.55, 15)), carpetM);
      c.rotation.x = -Math.PI / 2; c.position.set(lx, 0.012, -4); scene.add(c);
      for (const sd of [-1, 1]) {
        const tr_ = new T.Mesh(keep(new T.PlaneGeometry(0.08, 15)), trimM);
        tr_.rotation.x = -Math.PI / 2; tr_.position.set(lx + sd * 1.2, 0.015, -4); scene.add(tr_);
      }
    }
    // Cuerda de museo a los costados
    const ropeM = keep(new T.MeshLambertMaterial({ color: L('#d8a828') }));
    for (const sd of [-1, 1]) {
      const rail = new T.Mesh(keep(new T.BoxGeometry(0.16, 0.16, 18)), ropeM);
      rail.position.set(sd * (FACU_ARENA.xMax + 0.55), 0.85, -5); scene.add(rail);
      for (const pz of [3, -2, -7, -12]) {
        const post = new T.Mesh(keep(new T.CylinderGeometry(0.1, 0.12, 0.9, 8)), ropeM);
        post.position.set(sd * (FACU_ARENA.xMax + 0.55), 0.45, pz); scene.add(post);
      }
    }
    const warnPlanes = FACU_ARENA.lanes.map((lx) => {
      const m = new T.Mesh(keep(new T.PlaneGeometry(2.65, 14)), keep(new T.MeshBasicMaterial({ color: L('#ffcf3f'), transparent: true, opacity: 0.35, depthWrite: false })));
      m.rotation.x = -Math.PI / 2; m.position.set(lx, 0.022, -4); m.visible = false;
      scene.add(m);
      return m;
    });
    const chargeRing = new T.Mesh(keep(new T.RingGeometry(1.5, 2.05, 28)), keep(new T.MeshBasicMaterial({ color: L('#6dff8a'), transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })));
    chargeRing.rotation.x = -Math.PI / 2; chargeRing.visible = false; scene.add(chargeRing);

    // Pared del fondo (o `arena_facu_fondo` si algún día llega la imagen pintada)
    const wallTex = assets.has('arena_facu_fondo') ? assets.texture('arena_facu_fondo') : canvasTex(1400, 560, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2d1d2e'); gr.addColorStop(1, '#4a2e3a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5b3a2a'; g.fillRect(0, h * 0.8, w, h * 0.2);          // zócalo
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x < w; x += 140) g.fillRect(x, 0, 3, h * 0.8);
      const sizes = [[170, 120], [120, 150], [200, 130], [140, 110], [160, 140], [190, 120], [130, 150]];
      let cx = 70;
      sizes.forEach(([pw, ph], i) => {
        const y = 80 + (i % 2) * 60;
        g.fillStyle = '#d9a521'; g.fillRect(cx - 8, y - 8, pw + 16, ph + 16);
        g.fillStyle = '#7a5410'; g.fillRect(cx - 3, y - 3, pw + 6, ph + 6);
        g.save(); g.translate(cx, y); drawPainting(g, pw, ph, i + 1); g.restore();
        const lg = g.createRadialGradient(cx + pw / 2, y - 30, 4, cx + pw / 2, y - 30, pw);
        lg.addColorStop(0, 'rgba(255,240,190,.35)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
        g.fillStyle = lg; g.fillRect(cx - 40, y - 60, pw + 80, ph + 120);
        cx += pw + 60;
      });
    });
    const BW = 70, BH = 28;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: wallTex, fog: false }));
    back.position.set(0, BH * 0.43, FACU_ARENA.bossZ - 3.5);

    const fallbackTex = {}, walkTex = {}, walkCols = 0;

    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
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
      const fb = fallbackTex[0];
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

    const B = sprite('facu', BOSS_H, 0.9);
    const P = sprite(heroPre + 'idle', HERO_H, 0.9);

    // Margot (remate de Fase 3): gatea hasta el atril y garabatea el cuadro con crayones (ya no llora)
    const margotFx = createMargotFinish({ T, scene, assets, keep, unit, L, kind: 'crayons' });

    // Atril con el lienzo donde Facu pinta en vivo (se pinta de a poco; Margot le hace garabatos encima)
    const EASEL = { x: 2.0, z: FACU_ARENA.bossZ + 0.9, y: 2.5 };
    const lienzo = document.createElement('canvas'); lienzo.width = 256; lienzo.height = 200;
    const lg = lienzo.getContext('2d');
    const lienzoTex = keep(new T.CanvasTexture(lienzo)); lienzoTex.encoding = T.sRGBEncoding;
    const clearLienzo = () => { lg.fillStyle = '#f6efe2'; lg.fillRect(0, 0, 256, 200); lienzoTex.needsUpdate = true; };
    clearLienzo();
    const woodM = keep(new T.MeshLambertMaterial({ color: L('#8a5a33') }));
    const easel = new T.Group();
    for (const [lx, rz] of [[-0.75, 0.12], [0.75, -0.12]]) { const leg = new T.Mesh(keep(new T.BoxGeometry(0.12, 4.2, 0.12)), woodM); leg.position.set(lx, 2.0, 0); leg.rotation.z = rz; easel.add(leg); }
    const backLeg = new T.Mesh(keep(new T.BoxGeometry(0.1, 4.0, 0.1)), woodM); backLeg.position.set(0, 1.9, -0.6); backLeg.rotation.x = -0.25; easel.add(backLeg);
    const shelf = new T.Mesh(keep(new T.BoxGeometry(1.9, 0.12, 0.3)), woodM); shelf.position.set(0, 1.35, 0.08); easel.add(shelf);
    const canvasMesh = new T.Mesh(keep(new T.BoxGeometry(2.3, 1.8, 0.08)), [woodM, woodM, woodM, woodM, keep(new T.MeshBasicMaterial({ map: lienzoTex })), woodM]);
    canvasMesh.position.set(0, EASEL.y, 0.1); easel.add(canvasMesh);
    easel.position.set(EASEL.x, 0, EASEL.z); easel.rotation.y = -0.35; scene.add(easel);
    let strokeAcc = 0, scribbleAcc = 0, wasCharge = false, wasMargot = false;
    const PAL = ['#e63946', '#2a9df4', '#ffb703', '#2bb673', '#7b2cbf', '#111'];
    function paintStroke() { // pincelada de «arte moderno» de Facu
      lg.globalAlpha = 0.9; lg.fillStyle = lg.strokeStyle = PAL[Math.floor(Math.random() * PAL.length)];
      if (Math.random() < 0.5) { lg.beginPath(); lg.arc(30 + Math.random() * 196, 30 + Math.random() * 140, 10 + Math.random() * 28, 0, 6.283); lg.fill(); }
      else { lg.lineWidth = 8 + Math.random() * 10; lg.lineCap = 'round'; lg.beginPath(); lg.moveTo(Math.random() * 256, Math.random() * 200); lg.lineTo(Math.random() * 256, Math.random() * 200); lg.stroke(); }
      lg.globalAlpha = 1; lienzoTex.needsUpdate = true;
    }
    function crayonScribble() { // garabato de Margot: rulos de crayón
      lg.strokeStyle = ['#ff3b3b', '#2f8bff', '#ffd400', '#28c76f', '#ff4fd8'][Math.floor(Math.random() * 5)];
      lg.lineWidth = 4; lg.lineCap = 'round'; lg.beginPath();
      let px = 40 + Math.random() * 176, py = 40 + Math.random() * 120; lg.moveTo(px, py);
      for (let i = 0; i < 10; i++) { px += (Math.random() - 0.5) * 60; py += (Math.random() - 0.5) * 50; lg.lineTo(px, py); }
      lg.stroke(); lienzoTex.needsUpdate = true;
    }
    function crayonSun() { // y un solcito con carita, la firma de Margot
      lg.fillStyle = '#ffd400'; lg.beginPath(); lg.arc(200, 48, 26, 0, 6.283); lg.fill();
      lg.strokeStyle = '#ffd400'; lg.lineWidth = 4;
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; lg.beginPath(); lg.moveTo(200 + Math.cos(a) * 32, 48 + Math.sin(a) * 32); lg.lineTo(200 + Math.cos(a) * 44, 48 + Math.sin(a) * 44); lg.stroke(); }
      lg.fillStyle = '#222'; lg.fillRect(191, 40, 5, 5); lg.fillRect(205, 40, 5, 5);
      lg.strokeStyle = '#222'; lg.lineWidth = 3; lg.beginPath(); lg.arc(200, 50, 10, 0.2, Math.PI - 0.2); lg.stroke();
      lienzoTex.needsUpdate = true;
    }

    // Pincelazos: mira en el piso + gota en parábola + charcos pegajosos
    const blobG = keep(new T.SphereGeometry(0.42, 14, 10));
    const ringG = keep(new T.RingGeometry(0.85, 1.25, 30));
    const discG = keep(new T.CircleGeometry(1, 24));
    const liveBlobs = new Map(), livePuddles = new Map();
    const colorMats = {};
    const matFor = (hex, kind) => colorMats[hex + kind] || (colorMats[hex + kind] = keep(kind === 'blob'
      ? new T.MeshLambertMaterial({ color: L(hex), emissive: L(hex), emissiveIntensity: 0.25 })
      : new T.MeshBasicMaterial({ color: L(hex), transparent: true, opacity: kind === 'ring' ? 0.8 : 0.85, depthWrite: false, side: T.DoubleSide })));

    // Cuadros voladores: marco dorado con pintura (se reusan las 4 pinturas)
    const goldM = keep(new T.MeshStandardMaterial({ color: L('#e0a82a'), roughness: 0.35, metalness: 0.4 }));
    const frameBoxG = keep(new T.BoxGeometry(1.0, 1.0, 0.16));
    const paintG = keep(new T.PlaneGeometry(0.82, 0.82));
    const goldGlowTex = radial([[0, 'rgba(255,225,120,.95)'], [1, 'rgba(255,225,120,0)']]);
    const liveCars = new Map();
    const buildFrame = (idx, w, h) => {
      const g = new T.Group();
      const box = new T.Mesh(frameBoxG, goldM); box.scale.set(w, h, 1); g.add(box);
      const pt = new T.Mesh(paintG, keep(new T.MeshBasicMaterial({ map: paintTex[idx % 4] }))); pt.scale.set(w, h, 1); pt.position.z = 0.09; g.add(pt);
      return g;
    };
    function makeCar() {
      const root = new T.Group();
      const sh = new T.Mesh(shG, shM); sh.scale.set(2.4, 1, 1.6); sh.position.y = 0.03; sh.renderOrder = 1; root.add(sh);
      const fr = buildFrame(Math.floor(Math.random() * 4), 2.0, 1.6); fr.position.y = 1.3; root.add(fr);
      scene.add(root);
      return { root, fr, isSprite: false, revLights: [] };
    }
    // Minijuego «¿cuál es el verdadero?»: tres cuadros grandes colgados frente a Facu
    const pickObjs = FACU_ARENA.lanes.map((lx, i) => {
      const g = new T.Group(); const fr = buildFrame(i, 2.5, 2.0); fr.position.y = 2.3; g.add(fr);
      const glow = new T.Sprite(keep(new T.SpriteMaterial({ map: goldGlowTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })));
      glow.scale.set(5, 4.2, 1); glow.position.set(0, 2.3, 0.3); glow.visible = false; g.add(glow);
      g.visible = false; scene.add(g);
      return { g, fr, glow };
    });

    // Capa de UI + anticipación y botón de Remate de Margot en Fase 3
    document.querySelector('#arena-ui')?.remove();
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML =
      '<div class="arena-flash"></div>' +
      '<div class="phase-card"><small></small><b></b><span></span></div>' +
      '<div class="pinky-margot-cue hidden"><i class="margot-ico" aria-hidden="true"></i><span></span></div>' +
      '<button type="button" class="margot-btn hidden"><i class="margot-ico" aria-hidden="true"></i><span>' + tr('¡TOCÁ: MARGOT LE PINTA EL CUADRO!') + '</span></button>';
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
      name: 'FACU «EL CEREBRO»',
      line1: '¿Creían que el cerebro era Pinky? ¡El cheque lo firmé yo!',
      line2: '¡Bienvenidos a mi galería! Hoy pinto en vivo… ¡y ustedes son el lienzo!',
      quick: !!game.probar,
      onSkip() { if (phase === 'entrance') phaseT = bossIntro.dur; }
    });

    const CARDS = {
      1: ['FASE 1 · 🎨', '¡OBRA EN VIVO!', 'Salí de la mira y pegale cuando se pone a pintar'],
      2: ['FASE 2 · 🔍', '¿CUÁL ES EL VERDADERO?', 'Mirá bien y pegale al cuadro verdadero'],
      3: ['FASE 3 · 😡', '¡FACU SE ENOJÓ!', '¡Tocá a Margot: le pinta el cuadro con crayones!']
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
    const setBarName = () => { if (barName) barName.textContent = tr('FACU «EL CEREBRO»') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3'; };
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

    let x = 0, z = -1.2, y = 0, vy = 0, t = 0;
    let phase = 'entrance', phaseT = 0, closing = false, disposed = false;
    let dashT = 0, dashCd = 0, dashX = 1, dashZ = 0, hurtT = 0, inv = 0, powT = 0, holdT = 0;
    let swing = null, swingT = 0, swingHit = false, comboStep = 0, comboWindow = 0, buffer = 0, stepT = 0;
    let shakeT = 0, shakeA = 0, freezeT = 0, bossFlash = 0, moving = false, heroPose = 'idle', bossKey = 'facu';
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
      const text = voice.say('facu', ev);
      if (!text) return;
      if (lastSpeech) { lastSpeech.e.remove(); const i = pops.indexOf(lastSpeech); if (i >= 0) pops.splice(i, 1); }
      lastSpeech = pop(logic.state.bossX, BOSS_H + 0.6, FACU_ARENA.bossZ, text, '#ffe066', 17, 2.4);
    };

    const billG = keep(new T.BoxGeometry(0.32, 0.04, 0.18));
    const sparks = [];
    function burst(px, py, pz, hex, count = 8, isBill = false) {
      const m = keep(new T.MeshBasicMaterial({ color: L(hex) }));
      for (let i = 0; i < count; i++) {
        const p = new T.Mesh(billG, m);
        p.position.set(px, py, pz);
        if (!isBill) p.scale.set(0.65, 3.5, 1.1);
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const spd = 2.6 + Math.random() * 4.2;
        scene.add(p);
        sparks.push({ p, vx: Math.cos(ang) * spd, vy: (isBill ? 3.2 : 2.6) + Math.random() * 3.2, vz: Math.sin(ang) * spd, t: 0, life: isBill ? 0.85 : 0.48, bill: isBill });
      }
    }

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'carWarn': sfx('tick'); break;
          case 'carGo': sfx('honk'); break;
          case 'charging':
            pop(0, BOSS_H + 0.2, FACU_ARENA.bossZ, '🎨 ¡SE PUSO A PINTAR! ¡PEGALE!', '#9bf7c4', 20, 1.4);
            break;
          case 'guarded':
            sfx('tick');
            pop(e.x, 3.0, FACU_ARENA.bossZ, '¡ESPERÁ QUE SE PONGA A PINTAR!', '#ffe066', 19, 1.0);
            break;
          case 'aim': sfx('tick'); break;
          case 'frameLift': sfx('tick'); break;
          case 'blobGo': sfx('swing'); break;
          case 'splat':
            sfx('hit'); shake(0.12, 0.12);
            burst(e.x, 0.4, e.z, e.color, 8, false);
            break;
          case 'meleeHit':
            addPts(FACU_ARENA.points.melee, e.x, 2.8, FACU_ARENA.bossZ); charge(POWER.hit);
            sfx('hit'); shake(0.28, 0.18); freezeT = 0.05;
            burst(e.x, 2.3, FACU_ARENA.bossZ + 0.4, '#ffd36e', 10, true);
            break;
          case 'dodge':
            addPts(FACU_ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge * 1.4); sfx('pickup');
            pop(x, 3.4, z, '¡JUSTO!', '#9bf7c4', 20);
            break;
          case 'margotReady':
            sfx('pickup');
            pop(x, 3.6, z, '👶 ¡MARGOT ESTÁ LISTA!', '#ff99cc', 24, 1.4);
            break;
          case 'margotArt':
            addPts(FACU_ARENA.points.margot, 0, 3.5, -5);
            sfx('power'); flash('#ffd400', 0.32); shake(0.3, 0.3);
            pop(EASEL.x, 3.4, EASEL.z, '👶🖍️ ¡GARABATOS!', '#ffd400', 26, 1.0);
            setTimeout(() => {
              if (disposed) return;
              sfx('fanfare');
              pop(logic.state.bossX, BOSS_H + 0.9, FACU_ARENA.bossZ, '😍 ¡ES UNA OBRA MAESTRA!', '#ff8fc8', 30, 1.8);
            }, 1100);
            break;
          case 'pickStage': {
            sfx('tick');
            const msg = { show: '¡MIRÁ EL VERDADERO!', shuffle: '¡SEGUILO!', choose: '¡PEGALE AL VERDADERO!' }[e.stage];
            if (msg) pop(0, 5.0, FACU_ARENA.pickZ, msg, e.stage === 'choose' ? '#9bf7c4' : '#ffe066', 22, e.stage === 'show' ? 1.5 : 1.2);
            break;
          }
          case 'pickRight':
            addPts(FACU_ARENA.points.pick, e.x, 3.2, FACU_ARENA.pickZ); charge(POWER.hit * 1.5);
            sfx('hit'); shake(0.3, 0.2); freezeT = 0.06;
            burst(e.x, 2.6, FACU_ARENA.pickZ + 0.4, '#ffd36e', 12, true);
            pop(e.x, 4.0, FACU_ARENA.pickZ, '¡ESE ERA! 🖼️💥', '#9bf7c4', 24, 1.3);
            break;
          case 'pickWrong':
            sfx('hurt'); shake(0.25, 0.2);
            burst(e.x, 2.4, FACU_ARENA.pickZ + 0.4, '#ff5fa2', 12, false);
            pop(e.x, 4.0, FACU_ARENA.pickZ, '¡ERA FALSO! 🎨', '#ff8fbf', 24, 1.3);
            break;
          case 'pickTimeout':
            sfx('tick'); pop(0, 4.2, FACU_ARENA.pickZ, '¡TARDE!', '#ffb3a0', 22, 1.0);
            break;
          case 'bossHit': bossFlash = 0.22; setBar(); sfx('hit'); shake(0.28, 0.2); break;
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1); hurtT = HURT_POSE; inv = INV;
            if (e.penalty) { game.score.addPenalty(e.penalty); pop(x, 2.6, z, '-$' + e.penalty, '#ff8080', 22); }
            game.score.takeDamage(); game.combo?.reset?.();
            sfx('hurt'); flash('#ff3b52', 0.45); shake(0.38, 0.3);
            if (hero.hp <= 0 && !extraLifeUsed && phase === 'fight') {
              extraLifeUsed = true;
              hero.hp = Math.max(2, Math.ceil((hero.hpMax || 5) * 0.6));
              inv = 1.8; hurtT = 0.15;
              logic.state.cars.length = 0; logic.state.blobs.length = 0;
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
            burst(logic.state.bossX, 2.6, FACU_ARENA.bossZ + 0.4, '#ffd36e', 18, true);
            pop(logic.state.bossX, BOSS_H * 0.7, FACU_ARENA.bossZ, '¡K.O.! +' + (game.score.total - before), '#ffe066', 32, 1.6);
            pop(logic.state.bossX, BOSS_H * 0.45, FACU_ARENA.bossZ, '¡FACU SE RINDE ANTE EL ARTE!', '#9fe4ff', 22, 2.4);
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
          const sticky = y <= 0.05 && logic.inPaint(x, z) ? 0.45 : 1; // la pintura pegajosa frena
          const slow = (swing ? 0.35 : 1) * sticky;
          vx = mx / len * MOVE * slow; vz = mz / len * MOVE * slow;
          moving = Math.hypot(mx, mz) > 0.15;
        }
        x = Math.max(-FACU_ARENA.xMax + 0.45, Math.min(FACU_ARENA.xMax - 0.45, x + vx * dt));
        z = Math.max(FACU_ARENA.zFar, Math.min(FACU_ARENA.zNear, z + vz * dt));

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
        setTimeout(() => { if (!disposed) phaseCard(curPhase, 1.9); }, 1100);
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
      if (S.hp !== lastBarHp || S.phase !== lastBarPhase) {
        lastBarHp = S.hp; lastBarPhase = S.phase; setBar(); setBarName();
      }
      shakeT = Math.max(0, shakeT - dt); if (shakeT <= 0) shakeA = 0;
      const sh = shakeA * Math.min(1, shakeT * 4);
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      // Entrada propia de Pinky: contrapicado dramático desde el piso mirando hacia arriba al jefe final
      cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.55 : 0.3) + (Math.random() - 0.5) * sh, CAM.y - e * 3.8 + (Math.random() - 0.5) * sh, z + CAM.back - e * 3.2);
      cam.lookAt(0, CAM.lookY + e * 1.6, FACU_ARENA.bossZ);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();

      // Facu: usa `arena_facu_<pose>` si ya está el dibujo; si no, el de presentador animado por código.
      // Siempre hay gesto: se echa para atrás al apuntar (windup) y se tira para adelante al soltar.
      B.userData.prevX = S.bossX;
      const own = assets.has('arena_facu_' + S.pose);
      const presenting = S.pose === 'reveal' || (S.mode === 'pick' && S.pose !== 'hurt');
      bossKey = own ? 'arena_facu_' + S.pose : (presenting && assets.has('arena_facu_reveal') ? 'arena_facu_reveal' : (!own && assets.has('arena_facu_idle') && S.pose === 'idle' ? 'arena_facu_idle' : 'facu'));
      let sx = 1, sy = 1, by = 0, rz = 0;
      const w = S.windup || 0, ease = w * w * (3 - 2 * w);
      const toward = (S.blobs[0]?.tx ?? S.bossX) < S.bossX ? -1 : 1;
      if (S.pose === 'reveal') { by = Math.abs(Math.sin(t * 5)) * 0.18; sy = 1 + Math.sin(t * 10) * 0.03; rz = Math.sin(t * 5) * 0.05; }
      else if (S.pose === 'aim' || S.pose === 'windup') {
        // carga el brazo: se echa para atrás, se estira y tiembla justo antes de soltar
        sx = toward; rz = toward * 0.22 * ease + (w > 0.75 ? Math.sin(t * 60) * 0.025 : 0); sy = 1 + 0.06 * ease; by = 0.15 * ease;
      } else if (S.pose === 'throw') { sx = toward; rz = -toward * 0.2; sy = 0.93; sx *= 1.06; by = 0.05; }
      else if (S.pose === 'paint') {
        // de espaldas al público, pinceleando en el atril
        sx = -1; rz = Math.sin(t * 9) * 0.06; by = Math.abs(Math.sin(t * 9)) * 0.06;
      }
      else if (S.pose === 'hurt') { rz = 0.2; sy = 0.9; sx = 1.06; by = 0.08; }
      else if (S.pose === 'love') { by = 0.25 + Math.abs(Math.sin(t * 6)) * 0.25; rz = Math.sin(t * 4) * 0.12; sy = 1 + Math.sin(t * 8) * 0.05; }
      else if (S.pose === 'ko') { sy = own ? 1 : 0.7; rz = Math.sin(t * 2) * 0.03; }
      else { by = Math.abs(Math.sin(t * 2.6)) * 0.08; sy = 1 + Math.sin(t * 5.2) * 0.02; } // idle: respira y se pasea
      if (own) { sy = 1 + (sy - 1) * 0.5; rz *= 0.5; } // con el dibujo real alcanza con un gesto chico
      if (S.angry && S.pose !== 'ko' && S.pose !== 'love') { sx += Math.sign(sx) * Math.sin(t * 38) * 0.012; rz += Math.sin(t * 31) * 0.02; }
      setTex(B, bossKey, S.pose);
      place(B, S.bossX, by, FACU_ARENA.bossZ);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1); B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      const rage = S.angry && S.pose !== 'ko' && S.pose !== 'love' ? 0.7 + 0.1 * Math.sin(t * 9) : 1;
      B.material.color.setRGB(1, bossFlash > 0 ? 0.55 : rage, bossFlash > 0 ? 0.55 : rage);
      // Aro verde cuando está distraído pintando (invita a correr y pegarle)
      chargeRing.visible = S.mode === 'charge' && S.pose !== 'love';
      if (chargeRing.visible) {
        chargeRing.position.set(S.bossX, 0.04, FACU_ARENA.meleeZ);
        chargeRing.scale.setScalar(1 + Math.sin(t * 12) * 0.12);
      }

      // Atril: el cuadro avanza mientras pinta; en el remate Margot lo llena de garabatos y un solcito
      const charging = S.mode === 'charge' && S.pose === 'paint';
      if (charging && !wasCharge) clearLienzo();
      wasCharge = charging;
      if (charging) { strokeAcc += dt; if (strokeAcc > 0.22) { strokeAcc = 0; paintStroke(); } }
      const margotOn = S.margotT > 0;
      if (margotOn && !wasMargot) { scribbleAcc = -0.6; }
      if (margotOn) { scribbleAcc += dt; if (scribbleAcc > 0.12) { scribbleAcc = 0; crayonScribble(); } }
      if (!margotOn && wasMargot) crayonSun();
      wasMargot = margotOn;
      canvasMesh.rotation.z = margotOn ? Math.sin(t * 20) * 0.03 : 0;

      // Pincelazos: mira que late en el piso → gota en parábola desde la mano de Facu
      const blobIds = new Set();
      for (const bl of S.blobs) {
        blobIds.add(bl.id);
        let o = liveBlobs.get(bl.id);
        if (!o) {
          o = { ring: new T.Mesh(ringG, matFor(bl.color, 'ring')), ball: new T.Mesh(blobG, matFor(bl.color, 'blob')) };
          o.ring.rotation.x = -Math.PI / 2; scene.add(o.ring); scene.add(o.ball); liveBlobs.set(bl.id, o);
        }
        const k2 = bl.stage === 'aim' ? bl.t / bl.dur : 1;
        o.ring.position.set(bl.tx, 0.04, bl.tz);
        o.ring.scale.setScalar(bl.stage === 'aim' ? 1.6 - 0.6 * k2 : 1 + Math.sin(t * 30) * 0.06);
        o.ring.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(t * (bl.stage === 'aim' ? 10 : 24)));
        if (bl.stage === 'aim') {
          o.ball.visible = true; o.ball.scale.setScalar(0.5 + k2 * 0.5);
          o.ball.position.set(S.bossX + toward * 0.9, BOSS_H * 0.72 + k2 * 0.4, FACU_ARENA.bossZ + 0.6);
        } else {
          const f = Math.min(1, bl.t / FACU_ARENA.blobFly);
          o.ball.visible = true; o.ball.scale.set(1, 1 + f * 0.4, 1);
          o.ball.position.set(bl.x0 + (bl.tx - bl.x0) * f, BOSS_H * 0.8 * (1 - f) + Math.sin(f * Math.PI) * 4.2 + 0.3, bl.z0 + (bl.tz - bl.z0) * f);
        }
      }
      for (const [id, o] of liveBlobs) if (!blobIds.has(id)) { scene.remove(o.ring); scene.remove(o.ball); liveBlobs.delete(id); }
      const pudIds = new Set();
      for (const pd of S.puddles) {
        pudIds.add(pd.id);
        let m = livePuddles.get(pd.id);
        if (!m) { m = new T.Mesh(discG, keep(matFor(pd.color, 'pud').clone())); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6; scene.add(m); livePuddles.set(pd.id, m); }
        m.position.set(pd.x, 0.03, pd.z);
        const grow = Math.min(1, (FACU_ARENA.puddleLife - pd.life) * 8);
        m.scale.set(FACU_ARENA.puddleR * grow, FACU_ARENA.puddleR * 0.8 * grow, 1);
        m.material.opacity = Math.min(0.85, pd.life * 0.9);
      }
      for (const [id, m] of livePuddles) if (!pudIds.has(id)) { scene.remove(m); livePuddles.delete(id); }

      // Anticipación + botón + Margot siempre visible al costado derecho hasta que va al atril en Fase 3
      const showBtn = S.margotReady && phase === 'fight';
      const showCue = !showBtn && phase === 'fight' && S.phase !== 'ko' &&
        ((S.phase === 2 && S.hp <= FACU_ARENA.p3At + 4) || (S.phase === 3 && S.mode === 'transition'));
      margotCue.classList.toggle('hidden', !showCue);
      margotBtn.classList.toggle('hidden', !showBtn);
      margotFx.draw(dt, t, S.margotT, 2.2, { x: S.bossX, z: FACU_ARENA.bossZ, h: BOSS_H }, { x: -FACU_ARENA.xMax + 0.5, z: FACU_ARENA.bossZ + 1.5 }, EASEL);

      // Avisos en los 3 cajones + autos asomando cola con luces de reversa parpadeando en `warn`
      const warned = new Set();
      const carIds = new Set();
      const blinkOn = Math.floor(t * 14) % 2 === 0;
      for (const c of S.cars) {
        carIds.add(c.id);
        if (c.stage === 'warn') warned.add(c.lane);
        let obj = liveCars.get(c.id);
        if (!obj) { obj = makeCar(); liveCars.set(c.id, obj); }
        obj.root.visible = true;
        const cz = c.stage === 'warn' ? (FACU_ARENA.bossZ + 0.3 + Math.sin(t * 45) * 0.06) : c.z;
        const cy = c.stage === 'warn' ? Math.abs(Math.sin(t * 36)) * 0.05 : 0;
        if (obj.isSprite) place(obj.root, c.x, cy, cz);
        else obj.root.position.set(c.x, cy, cz);
        if (obj.fr) { obj.fr.rotation.z = Math.sin(t * (c.stage === 'drive' ? 11 : 30) + c.id) * (c.stage === 'drive' ? 0.18 : 0.04); obj.fr.position.y = 1.3 + (c.stage === 'drive' ? Math.abs(Math.sin(t * 7 + c.id)) * 0.3 : 0); }
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

      // Minijuego: tres cuadros colgados; el verdadero brilla solo cuando se muestra (y al revelarlo)
      const PK = S.mode === 'pick' ? S.pick : null;
      for (let i = 0; i < pickObjs.length; i++) {
        const o = pickObjs[i], f = PK ? PK.frames[i] : null;
        o.g.visible = !!f;
        if (!f) continue;
        o.g.position.set(f.x, 0, FACU_ARENA.pickZ);
        const reveal = f.real && (PK.stage === 'show' || (PK.stage === 'result' && PK.picked !== undefined));
        o.glow.visible = reveal;
        if (reveal) o.glow.material.opacity = 0.6 + 0.35 * Math.sin(t * 14);
        o.fr.position.y = 2.3 + (PK.stage === 'shuffle' ? Math.sin(t * 20 + i * 2) * 0.07 : Math.sin(t * 3 + i) * 0.05);
        const wrongPicked = PK.stage === 'result' && PK.picked === f.id && !f.real;
        o.fr.rotation.z = wrongPicked ? 0.45 : (PK.stage === 'shuffle' ? Math.sin(t * 16 + i) * 0.07 : 0);
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

      // Billetes verdes volando y chispas del Grito de Margot
      for (let i = sparks.length - 1; i >= 0; i--) {
        const q = sparks[i]; q.t += dt;
        if (q.t >= q.life) { scene.remove(q.p); sparks.splice(i, 1); continue; }
        q.vy -= (q.bill ? 5.5 : 13) * dt;
        q.p.position.x += (q.vx + (q.bill ? Math.sin(t * 10 + i) * 1.1 : 0)) * dt;
        q.p.position.y = Math.max(0.08, q.p.position.y + q.vy * dt);
        q.p.position.z += q.vz * dt;
        q.p.rotation.x += dt * (q.bill ? 6 : 10);
        q.p.rotation.y += dt * (q.bill ? 9 : 8);
        if (!q.bill) q.p.scale.setScalar(Math.max(0.01, 1 - q.t / q.life));
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
    game.state = 'arena-facu';
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
