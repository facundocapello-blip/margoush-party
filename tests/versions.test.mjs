import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stampedHtml } from '../tools/stamp_versions.mjs';

// Si falla: correr «node tools/stamp_versions.mjs» antes de subir (si no, Safari puede mezclar versiones y congelarse)
test('3d/index.html has up-to-date version stamps for every js and the css', () => {
  const html = fs.readFileSync(new URL('../3d/index.html', import.meta.url), 'utf8');
  assert.equal(html, stampedHtml(html), 'correr: node tools/stamp_versions.mjs');
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /js\/main\.js\?v=[0-9a-f]{10}/);
});
