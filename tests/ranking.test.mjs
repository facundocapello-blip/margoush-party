import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRanking, sanitizeNickname } from '../3d/js/ranking.js';

function memStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
function okFetch(log, body = []) {
  return async (url, opts = {}) => { log.push({ url, opts }); return { ok: true, status: 200, json: async () => body }; };
}
const never = (url, opts) => new Promise((_, rej) => opts.signal.addEventListener('abort', () => rej(new Error('aborted'))));

test('sanitizeNickname trims, caps at 16 and rejects blanks', () => {
  assert.equal(sanitizeNickname('  Faca  '), 'Faca');
  assert.equal(sanitizeNickname('x'.repeat(40)).length, 16);
  assert.equal(sanitizeNickname(''), null);
  assert.equal(sanitizeNickname('   '), null);
  assert.equal(sanitizeNickname('<b>x</b>'), '<b>x</b>');
  assert.equal(sanitizeNickname(undefined), null);
});

test('submit rejects invalid score or hero', async () => {
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: okFetch([]), storage: memStorage() });
  for (const score of [1.5, -1, 250000]) assert.equal((await r.submit({ nickname: 'A', hero: 'douge', score })).ok, false);
  assert.equal((await r.submit({ nickname: 'A', hero: 'chaky', score: 10 })).ok, false);
  assert.equal((await r.submit({ nickname: '  ', hero: 'douge', score: 10 })).ok, false);
});

test('submit posts to supabase with keys', async () => {
  const log = [];
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: okFetch(log), storage: memStorage() });
  const res = await r.submit({ nickname: ' Faca ', hero: 'marine', score: 1234 });
  assert.deepEqual(res, { ok: true, online: true });
  assert.equal(log[0].url, 'https://x.supabase.co/rest/v1/scores');
  assert.equal(log[0].opts.method, 'POST');
  assert.equal(log[0].opts.headers.apikey, 'k');
  assert.equal(log[0].opts.headers.Authorization, 'Bearer k');
  assert.deepEqual(JSON.parse(log[0].opts.body), { nickname: 'Faca', hero: 'marine', score: 1234 });
});

test('submit times out, stays local and reports offline', async () => {
  const storage = memStorage();
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: never, storage, timeoutMs: 30 });
  const res = await r.submit({ nickname: 'Faca', hero: 'douge', score: 500 });
  assert.deepEqual(res, { ok: true, online: false });
  const local = JSON.parse(storage.getItem('margoush3d_scores'));
  assert.equal(local[0].nickname, 'Faca');
});

test('top week builds the supabase query', async () => {
  const log = [];
  const rows = [{ nickname: 'A', hero: 'douge', score: 9, created_at: '2026-11-15T00:00:00Z' }];
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: okFetch(log, rows), storage: memStorage() });
  const before = Date.now();
  const res = await r.top({ period: 'week' });
  assert.equal(res.online, true);
  assert.deepEqual(res.rows, rows);
  const u = new URL(log[0].url);
  assert.equal(u.pathname, '/rest/v1/scores');
  assert.equal(u.searchParams.get('order'), 'score.desc');
  assert.equal(u.searchParams.get('limit'), '20');
  const since = Date.parse(u.searchParams.get('created_at').replace('gte.', ''));
  assert.ok(Math.abs(before - 7 * 864e5 - since) < 5000);
});

test('top all has no date filter', async () => {
  const log = [];
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: okFetch(log), storage: memStorage() });
  await r.top({ period: 'all' });
  assert.equal(new URL(log[0].url).searchParams.get('created_at'), null);
});

test('without config, everything is local and offline', async () => {
  const storage = memStorage();
  const r = createRanking({ url: '', anonKey: '', fetchImpl: okFetch([]), storage });
  assert.deepEqual(await r.submit({ nickname: 'B', hero: 'douge', score: 10 }), { ok: true, online: false });
  await r.submit({ nickname: 'C', hero: 'marine', score: 30 });
  const res = await r.top({ period: 'all' });
  assert.equal(res.online, false);
  assert.deepEqual(res.rows.map(x => x.nickname), ['C', 'B']);
});

test('top falls back to local rows when the request fails', async () => {
  const storage = memStorage();
  const failing = async () => ({ ok: false, status: 500, json: async () => ({}) });
  const r = createRanking({ url: 'https://x.supabase.co', anonKey: 'k', fetchImpl: failing, storage });
  await r.submit({ nickname: 'D', hero: 'douge', score: 70 });
  const res = await r.top({ period: 'all' });
  assert.equal(res.online, false);
  assert.equal(res.rows[0].nickname, 'D');
});
