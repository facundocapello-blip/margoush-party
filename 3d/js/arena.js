// «El escenario de BIG CHAKY»: duelo de baile directo en 3 rondas rápidas (Opción A).
// Ambos personajes —nuestro héroe a la izquierda y BIG CHAKY a la derecha— aparecen DE FRENTE
// mirando a cámara sobre un escenario disco iluminado con baldosas LED que laten al ritmo.
// Las flechas bajan por los 5 carriles hacia los 5 botones inferiores (↙ ↖ ● ↗ ↘).
// Cada paso acertado lastima a Chaky; además de los corazones, el héroe tiene 3 vidas extra (⭐⭐⭐)
// para seguir desde la misma ronda si pierde los corazones, sin volver a empezar.
import { ARENA, createArenaLogic } from './arena_logic.js';
import { createVoice } from './voice.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';

const HURT_POSE = 0.45;
const INV = 0.8;
const END_DELAY = 1.15;
// Intro del jefe: BIG CHAKY con Margot (fuera de la jaula) anuncia «¡La prueba de Baile!»
const INTRO = { line2: 1.9, reveal: 3.0, end: 3.7 };
const INTRO_LINES = ['¿Pensaste que iba a pelear con este traje? Te devuelvo a Margot…', '¡Solo si me ganás en la Prueba de Baile!'];
const CHAKY_VOICE = { lang: 'es-AR', pitch: 0.35, rate: 0.82 };
const STAGE_Z = ARENA.bossZ;
const TARIMA_H = 0.6, TARIMA_FRONT = STAGE_Z + 2.5, TARIMA_BACK = STAGE_Z - 3.5;
const HERO_H = 4.6, BOSS_H = 5.4;
const STAGE_CAM = { y: 4.2, z: 7.4, lookY: 3.15, fov: 54, fovPortrait: 62 };

// 5 carriles estilo arcade / Pump It Up (Z Q S E C o flechas en teclado)
const PIU_LANES = ['↙', '↖', '●', '↗', '↘'];
const PIU_KEYS = {
  KeyZ: 0, KeyQ: 1, KeyS: 2, KeyE: 3, KeyC: 4,
  ArrowLeft: 0, ArrowUp: 1, Space: 2, ArrowRight: 3, ArrowDown: 4
};
export const DANCE_SIGN = { jump: ['⤴', '¡SALTO!'], attack: ['👊', '¡PIÑA!'], dodge: ['🌀', '¡GIRO!'] };
// En el escenario BIG CHAKY usa SOLO su traje violeta de lentejuelas (nunca los sprites naranjas del galpón)
const BOSS_POSE_TEX = { ko: 'dance_ko', hurt: 'dance_dodge', idle: 'dance_idle' };
const TILE_COLORS = ['#38bdf8', '#e879f9', '#facc15', '#34d399', '#fb7185', '#a78bfa'];

