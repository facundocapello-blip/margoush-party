import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TEXTOS, DICHOS, setLang, tr } from '../3d/js/i18n.js';

function extractKeys(src, blockName) {
  const m = src.match(new RegExp(`export const ${blockName} = \\{([\\s\\S]*?)\\n\\};`));
  assert.ok(m, `Bloque ${blockName} no encontrado en i18n.js`);
  const body = m[1];
  const keys = [];
  // Escanea pares clave: valor (incluso varios en una misma línea), saltando comentarios //
  const cleaned = body.replace(/(^|\s)\/\/.*$/gm, '');
  const re = /(['"])((?:\\.|(?!\1).)*)\1\s*:\s*(['"])((?:\\.|(?!\3).)*)\3/g;
  let match;
  while ((match = re.exec(cleaned))) keys.push(match[2]);
  return keys;
}

test('H-3: i18n.js no tiene claves repetidas en TEXTOS ni en DICHOS ni solapadas entre ambos', () => {
  const src = fs.readFileSync(new URL('../3d/js/i18n.js', import.meta.url), 'utf8');
  const tKeys = extractKeys(src, 'TEXTOS');
  const dKeys = extractKeys(src, 'DICHOS');

  const findDups = (arr) => {
    const seen = new Set(), dups = [];
    for (const k of arr) { if (seen.has(k)) dups.push(k); seen.add(k); }
    return dups;
  };
  const tDups = findDups(tKeys);
  const dDups = findDups(dKeys);
  const tSet = new Set(tKeys);
  const overlap = dKeys.filter(k => tSet.has(k));

  assert.deepEqual(tDups, [], `Claves repetidas en TEXTOS: ${tDups.join(', ')}`);
  assert.deepEqual(dDups, [], `Claves repetidas en DICHOS: ${dDups.join(', ')}`);
  assert.deepEqual(overlap, [], `Claves repetidas entre TEXTOS y DICHOS: ${overlap.join(', ')}`);
  assert.equal(tKeys.length, Object.keys(TEXTOS).length);
  assert.equal(dKeys.length, Object.keys(DICHOS).length);
});

test('H-1/H-2: carteles de Chaky van en TEXTOS (solo FR) y Lale mantiene el apodo MANTECOSO', () => {
  globalThis.document = globalThis.document || { documentElement: { lang: 'es' } };
  setLang('fr');
  try {
    assert.ok(Object.prototype.hasOwnProperty.call(TEXTOS, 'RONDA 1'));
    assert.ok(!Object.prototype.hasOwnProperty.call(DICHOS, 'RONDA 1'));
    assert.ok(!Object.prototype.hasOwnProperty.call(DICHOS, 'Tocá cada botón cuando baja la flecha'));
    assert.equal(tr('LALE «MANTECOSO»'), 'LALE « MANTECOSO »');
    assert.equal(tr('JEFE 3 · LALE «MANTECOSO»'), 'BOSS 3 · LALE « MANTECOSO »');
    assert.ok(!tr('¡Fue Lale… se escapó en el jet de Chaky a Le Blé, en París!').includes('à Le Blé'));
  } finally {
    setLang('es');
  }
});
