// «La fuga de Cepi»: tramo del boulevard que se juega hacia el fondo (estilo Crash Bandicoot Warped).
// Cepi se escapa con la llave en su BYD tirando pelotazos; el héroe lo persigue en su vehículo
// (Douge en el Hongo móvil, Marine en la Maceta móvil). Corre solo: el joystick dobla, SALTO salta,
// 👊 rompe cosas, ESQUIVE da invulnerabilidad corta y manteniendo 👊 con la barra llena sale el poder.
// Al final el BYD se queda sin batería en un cargador y arranca la pelea con Cepi (oleada «boulevard»).
// Usa el mismo renderer, HUD, carteles, controles y sonidos que el resto del juego.

export const CHASE = {
  length: 760,        // metros hasta el cargador
  lane: 2.6, xMax: 3.7,
  speed: 16, speedGain: 5,
  steer: 10, jump: 10.2, gravity: 27,
  dash: { t: 0.36, cd: 1.05, speed: 15 },
  throwEvery: [2.6, 4], windup: 0.95, ballTime: 1.05,
  pickup: 50, catchBonus: 500
};

// Obstáculos: low = se salta; smash = puntos al romperlo con 👊 (0 = no se rompe)
const OBST = {
  table: { tex: 'chase_ob_table', h: 1.9, w: 1.25, low: false, smash: 150 },
  barricade: { tex: 'chase_ob_barricade', h: 2.5, w: 2.4, low: false, smash: 0 },
  scooter: { tex: 'chase_ob_scooter', h: 0.9, w: 1.2, low: true, smash: 120 },
  butter: { tex: 'chase_ob_butter', h: 0.55, w: 1.3, low: true, smash: 0, slip: true },
  pigeons: { tex: 'chase_ob_pigeons', h: 1.1, w: 1.25, low: true, smash: 100, birds: true }
};

// Pista fija (misma para todos): siempre queda un carril libre
export function buildTrack(seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const obstacles = [], pickups = [];
  for (let at = 70; at < CHASE.length - 70; at += 20 + rnd() * 12) {
    const r = rnd();
    const kind = r < 0.22 ? 'table' : r < 0.38 ? 'barricade' : r < 0.58 ? 'scooter' : r < 0.78 ? 'butter' : 'pigeons';
    const lane = Math.floor(rnd() * 3) - 1;
    let x = lane * CHASE.lane;
    if (kind === 'barricade') x = (rnd() < 0.5 ? -1 : 1) * CHASE.lane * 0.5; // tapa dos carriles
    obstacles.push({ kind, x, s: at });
    if (OBST[kind].low && rnd() < 0.55) {
      for (let j = -1; j <= 1; j++) pickups.push({ x, y: 1.3 + (1 - Math.abs(j)) * 1.1, s: at + j * 2.2 }); // arco: premio por saltar
    } else if (rnd() < 0.8) {
      const px = kind === 'barricade' ? -Math.sign(x) * CHASE.lane : (((lane + 1 + Math.floor(rnd() * 2)) % 3) - 1) * CHASE.lane;
      for (let j = 0; j < 5; j++) pickups.push({ x: px, y: 1, s: at - 6 + j * 2.4 });
    }
  }
  return { obstacles, pickups };
}

