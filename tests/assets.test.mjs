import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = new URL('../3d/assets/', import.meta.url).pathname;
const NAMES = ['douge_idle','douge_run','douge_attack','marine_idle','marine_run','marine_attack','chaky_run',
  'boss_idle','boss_run','boss_attack','boss_hurt','margot_sheet','kidnap_sheet','courier','street_bg',
  'music_street',
  'face_secuaz_sheet','face_patovica_sheet','face_bombo_sheet','face_mozo_sheet','face_delivery_sheet',
  'pinky_sheet','cepi_sheet','lale_sheet',
  'arena_chaky_idle','arena_chaky_throw','arena_chaky_slam','arena_chaky_hurt','arena_chaky_rage','arena_chaky_ko',
  'arena_chaky_dance_idle','arena_chaky_dance_jump','arena_chaky_dance_attack','arena_chaky_dance_dodge','arena_chaky_dance_laugh',
  'arena_douge_back_idle','arena_douge_back_run','arena_douge_back_punch','arena_douge_back_hurt','arena_douge_back_dodge',
  'arena_marine_back_idle','arena_marine_back_run','arena_marine_back_punch','arena_marine_back_hurt','arena_marine_back_dodge',
  'arena_cepi_idle','arena_cepi_smash','arena_cepi_block','arena_cepi_tired','arena_cepi_stun','arena_cepi_back','arena_cepi_point','arena_cepi_cardboard','arena_cepi_ko','arena_cepi_fondo',
  'arena_lale_idle',
  'arena_barril','arena_cajon','arena_fondo'];

test('manifest lists every asset and each file exists', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const n of NAMES) {
    assert.ok(m[n], `missing ${n}`);
    assert.ok(fs.existsSync(path.join(dir, m[n].file)), `missing file for ${n}`);
  }
});

test('assets weigh less than 9.2 MB in total', () => {
  // 9,2 MB desde el Grupo B (arena de Cepi, 10 assets); 8,5 MB desde la arena de BIG CHAKY; 7 MB desde props pintados; 6,6 MB desde la persecución
  const total = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
  assert.ok(total < 9_200_000, `total ${total}`);
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
