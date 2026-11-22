import { sanitizeNickname } from './ranking.js';
import { fillText, tr } from './i18n.js';

const NICK_KEY = 'margoush3d_nick';
const HERO_NAME = { douge: 'Douge', marine: 'Marine' };
const OFFLINE_SAVE = 'Sin conexión: tu puntaje quedó guardado en este celular';
const OFFLINE_LIST = 'Sin conexión: mostrando los puntajes de este celular';

const el = (tag, props = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'text') fillText(n, v);
    else if (k === 'placeholder' || k === 'alt' || k === 'aria-label') n.setAttribute(k, tr(v));
    else if (k === 'class') n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) n.append(c);
  return n;
};
// Si perdiste, aparece Cepi «el Niño», el hermano, enojadísimo y tirando trompadas
export const CEPI_LINES = ['¡¿Perdiste?! ¡No te lo puedo creer!', '¡Dale, que es fácil, che!', '¡Andá a jugar a la bolita!', '¡Hasta Margot lo hacía mejor!'];
const fmt = (n) => Math.round(n).toLocaleString('es-AR');

export function createUi({ ranking, assets, showScreen, onPlayAgain, onMenu, audio }) {
  const resultEl = document.querySelector('#screen-result');
  const rankEl = document.querySelector('#screen-ranking');
  let backTo = 'screen-menu';
  let period = 'all';
  let lastSaved = null;

  function readNick() { try { return localStorage.getItem(NICK_KEY) || ''; } catch (_) { return ''; } }
  function writeNick(v) { try { localStorage.setItem(NICK_KEY, v); } catch (_) {} }

  // retry: { label, onRetry } si hay un checkpoint para volver a intentar ese tramo
  function showResult(result, heroId, retry = null) {
    resultEl.replaceChildren();
    const cepiSheet = assets.has?.('cepi_sheet');
    const winKey = 'arena_' + (heroId === 'marine' ? 'marine' : 'douge') + '_victory';
    const host = result.won
      ? (assets.exists?.(winKey)
        ? el('div', { class: 'host victory' }, [el('img', { src: assets.url(winKey), alt: 'Victoria' })])
        : null)
      : el('div', { id: 'cepi', class: 'host cepi' + (cepiSheet ? '' : ' no-sheet') }, [
        cepiSheet
          ? el('div', { class: 'cepi-sprite', role: 'img', 'aria-label': 'Cepi, enojado', style: `background-image:url("${assets.url('cepi_sheet')}")` })
          : el('img', { src: assets.url('courier'), alt: 'Cepi, enojado' }),
        el('div', { class: 'host-bubble', text: CEPI_LINES[Math.floor(Math.random() * CEPI_LINES.length)] })
      ]);
    if (!result.won) audio?.sfx('boo');
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
    const again = el('button', { id: 'btn-again', class: retry ? 'ghost-btn' : 'big-btn alt', text: retry ? 'Empezar de cero' : 'Jugar de nuevo' });
    const retryBtn = retry ? el('button', { id: 'btn-retry', class: 'big-btn alt retry', text: '🔁 Reintentar: ' + retry.label }) : null;
    retryBtn?.addEventListener('click', retry.onRetry);
    const toRank = el('button', { id: 'btn-show-ranking', class: 'ghost-btn', text: '🏆 Ver ranking' });
    const menu = el('button', { id: 'btn-result-menu', class: 'ghost-btn', text: 'Menú' });

    // Sin puntos no hay nada para guardar
    if (result.total <= 0) { save.disabled = true; save.textContent = tr('Sin puntos todavía'); nick.disabled = true; }
    let saving = false;
    save.addEventListener('click', async () => {
      if (saving) return;
      const clean = sanitizeNickname(nick.value);
      if (!clean) { status.textContent = tr('Poné un apodo para entrar al ranking.'); nick.focus(); return; }
      saving = true;
      save.disabled = true;
      save.textContent = tr('Guardando…');
      writeNick(clean);
      const res = await ranking.submit({ nickname: clean, hero: heroId, score: result.total });
      if (!res.ok) {
        saving = false; save.disabled = false; save.textContent = tr('Guardar puntaje');
        status.textContent = tr(res.error || 'No se pudo guardar.');
        return;
      }
      lastSaved = { nickname: clean, score: result.total };
      save.textContent = tr(res.online ? '¡Guardado!' : 'Guardado en el celular');
      status.textContent = tr(res.online ? '¡Listo! Ya estás en el ranking de la familia.' : OFFLINE_SAVE);
    });
    nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') save.click(); e.stopPropagation(); });
    again.addEventListener('click', onPlayAgain);
    toRank.addEventListener('click', () => showRanking('screen-result'));
    menu.addEventListener('click', onMenu);

    // Foto familiar del rescate (si ganaste): usa la foto del rescate o el arte de Grupo E (`arena_familia_festejo`)
    let photoRow = null;
    const winPhoto = result.photo || (result.won && assets.exists?.('arena_familia_festejo') ? assets.url('arena_familia_festejo') : null);
    if (result.won && winPhoto) {
      const shareBtn = el('button', { id: 'btn-photo', class: 'ghost-btn', text: '📸 Guardar la foto' });
      shareBtn.addEventListener('click', async () => {
        try {
          const blob = await (await fetch(winPhoto)).blob();
          const file = new File([blob], 'margoush-foto-familiar.jpg', { type: 'image/jpeg' });
          if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'MARGOUSH: ¡Margot está a salvo!' }); return; }
        } catch (_) {}
        const a = el('a', { href: winPhoto, download: 'margoush-foto-familiar.jpg' });
        document.body.append(a); a.click(); a.remove();
      });
      photoRow = el('div', { class: 'photo-row' }, [el('img', { id: 'result-photo', src: winPhoto, alt: 'Foto familiar del rescate' }), shareBtn]);
    }

    const card = el('div', { class: 'result-card' }, [
      title,
      photoRow,
      el('div', { class: 'score-row' }, [rank, el('div', {}, [el('small', { text: 'PUNTAJE' }), total])]),
      rows,
      el('div', { class: 'save-row' }, [nick, save]),
      status,
      retryBtn,
      el('div', { class: 'btn-row' }, [again, toRank, menu])
    ]);
    resultEl.append(el('div', { class: 'result-wrap' }, host ? [host, card] : [card]));
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
      status.textContent = tr('Cargando…');
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
      status.textContent = tr(res.online ? 'Ranking en línea' : OFFLINE_LIST);
      status.classList.toggle('off', !res.online);
    };
    tabs.querySelector('#tab-week').addEventListener('click', () => load('week'));
    tabs.querySelector('#tab-all').addEventListener('click', () => load('all'));
    await load(period);
  }

  return { showResult, showRanking };
}
