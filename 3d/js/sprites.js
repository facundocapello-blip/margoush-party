// Personajes dibujados (las caricaturas del 2D) parados dentro del mundo 3D.
// Cada pose: { tex, frames?, cols?, rows?, cell?, h, foot } donde
//   h    = alto de la imagen relativo a heightM (las tiras de correr traen margen),
//   foot = fracción del alto donde apoyan los pies (1 = borde inferior).
import { poseHeight } from './poses.js';

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

    this.material = new THREE.MeshBasicMaterial({ color: tint, alphaTest: 0.45, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), this.material);
    this.pivot.add(this.mesh);

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

  flash(seconds) { this.flashT = seconds; }

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
    // golpe recibido: aplastamiento breve
    this.squash = Math.max(0, this.squash - dt * 6);
    const sq = Math.sin(this.squash * Math.PI) * 0.12;
    const st = this.stretch;
    this.mesh.scale.set(W * this.facing * (1 + sq - st * 0.5), H * (1 - sq + st), 1);
    this.mesh.position.y = -H * (1 - p.foot) + this.lift;
    this.mesh.position.x = this.offsetX * this.facing;
    this.mesh.rotation.z = this.lean * this.facing;
    this.shadow.scale.x = this.heightM * 0.3 * (1 - Math.min(0.5, this.lift * 0.2));
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.mesh.visible = Math.floor(this.flashT * 18) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }
  }

  dispose() {
    this.scene.remove(this.root);
    this.mesh.geometry.dispose();
    this.material.dispose();
    for (const p of Object.values(this.poses)) p.tex.dispose();
  }
}
