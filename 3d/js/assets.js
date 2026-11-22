// Carga las imágenes del manifiesto como texturas de Three.js.
// Carga inteligente: al arrancar precarga el núcleo (calle, héroes, malos, persecución y bonus);
// los sprites pesados de cada arena de jefe (`arena_chaky_*`, `arena_cepi_*`, `arena_lale_*`,
// `arena_pinky_*`, `arena_barril`, `arena_cajon`, `arena_fondo`) se cargan bajo demanda en su cortina
// con `assets.ensure(prefixes)` para acelerar el inicio y ahorrar memoria GPU en Safari iPhone.
const DEFERRED = ['arena_chaky_', 'arena_cepi_', 'arena_lale_', 'arena_pinky_', 'arena_barril', 'arena_cajon', 'arena_fondo', 'arena_margot_'];
const isDeferred = (name) => DEFERRED.some((p) => name.startsWith(p));

export async function loadAssets(manifestUrl, onProgress = () => {}) {
  // Versión en un solo HTML (tools/build_single.mjs): el manifiesto y los archivos vienen adentro de la página
  const embed = window.__EMBED || null;
  const base = embed ? '' : new URL('.', new URL(manifestUrl, location.href)).href;
  const manifest = embed ? embed.manifest : await (await fetch(manifestUrl, { cache: 'no-cache' })).json();
  const src = (file) => (embed ? embed.files[file] : base + file);
  const loader = new THREE.TextureLoader();
  const textures = {};
  const pending = new Map();

  function loadOne(name) {
    if (textures[name]) return Promise.resolve(textures[name]);
    if (pending.has(name)) return pending.get(name);
    const m = manifest[name];
    if (!m || !m.file || !m.file.endsWith('.webp')) return Promise.resolve(null);
    const p = new Promise((resolve, reject) => {
      // `v` (hash del archivo) evita que Safari muestre una imagen vieja con las medidas nuevas
      loader.load(src(m.file) + (m.v && !embed ? '?v=' + m.v : ''), (tex) => {
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 4;
        textures[name] = tex;
        pending.delete(name);
        resolve(tex);
      }, undefined, () => { pending.delete(name); reject(new Error('No se pudo cargar ' + m.file)); });
    });
    pending.set(name, p);
    return p;
  }

  const allImages = Object.entries(manifest).filter(([, m]) => m.file.endsWith('.webp'));
  // En versión embebida de un solo archivo todo ya está en RAM; en web diferimos las arenas de jefes
  const initial = embed ? allImages : allImages.filter(([name]) => !isDeferred(name));
  let done = 0;
  await Promise.all(initial.map(([name]) => loadOne(name).then(() => onProgress(++done / Math.max(1, initial.length)))));

  async function ensure(prefixes) {
    const list = Array.isArray(prefixes) ? prefixes : [prefixes];
    const names = Object.keys(manifest).filter((n) => manifest[n]?.file?.endsWith('.webp') && list.some((p) => n.startsWith(p)));
    await Promise.all(names.map((n) => loadOne(n)));
  }

  return {
    manifest,
    texture: (name) => textures[name],
    meta: (name) => manifest[name],
    has: (name) => !!textures[name],
    exists: (name) => !!manifest[name],
    url: (name) => src(manifest[name].file) + (manifest[name]?.v && !embed ? '?v=' + manifest[name].v : ''),
    ensure,
    // Texturas hechas por código (p. ej. los malos recoloreados)
    add(name, tex, meta) { textures[name] = tex; manifest[name] = meta; }
  };
}
