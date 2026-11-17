// Ranking compartido en Supabase, con respaldo local si no hay conexión.
const HEROES = ['douge', 'marine'];
const LOCAL_KEY = 'margoush3d_scores';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function sanitizeNickname(raw) {
  if (typeof raw !== 'string') return null;
  const nick = Array.from(raw.trim()).slice(0, 16).join('').trim();
  return nick ? nick : null;
}

export function createRanking({ url, anonKey, fetchImpl = globalThis.fetch, storage = globalThis.localStorage, timeoutMs = 6000 }) {
  const configured = Boolean(url && anonKey);

  const readLocal = () => {
    try { return JSON.parse(storage.getItem(LOCAL_KEY) || '[]'); } catch (_) { return []; }
  };
  const writeLocal = (rows) => {
    try { storage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 100))); } catch (_) { /* sin almacenamiento */ }
  };

  // El límite de tiempo cubre también la lectura del cuerpo de la respuesta
  async function request(path, opts = {}, readJson = false) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const expired = new Promise((_, rej) => ctrl.signal.addEventListener('abort', () => rej(new Error('timeout'))));
    expired.catch(() => {});
    try {
      const res = await fetchImpl(url + path, {
        ...opts,
        signal: ctrl.signal,
        // La clave "anon" clásica (JWT) va también como Bearer; la nueva "publishable" solo como apikey
        headers: { apikey: anonKey, ...(anonKey.startsWith('eyJ') ? { Authorization: 'Bearer ' + anonKey } : {}), 'Content-Type': 'application/json', ...(opts.headers || {}) }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return readJson ? await Promise.race([res.json(), expired]) : res;
    } finally {
      clearTimeout(timer);
    }
  }

  function localTop(period, limit) {
    const since = period === 'week' ? Date.now() - WEEK_MS : 0;
    return readLocal()
      .filter(r => Date.parse(r.created_at) >= since)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return {
    async submit({ nickname, hero, score }) {
      const nick = sanitizeNickname(nickname);
      if (!nick) return { ok: false, online: false, error: 'Poné un apodo.' };
      if (!HEROES.includes(hero)) return { ok: false, online: false, error: 'Héroe inválido.' };
      if (!Number.isInteger(score) || score < 0 || score > 200000) return { ok: false, online: false, error: 'Puntaje inválido.' };

      const row = { nickname: nick, hero, score };
      writeLocal([{ ...row, created_at: new Date().toISOString() }, ...readLocal()]);
      if (!configured) return { ok: true, online: false };
      try {
        await request('/rest/v1/scores', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
        return { ok: true, online: true };
      } catch (_) {
        return { ok: true, online: false };
      }
    },

    async top({ period, limit = 20 }) {
      if (!configured) return { online: false, rows: localTop(period, limit) };
      const q = new URLSearchParams({ select: 'nickname,hero,score,created_at', order: 'score.desc', limit: String(limit) });
      if (period === 'week') q.set('created_at', 'gte.' + new Date(Date.now() - WEEK_MS).toISOString());
      try {
        const rows = await request('/rest/v1/scores?' + q.toString(), { method: 'GET' }, true);
        return { online: true, rows };
      } catch (_) {
        return { online: false, rows: localTop(period, limit) };
      }
    }
  };
}
