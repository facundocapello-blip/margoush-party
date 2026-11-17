// Carga las imágenes del manifiesto como texturas de Three.js.
export async function loadAssets(manifestUrl, onProgress = () => {}) {
  // Versión en un solo HTML (tools/build_single.mjs): el manifiesto y los archivos vienen adentro de la página
  const embed = window.__EMBED || null;
  const base = embed ? '' : new URL('.', new URL(manifestUrl, location.href)).href;
  const manifest = embed ? embed.manifest : await (await fetch(manifestUrl)).json();
  const src = (file) => (embed ? embed.files[file] : base + file);
  const loader = new THREE.TextureLoader();
  const textures = {};
  const images = Object.entries(manifest).filter(([, m]) => m.file.endsWith('.webp'));
  let done = 0;
  await Promise.all(images.map(([name, m]) => new Promise((resolve, reject) => {
    loader.load(src(m.file), (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      textures[name] = tex;
      onProgress(++done / images.length);
      resolve();
    }, undefined, () => reject(new Error('No se pudo cargar ' + m.file)));
  })));
  return {
    manifest,
    texture: (name) => textures[name],
    meta: (name) => manifest[name],
    has: (name) => !!textures[name],
    url: (name) => src(manifest[name].file),
    // Texturas hechas por código (p. ej. los malos recoloreados)
    add(name, tex, meta) { textures[name] = tex; manifest[name] = meta; }
  };
}
