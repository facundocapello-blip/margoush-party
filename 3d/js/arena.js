// «La arena de BIG CHAKY»: escena de la pelea final, vista desde atrás del héroe (a pie, de espaldas).
// BIG CHAKY, enorme al fondo, se pasea tirando barriles (ruedan hacia el héroe) y cajones (caen en arco
// donde estaba el héroe); en la fase 2 suma el manotazo. Toda la regla vive en arena_logic.js: este
// módulo dibuja, lee los controles y convierte los eventos de la lógica en vida, puntos y efectos.
// Puntos: solo `dodge` (+100), `handHit` (+50) y `returned` (+300); `bossHit` es solo barra y feedback.
// Sin carteles de instrucciones: solo las frases de BIG CHAKY, el grito del poder y los puntos.
// En la fase 2 («Chaky dice») el cartel que levanta es parte de la pelea, no una instrucción.
// Voces: voice.js (provisorias con la voz del sistema hasta tener grabaciones).
import { ARENA, createArenaLogic } from './arena_logic.js';
import { createVoice, PROFILES } from './voice.js';
import { SWINGS } from './hero.js';
import { CHASE } from './chase.js';
import { fillText, tr } from './i18n.js';

const MOVE = 6;            // m/s con el joystick
const DASH_SPEED = 11;     // m/s durante el esquive
const COMBO_WINDOW = 0.45; // s para encadenar el siguiente golpe
const HURT_POSE = 0.5;     // s con la pose de golpeado
const INV = 1.3;           // s invulnerable después de un golpe
const END_DELAY = 1.2;     // s entre el ko (o caer) y salir de la arena
const ENTRANCE = 1.5;      // s de entrada: la cámara baja desde arriba, BIG CHAKY ruge y recién ahí empieza a tirar
const HERO_H = 2.4, BOSS_H = 14, BARREL_H = 1.15, CRATE_H = 1.3, GIANT_H = 2.7;
// Cartel de «Chaky dice»: texto e ícono de cada orden
// Pump It Up: los 5 carriles y las teclas de compu (Z Q S E C, como en la máquina)
const PIU_LANES = ['↙', '↖', '●', '↗', '↘'], PIU_KEYS = { KeyZ: 0, KeyQ: 1, KeyS: 2, KeyE: 3, KeyC: 4 };
export const DANCE_SIGN = { jump: ['⤴', '¡SALTO!'], attack: ['👊', '¡PIÑA!'], dodge: ['🌀', '¡GIRO!'] };
// Poses de baile de Chaky: si todavía no están las imágenes, usa una parecida
const DANCE_FALLBACK = { dance_idle: 'idle', dance_jump: 'throw', dance_attack: 'slam', dance_dodge: 'hurt', dance_laugh: 'idle' };
// BIG CHAKY parado sobre la tarima, enorme: la cámara va lejos y alta para que mida ≥ 2,5 veces al héroe en pantalla
const TARIMA_H = 0.6, TARIMA_FRONT = ARENA.bossZ + 2.4, TARIMA_BACK = ARENA.bossZ - 5;
const CAM = { y: 6, back: 11, lookY: 6, fov: 66, fovPortrait: 70 };
// Mantiene a Chaky entero por encima de los carriles del baile.
const DANCE_CAM = { y: 7.5, z: 12, lookY: 2.2 };
// Manotazo: la pose `slam` recortada por arriba de la mano (filas 0..545 de 768) y la mano sola (recorte 80,530 215×238;
// de ese recorte solo queda la piel: el pantalón y las zapatillas que asoman se borran por color)
const SLAM_CUT = 545 / 768, HAND_CROP = { x: 80, y: 530, w: 215, h: 238 }, HAND_W = 3.2, HAND_FALL = 7;

