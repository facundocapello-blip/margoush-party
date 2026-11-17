import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = new URL('../3d/assets/', import.meta.url).pathname;
const NAMES = ['douge_idle','douge_run','douge_attack','marine_idle','marine_run','marine_attack','chaky_run',
  'boss_idle','boss_run','boss_attack','boss_hurt','margot_sheet','kidnap_sheet','courier','street_bg','facu',
  'music_douge','music_marine',
  'face_secuaz_sheet','face_patovica_sheet','face_bombo_sheet','face_mozo_sheet','face_delivery_sheet',
  'pinky_sheet','cepi_sheet','lale_sheet'];

test('manifest lists every asset and each file exists', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const n of NAMES) {
    assert.ok(m[n], `missing ${n}`);
    assert.ok(fs.existsSync(path.join(dir, m[n].file)), `missing file for ${n}`);
  }
});

test('assets weigh less than 6 MB in total', () => {
  const total = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
  assert.ok(total < 6_000_000, `total ${total}`);
});

test('sheet metadata', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(m.douge_run.frames, 6);
  assert.equal(m.margot_sheet.cols, 2);
  assert.equal(m.margot_sheet.rows, 2);
});

test('run strips are clean, feet aligned and head sizes recorded', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('python3', ['-I', new URL('./check_sprites.py', import.meta.url).pathname, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