export function createChase({ game, input, audio, assets, renderer, banner, updateHud, pause, POWER, onCaught, onDown }) {
  let cur = null;

  function start() {
    if (cur) return;
    const T = THREE, hero = game.hero, isM = game.heroId === 'marine', pre = 'chase_' + (isM ? 'marine' : 'douge');
    const L = (h) => new T.Color(h).convertSRGBToLinear();
    const own = [], keep = (o) => (own.push(o), o);
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 400);
    scene.background = L('#a6b2e5');
    scene.fog = new T.Fog(L('#d9a7b4'), 50, 172);
    scene.add(new T.HemisphereLight(0xfff0dc, 0x5c4a7a, 1.05));
    const sun = new T.DirectionalLight(0xffd2a0, 0.9); sun.position.set(-4, 10, -6); scene.add(sun);
    const ROAD = 5.2, WALK = 4.4, FX = ROAD + WALK + 0.3, LEN = CHASE.length;
    const mk = (geo, mat) => { const m = new T.Mesh(keep(geo), keep(mat)); scene.add(m); return m; };
    const canvasTex = (w, h, draw, rx, ry) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = keep(new T.CanvasTexture(c)); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
    };
    // Adoquines y veredas (texturas hechas por código, se deslizan con el avance)
    const cobble = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#5d5878'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) {
        const x = c * 52 + (r % 2 ? 26 : 0), y = r * 32;
        g.fillStyle = `hsl(${235 + Math.random() * 25},${12 + Math.random() * 10}%,${48 + Math.random() * 26}%)`;
        g.beginPath(); g.roundRect ? g.roundRect(x - 24, y + 3, 48, 27, 7) : g.rect(x - 24, y + 3, 48, 27); g.fill();
        g.fillStyle = 'rgba(255,220,190,.10)'; g.fillRect(x - 20, y + 5, 40, 5);
      }
    }, 3, 46);
    const walkTex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#cdb7a4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8917f'; g.lineWidth = 3;
      for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); }
    }, 2, 40);
    const road = mk(new T.PlaneGeometry(ROAD * 2, 260), new T.MeshLambertMaterial({ map: cobble })); road.rotation.x = -Math.PI / 2;
    const walks = [-1, 1].map(sd => { const m = mk(new T.PlaneGeometry(WALK, 260), new T.MeshLambertMaterial({ map: walkTex })); m.rotation.x = -Math.PI / 2; m.position.set(sd * (ROAD + WALK / 2), 0.12, 0); return m; });
    const curbs = [-1, 1].map(sd => { const m = mk(new T.BoxGeometry(0.35, 0.24, 260), new T.MeshLambertMaterial({ color: L('#e6d6c6') })); m.position.set(sd * ROAD, 0.1, 0); return m; });
    // Fondo con la Torre Eiffel: sigue a la cámara, así nunca se llega
    const fondo = assets.meta('chase_paris_fondo'), BW = 260, BH = BW * fondo.h / fondo.w;
    const back = mk(new T.PlaneGeometry(BW, BH), new T.MeshBasicMaterial({ map: assets.texture('chase_paris_fondo'), fog: false }));
    // Fachadas de los locales de Francia, recicladas a los costados
    const FAC = ['le_ble', 'henris', 'punto_de_oro', 'street_bg'].filter(k => assets.has(k));
    const facW = 13.2, facH = 8.8, facs = [];
    for (const sd of [-1, 1]) for (let i = 0; i < 14; i++) {
      const m = mk(new T.PlaneGeometry(facW, facH), new T.MeshLambertMaterial({ map: assets.texture(FAC[(i + (sd > 0 ? 2 : 0)) % FAC.length]) }));
      m.rotation.y = -sd * Math.PI / 2; m.position.set(sd * FX, facH / 2 - 0.05, -i * facW); facs.push(m);
    }
    // Árboles y faroles
    const trunkG = keep(new T.CylinderGeometry(0.16, 0.24, 2.6, 7)), leafG = keep(new T.IcosahedronGeometry(1.25, 1));
    const poleG = keep(new T.CylinderGeometry(0.07, 0.1, 3.6, 6)), bulbG = keep(new T.SphereGeometry(0.26, 10, 8));
    const trunkM = keep(new T.MeshLambertMaterial({ color: L('#6b4a33') })), leafM = keep(new T.MeshLambertMaterial({ color: L('#4f8f3a'), flatShading: true }));
    const leafM2 = keep(new T.MeshLambertMaterial({ color: L('#78b04f'), flatShading: true })), poleM = keep(new T.MeshLambertMaterial({ color: L('#262b33') }));
    const bulbM = keep(new T.MeshBasicMaterial({ color: L('#ffd98a') }));
    // Árbol pintado del kit (el mismo de Buenos Aires), si está
    const treeArt = assets.has('prop_arbol');
    const treeMeta = treeArt ? assets.meta('prop_arbol') : null;
    const treeGeo = treeArt ? keep(new T.PlaneGeometry(5 * treeMeta.w / treeMeta.h, 5).translate(0, 2.5, 0)) : null;
    const treeMat = treeArt ? keep(new T.MeshBasicMaterial({ map: assets.texture('prop_arbol'), alphaTest: 0.3, transparent: true, side: T.DoubleSide })) : null;
    const deco = [];
    for (const sd of [-1, 1]) for (let i = 0; i < 16; i++) {
      const g = new T.Group();
      if (i % 2 === 0 && treeArt) {
        const m = new T.Mesh(treeGeo, treeMat); m.scale.x = i % 4 ? -1 : 1; g.add(m);
      } else if (i % 2 === 0) {
        const tr = new T.Mesh(trunkG, trunkM); tr.position.y = 1.3;
        const l1 = new T.Mesh(leafG, leafM); l1.position.y = 3.1;
        const l2 = new T.Mesh(leafG, leafM2); l2.scale.setScalar(0.75); l2.position.set(0.5, 3.8, 0.2);
        g.add(tr, l1, l2);
      } else {
        const p = new T.Mesh(poleG, poleM); p.position.y = 1.8;
        const b = new T.Mesh(bulbG, bulbM); b.position.y = 3.7;
        g.add(p, b);
      }
      g.position.set(sd * (ROAD + 0.9), 0, -i * 9); scene.add(g); deco.push(g);
    }
    // Sprites (planos parados que miran a la cámara) con sombra redonda
    const shadowTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(20,10,40,.55)'); r.addColorStop(1, 'rgba(20,10,40,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }, 1, 1);
    const shG = keep(new T.PlaneGeometry(1, 1)); shG.rotateX(-Math.PI / 2);
    const shM = keep(new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    const unit = keep(new T.PlaneGeometry(1, 1)); unit.translate(0, 0.5, 0);
    const setTex = (m, key) => { const meta = assets.meta(key); m.material.map = assets.texture(key); m.userData.key = key; m.scale.set(m.userData.h * meta.w / meta.h, m.userData.h, 1); };
    function sprite(key, h, shadow = 1) {
      const m = new T.Mesh(unit, keep(new T.MeshBasicMaterial({ alphaTest: 0.45, side: T.DoubleSide })));
      m.userData.h = h; setTex(m, key); scene.add(m);
      if (shadow) { const s = new T.Mesh(shG, shM); s.scale.set(h * 0.8 * shadow, 1, h * 0.45 * shadow); s.renderOrder = 1; scene.add(s); m.userData.sh = s; }
      return m;
    }
    function place(m, x, y, z) {
      m.position.set(x, y, z);
      m.rotation.y = Math.atan2(cam.position.x - x, cam.position.z - z) * 0.6;
      const s = m.userData.sh; if (s) { s.position.set(x, 0.14, z); s.visible = m.visible; }
    }
    const P = sprite(pre + '_drive', 2.6), C = sprite(assets.has('chase_cepi_drive') ? 'chase_cepi_drive' : 'chase_cepi_windup', 4.1, 1.1);
    const CEPI_DRIVE = C.userData.key;
    const mark = mk(new T.RingGeometry(0.55, 0.78, 28), new T.MeshBasicMaterial({ color: L('#ff4d5e'), transparent: true, opacity: 0.85, depthWrite: false }));
    mark.rotation.x = -Math.PI / 2; mark.visible = false; mark.renderOrder = 2;
    const ball = mk(new T.SphereGeometry(0.2, 14, 10), new T.MeshLambertMaterial({ color: L('#e6f04a'), emissive: L('#6a6a00') })); ball.visible = false;
    const track = buildTrack();
    const obs = track.obstacles.map(o => ({ ...o, ...OBST[o.kind], m: sprite(OBST[o.kind].tex, OBST[o.kind].h, OBST[o.kind].slip ? 0.6 : 0.9), dead: false, vy: 0, y: 0, spin: 0 }));
    const PK = isM ? 'chase_pk_hoja' : 'chase_pk_hongo';
    const picks = track.pickups.map(p => ({ ...p, m: sprite(PK, 0.85, 0), got: false }));

    // Carteles propios: batería del BYD, aviso de saque, destello rojo y textos que flotan
    const ui = document.createElement('div'); ui.id = 'chase-ui';
    ui.innerHTML = '<div class="chase-flash"></div><div id="chase-bat"><span>BYD de Cepi</span><b><i></i></b><em>100%</em></div><div id="chase-hint" class="hidden">¡Cepi prepara el saque!</div>';
    document.body.append(ui); document.body.classList.add('chasing');
    const batI = ui.querySelector('#chase-bat i'), batE = ui.querySelector('#chase-bat em'), hintE = ui.querySelector('#chase-hint'), flash = ui.querySelector('.chase-flash');
    const pops = [];
    const pop = (x, y, z, txt, col = '#ffd36e', size = 22) => { const e = document.createElement('div'); e.className = 'pop'; e.textContent = txt; e.style.color = col; e.style.fontSize = size + 'px'; ui.append(e); pops.push({ e, v: new T.Vector3(x, y, z), t: 0 }); };
    const sfx = (n) => { try { audio.sfx(n); } catch (_) {} };

    // Estado
    let dist = 0, x = 0, y = 0, vy = 0, v = 0, t = 0, phase = 'intro', phaseT = 0, gap = 13, cx = 0;
    let dashT = 0, dashCd = 0, dashDir = 1, slipT = 0, slipDir = 1, hurtT = 0, inv = 0, holdT = 0, powT = 0, stunT = 0;
    let throwT = 3.2, windT = 0, shot = null, lastPick = 0, chain = 0;
    // Cepi maneja mirando adelante; se da vuelta para sacar y vuelve al volante (turnT = «giro» del cambio de pose)
    let cepiPose = 'drive', poseT = 0, turnT = 0, cxPrev = 0, carTilt = 0;
    const cepiTo = (pose) => {
      if (cepiPose === pose) return;
      cepiPose = pose; poseT = 0; turnT = 0.2;
      setTex(C, pose === 'drive' ? CEPI_DRIVE : pose === 'windup' ? 'chase_cepi_windup' : pose === 'throw' ? 'chase_cepi_throw' : 'chase_cepi_dead');
    };
    game.state = 'chase';
    banner('¡SE ESCAPA CEPI!', 'Se lleva la llave en su BYD. Doblá con el joystick, SALTO para saltar, 👊 rompe cosas.', 3.6);

    function hurt(txt) {
      if (inv > 0 || dashT > 0 || powT > 0) return;
      hero.hp = Math.max(0, hero.hp - 1); game.score.takeDamage(); game.combo?.reset?.();
      hurtT = 0.75; inv = 1.3; v *= 0.55; setTex(P, pre + '_hit'); sfx('hurt');
      pop(x, 2.8, -dist, txt, '#ff7c8f', 24);
      flash.style.opacity = '.45'; setTimeout(() => { flash.style.opacity = '0'; }, 120);
      if (hero.hp <= 0) { phase = 'down'; phaseT = 0; }
    }
    function charge(a) {
      const was = hero.power >= 1; hero.power = Math.min(1, hero.power + a);
      if (!was && hero.power >= 1) { pop(x, 3.2, -dist, '⚡ ¡PODER LISTO!'); sfx('pickup'); }
    }
    function usePower() {
      hero.power = 0; holdT = 0; powT = 1.3; setTex(P, pre + '_power'); sfx('power');
      banner(isM ? '¡HIEDRA!' : '¡VERDADES A LOS GRITOS!', isM ? 'La hiedra atrapa todo lo que viene.' : 'La verdad duele: todo vuela por el aire.', 2);
      for (const o of obs) if (!o.dead && o.s > dist - 2 && o.s < dist + 48) {
        o.dead = true; o.vy = isM ? 3 : 9; o.spin = isM ? 0 : 6; game.score.addBonus(80);
        pop(o.x, 2, -o.s, isM ? '🌿' : '¡VERDAD!', '#7ee0c3', 20);
      }
      if (shot) { shot = null; ball.visible = false; mark.visible = false; stunT = 1.6; gap = Math.max(6, gap - 4); game.score.addBonus(200); pop(cx, 3.4, -(dist + gap), '¡TOMÁ!', '#ffd36e', 26); }
    }
    function smashAhead() {
      for (const o of obs) {
        if (o.dead || !o.smash) continue;
        const dz = o.s - dist;
        if (dz > -0.5 && dz < 5.2 && Math.abs(o.x - x) < o.w / 2 + 1.1) {
          o.dead = true; o.vy = o.birds ? 7 : 6; o.spin = o.birds ? 0 : 8; game.score.addBonus(o.smash);
          pop(o.x, 2.2, -o.s, o.birds ? '¡CURRUCUCÚ!' : '¡PUM! +' + o.smash, '#ffd36e', 22); sfx('crate'); charge(0.08);
          return;
        }
      }
      pop(x, 2.6, -dist - 2, '👊', '#fff', 22);
    }
    function end(won) {
      const secs = t;
      dispose();
      game.time += secs;
      input.reset();
      if (won) onCaught(); else onDown();
    }

    function update(dt) {
      if (input.consume('pause')) { pause(); return; }
      t += dt; phaseT += dt;
      inv = Math.max(0, inv - dt); dashCd = Math.max(0, dashCd - dt); stunT = Math.max(0, stunT - dt);
      const mx = input.moveX, prog = dist / LEN, playing = phase === 'run' || phase === 'intro';
      if (phase === 'intro') { v = Math.min(v + dt * 9, 6); if (phaseT > 1.4) phase = 'run'; }
      else if (phase === 'run') { const top = CHASE.speed + prog * CHASE.speedGain; v += (top - v) * Math.min(1, dt * (hurtT > 0 ? 0.6 : 1.6)); }
      else if (phase === 'battery') v = Math.max(2.5, Math.min(v, (LEN - 6 - dist) * 1.7));
      else if (phase === 'down') v = Math.max(0, v - dt * 20);
      if (playing) {
        if (input.consume('jump') && y <= 0) vy = CHASE.jump;
        if (input.consume('dodge') && dashCd <= 0) { dashT = CHASE.dash.t; dashCd = CHASE.dash.cd; dashDir = Math.sign(mx) || (x > 0 ? -1 : 1); }
        if (input.pressed('attack')) { holdT += dt; if (hero.power >= 1 && holdT >= POWER.hold) usePower(); } else holdT = 0;
        if (input.consume('attack')) smashAhead();
        if (input.consume('power') && hero.power >= 1) usePower();
        let steer = mx * CHASE.steer;
        if (slipT > 0) { slipT -= dt; steer = slipDir * 7 + mx * 3; P.rotation.z = Math.sin(t * 20) * 0.25; } else P.rotation.z = 0;
        if (dashT > 0) { dashT -= dt; steer = dashDir * CHASE.dash.speed; }
        x = Math.max(-CHASE.xMax, Math.min(CHASE.xMax, x + steer * dt));
      }
      hero.holdT = holdT;
      vy -= CHASE.gravity * dt; y = Math.max(0, y + vy * dt); if (y <= 0) vy = Math.max(0, vy);
      dist = Math.min(LEN + 6, dist + v * dt);
      if (hurtT > 0) { hurtT -= dt; if (hurtT <= 0 && phase !== 'down') setTex(P, pre + '_drive'); }
      if (powT > 0) { powT -= dt; if (powT <= 0) setTex(P, pre + '_drive'); }
      if (hurtT <= 0 && powT <= 0 && phase !== 'down') { const k = y > 0.15 ? pre + '_jump' : pre + '_drive'; if (P.userData.key !== k) setTex(P, k); }

      // Obstáculos
      for (const o of obs) {
        if (o.dead) { o.y += o.vy * dt; o.vy -= 14 * dt; o.m.rotation.z += o.spin * dt; if (o.y < -4) o.m.visible = false; continue; }
        const dz = o.s - dist;
        if (phase !== 'run' || Math.abs(dz) > 0.9 || Math.abs(o.x - x) > o.w / 2 + 0.55) continue;
        if (o.low && y > o.h * 0.75) continue; // lo saltó
        if (o.slip) { if (slipT <= 0) { slipT = 1; slipDir = Math.random() < 0.5 ? -1 : 1; pop(x, 2.6, -dist, '¡RESBALÓN!', '#ffd23a', 24); sfx('fall'); } continue; }
        if (o.birds) { o.dead = true; o.vy = 7; v *= 0.7; pop(x, 2.6, -dist, '¡PALOMAS!', '#cfd8ff', 22); continue; }
        if (dashT > 0 || powT > 0 || inv > 0) continue;
        o.dead = true; o.vy = 5; o.spin = 5; hurt(o.kind === 'barricade' ? '¡LA GRÈVE!' : '¡PAF!');
      }
      // Coleccionables: hongos (Douge) u hojitas (Marine)
      for (const p of picks) {
        if (p.got || Math.abs(p.s - dist) > 1 || Math.abs(p.x - x) > 1.1 || Math.abs(p.y - (y + 1)) > 1.5) continue;
        p.got = true; p.m.visible = false;
        chain = t - lastPick < 0.6 ? chain + 1 : 0; lastPick = t;
        const pts = CHASE.pickup + chain * 10; game.score.addBonus(pts); charge(0.045);
        pop(p.x, p.y + 0.8, -p.s, '+' + pts, '#7ee0c3', 18);
        if (chain % 3 === 0) sfx('pickup');
      }
      // Cepi en su BYD: se mantiene adelante, zigzaguea y tira pelotazos a donde estabas
      if (phase === 'run') {
        const want = stunT > 0 ? 6 : 8 + Math.sin(t * 0.7) * 1.8;
        gap += (want - gap) * dt * 0.8;
        cx += (Math.sin(t * 0.55) * 2.3 - cx) * dt * 1.2;
        if (!shot && stunT <= 0 && windT <= 0) { throwT -= dt; if (throwT <= 0) { windT = CHASE.windup; hintE.classList.remove('hidden'); cepiTo('windup'); } }
        if (windT > 0) {
          windT -= dt;
          if (windT <= 0) {
            shot = { r: gap, x0: cx, x1: x, t: 0 }; ball.visible = true; cepiTo('throw'); hintE.classList.add('hidden');
            const [a, b] = CHASE.throwEvery; throwT = a + Math.random() * (b - a) - prog * 0.8; sfx('crate');
          }
        }
        if (dist >= LEN - 40) {
          phase = 'battery'; phaseT = 0; shot = null; ball.visible = false; mark.visible = false; windT = 0; hintE.classList.add('hidden');
          banner('¡SIN BATERÍA!', 'El BYD de Cepi se apaga en el cargador…', 2.6);
        }
      }
      if (shot) {
        shot.t += dt;
        const k = Math.min(1, shot.t / CHASE.ballTime), bx = shot.x0 + (shot.x1 - shot.x0) * k;
        ball.position.set(bx, 2.2 - 1.1 * k + Math.sin(Math.PI * k) * 1.4, -(dist + shot.r * (1 - k)));
        ball.rotation.x += dt * 12;
        mark.visible = true; mark.position.set(shot.x1, 0.16, -dist - 1.3); mark.scale.setScalar(1.5 - 0.6 * k); mark.material.opacity = 0.35 + 0.55 * k;
        if (k >= 1) {
          if (Math.abs(bx - x) < 1.05 && y < 1.1) {
            if (dashT > 0) { game.score.addBonus(100); charge(0.15); pop(x, 2.8, -dist, '¡ESQUIVE JUSTO!', '#7ee0c3', 24); }
            else hurt('¡PELOTAZO!');
          }
          shot = null; ball.visible = false; mark.visible = false;
        }
      }
      poseT += dt;
      if (cepiPose === 'throw' && poseT > 0.55) cepiTo('drive');
      if (cepiPose === 'windup' && windT <= 0 && !shot) cepiTo('drive');
      let carZ = -(dist + gap);
      if (phase === 'battery' || phase === 'end') {
        carZ = -LEN; cx += (0 - cx) * dt * 2;
        cepiTo('dead');
        const stopAt = LEN - 6;
        if (phase === 'battery' && dist >= stopAt - 0.5) {
          phase = 'end'; phaseT = 0; v = 0; game.score.addBonus(CHASE.catchBonus);
          pop(x, 3, -dist, '¡ALCANZASTE A CEPI! +' + CHASE.catchBonus, '#ffd36e', 26); sfx('clear');
        }
        if (dist > stopAt) dist = stopAt;
        if (phase === 'end' && phaseT > 2.2) return end(true);
      }
      if (phase === 'down' && phaseT > 1.6) return end(false);

      // Batería del BYD = cuánto falta para el cargador
      const bat = Math.max(0, Math.round(100 * (1 - dist / (LEN - 6))));
      batI.style.width = bat + '%'; batI.style.background = bat > 50 ? '#7ee0c3' : bat > 20 ? '#ffd36e' : '#ff7c8f'; batE.textContent = bat + '%';
      draw(dt, carZ);
      updateHud(dt);
    }

    function draw(dt, carZ = -(dist + gap)) {
      const pz = -dist;
      cam.position.set(x * 0.55, 4.1 + y * 0.25, pz + 7.8); cam.lookAt(x * 0.3, 1.3, pz - 12);
      cam.aspect = innerWidth / innerHeight; cam.fov = cam.aspect < 0.9 ? 74 : 58; cam.updateProjectionMatrix();
      road.position.set(0, 0, pz - 100); cobble.offset.y = dist / (260 / 46);
      for (const w of walks) w.position.z = pz - 100; walkTex.offset.y = dist / (260 / 40);
      for (const c of curbs) c.position.z = pz - 100;
      back.position.set(0, BH / 2 - 3, pz - 176);
      for (const f of facs) if (f.position.z > pz + 10) f.position.z -= 14 * facW;
      for (const g of deco) if (g.position.z > pz + 10) g.position.z -= 16 * 9;
      place(P, x, y, pz); P.userData.sh.scale.set(2 * (1 - Math.min(0.5, y * 0.15)), 1, 1.1);
      // El BYD: rebota con el empedrado, se inclina al doblar y «gira» (se aplasta un toque) cuando Cepi cambia de pose
      turnT = Math.max(0, turnT - dt);
      const lat = dt > 0 ? (cx - cxPrev) / dt : 0; cxPrev = cx;
      carTilt += (Math.max(-0.12, Math.min(0.12, -lat * 0.05)) - carTilt) * Math.min(1, dt * 6);
      const parked = cepiPose === 'dead', k = turnT / 0.2;
      const bob = parked ? 0 : Math.abs(Math.sin(t * 9)) * 0.07 + Math.sin(t * 23) * 0.015;
      place(C, cx, bob + Math.sin(Math.PI * k) * 0.25, carZ);
      const meta = assets.meta(C.userData.key), w0 = C.userData.h * meta.w / meta.h;
      C.scale.set(w0 * (1 - 0.22 * Math.sin(Math.PI * k)), C.userData.h * (1 + 0.06 * Math.sin(Math.PI * k)), 1);
      C.rotation.z = parked ? 0 : carTilt;
      for (const o of obs) if (o.m.visible) { place(o.m, o.x, o.y, -o.s); if (o.dead && o.m.userData.sh) o.m.userData.sh.visible = false; }
      for (const p of picks) if (!p.got) { place(p.m, p.x, p.y + Math.sin(t * 4 + p.s) * 0.15, -p.s); p.m.rotation.y = Math.sin(t * 3 + p.s) * 0.6; }
      for (let i = pops.length - 1; i >= 0; i--) {
        const q = pops[i]; q.t += dt; q.v.y += dt * 0.9;
        const sp = q.v.clone().project(cam);
        q.e.style.left = (sp.x + 1) / 2 * innerWidth + 'px'; q.e.style.top = (1 - sp.y) / 2 * innerHeight + 'px';
        q.e.style.opacity = String(Math.max(0, 1 - q.t / 1.1));
        if (q.t > 1.1) { q.e.remove(); pops.splice(i, 1); }
      }
    }

    function dispose() {
      ui.remove(); document.body.classList.remove('chasing');
      for (const o of own) o.dispose?.();
      cur = null;
    }

    cur = {
      update,
      render() { renderer.render(scene, cam); },
      redraw() { draw(0, phase === 'battery' || phase === 'end' ? -LEN : -(dist + gap)); },
      dispose,
      get state() { return { phase, dist, x, y, gap, cepi: cepiPose, hp: hero.hp, power: hero.power, obstacles: obs.length, pickups: picks.length, length: LEN }; }
    };
    draw(0);
  }

  return {
    start,
    get active() { return !!cur; },
    update(dt) { cur?.update(dt); },
    render() { cur?.render(); },
    dispose() { cur?.dispose(); },
    get state() { return cur?.state || null; }
  };
}