export function createArena({ game, input, audio, assets, renderer, banner, updateHud, pause, POWER, onWin, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine';
    const heroPre = 'arena_' + (isM ? 'marine' : 'douge') + '_back_';
    const logic = createArenaLogic();
    const voice = createVoice({ speak: (text, prof, o) => { try { audio.bossLine?.(text, prof, o.dur); } catch (_) {} } });
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 300);
    // Galpón: penumbra violeta y luz naranja
    scene.background = L('#2c2350');
    scene.fog = new T.Fog(L('#2c2350'), 28, 80);
    scene.add(new T.HemisphereLight(0x9a8ce0, 0x4a3020, 0.9));
    const sun = new T.DirectionalLight(0xffb070, 0.8); sun.position.set(-6, 12, 6); scene.add(sun);
    const lamp = new T.PointLight(0xff9a4a, 1.1, 30, 1.6); lamp.position.set(0, 7, -9); scene.add(lamp);
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

    // Piso de tablones (por código): 9 × 26 m de arena y alrededor el mismo piso más oscuro
    const planks = (dark) => (g, w, h) => {
      g.fillStyle = dark ? '#2a1c16' : '#4a3122'; g.fillRect(0, 0, w, h);
      const n = 8, pw = w / n;
      for (let i = 0; i < n; i++) {
        for (let y = -(i * 37) % 128; y < h; y += 128) {
          const l = (dark ? 14 : 24) + Math.random() * (dark ? 8 : 14);
          g.fillStyle = `hsl(${22 + Math.random() * 10},${34 + Math.random() * 14}%,${l}%)`;
          g.fillRect(i * pw + 2, y + 2, pw - 4, 124);
          g.fillStyle = 'rgba(255,210,160,.07)'; g.fillRect(i * pw + 4, y + 6, pw - 8, 4);
          g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(i * pw + pw * 0.2, y + 18, 3, 3); g.fillRect(i * pw + pw * 0.75, y + 18, 3, 3);
        }
      }
    };
    const floorTex = canvasTex(256, 256, planks(false), 9 / 4.5, 26 / 4.5);
    const outerTex = canvasTex(256, 256, planks(true), 60 / 4.5, 40 / 4.5);
    const outer = mk(new T.PlaneGeometry(60, 40), new T.MeshLambertMaterial({ map: outerTex }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(0, -0.02, -6);
    const floor = mk(new T.PlaneGeometry(9, 26), new T.MeshLambertMaterial({ map: floorTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -8);
    // Borde de la arena (franja amarilla de seguridad, como el portón del galpón)
    const edgeM = keep(new T.MeshLambertMaterial({ color: L('#e0b23a') }));
    const edgeG = keep(new T.BoxGeometry(0.18, 0.06, 26));
    for (const sd of [-1, 1]) { const e = new T.Mesh(edgeG, edgeM); e.position.set(sd * 4.5, 0.03, -8); scene.add(e); }
    // Tarima al fondo, detrás de BIG CHAKY
    // Tarima al fondo: BIG CHAKY está parado arriba (los barriles bajan por el frente)
    const TD = TARIMA_FRONT - TARIMA_BACK;
    const tarima = mk(new T.BoxGeometry(12, TARIMA_H, TD), new T.MeshLambertMaterial({ map: canvasTex(256, 64, planks(false), 3, TD / 4) }));
    tarima.position.set(0, TARIMA_H / 2, (TARIMA_FRONT + TARIMA_BACK) / 2);
    const tarimaFront = mk(new T.PlaneGeometry(12, TARIMA_H), new T.MeshLambertMaterial({ color: L('#2a1810') }));
    tarimaFront.position.set(0, TARIMA_H / 2, TARIMA_FRONT + 0.01);
    // Fondo pintado de Ezeiza (Grupo F) o del galpón detrás de todo (sin niebla: es una pintura)
    const fondoKey = assets.has('arena_aeropuerto_fondo') ? 'arena_aeropuerto_fondo' : 'arena_fondo';
    const fondo = assets.meta(fondoKey), BW = 84, BH = BW * fondo.h / fondo.w, BZ = ARENA.bossZ - 6;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: assets.texture(fondoKey), fog: false }));
    back.position.set(0, BH / 2 - BH * 0.3, BZ);

    // Sprites (planos parados que miran a la cámara) con sombra redonda
    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(20,10,40,.6)'], [1, 'rgba(20,10,40,0)']]), transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0); // apoyado en el piso
    const unitC = keep(new T.PlaneGeometry(1, 1));                          // centrado (para girar)
    // Texturas recortadas del manotazo: el cuerpo sin la mano y la mano sola
    const slamMeta = assets.meta('arena_chaky_slam');
    const slamTop = keep(assets.texture('arena_chaky_slam').clone());
    slamTop.needsUpdate = true; slamTop.offset.set(0, 1 - SLAM_CUT); slamTop.repeat.set(1, SLAM_CUT);
    const handTex = canvasTex(HAND_CROP.w, HAND_CROP.h, (g) => {
      g.drawImage(assets.texture('arena_chaky_slam').image, HAND_CROP.x, HAND_CROP.y, HAND_CROP.w, HAND_CROP.h, 0, 0, HAND_CROP.w, HAND_CROP.h);
      try {
        const d = g.getImageData(0, 0, HAND_CROP.w, HAND_CROP.h), px = d.data;
        for (let i = 0; i < px.length; i += 4) if (px[i] - px[i + 2] < 38) px[i + 3] = 0; // no es piel (gris/negro)
        g.putImageData(d, 0, 0);
      } catch (_) {}
    });
    handTex.wrapS = handTex.wrapT = T.ClampToEdgeWrapping; handTex.repeat.set(1, 1);
    const CUSTOM = {
      arena_chaky_slamtop: { map: slamTop, w: slamMeta.w, h: slamMeta.h * SLAM_CUT, hk: SLAM_CUT },
      arena_chaky_hand: { map: handTex, w: HAND_CROP.w, h: HAND_CROP.h, hk: 1 }
    };
    const walkCols = assets.has('chaky_walk_sheet') ? (assets.meta('chaky_walk_sheet').cols || 6) : 0;
    if (walkCols) {
      const wm = assets.meta('chaky_walk_sheet');
      for (let i = 0; i < walkCols; i++) {
        const tx = keep(assets.texture('chaky_walk_sheet').clone());
        tx.needsUpdate = true; tx.repeat.set(1 / walkCols, 1); tx.offset.set(i / walkCols, 0);
        CUSTOM['arena_chaky_walk' + i] = { map: tx, w: wm.w / walkCols, h: wm.h, hk: 1 };
      }
    }
    const setTex = (m, key) => {
      if (m.userData.key === key) return;
      const c = CUSTOM[key], meta = c || assets.meta(key);
      m.material.map = c ? c.map : assets.texture(key); m.material.needsUpdate = true; m.userData.key = key;
      const h = m.userData.h * (c ? c.hk : (meta.hk || 1)); // hk: el salto con los brazos arriba es más alto
      m.userData.w = h * meta.w / meta.h; m.userData.hh = h; m.scale.set(m.userData.w, h, 1);
    };
    function sprite(key, h, shadow = 1, centered = false) {
      const m = new T.Mesh(centered ? unitC : unit, keep(new T.MeshBasicMaterial({ alphaTest: 0.45, side: T.DoubleSide })));
      m.userData.h = h; setTex(m, key); scene.add(m);
      if (shadow) { const s = new T.Mesh(shG, shM); s.scale.set(h * 0.8 * shadow, 1, h * 0.4 * shadow); s.renderOrder = 1; scene.add(s); m.userData.sh = s; }
      return m;
    }
    function place(m, x, y, z) {
      m.position.set(x, y, z);
      m.rotation.y = Math.atan2(cam.position.x - x, cam.position.z - z) * 0.6;
      const s = m.userData.sh; if (s) { s.position.set(x, 0.03, z); s.visible = m.visible; }
    }
    const B = sprite('arena_chaky_idle', BOSS_H, 0.9);
    const hand = sprite('arena_chaky_hand', HAND_W * HAND_CROP.h / HAND_CROP.w, 0); hand.visible = false;
    const P = sprite(heroPre + 'idle', HERO_H);
    // Mano del manotazo: sombra que crece en el piso donde va a caer
    const handM = keep(new T.MeshBasicMaterial({ map: radial([[0, 'rgba(8,2,16,.92)'], [0.6, 'rgba(8,2,16,.6)'], [1, 'rgba(8,2,16,0)']]), transparent: true, depthWrite: false }));
    const handSh = new T.Mesh(shG, handM); handSh.renderOrder = 2; handSh.visible = false; scene.add(handSh);
    // Proyectiles: barriles (dorados con halo que late) y cajones con anillo rojo en el punto de caída
    const haloTex = radial([[0, 'rgba(255,214,90,.95)'], [0.45, 'rgba(255,170,40,.45)'], [1, 'rgba(255,150,30,0)']]);
    const ringG = keep(new T.RingGeometry(0.55, 0.78, 28)); ringG.rotateX(-Math.PI / 2);
    const GOLD = L('#ffcc33'), WHITE = new T.Color(1, 1, 1);
    const pool = { barrel: [], crate: [], giant: [] }, live = new Map();
    function take(kind) {
      const p = pool[kind].pop();
      if (p) { p.m.visible = true; return p; }
      const isB = kind !== 'crate';
      const m = sprite(isB ? 'arena_barril' : 'arena_cajon', kind === 'giant' ? GIANT_H : isB ? BARREL_H : CRATE_H, kind === 'giant' ? 1.2 : 0.7, true);
      const e = { kind, m };
      if (isB) {
        e.halo = new T.Sprite(keep(new T.SpriteMaterial({ map: haloTex, blending: T.AdditiveBlending, transparent: true, depthWrite: false })));
        e.halo.visible = false; scene.add(e.halo);
        // aviso en el piso: dónde se mete el de curva y el carril del gigante
        e.ring = new T.Mesh(ringG, keep(new T.MeshBasicMaterial({ color: L('#ff7a2e'), transparent: true, opacity: 0.8, depthWrite: false })));
        e.ring.renderOrder = 2; e.ring.visible = false; scene.add(e.ring);
      } else {
        e.ring = new T.Mesh(ringG, keep(new T.MeshBasicMaterial({ color: L('#ff4d5e'), transparent: true, opacity: 0.85, depthWrite: false })));
        e.ring.renderOrder = 2; scene.add(e.ring);
      }
      return e;
    }
    function drop(e) {
      e.m.visible = false; if (e.m.userData.sh) e.m.userData.sh.visible = false;
      if (e.halo) e.halo.visible = false;
      if (e.ring) e.ring.visible = false;
      pool[e.kind].push(e);
    }

    // Carteles propios: solo el fogonazo y los textos que flotan
    const ui = document.createElement('div'); ui.id = 'arena-ui';
    ui.innerHTML = '<div class="piu hidden"><div class="lanes">' + PIU_LANES.map((l, i) => '<div class="lane l' + i + '" data-lane="' + i + '"><b class="rec">' + l + '</b></div>').join('') + '</div><div class="piu-judge"></div></div>' +
      '<div class="arena-flash"></div><div class="chaky-sign hidden"><b class="ico"></b><span class="txt"></span><i class="timer"><i></i></i></div>' +
      '<div class="phase-card hidden"><small></small><b></b><span></span><em hidden></em></div><div class="dice-dots hidden"></div><div class="dice-verdict hidden"></div>';
    document.body.append(ui); document.body.classList.add('arena-on');
    const flashE = ui.querySelector('.arena-flash');
    const signE = ui.querySelector('.chaky-sign'), signIco = signE.querySelector('.ico'), signTxt = signE.querySelector('.txt');
    // Cambio de fase bien evidente: cartel grande en el centro (número, nombre y qué hay que hacer)
    const cardE = ui.querySelector('.phase-card'), dotsE = ui.querySelector('.dice-dots'), verdictE = ui.querySelector('.dice-verdict');
    const timerE = signE.querySelector('.timer i');
    const PHASE_CARDS = {
      1: ['FASE 1', '¡BARRILES!', 'Devolvele los dorados 👊'],
      2: ['FASE 2', '¡CLASE DE BAILE!', '«Si querés a Margot, vas a tener que seguirme el ritmo»', 'Tocá cada flecha cuando llega arriba'],
      3: ['FASE 3', '¡ENOJADO!', 'Pegale a la mano trabada 👊']
    };
    let cardTimer = 0, verdictTimer = 0;
    function phaseCard(n, secs = 2.2) {
      if (speech && speech.t < speech.life) speech.t = speech.life; // el cartel de fase no se tapa con frases
      const [a, b, c, d2] = PHASE_CARDS[n];
      fillText(cardE.querySelector('small'), a); fillText(cardE.querySelector('b'), b); fillText(cardE.querySelector('span'), c);
      const em = cardE.querySelector('em'); if (d2) { fillText(em, d2); em.hidden = false; } else em.hidden = true;
      cardE.className = 'phase-card p' + n; void cardE.offsetWidth; cardE.classList.add('on');
      clearTimeout(cardTimer); cardTimer = setTimeout(() => cardE.classList.add('hidden'), secs * 1000);
    }
    // El botón que hay que tocar late; con ¡QUIETO! se apagan todos
    const touchE = document.getElementById('touch');
    function wantButton(cmd) {
      for (const b of document.querySelectorAll('#touch .act')) b.classList.toggle('want', !!cmd && b.dataset.action === cmd);
      touchE?.classList.toggle('want-still', cmd === 'still');
    }
    function renderDots() {
      const d = logic.state.dice;
      if (!d) { dotsE.classList.add('hidden'); return; }
      dotsE.classList.remove('hidden');
      dotsE.innerHTML = Array.from({ length: d.total }, (_, i) => '<i class="' + (d.res[i] || (i === d.round ? 'now' : '')) + '"></i>').join('');
    }
    function verdict(ok) {
      fillText(verdictE, ok ? '¡BIEN!' : '¡NO!');
      verdictE.className = 'dice-verdict ' + (ok ? 'ok' : 'bad'); void verdictE.offsetWidth; verdictE.classList.add('on');
      clearTimeout(verdictTimer); verdictTimer = setTimeout(() => verdictE.classList.add('hidden'), 650);
    }
    // Cartel de la clase: el paso que muestra Chaky, o «¡TU TURNO!» con la fila de pasos (los hechos con ✔)
    // ---------- Clase de baile (Pump It Up) ----------
    const piuE = ui.querySelector('.piu'), lanesE = piuE.querySelector('.lanes'), judgeE = piuE.querySelector('.piu-judge');
    const laneEls = [...piuE.querySelectorAll('.lane')], noteEls = new Map();
    let piuOn = false, judgeTimer = 0, piuRound = -1;
    let laneHeight = 0, viewportHeight = 0, viewportWidth = 0;
    function piuTap(lane) {
      if (!piuOn || game.state !== 'arena') return;
      laneEls[lane].classList.remove('press'); void laneEls[lane].offsetWidth; laneEls[lane].classList.add('press');
      handle(logic.tap(lane));
    }
    for (const el of laneEls) el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); piuTap(+el.dataset.lane); });
    const onKey = (ev) => {
      if (!piuOn || game.state !== 'arena' || !(ev.code in PIU_KEYS)) return;
      ev.preventDefault();
      if (!ev.repeat) piuTap(PIU_KEYS[ev.code]);
    };
    addEventListener('keydown', onKey);
    function piuPulse(lane) { const r = laneEls[lane].querySelector('.rec'); r.classList.remove('beat'); void r.offsetWidth; r.classList.add('beat'); }
    function piuText(txt, cls) {
      fillText(judgeE, txt); judgeE.className = 'piu-judge ' + cls; void judgeE.offsetWidth; judgeE.classList.add('on');
      clearTimeout(judgeTimer); judgeTimer = setTimeout(() => judgeE.classList.remove('on'), 500);
    }
    function piuJudge(e) {
      if (e.grade === 'empty') return; // tocar donde no hay flecha no castiga
      if (e.grade === 'miss') { piuText('¡FALLÓ!', 'bad'); return; }
      piuText(tr(e.grade === 'perfect' ? '¡PERFECTO!' : '¡BIEN!') + (e.combo > 1 ? ' ×' + e.combo : ''), e.grade);
      sfx(e.grade === 'perfect' ? 'perfect' : 'pickup');
      if (y <= 0) vy = CHASE.jump * 0.45; // el héroe baila: saltito en cada paso
    }
    function piuDraw() {
      const d = logic.state.dice, show = logic.state.mode === 'dice' && !!d;
      if (show !== piuOn) {
        piuOn = show; piuE.classList.toggle('hidden', !show); document.body.classList.toggle('piu-on', show);
        if (!show) { for (const el of noteEls.values()) el.remove(); noteEls.clear(); piuRound = -1; laneHeight = 0; }
      }
      if (!show) return;
      if (d.round !== piuRound) { for (const el of noteEls.values()) el.remove(); noteEls.clear(); piuRound = d.round; renderDots(); }
      if (!laneHeight || innerHeight !== viewportHeight || innerWidth !== viewportWidth) {
        viewportHeight = innerHeight; viewportWidth = innerWidth;
        laneHeight = lanesE.clientHeight;
      }
      const H = laneHeight, recY = 8, speed = (H - recY) / ARENA.dice.travel;
      d.notes.forEach((n, i) => {
        let el = noteEls.get(i);
        if (n.judged && n.judged !== 'miss') { if (el) { el.remove(); noteEls.delete(i); } return; }
        const top = recY + (n.time - d.t) * speed;
        if (top > H + 40 || top < -70) { if (el && top < -70) { el.remove(); noteEls.delete(i); } return; }
        if (!el) { el = document.createElement('b'); el.className = 'note l' + n.lane; el.textContent = PIU_LANES[n.lane]; laneEls[n.lane].append(el); noteEls.set(i, el); }
        el.style.transform = 'translateY(' + top + 'px)';
        el.classList.toggle('missed', n.judged === 'miss');
      });
    }
    function showSign(cmd, cls = '') {
      signE.className = 'chaky-sign ' + cls;
      if (cmd) { signIco.textContent = DANCE_SIGN[cmd][0]; fillText(signTxt, DANCE_SIGN[cmd][1]); }
      else { signIco.textContent = '?'; signTxt.textContent = ''; }
    }
    const bar = document.querySelector('#boss-bar'), fill = document.querySelector('#boss-fill');
    const barName = bar?.querySelector('span');
    const setBarName = () => { if (barName) barName.textContent = tr('BIG CHAKY') + ' · ' + (logic.state.phase === 'ko' ? 3 : logic.state.phase) + '/3'; };
    if (bar) { setBarName(); bar.classList.remove('hidden'); }
    const setBar = () => { if (fill) fill.style.width = (100 * logic.state.hp / logic.state.hpMax).toFixed(1) + '%'; };
    setBar();
    const pops = [], seen = new Set(), scratch = new T.Vector3();
    const pop = (x, y, z, txt, col = '#ffd36e', size = 22, life = 1.1) => {
      const e = document.createElement('div'); e.className = 'pop'; fillText(e, txt); e.style.color = col; e.style.fontSize = size + 'px';
      if (txt.length > 18) { e.style.whiteSpace = 'normal'; e.style.width = 'min(86vw, 340px)'; e.style.textAlign = 'center'; } // las frases largas van en dos renglones
      const q = { e, v: new T.Vector3(x, y, z), t: 0, life, w: e.offsetWidth }; // ancho medido una vez
      ui.append(e); pops.push(q); return q;
    };
    const sfx = (n) => { try { audio.sfx(n); } catch (_) {} };
    let flashTimer = 0;
    const flash = (col, op = 0.45) => {
      flashE.style.background = col; flashE.style.opacity = String(op);
      clearTimeout(flashTimer); flashTimer = setTimeout(() => { flashE.style.opacity = '0'; }, 110);
    };

    // Estado del héroe y de la escena
    let x = 0, z = -1.5, y = 0, vy = 0, t = 0;
    let phase = 'entrance', phaseT = 0, ended = false, closing = false;
    let dashT = 0, dashCd = 0, dashX = 0, dashZ = 0, inv = 0, hurtT = 0, holdT = 0, powT = 0;
    let swing = null, swingT = 0, swingHit = false, combo = 0, comboWindow = 0, buffer = 0;
    let shakeT = 0, shakeA = 0, freezeT = 0, bossFlash = 0, moving = false, heroPose = 'idle', bossKey = 'arena_chaky_idle';
    let prevPose = 'idle', poseT = 0, stepT = 0;
    game.state = 'arena';

    const shake = (a, s = 0.3) => { shakeA = Math.max(shakeA, a); shakeT = Math.max(shakeT, s); };
    // Frases y puntos de BIG CHAKY a la altura del pecho: no le tapan la cara
    const bossChest = () => new T.Vector3(logic.state.bossX, TARIMA_H + B.userData.hh * 0.38, ARENA.bossZ); // según la pose que se ve
    function addPts(n, px, py, pz) {
      const before = game.score.total; game.score.addFlat(n); // valores fijos del spec, sin multiplicador
      pop(px, py, pz, '+' + (game.score.total - before), '#ffd36e', 24);
    }
    function charge(a) { hero.power = Math.min(1, hero.power + a); }

    // Voz + globo de BIG CHAKY (voice.js decide si habla: prioridad, sin repetir, esperas)
    let speech = null;
    function speak(event) {
      const text = voice.say('chaky', event);
      if (!text || !cardE.classList.contains('hidden')) return; // con el cartel de fase en pantalla solo se escucha
      // un solo globo de Chaky a la vez: el nuevo reemplaza al anterior (antes se pisaban)
      if (speech && speech.t < speech.life) speech.t = Math.max(speech.t, speech.life - 0.12);
      const p = bossChest(); speech = pop(p.x, p.y, p.z, text, '#ffffff', 28, 1.9);
    }
    function handle(evs) {
      for (const e of evs) {
        switch (e.type) {
          case 'hurt':
            hero.hp = Math.max(0, hero.hp - 1); game.score.takeDamage(); game.combo?.reset?.();
            hurtT = HURT_POSE; inv = INV; swing = null; buffer = 0;
            flash('#ff4d5e', 0.45); shake(0.35, 0.35); sfx('hurt');
            if (hero.hp > 0) speak('taunt');
            if (hero.hp <= 0 && phase === 'fight') { phase = 'down'; phaseT = 0; }
            break;
          case 'dodge':
            addPts(ARENA.points.dodge, x, 2.8, z); charge(POWER.dodge); sfx('pickup');
            break;
          case 'returned':
            addPts(e.gold ? ARENA.points.returned : ARENA.points.returnedWhite, x, 3, z - 1); charge(e.gold ? POWER.finisher : POWER.hit * 2); sfx('hitHeavy'); shake(e.gold ? 0.25 : 0.12, 0.2);
            break;
          case 'handHit':
            addPts(ARENA.points.hand, x, 2.6, z - 0.8); charge(POWER.hit); sfx('hit'); freezeT = 0.07; shake(0.25, 0.2);
            break;
          case 'bossHit':
            setBar(); bossFlash = 0.18; flash('#fff2c4', 0.22);
            if (e.by !== 'dice' && e.by !== 'barrel') speak('hurt');
            break;
          case 'phase':
            setBarName(); showSign(null, 'hidden'); phaseCard(e.to, e.to === 2 ? ARENA.dice.start : ARENA.transition + 0.6);
            if (e.to === 2) {
              input.reset();
              flash('#ffd36e', 0.35); shake(0.3, 0.4); sfx('roar');
              ui.classList.add('dice-mode'); renderDots();
              try { audio.music('byd', { fade: 0.3 }); } catch (_) {} // otra música: cambió el juego
            }
            break;
          case 'voice': speak(e.event); break;
          case 'danceBeat': sfx('tick'); piuPulse(e.lane); break;
          case 'danceStep': piuJudge(e); break;
          case 'diceResult':
            verdict(e.ok); renderDots(); piuText((e.hits + '/' + e.of), e.ok ? 'ok' : 'bad');
            if (e.ok) { addPts(ARENA.points.dice, x, 3, z - 1); charge(POWER.hit); sfx('hitHeavy'); shake(0.2, 0.2); }
            else sfx('boo');
            break;
          case 'heal':
            hero.hp = Math.min(hero.hpMax || hero.hp + 1, hero.hp + 1);
            pop(x, HERO_H + 0.8, z, '+❤', '#ff6b8a', 34, 1.4); sfx('pickup');
            break;
          case 'rage':
            input.reset();
            setBar(); setBarName(); showSign(null, 'hidden'); flash('#ff7a2e', 0.4); shake(0.5, 0.8); sfx('roar');
            wantButton(null); ui.classList.remove('dice-mode'); dotsE.classList.add('hidden');
            try { audio.music('boss', { fade: 0.3 }); } catch (_) {}
            break;
          case 'ko': {
            setBar(); flash('#ffffff', 0.6); shake(0.6, 0.9); sfx('ko');
            const before = game.score.total; game.score.addKill('boss');
            pop(logic.state.bossX, TARIMA_H + B.userData.hh * 0.38, ARENA.bossZ, '+' + (game.score.total - before), '#ffd36e', 34, 1.6);
            bar?.classList.add('hidden');
            phase = 'ko'; phaseT = 0;
            break;
          }
          case 'throw':
            sfx(e.shot === 'giant' ? 'roar' : 'whoosh');
            if (Math.random() < 0.25) speak('attack');
            break;
          case 'slam': shake(0.5, 0.4); sfx('slam'); break;
        }
      }
    }

    function usePower() {
      hero.power = 0; holdT = 0; powT = 1.0;
      pop(x, HERO_H + 0.9, z, isM ? '¡HIEDRA!' : '¡VERDADES A LOS GRITOS!', isM ? '#7ee0c3' : '#ffd36e', 30, 1.5);
      sfx('power'); flash(isM ? '#7ee0c3' : '#ffd36e', 0.4); shake(0.4, 0.5);
      handle(logic.power());
    }
    function startSwing() {
      buffer = 0;
      combo = comboWindow > 0 ? (combo + 1) % 3 : 0;
      swing = SWINGS[combo]; swingT = 0; swingHit = false;
      sfx(combo === 2 ? 'hitHeavy' : 'swing');
    }
    // Salida con la cortina (se tapa, cambia la escena y se destapa)
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
      t += dt; phaseT += dt;
      if (freezeT > 0) { freezeT -= dt; draw(dt); updateHud(dt); return; } // pausa corta al pegarle a la mano
      inv = Math.max(0, inv - dt); dashCd = Math.max(0, dashCd - dt); comboWindow = Math.max(0, comboWindow - dt);
      buffer = Math.max(0, buffer - dt);
      if (hurtT > 0) hurtT -= dt;
      if (powT > 0) powT -= dt;
      moving = false;
      const dancing = logic.state.phase === 2;
      if (phase === 'fight' && !dancing) {
        // Controles
        if (input.consume('jump')) { if (y <= 0) { vy = CHASE.jump; sfx('jump'); } handle(logic.act('jump')); }
        if (input.consume('dodge') && dashCd <= 0 && dashT <= 0) {
          dashT = CHASE.dash.t; dashCd = CHASE.dash.cd;
          const mx = input.moveX, mz = input.moveZ, len = Math.hypot(mx, mz);
          if (len > 0.2) { dashX = mx / len; dashZ = mz / len; } else { dashX = x > 0 ? -1 : 1; dashZ = 0; }
          sfx('dodge');
          handle(logic.act('dodge'));
        }
        if (input.pressed('attack')) { holdT += dt; if (hero.power >= 1 && holdT >= POWER.hold) usePower(); } else holdT = 0;
        if (input.consume('attack')) { handle(logic.act('attack')); if (!swing) startSwing(); else buffer = 0.2; }
        if (input.consume('power') && hero.power >= 1) usePower();
        // Movimiento
        let vx, vz;
        if (dashT > 0) { dashT -= dt; vx = dashX * DASH_SPEED; vz = dashZ * DASH_SPEED; }
        else {
          const mx = input.moveX, mz = input.moveZ, len = Math.max(1, Math.hypot(mx, mz));
          const slow = swing ? 0.35 : 1;
          vx = mx / len * MOVE * slow; vz = mz / len * MOVE * slow;
          moving = Math.hypot(mx, mz) > 0.15;
        }
        x = Math.max(-ARENA.xMax, Math.min(ARENA.xMax, x + vx * dt));
        z = Math.max(ARENA.zFar, Math.min(ARENA.zNear, z + vz * dt));
        // Combo de 3 con los tiempos de hero.js
        if (swing) {
          swingT += dt;
          if (!swingHit && swingT >= swing.hitAt) {
            swingHit = true;
            handle(logic.punch({ x, z, reach: swing.reach, dmg: swing.dmg }));
          }
          if (swing && swingT >= swing.dur) { swing = null; comboWindow = COMBO_WINDOW; if (buffer > 0) startSwing(); }
        }
      } else {
        dashT = 0; swing = null; holdT = 0; buffer = 0;
        if (dancing) {
          for (const action of ['jump', 'attack', 'dodge', 'power']) input.consume(action);
        }
      }
      hero.holdT = holdT;
      vy -= CHASE.gravity * dt; y = Math.max(0, y + vy * dt); if (y <= 0) vy = Math.max(0, vy);

      // La lógica de BIG CHAKY (se congela si el héroe cayó)
      if (phase === 'entrance' && phaseT >= ENTRANCE) { phase = 'fight'; phaseT = 0; sfx('roar'); shake(0.35, 0.45); phaseCard(1, 2.0); setTimeout(() => { if (!disposed) speak('intro'); }, 2100); }
      if (phase === 'fight') handle(logic.update(dt, { x, z, y, moving: moving || dashT > 0, dodging: dashT > 0, inv: inv > 0 || powT > 0 }));
      if (phase === 'fight' && hero.hp <= 0) { phase = 'down'; phaseT = 0; }
      else if (phase === 'ko') logic.update(dt, { x, z, y, dodging: false, inv: true });

      if (phase === 'ko' && phaseT >= END_DELAY) return close(true);
      if (phase === 'down' && phaseT >= END_DELAY) return close(false);
      draw(dt);
      updateHud(dt);
    }

    function draw(dt) {
      const S = logic.state;
      // Cámara detrás y arriba del héroe, mirando a BIG CHAKY
      shakeT = Math.max(0, shakeT - dt); if (shakeT <= 0) shakeA = 0;
      const sh = shakeA * Math.min(1, shakeT * 4);
      // Entrada: la cámara baja desde arriba y atrás hasta su lugar
      const k = phase === 'entrance' ? Math.max(0, 1 - phaseT / ENTRANCE) : 0, e = k * k * (3 - 2 * k);
      if (S.phase === 2) {
        cam.position.set(0, DANCE_CAM.y, DANCE_CAM.z);
        cam.lookAt(0, DANCE_CAM.lookY, ARENA.bossZ);
      } else {
        cam.position.set(x * (innerWidth < innerHeight * 0.9 ? 0.7 : 0.4) + (Math.random() - 0.5) * sh, CAM.y + e * 7 + (Math.random() - 0.5) * sh, z + CAM.back + e * 9);
        cam.lookAt(0, CAM.lookY + e * 2, ARENA.bossZ);
      }
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? CAM.fovPortrait : CAM.fov; cam.updateProjectionMatrix();

      // BIG CHAKY: la pose de la lógica, salvo en el manotazo (una sola mano a la vista):
      // - aviso (y preparación): pose `rage`, la mano todavía arriba; solo la sombra en el piso anuncia dónde cae
      // - mano abajo / trabada / subiendo: el `slam` recortado sin la mano (el corte queda bajo la tarima) y la mano
      //   suelta dibujada donde está de verdad, en (hand.x, hand.z); ahí también tapa el `hurt` de la lógica
      const H = S.hand, handOut = H.state === 'down' || H.state === 'stuck' || H.state === 'up';
      let pose = S.pose;
      if (pose !== 'ko') {
        if (handOut) pose = 'slamtop';
        else if (pose === 'slam') pose = 'rage';
      }
      if (pose !== prevPose) { prevPose = pose; poseT = 0; }
      poseT += dt;
      const bvx = dt > 0 ? (S.bossX - (B.userData.prevX ?? S.bossX)) / dt : 0;
      B.userData.prevX = S.bossX;
      const walking = pose === 'idle' && walkCols > 0 && Math.abs(bvx) > 0.35;
      let bx = S.bossX, by = 0, rz = 0, sx = 1, sy = 1;
      if (walking) {
        B.userData.stepT = (B.userData.stepT || 0) + dt * 9;
        bossKey = 'arena_chaky_walk' + (Math.floor(B.userData.stepT) % walkCols);
        sx = bvx < 0 ? -1 : 1;
        by = Math.abs(Math.sin(B.userData.stepT * Math.PI)) * 0.22;
        rz = -Math.sign(bvx) * 0.04;
      } else {
        bossKey = 'arena_chaky_' + pose;
        if (!CUSTOM[bossKey] && !assets.has(bossKey)) {
          const fallback = 'arena_chaky_' + DANCE_FALLBACK[pose];
          bossKey = assets.has(fallback) ? fallback : 'arena_chaky_idle';
        }
      }
      setTex(B, bossKey);
      if (pose === 'throw') { const k = Math.min(1, poseT / 0.55); by = Math.abs(Math.sin(k * Math.PI)) * 0.48; sy = 1 + Math.sin(k * Math.PI) * 0.07; rz = Math.sin(poseT * 10) * 0.07; }
      else if (pose === 'slamtop') { by = -0.25; if (H.state === 'stuck') { bx += (Math.random() - 0.5) * 0.18; by += Math.random() * 0.05; } } // forcejea con la mano trabada
      else if (pose === 'rage') { bx += Math.sin(t * 40) * 0.12; sy = 1 + Math.sin(t * 12) * 0.04; sx = 1 + Math.cos(t * 12) * 0.03; }
      else if (pose === 'hurt') { rz = Math.sin(poseT * 24) * 0.09; sy = 0.94; sx = 1.06; }
      else if (pose === 'idle' && !walking) { sy = 1 + Math.sin(t * 2.4) * 0.02; by = Math.abs(Math.sin(t * 1.2)) * 0.06; }
      else if (pose === 'dance_idle') { sy = 1 + Math.sin(t * 6.5) * 0.025; by = Math.abs(Math.sin(t * 3.25)) * 0.14; rz = Math.sin(t * 3.25) * 0.04; }
      else if (pose === 'dance_jump') { by = 0.75 + Math.sin(Math.min(1, poseT / 0.35) * Math.PI) * 0.5; sy = 1.06; }
      else if (pose === 'dance_attack') { if (S.dice?.step === 3) sx = -1; by = 0.12; sy = 1.04; }
      else if (pose === 'dance_dodge') { if (S.dice?.step === 0) sx = -1; sy = 0.96; }
      else if (pose === 'dance_laugh') { sy = 1 + Math.sin(t * 16) * 0.04; by = Math.abs(Math.sin(t * 8)) * 0.16; }
      place(B, bx, TARIMA_H + by, ARENA.bossZ);
      B.scale.set(B.userData.w * sx, B.userData.hh * sy, 1); B.rotation.z = rz;
      bossFlash = Math.max(0, bossFlash - dt);
      B.material.color.setRGB(1, bossFlash > 0 ? 0.55 : 1, bossFlash > 0 ? 0.55 : 1);
      B.userData.sh.position.y = TARIMA_H + 0.02; B.userData.sh.scale.set(8, 1, 3);

      // Héroe de espaldas
      const hasDodge = assets.has(heroPre + 'dodge');
      heroPose = hurtT > 0 || phase === 'down' ? 'hurt' : swing || powT > 0 ? 'punch' : dashT > 0 && hasDodge ? 'dodge' : moving || y > 0.15 || dashT > 0 ? 'run' : 'idle';
      // Carrera de espaldas: 4 cuadros (~10 por segundo) con un rebote chico; en el aire, la pose de salto; al esquivar, la pose de esquive
      let bob = 0, lean = 0, key = heroPre + heroPose, hsx = 1;
      if (heroPose === 'dodge') {
        bob = 0.18;
        hsx = dashX < 0 ? -1 : 1;
      } else if (heroPose === 'run') {
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
      P.userData.sh.visible = true; P.userData.sh.scale.set(1.6 * (1 - Math.min(0.5, y * 0.2)), 1, 0.8);

      // Mano: sombra que crece durante el aviso; la mano cae desde arriba, tiembla trabada y se levanta
      if (handOut) {
        hand.visible = true;
        let hy = 0, hx = H.x;
        if (H.state === 'down') hy = HAND_FALL * Math.max(0, 1 - H.t / 0.15);
        else if (H.state === 'up') hy = HAND_FALL * Math.min(1, H.t / 0.4);
        else { hx += (Math.random() - 0.5) * 0.12; hy = Math.random() * 0.04; }
        place(hand, hx, hy, H.z - 0.35); // un poco detrás del punto: el héroe parado ahí queda adelante
        hand.rotation.z = H.state === 'stuck' ? Math.sin(t * 30) * 0.03 : 0;
      } else hand.visible = false;
      if (H.state === 'none') handSh.visible = false;
      else {
        handSh.visible = true; handSh.position.set(H.x, 0.04, H.z);
        let s = 2.8, op = 1;
        if (H.state === 'warn') { const k = Math.min(1, H.t / ARENA.phase3.slamWarn); s = 0.6 + 2.2 * k; op = 0.45 + 0.55 * k; }
        else if (H.state === 'up') { const k = Math.min(1, H.t / 0.4); op = 1 - k; }
        else s = 2.8 + Math.sin(t * 18) * 0.06;
        handSh.scale.set(s, 1, s); handM.opacity = op;
      }

      // Barriles y cajones
      seen.clear();
      for (const s of S.shots) {
        seen.add(s.id);
        let e = live.get(s.id);
        if (!e) {
          e = take(s.type === 'giant' ? 'giant' : s.kind); live.set(s.id, e);
          if (s.kind === 'crate') e.from = { x: S.bossX, y: TARIMA_H + BOSS_H * 0.85, z: ARENA.bossZ + 0.5 };
        }
        if (s.kind === 'barrel') {
          e.m.material.color.copy(s.gold ? GOLD : WHITE);
          const by0 = s.z < TARIMA_FRONT ? TARIMA_H : 0; // ruedan por la tarima y bajan
          const bh = s.type === 'giant' ? GIANT_H : BARREL_H;
          place(e.m, s.x, bh / 2 + by0 + (s.y || 0), s.z);
          if (e.m.userData.sh) { const k = 1 - Math.min(0.6, (s.y || 0) * 0.3); e.m.userData.sh.scale.set(bh * 0.56 * k, 1, bh * 0.28 * k); }
          // aviso en el piso: la curva marca su carril final; el gigante, el suyo
          const warnZ = -3.5, warn = !s.returning && (s.type === 'curve' || s.type === 'giant') && s.z < warnZ;
          e.ring.visible = warn;
          if (warn) { e.ring.position.set(s.type === 'curve' ? s.x1 : s.x, 0.05, warnZ); e.ring.scale.setScalar(s.type === 'giant' ? 2.6 : 1.3 + Math.sin(t * 12) * 0.12); }
          if (e.m.userData.sh) e.m.userData.sh.position.y = by0 + 0.03;
          e.m.rotation.z -= dt * (s.returning ? -14 : s.type === 'giant' ? 4 : 9);
          e.halo.visible = s.gold;
          if (s.gold) { const p = 1.9 + Math.sin(t * 10) * 0.35; e.halo.position.set(s.x, BARREL_H / 2 + by0 + (s.y || 0), s.z + 0.05); e.halo.scale.set(p, p, 1); e.halo.material.opacity = 0.65 + Math.sin(t * 10) * 0.25; }
        } else {
          const k = Math.max(0, Math.min(1, 1 - s.y / 8));
          const cx = e.from.x + (s.x - e.from.x) * k, cz = e.from.z + (s.z - e.from.z) * k;
          const cy = e.from.y * (1 - k) + Math.sin(Math.PI * k) * 2.5 + CRATE_H / 2; // sale de sus manos en arco
          place(e.m, cx, cy, cz);
          e.m.rotation.z += dt * 5;
          if (e.m.userData.sh) { e.m.userData.sh.position.set(s.x, 0.03, s.z); e.m.userData.sh.scale.set(0.6 + k, 1, 0.4 + 0.6 * k); }
          e.ring.visible = true; e.ring.position.set(s.x, 0.05, s.z); e.ring.scale.setScalar(1.6 - 0.7 * k); e.ring.material.opacity = 0.35 + 0.55 * k;
        }
      }
      for (const [id, e] of live) if (!seen.has(id)) { drop(e); live.delete(id); }

      // Cartel de «Chaky dice»: sobre las manos de BIG CHAKY
      piuDraw();
      { const d = logic.state.dice; timerE.style.width = d && d.stage === 'turn' ? Math.max(0, 100 * (1 - d.t / ARENA.dice.stepWindow)) + '%' : '0%'; }
      if (!signE.classList.contains('hidden')) {
        const sp = scratch.set(B.position.x, B.position.y + B.userData.hh * 0.93, B.position.z).project(cam);
        signE.style.left = ((sp.x + 1) / 2 * innerWidth) + 'px'; signE.style.top = ((1 - sp.y) / 2 * innerHeight) + 'px';
      }
      // Textos que flotan
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i]; q.t += dt; q.v.y += dt * 0.8;
        const sp = scratch.copy(q.v).project(cam);
        const half = Math.min(innerWidth / 2, q.w / 2 + 18); // las frases largas no se cortan en el borde
        q.e.style.left = Math.max(half, Math.min(innerWidth - half, (sp.x + 1) / 2 * innerWidth)) + 'px'; q.e.style.top = (1 - sp.y) / 2 * innerHeight + 'px';
        q.e.style.opacity = String(Math.max(0, Math.min(1, (q.life - q.t) / 0.35)));
        if (q.t > q.life) { q.e.remove(); pops.splice(i, 1); }
      }
    }

    // Alto en pantalla (px, de arriba hacia abajo) de BIG CHAKY y del héroe: para las pruebas de tamaño
    function screenBoxes() {
      const py = (m, k) => (1 - scratch.set(m.position.x, m.position.y + m.userData.hh * k, m.position.z).project(cam).y) / 2 * innerHeight;
      return { boss: { top: py(B, 1), face: py(B, 0.85), feet: py(B, 0) }, hero: { top: py(P, 1), feet: py(P, 0) } };
    }

    let disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(flashTimer);
      clearTimeout(cardTimer); clearTimeout(verdictTimer); clearTimeout(judgeTimer); wantButton(null);
      removeEventListener('keydown', onKey); document.body.classList.remove('piu-on');
      ui.remove(); document.body.classList.remove('arena-on');
      bar?.classList.add('hidden');
      for (const o of own) o.dispose?.();
      if (cur === inst) cur = null;
    }

    // La lógica que se expone (pruebas e2e): lo que devuelve pasa por los mismos efectos que en el juego
    const exposed = {
      get state() { return logic.state; },
      punch: (area) => { const evs = logic.punch(area); handle(evs); return evs; },
      power: () => { const evs = logic.power(); handle(evs); return evs; },
      act: (k) => { const evs = logic.act(k); handle(evs); return evs; },
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
          ...S, shots: S.shots.map(s => ({ ...s })), hand: { ...S.hand },
          hero: { x, z, y, pose: heroPose, tex: P.userData.key }, bossTex: bossKey,
          hp: hero.hp, power: hero.power, scene: phase,
          screen: screenBoxes()
        };
      }
    };
    draw(0);
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
