import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../3d/assets/', import.meta.url));
const NAMES = ['douge_idle','douge_run','douge_attack','marine_idle','marine_run','marine_attack','chaky_run',
  'margot_sheet','kidnap_sheet','courier','street_bg',
  'face_secuaz_sheet','face_patovica_sheet','face_bombo_sheet','face_mozo_sheet','face_delivery_sheet',
  'cepi_sheet',
  'arena_chaky_dance_idle','arena_chaky_dance_jump','arena_chaky_dance_attack','arena_chaky_dance_dodge','arena_chaky_dance_laugh',
  'arena_douge_back_idle','arena_douge_back_punch','arena_douge_back_hurt','arena_douge_back_dodge',
  'arena_marine_back_idle','arena_marine_back_punch','arena_marine_back_hurt','arena_marine_back_dodge',
  'arena_cepi_idle','arena_cepi_smash','arena_cepi_block','arena_cepi_tired','arena_cepi_stun','arena_cepi_back','arena_cepi_point','arena_cepi_cardboard','arena_cepi_ko','arena_cepi_fondo',
  'arena_lale_idle','arena_lale_throw','arena_lale_skate','arena_lale_floured','arena_lale_hurt','arena_lale_ko','arena_lale_fondo',
  'arena_pinky_wave','arena_pinky_charge','arena_pinky_reveal','arena_pinky_hurt','arena_pinky_ko','arena_pinky_fondo',
  'arena_margot_hero','arena_douge_victory','arena_marine_victory','arena_familia_festejo',
  'arena_aeropuerto_fondo','douge_dance_sheet','marine_dance_sheet',
  'monumento_maradona','monumento_zidane','roland_garros',
  'arena_fondo'];

test('manifest lists every asset and each file exists', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const n of NAMES) {
    assert.ok(m[n], `missing ${n}`);
    assert.ok(fs.existsSync(path.join(dir, m[n].file)), `missing file for ${n}`);
  }
});

test('assets weigh less than 10.0 MB in total', () => {
  // 10,0 MB con monumentos a Maradona y Zidane + Roland Garros + villanos Pixar (con carga diferida por acto/arena)
  const total = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
  assert.ok(total < 10_000_000, `total ${total}`);
});

test('sheet metadata and max texture width <= 2048 px', () => {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  assert.equal(m.douge_run.frames, 6);
  assert.equal(m.margot_sheet.cols, 2);
  assert.equal(m.margot_sheet.rows, 2);
  const tooWide = Object.entries(m).filter(([, v]) => v.w > 2048).map(([k, v]) => `${k} (${v.w}x${v.h})`);
  assert.deepEqual(tooWide, [], `sprites > 2048px de ancho: ${tooWide.join(', ')}`);
});

test('run strips are clean, feet aligned and head sizes recorded', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const script = fileURLToPath(new URL('./check_sprites.py', import.meta.url));
  const candidates = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python'];
  let r = null;
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['-I', script, dir], { encoding: 'utf8' });
    if (res.error?.code === 'ENOENT' || res.status === 9009) continue;
    r = res;
    break;
  }
  assert.ok(r, 'Python no encontrado para ejecutar check_sprites.py');
  if (r.status !== 0 && /ModuleNotFoundError: No module named '(numpy|PIL)'/.test(r.stderr || '')) {
    t.skip(`Python local sin dependencia requerida (${(r.stderr || '').trim().split(/\r?\n/).pop()})`);
    return;
  }
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
