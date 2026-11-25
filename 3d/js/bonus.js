// MINI NIVEL «¡ROMPÉ EL BYD!»: después de la persecución (nivel 1). El BYD de Cepi se quedó sin batería
// y Cepi corre a enchufarlo al cargador: hay que hacerlo bolsa a trompadas ANTES de que se cargue.
// Escena propia (como la arena): héroe de espaldas, el auto de atrás, cámara detrás. Un punto brilla en el
// auto (farol izquierdo, rayo del medio o farol derecho): pegarle parado frente a ese punto vale triple.
// A la derecha está el cargador con Cepi: si le pegás a Cepi, lo desenchufás un rato (la carga se frena).
// Si la batería llega a 100 %, Cepi se escapa: perdés un corazón y se vuelve a intentar.
// Sin carteles de instrucciones: la batería, la barra del auto y las frases de Cepi.
// (los golpes SWINGS llegan de hero.js por parámetro: así la lógica se prueba en node sin Three.js)
import { fillText, tr } from './i18n.js';
import { bydCanvasWithMargot } from './byd_margot.js';

export const BONUS = {
  charge: 16,          // s que tarda en cargarse del todo si nadie lo molesta
  hp: 54,
  spotMult: 3,         // golpe frente al punto que brilla
  spotR: 0.75,         // m de tolerancia para estar «frente al punto»
  cepiR: 0.9,          // m de tolerancia para pegarle a Cepi en el cargador
  stun: 2.4,           // s que Cepi queda desenchufado después de un golpe
  unplug: 6,           // % de carga que se pierde con cada golpe a Cepi
  powerDmg: 14,
  points: { hit: 20, spot: 60, cepi: 80, wreck: 1500, perPercent: 15 },
  move: 6
};
// Puntos del dibujo (px de chase_cepi_drive, 396×384): farol izquierdo, rayo, farol derecho
const SPOTS = [{ u: 100, v: 182 }, { u: 222, v: 210 }, { u: 334, v: 182 }];
const CAR_H = 3.6, HERO_H = 2.0, CAR_Z = -1.6, HERO_Z = 1.5, CEPI_H = 2.3;
const LINES = ['¡Mi BYD no!', '¡Lo tengo en cuotas!', '¡Es eléctrico, papá!', '¡Ya casi carga!', '¡Te voy a acusar con mamá!', '¡Ni lo terminé de pagar!', '¡Cargá, cargá, cargá!'];

// Lógica pura (sin Three.js ni DOM): se prueba con node --test
// bat: % de carga del BYD (0 → 100). cepiStun: s que le quedan a Cepi desenchufado.
export function createBonusLogic({ rand = Math.random } = {}) {
  const st = { hp: BONUS.hp, bat: 0, t: 0, spot: 1, over: false, wrecked: false, charged: false, stage: 0, hits: 0, cepiStun: 0, cepiHits: 0 };
  const stageOf = () => (st.hp <= 0 ? 4 : st.hp <= BONUS.hp * 0.25 ? 3 : st.hp <= BONUS.hp * 0.5 ? 2 : st.hp <= BONUS.hp * 0.75 ? 1 : 0);
  function nextSpot() { let n = st.spot; while (n === st.spot) n = Math.floor(rand() * SPOTS.length); st.spot = n; }
  function damage(dmg, evs) {
    if (st.over) return;
    st.hp = Math.max(0, st.hp - dmg);
    const s = stageOf();
    if (s > st.stage) { st.stage = s; evs.push({ type: 'stage', stage: s }); }
    if (st.hp <= 0) { st.over = true; st.wrecked = true; evs.push({ type: 'wreck', batLeft: 100 - st.bat }); }
  }
  return {
    get state() { return st; },
    get plugged() { return !st.over && st.cepiStun <= 0; },
    // x: distancia lateral del héroe al centro del auto; spotX(i): x del punto i; cepiX: x de Cepi (opcional)
    punch({ x, dmg, spotX, cepiX = null }) {
      const evs = [];
      if (st.over) return evs;
      if (cepiX != null && Math.abs(x - cepiX) < BONUS.cepiR) {
        st.hits++; st.cepiHits++;
        const was = st.cepiStun > 0;
        st.cepiStun = BONUS.stun;
        st.bat = Math.max(0, st.bat - BONUS.unplug);
        evs.push({ type: 'cepi', unplugged: !was });
        return evs;
      }
      const onSpot = Math.abs(x - spotX(st.spot)) < BONUS.spotR;
      const d = dmg * (onSpot ? BONUS.spotMult : 1);
      st.hits++;
      evs.push({ type: 'hit', dmg: d, spot: onSpot ? st.spot : -1 });
      if (onSpot) nextSpot();
      damage(d, evs);
      return evs;
    },
    power() { const evs = []; if (!st.over) { evs.push({ type: 'hit', dmg: BONUS.powerDmg, spot: -1, power: true }); st.cepiStun = Math.max(st.cepiStun, 1.2); damage(BONUS.powerDmg, evs); } return evs; },
    update(dt) {
      const evs = [];
      if (st.over) return evs;
      st.t += dt;
      if (st.cepiStun > 0) {
        st.cepiStun = Math.max(0, st.cepiStun - dt);
        if (st.cepiStun <= 0) evs.push({ type: 'replug' });
      } else st.bat = Math.min(100, st.bat + dt * 100 / BONUS.charge);
      if (st.bat >= 100) { st.over = true; st.charged = true; evs.push({ type: 'charged' }); }
      return evs;
    }
  };
}

