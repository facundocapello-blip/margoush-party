// Personajes dibujados (las caricaturas del 2D) parados dentro del mundo 3D.
// Cada pose: { tex, frames?, cols?, rows?, cell?, h, foot } donde
//   h    = alto de la imagen relativo a heightM (las tiras de correr traen margen),
//   foot = fracción del alto donde apoyan los pies (1 = borde inferior).
import { vibeOffset } from './feedback.js';
import { poseHeight, CROSSFADE, poseImpulseKind, poseScaleBlend } from './poses.js';

const TILT = -0.32; // inclina la figura hacia la cámara (estilo Paper Mario)
const shadowGeo = new THREE.CircleGeometry(1, 20);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });

export class SpriteActor {
  // scaleRef: pose de referencia (p. ej. 'douge_idle'); las demás se escalan para que la cabeza mida igual
  constructor(scene, assets, { poses, heightM, tint = 0xffffff, shadow = 0.55, scaleRef = null }) {
    this.scene = scene;
    this.heightM = heightM;
    this.poses = {};
    this.facing = 1;
    this.pose = null;
    this.frame = 0;
    this.dist = 0;
    this.flashT = 0;
    this.squash = 0;
    this.snapHit = false; // calle: golpe recibido con aplastamiento máximo desde el 1.er cuadro y sin fundido a «hurt»
    this.fadeT = 0;
    this.flashGrace = 0; // al principio del parpadeo se queda visible (que se vea la pose «hurt»)
    this.flashTotal = 0;
    this.vibT = 0; this.vibTotal = 0; this.vibAmp = 0; this.vibStamp = 0;
    this.prevW = 0;
    this.prevH = 0;
    this.impT = 0;
    this.impSign = 0;
    this.landT = 0;
    this.wasAir = false;
    this.lift = 0; // altura sobre el piso (saltos)
    this.lean = 0; // inclinación (radianes, + = hacia atrás del personaje)
    this.offsetX = 0; // corrimiento hacia adelante del personaje (m)
    this.stretch = 0; // estirón (+) o aplastamiento (−) momentáneo
    this.root = new THREE.Group();
    this.position = this.root.position;

    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.shadow.scale.set(heightM * shadow * 0.55, heightM * shadow * 0.3, 1);
    this.root.add(this.shadow);

    this.pivot = new THREE.Group(); // pies en el origen
    this.pivot.rotation.x = TILT;
    this.root.add(this.pivot);

    const planeGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    this.material = new THREE.MeshBasicMaterial({ color: tint, alphaTest: 0.45, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(planeGeo, this.material);
    this.ghostMat = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0, alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide });
    this.ghostMesh = new THREE.Mesh(planeGeo, this.ghostMat);
    this.ghostMesh.visible = false;
    this.pivot.add(this.ghostMesh, this.mesh);

    for (const [name, p] of Object.entries(poses)) {
      const meta = assets.meta(p.tex);
      const cols = p.cols || meta.cols || 1;
      const rows = p.rows || meta.rows || 1;
      const tex = assets.texture(p.tex).clone();
      tex.needsUpdate = true;
      tex.repeat.set(1 / cols, 1 / rows);
      const cellW = meta.w / cols, cellH = meta.h / rows;
      this.poses[name] = {
        tex, cols, rows,
        frames: p.frames || meta.frames || 1,
        cell: p.cell ?? null,
        aspect: cellW / cellH,
        h: p.h ?? (scaleRef ? poseHeight(assets.manifest, p.tex, scaleRef) : 1),
        foot: p.foot ?? meta.foot ?? 1,
        stride: p.stride ?? 0.5
      };
    }
    this.setPose(Object.keys(poses)[0]);
    scene.add(this.root);
  }

  setPose(name) {
    if (this.pose === name || !this.poses[name]) return;
    if (this.pose && this.poses[this.pose] && !(this.snapHit && name === 'hurt')) {
      const prev = this.poses[this.pose];
      const prevH = this.heightM * prev.h;
      this.prevW = prevH * prev.aspect;
      this.prevH = prevH;
      this.fadeT = CROSSFADE;
      const kind = poseImpulseKind(name);
      if (kind !== 0) { this.impT = 1; this.impSign = kind; }
      this.ghostMat.map = this.material.map;
      this.ghostMat.opacity = 0.78;
      this.ghostMat.needsUpdate = true;
      this.ghostMesh.scale.copy(this.mesh.scale);
      this.ghostMesh.position.copy(this.mesh.position);
      this.ghostMesh.position.z = -0.012;
      this.ghostMesh.rotation.copy(this.mesh.rotation);
      this.ghostMesh.visible = true;
    } else if (this.snapHit && name === 'hurt') this.fadeT = 0;
    this.pose = name;
    this.frame = 0;
    this.dist = 0;
    const p = this.poses[name];
    this.material.map = p.tex;
    this.material.needsUpdate = true;
    this._applyFrame();
  }