export function createArena({ game, input, audio, assets, renderer, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroId = isM ? 'marine' : 'douge';
    const logic = createArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 300);

    // Ambiente de show disco en el hangar VIP
    scene.background = L('#1a1036');
    scene.fog = new T.Fog(L('#1a1036'), 32, 90);
    scene.add(new T.HemisphereLight(0xc4b5fd, 0x3b1d5e, 1.0));
    const keyLight = new T.DirectionalLight(0xfff0c4, 0.85);
    keyLight.position.set(0, 12, 8);
    scene.add(keyLight);
    const spotL = new T.PointLight(0x38bdf8, 1.3, 28, 1.5);
    spotL.position.set(-4, 7, STAGE_Z + 3);
    scene.add(spotL);
    const spotR = new T.PointLight(0xf472b6, 1.3, 28, 1.5);
    spotR.position.set(4, 7, STAGE_Z + 3);
    scene.add(spotR);

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

    // Piso y tarima del escenario disco
    const stageFloorTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#140c2c'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(167, 139, 250, 0.18)'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke();
        g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke();
      }
    }, 8, 6);
    const outer = mk(new T.PlaneGeometry(60, 40), new T.MeshLambertMaterial({ map: stageFloorTex }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);

    const TD = TARIMA_FRONT - TARIMA_BACK;
    const tarima = mk(new T.BoxGeometry(11.5, TARIMA_H, TD), new T.MeshLambertMaterial({ color: L('#251447') }));
    tarima.position.set(0, TARIMA_H / 2, (TARIMA_FRONT + TARIMA_BACK) / 2);
    const tarimaTrim = mk(new T.PlaneGeometry(11.5, 0.12), new T.MeshBasicMaterial({ color: L('#f472b6') }));
    tarimaTrim.position.set(0, TARIMA_H - 0.04, TARIMA_FRONT + 0.02);

    // Baldosas LED luminosas sobre el escenario que laten al ritmo
    const discoTiles = [];
    const tileG = keep(new T.PlaneGeometry(1.55, 1.35));
    tileG.rotateX(-Math.PI / 2);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        const col = TILE_COLORS[(c + r * 2) % TILE_COLORS.length];
        const mat = keep(new T.MeshBasicMaterial({ color: L(col), transparent: true, opacity: 0.42 }));
        const tile = new T.Mesh(tileG, mat);
        tile.position.set((c - 2.5) * 1.72, TARIMA_H + 0.015, STAGE_Z + 0.25 + r * 1.55);
        scene.add(tile);
        discoTiles.push({ mesh: tile, mat, baseCol: L(col), colIdx: (c + r) % TILE_COLORS.length });
      }
    }

    // Fondo pintado del escenario disco en el hangar del aeropuerto
    const fondoKey = assets.has('arena_aeropuerto_fondo') ? 'arena_aeropuerto_fondo' : 'arena_fondo';
    const fondo = assets.meta(fondoKey), BW = 52, BH = BW * fondo.h / fondo.w, BZ = STAGE_Z - 4.2;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: assets.texture(fondoKey), fog: false }));
    back.position.set(0, BH / 2 - BH * 0.24, BZ);

    // Haz de luz vertical suave sobre el héroe que destella en cada paso acertado (feedback periférico)
    const beamTex = canvasTex(64, 128, (g, w, h) => {
      const gx = g.createLinearGradient(0, 0, w, 0);
      gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gx; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-in';
      const gy = g.createLinearGradient(0, 0, 0, h);
      gy.addColorStop(0, 'rgba(255,255,255,0)'); gy.addColorStop(0.25, 'rgba(255,255,255,0.9)'); gy.addColorStop(0.85, 'rgba(255,255,255,1)'); gy.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gy; g.fillRect(0, 0, w, h);
    });
    const beamMat = keep(new T.MeshBasicMaterial({ map: beamTex, color: L('#fde047'), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
    const heroBeam = new T.Mesh(keep(new T.PlaneGeometry(4.2, 11)), beamMat);
    heroBeam.position.set(-ARENA.stageX, 5.5, STAGE_Z + 0.05);
    scene.add(heroBeam);
    let beamT = 0;

    // Sprites (ambos de frente mirando a cámara) con sombra redonda
    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(12,4,28,.65)'], [1, 'rgba(12,4,28,0)']]), transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);

    // Recortes de las hojas frontales de baile y acciones del héroe (Douge / Marine DE FRENTE)
    const CUSTOM = {};
    const danceSheetKey = heroId + '_dance_sheet';
    if (assets.has(danceSheetKey)) {
      const dm = assets.meta(danceSheetKey), cols = dm.cols || 4;
      const names = ['hero_dance_point', 'hero_dance_jump', 'hero_dance_left', 'hero_dance_right'];
      for (let i = 0; i < cols; i++) {
        const tx = keep(assets.texture(danceSheetKey).clone());
        tx.needsUpdate = true;
        tx.repeat.set(1 / cols, 1);
        tx.offset.set(i / cols, 0);
        CUSTOM[names[i]] = { map: tx, w: dm.w / cols, h: dm.h, hk: i === 1 ? 1.06 : 1 };
      }
    }
    const actSheetKey = heroId + '_actions_sheet';
    if (assets.has(actSheetKey)) {
      const am = assets.meta(actSheetKey), cols = am.cols || 4;
      const actNames = ['hero_act_jump', 'hero_act_dodge', 'hero_act_hurt', 'hero_act_power'];
      for (let i = 0; i < cols; i++) {
        const tx = keep(assets.texture(actSheetKey).clone());
        tx.needsUpdate = true;
        tx.repeat.set(1 / cols, 1);
        tx.offset.set(i / cols, 0);
        CUSTOM[actNames[i]] = { map: tx, w: am.w / cols, h: am.h, hk: 1 };
      }
    }

    const setTex = (m, key) => {
      if (m.userData.key === key) return;
      const c = CUSTOM[key], meta = c || assets.meta(key);
      if (!meta) return;
      m.material.map = c ? c.map : assets.texture(key);
      m.material.needsUpdate = true;
      m.userData.key = key;
      const h = m.userData.h * (c ? c.hk : (meta.hk || 1));
      m.userData.w = h * meta.w / meta.h;
      m.userData.hh = h;
      m.scale.set(m.userData.w, h, 1);
    };

    function sprite(key, h, shadow = 1) {
      const m = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ alphaTest: 0.42, side: T.DoubleSide })));
      m.userData.h = h;
      setTex(m, key);
      scene.add(m);
      if (shadow) {
        const s = new T.Mesh(shG, shM);
        s.scale.set(h * 0.65 * shadow, 1, h * 0.32 * shadow);
        s.renderOrder = 1;
        scene.add(s);
        m.userData.sh = s;
      }
      return m;
    }

    function place(m, px, py, pz) {
      m.position.set(px, py, pz);
      m.rotation.y = Math.atan2(cam.position.x - px, cam.position.z - pz) * 0.35;
      const s = m.userData.sh;
      if (s) { s.position.set(px, TARIMA_H + 0.025, pz); s.visible = m.visible; }
    }

    const initialBossKey = 'arena_chaky_dance_idle';
    const bossTexFor = (pose) => {
      const k = 'arena_chaky_' + (BOSS_POSE_TEX[pose] || pose);
      if (assets.has(k)) return k;
      // sin la pose de derrota, usa el giro de siempre
      return pose === 'ko' && assets.has('arena_chaky_dance_dodge') ? 'arena_chaky_dance_dodge' : initialBossKey;
    };
    const initialHeroKey = CUSTOM.hero_dance_point ? 'hero_dance_point' : (heroId + '_idle');
    const B = sprite(initialBossKey, BOSS_H, 0.95);
    const P = sprite(initialHeroKey, HERO_H, 0.85);

    // Margot FUERA de la jaula: en su cochecito junto a Chaky durante la intro y mirando el duelo desde el fondo
    let M = null, margotCell = -1;
    const MARGOT_H = 2.3;
    if (assets.has('margot_sheet')) {
      const mm = assets.meta('margot_sheet');
      const tx = keep(assets.texture('margot_sheet').clone());
      tx.needsUpdate = true;
      tx.repeat.set(1 / (mm.cols || 2), 1 / (mm.rows || 2));
      M = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ map: tx, alphaTest: 0.42, side: T.DoubleSide })));
      M.userData.cols = mm.cols || 2;
      M.userData.rows = mm.rows || 2;
      scene.add(M);
      const s = new T.Mesh(shG, shM);
      s.scale.set(MARGOT_H * 0.7, 1, MARGOT_H * 0.3);
      s.renderOrder = 1;
      scene.add(s);
      M.userData.sh = s;
    }
    // Celdas de margot_sheet: 1 = despierta con chupete, 2 = llorando, 3 = feliz con los brazos arriba
    const setMargot = (cell) => {
      if (!M || margotCell === cell) return;
      margotCell = cell;
      const c = M.userData.cols, r = M.userData.rows;
      M.material.map.offset.set((cell % c) / c, (r - 1 - Math.floor(cell / c)) / r);
    };
    setMargot(2);
    let mX = 4.45, mZ = STAGE_Z - 1.25, mH = MARGOT_H;

    // Interfaz del Duelo de Baile (5 carriles con botones receptores ABAJO y flechas que BAJAN)
    const ui = document.createElement('div');
    ui.id = 'arena-ui';
    ui.className = 'dice-mode';
    ui.innerHTML =
      '<div class="piu">' +
        '<div class="rhythm-status">' +
          '<div class="dice-dots"></div>' +
          '<div class="dance-caption"></div>' +
          '<div class="piu-judge"></div>' +
        '</div>' +
        '<div class="lanes">' +
          PIU_LANES.map((l, i) => '<div class="lane l' + i + '" data-lane="' + i + '"><b class="rec">' + l + '</b></div>').join('') +
        '</div>' +
      '</div>' +
      '<div class="fever-pill hidden"></div>' +
      '<div class="dance-count hidden"></div>' +
      '<div class="arena-flash"></div>' +
      '<div class="chaky-sign hidden"><b class="ico"></b><span class="txt"></span><i class="timer"><i></i></i></div>' +
      '<div class="phase-card hidden"><small></small><b></b><span></span><em hidden></em></div>' +
      '<div class="chaky-intro"><small>BIG CHAKY</small><p class="l1"></p><b class="l2"></b><i class="skip"></i></div>';
    document.body.append(ui);
    document.body.classList.add('arena-on', 'chaky-dance', 'piu-on', 'chaky-intro-on');

    const flashE = ui.querySelector('.arena-flash');
    const cardE = ui.querySelector('.phase-card'), dotsE = ui.querySelector('.dice-dots');
    const piuE = ui.querySelector('.piu'), lanesE = piuE.querySelector('.lanes'), judgeE = piuE.querySelector('.piu-judge');
    const captionE = piuE.querySelector('.dance-caption');
    const feverE = ui.querySelector('.fever-pill'), countE = ui.querySelector('.dance-count');
    let lastCountText = '';
    const introE = ui.querySelector('.chaky-intro');
    fillText(introE.querySelector('.skip'), 'Tocá para empezar');
    const laneEls = [...piuE.querySelectorAll('.lane')], noteEls = new Map();

    // Estrellas de 3 vidas extra (⭐⭐⭐) en el HUD junto al nombre del héroe
    const hudName = document.getElementById('hud-name');
    let livesEl = document.getElementById('hud-chaky-lives');
    if (!livesEl && hudName) {
      livesEl = document.createElement('span');
      livesEl.id = 'hud-chaky-lives';
      livesEl.className = 'chaky-lives';
      hudName.after(livesEl);
    }
    function renderLives() {
      if (!livesEl) return;
      const lv = logic.state.lives, mx = logic.state.livesMax;
      livesEl.textContent = '⭐'.repeat(lv) + '☆'.repeat(Math.max(0, mx - lv));
      livesEl.title = `${lv} vidas extra`;
    }
    renderLives();

    const PHASE_CARDS = {
      1: ['RONDA 1', '¡DUELO DE BAILE!', '«Si querés a Margot, vas a tener que seguirme el ritmo»', 'Tocá cada botón cuando baja la flecha'],
      2: ['RONDA 2', '¡SUBE EL RITMO!', '¡Seguí los pasos de Big Chaky!', 'Tocá cada botón cuando baja la flecha'],
      3: ['RONDA 3', '¡FINAL A TODO DISCO!', '¡Última ronda para ganarle el duelo!', 'Tocá cada botón cuando baja la flecha']
    };
    let cardLeft = 0;
    function phaseCard(n, secs = 1.35) {
      const info = PHASE_CARDS[n] || PHASE_CARDS[1];
      const [a, b, c, d2] = info;
      fillText(cardE.querySelector('small'), a);
      fillText(cardE.querySelector('b'), b);
      fillText(cardE.querySelector('span'), c);
      const em = cardE.querySelector('em');
      if (d2) { fillText(em, d2); em.hidden = false; } else em.hidden = true;
      cardE.className = 'phase-card p2';
      void cardE.offsetWidth;
      cardE.classList.add('on');
      cardLeft = secs;
    }

    function renderDots() {
      const d = logic.state.dice;
      if (!d) { dotsE.classList.add('hidden'); return; }
      dotsE.classList.remove('hidden');
      dotsE.innerHTML = Array.from({ length: d.total }, (_, i) => '<i class="' + (d.res[i] || (i === d.round ? 'now' : '')) + '"></i>').join('');
    }
    renderDots();

    // Barra de vida de BIG CHAKY ubicada en la cabecera central durante todo el duelo
    const bar = document.querySelector('#boss-bar'), fill = document.querySelector('#boss-fill');
    const barHome = bar?.parentElement;
    const barName = bar?.querySelector('span');
    if (bar) {
      document.querySelector('.hud-center')?.append(bar);
      bar.classList.remove('hidden');
    }
    const setBarName = () => {
      if (barName) barName.textContent = tr('BIG CHAKY') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3';
    };
    const setBar = () => {
      if (fill) fill.style.width = (100 * logic.state.hp / logic.state.hpMax).toFixed(1) + '%';
      setBarName();
    };
    setBar();

    // Audio: arranca directamente con el ritmo de baile
    try { audio.music('byd', { fade: 0.25 }); } catch (_) {}

    let judgeLeft = 0, captionLeft = 0, piuRound = -1;
    let laneHeight = 0, viewportHeight = 0, viewportWidth = 0;
    let heroStepLane = -1, heroStepTimer = 0;

    // Intro: primera frase, «¡La prueba de Baile!» y luego se revela el escenario completo
    let introStep = 0;
    function introLine(n, voiceOn = true) {
      if (introStep >= n) return;
      introStep = n;
      const text = INTRO_LINES[n - 1];
      if (n === 1) {
        fillText(introE.querySelector('.l1'), text);
        introE.classList.add('on1');
      } else {
        fillText(introE.querySelector('.l2'), text);
        introE.classList.add('on2');
        flash('#e879f9', 0.32);
        shake(0.16, 0.25);
        sfx('perfect');
        for (const tile of discoTiles) tile.mat.opacity = 0.95;
      }
      if (voiceOn) { try { audio.bossLine?.(text, CHAKY_VOICE, n === 1 ? 1.8 : 1.2); } catch (_) {} }
    }
    function skipIntro() {
      if (phase !== 'intro' || phaseT >= INTRO.reveal) return;
      introLine(1, false);
      introLine(2, false);
      phaseT = INTRO.reveal;
    }
    ui.addEventListener('pointerdown', () => { if (phase === 'intro') skipIntro(); });

    function piuTap(lane) {
      if (phase === 'intro') { skipIntro(); return; }
      if (game.state !== 'arena' || logic.state.phase === 'ko') return;
      laneEls[lane].classList.remove('press');
      void laneEls[lane].offsetWidth;
      laneEls[lane].classList.add('press');
      heroStepLane = lane;
      heroStepTimer = 0.42;
      handle(logic.tap(lane));
    }
    for (const el of laneEls) {
      el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); piuTap(+el.dataset.lane); });
    }
    const onKey = (ev) => {
      if (game.state === 'arena' && phase === 'intro' && !ev.repeat && ev.code !== 'Escape' && ev.code !== 'KeyP') { skipIntro(); return; }
      if (game.state !== 'arena' || !(ev.code in PIU_KEYS)) return;
      ev.preventDefault();
      if (!ev.repeat) piuTap(PIU_KEYS[ev.code]);
    };
    addEventListener('keydown', onKey);

    function piuPulse(lane) {
      const r = laneEls[lane]?.querySelector('.rec');
      if (!r) return;
      r.classList.remove('beat');
      void r.offsetWidth;
      r.classList.add('beat');
    }

    function piuText(txt, cls) {
      fillText(judgeE, txt);
      judgeE.className = 'piu-judge ' + cls;
      void judgeE.offsetWidth;
      judgeE.classList.add('on');
      judgeLeft = 0.55;
    }

    const pops = [], scratch = new T.Vector3();
    const pop = (px, py, pz, txt, col = '#ffd36e', size = 22, life = 1.0) => {
      const e = document.createElement('div');
      e.className = 'pop';
      fillText(e, txt);
      e.style.color = col;
      e.style.fontSize = size + 'px';
      const q = { e, v: new T.Vector3(px, py, pz), t: 0, life, w: e.offsetWidth };
      ui.append(e);
      pops.push(q);
      return q;
    };

    const sfx = (n) => { try { audio.sfx(n); } catch (_) {} };
    let flashTimer = 0;
    const flash = (col, op = 0.38) => {
      flashE.style.background = col;
      flashE.style.opacity = String(op);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { flashE.style.opacity = '0'; }, 110);
    };

    // Estado del escenario y los bailarines
    let x = logic.state.heroX, z = STAGE_Z + 0.25, y = 0, vy = 0, t = 0;
    let phase = 'intro', phaseT = 0, ended = false, closing = false;
    let hurtT = 0, inv = 0, shakeT = 0, shakeA = 0, bossFlash = 0;
    let heroPose = 'dance_idle', bossKey = initialBossKey, prevPose = 'dance_idle', poseT = 0, danceStep = 0;
    game.state = 'arena';

    const shake = (a, s = 0.25) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, s); };
    function addPts(n, px, py, pz) {
      const before = game.score.total;
      game.score.addFlat(n);
      pop(px, py, pz, '+' + (game.score.total - before), '#ffd36e', 22);
    }
    function charge(a) { hero.power = Math.min(1, hero.power + a); }

    function speak(event) {
      const text = voice.say('chaky', event);
      if (!text) return;
      fillText(captionE, text);
      captionLeft = 2.0;
    }

    function recBurst(lane, cls) {
      const r = laneEls[lane]?.querySelector('.rec');
      if (!r) return;
      r.classList.remove('hit-perfect', 'hit-good', 'hit-bad');
      void r.offsetWidth;
      r.classList.add(cls);
    }

    function piuJudge(e) {
      if (e.grade === 'empty') return;
      if (e.grade === 'miss') {
        piuText('¡FALLÓ!', 'bad');
        recBurst(e.lane, 'hit-bad');
        return;
      }
      const isPerf = e.grade === 'perfect';
      piuText(tr(isPerf ? '¡PERFECTO!' : '¡BIEN!') + (e.combo > 1 ? ' ×' + e.combo : ''), e.grade);
      recBurst(e.lane, isPerf ? 'hit-perfect' : 'hit-good');
      sfx(isPerf ? 'perfect' : 'pickup');
      addPts(isPerf ? ARENA.points.stepPerfect : ARENA.points.stepGood, x, TARIMA_H + HERO_H * 0.72, z);
      pop(logic.state.bossX, TARIMA_H + BOSS_H * 0.65, STAGE_Z + 0.2, isPerf ? '✨' : '💥', '#ffd36e', isPerf ? 30 : 24, 0.55);
      charge(POWER.hit);
      game.combo?.add?.(1);
      danceStep = (e.lane - 2) / 2;
      if (y <= 0) vy = CHASE.jump * (e.lane === 2 ? 0.52 : 0.35);
      // Haz de luz vertical sobre el héroe + baldosas LED del color del carril acertado
      const hitCol = L(TILE_COLORS[e.lane % TILE_COLORS.length]);
      beamMat.color.copy(hitCol);
      beamT = isPerf ? 0.42 : 0.28;
      for (const tile of discoTiles) {
        tile.mat.color.copy(hitCol);
        tile.mat.opacity = 0.88;
      }
    }

    // Dibuja las flechas BAJANDO desde arriba hacia los 5 botones receptores ubicados ABAJO
    function piuDraw() {
      const d = logic.state.dice;
      if (!d) return;
      if (d.round !== piuRound) {
        for (const el of noteEls.values()) el.remove();
        noteEls.clear();
        piuRound = d.round;
        renderDots();
      }
      if (!laneHeight || innerHeight !== viewportHeight || innerWidth !== viewportWidth) {
        viewportHeight = innerHeight;
        viewportWidth = innerWidth;
        laneHeight = lanesE.clientHeight;
      }
      const H = laneHeight || 110;
      const startY = 6, recY = Math.max(8, H - 36);
      const travel = d.travel || ARENA.dice.travel;
      const speed = (recY - startY) / travel;
      d.notes.forEach((n, i) => {
        let el = noteEls.get(i);
        if (n.judged && n.judged !== 'miss') {
          if (el) { el.remove(); noteEls.delete(i); }
          return;
        }
        // top crece a medida que d.t se acerca a n.time -> la flecha BAJA hacia recY (abajo)
        const top = recY - (n.time - d.t) * speed;
        if (top < -42 || top > H + 36) {
          if (el && top > H + 36) { el.remove(); noteEls.delete(i); }
          return;
        }
        if (!el) {
          el = document.createElement('b');
          el.className = 'note l' + n.lane;
          el.textContent = PIU_LANES[n.lane];
          laneEls[n.lane].append(el);
          noteEls.set(i, el);
        }
        el.style.transform = 'translateY(' + top.toFixed(1) + 'px)';
        el.classList.toggle('missed', n.judged === 'miss');
      });
    }

    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1);
            game.score.takeDamage();
            game.combo?.reset?.();
            hurtT = HURT_POSE;
            inv = INV;
            flash('#ff4d5e', 0.42);
            shake(0.28, 0.28);
            sfx('hurt');
            if (hero.hp <= 0 && phase === 'fight') {
              // Si quedan vidas extra (⭐⭐⭐), gasta 1 estrella, recupera los corazones y sigue en la misma ronda
              if (logic.useLife()) {
                hero.hp = hero.hpMax;
                hurtT = 0; // vuelve limpio a pose de baile para la cuenta regresiva de recuperación
                renderLives();
                for (const el of noteEls.values()) el.remove();
                noteEls.clear();
                piuText(tr('⭐ ¡VIDA EXTRA! ¡SEGUÍ BAILANDO!'), 'ok');
                pop(x, TARIMA_H + HERO_H * 0.85, z, '⭐ ¡VIDA EXTRA!', '#ffd36e', 26, 1.3);
                sfx('pickup');
              } else {
                phase = 'down';
                phaseT = 0;
              }
            } else if (hero.hp > 0) {
              speak('taunt');
            }
            break;
          case 'bossHit':
            setBar();
            bossFlash = 0.16;
            flash('#fff2c4', 0.16);
            break;
          case 'phase':
            setBar();
            renderDots();
            phaseCard(e.to, 1.15);
            flash('#ffd36e', 0.25);
            break;
          case 'voice':
            speak(e.event);
            break;
          case 'danceBeat':
            sfx('tick');
            piuPulse(e.lane);
            break;
          case 'danceStep':
            piuJudge(e);
            break;
          case 'diceResult':
            renderDots();
            piuText(e.hits + '/' + e.of, e.ok ? 'ok' : 'bad');
            if (e.ok) {
              addPts(ARENA.points.dice, x, TARIMA_H + HERO_H * 0.78, z);
              charge(POWER.hit);
              sfx('hitHeavy');
              shake(0.18, 0.18);
            } else {
              sfx('boo');
            }
            break;
          case 'heal':
            hero.hp = Math.min(hero.hpMax || hero.hp + 1, hero.hp + 1);
            pop(x, TARIMA_H + HERO_H * 0.85, z, '+❤', '#ff6b8a', 32, 1.3);
            sfx('pickup');
            break;
          case 'ko': {
            setBar();
            flash('#ffffff', 0.55);
            shake(0.5, 0.8);
            sfx('ko');
            const before = game.score.total;
            game.score.addKill('boss');
            pop(logic.state.bossX, TARIMA_H + B.userData.hh * 0.5, STAGE_Z, '+' + (game.score.total - before), '#ffd36e', 34, 1.5);
            bar?.classList.add('hidden');
            introE.remove();
            document.body.classList.remove('chaky-intro-on');
            for (const el of noteEls.values()) el.remove();
            noteEls.clear();
            phase = 'ko';
            phaseT = 0;
            break;
          }
        }
      }
    }

    function close(won) {
      if (closing) return;
      closing = true;
      if (game.curtain) game.curtain(() => end(won)); else end(won);
    }
    function end(won) {
      if (ended) return;
      ended = true;
      const secs = t;
      dispose();
      game.time += secs;
      input.reset();
      if (won) onWin(); else onDown();
    }

    function update(dt) {
      if (ended) return;
      if (input.consume('pause')) { pause(); return; }
      t += dt;
      phaseT += dt;
      if (cardLeft > 0 && (cardLeft -= dt) <= 0) cardE.classList.add('hidden');
      if (judgeLeft > 0 && (judgeLeft -= dt) <= 0) judgeE.classList.remove('on');
      if (captionLeft > 0 && (captionLeft -= dt) <= 0) captionE.textContent = '';
      if (hurtT > 0) hurtT -= dt;
      if (heroStepTimer > 0) heroStepTimer -= dt;
      inv = Math.max(0, inv - dt);

      for (const action of ['jump', 'attack', 'dodge', 'power']) input.consume(action);
      vy -= CHASE.gravity * dt;
      y = Math.max(0, y + vy * dt);
      if (y <= 0) vy = Math.max(0, vy);

      if (phase === 'intro') {
        if (phaseT >= 0.05) introLine(1);
        if (phaseT >= INTRO.line2) introLine(2);
        if (phaseT >= INTRO.reveal) introE.classList.add('out');
      }
      if (phase === 'intro' && phaseT >= INTRO.end) {
        phase = 'fight';
        phaseT = 0;
        introE.remove();
        document.body.classList.remove('chaky-intro-on');
        setMargot(1);
        phaseCard(logic.state.phase, 1.15);
        speak('dice');
      }
      if (phase === 'fight') {
        handle(logic.update(dt, { x, z, y, moving: false, dodging: false, inv: inv > 0 }));
      }
      if ((phase === 'fight' || phase === 'intro') && hero.hp <= 0) {
        introE.remove();
        document.body.classList.remove('chaky-intro-on');
        phase = 'down';
        phaseT = 0;
      } else if (phase === 'ko') {
        logic.update(dt, { x, z, y, dodging: false, inv: true });
      }

      if (phase === 'ko' && phaseT >= END_DELAY) return close(true);
      if (phase === 'down' && phaseT >= END_DELAY) return close(false);
      draw(dt);
      updateHud(dt);
    }

    function draw(dt) {
      const S = logic.state;
      setBar();
      renderLives();
      shakeT = Math.max(0, shakeT - dt);
      if (shakeT <= 0) shakeA = 0;
      const sh = shakeA * Math.min(1, shakeT * 4);
      // Intro: primer plano de BIG CHAKY con Margot; luego la cámara se abre al escenario completo
      const rv = phase === 'intro' ? Math.max(0, Math.min(1, (phaseT - INTRO.reveal) / (INTRO.end - INTRO.reveal))) : 1;
      const e = 1 - rv * rv * (3 - 2 * rv);
      const focusX = (S.bossX - 0.9) * e;

      // Cámara frontal enfocando a los dos bailarines bien separados sobre el escenario
      const extraZ = innerHeight < 420 ? 0.8 : 0;
      cam.position.set(
        focusX + (Math.random() - 0.5) * sh,
        STAGE_CAM.y - e * 0.9 + (Math.random() - 0.5) * sh,
        STAGE_CAM.z + extraZ - e * 6.5
      );
      cam.lookAt(focusX, STAGE_CAM.lookY + e * 0.7, STAGE_Z);
      cam.aspect = innerWidth / innerHeight;
      cam.fov = cam.aspect < 0.9 ? STAGE_CAM.fovPortrait : STAGE_CAM.fov;
      cam.updateProjectionMatrix();

      // Pulso de luces disco y baldosas LED al ritmo de la música (más intenso en Modo Disco)
      const feverOn = phase === 'fight' && !!S.dice?.fever;
      const beatDur = S.dice?.beatDur || ARENA.dice.beat;
      const beatPhase = ((S.dice?.t ?? t) * Math.PI) / beatDur;
      const beatBounce = Math.abs(Math.sin(beatPhase));
      const beatSway = Math.sin(beatPhase);
      const sweepSpd = feverOn ? 5.2 : 2.4;
      spotL.position.x = -3.8 + Math.sin(t * sweepSpd) * (feverOn ? 2.8 : 1.6);
      spotR.position.x = 3.8 - Math.sin(t * sweepSpd) * (feverOn ? 2.8 : 1.6);
      for (let i = 0; i < discoTiles.length; i++) {
        const tile = discoTiles[i];
        tile.mat.opacity += (((feverOn ? 0.45 : 0.32) + 0.42 * Math.abs(Math.sin(beatPhase + i * 0.7))) - tile.mat.opacity) * Math.min(1, dt * 8);
        if (feverOn) {
          const ci = (i + Math.floor(t * 7)) % TILE_COLORS.length;
          tile.mat.color.lerp(L(TILE_COLORS[ci]), Math.min(1, dt * 8));
        } else {
          tile.mat.color.lerp(tile.baseCol, Math.min(1, dt * 5));
        }
      }
      beamT = Math.max(0, beamT - dt);
      beamMat.opacity = beamT > 0 ? Math.min(0.45, beamT * 1.15) : 0;
      heroBeam.position.x = S.heroX;
      piuE.classList.toggle('fever', feverOn);
      if (feverOn) {
        feverE.classList.remove('hidden');
        feverE.textContent = tr('🔥 ¡MODO DISCO!') + ' ×' + (S.dice?.combo || 4);
      } else {
        feverE.classList.add('hidden');
      }

      // Conteo rítmico «3 · 2 · 1 · ¡A BAILAR!» antes de la primera flecha de cada ronda
      const dLead = S.dice?.lead || 0;
      const inCountdown = phase === 'fight' && S.phase !== 'ko' && S.dice?.stage === 'play' && dLead >= 0.7 && S.dice.t < dLead + 0.32;
      if (inCountdown) {
        const frac = S.dice.t / dLead;
        const cTxt = frac < 0.33 ? '3' : frac < 0.66 ? '2' : frac < 1.0 ? '1' : tr('¡A BAILAR!');
        if (cTxt !== lastCountText) {
          lastCountText = cTxt;
          countE.textContent = cTxt;
          countE.className = 'dance-count' + (frac >= 1 ? ' go' : '');
          void countE.offsetWidth;
          countE.classList.add('pop-in');
        }
      } else if (lastCountText) {
        lastCountText = '';
        countE.className = 'dance-count hidden';
      }

      // 1. BIG CHAKY (a la derecha del escenario, DE FRENTE mirando a cámara)
      let pose = phase === 'intro'
        ? (phaseT < INTRO.line2 ? 'dance_laugh' : phaseT < INTRO.reveal ? 'dance_jump' : 'dance_idle')
        : phase === 'down' ? 'dance_laugh' : S.pose;
      if (pose !== prevPose) { prevPose = pose; poseT = 0; }
      poseT += dt;
      bossKey = bossTexFor(pose);
      setTex(B, bossKey);
      let bx = S.bossX, by = beatBounce * 0.16, rz = beatSway * 0.04, sx = 1, sy = 1 + Math.sin(beatPhase * 2) * 0.025;
      if (pose === 'dance_jump') {
        by = 0.55 + Math.sin(Math.min(1, poseT / 0.35) * Math.PI) * 0.45;
        sy = 1.06;
      } else if (pose === 'dance_attack') {
        if (S.dice?.step === 3) sx = -1;
        by += 0.12;
        sy = 1.04;
      } else if (pose === 'dance_dodge') {
        if (S.dice?.step === 0) sx = -1;
        sy = 0.96;
      } else if (pose === 'dance_laugh') {
        sy = 1 + Math.sin(t * 16) * 0.04;
        by = Math.abs(Math.sin(t * 8)) * 0.18;
      } else if (pose === 'ko') {
        // KO con el traje de baile: se tambalea y cae de costado (sin volver al buzo naranja)
        const f = Math.min(1, poseT / 0.55);
        rz = -f * 1.15 + Math.sin(poseT * 20) * 0.06 * (1 - f);
        by = 0;
        sy = 1 - f * 0.08;
      }
      place(B, bx, TARIMA_H + by, STAGE_Z);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1);
      B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      B.material.color.setRGB(1, bossFlash > 0 ? 0.6 : 1, bossFlash > 0 ? 0.6 : 1);

      // 2. HÉROE (Douge o Marine a la izquierda del escenario, también DE FRENTE mirando a cámara)
      x = S.heroX;
      z = STAGE_Z + 0.15;
      let hKey = CUSTOM.hero_dance_point ? 'hero_dance_point' : (heroId + '_idle');
      let hsx = 1, hsy = 1 + Math.cos(beatPhase * 2) * 0.025;
      let hBob = beatBounce * 0.15, hLean = -beatSway * 0.04;

      if (hurtT > 0 || phase === 'down') {
        heroPose = 'hurt';
        hKey = CUSTOM.hero_act_hurt ? 'hero_act_hurt' : hKey;
        hLean = Math.sin(t * 28) * 0.1;
      } else if (S.phase === 'ko') {
        heroPose = 'victory';
        hKey = CUSTOM.hero_dance_jump ? 'hero_dance_jump' : (CUSTOM.hero_act_power || hKey);
        hBob = Math.abs(Math.sin(t * 7)) * 0.45;
      } else if (heroStepTimer > 0 && heroStepLane >= 0) {
        heroPose = 'dance_step';
        if (heroStepLane === 0) {
          hKey = CUSTOM.hero_dance_left ? 'hero_dance_left' : hKey;
          hLean = -0.08;
        } else if (heroStepLane === 1) {
          hKey = CUSTOM.hero_dance_point ? 'hero_dance_point' : hKey;
          hLean = -0.05;
        } else if (heroStepLane === 2) {
          hKey = CUSTOM.hero_dance_jump ? 'hero_dance_jump' : hKey;
          hsy = 1.06;
        } else if (heroStepLane === 3) {
          hKey = CUSTOM.hero_dance_point ? 'hero_dance_point' : hKey;
          hsx = -1;
          hLean = 0.05;
        } else {
          hKey = CUSTOM.hero_dance_right ? 'hero_dance_right' : hKey;
          hLean = 0.08;
        }
      } else {
        heroPose = 'dance_idle';
        // Mantiene siempre la hoja frontal de baile (evita salto de proporción con *_idle de calle)
        hKey = CUSTOM.hero_dance_point ? 'hero_dance_point' : (heroId + '_idle');
      }
      setTex(P, hKey);
      P.scale.set(P.userData.w * hsx, P.userData.hh * hsy, 1);
      P.visible = true;
      place(P, x, TARIMA_H + y + hBob, z);
      P.rotation.z = hLean + danceStep * y * 0.12;

      // 3. MARGOT: al COSTADO DERECHO del escenario (nunca en el medio entre héroe y Chaky); festeja en Modo Disco o KO
      if (M) {
        const inIntroShot = phase === 'intro' && phaseT < INTRO.reveal;
        const tx = inIntroShot ? S.bossX + 1.55 : 4.45;
        const tz = inIntroShot ? STAGE_Z + 0.35 : STAGE_Z - 1.25;
        const th = inIntroShot ? MARGOT_H : MARGOT_H * 0.78;
        const kk = Math.min(1, dt * 5);
        if (dt === 0 || phase === 'intro' && phaseT < 0.05) { mX = tx; mZ = tz; mH = th; }
        else { mX += (tx - mX) * kk; mZ += (tz - mZ) * kk; mH += (th - mH) * kk; }
        if (S.phase === 'ko' || feverOn) setMargot(3);
        else if (phase === 'down' || (phase === 'intro' && phaseT < INTRO.reveal)) setMargot(2);
        else if (phase !== 'intro') setMargot(1);
        const mb = margotCell === 3 ? Math.abs(Math.sin(t * 7)) * 0.3 : beatBounce * 0.06;
        M.scale.set(mH, mH, 1);
        place(M, mX, TARIMA_H + mb, mZ);
        M.rotation.z = margotCell === 2 ? Math.sin(t * 9) * 0.03 : 0;
      }

      if (phase !== 'intro' && S.phase !== 'ko') piuDraw();

      // Textos flotantes de puntaje y vida
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i];
        q.t += dt;
        q.v.y += dt * 0.85;
        const sp = scratch.copy(q.v).project(cam);
        const half = Math.min(innerWidth / 2, q.w / 2 + 18);
        q.e.style.left = Math.max(half, Math.min(innerWidth - half, (sp.x + 1) / 2 * innerWidth)) + 'px';
        q.e.style.top = ((1 - sp.y) / 2 * innerHeight) + 'px';
        q.e.style.opacity = String(Math.max(0, Math.min(1, (q.life - q.t) / 0.35)));
        if (q.t > q.life) { q.e.remove(); pops.splice(i, 1); }
      }
    }

    // Cajas en pantalla (px, de arriba hacia abajo) de BIG CHAKY y del héroe para validación de layout
    function screenBoxes() {
      const py = (m, k) => (1 - scratch.set(m.position.x, m.position.y + m.scale.y * k, m.position.z).project(cam).y) / 2 * innerHeight;
      return {
        boss: { top: py(B, 1), face: py(B, 0.85), feet: py(B, 0) },
        hero: { top: py(P, 1), feet: py(P, 0) }
      };
    }

    let disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(flashTimer);
      removeEventListener('keydown', onKey);
      document.body.classList.remove('arena-on', 'chaky-dance', 'piu-on', 'chaky-intro-on');
      if (bar && barHome) barHome.append(bar);
      bar?.classList.add('hidden');
      livesEl?.remove();
      ui.remove();
      for (const o of own) o.dispose?.();
      if (cur === inst) cur = null;
    }

    const exposed = {
      get state() { return logic.state; },
      punch: (area) => { const evs = logic.punch(area); handle(evs); return evs; },
      power: () => { const evs = logic.power(); handle(evs); return evs; },
      act: (k) => { const evs = logic.act(k); handle(evs); return evs; },
      tap: (lane) => { const evs = logic.tap(lane); handle(evs); return evs; },
      skipIntro: () => skipIntro(),
      useLife: () => logic.useLife(),
      _setHp: (hp) => { const evs = logic._setHp(hp); handle(evs); return evs; }
    };

    const inst = cur = {
      logic: exposed,
      update,
      render() { renderer.render(scene, cam); },
      redraw() { draw(0); },
      dispose,
      get state() {
        const S = logic.state;
        return {
          ...S,
          shots: S.shots.map(s => ({ ...s })),
          hand: { ...S.hand },
          hero: { x, z, y, pose: heroPose, tex: P.userData.key, facing: 'front' },
          bossTex: bossKey,
          hp: hero.hp,
          lives: S.lives,
          power: hero.power,
          scene: phase,
          margot: M ? { x: mX, z: mZ, cell: margotCell } : null,
          screen: screenBoxes()
        };
      }
    };
    draw(0);
    updateHud(0);
  }

  return {
    start,
    get active() { return !!cur; },
    get logic() { return cur?.logic || null; },
    update(dt) { cur?.update(dt); },
    render() { cur?.render(); },
    redraw() { cur?.redraw(); },
    dispose() { cur?.dispose(); },
    get state() { return cur?.state || null; }
  };
}