export function createBonus({ game, input, audio, assets, renderer, updateHud, pause, POWER, SWINGS, onEnd, onFail }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createBonusLogic();
    const own = [], keep = (o) => (own.push(o), o);
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
    scene.background = L('#2b3f8f');
    scene.add(new T.HemisphereLight(0xfff0dc, 0x5c4a7a, 1.0));
    const canvasTex = (w, h, draw) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = keep(new T.CanvasTexture(c)); t.encoding = T.sRGBEncoding; return t;
    };
    const mk = (geo, mat) => { const m = new T.Mesh(keep(geo), keep(mat)); scene.add(m); return m; };
    // Cielo de atardecer y la calle porteña pintada al fondo
    const sky = mk(new T.PlaneGeometry(80, 30), new T.MeshBasicMaterial({ map: canvasTex(8, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b3f8f'); gr.addColorStop(0.6, '#e0768a'); gr.addColorStop(1, '#ffb36b');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }), fog: false }));
    sky.position.set(0, 10, -20);
    const bgStreet = assets.has('calle_buenos_aires') ? 'calle_buenos_aires' : null;
    if (bgStreet) {
      const m = assets.meta(bgStreet), H = 9.3, W = H * m.w / m.h;
      for (const dx of [-W, 0, W]) {
        const f = mk(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: assets.texture(bgStreet) }));
        f.position.set(dx, H / 2, -9);
      }
    }
    // Asfalto con senda peatonal y vereda
    const road = mk(new T.PlaneGeometry(40, 14), new T.MeshLambertMaterial({ map: canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = '#3a3640'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = '#e9e4d8'; for (let x = 8; x < w; x += 26) g.fillRect(x, h * 0.62, 14, h * 0.3); // senda peatonal
    }) }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -1);
    const curb = mk(new T.BoxGeometry(40, 0.25, 1.6), new T.MeshLambertMaterial({ color: L('#8f8c93') }));
    curb.position.set(0, 0.12, -7.4);

    // El auto: textura propia sobre la que se dibujan los daños (Margot está afuera a salvo, nunca adentro al romperlo)
    const img = assets.texture('chase_cepi_drive').image, meta = assets.meta('chase_cepi_drive');
    const carCanvas = document.createElement('canvas'); carCanvas.width = meta.w; carCanvas.height = meta.h;
    const cg = carCanvas.getContext('2d'); cg.drawImage(img, 0, 0, meta.w, meta.h);
    const carTex = keep(new T.CanvasTexture(carCanvas)); carTex.encoding = T.sRGBEncoding;
    const carW = CAR_H * meta.w / meta.h;
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);
    const carMat = keep(new T.MeshBasicMaterial({ map: carTex, alphaTest: 0.4, transparent: true }));
    const car = new T.Mesh(unit, carMat); car.scale.set(carW, CAR_H, 1); car.position.set(0, 0, CAR_Z); scene.add(car);
    const deadTex = assets.has('chase_cepi_dead') ? assets.texture('chase_cepi_dead') : null;
    const deadMeta = deadTex ? assets.meta('chase_cepi_dead') : null;
    // El cargador (a la derecha del auto) con Cepi enchufándolo: se le puede pegar para desenchufarlo
    const chargerX = carW / 2 + 2.2, cepiX = carW / 2 + 1.25;
    // Margot a salvo afuera del auto, pero del lado de Cepi (detrás del cargador a la derecha)
    let margotM = null, margotCell = -1;
    const MARGOT_H = 1.55, margotX = chargerX + 0.78;
    if (assets.has('margot_sheet')) {
      const mm = assets.meta('margot_sheet');
      const tx = keep(assets.texture('margot_sheet').clone());
      tx.needsUpdate = true;
      tx.repeat.set(1 / (mm.cols || 2), 1 / (mm.rows || 2));
      margotM = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ map: tx, alphaTest: 0.42, transparent: true, side: T.DoubleSide })));
      margotM.userData.cols = mm.cols || 2;
      margotM.userData.rows = mm.rows || 2;
      margotM.scale.set(MARGOT_H, MARGOT_H, 1);
      margotM.position.set(margotX, 0, CAR_Z + 0.45);
      scene.add(margotM);
    }
    const setMargot = (cell) => {
      if (!margotM || margotCell === cell) return;
      margotCell = cell;
      const c = margotM.userData.cols, r = margotM.userData.rows;
      margotM.material.map.offset.set((cell % c) / c, (r - 1 - Math.floor(cell / c)) / r);
    };
    setMargot(2);
    const spotX = (i) => (SPOTS[i].u / meta.w - 0.5) * carW;
    const spotY = (i) => (1 - SPOTS[i].v / meta.h) * CAR_H;
    const post = mk(new T.BoxGeometry(0.55, 1.9, 0.45), new T.MeshLambertMaterial({ color: L('#e9edf2') }));
    post.position.set(chargerX, 0.95, CAR_Z + 0.2);
    const screen = mk(new T.PlaneGeometry(0.36, 0.42), new T.MeshBasicMaterial({ color: L('#2fd36b') }));
    screen.position.set(chargerX, 1.45, CAR_Z + 0.43);
    const cable = mk(new T.CylinderGeometry(0.045, 0.045, 1, 6), new T.MeshLambertMaterial({ color: L('#1d1d22') }));
    const cableFrom = new T.Vector3(chargerX - 0.2, 0.72, CAR_Z - 0.1), cableTo = new T.Vector3(carW / 2 - 0.15, 0.88, CAR_Z - 0.1);
    function cableAt(to) {
      const d = new T.Vector3().subVectors(to, cableFrom);
      cable.scale.set(1, d.length(), 1);
      cable.position.copy(cableFrom).addScaledVector(d, 0.5);
      cable.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    }
    cableAt(cableTo);
    const cepiHas = assets.has('cepi_actions_sheet');
    const cepiTex = cepiHas ? keep(assets.texture('cepi_actions_sheet').clone()) : null;
    if (cepiTex) { cepiTex.needsUpdate = true; cepiTex.repeat.set(1 / 4, 1); }
    const cepiMat = keep(new T.MeshBasicMaterial({ map: cepiTex, alphaTest: 0.45, transparent: true, side: T.DoubleSide, visible: cepiHas }));
    const cepiM = new T.Mesh(unit, cepiMat); scene.add(cepiM);
    const cm = cepiHas ? assets.meta('cepi_actions_sheet') : { w: 4, h: 1 };
    const cepiAsp = (cm.w / 4) / cm.h;
    let cepiCell = -1;
    const setCepi = (cell) => { if (cell === cepiCell || !cepiTex) return; cepiCell = cell; cepiTex.offset.set(cell / 4, 0); };
    setCepi(0);
    // Sombra del auto y del héroe
    const shTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 1, 32, 32, 32); r.addColorStop(0, 'rgba(10,6,20,.6)'); r.addColorStop(1, 'rgba(10,6,20,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
    const shGeo = keep(new T.PlaneGeometry(1, 1)); shGeo.rotateX(-Math.PI / 2);
    const shMat = keep(new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
    const carSh = new T.Mesh(shGeo, shMat); carSh.scale.set(carW * 1.05, 1, 1.6); carSh.position.set(0, 0.02, CAR_Z + 0.1); scene.add(carSh);
    // Punto que brilla (anillo dorado que late sobre el auto)
    const glow = new T.Sprite(keep(new T.SpriteMaterial({ map: canvasTex(64, 64, (g) => {
      const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(255,240,150,1)'); r.addColorStop(0.4, 'rgba(255,190,40,.7)'); r.addColorStop(1, 'rgba(255,150,30,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    }), blending: T.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false })));
    glow.renderOrder = 5; scene.add(glow);
    // Héroe de espaldas
    const heroMat = keep(new T.MeshBasicMaterial({ alphaTest: 0.45, transparent: true }));
    const P = new T.Mesh(unit, heroMat); scene.add(P);
    const heroSh = new T.Mesh(shGeo, shMat); heroSh.scale.set(1.5, 1, 0.7); scene.add(heroSh);
    let heroKey = null, stepT = 0;
    const setHero = (pose) => {
      const key = heroPre + pose;
      if (key === heroKey || !assets.has(key)) return;
      heroKey = key; heroMat.map = assets.texture(key); heroMat.needsUpdate = true;
      const m = assets.meta(key); P.scale.set(HERO_H * m.w / m.h, HERO_H, 1);
    };
    setHero('idle');

    // Carteles propios: reloj, objetivo claro, fogonazo y textos que flotan
    const ui = document.createElement('div'); ui.id = 'bonus-ui';
    ui.innerHTML = '<div class="bonus-flash"></div><div class="bonus-clock"><small>' + tr('CARGA DEL BYD') + '</small><b>⚡0%</b></div><div class="bonus-goal hidden"></div>';
    document.body.append(ui); document.body.classList.add('arena-on', 'bonus-on');
    const flashE = ui.querySelector('.bonus-flash'), clockE = ui.querySelector('.bonus-clock b'), goalE = ui.querySelector('.bonus-goal');
    let goalKey = '';
    const bar = document.querySelector('#boss-bar'), fill = document.querySelector('#boss-fill');
    if (bar) { bar.querySelector('span').textContent = tr('EL BYD DE CEPI'); bar.classList.remove('hidden'); }
    const setBar = () => { if (fill) fill.style.width = (100 * logic.state.hp / BONUS.hp).toFixed(1) + '%'; };
    setBar();
    const pops = [], scratch = new T.Vector3();
    const pop = (x, y, z, txt, col = '#ffd36e', size = 22, life = 1.0) => {
      const e = document.createElement('div'); e.className = 'pop'; fillText(e, txt); e.style.color = col; e.style.fontSize = size + 'px';
      ui.append(e); pops.push({ e, v: new T.Vector3(x, y, z), t: 0, life, w: e.offsetWidth, vx: (Math.random() - 0.5) * 1.5 });
    };
    const sfx = (n) => { try { audio.sfx(n); } catch (_) {} };
    let flashTimer = 0;
    const flash = (col, op = 0.4) => { flashE.style.background = col; flashE.style.opacity = String(op); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashE.style.opacity = '0'; }, 90); };

    // ---- daños dibujados sobre el auto ----
    const toPx = (wx, wy) => ({ x: (wx / carW + 0.5) * meta.w, y: (1 - wy / CAR_H) * meta.h });
    function crack(px, py, n = 5, len = 40) {
      cg.save();
      cg.globalCompositeOperation = 'source-atop'; // solo sobre el auto, no en el aire
      for (let i = 0; i < n; i++) {
        let x = px, y = py, a = Math.random() * Math.PI * 2;
        cg.beginPath(); cg.moveTo(x, y);
        const segs = 3 + (Math.random() * 3 | 0);
        for (let s = 0; s < segs; s++) { a += (Math.random() - 0.5) * 0.9; x += Math.cos(a) * len / segs * (0.6 + Math.random()); y += Math.sin(a) * len / segs * (0.6 + Math.random()); cg.lineTo(x, y); }
        cg.strokeStyle = 'rgba(30,25,35,.85)'; cg.lineWidth = 1.6; cg.stroke();
        cg.strokeStyle = 'rgba(255,255,255,.55)'; cg.lineWidth = 0.7; cg.stroke();
      }
      cg.restore();
    }
    function dent(px, py, r = 16) {
      cg.save(); cg.globalCompositeOperation = 'source-atop';
      const g = cg.createRadialGradient(px - r * 0.3, py - r * 0.3, 1, px, py, r);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.45, 'rgba(60,50,70,.45)'); g.addColorStop(1, 'rgba(60,50,70,0)');
      cg.fillStyle = g; cg.beginPath(); cg.arc(px, py, r, 0, Math.PI * 2); cg.fill(); cg.restore();
    }
    function smash(i) { // farol o rayo roto: mancha oscura con vidrio rajado
      const s = SPOTS[i];
      cg.save(); cg.globalCompositeOperation = 'source-atop';
      cg.fillStyle = 'rgba(25,18,28,.8)'; cg.beginPath(); cg.ellipse(s.u, s.v, i === 1 ? 22 : 48, i === 1 ? 22 : 14, 0, 0, Math.PI * 2); cg.fill();
      cg.restore();
      crack(s.u, s.v, 7, 46);
    }
    const broken = new Set();
    function onStage(stage) {
      if (stage === 1) { crack(meta.w * 0.5, meta.h * 0.24, 9, 70); sfx('crate'); } // luneta rajada
      if (stage === 2) { smash(0); broken.add(0); sfx('crate'); }
      if (stage === 3) { smash(2); broken.add(2); smash(1); broken.add(1); dent(meta.w * 0.5, meta.h * 0.78, 30); sfx('crate'); }
      carTex.needsUpdate = true;
    }

    let x = 0, t = 0, phase = 'intro', phaseT = 0, ended = false, closing = false;
    let swing = null, swingT = 0, swingHit = false, combo = 0, comboWindow = 0, buffer = 0, holdT = 0;
    let shakeT = 0, carKick = 0, carTilt = 0, lineCd = 1.5, moving = false, wreckT = 0, cepiHurtT = 0, cepiTalk = 2.5;
    const result = { points: 0, wrecked: false };
    game.state = 'bonus';

    function addPts(n, px, py, pz, big = false) {
      game.score.addFlat(n); result.points += n;
      pop(px, py, pz, '+' + n, '#ffd36e', big ? 30 : 20, 0.9);
    }
    function handle(evs) {
      for (const e of evs) {
        if (e.type === 'hit') {
          const onSpot = e.spot >= 0;
          const hx = onSpot ? spotX(e.spot) : Math.max(-carW / 2 + 0.3, Math.min(carW / 2 - 0.3, x)) + (Math.random() - 0.5) * 0.4;
          const hy = onSpot ? spotY(e.spot) : 0.9 + Math.random() * 1.2;
          const p = toPx(hx, hy);
          crack(p.x, p.y, onSpot ? 6 : 3, onSpot ? 45 : 28);
          if (Math.random() < 0.5 || onSpot) dent(p.x, p.y, onSpot ? 20 : 13);
          carTex.needsUpdate = true;
          carKick = Math.min(0.35, carKick + (onSpot ? 0.25 : 0.12)); carTilt = (Math.random() - 0.5) * (onSpot ? 0.08 : 0.04);
          shakeT = onSpot || e.power ? 0.2 : 0.08;
          addPts(e.power ? 300 : onSpot ? BONUS.points.spot : BONUS.points.hit, hx, hy + 0.6, CAR_Z + 0.3, onSpot || e.power);
          pop(hx + (Math.random() - 0.5) * 0.6, hy + 0.2, CAR_Z + 0.3, onSpot ? '💥' : ['🔩', '💥', '⚡'][Math.random() * 3 | 0], '#fff', onSpot ? 34 : 24, 0.6);
          if (onSpot) { flash('#fff2c4', 0.3); sfx('hitHeavy'); } else sfx('hit');
          setBar();
          lineCd -= 1;
          if (lineCd <= 0) { lineCd = 6 + Math.random() * 3; pop(cepiX, CEPI_H + 0.6, CAR_Z, LINES[Math.random() * 3 | 0], '#ff9b8a', 20, 1.5); }
        } else if (e.type === 'stage') onStage(e.stage);
        else if (e.type === 'wreck') {
          result.wrecked = true;
          const bonus = BONUS.points.wreck + Math.round(e.batLeft) * BONUS.points.perPercent;
          addPts(bonus, 0, CAR_H * 0.55, CAR_Z + 0.5, true);
          flash('#ffffff', 0.6); sfx('ko'); sfx('crowd'); shakeT = 0.5;
          if (deadTex) { carMat.map = deadTex; carMat.needsUpdate = true; car.scale.set(CAR_H * 1.05 * deadMeta.w / deadMeta.h, CAR_H * 1.05, 1); }
          pop(cepiX, CEPI_H + 0.5, CAR_Z, '¡MI BYD! ¡Me llevo a Margot igual!', '#ffffff', 20, 2.4);
          setCepi(2);
          phase = 'end'; phaseT = 0; glow.visible = false; clockE.parentElement.style.opacity = '0';
          pops.forEach(q => { if (/^[+]/.test(q.e.textContent) && q.t > 0) q.life = q.t; }); // se van los +20 que quedaban
        } else if (e.type === 'charged') {
          sfx('bell'); flash('#7ee0c3', 0.4);
          pop(cepiX, CEPI_H + 0.5, CAR_Z, logic.state.hp < BONUS.hp * 0.5 ? '¡Cargado! ¡Casi, casi!' : '¡Jaja! ¡100 %, me voy!', '#ff9b8a', 22, 2);
          phase = 'end'; phaseT = 0; glow.visible = false;
        } else if (e.type === 'cepi') {
          setCepi(2); cepiHurtT = 0.5;
          shakeT = 0.12; sfx('hitHeavy'); flash('#ffffff', 0.25);
          addPts(BONUS.points.cepi, cepiX, CEPI_H, CAR_Z + 0.4, true);
          if (e.unplugged) pop(cepiX, CEPI_H + 0.6, CAR_Z, ['¡AY! ¡Me desenchufaste!', '¡El cable no!', '¡Mamááá!'][Math.random() * 3 | 0], '#ff9b8a', 20, 1.4);
          setBar();
        } else if (e.type === 'replug') {
          pop(cepiX, CEPI_H + 0.6, CAR_Z, '¡Enchufado de nuevo!', '#ff9b8a', 18, 1.2);
        }
      }
    }
    function startSwing() {
      buffer = 0;
      combo = comboWindow > 0 ? (combo + 1) % 3 : 0;
      swing = SWINGS[combo]; swingT = 0; swingHit = false;
      sfx(combo === 2 ? 'hitHeavy' : 'swing');
    }
    function close() {
      if (closing) return;
      closing = true;
      const label = result.wrecked ? 'CEPI SE QUEDÓ SIN BYD… ¡PERO NO SIN PALETA!' : '¡OTRA VEZ!';
      if (game.curtain) game.curtain(() => end(), { label }); else end();
    }
    function end() {
      if (ended) return;
      ended = true;
      game.time += t;
      dispose();
      input.reset();
      if (result.wrecked || !onFail) onEnd(result); else onFail(result);
    }

    function update(dt) {
      if (ended) return;
      if (input.consume('pause')) { pause(); return; }
      t += dt; phaseT += dt;
      comboWindow = Math.max(0, comboWindow - dt); buffer = Math.max(0, buffer - dt);
      moving = false;
      input.consume('jump'); input.consume('dodge');
      if (phase === 'intro' && phaseT > 0.9) { phase = 'play'; phaseT = 0; sfx('bell'); }
      if (phase === 'play') {
        const mx = input.moveX;
        x = Math.max(-carW / 2 + 0.2, Math.min(cepiX + 0.2, x + mx * BONUS.move * (swing ? 0.4 : 1) * dt));
        moving = Math.abs(mx) > 0.15;
        if (input.pressed('attack')) { holdT += dt; if (hero.power >= 1 && holdT >= POWER.hold) usePower(); } else holdT = 0;
        if (input.consume('attack')) { if (!swing) startSwing(); else buffer = 0.2; }
        if (input.consume('power') && hero.power >= 1) usePower();
        if (swing) {
          swingT += dt;
          if (!swingHit && swingT >= swing.hitAt) {
            swingHit = true;
            const evs = logic.punch({ x, dmg: swing.dmg, spotX, cepiX });
            if (evs.length) hero.power = Math.min(1, hero.power + 0.03);
            handle(evs);
          }
          if (swing && swingT >= swing.dur) { swing = null; comboWindow = 0.45; if (buffer > 0) startSwing(); }
        }
        handle(logic.update(dt));
        if (logic.state.over && phase === 'play') { phase = 'end'; phaseT = 0; glow.visible = false; } // red de seguridad
      } else { swing = null; holdT = 0; }
      hero.holdT = holdT;
      if (phase === 'end' && phaseT > 2.3) return close();
      draw(dt);
      updateHud(dt);
    }
    function usePower() {
      hero.power = 0; holdT = 0;
      pop(x, HERO_H + 0.8, HERO_Z, isM ? '¡HIEDRA!' : '¡VERDADES A LOS GRITOS!', isM ? '#7ee0c3' : '#ffd36e', 28, 1.3);
      sfx('power'); flash(isM ? '#7ee0c3' : '#ffd36e', 0.4);
      handle(logic.power());
    }

    function draw(dt) {
      const S = logic.state;
      clockE.textContent = '⚡' + Math.floor(S.bat) + '%';
      audio?.setIntensity?.(S.bat / 100);
      clockE.parentElement.classList.toggle('hurry', S.bat >= 70 && !S.over);
      if (phase === 'play' && !S.over) {
        const nextGoal = S.cepiStun > 0 ? 'ok' : (S.bat >= 55 ? 'warn' : 'spot');
        if (nextGoal !== goalKey) {
          goalKey = nextGoal;
          const msg = nextGoal === 'ok'
            ? '⚡ ¡DESENCHUFADO! ¡DALE AL BYD AHORA!'
            : nextGoal === 'warn'
              ? '🔌 ¡PEGALE A CEPI A LA DERECHA PARA DESENCHUFAR!'
              : '👊 ¡PEGALE AL PUNTO BRILLANTE! (×3)';
          fillText(goalE, msg);
          goalE.className = 'bonus-goal ' + nextGoal;
        }
      } else if (goalKey !== 'off') {
        goalKey = 'off';
        goalE.className = 'bonus-goal hidden';
      }
      screen.material.color.setHex(S.cepiStun > 0 ? 0xff4d5e : (Math.sin(t * 8) > 0 ? 0x2fd36b : 0x9cffc0));
      // Cepi: enchufando (parado), golpeado o tirado; el cable cae al piso mientras está desenchufado
      cepiHurtT = Math.max(0, cepiHurtT - dt);
      if (S.wrecked) setCepi(2);
      else if (S.cepiStun > 0) setCepi(cepiHurtT > 0 ? 2 : 3);
      else setCepi(phase === 'play' && Math.sin(t * 5) > 0.6 ? 1 : 0);
      const lying = cepiCell === 3;
      cepiM.scale.set(-CEPI_H * cepiAsp * (lying ? 1.05 : 1), CEPI_H * (lying ? 1.05 : 1), 1); // mira hacia el auto
      cepiM.position.set(cepiX + (cepiHurtT > 0 ? Math.sin(t * 50) * 0.05 : 0), 0, CAR_Z + 0.55);
      cableAt(S.cepiStun > 0 || S.wrecked ? new T.Vector3(cepiX - 0.3, 0.06, CAR_Z + 0.9) : cableTo);
      if (phase === 'play' && S.cepiStun <= 0) { cepiTalk -= dt; if (cepiTalk <= 0) { cepiTalk = 3.5 + Math.random() * 2; pop(cepiX, CEPI_H + 0.6, CAR_Z, LINES[Math.random() * LINES.length | 0], '#ff9b8a', 18, 1.4); } }
      shakeT = Math.max(0, shakeT - dt);
      const sh = shakeT > 0 ? 0.12 : 0;
      cam.aspect = innerWidth / innerHeight;
      cam.fov = cam.aspect < 0.9 ? 64 : 46;
      cam.updateProjectionMatrix();
      const intro = phase === 'intro' ? Math.max(0, 1 - phaseT / 0.9) : 0;
      // El cuadro abarca el auto y el cargador con Cepi; con el celu parado sigue más al héroe
      const mid = cepiX * 0.3, follow = cam.aspect < 0.9 ? 0.6 : 0.25, cxm = mid + (x - mid) * follow;
      cam.position.set(cxm + (Math.random() - 0.5) * sh, 4.8 + intro * 3, HERO_Z + 6.4 + (cam.aspect < 0.9 ? 1.2 : 0) + intro * 5 + (Math.random() - 0.5) * sh);
      cam.lookAt(cxm, 1.7, CAR_Z);
      // Auto: rebota hacia atrás con cada golpe y vuelve
      carKick = Math.max(0, carKick - dt * 1.8);
      carTilt *= Math.max(0, 1 - dt * 6);
      car.position.set(Math.sin(t * 60) * carKick * 0.15, carKick * 0.25, CAR_Z - carKick * 0.4);
      car.rotation.z = carTilt + (logic.state.stage >= 3 && !S.wrecked ? -0.03 : 0);
      // Punto que brilla
      if (glow.visible) {
        const p = 0.9 + Math.sin(t * 9) * 0.25;
        glow.position.set(spotX(S.spot) + car.position.x, spotY(S.spot) + car.position.y, CAR_Z + 0.25);
        glow.scale.set(p * 1.1, p * 1.1, 1);
      }
      // Héroe (cicla run0..3 al desplazarse para no patinar congelado)
      if (moving && !swing) stepT += dt * 9; else stepT = 0;
      setHero(swing ? 'punch' : moving ? 'run' + (Math.floor(stepT) % 4) : 'idle');
      P.position.set(x, 0, HERO_Z);
      heroSh.position.set(x, 0.03, HERO_Z);
      // Margot a salvo afuera mirando la escena (festeja cuando cae el BYD)
      if (margotM) {
        setMargot(S.wrecked ? 3 : S.charged ? 2 : 1);
        const mb = S.wrecked ? Math.abs(Math.sin(t * 7)) * 0.28 : Math.abs(Math.sin(t * 3.2)) * 0.05;
        margotM.position.set(margotX, mb, CAR_Z + 0.85);
      }
      // Textos que flotan
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i]; q.t += dt; q.v.y += dt * 0.9; q.v.x += q.vx * dt;
        const sp = scratch.copy(q.v).project(cam);
        const half = Math.min(innerWidth / 2, q.w / 2 + 8);
        q.e.style.left = Math.max(half, Math.min(innerWidth - half, (sp.x + 1) / 2 * innerWidth)) + 'px';
        q.e.style.top = (1 - sp.y) / 2 * innerHeight + 'px';
        q.e.style.opacity = String(Math.max(0, Math.min(1, (q.life - q.t) / 0.3)));
        if (q.t > q.life) { q.e.remove(); pops.splice(i, 1); }
      }
    }

    let disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(flashTimer);
      ui.remove(); document.body.classList.remove('arena-on', 'bonus-on');
      bar?.classList.add('hidden');
      for (const o of own) o.dispose?.();
      if (cur === inst) cur = null;
    }
    // Lo que se expone (pruebas e2e): pasa por los mismos efectos que en el juego
    const exposed = {
      get state() { return logic.state; },
      punch: (a) => { const evs = logic.punch(a); handle(evs); return evs; },
      power: () => { const evs = logic.power(); handle(evs); return evs; }
    };
    const inst = cur = {
      logic: exposed,
      update,
      render() { renderer.render(scene, cam); },
      dispose,
      get state() { return { ...logic.state, x, phase, cepiX, result: { ...result }, spotX: SPOTS.map((_, i) => spotX(i)) }; }
    };
    draw(0);
  }

  return {
    start,
    get active() { return !!cur; },
    update(dt) { cur?.update(dt); },
    render() { cur?.render(); },
    dispose() { cur?.dispose(); },
    get state() { return cur?.state || null; },
    get logic() { return cur?.logic || null; }
  };
}
