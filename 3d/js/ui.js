import { sanitizeNickname } from './ranking.js';

const NICK_KEY = 'margoush3d_nick';
const HERO_NAME = { douge: 'Douge', marine: 'Marine' };
const OFFLINE_SAVE = 'Sin conexión: tu puntaje quedó guardado en este celular';
const OFFLINE_LIST = 'Sin conexión: mostrando los puntajes de este celular';

const el = (tag, props = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) n.append(c);
  return n;
};
const fmt = (n) => Math.round(n).toLocaleString('es-AR');

export function createUi({ ranking, assets, showScreen, onPlayAgain, onMenu, audio }) {
  const resultEl = document.querySelector('#screen-result');
  const rankEl = document.querySelector('#screen-ranking');
  let backTo = 'screen-menu';
  let period = 'all';
  let lastSaved = null;

  function readNick() { try { return localStorage.getItem(NICK_KEY) || ''; } catch (_) { return ''; } }
  function writeNick(v) { try { localStorage.setItem(NICK_KEY, v); } catch (_) {} }

  function showResult(result, heroId) {
    resultEl.replaceChildren();
    const host = el('div', { class: 'host' }, [
      el('img', { src: assets.url('facu'), alt: 'Facu' }),
      el('div', { class: 'host-bubble', text: '¡Señoras y señores, puntaje final!' })
    ]);
    const title = el('h2', { text: result.won ? '¡MARGOT ESTÁ A SALVO!' : '¡Margot te sigue esperando!' });
    const rank = el('div', { id: 'result-rank', class: 'rank rank-' + result.rank, text: result.rank });
    const total = el('div', { id: 'result-total', class: 'total', text: '0' });
    const b = result.breakdown;
    const rows = el('div', { class: 'breakdown' }, [
      el('span', { text: 'Pelea y objetos' }), el('b', { text: fmt(b.play) }),
      el('span', { text: 'Bonus por vida' }), el('b', { text: fmt(b.hpBonus) }),
      el('span', { text: 'Bonus por tiempo' }), el('b', { text: fmt(b.timeBonus) })
    ]);
    const nick = el('input', { id: 'nick', type: 'text', maxlength: '24', placeholder: 'Tu apodo', autocomplete: 'off', enterkeyhint: 'done' });
    nick.value = readNick();
    const save = el('button', { id: 'btn-save', class: 'big-btn', text: 'Guardar puntaje' });
    const status = el('p', { id: 'save-status', class: 'status', role: 'status' });
    const again = el('button', { id: 'btn-again', class: 'big-btn alt', text: 'Jugar de nuevo' });
    const toRank = el('button', { id: 'btn-show-ranking', class: 'ghost-btn', text: '🏆 Ver ranking' });
    const menu = el('button', { id: 'btn-result-menu', class: 'ghost-btn', text: 'Menú' });

    let saving = false;
    save.addEventListener('click', async () => {
      if (saving) return;
      const clean = sanitizeNickname(nick.value);
      if (!clean) { status.textContent = 'Poné un apodo para entrar al ranking.'; nick.focus(); return; }
      saving = true;
      save.disabled = true;
      save.textContent = 'Guardando…';
      writeNick(clean);
      const res = await ranking.submit({ nickname: clean, hero: heroId, score: result.total });
      if (!res.ok) {
        saving = false; save.disabled = false; save.textContent = 'Guardar puntaje';
        status.textContent = res.error || 'No se pudo guardar.';
        return;
      }
      lastSaved = { nickname: clean, score: result.total };
      save.textContent = res.online ? '¡Guardado!' : 'Guardado en el celular';
      status.textContent = res.online ? '¡Listo! Ya estás en el ranking de la familia.' : OFFLINE_SAVE;
    });
    nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') save.click(); e.stopPropagation(); });
    again.addEventListener('click', onPlayAgain);
    toRank.addEventListener('click', () => showRanking('screen-result'));
    menu.addEventListener('click', onMenu);

    const card = el('div', { class: 'result-card' }, [
      title,
      el('div', { class: 'score-row' }, [rank, el('div', {}, [el('small', { text: 'PUNTAJE' }), total])]),
      rows,
      el('div', { class: 'save-row' }, [nick, save]),
      status,
      el('div', { class: 'btn-row' }, [again, toRank, menu])
    ]);
    resultEl.append(el('div', { class: 'result-wrap' }, [host, card]));
    showScreen('screen-result');

    // El puntaje sube contando
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / dur);
      total.textContent = fmt(result.total * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
      else { rank.classList.add('stamp'); audio?.sfx('clear'); }
    };
    requestAnimationFrame(tick);
  }

  async function showRanking(from = 'screen-menu') {
    backTo = from;
    rankEl.replaceChildren();
    const tabs = el('div', { class: 'tabs' }, [
      el('button', { id: 'tab-week', class: 'tab', text: 'Esta semana' }),
      el('button', { id: 'tab-all', class: 'tab', text: 'Histórico' })
    ]);
    const status = el('p', { id: 'rank-status', class: 'status', text: 'Cargando…' });
    const table = el('table', { id: 'rank-table' }, [
      el('thead', {}, el('tr', {}, ['#', 'Apodo', 'Héroe', 'Puntaje', 'Fecha'].map(t => el('th', { text: t })))),
      el('tbody')
    ]);
    const back = el('button', { id: 'btn-rank-back', class: 'big-btn', text: 'Volver' });
    back.addEventListener('click', () => showScreen(backTo));
    rankEl.append(el('div', { class: 'rank-card' }, [el('h2', { text: '🏆 Ranking de la familia' }), tabs, status, el('div', { class: 'table-wrap' }, table), back]));
    showScreen('screen-ranking');

    const load = async (p) => {
      period = p;
      tabs.querySelector('#tab-week').classList.toggle('on', p === 'week');
      tabs.querySelector('#tab-all').classList.toggle('on', p === 'all');
      status.textContent = 'Cargando…';
      const res = await ranking.top({ period: p, limit: 20 });
      const body = table.querySelector('tbody');
      body.replaceChildren();
      res.rows.forEach((r, i) => {
        const date = new Date(r.created_at);
        const tr = el('tr', {}, [
          el('td', { text: String(i + 1) }),
          el('td', { class: 'nick', text: r.nickname }),
          el('td', { text: HERO_NAME[r.hero] || r.hero }),
          el('td', { class: 'pts', text: fmt(r.score) }),
          el('td', { text: isNaN(date) ? '' : date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) })
        ]);
        if (lastSaved && r.nickname === lastSaved.nickname && r.score === lastSaved.score) tr.className = 'me';
        body.append(tr);
      });
      if (!res.rows.length) body.append(el('tr', {}, el('td', { colspan: '5', class: 'empty', text: 'Todavía no hay puntajes. ¡Sé el primero!' })));
      status.textContent = res.online ? 'Ranking en línea' : OFFLINE_LIST;
      status.classList.toggle('off', !res.online);
    };
    tabs.querySelector('#tab-week').addEventListener('click', () => load('week'));
    tabs.querySelector('#tab-all').addEventListener('click', () => load('all'));
    await load(period);
  }

  return { showResult, showRanking };
}