  setFacing(dir) {
    if (dir === 1 || dir === -1) this.facing = dir;
  }

  setFrame(i) {
    this.frame = i;
    this._applyFrame();
  }

  // grace: segundos iniciales SIN parpadeo (si no, el parpadeo esconde la pose de golpe justo cuando importa)
  flash(seconds, grace = 0) { this.flashT = seconds; this.flashTotal = seconds; this.flashGrace = grace; }

  // Vibración del dibujo durante el hit-stop (la lógica y la hitbox no se mueven). La arranca el golpe y la
  // avanza `vibeStep` solo mientras el juego está congelado.
  vibrate(seconds, amp = 0.07) {
    this.vibT = seconds; this.vibTotal = seconds; this.vibAmp = amp; this.vibStamp = performance.now();
  }
  vibeStep(dt) {
    if (this.vibT <= 0 || performance.now() - this.vibStamp > 600) { this.vibT = 0; return; }
    this.vibT = Math.max(0, this.vibT - dt);
    const dx = vibeOffset(this.vibTotal - this.vibT, this.vibTotal, this.vibAmp);
    this.mesh.position.x = this.offsetX * this.facing + dx;
    if (this.ghostMesh.visible) this.ghostMesh.position.x = this.mesh.position.x; // el fantasma del fundido acompaña
  }

  hit() { this.squash = 1; }

  _applyFrame() {
    const p = this.poses[this.pose];
    const idx = p.cell ?? (this.frame % p.frames);
    const c = idx % p.cols;
    const r = Math.floor(idx / p.cols);
    p.tex.offset.set(c / p.cols, 1 - (r + 1) / p.rows);
  }

  update(dt, speedMps = 0) {
    const p = this.poses[this.pose];
    if (p.frames > 1 && p.cell == null) {
      this.dist += Math.abs(speedMps) * dt;
      const f = Math.floor(this.dist / p.stride) % p.frames;
      if (f !== this.frame) { this.frame = f; this._applyFrame(); }
    }
    const H = this.heightM * p.h;
    const W = H * p.aspect;
    // Transición suave (~80 ms) + rebote al caer de un salto + squash & stretch
    const inAir = this.lift > 0.08;
    if (this.wasAir && !inAir) this.landT = 1;
    this.wasAir = inAir;
    if (this.fadeT > 0) this.fadeT = Math.max(0, this.fadeT - dt);
    if (this.impT > 0) this.impT = Math.max(0, this.impT - dt * 6.5);
    if (this.landT > 0) this.landT = Math.max(0, this.landT - dt * 6.2);
    let bw = W, bh = H, ghostOp = 0;
    if (this.fadeT > 0 || this.impT > 0 || this.landT > 0) {
      const bl = poseScaleBlend(this.prevW || W, this.prevH || H, W, H, this.fadeT, this.impT, this.impSign, this.landT);
      bw = bl.w; bh = bl.h; ghostOp = bl.ghostOpacity;
    }
    // golpe recibido: aplastamiento breve
    this.squash = Math.max(0, this.squash - dt * 6);
    // snapHit: máximo en el cuadro del golpe (queda visible durante el hit-stop) y decae en ~10F
    const sq = this.snapHit ? this.squash * 0.14 : Math.sin(this.squash * Math.PI) * 0.12;
    const st = this.stretch;
    this.mesh.scale.set(bw * this.facing * (1 + sq - st * 0.5), bh * (1 - sq + st), 1);
    this.mesh.position.y = -bh * (1 - p.foot) + this.lift;
    this.mesh.position.x = this.offsetX * this.facing;
    this.mesh.rotation.z = this.lean * this.facing;
    if (this.fadeT > 0) {
      this.ghostMat.opacity = ghostOp;
      this.ghostMesh.visible = this.mesh.visible;
    } else {
      this.ghostMesh.visible = false;
    }
    this.shadow.scale.x = this.heightM * 0.3 * (1 - Math.min(0.5, this.lift * 0.2));
    if (this.flashT > 0) {
      this.flashT -= dt;
      const blinking = this.flashTotal - this.flashT >= this.flashGrace;
      this.mesh.visible = !blinking || Math.floor(this.flashT * 18) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }
  }

  dispose() {
    this.scene.remove(this.root);
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.ghostMat.dispose();
    for (const p of Object.values(this.poses)) p.tex.dispose();
  }
}
